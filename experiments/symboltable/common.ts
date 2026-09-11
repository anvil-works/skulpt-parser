// Experimental adaptation of CPython 3.14.3 symbol-table behavior.
// See CPYTHON-LICENSE.txt and README.md for provenance and scope.
import type { Node, ScopeResult, SymbolResult, Arguments } from "./types.ts";
type Flags = {
    assigned: boolean;
    imported: boolean;
    parameter: boolean;
    referenced: boolean;
    global: boolean;
    nonlocal: boolean;
    iteration: boolean;
};
type Scope = {
    name: string;
    type: "module" | "function";
    lineno: number;
    parent: Scope | null;
    symbols: Map<string, Flags>;
    children: Scope[];
    comprehension: boolean;
    iterExpr: number;
    iterTarget: boolean;
};
const flags = (): Flags => ({
    assigned: false,
    imported: false,
    parameter: false,
    referenced: false,
    global: false,
    nonlocal: false,
    iteration: false,
});
const scope = (
    name: string,
    type: "module" | "function",
    lineno: number,
    parent: Scope | null,
    comprehension = false
): Scope => ({
    name,
    type,
    lineno,
    parent,
    symbols: new Map(),
    children: [],
    comprehension,
    iterExpr: 0,
    iterTarget: false,
});
export function syntax(message: string): never {
    throw new SyntaxError(message);
}
/** Shared binding and closure resolution; AST traversal lives in each candidate. */
export abstract class Engine {
    root = scope("top", "module", 0, null);
    current = this.root;
    abstract visit(node: Node): void;
    walk(nodes: readonly (Node | null)[]) {
        for (const node of nodes) if (node) this.visit(node);
    }
    maybe(node: Node | null | undefined) {
        if (node) this.visit(node);
    }
    symbol(name: string, at = this.current) {
        let f = at.symbols.get(name);
        if (!f) {
            f = flags();
            at.symbols.set(name, f);
        }
        return f;
    }
    bind(name: string, kind: "assigned" | "parameter" | "imported" | "referenced") {
        const f = this.symbol(name);
        if (kind === "parameter" && f.parameter) syntax(`duplicate argument '${name}' in function definition`);
        if (this.current.iterTarget) {
            if (f.global || f.nonlocal)
                syntax(`comprehension inner loop cannot rebind assignment expression target '${name}'`);
            f.iteration = true;
        }
        f[kind] = true;
    }
    directive(name: string, kind: "global" | "nonlocal") {
        const f = this.symbol(name);
        if (f.parameter) syntax(`name '${name}' is parameter and ${kind}`);
        if (f.referenced) syntax(`name '${name}' is used prior to ${kind} declaration`);
        if (f.assigned) syntax(`name '${name}' is assigned to before ${kind} declaration`);
        f[kind] = true;
        if (kind === "global") this.symbol(name, this.root).global = true;
    }
    enter(name: string, lineno: number, comprehension = false) {
        const child = scope(name, "function", lineno, this.current, comprehension);
        child.iterExpr = this.current.iterExpr;
        this.current.children.push(child);
        this.current = child;
    }
    leave() {
        this.current = this.current.parent!;
    }
    iterable(node: Node) {
        this.current.iterExpr++;
        this.visit(node);
        this.current.iterExpr--;
    }
    iterationTarget(node: Node) {
        this.current.iterTarget = true;
        this.visit(node);
        this.current.iterTarget = false;
    }
    checkArguments(args: Arguments) {
        for (const arg of [...args.posonlyargs, ...args.args, ...args.kwonlyargs, args.vararg, args.kwarg])
            if (arg?.annotation) throw new Error("Unsupported annotations in experiment");
    }
    namedTarget(node: Node) {
        if (node._type !== "Name") throw new Error("Unsupported assignment expression target");
        if (this.current.iterExpr)
            syntax("assignment expression cannot be used in a comprehension iterable expression");
        if (!this.current.comprehension) return;
        const name = node.id;
        let outer: Scope | null = this.current;
        while (outer?.comprehension) {
            const f = outer.symbols.get(name);
            if (f?.iteration && f.assigned)
                syntax(`assignment expression cannot rebind comprehension iteration variable '${name}'`);
            outer = outer.parent;
        }
        if (!outer) throw new Error("Missing enclosing scope");
        if (outer.type === "function") {
            const f = this.symbol(name, outer);
            if (f.global) {
                this.symbol(name).global = true;
                this.symbol(name, this.root).global = true;
            } else this.symbol(name).nonlocal = true;
            f.assigned = true;
        } else {
            this.symbol(name).global = true;
            this.symbol(name, outer).global = true;
        }
    }
    finish(): ScopeResult {
        return this.resolve(this.root, new Set()).result;
    }
    private resolve(at: Scope, bound: Set<string>): { result: ScopeResult; free: Set<string> } {
        const locals = new Set<string>();
        const free = new Set<string>();
        const globals = new Set<string>();
        for (const [name, f] of at.symbols) {
            if (f.global && f.nonlocal) syntax(`name '${name}' is nonlocal and global`);
            if (f.global) {
                globals.add(name);
                continue;
            }
            if (f.nonlocal) {
                if (at.type === "module") syntax("nonlocal declaration not allowed at module level");
                if (!bound.has(name)) syntax(`no binding for nonlocal '${name}' found`);
                free.add(name);
                continue;
            }
            if (f.assigned || f.parameter || f.imported) locals.add(name);
            else if (bound.has(name)) free.add(name);
        }
        const childBound = new Set(bound);
        if (at.type === "function") for (const name of locals) childBound.add(name);
        for (const name of globals) childBound.delete(name);
        const children: ScopeResult[] = [];
        for (const child of at.children) {
            const result = this.resolve(child, childBound);
            children.push(result.result);
            for (const name of result.free) {
                if (at.type === "function" && !locals.has(name) && !globals.has(name)) {
                    free.add(name);
                    this.symbol(name, at);
                }
            }
        }
        const symbols: SymbolResult[] = [];
        for (const [name, f] of at.symbols)
            symbols.push({
                name,
                local: at.type === "module" ? f.assigned || f.parameter || f.imported : locals.has(name),
                global: at.type === "module" || f.global || (!locals.has(name) && !free.has(name)),
                free: free.has(name),
                parameter: f.parameter,
                referenced: f.referenced,
                assigned: f.assigned,
                imported: f.imported,
                nonlocal: f.nonlocal,
                declared_global: f.global,
            });
        symbols.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
        return { result: { name: at.name, type: at.type, lineno: at.lineno, symbols, children }, free };
    }
}

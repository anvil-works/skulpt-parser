// Experimental adaptation of CPython 3.14.3 symbol-table behavior.
// See CPYTHON-LICENSE.txt and README.md for provenance and scope.
/** Same semantic blocks as the other candidate; only dispatch organization differs. */
import { Engine, syntax } from "./common.ts";
import { exhaustive } from "./types.ts";
import type { Node, ScopeResult } from "./types.ts";
export class SwitchAnalyzer extends Engine {
    visit(node: Node): void {
        switch (node._type) {
            case "Module": {
                this.walk(node.body);
                return;
            }
            case "FunctionDef": {
                if (node.returns || node.type_params?.length)
                    throw new Error("Unsupported annotations or type parameters in experiment");
                this.checkArguments(node.args);
                this.bind(node.name, "assigned");
                this.walk(node.args.defaults);
                this.walk(node.args.kw_defaults);
                this.walk(node.decorator_list);
                this.enter(node.name, node.lineno!);
                this.visit(node.args);
                this.walk(node.body);
                this.leave();
                return;
            }
            case "Lambda": {
                this.checkArguments(node.args);
                this.walk(node.args.defaults);
                this.walk(node.args.kw_defaults);
                this.enter("lambda", node.lineno!);
                this.visit(node.args);
                this.visit(node.body);
                this.leave();
                return;
            }
            case "arguments": {
                this.walk(node.posonlyargs);
                this.walk(node.args);
                this.maybe(node.vararg);
                this.walk(node.kwonlyargs);
                this.maybe(node.kwarg);
                return;
            }
            case "arg": {
                if (node.annotation) throw new Error("Unsupported annotations in experiment");
                this.bind(node.arg, "parameter");
                return;
            }
            case "Return": {
                this.maybe(node.value);
                return;
            }
            case "Assign": {
                this.walk(node.targets);
                this.visit(node.value);
                return;
            }
            case "Name": {
                this.bind(node.id, node.ctx._type === "Load" ? "referenced" : "assigned");
                return;
            }
            case "Constant": {
                // Literal values carry no symbol references.
                return;
            }
            case "Expr": {
                this.visit(node.value);
                return;
            }
            case "BinOp": {
                this.visit(node.left);
                this.visit(node.right);
                return;
            }
            case "BoolOp": {
                this.walk(node.values);
                return;
            }
            case "Compare": {
                this.visit(node.left);
                this.walk(node.comparators);
                return;
            }
            case "UnaryOp": {
                this.visit(node.operand);
                return;
            }
            case "Call": {
                this.visit(node.func);
                this.walk(node.args);
                this.walk(node.keywords);
                return;
            }
            case "keyword": {
                this.visit(node.value);
                return;
            }
            case "Attribute": {
                this.visit(node.value);
                return;
            }
            case "Subscript": {
                this.visit(node.value);
                this.visit(node.slice);
                return;
            }
            case "Tuple": {
                this.walk(node.elts);
                return;
            }
            case "List": {
                this.walk(node.elts);
                return;
            }
            case "Dict": {
                this.walk(node.keys);
                this.walk(node.values);
                return;
            }
            case "Set": {
                this.walk(node.elts);
                return;
            }
            case "If": {
                this.visit(node.test);
                this.walk(node.body);
                this.walk(node.orelse);
                return;
            }
            case "For": {
                this.visit(node.target);
                this.visit(node.iter);
                this.walk(node.body);
                this.walk(node.orelse);
                return;
            }
            case "Global": {
                for (const name of node.names) this.directive(name, "global");
                return;
            }
            case "Nonlocal": {
                for (const name of node.names) this.directive(name, "nonlocal");
                return;
            }
            case "Import": {
                this.walk(node.names);
                return;
            }
            case "ImportFrom": {
                this.walk(node.names);
                return;
            }
            case "alias": {
                if (node.name === "*") {
                    if (this.current.type !== "module") syntax("import * only allowed at module level");
                } else this.bind(node.asname ?? node.name.split(".")[0], "imported");
                return;
            }
            case "Pass": {
                // No bindings.
                return;
            }
            case "GeneratorExp": {
                const first = node.generators[0];
                if (first.is_async) throw new Error("Unsupported asynchronous comprehension in experiment");
                this.iterable(first.iter);
                this.enter("genexpr", node.lineno!, true);
                this.bind(".0", "parameter");
                this.iterationTarget(first.target);
                this.walk(first.ifs);
                this.walk(node.generators.slice(1));
                this.visit(node.elt);
                this.leave();
                return;
            }
            case "comprehension": {
                if (node.is_async) throw new Error("Unsupported asynchronous comprehension in experiment");
                this.iterationTarget(node.target);
                this.iterable(node.iter);
                this.walk(node.ifs);
                return;
            }
            case "NamedExpr": {
                this.namedTarget(node.target);
                this.visit(node.value);
                this.visit(node.target);
                return;
            }
            default:
                exhaustive(node);
        }
    }
}
export function analyze(ast: Node): ScopeResult {
    const analyzer = new SwitchAnalyzer();
    analyzer.visit(ast);
    return analyzer.finish();
}

/** Explicit AST slice used by both organization experiments. */
type At = { lineno?: number; col_offset?: number };
type Fields = {
    Module: { body: Node[] };
    FunctionDef: {
        name: string;
        args: Arguments;
        body: Node[];
        decorator_list: Node[];
        returns: Node | null;
        type_params?: Node[];
    };
    Lambda: { args: Arguments; body: Node };
    arguments: {
        posonlyargs: Arg[];
        args: Arg[];
        vararg: Arg | null;
        kwonlyargs: Arg[];
        kw_defaults: (Node | null)[];
        kwarg: Arg | null;
        defaults: Node[];
    };
    arg: { arg: string; annotation: Node | null };
    Return: { value: Node | null };
    Assign: { targets: Node[]; value: Node };
    Name: { id: string; ctx: { _type: string } };
    Constant: { value: unknown };
    Expr: { value: Node };
    BinOp: { left: Node; right: Node };
    BoolOp: { values: Node[] };
    Compare: { left: Node; comparators: Node[] };
    UnaryOp: { operand: Node };
    Call: { func: Node; args: Node[]; keywords: Node[] };
    keyword: { arg: string | null; value: Node };
    Attribute: { value: Node };
    Subscript: { value: Node; slice: Node };
    Tuple: { elts: Node[] };
    List: { elts: Node[] };
    Dict: { keys: (Node | null)[]; values: Node[] };
    Set: { elts: Node[] };
    If: { test: Node; body: Node[]; orelse: Node[] };
    For: { target: Node; iter: Node; body: Node[]; orelse: Node[] };
    Global: { names: string[] };
    Nonlocal: { names: string[] };
    Import: { names: Node[] };
    ImportFrom: { module: string | null; names: Node[] };
    alias: { name: string; asname: string | null };
    Pass: {};
    GeneratorExp: { elt: Node; generators: Comprehension[] };
    comprehension: { target: Node; iter: Node; ifs: Node[]; is_async: number };
    NamedExpr: { target: Node; value: Node };
};
export type Kind = keyof Fields;
export type Node = { [K in Kind]: At & { _type: K } & Fields[K] }[Kind];
export type Of<K extends Kind> = Extract<Node, { _type: K }>;
export type Arguments = Of<"arguments">;
export type Arg = Of<"arg">;
export type Comprehension = Of<"comprehension">;
export type VisitorContract = { [K in Kind as `visit_${K}`]: (node: Of<K>) => void };
export type SymbolResult = {
    name: string;
    local: boolean;
    global: boolean;
    free: boolean;
    parameter: boolean;
    referenced: boolean;
    assigned: boolean;
    imported: boolean;
    nonlocal: boolean;
    declared_global: boolean;
};
export type ScopeResult = {
    name: string;
    type: "module" | "function";
    lineno: number;
    symbols: SymbolResult[];
    children: ScopeResult[];
};
export function unsupported(node: { _type: string }): never {
    throw new Error(`Unsupported AST node in experiment: ${node._type}`);
}
export function exhaustive(node: never): never {
    return unsupported(node);
}

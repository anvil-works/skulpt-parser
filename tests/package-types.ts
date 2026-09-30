import { parseExpression, parseModule } from "@anvil-works/skulpt-parser";
import { parseModule as parseCoreModule } from "@anvil-works/skulpt-parser/core";
import type {
    AST,
    Module,
    Expression,
    expr,
    stmt,
    Constant,
    ScalarConstant,
    CompatibilityAST,
    CompatibilityModule,
    CompatibilityStatement,
} from "@anvil-works/skulpt-parser";
import type { AST as CoreAST, Module as CoreModule } from "@anvil-works/skulpt-parser/core";

const module: Module = parseModule("answer = 42");
const coreModule: CoreModule = parseCoreModule("answer = 42");
const tree: AST = module;
const coreTree: CoreAST = coreModule;
const expression: Expression = parseExpression("answer + 1");
const body: expr = expression.body;
const statements: stmt[] = module.body;
const explicitStrict: Module = parseCoreModule("pass", { pythonVersion: 3 });
// @ts-expect-error Only the supported language modes are accepted.
parseModule("pass", { pythonVersion: 4 });
// @ts-expect-error Language mode is a version, not a boolean.
parseModule("pass", { pythonVersion: true });
// @ts-expect-error Callers must migrate the old prerelease option name.
parseModule("pass", { python2Compat: true });
parseExpression('"\\N{SNOWMAN}"', { resolveUnicodeName: (name) => (name === "SNOWMAN" ? 0x2603 : undefined) });

if (body._type === "Name") {
    const identifier: string = body.id;
    // @ts-expect-error A name's identifier is a string, not a Skulpt runtime object.
    body.id.v;
}
if (body._type === "Constant") {
    const constant: Constant = body;
    const scalar: ScalarConstant = constant.value;
    if (scalar.type === "int") {
        const integer: number | bigint = scalar.value;
        // @ts-expect-error Integer scalars cannot contain strings.
        const string: string = scalar.value;
    }
}
// @ts-expect-error Module roots have no source location.
module.lineno;

const compatible: CompatibilityModule = parseModule("print 1", { pythonVersion: 2 });
const compatibilityTree: CompatibilityAST = compatible;
const compatibilityStatements: CompatibilityStatement[] = compatible.body;
// @ts-expect-error Compatibility trees can contain statements absent from CPython's AST.
const strict: Module = compatible;
for (const statement of compatible.body) {
    if (statement._type === "Print") {
        const values: expr[] = statement.values;
    }
    if (statement._type === "Try") {
        for (const handler of statement.handlers) {
            if (handler._type === "LegacyExceptHandler") {
                const target: expr = handler.target;
                const nested: CompatibilityStatement[] = handler.body;
            }
        }
    }
}
declare const pythonVersion: 2 | 3;
const selected = parseCoreModule("pass", { pythonVersion });
// @ts-expect-error A runtime language choice requires handling compatibility statements.
const alwaysStrict: Module = selected;

import { parseModule } from "../src/frontend_core.ts";
import type { Module } from "../src/ast.ts";
import type { CompatibilityModule } from "../src/python2_ast.ts";

const strict: Module = parseModule("pass");
const legacyNames: Module = parseModule("await(x)", { legacyAsyncNames: true });
const compatible: CompatibilityModule = parseModule("print 1", { python2Compat: true });
// @ts-expect-error Compatibility statements must not masquerade as strict CPython statements.
const notStrict: Module = compatible;
declare const enabled: boolean;
const selected = parseModule("pass", { python2Compat: enabled });
// @ts-expect-error A runtime mode selection also requires handling compatibility nodes.
const notAlwaysStrict: Module = selected;
for (const statement of compatible.body) {
    if (statement._type === "Print") {
        const newline: boolean = statement.nl;
    }
    if (statement._type === "Try") {
        for (const handler of statement.handlers) {
            if (handler._type === "LegacyExceptHandler") {
                const targetKind: string = handler.target._type;
            }
        }
    }
}

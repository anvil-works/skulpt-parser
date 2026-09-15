import { expect, test } from "@rstest/core";
import { parseExpression, parseModule } from "../src/python314/frontend_core.ts";
import { parseExpression as parseFullExpression } from "../src/python314/frontend.ts";
import reference from "./fixtures/legacy-async-skulpt.json";

for (const entry of reference.cases) {
    test(`Skulpt ${entry.mode} names: ${entry.source}`, () => {
        const options = entry.mode === "python2" ? { python2Compat: true } : { legacyAsyncNames: true };
        if ("error" in entry) {
            expect(() => parseModule(entry.source, options)).toThrow();
            return;
        }
        const module = parseModule(entry.source, options);
        expect(module.body.map((node) => node._type)).toEqual(entry.kinds);
        if ("expressionKind" in entry) {
            const node = module.body[0];
            expect(node._type).toBe("Expr");
            if (node._type !== "Expr") throw new Error("Expected expression statement");
            expect(node.value._type).toBe(entry.expressionKind);
            if ("callee" in entry) {
                expect(node.value).toMatchObject({ _type: "Call", func: { _type: "Name", id: entry.callee } });
            }
        }
    });
}

test("legacy names are independent of Python 2 syntax and do not leak into strict parses", () => {
    expect(parseExpression("await(x)", { legacyAsyncNames: true }).body).toMatchObject({
        _type: "Call",
        func: { _type: "Name", id: "await" },
    });
    expect(parseFullExpression("await(x)", { legacyAsyncNames: true }).body._type).toBe("Call");
    expect(parseExpression("await(x)").body._type).toBe("Await");
    expect(parseModule("async def f():\n await g() ").body[0]._type).toBe("AsyncFunctionDef");
    for (const source of ["async = 1", "await = 1"]) {
        expect(() => parseModule(source)).toThrow();
        expect(() => parseModule(source, { legacyAsyncNames: false })).toThrow();
    }
    for (const source of ["print 1", "0755", "42L", "a <> b"])
        expect(() => parseModule(source, { legacyAsyncNames: true })).toThrow();
    expect(parseModule("print(1)", { legacyAsyncNames: true }).body[0]._type).toBe("Expr");
});

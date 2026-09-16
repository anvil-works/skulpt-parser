import { expect, test } from "@rstest/core";
import { parseModule } from "../src/python314/frontend_core.ts";
import reference from "./fixtures/python2-statements-skulpt.json";

function comparable(node: any): any {
    if (node == null || typeof node !== "object") return node;
    if (Array.isArray(node)) return node.map(comparable);
    if (node._type === "Constant" && node.value.type === "int")
        return { _type: "Constant", value: { ...node.value, value: String(node.value.value) } };
    if (node._type === "ExceptHandler" && node.name !== null)
        return {
            _type: "LegacyExceptHandler",
            type: comparable(node.type),
            target: { _type: "Name", id: node.name, ctx: { _type: "Store" } },
            body: comparable(node.body),
        };
    return Object.fromEntries(
        Object.entries(node)
            .filter(
                ([key]) =>
                    ![
                        "lineno",
                        "col_offset",
                        "end_lineno",
                        "end_col_offset",
                        "type_comment",
                        "type_ignores",
                        "type_params",
                        "posonlyargs",
                        "kind",
                    ].includes(key)
            )
            .map(([key, value]) => [key, comparable(value)])
    );
}
for (const item of reference.cases) {
    const { source, expected, error } = item;
    const printFunction = "printFunction" in item && item.printFunction === true;
    test(`Skulpt legacy statements (${printFunction ? "print function" : "print statement"}): ${source}`, () => {
        if (error) {
            let failure: unknown;
            try {
                parseModule(source, { python2Compat: true, printFunction });
            } catch (e) {
                failure = e;
            }
            expect(failure).toMatchObject({ name: "SyntaxError" });
        } else {
            expect(comparable(parseModule(source, { python2Compat: true, printFunction }))).toEqual(expected);
        }
    });
}

test("strict mode keeps modern interpretations and rejects legacy-only statements", () => {
    for (const source of ["print 1", "raise ValueError, 'bad'", "try:\n pass\nexcept ValueError as obj.error:\n pass"])
        expect(() => parseModule(source)).toThrow();
    expect(parseModule("print(1)").body[0]._type).toBe("Expr");
    expect(parseModule("print >> out").body[0]._type).toBe("Expr");
    const strict = parseModule("try:\n pass\nexcept ValueError, TypeError:\n pass");
    expect(strict.body[0]._type).toBe("Try");
    if (strict.body[0]._type === "Try") expect(strict.body[0].handlers[0].name).toBeNull();
    // Match the current Skulpt frontend: the source future import does not switch its print parser.
    expect(parseModule("from __future__ import print_function\nprint(1)", { python2Compat: true }).body[1]._type).toBe(
        "Print"
    );
    expect(parseModule("print(1)", { python2Compat: true }).body[0]._type).toBe("Print");
});

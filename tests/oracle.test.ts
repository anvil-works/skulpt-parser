import { test, expect } from "@rstest/core";
import { getPyAstDump } from "../support/py_ast_dump.ts";

test("the persistent oracle preserves request order and recovers after a source error", async () => {
    const replies = await Promise.allSettled([
        getPyAstDump("x", {}, "eval"),
        getPyAstDump("def", {}),
        getPyAstDump("42", {}, "eval"),
    ]);
    expect(replies[0]).toEqual({ status: "fulfilled", value: "Expression(body=Name(id='x', ctx=Load()))" });
    expect(replies[1].status).toBe("rejected");
    if (replies[1].status === "rejected") expect(replies[1].reason.message).toContain("SyntaxError");
    expect(replies[2]).toEqual({ status: "fulfilled", value: "Expression(body=Constant(value=42))" });
});

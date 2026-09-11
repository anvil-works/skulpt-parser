import { runCases } from "./cases.ts";
Deno.test("real memoization, left recursion, cached failure and enum", () =>
    runCases((value) => {
        if (!value) throw new Error("assertion failed");
    })
);

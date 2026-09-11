import { test, expect } from "@rstest/core";
import { runCases } from "./cases.ts";
test("real memoization, left recursion, cached failure and enum", () => runCases((value) => expect(value).toBe(true)));

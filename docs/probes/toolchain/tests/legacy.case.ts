import { test, expect } from "@rstest/core";
import { ProbeParser } from "../src/legacy.ts";
test("legacy decorator left recursion and cache", () => {
    const p = new ProbeParser("1+2+3");
    expect(p.sum()).toBe(6);
    expect(p._mark).toBe(5);
    const n = p.digitCalls;
    p._mark = 0;
    expect(p.sum()).toBe(6);
    expect(p.digitCalls).toBe(n);
});

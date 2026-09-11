import { ProbeParser } from "../src/legacy.ts";
Deno.test("legacy decorator left recursion and cache", () => {
    const p = new ProbeParser("1+2+3");
    if (p.sum() !== 6 || p._mark !== 5) throw Error("parse");
    const n = p.digitCalls;
    p._mark = 0;
    if (p.sum() !== 6 || p.digitCalls !== n) throw Error("cache");
});

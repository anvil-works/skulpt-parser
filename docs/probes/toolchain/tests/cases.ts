import { ProbeParser, defaultStartRule } from "../src/modern.ts";
export function runCases(assert: (condition: boolean) => void) {
    const parser = new ProbeParser("1+2+3");
    assert(parser.sum() === 6);
    assert(parser._mark === 5);
    const calls = parser.digitCalls;
    parser._mark = 0;
    assert(parser.sum() === 6);
    assert(parser._mark === 5);
    assert(parser.digitCalls === calls);
    const failure = new ProbeParser("x");
    assert(failure.digit() === null);
    assert(failure.digit() === null);
    assert(failure.digitCalls === 1);
    const partial = new ProbeParser("1+");
    assert(partial.sum() === 1);
    assert(partial._mark === 1);
    assert(defaultStartRule === 257);
}

// Throwaway differential evaluator; invoke with prototype module and oracle JSON.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const { tokenize } = await import(pathToFileURL(process.argv[2]).href);
const cases = JSON.parse(readFileSync(process.argv[3], "utf8"));
const ignored = new Set(["NEWLINE", "NL", "COMMENT", "INDENT", "DEDENT", "ENDMARKER", "ENCODING"]);
const result = [];
for (const test of cases) {
    try {
        const actual = tokenize(test.source)
            .filter((t) => !ignored.has(t.type))
            .map((t) => ({ type: t.type, string: t.string, start: t.start, end: t.end }));
        const exact = test.valid && JSON.stringify(actual) === JSON.stringify(test.tokens);
        const content =
            test.valid &&
            JSON.stringify(actual.map((t) => [t.type, t.string])) ===
                JSON.stringify(test.tokens.map((t) => [t.type, t.string]));
        result.push({
            name: test.name,
            valid: test.valid,
            exact,
            content,
            rejected: false,
            ...(!exact ? { actual, expected: test.tokens } : {}),
        });
    } catch (error) {
        result.push({
            name: test.name,
            valid: test.valid,
            exact: false,
            content: false,
            rejected: true,
            error: String(error),
        });
    }
}
console.log(
    JSON.stringify(
        {
            summary: {
                total: cases.length,
                valid: cases.filter((c) => c.valid).length,
                exact: result.filter((r) => r.exact).length,
                content: result.filter((r) => r.content).length,
                invalid: cases.filter((c) => !c.valid).length,
                invalidRejected: result.filter((r) => !r.valid && r.rejected).length,
            },
            cases: result,
        },
        null,
        2
    )
);

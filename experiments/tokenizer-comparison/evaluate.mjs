import { readFileSync, writeFileSync, createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";
const [modulePath, corpusPath, outPath] = process.argv.slice(2);
const { tokenize } = await import(pathToFileURL(modulePath));
const stats = {
    module: modulePath,
    cases: 0,
    modes: 0,
    exact: 0,
    content: 0,
    expectedErrors: 0,
    rejected: 0,
    exactErrors: 0,
    warnings: 0,
    groups: {},
    failures: [],
};
const fields = ["name", "message", "lineno", "offset", "end_lineno", "end_offset", "text"];
const norm = (e) => Object.fromEntries(fields.map((k) => [k, (k === "message" ? e.msg ?? e.message : e[k]) ?? null]));
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function run(c) {
    stats.cases++;
    for (const mode of ["extra", "strict"]) {
        const expected = c[mode];
        stats.modes++;
        stats.warnings += expected.warnings?.length ?? 0;
        const g = (stats.groups[c.group ?? "random"] ??= { modes: 0, exact: 0 });
        g.modes++;
        let actual, error;
        try {
            actual = tokenize(c.source, { extraTokens: mode === "extra" });
        } catch (e) {
            error = norm(e);
        }
        let same = false,
            diff;
        if (expected.error) {
            stats.expectedErrors++;
            if (error) stats.rejected++;
            same = equal(error, expected.error);
            if (same) stats.exactErrors++;
            else diff = { expected: expected.error, actual: error ?? { accepted: true } };
        } else if (error) diff = { unexpectedError: error };
        else {
            const content = (t) => t.map(({ type, string }) => [type, string]);
            if (equal(content(actual), content(expected.tokens))) stats.content++;
            same = equal(actual, expected.tokens);
            if (!same) {
                const index = expected.tokens.findIndex((t, i) => !equal(t, actual[i]));
                const at = index < 0 ? expected.tokens.length : index;
                diff = {
                    index: at,
                    expected: expected.tokens[at],
                    actual: actual[at],
                    expectedCount: expected.tokens.length,
                    actualCount: actual.length,
                };
            }
        }
        if (same) {
            stats.exact++;
            g.exact++;
        } else if (stats.failures.length < 100) stats.failures.push({ name: c.name, mode, ...diff });
    }
}
if (corpusPath.endsWith(".jsonl")) {
    for await (const line of createInterface({ input: createReadStream(corpusPath) })) if (line) run(JSON.parse(line));
} else for (const c of JSON.parse(readFileSync(corpusPath, "utf8"))) run(c);
writeFileSync(outPath, JSON.stringify(stats, null, 2) + "\n");
console.log(JSON.stringify({ ...stats, failures: stats.failures.slice(0, 3) }));

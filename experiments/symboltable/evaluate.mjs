import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const [modulePath, corpusPath, outPath] = process.argv.slice(2);
const { analyze } = await import(pathToFileURL(modulePath));
const cases = JSON.parse(readFileSync(corpusPath, "utf8"));
function canonical(value) {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === "object")
        return Object.fromEntries(
            Object.keys(value)
                .sort()
                .map((k) => [k, canonical(value[k])])
        );
    return value;
}
const result = { cases: cases.length, exact: 0, expectedErrors: 0, exactErrors: 0, failures: [] };
for (const c of cases) {
    let actual, error;
    try {
        actual = analyze(c.ast);
    } catch (e) {
        error = { name: e.name, message: e.msg ?? e.message };
    }
    const expected = c.error ?? c.expected,
        observed = c.error ? error : actual;
    if (c.error) result.expectedErrors++;
    if (observed && JSON.stringify(canonical(expected)) === JSON.stringify(canonical(observed))) {
        result.exact++;
        if (c.error) result.exactErrors++;
    } else result.failures.push({ name: c.name, expected, actual: error ?? actual });
}
writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ ...result, failures: result.failures.slice(0, 2) }));
if (result.failures.length) process.exitCode = 1;

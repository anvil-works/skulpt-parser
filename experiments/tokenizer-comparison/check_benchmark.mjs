import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
const [modulePath, outPath] = process.argv.slice(2);
const { tokenize } = await import(pathToFileURL(modulePath));
const inputs = JSON.parse(readFileSync("benchmark-inputs.json", "utf8"));
const oracle = JSON.parse(readFileSync("benchmark-oracle.json", "utf8"));
const result = { modes: 0, exact: 0, failures: [] };
for (const [name, source] of Object.entries(inputs))
    for (const mode of ["extra", "strict"]) {
        const lines = [],
            indices = new Map();
        const tokens = tokenize(source, { extraTokens: mode === "extra" }).map((t) => {
            if (!indices.has(t.line)) {
                indices.set(t.line, lines.length);
                lines.push(t.line);
            }
            return [t.type, t.string, t.start, t.end, indices.get(t.line)];
        });
        const digest = createHash("sha256")
            .update(JSON.stringify([lines, tokens]))
            .digest("hex");
        result.modes++;
        if (digest === oracle[name][mode]) result.exact++;
        else result.failures.push({ name, mode, digest });
    }
writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n");
console.log(result);
if (result.failures.length) process.exitCode = 1;

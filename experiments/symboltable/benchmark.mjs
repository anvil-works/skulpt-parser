import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const [modulePath, inputName, outPath] = process.argv.slice(2);
const input = JSON.parse(readFileSync("benchmark-inputs.json", "utf8")).find((c) => c.name === inputName);
const before = performance.now();
const { analyze } = await import(pathToFileURL(modulePath));
const importMs = performance.now() - before;
let checksum = 0;
function calls(n) {
    for (let i = 0; i < n; i++) checksum += analyze(input.ast).symbols.length;
}
let t = performance.now();
calls(1);
const firstCallMs = performance.now() - t;
calls(60);
global.gc();
const baseline = process.memoryUsage();
t = performance.now();
calls(10);
const estimate = (performance.now() - t) / 10;
const iterations = Math.max(1, Math.min(10000, Math.ceil(30 / estimate)));
const samplesMs = [];
for (let i = 0; i < 11; i++) {
    t = performance.now();
    calls(iterations);
    samplesMs.push((performance.now() - t) / iterations);
}
global.gc();
const after = process.memoryUsage();
const medianMs = [...samplesMs].sort((a, b) => a - b)[5];
const result = {
    input: inputName,
    sourceBytes: Buffer.byteLength(input.source),
    importMs,
    firstCallMs,
    iterations,
    samplesMs,
    medianMs,
    baseline,
    after,
    peakRssBytes: process.resourceUsage().maxRSS * 1024,
    checksum,
};
writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n");

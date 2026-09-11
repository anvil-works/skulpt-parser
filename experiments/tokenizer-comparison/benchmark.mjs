import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const [modulePath, inputPath, inputName, outPath] = process.argv.slice(2);
const source = JSON.parse(readFileSync(inputPath, "utf8"))[inputName];
const beforeImport = performance.now();
const { tokenize } = await import(pathToFileURL(modulePath));
const importMs = performance.now() - beforeImport;
const start = performance.now();
let retained = tokenize(source, { extraTokens: false });
const firstCallMs = performance.now() - start;
const tokenCount = retained.length;
retained = null;
let checksum = 0;
for (let n = 0; n < 30; n++) checksum += tokenize(source, { extraTokens: false }).length;
global.gc();
const baseline = process.memoryUsage();
const sampleStart = performance.now();
for (let n = 0; n < 5; n++) checksum += tokenize(source, { extraTokens: false }).length;
const estimatedMs = (performance.now() - sampleStart) / 5;
const iterations = Math.max(1, Math.min(1000, Math.ceil(30 / estimatedMs)));
const samples = [];
for (let s = 0; s < 11; s++) {
    const t = performance.now();
    for (let n = 0; n < iterations; n++) checksum += tokenize(source, { extraTokens: false }).length;
    samples.push((performance.now() - t) / iterations);
}
global.gc();
const afterRuns = process.memoryUsage();
const sorted = [...samples].sort((a, b) => a - b);
const result = {
    input: inputName,
    sourceBytes: Buffer.byteLength(source),
    tokenCount,
    importMs,
    firstCallMs,
    iterations,
    samplesMs: samples,
    medianMs: sorted[5],
    baseline,
    afterRuns,
    peakRssBytes: process.resourceUsage().maxRSS * 1024,
    checksum,
};
writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n");

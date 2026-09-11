import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const [modulePath, inputPath, inputName, outPath] = process.argv.slice(2);
const source = JSON.parse(readFileSync(inputPath, "utf8"))[inputName];
const { tokenize } = await import(pathToFileURL(modulePath));
// Keep temporary token arrays on a stack frame that has returned before GC.
function warm() {
    let count = 0;
    for (let i = 0; i < 40; i++) count = tokenize(source, { extraTokens: false }).length;
    return count;
}
const tokenCount = warm();
global.gc();
global.gc();
const baseline = process.memoryUsage();
const copies = Math.max(3, Math.min(100, Math.floor(100000 / tokenCount)));
const outputs = Array.from({ length: copies }, () => tokenize(source, { extraTokens: false }));
global.gc();
global.gc();
const retained = process.memoryUsage();
const result = {
    input: inputName,
    tokenCount,
    copies,
    baseline,
    retained,
    perOutputHeapBytes: (retained.heapUsed - baseline.heapUsed) / copies,
    peakRssBytes: process.resourceUsage().maxRSS * 1024,
    checksum: outputs.reduce((n, t) => n + t.length, 0),
};
writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n");

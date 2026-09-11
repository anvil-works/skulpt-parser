import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const [modulePath, inputName, outPath] = process.argv.slice(2);
const input = JSON.parse(readFileSync("benchmark-inputs.json", "utf8")).find((c) => c.name === inputName);
const { analyze } = await import(pathToFileURL(modulePath));
function warm() {
    let n = 0;
    for (let i = 0; i < (inputName === "small" ? 5000 : 200); i++) n += analyze(input.ast).symbols.length;
    return n;
}
const warmChecksum = warm();
global.gc();
global.gc();
const baseline = process.memoryUsage();
const copies = inputName === "small" ? 2000 : inputName === "large" ? 10 : 100;
const outputs = Array.from({ length: copies }, () => analyze(input.ast));
global.gc();
global.gc();
const retained = process.memoryUsage();
writeFileSync(
    outPath,
    JSON.stringify(
        {
            input: inputName,
            copies,
            baseline,
            retained,
            perResultHeapBytes: (retained.heapUsed - baseline.heapUsed) / copies,
            peakRssBytes: process.resourceUsage().maxRSS * 1024,
            checksum: warmChecksum + outputs.reduce((n, t) => n + t.symbols.length, 0),
        },
        null,
        2
    ) + "\n"
);

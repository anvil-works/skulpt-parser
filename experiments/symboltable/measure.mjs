import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { gzipSync, brotliCompressSync, constants } from "node:zlib";
import { cpus, platform, arch } from "node:os";
const summary = { node: process.version, platform: platform(), arch: arch(), cpu: cpus()[0].model, candidates: {} };
for (const candidate of ["switch", "visitor"]) {
    const bytes = readFileSync(`dist/${candidate}/index.js`);
    summary.candidates[candidate] = {
        bytes: bytes.length,
        gzip: gzipSync(bytes).length,
        brotli: brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
        inputs: {},
    };
}
for (let repeat = 0; repeat < 3; repeat++)
    for (const input of ["small", "medium", "large"])
        for (const candidate of repeat % 2 ? ["visitor", "switch"] : ["switch", "visitor"]) {
            const module = resolve(`dist/${candidate}/index.js`),
                out = `bench-${candidate}-${input}.json`,
                memoryOut = `memory-${candidate}-${input}.json`;
            for (const [script, path] of [
                ["benchmark.mjs", out],
                ["memory.mjs", memoryOut],
            ]) {
                const result = spawnSync(process.execPath, ["--expose-gc", script, module, input, path], {
                    encoding: "utf8",
                    timeout: 60000,
                });
                if (result.status !== 0) throw new Error(result.stderr || String(result.error));
            }
            const result = JSON.parse(readFileSync(out, "utf8"));
            result.memory = JSON.parse(readFileSync(memoryOut, "utf8"));
            (summary.candidates[candidate].inputs[input] ??= []).push(result);
            console.log(
                JSON.stringify({
                    repeat,
                    candidate,
                    input,
                    medianMs: result.medianMs,
                    heap: result.memory.perResultHeapBytes,
                })
            );
        }
writeFileSync("measurements.json", JSON.stringify(summary, null, 2) + "\n");

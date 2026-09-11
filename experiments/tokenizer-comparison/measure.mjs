import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync, brotliCompressSync, constants } from "node:zlib";
import { spawnSync } from "node:child_process";
import { cpus, platform, arch } from "node:os";
import { resolve } from "node:path";
const inputs = JSON.parse(readFileSync("benchmark-inputs.json", "utf8"));
const summary = { node: process.version, platform: platform(), arch: arch(), cpu: cpus()[0].model, candidates: {} };
// Run sequentially; separate fresh processes prevent cross-candidate JIT/GC state.
for (const candidate of ["regex", "cpython"]) {
    const path = resolve(`dist/${candidate}/index.js`),
        bytes = readFileSync(path);
    summary.candidates[candidate] = {
        bytes: bytes.length,
        gzip: gzipSync(bytes).length,
        brotli: brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
        inputs: {},
    };
}
for (let repeat = 0; repeat < 3; repeat++)
    for (const name of Object.keys(inputs))
        for (const candidate of repeat % 2 ? ["cpython", "regex"] : ["regex", "cpython"]) {
            const path = resolve(`dist/${candidate}/index.js`),
                out = `bench-${candidate}-${name}.json`;
            const child = spawnSync(
                process.execPath,
                ["--expose-gc", "benchmark.mjs", path, "benchmark-inputs.json", name, out],
                { encoding: "utf8", timeout: 60000 }
            );
            if (child.status !== 0) throw new Error(child.stderr || String(child.error));
            const result = JSON.parse(readFileSync(out, "utf8"));
            const memoryOut = `memory-${candidate}-${name}.json`;
            const memory = spawnSync(
                process.execPath,
                ["--expose-gc", "memory.mjs", path, "benchmark-inputs.json", name, memoryOut],
                { encoding: "utf8", timeout: 60000 }
            );
            if (memory.status !== 0) throw new Error(memory.stderr || String(memory.error));
            result.memory = JSON.parse(readFileSync(memoryOut, "utf8"));
            (summary.candidates[candidate].inputs[name] ??= []).push(result);
            console.log(
                JSON.stringify({
                    repeat,
                    candidate,
                    input: name,
                    medianMs: result.medianMs,
                    retainedTokenHeapBytes: result.memory.perOutputHeapBytes,
                })
            );
        }
writeFileSync("measurements.json", JSON.stringify(summary, null, 2) + "\n");

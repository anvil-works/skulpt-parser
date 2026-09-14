import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { createLexer } from "./loader.mjs";
import { measure, oracleBytes } from "./bench-core.mjs";
const [backend, artifact, inputName, output] = process.argv.slice(2);
const source = JSON.parse(fs.readFileSync(new URL("./benchmark-inputs.json", import.meta.url)))[inputName];
const oracle = JSON.parse(fs.readFileSync(new URL("./benchmark-oracle.json", import.meta.url)))[inputName];
let lexer, run, init;
if (backend.startsWith("wasm")) {
    lexer = await createLexer(fs.readFileSync(artifact), { binary: backend === "wasm-binary" });
    run = (s) => lexer.run(s, false);
    init = { compileMs: lexer.compileMs, instantiateMs: lexer.instantiateMs, imports: lexer.imports };
} else {
    const t = performance.now();
    const { tokenize } = await import(pathToFileURL(artifact));
    init = { importMs: performance.now() - t };
    run = (s) => ({ tokens: tokenize(s, { extraTokens: false }) });
}
const timing = measure(run, source);
// Verify the benchmark output before reporting its timings as comparable.
const tokens = run(source).tokens;
const tokenHash = createHash("sha256").update(oracleBytes(tokens)).digest("hex");
if (tokenHash !== oracle.strict) throw new Error(`Benchmark parity failure ${inputName}: ${tokenHash}`);
const profile = [];
if (lexer)
    for (let i = 0; i < 9; i++) {
        const p = lexer.run(source, false, true);
        profile.push({ times: p.times, resultBytes: p.resultBytes, linearMemoryBytes: p.linearMemoryBytes });
    }
global.gc();
const before = process.memoryUsage();
let retained = run(source);
global.gc();
const withResult = process.memoryUsage();
const retainedTokenCount = retained.tokens.length;
retained = null;
global.gc();
const afterRelease = process.memoryUsage();
const capacityBefore = lexer?.memoryBytes();
for (let i = 0; i < 100; i++) run(source);
global.gc();
const afterRepeated = process.memoryUsage();
const result = {
    backend,
    input: inputName,
    node: process.version,
    sourceBytes: Buffer.byteLength(source),
    ...init,
    ...timing,
    tokenHash,
    profile,
    memory: {
        before,
        withResult,
        afterRelease,
        afterRepeated,
        linearMemoryBefore: capacityBefore,
        linearMemoryAfter: lexer?.memoryBytes(),
        retainedTokenCount,
        processPeakRssBytes: process.resourceUsage().maxRSS * 1024,
    },
};
fs.writeFileSync(output, JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ backend, input: inputName, medianMs: result.medianMs, tokenCount: result.tokenCount }));

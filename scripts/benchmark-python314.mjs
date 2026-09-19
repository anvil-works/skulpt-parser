import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { cpus, platform, arch } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync, brotliCompressSync } from "node:zlib";

// Each engine/round runs in a fresh process. CPython expectations and I/O stay
// outside the timed region. This measures Node source-to-AST, not compilation.
const args = process.argv.slice(2);
const option = (name, fallback) => {
    const index = args.indexOf(name);
    return index < 0 ? fallback : args[index + 1];
};
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const materialize = (value) => {
    if (Array.isArray(value)) return value.map(materialize);
    if (value === null || typeof value !== "object") return value;
    if ("$bigint" in value) return BigInt(value.$bigint);
    if ("$bytes" in value) return new Uint8Array(value.$bytes);
    if ("$float" in value) return Number(value.$float);
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, materialize(child)]));
};
const errorRecord = (error) => {
    const result = { name: error.name, message: error.message };
    for (const key of ["lineno", "offset", "end_lineno", "end_offset", "text"]) result[key] = error[key] ?? null;
    return result;
};
if (args.includes("--worker")) {
    const { engine, cases } = JSON.parse(readFileSync(0, "utf8"));
    global.gc();
    const beforeLoad = process.memoryUsage().heapUsed;
    const started = performance.now();
    let parse;
    if (engine.kind === "skulpt") {
        createRequire(import.meta.url)(engine.path);
        globalThis.Sk.configure({ __future__: globalThis.Sk.python3 });
        parse = (source) => {
            const parsed = globalThis.Sk.parse("<string>", source);
            return globalThis.Sk.astFromParse(parsed.cst, "<string>", parsed.flags);
        };
    } else {
        parse = (await import(pathToFileURL(engine.path).href)).parseModule;
    }
    const loadMs = performance.now() - started;
    global.gc();
    const loadHeapBytes = process.memoryUsage().heapUsed - beforeLoad;
    const coldStart = performance.now();
    parse(cases[0].source);
    const firstParseMs = performance.now() - coldStart;
    const results = [];
    for (const item of cases) {
        let actual, failure;
        const warnings = [];
        try {
            actual = parse(item.source, {
                onWarning: ({ name, message, lineno }) => warnings.push({ name, message, lineno }),
            });
        } catch (error) {
            failure = error;
        }
        if (engine.kind !== "skulpt") {
            if (item.error) {
                assert.ok(failure, item.name);
                assert.deepEqual(errorRecord(failure), item.error, item.name);
            } else {
                assert.equal(failure, undefined, item.name);
                assert.deepEqual(actual, materialize(item.tree), item.name);
            }
            assert.deepEqual(warnings, item.warnings, item.name);
        } else if (failure && !item.error) {
            results.push({ name: item.name, unsupported: String(failure) });
            continue;
        } else if (item.error && !failure) {
            results.push({ name: item.name, acceptedInvalidSource: true });
            continue;
        }
        actual = null;
        failure = null;
        const run = item.error
            ? () => {
                  try {
                      parse(item.source);
                  } catch {
                      return;
                  }
                  throw new Error("Expected rejection");
              }
            : () => parse(item.source);
        for (let i = 0; i < 10; i++) run();
        const trialStart = performance.now();
        for (let i = 0; i < 5; i++) run();
        const iterations = Math.max(1, Math.min(1000, Math.ceil(25 / ((performance.now() - trialStart) / 5))));
        const samplesMs = [];
        for (let sample = 0; sample < 9; sample++) {
            const start = performance.now();
            for (let i = 0; i < iterations; i++) run();
            samplesMs.push((performance.now() - start) / iterations);
        }
        let retainedBytesPerAST = null;
        if (!item.error) {
            const copies = Math.max(16, Math.min(1024, Math.ceil(65536 / item.source.length)));
            const retainedSamples = [];
            for (let sample = 0; sample < 5; sample++) {
                global.gc();
                const before = process.memoryUsage().heapUsed;
                let trees = Array.from({ length: copies }, () => parse(item.source));
                global.gc();
                retainedSamples.push((process.memoryUsage().heapUsed - before) / trees.length);
                trees = null;
                global.gc();
            }
            retainedBytesPerAST = median(retainedSamples);
        }
        results.push({ name: item.name, medianMs: median(samplesMs), samplesMs, iterations, retainedBytesPerAST });
    }
    console.log(
        JSON.stringify({
            loadMs,
            loadHeapBytes,
            firstParseMs,
            maxRSSKiB: process.resourceUsage().maxRSS,
            cases: results,
        })
    );
} else {
    const rounds = Number(option("--rounds", "3"));
    assert.ok(Number.isInteger(rounds) && rounds > 0);
    const oracle = spawnSync(option("--python", "python3.14"), ["tests/fixtures/generate_python314_corpus.py"], {
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
    });
    if (oracle.status !== 0) throw new Error(oracle.stderr);
    const extraArgs = ["scripts/benchmark_python314_sources.py"];
    if (option("--legacy-stdlib")) extraArgs.push(option("--legacy-stdlib"));
    const extras = spawnSync(option("--python", "python3.14"), extraArgs, {
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
    });
    if (extras.status !== 0) throw new Error(extras.stderr);
    const modules = JSON.parse(readFileSync("tests/fixtures/python314-modules.json", "utf8"));
    const small = modules.cases.find((item) => item.source === "x = 1");
    assert.ok(small);
    const diagnostics = JSON.parse(readFileSync("tests/fixtures/python314-diagnostics.json", "utf8"));
    const cases = [
        { ...small, name: "small-assignment" },
        ...JSON.parse(extras.stdout),
        ...JSON.parse(oracle.stdout),
        ...["if x:\npass", "résumé = (\n x y\n", "x y\n]"].map((source) => {
            const item = diagnostics.cases.find((item) => item.mode === "exec" && item.source === source);
            assert.ok(item);
            return { ...item, name: "invalid:" + source };
        }),
    ];
    const engines = [
        { name: "candidate", kind: "frontend", path: resolve(option("--candidate", "dist-expression/index.js")) },
    ];
    for (const [flag, name, kind] of [
        ["--baseline", "baseline", "frontend"],
        ["--skulpt", "skulpt-master", "skulpt"],
    ]) {
        if (option(flag)) engines.push({ name, kind, path: resolve(option(flag)) });
    }
    const report = {
        environment: { node: process.version, platform: platform(), arch: arch(), cpu: cpus()[0].model },
        checkoutCommit: spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim(),
        skulptCommit: option("--skulpt-commit", null),
        cases: cases.map(({ name, source }) => ({
            name,
            bytes: Buffer.byteLength(source),
            sha256: createHash("sha256").update(source).digest("hex"),
        })),
        engines: engines.map((engine) => {
            const bytes = readFileSync(engine.path);
            return {
                ...engine,
                sha256: createHash("sha256").update(bytes).digest("hex"),
                size: { raw: bytes.length, gzip: gzipSync(bytes).length, brotli: brotliCompressSync(bytes).length },
                runs: [],
            };
        }),
    };
    for (let round = 0; round < rounds; round++) {
        for (let offset = 0; offset < engines.length; offset++) {
            const index = (round + offset) % engines.length;
            const engine = engines[index];
            console.error("Round", round + 1, engine.name);
            const child = spawnSync(process.execPath, ["--expose-gc", fileURLToPath(import.meta.url), "--worker"], {
                input: JSON.stringify({ engine, cases }),
                encoding: "utf8",
                maxBuffer: 64 * 1024 * 1024,
            });
            if (child.status !== 0) throw new Error(child.stderr || child.stdout);
            report.engines[index].runs.push(JSON.parse(child.stdout));
        }
    }
    const json = JSON.stringify(report, null, 2) + "\n";
    if (option("--output")) writeFileSync(option("--output"), json);
    else process.stdout.write(json);
}

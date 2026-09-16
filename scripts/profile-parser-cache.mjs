// Diagnostic harness only. Build a non-minified entry exporting parseModule and
// Parser; no profiling hooks or counters are added to production bundles.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { Session } from "node:inspector/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

const [bundle, corpus, mode, output] = process.argv.slice(2);
assert.ok(
    ["stats", "cpu", "heap"].includes(mode) && output,
    "Usage: node --expose-gc scripts/profile-parser-cache.mjs <debug-bundle> <cases.json> <stats|cpu|heap> <output-dir>"
);
assert.ok(global.gc, "Run with --expose-gc");
mkdirSync(output, { recursive: true });
const { parseModule, Parser, memoRules } = await import(pathToFileURL(resolve(bundle)).href);
const cases = JSON.parse(readFileSync(corpus, "utf8"));
const records = [];
let counters;
if (mode === "stats") {
    // Deliberately expensive instrumentation, used only for counts, never timings.
    const original = Parser.prototype.cacheAt;
    const proxies = new WeakMap();
    const ruleNames = memoRules?.map(({ name }) => name);
    Parser.prototype.cacheAt = function (mark) {
        const cache = original.call(this, mark);
        if (proxies.has(cache)) return proxies.get(cache);
        counters.rows++;
        const row = (name) =>
            (counters.rules[`${this.callInvalidRules ? "diagnostic" : "normal"}:${name}`] ??= {
                hits: 0,
                nullHits: 0,
                misses: 0,
                writes: 0,
            });
        const get = (name, value) => {
            const stats = row(name);
            if (value) {
                stats.hits++;
                if (value.value === null) stats.nullHits++;
            } else stats.misses++;
            return value;
        };
        let proxy;
        if (Array.isArray(cache)) {
            assert.ok(ruleNames?.length, "Indexed cache needs memoRules from prepare-cache-profile.mjs");
            proxy = new Proxy(cache, {
                get: (target, id) => get(ruleNames[id], target[id]),
                set: (target, id, value) => {
                    row(ruleNames[id]).writes++;
                    target[id] = value;
                    return true;
                },
            });
        } else {
            // Preserve the old Map runtime for before/after experiments.
            proxy = {
                get: (name) => get(name, cache.get(name)),
                set: (name, value) => {
                    row(name).writes++;
                    cache.set(name, value);
                },
            };
        }
        proxies.set(cache, proxy);
        return proxy;
    };
    const parse = Parser.prototype.parse;
    Parser.prototype.parse = function (...args) {
        try {
            return parse.apply(this, args);
        } finally {
            // Entries retained until this parser invocation returns, not retained
            // by the returned AST. Left-recursion seeds have finished growing.
            for (const cache of this.cache) {
                if (!cache) continue;
                for (const [key, entry] of cache.entries()) {
                    if (!entry) continue;
                    const name = Array.isArray(cache) ? ruleNames[key] : key;
                    const row = (counters.finalEntries[name] ??= { success: 0, failure: 0 });
                    row[entry.value === null ? "failure" : "success"]++;
                }
            }
        }
    };
}
for (const item of cases) {
    const run = () => {
        try {
            parseModule(item.source, item.options);
        } catch (error) {
            if (item.error && ["SyntaxError", "IndentationError", "TabError"].includes(error.name)) return;
            throw error;
        }
        assert.ok(!item.error, "Expected syntax rejection: " + item.name);
    };
    const record = {
        name: item.name,
        sourceBytes: Buffer.byteLength(item.source),
        sourceSha256: createHash("sha256").update(item.source).digest("hex"),
    };
    if (mode === "stats") {
        counters = { rows: 0, rules: {}, finalEntries: {} };
        run();
        record.cache = counters;
    } else {
        for (let i = 0; i < 30; i++) run();
        global.gc();
        const session = new Session();
        session.connect();
        try {
            if (mode === "cpu") {
                await session.post("Profiler.enable");
                await session.post("Profiler.setSamplingInterval", { interval: 500 });
                await session.post("Profiler.start");
            } else {
                await session.post("HeapProfiler.enable");
                await session.post("HeapProfiler.startSampling", {
                    samplingInterval: 32768,
                    includeObjectsCollectedByMajorGC: true,
                    includeObjectsCollectedByMinorGC: true,
                });
            }
            const until = performance.now() + 1500;
            let parses = 0;
            while (performance.now() < until) {
                run();
                parses++;
            }
            const { profile } = await session.post(mode === "cpu" ? "Profiler.stop" : "HeapProfiler.stopSampling");
            const filename =
                item.name.replaceAll(/[^a-zA-Z0-9_-]/g, "_") + (mode === "cpu" ? ".cpuprofile" : ".heapprofile");
            writeFileSync(join(output, filename), JSON.stringify(profile));
            Object.assign(record, { parses, profile: filename });
        } finally {
            session.disconnect();
        }
    }
    records.push(record);
}
writeFileSync(
    join(output, mode + ".json"),
    JSON.stringify(
        {
            node: process.version,
            bundleSha256: createHash("sha256").update(readFileSync(bundle)).digest("hex"),
            mode,
            memoRules,
            records,
        },
        null,
        2
    ) + "\n"
);

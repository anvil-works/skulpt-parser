// Bounded CPython differential probes. Each JavaScript parse has its own process
// and deadline, so a stack overflow or pathological input cannot stall the run.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { performanceEnvironment } from "./performance-environment.mjs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { encode, errorRecord, canonicalJSON } from "./performance-utils.mjs";
import { mutationCases, mutationFixtures, scalingCases } from "./robustness-cases.mjs";

const args = process.argv.slice(2);
const option = (flag, fallback) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback);
if (args.includes("--worker")) {
    const { bundle, source } = JSON.parse(readFileSync(0, "utf8"));
    const { parseModule } = await import(pathToFileURL(bundle).href);
    const warnings = [];
    let tree, failure;
    const started = performance.now();
    try {
        tree = parseModule(source, {
            onWarning: ({ name, message, lineno }) => warnings.push({ name, message, lineno }),
        });
    } catch (error) {
        failure = error;
    }
    const parseMs = performance.now() - started;
    const record = {
        warnings,
        ...(failure
            ? { error: errorRecord(failure) }
            : {
                  treeDigest: createHash("sha256")
                      .update(canonicalJSON(encode(tree)))
                      .digest("hex"),
              }),
    };
    console.log(JSON.stringify({ record, parseMs }));
} else {
    assert.ok(option("--output"), "Use --output <report.json> [--bundle <core.js>] [--minimize]");
    const bundle = resolve(option("--bundle", "dist-core/index.js"));
    const python = option("--python", "python3.14");
    const oracle = (items) => {
        const child = spawnSync(python, ["scripts/python314_probe.py"], {
            input: JSON.stringify(items),
            encoding: "utf8",
            timeout: 5000,
            maxBuffer: 64 * 1024 * 1024,
        });
        assert.equal(child.status, 0, child.stderr);
        return JSON.parse(child.stdout).map((item) => {
            if (item.tree) {
                item.treeDigest = createHash("sha256").update(canonicalJSON(item.tree)).digest("hex");
                delete item.tree;
            }
            return item;
        });
    };
    const isolated = (source) => {
        const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "--worker"], {
            input: JSON.stringify({ bundle, source }),
            encoding: "utf8",
            timeout: 5000,
            maxBuffer: 64 * 1024 * 1024,
        });
        if (child.error?.code === "ETIMEDOUT") return { timeout: true };
        if (child.status !== 0) return { workerFailure: child.stderr || String(child.signal) };
        return JSON.parse(child.stdout);
    };
    const signature = (expected, actual) => {
        if (actual.timeout) return "timeout";
        if (actual.workerFailure) return "worker-failure";
        const result = actual.record;
        if (result.error && !["SyntaxError", "IndentationError", "TabError"].includes(result.error.name)) {
            return "javascript-exception:" + result.error.name;
        }
        if (expected.referenceFailure) return "reference-limit";
        if (Boolean(expected.error) !== Boolean(result.error)) return "acceptance";
        for (const key of expected.error ? Object.keys(expected.error) : ["treeDigest"]) {
            if (
                JSON.stringify(expected.error ? expected.error[key] : expected[key]) !==
                JSON.stringify(result.error ? result.error[key] : result[key])
            )
                return "mismatch:" + key;
        }
        if (JSON.stringify(expected.warnings) !== JSON.stringify(result.warnings)) return "warnings";
        return null;
    };
    const mutations = args.includes("--scaling-only") ? [] : mutationCases(mutationFixtures(python));
    const cases = oracle([...mutations, ...scalingCases({ stress: true })]);
    const report = {
        seed: "0x314cafe",
        python: spawnSync(python, ["--version"], { encoding: "utf8" }).stdout.trim(),
        environment: performanceEnvironment(),
        manifest: option("--manifest") ? JSON.parse(readFileSync(option("--manifest"), "utf8")) : null,
        bundle,
        bundleSha256: createHash("sha256").update(readFileSync(bundle)).digest("hex"),
        results: [],
    };
    for (const item of cases) {
        const actual = isolated(item.source);
        const finding = signature(item, actual);
        const result = {
            ...item,
            sourceSha256: createHash("sha256").update(item.source).digest("hex"),
            sourceBytes: Buffer.byteLength(item.source),
            ...actual,
            finding,
        };
        // Confirm before spending a bounded minimization budget. Preserve the
        // mismatch category; never turn an AST discrepancy into a generic error.
        if (finding && finding !== "reference-limit") {
            result.confirmed = signature(item, isolated(item.source)) === finding;
            if (result.confirmed && args.includes("--minimize") && !item.family) {
                let source = item.source;
                let probes = 0;
                for (let chunks = 2; chunks <= 32 && probes < 40; chunks *= 2) {
                    const points = [...source];
                    const width = Math.ceil(points.length / chunks);
                    for (let start = 0; start < points.length && probes < 40; start += width) {
                        const candidate = [...points.slice(0, start), ...points.slice(start + width)].join("");
                        probes++;
                        const expected = oracle([{ source: candidate }])[0];
                        if (signature(expected, isolated(candidate)) === finding) {
                            source = candidate;
                            break;
                        }
                    }
                }
                result.minimized = { source, probes, expected: oracle([{ source }])[0], actual: isolated(source) };
            }
        }
        report.results.push(result);
        // Keep partial evidence if an external interruption ends the full run.
        writeFileSync(option("--output"), JSON.stringify(report, null, 2));
    }
    report.scaling = Object.fromEntries(
        [...new Set(cases.filter((item) => item.family).map((item) => item.family))].map((family) => {
            const samples = report.results.filter((item) => item.family === family);
            const ratios = samples.slice(1).map((item, i) => ({
                sizeRatio: item.sourceBytes / samples[i].sourceBytes,
                timeRatio: item.parseMs / samples[i].parseMs,
            }));
            return [family, { ratios, suspiciousGrowth: ratios.some((item) => item.timeRatio > item.sizeRatio * 2) }];
        })
    );
    writeFileSync(option("--output"), JSON.stringify(report, null, 2));
    console.log(
        JSON.stringify({
            cases: cases.length,
            findings: report.results.filter((item) => item.finding).length,
            scaling: report.scaling,
        })
    );
}

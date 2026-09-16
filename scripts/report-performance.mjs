import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { brotliCompressSync, gzipSync } from "node:zlib";

const directory = process.argv[2];
assert.ok(directory, "Usage: node scripts/report-performance.mjs <benchmark-output-directory>");
const report = JSON.parse(readFileSync(join(directory, "benchmark.json"), "utf8"));
const candidate = report.engines.find(({ name }) => name === "candidate");
assert.ok(candidate?.runs.length, "Missing candidate benchmark runs");
const median = (values) => {
    assert.ok(values.length && values.every(Number.isFinite), "Missing or non-finite measurement");
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const cell = (value) => String(value).replaceAll("|", "\\|").replaceAll("\r", "\\r").replaceAll("\n", "\\n");
const bundles = [
    ["Lean parser", "dist-core/index.js"],
    ["Optional Unicode-name resolver", "dist-core/unicode-names.js"],
    ["Full parser with Unicode names", "dist-expression/index.js"],
].map(([name, path]) => {
    const bytes = readFileSync(path);
    return {
        name,
        path,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        raw: bytes.length,
        gzip: gzipSync(bytes).length,
        brotli: brotliCompressSync(bytes).length,
    };
});
// Do not accidentally attach fresh size measurements to a stale benchmark.
assert.equal(bundles[0].sha256, candidate.sha256, "Lean bundle changed after benchmarking");
writeFileSync(
    join(directory, "bundles.json"),
    JSON.stringify({ checkoutCommit: report.checkoutCommit, bundles }, null, 2) + "\n"
);

const lines = [
    "# Parser performance",
    "",
    `Commit: ${report.checkoutCommit}`,
    `Environment: ${cell(report.environment.node)}, ${cell(report.environment.platform)}/${cell(
        report.environment.arch
    )}, ${cell(report.environment.cpu)}`,
    `Rounds: ${candidate.runs.length}. Timings below are medians across fresh-process rounds.`,
    "",
    "## Bundle sizes",
    "",
    "| Bundle | Raw bytes | Gzip bytes | Brotli bytes |",
    "| --- | ---: | ---: | ---: |",
    ...bundles.map((b) => `| ${b.name} | ${b.raw} | ${b.gzip} | ${b.brotli} |`),
    "",
    "The optional resolver is separate from the lean parser. These are standalone artifacts, not the Anvil worker or full IDE.",
    "",
    "## Lean parser timings and memory",
    "",
    "| Workload | Source bytes | Parse ms | Retained bytes / AST |",
    "| --- | ---: | ---: | ---: |",
];
for (const item of report.cases) {
    const runs = candidate.runs.map((run) => run.cases.find(({ name }) => name === item.name));
    assert.ok(
        runs.every((run) => run && Number.isFinite(run.medianMs)),
        `Missing workload: ${item.name}`
    );
    const retained = runs.every((run) => run.retainedBytesPerAST === null)
        ? "n/a (rejected input)"
        : median(runs.map((run) => run.retainedBytesPerAST)).toFixed(0);
    lines.push(
        `| ${cell(item.name)} | ${item.bytes} | ${median(runs.map((run) => run.medianMs)).toFixed(3)} | ${retained} |`
    );
}
lines.push(
    "",
    `Module load: ${median(candidate.runs.map((run) => run.loadMs)).toFixed(3)} ms.`,
    `First parse: ${median(candidate.runs.map((run) => run.firstParseMs)).toFixed(3)} ms.`,
    `Heap added by module load: ${median(candidate.runs.map((run) => run.loadHeapBytes)).toFixed(0)} bytes.`,
    `Process high-water RSS: ${median(candidate.runs.map((run) => run.maxRSSKiB)).toFixed(0)} KiB.`,
    "",
    "Reporting only: no speed, memory or size regression thresholds. Build failures, invalid measurements and CPython oracle mismatches still fail the job.",
    "Hosted-runner timing and GC measurements are noisy. Compare repeated runs with matching runtime, workload hashes and hardware; do not infer a regression from one run.",
    "RSS covers the whole benchmark process, including fixtures and validation. Retained AST bytes exclude parser temporary allocations and are not peak memory.",
    "The benchmark checks Python 3.14 ASTs, diagnostics and warnings before timing. It does not measure compilation, Python 2 compatibility or browser/IDE behavior.",
    "",
    "Download the artifact for raw samples, environment details, source/bundle hashes and exact byte counts.",
    ""
);
writeFileSync(join(directory, "summary.md"), lines.join("\n"));

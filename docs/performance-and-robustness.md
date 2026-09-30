# Performance and robustness workflow

Use Node 22 and CPython 3.14.3. Install the lockfile dependencies with
`pnpm install --frozen-lockfile`. Playwright 1.63.0 is development-only; install its
pinned browser binaries with `pnpm exec playwright install chromium webkit`.
All browser execution uses fresh automated contexts and a loopback HTTP server.
The server enables cross-origin isolation for more precise browser timing.

## Freeze the baseline

The dev.5 reference is `3667c2129542f1dd457321c6b4e38ad1d4ebd8bd`. Build it in an
isolated source snapshot. Keep the snapshot, core bundle, consumer artifacts and
their provenance together in the experiment directory. Record full repository
revisions, SHA-256 hashes, runtime/browser versions and hardware in a manifest.
The benchmark commands accept `--manifest` to include that record in each report.

```sh
mkdir -p /tmp/parser-study/baseline
git archive 3667c21 | tar -x -C /tmp/parser-study/baseline
cd /tmp/parser-study/baseline
pnpm install --frozen-lockfile
pnpm build:core
```

Return to the current parser checkout for the following commands. Verify
correctness before timing. Do not run profiling, builds or tests alongside a
comparison. Baselines use three fresh processes or contexts. Optimization
comparisons use five paired rounds, alternating engine order on the same machine.

## Node and browser measurements

Prepare the existing CPython-verified benchmark corpus once. This keeps the same
sources and expectations across runtimes and includes the larger incomplete buffers.

```sh
pnpm bench:python314 --extended --prepare-only --cases-output /tmp/parser-study/cases.json
pnpm bench:python314 --candidate /tmp/parser-study/baseline/dist-core/index.js --cases /tmp/parser-study/cases.json --rounds 3 --output /tmp/parser-study/node-baseline.json
pnpm bench:browser --candidate /tmp/parser-study/baseline/dist-core/index.js --cases /tmp/parser-study/cases.json --rounds 3 --output /tmp/parser-study/browser-baseline.json
pnpm build:core
pnpm bench:python314 --candidate dist-core/index.js --baseline /tmp/parser-study/baseline/dist-core/index.js --cases /tmp/parser-study/cases.json --rounds 5 --output /tmp/parser-study/node-paired.json
pnpm bench:browser --candidate dist-core/index.js --baseline /tmp/parser-study/baseline/dist-core/index.js --cases /tmp/parser-study/cases.json --rounds 5 --output /tmp/parser-study/browser-paired.json
```

Initialization and the first operation are separate from warmed latency. Each
operation gets ten warm-ups, a five-call calibration targeting 25 ms batches,
and nine batches. Raw batch means and individual operation samples are retained.
Median latency uses batch means; p95 uses individual samples. Timer overhead and
browser resolution matter for very small operations. Browser reports state whether
cross-origin isolation was active.

Node retained-heap measurements hold multiple ASTs across explicit GC, five times
per workload. They measure the returned AST, not temporary allocation or peak memory.
These are JavaScript heap bytes; ArrayBuffer backing stores are separate.
Process RSS includes fixtures and validation and must not be reported as peak parser
memory. Browser heap measurements require runtime-specific support; do not substitute
RSS when that support is unavailable.

Consumer initialization, worker RPC, completion/reference results, compilation and
execution checks belong in consumer repositories. Preserve their baseline revisions
and rebuilt candidate artifacts. Worker round-trip latency includes message transfer
and scheduling; worker computation is measured separately. An unsupported editing
case must remain visible in the report rather than being presented as successful
autocomplete.

## Bounded correctness and scaling probes

```sh
pnpm probe:robustness --bundle dist-core/index.js --minimize --output /tmp/parser-study/robustness.json
# Repeat a flagged scaling family without rerunning all mutations.
pnpm probe:robustness --bundle dist-core/index.js --scaling-only --output /tmp/parser-study/scaling-repeat.json
```

The probe makes 200 mutations with seed `0x314cafe` from checked-in valid module
fixtures. Token deletion uses CPython's token boundaries. Other edits truncate,
replace delimiters or insert whitespace. It compares acceptance, all AST fields
including source positions, warnings and diagnostic fields against CPython 3.14.3.
ASTs are compared with SHA-256 of an iterative canonical encoding, so the reporting
code does not impose its own recursion limit on successfully parsed deep trees.
CPython keeps its default parsing recursion limit; only serialization gets a larger
limit.

Each JavaScript case runs in a fresh process with a five-second deadline. Long
expression chains, increasing list nesting, f-strings and syntax errors near EOF
are probed at approximately 4, 16 and 64 KiB. Parse time excludes AST serialization.
Reports include exceptions, timeouts and a conservative growth flag when time grows
more than twice as fast as input size. These cold probes detect pathological growth;
use warmed benchmarks to assess throughput.

Confirmed mismatches get at most 40 minimization attempts. The minimizer preserves
the discrepancy category and reports its remaining source even when that budget
does not reach a globally minimal case. Independent diagnostic defects remain
follow-ups. The full probe is reporting-only; the twelve checked-in smoke mutations
run through ordinary module tests and must pass. Regenerate them with
`node scripts/generate-robustness-smoke.mjs`; generator freshness is checked in CI.

## Profiles and acceptance

Reuse `prepare-cache-profile.mjs` and `profile-parser-cache.mjs` with a representative
subset of the verified corpus. See [cache profiling](parser-cache-profile.md) for
the commands. Instrumentation belongs in isolated diagnostic bundles and never in
production bundles or timed runs. Normalize sampled allocation bytes by completed
parses; retained AST bytes and sampled allocation volume describe different costs.
Cache counters establish which rules are busy without changing memoization policy.
V8 allocation samples cover JavaScript allocation, not complete native allocation.

Rank candidates by measured cost. Limit changes to two local allocation or repeated
work reductions. Compare paired medians, p95, retained heap and bundle sizes, and
keep the raw samples. A win on one workload does not excuse a repeatable regression
elsewhere. Do not add incremental parsing or redesign memoization during this pass.

Run parser tests, type/package checks, live CPython comparisons and both AST/parser
generator freshness checks for the final candidate. Preserve existing Python 2
coverage. Full profiling and browser measurement stay explicit commands; performance
CI remains reporting-only.

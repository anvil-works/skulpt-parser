# Performance CI reporting

`.github/workflows/performance.yml` runs on pull requests, pushes to `master` and
`next`, and manual dispatch. It builds the lean parser, optional Unicode-name
resolver and full frontend using the lockfile, Node 22 and CPython 3.14.3.

The job publishes a GitHub Actions summary and a 30-day artifact containing:

- `benchmark.json`: raw timings, retained AST memory, process startup/heap/RSS,
  environment, checkout commit and source/bundle hashes.
- `bundles.json`: raw, gzip and Brotli bytes plus SHA-256 for each bundle.
- `summary.md`: bundle sizes and medians across three fresh-process rounds.

There are no speed, memory or size regression thresholds. Build errors, benchmark
failures and CPython mismatches still fail the job. The existing package tests
retain their separate contract check that the lean bundle excludes the name data.
No PR comments, repository writes or external reporting service are needed.

## What the measurements mean

The existing `benchmark-python314.mjs` validates ASTs, diagnostics and warnings
against CPython before timing. Workloads cover a small assignment, synthetic
editor/long-line/Unicode sources, ten standard-library files and three invalid
inputs. Each round loads the lean parser in a fresh process. Parsing gets ten
warm-up iterations, calibrated batches and nine timing samples. Memory samples
use explicit GC while retaining multiple ASTs.

This job measures Python 3 source-to-AST in Node. It does not measure compilation,
Python 2 compatibility, browser execution or Anvil autocomplete. Anvil's worker
benchmarks remain separate; wiring those into CI can follow its reproducible
parser package dependency. The local Anvil pnpm link is unchanged.

Hosted-runner hardware, contention and GC vary. Compare repeated runs with matching
Node versions, source hashes and hardware. Bundle bytes are more reproducible than
timing or heap results. Retained AST bytes exclude temporary allocations; process
high-water RSS includes fixtures and validation. Neither is peak parser memory.
The optional resolver and full parser are measured for size, not timed as additional
engines. Their sizes are independent compressed artifacts, not a combined download.

## Local reproduction

From the parser checkout, with dependencies installed and CPython 3.14.3 available:

```sh
pnpm build:core
pnpm build:expression
mkdir -p /tmp/parser-performance
pnpm bench:python314 --python python3.14 --candidate dist-core/index.js --rounds 3 --output /tmp/parser-performance/benchmark.json
pnpm perf:report /tmp/parser-performance
```

Use `--rounds 1` for a shorter smoke run; CI always requests three rounds. The
reporter rejects a lean bundle whose hash differs from the measured artifact.
Reports are generated outside the checkout and are not committed as new baselines.

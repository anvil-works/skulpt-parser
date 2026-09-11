# Throwaway CPython bridge comparison

Decision evidence for [Validate the candidate toolchains and Python test bridges](https://github.com/anvil-works/skulpt-parser/issues/12), collected 2026-09-11 on macOS arm64. This is not production code or a parser benchmark.

## Result

Deno Python 0.4.6 successfully loaded CPython 3.14.3 using `DENO_PYTHON_PATH` and produced the same results as subprocess-based comparisons. Its missing automatic 3.14 discovery is not proof of incompatibility. This validates only the exercised calls on this machine, not all Python objects, callbacks, worker lifecycles or platforms.

The major improvement is avoiding a Python startup for each request. Node and Deno persistent/batched processes preserve that improvement; embedding is not necessary to obtain it. Differences among amortized variants are too small and this experiment too narrow to choose a runtime on speed alone.

## Workload and method

The same JavaScript subprocess harness runs under Node 26.7.0 and Deno 2.9.6. The oracle uses CPython 3.14.3, installed with uv in an isolated temporary location. Deno embedding uses pinned `jsr:@denosaurs/python@0.4.6`. Packages were cached before the recorded run; installation/download time is excluded. This is a pinned 3.14 sample, not a claim to test its latest patch release.

Thirteen synthetic source cases cover Unicode, closures, matching, exception groups, type parameters/defaults, type aliases, modern f-strings, template strings, comprehensions, syntax/indentation errors and a 120-assignment module. Each case returns an AST dump with positions, selected recursive symbol-table facts, or normalized syntax-error details. Five repetitions yield 65 requests per timed round; three rounds run in each fresh host process. Requests never execute user source. One simple request warms the oracle before timed rounds.

All seven combinations completed and produced identical SHA-256 result digests across rounds. Subprocesses exited successfully after stdin closure. Syntax-error cases are followed by valid requests without terminating the oracle. Unexpected host/setup failures and forced worker cancellation were not tested.

| Host | Bridge     | Median for 65 requests (ms) | Setup to first Python metadata (ms) |
| ---- | ---------- | --------------------------: | ----------------------------------: |
| node | spawn      |                      1425.4 |                                23.1 |
| node | persistent |                        19.0 |                                18.9 |
| node | batch      |                        14.9 |                                19.2 |
| deno | spawn      |                      1454.7 |                                25.5 |
| deno | persistent |                        18.7 |                                20.1 |
| deno | batch      |                        15.6 |                                20.0 |
| deno | ffi        |                        16.6 |                                28.8 |

`spawn` starts Python for each request. `persistent` sends one JSON-line request at a time to one Python process. `batch` sends the same 65 requests as one list to that persistent process. `ffi` imports the oracle once and calls the same JSON-returning Python function per request. The FFI bridge receives strings, not a traversal of rich Python proxy objects; the existing PEG test helper would need further validation for that use.

Raw timings, process versions, result digest and memory observations are in [results.json](results.json). `wall_ms` includes host startup, setup, three rounds and teardown, but excludes package download/install. `setup_ms` begins inside the JavaScript program, so it excludes host process launch. Processes run sequentially to reduce interference; normal background machine activity remains possible.

## Memory limits

The report records host final RSS in bytes and Python peak RSS in bytes. These are different measurements, taken at different times, and must not be added to claim a simultaneous peak. For FFI they describe the same host process, so adding them double-counts. Per-request spawning has no aggregate child peak measurement and reports null. No forced collection or long-running leak/retention test was performed. This evidence does not establish the eventual parser's memory use.

An initial measurement attempt found different `process.resourceUsage().maxRSS` units under Node and Deno on this platform; the final harness avoids comparing that API and uses byte-valued `memoryUsage().rss` for the host snapshot.

## Reproduce

Install Node 26.7.0, Deno 2.9.6, and a CPython 3.14.3 build with its shared library. Set executable and shared-library paths for your installation, then run:

```sh
export PROBE_PYTHON=/absolute/path/to/python3.14
export PROBE_DENO=/absolute/path/to/deno
export DENO_PYTHON_PATH=/absolute/path/to/libpython3.14.dylib
"$PROBE_PYTHON" docs/probes/python-bridge/run_probe.py
```

`PROBE_NODE` optionally selects a Node executable; otherwise PATH supplies `node`. On Linux use the matching `.so` library. The oracle uses Python's Unix `resource` module; Windows requires adapting that measurement before this harness can run. No cross-platform claim is made. The runner intentionally has minimal throwaway lifecycle code; it is not a reusable process manager.

The driver writes fresh results beside itself and verifies matching digests for successful runs. Inspect each exit code: identical digests among successful runs do not imply that every variant succeeded. The recorded results here have seven zero exit codes.

## Decision consequence

Node + pnpm + Rslib + Rstest remains a credible choice without losing the historical startup-amortization benefit. Deno embedding remains viable for this workload and should not be rejected as broken on 3.14. Select based on the paired toolchain probe and maintenance fit; do not infer a broad runtime speed winner from these small timings.

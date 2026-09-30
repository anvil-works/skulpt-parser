# Parser cache profiling

## Decision

Keep the existing memoized rules and replace per-token `Map<string, Memo>` rows
with indexed memo slots. Decorators allocate each rule's slot once at class
initialization; each parser invocation owns its own rows. Left-recursion seeds,
cached failures, token marks and second-pass cache clearing are unchanged.
There is no new generator policy or public parse option.

Individual cache switches did not establish a sufficiently consistent advantage.
The stronger result came from preserving cache reuse while reducing lookup and
allocation overhead. This is a local V8 result, not a claim about every engine.

## Method

Baseline parser commit: `2e0fd625b6eb5175403f2f189419525bec3079c6`.
Local Node: 26.7.0, macOS arm64, Apple M1 Pro. CPython: 3.14.3.

1. Build isolated, non-minified parser bundles with `Parser` exported for diagnosis.
   Production bundles and the IDE receive no instrumentation.
2. Count per-rule hits, cached failures, misses, writes and entries remaining at
   the end of parsing. Normal and diagnostic passes are reported separately.
   Left-recursive hits include recursion-seed lookups and must not be interpreted
   as ordinary redundant work.
3. Capture V8 CPU profiles at 500 µs intervals and allocation samples at 32 KiB,
   including objects collected during each 1.5-second sampling window. Normalize
   allocation estimates by completed parses. These are allocation estimates, not
   retained or peak memory.
4. Screen removal of five ordinary memo decorators individually: `target_with_star_atom`,
   `simple_stmt`, `await_primary`, `factor` and `conjunction`. Use five rotating-order
   fresh-process rounds over seven workloads, without profiling. Keep every
   left-recursive decorator.
5. Test indexed storage separately. Validate all 17 workloads against CPython and
   compare minified bundles over three alternating-order fresh-process rounds with
   the existing benchmark. Consumer worker benchmarks are maintained separately
   by the consuming project.

The screening run was exploratory. It showed small mixed gains and large tiny-input
outliers, including an apparent slowdown for indexed slots. That tiny-input slowdown
did not reproduce in the full benchmark comparison. No rule-selection
change was kept on the strength of those screening numbers.

## V8 findings

Memo wrappers plus `cacheAt` account for about 22–39% of self CPU samples on the
valid baseline workloads. Indexed storage reduces that share to about 13–26%.
These proportions come from non-minified diagnostic builds, so the unprofiled
minified benchmarks below are the evidence for user-facing speed.

Map writes are a prominent allocation source. Indexed slots reduce sampled bytes
allocated per parse by about 13–17% across the valid workloads. Per-rule hits,
misses, writes and final entries match exactly between the Map and slot versions
for all seven profiling workloads. Returned AST memory is not expected to shrink:
the cache is temporary parse state, separate from the returned tree.

| Workload                | Map sampled bytes / parse | Slots sampled bytes / parse | Change |
| ----------------------- | ------------------------: | --------------------------: | -----: |
| small                   |                    14,880 |                      12,387 | -16.8% |
| synthetic-editor-module |                 1,689,638 |                   1,467,368 | -13.2% |
| synthetic-long-line     |                 3,610,448 |                   3,022,604 | -16.3% |
| synthetic-unicode       |                 1,667,850 |                   1,452,831 | -12.9% |
| typing.py               |                28,353,112 |                  24,358,840 | -14.1% |
| json/decoder.py         |                 3,360,810 |                   2,887,156 | -14.1% |
| invalid-editor          |                    25,223 |                      24,846 |  -1.5% |

## Unprofiled parser results

Medians across three rounds; timings in milliseconds. Every timed frontend case
first passes independent CPython AST/error/warning comparison.

| Workload                   |  Map ms | Slots ms | Change |
| -------------------------- | ------: | -------: | -----: |
| small-assignment           |  0.0120 |   0.0106 | -11.6% |
| synthetic-editor-module    |  1.3879 |   1.1765 | -15.2% |
| synthetic-long-line        |  2.5293 |   1.9703 | -22.1% |
| synthetic-unicode          |  1.5690 |   1.3384 | -14.7% |
| ast.py                     |  5.9449 |   4.9034 | -17.5% |
| dataclasses.py             | 11.8539 |  10.1581 | -14.3% |
| enum.py                    | 19.4278 |  16.0787 | -17.2% |
| typing.py                  | 25.9163 |  24.3810 |  -5.9% |
| contextlib.py              |  4.7952 |   3.9399 | -17.8% |
| inspect.py                 | 26.7125 |  23.9857 | -10.2% |
| pathlib/**init**.py        | 10.9396 |   9.2680 | -15.3% |
| asyncio/tasks.py           |  7.4673 |   6.3229 | -15.3% |
| json/decoder.py            |  3.1868 |   2.8386 | -10.9% |
| unittest/mock.py           | 25.9561 |  23.7469 |  -8.5% |
| invalid:if x:\npass        |  0.0413 |   0.0380 |  -8.0% |
| invalid:résumé = (\n x y\n |  0.0636 |   0.0584 |  -8.3% |
| invalid:x y\n]             |  0.0382 |   0.0354 |  -7.3% |

The lean bundle changes from 37,099 to 37,096 bytes gzip. Brotli grows by 24 bytes;
these differences are negligible. Module-load heap is effectively unchanged.
Process high-water RSS is noisy: slots range from 217,584 to 233,552 KiB, while Map
ranges from 210,896 to 231,040 KiB. The slot median is higher. This does **not**
establish a peak-RSS reduction despite lower sampled allocation volume.

## Reproduction and evidence

The profiling helpers are diagnostic tools, not public parser APIs. From a checkout
with dependencies installed, prepare an isolated bundle and a synthetic corpus:

```sh
node scripts/prepare-cache-profile.mjs /tmp/parser-profile
python3.14 scripts/benchmark_python314_sources.py > /tmp/parser-profile/cases.json
node --expose-gc scripts/profile-parser-cache.mjs /tmp/parser-profile/profile-dist/index.js /tmp/parser-profile/cases.json stats /tmp/parser-profile/results
node --expose-gc scripts/profile-parser-cache.mjs /tmp/parser-profile/profile-dist/index.js /tmp/parser-profile/cases.json cpu /tmp/parser-profile/results
node --expose-gc scripts/profile-parser-cache.mjs /tmp/parser-profile/profile-dist/index.js /tmp/parser-profile/cases.json heap /tmp/parser-profile/results
```

`prepare-cache-profile` requires a new directory and copies source before building.
It exports rule labels in generated decorator order for indexed counters. The
profiler supports the old Map cache too; run these helpers from a checkout of the
baseline to reproduce the before profiles. CPU and allocation modes do not install
cache counters. Never use their elapsed times as benchmark results.

For the performance comparison, build minified baseline/candidate core bundles
and run `pnpm bench:python314 --candidate <candidate> --baseline <baseline> --rounds 3 --output <report.json>` with CPython 3.14.3 available.

- [Per-rule counts](benchmarks/cache-rule-counts.json)
- [Exploratory rule-switch screen](benchmarks/cache-rule-screen.json)
- [V8 CPU and allocation summaries](benchmarks/cache-v8-summary.json)
- [Full Node benchmark samples](benchmarks/cache-slots-node.json)

Raw `.cpuprofile` and `.heapprofile` captures stay outside the repository. Open
`.cpuprofile` files in DevTools Performance and `.heapprofile` files in Memory.
The local experiment capture is `/tmp/parser-cache-study`; summaries retain the
measurements and bundle hashes without committing bulky V8 profiles.

## Validation

All 3,770 tests pass with the pinned CPython 3.9.25 baseline oracle. Typechecks,
core/full package checks and the live CPython 3.14.3 corpus also pass. The final
core bundle is byte-identical to the measured indexed-slot artifact. Cache policy and generated grammar remain
unchanged. The local linked core build is refreshed only with the normal optimized
bundle, never the profiling entry.

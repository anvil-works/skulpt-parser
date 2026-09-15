# Python 3.14 frontend performance

Run the standalone production build and benchmark it against an optional earlier frontend bundle and a separately built Skulpt bundle:

```sh
pnpm build:expression
pnpm bench:python314 -- --skulpt /path/to/skulpt/dist/skulpt.min.js \
    --skulpt-commit FULL_COMMIT --legacy-stdlib /path/to/python3.9/stdlib \
    --output /tmp/parser-performance.json
```

The script also accepts `--candidate`, `--baseline`, `--rounds` and `--python`. CPython 3.14.3 is required to generate expectations. The optional legacy stdlib directory supplies source only; CPython 3.14 remains the AST oracle. Source hashes and bundle hashes are recorded. Preserve the exact source versions, bundles and runtime when reproducing comparisons.

Each engine runs in a fresh Node process for each round, with engine order rotated between rounds. Defaults are three rounds, ten warmup parses, then nine timed batches calibrated to about 25 ms each. File I/O, CPython execution and AST verification are outside timing. The frontend's ASTs, warnings and selected diagnostic fields must match CPython before measurement. Skulpt runs with `Sk.python3`; its source-to-AST time includes both `Sk.parse` and `Sk.astFromParse`. Skulpt's different AST representation is not compared structurally. Unsupported files are reported and excluded from ratios.

Inputs include a tiny assignment, synthetic editor-sized functions, a long line and Unicode identifiers, ten current stdlib files, optional older stdlib files, and three malformed inputs. Synthetic cases are labeled; they are not private Anvil application code. Diagnostic timing reports rejection latency, not matching Skulpt error quality.

The report separates module-load time, the first parse of the tiny assignment, warmed source-to-AST latency, and retained heap per AST. Retained heap uses the median of five batches with forced GC and 16–1,024 live ASTs depending on source size; noisy negative deltas are left visible. Load heap is the post-GC increase after importing/configuring the engine. Process maximum RSS includes the harness, reference corpus, engine and all workloads; it is not per-parse peak memory. Startup values are single observations per fresh process and include V8 initialization effects. Heap and RSS measurements are exploratory, not portable limits.

Bundle sizes include raw, gzip and Brotli bytes. The frontend is a parser bundle; Skulpt's bundle includes the runtime and compiler. Their total sizes are not a parser-only size comparison, nor a prediction of the incremental cost after integration. These measurements use Node, not browser engines, and do not measure compilation or code execution.

No performance CI threshold is set yet. Keep the raw reports as artifacts and establish variance before choosing budgets. Per-rule caching can help or hurt, so preserve upstream memoization annotations until measurements justify individual changes.

## Baseline, September 15, 2026

[Raw report](benchmarks/python314-baseline.json), Node 26.7.0 on Apple M1 Pro arm64. Frontend runtime at `401e7ff`; upstream Skulpt master at `ae5f4628e319bd51d26fc3e920baabd3803cacd5`. Skulpt was built using its production webpack/Closure build, with `NODE_OPTIONS=--openssl-legacy-provider`. The sibling working checkout was not used for the build. Older source files come from CPython 3.9.25.

Values below are medians of three fresh-process runs. Speed ratio is Skulpt time divided by frontend time. Retained AST memory has different fields and value representations in the two engines.

| Shared valid input            | Frontend ms | Skulpt ms | Ratio | Retained KiB/AST, frontend / Skulpt |
| ----------------------------- | ----------: | --------: | ----: | ----------------------------------: |
| small-assignment              |       0.010 |     0.009 | 0.96× |                           0.8 / 0.6 |
| synthetic-editor-module       |       1.194 |     2.307 | 1.93× |                         89.7 / 85.2 |
| synthetic-long-line           |       2.270 |     3.443 | 1.52× |                       137.3 / 109.3 |
| legacy-stdlib/json/decoder.py |       2.463 |     4.331 | 1.76× |                       240.7 / 167.1 |
| `pathlib/__init__.py`         |       9.483 |    16.115 | 1.70× |                       651.9 / 618.5 |
| json/decoder.py               |       2.761 |     4.626 | 1.68× |                       245.8 / 174.4 |

Skulpt rejects twelve of the eighteen valid inputs, including three older stdlib files. Those are coverage differences, not speed wins. Tiny-input and diagnostic latency favor Skulpt. Nontrivial shared inputs favor the new frontend; retained AST memory is higher on the displayed shared inputs. This does not establish performance in an Anvil IDE session or in another JavaScript engine.

The frontend is 866,443 raw / 248,599 gzip / 185,680 Brotli bytes. Skulpt's whole runtime is 618,354 / 163,304 / 132,554 bytes in this build. The new parser is larger even against that broad comparator. Its Unicode-name database is a major bundle cost; sharing it with Skulpt remains an integration concern.

A CPU profile of the frontend identifies memo wrappers, token construction and name construction among the leading sampled functions. First experiments should reduce work or allocations there while preserving grammar and CPython-tested behavior. Do not infer a memoization policy change from a single aggregate profile.

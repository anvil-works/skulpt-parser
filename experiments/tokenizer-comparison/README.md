# Full Python 3.14 tokenizer comparison

The CPython-shaped TypeScript scanner is the stronger default candidate from this experiment. It tracks upstream control flow more closely, matches more malformed-input behavior, ships fewer compressed bytes, and is faster on the measured standard-library modules. The regex candidate is viable and faster on Unicode-heavy interpolation. Neither experiment is a production parser or an architecture decision.

## Pinned implementations

- [Regex candidate and maintenance report](https://github.com/anvil-works/skulpt-parser/blob/baa81cfa61734b30582bc2c9939c4f033658dd72/docs/research/full-regex-tokenizer.md), commit `baa81cfa61734b30582bc2c9939c4f033658dd72`.
- [CPython-shaped candidate and source correspondence](https://github.com/anvil-works/skulpt-parser/blob/dbcc7ed0753063fdb4748bb64ddc28511976cb1f/docs/research/full-cpython-tokenizer.md), commit `dbcc7ed0753063fdb4748bb64ddc28511976cb1f`.
- Oracle: CPython 3.14.3, `_tokenize.TokenizerIter`, both `extra_tokens=True` and `False`, with source supplied through `StringIO.readline`.
- Build: Rslib 1.0.0, browser-targeted minified ESM, complete pinned Unicode 16 tables included, no runtime dependencies. Declarations are outside runtime byte totals.
- Measurements: Node 26.7.0, macOS arm64, Apple M1 Pro. Browser-targeted output was executed in Node, not in a browser.

## Correctness

The evaluator compares complete token streams: token kind, text, start/end codepoint coordinates and source-line text. Errors compare kind, message, start/end coordinates and source text. Exact results below exclude warning parity. Both implementations omit warning emission; the corpora contain warning-producing inputs.

| Corpus                                                |   Regex exact | CPython-shaped exact |
| ----------------------------------------------------- | ------------: | -------------------: |
| 804 shared sources, both modes                        | 1,608 / 1,608 |        1,608 / 1,608 |
| 52 stdlib modules, 500 damaged-source edits, 9 limits | 1,122 / 1,122 |        1,122 / 1,122 |
| 4,000 random token-fragment sources                   | 7,900 / 8,000 |        8,000 / 8,000 |
| 1,218 numeric/prefix/continuation cases               | 2,436 / 2,436 |        2,436 / 2,436 |
| 517 f/t/raw/triple-string cases                       | 1,026 / 1,034 |        1,026 / 1,034 |
| Five benchmark inputs, both modes                     |       10 / 10 |              10 / 10 |

These are development corpora. Implementers received failing cases and corrected their scanners. The stdlib/edit corpus was independently assembled, but final scores are after feedback, not untouched holdout scores. Corpora overlap in features and can repeat sources; adding their counts would not give a unique conformance-case count.

The independent source corpus initially exposed 92 regex mismatches and four CPython-shaped mismatches. Regex fixes concerned error precedence, locations, interpolation/EOF state and input handling. The CPython-shaped fixes rejected unpaired JavaScript surrogates instead of silently replacing them during UTF-8 encoding. Both subsequently matched all 507 expected errors in that corpus.

Of the remaining 100 regex random-corpus mismatches, 99 involve bare carriage returns and private-iterator behavior, including UTF-8 token splitting and `UnicodeDecodeError`. One is a damaged f-string in permissive extra-token mode, recorded in the candidate report. No strict random-corpus mismatch without a bare CR remains. The result is stronger diagnostic correspondence for the CPython-shaped candidate, though much of this particular score difference concerns unusual source-adapter behavior.

The eight string-matrix mismatches in each candidate are deliberate departures from an upstream anomaly. CPython 3.14.3's private iterator raises `MemoryError` on examples such as a triple-quoted template string with a newline in its format specification. `ast.parse` accepts the same example. Both candidates return tokens and do not emulate that failure. These mismatches remain visible in the results.

Tokenization cannot supply every CPython syntax error. Invalid grammar rules, literal decoding, AST construction and later compilation checks need their own upstream-aligned implementation. This experiment does not verify those stages. The CPython-shaped scanner also omits internal interpolation metadata not exposed by the iterator; parser integration must implement the metadata/actions needed for debug expressions and template strings.

## Shipped size

These are complete scanner modules, including Unicode tables, token objects and diagnostics. They exclude the parser, AST classes, symbol table, compiler, Skulpt runtime and test oracle.

| Candidate      | Minified bytes | Gzip bytes | Brotli bytes |
| -------------- | -------------: | ---------: | -----------: |
| Regex          |         36,074 |     13,598 |        9,208 |
| CPython-shaped |         42,237 |     11,818 |        8,632 |

The CPython-shaped scanner has more uncompressed code but compresses better: 1,780 fewer gzip bytes, about 13%, or 576 fewer Brotli bytes. This evidence does not support choosing regex to avoid a large compressed scanner payload. It does not settle total frontend build size.

## Warm speed

All inputs were checked against the oracle before measurement. Each call returns and retains a complete parser-mode token array until consumed. Times include input preparation inside the scanner, position calculation and token-object creation. No Python process participates in timing.

Three fresh processes per candidate/input, alternating candidate order. Each process performs a cold first call, 30 warmup calls, calibrates a batch, then takes 11 batches. Table values are medians of the three per-process medians. Raw samples, first-call times and local module-import times are in `measurements.json`. Import time excludes process startup and network transfer.

| Input                          | UTF-8 bytes | Tokens | Regex ms | CPython-shaped ms |
| ------------------------------ | ----------: | -----: | -------: | ----------------: |
| Small function                 |          47 |     21 |  0.00433 |           0.00462 |
| `shlex.py`                     |      13,756 |  2,309 |    0.616 |             0.547 |
| `tarfile.py`                   |     117,230 | 17,867 |    5.845 |             5.209 |
| One long numeric-list line     |      58,895 | 20,005 |    5.321 |             4.113 |
| Repeated Unicode/interpolation |      28,500 | 12,001 |    2.245 |             3.717 |

The CPython-shaped version uses about 11% less time on the two stdlib modules and 23% less on the long line. Regex uses about 40% less time on the Unicode/interpolation sample. The latter is a synthetic workload and its per-process medians ranged from 2.17 to 2.82 ms, so the precise advantage should not become a performance promise. These are scanner measurements, not source-to-AST or compilation measurements.

## Memory

A separate fresh process measures retained token heap, keeping temporary warmup results on a returned stack frame before forced GC. It then retains several complete results, collects again and divides the heap delta by the number of results. The retained batch contains roughly 100,000 tokens, bounded to 3–100 copies. Reported values are medians across three processes. This reduces single-result GC noise but remains a V8 heap estimate, not an exact object-size accounting.

| Input                  | Regex retained bytes/result | CPython-shaped retained bytes/result |
| ---------------------- | --------------------------: | -----------------------------------: |
| Small function         |                       5,026 |                                5,059 |
| `shlex.py`             |                     569,071 |                              509,153 |
| `tarfile.py`           |                   4,439,010 |                            4,004,888 |
| Long numeric-list line |                   4,300,588 |                            4,320,750 |
| Unicode/interpolation  |                   2,998,604 |                            2,669,309 |

The source strings already exist at the baseline. This metric concerns retained token output and any additionally retained scanner data, not total input-plus-output memory. Both APIs materialize all token objects and their location/source-line fields. A future pull-token interface may have different memory behavior.

Peak RSS is also recorded for the timing processes. For `tarfile.py`, medians were about 237.5 MiB for regex and 190.8 MiB for CPython-shaped. These are whole-process high-water marks during repeated allocation, including Node/V8 and uncollected memory, not the incremental memory cost of parsing a 117 KB file. Unicode/interpolation instead favoured regex peak RSS. No universal memory winner is established; the CPython-shaped implementation shows no general memory penalty in these measurements.

## Maintenance conclusion and next boundary

The regex experiment recognizes ordinary tokens and string chunks with regexes, but needs explicit indentation, delimiter, interpolation, prefix-validation, position and diagnostic state. It follows the old strategy but is a new lexer implementation, not a small patch to the old file. CPython behavior must be translated into its independently organized design on each update.

The CPython-shaped experiment translates scanner control flow and records source correspondence. It still needs review and maintenance when upstream changes; it is not an automatic C-to-TypeScript transpilation. Its closer organization gives a clearer starting point for upstream diagnostics and future updates, without the compressed-size penalty originally feared.

My recommendation is to use the CPython-shaped route as the working default for the next design decision, keeping these regex measurements as evidence for later profiling. This task does not decide visitor dispatch, the AST API, Python 2 syntax, or WASM. The separate WASM experiment should measure source-to-usable-AST and compilation once those pipelines can be compared; these scanner numbers are only one component baseline.

## Reproduce

Use isolated checkouts of the two candidate commits above. Set `REGEX_CHECKOUT` and `CPYTHON_CHECKOUT` to their paths, and `PROJECT_CHECKOUT` to this project's existing public source fixtures. Set `PYTHON314` to a CPython 3.14.3 executable. The standard-library corpus depends on the installed distribution; the recorded run used python-build-standalone CPython 3.14.3 on macOS arm64. Reproduction elsewhere can select a different root-module subset; inspect the generated names and counts.

From this directory:

```sh
pnpm install --frozen-lockfile
curl --fail --location https://raw.githubusercontent.com/python/cpython/v3.14.3/Lib/test/test_tokenize.py --output /tmp/test_tokenize-3.14.3.py
"$PYTHON314" build_corpus.py "$PROJECT_CHECKOUT" /tmp/test_tokenize-3.14.3.py
"$PYTHON314" independent_corpus.py independent.jsonl
"$PYTHON314" benchmark_inputs.py
"$PYTHON314" benchmark_oracle.py
TOKENIZER_ENTRY="$REGEX_CHECKOUT/probes/full-regex-tokenizer/tokenizer.ts" TOKENIZER_DIST=dist/regex pnpm exec rslib build
TOKENIZER_ENTRY="$CPYTHON_CHECKOUT/probes/full-cpython-tokenizer/tokenizer.ts" TOKENIZER_DIST=dist/cpython pnpm exec rslib build
node evaluate.mjs dist/regex/index.js corpus.json regex-shared.json
node evaluate.mjs dist/cpython/index.js corpus.json cpython-shared.json
node evaluate.mjs dist/regex/index.js independent.jsonl regex-independent.json
node evaluate.mjs dist/cpython/index.js independent.jsonl cpython-independent.json
node check_benchmark.mjs dist/regex/index.js regex-benchmark-parity.json
node check_benchmark.mjs dist/cpython/index.js cpython-benchmark-parity.json
node measure.mjs
```

The benchmark oracle hashes complete tokens with repeated source lines interned. This preserves source-line comparisons without duplicating a 59 KB line tens of thousands of times in JSON. Generated large corpora, source inputs and builds are ignored; scripts and measured result summaries are committed. The candidate reports explain their additional corpus generators. Those JSON corpora also work with this directory's evaluator.

The evaluator records mismatches in its output rather than exiting unsuccessfully, because the comparison intentionally preserves known failures. Inspect `exact`, `modes`, `expectedErrors`, `exactErrors`, `warnings` and `failures`; do not interpret successful process exit as full conformance.

Production source, the root checkout and the sibling CPython checkout were unchanged. The legacy Black hook cannot import `click._unicodefun`; this branch uses a pinned modern Black for formatting and skips only that broken hook when committing. Other configured checks run on the research files.

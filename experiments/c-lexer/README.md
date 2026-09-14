# Minimal C/WASM lexer experiment

Measured on 2026-09-14. This experiment establishes that a small C lexer can preserve the tested CPython token and error behavior without embedding a Python runtime. It does not establish a compelling browser performance advantage for returning JavaScript tokens. Keep TypeScript as the working tokenizer choice. The source-to-AST and compilation questions remain open in [issue 15](https://github.com/anvil-works/skulpt-parser/issues/15).

## Scope and provenance

`lexer.c` is a C translation of the CPython-shaped TypeScript scanner from experiment commit `dbcc7ed0753063fdb4748bb64ddc28511976cb1f`, based on CPython 3.14.3. It is an adapted port, not an unchanged extraction of CPython C. It includes indentation, Unicode 16 tables, ordinary strings, f-string and t-string lexical state, and structured errors. The PSF license is included. `generate_tables.py` generates the checked-in headers from that experiment's operator and Unicode JSON files.

Warnings and hidden interpolation metadata are omitted, as in the TypeScript reference. This is not a complete frontend: there is no AST construction, parser-level NFKC normalization, literal-value decoding, Python 2 compatibility mode, or Skulpt compilation. The corpus checks deliberately compare tokens and seven error fields, not warnings. No whole-interpreter WASM build was measured.

The C implementation uses WASI libc allocation, a 1 MiB stack reserve, generated tables and a small diagnostic formatter. Its sole actual import is `wasi_snapshot_preview1.random_get`, supplied by the loader through host crypto. There is no filesystem, Python runtime or threading requirement. State is owned by one instance and reset between synchronous calls. Allocation failure traps; it is not reported as a Python source error.

## Correctness

Both final binary builds, `-Oz` and `-O2`, pass all 2,730 token/error comparisons: 804 shared sources and 561 independent sources, each in strict and extra-token mode. The final `-Oz` build also passes 16 boundary comparisons covering unpaired surrogates and the precedence of earlier lexical errors. Native AddressSanitizer and UndefinedBehaviorSanitizer complete 2,730 corpus calls without a diagnostic. Native checks exercise both result formats but do not independently establish Unicode host-boundary semantics.

Every timed input's complete token stream matches the pinned CPython 3.14.3 oracle hash. These checks support the stated token/error scope, not general Python compatibility. Results are in `results/final-*.json` and `results/native-sanitizers-final.json`.

## Shipped size

Sizes include all emitted WASM and the minified JavaScript loader. Gzip level 9 and Brotli quality 11 are applied to each shipped file separately, then summed. Build tools and source files are not shipped. See `results/sizes.json` for individual artifacts, hashes, imports and exports.

| Implementation             | Raw bytes | Gzip bytes | Brotli bytes |
| -------------------------- | --------: | ---------: | -----------: |
| TypeScript reference       |    42,237 |     11,798 |        8,632 |
| Binary WASM `-Oz` + loader |    45,217 |     16,289 |       13,157 |
| Binary WASM `-O2` + loader |    52,047 |     18,141 |       14,513 |

The smallest WASM option adds 4,491 gzip bytes, about 38%, over the TypeScript reference. Replacing general `printf` formatting with a bounded formatter for the diagnostic formats actually used reduced WASM plus loader from 24,575 to 16,289 gzip bytes. The full corpus still passes. This was a useful dependency reduction, but did not make the artifact smaller than TypeScript.

## Warm performance

Final paired runs used an Apple M1 Pro, Node 26.7.0 and isolated headless Chrome 152.0.0.0. Each result uses 12 warmup calls and the median of nine batches, targeting 25 ms per batch with 1–500 iterations. Times include input conversion, scanning and construction of consumer-usable JavaScript tokens. They are exploratory single-machine measurements, not acceptance budgets.

| Input     | Node TS ms | Node WASM ms | Chrome TS ms | Chrome WASM ms |
| --------- | ---------: | -----------: | -----------: | -------------: |
| Small     |     0.0066 |       0.0057 |       0.0077 |         0.0072 |
| Medium    |      0.548 |        0.553 |        0.609 |          0.606 |
| Large     |      5.354 |        5.054 |        5.220 |          5.320 |
| Unicode   |      3.683 |        3.547 |        3.714 |          3.225 |
| Long line |      4.294 |        4.883 |        4.467 |          5.520 |

The browser result is mixed. Medium and large inputs are roughly tied, Unicode takes about 13% less time, and the long-line case takes about 24% more. Small-input differences are too small to justify a backend choice. Earlier runs showed larger Node gains; the final paired runs above supersede those timings.

The first interface returned JSON and took about 14.9 ms on the large Chrome input. A binary token table removed that bottleneck. Each record holds ten 32-bit fields describing token type, source spans and positions. The loader reconstructs normal JavaScript token objects, caching type names and repeated source lines. Errors still use JSON. Source storage remains valid until reconstruction finishes; returned objects own their strings.

Even with that interface, a representative large-input Node profile spends about 1.81 ms scanning and writing records, then 2.75 ms reconstructing JavaScript tokens. Input encoding and copying take about 0.024 ms combined. The record table is 714,680 bytes for 17,867 tokens. Keeping intermediate tokens inside WASM until an AST is ready may be more useful, but that has not been measured.

## Memory and initialization

For the large Node input, WASM linear-memory capacity is 4,259,840 bytes and remains unchanged after 100 repeated calls. This includes the reserved stack and allocator capacity; it is not a measurement of peak live C allocations. Releasing results does not shrink linear memory.

Retaining the resulting JavaScript tokens adds about 3.98 MB of JS heap for WASM and 3.89 MB for TypeScript. Heap use returns near its previous level after release. Whole-process peak RSS is about 243 MB for WASM and 217 MB for TypeScript, but includes the engine, measurement code and GC. It must not be interpreted as isolated lexer memory.

One large Chrome run records 2.3 ms for loader import, 3.5 ms localhost fetch, 0.2 ms compilation, 0.3 ms instantiation and 12 ms for the first call. These use local uncompressed HTTP and the source loader, while the size budget uses the minified loader. They do not predict real network startup. Safari and worker execution have not been tested.

## Reproduction

Use Zig 0.14.1 as a C compiler, not as the implementation language. The measured macOS arm64 archive was `zig-aarch64-macos-0.14.1.tar.xz` from ziglang.org, SHA-256 `39f3dc5e79c22088ce878edc821dedb4ca5a1cd9f5ef915e9b3cc3053e8faefa`. Build flags are recorded in `build.sh`; both variants use LTO. Rslib 1.0.0 and TypeScript 5.9.3 are pinned in `package.json` and `pnpm-lock.yaml`.

Run from this directory, supplying the corresponding tokenizer comparison checkout and a Zig executable:

```sh
pnpm install --frozen-lockfile
ZIG=/path/to/zig ./build.sh
TOKENIZER_ENTRY="$PWD/loader.mjs" TOKENIZER_DIST="$PWD/dist/loader" pnpm exec rslib build
cp /path/to/tokenizer-comparison/dist/cpython/index.js dist/reference.js
node measure-size.mjs
node check.mjs dist/lexer-binary-Oz.wasm /path/to/tokenizer-comparison/corpus.json results/recheck-shared.json binary
node check.mjs dist/lexer-binary-Oz.wasm /path/to/tokenizer-comparison/independent.jsonl results/recheck-independent.json binary
node check.mjs dist/lexer-binary-Oz.wasm boundary-cases.json results/recheck-boundaries.json binary
node --expose-gc benchmark.mjs typescript dist/reference.js large results/recheck-node-ts.json
node --expose-gc benchmark.mjs wasm-binary dist/lexer-binary-Oz.wasm large results/recheck-node-wasm.json
node browser.mjs typescript large binary-Oz results/recheck-chrome-ts.json
node browser.mjs wasm-binary large binary-Oz results/recheck-chrome-wasm.json
```

The reference bundle SHA-256 is `32e1fbfe9db74da5e83e9b9a1ce2745f2c54b66720517236281f01b9c65c191d`. Benchmark inputs and oracle hashes are checked in. The larger comparison corpora live with the preceding tokenizer experiment. `CHROME` can override the browser executable; the script creates its own temporary profile.

For native memory checks:

```sh
clang -std=c11 -O1 -g -fsanitize=address,undefined lexer.c native-check.c -o /tmp/skulpt-wasm-native-check
node native-check.mjs /tmp/skulpt-wasm-native-check /path/to/tokenizer-comparison/corpus.json /path/to/tokenizer-comparison/independent.jsonl
```

`results/*-final-*.json` contain final timings. Other timing files and `sizes-with-printf.json` preserve earlier experiment stages; `independent-initial.json` records surrogate failures fixed before the final runs. Commit `d581805` is the first working benchmark milestone before the formatter size reduction.

## Recommendation and next stage

Do not adopt lexer-only WASM on this evidence. It adds compressed size and linear memory without a clear browser speed advantage. Maintaining this C adaptation also requires a second implementation and a corpus-driven upstream update process; no upstream-update exercise has yet measured that cost.

Keep the experiment for a later source-to-AST comparison, where intermediate tokens can remain in WASM. First establish a matching Python 3.14 TypeScript AST baseline. Then measure usable JS AST output, diagnostics and warnings, followed by the same Skulpt adapter/compiler path. That larger experiment must include missing semantic behavior and measure all conversion costs before deciding whether WASM earns its maintenance cost.

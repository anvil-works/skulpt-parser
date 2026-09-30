# Parser performance and diagnostic follow-up

Baseline: parser commit `3c1b1d9e00f93d27774ce2c3b205e30c4a25fdcb`, whose core
bundle is unchanged from `f5182f0`. This pass fixes the three diagnostic-field
mismatches found by the bounded robustness probe and investigates work outside
token construction. Public APIs, AST types, grammar and memoization policy stay
unchanged. The optional AST optimizer is not enabled in these measurements.

## Diagnostic fixes

Pinned CPython 3.14.3 expectations now cover TabError metadata, commented NEWLINE
end offsets and error text when the scanner has advanced past the failing line.
Seven fixtures protect the minimized cases and Unicode/newline/indentation
variants through the production parser API. The standalone tokenizer stays
unchanged. See [the diagnostic contract](python314-diagnostics.md).

## Profiling and trials

The existing isolated CPU, allocation and cache profilers examined five generic
workloads and three representative consumer modules. Baseline `name()` accounts
for 7–15% of self CPU samples on identifier-bearing inputs. The two functions named
`literal` together use 5–15%; this aggregates token matching and literal decoding,
not a single hotspot. The numeric decoder is prominent on long numeric expressions.
Generated grammar actions allocate temporary arrays and AST candidates during
backtracking. These are separate costs from retained output AST memory.

The name trial skips NFKC normalization for ASCII identifiers. Unicode names still
normalize; independent CPython fixtures already cover mathematical/fullwidth
identifiers, keyword-like spellings and names following non-ASCII source text.

The selected guard compares a token's end byte and character columns. Equality
proves the entire physical line prefix is ASCII, including the identifier. This
adds no scan, cache or token metadata. ASCII names after earlier Unicode text on
the same line retain the original normalization path.

Earlier guards compared token widths or used a module-scoped ASCII regex. Their
small Unicode-input regressions prompted the cheaper prefix guard. A lazy Unicode
normalization cache was also rejected: it reduced repeated normalization but made
browser probes 11–23% slower. Fewer operations alone did not establish a win.

A separate literal-matching trial replaced the string-token suffix test with exact
f/t-string middle-token comparisons. It was rejected: mixed latency results
included a 4.7% slowdown in all five Node pairs on one consumer module. The original
literal matcher remains unchanged.

The selected guard reduces `name()` self CPU from 10.3% to 1.6% on the synthetic
editor module, 7.5% to 2.6% on `typing.py`, and 8.5% to 0.9% on f-strings. The
Unicode workload remains at 14.8% versus 14.6%. These are diagnostic CPU samples,
not instrumented latency comparisons. Memo-cache counts match on all eight inputs.

Sampled allocated bytes per parse move by -0.2% to -1.8% on generic ASCII workloads
and +0.6% on the Unicode probe. One sampling profile per artifact does not establish
a memory improvement. The accepted change primarily removes repeated CPU work.

## Accepted measurements

Node 22.15.0, CPython 3.14.3, Apple M1 Pro, MacBookPro18,3, ten logical CPUs,
32 GiB RAM, Darwin 24.5.0. Playwright 1.63.0 runs Chromium 153.0.8010.12 and
WebKit 26.6. The table uses medians of five paired candidate/dev.6 ratios. Negative
values mean faster parsing; the raw reports retain each pair and its baseline range.

| Generic workload        | Node median | Chromium median | WebKit median |
| ----------------------- | ----------: | --------------: | ------------: |
| synthetic-editor-module |       -6.1% |          -11.3% |         -9.0% |
| synthetic-long-line     |       -1.6% |           -0.4% |         +8.6% |
| synthetic-unicode       |       -0.1% |           -1.2% |         -7.0% |
| typing.py               |       -1.7% |          -14.2% |         -3.8% |
| scaling-fstrings-4096   |      -11.6% |           -4.8% |         -3.6% |

The editor and f-string Node comparisons improve in all five pairs. Small `typing.py`
and Unicode changes do not establish a useful Node win. The long numeric line has
only one identifier; its WebKit pairs range from -5.4% to +14.0%, with three slower
pairs. Baseline medians range from 1.092 to 1.281 ms. The candidate range overlaps,
and the ratio of cross-run medians is +2.4%, distinct from the median paired +8.6%.
This is an unchanged-work control with substantial variation, not evidence of an
identifier optimization improving numeric decoding. Its p95 pairs also move both ways.

Consumer-owned measurements show 5.5–15.6% paired median reductions in Node across
eleven individual modules. Three representative modules improve 8.3–11.6% in
Chromium and 5.6–9.7% in WebKit. Large editing-buffer worker round trips improve
about 1–3%; parsing is only part of analysis. Tiny worker requests have noisy tails
at the browser timer's scale. No whole-application execution speedup is claimed.

The earlier editor p95 concern does not repeat against dev.5: the final candidate
is 10.1% faster in all five pairs. Focused consumer compiler and browser p95 checks
also do not reproduce the earlier slowdowns. True first compilation uses a single
source and no prior measured parsing phase. First-operation differences remain
variable; this pass claims warmed improvements, not uniformly faster startup.

The core is 231,270 raw bytes, 36,507 gzip-9 bytes and 28,464 Brotli-11 bytes.
Relative to dev.6 this is +276 raw, +63 gzip and +65 Brotli bytes, including the
diagnostic fixes. The optional optimizer bundle remains unchanged and unused.

[The generic summary](benchmarks/parser-followup-20260930.json) contains source and
bundle hashes, paired metrics, baseline ranges, profiles and correctness counts.
Raw Node/browser/robustness captures are deterministic gzip-compressed JSON beside
it, prefixed `parser-followup-`; read them with `gzip -dc <report.json.gz>`.

## Validation and remaining work

The candidate passes 2,263 parser tests, including existing Python 2 coverage and
430 exact diagnostic fixtures; type/package checks, browser VM checks, the live
560-fixture/ten-stdlib CPython corpus, fixture regeneration and AST/parser generator
freshness checks also pass. The 200 mutations and twelve isolated scaling probes
have no mismatches, unexpected exceptions, timeouts or suspicious-growth flags.
Consumer checks pass 105 IDE tests, IDE typechecking, compiler execution/location
comparisons and public token/tokenize comparisons. All 119 checked-in consumer
modules match CPython AST values, spans and warnings and compile in the original
and both modern runtimes. Paired modern generated JavaScript is identical.

The separate [review report](parser-performance-followup-review.md) records both
code-review axes. The reviewed changes are included in `0.0.1-dev.7`. Publication
and consumer rollout follow separately.

Ranked follow-ups:

1. Correct source text for a generic error at a multiline STRING token. For
   `1 '''\na\n'''`, both dev.6 and this candidate report the whole token's lines;
   CPython reports only `1 '''`. Name, message and spans match. Eight minimized
   exec/eval, Unicode and CRLF probes confirm this pre-existing discrepancy. It is
   independent of the selected fast path and remains explicit in the raw evidence.
2. Investigate numeric literal decoding when numeric-heavy sources are a measured
   priority. The long-line profile identifies this cost; hoisting more constants
   alone has not established a win.
3. Investigate temporary grammar-action arrays and discarded AST candidates on
   backtracking. This needs a separate, narrow allocation experiment. Memoization
   redesign and incremental parsing remain deferred.

The malformed multiline token does not invalidate the bounded mutation results;
those 200 cases simply do not cover it. Diagnostic parity remains a tested contract,
not a claim that every CPython error path has been exhausted.

## Reproduction

Use Node 22.15.0 and CPython 3.14.3, with the lockfile's development-only Playwright.
Build immutable baseline/candidate bundles and verify correctness before timing.
Use five fresh-process/context paired rounds, alternating engine order, with the
existing calibrated batching. Run builds, tests and profiles separately from
latency comparisons.

```sh
pnpm bench:python314 --prepare-only --cases-output /tmp/followup/cases.json
pnpm build
pnpm bench:python314 --candidate dist-core/index.js --baseline /path/to/dev6.js \
  --cases /tmp/followup/cases.json --rounds 5 --output /tmp/followup/node.json
pnpm bench:browser --candidate dist-core/index.js --baseline /path/to/dev6.js \
  --cases /tmp/followup/cases.json --rounds 5 --output /tmp/followup/browser.json
node scripts/prepare-cache-profile.mjs /tmp/followup/profile
node --expose-gc scripts/profile-parser-cache.mjs \
  /tmp/followup/profile/profile-dist/index.js /tmp/followup/cases.json cpu /tmp/followup/profiles
node --expose-gc scripts/profile-parser-cache.mjs \
  /tmp/followup/profile/profile-dist/index.js /tmp/followup/cases.json heap /tmp/followup/profiles
pnpm probe:robustness --bundle dist-core/index.js --output /tmp/followup/robustness.json
```

Consumer workloads, compiler measurements and source policy stay in their consuming
repositories. Existing parser benchmarks also accept `--skulpt /path/to/original.js`
for source-to-AST comparison on shared syntax. This includes Skulpt's CST creation
and AST conversion, not merely its tokenizer/CST phase. It compares frontend cost,
not AST-shape equality; the modern parser's ASTs independently match CPython.

Initialization and first operation stay separate from warmed median/p95. Retained
heap measures returned results after GC, not transient allocation or peak parser
memory. Standalone initialization heap deltas can be negative when setup garbage
is reclaimed across asynchronous loading; they are not isolated parser footprints.
Sampled allocation profiles measure JavaScript allocations only. Browser
runs describe isolated local execution, not network or production UI latency.

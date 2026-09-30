# Performance and robustness results, 30 September 2026

The measurement and robustness tooling and two lexer allocation reductions are
selected for staging. The parser changes simplify token construction and replace
per-identifier prefix Sets with bounded prefix strings. The rebuilt core matches
the exact candidate measured in this report. Blanket regex and lookup-array hoisting
did not establish a latency win and remains excluded.

Later measurements of eleven checked-in consumer modules show paired median parsing
reductions of 17–25% in Node, 17–20% in Chromium and 5–10% in WebKit, with direct
compilation reductions of 5–14%. The full corpus of 119 modules preserves CPython
ASTs, positions and warnings, and paired compiler output is identical. Source policy,
raw reports and detailed results remain in the consuming repository.

This selects the lexer work for review; it does not claim every latency metric
improves or approve a release. Mixed tails and first-operation results still need a
focused check before release. The original generic measurements below remain unchanged.

The user clarified that small bundle increases are acceptable when reported. Bundle
size was not a rejection reason.

## Frozen reference and method

Parser reference: `3667c2129542f1dd457321c6b4e38ad1d4ebd8bd`, also byte-identical to
the installed dev.5 core. Node 22.15.0, CPython 3.14.3, Apple M1 Pro,
MacBookPro18,3, 10 logical CPUs, 32 GiB memory, Darwin 24.5.0.
Playwright 1.63.0 ran Chromium 153.0.8010.12 and WebKit 26.6 locally.

Three fresh baseline processes/contexts and five alternating-order paired comparisons
were used. Correctness precedes timing. The 39 workloads include stdlib sources,
Unicode, multiline input, 4/16/64 KiB scaling and 16/64 KiB unfinished buffers.
Initialization and first operations remain separate from warmed median and p95.
Raw batch means and individual latency samples are preserved.

Browser reports used for the final comparison release verification ASTs before timing
and keep oracle ASTs in the host process. Earlier browser captures retained those trees
and used a different timer-isolation setup; they are exploratory evidence, not the
final comparison. Builds, tests and profiling did not run alongside timed comparisons.

## Lexer trial

The trial removed the temporary object spread from token construction and replaced
per-identifier prefix Sets with bounded prefix strings. ASCII prefix folding also
avoided a lowercase conversion. Grammar, AST semantics, diagnostics and memoization
policy remained unchanged. Both patches and measured bundles are in the evidence archive.

These are median paired changes in warmed batch-median latency, with negative values
indicating faster parsing. Full per-case measurements and variability are in
[the generic summary](benchmarks/performance-robustness-20260930.json).

| Workload                    |   Node | Chromium | WebKit |
| --------------------------- | -----: | -------: | -----: |
| synthetic-editor-module     |  +1.8% |    -5.5% |  -7.0% |
| typing.py                   | -17.8% |   -18.6% |  -8.7% |
| scaling-fstrings-4096       | -25.3% |   -26.8% |  -5.9% |
| incomplete-definition-65536 | -19.6% |   -17.5% |  -9.7% |

The Node small editor-module p95 paired median rose 5.3% in the full run and 5.3%
in a focused repeat. Four of five pairs were slower in each run. This is borderline
evidence, with substantial variation, rather than a statistically conclusive loss.
The focused baseline p95 ranges from 1.166 to 1.360 ms. This caused the initial
conservative rejection; subsequent consumer measurements justify retaining the
candidate while keeping the tail concern visible. The release latency gate remains open.
Tiny-assignment slowdown did not reproduce in the focused repeat.

Sampled V8 allocation per parse fell 4.6–10.0% across the five representative
workloads. `make` self CPU share fell from 13.2% to 4.1% for `typing.py` and from
23.2% to 6.4% for the 4 KiB f-string workload. These are diagnostic non-minified
profiles, not production timings. Cache hit/miss/write counts and final entries
match exactly. Returned AST memory is effectively unchanged. An initial ~1% retained
heap flag for `asyncio/tasks.py` did not reproduce in five controlled pairs with
100 warm-ups and explicit release between GC samples.

| Core bundle     | Raw bytes | gzip bytes | Brotli bytes |
| --------------- | --------: | ---------: | -----------: |
| dev.5           |   231,052 |     37,181 |       28,392 |
| lexer trial     |   230,994 |     37,165 |       28,399 |
| constants trial |   231,130 |     37,251 |       28,482 |

The selected lexer changes add 7 Brotli bytes. The rejected constants trial adds
90 Brotli bytes and 70 gzip bytes. No package or consumer runtime has been published.

## Constant and regex hoisting

A separate trial hoisted three private lookup arrays plus the numeric and string
literal regexes. Test/exec regexes have no global or sticky state; the global numeric
separator regex is used only by `replace`. This preserved CPython expectations on
all 39 benchmark cases and preserved memo counts.

Allocation samples fell about 2–4%, but latency changes mostly remained within
variation. `inspect.py` and `json/decoder.py` were slower in all five Node pairs,
with median paired regressions of 6% and 7%. Browser results did not establish a
compensating, consistent win. Keep constants at their existing locations until a
specific hotspot and isolated change justify a hoist.

## Robustness findings

The 200 mutations and 12 scaling cases produced no acceptance, AST or warning
mismatch, unexpected JavaScript exception or timeout. Three independent diagnostic
field mismatches occur in both dev.5 and the lexer trial:

1. `match t:\n    \tcase (1 | 2) as chosen:\n        pass` produces different
   TabError offsets/end fields and line text. This is the most useful correctness follow-up.
2. `x=#` has a different SyntaxError end offset.
3. `e ias[:\n int]` preserves a newline in error text that CPython omits.

The bounded minimizer's source, expected record and actual record are preserved.
These are minimized within 40 attempts, not claims of globally minimal inputs.
One cold long-expression growth flag disappeared in three fresh scaling repeats.
Retain the flag and repeats; no pathological growth was confirmed by this probe.

## Follow-ups, in order

1. Recheck the small editor-module Node p95 and the mixed consumer tail/first-operation
   cases before release. The largest first-operation flag is a later module's direct
   compilation, with cross-round medians of 3.863 and 7.347 ms. Later modules share an
   already-active runtime, so isolate that case before calling it a startup regression.
2. Fix the minimized TabError diagnostic fields, then the assignment end offset and
   multiline error text. Keep each independent defect separate from optimization work.
3. Profile remaining `name`, `literal` and grammar-array costs before another local
   optimization. Memo hits remain high; this pass provides no reason to change policy.
4. Keep long expressions, nesting, f-strings and errors near EOF in scaling coverage.
   Broader memoization redesign and incremental parsing remain separate projects.

Unicode-name loading, constant folding, language features, publication and rollout
remain deferred.

## Validation and evidence

Parser tests: 2,067 passed, including the twelve deterministic smoke mutations and
existing Python 2 coverage. Type/package checks, live comparisons of 560 retained
sources plus ten stdlib modules, and both AST/parser generator checks passed for the
trial. Focused consumer tests, execution, tokenizer and location checks are recorded
in their consuming projects' reports. Two existing adapter execution goldens differ
under both baseline and trial; they are not new parser regressions.

Use [the workflow](performance-and-robustness.md) for commands,
[cache profiling](parser-cache-profile.md) for diagnostic captures and
[the implementation review](performance-robustness-review.md) for both review axes. Full raw reports,
profiles, manifests, tested bundles, patches and validation logs are saved locally in
`tmp/performance-pass/`. `evidence.tar.gz` contains the selected evidence; `README.md`
lists its commands and excluded exploratory captures. Performance CI remains
reporting-only. Only the small deterministic smoke set joins ordinary tests.

JavaScript allocation and retained heap exclude complete native/backing-store memory.
Process RSS is recorded where the existing tool records it, and is not interpreted
as peak parser memory. Browser runs describe isolated local execution.

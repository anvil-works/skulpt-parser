# Skulpt integration notes

The [compiler integration audit](skulpt-compiler-integration.md) maps the current
AST/compiler boundary, records probes against the deployed runtime, and proposes
the first guarded execution adapter. It distinguishes the deployed bundle from
the sibling repository's compiler branches.

During integration, review frontend functionality that Skulpt also needs and consider extracting it into a shared dependency. Unicode is a likely candidate: version-pinned identifier properties and normalization, Python string/code-point operations, and coordinate conversion where the consumers require the same semantics. Unicode identifier validation alone is not full Python Unicode support.

Do not create that dependency speculatively during the parser migration. First compare the actual implementations and contracts in the parser and Skulpt. Extract shared code when it avoids duplicate implementations or data tables, preserves CPython compatibility, and has acceptable bundle size, startup time and memory costs. Pay particular attention to shipping duplicate Unicode tables when both packages appear in an IDE bundle. Keep consumer-specific adapters in their respective projects.

The string migration now includes a complete Unicode 16 character-name and alias table for `\N{...}` escapes. The intended integration is a shared Unicode dependency so Skulpt and the parser do not ship duplicate data. Compare Skulpt's existing names, identifier properties and normalization coverage against the pinned version first; they are distinct capabilities, not interchangeable tables. Verify deduplication in the combined consumer build, along with startup and retained-memory costs. This extraction belongs to integration, after the shared contracts are established.

Python compatibility tests must derive expectations independently from a pinned CPython interpreter, either through a live oracle or generated fixtures whose freshness CI checks. Project-specific contracts that intentionally differ from CPython should be identified explicitly. Tests of AST construction do not establish source parsing compatibility.

## Performance CI

The separate reporting job is implemented in `.github/workflows/performance.yml`;
see [its commands and artifacts](performance-ci.md). It reports candidate bundle
sizes and source-to-AST measurements without blocking timing thresholds.

Comparing the candidate with the PR's actual base commit remains follow-on work,
especially for stacked PRs. Use the same Node version, build settings and inputs
for both revisions, and publish machine-readable samples beside the summary.

Shared runners are noisy; warm up both revisions, alternate their order and record
repeated samples and variability before choosing regression budgets. The current
memory report measures retained ASTs and process RSS, not peak parser allocation.
Bundle-size budgets can be introduced earlier because bytes are more reproducible.

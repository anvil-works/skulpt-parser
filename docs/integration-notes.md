# Skulpt integration notes

During integration, review frontend functionality that Skulpt also needs and consider extracting it into a shared dependency. Unicode is a likely candidate: version-pinned identifier properties and normalization, Python string/code-point operations, and coordinate conversion where the consumers require the same semantics. Unicode identifier validation alone is not full Python Unicode support.

Do not create that dependency speculatively during the parser migration. First compare the actual implementations and contracts in the parser and Skulpt. Extract shared code when it avoids duplicate implementations or data tables, preserves CPython compatibility, and has acceptable bundle size, startup time and memory costs. Pay particular attention to shipping duplicate Unicode tables when both packages appear in an IDE bundle. Keep consumer-specific adapters in their respective projects.

The string migration now includes a complete Unicode 16 character-name and alias table for `\N{...}` escapes. The intended integration is a shared Unicode dependency so Skulpt and the parser do not ship duplicate data. Compare Skulpt's existing names, identifier properties and normalization coverage against the pinned version first; they are distinct capabilities, not interchangeable tables. Verify deduplication in the combined consumer build, along with startup and retained-memory costs. This extraction belongs to integration, after the shared contracts are established.

Python compatibility tests must derive expectations independently from a pinned CPython interpreter, either through a live oracle or generated fixtures whose freshness CI checks. Project-specific contracts that intentionally differ from CPython should be identified explicitly. Tests of AST construction do not establish source parsing compatibility.

## Future performance CI

Add a separate reporting job once the parser path and benchmark corpus are stable. Report raw, gzip and Brotli bundle sizes and fixed source-to-AST benchmarks against the PR's actual base commit, which matters for stacked PRs. Use the same pinned Node version, build settings and inputs for both revisions. Publish machine-readable results and a readable summary in CI artifacts or the job summary.

Start with reporting rather than blocking timing thresholds. Shared runners are noisy; warm up both revisions, alternate their order and record repeated samples and variability before choosing regression budgets. Bundle-size checks can adopt budgets earlier because they are more reproducible. Add memory measurements separately once a repeatable method distinguishes retained AST size, parser peak allocation and runtime baseline. The incomplete expression bundle is not a full-parser size baseline. No new performance CI job is introduced by this note.

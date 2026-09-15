# Skulpt integration notes

During integration, review frontend functionality that Skulpt also needs and consider extracting it into a shared dependency. Unicode is a likely candidate: version-pinned identifier properties and normalization, Python string/code-point operations, and coordinate conversion where the consumers require the same semantics. Unicode identifier validation alone is not full Python Unicode support.

Do not create that dependency speculatively during the parser migration. First compare the actual implementations and contracts in the parser and Skulpt. Extract shared code when it avoids duplicate implementations or data tables, preserves CPython compatibility, and has acceptable bundle size, startup time and memory costs. Pay particular attention to shipping duplicate Unicode tables when both packages appear in an IDE bundle. Keep consumer-specific adapters in their respective projects.

Python compatibility tests must derive expectations independently from a pinned CPython interpreter, either through a live oracle or generated fixtures whose freshness CI checks. Project-specific contracts that intentionally differ from CPython should be identified explicitly. Tests of AST construction do not establish source parsing compatibility.

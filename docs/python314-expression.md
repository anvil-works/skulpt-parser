# Python 3.14 expression integration

This change connects the selected CPython-shaped TypeScript lexer, generated PEG rules, numeric decoder and structural AST. The internal `src/python314/expression.ts` entry point accepts source strings and produces an `Expression` tree. It is a migration slice, not a complete frontend release. The package's existing entry points continue to use the recovered parser; no consumer deployment or server change is required.

## Supported grammar

The slice includes names, numeric and singleton constants, unary/binary/boolean operations, comparisons, conditional expressions, attributes, slicing, tuple/list/set/dictionary displays, unpacking, await and parenthesized assignment expressions. It does not yet support calls, comprehensions, lambdas, strings, f/t-string AST construction, statements or the second-pass `invalid_*` diagnostic rules. Input outside the selected grammar is rejected; this entry point must not replace IDE or Skulpt parsing yet. General parse failures still have a basic syntax error, while tested lexer and numeric errors preserve upstream details.

`tools/generate314/parser.py` selects an explicit set of rules from the checksum-verified CPython 3.14.3 grammar and removes alternatives that depend on unselected rules, including alternatives inside groups. Remaining actions are translated into structural constructors or concrete sequence operations. Unknown semantic calls or ambiguous default actions fail generation. This deliberately avoids missing-helper proxies. Expand the selection and translator together with end-to-end fixtures as each next grammar section is ported.

The upstream pegen library computes left-recursive leaders and generates auxiliary rule structure. The runtime grows memoized left-recursive seeds until no further input is consumed. Other memoization follows upstream rule annotations; followers in a left-recursive cycle are not memoized. Allocation `CHECK` wrappers become direct JavaScript expressions because allocation failure throws; version guards are resolved against this fixed 3.14 target. Generated temporary slots use `any` because they hold heterogeneous token, node and sequence results; AST constructors retain their generated signatures.

## Lexer and positions

The lexer comes from the selected experiment at `dbcc7ed0753063fdb4748bb64ddc28511976cb1f`, based on CPython 3.14.3 lexer/tokenizer control flow. The corresponding five C reference files are checksum-pinned in `tools/upstream/cpython.json`. Its upstream license is retained in `licenses/CPython.txt`. Runtime dependencies are built-in JavaScript facilities plus generated operator and Unicode tables. `tools/generate314/lexer_tables.py` derives tables from the pinned interpreter; CI checks regeneration. The grammar and AST generators remain isolated from sibling checkouts.

The parser normalizes CR and CRLF to LF, matching CPython source parsing; the standalone tokenizer preserves its own input contract. The parser requests tokens lazily and retains them for backtracking. Tokens expose code-point positions and separate UTF-8 byte columns computed directly by the scanner; AST construction does not use the legacy UTF-16 conversion map. Unicode identifier validity uses the pinned tables; NFKC normalization uses JavaScript's built-in normalization. This is identifier support, not a complete Python Unicode/string runtime. Shared extraction candidates remain in `docs/integration-notes.md`.

The standalone tokenizer still supports regular and interpolation token streams. Its existing hidden interpolation-expression metadata is not implemented; f/t-string semantic integration must add it before claiming AST compatibility. Lexer warning paths report through an optional callback, silent when absent. Parser lookahead reuses cached tokens so warnings are not repeated during backtracking. No recovery mechanism is introduced.

## Verification and reproduction

144 end-to-end cases compare complete ASTs and warnings or error details with CPython 3.14.3. They include precedence and associativity, Unicode normalization and byte positions, slicing, unpacking and source-located lexer failures. 284 separate lexer cases compare token streams, error messages/ranges and warnings in both token modes, including deterministic malformed edits. Expected values come only from CPython; CI regenerates fixtures and rejects differences. The shared fixture serializer is used by both AST-factory and parsing fixtures, but does not call the TypeScript implementation.

```sh
pnpm upstream:prepare
pnpm generate:parser
python3.14 -m tools.generate314 --parser --check
python3.14 -m tools.generate314.lexer_tables
python3.14 tests/fixtures/generate_python314_expressions.py
python3.14 tests/fixtures/generate_python314_lexer.py
pnpm check
pnpm test
pnpm build:expression
pnpm test:expression-package
```

The regular test suite still needs `PYTHON` pointing at CPython 3.9.25 for the legacy oracle. The new fixture generators require CPython 3.14.3. The standalone build is an isolated browser-targeted ESM bundle in ignored `dist-expression/`. Its package smoke check runs selected CPython fixtures in a VM context without Node imports, testing the minified output and decorator behavior.

## Initial costs

On Node 26.7.0, macOS arm64, the standalone expression bundle is 65,970 bytes raw, 15,784 gzip and 12,014 Brotli. It includes the full lexer and selected expression grammar, so it is not a final full-parser size estimate. The current public JavaScript bundle is unchanged.

A small local comparison used 100 parses per sample, nine alternating-order rounds and the median after discarding the first two rounds. Results in milliseconds per parse:

| Input                                            | Legacy eval path | New expression path |
| ------------------------------------------------ | ---------------: | ------------------: |
| `a + b * (c - 2)`                                |           0.0172 |              0.0145 |
| 128 repeated arithmetic groups, 1,533 characters |            0.442 |               0.443 |
| 128 Unicode arithmetic groups, 2,557 characters  |            0.605 |               0.575 |

These are common-input measurements of an incomplete parser with a different AST representation, not evidence that the full migration is faster. Memory has not yet been measured. Tokens store native byte columns as numbers, avoiding additional position-array allocations. Memoization tuning remains a later measured exercise.

## Review order

Read the selection and action translation in `tools/generate314/parser.py`, then `src/python314/parser.ts` and `expression.ts`. Review the lexer against the checksum-pinned C reference files fetched by `pnpm upstream:prepare`, especially lazy scanning, native byte columns and warnings. The experiment SHA records development provenance; reproduction and review do not require that separate checkout. Finally inspect the CPython fixture generators, tests and CI freshness checks. Generated parser, tables and fixture JSON should be verified by regeneration, rather than treated as handwritten code.

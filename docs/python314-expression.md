# Python 3.14 expression integration

This change connects the selected CPython-shaped TypeScript lexer, generated PEG rules, numeric decoder and structural AST. The internal `src/python314/frontend.ts` entry point accepts source strings through `parseExpression` and produces an `Expression` tree. The same file also exposes the internal `parseModule` entry point. It is a migration slice, not a complete frontend release. The package's existing entry points continue to use the recovered parser; no consumer deployment or server change is required.

## Supported grammar

The slice includes names, numeric and singleton constants, unary/binary/boolean operations, comparisons, conditional expressions, attributes, slicing, tuple/list/set/dictionary displays, unpacking, await, parenthesized assignment expressions, calls, comprehensions, string/bytes literals, f/t-string AST construction, lambdas and yield expressions. All non-diagnostic rules reachable from the pinned grammar’s `eval` entry point are selected. This is grammar coverage, not a claim that every expression edge case has been verified. Module parsing now covers the non-diagnostic statement grammar documented in `docs/python314-modules.md`. The second-pass `invalid_*` diagnostic rules remain unimplemented. Input outside the selected grammar is rejected; this entry point must not replace IDE or Skulpt parsing yet. General parse failures still have a basic syntax error, while tested lexer and numeric errors preserve upstream details.

`tools/generate314/parser.py` selects rules from the checksum-verified CPython 3.14.3 grammar. It traverses the upstream `eval` and `file` dependencies and rejects missing non-diagnostic rules before pruning diagnostic alternatives. An upstream update cannot silently remove newly added module or expression syntax. Actions translate into structural constructors or concrete sequence operations. Unknown semantic calls and ambiguous value-producing actions fail generation; grouped lookahead needs only a success value. Future grammar updates must preserve this completeness check and add CPython-derived conformance fixtures.

The upstream pegen library computes left-recursive leaders and generates auxiliary rule structure. The runtime grows memoized left-recursive seeds until no further input is consumed. Other memoization follows upstream rule annotations; followers in a left-recursive cycle are not memoized. Allocation `CHECK` wrappers become direct JavaScript expressions because allocation failure throws; version guards are resolved against this fixed 3.14 target. Generated temporary slots use `any` because they hold heterogeneous token, node and sequence results; AST constructors retain their generated signatures.

## Lexer and positions

The lexer comes from the selected experiment at `dbcc7ed0753063fdb4748bb64ddc28511976cb1f`, based on CPython 3.14.3 lexer/tokenizer control flow. The corresponding five C reference files are checksum-pinned in `tools/upstream/cpython.json`. Its upstream license is retained in `licenses/CPython.txt`. Runtime dependencies are built-in JavaScript facilities plus generated operator and Unicode tables. `tools/generate314/lexer_tables.py` derives tables from the pinned interpreter; CI checks regeneration. The grammar and AST generators remain isolated from sibling checkouts.

The parser normalizes CR and CRLF to LF, matching CPython source parsing; the standalone tokenizer preserves its own input contract. The parser requests tokens lazily and retains them for backtracking. Tokens expose code-point positions and separate UTF-8 byte columns computed directly by the scanner; AST construction does not use the legacy UTF-16 conversion map. Unicode identifier validity uses the pinned tables; NFKC normalization uses JavaScript's built-in normalization. This is identifier support, not a complete Python Unicode/string runtime. Shared extraction candidates remain in `docs/integration-notes.md`.

The standalone tokenizer still supports regular and interpolation token streams. String actions obtain interpolation-expression metadata from the normalized source using grammar-selected boundaries and CPython’s comment-removal rules. The source is byte-indexed once, lazily, when a debug field or t-string requires this metadata. Token middles retain raw-mode information; doubled braces retain the full parser byte span alongside the shorter tokenize span. Lexer warning paths report through an optional callback, silent when absent. Parser lookahead reuses cached tokens so warnings are not repeated during backtracking. No recovery mechanism is introduced.

## Verification and reproduction

658 end-to-end cases compare complete ASTs and warnings or error details with CPython 3.14.3. Another 57 CPython-derived cases check rejection parity for malformed expressions and string combinations; they do not claim matching second-pass diagnostic wording. They include precedence and associativity, Unicode normalization and byte positions, slicing, unpacking and source-located lexer failures. 284 separate lexer cases compare token streams, error messages/ranges and warnings in both token modes, including deterministic malformed edits. Expected values come only from CPython; CI regenerates fixtures and rejects differences. The shared fixture serializer is used by both AST-factory and parsing fixtures, but does not call the TypeScript implementation.

```sh
pnpm upstream:prepare
pnpm generate:parser
python3.14 -m tools.generate314 --parser --check
python3.14 -m tools.generate314.lexer_tables
python3.14 -m tools.generate314.string_names
python3.14 tests/fixtures/generate_python314_expressions.py
python3.14 tests/fixtures/generate_python314_lexer.py
pnpm check
pnpm test
pnpm build:expression
pnpm test:expression-package
```

The regular test suite still needs `PYTHON` pointing at CPython 3.9.25 for the legacy oracle. The new fixture generators require CPython 3.14.3. The standalone build is an isolated browser-targeted ESM bundle in ignored `dist-expression/`. Its package smoke check runs selected CPython fixtures in a VM context without Node imports, testing the minified output and decorator behavior.

## Initial expression-only costs

On Node 26.7.0, macOS arm64, the standalone expression bundle is 65,993 bytes raw, 15,793 gzip and 11,970 Brotli. It includes the full lexer and selected expression grammar, so it is not a final full-parser size estimate. The current public JavaScript bundle is unchanged.

A small local comparison used 100 parses per sample, nine alternating-order rounds and the median after discarding the first two rounds. Results in milliseconds per parse:

| Input                                            | Legacy eval path | New expression path |
| ------------------------------------------------ | ---------------: | ------------------: |
| `a + b * (c - 2)`                                |           0.0172 |              0.0145 |
| 128 repeated arithmetic groups, 1,533 characters |            0.442 |               0.443 |
| 128 Unicode arithmetic groups, 2,557 characters  |            0.605 |               0.575 |

These are common-input measurements of an incomplete parser with a different AST representation, not evidence that the full migration is faster. Memory has not yet been measured. Tokens store native byte columns as numbers, avoiding additional position-array allocations. Memoization tuning remains a later measured exercise.

## Review order

Read the selection and action translation in `tools/generate314/parser.py`, then `src/python314/parser.ts` and `expression.ts`. Review the lexer against the checksum-pinned C reference files fetched by `pnpm upstream:prepare`, especially lazy scanning, native byte columns and warnings. The experiment SHA records development provenance; reproduction and review do not require that separate checkout. Finally inspect the CPython fixture generators, tests and CI freshness checks. Generated parser, tables and fixture JSON should be verified by regeneration, rather than treated as handwritten code.

## Calls and comprehensions

Call argument rules now preserve positional/starred argument order and keyword/double-starred order, including starred arguments following explicit keywords. CPython temporarily packs these fields into a dummy `Call`; the TypeScript actions use an internal `{args, keywords}` record because the placeholder node and its locations never reach the final AST. The final `Call` still comes from the generated structural constructor with the source span of the complete invocation.

Comprehension targets follow the pinned `Parser/action_helpers.c` context conversion: names, attributes and subscripts receive a new context; tuple/list/starred targets recursively copy the relevant children. Attribute bases and subscript expressions retain their existing load contexts. Nodes are copied rather than mutated because PEG alternatives can reuse cached results. Fixtures include nested unpacking, call-based attribute/subscript targets, multiple filters/clauses, async forms and generator arguments.

These tests compare `ast.parse` behavior, not Python compilation. Some trees that parse successfully, such as duplicate keyword arguments or assignment expressions in comprehension iterables, are rejected by later compiler validation. That validation is not introduced here. Future performance CI is recorded in `docs/integration-notes.md`; this change adds no timing gate.

With calls and comprehensions included, the standalone bundle is 78,691 bytes raw, 17,209 gzip and 13,120 Brotli on Node 26.7.0. This is an increase of 12,698 raw / 1,416 gzip / 1,150 Brotli bytes from the preceding expression slice. The public bundle remains unchanged. Timing and memory comparisons for these newly supported constructs remain future measurement work.

## Strings and interpolation

`src/python314/strings.ts` ports the pinned CPython string actions: escape decoding, adjacent literal folding, conversion checks, format specifications, debug text and `JoinedStr`/`TemplateStr` construction. Nested interpolation expressions use the same generated parser. They do not invoke a second parser on substrings. Ordinary strings preserve lone surrogate values; bytes use `Uint8Array`. Escape warnings use the optional warning callback and are deduplicated across backtracking. Compile-time validation and the second-pass invalid rules remain separate work.

`\N{...}` lookup covers Unicode 16 character names and aliases, excluding named sequences as CPython does. `tools/generate314/string_names.py` generates the table from CPython 3.14.3 and the vendored Unicode 16 `NameAliases.txt`; its Unicode license is retained beside the file. Hangul and hexadecimal names use compact algorithms/ranges. Remaining names use sorted blocks of 32 with shared prefixes removed. A lookup decodes one block, without constructing a full name map. CI regenerates this data. Unicode names and properties remain candidates for a shared Skulpt dependency; this change does not create one.

The complete name database makes this expression build substantially larger. Bundle measurements below include the database, rather than hiding it as an uncounted external asset. Before consumer rollout, decide whether to share the data with Skulpt or provide an explicitly configured smaller consumer build. No default export or data-loading policy is introduced here. Basic parse-error wording is still incomplete. Malformed format-spec escapes are normalized to `SyntaxError`; CPython 3.14.3 can leak `UnicodeDecodeError` for that path, which is not a useful frontend error contract.

After string integration, the standalone expression bundle is 729,433 bytes raw / 233,032 gzip / 173,533 Brotli on Node 26.7.0. Relative to #23 this adds 650,742 / 215,823 / 160,413 bytes. The existing public bundle remains 181,027 raw / 34,144 gzip / 26,625 Brotli. No parsing-speed or peak-memory result is claimed. Three additional CPython-derived cases check the explicit normalization of leaked format-spec codec errors.

## Lambdas and yield expressions

The selected lambda rules cover positional-only parameters, defaults, variadic parameters and keyword-only arguments. `src/python314/parameters.ts` assembles the grammar’s intermediate groups using CPython’s action-helper field ordering. Positional defaults span positional-only and ordinary parameters; required keyword-only arguments retain null entries in `kw_defaults`. Empty lambda argument lists use the structural `arguments` factory directly. The translator enforces the current `type_comments=False` contract for both lambda and function parameters.

`Yield` and `YieldFrom` use generated AST constructors. Parentheses, tuple values, unpacking and placement in interpolation fields follow the upstream grammar. This entry point matches `ast.parse(mode="eval")`, which can construct yields outside a generator and lambdas with duplicate parameter names. Those later compilation errors are not introduced as parser restrictions.

95 additional complete AST/warning cases and 29 additional rejection cases come from CPython 3.14.3. They cover all lambda parameter alternatives, mixed default/required slots, nested lambdas, generator lambdas, Unicode positions, interpolation and parse-versus-compile boundaries. The standalone browser checks include mixed lambda parameters, a generator lambda and a yield-from t-string. The expression suite now has 718 cases, including three explicit codec-error normalization cases from the preceding slice.

The standalone bundle is 737,070 bytes raw / 233,957 gzip / 174,303 Brotli on Node 26.7.0, an increase of 7,637 / 925 / 770 bytes over #24. Unicode names remain included in these totals. Public exports remain unchanged; no speed or memory improvement is claimed. Statements, second-pass diagnostics, semantic validation and consumer integration remain outstanding.

# Python 3.14 parser diagnostics

The internal frontend follows CPython's two-pass design. Successful source returns after the ordinary grammar pass. On a null parse result, the parser retains its token buffer and flags, clears memoized rule results, resets its mark and enables all reachable upstream `invalid_*` rules. Diagnostic failure never becomes a successful parse result. If the diagnostic pass finds no specific error, the fallback uses the first pass's failure token, not a later speculative token.

The first slice selects upstream block/header and parameter diagnostics. It covers missing colons and indented blocks for conditionals, loops, definitions, context managers, match/case, finally and except blocks. Function/lambda parameter diagnostics cover misplaced separators, missing defaults, parenthesized parameters and conflicting variadic arguments. Rules remain copied from the checksum-pinned grammar; messages are translated from their upstream actions.

Generic diagnostic actions report the last token read by the scanner, while known-location/range actions use AST/token UTF-8 positions converted to character columns. The scanner supplies its consumed column for indentation/EOF tokens whose tokenize positions are absent. This does not change standalone token fields. Forced colons also retain NEWLINE error widths. Warning deduplication survives the second pass.

`tests/fixtures/generate_python314_diagnostics.py` obtains 396 exact error and warning expectations from CPython 3.14.3. Tests compare name, message, line/end-line, column/end-column and source text. Cases include Unicode, CRLF, multiline headers, comment-only tails and both module/expression entry points. CI regenerates the fixture; browser smoke checks nine representative errors. All 3,638 tests and the ten-file live corpus pass.

All 62 upstream invalid rules are selected, and generation now checks diagnostic dependencies as well as ordinary syntax. This is not exhaustive diagnostic parity. Full-source tokenizer-error precedence still needs work, and tokenizer failures outside the tested cases may differ. CPython's internal last-statement metadata is not exposed. Type-comment-specific diagnostics remain unreachable under the `type_comments=False` API contract. Existing syntax/conversion errors that throw during the first pass still propagate directly.

The standalone bundle adds 34,805 raw / 3,811 gzip / 2,815 Brotli bytes relative to #33. No speed or memory improvement is claimed. Diagnostic rules are guarded during ordinary parsing, and rerunning the grammar is reserved for failed input.

## Target diagnostics

The target slice adds upstream invalid-assignment, annotation, deletion, loop, context-manager, named-expression, import-alias and AS-pattern rules. `diagnostics.ts` translates CPython's expression descriptions and invalid-target traversal. It descends through tuples/lists and permitted starred bindings, returning the first invalid child; for headers account for expression parsing of `a in b`. Valid attribute/subscript targets do not cause their bases to be rejected.

63 additional exact CPython cases cover literal/call/operator/comprehension/string targets, nested unpacking, illegal annotations, augmented assignments, invalid aliases and Unicode ranges. A multiline parameter regression also verifies that known-range errors use CPython's starting-line column conversion and omit the source newline when the scanner has advanced beyond that line. This corrects a source-text difference discovered while extending the conformance suite.

## Remaining upstream rule families

The final grammar slice adds call ordering, comprehensions, missing commas, legacy print/exec suggestions, import syntax, dictionary entries, exception forms, pattern arguments, type-parameter restrictions and f/t-string field diagnostics. C conditional actions translate explicitly; unknown calls and expressions still fail generation. `expression_without_invalid` temporarily disables invalid rules with guaranteed restoration. Parenthesis depth for comma suggestions is reconstructed from consumed tokens only on the failed-input path, without storing another field on every token.

All 214 previous exception-class-only rejection cases now have complete diagnostic comparisons; redundant coarse test loops are removed. The diagnostic generator reads their source text and independently recomputes CPython expectations. Additional cases cover previously untested rule families. Existing lexer fixtures remain unchanged. The parser adapter distinguishes unpositioned implicit eval newlines, normalizes dedent metadata, and reports upstream interpolation conversion wording/ranges. Known mixed bytes/string errors use the generic diagnostic location helper.

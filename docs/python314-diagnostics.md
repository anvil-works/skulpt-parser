# Python 3.14 parser diagnostics

The internal frontend follows CPython's two-pass design. Successful source returns after the ordinary grammar pass. On a null parse result, the parser retains its token buffer and flags, clears memoized rule results, resets its mark and enables selected `invalid_*` rules. Diagnostic failure never becomes a successful parse result. If the diagnostic pass finds no specific error, the fallback uses the first pass's failure token, not a later speculative token.

The first slice selects upstream block/header and parameter diagnostics. It covers missing colons and indented blocks for conditionals, loops, definitions, context managers, match/case, finally and except blocks. Function/lambda parameter diagnostics cover misplaced separators, missing defaults, parenthesized parameters and conflicting variadic arguments. Rules remain copied from the checksum-pinned grammar; messages are translated from their upstream actions.

Generic diagnostic actions report the last token read by the scanner, while known-location/range actions use AST/token UTF-8 positions converted to character columns. The scanner supplies its consumed column for indentation/EOF tokens whose tokenize positions are absent. This does not change standalone token fields. Forced colons also retain NEWLINE error widths. Warning deduplication survives the second pass.

`tests/fixtures/generate_python314_diagnostics.py` obtains 86 exact error and warning expectations from CPython 3.14.3. Tests compare name, message, line/end-line, column/end-column and source text. Cases include Unicode, CRLF, multiline headers, comment-only tails and both module/expression entry points. CI regenerates the fixture; browser smoke checks three representative errors. All 3,542 tests and the ten-file live corpus pass.

This is not full diagnostic parity. Remaining families include invalid assignment/deletion targets, calls, imports, comprehensions, expression suggestions, interpolation, dictionaries, pattern targets and type-parameter restrictions. Direct-lexer error adaptation and full-source tokenizer-error precedence also need work. CPython's internal last-statement metadata is not exposed. Existing syntax/conversion errors that throw during the first pass still propagate directly.

The standalone bundle adds 26,874 raw / 2,556 gzip / 2,036 Brotli bytes relative to #31. No speed or memory improvement is claimed. Diagnostic rules are guarded during ordinary parsing, and rerunning the grammar is reserved for failed input.

# Python 3.14 module parsing

The internal `src/python314/frontend.ts` now exposes `parseExpression` and `parseModule`, returning structural `Expression` and `Module` ASTs respectively. Both use the same generated parser. This replaces the internal `expression.ts` entry file; public package exports and existing consumers remain unchanged.

## Supported statement subset

Module input supports blank/comment-only files, expression statements, ordinary/chained/unpacking assignments, annotated assignments, all augmented assignments, deletion, pass, yield, return, raise, assert, break, continue, global, nonlocal, imports, type aliases, if/elif/else, while and for/async-for loops, function/async-function definitions, class definitions, with/async-with and try/except/except\*/else/finally. Statements can span logical lines or be separated by semicolons. Assignment and deletion targets preserve CPython's Store/Del contexts while attribute bases and subscript expressions remain Load. Parenthesized annotated names use `simple=0`; bare names use `simple=1`.

Match statements remain unsupported. A module containing one is rejected in full, including inside a supported block or when supported statements precede it. The parser does not return a successfully parsed prefix. Python 2 syntax and second-pass invalid-rule diagnostics remain separate work. The generator’s dependency check covers all non-diagnostic rules reachable from `eval` and `simple_stmt`; it does not claim complete `file` coverage.

The entry points match CPython's default `type_comments=False`. Type comments and type-ignore comments are ordinary comments, `Assign.type_comment` is null and `Module.type_ignores` is empty. No option to enable type-comment parsing is exposed yet. The assignment action explicitly rejects an unexpected type-comment token instead of silently dropping one.

As with expressions, compatibility targets `ast.parse`, not subsequent compilation. Module ASTs can contain return/yield/break/continue outside their eventual valid scopes, conflicting global/nonlocal declarations, and unpacking patterns rejected later by the compiler. Those checks belong to semantic validation.

## Runtime integration

The selected upstream `file`, statement, assignment and target rules generate directly into `GeneratedParser`. Existing structural constructors and target-context conversion supply the ASTs; sequence flattening and augmented-operator records mirror pinned CPython action helpers.

The scanner's parser stream now includes an EOF token for empty input, which permits an empty `Module`. The standalone tokenize adapter preserves CPython's empty-input behavior. Parser-originated file-input errors include the implicit final newline in source text; direct lexer errors retain their own source contract. Unexpected indentation uses `IndentationError` and the tested CPython message/range. Other unimplemented invalid-rule diagnostics retain the basic syntax-error fallback.

## Verification and costs

`tests/fixtures/generate_python314_modules.py` runs CPython 3.14.3 to produce 383 complete module AST/warning cases, 22 exact error cases and 136 rejection cases. Two additional project-contract cases first verify that CPython accepts the source, then check that this incomplete parser rejects the whole module when a later statement is unsupported. CI regenerates this fixture alongside the expression fixtures and generated parser.

The full suite passes 3,365 tests with zero skips. The standalone browser smoke check covers 19 module sources as well as the existing 13 expression sources. Public package checks remain separate.

The standalone migration bundle is 781,435 bytes raw / 239,168 gzip / 178,180 Brotli on Node 26.7.0. Relative to #29, the increase is 7,088 / 742 / 450 bytes. These totals include Unicode-name data. No parsing-speed or memory improvement is claimed. The existing command names `build:expression` and `test:expression-package` now exercise the shared internal frontend, preserving the previous measurement path.

```sh
python3.14 -m tools.generate314 --parser --check
python3.14 tests/fixtures/generate_python314_modules.py
pnpm check
pnpm test
pnpm build:expression
pnpm test:expression-package
```

The legacy suite still requires `PYTHON` to select the pinned CPython 3.9.25 oracle. Module fixtures use the separate pinned 3.14.3 interpreter.

## Imports and type aliases

Imports support dotted names, aliases, parenthesized from-import targets, star imports and relative levels. The dot count includes `...` tokens. Unicode names use the same NFKC normalization as other identifiers. No module loading occurs; the output is an AST.

The soft keyword `type` introduces a type alias only in the matching grammar context. It remains available as an ordinary name elsewhere. Type aliases include bounds/constraints, defaults, `TypeVarTuple` and `ParamSpec`, using the pinned CPython grammar and structural constructors. Duplicate type parameters and default-order constraints that `ast.parse` accepts remain later compiler checks.

The checked future-import action enables `barry_as_FLUFL` for subsequent comparisons in that parser instance. The lexer recognizes both `!=` and `<>` as NOTEQUAL; the parser permits `<>` only after the relevant absolute future import and rejects `!=` once enabled. Ordinary imports and relative imports do not enable the flag. The flag is not a general Python 2 mode.

Before returning a module, the future-feature check follows `Python/future.c`: validate the leading block of absolute future imports, optionally preceded by a docstring. It reports unknown features and the `braces` error with CPython-derived details. CPython’s AST-only path does not reject misplaced future imports after another statement; this parser keeps that boundary. Other compilation/semantic checks remain deferred. The checks live in `src/python314/imports.ts`; upstream sources are checksum-pinned.

This slice adds 80 complete AST/warning cases, nine exact errors and 32 rejection cases. The two earlier unsupported-import/type-alias checks become ordinary success cases; compound-statement boundary checks remain. Four new standalone lexer cases check `<>` in both token modes. The public bundle remains unchanged.

## Control flow and blocks

The selected CPython `compound_stmt` alternatives now include `if_stmt`, `while_stmt` and `for_stmt`. Their shared `block` rule accepts either an inline suite or NEWLINE/INDENT/statements/DEDENT. Nested branches, loop `else` clauses, async iteration and assignment-expression conditions use the upstream grammar directly. `elif` becomes nested `If` nodes in `orelse`; absent branches become empty arrays. Loop targets retain the existing Store-context conversion. `async for` outside an async function remains accepted by `ast.parse`, with scope validity left to compilation.

The generator implements forced string literals for the upstream `else` colon check. Failure stops parsing immediately with `expected ':'`; fixtures compare the full CPython error. `_PyPegen_register_stmts` is an identity action in this first-pass parser, matching CPython when invalid rules are disabled. Its diagnostic location tracking belongs with the later invalid-rule pass.

This slice adds 36 complete AST/warning cases, three exact errors and 23 rejection cases. The previous unsupported `if` example is now a success case. That slice retained boundary tests for definitions and with statements inside supported blocks; later slices convert them to success cases. Fixtures cover nested dedents, inline semicolons, Unicode positions, tabs, CR/CRLF, target contexts, ignored type comments and warning deduplication across branch backtracking.

Full indentation diagnostics remain unfinished. A mismatched dedent is checked for CPython's rejection and exception class, but the existing direct-lexer error omits the final newline and end range supplied by `ast.parse`. Missing-block diagnostics still use the basic parser fallback until invalid rules are ported. These tests do not claim full error-message parity.

## Function and class definitions

Function definitions reuse the lambda argument assembly helper for positional-only parameters, defaults, variadic arguments and keyword-only parameters. The selected function rules add annotations, return annotations and type parameters. Parameter and function type comments remain ignored, matching the current `type_comments=False` contract. The translated argument actions reject an unexpected type-comment token rather than discard it silently.

Class definitions use the existing call-argument grammar for bases and keyword arguments. Python decorators attach a new `decorator_list` to a copied definition node, retaining the raw definition's source location as CPython does. This supports Python decorator expressions; it does not introduce legacy TypeScript decorators. Missing decorator/type-parameter sequences become empty arrays.

A grouped lookahead such as `&(NEWLINE INDENT)` needs only success/failure, so its generated helper returns true when the sequence matches. Other ambiguous semantic actions still fail generation. This covers the upstream function-type-comment rule without fabricating an AST node.

This slice adds 49 complete AST/warning cases and 22 rejection cases. They cover annotations, defaults, generic definitions, decorator ordering/positions, nested definitions, async functions and Unicode names. The prior definition boundary examples now parse successfully; that slice retained context managers and try statements as whole-module rejection checks, converted below to success cases. Duplicate parameters and similar restrictions accepted by `ast.parse` remain compiler checks.

## Context managers and exception handling

Selected upstream rules now produce `With`, `AsyncWith`, `Try`, `TryStar` and `ExceptHandler`. Context-manager bindings use existing target-context conversion. Exception aliases use normalized identifier strings. Empty handler, else and finally sequences become arrays. No new runtime helper is required; `try` and `finally` reuse forced colon checks.

The grammar includes Python 3.14's unparenthesized exception tuples, such as `except A, B:` and `except* A, B:`. An alias on multiple types still requires parentheses. Bare handlers, multiple handlers, optional else/finally and nested context managers follow the pinned grammar. Compiler checks such as a bare handler preceding another handler remain outside `ast.parse` compatibility.

This slice adds 61 complete AST/warning cases, two exact forced-colon errors and 20 rejection cases from CPython. Coverage includes mixed handler-kind rejection, bindings, async forms, Unicode alias locations, type comments, nesting and return in finally. Prior unsupported with/try examples now succeed; only match statements remain as explicit unsupported module boundaries.

# Python 3.14 module parsing

The internal `src/python314/frontend.ts` now exposes `parseExpression` and `parseModule`, returning structural `Expression` and `Module` ASTs respectively. Both use the same generated parser. This replaces the internal `expression.ts` entry file; public package exports and existing consumers remain unchanged.

## Supported statement subset

Module input supports blank/comment-only files, expression statements, ordinary/chained/unpacking assignments, annotated assignments, all augmented assignments, deletion, pass, yield, return, raise, assert, break, continue, global, nonlocal, imports and type aliases. Statements can span logical lines or be separated by semicolons. Assignment and deletion targets preserve CPython's Store/Del contexts while attribute bases and subscript expressions remain Load. Parenthesized annotated names use `simple=0`; bare names use `simple=1`.

Compound statements remain unsupported. A module containing one is rejected in full, including when supported statements precede it. The parser does not return a successfully parsed prefix. Python 2 syntax and second-pass invalid-rule diagnostics remain separate work. The generator’s dependency check covers all non-diagnostic rules reachable from `eval` and `simple_stmt`; it does not claim complete `file` coverage.

The entry points match CPython's default `type_comments=False`. Type comments and type-ignore comments are ordinary comments, `Assign.type_comment` is null and `Module.type_ignores` is empty. No option to enable type-comment parsing is exposed yet. The assignment action explicitly rejects an unexpected type-comment token instead of silently dropping one.

As with expressions, compatibility targets `ast.parse`, not subsequent compilation. Module ASTs can contain return/yield/break/continue outside their eventual valid scopes, conflicting global/nonlocal declarations, and unpacking patterns rejected later by the compiler. Those checks belong to semantic validation.

## Runtime integration

The selected upstream `file`, statement, assignment and target rules generate directly into `GeneratedParser`. Existing structural constructors and target-context conversion supply the ASTs; sequence flattening and augmented-operator records mirror pinned CPython action helpers.

The scanner's parser stream now includes an EOF token for empty input, which permits an empty `Module`. The standalone tokenize adapter preserves CPython's empty-input behavior. Parser-originated file-input errors include the implicit final newline in source text; direct lexer errors retain their own source contract. Unexpected indentation uses `IndentationError` and the tested CPython message/range. Other unimplemented invalid-rule diagnostics retain the basic syntax-error fallback.

## Verification and costs

`tests/fixtures/generate_python314_modules.py` runs CPython 3.14.3 to produce 237 complete module AST/warning cases, 17 exact error cases and 71 rejection cases. Two additional project-contract cases first verify that CPython accepts the source, then check that this incomplete parser rejects the whole module when a later statement is unsupported. CI regenerates this fixture alongside the expression fixtures and generated parser.

The full suite passes 3,149 tests with zero skips. The standalone browser smoke check covers nine module sources as well as the existing 13 expression sources. Public package checks remain separate.

The standalone migration bundle is 749,755 bytes raw / 235,394 gzip / 175,533 Brotli on Node 26.7.0. Relative to #25, the increase is 12,685 / 1,437 / 1,230 bytes. These totals include Unicode-name data. No parsing-speed or memory improvement is claimed. The existing command names `build:expression` and `test:expression-package` now exercise the shared internal frontend, preserving the previous measurement path.

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

This slice adds 80 complete AST/warning cases, nine exact errors and 32 rejection cases. The two earlier unsupported-import/type-alias checks become ordinary success cases; compound-statement boundary checks remain. Four new standalone lexer cases check `<>` in both token modes. The new standalone bundle is 758,280 raw / 236,757 gzip / 176,544 Brotli bytes, up 8,525 / 1,363 / 1,011 from #26. These totals include Unicode names; the public bundle remains unchanged.

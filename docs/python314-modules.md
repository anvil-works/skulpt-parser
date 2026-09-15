# Python 3.14 module parsing

The internal `src/python314/frontend.ts` now exposes `parseExpression` and `parseModule`, returning structural `Expression` and `Module` ASTs respectively. Both use the same generated parser. This replaces the internal `expression.ts` entry file; public package exports and existing consumers remain unchanged.

## Supported statement subset

Module input supports blank/comment-only files, expression statements, ordinary/chained/unpacking assignments, annotated assignments, all augmented assignments, deletion, pass, yield, return, raise, assert, break, continue, global and nonlocal. Statements can span logical lines or be separated by semicolons. Assignment and deletion targets preserve CPython's Store/Del contexts while attribute bases and subscript expressions remain Load. Parenthesized annotated names use `simple=0`; bare names use `simple=1`.

Imports, type aliases and compound statements remain unsupported. A module containing one is rejected in full, including when supported statements precede it. The parser does not return a successfully parsed prefix. Python 2 syntax and second-pass invalid-rule diagnostics remain separate work. The generator's expression-dependency check still covers the complete non-diagnostic `eval` grammar; it does not claim complete `file` coverage.

The entry points match CPython's default `type_comments=False`. Type comments and type-ignore comments are ordinary comments, `Assign.type_comment` is null and `Module.type_ignores` is empty. No option to enable type-comment parsing is exposed yet. The assignment action explicitly rejects an unexpected type-comment token instead of silently dropping one.

As with expressions, compatibility targets `ast.parse`, not subsequent compilation. Module ASTs can contain return/yield/break/continue outside their eventual valid scopes, conflicting global/nonlocal declarations, and unpacking patterns rejected later by the compiler. Those checks belong to semantic validation.

## Runtime integration

The selected upstream `file`, statement, assignment and target rules generate directly into `GeneratedParser`. Existing structural constructors and target-context conversion supply the ASTs; sequence flattening and augmented-operator records mirror pinned CPython action helpers.

The scanner's parser stream now includes an EOF token for empty input, which permits an empty `Module`. The standalone tokenize adapter preserves CPython's empty-input behavior. Parser-originated file-input errors include the implicit final newline in source text; direct lexer errors retain their own source contract. Unexpected indentation uses `IndentationError` and the tested CPython message/range. Other unimplemented invalid-rule diagnostics retain the basic syntax-error fallback.

## Verification and costs

`tests/fixtures/generate_python314_modules.py` runs CPython 3.14.3 to produce 157 complete module AST/warning cases, eight exact error cases and 39 rejection cases. Four additional project-contract cases first verify that CPython accepts the source, then check that this incomplete parser rejects the whole module when a later statement is unsupported. CI regenerates this fixture alongside the expression fixtures and generated parser.

The full suite passes 3,026 tests with zero skips. The standalone browser smoke check covers six module sources as well as the existing 13 expression sources. Public package checks remain separate.

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

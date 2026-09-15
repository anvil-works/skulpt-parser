# Python 3.14 module parsing

The internal `src/python314/frontend.ts` exposes `parseExpression` and `parseModule`, returning structural `Expression` and `Module` ASTs. Both use the same generated parser. Public package exports still use the recovered parser; Skulpt and IDE integration remain separate work.

## Grammar coverage

Generation now requires every non-diagnostic rule reachable from the pinned CPython 3.14.3 `file` and `eval` entry points. No statement families remain deliberately omitted. This establishes grammar coverage, not exhaustive conformance or readiness for consumer rollout.

Modules support simple statements, imports, type aliases, conditionals, loops, function and class definitions, context managers, exception handling and pattern matching. Blocks use the upstream inline-suite or NEWLINE/INDENT/statements/DEDENT rules. Complete input must parse; a successful prefix is never returned.

Assignment, deletion, iteration and context-manager targets preserve CPython's Store/Del contexts while attribute bases and subscript expressions remain Load. `elif` becomes nested `If` nodes in `orelse`; optional ASDL sequences become arrays. AST locations use UTF-8 byte columns.

Function parameters reuse the lambda argument assembly helper. Definitions support annotations, return annotations, type parameters and Python decorators. Decorator attachment copies the raw definition node and retains its source location, matching CPython. Class bases and keyword arguments reuse the call-argument grammar. Async definitions, iteration and context managers follow the same upstream rules.

Exception handling includes `TryStar` and Python 3.14's unparenthesized exception tuples, such as `except A, B:` and `except* A, B:`. An alias on multiple types still requires parentheses.

Pattern matching includes literal/singleton, capture, wildcard, value, group, sequence, mapping, class, OR and AS patterns, plus guards and tuple subjects. `match` and `case` remain contextual soft keywords. Pattern captures and keyword attribute names use the normal identifier normalization. Complex literal actions enforce real and imaginary components using CPython's messages and source ranges.

## Compatibility boundary

The entry points match `ast.parse` with default `type_comments=False`. Type comments and type-ignore comments remain ordinary comments; AST type-comment fields are null and `Module.type_ignores` is empty. No option to enable them is exposed. Translated actions reject unexpected type-comment tokens rather than silently discard them.

Compatibility targets AST parsing, not subsequent compilation. Scope restrictions, duplicate parameters/captures, unreachable cases, duplicate pattern keys, bare-except ordering and other compiler checks that `ast.parse` accepts remain deferred. Python 2 compatibility is also separate work.

Future imports preserve two upstream behaviors. The checked import action enables `barry_as_FLUFL` for subsequent comparisons in that parser instance. The lexer recognizes both `!=` and `<>`; the parser enforces the active spelling. Ordinary and relative imports do not enable the flag. Module finalization follows `Python/future.c`, checking only the leading absolute future-import block after an optional docstring. Misplaced future imports retain CPython's AST-only behavior. This is not a general Python 2 mode.

## Diagnostics and generator actions

A second pass now enables upstream `invalid_*` diagnostics after normal parsing fails. See `python314-diagnostics.md` for coverage. Forced string literals retain upstream committed failures, including `expected ':'`. `_PyPegen_register_stmts` remains an identity action because CPython's internal last-statement metadata is not exposed by this frontend.

Missing-block errors now use upstream diagnostic rules. The parser adapter normalizes mismatched-dedent text and end ranges to CPython; the standalone tokenizer retains its separate contract. Unexpected indentation has a tested CPython diagnostic. Parser-created file-input errors include the implicit final newline. Full error parity is not claimed.

Grouped lookahead returns success/failure without fabricating an AST value. Other ambiguous semantic actions and unknown action calls fail generation. Memoization follows upstream annotations; per-rule performance tuning remains future measured work.

## Verification and size

The CPython-generated module fixture contains 451 complete AST/warning cases, 26 exact errors and 157 rejection cases. The final pattern slice adds 68 AST/warning cases, four exact numeric-pattern errors and 21 rejection cases. Earlier unsupported-pattern cases now succeed, so no deliberate statement-family rejection fixtures remain. Non-finite scalar values use JSON markers, preventing invalid JSON for overflow literals.

The full suite passes 3,635 tests with zero skips. Browser smoke covers 13 expressions and 22 modules. CI regenerates parser output and fixtures. A live corpus check compares complete ASTs and warnings for ten files from the pinned interpreter's standard library: ast, dataclasses, enum, typing, contextlib, inspect, pathlib, asyncio/tasks, json/decoder and unittest/mock. Expectations come from CPython at runtime; the built TypeScript parser is the implementation under test.

The standalone migration bundle is 865,594 bytes raw / 248,367 gzip / 185,344 Brotli on Node 26.7.0, up 34,797 / 3,806 / 2,989 from #33. Totals include Unicode-name data. Public exports remain unchanged. No speed or memory improvement is claimed. The existing `build:expression` and `test:expression-package` commands exercise the shared frontend.

```sh
python3.14 -m tools.generate314 --parser --check
python3.14 tests/fixtures/generate_python314_modules.py
pnpm check
pnpm test
pnpm build:expression
pnpm test:expression-package
pnpm test:python314-corpus
```

The legacy suite requires `PYTHON` to select CPython 3.9.25. Module fixtures and the live corpus check require CPython 3.14.3. Diagnostics, semantic validation, performance measurements and consumer integration are the next checkpoint decisions.

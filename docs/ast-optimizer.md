# Literal AST optimizer

`@anvil-works/skulpt-parser/optimize` exports `optimizeAST(tree)`. It is an
explicit, in-place Python 3 compiler pass. The parser continues to return the
default CPython AST, including `BinOp` for `1 + 2`. IDE consumers need no changes.
The optimizer returns the same module/expression root and retains each folded
expression's complete source span.

The first implementation covers literal integer arithmetic and bit operations,
finite floating-point arithmetic, complex addition/subtraction, unary operators,
string/bytes concatenation and repetition, tuple concatenation/repetition, and
constant indexing of strings, bytes and literal tuples. Integer and sequence
budgets are documented in the README. Tuples keep their existing AST type.

This is a conservative subset, rather than a copy of every CPython folding
choice. Floating-point powers, complex multiplication/division, slices, mutable
containers and operations involving large integer-to-float conversions remain
runtime operations. Error-producing expressions remain intact. Boolean inversion
and Ellipsis truth tests also remain intact because Python 3.14 emits runtime
deprecation warnings for those operations.

The pass preserves control flow and names, including bindings in unreachable
expressions. It leaves a computed string expression at the start of a module,
class or function suite intact, so optimization cannot introduce a docstring.
Annotations and lazy type definitions remain intact, preserving the text exposed
by deferred annotation APIs. String indexing containing surrogate pairs remains
unfolded because the AST's UTF-16 string payload cannot distinguish actual astral
characters from separately escaped surrogate characters. Concatenation/repetition
also avoids joining lone surrogates into a new pair.
The pass uses iterative traversal to handle long expression chains. Consumers must
skip it for Python 2 trees; its public TypeScript signature rejects compatibility
modules.

## Validation

Run the parser's normal checks:

```sh
pnpm check
pnpm test
pnpm build
pnpm test:package
pnpm test:core-package
pnpm test:python314-corpus
python3.14 tests/fixtures/generate_ast_optimizer.py
git diff --exit-code -- tests/fixtures/ast-optimizer.json
```

The checked-in fixture uses CPython 3.14.3 to evaluate literal expressions.
Floating-point and complex expectations compare IEEE-754 bits, including signed
zero. Additional tests cover spans, repeated application, runtime errors,
allocation limits, contexts, docstrings, bindings and a 5,000-term expression.
CI regenerates the fixture with the pinned interpreter.

Skulpt owns compiler integration. The consumer-side harness
`test/ast_optimizer.mjs` in the Skulpt adapter checkout tests both the adapter and
direct AST compiler. It wraps their parsing boundaries inside the test process;
it does not change published runtime configuration or package dependencies.
After building the parser, run from that checkout:

```sh
node test/ast_optimizer.mjs /path/to/parser/dist-core/index.js \
  /path/to/parser/dist-core/optimize.js /path/to/adapter.js /path/to/stdlib.js
node test/ast_optimizer.mjs /path/to/parser/dist-core/index.js \
  /path/to/parser/dist-core/optimize.js /path/to/direct.js /path/to/stdlib.js --direct
```

Each compiler executes twelve programs both with and without optimization and
compares output against CPython. Coverage includes literal values, nested tuples,
docstrings, eager annotations, short-circuit side effects, assignment contexts, `eval`/`exec` and
runtime exceptions. It also checks the unsupported named-expression diagnostic
and Python 2 division/long behavior. Compiling `answer = 1 + 2` removes the
`numberBinOp` call and reduces generated JavaScript from 1,216 to 1,111 bytes in
both checkpoint runtimes. This demonstrates removed runtime work; it is not a
latency benchmark. Optimization adds an AST traversal during compilation.

An existing Skulpt runtime difference is recorded explicitly: unoptimized
`1.0 // 0.1` yields `10.0`, whereas CPython and the optimized constant yield `9.0`.
Skulpt's runtime floor division needs a separate fix before adoption if consistent
behavior between literal and dynamic expressions is required. These checkpoint
runtimes do not support `from __future__ import annotations`; deferred annotation
text is therefore protected by the parser AST regression rather than a Skulpt
execution assertion.

The optimizer-only dev.6 commit left the default parser bundle byte-for-byte
unchanged from performance commit `f5182f0`. The subsequent
[performance follow-up](parser-performance-followup.md) changes that core bundle.
Standalone optimizer measurements with Node 22.15.0 were 6,467
raw bytes, 2,315 gzip bytes and 2,153 Brotli bytes. Only consumers importing
`/optimize` load this code. Package checks execute both entries without Node
globals or external imports and check declarations from an external TypeScript
consumer. Final validation passed 2,256 parser tests, including 189 optimizer
tests with 152 CPython-evaluated value cases, type/package checks, generator
freshness and the 560-fixture/ten-stdlib live CPython comparison.
See [the raw validation report](benchmarks/ast-optimizer-20260930.json) for bundle
hashes, runtime/hardware metadata and consumer results, and
[the code-review report](ast-optimizer-review.md) for the two review axes.

Compiler PR wiring and dependency bumps follow package publication. No publication,
runtime rollout or deployment is part of this change.

## Adoption decision

Five paired fresh-process Node 22 runs measured the optional pass through both
Skulpt compiler paths. On eleven representative consumer modules, compilation
including parsing became 9–19% slower. Across the full 119-module corpus, twelve
modules changed: five binary operations and 34 unary operations were folded.

Separate execution-only probes reused already compiled code. Literal arithmetic,
string repetition and negative-index hot loops became 35–70% faster. These are
synthetic loops, not measured whole-application gains. A control loop whose code
does not change moved by a few percent, which illustrates timing variation.

Keep the ordinary AST as Skulpt's default. The optional API remains useful when a
consumer can demonstrate enough repeated execution to repay its compilation
cost. No automatic runtime optimizer wiring or float-floor repair is included in
this release. Detailed source policy, paired samples and reports stay in the
consuming repositories. Default parser bytes and behavior remain unchanged.

# Symbol-table organization experiment

This compares explicit visitor handlers with CPython-style switch dispatch for the same bounded Python 3.14 symbol-table slice. Both produce the same normalized scope results. Neither is a production symbol table or a decision to merge the old visitor PR.

## What is being compared

- [switch.ts](switch.ts) keeps semantic traversal inside narrowed switch cases.
- [visitor.ts](visitor.ts) keeps equivalent traversal in named methods, with an exhaustive typed handler contract and a generated-style dispatch table.
- [common.ts](common.ts) supplies identical declaration checks, comprehension state and binding/closure resolution to both.
- [types.ts](types.ts) defines the same discriminated AST subset and result schema.

The semantic blocks were initially constructed from the same per-node bodies, then retained as separate source files. This deliberately isolates organization rather than comparing two authors' differing semantic implementations. There is no runtime code generator or second set of binding rules. The published dispatch table is explicit; this experiment does not deliver a production ASDL generator.

The visitor is related to the organization proposed in [the symbol-table visitor PR](https://github.com/skulpt/skulpt-parser/pull/113), but does not inherit its generic walker. It also uses a shared per-kind accept table rather than the PR's node-prototype `walkabout` methods. Table entries call the named handlers directly; there is no per-node method-name string construction or per-instance closure. Both receive identical plain AST objects. Performance here does not establish the cost of the PR's exact prototype layout or every possible visitor implementation.

## Scope and correctness

Oracle: CPython 3.14.3 `ast.parse` and public `symtable.symtable`. Every input begins with `from __future__ import annotations`, including that import in the expected symbols. This avoids the separate deferred-annotation machinery. Function/parameter annotations and type parameters are explicitly unsupported.

The slice covers synchronous functions, positional and keyword-only defaults, decorators, lambdas, nested closures, global/nonlocal declarations, ordinary expression traversal, synchronous generator expressions and assignment-expression restrictions. Classes, async constructs, collection comprehensions, annotation scopes and other unlisted node kinds are unsupported. In Python 3.14, non-generator comprehensions are inlined during analysis; treating them as ordinary generator scopes would not be equivalent.

Each scope result includes name, type, line number, child scopes and ten exposed symbol properties. Symbols are sorted by name before comparison, so this does not test CPython's symbol insertion order. Internal cell flags, optimization flags, namespace accessors and compiler metadata are outside the result schema. Syntax errors compare kind and message, not source ranges or source-line text.

Both built candidates match:

- 85 initial cases, including 16 expected errors. Forty cases are systematic variations of one nested-function/generator pattern.
- 16 independently added cases, including four expected errors, covering additional directive ordering, imports, nested generator/walrus behavior and closure propagation. Both passed these on first evaluation.
- Three benchmark ASTs, with complete normalized results checked before timing.
- Separately, ten boundary checks confirm explicit rejection of excluded syntax; these are not CPython-parity cases.

The initial corpus was available during implementation and was used for corrections. These counts are evidence for the stated slice, not full Python 3.14 conformance. `corpus.json`, `extra-corpus.json` and benchmark inputs are generated from public synthetic sources in this directory.

## Maintainability exercises

[maintenance.mjs](maintenance.mjs) copies each candidate and its shared dependencies into a temporary directory, introduces one controlled change, type-checks it, then runs the relevant real analysis case when compilation succeeds. Temporary copies are removed; production and experimental baselines are unchanged.

| Deliberate change                                                    | Switch                                 | Visitor                                |
| -------------------------------------------------------------------- | -------------------------------------- | -------------------------------------- |
| Remove synchronous-function keyword-only-default traversal           | Type-check passes; semantic test fails | Type-check passes; semantic test fails |
| Remove/misname the comprehension handler                             | Type-check fails                       | Type-check fails                       |
| Add a new kind to the shared AST type schema without implementing it | Type-check fails                       | Type-check fails                       |
| Remove the later comprehension iterable's walrus guard               | Type-check passes; semantic test fails | Type-check passes; semantic test fails |

The keyword-default exercise is based on an actual omission in both the project's old switch and the visitor PR, not an invented dispatch defect. For this source, `seed` must be referenced in `outer`, and must not become a free variable of `inner`:

```python
def outer():
    seed = 1
    def inner(*, required, choice=seed):
        return choice
    return inner
```

The repair is the same semantic operation in both designs: visit `node.args.kw_defaults` in the enclosing scope, after positional defaults and before decorators. Their shared sequence walker skips the null slot for `required`. The handler remains present when that line is missing, so exhaustive node coverage cannot detect the bug.

The comprehension exercise uses an assignment expression in a second iterable. That iterable must run through the semantic comprehension handler and reject the assignment expression. The old PR's `visitComprehension` versus generated `visit_comprehension` mismatch demonstrates why silent generic fallback is dangerous. Our visitor explicitly requires every handler; the switch uses an exhaustive union check. Both safeguard the same obligation.

These exercises establish that omissions are caught, not how many hours future upstream updates will take. Neither design wins the maintenance checks. Reviewed AST-field changes and semantic differential tests remain necessary in both.

## Upstream correspondence and review burden

Pinned reference: [CPython v3.14.3 Python/symtable.c](https://github.com/python/cpython/blob/v3.14.3/Python/symtable.c). Relevant operations are `symtable_visit_stmt` for function/default/declaration handling, `symtable_visit_expr` for expressions, comprehension handling and `symtable_visit_comprehension`, named-expression scope extension, and the binding-analysis pass.

Both candidates expose the important ordering directly: defaults/decorators before entering a function, the first generator iterable outside the generator scope, and subsequent targets/iterables/filters inside it. Neither relies on inherited generic child traversal for these rules.

The switch resembles CPython's case-block organization and needs no handler registration table. The visitor gives each node a named method for navigation and per-handler review. Its contract, table and dispatch cast must stay aligned; production generation could maintain that plumbing, but would introduce another generator invariant. A new node still needs an explicit semantic decision under either design.

The largest abstraction is their shared binding engine. This experiment does not compare two alternative organizations of that engine, nor prove that all its future CPython updates will be straightforward. Likewise, ASDL field additions can require behavior changes even when TypeScript continues compiling.

## Size, speed and memory

See [measurements.json](measurements.json) for all samples and [results-summary.md](results-summary.md) for the compact tables.

Both are built with Rslib 1.0.0 as browser-targeted minified ESM, including the common engine and runtime dispatch code. TypeScript-only contracts are erased. Neither bundle includes a parser, tokenizer, full AST library, Python oracle, Skulpt runtime or compiler.

Measurements run in Node 26.7.0 on macOS arm64, Apple M1 Pro. Browser-targeted output is exercised in Node, not a browser. Each candidate receives an already constructed AST: source parsing, JSON decoding and AST construction are outside timing. Results include traversal, binding analysis, sorting and complete scope-result allocation.

Three fresh processes per candidate/input alternate execution order. Each takes a first-call measurement, performs 60 warmup analyses, calibrates a batch and measures 11 batches. Summary latency is the median of three process medians; raw ranges matter, especially for the larger workload. Inputs are synthetic nested functions and generators, not sampled Anvil applications.

Memory uses separate processes, warmed before baseline GC. They retain 2,000 small results, 100 medium results or 10 large results, collect again and divide the heap delta. AST inputs already exist at baseline. These are approximate retained output costs. Peak RSS is whole-process allocation behavior, including Node/V8, not a per-analysis memory requirement.

## Implication

There is no demonstrated correctness or omission-detection advantage for visitors once both designs have equivalent safeguards. Named navigation is their concrete organizational benefit. The switch preserves closer visual correspondence with CPython and less dispatch plumbing. The measured size difference is small; these timing results cannot settle future AST representation.

Given the project's priority of tracking upstream, retaining CPython-style switch organization is a reasonable default for symbol-table semantics. Visitor organization remains defensible if named-handler navigation is worth the additional generated machinery. This experiment supplies that choice; it does not settle it or prohibit generic visitors for other AST consumers.

## Reproduction

Set `PYTHON314` to a CPython 3.14.3 executable. From this directory:

```sh
pnpm install --frozen-lockfile
"$PYTHON314" oracle.py
"$PYTHON314" extra_cases.py
node evaluate.mjs switch.ts corpus.json switch-results.json
node evaluate.mjs visitor.ts corpus.json visitor-results.json
node evaluate.mjs switch.ts extra-corpus.json switch-extra.json
node evaluate.mjs visitor.ts extra-corpus.json visitor-extra.json
"$PYTHON314" unsupported_cases.py
node evaluate.mjs switch.ts unsupported-corpus.json switch-unsupported.json
node evaluate.mjs visitor.ts unsupported-corpus.json visitor-unsupported.json
node maintenance.mjs
SYMTABLE_ENTRY=./switch.ts SYMTABLE_DIST=dist/switch pnpm exec rslib build
SYMTABLE_ENTRY=./visitor.ts SYMTABLE_DIST=dist/visitor pnpm exec rslib build
node evaluate.mjs dist/switch/index.js benchmark-inputs.json switch-benchmark-parity.json
node evaluate.mjs dist/visitor/index.js benchmark-inputs.json visitor-benchmark-parity.json
node measure.mjs
```

The evaluator exits unsuccessfully on mismatches. Generated large inputs and builds are ignored; source cases and result summaries are committed. Candidate source hashes and build hashes are recorded in `provenance.json`.

The legacy repository Black hook fails to import `click._unicodefun`. Research Python files are formatted with Black 24.10.0; only the broken legacy Black hook is skipped at commit. Other configured checks and the focused TypeScript/behavior checks pass.

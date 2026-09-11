# Upstream compatibility: Python 3.9 to 3.14

Research for [Establish the upstream path from Python 3.9 to Python 3.14](https://github.com/anvil-works/skulpt-parser/issues/4), 2026-09-11. This records evidence and candidate probes; architecture remains a maintainer decision.

## Evidence boundary

Inspected parser checkout `bd7d5acc52b70372be6c28808405fe8a14f0b82f` and visitor PR head `289ac25e9736e742cfa41909d59a540604dae5a1`. Compared official CPython `v3.9.16` and `v3.14.0` sources; the latter is a reproducible feature baseline, not a recommendation to ignore subsequent 3.14 fixes. Sibling CPython checkout is on `3.13`; it was not changed or used as the 3.14 oracle. No parser execution, performance measurement, or upgrade was attempted.

## Confirmed migration surfaces

| Version | Relevant frontend changes                                                                                                           | Consequence to investigate                                                                                                                                                                                |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.10    | Structural pattern matching and soft keywords; parenthesized context managers; richer syntax-error spans.                           | Pattern AST and binding validation; preserve ordinary uses of `match`/`case`. [Release notes](https://docs.python.org/3.10/whatsnew/3.10.html)                                                            |
| 3.11    | `except*` and exception groups; starred expressions in subscripts.                                                                  | `TryStar`, grammar/helper changes, separate runtime support. [Release notes](https://docs.python.org/3.11/whatsnew/3.11.html)                                                                             |
| 3.12    | Formal f-string grammar; type parameter/type alias syntax and annotation scopes; comprehension inlining.                            | Lexer modes, new AST forms, substantial scope changes. CPython's optimization strategy need not become Skulpt's implementation strategy. [Release notes](https://docs.python.org/3.12/whatsnew/3.12.html) |
| 3.13    | Type parameter defaults.                                                                                                            | Default expressions and their scope/evaluation behavior. [Release notes](https://docs.python.org/3.13/whatsnew/3.13.html)                                                                                 |
| 3.14    | Template strings, deferred annotations, unparenthesized multiple exception types where allowed, control-flow warnings in `finally`. | More than accepting syntax: annotation and template runtime contracts, plus diagnostic ownership. [Release notes](https://docs.python.org/3.14/whatsnew/3.14.html)                                        |

This is a decision-oriented inventory, not an exhaustive patch list or compatibility certification.

Direct ASDL comparison confirms additions `Match`, pattern variants, `match_case`, `TryStar`, `TypeAlias`, type parameters (including defaults), `TemplateStr`, and `Interpolation`. Functions/classes acquire `type_params`. Less conspicuous changes include nullable dictionary keys in the schema, non-optional `FormattedValue.conversion`, and source attributes on aliases. Generator review must cover field cardinality and positions as well as node names. AST column offsets are UTF-8 byte offsets; JavaScript consumers may expect UTF-16 indices. [3.9 ASDL](https://github.com/python/cpython/blob/v3.9.16/Parser/Python.asdl), [3.14 ASDL](https://github.com/python/cpython/blob/v3.14.0/Parser/Python.asdl).

The current generator checks out the sibling CPython tag, applies a grammar patch, temporarily replaces CPython's Python generator, then restores the file. The task invocation spells `apply_grammar_patch`, while Deno defines `apply-grammar-patch`. Its TS backend includes placeholder version checks. These are concrete reproducibility and compatibility gaps; this research did not execute those scripts. [Existing generator](https://github.com/skulpt/skulpt-parser/blob/bd7d5acc52b70372be6c28808405fe8a14f0b82f/tools/gen_parser/__main__.py), [environment](https://github.com/skulpt/skulpt-parser/blob/bd7d5acc52b70372be6c28808405fe8a14f0b82f/tools/env.py), [TS backend](https://github.com/skulpt/skulpt-parser/blob/bd7d5acc52b70372be6c28808405fe8a14f0b82f/tools/gen_parser/skulpt_parser_genarator.py).

Modern grammar retains embedded C actions and helper calls. It also has forced parsing (`&&`), soft keywords, and a second pass of specialized invalid rules. Updating grammar text therefore requires adapting generator constructs, semantic helpers, and diagnostic behavior together. The modern Python backend explicitly handles `Forced`; the old TS backend's imports omit it. [3.14 grammar](https://github.com/python/cpython/blob/v3.14.0/Grammar/python.gram), [generator](https://github.com/python/cpython/blob/v3.14.0/Tools/peg_generator/pegen/python_generator.py).

## Tokenizer wrinkle resolved, portability question remains

Python 3.12 moved `tokenize` onto the internal C tokenizer. In pinned 3.14 source `_generate_tokens_from_c_tokenizer` calls `_tokenize.TokenizerIter`. Regex helpers remain in the file, but copying those is not copying the scanning engine. [3.12 release notes](https://docs.python.org/3.12/whatsnew/3.12.html), [3.14 tokenize source](https://github.com/python/cpython/blob/v3.14.0/Lib/tokenize.py).

The 3.14 token vocabulary adds f-string and t-string start/middle/end tokens and `EXCLAMATION`; obsolete `ASYNC`/`AWAIT` token entries disappear relative to 3.9. The lexer tracks nested interpolation/string modes. Modern f-strings allow quote reuse, comments and backslashes in replacement expressions. A prefix/regex extension alone is insufficient. T-strings preserve interpolation information and produce template objects rather than ordinary strings. [Token definitions](https://github.com/python/cpython/blob/v3.14.0/Grammar/Tokens), [lexer](https://github.com/python/cpython/blob/v3.14.0/Parser/lexer/lexer.c), [3.14 release notes](https://docs.python.org/3.14/whatsnew/3.14.html).

Important IDE limit: public `tokenize` explicitly leaves behavior on invalid Python undefined. Valid-input differential token tests are useful; incomplete-source recovery requires its own consumer contract. [Tokenizer contract](https://docs.python.org/3.14/library/tokenize.html).

## Symbol tables and visitors

Annotation scopes now cover type parameters, aliases, defaults and annotations, with special class visibility and lazy evaluation rules. CPython's symtable also performs comprehension-inlining analysis. A 3.9 symbol-table snapshot comparison is not a sufficient 3.14 oracle; decide which exposed scope facts each consumer actually needs. [Execution model](https://docs.python.org/3.14/reference/executionmodel.html), [3.14 symtable](https://github.com/python/cpython/blob/v3.14.0/Python/symtable.c).

PyPy's published 7.3.23 release supports Python 3.11 and 2.7. Its 8.0 release document says 3.12 beta but still has a placeholder release date: treat that as development evidence, not a verified stable release. Released 3.11 code still uses `SymtableBuilder(ast.GenericASTVisitor)` and a DFA-based tokenizer. This is useful organization to study, not a ready 3.14 implementation. [Published release](https://doc.pypy.org/release-v7.3.23.html), [draft](https://doc.pypy.org/release-v8.0.0.html), [visitor](https://github.com/pypy/pypy/blob/release-pypy3.11-v7.3.23/pypy/interpreter/astcompiler/symtable.py), [tokenizer](https://github.com/pypy/pypy/blob/release-pypy3.11-v7.3.23/pypy/interpreter/pyparser/pytokenizer.py).

[Symbol-table visitor PR](https://github.com/skulpt/skulpt-parser/pull/113) has a confirmed static dispatch mismatch: later clauses call `visitSeq(generators.slice(1))`, node dispatch calls `visit_comprehension`, but specialized method remains `visitComprehension`. Generic traversal consequently bypasses its comprehension target/iterator flags and async bookkeeping. Behavioral manifestations need a focused reproduction; none was run. The PR's explanation of `Try` ordering is reversed against its generated visitor, which visits handlers before `orelse`. Its skipped test must be re-examined, not accepted as evidence of harmless ordering alone.

Visitor organization and CPython semantics are compatible. Potential benefit: semantic overrides contain less routine traversal. Risk: inherited fallback silently handles a newly added or misspelled semantic method. Size/speed benefit is unmeasured; PR author reported only a slight speed difference. Generated dispatch checks and targeted scope cases could resolve this uncertainty without a wholesale rewrite.

[Numeric literal fix](https://github.com/skulpt/skulpt-parser/pull/119) addresses partial float matches such as hexadecimal `0x1234e455`; it is independent of upstream strategy. Tooling PRs do not establish language compatibility and are assessed in the tooling investigation.

## Options and smallest useful probes

These are alternatives, not selected architecture:

1. Maintain a TypeScript lexer against pinned CPython behavior; retain generated grammar/ASDL with explicit, reviewable action adaptations. Probe nested f/t strings, multiline expressions, Unicode positions, and lexical errors before estimating full migration.
2. Port relevant C lexer state logic into TypeScript. Probe the smallest interpolation state machine and estimate upstream diff maintenance; source similarity alone does not prove lower maintenance.
3. Reuse a compiled upstream frontend through WebAssembly. Only investigate if consumer requirements permit it; measure total shipped bytes, initialization, memory, and AST transfer costs. No evidence here establishes acceptable size or integration cost.
4. Continue PyPy-derived organization while sourcing modern behavior from CPython. First repair/reproduce visitor dispatch and compare representative scope cases. PyPy's released tokenizer does not remove the modern interpolation work.

Across options, a generation-only probe using an isolated pinned source tree should expose unsupported grammar constructs without touching sibling checkouts. A small cross-version corpus should include matching bindings, later async comprehension clauses, type parameter defaults, deferred annotations, and f/t strings. Strict parsing, diagnostics, symbol facts, and runtime execution are separate acceptance axes. No shipping performance or compatibility claims follow from this research.

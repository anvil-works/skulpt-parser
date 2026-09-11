# Frontend requirements of Anvil IDE and Skulpt

Research for [Identify the frontend requirements of Anvil IDE and Skulpt](https://github.com/anvil-works/skulpt-parser/issues/2), 2026-09-11. This records evidence and decisions still needed; it does not approve an architecture or compatibility policy.

## Evidence and limits

Read the current parser checkout and available sibling consumer checkouts without changing them. Parser API observations below also hold on the public master baseline. Public links identify reusable source evidence. Anvil observations are explicitly sanitized summaries of private source inspection: no proprietary code, file paths, internal links, customer examples, or implementation excerpts are published. They are not independently verifiable from this public report. No application was executed and no performance measurements were taken.

## Consumer requirements

| Area    | Anvil IDE: sanitized observed requirements                                                                                                   | Skulpt: observed requirements                                                                                                   |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Input   | Browser-side source strings, including code currently being edited; both Python 2 and Python 3 selection exist.                              | Source string plus filename and language/future flags enter compilation.                                                        |
| AST     | Existing analysis depends on concrete node constructors, legacy literal nodes, identifier/literal wrappers, and source locations.            | Compiler dispatch depends on AST constructors and runtime values; an arbitrary CPython-shaped AST is not a drop-in replacement. |
| Scope   | IDE performs its own analysis by walking the AST; no direct call to Skulpt's symbol-table builder was found in the inspected editor sources. | Compilation requires symbol tables and AST-to-scope lookup.                                                                     |
| Errors  | Syntax and indentation errors become editor diagnostics; line and optional range information affect recovery behavior.                       | Compiler expects Python runtime exception behavior and uses locations for generated-code tracing.                               |
| Tokens  | Tokenizer-only consumers support indentation and source-editing operations, including locating definition bodies.                            | Existing parser/AST conversion also relies on token information.                                                                |
| Loading | Worker and main-thread consumers exist. Current paths load Skulpt as a script.                                                               | Frontend currently participates in the Skulpt runtime build.                                                                    |

Public Skulpt evidence: [compiler](https://github.com/skulpt/skulpt/blob/master/src/compile.js), [symbol-table implementation](https://github.com/skulpt/skulpt/blob/master/src/symtable.js), and [AST conversion](https://github.com/skulpt/skulpt/blob/master/src/ast.js). The available local Skulpt checkout has additional changes; the table captures shared integration properties, not a claim that upstream master and Anvil's deployed runtime are identical.

## Important integration consequences

**Replacing source-to-AST alone will not remove all IDE dependence on Skulpt.** Sanitized inspection found helper operations for literal representation and conversion as well as tokenization. A standalone IDE milestone needs an inventory of these dependencies and a decision about replacing them or retaining a narrow compatibility layer.

**Incomplete source is an existing workload.** Sanitized inspection found repeated parse attempts with corrections around the cursor and fallback handling. This establishes a need to preserve useful editing behavior; it does not establish that the parser itself must become tolerant. Whether to keep consumer-side repairs, expose recovery support, or use a separate tolerant path remains a decision. Synthetic cases for discussing that contract include `value.`, `call(`, and an unfinished `if ready:` suite. Recovery must preserve the relationship between original source and diagnostic/AST positions.

**Token access remains relevant even with complete AST end positions.** Sanitized inspection found a definition-boundary scan compensating for missing end locations in the current AST. Modern end locations may simplify it, but indentation, comments and trailing whitespace need their own source-editing semantics. Do not assume an AST replacement automatically replaces token-based tools.

**Language version is a real migration boundary.** Sanitized inspection found active Python 2/3 selection in editor parsing. Maintainers must decide whether Python 2 is retained through a legacy route, supported by the new frontend, or retired. Its presence is evidence of an existing code path, not evidence of current user counts or an approved support commitment.

## Existing parser contract

The public parser already exposes string parsing with `exec`, `eval`, and `single` modes and a filename, returning AST directly; file helpers exist alongside it. The top-level module currently exports tokenizer facilities rather than the full parser API. Source: [parser API](../../src/parser/mod.ts), [top-level exports](../../src/mod.ts).

AST nodes use generated classes and kind tags; constants use project-specific wrappers. Errors have their own representation. These differ from Skulpt's objects, so both consumers need a deliberate adapter or migration. Sources: [AST nodes](../../src/ast/astnodes.ts), [constant representations](../../src/mock_types/constants.ts), [errors](../../src/mock_types/errors.ts).

Symbol-table construction is independently callable from an AST. This makes a parser-only consumer possible in principle, but does not prove bundlers can eliminate all unused code. File input references Deno; the string path does not need filesystem access. Sources: [symbol-table API](../../src/symtable/mod.ts), [input helpers](../../src/tokenize/readline.ts).

For Python 3.14 compatibility, source-coordinate units must be explicit: CPython AST columns are UTF-8 byte offsets, while JavaScript string indexing uses UTF-16 code units. Start/end locations, original-source mapping, and non-ASCII fixtures belong in the interface decision. [CPython AST location contract](https://docs.python.org/3.14/library/ast.html#ast.AST). This research did not establish whether every current parser node obeys that contract.

## Tooling and measurement implications

Deno versus another development runner does not decide the browser runtime API. The shipping string-input path must work in the IDE worker, browser main thread where required, and Skulpt's supported environments without requiring Deno. Rsbuild preference can be evaluated against those concrete outputs. Script loading today is an observation, not a requirement to keep a global-script distribution forever.

Existing benchmark scripts time frontend phases and compare with Skulpt; they are useful starting points, not current acceptance data. The historical checkout and master use different benchmark harness generations. No trustworthy current size, memory, cold-load, or editor-latency baseline was established here. Sources: [phase benchmark](../../scripts/bench.ts), [Skulpt comparison](../../scripts/sk_bench.ts).

Proposed workloads for the later measurement decision:

- Valid small modules and larger synthetic modules; parse-only versus parse plus symbol table.
- Repeated edits and incomplete-source retries, including Unicode and nested scopes.
- Cold worker loading and warm requests; distinguish parse time from analysis time.
- Peak and retained memory after repeated requests.
- Minified, gzip and Brotli outputs for parser-only and Skulpt integration, plus net application bytes after removing replaced code.

No numerical budgets are justified yet. No claim of speed or size improvement is made.

## Decisions this research enables

1. Choose the Python 2 migration policy and whether the IDE can ship independently of Skulpt's Python 3.14 execution support.
2. Define public AST/value/error/token contracts and ownership of the compatibility adapters.
3. Decide incomplete-source behavior and who owns recovery and source mapping.
4. Select development tooling and distribution formats against actual browser, worker and runtime boundaries.
5. Establish representative workload and measurement budgets before evaluating architectural performance claims.

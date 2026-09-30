# Performance and robustness implementation review

The code-review skill ran Standards and Spec reviews in parallel against the staged
parser changes since `3667c2129542f1dd457321c6b4e38ad1d4ebd8bd` and the corresponding
consumer harness changes in their own repositories. No new commits were created.
The review includes the restored token-construction and string-prefix optimizations,
development tooling, deterministic robustness smoke, CI and result-selection updates.

The rebuilt core is byte-identical to measured candidate SHA-256
`78ceab086128a8a37904f8dc5b7c8c7dbfce9241f763eb199c8694fd08791e2d`.
Published type declarations remain byte-identical to dev.5. The lexer pair is selected
for staging; mixed p95 and first-operation results keep the release latency gate open.
Constant/regex hoisting and AST optimization remain outside these changes. No package
publication or consumer rollout is included.

## Standards

Standards findings: 0. No actionable documented breaches or consequential heuristic smells.

The restored lexer changes remain local to existing token construction and prefix
scanning. `const middle = …` removes repeated token-type checks;
`if (middle) token.raw = this.mode.raw` removes conditional spread allocation. The
bounded `prefixes` string replaces a per-identifier Set without adding configuration
or abstraction. This fits the smallest-coherent-design rule and existing Scanner
conventions.

Robustness smoke cases use the real `parseModule` path and existing CPython comparison
tests. Consumer benchmarks exercise production worker RPC and runtime parse/compile
paths. They avoid test-only production wrappers and unrelated fixes.

Report updates identify two lexer changes as selected for staging, retain historical
capture decisions separately, exclude constants hoisting and optimizer implementation,
and explicitly leave the release latency gate open.

Review covered the three staged snapshots read-only. No files or index entries changed;
no heavy tests ran.

## Spec

One staging-completeness finding: the results document linked this review report while
it was still untracked and absent from the reviewed index. The relevant spec requires
delivery of reproducible commands, raw reports/profiles, before/after results, ranked
follow-ups and code-review. The completed report is now included in the staged selection,
resolving that finding.

No behavioral or scope findings. Tokenizer changes implement only the two selected
lexer optimizations. Indexed summaries preserve historical decisions separately from
current selection and explicitly retain `releaseLatencyGateCleared: false`. Consumer
tooling stays in consumer repositories; public entry-point exports remain unchanged.

## Validation

The restored source passed 2,067 parser tests, including existing Python 2 coverage,
typechecking, core/expression/package checks and live CPython comparisons of 560
retained sources plus ten stdlib modules. AST/parser generators and the robustness
smoke generator are fresh. Formatting and staged whitespace checks pass.

Existing execution, tokenizer, location and IDE checks apply to the same exact measured
candidate artifact. Their reports retain the two baseline-reproduced adapter golden
differences and the IDE unfinished-f-string limitation. Independent diagnostic defects
remain follow-ups.

Standards: 0 findings. Spec: 1 staging-completeness finding, resolved; 0 remaining.
Neither axis has an unresolved issue.

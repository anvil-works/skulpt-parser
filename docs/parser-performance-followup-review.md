# Performance follow-up review

Reviewed the working-tree follow-up against parser commit
`3c1b1d9e00f93d27774ce2c3b205e30c4a25fdcb`, the consumer benchmark against Skulpt
adapter commit `12c51fdf26b852a9f3f64b6f001e4bbbc02133cb`, and the new Anvil reports.
Earlier uncommitted optimizer harness/report work was distinguished from this pass.
Independent Standards and Spec agents reviewed implementation and then rechecked
final raw evidence and conclusions using the code-review skill.

## Standards

No remaining documented-standard breaches or actionable Fowler smells. Review
found one minor raw-report filename reference in the generic summary; it was
corrected to include the checked-in `parser-followup-` prefix. There were no code
findings.

Provenance checks passed: current parser source hashes match the manifest, both
instrumented profile bundles match recorded hashes, and the captured consumer
harness matches its manifest hash. Raw captures retain versions, hardware,
source/bundle hashes and paired samples. Profile sources, bundles and CPU/heap
captures remain in the local evidence archive.

Generic parser reports contain generic workloads and aggregate consumer findings;
application selection and Anvil policy remain in Anvil. Documentation distinguishes
compiler-wide gains, noisy controls, negative initialization heap deltas and
retained versus peak memory. The multiline diagnostic discrepancy is explicitly
an independent follow-up.

## Spec

No remaining actionable findings. The selected identifier fast path follows the
request for local reductions in repeated work. Its byte/character guard safely
skips ASCII normalization; Unicode semantics, grammar, AST types and memoization
stay unchanged. Rejected trials are documented rather than retained.

Measurements use five paired rounds in fresh processes/contexts, alternating
order, correctness before timing, separate initialization/first/warmed results,
source and bundle provenance, and reported size changes. Real consumer ASTs,
positions, warnings and paired compiler output remain equivalent.

Conclusions stay within the evidence. Reports disclose mixed numeric-control
timings and small worker-tail increases, claim warmed gains rather than uniformly
faster startup, and attribute original-Skulpt compilation differences to the full
integration, including earlier compiler patches. Optimizer adoption stays unchanged.

The three agreed diagnostic mismatches are repaired with seven independent CPython
fixtures. The separately discovered multiline STRING `error.text` mismatch predates
this pass in both dev.6 and the candidate. Eight minimized cases and an explicit
follow-up satisfy the instruction to record independent defects as follow-ups;
it is neither an introduced regression nor a missing agreed repair.

Public APIs and options remain unchanged. After this review, the user authorized
the packaging-only version bump to `0.0.1-dev.7` and committing/pushing the parser
changes to `anvil/dev`. Publication and consumer rollout follow separately.

Standards: 0 remaining findings, one report reference corrected. Spec: 0 findings.

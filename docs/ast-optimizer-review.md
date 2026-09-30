# AST optimizer review

Reviewed the dev.6 optimizer candidate against parser commit
`f5182f0034d0717c21776d8fd235ebc9022f477d` and the new consumer harness against
Skulpt adapter commit `12c51fdf`. The preceding performance changes are separate
from this optimizer release.

The originating request was to implement the compiler optimization that computes
literal expressions such as `1 + 2`. The scope is recorded in
[the optimizer document](ast-optimizer.md). Standards and Spec were reviewed by
independent parallel agents using the code-review skill, including new untracked
files. Both axes received a final recheck after semantic corrections.

## Standards

No findings. The implementation follows documented development standards:
handwritten TypeScript, generated AST schema untouched, pinned CPython fixture
generation in freshness CI, and explicit consumer validation commands.

No actionable baseline smells. The separate entry point keeps compiler work out
of parser imports. Bounds, traversal, scalar operations and tuple handling remain
in one module without introducing configuration or speculative abstractions.
Tests protect values and float bits, spans, runtime errors, annotations, docstrings,
bindings, assignment contexts, long chains and Python 2 exclusion.

## Spec

No remaining actionable findings. Explicit optimization folds `1 + 2`, while
default parsing stays unchanged. It preserves spans, control flow, bindings,
docstrings and Python 2 separation.

Review found that folding annotations could change observable strings under
`from __future__ import annotations`. The final pass skips annotations and lazy
type-definition fields, with regression coverage. Surrogate-pair indexing and
newly joined surrogate boundaries also stay unfolded because their Python
character structure cannot be proven from the existing UTF-16 payload.

Arithmetic bounds, signed zeros, bool/int result types, tuple contexts and
runtime-error guards are consistent with the scoped request. No publication or
runtime rollout is included. Skulpt's existing float-floor difference is recorded
in the optimizer document for consumer adoption.

## Consumer performance recheck

Both axes rechecked the benchmark additions and reports. No actionable findings
remain. The harness keeps correctness checks and compilation outside execution
timing, uses five fresh-process paired rounds with alternating engine order, and
retains raw samples, source/artifact hashes, initialization, first-operation,
warmed latency and heap fields. The existing original/adapter/direct benchmark
paths also passed a smoke check.

Reports distinguish the 9–19% compilation overhead on real consumer modules from
35–70% execution gains in synthetic literal-heavy loops. The dynamic control
produces byte-identical compiled code with and without optimization in both
compiler paths; its small timing changes are variation, not an optimization
claim. No whole-application or browser improvement is claimed.

Keep the ordinary AST as Skulpt's default. The optimizer remains optional;
automatic wiring and the existing runtime float-floor difference are deferred.

Standards: 0 findings. Spec: 0 remaining findings; annotation finding corrected.

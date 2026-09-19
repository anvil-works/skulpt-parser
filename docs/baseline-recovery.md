# Baseline recovery evidence

Date: 2026-09-15. Upstream base: `ae256889f0956d6dc102edd39f1a9555e97e850b`. Branch: `stu-dev/tooling/baseline-recovery`. The user's `tokenize-pypy` checkout and sibling Skulpt/CPython trees were not modified.

## Changes needed to run

The recovered runner uses pnpm 10.10.0, Rslib 1.0.0, Rstest 0.11.12 and TypeScript 5.9.3. Dependency resolution is locked. Source checks and declarations use the same compiler configuration. Tests use CPython 3.9.25, while existing generated sources retain their CPython 3.9.5 provenance.

Deno test registration and file access were replaced with Rstest and Node calls. Reference helpers run inside persistent Python workers with ordered request/reply handling. A regression test exercises concurrent requests around a syntax error, ensuring later replies are still delivered correctly. AST dump indentation selection is deterministic instead of random, and generated test expressions receive imported constructors explicitly rather than relying on names surviving bundler transformation of `eval`.

Node filesystem helpers moved to a separate entry. Diagnostic color imports no longer pull Deno URL dependencies into frontend sources. Legacy decorator emission is explicitly enabled because the existing generated parser's memoization decorators require that calling convention.

Two small source changes unblock the declared build target without changing intended behavior: float helper null branches return `null` explicitly so TypeScript infers the existing return type correctly; numeric underscore stripping uses a global regular expression instead of ES2021 `replaceAll` under the ES2020 target. No grammar, generated parser, symbol-table algorithm or cache tuning was changed.

## Validation

On macOS arm64, builds and source checks pass. The recovered suites pass on Node 26.7.0 and Node 22.14.0 with the pinned CPython oracle. The final suite includes 1,738 passing tests and one pre-existing skipped Unicode-position fixture. Tests cover AST dumping, source parsing, symbol tables, optimization and persistent-oracle request/error handling.

The package smoke check exercises the built web entry without Node/Deno globals or external modules and compares its parsed AST with the normal package import. It also exercises Node file parsing and checks that exported declaration entry files exist. This does not certify Safari or other real browser environments.

The ES2020 web entry measures 180,294 raw bytes, 33,848 gzip bytes and 26,369 Brotli bytes. The Node helper adds 586 raw, 271 gzip and 236 Brotli bytes. These compression figures use Node 26.7.0, gzip level 9 and Brotli quality 11. Node 22.14.0 produces 34,115 gzip bytes for the identical web artifact; compression-library versions affect the result. These are baseline artifact costs, not a performance improvement claim or an integrated consumer-size budget. Runtime speed and peak/retained memory budgets remain future measured acceptance work.

The previous Deno setup was not executed as a before/after timing control. Initial recovery failures concerned decorator configuration, bundled eval bindings, Node filesystem bundling, and declaration generation; they are resolved. The existing `t542.py` position skip remains. The Python PEG harness and generation checks are not recovered and are documented explicitly in the README. No claim of complete Python 3.9 or Python 3.14 compatibility is made.

Focused YAML, whitespace, Flake8, Prettier and license checks pass. The old Black 21.10b0 hook is incompatible with the installed Click dependency; the new Python helper was formatted separately with Black 24.10.0, and that legacy hook was skipped. Full pre-commit toolchain refresh is not part of this baseline.

## Next stage

Introduce isolated pinned Python 3.14 generation inputs and establish strict source-to-AST behavior under the agreed contract. Bring in the selected CPython-shaped tokenizer with its outstanding warnings/interpolation requirements. Preserve this baseline as a comparison point, carry useful legacy PEG cases into the conformance suite, and defer selective cache optimization until profiling identifies worthwhile rules.

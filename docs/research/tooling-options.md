# Tooling and distribution options for the parser

Research for [Compare modern tooling and distribution options for the parser](https://github.com/anvil-works/skulpt-parser/issues/3), part of [Python 3.14 frontend for Anvil IDE and Skulpt](https://github.com/anvil-works/skulpt-parser/issues/1). Investigated 2026-09-11. This records evidence and proposed comparisons, not the maintainer's tooling decision.

## Findings that change the decision

Deno versus Node and Rsbuild versus esbuild are separate choices. The development runtime does not need to be the consumer runtime. Rslib is an Rsbuild-based library builder, and its current documentation explicitly supports Deno as well as Node and Bun. Keeping Deno therefore does not rule out the maintainer's preferred build ecosystem. [Rslib overview](https://rslib.rs/), [runtime support](https://rslib.rs/guide/start/quick-start).

Rslib deserves evaluation before configuring Rsbuild directly for this library. It adds library-specific output and declaration configuration while retaining Rsbuild configuration. There is no measured reason yet to claim it produces smaller or faster parser code. [Configuration](https://rslib.rs/guide/basic/configure-rslib).

## Existing project evidence

Source inspection uses the working branch commit [bd7d5acc52b70372be6c28808405fe8a14f0b82f](https://github.com/skulpt/skulpt-parser/commit/bd7d5acc52b70372be6c28808405fe8a14f0b82f), not master. This research-only branch starts from master.

- [deno.json](https://github.com/skulpt/skulpt-parser/blob/bd7d5acc52b70372be6c28808405fe8a14f0b82f/deno.json) runs Deno tasks with the old broad unstable flag. Grammar tasks assume the checkout directory is named `skulpt_parser`.
- [deps.ts](https://github.com/skulpt/skulpt-parser/blob/bd7d5acc52b70372be6c28808405fe8a14f0b82f/deps.ts) pins 2023-era URL imports, including std 0.179.0, esbuild 0.17.11 and deno_python 0.2.4. Its central barrel mixes test, CLI, build and Python dependencies.
- [test_runner.ts](https://github.com/skulpt/skulpt-parser/blob/bd7d5acc52b70372be6c28808405fe8a14f0b82f/scripts/test_runner.ts) uses `Deno.run`. Modernization must replace that call with supported subprocess APIs. Deno documents its soft removal in version 2. [Migration guide](https://docs.deno.com/runtime/reference/migration_guide/).
- [build.ts](https://github.com/skulpt/skulpt-parser/blob/bd7d5acc52b70372be6c28808405fe8a14f0b82f/scripts/build.ts) bundles `scripts/bench.ts`, not a shipping library entry. The separate bundle task targets [src/mod.ts](https://github.com/skulpt/skulpt-parser/blob/bd7d5acc52b70372be6c28808405fe8a14f0b82f/src/mod.ts), which exports tokenizer APIs only. Neither defines the intended source-to-AST distribution contract.
- [readline.ts](https://github.com/skulpt/skulpt-parser/blob/bd7d5acc52b70372be6c28808405fe8a14f0b82f/src/tokenize/readline.ts) contains Deno file access. Browser builds need an audited source-string entry and an explicit separation from filesystem helpers.
- [tools/env.py](https://github.com/skulpt/skulpt-parser/blob/bd7d5acc52b70372be6c28808405fe8a14f0b82f/tools/env.py) checks out CPython v3.9.16 in a sibling directory. [Generator entry](https://github.com/skulpt/skulpt-parser/blob/bd7d5acc52b70372be6c28808405fe8a14f0b82f/tools/gen_parser/__main__.py) temporarily replaces CPython's generator. Dependency upgrades alone cannot make this regeneration reproducible and isolated.

## Development and tests

| Candidate                                       | Supported capability                                                     | Project-specific work or uncertainty                                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Modern Deno                                     | TypeScript tooling and existing test style; npm and package.json support | Replace old APIs and dependencies; verify Rslib with the chosen pinned Deno release and native dependencies                          |
| Node with TypeScript compilation                | Standard package workflow; built-in test runner                          | Port Deno test registration, assertions and file/process utilities, or retain a separate test runner; select explicit TS compilation |
| Deno tests plus an Rsbuild-family library build | Preserves tests while evaluating new output tooling                      | Decide whether running both Node and Deno adds value; Rslib's Deno support may avoid that requirement                                |

Modern Deno supports package.json and Node APIs, so adopting npm-style distribution need not force a test-runtime migration. Compatibility is broad support, not proof that this exact dependency graph works. [Deno Node/npm compatibility](https://docs.deno.com/runtime/fundamentals/node/).

Node's native TypeScript execution strips erasable types, does not type-check and does not support enums through type stripping. This project has enums in generated AST and token code. Running current sources directly under plain Node is therefore not an adequate migration plan. Use a transpilation step and explicit type-checking if selecting Node. Node also supplies a built-in test runner. [TypeScript support](https://nodejs.org/api/typescript.html), [test runner](https://nodejs.org/api/test.html), [project token enums](https://github.com/skulpt/skulpt-parser/blob/bd7d5acc52b70372be6c28808405fe8a14f0b82f/src/tokenize/token.ts).

## CPython oracle

The [Deno Python test integration](https://github.com/skulpt/skulpt-parser/pull/123) seeks to avoid per-fixture interpreter startup. Preserve that requirement when comparing these options:

| Option                                    | Likely tradeoff, requiring measurement                                                                |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| One Python process per case               | Simple isolation, repeated startup                                                                    |
| Persistent Python process per test worker | Amortized startup, explicit serialized request/response boundary                                      |
| Embedded Python through FFI               | Direct object calls, but native-library discovery, binding compatibility and object lifetime concerns |

Both runtimes can manage persistent subprocesses with piped standard streams. A small JSON-lines protocol could return normalized AST, symbol-table or error records. This is a proposal, not an implemented or benchmarked design. Use the same requested CPython version and normalization in every comparison. [Deno subprocess API](https://docs.deno.com/api/deno/subprocess/), [Node child processes](https://nodejs.org/api/child_process.html).

Deno FFI loads native shared libraries. CPython embedding adds interpreter initialization and object conversion responsibilities. The old binding's compatibility with modern Deno and CPython 3.14 remains unverified. Historical improvement over repeated startup does not establish an advantage over a persistent process. None of these oracle dependencies belongs in the browser artifact. [Deno FFI](https://docs.deno.com/runtime/fundamentals/ffi/), [CPython embedding](https://docs.python.org/3.14/extending/embedding.html).

## Build output and consumers

Rslib supports ESM, CJS, UMD and IIFE, plus Module Federation. ESM is a useful candidate for Anvil bundler integration; a global build is a candidate if Skulpt needs script-tag distribution. Add formats only after actual consumer requirements establish the need. Multiple formats add packaging tests and can duplicate module identity when mixed. [Output formats](https://rslib.rs/guide/basic/output-format).

Rslib supports bundled and bundleless output. It can generate declaration files, with bundled declarations using API Extractor. Start evaluation with explicit type output and a browser target, since its general solution documentation says the default target is Node. [Output structure](https://rslib.rs/config/lib/bundle), [declarations](https://rslib.rs/config/lib/dts), [targets](https://rslib.rs/guide/solution/).

Current `deno bundle` is available and uses esbuild internally. The old claim that Deno's bundler was removed is no longer a useful basis for this decision. Its browser platform and minification support make it a comparison candidate; choosing it would retain esbuild rather than follow the Rsbuild preference. [Deno bundle](https://docs.deno.com/runtime/reference/cli/bundle/).

Tree shaking must be tested through consumer entry points. Importing only parsing should demonstrate whether optimizer, symbol-table, CLI, Python bridge and unused runtime helpers disappear. ESM enables static analysis but does not guarantee elimination of everything a consumer does not call. Generated node classes, dispatch and side effects must be assessed in the actual emitted graph. This is a proposed acceptance check, not a measured finding.

## Reproducibility and measurements

Use a pinned runtime, compiler/builder and dependency lockfile. Deno offers frozen lockfiles; npm offers `npm ci`, which rejects manifest/lock disagreement. Pin the Python executable version and exact CPython generator input commit independently. Generate from a dedicated checkout or immutable source input, leaving the developer's sibling repository untouched. [Deno locks](https://docs.deno.com/examples/dependency_lockfile_tutorial/), [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/).

The following measurements would distinguish the candidates without turning this research into implementation:

1. Build the same public entry points at the same JavaScript target, with matching externals and source-map policy. Record minified bytes and gzip/Brotli bytes with fixed compression settings. Count externally supplied runtime code separately rather than hiding it.
2. Inspect parser-only, parser plus analysis, and integrated Skulpt output. Record the net application change after old code is removed, not just the new library's standalone size.
3. Measure cold import and warmed parsing latency in representative browsers. Keep build speed and Python test-oracle speed separate from shipped parser speed.
4. Measure peak and retained memory after repeated parse/drop cycles. Separate live ASTs from discarded parse state and document garbage-collection methodology.
5. Compare clean and incremental build/test times, CI setup burden and declaration correctness. No candidate has been benchmarked in this research.

The human decision can now compare modern Deno plus Rslib, Node plus Rslib, and a minimal esbuild-based baseline. Consumer formats, browser targets and the maintainer's preference should determine the shortlist before any broad tooling rewrite.

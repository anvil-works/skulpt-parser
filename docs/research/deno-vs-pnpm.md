# Deno versus Node and pnpm for CPython-backed tests

Research for [Compare latest Deno with Node and pnpm for CPython-backed tests](https://github.com/anvil-works/skulpt-parser/issues/11), investigated 2026-09-11. This supplements [the earlier tooling investigation](https://github.com/anvil-works/skulpt-parser/blob/research/tooling-options/docs/research/tooling-options.md); it does not settle the tooling decision.

## Recommendation

Compare **modern Deno + Rslib** against **Node + pnpm + Rslib + Rstest**, using a persistent or batched CPython subprocess as the common test oracle. Do not treat keeping Deno as avoiding migration, or the historical Python bridge speedup as a reason Node must lose. On present evidence, Node/pnpm is the stronger long-term default given the maintainer's existing workflow, but Deno may still require less test migration. A small executable comparison should resolve that tradeoff before choosing.

Rslib explicitly supports Deno and Node; its npm package can be installed by either package manager. Build choice therefore does not settle test runtime choice. [Rslib quick start](https://rslib.rs/guide/start/quick-start).

## What the historical improvement establishes

The maintainer reported approximately four minutes becoming 30 seconds in [Deno python](https://github.com/skulpt/skulpt-parser/pull/123). Source inspection shows the preceding AST and symbol-table helpers launched Python for each comparison; the new helpers import Python functions once and call them through FFI. The PR also changes test organization and CI, so this is historical whole-workflow evidence, not an isolated FFI benchmark.

On checkout `bd7d5acc52b70372be6c28808405fe8a14f0b82f`, the main AST and symbol-table oracle results are serialized dumps. They do not inherently require rich Python objects in JavaScript. However, `peg_parser.test.ts` also consumes Python arrays, `ast.parse` results and exceptions directly: replacing its bridge requires explicit normalized results, not merely changing process-launch syntax. [Tests and helpers](https://github.com/skulpt/skulpt-parser/tree/bd7d5acc52b70372be6c28808405fe8a14f0b82f/tests).

A persistent subprocess under either runtime can amortize interpreter startup. Batching fixture comparisons is another candidate. Both still incur serialization, unlike direct FFI. Neither has been benchmarked here. [Deno subprocesses](https://docs.deno.com/api/deno/subprocess/), [Node child processes](https://nodejs.org/api/child_process.html).

## Current Python bridge evidence

The latest published `deno_python` release is **0.4.6, 2025-10-19**. It includes a fix for callback garbage collection causing a segmentation fault. The project is not archived; it has newer work than this repository's pinned 0.2.4. That establishes maintenance activity, not a support guarantee. [Release](https://github.com/denosaurs/deno_python/releases/tag/0.4.6).

Current CI requests latest Deno and Python **3.13** on Linux, macOS and Windows. The source's automatic Python-library discovery lists **3.8 through 3.13**, not 3.14. `DENO_PYTHON_PATH` can supply an explicit library path, so the missing discovery entry does not prove incompatibility. **CPython 3.14 compatibility remains unverified.** A CI configuration is evidence of intended coverage, not proof that today's release passes. [CI configuration](https://github.com/denosaurs/deno_python/blob/main/.github/workflows/checks.yml), [library discovery](https://github.com/denosaurs/deno_python/blob/main/src/ffi.ts).

Embedding requires a Python shared library, not just an executable. The README documents platform-specific DLL/dylib/so paths and excludes Microsoft Store Python. Its flags and Docker example retain old Deno details, so current Deno documentation should govern permissions. Linux initialization explicitly loads `libc.so.6` and queries glibc: do not assume Alpine/musl portability. [Installation](https://github.com/denosaurs/deno_python#python-installation), [native initialization](https://github.com/denosaurs/deno_python/blob/main/src/util.ts), [current Deno FFI](https://docs.deno.com/runtime/fundamentals/ffi/).

Operational inference: FFI shares interpreter state and native failure fate with the test host. A persistent subprocess also retains state between requests, but can be restarted independently and selected by Python executable. Either approach needs fresh per-request test namespaces and deliberate failure handling. Embedded Python per test worker requires checking interpreter/thread lifetime behavior; it should not be assumed equivalent to independent Python processes.

## Migration inventory

The inventory below concerns the working branch, not master. Counts include commented occurrences and are indicators of location, not effort estimates.

| Area                        | Latest Deno                                                                                                       | Node and pnpm                                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Runtime-specific code       | Replace old subprocess APIs, obsolete flags, old URL dependencies and types                                       | Port Deno registration/assertion/filesystem/process utilities; choose test runner and TS transform |
| Tests                       | Six files contain roughly 72 `Deno.test` occurrences                                                              | Registration is largely mechanical; Python proxy/object/exception tests are the substantive port   |
| Scripts and production seam | Eight script files use Deno; one source file, `src/tokenize/readline.ts`, accesses filesystem                     | Same filesystem separation needed for browser distribution; scripts need Node equivalents          |
| Python oracle               | Upgrade and verify binding, or move to subprocess                                                                 | Use subprocess unless a separate embedding dependency earns its cost                               |
| TypeScript                  | Keep explicit checking and legacy decorator configuration                                                         | Add explicit checking and transformation; plain Node type stripping is insufficient                |
| Shared work                 | Rslib entry/output/declarations, dependency separation, deterministic CPython generation, current parser breakage | Same                                                                                               |

Generated parser code uses legacy three-argument `@memoize` decorators and generated enums. Plain Node TypeScript execution neither transforms these decorators nor handles enums. Any selected transform must preserve the legacy decorator semantics. Rslib compilation alone must not be mistaken for test type checking. [Node TypeScript documentation](https://nodejs.org/api/typescript.html), [project parser](https://github.com/skulpt/skulpt-parser/blob/bd7d5acc52b70372be6c28808405fe8a14f0b82f/src/parser/pegen.ts), [Deno migration guide](https://docs.deno.com/runtime/reference/migration_guide/).

## Versions, native dependencies and CI

GitHub's latest stable-release endpoints returned **Deno 2.9.6** (2026-08-27) and **pnpm 12.3.4** (2026-09-04) during this investigation; both predate the session date. Local installed versions are older and must not stand in for testing current stable. Pin exact runtime/package-manager versions for a probe and record them with results. [Deno release](https://github.com/denoland/deno/releases/tag/v2.9.6), [pnpm release](https://github.com/pnpm/pnpm/releases/tag/v12.3.4).

Deno supports npm Node-API addons with local `node_modules` and FFI permission; dependency lifecycle scripts do not run by default. This matters for the native Rspack dependency graph behind Rslib. Check the actual install/build rather than assuming general npm compatibility guarantees this graph. [Deno Node/npm compatibility](https://docs.deno.com/runtime/fundamentals/node/), [Deno installation](https://docs.deno.com/runtime/reference/cli/install/).

Current pnpm documentation uses `allowBuilds` for per-dependency lifecycle-script approval and defaults `strictDepBuilds` to true. Older `onlyBuiltDependencies` guidance is obsolete for pnpm 11+. Commit the approvals actually needed by the selected dependency graph; avoid blanket approval. Native binaries and lifecycle scripts are different concerns: the existence of a native dependency does not itself prove a build script is required. [Build settings](https://pnpm.io/settings/build).

For either candidate, CI needs a frozen dependency lock, exact Python version, and deterministic generator inputs. pnpm supports frozen installs; Deno supports frozen locks. If using FFI, additionally pin library discovery and verify the actual loaded Python version. A subprocess only needs the selected executable, although its Python installation still has normal OS dependencies. [pnpm install](https://pnpm.io/cli/install), [Deno lockfiles](https://docs.deno.com/examples/dependency_lockfile_tutorial/).

## Smallest useful validation

Run an isolated tooling probe, not a project migration:

1. Install the same pinned Rslib under current Deno and Node/pnpm; produce a browser ESM artifact and declarations from a representative entry containing the real enum/decorator code. Verify invocation of a memoized method and a clean frozen reinstall.
2. Against one pinned CPython 3.14 executable, run AST, symbol-table and syntax-error comparisons through a persistent/batched subprocess under both runtimes. Include non-ASCII source and repeated requests. Separately test `deno_python` 0.4.6 using its explicit library-path override.
3. Compare identical results, clean setup burden, total corpus time, Python startup count, host/child peak memory, and teardown behavior. Measure once with cold startup and again with amortized startup. Keep these distinct from shipped parser speed and bundle size.
4. Choose tooling from those results and maintenance fit. Preserve successful Python startup amortization regardless of runtime.

No benchmark or CPython 3.14 bridge execution was performed in this investigation; no 3.14 installation was available locally. Source/documentation evidence is enough to reject an assumed automatic bridge upgrade, but not to reject FFI outright.

## Rstest clarification

The maintainer prefers Rstest if moving away from Deno. The concrete Node candidate is therefore Node + pnpm + Rslib + Rstest. Rstest supports TypeScript test inputs and explicitly documents `source.decorators.version: "legacy"` for TypeScript experimental decorators. This addresses the parser's transform requirement; retain a separate TypeScript checking step. [Quick start](https://rstest.rs/guide/start/quick-start), [decorator configuration](https://rstest.rs/config/build/source).

Port Deno registrations to Rstest tests and map assertions, skips and lifecycle cleanup deliberately. Rstest documents test-file isolation; do not rely on a module singleton to provide one Python process across all files. Initially scope the persistent Python oracle to one suite using asynchronous setup/teardown, then measure worker/process multiplication before adding concurrency. Verify cleanup after a failed test and failed setup in the probe. This is a proposed lifecycle design, not a tested Rstest integration. [Isolation](https://rstest.rs/config/test/isolate), [test hooks](https://rstest.rs/api/runtime-api/test-api/hooks).

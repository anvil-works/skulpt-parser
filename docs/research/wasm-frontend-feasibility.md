# WASM frontend: language choice and experiment design

Date: 2026-09-14. This records feasibility research and selects an experiment implementation language. No WASM frontend has been built or benchmarked yet. The production WASM decision remains open.

## Choose C for the experiment

Use C with Clang/Emscripten initially, preserving CPython 3.14.3 source where practical. The maintainer prefers a minimal port if literal source reuse drags in excessive runtime support; checking that boundary is part of the experiment. C avoids translating the upstream implementation into another language. Zig remains a possible way to compile the same C through zig cc, not a reason to rewrite it. There is no demonstrated universal bundle-size advantage to a Zig rewrite. Zig does support freestanding WASM and size optimization, but those capabilities alone do not compare equivalent frontend implementations. [Zig language reference](https://ziglang.org/documentation/0.16.0/#WebAssembly), [Zig C toolchain overview](https://ziglang.org/learn/overview/).

The user's priorities are end-to-end speed, runtime memory, compressed shipped size and maintainability. A language choice is subordinate to those measurements. C is selected for this experiment because of upstream reuse; it is not declared the smallest possible implementation language.

## What actual CPython reuse entails

The pinned lexer is not an independent C library. It allocates memory, constructs Unicode objects, validates identifiers and reports Python exceptions. The PEG parser uses Python values for identifiers and literals, an arena, interning, and calls unicodedata.normalize for non-ASCII identifier normalization. String decoding also uses Python object and warning APIs. Copying just the generated grammar or lexer does not remove those dependencies. [Lexer](https://github.com/python/cpython/blob/v3.14.3/Parser/lexer/lexer.c), [PEG parser](https://github.com/python/cpython/blob/v3.14.3/Parser/pegen.c), [literal decoding](https://github.com/python/cpython/blob/v3.14.3/Parser/string_parser.c).

The following reuse boundaries must be distinguished:

| Boundary                                                  | Benefit                                                                                           | Cost to establish                                                                                                                                                                |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Embedded CPython WASM interpreter                         | Uses the existing runtime and official build route; useful as a reuse/control baseline if needed. | Includes runtime, loader and required library data. Measure everything actually shipped. It is not a frontend-only artifact.                                                     |
| CPython-derived C frontend with narrow support interfaces | Can avoid unrelated interpreter facilities and expose a small source-to-result API.               | Requires a dependency audit and explicit adaptations for values, Unicode, allocation and diagnostics. The shim may become expensive to maintain or recreate much of the runtime. |

CPython 3.14.3 documents an Emscripten embedding that loads python.mjs and installs its standard library in the Emscripten filesystem. That is evidence of a supported embedding route, not evidence for a minimum parser bundle size. The example terminal uses SharedArrayBuffer, but Python itself does not require it. No threading or cross-origin-isolation requirement is selected for this experiment. [Pinned WASM build and embedding instructions](https://github.com/python/cpython/blob/v3.14.3/Tools/wasm/README.md).

Start by identifying the actual dependencies of the pinned lexer, parser, generated AST constructors, literal helpers and error paths. Keep copied source and adaptations separately reviewable, with the PSF license and revision provenance. If isolating them requires reimplementing a large Python object runtime, report that as a maintainability result before pursuing the extraction further. The existing TypeScript port provides adaptation evidence, not proof that equivalent C changes will be cheap.

## Minimal-port boundary

The maintainer explicitly prefers a minimal port over complete source reuse if the latter pulls in excessive dependencies. This is permission to adapt implementation where justified, while preserving pinned CPython behavior and an understandable upstream update path. Do not create a general Python-object compatibility runtime just to keep source files textually unchanged.

A source audit of the three pinned files above establishes the following candidate split. This is not a linker reachability result or a measured size saving:

| Dependency                                   | Required frontend behavior                                                  | Candidate minimal-port treatment                                                                                                                           |
| -------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Python objects and reference counting        | Identifiers, literal values and interpolation metadata must remain correct. | C data structures, source spans and explicit ownership; materialize the agreed JS values at the boundary.                                                  |
| PyMem and PyArena                            | Temporary tokens, memoization and AST lifetime.                             | A bounded frontend allocator/arena with explicit result lifetime; measure peak and retained memory.                                                        |
| Python exception and warning machinery       | Exact relevant categories, messages and locations, plus warnings.           | Structured diagnostic records and the agreed host warning delivery, preserving upstream error paths where practical.                                       |
| Unicode identifier validation                | CPython-compatible identifier acceptance and invalid-character diagnostics. | Reuse suitable tables/routines or generate a narrow equivalent. These data remain real costs.                                                              |
| unicodedata.normalize import and Python call | NFKC identifier normalization.                                              | A narrow normalizer or validated host service. Browser Unicode versions must not silently replace the pinned reference semantics.                          |
| Python numeric and string objects            | Exact literal decoding, limits, escape behavior and scalar distinctions.    | Frontend-specific decoding/data with measured bulk conversion into the agreed JS values. Do not assume host conversions alone reproduce Python validation. |
| Interpreter state, imports and file input    | Some original entry points support more than source-string parsing.         | Omit unused entry points; replace genuinely required configuration with explicit frontend context.                                                         |

The PEG algorithm, grammar, lexer state machine, generated AST schema and targeted diagnostic logic remain the upstream reference. Generation can adapt semantic actions to the frontend's own data types, as the TypeScript project already does conceptually. The cost is a maintained adaptation layer, which must be counted alongside download and runtime gains.

First inspect transitive requirements and produce a buildable lexer slice. If the slice is only small because Unicode, interpolation or diagnostics were omitted, it is not evidence for the complete product. Extend to AST construction only with the missing behavior clearly tracked. A full embedded interpreter may be a useful control if it helps answer the question, but is not the preferred shipping direction.

## Size controls to measure

- Compare -Oz with a speed-oriented optimized build such as -O2. Apply LTO at compilation and linking. Keep only required exports and supported environments. [Emscripten optimization guide](https://emscripten.org/docs/optimizing/Optimizing-Code.html).
- wasm-ld removes unreferenced functions and data by default. Export roots retain transitive dependencies, so the reachable object/Unicode/error implementation matters more than unused source files. [LLVM WASM linker](https://lld.llvm.org/WebAssembly.html#garbage-collection).
- Remove filesystem support only for a boundary that does not need it. Compare minimal loader configurations rather than assuming Emscripten glue is necessarily large. STANDALONE_WASM can still require WASI or other imports; it does not mean browser-instantiable without support. [Emscripten settings](https://emscripten.org/docs/tools_reference/settings_reference.html).
- Compare allocator choices on the real workload. emmalloc targets smaller code, whereas the documented dlmalloc tradeoff suits many small allocations. AST allocation patterns could outweigh the static saving. Per-parse arena ownership is a candidate to investigate, not an established zero-copy interface. [Allocator settings](https://emscripten.org/docs/tools_reference/settings_reference.html#malloc).

Report raw/minified loader bytes and raw WASM bytes, gzip and Brotli of every shipped component, Unicode/library data, and adapter code. Also report net consumer size after removing replaced TypeScript. Do not compare compressed WASM against uncompressed JavaScript or omit initialization/support assets.

## Executable comparison sequence

1. Establish a buildable C dependency boundary and a concrete adaptation inventory. Start with the actual CPython lexer as a bounded feasibility slice, keeping the complete parser dependency map visible. A scanner result alone cannot decide the production WASM question.
2. Compare the C slice with the existing full TypeScript scanner on identical token and diagnostic workloads. Account for UTF-16 to UTF-8 conversion, transfer into WASM memory, result transfer and token materialization. Avoid per-character or per-token JS/WASM calls where a bulk interface suffices. If correctness or diagnostics are incomplete, label the slice and do not present it as equivalent.
3. Extend the credible boundary to source-to-consumer-usable AST. Compare against a matching TypeScript parser, using the same scalar values, positions, diagnostics and warning behavior. Stop timing only after the JS consumer can use the AST. Data still in WASM memory, Python AST objects or serialized text is not the agreed result by itself.
4. For time to compilation, feed each resulting AST through the same Skulpt adapter/compiler path and compare equivalent output/behavior. CPython bytecode generation is not a substitute for Skulpt JavaScript compilation. Report parser, conversion, analysis and compiler costs separately so a fast stage does not hide a slower total.

The current TypeScript experiments provide a Python 3.14 tokenizer baseline. They do not yet provide an integrated Python 3.14 source-to-AST-to-Skulpt-compiled-output baseline. The old parser checkout also has a broken tokenizer import path. Full pipeline claims therefore require additional integration work; common-subset exploratory measurements must be labelled as such. This work must not silently turn into the entire production migration merely to obtain a benchmark.

## Workloads and acceptance evidence

Use valid and malformed source, ASCII and Unicode identifiers, large integers, ordinary and interpolation literals, small editor files and larger modules, with pinned CPython correctness expectations. Add the agreed compatibility forms when assessing the combined or separate compatibility artifact. Include diagnostics and warning-producing inputs rather than benchmarking a path that skips their implementation.

Measure cold fetch/compile/instantiate/initialize separately from warm repeated edits. Include source encoding, allocations, output conversion, peak live memory, retained memory after release, and repeated-parse growth. Distinguish live allocator use from WASM linear-memory capacity; releasing AST storage does not imply browser memory immediately shrinks. Run the eventual comparison in representative browser/worker environments; Node-only figures are preliminary. Existing browser requirements remain in force, and any new WASM feature requirement must be explicit.

Maintainability evidence includes the upstream patch size and character, unsupported runtime dependencies, generated versus maintained code, and an upstream-update exercise once the prototype is credible. A small output that requires a second bespoke Python runtime may lose on this criterion.

## Decision status

C is the selected experimental language, with Clang/Emscripten as the initial toolchain route. Zig is an optional compiler alternative if a concrete toolchain issue warrants comparing it. No Zig rewrite, full interpreter shipment, production WASM backend, threading requirement or speed/size improvement is approved or claimed here.

The immediate next executable work is the C dependency-cut and lexer slice, permitting a minimal port instead of preserving runtime-coupled source at any cost. The complete WASM decision stays open until the comparison reaches usable ASTs and equivalent compilation where feasible, with missing stages explicitly reported.

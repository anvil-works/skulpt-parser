# Toolchain probe

Decision evidence for [Compare modern Deno and pnpm workflows](https://github.com/anvil-works/skulpt-parser/issues/12), recorded 2026-09-11 on macOS arm64. This is an isolated experiment, not a parser migration.

## Scope and provenance

`src/decorators.ts` copies the actual `memoize` and `memoizeLeftRec` algorithms from `src/parser/parser.ts` at commit `ae256889f0956d6dc102edd39f1a9555e97e850b`. Only the parser-state and return types are narrowed to a tiny arithmetic grammar. `src/modern.ts` also copies the real `StartRule` enum from `src/parser/pegen_types.ts` at that commit.

The grammar `sum := sum '+' digit | digit` exercises actual left-recursion growth, restoring the token position on a memo hit, caching failures, and stopping at an incomplete suffix. These are real memoization algorithms exercised with a synthetic grammar, not the full generated Python parser. The probe deliberately avoids pulling the broken production tokenizer into a tooling decision.

The modern decorator fixture adapts the new `(method, context)` calling convention to the unchanged wrapper algorithms. The legacy fixture applies the old three-argument decorators directly. The adapter is experimental evidence that modern decorators can preserve this behavior; it is not a proposed production abstraction.

## Versions

- Node 26.7.0 (already installed on the host)
- pnpm 12.3.4
- Deno 2.9.6 stable (bundled TypeScript 6.0.3)
- Rslib 1.0.0
- Rstest 0.11.12
- TypeScript 5.9.3 for Node type checking and Rslib declaration generation

Exact package versions are in `package.json`; both package-manager lockfiles are committed. This does not select Node 26 as the production runtime policy.

## Results

| Check                                                                             | Node + pnpm                                                                      | Deno                                               |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------- |
| Modern decorators, left recursion, cache hit, cached failure, partial input, enum | Rstest passes; separate TypeScript check passes                                  | Native test and type check pass                    |
| Legacy decorators, left recursion and cache                                       | Rstest passes with explicit legacy decorator setting; separate type check passes | Native test passes, with deprecation warning       |
| Rslib browser-targeted minified ESM                                               | Pass                                                                             | Pass                                               |
| TypeScript declarations                                                           | Pass                                                                             | Pass                                               |
| Frozen dependency install                                                         | Pass                                                                             | Pass after first generating the Deno lockfile      |
| Import built ESM and parse `1+2+3`                                                | Pass in Node                                                                     | Deno-built output passes the same Node smoke check |

Both builds produced byte-identical JavaScript: 4,708 bytes minified, 2,200 gzip, 1,977 Brotli. The exported declaration file is `dist/modern.d.ts` (469 bytes), with an additional internal `decorators.d.ts`; Rslib's default declaration output preserves source filenames. The JavaScript entry is `dist/index.js`. A production package must wire its exports/types accordingly or configure declaration bundling.

Hashes and measurements are in `node-build.json` and `deno-build.json`. These tiny-fixture sizes do not predict parser shipping size or parser throughput. No performance winner is established. Tests ran in milliseconds, but runner-reported timings include different phases and are not compared.

## Configuration findings

- `experimentalDecorators` in a selected tsconfig was not enough to make this Rstest configuration use the legacy calling convention. The initial run failed reading `descriptor.value`. Explicit `source.decorators.version: 'legacy'` fixed it. Modern Rstest configuration needs no legacy setting.
- Deno's old decorator mode still works but explicitly warns that `experimentalDecorators` is deprecated and may be removed.
- `deno install --frozen` initially failed because there was no committed Deno lockfile. `deno install --frozen=false` generated it; subsequent frozen install passed. Deno initially seeds from pnpm's lockfile where available, but its own lockfile still needs recording.
- Both runtimes successfully ran the same Rslib configuration and used the npm native bundler dependencies on this platform. Other operating systems and a clean CI image were not tested.
- Neither toolchain is technically ruled out. Legacy decorators need not be a permanent requirement. A full migration still needs production parser tests, generated method signatures, imports, test-helper APIs, packaging, and browser execution checked.

## Reproduce

From this directory, with the pinned Node runtime available:

```sh
npm install --no-save --prefix bootstrap pnpm@12.3.4 deno@2.9.6
./bootstrap/node_modules/.bin/pnpm install --frozen-lockfile
./bootstrap/node_modules/.bin/pnpm check
./bootstrap/node_modules/.bin/pnpm test
./bootstrap/node_modules/.bin/pnpm exec rstest run --config rstest.legacy.config.ts
./bootstrap/node_modules/.bin/pnpm exec tsc --noEmit -p tsconfig.legacy.json
./bootstrap/node_modules/.bin/pnpm build
node measure.mjs
```

The local bootstrap packages are ignored and do not change global installations. To run the Deno route:

```sh
./bootstrap/node_modules/.bin/deno install --frozen
./bootstrap/node_modules/.bin/deno task test
./bootstrap/node_modules/.bin/deno test --config deno.legacy.json tests/legacy_deno.ts
./bootstrap/node_modules/.bin/deno task build
node measure.mjs
```

`deno install` manages the local npm dependencies for its build. Node is used only for the shared output measurement/smoke script in the second sequence. Browser-targeted output was built and imported; a real browser session was not exercised.

Historical repository commit hooks also need migration: the YAML hook rejects pnpm 12 multi-document lockfiles, and the old Prettier parser rejects inline type imports. Those two hooks were skipped for this isolated research commit; focused type/build/test checks were run instead. The legacy Deno test config disables lock writing so it cannot replace the main configuration’s workspace lock metadata.

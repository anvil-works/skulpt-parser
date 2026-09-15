# Skulpt parser migration baseline

This branch restores a buildable, testable Python 3.9 frontend before the planned Python 3.14 migration. It starts at upstream `master` revision `ae256889f0956d6dc102edd39f1a9555e97e850b`. Migration work integrates through the `next` branch; implementation PRs target `next` rather than `master`. It is a private development package, not a new parser release.

The [agreed migration route](https://github.com/anvil-works/skulpt-parser/issues/8#issuecomment-5673603629) is minimal baseline recovery, strict Python 3.14 source-to-AST, bounded Python 2 compatibility, then independent IDE and Skulpt adoption gates. WASM work is stopped. Cache tuning is deferred.

## Build and test

Use Node 22 or later, pnpm 10.10.0 and CPython **3.9.25**. The checked-in generated parser still derives from CPython **3.9.5**; the test oracle patch version is pinned separately. The oracle rejects a different interpreter/version rather than silently comparing against a different AST schema.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm build
PYTHON=/path/to/python3.9 pnpm test
pnpm test:package
```

`PYTHON` defaults to `python3.9`. For example, with uv available, `uv python install 3.9.25` installs the required reference interpreter. Set `PYTHON` to its executable if your default Python 3.9 differs.

`pnpm test` runs the existing TypeScript AST dump, parsing, symbol-table and optimizer suites under Rstest, plus a persistent-oracle regression test. Each test worker lazily starts one Python process, sends requests over JSON lines and closes it after its suite. The original Python dump helpers remain the reference implementation. No Python process is included in the shipped frontend.

Run one suite with `pnpm test tests/parse.test.ts`. To select fixture files, retain the existing `_TESTFILES` convention:

```sh
_TESTFILES='["t001.py"]' PYTHON=/path/to/python3.9 pnpm test tests/parse.test.ts
```

`pnpm check` checks the source TypeScript. `pnpm test:package` checks package exports, Node file parsing, declaration-file presence and execution of the web bundle in an isolated JS context without Node/Deno globals or external imports. This is a host-dependency smoke test, not a real-browser compatibility suite. It also reports raw, gzip and Brotli sizes.

## Build outputs

Rslib emits an ES2020 ESM web entry at `dist/index.js` and declarations rooted at `dist/mod.d.ts`. The `skulpt-parser` entry exposes the existing string tokenizer, parser and symbol-table operations. Node filesystem helpers are exported through `skulpt-parser/node`, with `dist/node.js` and `dist/node.d.ts`. The web entry does not import Node filesystem APIs.

```js
import { runParserFromString } from "skulpt-parser";
import { runParserFromFile } from "skulpt-parser/node";

const ast = runParserFromString("x = 42\n");
const fileAst = runParserFromFile("example.py");
```

These are recovered baseline APIs, not the final agreed Python 3.14 API. Native BigInt is required for the initial target; this work does not add a pre-2020 browser fallback. Legacy decorators remain enabled for the existing generated parser. Moving generator output to modern decorators belongs with the later generation migration.

## Python 3.14 generation inputs

The next stage has a separate, checksum-pinned source preparation path. Run `pnpm upstream:prepare`, then `pnpm upstream:check` with CPython 3.14.3 installed. This validates upstream grammar, token definitions and AST layouts without modifying a sibling CPython checkout. Run `pnpm generate:ast` to generate the structural Python 3.14 AST types and factories; `pnpm generate:check` verifies the checked-in output. These are internal migration modules, not yet connected to the parser or exported from the package root. The parser backend and its semantic helpers still need migration. See [pinned input commands and scope](tools/upstream/README.md).

## Known gaps and retained legacy files

- AST columns use UTF-8 byte offsets, including Unicode strings and nested f-string expressions. Tokenizer positions remain JavaScript UTF-16 offsets; parser diagnostics use one-based character offsets. The previously skipped `t542.py` fixture is enabled.
- The Python-driven `tests/test_peg_parser.py` harness is not part of the recovered Rstest suite. It still invokes Deno and depends on CPython's private `_peg_parser` and `test.support`. The installed standalone CPython 3.9.25 lacks `test.support`. Port its useful cases when establishing the 3.14 conformance suite; the passing TypeScript suite does not imply that harness passes.
- Parser/ASDL regeneration is not recovered in this step. `tools/`, `scripts.yml` and the old Deno scripts remain historical references. The old generator checks out and patches a sibling CPython tree and invokes Velociraptor. Do not run it against a working sibling checkout. The new isolated input commands above are ready; the structural AST generator consumes them now. Adapting the parser backend and its semantic helpers is the next stage.
- CI now runs the recovered build, source checks, TypeScript suites and package smoke check. It does not claim to replace the legacy generator or Python PEG checks; those remain explicit gaps above.
- Grammar, generated AST/parser, diagnostics, scalar representation and memoization policy are unchanged. Some parser rules benefit from caching and others regress. Future tuning must measure individual rules and preserve the distinct left-recursion algorithm requirements.

See [baseline evidence](docs/baseline-recovery.md) for measured results and scope.

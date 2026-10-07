# Skulpt parser

A JavaScript parser and tokenizer targeting CPython 3.14.3, with opt-in compatibility
for the Python 2 syntax supported by Skulpt. This is a development release. Parsing
produces an AST; it does not supply Python execution or all compiler semantic checks.

## Python 3.14 frontend

The package root and `/core` alias expose the same lean browser and IDE API:

```js
import { parseModule, parseExpression, scan } from "@anvil-works/skulpt-parser";

const module = parseModule("answer = 42\n", { filename: "example.py" });
const expression = parseExpression("answer + 1");
const tokens = [...scan("answer = 42\n")];
```

AST nodes follow CPython's structure with a `_type` discriminant. Source locations
use UTF-8 byte columns. Large integer values use native JavaScript BigInt. The
initial browser target requires native BigInt; there is no pre-2020 fallback.
Invalid source throws a positioned syntax error. Successful parsing, like
`ast.parse`, does not imply the program passes subsequent compiler checks.

The root and `/core` export the complete AST type schema, including `AST`,
`Module`, `expr`, `stmt`, individual node types and `ScalarConstant`. Compatibility
visitors can use `CompatibilityAST`, `CompatibilityModule` and
`CompatibilityStatement`, whose nested suites include the Python 2 extensions.
These are type-only exports and add no runtime code:

```ts
import type { expr } from "@anvil-works/skulpt-parser";

function identifier(node: expr): string | undefined {
  return node._type === "Name" ? node.id : undefined;
}
```

The parser preserves expression structure. `1 + 2` produces a `BinOp`, matching
CPython's default AST; constant folding belongs to a later compiler pass.
Adjacent string literals are combined as required by Python's parsing rules.

Compiler consumers can explicitly fold literal expressions with a separate entry point:

```js
import { parseExpression } from "@anvil-works/skulpt-parser";
import { optimizeAST } from "@anvil-works/skulpt-parser/optimize";

const tree = parseExpression("1 + 2");
optimizeAST(tree); // Mutates tree.body into Constant(3); returns the same root.
```

`optimizeAST` accepts Python 3 module and expression roots. It preserves expression
spans, statement suites, bindings and control flow. It folds bounded literal
arithmetic, unary operations, string/bytes concatenation and repetition, tuple
concatenation/repetition, and literal indexing. Tuples retain the existing `Tuple`
schema. Unsupported operations and expressions that would raise at runtime remain
unfolded. The pass does not create docstrings from computed strings. Annotations
and lazy type definitions retain their original expression text. String indexing
with surrogate pairs stays unfolded because UTF-16 cannot distinguish astral
characters from separately escaped surrogate characters.

Integer folding uses a 128-bit budget. Produced strings/bytes are limited to 4096
UTF-16 code units/bytes and tuples to 256 contained elements, counting nested
tuples. These limits bound compilation work, not Python runtime values. This is a
conservative subset of CPython's compiler optimizations, not a promise of identical
folding choices. Python 2 compilers must skip this pass. Importing the parser root
or `/core` does not load it. See [optimizer validation](docs/ast-optimizer.md).

The core includes Unicode identifiers and numeric character escapes. Unicode-name
escapes such as `"\\N{SNOWMAN}"` require the separately loaded name database:

```js
import { parseExpression } from "@anvil-works/skulpt-parser";
import { unicodeName } from "@anvil-works/skulpt-parser/unicode-names";

const tree = parseExpression('"\\N{SNOWMAN}"', { resolveUnicodeName: unicodeName });
```

Without that resolver, a named escape raises `UnicodeNameDatabaseRequired`.
Importing `/core` does not load the name database. The published tarball includes
both bundles, but consumers only load the entry points they import.

For existing Skulpt clients, select compatibility explicitly:

```js
parseModule("print 0755L\n", { pythonVersion: 2, asyncAwaitAsIdentifiers: true });
```

`asyncAwaitAsIdentifiers` independently allows `async` and `await` as identifiers.
`printFunction` enables the configured Python 2 `print_function` behavior.
Compatibility is bounded by existing Skulpt applications, not complete historical
Python 2 support. See [the compatibility contract](https://github.com/anvil-works/skulpt-parser/blob/dev/docs/python2-compatibility.md).

| Option                    | Default               | Meaning                                                                                                                    |
| ------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `pythonVersion`           | `3`                   | Strict Python 3.14 syntax; `2` enables Skulpt's bounded Python 2 extensions. Modern syntax remains available in that mode. |
| `asyncAwaitAsIdentifiers` | `pythonVersion === 2` | Treat `async` and `await` as identifiers; reject async constructs under this policy.                                       |
| `printFunction`           | `false`               | In Python 2 mode, treat `print` as a function name instead of a print statement.                                           |
| `filename`                | `"<string>"`          | Filename attached to diagnostics.                                                                                          |
| `onWarning`               | unset                 | Callback receiving syntax warnings.                                                                                        |
| `resolveUnicodeName`      | unset                 | Resolve a named escape to a code point; return `undefined` for an unknown name.                                            |

`scan` and `tokenize` accept `pythonVersion`, `filename` and `onWarning` too.
Their `extraTokens` option defaults to `true`, matching CPython's tokenize mode:
include comments/non-significant newlines and defer parser-level lexical checks.
`false` selects the parser's token stream. It is not merely a comment filter.

This prerelease replaces `python2Compat: true/false` with `pythonVersion: 2/3`,
`legacyAsyncNames` with `asyncAwaitAsIdentifiers`, and the `unicodeName` callback
option with `resolveUnicodeName`. The optional database still exports the
`unicodeName` lookup function. Update callers before adopting this revision.

## Migrating from the Python 3.9 API

The Python 3.9 implementation has been removed. The root now exports the modern
parser; `/core` remains an alias for existing integrations. Replace
`runParserFromString` with `parseModule` or `parseExpression` and consume structural
AST nodes. The old AST classes, symbol-table API and `/node` filesystem helpers are
no longer exported. Node callers should read files themselves before parsing.
Skulpt compiler integration lives in the Skulpt repository.

## Source layout

`src/index.ts` is the public entry point. The parser and AST implementation live
in `src/`, with tokenization in `src/lexer/`. The pinned CPython version and source
hashes live in `tools/upstream/cpython.json`; source directories are not versioned.
`/core` is a compatibility alias for the root export, not a different parser.

## Development

The baseline generation inputs remain pinned to CPython 3.14.3. Template
interpolation metadata includes the later 3.14 correction at commit
`18ef0f0cb5278fa6583b753ffaaef7f46e416ab9` (3.14.8+): preserve expression
whitespace before a debug marker and strip continuations after it.
`tests/fixtures/generate_template_expression_metadata.py` regenerates its
upstream test cases and the affected baseline metadata with that checkout's
interpreter. Run it after the baseline expression fixture generator; it updates
only `Interpolation.str` in that fixture.

Use Node 22 or later and pnpm 10.10.0. Fixture generation and live corpus
comparisons require CPython 3.14.3. Tests use checked-in CPython reference fixtures. The live corpus check also compares
all 560 retained programs in `tests/corpus/` and ten standard-library files against
CPython, including complete AST locations and warnings.

```sh
pnpm install --frozen-lockfile
pnpm format:check
pnpm check
pnpm test
pnpm test:release
pnpm build
pnpm test:package
pnpm test:core-package
pnpm build:expression
pnpm test:expression-package
pnpm test:python314-corpus
```

Run `pnpm format` to format handwritten JavaScript, TypeScript, JSON, Markdown and
YAML. Prettier uses four spaces, 120 columns and ES5 trailing commas. Generated
sources, oracle fixtures, benchmark data and retained Python corpus files are
excluded; regenerate them with their documented producers. CI checks formatting.

Generation consumes checksum-pinned CPython inputs without modifying a sibling
checkout. See [generation instructions](https://github.com/anvil-works/skulpt-parser/blob/dev/tools/generate314/README.md) and
[upstream input preparation](https://github.com/anvil-works/skulpt-parser/blob/dev/tools/upstream/README.md). Historical migration
measurements and decisions live under `docs/`.

For benchmark commands and CI artifacts, see [performance reporting](docs/performance-ci.md).
For local Node/browser comparisons and correctness probes, see the
[performance and robustness workflow](docs/performance-and-robustness.md) and
[dev.5 measurements](docs/performance-robustness-results.md).
For Skulpt compiler integration requirements, see
[integration status](docs/skulpt-compiler-integration.md). Historical migration
reports describe earlier checkpoints; use this README for the current public API.

## Development releases

The first scoped version is `0.0.1-dev.0`. Review changes before integrating them
into `dev`; `master` is not the development-release branch. From a clean, reviewed
`dev` checkout, the maintainer publishes with:

```sh
pnpm publish --tag dev --publish-branch dev
```

`prepublishOnly` rejects a missing tag, `latest`, and other tags, and requires an
`X.Y.Z-dev.N` version. Unlike the existing CLI release workflow, this first release
does not require a previously published stable version. `prepack` rebuilds the
core and optional Unicode-name and optimizer bundles. Increment the prerelease number for subsequent publishes.
Do not bypass lifecycle scripts when publishing.

After publication, consumers can pin `@anvil-works/skulpt-parser@0.0.1-dev.0` and
import its `/core` entry. The mutable `dev` tag is for choosing a release, not a
substitute for an exact version in a reproducible application build.

The package includes project, CPython and Unicode license notices. Test fixtures,
benchmark reports, generator inputs and development tooling are excluded from the
published file set.

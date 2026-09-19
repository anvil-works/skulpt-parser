# @anvil-works/skulpt-parser

A JavaScript parser and tokenizer targeting CPython 3.14.3, with opt-in compatibility
for the Python 2 syntax supported by Skulpt. This is a development release. Parsing
produces an AST; it does not supply Python execution or all compiler semantic checks.

## Python 3.14 frontend

Use the lean `/core` entry for browser and IDE consumers:

```js
import { parseModule, parseExpression, scan } from "@anvil-works/skulpt-parser/core";

const module = parseModule("answer = 42\n", { filename: "example.py" });
const expression = parseExpression("answer + 1");
const tokens = [...scan("answer = 42\n")];
```

AST nodes follow CPython's structure with a `_type` discriminant. Source locations
use UTF-8 byte columns. Large integer values use native JavaScript BigInt. The
initial browser target requires native BigInt; there is no pre-2020 fallback.
Invalid source throws a positioned syntax error. Successful parsing, like
`ast.parse`, does not imply the program passes subsequent compiler checks.

The core includes Unicode identifiers and numeric character escapes. Unicode-name
escapes such as `"\\N{SNOWMAN}"` require the separately loaded name database:

```js
import { parseExpression } from "@anvil-works/skulpt-parser/core";
import { unicodeName } from "@anvil-works/skulpt-parser/unicode-names";

const tree = parseExpression('"\\N{SNOWMAN}"', { unicodeName });
```

Without that resolver, a named escape raises `UnicodeNameDatabaseRequired`.
Importing `/core` does not load the name database. The published tarball includes
both bundles, but consumers only load the entry points they import.

For existing Skulpt clients, select compatibility explicitly:

```js
parseModule("print 0755L\n", { python2Compat: true, legacyAsyncNames: true });
```

`legacyAsyncNames` independently allows `async` and `await` as identifiers.
`printFunction` enables the configured Python 2 `print_function` behavior.
Compatibility is bounded by existing Skulpt applications, not complete historical
Python 2 support. See [the compatibility contract](https://github.com/anvil-works/skulpt-parser/blob/dev/docs/python2-compatibility.md).

## Legacy entry points

The package root retains the original Python 3.9 frontend. It is not the Python
3.14 API. Its Node filesystem helpers are separate:

```js
import { runParserFromString } from "@anvil-works/skulpt-parser";
import { runParserFromFile } from "@anvil-works/skulpt-parser/node";
```

New integrations should use `/core`. The legacy entry points remain for migration;
Skulpt compiler integration still uses an adapter rather than a rewritten compiler.

## Development

Use Node 22 or later and pnpm 10.10.0. Legacy tests require CPython 3.9.25; Python
3.14 generation and live corpus comparisons require CPython 3.14.3.

```sh
pnpm install --frozen-lockfile
pnpm check
PYTHON=/path/to/python3.9 pnpm test
pnpm test:release
pnpm build
pnpm build:core
pnpm test:package
pnpm test:core-package
pnpm test:python314-corpus
```

Generation consumes checksum-pinned CPython inputs without modifying a sibling
checkout. See [generation instructions](https://github.com/anvil-works/skulpt-parser/blob/dev/tools/generate314/README.md) and
[upstream input preparation](https://github.com/anvil-works/skulpt-parser/blob/dev/tools/upstream/README.md). Historical migration
measurements and decisions live under `docs/`.

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
legacy and core bundles. Increment the prerelease number for subsequent publishes.
Do not bypass lifecycle scripts when publishing.

After publication, consumers can pin `@anvil-works/skulpt-parser@0.0.1-dev.0` and
import its `/core` entry. The mutable `dev` tag is for choosing a release, not a
substitute for an exact version in a reproducible application build.

The package includes project, CPython and Unicode license notices. Test fixtures,
benchmark reports, generator inputs and development tooling are excluded from the
published file set.

# Bounded Python 2 compatibility

`parseModule` and `parseExpression` now accept the experimental option
`{ python2Compat: true }`. It defaults to false. This implements the numeric and statement
slices of the agreed Skulpt compatibility mode, not complete Python 2 support.
Anvil's IDE integration now has focused parity coverage for this mode.
Application execution still uses Skulpt.

Skulpt's experimental compiler adapter can pass `{ printFunction: true }` with
`python2Compat` to treat `print` as an ordinary name, matching configured
`Sk.__future__.print_function`. Other compatibility syntax remains enabled. This
option defaults to false and does not change the source future-import behavior
described below. Five additional fixtures come from the real Skulpt frontend with
that flag configured, including a long/octal argument and legacy raise.

The compatibility boundary protects existing applications, rather than enforcing
historical Python 2 restrictions. Modern syntax can be used where the consumer's
runtime implements its semantics. Runtime/compiler support remains a separate gate.

Implemented forms:

- `<>` and `!=` both produce ordinary `NotEq` comparisons.
- Implicit octal integers, including the underscored spelling accepted by Skulpt,
  produce ordinary integer constants. Invalid octal digits are rejected.
- Uppercase `L` suffixes produce integer scalar values with `legacyLong: true`.
  This preserves explicit long-literal identity independently of the JavaScript
  number/bigint storage choice. Strict Python 3 values never gain this property.
- Floating-point and imaginary literals beginning with zero retain decimal
  interpretation. Lowercase `l` and suffixes on floats/imaginary values remain
  rejected, matching the tested Skulpt frontend.

- Print statements produce `Print` nodes with `dest`, `values`, and `nl` fields,
  preserving redirected output and trailing commas.
- Two/three-operand raise produces `LegacyRaise` with `exc`, `inst`, and `tback`.
  Bare and single-operand raise retain the ordinary CPython node.
- Comma exception binding and non-name `as` targets produce
  `LegacyExceptHandler` with an expression-valued `target` in Store context.
  Ordinary `as name` retains the CPython handler representation.

`parseModule` returns `CompatibilityModule` when this option is true. Its types
include the extension nodes inside nested suites. Default calls still return the
strict generated CPython `Module` type. A runtime boolean option requires callers
to handle either result.

In compatibility mode, `print(1, 2)` is a print statement containing a tuple.
The tested Skulpt parse-and-AST path does not switch this behavior for a source
`from __future__ import print_function`; this parser matches that frontend quirk.
Strict Python 3 continues to parse it as a function call. Likewise, Python 3.14's
`except A, B:` means a tuple of exception types in strict mode, but binds `B` in
compatibility mode.

The lexer exposes the same option for consumers that need compatible tokenization.
There is no source rewriting, so token spellings and source ranges are preserved.
Strict Python 3 parsing remains the default, including the existing
`barry_as_FLUFL` comparison behavior. Compatibility mode accepts both comparison
spellings independently of that Python 3 future feature.

## Legacy async names

`{ legacyAsyncNames: true }` treats `async` and `await` as ordinary names,
independently of Python 2 statement and numeric syntax. Python 2 compatibility
also enables this behavior by default; an explicit `legacyAsyncNames` value
overrides that default. Without either option, both words remain keywords.

For example, `await(x)` produces a `Call` in legacy-name mode and an `Await` in
strict mode. Legacy-name mode rejects async function, loop, context-manager and
comprehension syntax. It does not reinterpret a failed modern parse as legacy
code. The tokenizer is unchanged because it already emits NAME tokens for words.
Both the lean and full parser entry points accept this option. The lean core
grows from 37,047 to 37,099 bytes gzip, an additional 52 bytes. The focused
compatibility, expression, module and diagnostic run passes 1,660 tests; type
checks and the built-package check also pass.

The current Anvil Skulpt bundle accepts these identifiers in both Python 2 and
Python 3 modes. `tests/fixtures/legacy-async-skulpt.json` records 20 cases per mode
from real parse and AST construction, including ambiguous calls and rejected async
constructs. Regenerate with:

```sh
node scripts/generate-legacy-async-fixtures.mjs /path/to/skulpt.min.js
```

Anvil's client parser selects legacy-name mode even for Python 3 apps.
Python 3 server parsing keeps strict keywords. The IDE warns about recognized
unsupported async constructs only on the client, without reinterpreting valid
legacy calls as await expressions. Skulpt runtime async
support is a separate project, and reserving these names later requires an
explicit runtime-version migration.

## Evidence

`tests/fixtures/python2-numeric-skulpt.json` records 22 accepted/rejected examples
through the real Skulpt parser and AST constructor, with the runtime bundle's
SHA-256. Values and comparison operators come from that independent oracle.
The bundle used is the checked-in runtime currently consumed by Anvil, hash
`29aa41f66d084b5826e6d386a5494b179d96a793607ebfc668cedc4752722e54`.
Regenerate with a local copy of that bundle:

```sh
node scripts/generate-python2-numeric-fixtures.mjs /path/to/skulpt.min.js
```

`tests/fixtures/python2-statements-skulpt.json` adds 34 accepted/rejected cases
from the same runtime, including nested statements, redirected print, malformed
operands, and non-name exception targets. Regenerate it with:

```sh
node scripts/generate-python2-statement-fixtures.mjs /path/to/skulpt.min.js
```

Tests compare semantic AST fields against that oracle, allowing the documented
CPython/Skulpt representation differences. They also check strict-mode rejection,
ambiguous syntax interpretations, and isolation between parser instances.
Type checks prevent compatibility trees from being passed as strict modules. The existing CPython lexer, number, expression, module and
diagnostic suites also pass, 1,974 tests in the focused run. The lean package check
also passes. The production lean core grows from 36,318 to 36,522 bytes gzip for
the numeric slice, then to 37,047 bytes for statements. The cumulative increase is
729 bytes. Current raw size is 230,602 bytes and Brotli size is 28,319 bytes.
The optional Unicode-name database remains separate. These measurements do not
decide whether the complete compatibility implementation should use a separate
bundle.

## Integration checkpoint

The agreed ceiling is the Skulpt support audited in the issue
[Define the bounded Python 2 compatibility syntax](https://github.com/anvil-works/skulpt-parser/issues/10).
Anvil's IDE now consumes the compatibility nodes for Python 2 client and server
modules. Twelve completion scenarios compare native output with the real Skulpt
parser through the production correction and walking paths. They cover print
values/destinations, raise operands, exception assignment targets, explicit long
keys/defaults and legacy comparisons. Navigation and four rejection/diagnostic
cases also match. The broader focused IDE suite passes 103 tests.

Skulpt remains responsible for application execution and for the IDE's remaining
Python value/type operations. This checkpoint does not establish compatibility
with every existing app or implement Python 2 runtime semantics.

Backticks, exec statements, tuple parameters, `ur`/`ru` prefixes and lowercase
long suffixes are not required by the audited Skulpt ceiling. Runtime fixes for
redirected print and explicit tracebacks are outside the frontend task.

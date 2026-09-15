# Bounded Python 2 compatibility

`parseModule` and `parseExpression` now accept the experimental option
`{ python2Compat: true }`. It defaults to false. This is the first implementation
slice of the agreed Skulpt compatibility mode, not complete Python 2 support.
Do not switch Anvil's Python 2 route away from Skulpt yet.

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

The lexer exposes the same option for consumers that need compatible tokenization.
There is no source rewriting, so token spellings and source ranges are preserved.
Strict Python 3 parsing remains the default, including the existing
`barry_as_FLUFL` comparison behavior. Compatibility mode accepts both comparison
spellings independently of that Python 3 future feature.

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

Tests exercise the reference cases, strict-mode rejection, and isolation between
parser instances. The existing CPython lexer, number, expression, module and
diagnostic suites also pass. The production lean core grows from 36,318 to 36,522
bytes gzip for this slice, an increase of 204 bytes. This does not decide whether
the complete compatibility implementation should use a separate bundle.

## Remaining scope

The agreed ceiling is the Skulpt support audited in the issue
[Define the bounded Python 2 compatibility syntax](https://github.com/anvil-works/skulpt-parser/issues/10).
Still required before routing Anvil Python 2 applications to this parser:

- Print statements, including trailing commas and redirected forms, preserving
  their details in compatibility-only AST nodes rather than lowering to calls.
- Comma exception binding, including the assignment targets Skulpt accepts.
- Two/three-operand raise, preserving operands in compatibility-only AST nodes.
- `async` and `await` as legacy identifiers.
- Consumer support for the compatibility extensions, and end-to-end parity tests.

Backticks, exec statements, tuple parameters, `ur`/`ru` prefixes and lowercase
long suffixes are not required by the audited Skulpt ceiling. Runtime fixes for
redirected print and explicit tracebacks are outside the frontend task.

# Unicode-name size investigation

The production frontend at #37 is 866,555 bytes raw, 248,641 gzip and 185,523 Brotli. An experimental build with empty Unicode-name keys/blocks, retaining algorithmic range handling, is 229,131 / 36,830 / 28,047 bytes. The marginal contribution is therefore 637,424 raw / 211,811 gzip / 157,476 Brotli bytes. This is a build-size attribution experiment, not a usable replacement build.

The large database resolves character names in string escapes such as `"\N{SNOWMAN}"`. It is separate from Unicode identifier properties, identifier normalization, literal Unicode text, and numeric escapes such as `"\u2603"`.

## Skulpt comparison

A direct check of the production build of upstream Skulpt master `ae5f4628e319bd51d26fc3e920baabd3803cacd5` confirms that `"\N{SNOWMAN}"` remains a literal backslash-N sequence. Both `"\u2603"` and `"☃"` produce the snowman character. The `parsestr` escape decoder in `src/ast.js` has explicit numeric Unicode escape branches, but no named-escape branch.

Skulpt's tokenizer uses a Unicode identifier regular expression and NFKC normalization while checking identifiers. This is not the name-to-character database. In the checked build, `résumé` is accepted, `𝒙` is rejected, and an AST identifier written as `K` retains that spelling. The new frontend instead validates Unicode 16 identifier properties and normalizes AST names, following CPython.

Full named-escape support was added for CPython conformance; its large table is not a cost inherited from Skulpt.

## Encoding probes

Current table JSON is 604,405 raw / 209,606 gzip bytes for 34,614 explicit names and aliases, plus algorithmic ranges. Gzip figures here concern the data alone and cannot be added exactly to the rest of the bundle because compression crosses boundaries.

| Prototype                                                      | Data raw bytes | Data gzip bytes |
| -------------------------------------------------------------- | -------------: | --------------: |
| Current front-coded names and hexadecimal values, blocks of 32 |        604,405 |         209,606 |
| CPython packed name graph and 24-bit values, base64 transport  |        359,577 |         208,499 |
| Separate front-coded names and delta values, blocks of 32      |        479,998 |         157,625 |
| Same, blocks of 128                                            |        437,302 |         144,753 |
| Same, blocks of 512                                            |        426,460 |         140,771 |

The graph probe uses CPython 3.14.3's `Tools/unicode/dawg.py` at the existing pinned commit. Its SHA-256 is `aafab3b0cbd34ded2801080d7c1c21d4de4c22c3ee5851e692e4e74ec9424c96`. It reduces raw size substantially but barely improves gzip. The split-stream probe uses signed code-point deltas encoded as base64 VLQ and retains the existing character-prefix name encoding. Larger blocks save more bytes but require more work per lookup; these are size probes, not validated replacement implementations. Word-dictionary probes were less effective than character-prefix blocks with separate values.

## Decision checkpoint

An optional name database may be more useful than further compression of a mandatory table, since Skulpt does not currently implement this escape feature. This would not require dropping Unicode identifiers, literal Unicode text or numeric Unicode escapes. Complete named-escape support could remain available for consumers requiring CPython conformance.

No feature has been removed or replacement encoding adopted. The split below preserves the existing full entry point while adding a lean alternative for integration experiments.

## Optional module implementation

`frontend.ts` remains the full internal entry point and supplies the existing name lookup to the parser. `frontend_core.ts` exposes the same parsing functions with an optional `unicodeName` lookup in `ParseOptions`. Both use the same generated parser and string decoder. The lookup module has no parser or Skulpt runtime dependency, allowing eventual sharing without duplicating parsing code.

Run `pnpm build:core` to produce:

| Artifact                                     | Raw bytes | Gzip bytes | Brotli bytes |
| -------------------------------------------- | --------: | ---------: | -----------: |
| Core parser, `dist-core/index.js`            |   227,860 |     36,244 |       27,560 |
| Optional names, `dist-core/unicode-names.js` |   639,093 |    212,543 |      157,923 |
| Combined separate artifacts                  |   866,953 |    248,787 |      185,483 |

The core download is 85.4% smaller than the previous full bundle by gzip size. Loading both costs almost the same as before; the split does not compress the database. The preserved full build is 867,000 raw / 249,508 gzip / 185,615 Brotli bytes. Compression totals differ slightly with bundling/minification order.

Without a resolver, a syntactically formed named escape raises `UnicodeNameDatabaseRequired`, an ordinary Error subclass carrying the requested name, filename and string token's starting line/column. This is a missing capability, not a claim that the Python source is invalid. A caller can load the resolver and retry synchronously. An unknown name with the resolver installed still produces CPython's SyntaxError. Malformed named escapes are diagnosed before requesting the database. Raw strings, escaped backslashes, bytes literals and numeric Unicode escapes do not require the name lookup.

```ts
import { parseModule, UnicodeNameDatabaseRequired } from "./dist-core/index.js";

let tree;
try {
  tree = parseModule(source);
} catch (error) {
  if (!(error instanceof UnicodeNameDatabaseRequired)) throw error;
  const { unicodeName } = await import("./dist-core/unicode-names.js");
  tree = parseModule(source, { unicodeName });
}
```

Parsing itself remains synchronous. The application owns loading and retry policy; no parser-wide configuration is mutated. If it collects warnings, it should keep them per attempt and publish the successful attempt's warnings to avoid duplicate notifications. Raw source remains unchanged between attempts.

Public package exports still use the recovered parser. These new artifacts are internal integration options; neither Skulpt nor the IDE is switched automatically.

The existing full suite passes all 3,670 tests, and the full browser package and ten-file live corpus checks pass. The separate browser-style core check verifies Unicode/numeric/bytes/raw behavior before loading any names, the capability error, loading/retrying with 140 CPython-derived named-escape cases, unknown/malformed-name diagnostics, and configuration isolation. Both chunks must be self-contained. CI also applies a generous 64 KiB gzip ceiling to the core specifically to catch accidental inclusion of the large name database.

### Linked IDE entry

`skulpt-parser/core` exports the lean `parseExpression` and `parseModule` functions,
`scan` and `tokenize`, and their TypeScript declarations. Build it with
`pnpm build:core` before linking it into Anvil. This entry imports no Unicode-name
database. It adds token exports to the same core bundle rather than bundling a second
copy of the lexer. The gzip size with these exports is 36,318 bytes.

The default package entry remains the recovered legacy parser. Consumers must
explicitly import `skulpt-parser/core` to select the new frontend. No package is
published by this change.

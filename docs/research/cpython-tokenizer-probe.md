# CPython-shaped tokenizer probe

## Question and scope

Can an explicit TypeScript scanner express modern interpolated-string tokenization in a small, readable experiment? This is a bounded, independently written prototype informed by CPython's lexer. It is **not a direct port or a complete Python tokenizer**.

The implementation is [tokenizer.ts](../../probes/cpython-tokenizer/tokenizer.ts). Its exported `tokenize(source)` returns materialized token objects. Whitespace, indentation, newlines, comments, encoding and end markers are omitted by the comparison contract. Positions use one-based lines and zero-based Unicode codepoint columns, matching Python's public `tokenize.generate_tokens` output rather than AST byte columns.

## Source mapping

Reference source is pinned to [CPython v3.14.3 lexer.c](https://github.com/python/cpython/blob/v3.14.3/Parser/lexer/lexer.c) and [state.h](https://github.com/python/cpython/blob/v3.14.3/Parser/lexer/state.h).

- `normal` corresponds to the responsibilities of `tok_get_normal_mode`: character classification, ordinary strings, bracket depth, operators, and entry into interpolated strings.
- `literal` corresponds to `tok_get_fstring_mode`: literal chunks, doubled braces, named Unicode escapes, closing quotes, replacement-field entry and format specifications.
- `scanString` keeps quote width, rawness, and f-string versus t-string token kind. These correspond to fields in CPython's `tokenizer_mode`.
- Recursive calls stand in for CPython's explicit tokenizer mode stack. Local bracket stacks distinguish field delimiters from brackets inside expressions.

This deliberately avoids CPython's C buffering, memory ownership, decoding, debug-expression bookkeeping, and parser integration. It is a source-informed adaptation of a subset, not evidence that a mechanical full translation is easy.

## Initial validation

The shared visible corpus passes all 22 cases against CPython 3.14.3: 18 exact filtered token streams, including token strings and positions, and rejection of four malformed examples. Cases cover f-strings, t-strings, nested interpolations, quote reuse, conversion and format fields, escaped braces, named escapes, raw and triple strings, comments inside fields, and Unicode columns.

The rejection comparison checks only that an exception occurs. Exception classes, messages and ranges are not equivalent. This corpus does not establish syntax acceptance: a tokenizer is not a parser.

Independent held-out validation passed 15 of 16 valid examples exactly and rejected all four malformed examples. The one mismatch is `f"{x:{w}.{p}}"`: CPython emits an empty `FSTRING_MIDDLE` before the final closing field brace, which this prototype omits. The implementation remains frozen after this evaluation; the report does not count a repair against the held-out result. Independent measurements are recorded in the parent comparison report.

## Limitations and maintenance implications

The prototype allocates a codepoint array and a source-wide array of position tuples before scanning, then retains all tokens. This makes positions straightforward but is unsuitable evidence for production memory efficiency. A production scanner should track positions incrementally against the original string and measure allocation behavior.

Numeric scanning is a small handwritten subset; underscore and exponent validation is incomplete. Indentation, encoding, physical/logical newline behavior, complete error tokens, debug-expression metadata, depth limits, full operator coverage and exact diagnostic parity are not implemented. Python 2 compatibility is not implemented. Unicode identifier properties come from JavaScript's Unicode implementation, which can differ from the target Python version.

The expression/literal mode separation is comprehensible at this scale. Maintaining it against CPython requires mapping upstream changes into these modes and testing lexical edge cases. Its compact size reflects omitted behavior and cannot be projected into a full tokenizer's bundle size.

## Reproduction

Node 26 can import the TypeScript file directly (the file uses erasable types). Pass source strings to `tokenize`; compare against Python 3.14.3 `tokenize.generate_tokens`, filtering the omitted token categories listed above. No production dependency or code was changed.

# Regex-first tokenizer probe

This is a disposable, expression-only implementation for the tokenizer strategy decision. It does not replace the production tokenizer. Source: `probes/regex-tokenizer/tokenizer.ts`; Node 26 runs its erasable TypeScript directly.

## What was tested

The disclosed corpus covers ordinary names/numbers/operators, ordinary strings, f-strings, t-strings, quote reuse, nested interpolation, format specifications and nested format fields, debug expressions, escaped braces, raw and triple strings, comments within fields, Unicode positions, dictionaries, slices, and named Unicode escapes. Against CPython 3.14.3 `tokenize.generate_tokens`, all 18 valid examples have identical token kinds, text, and positions after excluding structural/newline/comment tokens. All four disclosed malformed examples throw.

The position contract is the public Python tokenizer's one-based line and zero-based Unicode code-point column, not AST UTF-8 bytes or JavaScript UTF-16 units. Exact error messages/ranges are not implemented.

## What regex still does

Regex recognizes identifiers, numbers, operators, string prefixes, whitespace/comments, and runs of ordinary string text. This preserves useful ideas from the project's original tokenizer. Explicit recursive state handles expression delimiters, string kind and quote width, rawness, format specifications, and nested interpolated strings. A regex recognizes each local chunk; it does not decide nesting.

The original tokenizer's complete-string matching cannot simply accept modern f/t-strings as opaque STRING tokens: their expressions re-enter ordinary tokenization, including reuse of the enclosing quote. Python's [PEP 701](https://peps.python.org/pep-0701/) specifies the f-string tokenization changes. Python 3.14's [PEP 750](https://peps.python.org/pep-0750/) adds template strings with related lexical structure.

The probe's `expression` and `textMode` functions correspond conceptually to CPython's `tok_get_normal_mode` and `tok_get_fstring_mode`; they are not line-by-line ports. The upstream scanner uses explicit modes and nesting counters as well. Details such as doubled-brace token boundaries, named-escape token boundaries, and braces after a backslash are maintained by those scanner modes in [CPython v3.14.3 lexer.c](https://github.com/python/cpython/blob/v3.14.3/Parser/lexer/lexer.c#L1393).

## Limits and maintenance judgment

This demonstrates that regex remains useful inside a modern tokenizer, not that the old regex tokenizer can be retained unchanged. Updating this hybrid requires translating upstream behavioral changes into both regexes and state transitions. A direct scanner port offers a closer source mapping, while the hybrid may retain more compact ordinary-token recognition. The measured corpus cannot establish which is cheaper over multiple upstream updates.

The probe omits indentation, logical newlines, encoding, streaming, warnings, parser integration, complete malformed-number handling, exact diagnostics, CPython nesting limits, and Python 2 compatibility. JavaScript and CPython Unicode identifier databases may differ. Its simple position conversion repeatedly scans source prefixes, so performance and memory measurements would be misleading; replace that with incremental position tracking before a meaningful full-parser comparison.

Source size is 6,842 bytes (after the repository formatter) before report, package metadata, compilation, or compression. This is not a production bundle estimate. No dependency is required for the probe. Model assistance made writing the state machine cheap enough to explore, but does not remove the upstream tracking and differential testing obligation.

## Independent evaluation

After freezing this implementation, a separate evaluator tested 16 held-out valid expressions and four malformed expressions. Fifteen valid cases matched exactly; all four malformed cases were rejected. Combined with the disclosed corpus: 33/34 exact valid cases and 8/8 rejection cases.

The mismatch was `f"{x:{w}.{p}}"`: CPython emits an empty `FSTRING_MIDDLE` immediately before the final field-closing brace; this probe omits it. The source remains unchanged after that result. This is a concrete maintenance risk: apparently harmless token-boundary details need full upstream differential coverage, even when the source's meaning looks straightforward. These scores concern token streams and rejection only, not AST correctness or diagnostic parity.

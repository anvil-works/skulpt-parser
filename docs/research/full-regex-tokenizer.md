# Whole-source regex tokenizer experiment

This branch investigates a regex-first Python 3.14 tokenizer as an alternative to translating CPython's scanner. It is an experimental implementation, not a production replacement or a claim of complete conformance.

The module exports `tokenize(source, {extraTokens, filename})`, returning complete tokens with their source text, line text, and code-point positions. Default `extraTokens: true` follows `_tokenize.TokenizerIter`'s public-tool stream; `false` follows its parser-oriented stream with exact operator kinds. Errors carry Python-style fields. Source strings are the boundary; byte decoding and file encoding detection are outside it.

## Lineage and maintenance cost

The old `src/tokenize/tokenize_.ts` supplies the strategy and ordinary-token vocabulary: regexes for integer bases, decimal/floating/imaginary numbers, string prefixes and escaped string runs, identifiers and operators; plus explicit indentation and continuation handling. This experiment rewrites that machinery for whole-source, synchronous iteration and modern token contracts. It does not import the old module and is not an upstream drop-in update of Python's old `tokenize.py`.

The additions required for Python 3.14 are substantial:

- Recursive f/t-string text, expression, and format-specifier states; quote reuse, escaped braces, named escapes, nested fields and nesting limits.
- A delimiter stack shared with ordinary expression scanning, carrying replacement-field identity for diagnostics.
- Distinct strict and extra-token behavior, including comments, implicit newlines, permissive identifiers/numbers/brackets, and exact operator names.
- Consistent tab/space indentation checks, implicit and explicit continuations, multiline source text and source-position tracking.
- Lexical diagnostics for malformed numbers, incompatible prefixes, strings, indentation and delimiters, including upstream error precedence and location conventions.
- Generated Unicode 16 identifier and nonprintability tables. Host JavaScript properties alone are insufficient: the tested Node 26 has Unicode 17, while CPython 3.14.3 uses Unicode 16.

CPython's [lexer.c at v3.14.3](https://github.com/python/cpython/blob/v3.14.3/Parser/lexer/lexer.c) was read to understand the mode transitions, numeric validation, prefix diagnostics and indentation rules. The structure and implementation here remain independently organized around regex token/chunk recognition. Changes upstream must be understood and translated into this design; there is no line-by-line patch correspondence.

Regex still simplifies recognizing ordinary tokens and runs of string text. It does not replace the state machine. Modern model assistance made implementing and exploring this hybrid practical, but the differential tests exposed details that intuition and a small feature corpus missed. Maintaining this option would mean maintaining a separately organized Python lexer against upstream behavior.

## Validation

Against CPython 3.14.3, at the source revision accompanying this report:

| Corpus                                                                                                     | Exact mode cases |
| ---------------------------------------------------------------------------------------------------------- | ---------------: |
| Shared 804-source corpus (project fixtures, upstream tokenizer examples, interpolation, adversarial cases) |    1,608 / 1,608 |
| Independent 561-source corpus (52 standard-library modules, 500 deterministic damaged sources, 9 limits)   |    1,122 / 1,122 |
| Separate 4,000-source random token-fragment corpus, both modes                                             |    7,900 / 8,000 |
| Additional 1,218-source prefix/number/continuation matrix                                                  |    2,436 / 2,436 |

The independent standard-library subset matched all 104 mode cases. The independent damaged-source and limit subset matched all 507 expected errors, including error kind, message, location and text. These are lexical tests, not parser/AST tests.

Of the 100 remaining random-corpus mismatches, 99 involve bare carriage returns in `StringIO` input. CPython's private tokenizer does not universally normalize these: it can combine a CR with the next token or split a UTF-8 character and raise `UnicodeDecodeError`. The experiment reproduces common bare-CR behavior but intentionally stops short of emulating every private-API malformed-input artifact. One remaining mismatch concerns a severely damaged f-string delimiter in permissive extra-token mode. The exact source, represented as a JSON string, is `"f\"0o{);001e'\ud83d\ude00f\t;\u200b\"((\"\"\"'00"`. The oracle returns tokens while this implementation reports unexpected EOF. No strict mismatch without a bare CR remained in that random corpus. Corpus scores do not establish complete conformance.

An additional 517-source f/t/raw/triple-string matrix matched 1,026 of 1,034 mode cases. The remaining eight are CPython 3.14.3 `MemoryError` outcomes for template-string triple-quoted format specifications containing a newline, such as `t"""{x:\n}"""`. This implementation returns a token stream instead of emulating that upstream failure; the comparison records the anomaly.

Warnings such as `SyntaxWarning` for a number immediately followed by certain keywords are not emitted. The token stream is preserved where the oracle warns. Warning behavior would require an explicit output contract before production use.

## Performance and distribution

Token positions advance incrementally with the source cursor; the narrow probe's quadratic prefix scanning has been removed. The implementation keeps source-line slices and line-start offsets, output tokens, an indentation stack, delimiter stack and interpolation frames. It does not build a position object for each source character. Unicode error paths may scan a line to report a location.

Regexes are sticky and run at the current cursor. Ordinary token recognition and string runs use regex; advancing a matched chunk still updates code-point positions. Complete output tokens and source line text are deliberately retained by this API and must be included in memory comparisons.

The generated Unicode tables must be counted in published bundle measurements. Regenerate them with `generate_unicode.py` under Python with Unicode 16.0.0; the script checks that version. Benchmark results and final bundle sizes belong to the common comparison report so both implementations use identical inputs and tooling.

## Decision implication

A regex-first tokenizer is feasible for modern Python. The evidence does not support retaining the old tokenizer essentially unchanged, or treating regex as the maintainability advantage by itself. The choice is between two stateful lexers: one organized independently around regex recognition, the other organized to track CPython's scanner more directly. Upstream update review, diagnostics, Unicode data and conformance tests remain obligations in either approach.

## Local checks

Strict TypeScript checking passed using TypeScript from the toolchain experiment with `--target es2023 --module nodenext --allowImportingTsExtensions`. The accompanying README and generators reproduce the additional numeric/prefix and string matrices; the evaluator accepts both those corpora and the shared comparison corpora.

The legacy repository Black hook fails to import `click._unicodefun`; both Python generator files were formatted with the installed modern Black instead, and the configured Flake8 check passed. The broken Black hook was skipped for this experiment commit only.

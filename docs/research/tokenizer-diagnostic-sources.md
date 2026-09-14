# Tokenizer diagnostics for IDE users

Research date: 2026-09-14. Source and executable baseline: CPython 3.14.3. This is a bounded source review plus 18 representative examples, not a usability study or exhaustive compatibility result. Reproduce with [the diagnostic probe](../probes/tokenizer-diagnostics/check.py) using Python 3.14.3.

## Findings

Preserve CPython's diagnostic messages and metadata. For user-facing source validation, prefer the parse operation: tokenizer diagnostics alone miss grammar errors and sometimes give less useful locations or descriptions. This does not require rewriting upstream messages, automatically retrying failed tokenization through the parser, or adding parser recovery.

Python's public `tokenize` wrapper is a compatibility interface, not the strongest diagnostic interface. It delegates to the C tokenizer in extra-token mode, converts exact `SyntaxError` instances to `TokenError`, and keeps only the message and starting location. It also replaces the more descriptive triple-quoted-string message with `EOF in multi-line string`. Indentation subclasses pass through. Copying that wrapper would discard useful source and range information. [Pinned wrapper source](https://github.com/python/cpython/blob/v3.14.3/Lib/tokenize.py#L522-L544)

The private iterator and parser have different error translation paths. For an unclosed bracket, the iterator reports an EOF problem at the end of input. The parser uses the saved opening bracket and its position. Adopting the C tokenizer does not, by itself, provide all of CPython's best diagnostics. [Iterator translation](https://github.com/python/cpython/blob/v3.14.3/Python/Python-tokenize.c#L80-L169), [parser translation](https://github.com/python/cpython/blob/v3.14.3/Parser/pegen_errors.c#L54-L118)

| Probe                                                            | Observed difference                                                                                             | User-facing implication                                                                |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Missing closing square bracket                                   | Both iterator modes report an EOF error with offset 0; parsing identifies the unclosed bracket at offset 9.     | The parse location points at something the user can fix.                               |
| Missing triple quote                                             | Public wrapper uses EOF terminology; private iterator and parser identify an unterminated triple-quoted string. | Retain the descriptive upstream message.                                               |
| Mismatched brackets                                              | Strict iterator and parser reject; inspection mode completes.                                                   | Extra-token success does not imply correct source.                                     |
| Missing colon, missing indented block, empty f-string expression | Token iteration completes; parsing diagnoses the mistake.                                                       | Beginner syntax checking needs parsing.                                                |
| Invalid line continuation                                        | Iterator offset 17 differs from parser offset 12.                                                               | Do not assume token and parse diagnostic positions coincide.                           |
| Invalid dedent                                                   | Iterator offset 8 exceeds the actual line length in the example.                                                | Display conversion must handle unsuitable ranges without inventing source coordinates. |

These observations come from the probe, not promises about every malformed input. The public documentation explicitly excludes invalid source from its stable behavior contract. [Python 3.14 tokenize documentation](https://docs.python.org/3.14/library/tokenize.html)

The grammar also contains targeted diagnostics for missing commas, assignment used where an expression is required, missing colons and missing blocks. These require syntactic context. Keeping the generated grammar and error paths close to CPython preserves this work for beginners. Their usefulness is an engineering assessment; no beginner testing was performed here. [Pinned grammar](https://github.com/python/cpython/blob/v3.14.3/Grammar/python.gram)

## Warnings are separate

Tokenization and parsing can issue warnings while accepting input. Number-followed-by-keyword checks in the lexer can emit `SyntaxWarning`; extra-token mode deliberately skips those checks. Preserving comments and physical lines must not silently select a weaker validation policy. [Lexer number checks](https://github.com/python/cpython/blob/v3.14.3/Parser/lexer/lexer.c)

Ordinary string escape warnings arise during parser string decoding, not simply from identifying string tokens. In 3.14.3 their messages suggest escaping the backslash or using a raw string. The tokenizer has a separate escape-warning path for interpolation literals. Both paths can translate warnings promoted to errors into `SyntaxError`; parser decoding also avoids duplicate warnings during the invalid-rule pass. Warning behavior therefore needs its own API decision and evidence, beyond an exception contract. [String decoding](https://github.com/python/cpython/blob/v3.14.3/Parser/string_parser.c), [tokenizer warning helpers](https://github.com/python/cpython/blob/v3.14.3/Parser/tokenizer/helpers.c)

## Contract consequence

Expose useful lexical failures without reproducing the public Python wrapper's loss of information. Document the upstream distinction between lexical and parse failures. Use the parser's result when the IDE validates Python source. Preserve the upstream message, exception kind and available location fields so the IDE can show a readable message and highlight relevant source where supported. Exact tokenizer exception normalization and warning delivery remain decisions for the shared frontend contract.

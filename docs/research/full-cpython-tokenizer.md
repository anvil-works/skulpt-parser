# Full source-string CPython tokenizer translation experiment

This experiment targets the source-string contract of CPython 3.14.3 `_tokenize.TokenizerIter`, for both `extra_tokens=True` and `False`. It replaces the earlier limited interpolated-string experiment with a translation of the scanner's complete ordinary-token and interpolated-string control flow. It does not change production code.

## Source correspondence

The implementation is [tokenizer.ts](../../probes/full-cpython-tokenizer/tokenizer.ts). Upstream reference is the immutable [CPython v3.14.3 tag](https://github.com/python/cpython/tree/v3.14.3). The [CPython license](../../probes/full-cpython-tokenizer/CPYTHON-LICENSE.txt) accompanies the translated code.

| TypeScript function/state            | CPython source                                                                                                                                 |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `next`, `back`                       | `Parser/lexer/lexer.c`: `tok_nextc`, `tok_backup`                                                                                              |
| `next` input refill semantics        | `Parser/tokenizer/readline_tokenizer.c`: `tok_underflow_readline`, `tok_readline_string`                                                       |
| `normal`                             | `Parser/lexer/lexer.c`: `tok_get_normal_mode`, including indentation, comments, newline, identifier/prefix, punctuation and delimiter branches |
| `number`, `decimalTail`, `verifyEnd` | `tok_get_normal_mode` numeric branches, `tok_decimal_tail`, `verify_end_of_number`                                                             |
| `startInterpolated`, `string`        | `f_string_quote` and `letter_quote` labels                                                                                                     |
| `literal`                            | `tok_get_fstring_mode`                                                                                                                         |
| `Mode`, indentation/delimiter state  | `Parser/lexer/state.h`: `tokenizer_mode`, relevant `tok_state` fields                                                                          |
| `syntax`, `error`                    | `Parser/tokenizer/helpers.c`: `_syntaxerror_range`; `Python/Python-tokenize.c`: `_tokenizer_error`                                             |
| `make`                               | `Python/Python-tokenize.c`: `tokenizeriter_next`, including extra-token adjustments, line caching and Unicode columns                          |
| `operators.json`                     | CPython 3.14.3 `token.EXACT_TOKEN_TYPES`                                                                                                       |
| `unicode.json`                       | CPython 3.14.3 Unicode 16.0 identifier and printable properties                                                                                |

Unlike the earlier prototype, normal/literal transitions use explicit modes and CPython's curly/expression depth state. This preserves subtleties such as empty middle tokens at format-field boundaries instead of reconstructing them with special cases.

## Adaptations

C pointers become indices into one UTF-8 byte array. This keeps character classifications, lookahead, backup, source spans, and range calculations close to the C scanner. Physical-line boundaries are discovered lazily, preserving CRLF and the readline wrapper's implicit final newline. The input is already a JavaScript string; byte-file decoding, coding-cookie processing, file handles, interactive prompts and allocator failure paths are outside this source-string API.

The implementation materializes returned token objects. It tracks source columns incrementally, without a position tuple per character or repeated full-line rescanning. Unicode properties are generated from the pinned Python version rather than delegated to the JavaScript engine's possibly different Unicode database.

C `goto` branches become loops or helper functions. Functions retain the corresponding upstream branch order. This is more direct than the earlier handcrafted recursive scanner, but it is still a translated implementation to maintain and review—not automatically regenerated C-to-TypeScript output.

The Python iterator does not expose f-string debug/t-string metadata. This implementation consequently does not allocate or calculate that hidden metadata. A later parser integration must supply the metadata its grammar actions need. Syntax warnings are currently not surfaced; warning-only paths retain CPython's token acceptance. Warnings promoted to errors are outside the options supported here.

## Validation status

The first shared differential corpus contains 804 source strings, exercised in both iterator modes: 556 project fixtures, 148 literal examples extracted from upstream `test_tokenize`, 42 interpolation cases and 58 adversarial cases. All 1,608 token-stream or structured-error comparisons currently pass. Token comparisons include exact names, spelling, start/end codepoint positions, and `line` text. Error comparisons include name, message, line, offset, end range and source text.

A separate deterministic token-atom fuzz generator (seed 419) produced 4,000 sources, exercised in both modes. All 8,000 comparisons pass after iteration. Initial failures exposed the private iterator's strict UTF-8 decoding of partial tokens after a lone carriage return; that source-adapter behavior is now preserved, including `UnicodeDecodeError` fields. This is development fuzz coverage, not a held-out result.

The parent investigation independently supplied 561 further sources (stdlib files, mutated examples and limit cases), with 1,122 mode comparisons. Initial failures concerned unpaired UTF-16 surrogates silently replaced by `TextEncoder`; these are now explicitly rejected at physical-line load with the oracle's `UnicodeEncodeError`. The focused rerun passes all 1,122 comparisons. Refer to the parent report for independent confirmation, measurements and the final cross-implementation result.

One upstream anomaly is deliberately not reproduced: `_tokenize.TokenizerIter` raises `MemoryError` while scanning `t"""{x:\n}"""` (a real newline in the format field), in both modes. The equivalent f-string succeeds. Inspection suggests the hidden template-expression metadata computes a negative length after a format field spans physical lines. Our token-only implementation produces the natural token sequence. This is an oracle discrepancy, not a silently excluded passing case.

These are corpus results, not proof of complete parity. TypeScript strict checking and formatting with Prettier 3.6.2 pass. The repository's older Prettier hook cannot parse import attributes, and its Black 21.10b0 hook fails to import `_unicodefun` from Click. Focused Prettier 3.6.2, Black 22.8.0 and the existing flake8 hook pass; the two obsolete hooks were skipped for the research commit.

## Reproduction

Import `tokenize` directly with Node 26, or build the module with its JSON imports. `tokenize(source)` defaults to extra tokens; pass `{extraTokens:false}` for parser token names and the private iterator's parser-mode output adjustments. Optional `filename` changes diagnostic filenames.

Run `generate_unicode.py` with CPython 3.14.3 to reproduce Unicode ranges and operator names; run Prettier 3.6.2 on the generated JSON for matching formatting. No Python interpreter, Unicode-generation script, CPython source file, or test corpus is required by the shipped TypeScript module.

The [fuzz generator](../../probes/full-cpython-tokenizer/generate_fuzz.py) reproduces the token-atom cases and expected outputs: run with CPython 3.14.3 and redirect stdout to JSON. Syntax warnings may appear on stderr. The parent comparison harness accepts this same corpus schema.

Run the accompanying `compare.mjs` with a JSON or JSONL corpus path. For a standalone fuzz reproduction:

```sh
python3.14 probes/full-cpython-tokenizer/generate_fuzz.py > /tmp/tokenizer-fuzz.json
node probes/full-cpython-tokenizer/compare.mjs /tmp/tokenizer-fuzz.json
```

The comparison checks tokens or structured exceptions. It does not compare captured warnings. The complete supplied corpus and independent corpus live with the parent investigation; they are not duplicated in this branch.

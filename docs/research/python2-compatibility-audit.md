# Existing Python 2 compatibility work

Audited checkout: `tokenize-pypy`, commit `bd7d5acc52b70372be6c28808405fe8a14f0b82f`. This is a static implementation and test-wiring audit, not a successful runtime compatibility test. The checkout was not changed.

## What was attempted

| Form                                                 | Existing implementation                                                                                        | Limit                                                                                                                                                       |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `a <> b`                                             | Old regex tokenizer maps `<>` to the `!=` token in compatibility mode; generated comparison uses NotEq.        | Current imports use the unfinished replacement tokenizer.                                                                                                   |
| `0755`                                               | Old regex tokenizer enables implicit octal; number decoding rewrites the prefix.                               | Mode isolation and malformed literals need runtime tests.                                                                                                   |
| `123L`, `123l`, base-prefixed integers with suffixes | Old regex tokenizer adds optional L/l suffixes to integer patterns; decoder removes suffix and returns pyLong. | New tagged-int contract does not retain a separate Python long tag; execution policy is a separate concern.                                                 |
| `print x, y` and bare `print`                        | Added grammar rules construct calls to the name print.                                                         | They return Call directly in a statement slot instead of Expr(Call); bare print also uses null argument arrays. This is not a completed shared-AST mapping. |
| `print x,`                                           | Optional trailing comma consumed by the rule.                                                                  | The action discards it, losing its effect on output.                                                                                                        |

Sources at the audited revision: [mode switch](https://github.com/skulpt/skulpt-parser/blob/bd7d5acc52b70372be6c28808405fe8a14f0b82f/src/util/switch_version.ts), [old regex tokenizer](https://github.com/skulpt/skulpt-parser/blob/bd7d5acc52b70372be6c28808405fe8a14f0b82f/src/tokenize/tokenize_.ts), [number decoding](https://github.com/skulpt/skulpt-parser/blob/bd7d5acc52b70372be6c28808405fe8a14f0b82f/src/parser/parse_number.ts), [grammar patch](https://github.com/skulpt/skulpt-parser/blob/bd7d5acc52b70372be6c28808405fe8a14f0b82f/tools/patch/grammar.patch), [generated parser](https://github.com/skulpt/skulpt-parser/blob/bd7d5acc52b70372be6c28808405fe8a14f0b82f/src/parser/generated_parser.ts).

## Missing or incomplete forms

The inspected grammar has no dedicated support for comma-style exception binding, old comma-style raise, exec statements, backtick repr, tuple-unpacking parameters, or redirected print statements. The regex tokenizer's fixed prefix list does not include ur/ru strings. These observations concern this checkout, not all historical Skulpt support or application usage.

`except Exception, e` is therefore an agreed new requirement rather than functionality recovered from this grammar. Normal `except ... as name` remains the generated form. A token sequence being accepted as a different expression would not establish the intended legacy semantics.

## Execution and test limits

The active `src/tokenize/tokenize.ts` is an unfinished tokenizer port and exports only TokenInfo. Callers still import tokenize, _switchVersion and Floatnumber from that file. The previous regex implementation survives in tokenize_.ts. The current source graph is not a working end-to-end compatibility implementation; this audit did not replace imports or repair it to produce a green result. [Active tokenizer](https://github.com/skulpt/skulpt-parser/blob/bd7d5acc52b70372be6c28808405fe8a14f0b82f/src/tokenize/tokenize.ts).

The old mode switch changes shared keyword/token tables. New per-operation syntax options should not inherit process-global switching accidentally. Exact strict-mode acceptance needs runtime checks; an ungated grammar rule alone is insufficient evidence because expression parsing and keyword classification interact.

No switchVersion calls were found under tests. The CLI accepts --python2/--py2 but explicitly skips CPython AST comparison in that mode. Test fixture presence, including commented legacy examples, does not prove compatibility coverage. [CLI](https://github.com/skulpt/skulpt-parser/blob/bd7d5acc52b70372be6c28808405fe8a14f0b82f/scripts/parse.ts).

## Decision implications

Keep the four agreed forms: comparisons with <>, legacy octals, print statements and comma exception binding. Add L/l integer suffixes as the first proposed extension because explicit implementation already exists. Test exact integer values and strict-mode rejection separately.

Before claiming print-statement support, settle redirected output and trailing-comma handling and preserve the information needed by the Skulpt adapter. A plain call rewrite is not automatically equivalent, especially when the print name can be rebound. Existing acceptance must not justify carrying forward malformed ASTs or lost semantics.

The other missing legacy forms are candidates for a consumer requirement check, not automatic scope additions. This audit does not establish that old applications never use them and does not propose full Python 2 support.

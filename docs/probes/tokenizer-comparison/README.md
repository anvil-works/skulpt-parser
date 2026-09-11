# Tokenizer approach comparison

Decision evidence for [Compare regex-based and CPython-shaped tokenizer approaches](https://github.com/anvil-works/skulpt-parser/issues/13), 2026-09-11. These are throwaway expression/interpolation probes, not complete tokenizers or a production migration.

## Finding

Regex remains a viable implementation tool for ordinary tokens and literal chunks. It does not remove the need for explicit state for nested strings, replacement fields, format specifications and delimiters. Both independently written approaches ended up with that state.

The meaningful maintenance choice is how closely the state transitions and lexical decisions correspond to the pinned CPython implementation. A TypeScript scanner can follow CPython's modes while using regex for local recognition where that is clearer. This probe does not justify abandoning regex wholesale, retaining the old scanner unchanged, or declaring either new prototype production-ready.

## Candidates

- [Regex-first prototype](https://github.com/anvil-works/skulpt-parser/blob/a0c677c/docs/research/regex-tokenizer-probe.md): regex recognition for ordinary tokens and chunks, with explicit interpolation state. It reuses ideas from the old scanner; it is not an in-place extension of the complete old implementation.
- [CPython-shaped prototype](https://github.com/anvil-works/skulpt-parser/blob/0097e4b/docs/research/cpython-tokenizer-probe.md): an independently written character scanner informed by CPython's normal/string modes and state. It is not a mechanical port of the C scanner.

The second report maps its responsibilities to versioned CPython source. Such correspondence is useful maintenance evidence, but naming methods similarly is not sufficient proof of semantic equivalence.

## Independent evaluation

Both authors received the same 22-case corpus. A separate 20-case validation corpus was withheld until their implementations passed the supplied cases. They did not see each other's implementations. No semantic repair was counted after revealing the validation failure; publication formatting was checked against the validation set again.

The oracle is CPython 3.14.3 on macOS arm64. Node 26.7.0 directly executes the prototypes' erasable TypeScript. The evaluator compares token kinds, strings, start positions and end positions. It excludes encoding, comments, indentation, logical/physical newlines and end markers. Token columns follow Python's public tokenizer convention of Unicode codepoints, not AST UTF-8 byte offsets.

| Candidate                 | Supplied valid exact | Unseen valid exact | Supplied malformed rejected | Unseen malformed rejected |
| ------------------------- | -------------------: | -----------------: | --------------------------: | ------------------------: |
| Regex-first with state    |              18 / 18 |            15 / 16 |                       4 / 4 |                     4 / 4 |
| CPython-shaped with state |              18 / 18 |            15 / 16 |                       4 / 4 |                     4 / 4 |

Both miss the same token in `f"{x:{w}.{p}}"`: CPython emits an empty `FSTRING_MIDDLE` immediately before the final replacement-field closing brace. Both prototypes omit it. This is a concrete example of why ordinary successful examples do not establish compatibility.

The valid cases include nested f/t strings, quote reuse, raw and triple strings, braces, format fields, conversions, debug expressions, comments inside fields, Unicode and ordinary numeric tokens. Malformed cases are narrowly lexical. Rejection means any exception; error kind, text and ranges were not matched. Python compilation independently verified the intended validity of each fixture, but valid token streams alone do not establish parser acceptance. Public `tokenize` does not promise behavior on arbitrary invalid source.

Raw comparisons, expected streams and both corpora are committed beside this report. `source-manifest.json` records source hashes and publication commits.

## What this does not settle

Both omit full indentation/newline handling, encodings, complete numeric/identifier validation, Python 2 mode, exact diagnostics and parser-facing metadata. Modern template/debug-expression metadata requires validation beyond the public token stream. Python and JavaScript Unicode identifier tables may differ.

The regex prototype repeatedly rescans prefixes for positions; the character prototype preallocates codepoint and position arrays. Neither is a suitable basis for claiming production speed or memory efficiency. Source size is recorded only as probe provenance, not a projected shipping bundle size. No timing contest was run between these deliberately unoptimized subsets.

Model assistance made these prototypes inexpensive to write, but this result says nothing about autonomous maintenance across Python releases. The uncovered token mismatch and the documented omissions remain work regardless of how code is produced.

## Recommendation for the human decision

Use explicit string/interpolation state with traceable correspondence to pinned CPython logic; allow regex for local recognition where it keeps the code clear. Preserve the existing regex scanner as baseline evidence during recovery rather than assuming it can be upgraded by changing patterns alone. Require differential token and later AST/error comparisons as the implementation grows. Prefer a documented upstream mapping and explicit adaptations over an independent lexer design that is difficult to reconcile with upstream changes.

This is a recommendation, not a selected architecture. A complete modern tokenizer implementation and representative performance/size measurements remain outside this planning probe.

## Reproduce

Check out the two linked candidate commits in separate worktrees. From the evaluation checkout, use the same pinned CPython to regenerate expected streams and pass an absolute prototype path to the evaluator:

```sh
python3.14 docs/probes/tokenizer-comparison/oracle.py docs/probes/tokenizer-comparison/corpus.json > /tmp/tokenizer-expected.json
node docs/probes/tokenizer-comparison/evaluate.mjs /absolute/path/to/tokenizer.ts /tmp/tokenizer-expected.json
```

Repeat with `validation.json`. Output summarizes exact valid matches and malformed rejections; inspect mismatches instead of treating exit status as a passing test. The evaluator intentionally reports failures without aborting so both candidates can be compared.

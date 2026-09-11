# Whole-source regex experiment

Use Node 26 to run the TypeScript directly. No runtime packages are required.

```sh
python3.14 probes/full-regex-tokenizer/generate_cases.py numbers > /tmp/regex-numbers.json
python3.14 probes/full-regex-tokenizer/generate_cases.py strings > /tmp/regex-strings.json
node probes/full-regex-tokenizer/evaluate.mjs "$PWD/probes/full-regex-tokenizer/tokenizer.ts" /tmp/regex-numbers.json /tmp/regex-numbers-results.json
node probes/full-regex-tokenizer/evaluate.mjs "$PWD/probes/full-regex-tokenizer/tokenizer.ts" /tmp/regex-strings.json /tmp/regex-strings-results.json
```

The generator requires CPython 3.14.3. The evaluator also accepts the shared comparison's JSON/JSONL corpora. It compares full token streams and structured error fields; warning counts describe the oracle, since this tokenizer does not emit warnings.

Regenerate Unicode tables with CPython using Unicode 16.0.0:

```sh
python3.14 probes/full-regex-tokenizer/generate_unicode.py
```

Type-check using current TypeScript:

```sh
tsc --noEmit --strict --target es2023 --module nodenext --allowImportingTsExtensions probes/full-regex-tokenizer/tokenizer.ts
```

The [research report](../../docs/research/full-regex-tokenizer.md) records lineage, test scope and known mismatches.

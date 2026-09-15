# Pinned CPython generation inputs

`cpython.json` pins CPython 3.14.3 to commit `323c59a5e348347be2ce2b7ea55fcb30bf68b2d3` and records SHA-256 hashes for 28 source files. The input set contains the upstream license, grammar, token definitions, ASDL schema/reader the `pegen` package, and five lexer/tokenizer reference files. It is separate from the existing generated parser's 3.9.5 provenance and the baseline test oracle's 3.9.25 runtime.

```sh
pnpm upstream:prepare
pnpm upstream:check
pnpm test:upstream
```

Preparation uses `python3` with Python 3.9 or later. Validation uses `python3.14` and requires CPython **3.14.3** exactly. Alternatively, invoke the desired executable directly:

```sh
/path/to/python3.14 -m tools.upstream check
```

## Preparation and isolation

Preparation downloads missing files from the official CPython repository at the locked commit, verifies each hash before installing it, and verifies cached files on every run. Files live under `.cache/cpython/<commit>/`, which is ignored by Git. A fully populated cache can be reused offline. Modified cached inputs cause an error instead of being silently overwritten. Remove the reported cache file to fetch it again.

The `check` command is offline and fails if inputs are missing, modified or the interpreter version differs. `--cache-dir /path/to/cache` selects a different preparation/check location; the commit-specific subdirectory is always appended. The commands resolve the lock relative to this repository, not a sibling checkout or an ambient `PATH_TO_CPYTHON` setting.

No command checks out a Git revision, patches upstream files, replaces an upstream generator, or touches `../cpython`. The lock and copied license record upstream provenance. These files are build-time inputs and are not added to the browser package.

## What validation proves

The command uses the pinned upstream grammar parser to read the full Python grammar and its token-definition reader to load `Grammar/Tokens`. It parses and validates `Python.asdl`, then compares all declared AST field and attribute names with the pinned CPython runtime. The current result is 268 grammar rules, 113 matching AST layouts and 69 token definitions.

This proves that the isolated inputs can be loaded together. It does **not** generate a working TypeScript 3.14 frontend, validate adapted semantic actions, implement the agreed structural AST representation or establish Python 3.14 parsing support. The existing 3.9 TypeScript generator has not yet been pointed at these files. Its historical scripts still have the limitations described in the root README.

The next migration change should use these sources to adapt the TypeScript backend and AST generation, with output paths and adaptations under our control. Keep the source inputs unchanged; do not recreate the old generator-file replacement workflow.

## Updating the pin

Resolve the selected CPython release tag to an immutable commit, review the upstream changes, then update the version, commit and every input hash together. Review changes to the grammar, ASDL, tokens and generator sources as a coordinated update. Do not refresh hashes merely to accept a failed integrity check. Use the matching CPython runtime for validation, and rerun input-integrity tests plus the grammar/schema check before accepting the new lock.

# Skulpt Python 2 frontend baseline

The maintainer selected existing Skulpt support as the compatibility ceiling: Python 2 forms unsupported there are not new requirements. This supersedes using the unfinished skulpt-parser compatibility work as the scope boundary. Existing applications must remain supported; separate Python 3 and compatibility artifacts remain an option if measured size costs justify them.

## Evidence

Audited sibling Skulpt checkout at `58dc4c59f3daad884a7dc1073961cbdeb0cbc2c6`, with a clean tracked working tree. Built its current sources and generated tables using its installed webpack into a temporary directory, without rebuilding or changing its dist directory. A focused probe compared 30 forms in Python 2 and Python 3 configurations through parsing, AST construction and compilation. This does not execute all compiled programs or establish complete Python 2 runtime compatibility.

Reproduce using the audited Skulpt checkout and its installed dependencies:

```sh
NODE_OPTIONS=--openssl-legacy-provider node docs/probes/skulpt-python2/build.cjs /absolute/path/to/skulpt /tmp/skulpt-py2-source-build
node docs/probes/skulpt-python2/check.cjs /tmp/skulpt-py2-source-build/skulpt.js
```

[Probe](../probes/skulpt-python2/check.cjs), [build configuration](../probes/skulpt-python2/build.cjs), [recorded results](../probes/skulpt-python2/results.json). Node 26.5.0; OpenSSL compatibility option is for the existing webpack version. The probe does not use a potentially stale dist bundle. An initial attempt to dump ASTs hit an unrelated astDump error; the final probe checks AST construction and compilation directly and does not depend on that formatter.

## Observed syntax boundary

| Form                                                    | Python 2 result                 | Compatibility implication                                                                                          |
| ------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `a <> b`                                                | Compiles                        | Retain legacy comparison spelling.                                                                                 |
| `0755`                                                  | Compiles                        | Retain implicit octal literals.                                                                                    |
| `123L`, `0xffL`, `0b101L`, `0755L`                      | Compiles                        | Retain uppercase long suffix; preserve exact integer value.                                                        |
| `123l`                                                  | Rejected                        | Lowercase suffix is not required by this baseline, despite the old parser attempt accepting it.                    |
| Bare `print`, multiple values, trailing comma           | Compiles                        | Preserve the statement and newline information.                                                                    |
| Redirected print, including trailing comma              | Compiles                        | Retain parseability; runtime redirection is incomplete, see below.                                                 |
| `except Exception, e`                                   | Compiles                        | Retain comma binding.                                                                                              |
| Tuple/list, attribute and subscript exception targets   | Compiles                        | Retain these accepted assignment-target forms, not only a name.                                                    |
| `raise ValueError, value` and a third traceback operand | Compiles                        | Retain accepted old raise forms; explicit traceback use is incomplete.                                             |
| `async = 1`, `await = 1`                                | Compiles in both configurations | Preserve legacy identifier usage in compatibility mode; strict Python 3.14 follows its own reserved-keyword rules. |
| `exec code`, `exec code in g, l`                        | Rejected                        | No requirement to add exec statement syntax.                                                                       |
| Backtick repr                                           | Rejected                        | Exclude.                                                                                                           |
| Tuple function/lambda parameters                        | Rejected                        | Exclude.                                                                                                           |
| `ur`/`ru` strings                                       | Rejected                        | Exclude. Plain `u` strings compile in both configurations.                                                         |

Python 3 configuration rejects the tested legacy comparison, numeric, print-statement, comma-exception and comma-raise forms. Bare `print` also compiles in Python 3 as a name expression. Similarly, `print >>f, 1` is a legal expression involving a right shift when print is an ordinary name; its compilation in Python 3 is not legacy print-statement support. Do not introduce a blanket textual rejection of that sequence into strict mode.

## Important distinctions from full semantics

- `src/ast.js:3133` preserves Print destination, values and newline state. `src/compile.js:2938` compiles values and newline handling but explicitly disables routing output to the destination. Accepting redirected print does not mean redirection works.
- `src/ast.js:1208` represents old raise operands. `src/compile.js:1507` constructs exception instances but does not implement the explicit traceback operand.
- `src/ast.js:405` accepts assignment targets for legacy except clauses; the compiler assigns through its normal assignment path. Compilation of tuple/list, attribute and subscript targets is confirmed, not all runtime binding behavior.
- `src/tokenize.js:240` accepts uppercase L only, although `src/ast.js:2705` can decode either case. The adapter currently distinguishes long literals with a separate runtime long type. The shared integer contract must not silently erase a distinction needed to preserve Skulpt behavior; its representation needs a compatibility decision.
- A source `from __future__ import print_function` followed by a call with a keyword argument was rejected in the Python 2 probe. The parser separately checks a configured print_function flag. Preserve the distinction between source-import handling and supplied feature context; do not claim full future-import support from the existence of flags.

Supporting already accepted syntax does not require repairing every existing runtime limitation. The frontend must retain the information needed for the chosen compatibility behavior instead of silently lowering away destinations, newline state, raise operands, binding targets or relevant literal distinctions.

## Test evidence and source pointers

The primary source files in the audited checkout are `src/pgen/parser/Grammar.txt`, `src/tokenize.js`, `src/env.js`, `src/parser.js`, `src/ast.js`, and `src/compile.js`.

Default tests use `test/run/t*.py` through the enabled run suite and `test/unit/test_*.py` through testunit. Positive existing fixtures include `test/run/t509.py` for old raise and `test/run/t167.py` for uppercase long literals. They were inspected, not rerun as part of this audit. The broad historical `test/py/test_grammar.py` is not selected by those default runners. Its legacy exec and redirected-print examples are not proof of working support. This audit's focused probe provides separate evidence for the observed matrix.

## Remaining decision

Choose how the compatibility AST preserves legacy information that modern CPython AST nodes do not represent directly. Print, old raise, non-name exception targets and explicit long-literal distinctions require care. Existing compile acceptance supplies the scope baseline; it does not establish that rewriting them to ordinary Python 3 calls is semantically equivalent.

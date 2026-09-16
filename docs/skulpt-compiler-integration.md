# Skulpt compiler integration audit

The next integration should use a Skulpt-owned adapter from the structural AST to
Skulpt's existing AST constructors, with explicit rejection of unsupported syntax
before symbol-table analysis. Keep the parser independent of Skulpt runtime
objects. Start with an opt-in execution path and differential tests, then decide
whether the conversion cost warrants moving the compiler to structural nodes.
This is a proposed implementation sequence, not a claim of runtime compatibility.

## Evidence and scope

Audit performed on 2026-09-16 against parser commit
`7633b0fb169c97ba7cf2ea42dab7e034fd3edd01`. The sibling Skulpt checkout was clean on
`pr/decimal`, commit `58dc4c59f3daad884a7dc1073961cbdeb0cbc2c6`. Its local `master`
was `ae5f4628e319bd51d26fc3e920baabd3803cacd5`; `feat/nonlocal` was
`86a1844a5b6016faf9dd535ed3e57d6321d1f25c`. These branches are not interchangeable.
The latter already handles `Nonlocal` in symbol-table analysis and compilation.
The checkout's local guidance says compiler/name-resolution work starts from
`feat/nonlocal`. Confirm that base is still appropriate before implementation.

Static evidence comes from Skulpt's `src/compile.js`, `src/symtable.js`,
`src/ast.js`, `src/builtin.js`, `src/parser.js`, `src/pgen/ast/Python.asdl` and
`gen/astnodes.js`. Parser evidence comes from `src/python314/ast.ts`,
`constants.ts`, `python2_ast.ts`, `parse_options.ts` and `imports.ts`.

The executable probe uses the existing deployed runtime bundle, SHA-256
`29aa41f66d084b5826e6d386a5494b179d96a793607ebfc668cedc4752722e54`, rather than
claiming that bundle was built from any of the sibling branches. The core bundle
hash is `3f9094267a9ae24d19a0e4b20a5ff4bcdc83f8bad4dec01f86e628bd00b32288`.
[Probe output](benchmarks/skulpt-integration-audit.json) records 29 synthetic
cases through the real old parser/AST builder and `Sk.compile`, and through the
new parser with client legacy-async-name policy. It records observations, not
golden correctness expectations. Compilation success does not establish execution
correctness. There is no adapter in this audit.

```sh
pnpm build:core
node scripts/audit-skulpt-integration.mjs /path/to/skulpt.min.js dist-core/index.js > /tmp/skulpt-integration-audit.json
```

## Entry points and representation

`Sk.compile` currently performs source -> `Sk.parse` CST -> `Sk.astFromParse` AST
-> `Sk.symboltable` -> `Compiler.cmod`. The replacement seam is source -> parser
AST -> adapter -> existing symbol table/compiler. `Sk.builtin.eval` also calls
the old parser and AST builder directly before delegating to execution. Replacing
only `Sk.compile` would leave this old syntax gate in place. Module imports,
`exec` and the `compile` builtin reach `Sk.compile`; test their behavior separately.
The old AST builder also recursively parses f-string expressions. That path can
remain with the old frontend during rollout; the new parser already produces
complete f-string trees.

The compiler's documented `mode` argument lists `exec`, `eval` and `single`, but
the inspected implementation always enters the module parser. Do not assume that
replacing it with three parser entry points preserves current builtin behavior.
The new frontend exposes module and expression parsing, not interactive parsing.

| Contract               | New parser                                              | Required Skulpt adaptation                                                                                          |
| ---------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Node identity          | Plain objects with `_type`                              | Actual `Sk.astnodes` instances; compiler and symtable switch on constructors and sometimes use `instanceof`         |
| Operators and contexts | Objects such as `{ _type: "Load" }`                     | Constructor functions such as `Sk.astnodes.Load`, not instances                                                     |
| Identifiers            | JavaScript strings                                      | `Sk.builtin.str` for names, attributes, aliases, arguments and declarations                                         |
| Constants              | `Constant` with tagged scalar                           | `Num`, `Str`, `Bytes`, `NameConstant`, `Ellipsis` and matching runtime values                                       |
| Integers               | number/bigint, optional `legacyLong`                    | Preserve int/long identity; use a lossless decimal conversion at the runtime boundary, including JSBI-backed builds |
| Byte strings           | `Uint8Array`                                            | `Bytes.s` currently holds a Skulpt string of byte-valued characters; Python 2 compiler lowers bytes to strings      |
| Subscripts             | Expression or `Slice`; tuple for multidimensional index | `Index`, `Slice`, `ExtSlice` representation, with tests for tuple and mixed slice dimensions                        |
| Exception alias        | Nullable identifier string                              | `Name` expression in Store context despite ASDL declaring an identifier                                             |
| Python 2 extensions    | `Print`, `LegacyRaise`, `LegacyExceptHandler`           | Existing `Print`; four-field `Raise`; expression-valued `ExceptHandler.name`                                        |
| Empty sequences        | Arrays                                                  | Handle existing nullable sequences without changing execution                                                       |
| Docstrings             | Leading `Expr(Constant(str))`                           | Convert to `Expr(Str)` and preserve its position; compiler discovers docstrings from the body                       |
| Locations              | UTF-8 byte columns, end locations                       | Preserve native locations; convert only at consumers needing another coordinate convention                          |
| Errors                 | JS syntax errors with source attributes                 | Python `SyntaxError`/`IndentationError`/`TabError`, including filename, line and useful source ranges               |

Directly handing the new `x = 1` AST to the production bundle's `Sk.symboltable`
returned successfully but produced **no identifiers**. The old AST produces local
identifier `x`. Unknown-node assertions in source are therefore not an adequate
production guard. Test actual bindings and execution, not merely absence of throws.

Do not route this through the recovered Python 3.9 AST or symbol table in the
parser repository. That would add another schema conversion and would not supply
the new runtime semantics.

## Accepted syntax is not implemented semantics

The deployed runtime rejects positional-only parameters, walrus expressions,
pattern matching, exception groups, type parameters, type aliases, template
strings and nonlocal declarations in the probe. The new parser accepts all of
these. Some use existing node kinds with new fields, so checking only `_type`
is insufficient. In particular, nonempty `posonlyargs`, `type_params` and async
comprehension flags must not be silently discarded.

Initially guard features the selected compiler base cannot implement. Account
for its existing nonlocal work rather than blindly preserving the deployed
bundle's rejection. Keep `legacyAsyncNames: true` for the current client runtime
in both language modes. Async constructs remain unavailable under that policy;
strict server parsing remains independent. Reserving those names and implementing
coroutines would require a separate runtime migration.

Modern syntax that maps to existing semantics can be considered individually.
The parser accepting a construct is not enough evidence. Also check changes in
meaning for annotations, exception aliases and comprehensions before claiming a
Python 3.14 runtime. Scope-invalid inputs such as module-level `return 1` correctly
parse to AST and must still fail compilation.

## Compatibility gaps to resolve in the first slice

- **Configured futures:** the runtime accepts Python 2 `print_function: true` as
  a function call, while `python2Compat: true` currently parses the same text as
  a print statement. The source future-import quirk is already covered by parser
  fixtures and differs from this configured flag. Add the narrow syntax option
  needed to bridge the configuration; disabling all Python 2 syntax is not valid.
  Audit other configured future flags and source imports through compilation,
  including division and import behavior. New parse results expose no Skulpt
  numeric flags. `Sk.compile` currently scopes `Sk.__future__` around compilation;
  ensure errors cannot leak settings into later modules.
- **Debugger statement:** Skulpt produces `Debugger` for standalone `debugger`;
  the new parser produces `Expr(Name("debugger"))`. Preserve or deliberately retire
  this Skulpt extension at the consumer boundary. Do not silently turn a breakpoint
  into a variable lookup or globally reserve a normal Python identifier.
- **Unicode identifiers:** the probe preserves `K` in Skulpt but normalizes it
  to `K` in the new parser. This is CPython-aligned, but affects name lookup across
  old/new modules and host-provided globals. Test the consumer boundary before
  changing runtime selection. Shared Unicode extraction remains a later measured
  integration task, not a prerequisite for this adapter.
- **Named escapes:** the old bundle preserves the unrecognized `\N{SNOWMAN}`
  escape instead of resolving it; lean core raises `UnicodeNameDatabaseRequired`.
  Keep the database optional. Decide capability loading at the runtime boundary;
  a synchronous `Sk.compile` cannot silently perform an asynchronous import. Do
  not report the missing database as a Python syntax error or copy old incorrect
  string values as a new correctness requirement.
- **Literals:** preserve large integers, explicit longs, negative zero, complex
  values and byte values with runtime tests. Python 2 literal quirks must be
  distinguished from intended compatibility; do not preserve every old decoding
  bug solely to obtain identical AST dumps.
- **Diagnostics:** map source errors to Python exceptions while keeping ordinary
  implementation errors visible. Unknown/unsupported nodes need a deliberate
  located error before entering old compiler code. Keep warning delivery separate.

## Implementation sequence and acceptance

1. Establish a separate Skulpt worktree from the agreed compiler base. Add an
   opt-in adapter and a small real execution suite. Cover assignment/literals,
   functions/defaults/closures, class scope, comprehensions, mixed slices,
   exception binding, imports, docstrings, f-strings, `eval` and `exec`, plus the
   existing Python 2 print/raise/long forms. Keep the old path selectable for
   independent comparison. Do not remove it yet.
2. Use explicit switch-based conversion and guards. Add only the parser options
   demonstrated necessary by the configured-future tests. Verify outputs and
   exceptions against the old runtime for intentional compatibility and pinned
   CPython for supported Python semantics. Known Skulpt bugs need explicit
   classification, not self-generated golden expectations. Test both successful
   compilation and execution, including suspension through the existing runtime.
3. Run the relevant existing Skulpt suites in both modes. Measure source-to-AST
   including adaptation, source-to-JavaScript compilation, actual combined bundle
   sizes and allocation/retained memory. The adapter builds another tree; the
   parser-only cache speedup does not establish a net compiler speedup. Measure a
   candidate shipping build without the old frontend separately from the dual-path
   comparison build.
4. Enable the new path only after behavior and cost are understood. Handle public
   CST/tokenizer APIs and any remaining callers before removing their old code.
   Expand runtime syntax in later, explicit compiler changes. Consider consuming
   structural ASTs directly if measured conversion costs justify that larger change.

The immediate checkpoint is an adapter executing the existing supported subset
with useful errors for unsupported features. Full Python 3.14 runtime support,
automatic loading of Unicode data, compiler-wide AST replacement and removal of
Skulpt from the IDE are separate work.

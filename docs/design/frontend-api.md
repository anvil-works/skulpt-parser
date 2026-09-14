# Shared frontend API contract

Status: agreed planning contract for [Choose the TypeScript AST and consumer API representation](https://github.com/anvil-works/skulpt-parser/issues/9). The behavioral choices identified below have been agreed with the maintainer. Export names, tag spelling and signature sketches are proposals for review, not an implemented API. The behavioral decisions are settled for implementation planning. This document does not claim production implementation or compatibility validation.

This document describes a frontend shared by Anvil IDE and Skulpt. The IDE must be able to parse and analyze source without loading Skulpt. The Skulpt integration converts frontend values and diagnostics at its boundary. Python 3.14 is the behavioral target; accepting syntax does not promise that Skulpt can execute it.

## Operations

Agreed: keep tokenization, parsing and symbol-table analysis separate. Parsing does not automatically perform symbol-table analysis or constant folding. Parsing supports `exec`, `eval` and `single` modes.

Proposed names and shapes:

```ts
interface ParseOptions {
  mode?: "exec" | "eval" | "single"; // default: exec
  filename?: string; // default: <string>
  syntax?: "python3" | "python2-compat"; // default: python3
  onWarning?: (diagnostic: WarningDiagnostic) => void;
}

type ParseResult<T> = { ok: true; ast: T } | { ok: false; diagnostic: Diagnostic };

// Schematic signatures; generated AST types refine the result by mode.
declare function parse(source: string, options?: ParseOptions): ParseRoot;
declare function tryParse(source: string, options?: ParseOptions): ParseResult<ParseRoot>;
declare function analyzeSymbols(ast: ParseRoot, options?: AnalysisOptions): SymbolTable;
declare function tokenize(source: string, options?: TokenizeOptions): IterableIterator<Token>;
```

`ParseRoot` follows the chosen start rule: Module for `exec`, Expression for `eval`, Interactive for `single`. An overload or generic can express this relationship in the published declarations. `SymbolTable` is deliberately not specified by the normalized output of the dispatch experiment; integration must preserve the scope information needed by real consumers and compilation. Analysis derives source future imports from the AST and accepts external filename and applicable inherited context separately, defaulting to no inherited flags. The AST root already identifies the parse mode. Exact supported context fields remain subject to Python 3.14 integration; this is not a promise to expose arbitrary CPython compiler flags.

The maintainer accepts retaining future-feature information but does not require Skulpt to reproduce CPython's full historical future-flag behavior. Skulpt may enable compatible, non-breaking behavior by default without requiring an opt-in import. Changes that affect existing program behavior need explicit compatibility consideration. Keep the shared frontend's upstream analysis requirements distinct from Skulpt's execution policy; enabling a feature in Skulpt must not silently discard information needed for correct analysis. No specific future feature is classified as non-breaking by this agreement.

Strict Python 3 is the default. The explicit compatibility mode enables only the agreed bounded Python 2 forms; its complete syntax set belongs to the separate compatibility decision. The compatibility decision permits explicit legacy AST extensions while keeping strict Python 3 ASTs unchanged; see the [Skulpt compatibility baseline](../research/skulpt-python2-baseline.md). These signatures do not promise arbitrary historical Python-version selection. File loading and worker messaging belong outside the source-string core. Async initialization requirements for a potential WASM backend remain part of that separate experiment, not a promise made here.

## AST nodes

Agreed: consumers depend on typed node data, CPython node names and fields, and source positions. No required `instanceof`, prototype identity, `walkabout` or other node methods. Traversal helpers are optional and separate. Internal generated classes remain possible; this contract does not assume plain-object factories are faster or smaller.

The maintainer is comfortable with either an explicit `_type` tag or exported constructors such as ast.FunctionDef, choosing whichever produces the cleanest implementation. Exported constructors can coexist with the structural consumer contract; consumers must not be required to depend on instanceof or prototype identity. Keep constructor exports as an option, reflecting the maintainer's note that this resembles Skulpt's existing approach.

`_type` remains an illustrative discriminant, not a settled export spelling or a CPython standard. CPython identifies Python AST nodes by their classes. If using an explicit tag in TypeScript, reserve `kind` for CPython's own fields; Constant already has a kind field. The concrete tag and construction API can be selected during implementation without reopening the agreed structural contract.

Illustrative parser-produced node:

```ts
const example = {
  _type: "Constant",
  value: { type: "int", value: 42 },
  kind: null,
  lineno: 1,
  col_offset: 0,
  end_lineno: 1,
  end_col_offset: 2,
};
```

The full TypeScript union should come from pinned CPython ASDL and explicit adaptations, not a manually maintained second schema. CPython's field meanings and optionality remain authoritative. Locations are present only where the schema/producer provides them; do not invent zero-valued locations for node kinds without them. The exact generated construction mechanism and metadata layout are implementation choices behind this structural API. No immutability, freezing or copy-on-write requirement has been agreed.

Optional inspection helpers can dispatch on the discriminant. Exposing them does not change the settled CPython-style symbol-table organization or require every semantic pass to inherit generic traversal. No particular visitor framework has been selected.

## Literal values

Agreed: constants are tagged data, independent of Skulpt objects. Decoding, formatting and constant-folding operations are separate helpers, not required instance methods.

Proposed field spellings:

```ts
type ScalarConstant =
  | { type: "int"; value: number | bigint }
  | { type: "float"; value: number }
  | { type: "complex"; real: number; imag: number }
  | { type: "str"; value: string }
  | { type: "bytes"; value: Uint8Array }
  | { type: "bool"; value: boolean }
  | { type: "none" }
  | { type: "ellipsis" };
```

The int tag represents one Python type. Values within JavaScript's safe integer range use number; larger integers use native bigint. Decode large literals without first rounding through number. Integer helpers must promote before precision is lost and implement Python arithmetic semantics, including floor division for negative values. There is no claim that hybrid storage has been proven faster than all-bigint storage.

Float and complex components preserve binary64 values, including infinities and signed zero. Strings use JavaScript strings as storage, but Python string operations must respect Python character semantics rather than treating UTF-16 code units as Python characters. Bytes use Uint8Array. None and Ellipsis have distinct tags and no payload.

This scalar union covers the agreed strict Python 3 source-literal payloads. Compatibility mode additionally preserves explicit long-literal identity for the Skulpt adapter; its exact extension encoding is an implementation choice in the compatibility contract. It is not a promise that every optimizer-produced Python constant fits this union: tuples/frozensets or other aggregate values need an extension before an API exposing those values is introduced. Initial parsing does not automatically fold constants. The folding API itself is not finalized here.

Native BigInt is an initial runtime requirement. JSBI and browsers without native BigInt are deferred, not initial deliverables. This does not approve every post-2019 syntax/API requirement. The maintainer has seen regressions when raising browser baselines; migration acceptance must identify affected consumers before rollout. No speculative fallback backend is required now.

Direct `JSON.stringify(ast)` is not required to provide lossless serialization. Big integers, non-finite floats, signed zero and byte data need an explicit encoding if a consumer requires one. There is no selected serialization or worker protocol yet.

## Source errors

Agreed: the core parser aborts recognized source failures using exceptions. `parse` returns an AST or throws a structured frontend source error. `tryParse` calls that same implementation and returns a discriminated AST/diagnostic result for recognized source errors. Unexpected implementation failures propagate; they must not be relabeled as invalid Python.

The throwing error and returned diagnostic should carry the same diagnostic data. Proposed schematic representation:

```ts
interface Diagnostic {
  kind: "SyntaxError" | "IndentationError" | "TabError";
  message: string;
  filename: string;
  lineno: number | null;
  offset: number | null;
  end_lineno: number | null;
  end_offset: number | null;
  text: string | null;
}
```

This is a representation proposal for the known syntax-error family, not approval to classify every exception by a matching string name. Recognition must distinguish genuine frontend source failures from programming errors. Diagnostic kind, message and applicable source fields follow pinned CPython. Python 2 forms need separate expected diagnostics.

Agreed: IDE syntax checking uses tryParse diagnostics, preserving CPython messages and available locations. Token scans expose lexical failures but are not a substitute for parsing. Successful parsing is not complete source validation: symbol analysis and subsequent compilation can produce additional source errors, which consumers must surface when those operations run. IDE consumers may retain their own source-repair/retry logic. Skulpt's adapter converts frontend errors into its runtime exceptions. Neither API introduces custom parser recovery.

Agreed: expose an optional onWarning(diagnostic) callback for warnings. Successful parsing still returns an AST, and tryParse retains its AST-or-error result. The IDE can collect warnings for display; the Skulpt adapter can route them through Python warning machinery. Warnings are distinct from fatal source errors, so WarningDiagnostic must represent the upstream warning category rather than reuse the syntax-error-only kind union above. Both tokenizer experiments omitted warnings; production integration must cover their emission and source context. When no callback is supplied, non-fatal warnings are silent: parsing still succeeds and the core does not write to the console. IDE and Skulpt integrations install callbacks to display or handle warnings. Exact warning fields and adapter warning-filter semantics need specification during integration without importing an entire Python warnings subsystem into the standalone core.

## Tokens

Agreed: source-string tokenization returns an iterator. Callers can stop early or materialize it with Array.from. Source failures surface during iteration. The parser manages its own lookahead/backtracking buffer; this API does not guarantee constant-memory parsing. Investigate iterator overhead if measured performance issues warrant it.

Proposed token data follows the experiment and Python-style names:

```ts
interface Token {
  type: string; // refine to generated token-name union
  string: string;
  start: [line: number, column: number];
  end: [line: number, column: number];
  line: string;
}
```

The line string supplies upstream-compatible source context; its presence does not require a separately allocated copy per token. Tokens and diagnostics use their own location conventions, not AST column units. Agreed: exported tokenization uses the same structured frontend source-error format as parsing, preserving useful CPython messages and available source positions. Do not reproduce the public Python tokenize wrapper's separate TokenError representation or its loss of diagnostic information. This shared format does not make lexical checking equivalent to parsing, require identical messages from both operations, or classify unexpected implementation failures as source errors. Identify recognized lexical failures explicitly and preserve their appropriate diagnostic kinds.

### Agreed editing requirements and remaining backend adaptation

The pinned CPython backend exposes two materially different streams. Inspection mode includes COMMENT/NL and generic OP tokens. Parser-facing mode supplies exact operator kinds and performs some stricter lexical checks. This is not merely a flag to include extra comments.

Verified with CPython 3.14.3 and StringIO input:

| Source       | Inspection stream                        | Parser-facing stream                             |
| ------------ | ---------------------------------------- | ------------------------------------------------ |
| `x = 123abc` | NUMBER `123`, NAME `abc`                 | SyntaxError: invalid decimal literal             |
| `x=0xZZ`     | SyntaxError: invalid hexadecimal literal | Same error                                       |
| `x = (1 + )` | Produces tokens                          | Produces tokens; parsing must reject the grammar |

The maintainer rejected choosing public inspection semantics solely to reproduce Python's tokenize API. Define the exported token contract from actual IDE requirements while keeping the implementation close to the CPython backend. No public inspection default is currently selected.

Agreed: retain comments, physical/non-significant line boundaries, indent/dedent, significant newlines, original source positions/text and early termination for IDE consumers. These support reindentation and locating classes, methods and decorators for edits. No consumer requirement was found for generic OP classification or permissive malformed-number splitting. Preserve the required editing information without treating the rest of Python's inspection behavior as an automatically required contract. Keep lexical error behavior close to CPython. The maintainer also requested checking whether tokenizer diagnostics give useful messages and locations for beginners. Exact stream mechanics remain to be established; this agreement does not assume that upstream trivia and strictness switches can be separated without adaptation.

Finishing an iterator runs the lexical checks of that stream; it does not validate Python grammar. Stopping early also leaves later lexical errors undiscovered. The earlier discussion's reference to validating the whole source must be understood as completing lexical processing, not a substitute for parsing or symbol-table checks.

## Positions and IDE conversion

Agreed:

| Structure       | Native representation                                             |
| --------------- | ----------------------------------------------------------------- |
| AST locations   | CPython fields, one-based lines and zero-based UTF-8 byte columns |
| Token locations | One-based lines and zero-based Unicode code-point columns         |
| Diagnostics     | Their own upstream fields and conventions, preserved explicitly   |

Provide separate conversion helpers for consumers using UTF-16 positions. Do not require a duplicate set of IDE coordinates on every node or token. Helpers need the source context to which a location applies. Preserve missing locations rather than manufacturing a range. Diagnostics with reconstructed source text require care; their offsets must not blindly be treated as original-source AST spans.

Document units, bases and end-position meaning in generated/public types and helper names. Exact helper names, caching and indexing implementation remain engineering details; this draft does not require eager whole-source position arrays.

## Review status and remaining boundaries

The behavioral agreements above are recorded in the issue's discussion checkpoints. Proposed names and shapes consolidate them for review; they have not yet been approved as final spellings.

The API planning decision is complete. Exported tokenization shares the structured frontend source-error format with parsing. Non-fatal warnings use the optional callback and are silent when it is absent. Remaining implementation and integration work is identified below; it is not claimed complete.

The editing information required from tokens is already agreed. The implementation must establish how to retain it alongside the chosen CPython lexical checks, document any adaptations, and test malformed input. Do not reopen the inspection-default proposal solely to copy Python's public wrapper. If achieving this contract requires a material maintenance or performance tradeoff, bring that evidence back before changing the agreed requirements.

Export names, discriminant spelling, constructor exports, warning field spelling and coordinate-helper internals are implementation choices within the agreed behavior. They do not each require a separate planning decision. Warning filtering in the Skulpt adapter and the supported analysis-context fields need checking against real integration requirements.

Other deliberately separate work includes:

- the complete Python 2 compatibility syntax;
- production symbol-table shape and compiler integration;
- optional visitor/folding helper details and any aggregate constants they expose;
- worker serialization and any WASM initialization boundary;
- concrete rollout/browser acceptance and performance budgets.

The draft does not turn those items into mandatory new infrastructure. Internal representation can be chosen within the structural contract, and optional features need a real consumer before expanding the initial API. No production changes accompany this document.

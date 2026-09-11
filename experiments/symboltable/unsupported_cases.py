"""Check that the experimental boundary is explicit, separate from CPython parity."""

import ast
import json
from oracle import ast_json, OUT, PREFIX

CASES = [
    ("class", "class C:\n pass\n", "Unsupported AST node in experiment: ClassDef"),
    ("async", "async def f():\n pass\n", "Unsupported AST node in experiment: AsyncFunctionDef"),
    ("annotation", "x: int = 1\n", "Unsupported AST node in experiment: AnnAssign"),
    ("list-comp", "x = [y for y in ys]\n", "Unsupported AST node in experiment: ListComp"),
    ("set-comp", "x = {y for y in ys}\n", "Unsupported AST node in experiment: SetComp"),
    ("dict-comp", "x = {y:y for y in ys}\n", "Unsupported AST node in experiment: DictComp"),
    ("return-annotation", "def f() -> int:\n return 1\n", "Unsupported annotations or type parameters in experiment"),
    ("arg-annotation", "def f(x: int):\n return x\n", "Unsupported annotations in experiment"),
    ("type-params", "def f[T](x):\n return x\n", "Unsupported annotations or type parameters in experiment"),
    (
        "async-generator",
        "def f(xs):\n return (x async for x in xs)\n",
        "Unsupported asynchronous comprehension in experiment",
    ),
]
(OUT / "unsupported-corpus.json").write_text(
    json.dumps(
        [
            dict(name=name, ast=ast_json(ast.parse(PREFIX + source)), error=dict(name="Error", message=message))
            for name, source, message in CASES
        ],
        indent=2,
    )
    + "\n"
)

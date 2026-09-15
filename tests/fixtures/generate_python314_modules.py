"""Generate module ASTs/errors with pinned CPython, never the TS parser."""

import ast
import json
from pathlib import Path
import sys
import warnings

from python314_reference import encode

ROOT = Path(__file__).resolve().parents[2]
lock = json.loads((ROOT / "tools/upstream/cpython.json").read_text())
if sys.implementation.name != "cpython" or ".".join(map(str, sys.version_info[:3])) != lock["version"]:
    sys.exit(f'Use CPython {lock["version"]} to refresh these fixtures')

sources = [
    "",
    "\n",
    " \t\n",
    "# comment",
    "# comment\n\n",
    "# coding: utf-8\n",
    "pass",
    "pass\n",
    "pass; pass;",
    "\npass\n\npass\n",
    "pass # comment\n",
    "42",
    "1,2",
    "*xs,",
    '"module docstring"\nx = 1',
    "'\\ud800'",
    "b'\\xff'",
    "x = 1",
    "x = y = value",
    "(x) = value",
    "((x)) = value",
    "x, = values",
    "x,y = values",
    "[x,y] = values",
    "a,(b,[c,*rest]) = values",
    "head,*middle,tail = values",
    "*rest, = values",
    "() = values",
    "[] = values",
    "obj.attr = value",
    "obj[index] = value",
    "obj[start:end:step] = value",
    "factory().attr = value",
    "factory()[index] = value",
    "obj[1,2] = value",
    "factory(x for x in xs).attr = value",
    "a = obj.attr = values",
    "a = b,c = values",
    "a = [b,*rest] = values",
    "a = *values,",
    "résumé, 𝒙 = café, 2",
    "x = (\n  1 +\n  2\n)\ny = x",
    "x = 1\ry = 2\r",
    "x = 1\r\ny = 2\r\n",
    "x = 1; y = x + 1;",
    "x: int",
    "x: int = 1",
    "x: list[int] = []",
    "(x): int",
    "((x)): int = 1",
    "obj.attr: int",
    "obj[index]: int = 1",
    "(obj.attr): int = 1",
    "factory().attr: int = 1",
    "factory()[index]: int",
    "(factory()[index]): int",
    "résumé: str = 'café'",
    'x: "ForwardReference" = None',
    "x: (lambda: int) = 1",
    "x: (int, str) = value",
    "x = 1 # type: int",
    "x = 1 # type: ignore[assignment]",
    "# type: ignore\npass",
    "x: int = 1 # type: str",
    "pass # type: nonsense",
    "x = lambda a,/,b=2,*args,c,**kw: result",
    "x = [a for a in values if a]",
    'x = f"{value=}"\ny = t"{value!r}"',
    # ast.parse does not enforce generator/function/loop scope.
    "x = yield value",
    "x = yield from values",
    "x: int = yield value",
    "x += yield value",
    "yield",
    "yield value",
    "yield from values",
    "yield 1,*values",
    "yield value; pass",
    "return",
    "return value",
    "return 1,*values",
    "return value; pass",
    "raise",
    "raise Error",
    "raise Error('bad') from cause",
    "raise Error from None",
    "assert condition",
    "assert condition, 'message'",
    "assert (a,b)",
    "break",
    "continue",
    "break; continue",
    "global a,b",
    "nonlocal a,b",
    "global K, K",
    "nonlocal a,a",
    "global a; a = 1; nonlocal a",
    "del a",
    "del a,b,",
    "del (a)",
    "del (a,b)",
    "del [a,b]",
    "del ()",
    "del []",
    "del a,(b,[c,d])",
    "del obj.attr, obj[index]",
    "del factory().attr",
    "del factory()[start:end]",
    "del obj[1,2]; pass",
    "del résumé, obj.café",
    # Assignment target validation beyond ast.parse belongs to compilation.
    "*a = values",
    "a,*b,*c = values",
    "x = 1\nx.attr = x\nx[0] += 1\ndel x[0]",
]
for operator in ["+=", "-=", "*=", "@=", "/=", "%=", "&=", "|=", "^=", "<<=", ">>=", "**=", "//="]:
    for target in ["x", "obj.attr", "factory()[index]"]:
        sources.append(f"{target} {operator} value")
sources.extend(["(x) += value", "((obj.attr)) += value", "x += 1,2", "x += *values,", "x = 1and y", "x = '\\q'"])
cases = []
for source in sources:
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        tree = encode(ast.parse(source, mode="exec"))
    cases.append(
        {
            "source": source,
            "tree": tree,
            "warnings": [{"name": w.category.__name__, "message": str(w.message), "lineno": w.lineno} for w in caught],
        }
    )
# Rejection parity only until invalid-rule diagnostic actions are ported.
rejections = []
for source in [
    "x =",
    "x = y =",
    "x +=",
    "1 = x",
    "True = x",
    "f() = x",
    "a+b = x",
    "[x for x in xs] = values",
    "a,b += values",
    "[a] += values",
    "f() += value",
    "a,b: int",
    "[a]: int",
    "f(): int",
    "x:",
    "x: int =",
    "x = y += 1",
    "x = 1;; y = 2",
    ";pass",
    "pass pass",
    "x = 1 y = 2",
    "x = 1\n@",
    "pass\n  x = 1",
    "del",
    "del 1",
    "del a+b",
    "del f()",
    "del *a",
    "del [*a]",
    "global",
    "global a,",
    "nonlocal",
    "nonlocal a.b",
    "assert",
    "raise from cause",
    "return from x",
    "yield from",
    "break 1",
    "continue 1",
]:
    try:
        ast.parse(source, mode="exec")
    except SyntaxError as error:
        rejections.append({"source": source, "errorName": type(error).__name__})
    else:
        raise AssertionError(f"Expected syntax rejection: {source}")
errors = []
for source in [
    "  x = 1",
    "pass\n  x = 1",
    "\tx = 1",
    "\n  x = 1",
    "x = 0b2",
    "x = '\\x'",
    "x = (1]",
    "x = 1\ny = 1__0",
]:
    try:
        ast.parse(source, mode="exec")
    except SyntaxError as error:
        errors.append(
            {
                "source": source,
                "error": {
                    "name": type(error).__name__,
                    "message": error.msg,
                    **{
                        key: getattr(error, key, None)
                        for key in ("lineno", "offset", "end_lineno", "end_offset", "text")
                    },
                },
            }
        )
    else:
        raise AssertionError(f"Expected syntax error: {source}")
# Valid CPython modules outside this migration slice must not be returned as
# successfully parsed prefixes. These are project boundary tests, not parity.
unsupported = ["x = 1\nimport os", "x = 1\ntype Alias = int", "x = 1\nif x:\n    pass", "x = 1\ndef f():\n    pass"]
for source in unsupported:
    ast.parse(source, mode="exec")
fixtures = {
    "unsupported": unsupported,
    "errors": errors,
    "version": lock["version"],
    "cases": cases,
    "rejections": rejections,
}
Path(__file__).with_name("python314-modules.json").write_text(json.dumps(fixtures, indent=4, ensure_ascii=True) + "\n")

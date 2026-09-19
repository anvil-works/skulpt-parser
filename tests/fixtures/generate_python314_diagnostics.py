"""Generate exact parser diagnostics with the pinned CPython interpreter."""

import ast
import json
from pathlib import Path
import sys
import warnings

lock = json.loads((Path(__file__).resolve().parents[2] / "tools/upstream/cpython.json").read_text())
if sys.implementation.name != "cpython" or ".".join(map(str, sys.version_info[:3])) != lock["version"]:
    sys.exit(f'Use CPython {lock["version"]} to refresh diagnostics')

sources = []
for header in [
    "if x",
    "if café",
    "while x",
    "for x in xs",
    "async for x in xs",
    "def f()",
    "async def f()",
    "class C",
    "class C(Base)",
    "with x",
    "async with x",
    "with (a as x,b as y)",
    "if x: pass\nelif y",
    "match x",
    "match x:\n    case _",
]:
    sources.extend((s, "exec") for s in (header, header + ":\n", header + ":\npass"))
for source in [
    "if x: pass\nelse:\n",
    "try: pass\nfinally:\n",
    "try: pass\nexcept E:\n",
    "try: pass\nexcept:\n",
    "try: pass\nexcept* E:\n",
    "if x:\n# comment\n",
    "if (\n x\n):\npass",
    "if x:\n\n",
    "if x: pass\nelse: pass\nelif y: pass",
    "def f: pass",
    "def f(a=1,b): pass",
    "def f(/,): pass",
    "def f(a,/,/): pass",
    "def f((a,b)): pass",
    "def f(*args,a,/): pass",
    "def f(a,/*args): pass",
    "def f(a=): pass",
    "def f(*): pass",
    "def f(*args=1): pass",
    "def f(*a,*b): pass",
    "def f(**kw=1): pass",
    "def f(**kw,x): pass",
    "def f(**kw,**other): pass",
    "def f(résumé=1,𝒙): pass",
    "x = '\\q'\nif x",
    "if x\r\n",
    "if café:\r\npass",
]:
    sources.append((source, "exec"))
for source in [
    "lambda /,: 1",
    "lambda a,/,/: 1",
    "lambda a=1,b: 1",
    "lambda (a,b):1",
    "lambda *args,a,/:1",
    "lambda a,/*args:1",
    "lambda a=:1",
    "lambda *:1",
    "lambda *a=1:1",
    "lambda *a,*b:1",
    "lambda **kw=1:1",
    "lambda **kw,x:1",
    "lambda **kw,**other:1",
    "lambda résumé=1,𝒙:1",
]:
    sources.append((source, "eval"))

cases = []
for source, mode in sources:
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        try:
            ast.parse(source, mode=mode)
        except SyntaxError as error:
            details = {"name": type(error).__name__, "message": error.msg}
            details.update(
                {key: getattr(error, key, None) for key in ("lineno", "offset", "end_lineno", "end_offset", "text")}
            )
        else:
            raise AssertionError(f"Expected CPython rejection: {source}")
    cases.append(
        {
            "source": source,
            "mode": mode,
            "error": details,
            "warnings": [{"name": w.category.__name__, "message": str(w.message), "lineno": w.lineno} for w in caught],
        }
    )
Path(__file__).with_name("python314-diagnostics.json").write_text(
    json.dumps({"version": lock["version"], "cases": cases}, indent=4, ensure_ascii=True) + "\n"
)

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

for target in ["1", "True", "f()", "a+b", "(x for x in xs)", "[x for x in xs]", "{'a':x}", "{x}", "f'{x}'", "t'{x}'"]:
    for source in [
        f"{target} = value",
        f"del {target}",
        f"for {target} in xs: pass",
        f"with resource as {target}: pass",
    ]:
        sources.append((source, "exec"))
for source in [
    "a,(b,1) = values",
    "del [a,(b,f())]",
    "del *a",
    "del [*a]",
    "for a,(b,1) in xs: pass",
    "with resource as [a,1]: pass",
    "def f((\n    a,\n                 b)): pass",
    "a,b: int",
    "[a]: int",
    "f(): int",
    "a,b += values",
    "f() += value",
    "(yield x) = value",
    "(x+1 := value)",
    "if x = 1: pass",
    "if f() = 1: pass",
    "import os as 1",
    "import os as a+b",
    "from os import name as f()",
    "match x:\n    case 1 as _: pass",
    "match x:\n    case 1 as f(): pass",
    "résumé,(𝒙,1) = values",
    "del résumé,(𝒙,f())",
]:
    sources.append((source, "exec"))

# Promote former exception-class-only checks to full CPython diagnostics.
# Only source text comes from these fixtures; expectations are recomputed below.
for family, mode in [("expressions", "eval"), ("modules", "exec")]:
    fixture = json.loads(Path(__file__).with_name(f"python314-{family}.json").read_text())
    sources.extend((item["source"], mode) for item in fixture["rejections"])
for source in [
    "f(a=1,2)",
    "f(**kw,2)",
    "f(**kw,*xs)",
    "f(x for x in xs,)",
    "f(x for x in xs,y)",
    "f(a,x for x in xs)",
    "f(a=)",
    "f(True=1)",
    "f(a+b=1)",
    "f(**x=y)",
    "[a,b for x in xs]",
    "[*x for x in xs]",
    "{**d for x in xs}",
    "{x:*y}",
    "{x:}",
    "{1,2:3}",
    "{1:2, 3}",
    "{1:2, x}",
    "{é:2, x}",
    "x+not y",
    "+not x",
    "(a b)",
    "'hello' name 'world'",
    "x if y",
    "x if y else pass",
    "f'hello' t'world'",
    "t'hello' 'world'",
]:
    sources.append((source, "eval"))
for source in [
    "print x",
    "exec 'x'",
    "import x from y",
    "import",
    "from x import",
    "from x import a,",
    "try: pass",
    "try: pass\nexcept A,B as e: pass",
    "try: pass\nexcept* A,B as e: pass",
    "try: pass\nexcept*: pass",
    "try: pass\nexcept E: pass\nexcept* F: pass",
    "try: pass\nexcept* E: pass\nexcept F: pass",
    "try: pass\nexcept E as f(): pass",
    "type A[*Ts:int] = int",
    "type A[**P:(int,str)] = int",
    "type A[] = int",
    "match x:\n    case Point(a=x,y): pass",
]:
    sources.append((source, "exec"))
for prefix in ["f", "t"]:
    for content in ["{=}", "{!r}", "{:x}", "{}", "{x!}", "{x!1}", "{x! rr}", "{lambda:x}", "{x x}", "{x=foo}"]:
        sources.append((prefix + '"' + content + '"', "eval"))
for source in [
    "(a b",
    "(\na b",
    "x y\n(",
    "x y\n]",
    "f(a=1,2",
    "if x\n(",
    'if x\n"bad',
    "a = (\n x y\n",
    "x y\n  a\n b",
    "x y\n0b2",
    "x y\n\\x",
    "x y\nf'{a}'",
    "x y\nf'{a b}'",
    "(\nif x\n)",
    "résumé = (\n x y\n",
    "if x\n# comment\n]",
]:
    sources.append((source, "exec"))
for prefix in ["f", "t"]:
    for content in ["{x y}", "{x y", "{(x y)}", "{(x y", "{x!1}", "{x if}"]:
        sources.append((prefix + '"' + content + '"', "eval"))

sources = list(dict.fromkeys(sources))

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

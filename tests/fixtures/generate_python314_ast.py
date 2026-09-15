"""Refresh the structural AST fixtures with the pinned reference interpreter."""

import ast
import json
from pathlib import Path
import sys

from python314_reference import encode

ROOT = Path(__file__).resolve().parents[2]
lock = json.loads((ROOT / "tools/upstream/cpython.json").read_text())
if sys.implementation.name != "cpython" or ".".join(map(str, sys.version_info[:3])) != lock["version"]:
    sys.exit(f'Use CPython {lock["version"]} to refresh these fixtures')

SOURCES = [
    "@decorate\ndef f[T: int = int](x: T, /, y=1, *args, z, **kwargs) -> T:\n    return x\n",
    "class C[T](Base, metaclass=M):\n    pass\ntype Alias[T = int] = list[T]\n",
    "try:\n    f()\nexcept* (ValueError, TypeError) as e:\n    raise e from None\n",
    "match value:\n    case {'x': [head, *tail], **rest} if head:\n        pass\n    case C(a, key=b) | C(a, key=b):\n        pass\n    case True:\n        pass\n    case None:\n        pass\n    case _:\n        pass\n",
    'text = t"value: {value!r:>{width}}"\nformatted = f"{value=}"\n',
    "mapping = {**other, 'x': 1}\nitems = [x for x in data if x]\n",
    "import package as p\nfrom .package import name\nasync def f():\n    async with manager() as resource:\n        async for x in resource:\n            await consume(x)\n",
    "small = 42\nbig = 123456789012345678901234567890\nreal = 1.25\nimaginary = 2j\ntext = 'hello'\ndata = b'\\x00\\xff'\nflag = False\nnothing = None\nmissing = ...\n",
]


fixtures = {"version": lock["version"], "cases": [{"source": s, "tree": encode(ast.parse(s))} for s in SOURCES]}
Path(__file__).with_name("python314-ast.json").write_text(json.dumps(fixtures, indent=4, ensure_ascii=True) + "\n")

# These legacy-runtime regressions need the newer reference: CPython 3.9 has
# incorrect multiline f-string locations. Keep the source beside its expected result.
error_source = '"é😀"; f(a + b = 1)'
try:
    ast.parse(error_source, filename="<string>")
except SyntaxError as error:
    diagnostic = {
        "source": error_source,
        "name": type(error).__name__,
        "message": error.msg,
        "location": [error.filename, error.lineno, error.offset],
    }
else:
    raise AssertionError("Expected the reference to reject the invalid keyword argument")

multiline_source = 'x = f"""é\n😀{value}"""\n'
expression = ast.parse(multiline_source).body[0].value.values[1].value
positions = {
    "version": lock["version"],
    "diagnostic": diagnostic,
    "multiline": {"source": multiline_source, "expression": encode(expression)},
}
Path(__file__).with_name("python314-positions.json").write_text(
    json.dumps(positions, indent=4, ensure_ascii=True) + "\n"
)

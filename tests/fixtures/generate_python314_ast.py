"""Refresh the structural AST fixtures with the pinned reference interpreter."""

import ast
import json
from pathlib import Path
import sys

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


def scalar(value):
    if value is None:
        return {"type": "none"}
    if value is Ellipsis:
        return {"type": "ellipsis"}
    if isinstance(value, bool):
        return {"type": "bool", "value": value}
    if isinstance(value, int):
        return {"type": "int", "value": value if abs(value) <= 2**53 - 1 else {"$bigint": str(value)}}
    if isinstance(value, float):
        return {"type": "float", "value": value}
    if isinstance(value, complex):
        return {"type": "complex", "real": value.real, "imag": value.imag}
    if isinstance(value, str):
        return {"type": "str", "value": value}
    if isinstance(value, bytes):
        return {"type": "bytes", "value": {"$bytes": list(value)}}
    raise TypeError(type(value))


def encode(value):
    if isinstance(value, ast.AST):
        result = {"_type": type(value).__name__}
        for field in value._fields:
            item = getattr(value, field)
            if (isinstance(value, (ast.Constant, ast.MatchSingleton)) and field == "value") or (
                isinstance(value, ast.Interpolation) and field == "str"
            ):
                result[field] = scalar(item)
            else:
                result[field] = encode(item)
        for field in value._attributes:
            result[field] = getattr(value, field)
        return result
    if isinstance(value, list):
        return list(map(encode, value))
    return value


fixtures = {"version": lock["version"], "cases": [{"source": s, "tree": encode(ast.parse(s))} for s in SOURCES]}
Path(__file__).with_name("python314-ast.json").write_text(json.dumps(fixtures, indent=4, ensure_ascii=True) + "\n")

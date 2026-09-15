"""Generate end-to-end expression expectations with CPython, never the TS parser."""

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
    "(a\r+b)",
    "(a\r\n+b)",
    "(résumé +\r café)",
    "1and x",
    "1in x",
    "1if x else 2",
    "0x1or x",
    "1.2and x",
    "1jand x",
    "match",
    "case",
    "type",
    "_",
    "42",
    "9007199254740993",
    "0xdead",
    "1.25e-3",
    "2j",
    "None",
    "True",
    "False",
    "...",
    "a + b * c ** -d",
    "a - b - c",
    "2 ** 3 ** 4",
    "-2 ** 2",
    "(-2) ** 2",
    "a if b else c if d else e",
    "a and b and c or not d",
    "a < b <= c != d is not e not in f",
    "résumé + café * 2",
    "𝒙 + K",
    "a\u0301 + 𝛂",
    "(résumé +\n café)",
    "a + \\\n b",
    "a # a comment\n",
    "a\r\n",
    "((a))",
    "()",
    "(a,)",
    "a,b,c",
    "[a, b, *c]",
    "[]",
    "{}",
    "{a}",
    "{a,b,*c}",
    "{a: b, **c}",
    "obj.attr.other",
    "obj[1:2:3]",
    "obj[:end]",
    "obj[start:]",
    "obj[::]",
    "obj[a, b:c]",
    "obj[*indices]",
    "(value := 42)",
    "(value := a + b)",
    "await obj.attr",
    "(a, *b)",
]
for op in [
    "+",
    "-",
    "*",
    "/",
    "//",
    "%",
    "@",
    "**",
    "<<",
    ">>",
    "|",
    "^",
    "&",
    "==",
    "!=",
    "<",
    "<=",
    ">",
    ">=",
    "is",
    "is not",
    "in",
    "not in",
    "and",
    "or",
]:
    sources.extend([f"a {op} b", f"(a {op} b) {op} c", f"a {op} (b {op} c)"])
cases = []
for source in sources:
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        tree = encode(ast.parse(source, mode="eval"))
    cases.append(
        {
            "source": source,
            "tree": tree,
            "warnings": [{"name": w.category.__name__, "message": str(w.message), "lineno": w.lineno} for w in caught],
        }
    )
errors = []
for source in ["0b2", "0o9", "0x_", "1__0", "0123", "1e+", "1abc", "a + $", "(a]", "a\u200b", "9" * 4301]:
    try:
        ast.parse(source, mode="eval")
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
fixtures = {"version": lock["version"], "cases": cases, "errors": errors}
Path(__file__).with_name("python314-expressions.json").write_text(
    json.dumps(fixtures, indent=4, ensure_ascii=True) + "\n"
)

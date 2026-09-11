"""Generate a deterministic differential corpus against CPython 3.14.3.

Usage: python3.14 generate_fuzz.py > fuzz.json
"""
import _tokenize
import io
import token
import json
import random
import sys

if sys.version_info[:3] != (3, 14, 3):
    raise SystemExit("Generate with CPython 3.14.3")
r = random.Random(419)
atoms = [
    "x",
    "f",
    "0",
    "00",
    "0x",
    "0o",
    "0b",
    "1e",
    "1e+",
    "1_",
    "+",
    "!",
    "!=",
    "(",
    ")",
    "[",
    "]",
    "{",
    "}",
    ":",
    "=",
    ";",
    ",",
    "\n",
    "\r",
    "\t",
    " ",
    "\\",
    "'",
    '"',
    'f"',
    't"',
    'rf"',
    '"""',
    "# comment",
    "π",
    "😀",
    "\u00a0",
    "\u200b",
]
cases = []
for i in range(4000):
    s = "".join(r.choices(atoms, k=r.randrange(1, 20)))
    c = {"name": str(i), "source": s}
    for mode in ["extra", "strict"]:
        try:
            c[mode] = {
                "tokens": [
                    dict(type=token.tok_name[t[0]], string=t[1], start=t[2], end=t[3], line=t[4])
                    for t in _tokenize.TokenizerIter(io.StringIO(s).readline, extra_tokens=mode == "extra")
                ]
            }
        except Exception as e:
            c[mode] = {
                "error": {
                    k: getattr(e, k, None) if k != "message" else getattr(e, "msg", str(e))
                    for k in ["name", "message", "lineno", "offset", "end_lineno", "end_offset", "text"]
                }
            }
            c[mode]["error"]["name"] = type(e).__name__
    cases.append(c)
json.dump(cases, sys.stdout)

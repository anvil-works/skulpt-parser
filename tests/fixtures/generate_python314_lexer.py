"""Generate source-string token/error/warning fixtures from CPython's internal lexer."""

import _tokenize
import io
import json
from pathlib import Path
import random
import sys
import token
import warnings

ROOT = Path(__file__).resolve().parents[2]
lock = json.loads((ROOT / "tools/upstream/cpython.json").read_text())
if sys.implementation.name != "cpython" or ".".join(map(str, sys.version_info[:3])) != lock["version"]:
    sys.exit(f'Use CPython {lock["version"]} to refresh these fixtures')


def oracle(source, extra):
    result = {}
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        try:
            result["tokens"] = [
                dict(type=token.tok_name[t[0]], string=t[1], start=t[2], end=t[3], line=t[4])
                for t in _tokenize.TokenizerIter(io.StringIO(source).readline, extra_tokens=extra)
            ]
        except (SyntaxError, ValueError) as error:
            result["error"] = {
                "name": type(error).__name__,
                "message": getattr(error, "msg", str(error)),
                **{key: getattr(error, key, None) for key in ("lineno", "offset", "end_lineno", "end_offset", "text")},
            }
        result["warnings"] = [dict(name=w.category.__name__, message=str(w.message), lineno=w.lineno) for w in caught]
    return result


sources = [
    "",
    "\n",
    "# comment",
    "x = 42",
    "é = 𝒙 + 1\n",
    "a\u0301 = K\n",
    "x = 0x_dead + .25e-2j\n",
    'def f(x):\n    return f"value {x!r:>10}"\n',
    'if x:\n\tfoo(α, 0xff, "hello")\nelse:\n\tpass\n',
    'x = t"{name = } {value:{width}.{precision}}"\n',
    "x = [1, 2,\n # comment\n 3]\n",
    'f"{x # comment\n}"',
    "f\"{f'{x}'}\"",
    't"é{x!r}"',
    'f"{{text}}{x=}"',
    'fr"\\{x}"',
    'f"\\{x}"',
    't"\\{x}"',
    'f"\\q{x}"',
    '"\\q"',
    "1and x",
    "1in x",
    "1if x else 2",
    "0x1or x",
    "1.2and x",
    "1jand x",
    "0b2",
    "0o9",
    "0x_",
    "1__0",
    "0123",
    "1e+",
    "1abc",
    "x = $",
    "x = (]",
    "x = (",
    "x = \\x",
    '"unterminated',
    "x=\x00",
    "x=\u200b",
    "x=\ud800",
    'x="\ud800"',
    "if x:\n    a\n  b\n",
    "if x:\n\ta\n        b\n",
    "x\r\ny\r\n",
    "x\ry\r",
    "(" * 201,
]
# Token spelling and UTF-8 positions on both sides of the short-ASCII path.
sources.extend("a" * size + " = 1\n" + "b" * (size - 2) + "é = '𝒙'\n" for size in [7, 8, 9])
rng = random.Random(3143)
seeds = sources[7:11]
for _ in range(100):
    source = rng.choice(seeds)
    start = rng.randrange(len(source) + 1)
    end = min(len(source), start + rng.randrange(5))
    sources.append(
        source[:start]
        + rng.choice(["", "\n", "\r", "\x00", "\\", '"', "'", "}", "{", "\t", "é", "#", "!", "\f", "\u200b"])
        + source[end:]
    )
sources.extend(["x <> y", "from __future__ import barry_as_FLUFL\nx <> y"])
fixtures = {
    "version": lock["version"],
    "cases": [
        {"source": source, "extra": extra, "expected": oracle(source, extra)}
        for source in dict.fromkeys(sources)
        for extra in (True, False)
    ],
}
Path(__file__).with_name("python314-lexer.json").write_text(json.dumps(fixtures, indent=4, ensure_ascii=True) + "\n")

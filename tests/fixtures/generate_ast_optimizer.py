"""Generate literal-folding values with the pinned CPython interpreter."""

import json
from pathlib import Path
import struct
import sys

from python314_reference import scalar

ROOT = Path(__file__).resolve().parents[2]
lock = json.loads((ROOT / "tools/upstream/cpython.json").read_text())
if sys.implementation.name != "cpython" or ".".join(map(str, sys.version_info[:3])) != lock["version"]:
    sys.exit(f'Use CPython {lock["version"]} to refresh these fixtures')


def value(item):
    if isinstance(item, tuple):
        return {"type": "tuple", "items": list(map(value, item))}
    encoded = scalar(item)
    if isinstance(item, float):
        encoded = {"type": "float", "bits": struct.pack(">d", item).hex()}
    if isinstance(item, complex):
        encoded = {
            "type": "complex",
            "real": struct.pack(">d", item.real).hex(),
            "imag": struct.pack(">d", item.imag).hex(),
        }
    return encoded


sources = [
    "1 + 2 * 3",
    "(\n  1 +\n  2 * 3\n)",
    "9007199254740993 + 2",
    "2 ** 64",
    "0 ** 0",
    "1 << 100",
    "(-1) >> 100",
    "+True",
    "-False",
    "~42",
    "-0.0",
    "+1e999",
    "-1e999",
    "-2j",
    "-0j",
    "1 + 2j",
    "2j + 1",
    "1 - 2j",
    "2j - 1",
    "(1 + 2j) + (3 - 4j)",
    "(-0.0) + (-0j)",
    "(-0j) - (-0.0)",
    "True & False",
    "True | False",
    "True ^ True",
    "True + True",
    "True / True",
    "not None",
    "not False",
    "not 0",
    "not 2j",
    "not ''",
    "not b'x'",
    "'abc' + 'def'",
    "b'abc' + b'\\xff'",
    "'ab' * 3",
    "3 * 'ab'",
    "'x' * -3",
    "b'ab' * 3",
    "3 * b'ab'",
    "b'x' * False",
    "'' * 1000000",
    "() * 1000000",
    "(1, 'x') + (True, None)",
    "(1, (2, 3)) * 2",
    "2 * (1, (2, 3))",
    "(1, 2) * -3",
    "(1 + 2, 'x' * 2)[0]",
    "(1, (2, 3))[-1]",
    "'雪é'[0]",
    "'雪é'[-1]",
    "'abc'[True]",
    "'\\ud800x'[0]",
    "b'\\xffx'[0]",
    "b'abc'[-1]",
]
for left, right in [(7, 3), (-7, 3), (7, -3), (-7, -3), (0, 3)]:
    sources.extend(f"({left}) {op} ({right})" for op in ["+", "-", "*", "/", "//", "%", "&", "|", "^"])
for left, right in [(1.0, 0.1), (-7.5, 2.0), (7.5, -2.0), (-0.0, 2.0), (0.0, -2.0), (7.0, 2)]:
    sources.extend(f"({left!r}) {op} ({right!r})" for op in ["+", "-", "*", "/", "//", "%"])
for left in ["0.0", "-0.0", "0j", "-0j"]:
    for right in ["0j", "-0j"]:
        sources.extend(f"({left}) {op} ({right})" for op in ["+", "-"])

fixtures = {
    "version": lock["version"],
    "cases": [{"source": source, "expected": value(eval(source, {"__builtins__": {}}))} for source in sources],
}
Path(__file__).with_name("ast-optimizer.json").write_text(json.dumps(fixtures, indent=4) + "\n")

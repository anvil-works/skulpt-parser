"""Pinned CPython oracle; module sources and deterministic malformed edits."""

import json
import sys
import sysconfig
import random
from pathlib import Path

from oracle import oracle

assert sys.version_info[:3] == (3, 14, 3), "Use pinned CPython 3.14.3"
lib = Path(sysconfig.get_path("stdlib"))
cases = []
for p in sorted(lib.glob("*.py"))[::3]:
    cases.append((f"stdlib/{p.name}", p.read_text(), "stdlib"))
rng = random.Random(3143)
seeds = [
    'def f(x):\n    return f"value {x!r:>10}"\n',
    'if x:\n\tfoo(α, 0xff, "hello")\nelse:\n\tpass\n',
    'x = t"{name = } {value:{width}.{precision}}"\n',
    "x = [1, 2,\n # comment\n 3]\n",
]
for i in range(500):
    s = rng.choice(seeds)
    a = rng.randrange(len(s) + 1)
    b = min(len(s), a + rng.randrange(5))
    s = (
        s[:a]
        + rng.choice(["", "\n", "\r", "\x00", "\\", '"', "'", "}", "{", "\t", "🫩", "é", "#", "!", "\f", "\u200b"])
        + s[b:]
    )
    cases.append((f"edit/{i}", s, "mutated"))
for i, s in enumerate(
    [
        "(" * 201,
        "if x:\n" + "    if x:\n" * 101,
        "\ud800=1",
        'x="\ud800"',
        "x=\U00001c89",
        "x=\U0001e6c0",
        'x="\\q"',
        'f"\\q{x}"',
        't"\\q{x}"',
    ]
):
    cases.append((f"limits/{i}", s, "limits"))
with Path(sys.argv[1]).open("w") as out:
    for name, source, group in cases:
        try:
            c = dict(name=name, source=source, group=group, extra=oracle(source, True), strict=oracle(source, False))
        except UnicodeError:
            continue
        out.write(json.dumps(c, ensure_ascii=True, separators=(",", ":")) + "\n")
print(json.dumps(dict(python=sys.version, cases=len(cases))))

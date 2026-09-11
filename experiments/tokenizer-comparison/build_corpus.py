"""Build reproducible source-string cases; upstream test code is never executed."""

import ast
import json
from pathlib import Path
import sys
from oracle import oracle

assert sys.version_info[:3] == (3, 14, 3), "Use pinned CPython 3.14.3"
out = Path(__file__).resolve().parent
project = Path(sys.argv[1])
upstream = Path(sys.argv[2])
cases = []
seen = set()


def add(name, source, group):
    if source in seen:
        return
    seen.add(source)
    cases.append({"name": name, "group": group, "source": source})


for p in sorted((project / "run-tests").glob("*.py")):
    try:
        s = p.read_text()
    except UnicodeError:
        continue
    add("project/" + p.name, s, "project")
root = ast.parse(upstream.read_text())
for node in ast.walk(root):
    if (
        isinstance(node, ast.Call)
        and isinstance(node.func, ast.Attribute)
        and node.func.attr in {"check_tokenize", "check_roundtrip"}
        and node.args
    ):
        try:
            s = ast.literal_eval(node.args[0])
        except (ValueError, TypeError):
            continue
        if isinstance(s, str):
            add(f"cpython-test-tokenize/line-{node.lineno}", s, "upstream")
for case in json.loads((out / "interpolation-seeds.json").read_text()):
    add("interpolation/" + case["name"], case["source"], "interpolation")
adversarial = [
    "",
    "\n",
    "\n\n",
    "# comment",
    "# comment\n",
    "  # comment\n",
    "x=1",
    "x=1\n",
    "x=1\r\ny=2\r\n",
    "x=1\ry=2\r",
    "\ufeffx=1\n",
    "x=\x00\n",
    "if x:\n\tpass\n        pass\n",
    "if x:\n  pass\n pass\n",
    "if x:\n \tpass\n\t pass\n",
    "if x:\n\f    pass\n",
    "x = (1,\n #comment\n2)\n",
    "x = 1 + \\\n2\n",
    "x = 1 + \\ \n2\n",
    "x=0xZZ",
    "x=0b102",
    "x=0o789",
    "x=0123",
    "x=00_0",
    "x=1__0",
    "x=1_",
    "x=1e+",
    "x=0x",
    "x=0b_1",
    "x=3.14j",
    "x=0x1j",
    "x=123abc",
    "x=.5e2",
    "x=1...2",
    "x=1and True",
    "'unterminated",
    "'''unterminated",
    '"a\nb"',
    'r"abc\\"',
    'b"é"',
    'b"\\u1234"',
    'f"{x!z}"',
    'f"{}"',
    'f"{x:}"',
    'f"{x:{w}}"',
    't"{x = }"',
    'f"{x # comment\n}"',
    'f"{{{x}}}"',
    "([)]",
    "(\n x\n",
    "]",
    "x = \\",
    "x=1\x0b+2",
    "𐐀 = π + 变量\n",
    "x\u200b=1",
    "x=😀",
    "K=1\n",
    "\u0301x=2\n",
    "async def f():\n    async for x in xs:\n        yield x\n",
]
for i, s in enumerate(adversarial):
    add(f"adversarial/{i}", s, "adversarial")

for case in cases:
    case["extra"] = oracle(case["source"], True)
    case["strict"] = oracle(case["source"], False)
(out / "corpus.json").write_text(json.dumps(cases, ensure_ascii=True, indent=2) + "\n")
summary = {
    "python": sys.version,
    "cases": len(cases),
    "groups": {g: sum(c["group"] == g for c in cases) for g in sorted({c["group"] for c in cases})},
}
(out / "corpus-summary.json").write_text(json.dumps(summary, indent=2) + "\n")
print(json.dumps(summary))

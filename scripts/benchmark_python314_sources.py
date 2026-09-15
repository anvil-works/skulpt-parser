"""Add shared-syntax benchmark workloads with live CPython AST expectations."""

import ast
import json
from pathlib import Path
import sys
import warnings

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tests/fixtures"))
from python314_reference import encode  # noqa: E402

sources = [
    (
        "synthetic-editor-module",
        "\n".join(
            f"def handler_{i}(rows, limit=10):\n"
            '    filtered = [row for row in rows if row["active"]]\n'
            '    return {"items": filtered[:limit], "count": len(filtered)}\n'
            for i in range(20)
        ),
    ),
    ("synthetic-long-line", "values = [" + ",".join(map(str, range(1000))) + "]\n"),
    ("synthetic-unicode", "\n".join(f"résumé_{i} = '日本語'\n𝒙_{i} = résumé_{i}" for i in range(100))),
]
if len(sys.argv) > 1:
    root = Path(sys.argv[1])
    for name in ["json/decoder.py", "contextlib.py", "collections/__init__.py", "unittest/case.py"]:
        sources.append(("legacy-stdlib/" + name, (root / name).read_text(encoding="utf8")))

cases = []
for name, source in sources:
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        tree = encode(ast.parse(source))
    cases.append(
        {
            "name": name,
            "source": source,
            "tree": tree,
            "warnings": [{"name": w.category.__name__, "message": str(w.message), "lineno": w.lineno} for w in caught],
        }
    )
print(json.dumps(cases, ensure_ascii=True, allow_nan=False))

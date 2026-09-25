"""Emit live CPython expectations for the retained source corpus and stdlib files."""

import ast
import json
from pathlib import Path
import sys
import sysconfig
import warnings

from python314_reference import encode

lock = json.loads((Path(__file__).resolve().parents[2] / "tools/upstream/cpython.json").read_text())
if sys.implementation.name != "cpython" or ".".join(map(str, sys.version_info[:3])) != lock["version"]:
    sys.exit(f'Use CPython {lock["version"]} for the corpus check')
stdlib = Path(sysconfig.get_path("stdlib"))
records = []
stdlib_names = [
    "ast.py",
    "dataclasses.py",
    "enum.py",
    "typing.py",
    "contextlib.py",
    "inspect.py",
    "pathlib/__init__.py",
    "asyncio/tasks.py",
    "json/decoder.py",
    "unittest/mock.py",
]
corpus = Path(__file__).resolve().parents[1] / "corpus"
sources = [("corpus/" + path.name, path) for path in sorted(corpus.glob("*.py"))]
if not sources:
    sys.exit("The retained parser source corpus is missing")
sources.extend(("stdlib/" + name, stdlib / name) for name in stdlib_names)
for name, path in sources:
    source = path.read_text(encoding="utf8")
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        tree = encode(ast.parse(source))
    records.append(
        {
            "name": name,
            "source": source,
            "tree": tree,
            "warnings": [{"name": w.category.__name__, "message": str(w.message), "lineno": w.lineno} for w in caught],
        }
    )
print(json.dumps(records, ensure_ascii=True, allow_nan=False))

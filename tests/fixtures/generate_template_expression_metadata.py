"""Generate post-3.14.3 template metadata with the pinned CPython checkout.

Run using that checkout's interpreter, passing the checkout directory:
    /path/to/cpython/python.exe tests/fixtures/generate_template_expression_metadata.py /path/to/cpython
"""

import ast
import json
from pathlib import Path
import subprocess
import sys

from python314_reference import encode

REVISION = "18ef0f0cb5278fa6583b753ffaaef7f46e416ab9"
ROOT = Path(__file__).resolve().parent
cpython = Path(sys.argv[1])
assert subprocess.check_output(["git", "-C", str(cpython), "rev-parse", "HEAD"], text=True).strip() == REVISION
assert sys.implementation.name == "cpython" and sys.version_info[:2] == (3, 14)
source = (cpython / "Lib/test/test_tstring.py").read_text()
methods = {"test_debug_specifier", "test_interpolation_expression_whitespace"}
cases = []
for method in ast.walk(ast.parse(source)):
    if isinstance(method, ast.FunctionDef) and method.name in methods:
        for node in ast.walk(method):
            if isinstance(node, ast.TemplateStr):
                text = ast.get_source_segment(source, node)
                if text not in [case["source"] for case in cases]:
                    cases.append({"source": text, "tree": encode(ast.parse(text, mode="eval"))})
reference = f"CPython 3.14 {REVISION}"
(ROOT / "template-expression-metadata.json").write_text(
    json.dumps({"reference": reference + " Lib/test/test_tstring.py", "cases": cases}, indent=4) + "\n"
)


# Retain the baseline AST oracle, updating only the corrected metadata field.
def update_metadata(old, new):
    if isinstance(old, list):
        for left, right in zip(old, new):
            update_metadata(left, right)
    elif isinstance(old, dict):
        if old.get("_type") == "Interpolation":
            old["str"] = new["str"]
        for key, value in old.items():
            if key != "str":
                update_metadata(value, new[key])


path = ROOT / "python314-expressions.json"
data = json.loads(path.read_text())
for case in data["cases"]:
    if "TemplateStr" in str(case["tree"]):
        update_metadata(case["tree"], encode(ast.parse(case["source"], mode="eval")))
data["templateMetadataReference"] = reference
path.write_text(json.dumps(data, ensure_ascii=True, indent=4) + "\n")

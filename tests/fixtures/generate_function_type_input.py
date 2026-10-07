"""Function-type input sources from the complete CPython test_type_comments method."""
import ast
import json
from pathlib import Path
from python314_reference import encode

CPYTHON = Path(__file__).resolve().parents[2].parent / "cpython"
source = (CPYTHON / "Lib/test/test_type_comments.py").read_text()
method = next(
    node
    for node in ast.walk(ast.parse(source))
    if isinstance(node, ast.FunctionDef) and node.name == "test_func_type_input"
)
cases = []
for call in ast.walk(method):
    if isinstance(call, ast.Call) and isinstance(call.func, ast.Name) and call.func.id == "parse_func_type_input":
        text = call.args[0].value
        try:
            cases.append({"source": text, "tree": encode(ast.parse(text, mode="func_type"))})
        except SyntaxError:
            cases.append({"source": text, "invalid": True})
Path(__file__).with_name("function-type-input.json").write_text(
    json.dumps({"reference": "CPython 18ef0f0cb52 Lib/test/test_type_comments.py", "cases": cases}, indent=4) + "\n"
)

"""Capture complete CPython test_ast feature-version methods as parser fixtures."""
import ast
import json
from pathlib import Path
import unittest
import warnings
from python314_reference import encode
from test.test_ast.test_ast import AST_Tests

METHODS = [
    "test_positional_only_feature_version",
    "test_assignment_expression_feature_version",
    "test_pep750_tstring",
    "test_pep758_except_without_parens",
    "test_pep758_except_with_single_expr",
    "test_pep758_except_star_without_parens",
    "test_conditional_context_managers_parse_with_low_feature_version",
    "test_exception_groups_feature_version",
    "test_type_params_feature_version",
    "test_type_params_default_feature_version",
]
cases = []
original = ast.parse


def capture(source, *args, **kwargs):
    version = kwargs.get("feature_version")
    if isinstance(version, tuple):
        version = version[1]
    case = {"source": source, "featureVersion": version}
    try:
        with warnings.catch_warnings(record=True) as emitted:
            warnings.simplefilter("always")
            tree = original(source, *args, **kwargs)
        if emitted:
            case["warnings"] = [
                {
                    "name": warning.category.__name__,
                    "message": str(warning.message),
                    "filename": warning.filename,
                    "lineno": warning.lineno,
                }
                for warning in emitted
            ]
        case["tree"] = encode(tree)
        return tree
    except SyntaxError as error:
        case["error"] = {
            "name": type(error).__name__,
            "message": error.msg,
            "lineno": error.lineno,
            "offset": error.offset,
            "end_lineno": error.end_lineno,
            "end_offset": error.end_offset,
            "text": error.text,
        }
        raise
    finally:
        if case not in cases:
            cases.append(case)


ast.parse = capture
try:
    result = unittest.TextTestRunner().run(unittest.TestSuite(AST_Tests(name) for name in METHODS))
    if not result.wasSuccessful():
        raise SystemExit(1)
    for source, version in [
        ("async def f():\n pass", 4),
        ("async def f():\n pass\n", 4),
        ('async def f():\n "à漢"', 4),
        ('async def f():\n "à漢"\n', 4),
        ("def f[T](): pass", -1),
        ("def f[T](): pass", -2),
        ("42_42_42", 5),
        ("42_42_42", 6),
        (r"'\q'", 11),
        (r"'\q'", 12),
    ]:
        try:
            capture(source, feature_version=version)
        except SyntaxError:
            pass
finally:
    ast.parse = original
Path(__file__).with_name("feature-version.json").write_text(
    json.dumps(
        {"reference": "CPython 18ef0f0cb52 Lib/test/test_ast/test_ast.py", "methods": METHODS, "cases": cases},
        indent=4,
    )
    + "\n"
)

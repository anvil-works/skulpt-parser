"""Generate AST inputs and public symtable reference outputs with pinned Python."""

import ast
import json
from pathlib import Path
import symtable
import sys
from cases import CASES, BENCHMARKS

assert sys.version_info[:3] == (3, 14, 3), "Use CPython 3.14.3"
OUT = Path(__file__).resolve().parent
PREFIX = "from __future__ import annotations\n"


def ast_json(node):
    if isinstance(node, ast.AST):
        result = {"_type": type(node).__name__}
        result.update({key: ast_json(value) for key, value in ast.iter_fields(node)})
        for name in ("lineno", "col_offset", "end_lineno", "end_col_offset"):
            if hasattr(node, name):
                result[name] = getattr(node, name)
        return result
    if isinstance(node, list):
        return [ast_json(value) for value in node]
    return node


def scope(table):
    symbols = []
    for symbol in table.get_symbols():
        symbols.append(
            dict(
                name=symbol.get_name(),
                **{
                    field: getattr(symbol, "is_" + field)()
                    for field in [
                        "local",
                        "global",
                        "free",
                        "parameter",
                        "referenced",
                        "assigned",
                        "imported",
                        "nonlocal",
                        "declared_global",
                    ]
                }
            )
        )
    return dict(
        name=table.get_name(),
        type=table.get_type().value,
        lineno=table.get_lineno(),
        symbols=sorted(symbols, key=lambda s: s["name"]),
        children=[scope(c) for c in table.get_children()],
    )


def case(name, fragment):
    source = PREFIX + fragment
    result = dict(name=name, source=source, ast=ast_json(ast.parse(source)))
    try:
        result["expected"] = scope(symtable.symtable(source, "<string>", "exec"))
    except SyntaxError as error:
        result["error"] = dict(name="SyntaxError", message=error.msg)
    return result


if __name__ == "__main__":
    (OUT / "corpus.json").write_text(
        json.dumps([case(n, s) for n, s in CASES.items()], ensure_ascii=True, indent=2) + "\n"
    )
    (OUT / "benchmark-inputs.json").write_text(
        json.dumps([case(n, s) for n, s in BENCHMARKS.items()], ensure_ascii=True, separators=(",", ":")) + "\n"
    )
    print(json.dumps({"python": sys.version, "cases": len(CASES), "benchmarks": len(BENCHMARKS)}))

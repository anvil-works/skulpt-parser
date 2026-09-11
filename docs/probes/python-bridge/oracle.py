"""Throwaway CPython comparison oracle; no user code is executed."""

import ast
import json
import resource
import symtable
import sys


def scope_dump(scope):
    return {
        "type": str(scope.get_type()),
        "name": scope.get_name(),
        "symbols": [
            {
                "name": name,
                "local": scope.lookup(name).is_local(),
                "global": scope.lookup(name).is_global(),
                "free": scope.lookup(name).is_free(),
            }
            for name in scope.get_identifiers()
        ],
        "children": [scope_dump(child) for child in scope.get_children()],
    }


def handle(request):
    if request.get("op") == "meta":
        rss = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        return {
            "python": sys.version,
            "max_rss_bytes": rss if sys.platform == "darwin" else rss * 1024,
        }
    source = request["source"]
    try:
        tree = ast.parse(source, filename="<probe>")
        scopes = symtable.symtable(source, "<probe>", "exec")
        return {
            "ast": ast.dump(tree, include_attributes=True),
            "scope": scope_dump(scopes),
        }
    except SyntaxError as exc:
        return {
            "error": type(exc).__name__,
            "message": exc.msg,
            "lineno": exc.lineno,
            "offset": exc.offset,
            "end_lineno": exc.end_lineno,
            "end_offset": exc.end_offset,
        }


def handle_json(request):
    value = json.loads(request)
    answer = (
        [handle(item) for item in value] if isinstance(value, list) else handle(value)
    )
    return json.dumps(answer, ensure_ascii=True, separators=(",", ":"))


if __name__ == "__main__":
    for line in sys.stdin:
        print(handle_json(line), flush=True)

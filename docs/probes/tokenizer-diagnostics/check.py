"""Compare diagnostic paths with CPython 3.14.3; print observations as JSON."""

import _tokenize
import ast
import io
import json
import tokenize

cases = {
    "missing quote": 'name = "Alice\n',
    "missing triple quote": 'text = """hello\nworld\n',
    "unclosed bracket": "items = [1, 2\n",
    "mismatched bracket": "items = [1, 2)\n",
    "extra bracket": "print(1))\n",
    "bad decimal": "age = 12years\n",
    "leading zero": "count = 0755\n",
    "bad hex": "color = 0xZZ\n",
    "bad continuation": "total = 1 \\  + 2\n",
    "bad dedent": "if True:\n    x = 1\n  y = 2\n",
    "missing indent": "if True:\nprint(1)\n",
    "unexpected indent": "  x = 1\n",
    "missing colon": "if True\n    print(1)\n",
    "bad f-string": 'text = f"{name"\n',
    "empty f-string expression": 'text = f"{}"\n',
    "invalid character": "x = 1 € 2\n",
    "nonbreaking space": "x\u00a0= 1\n",
    "grammar error": "x = (1 + )\n",
}
results = []
for label, source in cases.items():
    row = {"case": label, "source": source, "results": {}}
    for name, run in {
        "inspection": lambda: list(_tokenize.TokenizerIter(io.StringIO(source).readline, extra_tokens=True)),
        "strict": lambda: list(_tokenize.TokenizerIter(io.StringIO(source).readline, extra_tokens=False)),
        "public tokenize": lambda: list(tokenize.generate_tokens(io.StringIO(source).readline)),
        "parse": lambda: ast.parse(source, filename="example.py"),
    }.items():
        try:
            run()
            result = {"ok": True}
        except Exception as exc:
            result = {"type": type(exc).__name__, "message": getattr(exc, "msg", str(exc)), "args": exc.args}
            for field in ("lineno", "offset", "end_lineno", "end_offset", "text"):
                if hasattr(exc, field):
                    result[field] = getattr(exc, field)
        row["results"][name] = result
    results.append(row)
print(json.dumps(results, indent=2, ensure_ascii=False))

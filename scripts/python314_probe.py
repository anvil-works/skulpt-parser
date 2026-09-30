"""Read source cases on stdin and return pinned CPython AST/diagnostic records."""
import ast
import json
import io
from pathlib import Path
import sys
import tokenize
import warnings

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tests/fixtures"))
from python314_reference import encode  # noqa: E402

lock = json.loads((Path(__file__).resolve().parents[1] / "tools/upstream/cpython.json").read_text())
assert sys.implementation.name == "cpython" and ".".join(map(str, sys.version_info[:3])) == lock["version"]

records = []
for item in json.load(sys.stdin):
    if "--tokens" in sys.argv:
        lines = item["source"].splitlines(keepends=True)
        starts = [0]
        for line in lines:
            starts.append(starts[-1] + len(line))
        tokens = []
        for token in tokenize.generate_tokens(io.StringIO(item["source"]).readline):
            if token.type in [tokenize.ENDMARKER, tokenize.INDENT, tokenize.DEDENT, tokenize.NL, tokenize.NEWLINE]:
                continue
            tokens.append([starts[token.start[0] - 1] + token.start[1], starts[token.end[0] - 1] + token.end[1]])
        records.append({**item, "tokens": tokens})
        continue
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        try:
            # Keep CPython's normal parsing limit. Raise only the serialization
            # limit after parsing, so encoding cannot masquerade as a parser bug.
            sys.setrecursionlimit(1000)
            tree = ast.parse(item["source"])
            sys.setrecursionlimit(100000)
            result = {"tree": encode(tree)}
        except SyntaxError as error:
            result = {"error": {"name": type(error).__name__, "message": error.msg}}
            for key in ["lineno", "offset", "end_lineno", "end_offset", "text"]:
                result["error"][key] = getattr(error, key, None)
        except (RecursionError, ValueError) as error:
            result = {"referenceFailure": str(error)}
        result["warnings"] = [
            {"name": warning.category.__name__, "message": str(warning.message), "lineno": warning.lineno}
            for warning in caught
        ]
        records.append({**item, **result})
sys.setrecursionlimit(100000)
print(json.dumps(records, ensure_ascii=True, allow_nan=False))

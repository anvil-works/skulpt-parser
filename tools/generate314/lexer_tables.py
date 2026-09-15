"""Generate non-ASCII lexical properties with the pinned CPython oracle."""

import json
import sys
import token
import unicodedata
from pathlib import Path


def ranges(predicate):
    result = []
    start = None
    for value in range(128, 0x110000):
        accepted = predicate(chr(value))
        if accepted and start is None:
            start = value
        elif not accepted and start is not None:
            result.extend((start, value - 1))
            start = None
    if start is not None:
        result.extend((start, 0x10FFFF))
    return result


if sys.implementation.name != "cpython" or sys.version_info[:3] != (3, 14, 3):
    raise SystemExit("Generate with CPython 3.14.3")
target = Path(__file__).resolve().parents[2] / "src/python314/lexer"
properties = {
    "unicodeVersion": unicodedata.unidata_version,
    "start": ranges(str.isidentifier),
    "continue": ranges(lambda ch: ("a" + ch).isidentifier()),
    "printable": ranges(str.isprintable),
}
(target / "unicode.json").write_text(json.dumps(properties) + "\n")

(target / "operators.json").write_text(
    json.dumps({text: token.tok_name[value] for text, value in token.EXACT_TOKEN_TYPES.items()}, indent=2) + "\n"
)

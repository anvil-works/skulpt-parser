"""Generate a compact Unicode 16 name lookup from CPython 3.14.3.

Hexadecimal algorithmic names are stored as ranges. Other names are sorted,
front-coded in blocks of 32, and decoded one block at a time by the consumer.
Aliases are taken from the vendored Unicode file and verified by CPython lookup.
Named sequences are deliberately excluded: Python string escapes reject them.
"""

import hashlib
import json
from pathlib import Path
import sys
import unicodedata

if sys.implementation.name != "cpython" or sys.version_info[:3] != (3, 14, 3):
    raise SystemExit("Generate with CPython 3.14.3")
root = Path(__file__).resolve().parents[2]
names = {}
ranges = {}
for cp in range(0x110000):
    name = unicodedata.name(chr(cp), "")
    if 0xAC00 <= cp <= 0xD7A3:
        continue  # Hangul syllable names use the upstream algorithm.
    if not name:
        continue
    prefix, _, suffix = name.rpartition("-")
    if suffix == f"{cp:04X}":
        runs = ranges.setdefault(prefix + "-", [])
        if runs and runs[-1] + 1 == cp:
            runs[-1] = cp
        else:
            runs.extend([cp, cp])
    else:
        names[name] = cp
aliases = Path(__file__).with_name("unicode") / "NameAliases.txt"
# Vendored Unicode 16.0 source; see unicode/LICENSE.txt.
for line in aliases.read_text().splitlines():
    if not line or line.startswith("#"):
        continue
    cp, name, _kind = line.split(";")
    assert unicodedata.lookup(name) == chr(int(cp, 16))
    names[name] = int(cp, 16)
keys, blocks = [], []
items = sorted(names.items())
for start in range(0, len(items), 32):
    keys.append(items[start][0])
    previous, lines = "", []
    for name, cp in items[start : start + 32]:
        common = 0
        while common < min(len(previous), len(name)) and previous[common] == name[common]:
            common += 1
        lines.append(f"{common}:{name[common:]}={cp:x}")
        previous = name
    blocks.append("\n".join(lines))
result = {
    "unicodeVersion": unicodedata.unidata_version,
    "aliasesSha256": hashlib.sha256(aliases.read_bytes()).hexdigest(),
    "ranges": ranges,
    "keys": keys,
    "blocks": blocks,
}
(root / "src/python314/string_names.json").write_text(json.dumps(result, separators=(",", ":")) + "\n")

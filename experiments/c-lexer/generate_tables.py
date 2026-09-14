"""Generate C tables from the pinned CPython-shaped tokenizer experiment."""

import json
from pathlib import Path
import sys

source = Path(sys.argv[1])
out = Path(__file__).parent
u = json.loads((source / "unicode.json").read_text())
with (out / "unicode_tables.h").open("w") as f:
    f.write("/* Unicode 16.0.0 ranges; generated from the pinned experiment. */\n")
    for key in ("start", "continue", "printable"):
        f.write("static const unsigned int unicode_" + key + "[] = {\n")
        values = u[key]
        for i in range(0, len(values), 16):
            f.write(",".join(map(str, values[i : i + 16])) + ",\n")
        f.write("};\n")
ops = json.loads((source / "operators.json").read_text())
with (out / "operators.h").open("w") as f:
    f.write(
        "/* CPython token spellings; generated, PSF license. */\nstatic const struct {const char *text,*name;} operators[] = {\n"
    )
    for key, value in ops.items():
        f.write("{" + json.dumps(key) + "," + json.dumps(value) + "},\n")
    f.write("};\n")

"""Hash full token streams while interning repeated source lines in the artifact."""

import hashlib
import json
import sys
from pathlib import Path
from oracle import oracle

assert sys.version_info[:3] == (3, 14, 3)
out = Path(__file__).resolve().parent
inputs = json.loads((out / "benchmark-inputs.json").read_text())
results = {}
for name, source in inputs.items():
    results[name] = {}
    for mode in ("extra", "strict"):
        actual = oracle(source, mode == "extra")
        assert "tokens" in actual, actual
        lines, indices, tokens = [], {}, []
        for t in actual["tokens"]:
            line = t["line"]
            if line not in indices:
                indices[line] = len(lines)
                lines.append(line)
            tokens.append([t["type"], t["string"], t["start"], t["end"], indices[line]])
        data = json.dumps([lines, tokens], ensure_ascii=False, separators=(",", ":")).encode()
        results[name][mode] = hashlib.sha256(data).hexdigest()
(out / "benchmark-oracle.json").write_text(json.dumps(results, indent=2) + "\n")

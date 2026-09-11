"""Run the identical workload sequentially, capturing raw measurements."""

import json
import os
from pathlib import Path
import subprocess
import time

here = Path(__file__).resolve().parent
node = os.environ.get("PROBE_NODE", "node")
deno = os.environ["PROBE_DENO"]
rows = []
for runtime, command in [
    ("node", [node]),
    ("deno", [deno, "run", "--no-config", "--no-lock", "-A"]),
]:
    for mode in ["spawn", "persistent", "batch"] + (
        ["ffi"] if runtime == "deno" else []
    ):
        start = time.perf_counter()
        result = subprocess.run(
            command + [str(here / "runner.mjs"), mode],
            text=True,
            capture_output=True,
            timeout=90,
        )
        row = {
            "runtime_label": runtime,
            "mode": mode,
            "wall_ms": (time.perf_counter() - start) * 1000,
            "exit_code": result.returncode,
        }
        if result.returncode == 0:
            row["measurement"] = json.loads(result.stdout)
        else:
            row["error"] = result.stderr[-6000:]
        rows.append(row)
        print(json.dumps(row), flush=True)
(here / "results.json").write_text(json.dumps(rows, indent=2) + "\n")
successful = [r["measurement"] for r in rows if r["exit_code"] == 0]
assert len({r["digest"] for r in successful}) == 1, "Different oracle results"
print("All successful runs produced identical result digests.")

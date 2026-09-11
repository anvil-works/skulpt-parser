"""Extract representative source inputs without retaining oracle token objects."""

import json
from pathlib import Path

out = Path(__file__).resolve().parent
cases = [json.loads(line) for line in (out / "independent.jsonl").read_text().splitlines()]
source = {case["name"]: case["source"] for case in cases}
inputs = {
    "small": 'def greet(name):\n    return f"Hello {name!s}!"\n',
    "medium": source["stdlib/shlex.py"],
    "large": source["stdlib/tarfile.py"],
    "long-line": "x = [" + ", ".join(str(i) for i in range(10000)) + "]\n",
    "unicode": '变量 = f"你好 {用户!r} {数值:{宽度}.{精度}}"\n' * 500,
}
(out / "benchmark-inputs.json").write_text(json.dumps(inputs, ensure_ascii=True) + "\n")

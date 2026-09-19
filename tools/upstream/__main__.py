import argparse
import json
from pathlib import Path

from . import ROOT, load_lock, prepare

parser = argparse.ArgumentParser(description="Prepare or validate pinned CPython 3.14 generation inputs")
parser.add_argument("command", choices=["prepare", "check"])
parser.add_argument("--cache-dir", type=Path, default=ROOT / ".cache/cpython")
args = parser.parse_args()
lock = load_lock()
if args.command == "prepare":
    print(prepare(lock, args.cache_dir))
else:
    from .check import check

    # Check is deliberately offline. Preparation is a separate explicit operation.
    result = check(lock, args.cache_dir / lock["commit"])
    print(json.dumps(result, indent=4))

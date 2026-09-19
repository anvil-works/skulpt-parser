import argparse
from pathlib import Path
import sys

from tools.upstream import ROOT, load_lock
from tools.upstream.check import check
from .ast import generate

parser = argparse.ArgumentParser(description="Generate the Python 3.14 structural TypeScript AST")
parser.add_argument("--check", action="store_true", help="Fail if checked-in output differs; write nothing")
parser.add_argument("--cache-dir", type=Path, default=ROOT / ".cache/cpython")
args = parser.parse_args()
lock = load_lock()
source = args.cache_dir / lock["commit"]
check(lock, source)
import asdl  # noqa: E402

output = generate(asdl.parse(str(source / "Parser/Python.asdl")), lock)
target = ROOT / "src/python314/ast.ts"
if args.check:
    if not target.exists() or target.read_text(encoding="utf8") != output:
        sys.exit("Generated AST is stale. Run python3.14 -m tools.generate314.")
    print("Python 3.14 AST generation is up to date")
else:
    target.write_text(output, encoding="utf8")
    print(target)

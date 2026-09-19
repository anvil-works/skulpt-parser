import argparse
from pathlib import Path
import sys

from tools.upstream import ROOT, load_lock
from tools.upstream.check import check
from .ast import generate

parser = argparse.ArgumentParser(description="Generate the Python 3.14 structural TypeScript AST")
parser.add_argument(
    "--parser", action="store_true", help="Generate the supported expression parser instead of AST types"
)
parser.add_argument("--check", action="store_true", help="Fail if checked-in output differs; write nothing")
parser.add_argument("--cache-dir", type=Path, default=ROOT / ".cache/cpython")
args = parser.parse_args()
lock = load_lock()
source = args.cache_dir / lock["commit"]
check(lock, source)
import asdl  # noqa: E402

if args.parser:
    import token
    from pegen.build import build_parser
    from .parser import generate as generate_parser

    grammar, _, _ = build_parser(str(source / "Grammar/python.gram"))
    output = generate_parser(grammar, set(token.tok_name.values()))
    target = ROOT / "src/python314/generated_parser.ts"
else:
    output = generate(asdl.parse(str(source / "Parser/Python.asdl")), lock)
    target = ROOT / "src/python314/ast.ts"
if args.check:
    if not target.exists() or target.read_text(encoding="utf8") != output:
        sys.exit(f"Generated output is stale: {target}. Regenerate with the same arguments without --check.")
    print(f"Python 3.14 generation is up to date: {target.name}")
else:
    target.write_text(output, encoding="utf8")
    print(target)

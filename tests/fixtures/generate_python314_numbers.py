"""Generate NUMBER conversion expectations using the pinned CPython AST parser."""

import ast
import json
from pathlib import Path
import struct
import sys

ROOT = Path(__file__).resolve().parents[2]
lock = json.loads((ROOT / "tools/upstream/cpython.json").read_text())
if sys.implementation.name != "cpython" or ".".join(map(str, sys.version_info[:3])) != lock["version"]:
    sys.exit(f'Use CPython {lock["version"]} to refresh these fixtures')
# The frontend currently implements the upstream default, not process-global Python settings.
sys.set_int_max_str_digits(sys.int_info.default_max_str_digits)


def bits(value):
    # JSON numbers cannot express infinity and can conceal double-rounding mistakes.
    return struct.pack(">d", value).hex()


def expected(source):
    try:
        node = ast.parse(source, mode="eval").body
    except SyntaxError as error:
        return {"error": error.msg}
    assert isinstance(node, ast.Constant), source
    value = node.value
    if type(value) is int:
        # Decimal formatting itself has a digit limit, unlike hexadecimal literals.
        sys.set_int_max_str_digits(0)
        decimal = str(value)
        sys.set_int_max_str_digits(sys.int_info.default_max_str_digits)
        return {"type": "int", "decimal": decimal}
    if type(value) is float:
        return {"type": "float", "bits": bits(value)}
    if type(value) is complex:
        return {"type": "complex", "real": bits(value.real), "imag": bits(value.imag)}
    raise TypeError(type(value))


sources = [
    "0",
    "00_0",
    "123_456",
    "0xdead",
    "0X_DEAD_BEEF",
    "0o755",
    "0O_777",
    "0b101",
    "0B_101",
    "1.",
    ".5",
    "1_234.5_6",
    "1e3",
    "1E+3",
    "1.e-3",
    "1e999",
    "1e-999",
    "0j",
    "00_1j",
    "123_456J",
    ".5j",
    "1.e+3J",
    "1e999j",
    "1e-999j",
    "1.7976931348623157e308",
    "1.7976931348623159e308",
    "2.2250738585072014e-308",
    "5e-324",
    "2.4703282292062327e-324",
    "2.4703282292062328e-324",
    "1.00000000000000011102230246251565404236316680908203125",
    "1.00000000000000011102230246251565404236316680908203126",
]
for n in [2**53 - 1, 2**53, 2**53 + 1, 2**64 - 1, 2**128 + 1, 2**1024 + 1]:
    sources.extend([str(n), hex(n), oct(n), bin(n)])
sources.extend(["9" * 4300, "9" * 4301, "_".join("9" * 4301), "0" * 4301, "0x" + "f" * 4301])
fixtures = {
    "version": lock["version"],
    "int_max_str_digits": sys.int_info.default_max_str_digits,
    "cases": [{"source": source, "expected": expected(source)} for source in sources],
}
Path(__file__).with_name("python314-numbers.json").write_text(json.dumps(fixtures, indent=4) + "\n")

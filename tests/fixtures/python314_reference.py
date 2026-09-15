"""CPython AST serialization shared by generated conformance fixtures."""

import ast
import math


def number(value):
    if math.isfinite(value):
        return value
    return {"$float": "NaN" if math.isnan(value) else "Infinity" if value > 0 else "-Infinity"}


def scalar(value):
    if value is None:
        return {"type": "none"}
    if value is Ellipsis:
        return {"type": "ellipsis"}
    if isinstance(value, bool):
        return {"type": "bool", "value": value}
    if isinstance(value, int):
        return {"type": "int", "value": value if abs(value) <= 2**53 - 1 else {"$bigint": str(value)}}
    if isinstance(value, float):
        return {"type": "float", "value": number(value)}
    if isinstance(value, complex):
        return {"type": "complex", "real": number(value.real), "imag": number(value.imag)}
    if isinstance(value, str):
        return {"type": "str", "value": value}
    if isinstance(value, bytes):
        return {"type": "bytes", "value": {"$bytes": list(value)}}
    raise TypeError(type(value))


def encode(value):
    if isinstance(value, ast.AST):
        result = {"_type": type(value).__name__}
        for field in value._fields:
            item = getattr(value, field)
            if (isinstance(value, (ast.Constant, ast.MatchSingleton)) and field == "value") or (
                isinstance(value, ast.Interpolation) and field == "str"
            ):
                result[field] = scalar(item)
            else:
                result[field] = encode(item)
        for field in value._attributes:
            result[field] = getattr(value, field)
        return result
    if isinstance(value, list):
        return list(map(encode, value))
    return value

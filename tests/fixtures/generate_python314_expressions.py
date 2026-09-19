"""Generate end-to-end expression expectations with CPython, never the TS parser."""

import ast
import random
import unicodedata
import json
from pathlib import Path
import sys
import warnings

from python314_reference import encode

ROOT = Path(__file__).resolve().parents[2]
lock = json.loads((ROOT / "tools/upstream/cpython.json").read_text())
if sys.implementation.name != "cpython" or ".".join(map(str, sys.version_info[:3])) != lock["version"]:
    sys.exit(f'Use CPython {lock["version"]} to refresh these fixtures')

sources = [
    "(a\r+b)",
    "(a\r\n+b)",
    "(résumé +\r café)",
    "1and x",
    "1in x",
    "1if x else 2",
    "0x1or x",
    "1.2and x",
    "1jand x",
    "match",
    "case",
    "type",
    "_",
    "42",
    "9007199254740993",
    "0xdead",
    "1.25e-3",
    "2j",
    "None",
    "True",
    "False",
    "...",
    "a + b * c ** -d",
    "a - b - c",
    "2 ** 3 ** 4",
    "-2 ** 2",
    "(-2) ** 2",
    "a if b else c if d else e",
    "a and b and c or not d",
    "a < b <= c != d is not e not in f",
    "résumé + café * 2",
    "𝒙 + K",
    "a\u0301 + 𝛂",
    "(résumé +\n café)",
    "a + \\\n b",
    "a # a comment\n",
    "a\r\n",
    "((a))",
    "()",
    "(a,)",
    "a,b,c",
    "[a, b, *c]",
    "[]",
    "{}",
    "{a}",
    "{a,b,*c}",
    "{a: b, **c}",
    "obj.attr.other",
    "obj[1:2:3]",
    "obj[:end]",
    "obj[start:]",
    "obj[::]",
    "obj[a, b:c]",
    "obj[*indices]",
    "(value := 42)",
    "(value := a + b)",
    "await obj.attr",
    "(a, *b)",
]
for op in [
    "+",
    "-",
    "*",
    "/",
    "//",
    "%",
    "@",
    "**",
    "<<",
    ">>",
    "|",
    "^",
    "&",
    "==",
    "!=",
    "<",
    "<=",
    ">",
    ">=",
    "is",
    "is not",
    "in",
    "not in",
    "and",
    "or",
]:
    sources.extend([f"a {op} b", f"(a {op} b) {op} c", f"a {op} (b {op} c)"])
sources.extend(
    [
        "f()",
        "f(a)",
        "f(a, b,)",
        "f(*args)",
        "f(**kwargs)",
        "f(a=1)",
        "f(a, *xs, b, key=value, **kw)",
        "f(key=value, *xs)",
        "f(*xs, *ys, k=1, **one, j=2, **two)",
        "f(k=1, k=2)",
        "f(value := 1)",
        "f((value := 1), other)",
        "f(a if b else c)",
        "factory()(x).method(y)[index]",
        "f(𝒙, résumé=café)",
        "f(\n a, # comment\n *xs, key=value, **kw\n)",
        "f(\r a,\r b\r)",
        "[f(x) for x in xs]",
        "{f(x) for x in xs}",
        "{x: f(x) for x in xs}",
        "(f(x) for x in xs)",
        "f(x for x in xs)",
        "f((x for x in xs), y)",
        "[x for x in xs if x > 1 if ready(x)]",
        "[(x,y) for x in xs for y in ys if x != y]",
        "[x for x in (xs if cond else ys)]",
        "[x async for x in xs]",
        "[x async for x in xs if ok(x) for y in ys]",
        "{x: y async for x, y in pairs}",
        "(await f(x) async for x in xs)",
        "[a for a, b in pairs]",
        "[a for (a, [b, *rest]) in rows]",
        "[a for *a, b in rows]",
        "[a for [a] in rows]",
        "[x for () in rows]",
        "[x for obj.attr in rows]",
        "[x for obj[index] in rows]",
        "[x for factory().attr in rows]",
        "[x for factory()[index] in rows]",
        "[x for factory(y for y in ys).attr in rows]",
        "[[y for y in x] for x in xs]",
        "[f(x, k=y) for x, y in rows]",
        "[(y := f(x)) for x in xs if y]",
        "[x for x in (seq := data)]",
        "[résumé for résumé in données if café]",
        "[x\r for x in xs\r if x]",
        "{x: y for x, y in pairs if y}",
    ]
)
string_sources = [
    "''",
    '"abc"',
    "u'abc'",
    "U'abc'",
    "r'\\n'",
    "b'abc'",
    "br'\\n'",
    "Rb'\\x41'",
    "'a' 'b'",
    "u'a' 'b'",
    "'a' u'b'",
    "b'a' b'b'",
    "b'' b'a'",
    "('a'\n 'b')",
    "'café😀'",
    "'''one\ntwo'''",
    "'''one\rtwo'''",
    "'\\a\\b\\f\\n\\r\\t\\v\\\\\\\"'",
    "'\\0\\12\\123\\377\\400\\777'",
    "b'\\0\\12\\123\\377\\400\\777'",
    "'\\x00\\xff\\u1234\\U0001f600'",
    "'\\ud800'",
    "'\\udfff'",
    "'\\ud800\\udc00'",
    "'\\q\\z'",
    "'\\é'",
    "b'\\u1234\\N{SPACE}'",
    "'''x\n\\q'''",
    "'a\\\nb'",
    "'\\N{SNOWMAN}'",
    "'\\N{snowman}'",
    "'\\N{NULL}'",
    "'\\N{CJK UNIFIED IDEOGRAPH-4E00}'",
    "'\\N{HANGUL SYLLABLE GA}'",
]
for prefix in ["f", "t", "rf", "rt"]:
    for body in [
        "",
        "abc",
        "{x}",
        "a{x}b",
        "{{}}",
        "{{{x}}}",
        "{x!s}",
        "{x!r}",
        "{x!a}",
        "{x:}",
        "{x:10.2f}",
        "{x:{width}.{precision}f}",
        "{x=}",
        "{x = }",
        "{ x = !s}",
        "{x=:>10}",
        "{x=:{width}}",
        "{x=}{y=}",
        "{(x,y)}",
        "{x,y}",
        "{[x for x in xs]}",
        "{f(x)}",
        '{f"{x}"}',
        "\\n{x}\\t",
        "\\N{SNOWMAN}{x}",
        "😀{café}",
        "{x}\\\n",
        "{x:\\n}",
        "{x:\\q}",
        "a\\q{x}",
    ]:
        string_sources.append(prefix + '"' + body + '"')
string_sources.extend(
    [
        'f"a" "b"',
        '"a" f"b"',
        'f"{x}" ""',
        '"" f"{x}"',
        'u"a" f"{x}"',
        'f"a{x}" f"b{y}"',
        't"a{x}" t"b{y}"',
        'f"" f""',
        't"" t""',
        'f"{x:#04x}"',
        "f\"{ {'a': x} }\"",
        "t\"{ {'a': x} }\"",
        'f"""{x #comment\n = }"""',
        't"""{x #comment\n }"""',
        't"{  x  }"',
        't"{x == y}"',
        't"{x != y}"',
        't"{(x := y)}"',
        'f"{x!r:{y!s}}"',
        't"{x!r:{y!s}}"',
        'f"{x:{{}}}"',
        't"{x:{{}}}"',
    ]
)

# Deterministic combinations protect escaping, concatenation and metadata through
# the production parser. Expected trees and warnings are always CPython-derived.
for prefix in ["f", "t", "rf", "rt"]:
    for body in [
        r"a\q{x}a\q",
        r"\q\z{x}\q\z",
        r"\400{x}\777",
        r"\{x}",
        r"\{{x}}",
        r"abc{{def}}ghi",
        r"{{{{}}}}",
        r"{x:\N{SPACE}>5}",
        r"{x:\400}",
        "{x!r:>{width}.{precision}}",
        "{x:{y=}}",
        "{x:{y=:}}",
    ]:
        source = prefix + '"' + body + '"'
        string_sources.append(source)
string_sources.extend(
    [
        'f"""line1\n\\q{x}\n\\q"""',
        't"""line1\n\\q{x}\n\\q"""',
        'f"""{x # first\n + y #second\n = }"""',
        't"""{x # first\n + y #second\n }"""',
        "t\"{'hash#'}\"",
        "t\"{'é😀'}\"",
        "t\"{f'{x}'}\"",
        "t\"{t'{x}'}\"",
        "f\"{t'{x}'}\"",
        't"{x:😀{y}}"',
        '(t"a"\n t"b")',
        "f\"{'a' 'b'}\"",
        "'\\N{CJK UNIFIED IDEOGRAPH-31350}'",
        "'\\N{HANGUL SYLLABLE HIH}'",
        "'\\N{CJK UNIFIED IDEOGRAPH-04E00}'",
        "'\\N{BELL}'",
        "'\\N{BYTE ORDER MARK}'",
        "'\\N{ZWJ}'",
    ]
)
# Exercise names across scripts and Unicode 16 additions, independently of the
# compression layout used by tools.generate314.string_names.
named = [chr(cp) for cp in range(0x110000) if unicodedata.name(chr(cp), None)]
for char in random.Random(3143).sample(named, 120):
    string_sources.append("'\\N{" + unicodedata.name(char) + "}'")

# Lambda argument alternatives share CPython's parameter-assembly helpers.
# Compare required keyword-only slots, positional-only defaults and locations.
for parameters in [
    "",
    "a",
    "a,",
    "a,b",
    "a=1",
    "a=1,b=2",
    "a,b=2",
    "a,/",
    "a,/,",
    "a,b,/",
    "a,/,b",
    "a,/,b=2",
    "a,/,b,c=3",
    "a=1,/",
    "a,b=2,/",
    "a=1,/,b=2",
    "a,b=2,/,c=3",
    "*args",
    "*args,",
    "**kwargs",
    "**kwargs,",
    "*args,**kwargs",
    "*,a",
    "*,a,",
    "*,a=1",
    "*,a,b=None,c",
    "*args,a,b=2,c,**kw",
    "a,*args",
    "a=1,*args",
    "a,**kw",
    "a=1,**kw",
    "a,*,b",
    "a,/,*args",
    "a=1,/,*args",
    "a,/,*,b",
    "a=1,/,*,b",
    "a,/,b=2,*args,c,d=4,e=None,**kw",
    "a=1,/,b=2,*args,c,d=4,**kw",
    "a,b=2,/,c=3,*,d,e=5,**kw",
    "a,/,**kw",
    "a=1,/,**kw",
    "résumé,𝒙=2,/,*,café=None",
    "match,case=1,*,type=2",
]:
    sources.append(f"lambda {parameters}: result")
sources.extend(
    [
        "lambda: lambda x: x",
        "lambda x=lambda: 1: x()",
        "lambda x,y=2: x if x else y",
        "(lambda x: x)(42)",
        "(lambda: 1)()",
        "lambda x: (x, x+1)",
        "lambda: 1,2",
        "[lambda x: x+n for n in numbers]",
        "sorted(xs, key=lambda x: x.value)",
        "lambda a=[x for x in xs], b={k:v for k,v in pairs}: (a,b)",
        'lambda a="x", b=f"{value}", c=t"{value}": (a,b,c)',
        "(lambda a,\n b=2, /,\n *, c=None:\n a+b)",
        "(lambda café,\r /,*,é=1:café)",
        'f"{(lambda x: x)(value)}"',
        't"{(lambda x: x)}"',
        # ast.parse accepts these; compilation separately rejects duplicate names.
        "lambda a,a: a",
        "lambda a,/,a: a",
        "lambda a,*a: a",
        "lambda *,a,a: a",
        "lambda K,K: K",
        "(yield)",
        "(yield 1)",
        "(yield 1,)",
        "(yield 1,2)",
        "(yield *xs)",
        "(yield 1,*xs)",
        "(yield from xs)",
        "(yield from (x for x in xs))",
        "(yield from lambda: xs)",
        "(yield from (x,y))",
        "(yield (yield x))",
        "(yield from (yield xs))",
        "lambda: (yield)",
        "lambda x: (yield x)",
        "lambda: (yield from xs)",
        "lambda x=(yield 1): x",
        "((yield f))((yield x))",
        "[(yield x)]",
        "[(yield x) for x in xs]",
        "(yield x) + y",
        "(yield from xs).attr",
        "(yield from xs)[index]",
        "((yield), (yield from xs))",
        "(yield from xs if flag else ys)",
        "(yield\n value)",
        "(yield résumé)",
        "(yield from\r données)",
        'f"{yield value}"',
        't"{yield from values}"',
        'f"{yield value=}"',
        't"{yield value!s:>{width}}"',
        'f"{value:{(yield width)}}"',
    ]
)

sources.extend(string_sources)
cases = []
for source in sources:
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        tree = encode(ast.parse(source, mode="eval"))
    cases.append(
        {
            "source": source,
            "tree": tree,
            "warnings": [{"name": w.category.__name__, "message": str(w.message), "lineno": w.lineno} for w in caught],
        }
    )
errors = []
for source in [
    r"'\x'",
    r"'\u12z'",
    r"'\U00110000'",
    r"'\N{NO}'",
    r"'\N{}'",
    r"'\Nabc'",
    r"b'\xZ'",
    "b'é'",
    r"'é\x'",
    'f"\\u00"',
    "0b2",
    "0o9",
    "0x_",
    "1__0",
    "0123",
    "1e+",
    "1abc",
    "a + $",
    "(a]",
    "a\u200b",
    "9" * 4301,
]:
    try:
        ast.parse(source, mode="eval")
    except SyntaxError as error:
        errors.append(
            {
                "source": source,
                "error": {
                    "name": type(error).__name__,
                    "message": error.msg,
                    **{
                        key: getattr(error, key, None)
                        for key in ("lineno", "offset", "end_lineno", "end_offset", "text")
                    },
                },
            }
        )
    else:
        raise AssertionError(f"Expected syntax error: {source}")
# Second-pass diagnostic actions remain outside this slice. These cases establish
# rejection parity only; expected exception classes still come from CPython.
rejections = []
for source in [
    "lambda",
    "lambda:",
    "lambda a=1,b: b",
    "lambda a=1,/,b: b",
    "lambda /: 1",
    "lambda a,/,/: 1",
    "lambda a,/,b,/: 1",
    "lambda *: 1",
    "lambda *, : 1",
    "lambda *,**kw: 1",
    "lambda **kw,a: 1",
    "lambda *args=1: 1",
    "lambda **kw=1: 1",
    "lambda (a,b): a",
    "lambda a:int: a",
    "lambda a= : a",
    "lambda a,,b: a",
    "lambda a: yield a",
    "lambda a: a := 1",
    "lambda True: 1",
    "lambda a,*b,*c: 1",
    "yield",
    "yield x",
    "(yield from)",
    "(yield from x,y)",
    "(yield from *xs)",
    "f(yield x)",
    "[yield x]",
    "(yield from x for x in xs)",
    r"'\N{CJK UNIFIED IDEOGRAPH-004E00}'",
    r"'\N{cjk unified ideograph-4e00}'",
    r"'\N{hangul syllable ga}'",
    r"'\N{CJK COMPATIBILITY IDEOGRAPH-0F900}'",
    'f"{x!q}"',
    't"{x! r}"',
    "'a' b'b'",
    't"a" "b"',
    'f"a" t"b"',
    'f"{x!s=}"',
    't"{x!s=}"',
    r"'\N{KEYCAP DIGIT ONE}'",
    "f(a=1, 2)",
    "f(**kw, *args)",
    "f(a,,b)",
    "f(*, a)",
    "f(**)",
    "f(x for x in xs, y)",
    "f(x for x in xs,)",
    "[x for 1 in xs]",
    "[x for a+b in xs]",
    "[x for f() in xs]",
    "[x for x xs]",
    "[x for x in]",
    "[x for x in xs if]",
    "[*x for x in xs]",
    "{**x for x in xs}",
    "[x,y for x in xs]",
]:
    try:
        ast.parse(source, mode="eval")
    except SyntaxError as error:
        rejections.append({"source": source, "errorName": type(error).__name__})
    else:
        raise AssertionError(f"Expected syntax rejection: {source}")
# The frontend contract uses SyntaxError for malformed source. CPython 3.14.3
# leaks a codec exception specifically from format-spec decoding; retain the
# oracle exception and message, and test that one explicit normalization.
normalized_errors = []
for source in ['f"{x:\\u00}"', 't"{x:\\u00}"', 'f"{x:\\N{NO}}"']:
    try:
        ast.parse(source, mode="eval")
    except UnicodeDecodeError as error:
        normalized_errors.append({"source": source, "upstreamName": type(error).__name__, "message": str(error)})
    else:
        raise AssertionError(f"Expected upstream codec error: {source}")
fixtures = {
    "normalizedErrors": normalized_errors,
    "version": lock["version"],
    "cases": cases,
    "errors": errors,
    "rejections": rejections,
}
Path(__file__).with_name("python314-expressions.json").write_text(
    json.dumps(fixtures, indent=4, ensure_ascii=True) + "\n"
)

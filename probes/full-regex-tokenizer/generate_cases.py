"""Generate additional lexical cases and CPython oracle expectations as JSON.

Run under CPython 3.14.3. Usage: python generate_cases.py numbers|strings > cases.json
"""
import _tokenize
import io
import itertools
import json
import sys
import token
import warnings

assert sys.version_info[:3] == (3, 14, 3)

if sys.argv[1] == "numbers":
    sources = []
    for n in range(5):
        for p in itertools.product("rubft", repeat=n):
            sources.append("".join(p) + '"abc"')
    for a in [
        "0",
        "00",
        "01",
        "0_",
        "0x",
        "0x_",
        "0b",
        "0b_",
        "0o",
        "0o_",
        "1",
        ".1",
        "1.",
        "1e",
        "1e+",
        "1j",
        "1.0j",
    ]:
        for b in [
            "",
            "_",
            "__",
            "0",
            "1",
            "2",
            "8",
            "9",
            "a",
            "j",
            "_2",
            "_a",
            "e",
            "e+",
            "_",
            "and",
            "andrew",
            "if",
            "else",
            "for",
            "in",
            "is",
            "not",
            "or",
            "π",
        ]:
            sources.append(a + b)
    sources += [
        "if x:\n    \\\ny=1\n",
        "if x:\n  y\n\t z\n",
        "x = \\\n",
        "\\\n",
        'f"{x:\n}"',
        'f"{x:{y:{z}}}"',
        'bf"x"',
        "x=\x00garbage\n",
        'f"\\N{SNOWMAN}"',
        'f"{(]}"',
        'f"{)}"',
        'f"{x:{{}}}"',
    ]
elif sys.argv[1] == "strings":
    sources = []
    for prefix in ["f", "t", "rf", "rt"]:
        for quote in ['"', "'", '"""', "'''"]:
            for body in [
                "",
                "abc",
                "{x}",
                "{x:}",
                "{x:>4}",
                "{x:{w}}",
                "{x:{w}.{p}}",
                "{x!r}",
                "{x!=y}",
                "{x:=3}",
                "{x:{w!r}}",
                "{x:{{}}}",
                "{x:}}}",
                "{{}}",
                "{{{x}}}",
                "{(]}",
                "{)}",
                "{x",
                "x}",
                "x{",
                "{x:{w}",
                "\\N{SNOWMAN}",
                "\\{x}",
                "\\\\{x}",
                "a\nb",
                "{x # hi\n}",
                "{x:\n}",
                "{x:\\n}",
                "{x:{y:{z}}}",
                '{f"{x}"}',
                '{t"{x}"}',
                '{ {"a":2} }',
            ]:
                sources.append(prefix + quote + body + quote)
    sources += ["x=\x00bad", '"\x00bad"', "x=\U000105c0", "x=\U00011db0", "x=\u1c89"]
else:
    raise SystemExit("Choose numbers or strings")

cases = []
for index, source in enumerate(sources):
    case = {"name": str(index), "source": source, "group": sys.argv[1]}
    for mode in ["extra", "strict"]:
        with warnings.catch_warnings(record=True) as captured:
            warnings.simplefilter("always")
            try:
                case[mode] = {
                    "tokens": [
                        dict(
                            type=token.tok_name[t[0]],
                            string=t[1],
                            start=t[2],
                            end=t[3],
                            line=t[4],
                        )
                        for t in _tokenize.TokenizerIter(
                            io.StringIO(source).readline, extra_tokens=mode == "extra"
                        )
                    ]
                }
            except Exception as exc:
                case[mode] = {
                    "error": dict(
                        name=type(exc).__name__,
                        message=str(getattr(exc, "msg", exc)),
                        **{
                            key: getattr(exc, key, None)
                            for key in [
                                "lineno",
                                "offset",
                                "end_lineno",
                                "end_offset",
                                "text",
                            ]
                        }
                    )
                }
            case[mode]["warnings"] = [str(w.message) for w in captured]
    cases.append(case)
json.dump(cases, sys.stdout)

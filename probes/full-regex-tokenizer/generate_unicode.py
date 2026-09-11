"""Generate the tokenizer's pinned identifier and printability expressions."""
import pathlib
import unicodedata

assert unicodedata.unidata_version == "16.0.0"


def ranges(values):
    result = []
    for value in values:
        if result and result[-1][1] == value - 1:
            result[-1][1] = value
        else:
            result.append([value, value])
    return result


def escape(codepoint):
    return r"\u{%x}" % codepoint if codepoint > 65535 else r"\u%04x" % codepoint


def expression(values):
    return "".join(
        escape(lo) if lo == hi else escape(lo) + "-" + escape(hi)
        for lo, hi in ranges(values)
    )


start, extra, nonprintable = [], [], []
for cp in range(128, 0x110000):
    char = chr(cp)
    if char.isidentifier():
        start.append(cp)
    elif ("A" + char).isidentifier():
        extra.append(cp)
    if not char.isprintable():
        nonprintable.append(cp)

pathlib.Path(__file__).with_name("unicode.ts").write_text(
    "// Generated from CPython 3.14.3 Unicode 16.0.0; independent of host JavaScript Unicode tables.\n"
    + "export const identifierStart = /[A-Za-z_"
    + expression(start)
    + "]/u;\n"
    + "export const identifierExtra = /[0-9"
    + expression(extra)
    + "]/u;\n"
    + r"export const nonprintable = /[\u0000-\u001f\u007f"
    + expression(nonprintable)
    + "]/u;\n"
)

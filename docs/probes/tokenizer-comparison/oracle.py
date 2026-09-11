import io
import json
import sys
import token
import tokenize

ignored = {"NEWLINE", "NL", "COMMENT", "INDENT", "DEDENT", "ENDMARKER", "ENCODING"}


def check(case):
    out = dict(case)
    try:
        compile(case["source"], "<probe>", "exec")
        out["compiler_valid"] = True
    except SyntaxError as e:
        out["compiler_valid"] = False
        out["compiler_error"] = {
            "name": type(e).__name__,
            "message": e.msg,
            "lineno": e.lineno,
            "offset": e.offset,
        }
    try:
        out["tokens"] = [
            {
                "type": token.tok_name[t.type],
                "string": t.string,
                "start": t.start,
                "end": t.end,
            }
            for t in tokenize.generate_tokens(io.StringIO(case["source"]).readline)
            if token.tok_name[t.type] not in ignored
        ]
    except (SyntaxError, tokenize.TokenError) as e:
        out["tokenizer_error"] = {"name": type(e).__name__, "message": str(e)}
    return out


if __name__ == "__main__":
    print(
        json.dumps(
            [check(c) for c in json.load(open(sys.argv[1]))],
            ensure_ascii=False,
            indent=2,
        )
    )

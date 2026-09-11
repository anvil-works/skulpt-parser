"""CPython 3.14.3 source-string token/error oracle."""

import io
import token
import warnings
import _tokenize


def oracle(source, extra):
    result = {}
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        try:
            result["tokens"] = [
                dict(type=token.tok_name[t[0]], string=t[1], start=t[2], end=t[3], line=t[4])
                for t in _tokenize.TokenizerIter(io.StringIO(source).readline, extra_tokens=extra)
            ]
        except (SyntaxError, ValueError) as e:
            result["error"] = {
                k: (
                    type(e).__name__
                    if k == "name"
                    else getattr(e, "msg", str(e)) if k == "message" else getattr(e, k, None)
                )
                for k in ["name", "message", "lineno", "offset", "end_lineno", "end_offset", "text"]
            }
        result["warnings"] = [dict(name=type(w.message).__name__, message=str(w.message)) for w in caught]
    return result

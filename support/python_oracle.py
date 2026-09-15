"""Persistent, version-pinned wrapper around the existing reference helpers."""

import contextlib
import io
import json
from pathlib import Path
import runpy
import sys

if sys.implementation.name != "cpython" or sys.version_info[:3] != (3, 9, 25):
    raise RuntimeError("Baseline oracle requires CPython 3.9.25; got " + sys.version)

helpers = {"ast": "ast_dump_helper.py", "symtable": "symtable_dump_helper.py"}
for line in sys.stdin:
    request = json.loads(line)
    output = io.StringIO()
    try:
        helper = str(Path(__file__).with_name(helpers[request["kind"]]))
        sys.argv = [helper] + request["args"]
        with contextlib.redirect_stdout(output):
            runpy.run_path(helper, run_name="__main__")
        response = {"result": output.getvalue()}
    except Exception as error:
        response = {"error": type(error).__name__ + ": " + str(error)}
    print(json.dumps(response), flush=True)

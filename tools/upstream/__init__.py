"""Materialize the locked CPython generator inputs without modifying another checkout."""

import hashlib
import json
from pathlib import Path
import tempfile
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[2]
LOCK_PATH = Path(__file__).with_name("cpython.json")


def load_lock():
    return json.loads(LOCK_PATH.read_text(encoding="utf8"))


def verify(path, expected):
    actual = hashlib.sha256(path.read_bytes()).hexdigest()
    if actual != expected:
        raise ValueError(f"Checksum mismatch: {path}. Remove this cached file and prepare again.")


def prepare(lock, cache):
    """Download missing inputs, verifying both downloads and existing cached files."""
    source = cache / lock["commit"]
    for relative, expected in lock["files"].items():
        target = source / relative
        if target.exists():
            verify(target, expected)
            continue
        url = f'https://raw.githubusercontent.com/python/cpython/{lock["commit"]}/{relative}'
        with urlopen(url, timeout=30) as response:
            content = response.read()
        if hashlib.sha256(content).hexdigest() != expected:
            raise ValueError(f"Checksum mismatch downloading {relative}; no file was installed.")
        target.parent.mkdir(parents=True, exist_ok=True)
        # An interrupted write must not become a supposedly complete cached input.
        with tempfile.NamedTemporaryFile(dir=target.parent, delete=False) as temporary:
            temporary.write(content)
            temporary_path = Path(temporary.name)
        try:
            temporary_path.replace(target)
        finally:
            temporary_path.unlink(missing_ok=True)
    return source


def verify_inputs(lock, source):
    for relative, expected in lock["files"].items():
        verify(source / relative, expected)

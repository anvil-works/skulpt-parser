import hashlib
import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from . import prepare, verify_inputs


class InputIntegrityTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.cache = Path(self.temporary.name)
        self.content = b"pinned generator input\n"
        self.lock = {
            "commit": "example-commit",
            "files": {"Grammar/python.gram": hashlib.sha256(self.content).hexdigest()},
        }

    def test_verified_cache_is_reused_offline(self):
        with patch("tools.upstream.urlopen", return_value=io.BytesIO(self.content)):
            source = prepare(self.lock, self.cache)
        with patch("tools.upstream.urlopen", side_effect=AssertionError("Unexpected network access")):
            self.assertEqual(prepare(self.lock, self.cache), source)
            verify_inputs(self.lock, source)

    def test_corrupt_download_is_not_installed(self):
        with patch("tools.upstream.urlopen", return_value=io.BytesIO(b"wrong bytes")):
            with self.assertRaisesRegex(ValueError, "Checksum mismatch downloading"):
                prepare(self.lock, self.cache)
        self.assertFalse((self.cache / "example-commit/Grammar/python.gram").exists())

    def test_modified_cache_is_rejected_without_overwriting_it(self):
        with patch("tools.upstream.urlopen", return_value=io.BytesIO(self.content)):
            source = prepare(self.lock, self.cache)
        target = source / "Grammar/python.gram"
        target.write_bytes(b"local edits")
        with patch("tools.upstream.urlopen", side_effect=AssertionError("Unexpected network access")):
            with self.assertRaisesRegex(ValueError, "Checksum mismatch"):
                prepare(self.lock, self.cache)
            with self.assertRaisesRegex(ValueError, "Checksum mismatch"):
                verify_inputs(self.lock, source)
        self.assertEqual(target.read_bytes(), b"local edits")

"""DSA safety-gate tests — no DB, no subprocess."""
from app.api.v1.dsa import MAX_CODE_LENGTH, validate_code_safety


def test_clean_code_passes():
    assert validate_code_safety("def solution(nums):\n    return sorted(nums)") is None


def test_blocked_imports_rejected():
    for snippet in ["import os\nx=1", "import subprocess", "__import__('os')", "eval('1')"]:
        assert validate_code_safety(snippet) is not None


def test_oversize_code_rejected():
    assert validate_code_safety("x = 1\n" * 5000) is not None
    assert f"{MAX_CODE_LENGTH}" in validate_code_safety("x" * (MAX_CODE_LENGTH + 1))


def test_open_and_exec_blocked():
    assert validate_code_safety("open('/etc/passwd').read()") is not None
    assert validate_code_safety("exec('evil')") is not None

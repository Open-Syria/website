#!/usr/bin/env python3

import os
import re
import shlex
import sys
import tempfile
from pathlib import Path


EXPECTED_VALUES = {
    "NODE_ENV": "production",
    "NEXT_TELEMETRY_DISABLED": "1",
    "NEXT_PUBLIC_SITE_URL": "https://opensyria.org",
    "NEXT_PUBLIC_DATASETS_API_URL": "https://api.opensyria.org",
    "NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID": "GT-WPDWW3NR",
}
OUTPUT_ORDER = (
    "NODE_ENV",
    "NEXT_TELEMETRY_DISABLED",
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_DATASETS_API_URL",
    "NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID",
)


def fail(message: str) -> None:
    raise SystemExit(f"Invalid production runtime environment: {message}")


def parse_dotenv(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}

    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except (OSError, UnicodeError):
        fail("the exported dotenv file could not be read as UTF-8")

    for line_number, raw_line in enumerate(lines, 1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line.removeprefix("export ").lstrip()

        key, separator, raw_value = line.partition("=")
        if not separator or not re.fullmatch(r"[A-Z][A-Z0-9_]*", key):
            fail(f"malformed line {line_number}")
        if key in values:
            fail(f"duplicate key {key}")

        lexer = shlex.shlex(raw_value, posix=True)
        lexer.whitespace_split = True
        lexer.commenters = ""
        try:
            tokens = list(lexer)
        except ValueError:
            fail(f"malformed value for {key}")
        if len(tokens) > 1:
            fail(f"malformed value for {key}")
        values[key] = tokens[0] if tokens else ""

    return values


def validate(values: dict[str, str]) -> None:
    expected_keys = set(EXPECTED_VALUES)
    actual_keys = set(values)
    missing = sorted(expected_keys - actual_keys)
    unexpected = sorted(actual_keys - expected_keys)

    if missing:
        fail(f"missing keys: {', '.join(missing)}")
    if unexpected:
        fail(f"unexpected or forbidden keys: {', '.join(unexpected)}")

    mismatched = sorted(
        key for key, expected in EXPECTED_VALUES.items() if values[key] != expected
    )
    if mismatched:
        fail(f"incorrect values for: {', '.join(mismatched)}")


def write_runtime_env(path: Path, values: dict[str, str]) -> None:
    parent = path.parent
    if not parent.is_dir() or parent.is_symlink():
        fail("the runtime environment directory must be a real directory")
    if path.exists() or path.is_symlink():
        if not path.is_file() or path.is_symlink():
            fail("the runtime environment destination must be a regular file")

    descriptor, temporary_name = tempfile.mkstemp(prefix=f"{path.name}.", dir=parent)
    temporary = Path(temporary_name)
    try:
        os.fchmod(descriptor, 0o600)
        with os.fdopen(descriptor, "w", encoding="utf-8") as file:
            for key in OUTPUT_ORDER:
                file.write(f"{key}={values[key]}\n")
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def main() -> None:
    if len(sys.argv) not in (2, 3):
        fail("usage: validate-runtime-env.py <dotenv-file> [runtime-env-file]")

    source = Path(sys.argv[1])
    if not source.is_file() or source.is_symlink() or source.stat().st_size == 0:
        fail("the exported dotenv file must be a non-empty regular file")

    values = parse_dotenv(source)
    validate(values)

    if len(sys.argv) == 3:
        write_runtime_env(Path(sys.argv[2]), values)


if __name__ == "__main__":
    main()

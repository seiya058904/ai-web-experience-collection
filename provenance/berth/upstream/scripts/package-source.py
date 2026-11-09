#!/usr/bin/env python3
"""Create a reproducible BERTH source ZIP using Python's standard library.

Run only after the source and evidence are final:
    python scripts/package-source.py /absolute/path/BERTH-source.zip

The destination must be outside the project. This utility is optional; Python
is not required by npm ci, development, testing, or the standard Vite build.
For identical input bytes and the same Python/zlib version, archive entry order,
timestamps, permissions, paths and compression settings are deterministic.
"""

from __future__ import annotations

import argparse
import fnmatch
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import sys
import tempfile
import zipfile


ROOT_FILES = (
    "README.md", "PRODUCT.md", "DESIGN.md", "index.html", "package.json",
    "package-lock.json", "tsconfig.json", "vite.config.ts", "Start-BERTH.cmd",
    "Preview-BERTH.cmd", ".gitignore", "LICENSE", "LICENSE.md", "NOTICE",
    "NOTICE.md",
)
ROOT_DIRECTORIES = (
    "src", "public", "docs", "tests", "scripts", "third-party", "evidence",
)
EXCLUDED_DIRECTORIES = frozenset({
    "node_modules", "dist", "build", ".git", ".hg", ".svn", ".codex",
    ".impeccable", ".cache", "cache", "caches", "__pycache__", ".pytest_cache",
    ".mypy_cache", ".ruff_cache", ".vite", ".parcel-cache", ".next", ".turbo",
    "coverage", "playwright-report", "test-results", "tmp", "temp", "output",
    "outputs", "generated_images", "profile", "profiles", "browser-profile",
    "browser-profiles", "chromium-profile", "chrome-profile", "user-data",
    "user-data-dir", "secrets", "credentials", ".secrets",
})
EXCLUDED_FILENAMES = frozenset({
    ".ds_store", "thumbs.db", "desktop.ini", ".npmrc", ".pypirc", ".netrc",
    "credentials.json", "credential.json", "tokens.json", "token.json",
    "cookies.json", "cookies.sqlite", "login data", "secure preferences",
    "local state", "history", "web data",
})
EXCLUDED_FILE_PATTERNS = (
    ".env", ".env.*", "*.pem", "*.key", "*.p12", "*.pfx", "*.jks",
    "*.keystore", "*.sqlite", "*.sqlite3", "*.db", "*.zip", "*.7z",
    "*.tar", "*.tar.gz", "*.log", "*.pyc", "*.pyo", "*.tmp", "*.temp",
    "*.pending.*", "*~",
)
REQUIRED_FILES = (
    "README.md", "index.html", "package.json", "package-lock.json",
    "src/main.ts", "src/story.ts", "src/critical-art.ts",
    "public/assets/manifest.json", "docs/verification.md",
    "Start-BERTH.cmd", "Preview-BERTH.cmd",
)
WINDOWS_RESERVED_NAMES = frozenset(
    {"CON", "PRN", "AUX", "NUL"}
    | {f"COM{number}" for number in range(1, 10)}
    | {f"LPT{number}" for number in range(1, 10)}
)
PRIVATE_KEY_BLOCK = re.compile(
    rb"-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----"
)
ZIP_TIMESTAMP = (1980, 1, 1, 0, 0, 0)


def excluded_file(name: str) -> bool:
    lower = name.casefold()
    return lower in EXCLUDED_FILENAMES or any(
        fnmatch.fnmatchcase(lower, pattern) for pattern in EXCLUDED_FILE_PATTERNS
    )


def validate_relative_name(relative: str) -> str:
    candidate = PurePosixPath(relative)
    if candidate.is_absolute() or not candidate.parts:
        raise ValueError(f"Invalid archive path: {relative!r}")
    for part in candidate.parts:
        if part in {"", ".", ".."} or "\\" in part:
            raise ValueError(f"Unsafe archive path: {relative!r}")
        if any(ord(character) < 32 or character in '<>:"|?*' for character in part):
            raise ValueError(f"Nonportable archive name: {relative!r}")
        if part.endswith((" ", ".")) or part.split(".", 1)[0].upper() in WINDOWS_RESERVED_NAMES:
            raise ValueError(f"Nonportable Windows filename: {relative!r}")
    return "BERTH/" + candidate.as_posix()


def collect_files(root: Path) -> list[tuple[str, Path, int, int]]:
    found: list[Path] = []
    for name in ROOT_FILES:
        candidate = root / name
        if candidate.is_symlink():
            raise ValueError(f"Symlink is not allowed in source package: {name}")
        if candidate.is_file():
            found.append(candidate)

    for name in ROOT_DIRECTORIES:
        directory = root / name
        if not directory.exists():
            continue
        if directory.is_symlink() or not directory.is_dir():
            raise ValueError(f"Expected an ordinary source directory: {name}")
        for current, directory_names, file_names in os.walk(directory, followlinks=False):
            kept_directories = []
            for child_name in sorted(directory_names):
                if child_name.casefold() in EXCLUDED_DIRECTORIES or child_name.startswith("."):
                    continue
                child = Path(current) / child_name
                if child.is_symlink():
                    raise ValueError(f"Symlink is not allowed: {child.relative_to(root)}")
                kept_directories.append(child_name)
            directory_names[:] = kept_directories
            for child_name in sorted(file_names):
                if excluded_file(child_name):
                    continue
                child = Path(current) / child_name
                if child.is_symlink():
                    raise ValueError(f"Symlink is not allowed: {child.relative_to(root)}")
                if not child.is_file():
                    raise ValueError(f"Non-regular source file: {child.relative_to(root)}")
                found.append(child)

    result = []
    folded_names: set[str] = set()
    for file in sorted(found, key=lambda item: item.relative_to(root).as_posix()):
        relative = file.relative_to(root).as_posix()
        validate_relative_name(relative)
        folded = relative.casefold()
        if folded in folded_names:
            raise ValueError(f"Case-insensitive archive filename collision: {relative}")
        folded_names.add(folded)
        file_stat = file.stat()
        result.append((relative, file, file_stat.st_size, file_stat.st_mtime_ns))

    included_names = {relative for relative, *_ in result}
    missing = [name for name in REQUIRED_FILES if name not in included_names]
    if missing:
        raise ValueError("Required final source files are missing: " + ", ".join(missing))
    return result


def inside(path: Path, directory: Path) -> bool:
    try:
        path.relative_to(directory)
        return True
    except ValueError:
        return False


def digest_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path, help="Absolute ZIP destination outside the source project")
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1], help="Source project root")
    parser.add_argument("--overwrite", action="store_true", help="Replace an existing ZIP at the explicit destination")
    parser.add_argument("--check-only", action="store_true", help="Validate source inventory and destination without creating an archive")
    options = parser.parse_args()
    root = options.root.resolve(strict=True)
    if not root.is_dir():
        raise ValueError("Source root must be a directory.")
    if not options.output.is_absolute():
        raise ValueError("The ZIP destination must be an absolute path.")
    if options.output.is_symlink():
        raise ValueError("The ZIP destination must not be a symlink.")
    output = options.output.resolve()
    if output.suffix.casefold() != ".zip":
        raise ValueError("The ZIP destination must end in .zip.")
    if inside(output, root):
        raise ValueError("The ZIP destination must be outside the project directory.")
    if output.exists() and (not output.is_file() or not options.overwrite):
        raise ValueError("The destination already exists; use a new path or explicit --overwrite.")

    inventory = collect_files(root)
    uncompressed_bytes = sum(size for _, _, size, _ in inventory)
    if options.check_only:
        print(json.dumps({
            "status": "inventory-validated-no-archive-created",
            "output": str(output), "archive_root": "BERTH/",
            "file_count": len(inventory), "uncompressed_bytes": uncompressed_bytes,
        }, indent=2))
        return 0

    output.parent.mkdir(parents=True, exist_ok=True)
    temporary: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(prefix="." + output.name + ".", suffix=".tmp", dir=output.parent, delete=False) as handle:
            temporary = Path(handle.name)
        with zipfile.ZipFile(temporary, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9, allowZip64=True) as archive:
            for relative, source, expected_size, expected_mtime in inventory:
                before = source.stat()
                if (before.st_size, before.st_mtime_ns) != (expected_size, expected_mtime):
                    raise RuntimeError(f"Source changed during packaging: {relative}")
                data = source.read_bytes()
                after = source.stat()
                if len(data) != expected_size or (after.st_size, after.st_mtime_ns) != (expected_size, expected_mtime):
                    raise RuntimeError(f"Source changed while reading: {relative}")
                if PRIVATE_KEY_BLOCK.search(data):
                    raise ValueError(f"Private key material detected; refusing to package: {relative}")
                entry = zipfile.ZipInfo(validate_relative_name(relative), date_time=ZIP_TIMESTAMP)
                entry.create_system = 3
                entry.external_attr = (stat.S_IFREG | 0o644) << 16
                entry.compress_type = zipfile.ZIP_DEFLATED
                archive.writestr(entry, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)

        if collect_files(root) != inventory:
            raise RuntimeError("Source inventory changed during packaging; no final archive was written.")
        expected_names = [validate_relative_name(relative) for relative, *_ in inventory]
        with zipfile.ZipFile(temporary, "r") as archive:
            if archive.namelist() != expected_names:
                raise RuntimeError("Archive entry names or order differ from the validated inventory.")
            corrupt = archive.testzip()
            if corrupt is not None:
                raise RuntimeError(f"ZIP CRC verification failed: {corrupt}")
        # Recheck immediately before replacing a destination that was initially absent.
        if output.exists() and not options.overwrite:
            raise FileExistsError("Destination appeared during packaging; it was not replaced.")
        os.replace(temporary, output)
        temporary = None
        print(json.dumps({
            "status": "packaged-and-crc-verified", "output": str(output),
            "archive_root": "BERTH/", "file_count": len(inventory),
            "uncompressed_bytes": uncompressed_bytes, "zip_bytes": output.stat().st_size,
            "sha256": digest_file(output),
            "determinism": "Fixed sorted paths, 1980-01-01 timestamps, 0644 permissions and deflate level 9; identical bytes with the same Python/zlib version.",
        }, indent=2))
        return 0
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, RuntimeError, zipfile.BadZipFile) as error:
        print(f"Packaging failed: {error}", file=sys.stderr)
        raise SystemExit(1)

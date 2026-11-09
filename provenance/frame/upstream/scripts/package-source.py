#!/usr/bin/env python3
"""Package FRAME's explicit deliverables with Python's standard library only.

Run after npm run build and verification. The default output is
../FRAME-source.zip. This command does not install, build, test, publish,
or copy node_modules. Repeated runs over unchanged files produce the same ZIP.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import tempfile
import zipfile


PROJECT = Path(__file__).resolve().parent.parent
ROOT_FILES = (
    "index.html", "package.json", "package-lock.json", "tsconfig.json",
    "vite.config.ts", "README.md", "START-HERE.zh-CN.md", "Start-Frame.cmd",
    "PRODUCT.md", "DESIGN.md", "FRAME.html", "QA-PREVIEW.html",
)
ROOT_DIRECTORIES = (
    "src", "public", "dist", "concepts", "docs", "tests", "evidence", "scripts",
)
EXCLUDED_DIRECTORIES = {
    "node_modules", "__pycache__", "coverage", "tmp", "temp", "cache", "caches",
    "build-cache", "test-results", "playwright-report", "browser-profile",
}
EXCLUDED_SUFFIXES = {
    ".pyc", ".pyo", ".tsbuildinfo", ".map", ".tmp", ".temp", ".bak", ".swp",
    ".zip", ".tar", ".gz", ".tgz", ".7z", ".exe", ".dll", ".so", ".dylib",
    ".node", ".o", ".obj", ".a", ".lib", ".ppm", ".pem", ".key", ".p12",
    ".pfx", ".sqlite", ".sqlite3", ".db",
}
PRIVATE_NAMES = {
    "credentials", "credentials.json", "secrets.json", "secrets.yaml",
    "secrets.yml", "tokens.json", "id_rsa", "id_ed25519",
}
NATIVE_SIGNATURES = (
    b"\x7fELF", b"MZ", b"\xfe\xed\xfa\xce", b"\xce\xfa\xed\xfe",
    b"\xfe\xed\xfa\xcf", b"\xcf\xfa\xed\xfe", b"\xca\xfe\xba\xbe",
)


def is_excluded(path: Path) -> bool:
    relative = path.relative_to(PROJECT)
    return (
        any(part.startswith(".") for part in relative.parts)
        or any(part.lower() in EXCLUDED_DIRECTORIES for part in relative.parts)
        or path.name.lower() in PRIVATE_NAMES
        or path.suffix.lower() in EXCLUDED_SUFFIXES
        or path.name.endswith("~")
    )


def collect_files() -> tuple[list[Path], list[str]]:
    files: list[Path] = []
    excluded: list[str] = []
    for name in ROOT_FILES:
        path = PROJECT / name
        if path.is_symlink() or not path.is_file():
            raise RuntimeError(f"Required regular file is missing: {name}")
        files.append(path)
    for name in ROOT_DIRECTORIES:
        directory = PROJECT / name
        if directory.is_symlink() or not directory.is_dir():
            raise RuntimeError(f"Required project directory is missing: {name}")
        for current, child_directories, child_files in os.walk(directory, followlinks=False):
            for child in list(child_directories):
                path = Path(current) / child
                if path.is_symlink() or is_excluded(path):
                    child_directories.remove(child)
                    excluded.append(path.relative_to(PROJECT).as_posix() + "/")
            for child in child_files:
                path = Path(current) / child
                if path.is_symlink() or is_excluded(path):
                    excluded.append(path.relative_to(PROJECT).as_posix())
                elif path.is_file():
                    files.append(path)
    files.sort(key=lambda path: path.relative_to(PROJECT).as_posix())
    return files, sorted(excluded)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=PROJECT.parent / "FRAME-source.zip")
    parser.add_argument("--check", action="store_true", help="Validate inputs without writing a ZIP.")
    args = parser.parse_args()
    output = args.output.expanduser().resolve()
    if output == PROJECT or PROJECT in output.parents:
        parser.error("Write the ZIP outside the source project to prevent accidental inclusion.")
    files, excluded = collect_files()
    records: list[dict[str, object]] = []
    for path in files:
        with path.open("rb") as source:
            prefix = source.read(8)
        if any(prefix.startswith(signature) for signature in NATIVE_SIGNATURES):
            raise RuntimeError(f"Compiled binary is not a source deliverable: {path.relative_to(PROJECT)}")
        records.append({"path": path.relative_to(PROJECT).as_posix(), "bytes": path.stat().st_size})

    summary: dict[str, object] = {
        "archive": output.name,
        "entries": len(records),
        "uncompressedBytes": sum(int(record["bytes"]) for record in records),
        "rootFiles": list(ROOT_FILES),
        "rootDirectories": list(ROOT_DIRECTORIES),
        "excludedFromSelectedDirectories": excluded,
        "policy": "Explicit project roots; no hidden files, symlinks, dependency directories, caches, native binaries, private-key files, or nested archives.",
    }
    if args.check:
        summary["status"] = "inputs-validated; archive-not-written"
    else:
        output.parent.mkdir(parents=True, exist_ok=True)
        descriptor, temporary_name = tempfile.mkstemp(prefix="FRAME-source-", suffix=".zip.tmp", dir=output.parent)
        os.close(descriptor)
        temporary = Path(temporary_name)
        try:
            with zipfile.ZipFile(temporary, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
                for path, record in zip(files, records, strict=True):
                    before = path.stat()
                    data = path.read_bytes()
                    after = path.stat()
                    if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
                        raise RuntimeError(f"File changed while packaging: {record['path']}")
                    if len(data) != record["bytes"]:
                        raise RuntimeError(f"File size changed before packaging: {record['path']}")
                    info = zipfile.ZipInfo(str(record["path"]), date_time=(1980, 1, 1, 0, 0, 0))
                    info.create_system = 3
                    info.external_attr = 0o100644 << 16
                    info.compress_type = zipfile.ZIP_DEFLATED
                    archive.writestr(info, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
            with zipfile.ZipFile(temporary) as archive:
                bad = archive.testzip()
                if bad:
                    raise RuntimeError(f"ZIP integrity failed: {bad}")
            temporary.replace(output)
        finally:
            temporary.unlink(missing_ok=True)
        with output.open("rb") as archive_file:
            archive_sha = hashlib.file_digest(archive_file, "sha256").hexdigest()
        summary.update({
            "status": "packaged",
            "bytes": output.stat().st_size,
            "sha256": archive_sha,
        })
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()

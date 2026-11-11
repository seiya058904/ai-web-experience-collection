#!/usr/bin/env python3
"""Create the local PAPERSUN source ZIP using only Python's standard library.

Run after the final build and evidence updates. --dry-run validates the package
selection and hashes without creating a ZIP or changing the integrity manifest.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import sys
import tempfile
import zipfile


PROJECT = Path(__file__).resolve().parent.parent
ARCHIVE_NAME = "papersun-source.zip"
ARCHIVE_ROOT = "papersun"
MANIFEST_PATH = "docs/package-manifest.json"
ZIP_TIME = (1980, 1, 1, 0, 0, 0)
ROOT_FILES = (
    ".gitignore", "README.md", "VISUAL-BIBLE.md", "requirements-evidence.md",
    "index.html", "package.json", "package-lock.json", "tsconfig.json",
    "vite.config.ts",
)
SOURCE_DIRS = ("src", "public", "art", "docs", "scripts", "tests")
SKIP_DIRS = {
    "node_modules", ".git", ".cache", "cache", "__pycache__",
    ".pytest_cache", ".mypy_cache", ".ruff_cache", ".vite", ".vite-temp",
    ".turbo", "tmp", "temp",
}
SKIP_NAMES = {".DS_Store", "Thumbs.db", "desktop.ini"}
SKIP_SUFFIXES = {
    ".tmp", ".temp", ".bak", ".orig", ".rej", ".swp", ".swo",
    ".pyc", ".pyo", ".part", ".zip", ".tgz", ".7z",
}
TEXT_BUILD_SUFFIXES = {".html", ".css", ".js", ".mjs"}
RAW_FRAME_SUFFIXES = {".jpg", ".jpeg"}


class PackageError(Exception):
    """An incomplete or unstable source tree cannot be packaged safely."""


def ignored(relative: Path) -> bool:
    name = relative.name
    if any(part in SKIP_DIRS for part in relative.parts):
        return True
    if name in SKIP_NAMES or name.endswith("~") or name.startswith(".#"):
        return True
    if name.startswith("#") and name.endswith("#"):
        return True
    if relative.suffix.lower() in SKIP_SUFFIXES:
        return True
    art_tree = relative.parts[0] == "art" or (
        len(relative.parts) > 1
        and relative.parts[0] in {"public", "dist"}
        and relative.parts[1] == "art"
    )
    return art_tree and relative.suffix.lower() in {".png", ".b64"}


def checked_file(relative: str) -> Path:
    path = PROJECT / relative
    if path.is_symlink():
        raise PackageError(f"Symlinks are not packaged: {relative}")
    if not path.is_file():
        raise PackageError(f"Required file is missing: {relative}")
    return path


def walk_files(folder: str) -> dict[str, Path]:
    base = PROJECT / folder
    if base.is_symlink() or not base.is_dir():
        raise PackageError(f"Required ordinary directory is missing: {folder}")
    selected: dict[str, Path] = {}

    def walk_error(error: OSError) -> None:
        raise PackageError(f"Cannot read selected directory: {folder}") from error

    for current, dirs, names in os.walk(base, followlinks=False, onerror=walk_error):
        current_path = Path(current)
        dirs[:] = sorted(d for d in dirs if d not in SKIP_DIRS)
        for directory in dirs:
            if (current_path / directory).is_symlink():
                relative = (current_path / directory).relative_to(PROJECT).as_posix()
                raise PackageError(f"Symlink directory is not packaged: {relative}")
        for name in sorted(names):
            path = current_path / name
            relative = path.relative_to(PROJECT)
            key = relative.as_posix()
            if key == MANIFEST_PATH or ignored(relative):
                continue
            selected[key] = checked_file(key)
    return selected


def digest(path: Path) -> tuple[int, str]:
    before = path.stat()
    total = 0
    value = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            total += len(block)
            value.update(block)
    after = path.stat()
    if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
        raise PackageError("A selected file changed while hashing; finish edits and retry.")
    return total, value.hexdigest()


def current_dist(sources: dict[str, Path]) -> tuple[dict[str, Path], list[str]]:
    """Select the current HTML/public files and their reachable hashed assets.

    Vite normally cleans dist on build. Literal asset-name reachability also
    excludes obsolete hashed bundles if older files were manually left there.
    Current PAPERSUN uses explicit Vite HTML/JS/CSS asset references.
    """
    candidates = walk_files("dist")
    chosen = {"dist/index.html": checked_file("dist/index.html")}
    for relative, source in sources.items():
        if relative.startswith("public/"):
            built_name = "dist/" + relative[len("public/"):]
            built = checked_file(built_name)
            if digest(source) != digest(built):
                raise PackageError(f"{built_name} differs from {relative}; rebuild first.")
            chosen[built_name] = built

    assets = {key: path for key, path in candidates.items() if key.startswith("dist/assets/")}
    by_name: dict[str, str] = {}
    for key, path in assets.items():
        if path.name in by_name:
            raise PackageError("Build asset basenames must be unique for package selection.")
        by_name[path.name] = key

    pending = list(chosen.values())
    while pending:
        path = pending.pop()
        if path.suffix.lower() not in TEXT_BUILD_SUFFIXES:
            continue
        text = path.read_text(encoding="utf-8")
        for match in re.findall(r"(?:\./|/)?assets/([A-Za-z0-9_.\-/]+)", text):
            required = "dist/assets/" + match
            if required not in assets:
                raise PackageError(f"A built page references a missing asset: {required}")
        for basename, key in by_name.items():
            if key not in chosen and basename in text:
                chosen[key] = assets[key]
                pending.append(assets[key])

    if not any(key.endswith(".js") for key in chosen if key.startswith("dist/assets/")):
        raise PackageError("The prepared build has no reachable JavaScript entry.")
    if not any(key.endswith(".css") for key in chosen if key.startswith("dist/assets/")):
        raise PackageError("The prepared build has no reachable stylesheet.")
    omitted = sorted(set(candidates) - set(chosen))
    return chosen, omitted


def select_files() -> tuple[dict[str, Path], list[str]]:
    files = {name: checked_file(name) for name in ROOT_FILES}
    for folder in SOURCE_DIRS:
        files.update(walk_files(folder))
    required = [
        "src/main.ts", "src/story.ts", "src/fragments.ts", "public/story.html",
        "scripts/serve.mjs", "scripts/start-papersun.cmd", "scripts/start-papersun.sh",
        "art/asset-derivatives.json", "docs/rights-and-attribution.md",
        "docs/known-limitations.md",
        *[f"art/concepts/ai-{number:02}.webp" for number in range(1, 9)],
    ]
    for name in required:
        if name not in files:
            raise PackageError(f"Required handoff file was not selected: {name}")
    if not any(name.startswith("docs/evidence/") for name in files):
        raise PackageError("No recorded QA evidence is available to include.")
    built, omitted = current_dist(files)
    files.update(built)
    return dict(sorted(files.items())), omitted


def animated_webp(data: bytes) -> bool:
    """Recognize a complete multi-frame WebP container without an image library.

    A missing, partial or static file is not sufficient to discard raw frames.
    This validates the RIFF chunk structure, not the visual content of frames.
    """
    if len(data) < 12 or data[:4] != b"RIFF" or data[8:12] != b"WEBP":
        return False
    if int.from_bytes(data[4:8], "little") + 8 != len(data):
        return False
    position, animation, frames = 12, False, 0
    while position + 8 <= len(data):
        tag = data[position:position + 4]
        size = int.from_bytes(data[position + 4:position + 8], "little")
        end = position + 8 + size
        if end > len(data):
            return False
        if tag == b"ANIM":
            animation = size >= 6
        elif tag == b"ANMF":
            if size < 16:
                return False
            frames += 1
        position = end + (size % 2)
    return position == len(data) and animation and frames >= 2


def curate_evidence(files: dict[str, Path]) -> tuple[dict[str, Path], list[dict[str, object]]]:
    """Omit redundant continuous JPEGs only after their animation is complete.

    Keep every JSON record, all still/failure captures and every incomplete
    sequence. A CAPTURED sequence must name the same retained animated WebP
    and account for every raw JPEG before that sequence can be compacted.
    No file is deleted from the working project.
    """
    selected = dict(files)
    groups: dict[str, list[str]] = {}
    for relative in files:
        path = Path(relative)
        if (len(path.parts) == 4 and path.parts[:2] == ("docs", "evidence")
                and path.parts[2].endswith("-frames")
                and path.suffix.lower() in RAW_FRAME_SUFFIXES):
            groups.setdefault(path.parent.as_posix(), []).append(relative)

    omitted: list[dict[str, object]] = []
    for folder, frames in sorted(groups.items()):
        sequence = folder.removesuffix("-frames")
        metadata_name, animation_name = sequence + ".json", sequence + ".webp"
        if metadata_name not in files or animation_name not in files:
            continue
        try:
            metadata = json.loads(files[metadata_name].read_text(encoding="utf-8"))
            expected = {
                "docs/evidence/" + frame["file"]
                for frame in metadata.get("frames", [])
                if isinstance(frame, dict) and isinstance(frame.get("file"), str)
            }
            valid = (
                metadata.get("status") == "CAPTURED"
                and metadata.get("animation") == Path(animation_name).name
                and expected == set(frames)
                and animated_webp(files[animation_name].read_bytes())
            )
        except (OSError, UnicodeError, ValueError, AttributeError, TypeError):
            valid = False
        if not valid:
            continue
        raw_bytes = sum(files[name].stat().st_size for name in frames)
        for name in frames:
            selected.pop(name)
        omitted.append({
            "directory": folder,
            "reason": "Redundant continuous-capture JPEGs; the same sequence's animated WebP and original frame/timing JSON are retained.",
            "rawFrameFiles": sorted(frames),
            "rawFrameCount": len(frames),
            "rawFrameBytes": raw_bytes,
            "retainedAnimation": animation_name,
            "retainedMetadata": metadata_name,
        })
    return dict(sorted(selected.items())), omitted


def make_manifest(files: dict[str, Path], evidence_omissions: list[dict[str, object]] | None = None) -> tuple[bytes, dict[str, dict[str, object]]]:
    records = []
    lookup: dict[str, dict[str, object]] = {}
    for relative, path in files.items():
        size, sha = digest(path)
        record = {"path": relative, "bytes": size, "sha256": sha}
        records.append(record)
        lookup[relative] = record
    manifest = {
        "schemaVersion": 1,
        "archiveRoot": ARCHIVE_ROOT,
        "hashAlgorithm": "sha256",
        "normalizedZipTimestamp": "1980-01-01T00:00:00",
        "manifestExcludedFromOwnFileList": True,
        "evidenceCuration": {
            "policy": "Omit only completed continuous raw JPEG sequences represented by a retained animated WebP and original frame/timing JSON; preserve stills, failure evidence, reports and incomplete sequences.",
            "omittedRawSequences": evidence_omissions or [],
        },
        "files": records,
    }
    data = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    return data, lookup


def zip_entry(relative: str) -> zipfile.ZipInfo:
    entry = zipfile.ZipInfo(f"{ARCHIVE_ROOT}/{relative}", date_time=ZIP_TIME)
    entry.create_system = 3
    mode = 0o755 if relative.endswith(".sh") else 0o644
    entry.external_attr = (stat.S_IFREG | mode) << 16
    entry.compress_type = zipfile.ZIP_DEFLATED
    return entry


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="Validate and hash; write no files.")
    args = parser.parse_args()
    files, omitted = select_files()
    files, evidence_omissions = curate_evidence(files)
    manifest, records = make_manifest(files, evidence_omissions)
    total = sum(int(record["bytes"]) for record in records.values())
    print(f"Selected {len(files)} files plus {MANIFEST_PATH}; {total:,} source/build bytes.")
    if omitted:
        print("Omitted obsolete/unreferenced build outputs:")
        for relative in omitted:
            print(f"  {relative}")
    if evidence_omissions:
        raw_count = sum(int(sequence["rawFrameCount"]) for sequence in evidence_omissions)
        raw_bytes = sum(int(sequence["rawFrameBytes"]) for sequence in evidence_omissions)
        print(f"Omitted {raw_count} redundant raw JPEG frames ({raw_bytes:,} bytes) from {len(evidence_omissions)} completed sequences.")
        print("Retained every sequence's animated WebP and frame/timing JSON; details are recorded in the manifest.")
    if args.dry_run:
        print("Dry run only: no ZIP or integrity manifest was written.")
        print("Source ZIP extraction and rebuild verification: PENDING.")
        return 0

    # Stage only inside this project. The final ZIP is the sole sibling output.
    handle, temporary_name = tempfile.mkstemp(prefix=".package-source-", suffix=".tmp", dir=PROJECT)
    os.close(handle)
    temporary = Path(temporary_name)
    manifest_temporary = PROJECT / "docs/.package-manifest.json.tmp"
    try:
        with zipfile.ZipFile(temporary, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for relative in sorted([*files, MANIFEST_PATH]):
                data = manifest if relative == MANIFEST_PATH else files[relative].read_bytes()
                if relative != MANIFEST_PATH:
                    expected = records[relative]
                    if len(data) != expected["bytes"] or hashlib.sha256(data).hexdigest() != expected["sha256"]:
                        raise PackageError(f"{relative} changed during packaging; finish edits and retry.")
                archive.writestr(zip_entry(relative), data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
        manifest_temporary.write_bytes(manifest)
        os.replace(manifest_temporary, PROJECT / MANIFEST_PATH)
        destination = PROJECT.parent / ARCHIVE_NAME
        os.replace(temporary, destination)
        size, sha = digest(destination)
        print(f"Created ../{ARCHIVE_NAME} with root {ARCHIVE_ROOT}/; {size:,} ZIP bytes.")
        print(f"SHA-256: {sha}")
        print("File-integrity packaging completed; clean extraction and rebuild remain PENDING.")
    finally:
        temporary.unlink(missing_ok=True)
        manifest_temporary.unlink(missing_ok=True)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (PackageError, OSError, UnicodeError, zipfile.BadZipFile) as error:
        # Do not expose machine-specific absolute working paths in output.
        message = str(error) if isinstance(error, PackageError) else type(error).__name__
        print(f"Packaging stopped: {message}", file=sys.stderr)
        raise SystemExit(1)

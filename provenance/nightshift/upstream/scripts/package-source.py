"""Create the private source handoff, omitting installed/cache/working data."""
from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parent.parent
TOP_FILES = {
    "README.md", "ASSET-PROVENANCE.md", "THIRD-PARTY-NOTICES.md",
    "PRODUCT.md", "VISUAL-BIBLE.md", "DESIGN.md", "Start-Nightshift.cmd",
    "index.html", "package.json", "package-lock.json", "tsconfig.json",
    "vite.config.ts", "playwright.config.ts",
}
DIRECTORIES = {"src", "public", "tests", "scripts", "licenses", "docs", "evidence"}
EXCLUDED_EVIDENCE = {"baseline-artifacts", "intermediate-artifacts", "playwright-artifacts"}


def retained(relative: Path) -> bool:
    parts = relative.parts
    if any(part == "__pycache__" or part.endswith(".pyc") for part in parts):
        return False
    if relative.as_posix() == ".impeccable/design.json":
        return True
    if len(parts) == 1:
        return parts[0] in TOP_FILES
    if parts[0] not in DIRECTORIES:
        return False
    if parts[0] != "evidence":
        return True
    if parts[1] in EXCLUDED_EVIDENCE:
        return False
    if parts[1] == "browser-report" and parts[-1] != "index.html":
        return False
    # The delivered MP4 and contact sheet preserve these exact adjacent frames.
    if parts[1] == "motion-frames" and parts[-1].startswith("midpoint-sequence-"):
        return False
    if parts[-1] == "prototype-hero-desktop.png":
        return False
    return True


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT.parent / "nightshift-source.zip")
    args = parser.parse_args()
    files = sorted(path for path in ROOT.rglob("*") if path.is_file() and retained(path.relative_to(ROOT)))
    manifest = {
        "project": "NIGHTSHIFT",
        "createdUtc": datetime.now(timezone.utc).isoformat(),
        "purpose": "Portable private source handoff, including selected original generated art and actual QA evidence.",
        "exclusions": ["node_modules", "generated dist", "raw working PNG generations", "browser binaries and profiles", "temporary traces and report caches", "redundant individual midpoint frames already retained in the video/contact sheet"],
        "files": [],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(args.output, "w", ZIP_DEFLATED, compresslevel=6) as archive:
        for path in files:
            relative = path.relative_to(ROOT).as_posix()
            payload = path.read_bytes()
            manifest["files"].append({"path": relative, "bytes": len(payload), "sha256": hashlib.sha256(payload).hexdigest()})
            archive.writestr(f"nightshift/{relative}", payload)
        archive.writestr("nightshift/SOURCE-MANIFEST.json", json.dumps(manifest, indent=2) + "\n")
    payload = args.output.read_bytes()
    print(json.dumps({"archive": str(args.output.resolve()), "files": len(files) + 1, "bytes": len(payload), "sha256": hashlib.sha256(payload).hexdigest()}, indent=2))


if __name__ == "__main__":
    main()

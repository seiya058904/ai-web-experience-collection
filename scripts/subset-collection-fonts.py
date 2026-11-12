"""Generate the four Collection-only font subsets; original work fonts stay intact.

Use an external virtualenv with scripts/collection-fonts-requirements.txt.
Run from any directory. --check regenerates in memory and verifies committed bytes.
"""
import argparse
import hashlib
import io
import json
from html.parser import HTMLParser
from importlib.metadata import version
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
SPECS = [
    ("grid", "Collection Grid Preview", "Collection Grid Roboto",
     "grid/fonts/RobotoFlex-Latin.woff2", "grid/licenses/RobotoFlex-OFL.txt", ["grid", "aurora", "anax"]),
    ("counterform", "Collection Counterform Preview", "Fraunces",
     "counterform/assets/fonts/Fraunces-Variable.woff2", "counterform/licenses/Fraunces-OFL.txt", ["counterform", "backstage"]),
    ("inkscape", "Collection Ink Preview", "Collection Ink Cormorant",
     "inkscape/fonts/CormorantGaramond-Light.woff2", "inkscape/fonts/OFL-Cormorant.txt", ["inkscape"]),
    ("mend", "Collection Mend Preview", "Collection Mend Newsreader",
     "mend/fonts/newsreader-latin-normal.woff2", "mend/licenses/Newsreader-OFL-1.1.txt", ["mend"]),
]


class GalleryText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.world = None
        self.texts = {}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a" and attrs.get("id", "").startswith("world-"):
            self.world = attrs["id"][6:]
            self.texts[self.world] = []
        if self.world and tag == "br":
            self.texts[self.world].append(" ")

    def handle_endtag(self, tag):
        if tag == "a":
            self.world = None

    def handle_data(self, data):
        if self.world:
            self.texts[self.world].append(data)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def axes(font):
    return [{"tag": a.axisTag, "min": a.minValue, "default": a.defaultValue, "max": a.maxValue}
            for a in font["fvar"].axes] if "fvar" in font else []


def generate(check):
    parser = GalleryText()
    parser.feed((ROOT / "pages/index.html").read_text(encoding="utf-8"))
    records = []
    for key, family, css_family, source, license_path, worlds in SPECS:
        text = " ".join(" ".join(parser.texts[world]) for world in worlds)
        text = " ".join(text.split())
        # Keep case variants used by CSS text-transform as well as source copy.
        requested = set(map(ord, text + text.upper() + text.lower()))
        original = (ROOT / "public" / source).read_bytes()
        font = TTFont(io.BytesIO(original), recalcTimestamp=False)
        original_cmap = font.getBestCmap()
        original_axes = axes(font)
        supported = requested & original_cmap.keys()
        options = subset.Options()
        options.layout_features = ["*"]
        options.name_IDs = ["*"]
        options.name_languages = ["*"]
        options.name_legacy = True
        options.notdef_outline = True
        options.recalc_timestamp = False
        options.harfbuzz_repacker = False
        subsetter = subset.Subsetter(options=options)
        subsetter.populate(unicodes=supported)
        subsetter.subset(font)

        # Distinct derivative names; preserve copyright, license and style names.
        ps_name = family.replace(" ", "")
        instance_names = {i.postscriptNameID for i in font["fvar"].instances
                          if i.postscriptNameID != 0xFFFF} if "fvar" in font else set()
        for record in font["name"].names:
            if record.nameID in {1, 3, 4, 6, 16, 18, 21, 25} | instance_names:
                value = f"{ps_name}-{record.nameID}" if record.nameID in instance_names else (
                    ps_name if record.nameID in {3, 6, 25} else family)
                record.string = value.encode(record.getEncoding())
        font.flavor = "woff2"
        buffer = io.BytesIO()
        font.save(buffer)
        output = buffer.getvalue()
        # Inspect the serialized artifact too, rather than trusting only options.
        result = TTFont(io.BytesIO(output))
        assert supported <= result.getBestCmap().keys()
        assert axes(result) == original_axes, f"Variable axes changed: {key}"
        assert len(output) < len(original), f"No size benefit: {key}"
        destination = f"collection/fonts/{key}-preview.woff2"
        target = ROOT / "public" / destination
        if check:
            assert target.read_bytes() == output, f"Regenerate {destination}"
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(output)
        records.append({
            "cssFamily": css_family, "internalFamily": family, "worlds": worlds,
            "source": source, "sourceBytes": len(original), "sourceSha256": digest(original),
            "output": destination, "bytes": len(output), "sha256": digest(output),
            "license": license_path, "licenseSha256": digest((ROOT / "public" / license_path).read_bytes()),
            "characters": "".join(map(chr, sorted(supported))),
            "originalFallbackCharacters": "".join(map(chr, sorted(requested - original_cmap.keys()))),
            "axes": original_axes,
        })
        print(f"{key}: {len(original):,} -> {len(output):,} bytes")
    manifest = {"generator": "scripts/subset-collection-fonts.py",
                "tools": {name: version(name) for name in ["fonttools", "brotli", "zopfli"]},
                "fonts": records}
    data = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    path = ROOT / "provenance/collection/font-subsets.json"
    if check:
        assert path.read_text(encoding="utf-8") == data, "Regenerate font-subsets.json"
    else:
        path.write_text(data, encoding="utf-8", newline="\n")


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--check", action="store_true")
    generate(cli.parse_args().check)

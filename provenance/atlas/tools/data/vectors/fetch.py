#!/usr/bin/env python3
"""Acquire the exact bounded, public source data used by ATLAS.

The checked-in source files are sufficient for an offline preprocessing rebuild.
This optional acquisition step contacts GSI and Natural Earth's public upstream.
It never needs a key, account, tile SDK, or live service in the built website.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import argparse
import hashlib
import json
import math
import time
import urllib.request
from datetime import datetime,timezone

ROOT = Path(__file__).resolve().parents[3]
DEST = ROOT / "data-source/vectors"
REGION = [138.54, 35.24, 138.99, 35.61]
CITY = [138.791, 35.474, 138.827, 35.505]


def tiles(bounds, z):
    w, s, e, n = bounds
    size = 2**z
    xx = lambda lon: math.floor((lon+180)/360*size)
    yy = lambda lat: math.floor((1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*size)
    return [(z, x, y) for x in range(xx(w), xx(e)+1) for y in range(yy(n), yy(s)+1)]


def get(url, path, refresh=False):
    path = DEST/path
    if refresh or not path.exists():
        req = urllib.request.Request(url, headers={"User-Agent":"ATLAS educational cartographic exhibit / bounded data export"})
        for attempt in range(3):
            try:
                with urllib.request.urlopen(req, timeout=45) as response:
                    payload = response.read()
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(payload)
                break
            except Exception:
                if attempt == 2:
                    raise
                time.sleep(1+attempt)
    payload = path.read_bytes()
    return {"path":str(path.relative_to(DEST)),"url":url,"bytes":len(payload),"sha256":hashlib.sha256(payload).hexdigest()}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--refresh", action="store_true", help="Replace pinned source snapshot with current upstream data")
    parser.add_argument("--workers",type=int,default=4)
    args=parser.parse_args()
    tasks=[]
    for z,x,y in tiles(CITY,16)+tiles(REGION,12):
        rel=f"gsi/{z}/{x}/{y}.pbf"
        url=f"https://cyberjapandata.gsi.go.jp/xyz/experimental_bvmap/{z}/{x}/{y}.pbf"
        tasks.append((url,Path(rel)))
    tasks.append(("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson",Path("natural-earth/ne_50m_land.geojson")))
    results=[]
    with ThreadPoolExecutor(max_workers=min(4,max(1,args.workers))) as pool:
        futures={pool.submit(get,u,p,args.refresh):p for u,p in tasks}
        for future in as_completed(futures):
            record=future.result()
            results.append(record)
            print(f"{len(results):02d}/{len(tasks)} {record['path']} {record['bytes']} bytes",flush=True)
    old_manifest=json.loads((DEST/'sources.json').read_text()) if (DEST/'sources.json').exists() else {}
    snapshot_date=datetime.now(timezone.utc).date().isoformat() if args.refresh or not old_manifest else old_manifest['snapshot_date']
    manifest={
        "snapshot_date":snapshot_date,
        "coordinate_reference":"EPSG:4326 longitude, latitude in degrees after MVT/Web Mercator decode",
        "gsi_source":"https://github.com/gsi-cyberjapan/gsimaps-vector-experiment",
        "gsi_license":"Japan Public Data License 1.0; source and processing attribution required",
        "gsi_terms":"https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html",
        "natural_earth_source":"https://github.com/nvkelso/natural-earth-vector",
        "natural_earth_license":"public domain",
        "city_bounds":CITY,"region_bounds":REGION,
        "files":sorted(results,key=lambda r:r['path'])
    }
    (DEST/"sources.json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n")


if __name__ == "__main__":
    main()

"""Render the complete, frozen PAS asset set with two concurrent EGL workers.

The rig directory must contain the 2,001-frame Unison and 153-frame Echo
exports. All output images are replaced; this never reuses older render data.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import argparse, hashlib, json, os, subprocess, sys, time

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('rig', type=Path)
parser.add_argument('--log-dir', type=Path)
parser.add_argument('--workers', type=int, default=2)
parser.add_argument('--threads', type=int, default=4)
args = parser.parse_args()
rig = args.rig.resolve()
logs = (args.log_dir or rig / 'render-logs').resolve()
logs.mkdir(parents=True, exist_ok=True)

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

packet_names = ['rig.json', 'rig.bin', 'frames-unison.json', 'frames-unison.bin',
                'frames-echo.json', 'frames-echo.bin']
frozen = {name: digest(rig / name) for name in packet_names}
rig_metadata = json.loads((rig / 'rig.json').read_text())
texture_paths = sorted({(rig / mesh.get('material', {}).get(key)).resolve()
                        for mesh in rig_metadata['meshes']
                        for key in ('map', 'bumpMap')
                        if mesh.get('material', {}).get(key)})
texture_hashes = {str(path): digest(path) for path in texture_paths}
renderer_hash = digest(ROOT / 'scripts/render-duet.py')
for mode, expected in [('unison', 2001), ('echo', 153)]:
    metadata = json.loads((rig / f'frames-{mode}.json').read_text())
    if len(metadata['frames']) != expected:
        raise RuntimeError(f'{mode}: expected {expected} frames')
    first = 0 if mode == 'unison' else 800
    if any(abs(float(frame['t']) - (first + i) / 200) > 1e-7
           for i, frame in enumerate(metadata['frames'])):
        raise RuntimeError(f'{mode}: export times do not match the density-200 grid')

common = [sys.executable, str(ROOT / 'scripts/render-duet.py'), str(rig / 'rig.json'),
          '--all', '--density', '200']
narrow = ['--width', '720', '--height', '960', '--camera-x', '2.25',
          '--camera-y', '1.35', '--camera-z', '4.83']
wide = ['--width', '1200', '--height', '900']
detail = ['--width', '800', '--height', '600', '--quality', '90']
jobs = [
    ('wide', 'unison', 'wide', wide + ['--quality', '88']),
    ('narrow', 'unison', 'narrow', narrow + ['--quality', '88']),
    ('echo-wide', 'echo', 'echo-wide', wide + ['--quality', '88']),
    ('echo-narrow', 'echo', 'echo-narrow', narrow + ['--quality', '88']),
    ('detail-feet', 'unison', 'detail-feet', detail + ['--detail', 'feet', '--start-index', '200', '--end-index', '353']),
    ('detail-hands-ch03', 'unison', 'detail-hands', detail + ['--detail', 'hands', '--detail-x', '.43', '--start-index', '400', '--end-index', '553']),
    ('detail-hands-ch09', 'unison', 'detail-hands', detail + ['--detail', 'hands', '--detail-x', '.43', '--start-index', '1596', '--end-index', '1661']),
]
environment = dict(os.environ, LP_NUM_THREADS=str(args.threads))
started = time.perf_counter()

def run(job):
    name, mode, directory, options = job
    command = common + ['--frames', str(rig / f'frames-{mode}.json'),
                        '--out', str(ROOT / 'public/frames' / directory),
                        '--report', str(logs / f'{name}.json')] + options
    print(json.dumps({'event': 'start', 'job': name}), flush=True)
    with (logs / f'{name}.log').open('w') as output:
        subprocess.run(command, env=environment, stdout=output,
                       stderr=subprocess.STDOUT, check=True)
    record = json.loads((logs / f'{name}.json').read_text())
    summary = {'event': 'complete', 'job': name, 'frames': record['frames'],
               'seconds': record['total_seconds']}
    print(json.dumps(summary), flush=True)
    return summary

results = []
with ThreadPoolExecutor(max_workers=args.workers) as pool:
    futures = [pool.submit(run, job) for job in jobs]
    for future in as_completed(futures):
        results.append(future.result())
after = {name: digest(rig / name) for name in packet_names}
if frozen != after:
    raise RuntimeError('The frozen rig packet changed during rendering')
if texture_hashes != {str(path): digest(path) for path in texture_paths}:
    raise RuntimeError('A source texture changed during rendering')
if renderer_hash != digest(ROOT / 'scripts/render-duet.py'):
    raise RuntimeError('The renderer changed during rendering')
record = {'status': 'completed', 'seconds': time.perf_counter() - started,
          'packetSha256': frozen, 'jobs': results,
          'textureSha256': texture_hashes, 'rendererSha256': renderer_hash}
(logs / 'complete.json').write_text(json.dumps(record, indent=2))
subprocess.run([sys.executable, str(ROOT / 'scripts/finalize-frames.py'),
                '--packet', str(rig)], check=True)
print(json.dumps({'event': 'finalized', 'frames': 4679,
                  'seconds': round(time.perf_counter() - started, 2)}), flush=True)

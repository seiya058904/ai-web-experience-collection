"""Create labelled contact sheets from verified final rendered frame files.

This does not render or capture a browser. Source images are only resized to
fit complete-frame panels; they are never cropped or retouched.
"""
from pathlib import Path
import hashlib, json
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FRAMES = ROOT / 'public/frames'
OUT = ROOT / 'docs/evidence'
manifest = json.loads((FRAMES / 'manifest.json').read_text())
if manifest.get('status') != 'complete' or manifest['density'] != 200 or manifest.get('floorY') != 0:
    raise RuntimeError('The final density-200, floor-zero manifest is required.')
integrity = json.loads((ROOT / 'docs/render-assets.json').read_text())
hashes = {entry['file']: entry['sha256'] for entry in integrity['files']}
OUT.mkdir(parents=True, exist_ok=True)

font_path = Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
def font(size):
    return ImageFont.truetype(str(font_path), size) if font_path.exists() else ImageFont.load_default(size=size)

paper, ink, muted = '#eee7dc', '#2d2924', '#635a4f'
width, height, panel, gutter, pad = 1528, 776, 288, 12, 20
for transition in range(1, 10):
    sheet = Image.new('RGB', (width, height), paper)
    draw = ImageDraw.Draw(sheet)
    draw.text((pad, 17), f'TR-{transition:02d}  |  CH-{transition:02d} to CH-{transition + 1:02d}', font=font(26), fill=ink)
    draw.text((pad, 52), 'Final offline rendered-frame evidence  |  Unison  |  density 200  |  ground y = 0', font=font(16), fill=muted)
    draw.text((pad, 82), 'WIDE  /  complete frames', font=font(15), fill=muted)
    draw.text((pad, 374), 'PORTRAIT  /  complete frames', font=font(15), fill=muted)
    indices = []
    for column, fraction in enumerate((0, .25, .5, .75, 1)):
        t = transition - 1 + .76 + .24 * fraction
        index = round(t * 200)
        indices.append(index)
        x = pad + column * (panel + gutter)
        for view, size, y in [('wide', (288, 216), 110), ('narrow', (216, 288), 402)]:
            path = FRAMES / view / f'{index:04d}.webp'
            relative = path.relative_to(ROOT).as_posix()
            if hashlib.sha256(path.read_bytes()).hexdigest() != hashes.get(relative):
                raise RuntimeError(f'Frame differs from final integrity record: {relative}')
            with Image.open(path) as source:
                image = source.convert('RGB').resize(size, Image.Resampling.LANCZOS)
            sheet.paste(image, (x + (panel - size[0]) // 2, y))
            label = f'{fraction:.0%}  |  t={index / 200:.3f}  |  #{index:04d}'
            draw.text((x + 3, y + size[1] + 8), label, font=font(14), fill=ink)
    draw.line((pad, 736, width - pad, 736), fill='#cfc2b1', width=1)
    draw.text((pad, 747), 'Not browser screenshots. Five sampled positions do not establish continuous playback or sub-frame contact.', font=font(14), fill=muted)
    target = OUT / f'transition-{transition:02d}.jpg'
    sheet.save(target, 'JPEG', quality=92, subsampling=0, optimize=True)
    print(json.dumps({'file': target.relative_to(ROOT).as_posix(), 'indices': indices, 'size': sheet.size}))

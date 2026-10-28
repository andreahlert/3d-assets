"""Copy and optimise kit files into the site.

    python3 tools/prepare.py <solarpunk-pack dir>
"""
import json
import re
import shutil
import struct
import subprocess
import sys
from pathlib import Path

from PIL import Image

PACK = Path(sys.argv[1]).resolve()
SITE = Path(__file__).resolve().parent.parent
OUT = SITE / 'assets' / 'solarpunk'
ORDER = ['Energy', 'Water & Garden', 'Props', 'Nature', 'Modular', 'Outdoor']


def slug(name):
    return name.lower().replace(' & ', '_').replace(' ', '_')


def glb_tris(path):
    data = path.read_bytes()
    n = struct.unpack_from('<I', data, 12)[0]
    gltf = json.loads(data[20:20 + n])
    tris = 0
    for mesh in gltf['meshes']:
        for prim in mesh['primitives']:
            acc = prim.get('indices', prim['attributes']['POSITION'])
            tris += gltf['accessors'][acc]['count'] // 3
    return tris


def registry():
    pat = re.compile(r"^\s*\('([^']+)',\s*'([^']+)',", re.M)
    out = []
    for mod in ('props', 'modular', 'extras'):
        src = (PACK / 'build' / f'{mod}.py').read_text()
        block = src[src.index('\nASSETS = ['):]
        block = block[:block.index('\n]') + 2]
        out += pat.findall(block)
    return out


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    for d in ('glb', 'thumbs', 'gallery', 'palettes'):
        (OUT / d).mkdir(parents=True)

    assets = []
    for name, cat in registry():
        s = slug(name)
        glb = PACK / 'dist' / 'glb' / f'{s}.glb'
        shutil.copy(glb, OUT / 'glb' / glb.name)
        im = Image.open(PACK / 'dist' / 'previews' / 'thumbs' / f'{s}.png').convert('RGBA')
        im.resize((320, 320), Image.LANCZOS).save(OUT / 'thumbs' / f'{s}.webp', quality=82)
        assets.append({'name': name, 'cat': 'Modular' if cat.startswith('Modular') else cat,
                       'slug': s, 'tris': glb_tris(glb)})
    assets.sort(key=lambda a: (ORDER.index(a['cat']), a['name']))

    for src in sorted((PACK / 'store' / 'gallery').glob('*.jpg')):
        Image.open(src).convert('RGB').resize((1440, 720), Image.LANCZOS).save(
            OUT / 'gallery' / f'{src.stem}.webp', quality=80)
    Image.open(PACK / 'store' / 'gallery' / '01_featured.jpg').convert('RGB').resize(
        (1200, 600), Image.LANCZOS).save(SITE / 'assets' / 'og.jpg', quality=85)

    shutil.copy(PACK / 'dist' / 'textures' / 'spk_palette.png', OUT / 'palettes' / 'summer.png')
    for p in ('autumn', 'winter'):
        shutil.copy(PACK / 'dist' / 'textures' / 'palettes' / f'spk_palette_{p}.png', OUT / 'palettes' / f'{p}.png')

    # Trailer poster: the night shot, 24 s in.
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', '24', '-i',
                    str(PACK / 'dist' / 'previews' / 'solarpunk_cozy_kit_trailer.mp4'), '-frames:v', '1',
                    '-vf', 'scale=1280:-1', '-c:v', 'libwebp', '-quality', '80', str(OUT / 'trailer_poster.webp')],
                   check=True)

    (OUT / 'assets.json').write_text(json.dumps(assets, indent=1))
    print(len(assets), 'assets', sum(f.stat().st_size for f in OUT.rglob('*') if f.is_file()) // 1024, 'KB')


main()

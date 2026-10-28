# André Ahlert · 3D assets

Portfolio site for my stylized low poly game assets. Live at https://andreahlert.github.io/3d-assets/

Plain HTML, CSS and JavaScript, no build step. The 3D previews use [model-viewer](https://modelviewer.dev).

## Update the asset files

```bash
python3 tools/prepare.py ../solarpunk-pack
```

Copies the GLBs, makes WebP thumbnails and gallery images, the trailer poster and `assets.json` (needs Pillow and ffmpeg).

## Run locally

```bash
python3 -m http.server 8000
```

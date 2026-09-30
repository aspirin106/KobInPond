"""Export the four Imagegen PNGs: python tools/prepare-textures.py BRICK ROCK LEAF VINE."""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

output = Path(__file__).resolve().parents[1] / "images" / "generated"
output.mkdir(parents=True, exist_ok=True)
assert len(sys.argv) == 5, "Supply brick, rock, leaf and vine source PNGs"
for name, source in zip(("brick", "rock", "leaf", "vine"), sys.argv[1:]):
    image = Image.open(source).convert("RGBA" if name == "leaf" else "RGB")
    size = 512 if name == "leaf" else 1024
    image = image.resize((size, size), Image.Resampling.LANCZOS)
    target = output / f"{name}-albedo.webp"
    image.save(target, "WEBP", quality=90, method=6)
    if name == "leaf":
        alpha = np.array(Image.open(target).convert("RGBA"))[:, :, 3]
        assert alpha.min() == 0 and alpha.max() == 255, "Leaf needs actual transparent and opaque pixels"
        assert (alpha == 0).mean() > 0.15, "Transparent margin must survive export"
        continue
    # ponytail: approximate relief from luminance; use authored height maps if physical accuracy matters.
    height_image = image.resize((512, 512), Image.Resampling.LANCZOS)
    height = np.array(height_image.convert("L").filter(ImageFilter.GaussianBlur(1)), dtype=np.float32) / 255
    dx = (np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)) * 1.5
    dy = (np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)) * 1.5
    normal = np.stack((-dx, dy, np.ones_like(height)), axis=2)
    normal /= np.linalg.norm(normal, axis=2, keepdims=True)
    normal = np.clip((normal * 0.5 + 0.5) * 255, 0, 255).astype(np.uint8)
    Image.fromarray(normal).save(output / f"{name}-normal.webp", "WEBP", lossless=True, method=6)
    roughness = np.clip(200 + height * 40, 0, 255).astype(np.uint8)
    Image.fromarray(roughness).save(output / f"{name}-roughness.webp", "WEBP", lossless=True, method=6)
    assert np.isfinite(normal).all() and normal[:, :, 2].min() > 200
assert len(list(output.glob("*.webp"))) == 10
print("PASS: 10 runtime textures exported; leaf alpha preserved, normal maps finite.")

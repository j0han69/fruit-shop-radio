from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
fruit_dir = root / "assets" / "fruits"
output_dir = fruit_dir / "small"
output_dir.mkdir(parents=True, exist_ok=True)

for name in ("orange", "lemon", "strawberry", "watermelon"):
    source = fruit_dir / f"{name}.png"
    target = output_dir / f"{name}.png"
    with Image.open(source) as image:
        image = image.convert("RGBA")
        image.thumbnail((320, 320), Image.Resampling.LANCZOS)
        image.save(target, optimize=True)
        print(target)

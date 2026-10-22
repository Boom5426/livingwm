"""Regenerate the site's image assets from their sources.

Figure 1 is converted from the proposal's vector PDF, so the web version keeps
the exact glyphs of the PDF. Headshots are downloaded from each organizer's
homepage and cropped to squares. The social preview image is a headless-Chrome
screenshot of tools/og.html.

Requires pdftocairo (poppler), Pillow, and Google Chrome or Chromium:

    python3 tools/build_assets.py \
        --figure-pdf ../figures/Figure1_living_world_models.pdf \
        --chrome google-chrome
"""

from __future__ import annotations

import argparse
import io
import subprocess
import urllib.request
from pathlib import Path

from PIL import Image

SITE = Path(__file__).resolve().parent.parent
IMG = SITE / "assets" / "img"

# Source URL and square crop box (left, top, right, bottom) in source pixels.
# Boxes are centred on the face so the head fills about three quarters of the
# frame where the source resolution allows. The first three photos come from
# the organizers' homepages, Mengyue Yang's from her University of Bristol
# research profile, and the rest from the Scientific World Models workshop
# site, which the same organizers maintain.
SWM_PEOPLE = "https://taoyongcui.github.io/scientific-world-models/assets/img/people"
PHOTOS: dict[str, tuple[str, tuple[int, int, int, int] | None]] = {
    "bo-li": ("https://boom5426.github.io/images/CV_me.jpg", (0, 25, 500, 525)),
    "taoyong-cui": ("https://taoyongcui.github.io/assets/homepage/img/taoyong-cui.jpg", (180, 20, 620, 460)),
    "ling-yang": ("https://yangling0818.github.io/images/ling-yang.jpg", (100, 5, 585, 490)),
    "yingcheng-wu": (f"{SWM_PEOPLE}/yingcheng-wu.webp", (124, 52, 384, 312)),
    "zhenfei-yin": (f"{SWM_PEOPLE}/zhenfei-yin.webp", (54, 0, 614, 560)),
    "lu-mi": (f"{SWM_PEOPLE}/lu-mi.webp", (101, 40, 541, 480)),
    "dandan-zhang": (f"{SWM_PEOPLE}/dandan-zhang.webp", (0, 0, 236, 236)),
    "mengyue-yang": ("https://research-information.bris.ac.uk/files-asset/498307234/profile_photo.jpeg", (155, 60, 595, 500)),
    "philip-torr": (f"{SWM_PEOPLE}/philip-torr.webp", None),
    "pheng-ann-heng": (f"{SWM_PEOPLE}/pheng-ann-heng.webp", (6, 4, 256, 254)),
}
PHOTO_SIZE = 400  # px, upper bound; smaller sources are kept at native size
# Some hosts (the Bristol research portal) refuse urllib's default agent.
USER_AGENT = "livingwm-site-builder/1.0 (+https://boom5426.github.io/livingwm/)"
PHOTO_QUALITY = 82
OG_SIZE = (1200, 630)  # Open Graph recommended size


def build_figure(pdf: Path) -> None:
    """Convert Figure 1 from PDF to SVG with pdftocairo."""
    out = IMG / "figure1.svg"
    subprocess.run(["pdftocairo", "-svg", str(pdf), str(out)], check=True)
    print(f"wrote {out.relative_to(SITE)} ({out.stat().st_size} B)")


def build_photos() -> None:
    """Download, crop and resize organizer headshots to square WebP."""
    out_dir = IMG / "people"
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, (url, box) in PHOTOS.items():
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=30) as resp:
            img = Image.open(io.BytesIO(resp.read())).convert("RGB")
        if box is not None:
            img = img.crop(box)
        if img.width != img.height:
            raise ValueError(f"{name}: crop is {img.size}, expected a square")
        side = min(PHOTO_SIZE, img.width)  # never upscale a small source
        img = img.resize((side, side), Image.Resampling.LANCZOS)
        out = out_dir / f"{name}.webp"
        img.save(out, "WEBP", quality=PHOTO_QUALITY, method=6)
        print(f"wrote {out.relative_to(SITE)} ({out.stat().st_size} B)")


def build_og(chrome: str) -> None:
    """Screenshot tools/og.html to the social preview PNG."""
    out = IMG / "og.png"
    subprocess.run(
        [
            chrome,
            "--headless",
            "--disable-gpu",
            "--hide-scrollbars",
            "--force-device-scale-factor=1",
            f"--window-size={OG_SIZE[0]},{OG_SIZE[1]}",
            f"--screenshot={out}",
            (SITE / "tools" / "og.html").as_uri(),
        ],
        check=True,
        capture_output=True,
    )
    with Image.open(out) as img:
        if img.size != OG_SIZE:
            raise ValueError(f"og.png is {img.size}, expected {OG_SIZE}")
    print(f"wrote {out.relative_to(SITE)} ({out.stat().st_size} B)")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--figure-pdf", type=Path, help="Figure 1 vector PDF from the proposal repo")
    parser.add_argument("--chrome", help="Chrome/Chromium binary for the social preview image")
    parser.add_argument("--skip-photos", action="store_true", help="do not download headshots")
    args = parser.parse_args()

    if args.figure_pdf:
        build_figure(args.figure_pdf)
    if not args.skip_photos:
        build_photos()
    if args.chrome:
        build_og(args.chrome)


if __name__ == "__main__":
    main()

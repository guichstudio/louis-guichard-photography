#!/usr/bin/env python3
"""Build the sketchbook pages (carnet.html) from the raw scans.

Usage:
    python3 gen_sketchbook.py ["/path/to/scans"]

Each scan is a PNG of an open spread on a transparent background. We crop to the
visible spread (alpha bounding box), flatten onto white, and write two JPEGs:
a full version (1800px wide) for the viewer and a thumb (420px) for the
filmstrip. Spreads are ordered by date (newest first); assets/sketchbook.js
is rewritten.
"""
import json, os, sys
from PIL import Image

PROJ = os.path.dirname(os.path.abspath(__file__))
SRC = sys.argv[1] if len(sys.argv) > 1 else "/Users/louisguichard/Desktop/louis scqn"
OUT = os.path.join(PROJ, "assets", "img", "sketchbook")

# Every spread, with the date written on it (empty when the page is undated).
# The list is sorted by date, newest first; undated spreads keep their order here
# and are appended at the end. Dates marked ~ are inferred from the position of
# the page in the physical sketchbook, between two dated neighbours.
PAGES = [
    ("IMG_20260627_0054.png",  "2026-06-11", "Mayaudel · Lyon, 06.26"),
    ("IMG_20260627_0053.png",  "2026-05-15", "Bed, widow's school · Mumbai, 05.26"),
    ("IMG_20260627_0052.png",  "2026-04-26", "Wudang, 04.26"),
    ("IMG_20260627_00051.png", "2026-04-25", "Wudang golden temple, 04.26"),
    ("IMG_20260627_0035.png",  "2026-04-05", "Krabi, 04.26"),
    ("IMG_20260627_0034.png",  "2026-03-15", "Bangkok, 03.26"),
    ("IMG_20260627_0033.png",  "2025-12-15", "12.25"),
    ("IMG_20260627_0032.png",  "2025-11-20", "11.25"),
    ("IMG_20260627_0031.png",  "2025-11-06", "Annapurna base camp, 11.25"),
    ("IMG_20260627_0030.png",  "2025-10-02", "Sinuwa, 10.25"),
    ("IMG_20260627_00029.png", "2025-07-15", "Marseille, 07.25"),
    ("IMG_20260627_0009.png",  "2025-05-01", "Je sais pas ce que c'est"),   # ~
    ("IMG_20260627_0008.png",  "2025-04-23", "Central Park · New York, 04.25"),
    ("IMG_20260627_0007.png",  "2025-04-20", "04.25"),
    ("IMG_20260627_0006.png",  "2025-04-20", "04.25"),
    ("1112.png",               "2025-01-08", "Old sugar mill · Kauai, 01.25"),
    ("44.png",                 "2025-01-07", "NASA observatory · Big Island, 01.25"),
    ("33.png",                 "2025-01-06", "Blue Lagoon · Big Island, 01.25"),
    ("18.png",                 "2025-01-05", "Green Sand Beach road · Big Island, 01.25"),
    ("22.png",                 "2025-01-04", "Black sand beach · Big Island, 01.25"),
    ("17.png",                 "2025-01-03", "Hawaii, 01.25"),                # ~
    ("16.png",                 "2025-01-02", "Road to Honolulu, 01.25"),
    ("15.png",                 "2025-01-01", "Oahu, 01.25"),
    ("14.png",                 "2024-12-31", "Honolulu, 12.24"),
    ("13.png",                 "2024-12-30", "Maui, 12.24"),
    ("12.png",                 "2024-12-29", "Maui, 12.24"),
    ("11.png",                 "2024-12-28", "Maui, 12.24"),
    ("5.png",                  "2024-10-12", "Lisbon – Marseille, 10.24"),
    ("7.png",                  "2024-10-02", "Jardim da Graça · Lisbon, 10.24"),
    ("6.png",                  "2024-08-14", "Glacier National Park, 08.24"),
    ("IMG_20260627_0002.png",  "2024-07-15", "Marseille, 07.24"),
    ("4.png",                  "2024-07-10", "Maldormé · Marseille, 07.24"),
    ("IMG_20260627_0001.png",  "2024-05-15", "New York, 05.24"),
    ("2.png.png",              "2024-05-10", "NYC subway, 05.24"),

    # Undated spreads, kept in this order at the end of the carnet.
    ("kook.png",               "", "New York"),
    ("3.png",                  "", "New York"),
    ("123.png",                "", ""),
    ("445.png",                "", ""),
    ("104.png",                "", ""),
    ("111.png",                "", ""),
    ("1234.png",               "", ""),
    ("3333.png",               "", ""),
    ("345.png",                "", ""),
    ("455.png",                "", ""),
    ("45443.png",              "", ""),
    ("40940.png",              "", ""),
]

# newest first; undated last, in the order listed above
PAGES = (sorted([p for p in PAGES if p[1]], key=lambda p: p[1], reverse=True)
         + [p for p in PAGES if not p[1]])

FULL_W, THUMB_W, FULL_Q, THUMB_Q = 1600, 420, 66, 60


def export(im, width, quality, path):
    w, h = im.size
    if w > width:
        im = im.resize((width, round(h * width / w)), Image.LANCZOS)
    im.save(path, "JPEG", quality=quality, optimize=True, progressive=True)
    return im.size


def main():
    os.makedirs(os.path.join(OUT, "thumbs"), exist_ok=True)
    for f in os.listdir(OUT):
        if f.endswith(".jpg"):
            os.remove(os.path.join(OUT, f))
    for f in os.listdir(os.path.join(OUT, "thumbs")):
        if f.endswith(".jpg"):
            os.remove(os.path.join(OUT, "thumbs", f))

    pages = []
    for i, (name, date, caption) in enumerate(PAGES, 1):
        path = os.path.join(SRC, name)
        if not os.path.exists(path):
            print("missing:", path)
            continue
        im = Image.open(path)
        if im.mode in ("RGBA", "LA"):
            box = im.getchannel("A").getbbox()
            if box:
                im = im.crop(box)
            flat = Image.new("RGB", im.size, "white")
            flat.paste(im, mask=im.getchannel("A"))
            im = flat
        else:
            im = im.convert("RGB")

        num = "%02d" % i
        w, h = export(im, FULL_W, FULL_Q, os.path.join(OUT, "page-%s.jpg" % num))
        export(im, THUMB_W, THUMB_Q, os.path.join(OUT, "thumbs", "page-%s.jpg" % num))
        pages.append({
            "src": "assets/img/sketchbook/page-%s.jpg" % num,
            "thumb": "assets/img/sketchbook/thumbs/page-%s.jpg" % num,
            "caption": caption, "date": date, "w": w, "h": h,
        })
        print("page-%s  %s  %dx%d" % (num, name, w, h))

    with open(os.path.join(PROJ, "assets", "sketchbook.js"), "w") as fh:
        fh.write("// Generated by gen_sketchbook.py. Do not edit by hand.\n")
        fh.write("window.SKETCHBOOK = " + json.dumps(pages, ensure_ascii=False, indent=2) + ";\n")
    print("sketchbook.js written:", len(pages), "spreads")


if __name__ == "__main__":
    main()

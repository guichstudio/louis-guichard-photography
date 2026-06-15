#!/usr/bin/env python3
"""Generate assets/data.js from assets/manifest.json. Run via build.sh."""
import json, os

PROJ = os.path.dirname(os.path.abspath(__file__))
man = json.load(open(os.path.join(PROJ, "assets", "manifest.json")))

# slug -> (title, subtitle)
meta = {
    "light":           ("Light", "Light & geometries"),
    "black-and-white": ("Black & White", "Grain & shadow"),
    "life":            ("Life", "Fragments of the everyday"),
    "on-the-road":     ("On the Road", "Setting out on adventures"),
    "hawaii":          ("Hawaii", "Pacific light"),
}
order = ["light", "black-and-white", "life", "on-the-road", "hawaii"]

# Hand-picked hover covers (override the default first-image cover)
cover_overrides = {
    "life": "assets/img/covers/life.jpg",
}

projects = []
for slug in order:
    imgs = man.get(slug, [])
    title, sub = meta[slug]
    cover = cover_overrides.get(slug) or (imgs[0]["src"] if imgs else "")
    projects.append({
        "slug": slug, "title": title, "subtitle": sub,
        "cover": cover, "count": len(imgs),
    })

site = {
    "name": "Louis Guichard",
    "tagline": "Photographer",
    "intro": "Photographs by Louis Guichard.",
    "email": "guich.studio@gmail.com",
    "instagram": "https://www.instagram.com/",
    "facebook": "https://www.facebook.com/",
}

with open(os.path.join(PROJ, "assets", "data.js"), "w") as f:
    f.write("// Generated from manifest.json — do not edit by hand.\n")
    f.write("window.SITE = " + json.dumps(site, ensure_ascii=False, indent=2) + ";\n")
    f.write("window.PROJECTS = " + json.dumps(projects, ensure_ascii=False, indent=2) + ";\n")
    f.write("window.GALLERIES = " + json.dumps(man, ensure_ascii=False) + ";\n")
print("data.js written:", len(projects), "projects")

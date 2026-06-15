# Louis Guichard — Photography

Minimalist photography portfolio (static site, no build step required).
Structure inspired by the classic splash → series-index → gallery flow.

## Pages
- `index.html` — splash (name, *Enter*, social links)
- `work.html` — series index (hover a title to preview its cover)
- `gallery.html?p=<slug>` — vertical photo gallery with lightbox
- `about.html`, `contact.html`

Galleries: **Light**, **Black & White**, **Life**, **On the Road**, **Hawaii**.

## Run locally
Open via a local server (needed so `data.js` / images load correctly):

```bash
cd louis-guichard-photography
python3 -m http.server 8080
# then open http://localhost:8080
```

## Replace the photos
1. Put your new photos in a folder with these sub-folders:
   `BW` `Hawai` `Life` `Light` `road`
2. Regenerate (resizes to 1600px, JPEG q65, rebuilds `assets/data.js`):

```bash
./build.sh "/path/to/your/photos"
```

## Edit titles / links
Series titles, subtitles, order, email and social links live in `gen_data.py`
(`meta`, `order`, `site`) — edit there and re-run `./build.sh`, or edit the
generated `assets/data.js` directly for a quick change.

## Stack
Plain HTML + CSS + vanilla JS. Deployable as-is on GitHub Pages, Netlify, Vercel, etc.

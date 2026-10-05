# PhuongHuongWedding

Online wedding invitation for **Việt Phương & Ninh Hương** — wedding ceremony on 18 · 10 · 2026.

A static HTML/CSS/JS site with no build step. RSVPs and guestbook wishes are stored in a
Google Sheet through a small Google Apps Script. The visual design comes from the
*Thiep Cuoi* project on claude.ai/design (Classical design system).

## Stack

| Need | Choice | Cost |
| --- | --- | --- |
| Hosting | GitHub Pages (serves this repo as-is) | Free |
| Storing RSVPs and wishes | Google Sheet + Apps Script web app — see [`backend/`](backend/README.md) | Free |
| Add to calendar | Google Calendar links + static `.ics` files in `calendar/` | Free |

## Run locally

```bash
npm start        # http://localhost:3000
```

Or open `index.html` directly in a browser. While `apiEndpoint` is empty the site runs in
**demo mode**: RSVPs and wishes are kept in your own browser, so every flow can be tried
without a backend.

## Layout

| Path | Role |
| --- | --- |
| `index.html` | Invitation content (Vietnamese copy) |
| `js/config.js` | **Everything you normally edit**: theme, backend URL, wish presets, photos, map links, bank accounts |
| `js/wedding.js` | Theme switcher, countdown, scroll reveal, RSVP + guestbook forms, petal backdrop |
| `css/classical.css` | Classical design system, kept verbatim from the design project |
| `css/wedding.css` | The five palettes and the page layout |
| `calendar/*.ics` | One calendar file per event (must keep CRLF line endings — see `.gitattributes`) |
| `backend/Code.gs` | Apps Script that writes to the Google Sheet and serves the wish list |
| `assets/photos/` | Wedding photos, QR codes, map screenshots, `share.jpg` (the 1200×630 link preview) |
| `assets/audio/song.mp3` | Background music, started by the tap on the opening seal |

## Before sending the invitation

1. **Backend** — follow [`backend/README.md`](backend/README.md) and paste the web app URL into `apiEndpoint`.
2. **Photos** — put files in `assets/photos/` and set their paths under `photos` in `js/config.js`.
   Slots without a photo show a placeholder frame.
3. **Maps** — replace `maps` with the exact pinned Google Maps links of both venues.
4. **Gift box** — fill in `gift.groom` / `gift.bride` (bank, account number) and add the QR images.
5. **Theme** — the site ships in `rose` (Dusty Rose · Burgundy). `showThemePicker: true` shows the palette strip so every theme can be tried; set it to `false` once one is chosen. The opening curtains follow the active palette.
   Preview any palette with `?theme=navy`.
5b. **Opening curtains and music** — `intro` shows the curtains once per browser session
   (`?intro=0` skips it, `?intro=1` always shows it); `music.src` points at the song, and an empty string removes the music and the button.
   Only use a song you may publish.
6. **Event times** — if a time or venue changes, update it in `index.html` (schedule, RSVP options,
   Google Calendar links) and in the matching `calendar/*.ics` file.

## Deploy to GitHub Pages

Repo **Settings → Pages → Deploy from a branch → `master` / `(root)`**. The site is then served at
`https://onlycodee.github.io/PhuongHuongWedding/`. GitHub Pages on a free plan needs a public repo.

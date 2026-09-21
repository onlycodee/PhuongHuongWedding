# Backend setup — Google Sheet + Apps Script

RSVPs and guestbook wishes are stored in a Google Sheet. A small Apps Script web app
(`Code.gs`) is the only "server". It is free and takes about five minutes to set up.

## One-time setup

1. Create a new Google Sheet (any name, e.g. **PhuongHuongWedding**).
2. In the sheet: **Extensions → Apps Script**.
3. Delete the sample code, paste the whole content of [`Code.gs`](Code.gs), and save.
4. **Deploy → New deployment → Select type: Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, approve the permission prompt, and copy the **Web app URL**
   (it ends with `/exec`).
6. Paste that URL into `apiEndpoint` in [`js/config.js`](../js/config.js), commit and push.

The `RSVP` and `Wishes` tabs are created automatically on the first submission.

## Day-to-day

- **Guest list:** the `RSVP` tab has one row per guest. A guest who edits their answer
  updates their own row. Sum the `Guests` column for a head count.
- **Hide a wish:** type anything (e.g. `x`) in the `Hidden` column of the `Wishes` tab.
  It disappears from the website on the next page load.
- **Add a wish by hand:** add a row to `Wishes` (the `Message` column must not be empty).

## Changing the script later

After editing `Code.gs` in the Apps Script editor, publish it with
**Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**.
That keeps the same URL. Creating a *new deployment* instead gives a new URL that you
would have to paste into `js/config.js` again.

## Limits and privacy

- The website only ever reads the wish list (name, relation, message, date).
  RSVP data is never exposed by the script.
- Free Apps Script quotas (about 20,000 calls per day) are far beyond what a wedding needs.
- The endpoint URL is public, like any form endpoint. The script caps field lengths,
  ignores bots that fill the hidden honeypot field, and neutralises spreadsheet formulas.

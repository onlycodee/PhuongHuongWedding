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
- **Guestbook order:** longer wishes first → sent on a later day first → guests who confirmed
  attendance first → guests attending more days first → newest first. The rule lives in
  `compareWishes` in `Code.gs`. A wish is linked to its author's RSVP through the `Guest ID`
  column (one anonymous ID per browser), so a wish sent from a different device than the RSVP
  ranks as "not confirmed".
- **Add a wish by hand:** add a row to `Wishes` (the `Message` column must not be empty).

## Changing the script later

After editing `Code.gs` in the Apps Script editor, publish it with
**Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**.
That keeps the same URL. Creating a *new deployment* instead gives a new URL that you
would have to paste into `js/config.js` again.

## Limits and privacy

- The website only ever reads the wish list (name, relation, message, date).
  RSVP data is never exposed by the script.
- Quotas on a free Gmail account are far beyond what a wedding needs. Google documents no
  daily cap on web app requests; the limit that matters is 30 requests running at the same
  moment. Submissions are saved one at a time (about a second each), so only a burst of
  10 or more guests pressing "send" within the same few seconds would see a retry message.
  See https://developers.google.com/apps-script/guides/services/quotas
- The endpoint URL is public, like any form endpoint. The script caps field lengths,
  ignores bots that fill the hidden honeypot field, and neutralises spreadsheet formulas.

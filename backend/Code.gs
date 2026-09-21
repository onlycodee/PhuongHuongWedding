/**
 * PhuongHuongWedding backend — Google Apps Script bound to a Google Sheet.
 *
 * Stores RSVPs and guestbook wishes in two tabs of the spreadsheet and serves
 * the public wish list back to the website. Setup steps are in backend/README.md.
 *
 *   POST type=rsvp  → upsert one row in "RSVP" (keyed by guestId); a non-empty
 *                     note is also added to "Wishes"
 *   POST type=wish  → append one row to "Wishes"
 *   GET  ?action=wishes → JSON list of visible wishes, newest first
 *
 * Moderation: type anything in the "Hidden" column of a wish to take it off the site.
 */

const SHEETS = {
  rsvp: {
    name: 'RSVP',
    header: ['Guest ID', 'Updated at', 'Name', 'Side', 'Attending', 'Guests', 'Events', 'Note']
  },
  wishes: {
    name: 'Wishes',
    header: ['Created at', 'Name', 'Relation', 'Message', 'Source', 'Hidden']
  }
};
const LIMITS = { name: 80, relation: 80, message: 500, events: 300, wishesReturned: 200 };

function doGet(e) {
  const action = (e.parameter.action || '').toLowerCase();
  if (action === 'wishes') return json({ ok: true, wishes: listWishes() });
  return json({ ok: true, service: 'PhuongHuongWedding' });
}

function doPost(e) {
  const p = e.parameter || {};
  // Honeypot: real guests never fill the hidden "website" field.
  if (p.website) return json({ ok: true });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (p.type === 'rsvp') return json(saveRsvp(p));
    if (p.type === 'wish') return json(saveWish(p));
    return json({ ok: false, error: 'Unknown type' });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function saveRsvp(p) {
  const name = clean(p.name, LIMITS.name);
  if (!name) return { ok: false, error: 'Name is required' };
  const attending = p.attending === 'yes';
  const events = clean(p.events, LIMITS.events);
  if (attending && !events) return { ok: false, error: 'Pick at least one event' };

  const guestId = clean(p.guestId, 64) || Utilities.getUuid();
  const note = clean(p.note, LIMITS.message);
  const side = p.side === 'bride' ? 'Nhà gái' : 'Nhà trai';
  const guests = attending ? Math.min(Math.max(parseInt(p.guests, 10) || 1, 1), 20) : 0;
  const row = [guestId, new Date(), name, side, attending ? 'Có' : 'Không', guests, events, note];

  // A guest who edits their answer updates their row instead of adding a new one.
  const sheet = getSheet(SHEETS.rsvp);
  const ids = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
  let rowIndex = -1;
  for (let i = 1; i < ids.length; i++) {
    if (ids[i][0] === guestId) { rowIndex = i + 1; break; }
  }
  if (rowIndex > 0) sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  else sheet.appendRow(row);

  if (note && rowIndex < 0) {
    getSheet(SHEETS.wishes).appendRow([new Date(), name, 'Khách ' + side.toLowerCase(), note, 'rsvp', '']);
  }
  return { ok: true, guestId: guestId };
}

function saveWish(p) {
  const name = clean(p.name, LIMITS.name);
  const message = clean(p.message, LIMITS.message);
  if (!name || !message) return { ok: false, error: 'Name and message are required' };
  getSheet(SHEETS.wishes).appendRow([new Date(), name, clean(p.relation, LIMITS.relation), message, 'guestbook', '']);
  return { ok: true };
}

function listWishes() {
  const sheet = getSheet(SHEETS.wishes);
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const rows = sheet.getRange(2, 1, last - 1, SHEETS.wishes.header.length).getValues();
  const wishes = [];
  for (let i = rows.length - 1; i >= 0 && wishes.length < LIMITS.wishesReturned; i--) {
    const r = rows[i];
    if (r[5] || !r[3]) continue; // hidden by the couple, or empty
    wishes.push({
      name: String(r[1]),
      relation: String(r[2]),
      message: String(r[3]),
      createdAt: r[0] instanceof Date ? r[0].toISOString() : ''
    });
  }
  return wishes;
}

/** Returns the tab, creating it with a bold frozen header on first use. */
function getSheet(def) {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(def.name);
  if (!sheet) {
    sheet = book.insertSheet(def.name);
    sheet.appendRow(def.header);
    sheet.getRange(1, 1, 1, def.header.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Trims, caps the length, and defuses spreadsheet formulas typed by a guest. */
function clean(value, max) {
  let s = String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

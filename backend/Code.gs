/**
 * PhuongHuongWedding backend — Google Apps Script bound to a Google Sheet.
 *
 * Stores RSVPs, guestbook wishes and the hidden game's leaderboard ("Bảng vàng") in three tabs of the
 * spreadsheet and serves the public wish list and leaderboard back to the website.
 * Setup steps are in backend/README.md.
 *
 *   POST type=rsvp  → upsert one row in "RSVP" (keyed by guestId); a non-empty
 *                     note is also added to "Wishes"
 *   POST type=wish  → append one row to "Wishes"
 *   POST type=score → save a game score in "Scores" (one row per guest and game, best score kept)
 *   GET  ?action=wishes → JSON list of visible wishes, in guestbook order (see compareWishes)
 *   GET  ?action=scores → JSON top scores for every game (see listScores)
 *
 * Moderation: type anything in the "Hidden" column of a wish or of a score to take it off the site.
 */

const SHEETS = {
  rsvp: {
    name: 'RSVP',
    header: ['Guest ID', 'Updated at', 'Name', 'Side', 'Attending', 'Guests', 'Events', 'Note']
  },
  wishes: {
    name: 'Wishes',
    header: ['Created at', 'Name', 'Relation', 'Message', 'Source', 'Hidden', 'Guest ID']
  },
  scores: {
    name: 'Scores',
    header: ['Created at', 'Name', 'Game', 'Score', 'Guest ID', 'Hidden']
  }
};
const TIME_ZONE = 'Asia/Ho_Chi_Minh';
const LIMITS = { name: 80, relation: 80, message: 500, events: 300, wishesReturned: 200, scoreMax: 5000, scoresPerGame: 10 };
// Game id → the least score that earns a place on the board. Keep in step with MODES (goal) in js/game.js.
const GAME_GOALS = { rush: 60, chase: 12, match: 12, keepup: 10 };

function doGet(e) {
  const action = (e.parameter.action || '').toLowerCase();
  if (action === 'wishes') return json({ ok: true, wishes: listWishes() });
  if (action === 'scores') return json({ ok: true, scores: listScores(e.parameter.guestId) });
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
    if (p.type === 'score') return json(saveScore(p));
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
    getSheet(SHEETS.wishes).appendRow([new Date(), name, 'Khách ' + side.toLowerCase(), note, 'rsvp', '', guestId]);
  }
  return { ok: true, guestId: guestId };
}

function saveWish(p) {
  const name = clean(p.name, LIMITS.name);
  const message = clean(p.message, LIMITS.message);
  if (!name || !message) return { ok: false, error: 'Name and message are required' };
  getSheet(SHEETS.wishes).appendRow(
    [new Date(), name, clean(p.relation, LIMITS.relation), message, 'guestbook', '', clean(p.guestId, 64)]);
  return { ok: true };
}

/**
 * Saves a game score. A guest (browser) keeps ONE row per game with their best score, so the board
 * cannot be filled by replaying; scores below the game's goal or above a sane maximum are refused.
 */
function saveScore(p) {
  const mode = String(p.mode || '');
  const score = parseInt(p.score, 10);
  if (!Object.prototype.hasOwnProperty.call(GAME_GOALS, mode)) return { ok: false, error: 'Unknown game' };
  if (!(score >= GAME_GOALS[mode]) || score > LIMITS.scoreMax) return { ok: false, error: 'Score out of range' };
  const name = clean(p.name, LIMITS.name) || 'Khách mời';
  const guestId = clean(p.guestId, 64);

  const sheet = getSheet(SHEETS.scores);
  const last = sheet.getLastRow();
  if (guestId && last > 1) {
    const rows = sheet.getRange(2, 1, last - 1, SHEETS.scores.header.length).getValues();
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][4]) !== guestId || rows[i][2] !== mode) continue;
      const rowIndex = i + 2, best = Number(rows[i][3]);
      if (score > best) sheet.getRange(rowIndex, 1, 1, 5).setValues([[new Date(), name, mode, score, guestId]]);
      else sheet.getRange(rowIndex, 2).setValue(name);
      return { ok: true, best: Math.max(score, best) };
    }
  }
  sheet.appendRow([new Date(), name, mode, score, guestId, '']);
  return { ok: true, best: score };
}

/**
 * Top scores per game, best first (an earlier score wins a tie). `mine` marks the caller's own row when the
 * website passes its anonymous guest ID; IDs themselves are never sent out.
 */
function listScores(guestId) {
  const out = {};
  Object.keys(GAME_GOALS).forEach(function (m) { out[m] = []; });
  const sheet = getSheet(SHEETS.scores);
  const last = sheet.getLastRow();
  if (last < 2) return out;
  const rows = sheet.getRange(2, 1, last - 1, SHEETS.scores.header.length).getValues();
  const byGame = {};
  for (const r of rows) {
    if (r[5] || !Object.prototype.hasOwnProperty.call(GAME_GOALS, r[2])) continue; // hidden, or unknown game
    (byGame[r[2]] = byGame[r[2]] || []).push({
      name: String(r[1]),
      score: Number(r[3]),
      time: r[0] instanceof Date ? r[0].getTime() : 0,
      mine: Boolean(guestId) && String(r[4]) === String(guestId)
    });
  }
  Object.keys(byGame).forEach(function (m) {
    byGame[m].sort(function (a, b) { return (b.score - a.score) || (a.time - b.time); });
    out[m] = byGame[m].slice(0, LIMITS.scoresPerGame).map(function (x) {
      return { name: x.name, score: x.score, mine: x.mine };
    });
  });
  return out;
}

/**
 * Visible wishes in display order (see compareWishes). The author's RSVP is looked up by
 * guest ID only to rank the wish; attendance itself is never sent to the website.
 */
function listWishes() {
  const sheet = getSheet(SHEETS.wishes);
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const rsvps = rsvpByGuestId();
  const rows = sheet.getRange(2, 1, last - 1, SHEETS.wishes.header.length).getValues();
  const wishes = [];
  for (const r of rows) {
    if (r[5] || !r[3]) continue; // hidden by the couple, or empty
    const created = r[0] instanceof Date ? r[0] : null;
    const rsvp = rsvps[String(r[6])] || { attending: false, days: 0 };
    wishes.push({
      name: String(r[1]),
      relation: String(r[2]),
      message: String(r[3]),
      createdAt: created ? created.toISOString() : '',
      rank: {
        words: countWords(String(r[3])),
        day: created ? Utilities.formatDate(created, TIME_ZONE, 'yyyyMMdd') : '',
        time: created ? created.getTime() : 0,
        attending: rsvp.attending,
        days: rsvp.days
      }
    });
  }
  wishes.sort(compareWishes);
  return wishes.slice(0, LIMITS.wishesReturned).map(function (w) {
    return { name: w.name, relation: w.relation, message: w.message, createdAt: w.createdAt };
  });
}

/**
 * Guestbook order: longer wishes first → sent on a later day first → guests who confirmed
 * attendance first → guests attending more days first → newest first.
 * "Sent" is compared by calendar day; exact timestamps never tie, which would leave the
 * attendance criteria without any effect.
 */
function compareWishes(a, b) {
  return (b.rank.words - a.rank.words)
    || (a.rank.day < b.rank.day ? 1 : a.rank.day > b.rank.day ? -1 : 0)
    || (Number(b.rank.attending) - Number(a.rank.attending))
    || (b.rank.days - a.rank.days)
    || (b.rank.time - a.rank.time);
}

function countWords(text) {
  const words = text.trim().split(/\s+/);
  return words[0] ? words.length : 0;
}

/** Number of distinct dates (dd/mm) among the chosen events, e.g. "Tiệc nhà trai 17/10, Lễ vu quy 18/10" → 2. */
function attendedDays(events) {
  const dates = String(events).match(/\d{1,2}\/\d{1,2}/g) || [];
  return dates.filter(function (d, i) { return dates.indexOf(d) === i; }).length;
}

function rsvpByGuestId() {
  const sheet = getSheet(SHEETS.rsvp);
  const last = sheet.getLastRow();
  const map = {};
  if (last < 2) return map;
  const rows = sheet.getRange(2, 1, last - 1, SHEETS.rsvp.header.length).getValues();
  for (const r of rows) {
    const attending = r[4] === 'Có';
    if (r[0]) map[String(r[0])] = { attending: attending, days: attending ? attendedDays(r[6]) : 0 };
  }
  return map;
}

/** Returns the tab, creating it with a bold frozen header on first use (and adding header cells for new columns). */
function getSheet(def) {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(def.name);
  if (!sheet) {
    sheet = book.insertSheet(def.name);
    sheet.setFrozenRows(1);
  }
  const header = sheet.getRange(1, 1, 1, def.header.length);
  if (!header.getCell(1, def.header.length).getValue()) {
    header.setValues([def.header]).setFontWeight('bold');
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

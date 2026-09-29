(() => {
  'use strict';

  const cfg = window.WEDDING_CONFIG || {};
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, val) { try { localStorage.setItem(key, val); } catch (e) {} },
    del(key) { try { localStorage.removeItem(key); } catch (e) {} }
  };

  const THEMES = [
    { id: 'hien-dai', label: 'Hiện đại' },
    { id: 'sage', label: 'Sage · Ivory · Gold' },
    { id: 'navy', label: 'Navy · Champagne' },
    { id: 'rose', label: 'Dusty Rose · Burgundy' },
    { id: 'truyen-thong', label: 'Đỏ Việt · Vàng cổ' }
  ];
  // Backdrop settings per theme: density, fall speed, opacity,
  // and mix = relative share of each falling shape (dust is the only one that cannot be popped)
  const ATM = {
    'hien-dai':     { density: 0.55, speed: 0.9,  alpha: 0.5,
                      mix: { rose: 0.38, heart: 0.08, flower: 0.14, star: 0.05, dust: 0.35 } },
    'sage':         { density: 0.7,  speed: 0.8,  alpha: 0.45,
                      mix: { rose: 0.4, heart: 0.07, flower: 0.2, star: 0.03, dust: 0.3 } },
    'navy':         { density: 0.4,  speed: 0.6,  alpha: 0.55,
                      mix: { rose: 0.1, heart: 0.04, flower: 0.06, star: 0.18, dust: 0.62 } },
    'rose':         { density: 0.9,  speed: 0.85, alpha: 0.5,
                      mix: { rose: 0.36, heart: 0.22, flower: 0.2, star: 0.04, dust: 0.18 } },
    'truyen-thong': { density: 0.8,  speed: 0.95, alpha: 0.55,
                      mix: { rose: 0.32, heart: 0.2, flower: 0.18, star: 0.08, dust: 0.22 } }
  };

  let atm = null;

  /* ===== Theme ===== */
  function activeTheme() {
    const t = root.getAttribute('data-wed-theme');
    return ATM[t] ? t : 'hien-dai';
  }
  function initThemes() {
    root.setAttribute('data-wed-theme', activeTheme());
    const strip = $('#theme-strip');
    if (!strip || !cfg.showThemePicker) return;
    const chips = THEMES.map((t) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'wed-theme-chip';
      chip.textContent = t.label;
      chip.addEventListener('click', () => {
        root.setAttribute('data-wed-theme', t.id);
        store.set('phw-theme', t.id);
        if (atm) atm.configure(t.id);
        sync();
      });
      strip.appendChild(chip);
      return chip;
    });
    const sync = () => chips.forEach((chip, i) =>
      chip.setAttribute('aria-pressed', String(THEMES[i].id === activeTheme())));
    sync();
    strip.hidden = false;
  }

  /* ===== Optional sections, photos, maps, gift accounts ===== */
  function initSections() {
    const toggle = (sel, on) => { const el = $(sel); if (el && on === false) el.hidden = true; };
    toggle('#dem-nguoc', cfg.showCountdown);
    toggle('#mung-cuoi', cfg.showGift);
    toggle('#luu-but', cfg.showGuestbook);
  }
  function initPhotos() {
    const photos = cfg.photos || {};
    for (const slot of $$('[data-slot]')) {
      const src = photos[slot.getAttribute('data-slot')];
      if (!src) continue;
      const img = new Image();
      img.alt = slot.getAttribute('data-alt') || '';
      img.decoding = 'async';
      if (!slot.hasAttribute('data-eager')) img.loading = 'lazy';
      img.addEventListener('load', () => slot.classList.add('is-filled'));
      img.addEventListener('error', () => img.remove());
      img.src = src;
      slot.appendChild(img);
    }
  }
  function initMaps() {
    const maps = cfg.maps || {};
    for (const a of $$('[data-map]')) {
      const url = maps[a.getAttribute('data-map')];
      if (url) a.href = url;
    }
  }
  function initGift() {
    const gift = cfg.gift || {};
    for (const card of $$('[data-gift]')) {
      const info = gift[card.getAttribute('data-gift')];
      const btn = $('[data-copy]', card);
      if (!info || !info.account || !btn) continue;
      $('.wed-gift-account', card).textContent = [info.bank, info.account].filter(Boolean).join(' · ');
      btn.disabled = false;
      const label = btn.textContent;
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(info.account);
          btn.textContent = 'Đã sao chép';
        } catch (e) {
          btn.textContent = info.account;
        }
        setTimeout(() => { btn.textContent = label; }, 1800);
      });
    }
  }

  /* ===== Countdown ===== */
  function initCountdown() {
    const cells = {};
    for (const el of $$('[data-cd]')) cells[el.getAttribute('data-cd')] = el;
    if (!cells.d) return;
    const target = new Date(cfg.weddingTime || '2026-10-18T11:00:00+07:00').getTime();
    const p = (n) => String(n).padStart(2, '0');
    let timer = 0;
    const tick = () => {
      let ms = target - Date.now();
      if (ms <= 0) { ms = 0; clearInterval(timer); }
      cells.d.textContent = String(Math.floor(ms / 86400000));
      cells.h.textContent = p(Math.floor(ms / 3600000) % 24);
      cells.m.textContent = p(Math.floor(ms / 60000) % 60);
      cells.s.textContent = p(Math.floor(ms / 1000) % 60);
    };
    timer = setInterval(tick, 1000);
    tick();
  }

  /* ===== Reveal on scroll ===== */
  function initReveal() {
    if (reducedMotion) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('wed-in');
        io.unobserve(e.target);
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    for (const el of $$('[data-reveal]')) {
      // siblings are staggered by 70ms
      let i = 0, p = el.previousElementSibling;
      while (p) { if (p.hasAttribute('data-reveal')) i++; p = p.previousElementSibling; }
      el.style.transitionDelay = Math.min(i, 4) * 70 + 'ms';
      io.observe(el);
    }
    // Fast scrolls and anchor jumps can skip IntersectionObserver callbacks — never leave content hidden.
    const sweep = () => {
      for (const el of $$('[data-reveal]:not(.wed-in)')) {
        if (el.getBoundingClientRect().top < innerHeight * 0.94) {
          el.classList.add('wed-in');
          io.unobserve(el);
        }
      }
    };
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; sweep(); });
    };
    sweep();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    addEventListener('hashchange', () => setTimeout(sweep, 350));
  }

  /* ===== Backend: Google Apps Script web app (backend/Code.gs) =====
     With no apiEndpoint configured the site runs in demo mode and keeps
     submissions in this browser only, so every flow can be tried locally. */
  const api = {
    async send(payload) {
      if (!cfg.apiEndpoint) return demoBackend.send(payload);
      // A form-encoded body keeps this a "simple" CORS request: no preflight, which Apps Script cannot answer.
      const res = await fetch(cfg.apiEndpoint, { method: 'POST', body: new URLSearchParams(payload) });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Request failed');
      return data;
    },
    async wishes() {
      if (!cfg.apiEndpoint) return demoBackend.wishes();
      const res = await fetch(cfg.apiEndpoint + '?action=wishes');
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Request failed');
      return data.wishes || [];
    }
  };
  const demoBackend = {
    wishes() {
      try { return JSON.parse(store.get('phw-demo-wishes')) || []; } catch (e) { return []; }
    },
    send(p) {
      const wish = p.type === 'wish'
        ? { name: p.name, relation: p.relation, message: p.message }
        : (p.note && p.firstTime ? { name: p.name, relation: '', message: p.note } : null);
      if (wish) store.set('phw-demo-wishes', JSON.stringify([wish].concat(this.wishes())));
      return { ok: true };
    }
  };

  /* ===== Form helpers ===== */
  // Shows or clears the inline error of one .field (pass '' to clear)
  function setFieldError(field, message) {
    const error = $('.wed-field-error', field);
    field.classList.toggle('has-error', Boolean(message));
    error.textContent = message;
    error.hidden = !message;
    for (const input of $$('.input, [type="checkbox"]', field)) {
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
  }
  function validateName(input) {
    const name = input.value.trim();
    const message = !name ? 'Bạn vui lòng cho biết họ tên nhé.'
      : name.length < 2 ? 'Họ tên cần ít nhất 2 ký tự.' : '';
    setFieldError(input.closest('.field'), message);
    return !message;
  }
  // Locks the submit button while a request is in flight; returns the unlock function
  function busy(button, label) {
    const original = button.textContent;
    button.disabled = true;
    button.textContent = label;
    return () => { button.disabled = false; button.textContent = original; };
  }
  // One anonymous ID per browser. It lets the backend update a guest's RSVP row on edit
  // and link their guestbook wishes to that RSVP (used for the guestbook order).
  function guestId() {
    let id = store.get('phw-guest-id');
    if (!id) {
      try { id = (JSON.parse(store.get('phw-rsvp')) || {}).guestId; } catch (e) {}
      id = id || ((window.crypto && crypto.randomUUID) ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2));
      store.set('phw-guest-id', id);
    }
    return id;
  }

  /* ===== One-tap wish presets ===== */
  function initPresets() {
    const presets = cfg.wishPresets || [];
    for (const box of $$('[data-presets-for]')) {
      const target = document.getElementById(box.getAttribute('data-presets-for'));
      if (!target) continue;
      const chips = presets.map((preset) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'wed-preset';
        chip.textContent = preset.label;
        chip.addEventListener('click', () => {
          target.value = preset.text;
          target.dispatchEvent(new Event('input', { bubbles: true }));
          target.focus();
        });
        box.appendChild(chip);
        return chip;
      });
      // A chip stays highlighted only while the box still holds its exact text
      target.addEventListener('input', () => chips.forEach((chip, i) =>
        chip.setAttribute('aria-pressed', String(target.value === presets[i].text))));
    }
  }

  /* ===== Popovers: mobile nav menu and "add to calendar" ===== */
  function initPopovers() {
    const pops = $$('.wed-pop');
    for (const pop of pops) {
      pop.addEventListener('click', (e) => { if (e.target.closest('a')) pop.open = false; });
      pop.addEventListener('toggle', () => {
        if (pop.open) pops.forEach((other) => { if (other !== pop) other.open = false; });
      });
    }
    document.addEventListener('click', (e) => {
      for (const pop of pops) if (pop.open && !pop.contains(e.target)) pop.open = false;
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') pops.forEach((pop) => { pop.open = false; });
    });
  }

  /* ===== RSVP ===== */
  function initRsvp() {
    const form = $('#rsvp-form'), sent = $('#rsvp-sent'), error = $('#rsvp-error');
    if (!form || !sent) return;
    const submitBtn = $('[type="submit"]', form);
    const eventsField = $('#rsvp-events');
    const eventBoxes = $$('[name="events"]', form);

    const validateEvents = () => {
      const ok = eventBoxes.some((el) => el.checked);
      setFieldError(eventsField, ok ? '' : 'Bạn vui lòng chọn ít nhất một buổi tham dự.');
      return ok;
    };
    const read = (attending) => ({
      guestId: guestId(),
      name: form.elements.name.value.trim(),
      side: form.elements.side.value,
      events: attending ? eventBoxes.filter((el) => el.checked).map((el) => el.value) : [],
      guests: attending ? Number(form.elements.guests.value) : 0,
      note: form.elements.note.value.trim(),
      attending
    });
    const fill = (data) => {
      form.elements.name.value = data.name || '';
      form.elements.side.value = data.side || 'groom';
      form.elements.note.value = data.note || '';
      if (data.attending) {
        eventBoxes.forEach((el) => { el.checked = (data.events || []).includes(el.value); });
        form.elements.guests.value = String(data.guests || 1);
      }
    };
    const showSent = (data) => {
      $('#rsvp-sent-kicker').textContent = data.attending ? 'Hẹn gặp bạn' : 'Đã ghi nhận';
      $('#rsvp-sent-name').textContent = data.name || 'bạn';
      $('#rsvp-sent-body').textContent = data.attending
        ? 'Hai gia đình đã ghi nhận phản hồi của bạn. Hẹn gặp bạn trong ngày vui!'
        : 'Hai gia đình rất tiếc vì bạn không đến được, nhưng vẫn cảm ơn bạn đã gửi lời chúc. Mong gặp bạn vào một dịp gần nhất!';
      form.hidden = true;
      sent.hidden = false;
    };
    const respond = async (attending) => {
      // Declining only needs a name; attending also needs at least one event.
      const nameOk = validateName(form.elements.name);
      const eventsOk = attending ? validateEvents() : (setFieldError(eventsField, ''), true);
      if (!nameOk || !eventsOk) {
        const first = $('.has-error .input, .has-error input', form);
        if (first) first.focus();
        return;
      }
      const firstTime = !store.get('phw-rsvp');
      const data = read(attending);
      error.hidden = true;
      const done = busy(submitBtn, 'Đang gửi…');
      try {
        await api.send({
          type: 'rsvp',
          guestId: data.guestId,
          name: data.name,
          side: data.side,
          attending: attending ? 'yes' : 'no',
          guests: String(data.guests),
          events: data.events.join(', '),
          note: data.note,
          website: form.elements.website.value,
          firstTime: firstTime ? '1' : ''
        });
        store.set('phw-rsvp', JSON.stringify(data));
        showSent(data);
        // The backend copies a first-time note into the guestbook, so show it right away.
        if (firstTime && data.note) {
          document.dispatchEvent(new CustomEvent('phw:wish', { detail: {
            name: data.name,
            relation: data.side === 'bride' ? 'Khách nhà gái' : 'Khách nhà trai',
            message: data.note
          } }));
        }
      } catch (e) {
        error.hidden = false;
      } finally {
        done();
      }
    };

    form.addEventListener('submit', (e) => { e.preventDefault(); respond(true); });
    $('#rsvp-decline').addEventListener('click', () => respond(false));
    $('#rsvp-reset').addEventListener('click', () => {
      sent.hidden = true;
      form.hidden = false;
    });
    // Errors clear as soon as the guest fixes the field
    form.elements.name.addEventListener('input', () => {
      if (form.elements.name.closest('.field').classList.contains('has-error')) validateName(form.elements.name);
    });
    eventsField.addEventListener('change', () => {
      if (eventsField.classList.contains('has-error')) validateEvents();
    });

    // A returning guest sees the answer they already sent
    try {
      const saved = JSON.parse(store.get('phw-rsvp'));
      if (saved) { fill(saved); showSent(saved); }
    } catch (e) { store.del('phw-rsvp'); }
  }

  /* ===== Guestbook: wishes are loaded from and saved to the backend =====
   * One wish shows at a time; it slides to the next every few seconds, and arrows either
   * side page by hand. The strip is a native scroller (swipe, wheel and keyboard all work);
   * a few cards are cloned at both ends so it loops without a visible jump. */
  function initGuestbook() {
    const form = $('#wish-form'), list = $('#wish-list');
    if (!form || !list || cfg.showGuestbook === false) return;
    const status = $('#wish-status');
    const thanks = $('#wish-thanks'), error = $('#wish-error');
    const submitBtn = $('[type="submit"]', form);
    const messageField = form.elements.message.closest('.field');
    const SLIDE_EVERY = 3000;
    let wishes = [], step = 0, reps = 0, timer = 0, settle = 0, held = false, hovered = false, inView = true;

    const card = (wish) => {
      const el = document.createElement('article');
      el.className = 'card';
      const add = (cls, text) => {
        const p = document.createElement('p');
        p.className = cls;
        p.textContent = text; // textContent, never innerHTML: wishes are untrusted input
        el.appendChild(p);
      };
      add('wed-wish', wish.message);
      add('card-title', wish.name);
      if (wish.relation) add('card-kicker', wish.relation);
      return el;
    };
    const prev = $('#wish-prev'), next = $('#wish-next'), count = $('#wish-count');
    const clone = (wish) => { const el = card(wish); el.setAttribute('aria-hidden', 'true'); return el; };
    const n = () => wishes.length;
    const mod = (i) => ((i % n()) + n()) % n();
    // Which wish sits at the left edge right now
    const current = () => step ? mod(Math.round((list.scrollLeft - reps * step) / step)) : 0;
    const jumpTo = (i) => { list.scrollLeft = (reps + i) * step; };

    const render = (first) => {
      status.textContent = 'Hãy là người đầu tiên gửi lời chúc tới cô dâu chú rể.';
      if (!n()) { list.replaceChildren(); list.style.height = ''; prev.hidden = next.hidden = count.hidden = true; stop(); return; }
      const keep = first === undefined ? current() : first;
      const cards = wishes.map(card);
      list.replaceChildren(...cards);
      // Fractional: card widths come from vw, and a rounded step would drift off the snap points
      step = cards[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(list).columnGap) || 0);
      // Enough clones on each side to fill the viewport plus one card
      reps = Math.ceil(list.clientWidth / step) + 1;
      const before = [], after = [];
      for (let k = 0; k < reps; k++) {
        before.push(clone(wishes[mod(k - reps)]));
        after.push(clone(wishes[mod(k)]));
      }
      list.prepend(...before);
      list.append(...after);
      prev.hidden = next.hidden = count.hidden = n() < 2;
      jumpTo(keep);
      fit(reps + keep);
      schedule();
    };
    const prepend = (wish) => { wishes.unshift(wish); render(0); };

    // The strip is as tall as the wish on show, not the longest one
    const fit = (slot) => {
      const el = list.children[slot];
      if (el) list.style.height = el.offsetHeight + 'px';
      count.textContent = (mod(slot - reps) + 1) + ' / ' + n();
    };
    // Once the scroller settles beyond the real cards, slip back by one lap: same picture, new position
    const wrap = () => {
      if (!step || !n()) return;
      const x = list.scrollLeft, lo = reps * step, hi = (reps + n()) * step;
      if (x >= hi - 2) list.scrollLeft = x - n() * step;
      else if (x < lo - 2) list.scrollLeft = x + n() * step;
    };
    const settled = () => { wrap(); fit(Math.round(list.scrollLeft / step)); };
    const stop = () => { clearTimeout(timer); timer = 0; };
    const schedule = () => {
      stop();
      if (reducedMotion || n() < 2) return;
      timer = setTimeout(slide, SLIDE_EVERY);
    };
    const go = (dir) => {
      wrap();
      const slot = Math.round(list.scrollLeft / step) + dir;
      list.scrollTo({ left: slot * step, behavior: reducedMotion ? 'auto' : 'smooth' });
      fit(slot);
      schedule();
    };
    const slide = () => {
      timer = 0;
      if (held || hovered || !inView || document.hidden) return;
      go(1);
    };
    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    list.addEventListener('scroll', () => {
      clearTimeout(settle);
      settle = setTimeout(settled, 120);
      if (timer) schedule(); // any movement pushes the next slide back
    }, { passive: true });
    list.addEventListener('pointerdown', () => { held = true; });
    const release = () => { held = false; schedule(); };
    list.addEventListener('pointerup', release);
    list.addEventListener('pointercancel', release);
    list.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hovered = true; });
    list.addEventListener('pointerleave', () => { hovered = false; held = false; schedule(); });
    list.addEventListener('focusin', () => { hovered = true; });
    list.addEventListener('focusout', () => { hovered = false; schedule(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        inView = entries[0].isIntersecting;
        if (inView) schedule();
      }, { threshold: 0.2 }).observe(list);
    }
    let resizeTimer = 0;
    addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { if (n()) render(); }, 150);
    });
    const validateMessage = () => {
      const message = form.elements.message.value.trim()
        ? '' : 'Bạn vui lòng viết đôi lời chúc, hoặc chọn một lời chúc có sẵn nhé.';
      setFieldError(messageField, message);
      return !message;
    };

    document.addEventListener('phw:wish', (e) => prepend(e.detail));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameOk = validateName(form.elements.name);
      const messageOk = validateMessage();
      if (!nameOk || !messageOk) {
        $('.has-error .input', form).focus();
        return;
      }
      const wish = {
        name: form.elements.name.value.trim(),
        relation: form.elements.relation.value.trim(),
        message: form.elements.message.value.trim()
      };
      thanks.hidden = true;
      error.hidden = true;
      const done = busy(submitBtn, 'Đang gửi…');
      try {
        await api.send(Object.assign(
          { type: 'wish', guestId: guestId(), website: form.elements.website.value }, wish));
        // The backend decides the order; a wish the guest just sent still shows first until reload.
        prepend(wish);
        form.elements.message.value = '';
        form.elements.message.dispatchEvent(new Event('input', { bubbles: true }));
        thanks.hidden = false;
      } catch (err) {
        error.hidden = false;
      } finally {
        done();
      }
    });
    form.elements.name.addEventListener('input', () => {
      if (form.elements.name.closest('.field').classList.contains('has-error')) validateName(form.elements.name);
    });
    form.elements.message.addEventListener('input', () => {
      if (messageField.classList.contains('has-error')) validateMessage();
    });

    // Guests who already sent an RSVP don't have to type their name again
    try {
      const saved = JSON.parse(store.get('phw-rsvp'));
      if (saved && saved.name) form.elements.name.value = saved.name;
    } catch (e) {}

    api.wishes().then((loaded) => {
      // Keep anything the guest sent while the list was still loading
      wishes = wishes.concat(loaded);
      render(0);
    }).catch(() => {
      status.textContent = 'Chưa tải được lời chúc. Bạn thử tải lại trang nhé.';
    });
  }

  /* ===== Animated backdrop: rose petals, hearts and light dust on a canvas ===== */
  function initAtmosphere() {
    const canvas = $('.wed-atm-canvas');
    if (!canvas || reducedMotion) return null;
    const ctx = canvas.getContext('2d');
    const rand = (a, b) => a + Math.random() * (b - a);
    const state = {
      items: [], w: 0, h: 0, dpr: 1, cfg: null, target: 0.6, level: 0.6,
      scrollV: 0, lastY: scrollY, raf: 0, bursts: [],
      colorFrom: null, colorTo: null, colorNow: null, cx: 1
    };

    // Each shape keeps ONE colour role for its whole life, so particles never flicker between colours.
    // On a theme change every role's colour eases to the new value (0.9s) instead of jumping.
    const ROLE = {
      rose: '--wed-accent', heart: '--wed-primary', dust: '--wed-secondary',
      star: '--wed-accent', flower: '--wed-accent'
    };
    const toRGB = (v) => {
      const p = document.createElement('span');
      p.style.color = v; document.body.appendChild(p);
      const m = getComputedStyle(p).color.match(/[\d.]+/g) || [150, 150, 150];
      p.remove();
      return [+m[0], +m[1], +m[2]];
    };
    const readColors = () => {
      const cs = getComputedStyle(root);
      const next = {};
      for (const k in ROLE) next[k] = toRGB(cs.getPropertyValue(ROLE[k]).trim() || '#999');
      state.colorFrom = state.colorTo ? Object.assign({}, state.colorNow || state.colorTo) : next;
      state.colorTo = next;
      state.cx = state.colorFrom === next ? 1 : 0;
      state.colorNow = Object.assign({}, state.colorFrom);
    };
    const roleColor = (role, a) => {
      const c = state.colorNow[role] || [150, 150, 150];
      return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + a.toFixed(3) + ')';
    };
    const budget = () => {
      const area = state.w * state.h;
      const mobile = state.w < 640;
      return Math.round(Math.min(mobile ? 26 : 58, (area / 26000) * state.cfg.density));
    };
    // Size range (radius in px) per shape
    const SIZE = {
      dust: [0.8, 2.2], heart: [3.4, 6.4], rose: [4, 8.4],
      star: [3.8, 6.8], flower: [4, 7.2]
    };
    // Weighted pick from the theme's mix; poppableOnly leaves out dust
    const pickShape = (poppableOnly) => {
      const m = state.cfg.mix;
      const shapes = Object.keys(m).filter((k) => !(poppableOnly && k === 'dust'));
      let r = Math.random() * shapes.reduce((sum, k) => sum + m[k], 0);
      for (const k of shapes) if ((r -= m[k]) < 0) return k;
      return shapes[shapes.length - 1];
    };
    const spawn = (init, shape) => {
      const sh = shape || pickShape();
      const dust = sh === 'dust';
      return {
        shape: sh,
        grow: 1,                                // newborns from a pop start at 0 and swell in
        x: rand(-0.05, 1.05) * state.w,
        y: init ? rand(-0.1, 1) * state.h : rand(-0.15, -0.02) * state.h,
        z: rand(0.45, 1),                       // depth → parallax
        r: rand(SIZE[sh][0], SIZE[sh][1]),
        vy: rand(6, 17) * state.cfg.speed,
        sway: rand(10, 34),
        swayT: rand(0, Math.PI * 2),
        swaySpeed: rand(0.12, 0.34),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.25, 0.25),
        flip: rand(0, Math.PI * 2),
        flipSpeed: rand(0.1, 0.26),
        a: dust ? rand(0.25, 0.7) : rand(0.26, 0.56)
      };
    };
    const fill = (init) => {
      const n = budget();
      while (state.items.length < n) state.items.push(spawn(init));
      state.items.length = Math.min(state.items.length, n);
    };
    const resize = () => {
      state.dpr = Math.min(devicePixelRatio || 1, 1.6);
      state.w = innerWidth; state.h = innerHeight;
      canvas.width = Math.round(state.w * state.dpr);
      canvas.height = Math.round(state.h * state.dpr);
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      fill(true);
    };
    // Outline of each poppable shape around the origin; s is its radius
    const PATHS = {
      heart(s) {
        const w = s * 1.15, h = s * 1.1;
        ctx.moveTo(0, h);
        ctx.bezierCurveTo(-w * 1.35, h * 0.1, -w * 0.78, -h * 1.12, 0, -h * 0.4);
        ctx.bezierCurveTo(w * 0.78, -h * 1.12, w * 1.35, h * 0.1, 0, h);
      },
      // rose petal: round tip, pinched base
      rose(s) {
        const w = s, h = s * 1.5;
        ctx.moveTo(0, h);
        ctx.bezierCurveTo(-w * 0.9, h * 0.42, -w * 1.02, -h * 0.62, 0, -h);
        ctx.bezierCurveTo(w * 1.02, -h * 0.62, w * 0.9, h * 0.42, 0, h);
      },
      // five-pointed star
      star(s) {
        for (let i = 0; i < 10; i++) {
          const ang = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? s * 0.55 : s * 1.3;
          ctx[i ? 'lineTo' : 'moveTo'](Math.cos(ang) * rad, Math.sin(ang) * rad);
        }
        ctx.closePath();
      },
      // five-petal blossom: each petal is a loop that leaves and returns to the centre
      flower(s) {
        const reach = s * 2, spread = 0.62;
        for (let k = 0; k < 5; k++) {
          const ang = -Math.PI / 2 + k * Math.PI * 2 / 5;
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(Math.cos(ang - spread) * reach, Math.sin(ang - spread) * reach,
            Math.cos(ang + spread) * reach, Math.sin(ang + spread) * reach, 0, 0);
        }
      }
    };
    const draw = (item, alphaMul) => {
      const grow = item.grow == null ? 1 : item.grow;
      const a = item.a * grow * (alphaMul == null ? state.level * state.cfg.alpha : alphaMul);
      if (a <= 0.004) return;
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.fillStyle = roleColor(item.shape, a);
      if (item.shape === 'dust') {
        ctx.beginPath(); ctx.arc(0, 0, item.r * item.z, 0, Math.PI * 2); ctx.fill();
        ctx.restore(); return;
      }
      ctx.rotate(item.rot);
      // flip around the vertical axis so shapes seem to tumble in space rather than slide as flat sprites
      const squeeze = 0.42 + 0.58 * Math.abs(Math.cos(item.flip));
      const s = item.r * item.z * (0.35 + 0.65 * grow);
      ctx.scale(squeeze, 1);
      ctx.beginPath();
      (PATHS[item.shape] || PATHS.rose)(s);
      ctx.fill();
      ctx.restore();
    };
    let last = performance.now();
    const frame = (now) => {
      state.raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      if (document.hidden) return;
      state.level += (state.target - state.level) * Math.min(dt * 1.2, 1);
      state.scrollV += (0 - state.scrollV) * Math.min(dt * 2.2, 1);
      if (state.cx < 1) {
        state.cx = Math.min(1, state.cx + dt / 0.9);
        const e = state.cx * state.cx * (3 - 2 * state.cx);
        for (const k in state.colorTo) {
          const f = state.colorFrom[k] || state.colorTo[k], t = state.colorTo[k];
          state.colorNow[k] = [f[0] + (t[0] - f[0]) * e, f[1] + (t[1] - f[1]) * e, f[2] + (t[2] - f[2]) * e];
        }
      }
      ctx.clearRect(0, 0, state.w, state.h);
      for (let i = state.items.length - 1; i >= 0; i--) {
        const it = state.items[i];
        it.swayT += it.swaySpeed * dt;
        it.x += Math.sin(it.swayT) * it.sway * dt;
        it.y += (it.vy * it.z + state.scrollV * 26 * it.z) * dt;
        it.rot += it.vr * dt;
        it.flip += it.flipSpeed * dt;
        if (it.grow < 1) it.grow = Math.min(1, it.grow + dt * 1.6);
        if (it.y - 30 > state.h || it.x < -80 || it.x > state.w + 80) {
          // Shapes added by pops leave for good, so the sky drifts back to its normal density
          if (it.extra) { state.items.splice(i, 1); continue; }
          Object.assign(it, spawn(false));
        }
        draw(it);
      }
      for (let i = state.bursts.length - 1; i >= 0; i--) {
        const b = state.bursts[i];
        b.life -= dt;
        if (b.life <= 0) { state.bursts.splice(i, 1); continue; }
        b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 42 * dt; b.rot += b.vr * dt; b.flip += b.vr * dt;
        if (b.drag) { const k = Math.max(0, 1 - b.drag * dt); b.vx *= k; b.vy *= k; }
        draw({ shape: b.shape, x: b.x, y: b.y, z: 1, r: b.r, rot: b.rot, flip: b.flip, a: 1 },
             Math.max(b.life / b.max, 0) * 0.8);
      }
      // Pointer cursor while the mouse rests on a poppable shape (shapes drift, so re-check every frame)
      if (state.mouse) {
        const hit = Boolean(shapeAt(state.mouse.x, state.mouse.y, HIT_SLOP.mouse));
        if (hit !== state.hovering) { state.hovering = hit; root.classList.toggle('wed-atm-hit', hit); }
      }
    };
    const onScroll = () => {
      const dy = scrollY - state.lastY; state.lastY = scrollY;
      state.scrollV = Math.max(-1.2, Math.min(1.2, state.scrollV + dy / 220));
    };
    // Each section sets data-atm: how strong the backdrop is while that section is in view
    const io = new IntersectionObserver((entries) => {
      let best = null;
      for (const e of entries) if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) best = e;
      if (best) state.target = parseFloat(best.target.getAttribute('data-atm')) || 0.5;
    }, { threshold: [0.25, 0.55, 0.85] });
    $$('[data-atm]').forEach((el) => io.observe(el));

    // The canvas sits behind the page and ignores the pointer, so falling petals and hearts
    // are hit-tested by hand. The slop makes the small, drifting shapes easy to catch.
    const HIT_SLOP = { mouse: 16, touch: 28 };
    const INTERACTIVE = 'a, button, input, textarea, select, label, summary';
    const shapeAt = (x, y, slop) => {
      let best = null, bestDist = slop;
      for (const it of state.items) {
        if (it.shape === 'dust') continue;
        const dist = Math.hypot(it.x - x, it.y - y) - it.r * it.z;
        if (dist < bestDist) { best = it; bestDist = dist; }
      }
      return best;
    };
    // A caught shape pops into a ring of mixed shapes and sparkles. Two new poppable shapes
    // swell out of the burst and drift on, so every pop leaves one more thing to catch.
    const BURST_SHAPES = ['rose', 'dust', 'flower', 'heart', 'dust', 'star', 'rose', 'dust', 'flower'];
    const MAX_EXTRA = 40;
    const pop = (it) => {
      const n = 24;
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2 + rand(-0.25, 0.25), sp = rand(80, 230);
        const shape = BURST_SHAPES[i % BURST_SHAPES.length];
        state.bursts.push({ shape,
          x: it.x, y: it.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, drag: 1.7,
          r: shape === 'dust' ? rand(1.2, 2.6) : rand(3.6, 8.2), rot: rand(0, 6), vr: rand(-4, 4), flip: rand(0, 6),
          life: rand(.9, 1.7), max: 1.7 });
      }
      state.items.splice(state.items.indexOf(it), 1);
      [-1, 1].forEach((side, k) => {
        // The first newborn takes the popped shape's place; the second is an extra, up to a cap
        const extra = k === 1 || Boolean(it.extra);
        if (extra && state.items.length >= budget() + MAX_EXTRA) return;
        state.items.push(Object.assign(spawn(false, pickShape(true)), {
          x: it.x + side * rand(16, 30), y: it.y + rand(-10, 10),
          z: rand(0.8, 1), grow: 0, extra
        }));
      });
    };

    const onClick = (e) => {
      if (!e.target.closest) return;
      // Clicking a primary button throws a small burst of petals
      const btn = e.target.closest('.btn-primary');
      if (btn) {
        const r = btn.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        for (let i = 0; i < 12; i++) {
          const ang = rand(-Math.PI, 0), sp = rand(60, 165);
          state.bursts.push({ shape: i % 3 === 0 ? 'heart' : 'rose',
            x: cx, y: cy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
            r: rand(3.4, 6.5), rot: rand(0, 6), vr: rand(-3, 3), flip: rand(0, 6),
            life: rand(.8, 1.5), max: 1.5 });
        }
        return;
      }
      // Anywhere else that is not a control: pop the petal or heart under the pointer
      if (e.target.closest(INTERACTIVE)) return;
      const it = shapeAt(e.clientX, e.clientY, e.pointerType === 'touch' ? HIT_SLOP.touch : HIT_SLOP.mouse);
      if (it) pop(it);
    };
    const onMouseMove = (e) => { state.mouse = { x: e.clientX, y: e.clientY }; };

    const configure = (theme) => {
      state.cfg = ATM[theme] || ATM['hien-dai'];
      readColors();
      fill(true);
    };
    configure(activeTheme());
    resize();
    addEventListener('resize', resize, { passive: true });
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('click', onClick);
    if (matchMedia('(hover: hover)').matches) addEventListener('mousemove', onMouseMove, { passive: true });
    state.raf = requestAnimationFrame(frame);
    return { configure };
  }

  initThemes();
  initSections();
  initPhotos();
  initMaps();
  initGift();
  initPopovers();
  initPresets();
  initCountdown();
  initReveal();
  initRsvp();
  initGuestbook();
  atm = initAtmosphere();
})();

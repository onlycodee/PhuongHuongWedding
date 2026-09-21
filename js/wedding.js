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
  // Cấu hình nền động theo từng theme: mật độ, tốc độ, độ đậm
  // mix: tỉ lệ cánh hồng / trái tim / bụi sáng cho từng theme
  const ATM = {
    'hien-dai':     { density: 0.55, speed: 0.9,  alpha: 0.5,  mix: { rose: 0.5, heart: 0.1, dust: 0.4 } },
    'sage':         { density: 0.7,  speed: 0.8,  alpha: 0.45, mix: { rose: 0.55, heart: 0.1, dust: 0.35 } },
    'navy':         { density: 0.4,  speed: 0.6,  alpha: 0.55, mix: { rose: 0.15, heart: 0.05, dust: 0.8 } },
    'rose':         { density: 0.9,  speed: 0.85, alpha: 0.5,  mix: { rose: 0.5, heart: 0.28, dust: 0.22 } },
    'truyen-thong': { density: 0.8,  speed: 0.95, alpha: 0.55, mix: { rose: 0.45, heart: 0.25, dust: 0.3 } }
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

  /* ===== Bật/tắt section, ảnh, bản đồ, mừng cưới ===== */
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

  /* ===== Menu trên điện thoại ===== */
  function initMenu() {
    const menu = $('.wed-menu');
    if (!menu) return;
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) menu.open = false; });
    document.addEventListener('click', (e) => { if (menu.open && !menu.contains(e.target)) menu.open = false; });
  }

  /* ===== Đếm ngược ===== */
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

  /* ===== Hiện dần khi cuộn tới ===== */
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
      // các phần tử anh em hiện so le nhau 70ms
      let i = 0, p = el.previousElementSibling;
      while (p) { if (p.hasAttribute('data-reveal')) i++; p = p.previousElementSibling; }
      el.style.transitionDelay = Math.min(i, 4) * 70 + 'ms';
      io.observe(el);
    }
    // Cuộn nhanh hoặc nhảy theo anchor có thể bỏ qua IntersectionObserver — không để nội dung bị ẩn mãi.
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

  /* ===== Xác nhận tham dự ===== */
  function initRsvp() {
    const form = $('#rsvp-form'), sent = $('#rsvp-sent'), error = $('#rsvp-error');
    if (!form || !sent) return;
    const submitBtn = $('[type="submit"]', form);
    const submitLabel = submitBtn.textContent;

    const read = (attending) => ({
      name: form.elements.name.value.trim(),
      side: form.elements.side.value,
      events: attending ? $$('[name="events"]:checked', form).map((el) => el.value) : [],
      note: form.elements.note.value.trim(),
      attending
    });
    const fill = (data) => {
      form.elements.name.value = data.name || '';
      form.elements.side.value = data.side || 'groom';
      form.elements.note.value = data.note || '';
      if (data.attending) {
        for (const el of $$('[name="events"]', form)) el.checked = (data.events || []).includes(el.value);
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
    const post = (data) => {
      if (!cfg.rsvpEndpoint) return Promise.resolve();
      const body = new URLSearchParams({
        name: data.name,
        side: data.side === 'bride' ? 'Nhà gái' : 'Nhà trai',
        events: data.events.join(', '),
        note: data.note,
        attending: data.attending ? 'Có' : 'Không'
      });
      return fetch(cfg.rsvpEndpoint, { method: 'POST', mode: 'no-cors', body });
    };
    const respond = async (attending) => {
      if (!form.reportValidity()) return;
      const data = read(attending);
      error.hidden = true;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang gửi…';
      try {
        await post(data);
        store.set('phw-rsvp', JSON.stringify(data));
        showSent(data);
      } catch (e) {
        error.hidden = false;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
      }
    };

    form.addEventListener('submit', (e) => { e.preventDefault(); respond(true); });
    $('#rsvp-decline').addEventListener('click', () => respond(false));
    $('#rsvp-reset').addEventListener('click', () => {
      sent.hidden = true;
      form.hidden = false;
    });

    // Khách quay lại vẫn thấy phản hồi đã gửi
    try {
      const saved = JSON.parse(store.get('phw-rsvp'));
      if (saved) { fill(saved); showSent(saved); }
    } catch (e) { store.del('phw-rsvp'); }
  }

  /* ===== Nền động: cánh hồng, trái tim, bụi sáng trên canvas ===== */
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

    // Mỗi hình có MỘT vai màu cố định suốt đời → không đổi màu lung tung.
    // Khi đổi theme, màu của từng vai chuyển mượt (nội suy 0.9s) thay vì nhảy.
    const ROLE = { rose: '--wed-accent', heart: '--wed-primary', dust: '--wed-secondary' };
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
    const pickShape = () => {
      const m = state.cfg.mix, total = m.rose + m.heart + m.dust;
      let r = Math.random() * total;
      if ((r -= m.rose) < 0) return 'rose';
      if ((r -= m.heart) < 0) return 'heart';
      return 'dust';
    };
    const spawn = (init) => {
      const sh = pickShape();
      const dust = sh === 'dust';
      return {
        shape: sh,
        x: rand(-0.05, 1.05) * state.w,
        y: init ? rand(-0.1, 1) * state.h : rand(-0.15, -0.02) * state.h,
        z: rand(0.45, 1),                       // chiều sâu → thị sai
        r: dust ? rand(0.8, 2.2) : (sh === 'heart' ? rand(3.4, 6.4) : rand(4, 8.4)),
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
    const draw = (item, alphaMul) => {
      const a = item.a * (alphaMul == null ? state.level * state.cfg.alpha : alphaMul);
      if (a <= 0.004) return;
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.fillStyle = roleColor(item.shape, a);
      if (item.shape === 'dust') {
        ctx.beginPath(); ctx.arc(0, 0, item.r * item.z, 0, Math.PI * 2); ctx.fill();
        ctx.restore(); return;
      }
      ctx.rotate(item.rot);
      // lật quanh trục dọc → cảm giác xoay trong không gian, không phải sprite phẳng
      const squeeze = 0.42 + 0.58 * Math.abs(Math.cos(item.flip));
      const s = item.r * item.z;
      ctx.scale(squeeze, 1);
      ctx.beginPath();
      if (item.shape === 'heart') {
        const w = s * 1.15, h = s * 1.1;
        ctx.moveTo(0, h);
        ctx.bezierCurveTo(-w * 1.35, h * 0.1, -w * 0.78, -h * 1.12, 0, -h * 0.4);
        ctx.bezierCurveTo(w * 0.78, -h * 1.12, w * 1.35, h * 0.1, 0, h);
      } else {
        // cánh hoa hồng: đầu tròn, gốc thắt, mép hơi gợn
        const w = s, h = s * 1.5;
        ctx.moveTo(0, h);
        ctx.bezierCurveTo(-w * 0.9, h * 0.42, -w * 1.02, -h * 0.62, 0, -h);
        ctx.bezierCurveTo(w * 1.02, -h * 0.62, w * 0.9, h * 0.42, 0, h);
      }
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
      for (const it of state.items) {
        it.swayT += it.swaySpeed * dt;
        it.x += Math.sin(it.swayT) * it.sway * dt;
        it.y += (it.vy * it.z + state.scrollV * 26 * it.z) * dt;
        it.rot += it.vr * dt;
        it.flip += it.flipSpeed * dt;
        if (it.y - 30 > state.h || it.x < -80 || it.x > state.w + 80) Object.assign(it, spawn(false));
        draw(it);
      }
      for (let i = state.bursts.length - 1; i >= 0; i--) {
        const b = state.bursts[i];
        b.life -= dt;
        if (b.life <= 0) { state.bursts.splice(i, 1); continue; }
        b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 42 * dt; b.rot += b.vr * dt; b.flip += b.vr * dt;
        draw({ shape: b.shape, x: b.x, y: b.y, z: 1, r: b.r, rot: b.rot, flip: b.flip, a: 1 },
             Math.max(b.life / b.max, 0) * 0.8);
      }
    };
    const onScroll = () => {
      const dy = scrollY - state.lastY; state.lastY = scrollY;
      state.scrollV = Math.max(-1.2, Math.min(1.2, state.scrollV + dy / 220));
    };
    // Mỗi section khai báo data-atm = độ đậm của nền động khi section đó đang trong khung nhìn
    const io = new IntersectionObserver((entries) => {
      let best = null;
      for (const e of entries) if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) best = e;
      if (best) state.target = parseFloat(best.target.getAttribute('data-atm')) || 0.5;
    }, { threshold: [0.25, 0.55, 0.85] });
    $$('[data-atm]').forEach((el) => io.observe(el));

    // Bấm nút chính → tung một chùm cánh hoa
    const onClick = (e) => {
      const btn = e.target.closest && e.target.closest('.btn-primary');
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      for (let i = 0; i < 12; i++) {
        const ang = rand(-Math.PI, 0), sp = rand(60, 165);
        state.bursts.push({ shape: i % 3 === 0 ? 'heart' : 'rose',
          x: cx, y: cy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          r: rand(3.4, 6.5), rot: rand(0, 6), vr: rand(-3, 3), flip: rand(0, 6),
          life: rand(.8, 1.5), max: 1.5 });
      }
    };

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
    state.raf = requestAnimationFrame(frame);
    return { configure };
  }

  initThemes();
  initSections();
  initPhotos();
  initMaps();
  initGift();
  initMenu();
  initCountdown();
  initReveal();
  initRsvp();
  atm = initAtmosphere();
})();

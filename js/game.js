/* PhuongHuongWedding — hidden mini game. PROTOTYPE: four candidate mechanics, pick one.
 *
 * The game is invisible until a guest pops a falling petal or heart (wedding.js fires "phw:pop").
 * Then a score bar and a countdown slide in. A round that ends below its goal resets the score
 * to 0; a round that reaches the goal can be saved to the leaderboard. The leaderboard section
 * at the end of the page only appears for guests who have played.
 *
 * Scores are kept in this browser only (localStorage) until a mechanic is chosen.
 */
(function () {
  'use strict';

  const cfg = Object.assign({ enabled: true, mode: 'rush', lab: false }, (window.WEDDING_CONFIG || {}).game);
  if (!cfg.enabled || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const root = document.documentElement;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  /* ===== Shapes (same outlines as the backdrop in wedding.js) ===== */
  const PATHS = {
    heart(c, s) {
      const w = s * 1.15, h = s * 1.1;
      c.moveTo(0, h);
      c.bezierCurveTo(-w * 1.35, h * 0.1, -w * 0.78, -h * 1.12, 0, -h * 0.4);
      c.bezierCurveTo(w * 0.78, -h * 1.12, w * 1.35, h * 0.1, 0, h);
    },
    rose(c, s) {
      const w = s, h = s * 1.5;
      c.moveTo(0, h);
      c.bezierCurveTo(-w * 0.9, h * 0.42, -w * 1.02, -h * 0.62, 0, -h);
      c.bezierCurveTo(w * 1.02, -h * 0.62, w * 0.9, h * 0.42, 0, h);
    },
    star(c, s) {
      for (let i = 0; i < 10; i++) {
        const ang = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? s * 0.55 : s * 1.3;
        c[i ? 'lineTo' : 'moveTo'](Math.cos(ang) * rad, Math.sin(ang) * rad);
      }
      c.closePath();
    },
    flower(c, s) {
      const reach = s * 2, spread = 0.62;
      for (let k = 0; k < 5; k++) {
        const ang = -Math.PI / 2 + k * Math.PI * 2 / 5;
        c.moveTo(0, 0);
        c.bezierCurveTo(Math.cos(ang - spread) * reach, Math.sin(ang - spread) * reach,
          Math.cos(ang + spread) * reach, Math.sin(ang + spread) * reach, 0, 0);
      }
    }
  };
  const SHAPE_VAR = { rose: '--wed-accent', heart: '--wed-primary', star: '--wed-accent-deep', flower: '--wed-primary' };
  const SHAPE_LABEL = { rose: 'cánh hoa', heart: 'trái tim', star: 'ngôi sao', flower: 'bông hoa' };
  const SHAPES = Object.keys(SHAPE_VAR);

  let colors = {};
  const readColors = () => {
    const cs = getComputedStyle(root);
    const v = (name) => cs.getPropertyValue(name).trim() || '#888';
    colors = { bg: v('--wed-background'), primary: v('--wed-primary'), accent: v('--wed-accent'),
               secondary: v('--wed-secondary'), deep: v('--wed-primary-deep') };
    for (const s of SHAPES) colors[s] = v(SHAPE_VAR[s]);
  };
  // Game pieces float above the page text, so each gets a light halo to stay readable
  const drawShape = (c, shape, x, y, s, rot, color, alpha) => {
    c.save();
    c.translate(x, y); c.rotate(rot || 0);
    c.globalAlpha = alpha == null ? 1 : alpha;
    c.shadowColor = colors.bg; c.shadowBlur = 12;
    c.fillStyle = color;
    c.beginPath(); PATHS[shape](c, s); c.fill();
    c.shadowBlur = 0;
    c.lineWidth = 1.2; c.strokeStyle = colors.bg; c.stroke();
    c.restore();
  };

  /* ===== The four candidate mechanics =====
   * start(g, origin)  set up the round; origin is where the guest popped the shape
   * update(g, dt)     move things
   * tap(g, x, y, slop) → true when the tap hit something
   * draw(g)
   * A round is won when g.score >= goal at the end and the mode did not call g.fail().
   */
  const falling = (g, shape, from) => {
    const r = rand(15, 22);
    return {
      shape, r, rot: rand(0, 6), vr: rand(-1.2, 1.2), grow: from ? 0 : 1,
      x: from ? clamp(from.x + rand(-90, 90), 30, g.w - 30) : rand(30, g.w - 30),
      y: from ? from.y + rand(-60, 30) : -30,
      vy: rand(0.15, 0.27) * g.h * (from ? 0.6 : 1) * (shape === 'star' ? 1.35 : 1),
      sway: rand(14, 40), swayT: rand(0, 6)
    };
  };
  const updateFalling = (g, dt) => {
    for (let i = g.targets.length - 1; i >= 0; i--) {
      const t = g.targets[i];
      t.swayT += dt * 1.6; t.x += Math.sin(t.swayT) * t.sway * dt;
      t.y += t.vy * dt; t.rot += t.vr * dt;
      if (t.grow < 1) t.grow = Math.min(1, t.grow + dt * 3);
      if (t.y - 40 > g.h) g.targets.splice(i, 1);
    }
  };
  const drawFalling = (g) => {
    for (const t of g.targets) drawShape(g.ctx, t.shape, t.x, t.y, t.r * 0.62 * (0.3 + 0.7 * t.grow), t.rot, colors[t.shape], 0.95);
  };
  const hitFalling = (g, x, y, slop) => {
    let best = null, bestDist = slop;
    for (const t of g.targets) {
      const d = Math.hypot(t.x - x, t.y - y) - t.r;
      if (d < bestDist) { best = t; bestDist = d; }
    }
    if (best) g.targets.splice(g.targets.indexOf(best), 1);
    return best;
  };
  const weighted = (weights) => {
    let r = Math.random() * Object.values(weights).reduce((a, b) => a + b, 0);
    for (const k in weights) if ((r -= weights[k]) < 0) return k;
    return 'rose';
  };

  const MODES = {
    /* 1. Catch everything that falls; rarer shapes are worth more, quick chains multiply. */
    rush: {
      name: 'Mưa hoa', time: 25, goal: 60,
      hint: 'Chạm vào mọi thứ đang rơi — sao 5 điểm, tim 3, hoa 2, cánh hoa 1. Chạm liên tục để nhân điểm!',
      points: { rose: 1, flower: 2, heart: 3, star: 5 },
      weights: { rose: 0.4, flower: 0.28, heart: 0.22, star: 0.1 },
      start(g, origin) {
        g.spawnIn = 0.3; g.combo = 0; g.lastHit = -9;
        for (let i = 0; i < 5; i++) g.targets.push(falling(g, weighted(this.weights), origin));
      },
      update(g, dt) {
        g.spawnIn -= dt;
        if (g.spawnIn <= 0) {
          g.targets.push(falling(g, weighted(this.weights)));
          g.spawnIn = 0.26 + 0.2 * (g.timeLeft / this.time);   // the rain thickens towards the end
        }
        updateFalling(g, dt);
      },
      tap(g, x, y, slop) {
        const t = hitFalling(g, x, y, slop);
        if (!t) return false;
        g.combo = g.clock - g.lastHit < 1.2 ? g.combo + 1 : 1;
        g.lastHit = g.clock;
        const mult = Math.min(3, 1 + Math.floor(g.combo / 3));
        const pts = this.points[t.shape] * mult;
        g.add(pts);
        g.burst(t.x, t.y, colors[t.shape], 10);
        g.text(t.x, t.y, '+' + pts + (mult > 1 ? ' ×' + mult : ''));
        return true;
      },
      draw: drawFalling
    },

    /* 2. One golden heart. Every catch makes it smaller, faster and shorter-lived. */
    chase: {
      name: 'Đuổi tim vàng', time: 3, goal: 12, perCatch: true,
      hint: 'Chạm vào trái tim vàng trước khi nó tan biến. Mỗi lần bắt được, nó lại nhỏ và nhanh hơn!',
      place(g, near) {
        const top = 150, bottom = g.h - 110;
        let x, y, tries = 0;
        do { x = rand(40, g.w - 40); y = rand(top, bottom); }
        while (near && Math.hypot(x - near.x, y - near.y) < Math.min(g.w, g.h) * 0.3 && ++tries < 12);
        const ang = rand(0, 6.28), sp = 24 + g.score * 9;
        g.heart = { x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: Math.max(15, 27 - g.score * 0.8), grow: 0 };
      },
      start(g, origin) { this.place(g); g.heart.x = clamp(origin.x, 40, g.w - 40); g.heart.y = clamp(origin.y, 150, g.h - 110); },
      update(g, dt) {
        const h = g.heart;
        h.x += h.vx * dt; h.y += h.vy * dt; h.grow = Math.min(1, h.grow + dt * 5);
        if (h.x < 30 || h.x > g.w - 30) { h.vx *= -1; h.x = clamp(h.x, 30, g.w - 30); }
        if (h.y < 140 || h.y > g.h - 100) { h.vy *= -1; h.y = clamp(h.y, 140, g.h - 100); }
      },
      tap(g, x, y, slop) {
        const h = g.heart;
        if (Math.hypot(h.x - x, h.y - y) - h.r > slop) return false;
        g.add(1);
        g.burst(h.x, h.y, colors.accent, 14);
        g.text(h.x, h.y, '+1');
        g.timeMax = Math.max(1.1, this.time * Math.pow(0.94, g.score));
        g.timeLeft = g.timeMax;
        this.place(g, h);
        return true;
      },
      draw(g) {
        const h = g.heart, left = g.timeLeft / g.timeMax;
        const pulse = 1 + Math.sin(g.clock * 9) * 0.06;
        const c = g.ctx;
        c.save();
        c.globalAlpha = 0.25 * left;
        c.fillStyle = colors.accent;
        c.beginPath(); c.arc(h.x, h.y, h.r * 1.9 * pulse, 0, Math.PI * 2); c.fill();
        c.restore();
        drawShape(c, 'heart', h.x, h.y, h.r * 0.8 * h.grow * pulse, 0, colors.accent, 0.45 + 0.55 * left);
      }
    },

    /* 3. Only the shape the bride asks for counts; a wrong tap costs time. */
    match: {
      name: 'Bó hoa cô dâu', time: 30, goal: 12,
      hint: 'Cô dâu đang cần đúng một loại — chỉ chạm vào hình đang hiện trên thanh điểm. Chạm nhầm mất 3 giây!',
      next(g) {
        const others = SHAPES.filter((s) => s !== g.want);
        g.want = others[Math.floor(Math.random() * others.length)];
        g.wantLeft = 3;
        g.showWant(g.want);
      },
      start(g, origin) {
        g.spawnIn = 0.3; g.streak = 0; this.next(g);
        for (let i = 0; i < 5; i++) g.targets.push(falling(g, i < 2 ? g.want : SHAPES[i % 4], origin));
      },
      update(g, dt) {
        g.spawnIn -= dt;
        if (g.spawnIn <= 0) {
          const shape = Math.random() < 0.4 ? g.want : SHAPES[Math.floor(Math.random() * 4)];
          g.targets.push(falling(g, shape));
          g.spawnIn = 0.38;
        }
        updateFalling(g, dt);
      },
      tap(g, x, y, slop) {
        const t = hitFalling(g, x, y, slop);
        if (!t) return false;
        if (t.shape === g.want) {
          g.streak++;
          const pts = g.streak % 3 === 0 ? 2 : 1;
          g.add(pts);
          g.burst(t.x, t.y, colors[t.shape], 10);
          g.text(t.x, t.y, '+' + pts);
          if (--g.wantLeft <= 0) this.next(g);
        } else {
          g.streak = 0;
          g.timeLeft = Math.max(0, g.timeLeft - 3);
          g.text(t.x, t.y, '−3 giây', true);
          g.shake();
        }
        return true;
      },
      draw: drawFalling
    },

    /* 4. Keepy-uppy with the bridal bouquet: every tap scores, one drop loses everything. */
    keepup: {
      name: 'Tung hoa cưới', time: 20, goal: 10,
      hint: 'Chạm vào bó hoa để tung nó lên. Giữ hoa không chạm đất đến hết giờ — rơi là mất hết điểm!',
      start(g, origin) {
        g.bq = { x: clamp(origin.x, 60, g.w - 60), y: clamp(origin.y, 140, g.h * 0.6), vx: rand(-40, 40), vy: -g.h * 0.7, rot: 0, r: 46 };
        g.gravity = g.h * 1.25;
      },
      update(g, dt) {
        const b = g.bq;
        b.vy += g.gravity * dt;
        b.x += b.vx * dt; b.y += b.vy * dt;
        b.rot += b.vx * 0.004 * dt * 10;
        if (b.x < b.r || b.x > g.w - b.r) { b.vx *= -0.8; b.x = clamp(b.x, b.r, g.w - b.r); }
        if (b.y < 170) { b.y = 170; b.vy = Math.abs(b.vy) * 0.35; }
        if (b.y - b.r > g.h) g.fail('Bó hoa chạm đất mất rồi!');
      },
      tap(g, x, y, slop) {
        const b = g.bq;
        if (Math.hypot(b.x - x, b.y - y) - b.r > slop + 14) return false;
        b.vy = -g.h * 0.92;
        b.vx = clamp(b.vx * 0.4 + (b.x - x) * 9, -g.h * 0.5, g.h * 0.5);
        g.gravity *= 1.03;
        g.add(1);
        g.burst(x, y, colors.accent, 8);
        g.text(b.x, b.y - 30, '+1');
        return true;
      },
      draw(g) {
        const b = g.bq, c = g.ctx, K = 1.4;
        c.save();
        c.translate(b.x, b.y); c.rotate(b.rot); c.scale(K, K);
        c.shadowColor = colors.bg; c.shadowBlur = 12;
        // paper wrap and ribbon
        c.fillStyle = colors.secondary;
        c.beginPath(); c.moveTo(-24, -4); c.lineTo(24, -4); c.lineTo(5, 40); c.lineTo(-5, 40); c.closePath(); c.fill();
        c.shadowBlur = 0;
        c.fillStyle = colors.primary;
        c.fillRect(-9, 20, 18, 5);
        c.restore();
        const cos = Math.cos(b.rot), sin = Math.sin(b.rot);
        [[-15, -8, 'flower', colors.primary], [15, -8, 'flower', colors.accent], [0, -24, 'flower', colors.deep],
         [0, -4, 'heart', colors.accent]].forEach(([dx, dy, shape, color]) => {
          drawShape(c, shape, b.x + (dx * cos - dy * sin) * K, b.y + (dx * sin + dy * cos) * K, (shape === 'heart' ? 8 : 8.5) * K, b.rot, color, 1);
        });
      }
    }
  };
  const MODE_KEYS = Object.keys(MODES);

  /* ===== Interface: score bar, result card, leaderboard, lab switcher ===== */
  const canvas = el('canvas', 'wed-game-canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');

  const hud = el('div', 'wed-game-hud');
  hud.hidden = true;
  hud.setAttribute('role', 'status');
  const hudName = el('span', 'wed-game-name');
  const hudWant = el('canvas', 'wed-game-want');
  hudWant.width = hudWant.height = 56; hudWant.hidden = true;
  const hudScore = el('span', 'wed-game-score');
  const hudTime = el('span', 'wed-game-time');
  const hudQuit = el('button', 'wed-game-quit', '×');
  hudQuit.type = 'button'; hudQuit.setAttribute('aria-label', 'Thoát trò chơi');
  const hudRow = el('div', 'wed-game-row');
  hudRow.append(hudName, hudWant, hudScore, hudTime, hudQuit);
  const hudBar = el('div', 'wed-game-bar'), hudBarFill = el('i');
  hudBar.append(hudBarFill);
  const hudHint = el('p', 'wed-game-hint');
  hud.append(hudRow, hudBar, hudHint);

  const card = el('div', 'wed-game-card');
  card.hidden = true;
  card.setAttribute('role', 'dialog');

  const board = el('section', 'wed-band wed-game-board');
  board.id = 'bang-vang'; board.hidden = true;
  const boardWrap = el('div', 'wed-wrap');
  const boardLead = el('p', 'wed-lead wed-head');
  const boardList = el('ol', 'wed-game-list');
  boardWrap.append(el('p', 'wed-kicker wed-head', 'Trò chơi bí mật'), el('h2', 'wed-title wed-head', 'Bảng vàng'), boardLead, boardList);
  board.append(boardWrap);

  let mode = new URLSearchParams(location.search).get('game') || store.get('phw-game-mode') || cfg.mode;
  if (!MODES[mode]) mode = 'rush';

  const scores = () => { try { return JSON.parse(store.get('phw-game-scores')) || {}; } catch (e) { return {}; } };
  const savedName = () => {
    if (store.get('phw-game-name')) return store.get('phw-game-name');
    try { return (JSON.parse(store.get('phw-rsvp')) || {}).name || ''; } catch (e) { return ''; }
  };
  // PROTOTYPE: placeholder rows so the board can be judged before a shared backend exists
  const sampleRows = (goal) => [['Minh Anh', 1.7], ['Quốc Bảo', 1.35], ['Thu Trang', 1.1]]
    .map(([name, k]) => ({ name, score: Math.round(goal * k), sample: true }));
  const renderBoard = () => {
    board.hidden = !store.get('phw-game-played');
    const def = MODES[mode];
    boardLead.textContent = 'Bạn đã tìm ra trò chơi ẩn “' + def.name + '”. Đạt từ ' + def.goal + ' điểm để ghi tên lên bảng.';
    const rows = (scores()[mode] || []).concat(sampleRows(def.goal)).sort((a, b) => b.score - a.score).slice(0, 8);
    boardList.textContent = '';
    rows.forEach((r, i) => {
      const li = el('li', 'wed-game-li' + (r.sample ? '' : ' is-me'));
      li.append(el('span', 'wed-game-rank', String(i + 1)), el('span', 'wed-game-who', r.name + (r.sample ? ' (mẫu)' : '')),
        el('span', 'wed-game-pts', String(r.score)));
      boardList.append(li);
    });
  };

  /* ===== Round ===== */
  let g = null, raf = 0, swallowClickAt = 0, hintTimer = 0, lab = null;

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (g) { g.w = innerWidth; g.h = innerHeight; }
  };
  const showHud = () => {
    const def = MODES[mode];
    hudScore.textContent = g.score + ' / ' + def.goal;
    hudScore.classList.toggle('is-goal', g.score >= def.goal);
    hudTime.textContent = Math.ceil(g.timeLeft) + 's';
    hudBarFill.style.transform = 'scaleX(' + clamp(g.timeLeft / g.timeMax, 0, 1).toFixed(3) + ')';
    hudBarFill.classList.toggle('is-low', g.timeLeft / g.timeMax < 0.3);
  };

  function start(origin) {
    if (g && g.playing) return;
    const def = MODES[mode];
    readColors();
    card.hidden = true;
    g = {
      playing: true, failed: '', score: 0, clock: 0, timeLeft: def.time, timeMax: def.time,
      w: innerWidth, h: innerHeight, ctx, targets: [], fx: [], texts: [],
      add(n) { g.score += n; hudScore.classList.remove('is-bump'); void hudScore.offsetWidth; hudScore.classList.add('is-bump'); },
      fail(why) { g.failed = why; },
      shake() { hud.classList.remove('is-shake'); void hud.offsetWidth; hud.classList.add('is-shake'); },
      burst(x, y, color, n) {
        for (let i = 0; i < n; i++) {
          const ang = rand(0, 6.28), sp = rand(60, 220);
          g.fx.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: rand(2, 5), color, life: rand(0.4, 0.8), max: 0.8,
                      shape: i % 3 ? 'rose' : 'heart', rot: rand(0, 6) });
        }
      },
      text(x, y, str, bad) { g.texts.push({ x, y, str, bad, life: 0.9 }); },
      showWant(shape) {
        const c = hudWant.getContext('2d');
        c.clearRect(0, 0, 56, 56);
        drawShape(c, shape, 28, 28, shape === 'flower' ? 11 : 15, 0, colors[shape], 1);
        hudWant.hidden = false;
        hudWant.setAttribute('aria-label', 'Hãy bắt ' + SHAPE_LABEL[shape]);
        hudWant.classList.remove('is-bump'); void hudWant.offsetWidth; hudWant.classList.add('is-bump');
      }
    };
    hudName.textContent = def.name;
    hudHint.textContent = def.hint;
    hudWant.hidden = true;
    hud.hidden = false;
    // The rules fold away after a few seconds so the bar stays small during play
    hud.classList.remove('is-compact');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => hud.classList.add('is-compact'), 5000);
    if (lab) lab.open = false;
    root.classList.add('wed-game-on');
    document.body.append(canvas);
    resize();
    def.start(g, origin || { x: innerWidth / 2, y: innerHeight * 0.4 });
    showHud();
    let last = performance.now();
    cancelAnimationFrame(raf);
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = clamp((now - last) / 1000, 0, 0.05); last = now;
      if (document.hidden) return;
      if (g.playing) {
        g.clock += dt; g.timeLeft -= dt;
        def.update(g, dt);
        if (g.failed || g.timeLeft <= 0) finish();
        else showHud();
      }
      ctx.clearRect(0, 0, g.w, g.h);
      if (g.playing) def.draw(g);
      for (let i = g.fx.length - 1; i >= 0; i--) {
        const p = g.fx[i];
        p.life -= dt;
        if (p.life <= 0) { g.fx.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.vx *= 1 - 1.8 * dt;
        drawShape(ctx, p.shape, p.x, p.y, p.r, p.rot, p.color, p.life / p.max);
      }
      ctx.font = '600 17px ' + getComputedStyle(document.body).fontFamily;
      ctx.textAlign = 'center';
      for (let i = g.texts.length - 1; i >= 0; i--) {
        const t = g.texts[i];
        t.life -= dt;
        if (t.life <= 0) { g.texts.splice(i, 1); continue; }
        t.y -= 46 * dt;
        ctx.globalAlpha = Math.min(1, t.life / 0.4);
        ctx.lineWidth = 4; ctx.strokeStyle = colors.bg; ctx.strokeText(t.str, t.x, t.y);
        ctx.fillStyle = t.bad ? '#a3362a' : colors.deep; ctx.fillText(t.str, t.x, t.y);
        ctx.globalAlpha = 1;
      }
      if (!g.playing && !g.fx.length && !g.texts.length) { cancelAnimationFrame(raf); canvas.remove(); }
    };
    raf = requestAnimationFrame(frame);
  }

  function finish(quit) {
    if (!g || !g.playing) return;
    g.playing = false;
    swallowClickAt = 0;
    const def = MODES[mode];
    const won = !quit && !g.failed && g.score >= def.goal;
    const final = g.score;
    for (const t of g.targets) g.burst(t.x, t.y, colors[t.shape], 4);
    g.targets = [];
    root.classList.remove('wed-game-on');
    store.set('phw-game-played', '1');
    renderBoard();
    if (quit) { hud.hidden = true; return; }
    if (!won) { g.score = 0; g.shake(); }
    g.timeLeft = 0;
    showHud();
    showCard(won, final, def);
  }

  function showCard(won, final, def) {
    card.textContent = '';
    const close = () => { card.hidden = true; hud.hidden = true; };
    const again = el('button', 'btn btn-secondary', 'Chơi lại');
    again.type = 'button';
    again.addEventListener('click', () => start());
    const later = el('button', 'btn btn-secondary', won ? 'Đóng' : 'Để sau');
    later.type = 'button';
    later.addEventListener('click', close);
    const actions = el('div', 'wed-game-actions');
    if (won) {
      card.append(el('p', 'wed-kicker', 'Hoàn thành · ' + def.name), el('p', 'wed-game-final', final + ' điểm'),
        el('p', 'wed-game-msg', 'Tuyệt vời! Ghi tên bạn lên bảng vàng ở cuối trang nhé.'));
      const name = el('input', 'input');
      name.type = 'text'; name.maxLength = 40; name.placeholder = 'Tên của bạn'; name.value = savedName();
      name.setAttribute('aria-label', 'Tên của bạn');
      const save = el('button', 'btn btn-primary wed-cta', 'Lưu điểm');
      save.type = 'button';
      save.addEventListener('click', () => {
        const who = name.value.trim() || 'Khách mời';
        store.set('phw-game-name', who);
        const all = scores();
        all[mode] = (all[mode] || []).concat({ name: who, score: final, at: Date.now() })
          .sort((a, b) => b.score - a.score).slice(0, 10);
        store.set('phw-game-scores', JSON.stringify(all));
        renderBoard();
        close();
        board.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      actions.append(save, again, later);
      card.append(name, actions);
    } else {
      card.append(el('p', 'wed-kicker', def.name), el('p', 'wed-game-final', '0 điểm'),
        el('p', 'wed-game-msg', (g.failed || 'Hết giờ mất rồi!') + ' Bạn được ' + final + ', cần ' + def.goal +
          ' để hoàn thành — điểm quay về 0. Thử lại nhé?'));
      actions.append(again, later);
      card.append(actions);
    }
    card.hidden = false;
  }

  /* ===== Input: the game canvas ignores the pointer, so taps are hit-tested by hand ===== */
  addEventListener('pointerdown', (e) => {
    if (!g || !g.playing || (e.target.closest && e.target.closest('.wed-game-quit, .wed-game-card, .wed-game-lab'))) return;
    if (MODES[mode].tap(g, e.clientX, e.clientY, e.pointerType === 'touch' ? 26 : 12)) swallowClickAt = performance.now();
  }, true);
  // A tap that hit a game piece must not also press the link or button underneath it
  addEventListener('click', (e) => {
    if (performance.now() - swallowClickAt < 600) { e.preventDefault(); e.stopImmediatePropagation(); swallowClickAt = 0; }
  }, true);
  addEventListener('resize', resize, { passive: true });
  hudQuit.addEventListener('click', () => finish(true));
  document.addEventListener('phw:pop', (e) => { if (card.hidden) start(e.detail); });

  /* ===== Lab switcher (prototype only): pick a mechanic without hunting for a petal ===== */
  function initLab() {
    lab = el('details', 'wed-game-lab');
    lab.open = innerWidth > 640;
    lab.append(el('summary', '', 'Game lab'));
    const chips = el('div', 'wed-game-lab-chips');
    const setMode = (key) => {
      if (g && g.playing) finish(true);
      card.hidden = true; hud.hidden = true;
      mode = key; store.set('phw-game-mode', key);
      chips.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === key)));
      renderBoard();
    };
    MODE_KEYS.forEach((key, i) => {
      const b = el('button', 'wed-theme-chip', (i + 1) + ' · ' + MODES[key].name);
      b.type = 'button'; b.dataset.mode = key;
      b.addEventListener('click', () => setMode(key));
      chips.append(b);
    });
    const play = el('button', 'btn btn-primary wed-cta', 'Chơi ngay');
    play.type = 'button';
    play.addEventListener('click', () => start());
    const wipe = el('button', 'wed-theme-chip', 'Xoá điểm & ẩn bảng');
    wipe.type = 'button';
    wipe.addEventListener('click', () => {
      try { ['phw-game-scores', 'phw-game-played', 'phw-game-name'].forEach((k) => localStorage.removeItem(k)); } catch (e) {}
      renderBoard();
    });
    lab.append(chips, play, wipe);
    document.body.append(lab);
    setMode(mode);
  }

  const footer = document.querySelector('.wed-footer');
  if (footer) footer.before(board); else document.body.append(board);
  document.body.append(hud, card);
  renderBoard();
  if (cfg.lab) initLab();
})();

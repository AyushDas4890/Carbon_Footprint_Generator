// C4Future intro — 19 s, 120 BPM. Shotlist: docs/shotlist.md (APPROVED). Marks + SFX: timeline.json.
// Every UI pixel is a capture of the real app (scripts/shoot.mjs → assets/cap). The only rebuilt elements are the
// typed product name, the count-up number (same face, size and gradient as .emission-value) and the site's cursor.
// Pure function of time: no timers, no Math.random, nothing mutated in run().
(() => {
  const { W, H, pick, put, reg, el, scene, canvas, sp, spHit, trk, trkObj, seg, lerp, ease, bt, beatOf, mulberry32 } = C;
  const { line, rise, type } = TYPE;
  C.fonts = ['700 100px Display', '400 40px UI', '500 40px UI'];
  const PAD = pick(140, 90, 80);
  const CAP = '../assets/cap/';
  const TALL = C.FMT === '9x16';

  // ---------------------------------------------------------------- shared pieces
  // the site's sparse green particle field: seeded points, drifting on closed-form paths
  function makeDots(seed, n) {
    const r = mulberry32(seed);
    return Array.from({ length: n }, () => ({ x: r() * W, y: r() * H, k: r(), a: 0.12 + 0.4 * r(), s: 1.5 + 2 * r() }));
  }
  function drawDots(g, t, pts, alpha = 1) {
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#64ffb4';
    for (const p of pts) {
      const x = p.x + 26 * Math.sin(t * 0.35 + p.k * 6.283), y = p.y + 18 * Math.cos(t * 0.27 + p.k * 4.1);
      g.globalAlpha = p.a * alpha;
      g.fillRect(x - p.s / 2, y - p.s / 2, p.s, p.s);
    }
    g.globalAlpha = 1;
  }
  const box = (parent, x, y, w, h, extra = '') =>
    el('div', { class: 'abs', style: `left:${x}px;top:${y}px;width:${w}px;height:${h}px;${extra}` }, parent);
  const img = (parent, src, w, h) => el('img', { src: CAP + src, style: `width:${w}px;height:${h}px` }, parent);
  const cam = (root, ox = W / 2, oy = H / 2) => reg(el('div', { class: 'abs', style: `width:${W}px;height:${H}px;transform-origin:${ox}px ${oy}px` }, root));

  // ---------------------------------------------------------------- 1. hook  (b0 → b8)
  scene({
    name: 'hook', from: 'hook', to: 'calc',
    build(root, S) {
      S.ctx = canvas(root); S.pts = makeDots(11, 120);
      S.cam = cam(root, PAD, H / 2);
      const sz = pick(150, 120, 118), lh = sz * 1.12, y0 = pick(330, 360, 720);
      S.lines = TALL
        ? [line(S.cam, 'Every product', { x: PAD, y: y0, size: sz }),
           line(S.cam, 'has a', { x: PAD, y: y0 + lh, size: sz }),
           line(S.cam, 'carbon cost.', { x: PAD, y: y0 + 2 * lh, size: sz, accent: [0, 1] })]
        : [line(S.cam, 'Every product', { x: PAD, y: y0, size: sz }),
           line(S.cam, 'has a carbon cost.', { x: PAD, y: y0 + lh, size: sz, accent: [2, 3] })];
      S.beats = TALL ? [[-0.4, 'hook_w2'], [2, 2.08], [3, 3.08]] : [[-0.4, 'hook_w2'], [2, 2.08, 3, 3.08]];
      S.q = line(S.cam, "What's yours?", { x: PAD, y: pick(400, 420, 830), size: pick(200, 160, 118), accent: [1] });
    },
    run(t, b, S) {
      drawDots(S.ctx, t, S.pts);
      put(S.cam, { s: 1 + 0.05 * ease.inOut(seg(t, 'hook', 'calc')) });
      S.lines.forEach((L, i) => rise(t, L, S.beats[i], 5.36));
      rise(t, S.q, ['hook_q', 5.58]);
    },
  });

  // ---------------------------------------------------------------- 2. calculator  (b8 → b16)
  // el_form.png is the real #calculator card (620×633 css px at 2×) with Cotton / China / 0.3 kg / Sea / 8000 km set.
  const F = { w: 620, h: 633, field: { x: 41, y: 124.2, w: 538, h: 49.8 }, btn: { x: 41, y: 544.6, w: 538, h: 47.2 } };
  scene({
    name: 'calc', from: 'calc', to: 'result',
    build(root, S) {
      S.ctx = canvas(root); S.pts = makeDots(23, 90);
      S.cam = cam(root); S.cam.style.transformOrigin = '0 0';
      S.cap = line(S.cam, 'Describe it.', { x: PAD, y: pick(420, 160, 330), size: pick(150, 120, 130), accent: [1] });
      S.K = pick(1.3, 1.25, 1.45);
      S.X = pick(W - PAD - F.w * 1.3, (W - F.w * 1.25) / 2, (W - F.w * 1.45) / 2);
      S.Y = pick((H - F.h * 1.3) / 2, 330, 500);
      S.card = reg(box(S.cam, 0, 0, F.w, F.h, 'border-radius:20px;box-shadow:0 2px 6px rgba(0,0,0,.4),0 40px 90px -20px rgba(0,0,0,.85)'), { o: 0 });
      img(S.card, 'el_form.png', F.w, F.h);
      const f = F.field;
      const holder = box(S.card, f.x + 17.6, f.y, f.w - 35, f.h, `display:flex;align-items:center;font:400 15.2px UI;color:#f0f4ff;white-space:pre`);
      S.text = reg(el('span', {}, holder));
      S.caret = reg(el('span', { style: 'display:inline-block;width:1.5px;height:18px;background:#64ffb4;margin-left:1px' }, holder), { o: 0 });
      const bt_ = F.btn;
      // the real button, lifted out of the same capture so it can be pressed; the backing hides the
      // captured button underneath while the lifted one is scaled down
      box(S.card, bt_.x, bt_.y, bt_.w, bt_.h, 'border-radius:12px;background:rgb(14,26,38)');
      S.btn = reg(box(S.card, bt_.x, bt_.y, bt_.w, bt_.h,
        `border-radius:12px;background:url(${CAP}el_form.png) -${bt_.x}px -${bt_.y}px / ${F.w}px ${F.h}px;transform-origin:50% 50%`));
      // the site's own cursor (#cursor-dot + #cursor-ring; cyan when hovering a button)
      S.ring = reg(box(S.card, 0, 0, 36, 36, 'border-radius:50%;border:1px solid rgba(100,255,180,.5);margin:-18px 0 0 -18px;transform-origin:50% 50%'), { o: 0 });
      S.dot = reg(box(S.card, 0, 0, 8, 8, 'border-radius:50%;background:#64ffb4;margin:-4px 0 0 -4px;transform-origin:50% 50%'), { o: 0 });
    },
    run(t, b, S) {
      drawDots(S.ctx, t, S.pts, 0.8);
      rise(t, S.cap, 'calc', null, { stagger: 0.12 });
      // card rises in and settles from a slight tilt
      const u = spHit(t, 'calc', 'default');
      put(S.card, { o: u > 0.001 ? 1 : 0, x: S.X, y: S.Y + pick(260, 300, 400) * (1 - u), s: S.K * (0.92 + 0.08 * u), r: 3 * (1 - u) });
      type(t, S.text, 'Cotton T-Shirt', 'type_in', 'type_out', S.caret, 10.6);
      // cursor glides in, hovers the button (cyan), presses on b12
      const bx = F.btn.x + F.btn.w * 0.2, by = F.btn.y + F.btn.h / 2;
      const p = trkObj(t, [[0, { x: F.w + 60, y: 420 }], [10.5, { x: bx, y: by }, 'default']]);
      const on = b >= 10.5 && b < 14 ? 1 : 0, hov = sp(t, 11.2, 'snappy');
      const press = spHit(t, 'press', 'snappy', 2 / 60) - sp(t, 12.3, 'snappy');
      put(S.dot, { o: on, x: p.x, y: p.y, s: 1 + 0.5 * hov, css: { background: hov > 0.5 ? '#00d9ff' : '#64ffb4' } });
      put(S.ring, { o: on, x: p.x, y: p.y, s: (1 + 0.39 * hov) * (1 - 0.3 * press), css: { borderColor: hov > 0.5 ? 'rgba(0,217,255,.6)' : 'rgba(100,255,180,.5)' } });
      put(S.btn, { s: 1 - 0.04 * press });
      // push into the button (expo-in) — the result cuts in on b16
      const cx = S.X + S.K * bx, cy = S.Y + S.K * by;
      const k = 0.04 * ease.inOut(seg(t, 'calc', 14)) + 4 * ease.expoIn(seg(t, 14, 'result'));
      put(S.cam, { s: 1 + k, x: -cx * k, y: -cy * k });
    },
  });

  // ---------------------------------------------------------------- 3. result  (b16 → b24)
  // el_result_blank.png = the real .result-hero-card with #resultValue hidden; the number is re-set on top.
  const R = { w: 1136, h: 335, v: { x: 49, y: 49, w: 1038, h: 96 }, pill: { x: 430, y: 212, w: 276, h: 31 } };
  const B = { w: 425, h: 387 };
  scene({
    name: 'result', from: 'result', to: 'mont',
    build(root, S) {
      S.ctx = canvas(root); S.pts = makeDots(37, 90);
      S.cam = cam(root, pick(W / 2, W / 2, W / 2), pick(560, 700, 900));
      const cy = pick(120, 120, 340), cs = pick(104, 90, 84);
      S.c1 = line(S.cam, 'Get the number.', { x: PAD, y: cy, size: cs, accent: [2] });
      S.c2 = line(S.cam, 'And the uncertainty.', { x: PAD, y: cy, size: cs, accent: [2] });
      S.K = pick(0.95, 0.82, 0.82);
      S.pos = { x: PAD, y: pick(330, 330, 540) };
      S.card = reg(box(S.cam, 0, 0, R.w, R.h, 'border-radius:20px;box-shadow:0 2px 6px rgba(0,0,0,.4),0 40px 90px -20px rgba(0,0,0,.85)'), { o: 0 });
      img(S.card, 'el_result_blank.png', R.w, R.h);
      S.num = reg(box(S.card, R.v.x, R.v.y, R.v.w, R.v.h,
        `text-align:center;font:700 96px/1 Display;font-variant-numeric:tabular-nums;transform-origin:50% 50%;
         background:linear-gradient(135deg,#64ffb4,#00d9ff);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent`));
      S.ul = reg(box(S.card, R.pill.x + 14, R.pill.y + R.pill.h + 10, R.pill.w - 28, 3, 'background:#64ffb4;border-radius:2px'), { o: 0 });
      S.K2 = pick(1.22, 1.2, 1.5);
      S.pos2 = { x: pick(W - PAD - B.w * 1.22, PAD, PAD), y: pick(330, 640, 860) };
      S.bd = reg(box(S.cam, 0, 0, B.w, B.h, 'border-radius:20px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.4),0 40px 90px -20px rgba(0,0,0,.85)'), { o: 0 });
      img(S.bd, 'el_breakdown.png', B.w, B.h);
    },
    run(t, b, S) {
      drawDots(S.ctx, t, S.pts, 0.8);
      put(S.cam, { s: 1 + 0.06 * ease.inOut(seg(t, 'result', 'mont')) });
      rise(t, S.c1, 16.25, 18.2, { stagger: 0.12 });
      rise(t, S.c2, 'ci', null, { stagger: 0.12 });
      const u = spHit(t, 'result', 'default');
      const lift = TALL ? trk(t, [[0, 260], ['breakdown', 0, 'default']]) : 0;
      put(S.card, { o: u > 0.001 ? 1 : 0, x: S.pos.x, y: S.pos.y + lift + 140 * (1 - u), s: S.K * (0.94 + 0.06 * u) });
      // count-up 0 → 2.94 (the model's real output), lands on b18
      const v = 2.94 * ease.out(seg(t, 16.2, 'count_end'));
      const pop = spHit(t, 'count_end', 'snappy', 0.08) - sp(t, 18.25, 'default');
      put(S.num, { text: v.toFixed(2), s: 1 + 0.12 * pop });
      const w = spHit(t, 'ci_ul', 'snappy', C.LEAD);
      put(S.ul, { o: w > 0.01 ? 1 : 0, sx: w });
      const d = spHit(t, 'breakdown', 'default', C.LEAD);
      put(S.bd, { o: d > 0.001 ? 1 : 0, x: S.pos2.x, y: S.pos2.y + 200 * (1 - d), s: S.K2 * (0.9 + 0.1 * d), r: 2.5 * (1 - d) });
    },
  });

  // ---------------------------------------------------------------- 4. montage  (b24 → b32), one real page per 2 beats
  // page captures are 1600×1000 css viewports; crop below the nav to the content column
  const CROP = TALL ? { x: 220, y: 80, w: 760, h: 780 } : { x: 200, y: 80, w: 1200, h: 900 };
  const PAGES = [['m_ins', 'insights', 'Explain.'], ['m_cmp', 'compare', 'Compare.'], ['m_dec', 'decompose', 'Decompose.'], ['m_adv', 'advisor', 'Ask.']];
  PAGES.forEach(([mark, page, word], i) => {
    const next = i < 3 ? PAGES[i + 1][0] : 'end';
    scene({
      name: page, from: mark, to: next,
      build(root, S) {
        const K = pick(0.85, 0.75, 1.3), w = CROP.w * K, h = CROP.h * K;
        S.base = { x: pick(W - 70 - w, (W - w) / 2, (W - w) / 2), y: pick((H - h) / 2, 380, 480) };
        S.shot = reg(box(root, 0, 0, w, h, 'transform-origin:50% 50%'));
        S.shot.className = 'shot';
        const im = el('img', { src: `${CAP}${page}.png`, style: `width:${1600 * K}px;height:${1000 * K}px;left:${-CROP.x * K}px;top:${-CROP.y * K}px` }, S.shot);
        im.className = '';
        S.w = line(root, word, { x: PAD, y: pick(H / 2 - 80, 150, 290), size: pick(130, 120, 126), accent: [0] });
        S.dir = i % 2 ? 1 : -1;
      },
      run(t, b, S) {
        const k = seg(t, mark, next);
        put(S.shot, { x: S.base.x + 30 * S.dir * k, y: S.base.y, s: 1 + 0.04 * k });
        rise(t, S.w, mark, null, { preset: 'snappy' });
      },
    });
  });

  // ---------------------------------------------------------------- 5. end card  (b32 → b38)
  scene({
    name: 'end', from: 'end', to: 'done',
    build(root, S) {
      S.ctx = canvas(root); S.pts = makeDots(51, 120);
      S.cam = cam(root, PAD, H / 2);
      const ls = pick(170, 140, 128), ly = pick(230, 260, 700);
      S.mark = reg(box(S.cam, PAD, ly + ls * 0.04, ls, ls, 'transform-origin:50% 50%'), { o: 0 });
      el('img', { src: '../assets/brand/logo_0.svg', style: `width:${ls}px;height:${ls}px` }, S.mark);
      S.word = line(S.cam, 'C4 Future', { x: PAD + ls * 1.18, y: ly, size: ls, accent: [0] });
      S.tag = line(S.cam, 'Building a sustainable tomorrow.', { x: PAD, y: ly + ls * 1.35, size: pick(60, 48, 52), cls: 'ui', color: 'var(--ink-2)' });
      const cy = ly + ls * 1.35 + pick(120, 110, 130);
      const c1 = pick(88, 76, 80), c2 = pick(64, 58, 60);
      S.cta = [line(S.cam, 'Try it free →', { x: PAD, y: cy, size: c1, cls: 'ui', color: 'var(--accent)' }),
               line(S.cam, 'ad074890-c4future.hf.space', { x: PAD, y: cy + c1 * 1.2, size: c2, cls: 'ui' })];
      S.ctaW = c2 * 13.4;
      S.sweepY = cy + c1 * 1.2 + c2 * 1.3;
      S.sweep = reg(box(S.cam, 0, S.sweepY, 0, 6, 'background:var(--accent);border-radius:3px'), { o: 0 });
      // 16:9 only: the real home-page hero (headline + Calculate Now) balances the left-set lockup
      if (C.FMT === '16x9') {
        const HC = { x: 420, y: 110, w: 760, h: 580 }, k = 0.74;
        S.hero = reg(box(S.cam, 0, 0, HC.w * k, HC.h * k, 'transform-origin:50% 50%'), { o: 0 });
        S.hero.className = 'shot';
        el('img', { src: `${CAP}home_hero.png`, style: `width:${1600 * k}px;height:${1000 * k}px;left:${-HC.x * k}px;top:${-HC.y * k}px` }, S.hero);
        S.heroPos = { x: W - PAD - HC.w * k, y: (H - HC.h * k) / 2 };
      }
    },
    run(t, b, S) {
      drawDots(S.ctx, t, S.pts);
      put(S.cam, { s: 1 + 0.06 * ease.inOut(seg(t, 'end', 'done')) });
      const m = spHit(t, 'end', 'heavy', C.LEAD);
      put(S.mark, { o: m > 0.001 ? 1 : 0, s: 0.82 + 0.18 * m });
      rise(t, S.word, 'end', null, { stagger: 0.1 });
      rise(t, S.tag, beatOf('tag') - 0.1, null, { stagger: 0.04, preset: 'snappy' });
      S.cta.forEach((L, i) => rise(t, L, beatOf('cta') - 0.1 + i * 0.25, null, { stagger: 0.04, preset: 'snappy' }));
      if (S.hero) {
        const h = spHit(t, 'tag', 'default', C.LEAD);
        put(S.hero, { o: h > 0.001 ? 1 : 0, x: S.heroPos.x - 20 * seg(t, 'tag', 'done'), y: S.heroPos.y + 160 * (1 - h), s: 0.92 + 0.08 * h, r: 2 * (1 - h) });
      }
      const sw = Motion.indicator(t, [[0, PAD, PAD], [bt('sweep'), PAD, PAD + S.ctaW]]);
      put(S.sweep, { o: sw.size > 0.5 ? 1 : 0, x: sw.start, css: { width: sw.size + 'px' } });
    },
  });

  C.start();
})();

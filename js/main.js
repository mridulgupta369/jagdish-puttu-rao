/* ==========================================================================
   MAIN — Jagdish Puttu Rao
   Builds the stage from js/story.js and choreographs one master timeline
   that the scroll position scrubs. Time is measured in "beats"; one beat is
   BEAT_VH of scrolling.

   The engine is the one from the sample site (websites/life-story-sample).
   Rules that keep scrolling backwards exact (PROJECT_LOG.md §8):
   - every element gets its starting state from gsap.set() before the
     timeline is built, and the timeline only uses .set() and .to();
   - nothing that GSAP animates is also written by hand (hand-written
     effects use their own elements or CSS variables);
   - effects driven by plain state objects (portal, flight, walking legs,
     genie cards, the two-cities line, the COVID counter, the tractor
     wheels) are recomputed from that state every frame.
   ========================================================================== */
(function () {
  'use strict';

  const D = window.STORY, F = window.ArtFigures, S = window.ArtScenes;
  const K = window.ArtKarnataka || {}, DR = window.ArtDream || {}, PH = window.PhotoArt;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BEAT_VH = 60;

  if (!window.gsap || !window.ScrollTrigger) { document.body.classList.add('is-ready'); return; }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  const stage = $('#stage'), sky = $('#sky'), skyGlow = $('#skyGlow'), celestial = $('#celestial');
  const story = $('#story'), cast = $('#cast'), tagsEl = $('#tags'), transit = $('#transit'), pcWrap = $('#postcards'), hud = $('#hud');
  const scenes = {
    village: $('#scene-village'), mumbai: $('#scene-mumbai'), dubai: $('#scene-dubai'),
    world: $('#scene-world'), bangalore: $('#scene-bangalore'), farm: $('#scene-farm')
  };
  const cam = (k) => $('.scene__cam', scenes[k]) || scenes[k];

  /* photo or labelled placeholder */
  const photoSrc = (photo, tone, seed, w, hh) => photo || (PH ? PH.url({ w: w || 600, h: hh || 760, tone: tone || 'sepia', seed: seed || 1 }) : '');

  /* ------------------------------------------------------------------ *
   *  Placement helpers (design units → CSS variables)                   *
   * ------------------------------------------------------------------ */
  const css = (o) => Object.keys(o).map((k) => `${k}:${o[k]}`).join(';');
  function place(parent, art, o) {
    o = o || {};
    const s = o.s || 1;
    const el = h('div', 'el riser ' + (o.cls || ''));
    el.style.cssText = `--x:${o.x || 0};--y:${o.y || 0};--w:${(art.w * s).toFixed(1)};--h:${(art.h * s).toFixed(1)};` + (o.style || '');
    if (art.body !== undefined) {
      const open = (cls, style) => `<svg class="${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${art.w} ${art.h}" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false"${style ? ` style="${style}"` : ''}>`;
      let html = open('b', o.day ? css(o.day) : '') + art.body + '</svg>';
      if (o.night) html += open('b n', css(o.night)) + art.body + '</svg>';
      else if (o.nightFilter) html += open('b n nf') + art.body + '</svg>';
      if (art.lights) html += open('lt') + art.lights + '</svg>';
      el.innerHTML = html;
      el._n = $('.n', el);
      el._lt = $('.lt', el);
    } else {
      el.innerHTML = art.svg;
    }
    parent.appendChild(el);
    return el;
  }
  /* the dream: each piece is drawn twice, a pencil sketch that draws itself
     (pathLength=1 + stroke-dashoffset: var(--draw)) and the coloured art */
  const SHAPE_RE = /<(path|rect|circle|ellipse|line|polyline|polygon)\b/g;
  function placeSketch(parent, art, o) {
    o = o || {};
    const s = o.s || 1;
    const el = h('div', 'el dream ' + (o.cls || ''));
    el.style.cssText = `--x:${o.x || 0};--y:${o.y || 0};--w:${(art.w * s).toFixed(1)};--h:${(art.h * s).toFixed(1)};`;
    const open = (cls) => `<svg class="${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${art.w} ${art.h}" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">`;
    const sketch = art.body.replace(SHAPE_RE, '<$1 pathLength="1"').replace(/id="/g, 'id="sk-').replace(/url\(#/g, 'url(#sk-');
    el.innerHTML = open('sk') + sketch + '</svg>' + open('col') + art.body + '</svg>';
    el._sk = $('.sk', el);
    el._col = $('.col', el);
    if (o.track) el._col.dataset.track = o.track;
    parent.appendChild(el);
    return el;
  }
  function band(parent, o) {
    const el = h('div', 'band riser ' + (o.cls || ''));
    el.style.cssText = `--y:${o.y || 0};--h:${o.h};--tw:${o.tw || 1600};` + (o.bg ? `background-image:${o.bg};` : '') + (o.style || '');
    if (o.html) el.innerHTML = o.html;
    parent.appendChild(el);
    return el;
  }
  function flock(parent, n, top, color, seed) {
    const f = h('div', 'flock');
    f.style.cssText = `left:0;right:0;top:${top}vh;color:${color};`;
    for (let i = 0; i < n; i++) {
      const b = h('span', '', S.bird());
      const r = Math.sin(seed * 9.1 + i * 3.7) * 0.5 + 0.5;
      b.style.cssText = `top:${(i % 3) * 16 + r * 14}px;--bd:${28 + r * 8};--bdl:${i * 1.6 + seed * 5}`;
      f.appendChild(b);
    }
    parent.appendChild(f);
    return f;
  }
  function fireflies(parent, n) {
    const ff = h('div', 'fireflies');
    for (let i = 0; i < n; i++) {
      const fl = h('i', 'firefly');
      const r = (k) => Math.abs((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1);
      const a = r(1), b = r(2), c2 = r(3);
      fl.style.cssText = `--fx:${(a * 100).toFixed(1)};--fy:${(10 + b * 34).toFixed(1)};--fd:${(4 + c2 * 5).toFixed(1)};--fb:${(1.4 + a * 2.4).toFixed(1)};--fdl:${(b * 6).toFixed(1)};--fmx:${((c2 - 0.5) * 90).toFixed(0)};--fmy:${((a - 0.5) * 70).toFixed(0)}`;
      ff.appendChild(fl);
    }
    parent.appendChild(ff);
    return ff;
  }
  const layers = (els, key) => els.map((e) => e[key]).filter(Boolean);
  const svgTile = (w, hh, inner) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${hh}" width="${w}" height="${hh}" preserveAspectRatio="none">${inner}</svg>`)}")`;

  /* ------------------------------------------------------------------ *
   *  Sky furniture                                                      *
   * ------------------------------------------------------------------ */
  const storm = h('div', 'storm');
  $('#clouds').before(storm);
  const cloudsEl = $('#clouds');
  [[36, 7, 150, 10], [24, 17, 190, 70], [30, 3, 170, 120], [20, 24, 210, 40], [32, 12, 175, 150], [22, 30, 200, 95]].forEach(([w, y, d, dl], i) => {
    const c = h('div', 'cloud', S.cloud({ seed: i + 3, w: 420 }));
    c.style.cssText = `--cw:${w};--cy:${y};--cd:${d};--cdl:${dl};`;
    cloudsEl.appendChild(c);
  });
  $('#moon').innerHTML = S.moon();

  /* ------------------------------------------------------------------ *
   *  Palettes (static per layer; night falls by crossfading layers)     *
   * ------------------------------------------------------------------ */
  const DUBAI_DUSK = { '--d-tower-b': '#8a6f8f', '--d-tower-bh': '#a08aa6', '--d-tower-f': '#5d4f78', '--d-tower-hi': '#7a6d96', '--d-burj': '#4b4f80', '--d-burj-hi': '#6d74a8', '--d-burj-sh': '#373b66', '--d-frame': '#d9b25a', '--d-frame-d': '#a8862f', '--d-ba-spine': '#efe9f2', '--d-dune-b': '#c88c5a', '--d-ba-day': 1 };
  const DUBAI_NIGHT = { '--d-tower-b': '#262a4f', '--d-tower-bh': '#30355e', '--d-tower-f': '#151a38', '--d-tower-hi': '#232a52', '--d-burj': '#1a2046', '--d-burj-hi': '#2a3366', '--d-burj-sh': '#10153a', '--d-frame': '#a68434', '--d-frame-d': '#6e5520', '--d-ba-spine': '#a6a2c4', '--d-dune-b': '#3b3157', '--d-ba-day': 0.55 };
  const BOMBAY_DUSK = { '--m-far': '#5e4f72', '--m-link': '#4c4466', '--m-stone': '#93716c', '--m-stone-l': '#a98482', '--m-stone-d': '#6c5258', '--m-open': '#3a2c3c', '--m-taj': '#a08589', '--m-dome': '#7a3a44', '--m-win': '#ffcf7a', '--m-d1': '#9f8b97', '--m-d2': '#a48593', '--m-d3': '#8f9aa0', '--m-d4': '#a99a86', '--m-dwin': '#ffd38a', '--m-dacc': '#8a6f6a', '--m-wall': '#8f8697', '--m-wall-d': '#6d6577', '--m-walk': '#7d7487' };

  /* ------------------------------------------------------------------ *
   *  Scenes                                                             *
   * ------------------------------------------------------------------ */
  const V = {}, M = {}, DB = {}, B = {}, FM = {};

  /* Peradi: Western Ghats hills, a river, paddy, areca and coconut palms */
  (function buildVillage() {
    const c = cam('village');
    V.hills = band(c, { y: 232, h: 250, tw: 1700, bg: S.ridgeTile({ w: 1700, h: 250, seed: 4, segs: 6, lo: 0.22, hi: 0.9, top: '#c7b3d6', bottom: '#ebcac4' }) });
    V.hills2 = band(c, { y: 228, h: 160, tw: 1300, bg: S.ridgeTile({ w: 1300, h: 160, seed: 9, segs: 5, lo: 0.15, hi: 0.72, top: '#a597c4', bottom: '#c9b0c3' }) });
    V.farbank = band(c, { y: 212, h: 90, tw: 900, bg: S.farBankTile() });
    V.college = K.college ? place(c, K.college(), { x: -430, y: 216, s: 0.68 }) : h('div');
    V.river = band(c, { y: 150, h: 86, cls: 'river band--fill', html: `<div class="river__day"></div><div class="shimmer" style="background-image:${S.shimmerTile('#ffffff', 5)}"></div><div class="glitter"></div>` });
    V.riverDay = $('.river__day', V.river);
    V.paddy = band(c, { y: 30, h: 140, tw: 800, bg: S.paddyTile() });
    const palms = [
      { k: 'coco', x: -1060, y: 96, h: 660, lean: 54, s: 7 }, { k: 'coco', x: -930, y: 104, h: 520, lean: -36, s: 2 },
      { k: 'areca', x: -300, y: 128, h: 300, lean: 8, s: 3 },
      { k: 'areca', x: 640, y: 118, h: 560, lean: -8, s: 4 }, { k: 'areca', x: 735, y: 112, h: 650, lean: 10, s: 5 },
      { k: 'coco', x: 900, y: 100, h: 560, lean: 62, s: 5 }, { k: 'areca', x: 1030, y: 96, h: 700, lean: -12, s: 6 },
      { k: 'areca', x: 1110, y: 104, h: 600, lean: 6, s: 8 }, { k: 'coco', x: 1210, y: 106, h: 520, lean: 22, s: 13 }
    ];
    V.palms = palms.map((p, i) => {
      const art = p.k === 'areca' && K.arecaPalm ? K.arecaPalm({ h: p.h, lean: p.lean, seed: p.s }) : S.palm({ h: p.h, lean: p.lean, seed: p.s });
      const el = place(c, art, { x: p.x, y: p.y, cls: 'palm' });
      el.style.setProperty('--sd', (5 + (i % 3) * 1.4).toFixed(1));
      return el;
    });
    V.house = place(c, S.keralaHouse(), { x: 560, y: 86, s: 1.32 });
    V.bund = band(c, { y: 0, h: 120, tw: 600, bg: S.bundTile() });
    V.flock = flock(c, 5, 16, '#4a3d55', 1);
  })();

  /* Bombay, 1980s–2003 (no Sea Link: it opened in 2009) */
  (function buildMumbai() {
    const sk = $('.scene-sky', scenes.mumbai);
    sk.innerHTML = '<div class="ms-sun"></div>';
    M.sky = sk;
    const c = cam('mumbai');
    const dusk = { night: BOMBAY_DUSK };
    M.far = place(c, S.skylineFar(), Object.assign({ x: 0, y: 316 }, dusk));
    M.sea = band(c, { y: 112, h: 216, cls: 'sea band--fill', html: `<div class="sea__storm"></div><div class="sea__dusk"></div><div class="shimmer" style="background-image:${S.shimmerTile('#ffffff', 8)}"></div><div class="glitter"></div>` });
    M.seaStorm = $('.sea__storm', M.sea);
    M.seaDusk = $('.sea__dusk', M.sea);
    M.taj = place(c, S.taj(), Object.assign({ x: -860, y: 122 }, dusk));
    M.gate = place(c, S.gateway(), Object.assign({ x: -500, y: 118 }, dusk));
    M.deco = place(c, S.artDeco(), Object.assign({ x: 680, y: 122, s: 0.92 }, dusk));
    /* Nerul, 1998: their first home rises */
    M.apts = K.apartments ? place(c, K.apartments(), { x: -130, y: 118, s: 0.68, nightFilter: true }) : h('div');
    M.ground = band(c, { y: -80, h: 120, cls: 'ground band--fill', html: '<div class="ground__dusk"></div>' });
    M.groundDusk = $('.ground__dusk', M.ground);
    M.prom = place(c, S.promenade(), Object.assign({ x: 0, y: 24 }, dusk));
    M.flock = flock(c, 6, 20, '#f6efe6', 2);
    const lit = [M.far, M.taj, M.gate, M.deco, M.prom];
    M.nights = layers(lit, '_n');
    M.lights = layers(lit, '_lt');
    M.aptNight = layers([M.apts], '_n');
    M.aptLights = layers([M.apts], '_lt');
  })();

  (function buildDubai() {
    const c = cam('dubai');
    const lit = { day: DUBAI_DUSK, night: DUBAI_NIGHT };
    DB.wave1 = [];
    const back = [[-1160, 70, 300, 'flat'], [-1060, 60, 380, 'spire'], [-960, 84, 250, 'step'], [-830, 64, 420, 'needle'], [-700, 92, 300, 'slant'],
      [-580, 70, 370, 'crown'], [-360, 80, 320, 'dome'], [-160, 66, 280, 'flat'], [160, 72, 330, 'step'], [330, 86, 300, 'flat'],
      [470, 70, 430, 'spire'], [700, 80, 330, 'slant'], [870, 64, 390, 'needle'], [1000, 90, 280, 'dome'], [1130, 70, 330, 'flat']];
    back.forEach(([x, w, hh, top], i) => DB.wave1.push(place(c, S.tower({ w, h: hh, top, seed: i + 20, tone: 'b' }), Object.assign({ x, y: 150 }, lit))));
    const duneDusk = S.duneTile({ w: 1600, h: 220, seed: 3, count: 4, lo: 0.3, hi: 0.85, top: '#e3ab79', bottom: '#c98a5c', rim: '#f6d1a2' });
    const duneNight = S.duneTile({ w: 1600, h: 220, seed: 3, count: 4, lo: 0.3, hi: 0.85, top: '#3b3157', bottom: '#2a2343', rim: '#6c5f92' });
    DB.duneB = band(c, { y: 64, h: 220, tw: 1600, bg: duneDusk });
    DB.duneBN = band(c, { y: 64, h: 220, tw: 1600, bg: duneNight });
    DB.wave2 = [];
    DB.frame = place(c, S.dubaiFrame(), Object.assign({ x: -830, y: 112, s: 0.92 }, lit)); DB.wave2.push(DB.frame);
    DB.emirates = place(c, S.emiratesTowers(), Object.assign({ x: -480, y: 104 }, lit)); DB.wave2.push(DB.emirates);
    const front = [[-1060, 96, 300, 'slant'], [-680, 80, 250, 'flat'], [250, 92, 450, 'crown'], [390, 70, 340, 'needle'], [880, 96, 340, 'step'], [1060, 80, 280, 'flat']];
    front.forEach(([x, w, hh, top], i) => DB.wave2.push(place(c, S.tower({ w, h: hh, top, seed: i + 60, tone: 'f' }), Object.assign({ x, y: 104 }, lit))));
    DB.museum = place(c, S.museumFuture(), Object.assign({ x: -250, y: 104, s: 0.66 }, lit)); DB.wave2.push(DB.museum);
    DB.baa = place(c, S.burjAlArab(), Object.assign({ x: 620, y: 100 }, lit)); DB.wave2.push(DB.baa);
    DB.burj = place(c, S.burjKhalifa(), Object.assign({ x: 0, y: 104 }, lit));
    const frontDusk = S.duneTile({ w: 1500, h: 170, seed: 8, count: 3, lo: 0.35, hi: 0.95, top: '#d8955e', bottom: '#b9784a', rim: '#f1c38c' });
    const frontNight = S.duneTile({ w: 1500, h: 170, seed: 8, count: 3, lo: 0.35, hi: 0.95, top: '#2c2545', bottom: '#1c1730', rim: '#4e4572' });
    DB.duneF = band(c, { y: 0, h: 170, tw: 1500, bg: frontDusk });
    DB.duneFN = band(c, { y: 0, h: 170, tw: 1500, bg: frontNight });
    DB.palms = [[-300, 62, -18], [330, 56, 14], [800, 70, -10]].map(([x, y, lean], i) =>
      place(c, S.palm({ h: 250, lean, seed: 40 + i, frond: '#2c2638', frondL: '#383145', trunk: ['#33293a', '#463a4c', '#33293a'] }), { x, y, cls: 'palm' }));
    const all = DB.wave1.concat(DB.wave2, [DB.burj]);
    DB.nights = layers(all, '_n');
    DB.lights = layers(all, '_lt');
  })();

  (function buildBangalore() {
    const c = cam('bangalore');
    B.far = place(c, S.vidhanaSoudha(), { x: -300, y: 150, s: 0.9 });
    B.trees = [place(c, S.rainTree({ seed: 3 }), { x: -1080, y: 100, s: 0.92 }), place(c, S.rainTree({ seed: 8, flip: true }), { x: 1000, y: 104 })];
    B.jac = [place(c, S.jacaranda({ seed: 9 }), { x: -660, y: 112, s: 0.82 }), place(c, S.jacaranda({ seed: 14 }), { x: 680, y: 116, s: 0.9 })];
    /* 2023: the temple where he is treasurer */
    B.temple = K.temple ? place(c, K.temple(), { x: -420, y: 106, s: 0.66, nightFilter: true }) : h('div');
    B.house = place(c, S.bungalow(), { x: 300, y: 122 });
    B.wall = band(c, { y: 88, h: 100, tw: 600, bg: S.wallTile() });
    B.gate = place(c, S.gate(), { x: 40, y: 88, s: 0.86 });
    B.roses = [[-560, 92, 1], [-200, 94, 2], [560, 92, 4], [880, 94, 3]].map(([x, y, sd]) => place(c, S.roses({ seed: sd }), { x, y, s: 0.9 }));
    B.lawn = band(c, { y: -22, h: 140, tw: 600, bg: S.lawnTile() });
    B.bench = place(c, S.bench(), { x: -420, y: 70, s: 0.9 });
    B.lamp = place(c, S.lampPost(), { x: -560, y: 66, s: 0.95 });
    B.lights = layers([B.house, B.lamp, B.temple], '_lt');
    B.templeNight = layers([B.temple], '_n');
    const pet = h('div', 'petals');
    for (let i = 0; i < 26; i++) {
      const p = h('i', 'petal');
      p.style.cssText = `--px:${(i * 37) % 100};--pd:${9 + (i % 7)};--pdl:${(i * 2.3) % 16};--pc:${['#a58ad8', '#b9a0e6', '#8f74c9'][i % 3]}`;
      pet.appendChild(p);
    }
    scenes.bangalore.appendChild(pet);
    B.petals = pet;
    B.ff = fireflies(scenes.bangalore, 22);
  })();

  /* The dream: farmland of his own, first in pencil, then in colour */
  (function buildFarm() {
    const c = cam('farm');
    const ridge = (stroke) => {
      let d = 'M0,150';
      for (let x = 0; x <= 1500; x += 50) d += ` L${x},${(150 - 60 * Math.sin(x / 1500 * Math.PI * 3) - 30 * Math.sin(x / 1500 * Math.PI * 7 + 1)).toFixed(1)}`;
      return stroke ? `<path d="${d}" fill="none" stroke="#6a5b4d" stroke-width="2.4" stroke-opacity=".75" stroke-linecap="round"/>` : `<path d="${d} L1500,220 L0,220 Z" fill="#a9c2a4"/><path d="${d}" fill="none" stroke="#c9dbc0" stroke-width="3" opacity=".6"/>`;
    };
    FM.hills = band(c, { y: 196, h: 220, tw: 1500, bg: svgTile(1500, 220, ridge(false)) });
    FM.hillsSk = band(c, { y: 196, h: 220, tw: 1500, cls: 'sketch', bg: svgTile(1500, 220, ridge(true)) });
    FM.fields = band(c, { y: 0, h: 230, tw: 1200, bg: DR.fieldsTile ? DR.fieldsTile() : '' });
    const rows = [[0, 26], [26, 46], [46, 72], [72, 100], [100, 136], [136, 178], [178, 220]];
    let fl = '', fur = '';
    rows.forEach(([y0, y1], i) => {
      fl += `M0,${y0 + 1} Q300,${y0 + 1 + (i % 2 ? 2 : -2)} 600,${y0 + 1} T1200,${y0 + 1} `;
      const n = 12 + i * 5;
      for (let k = 0; k < n; k++) {
        const x = (k + 0.5) * 1200 / n + Math.sin(k * 7.3 + i) * 3;
        const a = y0 + (y1 - y0) * 0.22, b = y1 - (y1 - y0) * 0.18;
        fur += `M${x.toFixed(1)},${a.toFixed(1)} L${(x + (x - 600) * 0.025).toFixed(1)},${b.toFixed(1)} `;
      }
    });
    FM.fieldsSk = band(c, { y: 0, h: 230, tw: 1200, cls: 'sketch', bg: svgTile(1200, 220, `<path d="${fl}" fill="none" stroke="#6a5b4d" stroke-width="1.8" stroke-opacity=".6"/><path d="${fur}" fill="none" stroke="#6a5b4d" stroke-width="1.3" stroke-opacity=".38" stroke-linecap="round"/>`) });
    FM.house = placeSketch(c, DR.farmhouse(), { x: 330, y: 168, s: 0.82, track: 'farm-house' });
    FM.mango = placeSketch(c, DR.mangoTree({ seed: 5 }), { x: 860, y: 136, s: 0.9, track: 'farm-mango' });
    FM.well = placeSketch(c, DR.well(), { x: -600, y: 120, s: 0.72, track: 'farm-well' });
    FM.scare = placeSketch(c, DR.scarecrow(), { x: -810, y: 110, s: 0.78, track: 'farm-scarecrow' });
    FM.cows = [placeSketch(c, DR.cow({}), { x: 520, y: 92, s: 0.6, track: 'farm-cow1' }), placeSketch(c, DR.cow({ flip: true, tone: '#e7dccb' }), { x: 700, y: 84, s: 0.56, track: 'farm-cow2' })];
    FM.tractor = placeSketch(c, DR.tractor(), { x: -360, y: 36, s: 0.62, cls: 'tractor', track: 'farm-tractor' });
    FM.crops = placeSketch(c, DR.crops({ seed: 2, w: 1800 }), { x: 0, y: -6, s: 1.1, track: 'farm-crops' });
    FM.pieces = [FM.house, FM.mango, FM.well, FM.scare].concat(FM.cows, [FM.tractor, FM.crops]);
    FM.wheels = $$('.wheel', FM.tractor);
    FM.night = h('div', 'farm-night');
    c.appendChild(FM.night);
    FM.glows = [[264, 214], [395, 214]].map(([x, y]) => { const g = h('div', 'farm-glow'); g.style.cssText = `--x:${x};--y:${y};`; c.appendChild(g); return g; });
    FM.flock = flock(c, 5, 18, '#5a4a40', 3);
    FM.ff = fireflies(scenes.farm, 24);
  })();

  /* ------------------------------------------------------------------ *
   *  Journeys: the bus out of Peradi, the plane to Dubai                *
   * ------------------------------------------------------------------ */
  const BUS = window.ArtBus.big();
  const coach = h('div', 'coach', `<div class="coach__zoom">${BUS.svg}</div>`);
  coach.style.cssText = `--portal-x:${BUS.px};--portal-y:${BUS.py};--cw:${BUS.w};--ch:${BUS.h};`;
  coach.dataset.track = 'bus';
  transit.appendChild(coach);
  const coachZoom = $('.coach__zoom', coach);
  const portalWin = $('.portal-win', coach);
  const portalBars = $('.portal-bars', coach);
  const plane = h('div', 'plane', S.planeBig().svg);
  transit.appendChild(plane);
  const contrail = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  contrail.setAttribute('class', 'contrail');
  contrail.innerHTML = '<defs><linearGradient id="ctg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".55" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity=".9"/></linearGradient></defs><path pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1"/>';
  transit.insertBefore(contrail, plane);
  const contrailPath = contrail.querySelector('path');
  const flightPos = (k) => [lerp(-18, 112, k), 92 - 84 * (1 - Math.pow(1 - k, 1.6))];
  function layoutContrail() {
    const vw = innerWidth, vh = stage.clientHeight || innerHeight;
    contrail.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
    let d = '';
    for (let i = 0; i <= 60; i++) { const [x, y] = flightPos(i / 60); d += (i ? ' L' : 'M') + (x * vw / 100).toFixed(1) + ' ' + (y * vh / 100 + vh * 0.012).toFixed(1); }
    contrailPath.setAttribute('d', d);
  }
  layoutContrail();

  /* ------------------------------------------------------------------ *
   *  People                                                             *
   * ------------------------------------------------------------------ */
  /* Jagdish: a lighter, wheatish tone at every age (family feedback, 2026-10-02) */
  const SKIN = { jp: '#b5835a', jpOld: '#b07e56', jpChild: '#b07b53', pr: '#9a6747', prOld: '#946345', kid: '#94603f' };
  const shirt = (c) => ({ kind: 'shirt', color: c });
  const trousers = (c) => ({ kind: 'trousers', color: c });
  const JP_YOUNG = { type: 'man', skin: SKIN.jp, hair: 'short', top: shirt('#dfe7f0'), bottom: trousers('#4a4a5a') };
  const WIFE = { type: 'woman', skin: SKIN.pr, hair: 'braid', jasmine: true, bindi: true, top: { kind: 'blouse', color: '#8f1d2c' }, bottom: { kind: 'saree', color: '#b3263a', border: '#e0b04a' } };
  const PEOPLE = {
    jpChild: { px: -60, gy: 58, enter: -110, fig: { type: 'child', skin: SKIN.jpChild, hair: 'short', top: shirt('#f4efe4'), bottom: { kind: 'shorts', color: '#33507a' }, prop: 'satchel' } },
    jpStudent: { px: -40, gy: 56, enter: -110, fig: Object.assign({}, JP_YOUNG, { prop: 'satchel' }) },
    jpLeave: { px: -40, gy: 56, fig: Object.assign({}, JP_YOUNG, { prop: 'trunk' }) },
    jpYoung: { px: 0, gy: 50, enter: -110, fig: Object.assign({}, JP_YOUNG, { prop: 'trunk' }) },
    jpBank: { px: 0, gy: 50, fig: { type: 'man', skin: SKIN.jp, hair: 'short', top: shirt('#f5f2ea'), bottom: trousers('#3b3a4c') } },
    jpCorp: { px: 0, gy: 50, fig: { type: 'man', skin: SKIN.jp, hair: 'short', top: { kind: 'suit', color: '#23304f', color2: '#7a2333' }, bottom: trousers('#23304f'), prop: 'briefcase', shoe: '#1a1412' } },
    wife: { px: 118, gy: 50, enter: 110, fig: WIFE },
    wifeBaby: { px: 118, gy: 50, fig: Object.assign({}, WIFE, { prop: 'baby', babyWrap: '#fbe7ec' }) },
    wife2: { px: 118, gy: 50, fig: Object.assign({}, WIFE, { top: { kind: 'blouse', color: '#2f5f4a' }, bottom: { kind: 'saree', color: '#3d8a6e', border: '#e0b04a' } }) },
    kid: { px: 196, gy: 50, enter: 110, fig: { type: 'child', skin: SKIN.kid, hair: 'pigtails', top: { kind: 'frock', color: '#f2c14e', color2: '#ffffff' }, bottom: { kind: 'none' }, shoe: '#c0392b' } },
    jpDubai: { px: -70, gy: 54, enter: -110, fig: { type: 'man', skin: SKIN.jp, hair: 'short', top: { kind: 'suit', color: '#2b2f45', color2: '#c9973a' }, bottom: trousers('#2b2f45'), prop: 'briefcase', shoe: '#1a1412' } },
    wifeD: { px: 52, gy: 54, enter: 110, fig: { type: 'woman', skin: SKIN.pr, hair: 'bun', jasmine: true, bindi: true, top: { kind: 'blouse', color: '#1f5f63' }, bottom: { kind: 'saree', color: '#2f7f7a', border: '#e0b04a' } } },
    kidD: { px: 158, gy: 54, enter: 110, fig: { type: 'child', skin: SKIN.kid, hair: 'long', top: { kind: 'frock', color: '#e8536b', color2: '#ffffff' }, bottom: { kind: 'none' }, shoe: '#ffffff' } },
    jpOld: { px: -130, gy: 48, enter: -110, fig: { type: 'man', skin: SKIN.jpOld, hair: 'grey', hairColor: '#cfc9c1', glasses: true, top: { kind: 'kurta', color: '#f3efe6' }, bottom: trousers('#5a5a66') } },
    wifeOld: { px: 0, gy: 48, enter: 110, fig: { type: 'woman', skin: SKIN.prOld, hair: 'greybun', hairColor: '#d4cec6', jasmine: true, bindi: true, top: { kind: 'blouse', color: '#c9973a' }, bottom: { kind: 'saree', color: '#f4ecd8', border: '#c9973a' } } },
    pranjali: { px: 112, gy: 48, enter: 110, fig: { type: 'woman', skin: SKIN.kid, hair: 'long', top: { kind: 'kurta', color: '#d9a43a', color2: '#7a2e2a' }, bottom: trousers('#f1ebe0') } },
    mridul: { px: 200, gy: 48, enter: 110, fig: { type: 'man', skin: '#a0704f', hair: 'short', top: shirt('#5f7a9a'), bottom: trousers('#2f3f5a') } },
    jpFarm: { px: -20, gy: 54, enter: -110, fig: { type: 'man', skin: SKIN.jpOld, hair: 'grey', hairColor: '#cfc9c1', glasses: true, top: shirt('#ece4cf'), bottom: { kind: 'mundu' }, prop: 'towel' } }
  };
  const P = {};
  const people = [];
  function addPerson(key, el, def, meta) {
    el.dataset.key = key;
    cast.appendChild(el);
    el._legs = $$('.fg-leg', el).map((g) => ({ g, px: +g.dataset.px, py: +g.dataset.py }));
    el._arms = $$('.fg-arm', el).map((g) => ({ g, px: +g.dataset.px, py: +g.dataset.py, amp: +g.dataset.amp }));
    el._skirt = !!meta.skirt;
    el._h = meta.headTop;
    el._px = def.px; el._gy = def.gy; el._enter = def.enter || 0;
    el._lastOff = el._enter; el._phase = 0; el._amt = 0; el._posed = false;
    P[key] = el;
    people.push(el);
  }
  Object.entries(PEOPLE).forEach(([key, def]) => {
    const src = D.people && D.people[key];
    const fig = F.figure(def.fig);
    const el = h('div', 'person');
    el.style.cssText = `--px:${def.px};--gy:${def.gy};--vbw:${fig.w};--vbh:${fig.h};--ax:${fig.ax};--bw:${F.BODY[fig.type].W};`;
    el.innerHTML = '<div class="person__shadow"></div>' + (src && src.photo ? `<img src="${esc(src.photo)}" alt="" style="width:100%;height:100%;object-fit:contain;object-position:50% 100%">` : fig.svg);
    addPerson(key, el, def, { skirt: def.fig.bottom && (def.fig.bottom.kind === 'saree' || def.fig.bottom.kind === 'mundu'), headTop: fig.headTop });
  });
  /* the maroon-and-camouflage trolley bag rolls in like a person walks */
  (function addBag() {
    const art = K.trolleyBag ? K.trolleyBag() : { w: 140, h: 210, svg: '<svg viewBox="0 0 140 210"><rect x="16" y="44" width="108" height="150" rx="16" fill="#7a1f2b"/></svg>' };
    const def = { px: 40, gy: 54, enter: 110 };
    const k = 0.6;
    const el = h('div', 'person person--prop');
    el.style.cssText = `--px:${def.px};--gy:${def.gy};--vbw:${art.w * k};--vbh:${art.h * k};--ax:${art.w * k / 2};--bw:${art.w * k};`;
    el.innerHTML = '<div class="person__shadow"></div>' + art.svg;
    addPerson('trolleyBag', el, def, { headTop: art.h * k });
  })();

  function pose(el, phase, amt) {
    const s = Math.sin(phase);
    const legA = (el._skirt ? 8 : 17) * s * amt;
    for (let i = 0; i < el._legs.length; i++) {
      const L = el._legs[i];
      L.g.setAttribute('transform', `rotate(${(i ? -legA : legA).toFixed(2)} ${L.px} ${L.py})`);
    }
    for (let i = 0; i < el._arms.length; i++) {
      const A = el._arms[i];
      A.g.setAttribute('transform', `rotate(${((i ? 1 : -1) * 14 * s * amt * A.amp).toFixed(2)} ${A.px} ${A.py})`);
    }
    el.style.setProperty('--bob', (-Math.abs(Math.cos(phase)) * 3.2 * amt).toFixed(2));
  }

  /* ------------------------------------------------------------------ *
   *  Tags (little floating notes)                                       *
   * ------------------------------------------------------------------ */
  const tagEls = [];
  function tag(html, who, o) {
    o = o || {};
    const el = h('div', 'tag' + (o.event ? ' tag--event' : ''), html);
    el.style.cssText = `--px:${who._px + (o.dx || 0)};--gy:${who._gy};--ty:${who._h + (o.lift || 34)};`;
    tagsEl.appendChild(el);
    tagEls.push(el);
    return el;
  }
  const ev = (k) => { const e = D.events[k]; return (e.year ? `<b>${esc(e.year)}</b>` : '') + esc(e.text); };
  const T_school = tag(ev('school'), P.jpChild, { event: true });
  const T_sbi = tag(ev('sbi'), P.jpBank);
  const T_pg = tag(ev('pg'), P.jpCorp);
  const T_kel = tag(ev('kelloggs'), P.jpCorp);
  const T_pranjali = tag(ev('pranjali'), P.wifeBaby, { event: true });
  const T_nerul = tag(ev('nerul'), P.jpCorp, { event: true, lift: 46 });
  const T_trolley = tag(ev('trolley'), P.trolleyBag, { event: true, lift: 230, dx: 40 });
  const T_odisha = tag(ev('odisha'), P.jpOld, { event: true });
  const T_dharam = tag(ev('dharamshala'), P.wifeOld, { event: true });

  /* ------------------------------------------------------------------ *
   *  Text panels                                                        *
   * ------------------------------------------------------------------ */
  function splitWords(words) {
    return words.map((w, i) => {
      if (!w) return '';
      const chars = [...w].map((c) => `<span class="c">${esc(c)}</span>`).join('');
      return i === words.length - 1 && words.length > 1 ? `<em class="w">${chars}</em>` : `<span class="w">${chars}</span>`;
    }).filter(Boolean).join(' ');
  }

  const person = D.person;
  const hero = h('section', 'panel hero', `
    <div class="hero__in">
      <p class="hero__eyebrow">${esc(person.eyebrow)}</p>
      <h1 class="hero__name">${splitWords([person.first, person.middle, person.last])}</h1>
      <div class="hero__line"></div>
      <p class="hero__intro">${esc(person.intro)}</p>
      <p class="hero__sample">${esc(person.note)}</p>
    </div>
    <div class="hero__cue"><span>${'ontouchstart' in window ? 'Swipe up to begin' : 'Scroll to begin'}</span><i></i></div>`);
  story.appendChild(hero);

  const panels = {};
  Object.entries(D.chapters).forEach(([id, c]) => {
    const p = h('section', 'panel panel--' + id, `
      <div class="panel__in">
        <p class="kicker"><span class="kicker__num">Chapter ${esc(c.numeral)}</span><span class="kicker__rule"></span><span class="kicker__years">${esc(c.years)}</span></p>
        <h2 class="title">${splitWords(c.title)}</h2>
        <p class="place">${esc(c.place)}</p>
        <p class="body">${esc(c.body)}</p>
        ${c.skills && c.skills.length ? `<ul class="skills" aria-label="Highlights">${c.skills.map((s) => `<li class="chip"><span class="chip__dot"></span>${esc(s)}</li>`).join('')}</ul>` : ''}
        ${c.soon ? `<p class="soon">${esc(c.soon)}</p>` : ''}
      </div>`);
    story.appendChild(p);
    panels[id] = p;
  });
  const soonEl = $('.soon', panels.dream);

  /* keepsakes: certificates, the bus ticket, polaroids */
  function cert(c, track) {
    const el = h('div', 'cert', `
      <div class="cert__in">
        <p class="cert__top">${esc(c.top)}</p>
        <p class="cert__title">${esc(c.title)}</p>
        <p class="cert__grade">${esc(c.grade)}</p>
        <div class="cert__meta"><span>${esc(c.meta[0])}</span><span>${esc(c.meta[1])}</span></div>
        <div class="cert__seal">${esc(c.seal)}</div>
      </div>`);
    el.dataset.track = track;
    story.appendChild(el);
    return el;
  }
  const certB = cert(D.certificates.bcom, 'cert-bcom');
  const certC = cert(D.certificates.cma, 'cert-cma');

  const L = D.luggage;
  const ticket = h('div', 'ticket', `
    <div class="ticket__top"><span>${esc(L.kicker)}</span><span>${esc(L.note)}</span></div>
    <div class="ticket__route">${esc(L.from)} <span>to</span> ${esc(L.to)}</div>
    <div class="ticket__meta"><span>${esc(L.name)}</span><span>${esc(L.extra)}</span></div>
    <div class="ticket__stamp">${esc(L.to.toUpperCase())}<br>BOUND</div>`);
  story.appendChild(ticket);

  const frames = {};
  Object.entries(D.frames).forEach(([k, fr], i) => {
    const el = h('figure', 'frame frame--' + k, `
      <span class="frame__img"><img src="${esc(photoSrc(fr.photo, fr.tone, i + 3, 480, 600))}" alt="" decoding="async">${fr.photo ? '' : '<span class="frame__badge">Photo to come</span>'}</span>
      <figcaption class="frame__cap">${esc(fr.label)}</figcaption>
      <span class="frame__tape"></span>`);
    el.dataset.track = 'frame-' + k;
    story.appendChild(el);
    frames[k] = el;
  });

  /* Bombay ⟷ Huvina Hadagali: two years of long distance */
  const AP = D.apart;
  const miniBombay = `<svg viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="apb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2c5c"/><stop offset="1" stop-color="#c9708a"/></linearGradient></defs><rect width="160" height="120" fill="url(#apb)"/><circle cx="122" cy="34" r="9" fill="#fff1cf"/><path d="M0,86 h12 v-24 h10 v14 h8 v-30 h12 v40 h10 v-22 h14 v16 h10 v-34 h8 v-8 h4 v8 h6 v42 h12 v-18 h12 v12 h10 v-26 h14 V120 H0 Z" fill="#1a1838"/><path d="M0,98 Q80,90 160,98 V120 H0 Z" fill="#33325e"/><g fill="#ffd38a">${Array.from({ length: 22 }, (_, i) => `<circle cx="${4 + i * 7.3}" cy="${96 - Math.sin(i / 21 * Math.PI) * 4}" r="1.3"/>`).join('')}</g></svg>`;
  const jas = K.jasmineBush ? K.jasmineBush({ seed: 5, w: 160 }).svg : '';
  const miniHadagali = `<svg viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="aph" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc6e4"/><stop offset="1" stop-color="#f6e2c2"/></linearGradient></defs><rect width="160" height="120" fill="url(#aph)"/><path d="M0,70 Q40,58 80,66 T160,62 V120 H0 Z" fill="#b8c98a"/><g transform="translate(0 40)">${jas.replace(/^<svg[^>]*>/, '<svg x="0" y="0" width="160" height="80" viewBox="0 0 160 80">')}</g></svg>`;
  const flower = '<svg viewBox="-12 -12 24 24"><g fill="#fffdf4" stroke="#e9dcb4" stroke-width=".6">' + [0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-6" rx="3.4" ry="6" transform="rotate(${a})"/>`).join('') + '</g><circle r="2.4" fill="#f2d98a"/></svg>';
  const apartEl = h('div', 'apart', `
    <div class="apart__row">
      <div class="apart__card apart__card--a"><div class="apart__art">${miniBombay}</div><b>${esc(AP.a.place)}</b><span>${esc(AP.a.who)}</span></div>
      <svg class="apart__line" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true"><path d="M4,40 C120,0 280,0 396,40"/></svg>
      <span class="apart__tok">${flower}</span>
      <div class="apart__card apart__card--b"><div class="apart__art">${miniHadagali}</div><b>${esc(AP.b.place)}</b><span>${esc(AP.b.who)}</span></div>
    </div>
    <p class="apart__cap"><span class="apart__c1">${esc(AP.during)}</span><span class="apart__c2">${esc(AP.after)}</span></p>`);
  apartEl.dataset.track = 'apart';
  story.appendChild(apartEl);
  const apRow = $('.apart__row', apartEl), apTok = $('.apart__tok', apartEl), apLine = $('.apart__line', apartEl);
  const apA = $('.apart__card--a', apartEl), apB = $('.apart__card--b', apartEl);
  const apC1 = $('.apart__c1', apartEl), apC2 = $('.apart__c2', apartEl);

  const DEP = D.departures;
  const board = h('div', 'board', `
    <div class="board__head"><span>Departures</span><b>${esc(DEP.airport)}</b><span>${esc(DEP.year)}</span></div>
    <div class="board__cols"><span>Flight</span><span>To</span><span>Gate</span><span>Remarks</span></div>
    <div class="board__row"><div class="flaps" data-t="EK 507"></div><div class="flaps" data-t="DUBAI"></div><div class="flaps" data-t="12"></div><div class="flaps flaps--status" data-t="BOARDING"></div></div>
    <div class="board__row"><div class="flaps" data-t="GF 065"></div><div class="flaps" data-t="BAHRAIN"></div><div class="flaps" data-t="09"></div><div class="flaps" data-t="ON TIME"></div></div>
    <div class="board__row"><div class="flaps" data-t="KU 302"></div><div class="flaps" data-t="KUWAIT"></div><div class="flaps" data-t="11"></div><div class="flaps" data-t="DELAYED"></div></div>`);
  story.appendChild(board);
  const flapCells = [];
  $$('.flaps', board).forEach((f) => {
    const len = { 0: 6, 1: 7, 2: 2, 3: 8 }[[...f.parentNode.children].indexOf(f)];
    const txt = f.dataset.t.padEnd(len, ' ');
    [...txt].forEach((ch) => { const c = h('span', 'flap', ch === ' ' ? '&nbsp;' : esc(ch)); c.dataset.ch = ch; c._done = true; f.appendChild(c); flapCells.push(c); });
  });
  const FLAP_CHARS = 'ABCDEFGHJKLMNOPRSTUVWXYZ0123456789';
  let flapT0 = 0, flapTick = -1, flapSteps = [];
  function runFlaps() {
    flapCells.forEach((c) => { c._done = false; });
    flapSteps = flapCells.map((c, i) => 4 + (i % 9) + Math.floor(Math.random() * 6));
    flapT0 = performance.now();
    flapTick = -1;
  }
  function stepFlaps(now) {
    if (!flapT0) return;
    const tick = Math.floor((now - flapT0) / 58);
    if (tick === flapTick) return;
    flapTick = tick;
    let busy = false;
    for (let i = 0; i < flapCells.length; i++) {
      const c = flapCells[i];
      if (tick < flapSteps[i]) {
        busy = true;
        c.textContent = FLAP_CHARS[(i * 7 + tick * 13) % FLAP_CHARS.length];
        c.classList.toggle('is-flip');
      } else if (!c._done) {
        c.innerHTML = c.dataset.ch === ' ' ? '&nbsp;' : esc(c.dataset.ch);
        c._done = true;
        c.classList.remove('is-flip');
      }
    }
    if (!busy) flapT0 = 0;
  }

  /* 2020: thirty days instead of fifteen */
  const CV = D.covid;
  const covidEl = h('section', 'covid', `
    <div class="covid__in">
      <p class="covid__kicker">${esc(CV.kicker)}</p>
      <div class="covid__count"><b class="covid__num">1</b><span>${esc(CV.unit)}</span></div>
      <div class="covid__bar"><i></i><em class="covid__mark">${CV.from} · the rule</em></div>
      <p class="covid__body">${esc(CV.body)}</p>
    </div>`);
  covidEl.dataset.track = 'covid';
  story.appendChild(covidEl);
  const covNum = $('.covid__num', covidEl), covBar = $('.covid__bar i', covidEl), covMark = $('.covid__mark', covidEl);
  covMark.style.left = ((CV.from - 1) / (CV.to - 1) * 100).toFixed(2) + '%';

  const WK = D.weeks;
  const weeksYears = 2026 - person.born + 1;
  const weeksPanel = h('section', 'weeks', `
    <div class="weeks__in">
      <h2 class="weeks__title"><em>${esc(WK.title)}</em> weeks</h2>
      <p class="weeks__sub">${esc(WK.sub)}</p>
      <canvas id="weeksCanvas" width="520" height="650" aria-hidden="true"></canvas>
      <ul class="weeks__legend">${WK.eras.map((e) => `<li><i style="--c:${e.color}"></i>${esc(e.label)}</li>`).join('')}<li class="is-next"><i></i>The farm · soon</li></ul>
    </div>`);
  story.appendChild(weeksPanel);

  const fin = D.finale;
  const finale = h('section', 'panel finale', `
    <div class="panel__in">
      <p class="kicker"><span class="kicker__num">${esc(fin.kicker)}</span><span class="kicker__rule"></span></p>
      <h2 class="title">${splitWords(fin.title)}</h2>
      <ul class="stats">${fin.stats.map((s) => `<li class="stat"><b data-v="${s.value}">0</b><span>${esc(s.label)}</span></li>`).join('')}</ul>
      <p class="quote">${esc(fin.line)}</p>
      <p class="signature">${esc(fin.sign)}</p>
      <button class="replay" type="button" id="replay"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v5h5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>${esc(fin.replay)}</button>
      <p class="finale__note">${esc(fin.credit)} ${esc(person.note)}</p>
    </div>`);
  story.appendChild(finale);
  const statEls = $$('.stat b', finale);

  /* ------------------------------------------------------------------ *
   *  Postcards (one per trip; NITK is a genie card instead)             *
   * ------------------------------------------------------------------ */
  const LEGS = D.legs;
  const cardLegs = LEGS.map((l, i) => (l.card ? i : -1)).filter((i) => i >= 0);
  const cards = cardLegs.map((li, n) => {
    const tr = LEGS[li].card;
    const svgArt = window.PostcardArt && window.PostcardArt[tr.art] ? window.PostcardArt[tr.art]() : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" fill="#c7b6d6"/></svg>';
    const art = `<img src="${tr.photo ? esc(tr.photo) : 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgArt)}" alt="" decoding="async">`;
    const el = h('div', 'pc', `
      <button class="pc__card" type="button" aria-label="${esc(tr.caption)}. Turn the postcard over.">
        <span class="pc__front"><span class="pc__img">${art}</span><span class="pc__cap">${esc(tr.caption)}</span></span>
        <span class="pc__back"><p>${esc(tr.note || '')}</p><span class="pc__stamp">${esc(tr.stamp)}</span></span>
        <span class="pc__glare"></span>
      </button>`);
    pcWrap.appendChild(el);
    el._leg = li;
    const btn = $('.pc__card', el);
    btn.addEventListener('click', () => el.classList.toggle('is-flipped'));
    btn.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      btn.style.setProperty('--tilty', ((x - 0.5) * 16).toFixed(1) + 'deg');
      btn.style.setProperty('--tiltx', ((0.5 - y) * 14).toFixed(1) + 'deg');
      btn.style.setProperty('--gx', (x * 100).toFixed(0) + '%');
      btn.style.setProperty('--gy2', (y * 100).toFixed(0) + '%');
    });
    btn.addEventListener('pointerleave', () => { btn.style.setProperty('--tilty', '0deg'); btn.style.setProperty('--tiltx', '0deg'); });
    return el;
  });
  const PC_LAYOUT = {
    wide: { w: [150, 0.15, 250], f: [25, 50, -3], e: [-22, 62, -26], ss: 0.6,
      slots: [[11, 28, -9], [31, 25, 7], [9, 62, 8], [36, 70, -6], [21, 79, 4], [7, 45, -5], [40, 45, 9]] },
    mid: { w: [140, 0.25, 230], f: [30, 37, -3], e: [-30, 52, -24], ss: 0.54,
      slots: [[12, 20, -8], [50, 15, 6], [86, 21, -5], [13, 44, 7], [86, 46, -7], [33, 11, 4], [67, 11, -4]] },
    narrow: { w: [120, 0.44, 210], f: [50, 37, -3], e: [-45, 42, -24], ss: 0.5,
      slots: [[17, 19, -8], [83, 21, 7], [18, 44, 6], [82, 45, -6], [50, 14, 3], [32, 29, -4], [68, 30, 5]] }
  };
  function layoutPostcards() {
    const ar = innerWidth / innerHeight;
    const Lo = ar > 1.25 ? PC_LAYOUT.wide : ar > 0.8 ? PC_LAYOUT.mid : PC_LAYOUT.narrow;
    const w = clamp(innerWidth * Lo.w[1], Lo.w[0], Lo.w[2]);
    cards.forEach((el, i) => {
      const s = Lo.slots[i % Lo.slots.length];
      const st = el.style;
      st.setProperty('--pcw', w.toFixed(0));
      st.setProperty('--fx', Lo.f[0]); st.setProperty('--fy', Lo.f[1]); st.setProperty('--fr', Lo.f[2] + (i % 2 ? 3 : -2));
      st.setProperty('--ex', Lo.e[0]); st.setProperty('--ey', Lo.e[1] + (i % 3) * 6); st.setProperty('--er', Lo.e[2] + i * 4);
      st.setProperty('--sx', s[0]); st.setProperty('--sy', s[1]); st.setProperty('--sr', s[2]); st.setProperty('--ss', Lo.ss);
      st.zIndex = 10 + i;
    });
  }
  layoutPostcards();

  /* ------------------------------------------------------------------ *
   *  HUD, odometer, journey road                                        *
   * ------------------------------------------------------------------ */
  $('#mono').textContent = person.first[0] + person.middle[0] + person.last[0];
  $('#brandName').textContent = [person.first, person.middle, person.last].join(' ');
  const odoDigits = [];
  (function buildOdo() {
    const el = $('#odo');
    for (let i = 0; i < 4; i++) {
      const d = h('span', 'odo__d'), s = h('span', 'odo__s');
      for (let n = 0; n <= 9; n++) s.appendChild(h('span', '', String(n)));
      d.appendChild(s); el.appendChild(d); odoDigits.push(s);
    }
  })();
  let shownYear = null;
  const hudAge = $('#hudAge'), hudPlace = $('#hudPlace');
  function setYear(y) {
    if (y === shownYear) return;
    shownYear = y;
    String(y).split('').forEach((c, i) => { odoDigits[i].style.transform = `translateY(${-(+c)}em)`; });
    const age = y - person.born;
    hudAge.textContent = age <= 0 ? 'Born' : 'Age ' + age;
  }

  /* ------------------------------------------------------------------ *
   *  Story times (beats)                                                *
   * ------------------------------------------------------------------ */
  const LEG0 = 33.85, LEGD = 0.6;            /* flights: Europe, USA, Surathkal … */
  const NITK_LEG = LEGS.findIndex((l) => l.genie === 'nitk');
  const LEG1 = 38.25;                        /* … and after the NITK card: UK, Jaipur, Munnar */
  const legEnd = (i) => (i <= NITK_LEG ? LEG0 + (i + 1) * LEGD : LEG1 + (i - NITK_LEG) * LEGD);
  const legsEnd = legEnd(LEGS.length - 1);
  const BL = 41.35;                          /* Bangalore begins */
  const DL = BL + 17.9;                      /* the dream begins */
  const TOTAL = DL + 8.3;
  const GENIE_T = { wedding: 11.3, together: 25.8, nitk: 35.75, home: BL + 3.3, temple: BL + 11.9, pranjali: BL + 14.55 };
  const STOP_TIME = { peradi: 1.6, bombay: 7.7, wedding: 12.5, nerul: 17.0, dubai: 21.6, together: 27.0, world: 33.2, nitk: 37.0, bangalore: BL + 4.5, temple: BL + 13.1, pranjali: BL + 15.75, farm: DL + 2.9 };
  /* when each scene takes part in rendering at all (outside these it is display:none) */
  const SCENE_WIN = { village: [-1, 7.2], mumbai: [5.95, 20.35], dubai: [19.6, 32.85], bangalore: [BL - 0.2, DL + 0.5], farm: [DL - 0.5, 999] };

  const stopsEl = $('#stops');
  const stopEls = D.checkpoints.map((c, i) => {
    const pp = i / (D.checkpoints.length - 1);
    const li = h('li', 'stop' + (c.milestone ? ' is-milestone' : '') + (pp < 0.12 ? ' is-start' : pp > 0.88 ? ' is-end' : ''));
    li.style.setProperty('--p', pp.toFixed(4));
    li.innerHTML = `<button type="button" aria-label="Go to ${esc(c.year)}, ${esc(c.label)}"><span class="ripple"></span><span class="stop__dot"></span><span class="stop__label"><b>${esc(c.year)}</b>${esc(c.label)}</span></button>`;
    $('button', li).addEventListener('click', () => goTo(STOP_TIME[c.id] != null ? STOP_TIME[c.id] : 0));
    stopsEl.appendChild(li);
    li._p = i / (D.checkpoints.length - 1);
    li._passed = false;
    li._here = false;
    return li;
  });

  const vehBob = $('#vehicleBob');
  const vehicleEl = $('#vehicle');
  const journey = $('#journey');
  const VA = window.VehicleArt || {};
  const fallbackCar = () => '<svg viewBox="0 0 120 60"><rect x="14" y="26" width="92" height="22" rx="8" fill="#e9bf6e"/><g class="wheel"><circle cx="36" cy="50" r="8" fill="#222"/></g><g class="wheel"><circle cx="86" cy="50" r="8" fill="#222"/></g></svg>';
  const VEH_ART = { tractor: DR.tractorIcon };
  const vehicles = {};
  ['bicycle', 'bus', 'taxi', 'hatch', 'plane', 'suv', 'tractor'].forEach((k) => {
    const fn = VA[k] || VEH_ART[k];
    const v = h('div', 'vehicle__v', fn ? fn() : fallbackCar());
    vehBob.appendChild(v);
    vehicles[k] = { el: v, wheels: $$('.wheel', v) };
  });
  let curVeh = null;
  function swapVehicle(k, instant) {
    const prev = curVeh && vehicles[curVeh], next = vehicles[k];
    curVeh = k;
    if (!next) return;
    if (instant || REDUCED) {
      Object.values(vehicles).forEach((v) => gsap.set(v.el, { opacity: v === next ? 1 : 0, scale: 1, y: 0, rotate: 0, overwrite: true }));
      return;
    }
    Object.values(vehicles).forEach((v) => { if (v !== next && v !== prev) gsap.set(v.el, { opacity: 0, overwrite: true }); });
    if (prev && prev !== next) gsap.to(prev.el, { opacity: 0, scale: 0.3, y: 10, rotate: 10, duration: 0.3, ease: 'power2.in', overwrite: true });
    gsap.fromTo(next.el, { opacity: 0, scale: 0.3, y: 12, rotate: -14 }, { opacity: 1, scale: 1, y: 0, rotate: 0, duration: 0.65, delay: prev ? 0.12 : 0, ease: 'back.out(2.4)', overwrite: true });
  }

  /* ------------------------------------------------------------------ *
   *  Canvases                                                           *
   * ------------------------------------------------------------------ */
  const skyFx = FX.Sky($('#skyCanvas'));
  const rain = FX.Rain($('#rainCanvas'));
  const weeksLimit = Math.round((2026.75 - (person.born + 0.5)) * 52.18);
  const weeks = FX.Weeks($('#weeksCanvas'), {
    years: weeksYears, born: person.born, limit: weeksLimit,
    eras: WK.eras,
    marks: WK.marks.map((y) => ({ year: y, week: y === 2017 ? 18 : y === 1993 ? 4 : 26 }))
  });
  const genie = Genie.create($('#genie'));
  let globe = null;
  if (window.Globe && window.LAND_DOTS) {
    globe = Globe.create($('#globe'), {
      dots: window.LAND_DOTS,
      cities: D.cities,
      legs: LEGS.map((l) => ['dxb', l.to]),
      layout: (w, hh) => {
        const ar = w / hh;
        if (ar > 1.25) return { cx: w * 0.64, cy: hh * 0.55, r: Math.min(w * 0.29, hh * 0.4) };
        if (ar > 0.8) return { cx: w * 0.55, cy: hh * 0.66, r: Math.min(w * 0.4, hh * 0.32) };
        return { cx: w / 2, cy: hh * 0.75, r: Math.min(w * 0.56, hh * 0.3) };
      }
    });
  }

  /* genie cards: the family's photos (placeholders until they arrive) */
  const specs = {};
  Object.entries(D.milestones).forEach(([id, m], i) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = photoSrc(m.photo, m.tone, i + 11, 600, 760);
    specs[id] = Object.assign({}, m, { img });
  });
  const FX_THEME = {
    wedding: { cls: 'is-petals', colors: ['#fffdf4', '#f6efd9', '#ffffff', '#f2d98a'] },
    together: { cls: 'is-stars', colors: ['#fff6dc', '#f0c674', '#cfe0ff'] },
    nitk: { cls: '', colors: ['#f2c14e', '#7fb2e5', '#ffffff', '#e8536b'] },
    home: { cls: '', colors: ['#f59a23', '#f7c531', '#5a9a45', '#fbe2a0'] },
    temple: { cls: '', colors: ['#f59a23', '#e8536b', '#f7c531', '#fff1cf'] },
    pranjali: { cls: 'is-petals', colors: ['#e8536b', '#f3a6b4', '#f7c531', '#fff3e0'] }
  };
  const genieFx = $('#genieFx');
  let fxFor = null;
  function setGenieFx(id) {
    if (fxFor === id) return;
    fxFor = id;
    const th = FX_THEME[id] || FX_THEME.nitk;
    genieFx.className = 'genie-fx ' + th.cls;
    let s = '';
    for (let i = 0; i < 24; i++) {
      const r = (k) => Math.abs((Math.sin(i * 91.7 + k * 13.3) * 9973.13) % 1);
      s += `<i style="--x:${(r(1) * 100).toFixed(1)};--y:${(r(5) * 90).toFixed(1)};--s:${(8 + r(2) * 10).toFixed(1)};--d:${(6 + r(3) * 7).toFixed(1)};--dl:${(r(4) * 12).toFixed(1)};--dx:${((r(6) - 0.5) * 30).toFixed(1)};--c:${th.colors[i % th.colors.length]}"></i>`;
    }
    genieFx.innerHTML = s;
  }

  /* ------------------------------------------------------------------ *
   *  Sky palettes                                                       *
   * ------------------------------------------------------------------ */
  const SKY = {
    predawn: ['#03050e', '#0c1330', '#2a2350', '#f0a37a', 0.16],
    dawn: ['#6c8cc2', '#eeb7ad', '#ffd9ae', '#ffb27a', 0.55],
    morning: ['#7dafdd', '#cfe2ee', '#fbe4c2', '#ffd59a', 0.3],
    bombay: ['#8cbad8', '#efd9bf', '#f6c592', '#ffcf8a', 0.42],
    monsoon: ['#56637a', '#8f99a6', '#b2ada4', '#d8d2c4', 0.12],
    dusk: ['#262a5a', '#a95d7c', '#f39468', '#ff8a5c', 0.62],
    dubaiDusk: ['#1b1f4e', '#64477b', '#df8868', '#ff9a6a', 0.5],
    night: ['#02040d', '#0a1132', '#2b2452', '#c86b8a', 0.3],
    space: ['#02030b', '#071230', '#162e5c', '#5f8bd6', 0.24],
    dawn2: ['#3e5b9a', '#d79aa6', '#ffc89a', '#ffa86a', 0.5],
    golden: ['#7da6cf', '#f4d1a3', '#ffb674', '#ffad66', 0.5],
    twilight: ['#060a20', '#252858', '#7f567b', '#ff9a76', 0.34],
    covid: ['#03050f', '#0b1230', '#1d2147', '#7f6a9a', 0.18],
    paper: ['#efe5d3', '#f3ead9', '#f7efe1', '#ffffff', 0],
    farmDawn: ['#7fa6cf', '#f1c9a6', '#ffd9ae', '#ffb27a', 0.5],
    farmDay: ['#86b6dc', '#d6e8ef', '#fbe9c8', '#ffd59a', 0.32]
  };

  /* ------------------------------------------------------------------ *
   *  Initial states — everything the timeline touches starts here       *
   * ------------------------------------------------------------------ */
  gsap.set(sky, { '--s1': SKY.predawn[0], '--s2': SKY.predawn[1], '--s3': SKY.predawn[2] });
  gsap.set(skyGlow, { '--glow': SKY.predawn[3], '--glow-o': SKY.predawn[4], '--glow-x': '66%' });
  gsap.set(celestial, { '--sun-x': 64, '--sun-y': 112, '--moon-x': 80, '--moon-y': 118, '--sun-o': 1, '--sun-core': '#fff1d6', '--sun-rim': '#ffc48a', '--sun-halo': 'rgba(255,190,130,.55)' });
  gsap.set(cast, { '--shadow-x': -0.42, '--shadow-len': 1.8 });
  gsap.set(cloudsEl, { '--cloud': '#2b2c4c', '--cloud-o': 0.35 });
  gsap.set(storm, { opacity: 0 });
  gsap.set(scenes.village, { autoAlpha: 1 });
  gsap.set([scenes.mumbai, scenes.dubai, scenes.world, scenes.bangalore, scenes.farm], { autoAlpha: 0 });
  gsap.set(M.sky, { autoAlpha: 1 });
  gsap.set([V.hills, V.hills2], { yPercent: 70, opacity: 0 });
  gsap.set(V.farbank, { yPercent: 40, opacity: 0 });
  gsap.set([V.river, V.flock], { opacity: 0 });
  gsap.set(V.riverDay, { opacity: 0 });
  gsap.set([V.paddy, V.bund, V.college], { '--rise': 1 });
  gsap.set(V.palms, { scaleY: 0, scaleX: 0.4, transformOrigin: '50% 100%' });
  gsap.set(V.house, { yPercent: 60, opacity: 0 });
  gsap.set(coach, { autoAlpha: 0, '--tp': 1 });
  gsap.set(plane, { autoAlpha: 0, '--plx': -20, '--ply': 86, '--plr': -14, '--pls': 0.5 });
  gsap.set(M.nights.concat(M.lights, M.aptNight, M.aptLights, [M.seaStorm, M.seaDusk, M.groundDusk]), { opacity: 0 });
  gsap.set([M.far, M.taj, M.gate, M.deco, M.prom, M.sea, M.ground], { yPercent: 0, opacity: 1 });
  gsap.set(M.apts, { '--rise': 1 });
  gsap.set(DB.wave1.concat(DB.wave2, [DB.burj], [DB.duneB, DB.duneBN, DB.duneF, DB.duneFN], DB.palms), { '--rise': 1 });
  gsap.set(DB.nights.concat(DB.lights, [DB.duneBN, DB.duneFN]), { opacity: 0 });
  gsap.set(B.far, { opacity: 0, yPercent: 20 });
  gsap.set(B.trees.concat(B.jac), { scale: 0.2, opacity: 0, transformOrigin: '50% 100%' });
  gsap.set(B.house, { yPercent: 60, opacity: 0 });
  gsap.set([B.wall, B.gate, B.lawn, B.temple, ...B.roses], { '--rise': 1 });
  gsap.set([B.bench, B.lamp], { opacity: 0, yPercent: 30 });
  gsap.set([B.petals, B.ff], { opacity: 0 });
  gsap.set(B.lights.concat(B.templeNight), { opacity: 0 });
  gsap.set([FM.hills, FM.fields, FM.hillsSk, FM.fieldsSk, FM.flock, FM.ff], { opacity: 0 });
  gsap.set(layers(FM.pieces, '_sk'), { '--draw': 1, opacity: 1 });
  gsap.set(layers(FM.pieces, '_col'), { opacity: 0 });
  gsap.set(FM.tractor, { '--tx': 0 });
  gsap.set([FM.night].concat(FM.glows), { opacity: 0 });
  people.forEach((el) => gsap.set(el, { autoAlpha: 0, '--off': el._enter, '--bob': 0 }));
  gsap.set(tagEls, { autoAlpha: 0, y: 16, scale: 0.86, xPercent: -50 });
  gsap.set(hero, { autoAlpha: 1, y: 0 });
  gsap.set($$('.panel:not(.hero)'), { autoAlpha: 0 });
  gsap.set($$('.panel__in', story), { opacity: 1, y: 0 });
  gsap.set($$('.kicker, .place, .body', story), { opacity: 0, y: 22 });
  gsap.set($$('.kicker__rule', story), { scaleX: 0 });
  gsap.set($$('.panel:not(.hero) .title .c', story), { yPercent: 115, rotate: 7 });
  gsap.set($$('.chip', story), { opacity: 0, scale: 0.7, y: 10 });
  gsap.set(soonEl, { clipPath: 'inset(0% 100% 0% 0%)' });
  gsap.set([certB, certC], { autoAlpha: 0, y: -30, rotate: 5 });
  gsap.set(ticket, { autoAlpha: 0, y: -30, rotate: -7 });
  gsap.set(Object.values(frames), { autoAlpha: 0, y: -40, rotate: -9 });
  gsap.set(apartEl, { autoAlpha: 0, y: -20, xPercent: -50 });
  gsap.set(apA, { xPercent: 0, rotation: -3 });
  gsap.set(apB, { xPercent: 0, rotation: 3 });
  gsap.set(apLine, { clipPath: 'inset(0% 100% 0% 0%)' });
  gsap.set(apC1, { opacity: 1 });
  gsap.set(apC2, { opacity: 0 });
  gsap.set(board, { autoAlpha: 0, y: -24, xPercent: -50 });
  gsap.set(covidEl, { autoAlpha: 0, y: 24 });
  gsap.set(covBar, { scaleX: 0 });
  gsap.set(weeksPanel, { autoAlpha: 0, y: 30 });
  gsap.set(cards, { autoAlpha: 0, '--e': 0, '--p': 0, '--out': 0 });
  gsap.set(contrailPath, { opacity: 1 });
  gsap.set(journey, { yPercent: 100 });
  gsap.set($$('.stats, .quote, .replay, .finale__note', finale), { opacity: 0, y: 18 });
  gsap.set($('.signature', finale), { clipPath: 'inset(0% 100% 0% 0%)' });

  /* ------------------------------------------------------------------ *
   *  Shared state the timeline drives                                   *
   * ------------------------------------------------------------------ */
  const G = {};
  Object.keys(D.milestones).forEach((id) => { G[id] = { p: 0 }; });
  const W = { globe: 0, legs: 0, overview: 0, weeks: 0, stats: 0 };
  const portal = { k: 0 };
  const flight = { k: 0 };
  const apart = { k: 0 };
  const cov = { k: 0 };

  /* ------------------------------------------------------------------ *
   *  Timeline helpers                                                   *
   * ------------------------------------------------------------------ */
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });

  function some(sel, p, vars, t) { const els = $$(sel, p); if (els.length) tl.to(els, vars, t); }
  function panelIn(p, t) {
    tl.set(p, { autoAlpha: 1 }, t);
    some('.kicker', p, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, t);
    some('.kicker__rule', p, { scaleX: 1, duration: 0.45, ease: 'power3.inOut' }, t + 0.04);
    some('.title .c', p, { yPercent: 0, rotate: 0, duration: 0.5, ease: 'power3.out', stagger: 0.028 }, t + 0.08);
    some('.place', p, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, t + 0.24);
    some('.body', p, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, t + 0.3);
    some('.chip', p, { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'back.out(2.2)', stagger: 0.06 }, t + 0.42);
  }
  function panelOut(p, t) {
    tl.to($('.panel__in', p), { opacity: 0, y: -46, duration: 0.32, ease: 'power2.in' }, t);
    tl.set(p, { autoAlpha: 0 }, t + 0.33);
  }
  /* walking: the legs are animated from the actual position in the frame loop */
  function walkIn(el, t, dur) {
    tl.set(el, { autoAlpha: 1 }, t);
    tl.to(el, { '--off': 0, duration: dur, ease: 'power1.out' }, t);
  }
  function walkOut(el, t, dur, to) {
    tl.to(el, { '--off': to, duration: dur, ease: 'power1.in' }, t);
    tl.set(el, { autoAlpha: 0 }, t + dur);
  }
  function tagIn(el, t) { tl.to(el, { autoAlpha: 1, y: 0, scale: 1, duration: 0.28, ease: 'back.out(2)' }, t); }
  function tagOut(el, t) { tl.to(el, { autoAlpha: 0, y: -12, duration: 0.22, ease: 'power2.in' }, t); }
  function swap(a, b, t) { tl.set(a, { autoAlpha: 0 }, t); tl.set(b, { autoAlpha: 1 }, t); }
  function propIn(el, t, rot) { tl.to(el, { autoAlpha: 1, y: 0, rotate: rot == null ? -2 : rot, duration: 0.4, ease: 'back.out(1.8)' }, t); }
  function propOut(el, t) { tl.to(el, { autoAlpha: 0, y: 34, rotate: 6, duration: 0.3, ease: 'power2.in' }, t); }
  function genieAt(id, t) {
    tl.to(G[id], { p: 1, duration: 1.0 }, t);
    tl.to(G[id], { p: 0, duration: 0.8 }, t + 1.6);
  }
  function skyTo(name, t, d, ease) {
    const k = SKY[name];
    const vars = { '--s1': k[0], '--s2': k[1], '--s3': k[2], duration: d, ease: ease || 'sine.inOut' };
    const g = { '--glow': k[3], '--glow-o': k[4], duration: d, ease: ease || 'sine.inOut' };
    if (d === 0) { tl.set(sky, vars, t); tl.set(skyGlow, g, t); }
    else { tl.to(sky, vars, t); tl.to(skyGlow, g, t); }
  }
  /* sun, moon, clouds and shadows each live on their own small element */
  function route(vars) {
    const out = { celestial: {}, clouds: {}, cast: {} };
    const shared = {};
    Object.keys(vars).forEach((k) => {
      if (k.indexOf('--sun') === 0 || k.indexOf('--moon') === 0) out.celestial[k] = vars[k];
      else if (k.indexOf('--cloud') === 0) out.clouds[k] = vars[k];
      else if (k.indexOf('--shadow') === 0) out.cast[k] = vars[k];
      else shared[k] = vars[k];
    });
    return [[celestial, out.celestial], [cloudsEl, out.clouds], [cast, out.cast]]
      .filter(([, v]) => Object.keys(v).length)
      .map(([el, v]) => [el, Object.assign({}, shared, v)]);
  }
  function stageTo(vars, t) { route(vars).forEach(([el, v]) => tl.to(el, v, t)); }
  function stageSet(vars, t) { route(vars).forEach(([el, v]) => tl.set(el, v, t)); }

  /* ================================================================== *
   *  THE STORY                                                          *
   * ================================================================== */

  /* ---- I. Dawn in Peradi (0 → 7.1) ---- */
  tl.to(hero, { autoAlpha: 0, y: -70, duration: 0.6, ease: 'power2.in' }, 0.04);
  tl.to($('.hero__name', hero), { opacity: 0, duration: 0.06 }, 0.02);
  tl.to(skyFx.st, { nameOut: 1, duration: 1.15 }, 0.02);
  skyTo('dawn', 0, 1.6);
  tl.to(skyFx.st, { night: 0, duration: 1.3 }, 0.1);
  stageTo({ '--sun-x': 67, '--sun-y': 46, duration: 1.7, ease: 'power1.out' }, 0.2);
  stageTo({ '--cloud': '#fff1ea', '--cloud-o': 0.6, duration: 1.2 }, 0.2);
  tl.to(skyFx.st, { rays: 0.85, duration: 0.8 }, 0.9);
  tl.to(V.hills, { yPercent: 0, opacity: 1, duration: 0.9, ease: 'power2.out' }, 0.32);
  tl.to(V.hills2, { yPercent: 0, opacity: 1, duration: 0.9, ease: 'power2.out' }, 0.42);
  tl.to(V.farbank, { yPercent: 0, opacity: 1, duration: 0.7, ease: 'power2.out' }, 0.58);
  tl.to(V.river, { opacity: 1, duration: 0.6 }, 0.6);
  tl.to(V.paddy, { '--rise': 0, duration: 0.8, ease: 'power3.out' }, 0.68);
  tl.to(V.bund, { '--rise': 0, duration: 0.8, ease: 'power3.out' }, 0.78);
  tl.to(V.palms, { scaleY: 1, scaleX: 1, duration: 0.85, ease: 'back.out(1.5)', stagger: { each: 0.06, from: 'edges' } }, 0.92);
  tl.to(V.house, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, 1.12);
  tl.to(V.flock, { opacity: 1, duration: 0.5 }, 1.3);
  skyTo('morning', 2.2, 1.4);
  stageTo({ '--sun-x': 70, '--sun-y': 30, '--shadow-x': -0.18, '--shadow-len': 1.25, duration: 1.4 }, 2.2);
  tl.to(V.riverDay, { opacity: 1, duration: 1.4 }, 2.2);

  panelIn(panels.village, 1.4);
  walkIn(P.jpChild, 1.7, 0.9);
  propIn(frames.boyhood, 2.15, 3);
  tagIn(T_school, 2.45); tagOut(T_school, 3.25);
  propOut(frames.boyhood, 3.3);
  walkOut(P.jpChild, 3.3, 0.6, 110);
  panelOut(panels.village, 3.5);
  tl.to(V.college, { '--rise': 0, duration: 0.8, ease: 'power3.out' }, 3.35);
  walkIn(P.jpStudent, 3.5, 0.75);
  propIn(certB, 3.65, -3);
  propOut(certB, 4.65);
  swap(P.jpStudent, P.jpLeave, 4.7);

  /* the bus to Bombay, and the dive through its window (4.8 → 7.1) */
  propIn(ticket, 4.8);
  propOut(ticket, 5.85);
  tl.set(coach, { autoAlpha: 1 }, 4.95);
  tl.to(coach, { '--tp': 0, duration: 1.0, ease: 'power2.out' }, 4.95);
  tl.to(P.jpLeave, { autoAlpha: 0, duration: 0.25 }, 5.5);
  tl.set(scenes.mumbai, { autoAlpha: 1 }, 6.05);
  tl.to(portal, { k: 1, duration: 1.0, ease: 'power1.in' }, 6.1);
  tl.to(skyFx.st, { rays: 0, duration: 0.5 }, 6.4);
  tl.set(scenes.village, { autoAlpha: 0 }, 7.1);
  tl.set(coach, { autoAlpha: 0 }, 7.1);
  skyTo('bombay', 7.1, 0);
  stageSet({ '--sun-x': 76, '--sun-y': 20, '--shadow-x': -0.25, '--shadow-len': 1.35, '--cloud': '#ffffff', '--cloud-o': 0.55, '--sun-core': '#fff8e6', '--sun-rim': '#ffe0a6', '--sun-halo': 'rgba(255,214,150,.5)' }, 7.1);
  tl.set(M.sky, { autoAlpha: 0 }, 7.1);

  /* ---- II. Bombay (6.85 → 20.25) ---- */
  walkIn(P.jpYoung, 6.85, 0.75);
  panelIn(panels.mumbai, 7.35);
  propIn(frames.bombay, 7.6, 4);
  propOut(frames.bombay, 8.9);
  panelOut(panels.mumbai, 8.95);
  /* the career: SBI → P&G → Kellogg's, through a monsoon */
  swap(P.jpYoung, P.jpBank, 9.05);
  tagIn(T_sbi, 9.1); tagOut(T_sbi, 9.7);
  tl.to(rain.st, { amount: 1, duration: 0.6 }, 9.3);
  skyTo('monsoon', 9.25, 0.7);
  stageTo({ '--cloud': '#6f7889', '--cloud-o': 0.9, '--sun-o': 0.08, duration: 0.7 }, 9.25);
  tl.to(storm, { opacity: 1, duration: 0.7 }, 9.25);
  tl.to(M.seaStorm, { opacity: 1, duration: 0.7 }, 9.25);
  swap(P.jpBank, P.jpCorp, 9.8);
  tagIn(T_pg, 9.85); tagOut(T_pg, 10.35);
  tagIn(T_kel, 10.4); tagOut(T_kel, 10.95);
  tl.to(rain.st, { amount: 0, duration: 0.5 }, 10.9);
  skyTo('bombay', 10.85, 0.7);
  stageTo({ '--cloud': '#ffffff', '--cloud-o': 0.55, '--sun-o': 1, duration: 0.7 }, 10.85);
  tl.to(storm, { opacity: 0, duration: 0.7 }, 10.85);
  tl.to(M.seaStorm, { opacity: 0, duration: 0.7 }, 10.85);
  genieAt('wedding', GENIE_T.wedding);
  /* two years, two cities */
  tl.to(apartEl, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 13.75);
  tl.to(apLine, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.45, ease: 'power1.inOut' }, 13.8);
  tl.to(apart, { k: 1, duration: 0.9, ease: 'sine.inOut' }, 13.85);
  tl.to(apA, { xPercent: 62, duration: 0.4, ease: 'power3.inOut' }, 14.75);
  tl.to(apB, { xPercent: -62, duration: 0.4, ease: 'power3.inOut' }, 14.75);
  tl.to(apLine, { opacity: 0, duration: 0.25 }, 14.75);
  tl.to(apC1, { opacity: 0, duration: 0.2 }, 14.8);
  tl.to(apC2, { opacity: 1, duration: 0.25 }, 14.95);
  tl.to(apartEl, { autoAlpha: 0, y: -24, duration: 0.3, ease: 'power2.in' }, 15.45);
  walkIn(P.wife, 15.0, 0.75);
  swap(P.wife, P.wifeBaby, 15.9);
  tagIn(T_pranjali, 15.95); tagOut(T_pranjali, 16.6);
  /* 1998: first home and first car, in Nerul */
  tl.to(M.apts, { '--rise': 0, duration: 0.7, ease: 'power3.out' }, 16.55);
  tagIn(T_nerul, 16.8); tagOut(T_nerul, 17.5);

  /* ---- 2003: departures, Bombay → Dubai ---- */
  skyTo('dusk', 17.55, 1.0);
  stageTo({ '--sun-x': 82, '--sun-y': 66, '--shadow-x': -0.55, '--shadow-len': 2.3, '--cloud': '#f3b6a0', '--cloud-o': 0.5, '--sun-core': '#fff0d8', '--sun-rim': '#ff9f6e', '--sun-halo': 'rgba(255,140,90,.6)', duration: 1.0 }, 17.55);
  tl.to(M.nights.concat(M.aptNight, [M.seaDusk, M.groundDusk]), { opacity: 1, duration: 0.9 }, 17.6);
  tl.to(M.lights.concat(M.aptLights), { opacity: 1, duration: 0.5, ease: 'power1.inOut' }, 17.95);
  swap(P.wifeBaby, P.wife2, 17.65);
  walkIn(P.kid, 17.7, 0.6);
  tl.to(board, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out', onStart: runFlaps }, 18.0);
  tl.to(board, { autoAlpha: 0, y: -24, duration: 0.25, ease: 'power2.in' }, 19.15);
  walkOut(P.jpCorp, 18.3, 0.7, -110);
  walkOut(P.wife2, 18.95, 0.6, 110);
  walkOut(P.kid, 19.0, 0.6, 110);
  tl.set(plane, { autoAlpha: 1 }, 19.0);
  tl.to(flight, { k: 1, duration: 1.15, ease: 'power1.inOut' }, 19.0);
  tl.set(plane, { autoAlpha: 0 }, 20.15);
  tl.to(contrailPath, { opacity: 0, duration: 0.4 }, 20.0);
  tl.to(M.far, { yPercent: 40, opacity: 0, duration: 0.6, ease: 'power2.in' }, 19.5);
  tl.to([M.taj, M.gate, M.deco], { yPercent: 105, duration: 0.6, ease: 'power3.in', stagger: 0.06 }, 19.5);
  tl.to(M.apts, { '--rise': 1, duration: 0.6, ease: 'power3.in' }, 19.56);
  tl.to([M.prom, M.sea, M.ground], { yPercent: 100, duration: 0.55, ease: 'power2.in' }, 19.65);
  stageTo({ '--sun-y': 104, duration: 0.6, ease: 'power1.in' }, 19.55);
  tl.set(scenes.mumbai, { autoAlpha: 0 }, 20.25);

  /* ---- III. Dubai (19.9 → 32.75) ---- */
  tl.set(scenes.dubai, { autoAlpha: 1 }, 19.9);
  skyTo('dubaiDusk', 19.75, 0.8);
  tl.to([DB.duneB, DB.duneBN], { '--rise': 0, duration: 0.7, ease: 'power3.out' }, 19.95);
  tl.to([DB.duneF, DB.duneFN], { '--rise': 0, duration: 0.7, ease: 'power3.out' }, 20.05);
  tl.to(DB.palms, { '--rise': 0, duration: 0.6, ease: 'power3.out', stagger: 0.05 }, 20.15);
  tl.to(DB.wave1, { '--rise': 0, duration: 0.75, ease: 'power3.out', stagger: { each: 0.06, from: 'center' } }, 20.3);
  skyTo('night', 20.75, 1.8);
  tl.to(DB.nights, { opacity: 1, duration: 1.8 }, 20.75);
  tl.to([DB.duneBN, DB.duneFN], { opacity: 1, duration: 1.6 }, 20.85);
  stageTo({ '--cloud': '#2b2c4c', '--cloud-o': 0.25, '--shadow-x': 0, '--shadow-len': 1, duration: 1.2 }, 20.75);
  tl.to(DB.lights, { opacity: 0.75, duration: 1.0 }, 21.35);
  tl.to(skyFx.st, { night: 1, duration: 1.2 }, 21.45);
  stageTo({ '--moon-x': 80, '--moon-y': 22, duration: 1.4, ease: 'power2.out' }, 21.55);
  panelIn(panels.dubai, 21.15);
  walkIn(P.jpDubai, 21.5, 0.8);
  propIn(frames.dubai, 21.7, -4);
  propOut(frames.dubai, 22.85);
  panelOut(panels.dubai, 22.95);
  /* the trolley bag */
  walkIn(P.trolleyBag, 23.05, 0.8);
  tagIn(T_trolley, 23.3); tagOut(T_trolley, 24.35);
  walkOut(P.trolleyBag, 24.4, 0.5, 110);
  /* 2005: Certified Management Accountant */
  propIn(certC, 24.55, 3);
  propOut(certC, 25.55);
  /* 2006: together again */
  genieAt('together', GENIE_T.together);
  walkIn(P.wifeD, 27.35, 0.8);
  walkIn(P.kidD, 27.45, 0.8);
  tl.to(DB.wave2, { '--rise': 0, duration: 0.8, ease: 'power3.out', stagger: { each: 0.09, from: 'random' } }, 28.3);
  tl.to(DB.lights, { opacity: 1, duration: 0.8 }, 28.9);
  tl.to(DB.burj, { '--rise': 0, duration: 1.0, ease: 'power2.out' }, 29.6);
  tl.to(skyFx.st, { fireworks: 1, duration: 0.01 }, 30.55);
  tl.to(skyFx.st, { fireworks: 0, duration: 0.01 }, 31.7);
  walkOut(P.jpDubai, 31.65, 0.6, -110);
  walkOut(P.wifeD, 31.7, 0.6, 110);
  walkOut(P.kidD, 31.72, 0.6, 110);
  tl.to(DB.wave1.concat(DB.wave2, [DB.burj]), { '--rise': 1, duration: 0.6, ease: 'power3.in', stagger: { each: 0.025, from: 'edges' } }, 31.8);
  tl.to([DB.duneB, DB.duneBN, DB.duneF, DB.duneFN, ...DB.palms], { '--rise': 1, duration: 0.5, ease: 'power2.in' }, 32.15);
  stageTo({ '--moon-y': -20, duration: 1.0, ease: 'power1.in' }, 32.0);
  tl.set(scenes.dubai, { autoAlpha: 0 }, 32.75);

  /* ---- IV. The World (32.0 → 41.45) ---- */
  skyTo('space', 32.0, 0.8);
  tl.set(scenes.world, { autoAlpha: 1 }, 32.3);
  tl.to(W, { globe: 1, duration: 0.8, ease: 'power2.out' }, 32.4);
  panelIn(panels.world, 32.6);
  panelOut(panels.world, 33.9);
  tl.to(W, { legs: NITK_LEG + 1, duration: LEGD * (NITK_LEG + 1), ease: 'none' }, LEG0);
  genieAt('nitk', GENIE_T.nitk);
  tl.to(W, { legs: LEGS.length, duration: LEGD * (LEGS.length - NITK_LEG - 1), ease: 'none' }, LEG1);
  cards.forEach((el, i) => {
    const arrive = legEnd(el._leg);
    tl.set(el, { autoAlpha: 1 }, arrive - 0.3);
    tl.to(el, { '--e': 1, duration: 0.42, ease: 'power3.out' }, arrive - 0.3);
    if (i > 0) tl.to(cards[i - 1], { '--p': 1, duration: 0.4, ease: 'power2.inOut' }, arrive - 0.32);
  });
  tl.to(cards[cards.length - 1], { '--p': 1, duration: 0.4, ease: 'power2.inOut' }, legsEnd + 0.15);
  tl.to(W, { overview: 1, duration: 0.6, ease: 'power2.inOut' }, legsEnd);
  tl.to(cards, { autoAlpha: 0, '--out': 1, duration: 0.4, ease: 'power2.in', stagger: 0.03 }, legsEnd + 0.6);
  tl.to(W, { globe: 0, duration: 0.6, ease: 'power2.in' }, legsEnd + 0.75);
  tl.set(scenes.world, { autoAlpha: 0 }, legsEnd + 1.4);

  /* ---- V. Bangalore (BL → DL) ---- */
  tl.set(scenes.bangalore, { autoAlpha: 1 }, BL);
  skyTo('dawn2', BL - 0.1, 0.6);
  skyTo('golden', BL + 0.5, 0.8);
  tl.to(skyFx.st, { night: 0, duration: 0.9 }, BL);
  stageSet({ '--sun-x': 76, '--sun-y': 112, '--sun-core': '#fff4dc', '--sun-rim': '#ffcf96', '--sun-halo': 'rgba(255,196,140,.55)' }, BL - 0.05);
  stageTo({ '--sun-y': 34, '--shadow-x': -0.45, '--shadow-len': 2.0, '--cloud': '#fff3e6', '--cloud-o': 0.55, duration: 1.3, ease: 'power1.out' }, BL + 0.1);
  tl.to(skyFx.st, { rays: 0.7, duration: 0.6 }, BL + 0.9);
  tl.to(B.far, { opacity: 1, yPercent: 0, duration: 0.6, ease: 'power2.out' }, BL + 0.25);
  tl.to([B.wall, B.gate, B.lawn, ...B.roses], { '--rise': 0, duration: 0.6, ease: 'power3.out', stagger: 0.04 }, BL + 0.25);
  tl.to(B.trees.concat(B.jac), { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.4)', stagger: 0.08 }, BL + 0.4);
  tl.to(B.house, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, BL + 0.7);
  tl.to([B.bench, B.lamp], { opacity: 1, yPercent: 0, duration: 0.4, ease: 'power2.out' }, BL + 0.9);
  tl.to(B.petals, { opacity: 1, duration: 0.6 }, BL + 1.0);
  panelIn(panels.bangalore, BL + 1.1);
  walkIn(P.jpOld, BL + 1.45, 0.85);
  walkIn(P.wifeOld, BL + 1.55, 0.85);
  panelOut(panels.bangalore, BL + 3.1);
  genieAt('home', GENIE_T.home);
  tagIn(T_odisha, BL + 5.85); tagOut(T_odisha, BL + 6.55);
  /* 2020: a month alone, so that she wouldn't catch it */
  skyTo('covid', BL + 6.7, 0.9);
  stageTo({ '--sun-y': 104, '--shadow-x': -0.8, '--shadow-len': 2.8, '--cloud': '#3b3a5a', '--cloud-o': 0.3, duration: 0.9, ease: 'power1.in' }, BL + 6.7);
  tl.to(skyFx.st, { rays: 0, duration: 0.5 }, BL + 6.7);
  tl.to(B.petals, { opacity: 0, duration: 0.5 }, BL + 6.75);
  tl.to(B.templeNight, { opacity: 1, duration: 0.9 }, BL + 6.75);
  tl.to(B.far, { opacity: 0.32, duration: 0.8 }, BL + 6.75);
  tl.to(B.lights, { opacity: 1, duration: 0.6 }, BL + 7.0);
  tl.to(skyFx.st, { night: 1, duration: 0.9 }, BL + 7.1);
  tl.to(P.jpOld, { autoAlpha: 0, duration: 0.35 }, BL + 7.2);
  tl.to(covidEl, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, BL + 7.3);
  tl.to(cov, { k: 1, duration: 1.8, ease: 'none' }, BL + 7.5);
  tl.to(covBar, { scaleX: 1, duration: 1.8, ease: 'none' }, BL + 7.5);
  tl.to(covidEl, { autoAlpha: 0, y: -24, duration: 0.3, ease: 'power2.in' }, BL + 9.55);
  skyTo('dawn2', BL + 9.6, 0.5);
  skyTo('golden', BL + 10.1, 0.6);
  tl.to(skyFx.st, { night: 0, duration: 0.6 }, BL + 9.6);
  stageTo({ '--sun-y': 34, '--shadow-x': -0.45, '--shadow-len': 2.0, '--cloud': '#fff3e6', '--cloud-o': 0.55, duration: 0.9, ease: 'power1.out' }, BL + 9.6);
  tl.to(B.lights.concat(B.templeNight), { opacity: 0, duration: 0.5 }, BL + 9.9);
  tl.to(B.far, { opacity: 1, duration: 0.5 }, BL + 9.9);
  tl.to(B.petals, { opacity: 1, duration: 0.5 }, BL + 10.0);
  tl.to(P.jpOld, { autoAlpha: 1, duration: 0.35 }, BL + 9.95);
  tagIn(T_dharam, BL + 10.4); tagOut(T_dharam, BL + 11.05);
  /* 2023: the temple, and his election as treasurer */
  tl.to(B.temple, { '--rise': 0, duration: 0.8, ease: 'power3.out' }, BL + 10.9);
  genieAt('temple', GENIE_T.temple);
  /* 2025: Pranjali & Mridul */
  genieAt('pranjali', GENIE_T.pranjali);
  walkIn(P.pranjali, BL + 16.3, 0.8);
  walkIn(P.mridul, BL + 16.4, 0.8);
  walkOut(P.jpOld, BL + 17.45, 0.6, -110);
  walkOut(P.wifeOld, BL + 17.5, 0.6, 110);
  walkOut(P.pranjali, BL + 17.52, 0.6, 110);
  walkOut(P.mridul, BL + 17.55, 0.6, 110);
  tl.to(scenes.bangalore, { autoAlpha: 0, duration: 0.55, ease: 'power1.in' }, BL + 17.75);

  /* ---- VI. The dream (DL → TOTAL) ---- */
  skyTo('paper', DL - 0.3, 0.8);
  stageTo({ '--sun-y': 112, '--cloud-o': 0, '--shadow-x': -0.3, '--shadow-len': 1.4, duration: 0.6 }, DL - 0.3);
  tl.to(skyFx.st, { rays: 0, duration: 0.4 }, DL - 0.3);
  tl.set(scenes.farm, { autoAlpha: 1 }, DL - 0.25);
  tl.to(FM.hillsSk, { opacity: 1, duration: 0.4 }, DL);
  tl.to(FM.fieldsSk, { opacity: 1, duration: 0.5 }, DL + 0.05);
  [[FM.house, 0.15, 0.9], [FM.mango, 0.3, 0.9], [FM.well, 0.45, 0.6], [FM.scare, 0.55, 0.6], [FM.cows[0], 0.65, 0.6], [FM.cows[1], 0.75, 0.6], [FM.crops, 0.8, 0.8], [FM.tractor, 0.9, 0.7]]
    .forEach(([el, t, d]) => tl.to(el._sk, { '--draw': 0, duration: d, ease: 'power1.inOut' }, DL + t));
  panelIn(panels.dream, DL + 0.7);
  /* the dream turns real: colour floods in */
  skyTo('farmDawn', DL + 1.6, 0.7);
  skyTo('farmDay', DL + 2.3, 0.8);
  stageSet({ '--sun-x': 70, '--sun-core': '#fff4dc', '--sun-rim': '#ffcf96', '--sun-halo': 'rgba(255,196,140,.55)' }, DL + 1.5);
  stageTo({ '--sun-y': 30, '--cloud': '#fff3e6', '--cloud-o': 0.5, '--shadow-x': -0.3, '--shadow-len': 1.5, duration: 1.2, ease: 'power1.out' }, DL + 1.7);
  tl.to(skyFx.st, { rays: 0.7, duration: 0.6 }, DL + 2.4);
  tl.to(FM.hills, { opacity: 1, duration: 0.6 }, DL + 1.55);
  tl.to(FM.fields, { opacity: 1, duration: 0.6 }, DL + 1.6);
  tl.to(layers(FM.pieces, '_col'), { opacity: 1, duration: 0.5, stagger: 0.08 }, DL + 1.7);
  tl.to(layers(FM.pieces, '_sk').concat([FM.hillsSk, FM.fieldsSk]), { opacity: 0, duration: 0.5 }, DL + 2.25);
  tl.to(FM.flock, { opacity: 1, duration: 0.5 }, DL + 2.3);
  walkIn(P.jpFarm, DL + 2.2, 0.85);
  tl.to(FM.tractor, { '--tx': 15, duration: 1.2, ease: 'power1.inOut' }, DL + 2.45);
  tl.to(soonEl, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5, ease: 'power1.inOut' }, DL + 2.75);
  panelOut(panels.dream, DL + 3.55);
  /* dusk on the farm, then the life in weeks and the finale */
  skyTo('twilight', DL + 3.7, 1.2);
  stageTo({ '--sun-y': 104, '--shadow-x': -0.8, '--shadow-len': 2.8, '--cloud': '#4b4466', '--cloud-o': 0.35, duration: 1.2, ease: 'power1.in' }, DL + 3.7);
  tl.to(skyFx.st, { rays: 0, duration: 0.6 }, DL + 3.8);
  tl.to(skyFx.st, { night: 1, duration: 1.0 }, DL + 4.3);
  tl.to(FM.ff, { opacity: 1, duration: 0.8 }, DL + 4.4);
  tl.to(FM.night, { opacity: 1, duration: 1.2, ease: 'sine.inOut' }, DL + 3.75);
  tl.to(FM.glows, { opacity: 1, duration: 0.6, stagger: 0.12 }, DL + 4.15);
  tl.to(FM.flock, { opacity: 0, duration: 0.4 }, DL + 4.0);
  tl.to(weeksPanel, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, DL + 4.5);
  tl.to(W, { weeks: 1, duration: 1.4, ease: 'power1.inOut' }, DL + 4.75);
  tl.to(weeksPanel, { autoAlpha: 0, y: -30, duration: 0.35, ease: 'power2.in' }, DL + 6.45);
  tl.to(skyFx.st, { nameIn: 1, duration: 1.0, ease: 'none' }, DL + 6.5);
  panelIn(finale, DL + 6.8);
  propIn(frames.portrait, DL + 6.95, 3);
  tl.to($$('.stats, .quote, .replay, .finale__note', finale), { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', stagger: 0.08 }, DL + 7.05);
  tl.to(W, { stats: 1, duration: 0.6, ease: 'power2.out' }, DL + 7.1);
  tl.to($('.signature', finale), { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5, ease: 'power1.inOut' }, DL + 7.45);
  tl.to(skyFx.st, { nameGone: 1, duration: 0.4 }, DL + 7.6);
  tl.set({}, {}, TOTAL);

  /* ------------------------------------------------------------------ *
   *  Portal through the bus window (pure function of portal.k)          *
   * ------------------------------------------------------------------ */
  let portalRect = null;
  const villageCam = cam('village'), mumbaiCam = cam('mumbai');
  function measurePortal() {
    if (!portalWin) return null;
    const prev = coachZoom.style.transform;
    coachZoom.style.transform = 'none';
    const prevTp = coach.style.getPropertyValue('--tp');
    coach.style.setProperty('--tp', '0');
    const r = portalWin.getBoundingClientRect();
    coach.style.setProperty('--tp', prevTp);
    coachZoom.style.transform = prev;
    if (!r.width) return null;
    portalRect = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: Math.max(4, r.width), h: Math.max(4, r.height) };
    const prevCam = mumbaiCam.style.transform;
    mumbaiCam.style.transform = 'none';
    const g = M.gate.getBoundingClientRect();
    mumbaiCam.style.transform = prevCam;
    portalRect.px = g.width ? portalRect.cx - (g.left + g.width / 2) : 0;
    portalRect.py = g.width ? portalRect.cy - (g.top + g.height * 0.42) : 0;
    return portalRect;
  }
  function applyPortal(k) {
    const sc = scenes.mumbai;
    if (k <= 0.0001 || k >= 0.9999) {
      sc.style.clipPath = k >= 0.9999 ? 'none' : '';
      coachZoom.style.transform = '';
      coachZoom.style.opacity = '';
      if (portalWin) portalWin.style.opacity = '';
      if (portalBars) portalBars.style.opacity = '';
      villageCam.style.transform = '';
      mumbaiCam.style.transform = '';
      return;
    }
    const r = portalRect || measurePortal();
    if (!r) return;
    const vw = innerWidth, vh = stage.clientHeight;
    const need = Math.max(Math.max(r.cx, vw - r.cx) / (r.w / 2), Math.max(r.cy, vh - r.cy) / (r.h / 2)) * 1.06;
    const s = Math.pow(need, k);
    const w = r.w * s, hh = r.h * s;
    const top = r.cy - hh / 2, left = r.cx - w / 2;
    sc.style.clipPath = `inset(${top.toFixed(1)}px ${(vw - left - w).toFixed(1)}px ${(vh - top - hh).toFixed(1)}px ${left.toFixed(1)}px round ${(Math.min(w, hh) * 0.1).toFixed(1)}px)`;
    coachZoom.style.transform = `scale(${Math.min(s, 7).toFixed(4)})`;
    coachZoom.style.opacity = (1 - smooth(0.3, 0.52, k)).toFixed(3);
    if (portalWin) portalWin.style.opacity = (1 - smooth(0, 0.05, k)).toFixed(3);
    if (portalBars) portalBars.style.opacity = (1 - smooth(0.08, 0.3, k)).toFixed(3);
    const o = `${r.cx.toFixed(0)}px ${r.cy.toFixed(0)}px`;
    villageCam.style.transformOrigin = o;
    villageCam.style.transform = `scale(${Math.pow(s, 0.28).toFixed(4)})`;
    const pan = 1 - smooth(0.15, 1, k);
    mumbaiCam.style.transformOrigin = o;
    mumbaiCam.style.transform = `translate(${(r.px * pan).toFixed(1)}px, ${(r.py * pan).toFixed(1)}px) scale(${lerp(1.22, 1, smooth(0, 1, k)).toFixed(4)})`;
  }

  /* ------------------------------------------------------------------ *
   *  The flight (pure function of flight.k)                             *
   * ------------------------------------------------------------------ */
  function applyFlight(k) {
    const [x, y] = flightPos(k);
    plane.style.setProperty('--plx', x.toFixed(2));
    plane.style.setProperty('--ply', y.toFixed(2));
    plane.style.setProperty('--plr', lerp(-20, -10, k).toFixed(2));
    plane.style.setProperty('--pls', lerp(0.55, 1.15, Math.sin(k * Math.PI * 0.5)).toFixed(3));
    contrailPath.style.strokeDashoffset = (1 - clamp(k * 1.02, 0, 1)).toFixed(4);
    contrail.style.opacity = k > 0.001 ? '1' : '0';
  }

  /* ------------------------------------------------------------------ *
   *  Two cities: a jasmine flower shuttles along the line (apart.k)     *
   * ------------------------------------------------------------------ */
  let apRect = null;
  function applyApart(k) {
    if (!apRect) { const r = apRow.getBoundingClientRect(); if (!r.width) return; apRect = { w: apRow.offsetWidth, h: apRow.offsetHeight }; }
    /* two round trips in two years: Bombay → Hadagali → Bombay → Hadagali → Bombay */
    const u = 0.5 - 0.5 * Math.cos(k * Math.PI * 4);
    const x0 = apRect.w * 0.31, x1 = apRect.w * 0.69;
    const x = lerp(x0, x1, u);
    const y = apRect.h * 0.5 - Math.sin(Math.PI * u) * apRect.h * 0.2;
    apTok.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${(u * 360).toFixed(0)}deg) scale(${(0.8 + 0.4 * Math.sin(Math.PI * u)).toFixed(3)})`;
    apTok.style.opacity = k > 0.001 && k < 0.999 ? '1' : '0';
  }

  /* ------------------------------------------------------------------ *
   *  Scroll                                                             *
   * ------------------------------------------------------------------ */
  const space = $('#space');
  space.style.height = `calc(${(TOTAL * BEAT_VH).toFixed(1)}vh + 100vh)`;
  const st = ScrollTrigger.create({ trigger: space, start: 'top top', end: 'bottom bottom', animation: tl, scrub: REDUCED ? true : 0.7 });

  let lenis = null;
  if (!REDUCED && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, touchMultiplier: 1.3, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  function goTo(time) {
    const pos = st.start + (st.end - st.start) * clamp(time / TOTAL, 0, 1);
    const dist = Math.abs(pos - window.scrollY);
    if (lenis) lenis.scrollTo(pos, { duration: clamp(dist / 2800, 1.2, 4.2), easing: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2) });
    else window.scrollTo({ top: pos, behavior: REDUCED ? 'auto' : 'smooth' });
  }
  $('#brand').addEventListener('click', (e) => { e.preventDefault(); goTo(0); });
  $('#replay').addEventListener('click', () => goTo(0));

  /* story mode */
  const playBtn = $('#playBtn');
  let playing = false, holdUntil = 0, lastNow = 0;
  const held = new Set();
  /* while the story plays by itself, keep the phone's screen on (tolerate refusal) */
  let wakeLock = null;
  function keepAwake(on) {
    try {
      if (on && !wakeLock && navigator.wakeLock && document.visibilityState === 'visible') {
        navigator.wakeLock.request('screen').then((l) => {
          if (!playing) { l.release().catch(() => null); return; }
          wakeLock = l;
          l.addEventListener('release', () => { if (wakeLock === l) wakeLock = null; });
        }).catch(() => null);
      } else if (!on && wakeLock) {
        const l = wakeLock;
        wakeLock = null;
        l.release().catch(() => null);
      }
    } catch (err) { wakeLock = null; }
  }
  document.addEventListener('visibilitychange', () => { if (playing && document.visibilityState === 'visible') keepAwake(true); });
  function setPlaying(on) {
    playing = on;
    playBtn.setAttribute('aria-pressed', String(on));
    $('.lbl', playBtn).textContent = on ? 'Pause' : 'Play';
    playBtn.setAttribute('aria-label', on ? 'Pause the story' : 'Play the story automatically');
    keepAwake(on);
    if (on) {
      held.clear();
      if (window.scrollY >= st.end - 4) { window.scrollTo(0, 0); if (lenis) lenis.scrollTo(0, { immediate: true }); }
    }
  }
  playBtn.addEventListener('click', () => setPlaying(!playing));
  /* Play stops when the reader takes over: a mouse wheel, a key, or a real swipe.
     A tap (for example to keep a phone awake) no longer stops it. */
  window.addEventListener('wheel', () => { if (playing) setPlaying(false); }, { passive: true });
  let touchY0 = null;
  window.addEventListener('touchstart', (e) => { touchY0 = e.touches && e.touches[0] ? e.touches[0].clientY : null; }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (!playing || touchY0 == null || !e.touches || !e.touches[0]) return;
    if (Math.abs(e.touches[0].clientY - touchY0) > 14) setPlaying(false);
  }, { passive: true });
  window.addEventListener('keydown', (e) => { if (playing && e.target !== playBtn) setPlaying(false); });

  /* tap the night sky for a shooting star */
  window.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, a, .pc')) return;
    if (skyFx.st.night > 0.6 && e.clientY < innerHeight * 0.55) skyFx.shoot(e.clientX, e.clientY);
  });

  /* ------------------------------------------------------------------ *
   *  Schedules read every frame                                         *
   * ------------------------------------------------------------------ */
  const CAR = [[0, 0], [4.95, 0], [7.1, 1], [9.0, 1], [11.3, 2], [13.7, 2], [16.5, 3], [19.0, 3], [20.2, 4], [25.6, 4], [25.8, 5], [28.2, 5], [32.2, 6], [34.5, 6], [35.75, 7], [38.2, 7],
    [BL, 8], [BL + 5.7, 8], [BL + 11.9, 9], [BL + 14.3, 9], [BL + 14.55, 10], [BL + 16.95, 10], [DL, 11], [TOTAL, 11]];
  const VEH = [[0, 'bicycle'], [4.95, 'bus'], [7.1, 'taxi'], [16.8, 'hatch'], [19.0, 'plane'], [20.2, 'suv'], [32.2, 'plane'], [BL, 'suv'], [DL, 'tractor']];
  const PLACES = [[0, D.places.village], [6.6, D.places.mumbai], [19.9, D.places.dubai], [32.3, D.places.world], [BL, D.places.bangalore], [DL - 0.25, D.places.dream]];
  const THEMES = [[0, 'night'], [0.85, 'day'], [17.9, 'night'], [BL + 0.6, 'day'], [BL + 6.9, 'night'], [BL + 9.8, 'day'], [DL + 3.9, 'night']];
  const YEARS = [[0, 1960], [1.4, 1960], [2.4, 1973], [3.4, 1976], [4.7, 1981], [7.1, 1981], [11.3, 1993], [13.7, 1993], [15.0, 1995], [16.5, 1998], [17.6, 1998], [18.0, 2003], [21.2, 2003], [24.5, 2005], [25.8, 2006], [28.2, 2006], [29.5, 2009], [30.6, 2010], [LEG0 - 0.2, 2010]];
  LEGS.forEach((l, i) => YEARS.push([legEnd(i) - 0.05, l.year]));
  YEARS.push([legsEnd + 0.6, 2016], [BL + 0.4, 2017], [BL + 5.8, 2017], [BL + 6.0, 2019], [BL + 6.8, 2020], [BL + 10.3, 2020], [BL + 10.45, 2022], [BL + 11.0, 2023], [BL + 14.45, 2023], [BL + 14.6, 2025], [BL + 17.6, 2025], [DL, 2026], [TOTAL, 2026]);
  YEARS.sort((a, b) => a[0] - b[0]);

  function sched(list, t) { let v = list[0][1]; for (let i = 0; i < list.length; i++) { if (t >= list[i][0]) v = list[i][1]; else break; } return v; }
  function interp(list, t, ease) {
    if (t <= list[0][0]) return list[0][1];
    for (let i = 1; i < list.length; i++) {
      if (t <= list[i][0]) {
        const a = list[i - 1], b = list[i];
        const k = (t - a[0]) / Math.max(1e-6, b[0] - a[0]);
        return lerp(a[1], b[1], ease ? smooth(0, 1, k) : k);
      }
    }
    return list[list.length - 1][1];
  }

  /* ------------------------------------------------------------------ *
   *  Measurements                                                       *
   * ------------------------------------------------------------------ */
  const trackEl = $('#track');
  let trackW = 1000, trackLeft = 0, trackBottom = 0, vehW = 64, vehH = 32, fwRect = null;
  function measure() {
    const r = trackEl.getBoundingClientRect();
    trackW = r.width; trackLeft = r.left; trackBottom = r.bottom;
    journey.style.setProperty('--track-w', trackW.toFixed(1));
    const vr = vehicleEl.getBoundingClientRect();
    vehW = vr.width || 64; vehH = vr.height || 32;
    rain.st.ground = clamp((innerHeight - r.height) / innerHeight, 0.6, 0.98);
    Object.values(specs).forEach((s) => { s.bottomSafe = r.height + 6; });
    portalRect = null;
    fwRect = null;
    apRect = null;
  }

  /* genie cards are painted while the browser is idle, never mid-scroll.
     The cache holds three, so only the cards nearest the reader are kept. */
  let fontsReady = false, cardsReady = false;
  const idle = window.requestIdleCallback ? (fn) => window.requestIdleCallback(fn, { timeout: 2000 }) : (fn) => setTimeout(fn, 200);
  let idleBusy = false;
  function paintCardsWhenIdle() {
    if (!fontsReady || !cardsReady || idleBusy) return;
    const t = tl.time();
    const near = Object.keys(GENIE_T).sort((a, b) => Math.abs(GENIE_T[a] - t) - Math.abs(GENIE_T[b] - t)).slice(0, 2);
    const id = near.find((k) => !genie.has(k));
    if (!id) return;
    idleBusy = true;
    idle(() => { idleBusy = false; if (!genie.has(id)) genie.prepare(id, specs[id]); paintCardsWhenIdle(); });
  }
  setInterval(paintCardsWhenIdle, 900);

  /* ------------------------------------------------------------------ *
   *  Frame loop                                                         *
   * ------------------------------------------------------------------ */
  let lastScroll = 0, vel = 0, wind = 0, lastWind = 0, lastCar = -1, lastCarSet = -1, lastLights = -1, lastSunX = '', lastSunY = '';
  let wheelAngle = 0, lastWheel = null, face = 1, movingUntil = 0, wasMoving = false, lastPortal = -1, lastFlight = -1, lastFxOn = false;
  let lastApart = -1, lastDays = -1, lastTx = 0, tractorAngle = 0;
  const windEls = V.palms.concat(DB.palms);
  const glitters = $$('.glitter', stage);
  const sceneOn = {};
  let curPlace = '', curTheme = '', genieShown = null;
  const live = $('#live');

  function frame() {
    const now = performance.now();
    const dt = Math.min(0.05, lastNow ? (now - lastNow) / 1000 : 0.016);
    lastNow = now;
    const t = tl.time();

    /* scenes outside their chapter leave the render tree */
    for (const k in SCENE_WIN) {
      const on = t >= SCENE_WIN[k][0] && t <= SCENE_WIN[k][1];
      if (on !== sceneOn[k]) { sceneOn[k] = on; scenes[k].classList.toggle('is-off', !on); }
    }

    /* state-driven effects */
    if (portal.k !== lastPortal) { lastPortal = portal.k; applyPortal(portal.k); }
    if (flight.k !== lastFlight) { lastFlight = flight.k; applyFlight(flight.k); }
    if (apart.k !== lastApart) { lastApart = apart.k; applyApart(apart.k); }
    const days = Math.round(1 + (D.covid.to - 1) * cov.k);
    if (days !== lastDays) { lastDays = days; covNum.textContent = days; covMark.classList.toggle('is-past', days >= D.covid.from); }
    const tx = parseFloat(FM.tractor.style.getPropertyValue('--tx')) || 0;
    if (tx !== lastTx) {
      tractorAngle += (tx - lastTx) * innerWidth / 100 / 9 * 57.3;
      lastTx = tx;
      for (let i = 0; i < FM.wheels.length; i++) FM.wheels[i].style.transform = `rotate(${tractorAngle.toFixed(1)}deg)`;
    }

    /* scroll velocity → wind in the palms */
    const sy = window.scrollY;
    vel = lerp(vel, sy - lastScroll, 0.25);
    lastScroll = sy;
    wind = lerp(wind, clamp(vel * 0.07, -4, 4), 0.06);
    if (Math.abs(wind - lastWind) > 0.02) {
      lastWind = wind;
      const wv = wind.toFixed(2);
      for (let i = 0; i < windEls.length; i++) windEls[i].style.setProperty('--wind', wv);
    }
    const sx = celestial.style.getPropertyValue('--sun-x'), syy = celestial.style.getPropertyValue('--sun-y');
    if (sx !== lastSunX) { lastSunX = sx; for (let i = 0; i < glitters.length; i++) glitters[i].style.setProperty('--sun-x', sx); skyFx.st.sunX = parseFloat(sx) || 0; }
    if (syy !== lastSunY) { lastSunY = syy; skyFx.st.sunY = parseFloat(syy) || 0; }

    /* walking legs follow each person's real movement, in either direction */
    for (let i = 0; i < people.length; i++) {
      const el = people[i];
      if (!el._legs.length || el.style.visibility === 'hidden') { el._lastOff = parseFloat(el.style.getPropertyValue('--off')) || 0; continue; }
      const off = parseFloat(el.style.getPropertyValue('--off')) || 0;
      const d = off - el._lastOff;
      el._lastOff = off;
      if (Math.abs(d) > 0.003) { el._phase += Math.abs(d) * 0.62; el._amt = Math.min(1, el._amt + 0.3); }
      else el._amt = Math.max(0, el._amt - 0.1);
      if (el._amt > 0.001) { pose(el, el._phase, el._amt); el._posed = true; }
      else if (el._posed) { pose(el, 0, 0); el._posed = false; }
    }

    /* the road */
    const car = interp(CAR, t, true) / (D.checkpoints.length - 1);
    if (lastCar < 0) lastCar = car;
    const dx = (car - lastCar) * trackW;
    lastCar = car;
    if (Math.abs(car - lastCarSet) > 0.00002) { lastCarSet = car; journey.style.setProperty('--car', car.toFixed(5)); }
    if (Math.abs(dx) > 0.02) {
      wheelAngle += dx / (vehW * 0.12) * 57.3;
      const nf = dx > 0 ? 1 : -1;
      if (nf !== face) { face = nf; vehicleEl.style.setProperty('--face', face); }
    }
    if (Math.abs(dx) > 0.05) movingUntil = now + 180;
    const moving = now < movingUntil;
    if (moving !== wasMoving) { wasMoving = moving; vehicleEl.classList.toggle('is-moving', moving); }
    const v = sched(VEH, t);
    if (v !== curVeh) { swapVehicle(v, curVeh === null); lastWheel = null; }
    if (wheelAngle !== lastWheel) {
      lastWheel = wheelAngle;
      const wv = vehicles[curVeh];
      if (wv) for (let i = 0; i < wv.wheels.length; i++) wv.wheels[i].style.transform = `rotate(${wheelAngle.toFixed(1)}deg)`;
    }
    const lights = skyFx.st.night > 0.5 ? 1 : 0;
    if (lights !== lastLights) { lastLights = lights; vehicleEl.style.setProperty('--lights', lights); }
    for (let i = 0; i < stopEls.length; i++) {
      const s = stopEls[i];
      const passed = car >= s._p - 0.002;
      if (passed !== s._passed) {
        s._passed = passed;
        s.classList.toggle('is-passed', passed);
        if (passed && !REDUCED) gsap.fromTo($('.ripple', s), { scale: 1, opacity: 0.9 }, { scale: 4.2, opacity: 0, duration: 1.1, ease: 'power2.out', overwrite: true });
      }
      const here = Math.abs(car - s._p) < 0.004;
      if (here !== s._here) { s._here = here; s.classList.toggle('is-here', here); }
    }

    /* HUD */
    setYear(Math.floor(interp(YEARS, t) + 0.0001));
    const place = sched(PLACES, t);
    if (place !== curPlace) { curPlace = place; hudPlace.textContent = place; live.textContent = place; }

    /* genie */
    let gid = null, gp = 0;
    for (const id in G) { if (G[id].p > gp) { gp = G[id].p; gid = id; } }
    const theme = gp > 0.5 ? 'night' : sched(THEMES, t);
    if (theme !== curTheme) { curTheme = theme; story.dataset.ui = theme; hud.dataset.ui = theme; tagsEl.dataset.ui = theme; }
    if (cardsReady) {
      for (const id in GENIE_T) {
        if (t > GENIE_T[id] - 1.3 && t < GENIE_T[id] + 2.8 && !genie.has(id)) genie.prepare(id, specs[id]);
      }
    }
    if (gid && cardsReady) {
      if (genieShown !== gid) { genieShown = gid; setGenieFx(gid); }
      const icon = { x: trackLeft + car * trackW, y: trackBottom - 20 - vehH * 0.85, w: vehW * 0.6, h: vehH * 0.6 };
      genie.render(gid, specs[gid], gp, icon, REDUCED);
      genieFx.style.opacity = smooth(0.88, 1, gp).toFixed(3);
    } else if (genieShown) {
      genie.hide();
      genieShown = null;
      genieFx.style.opacity = '0';
    }
    const fxOn = gp > 0.85;
    if (fxOn !== lastFxOn) { lastFxOn = fxOn; genieFx.classList.toggle('on', fxOn); }

    /* fireworks rise from the top of the Burj */
    if (skyFx.st.fireworks > 0.01) {
      if (!fwRect) { const r = DB.burj.getBoundingClientRect(); fwRect = { x: (r.left + r.width / 2) / innerWidth, y: clamp((r.top + r.height * 0.08) / innerHeight, 0.1, 0.9) }; }
      skyFx.st.fwX = fwRect.x;
      skyFx.st.groundY = fwRect.y;
    }

    stepFlaps(now);
    skyFx.frame(now);
    rain.frame(now);
    if (globe && W.globe > 0.001) {
      globe.set({ progress: W.legs, reveal: W.globe, overview: W.overview });
      globe.render(now);
    } else if (globe && W._globeWas) {
      globe.set({ reveal: 0 }); globe.render(now);
    }
    W._globeWas = W.globe > 0.001;
    if (W.weeks > 0 || (t > DL + 4.4 && t < DL + 6.9)) { weeks.st.p = W.weeks; weeks.frame(now); }
    if (W.stats > 0) statEls.forEach((el) => { const val = Math.round(+el.dataset.v * W.stats); if (el._v !== val) { el._v = val; el.textContent = val; } });

    /* story mode */
    if (playing) {
      if (gp > 0.995 && gid && !held.has(gid)) { held.add(gid); holdUntil = now + 2600; }
      if (now >= holdUntil) {
        const pxPerBeat = (st.end - st.start) / TOTAL;
        const target = window.scrollY + pxPerBeat * 0.3 * dt;
        if (target >= st.end - 2) setPlaying(false);
        if (lenis) lenis.scrollTo(target, { immediate: true }); else window.scrollTo(0, target);
      }
    }
  }
  gsap.ticker.add(frame);
  window.__story = {
    tl, st, TOTAL, goTo, get time() { return tl.time(); }, get lenis() { return lenis; },
    chapters: [['Peradi + bus', 0, 7.1], ['Bombay', 7.1, 19.9], ['Dubai', 19.9, 32.2], ['World', 32.2, BL], ['Bangalore', BL, DL], ['Dream + finale', DL, 999]]
  };

  /* ------------------------------------------------------------------ *
   *  Resize                                                             *
   * ------------------------------------------------------------------ */
  let lastW = innerWidth, lastH = innerHeight, rT = null;
  function sampleName() {
    skyFx.setName($$('.hero__name .w', hero), () => {
      const sig = $('.signature', finale);
      const r = sig.getBoundingClientRect();
      const cs = getComputedStyle(sig);
      return [{ text: sig.textContent, font: `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, x: r.left, y: r.top + r.height * 0.82 }];
    });
  }
  function onResize(force) {
    const wChanged = Math.abs(innerWidth - lastW) > 2, hChanged = Math.abs(innerHeight - lastH) > 120;
    if (!force && !wChanged && !hChanged) return;
    lastW = innerWidth; lastH = innerHeight;
    measure();
    skyFx.resize(); rain.resize(); genie.resize();
    if (globe) globe.resize();
    layoutPostcards();
    layoutContrail();
    lastPortal = -1; lastFlight = -1; lastApart = -1;
    if (fontsReady) sampleName();
    paintCardsWhenIdle();
  }
  window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => onResize(false), 180); });

  /* ------------------------------------------------------------------ *
   *  Boot                                                               *
   * ------------------------------------------------------------------ */
  measure();
  skyFx.resize(); rain.resize(); genie.resize();
  if (globe) globe.resize();
  swapVehicle('bicycle', true);

  const fontLoads = [
    '300 80px "Cormorant Garamond"', 'italic 300 80px "Cormorant Garamond"', 'italic 400 80px "Cormorant Garamond"', 'italic 500 40px "Cormorant Garamond"',
    '400 16px "Jost"', '600 12px "Jost"', '500 20px "Caveat"'
  ].map((f) => (document.fonts && document.fonts.load ? document.fonts.load(f).catch(() => null) : null));
  const imgLoads = Object.values(specs).map((s) => (s.img.decode ? s.img.decode().catch(() => null) : null));
  const timeout = new Promise((res) => setTimeout(res, 3500));

  Promise.race([Promise.all(fontLoads.concat([document.fonts ? document.fonts.ready : null])), timeout]).then(() => {
    fontsReady = true;
    document.body.classList.add('is-ready');
    ScrollTrigger.refresh();
    measure();
    const intro = gsap.timeline({ delay: 0.35 });
    intro.from($('.hero__eyebrow', hero), { opacity: 0, y: 16, duration: 1.1, ease: 'power3.out' })
      .from($$('.hero__name .c', hero), { yPercent: 115, rotate: 9, duration: 1.5, ease: 'expo.out', stagger: 0.045 }, '-=0.75')
      .from($('.hero__line', hero), { scaleX: 0, duration: 1.5, ease: 'expo.inOut' }, '-=1.15')
      .from($('.hero__intro', hero), { opacity: 0, y: 14, duration: 1.1, ease: 'power2.out' }, '-=1.0')
      .from($('.hero__cue', hero), { opacity: 0, y: 10, duration: 0.9, ease: 'power2.out' }, '-=0.6')
      .from($('.hero__sample', hero), { opacity: 0, duration: 0.9 }, '-=0.7')
      .to(hud, { opacity: 1, duration: 0.9 }, '-=0.9')
      .to(journey, { yPercent: 0, duration: 1.0, ease: 'power3.out' }, '-=0.9');
    sampleName();
    intro.eventCallback('onComplete', () => { if (window.scrollY < 4) sampleName(); });
    paintCardsWhenIdle();
  });
  Promise.race([Promise.all(imgLoads), timeout]).then(() => { cardsReady = true; paintCardsWhenIdle(); });
})();

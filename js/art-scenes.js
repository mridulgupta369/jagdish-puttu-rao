/* ==========================================================================
   SCENERY
   Hand-built SVG for every place in the story. Each function returns an
   SVG string; its viewBox units are "design units" that main.js maps to the
   screen through the CSS variable --u. Colours that change with the time of
   day are read from CSS variables (style="fill:var(--x)").
   ========================================================================== */
(function () {
  'use strict';

  let uid = 0;
  const nid = (p) => p + (++uid);
  const f = (n) => Math.round(n * 10) / 10;

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const svg = (w, h, inner, cls) =>
    `<svg${cls ? ` class="${cls}"` : ''} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">${inner}</svg>`;

  const lin = (id, stops, x2 = 0, y2 = 1) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map((s) => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] !== undefined ? ` stop-opacity="${s[2]}"` : ''}/>`).join('')}</linearGradient>`;

  /* Lit artwork: `body` is the building, `lights` is what glows at night.
     main.js stacks them as separate <svg> layers so night falls by
     crossfading layers instead of restyling thousands of shapes. */
  const pack = (w, h, body, lights) => ({ w, h, body, lights: lights || '', svg: svg(w, h, body + (lights || '')) });

  /* background tiles are used as CSS background-image data URIs */
  const tile = (w, h, inner) =>
    `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none">${inner}</svg>`)}")`;

  const S = {};

  /* -------------------------------------------------------------------------
     Shared generators
     ---------------------------------------------------------------------- */

  /* Smooth periodic ridge (hills). Seamless when repeated horizontally. */
  function ridgePath(w, h, seed, segs, lo, hi) {
    const r = rng(seed);
    const ys = Array.from({ length: segs }, () => h * (1 - (lo + (hi - lo) * r())));
    const P = (i) => [i * w / segs, ys[((i % segs) + segs) % segs]];
    let d = `M0,${h} L0,${f(P(0)[1])}`;
    for (let i = 0; i < segs; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
    }
    return d + ` L${w},${h} Z`;
  }

  /* Wind-blown dunes: gentle windward slope, crisp crest, steep lee. */
  function dunePath(w, h, seed, count, lo, hi) {
    const r = rng(seed);
    const base = h;
    let d = `M0,${base}`;
    const step = w / count;
    for (let i = 0; i < count; i++) {
      const x0 = i * step, x1 = x0 + step;
      const ht = h * (lo + (hi - lo) * r());
      const xc = x0 + step * (0.58 + r() * 0.12), yc = base - ht;
      d += ` C${f(x0 + step * 0.3)},${f(base - ht * 0.08)} ${f(xc - step * 0.16)},${f(yc)} ${f(xc)},${f(yc)}`;
      d += ` C${f(xc + step * 0.05)},${f(yc + ht * 0.35)} ${f(x1 - step * 0.12)},${f(base)} ${f(x1)},${f(base)}`;
    }
    return d + ' Z';
  }

  S.ridgeTile = function ({ w = 1600, h = 300, seed = 1, segs = 7, lo = 0.25, hi = 0.85, top, bottom }) {
    const id = 'g';
    return tile(w, h, `<defs>${lin(id, [[0, top], [1, bottom]])}</defs><path d="${ridgePath(w, h, seed, segs, lo, hi)}" fill="url(#${id})"/>`);
  };

  S.duneTile = function ({ w = 1600, h = 260, seed = 1, count = 4, lo = 0.35, hi = 0.9, top, bottom, rim }) {
    const id = 'g';
    const d = dunePath(w, h, seed, count, lo, hi);
    return tile(w, h, `<defs>${lin(id, [[0, top], [1, bottom]])}</defs><path d="${d}" fill="url(#${id})"/>${rim ? `<path d="${d.replace(/ Z$/, '')}" fill="none" stroke="${rim}" stroke-width="2" opacity=".55"/>` : ''}`);
  };

  /* -------------------------------------------------------------------------
     KERALA VILLAGE
     ---------------------------------------------------------------------- */

  S.palm = function ({ h = 560, lean = 0, seed = 1, frond = '#24564a', frondL = '#357459', trunk = ['#5d4a3b', '#8a7461', '#6e5a49'] } = {}) {
    const r = rng(seed);
    const sc = h / 560;
    const maxF = 185 * sc;
    const W = Math.ceil(2 * (Math.abs(lean) + maxF + 24));
    const H = Math.ceil(h + 70 * sc);
    const bx = W / 2, by = H;
    const tx = bx + lean, ty = 64 * sc + 6;
    const c1x = bx + lean * 0.08, c1y = (by + ty) / 2 + 40 * sc;
    const pt = (t) => [(1 - t) * (1 - t) * bx + 2 * (1 - t) * t * c1x + t * t * tx, (1 - t) * (1 - t) * by + 2 * (1 - t) * t * c1y + t * t * ty];
    const der = (t) => [2 * (1 - t) * (c1x - bx) + 2 * t * (tx - c1x), 2 * (1 - t) * (c1y - by) + 2 * t * (ty - c1y)];
    const id = nid('palm');
    const N = 18, Lp = [], Rp = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, [x, y] = pt(t), [dx, dy] = der(t), l = Math.hypot(dx, dy) || 1;
      const nx = -dy / l, ny = dx / l, w = (12.5 - 6 * t) * sc;
      Lp.push([x + nx * w, y + ny * w]);
      Rp.push([x - nx * w, y - ny * w]);
    }
    let rings = '';
    for (let i = 1; i < N; i++) rings += `M${f(Lp[i][0])},${f(Lp[i][1])} Q${f((Lp[i][0] + Rp[i][0]) / 2)},${f((Lp[i][1] + Rp[i][1]) / 2 + 3 * sc)} ${f(Rp[i][0])},${f(Rp[i][1])} `;
    const trunkD = `M${Lp.map((p) => f(p[0]) + ',' + f(p[1])).join(' L')} L${Rp.slice().reverse().map((p) => f(p[0]) + ',' + f(p[1])).join(' L')} Z`;

    const angles = [-176, -154, -131, -108, -86, -63, -40, -17, 8, 168, 192];
    let fronds = '';
    angles.forEach((deg, i) => {
      const a = (deg + (r() - 0.5) * 10) * Math.PI / 180;
      const L = (128 + r() * 52) * sc;
      const dir = [Math.cos(a), Math.sin(a)];
      const horiz = Math.abs(dir[0]);
      const droop = (22 + 70 * horiz) * sc;
      const p0 = [tx, ty], p2 = [tx + dir[0] * L, ty + dir[1] * L + droop];
      const p1 = [tx + dir[0] * L * 0.52, ty + dir[1] * L * 0.52 - L * 0.2 * (0.6 + 0.4 * horiz)];
      const q = (t) => [(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]];
      const qd = (t) => [2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]), 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1])];
      let leaf = '';
      for (let t = 0.1; t <= 0.98; t += 0.042) {
        const [x, y] = q(t), [dx, dy] = qd(t), l = Math.hypot(dx, dy) || 1;
        const T = [dx / l, dy / l], Nn = [-T[1], T[0]];
        const ll = 31 * sc * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.04)), 0.7);
        for (const s of [1, -1]) {
          let vx = s * Nn[0] + T[0] * 0.42, vy = s * Nn[1] + T[1] * 0.42 + 0.5;
          const vl = Math.hypot(vx, vy);
          vx /= vl; vy /= vl;
          leaf += `M${f(x)},${f(y)} L${f(x + vx * ll)},${f(y + vy * ll)} `;
        }
      }
      const col = i % 3 === 1 ? frondL : frond;
      fronds += `<path d="${leaf}" stroke="${col}" stroke-width="${f(2.7 * sc)}" stroke-linecap="round" fill="none"/>`;
      fronds += `<path d="M${f(p0[0])},${f(p0[1])} Q${f(p1[0])},${f(p1[1])} ${f(p2[0])},${f(p2[1])}" stroke="${col}" stroke-width="${f(2.6 * sc)}" fill="none"/>`;
    });
    const nuts = `<circle cx="${f(tx - 7 * sc)}" cy="${f(ty + 9 * sc)}" r="${f(7.5 * sc)}" fill="#6b4b2a"/><circle cx="${f(tx + 6 * sc)}" cy="${f(ty + 11 * sc)}" r="${f(7 * sc)}" fill="#7d5a33"/><circle cx="${f(tx)}" cy="${f(ty + 16 * sc)}" r="${f(7 * sc)}" fill="#5e4126"/>`;
    const out = svg(W, H,
      `<defs>${lin(id, [[0, trunk[0]], [0.55, trunk[1]], [1, trunk[2]]], 1, 0)}</defs>` +
      `<path d="${trunkD}" fill="url(#${id})"/><path d="${rings}" stroke="#4a3a2e" stroke-width="${f(1.4 * sc)}" fill="none" opacity=".45"/>` +
      nuts + fronds);
    return { svg: out, w: W, h: H };
  };

  S.keralaHouse = function () {
    const W = 400, H = 280;
    const id = nid('kh');
    let s = `<defs>${lin(id + 'r', [[0, '#b9583c'], [1, '#93402a']])}${lin(id + 'w', [[0, '#f3e7cd'], [1, '#e6d3b0']])}</defs>`;
    s += `<rect x="40" y="236" width="320" height="22" fill="#9c5a3c"/><rect x="28" y="256" width="344" height="12" fill="#7f4630"/>`;
    s += `<rect x="60" y="150" width="280" height="88" fill="url(#${id}w)"/>`;
    s += `<rect x="60" y="150" width="280" height="18" fill="#cdb48c" opacity=".7"/>`;
    s += `<rect x="182" y="172" width="38" height="66" fill="#5a3b28"/><path d="M201,176 V234 M186,204 H216" stroke="#7a5238" stroke-width="2"/>`;
    for (const x of [92, 272]) {
      s += `<rect x="${x}" y="180" width="40" height="32" fill="#4a3022"/>`;
      for (let i = 1; i < 6; i++) s += `<rect x="${x + i * 6.6}" y="180" width="1.8" height="32" fill="#c79a6a"/>`;
    }
    for (const x of [66, 142, 252, 326]) s += `<rect x="${x}" y="150" width="8" height="88" fill="#6b4630"/>`;
    s += `<path d="M6,166 L66,118 L334,118 L394,166 L372,170 L60,170 Z" fill="url(#${id}r)"/>`;
    let tl = '';
    for (let i = 1; i < 5; i++) { const y = 118 + i * 11; const k = (y - 118) / 48; tl += `M${f(66 - 60 * k)},${y} L${f(334 + 60 * k)},${y} `; }
    s += `<path d="${tl}" stroke="#7d3322" stroke-width="1.4" opacity=".55"/>`;
    s += `<path d="M58,126 L126,48 L274,48 L342,126 Z" fill="url(#${id}r)"/>`;
    let tl2 = '';
    for (let i = 1; i < 7; i++) { const y = 48 + i * 11; const k = (y - 48) / 78; tl2 += `M${f(126 - 68 * k)},${y} L${f(274 + 68 * k)},${y} `; }
    s += `<path d="${tl2}" stroke="#7d3322" stroke-width="1.4" opacity=".5"/>`;
    s += `<path d="M156,56 L200,14 L244,56 Z" fill="#7a3220"/><path d="M168,52 L200,22 L232,52 Z" fill="#5a3b28"/>`;
    s += `<path d="M178,50 L200,30 L222,50 M189,50 V40 M200,50 V31 M211,50 V40" stroke="#c79a6a" stroke-width="1.6" fill="none"/>`;
    s += `<path d="M126,48 H274" stroke="#6b2a1a" stroke-width="3"/><path d="M200,14 V4" stroke="#6b2a1a" stroke-width="3" stroke-linecap="round"/>`;
    s += `<rect x="364" y="238" width="26" height="20" fill="#e2d2b2"/><rect x="361" y="234" width="32" height="6" fill="#cbb792"/><path d="M377,234 q-10,-14 -4,-26 q4,10 4,26 q2,-16 10,-22 q0,14 -10,22" fill="#4f8a3c"/>`;
    return { svg: svg(W, H, s), w: W, h: H };
  };

  S.canoe = function () {
    const W = 230, H = 110;
    let s = `<g class="canoe-boat">`;
    s += `<path d="M150,4 L184,100" stroke="#33251c" stroke-width="2.4" stroke-linecap="round"/>`;
    s += `<circle cx="146" cy="24" r="6.5" fill="#33251c"/><path d="M140,32 Q146,28 152,32 L154,62 L138,62 Z" fill="#33251c"/><path d="M141,40 L156,52" stroke="#33251c" stroke-width="4" stroke-linecap="round"/>`;
    s += `<path d="M8,64 Q110,84 222,58 L214,68 Q110,92 18,73 Z" fill="#3a2a20"/>`;
    s += `<path d="M30,66 L48,52 L70,68 Z" fill="#c7a26a" opacity=".9"/>`;
    s += `</g><g opacity=".22" transform="translate(0 150) scale(1 -1)"><path d="M8,64 Q110,84 222,58 L214,68 Q110,92 18,73 Z" fill="#3a2a20"/><path d="M150,4 L184,100" stroke="#33251c" stroke-width="2.4"/></g>`;
    return { svg: svg(W, H, s), w: W, h: H };
  };

  S.paddyTile = function () {
    const W = 800, H = 140;
    const r = rng(7);
    let s = `<defs>${lin('p', [[0, '#a9d077'], [0.5, '#8fbe60'], [1, '#6a9e47']])}</defs><rect width="${W}" height="${H}" fill="url(#p)"/>`;
    const rows = [5, 11, 18, 27, 38, 51, 66, 84, 104, 126];
    let lines = '', tufts = '';
    rows.forEach((y, i) => {
      lines += `M0,${y} L${W},${y} `;
      const step = 9 + i * 2.2, hgt = 2.5 + i * 0.9;
      for (let x = r() * step; x < W; x += step) tufts += `M${f(x)},${y} l${f(-hgt * 0.4)},${f(-hgt)} M${f(x)},${y} l0,${f(-hgt * 1.15)} M${f(x)},${y} l${f(hgt * 0.4)},${f(-hgt)} `;
    });
    s += `<path d="${lines}" stroke="#5f9442" stroke-width="1.2" opacity=".35"/><path d="${tufts}" stroke="#4d8436" stroke-width="1.1" opacity=".5" stroke-linecap="round"/>`;
    s += `<path d="M0,${H * 0.42} C200,${H * 0.36} 600,${H * 0.5} ${W},${H * 0.42}" stroke="#d5e8b0" stroke-width="2" opacity=".35" fill="none"/>`;
    return tile(W, H, s);
  };

  S.bundTile = function () {
    const W = 600, H = 120;
    const r = rng(11);
    let s = `<defs>${lin('b', [[0, '#c4925f'], [1, '#9c6a43']])}</defs>`;
    s += `<path d="M0,22 C100,14 200,26 300,20 C400,14 500,26 600,22 L600,120 L0,120 Z" fill="url(#b)"/>`;
    let grass = '';
    for (let x = 0; x < W; x += 5) { const y = 20 + Math.sin(x / 47) * 3; const hh = 6 + r() * 10; grass += `M${x},${f(y + 3)} l${f((r() - 0.5) * 6)},${f(-hh)} `; }
    s += `<path d="${grass}" stroke="#5f8d43" stroke-width="2.4" stroke-linecap="round"/>`;
    s += `<path d="M0,24 C100,16 200,28 300,22 C400,16 500,28 600,24 L600,32 C500,36 400,26 300,30 C200,36 100,24 0,32Z" fill="#6f9a4c"/>`;
    let stones = '';
    for (let i = 0; i < 14; i++) stones += `<ellipse cx="${f(r() * W)}" cy="${f(50 + r() * 60)}" rx="${f(3 + r() * 5)}" ry="${f(1.5 + r() * 2)}" fill="#86593a" opacity=".6"/>`;
    return tile(W, H, s + stones);
  };

  S.farBankTile = function () {
    const W = 900, H = 90;
    const r = rng(23);
    let s = `<path d="M0,64 C150,60 300,66 450,62 C600,58 750,66 900,64 L900,90 L0,90 Z" fill="#6f9174"/>`;
    for (let i = 0; i < 26; i++) {
      const x = r() * W, h = 26 + r() * 30, lean = (r() - 0.5) * 10, ty = 64 - h;
      s += `<path d="M${f(x)},66 Q${f(x + lean * 0.3)},${f(64 - h * 0.5)} ${f(x + lean)},${f(ty)}" stroke="#58776a" stroke-width="2" fill="none"/>`;
      let fr = '';
      for (let k = 0; k < 6; k++) { const a = (-160 + k * 28) * Math.PI / 180; fr += `M${f(x + lean)},${f(ty)} q${f(Math.cos(a) * 9)},${f(Math.sin(a) * 9 - 3)} ${f(Math.cos(a) * 15)},${f(Math.sin(a) * 15 + 5)} `; }
      s += `<path d="${fr}" stroke="#4f6e60" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    }
    return tile(W, H, s);
  };

  S.shimmerTile = function (color = '#ffffff', seed = 5) {
    const W = 600, H = 120;
    const r = rng(seed);
    let s = '';
    for (let i = 0; i < 46; i++) s += `<rect x="${f(r() * W)}" y="${f(r() * H)}" width="${f(8 + r() * 46)}" height="${f(1 + r() * 1.6)}" rx="1" fill="${color}" opacity="${f(0.25 + r() * 0.5)}"/>`;
    return tile(W, H, s);
  };

  S.bird = function () {
    return `<svg viewBox="0 0 24 12" aria-hidden="true"><path class="bird-wing" d="M1,7 Q6,1 12,7 Q18,1 23,7" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`;
  };

  /* -------------------------------------------------------------------------
     BOMBAY
     ---------------------------------------------------------------------- */

  S.skylineFar = function () {
    const W = 2800, H = 300;
    const r = rng(41);
    let bld = '', win = '';
    let x = 0;
    while (x < W) {
      const w = 26 + r() * 62;
      const nx = x / W;
      const cluster = Math.exp(-Math.pow((nx - 0.3) / 0.12, 2)) * 0.9 + Math.exp(-Math.pow((nx - 0.78) / 0.1, 2)) * 0.6;
      const h = 40 + r() * 70 + cluster * (90 + r() * 120);
      bld += `<rect x="${f(x)}" y="${f(H - h)}" width="${f(w - 2)}" height="${f(h)}"/>`;
      if (r() > 0.75) bld += `<rect x="${f(x + w / 2 - 1)}" y="${f(H - h - 14 - r() * 18)}" width="2" height="34"/>`;
      if (r() > 0.6) bld += `<rect x="${f(x + 6)}" y="${f(H - h - 6)}" width="10" height="7" rx="2"/>`;
      for (let wy = H - h + 8; wy < H - 6; wy += 9) for (let wx = x + 4; wx < x + w - 6; wx += 8) if (r() > 0.72) win += `<rect x="${f(wx)}" y="${f(wy)}" width="3" height="3"/>`;
      x += w + r() * 6;
    }
    let neck = '';
    for (let i = 0; i < 140; i++) {
      const nx = i / 139, px = 120 + nx * (W - 240);
      const py = H - 4 + Math.sin(nx * Math.PI) * 3;
      neck += `<circle cx="${f(px)}" cy="${f(py)}" r="2.4"/>`;
    }
    const body = `<g style="fill:var(--m-far,#b9a5a8)">${bld}</g>`;
    const lights = `<g style="fill:#ffd88a">${win}</g><g style="fill:#ffe1a0;filter:blur(3px)">${neck}</g><g style="fill:#fff3cf">${neck}</g>`;
    return pack(W, H, body, lights);
  };

  S.seaLink = function () {
    const W = 1000, H = 260;
    let s = `<g style="fill:var(--m-link,#9b8d99);stroke:var(--m-link,#9b8d99)">`;
    s += `<path d="M0,214 Q500,200 1000,214 L1000,221 Q500,207 0,221 Z" stroke="none"/>`;
    for (let x = 30; x < 1000; x += 46) s += `<rect x="${x}" y="${f(214 - Math.sin(x / 1000 * Math.PI) * 13)}" width="5" height="40" stroke="none"/>`;
    const pylon = (px, ph) => {
      let p = `<path d="M${px - 14},212 L${px},${212 - ph * 0.62} L${px + 14},212 L${px + 9},212 L${px},${212 - ph * 0.5} L${px - 9},212 Z" stroke="none"/>`;
      p += `<rect x="${px - 3}" y="${212 - ph}" width="6" height="${f(ph * 0.42)}" stroke="none"/>`;
      let c = '';
      for (let i = 0; i < 9; i++) {
        const yTop = 212 - ph + 6 + i * (ph * 0.36 / 9);
        c += `M${px},${f(yTop)} L${f(px - 30 - i * 19)},${f(213 - Math.sin((px - 30 - i * 19) / 1000 * Math.PI) * 13)} M${px},${f(yTop)} L${f(px + 30 + i * 19)},${f(213 - Math.sin((px + 30 + i * 19) / 1000 * Math.PI) * 13)} `;
      }
      return p + `<path d="${c}" fill="none" stroke-width="1.1" opacity=".85"/>`;
    };
    s += pylon(640, 196) + pylon(270, 128);
    s += `</g>`;
    return pack(W, H, s);
  };

  S.gateway = function () {
    const W = 290, H = 310;
    const c = 'fill:var(--m-stone,#ddbd8e)', cl = 'fill:var(--m-stone-l,#ecd5ac)', cd = 'fill:var(--m-stone-d,#b99567)', op = 'fill:var(--m-open,#6f5c55)';
    let s = '';
    s += `<rect x="6" y="284" width="278" height="26" style="${cd}"/>`;
    s += `<rect x="18" y="132" width="66" height="154" style="${c}"/><rect x="206" y="132" width="66" height="154" style="${c}"/>`;
    s += `<rect x="80" y="82" width="130" height="204" style="${c}"/>`;
    s += `<rect x="80" y="82" width="130" height="204" style="${cl}" opacity=".35"/>`;
    s += `<path d="M112,286 L112,176 Q112,126 145,110 Q178,126 178,176 L178,286 Z" style="${op}"/>`;
    s += `<path d="M34,286 L34,206 Q34,182 51,174 Q68,182 68,206 L68,286 Z M222,286 L222,206 Q222,182 239,174 Q256,182 256,206 L256,286 Z" style="${op}"/>`;
    s += `<rect x="80" y="96" width="130" height="7" style="${cd}"/><rect x="18" y="146" width="66" height="6" style="${cd}"/><rect x="206" y="146" width="66" height="6" style="${cd}"/>`;
    for (let x = 92; x < 204; x += 14) s += `<rect x="${x}" y="72" width="7" height="12" style="${c}"/>`;
    for (let x = 22; x < 84; x += 12) s += `<rect x="${x}" y="124" width="6" height="9" style="${c}"/>`;
    for (let x = 210; x < 272; x += 12) s += `<rect x="${x}" y="124" width="6" height="9" style="${c}"/>`;
    const turret = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" style="${c}"/><rect x="${x}" y="${y + 8}" width="${w}" height="4" style="${cd}"/><path d="M${x - 2},${y} Q${x + w / 2},${y - w * 1.15} ${x + w + 2},${y} Z" style="${cl}"/><rect x="${x + w / 2 - 1}" y="${y - w * 0.95 - 8}" width="2" height="10" style="${cd}"/>`;
    s += turret(74, 40, 24, 46) + turret(192, 40, 24, 46) + turret(14, 104, 16, 30) + turret(260, 104, 16, 30);
    s += `<path d="M126,150 h38 M120,160 h50" style="stroke:var(--m-stone-d,#b99567)" stroke-width="2"/>`;
    return pack(W, H, s);
  };

  S.taj = function () {
    const W = 420, H = 310;
    const c = 'fill:var(--m-taj,#ecdcbd)', red = 'fill:var(--m-dome,#b4513f)', win = 'fill:var(--m-win,#8a6f5c)';
    let s = '';
    s += `<rect x="20" y="118" width="380" height="192" style="${c}"/>`;
    s += `<rect x="20" y="118" width="380" height="10" style="fill:var(--m-stone-d,#b99567)" opacity=".6"/>`;
    s += `<rect x="168" y="76" width="84" height="44" style="${c}"/>`;
    s += `<path d="M156,80 Q210,-10 264,80 Z" style="${red}"/><path d="M208,16 v-14" style="stroke:var(--m-dome,#b4513f)" stroke-width="3"/>`;
    for (const x of [30, 330]) s += `<rect x="${x}" y="86" width="60" height="34" style="${c}"/><path d="M${x - 2},88 Q${x + 30},34 ${x + 62},88 Z" style="${red}"/>`;
    for (const x of [112, 132, 288, 308]) s += `<path d="M${x - 8},120 Q${x},96 ${x + 8},120 Z" style="${red}"/>`;
    for (let y = 138; y < 300; y += 40) for (let x = 36; x < 390; x += 22) s += `<path d="M${x},${y + 22} V${y + 8} Q${x + 5},${y} ${x + 10},${y + 8} V${y + 22} Z" style="${win}"/>`;
    return pack(W, H, s);
  };

  S.artDeco = function () {
    const W = 760, H = 270;
    let s = '';
    const tank = (x, y) => `<rect x="${x}" y="${y - 14}" width="16" height="14" rx="3" fill="#2d2a2a"/><rect x="${x - 1}" y="${y - 16}" width="18" height="3" rx="1.5" fill="#403b3b"/>`;
    s += `<path d="M0,270 V100 H130 Q170,100 170,140 V270 Z" style="fill:var(--m-d1,#efe2cf)"/>`;
    for (let y = 120; y < 262; y += 22) s += `<rect x="10" y="${y}" width="${150 - (y < 140 ? 20 : 0)}" height="8" rx="4" style="fill:var(--m-dwin,#9b8a7c)"/>`;
    s += `<rect x="0" y="96" width="130" height="8" style="fill:var(--m-dacc,#d8b48c)"/>` + tank(24, 96) + tank(90, 96);
    s += `<path d="M180,270 V80 H200 V60 H230 V40 H290 V60 H320 V80 H340 V270 Z" style="fill:var(--m-d2,#ebcbc2)"/>`;
    for (let x = 192; x < 334; x += 18) s += `<rect x="${x}" y="88" width="6" height="176" style="fill:var(--m-dwin,#9b8a7c)" opacity=".55"/>`;
    s += `<rect x="248" y="22" width="2" height="20" fill="#5a5050"/>`;
    s += `<path d="M350,270 V150 Q350,120 380,120 H490 Q520,120 520,150 V270 Z" style="fill:var(--m-d3,#d3e3d4)"/>`;
    for (let y = 150; y < 262; y += 28) for (let x = 372; x < 504; x += 28) s += `<circle cx="${x}" cy="${y}" r="7" style="fill:var(--m-dwin,#9b8a7c)"/>`;
    s += tank(400, 120) + tank(460, 120);
    s += `<path d="M530,270 V110 H600 V70 H650 V110 H760 V270 Z" style="fill:var(--m-d4,#f1e1b2)"/>`;
    for (let y = 126; y < 262; y += 24) s += `<rect x="540" y="${y}" width="210" height="9" rx="2" style="fill:var(--m-dwin,#9b8a7c)" opacity=".8"/>`;
    for (let y = 80; y < 108; y += 10) s += `<rect x="610" y="${y}" width="30" height="5" style="fill:var(--m-dwin,#9b8a7c)"/>`;
    s += `<rect x="624" y="36" width="2" height="34" fill="#5a5050"/><path d="M626,38 l16,5 l-16,5z" fill="#e07a5f"/>` + tank(700, 110);
    let lt = '<g style="fill:#ffd88a">';
    for (let i = 0; i < 26; i++) { const xx = [20, 60, 100, 200, 240, 290, 380, 430, 470, 560, 600, 660, 720][i % 13]; const yy = 130 + (i * 37) % 120; lt += `<rect x="${xx}" y="${yy}" width="10" height="6"/>`; }
    lt += '</g>';
    return pack(W, H, s, lt);
  };

  S.promenade = function () {
    const W = 3000, H = 300;
    let s = `<defs>${lin('pw', [[0, '#d9d0c2'], [1, '#bdb2a2']])}</defs>`;
    s += `<rect x="0" y="196" width="${W}" height="16" style="fill:var(--m-wall,#d8d0c4)"/>`;
    s += `<rect x="0" y="208" width="${W}" height="6" style="fill:var(--m-wall-d,#b4aa9b)"/>`;
    s += `<rect x="0" y="214" width="${W}" height="86" style="fill:var(--m-walk,#c9bfb0)"/>`;
    let lines = '';
    for (let x = 0; x < W; x += 60) lines += `M${x},214 L${x - 30},300 `;
    s += `<path d="${lines}" style="stroke:var(--m-wall-d,#b4aa9b)" stroke-width="1.4" opacity=".5"/>`;
    let posts = '', glow = '';
    for (let x = 110; x < W; x += 260) {
      posts += `<rect x="${x - 2.5}" y="70" width="5" height="128" fill="#3a3838"/><rect x="${x - 6}" y="190" width="12" height="8" fill="#2e2c2c"/><path d="M${x},74 q0,-16 22,-16" stroke="#3a3838" stroke-width="4" fill="none"/><path d="M${x + 14},56 h18 l-3,7 h-12z" fill="#3a3838"/>`;
      glow += `<circle cx="${x + 23}" cy="66" r="26" fill="url(#pgl)"/><circle cx="${x + 23}" cy="63" r="4" fill="#fff4d0"/>`;
    }
    s += posts;
    const lt = `<defs><radialGradient id="pgl"><stop offset="0" stop-color="#ffe2a0" stop-opacity=".95"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>${glow}`;
    return pack(W, H, s, lt);
  };

  /* -------------------------------------------------------------------------
     DUBAI
     ---------------------------------------------------------------------- */

  S.burjKhalifa = function () {
    const W = 180, H = 920, cx = 90;
    const tiers = [
      [920, 770, 72, 70], [770, 652, 62, 57], [652, 552, 51, 54], [552, 462, 45, 41],
      [462, 384, 35, 37], [384, 316, 29, 26], [316, 258, 21, 23], [258, 208, 16, 14],
      [208, 168, 11, 12], [168, 136, 7, 7]
    ];
    let body = '', hi = '', sh = '', win = '', led = '';
    tiers.forEach(([y0, y1, l, rr]) => {
      body += `<rect x="${cx - l}" y="${y1}" width="${l + rr}" height="${y0 - y1 + 0.5}"/>`;
      const hw = Math.max(3, (l + rr) * 0.16);
      hi += `<rect x="${f(cx - hw / 2 - 4)}" y="${y1}" width="${f(hw)}" height="${y0 - y1}"/>`;
      sh += `<rect x="${f(cx + rr * 0.35)}" y="${y1}" width="${f(rr * 0.65)}" height="${y0 - y1}"/>`;
      for (let y = y1 + 6; y < y0 - 3; y += 7) for (let x = cx - l + 4; x < cx + rr - 4; x += 6) if (((x * 7 + y * 3) % 11) > 5) win += `<rect x="${x}" y="${y}" width="2.2" height="3"/>`;
      led += `<rect x="${f(cx - 2)}" y="${y1}" width="1.5" height="${y0 - y1}"/>`;
    });
    body += `<path d="M${cx - 5},140 L${cx - 1.2},4 L${cx + 1.2},4 L${cx + 5},140 Z"/>`;
    const s = `<g style="fill:var(--d-burj,#28315c)">${body}</g>` +
      `<g style="fill:var(--d-burj-hi,#3c4880)">${hi}</g>` +
      `<g style="fill:var(--d-burj-sh,#1a2146)">${sh}</g>`;
    const lt = `<g style="fill:#cfe0ff">${win}</g><g style="fill:#9fd0ff" opacity=".55">${led}</g>` +
      `<circle class="d-beacon" cx="${cx}" cy="6" r="3.2" fill="#ff4a4a"/>`;
    return pack(W, H, s, lt);
  };

  S.burjAlArab = function () {
    const W = 260, H = 480;
    const id = nid('ba');
    let s = `<defs>${lin(id, [[0, '#f4f2f8'], [1, '#c9c4d8']], 1, 0)}<radialGradient id="${id}n" cx=".55" cy=".45" r=".6"><stop offset="0" stop-color="#b98cff"/><stop offset="1" stop-color="#4a6bff" stop-opacity=".2"/></radialGradient></defs>`;
    s += `<path d="M42,470 L58,24 L66,24 L58,470 Z" style="fill:var(--d-ba-spine,#d9d4e4)"/>`;
    const sail = `M64,44 C186,96 232,262 204,436 L64,436 Z`;
    s += `<path d="${sail}" fill="url(#${id})" style="opacity:var(--d-ba-day,1)"/>`;
    const lt = `<defs><radialGradient id="${id}g" cx=".55" cy=".45" r=".6"><stop offset="0" stop-color="#b98cff"/><stop offset="1" stop-color="#4a6bff" stop-opacity=".2"/></radialGradient></defs><path d="${sail}" fill="url(#${id}g)"/>`;
    let br = '';
    for (let i = 0; i < 6; i++) { const y = 90 + i * 60; br += `M60,${y} L${f(150 + Math.sin(i / 5 * Math.PI) * 45)},${y + 30} M60,${y + 60} L${f(150 + Math.sin(i / 5 * Math.PI) * 45)},${y + 30} `; }
    s += `<path d="${br}" style="stroke:var(--d-ba-spine,#d9d4e4)" stroke-width="3" fill="none" opacity=".9"/>`;
    s += `<path d="M190,128 h52 v5 h-52z" style="fill:var(--d-ba-spine,#d9d4e4)"/><ellipse cx="216" cy="126" rx="28" ry="5" style="fill:var(--d-ba-spine,#d9d4e4)"/><path d="M196,133 L178,160" style="stroke:var(--d-ba-spine,#d9d4e4)" stroke-width="3"/>`;
    s += `<path d="M20,436 H236 L250,480 H6 Z" style="fill:var(--d-tower-f,#6e5a7a)"/>`;
    return pack(W, H, s, lt);
  };

  S.emiratesTowers = function () {
    const W = 230, H = 560;
    let s = '';
    s += `<path d="M18,560 L18,130 L104,44 L104,560 Z" style="fill:var(--d-tower-f,#3b3f6a)"/>`;
    s += `<path d="M62,560 L62,86 L104,44 L104,560 Z" style="fill:var(--d-tower-hi,#55598a)" opacity=".7"/>`;
    s += `<path d="M128,560 L128,196 L200,130 L200,560 Z" style="fill:var(--d-tower-f,#3b3f6a)"/>`;
    s += `<path d="M164,560 L164,163 L200,130 L200,560 Z" style="fill:var(--d-tower-hi,#55598a)" opacity=".7"/>`;
    let w = '';
    for (let y = 150; y < 552; y += 9) for (let x = 24; x < 100; x += 7) if (((x + y * 3) % 7) > 3 && y > 130 + (104 - x) * 0.0) w += `<rect x="${x}" y="${y}" width="3" height="4"/>`;
    for (let y = 214; y < 552; y += 9) for (let x = 134; x < 196; x += 7) if (((x * 3 + y) % 7) > 3) w += `<rect x="${x}" y="${y}" width="3" height="4"/>`;
    return pack(W, H, s, `<g style="fill:#ffd58a">${w}</g>`);
  };

  S.dubaiFrame = function () {
    const W = 190, H = 420;
    let s = '';
    s += `<rect x="12" y="44" width="38" height="366" style="fill:var(--d-frame,#c9a24a)"/><rect x="140" y="44" width="38" height="366" style="fill:var(--d-frame,#c9a24a)"/>`;
    s += `<rect x="12" y="40" width="166" height="38" style="fill:var(--d-frame,#c9a24a)"/>`;
    let p = '';
    for (let y = 56; y < 404; y += 16) p += `M18,${y} h26 M146,${y} h26 `;
    for (let x = 58; x < 136; x += 14) p += `M${x},46 v26 `;
    s += `<path d="${p}" style="stroke:var(--d-frame-d,#a07d2e)" stroke-width="3" opacity=".8"/>`;
    s += `<rect x="0" y="404" width="190" height="16" style="fill:var(--d-tower-f,#3b3f6a)"/>`;
    const lt = `<rect x="12" y="40" width="166" height="38" fill="#ffd27a" opacity=".55"/><rect x="12" y="78" width="4" height="330" fill="#ffd27a"/><rect x="174" y="78" width="4" height="330" fill="#ffd27a"/>`;
    return pack(W, H, s, lt);
  };

  S.museumFuture = function () {
    const W = 270, H = 230;
    const id = nid('mf');
    let s = `<defs>${lin(id, [[0, '#e9edf3'], [1, '#9aa3b8']], 1, 1)}</defs>`;
    s += `<path d="M20,230 Q135,176 250,230 Z" style="fill:var(--d-dune-b,#c88c5a)"/>`;
    s += `<path fill-rule="evenodd" d="M135,8 C210,8 262,62 262,118 C262,176 212,206 140,206 C64,206 10,170 10,112 C10,56 60,8 135,8 Z M150,62 C112,62 92,88 92,114 C92,142 114,160 150,160 C186,160 204,140 204,112 C204,84 186,62 150,62 Z" fill="url(#${id})" style="opacity:var(--d-mf,1)"/>`;
    s += `<path d="M40,80 q30,-20 60,-8 M30,130 q20,30 60,40 M200,40 q30,20 40,50 M210,170 q20,-10 30,-36" stroke="#6f7890" stroke-width="2.2" fill="none" opacity=".6"/>`;
    const lt = `<path fill-rule="evenodd" d="M135,8 C210,8 262,62 262,118 C262,176 212,206 140,206 C64,206 10,170 10,112 C10,56 60,8 135,8 Z M150,62 C112,62 92,88 92,114 C92,142 114,160 150,160 C186,160 204,140 204,112 C204,84 186,62 150,62 Z" fill="#141a3a" opacity=".62"/>` +
      `<path d="M28,96 q40,-70 120,-74 M60,180 q60,20 150,-14" stroke="#bcd4ff" stroke-width="3" fill="none" opacity=".7"/>`;
    return pack(W, H, s, lt);
  };

  S.tower = function ({ w = 80, h = 360, top = 'flat', seed = 1, tone = 'f' } = {}) {
    const r = rng(seed);
    const W = w + 20, H = h + 60, x0 = 10, y0 = 60;
    const body = tone === 'b' ? 'fill:var(--d-tower-b,#5a5480)' : 'fill:var(--d-tower-f,#3b3f6a)';
    const hi = tone === 'b' ? 'fill:var(--d-tower-bh,#6b6590)' : 'fill:var(--d-tower-hi,#55598a)';
    let s = `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" style="${body}"/>`;
    s += `<rect x="${x0}" y="${y0}" width="${f(w * 0.3)}" height="${h}" style="${hi}" opacity=".6"/>`;
    if (top === 'slant') s += `<path d="M${x0},${y0} L${x0 + w},${y0 - 36} L${x0 + w},${y0 + 1} Z" style="${body}"/>`;
    if (top === 'spire') s += `<path d="M${x0 + w * 0.3},${y0} L${x0 + w / 2},${y0 - 52} L${x0 + w * 0.7},${y0} Z" style="${body}"/><rect x="${x0 + w / 2 - 1}" y="${y0 - 60}" width="2" height="12" style="${body}"/>`;
    if (top === 'dome') s += `<path d="M${x0},${y0 + 1} Q${x0 + w / 2},${y0 - w * 0.55} ${x0 + w},${y0 + 1} Z" style="${body}"/>`;
    if (top === 'step') s += `<rect x="${x0 + w * 0.15}" y="${y0 - 22}" width="${f(w * 0.7)}" height="23" style="${body}"/><rect x="${x0 + w * 0.32}" y="${y0 - 40}" width="${f(w * 0.36)}" height="19" style="${body}"/>`;
    if (top === 'needle') s += `<rect x="${x0 + w / 2 - 2}" y="${y0 - 56}" width="4" height="57" style="${body}"/>`;
    if (top === 'crown') s += `<path d="M${x0},${y0} L${x0 + w * 0.2},${y0 - 26} L${x0 + w * 0.4},${y0} L${x0 + w * 0.6},${y0 - 26} L${x0 + w * 0.8},${y0} L${x0 + w},${y0 - 26} L${x0 + w},${y0 + 1} L${x0},${y0 + 1}Z" style="${body}"/>`;
    let win = '';
    const cols = Math.max(2, Math.floor((w - 10) / 9));
    for (let y = y0 + 10; y < y0 + h - 8; y += 11) for (let c = 0; c < cols; c++) if (r() > 0.5) win += `<rect x="${f(x0 + 6 + c * ((w - 12) / cols))}" y="${y}" width="4" height="5" opacity="${(0.55 + r() * 0.45).toFixed(2)}"/>`;
    return pack(W, H, s, `<g style="fill:#ffd58a">${win}</g>`);
  };

  /* -------------------------------------------------------------------------
     BANGALORE
     ---------------------------------------------------------------------- */

  S.vidhanaSoudha = function () {
    const W = 660, H = 230;
    const c = 'fill:var(--b-far,#d8c0c6)';
    let s = '';
    s += `<rect x="20" y="132" width="620" height="98" style="${c}"/>`;
    s += `<rect x="250" y="96" width="160" height="40" style="${c}"/>`;
    s += `<path d="M282,98 Q330,22 378,98 Z" style="${c}"/><rect x="328" y="30" width="4" height="22" style="${c}"/><circle cx="330" cy="28" r="5" style="${c}"/>`;
    for (const x of [90, 570]) s += `<rect x="${x - 30}" y="104" width="60" height="30" style="${c}"/><path d="M${x - 24},106 Q${x},60 ${x + 24},106 Z" style="${c}"/>`;
    for (const x of [180, 480]) s += `<path d="M${x - 14},134 Q${x},106 ${x + 14},134 Z" style="${c}"/>`;
    let col = '';
    for (let x = 34; x < 630; x += 14) col += `M${x},150 V226 `;
    s += `<path d="${col}" style="stroke:var(--b-far-d,#c2a8b0)" stroke-width="4"/>`;
    return { svg: svg(W, H, s), w: W, h: H };
  };

  function canopy(r, cx, cy, rx, ry, n, cols, rmin, rmax, flat) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (0.02 + 0.96 * r());
      const rad = Math.sqrt(r());
      const x = cx + Math.cos(a) * rx * rad * (r() > 0.5 ? 1 : -1);
      const y = cy - Math.sin(a) * ry * rad * (flat ? 0.75 : 1);
      const rr = rmin + r() * (rmax - rmin);
      const k = Math.min(cols.length - 1, Math.floor(((cy - y) / ry + r() * 0.35) * cols.length));
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" fill="${cols[Math.max(0, k)]}"/>`;
    }
    return s;
  }

  S.rainTree = function ({ seed = 3, flip = false } = {}) {
    const W = 660, H = 480;
    const r = rng(seed);
    let s = '';
    s += `<path d="M318,480 C320,400 312,330 300,282 C280,250 230,226 180,214 M306,330 C330,280 380,250 460,232 M312,300 C316,262 326,236 340,212" stroke="#5b4636" stroke-width="22" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M306,480 C308,420 304,360 300,300" stroke="#4b382b" stroke-width="10" fill="none" opacity=".6"/>`;
    s += canopy(r, 330, 250, 320, 140, 70, ['#2c5235', '#36613e', '#43724a', '#548458', '#689a62'], 34, 62, true);
    s += canopy(r, 330, 200, 250, 70, 26, ['#5b8c5a', '#6fa064', '#86b471'], 22, 40, true);
    return { svg: svg(W, H, flip ? `<g transform="translate(${W} 0) scale(-1 1)">${s}</g>` : s), w: W, h: H };
  };

  S.jacaranda = function ({ seed = 9 } = {}) {
    const W = 400, H = 400;
    const r = rng(seed);
    let s = '';
    s += `<path d="M200,400 C202,340 196,290 188,250 C176,220 150,200 120,186 M192,290 C212,250 246,226 290,214" stroke="#5a4535" stroke-width="13" fill="none" stroke-linecap="round"/>`;
    s += canopy(r, 205, 210, 180, 150, 64, ['#6f58a8', '#8466c0', '#9b7fd1', '#b39ae0', '#c9b6ee'], 22, 44, false);
    s += canopy(r, 205, 210, 170, 120, 10, ['#5d8a55', '#6f9c62'], 12, 20, false);
    return { svg: svg(W, H, s), w: W, h: H };
  };

  S.bungalow = function () {
    const W = 460, H = 310;
    const id = nid('bg');
    let s = `<defs>${lin(id, [[0, '#b34d33'], [1, '#8f3b27']])}</defs>`;
    s += `<rect x="22" y="282" width="416" height="22" fill="#cbb69c"/><rect x="40" y="276" width="160" height="8" fill="#a5463a"/>`;
    s += `<rect x="40" y="156" width="380" height="126" fill="#f4e8d2"/><rect x="40" y="156" width="380" height="16" fill="#d9c6a6" opacity=".7"/>`;
    for (const x of [52, 112, 172]) s += `<rect x="${x}" y="166" width="12" height="112" fill="#fbf6ec"/><rect x="${x - 3}" y="166" width="18" height="6" fill="#e6dcc8"/>`;
    s += `<rect x="64" y="186" width="96" height="90" fill="#e3d4bb" opacity=".6"/>`;
    s += `<rect x="96" y="200" width="34" height="76" fill="#6b4a33"/>`;
    for (const x of [232, 330]) s += `<rect x="${x}" y="190" width="56" height="54" fill="#fbf6ec"/><rect x="${x + 4}" y="194" width="22" height="46" fill="#4f7f5a"/><rect x="${x + 30}" y="194" width="22" height="46" fill="#4f7f5a"/>`;
    s += `<path d="M14,168 L92,70 L368,70 L446,168 Z" fill="url(#${id})"/>`;
    let sc = '';
    for (let y = 82; y < 166; y += 12) { const k = (y - 70) / 98; const xa = 92 - 78 * k, xb = 368 + 78 * k; for (let x = xa; x < xb; x += 14) sc += `M${f(x)},${y} q7,6 14,0 `; }
    s += `<path d="${sc}" stroke="#7d3322" stroke-width="1.3" fill="none" opacity=".5"/>`;
    s += `<path d="M92,70 H368" stroke="#6b2a1a" stroke-width="4"/>`;
    for (const x of [70, 150]) s += `<path d="M${x - 9},276 h18 l-3,-14 h-12z" fill="#b5603f"/><circle cx="${x}" cy="252" r="12" fill="#4f8a3c"/>`;
    const lt = `<rect x="236" y="196" width="48" height="42" fill="#ffd48a"/><rect x="334" y="196" width="48" height="42" fill="#ffd48a"/><rect x="64" y="186" width="96" height="90" fill="#ffcf7a" opacity=".45"/>`;
    return pack(W, H, s, lt);
  };

  S.wallTile = function () {
    const W = 600, H = 100;
    let s = `<rect y="30" width="${W}" height="70" fill="#efe3cc"/><rect y="22" width="${W}" height="10" fill="#b5603f"/><rect y="30" width="${W}" height="4" fill="#9a4e33" opacity=".5"/>`;
    for (let x = 0; x < W; x += 150) s += `<rect x="${x}" y="8" width="26" height="92" fill="#e6d7bc"/><rect x="${x - 3}" y="2" width="32" height="9" fill="#b5603f"/>`;
    let moss = '';
    for (let x = 0; x < W; x += 9) moss += `M${x},100 q2,-${6 + (x * 7) % 9} 4,0 `;
    s += `<path d="${moss}" fill="#6f9a4c"/>`;
    return tile(W, H, s);
  };

  S.lawnTile = function () {
    const W = 600, H = 140;
    const r = rng(31);
    let s = `<defs>${lin('l', [[0, '#8db86a'], [1, '#6a9a4c']])}</defs><rect width="${W}" height="${H}" fill="url(#l)"/>`;
    let g = '';
    for (let i = 0; i < 260; i++) { const x = r() * W, y = 6 + r() * (H - 6), hh = 3 + r() * 6; g += `M${f(x)},${f(y)} l${f((r() - 0.5) * 3)},${f(-hh)} `; }
    s += `<path d="${g}" stroke="#5c8a42" stroke-width="1.4" stroke-linecap="round" opacity=".6"/>`;
    return tile(W, H, s);
  };

  S.gate = function () {
    const W = 200, H = 130;
    let s = `<rect x="0" y="10" width="30" height="120" fill="#e6d7bc"/><rect x="-3" y="4" width="36" height="10" fill="#b5603f"/>`;
    s += `<rect x="170" y="10" width="30" height="120" fill="#e6d7bc"/><rect x="167" y="4" width="36" height="10" fill="#b5603f"/>`;
    let bars = '';
    for (let x = 38; x < 166; x += 9) bars += `M${x},${40 + Math.abs(x - 100) * 0.12} V128 `;
    s += `<path d="${bars}" stroke="#2c2c2c" stroke-width="2.6"/><path d="M34,52 Q100,26 166,52 M34,92 H166 M34,126 H166" stroke="#2c2c2c" stroke-width="3" fill="none"/>`;
    return { svg: svg(W, H, s), w: W, h: H };
  };

  S.bench = function () {
    const W = 190, H = 96;
    let s = `<path d="M24,94 L30,52 M166,94 L160,52 M40,94 L44,62 M150,94 L146,62" stroke="#2c2a28" stroke-width="5" stroke-linecap="round"/>`;
    for (let i = 0; i < 3; i++) s += `<rect x="18" y="${14 + i * 12}" width="154" height="8" rx="3" fill="#8a5a3a"/>`;
    s += `<rect x="12" y="54" width="166" height="9" rx="3" fill="#7a4e32"/><rect x="12" y="62" width="166" height="6" rx="3" fill="#6a432b"/>`;
    return { svg: svg(W, H, s), w: W, h: H };
  };

  S.lampPost = function () {
    const W = 80, H = 250;
    let s = `<rect x="37" y="60" width="6" height="186" fill="#2e2c2b"/><rect x="31" y="236" width="18" height="14" fill="#2e2c2b"/>`;
    s += `<path d="M28,62 h24 l-4,-34 h-16z" fill="#2e2c2b"/><path d="M32,58 h16 l-3,-26 h-10z" fill="#f7e5b8"/><path d="M26,30 h28 l-14,-14z" fill="#2e2c2b"/>`;
    const lt = `<defs><radialGradient id="lpg"><stop offset="0" stop-color="#ffe6a6" stop-opacity=".9"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs><circle cx="40" cy="44" r="36" fill="url(#lpg)"/><path d="M32,58 h16 l-3,-26 h-10z" fill="#fff2c4"/>`;
    return pack(W, H, s, lt);
  };

  S.roses = function ({ seed = 4 } = {}) {
    const W = 140, H = 70;
    const r = rng(seed);
    let s = `<path d="M6,70 C0,40 30,20 70,22 C110,20 140,40 134,70 Z" fill="#4f7d45"/><path d="M20,70 C18,48 40,34 70,34 C100,34 122,48 120,70Z" fill="#5c8c4f"/>`;
    for (let i = 0; i < 16; i++) s += `<circle cx="${f(16 + r() * 108)}" cy="${f(30 + r() * 34)}" r="${f(3 + r() * 2.5)}" fill="${['#d64550', '#e8687a', '#f2a1b0', '#c2303f'][i % 4]}"/>`;
    return { svg: svg(W, H, s), w: W, h: H };
  };

  /* -------------------------------------------------------------------------
     JOURNEYS
     ---------------------------------------------------------------------- */

  S.trainBig = function () {
    const coachW = 310, gap = 12, coaches = 6, locoW = 330;
    const W = locoW + coaches * (coachW + gap) + 20, H = 150;
    let s = '';
    s += `<rect x="0" y="134" width="${W}" height="4" fill="#3a3330"/>`;
    // locomotive (nose on the left, it leads the train)
    s += `<path d="M14,128 V70 Q14,52 40,50 H110 V30 Q110,22 120,22 H322 Q330,22 330,32 V128 Z" fill="#a1342a"/>`;
    s += `<rect x="14" y="84" width="316" height="14" fill="#efe1c2"/>`;
    s += `<rect x="122" y="34" width="34" height="26" rx="3" fill="#2b3640"/><rect x="164" y="34" width="34" height="26" rx="3" fill="#2b3640"/>`;
    s += `<rect x="24" y="60" width="18" height="12" rx="3" fill="#2b3640"/><circle cx="20" cy="104" r="6" fill="#ffe7a0"/><circle cx="20" cy="104" r="16" fill="#ffe7a0" opacity=".25"/>`;
    for (let x = 214; x < 320; x += 12) s += `<rect x="${x}" y="34" width="6" height="40" fill="#8a2b22"/>`;
    s += `<rect x="40" y="126" width="110" height="12" rx="4" fill="#2b2523"/><rect x="200" y="126" width="110" height="12" rx="4" fill="#2b2523"/>`;
    for (const x of [58, 94, 130, 218, 254, 290]) s += `<circle cx="${x}" cy="138" r="9" fill="#1f1b1a"/>`;
    // coaches
    for (let i = 0; i < coaches; i++) {
      const x0 = locoW + 12 + i * (coachW + gap);
      s += `<rect x="${x0 - gap}" y="56" width="${gap}" height="60" fill="#3a3330"/>`;
      const hole = i === 2 ? ` M${x0 + 141},52 h24 v32 h-24 Z` : '';
      s += `<path fill-rule="evenodd" d="M${x0},128 V44 Q${x0},30 ${x0 + 16},30 H${x0 + coachW - 16} Q${x0 + coachW},30 ${x0 + coachW},44 V128 Z${hole}" fill="#7b2d26"/>`;
      s += `<path d="M${x0 + 6},31 H${x0 + coachW - 6}" stroke="#9a9792" stroke-width="5" stroke-linecap="round"/>`;
      s += `<rect x="${x0}" y="104" width="${coachW}" height="4" fill="#e4c98e"/>`;
      s += `<rect x="${x0 + 8}" y="50" width="22" height="70" rx="2" fill="#5f231d"/><rect x="${x0 + coachW - 30}" y="50" width="22" height="70" rx="2" fill="#5f231d"/>`;
      for (let w = 0; w < 7; w++) {
        const wx = x0 + 42 + w * 33;
        const portal = (i === 2 && w === 3);
        s += `<rect${portal ? ' class="portal-win"' : ''} x="${wx}" y="52" width="24" height="32" rx="3" fill="${portal ? '#ffe2b0' : '#f3d9a6'}"/>`;
        s += `<path${portal ? ' class="portal-bars"' : ''} d="M${wx + 6},52 V84 M${wx + 12},52 V84 M${wx + 18},52 V84" stroke="#5f231d" stroke-width="2"/>`;
      }
      s += `<rect x="${x0 + 24}" y="126" width="80" height="12" rx="4" fill="#2b2523"/><rect x="${x0 + coachW - 104}" y="126" width="80" height="12" rx="4" fill="#2b2523"/>`;
      for (const x of [x0 + 40, x0 + 88, x0 + coachW - 88, x0 + coachW - 40]) s += `<circle cx="${x}" cy="138" r="8.5" fill="#1f1b1a"/>`;
    }
    return { svg: svg(W, H, s), w: W, h: H };
  };

  S.planeBig = function () {
    const W = 340, H = 120;
    let s = '';
    s += `<path d="M150,64 L92,110 L118,110 L196,68 Z" fill="#c9ced8"/>`;
    s += `<path d="M30,52 Q30,40 50,38 L290,36 Q330,40 336,54 Q330,68 290,70 L54,72 Q30,70 30,52 Z" fill="#f7f8fb"/>`;
    s += `<path d="M30,58 Q30,66 54,70 L290,68 Q326,66 334,56 Z" fill="#dfe3ea"/>`;
    s += `<path d="M36,44 L12,4 L34,4 L78,40 Z" fill="#f2f3f7"/><path d="M18,10 L30,10 L58,36 L44,36 Z" fill="#2f7f7a"/><path d="M22,16 L33,16 L52,34 L41,34 Z" fill="#e2b663"/>`;
    s += `<path d="M30,50 L4,58 L26,58 L50,52 Z" fill="#d7dbe3"/>`;
    for (let x = 80; x < 290; x += 12) s += `<circle cx="${x}" cy="48" r="2.6" fill="#33435a"/>`;
    s += `<path d="M304,42 Q318,44 326,50 L306,50 Z" fill="#33435a"/>`;
    s += `<rect x="40" y="58" width="270" height="3" fill="#2f7f7a" opacity=".9"/>`;
    s += `<path d="M160,76 h40 q8,0 8,7 q0,7 -8,7 h-40 z" fill="#b9bfcb"/>`;
    s += `<path d="M150,62 L140,22 L156,22 L184,60 Z" fill="#d9dde5"/>`;
    return { svg: svg(W, H, s), w: W, h: H };
  };

  S.cloud = function ({ seed = 1, w = 420 } = {}) {
    const r = rng(seed);
    const H = Math.round(w * 0.38);
    let c = '';
    const n = 7 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) {
      const x = w * (0.15 + 0.7 * (i / (n - 1))) + (r() - 0.5) * 30;
      const rr = H * (0.28 + r() * 0.3) * (1 - Math.abs(i / (n - 1) - 0.5) * 0.9);
      c += `<circle cx="${f(x)}" cy="${f(H - rr * 0.75 - 6)}" r="${f(rr)}"/>`;
    }
    c += `<rect x="${f(w * 0.12)}" y="${f(H - 20)}" width="${f(w * 0.76)}" height="14" rx="7"/>`;
    const id = nid('cl');
    return svg(w, H, `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".95"/><stop offset=".7" stop-color="currentColor" stop-opacity=".55"/><stop offset="1" stop-color="currentColor" stop-opacity=".12"/></linearGradient><filter id="${id}b" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="3.5"/></filter></defs><g fill="url(#${id})" filter="url(#${id}b)">${c}</g>`);
  };

  S.moon = function () {
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="mg" cx=".5" cy=".5" r=".5"><stop offset=".3" stop-color="#fff6dc" stop-opacity=".5"/><stop offset="1" stop-color="#fff6dc" stop-opacity="0"/></radialGradient><mask id="mm"><rect width="100" height="100" fill="#fff"/><circle cx="62" cy="42" r="22" fill="#000"/></mask></defs><circle cx="50" cy="50" r="50" fill="url(#mg)"/><circle cx="50" cy="50" r="24" fill="#fff1cf" mask="url(#mm)"/></svg>`;
  };

  window.ArtScenes = S;
})();

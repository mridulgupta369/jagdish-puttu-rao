/* ==========================================================================
   THE DREAM — the farmland Jagdish will own and farm soon.
   Every piece returns { w, h, body } (inner SVG markup, viewBox 0 0 w h).
   main.js renders each piece twice: a pencil "sketch" layer that draws
   itself (stroke-dashoffset via --draw) and the coloured layer that fades in
   once the dream becomes real.
   ========================================================================== */
(function () {
  'use strict';

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
  const lin = (id, stops, x2 = 0, y2 = 1) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map((s) => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] !== undefined ? ` stop-opacity="${s[2]}"` : ''}/>`).join('')}</linearGradient>`;
  const tile = (w, h, inner) =>
    `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none">${inner}</svg>`)}")`;

  const A = {};

  /* Fields stretching to the horizon: alternating crop bands with furrows. */
  A.fieldsTile = function () {
    const W = 1200, H = 220;
    const bands = [['#b9cf7a', 0, 26], ['#d9c27a', 26, 46], ['#9fc46a', 46, 72], ['#c9b36a', 72, 100], ['#8fbb5c', 100, 136], ['#7fae52', 136, 178], ['#6f9e48', 178, 220]];
    let s = '';
    bands.forEach(([c, y0, y1], i) => {
      s += `<rect x="0" y="${y0}" width="${W}" height="${y1 - y0 + 1}" fill="${c}"/>`;
      const n = 10 + i * 4;
      let fur = '';
      for (let k = 0; k <= n; k++) {
        const x = k * W / n;
        fur += `M${f(x)},${y0} L${f(x + (x - W / 2) * 0.02)},${y1} `;
      }
      s += `<path d="${fur}" stroke="#000" stroke-opacity=".07" stroke-width="${1 + i * 0.35}"/>`;
      s += `<rect x="0" y="${y0}" width="${W}" height="1.5" fill="#fff" opacity=".18"/>`;
    });
    return tile(W, H, s);
  };

  A.farmhouse = function () {
    const W = 380, H = 250;
    let s = `<defs>${lin('fhr', [[0, '#c0563a'], [1, '#93402a']])}${lin('fhw', [[0, '#f6ead2'], [1, '#e8d6b4']])}</defs>`;
    s += `<rect x="30" y="226" width="320" height="18" fill="#a8835e"/>`;
    s += `<rect x="54" y="132" width="272" height="96" fill="url(#fhw)"/>`;
    s += `<rect x="54" y="132" width="272" height="14" fill="#d8c29c" opacity=".7"/>`;
    s += `<rect x="166" y="160" width="44" height="68" rx="3" fill="#6b4a33"/><circle cx="202" cy="196" r="2.5" fill="#e0b04a"/>`;
    s += `<rect x="86" y="164" width="46" height="36" fill="#4f7f5a"/><path d="M109,164 V200 M86,182 H132" stroke="#f6ead2" stroke-width="3"/>`;
    s += `<rect x="246" y="164" width="46" height="36" fill="#4f7f5a"/><path d="M269,164 V200 M246,182 H292" stroke="#f6ead2" stroke-width="3"/>`;
    s += `<path d="M20,142 L190,48 L360,142 Z" fill="url(#fhr)"/>`;
    let tl = '';
    for (let i = 1; i < 6; i++) { const y = 48 + i * 16; const k = (y - 48) / 94; tl += `M${f(190 - 170 * k)},${y} L${f(190 + 170 * k)},${y} `; }
    s += `<path d="${tl}" stroke="#7d3322" stroke-width="1.4" opacity=".5"/>`;
    s += `<rect x="290" y="70" width="18" height="40" fill="#8a7a6a"/><rect x="286" y="66" width="26" height="6" fill="#6f6255"/>`;
    s += `<path d="M300,60 q-8,-14 4,-26 q10,-10 0,-22" stroke="#e8e2da" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/>`;
    s += `<rect x="40" y="206" width="70" height="8" rx="2" fill="#8a5a3a"/><path d="M44,214 v12 M106,214 v12" stroke="#6a4630" stroke-width="4"/>`;
    s += `<path d="M48,206 h58" stroke="#e9d9b8" stroke-width="6" stroke-dasharray="3 3"/>`;
    s += `<ellipse cx="330" cy="222" rx="14" ry="6" fill="#9a5636"/><path d="M318,222 q12,-26 24,0 z" fill="#b8683f"/>`;
    return { w: W, h: H, body: s };
  };

  A.well = function () {
    const W = 140, H = 170;
    let s = `<rect x="22" y="104" width="96" height="62" rx="6" fill="#a9a196"/>`;
    for (let y = 112; y < 162; y += 14) for (let x = 26 + ((y / 14) % 2) * 9; x < 112; x += 18) s += `<rect x="${x}" y="${y}" width="15" height="10" rx="2" fill="#8f877c"/>`;
    s += `<ellipse cx="70" cy="104" rx="50" ry="11" fill="#7a7268"/><ellipse cx="70" cy="104" rx="40" ry="7" fill="#2f3f4a"/>`;
    s += `<path d="M30,104 V30 M110,104 V30 M24,30 H116" stroke="#6b4a33" stroke-width="7" stroke-linecap="round"/>`;
    s += `<circle cx="70" cy="30" r="9" fill="#8a6a4c"/><path d="M70,39 V86" stroke="#4a3a2e" stroke-width="2"/>`;
    s += `<path d="M58,86 h24 l-3,18 h-18z" fill="#b8683f"/>`;
    return { w: W, h: H, body: s };
  };

  A.mangoTree = function ({ seed = 5 } = {}) {
    const W = 440, H = 420;
    const r = rng(seed);
    let s = `<path d="M218,420 C220,350 214,300 206,262 C190,236 160,222 128,212 M212,300 C232,262 268,240 312,230 M214,280 C216,248 222,226 232,206" stroke="#5b4636" stroke-width="18" fill="none" stroke-linecap="round"/>`;
    const greens = ['#2f5a36', '#3a6a40', '#46784a', '#558756'];
    for (let i = 0; i < 70; i++) {
      const a = Math.PI * (0.05 + 0.9 * r()), rad = Math.sqrt(r());
      const x = 220 + Math.cos(a) * 190 * rad * (r() > 0.5 ? 1 : -1), y = 196 - Math.sin(a) * 150 * rad;
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(24 + r() * 26)}" fill="${greens[Math.min(3, Math.floor(((196 - y) / 150 + r() * 0.3) * 4))]}"/>`;
    }
    for (let i = 0; i < 18; i++) {
      const x = 70 + r() * 300, y = 120 + r() * 120;
      s += `<path d="M${f(x)},${f(y - 8)} v6" stroke="#4a3a2e" stroke-width="1.5"/><ellipse cx="${f(x)}" cy="${f(y + 4)}" rx="7" ry="9" fill="${r() > 0.5 ? '#f2b33d' : '#e8962f'}"/>`;
    }
    return { w: W, h: H, body: s };
  };

  A.scarecrow = function () {
    const W = 120, H = 230;
    let s = `<path d="M60,230 V60 M14,98 H106" stroke="#7a5a3a" stroke-width="7" stroke-linecap="round"/>`;
    s += `<path d="M30,96 h60 l-6,66 h-48 z" fill="#c8463c"/><path d="M36,112 h48 M38,128 h44" stroke="#f2e2c6" stroke-width="3"/>`;
    s += `<circle cx="60" cy="52" r="20" fill="#e9d9b2"/><path d="M34,40 q26,-30 52,0 z" fill="#c9a24a"/><rect x="30" y="38" width="60" height="6" rx="3" fill="#a8832e"/>`;
    s += `<path d="M14,98 l-8,10 M14,98 l-2,13 M106,98 l8,10 M106,98 l2,13" stroke="#d9b56a" stroke-width="3" stroke-linecap="round"/>`;
    return { w: W, h: H, body: s };
  };

  A.cow = function ({ flip = false, tone = '#f1ebe0' } = {}) {
    const W = 200, H = 140;
    let s = `<rect x="38" y="44" width="120" height="58" rx="26" fill="${tone}"/>`;
    s += `<ellipse cx="78" cy="66" rx="18" ry="14" fill="#c9b8a4" opacity=".7"/>`;
    s += `<path d="M154,52 q26,-6 34,8 q6,16 -10,22 q-16,4 -26,-8 z" fill="${tone}"/><ellipse cx="184" cy="78" rx="9" ry="7" fill="#d8a29a"/>`;
    s += `<path d="M162,46 q-4,-14 6,-18 M178,48 q8,-12 18,-8" stroke="#bfae96" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    s += `<circle cx="174" cy="62" r="2.6" fill="#2a2420"/>`;
    s += `<path d="M58,98 v34 M82,98 v34 M126,98 v34 M146,98 v34" stroke="${tone}" stroke-width="12" stroke-linecap="round"/>`;
    s += `<path d="M58,128 v6 M82,128 v6 M126,128 v6 M146,128 v6" stroke="#5a4a3e" stroke-width="12" stroke-linecap="butt"/>`;
    s += `<path d="M40,58 q-22,10 -18,40" stroke="${tone}" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="22" cy="100" r="5" fill="#5a4a3e"/>`;
    return { w: W, h: H, body: flip ? `<g transform="translate(${W} 0) scale(-1 1)">${s}</g>` : s };
  };

  A.crops = function ({ seed = 2, w = 900 } = {}) {
    const W = w, H = 120;
    const r = rng(seed);
    let s = '';
    for (let x = 6; x < W; x += 13 + r() * 7) {
      const h = 60 + r() * 50, lean = (r() - 0.5) * 10;
      s += `<path d="M${f(x)},${H} q${f(lean * 0.4)},-${f(h * 0.5)} ${f(lean)},-${f(h)}" stroke="#4f8a3c" stroke-width="3" fill="none"/>`;
      s += `<path d="M${f(x + lean * 0.5)},${f(H - h * 0.55)} q12,-8 18,4 M${f(x + lean * 0.6)},${f(H - h * 0.7)} q-12,-8 -18,4" stroke="#5f9a46" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
      if (r() > 0.55) s += `<ellipse cx="${f(x + lean)}" cy="${f(H - h - 6)}" rx="3.6" ry="9" fill="#e6c25a"/>`;
    }
    return { w: W, h: H, body: s };
  };

  A.tractor = function () {
    const W = 330, H = 210;
    let s = '';
    s += `<path d="M96,118 h150 q20,0 22,20 v20 h-172 z" fill="#c8302c"/>`;
    s += `<path d="M150,70 h86 q16,0 20,16 l10,32 h-116 z" fill="#d93a33"/>`;
    s += `<rect x="236" y="96" width="34" height="40" rx="5" fill="#b32823"/>`;
    for (let i = 0; i < 4; i++) s += `<rect x="262" y="${100 + i * 9}" width="10" height="5" rx="2" fill="#2a2a2a"/>`;
    s += `<rect x="212" y="34" width="9" height="40" rx="3" fill="#3a3a3a"/>`;
    s += `<g class="tr-smoke"><circle cx="216" cy="26" r="7" fill="#d9d4cc" opacity=".7"/><circle cx="224" cy="14" r="9" fill="#e4dfd8" opacity=".5"/><circle cx="234" cy="2" r="11" fill="#eeeae4" opacity=".35"/></g>`;
    s += `<path d="M120,118 v-38 q0,-10 10,-10 h12" stroke="#3a3a3a" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    s += `<rect x="104" y="96" width="40" height="10" rx="4" fill="#2f2f2f"/>`;
    s += `<path d="M150,90 l18,-26" stroke="#2f2f2f" stroke-width="5" stroke-linecap="round"/><ellipse cx="170" cy="62" rx="14" ry="5" fill="#2f2f2f" transform="rotate(-20 170 62)"/>`;
    s += `<path d="M60,92 q30,-36 76,-10 v30 h-90 z" fill="#c8302c"/>`;
    const wheel = (cx, cy, r, hub) => {
      let lug = '';
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; lug += `M${f(cx + Math.cos(a) * (r - 6))},${f(cy + Math.sin(a) * (r - 6))} L${f(cx + Math.cos(a) * (r + 2))},${f(cy + Math.sin(a) * (r + 2))} `; }
      return `<g class="wheel" style="transform-box:fill-box;transform-origin:center"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#1f1f1f"/><path d="${lug}" stroke="#141414" stroke-width="6"/><circle cx="${cx}" cy="${cy}" r="${hub}" fill="#f2c14e"/><circle cx="${cx}" cy="${cy}" r="${hub * 0.35}" fill="#b98a22"/><path d="M${cx - hub * 0.8},${cy} H${cx + hub * 0.8} M${cx},${cy - hub * 0.8} V${cy + hub * 0.8}" stroke="#b98a22" stroke-width="3"/></g>`;
    };
    s += wheel(98, 150, 56, 24) + wheel(256, 172, 32, 13);
    return { w: W, h: H, body: s };
  };

  /* Road vehicle (120 x 60, faces right, ground at y=57, .wheel groups) */
  A.tractorIcon = function () {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60" aria-hidden="true" focusable="false">' +
      '<ellipse cx="60" cy="57.4" rx="46" ry="1.9" fill="#000" opacity=".2"/>' +
      '<path d="M40,30 h44 q8,0 9,8 v8 h-53 z" fill="#d93a33" stroke="rgba(255,255,255,.35)" stroke-width=".8"/>' +
      '<path d="M58,18 h24 q6,0 8,6 l3,10 h-35 z" fill="#e0453d"/>' +
      '<rect x="78" y="10" width="3" height="12" rx="1" fill="#3a3a3a"/>' +
      '<path d="M44,30 v-10 q0,-4 4,-4 h4" stroke="#2f2f2f" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      '<path d="M26,26 q10,-12 26,-4 v10 h-30 z" fill="#c8302c"/>' +
      '<g class="wheel" style="transform-box:fill-box;transform-origin:center"><circle cx="38" cy="43" r="14" fill="#1f1f1f"/><circle cx="38" cy="43" r="6.5" fill="#f2c14e"/><path d="M33,43 h10 M38,38 v10" stroke="#b98a22" stroke-width="1.6"/></g>' +
      '<g class="wheel" style="transform-box:fill-box;transform-origin:center"><circle cx="90" cy="49" r="8" fill="#1f1f1f"/><circle cx="90" cy="49" r="3.4" fill="#f2c14e"/><path d="M87,49 h6 M90,46 v6" stroke="#b98a22" stroke-width="1.2"/></g>' +
      '</svg>';
  };

  window.ArtDream = A;
})();

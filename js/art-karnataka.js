/* ==========================================================================
   ART FOR JAGDISH'S STORY (beyond the shared scenery library)
   - arecaPalm: the slender areca (betel-nut) palms of Dakshina Kannada
   - jasmineBush: Hoovina Hadagali is famous for its jasmine (Hadagali mallige)
   - college: SDM College, Ujire (generic, not a likeness)
   - envelope: letters of the long-distance years
   - trolleyBag: the maroon-and-camouflage trolley bag he brought from Dubai
   Each returns { w, h, svg } like ArtScenes pieces.
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
  const svg = (w, h, inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">${inner}</svg>`;
  const K = {};

  K.arecaPalm = function ({ h = 620, lean = 0, seed = 1 } = {}) {
    const r = rng(seed);
    const W = 220, H = h + 40, bx = W / 2, by = H, tx = bx + lean, ty = 70;
    let s = '';
    // slim, straight ringed trunk
    s += `<path d="M${bx - 6},${by} Q${bx + lean * 0.4 - 5},${(by + ty) / 2} ${tx - 3.5},${ty + 20} L${tx + 3.5},${ty + 20} Q${bx + lean * 0.4 + 5},${(by + ty) / 2} ${bx + 6},${by} Z" fill="#8c8576"/>`;
    let rings = '';
    for (let y = ty + 30; y < by - 6; y += 13) { const k = (y - ty) / (by - ty); const x = tx + (bx - tx) * k; rings += `M${f(x - 5)},${y} h10 `; }
    s += `<path d="${rings}" stroke="#6f695c" stroke-width="1.6" opacity=".7"/>`;
    // green crownshaft and nut bunch
    s += `<path d="M${tx - 5},${ty + 22} L${tx - 4},${ty - 6} L${tx + 4},${ty - 6} L${tx + 5},${ty + 22} Z" fill="#6f9a52"/>`;
    for (let i = 0; i < 9; i++) s += `<circle cx="${f(tx + 6 + (i % 3) * 5)}" cy="${f(ty + 26 + Math.floor(i / 3) * 6)}" r="3.4" fill="${i % 2 ? '#e0892f' : '#c97a2a'}"/>`;
    // feathery fronds
    const angles = [-160, -128, -100, -78, -52, -22, 6, 172];
    angles.forEach((deg, i) => {
      const a = (deg + (r() - 0.5) * 10) * Math.PI / 180, L = 80 + r() * 30;
      const p0 = [tx, ty - 4], p2 = [tx + Math.cos(a) * L, ty - 4 + Math.sin(a) * L + 26 * Math.abs(Math.cos(a))];
      const p1 = [tx + Math.cos(a) * L * 0.5, ty - 4 + Math.sin(a) * L * 0.5 - L * 0.15];
      const q = (t) => [(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]];
      let leaf = '';
      for (let t = 0.12; t <= 0.98; t += 0.07) {
        const [x, y] = q(t), [x2, y2] = q(Math.min(1, t + 0.01));
        const dx = x2 - x, dy = y2 - y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
        const ll = 18 * Math.sin(Math.PI * t);
        leaf += `M${f(x)},${f(y)} l${f((nx + dx / l * 0.4) * ll)},${f((ny + dy / l * 0.4 + 0.4) * ll)} M${f(x)},${f(y)} l${f((-nx + dx / l * 0.4) * ll)},${f((-ny + dy / l * 0.4 + 0.4) * ll)} `;
      }
      const col = i % 2 ? '#3d7a4a' : '#2f6640';
      s += `<path d="M${f(p0[0])},${f(p0[1])} Q${f(p1[0])},${f(p1[1])} ${f(p2[0])},${f(p2[1])}" stroke="${col}" stroke-width="2.4" fill="none"/><path d="${leaf}" stroke="${col}" stroke-width="2.2" stroke-linecap="round" fill="none"/>`;
    });
    return { w: W, h: H, svg: svg(W, H, s) };
  };

  K.jasmineBush = function ({ seed = 3, w = 220 } = {}) {
    const r = rng(seed);
    const W = w, H = Math.round(w * 0.5);
    let s = `<path d="M6,${H} C0,${H * 0.45} ${W * 0.25},${H * 0.15} ${W / 2},${H * 0.18} C${W * 0.78},${H * 0.12} ${W},${H * 0.45} ${W - 6},${H} Z" fill="#3f6d3e"/>`;
    s += `<path d="M24,${H} C22,${H * 0.6} ${W * 0.3},${H * 0.36} ${W / 2},${H * 0.38} C${W * 0.72},${H * 0.36} ${W - 22},${H * 0.6} ${W - 24},${H} Z" fill="#4f8048"/>`;
    for (let i = 0; i < 40; i++) {
      const x = 18 + r() * (W - 36), y = H * 0.24 + r() * H * 0.62, k = 3 + r() * 2;
      s += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(r() * 70)})"><path d="M0,-${k} L${k * 0.4},0 L0,${k} L-${k * 0.4},0 Z M-${k},0 L0,${k * 0.4} L${k},0 L0,-${k * 0.4} Z" fill="#fbfaf2"/><circle r="${f(k * 0.25)}" fill="#f2d98a"/></g>`;
    }
    return { w: W, h: H, svg: svg(W, H, s) };
  };

  K.college = function () {
    const W = 520, H = 280;
    let s = `<rect x="20" y="250" width="480" height="30" fill="#b9a68a"/>`;
    s += `<rect x="40" y="120" width="440" height="132" fill="#efe1c4"/>`;
    s += `<path d="M30,124 L260,40 L490,124 Z" fill="#a8492f"/><path d="M200,62 L260,40 L320,62 Z" fill="#8f3b27"/>`;
    s += `<rect x="40" y="120" width="440" height="12" fill="#d8c29c"/>`;
    for (let i = 0; i < 9; i++) s += `<rect x="${62 + i * 50}" y="136" width="12" height="112" fill="#fbf4e4"/><rect x="${58 + i * 50}" y="132" width="20" height="6" fill="#e4d4b4"/>`;
    for (let i = 0; i < 8; i++) s += `<rect x="${82 + i * 50}" y="160" width="22" height="34" rx="11" fill="#6b5a4c" opacity=".8"/>`;
    s += `<rect x="236" y="196" width="48" height="56" rx="4" fill="#5a4033"/>`;
    s += `<path d="M180,250 h160 l20,30 h-200 z" fill="#c9b796"/>`;
    s += `<circle cx="260" cy="86" r="14" fill="#f2e4c4"/><path d="M260,78 v8 l6,4" stroke="#6b4a33" stroke-width="2" fill="none"/>`;
    return { w: W, h: H, svg: svg(W, H, s) };
  };

  K.envelope = function ({ tone = '#f6efe2', seal = '#b8402f' } = {}) {
    const W = 120, H = 80;
    let s = `<rect x="2" y="2" width="116" height="76" rx="5" fill="${tone}" stroke="#d6c7ad" stroke-width="2"/>`;
    s += `<path d="M4,6 L60,46 L116,6" stroke="#cdbb9c" stroke-width="2.4" fill="none"/>`;
    s += `<circle cx="60" cy="46" r="9" fill="${seal}"/><path d="M56,46 l3,3 l6,-7" stroke="#f6efe2" stroke-width="1.8" fill="none"/>`;
    s += `<rect x="86" y="54" width="22" height="16" rx="2" fill="none" stroke="#c9a46a" stroke-width="1.6" stroke-dasharray="2 2"/>`;
    return { w: W, h: H, svg: svg(W, H, s) };
  };

  K.trolleyBag = function () {
    const W = 140, H = 210;
    let s = `<path d="M50,8 h40 v8 h-6 v28 h-28 v-28 h-6 z" fill="#3a3a3a"/>`;
    s += `<rect x="16" y="44" width="108" height="150" rx="16" fill="#7a1f2b"/>`;
    // camouflage panel
    s += `<clipPath id="tbcl"><rect x="28" y="58" width="84" height="122" rx="10"/></clipPath>`;
    s += `<g clip-path="url(#tbcl)"><rect x="28" y="58" width="84" height="122" fill="#6b7a4a"/>`;
    const blobs = [[40, 70, 16, '#4d5a33'], [86, 80, 20, '#8a8a5c'], [60, 110, 18, '#3e4a2a'], [100, 130, 16, '#4d5a33'], [44, 150, 20, '#8a8a5c'], [84, 168, 18, '#3e4a2a'], [70, 92, 10, '#a39a6c']];
    blobs.forEach(([x, y, r, c]) => { s += `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.7}" transform="rotate(${(x * 7) % 60} ${x} ${y})" fill="${c}"/>`; });
    s += `</g>`;
    s += `<rect x="28" y="58" width="84" height="122" rx="10" fill="none" stroke="#5a1520" stroke-width="3"/>`;
    s += `<rect x="60" y="34" width="20" height="12" rx="3" fill="#2a2a2a"/>`;
    s += `<circle cx="34" cy="198" r="9" fill="#222"/><circle cx="106" cy="198" r="9" fill="#222"/>`;
    return { w: W, h: H, svg: svg(W, H, s) };
  };

  /* ------------------------------------------------------------------------
     Lit pieces below return { w, h, body, lights, svg } like ArtScenes.pack():
     main.js stacks body / night copy / lights as separate layers. Gradient
     ids are unique per call (kuid) so several instances can share a page.
     ---------------------------------------------------------------------- */
  let kuid = 0;
  const stopsK = (list) => list.map((s) => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] !== undefined ? ` stop-opacity="${s[2]}"` : ''}/>`).join('');
  const lg = (id, list, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stopsK(list)}</linearGradient>`;
  const rg = (id, list) => `<radialGradient id="${id}" cx=".5" cy=".5" r=".5">${stopsK(list)}</radialGradient>`;
  const packK = (W, H, body, lights) => ({ w: W, h: H, body, lights, svg: svg(W, H, body + lights) });

  /* A South Indian temple: tiered gopuram, pillared mandapa, brass bells,
     a tall brass dhwaja stambha, red-and-white striped compound walls.
     Anchors (viewBox units): doorway centre (280, 368), bells at (236, 362)
     and (324, 362), flag-mast top (88, 100), ground at y = 480. */
  K.temple = function () {
    const W = 560, H = 480, cx = 280, u = 'kt' + (++kuid);
    let s = `<defs>${lg(u + 'br', [[0, '#94701f'], [0.42, '#ecca68'], [1, '#a47a24']], 1, 0)}${lg(u + 'bl', [[0, '#e9c45c'], [1, '#93691c']])}` +
      `${lg(u + 'wl', [[0, '#f8f2e5'], [1, '#e7d9bf']])}${lg(u + 'st', [[0, '#d6c7aa'], [1, '#b8a586']])}</defs>`;
    const stripes = (x0, x1, y0, y1) => { let t = ''; for (let x = x0, k = 0; x < x1; x += 9, k++) t += `<rect x="${x}" y="${y0}" width="${Math.min(9, x1 - x)}" height="${y1 - y0}" fill="${k % 2 ? '#b8402f' : '#f4ecdc'}"/>`; return t; };

    // ground and the striped compound walls either side
    s += `<rect x="16" y="468" width="528" height="12" fill="#b9a789"/>`;
    s += stripes(24, 118, 404, 470) + stripes(442, 536, 404, 470);
    s += `<rect x="20" y="398" width="102" height="7" fill="#dccfb6"/><rect x="438" y="398" width="102" height="7" fill="#dccfb6"/>`;

    // the gopuram: six tiers of niches and cornices under a barrel-vault crown
    for (let i = 0; i < 6; i++) {
      const yb = 300 - i * 32, yt = yb - 32, w = 216 - i * 26;
      s += `<rect x="${cx - w / 2}" y="${yt}" width="${w}" height="33" fill="url(#${u}wl)"/>`;
      for (let x = cx - w / 2 + 9; x < cx + w / 2 - 6; x += 18) s += `<rect x="${f(x)}" y="${yt + 2}" width="3" height="30" fill="#e2d4ba" opacity=".8"/>`;
      const n = Math.max(1, Math.floor((w - 20) / 34)), x0 = cx - (n - 1) * 17;
      for (let k = 0; k < n; k++) {
        const x = x0 + k * 34;
        s += `<path d="M${x - 7},${yb - 3} V${yt + 13} A7 7 0 0 1 ${x + 7},${yt + 13} V${yb - 3} Z" fill="#cbb693"/>`;
        s += `<circle cx="${x}" cy="${yt + 15}" r="2.6" fill="#e0892f"/><rect x="${x - 2.4}" y="${yt + 17.4}" width="4.8" height="8" rx="1.6" fill="${k % 2 ? '#b8402f' : '#e0892f'}"/>`;
      }
      s += `<rect x="${cx - w / 2 - 8}" y="${yt - 6}" width="${w + 16}" height="7" fill="#efe3ca"/><rect x="${cx - w / 2 - 8}" y="${yt + 1}" width="${w + 16}" height="2.2" fill="#e0892f"/>`;
      if (i % 2 === 0) s += `<rect x="${cx - w / 2}" y="${yb - 3}" width="${w}" height="1.6" fill="#b8402f" opacity=".8"/>`;
    }
    s += `<path d="M${cx - 50},108 V92 Q${cx},46 ${cx + 50},92 V108 Z" fill="#f6ecd9"/>`;
    s += `<path d="M${cx - 50},92 Q${cx},46 ${cx + 50},92" stroke="#e0892f" stroke-width="2.4" fill="none"/>`;
    s += `<rect x="${cx - 52}" y="101" width="104" height="7" fill="#b8402f"/>`;
    s += `<path d="M${cx - 50},101 V90 A9 11 0 0 1 ${cx - 32},90 V101 Z M${cx + 32},101 V90 A9 11 0 0 1 ${cx + 50},90 V101 Z" fill="#e39a55"/>`;
    s += `<path d="M${cx - 45},101 V92 A4 5 0 0 1 ${cx - 37},92 V101 Z M${cx + 37},101 V92 A4 5 0 0 1 ${cx + 45},92 V101 Z" fill="#8a4a2a"/>`;
    for (let k = -2; k <= 2; k++) {
      const x = cx + k * 17, y = 70 + Math.abs(k) * Math.abs(k) * 2.6;
      s += `<path d="M${x - 4},${y} Q${x - 5.5},${y - 5} ${x},${y - 7.5} Q${x + 5.5},${y - 5} ${x + 4},${y} Z" fill="url(#${u}bl)"/><path d="M${x},${y - 7.5} V${y - 15}" stroke="#c9a03f" stroke-width="2" stroke-linecap="round"/><circle cx="${x}" cy="${y - 16}" r="1.8" fill="#ecca68"/>`;
    }

    // the mandapa: plinth, shadowed hall, pillars, roof slab and parapet
    s += `<rect x="116" y="400" width="328" height="42" fill="url(#${u}st)"/>`;
    s += `<rect x="116" y="404" width="328" height="3" fill="#c5b292"/><rect x="116" y="418" width="328" height="4" fill="#a8946f" opacity=".6"/><rect x="116" y="432" width="328" height="3" fill="#c5b292"/>`;
    s += `<rect x="128" y="318" width="304" height="82" fill="#6b4c39"/>`;
    s += `<rect x="128" y="318" width="304" height="10" fill="#4f3729" opacity=".7"/>`;
    for (let x = 118; x < 440; x += 18) s += `<path d="M${x},296 V289 Q${x + 7},280 ${x + 14},289 V296 Z" fill="#f4ecdc"/><circle cx="${x + 7}" cy="290" r="1.6" fill="#e0892f"/>`;
    s += `<rect x="110" y="295" width="340" height="17" fill="#efe4cc"/><rect x="110" y="312" width="340" height="5" fill="#e0892f"/><rect x="110" y="317" width="340" height="2" fill="#b8402f"/>`;
    [140, 178, 216, 344, 382, 420].forEach((x) => {
      s += `<rect x="${x - 7}" y="319" width="14" height="81" fill="#f6efe0"/><rect x="${x - 7}" y="319" width="4" height="81" fill="#e6dac3"/>`;
      s += `<rect x="${x - 7}" y="337" width="14" height="4" fill="#b8402f"/><rect x="${x - 7}" y="381" width="14" height="4" fill="#e0892f"/>`;
      s += `<rect x="${x - 10}" y="319" width="20" height="7" fill="#e6d9bf"/><rect x="${x - 9}" y="394" width="18" height="6" fill="#e6d9bf"/>`;
    });
    // the sanctum doorway with its brass frame
    s += `<rect x="246" y="328" width="68" height="6" fill="#d9b04a"/>`;
    s += `<rect x="252" y="334" width="56" height="66" fill="url(#${u}br)"/><rect x="258" y="340" width="44" height="60" fill="#36201a"/>`;
    s += `<path d="M262,400 V352 A18 12 0 0 1 298,352 V400" stroke="#5a3a26" stroke-width="2" fill="none"/>`;
    // two big brass bells on chains
    [236, 324].forEach((x) => {
      s += `<path d="M${x},319 V346" stroke="#7a5a1c" stroke-width="1.6" stroke-dasharray="2.4 1.2"/><circle cx="${x}" cy="347.5" r="2.6" fill="none" stroke="#8a6a1c" stroke-width="1.6"/>`;
      s += `<path d="M${x - 12},377 Q${x - 12},357 ${x - 7},352 Q${x},346 ${x + 7},352 Q${x + 12},357 ${x + 12},377 Z" fill="url(#${u}bl)"/>`;
      s += `<path d="M${x - 5},356 Q${x - 7},364 ${x - 7},372" stroke="#f6dc8a" stroke-width="1.6" fill="none" opacity=".7"/>`;
      s += `<ellipse cx="${x}" cy="377" rx="13.5" ry="3.2" fill="#b38626"/><circle cx="${x}" cy="381.5" r="2.6" fill="#7a5a1c"/>`;
    });
    // the steps
    for (let k = 0; k < 3; k++) {
      const y = 442 + k * 9, w = 92 + k * 22;
      s += `<rect x="${cx - w / 2}" y="${y}" width="${w}" height="9.5" fill="${k % 2 ? '#cbbb9e' : '#d6c8ac'}"/><rect x="${cx - w / 2}" y="${y}" width="${w}" height="1.6" fill="#e8dec8"/>`;
    }
    // the dhwaja stambha (brass flag mast) on its stone pedestal
    s += `<rect x="62" y="448" width="52" height="22" fill="#c4b393"/><rect x="68" y="432" width="40" height="17" fill="#d4c5a8"/><rect x="75" y="420" width="26" height="13" fill="#c4b393"/>`;
    for (let k = 0; k < 7; k++) s += `<path d="M${73 + k * 5},432 q2.5,-6 5,0" fill="#e0892f" opacity=".75"/>`;
    s += `<rect x="83" y="146" width="10" height="275" fill="url(#${u}br)"/>`;
    for (let y = 170; y < 418; y += 28) s += `<rect x="81.5" y="${y}" width="13" height="3.6" rx="1" fill="#8a6a1c"/>`;
    s += `<rect x="64" y="144" width="48" height="4" rx="1.5" fill="url(#${u}br)"/><rect x="69" y="136" width="38" height="4" rx="1.5" fill="url(#${u}br)"/>`;
    s += `<circle cx="66" cy="152" r="2.2" fill="#d9b04a"/><circle cx="110" cy="152" r="2.2" fill="#d9b04a"/><circle cx="72" cy="143" r="1.8" fill="#d9b04a"/><circle cx="104" cy="143" r="1.8" fill="#d9b04a"/>`;
    s += `<path d="M79,136 H97 L88,121 Z" fill="url(#${u}br)"/><circle cx="88" cy="119" r="2.4" fill="#ecca68"/>`;
    s += `<path d="M88,118 V98" stroke="#a47a24" stroke-width="1.6"/><path d="M88.8,99 L114,105 L88.8,111 Z" fill="#e0892f"/><path d="M88.8,99 L114,105 L88.8,102.6 Z" fill="#f2a64a"/>`;

    // lights for dusk: the lamp-lit doorway, clay diyas, two hanging lamps
    let L = `<defs>${rg(u + 'dg', [[0, '#ffd27a', 0.95], [0.5, '#ffb24a', 0.4], [1, '#ff9a3a', 0]])}${rg(u + 'lg', [[0, '#ffc867', 0.75], [1, '#ffb24a', 0]])}</defs>`;
    L += `<circle cx="280" cy="372" r="86" fill="url(#${u}dg)"/>`;
    L += `<rect x="258" y="340" width="44" height="60" fill="#ffc46a" opacity=".55"/>`;
    L += `<path d="M280,400 V386 M273,386 H287" stroke="#8a6a1c" stroke-width="2"/><path d="M280,384 q-3,-4.6 0,-10 q3,5.4 0,10 z" fill="#fff1b8"/>`;
    const diya = (x, y) => `<circle cx="${x}" cy="${y - 4}" r="11" fill="url(#${u}lg)"/><path d="M${x - 3.6},${y} Q${x},${y + 3.2} ${x + 3.6},${y} Z" fill="#9a5a2a"/><path d="M${x},${y - 0.6} q-1.9,-2.8 0,-6.4 q1.9,3.6 0,6.4 z" fill="#ffd96e"/>`;
    [132, 158, 196, 234, 326, 364, 402, 428].forEach((x) => { L += diya(x, 400); });
    [[246, 442], [262, 442], [298, 442], [314, 442], [234, 451], [326, 451], [224, 460], [336, 460]].forEach(([x, y]) => { L += diya(x, y); });
    [160, 400].forEach((x) => {
      L += `<path d="M${x},319 V336" stroke="#7a5a1c" stroke-width="1"/><circle cx="${x}" cy="342" r="18" fill="url(#${u}lg)"/><path d="M${x - 5},338 h10 l-2,6 h-6 z" fill="#b38626"/><path d="M${x},338 q-1.6,-2.6 0,-5.6 q1.6,3 0,5.6 z" fill="#fff1b8"/>`;
    });
    return packK(W, H, s, L);
  };

  /* A 1990s Navi Mumbai (Nerul) housing block: five storeys, balconies,
     a black water tank on the roof, a compound wall and a green gate.
     Anchors: "their first home" is the 2nd-floor left window, centre
     (152, 260); the gate spans x 252-328; ground at y = 470. */
  K.apartments = function () {
    const W = 420, H = 470, u = 'ka' + (++kuid);
    const r = rng(1998);
    let s = `<defs>${lg(u + 'f', [[0, '#f3e8cf'], [1, '#e5d4b1']])}${lg(u + 'g', [[0, '#62717c'], [1, '#46525c']])}</defs>`;
    // roof: stair head-room, water tank, TV antenna
    s += `<rect x="182" y="36" width="56" height="46" fill="#e6d6b4"/><rect x="178" y="32" width="64" height="6" fill="#d6c5a0"/><rect x="200" y="52" width="16" height="30" fill="#8a7a62"/>`;
    s += `<rect x="192" y="8" width="36" height="25" rx="5" fill="#2a2a2d"/><ellipse cx="210" cy="9" rx="17" ry="3.4" fill="#3b3b40"/>`;
    s += `<path d="M193,16 H227 M193,22 H227 M193,28 H227" stroke="#404046" stroke-width="1.4"/><rect x="198" y="10" width="4" height="22" fill="#fff" opacity=".08"/>`;
    s += `<path d="M330,82 V20" stroke="#55555a" stroke-width="1.8"/><path d="M319,26 H341 M321,33 H339 M323,40 H337" stroke="#55555a" stroke-width="1.4"/><path d="M330,40 Q312,62 300,82" stroke="#4a4a4f" stroke-width=".8" fill="none"/>`;
    // the block and its parapet
    s += `<rect x="50" y="80" width="320" height="362" fill="url(#${u}f)"/>`;
    s += `<rect x="46" y="68" width="328" height="14" fill="#ecdebf"/><rect x="46" y="66" width="328" height="3.4" fill="#d6c49e"/>`;
    let lightsList = [];
    for (let k = 0; k < 5; k++) {
      const y = 82 + k * 72;
      s += `<rect x="46" y="${y - 2}" width="328" height="7" fill="#e2d1ad"/><rect x="50" y="${y + 5}" width="320" height="3" fill="#e8b48f" opacity=".8"/>`;
      // the stairwell jaali
      s += `<rect x="190" y="${y + 8}" width="40" height="64" fill="#ebdfc3"/><rect x="198" y="${y + 20}" width="24" height="36" fill="#b3a68c"/>`;
      for (let jy = y + 23; jy < y + 54; jy += 6) for (let jx = 201; jx < 220; jx += 6) s += `<rect x="${jx}" y="${jy}" width="3.4" height="3.4" fill="#7e735f"/>`;
      lightsList.push({ x: 198, y: y + 20, w: 24, h: 36, kind: 'jaali' });
      [[64, 136], [294, 252]].forEach(([bx, wx], side) => {
        // balcony: recess, door, railing, a plant or the washing
        s += `<rect x="${bx}" y="${y + 14}" width="62" height="52" fill="#c9b796"/>`;
        s += `<rect x="${bx + 18}" y="${y + 20}" width="26" height="46" fill="url(#${u}g)"/><path d="M${bx + 31},${y + 20} V${y + 66}" stroke="#8b979f" stroke-width="1"/>`;
        if (k < 4) {
          if (r() < 0.55) {
            const lc = ['#d9534f', '#3f7fbf', '#f2c14e', '#7fb069', '#e8e1d5'];
            s += `<path d="M${bx + 3},${y + 18} H${bx + 59}" stroke="#77736b" stroke-width=".8"/>`;
            for (let c = 0; c < 4; c++) s += `<rect x="${bx + 6 + c * 13 + r() * 3}" y="${y + 18}" width="${7 + r() * 3}" height="${10 + r() * 8}" fill="${lc[Math.floor(r() * lc.length)]}"/>`;
          }
          if (r() < 0.6) s += `<rect x="${bx + (side ? 46 : 4)}" y="${y + 36}" width="10" height="7" fill="#b5653d"/><circle cx="${bx + (side ? 51 : 9)}" cy="${y + 33}" r="6.5" fill="#4f8a3c"/><circle cx="${bx + (side ? 48 : 6)}" cy="${y + 35}" r="4" fill="#5f9a46"/>`;
        }
        s += `<rect x="${bx - 2}" y="${y + 42}" width="66" height="3" fill="#5e5e62"/><rect x="${bx - 2}" y="${y + 63}" width="66" height="3" fill="#5e5e62"/>`;
        let bars = '';
        for (let x = bx + 2; x < bx + 62; x += 6) bars += `M${x},${y + 45} V${y + 63} `;
        s += `<path d="${bars}" stroke="#6d6d72" stroke-width="1.2"/>`;
        lightsList.push({ x: bx + 18, y: y + 20, w: 26, h: 22, kind: 'door', k });
        // window with grille and a sunshade
        s += `<rect x="${wx - 2}" y="${y + 16}" width="36" height="36" fill="#d8c7a2"/><rect x="${wx}" y="${y + 18}" width="32" height="32" fill="url(#${u}g)"/>`;
        s += `<path d="M${wx + 8},${y + 18} V${y + 50} M${wx + 16},${y + 18} V${y + 50} M${wx + 24},${y + 18} V${y + 50} M${wx},${y + 29} H${wx + 32} M${wx},${y + 40} H${wx + 32}" stroke="#efe6d2" stroke-width=".9"/>`;
        s += `<rect x="${wx - 5}" y="${y + 11}" width="42" height="5" fill="#d6c6a3"/><rect x="${wx - 3}" y="${y + 16}" width="38" height="3" fill="#000" opacity=".08"/>`;
        lightsList.push({ x: wx, y: y + 18, w: 32, h: 32, kind: 'win', k, side });
        // monsoon streaks under the sill and the balcony
        s += `<rect x="${wx + 4 + r() * 20}" y="${y + 52}" width="${3 + r() * 4}" height="${14 + r() * 18}" fill="#6b5a45" opacity="${(0.07 + r() * 0.08).toFixed(2)}"/>`;
        s += `<rect x="${bx + 8 + r() * 40}" y="${y + 66}" width="${3 + r() * 5}" height="${12 + r() * 14}" fill="#6b5a45" opacity="${(0.06 + r() * 0.08).toFixed(2)}"/>`;
      });
    }
    // compound wall, posts and the green gate
    s += `<rect x="0" y="428" width="420" height="42" fill="#e9ddc4"/><rect x="0" y="424" width="420" height="6" fill="#c9bda5"/>`;
    [0, 72, 144, 362].forEach((x) => { s += `<rect x="${x}" y="418" width="14" height="52" fill="#dccfb3"/><rect x="${x - 2}" y="414" width="18" height="5" fill="#c4b79b"/>`; });
    s += `<rect x="0" y="458" width="420" height="12" fill="#8a7a62" opacity=".16"/>`;
    s += `<rect x="252" y="428" width="76" height="42" fill="#c9b796"/>`;
    s += `<rect x="242" y="410" width="11" height="60" fill="#d8cbb0"/><rect x="327" y="410" width="11" height="60" fill="#d8cbb0"/>`;
    s += `<circle cx="247.5" cy="405" r="4.6" fill="#f3ecd6"/><circle cx="332.5" cy="405" r="4.6" fill="#f3ecd6"/>`;
    let grille = '';
    for (let x = 258; x < 326; x += 6) grille += `M${x},434 V468 `;
    s += `<rect x="254" y="432" width="72" height="37" fill="none" stroke="#3f6a5e" stroke-width="2.6"/><path d="${grille}" stroke="#3f6a5e" stroke-width="1.4"/><path d="M254,450 H326 M290,432 V469" stroke="#3f6a5e" stroke-width="2"/>`;
    for (let x = 258; x < 326; x += 6) s += `<path d="M${x - 1.6},434 L${x},429.6 L${x + 1.6},434 Z" fill="#3f6a5e"/>`;

    // lights for dusk: some windows lit, one brighter and warmer (their first home)
    let L = `<defs>${rg(u + 'wg', [[0, '#ffcf7a', 0.55], [1, '#ffcf7a', 0]])}${rg(u + 'hg', [[0, '#ffc35e', 0.85], [0.5, '#ffb04a', 0.35], [1, '#ff9a3a', 0]])}</defs>`;
    lightsList.forEach((o) => {
      if (o.kind === 'win' && o.k === 2 && o.side === 0) return;
      if (o.kind === 'jaali') { L += `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" fill="#ffd894" opacity=".38"/>`; return; }
      if (r() < 0.55) {
        L += `<ellipse cx="${o.x + o.w / 2}" cy="${o.y + o.h / 2}" rx="${o.w * 0.95}" ry="${o.h * 0.9}" fill="url(#${u}wg)"/>`;
        L += `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" fill="#ffd894" opacity=".9"/>`;
        if (o.kind === 'win') L += `<path d="M${o.x + 8},${o.y} V${o.y + o.h} M${o.x + 16},${o.y} V${o.y + o.h} M${o.x + 24},${o.y} V${o.y + o.h} M${o.x},${o.y + 11} H${o.x + o.w} M${o.x},${o.y + 22} H${o.x + o.w}" stroke="#c99a52" stroke-width=".9" opacity=".7"/>`;
      }
    });
    L += `<circle cx="152" cy="260" r="62" fill="url(#${u}hg)"/>`;
    L += `<rect x="136" y="244" width="32" height="32" fill="#ffc560"/><rect x="136" y="244" width="32" height="32" fill="#fff0c4" opacity=".35"/>`;
    L += `<path d="M144,244 V276 M152,244 V276 M160,244 V276 M136,255 H168 M136,266 H168" stroke="#b9853f" stroke-width=".9" opacity=".75"/>`;
    L += `<circle cx="247.5" cy="405" r="16" fill="url(#${u}wg)"/><circle cx="332.5" cy="405" r="16" fill="url(#${u}wg)"/><circle cx="247.5" cy="405" r="4.6" fill="#fff4cf"/><circle cx="332.5" cy="405" r="4.6" fill="#fff4cf"/>`;
    return packK(W, H, s, L);
  };

  window.ArtKarnataka = K;
})();

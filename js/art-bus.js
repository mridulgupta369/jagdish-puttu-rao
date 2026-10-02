/* ==========================================================================
   THE BUS OUT OF THE VILLAGE
   A coastal-Karnataka private bus bound for Bombay. It drives in from the
   right (nose on the left) and stops with its middle window at the centre
   of the screen. That window is a real hole in the body (evenodd), so the
   next city can show through it during the "portal" dive, exactly like the
   train in the sample site.

   ArtBus.big() → { svg, w, h, px, py } where px/py is the centre of the
   portal window in viewBox units (main.js writes them to --portal-x/-y).
   Classes main.js relies on: .portal-win (glass that fades first),
   .portal-bars (window frame that fades next).
   ========================================================================== */
(function () {
  'use strict';

  const f = (n) => Math.round(n * 10) / 10;

  function big() {
    const W = 880, H = 300;
    const winY = 96, winH = 64, winW = 78, gap = 10, win0 = 156;
    const portalIdx = 3;
    const px = win0 + portalIdx * (winW + gap);           // portal window left
    let s = '';

    s += `<defs>
      <linearGradient id="bus-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf3e2"/><stop offset=".55" stop-color="#f1e4c8"/><stop offset="1" stop-color="#dcc9a6"/></linearGradient>
      <linearGradient id="bus-glass" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#3d6470"/><stop offset=".6" stop-color="#29454f"/><stop offset="1" stop-color="#1d343c"/></linearGradient>
      <linearGradient id="bus-shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    </defs>`;

    /* ground shadow */
    s += `<ellipse cx="${W / 2}" cy="${H - 14}" rx="${W * 0.47}" ry="10" fill="#000" opacity=".22"/>`;

    /* roof rack and luggage */
    s += `<path d="M190,64 H770 M190,48 H770" stroke="#5b4636" stroke-width="5" stroke-linecap="round"/>`;
    for (let x = 200; x <= 760; x += 40) s += `<path d="M${x},48 V70" stroke="#5b4636" stroke-width="4"/>`;
    s += `<rect x="236" y="22" width="92" height="40" rx="4" fill="#6b4a33"/><rect x="236" y="22" width="92" height="9" rx="3" fill="#7d5a40"/><rect x="276" y="30" width="12" height="6" fill="#d6a84b"/>`;
    s += `<rect x="342" y="34" width="70" height="28" rx="12" fill="#2f6b5a"/><path d="M352,34 V62 M368,34 V62 M384,34 V62 M400,34 V62" stroke="#e7d6a8" stroke-width="3" opacity=".75"/>`;
    s += `<path d="M430,62 q4,-30 30,-30 h36 q26,0 30,30 z" fill="#b8402f"/><path d="M462,32 q16,-16 32,0" stroke="#5a2a20" stroke-width="4" fill="none"/>`;
    s += `<rect x="560" y="30" width="110" height="32" rx="4" fill="#8f7a5c"/><path d="M560,40 H670 M560,52 H670" stroke="#6f5d45" stroke-width="2.5"/>`;
    s += `<path d="M690,62 q6,-22 26,-22 q20,0 26,22 z" fill="#c9973a"/>`;

    /* body (evenodd hole for the portal window) */
    const hole = ` M${px},${winY} h${winW} v${winH} h-${winW} Z`;
    s += `<path fill-rule="evenodd" d="M58,250 L40,246 Q26,242 26,226 L26,120 Q26,82 60,74 L120,70 H836 Q858,70 858,92 V238 Q858,250 846,250 Z${hole}" fill="url(#bus-body)"/>`;
    /* roof cap */
    s += `<path d="M60,74 L120,70 H836 Q858,70 858,92 H32 Q38,78 60,74 Z" fill="#e8d7b4"/>`;
    /* livery: red band, blue pinstripe, a swoosh */
    s += `<path d="M26,176 H858 V196 H26 Z" fill="#c8302c"/><path d="M26,200 H858 V207 H26 Z" fill="#2c5aa0"/>`;
    s += `<path d="M560,176 C640,140 740,150 858,120 V140 C760,166 660,170 600,196 Z" fill="#c8302c" opacity=".9"/>`;
    s += `<path d="M26,214 H858" stroke="#c9b48c" stroke-width="2"/>`;

    /* windscreen and route board */
    s += `<path d="M34,92 Q36,84 50,82 L116,80 L116,168 L30,168 Z" fill="url(#bus-glass)"/>`;
    s += `<path d="M44,90 L70,160 M64,86 L92,160" stroke="#fff" stroke-opacity=".14" stroke-width="7"/>`;
    s += `<rect x="40" y="56" width="132" height="22" rx="3" fill="#171512"/><text x="106" y="72" text-anchor="middle" font-family="Jost, Segoe UI, sans-serif" font-weight="600" font-size="14" letter-spacing="3.2" fill="#ffb84a">BOMBAY</text>`;
    s += `<path d="M44,168 L60,140" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>`;

    /* folding door */
    s += `<rect x="120" y="92" width="30" height="146" rx="3" fill="url(#bus-glass)"/><path d="M135,94 V236 M120,164 H150" stroke="#cbb892" stroke-width="2.5"/>`;

    /* side windows, a few passengers, the portal window */
    for (let i = 0; i < 7; i++) {
      const x = win0 + i * (winW + gap);
      const isPortal = i === portalIdx;
      if (!isPortal) {
        s += `<rect x="${x}" y="${winY}" width="${winW}" height="${winH}" rx="6" fill="url(#bus-glass)"/>`;
        if (i % 2 === 0 || i === 5) {
          const hx = x + 22 + (i * 13) % 34;
          s += `<circle cx="${hx}" cy="${winY + 30}" r="10" fill="#14252b" opacity=".75"/><path d="M${hx - 16},${winY + winH} q16,-26 32,0 z" fill="#14252b" opacity=".75"/>`;
        }
        s += `<path d="M${x + 8},${winY + winH - 6} L${x + 30},${winY + 6}" stroke="#fff" stroke-opacity=".12" stroke-width="10"/>`;
        s += `<path d="M${x},${winY + winH / 2} H${x + winW}" stroke="#cbb892" stroke-width="3"/>`;
      } else {
        s += `<rect class="portal-win" x="${x}" y="${winY}" width="${winW}" height="${winH}" rx="6" fill="#ffe2b0"/>`;
        s += `<path class="portal-bars" d="M${x},${winY + winH / 2} H${x + winW} M${x + winW / 2},${winY} V${winY + winH}" stroke="#cbb892" stroke-width="3"/>`;
      }
      s += `<rect x="${x - 1.5}" y="${winY - 1.5}" width="${winW + 3}" height="${winH + 3}" rx="7" fill="none" stroke="#b9a37c" stroke-width="3"/>`;
    }

    /* lower panels, bumper, lights */
    s += `<rect x="26" y="226" width="34" height="16" rx="4" fill="#3a3a3a"/>`;
    s += `<circle cx="42" cy="200" r="9" fill="#fff4cf"/><circle cx="42" cy="200" r="20" fill="#fff4cf" opacity=".18"/>`;
    s += `<rect x="30" y="182" width="22" height="8" rx="3" fill="#f2a33a"/>`;
    s += `<rect x="846" y="110" width="8" height="40" rx="2" fill="#d6413a"/>`;
    s += `<path d="M846,92 V170 M836,92 V170" stroke="#5b4636" stroke-width="3"/>`;
    for (let y = 100; y < 170; y += 14) s += `<path d="M836,${y} H846" stroke="#5b4636" stroke-width="3"/>`;

    /* wheels */
    const wheel = (cx) => {
      let spokes = '';
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; spokes += `M${f(cx + Math.cos(a) * 8)},${f(252 + Math.sin(a) * 8)} L${f(cx + Math.cos(a) * 17)},${f(252 + Math.sin(a) * 17)} `; }
      return `<path d="M${cx - 46},250 a46,46 0 0 1 92,0 z" fill="#3b3430"/>` +
        `<g class="wheel"><circle cx="${cx}" cy="252" r="34" fill="#1d1b1a"/><circle cx="${cx}" cy="252" r="20" fill="#8d8a86"/><path d="${spokes}" stroke="#5a5753" stroke-width="4"/><circle cx="${cx}" cy="252" r="6" fill="#d8d4cc"/></g>`;
    };
    s += wheel(200) + wheel(720);

    /* body shine */
    s += `<rect x="26" y="74" width="832" height="16" fill="url(#bus-shine)" opacity=".7"/>`;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">${s}</svg>`;
    return { svg, w: W, h: H, px: px + winW / 2, py: winY + winH / 2 };
  }

  window.ArtBus = { big };
})();

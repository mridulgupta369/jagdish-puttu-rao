/* ==========================================================================
   Postcard art: the "photo" inside each travel polaroid.
   Every function returns an SVG string (viewBox 0 0 240 240) drawn edge to
   edge; the white polaroid frame and handwritten caption live in HTML/CSS.
   All ids are prefixed per card (pc-<name>-...) so many cards can share one
   document. Swap any card for a real photo later via story data.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- tiny helpers ---------- */
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function f(n) { return Math.round(n * 10) / 10; }

  function stops(list) {
    var s = '';
    for (var i = 0; i < list.length; i++) {
      var st = list[i];
      s += '<stop offset="' + st[0] + '" stop-color="' + st[1] + '"' +
        (st[2] != null ? ' stop-opacity="' + st[2] + '"' : '') + '/>';
    }
    return s;
  }
  function lin(id, list, v) {
    v = v || [0, 0, 0, 1];
    return '<linearGradient id="' + id + '" x1="' + v[0] + '" y1="' + v[1] + '" x2="' + v[2] + '" y2="' + v[3] + '">' +
      stops(list) + '</linearGradient>';
  }
  function rad(id, list, c) {
    c = c || [0.5, 0.5, 0.5];
    return '<radialGradient id="' + id + '" cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '">' +
      stops(list) + '</radialGradient>';
  }
  function glow(id, color, strength) {
    return rad(id, [[0, color, strength], [0.45, color, strength * 0.35], [1, color, 0]]);
  }
  function wrap(name, defs, body, vig) {
    var vid = 'pc-' + name + '-vig';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' +
      '<defs>' + defs + rad(vid, [[0.55, vig, 0], [1, vig, 0.3]], [0.5, 0.46, 0.75]) + '</defs>' +
      body + '<rect width="240" height="240" fill="url(#' + vid + ')"/></svg>';
  }
  /* row of flat-topped blocks (distant skylines) */
  function blocks(R, x0, x1, base, hMin, hMax, wMin, wMax) {
    var d = 'M' + x0 + ' ' + base, x = x0;
    while (x < x1) {
      var w = wMin + R() * (wMax - wMin), top = base - (hMin + R() * (hMax - hMin));
      d += 'L' + f(x) + ' ' + f(top) + 'L' + f(x + w) + ' ' + f(top);
      x += w;
    }
    return d + 'L' + f(x) + ' ' + base + 'Z';
  }
  /* sparse lit windows */
  function lights(R, x0, x1, y0, y1, color, density, op, w, h) {
    var s = '';
    w = w || 1.3; h = h || 1.8;
    for (var y = y0; y < y1; y += h + 2.2) {
      for (var x = x0; x < x1; x += w + 1.6) {
        if (R() < density) {
          s += '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + w + '" height="' + h + '" fill="' + color +
            '" opacity="' + f(op * (0.45 + R() * 0.55)) + '"/>';
        }
      }
    }
    return s;
  }
  /* horizontal glints on water */
  function glints(R, n, x0, x1, y0, y1, color, op) {
    var s = '';
    for (var i = 0; i < n; i++) {
      var w = 3 + R() * 9, x = x0 + R() * (x1 - x0 - w), y = y0 + R() * (y1 - y0);
      s += '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="0.9" rx="0.45" fill="' + color +
        '" opacity="' + f(op * (0.4 + R() * 0.6)) + '"/>';
    }
    return s;
  }
  function birds(list, color) {
    var s = '<g fill="none" stroke="' + color + '" stroke-width="1" stroke-linecap="round">';
    for (var i = 0; i < list.length; i++) {
      var b = list[i], k = b[2] || 1;
      s += '<path d="M' + b[0] + ' ' + b[1] + 'q' + f(2.6 * k) + ' ' + f(-2.2 * k) + ' ' + f(5.2 * k) + ' 0q' +
        f(2.6 * k) + ' ' + f(-2.2 * k) + ' ' + f(5.2 * k) + ' 0"/>';
    }
    return s + '</g>';
  }
  function reflection(R, cx, y0, y1, widths, color, op) {
    var s = '', step = (y1 - y0) / widths.length;
    for (var i = 0; i < widths.length; i++) {
      var w = widths[i], y = y0 + i * step + R() * 1.5;
      s += '<rect x="' + f(cx - w / 2 + (R() - 0.5) * 3) + '" y="' + f(y) + '" width="' + f(w) + '" height="1.3" rx="0.65" fill="' +
        color + '" opacity="' + f(op * (1 - i / (widths.length + 2))) + '"/>';
    }
    return s;
  }

  /* ======================================================================
     PARIS 2002: the tower at dusk, rose and peach, the Seine below
     ====================================================================== */
  function paris() {
    var n = 'paris', R = rng(2002), id = function (s) { return 'pc-paris-' + s; };
    var defs =
      lin(id('sky'), [[0, '#de97a2'], [0.4, '#eeb3a5'], [0.75, '#f8d2b3'], [1, '#fde4c4']]) +
      glow(id('sun'), '#fff2d8', 0.95) +
      lin(id('river'), [[0, '#e8ae9f'], [1, '#c0838c']]) +
      lin(id('tower'), [[0, '#6c4462'], [1, '#4a2e48']]);

    // far Haussmann rooftops with mansards and chimneys
    var d = 'M0 210L0 180', x = 0, chim = '';
    while (x < 240) {
      var w = 11 + R() * 13, top = 171 + R() * 11;
      d += 'L' + f(x) + ' ' + f(top + 4) + 'L' + f(x + 2.5) + ' ' + f(top) + 'L' + f(x + w - 2.5) + ' ' + f(top) + 'L' + f(x + w) + ' ' + f(top + 4);
      if (R() < 0.7) chim += '<rect x="' + f(x + 3 + R() * (w - 8)) + '" y="' + f(top - 3.5) + '" width="2.2" height="4" fill="#d29a9b"/>';
      x += w;
    }
    d += 'L240 210Z';

    var tower =
      '<path d="M149.3 17h1.4v14h-1.4z"/>' +
      '<path d="M147.6 30.5h4.8v3.2h-4.8z"/>' +
      '<path d="M148.3 33.5Q147.6 84 142.4 103.5L157.6 103.5Q152.4 84 151.7 33.5Z"/>' +
      '<path d="M138.6 102h22.8v4.8h-22.8z"/>' +
      '<path d="M141.4 106.6Q140.4 132 130.6 147.5L169.4 147.5Q159.6 132 158.6 106.6Z"/>' +
      '<path d="M122.5 145.6h55v6.8h-55z"/>' +
      '<path d="M126.2 152.2Q118.6 182 100.6 204L121.4 204C124 186 136 172.4 150 172.4C164 172.4 176 186 178.6 204L199.4 204Q181.4 182 173.8 152.2Z"/>';
    var lattice = '';
    for (var i = 0; i < 6; i++) { // cross bracing, clipped to the silhouette
      var y = 110 + i * 6.5;
      lattice += '<path d="M128 ' + f(y) + 'L172 ' + f(y + 6.5) + 'M172 ' + f(y) + 'L128 ' + f(y + 6.5) + '"/>';
    }
    for (i = 0; i < 5; i++) {
      var y2 = 154 + i * 9.5;
      lattice += '<path d="M100 ' + f(y2) + 'L200 ' + f(y2 + 9.5) + 'M200 ' + f(y2) + 'L100 ' + f(y2 + 9.5) + '"/>';
    }
    for (i = 0; i < 9; i++) {
      var y3 = 36 + i * 7.5;
      lattice += '<path d="M140 ' + f(y3) + 'L160 ' + f(y3 + 7.5) + 'M160 ' + f(y3) + 'L140 ' + f(y3 + 7.5) + '"/>';
    }
    defs += '<clipPath id="' + id('clip') + '">' + tower + '</clipPath>';

    var trees = '';
    for (x = -6; x < 246; x += 8 + R() * 6) {
      var r = 5 + R() * 4.5;
      trees += '<circle cx="' + f(x) + '" cy="' + f(203 - r * 0.45) + '" r="' + f(r) + '"/>';
    }

    var body =
      '<rect width="240" height="240" fill="url(#' + id('sky') + ')"/>' +
      '<g fill="#fde3d3">' +
      '<rect x="96" y="56" width="126" height="3" rx="1.5" opacity=".55"/>' +
      '<rect x="136" y="64" width="98" height="2" rx="1" opacity=".42"/>' +
      '<rect x="8" y="90" width="82" height="2.4" rx="1.2" opacity=".38"/>' +
      '<rect x="30" y="97" width="46" height="1.6" rx=".8" opacity=".3"/></g>' +
      '<circle cx="64" cy="158" r="62" fill="url(#' + id('sun') + ')"/>' +
      '<circle cx="64" cy="158" r="16.5" fill="#fff3dc"/>' +
      birds([[30, 74, 0.9], [44, 66, 0.7], [208, 98, 0.8]], '#9a6478') +
      // Les Invalides dome, gilded in the haze
      '<g fill="#d79f9d"><rect x="20" y="160" width="20" height="14"/><path d="M19 161Q30 136 41 161Z" fill="#e2ac94"/>' +
      '<rect x="28.8" y="140" width="2.4" height="8"/><path d="M30 128L31 140H29Z"/></g>' +
      '<path d="' + d + '" fill="#d7a09f"/>' + chim +
      '<g fill="url(#' + id('tower') + ')">' + tower + '</g>' +
      '<g clip-path="url(#' + id('clip') + ')" stroke="#a2708a" stroke-width=".55" opacity=".55" fill="none">' + lattice + '</g>' +
      '<g fill="#8b586c">' + trees + '</g>' +
      '<rect x="0" y="203.5" width="240" height="6" fill="#ad7584"/>' +
      '<rect x="0" y="203.5" width="240" height="1" fill="#dba3a2"/>' +
      '<rect x="0" y="209.5" width="240" height="31" fill="url(#' + id('river') + ')"/>' +
      reflection(R, 64, 212, 238, [26, 20, 15, 11, 8, 5], '#fff0d8', 0.85) +
      reflection(R, 150, 213, 232, [8, 12, 6, 4], '#5c3a55', 0.35) +
      // bateau-mouche
      '<g><path d="M92 224.5H130L126.5 228.4H95.5Z" fill="#5a3853"/><rect x="98" y="220.6" width="25" height="4" rx="1" fill="#79506a"/>' +
      '<g fill="#ffe7c4" opacity=".9"><rect x="100" y="221.8" width="2" height="1.4"/><rect x="104" y="221.8" width="2" height="1.4"/><rect x="108" y="221.8" width="2" height="1.4"/><rect x="112" y="221.8" width="2" height="1.4"/><rect x="116" y="221.8" width="2" height="1.4"/><rect x="120" y="221.8" width="2" height="1.4"/></g></g>' +
      glints(R, 14, 4, 236, 214, 238, '#f6cfc0', 0.5);
    return wrap(n, defs, body, '#5a2a40');
  }

  /* ======================================================================
     LONDON 2005: Westminster on a misty morning, a red bus on the bridge
     ====================================================================== */
  function london() {
    var n = 'london', R = rng(2005), id = function (s) { return 'pc-london-' + s; };
    var defs =
      lin(id('sky'), [[0, '#adbccb'], [0.55, '#cdd6de'], [1, '#e7e9e6']]) +
      glow(id('sun'), '#fbf8ef', 0.9) +
      lin(id('river'), [[0, '#a2b1be'], [1, '#7f92a3']]) +
      lin(id('mist'), [[0, '#eef0ee', 0], [0.5, '#eef0ee', 0.55], [1, '#eef0ee', 0]]);

    // London Eye, far and faint
    var eye = '<g stroke="#a3b1be" fill="none"><circle cx="40" cy="128" r="35" stroke-width="1.6"/><circle cx="40" cy="128" r="32" stroke-width=".6"/>';
    for (var a = 0; a < 16; a++) {
      var ang = a / 16 * Math.PI * 2;
      eye += '<path stroke-width=".45" d="M40 128L' + f(40 + Math.cos(ang) * 32) + ' ' + f(128 + Math.sin(ang) * 32) + '"/>';
    }
    eye += '<path stroke-width="1.6" d="M40 128L28 180M40 128L52 180"/></g><g fill="#a3b1be">';
    for (a = 0; a < 16; a++) {
      var ang2 = a / 16 * Math.PI * 2 + 0.1;
      eye += '<ellipse cx="' + f(40 + Math.cos(ang2) * 36.5) + '" cy="' + f(128 + Math.sin(ang2) * 36.5) + '" rx="1.9" ry="1.3"/>';
    }
    eye += '<circle cx="40" cy="128" r="2.2"/></g>';

    // Palace of Westminster
    var spikes = '';
    for (var x = 40; x < 164; x += 5.2) {
      var h = 3 + (Math.round(x) % 3) * 1.4;
      spikes += 'M' + f(x) + ' 157L' + f(x + 1.2) + ' ' + f(157 - h) + 'L' + f(x + 2.4) + ' 157Z';
    }
    var gothic = '';
    for (x = 42; x < 162; x += 5.2) gothic += 'M' + f(x + 1.2) + ' 163V185';
    var palace =
      '<g fill="#8794a1">' +
      '<rect x="-2" y="156" width="168" height="36"/>' +
      '<path d="' + spikes + '"/>' +
      '<rect x="13" y="92" width="24" height="100"/>' +
      '<path d="M12 92h3v-8h-3zM35 92h3v-8h-3zM24.4 92V71h1.2v21z"/><path d="M25.6 71.5h6v3.4h-6z"/>' +
      '<rect x="89" y="128" width="14" height="30"/><path d="M88 128.5L96 99L104 128.5Z"/>' +
      '</g>' +
      '<path d="' + gothic + '" stroke="#9aa6b2" stroke-width=".7" fill="none"/>' +
      '<path d="M17 100V186M21 100V186M25 100V186M29 100V186M33 100V186" stroke="#97a3af" stroke-width=".6" fill="none"/>';

    // Elizabeth Tower (Big Ben)
    var tower =
      '<g fill="#66737f">' +
      '<rect x="167" y="95" width="18" height="102"/>' +
      '<rect x="165" y="67" width="22" height="29"/>' +
      '<rect x="167" y="55" width="18" height="13"/>' +
      '<path d="M165 56L187 56L182.5 46L176 21L169.5 46Z"/>' +
      '<path d="M164.6 56L165.6 47L166.6 56ZM185.4 56L186.4 47L187.4 56Z"/>' +
      '<path d="M175.4 21h1.2v-6h-1.2z"/>' +
      '</g>' +
      '<path d="M171 100V192M176 100V192M181 100V192" stroke="#76838e" stroke-width=".7"/>' +
      '<g fill="#4d5862"><path d="M170 67.5v-6.5a1.5 1.5 0 0 1 3 0v6.5zM174.5 67.5v-6.5a1.5 1.5 0 0 1 3 0v6.5zM179 67.5v-6.5a1.5 1.5 0 0 1 3 0v6.5z"/></g>' +
      '<circle cx="176" cy="81" r="8.3" fill="#efebe0"/>' +
      '<circle cx="176" cy="81" r="8.3" fill="none" stroke="#56626d" stroke-width=".9"/>' +
      '<path d="M176 81V75.6M176 81L180 82.6" stroke="#3b444d" stroke-width="1" stroke-linecap="round"/>';

    // Westminster Bridge
    var arches = 'M-4 199H244V214', c;
    for (c = 240; c >= 0; c -= 32) arches += 'L' + (c + 13) + ' 214A13 11 0 0 0 ' + (c - 13) + ' 214';
    arches += 'L-4 214Z';
    var lamps = '';
    for (x = 12; x < 240; x += 26) lamps += '<path d="M' + x + ' 194V185.5" stroke="#4f5c69" stroke-width="1"/><circle cx="' + x + '" cy="185" r="1.3" fill="#4f5c69"/>';
    var bus =
      '<g><rect x="58" y="181.5" width="22" height="13" rx="1.6" fill="#c6443a"/>' +
      '<rect x="59.6" y="183.2" width="18.8" height="2.6" rx=".6" fill="#f3d8d1"/>' +
      '<rect x="59.6" y="188.4" width="18.8" height="2.5" rx=".6" fill="#f3d8d1"/>' +
      '<rect x="58" y="186.6" width="22" height="1" fill="#a3352d"/>' +
      '<circle cx="62.6" cy="194.6" r="1.7" fill="#2a3038"/><circle cx="75.4" cy="194.6" r="1.7" fill="#2a3038"/></g>';

    var body =
      '<rect width="240" height="240" fill="url(#' + id('sky') + ')"/>' +
      '<circle cx="56" cy="64" r="48" fill="url(#' + id('sun') + ')"/>' +
      '<circle cx="56" cy="64" r="14" fill="#f8f5ec" opacity=".92"/>' +
      eye +
      '<path d="' + blocks(R, 186, 244, 182, 6, 22, 6, 12) + '" fill="#b5c0ca"/>' +
      palace + tower +
      '<rect x="0" y="170" width="240" height="30" fill="url(#' + id('mist') + ')"/>' +
      '<rect x="0" y="199" width="240" height="41" fill="url(#' + id('river') + ')"/>' +
      '<rect x="-2" y="193" width="244" height="1.2" fill="#6f7d8a"/>' +
      lamps +
      '<path d="' + arches + '" fill="#53606d"/>' +
      bus +
      glints(R, 18, 2, 238, 217, 238, '#d3dde5', 0.7) +
      birds([[118, 54, 0.8], [130, 48, 0.65]], '#7d8a96');
    return wrap(n, defs, body, '#33404e');
  }

  /* ======================================================================
     SINGAPORE 2009: Marina Bay Sands on a teal night, warm windows,
     the bay holding every light twice
     ====================================================================== */
  function singapore() {
    var n = 'singapore', R = rng(2009), id = function (s) { return 'pc-singapore-' + s; };
    var defs =
      lin(id('sky'), [[0, '#0b2d37'], [0.5, '#124751'], [0.85, '#24605f'], [1, '#367671']]) +
      lin(id('water'), [[0, '#0f363c'], [1, '#07222a']]) +
      glow(id('city'), '#f2b56b', 0.42) +
      glow(id('moon'), '#f4ecd6', 0.6) +
      lin(id('mbs'), [[0, '#1e4a54'], [1, '#143740']]);

    var stars = '';
    for (var i = 0; i < 22; i++) {
      stars += '<circle cx="' + f(R() * 240) + '" cy="' + f(R() * 110) + '" r="' + f(0.35 + R() * 0.6) + '" fill="#e8f4ef" opacity="' + f(0.3 + R() * 0.5) + '"/>';
    }
    // CBD towers behind, right and left
    var cbdR = blocks(R, 196, 244, 189, 34, 92, 7, 13), cbdL = blocks(R, 72, 112, 189, 20, 54, 7, 12);
    var cbdLights = lights(R, 198, 238, 104, 186, '#ffcf85', 0.16, 0.7) + lights(R, 74, 110, 140, 186, '#ffcf85', 0.14, 0.7);

    // Supertrees: slim trunks flaring into lit, inverted-cone canopies
    defs += lin(id('st'), [[0, '#f0b4e6'], [0.5, '#b07fd0'], [1, '#5d4f9c']]);
    var trees = '<path d="M20 152H56" stroke="#3d7a82" stroke-width="1" opacity=".8"/>',
      trunks = [[20, 128, 1], [38, 112, 1.15], [56, 134, 0.95], [71, 150, 0.8]];
    for (i = 0; i < trunks.length; i++) {
      var tx = trunks[i][0], top = trunks[i][1], s = trunks[i][2], cw = 10 * s, ch = 13 * s;
      trees += '<path d="M' + f(tx - 2) + ' 189L' + f(tx - 1.2) + ' ' + f(top + ch) + 'L' + f(tx + 1.2) + ' ' + f(top + ch) + 'L' + f(tx + 2) + ' 189Z" fill="#2d6873"/>' +
        '<path d="M' + f(tx - 1.4) + ' ' + f(top + ch) + 'L' + f(tx - cw) + ' ' + f(top + 1.4) + 'Q' + tx + ' ' + f(top - 1.6) + ' ' + f(tx + cw) + ' ' + f(top + 1.4) + 'L' + f(tx + 1.4) + ' ' + f(top + ch) + 'Z" fill="url(#' + id('st') + ')" opacity=".92"/>' +
        '<path d="M' + tx + ' ' + f(top + ch) + 'L' + f(tx - cw * 0.55) + ' ' + f(top + 1) + 'M' + tx + ' ' + f(top + ch) + 'L' + tx + ' ' + f(top) + 'M' + tx + ' ' + f(top + ch) + 'L' + f(tx + cw * 0.55) + ' ' + f(top + 1) + '" stroke="#f7cdef" stroke-width=".45" opacity=".55"/>' +
        '<ellipse cx="' + tx + '" cy="' + f(top + 1.2) + '" rx="' + f(cw) + '" ry="1.5" fill="#f9d2f2" opacity=".85"/>';
      for (var k = 0; k < 4; k++) {
        trees += '<circle cx="' + f(tx + (R() - 0.5) * 2) + '" cy="' + f(top + ch + 5 + k * ((189 - top - ch - 8) / 4)) + '" r=".7" fill="#e7a3e0" opacity=".85"/>';
      }
    }

    // Marina Bay Sands
    var mbs = '', wins = '';
    var xs = [118, 145, 172];
    for (i = 0; i < 3; i++) {
      var x0 = xs[i];
      mbs += '<path d="M' + x0 + ' 189L' + x0 + ' 87L' + (x0 + 16) + ' 87L' + (x0 + 16) + ' 150Q' + f(x0 + 16.4) + ' 178 ' + (x0 + 19.5) + ' 189Z"/>';
      for (var y = 91; y < 186; y += 3.3) {
        wins += '<path d="M' + (x0 + 1.4) + ' ' + f(y) + 'H' + (x0 + 14.8) + '" opacity="' + f(0.3 + R() * 0.5) + '"/>';
      }
    }
    var sky =
      '<path d="M107 84.6Q150 80.6 200 81.2L210.5 81.8Q211.6 83.8 209.4 85L107 87.8Z" fill="#21505a"/>' +
      '<path d="M108 84.5Q150 80.5 200 81.1L210 81.7" stroke="#9fdad0" stroke-width=".7" fill="none" opacity=".75"/>' +
      '<g fill="#2f6b5f"><circle cx="122" cy="82.6" r="1.1"/><circle cx="134" cy="82" r="1.2"/><circle cx="158" cy="81.4" r="1.1"/><circle cx="186" cy="81.2" r="1.2"/></g>';
    var mbsGroup = '<g fill="url(#' + id('mbs') + ')">' + mbs + '</g>' +
      '<g stroke="#ffd08a" stroke-width=".9" stroke-dasharray="1.6 1.2" fill="none">' + wins + '</g>' + sky;

    // ArtScience Museum lotus
    var lotus = '<g fill="#e7eee9">';
    var angs = [-58, -36, -14, 8, 30, 52];
    for (i = 0; i < angs.length; i++) {
      lotus += '<ellipse cx="101" cy="' + f(189 - 7.5 - (i % 2) * 1.5) + '" rx="2.6" ry="' + f(7.5 + (i % 2) * 1.5) + '" transform="rotate(' + angs[i] + ' 101 189)" opacity="' + f(0.82 + (i % 2) * 0.15) + '"/>';
    }
    lotus += '</g>';

    var prom = '';
    for (var x = 2; x < 240; x += 6.5) prom += '<circle cx="' + f(x) + '" cy="188.6" r=".75"/>';

    var ripples = '';
    for (y = 192; y < 240; y += 2.6) ripples += '<rect x="0" y="' + f(y) + '" width="240" height="1" fill="#0b2c33" opacity=".55"/>';

    var body =
      '<rect width="240" height="240" fill="url(#' + id('sky') + ')"/>' +
      stars +
      '<circle cx="198" cy="40" r="26" fill="url(#' + id('moon') + ')"/>' +
      '<circle cx="198" cy="40" r="6.5" fill="#f5edd8"/>' +
      '<ellipse cx="150" cy="190" rx="150" ry="58" fill="url(#' + id('city') + ')"/>' +
      '<path d="' + cbdR + '" fill="#184550"/><path d="' + cbdL + '" fill="#184550"/>' + cbdLights +
      trees +
      mbsGroup +
      lotus +
      '<rect x="0" y="188.6" width="240" height="51.4" fill="url(#' + id('water') + ')"/>' +
      '<g transform="matrix(1 0 0 -1 0 378)" opacity=".26">' + mbsGroup + '</g>' +
      '<g fill="#ffd08a" opacity=".45">' +
      '<rect x="121" y="192" width="10" height="44" opacity=".35"/><rect x="148" y="192" width="10" height="44" opacity=".35"/><rect x="175" y="192" width="10" height="44" opacity=".35"/></g>' +
      ripples +
      '<rect x="0" y="188" width="240" height="1.2" fill="#2b5f63"/>' +
      '<g fill="#ffd08a">' + prom + '</g>' +
      glints(R, 16, 2, 238, 194, 238, '#ffd9a0', 0.55);
    return wrap(n, defs, body, '#03141a');
  }

  /* ======================================================================
     NEW YORK 2011: Midtown at golden hour, rooftop water towers
     ====================================================================== */
  function newyork() {
    var n = 'newyork', R = rng(2011), id = function (s) { return 'pc-newyork-' + s; };
    var esb =
      'M103.4 12h1.2v22h-1.2z' +
      'M101.6 52L102.6 33.5H105.4L106.4 52Z' +
      'M99 51.5h10v9h-10z' +
      'M96.4 60h15.2v6.5h-15.2z' +
      'M93 66h22v85h-22z' +
      'M89 150h30v12.5h-30z' +
      'M84 162h40v14.5h-40z' +
      'M78 176h52v30h-52z';
    var defs =
      lin(id('sky'), [[0, '#e5a062'], [0.38, '#f0bd7c'], [0.72, '#f7d7a3'], [1, '#fbe9c6']]) +
      glow(id('sun'), '#fff2d2', 1) +
      '<clipPath id="' + id('esb') + '"><path d="' + esb + '"/></clipPath>';

    function bldg(x, top, w, base, shade, lit, litFrac) {
      return '<rect x="' + x + '" y="' + top + '" width="' + w + '" height="' + (base - top) + '" fill="' + shade + '"/>' +
        '<rect x="' + f(x + w * (1 - litFrac)) + '" y="' + top + '" width="' + f(w * litFrac) + '" height="' + (base - top) + '" fill="' + lit + '"/>';
    }
    var mid =
      bldg(26, 126, 30, 210, '#8c6046', '#b47a51', 0.42) + '<rect x="31" y="118" width="20" height="9" fill="#8c6046"/><rect x="43" y="118" width="8" height="9" fill="#b47a51"/>' +
      bldg(58, 150, 18, 210, '#956748', '#bd8455', 0.4) +
      bldg(134, 138, 32, 210, '#8c6046', '#b47a51', 0.45) + '<rect x="140" y="130" width="20" height="9" fill="#8c6046"/><rect x="151" y="130" width="9" height="9" fill="#b47a51"/>' +
      bldg(206, 116, 36, 210, '#865b43', '#ad744d', 0.4) +
      bldg(-4, 156, 22, 210, '#956748', '#bd8455', 0.35);
    var midLights = lights(R, 28, 54, 132, 204, '#ffdca0', 0.2, 0.8) + lights(R, 136, 164, 144, 204, '#ffdca0', 0.2, 0.8) + lights(R, 208, 240, 122, 204, '#ffdca0', 0.18, 0.8);

    // Chrysler crown, silhouetted against the sun
    var chrysler =
      '<g fill="#c18a5c">' +
      '<rect x="175" y="104" width="14" height="100"/>' +
      '<path d="M175 104.5L175 99Q182 86 189 99L189 104.5Z"/>' +
      '<path d="M177 99L177 93Q182 82 187 93L187 99Z"/>' +
      '<path d="M178.6 93L178.6 88Q182 79 185.4 88L185.4 93Z"/>' +
      '<path d="M180.6 82L182 55L183.4 82Z"/></g>' +
      '<g fill="#f9e3b8" opacity=".85"><path d="M178 101.8l1.4-2.6 1.4 2.6zM181.3 101.8l.7-2.9.7 2.9zM183.8 101.8l1.4-2.6 1.4 2.6zM179.6 95.6l1.2-2.2 1.2 2.2zM182.6 95.6l1.2-2.2 1.2 2.2zM181 90.4l1-1.9 1 1.9z"/></g>';

    // rooftops with cornices and water towers
    var roof = 'M-2 240L-2 214', x = -2;
    while (x < 242) {
      var w = 18 + R() * 16, top = 206 + R() * 9;
      roof += 'L' + f(x) + ' ' + f(top + 2) + 'L' + f(x - 1.2) + ' ' + f(top + 2) + 'L' + f(x - 1.2) + ' ' + f(top) + 'L' + f(x + w + 1.2) + ' ' + f(top) + 'L' + f(x + w + 1.2) + ' ' + f(top + 2) + 'L' + f(x + w) + ' ' + f(top + 2);
      x += w;
    }
    roof += 'L242 240Z';
    function tank(cx, base) {
      return '<g fill="#4a312a">' +
        '<path d="M' + (cx - 5) + ' ' + base + 'V' + (base - 9) + 'M' + (cx + 5) + ' ' + base + 'V' + (base - 9) + 'M' + (cx - 5) + ' ' + (base - 4) + 'L' + (cx + 5) + ' ' + (base - 8) + '" stroke="#4a312a" stroke-width="1.1" fill="none"/>' +
        '<rect x="' + (cx - 6.5) + '" y="' + (base - 22) + '" width="13" height="13" rx="1"/>' +
        '<path d="M' + (cx - 7.5) + ' ' + (base - 21.5) + 'L' + cx + ' ' + (base - 29) + 'L' + (cx + 7.5) + ' ' + (base - 21.5) + 'Z"/>' +
        '<path d="M' + (cx - 6.5) + ' ' + (base - 18) + 'H' + (cx + 6.5) + 'M' + (cx - 6.5) + ' ' + (base - 13) + 'H' + (cx + 6.5) + '" stroke="#6b4a3c" stroke-width=".7"/>' +
        '</g>';
    }

    var body =
      '<rect width="240" height="240" fill="url(#' + id('sky') + ')"/>' +
      '<circle cx="196" cy="150" r="74" fill="url(#' + id('sun') + ')"/>' +
      '<circle cx="196" cy="150" r="17" fill="#fff3d8"/>' +
      '<path d="' + blocks(R, -2, 244, 206, 20, 70, 7, 15) + '" fill="#dcab78" opacity=".92"/>' +
      chrysler +
      mid + midLights +
      '<path d="' + esb + '" fill="#7d553e"/>' +
      '<g clip-path="url(#' + id('esb') + ')"><rect x="104" y="8" width="30" height="200" fill="#c48a55" opacity=".78"/>' +
      '<path d="M96.6 68V150M100 68V150M103.4 68V150" stroke="#6a4734" stroke-width=".6" opacity=".7"/>' +
      '<path d="M107.2 68V150M110.6 68V150M113.6 68V150" stroke="#e0a76c" stroke-width=".6" opacity=".7"/>' +
      lights(R, 80, 128, 166, 204, '#ffe2aa', 0.18, 0.9) + '</g>' +
      '<circle cx="104" cy="12" r="1.3" fill="#fff0cf"/>' +
      '<path d="' + roof + '" fill="#573c34"/>' +
      tank(44, 210) + tank(196, 211) +
      lights(R, 6, 236, 222, 238, '#ffd28c', 0.07, 0.8, 2.2, 2.6) +
      birds([[146, 132, 0.8], [158, 124, 0.65], [170, 136, 0.7]], '#8a5a44');
    return wrap(n, defs, body, '#5a2e16');
  }

  /* ======================================================================
     KOCHI 2014: the Chinese fishing nets at sunset (Anjali's wedding trip)
     ====================================================================== */
  function kochi() {
    var n = 'kochi', R = rng(2014), id = function (s) { return 'pc-kochi-' + s; };
    var defs =
      lin(id('sky'), [[0, '#874566'], [0.36, '#c35e6c'], [0.7, '#ec8960'], [1, '#f7b56c']]) +
      glow(id('sun'), '#ffd28f', 0.9) +
      lin(id('sea'), [[0, '#d27963'], [0.45, '#a05463'], [1, '#6a3452']]);

    // one cantilevered net: shore platform, mast, long boom, four wide spars,
    // and a shallow meshed bowl hanging between the spar tips
    var netShape = 'M94 130L124 144L190 144L220 130Q157 204 94 130Z';
    function net(k, s, tx, ty, col, op) { // k: instance, s: scale, (tx,ty): offset
      var cid = id('mesh' + k), mesh = '';
      for (var mx = 92; mx < 224; mx += 6.5) mesh += 'M' + f(mx) + ' 126L' + f(mx + 6) + ' 176';
      for (var my = 134; my < 176; my += 5) mesh += 'M88 ' + my + 'H226';
      defs += '<clipPath id="' + cid + '"><path d="' + netShape + '"/></clipPath>';
      return '<g transform="translate(' + tx + ' ' + ty + ') scale(' + s + ')" fill="none" stroke="' + col + '" stroke-linecap="round" opacity="' + op + '">' +
        '<rect x="-2" y="198" width="82" height="5" fill="' + col + '" stroke="none"/>' +
        '<path stroke-width="2" d="M8 203V216M30 203V214M56 203V216M76 203V214"/>' +
        '<path stroke-width="2.4" d="M60 199V151"/>' +
        '<path stroke-width="1.8" d="M44 199L60 151M76 199L60 151"/>' +
        '<path stroke-width="3.2" d="M30 176L157 74"/>' +
        '<path d="' + netShape + '" fill="' + col + '" fill-opacity=".22" stroke-width=".9"/>' +
        '<g clip-path="url(#' + cid + ')"><path stroke-width=".5" opacity=".75" d="' + mesh + '"/></g>' +
        '<path stroke-width="1.9" d="M157 74Q120 90 94 130M157 74Q136 104 124 144M157 74Q178 104 190 144M157 74Q194 90 220 130"/>' +
        '<path stroke-width=".7" d="M157 74L64 152M34 173V190M40 168V186M46 163V182M52 158V178M60 151L30 118M157 74V160"/>' +
        '<path stroke-width="2.6" d="M157 74L163 69"/>' +
        '</g>';
    }
    var stones = '<g fill="#3a1f35"><circle cx="34" cy="191" r="2.4"/><circle cx="40" cy="187" r="2.4"/><circle cx="46" cy="183" r="2.3"/><circle cx="52" cy="179" r="2.2"/></g>';

    // marigold string from the left edge to the mast top
    var mari = '<path d="M0 118Q30 150 60 151" fill="none" stroke="#3b2036" stroke-width=".5" opacity=".6"/><g>';
    for (var i = 0; i <= 15; i++) {
      var t = i / 15, bx = (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * 30 + t * t * 60,
        by = (1 - t) * (1 - t) * 118 + 2 * (1 - t) * t * 150 + t * t * 151;
      mari += '<circle cx="' + f(bx) + '" cy="' + f(by + 1.4) + '" r="1.55" fill="' + (i % 2 ? '#f6c445' : '#f08f2e') + '"/>';
    }
    mari += '</g>';

    // distant palms on the far shore
    var shore = '<path d="M150 178Q170 174 190 175Q214 172 242 174V179H150Z" fill="#7a3a52" opacity=".65"/>' +
      '<g stroke="#7a3a52" stroke-width="1" fill="none" opacity=".7" stroke-linecap="round">' +
      '<path d="M206 175Q207 168 205 162M205 162q-4 -1 -6 2M205 162q4 -2 7 0M205 162q-1 -3 -4 -4M205 162q2 -3 5 -3"/>' +
      '<path d="M224 175Q223 167 226 160M226 160q-4 -1 -6 2M226 160q4 -2 7 0M226 160q-1 -3 -4 -4M226 160q2 -3 5 -3"/></g>';

    var body =
      '<rect width="240" height="240" fill="url(#' + id('sky') + ')"/>' +
      '<g fill="#f6b4a0" opacity=".35"><rect x="120" y="96" width="110" height="2.4" rx="1.2"/><rect x="150" y="104" width="80" height="1.6" rx=".8"/><rect x="10" y="62" width="70" height="2" rx="1"/></g>' +
      '<circle cx="150" cy="176" r="92" fill="url(#' + id('sun') + ')"/>' +
      '<circle cx="150" cy="176" r="25" fill="#ffe1a4"/>' +
      shore +
      '<rect x="0" y="178" width="240" height="62" fill="url(#' + id('sea') + ')"/>' +
      reflection(R, 150, 180.5, 236, [50, 40, 32, 24, 17, 12, 8, 5], '#ffd9a0', 0.85) +
      net(2, 0.4, 168, 108, '#7d3e58', 0.8) +
      net(1, 1, 0, 0, '#3b2036', 1) + stones +
      mari +
      // fisherman on the platform
      '<g fill="#3b2036"><circle cx="71" cy="185.4" r="2.3"/><path d="M68.4 198L69.4 188.6H72.8L73.8 198Z"/></g>' +
      // small canoe
      '<g fill="#4a2842"><path d="M196 214Q211 219 226 213L224 217Q211 221 198 217Z"/><circle cx="214" cy="203.4" r="1.6"/><path d="M212.6 214L213.2 205.4H214.9L215.6 214Z"/><path d="M219 196L216 216" stroke="#4a2842" stroke-width=".8"/></g>' +
      glints(R, 16, 4, 236, 186, 238, '#f7b98c', 0.5) +
      birds([[96, 46, 0.9], [110, 40, 0.7], [204, 58, 0.75]], '#5a2a46');
    return wrap(n, defs, body, '#3a1030');
  }

  /* ======================================================================
     KYOTO 2015: pagoda, torii, blossom, Fuji faint in the spring haze
     ====================================================================== */
  function kyoto() {
    var n = 'kyoto', R = rng(2015), id = function (s) { return 'pc-kyoto-' + s; };
    var defs =
      lin(id('sky'), [[0, '#b5d1e4'], [0.45, '#dbe4ee'], [0.8, '#f2e3ea'], [1, '#f6e6e4']]) +
      lin(id('fuji'), [[0, '#a9bbd3'], [1, '#c8d3e1']]) +
      lin(id('ground'), [[0, '#efdddd'], [1, '#e2c6cc']]) +
      glow(id('sun'), '#fff7f0', 0.9);

    // pagoda roofs
    var cx = 58, tiers = [[193, 70], [170, 62], [148, 54], [127.5, 47], [108.5, 40]], roofs = '', hl = '';
    for (var i = 0; i < tiers.length; i++) {
      var y = tiers[i][0], w = tiers[i][1];
      roofs += '<path d="M' + f(cx - w / 2 - 2.5) + ' ' + f(y - 3.6) + 'Q' + f(cx - w / 2 + 4) + ' ' + f(y + 1.6) + ' ' + f(cx - w / 2 + 10) + ' ' + f(y + 1.6) +
        'L' + f(cx + w / 2 - 10) + ' ' + f(y + 1.6) + 'Q' + f(cx + w / 2 - 4) + ' ' + f(y + 1.6) + ' ' + f(cx + w / 2 + 2.5) + ' ' + f(y - 3.6) +
        'L' + f(cx + w * 0.3) + ' ' + f(y - 9) + 'L' + f(cx - w * 0.3) + ' ' + f(y - 9) + 'Z"/>';
      hl += '<path d="M' + f(cx - w * 0.3) + ' ' + f(y - 8.6) + 'L' + f(cx + w * 0.3) + ' ' + f(y - 8.6) + '"/>';
      if (i < tiers.length) {
        roofs += '<rect x="' + f(cx - w * 0.22) + '" y="' + f(y - 12) + '" width="' + f(w * 0.44) + '" height="4" fill="#5d4553"/>';
      }
    }

    // blossom clusters
    function cluster(x, y, r, count) {
      var s = '';
      var pinks = ['#f3b3c5', '#f8ccd8', '#eba1b7', '#fbdde5'];
      for (var k = 0; k < count; k++) {
        var a = R() * Math.PI * 2, d = R() * r;
        s += '<circle cx="' + f(x + Math.cos(a) * d) + '" cy="' + f(y + Math.sin(a) * d * 0.8) + '" r="' + f(2.4 + R() * 3.2) + '" fill="' + pinks[(R() * 4) | 0] + '" opacity="' + f(0.8 + R() * 0.2) + '"/>';
      }
      return s;
    }
    var midBlossom = '';
    for (var x = 82; x < 176; x += 7 + R() * 6) midBlossom += '<circle cx="' + f(x) + '" cy="' + f(184 + R() * 6) + '" r="' + f(6 + R() * 5) + '" fill="' + (R() < 0.5 ? '#f2c3cf' : '#ecb3c3') + '"/>';

    var petals = '';
    for (i = 0; i < 16; i++) {
      petals += '<ellipse cx="' + f(R() * 240) + '" cy="' + f(40 + R() * 180) + '" rx="1.7" ry="1" fill="#f2a9bd" opacity="' + f(0.6 + R() * 0.4) + '" transform="rotate(' + f(R() * 180) + ' ' + f(120) + ' ' + f(120) + ')"/>';
    }

    var body =
      '<rect width="240" height="240" fill="url(#' + id('sky') + ')"/>' +
      '<circle cx="186" cy="64" r="44" fill="url(#' + id('sun') + ')"/>' +
      // Mt Fuji, faint
      '<path d="M44 178L110 100Q120 93 130 100L200 178Z" fill="url(#' + id('fuji') + ')" opacity=".85"/>' +
      '<path d="M94 119L110 100Q120 93 130 100L147 120L140.5 116.5L134 123.5L127 115.6L120.4 124.4L113.4 116.8L106.6 123.6L100.6 117.6Z" fill="#f7f8fb"/>' +
      // hills
      '<path d="M-4 178Q40 160 90 170Q140 180 180 166Q214 156 244 168V200H-4Z" fill="#cbd8d4"/>' +
      '<path d="M-4 190Q50 176 110 186Q170 196 244 182V206H-4Z" fill="#bccdc3"/>' +
      midBlossom +
      // pagoda
      '<rect x="34" y="203.5" width="48" height="6.5" fill="#76606b"/>' +
      '<path d="M50.5 204L51.5 96H64.5L65.5 204Z" fill="#5a4150"/>' +
      '<g fill="#4c3443">' + roofs + '</g>' +
      '<g stroke="#7a5d6c" stroke-width=".8" fill="none">' + hl + '</g>' +
      '<g stroke="#4c3443" stroke-linecap="round"><path d="M58 101V66" stroke-width="1.8"/><path stroke-width="1.2" d="M54.6 72H61.4M54.6 76H61.4M54.6 80H61.4M54.6 84H61.4M55.2 88H60.8"/></g>' +
      '<circle cx="58" cy="65" r="1.7" fill="#4c3443"/>' +
      // ground and path
      '<rect x="0" y="206" width="240" height="34" fill="url(#' + id('ground') + ')"/>' +
      '<path d="M176 240L186 222H198L214 240Z" fill="#f4e7e4" opacity=".8"/>' +
      // torii
      '<g fill="#d4553d">' +
      '<path d="M167.6 223L170.4 139.5H175.6L174.4 223Z"/><path d="M207.6 223L206.4 139.5H211.6L214.4 223Z"/>' +
      '<rect x="160" y="148" width="62" height="5.6"/>' +
      '<rect x="188.8" y="137" width="4.4" height="11.4"/>' +
      '<path d="M153.6 131Q191 137 228.4 131L227.8 136.4Q191 142 154.2 136.4Z"/></g>' +
      '<path d="M150 126Q191 133 232 126L231 131.4Q191 137.6 151 131.4Z" fill="#2c2731"/>' +
      '<g fill="#b4402d"><rect x="170.4" y="153.6" width="1.6" height="69"/><rect x="210" y="153.6" width="1.6" height="69"/></g>' +
      '<g fill="#3a3038"><rect x="166.6" y="219" width="9" height="5" rx="1"/><rect x="206.4" y="219" width="9" height="5" rx="1"/></g>' +
      // blossom branch, top right
      '<path d="M244 14Q214 24 198 42Q188 53 168 58M214 26Q214 14 222 6M198 42Q204 50 202 60" fill="none" stroke="#5a4048" stroke-width="2.6" stroke-linecap="round"/>' +
      cluster(232, 18, 11, 16) + cluster(214, 30, 12, 18) + cluster(220, 8, 9, 10) + cluster(198, 42, 12, 18) + cluster(184, 54, 10, 14) + cluster(168, 58, 8, 11) + cluster(203, 61, 7, 8) +
      petals;
    return wrap(n, defs, body, '#5a3048');
  }

  /* ======================================================================
     SYDNEY 2017: Opera House sails and the Harbour Bridge on a clear day
     ====================================================================== */
  function sydney() {
    var n = 'sydney', R = rng(2017), id = function (s) { return 'pc-sydney-' + s; };
    var defs =
      lin(id('sky'), [[0, '#4c9cd6'], [0.55, '#8bc4ea'], [1, '#d3eaf8']]) +
      lin(id('water'), [[0, '#2f8ac1'], [1, '#1a6399']]) +
      lin(id('shell'), [[0, '#e3e9ef'], [0.55, '#ffffff'], [1, '#f6f7f6']], [0, 0, 1, 0]) +
      glow(id('sun'), '#fffdf2', 1);

    function cloud(x, y, s) {
      return '<g fill="#ffffff" opacity=".92" transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
        '<circle cx="0" cy="0" r="8"/><circle cx="10" cy="-5" r="10"/><circle cx="22" cy="-1" r="8"/><circle cx="31" cy="2" r="5.5"/>' +
        '<rect x="-6" y="0" width="42" height="7.5" rx="3.75"/></g>';
    }

    // bridge
    var hangers = '';
    for (var x = 34; x <= 106; x += 6) {
      var t = (x - 22) / 96, yi = (1 - t) * (1 - t) * 152 + 2 * (1 - t) * t * 80 + t * t * 152;
      if (yi < 136) hangers += 'M' + x + ' ' + f(yi) + 'V136';
    }
    var posts = '';
    for (x = 18; x <= 122; x += 6) {
      var t2 = (x - 22) / 96, yi2 = (1 - t2) * (1 - t2) * 152 + 2 * (1 - t2) * t2 * 80 + t2 * t2 * 152;
      if (yi2 > 140) posts += 'M' + x + ' 140V' + f(yi2);
    }
    var bridge =
      '<path d="M14 152Q70 52 126 152L118 152Q70 80 22 152Z" fill="#5c7a92"/>' +
      '<path d="' + hangers + posts + '" stroke="#5c7a92" stroke-width=".8" fill="none"/>' +
      '<path d="M22 150Q70 66 118 150" fill="none" stroke="#7f9bb0" stroke-width=".6" opacity=".7"/>' +
      '<rect x="-2" y="135.6" width="146" height="4.4" fill="#55738b"/>' +
      '<g fill="#93a9ba"><rect x="3" y="117" width="13" height="38"/><rect x="2" y="115" width="15" height="3"/>' +
      '<rect x="124" y="117" width="13" height="38"/><rect x="123" y="115" width="15" height="3"/></g>';

    // opera house shells: [a, b, tipX, tipY]
    var shells = [[198, 236, 206, 141], [177, 216, 185, 131], [151, 198, 159, 117], [131, 167, 137, 135], [114, 142, 116, 152]];
    var sh = '';
    for (var i = 0; i < shells.length; i++) {
      var s = shells[i], a = s[0], b = s[1], tx = s[2], ty = s[3], base = 188;
      sh += '<path d="M' + a + ' ' + base + 'Q' + (a + 3) + ' ' + f(ty + (base - ty) * 0.45) + ' ' + tx + ' ' + ty + 'Q' + f(b - (b - a) * 0.16) + ' ' + f(ty + 5) + ' ' + b + ' ' + base + 'Z" fill="url(#' + id('shell') + ')"/>' +
        '<path d="M' + a + ' ' + base + 'Q' + (a + 3) + ' ' + f(ty + (base - ty) * 0.45) + ' ' + tx + ' ' + ty + 'Q' + f(a + (b - a) * 0.36) + ' ' + f(ty + (base - ty) * 0.5) + ' ' + f(a + (b - a) * 0.42) + ' ' + base + 'Z" fill="#d2dae4"/>' +
        '<path d="M' + f(tx + 1) + ' ' + f(ty + 3) + 'Q' + f(b - (b - a) * 0.3) + ' ' + f(ty + 10) + ' ' + f(b - 2) + ' ' + base + '" fill="none" stroke="#dfe5ec" stroke-width=".6"/>';
    }

    var ripples = glints(R, 26, 2, 238, 158, 238, '#d6eef9', 0.6);

    var body =
      '<rect width="240" height="240" fill="url(#' + id('sky') + ')"/>' +
      '<circle cx="206" cy="40" r="40" fill="url(#' + id('sun') + ')"/>' +
      '<circle cx="206" cy="40" r="11" fill="#fffef6"/>' +
      cloud(40, 58, 1) + cloud(132, 34, 0.7) +
      // north shore haze
      '<path d="M-4 152Q40 140 90 146Q150 136 244 146V156H-4Z" fill="#8fb4b8" opacity=".9"/>' +
      '<path d="' + blocks(R, 150, 244, 148, 4, 16, 5, 10) + '" fill="#9cbcc2"/>' +
      bridge +
      '<rect x="0" y="152" width="240" height="88" fill="url(#' + id('water') + ')"/>' +
      ripples +
      // podium
      '<path d="M100 188H244V201H96Z" fill="#dccab0"/><path d="M98 194H244" stroke="#c4b092" stroke-width="1"/>' +
      sh +
      // sailboat
      '<g><path d="M56 199H78L75 202.6H59Z" fill="#23394d"/><path d="M67.5 198.6V174" stroke="#23394d" stroke-width=".9"/>' +
      '<path d="M68.4 176L68.4 197.4L79 197.4Z" fill="#ffffff"/><path d="M66.6 179L66.6 197.4L59.4 197.4Z" fill="#eef3f6"/></g>' +
      // ferry
      '<g><path d="M12 220.4H52L48.6 226H15.4Z" fill="#2f7a4e"/><rect x="18" y="214.4" width="27" height="6.2" rx="1" fill="#f3e7c0"/>' +
      '<rect x="17" y="213" width="29" height="1.6" fill="#e8c24a"/><path d="M15 221.6H50" stroke="#e8c24a" stroke-width="1"/>' +
      '<g fill="#2b4a5c"><rect x="20" y="216.2" width="2.4" height="2"/><rect x="24.4" y="216.2" width="2.4" height="2"/><rect x="28.8" y="216.2" width="2.4" height="2"/><rect x="33.2" y="216.2" width="2.4" height="2"/><rect x="37.6" y="216.2" width="2.4" height="2"/><rect x="42" y="216.2" width="2" height="2"/></g></g>' +
      '<path d="M8 228Q30 230 56 227" stroke="#e6f4fb" stroke-width="1" fill="none" opacity=".7"/>' +
      birds([[92, 92, 0.8], [104, 86, 0.65]], '#3f6a8a');
    return wrap(n, defs, body, '#0e3a5e');
  }

  /* Catmull-Rom point between p1 and p2 (used for winding roads) */
  function cr(p0, p1, p2, p3, t) {
    var t2 = t * t, t3 = t2 * t;
    return [
      0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
      0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
    ];
  }

  /* ======================================================================
     SCOTLAND & ENGLAND 2015: a road trip through a Highland glen, a castle
     on its crag above the loch, heather on the slopes
     ====================================================================== */
  function scotland() {
    var n = 'scotland', R = rng(1501), id = function (s) { return 'pc-scotland-' + s; };
    var defs =
      lin(id('sky'), [[0, '#8ea3bb'], [0.42, '#b3c1cf'], [0.78, '#d9dbd6'], [1, '#ebe2d3']]) +
      glow(id('sun'), '#fff5e2', 0.8) +
      lin(id('loch'), [[0, '#b9c6d1'], [1, '#8597a9']]) +
      lin(id('road'), [[0, '#b8b1a7'], [1, '#d9d1c4']]) +
      lin(id('mist'), [[0, '#eef0ee', 0], [0.5, '#eef0ee', 0.6], [1, '#eef0ee', 0]]) +
      lin(id('fg'), [[0, '#8a6b92'], [1, '#6a5074']]);

    var clouds = '<g fill="#eef0f1">' +
      '<ellipse cx="46" cy="40" rx="44" ry="9" opacity=".5"/><ellipse cx="74" cy="33" rx="26" ry="8" opacity=".45"/>' +
      '<ellipse cx="196" cy="30" rx="40" ry="7" opacity=".42"/><ellipse cx="218" cy="24" rx="20" ry="6" opacity=".38"/>' +
      '<rect x="104" y="56" width="96" height="2.4" rx="1.2" opacity=".5"/><rect x="18" y="68" width="60" height="1.8" rx=".9" opacity=".4"/></g>';

    // two ranges of rounded Highland hills, the near one tinged with heather
    var far = '<path d="M-4 162V124Q14 110 30 114Q48 96 66 100Q84 86 100 92Q116 104 132 98Q152 82 170 90Q190 100 204 96Q222 104 244 100V162Z" fill="#8a99b0"/>' +
      '<path d="M66 100Q74 110 69 124M170 90Q177 101 172 114M100 92Q105 101 102 112M204 96Q209 104 206 114" stroke="#a6b2c3" stroke-width="1.1" fill="none" opacity=".75"/>';
    var mid = '<path d="M-4 172V138Q20 126 44 132Q70 118 96 126Q120 136 146 128Q172 114 198 124Q220 132 244 126V172Z" fill="#847e9a"/>' +
      '<path d="M96 126Q101 138 96 152M198 124Q203 136 199 150" stroke="#9893ab" stroke-width="1" fill="none" opacity=".7"/>';

    // the castle on its crag (Eilean Donan in spirit), saltire on the keep
    function cren(x, y, w) {
      var s = '';
      for (var cx = x; cx < x + w - 1; cx += 3.4) s += '<rect x="' + f(cx) + '" y="' + f(y - 2.6) + '" width="2" height="2.8"/>';
      return s;
    }
    var castle =
      '<path d="M26 186Q32 168 46 160Q58 154 72 156Q86 158 95 168Q101 176 106 186Z" fill="#5c5763"/>' +
      '<path d="M46 160Q58 154 72 156L71 161Q59 159 51 166Z" fill="#7b7581" opacity=".7"/>' +
      '<g fill="#6b6573">' +
      '<rect x="44" y="142" width="49" height="17"/>' +
      '<rect x="58" y="120" width="17" height="39"/>' +
      '<rect x="44" y="132" width="9" height="27"/>' +
      '<rect x="83" y="134" width="10" height="25"/>' +
      cren(58, 120, 17) + cren(44, 132, 9) + cren(53, 142, 5) + cren(75, 142, 8) +
      '</g>' +
      '<rect x="69" y="120" width="6" height="39" fill="#867f8e"/>' +
      '<path d="M82 134L88 123L94 134Z" fill="#4e4956"/>' +
      '<g fill="#3d3945"><rect x="62" y="127" width="1.6" height="3.4"/><rect x="62" y="137" width="1.6" height="3.4"/><rect x="47" y="138" width="1.4" height="3"/><rect x="87" y="140" width="1.4" height="3"/><rect x="66" y="149" width="4" height="6" rx="2"/></g>' +
      '<path d="M66.5 117.6V107.6" stroke="#4e4956" stroke-width=".8"/>' +
      '<path d="M66.9 107.8h6.6l-1.7 1.8 1.7 1.8h-6.6z" fill="#2f5a9b"/><path d="M67.1 108l6 3.2M67.1 111.2l6-3.2" stroke="#fff" stroke-width=".5"/>' +
      // a little stone bridge to the shore
      '<path d="M18 182H30V186H18Z" fill="#6b6573"/><path d="M18 186A4 3 0 0 1 24 186A4 3 0 0 1 30 186" fill="#5c5763"/>';

    // the road: a ribbon around a winding centre line, narrowing with distance
    var P = [[118, 268], [104, 233], [108, 215], [134, 205], [164, 197], [190, 190], [216, 185]];
    var Wd = [62, 38, 29, 21, 13.5, 8, 3.6];
    var pts = [], wid = [], i, k;
    for (i = 0; i < P.length - 1; i++) {
      var q0 = P[Math.max(0, i - 1)], q1 = P[i], q2 = P[i + 1], q3 = P[Math.min(P.length - 1, i + 2)];
      for (k = 0; k < 10; k++) {
        pts.push(cr(q0, q1, q2, q3, k / 10));
        wid.push(Wd[i] + (Wd[i + 1] - Wd[i]) * k / 10);
      }
    }
    pts.push(P[P.length - 1]); wid.push(Wd[Wd.length - 1]);
    var Ls = [], Rs = [], dir = [];
    for (i = 0; i < pts.length; i++) {
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / len, ny = dx / len, hw = wid[i] / 2;
      dir.push(Math.atan2(dy, dx));
      Ls.push(f(pts[i][0] + nx * hw) + ' ' + f(pts[i][1] + ny * hw));
      Rs.push(f(pts[i][0] - nx * hw) + ' ' + f(pts[i][1] - ny * hw));
    }
    var road = 'M' + Ls.join('L') + 'L' + Rs.slice().reverse().join('L') + 'Z';
    var centre = 'M';
    for (i = 3; i < 44; i++) centre += (i > 3 ? 'L' : '') + f(pts[i][0]) + ' ' + f(pts[i][1]);
    // a small red car heading into the glen
    var ci = 27, cpt = pts[ci], ang = dir[ci] * 180 / Math.PI + 180, cs = 0.62 + wid[ci] / 60;
    var car = '<g transform="translate(' + f(cpt[0]) + ' ' + f(cpt[1] + 1) + ') rotate(' + f(ang) + ') scale(' + f(cs) + ')">' +
      '<ellipse cx="0" cy="1.6" rx="7" ry="1.6" fill="#3a2f3a" opacity=".35"/>' +
      '<path d="M-6.4 1V-2.2Q-6.4 -3.4 -5 -3.6L-3 -3.8L-1.6 -6.2Q-1.2 -6.8 -.4 -6.8H3Q3.8 -6.8 4.2 -6.2L5.4 -3.8L6 -3.6Q6.6 -3.2 6.6 -2.2V1Z" fill="#c0392b"/>' +
      '<path d="M-1 -3.9L-.2 -5.9H1.4V-3.9ZM2.3 -3.9V-5.9H3.2L4.3 -3.9Z" fill="#dfe8ee"/>' +
      '<circle cx="-3.6" cy="1" r="1.5" fill="#26262b"/><circle cx="3.8" cy="1" r="1.5" fill="#26262b"/></g>';

    // heather and bracken flecks
    var heather = '';
    for (i = 0; i < 70; i++) {
      var hx = R() * 240, hy = 206 + R() * 34;
      heather += '<circle cx="' + f(hx) + '" cy="' + f(hy) + '" r="' + f(0.7 + R() * 1.3) + '" fill="' + (R() < 0.5 ? '#b58bbb' : '#9d72a5') + '" opacity="' + f(0.55 + R() * 0.4) + '"/>';
    }
    // bracken only on the two near hills (clipped to their shapes)
    var nearL = 'M-4 190Q24 182 48 188Q76 196 98 208Q114 218 120 240H-4Z', nearR = 'M140 240Q152 206 182 192Q208 182 244 184V240Z';
    defs += '<clipPath id="' + id('near') + '"><path d="' + nearL + nearR + '"/></clipPath>';
    var bracken = '';
    for (i = 0; i < 30; i++) {
      var bx = R() * 240, by = 186 + R() * 28;
      bracken += '<ellipse cx="' + f(bx) + '" cy="' + f(by) + '" rx="' + f(3 + R() * 6) + '" ry="' + f(1 + R() * 1.6) + '" fill="' + (R() < 0.5 ? '#9da06a' : '#a68f6e') + '" opacity=".5"/>';
    }
    function sheep(x, y, s) {
      return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M-2 1.4V3.4M1.6 1.4V3.4" stroke="#2b2a2e" stroke-width=".7"/>' +
        '<ellipse cx="0" cy="0" rx="3.4" ry="2.3" fill="#f4f1ea"/><ellipse cx="3.4" cy="-.8" rx="1.3" ry="1.1" fill="#2b2a2e"/></g>';
    }

    var body =
      '<rect width="240" height="240" fill="url(#' + id('sky') + ')"/>' +
      '<circle cx="176" cy="72" r="58" fill="url(#' + id('sun') + ')"/>' +
      '<circle cx="176" cy="72" r="12" fill="#fbf6ea" opacity=".85"/>' +
      clouds + far + mid +
      '<rect x="0" y="122" width="240" height="34" fill="url(#' + id('mist') + ')"/>' +
      '<rect x="0" y="154" width="240" height="40" fill="url(#' + id('loch') + ')"/>' +
      glints(R, 16, 100, 236, 158, 186, '#eef2f4', 0.75) +
      castle +
      reflection(R, 68, 188, 198, [34, 24, 16, 10], '#4f4a57', 0.32) +
      '<path d="' + nearL + '" fill="#76607f"/>' +
      '<path d="' + nearR + '" fill="#82698b"/>' +
      '<g clip-path="url(#' + id('near') + ')">' + bracken + '</g>' +
      sheep(22, 200, 0.9) + sheep(38, 205, 1) + sheep(58, 202, 0.85) + sheep(214, 196, 0.8) +
      '<path d="M152 224Q172 206 202 199Q224 195 244 197" stroke="#a7a1ad" stroke-width="1.4" stroke-dasharray="1.6 1" fill="none"/>' +
      '<path d="M-4 216Q30 206 62 216Q90 226 100 240H-4Z" fill="url(#' + id('fg') + ')"/>' +
      '<path d="M166 240Q178 220 206 214Q228 210 244 212V240Z" fill="url(#' + id('fg') + ')"/>' +
      heather +
      '<path d="' + road + '" fill="url(#' + id('road') + ')" stroke="#6c5866" stroke-width=".6" stroke-opacity=".45"/>' +
      '<path d="' + centre + '" stroke="#f6f1e6" stroke-width="1" stroke-dasharray="3.4 3.4" fill="none" opacity=".75"/>' +
      car +
      birds([[132, 64, 0.8], [144, 58, 0.65], [30, 92, 0.6]], '#5d6a7a');
    return wrap(n, defs, body, '#33283e');
  }

  /* ======================================================================
     DELHI & JAIPUR 2015: the pink honeycomb of the Hawa Mahal on a warm
     afternoon, India Gate faint in the haze
     ====================================================================== */
  function jaipur() {
    var n = 'jaipur', R = rng(1502), id = function (s) { return 'pc-jaipur-' + s; };
    var defs =
      lin(id('sky'), [[0, '#e99d6c'], [0.4, '#f2bd86'], [0.78, '#f8dbb0'], [1, '#fbe8ca']]) +
      glow(id('sun'), '#fff1d0', 0.95) +
      lin(id('wall'), [[0, '#f09f89'], [1, '#dc806e']]) +
      lin(id('street'), [[0, '#ddb08a'], [1, '#c69470']]);

    var cx = 141;
    // storeys bottom-up: [bottom y, top y, half width]
    var S = [[208, 183, 95], [183, 159, 86], [159, 136, 74], [136, 114, 61], [114, 94, 47], [94, 76, 30]];
    var mass = '', trim = '', bays = '', i, j;
    for (i = 0; i < S.length; i++) {
      var y0 = S[i][0], y1 = S[i][1], hw = S[i][2];
      mass += '<rect x="' + f(cx - hw) + '" y="' + y1 + '" width="' + f(hw * 2) + '" height="' + (y0 - y1 + 0.5) + '"/>';
      trim += '<rect x="' + f(cx - hw - 1.5) + '" y="' + f(y1 - 0.6) + '" width="' + f(hw * 2 + 3) + '" height="1.8" fill="#fde9dd"/>' +
        '<rect x="' + f(cx - hw) + '" y="' + f(y1 + 1.2) + '" width="' + f(hw * 2) + '" height="1.2" fill="#c66b5c" opacity=".55"/>';
      if (i === 0 || i === S.length - 1) continue;
      // projecting jharokha bays: body, arched opening, curved roof, finial
      var h = y0 - y1, step = i < 3 ? 11.6 : 11, count = Math.floor((hw * 2 - 4) / step), xs = cx - (count - 1) * step / 2;
      for (j = 0; j < count; j++) {
        var x = xs + j * step, bw = step - 2.6, tone = j % 2 ? '#f5ae9a' : '#f7b8a6';
        bays += '<rect x="' + f(x - bw / 2) + '" y="' + f(y1 + h * 0.36) + '" width="' + f(bw) + '" height="' + f(h * 0.58) + '" fill="' + tone + '"/>' +
          '<path d="M' + f(x - bw * 0.28) + ' ' + f(y1 + h * 0.88) + 'V' + f(y1 + h * 0.58) + 'A' + f(bw * 0.28) + ' ' + f(bw * 0.28) + ' 0 0 1 ' + f(x + bw * 0.28) + ' ' + f(y1 + h * 0.58) + 'V' + f(y1 + h * 0.88) + 'Z" fill="#9e4842"/>' +
          '<path d="M' + f(x - bw / 2 - 0.9) + ' ' + f(y1 + h * 0.38) + 'Q' + f(x) + ' ' + f(y1 + h * 0.02) + ' ' + f(x + bw / 2 + 0.9) + ' ' + f(y1 + h * 0.38) + 'Z" fill="#fac7b8"/>' +
          '<circle cx="' + f(x) + '" cy="' + f(y1 + h * 0.06) + '" r=".8" fill="#fff0e6"/>' +
          '<rect x="' + f(x - bw / 2) + '" y="' + f(y1 + h * 0.92) + '" width="' + f(bw) + '" height="1.2" fill="#d47767"/>';
      }
    }
    // ground storey: shop arches and the gateway
    var arches = '';
    for (var ax = cx - 86; ax <= cx + 86; ax += 14) {
      if (Math.abs(ax - cx) < 9) continue;
      arches += '<path d="M' + f(ax - 4) + ' 208V196A4 4 0 0 1 ' + f(ax + 4) + ' 196V208Z" fill="#8d3e3a"/>';
    }
    arches += '<path d="M' + (cx - 8) + ' 208V193A8 8 0 0 1 ' + (cx + 8) + ' 193V208Z" fill="#7a3331"/><path d="M' + (cx - 8) + ' 193A8 8 0 0 1 ' + (cx + 8) + ' 193" stroke="#fde9dd" stroke-width="1.2" fill="none"/>';
    // the crown: three small domes and a taller central chhatri
    var crown =
      '<g fill="#f8c4b4"><path d="M' + (cx - 25) + ' 77Q' + (cx - 18) + ' 63 ' + (cx - 11) + ' 77Z"/><path d="M' + (cx + 11) + ' 77Q' + (cx + 18) + ' 63 ' + (cx + 25) + ' 77Z"/></g>' +
      '<rect x="' + (cx - 7) + '" y="62" width="14" height="15" fill="#ec9a86"/>' +
      '<path d="M' + (cx - 5) + ' 77V68A5 5 0 0 1 ' + (cx + 5) + ' 68V77Z" fill="#9e4842"/>' +
      '<path d="M' + (cx - 9) + ' 63Q' + cx + ' 44 ' + (cx + 9) + ' 63Z" fill="#fac7b8"/>' +
      '<path d="M' + cx + ' 47V40" stroke="#fde9dd" stroke-width="1.2"/><circle cx="' + cx + '" cy="39.5" r="1.3" fill="#fde9dd"/>' +
      '<circle cx="' + (cx - 18) + '" cy="64" r=".9" fill="#fde9dd"/><circle cx="' + (cx + 18) + '" cy="64" r=".9" fill="#fde9dd"/>';
    // India Gate, faint in the haze (Delhi)
    var gate = '<g fill="#dca889" opacity=".75">' +
      '<path d="M8 206V162H38V206H30.4V180A7.4 7.4 0 0 0 15.6 180V206Z"/>' +
      '<rect x="6.5" y="155" width="33" height="7.6"/><rect x="11" y="150" width="24" height="5.4"/>' +
      '<path d="M16 150Q23 141 30 150Z"/></g>';
    // neighbouring buildings and the street
    var side = '<path d="M-4 208V178H22V170H40V208Z" fill="#e7b29a"/><path d="M226 208V172H244V208Z" fill="#e7a995"/>' +
      '<g fill="#c27766" opacity=".7"><rect x="2" y="186" width="5" height="7"/><rect x="12" y="186" width="5" height="7"/><rect x="28" y="180" width="5" height="7"/><rect x="232" y="182" width="5" height="7"/></g>';
    function person(x, y, c) {
      return '<g><rect x="' + f(x - 1.6) + '" y="' + f(y - 6.6) + '" width="3.2" height="6.6" rx="1.3" fill="' + c + '"/><circle cx="' + f(x) + '" cy="' + f(y - 8.2) + '" r="1.5" fill="#3a2a22"/></g>';
    }
    var street =
      '<rect x="0" y="207" width="240" height="33" fill="url(#' + id('street') + ')"/>' +
      '<rect x="0" y="207" width="240" height="1.4" fill="#b67c60"/>' +
      '<path d="M0 224H240" stroke="#e8c6a2" stroke-width="1" stroke-dasharray="6 6" opacity=".7"/>' +
      person(58, 222, '#2f6db3') + person(66, 224, '#e0a32e') + person(200, 220, '#2f8a6a') + person(178, 232, '#c0392b') +
      // a cycle-rickshaw
      '<g fill="none" stroke="#3a2a22" stroke-width="1"><circle cx="104" cy="231" r="3.4"/><circle cx="118" cy="231" r="3.4"/><path d="M104 231L110 226H117L118 231M110 226L108 222"/></g>' +
      '<path d="M112 226Q113 219 119 219L121 226Z" fill="#2f8a6a"/>';

    var body =
      '<rect width="240" height="240" fill="url(#' + id('sky') + ')"/>' +
      '<circle cx="202" cy="50" r="56" fill="url(#' + id('sun') + ')"/>' +
      '<circle cx="202" cy="50" r="13" fill="#fff4dc"/>' +
      '<g fill="#fbe2c4" opacity=".55"><rect x="12" y="46" width="70" height="2.2" rx="1.1"/><rect x="30" y="54" width="40" height="1.5" rx=".75"/><rect x="186" y="96" width="52" height="1.8" rx=".9"/></g>' +
      gate + side +
      '<g fill="url(#' + id('wall') + ')">' + mass + '</g>' +
      bays + trim + arches + crown +
      street +
      birds([[46, 70, 0.75], [58, 63, 0.6], [214, 112, 0.7]], '#9a5a4a');
    return wrap(n, defs, body, '#5a2418');
  }

  /* ======================================================================
     MUNNAR & MADURAI 2016: tea gardens in the morning mist, a Meenakshi-
     style gopuram rising behind the hills
     ====================================================================== */
  function munnar() {
    var n = 'munnar', R = rng(2016), id = function (s) { return 'pc-munnar-' + s; };
    var defs =
      lin(id('sky'), [[0, '#9ac2cf'], [0.45, '#c9ddd8'], [0.8, '#ebe9da'], [1, '#f4ead6']]) +
      glow(id('sun'), '#fff6dc', 0.85) +
      lin(id('mist'), [[0, '#f4f6f0', 0], [0.5, '#f4f6f0', 0.78], [1, '#f4f6f0', 0]]);

    // gopuram: tiers of pastel sculpture under a barrel-vault crown
    var gx = 184, gop = '', i, k;
    var pastel = ['#f2a7b6', '#8fc1e3', '#f6d77a', '#a8dcc3', '#c3a8e0', '#f4b98a'];
    for (i = 0; i < 8; i++) {
      var yb = 170 - i * 12, yt = yb - 12, w = 56 - i * 4;
      gop += '<rect x="' + f(gx - w / 2) + '" y="' + yt + '" width="' + w + '" height="12.4" fill="' + (i % 2 ? '#f3dcc0' : '#efd2b2') + '"/>';
      var cnt = Math.floor((w - 4) / 4.6), x0 = gx - (cnt - 1) * 4.6 / 2;
      for (k = 0; k < cnt; k++) {
        gop += '<rect x="' + f(x0 + k * 4.6 - 1.5) + '" y="' + f(yt + 3.4) + '" width="3" height="6.6" rx="1.4" fill="' + pastel[(k + i * 2) % pastel.length] + '"/>';
      }
      gop += '<rect x="' + f(gx + w * 0.16) + '" y="' + yt + '" width="' + f(w * 0.34) + '" height="12.4" fill="#5a3a2a" opacity=".09"/>';
      gop += '<rect x="' + f(gx - w / 2 - 2) + '" y="' + f(yt - 1) + '" width="' + (w + 4) + '" height="2.2" fill="#e5a95f"/>';
    }
    gop += '<path d="M' + (gx - 18) + ' 74V67Q' + gx + ' 52 ' + (gx + 18) + ' 67V74Z" fill="#f2a7b6"/>' +
      '<path d="M' + (gx - 18) + ' 67Q' + gx + ' 52 ' + (gx + 18) + ' 67" stroke="#d9788d" stroke-width="1.2" fill="none"/>' +
      '<path d="M' + (gx - 21) + ' 74A4 5 0 0 1 ' + (gx - 15) + ' 74M' + (gx + 15) + ' 74A4 5 0 0 1 ' + (gx + 21) + ' 74" stroke="#8fc1e3" stroke-width="2" fill="none"/>';
    for (k = -2; k <= 2; k++) {
      var kx = gx + k * 6.6, ky = 60.6 + Math.abs(k) * 1.6;
      gop += '<path d="M' + f(kx) + ' ' + f(ky) + 'q-2.2 -1.6 0 -5.6q2.2 4 0 5.6z" fill="#e2b44c"/>';
    }

    // a tea hill: its shape clips rows of clipped bushes that follow the ridge line
    function teaHill(key, top, bottom, rows, gap0, colA, colB, shade) {
      var cid = id('clip-' + key), shape = top + bottom;
      defs += '<clipPath id="' + cid + '"><path d="' + shape + '"/></clipPath>';
      var s = '<path d="' + shape + '" fill="' + colA + '"/><g clip-path="url(#' + cid + ')" fill="none" stroke-linecap="round">';
      var off = 3;
      for (var r = 0; r < rows; r++) {
        off += gap0 + r * 0.55;
        s += '<path d="' + top + '" transform="translate(0 ' + f(off + 2.2) + ')" stroke="' + shade + '" stroke-width="1.3" opacity=".7"/>' +
          '<path d="' + top + '" transform="translate(0 ' + f(off) + ')" stroke="' + colB + '" stroke-width="' + f(2.4 + r * 0.16) + '" stroke-dasharray="' + f(3 + r * 0.2) + ' ' + f(1.1 + r * 0.05) + '"/>';
      }
      return s + '</g>';
    }
    var hillA = teaHill('a', 'M-4 150Q32 126 78 131Q114 135 142 160Q158 175 164 246', 'H-4Z', 18, 4.2, '#5f9f4f', '#86c46a', '#3f7a3c');
    var hillB = teaHill('b', 'M116 246Q128 188 166 170Q196 158 226 162Q238 164 246 168', 'V246Z', 16, 4, '#6aa957', '#90cb72', '#457f3f');
    var hillC = teaHill('c', 'M-4 200Q52 184 112 194Q172 204 246 190', 'V246H-4Z', 10, 5.6, '#5a9b4b', '#82c066', '#3b7438');

    // silver oaks: tall, thin shade trees standing above the tea
    function oak(x, base, h) {
      var s = '<path d="M' + x + ' ' + base + 'Q' + f(x + 1.5) + ' ' + f(base - h * 0.5) + ' ' + f(x - 0.6) + ' ' + f(base - h) + '" stroke="#5b5146" stroke-width="1.1" fill="none"/>';
      for (var j = 0; j < 6; j++) {
        var yy = base - h * (0.45 + j * 0.1), xx = x + (j % 2 ? 2.4 : -2.4) + (R() - 0.5);
        s += '<ellipse cx="' + f(xx) + '" cy="' + f(yy) + '" rx="' + f(3.6 - j * 0.3) + '" ry="2.2" fill="' + (j % 2 ? '#56794f' : '#4b6c46') + '" opacity=".92"/>';
      }
      return s;
    }
    function plucker(x, y, c) {
      return '<g><path d="M' + f(x - 1.8) + ' ' + y + 'L' + f(x - 1.2) + ' ' + f(y - 6) + 'H' + f(x + 1.2) + 'L' + f(x + 1.8) + ' ' + y + 'Z" fill="' + c + '"/>' +
        '<circle cx="' + x + '" cy="' + f(y - 7.4) + '" r="1.4" fill="#3a2a22"/><rect x="' + f(x + 0.8) + '" y="' + f(y - 7.2) + '" width="3.4" height="4" rx=".8" fill="#9a7442"/></g>';
    }

    var body =
      '<rect width="240" height="240" fill="url(#' + id('sky') + ')"/>' +
      '<circle cx="56" cy="62" r="58" fill="url(#' + id('sun') + ')"/>' +
      '<circle cx="56" cy="62" r="12" fill="#fff6e2" opacity=".92"/>' +
      '<path d="M-4 156V112Q26 92 54 102Q80 84 108 98Q132 110 152 100Q176 86 204 96Q224 104 244 98V156Z" fill="#9ab8b2" opacity=".85"/>' +
      '<path d="M-4 162V126Q30 114 60 122Q92 108 120 120Q150 132 180 120Q212 110 244 120V162Z" fill="#82a79c"/>' +
      '<rect x="0" y="112" width="240" height="40" fill="url(#' + id('mist') + ')"/>' +
      gop +
      '<rect x="0" y="142" width="240" height="26" fill="url(#' + id('mist') + ')" opacity=".7"/>' +
      hillA + hillB +
      oak(36, 140, 30) + oak(98, 136, 26) + oak(206, 170, 28) + oak(230, 176, 24) +
      '<rect x="0" y="176" width="240" height="22" fill="url(#' + id('mist') + ')" opacity=".55"/>' +
      hillC +
      '<path d="M18 246Q40 224 72 216Q110 207 146 213" stroke="#e6dabd" stroke-width="2.6" fill="none" opacity=".85"/>' +
      oak(150, 206, 34) +
      plucker(70, 214, '#d94f6b') + plucker(84, 211, '#f2b134') + plucker(186, 214, '#7a5bc4') +
      birds([[118, 58, 0.8], [130, 52, 0.65]], '#5b7a74');
    return wrap(n, defs, body, '#1f3a2c');
  }

  window.PostcardArt = {
    paris: paris,
    london: london,
    singapore: singapore,
    newyork: newyork,
    kochi: kochi,
    kyoto: kyoto,
    sydney: sydney,
    scotland: scotland,
    jaipur: jaipur,
    munnar: munnar,
    list: ['paris', 'london', 'singapore', 'newyork', 'kochi', 'kyoto', 'sydney', 'scotland', 'jaipur', 'munnar']
  };
})();

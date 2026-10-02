/* ==========================================================================
   Vehicle art for the journey bar. Each function returns an SVG string,
   viewBox 0 0 120 60, facing RIGHT, ground contact at y = 57.
   Wheels are <g class="wheel"> groups (fill-box / centre origin), so the
   integrator can spin them with a plain CSS/JS rotate.
   Dark parts carry a faint light halo, light parts a faint dark outline, so
   every vehicle reads on the dark scrim and on pale dawn skies alike.
   ========================================================================== */
(function () {
  'use strict';

  var HALO = 'rgba(255,255,255,.34)';
  var EDGE = 'rgba(22,30,44,.32)';

  function svg(inner) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60" aria-hidden="true" focusable="false">' +
      '<ellipse cx="60" cy="57.4" rx="47" ry="1.9" fill="#000" opacity=".2"/>' + inner + '</svg>';
  }

  /* spokes: count diameters through the centre */
  function spokes(cx, cy, r, count, color, width) {
    var d = '';
    for (var i = 0; i < count; i++) {
      var a = (i / count) * Math.PI, dx = Math.cos(a) * r, dy = Math.sin(a) * r;
      d += 'M' + (cx - dx).toFixed(2) + ' ' + (cy - dy).toFixed(2) + 'L' + (cx + dx).toFixed(2) + ' ' + (cy + dy).toFixed(2);
    }
    return '<path d="' + d + '" stroke="' + color + '" stroke-width="' + width + '" stroke-linecap="round" fill="none"/>';
  }

  /* car-style wheel: tyre, hubcap, three spokes, halo ring */
  function carWheel(cx, cy, r, rim) {
    return '<g class="wheel" style="transform-box:fill-box;transform-origin:center">' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#141418"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 0.35).toFixed(2) + '" fill="none" stroke="' + HALO + '" stroke-width=".5"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.55).toFixed(2) + '" fill="' + (rim || '#cfd4da') + '"/>' +
      spokes(cx, cy, r * 0.52, 3, '#6b727b', 0.85) +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.16).toFixed(2) + '" fill="#8b929b"/>' +
      '</g>';
  }

  /* --------------------------------------------------------------------
     Bicycle: black Indian roadster, child rider with a school bag
     -------------------------------------------------------------------- */
  function bicycle() {
    var HALO_B = 'rgba(255,255,255,.5)';
    var frame = 'M55 46L50 25M49 26H79M81 32L55 46M55 46L30 45M50.5 27L30 45M79 25.5L81 32M81 32Q84 40 88 45M79 25.5L78 21.6Q74 19.6 70.4 21';
    var guards = 'M15.4 45A14.6 14.6 0 0 1 42.6 37.7M75.4 37.7A14.6 14.6 0 0 1 102.6 45M17 29.6H44M20.4 29.6L28.6 43.6';
    function bikeWheel(cx, cy) {
      return '<g class="wheel" style="transform-box:fill-box;transform-origin:center">' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="12" fill="none" stroke="' + HALO_B + '" stroke-width="3.8"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="12" fill="none" stroke="#17171d" stroke-width="2.3"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="10.5" fill="none" stroke="#9aa0aa" stroke-width=".5"/>' +
        spokes(cx, cy, 10.3, 4, '#c6cad2', 0.5) +
        '<circle cx="' + cx + '" cy="' + cy + '" r="1.5" fill="#c6cad2"/>' +
        '</g>';
    }
    var skin = '#8d5a3b';
    return svg(
      bikeWheel(30, 45) + bikeWheel(88, 45) +
      // far leg (behind the frame)
      '<g stroke-linecap="round" fill="none">' +
      '<path d="M50.6 22.6L54.6 26.4" stroke="#24375c" stroke-width="4.4"/>' +
      '<path d="M54.6 26.4L57.6 29.4L52.6 39.4" stroke="#7a4d33" stroke-width="2.1" stroke-linejoin="round"/></g>' +
      '<ellipse cx="52" cy="40.4" rx="2.2" ry="1.1" fill="#1f1f24"/>' +
      // frame with halo
      '<path d="' + frame + '" stroke="' + HALO_B + '" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
      '<path d="' + guards + '" stroke="' + HALO_B + '" stroke-width="3.2" stroke-linecap="round" fill="none"/>' +
      '<path d="' + guards + '" stroke="#1b1b22" stroke-width="1.8" stroke-linecap="round" fill="none"/>' +
      '<path d="' + frame + '" stroke="#1b1b22" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
      // chain guard, chainring, cranks
      '<path d="M28 43.4Q41 40.6 57 42.4Q59.4 46 57 49.4Q41 50.4 28 46.8Z" fill="#23232a" stroke="' + HALO + '" stroke-width=".6"/>' +
      '<path d="M51.5 40.8L58.5 51.2" stroke="#2a2a31" stroke-width="1.3" stroke-linecap="round"/>' +
      '<rect x="56.6" y="50.6" width="4" height="1.3" rx=".5" fill="#2a2a31"/><rect x="49.6" y="40.2" width="4" height="1.3" rx=".5" fill="#2a2a31"/>' +
      // saddle, lamp, bell
      '<path d="M43.6 22.6Q49 20.6 55 22.8L54.4 24.6Q49 24 44.2 24.6Z" fill="#4a3022"/>' +
      '<circle cx="82.8" cy="27.6" r="1.8" fill="#ece5c9" stroke="#1b1b22" stroke-width=".6"/>' +
      '<circle cx="75" cy="21.4" r="1" fill="#c6cad2"/>' +
      // rider: shorts, near leg, torso, bag, arm, head
      '<circle cx="50.6" cy="22.2" r="2.9" fill="#2f4a7a"/>' +
      '<g stroke-linecap="round" stroke-linejoin="round" fill="none">' +
      '<path d="M50.6 22.4L55.2 26.8" stroke="#2f4a7a" stroke-width="4.6"/>' +
      '<path d="M55.2 26.8L60.2 31.6L58.8 49.6" stroke="' + skin + '" stroke-width="2.2"/>' +
      '<path d="M50.4 21.4L57.6 12" stroke="#f4f1e9" stroke-width="6.4"/>' +
      '</g>' +
      '<ellipse cx="59.4" cy="50.5" rx="2.5" ry="1.2" fill="#1f1f24"/>' +
      // school bag worn on the back, strap over the shoulder
      '<rect x="47.2" y="12.4" width="5.2" height="8" rx="1.6" fill="#7b4a2b" transform="rotate(38 49.8 16.4)"/>' +
      '<rect x="47.9" y="13.6" width="3.8" height="2.4" rx=".8" fill="#94603d" transform="rotate(38 49.8 16.4)"/>' +
      '<path d="M52.4 11.6Q56 12 57.4 15.8" stroke="#5c341d" stroke-width=".9" stroke-linecap="round" fill="none"/>' +
      '<g stroke-linecap="round" fill="none"><path d="M57.6 12.2L61.4 14.8" stroke="#f4f1e9" stroke-width="3"/>' +
      '<path d="M61.4 14.8L70.2 20.6" stroke="' + skin + '" stroke-width="1.9"/></g>' +
      '<circle cx="60.6" cy="7" r="4.1" fill="' + skin + '"/>' +
      '<path d="M56.6 6.6Q57.2 2.2 61.2 2.6Q64.9 3.1 64.8 6.2Q62.8 4.6 59.8 5.2Q58 5.8 56.6 6.6Z" fill="#1c1512"/>'
    );
  }

  /* --------------------------------------------------------------------
     Train: Indian Railways diesel loco + one blue coach (1980)
     -------------------------------------------------------------------- */
  function train() {
    function smallWheel(cx, cy, r) {
      return '<g class="wheel" style="transform-box:fill-box;transform-origin:center">' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#1a1b20"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 0.3).toFixed(2) + '" fill="none" stroke="' + HALO + '" stroke-width=".45"/>' +
        spokes(cx, cy, r * 0.62, 2, '#9aa1aa', 0.6) +
        '</g>';
    }
    var wins = '';
    for (var i = 0; i < 6; i++) {
      var x = 8.4 + i * 8.2;
      wins += '<rect x="' + x.toFixed(1) + '" y="28.2" width="5.4" height="6.4" rx=".8" fill="#1d3253"/>' +
        '<path d="M' + (x + 0.4).toFixed(1) + ' 30.4H' + (x + 5).toFixed(1) + 'M' + (x + 0.4).toFixed(1) + ' 32.6H' + (x + 5).toFixed(1) + '" stroke="#6f86a8" stroke-width=".4"/>';
    }
    var louvres = '';
    for (var lx = 66; lx < 94; lx += 2.6) louvres += 'M' + lx.toFixed(1) + ' 32V37.4';
    return svg(
      // coach
      '<rect x="5" y="48.4" width="52" height="2.6" fill="#1c1d22"/>' +
      '<path d="M2.6 25.6Q3 21.6 8 21.2L54 21.2Q59 21.6 59.4 25.6Z" fill="#a3acb6" stroke="' + HALO + '" stroke-width=".6"/>' +
      '<rect x="2" y="25" width="58" height="24" rx="2.2" fill="#2d5694" stroke="' + HALO + '" stroke-width=".6"/>' +
      '<rect x="2" y="37.4" width="58" height="3" fill="#efe2c0"/>' +
      '<rect x="3.2" y="27.4" width="3.4" height="19.6" rx=".6" fill="#22457a"/><rect x="55.4" y="27.4" width="3.4" height="19.6" rx=".6" fill="#22457a"/>' +
      wins +
      '<rect x="7" y="49.2" width="16" height="3" rx="1" fill="#26272d"/><rect x="39" y="49.2" width="16" height="3" rx="1" fill="#26272d"/>' +
      '<rect x="59.4" y="44.6" width="3.6" height="2" fill="#2a2b31"/>' +
      // locomotive
      '<rect x="64" y="48.4" width="52" height="2.6" fill="#1c1d22"/>' +
      '<rect x="62.6" y="30" width="34.4" height="19" rx="1.6" fill="#8e2f2b" stroke="' + HALO + '" stroke-width=".6"/>' +
      '<path d="M' + '96 49L96 22.4Q96 20.6 98 20.6L110.4 20.6Q112 20.6 112.4 22.4L113.6 30L116.6 30.8Q118.6 31.6 118.6 34.2L118.6 49Z" fill="#8e2f2b" stroke="' + HALO + '" stroke-width=".6"/>' +
      '<rect x="62.6" y="40" width="56" height="3" fill="#efe2c0"/>' +
      '<path d="' + louvres + '" stroke="#ad4a43" stroke-width=".8"/>' +
      '<path d="M64 45.6H95" stroke="#c9ccd2" stroke-width=".5" opacity=".8"/>' +
      '<rect x="96.6" y="19.2" width="15.2" height="1.6" rx=".6" fill="#5a5f66"/>' +
      '<rect x="99" y="23.2" width="4.8" height="5.8" rx=".6" fill="#bcd5e0"/><rect x="105.6" y="23.2" width="5.4" height="5.8" rx=".6" fill="#bcd5e0"/>' +
      '<rect x="70" y="27.6" width="3" height="2.6" fill="#3a3a40"/>' +
      '<circle cx="118.4" cy="36" r="2.8" fill="#ffe7a8" opacity=".3"/><circle cx="118.4" cy="36" r="1.3" fill="#ffe7a8"/>' +
      '<rect x="64" y="49.2" width="20" height="3" rx="1" fill="#26272d"/><rect x="94.6" y="49.2" width="20" height="3" rx="1" fill="#26272d"/>' +
      smallWheel(11.2, 53.1, 3.9) + smallWheel(18.8, 53.1, 3.9) + smallWheel(43.2, 53.1, 3.9) + smallWheel(50.8, 53.1, 3.9) +
      smallWheel(67.6, 53.8, 3.2) + smallWheel(74.4, 53.8, 3.2) + smallWheel(81.2, 53.8, 3.2) +
      smallWheel(97.6, 53.8, 3.2) + smallWheel(104.4, 53.8, 3.2) + smallWheel(111.2, 53.8, 3.2)
    );
  }

  /* --------------------------------------------------------------------
     Taxi: Bombay Premier Padmini, black body, yellow roof
     -------------------------------------------------------------------- */
  function taxi() {
    var body = 'M9.6 50.2L8.4 41.6Q8.2 36.8 12.4 35.4L33 33.2Q36.8 32.8 39.6 29.4L45 21.6Q46.6 19.6 49.4 19.4L79.6 19.2Q82.6 19.4 84.2 21.6L91.6 31Q93.6 32.8 97 33.2L108.6 34.6Q113 35.4 113.2 39.6L113.4 46.8Q113.4 50.2 110 50.2L100.6 50.2A9.6 9.6 0 0 0 81.4 50.2L40.6 50.2A9.6 9.6 0 0 0 21.4 50.2Z';
    return svg(
      '<path d="' + body + '" fill="#141418" stroke="' + HALO + '" stroke-width=".8"/>' +
      '<path d="M44.2 23.2L46 20.8Q47.4 19.3 49.6 19.2L79.4 19Q81.6 19.2 83 20.8L84.6 23Z" fill="#f2c230"/>' +
      '<path d="M41.4 31.4L46.6 23.8H62V31.4Z" fill="#8fa7b8"/><path d="M65 31.4V23.8H82L88.2 31.4Z" fill="#8fa7b8"/>' +
      '<path d="M48 30.4L52.6 24.8M70 30.4L75 24.8" stroke="#dbe7ee" stroke-width="1.1" opacity=".55"/>' +
      '<path d="M12 39.6H110" stroke="#a8aeb6" stroke-width=".8"/>' +
      '<path d="M63.4 33V48M40.8 33.6V47" stroke="#33333b" stroke-width=".6"/>' +
      '<rect x="56.6" y="35.4" width="3.4" height=".9" rx=".4" fill="#b9bec6"/><rect x="34.4" y="35.6" width="3.2" height=".9" rx=".4" fill="#b9bec6"/>' +
      '<path d="M110.6 44.6H115.2Q116 44.6 116 45.6V47.4Q116 48.4 115.2 48.4H110.6Z" fill="#cfd4da"/>' +
      '<path d="M4 44.6H9.4V48.4H4Q3.2 48.4 3.2 47.4V45.6Q3.2 44.6 4 44.6Z" fill="#cfd4da"/>' +
      '<circle cx="111.4" cy="38.4" r="2.2" fill="#f6efd6" stroke="#c9ced4" stroke-width=".7"/>' +
      '<circle cx="111.6" cy="42.4" r=".9" fill="#f0a63a"/>' +
      '<rect x="8.6" y="37" width="2" height="3.2" rx=".5" fill="#c0392b"/>' +
      '<path d="M50.8 17.6H76.6M53 17.6V19.4M64 17.6V19.2M74.4 17.6V19.4" stroke="#2a2a31" stroke-width="1.1" stroke-linecap="round"/>' +
      '<path d="M50.8 17.6H76.6" stroke="' + HALO + '" stroke-width=".4" transform="translate(0 -.8)"/>' +
      carWheel(31, 49.6, 7.4) + carWheel(91, 49.6, 7.4)
    );
  }

  /* --------------------------------------------------------------------
     Plane: generic airliner, teal and gold tail (no wheels)
     -------------------------------------------------------------------- */
  function plane() {
    var wins = '';
    for (var x = 30; x < 95; x += 3.3) {
      if (x > 34.5 && x < 38) continue;
      if (x > 88 && x < 92) continue;
      wins += '<circle cx="' + x.toFixed(1) + '" cy="29.8" r=".78"/>';
    }
    var fus = 'M22 25.6L98 25.6Q112 26 116.6 31.4Q114.6 36.4 101 37.6L30 37.6Q14 36.6 6.6 29.6L8.6 27.6Q14 25.8 22 25.6Z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="va-plane-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#f2f4f7"/><stop offset="1" stop-color="#d6dce3"/></linearGradient></defs>' +
      '<ellipse cx="62" cy="56.4" rx="30" ry="1.5" fill="#000" opacity=".14"/>' +
      // tail fin with stripes
      '<path d="M10 27.6L5.2 6.6Q5.4 5.6 6.6 5.6L11.6 5.6Q13 5.8 13.8 7L29.6 26.2Z" fill="#f4f6f8" stroke="' + EDGE + '" stroke-width=".6"/>' +
      '<path d="M6.5 12.4L18.2 12.4L24.3 19.8L8.2 19.8Z" fill="#2f7f86"/>' +
      '<path d="M8.45 20.8L25.2 20.8L26.4 22.3L8.8 22.3Z" fill="#d9a441"/>' +
      // fuselage
      '<path d="' + fus + '" fill="url(#va-plane-body)" stroke="' + EDGE + '" stroke-width=".6"/>' +
      '<path d="M8 30.6L1.6 33.4Q1.2 34.2 2.2 34.2L9 33.4L22 32.2Z" fill="#e6eaef" stroke="' + EDGE + '" stroke-width=".5"/>' +
      '<rect x="22" y="32.4" width="84" height="1.4" fill="#2f7f86"/><rect x="22" y="34.1" width="84" height=".6" fill="#d9a441"/>' +
      '<g fill="#3e5566">' + wins + '</g>' +
      '<path d="M35.4 27.6h2.4v5h-2.4zM88.6 27.6h2.4v5h-2.4z" fill="none" stroke="#9aa6b2" stroke-width=".45"/>' +
      '<path d="M105.4 28.4L110.6 28.4Q112.4 29 113.2 30.6L105.4 30.6Z" fill="#2f4556"/>' +
      '<path d="M24 26.4L98 26.4" stroke="#ffffff" stroke-width=".8" opacity=".9"/>' +
      // wing and engine
      '<path d="M50 34.6L74 34.6L62.4 41.4Q61.4 42 60 42L47.4 42Q46.6 41.8 47 41Z" fill="#dce2e8" stroke="' + EDGE + '" stroke-width=".5"/>' +
      '<path d="M64 37.4L68 34.8H71L69.6 37.6Z" fill="#cfd6dd"/>' +
      '<path d="M58.8 39.4Q58.8 37.6 61 37.6L72.6 37.6Q74.6 37.6 74.8 39.8L74.8 42.6Q74.6 44.6 72.6 44.6L61 44.6Q58.8 44.6 58.8 42.8Z" fill="#c9d0d8" stroke="' + EDGE + '" stroke-width=".5"/>' +
      '<ellipse cx="74.5" cy="41.1" rx="1" ry="3.2" fill="#46525f"/>' +
      '<path d="M60.6 39.2H72.8" stroke="#ffffff" stroke-width=".6" opacity=".7"/>' +
      '</svg>';
  }

  /* --------------------------------------------------------------------
     SUV: white Land-Cruiser-like 4x4 (Dubai)
     -------------------------------------------------------------------- */
  function suv() {
    var body = 'M7 47.6L7 17.2Q7 13.6 10.6 13.6L74.4 13.6Q76.4 13.6 77.6 15.2L86.6 27L111 28.2Q114.6 28.6 114.8 32.4L115.2 45.6Q115.2 48.4 112.4 48.4L102.2 48.4A10.2 10.2 0 0 0 81.8 48.4L40.2 48.4A10.2 10.2 0 0 0 19.8 48.4L9.8 48.4Q7 48.4 7 47.6Z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="va-suv-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfbfa"/><stop offset=".6" stop-color="#eef0ef"/><stop offset="1" stop-color="#d3d8dc"/></linearGradient></defs>' +
      '<ellipse cx="60" cy="57.4" rx="47" ry="1.9" fill="#000" opacity=".2"/>' +
      '<path d="M7 21Q2.4 21 2.4 30Q2.4 39 7 39Z" fill="#2b2e34" stroke="' + HALO + '" stroke-width=".5"/>' +
      '<path d="' + body + '" fill="url(#va-suv-body)" stroke="' + EDGE + '" stroke-width=".7"/>' +
      '<path d="M88 27.7L110.4 28.8" stroke="#ffffff" stroke-width=".7" opacity=".9"/>' +
      '<path d="M16 11.8H70M18 11.8V13.6M44 11.8V13.6M68 11.8V13.6" stroke="#2b2e34" stroke-width="1.3" stroke-linecap="round"/>' +
      '<path d="M10.6 16.4H25V26.8H10.6Q9.6 26.8 9.6 25.8V17.4Q9.6 16.4 10.6 16.4Z" fill="#33424f"/>' +
      '<rect x="27.4" y="16.4" width="20.6" height="10.4" rx="1" fill="#33424f"/>' +
      '<path d="M50.4 16.4H73.6Q75 16.4 75.8 17.6L82.8 26.8H50.4Z" fill="#33424f"/>' +
      '<path d="M13.6 25L19 17.6M33 25.2L39 17.6M57 25.4L63.4 17.6" stroke="#8fa4b4" stroke-width="1.1" opacity=".5"/>' +
      '<path d="M26.2 16V46M49.2 16V46" stroke="#c0c6cc" stroke-width=".6"/>' +
      '<rect x="41.6" y="29.6" width="3.6" height="1" rx=".5" fill="#9aa1a9"/><rect x="68.4" y="29.6" width="3.6" height="1" rx=".5" fill="#9aa1a9"/>' +
      '<rect x="7" y="40.4" width="108" height="1.4" fill="#c7ccd1"/>' +
      '<path d="M18.8 48.4A11.2 11.2 0 0 1 41.2 48.4M80.8 48.4A11.2 11.2 0 0 1 103.2 48.4" stroke="#3a3d43" stroke-width="2" fill="none"/>' +
      '<path d="M110.8 41.6H115.6Q116.4 41.6 116.4 42.6V47.6Q116.4 48.6 115.4 48.6H110.8Z" fill="#2b2e34"/>' +
      '<path d="M3.8 41.6H8.8V48.6H4.6Q3.8 48.6 3.8 47.8Z" fill="#2b2e34"/>' +
      '<path d="M110.2 30.2H114.2V34.2H110.2Z" fill="#f6efd4" stroke="#c9ced3" stroke-width=".5"/>' +
      '<rect x="111" y="35.4" width="3" height="1.2" fill="#f0a63a"/>' +
      '<rect x="7.2" y="29.6" width="1.8" height="5" fill="#c43b2f"/>' +
      '<path d="M81.8 22.6L84.4 22.4L85.2 25.6L82.4 25.8Z" fill="#2b2e34"/>' +
      carWheel(30, 48.4, 8.6, '#c9ced4') + carWheel(92, 48.4, 8.6, '#c9ced4') +
      '</svg>';
  }

  /* --------------------------------------------------------------------
     Auto-rickshaw: Bengaluru green body, yellow canopy
     -------------------------------------------------------------------- */
  function auto() {
    return svg(
      // canopy struts behind
      '<path d="M74 13.6V33M46 13.8V22" stroke="#1d1f22" stroke-width="1.2"/>' +
      // passenger seat
      '<path d="M22 33.4L23 24.6Q23.4 22.8 25.4 22.8L34 22.8Q35.6 22.8 35.6 24.6L35 33.4Z" fill="#232527"/>' +
      '<rect x="22" y="30.6" width="27" height="3.4" rx="1" fill="#2c2f32"/>' +
      // rear body
      '<path d="M14.4 48.6L13.6 37.6Q13.8 33.4 18 33L70 33Q73 33 74 35.4L77 48.6L45.8 48.6A9.8 9.8 0 0 0 26.2 48.6Z" fill="#2e8b4d" stroke="' + HALO + '" stroke-width=".6"/>' +
      '<path d="M14 34.6H72.6" stroke="#1d1f22" stroke-width="1.2"/>' +
      '<path d="M15.6 44.2H76" stroke="#1d1f22" stroke-width=".8" opacity=".8"/>' +
      '<path d="M25.4 48.4Q27 40.2 36 40.2Q45 40.2 46.6 48.4" stroke="#1d1f22" stroke-width="1.6" fill="none"/>' +
      '<rect x="46" y="46.6" width="31" height="2" fill="#1d1f22"/>' +
      '<rect x="13.8" y="37.6" width="1.6" height="3" rx=".4" fill="#c0392b"/>' +
      // driver
      '<path d="M77.2 33L78 25.2Q78.6 23 81 23Q83.6 23 84.2 25.4L85 33Z" fill="#b49a62"/>' +
      '<path d="M82.6 25.8L88.4 27.4" stroke="#b49a62" stroke-width="1.8" stroke-linecap="round"/>' +
      '<circle cx="88.8" cy="27.6" r=".9" fill="#7a4a30"/>' +
      '<circle cx="81.4" cy="19.6" r="3.3" fill="#7a4a30"/>' +
      '<path d="M78.2 19.4Q78.4 16 81.6 16.2Q84.6 16.4 84.6 19Q83 17.8 80.8 18.2Q79.2 18.6 78.2 19.4Z" fill="#1c1512"/>' +
      '<path d="M87 26.4L90.6 28" stroke="#1d1f22" stroke-width="1.2" stroke-linecap="round"/>' +
      // front body and mudguard
      '<path d="M76 48.6L79 31.4Q79.6 29.4 82 29.4L98.6 29.4Q101.4 29.4 103 31.6L105.4 36Q106.2 37.8 105.2 39.6L102.6 44L89 44Q87 44 86.4 46L85.6 48.6Z" fill="#2e8b4d" stroke="' + HALO + '" stroke-width=".6"/>' +
      '<path d="M88.4 46.8Q90 41.6 96 41.6Q102 41.6 103.6 46.8L101.8 47Q100.6 43.6 96 43.6Q91.4 43.6 90.2 47Z" fill="#1d1f22"/>' +
      '<path d="M79.2 37.4H104.6" stroke="#1d1f22" stroke-width=".9"/>' +
      '<circle cx="104.4" cy="34.4" r="1.6" fill="#f6ecc8" stroke="#1d1f22" stroke-width=".6"/>' +
      // windscreen and canopy
      '<path d="M86.6 29.6L89.8 15.6L92.6 15.6L99.4 29.6Z" fill="#bcd8e6" opacity=".85" stroke="#1d1f22" stroke-width=".9" stroke-linejoin="round"/>' +
      '<path d="M92.4 15.4Q88 10.2 74 9.6L30 9.6Q17.4 9.8 15.2 16.4L13.4 33.4L17.2 33.4L18.8 18.6Q20.2 13.8 29.6 13.6L74 13.6Q86.6 14 90.6 17.8Z" fill="#f2c230" stroke="' + EDGE + '" stroke-width=".5"/>' +
      '<path d="M90.6 17.8Q86.6 14 74 13.6L29.6 13.6Q20.2 13.8 18.8 18.6L17.2 33.4" stroke="#1d1f22" stroke-width="1.1" fill="none"/>' +
      '<path d="M30 10.4L74 10.4Q86 10.9 90.4 14.4" stroke="#fff3c4" stroke-width=".7" fill="none" opacity=".8"/>' +
      carWheel(36, 50, 7, '#bfc5cc') + carWheel(96, 50.6, 6.4, '#bfc5cc')
    );
  }

  /* --------------------------------------------------------------------
     Bus: a coastal-Karnataka private bus, cream with red and blue
     stripes, route board, luggage on the roof rack, ladder at the back
     -------------------------------------------------------------------- */
  function bus() {
    var body = 'M4.4 48.4L4.4 18.4Q4.4 13.6 9.4 13.6L104.2 13.6Q109.4 13.6 111.2 18.2L115.2 30Q116 32.2 116 35L116 46.4Q116 48.4 114 48.4L103.8 48.4A9.8 9.8 0 0 0 84.2 48.4L35.8 48.4A9.8 9.8 0 0 0 16.2 48.4Z';
    var wins = '';
    for (var i = 0; i < 6; i++) {
      var x = 9.6 + i * 11;
      wins += '<rect x="' + x.toFixed(1) + '" y="17.4" width="9.2" height="10.6" rx="1" fill="#2c3d4f"/>' +
        '<path d="M' + (x + 1.6).toFixed(1) + ' 26.6L' + (x + 5.6).toFixed(1) + ' 18.6" stroke="#8fa4b4" stroke-width=".9" opacity=".45"/>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="va-bus-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf5e6"/><stop offset=".6" stop-color="#f2e8d0"/><stop offset="1" stop-color="#ddd0b2"/></linearGradient></defs>' +
      '<ellipse cx="60" cy="57.4" rx="47" ry="1.9" fill="#000" opacity=".2"/>' +
      // roof rack with luggage
      '<path d="M12 13.6V9.4M38 13.6V9.4M64 13.6V9.4M90 13.6V9.4" stroke="#2b2e34" stroke-width="1.1"/>' +
      '<path d="M10.6 9.6H92.4" stroke="#2b2e34" stroke-width="1.3" stroke-linecap="round"/>' +
      '<path d="M10.6 9.6H92.4" stroke="' + HALO + '" stroke-width=".4" transform="translate(0 -.9)"/>' +
      '<rect x="20" y="4" width="15" height="6" rx="1.4" fill="#8a5a3a" stroke="' + HALO + '" stroke-width=".4"/><path d="M27.5 4V10" stroke="#5e3c26" stroke-width=".8"/>' +
      '<path d="M46 9.8Q46 4.8 52 4.6L62 4.4Q67 4.6 67 9.8Z" fill="#2f6db3" stroke="' + HALO + '" stroke-width=".4"/><path d="M50 9.6L53 4.8M57 9.6L59 4.6M63 9.6L64.6 5" stroke="#e8e1d5" stroke-width=".6"/>' +
      '<rect x="74" y="6" width="9" height="4" rx=".8" fill="#5d4a3a"/>' +
      // body, stripes, swoosh
      '<path d="' + body + '" fill="url(#va-bus-body)" stroke="' + EDGE + '" stroke-width=".7"/>' +
      '<path d="M4.6 32.6H115.4V35.4H4.6Z" fill="#c0392b"/>' +
      '<path d="M4.6 37H115.8V38.8H4.6Z" fill="#2f5d9b"/>' +
      '<path d="M5 45.4Q24 39.6 50 42.6Q34 43.2 16.4 47.4L5 47.6Z" fill="#c0392b" opacity=".85"/>' +
      '<path d="M5 30.4H104" stroke="#d8cbb0" stroke-width=".6"/>' +
      wins +
      // door just behind the front wheel
      '<rect x="75.6" y="17" width="9" height="30.6" rx="1" fill="#e9dfc6" stroke="#b9ab8e" stroke-width=".6"/>' +
      '<rect x="76.8" y="18.4" width="6.6" height="10.6" rx=".8" fill="#2c3d4f"/>' +
      '<rect x="76.4" y="44.4" width="7.4" height="1.6" fill="#7d7363"/>' +
      // windscreen, route board, mirror
      '<path d="M88.4 17.4H105.4Q107.6 17.4 108.6 19.4L112.6 29.6H88.4Z" fill="#a9c4d6"/>' +
      '<path d="M92 28.6L97.6 18.4M99 28.6L104 18.4" stroke="#e6f0f6" stroke-width=".9" opacity=".6"/>' +
      '<path d="M88.4 17.4V29.6" stroke="#b9ab8e" stroke-width=".8"/>' +
      '<rect x="92.6" y="14.4" width="15.4" height="3" rx=".6" fill="#1d2a36"/>' +
      '<path d="M94.2 15.9H96.2M97.4 15.9H100.6M101.8 15.9H103.4M104.4 15.9H106.6" stroke="#f2b134" stroke-width="1.1"/>' +
      '<path d="M113.4 20.4L116.6 21.4V25" stroke="#2b2e34" stroke-width=".9" fill="none"/>' +
      // ladder at the back, lights and bumpers
      '<path d="M6.6 14V40M9.4 14V40M6.6 18H9.4M6.6 22.4H9.4M6.6 26.8H9.4" stroke="#7d7363" stroke-width=".55"/>' +
      '<rect x="4.4" y="39.6" width="1.8" height="4" rx=".5" fill="#c0392b"/>' +
      '<circle cx="114.2" cy="41" r="1.9" fill="#f6efd4" stroke="#c9ced4" stroke-width=".6"/>' +
      '<rect x="112.6" y="44.2" width="2.6" height="1.1" fill="#f0a63a"/>' +
      '<path d="M110.6 46.4H117.4Q118.4 46.4 118.4 47.4V48Q118.4 49 117.4 49H110.6Z" fill="#cfd4da"/>' +
      '<path d="M2.4 46.4H8V49H2.4Q1.6 49 1.6 48.2V47.2Q1.6 46.4 2.4 46.4Z" fill="#cfd4da"/>' +
      '<path d="M15.2 48.4A10.8 10.8 0 0 1 36.8 48.4M83.2 48.4A10.8 10.8 0 0 1 104.8 48.4" stroke="#3a3d43" stroke-width="1.6" fill="none"/>' +
      carWheel(26, 49.2, 7.8, '#c9ced4') + carWheel(94, 49.2, 7.8, '#c9ced4') +
      '</svg>';
  }

  /* --------------------------------------------------------------------
     Hatch: a small early-1990s Indian hatchback (their first car, 1998)
     -------------------------------------------------------------------- */
  function hatch() {
    // short and upright like a Maruti 800: near-vertical hatch, flat roof, raked screen, stubby bonnet
    var body = 'M20.4 48.6L19.6 41Q19.8 33.4 21.2 28.6Q22.4 22.4 28.6 21.8L60.4 21.2Q63.2 21.2 64.8 23.2L74.8 32.4L95.2 34.6Q100.2 35.4 100.6 39.6L100.8 46.6Q100.8 48.6 98.8 48.6L95.2 48.6A9 9 0 0 0 77.2 48.6L44.8 48.6A9 9 0 0 0 26.8 48.6Z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="va-hatch-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#df4b40"/><stop offset=".6" stop-color="#c8342c"/><stop offset="1" stop-color="#a42821"/></linearGradient></defs>' +
      '<ellipse cx="60" cy="57.4" rx="40" ry="1.9" fill="#000" opacity=".2"/>' +
      '<path d="' + body + '" fill="url(#va-hatch-body)" stroke="' + HALO + '" stroke-width=".7"/>' +
      '<path d="M29 22.4L60.2 21.8" stroke="#ffffff" stroke-width=".7" opacity=".45"/>' +
      // glass: rear quarter, rear door, front door
      '<path d="M24.2 30.6Q24.8 25.2 28.6 24.4L33.6 24.2V30.6Z" fill="#33424f"/>' +
      '<rect x="36" y="24.2" width="13.6" height="6.4" rx=".6" fill="#33424f"/>' +
      '<path d="M52.2 24H60.2Q62 24 63 25.2L68.6 30.6H52.2Z" fill="#33424f"/>' +
      '<path d="M26.6 30L29.8 25.2M39.4 30L43 24.6M55.4 30L59 24.4" stroke="#8fa4b4" stroke-width="1" opacity=".5"/>' +
      // door shut lines, handles, belt line, mirror
      '<path d="M35 24.2V46.4M51 24V46.4M69.6 31V46.4" stroke="#8e231d" stroke-width=".7"/>' +
      '<rect x="40.6" y="33.2" width="3.4" height="1" rx=".5" fill="#f1d9d6"/><rect x="59.8" y="33.2" width="3.4" height="1" rx=".5" fill="#f1d9d6"/>' +
      '<path d="M20 36.8H100.4" stroke="#8e231d" stroke-width=".8" opacity=".8"/>' +
      '<path d="M66.4 27.4L69 27L69.4 29.6L66.8 29.8Z" fill="#2b2e34"/>' +
      // lamps and black bumpers
      '<path d="M97.6 36.4H99.8Q100.6 36.6 100.6 37.8V40.2H97.6Z" fill="#f6efd4" stroke="#c9ced4" stroke-width=".5"/>' +
      '<rect x="98.2" y="41" width="2.2" height="1" fill="#f0a63a"/>' +
      '<rect x="19.8" y="31.4" width="1.6" height="4.4" rx=".5" fill="#7a1612"/>' +
      '<path d="M18.2 42.4H22V48.6H19Q18.2 48.6 18.2 47.8Z" fill="#2b2e34" stroke="' + HALO + '" stroke-width=".4"/>' +
      '<path d="M99 42.4H102.6Q103.4 42.4 103.4 43.4V47.6Q103.4 48.6 102.4 48.6H99Z" fill="#2b2e34" stroke="' + HALO + '" stroke-width=".4"/>' +
      '<path d="M25.8 48.6A10 10 0 0 1 45.8 48.6M76.2 48.6A10 10 0 0 1 96.2 48.6" stroke="#3a1a17" stroke-width="1.5" fill="none"/>' +
      carWheel(35.8, 49.4, 6.8, '#c9ced4') + carWheel(86.2, 49.4, 6.8, '#c9ced4') +
      '</svg>';
  }

  window.VehicleArt = {
    bicycle: bicycle,
    train: train,
    taxi: taxi,
    plane: plane,
    suv: suv,
    auto: auto,
    bus: bus,
    hatch: hatch,
    list: ['bicycle', 'train', 'taxi', 'plane', 'suv', 'auto', 'bus', 'hatch']
  };
})();

/*
 * globe.js — the dotted travel globe (Chapter IV · The World).
 *
 *   const globe = Globe.create(canvas, {
 *     dots: window.LAND_DOTS,                       // [lat, lon, lat, lon, ...]
 *     cities: [{ id: 'dxb', name: 'Dubai', lat: 25.2, lon: 55.27 }, ...],
 *     legs: [['dxb', 'par'], ['dxb', 'lon'], ...],  // flown in this order
 *     layout: (w, h) => ({ cx: w / 2, cy: h / 2, r: Math.min(w, h) * 0.42 }),
 *   });
 *   globe.resize();                                   // on load + window resize
 *   globe.set({ progress: 2.4, reveal: 1 });          // from a scrubbed timeline
 *   gsap.ticker.add(() => globe.render(performance.now()));  // only while visible
 *
 * progress ∈ [0, legs.length]: integer part = legs completed, fraction = current leg.
 * reveal   ∈ [0, 1]: the globe assembles out of drifting dots and fades in.
 * overview ∈ [0, 1] (optional): eases the camera from the active leg to a view of the whole network.
 * Drawing is a pure function of (progress, reveal, overview, time); only the camera is smoothed.
 * Plain script, no dependencies.
 */
(function () {
  'use strict';

  var DEG = Math.PI / 180;
  var TAU = Math.PI * 2;

  // palette (night-sky chapter)
  var DOT_RGB = '246,239,226';     // warm white land dots
  var GOLD = '242,200,121';        // #f2c879 arcs + markers
  var HEAD = '255,246,223';        // comet core
  var RIM = '170,198,255';         // cool rim light
  var LABEL = '246,239,226';
  var LABEL_HALO = 'rgba(8,14,36,0.82)';
  var LABEL_FONT = 'Jost, "Helvetica Neue", Arial, sans-serif';

  var Z_BUCKETS = 8;   // depth levels for front dots
  var R_LEVELS = 4;    // alpha levels while the globe assembles
  var ARC_SEGMENTS = 72;
  var TILT_MIN = -20, TILT_MAX = 35;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smoothstep(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function easeOutCubic(t) { t = 1 - clamp(t, 0, 1); return 1 - t * t * t; }
  function hash(i) { var s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

  function vec(lat, lon, out) {
    var p = lat * DEG, l = lon * DEG, c = Math.cos(p);
    out[0] = c * Math.sin(l); out[1] = Math.sin(p); out[2] = c * Math.cos(l);
    return out;
  }
  function toLatLon(v, out) {
    var len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
    out[0] = Math.asin(clamp(v[1] / len, -1, 1)) / DEG;
    out[1] = Math.atan2(v[0], v[2]) / DEG;
    return out;
  }
  // spherical interpolation between unit vectors (nlerp fallback when nearly parallel/opposite)
  function slerp(a, b, t, out) {
    var d = clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1);
    var w = Math.acos(d), s = Math.sin(w);
    var ka, kb;
    if (s < 1e-4) { ka = 1 - t; kb = t; } else { ka = Math.sin((1 - t) * w) / s; kb = Math.sin(t * w) / s; }
    var x = a[0] * ka + b[0] * kb, y = a[1] * ka + b[1] * kb, z = a[2] * ka + b[2] * kb;
    var len = Math.sqrt(x * x + y * y + z * z) || 1;
    out[0] = x / len; out[1] = y / len; out[2] = z / len;
    return out;
  }
  function wrapDelta(from, to) {
    var d = (to - from) % 360;
    if (d > 180) d -= 360; else if (d < -180) d += 360;
    return d;
  }

  function create(canvas, options) {
    options = options || {};
    var ctx = canvas.getContext('2d');
    var layoutFn = options.layout || function (w, h) { return { cx: w / 2, cy: h / 2, r: Math.min(w, h) * 0.42 }; };
    var hasLetterSpacing = typeof CanvasRenderingContext2D !== 'undefined' &&
      'letterSpacing' in CanvasRenderingContext2D.prototype;

    /* ---------- land dots ---------- */
    var src = options.dots || window.LAND_DOTS || [];
    var N = (src.length / 2) | 0;
    var DX = new Float32Array(N), DY = new Float32Array(N), DZ = new Float32Array(N);
    var DELAY = new Float32Array(N);
    var SX = new Float32Array(N), SY = new Float32Array(N);
    var BKT = new Uint8Array(N);
    var ORDER = new Uint32Array(N);
    var tmp = [0, 0, 0];
    for (var i = 0; i < N; i++) {
      vec(src[i * 2], src[i * 2 + 1], tmp);
      DX[i] = tmp[0]; DY[i] = tmp[1]; DZ[i] = tmp[2];
      DELAY[i] = hash(i) * 0.45;
    }
    var BACK = Z_BUCKETS * R_LEVELS;          // first back-hemisphere bucket
    var NB = BACK + R_LEVELS;
    var SKIP = 255;
    var COUNT = new Uint32Array(NB), START = new Uint32Array(NB), FILL = new Uint32Array(NB);
    var B_ALPHA = new Float32Array(NB), B_SIZE = new Float32Array(NB);

    /* ---------- graticule (precomputed polylines, NaN = pen up) ---------- */
    var grat = [];
    (function () {
      var lat, lon;
      for (lon = -180; lon < 180; lon += 30) {
        for (lat = -80; lat <= 80; lat += 5) { vec(lat, lon, tmp); grat.push(tmp[0], tmp[1], tmp[2]); }
        grat.push(NaN, NaN, NaN);
      }
      for (lat = -60; lat <= 60; lat += 30) {
        for (lon = -180; lon <= 180; lon += 5) { vec(lat, lon, tmp); grat.push(tmp[0], tmp[1], tmp[2]); }
        grat.push(NaN, NaN, NaN);
      }
    })();
    var GRAT = new Float32Array(grat);

    /* ---------- cities + legs ---------- */
    var cities = (options.cities || []).map(function (c, k) {
      return {
        id: c.id, name: String(c.name || c.id).toUpperCase(), side: c.side || 'auto',
        lat: c.lat, lon: c.lon, v: vec(c.lat, c.lon, [0, 0, 0]), phase: hash(k + 7),
        arrivedAt: Infinity, // progress value at which this city's marker appears
        label: null,         // cached label sprite
      };
    });
    var byId = {};
    cities.forEach(function (c) { byId[c.id] = c; });
    var legs = (options.legs || []).map(function (pair, k) {
      var a = byId[pair[0]], b = byId[pair[1]];
      if (!a || !b) throw new Error('Globe: unknown city in leg ' + pair);
      var w = Math.acos(clamp(a.v[0] * b.v[0] + a.v[1] * b.v[1] + a.v[2] * b.v[2], -1, 1));
      b.arrivedAt = Math.min(b.arrivedAt, k + 1);
      return { a: a, b: b, w: w, lift: 0.06 + 0.22 * (w / Math.PI), mid: slerp(a.v, b.v, 0.5, [0, 0, 0]) };
    });
    var home = options.home ? byId[options.home] : (legs[0] ? legs[0].a : cities[0]);
    if (home) home.arrivedAt = 0;
    var LEGS = legs.length;
    // overview target: centroid of all cities, pulled towards home
    var overviewV = [0, 0, 0];
    (function () {
      cities.forEach(function (c) { overviewV[0] += c.v[0]; overviewV[1] += c.v[1]; overviewV[2] += c.v[2]; });
      if (home) slerp(home.v, overviewV, 0.5, overviewV); else slerp([0, 0, 1], overviewV, 1, overviewV);
    })();

    // scratch for arcs
    var AX = new Float32Array(ARC_SEGMENTS + 1), AY = new Float32Array(ARC_SEGMENTS + 1);
    var AZ = new Float32Array(ARC_SEGMENTS + 1), AV = new Uint8Array(ARC_SEGMENTS + 1);
    var AS = new Float32Array(ARC_SEGMENTS + 1);
    var pa = [0, 0, 0], pb = [0, 0, 0], pc = [0, 0, 0], ll = [0, 0];

    /* ---------- state ---------- */
    var state = { progress: 0, reveal: 0, overview: 0 };
    var W = 0, H = 0, dpr = 1, L = { cx: 0, cy: 0, r: 100 };
    var cam = { lon: home ? home.lon : 0, lat: home ? clamp(home.lat, TILT_MIN, TILT_MAX) : 0 };
    var lastNow = -1;
    var cleared = true;
    var painted = false;
    var fontReady = false;
    // current rotation (shared by the projector)
    var cl = 1, sl = 0, cp = 1, sp = 0, CX = 0, CY = 0, R = 100;
    var P = { x: 0, y: 0, z: 0 };

    // cached gradients in unit space (drawn under translate+scale)
    var gAtmos = null, gBody = null, gFresnel = null;
    function buildPaint() {
      gAtmos = ctx.createRadialGradient(0, 0, 0.9, 0, 0, 1.32);
      gAtmos.addColorStop(0, 'rgba(120,158,255,0.30)');
      gAtmos.addColorStop(0.22, 'rgba(110,150,255,0.13)');
      gAtmos.addColorStop(0.6, 'rgba(100,140,255,0.035)');
      gAtmos.addColorStop(1, 'rgba(100,140,255,0)');
      gBody = ctx.createRadialGradient(-0.38, -0.42, 0.02, 0, 0, 1.02);
      gBody.addColorStop(0, '#24386d');
      gBody.addColorStop(0.5, '#152553');
      gBody.addColorStop(1, '#0a1433');
      gFresnel = ctx.createRadialGradient(0, 0, 0.62, 0, 0, 1);
      gFresnel.addColorStop(0, 'rgba(' + RIM + ',0)');
      gFresnel.addColorStop(0.82, 'rgba(' + RIM + ',0.05)');
      gFresnel.addColorStop(1, 'rgba(' + RIM + ',0.22)');
      painted = true;
    }

    function resize() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      var cap = W < 700 ? 1.5 : 2;
      dpr = Math.min(window.devicePixelRatio || 1, cap);
      var bw = Math.max(1, Math.round(W * dpr)), bh = Math.max(1, Math.round(H * dpr));
      if (canvas.width !== bw) canvas.width = bw;
      if (canvas.height !== bh) canvas.height = bh;
      L = layoutFn(W, H) || L;
      buildPaint();
      dropLabels();
      cleared = false;
    }

    function set(s) {
      if (!s) return;
      if (s.progress != null && isFinite(s.progress)) state.progress = clamp(+s.progress, 0, LEGS);
      if (s.reveal != null && isFinite(s.reveal)) state.reveal = clamp(+s.reveal, 0, 1);
      if (s.overview != null && isFinite(s.overview)) state.overview = clamp(+s.overview, 0, 1);
    }

    function setCamera(lat, lon) {
      var p = lat * DEG, l = lon * DEG;
      cl = Math.cos(l); sl = Math.sin(l); cp = Math.cos(p); sp = Math.sin(p);
    }
    // rotate a (possibly lifted) vector into camera space → P (unit sphere = radius 1)
    function rot(x, y, z) {
      var x1 = x * cl - z * sl, z1 = x * sl + z * cl;
      P.x = x1; P.y = y * cp - z1 * sp; P.z = y * sp + z1 * cp;
    }

    /* ---------- camera target as a function of progress ---------- */
    function legTarget(k, f, out) {
      var leg = legs[k];
      slerp(leg.a.v, leg.b.v, f, pa);
      return slerp(leg.mid, pa, 0.4, out);
    }
    function cameraTarget(p, ov, out) {
      if (!LEGS) { pb[0] = overviewV[0]; pb[1] = overviewV[1]; pb[2] = overviewV[2]; return toLatLon(pb, out); }
      var k = Math.floor(p), f = p - k;
      if (k >= LEGS) { k = LEGS - 1; f = 1; }
      legTarget(k, f, pb);
      if (f < 0.3) {
        if (k > 0) legTarget(k - 1, 1, pc); else { pc[0] = home.v[0]; pc[1] = home.v[1]; pc[2] = home.v[2]; }
        slerp(pc, pb, smoothstep(0, 0.3, f), pb);
      }
      if (ov > 0) slerp(pb, overviewV, smoothstep(0, 1, ov), pb);
      return toLatLon(pb, out);
    }

    /* ---------- dots ---------- */
    function drawDots(gA, reveal, dotBase) {
      var zb, rl, b, i, x, y, z, x1, z1, yp, zp, local, k;
      for (zb = 0; zb < Z_BUCKETS; zb++) {
        z = (zb + 0.5) / Z_BUCKETS;
        var aZ = 0.14 + 0.86 * Math.pow(z, 0.7);
        var sZ = dotBase * (0.5 + 0.5 * z);
        for (rl = 0; rl < R_LEVELS; rl++) {
          b = zb * R_LEVELS + rl;
          B_ALPHA[b] = aZ * ((rl + 1) / R_LEVELS);
          B_SIZE[b] = sZ;
        }
      }
      for (rl = 0; rl < R_LEVELS; rl++) {
        B_ALPHA[BACK + rl] = 0.07 * ((rl + 1) / R_LEVELS);
        B_SIZE[BACK + rl] = dotBase * 0.62;
      }
      COUNT.fill(0);
      var assembling = reveal < 1;
      for (i = 0; i < N; i++) {
        x = DX[i]; y = DY[i]; z = DZ[i];
        x1 = x * cl - z * sl; z1 = x * sl + z * cl;
        yp = y * cp - z1 * sp; zp = y * sp + z1 * cp;
        var spread = 1;
        rl = R_LEVELS - 1;
        if (assembling) {
          local = (reveal - DELAY[i]) / 0.55;
          if (local <= 0) { BKT[i] = SKIP; continue; }
          if (local < 1) {
            rl = Math.min(R_LEVELS - 1, (local * R_LEVELS) | 0);
            var e = 1 - easeOutCubic(local);
            spread = 1 + 0.6 * e * e;
          }
        }
        if (zp > 0) {
          zb = (zp * Z_BUCKETS) | 0; if (zb >= Z_BUCKETS) zb = Z_BUCKETS - 1;
          b = zb * R_LEVELS + rl;
        } else {
          b = BACK + rl;
        }
        BKT[i] = b;
        COUNT[b]++;
        SX[i] = CX + R * x1 * spread;
        SY[i] = CY - R * yp * spread;
      }
      var acc = 0;
      for (b = 0; b < NB; b++) { START[b] = acc; FILL[b] = acc; acc += COUNT[b]; }
      for (i = 0; i < N; i++) { b = BKT[i]; if (b !== SKIP) ORDER[FILL[b]++] = i; }

      ctx.fillStyle = 'rgb(' + DOT_RGB + ')';
      var n, s, h, end;
      // back hemisphere first (seen through the glass): tiny and faint, so plain squares
      for (b = BACK; b < NB; b++) {
        n = COUNT[b];
        if (!n) continue;
        s = B_SIZE[b]; h = s * 0.5;
        ctx.globalAlpha = B_ALPHA[b] * gA;
        end = START[b] + n;
        for (k = START[b]; k < end; k++) { i = ORDER[k]; ctx.fillRect(SX[i] - h, SY[i] - h, s, s); }
      }
      // front hemisphere, far → near. One path per dot on purpose: a lone circle takes the GPU's
      // analytic-circle fast path and batches well, whereas one path of thousands of circles
      // was measured at half the frame rate.
      for (b = 0; b < BACK; b++) {
        n = COUNT[b];
        if (!n) continue;
        h = B_SIZE[b] * 0.5;
        ctx.globalAlpha = B_ALPHA[b] * gA;
        end = START[b] + n;
        for (k = START[b]; k < end; k++) {
          i = ORDER[k];
          ctx.beginPath();
          ctx.arc(SX[i], SY[i], h, 0, TAU);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    function drawGraticule(alpha) {
      if (alpha <= 0.001) return;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = 'rgb(' + RIM + ')';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      var pen = false;
      for (var j = 0; j < GRAT.length; j += 3) {
        var x = GRAT[j];
        if (x !== x) { pen = false; continue; } // NaN → pen up
        rot(x, GRAT[j + 1], GRAT[j + 2]);
        if (P.z <= 0.02) { pen = false; continue; }
        var sx = CX + R * P.x, sy = CY - R * P.y;
        if (pen) ctx.lineTo(sx, sy); else { ctx.moveTo(sx, sy); pen = true; }
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    /* ---------- arcs ---------- */
    // sample leg k from s=0 to s=sEnd into AX/AY/AZ/AV/AS; returns the last index
    function sampleLeg(k, sEnd) {
      var leg = legs[k];
      var n = Math.max(2, Math.ceil(ARC_SEGMENTS * sEnd));
      for (var j = 0; j <= n; j++) {
        var s = sEnd * (j / n);
        slerp(leg.a.v, leg.b.v, s, pa);
        var lift = 1 + leg.lift * Math.sin(Math.PI * s);
        rot(pa[0] * lift, pa[1] * lift, pa[2] * lift);
        AX[j] = CX + R * P.x; AY[j] = CY - R * P.y; AZ[j] = P.z; AS[j] = s;
        // hidden only when behind the planet's centre plane AND inside its disc
        AV[j] = (P.z >= 0 || P.x * P.x + P.y * P.y >= 1) ? 1 : 0;
      }
      return n;
    }

    // stroke in small groups so alpha can ramp along the arc and dim where it passes behind the limb
    function strokeArc(n, ramp, alphaBase, width, sEnd, group) {
      ctx.lineWidth = width;
      for (var j = 1; j <= n; j += group) {
        var jEnd = Math.min(n, j + group - 1);
        var behind = false;
        for (var q = j - 1; q <= jEnd; q++) if (AV[q] && AZ[q] < 0) { behind = true; break; }
        var t = sEnd > 0 ? AS[jEnd] / sEnd : 1;
        ctx.globalAlpha = alphaBase * (ramp ? 0.12 + 0.88 * Math.pow(t, 1.6) : 1) * (behind ? 0.32 : 1);
        ctx.beginPath();
        var pen = false;
        for (q = j - 1; q <= jEnd; q++) {
          if (!AV[q]) { pen = false; continue; }
          if (pen) ctx.lineTo(AX[q], AY[q]); else { ctx.moveTo(AX[q], AY[q]); pen = true; }
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function drawArcs(p, aA, sc) {
      if (aA <= 0.001 || !LEGS) return;
      var done = Math.floor(p), f = p - done;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgb(' + GOLD + ')';
      for (var k = 0; k < Math.min(done, LEGS); k++) {
        strokeArc(sampleLeg(k, 1), false, 0.36 * aA, 1.1 * sc, 1, 8);
      }
      if (done < LEGS && f > 0.001) {
        var m = sampleLeg(done, f);
        strokeArc(m, true, 0.16 * aA, 5.2 * sc, f, 4);  // glow
        strokeArc(m, true, 0.95 * aA, 1.6 * sc, f, 4);  // core
        if (AV[m]) {
          var hx = AX[m], hy = AY[m], ha = aA * (AZ[m] < 0 ? 0.45 : 1);
          ctx.fillStyle = 'rgb(' + GOLD + ')';
          ctx.globalAlpha = 0.13 * ha;
          ctx.beginPath(); ctx.arc(hx, hy, 9 * sc, 0, TAU); ctx.fill();
          ctx.globalAlpha = 0.3 * ha;
          ctx.beginPath(); ctx.arc(hx, hy, 4.6 * sc, 0, TAU); ctx.fill();
          ctx.globalAlpha = ha;
          ctx.fillStyle = 'rgb(' + HEAD + ')';
          ctx.beginPath(); ctx.arc(hx, hy, 2.1 * sc, 0, TAU); ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }

    /* ---------- city labels (cached sprites with a dark halo) ---------- */
    function labelFont(px) { return '500 ' + px + 'px ' + LABEL_FONT; }
    function dropLabels() { for (var c = 0; c < cities.length; c++) cities[c].label = null; }
    function buildLabel(city, px) {
      var spacing = Math.round(px * 0.2);
      ctx.save();
      ctx.font = labelFont(px);
      if (hasLetterSpacing) ctx.letterSpacing = spacing + 'px';
      var textW = ctx.measureText(city.name).width + (hasLetterSpacing ? 0 : spacing * (city.name.length - 1));
      ctx.restore();
      var pad = 3, cw = Math.ceil(textW + pad * 2), ch = Math.ceil(px * 1.8);
      var cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.round(cw * dpr)); cv.height = Math.max(1, Math.round(ch * dpr));
      var g = cv.getContext('2d');
      g.scale(dpr, dpr);
      g.font = labelFont(px);
      g.textBaseline = 'middle';
      if (hasLetterSpacing) g.letterSpacing = spacing + 'px';
      g.lineJoin = 'round';
      g.lineWidth = 3;
      g.strokeStyle = LABEL_HALO;
      g.fillStyle = 'rgb(' + LABEL + ')';
      for (var pass = 0; pass < 2; pass++) {
        var x = pad;
        if (hasLetterSpacing) {
          if (pass === 0) g.strokeText(city.name, x, ch / 2); else g.fillText(city.name, x, ch / 2);
        } else {
          for (var i = 0; i < city.name.length; i++) {
            var chr = city.name[i];
            if (pass === 0) g.strokeText(chr, x, ch / 2); else g.fillText(chr, x, ch / 2);
            x += g.measureText(chr).width + spacing;
          }
        }
      }
      city.label = { canvas: cv, w: cw, h: ch, pad: pad, px: px };
      return city.label;
    }

    function drawMarkers(p, aA, sc, now) {
      if (aA <= 0.001) return;
      placedCount = 0;
      var px = R < 190 ? 10 : 11;
      for (var c = 0; c < cities.length; c++) {
        var city = cities[c];
        if (city.arrivedAt === Infinity) continue;
        var appear = city.arrivedAt === 0 ? 1 : smoothstep(city.arrivedAt - 0.1, city.arrivedAt, p);
        if (appear <= 0.001) continue;
        rot(city.v[0], city.v[1], city.v[2]);
        if (P.z <= 0) continue;
        var vis = appear * aA * smoothstep(0, 0.2, P.z);
        if (vis <= 0.001) continue;
        var x = CX + R * P.x, y = CY - R * P.y;
        var isHome = city === home;

        // ambient pulse ring
        var ph = ((now / 2600) + city.phase) % 1;
        ctx.strokeStyle = 'rgb(' + GOLD + ')';
        ctx.lineWidth = 1;
        ctx.globalAlpha = vis * 0.5 * Math.pow(1 - ph, 1.5);
        ctx.beginPath(); ctx.arc(x, y, (3 + 11 * ph) * sc, 0, TAU); ctx.stroke();
        // arrival ping (scrubbed with progress)
        if (!isHome) {
          var since = p - city.arrivedAt;
          if (since >= 0 && since < 0.45) {
            var u = since / 0.45;
            ctx.globalAlpha = vis * 0.9 * (1 - u);
            ctx.lineWidth = 1.3;
            ctx.beginPath(); ctx.arc(x, y, (4 + 26 * easeOutCubic(u)) * sc, 0, TAU); ctx.stroke();
          }
        }
        // dot
        ctx.globalAlpha = vis;
        ctx.fillStyle = 'rgb(' + GOLD + ')';
        ctx.beginPath(); ctx.arc(x, y, (isHome ? 2.8 : 2.3) * sc, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgb(' + HEAD + ')';
        ctx.beginPath(); ctx.arc(x, y, (isHome ? 1.2 : 1) * sc, 0, TAU); ctx.fill();

        // label: right of the marker (left near the right limb), else the other side, above or
        // below; skipped when nothing fits — always inside the canvas and clear of other labels
        var la = vis * smoothstep(0.04, 0.2, P.z);
        if (la > 0.01) {
          var lab = city.label && city.label.px === px ? city.label : buildLabel(city, px);
          var gap = 9 * Math.max(sc, 0.85) - lab.pad;
          var side = city.side !== 'auto' ? city.side : (x - CX > 0.35 * R ? 'left' : 'right');
          var midY = y - lab.h / 2 + 0.5;
          var leftX = x - gap - lab.w, rightX = x + gap, centreX = clamp(x - lab.w / 2, 4, W - 4 - lab.w);
          var cx1 = side === 'left' ? leftX : rightX, cx2 = side === 'left' ? rightX : leftX;
          var lx = -1, ly = midY;
          if (labelFits(cx1, midY, lab)) lx = cx1;
          else if (labelFits(cx2, midY, lab)) lx = cx2;
          else if (labelFits(centreX, y - gap - lab.h + lab.pad, lab)) { lx = centreX; ly = y - gap - lab.h + lab.pad; }
          else if (labelFits(centreX, y + gap - lab.pad, lab)) { lx = centreX; ly = y + gap - lab.pad; }
          if (lx >= 0) {
            placed[placedCount * 4] = lx; placed[placedCount * 4 + 1] = ly;
            placed[placedCount * 4 + 2] = lab.w; placed[placedCount * 4 + 3] = lab.h;
            placedCount++;
            ctx.globalAlpha = la;
            ctx.drawImage(lab.canvas, lx, ly, lab.w, lab.h);
          }
        }
      }
      ctx.globalAlpha = 1;
    }
    var placed = new Float32Array(Math.max(1, cities.length) * 4), placedCount = 0;
    function overlapsPlaced(x, y, lab) {
      for (var q = 0; q < placedCount; q++) {
        var px = placed[q * 4], py = placed[q * 4 + 1], pw = placed[q * 4 + 2], ph = placed[q * 4 + 3];
        if (x < px + pw + 2 && x + lab.w + 2 > px && y + 3 < py + ph && y + lab.h > py + 3) return true;
      }
      return false;
    }
    function labelFits(x, y, lab) {
      return x >= 4 && x + lab.w <= W - 4 && y >= 2 && y + lab.h <= H - 2 && !overlapsPlaced(x, y, lab);
    }

    /* ---------- frame ---------- */
    function render(now) {
      if (now == null) now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      if (!painted) resize();
      var reveal = state.reveal, p = state.progress;
      if (W < 2 || H < 2) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reveal <= 0) {
        if (!cleared) { ctx.clearRect(0, 0, W, H); cleared = true; }
        lastNow = now;
        return;
      }
      cleared = false;
      ctx.clearRect(0, 0, W, H);

      // labels built before the web font arrived are rebuilt once it has loaded
      if (!fontReady && document.fonts && document.fonts.check('500 11px ' + LABEL_FONT)) {
        fontReady = true;
        dropLabels();
      }

      // camera: smooth follow of the progress-driven target (+ slow idle drift)
      cameraTarget(p, state.overview, ll);
      var tLat = clamp(ll[0], TILT_MIN, TILT_MAX), tLon = ll[1];
      var dt = lastNow < 0 ? 1e9 : now - lastNow;
      if (dt > 400) { cam.lat = tLat; cam.lon = tLon; }
      else {
        var k = 1 - Math.exp(-dt / 320);
        cam.lon += wrapDelta(cam.lon, tLon) * k;
        cam.lat += (tLat - cam.lat) * k;
      }
      lastNow = now;
      setCamera(cam.lat + 1.5 * Math.sin(now / 15000), cam.lon + 5 * Math.sin(now / 11000));

      var eased = easeOutCubic(reveal);
      var gA = smoothstep(0, 0.5, reveal);
      CX = L.cx; CY = L.cy; R = L.r * (0.88 + 0.12 * eased);
      var sc = clamp(R / 300, 0.72, 1.35);

      // atmosphere + body (unit-space gradients)
      ctx.save();
      ctx.translate(CX, CY); ctx.scale(R, R);
      ctx.globalAlpha = gA;
      ctx.fillStyle = gAtmos;
      ctx.beginPath(); ctx.arc(0, 0, 1.32, 0, TAU); ctx.fill();
      ctx.globalAlpha = gA * 0.96;
      ctx.fillStyle = gBody;
      ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill();
      ctx.restore();

      drawGraticule(0.055 * gA);
      drawDots(gA, reveal, Math.max(1.05, R * 0.0105));

      // fresnel + rim light
      ctx.save();
      ctx.translate(CX, CY); ctx.scale(R, R);
      ctx.globalAlpha = gA;
      ctx.fillStyle = gFresnel;
      ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 0.38 * gA;
      ctx.strokeStyle = 'rgb(' + RIM + ')';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1;

      var aA = smoothstep(0.7, 1, reveal);
      drawArcs(p, aA, sc);
      drawMarkers(p, aA, sc, now);
    }

    // screen position of any lat/lon with the current camera (handy for pinning DOM to a city)
    function project(lat, lon) {
      vec(lat, lon, tmp);
      rot(tmp[0], tmp[1], tmp[2]);
      return { x: CX + R * P.x, y: CY - R * P.y, visible: P.z > 0, depth: P.z };
    }

    function destroy() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      gAtmos = gBody = gFresnel = null;
      painted = false;
      dropLabels();
    }

    // ask for the label face up front (canvas text alone may not trigger the download)
    if (document.fonts && document.fonts.load) {
      document.fonts.load('500 11px ' + LABEL_FONT).then(function () {
        if (document.fonts.check('500 11px ' + LABEL_FONT)) { fontReady = true; dropLabels(); }
      }, function () {});
    }

    resize();
    return {
      resize: resize,
      set: set,
      render: render,
      project: project,
      destroy: destroy,
      get state() { return { progress: state.progress, reveal: state.reveal, overview: state.overview, legs: LEGS }; },
    };
  }

  window.Globe = { create: create };
})();

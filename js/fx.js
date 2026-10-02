/* ==========================================================================
   FX
   Canvas effects: stars, shooting stars, fireworks, the name that turns
   into stars, monsoon rain, and the "life in weeks" grid.
   Every effect is a pure function of the state the scroll timeline sets,
   plus wall-clock time for ambient motion.
   ========================================================================== */
(function () {
  'use strict';

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  function fitCanvas(canvas, cap) {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, cap);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    return { w, h, dpr };
  }

  /* ------------------------------------------------------------------------
     SKY: stars, shooting stars, fireworks, name particles
     --------------------------------------------------------------------- */
  function Sky(canvas) {
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1;
    let stars = [];
    const shoots = [];
    const sparks = [];
    const rockets = [];
    const flashes = [];
    let nextShoot = 0, nextRocket = 0, lastT = 0;
    let homesA = null, homesB = null, targets = null, pcount = 0, pmeta = null;
    let dirty = true, wasEmpty = false;

    const st = { night: 1, fireworks: 0, nameOut: 0, nameIn: 0, nameGone: 0, fwX: 0.5, fwY: 0.3, groundY: 0.8, rays: 0, sunX: 64, sunY: 112 };

    function resize() {
      const r = fitCanvas(canvas, 1.75);
      W = r.w; H = r.h; dpr = r.dpr;
      const n = Math.round(clamp(W * H / 2400, 140, 560));
      stars = [];
      for (let i = 0; i < n; i++) {
        const big = Math.random() < 0.06;
        stars.push({
          x: Math.random() * W,
          y: Math.pow(Math.random(), 1.35) * H * 0.88,
          r: big ? 1.1 + Math.random() * 0.9 : 0.35 + Math.pow(Math.random(), 2.2) * 1.0,
          a: 0.35 + Math.random() * 0.65,
          tw: 0.4 + Math.random() * 2.2,
          ph: Math.random() * Math.PI * 2,
          warm: Math.random() < 0.25,
          big
        });
      }
      dirty = true;
    }

    function shoot(x, y) {
      const ang = Math.PI * (0.78 + Math.random() * 0.1);
      const sp = 900 + Math.random() * 500;
      shoots.push({ x: x != null ? x : W * (0.3 + Math.random() * 0.7), y: y != null ? y : H * (0.05 + Math.random() * 0.3), vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0, max: 0.75 + Math.random() * 0.35 });
    }

    function launch() {
      const x0 = W * clamp(st.fwX + (Math.random() - 0.5) * 0.75, 0.06, 0.94);
      const y1 = H * (0.08 + Math.random() * 0.3);
      rockets.push({ x: W * st.fwX + (Math.random() - 0.5) * 30, y: H * st.groundY, tx: x0, ty: y1, t: 0, d: 0.75 + Math.random() * 0.4 });
    }

    function burst(x, y) {
      const palettes = [['#ffd27a', '#fff3c4'], ['#ff8fb1', '#ffd6e4'], ['#8fe3ff', '#e2f8ff'], ['#c7a4ff', '#f0e6ff'], ['#ffffff', '#ffe9b0']];
      const pal = palettes[Math.floor(Math.random() * palettes.length)];
      const n = 110 + Math.floor(Math.random() * 70);
      const sp = 190 + Math.random() * 170;
      flashes.push({ x, y, life: 0, c: pal[0] });
      const ring = Math.random() < 0.3;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.08;
        const v = ring ? sp : sp * (0.35 + Math.random() * 0.65);
        sparks.push({ x, y, px: x, py: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 1.3 + Math.random() * 0.9, c: pal[i % 2] });
      }
    }

    /* text → point cloud */
    function sampleText(lines, step) {
      const off = document.createElement('canvas');
      off.width = Math.max(1, Math.round(W));
      off.height = Math.max(1, Math.round(H));
      const o = off.getContext('2d');
      o.fillStyle = '#fff';
      lines.forEach((ln) => {
        o.font = ln.font;
        o.textBaseline = 'alphabetic';
        o.textAlign = ln.align || 'left';
        if ('letterSpacing' in o) o.letterSpacing = ln.spacing || '0px';
        if ('fontKerning' in o) o.fontKerning = 'none';
        o.fillText(ln.text, ln.x, ln.y);
      });
      const img = o.getImageData(0, 0, off.width, off.height).data;
      const pts = [];
      for (let y = 0; y < off.height; y += step) {
        for (let x = (y / step) % 2 ? step / 2 : 0; x < off.width; x += step) {
          if (img[(Math.floor(y) * off.width + Math.floor(x)) * 4 + 3] > 120) pts.push([x, y]);
        }
      }
      return pts;
    }

    /* Read the glyph boxes of the hero name so the particles match the type. */
    function nameFromDom(chars) {
      const lines = [];
      const probe = document.createElement('canvas').getContext('2d');
      chars.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width) return;
        const cs = getComputedStyle(el);
        const pl = parseFloat(cs.paddingLeft) || 0, pt = parseFloat(cs.paddingTop) || 0, pb = parseFloat(cs.paddingBottom) || 0;
        const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        probe.font = font;
        const m = probe.measureText(el.textContent);
        const fa = m.fontBoundingBoxAscent || parseFloat(cs.fontSize) * 0.9;
        const fd = m.fontBoundingBoxDescent || parseFloat(cs.fontSize) * 0.3;
        const top = r.top + pt, ch = r.height - pt - pb;
        const y = top + (ch - (fa + fd)) / 2 + fa;
        lines.push({ text: el.textContent, font, x: r.left + pl, y, spacing: cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing });
      });
      return lines;
    }

    function setName(chars, finaleSpec) {
      if (!W) resize();
      const step = W < 700 ? 3 : 4;
      homesA = sampleText(nameFromDom(chars), step);
      if (finaleSpec) homesB = sampleText(finaleSpec(W, H), step);
      pcount = homesA.length;
      if (homesB && homesB.length) {
        homesA.sort((a, b) => a[0] - b[0]);
        homesB.sort((a, b) => a[0] - b[0]);
      }
      targets = [];
      pmeta = [];
      for (let i = 0; i < pcount; i++) {
        targets.push([Math.random() * W, Math.pow(Math.random(), 1.2) * H * 0.62]);
        pmeta.push({ d: Math.random(), s: 0.6 + Math.random() * 1.1, ph: Math.random() * 6.28, sw: (Math.random() - 0.5) * 2 });
      }
      dirty = true;
    }

    function drawParticles(t) {
      if (!homesA || !pcount) return;
      const out = st.nameOut, inn = st.nameIn;
      if (out <= 0.001 && inn <= 0.001) return;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < pcount; i++) {
        const m = pmeta[i];
        const ha = homesA[i], tg = targets[i];
        let x, y, a, s;
        if (inn > 0.001 && homesB) {
          const hb = homesB[Math.floor(i * homesB.length / pcount)];
          const q = easeInOut(clamp((inn - m.d * 0.35) / 0.65, 0, 1));
          x = lerp(tg[0], hb[0], q) + Math.sin(q * Math.PI) * m.sw * 60;
          y = lerp(tg[1], hb[1], q) - Math.sin(q * Math.PI) * 40;
          a = lerp(0.55 + 0.45 * Math.sin(t * m.s + m.ph), 0.95, q) * (1 - st.nameGone);
          s = lerp(1.1, 1.6, q);
        } else {
          const q = easeInOut(clamp((out - m.d * 0.4) / 0.6, 0, 1));
          x = lerp(ha[0], tg[0], q) + Math.sin(q * Math.PI) * m.sw * 70;
          y = lerp(ha[1], tg[1], q) - Math.sin(q * Math.PI) * 50;
          a = q < 1 ? lerp(0.95, 0.7, q) : 0.55 + 0.45 * Math.sin(t * m.s + m.ph);
          a *= q > 0.6 ? st.night + (1 - q) : 1;
          s = lerp(1.7, 1.1, q);
        }
        if (a <= 0.01) continue;
        ctx.globalAlpha = clamp(a, 0, 1);
        ctx.fillStyle = (i % 5 === 0) ? '#ffd88f' : '#fff6e2';
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      }
      ctx.restore();
    }

    function drawRays(t) {
      const a = st.rays;
      if (a < 0.01) return;
      const cx = st.sunX / 100 * W, cy = st.sunY / 100 * H;
      const L = Math.hypot(W, H) * 1.05;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, L * 0.6);
      g.addColorStop(0, `rgba(255,238,206,${(0.3 * a).toFixed(3)})`);
      g.addColorStop(0.35, `rgba(255,232,196,${(0.11 * a).toFixed(3)})`);
      g.addColorStop(1, 'rgba(255,232,196,0)');
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g;
      ctx.beginPath();
      const n = 22, rot = t * 0.012, wdg = (Math.PI * 2 / n) * 0.34;
      for (let i = 0; i < n; i++) {
        const a0 = rot + i / n * Math.PI * 2 + Math.sin(i * 7.3) * 0.05;
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, L, a0, a0 + wdg * (0.7 + 0.6 * ((i * 37) % 10) / 10));
        ctx.closePath();
      }
      ctx.fill();
      ctx.restore();
    }

    function frame(now) {
      const t = now / 1000;
      const dt = Math.min(0.05, lastT ? t - lastT : 0.016);
      lastT = t;
      const night = st.night;
      const fw = st.fireworks;
      const hasName = (st.nameOut > 0.001 && st.nameOut < 0.999) || st.nameIn > 0.001 || (st.nameOut >= 0.999 && night > 0.01);
      const active = night > 0.01 || fw > 0.01 || st.rays > 0.01 || sparks.length || rockets.length || flashes.length || shoots.length || hasName;
      if (!active) {
        if (!wasEmpty || dirty) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); wasEmpty = true; dirty = false; }
        return;
      }
      wasEmpty = false;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      drawRays(t);

      if (night > 0.01) {
        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          const tw = 0.62 + 0.38 * Math.sin(t * s.tw + s.ph);
          ctx.globalAlpha = s.a * tw * night;
          ctx.fillStyle = s.warm ? '#ffe7c2' : '#eef2ff';
          if (s.big) {
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
            ctx.globalAlpha *= 0.25;
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 3.2, 0, 6.283); ctx.fill();
          } else {
            ctx.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
          }
        }
        if (night > 0.7 && t > nextShoot) {
          if (nextShoot) shoot();
          nextShoot = t + 3.5 + Math.random() * 5;
        }
      }
      ctx.globalAlpha = 1;

      for (let i = shoots.length - 1; i >= 0; i--) {
        const s = shoots[i];
        s.life += dt;
        s.x += s.vx * dt; s.y += s.vy * dt;
        const k = s.life / s.max;
        if (k >= 1) { shoots.splice(i, 1); continue; }
        const tail = 0.11;
        const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * tail, s.y - s.vy * tail);
        g.addColorStop(0, `rgba(255,248,230,${(1 - k) * 0.95})`);
        g.addColorStop(1, 'rgba(255,248,230,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * tail, s.y - s.vy * tail); ctx.stroke();
      }

      if (fw < 0.01 && rockets.length) rockets.length = 0;
      const sparkDecay = fw < 0.01 ? 3.5 : 1;
      if (fw > 0.5 && t > nextRocket) { launch(); if (Math.random() < 0.45) launch(); nextRocket = t + 0.16 + Math.random() * 0.34; }
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.t += dt / r.d;
        const k = easeOut(clamp(r.t, 0, 1));
        const x = lerp(r.x, r.tx, k), y = lerp(r.y, r.ty, k);
        ctx.fillStyle = 'rgba(255,230,180,.9)';
        ctx.fillRect(x - 1, y - 1, 2, 2);
        ctx.fillStyle = 'rgba(255,200,120,.25)';
        ctx.fillRect(x - 0.6, y, 1.2, 14);
        if (r.t >= 1) { burst(r.tx, r.ty); rockets.splice(i, 1); }
      }
      for (let i = flashes.length - 1; i >= 0; i--) {
        const fl = flashes[i];
        fl.life += dt;
        if (fl.life > 0.45) { flashes.splice(i, 1); continue; }
        const k = 1 - fl.life / 0.45;
        const g = ctx.createRadialGradient(fl.x, fl.y, 0, fl.x, fl.y, 130);
        g.addColorStop(0, `rgba(255,240,210,${0.42 * k})`);
        g.addColorStop(1, 'rgba(255,240,210,0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.fillRect(fl.x - 130, fl.y - 130, 260, 260);
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.life += dt * sparkDecay;
        if (p.life > p.max) { sparks.splice(i, 1); continue; }
        p.px = p.x; p.py = p.y;
        p.vx *= 0.985; p.vy = p.vy * 0.985 + 70 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        const k = 1 - p.life / p.max;
        ctx.globalAlpha = k * (0.6 + 0.4 * Math.sin(p.life * 30 + i));
        ctx.strokeStyle = p.c; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(p.px - (p.x - p.px) * 2.2, p.py - (p.y - p.py) * 2.2); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      ctx.restore();
      ctx.globalAlpha = 1;

      drawParticles(t);
    }

    return { st, resize, frame, shoot, setName };
  }

  /* ------------------------------------------------------------------------
     RAIN (front layer)
     --------------------------------------------------------------------- */
  function Rain(canvas) {
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1, drops = [], splashes = [], lastT = 0, flash = 0, nextFlash = 0, cleared = true;
    const st = { amount: 0, ground: 0.86 };
    function resize() {
      const r = fitCanvas(canvas, 1.25);
      W = r.w; H = r.h; dpr = r.dpr;
      const n = Math.round(clamp(W * H / 1500, 220, 900));
      drops = [];
      for (let i = 0; i < n; i++) drops.push({ x: Math.random() * W * 1.2, y: Math.random() * H, l: 12 + Math.random() * 18, v: 900 + Math.random() * 600, a: 0.18 + Math.random() * 0.35, z: Math.random() });
      cleared = false;
    }
    function frame(now) {
      const t = now / 1000, dt = Math.min(0.05, lastT ? t - lastT : 0.016);
      lastT = t;
      const amt = st.amount;
      if (amt < 0.01 && !splashes.length && flash <= 0) {
        if (!cleared) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); cleared = true; }
        return;
      }
      cleared = false;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (amt > 0.85 && t > nextFlash) { if (nextFlash) flash = 1; nextFlash = t + 6 + Math.random() * 6; }
      if (flash > 0) {
        const f = flash > 0.6 ? (flash - 0.6) * 2.5 : flash * 0.5;
        ctx.fillStyle = `rgba(235,240,255,${f * 0.28})`;
        ctx.fillRect(0, 0, W, H);
        flash -= dt * 2.2;
      }
      const n = Math.floor(drops.length * amt);
      const wind = -0.22;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#dfe9f5';
      for (let i = 0; i < n; i++) {
        const d = drops[i];
        d.y += d.v * dt * (0.6 + d.z * 0.6);
        d.x += d.v * dt * wind * (0.6 + d.z * 0.6);
        if (d.y > H * st.ground + d.z * H * 0.1) {
          if (Math.random() < 0.3) splashes.push({ x: d.x, y: d.y, r: 0, a: 0.5 });
          d.y = -d.l - Math.random() * 60; d.x = Math.random() * W * 1.2;
        }
        ctx.globalAlpha = d.a * (0.5 + d.z * 0.7);
        ctx.lineWidth = 0.7 + d.z * 0.9;
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.l * wind, d.y - d.l); ctx.stroke();
      }
      ctx.lineWidth = 1;
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        s.r += dt * 26; s.a -= dt * 1.6;
        if (s.a <= 0) { splashes.splice(i, 1); continue; }
        ctx.globalAlpha = s.a;
        ctx.beginPath(); ctx.ellipse(s.x, s.y, s.r, s.r * 0.3, 0, Math.PI, 0); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    return { st, resize, frame };
  }

  /* ------------------------------------------------------------------------
     LIFE IN WEEKS
     --------------------------------------------------------------------- */
  function Weeks(canvas, opts) {
    const ctx = canvas.getContext('2d');
    const years = opts.years, born = opts.born;
    const eras = opts.eras;          // [{from, to, color}]
    const marks = opts.marks || [];  // [{year, week}]
    const limit = opts.limit || years * 52;
    let W = 0, H = 0, dpr = 1, cell = 8, lastFilled = -1, lastSize = '';
    const base = document.createElement('canvas');
    const bctx = base.getContext('2d');
    const st = { p: 0 };
    function colorFor(year) {
      for (const e of eras) if (year >= e.from && year <= e.to) return e.color;
      return '#888';
    }
    const COLS = 104, ROWS = Math.ceil(years / 2);
    function resize() {
      const cssW = canvas.clientWidth || 520;
      cell = cssW / COLS;
      W = cssW; H = cell * ROWS;
      canvas.style.height = H + 'px';
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = base.width = Math.round(W * dpr);
      canvas.height = base.height = Math.round(H * dpr);
      lastFilled = -1;
    }
    function paintBase(filled) {
      const total = years * 52;
      const r = Math.max(1, cell * 0.32);
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bctx.clearRect(0, 0, W, H);
      for (let i = 0; i < total; i++) {
        const y = Math.floor(i / COLS), x = i % COLS;
        const cx = x * cell + cell / 2, cy = y * cell + cell / 2;
        if (i < filled) { bctx.globalAlpha = 0.95; bctx.fillStyle = colorFor(born + Math.floor(i / 52)); }
        else { bctx.globalAlpha = 0.16; bctx.fillStyle = '#f6efe2'; }
        bctx.beginPath(); bctx.arc(cx, cy, r, 0, 6.283); bctx.fill();
      }
      bctx.globalAlpha = 1;
    }
    function frame(now) {
      const size = canvas.clientWidth + 'x' + canvas.clientHeight;
      if (size !== lastSize) { lastSize = size; resize(); }
      const filled = Math.floor(limit * clamp(st.p, 0, 1));
      if (filled !== lastFilled) { paintBase(filled); lastFilled = filled; }
      const t = now / 1000;
      const r = Math.max(1, cell * 0.32);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(base, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      marks.forEach((m, k) => {
        const i = (m.year - born) * 52 + m.week;
        if (i >= filled) return;
        const y = Math.floor(i / COLS), x = i % COLS;
        const cx = x * cell + cell / 2, cy = y * cell + cell / 2;
        const pulse = 0.5 + 0.5 * Math.sin(t * 2.4 + k);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cell * 3);
        g.addColorStop(0, `rgba(255,236,180,${0.8 * pulse + 0.2})`);
        g.addColorStop(1, 'rgba(255,236,180,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, cell * 3, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#fff8e6';
        ctx.beginPath(); ctx.arc(cx, cy, r * 1.25, 0, 6.283); ctx.fill();
      });
    }
    return { st, resize, frame };
  }

  window.FX = { Sky, Rain, Weeks, fitCanvas };
})();

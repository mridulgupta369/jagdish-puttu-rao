/* ==========================================================================
   GENIE
   Milestone cards pour out of the vehicle like the macOS dock "genie".
   The card is painted once into an offscreen canvas; every frame we draw it
   row by row, squeezing each row into a funnel that ends at the vehicle.
   p = 0 → inside the vehicle, p = 1 → full screen.
   ========================================================================== */
(function () {
  'use strict';

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  /* ---------- text helpers ---------- */
  function spaced(ctx, text, x, y, spacing, align) {
    const chars = [...text];
    const widths = chars.map((c) => ctx.measureText(c).width);
    const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
    let cx = align === 'center' ? x - total / 2 : x;
    const prev = ctx.textAlign;
    ctx.textAlign = 'left';
    chars.forEach((c, i) => { ctx.fillText(c, cx, y); cx += widths[i] + spacing; });
    ctx.textAlign = prev;
    return total;
  }
  function wrap(ctx, text, maxW) {
    const words = text.split(/\s+/);
    const lines = [];
    let line = '';
    words.forEach((w) => {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
      else line = test;
    });
    if (line) lines.push(line);
    return lines;
  }
  function archPath(ctx, x, y, w, h) {
    const r = w / 2;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.arc(x + r, y + r, r, Math.PI, 0);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
  }
  function cover(ctx, img, x, y, w, h) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    const s = Math.max(w / iw, h / ih);
    const dw = iw * s, dh = ih * s;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) * 0.55, dw, dh);
  }

  const DISPLAY = '"Cormorant Garamond", Georgia, serif';
  const UI = '"Jost", "Segoe UI", system-ui, sans-serif';

  /* ---------- the card ---------- */
  function paintCard(ctx, W, H, dpr, spec) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pal = spec.palette;
    const portrait = W / H < 0.95;
    const short = !portrait && H < 560;
    const topSafe = portrait ? 74 : short ? 56 : Math.max(86, H * 0.12);
    const botSafe = (spec.bottomSafe || 70) + (portrait ? 18 : short ? 12 : Math.max(24, H * 0.05));

    const g = ctx.createLinearGradient(0, 0, W * 0.5, H);
    g.addColorStop(0, pal.bg2);
    g.addColorStop(1, pal.bg1);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    /* text metrics first, so the arch can take what is left */
    const textW = portrait ? Math.min(W * 0.86, 520) : Math.min(W * 0.4, 560);
    const titleSize = portrait ? clamp(W * 0.1, 32, 52) : clamp(Math.min(W * 0.052, H * 0.1), 28, 92);
    const bodySize = portrait ? clamp(W * 0.037, 13.5, 16) : clamp(Math.min(W * 0.0122, H * 0.03), 12, 19);
    const lh = bodySize * 1.66;
    ctx.font = `italic 400 ${titleSize}px ${DISPLAY}`;
    const titleLines = wrap(ctx, spec.title, textW);
    ctx.font = `400 ${bodySize}px ${UI}`;
    const bodyLines = wrap(ctx, spec.body, textW);
    const noteSize = bodySize * 1.32;
    const textH = 14 + 22 + titleLines.length * titleSize * 1.02 + 26 + 18 + bodyLines.length * lh + (spec.note ? 18 + noteSize : 0) - (short ? 20 : 0);

    let ax, ay, aw, ah, tx, ty;
    if (portrait) {
      const room = H - topSafe - botSafe - textH - 30;
      ah = clamp(room, 150, H * 0.5);
      aw = Math.min(ah * 0.79, W * 0.7);
      ah = aw / 0.79;
      ax = (W - aw) / 2;
      ay = topSafe + Math.max(0, (room - ah) * 0.35);
      tx = W / 2;
      ty = ay + ah + 32;
    } else {
      const usable = H - topSafe - botSafe;
      ah = Math.min(usable * 0.94, W * 0.36 / 0.79);
      aw = ah * 0.79;
      ax = Math.max(W * 0.07, W * 0.29 - aw / 2);
      ay = topSafe + (usable - ah) / 2;
      tx = ax + aw + Math.max(48, W * 0.065);
      ty = ay + ah / 2 - textH / 2;
    }

    /* halo rings */
    const hx = ax + aw / 2, hy = ay + ah * 0.48;
    const rg = ctx.createRadialGradient(hx, hy, 0, hx, hy, Math.max(W, H) * 0.7);
    rg.addColorStop(0, hexA(pal.accent, 0.16));
    rg.addColorStop(0.45, hexA(pal.accent, 0.04));
    rg.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = hexA(pal.accent, 0.08);
    ctx.lineWidth = 1;
    for (let i = 1; i <= 7; i++) { ctx.beginPath(); ctx.arc(hx, hy, ah * 0.36 * i, 0, Math.PI * 2); ctx.stroke(); }

    /* big year */
    ctx.fillStyle = hexA(pal.accent, 0.07);
    ctx.textBaseline = 'alphabetic';
    if (portrait) {
      ctx.font = `300 ${W * 0.56}px ${DISPLAY}`;
      ctx.textAlign = 'center';
      ctx.fillText(spec.year, W / 2, H - botSafe + W * 0.12);
    } else {
      ctx.font = `300 ${H * 0.46}px ${DISPLAY}`;
      ctx.textAlign = 'right';
      ctx.fillText(spec.year, W - W * 0.03, H - botSafe + H * 0.1);
    }

    /* arch with art */
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.45)';
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 24;
    archPath(ctx, ax, ay, aw, ah);
    ctx.fillStyle = pal.bg1;
    ctx.fill();
    ctx.restore();
    ctx.save();
    archPath(ctx, ax, ay, aw, ah);
    ctx.clip();
    if (spec.img) cover(ctx, spec.img, ax, ay, aw, ah);
    const shade = ctx.createLinearGradient(0, ay + ah * 0.7, 0, ay + ah);
    shade.addColorStop(0, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(0,0,0,.18)');
    ctx.fillStyle = shade;
    ctx.fillRect(ax, ay, aw, ah);
    /* until the family's photo arrives, say which photo belongs here */
    if (spec.placeholder && !spec.photo) {
      const pz = clamp(aw * 0.055, 11, 17);
      const cx = ax + aw / 2, by = ay + ah * 0.8;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(74,58,46,.62)';
      ctx.font = `600 ${pz * 0.66}px ${UI}`;
      spaced(ctx, 'PHOTO TO COME', cx, by, pz * 0.22, 'center');
      ctx.fillStyle = 'rgba(58,44,34,.86)';
      ctx.font = `italic 500 ${pz * 1.3}px ${DISPLAY}`;
      wrap(ctx, spec.placeholder, aw * 0.8).forEach((l, i) => ctx.fillText(l, cx, by + pz * 1.75 + i * pz * 1.35));
    }
    ctx.restore();
    ctx.strokeStyle = hexA(pal.accent, 0.9);
    ctx.lineWidth = 1.4;
    archPath(ctx, ax, ay, aw, ah); ctx.stroke();
    ctx.strokeStyle = hexA(pal.accent, 0.45);
    ctx.lineWidth = 1;
    archPath(ctx, ax - 10, ay - 10, aw + 20, ah + 20); ctx.stroke();
    ctx.fillStyle = pal.accent;
    ctx.save(); ctx.translate(ax + aw / 2, ay - 10); ctx.rotate(Math.PI / 4); ctx.fillRect(-4, -4, 8, 8); ctx.restore();

    /* text */
    const align = portrait ? 'center' : 'left';
    ctx.textAlign = align;
    let y = ty + 12;
    ctx.fillStyle = pal.accent;
    ctx.font = `600 ${portrait ? 10.5 : 12}px ${UI}`;
    spaced(ctx, spec.kicker.toUpperCase(), tx, y, portrait ? 2.6 : 3.4, align);
    y += 22 + titleSize * 0.9;
    ctx.fillStyle = pal.text;
    ctx.font = `italic 400 ${titleSize}px ${DISPLAY}`;
    titleLines.forEach((l) => { ctx.fillText(l, tx, y); y += titleSize * 1.02; });
    y += 4;
    ctx.strokeStyle = hexA(pal.accent, 0.8);
    ctx.lineWidth = 1;
    const ox = portrait ? tx : tx + 46;
    ctx.beginPath(); ctx.moveTo(ox - 46, y); ctx.lineTo(ox - 10, y); ctx.moveTo(ox + 10, y); ctx.lineTo(ox + 46, y); ctx.stroke();
    ctx.save(); ctx.translate(ox, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = pal.accent; ctx.fillRect(-3.5, -3.5, 7, 7); ctx.restore();
    y += 22 + bodySize;
    ctx.fillStyle = hexA(pal.text, 0.88);
    ctx.font = `400 ${bodySize}px ${UI}`;
    bodyLines.forEach((l) => { ctx.fillText(l, tx, y); y += lh; });
    if (spec.note) {
      y += 14;
      ctx.fillStyle = pal.accent;
      ctx.font = `italic 400 ${noteSize}px ${DISPLAY}`;
      ctx.fillText(spec.note, tx, y + noteSize * 0.4);
    }

    /* corner ticks */
    ctx.strokeStyle = hexA(pal.accent, 0.35);
    ctx.lineWidth = 1;
    const c = portrait ? 14 : 26, L = 22;
    [[c, c, 1, 1], [W - c, c, -1, 1], [c, H - c, 1, -1], [W - c, H - c, -1, -1]].forEach(([x0, y0, sx, sy]) => {
      ctx.beginPath(); ctx.moveTo(x0 + sx * L, y0); ctx.lineTo(x0, y0); ctx.lineTo(x0, y0 + sy * L); ctx.stroke();
    });
  }

  /* ---------- renderer ---------- */
  function create(canvas) {
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1, visible = false, lastKey = '';
    const cache = {};

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, W * H > 1.6e6 ? 1.5 : 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      Object.keys(cache).forEach((k) => delete cache[k]);
      lastKey = '';
    }

    function texture(id, spec) {
      const key = W + 'x' + H + '@' + dpr;
      const hit = cache[id];
      if (hit && hit.key === key) return hit.canvas;
      const ids = Object.keys(cache);
      if (ids.length >= 3) delete cache[ids[0]];
      const tex = document.createElement('canvas');
      tex.width = Math.round(W * dpr);
      tex.height = Math.round(H * dpr);
      paintCard(tex.getContext('2d'), W, H, dpr, spec);
      cache[id] = { canvas: tex, key };
      return tex;
    }

    function hide() {
      if (!visible) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.visibility = 'hidden';
      visible = false;
      lastKey = '';
    }

    /* icon: the vehicle's box in CSS px {x: centre, y: top, w, h} */
    function render(id, spec, p, icon, simple) {
      if (p <= 0.0005) { hide(); return; }
      const key = id + '|' + p.toFixed(4) + '|' + icon.x.toFixed(1) + '|' + icon.y.toFixed(1);
      if (key === lastKey) return;
      lastKey = key;
      if (!visible) { canvas.style.visibility = 'visible'; visible = true; }
      const tex = texture(id, spec);
      const Wd = canvas.width, Hd = canvas.height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, Wd, Hd);
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(4,5,14,${0.5 * smooth(0, 0.55, p)})`;
      ctx.fillRect(0, 0, Wd, Hd);

      if (simple) { ctx.globalAlpha = smooth(0, 1, p); ctx.drawImage(tex, 0, 0); ctx.globalAlpha = 1; return; }

      const m = 1 - p;
      if (m < 0.0008) { ctx.drawImage(tex, 0, 0); return; }

      const ix = icon.x * dpr, iy = Math.max(40, icon.y) * dpr;
      const iw = Math.max(10, icon.w) * dpr, ih = Math.max(6, icon.h) * dpr;
      const bend = smooth(0, 0.46, m);
      const slideK = clamp((m - 0.2) / 0.8, 0, 1);
      const slide = slideK * slideK;
      const top = lerp(0, iy, slide);
      const bottom = lerp(Hd, iy + ih, smooth(0, 0.5, m));
      const span = bottom - top;
      if (span < 1) return;
      const fadeOut = m > 0.88 ? 1 - (m - 0.88) / 0.12 : 1;
      ctx.globalAlpha = clamp(fadeOut, 0, 1);
      const band = Math.max(1, Math.round(dpr * (Hd > 2400 ? 1.5 : 1)));
      const th = tex.height, tw = tex.width;
      const funTop = iy * 0.04;
      const sig = (u) => { const a = Math.pow(u, 2.3); return a / (a + Math.pow(1 - u, 2.3)); };
      for (let y = Math.floor(top); y < bottom; y += band) {
        const v0 = (y - top) / span;
        const v1 = Math.min(1, (y + band - top) / span);
        const sy = v0 * th;
        const sh = Math.max(1, (v1 - v0) * th);
        const k = bend * sig(clamp((y + band * 0.5 - funTop) / (iy - funTop), 0, 1));
        const left = lerp(0, ix - iw / 2, k);
        const right = lerp(Wd, ix + iw / 2, k);
        ctx.drawImage(tex, 0, sy, tw, sh, left, y, right - left, band + 0.5);
      }
      ctx.globalAlpha = 1;
    }

    return { resize, render, hide, prepare: (id, spec) => texture(id, spec), has: (id) => !!(cache[id] && cache[id].key === W + 'x' + H + '@' + dpr) };
  }

  window.Genie = { create, paintCard };
})();

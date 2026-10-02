/* ==========================================================================
   FIGURES
   A small parametric illustrator for the people in the story.
   Every person is faceless and built from simple shapes, with jointed
   legs/arms (groups .fg-leg / .fg-arm carrying their pivot points) so the
   scroll timeline can make them walk.
   ========================================================================== */
(function () {
  'use strict';

  let uid = 0;
  const f = (n) => Math.round(n * 100) / 100;

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const t = amt < 0 ? 0 : 255, a = Math.abs(amt);
    r = Math.round((t - r) * a + r);
    g = Math.round((t - g) * a + g);
    b = Math.round((t - b) * a + b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /* Body proportions in viewBox units. Feet sit on the bottom edge. */
  const BODY = {
    man:     { W: 120, cx: 60, headY: 34, headR: 17,   neckW: 10, shY: 64, shH: 24, waistH: 19, hipY: 160, ankY: 306, footY: 316, legW: 15, legDX: 8,   armW: 11, armEndY: 154, handR: 6,   armOut: 3 },
    woman:   { W: 120, cx: 60, headY: 37, headR: 16,   neckW: 9,  shY: 66, shH: 20, waistH: 15, hipY: 158, ankY: 302, footY: 312, legW: 13, legDX: 7,   armW: 10, armEndY: 150, handR: 5.5, armOut: 3 },
    child:   { W: 100, cx: 50, headY: 30, headR: 17,   neckW: 8,  shY: 55, shH: 16, waistH: 13, hipY: 114, ankY: 184, footY: 192, legW: 11, legDX: 6,   armW: 9,  armEndY: 110, handR: 5,   armOut: 2 },
    toddler: { W: 80,  cx: 40, headY: 26, headR: 15,   neckW: 7,  shY: 45, shH: 12, waistH: 11, hipY: 88,  ankY: 128, footY: 134, legW: 10, legDX: 5,   armW: 8,  armEndY: 84,  handR: 4.5, armOut: 2 }
  };

  function figure(o) {
    o = o || {};
    const type = o.type || 'man';
    const p = BODY[type];
    const { cx, headY, headR: r, shY, shH, waistH, hipY, ankY, footY, legW, legDX, armW, armEndY, handR, armOut } = p;
    const id = 'fg' + (++uid);
    const skin = o.skin || '#8b5a3c';
    const skinD = shade(skin, -0.16);
    const hairC = o.hairColor || '#17120f';
    const top = o.top || { kind: 'shirt', color: '#efe8da' };
    const bottom = o.bottom || { kind: 'trousers', color: '#3a3a4a' };
    const shoe = o.shoe || '#2b2420';
    const kneeY = hipY + (ankY - hipY) * 0.47;
    const L = cx - shH, R = cx + shH;
    const skirt = bottom.kind === 'saree' || bottom.kind === 'mundu';
    const tc = top.color;
    const sleeve = top.sleeve || ((top.kind === 'suit' || top.kind === 'kurta') ? 'full' : (top.kind === 'blouse' ? 'short' : 'half'));
    const t = headY - r;

    /* ---------- view box (kite needs a tall extended box) ---------- */
    let vbX = 0, vbY = 0, vbW = p.W, vbH = footY + 3;
    if (o.prop === 'kite') { vbY = -330; vbW = 270; vbH = footY + 3 + 330; }
    if (o.prop === 'trunk' || o.prop === 'briefcase') { vbW = p.W + 16; }

    const defs = `<defs>
      <linearGradient id="${id}-ts" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".2"/><stop offset=".46" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".07"/></linearGradient>
      <radialGradient id="${id}-hs" cx=".64" cy=".34" r=".78"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></radialGradient>
    </defs>`;

    /* ---------- hair that sits behind the body ---------- */
    let back = '';
    if (o.hair === 'long') {
      back += `<path d="M${f(cx - r - 2)},${f(headY - 2)} C${f(cx - r - 6)},${f(shY + 6)} ${f(cx - r - 8)},${f(shY + 30)} ${f(cx - r - 4)},${f(shY + 44)} L${f(cx + r + 4)},${f(shY + 44)} C${f(cx + r + 8)},${f(shY + 30)} ${f(cx + r + 6)},${f(shY + 6)} ${f(cx + r + 2)},${f(headY - 2)} Z" fill="${hairC}"/>`;
    }
    if (o.hair === 'bun' || o.hair === 'greybun') {
      back += `<circle cx="${f(cx + r * 0.9)}" cy="${f(headY - r * 0.42)}" r="${f(r * 0.44)}" fill="${hairC}"/>`;
    }
    if (o.hair === 'pigtails') {
      back += `<ellipse cx="${f(cx - r - 5)}" cy="${f(headY + 8)}" rx="5" ry="9.5" transform="rotate(22 ${f(cx - r - 5)} ${f(headY + 8)})" fill="${hairC}"/>`;
      back += `<ellipse cx="${f(cx + r + 5)}" cy="${f(headY + 8)}" rx="5" ry="9.5" transform="rotate(-22 ${f(cx + r + 5)} ${f(headY + 8)})" fill="${hairC}"/>`;
    }
    if (o.hair === 'braid') {
      back += `<path d="M${f(cx - r)},${f(headY)} C${f(cx - r - 4)},${f(shY)} ${f(cx + r + 4)},${f(shY)} ${f(cx + r)},${f(headY)} Z" fill="${hairC}"/>`;
    }
    /* the end of the saree pallu falls behind the shoulder */
    if (bottom.kind === 'saree') {
      back += `<path d="M${f(R - 7)},${f(shY - 4)} C${f(R + 6)},${f(shY + 10)} ${f(R + 9)},${f(hipY)} ${f(R + 6)},${f(hipY + 26)} L${f(R - 4)},${f(hipY + 22)} C${f(R - 2)},${f(hipY - 10)} ${f(R - 6)},${f(shY + 20)} ${f(R - 7)},${f(shY - 4)} Z" fill="${shade(bottom.color, -0.12)}"/>`;
      back += `<path d="M${f(R + 6)},${f(hipY + 26)} L${f(R - 4)},${f(hipY + 22)} L${f(R - 4.3)},${f(hipY + 15)} L${f(R + 7)},${f(hipY + 19)} Z" fill="${bottom.border || '#d8a64a'}"/>`;
    }

    /* ---------- legs ---------- */
    function leg(side) {
      const lx = cx + side * legDX;
      const y0 = hipY - 12;
      let s = '';
      if (skirt) {
        s += `<rect x="${f(lx - legW * 0.36)}" y="${f(ankY - 44)}" width="${f(legW * 0.72)}" height="48" rx="${f(legW * 0.36)}" fill="${skin}"/>`;
      } else if (bottom.kind === 'shorts' || top.kind === 'frock') {
        s += `<rect x="${f(lx - legW * 0.4)}" y="${f(kneeY - 10)}" width="${f(legW * 0.8)}" height="${f(ankY - kneeY + 12)}" rx="${f(legW * 0.4)}" fill="${skin}"/>`;
        if (bottom.kind === 'shorts') s += `<rect x="${f(lx - legW / 2 - 1)}" y="${f(y0)}" width="${f(legW + 2)}" height="${f(kneeY - y0 + 2)}" rx="4" fill="${bottom.color}"/>`;
      } else {
        s += `<rect x="${f(lx - legW / 2)}" y="${f(y0)}" width="${f(legW)}" height="${f(ankY - y0 + 2)}" rx="${f(legW / 2)}" fill="${bottom.color}"/>`;
        s += `<rect x="${f(lx - legW / 2)}" y="${f(y0)}" width="${f(legW / 2.4)}" height="${f(ankY - y0 + 2)}" rx="${f(legW / 4.8)}" fill="#000" opacity=".1"/>`;
      }
      const sw = legW * 0.68, sx = lx + side * 1.4;
      s += `<path d="M${f(sx - sw)},${f(footY)} C${f(sx - sw)},${f(footY - 10)} ${f(sx + sw)},${f(footY - 10)} ${f(sx + sw)},${f(footY)} Z" fill="${shoe}"/>`;
      return `<g class="fg-leg" data-px="${f(lx)}" data-py="${f(hipY - 8)}">${s}</g>`;
    }
    const legs = leg(-1) + leg(1);

    /* ---------- pelvis / lower garment ---------- */
    let lower = '';
    if (bottom.kind === 'trousers' || bottom.kind === 'shorts') {
      lower += `<path d="M${f(cx - waistH - 1)},${f(hipY - 14)} L${f(cx + waistH + 1)},${f(hipY - 14)} L${f(cx + waistH + 1)},${f(hipY + 8)} Q${f(cx)},${f(hipY + 16)} ${f(cx - waistH - 1)},${f(hipY + 8)} Z" fill="${bottom.color}"/>`;
    }
    if (bottom.kind === 'mundu') {
      const wy = hipY - 12, hem = ankY + 1, hw = waistH + 2, hh = waistH + 6;
      const c = bottom.color || '#f6f1e6', b = bottom.border || '#c9973a';
      lower += `<path d="M${f(cx - hw)},${f(wy)} L${f(cx + hw)},${f(wy)} L${f(cx + hh)},${f(hem)} L${f(cx - hh)},${f(hem)} Z" fill="${c}"/>`;
      lower += `<path d="M${f(cx - hw)},${f(wy)} L${f(cx + hw)},${f(wy)} L${f(cx + hh)},${f(hem)} L${f(cx - hh)},${f(hem)} Z" fill="url(#${id}-ts)"/>`;
      lower += `<path d="M${f(cx - hh)},${f(hem - 6)} L${f(cx + hh)},${f(hem - 6)} L${f(cx + hh)},${f(hem)} L${f(cx - hh)},${f(hem)} Z" fill="${b}"/>`;
      lower += `<path d="M${f(cx + 5)},${f(wy + 4)} L${f(cx + 8)},${f(hem)} L${f(cx + 11)},${f(hem)} L${f(cx + 8)},${f(wy + 4)} Z" fill="${b}"/>`;
      lower += `<rect x="${f(cx - hw - 0.5)}" y="${f(wy - 2)}" width="${f(hw * 2 + 1)}" height="7" rx="3" fill="${shade(c, -0.07)}"/>`;
    }
    if (bottom.kind === 'saree') {
      const wy = hipY - 16, hem = ankY + 2, hw = waistH + 1, hh = waistH + 12;
      const c = bottom.color, b = bottom.border || '#d8a64a';
      lower += `<path d="M${f(cx - hw)},${f(wy)} L${f(cx + hw)},${f(wy)} L${f(cx + hh)},${f(hem)} Q${f(cx)},${f(hem + 4)} ${f(cx - hh)},${f(hem)} Z" fill="${c}"/>`;
      lower += `<path d="M${f(cx - hw)},${f(wy)} L${f(cx + hw)},${f(wy)} L${f(cx + hh)},${f(hem)} Q${f(cx)},${f(hem + 4)} ${f(cx - hh)},${f(hem)} Z" fill="url(#${id}-ts)"/>`;
      lower += `<path d="M${f(cx - hh)},${f(hem)} Q${f(cx)},${f(hem + 4)} ${f(cx + hh)},${f(hem)} L${f(cx + hh - 0.8)},${f(hem - 8)} Q${f(cx)},${f(hem - 4)} ${f(cx - hh + 0.8)},${f(hem - 8)} Z" fill="${b}"/>`;
      lower += `<path d="M${f(cx + 2)},${f(wy + 22)} L${f(cx + 5)},${f(hem - 9)} M${f(cx + 6)},${f(wy + 24)} L${f(cx + 11)},${f(hem - 9)} M${f(cx + 10)},${f(wy + 26)} L${f(cx + 17)},${f(hem - 9)}" stroke="${shade(c, -0.25)}" stroke-width="1.1" opacity=".55" fill="none"/>`;
    }

    /* ---------- torso / upper garment ---------- */
    function torsoD(bottomY, hemHalf) {
      return `M${f(L + 6)},${f(shY - 5)} Q${f(cx)},${f(shY - 10)} ${f(R - 6)},${f(shY - 5)} Q${f(R + 1.5)},${f(shY - 3)} ${f(R + 1.5)},${f(shY + 9)} L${f(cx + hemHalf)},${f(bottomY)} Q${f(cx)},${f(bottomY + 2)} ${f(cx - hemHalf)},${f(bottomY)} L${f(L - 1.5)},${f(shY + 9)} Q${f(L - 1.5)},${f(shY - 3)} ${f(L + 6)},${f(shY - 5)} Z`;
    }
    let torso = '';
    const shadeOver = (d) => `<path d="${d}" fill="url(#${id}-ts)"/>`;
    if (top.kind === 'shirt' || top.kind === 'tee') {
      const d = torsoD(hipY + 2, waistH + 1);
      torso += `<path d="${d}" fill="${tc}"/>` + shadeOver(d);
      if (top.kind === 'shirt') {
        const cc = shade(tc, -0.12);
        torso += `<path d="M${f(cx - 7)},${f(shY - 7)} L${f(cx)},${f(shY + 3)} L${f(cx - 1)},${f(shY + 7)} L${f(cx - 10)},${f(shY - 2)} Z M${f(cx + 7)},${f(shY - 7)} L${f(cx)},${f(shY + 3)} L${f(cx + 1)},${f(shY + 7)} L${f(cx + 10)},${f(shY - 2)} Z" fill="${cc}"/>`;
        torso += `<path d="M${f(cx)},${f(shY + 5)} V${f(hipY - 2)}" stroke="${cc}" stroke-width="1"/>`;
        for (let i = 0; i < 3; i++) torso += `<circle cx="${f(cx + 2.2)}" cy="${f(shY + 16 + i * (hipY - shY - 20) / 3)}" r="1.1" fill="${shade(tc, -0.3)}"/>`;
      } else {
        torso += `<path d="M${f(cx - 7)},${f(shY - 7)} Q${f(cx)},${f(shY + 3)} ${f(cx + 7)},${f(shY - 7)} Z" fill="${skinD}"/>`;
      }
      if (bottom.kind === 'trousers') torso += `<rect x="${f(cx - waistH - 1)}" y="${f(hipY - 3)}" width="${f((waistH + 1) * 2)}" height="5" rx="1.5" fill="${shade(bottom.color, -0.3)}"/>`;
    } else if (top.kind === 'suit') {
      const d = torsoD(hipY + 16, waistH + 3);
      torso += `<path d="${d}" fill="${tc}"/>` + shadeOver(d);
      torso += `<path d="M${f(cx - 8)},${f(shY - 6)} L${f(cx + 8)},${f(shY - 6)} L${f(cx)},${f(shY + 44)} Z" fill="#f4f1ea"/>`;
      torso += `<path d="M${f(cx - 2.6)},${f(shY - 3)} L${f(cx + 2.6)},${f(shY - 3)} L${f(cx + 3.6)},${f(shY + 33)} L${f(cx)},${f(shY + 39)} L${f(cx - 3.6)},${f(shY + 33)} Z" fill="${top.color2 || '#7a2333'}"/>`;
      torso += `<path d="M${f(cx - 9)},${f(shY - 6)} L${f(cx - 1)},${f(shY + 46)} M${f(cx + 9)},${f(shY - 6)} L${f(cx + 1)},${f(shY + 46)}" stroke="${shade(tc, -0.35)}" stroke-width="1.4" fill="none"/>`;
      torso += `<circle cx="${f(cx)}" cy="${f(shY + 56)}" r="1.6" fill="${shade(tc, -0.4)}"/><circle cx="${f(cx)}" cy="${f(shY + 72)}" r="1.6" fill="${shade(tc, -0.4)}"/>`;
      torso += `<path d="M${f(L + 7)},${f(shY + 22)} l9,0 l-2,4 l-5,0 z" fill="#f4f1ea" opacity=".9"/>`;
    } else if (top.kind === 'kurta') {
      const by = kneeY + 8;
      const d = torsoD(by, waistH + 8);
      torso += `<path d="${d}" fill="${tc}"/>` + shadeOver(d);
      torso += `<path d="M${f(cx)},${f(shY - 6)} V${f(shY + 32)}" stroke="${shade(tc, -0.14)}" stroke-width="2.4"/>`;
      for (let i = 0; i < 3; i++) torso += `<circle cx="${f(cx)}" cy="${f(shY + 4 + i * 10)}" r="1.2" fill="${top.color2 || '#c8a24e'}"/>`;
      torso += `<path d="M${f(cx - waistH - 6.5)},${f(by - 28)} L${f(cx - waistH - 8)},${f(by)} M${f(cx + waistH + 6.5)},${f(by - 28)} L${f(cx + waistH + 8)},${f(by)}" stroke="${shade(tc, -0.16)}" stroke-width="1.1"/>`;
    } else if (top.kind === 'frock') {
      const by = kneeY + 2;
      const d = torsoD(by, waistH + 13);
      torso += `<path d="${d}" fill="${tc}"/>` + shadeOver(d);
      const sy = shY + (hipY - shY) * 0.52;
      torso += `<rect x="${f(cx - waistH - 4)}" y="${f(sy)}" width="${f((waistH + 4) * 2)}" height="5" rx="2" fill="${top.color2 || '#ffffff'}"/>`;
      torso += `<path d="M${f(cx - waistH - 12)},${f(by - 3)} Q${f(cx)},${f(by + 3)} ${f(cx + waistH + 12)},${f(by - 3)}" stroke="${shade(tc, 0.35)}" stroke-width="2.4" fill="none" stroke-dasharray="3 2.5"/>`;
    } else if (top.kind === 'blouse') {
      const d = torsoD(hipY - 12, waistH);
      torso += `<path d="${d}" fill="${tc}"/>` + shadeOver(d);
    }

    /* saree pallu: from the right of the waist up across the chest to the left shoulder */
    let pallu = '';
    if (bottom.kind === 'saree') {
      const c = bottom.color, b = bottom.border || '#d8a64a';
      const a1 = [cx - waistH - 3, hipY - 12], a2 = [cx - waistH + 14, hipY - 8];
      const b1 = [R + 2, shY + 8], b2 = [R - 10, shY - 6];
      pallu += `<path d="M${f(a1[0])},${f(a1[1])} L${f(a2[0])},${f(a2[1])} L${f(b1[0])},${f(b1[1])} L${f(b2[0])},${f(b2[1])} Z" fill="${shade(c, 0.04)}"/>`;
      pallu += `<path d="M${f(a1[0])},${f(a1[1])} L${f(a2[0])},${f(a2[1])} L${f(b1[0])},${f(b1[1])} L${f(b2[0])},${f(b2[1])} Z" fill="url(#${id}-ts)"/>`;
      pallu += `<path d="M${f(a2[0])},${f(a2[1])} L${f(b1[0])},${f(b1[1])} L${f(b1[0] - 2.2)},${f(b1[1] - 5)} L${f(a2[0] - 2.4)},${f(a2[1] - 5.5)} Z" fill="${b}"/>`;
      pallu += `<path d="M${f(a1[0] + 7)},${f(a1[1] - 8)} L${f(b2[0] + 6)},${f(b2[1] + 10)}" stroke="${shade(c, -0.22)}" stroke-width="1" opacity=".5"/>`;
    }

    /* ---------- neck, head, hair ---------- */
    let headG = '';
    headG += `<rect x="${f(cx - p.neckW / 2)}" y="${f(headY + r - 7)}" width="${p.neckW}" height="${f(shY - (headY + r - 7) + 1)}" rx="2" fill="${skinD}"/>`;
    headG += `<ellipse cx="${f(cx - r + 0.6)}" cy="${f(headY + 2.5)}" rx="2.7" ry="4.2" fill="${skinD}"/><ellipse cx="${f(cx + r - 0.6)}" cy="${f(headY + 2.5)}" rx="2.7" ry="4.2" fill="${skinD}"/>`;
    headG += `<circle cx="${cx}" cy="${headY}" r="${r}" fill="${skin}"/><circle cx="${cx}" cy="${headY}" r="${r}" fill="url(#${id}-hs)"/>`;

    const hairShort = (col, vol, hl) => `<path d="M${f(cx - r - 0.8)},${f(headY + 2)} C${f(cx - r - 1.6)},${f(headY - r * 0.8)} ${f(cx - r * 0.45)},${f(t - 4.2 * vol)} ${f(cx + r * 0.2)},${f(t - 3.4 * vol)} C${f(cx + r * 0.85)},${f(t - 2.5 * vol)} ${f(cx + r + 1.6)},${f(headY - r * 0.55)} ${f(cx + r + 0.8)},${f(headY + 2)} C${f(cx + r * 0.78)},${f(headY - r * 0.28)} ${f(cx + r * 0.25)},${f(headY - r * hl)} ${f(cx - r * 0.3)},${f(headY - r * (hl - 0.12))} C${f(cx - r * 0.72)},${f(headY - r * 0.38)} ${f(cx - r * 0.92)},${f(headY - r * 0.12)} ${f(cx - r - 0.8)},${f(headY + 2)} Z" fill="${col}"/>`;
    const hairPart = (col, down) => `<path d="M${f(cx - r - 1)},${f(headY + down)} C${f(cx - r - 1.8)},${f(headY - r * 0.9)} ${f(cx - r * 0.5)},${f(t - 2.6)} ${f(cx)},${f(t - 2.2)} C${f(cx + r * 0.5)},${f(t - 2.6)} ${f(cx + r + 1.8)},${f(headY - r * 0.9)} ${f(cx + r + 1)},${f(headY + down)} C${f(cx + r * 0.86)},${f(headY - r * 0.25)} ${f(cx + r * 0.35)},${f(headY - r * 0.6)} ${f(cx)},${f(headY - r * 0.7)} C${f(cx - r * 0.35)},${f(headY - r * 0.6)} ${f(cx - r * 0.86)},${f(headY - r * 0.25)} ${f(cx - r - 1)},${f(headY + down)} Z" fill="${col}"/>`;

    let hair = '';
    switch (o.hair) {
      case 'short': hair = hairShort(hairC, 1, 0.62); break;
      case 'grey': hair = hairShort(hairC, 0.55, 0.78); break;
      case 'bun': case 'greybun': hair = hairPart(hairC, 4); break;
      case 'long': hair = hairPart(hairC, 7); break;
      case 'pigtails':
        hair = hairPart(hairC, 3);
        hair += `<circle cx="${f(cx - r - 0.5)}" cy="${f(headY + 0.5)}" r="2.6" fill="${o.ribbon || '#e8536b'}"/><circle cx="${f(cx + r + 0.5)}" cy="${f(headY + 0.5)}" r="2.6" fill="${o.ribbon || '#e8536b'}"/>`;
        break;
      case 'topknot':
        hair = `<path d="M${f(cx - r - 1)},${f(headY + 6)} C${f(cx - r - 2)},${f(headY - r * 0.95)} ${f(cx - r * 0.4)},${f(t - 2.4)} ${f(cx)},${f(t - 2)} C${f(cx + r * 0.4)},${f(t - 2.4)} ${f(cx + r + 2)},${f(headY - r * 0.95)} ${f(cx + r + 1)},${f(headY + 6)} C${f(cx + r * 0.7)},${f(headY - r * 0.1)} ${f(cx + r * 0.2)},${f(headY - r * 0.42)} ${f(cx - r * 0.25)},${f(headY - r * 0.36)} C${f(cx - r * 0.7)},${f(headY - r * 0.28)} ${f(cx - r * 0.9)},${f(headY)} ${f(cx - r - 1)},${f(headY + 6)} Z" fill="${hairC}"/>`;
        hair += `<path d="M${f(cx - 2)},${f(t - 1)} C${f(cx - 8)},${f(t - 8)} ${f(cx - 6)},${f(t - 15)} ${f(cx)},${f(t - 12)} C${f(cx + 6)},${f(t - 15)} ${f(cx + 8)},${f(t - 8)} ${f(cx + 2)},${f(t - 1)} Z" fill="${hairC}"/>`;
        hair += `<circle cx="${f(cx)}" cy="${f(t - 1.5)}" r="2.6" fill="${o.ribbon || '#f08aa5'}"/>`;
        break;
      case 'braid': {
        hair = hairPart(hairC, 5);
        const x0 = cx - r * 0.7, y0 = headY + r * 0.8, x1 = L + 6, y1 = shY + 64;
        for (let i = 0; i < 9; i++) {
          const k = i / 8, x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k;
          hair += `<ellipse cx="${f(x + (i % 2 ? 1.2 : -1.2))}" cy="${f(y)}" rx="${f(4.4 - k * 1.4)}" ry="5.4" transform="rotate(${i % 2 ? 18 : -18} ${f(x)} ${f(y)})" fill="${hairC}"/>`;
        }
        if (o.jasmine) {
          for (let i = 0; i < 7; i++) {
            const k = i / 9, x = x0 + (x1 - x0) * k + 4.6, y = y0 + (y1 - y0) * k - 1;
            hair += `<circle cx="${f(x)}" cy="${f(y)}" r="1.9" fill="#fbf8ef"/>`;
          }
          hair += `<path d="M${f(cx + r * 0.6)},${f(t + 3)} q4,4 5,10" stroke="#fbf8ef" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="0.1 4.2" fill="none"/>`;
        }
        break;
      }
      default: hair = hairShort(hairC, 1, 0.62);
    }
    if (o.glasses) {
      hair += `<g fill="rgba(255,255,255,.12)" stroke="#2a2420" stroke-width="1.4"><circle cx="${f(cx - 6.4)}" cy="${f(headY + 1.5)}" r="4.4"/><circle cx="${f(cx + 6.4)}" cy="${f(headY + 1.5)}" r="4.4"/><path d="M${f(cx - 2)},${f(headY + 1)} h4" fill="none"/></g>`;
    }
    if (o.bindi) hair += `<circle cx="${cx}" cy="${f(headY - r * 0.28)}" r="1.5" fill="#b3222e"/>`;

    /* ---------- arms ---------- */
    const sleeveC = top.kind === 'frock' ? tc : tc;
    function capsule(x1, y1, x2, y2, color, w) {
      return `<path d="M${f(x1)},${f(y1)} L${f(x2)},${f(y2)}" stroke="${color}" stroke-width="${f(w)}" stroke-linecap="round" fill="none"/>`;
    }
    function bentArm(sx, sy, elx, ely, hx, hy, upperK) {
      let s = `<path d="M${f(sx)},${f(sy)} L${f(elx)},${f(ely)} L${f(hx)},${f(hy)}" stroke="${skin}" stroke-width="${armW}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
      if (sleeve === 'full') s += `<path d="M${f(sx)},${f(sy)} L${f(elx)},${f(ely)} L${f(elx + (hx - elx) * 0.82)},${f(ely + (hy - ely) * 0.82)}" stroke="${sleeveC}" stroke-width="${armW + 1.6}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
      else s += capsule(sx, sy, sx + (elx - sx) * upperK, sy + (ely - sy) * upperK, sleeveC, armW + 1.6);
      s += `<circle cx="${f(hx)}" cy="${f(hy)}" r="${handR}" fill="${skin}"/>`;
      return s;
    }
    function arm(side) {
      const sx = cx + side * (shH - 3.5), sy = shY + 4;
      const ex = cx + side * (shH + armOut), ey = armEndY;
      let s = '', amp = 1;
      const pose = (o.prop === 'baby') ? 'hold'
        : (o.prop === 'coffee' && side === 1) ? 'cup'
        : (o.prop === 'kite' && side === 1) ? 'raise'
        : 'down';
      if (pose === 'hold') {
        s += bentArm(sx, sy, cx + side * (shH + 2), shY + 50, cx - side * 9, shY + 56, sleeve === 'short' ? 0.35 : 0.7);
        amp = 0.15;
      } else if (pose === 'cup') {
        const hx = cx + shH - 9, hy = shY + 40;
        s += bentArm(sx, sy, cx + shH + 5, shY + 52, hx, hy, 0.75);
        s += `<path d="M${f(hx - 5)},${f(hy - 15)} L${f(hx + 5)},${f(hy - 15)} L${f(hx + 4)},${f(hy - 1)} L${f(hx - 4)},${f(hy - 1)} Z" fill="#d6dbe1"/><path d="M${f(hx - 2.5)},${f(hy - 14)} L${f(hx - 2)},${f(hy - 2)}" stroke="#fff" stroke-width="1.2" opacity=".7"/>`;
        s += `<path class="fg-steam" d="M${f(hx - 2)},${f(hy - 19)} c-3,-4 3,-6 0,-11 M${f(hx + 2.5)},${f(hy - 19)} c-3,-4 3,-6 0,-11" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" fill="none" opacity=".75"/>`;
        amp = 0.15;
      } else if (pose === 'raise') {
        const hx = cx + shH + 12, hy = shY - 30;
        s += bentArm(sx, sy, cx + shH + 9, shY - 6, hx, hy, 0.5);
        amp = 0.1;
      } else {
        s += capsule(sx, sy, ex, ey, skin, armW);
        if (sleeve !== 'none') {
          const k = sleeve === 'full' ? 0.86 : sleeve === 'short' ? 0.3 : 0.5;
          s += capsule(sx, sy, sx + (ex - sx) * k, sy + (ey - sy) * k, sleeveC, armW + 1.6);
        }
        s += `<circle cx="${f(ex)}" cy="${f(ey)}" r="${handR}" fill="${skin}"/>`;
        if (side === 1 && o.prop === 'trunk') {
          amp = 0.3;
          s += `<path d="M${f(ex - 5)},${f(ey + 4)} Q${f(ex)},${f(ey - 5)} ${f(ex + 5)},${f(ey + 4)}" stroke="#1d2629" stroke-width="2.2" fill="none"/>`;
          s += `<rect x="${f(ex - 21)}" y="${f(ey + 3)}" width="42" height="28" rx="2.5" fill="#3d5864"/>`;
          s += `<rect x="${f(ex - 21)}" y="${f(ey + 3)}" width="42" height="7" rx="2" fill="#4c6b78"/>`;
          s += `<rect x="${f(ex - 16)}" y="${f(ey + 3)}" width="3" height="28" fill="#2a3d45"/><rect x="${f(ex + 13)}" y="${f(ey + 3)}" width="3" height="28" fill="#2a3d45"/>`;
          s += `<rect x="${f(ex - 2.5)}" y="${f(ey + 8)}" width="5" height="6" rx="1" fill="#d6a84b"/>`;
          s += `<circle cx="${f(ex - 7)}" cy="${f(ey + 21)}" r="2.2" fill="#e07a5f"/><circle cx="${f(ex - 3)}" cy="${f(ey + 23)}" r="1.6" fill="#f2c14e"/><circle cx="${f(ex + 6)}" cy="${f(ey + 20)}" r="2" fill="#e07a5f"/>`;
        }
        if (side === 1 && o.prop === 'briefcase') {
          amp = 0.3;
          s += `<path d="M${f(ex - 5)},${f(ey + 4)} Q${f(ex)},${f(ey - 4)} ${f(ex + 5)},${f(ey + 4)}" stroke="#2a1d16" stroke-width="2.2" fill="none"/>`;
          s += `<rect x="${f(ex - 16)}" y="${f(ey + 3)}" width="32" height="22" rx="2.5" fill="#4a3426"/><rect x="${f(ex - 16)}" y="${f(ey + 3)}" width="32" height="5" rx="2" fill="#5b4131"/>`;
          s += `<rect x="${f(ex - 9)}" y="${f(ey + 7)}" width="3" height="3" fill="#d6a84b"/><rect x="${f(ex + 6)}" y="${f(ey + 7)}" width="3" height="3" fill="#d6a84b"/>`;
        }
      }
      return `<g class="fg-arm" data-amp="${amp}" data-side="${side}" data-px="${f(sx)}" data-py="${f(sy)}">${s}</g>`;
    }

    /* ---------- props in front of the body ---------- */
    let propBack = '', propFront = '';
    if (o.prop === 'satchel') {
      propFront += `<path d="M${f(R - 4)},${f(shY - 3)} L${f(L + 1)},${f(hipY - 18)}" stroke="#8a6a45" stroke-width="3" fill="none"/>`;
      propFront += `<rect x="${f(L - 12)}" y="${f(hipY - 38)}" width="22" height="25" rx="3" fill="#b08a5a"/><path d="M${f(L - 12)},${f(hipY - 35)} h22 v8 q-11,5 -22,0 z" fill="#987247"/><circle cx="${f(L - 1)}" cy="${f(hipY - 28)}" r="1.6" fill="#e8d6b0"/>`;
    }
    if (o.prop === 'towel') {
      propFront += `<path d="M${f(L + 3)},${f(shY - 6)} C${f(L + 12)},${f(shY - 9)} ${f(L + 14)},${f(shY + 6)} ${f(L + 12)},${f(shY + 58)} L${f(L + 3)},${f(shY + 60)} C${f(L + 4)},${f(shY + 20)} ${f(L - 1)},${f(shY + 2)} ${f(L + 3)},${f(shY - 6)} Z" fill="#c8463c"/>`;
      propFront += `<path d="M${f(L + 7)},${f(shY - 4)} C${f(L + 11)},${f(shY + 6)} ${f(L + 10)},${f(shY + 30)} ${f(L + 8)},${f(shY + 58)}" stroke="#f3e6d6" stroke-width="1.6" fill="none"/>`;
      propFront += `<path d="M${f(L + 3)},${f(shY + 54)} h9 M${f(L + 3)},${f(shY + 50)} h9" stroke="#f3e6d6" stroke-width="1.2"/>`;
    }
    if (o.prop === 'baby') {
      const bx = cx, by = shY + 47;
      propFront += `<g transform="rotate(-14 ${f(bx)} ${f(by)})"><ellipse cx="${f(bx + 2)}" cy="${f(by)}" rx="19" ry="11.5" fill="${o.babyWrap || '#f5efe4'}"/><path d="M${f(bx - 6)},${f(by - 9)} q8,8 22,4" stroke="${shade(o.babyWrap || '#f5efe4', -0.12)}" stroke-width="1.4" fill="none"/>`;
      propFront += `<circle cx="${f(bx - 15)}" cy="${f(by - 2)}" r="7" fill="${o.babySkin || '#a77757'}"/><path d="M${f(bx - 21.5)},${f(by - 4)} a7,7 0 0 1 12,-5 q-5,1 -12,5z" fill="#1a1411"/></g>`;
    }
    if (o.prop === 'kite') {
      const hx = cx + shH + 12, hy = shY - 30;
      const kx = 214, ky = -282;
      propBack += `<path d="M${f(hx)},${f(hy)} Q${f(hx + 90)},${f(hy - 60)} ${kx},${f(ky + 30)}" stroke="#f6efe2" stroke-width="1.1" fill="none" opacity=".85"/>`;
      propBack += `<g class="fg-kite" style="transform-origin:${kx}px ${ky + 30}px"><path d="M${kx},${f(ky - 30)} L${kx + 22},${ky} L${kx},${ky + 30} L${kx - 22},${ky} Z" fill="#e8536b"/><path d="M${kx},${f(ky - 30)} L${kx + 22},${ky} L${kx},${ky} Z" fill="#f4a259"/><path d="M${kx},${ky} L${kx - 22},${ky} L${kx},${ky + 30} Z" fill="#f4a259"/><path d="M${kx},${ky - 30} V${ky + 30} M${kx - 22},${ky} H${kx + 22}" stroke="#7a2e3a" stroke-width="1"/><path d="M${kx},${ky + 30} q-10,14 2,26 q12,12 -2,26" stroke="#f6efe2" stroke-width="1" fill="none"/><path d="M${kx - 4},${ky + 44} l4,3 l4,-3 l-4,-3z M${kx - 2},${ky + 66} l4,3 l4,-3 l-4,-3z" fill="#f2c14e"/></g>`;
    }

    const body =
      `<g class="fg-body">` +
        back + propBack + legs + lower + torso + pallu +
        `<g class="fg-head">${headG}${hair}</g>` +
        (o.prop === 'baby' ? propFront : '') +
        arm(-1) + arm(1) +
        (o.prop !== 'baby' ? propFront : '') +
      `</g>`;

    const svg = `<svg class="fg" xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">${defs}${body}</svg>`;
    return { svg, w: vbW, h: vbH, ax: cx - vbX, ay: 0, headTop: footY - t, type };
  }

  /* ==========================================================================
     CARD ILLUSTRATIONS (drawn into the genie canvas)
     Portrait art, 600 x 760, meant to sit inside an arched frame.
     ========================================================================== */
  function nest(fig, x, yBottom, scale) {
    const w = fig.w * scale, h = fig.h * scale;
    return fig.svg
      .replace('<svg class="fg" ', `<svg x="${f(x - fig.ax * scale)}" y="${f(yBottom - h)}" width="${f(w)}" height="${f(h)}" `);
  }
  function dots(n, x0, y0, x1, y1, r, colors, sag) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1);
      const x = x0 + (x1 - x0) * k;
      const y = y0 + (y1 - y0) * k + Math.sin(Math.PI * k) * (sag || 0);
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${colors[i % colors.length]}"/>`;
    }
    return s;
  }

  function cardArt(kind, people) {
    const W = 600, H = 760;
    let s = '';
    if (kind === 'wedding') {
      s += `<defs><linearGradient id="cw-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6c99a"/><stop offset=".55" stop-color="#f1a77f"/><stop offset="1" stop-color="#c8644f"/></linearGradient>
        <radialGradient id="cw-glow" cx=".5" cy=".55" r=".55"><stop offset="0" stop-color="#fff3d6" stop-opacity=".9"/><stop offset="1" stop-color="#fff3d6" stop-opacity="0"/></radialGradient>
        <radialGradient id="cw-flame" cx=".5" cy=".6" r=".5"><stop offset="0" stop-color="#fff6c8"/><stop offset=".5" stop-color="#ffc24a" stop-opacity=".8"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></radialGradient></defs>`;
      s += `<rect width="${W}" height="${H}" fill="url(#cw-bg)"/>`;
      s += `<ellipse cx="300" cy="430" rx="330" ry="300" fill="url(#cw-glow)"/>`;
      // monsoon rain
      let rain = '';
      for (let i = 0; i < 70; i++) {
        const x = (i * 97) % 640 - 20, y = (i * 53) % 700;
        rain += `M${x},${y} l-7,22 `;
      }
      s += `<path d="${rain}" stroke="#fff" stroke-width="1.4" opacity=".28" stroke-linecap="round"/>`;
      // mandap pillars with marigold garlands
      s += `<rect x="70" y="170" width="22" height="520" fill="#7c2d1f"/><rect x="508" y="170" width="22" height="520" fill="#7c2d1f"/>`;
      s += dots(30, 81, 175, 81, 690, 6.2, ['#f59a23', '#f7c531'], 0) + dots(30, 519, 175, 519, 690, 6.2, ['#f7c531', '#f59a23'], 0);
      // canopy + mango-leaf toran
      s += `<path d="M40,150 Q300,95 560,150 L560,176 Q300,122 40,176 Z" fill="#8e2c22"/>`;
      let leaves = '';
      for (let i = 0; i < 15; i++) {
        const x = 70 + i * 33, y = 168 + Math.sin(i / 14 * Math.PI) * -28 + 6;
        leaves += `<path d="M${x},${y} q-7,16 0,30 q7,-14 0,-30z" fill="${i % 2 ? '#3f7d3a' : '#5a9a45'}"/>`;
      }
      s += leaves;
      for (let j = 0; j < 9; j++) {
        const x = 120 + j * 45;
        const top = 150 - Math.sin((x - 40) / 520 * Math.PI) * 52 + 20;
        s += dots(8, x, top, x, top + 120 + (j % 3) * 22, 5, ['#f59a23', '#f7c531', '#fbe2a0'], 0);
      }
      // brass lamps (nilavilakku)
      const lamp = (x) => `<g><ellipse cx="${x}" cy="688" rx="26" ry="7" fill="#9c6b1e"/><rect x="${x - 4}" y="560" width="8" height="128" fill="#c9922f"/><ellipse cx="${x}" cy="560" rx="22" ry="6" fill="#d9a441"/><ellipse cx="${x}" cy="600" rx="12" ry="4" fill="#c9922f"/><circle cx="${x}" cy="536" r="40" fill="url(#cw-flame)"/><path d="M${x},528 q-7,14 0,26 q7,-12 0,-26z" fill="#fff1b3"/></g>`;
      s += lamp(165) + lamp(435);
      // the couple
      s += nest(people.groom, 248, 724, 1.32);
      s += nest(people.bride, 352, 724, 1.32);
      // garlands around both necks
      s += `<path d="M228,402 Q248,470 268,402" stroke="#f59a23" stroke-width="7" stroke-dasharray="0.1 7.5" stroke-linecap="round" fill="none"/>`;
      s += `<path d="M334,410 Q352,474 371,410" stroke="#f7c531" stroke-width="7" stroke-dasharray="0.1 7.5" stroke-linecap="round" fill="none"/>`;
      // petals
      let petals = '';
      for (let i = 0; i < 26; i++) {
        const x = (i * 131) % 600, y = 200 + (i * 71) % 480;
        petals += `<ellipse cx="${x}" cy="${y}" rx="5" ry="2.6" transform="rotate(${(i * 47) % 180} ${x} ${y})" fill="${i % 3 ? '#f59a23' : '#f7c531'}" opacity=".9"/>`;
      }
      s += petals;
      s += `<rect y="724" width="${W}" height="36" fill="#7c2d1f"/>`;
    }
    if (kind === 'family') {
      s += `<defs><linearGradient id="cf-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1433"/><stop offset=".6" stop-color="#22306a"/><stop offset="1" stop-color="#6b4a7a"/></linearGradient>
        <radialGradient id="cf-moon" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff4d6" stop-opacity=".55"/><stop offset="1" stop-color="#fff4d6" stop-opacity="0"/></radialGradient></defs>`;
      s += `<rect width="${W}" height="${H}" fill="url(#cf-bg)"/>`;
      let stars = '';
      for (let i = 0; i < 60; i++) {
        const x = (i * 157) % 600, y = (i * 89) % 380, rr = (i % 5 === 0) ? 1.8 : 1;
        stars += `<circle cx="${x}" cy="${y}" r="${rr}" fill="#fff" opacity="${0.4 + (i % 4) * 0.15}"/>`;
      }
      s += stars;
      s += `<circle cx="430" cy="150" r="90" fill="url(#cf-moon)"/><path d="M455,112 a46,46 0 1 0 0,78 a36,36 0 1 1 0,-78z" fill="#fff1cf"/>`;
      // 1994 skyline: low buildings and the Trade Centre tower
      let sky = '';
      const xs = [0, 46, 92, 150, 196, 262, 330, 382, 446, 500, 552];
      const hs = [110, 150, 90, 130, 175, 0, 120, 160, 100, 140, 95];
      xs.forEach((x, i) => { if (hs[i]) sky += `<rect x="${x}" y="${560 - hs[i]}" width="44" height="${hs[i]}" fill="#141b3d"/>`; });
      sky += `<rect x="252" y="310" width="66" height="250" fill="#18204a"/><path d="M252,310 h66 v-14 h-66z" fill="#202a5a"/>`;
      for (let y = 322; y < 556; y += 12) for (let x = 258; x < 314; x += 9) sky += `<rect x="${x}" y="${y}" width="4" height="6" fill="#ffd58a" opacity="${((x * y) % 7) > 2 ? 0.85 : 0.15}"/>`;
      for (let i = 0; i < 70; i++) { const x = (i * 37) % 600, y = 440 + (i * 23) % 110; sky += `<rect x="${x}" y="${y}" width="3" height="4" fill="#ffd58a" opacity=".7"/>`; }
      s += sky;
      // balcony
      s += `<rect y="560" width="${W}" height="200" fill="#0e142e"/>`;
      s += nest(people.ravi, 210, 742, 1.22);
      s += nest(people.lakshmi, 318, 742, 1.22);
      s += nest(people.anjali, 418, 742, 1.22);
      s += `<rect x="0" y="606" width="${W}" height="9" fill="#c9a86a"/><rect x="0" y="736" width="${W}" height="24" fill="#c9a86a"/>`;
      for (let x = 14; x < 600; x += 30) s += `<rect x="${x}" y="615" width="5" height="121" fill="#b8955a"/>`;
    }
    if (kind === 'meera') {
      s += `<defs><linearGradient id="cm-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7d9a8"/><stop offset=".6" stop-color="#f6e6c8"/><stop offset="1" stop-color="#cfe0b6"/></linearGradient>
        <radialGradient id="cm-sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6dc"/><stop offset=".4" stop-color="#ffe2a6" stop-opacity=".8"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>`;
      s += `<rect width="${W}" height="${H}" fill="url(#cm-bg)"/>`;
      s += `<circle cx="420" cy="230" r="190" fill="url(#cm-sun)"/>`;
      let rays = '';
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; rays += `M${420 + Math.cos(a) * 70},${230 + Math.sin(a) * 70} L${420 + Math.cos(a) * 150},${230 + Math.sin(a) * 150} `; }
      s += `<path d="${rays}" stroke="#fff4d0" stroke-width="3" opacity=".5" stroke-linecap="round"/>`;
      // jacaranda branch
      s += `<path d="M600,40 C520,70 470,40 410,90 C380,115 330,110 300,140" stroke="#6b4a3a" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      let blossoms = '';
      for (let i = 0; i < 46; i++) {
        const k = i / 45, x = 600 - k * 300 + Math.sin(i * 1.7) * 26, y = 40 + k * 100 + Math.cos(i * 2.3) * 22;
        blossoms += `<circle cx="${f(x)}" cy="${f(y)}" r="${9 + (i % 4) * 2}" fill="${['#9b7fd1', '#b39ae0', '#8466c0', '#c6b2ec'][i % 4]}" opacity=".95"/>`;
      }
      s += blossoms;
      for (let i = 0; i < 16; i++) { const x = 60 + (i * 83) % 520, y = 220 + (i * 67) % 420; s += `<ellipse cx="${x}" cy="${y}" rx="4.5" ry="2.6" transform="rotate(${i * 37} ${x} ${y})" fill="#a58ad8" opacity=".8"/>`; }
      // garden
      s += `<path d="M0,600 Q300,560 600,600 L600,760 L0,760 Z" fill="#8db36a"/><path d="M0,650 Q300,620 600,650 L600,760 L0,760 Z" fill="#79a35a"/>`;
      // fresh soil + sapling
      s += `<ellipse cx="452" cy="676" rx="62" ry="15" fill="#7a5236"/>`;
      s += `<path d="M452,676 C450,640 456,612 452,580" stroke="#6b4a2a" stroke-width="5" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M452,610 q-34,-6 -44,-30 q30,0 44,30z M454,596 q32,-10 40,-36 q-30,4 -40,36z M452,582 q-18,-20 -10,-44 q18,18 10,44z" fill="#4f8a3c"/>`;
      // watering can
      s += `<g transform="translate(520 640)"><path d="M0,0 h44 v34 h-44z" fill="#3f7a8c"/><path d="M44,6 l26,-16 l3,5 l-24,18z" fill="#3f7a8c"/><path d="M6,0 q16,-24 32,0" stroke="#3f7a8c" stroke-width="5" fill="none"/></g>`;
      s += nest(people.ravi, 268, 724, 1.36);
      s += nest(people.lakshmi, 156, 724, 1.3);
      s += `<rect y="724" width="${W}" height="36" fill="#5d8a45"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${s}</svg>`;
  }

  window.ArtFigures = { figure, cardArt, shade, BODY };
})();

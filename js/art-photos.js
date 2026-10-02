/* ==========================================================================
   PHOTO PLACEHOLDERS
   Until the family's real photos arrive, every place a photo belongs shows
   a quiet, on-style placeholder instead. Each one is labelled (in the page,
   not in the image) with the photo it is waiting for.

   PhotoArt.placeholder({ w, h, tone, seed }) → SVG string (no text), used as
   an <img> data URL in frames and inside the genie cards.
   ========================================================================== */
(function () {
  'use strict';

  const TONES = {
    sepia: ['#efe4cf', '#dcc9a8', '#b49c78'],
    rose: ['#f3e1da', '#e0c2b6', '#b48e80'],
    sage: ['#e6ecdc', '#c9d6b8', '#8fa37c'],
    dusk: ['#e4e0ee', '#c6bfd9', '#8f86ab'],
    sand: ['#f3e8d6', '#e3cfae', '#bf9f6f']
  };

  function placeholder({ w = 600, h = 760, tone = 'sepia', seed = 1 } = {}) {
    const [c1, c2, c3] = TONES[tone] || TONES.sepia;
    const id = 'ph' + tone + seed;
    const cx = w / 2, cy = h * 0.46, s = Math.min(w, h) * 0.2;
    let hatch = '';
    for (let x = -h; x < w; x += 22) hatch += `M${x},${h} L${x + h},0 `;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
      `<defs><linearGradient id="${id}" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>` +
      `<radialGradient id="${id}v" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></radialGradient></defs>` +
      `<rect width="${w}" height="${h}" fill="url(#${id})"/>` +
      `<path d="${hatch}" stroke="${c3}" stroke-opacity=".08" stroke-width="2"/>` +
      `<rect x="${w * 0.07}" y="${h * 0.07}" width="${w * 0.86}" height="${h * 0.86}" rx="${Math.min(w, h) * 0.03}" fill="none" stroke="${c3}" stroke-opacity=".45" stroke-width="${Math.max(1.5, w / 260)}" stroke-dasharray="${w / 60} ${w / 80}"/>` +
      `<g fill="none" stroke="${c3}" stroke-width="${Math.max(2, s / 18)}" stroke-linecap="round" stroke-linejoin="round" opacity=".75">` +
      `<rect x="${cx - s}" y="${cy - s * 0.72}" width="${s * 2}" height="${s * 1.44}" rx="${s * 0.14}"/>` +
      `<circle cx="${cx + s * 0.42}" cy="${cy - s * 0.26}" r="${s * 0.17}"/>` +
      `<path d="M${cx - s * 0.86},${cy + s * 0.56} L${cx - s * 0.3},${cy - s * 0.06} L${cx + s * 0.08},${cy + s * 0.3} L${cx + s * 0.36},${cy + s * 0.06} L${cx + s * 0.86},${cy + s * 0.56}"/>` +
      `</g>` +
      `<rect width="${w}" height="${h}" fill="url(#${id}v)"/>` +
      `</svg>`;
  }

  window.PhotoArt = {
    placeholder,
    url: (o) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(placeholder(o))
  };
})();

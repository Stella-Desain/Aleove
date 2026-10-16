/* ==========================================================================
   Aleove — Scene 2: surat (stasiun tengah)
   Alur: amplop jatuh melayang dari atas → teks ajakan → ketuk amplop →
         amplop membesar & turun, segel pecah, flap terbuka, kertas keluar,
         kertas naik & membuka lipatannya → teks muncul baris per baris →
         3 detik kemudian roket muncul → tekan roket → (resolve) roket
         terbang ke atas di lapisan #fx selama kamera bergerak.
   Semua class berawalan .lt-
   ========================================================================== */
(function () {
  "use strict";
  const A = window.Aleove;
  const esc = A.esc;
  const TAU = Math.PI * 2;

  const R = {};      // referensi elemen
  let S = null;      // state runtime saat play

  /* ---------------- util kecil ---------------- */
  const f2 = function (n) { return Math.round(n * 100) / 100; };

  // PRNG deterministik (mulberry32) supaya pola bintang selalu sama
  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // bintang 4 sudut (kilau)
  function star4d(cx, cy, r) {
    const k = r * 0.24;
    return "M" + f2(cx) + " " + f2(cy - r) +
      "Q" + f2(cx + k) + " " + f2(cy - k) + " " + f2(cx + r) + " " + f2(cy) +
      "Q" + f2(cx + k) + " " + f2(cy + k) + " " + f2(cx) + " " + f2(cy + r) +
      "Q" + f2(cx - k) + " " + f2(cy + k) + " " + f2(cx - r) + " " + f2(cy) +
      "Q" + f2(cx - k) + " " + f2(cy - k) + " " + f2(cx) + " " + f2(cy - r) + "Z";
  }

  function starfield(seed, n, x0, y0, x1, y1, inside) {
    const r = rng(seed);
    let out = "", c = 0, tries = 0;
    while (c < n && tries++ < n * 40) {
      const x = x0 + r() * (x1 - x0);
      const y = y0 + r() * (y1 - y0);
      if (inside && !inside(x, y)) continue;
      c++;
      const col = r() < 0.55 ? "#f3d38a" : "#d6ecff";
      const op = f2(0.35 + r() * 0.6);
      if (r() < 0.12) out += '<path d="' + star4d(x, y, 1.8 + r() * 1.7) + '" fill="' + col + '" opacity="' + op + '"/>';
      else out += '<circle cx="' + f2(x) + '" cy="' + f2(y) + '" r="' + f2(0.3 + r() * 0.62) + '" fill="' + col + '" opacity="' + op + '"/>';
    }
    return out;
  }

  /* ---------------- SVG ---------------- */
  const DEFS =
    '<svg class="lt-defs" aria-hidden="true" focusable="false"><defs>' +
    '<linearGradient id="lt-g-back" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9dfcb"/><stop offset="1" stop-color="#dccfb5"/></linearGradient>' +
    '<linearGradient id="lt-g-liner" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#1e3672"/><stop offset=".55" stop-color="#112250"/><stop offset="1" stop-color="#0a1535"/></linearGradient>' +
    '<linearGradient id="lt-g-depth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="lt-g-pocket" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f9f3e8"/><stop offset=".5" stop-color="#f1e8d6"/><stop offset="1" stop-color="#e5d6bc"/></linearGradient>' +
    '<linearGradient id="lt-g-bflap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf9f1"/><stop offset="1" stop-color="#efe4cf"/></linearGradient>' +
    '<linearGradient id="lt-g-flap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf8"/><stop offset=".62" stop-color="#f7f0e2"/><stop offset="1" stop-color="#ece0c8"/></linearGradient>' +
    '<radialGradient id="lt-g-pearl" cx=".2" cy=".1" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".45" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#cfe0ff" stop-opacity=".16"/></radialGradient>' +
    '<linearGradient id="lt-g-gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c39a52"/><stop offset=".5" stop-color="#f2d896"/><stop offset="1" stop-color="#c39a52"/></linearGradient>' +
    '<radialGradient id="lt-g-wax" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#5a8ae6"/><stop offset=".42" stop-color="#25499c"/><stop offset="1" stop-color="#0d1d4f"/></radialGradient>' +
    '<radialGradient id="lt-g-waxin" cx=".66" cy=".72" r=".85"><stop offset="0" stop-color="#3262c4"/><stop offset="1" stop-color="#132b66"/></radialGradient>' +
    '<linearGradient id="lt-g-sealstar" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff4cf"/><stop offset=".55" stop-color="#ecd08c"/><stop offset="1" stop-color="#c79a52"/></linearGradient>' +
    '<linearGradient id="lt-g-rbody" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".42" stop-color="#f4f9ff"/><stop offset="1" stop-color="#b3c8e4"/></linearGradient>' +
    '<linearGradient id="lt-g-rblue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#93d2ff"/><stop offset="1" stop-color="#2f6fd6"/></linearGradient>' +
    '<radialGradient id="lt-g-rwin" cx=".36" cy=".32" r=".8"><stop offset="0" stop-color="#dcf6ff"/><stop offset=".38" stop-color="#6fb4ff"/><stop offset="1" stop-color="#1c4cab"/></radialGradient>' +
    '<linearGradient id="lt-g-flame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6dc"/><stop offset=".3" stop-color="#ffd37c"/><stop offset=".72" stop-color="#ff9a4c" stop-opacity=".85"/><stop offset="1" stop-color="#ff7a3a" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="lt-g-core" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#fff3c9"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></linearGradient>' +
    '<filter id="lt-f-soft" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="2.2"/></filter>' +
    "</defs></svg>";

  // bagian dalam belakang amplop: kertas + liner biru tua berbintang
  function envBackSVG() {
    const inV = function (x, y) { return y > 10 && y < 116 * (1 - Math.abs(x - 145) / 152); };
    return '<svg viewBox="0 0 290 200" aria-hidden="true" focusable="false">' +
      '<rect width="290" height="200" rx="7" fill="url(#lt-g-back)"/>' +
      '<rect x="9" y="8" width="272" height="170" rx="2" fill="url(#lt-g-liner)"/>' +
      starfield(7, 48, 12, 10, 278, 118, inV) +
      '<rect x="9" y="8" width="272" height="18" fill="url(#lt-g-depth)"/>' +
      '<path d="M9 8.5H281" stroke="url(#lt-g-gold)" stroke-width=".8" opacity=".75"/>' +
      "</svg>";
  }

  // depan amplop (kantong): sayap samping + flap bawah, rasi bintang timbul
  function envFrontSVG() {
    const pocket = "M0 5.5L138.8 108.3Q145 113 151.2 108.3L290 5.5V193Q290 200 283 200H7Q0 200 0 193Z";
    const vEdge = "M0 5.5L138.8 108.3Q145 113 151.2 108.3L290 5.5";
    const bEdge = "M0 193C44 166 98 135 139.5 121.8Q145 120 150.5 121.8C192 135 246 166 290 193";
    const bFlap = bEdge + "Q290 200 283 200H7Q0 200 0 193Z";
    const pts = [[103, 176], [118, 166], [133, 171], [147, 160], [162, 167], [177, 161], [189, 172]];
    const line = "M" + pts.map(function (p) { return p.join(" "); }).join("L");
    const dots = pts.map(function (p, i) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i === 3 ? 1.5 : 0.95) + '"/>'; }).join("");
    function cons(dx, dy, col, op) {
      return '<g transform="translate(' + dx + " " + dy + ')" opacity="' + op + '">' +
        '<path d="' + line + '" fill="none" stroke="' + col + '" stroke-width=".55" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<g fill="' + col + '">' + dots + "</g>" +
        '<path d="' + star4d(147, 160, 4.2) + '" fill="' + col + '"/>' +
        "</g>";
    }
    return '<svg viewBox="0 0 290 200" aria-hidden="true" focusable="false">' +
      '<path d="' + pocket + '" fill="url(#lt-g-pocket)"/>' +
      '<path d="' + vEdge + '" fill="none" stroke="#7a6038" stroke-opacity=".2" stroke-width="2.6" filter="url(#lt-f-soft)" transform="translate(0 2.2)"/>' +
      '<path d="' + bEdge + '" fill="none" stroke="#6e5530" stroke-opacity=".3" stroke-width="3" filter="url(#lt-f-soft)" transform="translate(0 -1.4)"/>' +
      '<path d="' + bFlap + '" fill="url(#lt-g-bflap)"/>' +
      '<path d="' + bEdge + '" fill="none" stroke="#fff" stroke-opacity=".95" stroke-width=".9"/>' +
      cons(0.6, 0.7, "#ffffff", 0.95) +
      cons(0, 0, "#9a7a46", 0.42) +
      '<path d="' + pocket + '" fill="url(#lt-g-pearl)"/>' +
      '<path d="' + vEdge + '" fill="none" stroke="#fff" stroke-opacity=".95" stroke-width=".9"/>' +
      '<path d="M.6 6V193Q.6 199.4 7 199.4H283Q289.4 199.4 289.4 193V6" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1"/>' +
      "</svg>";
  }

  const FLAP_TRI = "M0 6Q0 0 6 0H284Q290 0 290 6L151.5 109.6Q145 114.5 138.5 109.6Z";

  function flapOutSVG() {
    return '<svg viewBox="0 0 290 116" aria-hidden="true" focusable="false">' +
      '<path class="lt-flap-sh" d="M0 3L139 110.5Q145 115.5 151 110.5L290 3Z" fill="#5b4422" fill-opacity=".3" filter="url(#lt-f-soft)" transform="translate(0 3)"/>' +
      '<path d="' + FLAP_TRI + '" fill="url(#lt-g-flap)"/>' +
      '<rect width="290" height="2.5" fill="#6b5330" opacity=".06"/>' +
      '<path d="M18 7.6L145 101L272 7.6" fill="none" stroke="url(#lt-g-gold)" stroke-width=".8" stroke-opacity=".85"/>' +
      '<path d="M.8 6.2L139 108.9Q145 113.3 151 108.9L289.2 6.2" fill="none" stroke="#fff" stroke-opacity=".95" stroke-width=".9"/>' +
      '<g fill="url(#lt-g-gold)" opacity=".8">' +
        '<path d="' + star4d(145, 20, 3.4) + '"/>' +
        '<circle cx="131" cy="17" r=".8"/><circle cx="159" cy="17" r=".8"/>' +
      "</g>" +
      "</svg>";
  }

  function flapInSVG() {
    const inT = function (x, y) { return y > 8 && y < 6 + 92 * (1 - Math.abs(x - 145) / 130); };
    return '<svg viewBox="0 0 290 116" aria-hidden="true" focusable="false">' +
      '<path d="' + FLAP_TRI + '" fill="#e9dec8"/>' +
      '<path d="M13 5.5H277L145 102Z" fill="url(#lt-g-liner)"/>' +
      starfield(23, 34, 16, 7, 274, 100, inT) +
      '<path d="M13 5.5L145 102L277 5.5" fill="none" stroke="url(#lt-g-gold)" stroke-width=".8" stroke-opacity=".7"/>' +
      "</svg>";
  }

  function sealSVG() {
    return '<svg viewBox="0 0 60 60" aria-hidden="true" focusable="false">' +
      '<path d="M30 2.6C35.6 2.2 40.6 4.6 44.8 7.4C49.6 10.4 54.2 13.6 56.4 19.4C58.4 24.6 57.6 30.4 58 35.8C57.6 41.6 54 46.6 49.8 50.6C45.6 54.8 40 57.4 34 57.8C28 58.4 22 57.6 16.8 55C11.4 52.4 6.6 48 4.2 42.6C1.8 37.2 2 31.2 2.4 25.6C3 20 5.6 15 9.6 11C14 6.6 19.6 3.6 24.6 3C26.4 2.8 28.4 2.7 30 2.6Z" fill="url(#lt-g-wax)"/>' +
      '<circle cx="30" cy="30" r="19.5" fill="url(#lt-g-waxin)"/>' +
      '<circle cx="29.5" cy="29.5" r="19.5" fill="none" stroke="#08153a" stroke-opacity=".55" stroke-width="1.1"/>' +
      '<circle cx="30.5" cy="30.6" r="19.5" fill="none" stroke="#a8c8ff" stroke-opacity=".35" stroke-width=".8"/>' +
      '<path d="' + star4d(30.6, 31.2, 10) + '" fill="#08153a" opacity=".45"/>' +
      '<path d="' + star4d(30, 30.4, 10) + '" fill="url(#lt-g-sealstar)"/>' +
      '<path d="' + star4d(39.6, 21.4, 3) + '" fill="url(#lt-g-sealstar)" opacity=".9"/>' +
      '<circle cx="20.5" cy="38.5" r=".95" fill="#f1dca2" opacity=".85"/>' +
      '<circle cx="19.5" cy="22" r=".7" fill="#f1dca2" opacity=".7"/>' +
      '<ellipse cx="20" cy="13.5" rx="9" ry="4" fill="#fff" opacity=".2" transform="rotate(-30 20 13.5)"/>' +
      "</svg>";
  }

  function flameSVG() {
    return '<svg viewBox="0 0 18 36" aria-hidden="true" focusable="false">' +
      '<path d="M2.5 0H15.5C17 6 16 14 13.2 21C11.8 25.8 10.4 30.8 9 36C7.6 30.8 6.2 25.8 4.8 21C2 14 1 6 2.5 0Z" fill="url(#lt-g-flame)"/>' +
      '<path d="M5.4 0H12.6C13.4 5 12.6 10 11 15C10.3 17.6 9.6 20.2 9 23C8.4 20.2 7.7 17.6 7 15C5.4 10 4.6 5 5.4 0Z" fill="url(#lt-g-core)"/>' +
      "</svg>";
  }

  function rocketSVG() {
    return '<svg class="lt-r-svg" viewBox="0 0 52 76" aria-hidden="true" focusable="false">' +
      // sirip kiri & kanan
      '<path d="M13.4 43C6.4 47.6 3 55.4 3.4 66C6 63.4 9.6 61.4 15.2 60.4Z" fill="url(#lt-g-rblue)"/>' +
      '<path d="M38.6 43C45.6 47.6 49 55.4 48.6 66C46 63.4 42.4 61.4 36.8 60.4Z" fill="url(#lt-g-rblue)"/>' +
      // nosel
      '<path d="M19 62.5H33L31.4 68H20.6Z" fill="#8ea6c6"/>' +
      '<path d="M19 62.5H33L32.6 64H19.4Z" fill="#5f7ca6"/>' +
      // badan
      '<path d="M26 3C35.6 10 40.6 22 40.1 38C39.8 48 38.1 56 35.6 63H16.4C13.9 56 12.2 48 11.9 38C11.4 22 16.4 10 26 3Z" fill="url(#lt-g-rbody)"/>' +
      // ujung hidung biru
      '<path d="M26 3C30.2 6 33.2 9.6 35.2 13.6Q26 16.6 16.8 13.6C18.8 9.6 21.8 6 26 3Z" fill="url(#lt-g-rblue)"/>' +
      // pita biru bawah
      '<path d="M14.6 54.4Q26 57.6 37.4 54.4L36.5 58.4Q26 61.4 15.5 58.4Z" fill="url(#lt-g-rblue)" opacity=".92"/>' +
      // jendela
      '<circle cx="26" cy="31" r="8.3" fill="#e3ecf7" stroke="#9db5d4" stroke-width=".8"/>' +
      '<circle cx="26" cy="31" r="6" fill="url(#lt-g-rwin)"/>' +
      '<path d="M22.4 28.6A4.4 4.4 0 0 1 26.6 26.1" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".85"/>' +
      // sirip tengah
      '<path d="M24.7 51.5H27.3L27.9 66.5H24.1Z" fill="url(#lt-g-rblue)"/>' +
      // kilap badan
      '<path d="M18.6 16C16.6 22.4 16 30.6 16.6 40" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>' +
      "</svg>";
  }

  function ornSVG() {
    return '<svg class="lt-orn" viewBox="0 0 136 16" aria-hidden="true" focusable="false">' +
      '<path class="lt-orn-l" d="M57 8H6" fill="none" stroke="#b8924d" stroke-width=".8" stroke-linecap="round" opacity=".75"/>' +
      '<path class="lt-orn-r" d="M79 8H130" fill="none" stroke="#b8924d" stroke-width=".8" stroke-linecap="round" opacity=".75"/>' +
      '<g class="lt-orn-dots" fill="#b8924d" opacity=".75"><circle cx="2.5" cy="8" r="1.1"/><circle cx="133.5" cy="8" r="1.1"/></g>' +
      '<path class="lt-orn-star" d="' + star4d(68, 8, 6.5) + '" fill="#b8924d"/>' +
      "</svg>";
  }

  // rasi Cassiopeia kecil di sudut kanan atas kertas
  function markSVG() {
    const p = [[4, 9], [17, 21], [31, 8], [45, 19], [60, 5]];
    return '<svg class="lt-mark" viewBox="0 0 64 26" aria-hidden="true" focusable="false">' +
      '<path class="lt-mark-line" d="M' + p.map(function (q) { return q.join(" "); }).join("L") + '" fill="none" stroke="#2b3550" stroke-opacity=".32" stroke-width=".7" stroke-linejoin="round"/>' +
      p.map(function (q, i) {
        return '<path class="lt-mark-star" d="' + star4d(q[0], q[1], i === 2 ? 3.4 : 2.5) + '" fill="#b8924d"/>';
      }).join("") +
      "</svg>";
  }

  function spkSVG() {
    return '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="' + star4d(10, 10, 9.5) + '" fill="#eaf6ff"/></svg>';
  }

  function splitChars(text) {
    return String(text || "").split(/\s+/).filter(Boolean).map(function (w) {
      return '<span class="lt-pw">' + Array.from(w).map(function (ch) {
        return '<span class="lt-pc">' + esc(ch) + "</span>";
      }).join("") + "</span>";
    }).join(" ");
  }

  function splitWords(text) {
    return String(text || "").split(/\s+/).filter(Boolean).map(function (w) {
      return '<span class="lt-w">' + esc(w) + "</span>";
    }).join(" ");
  }

  /* ---------------- mount ---------------- */
  function mount(root, ctx) {
    const c = (ctx && ctx.config && ctx.config.letter) || (A.config && A.config.letter) || {};
    const body = Array.isArray(c.body) ? c.body : (c.body ? [c.body] : []);

    const SPK = [[3, 34, 11], [97, 26, 13], [9, 74, 9], [93, 70, 10], [1, 52, 7], [99, 49, 8], [16, 96, 7], [84, 4, 8]];
    const sparkles = SPK.map(function (s) {
      return '<span class="lt-spk" style="left:' + s[0] + "%;top:" + s[1] + "%;width:" + s[2] + "px;height:" + s[2] + 'px">' + spkSVG() + "</span>";
    }).join("");
    let crumbs = "";
    for (let i = 0; i < 7; i++) crumbs += '<span class="lt-crumb"></span>';

    root.innerHTML =
      '<div class="lt-scene">' + DEFS +
        '<p class="lt-prompt" aria-label="' + esc(c.prompt) + '"><span aria-hidden="true">' + splitChars(c.prompt) + "</span></p>" +
        '<div class="lt-env-pos">' +
          '<div class="lt-halo" aria-hidden="true"></div>' +
          '<div class="lt-sparkles" aria-hidden="true">' + sparkles + "</div>" +
          '<div class="lt-env-glow" aria-hidden="true"></div>' +
          '<div class="lt-env-float">' +
            '<button class="lt-envelope" type="button" aria-label="Buka surat">' +
              '<span class="lt-env-shadow"></span>' +
              '<span class="lt-env-back">' + envBackSVG() + "</span>" +
              '<span class="lt-sheet"></span>' +
              '<span class="lt-env-front">' + envFrontSVG() + "</span>" +
              '<span class="lt-flap">' +
                '<span class="lt-flap-face lt-flap-out">' + flapOutSVG() + "</span>" +
                '<span class="lt-flap-face lt-flap-in">' + flapInSVG() + "</span>" +
              "</span>" +
              '<span class="lt-seal">' +
                '<span class="lt-seal-glow"></span>' +
                '<span class="lt-seal-ring"></span>' +
                '<span class="lt-seal-body">' +
                  '<span class="lt-seal-whole">' + sealSVG() + "</span>" +
                  '<span class="lt-seal-halves">' +
                    '<span class="lt-seal-half l">' + sealSVG() + "</span>" +
                    '<span class="lt-seal-half r">' + sealSVG() + "</span>" +
                  "</span>" +
                "</span>" +
                crumbs +
              "</span>" +
              '<span class="lt-sheen"><i></i></span>' +
            "</button>" +
          "</div>" +
        "</div>" +
        '<p class="lt-tap hint">' + esc(c.tapHint) + "</p>" +
        '<div class="lt-read">' +
          '<article class="lt-letter" aria-label="Surat">' +
            '<div class="lt-card-glow" aria-hidden="true"></div>' +
            '<div class="lt-paper-shadow" aria-hidden="true"></div>' +
            '<div class="lt-paper3d" aria-hidden="true">' +
              '<div class="lt-pnl lt-p1"></div>' +
              '<div class="lt-pnl lt-p2"><div class="lt-pnl lt-p3"></div></div>' +
            "</div>" +
            '<div class="lt-content">' +
              '<span class="lt-frame" aria-hidden="true"></span>' +
              ornSVG() +
              '<div class="lt-head"><p class="lt-to">' + esc(c.to) + "</p>" + markSVG() + "</div>" +
              '<div class="lt-body">' +
                body.map(function (p) { return "<p>" + splitWords(p) + "</p>"; }).join("") +
              "</div>" +
              '<p class="lt-sign">' + esc(c.signature) + "</p>" +
            "</div>" +
            '<div class="lt-dock">' +
              '<p class="lt-rocket-hint hint">' + esc(c.rocketHint) + "</p>" +
              '<span class="lt-puffs" aria-hidden="true"></span>' +
              '<button class="lt-rocket" type="button" aria-label="' + esc(c.rocketHint || "Naik ke atas") + '">' +
                '<span class="lt-r-hover"><span class="lt-r-shake">' +
                  '<span class="lt-r-halo"></span>' +
                  '<span class="lt-r-trail"></span>' +
                  '<span class="lt-r-fglow"></span>' +
                  '<span class="lt-r-flame"><span class="lt-r-boost">' + flameSVG() + "</span></span>" +
                  rocketSVG() +
                "</span></span>" +
              "</button>" +
            "</div>" +
          "</article>" +
        "</div>" +
      "</div>";

    const q = function (s) { return root.querySelector(s); };
    const qa = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };
    Object.assign(R, {
      root: root,
      scene: q(".lt-scene"),
      prompt: q(".lt-prompt"),
      pChars: qa(".lt-pc"),
      tap: q(".lt-tap"),
      envPos: q(".lt-env-pos"),
      halo: q(".lt-halo"),
      spks: qa(".lt-spk"),
      envGlow: q(".lt-env-glow"),
      envFloat: q(".lt-env-float"),
      envelope: q(".lt-envelope"),
      sheet: q(".lt-sheet"),
      flap: q(".lt-flap"),
      flapSh: q(".lt-flap-sh"),
      seal: q(".lt-seal"),
      sealGlow: q(".lt-seal-glow"),
      sealRing: q(".lt-seal-ring"),
      sealBody: q(".lt-seal-body"),
      sealWhole: q(".lt-seal-whole"),
      sealHalves: q(".lt-seal-halves"),
      sealL: q(".lt-seal-half.l"),
      sealR: q(".lt-seal-half.r"),
      crumbs: qa(".lt-crumb"),
      sheenBand: q(".lt-sheen i"),
      read: q(".lt-read"),
      letter: q(".lt-letter"),
      cardGlow: q(".lt-card-glow"),
      pShadow: q(".lt-paper-shadow"),
      p2: q(".lt-p2"),
      p3: q(".lt-p3"),
      frame: q(".lt-frame"),
      ornL: q(".lt-orn-l"),
      ornR: q(".lt-orn-r"),
      ornDots: q(".lt-orn-dots"),
      ornStar: q(".lt-orn-star"),
      to: q(".lt-to"),
      markLine: q(".lt-mark-line"),
      markStars: qa(".lt-mark-star"),
      body: q(".lt-body"),
      content: q(".lt-content"),
      paras: qa(".lt-body p"),
      words: qa(".lt-w"),
      sign: q(".lt-sign"),
      dock: q(".lt-dock"),
      rHint: q(".lt-rocket-hint"),
      puffs: q(".lt-puffs"),
      rocket: q(".lt-rocket"),
      rHover: q(".lt-r-hover"),
      rShake: q(".lt-r-shake"),
      rHalo: q(".lt-r-halo"),
      trail: q(".lt-r-trail"),
      fglow: q(".lt-r-fglow"),
      flame: q(".lt-r-flame"),
      boost: q(".lt-r-boost")
    });

    // ---- state awal: semua tersembunyi ----
    gsap.set(R.envPos, { autoAlpha: 0 });
    gsap.set([R.halo, R.envGlow], { opacity: 0 });
    gsap.set(R.spks, { scale: 0, opacity: 0 });
    gsap.set(R.pChars, { opacity: 0 });
    gsap.set(R.tap, { autoAlpha: 0 });
    gsap.set(R.sheenBand, { opacity: 0, skewX: -16 });
    gsap.set(R.sealRing, { opacity: 0 });
    gsap.set(R.sealL, { transformOrigin: "30% 55%" });
    gsap.set(R.sealR, { transformOrigin: "70% 55%" });
    gsap.set(R.crumbs, { opacity: 0 });
    gsap.set(R.letter, { autoAlpha: 0 });
    gsap.set([R.p2, R.p3], { rotationX: 180 });
    gsap.set(R.pShadow, { height: "33.3333%" });
    gsap.set([R.cardGlow, R.frame], { opacity: 0 });
    gsap.set([R.ornL, R.ornR], { drawSVG: "0%" });
    gsap.set([R.ornDots, R.ornStar], { opacity: 0 });
    gsap.set(R.ornStar, { scale: 0, transformOrigin: "50% 50%" });
    gsap.set(R.to, { opacity: 0 });
    gsap.set(R.markLine, { drawSVG: "0%" });
    gsap.set(R.markStars, { scale: 0, opacity: 0, transformOrigin: "50% 50%" });
    gsap.set(R.words, { opacity: 0 });
    gsap.set(R.sign, { opacity: 0 });
    gsap.set(R.dock, { autoAlpha: 0 });
    gsap.set(R.rocket, { autoAlpha: 0 });
    gsap.set(R.rHint, { autoAlpha: 0 });
    gsap.set(R.trail, { scaleY: 0, opacity: 0 });

    R.envelope.disabled = true;
    R.rocket.disabled = true;
    R.envelope.addEventListener("click", onEnvelope);
    R.rocket.addEventListener("click", onRocket);
    fitLetter();
    new ResizeObserver(fitLetter).observe(R.read);
  }

  /* ---------------- fase 1: amplop jatuh melayang ---------------- */
  const FALL_EASE = "lt-fall";
  CustomEase.create(FALL_EASE, "M0,0 C0.16,0.3 0.42,0.82 0.62,0.98 C0.7,1.044 0.84,1.012 1,1");

  function intro() {
    const ctx = S.ctx;
    const rm = ctx.reducedMotion;
    const envH = R.envPos.offsetHeight;
    const startY = -(R.envPos.offsetTop + envH + 150);
    const tl = gsap.timeline({ delay: 0.35 });
    S.intro = tl;

    if (rm) {
      tl.fromTo(R.envPos, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.0, ease: "sine.out" }, 0);
      tl.to([R.halo, R.envGlow], { opacity: 1, duration: 1.2, ease: "sine.out" }, 0.2);
      tl.to(R.pChars, { opacity: 1, duration: 0.8, ease: "sine.out" }, 0.6);
      tl.to(R.tap, { autoAlpha: 1, duration: 0.8, ease: "sine.out" }, 1.0);
      tl.call(ready, null, 0.8);
      return;
    }

    const FALL = 3.1;
    tl.set(R.envPos, { autoAlpha: 1 }, 0);
    tl.fromTo(R.envPos, { y: startY }, { y: 0, duration: FALL, ease: FALL_EASE }, 0);

    // ayunan seperti kertas: geser kiri-kanan + miring, makin lama makin tenang
    const amp = Math.min(62, window.innerWidth * 0.15);
    const sway = { t: 0 };
    tl.to(sway, {
      t: 1, duration: FALL, ease: "none",
      onUpdate: function () {
        const t = sway.t;
        const d = Math.pow(1 - t, 1.55);
        const s = Math.sin(t * 1.75 * TAU);
        const c = Math.cos(t * 1.75 * TAU);
        gsap.set(R.envFloat, { x: amp * d * s, y: -11 * d * s * s, rotation: -13 * d * s });
        gsap.set(R.envelope, { rotationX: 11 * d * c, transformPerspective: 900 });
      }
    }, 0);

    tl.call(function () { if (ctx.sky && ctx.sky.comet) ctx.sky.comet(); }, null, 0.7);

    // glow menyala bersamaan dengan pendaratan
    tl.fromTo(R.halo, { opacity: 0, scale: 0.82 }, { opacity: 1, scale: 1, duration: 1.4, ease: "power2.out" }, FALL - 0.9);
    tl.fromTo(R.envGlow, { opacity: 0 }, { opacity: 1, duration: 1.0, ease: "sine.out" }, FALL - 0.6);
    tl.call(ready, null, FALL - 0.05);

    // kilau mutiara menyapu amplop sekali
    tl.fromTo(R.sheenBand, { xPercent: -130, opacity: 1 }, { xPercent: 330, duration: 1.5, ease: "power1.inOut" }, FALL + 0.05);
    tl.set(R.sheenBand, { opacity: 0 }, FALL + 1.6);

    // teks ajakan: per huruf, blur-in + naik halus
    tl.fromTo(R.pChars,
      { opacity: 0, yPercent: 42, filter: "blur(6px)" },
      { opacity: 1, yPercent: 0, filter: "blur(0px)", duration: 1.0, ease: "power3.out", stagger: 0.038, clearProps: "filter" },
      FALL - 0.1);
    tl.fromTo(R.tap, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "sine.out" }, FALL + 1.35);
  }

  function ready() {
    S.ready = true;
    R.envelope.disabled = false;
    startIdle();
  }

  function startIdle() {
    const rm = S.ctx.reducedMotion;
    // amplop "bernapas": melayang + glow di bawahnya ikut bernapas
    const idle = { t: 0 };
    S.idle = gsap.to(idle, {
      t: 600, duration: 600, ease: "none",
      onUpdate: function () {
        const t = idle.t;
        const k = Math.min(1, t / 1.4);
        const ramp = k * k * (3 - 2 * k);
        const b = Math.sin((t / 4.4) * TAU);
        gsap.set(R.envFloat, { y: -6 * b * ramp, rotation: 1.1 * Math.sin((t / 6.2) * TAU + 0.6) * ramp });
        R.envGlow.style.opacity = (1 - 0.18 * (b * 0.5 + 0.5) * ramp).toFixed(3);
      }
    });
    if (rm) S.idle.kill();

    // segel berdenyut (lub-dub) + cincin emas mengembang
    S.pulse = gsap.timeline({ repeat: -1, repeatDelay: 1.1, delay: 0.5 })
      .fromTo(R.sealRing, { scale: 1, opacity: 0.9 }, { scale: 1.8, opacity: 0, duration: 1.6, ease: "power2.out" }, 0)
      .to(R.sealBody, { scale: 1.09, duration: 0.13, ease: "power2.out" }, 0)
      .to(R.sealBody, { scale: 1, duration: 0.18, ease: "sine.in" }, 0.13)
      .to(R.sealBody, { scale: 1.05, duration: 0.11, ease: "power2.out" }, 0.33)
      .to(R.sealBody, { scale: 1, duration: 0.42, ease: "sine.inOut" }, 0.44)
      .fromTo(R.sealGlow, { opacity: 0.55, scale: 0.9 }, { opacity: 1, scale: 1.12, duration: 0.3, ease: "sine.out", yoyo: true, repeat: 1 }, 0);

    // kilau kecil di sekitar amplop
    S.spk = R.spks.map(function (el, i) {
      return gsap.timeline({ repeat: -1, repeatDelay: A.rand(1.4, 3.4), delay: 0.2 + i * 0.37 })
        .fromTo(el, { scale: 0, opacity: 0, rotation: -40 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.7, ease: "sine.out" })
        .to(el, { scale: 0, opacity: 0, rotation: 40, duration: 0.9, ease: "sine.in" });
    });
  }

  function stopIdle() {
    if (S.idle) S.idle.kill();
    if (S.pulse) S.pulse.kill();
    if (S.spk) S.spk.forEach(function (t) { t.kill(); });
    gsap.to(R.spks, { scale: 0, opacity: 0, duration: 0.3, ease: "power1.in", overwrite: true });
    gsap.to(R.sealRing, { opacity: 0, duration: 0.2, overwrite: true });
    gsap.to(R.sealBody, { scale: 1, duration: 0.2, overwrite: true });
  }

  /* ---------------- fase 2: amplop dibuka ---------------- */
  function onEnvelope() {
    if (!S || !S.ready || S.opened) return;
    S.opened = true;
    R.envelope.disabled = true;
    if (S.ctx.unlockAudio) S.ctx.unlockAudio();
    if (S.intro) S.intro.kill();
    stopIdle();
    gsap.set(R.sheenBand, { opacity: 0 });
    fitLetter();
    if (S.ctx.reducedMotion) openReduced();
    else openEnvelope();
  }

  // Semua isi surat tetap terbaca tanpa area scroll, termasuk setelah rotasi layar.
  function fitLetter() {
    const available = R.read.clientHeight;
    if (!available) return;
    R.letter.style.setProperty("--lt-fit", "1");
    if (R.content.scrollHeight <= available) return;
    let low = 0.45, high = 1;
    for (let step = 0; step < 9; step++) {
      const mid = (low + high) / 2;
      R.letter.style.setProperty("--lt-fit", mid.toFixed(4));
      if (R.content.scrollHeight <= available) low = mid;
      else high = mid;
    }
    R.letter.style.setProperty("--lt-fit", low.toFixed(4));
  }

  function measureLetter() {
    fitLetter();
    gsap.set(R.letter, { clearProps: "transform" });
    return R.letter.getBoundingClientRect();
  }

  function openEnvelope() {
    const W = window.innerWidth;
    const H = R.scene.clientHeight;
    const L = measureLetter();
    const envW = R.envPos.offsetWidth;
    const envH = R.envPos.offsetHeight;

    // ukuran kertas terlipat di dalam amplop = sepertiga kartu surat (rasio sama)
    const sheetW = envW * 0.86;
    const sheetH = Math.min(envH * 0.8, Math.max(envH * 0.4, sheetW * (L.height / 3) / L.width));
    R.sheet.style.height = f2(sheetH) + "px";
    const travel = envH * 0.93 + 10;

    // target amplop: lebih besar, turun ke bagian bawah layar
    const sc = Math.min(1.22, (W * 0.92) / envW);
    const readBottom = parseFloat(getComputedStyle(R.read).bottom) || 16;
    const gap = Math.max(H * 0.045, readBottom + 10);
    const dy = (H - gap - (envH * sc) / 2) - (R.envPos.offsetTop + envH / 2);

    const tl = gsap.timeline();
    S.openTl = tl;

    // teks ajakan keluar cepat
    tl.to(R.pChars, { opacity: 0, yPercent: -35, duration: 0.3, ease: "power2.in", stagger: { each: 0.01, from: "end" }, overwrite: true }, 0);
    tl.to(R.tap, { autoAlpha: 0, y: -4, duration: 0.24, ease: "power1.in", overwrite: true }, 0);

    // umpan balik ketukan
    tl.to(R.envelope, { scale: 0.955, rotationX: 0, duration: 0.11, ease: "power1.in" }, 0);
    tl.to(R.envelope, { scale: 1, duration: 0.6, ease: "back.out(2.2)" }, 0.11);
    tl.to(R.envFloat, { x: 0, y: 0, rotation: 0, duration: 0.6, ease: "sine.inOut" }, 0);
    tl.to(R.envGlow, { opacity: 1, duration: 0.4 }, 0);
    tl.to(R.halo, { opacity: 0.6, scale: 1, duration: 1.0, ease: "sine.inOut", overwrite: true }, 0.1);

    // membesar & turun
    tl.to(R.envPos, { y: dy, scale: sc, duration: 1.2, ease: "power3.inOut" }, 0.12);

    // segel pecah
    tl.add(sealBreak(), 0.62);

    // flap terbuka (3D)
    tl.to(R.flapSh, { opacity: 0, duration: 0.2, ease: "power1.in" }, 1.0);
    let swapped = false;
    tl.fromTo(R.flap, { rotationX: 0 }, {
      rotationX: 180, duration: 0.9, ease: "power2.inOut",
      onUpdate: function () {
        if (!swapped && gsap.getProperty(R.flap, "rotationX") > 90) {
          swapped = true;
          R.flap.style.zIndex = "1";
        }
      }
    }, 1.0);

    // kertas meluncur keluar dari amplop
    tl.fromTo(R.sheet, { y: 0 }, { y: -travel, duration: 1.05, ease: "power2.inOut" }, 1.62);
    tl.call(handoff, null, 2.7);
  }

  function sealBreak() {
    const tl = gsap.timeline();
    tl.fromTo(R.sealRing, { scale: 1, opacity: 1 }, { scale: 2.3, opacity: 0, duration: 0.55, ease: "power2.out" }, 0);
    tl.to(R.sealGlow, { scale: 1.6, opacity: 0, duration: 0.6, ease: "power2.out" }, 0);
    tl.to(R.sealBody, { scale: 0.93, duration: 0.07, ease: "power1.in" }, 0);
    tl.set(R.sealWhole, { visibility: "hidden" }, 0.07);
    tl.set(R.sealHalves, { visibility: "visible" }, 0.07);
    tl.to(R.sealL, { x: -8, y: 7, rotation: -26, opacity: 0, duration: 0.62, ease: "power2.in" }, 0.08);
    tl.to(R.sealR, { x: 9, y: 8, rotation: 24, opacity: 0, duration: 0.62, ease: "power2.in" }, 0.08);
    R.crumbs.forEach(function (el, i) {
      const a = -Math.PI / 2 + (i - (R.crumbs.length - 1) / 2) * 0.55 + A.rand(-0.15, 0.15);
      const d = A.rand(16, 30);
      tl.fromTo(el,
        { x: 0, y: 0, scale: A.rand(0.6, 1.2), opacity: 1 },
        { x: Math.cos(a) * d, y: Math.sin(a) * d + 22, scale: 0.3, opacity: 0, duration: A.rand(0.5, 0.75), ease: "power2.out" },
        0.08);
    });
    return tl;
  }

  // kertas di amplop diserahkan ke kartu surat (FLIP): posisi & ukuran sama persis
  function handoff() {
    const H = R.scene.clientHeight;
    const sr = R.sheet.getBoundingClientRect();
    const L = measureLetter();
    const sx = sr.width / L.width;
    const sy = sr.height / (L.height / 3);
    gsap.set(R.letter, { transformOrigin: "0 0", x: sr.left - L.left, y: sr.top - L.top, scaleX: sx, scaleY: sy, autoAlpha: 1 });
    gsap.set(R.sheet, { autoAlpha: 0 });


    const tl = gsap.timeline();
    S.readTl = tl;
    // naik ke posisi baca sambil membesar
    tl.to(R.letter, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 1.05, ease: "power3.inOut" }, 0);
    tl.set(R.letter, { clearProps: "transform,transformOrigin" }, 1.06);
    // amplop turun & memudar
    tl.to(R.envPos, { y: "+=" + Math.round(H * 0.5), rotation: 4, autoAlpha: 0, duration: 0.95, ease: "power2.in" }, 0.15);

    // lipatan kertas terbuka
    tl.add(unfold(R.p2, 0.75, "power2.inOut"), 0.9);
    tl.to(R.pShadow, { height: "66.6667%", duration: 0.75, ease: "power2.inOut" }, 0.9);
    tl.add(unfold(R.p3, 0.85, "power3.out"), 1.45);
    tl.to(R.pShadow, { height: "100%", duration: 0.85, ease: "power3.out" }, 1.45);

    tl.call(function () {
      gsap.set([R.p2, R.p3], { clearProps: "transform" });
      R.p2.style.perspective = "none";
      R.p2.style.setProperty("--lt-shade", "0");
      R.p3.style.setProperty("--lt-shade", "0");
    }, null, 2.32);

    tl.fromTo(R.cardGlow, { opacity: 0, scale: 0.86 }, { opacity: 1, scale: 1, duration: 1.3, ease: "power2.out" }, 1.75);
    tl.to(R.frame, { opacity: 1, duration: 0.9, ease: "sine.out" }, 2.0);

    const done = revealText(tl, 2.1);
    tl.call(function () { gsap.delayedCall(3, showRocket); }, null, done);
  }

  function unfold(el, dur, ease) {
    const o = { a: 180 };
    return gsap.to(o, {
      a: 0, duration: dur, ease: ease,
      onUpdate: function () {
        gsap.set(el, { rotationX: o.a });
        el.style.setProperty("--lt-shade", (0.32 * Math.sin((o.a * Math.PI) / 180)).toFixed(3));
      }
    });
  }

  function lineGroups(p) {
    const out = [];
    let top = null, cur = null;
    p.querySelectorAll(".lt-w").forEach(function (w) {
      const t = w.offsetTop;
      if (top === null || Math.abs(t - top) > 4) { cur = []; out.push(cur); top = t; }
      cur.push(w);
    });
    return out;
  }

  // ornamen, salam, isi (baris per baris), tanda tangan. Return waktu selesai.
  function revealText(tl, at) {
    tl.to(R.ornL, { drawSVG: "100%", duration: 0.9, ease: "power2.out" }, at);
    tl.to(R.ornR, { drawSVG: "100%", duration: 0.9, ease: "power2.out" }, at);
    tl.to(R.ornStar, { scale: 1, opacity: 1, rotation: 90, duration: 0.8, ease: "back.out(1.8)" }, at + 0.05);
    tl.to(R.ornDots, { opacity: 1, duration: 0.5, ease: "sine.out" }, at + 0.6);

    tl.fromTo(R.to, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.9, ease: "power2.out" }, at + 0.2);
    tl.to(R.markLine, { drawSVG: "100%", duration: 1.1, ease: "sine.inOut" }, at + 0.45);
    tl.to(R.markStars, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)", stagger: 0.1 }, at + 0.5);

    let t = at + 0.65;
    R.paras.forEach(function (p) {
      lineGroups(p).forEach(function (words) {
        tl.fromTo(words, { opacity: 0, y: 7 }, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", stagger: 0.016 }, t);
        t += 0.24;
      });
      t += 0.2;
    });

    tl.fromTo(R.sign,
      { opacity: 1, clipPath: "inset(-40% 104% -40% -8%)" },
      { clipPath: "inset(-40% -8% -40% -8%)", duration: 1.5, ease: "power1.inOut" }, t);
    tl.set(R.sign, { clipPath: "none" }, t + 1.5);
    return t + 1.5;
  }

  function openReduced() {
    const tl = gsap.timeline();
    tl.to([R.pChars, R.tap], { opacity: 0, duration: 0.3 }, 0);
    tl.to(R.envPos, { autoAlpha: 0, duration: 0.5 }, 0.1);
    gsap.set([R.p2, R.p3], { rotationX: 0 });
    gsap.set(R.pShadow, { height: "100%" });
    gsap.set([R.ornL, R.ornR, R.markLine], { drawSVG: "100%" });
    gsap.set([R.ornStar, R.markStars], { scale: 1 });
    tl.fromTo(R.letter, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 0.4);
    tl.to([R.cardGlow, R.frame, R.ornDots, R.ornStar, R.markStars, R.to], { opacity: 1, duration: 0.6 }, 0.9);
    tl.to(R.words, { opacity: 1, duration: 0.8 }, 1.2);
    tl.to(R.sign, { opacity: 1, duration: 0.6 }, 1.8);
    tl.call(function () {
      gsap.delayedCall(3, showRocket);
    }, null, 2.4);
  }

  /* ---------------- fase 3: roket ---------------- */
  function showRocket() {
    const rm = S.ctx.reducedMotion;
    gsap.set(R.dock, { autoAlpha: 1 });
    const tl = gsap.timeline();
    tl.fromTo(R.rocket,
      { autoAlpha: 0, y: rm ? 0 : 46, scale: rm ? 1 : 0.5 },
      { autoAlpha: 1, y: 0, scale: 1, duration: rm ? 0.6 : 1.1, ease: rm ? "sine.out" : "back.out(1.4)" }, 0);
    tl.fromTo(R.rHalo, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 1.2, ease: "power2.out" }, 0.1);
    tl.fromTo(R.rHint, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "sine.out" }, 0.6);
    tl.call(function () { S.rocketReady = true; R.rocket.disabled = false; }, null, 0.3);

    // api berkedip
    S.flicker = gsap.to(R.flame, { scaleY: "random(0.76, 1.14)", scaleX: "random(0.86, 1.08)", duration: 0.07, ease: "none", repeat: -1, repeatRefresh: true });
    S.fglowFlicker = gsap.to(R.fglow, { opacity: "random(0.65, 1)", duration: 0.09, ease: "none", repeat: -1, repeatRefresh: true });

    // melayang naik-turun pelan
    if (!rm) {
      const o = { t: 0 };
      S.rIdle = gsap.to(o, {
        t: 600, duration: 600, ease: "none", delay: 0.9,
        onUpdate: function () {
          const k = Math.min(1, o.t / 0.8);
          gsap.set(R.rHover, { y: -5 * Math.sin((o.t / 2.3) * TAU) * k, rotation: 2.2 * Math.sin((o.t / 3.4) * TAU) * k });
        }
      });
    }
  }

  function onRocket() {
    if (!S || !S.rocketReady || S.launched) return;
    S.launched = true;
    R.rocket.disabled = true;
    if (S.rIdle) S.rIdle.kill();
    const rm = S.ctx.reducedMotion;

    const tl = gsap.timeline();
    tl.to(R.rHint, { autoAlpha: 0, y: -6, duration: 0.22, ease: "power2.in" }, 0);
    tl.to(R.rHover, { y: 0, rotation: 0, duration: 0.25, ease: "power2.out" }, 0);
    if (!rm) {
      S.shake = gsap.to(R.rShake, { x: "random(-1.8, 1.8)", y: "random(-1.1, 1.1)", duration: 0.045, ease: "none", repeat: -1, repeatRefresh: true });
      tl.to(R.boost, { scaleY: 1.9, scaleX: 1.24, duration: 0.4, ease: "power2.out" }, 0);
      tl.to(R.fglow, { scale: 1.75, duration: 0.42, ease: "power2.out" }, 0);
      tl.call(ignitionPuffs, null, 0.06);
    }
    tl.call(launch, null, rm ? 0.2 : 0.46);
  }

  function ignitionPuffs() {
    for (let i = 0; i < 9; i++) {
      const el = document.createElement("span");
      el.className = "lt-puff";
      R.puffs.appendChild(el);
      const dir = i % 2 ? 1 : -1;
      gsap.fromTo(el,
        { x: 0, y: 0, scale: 0.25, opacity: 0 },
        {
          keyframes: { opacity: [0, 0.8, 0.45, 0] },
          x: dir * A.rand(16, 64), y: A.rand(-6, 10), scale: A.rand(1.2, 2.1),
          duration: A.rand(1.1, 1.7), ease: "power2.out", delay: i * 0.025,
          onComplete: function () { el.remove(); }
        });
    }
    for (let j = 0; j < 10; j++) {
      const em = document.createElement("span");
      em.className = "lt-ember";
      R.puffs.appendChild(em);
      const a = A.rand(Math.PI * 0.15, Math.PI * 0.85);
      const d = A.rand(18, 52);
      gsap.fromTo(em,
        { x: 0, y: -4, opacity: 1, scale: A.rand(0.7, 1.3) },
        {
          x: Math.cos(a) * d * (j % 2 ? 1 : -1), y: Math.sin(a) * d * 0.45 - 4, opacity: 0, scale: 0.2,
          duration: A.rand(0.5, 0.85), ease: "power2.out",
          onComplete: function () { em.remove(); }
        });
    }
  }

  // pindahkan roket ke lapisan #fx (posisi layar sama), lalu terbang ke atas
  function launch() {
    const ctx = S.ctx;
    const rm = ctx.reducedMotion;
    const el = R.rocket;
    const rect = el.getBoundingClientRect();
    const H = window.innerHeight;

    el.classList.add("is-flying");
    el.style.left = f2(rect.left) + "px";
    el.style.top = f2(rect.top) + "px";
    el.style.pointerEvents = "none";
    gsap.set(el, { x: 0, y: 0, scale: 1, autoAlpha: 1 });
    ctx.fx.appendChild(el);

    S.flying = true;
    const trailLen = rm ? 0 : H * 0.46;
    const dist = rect.top + rect.height + trailLen + 80;

    const fl = gsap.timeline({ onComplete: endFlight });
    S.flight = fl;
    if (rm) {
      fl.to(el, { y: -Math.min(120, dist), autoAlpha: 0, duration: 1.0, ease: "power1.in" }, 0);
    } else {
      fl.to(el, { y: -dist, duration: 2.55, ease: "power3.in" }, 0);
      fl.fromTo(R.trail, { scaleY: 0, opacity: 0 }, { scaleY: 1, opacity: 1, duration: 0.9, ease: "power2.out" }, 0.05);
      fl.to(R.rHover, { rotation: 2.4, duration: 0.55, ease: "sine.inOut" }, 0);
      fl.to(R.rHover, { rotation: -1.8, duration: 0.7, ease: "sine.inOut" }, 0.55);
      fl.to(R.rHover, { rotation: 0.6, duration: 0.6, ease: "sine.inOut" }, 1.25);
      emitSparks();
    }

    S.resolve();
  }

  function emitSparks() {
    if (!S || !S.flying) return;
    const fx = S.ctx.fx;
    const fr = R.flame.getBoundingClientRect();
    if (fr.top > -30 && S.sparkCount < 30) {
      const sp = document.createElement("span");
      sp.className = "lt-spark" + (Math.random() < 0.3 ? " is-ice" : "");
      sp.style.pointerEvents = "none";
      fx.appendChild(sp);
      S.sparkCount++;
      const x = fr.left + fr.width / 2 + A.rand(-3, 3);
      const y = fr.top + fr.height * 0.7;
      gsap.fromTo(sp,
        { x: x, y: y, scale: A.rand(0.7, 1.4), opacity: 1 },
        {
          x: x + A.rand(-14, 14), y: y + A.rand(40, 120), scale: A.rand(0.15, 0.4), opacity: 0,
          duration: A.rand(0.55, 0.9), ease: "power1.out",
          onComplete: function () { sp.remove(); S.sparkCount--; }
        });
    }
    if (fr.bottom > -40) S.emit = gsap.delayedCall(0.035, emitSparks);
  }

  function endFlight() {
    S.flying = false;
    if (S.emit) S.emit.kill();
    if (S.flicker) S.flicker.kill();
    if (S.fglowFlicker) S.fglowFlicker.kill();
    if (S.shake) S.shake.kill();
    R.rocket.remove();
  }

  /* ---------------- registrasi ---------------- */
  A.registerScene("letter", {
    mount: mount,
    play: function (ctx) {
      return new Promise(function (resolve) {
        S = { ctx: ctx, resolve: resolve, sparkCount: 0 };
        intro();
      });
    },
    leave: function () {
      gsap.to(R.cardGlow, { opacity: 0.45, duration: 1.6, ease: "sine.inOut" });
    }
  });
})();

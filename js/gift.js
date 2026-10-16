/* ==========================================================================
   gift — Scene 3 (stasiun paling atas): empat kotak kado di bawah langit.
   Alur play():
     teks prompt muncul → 4 kado jatuh (stagger) lalu melayang pelan →
     user memilih satu → kado lain menjauh, kado terpilih ke tengah & membesar →
     antisipasi (goyang, cahaya bocor dari celah tutup) → tutup meletup & terlempar →
     ledakan cahaya + partikel bintang → serah-terima ke modul buku (docs/BOOK.md):
       <div class="gf-book-slot"> dibuat di #st-gift, Aleove.scenes.book.mount(slot, ctx),
       slot muncul dari mulut kotak (opacity + scale, dengan halo), lalu book.play(ctx).
   Struktur transform tiap kotak (dipisah supaya tween tidak bertabrakan):
     .gf-box (masuk, pindah ke tengah, keluar) > .gf-float (melayang) >
     .gf-hov (hover/press, CSS) > .gf-shake (goyang) > .gf-squash (squash) > badan + .gf-lid
   ========================================================================== */
(function () {
  "use strict";
  const A = window.Aleove;

  /* ---------------- data visual ---------------- */
  const RIBBON = {
    gold: { dark: "#b0853c", base: "#e3c07a", hi: "#fff4d6" },
    silver: { dark: "#8595b1", base: "#d2dcec", hi: "#ffffff" }
  };
  const THEME = {
    ice: {
      bodyL: "#fbfdff", bodyM: "#e4eefa", bodyR: "#c3d6ee", shade: "#6f8fbf",
      lidT: "#ffffff", lidB: "#dce8f7",
      star: "#6a8fc6", star2: "#cfa557", line: "#7f9fd0", lineOp: 0.5,
      gloss: 0.32, rim: "#8ae8ff", rimOp: 0.55, ribbon: "gold"
    },
    navy: {
      bodyL: "#2c52a2", bodyM: "#1b3878", bodyR: "#0d1d47", shade: "#030a20",
      lidT: "#3d66bb", lidB: "#1d3b80",
      star: "#e8f3ff", star2: "#f3d38a", line: "#b4ceff", lineOp: 0.42,
      gloss: 0.1, rim: "#8ae8ff", rimOp: 0.6, ribbon: "silver"
    }
  };
  const LAYOUT = ["ice", "navy", "navy", "ice"]; // papan catur 2×2
  const DROP_ORDER = [0, 3, 1, 2]; // urutan jatuh: diagonal bersilang

  // rasi kecil di badan kotak (koordinat 0..1 di area rasi), satu per kotak
  const CONSTELLATIONS = [
    [[0, 0.32], [0.24, 0.78], [0.5, 0.4], [0.76, 0.86], [1, 0.22]],                         // W (Cassiopeia)
    [[0, 0.08], [0.3, 0.22], [0.56, 0.3], [0.74, 0.56], [1, 0.5], [0.94, 0.9], [0.68, 0.94], [0.74, 0.56]], // gayung
    [[0.5, 1], [0.1, 0.58], [0.06, 0.26], [0.3, 0.04], [0.5, 0.3], [0.7, 0.04], [0.94, 0.26], [0.9, 0.58], [0.5, 1]], // hati
    [[0.25, 0], [0.12, 0.42], [0.52, 0.56], [0.44, 1], [0.92, 0.84], [0.52, 0.56]]          // Lyra
  ];

  const VB_Y = 10, VB_H = 126; // viewBox "0 10 120 126" → tinggi kotak = 1.05 × lebar
  const BOX_RATIO = VB_H / 120;
  const MOUTH_Y = (58 - VB_Y) / VB_H; // bibir atas badan (posisi relatif)

  const prand = function (n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const f1 = function (n) { return n.toFixed(1); };

  function spark(x, y, s) {
    return "M" + f1(x) + " " + f1(y - s) + "Q" + f1(x) + " " + f1(y) + " " + f1(x + s) + " " + f1(y) +
      "Q" + f1(x) + " " + f1(y) + " " + f1(x) + " " + f1(y + s) + "Q" + f1(x) + " " + f1(y) + " " + f1(x - s) + " " + f1(y) +
      "Q" + f1(x) + " " + f1(y) + " " + f1(x) + " " + f1(y - s) + "Z";
  }

  function ribbonGrad(id, R) {
    return '<linearGradient id="' + id + '" x1="0" x2="1" y1="0" y2="0">' +
      '<stop offset="0" stop-color="' + R.dark + '"/><stop offset=".26" stop-color="' + R.base + '"/>' +
      '<stop offset=".5" stop-color="' + R.hi + '"/><stop offset=".74" stop-color="' + R.base + '"/>' +
      '<stop offset="1" stop-color="' + R.dark + '"/></linearGradient>';
  }

  /* ---------------- SVG badan kotak ---------------- */
  function bodySVG(i, t) {
    const id = "gf" + i;
    const R = RIBBON[t.ribbon];
    let deco = "";

    // bintang kecil tersebar (menghindari pita di tengah)
    for (let k = 0; k < 17; k++) {
      let x = 15 + prand(i * 97 + k * 3.1) * 90;
      if (x > 49 && x < 71) x = x < 60 ? x - 23 : x + 23;
      const y = 63 + prand(i * 53 + k * 7.7) * 66;
      const r = 0.35 + prand(i * 31 + k * 1.9) * 0.7;
      const op = 0.3 + prand(i * 17 + k * 5.3) * 0.55;
      deco += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + r.toFixed(2) + '" fill="' +
        (k % 6 === 0 ? t.star2 : t.star) + '" opacity="' + op.toFixed(2) + '"/>';
    }

    // rasi: kiri untuk kotak 0 & 3, kanan untuk 1 & 2
    const left = i === 0 || i === 3;
    const ax = left ? 18 : 72, aw = 30, ay = 72, ah = 40;
    const pts = CONSTELLATIONS[i].map(function (p) { return [ax + p[0] * aw, ay + p[1] * ah]; });
    deco += '<polyline points="' + pts.map(function (p) { return f1(p[0]) + "," + f1(p[1]); }).join(" ") +
      '" fill="none" stroke="' + t.line + '" stroke-width=".45" stroke-linejoin="round" opacity="' + t.lineOp + '"/>';
    pts.forEach(function (p, k) {
      deco += '<circle cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="' + (k === 2 ? 1.25 : 0.85) + '" fill="' + t.star + '"/>';
    });
    deco += '<path d="' + spark(pts[2][0], pts[2][1], 3.2) + '" fill="' + t.star + '" opacity=".75"/>';
    // dua kilau kecil di sisi lain
    const sx = left ? 86 : 30;
    deco += '<path d="' + spark(sx, 84 + i * 3, 2.6) + '" fill="' + t.star2 + '" opacity=".85"/>';
    deco += '<path d="' + spark(sx + 8, 112 - i * 2, 1.8) + '" fill="' + t.star + '" opacity=".6"/>';

    return '<svg class="gf-svg gf-svg-body" viewBox="0 10 120 126" aria-hidden="true" focusable="false">' +
      "<defs>" +
      '<linearGradient id="' + id + 'b" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="' + t.bodyL + '"/>' +
      '<stop offset=".55" stop-color="' + t.bodyM + '"/><stop offset="1" stop-color="' + t.bodyR + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'bs" x1="0" x2="0" y1="0" y2="1"><stop offset=".4" stop-color="' + t.shade + '" stop-opacity="0"/>' +
      '<stop offset="1" stop-color="' + t.shade + '" stop-opacity=".5"/></linearGradient>' +
      '<linearGradient id="' + id + 'ls" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#01040f" stop-opacity=".34"/>' +
      '<stop offset="1" stop-color="#01040f" stop-opacity="0"/></linearGradient>' +
      ribbonGrad(id + "r", R) +
      '<clipPath id="' + id + 'bc"><rect x="12" y="58" width="96" height="74" rx="3.5"/></clipPath>' +
      "</defs>" +
      '<rect x="12" y="58" width="96" height="74" rx="3.5" fill="url(#' + id + 'b)"/>' +
      '<g clip-path="url(#' + id + 'bc)">' + deco +
      '<rect x="12" y="58" width="96" height="74" fill="url(#' + id + 'bs)"/>' +
      '<rect x="16" y="58" width="10" height="74" fill="#fff" opacity="' + t.gloss + '"/>' +
      '<rect x="28" y="58" width="2.4" height="74" fill="#fff" opacity="' + (t.gloss * 0.6).toFixed(2) + '"/>' +
      '<rect x="53" y="58" width="14" height="74" fill="url(#' + id + 'r)"/>' +
      '<rect x="53" y="58" width=".6" height="74" fill="#01040f" opacity=".2"/>' +
      '<rect x="66.4" y="58" width=".6" height="74" fill="#01040f" opacity=".2"/>' +
      '<rect x="12" y="58" width="96" height="11" fill="url(#' + id + 'ls)"/>' +
      '<rect x="106.4" y="58" width="1.6" height="74" fill="' + t.rim + '" opacity="' + t.rimOp + '"/>' +
      '<rect x="12" y="130.4" width="96" height="1.6" fill="#01040f" opacity=".22"/>' +
      "</g></svg>";
  }

  /* ---------------- SVG tutup + pita kupu-kupu ---------------- */
  function lidSVG(i, t) {
    const id = "gf" + i;
    const R = RIBBON[t.ribbon];
    let stars = "";
    for (let k = 0; k < 7; k++) {
      let x = 10 + prand(i * 41 + k * 2.3) * 100;
      if (x > 50 && x < 70) x += x < 60 ? -18 : 18;
      const y = 46 + prand(i * 29 + k * 4.1) * 12;
      stars += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + (0.4 + prand(i + k) * 0.5).toFixed(2) +
        '" fill="' + (k === 3 ? t.star2 : t.star) + '" opacity="' + (0.4 + prand(k * 9 + i) * 0.5).toFixed(2) + '"/>';
    }

    // setengah pita (kiri); sisi kanan = cermin
    const half =
      '<path d="M57.5 42 C55 50 51 58 46.5 70 L50.6 67.2 L53.4 72.6 C56 62 58.6 52 61 43 Z" fill="url(#' + id + 'tl)"/>' +
      '<path d="M57.5 42 C55 50 51 58 46.5 70" fill="none" stroke="' + R.hi + '" stroke-width=".6" opacity=".6"/>' +
      '<path d="M60 40 C55 31 45 19 34 18.5 C25 18 21 26 25 33 C29 39.5 46 42 60 40 Z" fill="url(#' + id + 'bw)"/>' +
      '<path d="M57.5 38.6 C52 33 44 26.5 36 26 C31 25.8 29.5 29.5 32 32.6 C36 36.5 48 39 57.5 38.6 Z" fill="' + R.dark + '" opacity=".5"/>' +
      '<path d="M57 36.4 C51 29 43 22.2 35 21.6" fill="none" stroke="' + R.hi + '" stroke-width="1.1" stroke-linecap="round" opacity=".9"/>' +
      '<path d="M60 40 L52 36.2 L54.5 40.6 Z" fill="' + R.dark + '" opacity=".4"/>';

    return '<svg class="gf-svg gf-svg-lid" viewBox="0 10 120 126" aria-hidden="true" focusable="false">' +
      "<defs>" +
      '<linearGradient id="' + id + 'l" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="' + t.lidT + '"/>' +
      '<stop offset="1" stop-color="' + t.lidB + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'lh" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".22"/>' +
      '<stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#01040f" stop-opacity=".16"/></linearGradient>' +
      ribbonGrad(id + "rl", R) +
      '<linearGradient id="' + id + 'bw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + R.hi + '"/>' +
      '<stop offset=".45" stop-color="' + R.base + '"/><stop offset="1" stop-color="' + R.dark + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'tl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + R.base + '"/>' +
      '<stop offset="1" stop-color="' + R.dark + '"/></linearGradient>' +
      '<clipPath id="' + id + 'lc"><rect x="6" y="42" width="108" height="20" rx="3"/></clipPath>' +
      "</defs>" +
      '<rect x="6" y="42" width="108" height="20" rx="3" fill="url(#' + id + 'l)"/>' +
      '<g clip-path="url(#' + id + 'lc)">' + stars +
      '<rect x="6" y="42" width="108" height="20" fill="url(#' + id + 'lh)"/>' +
      '<rect x="53" y="42" width="14" height="20" fill="url(#' + id + 'rl)"/>' +
      '<rect x="6" y="42" width="108" height="1.5" fill="#fff" opacity=".6"/>' +
      '<rect x="6" y="59.8" width="108" height="2.2" fill="#01040f" opacity=".18"/>' +
      '<rect x="112.4" y="42" width="1.6" height="20" fill="' + t.rim + '" opacity="' + t.rimOp + '"/>' +
      "</g>" +
      "<g>" + half + "</g>" +
      '<g transform="matrix(-1 0 0 1 120 0)">' + half + "</g>" +
      '<rect x="54" y="34.4" width="12" height="10.6" rx="3.6" fill="url(#' + id + 'bw)"/>' +
      '<rect x="56.2" y="35.6" width="5" height="1.8" rx=".9" fill="' + R.hi + '" opacity=".85"/>' +
      '<rect x="54.6" y="43.4" width="10.8" height="1.2" rx=".6" fill="' + R.dark + '" opacity=".5"/>' +
      "</svg>";
  }

  const GLINT_SVG = '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="' + spark(10, 10, 10) +
    '" fill="#fff"/><circle cx="10" cy="10" r="1.8" fill="#fff"/></svg>';
  const STAR_SVG = '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="' + spark(10, 10, 9) + '" fill="currentColor"/></svg>';

  function boxHTML(i) {
    const kind = LAYOUT[i];
    const t = THEME[kind];
    return '<button class="gf-box gf-box--' + kind + '" type="button" aria-label="Kado ' + (i + 1) + '" data-i="' + i + '">' +
      '<span class="gf-shadow"></span>' +
      '<span class="gf-float"><span class="gf-hov">' +
      '<span class="gf-glow"></span>' +
      '<span class="gf-shake"><span class="gf-squash">' +
      bodySVG(i, t) +
      '<span class="gf-sheen"><i></i></span>' +
      '<span class="gf-mouth"></span>' +
      '<span class="gf-lid">' + lidSVG(i, t) + '<span class="gf-glint">' + GLINT_SVG + "</span></span>" +
      '<span class="gf-seam"></span>' +
      "</span></span>" +
      "</span></span></button>";
  }

  // sinar cahaya tidak beraturan (conic-gradient dibangun sekali)
  function raysGradient() {
    const stops = [];
    let a = 0, n = 0;
    while (a < 356) {
      const w = 1.4 + prand(n * 5 + 2) * 4.2;
      const al = (0.16 + prand(n * 7 + 3) * 0.55).toFixed(2);
      stops.push("rgba(255,246,222,0) " + a.toFixed(1) + "deg");
      stops.push("rgba(255,246,222," + al + ") " + (a + w / 2).toFixed(1) + "deg");
      stops.push("rgba(255,246,222,0) " + (a + w).toFixed(1) + "deg");
      a += w + 5 + prand(n * 3 + 1) * 15;
      n++;
    }
    stops.push("rgba(255,246,222,0) 360deg");
    return "conic-gradient(from 0deg at 50% 50%, " + stops.join(", ") + ")";
  }

  /* ---------------- state ---------------- */
  const S = { loops: [], boxes: [], parts: [], picked: false };
  const PARTICLES = 34;
  const P_COLORS = ["#ffffff", "#fff2c2", "#d6ecff", "#8ae8ff", "#f3d38a", "#ffffff"];

  /* ======================================================================
     mount — bangun DOM, semua tersembunyi
     ====================================================================== */
  function mount(root, ctx) {
    S.root = root;
    const cfg = (ctx.config && ctx.config.gift) || {};
    const words = String(cfg.prompt || "").split(/\s+/).filter(Boolean)
      .map(function (w) { return '<span class="gf-w">' + A.esc(w) + "</span>"; }).join(" ");

    let boxes = "";
    for (let i = 0; i < 4; i++) boxes += boxHTML(i);

    root.innerHTML =
      '<div class="gf-stage">' +
        '<div class="gf-nebula" aria-hidden="true"></div>' +
        '<header class="gf-head">' +
          '<h2 class="gf-prompt">' + words + "</h2>" +
          '<div class="gf-rule" aria-hidden="true"><i></i><span class="gf-rule-star">' + STAR_SVG + "</span><i></i></div>" +
          (cfg.subPrompt ? '<p class="gf-sub hint">' + A.esc(cfg.subPrompt) + "</p>" : "") +
        "</header>" +
        '<div class="gf-field">' +
          '<svg class="gf-orbit" viewBox="0 0 400 400" aria-hidden="true" focusable="false">' +
            '<defs><linearGradient id="gfOrbG" x1="0" x2="1" y1="0" y2="0">' +
              '<stop offset="0" stop-color="#d6ecff" stop-opacity="0"/><stop offset=".3" stop-color="#d6ecff" stop-opacity=".55"/>' +
              '<stop offset=".7" stop-color="#8ae8ff" stop-opacity=".45"/><stop offset="1" stop-color="#8ae8ff" stop-opacity="0"/></linearGradient>' +
              '<radialGradient id="gfOrbDot"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#8ae8ff" stop-opacity="0"/></radialGradient>' +
            "</defs>" +
            '<g transform="rotate(-12 200 200)">' +
              '<path class="gf-orbit-path" d="M10 200 A190 64 0 1 0 390 200 A190 64 0 1 0 10 200" fill="none" stroke="url(#gfOrbG)" stroke-width="1"/>' +
              '<circle class="gf-orbit-halo" r="9" cx="10" cy="200" fill="url(#gfOrbDot)"/>' +
              '<circle class="gf-orbit-dot" r="1.9" cx="10" cy="200" fill="#f4faff"/>' +
            "</g>" +
          "</svg>" +
          '<div class="gf-grid">' + boxes + "</div>" +
        "</div>" +
        (cfg.openHint ? '<p class="gf-open hint">' + A.esc(cfg.openHint) + "</p>" : "") +
      "</div>" +
      '<div class="gf-halo" aria-hidden="true"></div>' +
      '<div class="gf-fx" aria-hidden="true">' +
        '<div class="gf-raysw"><div class="gf-rays"></div></div>' +
        '<div class="gf-beam"></div>' +
      "</div>" +
      '<div class="gf-sparks" aria-hidden="true">' +
        '<div class="gf-flash"></div>' +
        '<div class="gf-core"></div>' +
        '<div class="gf-pfield"></div>' +
      "</div>";

    const q = function (sel) { return root.querySelector(sel); };
    S.stage = q(".gf-stage");
    S.head = q(".gf-head");
    S.words = Array.prototype.slice.call(root.querySelectorAll(".gf-w"));
    S.ruleLines = Array.prototype.slice.call(root.querySelectorAll(".gf-rule i"));
    S.ruleStar = q(".gf-rule-star");
    S.sub = q(".gf-sub");
    S.hint = q(".gf-open");
    S.nebula = q(".gf-nebula");
    S.orbit = q(".gf-orbit");
    S.orbitPath = q(".gf-orbit-path");
    S.orbitDot = q(".gf-orbit-dot");
    S.orbitHalo = q(".gf-orbit-halo");
    S.grid = q(".gf-grid");
    S.halo = q(".gf-halo");
    S.fx = q(".gf-fx");
    S.flash = q(".gf-flash");
    S.rays = q(".gf-rays");
    S.raysW = q(".gf-raysw");
    S.beam = q(".gf-beam");
    S.core = q(".gf-core");
    S.pfield = q(".gf-pfield");
    S.rays.style.backgroundImage = raysGradient();

    S.boxes = Array.prototype.slice.call(root.querySelectorAll(".gf-box")).map(function (el) {
      const g = function (c) { return el.querySelector(c); };
      return {
        el: el, shadow: g(".gf-shadow"), float: g(".gf-float"), glow: g(".gf-glow"),
        shake: g(".gf-shake"), squash: g(".gf-squash"), lid: g(".gf-lid"), glint: g(".gf-glint"),
        seam: g(".gf-seam"), mouth: g(".gf-mouth"), sheen: g(".gf-sheen i")
      };
    });

    // kolam partikel (dibuat sekali)
    for (let i = 0; i < PARTICLES; i++) {
      const p = document.createElement("i");
      const star = i % 3 === 0;
      const size = star ? 8 + prand(i * 3 + 1) * 10 : 2.5 + prand(i * 3 + 1) * 3.5;
      const c = P_COLORS[i % P_COLORS.length];
      p.className = "gf-p " + (star ? "is-star" : "is-dot");
      p.style.width = p.style.height = size.toFixed(1) + "px";
      p.style.margin = (-size / 2).toFixed(1) + "px 0 0 " + (-size / 2).toFixed(1) + "px";
      p.style.setProperty("--c", c);
      S.pfield.appendChild(p);
      const late = i % 10 < 3; // gelombang kedua yang lebih lambat
      S.parts.push({
        el: p,
        ang: -Math.PI / 2 + (prand(i * 5 + 2) * 2 - 1) * 1.3,
        spd: (late ? 0.28 : 0.45) + prand(i * 7 + 3) * (late ? 0.4 : 0.75),
        delay: late ? 0.14 : prand(i * 13 + 5) * 0.05,
        spin: (prand(i * 11 + 4) * 2 - 1) * 260,
        ph: prand(i * 17 + 6) * Math.PI * 2,
        star: star
      });
    }

    // keadaan awal pasti (tersembunyi)
    gsap.set(S.words, { opacity: 0 });
    gsap.set([S.sub, S.hint, S.ruleStar, S.nebula, S.orbit, S.halo].filter(Boolean), { opacity: 0 });
    gsap.set(S.ruleLines, { scaleX: 0 });
    S.grid.style.pointerEvents = "none"; // aktif setelah kado mulai mendarat
    S.boxes.forEach(function (b) {
      gsap.set(b.el, { opacity: 0, transformOrigin: "50% 50%" });
      gsap.set([b.glow, b.shadow, b.glint, b.seam, b.mouth], { opacity: 0 });
      gsap.set(b.shake, { transformOrigin: "50% 96%" });
      gsap.set(b.squash, { transformOrigin: "50% 97%" });
      gsap.set(b.lid, { transformOrigin: "50% 30%" });
      gsap.set(b.sheen, { xPercent: -160, skewX: -14 });
    });
  }

  /* ======================================================================
     intro — teks & kado masuk, lalu bernapas
     ====================================================================== */
  function intro(ctx) {
    const rm = ctx.reducedMotion;
    const tl = gsap.timeline({ delay: 0.2 });

    // latar: nebula lembut di belakang kado
    tl.fromTo(S.nebula, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 2.4, ease: "sine.out" }, 0);

    // prompt: kata demi kata naik lembut
    tl.fromTo(S.words, { opacity: 0, y: rm ? 0 : 16 },
      { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.07 }, 0.05);
    tl.to(S.ruleLines, { scaleX: 1, duration: 1.0, ease: "expo.out" }, 0.55);
    tl.fromTo(S.ruleStar, { opacity: 0, scale: 0.2, rotation: -90 },
      { opacity: 1, scale: 1, rotation: 0, duration: 0.9, ease: "power3.out" }, 0.6);
    if (S.sub) {
      tl.fromTo(S.sub, { opacity: 0, letterSpacing: "0.62em" },
        { opacity: 1, letterSpacing: "0.32em", duration: 1.4, ease: "power2.out" }, 0.75);
    }

    // orbit tipis yang menggambar diri di sekitar kado
    tl.set(S.orbit, { opacity: 0.8 }, 0.5);
    tl.fromTo(S.orbitPath, { drawSVG: "50% 50%" }, { drawSVG: "0% 100%", duration: 2.2, ease: "power2.inOut" }, 0.5);
    tl.fromTo([S.orbitDot, S.orbitHalo], { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "sine.out" }, 1.6);

    // kado jatuh satu per satu (diagonal bersilang), mendarat dengan pantulan kecil
    const drop = CustomEase.create("gfDrop",
      "M0,0 C0.2,0.5 0.36,0.86 0.5,1 0.56,0.955 0.63,0.94 0.69,0.94 0.76,0.94 0.82,0.99 0.86,1 0.92,1.006 0.96,1 1,1");
    DROP_ORDER.forEach(function (bi, k) {
      const b = S.boxes[bi];
      const at = 0.62 + k * 0.13;
      const land = at + 0.55;
      const sign = bi % 2 ? 1 : -1;
      if (rm) {
        tl.fromTo(b.el, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "sine.out" }, at);
        tl.fromTo(b.glow, { opacity: 0 }, { opacity: 0.85, duration: 0.8, ease: "sine.out" }, at);
        return;
      }
      const bh = b.el.offsetHeight || 120;
      tl.fromTo(b.el, { y: -bh * 0.62, rotation: 6 * sign, scale: 0.9 },
        { y: 0, rotation: 0, scale: 1, duration: 1.05, ease: drop }, at);
      tl.fromTo(b.el, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power1.out", immediateRender: false }, at);
      // squash saat mendarat
      tl.fromTo(b.squash, { scaleX: 1.07, scaleY: 0.91 },
        { scaleX: 1, scaleY: 1, duration: 0.8, ease: "elastic.out(1, 0.42)", immediateRender: false }, land);
      tl.fromTo(b.shadow, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.7, ease: "power2.out" }, land - 0.25);
      // glow menyala bersamaan dengan kado "menetap"
      tl.fromTo(b.glow, { opacity: 0, scale: 0.7 }, { opacity: 0.85, scale: 1, duration: 1.3, ease: "power2.out" }, land - 0.2);
      // satu sapuan kilau
      tl.fromTo(b.sheen, { xPercent: -160 }, { xPercent: 360, duration: 1.15, ease: "power1.inOut", immediateRender: false }, land + 0.3);
      tl.call(startIdle, [b, bi], land + 0.45);
    });

    tl.call(function () { S.grid.style.pointerEvents = ""; }, null, 1.15);

    if (S.hint) {
      tl.fromTo(S.hint, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 1.0, ease: "sine.out" }, 2.5);
      tl.call(function () {
        S.loops.push(gsap.to(S.hint, { opacity: 0.45, duration: 1.9, ease: "sine.inOut", yoyo: true, repeat: -1 }));
      }, null, 3.6);
    }

    // titik kecil yang mengorbit pelan
    tl.call(function () {
      const o = { a: Math.PI };
      const place = function () {
        const x = 200 + 190 * Math.cos(o.a), y = 200 + 64 * Math.sin(o.a);
        S.orbitDot.setAttribute("cx", x.toFixed(2)); S.orbitDot.setAttribute("cy", y.toFixed(2));
        S.orbitHalo.setAttribute("cx", x.toFixed(2)); S.orbitHalo.setAttribute("cy", y.toFixed(2));
      };
      place();
      if (!rm) S.loops.push(gsap.to(o, { a: Math.PI * 3, duration: 38, ease: "none", repeat: -1, onUpdate: place }));
    }, null, 1.55);

    S.intro = tl;
    return tl;
  }

  // napas tiap kotak: melayang dengan fase & periode berbeda, bayangan ikut
  function startIdle(b, i) {
    if (S.picked || S.reduced) return;
    const dur = 2.5 + i * 0.31;
    S.loops.push(gsap.to(b.float, { y: -7, rotation: i % 2 ? 1.1 : -1.1, duration: dur, ease: "sine.inOut", yoyo: true, repeat: -1 }));
    S.loops.push(gsap.to(b.shadow, { scale: 0.84, opacity: 0.7, duration: dur, ease: "sine.inOut", yoyo: true, repeat: -1 }));
    const tw = gsap.timeline({ repeat: -1, repeatDelay: 2.6 + i * 1.15, delay: 0.6 + i * 0.7 });
    tw.fromTo(b.glint, { opacity: 0, scale: 0.2, rotation: -60 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.38, ease: "power2.out" })
      .to(b.glint, { opacity: 0, scale: 0.3, rotation: 50, duration: 0.55, ease: "power2.in" });
    S.loops.push(tw);
  }

  function waitPick() {
    return new Promise(function (resolve) {
      S.boxes.forEach(function (b, i) {
        b.el.addEventListener("click", function (e) {
          e.preventDefault();
          if (S.picked) return;
          S.picked = true;
          resolve(i);
        });
      });
    });
  }

  // Ukur buku di dalam slot (turun ke anak terbesar selama masih memenuhi layar).
  function measureBook(slot, W, H) {
    const sr = slot.getBoundingClientRect();
    let el = slot, rect = null;
    for (let depth = 0; depth < 6; depth++) {
      let best = null, bestA = 0;
      for (let c = el.firstElementChild; c; c = c.nextElementSibling) {
        const cr = c.getBoundingClientRect();
        const a = cr.width * cr.height;
        if (a > bestA) { bestA = a; best = c; rect = cr; }
      }
      if (!best) break;
      el = best;
      if (bestA < sr.width * sr.height * 0.85) break;
    }
    if (!rect || rect.width < 8 || rect.height < 8 || rect.width * rect.height >= sr.width * sr.height * 0.85) {
      const w = Math.min(W * 0.78, 320), h = w * 1.42;
      return { w: w, h: h, top: (H - h) / 2, bottom: (H + h) / 2 };
    }
    return { w: rect.width, h: rect.height, top: rect.top - sr.top, bottom: rect.bottom - sr.top };
  }

  /* ======================================================================
     open — kado terpilih terbuka, lalu serah-terima ke buku
     ====================================================================== */
  function open(k, ctx) {
    const rm = ctx.reducedMotion;
    const root = S.root;
    const b = S.boxes[k];

    // hentikan intro & semua loop
    if (S.intro) { S.intro.progress(1); S.intro.kill(); }
    S.loops.forEach(function (t) { t.kill(); });
    S.loops = [];
    S.grid.classList.add("is-picked");
    S.boxes.forEach(function (o) { o.el.setAttribute("aria-disabled", "true"); o.el.tabIndex = -1; });
    b.el.style.zIndex = "5";
    gsap.set(S.boxes.map(function (o) { return o.glint; }), { opacity: 0 });

    // geometri (koordinat stasiun)
    const W = root.clientWidth, H = root.clientHeight;
    const sr = root.getBoundingClientRect(), r = b.el.getBoundingClientRect();
    const cx = r.left - sr.left + r.width / 2, cy = r.top - sr.top + r.height / 2;
    const targetW = Math.min(W * 0.5, H * 0.27, 236);
    const sc = targetW / r.width;
    const tx = W / 2 - cx, ty = H * 0.5 - cy;
    const ox = W / 2, oy = H * 0.5 + (MOUTH_Y - 0.5) * r.height * sc; // mulut kotak setelah di tengah
    const dir = k % 2 === 0 ? 1 : -1;

    // slot buku: dibuat sekarang (tersembunyi) supaya foto sempat dimuat, tampil saat kado terbuka
    const slot = document.createElement("div");
    slot.className = "gf-book-slot";
    slot.style.visibility = "hidden";
    slot.style.opacity = "0";
    slot.style.zIndex = "0"; // sementara di belakang kotak → buku tampak keluar dari dalam kotak
    root.appendChild(slot);
    const book = A.scenes && A.scenes.book;
    if (book && typeof book.mount === "function") {
      try { book.mount(slot, ctx); } catch (err) { console.error("[gift] book.mount", err); }
    }

    let resolveScene;
    const done = new Promise(function (res) { resolveScene = res; });
    function startBook() {
      if (!book || typeof book.play !== "function") return; // tanpa modul buku: slot kosong saja
      try {
        const p = book.play(ctx);
        if (p && typeof p.then === "function") p.then(resolveScene, function (err) { console.error("[gift] book.play", err); });
      } catch (err) { console.error("[gift] book.play", err); }
    }
    function cleanup() {
      S.stage.style.visibility = "hidden";
      S.fx.style.visibility = "hidden";
      S.flash.parentNode.style.visibility = "hidden";
    }

    const tl = gsap.timeline({ delay: 0.04 });

    // --- yang tidak dipilih menjauh (cepat, ease .in) ---
    S.boxes.forEach(function (o, j) {
      if (j === k) return;
      const orr = o.el.getBoundingClientRect();
      const dx = orr.left - sr.left + orr.width / 2 - W / 2;
      const dy = orr.top - sr.top + orr.height / 2 - H / 2;
      const len = Math.max(1, Math.hypot(dx, dy));
      tl.to(o.el, {
        x: (dx / len) * 46, y: (dy / len) * 46 + 10, scale: 0.55, rotation: (j % 2 ? 9 : -9),
        opacity: 0, duration: rm ? 0.4 : 0.48, ease: "power2.in"
      }, 0.03 * j);
    });

    // --- teks & dekorasi keluar ---
    tl.to(S.words, { opacity: 0, y: -14, duration: 0.42, ease: "power2.in", stagger: 0.025 }, 0);
    tl.to([S.ruleStar, S.sub].filter(Boolean), { opacity: 0, duration: 0.35, ease: "power1.in" }, 0.05);
    tl.to(S.ruleLines, { scaleX: 0, duration: 0.4, ease: "power2.in" }, 0.05);
    if (S.hint) tl.to(S.hint, { opacity: 0, y: 6, duration: 0.3, ease: "power1.in" }, 0);
    tl.to(S.orbit, { opacity: 0, duration: 0.6, ease: "power1.in" }, 0);
    tl.to(S.nebula, { opacity: 0.4, duration: 1.2, ease: "sine.inOut" }, 0);

    if (rm) {
      // versi tenang: kado memudar, buku muncul lembut
      tl.to(b.el, { opacity: 0, duration: 0.6, ease: "power1.in" }, 0.4);
      tl.set(slot, { visibility: "visible" }, 0.8);
      tl.to(slot, { opacity: 1, duration: 0.9, ease: "sine.out" }, 0.8);
      tl.to(S.halo, { opacity: 0.8, duration: 1.2, ease: "sine.out" }, 0.8);
      tl.call(function () { slot.style.zIndex = ""; }, null, 1.3);
      tl.set(slot, { clearProps: "opacity,visibility" }, 1.75);
      tl.call(startBook, null, 1.8);
      tl.call(cleanup, null, 1.8);
      return done;
    }

    // --- kado terpilih ke tengah & membesar ---
    tl.to(b.float, { y: 0, rotation: 0, duration: 0.5, ease: "sine.out" }, 0);
    tl.to(b.shadow, { opacity: 0, duration: 0.35, ease: "power1.in" }, 0);
    tl.to(b.el, { x: tx, y: ty, scale: sc, duration: 1.0, ease: "power3.inOut" }, 0.12);
    tl.to(b.glow, { opacity: 1, scale: 1.2, duration: 1.0, ease: "sine.inOut" }, 0.12);

    // --- antisipasi: goyang makin kuat, tutup bergetar, cahaya bocor dari celah ---
    const A0 = 1.02, AD = 0.95, P = A0 + AD;
    tl.to(b.shake, { keyframes: { rotation: [0, -2.5, 2.5, -4, 4, -6, 6, -3.5, 0], easeEach: "sine.inOut" }, duration: AD, ease: "none" }, A0);
    tl.to(b.squash, { scaleX: 1.06, scaleY: 0.9, duration: AD, ease: "power2.in" }, A0);
    tl.to(b.lid, { keyframes: { y: [0, -1.2, 0, -2.6, 0, -4, 0, -5.5, -2], easeEach: "power1.inOut" }, duration: AD, ease: "none" }, A0);
    tl.fromTo(b.seam, { opacity: 0, scaleX: 0.5 },
      { opacity: 1, scaleX: 1.1, duration: AD, ease: "power2.in", immediateRender: false }, A0);
    tl.to(b.glow, { opacity: 1, scale: 1.4, duration: AD, ease: "power1.in" }, A0);

    // --- POP: tutup meletup ke atas, berputar, terlempar keluar ---
    const lw = W / sc, lh = H / sc; // satuan lokal kotak (sudah diskalakan)
    tl.to(b.lid, { y: -lh * 0.36, duration: 0.6, ease: "power2.out" }, P);
    tl.to(b.lid, { y: lh * 0.12, duration: 0.72, ease: "power2.in" }, P + 0.6);
    tl.to(b.lid, { x: dir * lw * 0.62, duration: 1.32, ease: "power1.out" }, P);
    tl.to(b.lid, { rotation: dir * 380, duration: 1.32, ease: "power2.out" }, P);
    tl.to(b.lid, { scale: 0.78, duration: 1.32, ease: "none" }, P);
    tl.to(b.lid, { opacity: 0, duration: 0.32, ease: "power1.in" }, P + 1.0);
    // badan melenting
    tl.to(b.squash, { scaleX: 0.95, scaleY: 1.08, duration: 0.14, ease: "power3.out" }, P);
    tl.to(b.squash, { scaleX: 1, scaleY: 1, duration: 0.85, ease: "elastic.out(1, 0.38)" }, P + 0.14);
    tl.to(b.seam, { opacity: 0, duration: 0.25, ease: "power1.out" }, P);
    tl.fromTo(b.mouth, { opacity: 0, scale: 0.5 },
      { opacity: 1, scale: 1, duration: 0.35, ease: "power2.out", immediateRender: false }, P);

    // --- ledakan cahaya (di lapisan .gf-fx, berpusat di mulut kotak) ---
    S.flash.style.setProperty("--ox", ox.toFixed(1) + "px");
    S.flash.style.setProperty("--oy", oy.toFixed(1) + "px");
    gsap.set([S.core, S.raysW, S.pfield], { left: ox, top: oy });
    const bw = r.width * sc * 0.8;
    gsap.set(S.beam, { left: ox - bw / 2, top: 0, width: bw, height: Math.max(40, oy), transformOrigin: "50% 100%" });

    tl.fromTo(S.flash, { opacity: 0 }, { opacity: 0.6, duration: 0.14, ease: "power2.out", immediateRender: false }, P);
    tl.to(S.flash, { opacity: 0, duration: 1.3, ease: "power1.out" }, P + 0.14);
    tl.fromTo(S.core, { opacity: 0, scale: 0.08 }, { opacity: 1, scale: 0.9, duration: 0.5, ease: "expo.out", immediateRender: false }, P);
    tl.to(S.core, { scale: 1.3, duration: 1.6, ease: "sine.out" }, P + 0.5);
    tl.to(S.core, { opacity: 0, duration: 1.15, ease: "power1.out" }, P + 0.4);
    tl.fromTo(S.rays, { opacity: 0, scale: 0.5 }, { opacity: 0.75, scale: 1, duration: 0.7, ease: "expo.out", immediateRender: false }, P + 0.02);
    tl.fromTo(S.raysW, { rotation: -10 }, { rotation: 22, duration: 3.2, ease: "power1.out", immediateRender: false }, P + 0.02);
    tl.to(S.rays, { opacity: 0, duration: 1.6, ease: "power1.in" }, P + 1.0);
    tl.fromTo(S.beam, { opacity: 0, scaleY: 0, scaleX: 0.6 },
      { opacity: 0.85, scaleY: 1, scaleX: 1, duration: 0.55, ease: "expo.out", immediateRender: false }, P + 0.04);
    tl.to(S.beam, { opacity: 0, scaleX: 1.6, duration: 1.3, ease: "power2.in" }, P + 0.62);

    // partikel bintang: lintasan balistik dengan hambatan udara (mengapung pelan)
    const U = Math.min(W, H, 720) * 1.05, G = U * 0.42, KD = 1.5, FLIGHT = 2.1;
    const drive = { T: 0 };
    tl.fromTo(drive, { T: 0 }, {
      T: 1, duration: FLIGHT, ease: "none", immediateRender: false,
      onUpdate: function () {
        const t = drive.T * FLIGHT;
        for (let i = 0; i < S.parts.length; i++) {
          const p = S.parts[i];
          const tt = t - p.delay;
          if (tt <= 0 || drive.T >= 1) { p.el.style.opacity = "0"; continue; }
          const vx = Math.cos(p.ang) * p.spd * U, vy = Math.sin(p.ang) * p.spd * U;
          const e = (1 - Math.exp(-KD * tt)) / KD;
          const x = vx * e;
          const y = (G / KD) * tt + (vy - G / KD) * e; // hambatan linear: v → G/KD
          const life = tt / (FLIGHT - p.delay);
          let a = life < 0.06 ? life / 0.06 : life > 0.5 ? Math.max(0, 1 - (life - 0.5) / 0.5) : 1;
          a *= 0.7 + 0.3 * Math.sin(tt * 13 + p.ph);
          const s = (p.star ? 0.8 + 0.35 * Math.sin(tt * 9 + p.ph) : 1) * (1 - life * 0.35);
          p.el.style.opacity = a.toFixed(3);
          p.el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) rotate(" +
            (p.star ? (p.spin * tt).toFixed(1) : 0) + "deg) scale(" + s.toFixed(3) + ")";
        }
      }
    }, P + 0.02);

    // --- serah-terima ke buku ---
    // Slot berada di BELAKANG kotak (z-index 0) sehingga badan kotak menutupi bagian buku yang "masih di dalam".
    // (A) buku kecil naik keluar dari mulut kotak, bercahaya
    // (B) kotak tenggelam & memudar di depan, buku tumbuh ke ukuran & posisi akhirnya
    const HO = P + 0.2;
    const bk = measureBook(slot, W, H);
    const boxW = r.width * sc;
    const sA = Math.min(0.9, (boxW * 0.66) / bk.w);           // skala akhir fase A (≈ 2/3 lebar kotak)
    const s0 = sA * 0.62;
    const yIn = s0 * (oy - bk.top) + 6;                         // seluruh buku di bawah mulut (tersembunyi)
    const yA = sA * (0.26 * bk.h - (bk.bottom - oy));          // ±26% buku masih di dalam kotak
    tl.set(slot, { visibility: "visible", transformOrigin: ox.toFixed(1) + "px " + oy.toFixed(1) + "px" }, HO);
    tl.fromTo(slot, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power1.out", immediateRender: false }, HO);
    tl.fromTo(slot, { filter: "brightness(2.4) saturate(0.4)" },
      { filter: "brightness(1) saturate(1)", duration: 1.3, ease: "power2.out", immediateRender: false }, HO);
    tl.fromTo(slot, { scale: s0, y: yIn },
      { scale: sA, y: yA, duration: 0.85, ease: "power3.out", immediateRender: false }, HO);
    tl.to(slot, { scale: 1, y: 0, duration: 1.3, ease: "power2.inOut" }, HO + 0.85);
    tl.fromTo(S.halo, { opacity: 0, scale: 0.35 }, { opacity: 1, scale: 1, duration: 2.0, ease: "power2.out", immediateRender: false }, HO);
    tl.to(b.el, { y: ty + H * 0.3, scale: sc * 0.8, duration: 1.0, ease: "power2.in" }, HO + 0.7);
    tl.to(b.el, { opacity: 0, duration: 0.75, ease: "power1.in" }, HO + 0.85);
    tl.to(S.nebula, { opacity: 0, duration: 1.0, ease: "power1.in" }, HO + 0.4);
    // kotak sudah hilang → buku pindah ke lapisan depan, panggung kado disembunyikan
    tl.call(function () { slot.style.zIndex = ""; S.stage.style.visibility = "hidden"; }, null, HO + 1.62);
    // bersihkan style sementara: slot kembali polos (inset 0, tanpa transform/filter) untuk modul buku
    tl.set(slot, { clearProps: "filter" }, HO + 1.32);
    tl.set(slot, { clearProps: "transform,transformOrigin,opacity,visibility" }, HO + 2.16);
    tl.call(function () {
      // halo di belakang buku bernapas pelan (puncak rendah)
      gsap.to(S.halo, { opacity: 0.72, scale: 1.04, duration: 3.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
    }, null, HO + 2.1);
    tl.call(startBook, null, HO + 2.2); // setelah slot benar-benar polos (tanpa transform)
    tl.call(function () { if (ctx.sky && ctx.sky.comet) ctx.sky.comet(); }, null, HO + 2.2);
    tl.call(cleanup, null, P + 2.7);

    return done;
  }

  /* ======================================================================
     play — tampilkan, tunggu pilihan, buka, serahkan ke buku
     ====================================================================== */
  function play(ctx) {
    S.reduced = !!ctx.reducedMotion;
    intro(ctx);
    return waitPick().then(function (k) { return open(k, ctx); });
  }

  A.registerScene("gift", { mount: mount, play: play });
})();

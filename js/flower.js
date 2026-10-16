/* ==========================================================================
   Scene 1 — Bunga (pembuka)
   Tiga bunga putih–biru tumbuh dari satu titik cahaya: batang tergambar dari
   bawah, daun membuka, kuncup membengkak lalu mekar, inti & halo menyala,
   kilau beterbangan. Lalu caption + panah tipis ke atas (scroll ke atas).

   Ruang koordinat SVG: viewBox 440×640; tanaman digambar dalam unit lokal
   dengan pangkal di (0,0) dan y negatif ke atas, lalu ditransformasi
   translate(220 620) scale(1.7).
   ========================================================================== */
(function () {
  "use strict";
  const A = window.Aleove;

  /* ---------------- ruang koordinat ---------------- */
  const VB_W = 440, VB_H = 640;
  const OX = 220, OY = 620, K = 1.7;
  const BASE_ORIGIN = "50% " + ((OY / VB_H) * 100).toFixed(3) + "%";
  const WORLD = 'transform="translate(' + OX + " " + OY + ") scale(" + K + ')"';

  /* ---------------- data tanaman ----------------
     stem: titik bezier kubik (pangkal → bawah kepala)
     w: lebar batang [pangkal, ujung]
     grow: kapan & berapa lama batang tumbuh
     head: kemiringan & skala kepala bunga
     leaves: t = parameter di batang, a = arah daun (derajat, 0 = kanan), L/W = panjang/lebar */
  const FLOWERS = [
    {
      key: "c",
      stem: [[0, 0], [2, -100], [-7, -205], [-4, -297]],
      w: [0.6, 7.4],
      grow: { at: 0.5, dur: 2.2, ease: "power2.inOut" },
      head: { tilt: -1, s: 0.9 },
      halo: { d: 1.5, peak: 0.44, breath: 3.6 },
      glint: { d: 0.2 },
      sway: { amp: 0.6, period: 7.4, dir: 1 },
      emit: 3.0,
      leaves: [
        { t: 0.385, a: -79, L: 62, W: 25 },
        { t: 0.405, a: -45, L: 60, W: 25 },
        { t: 0.45, a: -131, L: 58, W: 27 },
        { t: 0.64, a: -49, L: 60, W: 26 },
        { t: 0.73, a: -134, L: 60, W: 29 },
        { t: 0.855, a: -57, L: 27, W: 12 },
        { t: 0.885, a: -113, L: 17, W: 7.5 }
      ]
    },
    {
      key: "r",
      stem: [[0, 0], [22, -68], [45, -133], [55, -189]],
      w: [0.6, 6.3],
      grow: { at: 0.85, dur: 2.05, ease: "sine.inOut" },
      head: { tilt: 12, s: 0.7 },
      halo: { d: 0.86, peak: 0.36, breath: 3.1 },
      glint: { d: 0.15 },
      sway: { amp: 0.85, period: 5.9, dir: -1 },
      emit: 1.9,
      leaves: [
        { t: 0.30, a: -31, L: 55, W: 24 },
        { t: 0.37, a: -120, L: 58, W: 25 },
        { t: 0.575, a: -35, L: 41, W: 18 }
      ]
    },
    {
      key: "l",
      stem: [[0, 0], [-19, -52], [-40, -104], [-51, -152]],
      w: [0.6, 5.0],
      grow: { at: 1.15, dur: 1.85, ease: "power1.inOut" },
      head: { tilt: -14, s: 0.44 },
      halo: { d: 0.56, peak: 0.32, breath: 2.7 },
      glint: { d: 0.1 },
      sway: { amp: 1.0, period: 5.1, dir: 1 },
      emit: 1.2,
      leaves: [
        { t: 0.34, a: -154, L: 35, W: 16 },
        { t: 0.62, a: -62, L: 16, W: 7 }
      ]
    }
  ];

  // helai rumput (kurva multi-segmen), tumbuh dari dekat pangkal ke kiri atas
  const GRASS = [
    {
      pts: [[-6, -3], [-32, -72], [-78, -160], [-100, -192], [-105, -198], [-111, -202], [-118, -201]],
      wmax: 3.1, grow: { at: 0.8, dur: 2.1, ease: "sine.out" }, op: 0.9
    },
    {
      pts: [[-3, -2], [-19, -36], [-46, -80], [-70, -106]],
      wmax: 2.0, grow: { at: 1.05, dur: 1.6, ease: "power1.out" }, op: 0.6
    }
  ];

  // daun kecil di pangkal
  const BASE_LEAVES = [
    { x: -2, y: 0, a: -164, L: 21, W: 7.5, at: 0.62 },
    { x: 1.5, y: 0, a: -19, L: 17, W: 6.5, at: 0.72 },
    { x: -1, y: -1, a: -126, L: 14, W: 5, at: 0.82 }
  ];

  // kelopak: a = sudut mekar (0 = tegak), c = sudut kuncup, L/W ukuran, k = jenis
  const PETALS = [
    { k: "back", a: 0, c: 0, L: 48, W: 47, d: 0 },
    { k: "in", a: -24, c: 3, L: 40, W: 26, d: 0.06 },
    { k: "in", a: 24, c: -3, L: 40, W: 26, d: 0.06 },
    { k: "out", a: -57, c: 7, L: 59, W: 30, d: 0.12, bend: 0.13 },
    { k: "out", a: 55, c: -7, L: 58, W: 30, d: 0.12, bend: -0.13 }
  ];
  const RING_Y = -9; // pusat cincin relatif titik pivot kepala

  /* ---------------- util geometri ---------------- */
  function f(n) { return (Math.round(n * 100) / 100).toString(); }
  function P(x, y) { return f(x) + " " + f(y); }

  function curveAt(pts, t) {
    const n = (pts.length - 1) / 3;
    const s = Math.min(n - 1, Math.floor(t * n));
    const lt = t * n - s;
    const p0 = pts[s * 3], p1 = pts[s * 3 + 1], p2 = pts[s * 3 + 2], p3 = pts[s * 3 + 3];
    const u = 1 - lt;
    const x = u * u * u * p0[0] + 3 * u * u * lt * p1[0] + 3 * u * lt * lt * p2[0] + lt * lt * lt * p3[0];
    const y = u * u * u * p0[1] + 3 * u * u * lt * p1[1] + 3 * u * lt * lt * p2[1] + lt * lt * lt * p3[1];
    const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * lt * (p2[0] - p1[0]) + 3 * lt * lt * (p3[0] - p2[0]);
    const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * lt * (p2[1] - p1[1]) + 3 * lt * lt * (p3[1] - p2[1]);
    const m = Math.hypot(dx, dy) || 1;
    return { x: x, y: y, tx: dx / m, ty: dy / m };
  }

  function curveD(pts) {
    let d = "M" + P(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i += 3) {
      d += "C" + P(pts[i][0], pts[i][1]) + " " + P(pts[i + 1][0], pts[i + 1][1]) + " " + P(pts[i + 2][0], pts[i + 2][1]);
    }
    return d;
  }

  // pita meruncing di sepanjang kurva (batang / rumput) dengan ujung membulat
  function ribbon(pts, widthAt, n, offset) {
    const L = [], R = [];
    offset = offset || 0;
    for (let i = 0; i <= n; i++) {
      const t = i / n, c = curveAt(pts, t);
      const hw = widthAt(t) / 2, nx = -c.ty, ny = c.tx;
      const ox = nx * offset * hw, oy = ny * offset * hw;
      L.push([c.x + nx * hw + ox, c.y + ny * hw + oy]);
      R.push([c.x - nx * hw + ox, c.y - ny * hw + oy]);
    }
    const e = curveAt(pts, 1), he = widthAt(1) / 2;
    let d = "M" + L.map(function (p) { return P(p[0], p[1]); }).join("L");
    d += "Q" + P(e.x + e.tx * he * 1.4, e.y + e.ty * he * 1.4) + " " + P(R[n][0], R[n][1]);
    for (let i = n - 1; i >= 0; i--) d += "L" + P(R[i][0], R[i][1]);
    return d + "Z";
  }

  // pecahan panjang busur pada parameter t (untuk sinkron daun dengan DrawSVG)
  function arcFrac(pts, t) {
    let total = 0, upto = 0, prev = curveAt(pts, 0);
    const N = 160;
    for (let i = 1; i <= N; i++) {
      const c = curveAt(pts, i / N);
      const seg = Math.hypot(c.x - prev.x, c.y - prev.y);
      total += seg;
      if (i / N <= t) upto += seg;
      prev = c;
    }
    return upto / total;
  }

  // waktu (0..1) ketika ease mencapai nilai y
  function invEase(ease, y) {
    const fn = gsap.parseEase(ease);
    let lo = 0, hi = 1;
    for (let i = 0; i < 26; i++) {
      const m = (lo + hi) / 2;
      if (fn(m) < y) lo = m; else hi = m;
    }
    return (lo + hi) / 2;
  }

  // daun menunjuk ke +x dari (0,0); sisi atas lebih penuh (kesan daun terlipat)
  function leafPaths(L, Wd) {
    const up = Wd * 0.62, lo = Wd * 0.46;
    const outline =
      "M0 0C" + P(L * 0.2, -up * 1.05) + " " + P(L * 0.62, -up * 1.1) + " " + P(L, 0) +
      "C" + P(L * 0.66, lo * 1.1) + " " + P(L * 0.22, lo * 1.0) + " 0 0Z";
    const fold =
      "M0 0C" + P(L * 0.2, -up * 1.05) + " " + P(L * 0.62, -up * 1.1) + " " + P(L, 0) +
      "C" + P(L * 0.62, -up * 0.16) + " " + P(L * 0.3, -up * 0.06) + " 0 0Z";
    const rib = "M" + P(L * 0.05, 0) + "Q" + P(L * 0.5, -up * 0.14) + " " + P(L * 0.9, -up * 0.02);
    return { outline: outline, fold: fold, rib: rib };
  }

  // kelopak menunjuk ke atas dari (0,0): pangkal sempit, ujung bulat (bentuk sendok)
  // bend: ujung kelopak sedikit melengkung ke satu sisi (kelopak samping melengkung ke atas)
  function petalPath(p) {
    const L = p.L, hw = p.W / 2, b = (p.bend || 0) * L;
    const k = p.k === "out" ? [0.12, 0.2, 1.02, 0.42, 1.0, 0.7, 0.84, 1.08]
            : p.k === "back" ? [0.34, 0.08, 1.18, 0.34, 1.0, 0.66, 0.88, 1.1]
            : [0.2, 0.16, 1.05, 0.42, 0.96, 0.7, 0.8, 1.08];
    const pt = function (sx, fy) { const y = -L * fy; return P(hw * sx + b * fy * fy, y); };
    return "M0 0" +
      "C" + pt(k[0], k[1]) + " " + pt(k[2], k[3]) + " " + pt(k[4], k[5]) +
      "C" + pt(k[6], k[7]) + " " + pt(-k[6], k[7]) + " " + pt(-k[4], k[5]) +
      "C" + pt(-k[2], k[3]) + " " + pt(-k[0], k[1]) + " 0 0Z";
  }

  // titik lokal → persen kotak (.fl-box)
  function toPct(x, y) {
    return { x: ((OX + K * x) / VB_W) * 100, y: ((OY + K * y) / VB_H) * 100 };
  }

  function headCenter(fl) {
    const end = fl.stem[3], h = fl.head, r = (h.tilt * Math.PI) / 180;
    // pusat cincin = pivot + rotate(tilt) * (0, RING_Y*s)
    return { x: end[0] - Math.sin(r) * RING_Y * h.s, y: end[1] + Math.cos(r) * RING_Y * h.s };
  }

  /* ---------------- markup ---------------- */
  function sharedDefs() {
    return '<svg class="fl-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>' +
      // kelopak depan: putih di ujung → ice blue → biru di pangkal
      '<linearGradient id="fl-g-petal" x1="0.15" y1="1" x2="0" y2="0">' +
        '<stop offset="0" stop-color="#8fc4ff"/><stop offset="0.3" stop-color="#a9d3ff"/><stop offset="0.62" stop-color="#cfe8ff"/>' +
        '<stop offset="0.9" stop-color="#f1f8ff"/><stop offset="1" stop-color="#ffffff"/></linearGradient>' +
      '<linearGradient id="fl-g-petal-in" x1="0" y1="1" x2="0" y2="0">' +
        '<stop offset="0" stop-color="#6aa6ee"/><stop offset="0.55" stop-color="#a6d0ff"/>' +
        '<stop offset="1" stop-color="#ddeeff"/></linearGradient>' +
      '<linearGradient id="fl-g-petal-back" x1="0" y1="1" x2="0" y2="0">' +
        '<stop offset="0" stop-color="#78b2f4"/><stop offset="0.5" stop-color="#b9dcff"/>' +
        '<stop offset="1" stop-color="#eaf5ff"/></linearGradient>' +
      // bayangan lembut di sisi dalam kelopak (memisahkan kelopak yang bertumpuk)
      '<linearGradient id="fl-g-shade" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0" stop-color="#2f6fd6" stop-opacity="0.2"/><stop offset="0.3" stop-color="#2f6fd6" stop-opacity="0"/>' +
        '<stop offset="0.7" stop-color="#2f6fd6" stop-opacity="0"/><stop offset="1" stop-color="#2f6fd6" stop-opacity="0.2"/></linearGradient>' +
      // kilau lembut di tepi atas kelopak
      '<radialGradient id="fl-g-sheen" cx="0.5" cy="0.1" r="0.55">' +
        '<stop offset="0" stop-color="#ffffff" stop-opacity="0.75"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>' +
      // cangkir & cincin
      '<linearGradient id="fl-g-bowl" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#ffffff"/><stop offset="0.4" stop-color="#d9eeff"/><stop offset="1" stop-color="#86bdf8"/></linearGradient>' +
      '<linearGradient id="fl-g-rim" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e4f2ff"/></linearGradient>' +
      '<radialGradient id="fl-g-core" cx="0.46" cy="0.42" r="0.62">' +
        '<stop offset="0" stop-color="#fffbe0"/><stop offset="0.3" stop-color="#ffec9a"/>' +
        '<stop offset="0.72" stop-color="#ffd24a"/><stop offset="1" stop-color="#f6bb2e"/></radialGradient>' +
      '<radialGradient id="fl-g-coreglow">' +
        '<stop offset="0" stop-color="#fff9e2" stop-opacity="0.9"/><stop offset="0.3" stop-color="#fff2c2" stop-opacity="0.42"/>' +
        '<stop offset="0.62" stop-color="#ffeaa8" stop-opacity="0.1"/><stop offset="1" stop-color="#ffeaa8" stop-opacity="0"/></radialGradient>' +
      // daun: pangkal biru tua transparan → cyan di ujung
      '<linearGradient id="fl-g-leaf" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0" stop-color="#2f6fd6" stop-opacity="0.34"/><stop offset="0.45" stop-color="#3189cc" stop-opacity="0.74"/>' +
        '<stop offset="1" stop-color="#5cc6ec" stop-opacity="0.9"/></linearGradient>' +
      '<linearGradient id="fl-g-fold" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0" stop-color="#8ae8ff" stop-opacity="0"/><stop offset="0.55" stop-color="#9eeeff" stop-opacity="0.2"/>' +
        '<stop offset="1" stop-color="#c8f6ff" stop-opacity="0.32"/></linearGradient>' +
      // cahaya ujung batang yang tumbuh
      '<radialGradient id="fl-g-tip">' +
        '<stop offset="0" stop-color="#ffffff"/><stop offset="0.22" stop-color="#e9f8ff" stop-opacity="0.95"/>' +
        '<stop offset="0.5" stop-color="#8ae8ff" stop-opacity="0.3"/><stop offset="1" stop-color="#8ae8ff" stop-opacity="0"/></radialGradient>' +
      '<filter id="fl-f-glow" x="-60%" y="-120%" width="220%" height="340%">' +
        '<feGaussianBlur stdDeviation="2.2" result="b"/>' +
        '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
    "</defs></svg>";
  }

  function leafMarkup(leaf, x, y, cls) {
    const p = leafPaths(leaf.L, leaf.W);
    return '<g transform="translate(' + P(x, y) + ") rotate(" + f(leaf.a) + ')">' +
      '<g class="fl-leaf ' + (cls || "") + '">' +
        '<path d="' + p.outline + '" fill="url(#fl-g-leaf)"/>' +
        '<path d="' + p.fold + '" fill="url(#fl-g-fold)"/>' +
        '<path d="' + p.rib + '" fill="none" stroke="#a8f0ff" stroke-opacity="0.22" stroke-width="0.6" stroke-linecap="round"/>' +
      "</g></g>";
  }

  function headMarkup(fl) {
    const end = fl.stem[3], h = fl.head;
    let petals = "";
    PETALS.forEach(function (p) {
      const fill = p.k === "out" ? "url(#fl-g-petal)" : p.k === "back" ? "url(#fl-g-petal-back)" : "url(#fl-g-petal-in)";
      const op = p.k === "in" ? 0.5 : p.k === "back" ? 0.93 : 0.9;
      const d = petalPath(p);
      petals += '<g class="fl-petal" data-k="' + p.k + '">' +
        '<path d="' + d + '" fill="' + fill + '" fill-opacity="' + op + '"/>' +
        (p.k === "in" ? "" : '<path d="' + d + '" fill="url(#fl-g-shade)"/>') +
        '<path d="' + d + '" fill="url(#fl-g-sheen)" opacity="' + (p.k === "in" ? 0.3 : 0.55) + '"/>' +
        "</g>";
    });
    return '<g transform="translate(' + P(end[0], end[1]) + ") rotate(" + f(h.tilt) + ") scale(" + f(h.s) + ')">' +
      '<g class="fl-head">' +
        petals +
        '<circle class="fl-coreglow" cx="0" cy="' + (RING_Y - 1) + '" r="24" fill="url(#fl-g-coreglow)"/>' +
        '<g class="fl-cup">' +
          '<path d="M-21 ' + RING_Y + "C-20.5 -1.5 -10 3.6 0 3.6C10 3.6 20.5 -1.5 21 " + RING_Y + 'Z" fill="url(#fl-g-bowl)" fill-opacity="0.96"/>' +
          '<g filter="url(#fl-f-glow)">' +
            '<ellipse cx="0" cy="' + RING_Y + '" rx="21" ry="7.4" fill="url(#fl-g-rim)"/>' +
            '<ellipse cx="0" cy="' + (RING_Y - 0.5) + '" rx="16.6" ry="5" fill="#dcefff"/>' +
            '<ellipse class="fl-core" cx="0" cy="' + (RING_Y - 1.5) + '" rx="13" ry="3.6" fill="url(#fl-g-core)"/>' +
            '<ellipse cx="-5" cy="' + (RING_Y - 2.3) + '" rx="4.2" ry="0.9" fill="#ffffff" opacity="0.85"/>' +
          "</g>" +
        "</g>" +
      "</g></g>";
  }

  function flowerSvg(fl) {
    const id = fl.key, top = fl.stem[3];
    const centerD = curveD(fl.stem);
    const w0 = fl.w[0], w1 = fl.w[1];
    const width = function (t) { return w0 + (w1 - w0) * Math.pow(t, 0.62); };
    const body = ribbon(fl.stem, width, 40);
    const hl = ribbon(fl.stem, function (t) { return width(t) * 0.26; }, 40, -1.6);

    let leaves = "";
    fl.leaves.forEach(function (lf, i) {
      const c = curveAt(fl.stem, lf.t);
      leaves += leafMarkup(lf, c.x, c.y, "fl-leaf-" + id + i);
    });

    return '<svg class="fl-svg" viewBox="0 0 ' + VB_W + " " + VB_H + '" aria-hidden="true" focusable="false">' +
      "<defs>" +
        '<linearGradient id="fl-gs-' + id + '" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="' + f(top[0]) + '" y2="' + f(top[1]) + '">' +
          '<stop offset="0" stop-color="#2f6fd6" stop-opacity="0.12"/><stop offset="0.2" stop-color="#2f6fd6" stop-opacity="0.62"/>' +
          '<stop offset="0.6" stop-color="#3fa9d6" stop-opacity="0.95"/><stop offset="1" stop-color="#72d4f4"/></linearGradient>' +
        '<linearGradient id="fl-gh-' + id + '" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="' + f(top[0]) + '" y2="' + f(top[1]) + '">' +
          '<stop offset="0" stop-color="#8ae8ff" stop-opacity="0"/><stop offset="0.45" stop-color="#8ae8ff" stop-opacity="0.22"/>' +
          '<stop offset="1" stop-color="#c9f5ff" stop-opacity="0.7"/></linearGradient>' +
        '<mask id="fl-mk-' + id + '" maskUnits="userSpaceOnUse" x="-200" y="-380" width="400" height="400">' +
          '<path class="fl-mstroke" d="' + centerD + '" fill="none" stroke="#fff" stroke-width="16"/></mask>' +
      "</defs>" +
      "<g " + WORLD + ">" +
        leaves +
        '<g mask="url(#fl-mk-' + id + ')">' +
          '<path d="' + body + '" fill="url(#fl-gs-' + id + ')"/>' +
          '<path d="' + hl + '" fill="url(#fl-gh-' + id + ')"/>' +
        "</g>" +
        headMarkup(fl) +
        '<circle class="fl-tip" cx="0" cy="0" r="9" fill="url(#fl-g-tip)" opacity="0"/>' +
      "</g></svg>";
  }

  function grassSvg() {
    let defs = "", body = "";
    GRASS.forEach(function (g, i) {
      const top = g.pts[g.pts.length - 1];
      const width = function (t) {
        const w = t < 0.3 ? 0.4 + 0.6 * (t / 0.3) : Math.pow(1 - (t - 0.3) / 0.7, 0.75);
        return 0.18 + g.wmax * w;
      };
      defs +=
        '<linearGradient id="fl-gg-' + i + '" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="' + f(top[0]) + '" y2="' + f(top[1]) + '">' +
          '<stop offset="0" stop-color="#2f6fd6" stop-opacity="0"/><stop offset="0.35" stop-color="#2f6fd6" stop-opacity="0.45"/>' +
          '<stop offset="0.8" stop-color="#3fa9d6" stop-opacity="0.9"/><stop offset="1" stop-color="#8ae8ff"/></linearGradient>' +
        '<mask id="fl-mg-' + i + '" maskUnits="userSpaceOnUse" x="-200" y="-260" width="260" height="280">' +
          '<path class="fl-mstroke" d="' + curveD(g.pts) + '" fill="none" stroke="#fff" stroke-width="10"/></mask>';
      body += '<g mask="url(#fl-mg-' + i + ')" opacity="' + g.op + '"><path d="' + ribbon(g.pts, width, 44) + '" fill="url(#fl-gg-' + i + ')"/></g>';
    });
    return '<svg class="fl-svg" viewBox="0 0 ' + VB_W + " " + VB_H + '" aria-hidden="true" focusable="false">' +
      "<defs>" + defs + "</defs><g " + WORLD + ">" + body + "</g></svg>";
  }

  function baseSvg() {
    let leaves = "";
    BASE_LEAVES.forEach(function (lf, i) { leaves += leafMarkup(lf, lf.x, lf.y, "fl-leaf-b" + i); });
    return '<svg class="fl-svg" viewBox="0 0 ' + VB_W + " " + VB_H + '" aria-hidden="true" focusable="false">' +
      "<g " + WORLD + ' opacity="0.85">' + leaves + "</g></svg>";
  }

  /* ---------------- kilau (canvas) ---------------- */
  const COLORS = [
    { c: "255,221,92", w: 0.36 },    // kuning hangat (seperti referensi)
    { c: "255,240,190", w: 0.14 },   // putih hangat
    { c: "112,226,255", w: 0.38 },   // cyan
    { c: "214,236,255", w: 0.12 }    // ice
  ];
  const MAX_SPARKS = 40;

  const Sparks = {
    canvas: null, ctx: null, box: null, sprites: {}, list: [], emitters: [], tips: [],
    w: 0, h: 0, bw: 0, bh: 0, padL: 0, padT: 0, unit: 1, dpr: 1, on: false,

    init: function (canvas, box) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.box = box;
      COLORS.forEach(function (col) {
        const s = document.createElement("canvas");
        s.width = s.height = 64;
        const g = s.getContext("2d");
        const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        gr.addColorStop(0, "rgba(255,255,255,1)");
        gr.addColorStop(0.07, "rgba(" + col.c + ",1)");
        gr.addColorStop(0.17, "rgba(" + col.c + ",0.95)");
        gr.addColorStop(0.24, "rgba(" + col.c + ",0.3)");
        gr.addColorStop(0.5, "rgba(" + col.c + ",0.08)");
        gr.addColorStop(1, "rgba(" + col.c + ",0)");
        g.fillStyle = gr;
        g.fillRect(0, 0, 64, 64);
        Sparks.sprites[col.c] = s;
      });
      this.resize();
    },

    resize: function () {
      if (!this.box) return;
      this.bw = this.box.clientWidth;
      this.bh = this.box.clientHeight;
      this.padL = this.bw * 0.2;
      this.padT = this.bh * 0.24;
      this.w = this.bw * 1.4;
      this.h = this.bh * 1.26;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(this.w * this.dpr);
      this.canvas.height = Math.round(this.h * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.unit = (K * this.bw) / VB_W; // px per unit lokal
    },

    px: function (x, y) {
      return [this.padL + ((OX + K * x) / VB_W) * this.bw, this.padT + ((OY + K * y) / VB_H) * this.bh];
    },

    pickColor: function () {
      let r = Math.random();
      for (let i = 0; i < COLORS.length; i++) { r -= COLORS[i].w; if (r <= 0) return COLORS[i].c; }
      return COLORS[0].c;
    },

    spawn: function (x, y, o) {
      if (this.list.length >= MAX_SPARKS) return;
      o = o || {};
      const s = Math.sqrt(this.bw / 380);
      this.list.push({
        x: x, y: y,
        vx: o.vx != null ? o.vx : A.rand(-2.5, 2.5),
        vy: o.vy != null ? o.vy : -A.rand(5, 14),
        age: 0, life: o.life || A.rand(2.8, 5.4),
        r: (o.r || A.rand(0.8, 1.75)) * s,
        wa: A.rand(1.5, 5), wf: A.rand(0.6, 1.5), ph: Math.random() * 6.28,
        tw: A.rand(2.2, 6.2), a: o.a || A.rand(0.65, 1),
        c: this.pickColor(), flare: Math.random() < 0.16,
        drag: o.drag || 1
      });
    },

    burst: function (cx, cy, scale) {
      for (let i = 0; i < 9; i++) {
        const ang = -Math.PI / 2 + A.rand(-1.35, 1.35);
        const sp = A.rand(10, 26) * scale;
        this.spawn(cx + A.rand(-6, 6) * scale, cy + A.rand(-4, 2) * scale, {
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: A.rand(1.4, 2.6), drag: 0.97, r: A.rand(0.8, 1.5)
        });
      }
    },

    tick: function (dt) {
      // emitter ambient di sekitar tiap bunga
      for (let i = 0; i < this.emitters.length; i++) {
        const e = this.emitters[i];
        e.acc += dt * e.rate;
        while (e.acc >= 1) {
          e.acc -= 1;
          this.spawn(e.x + A.rand(-1, 1) * e.r * 1.15, e.y + A.rand(-1.1, 0.35) * e.r);
        }
      }
      // ujung batang yang sedang tumbuh meninggalkan serbuk cahaya
      for (let i = 0; i < this.tips.length; i++) {
        const t = this.tips[i];
        if (!t.active) continue;
        t.acc += dt * 6;
        while (t.acc >= 1) {
          t.acc -= 1;
          this.spawn(t.x + A.rand(-3, 3), t.y + A.rand(-2, 4), { vy: -A.rand(2, 7), life: A.rand(1.0, 2.0), r: A.rand(0.6, 1.1) });
        }
      }

      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.w, this.h);
      ctx.globalCompositeOperation = "lighter";
      const u = this.unit;
      for (let i = this.list.length - 1; i >= 0; i--) {
        const p = this.list[i];
        p.age += dt;
        if (p.age >= p.life) { this.list.splice(i, 1); continue; }
        p.vx *= p.drag === 1 ? 1 : Math.pow(p.drag, dt * 60);
        p.vy = p.drag === 1 ? p.vy : p.vy * Math.pow(p.drag, dt * 60) - 4 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const k = p.age / p.life;
        const env = Math.min(1, k / 0.18) * Math.min(1, (1 - k) / 0.38);
        const tw = 0.5 + 0.5 * Math.sin(p.age * p.tw + p.ph);
        const alpha = p.a * env * (0.3 + 0.7 * tw * tw);
        if (alpha < 0.01) continue;
        const wx = Math.sin(p.age * p.wf + p.ph) * p.wa;
        const q = this.px(p.x + wx, p.y);
        const D = p.r * 15;
        ctx.globalAlpha = alpha;
        ctx.drawImage(this.sprites[p.c], q[0] - D / 2, q[1] - D / 2, D, D);
        if (p.flare && alpha > 0.35) {
          const fl = p.r * 5.5 * (0.6 + 0.4 * tw);
          ctx.globalAlpha = alpha * 0.45;
          ctx.fillStyle = "rgba(" + p.c + ",1)";
          ctx.fillRect(q[0] - fl, q[1] - 0.35, fl * 2, 0.7);
          ctx.fillRect(q[0] - 0.35, q[1] - fl, 0.7, fl * 2);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      void u;
    },

    start: function () {
      if (this.on) return;
      this.on = true;
      gsap.ticker.add(this._tick);
    },
    stop: function () {
      this.on = false;
      gsap.ticker.remove(this._tick);
      this.list.length = 0;
      if (this.ctx) this.ctx.clearRect(0, 0, this.w, this.h);
    },
    _tick: function (time, deltaTime) {
      const dt = Math.min(0.05, (deltaTime / 1000) * gsap.globalTimeline.timeScale());
      Sparks.tick(dt);
    }
  };

  /* ---------------- state scene ---------------- */
  const S = { root: null, built: false, loops: [], upLoop: null };

  function q(sel) { return S.root.querySelector(sel); }

  /* ---------------- mount ---------------- */
  function mount(root, ctx) {
    S.root = root;
    const cfg = (ctx && ctx.config && ctx.config.flower) || {};
    const caption = cfg.caption != null ? String(cfg.caption) : "";
    const hintText = cfg.scrollHint != null ? String(cfg.scrollHint) : "scroll ke atas";

    let layers = "";
    // urutan layer: tengah (belakang) → rumput → kiri → kanan → pangkal
    const layerFor = function (fl) {
      const c = toPct(headCenter(fl).x, headCenter(fl).y);
      return '<div class="fl-layer" data-fl="' + fl.key + '">' +
        '<div class="fl-halo" style="left:' + f(c.x) + "%;top:" + f(c.y) + "%;width:" + f(fl.halo.d * 100) + '%"></div>' +
        flowerSvg(fl) +
        '<div class="fl-glint" style="left:' + f(c.x) + "%;top:" + f(c.y) + "%;width:" + f(fl.glint.d * 100) + '%"></div>' +
        "</div>";
    };
    layers += layerFor(FLOWERS[0]);
    layers += '<div class="fl-layer fl-layer-grass" data-fl="g">' + grassSvg() + "</div>";
    layers += layerFor(FLOWERS[2]);
    layers += layerFor(FLOWERS[1]);

    root.innerHTML =
      '<div class="fl-scene">' +
        sharedDefs() +
        '<div class="fl-box">' +
          '<div class="fl-fog"></div>' +
          '<div class="fl-sway">' + layers + "</div>" +
          '<div class="fl-layer fl-layer-base">' + baseSvg() + '<div class="fl-baselight"></div></div>' +
          '<canvas class="fl-sparks" aria-hidden="true"></canvas>' +
        "</div>" +
        (caption ? '<p class="fl-caption">' + A.esc(caption) + "</p>" : "") +
        '<button class="fl-up" type="button" data-scroll-up aria-label="' + A.esc(hintText) + '">' +
          '<span class="fl-up-arrow" aria-hidden="true">' +
            '<svg class="fl-up-chev" viewBox="0 0 16 9"><polyline points="1.2,8 8,1.2 14.8,8"/></svg>' +
            '<span class="fl-up-track"><span class="fl-up-line"></span><span class="fl-up-flow"></span></span>' +
          "</span>" +
          '<span class="hint fl-up-hint">' + A.esc(hintText) + "</span>" +
        "</button>" +
      "</div>";

    // referensi elemen
    S.box = q(".fl-box");
    S.sway = q(".fl-sway");
    S.fog = q(".fl-fog");
    S.baseLight = q(".fl-baselight");
    S.caption = q(".fl-caption");
    S.up = q(".fl-up");
    S.upChev = q(".fl-up-chev");
    S.upFlow = q(".fl-up-flow");
    S.upHint = q(".fl-up-hint");
    S.grassLayer = q(".fl-layer-grass");
    S.grassMasks = S.grassLayer.querySelectorAll(".fl-mstroke");
    S.baseLeaves = q(".fl-layer-base").querySelectorAll(".fl-leaf");

    FLOWERS.forEach(function (fl) {
      const L = q('.fl-layer[data-fl="' + fl.key + '"]');
      const mask = L.querySelector(".fl-mstroke");
      fl.el = {
        layer: L,
        halo: L.querySelector(".fl-halo"),
        glint: L.querySelector(".fl-glint"),
        mask: mask,
        maskLen: mask.getTotalLength(),
        tip: L.querySelector(".fl-tip"),
        head: L.querySelector(".fl-head"),
        cup: L.querySelector(".fl-cup"),
        coreGlow: L.querySelector(".fl-coreglow"),
        petals: L.querySelectorAll(".fl-petal"),
        leaves: fl.leaves.map(function (_, i) { return L.querySelector(".fl-leaf-" + fl.key + i); })
      };
    });

    // keadaan awal: semua tersembunyi
    const layersAll = S.root.querySelectorAll(".fl-layer");
    gsap.set(layersAll, { transformOrigin: BASE_ORIGIN });
    gsap.set(S.sway, { transformOrigin: BASE_ORIGIN });
    gsap.set([S.fog, S.baseLight], { xPercent: -50, yPercent: -50, opacity: 0 });
    FLOWERS.forEach(function (fl) {
      const e = fl.el;
      gsap.set(e.mask, { drawSVG: "0% 0%" });
      gsap.set([e.halo, e.glint], { xPercent: -50, yPercent: -50, opacity: 0, scale: 0.5 });
      gsap.set(e.head, { svgOrigin: "0 0", scale: 0 });
      gsap.set(e.cup, { svgOrigin: "0 " + RING_Y, scale: 0.3, opacity: 0 });
      gsap.set(e.coreGlow, { svgOrigin: "0 " + (RING_Y - 1), scale: 0.2, opacity: 0 });
      e.petals.forEach(function (p, i) {
        gsap.set(p, { svgOrigin: "0 0", rotation: PETALS[i].c, scaleX: 0.42, scaleY: 0.86 });
      });
      e.leaves.forEach(function (lf) { gsap.set(lf, { svgOrigin: "0 0", scale: 0 }); });
    });
    S.grassMasks.forEach(function (m) { gsap.set(m, { drawSVG: "0% 0%" }); });
    S.baseLeaves.forEach(function (lf) { gsap.set(lf, { svgOrigin: "0 0", scale: 0 }); });
    if (S.caption) gsap.set(S.caption, { opacity: 0 });
    gsap.set(S.up, { autoAlpha: 0 });

    Sparks.init(q(".fl-sparks"), S.box);
    window.addEventListener("resize", function () { Sparks.resize(); }, { passive: true });
  }

  /* ---------------- timeline tumbuh ---------------- */
  function build(onArrow) {
    const tl = gsap.timeline({ paused: true });

    // 1 — titik cahaya di pangkal menyala, kabut tipis
    tl.fromTo(S.baseLight, { opacity: 0, scale: 0.15 }, { opacity: 1, scale: 1, duration: 1.1, ease: "expo.out" }, 0.2);
    tl.fromTo(S.fog, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 2.8, ease: "sine.out" }, 0.35);
    tl.to(S.baseLight, { opacity: 0.42, scale: 0.8, duration: 1.8, ease: "sine.inOut" }, 3.0);

    // daun kecil di pangkal
    S.baseLeaves.forEach(function (lf, i) {
      const d = BASE_LEAVES[i];
      tl.fromTo(lf, { scale: 0, rotation: d.a < -90 ? 24 : -24 },
        { scale: 1, rotation: 0, duration: 1.1, ease: "power3.out", svgOrigin: "0 0" }, d.at);
    });

    // rumput
    GRASS.forEach(function (g, i) {
      tl.fromTo(S.grassMasks[i], { drawSVG: "0% 0%" },
        { drawSVG: "0% 100%", duration: g.grow.dur, ease: g.grow.ease }, g.grow.at);
    });

    FLOWERS.forEach(function (fl, fi) {
      const e = fl.el, g = fl.grow;
      const stemEnd = g.at + g.dur;
      const tip = { x: 0, y: 0, active: false, acc: 0 };
      Sparks.tips.push(tip);

      // 2 — batang tergambar dari bawah, cahaya ujung memimpin
      tl.fromTo(e.mask, { drawSVG: "0% 0%" }, {
        drawSVG: "0% 100%", duration: g.dur, ease: g.ease,
        onStart: function () { tip.active = true; },
        onUpdate: function () {
          const pt = e.mask.getPointAtLength(this.ratio * e.maskLen);
          e.tip.setAttribute("cx", pt.x.toFixed(2));
          e.tip.setAttribute("cy", pt.y.toFixed(2));
          tip.x = pt.x; tip.y = pt.y;
        },
        onComplete: function () { tip.active = false; }
      }, g.at);
      tl.fromTo(e.tip, { opacity: 0, attr: { r: 3 } }, { opacity: 1, attr: { r: 9 }, duration: 0.5, ease: "power2.out" }, g.at - 0.05);
      tl.to(e.tip, { opacity: 0, attr: { r: 14 }, duration: 0.7, ease: "power1.in" }, stemEnd - 0.35);

      // 3 — daun membuka dari titik tempel saat batang melewatinya
      fl.leaves.forEach(function (lf, i) {
        const frac = arcFrac(fl.stem, lf.t);
        const at = g.at + g.dur * invEase(g.ease, frac) - 0.08;
        const c = curveAt(fl.stem, lf.t);
        const stemAng = (Math.atan2(c.ty, c.tx) * 180) / Math.PI;
        let fold = (stemAng - lf.a) * 0.8;
        if (fold > 180) fold -= 360;
        if (fold < -180) fold += 360;
        tl.fromTo(e.leaves[i], { scale: 0, rotation: fold },
          { scale: 1, rotation: 0, duration: 1.15 + (lf.L / 60) * 0.35, ease: i % 2 ? "power3.out" : "power2.out", svgOrigin: "0 0" }, at);
      });

      // 4 — kuncup muncul di ujung batang, membengkak, lalu mekar
      const bud = stemEnd - 0.22;
      const bloom = bud + 0.85;
      fl.bloomAt = bloom;
      tl.fromTo(e.head, { scale: 0 }, { scale: 0.6, duration: 0.72, ease: "power2.out", svgOrigin: "0 0" }, bud);
      tl.to(e.head, { scale: 1, duration: 1.55, ease: "sine.inOut", svgOrigin: "0 0" }, bloom - 0.1);
      e.petals.forEach(function (p, i) {
        const d = PETALS[i];
        tl.fromTo(p, { rotation: d.c, scaleX: 0.42, scaleY: 0.86 },
          { rotation: d.a, scaleX: 1, scaleY: 1, duration: d.k === "out" ? 1.7 : 1.45, ease: d.k === "back" ? "power2.out" : "power3.out", svgOrigin: "0 0" },
          bloom + d.d);
      });

      // 5 — inti menyala + halo mekar bersamaan dengan bloom
      tl.fromTo(e.cup, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 1.0, ease: "expo.out", svgOrigin: "0 " + RING_Y }, bloom + 0.28);
      tl.fromTo(e.coreGlow, { opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1, duration: 1.3, ease: "power2.out", svgOrigin: "0 " + (RING_Y - 1) }, bloom + 0.3);
      tl.fromTo(e.halo, { opacity: 0, scale: 0.55 }, { opacity: fl.halo.peak, scale: 1, duration: 2.1, ease: "power2.out" }, bloom + 0.15);
      tl.fromTo(e.glint, { opacity: 0, scale: 0.35 }, { opacity: 1, scale: 1.12, duration: 0.75, ease: "power3.out" }, bloom + 0.32);
      tl.to(e.glint, { opacity: 0.72, scale: 1, duration: 1.5, ease: "sine.inOut" }, bloom + 1.07);
      tl.call(function () {
        const c = headCenter(fl);
        Sparks.burst(c.x, c.y, fl.head.s);
        Sparks.emitters.push({ x: c.x, y: c.y, r: 30 * fl.head.s + 8, rate: fl.emit, acc: 0.6 });
      }, null, bloom + 0.45);
      void fi;
    });

    // 6 — napas: goyang halus dari pangkal, glow bernapas
    tl.call(startAmbient, null, 4.3);

    // caption lembut di bawah bunga
    if (S.caption) {
      tl.fromTo(S.caption, { opacity: 0, y: 10, letterSpacing: "0.14em" },
        { opacity: 1, y: 0, letterSpacing: "0.035em", duration: 1.9, ease: "sine.out" }, 4.9);
    }

    // 7 — panah tipis ke atas
    const tArrow = 6.0;
    tl.fromTo(S.up, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: "expo.out" }, tArrow);
    tl.fromTo(S.upHint, { opacity: 0, letterSpacing: "0.6em" }, { opacity: 1, letterSpacing: "0.32em", duration: 1.4, ease: "power2.out" }, tArrow + 0.15);
    tl.call(startArrowLoop, null, tArrow + 0.2);
    tl.call(onArrow, null, tArrow + 0.3);
    return tl;
  }

  function startAmbient() {
    if (A.reducedMotion) return;
    const loops = S.loops;
    // seluruh rumpun bergoyang sangat halus
    loops.push(gsap.timeline()
      .to(S.sway, { rotation: 0.35, duration: 2.2, ease: "sine.out" })
      .to(S.sway, { rotation: -0.35, duration: 4.4, ease: "sine.inOut", yoyo: true, repeat: -1 }));

    FLOWERS.forEach(function (fl, i) {
      const e = fl.el, a = fl.sway.amp * fl.sway.dir, per = fl.sway.period;
      loops.push(gsap.timeline({ delay: i * 0.35 })
        .to(e.layer, { rotation: a, duration: per / 4, ease: "sine.out" })
        .to(e.layer, { rotation: -a, duration: per / 2, ease: "sine.inOut", yoyo: true, repeat: -1 }));
      // halo & kilau inti bernapas (periode berbeda supaya tidak serempak)
      loops.push(gsap.to(e.halo, { opacity: fl.halo.peak * 0.74, scale: 1.05, duration: fl.halo.breath / 2, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 0.4 + i * 0.3 }));
      loops.push(gsap.to(e.glint, { opacity: 0.48, scale: 0.94, duration: fl.halo.breath * 0.4, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 0.8 + i * 0.25 }));
    });

    // rumput lebih lentur
    loops.push(gsap.timeline({ delay: 0.2 })
      .to(S.grassLayer, { rotation: -1.6, duration: 1.2, ease: "sine.out" })
      .to(S.grassLayer, { rotation: 1.4, duration: 2.3, ease: "sine.inOut", yoyo: true, repeat: -1 }));
    loops.push(gsap.to(S.baseLight, { opacity: 0.6, scale: 0.92, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 0.6 }));
  }

  function startArrowLoop() {
    if (S.upLoop) S.upLoop.kill();
    gsap.set(S.upFlow, { yPercent: 130, opacity: 0 });
    if (A.reducedMotion) { gsap.set(S.upFlow, { yPercent: -40, opacity: 0.8 }); return; }
    const t = gsap.timeline({ repeat: -1, repeatDelay: 0.45 });
    t.fromTo(S.upFlow, { yPercent: 130, opacity: 0 }, { yPercent: -250, opacity: 1, duration: 1.5, ease: "power1.in" }, 0)
      .to(S.upFlow, { opacity: 0, duration: 0.3, ease: "power1.in" }, 1.25)
      .fromTo(S.upChev, { y: 0, opacity: 0.62 }, { y: -4, opacity: 1, duration: 0.32, ease: "power2.out" }, 1.25)
      .to(S.upChev, { y: 0, opacity: 0.62, duration: 0.85, ease: "sine.inOut" }, 1.57);
    S.upLoop = t;
  }

  function stopAmbient() {
    S.loops.forEach(function (l) { l.kill(); });
    S.loops.length = 0;
    if (S.upLoop) { S.upLoop.kill(); S.upLoop = null; }
    Sparks.stop();
  }

  /* ---------------- registrasi ---------------- */
  Aleove.registerScene("flower", {
    mount: mount,

    play: function (ctx) {
      return new Promise(function (arrowShown) {
        Sparks.resize();
        Sparks.start();
        const tl = build(arrowShown);
        S.tl = tl;
        if (ctx.reducedMotion) {
          // tanpa animasi tumbuh: tampil langsung dengan fade lembut
          const scene = q(".fl-scene");
          gsap.set(scene, { opacity: 0 });
          tl.progress(1);
          gsap.to(scene, { opacity: 1, duration: 1.2, ease: "sine.out" });
        } else {
          tl.play(0);
        }
      }).then(function () {
        return ctx.waitForScrollUp();
      });
    },

    leave: function () {
      if (S.up) {
        S.up.blur();
        gsap.to(S.up, { autoAlpha: 0, y: -14, duration: 0.35, ease: "power2.in", overwrite: "auto" });
      }
      if (S.caption) gsap.to(S.caption, { opacity: 0, y: 6, duration: 0.3, ease: "power1.in", overwrite: "auto" });
      // bunga tetap; hentikan loop & partikel setelah kamera membawanya keluar layar
      gsap.delayedCall(3.6, stopAmbient);
    }
  });
})();

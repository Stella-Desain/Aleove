/* ==========================================================================
   Aleove sky — kanvas bintang berlapis (parallax), kerlip, nebula tipis,
   satu komet yang melintas berkala, dan efek "warp" saat kamera bergerak.
   API: Aleove.sky.setCamera(p)   p = posisi kamera (0 = bunga, 1 = surat, 2 = kado)
        Aleove.sky.comet()        paksa komet melintas sekarang
   ========================================================================== */
(function () {
  "use strict";
  const A = window.Aleove;
  const canvas = document.getElementById("sky");
  const ctx = canvas.getContext("2d");

  let W = 0, H = 0, DPR = 1;
  let stars = [];
  let nebula = null;
  let camP = 0, camPrev = 0, vel = 0;
  let t0 = performance.now();
  let running = true;

  // ---- komet: tepat satu, melintas berkala ----
  const comet = { active: false, t: 0, dur: 2.6, x0: 0, y0: 0, x1: 0, y1: 0, next: 1.6 };

  const LAYERS = [
    { depth: 0.18, size: [0.35, 0.8], alpha: [0.25, 0.6], share: 0.55 },
    { depth: 0.42, size: [0.6, 1.2], alpha: [0.4, 0.85], share: 0.32 },
    { depth: 0.85, size: [0.9, 1.8], alpha: [0.6, 1.0], share: 0.13 }
  ];
  const TINTS = ["255,255,255", "214,236,255", "170,210,255", "138,232,255", "255,242,214"];

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildStars();
    buildNebula();
  }

  function buildStars() {
    const total = Math.round(Math.min(520, Math.max(160, (W * H) / 2300)));
    stars = [];
    LAYERS.forEach(function (L, li) {
      const n = Math.round(total * L.share);
      for (let i = 0; i < n; i++) {
        const big = li === 2 && Math.random() < 0.18;
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: A.rand(L.size[0], L.size[1]) * (big ? 1.5 : 1),
          a: A.rand(L.alpha[0], L.alpha[1]),
          d: L.depth,
          tw: A.rand(0.6, 2.4),           // kecepatan kerlip
          ph: Math.random() * Math.PI * 2, // fase kerlip
          c: TINTS[(Math.random() * (Math.random() < 0.7 ? 2 : TINTS.length)) | 0],
          glint: big
        });
      }
    });
  }

  // nebula/milky way tipis dirender sekali ke offscreen canvas (setinggi 2 layar)
  function buildNebula() {
    nebula = document.createElement("canvas");
    nebula.width = Math.round(W * DPR);
    nebula.height = Math.round(H * 2 * DPR);
    const n = nebula.getContext("2d");
    n.scale(DPR, DPR);
    const blobs = [
      { x: 0.15, y: 0.25, r: 0.55, c: "60,110,220", a: 0.10 },
      { x: 0.8, y: 0.55, r: 0.5, c: "110,80,210", a: 0.07 },
      { x: 0.45, y: 0.9, r: 0.6, c: "40,140,200", a: 0.08 },
      { x: 0.7, y: 1.35, r: 0.55, c: "70,100,230", a: 0.09 },
      { x: 0.25, y: 1.7, r: 0.5, c: "120,90,220", a: 0.06 }
    ];
    blobs.forEach(function (b) {
      const R = b.r * Math.max(W, H);
      const g = n.createRadialGradient(b.x * W, b.y * H, 0, b.x * W, b.y * H, R);
      g.addColorStop(0, "rgba(" + b.c + "," + b.a + ")");
      g.addColorStop(1, "rgba(" + b.c + ",0)");
      n.fillStyle = g;
      n.fillRect(0, 0, W, H * 2);
    });
    // pita debu bintang diagonal yang sangat halus
    for (let i = 0; i < 900; i++) {
      const u = Math.random();
      const x = u * W;
      const y = H * (0.2 + u * 1.4) + (Math.random() - 0.5) * H * 0.35;
      n.fillStyle = "rgba(214,236,255," + (Math.random() * 0.22).toFixed(3) + ")";
      n.fillRect(x, y, 0.7, 0.7);
    }
  }

  function scheduleComet(delay) {
    comet.next = delay;
  }

  function launchComet() {
    comet.active = true;
    comet.t = 0;
    comet.dur = A.rand(2.2, 3.0);
    // dari kanan-atas menuju kiri-bawah, sedikit acak
    comet.x0 = W * A.rand(0.75, 1.1);
    comet.y0 = H * A.rand(-0.1, 0.18);
    comet.x1 = comet.x0 - W * A.rand(0.75, 1.05);
    comet.y1 = comet.y0 + H * A.rand(0.32, 0.55);
  }

  function drawComet(dt) {
    if (!comet.active) {
      comet.next -= dt;
      if (comet.next <= 0) launchComet();
      return;
    }
    comet.t += dt;
    const k = Math.min(1, comet.t / comet.dur);
    const e = 1 - Math.pow(1 - k, 1.6); // perlambatan halus
    const hx = comet.x0 + (comet.x1 - comet.x0) * e;
    const hy = comet.y0 + (comet.y1 - comet.y0) * e;
    const fade = Math.sin(Math.PI * k); // masuk & keluar halus
    const ang = Math.atan2(comet.y1 - comet.y0, comet.x1 - comet.x0);
    const tail = Math.min(W, H) * 0.42 * (0.55 + 0.45 * fade);
    const tx = hx - Math.cos(ang) * tail;
    const ty = hy - Math.sin(ang) * tail;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    // ekor
    const g = ctx.createLinearGradient(hx, hy, tx, ty);
    g.addColorStop(0, "rgba(234,246,255," + 0.9 * fade + ")");
    g.addColorStop(0.25, "rgba(138,232,255," + 0.35 * fade + ")");
    g.addColorStop(1, "rgba(111,180,255,0)");
    ctx.strokeStyle = g;
    ctx.lineCap = "round";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    // ekor lebar yang lembut
    ctx.lineWidth = 7;
    ctx.globalAlpha = 0.25;
    ctx.stroke();
    ctx.globalAlpha = 1;
    // kepala
    const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 14);
    hg.addColorStop(0, "rgba(255,255,255," + fade + ")");
    hg.addColorStop(0.3, "rgba(190,235,255," + 0.6 * fade + ")");
    hg.addColorStop(1, "rgba(111,180,255,0)");
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(hx, hy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (k >= 1) {
      comet.active = false;
      scheduleComet(A.rand(7, 11));
    }
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - t0) / 1000);
    t0 = now;
    const time = now / 1000;

    // kecepatan kamera (layar per detik), dihaluskan → efek warp
    const instV = dt > 0 ? (camP - camPrev) / dt : 0;
    vel += (instV - vel) * Math.min(1, dt * 8);
    camPrev = camP;

    ctx.clearRect(0, 0, W, H);

    // nebula (parallax paling lambat)
    if (nebula) {
      const span = H * 2;
      let ny = ((camP * H * 0.12) % span + span) % span;
      ctx.globalAlpha = 1;
      ctx.drawImage(nebula, 0, ny - span, W, span);
      ctx.drawImage(nebula, 0, ny, W, span);
    }

    // bintang
    const streak = Math.min(60, Math.abs(vel) * H * 0.035);
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const y = (((s.y + camP * H * s.d) % H) + H) % H;
      const tw = 0.55 + 0.45 * Math.sin(time * s.tw + s.ph);
      const a = s.a * tw;
      const len = streak * s.d;
      if (len > 1.2) {
        ctx.strokeStyle = "rgba(" + s.c + "," + a.toFixed(3) + ")";
        ctx.lineWidth = Math.max(0.6, s.r);
        ctx.beginPath();
        ctx.moveTo(s.x, y);
        ctx.lineTo(s.x, y - len * Math.sign(vel || 1));
        ctx.stroke();
      } else {
        ctx.fillStyle = "rgba(" + s.c + "," + a.toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.glint) {
          const gl = s.r * 5 * tw;
          ctx.strokeStyle = "rgba(" + s.c + "," + (a * 0.45).toFixed(3) + ")";
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(s.x - gl, y); ctx.lineTo(s.x + gl, y);
          ctx.moveTo(s.x, y - gl); ctx.lineTo(s.x, y + gl);
          ctx.stroke();
        }
      }
    }
    ctx.globalCompositeOperation = "source-over";

    drawComet(dt);
    requestAnimationFrame(frame);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      running = false;
    } else if (!running) {
      running = true;
      t0 = performance.now();
      requestAnimationFrame(frame);
    }
  });

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(frame);

  A.sky = {
    setCamera: function (p) { camP = p; },
    comet: function () { if (!comet.active) launchComet(); }
  };
})();

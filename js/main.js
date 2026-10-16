/* ==========================================================================
   Aleove main — kamera, gestur "scroll ke atas", musik, dan alur cerita:
   bunga → (scroll ke atas) → surat → (tekan roket) → kado & buku
   Debug: ?scene=flower|letter|gift   ?speed=2 (mempercepat semua animasi)
   ========================================================================== */
(function () {
  "use strict";
  const A = window.Aleove;
  const world = document.getElementById("world");
  const tint = document.getElementById("sky-tint");
  const fxLayer = document.getElementById("fx");
  const STATIONS = { flower: 0, letter: 1, gift: 2 };

  const speed = parseFloat(A.params.get("speed"));
  if (speed > 0) gsap.globalTimeline.timeScale(speed);

  /* ---------------- kamera ---------------- */
  const cam = { p: 0, nudge: 0 };

  function applyCam() {
    const p = cam.p + cam.nudge;
    gsap.set(world, { yPercent: p * 100 });
    A.sky.setCamera(p);
    tint.style.setProperty("--sky-p", Math.max(0, Math.min(1, p)).toFixed(3));
  }

  const camera = {
    get p() { return cam.p; },
    set(index) {
      gsap.killTweensOf(cam);
      cam.p = index;
      cam.nudge = 0;
      applyCam();
    },
    /** Pindah ke stasiun index. Return Promise saat sampai. */
    goTo(index, opts) {
      opts = opts || {};
      return new Promise(function (resolve) {
        gsap.to(cam, { nudge: 0, duration: 0.4, ease: "power2.out", onUpdate: applyCam });
        gsap.to(cam, {
          p: index,
          duration: opts.duration != null ? opts.duration : 2.6,
          ease: opts.ease || "power3.inOut",
          delay: opts.delay || 0,
          onUpdate: applyCam,
          onComplete: resolve
        });
      });
    }
  };

  /* ---------------- gestur "scroll ke atas" ----------------
     Selesai jika: wheel ke atas, swipe jari ke bawah (= scroll ke atas di HP),
     tombol ArrowUp/PageUp, atau klik elemen [data-scroll-up].
     Selama gestur parsial, dunia sedikit "ditarik" sebagai umpan balik. */
  function waitForScrollUp() {
    return new Promise(function (resolve) {
      let wheelAcc = 0, wheelTimer = 0, touchY = null, finished = false;
      const H = function () { return window.innerHeight; };

      function pull(px) {
        const n = Math.max(0, Math.min(0.08, (px / H()) * 0.35));
        gsap.to(cam, { nudge: n, duration: 0.25, ease: "power2.out", onUpdate: applyCam, overwrite: "auto" });
      }
      function release() {
        if (finished) return;
        gsap.to(cam, { nudge: 0, duration: 0.6, ease: "elastic.out(1, 0.6)", onUpdate: applyCam, overwrite: "auto" });
      }
      function finish() {
        if (finished) return;
        finished = true;
        cleanup();
        unlockAudio();
        resolve();
      }
      function onWheel(e) {
        e.preventDefault();
        if (e.deltaY < 0) {
          wheelAcc += -e.deltaY;
          pull(wheelAcc);
          if (wheelAcc > 60) finish();
        }
        clearTimeout(wheelTimer);
        wheelTimer = setTimeout(function () { wheelAcc = 0; release(); }, 220);
      }
      function onTouchStart(e) { touchY = e.touches[0].clientY; }
      function onTouchMove(e) {
        if (touchY == null) return;
        const dy = e.touches[0].clientY - touchY; // positif = jari turun = scroll ke atas
        if (dy > 0) {
          pull(dy);
          if (dy > 70) finish();
        }
      }
      function onTouchEnd() { touchY = null; release(); }
      function onKey(e) {
        if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); finish(); }
      }
      function onClick(e) {
        if (e.target.closest && e.target.closest("[data-scroll-up]")) finish();
      }
      function cleanup() {
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
        window.removeEventListener("keydown", onKey);
        document.removeEventListener("click", onClick);
        clearTimeout(wheelTimer);
      }
      window.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("touchend", onTouchEnd, { passive: true });
      window.addEventListener("keydown", onKey);
      document.addEventListener("click", onClick);
    });
  }

  // cegah scroll/zoom bawaan browser di luar gestur kita
  // (elemen yang boleh di-scroll sendiri, mis. isi kertas surat, beri atribut data-allow-scroll)
  window.addEventListener("wheel", function (e) {
    if (!(e.target.closest && e.target.closest("[data-allow-scroll]"))) e.preventDefault();
  }, { passive: false });
  document.addEventListener("gesturestart", function (e) { e.preventDefault(); });

  /* ---------------- musik (opsional) ---------------- */
  let audio = null;
  const soundBtn = document.getElementById("sound");
  if (A.config.music) {
    audio = new Audio(A.config.music);
    audio.loop = true;
    audio.volume = 0.7;
    soundBtn.hidden = false;
    soundBtn.classList.add("is-off");
    soundBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (audio.paused) { audio.play().catch(function () {}); soundBtn.classList.remove("is-off"); }
      else { audio.pause(); soundBtn.classList.add("is-off"); }
    });
  }
  function unlockAudio() {
    if (!audio || !audio.paused) return;
    audio.play().then(function () { soundBtn.classList.remove("is-off"); }).catch(function () {});
  }
  document.addEventListener("pointerdown", unlockAudio, { once: true });

  /* ---------------- konteks untuk scene ---------------- */
  const ctx = {
    config: A.config,
    camera: camera,
    sky: A.sky,
    fx: fxLayer,
    waitForScrollUp: waitForScrollUp,
    wait: A.wait,
    reducedMotion: A.reducedMotion,
    unlockAudio: unlockAudio
  };
  A.ctx = ctx;

  /* ---------------- alur ---------------- */
  async function run() {
    const names = ["flower", "letter", "gift"];
    names.forEach(function (name) {
      const scene = A.scenes[name];
      const root = document.getElementById("st-" + name);
      if (scene && scene.mount) scene.mount(root, ctx);
    });

    const start = A.params.get("scene") in STATIONS ? A.params.get("scene") : "flower";
    camera.set(STATIONS[start]);
    A.state = start;

    if (STATIONS[start] <= 0) {
      await A.scenes.flower.play(ctx);          // resolve setelah user scroll ke atas
      if (A.scenes.flower.leave) A.scenes.flower.leave(ctx);
      await camera.goTo(1, { duration: 2.8, ease: "power3.inOut" });
    }

    if (STATIONS[start] <= 1) {
      A.state = "letter";
      await A.scenes.letter.play(ctx);          // resolve saat roket mulai meluncur
      if (A.scenes.letter.leave) A.scenes.letter.leave(ctx);
      await camera.goTo(2, { duration: 3.0, ease: "power2.inOut" });
    }

    A.state = "gift";
    await A.scenes.gift.play(ctx);
  }

  function boot() {
    run().catch(function (err) { console.error("[Aleove]", err); });
  }

  // tunggu font supaya teks tidak "loncat" saat animasi masuk
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, A.wait(1.2)]).then(boot);
  } else {
    boot();
  }
})();

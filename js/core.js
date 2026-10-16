/* ==========================================================================
   Aleove core — namespace, registrasi scene, util kecil.
   Dimuat sebelum scene (flower/letter/gift) dan main.js.
   ========================================================================== */
(function () {
  "use strict";

  gsap.registerPlugin(DrawSVGPlugin, MotionPathPlugin, CustomEase);

  const A = (window.Aleove = window.Aleove || {});
  A.config = window.ALEOVE_CONFIG || {};
  A.scenes = {};
  A.params = new URLSearchParams(location.search);
  A.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /**
   * Kontrak scene:
   *   Aleove.registerScene(name, {
   *     mount(root, ctx)  // bangun DOM di dalam <section> stasiun, dipanggil sekali saat load
   *     play(ctx)         // jalankan scene; return Promise yang resolve saat scene siap ditinggalkan
   *     leave?(ctx)       // opsional, dipanggil tepat saat kamera mulai pindah
   *   })
   */
  A.registerScene = function (name, impl) {
    A.scenes[name] = impl;
  };

  /** Tunggu N detik memakai jam GSAP (ikut timeScale global, berguna untuk ?speed=). */
  A.wait = function (seconds) {
    return new Promise(function (resolve) {
      gsap.delayedCall(seconds, resolve);
    });
  };

  /** Promise dari sebuah timeline/tween GSAP. */
  A.done = function (anim) {
    return new Promise(function (resolve) {
      anim.eventCallback("onComplete", resolve);
    });
  };

  /** Escape teks untuk dimasukkan ke innerHTML. */
  A.esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  /** Angka acak dalam rentang. */
  A.rand = function (min, max) {
    return min + Math.random() * (max - min);
  };
})();

/* Buku DK401: halaman dan tombol dari dariku-dk401, di dalam slot Aleove. */
(function () {
  "use strict";
  const A = window.Aleove;
  let S;

  function mount(root, ctx) {
    const cfg = ctx.config.book;
    root.innerHTML =
      '<div class="bk-scene bk-is-closed">' +
        '<div class="bk-book bk-is-front" role="group" tabindex="0"></div>' +
        '<nav class="bk-nav" aria-label="Navigasi buku">' +
          '<button class="bk-prev" type="button" aria-label="Halaman sebelumnya" disabled>' +
            '<svg width="32" height="32" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path fill-rule="evenodd" d="M12 8a.5.5 0 0 1-.5.5H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5a.5.5 0 0 1 .5.5"/></svg>' +
          '</button>' +
          '<button class="bk-next" type="button" aria-label="Buka buku" disabled>' +
            '<svg width="32" height="32" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path fill-rule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8"/></svg>' +
          '</button>' +
        '</nav><p class="bk-status" aria-live="polite" aria-atomic="true"></p>' +
      '</div>';
    const book = root.querySelector(".bk-book");
    book.setAttribute("aria-label", cfg.title);
    S = {
      root: root, scene: root.querySelector(".bk-scene"), book: book, ctx: ctx,
      nav: root.querySelector(".bk-nav"),
      prev: root.querySelector(".bk-prev"), next: root.querySelector(".bk-next"),
      status: root.querySelector(".bk-status"),
      papers: [], position: 0, ready: false, busy: false, video: null
    };
    for (let index = 0; index < cfg.artwork.length - 1; index++) {
      const paper = document.createElement("div");
      paper.className = "bk-paper";
      paper.innerHTML = '<div class="bk-front"><div class="bk-front-content"></div></div>' +
        '<div class="bk-back"><div class="bk-back-content"></div></div>';
      paper.querySelector(".bk-front-content").style.setProperty("--bg", 'url("' + new URL(cfg.artwork[index], document.baseURI).href + '")');
      paper.querySelector(".bk-back-content").style.setProperty("--bg", 'url("' + new URL(cfg.artwork[index + 1], document.baseURI).href + '")');
      book.appendChild(paper);
      S.papers.push({ el: paper, front: paper.firstElementChild, back: paper.lastElementChild });
    }
    function addNote(selector, className, text) {
      const note = document.createElement("p");
      note.className = className;
      note.textContent = text;
      book.querySelector(selector).appendChild(note);
    }
    addNote(".bk-paper:nth-child(2) .bk-back-content", "bk-note-flowers", cfg.notes.flowers);
    addNote(".bk-paper:nth-child(4) .bk-front-content", "bk-note-memories", cfg.notes.memories);
    addNote(".bk-paper:nth-child(7) .bk-front-content", "bk-note-special", cfg.notes.special);
    const videoPage = book.querySelector(".bk-paper:nth-child(5) .bk-back-content");
    const video = document.createElement("video");
    video.className = "bk-film-video";
    video.src = cfg.video.src;
    video.poster = cfg.video.poster;
    video.preload = "metadata";
    video.controls = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("aria-label", "Video kenangan — 8 detik pertama");
    video.addEventListener("click", function (event) { event.stopPropagation(); });
    video.addEventListener("timeupdate", function () {
      if (video.currentTime >= 8) video.currentTime = 0;
    });
    videoPage.appendChild(video);
    const decoration = document.createElement("div");
    decoration.className = "bk-film-decoration";
    decoration.setAttribute("aria-hidden", "true");
    videoPage.appendChild(decoration);
    S.video = video;
    S.prev.addEventListener("click", function () { turn(-1); });
    S.next.addEventListener("click", function () { turn(1); });
    book.addEventListener("click", function (event) {
      if (event.target.closest("video")) return;
      if (S.position === 0) turn(1);
      else if (S.position === S.papers.length) turn(-1);
    });
    root.addEventListener("keydown", function (event) {
      if (event.target.closest("video")) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        turn(event.key === "ArrowRight" ? 1 : -1);
      }
      if ((event.key === "Enter" || event.key === " ") && event.target === book &&
          (S.position === 0 || S.position === S.papers.length)) {
        event.preventDefault();
        turn(S.position === 0 ? 1 : -1);
      }
    });
    let pointer = null;
    book.addEventListener("pointerdown", function (event) {
      if (event.target.closest("video") || !event.isPrimary || event.button !== 0) return;
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
      book.setPointerCapture(event.pointerId);
    });
    book.addEventListener("pointerup", function (event) {
      if (!pointer || pointer.id !== event.pointerId) return;
      const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
      pointer = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.25) turn(dx < 0 ? 1 : -1);
    });
    book.addEventListener("pointercancel", function () { pointer = null; });
    document.addEventListener("visibilitychange", syncVideo);
    render();
  }

  function syncVideo() {
    if (!S || !S.video) return;
    const active = S.ready && !S.busy && S.position === 5 && !document.hidden;
    S.video.classList.toggle("bk-is-active", active);
    if (active) S.video.play().catch(function () {});
    else {
      S.video.pause();
      if (S.video.readyState > 0) S.video.currentTime = 0;
    }
  }

  function render(turning) {
    const count = S.papers.length, position = S.position;
    const closed = position === 0 || position === count;
    S.scene.classList.toggle("bk-is-closed", closed);
    S.book.classList.toggle("bk-is-front", position === 0);
    S.book.classList.toggle("bk-is-back", position === count);
    S.book.classList.toggle("bk-is-open", !closed);
    S.book.dataset.page = String(position);
    S.book.setAttribute("aria-busy", String(S.busy));
    S.papers.forEach(function (paper, index) {
      let angle = 0, scale = 1;
      if (position === count) angle = -180;
      else if (position > 0) {
        const offset = index - (position - 1);
        if (offset === 0) angle = -150;
        else if (offset === -1) { angle = -160; scale = 1.05; }
        else if (offset < -1) { angle = -170; scale = 1.1; }
        else if (offset === 1) angle = -30;
        else if (offset === 2) { angle = -20; scale = 1.05; }
        else { angle = -10; scale = 1.1; }
      }
      const transform = "rotateY(" + angle + "deg) scaleX(" + scale + ")";
      paper.front.style.transform = transform;
      paper.back.style.transform = transform;
      paper.el.style.zIndex = index === turning ? count + 1 : (index < position ? index : count - index);
      paper.front.setAttribute("aria-hidden", String(!(position === 0 ? index === 0 : position < count && index === position)));
      paper.back.setAttribute("aria-hidden", String(!(position > 0 && index === position - 1)));
      paper.back.style.boxShadow = "7px 5px 12px rgba(0,0,0," +
        (!closed && index >= position - 2 && index <= position + 1 ? "0.2" : "0") + ")";
    });
    S.prev.disabled = !S.ready || S.busy || position === 0;
    S.next.disabled = !S.ready || S.busy || position === count;
    S.next.setAttribute("aria-label", position === 0 ? "Buka buku" : "Halaman berikutnya");
    S.status.textContent = position === 0 ? "Sampul depan" : position === count ? "Sampul belakang — Thank You" : "Bentangan " + position + " dari " + (count - 1);
    syncVideo();
  }

  function turn(direction) {
    if (!S || !S.ready || S.busy) return;
    const next = S.position + direction;
    if (next < 0 || next > S.papers.length) return;
    const turning = direction > 0 ? S.position : next;
    S.position = next;
    S.busy = true;
    render(turning);
    window.setTimeout(function () { S.busy = false; render(); }, S.ctx.reducedMotion ? 20 : 560);
  }

  function play(ctx) {
    S.ready = true;
    S.scene.classList.add("bk-is-ready");
    render();
    gsap.fromTo(S.nav, { autoAlpha: 0, y: 28 }, {
      autoAlpha: 1, y: 0, duration: ctx.reducedMotion ? 0.2 : 0.65,
      ease: "power3.out", clearProps: "transform"
    });
    return new Promise(function () {});
  }
  A.registerScene("book", { mount: mount, play: play });
})();

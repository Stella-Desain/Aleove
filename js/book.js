/* ==========================================================================
   book — PLACEHOLDER. Modul buku dibuat terpisah (lihat docs/BOOK.md).
   Ganti seluruh file ini (dan css/book.css) dengan implementasi buku asli.
   ========================================================================== */
Aleove.registerScene("book", {
  mount: function (root, ctx) {
    root.innerHTML = '<div class="bk-placeholder">Buku foto<br>akan muncul di sini</div>';
  },
  play: function (ctx) {
    return new Promise(function () {}); // scene terakhir
  }
});

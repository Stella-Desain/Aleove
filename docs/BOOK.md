# Kontrak modul Buku (`js/book.js` + `css/book.css`)

Modul buku dibuat terpisah. Dokumen ini menjelaskan cara modul itu terhubung dengan web Aleove supaya bisa langsung "dicolok".

## File yang menjadi milik modul buku

- `js/book.js` dan `css/book.css`: buku DK401 yang sudah dipasang, dengan tujuh lembar, efek 3D, dan dua tombol panah.
- Data buku: objek `book` di `js/config.js` (`title`, delapan gambar `artwork`, tiga catatan `notes`, serta sumber dan poster `video`).
- Aset buku: `assets/book/`; gambar, video 8 detik, poster, dan font yang dipakai berasal dari folder `dariku-dk401` yang diberikan pengguna.

`index.html` sudah memuat `css/book.css` dan `js/book.js`. Latar, efek kado, dan alur Aleove tetap dikelola modul masing-masing; CSS buku memakai prefix `.bk-`.

## Alur

1. Scene kado (`js/gift.js`) berjalan di stasiun paling atas (`#st-gift`). User memilih 1 dari 4 kado, lalu kado terbuka dengan ledakan cahaya.
2. Pada momen itu `gift.js` membuat slot `<div class="gf-book-slot">` di dalam `#st-gift`. Slot ini `position: absolute; inset: 0` dan menutupi satu layar penuh.
3. `gift.js` memanggil `Aleove.scenes.book.mount(slot, ctx)`. Buku harus langsung dirender di posisi akhirnya (di tengah, sedikit di atas tengah supaya ada ruang tombol di bawah). Tombol navigasi masih tersembunyi.
4. `gift.js` menganimasikan **slot** muncul dari kado (opacity dan scale, dengan glow), lalu memanggil `Aleove.scenes.book.play(ctx)`.
5. `play` mengurus sisanya. Tombol panah kiri/kanan muncul dari bawah, lalu user membalik halaman. Ini scene terakhir, jadi Promise-nya boleh tidak pernah resolve.

```js
Aleove.registerScene("book", {
  mount(root, ctx) { /* bangun DOM buku di dalam root (slot layar penuh) */ },
  play(ctx)        { /* munculkan tombol panah dari bawah, aktifkan flip */ }
});
```

## Yang tersedia

- `ctx.config.book`: data buku dari `js/config.js`. Catatan pribadi dipasang melalui `textContent`.
- `gsap` 3.15, `DrawSVGPlugin`, `MotionPathPlugin`, dan `CustomEase` sudah global dan teregistrasi. Jangan memuat apa pun dari internet.
- Token warna dan font ada di `css/base.css` (`--f-serif`, `--f-script`, `--f-sans`, `--ink`, `--ice`, `--blue`, `--paper`, dll).
- `html, body` memakai `touch-action: none`, dan event wheel global di-`preventDefault`. Buku mendukung tombol panah, keyboard kiri/kanan, dan swipe horizontal. Surat menyesuaikan ukuran teks dengan layar dan tidak memakai area scroll.
- Latar langit (bintang dan komet) digambar di kanvas di belakang. Slot buku harus transparan.
- Prefix class `.bk-` supaya tidak bentrok.

## Uji cepat

- `index.html?scene=gift` langsung membuka stasiun kado. Pilih kado mana saja dan buku akan muncul.
- `&speed=3` mempercepat semua animasi GSAP.
- Tombol kanan membuka buku; tombol kiri kembali sampai sampul depan. Halaman video hanya diputar saat bentangan kelima sedang terlihat dan tab aktif.

## Sumber aset

Desain halaman, gambar, dan bentuk tombol berasal dari tema DK401 — Dariku / Deka Tutorial, melalui salinan lokal pengguna di `dariku-dk401`. Hanya komponen buku, catatan, video, dan navigasinya yang diambil. Musik latar memakai URL yang sama dengan salinan tersebut: Andmesh — Anugerah Terindah. Kontrol musik Aleove tetap tersedia.

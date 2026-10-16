/* ==========================================================================
   KONFIGURASI — ubah teks, foto, dan musik di file ini saja.
   Foto: taruh file kamu di folder assets/photos/ lalu ganti path-nya di bawah.
   ========================================================================== */
window.ALEOVE_CONFIG = {
  /* ---------- Scene 1: bunga ---------- */
  flower: {
    caption: "untukmu, di bawah langit yang sama", // teks kecil di bawah bunga (kosongkan "" jika tidak mau)
    scrollHint: "scroll ke atas"
  },

  /* ---------- Scene 2: surat ---------- */
  letter: {
    prompt: "tolong di buka sayang.",
    tapHint: "ketuk suratnya",
    to: "Untuk kamu,",
    // Tiap item = satu paragraf. Bebas diganti.
    body: [
      "Kalau kamu sedang membaca ini, berarti suratku sudah sampai — melewati bintang-bintang, satu komet, dan sedikit rasa gugup.",
      "Aku cuma mau bilang: terima kasih sudah jadi tempat paling tenang di semesta kecilku. Hari-hariku lebih terang sejak ada kamu.",
      "Teks ini masih sementara, nanti aku ganti dengan kata-kata yang lebih pantas buat kamu."
    ],
    signature: "— yang selalu sayang kamu",
    rocketHint: "tekan roketnya"
  },

  /* ---------- Scene 3: kado & buku ---------- */
  gift: {
    prompt: "Pilih satu kado, yang mana aja.",
    subPrompt: "semuanya isinya sama kok, hehe",
    openHint: "ketuk untuk membuka"
  },

  book: {
    cover: {
      // 3 foto polaroid di sampul (urutan: atas, tengah, bawah)
      photos: [
        "assets/photos/foto-1.svg",
        "assets/photos/foto-2.svg",
        "assets/photos/foto-3.svg"
      ],
      kicker: "HAPPY",
      title: "Special Day"
    },
    // Halaman isi buku. Setiap halaman: foto + judul + teks pendek.
    pages: [
      { photo: "assets/photos/foto-1.svg", title: "Awal cerita", text: "Hari pertama kita bertemu. Aku masih ingat semuanya." },
      { photo: "assets/photos/foto-2.svg", title: "Tawa kecil", text: "Momen sederhana yang ternyata paling sering aku putar ulang." },
      { photo: "assets/photos/foto-3.svg", title: "Perjalanan", text: "Ke mana pun, asal sama kamu, rasanya selalu pulang." },
      { photo: "assets/photos/foto-4.svg", title: "Hari ini", text: "Dan hari ini, aku cuma mau bilang: selamat hari spesial, sayang." }
    ],
    endText: "Terima kasih sudah jadi bintangku.",
    navHint: "geser halaman"
  },

  /* ---------- Musik (opsional) ----------
     Isi dengan path file mp3, mis. "assets/music.mp3". Kosongkan "" untuk tanpa musik.
     Musik mulai saat pengguna pertama kali menyentuh/scroll (aturan browser). */
  music: ""
};

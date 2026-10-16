/* ==========================================================================
   KONFIGURASI — ubah teks, foto, dan musik di file ini saja.
   Foto: taruh file kamu di folder assets/photos/ lalu ganti path-nya di bawah.
   ========================================================================== */
window.ALEOVE_CONFIG = {
  /* ---------- Scene 1: bunga ---------- */
  flower: {
    caption: "Untuk kekasih ku tersayang, Afifatul Hanifah", // teks kecil di bawah bunga (kosongkan "" jika tidak mau)
    scrollHint: "scroll ke atas"
  },

  /* ---------- Scene 2: surat ---------- */
  letter: {
    prompt: "untuk ayang akuuu",
    tapHint: "ketuk suratnya",
    to: "for my little beby, alee.",
    // Tiap item = satu paragraf. Bebas diganti.
    body: [
      "TADAAAAA, ini hadiah special yang udah aku rencanain buat kasih kamu di anniversary kita nanti, Tapi kek nya hadiah ini harus datang duluan deh. :)))",
      "Ma aciwww ya udah jadi tempat paling tenang di semesta kecilku. Setiap bangun tidur aku selalu bangun dengan semangat mau nikahin Afifah secepatnya.",
      "Ini aku bikin sebagai tanda bahwa kamu ber arti bangt buat aku."
    ],
    signature: "dari you boy, Kyuu",
    rocketHint: "tekan roketnya"
  },

  /* ---------- Scene 3: kado & buku ---------- */
  gift: {
    prompt: "Pilih satu kado, yang mana aja.",
    subPrompt: "PILIH HADIAH NYAA BEBYYY.",
    openHint: "ketuk untuk membuka"
  },

  book: {
    "title": "From: Your Boys",
    "artwork": [
      "assets/book/p0-from-your-boys.png",
      "assets/book/p1-love-you-white.png",
      "assets/book/p2-cerita-bunga.png",
      "assets/book/p3-kenangan-bersama.png",
      "assets/book/p4-sehat-selalu.png",
      "assets/book/p5-video-kenangan.png",
      "assets/book/p6-special-memories.png",
      "assets/book/p7.webp"
    ],
    "notes": {
      "flowers": "Hari dimana hati ku lagi ga enak, tapi aku nggak tau kenapa pengen bngt tuntasin janji ngasih bunga ini ke kamu. mulai dari cium bunga satu satu, tanya sana sini, kartu ucapan hilang, pulang-balik ket toko bunga, minta anterin bang grab. walau nggak berjalan sesuai rencana aku TETAPPP HAPPY, walau nggak keliatan depan kamu 🤭",
      "memories": "Sudah banyak yang kita lalui bersama Jalan-jalan, makan coto, pergi ke mall dan banyakkkk lagi, makasih yaaa. ini berti banget buat aku. mungkin aku akan cetak buku ini buat kenang-kenangan. ❤️",
      "special": "Maaf buat perilaku aku yang nyakitin beby, maaf selalu juga selalu teledor. Aku pengen kamu tau, I'm so lucky have you. Jangan bosen sama aku, jangan jauh sama aku, tełep sama aku yaaa."
    },
    "video": {
      "src": "assets/book/IMG_9467-first-8s.mp4",
      "poster": "assets/book/IMG_9467-poster.jpg"
    }
  },

  /* ---------- Musik (opsional) ----------
     Isi dengan path file mp3, mis. "assets/music.mp3". Kosongkan "" untuk tanpa musik.
     Musik mulai saat pengguna pertama kali menyentuh/scroll (aturan browser). */
  music: "https://dekatutorial.github.io/musik/ANDMESH%20-%20ANUGERAH%20TERINDAH%20-%20VIDEO%20LIRIK%20-%20LIRIK%20LAGU%20TERBARU.mp3"
};

# Internasionalisasi (i18n) & Animasi
> **Versi: RaaJS v3.1.0 "Data Liberation"**
> 
> Bahasa yang beradaptasi dan gerakan yang merespons adalah dua sisi dari koin yang sama: antarmuka yang tidak hanya dipahami, tapi juga dirasakan.

---

Aplikasi yang hanya berbicara dalam satu bahasa dan diam statis di layar mungkin fungsional, tapi terasa asing bagi pengguna yang memiliki ekspektasi berbeda. RaaJS menyelesaikan kedua kesenjangan ini bukan dengan menambah lapisan abstraksi, melainkan dengan menyuntikkan kehidupan ke dalam struktur deklaratif yang sudah kamu bangun. `raa-i18n.js` membuat teks berubah secara reaktif saat locale berganti. `raa-animation.js` menggerakkan elemen sesuai interaksi tanpa menulis satu pun `@keyframes` manual. Keduanya bekerja di luar siklus reaktif utama, tetapi terikat erat pada state yang kamu kontrol. Hasilnya bukan sekadar perubahan visual, melainkan pengalaman yang terasa hidup dan inklusif.

---

## raa-i18n.js — Bahasa yang Berubah Tanpa Reload

Internasionalisasi bukan sekadar menerjemahkan kata per kata secara statis. Ia adalah sistem pencocokan pola yang menggantikan token dengan nilai yang tepat saat konfigurasi locale berubah. Ketika kamu memanggil `$t('kunci.translasi')`, plugin menelusuri kamus aktif, menyisipkan variabel dinamis, dan memperbarui binding teks secara otomatis. Ini berarti antarmuka kamu bisa beralih dari Bahasa Indonesia ke Bahasa Inggris tanpa me-refresh halaman, memuat ulang state, atau memicu race condition.

Pipeline penerjemahan berjalan tiga langkah berurutan: parsing kunci kamus, interpolasi variabel dalam kurung kurawal, dan injeksi teks bersih ke DOM. Semuanya reaktif, tanpa sisa, tanpa flash teks yang belum diterjemahkan.

### Pola Dasar & Interpolasi
Kamu mendaftarkan kamus bahasa secara statis, lalu menggunakan `$t` di template untuk mengaksesnya. Interpolasi dilakukan dengan sintaks `{namaVariabel}` yang langsung dibaca dari objek kedua di `$t`.

```javascript
// Daftarkan kamus sebelum aplikasi dikompilasi
RaaI18n.setTranslations('id', {
  sapaan: 'Selamat datang, {nama}!',
  role: 'Anda login sebagai {role}'
});

RaaI18n.setTranslations('en', {
  sapaan: 'Welcome, {nama}!',
  role: 'You are logged in as {role}'
});

// Aktifkan locale
RaaI18n.setLocale('id');
```

```html
<!-- Template akan otomatis bereaksi saat locale atau variabel berubah -->
<p raa-bind:text="$t('sapaan', { nama: user.nama })"></p>
<p raa-bind:text="$t('role', { role: user.role })"></p>

<!-- Tombol ganti bahasa -->
<button raa-on:click="gantiBahasa('en')">English</button>
```

### Pluralisasi Cerdas
Bahasa memiliki aturan jumlah yang berbeda. RaaJS menangani ini dengan sintaks `|` yang memisahkan kondisi jamak dan tunggal secara eksplisit.

```javascript
RaaI18n.setTranslations('id', {
  keranjang: '1 item di keranjang | {count} item di keranjang',
  notifikasi: '{count} notifikasi baru' // Fallback sederhana untuk plural dinamis
});
```

```html
<!-- Engine otomatis memilih pola berdasarkan nilai 'count' -->
<p raa-bind:text="$t('keranjang', { count: totalItem })"></p>
```

Terasa terbatas jika butuh logika bahasa yang sangat kompleks? Valid. Tapi pendekatan deklaratif ini sengaja dirancang agar 95% kasus penerjemahan antarmuka bisa diselesaikan tanpa logika kondisional di template. Untuk aturan pluralisasi yang sangat spesifik per bahasa, kamu tetap bisa mendaftarkan fungsi kustom di level konfigurasi plugin.

**Pertanyaan paling simpel:** Apakah teks ini statis dan tidak pernah berubah berdasarkan preferensi pengguna?
Kalau jawabannya "Ya, selalu sama" — tulis langsung di HTML. Tidak perlu `$t`.
Kalau jawabannya "Tidak, tergantung bahasa atau konteks" — pakai `$t` dengan kamus terstruktur.
Dan ada satu pertimbangan lagi yang sering luput: `$t` bersifat reaktif. Jika kamu menyimpan locale di state aplikasi, perubahan locale akan memicu render ulang hanya pada elemen yang menggunakan `$t`, bukan pada seluruh halaman.

---

## raa-animation.js — Gerak yang Terkendali

Animasi dalam RaaJS bukan lapisan dekorasi yang ditumpuk di atas logika. Ia adalah respons terukur terhadap perubahan state yang terjadi di DOM. Ketika kamu menempelkan `raa-animation:enter`, framework mendeteksi elemen masuk ke viewport atau kondisi `raa-flow:if` berubah, lalu memicu Web Animations API dengan konfigurasi yang sudah disiapkan. Ini memberikan pergerakan yang halus tanpa membebani scheduler reaktif utama.

Ketika elemen muncul, ia meluncur. Ketika elemen hilang, ia memudar. Ketika elemen perlu berulang, ia berdenyut. Semuanya terikat pada siklus hidup elemen, tanpa memori yang menggantung.

### Direktif Deklaratif & Preset Bawaan
RaaJS menyediakan empat pemicu animasi utama dan delapan preset yang sudah dioptimalkan untuk performa browser modern.

| Pemicu | Fungsi | Contoh |
|--------|--------|--------|
| `raa-animation:enter` | Animasi saat elemen ditambahkan ke DOM atau `raa-flow:if` true | `raa-animation:enter="fade-up"` |
| `raa-animation:leave` | Animasi saat elemen dihapus atau `raa-flow:if` false | `raa-animation:leave="fade-down"` |
| `raa-animation:scroll` | Animasi saat elemen masuk viewport (IntersectionObserver) | `raa-animation:scroll="scale-in"` |
| `raa-animation:loop` | Animasi berulang tanpa henti | `raa-animation:loop="pulse"` |

Preset bawaan: `fade-up`, `fade-down`, `fade-left`, `fade-right`, `fade-in`, `scale-in`, `zoom-in`, `flip-up`.

```html
<!-- Muncul dari bawah, hilang ke atas -->
<template raa-flow:if="tampil">
  <div raa-animation:enter="fade-up" raa-animation:leave="fade-down">
    Konten rahasia
  </div>
</template>

<!-- Animasi saat scroll ke elemen -->
<div raa-animation:scroll="scale-in" raa-animation:loop="pulse">
  Ikon perhatian
</div>
```

### Kontrol Lanjutan via JavaScript API
Kadang kamu perlu memicu animasi dari method, atau menggerakkan sekumpulan elemen secara berurutan. API statis `RaaAnimation` memberi kontrol itu tanpa memutus koneksi deklaratif.

```javascript
methods: {
  tampilkanNotifikasi() {
    // Mainkan animasi 'enter' kustom pada elemen spesifik
    RaaAnimation.play(this.$refs.toast, 'enter', { duration: 300 });
  },
  susunKartu() {
    // Terapkan animasi stagger ke daftar elemen anak
    RaaAnimation.applyGroup(this.$refs.grid, this.$refs.grid.children, {
      mode: 'stagger',
      stagger: 80,
      animation: 'fade-up',
      duration: 400
    });
  }
}
```

Karena ia membongkar dan membangun ulang komposisi visual, ada biaya di setiap transisi — tapi investasi itu sepadan jika kamu membutuhkan umpan balik instan yang mengurangi kebingungan pengguna.

**Pertanyaan paling simpel:** Apakah gerakan ini sekadar hiasan, atau membantu pengguna memahami perubahan state?
Kalau jawabannya "Hiasan" — kurangi durasi di bawah 200ms, atau hilangkan.
Kalau jawabannya "Membantu pemahaman" — pakai preset `fade` atau `scale` dengan durasi 300–400ms.
Dan ada satu pertimbangan lagi yang sering luput: jangan pernah menganimasi properti layout (`width`, `height`, `top`, `left`). Selalu gunakan `transform` dan `opacity` agar browser tetap bekerja di compositing layer, bukan main thread.

---

## Aturan Emas yang Tidak Boleh Dilanggar

Interaksi visual dan terjemahan terdengar ringan sampai kamu memaksakan keduanya berjalan di luar konteks desain.

### ❌ Menganimasi Properti yang Memicu Layout Reflow
```css
/* ❌ Salah — memaksa browser menghitung ulang layout setiap frame */
.animasi-salah { animation: geser 0.5s; }
@keyframes geser { to { left: 100px; } }
```
Gunakan `transform: translateX(100px)` atau `translateY` sebagai gantinya. Ini memindahkan elemen di GPU layer tanpa memicu reflow, menjaga frame rate tetap stabil di perangkat kelas menengah.

### ❌ Menyimpan Teks Terjemahan Langsung di State Aplikasi
```javascript
// ❌ Salah — mencampur data bisnis dengan string UI
state: {
  judulHalaman: 'Selamat Datang', // Akan jadi duplikat saat ganti bahasa
  user: { nama: 'Budi' }
}
```
State harus menyimpan data mentah. Tampilan string adalah tanggung jawab `$t`. Jika kamu menyimpan teks UI di state, kamu harus membersihkan seluruh state saat locale berubah. Itu adalah beban kerja yang tidak perlu.

### ❌ Menumpuk Animasi Loop dengan State yang Sering Berubah
```html
<!-- ❌ Berisiko — loop animasi bertabrakan dengan update reaktif cepat -->
<div raa-animation:loop="pulse" raa-bind:style="{ opacity: isLoading }">
```
Loop berjalan di timeline browser independen. Jika state yang mengontrol elemen berubah cepat, timeline bisa tersentak. Gunakan `raa-animation:loop` hanya untuk elemen statis yang tidak bergantung pada update state frekuensi tinggi.

---

## Contoh Lengkap: Portal Konten Multibahasa

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Demo i18n & Animasi — RaaJS</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 680px; margin: 40px auto; padding: 0 16px; color: #0f172a; background: #f8fafc; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 16px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .btn-locale { padding: 6px 12px; border: 1px solid #cbd5e1; background: #fff; border-radius: 6px; cursor: pointer; font-size: 13px; }
    .btn-locale.aktif { background: #2563eb; color: #fff; border-color: #2563eb; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .hijau { background: #dcfce7; color: #166534; }
    .list-item { padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
    .list-item:last-child { border-bottom: none; }
    .empty-state { text-align: center; padding: 24px 0; color: #64748b; }
  </style>
</head>
<body>

  <div raa-core:app="portalKonten">
    <div class="header">
      <h1 raa-bind:text="$t('judulPortal')"></h1>
      <div>
        <button class="btn-locale" 
                raa-bind:class="{ aktif: locale === 'id' }" 
                raa-on:click="setLocale('id')">ID</button>
        <button class="btn-locale" 
                raa-bind:class="{ aktif: locale === 'en' }" 
                raa-on:click="setLocale('en')">EN</button>
      </div>
    </div>

    <div class="card" raa-animation:scroll="fade-up">
      <h3 raa-bind:text="$t('statistik')"></h3>
      <p raa-bind:text="$t('totalArtikel', { count: artikel.length })"></p>
      <div style="margin-top: 16px; display: flex; gap: 8px;">
        <span class="badge hijau" raa-animation:enter="scale-in" raa-flow:if="artikel.length > 0">
          <span raa-bind:text="$t('statusAktif')"></span>
        </span>
      </div>
    </div>

    <div class="card" raa-animation:scroll="fade-up">
      <h3 raa-bind:text="$t('daftarKonten')"></h3>
      
      <!-- Kontainer kosong dengan animasi -->
      <div class="empty-state" 
           raa-animation:enter="fade-in" 
           raa-flow:if="artikel.length === 0"
           raa-bind:text="$t('belumAda')"></div>

      <!-- Loop dengan enter/leave -->
      <template raa-flow:for="item in artikel" raa-key="item.id">
        <div class="list-item" raa-animation:enter="fade-up" raa-animation:leave="fade-down">
          <strong raa-bind:text="item.judul"></strong>
          <span style="float: right; color: #94a3b8; font-size: 13px;" raa-bind:text="item.kategori"></span>
        </div>
      </template>
    </div>

    <button style="width: 100%; padding: 12px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; margin-top: 8px;"
            raa-on:click="tambahArtikel()">
      <span raa-bind:text="$t('tambahArtikel')"></span>
    </button>
  </div>

  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/extensions/raa-i18n.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/extensions/raa-animation.js"></script>
  <script>
    // ✅ Benar — daftarkan kamus sebelum RaaJS.define
    RaaI18n.setTranslations('id', {
      judulPortal: 'Portal Konten',
      statistik: 'Statistik',
      totalArtikel: 'Total: {count} artikel',
      statusAktif: 'Sistem Berjalan',
      daftarKonten: 'Daftar Artikel',
      belumAda: 'Belum ada artikel. Tambahkan sekarang.',
      tambahArtikel: 'Tambah Artikel Baru'
    });

    RaaI18n.setTranslations('en', {
      judulPortal: 'Content Portal',
      statistik: 'Statistics',
      totalArtikel: 'Total: {count} articles',
      statusAktif: 'System Active',
      daftarKonten: 'Article List',
      belumAda: 'No articles yet. Add one now.',
      tambahArtikel: 'Add New Article'
    });

    RaaJS.define('portalKonten', () => ({
      state: {
        locale: 'id',
        artikel: [
          { id: 1, judul: 'Panduan Memulai RaaJS', kategori: 'Tutorial' },
          { id: 2, judul: 'Optimasi Performa State', kategori: 'Advanced' }
        ]
      },
      methods: {
        setLocale(lang) {
          this.locale = lang;
          // ✅ Benar — update locale plugin secara eksplisit
          RaaI18n.setLocale(lang);
        },
        tambahArtikel() {
          const id = Date.now();
          this.artikel.push({ 
            id, 
            judul: 'Artikel Baru #' + this.artikel.length, 
            kategori: 'Umum' 
          });
        }
      }
    }));
  </script>

</body>
</html>
```

---

*Dokumentasi ini adalah bagian dari RaaJS v3.1.0 Official Docs. Kontribusi, koreksi, dan ide perbaikan disambut hangat di repositori resmi.*
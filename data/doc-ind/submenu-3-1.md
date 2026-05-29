# Direktif Root & Setup

> **Versi:** RaaJS v3.1.0 "Data Liberation"
> Sebelum satu pun binding bisa bereaksi, sebelum satu pun loop bisa berjalan, ada tiga direktif yang harus kamu kenali lebih dulu. Mereka adalah fondasi — yang meletakkan bata pertama sebelum rumah dibangun.

---

## Kenapa Ini Penting?

Bayangkan kamu baru saja tiba di sebuah kota asing. Hal pertama yang kamu lakukan bukan langsung belanja atau makan — tapi mencari tahu di mana kamu berada, di mana hotel kamu, dan apa nomor telepon darurat yang perlu kamu tahu.

Direktif setup di RaaJS bekerja persis seperti itu. Mereka adalah langkah-langkah orientasi pertama yang memberi tahu RaaJS: *"Hei, ini wilayah kekuasaanmu. Ini datanya. Ini cara menghubungi elemen-elemen di dalamnya."*

Tanpa mereka, tidak ada yang bisa bekerja. Dengan mereka, segalanya menjadi mungkin.

---

## `raa-core:app` — Menanam Bendera di Tanah HTML

### Apa yang Dilakukannya

`raa-core:app` adalah direktif yang paling pertama perlu kamu tulis. Ia mendeklarasikan sebuah elemen HTML sebagai **root** — wilayah kekuasaan penuh satu aplikasi RaaJS. Semua direktif lain yang ada di dalam elemen ini akan aktif, reaktif, dan terhubung ke state yang sama.

Di luar root ini? RaaJS tidak peduli. Ia tidak akan menyentuh satu pun elemen yang berada di luar batas yang kamu tetapkan.

### Sintaks

```html
<div raa-core:app="namaAplikasi">
  <!-- Semua yang ada di sini dikelola RaaJS -->
</div>
```

Nilai dari atribut ini — `"namaAplikasi"` — harus **sama persis** dengan nama yang kamu daftarkan via `RaaJS.define()`. Case-sensitive. Satu karakter beda, tidak akan terhubung.

```javascript
// Nama di sini...
RaaJS.define('namaAplikasi', () => ({
  state: { ... }
}));

// ...harus cocok persis dengan nama di sini:
// <div raa-core:app="namaAplikasi">
```

### Lebih dari Satu Aplikasi di Satu Halaman

Ini salah satu hal yang bikin RaaJS menarik. Kamu bisa punya beberapa `raa-core:app` di halaman yang sama, dan masing-masing berjalan **terisolasi** satu sama lain — punya state sendiri, punya method sendiri, tidak saling mengganggu.

```html
<!-- Aplikasi pertama: navigasi -->
<nav raa-core:app="navApp">
  <span raa-bind:text="namaUser"></span>
  <button raa-on:click="logout()">Keluar</button>
</nav>

<!-- Aplikasi kedua: konten utama -->
<main raa-core:app="contentApp">
  <p raa-bind:text="artikel.judul"></p>
</main>

<!-- Aplikasi ketiga: sidebar rekomendasi -->
<aside raa-core:app="rekomendasiApp">
  <template raa-flow:for="item in rekomendasi" raa-key="item.id">
    <div raa-bind:text="item.judul"></div>
  </template>
</aside>
```

Ketiga aplikasi ini hidup berdampingan di halaman yang sama, tapi state `namaUser` di `navApp` tidak bisa diakses dari `contentApp`, dan sebaliknya. Murni terisolasi.

> **Kalau butuh berbagi data antar aplikasi**, gunakan `$store` (Global Store) yang sudah kita bahas di ***State Management***. Itu memang tugasnya.

### Elemen Apa yang Bisa Jadi Root?

Secara teknis, elemen HTML apa pun bisa. Tapi ada konvensi yang baik untuk diikuti:

```html
<!-- ✅ Paling umum — div sebagai container -->
<div raa-core:app="app">

<!-- ✅ Semantik — section, main, article juga oke -->
<section raa-core:app="artikelApp">
<main raa-core:app="dashboardApp">

<!-- ✅ Bahkan body bisa, jika aplikasimu memang satu halaman penuh -->
<body raa-core:app="spaApp">

<!-- ⚠️ Bisa, tapi tidak disarankan — elemen inline seperti span, p -->
<span raa-core:app="kecilApp">
```

### Apa yang Terjadi Saat RaaJS Menemukan `raa-core:app`

Ini urutan kejadian yang berlangsung begitu RaaJS mendeteksi atribut ini:

1. Hook `beforeCompile` dijalankan — semua plugin yang peduli dengan event ini bereaksi
2. Objek `state` dari factory dibungkus dengan JavaScript Proxy
3. State dari `localStorage` dimuat jika ada `raa-eco:persist`
4. Semua `methods` diikat ke state
5. Seluruh subtree di-*scan* dalam dua pass: refs + events dulu, lalu binding reaktif
6. Network dan router di-*setup* jika ada
7. Hook `afterCompile` dijalankan — plugin menyuntikkan `$http`, `$bus`, `$t`, dll.
8. `init()` dipanggil via `queueMicrotask` — aplikasi sepenuhnya hidup

---

## `raa-core:init` — Bicara Langsung Saat Pertama Kali Bertemu

### Apa yang Dilakukannya

`raa-core:init` mengevaluasi sebuah ekspresi **tepat sekali** — pada saat elemen tersebut pertama kali dikompilasi oleh RaaJS. Setelah itu, ia tidak pernah berjalan lagi, sekali pun state berubah berkali-kali.

Ini bukan direktif reaktif. Ini direktif inisialisasi. Bedanya krusial.

### Sintaks

```html
<div raa-core:app="app" raa-core:init="ekspresi">
```

Ekspresi bisa berupa apa saja yang valid di bahasa ekspresi RaaJS: memanggil method, mengakses `$state`, atau bahkan `Object.assign`.

### Kasus Penggunaan 1: Inisialisasi State Inline

Sejak v3.1.0, cara paling idiomatis untuk mendeklarasikan state dari HTML adalah menggunakan `raa-core:init` bersama `Object.assign`:

```html
<!-- Deklarasikan state tanpa perlu RaaJS.define -->
<div raa-core:app="profilApp"
     raa-core:init="Object.assign($state, { nama: 'Budi', usia: 28, aktif: true })">
  <h2 raa-bind:text="nama"></h2>
  <p raa-bind:text="'Usia: ' + usia + ' tahun'"></p>
</div>
```

Pola ini sangat berguna untuk komponen kecil yang tidak memerlukan `RaaJS.define` penuh — prototipe cepat, widget sederhana, atau island yang berdiri sendiri.

### Kasus Penggunaan 2: Memanggil Method Startup

Jika aplikasimu membutuhkan sesuatu yang lebih dari sekadar assignment nilai — misalnya fetch data, setup timer, atau cek kondisi awal — `raa-core:init` bisa memanggil method:

```html
<div raa-core:app="dashboardApp" raa-core:init="muatData()">
  <template raa-flow:if="sedangMuat">
    <p>Memuat dashboard...</p>
  </template>
  <template raa-flow:if="!sedangMuat">
    <!-- Konten dashboard -->
  </template>
</div>

<script>
  RaaJS.define('dashboardApp', () => ({
    state: { sedangMuat: true, data: null },
    methods: {
      async muatData() {
        const res = await fetch('/api/dashboard');
        this.data = await res.json();
        this.sedangMuat = false;
      }
    }
  }));
</script>
```

### Kasus Penggunaan 3: `raa-core:init` pada Elemen Di Dalam Root

`raa-core:init` tidak harus ada di elemen root. Ia bisa diletakkan di elemen mana pun di dalam root, dan akan berjalan saat elemen tersebut dikompilasi:

```html
<div raa-core:app="app">

  <!-- Init di level root -->
  <div raa-core:init="log('Root container siap')">

    <!-- Init di elemen yang lebih dalam -->
    <section raa-core:init="setupSection()">
      <p>Konten seksi ini</p>
    </section>

  </div>
</div>
```

Ini berguna ketika kamu punya beberapa bagian halaman yang masing-masing perlu diinisialisasi secara independen.

### Perbedaan `raa-core:init` vs `init()` di Factory

Keduanya untuk inisialisasi, tapi punya timing dan cakupan yang berbeda:

`init()` di factory berjalan **setelah seluruh root selesai dikompilasi** — semua elemen sudah diproses, semua effects sudah dibuat, semua plugin sudah menyuntikkan API-nya. Ini adalah titik paling "aman" untuk memulai logika startup.

`raa-core:init` berjalan **saat elemen itu sendiri dikompilasi**, dalam urutan yang sama seperti elemen-elemen di-*scan*. Ini lebih awal, dan ada kemungkinan beberapa bagian halaman belum selesai dikompilasi saat itu.

Untuk logika startup global — fetch data pertama, cek autentikasi, setup timer — gunakan `init()` di factory. Untuk inisialisasi yang spesifik per-elemen atau per-komponen, `raa-core:init` adalah pilihan yang tepat.

---

## `raa-core:ref` — Beri Nama, Bisa Dipanggil Kapan Saja

### Apa yang Dilakukannya

`raa-core:ref` adalah cara kamu memberi **nama referensi** pada sebuah elemen DOM. Setelah diberi nama, elemen tersebut bisa diakses kapan saja dari dalam method melalui `this.$refs.namaReferensi`.

Ini adalah jembatan antara dunia deklaratif RaaJS dan dunia imperatif JavaScript murni. Ada kalanya kamu perlu "menyentuh" elemen secara langsung — fokus ke input, membaca dimensi elemen, memanggil method library pihak ketiga — dan untuk itulah refs ada.

### Sintaks

```html
<input type="email" raa-core:ref="emailInput">
<canvas raa-core:ref="grafik"></canvas>
<div raa-core:ref="scrollContainer"></div>
```

### Mengakses Ref dari Method

```javascript
RaaJS.define('formApp', () => ({
  state: { email: '' },
  methods: {
    fokusEmail() {
      this.$refs.emailInput.focus();
    },
    pilihSemuaTeks() {
      this.$refs.emailInput.select();
    },
    inisialisasiGrafik() {
      const canvas = this.$refs.grafik;
      const ctx = canvas.getContext('2d');
      // Gambar sesuatu dengan ctx...
    },
    scrollKeBawah() {
      const el = this.$refs.scrollContainer;
      el.scrollTop = el.scrollHeight;
    }
  }
}));
```

### Ref Dalam Konteks `raa-flow:if`

Perlu diingat: refs **hanya tersedia saat elemen ada di DOM**. Jika elemen tersebut berada di dalam `raa-flow:if` dan kondisinya `false`, elemen tidak ada di DOM, dan `this.$refs.namaRef` akan bernilai `undefined`.

```html
<template raa-flow:if="tampilModal">
  <div class="modal">
    <!-- Ref ini hanya ada saat tampilModal === true -->
    <input raa-core:ref="inputModal" type="text">
  </div>
</template>
```

```javascript
methods: {
  async bukaModal() {
    this.tampilModal = true;

    // ⚠️ Belum aman di sini — DOM belum diperbarui
    // this.$refs.inputModal.focus(); // undefined!

    // ✅ Tunggu nextTick — DOM sudah diperbarui, ref sudah tersedia
    await window.Raa.nextTick();
    this.$refs.inputModal.focus(); // 👍
  }
}
```

Pola `this.tampilSesuatu = true` → `await nextTick()` → akses ref adalah kombinasi yang sangat sering kamu temui dalam kode RaaJS yang idiomatis.

### Ref dengan Nama yang Sama pada Beberapa Elemen

Kalau lebih dari satu elemen menggunakan ref dengan nama yang sama, RaaJS tidak akan mengambil yang pertama atau yang terakhir — ia mengumpulkan semuanya ke dalam sebuah **array**.

```html
<div raa-core:app="formApp">
  <input raa-core:ref="inputField" type="text" placeholder="Nama">
  <input raa-core:ref="inputField" type="email" placeholder="Email">
  <input raa-core:ref="inputField" type="tel" placeholder="Telepon">
</div>
```

```javascript
methods: {
  validasiSemua() {
    // this.$refs.inputField adalah array berisi 3 elemen input
    const semuaValid = this.$refs.inputField.every(input => input.value.trim() !== '');
    return semuaValid;
  },
  fokusKosong() {
    const inputKosong = this.$refs.inputField.find(input => input.value.trim() === '');
    if (inputKosong) inputKosong.focus();
  }
}
```

Ini sangat berguna untuk form yang punya banyak field sejenis, atau untuk mengelola grup elemen secara kolektif.

---

## Memadukan Ketiganya: Contoh Nyata

Berikut adalah contoh yang menggunakan ketiga direktif setup ini secara bersamaan dalam satu aplikasi yang bermakna — sebuah form login yang lengkap:

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Login — RaaJS</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: sans-serif; background: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .form-card { background: white; border-radius: 16px; padding: 32px; width: 100%; max-width: 400px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    h2 { margin: 0 0 4px; font-size: 22px; }
    p.sub { margin: 0 0 24px; color: #64748b; font-size: 13px; }
    label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px; margin-top: 16px; }
    input { width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; font-size: 14px; transition: border-color 0.2s; }
    input:focus { outline: none; border-color: #3b82f6; }
    button { width: 100%; background: #3b82f6; color: white; border: none; border-radius: 8px; padding: 12px; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 20px; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 12px; font-size: 13px; margin-top: 12px; }
    .success { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 12px; font-size: 13px; margin-top: 12px; }
  </style>
</head>
<body>

  <!--
    raa-core:app   → Deklarasi root, mengikat ke 'loginApp'
    raa-core:init  → Fokus otomatis ke input email saat halaman dimuat
  -->
  <div raa-core:app="loginApp" raa-core:init="fokusAwal()">

    <div class="form-card">
      <h2>Selamat Datang 👋</h2>
      <p class="sub">Masuk ke akun RaaJS Studio-mu.</p>

      <label>Alamat Email</label>
      <!--
        raa-core:ref → Kita beri nama 'inputEmail'
                       agar bisa difokus dari method
      -->
      <input
        type="email"
        raa-core:ref="inputEmail"
        raa-bind:model="email"
        placeholder="nama@contoh.com"
        raa-on:keydown.enter="login()">

      <label>Kata Sandi</label>
      <!--
        raa-core:ref → Kita beri nama 'inputSandi'
      -->
      <input
        type="password"
        raa-core:ref="inputSandi"
        raa-bind:model="sandi"
        placeholder="Minimal 8 karakter"
        raa-on:keydown.enter="login()">

      <button
        raa-on:click="login()"
        raa-ux:disable="sedangProses || !email || !sandi">
        <span raa-bind:text="sedangProses ? 'Memverifikasi...' : 'Masuk'"></span>
      </button>

      <template raa-flow:if="pesanError">
        <div class="error" raa-bind:text="pesanError"></div>
      </template>

      <template raa-flow:if="berhasil">
        <div class="success">Login berhasil! Mengalihkan...</div>
      </template>
    </div>

  </div>

  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>
  <script>
    RaaJS.define('loginApp', () => ({
      state: {
        email: '',
        sandi: '',
        sedangProses: false,
        pesanError: '',
        berhasil: false
      },

      methods: {
        // Dipanggil dari raa-core:init — fokus ke input email saat halaman dibuka
        fokusAwal() {
          // $refs sudah tersedia saat init dipanggil karena pass 1 sudah selesai
          if (this.$refs.inputEmail) {
            this.$refs.inputEmail.focus();
          }
        },

        async login() {
          // Validasi sisi klien
          if (!this.email.includes('@')) {
            this.pesanError = 'Format email tidak valid.';
            this.$refs.inputEmail.focus(); // Gunakan ref untuk arahkan user
            return;
          }
          if (this.sandi.length < 8) {
            this.pesanError = 'Kata sandi minimal 8 karakter.';
            this.$refs.inputSandi.focus(); // Dan di sini juga
            return;
          }

          this.sedangProses = true;
          this.pesanError = '';

          // Simulasi API call
          await new Promise(r => setTimeout(r, 1500));

          // Simulasi sukses
          if (this.email === 'demo@raajs.dev' && this.sandi === '12345678') {
            this.berhasil = true;
            setTimeout(() => {
              alert('Selamat datang di RaaJS Studio!');
            }, 500);
          } else {
            this.pesanError = 'Email atau kata sandi tidak cocok. Coba lagi.';
            this.$refs.inputSandi.value = '';
            this.sandi = '';
            this.$refs.inputSandi.focus();
          }

          this.sedangProses = false;
        }
      }
    }));
  </script>

</body>
</html>
```

Perhatikan bagaimana ketiga direktif bekerja bersama di sini:

`raa-core:app` menetapkan wilayah kekuasaan dan menghubungkan HTML ke factory `loginApp`. `raa-core:init` memastikan kursor langsung ada di input email begitu halaman dimuat — pengalaman pengguna yang kecil tapi bermakna. `raa-core:ref` memungkinkan method untuk "menyentuh" elemen input secara langsung — mengarahkan fokus ke field yang salah, mengosongkan nilai sandi, hal-hal yang tidak bisa dilakukan hanya dengan state reaktif.

---

## Hal-hal yang Perlu Diingat

**Tentang `raa-core:app`:**
- Nama harus cocok persis dengan `RaaJS.define()` — case-sensitive
- Satu elemen hanya bisa punya satu `raa-core:app`
- Island bersarang di dalam root menggunakan `raa-eco:island`, bukan `raa-core:app` lagi
- RaaJS tidak mengkompilasi elemen yang ada di dalam island orang lain

**Tentang `raa-core:init`:**
- Hanya berjalan sekali — bukan direktif reaktif
- Tidak ada keuntungan menulis ekspresi yang bergantung pada state di sini, karena tidak akan berjalan ulang saat state berubah
- Untuk logika startup utama aplikasi, `init()` di factory lebih direkomendasikan

**Tentang `raa-core:ref`:**
- Refs hanya tersedia setelah elemen dikompilasi — jangan akses `$refs` sebelum kompilasi selesai
- Elemen di dalam `raa-flow:if` yang kondisinya `false` tidak ada di DOM, sehingga refs-nya `undefined`
- Gunakan `await window.Raa.nextTick()` sebelum mengakses ref elemen yang baru saja di-*toggle* menjadi `true`

---

*Dokumentasi ini adalah bagian dari RaaJS v3.1.0 Official Docs. Kontribusi dan koreksi disambut di repositori resmi.*

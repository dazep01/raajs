# RaaJS v2.2: Seni Reaktivitas Minimalis
```
    ____              _______
   / __ \____ _____  / / ___/
  / /_/ / __ `/ __ `/ /\__ \ 
 / _, _/ /_/ / /_/ / /___/ / 
/_/ |_|\__,_/\__,_/_//____/  v2.2
                             
Reaktif. Deklaratif. Mengutamakan HTML.
Inti frontend mungil dengan pola pikir ekstensibel yang cerdas.
```

🌐 Bahasa:
- [English](./README.md)
- [Bahasa Indonesia](./README.id-ID.md)

---

## 🇮🇩 Manifestasi RaaJS

### Apa itu RaaJS?
**RaaJS v2.2** adalah *micro-framework* frontend yang memuja *HTML-first architecture*, *reactive state*, dan *declarative directives*. Di versi ini, kami memperkenalkan standar baru yang jauh lebih disiplin dan terstruktur melalui **Namespaced Directives**: `raa-core`, `raa-bind`, `raa-flow`, dan `raa-on`.

RaaJS diciptakan khusus untuk kamu yang ingin membangun antarmuka (*UI*) interaktif yang tangguh tanpa perlu terjebak dalam drama *toolchain* atau proses *build* yang melelahkan.

### Filosofi: Sepeda Balap vs Kapal Perang
Jika ekosistem *frontend* modern saat ini terasa seperti **membawa kapal perang besar hanya untuk mengantarkan sepotong roti** ke seberang jalan—megah dan penuh senjata, namun luar biasa berat serta melelahkan—maka RaaJS memilih jalan yang berbeda.

> RaaJS adalah **sepeda balap karbon yang gesit, efisien, dan ringkas**. Ia tidak dirancang untuk memenangkan lomba kemegahan fitur, melainkan untuk memastikan rotimu sampai di tujuan tepat waktu dengan energi yang minimal. Keterbacaan, ketenangan, dan kedaulatan penuh atas dokumen HTML asli adalah nilai tertinggi yang kami jaga.

### Fitur Unggulan v2.2
* **Zero Build Fatigue:** Lupakan konfigurasi bundler yang rumit. Cukup panggil skrip lewat peramban, tulis HTML, dan aplikasi langsung berjalan.
* **Island Architecture (`raa-eco:island`):** Isolasi bagian aplikasi tertentu menjadi wilayah *state* yang mandiri dan terisolasi. Aplikasi besar tetap terasa ringan karena hidrasi yang parsial.
* **Built-in XSS Protection:** Keamanan adalah prioritas utama. Setiap *data binding* teks maupun HTML diproteksi secara ketat menggunakan mekanisme sanitasi otomatis.
* **Advanced Priority Scheduler:** Mesin reaktivitas internal menggunakan sistem *batching* pintar berbasis antrean prioritas. DOM hanya diperbarui di saat yang tepat untuk performa tinggi tanpa *lag*.

---

## 📦 Instalasi via CDN

RaaJS dirancang untuk langsung digunakan. Cukup tambahkan tag `<script>` ke dalam HTML Anda—tanpa npm, tanpa webpack, tanpa ribet.

### 🔗 Core Engine + Extensions (Rekomendasi Lengkap)

```html
<!-- Core Engine: Jantung dan otak reaktivitas -->
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@2.2.0/engine/raa.min.js"></script>

<!-- Extensions: Superpower tambahan sesuai kebutuhan -->

<!-- 1. Data & Logic Extensions -->
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@2.2.0/engine/extensions/raa-http.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@2.2.0/engine/extensions/raa-eventbus.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@2.2.0/engine/extensions/raa-computed-watch.min.js"></script>

<!-- 2. UI & Experience Extensions -->
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@2.2.0/engine/extensions/raa-animation.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@2.2.0/engine/extensions/raa-ui.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@2.2.0/engine/extensions/raa-validate.min.js"></script>

<!-- 3. Structure, Scaling & Debugging -->
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@2.2.0/engine/extensions/raa-template.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@2.2.0/engine/extensions/raa-i18n.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@2.2.0/engine/extensions/raa-devtools.min.js"></script>
```

### 🎯 Opsi Instalasi Lainnya

| Kebutuhan | Snippet |
|-----------|---------|
| **Hanya Core** (untuk proyek minimalis) | `<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@2.2.0/engine/raa.min.js"></script>` |
| **Core + HTTP + Validate** (form & API) | Tambahkan `raa-http.min.js` dan `raa-validate.min.js` setelah core |
| **Core + UI + Animation** (interaksi visual) | Tambahkan `raa-ui.min.js` dan `raa-animation.min.js` setelah core |
| **Versi Development** (dengan sourcemap) | Ganti `raa.min.js` → `raa.js` (tanpa `.min`) |

> 💡 **Tips Versi:** 
> - Gunakan `@2.2.0` untuk mengunci versi tertentu (disarankan untuk produksi).
> - Gunakan `@latest` jika ingin selalu mendapatkan pembaruan otomatis (hati-hati dengan breaking changes).
> - File `.min.js` sudah dikompresi untuk produksi; gunakan file tanpa `.min` hanya saat development untuk debugging yang lebih mudah.

### 🌍 Browser Support
RaaJS v2.2 mendukung browser modern dengan ES6+ support:
- ✅ Chrome 49+
- ✅ Firefox 18+
- ✅ Safari 10+
- ✅ Edge 49+
- ✅ Opera 36+
- ✅ Android WebView & Chrome for Android
- ✅ iOS Safari 10+

> ❌ Internet Explorer — TIDAK DIDUKUNG
> *IE tidak memiliki dukungan Proxy. RaaJS memilih tidak menggunakan polyfill berat demi menjaga ukuran "sepeda karbon" tetap ringan dan performa tetap tinggi. Saatnya move on.*

---

## 🛠️ Panduan Sintaks v2.2 (Standar Baru)

Di versi 2.2, kami mendepresiasi sintaks lama dan beralih penuh ke arsitektur *Namespaced*. Atribut diatur berdasarkan rumpun tugasnya agar tidak membingungkan peramban maupun pengembang.

| Namespace Direktif | Tujuan | Contoh Teknis |
|---|---|---|
| `raa-core:*` | Inisialisasi aplikasi, *data seed*, & pemetaan elemen | `raa-core:app="myApp"`<br>`raa-core:ref="button"` |
| `raa-bind:*` | Pengikatan data ke UI (satu arah atau dua arah) | `raa-bind:text="count"`<br>`raa-bind:model="username"` |
| `raa-flow:*` | Tata letak kondisional & manajemen perulangan deklaratif | `raa-flow:if="isAdmin"`<br>`raa-flow:for="item in items"` |
| `raa-on:*` | Pendaftaran *event* dengan modifier deklaratif | `raa-on:click.prevent="submit"` |
| `raa-eco:*` | Ekstensi arsitektur, stabilitas, & *global state* | `raa-eco:island`<br>`raa-eco:persist` |

---

## ⚡ Langkah Cepat Memulai

### 1. Definisikan Aplikasimu (JavaScript)
Daftarkan logika data (*state*) dan fungsi (*methods*) aplikasimu secara bersih menggunakan `RaaJS.define`.

```javascript
// app.js
RaaJS.define('counterApp', () => ({
  state: {
    count: 0
  },
  methods: {
    increment() {
      this.count++;
    }
  }
}));
```

### 2. Rangkai HTML-mu
Tulis instruksi deklaratif langsung di elemen HTML kamu. Jujur, intuitif, dan ekspresif.

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Counter App - RaaJS</title>
</head>
<body>
  <div raa-core:app="counterApp">
    <!-- Data Binding otomatis terproteksi dari XSS -->
    <h1 raa-bind:text="'Total Klik: ' + count"></h1>
    
    <!-- Event Listener dengan metode internal -->
    <button raa-on:click="increment">Tambah Angka</button>
    
    <!-- Control Flow menggunakan elemen template asli -->
    <template raa-flow:if="count > 10">
      <p>Wah, sudah banyak klik yang terkumpul! 🎉</p>
    </template>
  </div>

  <!-- Load Core Engine -->
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@2.2.0/engine/raa.min.js"></script>
  <!-- Load App Definition -->
  <script src="app.js"></script>
</body>
</html>
```

---

## 📖 Kamus Instruksi Resmi

Anggap *directives* ini seperti instruksi pada alat masak pintar; kamu hanya perlu memasang atributnya di HTML, dan biarkan "mesin" RaaJS yang bekerja di dapur peramban.

### 1. RaaJS Core Directives (Jantung Sistem)
Disediakan langsung oleh `raa.js` untuk mengontrol siklus hidup dasar aplikasi.

* **`raa-core:app`**: Menentukan *Root* atau batas absolut wilayah kekuasaan sebuah aplikasi RaaJS.
* **`raa-core:data`**: Menyisipkan data mentah atau *state* awal berbentuk objek literal langsung dari HTML.
* **`raa-core:ref`**: Memberi label unik pada elemen agar bisa diakses langsung via kode JavaScript lewat `$refs`.
* **`raa-core:init`**: Mengeksekusi ekspresi logika instan tepat saat elemen tersebut selesai dirakit pertama kali.

### 2. Data Binding & Flow Control (Aliran Reaktivitas)
Instruksi sakral untuk menghubungkan dunia data dengan dunia visual peramban.

* **`raa-bind:text`**: Merender teks biasa ke dalam elemen (sangat aman dari ancaman XSS).
* **`raa-bind:html`**: Menyuntikkan struktur HTML dinamis yang telah melewati proses sanitasi otomatis.
* **`raa-bind:model`**: Sinkronisasi dua arah (*two-way binding*) instan antara input formulir dengan properti *state*.
* **`raa-bind:class`**: Menambah atau menghapus kelas CSS secara dinamis berdasarkan kalkulasi boolean.
* **`raa-bind:style`**: Memanipulasi gaya inline CSS elemen secara reaktif.
* **`raa-bind:[attribute]`**: Menghubungkan semua atribut native (seperti `src`, `href`, `disabled`, `placeholder`) ke dalam data.
* **`raa-flow:show`**: Menyembunyikan visual elemen melalui CSS `display: none` tanpa membongkar strukturnya.
* **`raa-flow:if`**: Benar-benar menghapus atau memasukkan elemen ke dalam DOM (khusus dipasang pada tag `<template>`).
* **`raa-flow:for`**: Melakukan perulangan daftar data (*list rendering*) secara presisi menggunakan tag `<template>`.
* **`raa-on:[event]`**: Mendengarkan *event* bawaan browser (seperti `click`, `submit`, `input`) dilengkapi *modifier* taktis seperti `.prevent` atau `.stop`.

### 3. Ecosystem & UX Enhancements (Fitur Spesialis)
Direktif bawaan sistem ekosistem inti untuk stabilitas aplikasi dan peningkatan fungsionalitas visual.

* **`raa-eco:island`**: Menciptakan sebuah *Island*—wilayah dengan *state* terisolasi dan mandiri di tengah aplikasi besar.
* **`raa-eco:persist`**: Menyimpan dan memulihkan data *state* secara otomatis dari `localStorage`.
* **`raa-eco:auth`**: Mengatur hak akses visibilitas elemen secara reaktif berdasarkan status login pengguna.
* **`raa-ux:focus`**: Memberikan fokus kursor otomatis (*auto-focus*) pada elemen saat ia pertama kali muncul di layar.
* **`raa-ux:loading`**: Menyuntikkan status visual memuat data serta memasangkan atribut aksesibilitas `aria-busy="true"`.
* **`raa-ux:disable`**: Menonaktifkan fungsionalitas elemen interaktif secara reaktif mengikuti kondisi *state*.
* **`raa-ux:lazy`**: Menunda proses kompilasi reaktif elemen sampai posisi fisiknya benar-benar masuk ke dalam wilayah pandang layar (*viewport*).

---

## 🧩 Extension Directives (Kekuatan Tambahan dari Modul)

Melalui metode *monkey-patching* yang anggun ke dalam *prototype* utama, kamu bisa memasang "superpower" tambahan dari modul eksternal kami tanpa pernah mengotori kode inti aplikasi.

### A. Animasi & Transisi (`raa-animation.js`)
* **`raa-animation:*`**: Mengaktifkan mesin animasi reaktif lewat *wildcard* taktis: `enter`, `leave`, `scroll`, `loop`, `trigger`, dan `group`.
* **`raa-animation:config`**: Menulis konfigurasi durasi, *easing*, dan parameter detail animasi langsung di elemen terkait.

### B. Jaringan & REST API (`raa-http.js`)
* **`raa-http:[method]`**: Menembak REST API endpoint (`get`, `post`, `put`, `patch`, `delete`) langsung dari interaksi elemen HTML.
* **`raa-http:reactive`**: Mengaktifkan mode pengamat cerdas; otomatis memicu pemanggilan ulang API setiap kali variabel di dalam string URL-nya berubah.
* **`raa-http:poll`, `raa-http:debounce`, `raa-http:throttle`**: Mengatur kontrol kecepatan interaksi jaringan, jeda ketikan, atau interval pengambilan data berkala.
* **`raa-on:http:[event]`**: Menangkap siklus hidup respons jaringan secara reaktif lewat *event* `success`, `error`, `finally`, dan `abort`.

### C. Antarmuka Komponen (`raa-ui.js`)
* **`raa-ui:tooltip`**: Memunculkan gelembung informasi bantuan (*floating tooltip*) otomatis saat elemen didekati kursor.
* **`raa-ui:clipboard`**: Menyalin teks target ke dalam papan klip (*system clipboard*) pengguna lewat sekali ketuk.
* **`raa-ui:scroll-to`**: Menggulirkan layar secara halus (*smooth scrolling*) menuju target elemen spesifik.
* **`raa-ui:mask`**: Mengunci pola input pengguna secara ketat (misalnya format nomor telepon, mata uang, atau kartu kredit).
* **`raa-ui:outside`**: Mendeteksi interaksi klik yang terjadi di luar area elemen bersangkutan (sangat ideal untuk menutup modal/dropdown).

### D. Validasi Formulir Otomatis (`raa-validate.js`)
* **`raa-validate:[rule]`**: Menerapkan aturan validasi instan pada kolom input seperti `required`, `email`, `min`, `max`, dan regex pattern.
* **`raa-validate:group`**: Mengelompokkan seluruh indikator kesalahan (*error messages*) ke dalam satu kesatuan kolektif formulir.

### E. Modular Template & Lokalisasi
* **`raa-template:define` & `raa-template:use`**: Deklarasi dan pemanggilan kembali fragmen blok HTML modular tanpa memerlukan arsitektur *Web Components* yang rumit.
* **`raa-i18n:locale`**: Mengubah bahasa aplikasi secara global dan instan di seluruh penjuru halaman tanpa proses *reload*.
* **`raa-on:event:*`**: Jalur komunikasi super cepat untuk menangani pesan lintas komponen jarak jauh menggunakan sistem manajemen *Event Bus*.

---

## 🔄 Migrasi dari v2.1 ke v2.2

Jika Anda adalah pengguna versi sebelumnya, berikut perubahan utama yang perlu diperhatikan:

| v2.1 (Deprecated) | v2.2 (Standar Baru) | Keterangan |
|------------------|---------------------|------------|
| `raa-app` | `raa-core:app` | Namespace lebih eksplisit |
| `raa-text` / `raa-html` | `raa-bind:text` / `raa-bind:html` | Pengelompokan binding |
| `raa-if` / `raa-for` | `raa-flow:if` / `raa-flow:for` | Kontrol alir terpisah |
| `raa-click` | `raa-on:click` | Event handler terpusat |
| `raa-island` | `raa-eco:island` | Ekosistem arsitektur |

> ⚠️ **Catatan:** Sintaks v2.1 masih didukung sementara untuk kompatibilitas mundur, namun akan dihapus sepenuhnya di v3.0. Disarankan untuk segera bermigrasi.

---

## 📜 Filosofi: Kesederhanaan dengan Disiplin

> *"Kesederhanaan bukanlah ketiadaan kekuatan. Ia adalah kekuatan yang didisiplinkan."*

RaaJS v2.2 membuktikan bahwa untuk membangun aplikasi modern yang andal, kita tidak perlu menambahkan tumpukan arsitektur baru yang kian mengasingkan kita dari fondasi web asli. Tugas utama sebuah alat bantu adalah menghapus gesekan, bukan menambah ritual baru.

Selamat kembali pulang ke ekosistem yang tenang, jernih, dan menyenangkan. Selamat berkarya bersama RaaJS! ✨

---

## 🤝 Kontribusi & Komunitas

RaaJS adalah proyek *open-source* yang tumbuh dari cinta pada kesederhanaan web. Kami menyambut kontribusi dalam bentuk:

- 🐛 Laporan *bug* atau *issue*
- 💡 Ide fitur atau peningkatan dokumentasi
- 🌐 Terjemahan ke bahasa lain
- 🎨 Contoh proyek atau template starter

🔗 **Repositori Resmi:** [github.com/dazep01/raajs](https://github.com/dazep01/raajs)  
🗨️ **Diskusi & Tanya Jawab:** [GitHub Discussions](https://github.com/dazep01/raajs/discussions)  
📬 **Kontak Maintainer:** [@dazep01](https://github.com/dazep01)

> 🕊️ *Dibuat dengan ❤️ untuk pengembang yang percaya: web yang baik adalah web yang tetap manusiawi.*

# Instalasi Cepat

> **Versi:** RaaJS v3.1.0 "Data Liberation"
> Tidak ada `npm install`. Tidak ada `package.json`. Tidak ada konfigurasi apa pun. Cukup satu baris `<script>` dan kamu siap meluncur.

---

## Dua Cara Memasang RaaJS

RaaJS menawarkan dua metode instalasi yang sama-sama mudah. Pilih yang paling sesuai dengan kebutuhan proyekmu:

| Metode | Cocok untuk | Kelebihan |
|---|---|---|
| **CDN (jsDelivr)** | Prototipe cepat, belajar, proyek kecil | Langsung pakai, selalu versi terbaru |
| **Unduh File Fisik** | Proyek serius, offline, kontrol penuh | Tidak bergantung jaringan, bisa dikustomisasi |

---

## Metode 1: Via CDN (Cara Tercepat)

Ini adalah cara termudah untuk memulai. Cukup tambahkan tag `<script>` ke halaman HTML-mu — RaaJS langsung siap digunakan tanpa langkah tambahan apa pun.

### File Inti (Wajib)

```html
<!-- RaaJS Core — selalu muat ini PERTAMA -->
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>
```

### File Ekstensi (Opsional, Sesuai Kebutuhan)

Tambahkan hanya ekstensi yang benar-benar kamu butuhkan. Urutan pemuatan tidak penting di antara sesama ekstensi, asalkan semuanya dimuat **setelah** file inti.

```html
<!-- Computed Properties & Watchers -->
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-computed-watch.min.js"></script>

<!-- HTTP Client Deklaratif -->
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-http.min.js"></script>

<!-- Validasi Form -->
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-validate.min.js"></script>

<!-- Sistem Animasi -->
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-animation.min.js"></script>

<!-- UI Toolkit (tooltip, clipboard, mask, dll) -->
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-ui.min.js"></script>

<!-- Internasionalisasi & Multi-bahasa -->
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-i18n.min.js"></script>

<!-- Event Bus (komunikasi antar komponen) -->
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-eventbus.min.js"></script>

<!-- Template Reusable dengan Slot -->
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-template.min.js"></script>

<!-- DevTools — HANYA untuk development, jangan dibawa ke production! -->
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-devtools.min.js"></script>
```

> **💡 Tips jsDelivr:** jsDelivr adalah CDN open-source yang cepat, andal, dan gratis. File yang sama akan di-*cache* di browser pengguna sehingga kunjungan berikutnya akan terasa lebih cepat.

---

## Metode 2: Unduh File Fisik

Jika kamu lebih suka menyimpan file secara lokal — misalnya untuk proyek yang harus berjalan offline, atau ketika kamu ingin memastikan dependensi tidak berubah tanpa sepengetahuanmu — unduh file langsung dari repositori GitHub resmi RaaJS.

### Repositori GitHub

```
https://github.com/dazep01/raajs
```

### Struktur Folder yang Disarankan

Setelah mengunduh, letakkan file-file RaaJS di dalam proyekmu seperti ini:

```
proyek-saya/
│
├── index.html
├── app.js              ← Logika aplikasimu
│
└── raajs/              ← Folder untuk semua file RaaJS
    ├── raa.min.js      ← File inti (wajib)
    └── extensions/
        ├── raa-computed-watch.min.js
        ├── raa-http.min.js
        ├── raa-validate.min.js
        ├── raa-animation.min.js
        ├── raa-ui.min.js
        ├── raa-i18n.min.js
        ├── raa-eventbus.min.js
        ├── raa-template.min.js
        └── raa-devtools.min.js
```

### Cara Menyertakan di HTML

```html
<!-- File inti -->
<script src="raajs/raa.min.js"></script>

<!-- Ekstensi (sesuai kebutuhan) -->
<script src="raajs/extensions/raa-computed-watch.min.js"></script>
<script src="raajs/extensions/raa-validate.min.js"></script>
```

> **📂 File non-minified tersedia?** Ya. Untuk keperluan debugging atau mempelajari cara kerja internal RaaJS, kamu bisa mengunduh versi non-minified (`raa.js`, bukan `raa.min.js`) dari repositori yang sama.

---

## Paket Starter yang Disarankan

Tidak semua proyek membutuhkan semua ekstensi. Berikut adalah kombinasi yang umum digunakan untuk tiga skenario berbeda:

### 🚀 Minimal — Belajar & Prototipe

Cukup untuk memahami reaktivitas, binding, loop, dan event handling. Sempurna untuk belajar atau membuat prototipe cepat.

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proyek RaaJS Saya</title>
</head>
<body>

  <!-- Konten aplikasimu di sini -->

  <!-- Hanya file inti -->
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>

  <script>
    RaaJS.define('app', () => ({
      state: { pesan: 'Halo dari RaaJS!' }
    }));
  </script>
</body>
</html>
```

---

### ⚡ Standar — Aplikasi Web Umum

Cocok untuk sebagian besar aplikasi: ada form, ada data dari API, ada validasi.

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aplikasi Saya</title>
</head>
<body>

  <!-- Konten aplikasimu -->

  <!-- Core (wajib) -->
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>

  <!-- Ekstensi yang umum dibutuhkan -->
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-computed-watch.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-http.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-validate.min.js"></script>

  <!-- DevTools hanya saat development -->
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-devtools.min.js"></script>

  <script src="app.js"></script>
</body>
</html>
```

---

### 🏗️ Lengkap — Aplikasi Skala Penuh

Untuk aplikasi dengan animasi, multi-bahasa, komponen reusable, dan komunikasi antar island.

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aplikasi Lengkap</title>
</head>
<body>

  <!-- Konten aplikasimu -->

  <!-- 1. Core — selalu pertama -->
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>

  <!-- 2. Ekstensi — urutan antar sesama ekstensi tidak kritis -->
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-computed-watch.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-http.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-validate.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-animation.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-ui.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-i18n.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-eventbus.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-template.min.js"></script>

  <!-- 3. DevTools — HANYA di development, hapus sebelum deploy ke production -->
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-devtools.min.js"></script>

  <!-- 4. Kode aplikasimu — selalu paling terakhir -->
  <script src="app.js"></script>
</body>
</html>
```

---

## Aturan Urutan Pemuatan

Ini adalah satu-satunya aturan yang wajib kamu ingat:

```
raa.min.js  →  ekstensi apa pun  →  kode aplikasimu
   (1)              (2)                    (3)
```

Secara konkret:

```html
<!-- ✅ BENAR: core → ekstensi → kode app -->
<script src="raajs/raa.min.js"></script>
<script src="raajs/extensions/raa-http.min.js"></script>
<script src="app.js"></script>

<!-- ❌ SALAH: ekstensi dimuat sebelum core -->
<script src="raajs/extensions/raa-http.min.js"></script>
<script src="raajs/raa.min.js"></script>
<script src="app.js"></script>

<!-- ❌ SALAH: kode app dimuat sebelum RaaJS selesai -->
<script src="app.js"></script>
<script src="raajs/raa.min.js"></script>
```

> **Mengapa urutan ini penting?** Setiap ekstensi saat dimuat akan langsung mencari `window.Raa` (instance RaaJS yang dibuat oleh core) dan mendaftarkan dirinya. Jika core belum dimuat, ekstensi tidak akan menemukan `window.Raa` dan instalasi plugin akan gagal diam-diam.

---

## Verifikasi: Pastikan RaaJS Berhasil Dimuat

Buka browser, buka halaman HTML-mu, lalu buka **Developer Tools** (F12) dan ketik di konsol:

```javascript
window.Raa
```

Jika berhasil, kamu akan melihat output seperti ini:

```javascript
RaaJS {
  globalStore: {},
  debug: false,
  reactive: ReactiveSystem {...},
  scheduler: EffectScheduler {...},
  pluginManager: PluginManager {...},
  ...
}
```

Jika hasilnya `undefined`, berarti ada masalah dengan jalur file atau urutan script. Periksa kembali tab **Network** di Developer Tools — pastikan `raa.min.js` berhasil dimuat (status 200, bukan 404).

Untuk memeriksa ekstensi yang terpasang:

```javascript
window.Raa.pluginManager.getPlugins()
// Contoh output: ['raa-http', 'raa-validate', 'raa-computed-watch']
```

---

## Catatan Khusus: DevTools di Production

File `raa-devtools.min.js` dirancang **hanya untuk lingkungan development**. Ia menyematkan panel inspeksi, memantau performa flush, dan merekam setiap mutasi state — aktivitas yang tidak diinginkan di production.

**Sebelum men-deploy aplikasi ke server production, pastikan kamu menghapus atau mengomentari baris ini:**

```html
<!-- Hapus atau komentari baris ini sebelum deploy! -->
<!-- <script src="...raa-devtools.min.js"></script> -->
```

Satu cara praktis untuk mengelola ini adalah dengan kondisi environment:

```html
<!-- Cara sederhana: gunakan komentar sebagai toggle -->

<!-- [DEV ONLY — hapus sebelum deploy] -->
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-devtools.min.js"></script>
<!-- [/DEV ONLY] -->
```

---

## Referensi Cepat: Semua URL CDN v3.1.0

Untuk kemudahan copy-paste, berikut adalah seluruh URL CDN RaaJS v3.1.0:

```
Core:
https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js

Ekstensi:
https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-computed-watch.min.js
https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-http.min.js
https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-validate.min.js
https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-animation.min.js
https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-ui.min.js
https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-i18n.min.js
https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-eventbus.min.js
https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-template.min.js
https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-devtools.min.js
```

---

**← Sebelumnya:** [Apa itu RaaJS?](submenu-1-1.md) &nbsp;&nbsp;|&nbsp;&nbsp; **Berikutnya:** [Konsep Hello World →](submenu-1-3.md)

---

*Dokumentasi ini adalah bagian dari RaaJS v3.1.0 Official Docs. Kontribusi dan koreksi disambut di repositori resmi.*

# RaaJS v3.1.0 — Dokumentasi Lengkap Inti Framework

> **Versi:** 3.1.0 "Data Liberation" | **Rilis:** 2026-05-24  
> **Pembaruan:** Mulai versi ini, `raa-core:data` dihapus. Gunakan `raa-core:init` atau `RaaJS.define` untuk mendeklarasikan state.  
>
> *"Kesederhanaan adalah kekuatan yang didisiplinkan."*

---

## 🗺️ Daftar Isi

1. [Apa itu RaaJS?](#1-apa-itu-raajs)
2. [Cara Memasang RaaJS](#2-cara-memasang-raajs)
3. [Konsep Inti: Reaktivitas](#3-konsep-inti-reaktivitas)
4. [Aplikasi Pertama Kamu](#4-aplikasi-pertama-kamu)
5. [Direktif Inti (`raa-core:`)](#5-direktif-inti-raa-core)
6. [Direktif Binding (`raa-bind:`)](#6-direktif-binding-raa-bind)
7. [Direktif Alur Kontrol (`raa-flow:`)](#7-direktif-alur-kontrol-raa-flow)
8. [Direktif Event (`raa-on:`)](#8-direktif-event-raa-on)
9. [Direktif Ekosistem (`raa-eco:`)](#9-direktif-ekosistem-raa-eco)
10. [Direktif Jaringan (`raa-net:`)](#10-direktif-jaringan-raa-net)
11. [Direktif UX (`raa-ux:`)](#11-direktif-ux-raa-ux)
12. [Bahasa Ekspresi Template](#12-bahasa-ekspresi-template)
13. [API Publik RaaJS](#13-api-publik-raajs)
14. [Sistem Plugin](#14-sistem-plugin)
15. [Referensi Cepat Semua Direktif](#15-referensi-cepat-semua-direktif)
16. [Troubleshooting & Tips](#16-troubleshooting--tips)

---

## 1. Apa itu RaaJS?

RaaJS adalah **framework micro-frontend yang reaktif, ringan, dan tidak memerlukan proses build** (*no-build*). Kamu cukup menyertakan satu file JavaScript ke halaman HTML-mu, dan seketika HTML kamu menjadi hidup — bergerak, bereaksi, dan berubah seiring interaksi pengguna.

### 🎯 Untuk Siapa RaaJS?

- **Pemula** yang baru belajar JavaScript dan ingin melihat reactivity bekerja nyata.
- **Developer berpengalaman** yang butuh sesuatu yang ringan tanpa kerumitan toolchain.
- **Tim kecil** yang ingin menambahkan interaktivitas pada halaman HTML statis yang sudah ada.
- Siapa pun yang sudah lelah dengan konfigurasi webpack/vite hanya untuk membuat tombol berubah warna 😄

### ✨ Apa yang Membuat RaaJS Istimewa?

| Fitur | Penjelasan |
|---|---|
| **No-Build** | Cukup `<script src="...">` dan selesai. Tidak perlu npm, webpack, atau vite. |
| **Zero Dependency** | Tidak bergantung pada library lain. Mandiri sepenuhnya. |
| **HTML-First** | Logika ditulis langsung di atribut HTML. Terasa alami dan mudah dibaca. |
| **Reactive** | Perubahan data otomatis memperbarui tampilan. Kamu tidak perlu menulis kode update DOM secara manual. |
| **CSP-Safe** | Menggunakan AST Parser sendiri, bukan `eval()` ataupun `new(function)`. Aman dari kebijakan Content Security Policy yang ketat. |
| **Island-Capable** | Komponen terisolasi dapat hidup berdampingan di halaman yang sama. |
| **Plugin-Extensible** | Kemampuan dapat diperluas dengan ekosistem plugin yang modular. |

---

## 2. Cara Memasang RaaJS

Memasang RaaJS semudah menambahkan satu baris ke HTML kamu.

### Opsi A: Langsung dari File Lokal

Unduh `raa-v3.1.0.js` dan simpan di proyekmu, lalu tambahkan:

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Aplikasi Saya</title>
</head>
<body>

  <!-- Konten aplikasimu di sini -->

  <!-- Muat RaaJS sebelum tag </body> -->
  <script src="raa.js"></script>
</body>
</html>
```

RaaJS akan **otomatis berjalan** saat halaman selesai dimuat (`DOMContentLoaded`) dan mencari semua elemen yang memiliki atribut `raa-core:app` untuk dikompilasi.

### Opsi B: Menambahkan Ekstensi

Jika kamu butuh fitur tambahan (animasi, validasi, dsb.), cukup tambahkan file ekstensi **setelah** file inti:

```html
<script src="raa.js"></script>
<script src="extensions/raa-validate.js"></script>
<script src="extensions/raa-animation.js"></script>
```

> **⚠️ Urutan Penting!** File inti (`raa.js`) harus **selalu dimuat pertama** sebelum semua ekstensi.

---

## 3. Konsep Inti: Reaktivitas

Sebelum menulis kode, penting untuk memahami satu konsep kunci yang menjadi jantung dari RaaJS: **Reaktivitas**.

### Bayangkan Sebuah Spreadsheet

Kamu pasti pernah memakai Excel atau Google Sheets. Saat kamu mengubah nilai di sel A1, semua rumus di sel lain yang merujuk ke A1 akan **langsung ikut berubah** secara otomatis. Itulah reaktivitas!

**RaaJS** bekerja dengan cara yang persis sama:
1. Kamu punya **State** (data aplikasimu). Misalnya: `{ count: 0 }`.
2. Kamu menghubungkan State ke tampilan HTML menggunakan **Direktif**. Misalnya: `raa-bind:text="count"`.
3. Setiap kali State berubah, RaaJS **otomatis memperbarui** tampilan yang terhubung. Kamu tidak perlu menulis `document.getElementById('...').textContent = count` secara manual.

### Bagaimana RaaJS Melakukan Ini?

RaaJS menggunakan teknologi JavaScript modern bernama **Proxy**. Bayangkan Proxy sebagai "kurir cerdas" yang mengawasi setiap perubahan pada objek state-mu. Saat ada perubahan, kurir ini memberi tahu semua bagian UI yang perlu diperbarui.

```
State Berubah → Proxy Mendeteksi → Effect Dijadwalkan → DOM Diperbarui
```

Kamu tidak perlu mengerti detailnya untuk mulai menggunakannya — cukup tahu bahwa **perubahan data = perubahan tampilan secara otomatis**.

---

## 4. Aplikasi Pertama Kamu

Mari kita buat aplikasi "Penghitung" klasik sebagai perkenalan. Ada dua cara mendeklarasikan state di RaaJS:

- **`RaaJS.define`** (disarankan) — untuk aplikasi dengan logika dan interaksi.
- **`raa-core:init`** — untuk data awal yang sederhana (read-only atau dipadukan dengan factory).

Kita akan fokus pada cara yang dianjurkan.

### Penghitung Interaktif dengan `RaaJS.define`

```html
<!-- HTML: Bersih dan deklaratif -->
<div raa-core:app="penghitung">
  <h2>Penghitung Sederhana</h2>
  <p>Nilai saat ini: <strong raa-bind:text="count"></strong></p>

  <button raa-on:click="tambah()">➕ Tambah</button>
  <button raa-on:click="kurang()">➖ Kurang</button>
  <button raa-on:click="reset()">🔄 Reset</button>

  <template raa-flow:if="count > 10">
    <p style="color: red;">Wah, sudah lebih dari 10!</p>
  </template>
</div>

<script src="raa.js"></script>
<script>
  RaaJS.define('penghitung', () => ({
    state: {
      count: 0
    },
    methods: {
      tambah() { this.count += 1; },
      kurang() { this.count -= 1; },
      reset()  { this.count = 0; }
    }
  }));
</script>
```

**Apa yang terjadi di sini?**
- `raa-core:app="penghitung"` → Root aplikasi bernama 'penghitung'.
- `RaaJS.define('penghitung', ...)` → Mendaftarkan state awal dan method.
- `raa-bind:text="count"` → Menampilkan nilai `count`, diperbarui otomatis.
- `raa-on:click="tambah()"` → Memanggil method `tambah` saat tombol diklik.
- `<template raa-flow:if="count > 10">` → Konten hanya muncul jika `count > 10`.

> **💡 Tahukah kamu?**  
> Di JavaScript, `count += 1` bisa ditulis `count++`. Untuk pemula, kita gunakan yang eksplisit dulu.

### Inisialisasi State Sederhana dengan `raa-core:init`

Jika kamu hanya perlu menampilkan data awal tanpa method, gunakan `raa-core:init` untuk menyuntikkan state langsung:

```html
<div raa-core:app="statis" raa-core:init="Object.assign($state, { pesan: 'Halo Dunia', tahun: 2026 })">
  <p raa-bind:text="pesan"></p>
  <p>Tahun: <span raa-bind:text="tahun"></span></p>
</div>
```

Namun untuk aplikasi interaktif, **selalu gunakan `RaaJS.define`** seperti contoh di atas.

---

## 5. Direktif Inti (`raa-core:`)

Direktif inti adalah fondasi dari setiap aplikasi RaaJS. Mereka mengatur kompilasi, state, dan inisialisasi.

### `raa-core:app`

**Fungsi:** Menandai sebuah elemen HTML sebagai *root* dari aplikasi RaaJS dan menghubungkannya dengan definisi aplikasi yang dibuat menggunakan `RaaJS.define`.

**Sintaks:** `raa-core:app="namaAplikasi"`

```html
<div raa-core:app="todoApp">
  <!-- Semua konten di dalam sini dikelola oleh 'todoApp' -->
</div>
```

```javascript
RaaJS.define('todoApp', () => ({
  state: { items: [] },
  methods: { /* ... */ }
}));
```

**Poin Penting:**
- Setiap halaman bisa memiliki **lebih dari satu** aplikasi, masing-masing **terisolasi**.
- Nama di HTML harus **persis sama** dengan nama di `RaaJS.define`.
- Jika nama tidak ditemukan, RaaJS akan menampilkan peringatan dan menyarankan nama yang paling mirip.

---

### `raa-core:init`

**Fungsi:** Mengevaluasi ekspresi **satu kali** saat elemen pertama kali dikompilasi. Berguna untuk inisialisasi state, memanggil fungsi startup, atau menyiapkan data awal.

**Sintaks:** `raa-core:init="ekspresi"`

```html
<!-- Inisialisasi state inline -->
<div raa-core:app="appSaya" raa-core:init="Object.assign($state, { siap: true, data: [] })">
  <p raa-bind:text="siap ? 'Aplikasi siap' : 'Memuat...'"></p>
</div>

<!-- Memanggil method startup -->
<div raa-core:app="timerApp">
  <div raa-core:init="mulai()">
    <p>Waktu: <span raa-bind:text="detik"></span> detik</p>
  </div>
</div>

<script>
  RaaJS.define('timerApp', () => ({
    state: { detik: 0, _interval: null },
    methods: {
      mulai() {
        this._interval = setInterval(() => { this.detik++; }, 1000);
      }
    }
  }));
</script>
```

**Perbedaan `raa-core:init` vs `init()` di `RaaJS.define`:**

| | `raa-core:init` di HTML | `init()` di `RaaJS.define` |
|---|---|---|
| **Kapan Berjalan** | Saat elemen tertentu dikompilasi | Setelah seluruh root selesai dikompilasi |
| **Bisa Lebih dari Satu?** | Ya, satu per elemen | Tidak, hanya satu per definisi |
| **Cocok untuk** | Inisialisasi per-elemen | Inisialisasi global aplikasi |

> **Catatan Migrasi dari v3.0.0:**  
> `raa-core:data` telah dihapus. Gunakan `raa-core:init` dengan `Object.assign($state, { ... })` untuk deklarasi state inline.

---

### `raa-core:ref`

**Fungsi:** Memberikan sebuah nama referensi pada elemen DOM, yang dapat diakses dari JavaScript melalui `this.$refs.namaRef`.

**Sintaks:** `raa-core:ref="namaReferensi"`

```html
<div raa-core:app="formApp">
  <input type="email" raa-core:ref="emailInput" raa-bind:model="email">
  <button raa-on:click="fokusEmail()">Fokus ke Email</button>
</div>

<script>
  RaaJS.define('formApp', () => ({
    state: { email: '' },
    methods: {
      fokusEmail() {
        this.$refs.emailInput.focus();
      }
    }
  }));
</script>
```

---

## 6. Direktif Binding (`raa-bind:`)

Binding menghubungkan data dengan DOM secara reaktif.

### `raa-bind:text`

Menampilkan teks aman (ter-escape).

```html
<span raa-bind:text="nama"></span>
<span raa-bind:text="'Halo, ' + nama + '!'"></span>
<span raa-bind:text="skor >= 90 ? 'Lulus' : 'Coba lagi'"></span>
```

### `raa-bind:html`

Menampilkan HTML yang telah disanitasi.

```html
<div raa-bind:html="kontenArtikel"></div>
```

**Tag yang diizinkan:** `a, b, blockquote, br, code, div, em, h1-h6, hr, i, img, li, ol, p, pre, section, span, strong, sub, sup, table, tbody, td, th, thead, tr, u, ul, small`. Atribut event (`onclick`, dll.) dihapus otomatis.

### `raa-bind:model`

Two-way binding untuk elemen formulir.

```html
<input type="text" raa-bind:model="nama">
<input type="checkbox" raa-bind:model="setuju">
<select raa-bind:model="kota">...</select>
<input type="radio" raa-bind:model="pilihan" value="A">
<textarea raa-bind:model="pesan"></textarea>
<!-- Nested -->
<input raa-bind:model="user.alamat">
```

### `raa-bind:class`

Kelas CSS dinamis via objek atau array.

```html
<div raa-bind:class="{ aktif: isAktif, 'teks-merah': error }"></div>
<div raa-bind:class="['dasar', isAktif ? 'aktif' : '']"></div>
```

### `raa-bind:style`

Inline style dinamis (camelCase).

```html
<p raa-bind:style="{ color: warna, fontSize: ukuran + 'px' }"></p>
```

### `raa-bind:[attr]`

Atribut HTML generik.

```html
<a raa-bind:href="url">Link</a>
<img raa-bind:src="gambar" raa-bind:alt="deskripsi">
<button raa-bind:disabled="!valid">Kirim</button>
```

Nilai `false`, `null`, atau `undefined` akan menghapus atribut.

---

## 7. Direktif Alur Kontrol (`raa-flow:`)

### `raa-flow:if`

Render kondisional dengan `<template>`.

```html
<template raa-flow:if="tampil">
  <p>Konten yang muncul jika tampil true</p>
</template>
```

### `raa-flow:for`

Loop dengan keyed diffing.

```html
<template raa-flow:for="item in daftar" raa-key="item.id">
  <li raa-bind:text="item.nama"></li>
</template>
```

**Dengan indeks:** `"item, i in daftar"` → `i` sebagai indeks.

**Loop bersarang:** bisa, tiap `<template>` punya scope sendiri.

### `raa-flow:show`

Toggle `display` tanpa menghancurkan elemen.

```html
<div raa-flow:show="buka">Konten tersembunyi/tampil</div>
```

---

## 8. Direktif Event (`raa-on:`)

```html
<button raa-on:click="aksi()">Klik</button>
<input raa-on:keyup="periksa($event)">
<form raa-on:submit.prevent="kirim()">
```

**Modifiers:**
- `.prevent` → `event.preventDefault()`
- `.stop` → `event.stopPropagation()`
- `.self` → hanya jika `event.target` adalah elemen itu sendiri

---

## 9. Direktif Ekosistem (`raa-eco:`)

### `raa-eco:persist`

State otomatis disimpan ke `localStorage`.

```html
<div raa-core:app="pengaturan" raa-eco:persist="set-utama">
  <input type="checkbox" raa-bind:model="darkMode">
</div>
```

### `raa-eco:island`

Komponen terisolasi dengan state sendiri.

```html
<div raa-eco:island raa-core:init="Object.assign($state, { hitungan: 0 })">
  <p raa-bind:text="hitungan"></p>
  <button raa-on:click="hitungan++">Tambah</button>  <!-- perlu method di factory? -->
</div>
```

> *Catatan:* `hitungan++` di template tidak didukung tanpa method. Untuk interaksi di island, definisikan method di factory root atau gunakan `raa-on:click` yang memanggil method yang sudah disediakan.

### `raa-eco:router` dan `raa-eco:route`

Router berbasis hash.

```html
<div raa-core:app="spa" raa-eco:router>
  <nav>
    <a href="#/">Beranda</a>
    <a href="#/tentang">Tentang</a>
  </nav>
  <div raa-eco:route="/"><h2>Beranda</h2></div>
  <div raa-eco:route="/tentang"><h2>Tentang</h2></div>
</div>
```

---

## 10. Direktif Jaringan (`raa-net:`)

### `raa-net:fetch`

Fetch otomatis saat mount, abort saat destroy.

```html
<div raa-core:app="dataKota" raa-net:fetch="'https://api.contoh.com/kota' -> daftarKota">
  <template raa-flow:for="kota in daftarKota" raa-key="kota.id">
    <p raa-bind:text="kota.nama"></p>
  </template>
</div>
```

### `raa-net:sync`

WebSocket real-time.

```html
<div raa-net:sync="'ws://chat.server/room' -> pesanBaru">
  <p raa-bind:text="pesanBaru.isi"></p>
</div>
```

---

## 11. Direktif UX (`raa-ux:`)

- `raa-ux:lazy` — tunda binding sampai elemen terlihat di viewport.
- `raa-ux:focus` — auto fokus saat pertama render.
- `raa-ux:loading="kondisi"` — tambah kelas `raa-loading` dan `aria-busy`.
- `raa-ux:disable="kondisi"` — toggle atribut `disabled`.

---

## 12. Bahasa Ekspresi Template

**Didukung:** literal, identifier, member access (`a.b`, `a['b']`, `a?.[0]`), arithmetic, comparison, logical (`&&`, `||`), ternary, object literal, array literal, function call, safe globals (`Math`, `Date`, `JSON`, `console`, dll.), `$event`, `$state`, `$refs`, `$el`, `$store`, `$index`, `$locals`.

**Tidak didukung:** `??`, template literal, destructuring, spread, assignment (`=`), `new`, arrow function, `async/await`. Gunakan alternative yang sudah dijelaskan.

---

## 13. API Publik RaaJS

- `RaaJS.define(name, factory)` — daftarkan aplikasi.
- `RaaJS.defineGlobal(name, value)` — global aman di semua template.
- `new RaaJS(config?)` — instance manual.
- `raa.mount(target)` — kompilasi elemen.
- `raa.use(plugin, options?)` — pasang plugin.
- `raa.nextTick(fn?)` — eksekusi setelah microtask selesai.

---

## 14. Sistem Plugin

Plugin memiliki struktur `{ name, install(raa, options), uninstall? }`. Bisa mendaftarkan direktif kustom, lifecycle hooks (`beforeCompile`, `afterCompile`, `beforeDestroy`, `afterDestroy`), dan dependensi.

---

## 15. Referensi Cepat Semua Direktif Utama

| Direktif | Kegunaan | Contoh |
|---|---|---|
| `raa-core:app` | Root aplikasi | `raa-core:app="namaApp"` |
| `raa-core:init` | Inisialisasi sekali | `raa-core:init="Object.assign($state, { x: 1 })"` |
| `raa-core:ref` | Referensi elemen | `raa-core:ref="tombol"` |
| `raa-bind:text` | Teks reaktif | `raa-bind:text="nama"` |
| `raa-bind:html` | HTML reaktif | `raa-bind:html="konten"` |
| `raa-bind:model` | Two-way binding | `raa-bind:model="email"` |
| `raa-bind:class` | Kelas CSS dinamis | `raa-bind:class="{ aktif: isAktif }"` |
| `raa-bind:style` | Style CSS dinamis | `raa-bind:style="{ color: warna }"` |
| `raa-bind:[attr]` | Atribut generik | `raa-bind:href="url"` |
| `raa-flow:if` | Render kondisional | `<template raa-flow:if="tampil">` |
| `raa-flow:for` | Render loop | `<template raa-flow:for="item in list">` |
| `raa-flow:show` | Tampil/sembunyi | `raa-flow:show="isVisible"` |
| `raa-on:[event]` | Event handler | `raa-on:click="kirim()"` |
| `raa-eco:persist` | Persist ke localStorage | `raa-eco:persist="kunci-saya"` |
| `raa-eco:island` | Komponen terisolasi | `raa-eco:island` |
| `raa-eco:router` | Aktifkan router | `raa-eco:router` |
| `raa-eco:route` | Definisi rute | `raa-eco:route="/path"` |
| `raa-net:fetch` | HTTP GET on mount | `raa-net:fetch="'url' -> data"` |
| `raa-net:sync` | WebSocket sync | `raa-net:sync="'ws://url' -> data"` |
| `raa-ux:lazy` | Lazy compile | `raa-ux:lazy` |
| `raa-ux:focus` | Auto focus | `raa-ux:focus` |
| `raa-ux:loading` | Kelas loading | `raa-ux:loading="sedangMuat"` |
| `raa-ux:disable` | Disable dinamis | `raa-ux:disable="!valid"` |

---

## 16. Troubleshooting & Tips

**❓ State tidak reaktif?** Pastikan properti sudah ada di deklarasi awal state. Penambahan properti setelah kompilasi tidak terlacak.

**❓ Ekspresi error?** Cek konsol untuk pesan `[RaaJS warn:EVAL_FAIL]`. Hindari sintaks yang tidak didukung (??, template literal, dll.).

**❓ App tidak ditemukan?** Pastikan nama di `raa-core:app` cocok dengan `RaaJS.define`, dan script dijalankan sebelum DOM diparse (atau gunakan `defer`).

**💡 Tips Performa:** Gunakan `raa-key` stabil, `raa-ux:lazy` untuk konten di bawah layar, `raa-flow:show` untuk toggling cepat, dan hindari ekspresi berat di template.

---

*Dokumentasi ini mencakup file inti RaaJS v3.1.0. Untuk ekstensi, lihat dokumentasi masing-masing.*

--- 

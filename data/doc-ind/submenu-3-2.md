# Data Binding

> **Versi:** RaaJS v3.1.0 "Data Liberation"
> Data binding adalah percakapan antara data dan tampilan. Di halaman ini kita bedah tuntas enam direktif `raa-bind:*` — dari yang paling sederhana sampai yang paling sering disalahgunakan — dengan semua detail yang kamu butuhkan untuk menguasainya.

---

## Satu Arah vs Dua Arah

Sebelum masuk ke direktif satu per satu, ada satu konsep yang perlu disepakati dulu.

**One-way binding** artinya data mengalir dari state ke tampilan. State berubah → tampilan ikut. Tapi kalau pengguna mengubah sesuatu di tampilan (misalnya mengetik di input), state tidak otomatis ikut berubah. Kamu perlu event handler secara manual.

**Two-way binding** artinya dua arah. State berubah → tampilan ikut. Dan tampilan berubah (pengguna mengetik) → state ikut. Otomatis, tanpa event handler manual.

Di RaaJS, hampir semua `raa-bind:*` adalah one-way — kecuali satu: `raa-bind:model`. Dan itu disengaja. Kejelasan lebih berharga dari kemudahan yang menyembunyikan cara kerja sebenarnya.

---

## `raa-bind:text` — Menampilkan Teks dengan Aman

### Cara Kerjanya

`raa-bind:text` mengambil nilai dari ekspresi, mengubahnya menjadi string, lalu menaruhnya sebagai `textContent` elemen. Tidak ada HTML yang bisa lolos — semua karakter spesial seperti `<`, `>`, `&` akan di-*escape* otomatis.

Ini yang membuat `raa-bind:text` aman dari XSS. Mau data dari mana pun — input pengguna, respons API, database — kalau kamu tampilkan lewat `raa-bind:text`, tidak ada skrip jahat yang bisa berjalan.

```html
<div raa-core:app="app"
     raa-core:init="Object.assign($state, { nama: 'Budi', skor: 95, aktif: true })">

  <!-- Variabel langsung -->
  <p raa-bind:text="nama"></p>
  <!-- Output: Budi -->

  <!-- Ekspresi string -->
  <p raa-bind:text="'Halo, ' + nama + '!'"></p>
  <!-- Output: Halo, Budi! -->

  <!-- Operasi matematika -->
  <p raa-bind:text="skor * 1.05"></p>
  <!-- Output: 99.75 -->

  <!-- Ternary -->
  <p raa-bind:text="aktif ? 'Sedang Aktif ✅' : 'Tidak Aktif ❌'"></p>
  <!-- Output: Sedang Aktif ✅ -->

  <!-- Method dari safe globals -->
  <p raa-bind:text="nama.toUpperCase()"></p>
  <!-- Output: BUDI -->

  <!-- Chaining -->
  <p raa-bind:text="skor >= 90 ? 'A' : skor >= 80 ? 'B' : 'C'"></p>
  <!-- Output: A -->

</div>
```

### Nilai Null dan Undefined

Kalau ekspresi menghasilkan `null` atau `undefined`, RaaJS menampilkan string kosong — bukan teks "null" atau "undefined" yang membingungkan pengguna.

```javascript
state: { namaPanggilan: null }
// <p raa-bind:text="namaPanggilan"></p>
// Output: (kosong, bukan "null")
```

Kalau kamu ingin tampilkan nilai default saat kosong, gunakan ternary:

```html
<p raa-bind:text="namaPanggilan != null ? namaPanggilan : 'Nama belum diset'"></p>
```

> **Ingat:** `??` (nullish coalescing) tidak didukung di ekspresi RaaJS. Gunakan ternary `x != null ? x : 'default'` sebagai gantinya. Ini bukan kekurangan — ini pilihan desain yang menjaga ekspresi tetap transparan dan mudah diprediksi.

---

## `raa-bind:html` — Render HTML Dinamis

### Kapan Digunakan

Ada situasi di mana kamu memang perlu merender konten HTML yang datang dari luar — artikel dari CMS, deskripsi produk yang diformat, konten yang ditulis dengan rich text editor. Untuk kasus-kasus itu, ada `raa-bind:html`.

```html
<div raa-core:app="artikelApp">
  <div class="konten-artikel" raa-bind:html="isi"></div>
</div>

<script>
  RaaJS.define('artikelApp', () => ({
    state: {
      isi: `
        <h2>Judul Artikel</h2>
        <p>Ini adalah paragraf pertama dengan <strong>teks tebal</strong>.</p>
        <ul>
          <li>Poin pertama</li>
          <li>Poin kedua</li>
        </ul>
      `
    }
  }));
</script>
```

### Sanitasi Otomatis — Lapisan Keamanan yang Tidak Terlihat

Setiap kali `raa-bind:html` digunakan, RaaJS menjalankan sanitasi otomatis terhadap HTML sebelum memasukkannya ke DOM. Artinya:

- Tag berbahaya dihapus: `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<link>`, `<meta>`, dan beberapa lainnya
- Atribut event dihapus: `onclick`, `onload`, `onerror`, dan semua yang berawalan `on`
- URL berbahaya dihapus: `href="javascript:..."` dan `src="data:text/html..."`
- Atribut `target="_blank"` otomatis ditambahkan `rel="noopener noreferrer"`

Tag HTML yang boleh masuk: `a`, `b`, `blockquote`, `br`, `code`, `div`, `em`, `h1`–`h6`, `hr`, `i`, `img`, `li`, `ol`, `p`, `pre`, `section`, `span`, `strong`, `sub`, `sup`, `table`, `tbody`, `td`, `th`, `thead`, `tr`, `u`, `ul`, `small`.

Jadi kalau CMS-mu menyimpan artikel yang mengandung `<script>alert('hacked')</script>`, RaaJS akan diam-diam membuangnya sebelum dirender. Pengguna tidak melihat apa pun yang aneh, dan aplikasimu tetap aman.

### Menonaktifkan Sanitasi

Kalau kamu yakin betul bahwa sumber HTML-mu aman dan kamu butuh merender tag yang tidak ada di allowlist, kamu bisa menonaktifkan sanitasi saat membuat instance:

```javascript
// Saat membuat instance manual — GUNAKAN DENGAN SANGAT HATI-HATI
const raa = new RaaJS({ trustHTML: true });

// Atau dengan sanitizer kustom (misalnya DOMPurify yang lebih canggih)
const raa = new RaaJS({
  sanitizer: (html) => DOMPurify.sanitize(html, { ALLOWED_TAGS: [...] })
});
```

> **Aturan emas:** Kalau data HTML berasal dari input pengguna atau sumber eksternal yang tidak kamu kendalikan, jangan pernah gunakan `trustHTML: true`. Ini bukan paranoia — ini engineering yang bertanggung jawab.

---

## `raa-bind:model` — Two-Way Binding untuk Form

### Keajaiban di Balik Dua Karakter

`raa-bind:model` adalah direktif terpopuler kedua setelah `raa-bind:text`. Ia menciptakan ikatan dua arah antara elemen input dan properti state:

- Saat pengguna mengetik → state diperbarui
- Saat state diperbarui (dari kode) → nilai input ikut berubah

Di balik layar, RaaJS memasang event listener (`input` atau `change`, tergantung tipe elemen) dan memanggil `assign()` untuk memperbarui state. Kamu tidak perlu menulis event handler manual — `raa-bind:model` mengurusnya.

### Text Input, Number, Textarea

Untuk input teks biasa, `raa-bind:model` bekerja persis seperti yang kamu harapkan:

```html
<div raa-core:app="formApp">

  <!-- Text biasa -->
  <input type="text" raa-bind:model="nama" placeholder="Nama lengkap">
  <p raa-bind:text="'Halo, ' + nama"></p>

  <!-- Email -->
  <input type="email" raa-bind:model="email">

  <!-- Number — nilainya tetap berupa string, konversi manual jika perlu -->
  <input type="number" raa-bind:model="usia">
  <p raa-bind:text="'Umur kamu: ' + usia + ' tahun'"></p>

  <!-- Textarea — tidak ada perbedaan sintaks -->
  <textarea raa-bind:model="pesan" rows="4"></textarea>
  <p raa-bind:text="pesan.length + ' karakter'"></p>

</div>

<script>
  RaaJS.define('formApp', () => ({
    state: { nama: '', email: '', usia: '', pesan: '' }
  }));
</script>
```

> **Catatan penting soal number input:** Nilai yang dikembalikan `raa-bind:model` dari input number tetap berupa **string**, bukan angka. Kalau kamu perlu aritmatika, konversi dulu: `parseInt(this.usia)` atau `Number(this.usia)`.

### Checkbox — Boolean yang Jujur

Untuk checkbox, `raa-bind:model` mengikat nilai `checked` — jadi nilainya selalu `true` atau `false`:

```html
<label>
  <input type="checkbox" raa-bind:model="setuju">
  Saya setuju dengan syarat & ketentuan
</label>

<template raa-flow:if="setuju">
  <button>Lanjutkan Pendaftaran</button>
</template>

<template raa-flow:if="!setuju">
  <p style="color: #ef4444;">Harap centang persetujuan di atas untuk melanjutkan.</p>
</template>
```

Kalau checkbox punya atribut `value`, saat dicentang nilainya adalah string dari `value` tersebut, bukan `true`. Saat tidak dicentang, nilainya string kosong `""`:

```html
<!-- Dengan value eksplisit -->
<input type="checkbox" raa-bind:model="newsletter" value="subscribe">
<!-- Saat dicentang: newsletter === 'subscribe' -->
<!-- Saat tidak dicentang: newsletter === '' -->
```

### Radio Button — Pilihan Satu dari Banyak

Untuk radio button, semua button dalam satu grup harus mengikat ke properti state yang sama. Nilainya adalah atribut `value` dari radio yang dipilih:

```html
<div raa-core:app="surveyApp">

  <p>Pilih paket berlangganan:</p>

  <label><input type="radio" raa-bind:model="paket" value="basic"> Basic — Rp 50.000/bulan</label>
  <label><input type="radio" raa-bind:model="paket" value="pro"> Pro — Rp 150.000/bulan</label>
  <label><input type="radio" raa-bind:model="paket" value="enterprise"> Enterprise — Hubungi kami</label>

  <template raa-flow:if="paket">
    <p raa-bind:text="'Kamu memilih paket: ' + paket"></p>
  </template>

</div>

<script>
  RaaJS.define('surveyApp', () => ({
    state: { paket: 'basic' } // Nilai awal menentukan radio mana yang ter-check
  }));
</script>
```

### Select / Dropdown

Untuk elemen `<select>`, nilai yang diikat adalah `value` dari `<option>` yang dipilih:

```html
<div raa-core:app="lokasiApp">

  <!-- Select biasa -->
  <select raa-bind:model="provinsi">
    <option value="">-- Pilih Provinsi --</option>
    <option value="jawa-barat">Jawa Barat</option>
    <option value="jawa-tengah">Jawa Tengah</option>
    <option value="jawa-timur">Jawa Timur</option>
    <option value="bali">Bali</option>
  </select>

  <!-- Select dengan options dari state — lebih dinamis -->
  <select raa-bind:model="kota">
    <option value="">-- Pilih Kota --</option>
    <template raa-flow:for="k in daftarKota" raa-key="k.kode">
      <option raa-bind:value="k.kode" raa-bind:text="k.nama"></option>
    </template>
  </select>

  <p raa-bind:text="provinsi ? 'Provinsi: ' + provinsi : 'Belum dipilih'"></p>

</div>

<script>
  RaaJS.define('lokasiApp', () => ({
    state: {
      provinsi: '',
      kota: '',
      daftarKota: [
        { kode: 'bdg', nama: 'Bandung' },
        { kode: 'bks', nama: 'Bekasi' },
        { kode: 'dpk', nama: 'Depok' }
      ]
    }
  }));
</script>
```

### Two-Way Binding pada State Nested

`raa-bind:model` mendukung **dot notation** dan **bracket notation** untuk mengikat ke properti yang bersarang di dalam objek:

```html
<div raa-core:app="profilApp">

  <!-- Dot notation -->
  <input type="text" raa-bind:model="user.namaDepan" placeholder="Nama depan">
  <input type="text" raa-bind:model="user.namaBelakang" placeholder="Nama belakang">
  <input type="email" raa-bind:model="user.kontak.email" placeholder="Email">

  <!-- Bracket dengan string literal -->
  <input type="text" raa-bind:model="user['namaDepan']">

  <!-- Bracket dengan index array -->
  <input type="text" raa-bind:model="alamat[0]">

  <p raa-bind:text="user.namaDepan + ' ' + user.namaBelakang"></p>
  <p raa-bind:text="user.kontak.email"></p>

</div>

<script>
  RaaJS.define('profilApp', () => ({
    state: {
      user: {
        namaDepan: '',
        namaBelakang: '',
        kontak: { email: '', telepon: '' }
      },
      alamat: ['', '', '']
    }
  }));
</script>
```

Satu hal yang perlu diingat: jalur binding harus mengarah ke properti yang **sudah ada** di state. Kalau kamu menulis `raa-bind:model="user.kota"` tapi `user.kota` tidak dideklarasikan di state, binding tidak akan reaktif.

---

## `raa-bind:class` — Kelas CSS yang Hidup

### Kenapa Tidak Pakai Class Biasa?

Kamu mungkin bertanya — kenapa tidak langsung tulis `class="btn btn-aktif"` saja? Jawabannya: karena kelas yang kamu butuhkan sering bergantung pada kondisi yang berubah. Tombol aktif atau tidak aktif. Error atau tidak error. Loading atau sudah selesai. Untuk semua kondisi yang berubah-ubah itu, `raa-bind:class` hadir.

Dan yang menarik: kelas statis yang kamu tulis di atribut `class` biasa tetap aman. `raa-bind:class` tidak menghapus kelas yang sudah ada — ia hanya menambah atau menghapus kelas yang dikelolanya.

### Sintaks Objek — Yang Paling Sering Digunakan

Berikan sebuah objek di mana kunci adalah nama kelas dan nilainya adalah ekspresi boolean:

```html
<div raa-core:app="btnApp"
     raa-core:init="Object.assign($state, { aktif: false, loading: false, error: false })">

  <!-- Kelas statis 'btn' selalu ada
       Kelas 'btn-aktif' hanya ada saat aktif === true
       Kelas 'btn-loading' hanya ada saat loading === true  -->
  <button
    class="btn"
    raa-bind:class="{ 'btn-aktif': aktif, 'btn-loading': loading, 'btn-error': error }"
    raa-on:click="aktif = !aktif">
    Toggle Aktif
  </button>

  <!-- Ekspresi yang lebih kompleks juga boleh -->
  <div raa-bind:class="{
    'card': true,
    'card-featured': skor > 90,
    'card-disabled': !tersedia,
    'card-new': isNew && !dibaca
  }">
    Konten kartu
  </div>

</div>
```

Nama kelas yang mengandung karakter khusus (tanda hubung, titik) harus dibungkus tanda kutip. Yang tidak mengandung karakter khusus boleh tanpa kutip:

```html
<!-- ✅ Nama dengan tanda hubung → harus pakai kutip -->
raa-bind:class="{ 'is-active': aktif, 'has-error': error }"

<!-- ✅ Nama tanpa karakter khusus → boleh tanpa kutip -->
raa-bind:class="{ aktif: isAktif, loading: isLoading }"
```

### Sintaks Array — Fleksibel dan Dinamis

Selain objek, kamu bisa memberikan array berisi string nama kelas. Elemen yang kosong atau falsy diabaikan secara otomatis:

```html
<div raa-bind:class="['btn', aktif ? 'btn-aktif' : '', ukuranBesar ? 'btn-lg' : 'btn-sm']">
```

Dari array `['btn', 'btn-aktif', 'btn-sm']` (misalnya), RaaJS akan mengaplikasikan ketiga kelas. String kosong `''` tidak akan jadi nama kelas kosong yang aneh — diabaikan saja.

Array dan objek bisa dikombinasikan dengan cara yang cerdas. Kalau kamu punya daftar kelas dasar yang statis dan beberapa kelas kondisional, pecah menjadi dua binding `class` terpisah saja — atau masukkan keduanya ke dalam satu array:

```html
<div class="card" raa-bind:class="['card-' + tipe, { 'card-aktif': aktif }]">
```

Tunggu — ini tidak akan bekerja karena RaaJS tidak mendukung array yang berisi objek sebagai elemen. Cara yang tepat:

```html
<!-- Cara paling bersih: pisahkan kelas statis di 'class' biasa -->
<div
  class="card"
  raa-bind:class="{ 'card-featured': featured, 'card-disabled': !aktif }">
```

### Binding dari State

Nilai `raa-bind:class` tidak harus literal — bisa juga properti state yang berupa objek:

```javascript
state: {
  kelasKartu: {
    'card': true,
    'card-featured': false,
    'card-selected': false
  }
}
```

```html
<div raa-bind:class="kelasKartu">
  Konten kartu
</div>
```

Dan karena `kelasKartu` adalah objek reaktif, mengubah `this.kelasKartu['card-featured'] = true` akan langsung memperbarui kelas di DOM.

---

## `raa-bind:style` — Inline Style yang Reaktif

### Kapan Digunakan

`raa-bind:style` ideal untuk nilai CSS yang benar-benar dinamis dan berubah — tinggi yang dihitung dari data, warna yang bergantung pada nilai, posisi yang berubah seiring interaksi. Untuk kelas CSS yang bisa didefinisikan di stylesheet, gunakan `raa-bind:class`. Untuk nilai yang tidak bisa diwakilkan oleh nama kelas, gunakan `raa-bind:style`.

```html
<div raa-core:app="styleApp"
     raa-core:init="Object.assign($state, { tinggi: 200, warna: '#3b82f6', transparansi: 1 })">

  <div raa-bind:style="{ height: tinggi + 'px', backgroundColor: warna, opacity: transparansi }">
    Kotak dinamis
  </div>

  <input type="range" raa-bind:model="tinggi" min="50" max="400">
  <input type="color" raa-bind:model="warna">
  <input type="range" raa-bind:model="transparansi" min="0" max="1" step="0.1">

</div>
```

### Nama Properti: camelCase, Bukan Kebab-case

Ini sumber kebingungan yang paling sering. Nama properti CSS di dalam `raa-bind:style` harus ditulis dalam **camelCase**, bukan kebab-case seperti di stylesheet biasa:

```html
<!-- ❌ Salah — ini sintaks CSS stylesheet, bukan JavaScript object -->
raa-bind:style="{ background-color: warna, font-size: '16px' }"

<!-- ✅ Benar — camelCase untuk JavaScript object -->
raa-bind:style="{ backgroundColor: warna, fontSize: '16px' }"
```

Tabel konversi yang paling sering dibutuhkan:

| CSS Stylesheet | camelCase (untuk `raa-bind:style`) |
|---|---|
| `background-color` | `backgroundColor` |
| `font-size` | `fontSize` |
| `border-radius` | `borderRadius` |
| `z-index` | `zIndex` |
| `flex-direction` | `flexDirection` |
| `margin-top` | `marginTop` |
| `padding-left` | `paddingLeft` |
| `box-shadow` | `boxShadow` |
| `text-align` | `textAlign` |
| `pointer-events` | `pointerEvents` |

### Menghapus Style

Kalau nilainya `null`, `undefined`, atau string kosong, RaaJS akan menghapus properti style tersebut dari elemen — mengembalikannya ke nilai default dari stylesheet:

```javascript
methods: {
  resetWarna() {
    this.styleDinamis.color = null; // Menghapus inline color, fallback ke CSS
  }
}
```

---

## `raa-bind:[attr]` — Atribut HTML Apa Pun

### The Catch-all Binding

Selain `text`, `html`, `model`, `class`, dan `style` yang punya direktif khusus, kamu bisa mengikat **atribut HTML apa pun** menggunakan pola `raa-bind:namaAtribut`. Ini membuat hampir tidak ada atribut yang tidak bisa dibuat dinamis.

```html
<div raa-core:app="mediaApp">

  <!-- Ikat src dan alt pada gambar -->
  <img raa-bind:src="foto.url" raa-bind:alt="foto.deskripsi">

  <!-- Ikat href pada link -->
  <a raa-bind:href="'/profil/' + user.id">Lihat Profil</a>

  <!-- Ikat disabled -->
  <button raa-bind:disabled="sedangProses">Kirim</button>

  <!-- Ikat placeholder -->
  <input raa-bind:placeholder="'Cari ' + kategoriAktif + '...'" type="search">

  <!-- Ikat title (tooltip native) -->
  <span raa-bind:title="'Terakhir diperbarui: ' + tanggalUpdate">ℹ️</span>

  <!-- Ikat atribut data-* untuk custom data -->
  <div raa-bind:data-id="produk.id" raa-bind:data-kategori="produk.kategori">
    Kartu produk
  </div>

  <!-- Ikat atribut ARIA untuk aksesibilitas -->
  <div role="progressbar"
       raa-bind:aria-valuenow="progress"
       raa-bind:aria-valuemin="0"
       raa-bind:aria-valuemax="100">
  </div>

</div>
```

### Perilaku Nilai Khusus

Ini bagian yang sering menimbulkan pertanyaan, jadi kita jelaskan satu per satu:

**Nilai `false`, `null`, atau `undefined`** → atribut **dihapus** dari elemen. Ini berguna untuk atribut boolean seperti `disabled`, `readonly`, `checked`:

```html
<!-- Saat loading === true: -->
<!-- <button disabled="disabled"> -->

<!-- Saat loading === false: -->
<!-- <button> (atribut disabled tidak ada sama sekali) -->

<button raa-bind:disabled="loading">Simpan</button>
```

**Nilai `true`** → atribut ditambahkan dengan nilai string `"true"`. Untuk atribut boolean HTML seperti `disabled`, `readonly`, `required`, ini sudah cukup — browser mengenalinya:

```html
<input raa-bind:required="isRequired">
<!-- Saat isRequired === true: <input required="true"> -->
<!-- Saat isRequired === false: <input> (atribut dihapus) -->
```

**Nilai lainnya** → dikonversi ke string menggunakan `String(nilai)`:

```html
<div raa-bind:data-count="jumlah">
<!-- Saat jumlah === 42: <div data-count="42"> -->
```

### Mengikat Beberapa Atribut Sekaligus

Tidak ada cara untuk mengikat banyak atribut sekaligus dalam satu direktif di RaaJS — setiap atribut butuh direktif `raa-bind:` tersendiri. Ini disengaja untuk menjaga keterbacaan dan mencegah binding yang ambigu:

```html
<!-- ✅ Cara yang benar: satu direktif per atribut -->
<input
  raa-bind:type="inputType"
  raa-bind:placeholder="inputPlaceholder"
  raa-bind:disabled="!isEditable"
  raa-bind:aria-label="label"
  raa-bind:model="nilai">
```

---

## Semua dalam Satu: Contoh Kartu Profil Dinamis

Berikut contoh yang menggabungkan semua direktif `raa-bind:*` dalam satu komponen yang bermakna — kartu profil pengguna yang bisa diedit:

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Kartu Profil — RaaJS</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: sans-serif; background: #f8fafc; padding: 32px; }
    .wrapper { max-width: 480px; margin: 0 auto; }

    .kartu {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 16px rgba(0,0,0,0.08);
      transition: box-shadow 0.3s;
    }
    .kartu.featured { box-shadow: 0 4px 32px rgba(59,130,246,0.2); }
    .kartu.offline { opacity: 0.6; }

    .banner {
      height: 80px;
      background: #3b82f6;
      transition: background 0.3s;
    }

    .isi { padding: 16px 20px 20px; }

    .avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: 3px solid white;
      margin-top: -32px;
      margin-bottom: 8px;
      object-fit: cover;
    }

    .nama { font-size: 18px; font-weight: 700; margin: 0 0 2px; }
    .bio { font-size: 13px; color: #64748b; margin: 0 0 16px; }

    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 20px;
      margin-right: 4px;
    }
    .badge.online { background: #dcfce7; color: #15803d; }
    .badge.offline { background: #fee2e2; color: #dc2626; }
    .badge.role { background: #ede9fe; color: #6d28d9; }

    hr { border: none; border-top: 1px solid #f1f5f9; margin: 16px 0; }

    .form-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
    .form-row label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; }
    .form-row input, .form-row select, .form-row textarea {
      border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px;
      font-size: 13px; font-family: inherit;
    }
    .form-row input:focus, .form-row select:focus, .form-row textarea:focus {
      outline: none; border-color: #3b82f6;
    }

    button {
      background: #3b82f6; color: white; border: none; border-radius: 8px;
      padding: 9px 18px; font-size: 13px; font-weight: 600; cursor: pointer;
    }
    button.secondary {
      background: #f1f5f9; color: #374151;
    }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
  </style>
</head>
<body>
  <div class="wrapper">
    <h2 style="margin-bottom: 20px;">Kartu Profil Dinamis</h2>

    <div raa-core:app="profilApp">

      <!-- === PRATINJAU KARTU === -->

      <!--
        raa-bind:class  → kartu punya kelas kondisional 'featured' dan 'offline'
      -->
      <div class="kartu" raa-bind:class="{ featured: isFeatured, offline: !isOnline }">

        <!--
          raa-bind:style  → warna banner berubah sesuai input warna
        -->
        <div class="banner" raa-bind:style="{ backgroundColor: warnaBanner }"></div>

        <div class="isi">
          <!--
            raa-bind:src dan raa-bind:alt  → atribut gambar dinamis
          -->
          <img
            class="avatar"
            raa-bind:src="avatarUrl != null ? avatarUrl : 'https://ui-avatars.com/api/?name=' + nama"
            raa-bind:alt="'Foto profil ' + nama">

          <!--
            raa-bind:text  → nama dan bio ditampilkan sebagai teks aman
          -->
          <p class="nama" raa-bind:text="nama || 'Nama belum diisi'"></p>
          <p class="bio" raa-bind:text="bio || 'Belum ada bio.'"></p>

          <div>
            <span class="badge role" raa-bind:text="role"></span>
            <span
              raa-bind:class="{ badge: true, online: isOnline, offline: !isOnline }"
              raa-bind:text="isOnline ? 'Online' : 'Offline'">
            </span>
          </div>

          <!--
            raa-bind:html  → bio HTML dirender dengan sanitasi otomatis
          -->
          <template raa-flow:if="bioHtml">
            <hr>
            <div style="font-size: 13px; color: #374151;" raa-bind:html="bioHtml"></div>
          </template>
        </div>
      </div>

      <!-- === FORM EDITOR === -->
      <div style="margin-top: 24px; background: white; border-radius: 16px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <h4 style="margin: 0 0 16px; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Edit Profil</h4>

        <div class="form-row">
          <label>Nama</label>
          <input type="text" raa-bind:model="nama" placeholder="Nama lengkap">
        </div>

        <div class="form-row">
          <label>Bio Singkat (Teks)</label>
          <input type="text" raa-bind:model="bio" placeholder="Cerita singkat tentangmu">
        </div>

        <div class="form-row">
          <label>Bio HTML (akan disanitasi)</label>
          <textarea raa-bind:model="bioHtml" rows="3" placeholder="<strong>Bold</strong>, <em>italic</em>, dsb."></textarea>
        </div>

        <div class="form-row">
          <label>Role</label>
          <select raa-bind:model="role">
            <option value="Developer">Developer</option>
            <option value="Designer">Designer</option>
            <option value="Product Manager">Product Manager</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        <div class="form-row">
          <label>Warna Banner</label>
          <input type="color" raa-bind:model="warnaBanner">
        </div>

        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer;">
            <input type="checkbox" raa-bind:model="isOnline"> Tandai sebagai Online
          </label>
          <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer;">
            <input type="checkbox" raa-bind:model="isFeatured"> Tampilkan sebagai Featured
          </label>
        </div>
      </div>

    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>
  <script>
    RaaJS.define('profilApp', () => ({
      state: {
        nama: 'Budi Santoso',
        bio: 'Frontend developer yang suka hal-hal simpel.',
        bioHtml: '<strong>Passionate</strong> tentang web performance dan <em>clean code</em>.',
        avatarUrl: null,
        role: 'Developer',
        warnaBanner: '#3b82f6',
        isOnline: true,
        isFeatured: false
      }
    }));
  </script>

</body>
</html>
```

---

## Ringkasan: Kapan Pakai Yang Mana

| Kamu ingin... | Gunakan |
|---|---|
| Menampilkan teks dari data | `raa-bind:text` |
| Menampilkan HTML yang diformat | `raa-bind:html` |
| Menghubungkan input form ke data | `raa-bind:model` |
| Menambah/menghapus kelas CSS | `raa-bind:class` |
| Mengatur inline style dinamis | `raa-bind:style` |
| Mengikat atribut HTML apa pun | `raa-bind:[nama-atribut]` |

Dan satu hal yang perlu selalu diingat: `raa-bind:text` untuk semua yang perlu ditampilkan sebagai teks, `raa-bind:html` hanya jika kamu benar-benar butuh merender HTML. Tidak ada alasan untuk mengambil risiko keamanan yang tidak perlu.

---

*Dokumentasi ini adalah bagian dari RaaJS v3.1.0 Official Docs. Kontribusi dan koreksi disambut di repositori resmi.*

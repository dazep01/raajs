# Sintaks Ekspresi — Logika di Atas Kanvas Deklaratif

> **Versi:** RaaJS v3.1.0 "Data Liberation"
> Di RaaJS, template HTML bukan sekadar wadah statis. Ia adalah kanvas dinamis tempat data dan tampilan saling berinteraksi melalui ekspresi. Tapi tidak semua JavaScript bisa kamu tulis di sana — dan itu disengaja. Di halaman ini, kita akan pelajari apa yang bisa, apa yang tidak, dan kenapa batasnya ada di situ.

---

## Ekspresi Bukan JavaScript Mentah

Sebelum masuk ke daftar fitur, ada satu hal fundamental yang perlu kamu pahami: **ekspresi di template RaaJS bukan JavaScript yang dijalankan langsung oleh browser**.

Di banyak framework, ekspresi template dievaluasi menggunakan `eval()` atau `new Function()` — keduanya berbahaya dari sudut pandang keamanan karena membuka celah untuk injeksi kode. RaaJS memilih jalan berbeda.

RaaJS memiliki **AST Parser buatannya sendiri**. Ketika kamu menulis `user?.nama != null ? 'Halo, ' + user.nama : 'Tamu'`, string itu tidak langsung dieksekusi. RaaJS membacanya, memecahnya menjadi pohon simpul logika (Abstract Syntax Tree), lalu mengevaluasinya di dalam lingkungan terisolasi (Scoped Proxy) yang ketat.

Ini berarti dua hal penting:

Pertama, RaaJS aman digunakan bahkan di lingkungan dengan Content Security Policy paling ketat — tidak ada `eval()`, tidak ada `new Function()`. Kedua, tidak semua sintaks JavaScript didukung — parser hanya mengenal subset yang dipilih dengan cermat. Ini bukan kekurangan, ini keputusan desain yang sadar.

Analoginya seperti mesin ATM: ia hanya memahami perintah yang sudah terdaftar — tarik tunai, cek saldo, transfer. Kamu tidak bisa memintanya untuk memesan pizza, tapi untuk semua yang ia bisa lakukan, ia bekerja dengan sempurna dan aman.

---

## Yang Didukung: Daftar Lengkap

### Literal

Nilai dasar yang bisa langsung ditulis di ekspresi:

```html
<!-- String — pakai tanda kutip tunggal atau ganda -->
<p raa-bind:text="'Halo, Dunia!'"></p>
<p raa-bind:text='"RaaJS v3.1.0"'></p>

<!-- Angka -->
<p raa-bind:text="42"></p>
<p raa-bind:text="3.14"></p>

<!-- Boolean -->
<p raa-bind:text="true"></p>

<!-- Null dan Undefined -->
<p raa-bind:text="null"></p>
```

### Identifier dan Akses State

Properti state bisa diakses langsung dengan namanya:

```html
<!-- Akses langsung -->
<p raa-bind:text="nama"></p>
<p raa-bind:text="totalHarga"></p>

<!-- Dot notation untuk objek nested -->
<p raa-bind:text="user.nama"></p>
<p raa-bind:text="user.alamat.kota"></p>

<!-- Bracket notation -->
<p raa-bind:text="items[0]"></p>
<p raa-bind:text="data['kunci-dengan-tanda-hubung']"></p>

<!-- Kombinasi keduanya -->
<p raa-bind:text="users[0].profil.foto"></p>
```

### Optional Chaining (`?.`)

Cara paling aman untuk mengakses properti yang mungkin `null` atau `undefined`:

```html
<!-- Tanpa optional chaining — error jika 'user' null -->
<!-- <p raa-bind:text="user.nama"></p> -->

<!-- Dengan optional chaining — aman, mengembalikan undefined jika null -->
<p raa-bind:text="user?.nama"></p>
<p raa-bind:text="user?.profil?.foto"></p>
<p raa-bind:text="daftar?.[0]?.nama"></p>
<p raa-bind:text="getUser?.()"></p>
```

### Operator Aritmatika

```html
<p raa-bind:text="harga + pajak"></p>
<p raa-bind:text="total - diskon"></p>
<p raa-bind:text="harga * qty"></p>
<p raa-bind:text="total / anggota"></p>
<p raa-bind:text="angka % 2"></p>
```

### Operator Perbandingan dan Logika

```html
<!-- Perbandingan -->
<p raa-bind:text="usia >= 18"></p>
<p raa-bind:text="status === 'aktif'"></p>
<p raa-bind:text="nilai !== null"></p>

<!-- Logika — dengan short-circuit -->
<p raa-bind:text="isAdmin && canEdit"></p>
<p raa-bind:text="namaDepan || 'Anonim'"></p>
<p raa-bind:text="!isLoading"></p>
```

### Ekspresi Ternary

```html
<!-- Pola dasar -->
<p raa-bind:text="isLoggedIn ? 'Masuk' : 'Keluar'"></p>

<!-- Dengan ekspresi lebih kompleks -->
<p raa-bind:text="saldo >= total ? 'Saldo Cukup' : 'Saldo Kurang'"></p>

<!-- Ternary bersarang — boleh, tapi batasi kedalamannya -->
<p raa-bind:text="nilai >= 90 ? 'A' : nilai >= 75 ? 'B' : nilai >= 60 ? 'C' : 'D'"></p>
```

> Ternary yang terlalu dalam sebaiknya dipindahkan ke method. Tiga level sudah cukup untuk mulai merasa tidak nyaman — itu sinyal untuk refactor.

### Object Literal

Sangat berguna untuk `raa-bind:class` dan `raa-bind:style`:

```html
<!-- Untuk class binding -->
<div raa-bind:class="{ aktif: isAktif, 'font-bold': isPenting, error: hasError }"></div>

<!-- Untuk style binding -->
<div raa-bind:style="{ color: warnaText, fontSize: ukuran + 'px', display: tampil ? 'block' : 'none' }"></div>

<!-- Object literal bisa berisi ekspresi -->
<div raa-bind:class="{ 'bg-hijau': saldo > 0, 'bg-merah': saldo < 0, 'bg-abu': saldo === 0 }"></div>
```

### Array Literal

Terutama untuk `raa-bind:class` dengan array kelas:

```html
<!-- Array string statis -->
<div raa-bind:class="['dasar', 'rounded', aktif ? 'aktif' : '']"></div>

<!-- Array dengan kondisi -->
<div raa-bind:class="[kelasUtama, isError ? 'error' : 'normal']"></div>
```

### Pemanggilan Fungsi (Function Calls)

```html
<!-- Memanggil method dari factory -->
<p raa-bind:text="hitungTotal()"></p>
<p raa-bind:text="formatRupiah(harga)"></p>

<!-- Method pada objek state -->
<p raa-bind:text="teks.toUpperCase()"></p>
<p raa-bind:text="nama.trim()"></p>
<p raa-bind:text="angka.toFixed(2)"></p>

<!-- Method array -->
<p raa-bind:text="daftar.length"></p>
<p raa-bind:text="daftar.filter(i => i.aktif).length"></p>
```

---

## Variabel Khusus yang Selalu Tersedia

Ini adalah variabel "ajaib" yang disuntikkan RaaJS ke dalam scope ekspresi — tersedia di semua template tanpa perlu deklarasi:

### `$state`
Referensi ke seluruh objek state reaktif. Berguna ketika kamu perlu meneruskan seluruh state ke fungsi, atau membedakan antara akses state dan variabel lokal:

```html
<p raa-bind:text="$state.nama"></p>
<!-- Sama dengan: -->
<p raa-bind:text="nama"></p>

<!-- Berguna saat ada naming conflict -->
<template raa-flow:for="nama in daftarNama" raa-key="nama">
  <!-- Variabel loop 'nama' menutupi state 'nama' -->
  <!-- Gunakan $state.nama untuk akses state yang tersembunyi -->
  <p raa-bind:text="nama + ' vs ' + $state.nama"></p>
</template>
```

### `$refs`
Referensi ke semua elemen DOM yang memiliki `raa-core:ref`:

```html
<input raa-core:ref="emailInput" type="email">
<!-- Bisa diakses dari template (untuk read-only) -->
<p raa-bind:text="$refs.emailInput ? $refs.emailInput.value : ''"></p>
```

### `$el`
Referensi ke elemen DOM tempat direktif berada:

```html
<!-- Berguna untuk membaca properti DOM elemen itu sendiri -->
<div raa-on:click="klik($el)">
  <!-- $el adalah elemen <div> ini -->
</div>
```

### `$store`
Referensi ke Global Store yang dibagi oleh semua aplikasi:

```html
<!-- Baca dari store -->
<p raa-bind:text="$store.appVersion"></p>
<p raa-bind:text="$store.tema === 'dark' ? '🌙' : '☀️'"></p>

<!-- Atau dari method -->
<button raa-on:click="$store.tema = 'light'">Mode Terang</button>
```

### `$event`
Objek event asli dari browser — hanya tersedia di dalam `raa-on:*`:

```html
<input raa-on:input="update($event)">
<!-- $event adalah InputEvent dari browser -->
<!-- event.target.value berisi nilai teks yang diketik -->
```

### `$index`
Indeks item saat ini — hanya tersedia di dalam `raa-flow:for`:

```html
<template raa-flow:for="item in daftar" raa-key="item.id">
  <p raa-bind:text="($index + 1) + '. ' + item.nama"></p>
</template>
```

### `$locals`
Semua variabel dari loop `raa-flow:for` di semua level atas — sangat berguna untuk nested loop:

```html
<template raa-flow:for="kategori in menu" raa-key="kategori.id">
  <template raa-flow:for="item in kategori.produk" raa-key="item.id">
    <!-- $locals.kategori merujuk ke variabel loop level atas -->
    <p raa-bind:text="$locals.kategori.nama + ' › ' + item.nama"></p>
  </template>
</template>
```

---

## Safe Globals: JavaScript Bawaan yang Bisa Dipakai

RaaJS menyediakan akses ke sejumlah global JavaScript yang aman untuk dipakai langsung di ekspresi template:

| Kategori | Yang Tersedia |
|---|---|
| **Matematika** | `Math` (dan semua method-nya: `Math.floor`, `Math.round`, `Math.max`, dll.) |
| **Tanggal** | `Date` |
| **Serialisasi** | `JSON` |
| **Tipe data** | `Array`, `Object`, `String`, `Number`, `Boolean`, `RegExp` |
| **Koleksi** | `Map`, `Set`, `WeakMap`, `WeakSet` |
| **Konversi** | `parseInt`, `parseFloat`, `isNaN`, `isFinite` |
| **URL** | `encodeURIComponent`, `decodeURIComponent`, `encodeURI`, `decodeURI` |
| **Async** | `Promise` |
| **Internasional** | `Intl` |
| **Debug** | `console` |

```html
<!-- Contoh penggunaan safe globals di template -->

<!-- Math -->
<p raa-bind:text="Math.max(a, b, c)"></p>
<p raa-bind:text="Math.floor(harga * 1.1)"></p>
<p raa-bind:text="Math.abs(selisih)"></p>

<!-- Array -->
<p raa-bind:text="Array.isArray(data) ? 'Array' : 'Bukan array'"></p>
<p raa-bind:text="Array.from({ length: 5 }, (_, i) => i + 1)"></p>

<!-- String -->
<p raa-bind:text="String(angka).padStart(3, '0')"></p>

<!-- Number -->
<p raa-bind:text="Number.isInteger(nilai)"></p>
<p raa-bind:text="harga.toLocaleString('id-ID')"></p>

<!-- parseInt / parseFloat -->
<p raa-bind:text="parseInt(inputNilai)"></p>

<!-- Intl untuk format angka/tanggal yang proper -->
<p raa-bind:text="new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(harga)"></p>
```

Kamu juga bisa menambahkan global kustom sendiri via `RaaJS.defineGlobal()`:

```javascript
// Daftarkan global kustom yang bisa dipakai di semua template
RaaJS.defineGlobal('formatRupiah', (nilai) => {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(nilai);
});

RaaJS.defineGlobal('tanggalIndo', (date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
});
```

```html
<!-- Setelah didaftarkan, langsung tersedia di semua template -->
<p raa-bind:text="formatRupiah(harga)"></p>
<p raa-bind:text="tanggalIndo(artikel.tanggal)"></p>
```

---

## Yang Tidak Didukung (dan Alternatifnya)

Berikut adalah sintaks JavaScript yang tidak bisa digunakan di ekspresi template, beserta alternatif yang tepat:

| Tidak Didukung | Kenapa | Alternatif di RaaJS |
|---|---|---|
| `x ?? 'default'` | Parser tidak mengenal `??` | `x != null ? x : 'default'` |
| `` `Halo ${nama}` `` | Template literal tidak didukung | `'Halo ' + nama` |
| `x = 5` / `x++` | Assignment tidak diizinkan di template | Pindahkan ke `methods` |
| `typeof x` | Tidak ada di subset parser | Pindahkan ke `methods` |
| `x instanceof Y` | Tidak ada di subset parser | Pindahkan ke `methods` |
| `new Kelas()` | Tidak diizinkan | Pindahkan ke `methods` atau `init()` |
| `[...arr]` / `{...obj}` | Spread tidak didukung | Pindahkan ke `methods` |
| `(x) => x + 1` | Arrow function tidak didukung | Gunakan method yang sudah ada |
| `async/await` | Tidak didukung | Selalu di `methods` |

### Contoh Konversi Nyata

```html
<!-- ❌ Nullish coalescing — tidak didukung -->
<p raa-bind:text="namaUser ?? 'Tamu'"></p>

<!-- ✅ Alternatif dengan ternary -->
<p raa-bind:text="namaUser != null ? namaUser : 'Tamu'"></p>
<!-- Atau pakai logical OR untuk falsy check -->
<p raa-bind:text="namaUser || 'Tamu'"></p>


<!-- ❌ Template literal — tidak didukung -->
<p raa-bind:text="`Halo, ${nama}! Kamu punya ${pesan.length} pesan.`"></p>

<!-- ✅ Alternatif dengan concatenation -->
<p raa-bind:text="'Halo, ' + nama + '! Kamu punya ' + pesan.length + ' pesan.'"></p>


<!-- ❌ Assignment langsung di template -->
<button raa-on:click="count = count + 1">Tambah</button>

<!-- ✅ Pindahkan ke method -->
<button raa-on:click="tambah()">Tambah</button>


<!-- ❌ typeof di template -->
<p raa-bind:text="typeof nilai === 'number' ? 'angka' : 'bukan angka'"></p>

<!-- ✅ Buat method helper -->
<p raa-bind:text="isAngka(nilai) ? 'angka' : 'bukan angka'"></p>
```

```javascript
methods: {
  isAngka(val) {
    return typeof val === 'number';
  }
}
```

---

## Aturan Emas: Kapan Ekspresi, Kapan Method

Ada aturan sederhana yang bisa jadi kompas kamu setiap kali menulis kode RaaJS:

**Jika ekspresi bisa dibaca dalam satu tarikan nafas tanpa mengernyitkan dahi — taruh di template. Jika tidak — taruh di method.**

```html
<!-- ✅ Masih nyaman dibaca di template -->
<p raa-bind:text="user.nama || 'Anonim'"></p>
<p raa-bind:text="saldo >= total ? 'Cukup' : 'Kurang'"></p>
<div raa-bind:class="{ aktif: isAktif, error: hasError }"></div>

<!-- ⚠️ Sudah mulai panjang — pertimbangkan method -->
<p raa-bind:text="harga * qty * (1 - diskon / 100) + ongkir"></p>

<!-- ❌ Terlalu panjang — wajib pindah ke method -->
<p raa-bind:text="daftar.filter(i => !i.terhapus && i.kategori === kategoriAktif).length > 0 ? 'Ada ' + daftar.filter(i => !i.terhapus && i.kategori === kategoriAktif).length + ' item' : 'Kosong'"></p>
```

```javascript
// Versi yang benar — semua logika berat di method
methods: {
  totalBayar() {
    return this.harga * this.qty * (1 - this.diskon / 100) + this.ongkir;
  },
  itemTampil() {
    return this.daftar.filter(i => !i.terhapus && i.kategori === this.kategoriAktif);
  },
  infoItem() {
    const count = this.itemTampil().length;
    return count > 0 ? 'Ada ' + count + ' item' : 'Kosong';
  }
}
```

```html
<!-- Bersih, mudah dibaca -->
<p raa-bind:text="totalBayar()"></p>
<p raa-bind:text="infoItem()"></p>
```

---

## Contoh Lengkap: Semua Fitur Ekspresi dalam Satu Halaman

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Demo Ekspresi — RaaJS</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: sans-serif; max-width: 640px; margin: 40px auto; padding: 0 16px; color: #1e293b; }
    .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
    .card h3 { margin: 0 0 12px; font-size: 15px; color: #64748b; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
    .result { background: #f8fafc; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 14px; }
    input, select { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; width: 100%; margin-bottom: 8px; font-size: 14px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .hijau { background: #dcfce7; color: #15803d; }
    .merah { background: #fee2e2; color: #dc2626; }
    .abu { background: #f1f5f9; color: #64748b; }
  </style>
</head>
<body>

  <h2>🧪 Lab Ekspresi RaaJS</h2>

  <div raa-core:app="ekspresiLab">

    <!-- Literal & Operator -->
    <div class="card">
      <h3>Aritmatika & String</h3>
      <input type="number" raa-bind:model="a" placeholder="Angka A">
      <input type="number" raa-bind:model="b" placeholder="Angka B">
      <div class="result">
        <!-- Konkatenasi string + aritmatika -->
        <p raa-bind:text="a + ' + ' + b + ' = ' + (a + b)"></p>
        <p raa-bind:text="a + ' × ' + b + ' = ' + (a * b)"></p>
        <!-- Safe globals: Math -->
        <p raa-bind:text="'Max: ' + Math.max(a, b) + ', Min: ' + Math.min(a, b)"></p>
      </div>
    </div>

    <!-- Ternary & Logika -->
    <div class="card">
      <h3>Kondisi & Logika</h3>
      <input type="number" raa-bind:model="usia" placeholder="Usia">
      <div class="result">
        <!-- Ternary -->
        <p raa-bind:text="usia >= 17 ? '✅ Boleh memilih' : '❌ Belum boleh memilih'"></p>
        <!-- Optional chaining -->
        <p raa-bind:text="'Kota: ' + (user?.alamat?.kota != null ? user.alamat.kota : 'Tidak diketahui')"></p>
        <!-- Logical OR sebagai fallback -->
        <p raa-bind:text="'Nama: ' + (user?.nama || 'Tamu')"></p>
      </div>
    </div>

    <!-- Object Literal untuk class -->
    <div class="card">
      <h3>Object Literal (Class Binding)</h3>
      <input type="number" raa-bind:model="saldo" placeholder="Saldo">
      <input type="number" raa-bind:model="tagihan" placeholder="Tagihan">
      <div style="margin-top: 8px;">
        <span class="badge"
              raa-bind:class="{ hijau: saldo >= tagihan, merah: saldo < tagihan, abu: saldo === tagihan }"
              raa-bind:text="saldo >= tagihan ? 'Cukup' : 'Kurang'">
        </span>
        <!-- Method kustom via defineGlobal -->
        <p style="margin-top: 8px; font-size: 13px;" raa-bind:text="'Saldo: ' + formatRupiah(saldo) + ' | Tagihan: ' + formatRupiah(tagihan)"></p>
      </div>
    </div>

    <!-- Variabel khusus -->
    <div class="card">
      <h3>Variabel Khusus ($index, $state)</h3>
      <div>
        <template raa-flow:for="warna in palet" raa-key="warna">
          <div style="display: flex; align-items: center; gap: 8px; padding: 4px 0;">
            <!-- $index tersedia otomatis -->
            <span raa-bind:text="$index + 1 + '.'"></span>
            <div raa-bind:style="{ width: '24px', height: '24px', borderRadius: '50%', background: warna }"></div>
            <span raa-bind:text="warna"></span>
            <!-- $state untuk akses state di dalam loop -->
            <span style="font-size: 11px; color: #94a3b8;"
                  raa-bind:text="warna === $state.pilihanWarna ? '← terpilih' : ''"></span>
          </div>
        </template>
      </div>
    </div>

  </div>

  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>
  <script>
    // Daftarkan global kustom
    RaaJS.defineGlobal('formatRupiah', (nilai) => {
      return 'Rp ' + new Intl.NumberFormat('id-ID').format(nilai || 0);
    });

    RaaJS.define('ekspresiLab', () => ({
      state: {
        a: 10,
        b: 5,
        usia: 20,
        saldo: 150000,
        tagihan: 75000,
        user: {
          nama: 'Andi',
          alamat: { kota: 'Bandung' }
        },
        palet: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        pilihanWarna: '#10b981'
      }
    }));
  </script>

</body>
</html>
```

---

**← Sebelumnya:** [Event Handling](submenu-3-4.md) &nbsp;&nbsp;|&nbsp;&nbsp; **Berikutnya:** [Scope Evaluator →](submenu-4-2.md)

---

*Dokumentasi ini adalah bagian dari RaaJS v3.1.0 Official Docs. Kontribusi dan koreksi disambut di repositori resmi.*

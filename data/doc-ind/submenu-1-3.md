# Konsep Hello World

> **Versi:** RaaJS v3.1.0 "Data Liberation"
> Di halaman ini, kita akan membangun aplikasi pertamamu dari nol — selangkah demi selangkah, dengan penjelasan di setiap baris kode. Tidak ada yang terlewat, tidak ada yang diasumsikan sudah kamu tahu.

---

## Sebelum Mulai: Satu Fondasi Penting

Ada satu konsep yang perlu kamu pahami sebelum menulis baris kode pertama: **RaaJS bekerja dengan menghubungkan data ke tampilan secara otomatis**.

Artinya: kamu tidak perlu lagi menulis kode seperti ini setiap kali data berubah:

```javascript
// Cara lama — kamu harus update DOM secara manual
document.getElementById('pesan').textContent = nilaiTerbaru;
```

Di RaaJS, kamu cukup mengubah data, dan tampilan **menyesuaikan dirinya sendiri**. Itulah inti dari reaktivitas.

Siap? Mari kita mulai.

---

## Langkah 1: Kerangka HTML Paling Dasar

Buat file baru bernama `index.html` dan isi dengan ini:

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hello World — RaaJS</title>
</head>
<body>

  <!-- Aplikasi RaaJS kita akan hidup di dalam elemen ini -->
  <div raa-core:app="halo">
    <p raa-bind:text="pesan"></p>
  </div>

  <!-- Muat RaaJS -->
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>

  <!-- Definisikan aplikasi kita -->
  <script>
    RaaJS.define('halo', () => ({
      state: {
        pesan: 'Halo, Dunia!'
      }
    }));
  </script>

</body>
</html>
```

Buka file ini di browser. Kamu akan melihat teks **"Halo, Dunia!"** muncul di halaman.

Selamat — kamu baru saja membuat aplikasi RaaJS pertamamu! 🎉

---

## Memahami Setiap Bagiannya

Jangan lanjut dulu sebelum kita bedah kode di atas baris per baris. Memahami ini akan membuat segalanya jauh lebih mudah ke depannya.

### Bagian 1: `raa-core:app`

```html
<div raa-core:app="halo">
```

Atribut `raa-core:app="halo"` memberitahu RaaJS: *"Elemen `<div>` ini adalah rumah dari aplikasi bernama 'halo'. Kelola semuanya yang ada di dalam sini."*

Elemen ini disebut **root**. Semua direktif RaaJS di dalam root ini akan aktif dan reaktif. Di luar root ini, RaaJS tidak bekerja.

### Bagian 2: `raa-bind:text`

```html
<p raa-bind:text="pesan"></p>
```

`raa-bind:text="pesan"` artinya: *"Tampilkan nilai dari variabel `pesan` sebagai teks di elemen `<p>` ini."*

Koneksi ini bersifat **reaktif** — jika nilai `pesan` berubah kapan pun, teks di layar akan ikut berubah secara otomatis tanpa kamu perlu melakukan apa pun.

### Bagian 3: `RaaJS.define()`

```javascript
RaaJS.define('halo', () => ({
  state: {
    pesan: 'Halo, Dunia!'
  }
}));
```

`RaaJS.define()` adalah tempat kamu mendaftarkan "resep" untuk aplikasimu. Ia menerima dua argumen:
- **Nama** — harus sama persis dengan nilai di `raa-core:app`
- **Factory function** — sebuah fungsi yang mengembalikan konfigurasi aplikasi

Di dalam konfigurasi, `state` adalah objek yang berisi semua **data** aplikasimu. Setiap properti di dalam `state` bisa diakses langsung di template HTML.

---

## Langkah 2: Menambahkan Interaksi

Teks statis itu tidak terlalu menarik. Mari kita tambahkan sebuah tombol yang mengubah pesan saat diklik.

Ubah kode HTML dan JavaScript-mu menjadi seperti ini:

```html
<div raa-core:app="halo">
  <p raa-bind:text="pesan"></p>

  <!-- Tombol yang memanggil method saat diklik -->
  <button raa-on:click="ubahPesan()">Klik Aku!</button>
</div>

<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>

<script>
  RaaJS.define('halo', () => ({
    state: {
      pesan: 'Halo, Dunia!'
    },
    methods: {
      ubahPesan() {
        this.pesan = 'RaaJS itu luar biasa! 🚀';
      }
    }
  }));
</script>
```

Klik tombolnya. Teks langsung berubah. Tanpa DOM manipulation. Tanpa event listener manual. Hanya dengan mengubah `this.pesan`, tampilan ikut berubah secara ajaib.

### Yang Baru: `methods` dan `raa-on:click`

**`methods`** adalah tempat kamu meletakkan semua fungsi yang bisa dipanggil dari template. Di dalam method, kamu menggunakan `this` untuk mengakses dan mengubah `state`.

**`raa-on:click="ubahPesan()"`** adalah cara RaaJS menangani event. Format umumnya adalah `raa-on:[nama-event]="ekspresi"`. Ini bisa digunakan untuk event apa pun: `click`, `input`, `change`, `keydown`, `submit`, dan seterusnya.

---

## Langkah 3: Two-Way Binding — Data yang Mengalir Dua Arah

Sekarang mari kita buat sesuatu yang lebih interaktif: input teks yang terhubung langsung ke tampilan. Saat kamu mengetik, teks di layar langsung berubah mengikutinya.

```html
<div raa-core:app="halo">
  <!-- Input yang terhubung ke state -->
  <input type="text" raa-bind:model="nama" placeholder="Ketik namamu...">

  <!-- Tampilan yang reaktif terhadap perubahan 'nama' -->
  <p raa-bind:text="'Halo, ' + nama + '! Selamat datang di RaaJS.'"></p>
</div>

<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>

<script>
  RaaJS.define('halo', () => ({
    state: {
      nama: ''
    }
  }));
</script>
```

Ketik sesuatu di input. Perhatikan teks di bawahnya berubah secara real-time setiap kali kamu menekan tombol keyboard.

### Yang Baru: `raa-bind:model`

`raa-bind:model="nama"` menciptakan **ikatan dua arah** antara elemen input dan properti `nama` di state:

- Saat pengguna mengetik → nilai `nama` di state diperbarui secara otomatis.
- Saat `nama` di state berubah (dari kode) → nilai input ikut berubah.

Inilah bedanya dengan `raa-bind:text` yang hanya satu arah (state → tampilan). `raa-bind:model` mengalir ke dua arah.

> **Catatan ekspresi:** Di `raa-bind:text`, kamu bisa menulis ekspresi JavaScript sederhana seperti `'Halo, ' + nama + '!'`. Tanda kutip tunggal digunakan untuk string literal di dalam ekspresi. Kita akan bahas lebih lanjut di [Sintaks Ekspresi](submenu-4-1.md).

---

## Langkah 4: Menampilkan Konten Bersyarat

Bagaimana jika kamu ingin menampilkan sesuatu hanya ketika kondisi tertentu terpenuhi? Gunakan `raa-flow:if`.

```html
<div raa-core:app="halo">
  <input type="text" raa-bind:model="nama" placeholder="Ketik namamu...">

  <!-- Hanya muncul jika nama sudah diisi -->
  <template raa-flow:if="nama.length > 0">
    <p>Hai, <strong raa-bind:text="nama"></strong>! 👋</p>
    <p>Nama kamu terdiri dari <span raa-bind:text="nama.length"></span> karakter.</p>
  </template>

  <!-- Muncul jika nama masih kosong -->
  <template raa-flow:if="nama.length === 0">
    <p style="color: gray;">Ketikkan namamu di atas untuk memulai...</p>
  </template>
</div>

<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>

<script>
  RaaJS.define('halo', () => ({
    state: { nama: '' }
  }));
</script>
```

### Yang Baru: `raa-flow:if` dan `<template>`

`raa-flow:if="kondisi"` akan merender konten di dalam `<template>` **hanya jika kondisi bernilai `true`**. Saat kondisi menjadi `false`, konten dihapus dari DOM sepenuhnya.

Kenapa harus pakai `<template>`? Karena `<template>` adalah elemen HTML yang **tidak terlihat di halaman** — ia hanya berfungsi sebagai wadah. Ini memastikan tidak ada elemen pembungkus ekstra yang mengacaukan struktur layout-mu.

---

## Langkah 5: Merender Daftar (Loop)

Hampir setiap aplikasi nyata perlu menampilkan daftar data. Di RaaJS, ini dilakukan dengan `raa-flow:for`.

```html
<div raa-core:app="halo">
  <!-- Form tambah item -->
  <div>
    <input type="text" raa-bind:model="itemBaru" placeholder="Tambah hobi...">
    <button raa-on:click="tambahHobi()">Tambah</button>
  </div>

  <!-- Daftar hobi -->
  <ul>
    <template raa-flow:for="hobi in daftarHobi" raa-key="hobi">
      <li raa-bind:text="hobi"></li>
    </template>
  </ul>

  <!-- Pesan jika list kosong -->
  <template raa-flow:if="daftarHobi.length === 0">
    <p style="color: gray;">Belum ada hobi yang ditambahkan.</p>
  </template>
</div>

<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>

<script>
  RaaJS.define('halo', () => ({
    state: {
      itemBaru: '',
      daftarHobi: ['Membaca', 'Coding', 'Menggambar']
    },
    methods: {
      tambahHobi() {
        const hobi = this.itemBaru.trim();
        if (!hobi) return; // Abaikan jika kosong
        this.daftarHobi.push(hobi);
        this.itemBaru = ''; // Kosongkan input setelah tambah
      }
    }
  }));
</script>
```

### Yang Baru: `raa-flow:for` dan `raa-key`

`raa-flow:for="hobi in daftarHobi"` akan merender konten `<template>` sebanyak jumlah item di array `daftarHobi`. Variabel `hobi` mewakili setiap item di iterasi saat ini.

`raa-key="hobi"` membantu RaaJS mengidentifikasi setiap item secara unik. Ini penting untuk performa — dengan key yang tepat, RaaJS hanya memperbarui item yang berubah, bukan merender ulang seluruh daftar. Nilai key sebaiknya **unik** dan **stabil** (biasanya ID dari data).

---

## Menggabungkan Semuanya: Aplikasi Hello World Lengkap

Sekarang mari kita gabungkan semua yang telah kita pelajari menjadi satu aplikasi yang utuh dan bermakna — sebuah kartu ucapan interaktif:

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kartu Ucapan — RaaJS</title>
  <style>
    body { font-family: sans-serif; max-width: 480px; margin: 40px auto; padding: 0 16px; }
    .kartu { border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-top: 24px; }
    input, select { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; width: 100%; margin-bottom: 12px; box-sizing: border-box; }
    button { background: #3b82f6; color: white; border: none; border-radius: 8px; padding: 10px 20px; cursor: pointer; }
    .label { font-size: 12px; color: #64748b; font-weight: 600; margin-bottom: 4px; }
  </style>
</head>
<body>

  <h2>🎴 Generator Kartu Ucapan</h2>

  <div raa-core:app="kartuUcapan">

    <!-- Form Input -->
    <div>
      <p class="label">Nama Penerima</p>
      <input type="text" raa-bind:model="namaPenerima" placeholder="Contoh: Budi Santoso">

      <p class="label">Pilih Acara</p>
      <select raa-bind:model="acara">
        <option value="ulang-tahun">🎂 Ulang Tahun</option>
        <option value="pernikahan">💍 Pernikahan</option>
        <option value="kelulusan">🎓 Kelulusan</option>
        <option value="tahun-baru">🎆 Tahun Baru</option>
      </select>

      <p class="label">Pesan Pribadi (opsional)</p>
      <input type="text" raa-bind:model="pesanPribadi" placeholder="Tambahkan pesan spesialmu...">

      <button raa-on:click="buatKartu()">Buat Kartu ✨</button>
    </div>

    <!-- Kartu Preview (hanya muncul setelah dibuat) -->
    <template raa-flow:if="tampilKartu">
      <div class="kartu">
        <p style="font-size: 24px; margin: 0 0 8px;">
          <span raa-bind:text="ikonAcara()"></span>
        </p>
        <h3 style="margin: 0 0 8px;">
          Kepada: <span raa-bind:text="namaPenerima"></span>
        </h3>
        <p raa-bind:text="ucapanUtama()"></p>
        <template raa-flow:if="pesanPribadi.length > 0">
          <p style="color: #64748b; font-style: italic;" raa-bind:text="'&quot;' + pesanPribadi + '&quot;'"></p>
        </template>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 16px;">Dibuat dengan ❤️ menggunakan RaaJS v3.1.0</p>
      </div>
    </template>

  </div>

  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>

  <script>
    RaaJS.define('kartuUcapan', () => ({
      state: {
        namaPenerima: '',
        acara: 'ulang-tahun',
        pesanPribadi: '',
        tampilKartu: false
      },
      methods: {
        buatKartu() {
          if (!this.namaPenerima.trim()) {
            alert('Mohon isi nama penerima terlebih dahulu!');
            return;
          }
          this.tampilKartu = true;
        },
        ikonAcara() {
          const ikon = {
            'ulang-tahun': '🎂',
            'pernikahan': '💍',
            'kelulusan': '🎓',
            'tahun-baru': '🎆'
          };
          return ikon[this.acara] || '🎉';
        },
        ucapanUtama() {
          const ucapan = {
            'ulang-tahun': 'Selamat ulang tahun! Semoga hari-harimu selalu dipenuhi kebahagiaan dan kesuksesan.',
            'pernikahan': 'Selamat menempuh hidup baru! Semoga pernikahan kalian menjadi berkah yang abadi.',
            'kelulusan': 'Selamat atas kelulusanmu! Ini bukan akhir, melainkan awal dari petualangan yang lebih besar.',
            'tahun-baru': 'Selamat tahun baru! Semoga tahun ini membawa hal-hal indah yang belum pernah kamu bayangkan.'
          };
          return ucapan[this.acara] || 'Selamat! Semoga semuanya berjalan indah.';
        }
      }
    }));
  </script>

</body>
</html>
```

Coba jalankan. Isi nama, pilih acara, tambahkan pesan pribadi, lalu klik tombol. Kartu ucapan akan muncul secara reaktif tanpa reload halaman.

---

## Apa yang Sebenarnya Terjadi di Balik Layar?

Kamu tidak perlu memahami ini untuk mulai coding, tapi mengetahuinya akan membantumu debugging lebih cepat di kemudian hari.

Saat `RaaJS.define('kartuUcapan', ...)` dipanggil dan RaaJS menemukan elemen `raa-core:app="kartuUcapan"` di HTML, ini yang terjadi secara berurutan:

```
1. RaaJS membungkus objek state-mu dengan JavaScript Proxy
   → Setiap pembacaan dan penulisan ke state terpantau secara otomatis

2. RaaJS memindai seluruh HTML di dalam root
   → Setiap direktif (raa-bind:*, raa-flow:*, raa-on:*) dicatat

3. Untuk setiap direktif binding, RaaJS membuat "Effect"
   → Effect adalah fungsi kecil yang tahu cara memperbarui satu bagian DOM

4. Effect dijalankan pertama kali → DOM diinisialisasi

5. Saat state berubah (misal: this.namaPenerima = 'Budi'):
   → Proxy mendeteksi perubahan
   → Effect yang bergantung pada 'namaPenerima' dijadwalkan ulang
   → DOM diperbarui secara efisien pada microtask berikutnya
```

Itulah mengapa kamu tidak perlu `document.getElementById` — karena RaaJS sudah "mendengarkan" setiap perubahan dan tahu tepat bagian mana dari DOM yang perlu diperbarui. Detail lebih dalam tentang ini ada di [Model Reaktivitas](submenu-2-1.md).

---

## Kesalahan Umum Pemula

Sebelum lanjut, kenali beberapa jebakan yang sering dialami saat pertama kali belajar RaaJS:

### ❌ Lupa tag `<template>` untuk `raa-flow:if` dan `raa-flow:for`

```html
<!-- ❌ Salah: menggunakan div biasa -->
<div raa-flow:if="tampil">Konten</div>

<!-- ✅ Benar: harus pakai template -->
<template raa-flow:if="tampil">
  <div>Konten</div>
</template>
```

### ❌ Nama aplikasi tidak cocok

```html
<!-- HTML menggunakan 'haloApp' -->
<div raa-core:app="haloApp">

<script>
  // ❌ JavaScript mendaftarkan 'halo' — tidak cocok!
  RaaJS.define('halo', () => ({ ... }));

  // ✅ Harus sama persis (case-sensitive)
  RaaJS.define('haloApp', () => ({ ... }));
</script>
```

### ❌ Memodifikasi state dari luar `this` di dalam method

```javascript
methods: {
  tambah() {
    // ❌ Salah: 'state' tidak terdefinisi di sini
    state.count++;

    // ✅ Benar: selalu gunakan 'this' untuk akses state
    this.count++;
  }
}
```

### ❌ Script aplikasi dimuat sebelum RaaJS

```html
<!-- ❌ Salah: RaaJS.define dipanggil sebelum RaaJS dimuat -->
<script>
  RaaJS.define('app', () => ({ ... })); // Error: RaaJS is not defined
</script>
<script src="raa.min.js"></script>

<!-- ✅ Benar: RaaJS core selalu lebih dulu -->
<script src="raa.min.js"></script>
<script>
  RaaJS.define('app', () => ({ ... }));
</script>
```

---

## Ringkasan: Yang Sudah Kamu Pelajari

Di halaman ini, kamu telah membangun aplikasi dari yang paling sederhana hingga yang cukup bermakna. Konsep-konsep yang sudah kamu kuasai:

| Konsep | Direktif | Apa yang Dilakukan |
|---|---|---|
| **Deklarasi Aplikasi** | `raa-core:app` + `RaaJS.define()` | Menghidupkan sebuah root sebagai aplikasi reaktif |
| **Tampilan Teks** | `raa-bind:text` | Menampilkan nilai state sebagai teks |
| **Two-Way Binding** | `raa-bind:model` | Menghubungkan input form ke state (dua arah) |
| **Event Handling** | `raa-on:click` | Memanggil method saat pengguna berinteraksi |
| **Kondisional** | `raa-flow:if` | Menampilkan/menyembunyikan konten berdasarkan kondisi |
| **Loop** | `raa-flow:for` | Merender daftar dari array |
| **State & Methods** | Konfigurasi factory | Tempat data dan logika aplikasi tinggal |

---

**← Sebelumnya:** [Instalasi Cepat](submenu-1-2.md) &nbsp;&nbsp;|&nbsp;&nbsp; **Berikutnya:** [Model Reaktivitas →](submenu-2-1.md)

---

*Dokumentasi ini adalah bagian dari RaaJS v3.1.0 Official Docs. Kontribusi dan koreksi disambut di repositori resmi.*

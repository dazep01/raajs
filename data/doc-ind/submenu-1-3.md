# Konsep Hello World

> **Versi:** RaaJS v3.1.1 "The Iron Sanctuary"

> Di halaman ini, kita akan membangun aplikasi pertamamu dari nol — selangkah demi selangkah, dengan penjelasan di setiap baris kode. Tidak ada yang terlewat, tidak ada yang diasumsikan sudah kamu tahu.

> **📌 Catatan v3.1.1:** Rilis ini adalah patch keamanan & performa — **tidak ada perubahan apa pun pada cara kerja tutorial ini**. Semua direktif dan API yang kamu pelajari di sini identik dengan v3.1.0. Yang berubah hanyalah mesin di baliknya: kini lebih aman (proteksi *prototype pollution*, sanitasi URL berbahaya) dan lebih cepat (cache scope proxy, scheduler 4 priority bucket).

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
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.1/engine/raa.min.js"></script>

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

Atribut `raa-core:app="halo"` memberitahu RaaJS: *"Elemen* `<div>` *ini adalah rumah dari aplikasi bernama 'halo'. Kelola semuanya yang ada di dalam sini."*

Elemen ini disebut **root**. Semua direktif RaaJS di dalam root ini akan aktif dan reaktif. Di luar root ini, RaaJS tidak bekerja.

> **💡 Bonus "did you mean?":** Jika nama aplikasi di `raa-core:app` tidak ditemukan (misalnya salah ketik `"hallo"` padahal kamu mendaftarkan `"halo"`), RaaJS akan menampilkan peringatan `[RaaJS warn:APP_NOT_FOUND]` di konsol — lengkap dengan saran nama terdekat: `Did you mean "halo" ?`. Fitur kecil ini akan sering menyelamatkanmu dari typo.

### Bagian 2: `raa-bind:text`

```html
<p raa-bind:text="pesan"></p>
```

`raa-bind:text="pesan"` artinya: *"Tampilkan nilai dari variabel* `pesan` *sebagai teks di elemen* `<p>` *ini."*

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

> **⚠️ Validasi ketat:** `RaaJS.define()` akan melempar error jika nama bukan string non-kosong, atau jika argumen kedua bukan fungsi. Jadi `RaaJS.define('app', { state: {...} })` (objek langsung, tanpa fungsi) akan gagal — selalu bungkus konfigurasimu dalam factory function `() => ({ ... })`.

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

<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.1/engine/raa.min.js"></script>
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

**`methods`** adalah tempat kamu meletakkan semua fungsi yang bisa dipanggil dari template. Di dalam method, kamu menggunakan `this` untuk mengakses dan mengubah `state`. (Secara internal, setiap method di-*bind* langsung ke state reaktif — itulah mengapa `this.pesan` di dalam method merujuk persis ke `pesan` yang sama dengan yang dibaca template.)

**`raa-on:click="ubahPesan()"`** adalah cara RaaJS menangani event. Format umumnya adalah `raa-on:[nama-event]="ekspresi"`. Ini bisa digunakan untuk event apa pun: `click`, `input`, `change`, `keydown`, `submit`, dan seterusnya.

> **💡 Modifier event:** `raa-on:` juga mendukung modifier yang dirangkai dengan titik: `.prevent` (memanggil `preventDefault()`), `.stop` (memanggil `stopPropagation()`), dan `.self` (handler hanya jalan jika event berasal dari elemen itu sendiri). Contoh: `raa-on:submit.prevent="kirimForm()"`. Di dalam ekspresi, objek event tersedia sebagai `$event`.

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

<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.1/engine/raa.min.js"></script>
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

> **Catatan jenis input:** `raa-bind:model` cerdas terhadap jenis elemennya — untuk `checkbox` ia menyimpan `true`/`false`, untuk `radio` ia menyimpan `value` dari pilihan yang dicentang, dan untuk `<select>` ia mendengarkan event `change` (bukan `input`). Kamu tidak perlu mengatur apa pun; semuanya otomatis.

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

<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.1/engine/raa.min.js"></script>
<script>
  RaaJS.define('halo', () => ({
    state: { nama: '' }
  }));
</script>
```

### Yang Baru: `raa-flow:if` dan `<template>`

`raa-flow:if="kondisi"` akan merender konten di dalam `<template>` **hanya jika kondisi bernilai `true`**. Saat kondisi menjadi `false`, konten dihapus dari DOM sepenuhnya.

Kenapa harus pakai `<template>`? Karena `<template>` adalah elemen HTML yang **tidak terlihat di halaman** — ia hanya berfungsi sebagai wadah. Ini memastikan tidak ada elemen pembungkus ekstra yang mengacaukan struktur layout-mu.

> **⚠️ Diperketat di engine:** Direktif `raa-flow:if` dan `raa-flow:for` **hanya diproses jika dipasang pada elemen `<template>`** — engine memeriksa nama tag secara eksplisit. Jika kamu memasangnya di `<div>` atau elemen lain, direktif itu diabaikan begitu saja tanpa error. Jika kondisionalmu "tidak jalan", ini hal pertama yang harus dicek. (Untuk sekadar menyembunyikan elemen biasa via CSS `display`, gunakan `raa-flow:show` — yang ini boleh di elemen apa pun.)

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

<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.1/engine/raa.min.js"></script>
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

> **💡 Butuh nomor urut?** `raa-flow:for` juga mendukung sintaks dengan index: `raa-flow:for="hobi, i in daftarHobi"`. Variabel `i` berisi posisi item (mulai dari 0) dan bisa dipakai di dalam template, misalnya `raa-bind:text="(i + 1) + '. ' + hobi"`.

> **🛡️ Pengaman raa-key:** Engine punya aturan ketat untuk key. Jika `raa-key` menghasilkan nilai non-primitif (objek/fungsi), RaaJS jatuh kembali ke index — dan di mode debug akan muncul peringatan di konsol. Jika ada **key duplikat** dalam satu render, key duplikat tersebut otomatis diberi sufiks unik agar diffing tetap benar (juga dengan peringatan di mode debug). Aktifkan `debug: true` saat development agar masalah key seperti ini langsung terlihat.

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

        <p style="font-size: 12px; color: #94a3b8; margin-top: 16px;">Dibuat dengan ❤️ menggunakan RaaJS v3.1.1</p>
      </div>
    </template>

  </div>

  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.1/engine/raa.min.js"></script>
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

> **⚡ Lebih cepat di v3.1.1:** Dua optimasi internal membuat siklus di atas lebih ringan tanpa mengubah perilakunya. Pertama, *scope proxy* (lapisan yang membuat ekspresi seperti `pesan` bisa dibaca langsung di template) kini di-*cache* per pasangan elemen-state via WeakMap, bukan dibuat ulang di setiap evaluasi. Kedua, penjadwalan effect (langkah 5) kini memakai 4 antrean prioritas (HIGH/NORMAL/LOW/IDLE) sehingga proses flush berjalan O(N), bukan O(N log N).

> **🔒 Lebih aman di v3.1.1:** Evaluator ekspresi kini memblokir akses ke properti berbahaya (`__proto__`, `constructor`, `prototype`) dan semua kunci internal engine (berawalan `__raa_`), baik saat membaca di template maupun saat menulis lewat `raa-bind:model`. Nilai URL pada binding atribut (`raa-bind:href`, `raa-bind:src`, dll) juga otomatis disanitasi dari skema berbahaya seperti `javascript:`.

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

> Di v3.1.1, kasus ini lebih mudah dideteksi: konsol akan menampilkan `[RaaJS warn:APP_NOT_FOUND]` beserta saran nama terdekat ("did you mean?").

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

### ❌ Menggunakan nama properti terlarang di ekspresi *(diperketat di v3.1.1)*

```html
<!-- ❌ Salah: properti berbahaya/internal diblokir oleh engine -->
<p raa-bind:text="data.constructor.name"></p>     <!-- Error: blocked property -->
<input raa-bind:model="user.__proto__.role">      <!-- Error: assignment blocked -->
<p raa-bind:text="el.__raa_state__"></p>          <!-- Error: kunci internal __raa_* -->

<!-- ✅ Benar: gunakan properti data biasa milikmu sendiri -->
<p raa-bind:text="data.nama"></p>
<input raa-bind:model="user.role">
```

Mulai v3.1.1, ekspresi yang mencoba mengakses `__proto__`, `constructor`, `prototype`, atau kunci internal berawalan `__raa_` akan **dihentikan dengan error eksplisit** — baik saat dibaca maupun saat ditulis. Ini melindungi aplikasimu dari serangan *prototype pollution*. Dalam praktik sehari-hari kamu tidak akan pernah membutuhkan properti-properti ini, jadi anggap saja aturan ini sebagai sabuk pengaman yang tak terasa.

### ❌ Mengandalkan sintaks JavaScript yang tidak didukung di ekspresi template

```html
<!-- ❌ Salah: nullish coalescing (??) dan template literal tidak didukung -->
<p raa-bind:text="nama ?? 'Anonim'"></p>
<p raa-bind:text="`Halo, ${nama}`"></p>

<!-- ✅ Benar: gunakan ternary dan penyambungan string (+) -->
<p raa-bind:text="nama != null ? nama : 'Anonim'"></p>
<p raa-bind:text="'Halo, ' + nama"></p>
```

Bahasa ekspresi RaaJS sengaja dibatasi (demi keamanan scope dan kompatibilitas CSP). Yang didukung antara lain: literal, akses member (`a.b`, `a[0]`), *optional chaining* (`a?.b`), pemanggilan fungsi, operator unary/binary/logika, ternary, serta global aman seperti `Math`, `Date`, dan `JSON`. Detailnya di [Sintaks Ekspresi](submenu-4-1.md).

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

*Dokumentasi ini adalah bagian dari RaaJS v3.1.1 Official Docs. Kontribusi dan koreksi disambut di repositori resmi.*

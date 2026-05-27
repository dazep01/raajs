# 🔄 State Management

> **Versi:** RaaJS v3.1.0 "Data Liberation"
> *Panduan Naratif: Mengelola Data Aplikasi dari Sederhana hingga Canggih*

State adalah **jantung** dari setiap aplikasi RaaJS. Ia menentukan apa yang dilihat pengguna, bagaimana aplikasi bereaksi, dan data apa yang diingat. Di panduan ini, kita akan bedah tuntas cara mendeklarasikan, mengorganisasi, berbagi, dan mempersistensikan state — dengan gaya yang mengalir, teknis yang padat, dan contoh yang langsung bisa dipraktikkan.

---

## 🫀 Apa Itu State? (Dan Kenapa Ia Sangat Penting)

**State** adalah kumpulan semua data yang dimiliki aplikasimu pada satu momen tertentu. Ia adalah "foto instan" dari kondisi aplikasi: apa yang sedang ditampilkan, apa yang sedang diproses, dan apa yang sudah diketahui aplikasi tentang penggunanya.

### 🍽️ Analogi: Papan Status di Dapur Restoran

Bayangkan state seperti **papan status digital** di dapur restoran modern:

```
📋 PAPAN STATUS DAPUR
├─ Meja 3: Nasi Goreng (⏳ Memasak)
├─ Meja 5: Es Teh (✅ Siap Saji)
├─ Meja 7: Ayam Bakar (🔄 Menunggu Bumbu)
└─ Stok: Telur (⚠️ Hampir Habis)
```

Setiap kali ada perubahan — pesanan baru masuk, masakan selesai, stok menipis — papan ini diperbarui. Dan semua staf (koki, pelayan, kasir) yang melihat papan tersebut **langsung tahu apa yang harus dilakukan**, tanpa perlu ada yang berlari memberitahu satu per satu.

Di RaaJS:
- **State** = papan status tersebut
- **Direktif HTML** (`raa-bind:`, `raa-flow:`, dll) = staf yang memantau papan
- **Reaktivitas** = sistem notifikasi otomatis yang membuat semua "staf" sinkron

> 🎯 *Intinya: Kamu cukup ubah state di satu tempat, dan seluruh UI yang bergantung padanya akan otomatis diperbarui. Tidak perlu manipulasi DOM manual.*

---

## 🏗️ Anatomi `RaaJS.define()`: Blueprint Aplikasi Kamu

Semua definisi aplikasi RaaJS dimulai dari `RaaJS.define()`. Fungsi ini menerima sebuah **factory function** — sebuah fungsi yang dipanggil saat aplikasi diinisialisasi dan mengembalikan konfigurasi lengkap aplikasimu.

### 🔄 Alur Eksekusi `RaaJS.define()`

Berikut urutan yang terjadi saat `RaaJS.define()` diproses:

1. **Factory function dipanggil** — Saat root aplikasi ditemukan di DOM dan mulai dikompilasi
2. **Objek konfigurasi dikembalikan** — Berisi `state`, `methods`, dan `init`
3. **State dibungkus Proxy** — Agar setiap perubahan bisa dilacak untuk reaktivitas
4. **Methods diikat ke state** — Agar `this` di dalam method merujuk ke state yang sama
5. **`init()` dijadwalkan** — Akan dijalankan via `queueMicrotask` setelah kompilasi selesai

### 📦 Struktur Lengkap Definisi Aplikasi

```javascript
RaaJS.define('namaApp', () => ({

  // ─── 1. STATE ────────────────────────────────────────────────────
  // Semua data reaktif aplikasimu dideklarasikan di sini.
  // Setiap properti di sini bisa diakses langsung dari template HTML.
  state: {
    // Primitif
    judul: 'Aplikasi Saya',
    counter: 0,
    aktif: false,

    // Objek
    user: {
      nama: '',
      email: '',
      role: 'guest'
    },

    // Array
    daftar: [],

    // Nilai awal null untuk data yang belum tersedia
    dataApi: null,
    errorPesan: ''
  },

  // ─── 2. METHODS ──────────────────────────────────────────────────
  // Semua fungsi yang bisa dipanggil dari template HTML.
  // Di dalam method, gunakan 'this' untuk mengakses dan mengubah state.
  methods: {
    tambah() {
      this.counter++;
    },
    reset() {
      this.counter = 0;
      this.aktif = false;
    },
    async muatData() {
      try {
        const res = await fetch('/api/data');
        this.dataApi = await res.json();
      } catch (e) {
        this.errorPesan = 'Gagal memuat data.';
      }
    }
  },

  // ─── 3. INIT ─────────────────────────────────────────────────────
  // Dipanggil SEKALI setelah seluruh root selesai dikompilasi.
  // Gunakan untuk: fetching data awal, setup timer, cek auth, dsb.
  // 'this' merujuk ke state.
  init() {
    console.log('Aplikasi siap!');
    this.muatData();
  }

}));
```

> 💡 **Kenapa factory function `() => ({})`, bukan objek langsung `{}`?**
>
> Menggunakan factory function memastikan setiap instance aplikasi mendapatkan **salinan state yang benar-benar baru**. Jika kamu punya dua elemen dengan `raa-core:app="widget"` di halaman yang sama, masing-masing akan memiliki state terpisah. Jika menggunakan objek literal langsung, keduanya akan berbagi referensi objek yang sama — dan perubahan di satu widget akan memengaruhi widget lainnya. Ini adalah bug yang sulit dilacak!

---

## 📚 Bagian `state`: Aturan Emas dan Praktik Terbaik

### 🎯 Aturan #1: Deklarasikan Semua Properti dari Awal

Seperti yang sudah dibahas di Model Reaktivitas, **hanya properti yang dideklarasikan sejak awal yang akan reaktif**. Jika kamu menambahkan properti baru di tengah jalan (misal: `this.baru = 'x'`), properti tersebut tidak akan memicu update DOM.

Selalu inisialisasi properti dengan nilai yang masuk akal, meskipun nilainya "kosong":

```javascript
state: {
  // ✅ Baik — tipe data jelas, mudah diprediksi, reaktif sejak awal
  nama: '',              // string kosong, bukan null
  usia: 0,               // angka nol, bukan null
  aktif: false,          // boolean eksplisit
  daftar: [],            // array kosong, bukan null
  config: {},            // objek kosong, bukan null
  
  // ✅ Null boleh digunakan untuk data yang memang belum tersedia
  dataServer: null,      // akan diisi setelah fetch
  errorPesan: null       // akan diisi jika ada error
}
```

### 🎯 Aturan #2: Struktur State yang Semantik dan Terkelompok

State yang terstruktur dengan baik bukan hanya enak dibaca — ia juga memudahkan debugging, testing, dan kolaborasi tim.

```javascript
// ❌ Flat dan ambigu — susah dibaca, rentan typo, sulit diskalakan
state: {
  nama_depan: '',
  nama_belakang: '',
  email_user: '',
  role_user: 'guest',
  is_loading_users: false,
  users_list: [],
  error_users: null
}

// ✅ Terstruktur dan semantik — jelas, terkelompok, mudah dikembangkan
state: {
  user: {
    namaDepan: '',
    namaBelakang: '',
    email: '',
    role: 'guest'
  },
  users: {
    daftar: [],
    sedangMuat: false,
    error: null
  }
}
```

> 🎯 *Tips: Gunakan camelCase untuk konsistensi dengan JavaScript standar, dan kelompokkan properti yang berkaitan ke dalam objek nested.*

---

## ⚙️ Bagian `methods`: Cara Aman Bekerja dengan State

Methods adalah **satu-satunya tempat yang direkomendasikan** untuk memodifikasi state secara eksplisit. Di dalam setiap method, kata kunci `this` merujuk langsung ke objek state yang reaktif.

### 🔍 Mengakses dan Memodifikasi State via `this`

```javascript
methods: {
  contoh() {
    // ✅ Membaca state
    console.log(this.counter);           // primitif
    console.log(this.user.nama);         // nested object
    console.log(this.daftar[0]);         // elemen array

    // ✅ Mengubah state (memicu reaktivitas)
    this.counter = 10;                   // set primitif
    this.user.nama = 'Budi';             // update nested property
    this.daftar.push({ id: 1 });         // mutasi array

    // ✅ Memanggil method lain
    this.reset();
    this.muatData();
  }
}
```

### 🌐 Method Asinkronus: Fetch Data dengan Elegan

RaaJS mendukung penuh method `async/await`. State akan diperbarui secara reaktif begitu nilai baru di-assign, meskipun di dalam fungsi asinkronus:

```javascript
methods: {
  async ambilProduk() {
    // Tampilkan loading state
    this.sedangMuat = true;
    this.errorPesan = null;

    try {
      const response = await fetch('https://api.contoh.com/produk');

      if (!response.ok) {
        throw new Error('Server error: ' + response.status);
      }

      const data = await response.json();
      this.daftarProduk = data; // ← Ini memicu reaktivitas secara normal

    } catch (err) {
      this.errorPesan = err.message; // ← Error handling yang reaktif

    } finally {
      this.sedangMuat = false; // ← Selalu dijalankan, sukses maupun gagal
    }
  }
}
```

#### 🎨 Template yang Merespons Seluruh Siklus Loading

```html
<div raa-core:app="produkApp">

  <!-- State: sedang memuat -->
  <template raa-flow:if="sedangMuat">
    <p>⏳ Memuat data produk...</p>
  </template>

  <!-- State: ada error -->
  <template raa-flow:if="errorPesan">
    <p style="color:red;" raa-bind:text="'Error: ' + errorPesan"></p>
  </template>

  <!-- State: data siap ditampilkan -->
  <template raa-flow:if="!sedangMuat && !errorPesan">
    <template raa-flow:for="produk in daftarProduk" raa-key="produk.id">
      <div raa-bind:text="produk.nama"></div>
    </template>
  </template>

  <button raa-on:click="ambilProduk()">Muat Produk</button>

</div>
```

> 🎯 *Pattern ini memungkinkan UI-mu secara deklaratif merespons setiap fase dari operasi asinkronus — tanpa callback hell atau state management yang rumit.*

### 🎁 Method dengan Parameter: Fleksibilitas dari Template

Method bisa menerima parameter langsung dari template, memungkinkan interaksi yang dinamis:

```javascript
// JavaScript: definisi method dengan parameter
methods: {
  hapusItem(id) {
    this.daftar = this.daftar.filter(item => item.id !== id);
  },
  ubahStatus(id, statusBaru) {
    const item = this.daftar.find(item => item.id === id);
    if (item) item.status = statusBaru;
  }
}
```

```html
<!-- Template: mengirim argumen dari loop -->
<template raa-flow:for="item in daftar" raa-key="item.id">
  <div>
    <span raa-bind:text="item.nama"></span>
    
    <!-- Kirim argumen langsung dari template -->
    <button raa-on:click="hapusItem(item.id)">Hapus</button>
    <button raa-on:click="ubahStatus(item.id, 'selesai')">Selesai</button>
  </div>
</template>
```

> 💡 *Tips: Parameter di template dievaluasi dalam konteks state aplikasi, jadi kamu bisa mengirim `item`, `item.id`, `index`, atau bahkan ekspresi seperti `item.harga * 2`.*

---

## 🚀 Bagian `init()`: Titik Awal Aplikasi yang Terkontrol

`init()` dipanggil **satu kali** oleh RaaJS setelah seluruh root selesai dikompilasi. Ini adalah tempat yang tepat untuk logika startup yang hanya perlu dijalankan sekali.

### 🔄 Urutan Eksekusi `init()` dalam Siklus Hidup

Berikut alur lengkap kapan `init()` dijalankan:

1. Browser memicu `DOMContentLoaded`
2. RaaJS menemukan elemen dengan `raa-core:app`
3. State dibungkus Proxy untuk reaktivitas
4. Semua direktif di subtree dikompilasi (Pass 1 & Pass 2)
5. **`init()` dijadwalkan via `queueMicrotask`** — dijalankan setelah stack JavaScript saat ini selesai
6. Di dalam `init()`, kamu bisa: fetch data awal, setup timer, cek autentikasi, dll
7. Perubahan state dari `init()` akan memicu update DOM secara normal

### 💻 Contoh: Inisialisasi Dashboard dengan Parallel Fetch

```javascript
RaaJS.define('dashboardApp', () => ({
  state: {
    user: null,
    notifikasi: [],
    pengaturan: {}
  },
  methods: {
    async cekAuth() { /* ... */ },
    async muatNotifikasi() { /* ... */ },
    async muatPengaturan() { /* ... */ }
  },
  init() {
    // Jalankan beberapa operasi async secara paralel untuk performa optimal
    Promise.all([
      this.cekAuth(),
      this.muatNotifikasi(),
      this.muatPengaturan()
    ]).then(() => {
      console.log('Dashboard siap sepenuhnya!');
    });
  }
}));
```

### 🎯 `init()` vs `raa-core:init`: Kapan Menggunakan yang Mana?

| Aspek | `init()` di factory | `raa-core:init` di HTML |
|-------|---------------------|-------------------------|
| **Lingkup** | Satu kali per root aplikasi | Satu kali per elemen yang memiliki atribut ini |
| **Timing** | Setelah seluruh root dikompilasi | Saat elemen tersebut dikompilasi |
| **Jumlah** | Hanya satu per aplikasi | Bisa banyak, satu per elemen |
| **Cocok untuk** | Startup global: fetch data, cek auth, setup analytics | Inisialisasi per-komponen: fokus input, inisialisasi library pihak ketiga |

> 💡 *Pattern umum: Gunakan `init()` untuk setup aplikasi secara keseluruhan, dan `raa-core:init` untuk setup komponen individual yang perlu diinisialisasi saat dirender.*

---

## 🌐 Berbagi Data Antar Aplikasi: Global Store (`$store`)

Bagaimana jika kamu punya beberapa aplikasi (`raa-core:app`) di halaman yang sama dan perlu berbagi data di antara mereka? Gunakan **Global Store**.

Global Store adalah objek JavaScript biasa yang bisa diakses dari **semua** aplikasi dan template melalui variabel khusus `$store`.

### 🛠️ Cara Mendefinisikan Global Store

Global Store diatur saat membuat instance RaaJS. Normalnya RaaJS membuat instance secara otomatis, tapi kamu bisa mengonfigurasinya sebelum `DOMContentLoaded`:

#### Opsi 1: Modifikasi instance yang sudah ada

```html
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>
<script>
  // Tambahkan ke store yang sudah ada SEBELUM aplikasi dikompilasi
  document.addEventListener('DOMContentLoaded', () => {
    Object.assign(window.Raa.globalStore, {
      appVersion: '3.1.0',
      userSesiAktif: null,
      tema: 'dark',
      bahasa: 'id'
    });
  }, { once: true });
</script>
```

#### Opsi 2: Buat instance manual dengan konfigurasi store

```javascript
const raa = new RaaJS({
  store: {
    appVersion: '3.1.0',
    userSesiAktif: null,
    tema: 'dark',
    bahasa: 'id'
  }
});
// Pastikan instance ini tersedia sebelum DOMContentLoaded
window.Raa = raa;
```

### 🔗 Mengakses `$store` dari Template: Cross-App Reactivity

```html
<!-- Aplikasi A: Header -->
<div raa-core:app="headerApp">
  <p raa-bind:text="'Versi: ' + $store.appVersion"></p>
  <p raa-bind:text="$store.tema === 'dark' ? '🌙 Mode Gelap' : '☀️ Mode Terang'"></p>
</div>

<!-- Aplikasi B: Sidebar — di tempat lain di halaman yang sama -->
<div raa-core:app="sidebarApp">
  <!-- $store bisa diakses di sini juga! -->
  <p raa-bind:text="$store.bahasa"></p>
  <button raa-on:click="gantiBahasa('en')">Switch to English</button>
</div>
```

### 🔧 Mengakses dan Memodifikasi `$store` dari Method

```javascript
methods: {
  gantiBahasa(bahasa) {
    // Modifikasi $store dari method
    this.$store.bahasa = bahasa;
    
    // Semua template yang membaca $store.bahasa akan diperbarui otomatis
    // karena RaaJS melacak akses ke $store dalam efek reaktif
  },
  loginUser(userData) {
    this.$store.userSesiAktif = userData;
  }
}
```

### 🔄 Alur Reaktivitas Global Store

Berikut bagaimana perubahan di `$store` menyebar ke seluruh aplikasi:

1. Sebuah method di App A mengubah `this.$store.tema = 'light'`
2. RaaJS mendeteksi perubahan pada properti `$store` yang sedang dilacak
3. Semua efek reaktif di **semua aplikasi** yang membaca `$store.tema` dijadwalkan untuk dijalankan ulang
4. DOM di App A, App B, App C, dst. diperbarui secara sinkron
5. Pengguna melihat perubahan tema secara instan di seluruh halaman

> ⚠️ **Catatan penting:** Objek di dalam `$store` **tidak** dibungkus Proxy secara otomatis seperti `state` lokal aplikasi. Perubahan pada properti `$store` akan memicu reaktivitas **hanya jika** properti tersebut diakses dalam konteks efek reaktif. Untuk use case sederhana (konfigurasi, tema, user sesi), ini biasanya sudah cukup. Jika kamu butuh reaktivitas mendalam pada objek nested di `$store`, pertimbangkan untuk membungkusnya manual atau menggunakan state lokal + event bus.

---

## 💾 Mempersistensikan State: `raa-eco:persist`

Secara default, state RaaJS hilang begitu halaman di-refresh. Untuk menyimpan state ke `localStorage` secara otomatis, gunakan direktif `raa-eco:persist`:

```html
<!-- State aplikasi ini akan otomatis disimpan ke localStorage
     dengan kunci 'pengaturan-user' -->
<div raa-core:app="settingsApp" raa-eco:persist="pengaturan-user">
  <label>
    <input type="checkbox" raa-bind:model="darkMode">
    Mode Gelap
  </label>
  <input type="range" raa-bind:model="ukuranFont" min="12" max="24">
</div>
```

### 🔄 Alur Persistensi: Dari Load ke Save

Berikut bagaimana `raa-eco:persist` bekerja dari awal hingga akhir:

#### 📥 Saat Halaman Dimuat (Load)

1. Aplikasi dikompilasi, RaaJS melihat atribut `raa-eco:persist="pengaturan-user"`
2. RaaJS membaca `localStorage.getItem('pengaturan-user')`
3. Jika ada data, RaaJS mem-parse JSON dan merge ke state awal aplikasi
4. DOM dirender dengan preferensi yang tersimpan
5. Pengguna melihat aplikasi dalam keadaan terakhir yang mereka tinggalkan

#### 📤 Saat State Berubah (Save)

1. Pengguna mengubah `darkMode` dari `true` ke `false`
2. State berubah → DOM diperbarui (reaktivitas normal)
3. **Secara otomatis**, RaaJS mem-serialize state yang relevan ke JSON
4. JSON disimpan ke `localStorage` dengan kunci `'pengaturan-user'`
5. Proses ini terjadi setelah flush efek selesai, sehingga tidak memblokir UI

#### 🔄 Saat Halaman Di-refresh

1. Proses load berulang dari awal
2. Preferensi pengguna tetap terjaga — pengalaman yang mulus! 🎉

### 🧠 Apa yang Disimpan dan Tidak: Filter Cerdas RaaJS

RaaJS secara cerdas menyaring apa yang boleh disimpan ke localStorage agar tidak error saat serialisasi:

| Tipe Data | Disimpan? | Alasan |
|-----------|-----------|--------|
| `string`, `number`, `boolean` | ✅ Ya | Bisa di-serialisasi JSON dengan aman |
| Plain object `{}` | ✅ Ya | Bisa di-serialisasi JSON selama tidak ada fungsi/circular ref |
| Array `[]` | ✅ Ya | Bisa di-serialisasi JSON |
| Fungsi / method | ❌ Tidak | Tidak bisa di-serialisasi JSON; akan di-skip otomatis |
| Elemen DOM / `$refs` | ❌ Tidak | Tidak perlu dan tidak bisa dipersistensikan |
| Referensi circular | ❌ Tidak (dilewati) | Tidak bisa di-serialisasi; RaaJS akan skip properti tersebut |

> 💡 *Tips: Jika state-mu berisi data kompleks yang tidak bisa di-JSON.stringify, pertimbangkan untuk memisahkan data yang perlu persist ke objek terpisah.*

### 🎯 Tips: Selektif dalam Persisten — Pisahkan State Permanen vs Sementara

Tidak semua state perlu disimpan. Jika state-mu campuran antara data permanen dan data sementara, pertimbangkan untuk memisahkannya ke dalam dua aplikasi atau island:

```html
<!-- State permanen: disimpan ke localStorage -->
<div raa-core:app="preferensiApp" raa-eco:persist="preferensi-v1">
  <!-- darkMode, bahasa, ukuranFont, tema, dll -->
</div>

<!-- State sementara: tidak disimpan, reset setiap refresh -->
<div raa-core:app="sessionApp">
  <!-- keranjang belanja sementara, form yang belum dikirim, draft pesan, dll -->
</div>
```

> 🎯 *Pattern ini memungkinkan kamu memberikan pengalaman "ingat preferensi" tanpa membebani localStorage dengan data yang sebenarnya tidak perlu disimpan.*

---

## 🏝️ Isolasi State: Island Architecture dengan `raa-eco:island`

Kadang kamu butuh beberapa komponen di halaman yang sama dengan state yang **sepenuhnya terisolasi** satu sama lain. Inilah kegunaan `raa-eco:island`:

### 🎯 Use Case: Daftar Produk dengan Counter Independen

```html
<div class="daftar-produk">

  <!-- Island 1: Produk A -->
  <div raa-eco:island raa-core:init="Object.assign($state, { qty: 1, dibuka: false })">
    <h3>Produk A</h3>
    <button raa-on:click="qty > 1 ? qty-- : null">-</button>
    <span raa-bind:text="qty"></span>
    <button raa-on:click="qty++">+</button>
    <!-- qty di sini TIDAK mempengaruhi island lain -->
  </div>

  <!-- Island 2: Produk B -->
  <div raa-eco:island raa-core:init="Object.assign($state, { qty: 1, dibuka: false })">
    <h3>Produk B</h3>
    <button raa-on:click="qty > 1 ? qty-- : null">-</button>
    <span raa-bind:text="qty"></span>
    <button raa-on:click="qty++">+</button>
    <!-- qty ini independen dari Produk A -->
  </div>

</div>
```

### 🔒 Bagaimana Isolasi Bekerja

Berikut mekanisme di balik `raa-eco:island`:

1. Saat RaaJS menemukan elemen dengan `raa-eco:island`, ia membuat **state lokal terpisah** untuk elemen tersebut
2. State lokal ini **tidak berbagi referensi** dengan state aplikasi induk atau island lainnya
3. Variabel `$state` di dalam `raa-core:init` merujuk ke state lokal island tersebut
4. Perubahan di satu island **tidak memicu re-render** di island lain
5. Island bisa tetap mengakses `$store` global jika perlu berbagi data tertentu

> 🎯 *Pattern ini sangat berguna untuk komponen yang dirender berulang (list, grid, carousel) di mana setiap instance perlu mengelola state-nya sendiri tanpa interferensi.*

---

## 🔗 Referensi Elemen DOM: `$refs` untuk Interaksi Langsung

Selain state data, RaaJS juga mengelola referensi ke elemen DOM melalui `$refs`. Ini berguna ketika kamu perlu berinteraksi langsung dengan elemen DOM dari dalam method — misalnya untuk fokus input, scroll ke elemen tertentu, atau integrasi dengan library pihak ketiga.

### 💻 Contoh: Form dengan Fokus Otomatis

```html
<div raa-core:app="formApp">
  <input type="text"
         raa-core:ref="inputNama"
         raa-bind:model="nama"
         placeholder="Nama...">

  <input type="email"
         raa-core:ref="inputEmail"
         raa-bind:model="email"
         placeholder="Email...">

  <button raa-on:click="fokusNama()">Fokus ke Nama</button>
  <button raa-on:click="selectEmail()">Pilih Teks Email</button>
</div>

<script>
  RaaJS.define('formApp', () => ({
    state: { nama: '', email: '' },
    methods: {
      fokusNama() {
        this.$refs.inputNama.focus();
      },
      selectEmail() {
        this.$refs.inputEmail.focus();
        this.$refs.inputEmail.select();
      }
    }
  }));
</script>
```

### ⚠️ Catatan Penting: `$refs` dengan Nama yang Sama

Jika kamu memberikan `raa-core:ref` yang sama ke lebih dari satu elemen, `$refs.namaRef` akan berupa **array** berisi semua elemen tersebut, bukan satu elemen:

```html
<!-- Tiga input dengan ref yang sama -->
<input raa-core:ref="field" type="text">
<input raa-core:ref="field" type="text">
<input raa-core:ref="field" type="text">

<script>
  methods: {
    contoh() {
      // this.$refs.field adalah Array[3], bukan satu elemen
      console.log(Array.isArray(this.$refs.field)); // true
      
      // Akses elemen individual
      this.$refs.field[0].focus(); // fokus ke input pertama
      
      // Loop semua elemen
      this.$refs.field.forEach(el => el.classList.add('highlight'));
    }
  }
</script>
```

> 💡 *Tips: Gunakan nama ref yang unik untuk elemen tunggal, dan gunakan nama yang sama hanya ketika kamu memang ingin mengelompokkan elemen-elemen serupa.*

---

## 🧭 Pola Arsitektur State: Panduan Memilih yang Tepat

Dengan semua pilihan yang tersedia, bagaimana memutuskan mana yang sebaiknya digunakan? Berikut panduan naratif berbasis skenario:

### 🎯 Skenario 1: Data Hanya Dipakai di Satu Aplikasi

**Pertanyaan:** Apakah data ini hanya diakses oleh satu aplikasi (`raa-core:app`)?

- **Ya, dan tidak perlu disimpan setelah refresh**  
  → Gunakan `state` di `RaaJS.define()` tanpa persist.  
  *Contoh: Counter sementara, state UI toggle, form yang belum dikirim.*

- **Ya, dan perlu disimpan setelah refresh**  
  → Gunakan `state` + `raa-eco:persist`.  
  *Contoh: Preferensi tema, bahasa, pengaturan tampilan.*

### 🎯 Skenario 2: Data Dipakai oleh Beberapa Aplikasi

**Pertanyaan:** Apakah data ini perlu diakses oleh lebih dari satu aplikasi di halaman yang sama?

- **Ya**  
  → Gunakan **Global Store (`$store`)**.  
  *Contoh: User sesi aktif, versi aplikasi, konfigurasi global.*

> 💡 *Tips: Jika data di `$store` perlu reaktif mendalam, pastikan akses ke properti `$store` dilakukan dalam konteks efek reaktif (misal: di dalam `raa-bind:` atau method yang dipanggil dari template).*

### 🎯 Skenario 3: Komponen Berulang dengan State Independen

**Pertanyaan:** Apakah kamu merender banyak instance komponen yang sama, dan masing-masing perlu state sendiri?

- **Ya**  
  → Gunakan **`raa-eco:island`** dengan state lokal.  
  *Contoh: Kartu produk dengan counter qty, accordion dengan state terbuka/tertutup, carousel item.*

### 🗺️ Decision Tree Naratif

```
Data yang kamu butuhkan...
│
├─ Dipakai oleh satu aplikasi?
│  │
│  ├─ Perlu disimpan setelah refresh?
│  │  ├─ Ya → state + raa-eco:persist
│  │  └─ Tidak → state biasa di RaaJS.define()
│  │
│  └─ Perlu terisolasi per komponen?
│     ├─ Ya → raa-eco:island dengan state lokal
│     └─ Tidak → state biasa
│
└─ Dipakai oleh lebih dari satu aplikasi?
   └─ Ya → Global Store ($store)
```

> 🎯 *Pattern ini membantu kamu memilih arsitektur state yang tepat tanpa over-engineering. Mulai dari yang sederhana, lalu tingkatkan kompleksitas hanya jika diperlukan.*

---

## 📋 Contoh Lengkap: Aplikasi Todo dengan State Komprehensif

Berikut adalah contoh yang menggabungkan semua konsep state management yang telah kita pelajari. Kode ini bisa langsung kamu copy-paste dan jalankan:

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Todo App — State Management Demo</title>
  <style>
    body { font-family: sans-serif; max-width: 560px; margin: 40px auto; padding: 0 16px; }
    .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
    input[type=text] { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; flex: 1; }
    button { background: #3b82f6; color: white; border: none; border-radius: 8px; padding: 8px 16px; cursor: pointer; }
    button.merah { background: #ef4444; }
    button.abu { background: #94a3b8; }
    .baris { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
    .todo-item { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
    .selesai { text-decoration: line-through; color: #94a3b8; }
    .badge { background: #dbeafe; color: #1d4ed8; border-radius: 20px; padding: 2px 10px; font-size: 12px; font-weight: 600; }
    .badge.hijau { background: #dcfce7; color: #15803d; }
  </style>
</head>
<body>

  <h2>📋 Todo App</h2>
  <p style="color: #64748b; font-size: 13px;">
    Demo: state persist, filtering, counters, dan refs bekerja bersama.
  </p>

  <!-- raa-eco:persist: state tersimpan di localStorage -->
  <div raa-core:app="todoApp" raa-eco:persist="todo-app-v1">

    <!-- Statistik (computed dari state) -->
    <div class="card">
      <div class="baris">
        <span class="badge" raa-bind:text="daftar.length + ' Total'"></span>
        <span class="badge hijau" raa-bind:text="jumlahSelesai() + ' Selesai'"></span>
        <span class="badge" style="background:#fef3c7;color:#92400e;"
              raa-bind:text="jumlahAktif() + ' Aktif'"></span>
      </div>
    </div>

    <!-- Form Tambah Todo -->
    <div class="card">
      <div class="baris">
        <!-- $refs: fokus otomatis ke input setelah tambah -->
        <input type="text"
               raa-core:ref="inputTodo"
               raa-bind:model="inputBaru"
               raa-on:keydown.enter="tambah()"
               placeholder="Tulis todo baru... (Enter untuk tambah)">
        <button raa-on:click="tambah()">Tambah</button>
      </div>

      <!-- Filter -->
      <div class="baris">
        <button raa-on:click="filter = 'semua'"
                raa-bind:class="{ abu: filter !== 'semua' }">Semua</button>
        <button raa-on:click="filter = 'aktif'"
                raa-bind:class="{ abu: filter !== 'aktif' }">Aktif</button>
        <button raa-on:click="filter = 'selesai'"
                raa-bind:class="{ abu: filter !== 'selesai' }">Selesai</button>
      </div>
    </div>

    <!-- Daftar Todo -->
    <div class="card">

      <template raa-flow:if="daftar.length === 0">
        <p style="text-align:center; color:#94a3b8; padding:16px 0;">
          Belum ada todo. Yuk tambahkan sesuatu! ✨
        </p>
      </template>

      <template raa-flow:for="item in itemsTampil()" raa-key="item.id">
        <div class="todo-item">
          <input type="checkbox"
                 raa-bind:model="item.selesai"
                 raa-on:change="simpanSetelahToggle()">
          <span raa-bind:text="item.teks"
                raa-bind:class="{ selesai: item.selesai }"
                style="flex:1;"></span>
          <button class="merah" raa-on:click="hapus(item.id)"
                  style="padding:4px 8px; font-size:12px;">✕</button>
        </div>
      </template>

    </div>

    <!-- Aksi Batch -->
    <div class="baris">
      <button class="abu" raa-on:click="tandaiSemuaSelesai()">✓ Tandai Semua Selesai</button>
      <button class="merah" raa-on:click="hapusYangSelesai()"
              raa-ux:disable="jumlahSelesai() === 0">🗑 Hapus yang Selesai</button>
    </div>

  </div>

  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>
  <script>
    RaaJS.define('todoApp', () => ({
      state: {
        inputBaru: '',
        filter: 'semua',       // 'semua' | 'aktif' | 'selesai'
        daftar: []             // { id, teks, selesai }
      },

      methods: {
        tambah() {
          const teks = this.inputBaru.trim();
          if (!teks) return;

          this.daftar.push({
            id: Date.now(),
            teks,
            selesai: false
          });

          this.inputBaru = '';
          // Fokus kembali ke input setelah tambah menggunakan $refs
          this.$refs.inputTodo.focus();
        },

        hapus(id) {
          this.daftar = this.daftar.filter(item => item.id !== id);
        },

        hapusYangSelesai() {
          this.daftar = this.daftar.filter(item => !item.selesai);
        },

        tandaiSemuaSelesai() {
          // Ubah semua item — batching otomatis, hanya satu flush ke DOM
          this.daftar.forEach(item => { item.selesai = true; });
          this.simpanSetelahToggle();
        },

        simpanSetelahToggle() {
          // raa-eco:persist akan auto-save setelah state berubah
          // Method ini bisa digunakan untuk side-effect tambahan jika perlu
        },

        // "Computed" sederhana sebagai method
        jumlahSelesai() {
          return this.daftar.filter(item => item.selesai).length;
        },

        jumlahAktif() {
          return this.daftar.filter(item => !item.selesai).length;
        },

        itemsTampil() {
          if (this.filter === 'aktif')   return this.daftar.filter(i => !i.selesai);
          if (this.filter === 'selesai') return this.daftar.filter(i => i.selesai);
          return this.daftar;
        }
      },

      init() {
        // Fokus ke input saat pertama kali dibuka
        if (this.$refs.inputTodo) {
          this.$refs.inputTodo.focus();
        }
      }
    }));
  </script>

</body>
</html>
```

> 🎯 *Coba jalankan kode di atas, buka DevTools, dan perhatikan bagaimana state tersimpan di localStorage. Refresh halaman — preferensi dan todo-mu tetap ada! Ini adalah kekuatan `raa-eco:persist` dalam aksi.*

---

## 🗂️ Ringkasan: Hierarki State di RaaJS

Berikut adalah gambaran lengkap bagaimana berbagai lapisan state berinteraksi dalam aplikasi RaaJS:

### 🌐 Lapisan 1: Global Store (`$store`)
- **Cakupan**: Seluruh halaman, semua aplikasi
- **Akses**: `this.$store` di method, `$store` di template
- **Use case**: Konfigurasi global, user sesi, tema, bahasa
- **Persistensi**: Manual (kamu yang atur jika perlu simpan ke localStorage)

### 📦 Lapisan 2: State Aplikasi (`state` di `RaaJS.define()`)
- **Cakupan**: Satu root aplikasi (`raa-core:app`)
- **Akses**: `this.properti` di method, `properti` langsung di template
- **Use case**: Data utama aplikasi, state UI lokal, data dari API
- **Persistensi**: Opsional via `raa-eco:persist`

### 🏝️ Lapisan 3: State Island (`raa-eco:island`)
- **Cakupan**: Satu elemen island saja
- **Akses**: `$state` di `raa-core:init`, variabel langsung di template dalam island
- **Use case**: Komponen berulang dengan state independen (kartu produk, accordion item)
- **Persistensi**: Tidak didukung (desain yang disengaja untuk state sementara)

### 🔗 Lapisan 4: Referensi DOM (`$refs`)
- **Cakupan**: Satu aplikasi atau island
- **Akses**: `this.$refs.namaRef` di method
- **Use case**: Fokus input, scroll, integrasi library pihak ketiga
- **Persistensi**: Tidak pernah (DOM references tidak perlu disimpan)

### 🔄 Alur Data Antar Lapisan

```
Global Store ($store)
       │
       ├─ Dapat dibaca/diubah oleh semua aplikasi
       │
       ▼
State Aplikasi (state)
       │
       ├─ Dapat mengakses $store via this.$store
       ├─ Dapat memiliki island di dalamnya
       ├─ Dapat dipersistensikan via raa-eco:persist
       │
       ▼
State Island (raa-eco:island)
       │
       ├─ Terisolasi dari state aplikasi lain
       ├─ Dapat mengakses $store global jika perlu
       └─ Tidak dapat mengakses state aplikasi induk secara langsung
```

> 🎯 *Pattern ini memungkinkan kamu membangun aplikasi yang modular: komponen kecil yang terisolasi, tetapi tetap bisa berbagi data global ketika diperlukan.*

---

## 🎁 Bonus: Tips Pro untuk State Management yang Sehat

1. **Mulai sederhana** — Jangan over-engineering. Mulai dengan `state` lokal, lalu tingkatkan ke `$store` atau `persist` hanya jika benar-benar diperlukan.

2. **Deklarasikan semua properti dari awal** — Ini adalah aturan emas reaktivitas RaaJS. Properti yang ditambahkan di tengah jalan tidak akan reaktif.

3. **Gunakan `raa-eco:persist` dengan bijak** — Jangan simpan data sensitif atau besar di localStorage. Gunakan hanya untuk preferensi pengguna dan data non-kritis.

4. **Isolasi state komponen berulang** — Gunakan `raa-eco:island` untuk list/grid agar setiap item memiliki state sendiri tanpa interferensi.

5. **Pisahkan state permanen vs sementara** — Gunakan dua aplikasi terpisah jika perlu: satu dengan `persist` untuk preferensi, satu tanpa persist untuk data sesi.

6. **Gunakan `$refs` hanya untuk interaksi DOM** — Jangan simpan logika bisnis di method yang hanya manipulasi DOM. Pisahkan concern-nya.

7. **Debug dengan console.log di method** — Karena method adalah tempat modifikasi state, log di sana adalah cara termudah melacak perubahan state.

---

> 📚 *Dokumentasi ini adalah bagian dari RaaJS v3.1.0 Official Docs. Kontribusi, koreksi, dan ide perbaikan disambut hangat di repositori resmi. Mari bersama bangun ekosistem yang lebih baik!* 🚀

---

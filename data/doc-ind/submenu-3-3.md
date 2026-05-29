# Kontrol Alur — Mengatur Irama Eksistensi

> **Versi:** RaaJS v3.1.0 "Data Liberation"
> Dunia tidak pernah statis — ia bergerak dalam pilihan dan pengulangan. Begitu pula aplikasi yang kita bangun. Kontrol alur dalam RaaJS adalah cara kita menyutradarai pertunjukan itu: menentukan kapan sesuatu harus tampil di panggung DOM, kapan ia harus beristirahat di balik tirai, dan berapa kali ia harus mengulangi penampilannya.

---

Hampir semua UI yang menarik dibangun di atas tiga pertanyaan fundamental: *Apakah ini harus ditampilkan sekarang? Berapa kali harus diulang? Atau cukup disembunyikan saja?* Trio `raa-flow:*` adalah jawaban RaaJS untuk ketiga pertanyaan itu — deklaratif, ekspresif, dan efisien.

Mari kita kenali mereka satu per satu.

---

## `raa-flow:if` — Keputusan Hidup dan Mati di DOM

### Apa yang Dilakukannya

`raa-flow:if` adalah direktif paling tegas di antara ketiganya. Ketika kondisi bernilai `true`, konten di dalamnya **dilahirkan ke DOM**. Ketika kondisi menjadi `false`, konten itu **dihapus sepenuhnya** — bukan disembunyikan, bukan dikecilkan, tapi benar-benar dibongkar dari halaman beserta semua efek reaktifnya.

Ini bukan sekadar manipulasi CSS. Ini adalah manajemen siklus hidup yang sesungguhnya.

### Aturan Pertama yang Tidak Boleh Dilanggar

`raa-flow:if` **wajib diletakkan pada elemen `<template>`**, bukan pada `<div>`, `<p>`, atau elemen lainnya. Elemen `<template>` adalah wadah transparan — ia tidak meninggalkan jejak apapun di DOM, kontennya yang tampil, bukan dirinya.

```html
<!-- ✅ Benar — pakai <template> -->
<template raa-flow:if="isLoggedIn">
  <div>Selamat datang, <span raa-bind:text="user.nama"></span>!</div>
</template>

<!-- ❌ Salah — raa-flow:if pada div biasa tidak akan bekerja -->
<div raa-flow:if="isLoggedIn">
  Ini tidak akan berfungsi seperti yang kamu harapkan.
</div>
```

### Apa yang Terjadi Saat Kondisi Berubah

Ketika kondisi beralih dari `true` ke `false`, RaaJS tidak hanya menghapus elemen dari layar. Ia melakukan **deepCleanup** yang menyeluruh: semua event listener dilepas, semua efek reaktif dihentikan, semua koneksi fetch dibatalkan. Semuanya bersih, tanpa sisa, tanpa memory leak.

Ketika kondisi kembali menjadi `true`, konten tidak dimunculkan dari "cache" — ia **dibuat ulang dari nol**. Ini memastikan state di dalam elemen kondisional selalu segar. Tidak ada hantu dari render sebelumnya yang mengikutinya.

```html
<div raa-core:app="authDemo">

  <template raa-flow:if="user.isLoggedIn">
    <section>
      <h2>Dashboard</h2>
      <p raa-bind:text="'Halo, ' + user.nama + '!'"></p>
      <button raa-on:click="logout()">Keluar</button>
    </section>
  </template>

  <template raa-flow:if="!user.isLoggedIn">
    <section>
      <h2>Silakan Masuk</h2>
      <p>Kamu perlu login untuk mengakses halaman ini.</p>
      <button raa-on:click="login()">Login</button>
    </section>
  </template>

</div>
```

Perhatikan bahwa tidak ada `else` di RaaJS — kamu cukup menulis dua `<template>` dengan kondisi yang saling berlawanan. Terasa verbose? Sedikit. Tapi ini membuatnya sangat eksplisit dan mudah dibaca oleh siapa pun.

### Contoh: Menampilkan Daftar atau Pesan Kosong

Pola ini adalah salah satu yang paling sering kamu tulis dalam aplikasi nyata:

```html
<div raa-core:app="listApp">

  <template raa-flow:if="items.length > 0">
    <ul>
      <template raa-flow:for="item in items" raa-key="item.id">
        <li raa-bind:text="item.nama"></li>
      </template>
    </ul>
  </template>

  <template raa-flow:if="items.length === 0">
    <p style="color: #94a3b8; text-align: center;">
      Belum ada item. Yuk tambahkan sesuatu! ✨
    </p>
  </template>

</div>

<script>
  RaaJS.define('listApp', () => ({
    state: {
      items: [
        { id: 1, nama: 'Buku RaaJS' },
        { id: 2, nama: 'Panduan Reaktivitas' }
      ]
    }
  }));
</script>
```

### Kapan Sebaiknya Pakai `raa-flow:if`

Gunakan `raa-flow:if` ketika kontennya **jarang berganti** atau ketika konten tersebut memiliki banyak sub-komponen yang mahal secara komputasi untuk diinisialisasi. Karena ia membongkar dan membangun ulang DOM, ada biaya di setiap peralihan — tapi investasi itu sepadan jika konten yang tidak perlu tidak pernah dibuat sejak awal.

---

## `raa-flow:for` — Memberikan Panggung bagi Setiap Data

### Apa yang Dilakukannya

`raa-flow:for` adalah cara RaaJS merender daftar. Berikan ia sebuah array, dan ia akan mengkloning template di dalamnya sebanyak jumlah item — reaktif, efisien, dan stabil.

### Aturan yang Sama: Wajib `<template>`

Sama seperti `raa-flow:if`, direktif ini harus ada di elemen `<template>`. Template ini yang akan direplikasi untuk setiap item. Ia sendiri tidak meninggalkan jejak di DOM.

```html
<ul>
  <template raa-flow:for="item in items" raa-key="item.id">
    <li raa-bind:text="item.nama"></li>
  </template>
</ul>
```

### Tentang `raa-key`: Ini Wajib, Bukan Opsional

`raa-key` adalah mekanisme identitas yang membuat RaaJS bisa melakukan **keyed diffing** — membandingkan daftar baru dengan daftar lama secara cerdas, hanya memperbarui item yang benar-benar berubah, memindahkan yang perlu dipindah, dan menghancurkan yang perlu dihapus.

Tanpa `raa-key`, setiap kali array berubah, RaaJS tidak tahu item mana yang sama dengan sebelumnya. Ia terpaksa merobohkan semua yang ada dan membangun semuanya dari awal — persis seperti kamu disuruh mengenali teman-temanmu tapi semua orang pakai topeng yang sama.

Nilai `raa-key` harus berupa **primitif yang unik dan stabil** — idealnya ID dari database:

```html
<!-- ✅ Pakai ID yang stabil dan unik -->
<template raa-flow:for="user in users" raa-key="user.id">

<!-- ✅ Bisa juga string unik lain -->
<template raa-flow:for="produk in katalog" raa-key="produk.sku">

<!-- ⚠️ Hindari menggunakan indeks jika daftar sering diurutkan/difilter -->
<template raa-flow:for="item in items" raa-key="$index">
```

### Variabel yang Tersedia di Dalam Loop

Di dalam scope `raa-flow:for`, ada beberapa variabel yang bisa kamu gunakan:

**Variabel item** — nama yang kamu tentukan sendiri di ekspresi `"item in array"`:
```html
<template raa-flow:for="produk in katalog" raa-key="produk.id">
  <div raa-bind:text="produk.nama"></div>
  <!-- 'produk' merujuk ke setiap item di array 'katalog' -->
</template>
```

**Variabel indeks** — tambahkan nama kedua setelah koma, sebelum `in`:
```html
<template raa-flow:for="item, nomor in daftar" raa-key="item.id">
  <li raa-bind:text="(nomor + 1) + '. ' + item.judul"></li>
  <!-- 'nomor' adalah indeks (0, 1, 2, ...) -->
</template>
```

**`$index`** — tersedia secara otomatis tanpa perlu deklarasi, selalu berisi indeks item saat ini:
```html
<template raa-flow:for="item in daftar" raa-key="item.id">
  <div raa-bind:text="$index + 1 + '. ' + item.nama"></div>
</template>
```

**`$locals`** — objek yang berisi semua variabel loop dari semua level di atasnya. Sangat berguna saat kamu punya loop bersarang dan butuh mengakses variabel dari loop luar:

```html
<template raa-flow:for="kategori in menu" raa-key="kategori.id">
  <div>
    <h3 raa-bind:text="kategori.nama"></h3>
    <ul>
      <template raa-flow:for="item in kategori.items" raa-key="item.id">
        <li>
          <!-- Akses variabel loop luar via $locals -->
          <span raa-bind:text="$locals.kategori.nama + ' › ' + item.nama"></span>
        </li>
      </template>
    </ul>
  </div>
</template>
```

### Loop Bersarang: Saat Data Punya Kedalaman

`raa-flow:for` bisa bersarang tanpa batas. Setiap level loop punya scope-nya sendiri, dan variabel dari loop luar otomatis bisa diakses di loop dalam:

```html
<div raa-core:app="menuApp">
  <template raa-flow:for="kategori in menu" raa-key="kategori.id">
    <section>
      <h2 raa-bind:text="kategori.nama"></h2>
      <ul>
        <template raa-flow:for="item in kategori.produk" raa-key="item.id">
          <li>
            <span raa-bind:text="item.nama"></span>
            <span raa-bind:text="'Rp ' + item.harga.toLocaleString('id-ID')"></span>
            <!-- 'kategori' dari loop luar tetap bisa diakses di sini -->
            <small raa-bind:text="'(' + kategori.nama + ')'"></small>
          </li>
        </template>
      </ul>
    </section>
  </template>
</div>

<script>
  RaaJS.define('menuApp', () => ({
    state: {
      menu: [
        {
          id: 1,
          nama: 'Makanan',
          produk: [
            { id: 101, nama: 'Nasi Goreng', harga: 25000 },
            { id: 102, nama: 'Mie Ayam', harga: 20000 }
          ]
        },
        {
          id: 2,
          nama: 'Minuman',
          produk: [
            { id: 201, nama: 'Es Teh', harga: 8000 },
            { id: 202, nama: 'Jus Alpukat', harga: 18000 }
          ]
        }
      ]
    }
  }));
</script>
```

### Menggabungkan `raa-flow:for` dan `raa-flow:if`

Ini adalah kombinasi yang sangat umum — render daftar, tapi tampilkan konten berbeda berdasarkan properti setiap item:

```html
<template raa-flow:for="todo in todos" raa-key="todo.id">
  <div>
    <span raa-bind:text="todo.judul"></span>

    <!-- Kondisi di dalam loop — bekerja dengan sempurna -->
    <template raa-flow:if="todo.selesai">
      <span style="color: green;">✓ Selesai</span>
    </template>
    <template raa-flow:if="!todo.selesai">
      <span style="color: orange;">○ Belum selesai</span>
    </template>
  </div>
</template>
```

### Contoh Lengkap: Aplikasi Todo

Mari kita lihat semuanya bekerja dalam satu aplikasi yang utuh. Perhatikan baik-baik bagaimana method ditulis — di dalam method RaaJS, kamu menggunakan `this.namaProperti` langsung, bukan `this.$state.namaProperti`:

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RaaJS Todo List</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: sans-serif; background: #f1f5f9; display: flex; justify-content: center; padding: 40px 16px; margin: 0; }
    .app { background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); padding: 32px; width: 100%; max-width: 460px; }
    h1 { margin: 0 0 24px; font-size: 22px; color: #1e293b; }
    .form { display: flex; gap: 8px; margin-bottom: 20px; }
    .form input { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; font-size: 14px; }
    .form input:focus { outline: none; border-color: #3b82f6; }
    .btn { background: #3b82f6; color: white; border: none; border-radius: 8px; padding: 10px 16px; cursor: pointer; font-size: 14px; font-weight: 600; white-space: nowrap; }
    .btn:hover { background: #2563eb; }
    .btn.danger { background: #ef4444; }
    .btn.danger:hover { background: #dc2626; }
    .btn.ghost { background: transparent; color: #64748b; border: 1px solid #e2e8f0; }
    .todo-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; margin-bottom: 8px; border: 1px solid #f1f5f9; transition: background 0.15s; }
    .todo-item:hover { background: #f8fafc; }
    .todo-item.selesai { opacity: 0.6; }
    .todo-item.selesai .judul { text-decoration: line-through; color: #94a3b8; }
    .judul { flex: 1; font-size: 14px; color: #334155; }
    .kosong { text-align: center; color: #94a3b8; padding: 32px 0; font-size: 14px; }
    .stats { font-size: 12px; color: #94a3b8; margin-bottom: 16px; }
  </style>
</head>
<body>

  <div raa-core:app="todoApp" class="app">
    <h1>📋 Daftar Tugasku</h1>

    <!-- Statistik singkat -->
    <p class="stats">
      <span raa-bind:text="todos.length"></span> total •
      <span raa-bind:text="jumlahSelesai()"></span> selesai •
      <span raa-bind:text="jumlahAktif()"></span> aktif
    </p>

    <!-- Form tambah todo -->
    <div class="form">
      <input
        type="text"
        raa-bind:model="todoBaru"
        raa-on:keydown.enter="tambah()"
        placeholder="Tulis tugas baru... (Enter untuk tambah)">
      <button class="btn" raa-on:click="tambah()">Tambah</button>
    </div>

    <!-- Daftar todo -->
    <template raa-flow:if="todos.length > 0">
      <div>
        <template raa-flow:for="todo in todos" raa-key="todo.id">
          <div class="todo-item" raa-bind:class="{ selesai: todo.selesai }">

            <!-- Checkbox toggle -->
            <input
              type="checkbox"
              raa-bind:model="todo.selesai">

            <!-- Judul todo -->
            <span class="judul" raa-bind:text="todo.judul"></span>

            <!-- Badge nomor urut -->
            <span style="font-size:11px; color:#cbd5e1;" raa-bind:text="'#' + ($index + 1)"></span>

            <!-- Tombol hapus -->
            <button class="btn danger"
                    style="padding: 4px 10px; font-size: 12px;"
                    raa-on:click="hapus(todo.id)">✕</button>

          </div>
        </template>

        <!-- Tombol bersihkan yang sudah selesai -->
        <template raa-flow:if="jumlahSelesai() > 0">
          <button class="btn ghost"
                  style="width:100%; margin-top: 12px; font-size:13px;"
                  raa-on:click="hapusSelesai()">
            🗑 Hapus <span raa-bind:text="jumlahSelesai()"></span> yang sudah selesai
          </button>
        </template>
      </div>
    </template>

    <!-- Pesan saat daftar kosong -->
    <template raa-flow:if="todos.length === 0">
      <div class="kosong">
        <p>🎉 Tidak ada tugas hari ini!</p>
        <p>Santai dulu, atau tambahkan tugas baru di atas.</p>
      </div>
    </template>

  </div>

  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>
  <script>
    RaaJS.define('todoApp', () => ({
      state: {
        todoBaru: '',
        todos: [
          { id: 1, judul: 'Belajar raa-flow:if', selesai: true },
          { id: 2, judul: 'Belajar raa-flow:for', selesai: false },
          { id: 3, judul: 'Belajar raa-flow:show', selesai: false }
        ]
      },
      methods: {
        tambah() {
          // ✅ Di dalam method, gunakan 'this.xxx' langsung — bukan 'this.$state.xxx'
          const judul = this.todoBaru.trim();
          if (!judul) return;

          this.todos.push({
            id: Date.now(),
            judul: judul,
            selesai: false
          });

          this.todoBaru = ''; // Kosongkan input setelah tambah
        },

        hapus(id) {
          this.todos = this.todos.filter(t => t.id !== id);
        },

        hapusSelesai() {
          this.todos = this.todos.filter(t => !t.selesai);
        },

        jumlahSelesai() {
          return this.todos.filter(t => t.selesai).length;
        },

        jumlahAktif() {
          return this.todos.filter(t => !t.selesai).length;
        }
      }
    }));
  </script>

</body>
</html>
```

> **Catatan penting soal `this` vs `this.$state`:**
> Di dalam `methods`, kamu **selalu** menggunakan `this.namaProperti` untuk membaca maupun mengubah state. Variabel `$state` adalah pintasan khusus yang hanya tersedia di dalam ekspresi template HTML, bukan di dalam kode JavaScript. Menggunakan `this.$state.x = ...` di dalam method akan menghasilkan perilaku yang tidak terduga.

---

## `raa-flow:show` — Tirai yang Cepat Naik Turun

### Apa yang Dilakukannya

`raa-flow:show` adalah saudara yang lebih ringan dari `raa-flow:if`. Alih-alih membongkar dan membangun ulang elemen, ia cukup mengubah properti CSS `display` antara `none` dan nilai aslinya. Elemen selalu ada di DOM — hanya terlihat atau tidak terlihat.

Kalau `raa-flow:if` adalah operasi bedah, `raa-flow:show` adalah gerakan tangan yang gesit.

### Sintaks

`raa-flow:show` bisa digunakan langsung pada elemen HTML biasa — tidak perlu `<template>`:

```html
<!-- Langsung pada elemen, tanpa <template> -->
<div raa-flow:show="isLoading">⏳ Memuat data...</div>
<div raa-flow:show="!isLoading">✅ Data berhasil dimuat.</div>

<!-- Juga bekerja pada elemen apapun -->
<nav raa-flow:show="menuTerbuka">...</nav>
<aside raa-flow:show="tampilSidebar">...</aside>
```

### Perbandingan Langsung dengan `raa-flow:if`

| | `raa-flow:if` | `raa-flow:show` |
|---|---|---|
| **Mekanisme** | Hapus/tambah elemen ke DOM | Toggle CSS `display: none` |
| **Elemen di DOM?** | Tidak (saat kondisi false) | Selalu ada |
| **Biaya toggle** | Lebih tinggi — buat/hancurkan DOM | Sangat ringan — hanya CSS |
| **Inisialisasi awal** | Tidak dirender jika kondisi false | Selalu dirender, lalu disembunyikan |
| **Memory saat tersembunyi** | Gratis — tidak ada di DOM | Tetap ada, tetap menggunakan memori |
| **Cocok untuk** | Konten jarang muncul, blok besar | Konten sering toggle: tab, dropdown, modal |
| **Elemen target** | **Wajib `<template>`** | Elemen HTML apa pun |

### Contoh: Menu Dropdown

```html
<div raa-core:app="dropdownApp">

  <button raa-on:click="toggleMenu()">
    Menu <span raa-bind:text="menuTerbuka ? '▲' : '▼'"></span>
  </button>

  <!-- raa-flow:show — menu tetap di DOM, hanya disembunyikan -->
  <nav raa-flow:show="menuTerbuka"
       style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; margin-top: 4px;">
    <ul style="list-style: none; margin: 0; padding: 0;">
      <li><a href="#">🏠 Beranda</a></li>
      <li><a href="#">👤 Profil</a></li>
      <li><a href="#">⚙️ Pengaturan</a></li>
      <li><a href="#" raa-on:click.prevent="logout()">🚪 Keluar</a></li>
    </ul>
  </nav>

</div>

<script>
  RaaJS.define('dropdownApp', () => ({
    state: {
      menuTerbuka: false
    },
    methods: {
      toggleMenu() {
        this.menuTerbuka = !this.menuTerbuka;
      },
      logout() {
        alert('Sampai jumpa!');
        this.menuTerbuka = false;
      }
    }
  }));
</script>
```

### Kapan Pilih Mana

Pertanyaan paling simpel yang bisa kamu tanyakan ke diri sendiri: *"Seberapa sering elemen ini akan toggling?"*

Kalau jawabannya "jarang" atau "hanya sekali" — pakai `raa-flow:if`. Hemat memori, elemen tidak dirender sampai benar-benar dibutuhkan.

Kalau jawabannya "sering, bahkan setiap beberapa detik" — pakai `raa-flow:show`. Tidak ada biaya rebuild DOM, perpindahan terasa instan bagi pengguna.

Dan ada satu pertimbangan lagi yang sering luput: jika elemen yang tersembunyi berisi komponen berat (grafik, player video, peta interaktif), kadang lebih baik pakai `raa-flow:if` meski sering di-toggle — karena kamu tidak mau semua komponen itu berjalan di background menghabiskan resource meski tidak terlihat.

---

## Memadukannya: Aplikasi Dengan Ketiga Direktif

Berikut adalah contoh dashboard sederhana yang menggunakan ketiga direktif secara bersamaan dalam skenario yang realistis:

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Dashboard — RaaJS</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: sans-serif; margin: 0; background: #f8fafc; }
    header { background: #1e293b; color: white; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
    nav { display: flex; gap: 8px; }
    nav button { background: rgba(255,255,255,0.1); color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; }
    nav button.aktif { background: #3b82f6; }
    main { max-width: 800px; margin: 32px auto; padding: 0 16px; }
    .card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 16px; }
    .card h3 { margin: 0 0 16px; font-size: 16px; color: #1e293b; }
    .item-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .item-row:last-child { border-bottom: none; }
    .badge { font-size: 11px; padding: 2px 8px; border-radius: 20px; font-weight: 600; }
    .badge.aktif { background: #dcfce7; color: #16a34a; }
    .badge.nonaktif { background: #fee2e2; color: #dc2626; }
    .loading { text-align: center; padding: 40px; color: #94a3b8; font-size: 14px; }
    .empty { text-align: center; padding: 32px; color: #94a3b8; }
    .sidebar { position: fixed; right: 0; top: 0; bottom: 0; width: 300px; background: white; border-left: 1px solid #e2e8f0; padding: 24px; transform: translateX(100%); transition: transform 0.2s; }
    .sidebar.tampil { transform: translateX(0); }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); }
  </style>
</head>
<body>

  <div raa-core:app="dashboardApp">

    <!-- Header dengan tab navigasi — raa-flow:show untuk highlight tab aktif -->
    <header>
      <strong>Dashboard</strong>
      <nav>
        <button
          raa-on:click="tabAktif = 'pengguna'"
          raa-bind:class="{ aktif: tabAktif === 'pengguna' }">
          👤 Pengguna
        </button>
        <button
          raa-on:click="tabAktif = 'produk'"
          raa-bind:class="{ aktif: tabAktif === 'produk' }">
          📦 Produk
        </button>
        <button raa-on:click="toggleSidebar()">
          ≡ Detail
        </button>
      </nav>
    </header>

    <main>

      <!-- Tab Pengguna — raa-flow:show untuk tab switching yang cepat -->
      <div raa-flow:show="tabAktif === 'pengguna'">
        <div class="card">
          <h3>Daftar Pengguna</h3>

          <!-- raa-flow:if untuk loading state -->
          <template raa-flow:if="sedangMuat">
            <div class="loading">⏳ Memuat data pengguna...</div>
          </template>

          <!-- raa-flow:if untuk daftar yang sudah ada isinya -->
          <template raa-flow:if="!sedangMuat && pengguna.length > 0">
            <!-- raa-flow:for untuk merender setiap pengguna -->
            <template raa-flow:for="user in pengguna" raa-key="user.id">
              <div class="item-row">
                <span style="flex:1; font-weight:600;" raa-bind:text="user.nama"></span>
                <span style="color:#64748b;" raa-bind:text="user.email"></span>
                <!-- raa-flow:if di dalam raa-flow:for -->
                <span class="badge"
                      raa-bind:class="{ aktif: user.aktif, nonaktif: !user.aktif }"
                      raa-bind:text="user.aktif ? 'Aktif' : 'Nonaktif'">
                </span>
              </div>
            </template>
          </template>

          <!-- raa-flow:if untuk state kosong -->
          <template raa-flow:if="!sedangMuat && pengguna.length === 0">
            <div class="empty">Belum ada pengguna terdaftar.</div>
          </template>

        </div>
      </div>

      <!-- Tab Produk -->
      <div raa-flow:show="tabAktif === 'produk'">
        <div class="card">
          <h3>Katalog Produk</h3>
          <template raa-flow:for="produk in katalog" raa-key="produk.id">
            <div class="item-row">
              <span style="flex:1; font-weight:600;" raa-bind:text="produk.nama"></span>
              <span raa-bind:text="'Rp ' + produk.harga.toLocaleString('id-ID')"></span>
              <span class="badge aktif" raa-bind:text="produk.stok + ' stok'"></span>
            </div>
          </template>
        </div>
      </div>

    </main>

    <!-- Sidebar — raa-flow:show untuk panel geser -->
    <template raa-flow:if="sidebarTerbuka">
      <div class="overlay" raa-on:click="toggleSidebar()"></div>
    </template>

    <div class="sidebar"
         raa-bind:class="{ tampil: sidebarTerbuka }"
         raa-flow:show="true">
      <!-- raa-flow:show="true" memastikan sidebar ada di DOM sejak awal
           agar transisi CSS bisa bekerja dengan mulus -->
      <h3>Panel Detail</h3>
      <p style="color:#64748b; font-size:13px;">
        Pilih item dari daftar untuk melihat detailnya di sini.
      </p>
      <button raa-on:click="toggleSidebar()"
              style="background:#ef4444; color:white; border:none; padding:8px 16px; border-radius:8px; cursor:pointer; margin-top:16px;">
        Tutup
      </button>
    </div>

  </div>

  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>
  <script>
    RaaJS.define('dashboardApp', () => ({
      state: {
        tabAktif: 'pengguna',
        sedangMuat: true,
        sidebarTerbuka: false,
        pengguna: [],
        katalog: [
          { id: 1, nama: 'Laptop Pro 15"', harga: 18500000, stok: 12 },
          { id: 2, nama: 'Mechanical Keyboard', harga: 850000, stok: 45 },
          { id: 3, nama: 'USB-C Hub 7-in-1', harga: 320000, stok: 78 }
        ]
      },
      methods: {
        toggleSidebar() {
          this.sidebarTerbuka = !this.sidebarTerbuka;
        }
      },
      init() {
        // Simulasi fetch data pengguna
        setTimeout(() => {
          this.pengguna = [
            { id: 1, nama: 'Andi Pratama', email: 'andi@mail.com', aktif: true },
            { id: 2, nama: 'Budi Santoso', email: 'budi@mail.com', aktif: true },
            { id: 3, nama: 'Citra Dewi', email: 'citra@mail.com', aktif: false },
            { id: 4, nama: 'Dian Rahayu', email: 'dian@mail.com', aktif: true }
          ];
          this.sedangMuat = false;
        }, 1200);
      }
    }));
  </script>

</body>
</html>
```

---

## Rangkuman: Pilih yang Tepat

Ketiga direktif ini bukan kompetitor — mereka adalah kolaborator. Ketiganya saling melengkapi dan sangat sering digunakan bersamaan dalam satu halaman.

`raa-flow:if` adalah untuk keputusan yang serius — ketika sesuatu benar-benar tidak perlu ada sebelum kondisinya terpenuhi. Ia hemat memori, tapi ada biaya saat peralihan.

`raa-flow:show` adalah untuk interaksi yang ringan dan cepat — ketika elemen selalu siap di belakang layar dan hanya butuh muncul atau menghilang dalam sekejap. Ia cepat, tapi selalu menggunakan memori meski tersembunyi.

`raa-flow:for` adalah untuk data yang punya kuantitas — apapun yang bisa diiterasi, ia akan merender dengan efisien menggunakan `raa-key` sebagai kompas identitasnya.

Tiga pertanyaan sederhana setiap kali kamu ragu: *Perlu dihancurkan saat tidak dipakai? Pakai `if`. Cuma perlu disembunyikan? Pakai `show`. Perlu diulang untuk setiap data? Pakai `for`.*

---

*Dokumentasi ini adalah bagian dari RaaJS v3.1.0 Official Docs. Kontribusi, koreksi, dan ide perbaikan disambut hangat di repositori resmi.*

# HTTP & Data Fetching

> **Versi:** RaaJS v3.1.0 "Data Liberation"
>
> **Ekstensi:** `raa-http.js`
>

---

Hampir semua aplikasi nyata berkomunikasi dengan server. RaaJS menyediakan HTTP client yang bukan sekadar pembungkus `fetch` biasa — ia terintegrasi penuh dengan sistem reaktif, sadar siklus hidup komponen, dan membawa data masuk ke state dengan cara yang paling deklaratif yang bisa kamu bayangkan.

---

## Pasang Ekstensinya

```html
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-http.min.js"></script>
```

Setelah dimuat, dua hal tersedia:
- Direktif `raa-http:*` beserta semua modifier-nya
- `window.RaaHttp` — API global untuk request manual dan konfigurasi interceptor
- `$http` — variabel di state yang memberi akses ke status setiap request

---

## Konsep Dasar: Sintaks Panah

Semua direktif HTTP di RaaJS menggunakan sintaks panah `->` untuk menghubungkan URL ke state:

```
raa-http:get="urlEkspresi -> kunciState"
```

Artinya: *"Minta data dari URL ini, dan simpan hasilnya ke `state.kunciState`."* Sesederhana itu.

```html
<!-- Ambil data dari /api/produk, simpan ke state.produk -->
<div raa-http:get="'/api/produk' -> produk"></div>

<!-- URL dari state -->
<div raa-http:get="baseUrl + '/users/' + userId -> profil"></div>
```

---

## `raa-http:get` — Ambil Data Saat Mount

Direktif paling sering digunakan. GET request dijalankan **otomatis** saat elemen dikompilasi, dan hasilnya masuk ke state yang kamu tentukan.

```html
<div raa-core:app="beritaApp">

  <!-- Request otomatis saat komponen dimuat -->
  <div raa-http:get="'/api/berita?limit=10' -> daftarBerita"
       raa-on:http:success="log('Data berhasil dimuat!')"
       raa-on:http:error="pesanError = 'Gagal memuat berita'">
  </div>

  <!-- Loading state -->
  <template raa-flow:if="$http.daftarBerita.loading">
    <div>⏳ Memuat berita...</div>
  </template>

  <!-- Error state -->
  <template raa-flow:if="$http.daftarBerita.error">
    <div raa-bind:text="pesanError"></div>
  </template>

  <!-- Data tersedia -->
  <template raa-flow:if="daftarBerita">
    <template raa-flow:for="berita in daftarBerita" raa-key="berita.id">
      <article>
        <h2 raa-bind:text="berita.judul"></h2>
        <p raa-bind:text="berita.ringkasan"></p>
      </article>
    </template>
  </template>

</div>

<script>
  RaaJS.define('beritaApp', () => ({
    state: {
      daftarBerita: null,
      pesanError: ''
    },
    methods: {
      log(pesan) { console.log(pesan); }
    }
  }));
</script>
```

### `$http` — Status Request yang Reaktif

Setiap kali ada direktif `raa-http:*` dengan kunci target tertentu, RaaJS secara otomatis membuat objek status untuk kunci tersebut yang bisa diakses via `$http.kunciTarget`:

| Properti | Tipe | Keterangan |
|---|---|---|
| `$http.kunci.loading` | `boolean` | `true` saat request sedang berjalan |
| `$http.kunci.success` | `boolean` | `true` setelah request berhasil |
| `$http.kunci.error` | `object\|null` | Objek error jika gagal, `null` jika tidak |
| `$http.kunci.status` | `number` | HTTP status code terakhir |
| `$http.kunci.data` | `any` | Data yang diterima dari server |
| `$http.kunci.response` | `object` | Objek respons lengkap |
| `$http.kunci.aborted` | `boolean` | `true` jika request dibatalkan |
| `$http.kunci.finished` | `boolean` | `true` setelah request selesai (sukses/gagal) |

```html
<!-- Gunakan $http untuk UI yang kaya -->
<div>
  <!-- Indikator loading -->
  <div raa-flow:show="$http.produk.loading"
       style="padding: 20px; text-align: center;">
    ⏳ Memuat...
  </div>

  <!-- Badge status code -->
  <span raa-bind:text="'Status: ' + $http.produk.status"></span>

  <!-- Pesan sukses/gagal -->
  <template raa-flow:if="$http.produk.success">
    <p style="color: green;">✓ Data dimuat</p>
  </template>
  <template raa-flow:if="$http.produk.error">
    <p style="color: red;" raa-bind:text="'Error: ' + $http.produk.error.statusText"></p>
  </template>
</div>
```

---

## Modifier: Mengubah Perilaku Request

Modifier adalah atribut tambahan yang diletakkan pada elemen yang sama dengan direktif method utama. Mereka mengontrol *kapan*, *seberapa sering*, dan *bagaimana* request dijalankan.

### `raa-http:reactive` — Ulang Otomatis Saat State Berubah

Tanpa modifier ini, GET request hanya jalan sekali saat mount. Dengan `raa-http:reactive`, request akan **berjalan ulang otomatis** setiap kali dependensi yang ada di URL-nya berubah — persis seperti computed property yang reaktif.

```html
<div raa-core:app="searchApp">

  <input type="text"
         raa-bind:model="query"
         placeholder="Cari produk...">

  <!-- URL bergantung pada 'query' — akan fetch ulang setiap query berubah -->
  <div raa-http:get="'/api/produk?q=' + query -> hasilCari"
       raa-http:reactive
       raa-http:debounce="400">
  </div>

  <template raa-flow:for="item in hasilCari" raa-key="item.id">
    <div raa-bind:text="item.nama"></div>
  </template>

</div>

<script>
  RaaJS.define('searchApp', () => ({
    state: { query: '', hasilCari: [] }
  }));
</script>
```

Perhatikan `raa-http:debounce="400"` di atas — ini adalah kombinasi yang hampir selalu dipakai bersama `reactive`, agar request tidak terkirim setiap kali pengguna mengetik satu karakter.

### `raa-http:lazy` — Jalan Hanya Saat Dipicu Manual

Dengan `raa-http:lazy`, GET tidak otomatis berjalan saat mount. Ia menunggu sampai dipicu — baik lewat klik pada elemen tersebut, atau dipanggil dari method.

```html
<!-- GET dengan lazy: tidak berjalan saat mount -->
<!-- Berjalan saat tombol ini diklik -->
<button raa-http:get="'/api/laporan/bulanan' -> laporan"
        raa-http:lazy>
  Muat Laporan
</button>

<!-- POST/PUT/DELETE secara default juga lazy — dipicu saat diklik -->
<button raa-http:post="'/api/sinkronisasi' -> hasilSync">
  Sinkronisasi Data
</button>
```

Untuk non-GET method (`post`, `put`, `patch`, `delete`), perilaku default sudah lazy — mereka dipicu saat elemen diklik (atau form di-submit). Tidak perlu menambahkan `raa-http:lazy` secara eksplisit untuk non-GET.

### `raa-http:poll` — Polling Berkala

Request diulang secara otomatis setiap N milidetik. Polling dihentikan otomatis saat elemen keluar dari DOM atau root di-destroy.

```html
<!-- Perbarui harga saham setiap 5 detik -->
<div raa-http:get="'/api/harga-saham' -> harga"
     raa-http:poll="5000">
</div>

<!-- Cek notifikasi baru setiap 30 detik -->
<div raa-http:get="'/api/notif/baru' -> notifBaru"
     raa-http:poll="30000">
</div>
```

### `raa-http:debounce` — Tunda Setelah Ketikan Terakhir

Eksekusi request ditunda N milidetik setelah pemicu terakhir. Jika ada pemicu baru sebelum delay habis, timer direset. Sangat ideal untuk live search.

```html
<!-- Tunggu 500ms setelah pengguna berhenti mengetik -->
<div raa-http:get="'/api/cari?q=' + kata -> hasil"
     raa-http:reactive
     raa-http:debounce="500">
</div>
```

### `raa-http:throttle` — Batasi Frekuensi Eksekusi

Pastikan request tidak dijalankan lebih sering dari sekali per N milidetik. Cocok untuk handler scroll atau resize yang memicu request.

```html
<!-- Maksimal satu request per 2 detik -->
<div raa-http:get="'/api/posisi?lat=' + lat + '&lng=' + lng -> lokasi"
     raa-http:reactive
     raa-http:throttle="2000">
</div>
```

### `raa-http:confirm` — Minta Konfirmasi Dulu

Sebelum request dieksekusi, browser akan menampilkan dialog konfirmasi. Jika pengguna klik "Batal", request tidak jadi dijalankan.

```html
<button raa-http:delete="'/api/akun/' + userId -> hasilHapus"
        raa-http:confirm="Yakin ingin menghapus akun ini? Tindakan tidak dapat dibatalkan.">
  Hapus Akun
</button>
```

---

## Mengatur Request: Header, Query, dan Body

### `raa-http:headers` — Tambah Header Kustom

Nilai harus berupa JSON yang valid:

```html
<div raa-http:get="'/api/data-privat -> data'"
     raa-http:headers='{"Authorization": "Bearer token123", "X-Custom-Header": "nilai"}'>
</div>
```

Untuk header yang nilainya dinamis dari state, gunakan method atau interceptor (dibahas di bawah).

### `raa-http:query` — Tambah Query Parameter

```html
<!-- Query statis -->
<div raa-http:get="'/api/produk -> produk'"
     raa-http:query='{"limit": 20, "sort": "terbaru", "kategori": "elektronik"}'>
</div>
```

URL yang dihasilkan: `/api/produk?limit=20&sort=terbaru&kategori=elektronik`

### `raa-http:body` — Override Body Request

Untuk POST/PUT/PATCH dengan body statis. Untuk body dinamis dari state, lebih baik gunakan form atau method:

```html
<!-- POST dengan body statis -->
<button raa-http:post="'/api/subscribe -> hasilSubscribe'"
        raa-http:body='{"plan": "premium", "billing": "yearly"}'>
  Berlangganan Premium
</button>
```

### `raa-http:response` — Tipe Respons

Default adalah `json`. Ubah jika server mengembalikan format lain:

```html
<!-- Teks biasa -->
<div raa-http:get="'/api/readme.txt -> isiReadme'"
     raa-http:response="text">
</div>

<!-- File binary (untuk download) -->
<button raa-http:get="'/api/laporan.pdf -> pdfBlob'"
        raa-http:response="blob"
        raa-http:lazy
        raa-on:http:success="downloadFile()">
  Unduh Laporan
</button>
```

Nilai yang didukung: `json` (default), `text`, `blob`, `formData`, `arrayBuffer`.

### `raa-http:timeout` — Batas Waktu Request

Request dibatalkan jika melebihi N milidetik. Ketika timeout, `$http.kunci.error.type` akan bernilai `'timeout'`.

```html
<div raa-http:get="'/api/data-besar -> dataset'"
     raa-http:timeout="10000">
  <!-- Timeout setelah 10 detik -->
</div>
```

---

## Handler Siklus Hidup Request

Empat atribut event yang merespons hasil request:

### `raa-on:http:success`

Dipanggil saat response `ok === true`. Variabel `$event` berisi objek respons lengkap dengan `.data`, `.status`, `.headers`, `.url`:

```html
<div raa-http:get="'/api/produk -> produk'"
     raa-on:http:success="onSukses($event)">
</div>

<script>
  methods: {
    onSukses(response) {
      console.log('Status:', response.status);
      console.log('Data:', response.data);
      // state.produk sudah otomatis diisi oleh RaaJS
      // di sini kamu bisa lakukan hal tambahan seperti notifikasi
      this.pesan = 'Data berhasil dimuat: ' + response.data.length + ' item';
    }
  }
</script>
```

### `raa-on:http:error`

Dipanggil saat response `ok === false` atau terjadi network error. `$event` berisi objek error dengan `.status`, `.statusText`, `.type`, `.message`:

```html
<div raa-http:get="'/api/data -> data'"
     raa-on:http:error="tanganiError($event)">
</div>

<script>
  methods: {
    tanganiError(err) {
      if (err.type === 'network') {
        this.pesanError = 'Tidak ada koneksi internet.';
      } else if (err.type === 'timeout') {
        this.pesanError = 'Permintaan terlalu lama. Coba lagi.';
      } else if (err.status === 401) {
        this.pesanError = 'Sesi habis. Silakan login ulang.';
      } else if (err.status === 404) {
        this.pesanError = 'Data tidak ditemukan.';
      } else {
        this.pesanError = 'Terjadi kesalahan: ' + err.statusText;
      }
    }
  }
</script>
```

### `raa-on:http:finally`

Selalu dipanggil setelah request selesai — baik sukses maupun gagal. Berguna untuk mematikan spinner atau state loading yang dikelola manual:

```html
<div raa-http:get="'/api/data -> data'"
     raa-on:http:success="berhasil()"
     raa-on:http:error="gagal($event)"
     raa-on:http:finally="sedangMuat = false">
</div>
```

---

## Form Submit dengan `raa-http:post`

Saat direktif HTTP diletakkan pada elemen `<form>`, ia akan menangkap event `submit`, mencegah reload halaman, dan mengirim data form secara otomatis sebagai `FormData`:

```html
<div raa-core:app="registrasiApp">

  <form raa-http:post="'/api/daftar -> hasilDaftar'"
        raa-on:http:success="berhasil()"
        raa-on:http:error="gagal($event)">

    <input type="text" name="nama" placeholder="Nama Lengkap">
    <input type="email" name="email" placeholder="Email">
    <input type="password" name="password" placeholder="Kata Sandi">

    <button type="submit"
            raa-ux:disable="$http.hasilDaftar.loading">
      <span raa-bind:text="$http.hasilDaftar.loading ? 'Mendaftarkan...' : 'Daftar'"></span>
    </button>

  </form>

  <template raa-flow:if="$http.hasilDaftar.success">
    <p style="color: green;">Pendaftaran berhasil! Cek email untuk verifikasi.</p>
  </template>

  <template raa-flow:if="$http.hasilDaftar.error">
    <p style="color: red;" raa-bind:text="pesanError"></p>
  </template>

</div>

<script>
  RaaJS.define('registrasiApp', () => ({
    state: { hasilDaftar: null, pesanError: '' },
    methods: {
      berhasil() {
        // state.hasilDaftar sudah berisi response.data dari server
        console.log('User terdaftar:', this.hasilDaftar);
      },
      gagal(err) {
        if (err.status === 409) this.pesanError = 'Email sudah terdaftar.';
        else this.pesanError = 'Gagal mendaftar. Coba lagi.';
      }
    }
  }));
</script>
```

---

## `window.RaaHttp` — API Global untuk Request Manual

Untuk request yang dilakukan dari dalam method JavaScript (bukan dari HTML), gunakan `RaaHttp`:

```javascript
methods: {
  async muatProfil() {
    const response = await RaaHttp.get('/api/profil/' + this.userId);
    if (response.ok) {
      this.profil = response.data;
    } else {
      this.error = response.statusText;
    }
  },

  async simpanData() {
    const response = await RaaHttp.post('/api/data', {
      nama: this.nama,
      nilai: this.nilai
    });
    return response.ok;
  },

  async updateItem(id, data) {
    return await RaaHttp.put('/api/item/' + id, data);
  },

  async hapusItem(id) {
    return await RaaHttp.delete('/api/item/' + id);
  }
}
```

### Semua Method yang Tersedia

```javascript
// Shorthand methods
RaaHttp.get(url, options?)
RaaHttp.post(url, body, options?)
RaaHttp.put(url, body, options?)
RaaHttp.patch(url, body, options?)
RaaHttp.delete(url, options?)

// Generic request dengan config lengkap
RaaHttp.request({
  method: 'GET',
  url: '/api/data',
  headers: { 'Authorization': 'Bearer ' + token },
  query: { page: 1, limit: 20 },
  body: null,
  timeout: 5000,
  responseType: 'json',
  credentials: 'include'
})

// Buat client dengan konfigurasi base yang berbeda
const apiClient = RaaHttp.createClient({
  baseURL: 'https://api.contoh.com/v2',
  headers: { 'Authorization': 'Bearer ' + token }
});

const data = await apiClient.get('/produk');
// Request ke: https://api.contoh.com/v2/produk
```

### Objek Respons

Semua method `RaaHttp` mengembalikan Promise yang resolve dengan objek respons ini:

```javascript
{
  ok: true,           // true jika status 200-299
  status: 200,        // HTTP status code
  statusText: 'OK',   // HTTP status text
  url: '...',         // URL yang dipanggil
  headers: Headers,   // Headers object dari browser
  data: { ... },      // Isi respons (sudah di-parse sesuai responseType)
  raw: Response       // Objek Response asli dari fetch API
}

// Jika error:
{
  ok: false,
  type: 'network',    // 'network' | 'abort' | 'timeout'
  status: 0,
  statusText: 'Failed to fetch',
  message: 'Request GET /api/data failed',
  url: '...',
  method: 'GET'
}
```

---

## Interceptor Pipeline

Interceptor memungkinkan kamu memodifikasi semua request/response secara terpusat — tanpa harus mengubah setiap pemanggilan secara individual. Ini sangat berguna untuk menambahkan token autentikasi, logging, atau transformasi data.

```javascript
// Tambahkan di init() atau sebelum aplikasi berjalan

// ── Request Interceptor ────────────────────────────────────────────
// Dipanggil sebelum setiap request dikirim
// Harus mengembalikan config (boleh dimodifikasi)
RaaHttp.interceptors.request.push(async (config) => {
  // Tambahkan auth token ke semua request
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': 'Bearer ' + token
    };
  }
  return config;
});

// ── Response Interceptor ───────────────────────────────────────────
// Dipanggil setelah setiap response diterima (baik ok maupun tidak)
// Harus mengembalikan response (boleh dimodifikasi)
RaaHttp.interceptors.response.push(async (response) => {
  // Log semua response untuk debugging
  console.log(`[HTTP] ${response.status} ${response.url}`);

  // Transformasi data jika perlu
  if (response.ok && response.data?.result) {
    response.data = response.data.result; // Unwrap dari wrapper API
  }

  return response;
});

// ── Error Interceptor ──────────────────────────────────────────────
// Dipanggil saat terjadi error (network error, timeout, abort)
// Harus mengembalikan error object
RaaHttp.interceptors.error.push(async (error) => {
  console.error('[HTTP Error]', error.type, error.message);

  // Tambahkan informasi tambahan ke error
  error.userMessage = error.type === 'timeout'
    ? 'Koneksi terlalu lambat. Periksa internet Anda.'
    : 'Terjadi kesalahan jaringan.';

  return error;
});
```

### Contoh Interceptor untuk Token Refresh

```javascript
RaaHttp.interceptors.response.push(async (response) => {
  // Jika 401, coba refresh token
  if (response.status === 401 && !response._retried) {
    try {
      const refresh = await RaaHttp.post('/api/auth/refresh', {
        refreshToken: localStorage.getItem('refresh_token')
      });

      if (refresh.ok) {
        localStorage.setItem('auth_token', refresh.data.token);
        // Ulangi request asli dengan token baru
        response._retried = true;
        return await RaaHttp.request({
          ...response._originalConfig,
          headers: { Authorization: 'Bearer ' + refresh.data.token }
        });
      }
    } catch (_) {}

    // Refresh gagal — redirect ke login
    window.location.href = '/login';
  }
  return response;
});
```

---

## Contoh Lengkap: Dashboard Manajemen Data

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Manajemen Pengguna — RaaJS HTTP</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 24px 16px; color: #1e293b; }
    h1 { margin: 0 0 24px; font-size: 22px; }
    .toolbar { display: flex; gap: 8px; margin-bottom: 16px; align-items: center; }
    .toolbar input { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px; font-size: 14px; }
    .btn { border: none; border-radius: 8px; padding: 9px 16px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-danger  { background: #ef4444; color: white; }
    .btn-ghost   { background: #f1f5f9; color: #374151; border: 1px solid #e2e8f0; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .tabel { width: 100%; border-collapse: collapse; font-size: 14px; }
    .tabel th { text-align: left; padding: 10px 12px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; font-weight: 600; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
    .tabel td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
    .tabel tr:hover td { background: #f8fafc; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .badge.aktif  { background: #dcfce7; color: #15803d; }
    .badge.nonaktif { background: #fee2e2; color: #dc2626; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .modal { background: white; border-radius: 16px; padding: 28px; width: 100%; max-width: 440px; }
    .modal h3 { margin: 0 0 20px; font-size: 17px; }
    .field { margin-bottom: 14px; }
    .field label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px; }
    .field input, .field select { width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px; font-size: 14px; }
    .field input:focus, .field select:focus { outline: none; border-color: #3b82f6; }
    .modal-actions { display: flex; gap: 8px; margin-top: 20px; }
    .status-bar { display: flex; gap: 16px; margin-bottom: 16px; padding: 12px 16px; background: #f8fafc; border-radius: 10px; font-size: 13px; }
    .status-item { display: flex; align-items: center; gap: 6px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    .dot.loading { background: #f59e0b; animation: pulse 1s infinite; }
    .dot.success { background: #10b981; }
    .dot.error   { background: #ef4444; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .empty-state { text-align: center; padding: 48px; color: #94a3b8; font-size: 14px; }
  </style>
</head>
<body>

  <div raa-core:app="userApp">

    <h1>👥 Manajemen Pengguna</h1>

    <!-- Fetch otomatis saat mount — dengan reactive search -->
    <!-- Saat 'query' berubah, fetch akan diulang otomatis -->
    <div raa-http:get="'/api/pengguna?q=' + query -> pengguna"
         raa-http:reactive
         raa-http:debounce="400"
         raa-on:http:error="pesanError = $event.message">
    </div>

    <!-- Status bar -->
    <div class="status-bar">
      <div class="status-item">
        <div class="dot"
             raa-bind:class="{ loading: $http.pengguna.loading, success: $http.pengguna.success, error: $http.pengguna.error }">
        </div>
        <span raa-bind:text="$http.pengguna.loading ? 'Memuat...' : $http.pengguna.success ? 'Data terkini' : 'Error'"></span>
      </div>
      <div class="status-item">
        📊 <span raa-bind:text="(pengguna != null ? pengguna.length : 0) + ' pengguna'"></span>
      </div>
      <div class="status-item">
        🟢 <span raa-bind:text="jumlahAktif() + ' aktif'"></span>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <input type="text"
             raa-bind:model="query"
             placeholder="Cari nama atau email...">
      <button class="btn btn-primary" raa-on:click="bukaModalTambah()">
        + Tambah Pengguna
      </button>
      <button class="btn btn-ghost" raa-on:click="refresh()">
        ⟳ Refresh
      </button>
    </div>

    <!-- Tabel pengguna -->
    <template raa-flow:if="$http.pengguna.loading && !pengguna">
      <div class="empty-state">⏳ Memuat data pengguna...</div>
    </template>

    <template raa-flow:if="pengguna && pengguna.length > 0">
      <table class="tabel">
        <thead>
          <tr>
            <th>Nama</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <template raa-flow:for="user in pengguna" raa-key="user.id">
            <tr>
              <td raa-bind:text="user.nama"></td>
              <td raa-bind:text="user.email"></td>
              <td raa-bind:text="user.role"></td>
              <td>
                <span class="badge"
                      raa-bind:class="{ aktif: user.aktif, nonaktif: !user.aktif }"
                      raa-bind:text="user.aktif ? 'Aktif' : 'Nonaktif'">
                </span>
              </td>
              <td>
                <button class="btn btn-ghost"
                        style="padding: 5px 10px; font-size: 12px; margin-right: 4px;"
                        raa-on:click="bukaModalEdit(user)">
                  Edit
                </button>
                <button class="btn btn-danger"
                        style="padding: 5px 10px; font-size: 12px;"
                        raa-on:click="hapusUser(user.id, user.nama)">
                  Hapus
                </button>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </template>

    <template raa-flow:if="pengguna && pengguna.length === 0">
      <div class="empty-state">
        Tidak ada pengguna yang sesuai pencarian.
      </div>
    </template>

    <!-- Modal Tambah/Edit -->
    <template raa-flow:if="tampilModal">
      <div class="modal-overlay" raa-on:click.self="tutupModal()">
        <div class="modal">
          <h3 raa-bind:text="modeEdit ? 'Edit Pengguna' : 'Tambah Pengguna Baru'"></h3>

          <form raa-bind:class="{ 'form-edit': modeEdit }"
                raa-http:post="modeEdit ? ('/api/pengguna/' + formData.id) : '/api/pengguna -> hasilSimpan'"
                raa-http:confirm="modeEdit ? '' : ''"
                raa-on:http:success="setelahSimpan()"
                raa-on:http:error="errorModal = 'Gagal menyimpan: ' + $event.statusText">

            <div class="field">
              <label>Nama Lengkap</label>
              <input type="text" name="nama" raa-bind:model="formData.nama" required>
            </div>
            <div class="field">
              <label>Email</label>
              <input type="email" name="email" raa-bind:model="formData.email" required>
            </div>
            <div class="field">
              <label>Role</label>
              <select name="role" raa-bind:model="formData.role">
                <option value="user">User</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <template raa-flow:if="errorModal">
              <p style="color: #ef4444; font-size: 13px;" raa-bind:text="errorModal"></p>
            </template>

            <div class="modal-actions">
              <button type="submit"
                      class="btn btn-primary"
                      raa-ux:disable="$http.hasilSimpan.loading"
                      style="flex: 1;">
                <span raa-bind:text="$http.hasilSimpan.loading ? 'Menyimpan...' : 'Simpan'"></span>
              </button>
              <button type="button"
                      class="btn btn-ghost"
                      raa-on:click="tutupModal()">
                Batal
              </button>
            </div>
          </form>

        </div>
      </div>
    </template>

  </div>

  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-http.min.js"></script>
  <script>

    // Simulasi data — dalam aplikasi nyata ini diganti dengan endpoint server asli
    const DB = [
      { id: 1, nama: 'Andi Pratama',   email: 'andi@mail.com',  role: 'admin',  aktif: true },
      { id: 2, nama: 'Budi Santoso',   email: 'budi@mail.com',  role: 'editor', aktif: true },
      { id: 3, nama: 'Citra Dewi',     email: 'citra@mail.com', role: 'user',   aktif: false },
      { id: 4, nama: 'Dian Rahayu',    email: 'dian@mail.com',  role: 'user',   aktif: true }
    ];

    // Interceptor untuk simulasi server
    RaaHttp.interceptors.request.push(async (config) => {
      // Simulasi delay jaringan
      await new Promise(r => setTimeout(r, 400));

      // Handle simulasi endpoint
      if (config.url.startsWith('/api/pengguna')) {
        const q = config.url.includes('?q=')
          ? decodeURIComponent(config.url.split('?q=')[1]).toLowerCase()
          : '';
        const hasil = q
          ? DB.filter(u => u.nama.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
          : [...DB];
        // Override agar interceptor response bisa handle
        config._simulatedData = hasil;
      }
      return config;
    });

    RaaHttp.interceptors.response.push(async (res) => {
      // Return simulated data jika ada
      if (res._originalConfig?._simulatedData !== undefined) {
        res.ok = true;
        res.status = 200;
        res.data = res._originalConfig._simulatedData;
      }
      return res;
    });

    RaaJS.define('userApp', () => ({
      state: {
        pengguna: null,
        hasilSimpan: null,
        query: '',
        tampilModal: false,
        modeEdit: false,
        errorModal: '',
        formData: { id: null, nama: '', email: '', role: 'user' }
      },

      methods: {
        jumlahAktif() {
          if (!this.pengguna) return 0;
          return this.pengguna.filter(u => u.aktif).length;
        },

        bukaModalTambah() {
          this.modeEdit = false;
          this.errorModal = '';
          this.formData = { id: null, nama: '', email: '', role: 'user' };
          this.tampilModal = true;
        },

        bukaModalEdit(user) {
          this.modeEdit = true;
          this.errorModal = '';
          this.formData = { ...user };
          this.tampilModal = true;
        },

        tutupModal() {
          this.tampilModal = false;
          this.errorModal = '';
        },

        async setelahSimpan() {
          this.tutupModal();
          // Trigger ulang fetch pengguna dengan memutasi query untuk memicu reactive
          const q = this.query;
          this.query = q + ' '; // Mutasi kecil untuk trigger
          await window.Raa.nextTick();
          this.query = q;
        },

        async hapusUser(id, nama) {
          if (!confirm(`Hapus pengguna "${nama}"?`)) return;

          const res = await RaaHttp.delete('/api/pengguna/' + id);
          if (res.ok) {
            this.pengguna = this.pengguna.filter(u => u.id !== id);
          }
        },

        refresh() {
          // Force refresh dengan memutasi query sementara
          const q = this.query;
          this.query = '__refresh__';
          requestAnimationFrame(() => { this.query = q; });
        }
      }
    }));
  </script>

</body>
</html>
```

---

## Cleanup Otomatis

Ini penting untuk diketahui: semua request dan poller yang dibuat via direktif `raa-http:*` dibersihkan otomatis saat root di-destroy:

- Request yang sedang berjalan **dibatalkan** via `AbortController`
- Interval polling **dihentikan** via `clearInterval`
- Registry request untuk root tersebut **dihapus** dari memori

Ini berarti tidak ada request zombie yang tetap berjalan setelah komponen mati, dan tidak ada data lama yang tiba-tiba menimpa state yang baru setelah navigasi.

Untuk request manual via `RaaHttp.get()` dari dalam method, kamu perlu mengelola pembatalan sendiri jika diperlukan — atau gunakan `AbortController` bawaan:

```javascript
methods: {
  async muatData() {
    // Batalkan request sebelumnya jika ada
    if (this._controller) this._controller.abort();
    this._controller = new AbortController();

    const res = await RaaHttp.request({
      method: 'GET',
      url: '/api/data',
      // Tidak ada opsi signal langsung — gunakan interceptor
      // atau tangani abort di catch
    });

    if (res.ok) this.data = res.data;
  }
}
```

---

## Rangkuman Modifier dalam Satu Tabel

| Atribut | Tipe | Perilaku |
|:---|:---:|:---|
| `raa-http:reactive` | flag | GET diulang saat dependensi URL berubah |
| `raa-http:lazy` | flag | Request tidak otomatis, menunggu dipicu |
| `raa-http:poll="N"` | ms | Ulangi setiap N milidetik |
| `raa-http:debounce="N"` | ms | Tunda N ms setelah pemicu terakhir |
| `raa-http:throttle="N"` | ms | Maks satu request per N ms |
| `raa-http:timeout="N"` | ms | Batalkan jika melebihi N ms |
| `raa-http:confirm="pesan"` | string | Tampilkan dialog konfirmasi dulu |
| `raa-http:headers='{"k":"v"}'` | JSON | Tambah header kustom |
| `raa-http:query='{"k":"v"}'` | JSON | Tambah query parameter |
| `raa-http:body='{"k":"v"}'` | JSON | Override body request |
| `raa-http:response="tipe"` | string | Tipe parsing: `json`/`text`/`blob`/`formData`/`arrayBuffer` |
| `raa-on:http:success="fn()"` | expr | Handler saat berhasil (`$event` = response) |
| `raa-on:http:error="fn()"` | expr | Handler saat gagal (`$event` = error) |
| `raa-on:http:finally="fn()"` | expr | Handler yang selalu jalan |

---

*Dokumentasi ini adalah bagian dari RaaJS v3.1.0 Official Docs. Kontribusi dan koreksi disambut di repositori resmi.*

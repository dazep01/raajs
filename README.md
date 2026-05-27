# RaaJS v3.1.0: Seni Reaktivitas Minimalis
```
    ____              _______
   / __ \____ _____  / / ___/
  / /_/ / __ `/ __ `/ /\__ \ 
 / _, _/ /_/ / /_/ / /___/ / 
/_/ |_|\__,_/\__,_/_//____/  v3.1.0 "Data Liberation"
                             
Reaktif. Deklaratif. Mengutamakan HTML.
Inti frontend mungil dengan Plugin System yang cerdas dan aman.
```

---

## Manifestasi RaaJS

### Apa itu RaaJS?

**RaaJS v3.1.0** adalah *micro-framework* frontend yang memuja *HTML-first architecture*, *reactive state*, dan *declarative directives*. Di versi ini, arsitektur plugin telah direvolusi sepenuhnya: tidak ada lagi *monkey-patching* pada *prototype* — semua ekstensi kini terintegrasi melalui **Plugin System v3.1.0** yang bersih, aman, dan dapat dikelola sepenuhnya.

RaaJS diciptakan khusus untuk kamu yang ingin membangun antarmuka (*UI*) interaktif yang tangguh tanpa perlu terjebak dalam drama *toolchain* atau proses *build* yang melelahkan.

> ⚠️ **Breaking Change v3.1.0:** Atribut `raa-core:data` telah **dihapus permanen**. Gunakan `raa-core:init` dengan `Object.assign($state, { ... })` atau deklarasikan state via `RaaJS.define()`. Lihat bagian [Migrasi](#-migrasi) untuk panduan lengkap.

### Filosofi: Sepeda Balap vs Kapal Perang

Jika ekosistem *frontend* modern saat ini terasa seperti **membawa kapal perang besar hanya untuk mengantarkan sepotong roti** ke seberang jalan—megah dan penuh senjata, namun luar biasa berat serta melelahkan—maka RaaJS memilih jalan yang berbeda.

> RaaJS adalah **sepeda balap karbon yang gesit, efisien, dan ringkas**. Ia tidak dirancang untuk memenangkan lomba kemegahan fitur, melainkan untuk memastikan rotimu sampai di tujuan tepat waktu dengan energi yang minimal. Keterbacaan, ketenangan, dan kedaulatan penuh atas dokumen HTML asli adalah nilai tertinggi yang kami jaga.

*"Kesederhanaan bukanlah ketiadaan kekuatan. Ia adalah kekuatan yang didisiplinkan."*

### Fitur Unggulan v3.1.0

- **Zero Build Fatigue:** Lupakan konfigurasi bundler yang rumit. Cukup panggil skrip lewat peramban, tulis HTML, dan aplikasi langsung berjalan.
- **Plugin System v3.1.0:** Arsitektur plugin yang bersih dan aman — setiap ekstensi mendaftarkan dirinya via `Raa.use()`, memiliki lifecycle hooks, dan dapat di-*uninstall* kapan saja.
- **Island Architecture (`raa-eco:island`):** Isolasi bagian aplikasi menjadi wilayah *state* yang mandiri dan terisolasi. Aplikasi besar tetap terasa ringan.
- **CSP-Safe Expression Engine:** Parser ekspresi template berbasis AST buatan sendiri — tidak menggunakan `eval()` atau `new Function()`. Aman untuk Content Security Policy paling ketat sekalipun.
- **Advanced Priority Scheduler:** Mesin reaktivitas internal menggunakan sistem *batching* pintar berbasis `queueMicrotask`. DOM hanya diperbarui di saat yang tepat, efisien, dan tanpa *flicker*.
- **Built-in XSS Protection:** Sanitasi HTML otomatis dengan *allowlist* tag dan atribut yang ketat. Data pengguna tidak pernah bisa menyisipkan skrip berbahaya.
- **NaN-Safe Reactivity:** Menggunakan `Object.is()` untuk perbandingan nilai — perubahan `NaN → NaN` tidak pernah memicu update DOM yang tidak perlu.

---

## 📦 Instalasi via CDN

RaaJS dirancang untuk langsung digunakan. Cukup tambahkan tag `<script>` ke dalam HTML — tanpa npm, tanpa webpack, tanpa ribet.

> **Aturan Urutan Wajib:** `raa.min.js` (core) **selalu harus dimuat pertama**, sebelum semua ekstensi dan kode aplikasi.

### 🔗 Core Engine + Extensions (Rekomendasi Lengkap)

```html
<!-- ① Core Engine: Jantung dan otak reaktivitas — WAJIB & SELALU PERTAMA -->
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>

<!-- ② Extensions: Superpower tambahan, muat sesuai kebutuhan -->

<!-- Logic & Data -->
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-computed-watch.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-http.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-eventbus.min.js"></script>

<!-- UI & Experience -->
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-animation.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-ui.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-validate.min.js"></script>

<!-- Structure, Scaling & i18n -->
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-template.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-i18n.min.js"></script>

<!-- ③ DevTools — HANYA untuk development, HAPUS sebelum deploy ke production! -->
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-devtools.min.js"></script>

<!-- ④ Kode aplikasimu — selalu paling terakhir -->
<script src="app.js"></script>
```

### 🎯 Opsi Paket Instalasi

| Kebutuhan | Yang Dimuat |
|---|---|
| **Minimal** — belajar & prototipe | Hanya `raa.min.js` |
| **Standar** — aplikasi web umum | Core + `raa-computed-watch` + `raa-http` + `raa-validate` |
| **Lengkap** — aplikasi skala penuh | Semua ekstensi di atas (kecuali devtools di production) |
| **Versi Development** | Ganti `raa.min.js` → `raa.js` untuk sourcemap & pesan error yang lebih verbose |

> 💡 **Tips Versi:**
> - Gunakan `@3.1.0` untuk mengunci versi tertentu (sangat disarankan untuk production).
> - File `.min.js` sudah dikompresi; gunakan file tanpa `.min` hanya saat development.

### 🌍 Browser Support

RaaJS v3.1.0 membutuhkan dukungan **JavaScript Proxy** (ES6+):

| Browser | Versi Minimum |
|---|---|
| ✅ Chrome | 49+ |
| ✅ Firefox | 18+ |
| ✅ Safari | 10+ |
| ✅ Edge | 14+ |
| ✅ Opera | 36+ |
| ✅ Android WebView & Chrome for Android | Didukung |
| ✅ iOS Safari | 10+ |
| ❌ Internet Explorer | **Tidak Didukung** |

> IE tidak memiliki dukungan `Proxy`. RaaJS memilih tidak menggunakan polyfill berat demi menjaga ukuran "sepeda karbon" tetap ringan. Saatnya *move on*.

---

## ⚡ Langkah Cepat Memulai

### 1. Definisikan Aplikasimu (JavaScript)

Daftarkan logika *state* dan *methods* aplikasimu menggunakan `RaaJS.define()`. Ini adalah satu-satunya cara yang dianjurkan mulai v3.1.0.

```javascript
// app.js
RaaJS.define('counterApp', () => ({
  state: {
    count: 0,
    pesan: ''
  },
  methods: {
    increment() {
      this.count++;
      if (this.count > 10) this.pesan = '🎉 Sudah lebih dari 10!';
    },
    reset() {
      this.count = 0;
      this.pesan = '';
    }
  },
  init() {
    console.log('counterApp siap!');
  }
}));
```

### 2. Rangkai HTML-mu

Tulis instruksi deklaratif langsung di elemen HTML. Jujur, intuitif, dan ekspresif.

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Counter App — RaaJS v3.1.0</title>
</head>
<body>

  <div raa-core:app="counterApp">
    <!-- Data binding reaktif — aman dari XSS -->
    <h1 raa-bind:text="'Total Klik: ' + count"></h1>

    <!-- Event listener -->
    <button raa-on:click="increment()">Tambah Angka</button>
    <button raa-on:click="reset()">Reset</button>

    <!-- Kontrol alur kondisional -->
    <template raa-flow:if="count > 10">
      <p raa-bind:text="pesan"></p>
    </template>
  </div>

  <!-- ① Core dulu -->
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>
  <!-- ② Kode app terakhir -->
  <script src="app.js"></script>

</body>
</html>
```

### 3. Inisialisasi State Inline (Tanpa `RaaJS.define`)

Untuk komponen kecil atau island, gunakan `raa-core:init`:

```html
<!-- v3.1.0: raa-core:data DIHAPUS. Gunakan raa-core:init sebagai gantinya. -->
<div raa-core:app="miniApp"
     raa-core:init="Object.assign($state, { nama: 'Dunia', salam: 'Halo' })">
  <p raa-bind:text="salam + ', ' + nama + '!'"></p>
  <input type="text" raa-bind:model="nama">
</div>
```

---

## 📖 Kamus Direktif Resmi

### 1. Direktif Inti — `raa-core:*`

Mengontrol siklus hidup dan inisialisasi aplikasi.

| Direktif | Fungsi |
|---|---|
| `raa-core:app="namaApp"` | Mendeklarasikan root aplikasi, mengikatnya ke definisi `RaaJS.define()` |
| `raa-core:ref="nama"` | Memberi label unik pada elemen, dapat diakses via `this.$refs.nama` |
| `raa-core:init="ekspresi"` | Menjalankan ekspresi **sekali** saat elemen pertama kali dikompilasi |

> ~~`raa-core:data`~~ — **Dihapus di v3.1.0.** Gunakan `raa-core:init` atau `RaaJS.define()`.

### 2. Data Binding — `raa-bind:*`

Menghubungkan data *state* ke tampilan DOM.

| Direktif | Fungsi |
|---|---|
| `raa-bind:text="ekspresi"` | Render teks reaktif, aman dari XSS (teks di-*escape* otomatis) |
| `raa-bind:html="ekspresi"` | Render HTML dinamis, disanitasi otomatis sebelum dimasukkan ke DOM |
| `raa-bind:model="path"` | Two-way binding — input form ↔ state (mendukung dot notation & bracket) |
| `raa-bind:class="{ kelas: kondisi }"` | Tambah/hapus kelas CSS secara dinamis via objek atau array |
| `raa-bind:style="{ prop: nilai }"` | Manipulasi inline style via objek (gunakan camelCase untuk nama properti) |
| `raa-bind:[attr]="ekspresi"` | Ikat atribut HTML apa pun (`href`, `src`, `disabled`, `placeholder`, dsb.) |

### 3. Kontrol Alur — `raa-flow:*`

Mengontrol kapan dan berapa kali konten ditampilkan.

| Direktif | Fungsi |
|---|---|
| `raa-flow:if="kondisi"` | Render kondisional — elemen dihapus/ditambah ke DOM (gunakan pada `<template>`) |
| `raa-flow:for="item in arr"` | Render perulangan dengan keyed diffing (gunakan pada `<template>`, sertakan `raa-key`) |
| `raa-flow:show="kondisi"` | Toggle `display:none` — elemen tetap di DOM, hanya disembunyikan secara visual |

### 4. Event Handling — `raa-on:*`

Menangani interaksi pengguna dan event DOM.

| Direktif | Fungsi |
|---|---|
| `raa-on:[event]="ekspresi"` | Dengarkan event DOM apa pun (`click`, `input`, `submit`, `keydown`, dsb.) |
| `raa-on:[event].prevent` | `event.preventDefault()` |
| `raa-on:[event].stop` | `event.stopPropagation()` |
| `raa-on:[event].self` | Hanya trigger jika `event.target` adalah elemen itu sendiri |

### 5. Ekosistem & Arsitektur — `raa-eco:*`

Fitur arsitektur dan stabilitas aplikasi.

| Direktif | Fungsi |
|---|---|
| `raa-eco:island` | Ciptakan wilayah *state* yang terisolasi mandiri di tengah aplikasi besar |
| `raa-eco:persist="kunci"` | Simpan & pulihkan *state* otomatis dari `localStorage` |
| `raa-eco:auth="ekspresi"` | Kontrol visibilitas elemen berdasarkan status autentikasi reaktif |
| `raa-eco:router` | Aktifkan hash-based router pada root aplikasi |
| `raa-eco:route="/path"` | Definisikan tampilan untuk rute URL hash tertentu |

### 6. Jaringan — `raa-net:*`

Komunikasi langsung dengan server dari HTML.

| Direktif | Fungsi |
|---|---|
| `raa-net:fetch="'url' -> kunci"` | HTTP GET otomatis saat mount, hasil disimpan ke *state*, dibatalkan saat destroy |
| `raa-net:sync="'ws://url' -> kunci"` | WebSocket real-time sync, koneksi ditutup otomatis saat root di-destroy |

### 7. UX Enhancement — `raa-ux:*`

Utilitas peningkatan pengalaman pengguna.

| Direktif | Fungsi |
|---|---|
| `raa-ux:lazy` | Tunda kompilasi binding reaktif sampai elemen masuk ke *viewport* |
| `raa-ux:focus` | Auto-fokus elemen saat pertama kali dirender |
| `raa-ux:loading="kondisi"` | Tambahkan class `raa-loading` & `aria-busy="true"` saat kondisi `true` |
| `raa-ux:disable="kondisi"` | Toggle atribut `disabled` secara reaktif |

---

## 🧩 Direktif Ekstensi (Plugin System v3.1.0+)

Semua ekstensi kini mendaftarkan dirinya melalui **Plugin System** yang bersih via `window.Raa.use(plugin)` — tidak ada lagi *monkey-patching* pada *prototype*. Setiap plugin memiliki lifecycle hooks, dapat di-*uninstall*, dan aman untuk *multi-plugin environment*.

### A. Computed & Watch (`raa-computed-watch.js`)

```javascript
RaaJS.define('app', () => ({
  state: { harga: 100, qty: 3 },
  computed: {
    // Nilai turunan — hanya dihitung ulang jika dependensinya berubah
    total() { return this.harga * this.qty; }
  },
  watch: {
    // Side effect — berjalan setiap kali 'qty' berubah
    qty(nilai, lama) { console.log(`Qty: ${lama} → ${nilai}`); }
  }
}));
```

- `computed: {}` — nilai turunan reaktif yang efisien (hanya update jika perlu)
- `watch: {}` — pemantau perubahan state untuk side effects
- `this.$watch(path, callback)` — pasang watcher dinamis dari dalam method

### B. Animasi & Transisi (`raa-animation.js`)

| Direktif | Fungsi |
|---|---|
| `raa-animation:enter` | Animasi saat elemen masuk ke DOM |
| `raa-animation:leave` | Animasi saat elemen keluar dari DOM |
| `raa-animation:scroll` | Animasi dipicu saat elemen masuk ke viewport |
| `raa-animation:loop` | Animasi berulang tak terbatas |
| `raa-animation:trigger` | Animasi meledak saat elemen diklik |
| `raa-animation:group` | Orkestrasi animasi massal (stagger/parallel/sequence) |
| `raa-animation:config` | Konfigurasi durasi, easing, dan delay langsung di elemen |

Nilai direktif bisa berupa nama preset (`fade-up`, `fade-in`, `scale-in`, `zoom-in`, `flip-up`, dsb.) atau keyframe JSON kustom.

### C. HTTP Client (`raa-http.js`)

| Direktif / API | Fungsi |
|---|---|
| `raa-http:get="'url' -> kunci"` | HTTP GET deklaratif, hasil ke *state* |
| `raa-http:post`, `raa-http:put`, `raa-http:patch`, `raa-http:delete` | HTTP methods lainnya |
| `raa-http:reactive` | GET otomatis diulang saat dependensi URL berubah |
| `raa-http:lazy` | Request hanya berjalan saat dipicu manual |
| `raa-http:poll="ms"` | Polling berkala dengan interval milidetik |
| `raa-http:debounce="ms"` | Tunda eksekusi N ms setelah pemicu terakhir |
| `raa-http:throttle="ms"` | Batasi frekuensi eksekusi |
| `raa-on:http:success` | Handler saat request berhasil |
| `raa-on:http:error` | Handler saat request gagal |
| `raa-on:http:finally` | Handler yang selalu berjalan |
| `window.RaaHttp` | API global untuk request manual & interceptors |
| `$http.kunci` | Akses status request (`.loading`, `.error`, `.data`) dari template |

### D. UI Toolkit (`raa-ui.js`)

| Direktif | Fungsi |
|---|---|
| `raa-ui:tooltip="ekspresi"` | Tooltip mengambang otomatis saat elemen diarahkan kursor |
| `raa-ui:clipboard="ekspresi"` | Salin teks ke clipboard dengan satu klik |
| `raa-ui:scroll-to="'#selector'"` | Smooth scroll ke elemen target |
| `raa-ui:mask="'999-999-9999'"` | Pola masking input (nomor telepon, kartu kredit, dsb.) |
| `raa-ui:outside="handler()"` | Deteksi klik di luar elemen (ideal untuk menutup modal/dropdown) |

### E. Validasi Formulir (`raa-validate.js`)

| Direktif | Fungsi |
|---|---|
| `raa-validate:required` | Field wajib diisi |
| `raa-validate:email` | Validasi format email |
| `raa-validate:min="n"` | Minimal n karakter (atau nilai untuk input number) |
| `raa-validate:max="n"` | Maksimal n karakter (atau nilai untuk input number) |
| `raa-validate:pattern="regex"` | Validasi regex kustom |
| `raa-validate:custom="nama"` | Panggil rule kustom terdaftar via `RaaValidate.defineRule()` |
| `raa-validate:group="kunci"` | Kumpulkan hasil validasi grup ke `state[kunci]` |

Umpan balik visual (`raa-valid` / `raa-invalid` class, `aria-invalid`, pesan error) ditambahkan secara otomatis.

### F. Template Reusable (`raa-template.js`)

```html
<!-- Definisi — dihapus dari DOM, tersimpan di registry -->
<template raa-template:define="kartu-produk">
  <div class="kartu">
    <slot name="judul">Judul Default</slot>
    <slot><!-- Konten default --></slot>
  </div>
</template>

<!-- Penggunaan — dirender sebagai island terisolasi -->
<div raa-template:use="kartu-produk" raa-template:data="{ harga: 150000 }">
  <h3 slot="judul">Produk Spesial</h3>
  <p>Deskripsi produk di sini.</p>
</div>
```

### G. Event Bus (`raa-eventbus.js`)

Komunikasi antar komponen tanpa ketergantungan langsung (*decoupled*):

```javascript
// Kirim event
RaaEvents.emit('cart:updated', { total: 5 });

// Terima event di komponen lain
RaaEvents.on('cart:updated', (data) => { this.cartTotal = data.total; });
```

| Direktif / API | Fungsi |
|---|---|
| `raa-on:event:namaEvent` | Dengarkan event bus dari HTML |
| `$bus.emit(nama, payload)` | Kirim event dari template |
| `$bus.on(nama, handler)` | Daftarkan listener lokal |
| `window.RaaEvents` | API global: `emit`, `on`, `off`, `once`, `clear`, `local(root)` |

### H. Internasionalisasi (`raa-i18n.js`)

```javascript
RaaI18n.setTranslations('id', {
  salam: 'Halo, {nama}!',
  item: '1 item | {count} item'
});
RaaI18n.setLocale('id');
```

```html
<!-- Di template, $t tersedia di mana saja -->
<p raa-bind:text="$t('salam', { nama: user.nama })"></p>
<p raa-bind:text="$t('item', { count: jumlah })"></p>
<!-- $locale reaktif — berubah otomatis saat setLocale() dipanggil -->
<span raa-bind:text="$locale"></span>
```

### I. DevTools (`raa-devtools.js`)

Panel inspeksi real-time untuk development. **Jangan sertakan di production.**

| Fitur | Deskripsi |
|---|---|
| **Ctrl+Shift+R** | Toggle panel DevTools |
| **Inspector** | Lihat & edit state semua root secara langsung (God Mode) |
| **Timeline** | Rekaman kronologis setiap mutasi state |
| **Performance** | Monitor durasi flush dan kepadatan effects |
| **Events** | Log semua expression evaluation |
| **Graph** | Visualisasi dependency graph |
| **Export** | Export seluruh state ke JSON |

---

## 🔌 API Publik RaaJS

```javascript
// Mendaftarkan aplikasi
RaaJS.define('namaApp', factory);

// Mendaftarkan global yang bisa diakses dari semua template
RaaJS.defineGlobal('formatRupiah', (n) => 'Rp ' + n.toLocaleString('id-ID'));

// Membuat instance manual (biasanya tidak diperlukan)
const raa = new RaaJS({ store: {}, debug: true, trustHTML: false });

// Kompilasi elemen secara manual
window.Raa.mount('#elemen-target');

// Pasang plugin
window.Raa.use(NamaPlugin);
window.Raa.use(NamaPlugin, { opsi: true });

// Jalankan kode setelah DOM selesai diperbarui
await window.Raa.nextTick();

// Periksa plugin yang terpasang
window.Raa.pluginManager.getPlugins();
window.Raa.pluginManager.hasPlugin('raa-http');
window.Raa.pluginManager.uninstall('raa-devtools');
```

---

## 🔄 Migrasi

### Dari v3.0.0 ke v3.1.0

| Yang Berubah | v3.0.0 | v3.1.0 |
|---|---|---|
| State inline | `raa-core:data="{ x: 1 }"` | `raa-core:init="Object.assign($state, { x: 1 })"` |
| Factory state | `state: { ... }` | Tidak berubah ✅ |

`raa-core:data` **dihapus sepenuhnya**. Jika masih digunakan dalam mode `debug: true`, RaaJS akan menampilkan peringatan `[RaaJS warn:DEPRECATED]` di konsol.

### Dari v2.2.0 ke v3.x

| v2.2.0 | v3.x (v3.0.0+) | Keterangan |
|---|---|---|
| `raa-core:data` | `raa-core:init` + `Object.assign($state, {...})` | Dihapus di v3.1.0 |
| Monkey-patch `RaaJS.prototype` | `window.Raa.use(plugin)` | Plugin System baru |
| `Raa.compileRoot()` manual | `window.Raa.mount(el)` | API mount yang lebih bersih |
| `Raa.destroyRoot()` manual | Otomatis via MutationObserver | Tidak perlu manual |
| `raa-core:data` untuk island | `raa-eco:island` + `raa-core:init` | Konsisten dengan pola baru |

### Dari v2.1.x ke v2.2.0

| v2.1 (Deprecated) | v2.2+ (Standar) |
|---|---|
| `raa-app` | `raa-core:app` |
| `raa-text` / `raa-html` | `raa-bind:text` / `raa-bind:html` |
| `raa-if` / `raa-for` | `raa-flow:if` / `raa-flow:for` |
| `raa-click` | `raa-on:click` |
| `raa-island` | `raa-eco:island` |

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

---

## 📋 Changelog Singkat

| Versi | Nama | Perubahan Utama |
|---|---|---|
| **v3.1.0** | Data Liberation | `raa-core:data` dihapus; peringatan dev-mode |
| **v3.0.0** | The Perfect Union | Plugin System baru; tidak ada lagi prototype patching; optional chaining; object/array literal di ekspresi |
| **v2.2.0** | — | Namespaced directives; island architecture; XSS protection |
| **v2.1.x** | — | Sintaks lama (deprecated) |

---

> 🕊️ *Dibuat dengan ❤️ untuk pengembang yang percaya: web yang baik adalah web yang tetap manusiawi.*

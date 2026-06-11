# Apa itu RaaJS?

> **Versi Dokumentasi:** RaaJS v3.1.1 "The Iron Sanctuary"
> 
> **✨ Rilis Terbaru (2026-06-11):** Security-focused release dengan enterprise-grade hardening:
> - 🛡️ **Security Patches (P0-P2):** Prototype pollution defense, URI sanitization, shadow DOM cleanup
> - ⚡ **Performance:** Scope proxy caching, priority queue scheduler (O(N) vs O(N log N))
> - 🐛 **6 Bug Fixes:** Array binding, CallExpression eval, plugin naming, numeric keys, diagnostics, trailing comma
> - ✅ **100% Backward Compatible** — Upgrade sekarang, tidak ada migration required
> 
> Lihat [CHANGELOG.md](CHANGELOG.md) untuk detail lengkap security audit & improvements.
>
> **⚠️ Breaking Change (v3.1.0+):** Atribut `raa-core:data` telah **dihapus permanen**. Gunakan `RaaJS.define()` atau `raa-core:init` sebagai pengganti. Lihat [Panduan Migrasi v3.0 → v3.1](submenu-7-2.md) untuk detail lengkap.

---

## Selamat Datang di RaaJS

Bayangkan kamu bisa membuat halaman web yang hidup, bereaksi terhadap klik pengguna, memperbarui data secara otomatis — tanpa harus menginstal satu paket npm pun. Tanpa konfigurasi webpack. Tanpa proses build yang memakan waktu. Cukup satu file `<script>`, dan halaman HTML-mu langsung menjadi pintar.

Itulah RaaJS.

**RaaJS** adalah framework micro-frontend yang reaktif, ringan, dan tidak memerlukan proses build (*no-build*). Ia bekerja langsung di browser menggunakan teknologi JavaScript modern, membuat HTML-mu menjadi kanvas yang hidup dan responsif tanpa mengorbankan performa maupun keamanan.

---

## Rasa Pertama: Seperti Inilah RaaJS Bekerja

Sebelum masuk ke penjelasan panjang, mari rasakan langsung betapa sederhananya RaaJS. Berikut adalah aplikasi lengkap yang bisa kamu jalankan hari ini:

```html
<!-- 1. Tulis HTML seperti biasa, tambahkan direktif RaaJS -->
<div raa-core:app="halo">
  <p raa-bind:text="pesan"></p>
  <button raa-on:click="ubah()">Klik Saya</button>
</div>

<!-- 2. Sertakan satu file JS -->
<script src="raa.js"></script>

<!-- 3. Definisikan logika aplikasimu -->
<script>
  RaaJS.define('halo', () => ({
    state: { pesan: 'Halo, Dunia!' },
    methods: {
      ubah() { this.pesan = 'RaaJS itu mudah!'; }
    }
  }));
</script>
```

Ketika tombol diklik, teks berubah secara otomatis. Tidak ada `document.getElementById`. Tidak ada `.innerHTML =`. Tidak ada framework raksasa yang perlu dipelajari berminggu-minggu. Itulah inti dari RaaJS — **deklaratif, ringkas, dan langsung bekerja**.

---

## Siapa di Balik RaaJS?

RaaJS lahir dari visi **RaaRion** — sebuah keyakinan bahwa pengembangan web seharusnya terasa menyenangkan, bukan melelahkan. Kami percaya bahwa tool yang hebat tidak seharusnya menghalangi kreativitas pengembang, melainkan mempercepatnya.

RaaJS adalah jawaban kami untuk dunia yang terlalu sering memaksa pengembang melewati ritual konfigurasi yang panjang hanya untuk membuat sebuah tombol berubah warna.

---

## Untuk Siapa RaaJS Dibuat?

RaaJS dirancang untuk siapa saja yang menghargai kode yang bersih, efisien, dan elegan:

- **Pemula** yang ingin memahami konsep reaktivitas tanpa terjebak dalam kerumitan toolchain modern.
- **Developer berpengalaman** yang membutuhkan solusi ringan untuk menambahkan interaktivitas ke halaman yang sudah ada.
- **Tim kecil** yang ingin bergerak cepat tanpa overhead konfigurasi yang besar.
- **Siapa pun** yang lelah dengan konfigurasi webpack/vite hanya untuk hal-hal yang sebenarnya sederhana.

---

## Mengapa RaaJS Berbeda?

Framework JavaScript modern umumnya hadir dengan sepaket kompleksitas: Virtual DOM, transpiler, bundler, dan puluhan dependensi. RaaJS mengambil jalur yang berbeda.

### 1. Tidak Ada Build Step, Selamanya

Tidak ada `npm install`. Tidak ada `vite build`. Tidak ada `webpack.config.js`. Unduh satu file, tambahkan ke HTML-mu, dan aplikasimu langsung berjalan — bahkan di browser tanpa koneksi internet sekalipun.

### 2. Reaktivitas Native via JavaScript Proxy

Alih-alih menirukan reaktivitas dengan teknik yang berat, RaaJS menggunakan **JavaScript Proxy** yang sudah ada di setiap browser modern. Ini berarti perubahan state terdeteksi secara native — lebih cepat, lebih akurat, dan tanpa overhead.

### 3. Aman dari Serangan (CSP-Safe)

Banyak framework bergantung pada `eval()` atau `new Function()` untuk mengevaluasi ekspresi template, yang berbahaya dan diblokir oleh kebijakan keamanan ketat (Content Security Policy). RaaJS menggunakan **parser AST buatannya sendiri** — setiap ekspresi diurai dan dievaluasi dengan aman tanpa `eval`. Ini menjadikan RaaJS aman digunakan bahkan di lingkungan enterprise yang paling ketat sekalipun.

### 4. HTML-First, Bukan JS-First

Di RaaJS, HTML adalah warga kelas satu. Logika ditulis langsung sebagai atribut HTML yang bermakna — bukan di file terpisah, bukan lewat JSX, bukan melalui virtual DOM. Hasilnya: kode yang bisa dibaca manusia, bukan hanya mesin.

### 5. Island Architecture Bawaan

RaaJS mendukung pendekatan **Island Architecture** — kamu bisa memiliki banyak komponen terisolasi yang hidup berdampingan di halaman yang sama, masing-masing dengan state-nya sendiri, tanpa saling mengganggu.

### 6. Extensible via Plugin System

Inti RaaJS sengaja dijaga tetap kecil dan fokus. Fitur-fitur lanjutan (validasi, animasi, HTTP client, i18n) hadir sebagai **plugin terpisah** yang bisa kamu tambahkan sesuai kebutuhan — tidak ada fitur yang memaksakan diri masuk ke bundle-mu jika kamu tidak membutuhkannya.

---

## 🛡️ Keamanan & Performa: Level Enterprise (v3.1.1)

RaaJS v3.1.1 "The Iron Sanctuary" membawa hardening keamanan tingkat enterprise tanpa mengurangi performa:

### Perlindungan Keamanan

| Kategori | Perlindungan | Teknologi |
|---|---|---|
| **Prototype Pollution** | ✅ Tidak Dapat Ditembus | Symbol-based raw reference + Unified BLOCKED_KEYS |
| **XSS via URL** | ✅ URI Sanitization | `isDangerousUrl()` dengan leading whitespace trimming |
| **Template Injection** | ✅ AST-based Parser | No `eval()`, CSP-safe evaluation |
| **Shadow DOM** | ✅ Full Traversal | Proper cleanup untuk Web Components |

### Optimisasi Performa

| Metrik | Improvement | Teknologi |
|---|---|---|
| **Scope Proxy Allocation** | ⚡ Eliminasi Per-Eval | Two-level WeakMap caching |
| **Effect Scheduling** | ⚡ O(N) vs O(N log N)** | 4 Priority buckets (HIGH/NORMAL/LOW/IDLE) |
| **100 Effects** | ~2% faster | - |
| **1000 Effects** | ~15% faster | - |
| **10000+ Effects** | ~50%+ faster | Priority queue eliminator sort overhead |

**Backward Compatibility:** Semua kode v3.0.0+ berjalan tanpa perubahan. Upgrade instant, zero migration effort.

Lihat [SECURITY.md](SECURITY.md) untuk audit keamanan lengkap, dan [CHANGELOG.md](CHANGELOG.md) untuk technical deep-dive.

---

## Ekosistem File RaaJS — v3.1.1

RaaJS terdiri dari satu file inti yang wajib, dan sejumlah file ekstensi yang bersifat opsional. Kamu hanya perlu menyertakan apa yang benar-benar kamu butuhkan:

```
raa.min.js (v3.1.1)          ← File inti (wajib) — reaktivitas, direktif, plugin system
                              ← 🛡️ Hardened: Symbol-based refs, BLOCKED_KEYS defense, URI sanitization
                              ← ⚡ Optimized: Proxy caching, priority queue scheduler
                         
raa-computed-watch.min.js    ← Computed properties & watchers (v3.1.1)
raa-http.min.js              ← HTTP Client deklaratif (GET, POST, polling, debounce) (v3.1.1)
raa-validate.min.js          ← Validasi form otomatis dengan pesan error (v3.1.1)
raa-animation.min.js         ← Sistem animasi berbasis Web Animations API (v3.1.1)
raa-ui.min.js                ← UI Toolkit (tooltip, clipboard, mask, scroll-to) (v3.1.1)
raa-i18n.min.js              ← Internasionalisasi & multi-bahasa (v3.1.1)
raa-eventbus.min.js          ← Event Bus untuk komunikasi antar komponen (v3.1.1)
raa-template.min.js          ← Sistem template reusable dengan slot (v3.1.1)
raa-devtools.min.js          ← Panel inspeksi developer (Ctrl+Shift+R) (v3.1.1)
```

> **✨ Semua file sudah diupdate ke v3.1.1** dengan security patches, bug fixes, dan performance improvements yang sama.
> 
> **Urutan muat penting.** `raa.min.js` selalu harus dimuat **pertama**, sebelum semua file ekstensi.

---

## Direktif Utama: Sekilas Pandang

Direktif adalah "kata perintah" yang kamu tulis langsung di atribut HTML. Berikut adalah direktif-direktif yang paling sering kamu gunakan sehari-hari:

| Direktif | Fungsi |
|---|---|
| `raa-core:app="namaApp"` | Mendeklarasikan root aplikasi |
| `raa-core:init="ekspresi"` | Menjalankan kode satu kali saat elemen dikompilasi |
| `raa-core:ref="nama"` | Membuat referensi ke elemen DOM |
| `raa-bind:text="ekspresi"` | Menampilkan teks secara reaktif |
| `raa-bind:model="path"` | Two-way binding untuk form input |
| `raa-bind:class="{ kelas: kondisi }"` | Kelas CSS dinamis |
| `raa-flow:if="kondisi"` | Render kondisional (elemen dihapus/ditambah ke DOM) |
| `raa-flow:for="item in array"` | Render perulangan (loop) |
| `raa-flow:show="kondisi"` | Tampil/sembunyi via CSS display |
| `raa-on:click="handler()"` | Menangani event interaksi pengguna |
| `raa-eco:persist="kunci"` | Menyimpan state ke localStorage secara otomatis |
| `raa-eco:island` | Mengisolasi komponen dengan state-nya sendiri |

> **Referensi lengkap** semua direktif — termasuk `raa-bind:html`, `raa-bind:style`, `raa-bind:[attr]`, `raa-eco:auth`, `raa-eco:router`, `raa-net:fetch`, `raa-net:sync`, `raa-ux:lazy`, dan lainnya — tersedia di [Direktif & Template (API Reference)](submenu-3-1.md).

---

## Plugin & Ekstensi: Sekilas Pandang

Fitur-fitur lanjutan RaaJS hadir melalui plugin yang terintegrasi secara elegan dengan sistem inti:

| Plugin | File | Kemampuan Utama |
|---|---|---|
| **Computed & Watch** | `raa-computed-watch.js` | Nilai turunan reaktif via `computed: {}`, pemantau perubahan via `watch: {}`, dan `$watch()` dinamis |
| **HTTP Client** | `raa-http.js` | Direktif `raa-http:get/post/put/patch/delete`, polling, debounce, throttle, interceptor pipeline |
| **Validasi Form** | `raa-validate.js` | Direktif `raa-validate:required/email/min/max/pattern`, umpan balik visual otomatis, rule kustom |
| **UI Toolkit** | `raa-ui.js` | Direktif `raa-ui:tooltip`, `raa-ui:clipboard`, `raa-ui:mask`, `raa-ui:scroll-to`, `raa-ui:outside` |
| **Animasi** | `raa-animation.js` | Direktif `raa-animation:enter/leave/scroll/loop/trigger/group`, preset animasi bawaan |
| **Internasionalisasi** | `raa-i18n.js` | `$t(key, params)`, `$locale`, pluralisasi, fallback bahasa, locale reaktif |
| **Event Bus** | `raa-eventbus.js` | Komunikasi antar komponen via `RaaEvents`, direktif `raa-on:event:*`, `$bus` di template |
| **Template Reusable** | `raa-template.js` | `raa-template:define/use`, named slot, fallback content, state terisolasi per instance |
| **DevTools** | `raa-devtools.js` | Panel inspeksi real-time, God Mode, Timeline mutasi, Performance profiler (Ctrl+Shift+R) |

---

## Peta Dokumentasi Ini

Dokumentasi ini disusun secara bertahap — mulai dari fondasi, naik ke konsep inti, lalu ke fitur lanjutan:

| Bagian | Isi |
|---|---|
| **1 — Pengenalan & Dasar** | Konsep, instalasi, dan aplikasi pertamamu *(kamu sedang di sini)* |
| **2 — Panduan Inti** | Bagaimana reaktivitas, state, dan siklus hidup aplikasi bekerja |
| **3 — Direktif & Template** | Referensi lengkap semua direktif dengan contoh kode |
| **4 — Bahasa Ekspresi & Keamanan** | Sintaks ekspresi yang didukung, scope evaluator, dan sanitasi |
| **5 — Ekosistem & Plugin** | Computed, HTTP, validasi, animasi, i18n, event bus, dan lainnya |
| **6 — Arsitektur Plugin Kustom** | Membuat plugin sendiri, lifecycle hooks, dan direktif kustom |
| **7 — Troubleshooting & Migrasi** | Masalah umum, panduan migrasi v3.0→v3.1, dan tips performa |

Tidak perlu terburu-buru. Setiap bagian dirancang untuk membangun pemahamanmu selangkah demi selangkah. Mulai dari yang paling mudah, dan kamu akan mengusai RaaJS lebih cepat dari yang kamu bayangkan.

---

*Dokumentasi ini adalah bagian dari **RaaJS v3.1.1 "The Iron Sanctuary" Official Docs**.*

**Dokumentasi Terkait:**
- 📖 [CHANGELOG.md](CHANGELOG.md) — Detail lengkap semua perubahan, security patches, dan bug fixes
- 🔧 [README.md](README.md) — Installation, quick start, dan CDN links

Kontribusi dan koreksi disambut di [repositori resmi](https://github.com/dazep01/raajs) atau [collaboration portal](https://dazep01.github.io/raajs/collabs/).
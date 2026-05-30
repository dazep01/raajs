# Scope Evaluator — Kompas Navigasi Variabel di Dunia Reaktif

> **Versi: RaaJS v3.1.0** "Data Liberation"
> *Menegnal mesin evaluasi ekspresi RaaJS yang memastikan keamanan dan isolasi lingkungan runtime*

---

Di bab sebelumnya, kita sudah belajar *apa* yang bisa ditulis di dalam ekspresi template. Sekarang, mari kita jawab pertanyaan yang lebih mendasar: **dari mana asal variabel-variabel itu?**

Ketika kamu menulis `raa-bind:text="user.nama"`, bagaimana RaaJS tahu bahwa `user` itu merujuk ke properti di state, bukan ke variabel global browser? Jawabannya ada di **Scope Evaluator** — mesin pintar yang menjadi "kompas navigasi" bagi setiap ekspresi di template RaaJS.

---

## Filosofi: "Lingkungan Terkendali, Bukan JavaScript Liar"

Bayangkan Scope Evaluator seperti **resepsionis hotel eksklusif**. Setiap tamu (variabel) yang ingin masuk ke lobi (ekspresi template) harus melalui pemeriksaan:

1. Apakah kamu tamu VIP yang sudah terdaftar? (`$state`, `$refs`, dll.)
2. Apakah kamu membawa undangan khusus untuk acara ini? (`$event`, `$index`)
3. Apakah kamu anggota keluarga tamu utama? (variabel loop leluhur)
4. Apakah namamu ada di daftar penghuni kamar? (properti state)
5. Apakah kamu staf hotel yang diizinkan masuk? (`Math`, `JSON`, dll.)

Jika tidak memenuhi salah satu kriteria di atas? **Akses ditolak.**

Ini bukan pembatasan yang sewenang-wenang. Ini adalah **desain keamanan proaktif** yang memastikan:
- Template kamu tidak bisa secara tidak sengaja (atau sengaja) mengakses `window.alert`, `document.cookie`, atau API browser sensitif lainnya.
- Kode kamu tetap aman bahkan di lingkungan dengan **Content Security Policy (CSP)** paling ketat — karena RaaJS tidak menggunakan `eval()` atau `new Function()`.
- Debugging menjadi lebih mudah: setiap error evaluasi dilaporkan dengan konteks yang jelas, bukan stack trace misterius dari JavaScript engine.

> 💡 **Analogi Teknis**: Scope Evaluator adalah **Proxy berlapis** yang menerapkan *scope resolution order* — urutan prioritas pencarian variabel yang deterministik dan dapat diprediksi.

---

## Keamanan & Isolasi: Mengapa `window` Tidak Bisa Diakses?

### CSP-Safe by Design
RaaJS mengevaluasi ekspresi menggunakan **AST Parser custom**, bukan `eval()`. Artinya:

```javascript
// ❌ Tidak pernah terjadi di RaaJS:
eval("user.nama + window.location.href"); // Bahaya!

// ✅ Yang terjadi di RaaJS:
// 1. String "user.nama" di-tokenize → [Identifier:user, Punctuator:., Identifier:nama]
// 2. Diparsing menjadi AST: MemberExpression(object: Identifier:user, property: Identifier:nama)
// 3. Dievaluasi di dalam Proxy Scope yang memblokir akses ke global berbahaya
```

### Blocked Globals
Variabel berikut **sengaja diblokir** dan akan mengembalikan `undefined` jika diakses:

| Variabel | Alasan Diblokir |
|----------|----------------|
| `window` | Mencegah manipulasi konteks browser |
| `document` | Mencegah manipulasi DOM di luar kendali reaktif |
| `globalThis` | Mencegah akses ke lingkungan runtime global |
| `self`, `top`, `parent` | Mencegah eskalasi konteks iframe/window |

```html
<!-- ❌ Ini tidak akan bekerja — akan return undefined -->
<p raa-bind:text="window.location.href"></p>

<!-- ✅ Akses URL via state atau method yang aman -->
<p raa-bind:text="currentPageUrl"></p>
```

---

## Urutan Resolution Scope: 5 Lapisan Pencarian

Ketika Scope Evaluator bertemu dengan sebuah identifier (misalnya `nama`), ia mencarinya melalui **5 lapisan berurutan**. Lapisan pertama yang menemukan variabel akan digunakan — pencarian berhenti di sana.

```mermaid
graph TB
    %% ---------- PRIORITAS 1 ----------
    subgraph P1[🔝 Prioritas 1 – SPECIAL KEYS]
        direction TB
        A1["1️⃣ SPECIAL KEYS"]
        A2["  - $store<br>  - $refs<br>  - $el<br>  - $state<br>  - $locals"]
        A1 --> A2
    end

    %% ---------- PRIORITAS 2 ----------
    subgraph P2[🟠 Prioritas 2 – EXTRA LOCALS]
        direction TB
        B1["2️⃣ EXTRA LOCALS"]
        B2["  - $event<br>(dari raa-on:)"]
        B3["  - $index<br>(dari raa-flow:for)"]
        B1 --> B2
        B1 --> B3    end

    %% ---------- PRIORITAS 3 ----------
    subgraph P3[🟡 Prioritas 3 – ANCESTOR LOOP LOCALS]
        direction TB
        C1["3️⃣ ANCESTOR LOOP LOCALS"]
        C2["  Variabel dari loop leluhur<br>(via $locals)"]
        C1 --> C2
    end

    %% ---------- PRIORITAS 4 ----------
    subgraph P4[🟢 Prioritas 4 – REACTIVE STATE]
        direction TB
        D1["4️⃣ REACTIVE STATE"]
        D2["  Properti yang dideklarasikan<br>di state: {} factory"]
        D1 --> D2    end

    %% ---------- PRIORITAS 5 ----------
    subgraph P5[⚪ Prioritas 5 – SAFE GLOBALS]
        direction TB
        E1["5️⃣ SAFE GLOBALS"]
        E2["  Math, Date, JSON, parseInt,<br>Array, Object, dll."]
        E1 --> E2
    end

    %% ---------- PENCARAN URUTAN ----------
    classDef top fill:#ffeb3b,stroke:#f57c00,stroke-width:2px;
    classDef mid fill:#cce5ff,stroke:#2196f3,stroke-width:2px;
    classDef low fill:#e0e0e0,stroke:#757575,stroke-width:2px;
    class P1 top
    class P2,P3,P4 mid
    class P5 low

    %% Mengurutkan tampilan dari atas ke bawah
    P1 --> P2 --> P3 --> P4 --> P5
```

### Contoh Visual: Siapa Menang dalam Konflik Nama?

```html
<div raa-core:app="konflikDemo">
  <!-- State memiliki properti 'nama' -->
  
  <template raa-flow:for="nama in daftarNama" raa-key="nama">
    <!-- ❓ Variabel 'nama' di sini merujuk ke mana? -->
    
    <p raa-bind:text="nama"></p>
    <!-- ✅ Jawaban: Lapisan 2 — variabel loop 'nama' (extra local) -->
    
    <p raa-bind:text="$state.nama"></p>
    <!-- ✅ Jawaban: Lapisan 1 — state.nama (special key) -->
    
    <p raa-bind:text="$locals.nama"></p>
    <!-- ✅ Jawaban: Lapisan 3 — variabel loop leluhur (jika ada nested loop) -->
  </template>
</div>
```

```javascript
RaaJS.define('konflikDemo', () => ({
  state: {
    nama: 'State Utama',        // Lapisan 4
    daftarNama: ['Loop A', 'Loop B']
  }
}));
```

> 🎯 **Aturan Praktis**: Jika ada konflik nama, gunakan **prefix `$`** untuk mengakses lapisan yang lebih tinggi: `$state.nama`, `$locals.item`, dll.

---

## Variabel Khusus: "Superpower" yang Selalu Tersedia

RaaJS menyuntikkan sejumlah variabel "ajaib" ke dalam scope ekspresi. Mereka tersedia di **semua template**, tanpa perlu deklarasi.

### `$state` — Pintu Utama ke Reactive State
Referensi langsung ke objek state reaktif. Berguna saat ada *naming conflict* atau saat kamu perlu meneruskan seluruh state ke fungsi.

```html
<!-- Akses biasa — sama dengan $state.nama -->
<p raa-bind:text="nama"></p>

<!-- Akses eksplisit — jelas dan tidak ambigu -->
<p raa-bind:text="$state.nama"></p>

<!-- Berguna saat variabel loop menutupi state -->
<template raa-flow:for="user in users">
  <!-- 'user' di sini adalah variabel loop -->
  <p raa-bind:text="user.nama"></p>
  
  <!-- Tapi state juga punya properti 'user'? Gunakan $state -->
  <p raa-bind:text="$state.user?.admin ? '👑 Admin' : '👤 User'"></p>
</template>
```

### `$refs` — Akses Aman ke Elemen DOM
Berisi semua elemen yang memiliki `raa-core:ref`. **Hanya untuk read-only** di template — manipulasi DOM tetap harus via state/directives.

```html
<input raa-core:ref="emailInput" type="email" raa-bind:model="email">

<!-- Baca nilai (read-only) -->
<p raa-bind:text="$refs.emailInput?.value || 'Kosong'"></p>

<!-- ❌ Jangan lakukan ini di template: -->
<!-- <button raa-on:click="$refs.emailInput.focus()"></button> -->
<!-- ✅ Lakukan di method: -->
<button raa-on:click="fokusEmail()">Fokus</button>

<script>
RaaJS.define('formApp', () => ({
  state: { email: '' },
  methods: {
    fokusEmail() {
      this.$refs.emailInput?.focus(); // Aman, di dalam method
    }
  }
}));
</script>
```

### `$el` — Referensi ke Elemen Saat Ini
Merujuk ke elemen DOM tempat direktif berada. Berguna untuk membaca properti DOM elemen itu sendiri.

```html
<!-- Deteksi apakah elemen sedang disabled -->
<button 
  raa-bind:disable="!formValid"
  raa-on:click="klikTombol($el.disabled)"
>
  Kirim
</button>

<!-- Baca atribut custom -->
<div 
  raa-core:ref="container"
  data-role="editor"
  raa-on:click="bukaEditor($el.dataset.role)"
>
  Area Editor
</div>
```

### `$store` — Global Store Bersama
Akses ke objek global yang dibagi oleh **semua aplikasi RaaJS** di halaman yang sama.

```html
<!-- Baca tema global -->
<p raa-bind:text="$store.tema === 'dark' ? '🌙' : '☀️'"></p>

<!-- Update tema (via method, bukan langsung di template) -->
<button raa-on:click="gantiTema('light')">Mode Terang</button>

<script>
// Inisialisasi global store
window.Raa = new RaaJS({
  store: { tema: 'light', appVersion: '3.1.0' }
});

RaaJS.define('uiControls', () => ({
  methods: {
    gantiTema(temaBaru) {
      this.$store.tema = temaBaru; // Update global
    }
  }
}));
</script>
```

### `$event` — Objek Event Browser (Hanya di `raa-on:`)
Objet event asli dari browser. Hanya tersedia di dalam ekspresi `raa-on:*`.

```html
<!-- Akses nilai input via $event -->
<input 
  raa-on:input="updateNilai($event.target.value)"
  placeholder="Ketik sesuatu..."
>

<!-- Akses modifier event -->
<button raa-on:click.stop="handleKlik($event)">
  Klik (stopPropagation)
</button>

<!-- Pattern umum: destructuring di method, bukan di template -->
<input raa-on:input="handleInput($event)">

<script>
methods: {
  handleInput(e) {
    const { value, name } = e.target;
    this.state[name] = value; // Clean & readable
  }
}
</script>
```

### `$index` — Indeks Loop (Hanya di `raa-flow:for`)
Indeks numerik item saat ini dalam loop. Otomatis tersedia tanpa deklarasi.

```html
<template raa-flow:for="produk in keranjang" raa-key="produk.id">
  <div class="cart-item">
    <!-- Nomor urut (1-based) -->
    <span raa-bind:text="$index + 1"></span>
    
    <!-- Nama produk -->
    <span raa-bind:text="produk.nama"></span>
    
    <!-- Tampilkan badge untuk item pertama -->
    <span raa-flow:if="$index === 0" class="badge">✨ Terbaru</span>
  </div>
</template>
```

### `$locals` — Jendela ke Loop Leluhur (Nested Loops)
Variabel paling powerful untuk **nested `raa-flow:for`**. Memberi akses ke variabel loop dari scope luar.

```html
<!-- Nested loop: kategori → produk -->
<template raa-flow:for="kategori in menu" raa-key="kategori.id">
  <h3 raa-bind:text="kategori.nama"></h3>
  
  <template raa-flow:for="item in kategori.produk" raa-key="item.id">
    <div>
      <!-- 'kategori' tidak langsung accessible di loop dalam! -->
      <!-- Gunakan $locals.kategori -->
      <p raa-bind:text="$locals.kategori.nama + ' › ' + item.nama"></p>
      
      <!-- Akses indeks loop luar -->
      <small raa-bind:text="'Kategori #' + $locals.$index"></small>
    </div>
  </template>
</template>
```

> 💡 **Pro Tip**: `$locals` adalah **objek Proxy** yang mengumpulkan semua variabel loop dari setiap level leluhur. Kamu bisa mengaksesnya dengan nama variabel asli: `$locals.namaVariabel`.

---

## Safe Globals: JavaScript Bawaan yang Diizinkan

Selain variabel khusus di atas, Scope Evaluator juga mengizinkan akses ke sejumlah **global JavaScript yang aman**. Ini adalah subset yang dipilih dengan cermat — cukup untuk kebutuhan umum, tapi tidak cukup untuk membahayakan keamanan.

| Kategori | Yang Tersedia | Contoh Penggunaan |
|----------|--------------|------------------|
| **Matematika** | `Math` (semua method) | `Math.round(harga)`, `Math.max(a, b)` |
| **Tanggal** | `Date` | `new Date(tanggal).toLocaleDateString()` |
| **Serialisasi** | `JSON` | `JSON.stringify(data)`, `JSON.parse(str)` |
| **Tipe Data** | `Array`, `Object`, `String`, `Number`, `Boolean`, `RegExp` | `Array.isArray(x)`, `String(123)` |
| **Koleksi** | `Map`, `Set`, `WeakMap`, `WeakSet` | `new Map()`, `new Set([1,2,3])` |
| **Konversi** | `parseInt`, `parseFloat`, `isNaN`, `isFinite` | `parseInt(input)`, `isNaN(nilai)` |
| **URL** | `encodeURIComponent`, `decodeURIComponent`, `encodeURI`, `decodeURI` | `encodeURIComponent(query)` |
| **Async** | `Promise` | `Promise.resolve(data)` |
| **Internasional** | `Intl` | `new Intl.NumberFormat('id-ID')` |
| **Debug** | `console` | `console.log('debug')` *(hanya di mode debug)* |

```html
<!-- Contoh penggunaan safe globals di template -->

<!-- Math -->
<p raa-bind:text="Math.floor(harga * 1.1)"></p>
<p raa-bind:text="Math.abs(selisih)"></p>

<!-- String & Number -->
<p raa-bind:text="String(kode).padStart(4, '0')"></p>
<p raa-bind:text="harga.toLocaleString('id-ID')"></p>

<!-- Intl untuk format yang proper -->
<p raa-bind:text="new Intl.NumberFormat('id-ID', { 
  style: 'currency', 
  currency: 'IDR' 
}).format(total)"></p>

<!-- Array utilities -->
<p raa-bind:text="Array.isArray(data) ? '✅ Array' : '❌ Bukan'"></p>
```

### Menambahkan Global Kustom via `RaaJS.defineGlobal()`

Butuh helper yang bisa dipakai di **semua template**? Daftarkan via API statis:

```javascript
// Daftarkan sekali, pakai di mana saja
RaaJS.defineGlobal('formatRupiah', (nilai) => {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(nilai || 0);
});

RaaJS.defineGlobal('tanggalIndo', (date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
});
```

```html
<!-- Langsung tersedia di semua template, tanpa import -->
<p raa-bind:text="formatRupiah(harga)"></p>
<p raa-bind:text="tanggalIndo(artikel.tanggal)"></p>
```

> ⚠️ **Peringatan**: Global kustom harus **pure function** (tanpa side effect) dan **deterministik**. Jangan daftarkan fungsi yang memodifikasi state atau melakukan I/O — itu adalah tanggung jawab `methods`.

---

## Error Handling: Ketika Ekspresi Gagal

### EVAL_FAIL — Ekspresi Tidak Valid
Ketika parser atau evaluator menemui error, RaaJS menampilkan warning terstruktur:

```javascript
[RaaJS warn:EVAL_FAIL] Expression evaluation failed: "user ?? 'Guest'" — SyntaxError: Invalid character
```

**Penyebab umum**:
- Menggunakan operator tidak didukung (`??`, template literal, `typeof`, dll.)
- Typo pada nama variabel
- Akses properti pada `null`/`undefined` tanpa optional chaining

**Solusi**:
1. Periksa sintaks ekspresi — gunakan hanya operator yang didukung
2. Aktifkan `debug: true` untuk stack trace lengkap:
   ```javascript
   window.Raa = new RaaJS({ debug: true });
   ```
3. Gunakan optional chaining (`?.`) untuk akses properti yang mungkin null

### UNKNOWN_KEY — Properti Tidak Dideklarasikan di State
```javascript
[RaaJS warn:UNKNOWN_KEY] Assigning to unknown key "newProp" on state. If this is a typo, fix the template expression.
```

**Penyebab**: Mencoba mengassign nilai ke properti yang **tidak ada di deklarasi `state: {}` awal**.

**Mengapa ini penting?** Hanya properti yang dideklarasikan di `state` awal yang akan menjadi **reaktif**. Properti baru yang ditambahkan dinamis tidak akan memicu update DOM.

```javascript
// ❌ Salah: newProp tidak reaktif
RaaJS.define('app', () => ({
  state: { count: 0 }
  // newProp tidak dideklarasikan
}));

// Di template:
// <input raa-bind:model="newProp"> // Warning: UNKNOWN_KEY

// ✅ Benar: deklarasikan semua properti yang akan digunakan
RaaJS.define('app', () => ({
  state: { 
    count: 0,
    newProp: '' // Sekarang reaktif!
  }
}));
```

> 💡 **Tips**: Untuk state teknis/internal yang tidak perlu reaktif, gunakan prefix `_`: `_cache`, `_temp`, `_timer`. Ini memberi sinyal ke developer (dan ke RaaJS) bahwa properti ini tidak dimaksudkan untuk binding template.

---

## Best Practices: Menulis Ekspresi yang Sehat

### 1. Gunakan `$state` Saat Ada Konflik Nama
```html
<!-- ❌ Ambigu: 'user' bisa variabel loop atau state -->
<template raa-flow:for="user in users">
  <p raa-bind:text="user.nama"></p>
</template>

<!-- ✅ Jelas: $state.user merujuk ke state, user merujuk ke loop -->
<template raa-flow:for="user in users">
  <p raa-bind:text="user.nama + (user.id === $state.currentUser?.id ? ' ★' : '')"></p>
</template>
```

### 2. Akses DOM Hanya via `$refs` (di Method), Bukan Langsung di Template
```html
<!-- ❌ Salah: Manipulasi DOM di template -->
<div raa-bind:style="$el.style.color = 'red'"></div>

<!-- ✅ Benar: Via state + directives -->
<div raa-bind:style="{ color: textColor }"></div>

<script>
methods: {
  // Jika benar-benar perlu akses DOM, lakukan di method
  fokusInput() {
    this.$refs.input?.focus();
  }
}
</script>
```

### 3. Pindahkan Logika Kompleks ke `methods`
```html
<!-- ❌ Template jadi sulit dibaca -->
<p raa-bind:text="daftar.filter(i => !i.terhapus && i.kategori === aktif).length > 0 ? 'Ada ' + daftar.filter(i => !i.terhapus && i.kategori === aktif).length + ' item' : 'Kosong'"></p>

<!-- ✅ Bersih dan maintainable -->
<p raa-bind:text="infoJumlahItem()"></p>

<script>
methods: {
  itemTampil() {
    return this.daftar.filter(i => !i.terhapus && i.kategori === this.aktif);
  },
  infoJumlahItem() {
    const count = this.itemTampil().length;
    return count > 0 ? `Ada ${count} item` : 'Kosong';
  }
}
</script>
```

> 🎯 **Aturan Emas**: Jika ekspresi bisa dibaca dalam satu tarikan napas tanpa mengernyitkan dahi — taruh di template. Jika tidak — taruh di `methods`.

---

## Anti-Pattern: Jebakan yang Harus Dihindari

### `**X**` Mengakses State Leluhur Tanpa `$locals`
```html
<!-- ❌ Salah: 'kategori' tidak accessible di loop dalam -->
<template raa-flow:for="kategori in menu">
  <template raa-flow:for="item in kategori.produk">
    <p raa-bind:text="kategori.nama + ' › ' + item.nama"></p>
    <!-- Error: kategori is undefined di scope ini -->
  </template>
</template>

<!-- ✅ Benar: Gunakan $locals -->
<template raa-flow:for="kategori in menu">
  <template raa-flow:for="item in kategori.produk">
    <p raa-bind:text="$locals.kategori.nama + ' › ' + item.nama"></p>
  </template>
</template>
```

### `**X**` Menggunakan Ekspresi untuk Side Effect
```html
<!-- ❌ Salah: Ekspresi seharusnya pure, bukan untuk mutasi -->
<button raa-on:click="count = count + 1">Tambah</button>

<!-- ✅ Benar: Mutasi state via method -->
<button raa-on:click="tambahCount()">Tambah</button>

<script>
methods: {
  tambahCount() {
    this.count++; // Jelas, terenkapsulasi, mudah di-test
  }
}
</script>
```

### `**X**` Mengandalkan Urutan Evaluasi yang Tidak Dijamin
```html
<!-- ❌ Berbahaya: Mengasumsikan urutan eksekusi -->
<div raa-bind:text="a = b + 1"></div> <!-- Assignment di template! -->
<div raa-bind:text="b = a * 2"></div>

<!-- ✅ Benar: Hitung di method, tampilkan di template -->
<div raa-bind:text="hasilA"></div>
<div raa-bind:text="hasilB"></div>

<script>
methods: {
  hitungSemua() {
    this.hasilA = this.b + 1;
    this.hasilB = this.hasilA * 2;
  }
}
</script>
```

---

## Internal Flags: Apa yang Dikelola Scope Evaluator?

Di balik layar, Scope Evaluator mengelola sejumlah **flags internal** pada elemen DOM untuk melacak konteks evaluasi. Kamu tidak perlu memanipulasinya langsung, tapi mengetahui keberadaannya membantu debugging.

| Flag | Tipe | Fungsi |
|------|------|----------|
| `el.__raa_locals__` | `object` | Menyimpan variabel loop dari `raa-flow:for` untuk akses via `$locals` |
| `el.__raa_state__` | `Proxy` | Referensi ke state reaktif (hanya pada root element) |
| `el.__raa_effects__` | `Effect[]` | Daftar effect reaktif yang terikat ke elemen ini |
| `el.__raa_root__` | `Element` | Referensi ke root app tempat elemen ini berada |

> 🔐 **Penting**: Flags ini dimulai dengan `__raa_` — konvensi yang menandakan "internal use only". Jangan andalkan atau modifikasi langsung dalam kode aplikasi.

---

## Contoh Lengkap: Semua Fitur Scope dalam Satu Halaman

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Demo Scope Evaluator — RaaJS</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 16px; color: #1e293b; }
    .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
    .card h3 { margin: 0 0 12px; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .result { background: #f8fafc; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 14px; margin: 8px 0; }
    input, select { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; width: 100%; margin: 4px 0; font-size: 14px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin: 2px; }
    .hijau { background: #dcfce7; color: #15803d; }
    .merah { background: #fee2e2; color: #dc2626; }
    .biru { background: #dbeafe; color: #1d4ed8; }
  </style>
</head>
<body>

  <h2>🧭 Lab Scope Evaluator</h2>

  <div raa-core:app="scopeLab">

    <!-- $state vs variabel loop -->
    <div class="card">
      <h3>1. Konflik Nama: $state vs Loop Variable</h3>
      <input type="text" raa-bind:model="nama" placeholder="Nama di state">
      <template raa-flow:for="nama in daftar" raa-key="nama">
        <div class="result">
          <p><strong>Loop:</strong> <span raa-bind:text="nama"></span></p>
          <p><strong>State:</strong> <span raa-bind:text="$state.nama"></span></p>
        </div>
      </template>
    </div>

    <!-- $refs & $el -->
    <div class="card">
      <h3>2. $refs & $el: Akses DOM yang Aman</h3>
      <input raa-core:ref="inputDemo" type="text" placeholder="Ketik...">
      <div class="result">
        <p>Nilai via $refs: <span raa-bind:text="$refs.inputDemo?.value || '(kosong)'"></span></p>
        <p>Tag elemen: <span raa-bind:text="$el.tagName.toLowerCase()"></span> *(di dalam card ini)*</p>
      </div>
      <button raa-on:click="fokusInput()">Fokus Input</button>
    </div>

    <!-- $locals: Nested Loop -->
    <div class="card">
      <h3>3. $locals: Nested Loop</h3>
      <template raa-flow:for="kategori in menu" raa-key="kategori.id">
        <h4 raa-bind:text="kategori.nama"></h4>
        <template raa-flow:for="item in kategori.produk" raa-key="item.id">
          <div style="margin-left: 16px; padding: 4px 0;">
            <span raa-bind:text="$locals.kategori.nama + ' › ' + item.nama"></span>
            <span class="badge biru" raa-flow:if="$locals.$index === 0">✨ Pertama</span>
          </div>
        </template>
      </template>
    </div>

    <!-- Safe Globals + Global Kustom -->
    <div class="card">
      <h3>4. Safe Globals & Global Kustom</h3>
      <input type="number" raa-bind:model="harga" placeholder="Harga">
      <div class="result">
        <p>Format Rupiah: <span raa-bind:text="formatRupiah(harga)"></span></p>
        <p>Math: <span raa-bind:text="Math.round(harga * 1.1)"></span></p>
        <p>Intl: <span raa-bind:text="new Intl.NumberFormat('id-ID', {style:'currency',currency:'IDR'}).format(harga)"></span></p>
      </div>
    </div>

  </div>

  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>
  <script>
    // Global kustom
    RaaJS.defineGlobal('formatRupiah', (nilai) => 
      'Rp ' + new Intl.NumberFormat('id-ID').format(nilai || 0)
    );

    RaaJS.define('scopeLab', () => ({
      state: {
        nama: 'State Utama',
        daftar: ['Loop A', 'Loop B', 'Loop C'],
        menu: [
          { id: 1, nama: 'Minuman', produk: [
            { id: 101, nama: 'Kopi' },
            { id: 102, nama: 'Teh' }
          ]},
          { id: 2, nama: 'Makanan', produk: [
            { id: 201, nama: 'Nasi Goreng' },
            { id: 202, nama: 'Mie Ayam' }
          ]}
        ],
        harga: 25000
      },
      methods: {
        fokusInput() {
          this.$refs.inputDemo?.focus();
        }
      }
    }));
  </script>

</body>
</html>
```

---

> *Dokumentasi ini adalah bagian dari RaaJS v3.1.0 Official Docs. Kontribusi dan koreksi disambut di repositori resmi.*
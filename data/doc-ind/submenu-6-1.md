# Membuat Plugin — Ekstensi yang Menenun Diri ke dalam Mesin
> **Versi: RaaJS v3.1.0 "Data Liberation"**
> 
> Menciptakan jendela-jendela baru yang dipasang pada dinding kokoh sebuah bangunan, yang mengizinkan cahaya kreativitas luar masuk tanpa harus meruntuhkan arsitektur utamanya. Bagaikan menanam organ-organ baru pada tubuh yang sudah hidup, mereka memberi kekuatan ekstra bagi sang inang tanpa pernah mengubah detak jantung asalnya.

---

Plugin di RaaJS bukan sekadar tambahan fitur yang ditempel di luar. Ia adalah benang yang ditenun langsung ke dalam struktur mesin reaktif saat halaman pertama kali dimuat. Ketika kamu memanggil `Raa.use()`, instance RaaJS menjalankan fungsi `install` milik plugin. Instance itu menyerahkan akses penuh ke subsistem inti: evaluator, scheduler, pengikat DOM, dan pengelola siklus hidup. Plugin kemudian menyisipkan direktif, mendaftarkan hook, atau memperluas scope tanpa mengubah kode sumber framework. Ini berarti kamu bisa mengubah perilaku framework secara mendasar, tapi dengan tanggung jawab penuh. Setiap patch yang salah tempat bukan hanya akan gagal, tapi bisa memutus rantai reaktivitas.

---

## Arsitektur IIFE & Aturan Instance Patching

Plugin di RaaJS beroperasi di dalam dinding yang sengaja dibangun tinggi. Sejak v3.0.0, seluruh logika inti dikemas dalam IIFE untuk mencegah konflik namespace dan memastikan isolasi yang ketat.

Ketika fungsi `install(raa, options)` dipanggil, framework tidak mengirimkan kelas statis. Ia mengirimkan objek instance yang sedang hidup dan mengompilasi DOM. Semua perluasan harus dilakukan pada objek `raa` ini. Kamu tidak bisa, dan tidak boleh, mengakses `RaaJS.prototype` dari luar skrip.

### Aturan Pertama yang Tidak Boleh Dilanggar
Jangan pernah memperluas `RaaJS.prototype` dari luar IIFE. Dinding enkapsulasi sengaja mencegah akses langsung ke konstruktor. Memaksa patch ke prototype akan memutus rantai dependency, menyebabkan mutasi global yang tidak terdeteksi, dan membuat plugin gagal saat beberapa aplikasi RaaJS berjalan bersamaan di halaman yang sama.

```javascript
// ❌ Salah — prototype tersembunyi di dalam IIFE, tidak bisa diakses
RaaJS.prototype.customMethod = function() { /* ... */ };

// ✅ Benar — patch instance yang diberikan ke install()
install(raa) {
  const origCompile = raa.compileRoot.bind(raa);
  raa.compileRoot = function(root) {
    console.log('[MyPlugin] Compiling root:', root);
    return origCompile(root);
  };
}
```

**Implikasi:** Pluginmu harus mandiri. Ia tidak boleh bergantung pada fungsi internal yang tidak terekspos. Gunakan hanya API yang tersedia di objek `raa`: `evaluate`, `assign`, `createEffect`, `scheduleEffect`, `compileSubtree`, `pluginManager`, `_globals`, dan `_directiveCache`.

Pertanyaan paling simpel: "Apakah modifikasi ini mengubah kelas secara global atau hanya instance yang sedang berjalan?"
Kalau jawabannya "Instance yang sedang berjalan" — gunakan `raa.xxx`.
Kalau jawabannya "Global" — hentikan. Itu adalah anti-pattern di RaaJS v3.x.
Dan ada satu pertimbangan lagi yang sering luput: jika kamu membungkus `raa.compileRoot` atau `raa.evaluate`, selalu simpan referensi asli dengan `.bind(raa)` sebelum menimpanya. Kehilangan konteks `this` adalah sumber bug paling sunyi dalam sistem plugin.

---

## Bentuk Dasar Objek Plugin

Plugin adalah kontrak tertulis. Ia menuntut struktur tertentu agar mesin bisa mengenalinya, memvalidasinya, dan menjadwalkan pemuatannya.

Objek plugin minimal harus memiliki `name` untuk identitas unik, dan `install` untuk titik integrasi. Saat `Raa.use()` dipanggil, framework memeriksa keberadaan properti ini, mencocokkan array `depends` dengan plugin yang sudah terpasang, lalu mengeksekusi `install` secara berurutan. Semua elemen ini bekerja dalam satu aliran: validasi bentuk, resolusi dependensi, eksekusi integrasi.

```javascript
const MyPlugin = {
  name: 'my-plugin',
  depends: ['raa-eventbus'], // opsional
  
  install(raa, options) {
    // Logika integrasi di sini
  },
  
  uninstall(raa) {
    // Pembersihan resource di sini
  }
};

window.Raa.use(MyPlugin);
```

Pertanyaan paling simpel: "Apakah plugin ini berdiri sendiri atau membutuhkan ekstensi lain?"
Kalau jawabannya "Stand alone" — lewati properti `depends`.
Kalau jawabannya "Butuh yang lain" — isi array dengan nama persis plugin prasyarat.
Dan ada satu pertimbangan lagi yang sering luput: urutan tag `<script>` di HTML tetap menentukan kapan `install` dipanggil. `depends` hanya mencegah eksekusi jika plugin target belum terdaftar. Pastikan urutan pemuatan tetap logis agar resolver tidak membuang siklus kompilasi.

---

## Mendaftarkan Direktif Kustom

Direktif kustom adalah cara plugin berbicara langsung ke template. Ia mengubah atribut HTML menjadi pemicu efek reaktif yang dikendalikan oleh logika milikmu.

Kamu mendorong pasangan `[polaAtribut, fungsiHandler]` ke `raa.__raa_custom_directives__`. Pola mendukung wildcard `*` di akhir. Handler menerima lima argumen: elemen DOM, nama atribut lengkap, nilai string, state reaktif, dan elemen root. Di dalam handler, kamu biasanya memanggil `raa.createEffect()` untuk mengikat logika ke siklus state, lalu mengembalikan fungsi cleanup.

```javascript
install(raa) {
  raa.__raa_custom_directives__.push([
    'raa-myplugin:animate',
    function(el, name, value, state, root) {
      const effect = raa.createEffect(() => {
        const speed = raa.evaluate(value, state, el);
        el.style.transitionDuration = speed + 'ms';
      }, { root, element: el });
      
      el.__raa_effects__.push(effect);
    }
  ]);
}
```

Karena handler berjalan di level sistem yang rendah, ada biaya kognitif di setiap implementasi. Kamu bertanggung jawab melacak dependency, membersihkan listener, dan menghindari mutasi state di luar siklus flush. Tapi investasi itu sepadan jika kamu membutuhkan integrasi yang lebih dalam daripada direktif bawaan, atau jika kamu sedang membangun paket UI yang harus terasa native di dalam ekosistem RaaJS.

Pertanyaan paling simpel: "Apakah logika ini perlu berjalan ulang setiap kali state berubah?"
Kalau jawabannya "Ya, reaktif" — gunakan `raa.createEffect()` dan dorong ke `el.__raa_effects__`.
Kalau jawabannya "Tidak, sekali jalan" — jalankan logika langsung di handler tanpa membungkus efek.
Dan ada satu pertimbangan lagi yang sering luput: selalu periksa `el.__raa_effects__` sebelum mendorong efek baru. Jika array belum terinisialisasi oleh compiler utama, buat array kosong terlebih dahulu. Ini mencegah error `undefined` saat elemen dikompilasi secara terisolasi atau lazy-loaded.

---

## Mengaitkan Hook Siklus Hidup

Hook adalah jendela yang membuka tepat di persimpangan kritis siklus kompilasi. Ia memberi plugin kesempatan untuk menyisipkan logika sebelum mesin mulai bekerja, atau tepat sebelum mesin dibongkar.

Gunakan `raa.pluginManager.addHook(namaHook, fungsi, namaPlugin)` untuk mendaftarkan callback. Framework menyediakan empat titik penyisipan yang dijamin eksekusinya: `beforeCompile`, `afterCompile`, `beforeDestroy`, `afterDestroy`. Setiap fungsi menerima elemen root dan state yang relevan. Hook dijalankan secara sinkron dalam urutan pendaftaran, tanpa mengganggu scheduler microtask.

| Hook | Argumen | Kapan Dipicu |
|------|---------|--------------|
| `beforeCompile` | `(root)` | Sebelum elemen root mulai diproses |
| `afterCompile` | `(root, state)` | Setelah semua efek dan binding terpasang |
| `beforeDestroy` | `(root)` | Sebelum efek dan listener dibersihkan |
| `afterDestroy` | `(root)` | Setelah DOM dan state benar-benar dilepas |

```javascript
install(raa) {
  raa.pluginManager.addHook('afterCompile', (root, state) => {
    console.log(`[Audit] ${root.__raa_app_name__} selesai dikompilasi.`);
    // Bisa menyuntikkan inspector, telemetry, atau inisialisasi global
  }, 'my-audit-plugin');
}
```

Pertanyaan paling simpel: "Apakah tindakan ini perlu terjadi sekali per siklus hidup aplikasi atau setiap kali elemen berubah?"
Kalau jawabannya "Sekali per siklus hidup" — pakai hook `afterCompile` atau `beforeDestroy`.
Kalau jawabannya "Setiap perubahan state" — pakai `raa.createEffect()`.
Dan ada satu pertimbangan lagi yang sering luput: hook `beforeDestroy` adalah satu-satunya tempat yang dijamin berjalan sebelum efek reaktif dihapus. Gunakan untuk abort request, disconnect observer, atau menyimpan log audit. Jangan menunda pembersihan ke `afterDestroy` jika resource yang kamu pegang bisa menyebabkan memory leak saat transisi DOM berlangsung.

---

## Menyuntikkan Variabel Scope

Terkadang plugin perlu menyediakan helper yang bisa dibaca langsung di dalam ekspresi template, tanpa memaksa pengguna mengimpor modul atau menempel ke global window.

Untuk variabel yang aman dan statis, tambahkan ke `raa._globals` atau `window.RaaJS.__safeGlobalsExtras__`. Scope evaluator akan secara otomatis mengenali injeksi ini saat membangun proxy pencarian variabel. Untuk API yang kompleks, tempelkan ke namespace terpisah seperti `window.RaaMyPlugin`. Batasnya jelas dan tidak bisa dinegosiasikan: hanya fungsi murni atau nilai konstan yang boleh disuntikkan ke scope.

```javascript
// Opsi 1: Injeksi ke scope template (bisa dipakai di raa-bind:*)
install(raa) {
  raa._globals.$highlight = (text, color) => `<mark style="color:${color}">${text}</mark>`;
}

// Opsi 2: API statis global (dipanggil dari method)
window.RaaHighlight = {
  sanitize: (str) => str.replace(/</g, '&lt;'),
  version: '1.0.0'
};
```

Pertanyaan paling simpel: "Apakah helper ini hanya digunakan untuk membaca/format, atau perlu memodifikasi state?"
Kalau jawabannya "Hanya membaca/memformat" — suntikkan ke `raa._globals.$namaHelper`.
Kalau jawabannya "Memodifikasi state" — buat method di factory atau gunakan Event Bus.
Dan ada satu pertimbangan lagi yang sering luput: scope evaluator memblokir akses ke `window` dan `document` secara eksplisit. Jangan pernah mencoba membypass blokade ini dengan menempel helper ke `globalThis`. Gunakan `raa._globals` yang sudah dirancang sebagai jembatan aman antara konteks browser dan template.

---

## Contoh Lengkap: Plugin `raa-highlight.js`

Plugin ini memperkenalkan direktif `raa-highlight:text` yang membungkus teks dengan tag `<mark>` berwarna dinamis, sekaligus menambahkan hook audit dan helper scope. Semua dipatch ke instance, tanpa menyentuh prototype.

### Tingkat 1: Sintaks Minimal
```html
<p raa-highlight:text="pesan" color="var(--brand)"></p>
```

### Tingkat 2: Contoh Terisolasi
```javascript
const RaaHighlight = {
  name: 'raa-highlight',
  install(raa) {
    // 1. Injeksi helper ke scope
    raa._globals.$wrapHighlight = (text, color) => 
      `<mark style="background:${color}; padding:2px 4px; border-radius:4px;">${text}</mark>`;

    // 2. Daftarkan direktif kustom
    raa.__raa_custom_directives__.push([
      'raa-highlight:text',
      function(el, name, value, state, root) {
        const effect = raa.createEffect(() => {
          const text = raa.evaluate(value, state, el);
          const color = el.getAttribute('color') || 'yellow';
          raa.bindings.applyHTMLBinding(el, `$wrapHighlight('${text.replace(/'/g, "\\'")}', '${color}')`);
        }, { root, element: el });
        el.__raa_effects__ = el.__raa_effects__ || [];
        el.__raa_effects__.push(effect);
      }
    ]);

    // 3. Hook audit
    raa.pluginManager.addHook('afterCompile', (root) => {
      if (root.__raa_app_name__) console.log(`[Highlight] Root "${root.__raa_app_name__}" siap.`);
    }, 'raa-highlight');
  }
};
```

### Tingkat 3: Contoh Aplikasi Lengkap
```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Demo Plugin — RaaJS</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; max-width: 680px; margin: 40px auto; padding: 0 16px; color: #0f172a; background: #f8fafc; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
    input { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 12px; }
    .btn { padding: 8px 16px; background: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
  </style>
</head>
<body>

  <div raa-core:app="demoPlugin">
    <div class="card">
      <h3 style="margin:0 0 12px; font-size:13px; color:#64748b; text-transform:uppercase;">Demo Plugin raa-highlight</h3>
      <input raa-bind:model="teks" placeholder="Ketik teks untuk di-highlight...">
      <input raa-bind:model="warna" placeholder="Kode warna (misal: #fde68a)">
      
      <!-- Direktif kustom plugin berjalan di sini -->
      <div raa-highlight:text="teks" color="var(--brand)"></div>
      
      <div style="margin-top:12px; display:flex; gap:8px;">
        <button class="btn" raa-on:click="reset()">Reset</button>
        <button class="btn" style="background:#64748b" raa-on:click="logState()">Log State</button>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>
  <script>
    // 1. Definisikan plugin (bentuk kontrak lengkap)
    const RaaHighlight = {
      name: 'raa-highlight',
      install(raa) {
        raa._globals.$wrapHighlight = (text, color) => 
          `<mark style="background:${color}; padding:2px 6px; border-radius:4px;">${text}</mark>`;

        raa.__raa_custom_directives__.push([
          'raa-highlight:text',
          function(el, name, value, state, root) {
            const effect = raa.createEffect(() => {
              const text = raa.evaluate(value, state, el) || '(kosong)';
              const color = el.getAttribute('color') || '#fef08a';
              raa.bindings.applyHTMLBinding(el, `$wrapHighlight('${text.replace(/'/g, "\\'")}', '${color}')`);
            }, { root, element: el });
            el.__raa_effects__ = el.__raa_effects__ || [];
            el.__raa_effects__.push(effect);
          }
        ]);

        raa.pluginManager.addHook('afterCompile', (root) => {
          if (root.__raa_app_name__) console.info(`[RaaHighlight] App "${root.__raa_app_name__}" terpasang.`);
        }, 'raa-highlight');
      }
    };

    // 2. Pasang plugin
    window.Raa.use(RaaHighlight);

    // 3. Definisikan aplikasi
    RaaJS.define('demoPlugin', () => ({
      state: {
        teks: 'Selamat datang di RaaJS',
        warna: '#fde68a'
      },
      methods: {
        reset() { this.teks = ''; this.warna = '#fde68a'; },
        logState() { console.log('[State]', { teks: this.teks, warna: this.warna }); }
      }
    }));
  </script>

</body>
</html>
```

---

*Dokumentasi ini adalah bagian dari RaaJS v3.1.0 Official Docs. Kontribusi, koreksi, dan ide perbaikan disambut hangat di repositori resmi.*

# 🚀 Changelog: RaaJS Framework

Dokumentasi perubahan, perbaikan, dan evolusi arsitektur RaaJS.

## 📦 v3.1.0 (2026-05-24) — "Data Liberation"
Pelepasan ketergantungan pada atribut data mentah untuk performa yang lebih bersih.

### 🗑️ Removed
- Atribut `raa-core:data` dan seluruh kode pendukungnya (`RaaLiteralParser`, `_tokenizeData`, `parseDataValue`, `parseDataObject`).
- **Rekomendasi:** Gunakan `raa-core:init` atau *app factory* sebagai gantinya.

### ⚠️ Developer Experience
- Menambahkan **Debug-mode warning** jika sistem mendeteksi penggunaan `raa-core:data` yang sudah usang.

---

## 💎 v3.0.0 (2026-05-23) — "The Perfect Union"
Versi *milestone* yang menggabungkan stabilitas, kelengkapan ekspresi, dan audit keamanan.

### 🛠️ Post-Audit Fixes
Perbaikan krusial yang diterapkan setelah audit menyeluruh:

| Kategori | Perbaikan | Deskripsi |
| :--- | :--- | :--- |
| 🔴 **HIGH** | **Class Binding** | Array values kini menerapkan nama class dengan benar, bukan indeks numerik. |
| 🔴 **HIGH** | **Call Expression** | Eliminasi evaluasi ganda pada objek metode. Mengurangi beban *reactive tracking*. |
| 🟡 **MEDIUM** | **Plugin Manager** | Plugin berbasis fungsi kini mendapatkan nama unik (`anonymous_N`) untuk mencegah konflik instalasi. |
| 🟡 **MEDIUM** | **Parser Support** | Mendukung *numeric literal keys* pada objek (contoh: `{ 0: 'zero' }`). |
| 🟡 **MEDIUM** | **Diagnostics** | Standardisasi peringatan melalui `RaaDiagnostics.warn()` dengan kode error spesifik. |
| 🟢 **LOW** | **Parser Flexibility** | Mendukung *trailing comma* pada objek literal untuk pengalaman coding yang lebih santai. |

### 🔒 Escape Sequence Audit
- **[FIX ESC-1]** Perbaikan handler *escape sequence* pada tokenizer. Karakter seperti `\n`, `\t`, dan `\r` kini diproses sesuai standar ECMAScript (tidak lagi dianggap literal).
- **[FIX ESC-2]** Optimasi `compileRoot`. Menghilangkan proses *round-trip* JSON stringify yang lambat. State mentah kini diakses langsung melalui referensi internal `__raa_app_raw_state__`.

---

## 🧬 The Great Merge: Robust & Unique
Versi ini adalah gabungan terbaik dari iterasi v2.2.0, v2.3.2, dan v2.3.3.

### 🌟 Fitur Unggulan (dari v2.3.x)
- **Expression Completeness:** Dukungan penuh untuk Object & Array literals di dalam ekspresi template (misal: `raa-bind:class="{ active: true }"`).
- **Optional Chaining:** Mendukung sintaks modern `a?.b`, `a?.[expr]`, dan `a?.fn()`.
- **Reactive Comparison:** Menggunakan `Object.is()` untuk perbandingan yang aman terhadap `NaN`.
- **Plugin Lifecycle:** Sistem plugin yang lebih tangguh dengan *dependency chain*, *lifecycle hooks*, dan API untuk *uninstall*.
- **Resource Management:** Integrasi `AbortController` untuk fetch yang otomatis dibatalkan saat root dihancurkan.

### 🏛️ Warisan Filosofis (dari v2.2.0)
- **Rich Header:** Mengembalikan header "Anatomi & Peran" yang filosofis.
- **Debug Intelligence:** Peringatan cerdas pada `raa-key` untuk mendeteksi kunci duplikat atau non-primitif.
- **Audit Trail:** Penambahan timestamp `updatedAt` pada saat `destroyForBlock` dijalankan.

---

## ⚠️ Batasan Sistem (Known Limitations)
Beberapa fitur sengaja tidak diimplementasikan untuk menjaga performa core tetap ringan:

1. **Nullish Coalescing (??):** Belum didukung, silakan gunakan operator ternary.
2. **Template Literals:** Gunakan penggabungan string konvensional (`+`).
3. **Assignment Path:** `raa-bind:model` hanya mendukung *dot notation* dan *bracket* dengan string/number literal.
4. **Plugin Uninstall:** Tidak mengembalikan mutasi yang dilakukan langsung pada instance RaaJS.

---

## 📜 Riwayat Versi Sebelumnya

### **v2.3.1 - v2.3.3**
- Restorasi fungsi `parseAssignablePath` dan `assignByPath`.
- Perbaikan *root selector colon escaping* `[raa-core\\:app]`.
- Penambahan *no-op guard* pada `raa-ux:lazy`.

### **v2.3.0 (Refactor)**
- Migrasi ke arsitektur berbasis Class.
- Perbaikan *Scope Pollution* pada Proxy traps di `buildScope`.
- Penanganan *Race Condition* antara `appInit` dan `flushEffects`.

### **v2.2.0 (Baseline)**
- Versi monolitik orisinal. Pondasi filosofis dan fungsionalitas utama RaaJS.

---
*Last Updated: 2026-05-31*

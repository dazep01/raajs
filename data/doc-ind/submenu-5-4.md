

# Validasi & UI — Ketika Formulir Belajar Berempati

> **Versi:** RaaJS v3.1.0 "Data Liberation"
>
> Pernahkah kamu mengisi formulir, menekan tombol "Kirim", lalu dihukum dengan sederet pesan merah yang muncul serentak — seolah formulir itu marah padamu karena tidak bisa membaca pikirannya? Validasi dan UI di RaaJS dibangun dengan filosofi yang berlawanan: formulir yang berbicara *selagi* kamu mengetik, bukan *setelah* kamu gagal. Bukan interogasi, tapi percakapan.

---

Dua ekstensi ini — `raa-validate.js` dan `raa-ui.js` — bekerja di lapisan yang berbeda dari core RaaJS, tapi perannya sama-sama krusial. Yang satu menjaga integritas data sebelum ia menyentuh logika bisnismu. Yang lain mengatur bagaimana pengguna *merasakan* antarmuka — tooltip yang muncul di saat yang tepat, teks yang tersalin tanpa gesture, scroll yang mengalir tanpa kejutan.

Keduanya tidak pernah mengubah state. Mereka memantau, menyuntikkan kelas CSS secara reaktif, dan mengatur atribut ARIA secara otomatis. Hasilnya? Formulir yang hidup dan aksesibel tanpa satu baris pun kode JavaScript yang kamu tulis sendiri untuk menangani error atau hover.

Mari kita bongkar satu per satu.

---

## `raa-validate.js` — Garis Pertahanan Terakhir Sebelum Data Meluncur

### Apa yang Sebenarnya Terjadi

Validasi deklaratif adalah pendekatan paling jujur untuk memastikan integritas data. Daripada menulis piramida `if-else` yang rapuh dan tersebar di berbagai method, kamu cukup menempelkan aturan langsung di elemen HTML. RaaJS menerjemahkannya menjadi siklus umpan balik yang berjalan diam-diam di balik layar.

Ketika nilai sebuah input berubah, validator mengevaluasi ekspresi. Jika valid, kelas `.raa-valid` disematkan dan `aria-invalid="false"` ditetapkan. Jika gagal, `.raa-invalid` menggantikan, `aria-invalid="true"` diaktifkan, dan elemen siap dibaca oleh screen reader. Semuanya bersih, tanpa sisa, tanpa logika validasi yang bocor ke template.

Ini bukan sekadar pewarnaan border. Ini adalah kontrak antara UI dan data — ditandatangani di HTML, dieksekusi di runtime.

### Aturan Bawaan dan Sintaks Minimal

```html
<!-- Wajib diisi -->
<input raa-bind:model="nama" raa-validate:required>

<!-- Email wajib & format valid -->
<input raa-bind:model="email" raa-validate:required raa-validate:email>

<!-- Batas numerik -->
<input type="number" raa-bind:model="umur"
       raa-validate:min="17"
       raa-validate:max="65">

<!-- Panjang teks -->
<textarea raa-bind:model="bio"
          raa-validate:minlength="10"
          raa-validate:maxlength="500"></textarea>

<!-- Pola regex kustom -->
<input raa-bind:model="kodePos" raa-validate:pattern="^[0-9]{5}$">
```

Lima direktif untuk 90% kebutuhan validasi formulir web. Sisanya? Kita bahas di bagian API kustom.

### Aturan Pertama yang Tidak Boleh Dilanggar

`raa-validate:*` **hanya bekerja pada elemen yang memicu event `input` atau `change`** — yaitu `<input>`, `<select>`, dan `<textarea>`. Jangan pernah menempelkannya pada elemen statis seperti `<span>` atau `<div>`.

```html
<!-- ✅ Benar — elemen input memicu event yang didengarkan validator -->
<textarea raa-bind:model="pesan" raa-validate:required maxlength="140"></textarea>

<!-- ❌ Salah — span tidak memicu event input, validator tidak akan pernah jalan -->
<span raa-validate:required raa-bind:text="pesan"></span>
```

Validator mendengarkan event. Jika elemen tidak pernah memicu event tersebut, aturan validasi tidak akan pernah dijalankan — bukan bug, itu desain. Elemen yang tidak bisa diketik tidak punya apa-apa untuk divalidasi.

### Kapan Validasi Berjalan — dan Kapan Tidak

Ada satu hal yang sering luput dari perhatian: validasi **tidak berjalan saat halaman pertama kali dimuat**. Ini keputusan yang disengaja. Bayangkan membuka formulir pendaftaran dan langsung disambut lima pesan error sebelum kamu sempat menyentuh apapun — itu bukan validasi, itu intimidasi.

Validasi mulai aktif pada dua momen:
1. Saat pengguna mengetik atau mengubah nilai input (`input`/`change` event)
2. Saat formulir di-submit

Sebelum momen itu, elemen dalam keadaan netral — tanpa `.raa-valid`, tanpa `.raa-invalid`. Bersih.

### Memilih Aturan yang Tepat

Pertanyaan paling simpel yang bisa kamu tanyakan ke diri sendiri: *"Apakah aku memeriksa format data, atau batas nilainya?"*

Kalau jawabannya "format" — pakai `raa-validate:email` atau `raa-validate:pattern`. Mereka memeriksa *bentuk* data, bukan besarannya.

Kalau jawabannya "batas nilai" — pakai `raa-validate:min`, `raa-validate:max`, `raa-validate:minlength`, atau `raa-validate:maxlength`. Mereka memeriksa *kuantitas*, bukan kualitas.

Dan `raa-validate:required` berdiri sendiri — ia hanya peduli apakah ada atau tidak ada. Titik.

### Validasi Grup: Ketika Satu Formulir Butuh Satu Jawaban

Validasi per elemen itu bagus untuk umpan balik individual. Tapi pada akhirnya, formulir butuh satu jawaban kolektif: *boleh dikirim, atau belum?*

`raa-validate:group` pada elemen `<form>` mengumpulkan status semua anak input, menghitungnya, dan mengekspos hasilnya sebagai objek reaktif ke state:

```html
<form raa-validate:group="statusForm" raa-on:submit.prevent="kirimData()">

  <input raa-bind:model="nama"
         raa-validate:required
         raa-validate:minlength="3">

  <input type="email" raa-bind:model="email"
         raa-validate:required
         raa-validate:email>

  <!-- Tombol otomatis nonaktif saat formulir belum valid -->
  <button type="submit" raa-ux:disable="!statusForm.valid">
    Kirim Pendaftaran
  </button>

</form>
```

Objek `statusForm` memiliki beberapa properti yang bisa kamu akses:

| Properti | Tipe | Deskripsi |
|---|---|---|
| `statusForm.valid` | `boolean` | `true` jika **semua** field valid |
| `statusForm.invalid` | `boolean` | Kebalikan dari `valid` |
| `statusForm.fields` | `object` | Status individual setiap field |

Dengan ini, kamu bisa membuat tombol yang tahu kapan harus tidur dan kapan harus bangun — tanpa menulis satu pun listener manual.

### Aturan Kustom: Ketika Bawaan Tidak Cukup

Ada saatnya kamu butuh aturan yang tidak ada di paket bawaan — misalnya memastikan username tidak mengandung spasi, atau password harus punya minimal satu angka. Di situlah `RaaValidate.defineRule()` masuk:

```javascript
// Daftarkan aturan kustom — sekali saja, di awal aplikasi
RaaValidate.defineRule('noSpasi', (value) => !value.includes(' '));
RaaValidate.defineRule('adaAngka', (value) => /\d/.test(value));
```

```html
<!-- Gunakan seperti aturan bawaan lainnya -->
<input raa-bind:model="username"
       raa-validate:required
       raa-validate:noSpasi>

<input type="password" raa-bind:model="password"
       raa-validate:required
       raa-validate:minlength="8"
       raa-validate:adaAngka>
```

Dan jika kamu perlu memicu validasi secara manual dari dalam method — mungkin setelah menerima data dari server, atau setelah mengubah nilai secara programatik:

```javascript
methods: {
  setelahFetchData() {
    // Isi field secara programatik
    this.username = dataServer.username;

    // Paksa validasi ulang karena event input tidak terpicu
    RaaValidate.validateField(this.$refs.inputUsername);
  }
}
```

### Trade-off yang Harus Kamu Terima

Validasi deklaratif mengorbankan fleksibilitas demi kecepatan penulisan. Pengorbanan paling nyata: ia tidak bisa menangani **validasi asinkron** langsung di atribut. Cek ketersediaan username ke server? Validasi yang butuh menunggu respons API? Itu di luar jangkauan `raa-validate:*`.

Tapi batasan itu sepadan jika kamu menghitung berapa banyak boilerplate yang hilang untuk kasus-kasus standar — required, email, min, max, pattern. Untuk formulir kontak, pendaftaran, pengaturan profil, dan 90% formulir web lainnya, ini sudah lebih dari cukup.

Untuk validasi asinkron, gunakan `raa-net:fetch` di dalam method dan ubah state error secara manual. Dua dunia yang berbeda, jembatan yang sederhana.

---

## `raa-ui.js` — Perilaku yang Biasanya Membutuhkan 30 Baris Boilerplate

### Apa yang Dilakukannya

`raa-ui.js` adalah kumpulan perilaku interaksi yang sehari-hari kamu tulis secara manual — Clipboard API untuk menyalin teks, Intersection Observer untuk scroll, event listener untuk mendeteksi klik di luar elemen. Semua pola yang sudah kamu hafal boilerplate-nya.

Kalau `raa-validate` adalah dokter yang memeriksa kesehatan data sebelum ia bepergian, `raa-ui` adalah arsitek interior yang memastikan ruangan terasa nyaman saat kamu berada di dalamnya. Ia tidak pernah menyentuh data. Ia hanya mengatur bagaimana pengguna *mengalami* antarmuka.

### Lima Direktif dan Perannya

| Direktif | Apa yang Terjadi | Contoh |
|---|---|---|
| `raa-ui:tooltip` | Menampilkan tooltip native saat hover | `raa-ui:tooltip="'Klik untuk simpan'"` |
| `raa-ui:clipboard` | Menyalin nilai ke clipboard saat klik | `raa-ui:clipboard="kodeUndangan"` |
| `raa-ui:scroll-to` | Scroll halus ke elemen target saat klik | `raa-ui:scroll-to="'#bagian-bawah'"` |
| `raa-ui:mask` | Memformat input secara visual saat mengetik | `raa-ui:mask="'99/99/9999'"` |
| `raa-ui:outside` | Menjalankan aksi saat klik terjadi di luar elemen | `raa-ui:outside="tutupMenu()"` |

```html
<!-- Tooltip muncul saat hover, hilang saat pergi -->
<button raa-ui:tooltip="'Salin kode referral ke clipboard'">
  Info
</button>

<!-- Satu klik, langsung tersalin -->
<button raa-ui:clipboard="kodeReferral">
  Salin Kode: <span raa-bind:text="kodeReferral"></span>
</button>

<!-- Scroll halus ke elemen, tanpa lompatan brutal -->
<a raa-ui:scroll-to="'#footer'" href="#footer">Ke Bawah</a>

<!-- Input tanggal dengan format visual otomatis -->
<input raa-bind:model="tanggalLahir" raa-ui:mask="'99/99/9999'"
       placeholder="DD/MM/YYYY">

<!-- Dropdown yang tahu kapan harus menutup diri -->
<div raa-ui:outside="menuTerbuka = false">
  <button raa-on:click="menuTerbuka = !menuTerbuka">Menu</button>
  <nav raa-flow:show="menuTerbuka">
    <ul>
      <li><a href="#">Beranda</a></li>
      <li><a href="#">Profil</a></li>
      <li><a href="#">Pengaturan</a></li>
    </ul>
  </nav>
</div>
```

### Dua Kesalahpahaman yang Perlu Diluruskan

**Pertama: `raa-ui:mask` hanya mengubah tampilan, bukan data.**

Ini perbedaan yang kelihatan kecil tapi dampaknya besar. Ketika kamu mengetik `12052024` di input dengan mask `99/99/9999`, yang terlihat di layar adalah `12/05/2024`. Tapi nilai di state tetap `12052024` — tanpa garis miring, tanpa format.

```javascript
// ❌ Asumsi yang salah
// "Saya pakai mask, pasti state sudah terformat"
state: { tanggalLahir: '12/05/2024' }   // Bukan ini yang terjadi

// ✅ Kenyataannya
state: { tanggalLahir: '12052024' }      // Ini yang tersimpan di state
```

Mask adalah lapisan presentasi. Jika kamu butuh data yang sudah diformat sebelum dikirim ke server, lakukan konversi di method — bukan berharap mask melakukannya untukmu.

**Kedua: `raa-ui:tooltip` bukan pengganti label.**

```html
<!-- ❌ Salah — informasi kritis hanya di tooltip, tidak aksesibel -->
<button raa-ui:tooltip="'Tindakan ini akan menghapus semua data secara permanen'">
  Hapus
</button>

<!-- ✅ Benar — informasi kritis tersedia langsung, tooltip hanya tambahan -->
<button aria-label="Hapus semua data secara permanen"
        raa-ui:tooltip="'Tidak bisa dibatalkan'">
  Hapus Semua Data
</button>
```

Tooltip menghilang saat jari berpindah. Di perangkat mobile, tooltip bahkan tidak muncul sama sekali. Jangan pernah meletakkan informasi yang *harus* diketahui pengguna hanya di dalam tooltip — itu seperti menulis peringatan kebakaran di balik lukisan.

### Kapan Pakai `raa-ui` dan Kapan Tulis Manual

Pertanyaan diagnostiknya sederhana: *"Apakah perilaku yang kubutuhkan ini tentang interaksi pengguna, atau tentang data?"*

Kalau tentang interaksi — tooltip, clipboard, scroll, deteksi klik luar — pakai `raa-ui`. Ia sudah menangani edge case yang biasanya kamu lupa: fallback clipboard untuk browser lama, smooth scroll yang menghormati `prefers-reduced-motion`, cleanup listener saat elemen dihapus dari DOM.

Kalau tentang data atau format data — pakai `raa-validate`, `raa-bind`, atau method biasa.

Dan ada satu pertimbangan lagi yang sering luput: jika kamu butuh animasi transisi yang sangat spesifik — timing curve tertentu, orchestrasi antar-elemen, animasi berbasis scroll position — `raa-ui` bukan tempatnya. Itu adalah domain `raa-animation.js` atau CSS yang kamu tulis sendiri. `raa-ui` sengaja tidak masuk ke wilayah itu agar ia tetap ringan dan predictable.

---

## Menggabungkan Keduanya: Formulir yang Utuh

Berikut adalah contoh formulir pendaftaran yang menggunakan `raa-validate` dan `raa-ui` secara bersamaan — bisa langsung dijalankan di browser:

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Formulir Pendaftaran — RaaJS</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #f8fafc;
      display: flex;
      justify-content: center;
      padding: 40px 16px;
      margin: 0;
    }
    .app {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      padding: 32px;
      width: 100%;
      max-width: 480px;
    }
    h1 { margin: 0 0 4px; font-size: 22px; color: #1e293b; }
    .subtitle { color: #64748b; font-size: 14px; margin: 0 0 28px; }

    .form-group { margin-bottom: 20px; }
    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 6px;
      color: #475569;
    }
    input, textarea {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.2s, background 0.2s;
    }
    input:focus, textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }

    /* State validasi — dikelola otomatis oleh raa-validate */
    .raa-invalid { border-color: #ef4444 !important; background: #fef2f2; }
    .raa-valid { border-color: #10b981 !important; background: #f0fdf4; }

    .hint {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 4px;
      min-height: 16px;
    }
    .hint.error { color: #dc2626; }

    .btn {
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 16px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      width: 100%;
      transition: background 0.15s;
    }
    .btn:hover { background: #2563eb; }
    .btn:disabled { background: #94a3b8; cursor: not-allowed; }
    .btn.secondary {
      background: transparent;
      color: #64748b;
      border: 1px solid #e2e8f0;
      margin-top: 12px;
    }
    .btn.secondary:hover { background: #f8fafc; }

    .success-banner {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
    }
    .success-banner h2 { color: #15803d; margin: 0 0 8px; font-size: 18px; }
    .success-banner p { color: #166534; font-size: 14px; margin: 0 0 16px; }

    .referral-box {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
      margin-top: 20px;
      padding: 12px;
      background: #f1f5f9;
      border-radius: 8px;
    }
    .referral-box code {
      font-size: 15px;
      font-weight: 700;
      color: #1e293b;
      letter-spacing: 1px;
    }
    .referral-box button {
      background: #1e293b;
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
    }
  </style>
</head>
<body>

  <div raa-core:app="pendaftaranApp" class="app">

    <!-- State: Belum berhasil — tampilkan formulir -->
    <template raa-flow:if="!berhasil">
      <h1>Buat Akun Baru</h1>
      <p class="subtitle">Isi formulir di bawah untuk memulai perjalananmu.</p>

      <form raa-validate:group="formStatus" raa-on:submit.prevent="daftar()">

        <!-- Nama Lengkap -->
        <div class="form-group">
          <label>Nama Lengkap</label>
          <input
            raa-bind:model="nama"
            raa-validate:required
            raa-validate:minlength="3"
            raa-validate:maxlength="50"
            raa-ui:tooltip="'Gunakan nama asli, minimal 3 karakter'"
            placeholder="Masukkan nama lengkapmu">
          <div class="hint">Minimal 3 karakter, maksimal 50</div>
        </div>

        <!-- Email -->
        <div class="form-group">
          <label>Alamat Email</label>
          <input
            type="email"
            raa-bind:model="email"
            raa-validate:required
            raa-validate:email
            placeholder="nama@contoh.com">
        </div>

        <!-- Username -->
        <div class="form-group">
          <label>Username</label>
          <input
            raa-bind:model="username"
            raa-validate:required
            raa-validate:minlength="4"
            raa-validate:noSpasi
            placeholder="tanpa_spasi_ya">
          <div class="hint">Minimal 4 karakter, tanpa spasi</div>
        </div>

        <!-- Kode Pos dengan mask -->
        <div class="form-group">
          <label>Kode Pos</label>
          <input
            raa-bind:model="kodePos"
            raa-validate:required
            raa-validate:pattern="^[0-9]{5}$"
            raa-ui:mask="'99999'"
            placeholder="Contoh: 10110">
        </div>

        <!-- Bio opsional -->
        <div class="form-group">
          <label>Bio Singkat <span style="color:#94a3b8; font-weight:400;">(opsional)</span></label>
          <textarea
            raa-bind:model="bio"
            raa-validate:maxlength="200"
            rows="3"
            placeholder="Ceritakan sedikit tentang dirimu..."></textarea>
          <div class="hint">
            <span raa-bind:text="bio.length"></span>/200 karakter
          </div>
        </div>

        <!-- Tombol submit -->
        <button type="submit" class="btn" raa-ux:disable="!formStatus.valid">
          Daftar Sekarang
        </button>

      </form>
    </template>

    <!-- State: Berhasil — tampilkan konfirmasi -->
    <template raa-flow:if="berhasil">
      <div class="success-banner">
        <h2>Pendaftaran Berhasil!</h2>
        <p>Selamat datang, <span raa-bind:text="nama"></span>. Akunmu sudah aktif.</p>

        <!-- Kode referral dengan tombol salin -->
        <div class="referral-box">
          <span style="font-size:13px; color:#64748b;">Kode referralmu:</span>
          <code raa-bind:text="kodeReferral"></code>
          <button
            raa-ui:clipboard="kodeReferral"
            raa-ui:tooltip="'Salin ke clipboard'">
            Salin
          </button>
        </div>
      </div>

      <button class="btn secondary" raa-on:click="resetForm()">
        Daftar Akun Lain
      </button>
    </template>

  </div>

  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/extensions/raa-validate.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/extensions/raa-ui.js"></script>
  <script>
    // Daftarkan aturan kustom sebelum aplikasi
    RaaValidate.defineRule('noSpasi', (value) => !value.includes(' '));

    RaaJS.define('pendaftaranApp', () => ({
      state: {
        nama: '',
        email: '',
        username: '',
        kodePos: '',
        bio: '',
        berhasil: false,
        kodeReferral: ''
      },
      methods: {
        daftar() {
          // Di titik ini, semua field sudah tervalidasi
          // karena tombol hanya aktif saat formStatus.valid === true

          this.kodeReferral = 'RAAJS-' + Math.random()
            .toString(36).substring(2, 8).toUpperCase();

          console.log('Data pendaftaran:', {
            nama: this.nama,
            email: this.email,
            username: this.username,
            kodePos: this.kodePos,
            bio: this.bio
          });

          this.berhasil = true;
        },

        resetForm() {
          this.nama = '';
          this.email = '';
          this.username = '';
          this.kodePos = '';
          this.bio = '';
          this.berhasil = false;
          this.kodeReferral = '';
        }
      }
    }));
  </script>

</body>
</html>
```

> **Catatan penting soal `raa-ux:disable` vs `disabled`:**
> Perhatikan bahwa tombol submit menggunakan `raa-ux:disable`, bukan atribut HTML `disabled` biasa. `raa-ux:disable` adalah direktif reaktif — ia mengevaluasi ekspresi setiap kali state berubah dan menambah/menghapus atribut `disabled` secara otomatis. Menulis `disabled` langsung di HTML akan membuat tombol nonaktif selamanya, tanpa reaktivitas.

---

## Rangkuman: Dua Ekstensi, Satu Tujuan

`raa-validate.js` dan `raa-ui.js` tidak pernah bersaing untuk perhatianmu. Mereka bekerja di lapisan yang berbeda, mengurus hal yang berbeda, tapi menuju tujuan yang sama: antarmuka yang bisa dipercaya penggunanya.

`raa-validate` adalah tentang **data** — memastikan apa yang diketik pengguna sudah memenuhi kontrak sebelum kode bisnismu memprosesnya. Ia deklaratif, reaktif, dan mengatur aksesibilitas secara otomatis. Untuk 90% formulir, ia sudah cukup. Untuk 10% sisanya yang butuh validasi asinkron, kamu tetap punya method dan `raa-net:fetch` sebagai jembatan.

`raa-ui` adalah tentang **pengalaman** — tooltip yang informatif, clipboard yang seamless, scroll yang mulus, deteksi klik luar yang andal. Semua hal kecil yang biasanya membutuhkan 30 baris boilerplate per fitur, diringkas menjadi satu atribut.

Tiga pertanyaan setiap kali kamu ragu: *Butuh memvalidasi input? Pakai `validate`. Butuh perilaku interaksi standar? Pakai `ui`. Butuh sesuatu yang lebih spesifik dari keduanya? Tulis method sendiri — framework tidak harus mengurus segalanya.*

---

*Dokumentasi ini adalah bagian dari RaaJS v3.1.0 Official Docs. Kontribusi, koreksi, dan ide perbaikan disambut hangat di repositori resmi.*
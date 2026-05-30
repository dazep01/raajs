# Event Handling — Sistem Saraf Interaksi Deklaratif

> **Versi:** RaaJS v3.1.0 "Data Liberation"
> Sebuah aplikasi tanpa interaktivitas adalah monumen yang megah tapi membeku — indah dipandang, tapi pasif sepenuhnya. Kehidupan sejati sebuah UI dimulai ketika ia mampu merespons ketukan, gesekan, dan bisikan dari penggunanya. Di RaaJS, event handling bukan sekadar menempelkan fungsi ke tombol. Ia adalah perancangan sistem saraf yang menerjemahkan stimulus fisik menjadi mutasi data secara instan, aman, dan bersih.

---

## Kenapa Event Handling di RaaJS Terasa Berbeda?

Kalau kamu pernah menangani event di JavaScript vanilla, kamu tahu ritualnya: `querySelector`, `addEventListener`, `bind(this)` yang sering tersesat, dan yang paling sering terlupakan — `removeEventListener` saat elemen dihancurkan. Lupa satu langkah saja, dan kamu punya memory leak yang pelan-pelan menggerogoti performa browser pengguna.

Di RaaJS, semua itu tidak perlu kamu urus. Kamu cukup mendeklarasikan niat interaksinya langsung di HTML. RaaJS yang akan memasang, mengelola, dan membersihkan event listener secara otomatis — termasuk saat elemen dihancurkan oleh `raa-flow:if` atau `destroyRoot`. Tidak ada kabel liar yang menggantung. Tidak ada konsumsi memori hantu di latar belakang.

Pendekatan ini kami sebut **Declarative Sensory** — kamu menyatakan *apa* yang ingin terjadi, RaaJS yang mengurus *bagaimana*-nya.

---

## Sintaks Dasar: `raa-on:[event]`

Format dasar dari semua event handling di RaaJS adalah:

```
raa-on:[nama-event]="ekspresi"
```

Di mana `[nama-event]` bisa berupa event DOM apa pun yang valid: `click`, `input`, `change`, `submit`, `keydown`, `keyup`, `focus`, `blur`, `mouseover`, `scroll`, dan seterusnya.

```html
<div raa-core:app="basicEvent">

  <!-- Event klik paling sederhana -->
  <button raa-on:click="tambah()">Tambah</button>

  <!-- Event input — berjalan setiap kali pengguna mengetik -->
  <input type="text" raa-on:input="updateNama()">

  <!-- Event change — untuk select, checkbox, radio -->
  <select raa-on:change="gantiBahasa()">
    <option value="id">Indonesia</option>
    <option value="en">English</option>
  </select>

  <!-- Event submit pada form -->
  <form raa-on:submit.prevent="kirim()">
    <button type="submit">Kirim</button>
  </form>

  <!-- Event keyboard -->
  <input type="text" raa-on:keydown="handleKey($event)">

</div>
```

---

## Variabel `$event`: Akses ke Event Asli Browser

Di dalam semua ekspresi `raa-on:*`, variabel khusus `$event` tersedia secara otomatis. Ia adalah referensi langsung ke objek event asli dari browser — `MouseEvent`, `KeyboardEvent`, `InputEvent`, dan lainnya.

```html
<div raa-core:app="eventDemo">

  <!-- Baca nilai input dari event.target.value -->
  <input type="text"
         raa-on:input="updateNama($event)"
         placeholder="Ketik namamu...">

  <!-- Baca tombol keyboard yang ditekan -->
  <input type="text"
         raa-on:keydown="handleKey($event)"
         placeholder="Tekan tombol apa saja...">

  <!-- Baca posisi klik mouse -->
  <div raa-on:click="catat($event)"
       style="padding: 40px; background: #f1f5f9; border-radius: 8px; text-align: center; cursor: crosshair;">
    Klik di mana saja di area ini
  </div>

  <p raa-bind:text="info"></p>

</div>

<script>
  RaaJS.define('eventDemo', () => ({
    state: { info: '' },
    methods: {
      updateNama(event) {
        // event.target.value berisi nilai teks yang diketik
        this.info = 'Kamu mengetik: ' + event.target.value;
      },
      handleKey(event) {
        // event.key berisi nama tombol yang ditekan
        this.info = 'Tombol ditekan: ' + event.key + ' (kode: ' + event.code + ')';
      },
      catat(event) {
        // event.clientX dan clientY berisi posisi klik
        this.info = 'Klik di posisi X:' + event.clientX + ' Y:' + event.clientY;
      }
    }
  }));
</script>
```

---

## Memanggil Method dengan Argumen

Kamu bisa memanggil method dengan argumen literal atau ekspresi dari state:

```html
<div raa-core:app="argDemo">

  <!-- Argumen literal -->
  <button raa-on:click="tambah(5)">+5</button>
  <button raa-on:click="tambah(10)">+10</button>
  <button raa-on:click="tambah(-1)">-1</button>

  <!-- Argumen dari state -->
  <button raa-on:click="hapus(item.id)">Hapus</button>
  <button raa-on:click="ubahStatus(item.id, 'selesai')">Selesai</button>

  <!-- Argumen gabungan: nilai dari state + $event -->
  <input type="text"
         raa-on:input="update(item.id, $event)">

  <p raa-bind:text="'Total: ' + total"></p>

</div>

<script>
  RaaJS.define('argDemo', () => ({
    state: { total: 0 },
    methods: {
      tambah(nilai) {
        this.total += nilai;
      },
      hapus(id) {
        this.daftar = this.daftar.filter(i => i.id !== id);
      },
      ubahStatus(id, status) {
        const item = this.daftar.find(i => i.id === id);
        if (item) item.status = status;
      },
      update(id, event) {
        const item = this.daftar.find(i => i.id === id);
        if (item) item.nilai = event.target.value;
      }
    }
  }));
</script>
```

---

## Event Modifiers: Kontrol Tanpa Boilerplate

Ini salah satu fitur RaaJS yang paling elegan. Alih-alih menulis `event.preventDefault()` atau `event.stopPropagation()` di dalam setiap method, kamu cukup menambahkan **modifier** setelah nama event dengan tanda titik.

### `.prevent` — Hentikan Perilaku Default Browser

```html
<!-- Tanpa .prevent: form akan reload halaman saat submit -->
<!-- Dengan .prevent: reload dicegah, method langsung dipanggil -->
<form raa-on:submit.prevent="kirimData()">
  <button type="submit">Kirim</button>
</form>

<!-- Hentikan link dari berpindah halaman -->
<a href="https://example.com" raa-on:click.prevent="bukaModal()">
  Buka Modal
</a>
```

### `.stop` — Hentikan Event Bubble ke Elemen Induk

```html
<!-- Tanpa .stop: klik tombol JUGA memicu handler di div luar -->
<div raa-on:click="klikLuar()">
  Area Luar
  <button raa-on:click.stop="klikDalam()">
    Klik tombol ini tidak menyebar ke div luar
  </button>
</div>
```

### `.self` — Hanya Trigger Jika Target Adalah Elemen Itu Sendiri

```html
<!-- Handler hanya jalan jika overlay-nya sendiri yang diklik,
     bukan konten modal di dalamnya -->
<div class="overlay" raa-on:click.self="tutupModal()">
  <div class="modal-konten">
    <p>Klik di sini tidak menutup modal.</p>
  </div>
</div>
```

### Kombinasi Modifier

Modifier bisa dikombinasikan — urutan penulisannya tidak berpengaruh:

```html
<!-- Cegah default DAN hentikan bubbling sekaligus -->
<button raa-on:click.prevent.stop="aksi()">Klik Aman</button>

<!-- Form yang tidak reload dan tidak menyebar -->
<form raa-on:submit.prevent.stop="proses()">
  <button type="submit">Submit</button>
</form>
```

### Tabel Lengkap Modifier

| Modifier | Yang Dilakukan di Balik Layar | Kapan Pakai |
|---|---|---|
| `.prevent` | `event.preventDefault()` | Form submit, link anchor, drag & drop |
| `.stop` | `event.stopPropagation()` | Mencegah event bubbling ke elemen induk |
| `.self` | Cek `event.target === el` | Overlay/backdrop yang menutup modal |

---

## Satu Hal yang Perlu Kamu Tahu: Assignment di Template

Ada satu pertanyaan yang sering muncul: *"Bisa nggak tulis langsung `total = total + 1` di template tanpa bikin method?"*

Jawabannya: **tidak**, dan ini by design.

Evaluator ekspresi RaaJS memang tidak mendukung operator assignment (`=`, `+=`, `++`, dll.) di dalam template HTML. Bukan karena RaaJS ingin mempersulit hidupmu, tapi karena ada alasan arsitektur yang kuat di baliknya.

HTML di RaaJS adalah layer presentasi — tempat data dipantulkan ke layar. Logika bisnis, termasuk bagaimana state berubah, seharusnya tinggal di layer JavaScript, bukan tersebar di atribut HTML. Kalau kamu boleh menulis `total += 5` langsung di template, aplikasi yang besar akan jadi mimpi buruk untuk di-debug — logika bisnis berceceran di mana-mana.

Jadi, selalu bungkus mutasi state dalam method:

```html
<!-- ❌ Tidak akan bekerja -->
<button raa-on:click="count = count + 1">Tambah</button>
<button raa-on:click="count++">Tambah</button>

<!-- ✅ Cara yang benar -->
<button raa-on:click="tambah()">Tambah</button>
```

```javascript
methods: {
  tambah() {
    this.count++;
  }
}
```

Disiplin sederhana ini akan menyelamatkanmu dari banyak sakit kepala saat aplikasi mulai tumbuh besar.

---

## Contoh Lengkap: Kalkulator Interaktif

Berikut adalah contoh yang menggabungkan semua konsep event handling yang sudah kita pelajari:

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Kalkulator — RaaJS</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: sans-serif; background: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .kalkulator { background: white; border-radius: 20px; padding: 32px; width: 320px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); }
    .display { background: #0f172a; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: right; }
    .ekspresi { color: #64748b; font-size: 13px; min-height: 18px; font-family: monospace; }
    .angka { color: white; font-size: 36px; font-weight: 700; font-family: monospace; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .btn { border: none; border-radius: 10px; padding: 16px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
    .btn:hover { transform: translateY(-1px); filter: brightness(1.1); }
    .btn:active { transform: translateY(0); }
    .btn.angka-btn { background: #f1f5f9; color: #1e293b; }
    .btn.operator-btn { background: #3b82f6; color: white; }
    .btn.equals-btn { background: #10b981; color: white; }
    .btn.clear-btn { background: #ef4444; color: white; }
    .btn.span2 { grid-column: span 2; }
    .riwayat { margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 12px; max-height: 120px; overflow-y: auto; }
    .riwayat p { font-size: 12px; color: #94a3b8; text-align: right; margin: 4px 0; font-family: monospace; }
  </style>
</head>
<body>

  <div raa-core:app="kalkulatorApp">
    <div class="kalkulator">

      <!-- Display -->
      <div class="display">
        <div class="ekspresi" raa-bind:text="ekspresi || '&nbsp;'"></div>
        <div class="angka" raa-bind:text="tampilan"></div>
      </div>

      <!-- Tombol-tombol -->
      <div class="grid">

        <!-- Baris 1 -->
        <!-- .stop mencegah event menyebar ke form yang mungkin ada di luar -->
        <button class="btn clear-btn span2" raa-on:click.stop="reset()">AC</button>
        <button class="btn operator-btn" raa-on:click.stop="inputOperator('%')">%</button>
        <button class="btn operator-btn" raa-on:click.stop="inputOperator('÷')">÷</button>

        <!-- Baris 2 -->
        <button class="btn angka-btn" raa-on:click="inputAngka('7')">7</button>
        <button class="btn angka-btn" raa-on:click="inputAngka('8')">8</button>
        <button class="btn angka-btn" raa-on:click="inputAngka('9')">9</button>
        <button class="btn operator-btn" raa-on:click="inputOperator('×')">×</button>

        <!-- Baris 3 -->
        <button class="btn angka-btn" raa-on:click="inputAngka('4')">4</button>
        <button class="btn angka-btn" raa-on:click="inputAngka('5')">5</button>
        <button class="btn angka-btn" raa-on:click="inputAngka('6')">6</button>
        <button class="btn operator-btn" raa-on:click="inputOperator('-')">−</button>

        <!-- Baris 4 -->
        <button class="btn angka-btn" raa-on:click="inputAngka('1')">1</button>
        <button class="btn angka-btn" raa-on:click="inputAngka('2')">2</button>
        <button class="btn angka-btn" raa-on:click="inputAngka('3')">3</button>
        <button class="btn operator-btn" raa-on:click="inputOperator('+')">+</button>

        <!-- Baris 5 -->
        <button class="btn angka-btn span2" raa-on:click="inputAngka('0')">0</button>
        <button class="btn angka-btn" raa-on:click="inputAngka('.')">.</button>
        <button class="btn equals-btn" raa-on:click="hitung()">=</button>

      </div>

      <!-- Riwayat kalkulasi -->
      <template raa-flow:if="riwayat.length > 0">
        <div class="riwayat">
          <template raa-flow:for="item in riwayat" raa-key="item.id">
            <p raa-bind:text="item.teks"></p>
          </template>
        </div>
      </template>

    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>
  <script>
    RaaJS.define('kalkulatorApp', () => ({
      state: {
        tampilan: '0',
        ekspresi: '',
        angkaPertama: null,
        operatorAktif: null,
        menungguAngkaKedua: false,
        riwayat: []
      },
      methods: {
        inputAngka(char) {
          if (this.menungguAngkaKedua) {
            this.tampilan = char;
            this.menungguAngkaKedua = false;
          } else {
            // Cegah dua titik desimal
            if (char === '.' && this.tampilan.includes('.')) return;
            this.tampilan = this.tampilan === '0' && char !== '.' ? char : this.tampilan + char;
          }
        },

        inputOperator(op) {
          const nilai = parseFloat(this.tampilan);
          if (this.angkaPertama !== null && !this.menungguAngkaKedua) {
            this.hitung();
          }
          this.angkaPertama = parseFloat(this.tampilan);
          this.operatorAktif = op;
          this.menungguAngkaKedua = true;
          this.ekspresi = this.tampilan + ' ' + op;
        },

        hitung() {
          if (this.angkaPertama === null || this.operatorAktif === null) return;
          const a = this.angkaPertama;
          const b = parseFloat(this.tampilan);
          let hasil;
          switch (this.operatorAktif) {
            case '+': hasil = a + b; break;
            case '-': hasil = a - b; break;
            case '×': hasil = a * b; break;
            case '÷': hasil = b !== 0 ? a / b : 'Error'; break;
            case '%': hasil = a % b; break;
            default: return;
          }
          const ekspresiLengkap = a + ' ' + this.operatorAktif + ' ' + b + ' = ' + hasil;
          this.riwayat.unshift({ id: Date.now(), teks: ekspresiLengkap });
          if (this.riwayat.length > 5) this.riwayat.pop();

          this.tampilan = String(hasil);
          this.ekspresi = '';
          this.angkaPertama = null;
          this.operatorAktif = null;
          this.menungguAngkaKedua = false;
        },

        reset() {
          this.tampilan = '0';
          this.ekspresi = '';
          this.angkaPertama = null;
          this.operatorAktif = null;
          this.menungguAngkaKedua = false;
        }
      }
    }));
  </script>

</body>
</html>
```

---

## Sekilas tentang Event Bus: Komunikasi Antar Island

Ada satu skenario yang tidak bisa diselesaikan oleh `raa-on:*` biasa: ketika dua komponen yang **terisolasi** di `raa-eco:island` berbeda perlu saling berkomunikasi.

Bayangkan sebuah halaman e-commerce. Ada Island "Kartu Produk" di tengah halaman, dan Island "Keranjang Belanja" di pojok kanan atas. Ketika pengguna klik "Beli" di Kartu Produk, bagaimana Keranjang Belanja tahu harus diperbarui?

Ini adalah tugas **Event Bus** dari ekstensi `raa-eventbus.js`. Ia memungkinkan Island yang berbeda untuk berkomunikasi melalui sistem publish-subscribe tanpa harus saling "kenal":

```html
<!-- Di dalam Island Produk: kirim sinyal -->
<button raa-on:click="$bus.emit('cart:add', { id: produk.id, nama: produk.nama })">
  Tambah ke Keranjang
</button>

<!-- Di dalam Island Keranjang: dengarkan sinyal -->
<!-- $event di sini langsung berisi payload yang dikirim via emit -->
<div raa-on:event:cart:add="tambahItem($event)">
  <!-- isi keranjang -->
</div>
```

```javascript
// Di factory Island Keranjang
methods: {
  tambahItem(payload) {
    // payload = { id: ..., nama: ... } — langsung dari emit
    this.items.push(payload);
  }
}
```

Perhatikan: `$event` di dalam `raa-on:event:*` langsung berisi **payload** yang dikirim via `$bus.emit()` — bukan wrapper event DOM. Ini berbeda dengan `raa-on:click` di mana `$event` adalah MouseEvent asli dari browser.

Kita akan bedah Event Bus secara mendalam di ***Komunikasi Komponen***.

---

## Yang Perlu Diingat

Semua event listener yang dipasang via `raa-on:*` dikelola sepenuhnya oleh RaaJS. Kamu tidak perlu — dan sebaiknya tidak — memanggil `removeEventListener` secara manual. Saat elemen dihapus dari DOM (oleh `raa-flow:if` yang menjadi false atau `destroyRoot`), semua listener dibersihkan otomatis. Ini bukan kebetulan, tapi keputusan arsitektur yang disengaja untuk mencegah memory leak.

Tiga hal yang perlu selalu kamu ingat:

Pertama, mutasi state selalu di dalam `methods`, bukan langsung di ekspresi template. HTML adalah cermin data, bukan tempat logika bisnis.

Kedua, `$event` selalu tersedia di semua ekspresi `raa-on:*` dan berisi objek event asli dari browser — kecuali di `raa-on:event:*` (Event Bus) di mana ia berisi payload yang di-emit.

Ketiga, modifier bisa dikombinasikan bebas: `.prevent.stop`, `.stop.self`, dan seterusnya — urutan tidak berpengaruh.

---

*Dokumentasi ini adalah bagian dari RaaJS v3.1.0 Official Docs. Kontribusi dan koreksi disambut di repositori resmi.*

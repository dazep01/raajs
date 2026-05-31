# Komunikasi Komponen — Event Bus

> **Versi:** RaaJS v3.1.0 "Data Liberation"
> 
> **Ekstensi:** `raa-eventbus.js`
> 
> Sebuah jembatan tak terlihat di dalam ruang, mengalirkan pesan antar komponen yang terisolasi dengan tenang.

---

**Isolasi state** adalah kekuatan RaaJS — setiap island hidup mandiri, tidak bisa mengintip milik tetangganya. Tapi aplikasi nyata membutuhkan komponen yang bisa saling berbicara. **Event Bus** adalah infrastruktur komunikasi itu: jembatan tanpa kabel fisik yang memungkinkan komponen-komponen terisolasi bertukar pesan dengan elegan.

---

## Masalah yang Dipecahkan

Bayangkan halaman e-commerce dengan tiga island terpisah: **Kartu Produk** di tengah, **Keranjang Belanja** di header, dan **Notifikasi Toast** di pojok layar. Ketiganya terisolasi — state mereka tidak saling bisa diakses.

Ketika pengguna klik "Tambah ke Keranjang" di Kartu Produk, dua hal harus terjadi: angka di ikon keranjang harus bertambah, dan toast notifikasi harus muncul. Tapi dari dalam island Kartu Produk, kamu tidak bisa menulis `this.$refs.keranjang.jumlah++` karena `$refs` island lain tidak bisa diakses.

Solusi naif — meletakkan semua state di satu root besar — mengorbankan isolasi dan membuat aplikasi menjadi satu gumpalan besar yang sulit dikelola.

Event Bus menawarkan solusi yang lebih elegan: **publish-subscribe**. Kartu Produk cukup *mengumumkan* bahwa sesuatu terjadi. Siapa pun yang tertarik mendengarkan akan bereaksi. Pengirim tidak perlu tahu siapa pendengarnya, pendengar tidak perlu tahu siapa pengirimnya.

---

## Pasang Ekstensinya Dulu

```html
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-eventbus.min.js"></script>
```

Setelah dimuat, tiga hal tersedia secara otomatis:
- `window.RaaEvents` — API global untuk kirim dan terima pesan dari JavaScript
- `$bus` — pintasan ke **bus lokal** root saat ini, tersedia di semua ekspresi template
- Direktif `raa-on:event:*` — cara deklaratif untuk mendengarkan event dari HTML

---

## Konsep: Bus Lokal vs Bus Global

Ini adalah konsep paling penting yang perlu dipahami sebelum menggunakan Event Bus.

**Bus Global** (`window.RaaEvents` / `RaaEvents`) adalah jalur komunikasi yang dibagi oleh seluruh halaman. Event yang dikirim ke bus global bisa didengar oleh siapa pun di halaman, tidak peduli island mana mereka tinggal.

**Bus Lokal** (`$bus`) adalah jalur komunikasi privat yang hanya dimiliki oleh satu root atau island. Setiap root/island mendapatkan instance bus lokalnya sendiri secara otomatis. Event yang dikirim ke bus lokal hanya bisa didengar oleh listener yang terdaftar pada bus lokal yang sama.

```
Halaman
│
├── Island A ──── bus lokal A ────┐
│                                 │ Hanya A yang mendengar
├── Island B ──── bus lokal B ────┘
│
└── Global Bus ─────────────────── Semua island bisa kirim & dengar
```

**Gunakan bus lokal** untuk komunikasi internal dalam satu island — misalnya antara sub-komponen dalam island yang sama.

**Gunakan bus global** untuk komunikasi lintas island — misalnya Kartu Produk → Keranjang Belanja.

---

## `$bus` — Bus Lokal di Template

Variabel `$bus` tersedia di semua ekspresi template setelah `raa-eventbus.js` dimuat. Ia selalu merujuk ke **bus lokal** dari root/island tempat elemen tersebut berada.

### Mengirim Event dari Template

```html
<div raa-core:app="produkIsland">

  <!-- Kirim ke bus lokal -->
  <button raa-on:click="$bus.emit('produk:dipilih', { id: produk.id, nama: produk.nama })">
    Pilih Produk
  </button>

  <!-- Kirim ke bus global dari template — pakai RaaEvents via method -->
  <button raa-on:click="tambahKeKeranjang(produk)">
    Tambah ke Keranjang
  </button>

</div>
```

```javascript
RaaJS.define('produkIsland', () => ({
  state: { produk: { id: 42, nama: 'Laptop Pro', harga: 15000000 } },
  methods: {
    tambahKeKeranjang(produk) {
      // Kirim ke bus GLOBAL — bisa didengar island lain
      RaaEvents.emit('cart:add', {
        id: produk.id,
        nama: produk.nama,
        harga: produk.harga
      });
    }
  }
}));
```

### Mendengarkan Event via `$bus` di Template

```html
<div raa-core:app="notifIsland"
     raa-on:event:cart:add="tampilNotif($event)">
  <!-- raa-on:event:cart:add mendengarkan bus LOKAL secara default -->
  <!-- Lihat bagian selanjutnya untuk cara ke global -->
</div>
```

---

## Direktif `raa-on:event:*` — Mendengarkan dari HTML

`raa-on:event:*` adalah cara deklaratif untuk mendaftarkan listener event bus langsung dari HTML. Format namanya adalah:

```
raa-on:event:[nama-event]="ekspresi"
```

Di dalam ekspresi, variabel khusus berikut tersedia:
- **`$event`** — payload yang dikirim via `emit()` (langsung isinya, bukan wrapper)
- **`$eventName`** — nama event yang di-emit (berguna saat menggunakan wildcard)
- **`$bus`** — referensi ke bus yang menangani event ini

### Scope Default: Bus Lokal

Tanpa atribut tambahan, `raa-on:event:*` mendengarkan pada **bus lokal** root tempat elemen berada:

```html
<div raa-core:app="keranjangIsland"
     raa-on:event:item:ditambah="updateJumlah($event)">
  <span raa-bind:text="jumlah + ' item'"></span>
</div>

<script>
  RaaJS.define('keranjangIsland', () => ({
    state: { jumlah: 0 },
    methods: {
      updateJumlah(payload) {
        // payload adalah apa yang dikirim via emit()
        this.jumlah += payload.qty;
      }
    }
  }));
</script>
```

### Scope Global: Mendengarkan Bus Global

Tambahkan atribut `raa-event-scope="global"` pada elemen untuk mengalihkan listener ke bus global:

```html
<!-- Mendengarkan bus GLOBAL — bisa menerima dari island manapun -->
<div raa-core:app="keranjangIsland"
     raa-on:event:cart:add="tambahItem($event)"
     raa-event-scope="global">
  <!-- Sekarang mendengarkan RaaEvents (global bus), bukan $bus lokal -->
</div>
```

```javascript
// Di island LAIN — ini yang mengirim:
RaaEvents.emit('cart:add', { id: 5, nama: 'Produk Baru', qty: 1 });
// Island keranjangIsland akan menerimanya karena scope="global"
```

### Wildcard Events

Event Bus mendukung pola wildcard menggunakan `*`. Ini sangat berguna untuk mendengarkan semua event dari satu namespace:

```html
<!-- Dengarkan SEMUA event yang dimulai dengan 'cart:' -->
<div raa-on:event:cart:*="handleCartEvent($event)"
     raa-event-scope="global">
</div>
```

```javascript
methods: {
  handleCartEvent(payload) {
    // Dipanggil saat cart:add, cart:remove, cart:update — semuanya
    // $eventName tersedia untuk tahu event mana yang terpicu
    console.log('Cart event diterima dengan payload:', payload);
  }
}
```

---

## API Global: `window.RaaEvents`

Untuk penggunaan dari JavaScript (bukan template), gunakan `window.RaaEvents` atau cukup `RaaEvents` (tersedia secara global):

### `RaaEvents.emit(nama, payload)`

Kirim event ke semua listener di bus global yang cocok dengan `nama`:

```javascript
// Kirim event sederhana
RaaEvents.emit('user:login', { id: 1, nama: 'Andi' });

// Kirim event tanpa payload
RaaEvents.emit('app:ready');

// Kirim event dengan data kompleks
RaaEvents.emit('order:placed', {
  orderId: 'ORD-2024-001',
  items: [...],
  total: 250000,
  timestamp: Date.now()
});
```

### `RaaEvents.on(nama, handler, options?)`

Daftarkan listener untuk event tertentu. Mengembalikan objek `{ cancel() }` untuk membatalkan subscription:

```javascript
// Listener biasa
const sub = RaaEvents.on('user:login', (payload) => {
  console.log('User login:', payload.nama);
});

// Batalkan kapan saja
sub.cancel();

// Dengan opsi
const sub2 = RaaEvents.on('cart:add', (payload, emittedName) => {
  // emittedName = nama event yang sebenarnya di-emit
  // Berguna saat menggunakan wildcard pattern
  console.log(`Event "${emittedName}" dengan payload:`, payload);
}, {
  once: false,   // true = otomatis dibatalkan setelah dipanggil sekali
  scope: rootEl  // asosiasikan dengan root element untuk auto-cleanup
});
```

### `RaaEvents.once(nama, handler)`

Listener yang otomatis dibatalkan setelah dipanggil satu kali:

```javascript
// Hanya bereaksi pada login pertama
RaaEvents.once('user:login', (payload) => {
  this.selamatDatang(payload.nama);
});

// Setara dengan:
RaaEvents.on('user:login', handler, { once: true });
```

### `RaaEvents.off(nama, handler?)`

Hapus listener. Jika `handler` tidak diberikan, hapus semua listener untuk nama tersebut:

```javascript
const myHandler = (payload) => { /* ... */ };

// Pasang dulu
RaaEvents.on('data:update', myHandler);

// Hapus handler spesifik
RaaEvents.off('data:update', myHandler);

// Hapus SEMUA listener untuk 'data:update'
RaaEvents.off('data:update');
```

### `RaaEvents.clear(scope?)`

Hapus semua listener, atau semua yang berasosiasi dengan scope tertentu:

```javascript
// Hapus SEMUA listener di bus global — gunakan dengan hati-hati!
RaaEvents.clear();

// Hapus hanya listener yang terkait dengan root element tertentu
RaaEvents.clear(rootElement);
```

### `RaaEvents.local(rootElement)`

Dapatkan (atau buat) bus lokal untuk root element tertentu. Berguna saat kamu perlu mengakses bus lokal island dari luar island tersebut:

```javascript
const islandEl = document.querySelector('[raa-eco\\:island]');
const localBus = RaaEvents.local(islandEl);

// Kirim ke bus lokal island tertentu dari luar
localBus.emit('internal:refresh');

// Dengarkan bus lokal island dari luar
localBus.on('internal:event', (payload) => {
  console.log('Event dari island:', payload);
});
```

---

## Penamaan Event: Konvensi yang Disarankan

Event Bus tidak memaksamu menggunakan konvensi nama tertentu, tapi ada pola yang sangat dianjurkan agar kodebase tetap dapat dibaca dan dipelihara.

Gunakan format **`domain:aksi`** — namespace domain di depan, kata kerja aksi di belakang:

```javascript
// ✅ Format yang dianjurkan — domain:aksi
'cart:add'         // Keranjang: tambah item
'cart:remove'      // Keranjang: hapus item
'cart:clear'       // Keranjang: kosongkan
'user:login'       // User: berhasil login
'user:logout'      // User: logout
'user:updated'     // User: data diperbarui
'notification:show'  // Notifikasi: tampilkan
'modal:open'         // Modal: buka
'modal:close'        // Modal: tutup
'data:fetched'       // Data: selesai dimuat
'data:error'         // Data: terjadi error

// ❌ Hindari — terlalu generik atau ambigu
'update'
'change'
'click'
'event1'
```

Konvensi ini juga memungkinkan penggunaan wildcard yang bermakna:

```javascript
// Dengarkan semua event yang berhubungan dengan cart
RaaEvents.on('cart:*', handler);

// Dengarkan semua event user
RaaEvents.on('user:*', handler);
```

---

## Contoh Lengkap: Halaman E-commerce Multi-Island

Berikut adalah implementasi nyata yang mendemonstrasikan semua aspek Event Bus — bus global untuk komunikasi lintas island, bus lokal untuk komunikasi internal, dan wildcard untuk aggregasi event:

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>E-commerce — RaaJS Event Bus Demo</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: sans-serif; margin: 0; background: #f8fafc; min-height: 100vh; }

    /* Header Island */
    header { background: #1e293b; color: white; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
    .logo { font-weight: 800; font-size: 18px; letter-spacing: -0.5px; }
    .cart-btn { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 10px; padding: 8px 16px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; transition: background 0.2s; }
    .cart-btn:hover { background: rgba(255,255,255,0.2); }
    .cart-badge { background: #f43f5e; border-radius: 20px; padding: 1px 7px; font-size: 11px; font-weight: 800; }

    /* Produk Grid Island */
    .produk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; padding: 24px; max-width: 900px; margin: 0 auto; }
    .produk-card { background: white; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; transition: box-shadow 0.2s, transform 0.2s; }
    .produk-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }
    .produk-emoji { font-size: 40px; text-align: center; margin-bottom: 12px; }
    .produk-nama { font-weight: 700; font-size: 15px; margin-bottom: 4px; }
    .produk-harga { color: #3b82f6; font-weight: 700; font-size: 14px; margin-bottom: 12px; }
    .btn-tambah { width: 100%; background: #3b82f6; color: white; border: none; border-radius: 10px; padding: 10px; font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
    .btn-tambah:hover { background: #2563eb; }
    .btn-tambah.ditambah { background: #10b981; }

    /* Drawer Keranjang */
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; }
    .drawer { position: fixed; right: 0; top: 0; bottom: 0; width: 360px; background: white; z-index: 201; display: flex; flex-direction: column; box-shadow: -4px 0 24px rgba(0,0,0,0.12); transform: translateX(100%); transition: transform 0.3s ease; }
    .drawer.terbuka { transform: translateX(0); }
    .drawer-header { padding: 20px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
    .drawer-header h3 { margin: 0; font-size: 18px; }
    .tutup-btn { background: none; border: none; cursor: pointer; font-size: 20px; color: #94a3b8; }
    .drawer-body { flex: 1; overflow-y: auto; padding: 16px; }
    .cart-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 10px; margin-bottom: 8px; border: 1px solid #f1f5f9; }
    .cart-item-emoji { font-size: 24px; }
    .cart-item-info { flex: 1; }
    .cart-item-nama { font-weight: 600; font-size: 13px; }
    .cart-item-harga { color: #64748b; font-size: 12px; }
    .cart-item-qty { font-weight: 700; font-size: 13px; color: #3b82f6; white-space: nowrap; }
    .hapus-item { background: none; border: none; cursor: pointer; color: #cbd5e1; font-size: 14px; }
    .hapus-item:hover { color: #ef4444; }
    .drawer-footer { padding: 20px; border-top: 1px solid #f1f5f9; }
    .total-row { display: flex; justify-content: space-between; font-weight: 700; font-size: 16px; margin-bottom: 16px; }
    .btn-checkout { width: 100%; background: #10b981; color: white; border: none; border-radius: 12px; padding: 14px; font-size: 15px; font-weight: 700; cursor: pointer; }
    .kosong-info { text-align: center; padding: 40px 0; color: #94a3b8; font-size: 14px; }

    /* Toast Notifikasi */
    .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(80px); background: #1e293b; color: white; padding: 12px 20px; border-radius: 12px; font-size: 13px; font-weight: 600; z-index: 300; transition: transform 0.3s ease; white-space: nowrap; }
    .toast.tampil { transform: translateX(-50%) translateY(0); }

    /* Log Event */
    .event-log { max-width: 900px; margin: 0 auto 40px; padding: 0 24px; }
    .event-log h3 { font-size: 14px; color: #64748b; margin-bottom: 8px; }
    .log-entries { background: #0f172a; border-radius: 12px; padding: 12px 16px; max-height: 180px; overflow-y: auto; }
    .log-entry { font-family: monospace; font-size: 12px; color: #94a3b8; padding: 3px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .log-entry .waktu { color: #475569; margin-right: 8px; }
    .log-entry .nama { color: #38bdf8; }
    .log-entry .payload { color: #a3e635; }
  </style>
</head>
<body>

  <!-- ══════════════════════════════════════════
       ISLAND 1: Header dengan tombol keranjang
       ══════════════════════════════════════════ -->
  <div raa-eco:island
       raa-core:init="Object.assign($state, { jumlah: 0, buka: false })"
       raa-on:event:cart:add="jumlah++"
       raa-on:event:cart:remove="jumlah > 0 ? jumlah-- : null"
       raa-on:event:cart:clear="jumlah = 0"
       raa-on:event:drawer:toggle="buka = !buka"
       raa-event-scope="global">
    <header>
      <div class="logo">🛍 RaaJS Store</div>
      <button class="cart-btn" raa-on:click="$bus.emit('drawer:toggle')">
        🛒 Keranjang
        <template raa-flow:if="jumlah > 0">
          <span class="cart-badge" raa-bind:text="jumlah"></span>
        </template>
      </button>
    </header>
  </div>

  <!-- ══════════════════════════════════════════
       ISLAND 2: Grid Produk
       ══════════════════════════════════════════ -->
  <div raa-core:app="produkApp">
    <div class="produk-grid">
      <template raa-flow:for="produk in katalog" raa-key="produk.id">
        <div class="produk-card">
          <div class="produk-emoji" raa-bind:text="produk.emoji"></div>
          <div class="produk-nama" raa-bind:text="produk.nama"></div>
          <div class="produk-harga" raa-bind:text="'Rp ' + produk.harga.toLocaleString('id-ID')"></div>
          <button class="btn-tambah"
                  raa-on:click="tambah(produk)"
                  raa-bind:class="{ ditambah: produk.baru }">
            <span raa-bind:text="produk.baru ? '✓ Ditambahkan!' : '+ Tambah ke Keranjang'"></span>
          </button>
        </div>
      </template>
    </div>
  </div>

  <!-- ══════════════════════════════════════════
       ISLAND 3: Drawer Keranjang
       ══════════════════════════════════════════ -->
  <div raa-eco:island
       raa-core:init="Object.assign($state, { terbuka: false, items: [] })"
       raa-on:event:cart:add="tambahItem($event)"
       raa-on:event:cart:clear="items = []"
       raa-on:event:drawer:toggle="terbuka = !terbuka"
       raa-event-scope="global">

    <!-- Overlay -->
    <template raa-flow:if="terbuka">
      <div class="overlay" raa-on:click.self="terbuka = false"></div>
    </template>

    <!-- Drawer panel — selalu di DOM agar transisi CSS bekerja -->
    <div class="drawer"
         raa-bind:class="{ terbuka: terbuka }">

      <div class="drawer-header">
        <h3>🛒 Keranjang (<span raa-bind:text="items.length"></span>)</h3>
        <button class="tutup-btn" raa-on:click="terbuka = false">✕</button>
      </div>

      <div class="drawer-body">
        <template raa-flow:if="items.length === 0">
          <div class="kosong-info">
            <p>🛒</p>
            <p>Keranjangmu masih kosong</p>
          </div>
        </template>

        <template raa-flow:for="item in items" raa-key="item.cartId">
          <div class="cart-item">
            <span class="cart-item-emoji" raa-bind:text="item.emoji"></span>
            <div class="cart-item-info">
              <div class="cart-item-nama" raa-bind:text="item.nama"></div>
              <div class="cart-item-harga" raa-bind:text="'Rp ' + item.harga.toLocaleString('id-ID')"></div>
            </div>
            <span class="cart-item-qty" raa-bind:text="'×' + item.qty"></span>
            <button class="hapus-item" raa-on:click="hapusItem(item.cartId)">✕</button>
          </div>
        </template>
      </div>

      <template raa-flow:if="items.length > 0">
        <div class="drawer-footer">
          <div class="total-row">
            <span>Total</span>
            <span raa-bind:text="'Rp ' + totalHarga().toLocaleString('id-ID')"></span>
          </div>
          <button class="btn-checkout" raa-on:click="checkout()">
            Bayar Sekarang →
          </button>
        </div>
      </template>
    </div>
  </div>

  <!-- ══════════════════════════════════════════
       ISLAND 4: Toast Notifikasi
       ══════════════════════════════════════════ -->
  <div raa-eco:island
       raa-core:init="Object.assign($state, { tampil: false, pesan: '' })"
       raa-on:event:toast:show="tampilkan($event)"
       raa-event-scope="global">
    <div class="toast"
         raa-bind:class="{ tampil: tampil }"
         raa-bind:text="pesan">
    </div>
  </div>

  <!-- ══════════════════════════════════════════
       ISLAND 5: Log Event (untuk observasi)
       Mendengarkan SEMUA event via wildcard
       ══════════════════════════════════════════ -->
  <div raa-core:app="logApp">
    <div class="event-log">
      <h3>📡 Event Log (wildcard listener: <code>*</code>)</h3>
      <div class="log-entries">
        <template raa-flow:if="log.length === 0">
          <div class="log-entry" style="color: #475569;">Belum ada event...</div>
        </template>
        <template raa-flow:for="entry in log" raa-key="entry.id">
          <div class="log-entry">
            <span class="waktu" raa-bind:text="entry.waktu"></span>
            <span class="nama" raa-bind:text="entry.nama"></span>
            <span class="payload" raa-bind:text="' → ' + entry.payload"></span>
          </div>
        </template>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-eventbus.min.js"></script>
  <script>

    // ── Island 2: Produk App ─────────────────────────────────
    RaaJS.define('produkApp', () => ({
      state: {
        katalog: [
          { id: 1, nama: 'Wireless Headphones', harga: 450000, emoji: '🎧' },
          { id: 2, nama: 'Mechanical Keyboard', harga: 875000, emoji: '⌨️' },
          { id: 3, nama: 'USB-C Hub 7-in-1',   harga: 320000, emoji: '🔌' },
          { id: 4, nama: 'Standing Desk Mat',   harga: 185000, emoji: '🗂️' }
        ].map(p => ({ ...p, baru: false }))
      },
      methods: {
        tambah(produk) {
          // Kirim ke bus GLOBAL — diterima oleh island keranjang dan toast
          RaaEvents.emit('cart:add', {
            id: produk.id,
            nama: produk.nama,
            harga: produk.harga,
            emoji: produk.emoji
          });

          RaaEvents.emit('toast:show', `✓ "${produk.nama}" ditambahkan ke keranjang!`);

          // Feedback visual sementara pada tombol
          produk.baru = true;
          setTimeout(() => { produk.baru = false; }, 1500);
        }
      }
    }));

    // ── Island 3: Drawer Keranjang (method definitions via init) ─
    // Island menggunakan raa-core:init, tapi method kompleks perlu
    // didaftarkan via factory app yang terpisah agar tetap bersih
    // Dalam kasus sederhana seperti ini, kita bisa pakai inline expression
    // Untuk method yang lebih kompleks, gunakan raa-core:app

    // ── Island 5: Log App ────────────────────────────────────────
    RaaJS.define('logApp', () => ({
      state: { log: [] },
      init() {
        // Gunakan wildcard '*' untuk menangkap SEMUA event global
        RaaEvents.on('*', (payload, emittedName) => {
          this.log.unshift({
            id: Date.now(),
            waktu: new Date().toLocaleTimeString('id-ID'),
            nama: emittedName,
            payload: JSON.stringify(payload).substring(0, 60)
          });
          if (this.log.length > 15) this.log.pop();
        });
      }
    }));

    // ── Definisi method untuk island keranjang via inline ────────
    // Karena island menggunakan raa-eco:island + raa-core:init,
    // method yang lebih kompleks perlu pendekatan berbeda.
    // Kita bisa extend setelah compile dengan $watch dinamis,
    // atau lebih baik gunakan raa-core:app untuk island yang butuh method:

    document.addEventListener('DOMContentLoaded', () => {
      // Daftarkan method global yang dibutuhkan island keranjang
      // setelah compile selesai — via RaaEvents untuk koordinasi

      // Kirim event drawer:toggle dari tombol keranjang di header
      // sudah ditangani via raa-on:event directive langsung
    });

  </script>

  <!-- Method untuk island drawer — karena island raa-eco:island tidak punya
       factory, kita definisikan method-nya inline di script terpisah setelah
       RaaJS selesai compile. Untuk kasus produksi, lebih baik gunakan
       raa-core:app untuk island yang butuh method kompleks. -->
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // Cari island drawer setelah compile
      const drawerIsland = document.querySelectorAll('[raa-eco\\:island]')[1];
      if (!drawerIsland) return;

      // Tunggu state tersedia
      requestAnimationFrame(() => {
        const state = drawerIsland.__raa_state__;
        if (!state) return;

        state.tambahItem = function(payload) {
          const existing = this.items.find(i => i.id === payload.id);
          if (existing) {
            existing.qty++;
          } else {
            this.items.push({ ...payload, cartId: Date.now(), qty: 1 });
          }
          // Buka drawer otomatis saat item ditambah
          this.terbuka = true;
        };

        state.hapusItem = function(cartId) {
          const item = this.items.find(i => i.cartId === cartId);
          if (item) {
            RaaEvents.emit('cart:remove', { id: item.id });
            RaaEvents.emit('toast:show', `"${item.nama}" dihapus dari keranjang.`);
          }
          this.items = this.items.filter(i => i.cartId !== cartId);
        };

        state.totalHarga = function() {
          return this.items.reduce((acc, i) => acc + i.harga * i.qty, 0);
        };

        state.checkout = function() {
          RaaEvents.emit('cart:clear');
          RaaEvents.emit('toast:show', '🎉 Pesanan berhasil! Terima kasih.');
          this.terbuka = false;
        };
      });

      // Setup toast island
      const toastIsland = document.querySelectorAll('[raa-eco\\:island]')[2];
      if (!toastIsland) return;
      requestAnimationFrame(() => {
        const toastState = toastIsland.__raa_state__;
        if (!toastState) return;
        toastState.tampilkan = function(pesan) {
          this.pesan = pesan;
          this.tampil = true;
          setTimeout(() => { this.tampil = false; }, 3000);
        };
      });
    });
  </script>

</body>
</html>
```

> **Catatan Arsitektur:** Contoh di atas sengaja menampilkan dua pola berbeda — island dengan `raa-eco:island` + `raa-core:init` (untuk state sederhana + ekspresi inline), dan island dengan `raa-core:app` + `RaaJS.define()` (untuk state yang butuh method kompleks). Untuk island yang membutuhkan banyak method, **`raa-core:app` + `RaaJS.define()`** selalu menjadi pilihan yang lebih bersih dan mudah dipelihara.

---

## Cleanup Otomatis

Ini adalah salah satu hal yang paling kamu apresiasi dari Event Bus RaaJS: **kamu tidak perlu membersihkan subscription secara manual**.

Ketika sebuah root atau island di-destroy (dihapus dari DOM, atau `raa-flow:if` berubah menjadi false), `raa-eventbus.js` secara otomatis:

1. Melepas semua subscription `raa-on:event:*` pada semua elemen di dalam root tersebut
2. Menghapus bus lokal milik root tersebut
3. Membersihkan semua listener di bus global yang terasosiasi dengan root tersebut

Ini mencegah **listener zombie** — subscription yang tetap aktif setelah komponen mati, membuang memori dan berpotensi menyebabkan bug tak terduga.

Untuk subscription yang kamu pasang secara manual via `RaaEvents.on()` dari dalam method, RaaJS tidak bisa membersihkannya secara otomatis karena tidak tahu scope-nya. Untuk kasus ini, kamu bisa menggunakan opsi `scope`:

```javascript
methods: {
  init() {
    // Gunakan opsi 'scope' agar subscription ikut bersih saat root destroy
    RaaEvents.on('global:event', this.handleEvent, {
      scope: this.$refs.rootEl || document.querySelector('[raa-core\\:app="namaApp"]')
    });
  },
  handleEvent(payload) { /* ... */ }
}
```

Atau simpan hasil `on()` dan batalkan secara manual di tempat yang tepat:

```javascript
methods: {
  init() {
    this._sub = RaaEvents.on('global:event', this.handleEvent);
  },
  bersihkan() {
    this._sub.cancel();
  }
}
```

---

## Rangkuman Cepat

**Gunakan `$bus.emit()`** di template untuk mengirim ke bus lokal (komunikasi internal dalam satu island).

**Gunakan `RaaEvents.emit()`** di method untuk mengirim ke bus global (komunikasi lintas island).

**Gunakan `raa-on:event:nama`** untuk mendengarkan bus lokal dari HTML.

**Tambahkan `raa-event-scope="global"`** pada elemen yang perlu mendengarkan bus global dari HTML.

**Gunakan wildcard `*`** untuk menangkap banyak event sekaligus — sangat berguna untuk logging, analytics, atau monitoring.

**Penamaan `domain:aksi`** membuat kodebase mudah dibaca dan wildcard menjadi bermakna.

---

*Dokumentasi ini adalah bagian dari RaaJS v3.1.0 Official Docs. Kontribusi dan koreksi disambut di repositori resmi.*

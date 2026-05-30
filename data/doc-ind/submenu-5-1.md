# Computed & Watchers

> **Versi:** RaaJS v3.1.0 "Data Liberation"
> 
> **Ekstensi:** `raa-computed-watch.js` - Memahami dua cara merespons perubahan data untuk menghasilkan data baru atau memicu sebuah tindakan/aksi.

---

Ada dua kebutuhan yang muncul di hampir setiap aplikasi nyata: pertama, data turunan yang dihitung dari state lain — dan ingin selalu sinkron tanpa effort; kedua, kemampuan untuk bereaksi terhadap perubahan state tertentu dengan menjalankan efek samping. Computed dan Watchers adalah jawaban untuk keduanya.

---

## Pasang Ekstensinya Dulu

Fitur ini tidak ada di core — ia hadir sebagai ekstensi terpisah yang perlu dimuat setelah file inti:

```html
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-computed-watch.min.js"></script>
```

Setelah dimuat, ekstensi ini otomatis mendaftarkan dirinya ke RaaJS melalui Plugin System — tidak ada langkah tambahan yang diperlukan.

---

## Computed Properties — Data Turunan yang Cerdas

### Masalah yang Dipecahkan

Bayangkan kamu punya state `daftar` berisi array todo, dan kamu ingin menampilkan jumlah todo yang belum selesai di tiga tempat berbeda di halaman. Tanpa computed, kamu harus menulis method `jumlahAktif()` dan memanggilnya di setiap tempat — yang berarti fungsi tersebut dievaluasi ulang setiap kali ada perubahan state apa pun, meski todo sama sekali tidak berubah.

Computed properties memecahkan ini dengan **caching yang cerdas**: nilai hanya dihitung ulang ketika dependensinya yang relevan benar-benar berubah. Akses di tiga tempat sekalipun, kalkulasinya hanya terjadi sekali per perubahan.

### Cara Mendeklarasikan

Computed properties dideklarasikan sebagai objek `computed` di dalam factory `RaaJS.define()`. Setiap properti adalah sebuah getter function — fungsi tanpa parameter yang menggunakan `this` untuk mengakses state:

```javascript
RaaJS.define('todoApp', () => ({
  state: {
    todos: [
      { id: 1, judul: 'Belajar RaaJS', selesai: true },
      { id: 2, judul: 'Buat dokumentasi', selesai: false },
      { id: 3, judul: 'Deploy aplikasi', selesai: false }
    ],
    filter: 'semua'
  },

  computed: {
    // Jumlah todo yang belum selesai
    jumlahAktif() {
      return this.todos.filter(t => !t.selesai).length;
    },

    // Jumlah todo yang sudah selesai
    jumlahSelesai() {
      return this.todos.filter(t => t.selesai).length;
    },

    // Persentase penyelesaian
    persentase() {
      if (this.todos.length === 0) return 0;
      return Math.round((this.jumlahSelesai / this.todos.length) * 100);
    },

    // Daftar yang difilter — bergantung pada state 'filter' DAN 'todos'
    todosTampil() {
      if (this.filter === 'aktif')   return this.todos.filter(t => !t.selesai);
      if (this.filter === 'selesai') return this.todos.filter(t => t.selesai);
      return this.todos;
    }
  }
}));
```

### Menggunakan Computed di Template

Setelah dideklarasikan, computed property bisa diakses dari template persis seperti state biasa — dengan nama propertinya langsung, tanpa tanda kurung:

```html
<div raa-core:app="todoApp">

  <!-- Akses computed seperti properti state biasa -->
  <p raa-bind:text="jumlahAktif + ' tugas tersisa'"></p>
  <p raa-bind:text="jumlahSelesai + ' tugas selesai'"></p>
  <p raa-bind:text="persentase + '% selesai'"></p>

  <!-- Computed juga bisa digunakan di direktif lain -->
  <div raa-bind:style="{ width: persentase + '%', background: '#10b981', height: '8px', borderRadius: '4px' }"></div>

  <!-- Render loop menggunakan computed 'todosTampil' -->
  <template raa-flow:for="todo in todosTampil" raa-key="todo.id">
    <div raa-bind:text="todo.judul"></div>
  </template>

  <!-- Selector filter -->
  <button raa-on:click="filter = 'semua'">Semua</button>
  <button raa-on:click="filter = 'aktif'">Aktif</button>
  <button raa-on:click="filter = 'selesai'">Selesai</button>

</div>
```

Perhatikan `filter = 'aktif'` — ini adalah pengecualian dari aturan "tidak ada assignment di template" untuk kasus yang sangat sederhana. Tapi untuk konsistensi, kamu tetap bisa membungkusnya dalam method.

### Computed Bisa Bergantung pada Computed Lain

Ini salah satu kekuatan computed yang sering diremehkan. Seperti di contoh sebelumnya, `persentase` bergantung pada `jumlahSelesai` yang juga adalah computed — dan ini bekerja dengan sempurna:

```javascript
computed: {
  subtotal() {
    return this.items.reduce((acc, item) => acc + item.harga * item.qty, 0);
  },
  pajak() {
    return this.subtotal * 0.11; // PPN 11% — bergantung pada 'subtotal'
  },
  total() {
    return this.subtotal + this.pajak; // Bergantung pada 'subtotal' dan 'pajak'
  },
  totalFormatted() {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(this.total);
  }
}
```

RaaJS cukup cerdas untuk melacak rantai ketergantungan ini — perubahan di `items` akan memperbarui `subtotal`, yang memperbarui `pajak` dan `total`, yang memperbarui `totalFormatted`. Semuanya otomatis, semuanya hanya sekali per flush cycle.

### Computed vs Method: Kapan Pakai Yang Mana?

Ini pertanyaan yang sering muncul. Perbedaannya ada di **caching**:

```javascript
// Computed — di-cache, hanya dihitung ulang saat dependensi berubah
computed: {
  itemsFiltered() {
    return this.items.filter(i => i.aktif); // Tidak dihitung ulang jika 'items' tidak berubah
  }
}

// Method — selalu dihitung ulang setiap kali dipanggil
methods: {
  getItemsFiltered() {
    return this.items.filter(i => i.aktif); // Dihitung ulang setiap render
  }
}
```

```html
<!-- Computed: di-cache — meski dipanggil 10x, kalkulasi hanya 1x per perubahan -->
<p raa-bind:text="itemsFiltered.length"></p>
<template raa-flow:for="item in itemsFiltered" raa-key="item.id">...</template>
<!-- Template kedua mengakses computed yang sama — tidak dihitung ulang -->

<!-- Method: tanpa cache — dihitung ulang setiap kali ada render apapun -->
<p raa-bind:text="getItemsFiltered().length"></p>
<template raa-flow:for="item in getItemsFiltered()" raa-key="item.id">...</template>
<!-- Dua panggilan = dua kalkulasi -->
```

**Gunakan computed** untuk nilai turunan yang diakses berkali-kali atau di banyak tempat, dan ketika kalkulasinya cukup berat.

**Gunakan method** untuk kalkulasi yang membutuhkan argumen, atau untuk operasi yang memang selalu perlu dijalankan segar setiap kali dipanggil.

---

## Watchers — Bereaksi Terhadap Perubahan

### Masalah yang Dipecahkan

Computed sangat bagus untuk data turunan — tapi bagaimana kalau kamu butuh menjalankan **efek samping** saat state berubah? Misalnya:

- Menyimpan ke `localStorage` setiap kali preferensi berubah
- Memuat ulang data dari API ketika filter pencarian diperbarui
- Menampilkan notifikasi saat status order berubah
- Log analytics saat pengguna mengubah pengaturan

Ini bukan tentang menghitung nilai baru — ini tentang menjalankan sebuah aksi sebagai respons terhadap perubahan. Itulah tugas **Watchers**.

### Cara Mendeklarasikan

Watchers dideklarasikan sebagai objek `watch` di dalam factory. Kunci adalah path ke properti yang ingin dipantau, nilainya adalah callback yang dipanggil saat nilainya berubah:

```javascript
RaaJS.define('settingsApp', () => ({
  state: {
    tema: 'light',
    bahasa: 'id',
    ukuranFont: 16,
    notifikasi: true
  },

  watch: {
    // Dipanggil setiap kali 'tema' berubah
    // newValue = nilai baru, oldValue = nilai sebelumnya
    tema(newValue, oldValue) {
      console.log(`Tema berubah: ${oldValue} → ${newValue}`);
      document.documentElement.setAttribute('data-tema', newValue);
      localStorage.setItem('tema', newValue);
    },

    // Pantau properti nested menggunakan dot notation
    'user.email'(newValue, oldValue) {
      if (newValue && newValue !== oldValue) {
        this.kirimVerifikasiEmail(newValue);
      }
    },

    // Watcher bisa async
    async bahasa(newValue) {
      const terjemahan = await fetch('/api/i18n/' + newValue).then(r => r.json());
      this.terjemahanAktif = terjemahan;
    },

    // Pantau ukuranFont untuk update CSS variable
    ukuranFont(nilai) {
      document.documentElement.style.setProperty('--font-size-base', nilai + 'px');
    }
  },

  methods: {
    async kirimVerifikasiEmail(email) {
      await fetch('/api/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    }
  }
}));
```

### Perbedaan Watch dengan Computed

Keduanya bereaksi terhadap perubahan state, tapi dengan tujuan yang berbeda:

| | `computed` | `watch` |
|---|---|---|
| **Tujuan** | Menghasilkan nilai baru dari state | Menjalankan efek samping |
| **Return value** | Wajib mengembalikan nilai | Tidak perlu return apapun |
| **Async?** | Tidak disarankan | Ya, bisa async/await |
| **Side effects?** | Hindari — murni kalkulasi | Justru inilah tujuannya |
| **Dipanggil saat** | Dependensi berubah | Path yang dipantau berubah |
| **Contoh** | `totalHarga`, `itemsFiltered` | Simpan ke API, update DOM eksternal |

Aturan sederhananya: kalau kamu perlu nilai baru → `computed`. Kalau kamu perlu menjalankan sesuatu → `watch`.

### Deep Path Watching

Kamu bisa memantau properti yang berada dalam objek bersarang menggunakan dot notation:

```javascript
state: {
  profil: {
    alamat: {
      kota: 'Jakarta',
      provinsi: 'DKI Jakarta'
    }
  }
}

watch: {
  // Pantau properti nested
  'profil.alamat.kota'(kotaBaru, kotaLama) {
    console.log(`Kota berubah dari ${kotaLama} ke ${kotaBaru}`);
    this.updatePengiriman();
  }
}
```

---

## `$watch()` — Watcher Dinamis dari Dalam Method

Terkadang kamu tidak tahu saat kompilasi watcher apa yang perlu dipasang — keputusan itu baru diketahui saat runtime. Untuk itu ada `$watch()`, sebuah method yang bisa kamu panggil dari mana saja di dalam kode untuk memasang watcher secara dinamis.

```javascript
methods: {
  init() {
    // Pasang watcher secara dinamis dari dalam init()
    this.$watch('kuantitas', (nilai, lama) => {
      console.log(`Kuantitas: ${lama} → ${nilai}`);
      this.updateStok();
    });
  },

  mulaiPantau(namaField) {
    // Bisa juga dipanggil dari method lain
    const effect = this.$watch(namaField, (nilai) => {
      this.log.push(`${namaField} berubah menjadi: ${nilai}`);
    });

    // $watch mengembalikan effect yang bisa di-dispose kapan saja
    // Simpan jika kamu perlu menghentikannya nanti
    this.watchers.push(effect);
  }
}
```

`$watch()` mengembalikan sebuah effect object. Kamu bisa menyimpannya jika perlu menghentikan watcher tersebut di kemudian hari — meskipun dalam kebanyakan kasus, RaaJS akan membersihkan semua watcher otomatis saat root di-destroy.

---

## Contoh Lengkap: Dashboard E-commerce

Berikut adalah contoh yang menggabungkan computed dan watchers dalam skenario nyata — sebuah halaman keranjang belanja dengan kalkulasi otomatis dan auto-save:

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Keranjang Belanja — RaaJS</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: sans-serif; max-width: 680px; margin: 40px auto; padding: 0 16px; color: #1e293b; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 22px; }
    .badge { background: #3b82f6; color: white; border-radius: 20px; padding: 2px 10px; font-size: 12px; font-weight: 700; }
    .item { display: flex; align-items: center; gap: 16px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 10px; }
    .item-info { flex: 1; }
    .item-nama { font-weight: 600; font-size: 15px; }
    .item-harga { font-size: 13px; color: #64748b; margin-top: 2px; }
    .qty-ctrl { display: flex; align-items: center; gap: 8px; }
    .qty-btn { width: 28px; height: 28px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; }
    .qty-btn:hover { background: #f1f5f9; }
    .qty-val { font-weight: 700; font-size: 15px; min-width: 28px; text-align: center; }
    .subtotal { font-weight: 700; font-size: 15px; color: #3b82f6; min-width: 100px; text-align: right; }
    .hapus { background: none; border: none; cursor: pointer; color: #94a3b8; font-size: 18px; padding: 4px; }
    .hapus:hover { color: #ef4444; }
    .summary { background: #f8fafc; border-radius: 16px; padding: 20px; margin-top: 24px; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; border-bottom: 1px solid #e2e8f0; }
    .summary-row:last-child { border-bottom: none; }
    .summary-row.total { font-weight: 700; font-size: 17px; color: #1e293b; }
    .summary-row.diskon { color: #16a34a; }
    .btn-checkout { width: 100%; background: #3b82f6; color: white; border: none; border-radius: 12px; padding: 14px; font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 16px; }
    .btn-checkout:disabled { opacity: 0.5; cursor: not-allowed; }
    .progress-bar { background: #e2e8f0; border-radius: 4px; height: 6px; margin: 12px 0 4px; }
    .progress-fill { background: #10b981; border-radius: 4px; height: 6px; transition: width 0.3s; }
    .notif { position: fixed; bottom: 24px; right: 24px; background: #1e293b; color: white; padding: 12px 20px; border-radius: 12px; font-size: 13px; font-weight: 600; transform: translateY(100px); transition: transform 0.3s; }
    .notif.tampil { transform: translateY(0); }
    .promo { display: flex; gap: 8px; margin-bottom: 16px; }
    .promo input { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; font-size: 14px; }
    .promo button { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 16px; cursor: pointer; font-size: 14px; }
    .promo button:hover { background: #e2e8f0; }
    .tag-promo { display: inline-block; background: #dcfce7; color: #15803d; font-size: 12px; padding: 2px 10px; border-radius: 20px; font-weight: 600; margin-left: 8px; }
    .kosong { text-align: center; padding: 48px 0; color: #94a3b8; }
    .save-status { font-size: 11px; color: #94a3b8; text-align: right; margin-top: 8px; }
  </style>
</head>
<body>

  <div raa-core:app="keranjangApp">

    <div class="header">
      <h1>🛒 Keranjangku</h1>
      <span class="badge" raa-bind:text="items.length + ' item'"></span>
    </div>

    <!-- Progress menuju gratis ongkir -->
    <template raa-flow:if="items.length > 0">
      <div style="margin-bottom: 20px; font-size: 13px;">
        <template raa-flow:if="subtotal < bebasOngkirMinimal">
          <p style="color: #64748b;">
            Tambah
            <strong raa-bind:text="formatRp(bebasOngkirMinimal - subtotal)"></strong>
            lagi untuk gratis ongkir! 🚚
          </p>
          <div class="progress-bar">
            <div class="progress-fill"
                 raa-bind:style="{ width: progressOngkir + '%' }"></div>
          </div>
        </template>
        <template raa-flow:if="subtotal >= bebasOngkirMinimal">
          <p style="color: #16a34a; font-weight: 600;">🎉 Kamu dapat gratis ongkir!</p>
        </template>
      </div>
    </template>

    <!-- Daftar Item -->
    <template raa-flow:if="items.length > 0">
      <div>
        <template raa-flow:for="item in items" raa-key="item.id">
          <div class="item">
            <div class="item-info">
              <div class="item-nama" raa-bind:text="item.nama"></div>
              <div class="item-harga" raa-bind:text="formatRp(item.harga) + ' / item'"></div>
            </div>
            <div class="qty-ctrl">
              <button class="qty-btn" raa-on:click="kurangiQty(item.id)">−</button>
              <span class="qty-val" raa-bind:text="item.qty"></span>
              <button class="qty-btn" raa-on:click="tambahQty(item.id)">+</button>
            </div>
            <div class="subtotal" raa-bind:text="formatRp(item.harga * item.qty)"></div>
            <button class="hapus" raa-on:click="hapusItem(item.id)">✕</button>
          </div>
        </template>
      </div>

      <!-- Kode Promo -->
      <div class="promo">
        <input type="text"
               raa-bind:model="inputKodePromo"
               raa-on:keydown.enter="terapkanPromo()"
               placeholder="Punya kode promo?">
        <button raa-on:click="terapkanPromo()">Terapkan</button>
      </div>
      <template raa-flow:if="kodePromoAktif">
        <p style="font-size: 13px; color: #64748b;">
          Promo aktif:
          <span class="tag-promo" raa-bind:text="kodePromoAktif + ' (-' + diskonPersen + '%)'"></span>
          <button style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:12px;"
                  raa-on:click="hapusPromo()">✕ Hapus</button>
        </p>
      </template>

      <!-- Ringkasan Harga -->
      <div class="summary">
        <div class="summary-row">
          <span raa-bind:text="'Subtotal (' + totalQty + ' item)'"></span>
          <span raa-bind:text="formatRp(subtotal)"></span>
        </div>
        <template raa-flow:if="diskon > 0">
          <div class="summary-row diskon">
            <span raa-bind:text="'Diskon (' + diskonPersen + '%)'"></span>
            <span raa-bind:text="'− ' + formatRp(diskon)"></span>
          </div>
        </template>
        <div class="summary-row">
          <span>Ongkos Kirim</span>
          <template raa-flow:if="ongkir === 0">
            <span style="color: #16a34a; font-weight: 600;">GRATIS 🎉</span>
          </template>
          <template raa-flow:if="ongkir > 0">
            <span raa-bind:text="formatRp(ongkir)"></span>
          </template>
        </div>
        <div class="summary-row total">
          <span>Total Bayar</span>
          <span raa-bind:text="formatRp(total)"></span>
        </div>
        <button class="btn-checkout"
                raa-on:click="checkout()"
                raa-ux:disable="items.length === 0">
          Lanjut Pembayaran →
        </button>
      </div>

      <p class="save-status" raa-bind:text="statusSimpan"></p>
    </template>

    <!-- Keranjang Kosong -->
    <template raa-flow:if="items.length === 0">
      <div class="kosong">
        <p style="font-size: 48px; margin: 0;">🛒</p>
        <p style="font-weight: 600; margin: 8px 0 4px;">Keranjangmu kosong</p>
        <p style="font-size: 13px;">Yuk temukan produk favoritmu!</p>
      </div>
    </template>

    <!-- Notifikasi Toast -->
    <div class="notif" raa-bind:class="{ tampil: tampilNotif }" raa-bind:text="pesanNotif"></div>

  </div>

  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/extensions/raa-computed-watch.min.js"></script>
  <script>
    const KODE_PROMO = {
      'RAAJS10': 10,
      'HEMAT20': 20,
      'DISKON15': 15
    };

    RaaJS.define('keranjangApp', () => ({
      state: {
        items: [
          { id: 1, nama: 'RaaJS Pro Starter Kit', harga: 299000, qty: 1 },
          { id: 2, nama: 'Mechanical Keyboard Wireless', harga: 875000, qty: 1 },
          { id: 3, nama: 'USB-C Hub Premium 7-in-1', harga: 320000, qty: 2 }
        ],
        inputKodePromo: '',
        kodePromoAktif: '',
        diskonPersen: 0,
        tampilNotif: false,
        pesanNotif: '',
        statusSimpan: '',
        bebasOngkirMinimal: 500000,
        ongkirStandar: 25000
      },

      // ─── COMPUTED ─────────────────────────────────────────────
      computed: {
        // Jumlah total semua qty di keranjang
        totalQty() {
          return this.items.reduce((acc, item) => acc + item.qty, 0);
        },

        // Subtotal sebelum diskon dan ongkir
        subtotal() {
          return this.items.reduce((acc, item) => acc + item.harga * item.qty, 0);
        },

        // Nominal diskon dari kode promo
        diskon() {
          return Math.round(this.subtotal * (this.diskonPersen / 100));
        },

        // Harga setelah diskon
        hargaSetelahDiskon() {
          return this.subtotal - this.diskon;
        },

        // Ongkir — gratis jika subtotal >= minimal
        ongkir() {
          return this.subtotal >= this.bebasOngkirMinimal ? 0 : this.ongkirStandar;
        },

        // Total akhir yang harus dibayar
        total() {
          return this.hargaSetelahDiskon + this.ongkir;
        },

        // Persentase progress menuju gratis ongkir (0-100)
        progressOngkir() {
          return Math.min(100, Math.round((this.subtotal / this.bebasOngkirMinimal) * 100));
        }
      },

      // ─── WATCHERS ─────────────────────────────────────────────
      watch: {
        // Auto-save ke localStorage setiap kali items berubah
        items(newItems) {
          try {
            localStorage.setItem('keranjang-items', JSON.stringify(newItems));
            this.statusSimpan = '✓ Tersimpan otomatis ' + new Date().toLocaleTimeString('id-ID');
          } catch (e) {
            this.statusSimpan = '⚠ Gagal menyimpan';
          }
        },

        // Tampilkan notifikasi saat kode promo berubah
        kodePromoAktif(kode, kodeSebelumnya) {
          if (kode) {
            this.notif(`🎉 Promo "${kode}" berhasil diterapkan! Hemat ${this.diskonPersen}%.`);
          } else if (kodeSebelumnya) {
            this.notif('Kode promo dihapus.');
          }
        },

        // Notifikasi saat mencapai gratis ongkir
        ongkir(nilaiOngkir, sebelumnya) {
          if (nilaiOngkir === 0 && sebelumnya > 0) {
            this.notif('🚚 Selamat! Kamu dapat gratis ongkir!');
          }
        }
      },

      methods: {
        tambahQty(id) {
          const item = this.items.find(i => i.id === id);
          if (item) item.qty++;
        },

        kurangiQty(id) {
          const item = this.items.find(i => i.id === id);
          if (!item) return;
          if (item.qty > 1) {
            item.qty--;
          } else {
            this.hapusItem(id);
          }
        },

        hapusItem(id) {
          const item = this.items.find(i => i.id === id);
          if (item) this.notif(`"${item.nama}" dihapus dari keranjang.`);
          this.items = this.items.filter(i => i.id !== id);
        },

        terapkanPromo() {
          const kode = this.inputKodePromo.trim().toUpperCase();
          if (!kode) return;

          if (KODE_PROMO[kode]) {
            this.kodePromoAktif = kode;
            this.diskonPersen = KODE_PROMO[kode];
          } else {
            this.notif('❌ Kode promo tidak valid atau sudah kedaluwarsa.');
          }
          this.inputKodePromo = '';
        },

        hapusPromo() {
          this.kodePromoAktif = '';
          this.diskonPersen = 0;
        },

        notif(pesan, durasi = 3000) {
          this.pesanNotif = pesan;
          this.tampilNotif = true;
          setTimeout(() => { this.tampilNotif = false; }, durasi);
        },

        checkout() {
          this.notif('🎉 Melanjutkan ke pembayaran...');
        },

        formatRp(nilai) {
          return 'Rp ' + new Intl.NumberFormat('id-ID').format(nilai);
        }
      },

      init() {
        // Muat items dari localStorage jika ada
        try {
          const tersimpan = localStorage.getItem('keranjang-items');
          if (tersimpan) {
            const data = JSON.parse(tersimpan);
            if (Array.isArray(data) && data.length > 0) {
              this.items = data;
              this.statusSimpan = '✓ Dimuat dari penyimpanan lokal';
            }
          }
        } catch (e) { /* Abaikan jika error */ }

        // Contoh $watch dinamis — mulai pantau 'diskonPersen' setelah init
        this.$watch('diskonPersen', (nilai) => {
          if (nilai > 0) {
            console.log(`Diskon aktif: ${nilai}% → hemat ${this.formatRp(this.diskon)}`);
          }
        });
      }
    }));
  </script>

</body>
</html>
```

---

## Hal-hal yang Perlu Diingat

**Tentang `computed`:**

Getter function di dalam `computed` harus bersifat **murni** — hanya membaca dari state, tidak memodifikasi apapun. Jika kamu memodifikasi state di dalam computed, kamu akan membuat loop reaktif yang tidak berujung.

```javascript
computed: {
  // ✅ Benar — murni, hanya baca
  totalAktif() {
    return this.items.filter(i => i.aktif).length;
  },

  // ❌ Salah — jangan modifikasi state di dalam computed!
  hitungDanSimpan() {
    this.cachedTotal = this.items.length; // Jangan lakukan ini
    return this.items.length;
  }
}
```

**Tentang `watch`:**

Watcher berjalan setelah perubahan state terdeteksi — bukan saat deklarasi. Jika kamu butuh callback yang berjalan sekali di awal (immediate watcher), lakukan secara eksplisit di `init()`:

```javascript
watch: {
  tema(nilai) {
    document.body.setAttribute('data-tema', nilai);
  }
},
init() {
  // Jalankan satu kali di awal untuk inisialisasi
  document.body.setAttribute('data-tema', this.tema);

  // Setelah ini, watcher akan menjaga sinkronisasi otomatis
}
```

**Tentang `$watch` dinamis:**

Watcher yang dibuat via `$watch()` akan otomatis dibersihkan saat root di-destroy — tidak perlu manual cleanup di kebanyakan kasus. Tapi jika kamu membuat watcher di dalam loop atau kondisi tertentu dan ingin menghentikannya lebih awal:

```javascript
const effect = this.$watch('nilai', handler);
// Nanti ketika ingin dihentikan:
// RaaJS.disposeEffect(effect); — atau biarkan auto-cleanup saat destroy
```

---

*Dokumentasi ini adalah bagian dari RaaJS v3.1.0 Official Docs. Kontribusi dan koreksi disambut di repositori resmi.*

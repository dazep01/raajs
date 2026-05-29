# Kontrol Alur (Flow Control): Mengatur Irama Eksistensi

> Versi: RaaJS v3.1.0 "Data Liberation"
> Dunia tidak pernah statis; ia bergerak dalam pilihan dan pengulangan. Begitu pula dengan aplikasi kita. Kontrol Alur dalam RaaJS adalah manifestasi dari keputusan tersebut—menentukan kapan sesuatu harus "ada" di atas panggung DOM, dan kapan ia harus beristirahat di balik tirai. Melalui trio raa-flow:*, kita tidak hanya menulis kode, kita sedang menyutradarai sebuah pertunjukan data yang dinamis.

---

Kontrol alur (Flow Control) adalah salah satu fondasi utama dalam membangun antarmuka pengguna yang dinamis dan reaktif dengan RaaJS. Direktif kontrol alur memungkinkan kamu untuk merender elemen DOM secara kondisional, melakukan perulangan pada koleksi data, atau hanya mengontrol visibilitas elemen berdasarkan status aplikasimu.

---

## 1. Kondisional (`raa-flow:if`)

Direktif `raa-flow:if` digunakan untuk merender atau menghapus elemen dari DOM berdasarkan ekspresi yang diberikan. Jika ekspresi bernilai `truthy`, elemen akan dirender; jika `falsy`, elemen akan dihapus.

### Sintaksis
`raa-flow:if` **harus selalu digunakan pada elemen `<template>`**. Konten di dalam `<template>` tersebut akan dirender ke DOM sebagai *sibling* dari `<template>` itu sendiri jika kondisi terpenuhi.

```html
<template raa-flow:if="user.isLoggedIn">
  <div>Selamat datang, <span raa-bind:text="user.name"></span>!</div>
</template>
<template raa-flow:if="!user.isLoggedIn">
  <div>Silakan login untuk melanjutkan.</div>
</template>
```

### Cara Kerja
Ketika ekspresi dalam `raa-flow:if` berubah:
*   **True menjadi False:** Elemen-elemen yang dirender oleh blok `raa-flow:if` akan dihapus sepenuhnya dari DOM. Ini bisa kita sebut **Pembersihan Total**, yaitu saat kondisi menjadi false, RaaJS melakukan *deepCleanup*—melepas *event listener*, membatalkan *fetch*, dan menghentikan semua *reactive effects* di dalamnya
*   **False menjadi True:** Elemen-elemen akan dibuat dan disisipkan ke dalam DOM. Yang dapat kita sebut **Kelahiran Baru**, yaitu saat kondisi kembali true, elemen diciptakan ulang dari nol. Ini memastikan state di dalam elemen kondisional selalu segar dan tidak "terjebak" pada kondisi lama.

Jika kita narasikan, kurang lebihnya seperti ini:
*   `<template raa-flow:if="user.isLoggedIn"><div>Selamat datang, <span raa-bind:text="user.name"></span>!</div></template>` ⇒ Jika user/pengguna sudah login, maka tampilkan kalimat "Selamat datang," lalu lanjutkan dengan mengambil dan menampilkan nama user dari data di state (`user.name`).
*   `<template raa-flow:if="!user.isLoggedIn"><div>Silakan login untuk melanjutkan.</div></template>` ⇒ Tapi, jika user belum/tidak login, maka tampilkan kalimat "Silakan login untuk melanjutkan.".

Simpel, mudah dimengerti, dan gampang untuk diimplementasikan. Direktif ini (`raa-flow:if`) sangat efisien untuk merender blok konten yang jarang berubah atau memiliki biaya *setup* tinggi.

### Contoh: Menampilkan Data atau Pesan Kosong

Berikut adalah contoh bagaimana Anda dapat menampilkan daftar item jika ada, atau pesan "Belum ada item" jika daftar kosong:

```html
<div raa-core:app="listApp">
  <template raa-flow:if="items.length > 0">
    <ul>
      <template raa-flow:for="item in items" raa-key="item.id">
        <li raa-bind:text="item.name"></li>
      </template>
    </ul>
  </template>
  <template raa-flow:if="items.length === 0">
    <p>Belum ada item.</p>
  </template>
</div>

<script>
  RaaJS.define('listApp', () => ({
    state: {
      items: [
        { id: 1, name: 'Buku RaaJS' },
        { id: 2, name: 'Belajar Fundamental' }
      ]
    }
  }));
</script>
```

---

## 2. Perulangan (`raa-flow:for`)

Dalam psikologi pengembangan, menampilkan daftar data bukan sekadar menduplikasi elemen DOM. Ini adalah upaya untuk memberikan "panggung" bagi setiap butir informasi agar mereka bisa bercerita secara mandiri namun tetap dalam harmoni sebuah koleksi.

Direktif `raa-flow:for` digunakan untuk merender daftar elemen berdasarkan data dalam sebuah *array* atau *object*. Ini adalah cara deklaratif untuk membangun daftar secara dinamis.

### Sintaksis
Sama halnya dengan saudaranya (`raa-flow:if`), direktif `raa-flow:for` menuntut penggunaan tag <template> sebagai rahim kelahirannya. Jadi, **harus selalu digunakan pada elemen `<template>`**. Template ini akan direplikasi untuk setiap item dalam koleksi data.

Secara filosofis, `<template>` adalah entitas yang "tidak mementingkan diri sendiri"; ia ada untuk melahirkan elemen di dalamnya tanpa meninggalkan jejak (elemen pembungkus) yang tidak perlu di dalam DOM.

```html
<ul>
  <template raa-flow:for="item in items" raa-key="item.id">
    <li raa-bind:text="item.name"></li>
  </template>
</ul>
```

### Fitur Penting: `raa-key` (Keyed Diffing)
Untuk performa optimal dan mempertahankan *state* elemen ketika daftar berubah (misalnya saat item ditambahkan, dihapus, atau diurutkan), **wajib** menggunakan atribut `raa-key` pada elemen `<template>` `raa-flow:for`. Nilai `raa-key` harus unik untuk setiap item dalam daftar, biasanya menggunakan `id` item.

Ingat! Inilah jantung dari performa RaaJS dalam menangani pengulangan. Tanpa `raa-key`, RaaJS akan mengalami krisis identitas; setiap kali data berubah, ia akan bingung mana elemen yang tetap dan mana yang baru, sehingga terpaksa merobohkan seluruh daftar hanya untuk membangunnya kembali.

*   **Filosofi Identitas**: `raa-key` haruslah berupa nilai primitif yang unik dan stabil (seperti ID dari basis data)
*   **Logika Teknis**: Dengan kunci yang stabil, RaaJS menggunakan algoritma keyed diffing untuk sekadar memindahkan atau memperbarui elemen yang ada, alih-alih melakukan render ulang total. Ini adalah bentuk penghormatan terhadap siklus CPU dan memori perangkat pengguna

```html
<template raa-flow:for="user in users" raa-key="user.id">
  <div>
    <h3 raa-bind:text="user.name"></h3>
    <p raa-bind:text="user.email"></p>
  </div>
</template>
```

### Variabel dalam Perulangan : Ruang Lingkup (Nested Scope) yang Terisolasi
Dalam ekspresi `raa-flow:for`, Anda dapat mengakses variabel berikut di dalam *scope* perulangan:
*   `item`: Item saat ini dalam iterasi (misalnya `user`, `todo`).
*   `index`: Indeks item saat ini (dimulai dari `0`).
*   `$locals`: Objek yang berisi semua variabel perulangan leluhur jika ada perulangan bersarang.

```html
<ul>
  <template raa-flow:for="(task, index) in todos" raa-key="task.id">
    <li>
      <span raa-bind:text="index + 1 + '. ' + task.title"></span>
      <template raa-flow:if="task.isComplete">
        <span> (Selesai)</span>
      </template>
    </li>
  </template>
</ul>
```

### Contoh: Daftar Tugas

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RaaJS Todo List</title>
    <!-- RaaJS Core — selalu muat ini PERTAMA -->
    <script src="https://cdn.jsdelivr.net/gh/dazep01/raajs@3.1.0/engine/raa.min.js"></script>
    <style>
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; margin: 2em; background-color: #f4f4f4; }
        .todo-app { background-color: #fff; padding: 2em; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 400px; }
        .todo-app h1 { color: #333; text-align: center; margin-bottom: 1.5em; }
        .todo-app ul { list-style: none; padding: 0; }
        .todo-app li { background-color: #e9ecef; padding: 0.8em 1em; margin-bottom: 0.5em; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; }
        .todo-app li.completed { background-color: #d4edda; text-decoration: line-through; color: #555; }
        .todo-app button { background-color: #007bff; color: white; border: none; padding: 0.5em 1em; border-radius: 4px; cursor: pointer; font-size: 0.9em; transition: background-color 0.2s; }
        .todo-app button:hover { background-color: #0056b3; }
        .add-task-form { display: flex; margin-bottom: 1.5em; }
        .add-task-form input { flex-grow: 1; padding: 0.8em; border: 1px solid #ccc; border-radius: 4px; margin-right: 0.5em; }
    </style>
</head>
<body>
    <div raa-core:app="todoApp" class="todo-app">
        <h1>RaaJS Todo List</h1>

        <div class="add-task-form">
          <input type="text" raa-bind:model="newTaskTitle" placeholder="Tambahkan tugas baru...">
          <button raa-on:click="addTask()">Tambah</button>
        </div>
        
        <template raa-flow:if="todos.length > 0">
            <ul>
                <template raa-flow:for="todo in todos" raa-key="todo.id">
                    <li raa-bind:class="{ completed: todo.isComplete }">
                        <span raa-bind:text="todo.title"></span>
                        <button raa-on:click="toggleComplete(todo.id)">
                            <template raa-flow:if="todo.isComplete">
                                Batalkan
                            </template>
                            <template raa-flow:if="!todo.isComplete">
                                Selesai
                            </template>
                        </button>
                    </li>
                </template>
            </ul>
        </template>
        <template raa-flow:if="todos.length === 0">
            <p>Tidak ada tugas hari ini. Santai saja!</p>
        </template>
    </div>

    <script>
        RaaJS.define('todoApp', () => ({
            state: {
                todos: [
                    { id: 1, title: 'Belajar RaaJS Kontrol Alur', isComplete: false },
                    { id: 2, title: 'Menulis Dokumentasi', isComplete: true },
                    { id: 3, title: 'Mencoba Contoh Aplikasi', isComplete: false }
                ],
                newTaskTitle: ''
            },
            methods: {
                addTask() {
                    if (this.$state.newTaskTitle.trim() === '') return;
                    this.$state.todos.push({
                        id: Date.now(), // ID unik sederhana
                        title: this.$state.newTaskTitle,
                        isComplete: false
                    });
                    this.$state.newTaskTitle = ''; // Kosongkan input
                },
                toggleComplete(id) {
                    const todo = this.$state.todos.find(t => t.id === id);
                    if (todo) {
                        todo.isComplete = !todo.isComplete;
                    }
                }
            }
        }));
    </script>
</body>
</html>
```

---

## 3. Kontrol Penampilan (`raa-flow:show`)

Jika `raa-flow:if` adalah operasi bedah yang teliti, maka `raa-flow:show` adalah gerakan tangan yang gesit.

Direktif `raa-flow:show` digunakan untuk mengontrol visibilitas elemen dengan memanipulasi properti CSS `display`. Elemen akan selalu ada di DOM, tetapi visibilitasnya akan di-toggle.

Gunakan ini untuk elemen yang sering berganti status (tampil/sembunyi) secara cepat, seperti menu dropdown, tooltip, atau tab aktif.

> 💡 **Tips Pro**: *Karena elemennya tidak dihancurkan, perpindahan status tampil/sembunyi terasa jauh lebih instan bagi pengguna.*

### Sintaksis
`raa-flow:show` dapat digunakan langsung pada elemen HTML biasa.

```html
<div raa-flow:show="isLoading">Memuat data...</div>
<div raa-flow:show="!hasError">Data berhasil dimuat.</div>
```

### Perbedaan dengan `raa-flow:if`
| Fitur          | `raa-flow:if`                                  | `raa-flow:show`                               |
|----------------|------------------------------------------------|-----------------------------------------------|
| **Mekanisme**  | Menambahkan/Menghapus elemen dari DOM          | Mengubah properti CSS `display: none` / `display: (default)` |
| **Biaya Render**| Lebih tinggi saat beralih (membuat/menghapus DOM) | Lebih rendah saat beralih (hanya CSS)         |
| **Inisialisasi**| Elemen tidak dirender sama sekali jika kondisi `falsy` di awal | Elemen selalu dirender dan diinisialisasi di DOM, lalu disembunyikan jika kondisi `falsy` |
| **Kasus Penggunaan**| Konten yang jarang di-toggle, blok besar, atau ketika biaya *setup* tinggi saat inisialisasi awal. | Konten yang sering di-toggle (misalnya tab, modal, notifikasi) karena biaya beralihnya ringan. |
| **Elemen Target**| **Wajib `<template>`**                      | Dapat digunakan pada elemen HTML apapun      |

### Contoh: Menu Navigasi yang Dapat Di-toggle

```html
<div raa-core:app="menuApp">
  <button raa-on:click="toggleMenu()">
    <template raa-flow:if="isMenuOpen">
      Tutup Menu
    </template>
    <template raa-flow:if="!isMenuOpen">
      Buka Menu
    </template>
  </button>

  <nav raa-flow:show="isMenuOpen" class="main-menu">
    <ul>
      <li><a href="#">Beranda</a></li>
      <li><a href="#">Profil</a></li>
      <li><a href="#">Pengaturan</a></li>
    </ul>
  </nav>
</div>

<script>
  RaaJS.define('menuApp', () => ({
    state: {
      isMenuOpen: false
    },
    methods: {
      toggleMenu() {
        this.$state.isMenuOpen = !this.$state.isMenuOpen;
      }
    }
  }));
</script>
```

---

## 4. Best Practices & Pitfalls

1.  **Selalu gunakan `<template>` untuk `raa-flow:if` dan `raa-flow:for`**: Menggunakan direktif ini pada elemen HTML biasa **tidak akan bekerja**.
2.  **Gunakan `raa-key` pada setiap `raa-flow:for`**: Ini sangat penting untuk optimasi performa dan stabilitas *state* elemen dalam daftar.
3.  **Pilih `raa-flow:show` untuk elemen yang sering di-toggle**: Untuk performa terbaik, gunakan `raa-flow:show` daripada `raa-flow:if` ketika elemen sering berganti visibilitas.
4.  **Hindari panggilan fungsi di dalam template ekspresi**: Logika kompleks harus berada di `methods` atau *computed properties* (dengan ekstensi `raa-computed-watch.min.js`) untuk menjaga performa.
5.  **Perhatikan Urutan Pemuatan Script**: Selalu muat `raa.min.js` terlebih dahulu, diikuti oleh ekstensi yang dibutuhkan.

---

## 🎭 Harmoni dalam Kontrol Alur
Dengan hadirnya raa-flow:for, lengkaplah instrumen kita dalam mengatur irama aplikasi:

*   `raa-flow:if`: Digunakan saat kita ingin menghemat memori dengan benar-benar melenyapkan elemen yang tidak diperlukan (seperti menghancurkan panggung saat konser usai).
*   `raa-flow:show`: Digunakan untuk interaksi yang cepat dan berulang (seperti menutup tirai namun panggung tetap siap di belakangnya).
*   `raa-flow:for`: Digunakan untuk merayakan kuantitas data dengan efisiensi yang presisi melalui identitas yang jelas (raa-key).

---

> Dokumentasi ini adalah bagian dari RaaJS v3.1.0 Official Docs. Kontribusi, koreksi, dan ide perbaikan disambut hangat di repositori resmi. Mari bersama bangun ekosistem yang lebih baik! 🔥

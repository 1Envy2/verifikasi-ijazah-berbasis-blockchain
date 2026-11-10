# Sistem Validasi Ijazah Berbasis Blockchain (Hyperledger Besu) - Studi Kasus Unila

Dokumen ini adalah **Cetak Biru (Blueprint)** teknis proyek. Segala pengembangan antarmuka (DApp), *backend*, dan *smart contract* harus berpedoman pada aturan di bawah ini.

## 1. Arsitektur Jaringan (Infrastruktur)
*   **Platform:** Hyperledger Besu (Private/Consortium Blockchain).
*   **Konsensus:** Proof of Authority (QBFT).
*   **Node Validator:** Menggunakan **5 Node** mesin/server (Rektorat, BAK, MIPA, Pertanian, UPT TIK).

## 2. Portal Admin Internal (Approval Workflow & Batch Excel)
Sistem ini menggunakan alur persetujuan berjenjang (*Off-chain* ke *On-chain*). Staf **tidak menggunakan dompet kripto (MetaMask)**. Login menggunakan NIP/Email standar.

*   **Tahap 1: BAK (Maker)**
    *   Membuat **Batch Periode Wisuda** (misal: "Wisuda Periode II Tahun 2026").
    *   Mengunduh template spreadsheet Excel resmi (.xlsx).
    *   Mengunggah file Excel berisi ratusan/ribuan data lulusan (Nomor Ijazah, Nama, NPM, Fakultas).
    *   Sistem mem-parsing dan menampilkan pratinjau data di browser.
    *   Menyimpan data massal ke basis data PostgreSQL dengan status awal: **Menunggu Tanda Tangan Dekan**.
*   **Tahap 2: Dekanat (Checker)**
    *   Memilih Periode Wisuda.
    *   Melihat daftar draf mahasiswa.
    *   Memberikan persetujuan: bisa secara **satuan** (per mahasiswa) atau secara **massal** (*Select All / Bulk Approve*).
    *   *Status Database:* **Menunggu Tanda Tangan Rektor**.
*   **Tahap 3: Rektorat (Signer & Eksekutor Blockchain)**
    *   Memilih Periode Wisuda.
    *   Menentukan **Mode Eksekusi Blockchain**:
        1. **Mode Batch Transaction:** Mengemas seluruh ijazah ke dalam 1 transaksi via `tambahIjazahBatch` (efisien, cepat, hemat block space).
        2. **Mode Concurrent Stress Test:** Mengirim transaksi perorangan secara serentak untuk menguji batas throughput TPS dan response time jaringan Besu.
    *   Klik **"Tandatangani & Terbitkan"** (satuan atau massal).
    *   **EKSEKUSI BLOCKCHAIN TERJADI DI SINI.**

## 3. Eksekusi Blockchain (Backend Signing)
*   Setelah Rektor klik "Terbitkan", **Server Backend (Node.js/Next.js)** mengambil alih.
*   Server mengambil *Private Key Institusi* yang tersimpan rahasia di file `.env`.
*   Server menandatangani transaksi secara otomatis dan mengirimkannya ke jaringan 5 Node Besu.
*   Menghasilkan metrik benchmarking (waktu eksekusi, TPS, nomor blok, gas used, dan hash transaksi) yang dicatat ke database.

## 4. Smart Contract (Solidity - IjazahRegistry.sol)
*   **Primary Key (Pencarian):** Menggunakan `Nomor Ijazah`.
*   **Data yang disimpan di ledger:** 
    *   `nama`, `npm`, `fakultas`
    *   `isValid` (Status keabsahan ijazah)
    *   `isRegistered` (Penanda registrasi)
*   **Fungsi Utama:**
    *   `tambahIjazah()`: Menerbitkan ijazah satuan.
    *   `tambahIjazahBatch()`: Menerbitkan ijazah dalam jumlah banyak sekaligus dalam 1 transaksi.
    *   `cekIjazah()`: Fungsi verifikasi publik (read-only, gas fee 0).
    *   `cabutIjazah()`: Mencabut validitas ijazah jika terjadi pembatalan kelulusan.
*   **Penting:** Tidak ada data sensitif (NIK, Alamat) yang disimpan ke dalam *blockchain*.

## 5. Portal Validasi Publik (HRD / Pengecek)
Portal terbuka tanpa *login*, tanpa biaya *gas*, beroperasi 100% online berbasis teks:
*   **Input:** Nomor Ijazah (dilengkapi input opsional Nama & NPM untuk pencocokan ganda).
*   **Proses:** Sistem web secara langsung membaca data dari smart contract di jaringan Hyperledger Besu melalui RPC node read-only.
*   **Hasil Verifikasi:**
    *   **VALID / ASLI:** Data cocok dan terverifikasi sah tercatat di ledger blockchain institusi Unila.
    *   **TIDAK DITEMUKAN:** Nomor ijazah tidak terdaftar di jaringan blockchain.
    *   **TIDAK COCOK:** Nomor terdaftar tetapi Nama/NPM yang dimasukkan tidak cocok dengan ledger.
    *   **DICABUT:** Ijazah pernah diterbitkan tetapi telah resmi dicabut oleh Universitas (`isValid = false`).

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------





    Berdasarkan cetak biru arsitektur tiga lapisan yang telah kita susun pada Sub-bab 3.6.1, pembagian tugas untuk *AI Agent* (seperti Cursor, Claude, atau ChatGPT) memang paling efektif dibagi menjadi 3 poin/tahapan. Hal ini sejalan dengan metode *Agile Scrum* dan *vertical slicing* yang Anda gunakan.

Berikut adalah format *prompt* (instruksi) yang bisa Anda salin dan tempelkan secara bertahap kepada *AI Agent*.

---

### Poin 1: *Prompt* untuk Infrastruktur Blockchain & Smart Contract

*(Gunakan prompt ini pertama kali untuk membuat folder `blockchain-besu`)*

> **Peran Anda:** Senior Blockchain Engineer.
> **Tugas:** Bangun infrastruktur jaringan *private blockchain* lokal menggunakan Hyperledger Besu dan buatkan *Smart Contract* Solidity untuk sistem validasi ijazah.
> 
> 
> **Spesifikasi Jaringan (Hyperledger Besu):**
> * Gunakan Docker dan `docker-compose.yml` untuk menjalankan jaringan terisolasi.
> 
> 
> * Konfigurasi konsensus menggunakan algoritma *Proof of Authority* (QBFT).
> 
> 
> * Buat topologi untuk 5 *node validator* utama: Rektorat, BAK, FakultasMIPA, FakultasPertanian, dan UPT_TIK.
> 
> 
> * Pada file `genesis.json`, atur parameter *block period* selama 2 detik dan *request timeout* selama 10 detik, serta daftarkan kelima alamat *node* tersebut ke dalam *whitelist*.
> 
> 
> 
> 
> **Spesifikasi Smart Contract (Solidity via Hardhat):**
> * Inisialisasi proyek menggunakan *framework* Hardhat.
> 
> 
> * Buat *smart contract* yang menggunakan **Nomor Ijazah** sebagai kunci pencarian utama (*Primary Key*) melalui struktur `mapping`.
> 
> 
> * Atribut publik yang disimpan di *ledger* meliputi: Nama, NPM, Fakultas, `hashDokumen` (nilai *hash* dari PDF asli), dan `isValid` (status validasi).
> 
> 
> * Jangan menyimpan data sensitif seperti NIK atau Alamat.
> 
> 
> * Sediakan 3 fungsi utama: `tambahIjazah()` (hanya bisa dipanggil oleh alamat *Backend Server*), `cekIjazah()` (fungsi *read-only* untuk verifikasi), dan `cabutIjazah()` (mengubah status `isValid` menjadi *false*).
> 
> 
> 
> 

---

### Poin 2: *Prompt* untuk Backend Server & Basis Data Off-chain

*(Gunakan prompt ini setelah jaringan Besu menyala dan contract ter-deploy)*

> **Peran Anda:** Backend Node.js & Web3 Developer.
> **Tugas:** Bangun *Application Layer* menggunakan Node.js yang terintegrasi dengan basis data PostgreSQL (penyimpanan *off-chain*) dan bertindak sebagai jembatan ke jaringan Hyperledger Besu.
> 
> 
> **Spesifikasi Alur Basis Data (PostgreSQL):**
> * Buat skema tabel untuk mengelola draf data ijazah selama masa persetujuan.
> 
> 
> * Data harus memiliki pelacakan status berjenjang: mulai dari "Menunggu Tanda Tangan Dekan" (setelah diinput BAK), lalu "Menunggu Tanda Tangan Rektor" (setelah disetujui Dekanat), hingga "Diterbitkan".
> 
> 
> 
> 
> **Spesifikasi Eksekusi Web3 (Backend Signing):**
> * Implementasikan mekanisme *Backend Signing* menggunakan *library* `ethers.js`.
> 
> 
> * Simpan *Private Key Institusi* secara aman di dalam *environment variable* (`.env`).
> 
> 
> * Buat *API endpoint* di mana sesaat setelah Rektorat mengirimkan status persetujuan akhir ("Setujui & Terbitkan"), server secara otomatis menandatangani transaksi digital dan mengirimkan data tersebut ke *Smart Contract* di jaringan Besu.
> 
> 

---

### Poin 3: *Prompt* untuk Frontend DApp (Portal Web)

*(Gunakan prompt ini terakhir untuk membangun antarmuka web di folder `frontend-dapp`)*

> **Peran Anda:** Frontend Web3 Developer.
> **Tugas:** Bangun *Presentation Layer* menggunakan *framework* Next.js (App Router) dan TailwindCSS yang terdiri dari dua portal terpisah.
> 
> 
> **Spesifikasi Portal Internal Kampus:**
> * Buat sistem *login* konvensional menggunakan otentikasi NIP/Email (Web2 standar).
> 
> 
> * Aktor/staf **TIDAK BOLEH** dipaksa menggunakan ekstensi dompet kripto (seperti MetaMask).
> 
> 
> * Buat 3 Dasbor peran:
> 1. **BAK (Maker):** Form untuk input draf data teks (No Ijazah, Nama, NPM, Fakultas) dan unggah file PDF.
> 2. **Dekanat (Checker 1):** Tabel peninjauan draf dan tombol "Setujui".
> 3. **Rektorat (Signer):** Tabel persetujuan akhir dan tombol "Setujui & Terbitkan" (yang akan memicu API *Backend Signing*).
> 
> 
> 
> 
> **Spesifikasi Portal Verifikasi Publik (Verifikator/HRD):**
> * Halaman publik yang bisa diakses tanpa *login* dan tanpa *gas fee*.
> 
> 
> * Sediakan dua mode validasi hibrida: Pencarian Teks (menggunakan input Nomor Ijazah) dan Pencocokan Dokumen (dengan mengunggah file PDF).
> * Untuk mode unggah dokumen, gunakan *library* `crypto-js` atau `js-sha256` untuk mengekstrak nilai komputasi *hash* dari file PDF murni di memori lokal peramban klien (*client-side hashing*).
> 
> 
> * File PDF tidak boleh dikirim ke server backend.
> 
> 
> * **Sistem ini DILARANG menggunakan teknologi Optical Character Recognition (OCR).** Validasi murni menggunakan pencocokan matematis nilai *hash*.
> 
> 
> * Tampilkan hasil status akhir: "Valid/Asli", "Tidak Valid/Palsu", atau "Dicabut" berdasarkan respons *Smart Contract*.
> 
>

----------------------------------------------------------------------------------------------------------------------------------------------------------

Peran Anda: Frontend & Web3 Developer.
Tugas: Bangun Decentralized Application (DApp) publik menggunakan Next.js (App Router) dan TailwindCSS untuk verifikasi ijazah. Aplikasi ini hanya berfungsi untuk Membaca (Read-Only) data dari smart contract di jaringan Hyperledger Besu.

Spesifikasi Arsitektur Sistem:

Tidak Ada Login & Tidak Ada Database: Aplikasi ini terbuka untuk publik (HRD/Verifikator) tanpa perlu registrasi, tanpa database tradisional, dan tanpa biaya gas/fee.

Koneksi Blockchain (Read-Only): Gunakan ethers.js untuk terhubung ke RPC Hyperledger Besu. Aplikasi ini TIDAK memerlukan Private Key atau penandatanganan transaksi. Cukup panggil fungsi cekIjazah(nomorIjazah) dari smart contract untuk mendapatkan data.

Spesifikasi Antarmuka (Validasi Hibrida):
Buat satu halaman utama dengan dua mode pengecekan (Tab):

Mode 1 (Validasi Teks): Form input untuk Nomor Ijazah, Nama, dan NPM. Saat disubmit, sistem memanggil smart contract berdasarkan Nomor Ijazah. Jika ada, cocokkan Nama dan NPM dengan respons blockchain.

Mode 2 (Validasi Dokumen): Form untuk mengunggah file PDF Ijazah.

ATURAN MUTLAK: Gunakan library crypto-js atau js-sha256 untuk mengekstrak nilai hash (SHA-256 atau Keccak256) dari file PDF tersebut murni di sisi klien (browser/client-side).

File PDF tidak boleh dikirim ke API/Server.

DILARANG menggunakan teknologi OCR (Optical Character Recognition).

Nilai hash yang didapat dari peramban dicocokkan dengan hashDokumen yang ada di blockchain (berdasarkan Nomor Ijazah).

Output Status yang Ditampilkan di Layar:

✅ VALID / ASLI (Jika data/hash cocok dan status isValid == true).

❌ TIDAK VALID / PALSU (Jika Nomor Ijazah tidak ditemukan atau hash PDF berbeda).

🚫 DICABUT REKTORAT (Jika data ditemukan, tapi status isValid == false).
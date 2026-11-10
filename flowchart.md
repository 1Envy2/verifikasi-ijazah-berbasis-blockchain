# Alur Sistem Verifikasi Ijazah Digital Berbasis Blockchain (Revisi Batch Excel & Multi-Tier Approval)

```mermaid
flowchart TD
    %% Lapisan 1: BAK (Maker)
    subgraph LayerBAK [1. Aktor: Staf BAK (Maker)]
        B1([Mulai]) --> B2[Buat Periode / Batch Wisuda]
        B2 --> B3[Unduh Template Excel .xlsx]
        B3 --> B4[Unggah File Excel Berisi Daftar Lulusan]
        B4 --> B5[Browser Parsing Data & Pratinjau Tabel]
        B5 --> B6[Tekan Tombol 'Simpan Semua Data']
    end

    %% Database Off-chain
    subgraph DBOffChain [Basis Data Off-chain: PostgreSQL]
        DB1[(Simpan Data Draf Lulusan<br/>Status: MENUNGGU_DEKAN)]
        DB2[(Pembaruan Status Draf<br/>Status: MENUNGGU_REKTOR)]
        DB3[(Pembaruan Status Final<br/>Status: DITERBITKAN + TX Hash)]
    end

    B6 --> DB1

    %% Lapisan 2: Dekanat (Checker)
    subgraph LayerDekanat [2. Aktor: Dekanat (Checker)]
        D1[Pilih Periode Wisuda] --> D2{Metode Persetujuan}
        D2 -->|Satuan| D3[Klik Setujui per baris mahasiswa]
        D2 -->|Massal| D4[Pilih Semua draf & Klik 'Setujui Terpilih']
        D3 --> DB2
        D4 --> DB2
    end

    DB1 -.-> D1

    %% Lapisan 3: Rektorat (Signer)
    subgraph LayerRektorat [3. Aktor: Rektorat (Signer & Eksekutor)]
        R1[Pilih Periode Wisuda] --> R2{Pilih Mode Eksekusi}
        R2 -->|Mode Batch| R3[Kemas dalam 1 Transaksi Smart Contract<br/>tambahIjazahBatch]
        R2 -->|Mode Stress Test| R4[Kirim N Transaksi Individual Serentak<br/>Uji Throughput & TPS Besu]
        R3 --> R5[Backend Signing via Private Key Institusi]
        R4 --> R5
    end

    DB2 -.-> R1

    %% Lapisan 4: Blockchain (Ledger)
    subgraph LayerBlockchain [4. Jaringan Konsorsium: Hyperledger Besu (QBFT)]
        BC1[(5 Node Validator:<br/>Rektorat, BAK, MIPA, Pertanian, TIK)]
        BC2[Smart Contract: IjazahRegistry.sol]
    end

    R5 -->|Kirim Transaksi On-chain| BC2
    BC2 --> BC1
    BC1 -->|Konfirmasi Block & TX Receipt| DB3

    %% Lapisan 5: Publik (Verifikator)
    subgraph LayerPublik [5. Publik / HRD / Perusahaan]
        P1[Buka Portal Verifikasi Publik] --> P2[Input Nomor Ijazah]
        P2 --> P3[Panggil cekIjazah - Read Only 0 Gas]
        P3 -.-> BC2
        BC2 -.->|Hasil Verifikasi| P4{Status Ijazah}
        P4 -->|Valid| P5[Tampilkan: SAH & ASLI - Lulusan Unila]
        P4 -->|Tidak Ditemukan| P6[Tampilkan: Nomor Ijazah Tidak Terdaftar]
        P4 -->|Dicabut| P7[Tampilkan: Ijazah Telah Dicabut Rektorat]
    end
```

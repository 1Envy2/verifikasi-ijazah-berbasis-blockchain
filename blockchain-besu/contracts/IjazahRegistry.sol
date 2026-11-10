// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract IjazahRegistry {
    address public backendServer;

    struct Ijazah {
        string nama;
        string npm;
        string fakultas;
        bool isValid;
        bool isRegistered;
    }

    // Struct input untuk fungsi batch (tanpa field boolean)
    struct InputIjazah {
        string nomorIjazah;
        string nama;
        string npm;
        string fakultas;
    }

    // Mapping menggunakan Nomor Ijazah sebagai Primary Key
    mapping(string => Ijazah) private ijazahs;

    // Event untuk pencatatan log transaksi
    event IjazahDitambahkan(string nomorIjazah, string nama, string npm, string fakultas);
    event IjazahDicabut(string nomorIjazah);
    event BatchIjazahDitambahkan(uint256 jumlahBerhasil, uint256 jumlahDigagalkan);

    modifier onlyBackend() {
        require(msg.sender == backendServer, "Hanya backend server yang dapat memanggil fungsi ini");
        _;
    }

    constructor() {
        // Alamat pembuat kontrak di-set sebagai backendServer
        backendServer = msg.sender;
    }

    // ============================================================
    // Fungsi tambahIjazah: Menambahkan 1 data ijazah (satuan)
    // ============================================================
    function tambahIjazah(
        string memory _nomorIjazah,
        string memory _nama,
        string memory _npm,
        string memory _fakultas
    ) public onlyBackend {
        require(!ijazahs[_nomorIjazah].isRegistered, "Ijazah sudah terdaftar");

        ijazahs[_nomorIjazah] = Ijazah({
            nama: _nama,
            npm: _npm,
            fakultas: _fakultas,
            isValid: true,
            isRegistered: true
        });

        emit IjazahDitambahkan(_nomorIjazah, _nama, _npm, _fakultas);
    }

    // ============================================================
    // Fungsi tambahIjazahBatch: Menambahkan banyak data sekaligus
    // dalam 1 transaksi blockchain (untuk pengujian throughput)
    // ============================================================
    function tambahIjazahBatch(
        InputIjazah[] memory _dataList
    ) public onlyBackend returns (uint256 berhasil, uint256 gagal) {
        berhasil = 0;
        gagal = 0;

        for (uint256 i = 0; i < _dataList.length; i++) {
            // Skip jika nomor ijazah sudah terdaftar (tidak revert, agar batch tetap lanjut)
            if (ijazahs[_dataList[i].nomorIjazah].isRegistered) {
                gagal++;
                continue;
            }

            ijazahs[_dataList[i].nomorIjazah] = Ijazah({
                nama: _dataList[i].nama,
                npm: _dataList[i].npm,
                fakultas: _dataList[i].fakultas,
                isValid: true,
                isRegistered: true
            });

            emit IjazahDitambahkan(
                _dataList[i].nomorIjazah,
                _dataList[i].nama,
                _dataList[i].npm,
                _dataList[i].fakultas
            );

            berhasil++;
        }

        emit BatchIjazahDitambahkan(berhasil, gagal);
    }

    // ============================================================
    // Fungsi cekIjazah: Verifikasi read-only publik
    // ============================================================
    function cekIjazah(string memory _nomorIjazah) public view returns (
        string memory nama,
        string memory npm,
        string memory fakultas,
        bool isValid
    ) {
        require(ijazahs[_nomorIjazah].isRegistered, "Ijazah tidak ditemukan");

        Ijazah memory ij = ijazahs[_nomorIjazah];
        return (ij.nama, ij.npm, ij.fakultas, ij.isValid);
    }

    // ============================================================
    // Fungsi cabutIjazah: Mengubah status isValid menjadi false
    // ============================================================
    function cabutIjazah(string memory _nomorIjazah) public onlyBackend {
        require(ijazahs[_nomorIjazah].isRegistered, "Ijazah tidak ditemukan");
        require(ijazahs[_nomorIjazah].isValid, "Ijazah sudah dicabut");

        ijazahs[_nomorIjazah].isValid = false;

        emit IjazahDicabut(_nomorIjazah);
    }
}

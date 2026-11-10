import { ethers } from 'ethers';

// ABI untuk memanggil fungsi pada Smart Contract IjazahRegistry
const contractABI = [
  // Fungsi tulis (memerlukan Signer/Wallet)
  "function tambahIjazah(string memory _nomorIjazah, string memory _nama, string memory _npm, string memory _fakultas) public",
  "function tambahIjazahBatch(tuple(string nomorIjazah, string nama, string npm, string fakultas)[] memory _dataList) public returns (uint256 berhasil, uint256 gagal)",
  "function cabutIjazah(string memory _nomorIjazah) public",

  // Fungsi baca (read-only, tanpa gas)
  "function cekIjazah(string memory _nomorIjazah) public view returns (string nama, string npm, string fakultas, bool isValid)",

  // Event
  "event IjazahDitambahkan(string nomorIjazah, string nama, string npm, string fakultas)",
  "event IjazahDicabut(string nomorIjazah)",
  "event BatchIjazahDitambahkan(uint256 jumlahBerhasil, uint256 jumlahDigagalkan)"
];

// 1. Inisialisasi Provider (Koneksi ke RPC Node Rektorat Besu)
const provider = new ethers.JsonRpcProvider(process.env.BESU_RPC_URL);

// 2. Inisialisasi Wallet (Signer) menggunakan Private Key Institusi yang aman di .env
const wallet = new ethers.Wallet(process.env.INSTITUTION_PRIVATE_KEY || "", provider);

// 3. Inisialisasi Instance Smart Contract
const contract = new ethers.Contract(
  process.env.SMART_CONTRACT_ADDRESS || "",
  contractABI,
  wallet
);

export { provider, wallet, contract, contractABI };

import { ethers } from 'ethers';

// ABI minimal read-only untuk fungsi cekIjazah (tanpa hashDokumen)
const contractABI = [
  "function cekIjazah(string memory _nomorIjazah) public view returns (string nama, string npm, string fakultas, bool isValid)"
];

const BESU_RPC_URL = process.env.NEXT_PUBLIC_BESU_RPC_URL || "http://127.0.0.1:8545";
const SMART_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SMART_CONTRACT_ADDRESS || "0x...";

export const getContract = () => {
  const provider = new ethers.JsonRpcProvider(BESU_RPC_URL);
  return new ethers.Contract(SMART_CONTRACT_ADDRESS, contractABI, provider);
};

const hre = require("hardhat");

async function main() {
  console.log("Memulai proses deployment IjazahRegistry ke Hyperledger Besu...");

  const IjazahRegistry = await hre.ethers.getContractFactory("IjazahRegistry");
  const contract = await IjazahRegistry.deploy();

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("=============================================================");
  console.log("✅ Smart Contract IjazahRegistry BERHASIL DIDEPLOY!");
  console.log("📌 Alamat Kontrak:", address);
  console.log("=============================================================");
  console.log("Langkah selanjutnya: Salin alamat kontrak di atas ke:");
  console.log("1. frontend-internal/.env      -> SMART_CONTRACT_ADDRESS=" + address);
  console.log("2. frontend-publik/.env.local  -> NEXT_PUBLIC_SMART_CONTRACT_ADDRESS=" + address);
}

main().catch((error) => {
  console.error("Gagal deploy:", error);
  process.exitCode = 1;
});


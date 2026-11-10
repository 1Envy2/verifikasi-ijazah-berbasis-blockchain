Write-Host "Inisialisasi Jaringan Besu..."

# 1. Jalankan Besu Config Generator
Write-Host "1. Membuat konfigurasi genesis dan keys menggunakan Docker..."
docker run --rm -v "$((Get-Location).Path)\networkFiles:/networkFiles" hyperledger/besu:latest operator generate-blockchain-config --config-file=/networkFiles/ibftConfigFile.json --to=/networkFiles/output --private-key-file-name=key

# 2. Pindahkan dan ganti nama folder keys
Write-Host "2. Menyiapkan direktori keys untuk masing-masing node..."
$nodes = @("rektorat", "bak", "fakultas_mipa", "fakultas_pertanian", "upt_tik")
$keysDir = "$((Get-Location).Path)\networkFiles\output\keys"
$targetKeysDir = "$((Get-Location).Path)\keys"

New-Item -ItemType Directory -Force -Path $targetKeysDir | Out-Null

$i = 0
Get-ChildItem -Path $keysDir -Directory | ForEach-Object {
    if ($i -lt 5) {
        $nodeName = $nodes[$i]
        $nodeDir = Join-Path $targetKeysDir $nodeName
        New-Item -ItemType Directory -Force -Path $nodeDir | Out-Null
        Move-Item -Path "$($_.FullName)\key" -Destination $nodeDir -Force
        Move-Item -Path "$($_.FullName)\key.pub" -Destination $nodeDir -Force
        $i++
    }
}

# 3. Ambil public key rektorat untuk bootnode
Write-Host "3. Konfigurasi Bootnode (Rektorat)..."
$rektoratPubKey = Get-Content -Path (Join-Path $targetKeysDir "rektorat\key.pub")
$rektoratPubKey = $rektoratPubKey.Substring(2) # Menghapus '0x' pada awalan

# 4. Generate docker-compose.yml
Write-Host "4. Membuat docker-compose.yml..."
$dockerCompose = @"
version: '3.8'

networks:
  besu_network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.16.239.0/24

x-besu-node: &besu-node
  image: hyperledger/besu:latest
  networks:
    - besu_network
  command:
    - --network-id=1337
    - --genesis-file=/networkFiles/output/genesis.json
    - --data-path=/opt/besu/data
    - --rpc-http-enabled=true
    - --rpc-http-api=ETH,NET,QBFT,WEB3
    - --rpc-http-cors-origins=all
    - --host-allowlist=*

services:
  rektorat:
    <<: *besu-node
    container_name: rektorat
    networks:
      besu_network:
        ipv4_address: 172.16.239.11
    volumes:
      - ./networkFiles:/networkFiles
      - ./data/rektorat:/opt/besu/data
      - ./keys/rektorat:/opt/besu/keys
    command:
      - --node-private-key-file=/opt/besu/keys/key
      - --genesis-file=/networkFiles/output/genesis.json
      - --rpc-http-port=8545
      - --p2p-port=30301
    ports:
      - `"8545:8545`"
      - `"30301:30301`"

  bak:
    <<: *besu-node
    container_name: bak
    depends_on:
      - rektorat
    volumes:
      - ./networkFiles:/networkFiles
      - ./data/bak:/opt/besu/data
      - ./keys/bak:/opt/besu/keys
    command:
      - --node-private-key-file=/opt/besu/keys/key
      - --genesis-file=/networkFiles/output/genesis.json
      - --rpc-http-port=8546
      - --p2p-port=30302
      - --bootnodes=enode://$rektoratPubKey@172.16.239.11:30301
    ports:
      - `"8546:8545`"
      - `"30302:30301`"

  fakultas_mipa:
    <<: *besu-node
    container_name: fakultas_mipa
    depends_on:
      - rektorat
    volumes:
      - ./networkFiles:/networkFiles
      - ./data/fakultas_mipa:/opt/besu/data
      - ./keys/fakultas_mipa:/opt/besu/keys
    command:
      - --node-private-key-file=/opt/besu/keys/key
      - --genesis-file=/networkFiles/output/genesis.json
      - --rpc-http-port=8547
      - --p2p-port=30303
      - --bootnodes=enode://$rektoratPubKey@172.16.239.11:30301
    ports:
      - `"8547:8545`"
      - `"30303:30301`"

  fakultas_pertanian:
    <<: *besu-node
    container_name: fakultas_pertanian
    depends_on:
      - rektorat
    volumes:
      - ./networkFiles:/networkFiles
      - ./data/fakultas_pertanian:/opt/besu/data
      - ./keys/fakultas_pertanian:/opt/besu/keys
    command:
      - --node-private-key-file=/opt/besu/keys/key
      - --genesis-file=/networkFiles/output/genesis.json
      - --rpc-http-port=8548
      - --p2p-port=30304
      - --bootnodes=enode://$rektoratPubKey@172.16.239.11:30301
    ports:
      - `"8548:8545`"
      - `"30304:30301`"

  upt_tik:
    <<: *besu-node
    container_name: upt_tik
    depends_on:
      - rektorat
    volumes:
      - ./networkFiles:/networkFiles
      - ./data/upt_tik:/opt/besu/data
      - ./keys/upt_tik:/opt/besu/keys
    command:
      - --node-private-key-file=/opt/besu/keys/key
      - --genesis-file=/networkFiles/output/genesis.json
      - --rpc-http-port=8549
      - --p2p-port=30305
      - --bootnodes=enode://$rektoratPubKey@172.16.239.11:30301
    ports:
      - `"8549:8545`"
      - `"30305:30301`"
"@

Set-Content -Path "$((Get-Location).Path)\docker-compose.yml" -Value $dockerCompose
Write-Host "Setup selesai! docker-compose.yml berhasil dibuat."
Write-Host "Jalankan 'docker-compose up -d' untuk memulai jaringan Besu 5 Node."

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { contract } from '@/lib/web3';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ids, batchId, mode = 'batch' } = body;

    const where: any = { status: 'MENUNGGU_REKTOR' };

    if (Array.isArray(ids) && ids.length > 0) {
      where.id = { in: ids };
    } else if (batchId) {
      where.batchId = batchId;
    } else {
      return NextResponse.json(
        { success: false, error: "Harap tentukan daftar ID draf (ids) atau ID periode (batchId)" },
        { status: 400 }
      );
    }

    // Ambil data draft yang siap diterbitkan
    const drafts = await prisma.draftIjazah.findMany({ where });

    if (drafts.length === 0) {
      return NextResponse.json(
        { success: false, error: "Tidak ada draf yang berstatus MENUNGGU_REKTOR untuk diproses" },
        { status: 400 }
      );
    }

    // ====================================================================
    // SKENARIO 1: MODE BATCH TRANSACTION (1 Transaksi Massal di Smart Contract)
    // ====================================================================
    if (mode === 'batch') {
      const inputList = drafts.map(d => ({
        nomorIjazah: d.nomorIjazah,
        nama: d.nama,
        npm: d.npm,
        fakultas: d.fakultas,
      }));

      const startTime = Date.now();

      // Panggil fungsi tambahIjazahBatch di Smart Contract
      const tx = await contract.tambahIjazahBatch(inputList);
      const receipt = await tx.wait();

      const endTime = Date.now();
      const durationMs = endTime - startTime;

      // Update semua draf terpilih ke status DITERBITKAN dengan txHash yang sama
      await prisma.draftIjazah.updateMany({
        where: { id: { in: drafts.map(d => d.id) } },
        data: {
          status: 'DITERBITKAN',
          txHash: receipt.hash,
        }
      });

      return NextResponse.json({
        success: true,
        mode: 'batch',
        message: `Berhasil menerbitkan ${drafts.length} ijazah ke Blockchain Besu dalam 1 transaksi batch!`,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : null,
        count: drafts.length,
        durationMs,
        durationSec: (durationMs / 1000).toFixed(2),
      }, { status: 200 });
    }

    // ====================================================================
    // SKENARIO 2: MODE INDIVIDUAL / CONCURRENT (Stress Testing TPS Blockchain)
    // ====================================================================
    const startTime = Date.now();
    let successCount = 0;
    const individualTxs: Array<{ id: string; nomorIjazah: string; txHash?: string; error?: string }> = [];

    for (const d of drafts) {
      try {
        const tx = await contract.tambahIjazah(d.nomorIjazah, d.nama, d.npm, d.fakultas);
        const receipt = await tx.wait();

        await prisma.draftIjazah.update({
          where: { id: d.id },
          data: {
            status: 'DITERBITKAN',
            txHash: receipt.hash,
          }
        });

        individualTxs.push({
          id: d.id,
          nomorIjazah: d.nomorIjazah,
          txHash: receipt.hash,
        });
        successCount++;
      } catch (err: any) {
        individualTxs.push({
          id: d.id,
          nomorIjazah: d.nomorIjazah,
          error: err.message || "Gagal menerbitkan",
        });
      }
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const durationSec = durationMs / 1000;
    const tps = durationSec > 0 ? (successCount / durationSec).toFixed(2) : "0";

    return NextResponse.json({
      success: true,
      mode: 'individual',
      message: `Selesai stress test: ${successCount} dari ${drafts.length} ijazah berhasil diterbitkan individual.`,
      count: successCount,
      totalRequested: drafts.length,
      durationMs,
      durationSec: durationSec.toFixed(2),
      tps, // Throughput Transactions Per Second
      details: individualTxs,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Gagal melakukan bulk approve Rektorat:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


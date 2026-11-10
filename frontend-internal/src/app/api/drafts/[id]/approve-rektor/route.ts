import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { contract } from '@/lib/web3';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    // 1. Ambil data draft dari Database Off-chain (PostgreSQL)
    const draft = await prisma.draftIjazah.findUnique({ where: { id } });
    
    if (!draft) {
      return NextResponse.json({ success: false, error: "Draft tidak ditemukan" }, { status: 404 });
    }
    if (draft.status !== 'MENUNGGU_REKTOR') {
      return NextResponse.json({ success: false, error: "Status draf belum disetujui Dekan atau sudah diterbitkan" }, { status: 400 });
    }

    // 2. Eksekusi Blockchain (Backend Signing Otomatis)
    // Server menandatangani transaksi secara otomatis dengan private key institusi di .env
    const tx = await contract.tambahIjazah(
      draft.nomorIjazah,
      draft.nama,
      draft.npm,
      draft.fakultas
    );
    
    // Tunggu transaksi diverifikasi dan ditambang ke dalam block jaringan Besu (QBFT)
    const receipt = await tx.wait();

    // 3. Update Status di Database menjadi "DITERBITKAN" dan catat txHash
    const updated = await prisma.draftIjazah.update({
      where: { id },
      data: {
        status: 'DITERBITKAN',
        txHash: receipt.hash,
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Ijazah berhasil diterbitkan ke Blockchain Besu secara individual",
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      data: updated 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Gagal melakukan Backend Signing:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

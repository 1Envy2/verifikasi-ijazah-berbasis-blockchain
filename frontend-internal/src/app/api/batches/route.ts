import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// POST: Membuat Batch Wisuda baru
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { namaPeriode, tanggalWisuda, keterangan } = body;

    const batch = await prisma.batchWisuda.create({
      data: {
        namaPeriode,
        tanggalWisuda: new Date(tanggalWisuda),
        keterangan: keterangan || null,
      }
    });

    return NextResponse.json({ success: true, data: batch }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET: Mengambil semua Batch Wisuda beserta jumlah draf
export async function GET() {
  try {
    const batches = await prisma.batchWisuda.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { drafts: true }
        },
        drafts: {
          select: { status: true }
        }
      }
    });

    // Hitung ringkasan status per batch
    const result = batches.map(batch => {
      const statusCount = {
        MENUNGGU_DEKAN: 0,
        MENUNGGU_REKTOR: 0,
        DITERBITKAN: 0,
      };
      batch.drafts.forEach(d => {
        statusCount[d.status]++;
      });

      return {
        id: batch.id,
        namaPeriode: batch.namaPeriode,
        tanggalWisuda: batch.tanggalWisuda,
        keterangan: batch.keterangan,
        createdAt: batch.createdAt,
        totalDrafts: batch._count.drafts,
        statusCount,
      };
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


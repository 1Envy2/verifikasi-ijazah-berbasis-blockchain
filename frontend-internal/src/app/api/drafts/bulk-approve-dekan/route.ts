import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ids, batchId } = body;

    const where: any = { status: 'MENUNGGU_DEKAN' };

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

    const result = await prisma.draftIjazah.updateMany({
      where,
      data: { status: 'MENUNGGU_REKTOR' },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menyetujui ${result.count} draf ijazah. Status sekarang: MENUNGGU_REKTOR`,
      count: result.count,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Gagal melakukan bulk approve Dekan:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


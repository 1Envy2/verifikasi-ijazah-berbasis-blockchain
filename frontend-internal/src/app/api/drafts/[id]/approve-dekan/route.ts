import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const draft = await prisma.draftIjazah.findUnique({ where: { id } });
    
    if (!draft) {
      return NextResponse.json({ success: false, error: "Draft tidak ditemukan" }, { status: 404 });
    }
    if (draft.status !== 'MENUNGGU_DEKAN') {
      return NextResponse.json({ success: false, error: "Status tidak valid untuk persetujuan Dekan" }, { status: 400 });
    }

    // Tahap 2: Dekanat (Checker) - Menyetujui draft
    const updated = await prisma.draftIjazah.update({
      where: { id },
      data: { status: 'MENUNGGU_REKTOR' }
    });

    return NextResponse.json({ success: true, message: "Draf berhasil disetujui oleh Dekanat", data: updated }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

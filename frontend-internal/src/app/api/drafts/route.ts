import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET: Mengambil daftar draf ijazah dengan filter opsional (batchId, status)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId');
    const status = searchParams.get('status');

    const where: any = {};
    if (batchId && batchId !== 'ALL') {
      where.batchId = batchId;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const drafts = await prisma.draftIjazah.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        batch: {
          select: {
            id: true,
            namaPeriode: true,
            tanggalWisuda: true,
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: drafts }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Menyimpan draf ijazah (baik satuan maupun massal / bulk dari parsing Excel)
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Skenario A: Bulk insert dari file Excel ({ batchId, drafts: [...] })
    if (Array.isArray(body.drafts)) {
      const { batchId, drafts } = body;

      if (!batchId) {
        return NextResponse.json(
          { success: false, error: "batchId wajib disertakan" },
          { status: 400 }
        );
      }

      if (drafts.length === 0) {
        return NextResponse.json(
          { success: false, error: "Daftar data draf tidak boleh kosong" },
          { status: 400 }
        );
      }

      // Validasi dan format data
      const dataToInsert = drafts.map((d: any) => ({
        batchId,
        nomorIjazah: String(d.nomorIjazah || '').trim(),
        nama: String(d.nama || '').trim(),
        npm: String(d.npm || '').trim(),
        fakultas: String(d.fakultas || '').trim(),
        status: 'MENUNGGU_DEKAN' as const,
      })).filter((d: any) => d.nomorIjazah && d.nama && d.npm && d.fakultas);

      if (dataToInsert.length === 0) {
        return NextResponse.json(
          { success: false, error: "Tidak ada baris data yang valid (kolom Nomor Ijazah, Nama, NPM, Fakultas wajib diisi)" },
          { status: 400 }
        );
      }

      // Gunakan createMany dengan skipDuplicates untuk mencegah crash jika ada nomor ijazah sama
      const result = await prisma.draftIjazah.createMany({
        data: dataToInsert,
        skipDuplicates: true,
      });

      return NextResponse.json({
        success: true,
        message: `Berhasil menyimpan ${result.count} data draf ijazah.`,
        insertedCount: result.count,
        totalSubmitted: dataToInsert.length,
      }, { status: 201 });
    }

    // Skenario B: Input draf satuan ({ batchId, nomorIjazah, nama, npm, fakultas })
    const { batchId, nomorIjazah, nama, npm, fakultas } = body;

    if (!batchId || !nomorIjazah || !nama || !npm || !fakultas) {
      return NextResponse.json(
        { success: false, error: "Semua kolom (batchId, nomorIjazah, nama, npm, fakultas) wajib diisi" },
        { status: 400 }
      );
    }

    const draft = await prisma.draftIjazah.create({
      data: {
        batchId,
        nomorIjazah: String(nomorIjazah).trim(),
        nama: String(nama).trim(),
        npm: String(npm).trim(),
        fakultas: String(fakultas).trim(),
        status: 'MENUNGGU_DEKAN',
      }
    });

    return NextResponse.json({ success: true, data: draft }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: "Nomor ijazah tersebut sudah terdaftar di sistem!" },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

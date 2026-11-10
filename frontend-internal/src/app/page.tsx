import Link from 'next/link';
import { ShieldCheck, UserCheck, FileSpreadsheet, Layers, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-12 relative">
      <div className="text-center mb-12 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-4">
          <Layers className="w-4 h-4" /> Alur Kerja Batch Periode Wisuda & Blockchain QBFT
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 mb-4 drop-shadow-lg">
          Portal Internal Unila
        </h1>
        <p className="text-lg text-slate-300 font-light leading-relaxed">
          Sistem Penerbitan & Verifikasi Ijazah Digital Berbasis Hyperledger Besu. Dilengkapi mekanisme impor batch Excel, persetujuan berjenjang, dan pengujian throughput jaringan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {/* Role: BAK */}
        <Link href="/bak" className="group">
          <div className="glass-panel rounded-2xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.03] hover:border-blue-400/80 cursor-pointer h-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
            <div className="w-20 h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500/30 transition-colors shadow-inner">
              <FileSpreadsheet className="w-10 h-10 text-blue-400" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 mb-3">Langkah 1: Maker</span>
            <h2 className="text-2xl font-bold mb-3 text-white">Staf BAK</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Buat periode wisuda, unduh template, dan unggah data kelulusan massal via file Excel (.xlsx).
            </p>
            <div className="mt-auto inline-flex items-center gap-1.5 text-blue-400 font-medium text-sm group-hover:translate-x-1 transition-transform">
              Buka Dasbor BAK <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        {/* Role: Dekanat */}
        <Link href="/dekanat" className="group">
          <div className="glass-panel rounded-2xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.03] hover:border-emerald-400/80 cursor-pointer h-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
            <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-500/30 transition-colors shadow-inner">
              <UserCheck className="w-10 h-10 text-emerald-400" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 mb-3">Langkah 2: Checker</span>
            <h2 className="text-2xl font-bold mb-3 text-white">Dekanat</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Verifikasi kelayakan draf ijazah mahasiswa per periode. Dukungan persetujuan perorangan maupun massal (bulk approve).
            </p>
            <div className="mt-auto inline-flex items-center gap-1.5 text-emerald-400 font-medium text-sm group-hover:translate-x-1 transition-transform">
              Buka Dasbor Dekanat <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        {/* Role: Rektorat */}
        <Link href="/rektorat" className="group">
          <div className="glass-panel rounded-2xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.03] hover:border-purple-400/80 cursor-pointer h-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-400" />
            <div className="w-20 h-20 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-500/30 transition-colors shadow-inner">
              <ShieldCheck className="w-10 h-10 text-purple-400" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 mb-3">Langkah 3: Signer</span>
            <h2 className="text-2xl font-bold mb-3 text-white">Rektorat</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Persetujuan akhir & penandatanganan on-chain ke Hyperledger Besu. Dilengkapi pengujian batch vs individual concurrent TPS.
            </p>
            <div className="mt-auto inline-flex items-center gap-1.5 text-purple-400 font-medium text-sm group-hover:translate-x-1 transition-transform">
              Buka Dasbor Rektorat <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </div>
    </main>
  );
}

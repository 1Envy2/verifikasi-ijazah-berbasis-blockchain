"use client";

import { useState } from 'react';
import { getContract } from '@/lib/web3';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  GraduationCap, 
  ShieldCheck, 
  Layers, 
  Building2, 
  User, 
  Hash, 
  Check
} from 'lucide-react';

interface IjazahDetails {
  nomorIjazah: string;
  nama: string;
  npm: string;
  fakultas: string;
  isValid: boolean;
}

type VerificationStatus = 'VALID' | 'TIDAK_DITEMUKAN' | 'TIDAK_COCOK' | 'DICABUT' | null;

export default function PublicVerification() {
  const [formData, setFormData] = useState({
    nomorIjazah: '',
    nama: '',
    npm: '',
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<VerificationStatus>(null);
  const [details, setDetails] = useState<IjazahDetails | null>(null);

  const handleVerifikasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomorIjazah.trim()) return;

    setLoading(true);
    setStatus(null);
    setDetails(null);

    try {
      const contract = getContract();
      
      // Panggil fungsi cekIjazah di smart contract IjazahRegistry
      // Smart contract akan me-revert jika nomor ijazah belum terdaftar
      const data = await contract.cekIjazah(formData.nomorIjazah.trim());

      const resultDetails: IjazahDetails = {
        nomorIjazah: formData.nomorIjazah.trim(),
        nama: data[0],
        npm: data[1],
        fakultas: data[2],
        isValid: data[3],
      };

      setDetails(resultDetails);

      if (!resultDetails.isValid) {
        setStatus('DICABUT');
      } else if (
        (formData.nama.trim() && resultDetails.nama.toLowerCase() !== formData.nama.trim().toLowerCase()) ||
        (formData.npm.trim() && resultDetails.npm !== formData.npm.trim())
      ) {
        setStatus('TIDAK_COCOK');
      } else {
        setStatus('VALID');
      }

    } catch (err: any) {
      console.log("Cek blockchain:", err);
      // Jika kontrak revert (Ijazah tidak ditemukan)
      setStatus('TIDAK_DITEMUKAN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-12 relative">
      <div className="w-full max-w-3xl glass-panel rounded-3xl p-6 md:p-10 shadow-2xl border border-white/60">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Terkoneksi Ledger Konsorsium Hyperledger Besu
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight mb-2">
            Portal Verifikasi Ijazah Digital
          </h1>
          <p className="text-slate-600 text-sm md:text-base">
            Universitas Lampung &bull; Verifikasi Keabsahan Lulusan Secara Publik & Bebas Biaya
          </p>
        </div>

        {/* Form Verifikasi Teks Online */}
        <form onSubmit={handleVerifikasi} className="space-y-4 mb-8">
          <div>
            <label className="block text-slate-700 font-semibold text-xs uppercase tracking-wider mb-2">
              Nomor Ijazah <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Contoh: UNILA/2026/FT/001"
                value={formData.nomorIjazah}
                onChange={(e) => setFormData({ ...formData, nomorIjazah: e.target.value })}
                className="w-full bg-white/90 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 font-mono text-sm placeholder:font-sans focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
              />
              <Hash className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold text-xs uppercase tracking-wider mb-2">
                Nama Lengkap Lulusan (Opsional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Untuk pencocokan ganda"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full bg-white/90 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                />
                <User className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold text-xs uppercase tracking-wider mb-2">
                NPM Mahasiswa (Opsional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Contoh: 2015061001"
                  value={formData.npm}
                  onChange={(e) => setFormData({ ...formData, npm: e.target.value })}
                  className="w-full bg-white/90 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 text-sm font-mono placeholder:font-sans focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                />
                <GraduationCap className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !formData.nomorIjazah.trim()}
            className="w-full mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memeriksa Ledger Hyperledger Besu...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" /> Periksa Keaslian di Blockchain
              </>
            )}
          </button>
        </form>

        {/* Hasil Verifikasi */}
        {status && (
          <div className="animate-in fade-in zoom-in duration-300">
            {/* 1. Status VALID */}
            {status === 'VALID' && details && (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 mx-auto mb-3 shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-600 text-white">
                  Ijazah Terverifikasi Sah
                </span>
                <h2 className="text-2xl font-bold text-slate-800 mt-2 mb-1">DATA ASLI & VALID</h2>
                <p className="text-slate-600 text-xs mb-6">
                  Tercatat secara permanen di ledger Hyperledger Besu Konsorsium Universitas Lampung.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left bg-white/80 p-4 rounded-xl border border-emerald-200">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Nomor Ijazah</span>
                    <p className="text-sm font-mono font-bold text-slate-800">{details.nomorIjazah}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Nama Lulusan</span>
                    <p className="text-sm font-bold text-slate-800">{details.nama}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Nomor Pokok Mahasiswa (NPM)</span>
                    <p className="text-sm font-mono font-bold text-slate-800">{details.npm}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Fakultas / Unit</span>
                    <p className="text-sm font-bold text-slate-800">{details.fakultas}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Status TIDAK_DITEMUKAN */}
            {status === 'TIDAK_DITEMUKAN' && (
              <div className="p-6 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 text-center">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-600 mx-auto mb-3">
                  <XCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-rose-600 mb-1">DATA TIDAK DITEMUKAN</h2>
                <p className="text-slate-600 text-xs max-w-md mx-auto">
                  Nomor ijazah <strong>{formData.nomorIjazah}</strong> tidak terdaftar dalam catatan konsensus blockchain institusi Universitas Lampung.
                </p>
              </div>
            )}

            {/* 3. Status TIDAK_COCOK */}
            {status === 'TIDAK_COCOK' && details && (
              <div className="p-6 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-center">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 mx-auto mb-3">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-amber-700 mb-1">DATA TIDAK COCOK</h2>
                <p className="text-slate-600 text-xs mb-4">
                  Nomor ijazah terdaftar, namun rincian Nama atau NPM yang Anda masukkan tidak sesuai dengan data asli yang terenkripsi di blockchain.
                </p>
                <div className="bg-white/80 p-4 rounded-xl text-left text-xs border border-amber-200">
                  <p><strong>Nama di Blockchain:</strong> {details.nama}</p>
                  <p><strong>NPM di Blockchain:</strong> {details.npm}</p>
                  <p><strong>Fakultas di Blockchain:</strong> {details.fakultas}</p>
                </div>
              </div>
            )}

            {/* 4. Status DICABUT */}
            {status === 'DICABUT' && (
              <div className="p-6 rounded-2xl bg-orange-500/10 border-2 border-orange-500/40 text-center">
                <div className="w-16 h-16 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-600 mx-auto mb-3">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-orange-700 mb-1">IJAZAH TELAH DICABUT</h2>
                <p className="text-slate-600 text-xs">
                  Ijazah dengan nomor ini pernah diterbitkan, namun saat ini telah resmi dicabut keabsahannya oleh Rektorat Universitas Lampung (<code className="font-mono text-orange-800">isValid = false</code>).
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}

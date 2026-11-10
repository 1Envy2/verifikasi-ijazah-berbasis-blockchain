"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  PlusCircle, 
  Download, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Calendar, 
  Layers, 
  Database,
  RefreshCw,
  Eye,
  FileCheck
} from 'lucide-react';

interface BatchItem {
  id: string;
  namaPeriode: string;
  tanggalWisuda: string;
  keterangan: string | null;
  totalDrafts: number;
  statusCount: {
    MENUNGGU_DEKAN: number;
    MENUNGGU_REKTOR: number;
    DITERBITKAN: number;
  };
}

interface DraftRow {
  nomorIjazah: string;
  nama: string;
  npm: string;
  fakultas: string;
}

interface SavedDraft {
  id: string;
  nomorIjazah: string;
  nama: string;
  npm: string;
  fakultas: string;
  status: 'MENUNGGU_DEKAN' | 'MENUNGGU_REKTOR' | 'DITERBITKAN';
  txHash?: string;
  createdAt: string;
  batch?: {
    namaPeriode: string;
  };
}

export default function BAKDashboard() {
  const [activeTab, setActiveTab] = useState<'upload' | 'batch' | 'list'>('upload');
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [loadingBatches, setLoadingBatches] = useState(false);

  // State Buat Batch Baru
  const [newBatch, setNewBatch] = useState({
    namaPeriode: '',
    tanggalWisuda: '',
    keterangan: '',
  });
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [batchMessage, setBatchMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // State Upload Excel & Parsing
  const [fileName, setFileName] = useState<string>('');
  const [parsedData, setParsedData] = useState<DraftRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [savingDrafts, setSavingDrafts] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // State List Drafts
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [filterBatchForList, setFilterBatchForList] = useState<string>('ALL');

  // Ambil daftar Batch saat komponen dimuat
  const fetchBatches = async () => {
    setLoadingBatches(true);
    try {
      const res = await fetch('/api/batches');
      const data = await res.json();
      if (data.success) {
        setBatches(data.data);
        if (data.data.length > 0 && !selectedBatchId) {
          setSelectedBatchId(data.data[0].id);
        }
      }
    } catch (err) {
      console.error("Gagal mengambil batch:", err);
    } finally {
      setLoadingBatches(false);
    }
  };

  const fetchDrafts = async (batchId: string = filterBatchForList) => {
    setLoadingDrafts(true);
    try {
      const url = batchId && batchId !== 'ALL' ? `/api/drafts?batchId=${batchId}` : '/api/drafts';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setSavedDrafts(data.data);
      }
    } catch (err) {
      console.error("Gagal mengambil draf:", err);
    } finally {
      setLoadingDrafts(false);
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchDrafts('ALL');
  }, []);

  // Handler Submit Batch Baru
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setBatchSubmitting(true);
    setBatchMessage(null);

    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBatch),
      });
      const data = await res.json();

      if (data.success) {
        setBatchMessage({ type: 'success', text: `Periode "${data.data.namaPeriode}" berhasil dibuat!` });
        setNewBatch({ namaPeriode: '', tanggalWisuda: '', keterangan: '' });
        await fetchBatches();
        setSelectedBatchId(data.data.id);
      } else {
        setBatchMessage({ type: 'error', text: data.error || 'Gagal membuat periode wisuda' });
      }
    } catch (err: any) {
      setBatchMessage({ type: 'error', text: err.message });
    } finally {
      setBatchSubmitting(false);
    }
  };

  // Handler Download Template Excel
  const handleDownloadTemplate = () => {
    const wsData = [
      ["Nomor Ijazah", "Nama", "NPM", "Fakultas"],
      ["UNILA/2026/FT/001", "Ahmad Fauzi", "2015061001", "Teknik"],
      ["UNILA/2026/FMIPA/002", "Siti Nurhaliza", "2017051012", "MIPA"],
      ["UNILA/2026/FP/003", "Budi Santoso", "2014011045", "Pertanian"],
      ["UNILA/2026/FEB/004", "Dewi Lestari", "2011021088", "Ekonomi dan Bisnis"]
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Styling lebar kolom
    ws['!cols'] = [
      { wch: 26 }, // Nomor Ijazah
      { wch: 25 }, // Nama
      { wch: 16 }, // NPM
      { wch: 22 }  // Fakultas
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Template_Ijazah");
    XLSX.writeFile(wb, "Template_Import_Ijazah_Unila.xlsx");
  };

  // Handler Parsing File Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setParseError(null);
    setUploadResult(null);

    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];

        // Konversi sheet ke JSON
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rawJson.length === 0) {
          setParseError("File Excel kosong atau tidak memiliki baris data!");
          setParsedData([]);
          return;
        }

        // Normalisasi header (dukung berbagai variasi penamaan kolom)
        const normalized: DraftRow[] = rawJson.map((row) => {
          const keys = Object.keys(row);

          const findKey = (candidates: string[]) => {
            const found = keys.find(k => candidates.includes(k.trim().toLowerCase()));
            return found ? String(row[found]).trim() : '';
          };

          const nomorIjazah = findKey(['nomor ijazah', 'no ijazah', 'no_ijazah', 'nomor_ijazah', 'nomorijazah', 'ijazah']);
          const nama = findKey(['nama', 'nama mahasiswa', 'nama lengkap', 'nama_mahasiswa']);
          const npm = findKey(['npm', 'nim', 'nomor pokok mahasiswa']);
          const fakultas = findKey(['fakultas', 'prodi', 'fakultas/unit']);

          return { nomorIjazah, nama, npm, fakultas };
        }).filter(item => item.nomorIjazah || item.nama || item.npm || item.fakultas);

        // Validasi kelengkapan data
        const invalidRows = normalized.filter(
          item => !item.nomorIjazah || !item.nama || !item.npm || !item.fakultas
        );

        if (invalidRows.length > 0) {
          setParseError(`Ditemukan ${invalidRows.length} baris dengan kolom yang tidak lengkap! Pastikan kolom Nomor Ijazah, Nama, NPM, dan Fakultas terisi.`);
        }

        setParsedData(normalized);
      } catch (err: any) {
        setParseError("Gagal membaca file Excel. Pastikan format file .xlsx atau .csv valid: " + err.message);
        setParsedData([]);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Handler Simpan Data Parsed ke Database
  const handleSaveDrafts = async () => {
    if (!selectedBatchId) {
      setUploadResult({ type: 'error', text: 'Pilih Periode Wisuda terlebih dahulu!' });
      return;
    }

    if (parsedData.length === 0) {
      setUploadResult({ type: 'error', text: 'Tidak ada data valid untuk disimpan!' });
      return;
    }

    setSavingDrafts(true);
    setUploadResult(null);

    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: selectedBatchId,
          drafts: parsedData,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setUploadResult({
          type: 'success',
          text: `Berhasil menyimpan ${data.insertedCount} draf ijazah baru ke database off-chain (PostgreSQL)! Draf berstatus "MENUNGGU_DEKAN".`,
        });
        setParsedData([]);
        setFileName('');
        await fetchBatches();
        await fetchDrafts(selectedBatchId);
      } else {
        setUploadResult({ type: 'error', text: data.error || 'Gagal menyimpan draf' });
      }
    } catch (err: any) {
      setUploadResult({ type: 'error', text: err.message });
    } finally {
      setSavingDrafts(false);
    }
  };

  const selectedBatchInfo = useMemo(() => {
    return batches.find(b => b.id === selectedBatchId);
  }, [batches, selectedBatchId]);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 relative">
      <div className="w-full max-w-6xl">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Portal Utama
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs text-slate-300 font-mono">Role: Biro Akademik & Kemahasiswaan (Maker)</span>
          </div>
        </div>

        {/* Title Header */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 mb-8 border border-blue-500/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Dasbor BAK (Maker)</h1>
                <p className="text-slate-400 text-sm">
                  Kelola batch periode wisuda dan unggah data kelulusan massal via spreadsheet Excel.
                </p>
              </div>
            </div>

            {/* Tab Buttons */}
            <div className="flex bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'upload' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <UploadCloud className="w-4 h-4" /> Upload Excel
              </button>
              <button
                onClick={() => setActiveTab('batch')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'batch' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <PlusCircle className="w-4 h-4" /> Periode Wisuda ({batches.length})
              </button>
              <button
                onClick={() => { setActiveTab('list'); fetchDrafts(selectedBatchId || 'ALL'); }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Database className="w-4 h-4" /> Draf Tersimpan
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: UPLOAD EXCEL                                      */}
        {/* ======================================================== */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            {/* Step 1: Pilih Periode & Download Template */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 glass-panel rounded-2xl p-6">
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  1. Pilih Periode Wisuda Tujuan <span className="text-rose-400">*</span>
                </label>
                {batches.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex items-center justify-between">
                    <span>Belum ada Periode Wisuda. Silakan buat periode baru terlebih dahulu.</span>
                    <button
                      onClick={() => setActiveTab('batch')}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-900 font-bold text-xs"
                    >
                      Buat Periode
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500"
                    >
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.namaPeriode} (Wisuda: {new Date(b.tanggalWisuda).toLocaleDateString('id-ID')}) — {b.totalDrafts} draf
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={fetchBatches}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      title="Segarkan Daftar Periode"
                    >
                      <RefreshCw className={`w-5 h-5 ${loadingBatches ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                )}

                {selectedBatchInfo && (
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                      <div className="text-xs text-slate-400">Total Draf</div>
                      <div className="text-lg font-bold text-white">{selectedBatchInfo.totalDrafts}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <div className="text-xs text-amber-300">Menunggu Dekan</div>
                      <div className="text-lg font-bold text-amber-400">{selectedBatchInfo.statusCount.MENUNGGU_DEKAN}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <div className="text-xs text-purple-300">Diterbitkan Blockchain</div>
                      <div className="text-lg font-bold text-purple-400">{selectedBatchInfo.statusCount.DITERBITKAN}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Download Template Box */}
              <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between border border-slate-700/60">
                <div>
                  <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                    <Download className="w-4 h-4 text-cyan-400" /> Template Spreadsheet
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Gunakan template resmi dengan kolom: <code className="text-cyan-300 font-mono">Nomor Ijazah</code>, <code className="text-cyan-300 font-mono">Nama</code>, <code className="text-cyan-300 font-mono">NPM</code>, dan <code className="text-cyan-300 font-mono">Fakultas</code>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-semibold text-sm transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" /> Unduh Template (.xlsx)
                </button>
              </div>
            </div>

            {/* Step 2: Upload Area */}
            <div className="glass-panel rounded-2xl p-8">
              <label className="block text-slate-300 text-sm font-medium mb-3">
                2. Unggah File Excel Berisi Daftar Lulusan (.xlsx / .csv)
              </label>

              <div className="border-2 border-dashed border-blue-500/40 rounded-2xl p-8 text-center hover:border-blue-400 bg-blue-500/5 transition-all relative">
                <UploadCloud className="mx-auto h-12 w-12 text-blue-400 mb-3" />
                <p className="text-base font-medium text-slate-200 mb-1">
                  Pilih file Excel atau seret dan lepas di sini
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  Sistem otomatis mem-parsing dan memvalidasi baris data di browser
                </p>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {fileName && (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono">
                    <FileSpreadsheet className="w-4 h-4" /> {fileName}
                  </div>
                )}
              </div>

              {parseError && (
                <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>{parseError}</div>
                </div>
              )}

              {uploadResult && (
                <div className={`mt-4 p-4 rounded-xl text-sm flex items-start gap-3 ${
                  uploadResult.type === 'success' 
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' 
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}>
                  {uploadResult.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <div>{uploadResult.text}</div>
                </div>
              )}
            </div>

            {/* Step 3: Pratinjau Tabel Data Hasil Parsing */}
            {parsedData.length > 0 && (
              <div className="glass-panel rounded-2xl p-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Eye className="w-5 h-5 text-blue-400" /> Pratinjau Data ({parsedData.length} Mahasiswa Siap Disimpan)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Periksa kembali kelengkapan baris sebelum disimpan ke basis data off-chain.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveDrafts}
                    disabled={savingDrafts || !selectedBatchId}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg transition-all disabled:opacity-50"
                  >
                    {savingDrafts ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Menyimpan ke Database...
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4" /> Simpan Semua ({parsedData.length} Draf) ke Database
                      </>
                    )}
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-700/60 max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-800/80 sticky top-0 backdrop-blur-md">
                      <tr>
                        <th className="px-4 py-3">No</th>
                        <th className="px-4 py-3">Nomor Ijazah</th>
                        <th className="px-4 py-3">Nama Lengkap</th>
                        <th className="px-4 py-3">NPM</th>
                        <th className="px-4 py-3">Fakultas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {parsedData.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="px-4 py-2.5 text-xs text-slate-500">{idx + 1}</td>
                          <td className="px-4 py-2.5 font-mono text-cyan-300 font-medium">{item.nomorIjazah}</td>
                          <td className="px-4 py-2.5 text-white">{item.nama}</td>
                          <td className="px-4 py-2.5 font-mono">{item.npm}</td>
                          <td className="px-4 py-2.5 text-slate-400">{item.fakultas}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: KELOLA BATCH PERIODE WISUDA                      */}
        {/* ======================================================== */}
        {activeTab === 'batch' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Form Buat Batch Baru */}
            <div className="glass-panel rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-400" /> Buat Periode Wisuda Baru
              </h2>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Setiap periode wisuda akan menjadi wadah pengelompokan draf ijazah mahasiswa yang diunggah.
              </p>

              <form onSubmit={handleCreateBatch} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5">
                    Nama Periode <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Wisuda Periode II Tahun 2026"
                    value={newBatch.namaPeriode}
                    onChange={(e) => setNewBatch({ ...newBatch, namaPeriode: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5">
                    Tanggal Pelaksanaan Wisuda <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newBatch.tanggalWisuda}
                    onChange={(e) => setNewBatch({ ...newBatch, tanggalWisuda: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5">
                    Keterangan Tambahan (Opsional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Program Sarjana dan Diploma semester genap"
                    value={newBatch.keterangan}
                    onChange={(e) => setNewBatch({ ...newBatch, keterangan: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={batchSubmitting}
                  className="w-full mt-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all disabled:opacity-50"
                >
                  {batchSubmitting ? 'Menyimpan...' : 'Simpan Periode Wisuda'}
                </button>

                {batchMessage && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    batchMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {batchMessage.text}
                  </div>
                )}
              </form>
            </div>

            {/* Daftar Batch yang Sudah Ada */}
            <div className="md:col-span-2 glass-panel rounded-2xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" /> Daftar Periode Wisuda Terdaftar
                </h2>
                <button
                  onClick={fetchBatches}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingBatches ? 'animate-spin' : ''}`} /> Muat Ulang
                </button>
              </div>

              {batches.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  Belum ada periode wisuda yang dibuat.
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {batches.map((batch) => (
                    <div
                      key={batch.id}
                      className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-blue-500/50 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <h3 className="text-base font-bold text-white">{batch.namaPeriode}</h3>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-400" />
                          {new Date(batch.tanggalWisuda).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>

                      {batch.keterangan && (
                        <p className="text-xs text-slate-400 mb-3">{batch.keterangan}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-700/40">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-300 font-medium">
                          Total: {batch.totalDrafts} draf
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-medium">
                          Menunggu Dekan: {batch.statusCount.MENUNGGU_DEKAN}
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 font-medium">
                          Menunggu Rektor: {batch.statusCount.MENUNGGU_REKTOR}
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                          Diterbitkan Blockchain: {batch.statusCount.DITERBITKAN}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBatchId(batch.id);
                            setActiveTab('upload');
                          }}
                          className="ml-auto text-xs text-blue-400 hover:text-blue-300 font-medium"
                        >
                          Gunakan Batch Ini &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: DAFTAR DRAF TERSIMPAN                            */}
        {/* ======================================================== */}
        {activeTab === 'list' && (
          <div className="glass-panel rounded-2xl p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" /> Draf Ijazah Tersimpan di Database
                </h2>
                <p className="text-xs text-slate-400">
                  Seluruh data draf yang telah diimpor oleh BAK sebelum atau sesudah diverifikasi.
                </p>
              </div>

              {/* Filter Batch */}
              <div className="flex items-center gap-3">
                <select
                  value={filterBatchForList}
                  onChange={(e) => {
                    setFilterBatchForList(e.target.value);
                    fetchDrafts(e.target.value);
                  }}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-xs outline-none"
                >
                  <option value="ALL">Semua Periode Wisuda</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.namaPeriode}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => fetchDrafts(filterBatchForList)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingDrafts ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {loadingDrafts ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
                Memuat daftar draf...
              </div>
            ) : savedDrafts.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                Belum ada draf yang tersimpan pada filter ini.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-700/60">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-800/80">
                    <tr>
                      <th className="px-4 py-3">No</th>
                      <th className="px-4 py-3">Nomor Ijazah</th>
                      <th className="px-4 py-3">Nama</th>
                      <th className="px-4 py-3">NPM</th>
                      <th className="px-4 py-3">Fakultas</th>
                      <th className="px-4 py-3">Periode</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {savedDrafts.map((d, idx) => (
                      <tr key={d.id} className="hover:bg-slate-800/30">
                        <td className="px-4 py-2.5 text-xs text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-mono text-cyan-300 text-xs font-semibold">{d.nomorIjazah}</td>
                        <td className="px-4 py-2.5 text-white font-medium">{d.nama}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{d.npm}</td>
                        <td className="px-4 py-2.5 text-slate-400 text-xs">{d.fakultas}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-400">{d.batch?.namaPeriode || '-'}</td>
                        <td className="px-4 py-2.5">
                          {d.status === 'MENUNGGU_DEKAN' && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-medium">
                              Menunggu Dekan
                            </span>
                          )}
                          {d.status === 'MENUNGGU_REKTOR' && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 font-medium">
                              Menunggu Rektor
                            </span>
                          )}
                          {d.status === 'DITERBITKAN' && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-medium flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" /> Diterbitkan
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

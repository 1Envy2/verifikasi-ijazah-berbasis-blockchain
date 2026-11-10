"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ArrowLeft, 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Filter, 
  Cpu, 
  Zap, 
  Activity, 
  Layers,
  Copy,
  Check
} from 'lucide-react';

interface BatchItem {
  id: string;
  namaPeriode: string;
}

interface DraftItem {
  id: string;
  nomorIjazah: string;
  nama: string;
  npm: string;
  fakultas: string;
  status: 'MENUNGGU_DEKAN' | 'MENUNGGU_REKTOR' | 'DITERBITKAN';
  txHash?: string | null;
  createdAt: string;
  batch?: {
    id: string;
    namaPeriode: string;
  };
}

interface BenchmarkMetric {
  mode: 'batch' | 'individual';
  count: number;
  durationMs: number;
  durationSec: string;
  tps?: string;
  txHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  message: string;
}

export default function RektoratDashboard() {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('ALL');
  const [viewTab, setViewTab] = useState<'pending' | 'published'>('pending');
  const [loading, setLoading] = useState(false);

  // Execution Mode: 'batch' (1 transaksi massal) vs 'individual' (Stress Test TPS)
  const [executionMode, setExecutionMode] = useState<'batch' | 'individual'>('batch');

  // Processing States
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [metricResult, setMetricResult] = useState<BenchmarkMetric | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Fetch batches & drafts
  const fetchData = async (batchId: string = selectedBatchId) => {
    setLoading(true);
    setNotification(null);
    try {
      // 1. Ambil batches
      const batchRes = await fetch('/api/batches');
      const batchData = await batchRes.json();
      if (batchData.success) {
        setBatches(batchData.data);
      }

      // 2. Ambil drafts
      const queryUrl = batchId && batchId !== 'ALL' 
        ? `/api/drafts?batchId=${batchId}` 
        : `/api/drafts`;
      
      const draftsRes = await fetch(queryUrl);
      const draftsData = await draftsRes.json();
      if (draftsData.success) {
        setDrafts(draftsData.data);
      }
      setSelectedIds([]);
    } catch (err: any) {
      console.error("Gagal mengambil data:", err);
      setNotification({ type: 'error', text: err.message || "Gagal mengambil data draf" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData('ALL');
  }, []);

  // Filter drafts berdasarkan status dan batch
  const pendingDrafts = useMemo(() => {
    return drafts.filter(d => {
      const matchStatus = d.status === 'MENUNGGU_REKTOR';
      const matchBatch = selectedBatchId === 'ALL' || d.batch?.id === selectedBatchId;
      return matchStatus && matchBatch;
    });
  }, [drafts, selectedBatchId]);

  const publishedDrafts = useMemo(() => {
    return drafts.filter(d => {
      const matchStatus = d.status === 'DITERBITKAN';
      const matchBatch = selectedBatchId === 'ALL' || d.batch?.id === selectedBatchId;
      return matchStatus && matchBatch;
    });
  }, [drafts, selectedBatchId]);

  const activeDisplayList = viewTab === 'pending' ? pendingDrafts : publishedDrafts;

  // Toggle Selection
  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pendingDrafts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingDrafts.map(d => d.id));
    }
  };

  // Handler Terbitkan Satuan (Individual)
  const handlePublishSingle = async (id: string) => {
    setProcessingId(id);
    setNotification(null);
    setMetricResult(null);

    try {
      const res = await fetch(`/api/drafts/${id}/approve-rektor`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setNotification({
          type: 'success',
          text: `Berhasil diterbitkan ke Blockchain Besu! TX Hash: ${data.txHash}`
        });
        await fetchData(selectedBatchId);
      } else {
        setNotification({ type: 'error', text: data.error || "Gagal menerbitkan ijazah" });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  // Handler Terbitkan Massal (Batch atau Stress Test)
  const handleBulkPublish = async () => {
    if (selectedIds.length === 0) return;
    setBulkProcessing(true);
    setNotification(null);
    setMetricResult(null);

    try {
      const res = await fetch('/api/drafts/bulk-approve-rektor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ids: selectedIds,
          mode: executionMode,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMetricResult(data);
        setNotification({
          type: 'success',
          text: data.message,
        });
        setSelectedIds([]);
        await fetchData(selectedBatchId);
      } else {
        setNotification({ type: 'error', text: data.error || "Gagal menerbitkan massal ke blockchain" });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setBulkProcessing(false);
    }
  };

  // Handler Terbitkan Seluruh Batch
  const handlePublishEntireBatch = async () => {
    if (!selectedBatchId || selectedBatchId === 'ALL') {
      setNotification({ type: 'error', text: "Pilih periode wisuda spesifik untuk menerbitkan seluruh batch!" });
      return;
    }

    if (pendingDrafts.length === 0) return;

    if (!confirm(`Konfirmasi: Terbitkan ${pendingDrafts.length} draf ijazah langsung ke Jaringan Hyperledger Besu menggunakan Mode: ${executionMode.toUpperCase()}?`)) {
      return;
    }

    setBulkProcessing(true);
    setNotification(null);
    setMetricResult(null);

    try {
      const res = await fetch('/api/drafts/bulk-approve-rektor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          batchId: selectedBatchId,
          mode: executionMode,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMetricResult(data);
        setNotification({
          type: 'success',
          text: data.message,
        });
        setSelectedIds([]);
        await fetchData(selectedBatchId);
      } else {
        setNotification({ type: 'error', text: data.error || "Gagal menerbitkan batch" });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setBulkProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const isAllSelected = pendingDrafts.length > 0 && selectedIds.length === pendingDrafts.length;

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 relative">
      <div className="w-full max-w-6xl">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Portal Utama
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-xs text-slate-300 font-mono">Role: Rektorat Institusi (Signer / Blockchain Executor)</span>
          </div>
        </div>

        {/* Title Header */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 mb-6 border border-purple-500/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Dasbor Rektorat (Signer)</h1>
                <p className="text-slate-400 text-sm">
                  Persetujuan final dan penandatanganan kriptografi otomatis (Backend Signing) ke Hyperledger Besu.
                </p>
              </div>
            </div>

            {/* Filter Periode Wisuda */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-2">
                <Filter className="w-4 h-4 text-purple-400" />
                <select
                  value={selectedBatchId}
                  onChange={(e) => {
                    setSelectedBatchId(e.target.value);
                    fetchData(e.target.value);
                  }}
                  className="bg-transparent text-white text-sm outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Periode Wisuda</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id} className="bg-slate-800">
                      {b.namaPeriode}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => fetchData(selectedBatchId)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="Segarkan Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setViewTab('pending')}
            className={`glass-panel p-5 rounded-2xl text-left border transition-all ${
              viewTab === 'pending' ? 'border-purple-500/80 bg-purple-500/10' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Menunggu Penerbitan</span>
              <Cpu className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">{pendingDrafts.length}</div>
            <p className="text-xs text-purple-300 mt-1">Siap ditandatangani dan ditanam ke Blockchain</p>
          </button>

          <button
            onClick={() => setViewTab('published')}
            className={`glass-panel p-5 rounded-2xl text-left border transition-all ${
              viewTab === 'published' ? 'border-emerald-500/80 bg-emerald-500/10' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sudah Diterbitkan On-Chain</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">{publishedDrafts.length}</div>
            <p className="text-xs text-emerald-300 mt-1">Tersimpan permanen di ledger Besu (Immutable)</p>
          </button>
        </div>

        {/* Mode Eksekusi Switcher (Batch vs Stress Test TPS) */}
        {viewTab === 'pending' && (
          <div className="glass-panel rounded-2xl p-6 mb-6 border border-indigo-500/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-400" /> Mode Eksekusi Blockchain
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tentukan metode pengiriman transaksi ke konsensus QBFT Hyperledger Besu:
                </p>
              </div>

              <div className="flex bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 gap-1">
                <button
                  type="button"
                  onClick={() => setExecutionMode('batch')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    executionMode === 'batch' 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> 1 Transaksi Batch (Efisien)
                </button>
                <button
                  type="button"
                  onClick={() => setExecutionMode('individual')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    executionMode === 'individual' 
                      ? 'bg-amber-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" /> Stress Test TPS (N Transaksi)
                </button>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              {executionMode === 'batch' ? (
                <>
                  <strong className="text-purple-300">Mode Batch Transaction:</strong> Mengemas seluruh ijazah terpilih ke dalam 1 transaksi via fungsi <code className="text-purple-300 font-mono">tambahIjazahBatch</code>. Menghemat block space dan menghasilkan 1 hash transaksi untuk seluruh angkatan wisuda.
                </>
              ) : (
                <>
                  <strong className="text-amber-300">Mode Stress Test (TPS Benchmark):</strong> Mengirim setiap draf ijazah sebagai transaksi terpisah via <code className="text-amber-300 font-mono">tambahIjazah</code> secara serentak. Sangat cocok untuk menguji batas throughput TPS dan response time 5-node Hyperledger Besu untuk data skripsi Anda.
                </>
              )}
            </div>
          </div>
        )}

        {/* Benchmark / Execution Metrics Card */}
        {metricResult && (
          <div className="glass-panel rounded-2xl p-6 mb-6 border border-emerald-500/50 bg-emerald-500/5 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Metrik Eksekusi Blockchain Berhasil</h3>
                <p className="text-xs text-emerald-300">{metricResult.message}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-xs text-slate-400">Total Ijazah Terbit</div>
                <div className="text-xl font-bold text-white">{metricResult.count} data</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-xs text-slate-400">Waktu Eksekusi</div>
                <div className="text-xl font-bold text-cyan-400">{metricResult.durationSec} dtk <span className="text-xs text-slate-400">({metricResult.durationMs}ms)</span></div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-xs text-slate-400">
                  {metricResult.mode === 'batch' ? 'Block Number' : 'Throughput (TPS)'}
                </div>
                <div className="text-xl font-bold text-purple-400">
                  {metricResult.mode === 'batch' 
                    ? `#${metricResult.blockNumber ?? '-'}` 
                    : `${metricResult.tps} TPS`}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-xs text-slate-400">Metode Pengujian</div>
                <div className="text-sm font-bold uppercase text-amber-400 mt-1">
                  {metricResult.mode === 'batch' ? 'Batch Minting' : 'Stress Test Concurrent'}
                </div>
              </div>
            </div>

            {metricResult.txHash && (
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
                <div className="text-xs font-mono text-slate-300 truncate">
                  <span className="text-slate-500 mr-2">TX HASH:</span>
                  <span className="text-emerald-400">{metricResult.txHash}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(metricResult.txHash!)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 flex-shrink-0"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedHash ? 'Disalin' : 'Salin Hash'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notifikasi Alert */}
        {notification && (
          <div className={`mb-6 p-4 rounded-xl text-sm flex items-start gap-3 animate-in fade-in ${
            notification.type === 'success' 
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div className="break-all">{notification.text}</div>
          </div>
        )}

        {/* Action Toolbar (Khusus Tab Menunggu Penerbitan) */}
        {viewTab === 'pending' && (
          <div className="glass-panel rounded-2xl p-4 md:p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSelectAll}
                disabled={pendingDrafts.length === 0}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all disabled:opacity-50"
              >
                {isAllSelected ? (
                  <CheckSquare className="w-4 h-4 text-purple-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                {isAllSelected ? 'Batalkan Semua' : 'Pilih Semua'}
              </button>

              <span className="text-xs text-slate-400 font-mono">
                Terpilih: <strong className="text-purple-400">{selectedIds.length}</strong> dari {pendingDrafts.length} draf
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Tombol Terbitkan Terpilih */}
              <button
                type="button"
                onClick={handleBulkPublish}
                disabled={selectedIds.length === 0 || bulkProcessing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShieldCheck className="w-4 h-4" />
                {bulkProcessing 
                  ? 'Menandatangani ke Blockchain...' 
                  : `Tandatangani & Terbitkan Terpilih (${selectedIds.length})`}
              </button>

              {/* Tombol Terbitkan Seluruh Batch */}
              {selectedBatchId !== 'ALL' && pendingDrafts.length > 0 && (
                <button
                  type="button"
                  onClick={handlePublishEntireBatch}
                  disabled={bulkProcessing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-purple-500/40 text-purple-300 font-semibold text-xs transition-all disabled:opacity-40"
                >
                  Terbitkan Seluruh Batch ({pendingDrafts.length})
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tabel Data Draf */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {viewTab === 'pending' ? (
                <>
                  <Cpu className="w-5 h-5 text-purple-400" /> Draf Menunggu Penerbitan ({pendingDrafts.length})
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Ijazah Terbit Permanen On-Chain ({publishedDrafts.length})
                </>
              )}
            </h2>

            <span className="text-xs text-slate-400 font-mono">
              Jaringan: Hyperledger Besu (QBFT Node)
            </span>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
              Memuat data draf ijazah...
            </div>
          ) : activeDisplayList.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              {viewTab === 'pending' 
                ? 'Tidak ada draf yang menunggu penerbitan Rektorat pada filter ini.' 
                : 'Belum ada ijazah yang diterbitkan ke blockchain pada filter ini.'}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-700/60">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-slate-800/80">
                  <tr>
                    {viewTab === 'pending' && (
                      <th className="px-4 py-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                      </th>
                    )}
                    <th className="px-4 py-3">Nomor Ijazah</th>
                    <th className="px-4 py-3">Nama Mahasiswa</th>
                    <th className="px-4 py-3">NPM</th>
                    <th className="px-4 py-3">Fakultas</th>
                    <th className="px-4 py-3">Periode</th>
                    {viewTab === 'published' ? (
                      <th className="px-4 py-3">Bukti Hash Transaksi</th>
                    ) : (
                      <th className="px-4 py-3 text-right">Aksi Satuan</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {activeDisplayList.map((d) => {
                    const isSelected = selectedIds.includes(d.id);
                    return (
                      <tr 
                        key={d.id} 
                        className={`transition-colors ${
                          isSelected ? 'bg-purple-500/10' : 'hover:bg-slate-800/30'
                        }`}
                      >
                        {viewTab === 'pending' && (
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(d.id)}
                              className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="px-4 py-3 font-mono text-cyan-300 text-xs font-semibold">
                          {d.nomorIjazah}
                        </td>
                        <td className="px-4 py-3 text-white font-medium">
                          {d.nama}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {d.npm}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {d.fakultas}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {d.batch?.namaPeriode || '-'}
                        </td>

                        {viewTab === 'published' ? (
                          <td className="px-4 py-3">
                            {d.txHash ? (
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-emerald-400 truncate max-w-[200px]" title={d.txHash}>
                                  {d.txHash.substring(0, 14)}...{d.txHash.substring(d.txHash.length - 8)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(d.txHash!)}
                                  className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                                  title="Salin TX Hash"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </td>
                        ) : (
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handlePublishSingle(d.id)}
                              disabled={processingId === d.id || bulkProcessing}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/80 hover:bg-purple-500 text-white font-semibold text-xs transition-all disabled:opacity-40"
                            >
                              {processingId === d.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ShieldCheck className="w-3.5 h-3.5" />
                              )}
                              {processingId === d.id ? 'Menandatangani...' : 'Terbitkan Satuan'}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

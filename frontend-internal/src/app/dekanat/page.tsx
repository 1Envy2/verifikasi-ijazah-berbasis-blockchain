"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  UserCheck, 
  ArrowLeft, 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Filter, 
  CheckCheck,
  GraduationCap
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
  createdAt: string;
  batch?: {
    id: string;
    namaPeriode: string;
  };
}

export default function DekanatDashboard() {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Ambil data batch dan drafts
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

      // 2. Ambil drafts berstatus MENUNGGU_DEKAN
      const queryUrl = batchId && batchId !== 'ALL' 
        ? `/api/drafts?batchId=${batchId}&status=MENUNGGU_DEKAN` 
        : `/api/drafts?status=MENUNGGU_DEKAN`;
      
      const draftsRes = await fetch(queryUrl);
      const draftsData = await draftsRes.json();
      if (draftsData.success) {
        setDrafts(draftsData.data);
      }
      setSelectedIds([]);
    } catch (err: any) {
      console.error("Gagal memuat data:", err);
      setNotification({ type: 'error', text: err.message || "Gagal memuat data draf" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData('ALL');
  }, []);

  // Filter drafts berdasarkan batch terpilih
  const filteredDrafts = useMemo(() => {
    if (selectedBatchId === 'ALL') return drafts;
    return drafts.filter(d => d.batch?.id === selectedBatchId);
  }, [drafts, selectedBatchId]);

  // Handler Select / Deselect One
  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Handler Select All
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredDrafts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDrafts.map(d => d.id));
    }
  };

  // Handler Persetujuan Satuan (Individual Approval)
  const handleApproveSingle = async (id: string, nama: string) => {
    setProcessingId(id);
    setNotification(null);

    try {
      const res = await fetch(`/api/drafts/${id}/approve-dekan`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setNotification({ 
          type: 'success', 
          text: `Draf ijazah mahasiswa "${nama}" berhasil disetujui. Status diteruskan ke Rektorat (MENUNGGU_REKTOR).` 
        });
        setDrafts(prev => prev.filter(d => d.id !== id));
        setSelectedIds(prev => prev.filter(item => item !== id));
      } else {
        setNotification({ type: 'error', text: data.error || "Gagal menyetujui draf" });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  // Handler Persetujuan Massal (Bulk Approval Terpilih)
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setBulkProcessing(true);
    setNotification(null);

    try {
      const res = await fetch('/api/drafts/bulk-approve-dekan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();

      if (data.success) {
        setNotification({
          type: 'success',
          text: `Sukses menyetujui ${data.count} draf ijazah secara massal! Seluruh draf kini siap ditandatangani oleh Rektorat.`
        });
        setDrafts(prev => prev.filter(d => !selectedIds.includes(d.id)));
        setSelectedIds([]);
      } else {
        setNotification({ type: 'error', text: data.error || "Gagal melakukan persetujuan massal" });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setBulkProcessing(false);
    }
  };

  // Handler Setujui Semua dalam Batch
  const handleApproveEntireBatch = async () => {
    if (!selectedBatchId || selectedBatchId === 'ALL') {
      setNotification({ type: 'error', text: "Harap pilih periode wisuda spesifik untuk menyetujui seluruh batch!" });
      return;
    }

    if (filteredDrafts.length === 0) return;

    if (!confirm(`Apakah Anda yakin ingin menyetujui SELURUH (${filteredDrafts.length}) draf ijazah dalam periode ini sekaligus?`)) {
      return;
    }

    setBulkProcessing(true);
    setNotification(null);

    try {
      const res = await fetch('/api/drafts/bulk-approve-dekan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: selectedBatchId }),
      });
      const data = await res.json();

      if (data.success) {
        setNotification({
          type: 'success',
          text: `Berhasil menyetujui ${data.count} draf ijazah pada periode ini! Status diperbarui ke "MENUNGGU_REKTOR".`
        });
        setDrafts(prev => prev.filter(d => d.batch?.id !== selectedBatchId));
        setSelectedIds([]);
      } else {
        setNotification({ type: 'error', text: data.error || "Gagal menyetujui batch" });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setBulkProcessing(false);
    }
  };

  const isAllSelected = filteredDrafts.length > 0 && selectedIds.length === filteredDrafts.length;

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 relative">
      <div className="w-full max-w-6xl">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Portal Utama
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-300 font-mono">Role: Dekanat Fakultas (Checker)</span>
          </div>
        </div>

        {/* Title Header */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 mb-6 border border-emerald-500/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <UserCheck className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Dasbor Dekanat (Checker)</h1>
                <p className="text-slate-400 text-sm">
                  Pemeriksaan dan persetujuan draf ijazah mahasiswa dari staf BAK sebelum diajukan ke Rektorat.
                </p>
              </div>
            </div>

            {/* Filter Periode Wisuda */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-2">
                <Filter className="w-4 h-4 text-emerald-400" />
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
            <div>{notification.text}</div>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="glass-panel rounded-2xl p-4 md:p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectAll}
              disabled={filteredDrafts.length === 0}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all disabled:opacity-50"
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-emerald-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              {isAllSelected ? 'Batalkan Semua' : 'Pilih Semua'}
            </button>

            <span className="text-xs text-slate-400 font-mono">
              Terpilih: <strong className="text-emerald-400">{selectedIds.length}</strong> dari {filteredDrafts.length} draf
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Tombol Setujui Terpilih */}
            <button
              type="button"
              onClick={handleBulkApprove}
              disabled={selectedIds.length === 0 || bulkProcessing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCheck className="w-4 h-4" />
              {bulkProcessing ? 'Memproses Persetujuan...' : `Setujui Terpilih (${selectedIds.length})`}
            </button>

            {/* Tombol Setujui Seluruh Batch */}
            {selectedBatchId !== 'ALL' && filteredDrafts.length > 0 && (
              <button
                type="button"
                onClick={handleApproveEntireBatch}
                disabled={bulkProcessing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-300 font-semibold text-xs transition-all disabled:opacity-40"
              >
                Setujui Seluruh Batch ({filteredDrafts.length})
              </button>
            )}
          </div>
        </div>

        {/* Tabel Data Draf */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-400" />
              Draf Menunggu Persetujuan Dekanat ({filteredDrafts.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
              Memuat draf ijazah...
            </div>
          ) : filteredDrafts.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              Tidak ada draf yang menunggu persetujuan Dekanat pada filter ini.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-700/60">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-slate-800/80">
                  <tr>
                    <th className="px-4 py-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3">Nomor Ijazah</th>
                    <th className="px-4 py-3">Nama Mahasiswa</th>
                    <th className="px-4 py-3">NPM</th>
                    <th className="px-4 py-3">Fakultas</th>
                    <th className="px-4 py-3">Periode Wisuda</th>
                    <th className="px-4 py-3 text-right">Aksi Satuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredDrafts.map((d) => {
                    const isSelected = selectedIds.includes(d.id);
                    return (
                      <tr 
                        key={d.id} 
                        className={`transition-colors ${
                          isSelected ? 'bg-emerald-500/10' : 'hover:bg-slate-800/30'
                        }`}
                      >
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(d.id)}
                            className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
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
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleApproveSingle(d.id, d.nama)}
                            disabled={processingId === d.id || bulkProcessing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white font-semibold text-xs transition-all disabled:opacity-40"
                          >
                            {processingId === d.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            {processingId === d.id ? 'Memproses...' : 'Setujui'}
                          </button>
                        </td>
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

import React, { useState } from 'react';
import { Pelanggaran, Role } from '../types';
import { Search, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';

interface PelanggaranListProps {
  violations: Pelanggaran[];
  userRole: Role;
  onAddViolation: (violation: Omit<Pelanggaran, 'id'> & { id?: string }) => Promise<boolean>;
  onDeleteViolation: (id: string) => Promise<boolean>;
}

export default function PelanggaranList({ violations, userRole, onAddViolation, onDeleteViolation }: PelanggaranListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | 'Ringan' | 'Sedang' | 'Berat'>('Semua');

  // Modal forms state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Tambah Jenis Pelanggaran');
  const [errorMsg, setErrorMsg] = useState('');
  const [formState, setFormState] = useState<Omit<Pelanggaran, 'id'> & { id?: string }>({
    kode: '',
    namaPelanggaran: '',
    kategori: 'Ringan',
    poin: 5
  });

  // Delete confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canEdit = userRole === 'Admin' || userRole === 'Guru BK';

  // 1. Filter and Search
  const filteredViolations = violations.filter(item => {
    const matchesSearch = item.namaPelanggaran.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.kode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Semua' || item.kategori === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // 2. Open Modal for Add
  const handleOpenAdd = () => {
    // Generate sequential suggestions or blank
    setModalTitle('Tambah Jenis Pelanggaran');
    setFormState({
      kode: '',
      namaPelanggaran: '',
      kategori: 'Ringan',
      poin: 5
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // 3. Open Modal for Edit
  const handleOpenEdit = (item: Pelanggaran) => {
    setModalTitle('Edit Jenis Pelanggaran');
    setFormState(item);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // 4. Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formState.kode.trim() || !formState.namaPelanggaran.trim() || formState.poin === undefined) {
      setErrorMsg('Semua kolom wajib diisi.');
      return;
    }

    if (formState.poin <= 0) {
      setErrorMsg('Poin pelanggaran harus bernilai positif.');
      return;
    }

    const success = await onAddViolation(formState);
    if (success) {
      setIsModalOpen(false);
    } else {
      setErrorMsg('Gagal menyimpan jenis pelanggaran. Kode mungkin sudah digunakan.');
    }
  };

  const handleDelete = async (id: string) => {
    const success = await onDeleteViolation(id);
    if (success) {
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight font-display">Master Aturan Pelanggaran</h2>
          <p className="text-xs text-slate-500">Kumpulan kode aturan kesiswaan, kategori, serta bobot poin sanksi</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Category Filter Pills */}
          <div className="flex border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-xs font-semibold">
            {(['Semua', 'Ringan', 'Sedang', 'Berat'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${categoryFilter === cat ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {canEdit && (
            <button
              id="btn-tambah-pelanggaran"
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4.5 h-4.5" /> Tambah Pelanggaran
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
        <input
          id="search-violations-input"
          type="text"
          placeholder="Cari kode atau deskripsi jenis pelanggaran..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 pr-4 py-2 w-full text-sm bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none transition-all"
        />
      </div>

      {/* Grid displaying the rules cards or rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredViolations.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 italic">
            Tidak ada jenis pelanggaran yang cocok dengan pencarian Anda.
          </div>
        ) : (
          filteredViolations.map((item) => {
            const catBadgeColor = item.kategori === 'Berat' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                                  item.kategori === 'Sedang' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                  'bg-emerald-50 border-emerald-100 text-emerald-700';
            
            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all relative flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-400">{item.kode}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${catBadgeColor}`}>
                      {item.kategori}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">
                    {item.namaPelanggaran}
                  </h3>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black font-mono text-slate-950">{item.poin}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Poin</span>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                        title="Edit Aturan"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(item.id)}
                        className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Hapus Aturan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-950 font-display">{modalTitle}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5 col-span-1">
                  <label className="text-xs font-semibold text-slate-500 block">Kode</label>
                  <input
                    type="text"
                    required
                    value={formState.kode}
                    onChange={(e) => setFormState(prev => ({ ...prev, kode: e.target.value.toUpperCase() }))}
                    placeholder="Contoh: PK01"
                    className="w-full px-3 py-2 text-sm border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all font-mono uppercase"
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-slate-500 block">Kategori</label>
                  <select
                    value={formState.kategori}
                    onChange={(e) => {
                      const cat = e.target.value as 'Ringan' | 'Sedang' | 'Berat';
                      // Auto populate suggested points based on category
                      const suggestedPoin = cat === 'Berat' ? 50 : cat === 'Sedang' ? 20 : 5;
                      setFormState(prev => ({ ...prev, kategori: cat, poin: suggestedPoin }));
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all bg-white"
                  >
                    <option value="Ringan">Ringan (Teguran Lisan/Tertulis)</option>
                    <option value="Sedang">Sedang (Panggilan Ortu)</option>
                    <option value="Berat">Berat (Surat Peringatan/Disiplin)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 block">Bobot Sanksi (Poin)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formState.poin}
                  onChange={(e) => setFormState(prev => ({ ...prev, poin: parseInt(e.target.value, 10) || 0 }))}
                  placeholder="Bobot poin sanksi"
                  className="w-full px-3 py-2 text-sm border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 block">Nama / Deskripsi Pelanggaran</label>
                <textarea
                  required
                  rows={3}
                  value={formState.namaPelanggaran}
                  onChange={(e) => setFormState(prev => ({ ...prev, namaPelanggaran: e.target.value }))}
                  placeholder="Contoh: Membolos saat jam pelajaran berlangsung tanpa keterangan..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Aturan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-100 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-full">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg font-display">Hapus Aturan Pelanggaran</h3>
            </div>
            
            <p className="text-sm text-slate-600">
              Apakah Anda yakin ingin menghapus sanksi pelanggaran ini dari basis data master? Hal ini tidak akan mempengaruhi poin yang sudah tercatat pada siswa secara historis, tetapi jenis pelanggaran ini tidak lagi dapat dipilih dalam form pencatatan.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

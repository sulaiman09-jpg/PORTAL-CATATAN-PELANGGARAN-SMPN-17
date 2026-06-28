import React, { useState } from 'react';
import { Siswa, Role, Pencatatan } from '../types';
import { Search, UserPlus, Edit2, Trash2, X, AlertCircle, CreditCard } from 'lucide-react';
import KartuKesiswaan from './KartuKesiswaan';

interface SiswaListProps {
  siswa: Siswa[];
  pencatatan: Pencatatan[];
  userRole: Role;
  onAddStudent: (student: Omit<Siswa, 'id'> & { id?: string }) => Promise<boolean>;
  onDeleteStudent: (id: string) => Promise<boolean>;
}

export default function SiswaList({ siswa, pencatatan, userRole, onAddStudent, onDeleteStudent }: SiswaListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSiswaForCard, setSelectedSiswaForCard] = useState<Siswa | null>(null);
  const itemsPerPage = 8;

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Tambah Siswa Baru');
  const [errorMsg, setErrorMsg] = useState('');
  const [formState, setFormState] = useState<Omit<Siswa, 'id'> & { id?: string }>({
    nis: '',
    nama: '',
    kelas: '',
    jk: 'L',
    namaOrangTua: '',
    noHp: '',
    foto: ''
  });

  // Delete confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canEdit = userRole === 'Admin' || userRole === 'Guru BK';

  // 1. Filter and search
  const filteredStudents = siswa.filter(student => 
    student.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.nis.includes(searchTerm) ||
    student.kelas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 2. Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 3. Open Modal for Add
  const handleOpenAdd = () => {
    setModalTitle('Tambah Siswa Baru');
    setFormState({
      nis: '',
      nama: '',
      kelas: '',
      jk: 'L',
      namaOrangTua: '',
      noHp: '',
      foto: ''
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // 4. Open Modal for Edit
  const handleOpenEdit = (student: Siswa) => {
    setModalTitle('Edit Data Siswa');
    setFormState({
      ...student,
      foto: student.foto || ''
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Image compression and base64 helper for student profile
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setFormState(prev => ({ ...prev, foto: compressedBase64 }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // 5. Submit Form (Save student)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!formState.nis.trim() || !formState.nama.trim() || !formState.kelas.trim() || !formState.namaOrangTua.trim() || !formState.noHp.trim()) {
      setErrorMsg('Semua kolom wajib diisi.');
      return;
    }

    if (!/^\d+$/.test(formState.nis)) {
      setErrorMsg('NIS harus berupa angka.');
      return;
    }

    if (!/^\d+$/.test(formState.noHp)) {
      setErrorMsg('No HP Orang Tua harus berupa angka.');
      return;
    }

    // Call callback to parent component
    const success = await onAddStudent(formState);
    if (success) {
      setIsModalOpen(false);
    } else {
      setErrorMsg('Gagal menyimpan data siswa. NIS mungkin sudah terdaftar.');
    }
  };

  const handleDelete = async (id: string) => {
    const success = await onDeleteStudent(id);
    if (success) {
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
      {/* Search and action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight font-display">Manajemen Data Siswa</h2>
          <p className="text-xs text-slate-500">Kelola informasi data diri, kelas, dan nomor kontak orang tua siswa</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <input
              id="search-siswa-input"
              type="text"
              placeholder="Cari NIS, nama, kelas..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-4 py-2 w-full text-sm bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none transition-all"
            />
          </div>

          {canEdit && (
            <button
              id="btn-tambah-siswa"
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <UserPlus className="w-4 h-4" /> Tambah Siswa
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
        <table id="tbl-siswa" className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-center">No</th>
              <th className="py-3 px-4 w-28">NIS</th>
              <th className="py-3 px-4">Nama Lengkap</th>
              <th className="py-3 px-4 w-24 text-center">Kelas</th>
              <th className="py-3 px-4 w-16 text-center">JK</th>
              <th className="py-3 px-4">Orang Tua (Wali)</th>
              <th className="py-3 px-4">No. HP Wali</th>
              <th className="py-3 px-4 w-36 text-center">Kartu Digital</th>
              {canEdit && <th className="py-3 px-4 w-28 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-700 text-sm">
            {paginatedStudents.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 9 : 8} className="py-10 text-center text-slate-400 italic">
                  Tidak ada data siswa ditemukan.
                </td>
              </tr>
            ) : (
              paginatedStudents.map((student, idx) => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 text-center text-xs font-mono text-slate-400">
                    {(currentPage - 1) * itemsPerPage + idx + 1}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">{student.nis}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{student.nama}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-700 text-xs font-mono">
                      {student.kelas}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${student.jk === 'L' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                      {student.jk}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{student.namaOrangTua}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{student.noHp}</td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedSiswaForCard(student)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      title="Unduh Kartu Pelajar & Pelanggaran Digital"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Unduh Kartu
                    </button>
                  </td>
                  {canEdit && (
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Edit Siswa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(student.id)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Hapus Siswa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-50 pt-4 text-slate-500 text-xs">
          <span>Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredStudents.length)} dari {filteredStudents.length} siswa</span>
          <div className="flex items-center gap-1.5 font-mono">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50 font-bold transition-all cursor-pointer"
            >
              Sebelumnya
            </button>
            <span className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg font-bold">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50 font-bold transition-all cursor-pointer"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}

      {/* CREATE & EDIT DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-950 font-display">{modalTitle}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-slate-500 block">NIS (Nomor Induk Siswa)</label>
                  <input
                    type="text"
                    required
                    value={formState.nis}
                    onChange={(e) => setFormState(prev => ({ ...prev, nis: e.target.value }))}
                    placeholder="Contoh: 21001"
                    className="w-full px-3 py-2 text-sm border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all font-mono"
                    disabled={!!formState.id} // NIS can't be changed on edit to avoid corruption
                  />
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-slate-500 block">Kelas</label>
                  <input
                    type="text"
                    required
                    value={formState.kelas}
                    onChange={(e) => setFormState(prev => ({ ...prev, kelas: e.target.value.toUpperCase() }))}
                    placeholder="Contoh: 9-A"
                    className="w-full px-3 py-2 text-sm border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 block">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  value={formState.nama}
                  onChange={(e) => setFormState(prev => ({ ...prev, nama: e.target.value }))}
                  placeholder="Nama Lengkap"
                  className="w-full px-3 py-2 text-sm border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 block">Jenis Kelamin</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="jk"
                      value="L"
                      checked={formState.jk === 'L'}
                      onChange={() => setFormState(prev => ({ ...prev, jk: 'L' }))}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    Laki-laki (L)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="jk"
                      value="P"
                      checked={formState.jk === 'P'}
                      onChange={() => setFormState(prev => ({ ...prev, jk: 'P' }))}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    Perempuan (P)
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 block">Nama Orang Tua / Wali</label>
                <input
                  type="text"
                  required
                  value={formState.namaOrangTua}
                  onChange={(e) => setFormState(prev => ({ ...prev, namaOrangTua: e.target.value }))}
                  placeholder="Nama Ibu/Ayah/Wali"
                  className="w-full px-3 py-2 text-sm border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 block">Nomor HP Orang Tua (Wali) - Aktif WhatsApp</label>
                <input
                  type="text"
                  required
                  value={formState.noHp}
                  onChange={(e) => setFormState(prev => ({ ...prev, noHp: e.target.value }))}
                  placeholder="Contoh: 08123456789"
                  className="w-full px-3 py-2 text-sm border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 block">Foto Profil Siswa (Opsional untuk Kartu Digital)</label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100/50 transition-colors">
                  <div className="relative flex flex-col items-center justify-center w-full h-24 border border-dashed border-slate-300 rounded-xl bg-white hover:bg-blue-50/20 transition-all overflow-hidden cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="space-y-1 text-center p-2">
                      <svg className="mx-auto h-6 w-6 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-[11px] font-medium text-slate-600">
                        Pilih foto profil (PNG/JPG)
                      </p>
                    </div>
                  </div>
                  {formState.foto && (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shrink-0 shadow-sm bg-white">
                      <img src={formState.foto} alt="Pratinjau Siswa" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormState(prev => ({ ...prev, foto: '' }))}
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 shadow-md transition-colors cursor-pointer"
                        title="Hapus foto"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
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
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-100 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-full">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg font-display">Konfirmasi Hapus Data</h3>
            </div>
            
            <p className="text-sm text-slate-600">
              Apakah Anda yakin ingin menghapus data siswa ini? Tindakan ini <strong className="text-red-600">permanen</strong> dan akan menghapus seluruh riwayat pelanggaran serta pembinaan yang terikat dengan siswa ini.
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
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CARD PREVIEW & DOWNLOAD MODAL */}
      {selectedSiswaForCard !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-3xl border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 max-h-[90vh] overflow-y-auto">
              <KartuKesiswaan 
                siswa={selectedSiswaForCard} 
                pencatatan={pencatatan} 
                onClose={() => setSelectedSiswaForCard(null)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

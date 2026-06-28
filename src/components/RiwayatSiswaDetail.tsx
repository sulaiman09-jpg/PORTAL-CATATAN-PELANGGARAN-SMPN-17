import React, { useState } from 'react';
import { Siswa, Pencatatan, Pembinaan, Role } from '../types';
import { Search, UserCheck, ShieldAlert, Award, AlertCircle, FileText, Trash2 } from 'lucide-react';
import KartuKesiswaan from './KartuKesiswaan';

interface RiwayatSiswaDetailProps {
  siswa: Siswa[];
  pencatatan: Pencatatan[];
  pembinaan: Pembinaan[];
  userRole: Role;
  onDeleteRecord: (id: string) => Promise<boolean>;
  selectedNisFromOutside?: string; // Support navigating directly from dashboard click
}

export default function RiwayatSiswaDetail({
  siswa,
  pencatatan,
  pembinaan,
  userRole,
  onDeleteRecord,
  selectedNisFromOutside
}: RiwayatSiswaDetailProps) {
  
  const [selectedNis, setSelectedNis] = useState(selectedNisFromOutside || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Sync state if selected from dashboard
  React.useEffect(() => {
    if (selectedNisFromOutside) {
      setSelectedNis(selectedNisFromOutside);
    }
  }, [selectedNisFromOutside]);

  const canDelete = userRole === 'Admin' || userRole === 'Guru BK';

  // 1. Filter dropdown results
  const filteredStudents = siswa.filter(s =>
    s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nis.includes(searchQuery) ||
    s.kelas.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedStudent = siswa.find(s => s.nis === selectedNis);

  // 2. Filter records for this student
  const studentRecords = selectedStudent
    ? pencatatan.filter(r => r.nis === selectedStudent.nis).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
    : [];

  const studentCoaching = selectedStudent
    ? pembinaan.filter(p => p.nis === selectedStudent.nis).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
    : [];

  const totalPoints = studentRecords.reduce((sum, r) => sum + r.poin, 0);

  // Determine current active coaching (pembinaan) status
  const getCoachingStatus = (poin: number) => {
    if (poin === 0) return { title: 'Siswa Berkelakuan Baik', color: 'bg-emerald-500 text-white', border: 'border-emerald-100', textCol: 'text-emerald-700', bgCol: 'bg-emerald-50' };
    if (poin <= 25) return { title: 'Teguran Lisan', color: 'bg-yellow-500 text-slate-900', border: 'border-yellow-200', textCol: 'text-yellow-700', bgCol: 'bg-yellow-50' };
    if (poin <= 50) return { title: 'Teguran Tertulis', color: 'bg-amber-500 text-white', border: 'border-amber-200', textCol: 'text-amber-700', bgCol: 'bg-amber-50' };
    if (poin <= 75) return { title: 'Pemanggilan Orang Tua', color: 'bg-orange-500 text-white', border: 'border-orange-200', textCol: 'text-orange-700', bgCol: 'bg-orange-50' };
    if (poin <= 100) return { title: 'Surat Peringatan', color: 'bg-red-500 text-white', border: 'border-red-200', textCol: 'text-red-700', bgCol: 'bg-red-50' };
    return { title: 'Sidang Disiplin', color: 'bg-slate-950 text-red-400 border-slate-800', border: 'border-slate-950', textCol: 'text-rose-950', bgCol: 'bg-red-50/70' };
  };

  const currentStatus = getCoachingStatus(totalPoints);

  // Progress Bar scale calculations
  const progressPercent = Math.min((totalPoints / 100) * 100, 100);

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus catatan pelanggaran ini? Poin siswa akan otomatis dikalkulasi ulang.')) {
      await onDeleteRecord(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Input Selector */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight font-display">Riwayat & Kartu Pelanggaran Siswa</h2>
          <p className="text-xs text-slate-500 font-sans">Masukkan NIS atau nama siswa untuk memuat kartu digital kesiswaan lengkap</p>
        </div>

        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
            <input
              id="search-student-history-input"
              type="text"
              placeholder={selectedStudent ? `${selectedStudent.nama} (${selectedStudent.kelas})` : "Ketik NIS, nama siswa, atau kelas..."}
              value={searchQuery}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              className="pl-10 pr-4 py-2.5 w-full text-sm bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all font-semibold"
            />
          </div>

          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-50">
              {filteredStudents.length === 0 ? (
                <div className="p-4 text-center text-slate-400 italic text-xs">
                  Siswa tidak ditemukan.
                </div>
              ) : (
                filteredStudents.map(s => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedNis(s.nis);
                      setSearchQuery('');
                      setIsDropdownOpen(false);
                    }}
                    className="p-3 hover:bg-slate-50 cursor-pointer text-xs flex justify-between items-center transition-all"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{s.nama}</span>
                      <span className="text-slate-400 font-mono">NIS: {s.nis} | Kelas {s.kelas}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-600 text-[10px]">
                      Pilih
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main detail card displays if student is selected */}
      {!selectedStudent ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700">Kartu Pelanggaran Belum Dimuat</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Gunakan kolom pencarian di atas untuk memilih siswa dan menampilkan detail poin serta riwayat pembinaan kesiswaan.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Student details header + points scale */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Biography Widget */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 font-sans">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-xl font-display">
                  {selectedStudent.nama.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 text-lg tracking-tight leading-snug">{selectedStudent.nama}</h3>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-mono font-extrabold mt-1 inline-block">
                    Kelas {selectedStudent.kelas}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-50 text-xs font-sans space-y-3 pt-2">
                <div className="flex justify-between py-2 text-slate-600">
                  <span>NIS (No Induk Siswa)</span>
                  <span className="font-mono font-bold text-slate-900">{selectedStudent.nis}</span>
                </div>
                <div className="flex justify-between py-3 text-slate-600">
                  <span>Jenis Kelamin</span>
                  <span className="font-bold text-slate-900">{selectedStudent.jk === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}</span>
                </div>
                <div className="flex justify-between py-3 text-slate-600">
                  <span>Nama Orang Tua</span>
                  <span className="font-bold text-slate-900">{selectedStudent.namaOrangTua}</span>
                </div>
                <div className="flex justify-between py-3 text-slate-600">
                  <span>WhatsApp Orang Tua</span>
                  <span className="font-mono font-bold text-slate-900">{selectedStudent.noHp}</span>
                </div>
              </div>
            </div>

            {/* Points & coaching scale panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-6 font-sans">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-950 text-base">Status Pembinaan Kesiswaan</h3>
                  <p className="text-xs text-slate-500">Milestone akumulasi poin pelanggaran dan tingkat tindakan sanksi</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block uppercase tracking-wider font-semibold">Total Poin</span>
                  <span className="text-3xl font-black font-mono text-slate-950">{totalPoints}</span>
                </div>
              </div>

              {/* Progress Slider bar */}
              <div className="space-y-3.5 pt-2">
                <div className="relative">
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        totalPoints > 100 ? 'bg-slate-950' :
                        totalPoints > 75 ? 'bg-red-500' :
                        totalPoints > 50 ? 'bg-orange-500' :
                        totalPoints > 25 ? 'bg-amber-500' :
                        totalPoints > 0 ? 'bg-yellow-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Milestones labels */}
                <div className="grid grid-cols-5 text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono text-center">
                  <div className={totalPoints <= 25 && totalPoints > 0 ? 'text-yellow-600 font-black' : ''}>
                    Lisan
                    <span className="block text-[8px] font-normal font-sans">0-25</span>
                  </div>
                  <div className={totalPoints > 25 && totalPoints <= 50 ? 'text-amber-600 font-black' : ''}>
                    Tertulis
                    <span className="block text-[8px] font-normal font-sans">26-50</span>
                  </div>
                  <div className={totalPoints > 50 && totalPoints <= 75 ? 'text-orange-600 font-black' : ''}>
                    Ortu
                    <span className="block text-[8px] font-normal font-sans">51-75</span>
                  </div>
                  <div className={totalPoints > 75 && totalPoints <= 100 ? 'text-red-600 font-black' : ''}>
                    Peringatan
                    <span className="block text-[8px] font-normal font-sans">76-100</span>
                  </div>
                  <div className={totalPoints > 100 ? 'text-slate-950 font-black' : ''}>
                    Disiplin
                    <span className="block text-[8px] font-normal font-sans">&gt;100</span>
                  </div>
                </div>
              </div>

              {/* Status explanation alert badge */}
              <div className={`p-4 rounded-xl border flex gap-3 ${currentStatus.bgCol} ${currentStatus.border}`}>
                {totalPoints === 0 ? (
                  <Award className="w-6 h-6 text-emerald-500 shrink-0" />
                ) : (
                  <ShieldAlert className={`w-6 h-6 shrink-0 ${currentStatus.textCol}`} />
                )}
                <div className="space-y-1">
                  <span className={`text-xs font-black uppercase tracking-wider ${currentStatus.textCol}`}>
                    Rekomendasi Tindakan: {currentStatus.title}
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {totalPoints === 0 && 'Siswa berkelakuan sangat baik, tidak memiliki catatan poin sanksi pelanggaran di sekolah.'}
                    {totalPoints > 0 && totalPoints <= 25 && 'Siswa harus diberikan pembinaan berupa Teguran Lisan terstruktur oleh Guru Piket.'}
                    {totalPoints > 25 && totalPoints <= 50 && 'Siswa perlu diberikan Teguran Tertulis resmi yang ditandatangani oleh Guru Piket dan Guru BK.'}
                    {totalPoints > 50 && totalPoints <= 75 && 'Guru BK wajib melayangkan surat panggilan resmi kepada orang tua/wali siswa ke sekolah.'}
                    {totalPoints > 75 && totalPoints <= 100 && 'Kepala Sekolah didampingi BK melayangkan Surat Peringatan (SP) keras untuk siswa bersangkutan.'}
                    {totalPoints > 100 && 'Siswa harus segera dihadapkan pada Sidang Disiplin Dewan Guru untuk penentuan kelanjutan studi.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Kartu Digital & Kartu Pelanggaran Section */}
          <KartuKesiswaan siswa={selectedStudent} pencatatan={pencatatan} />

          {/* Ledger logs tables (Violations & Coaching History) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Violations log - taking 2 cols */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4 font-sans">
              <h4 className="font-bold text-slate-800 text-sm font-display">Riwayat Kejadian Pelanggaran</h4>
              
              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Jenis Pelanggaran</th>
                      <th className="py-2.5 px-3 w-16 text-center">Poin</th>
                      <th className="py-2.5 px-3">Petugas BK</th>
                      <th className="py-2.5 px-3">Keterangan</th>
                      <th className="py-2.5 px-3">Foto Bukti</th>
                      {canDelete && <th className="py-2.5 px-3 w-12 text-center">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-600 text-xs">
                    {studentRecords.length === 0 ? (
                      <tr>
                        <td colSpan={canDelete ? 7 : 6} className="py-10 text-center italic text-slate-400">
                          Siswa bersih dari riwayat pelanggaran.
                        </td>
                      </tr>
                    ) : (
                      studentRecords.map(record => (
                        <tr key={record.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-mono text-slate-500 font-semibold">{record.tanggal}</td>
                          <td className="py-3 px-3 font-bold text-slate-800">{record.pelanggaran}</td>
                          <td className="py-3 px-3 text-center font-mono font-black text-rose-600 text-sm">+{record.poin}</td>
                          <td className="py-3 px-3 text-slate-500 font-medium">{record.petugas}</td>
                          <td className="py-3 px-3 italic max-w-xs truncate" title={record.keterangan}>
                            {record.keterangan || '-'}
                          </td>
                          <td className="py-3 px-3">
                            {record.foto ? (
                              <div className="relative group/photo inline-block">
                                <img
                                  src={record.foto}
                                  alt="Bukti"
                                  className="w-10 h-10 object-cover rounded-lg border border-slate-200 transition-all duration-300 hover:scale-[3.0] hover:translate-x-[-12px] hover:translate-y-[-12px] hover:z-50 relative cursor-zoom-in"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          {canDelete && (
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => handleDeleteRecord(record.id)}
                                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                                title="Batalkan/Hapus Kasus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Coaching intervention history logs - taking 1 col */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 font-sans">
              <h4 className="font-bold text-slate-800 text-sm font-display">Riwayat Pembinaan Resmi</h4>
              
              <div className="space-y-3">
                {studentCoaching.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 italic text-xs">
                    Belum ada riwayat surat tindakan pembinaan terbit.
                  </div>
                ) : (
                  studentCoaching.map(coaching => (
                    <div key={coaching.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                        <span>{coaching.tanggal}</span>
                        <span className="font-semibold">Kode ID: {coaching.id}</span>
                      </div>
                      
                      <span className="text-xs font-bold text-slate-800 block">{coaching.tindakan}</span>
                      
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                        <span>Bobot Kumulatif:</span>
                        <span className="font-mono font-bold text-slate-900">{coaching.totalPoin} Poin</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

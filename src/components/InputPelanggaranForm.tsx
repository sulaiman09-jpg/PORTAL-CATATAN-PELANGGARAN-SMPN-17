import React, { useState, useEffect } from 'react';
import { Siswa, Pelanggaran, User } from '../types';
import { AlertCircle, Calendar, UserCheck, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

interface InputPelanggaranFormProps {
  siswa: Siswa[];
  violations: Pelanggaran[];
  currentUser: User;
  onAddRecord: (record: {
    nis: string;
    pelanggaran: string;
    tanggal: string;
    petugas: string;
    keterangan: string;
    foto?: string;
  }) => Promise<boolean>;
}

export default function InputPelanggaranForm({
  siswa,
  violations,
  currentUser,
  onAddRecord
}: InputPelanggaranFormProps) {
  
  // Form states
  const [selectedNis, setSelectedNis] = useState('');
  const [selectedViolationName, setSelectedViolationName] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [petugas, setPetugas] = useState(currentUser.nama || '');
  const [keterangan, setKeterangan] = useState('');
  const [fotoBase64, setFotoBase64] = useState('');

  // UI States
  const [searchSiswaQuery, setSearchSiswaQuery] = useState('');
  const [isSiswaDropdownOpen, setIsSiswaDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-fill officer name when current user changes
  useEffect(() => {
    if (currentUser) {
      setPetugas(currentUser.nama);
    }
  }, [currentUser]);

  // Find active selected objects for real-time calculations
  const selectedStudentObj = siswa.find(s => s.nis === selectedNis);
  const selectedViolationObj = violations.find(v => v.namaPelanggaran === selectedViolationName);

  // Search filtered student list
  const filteredSiswaList = siswa.filter(s =>
    s.nama.toLowerCase().includes(searchSiswaQuery.toLowerCase()) ||
    s.nis.includes(searchSiswaQuery) ||
    s.kelas.toLowerCase().includes(searchSiswaQuery.toLowerCase())
  );

  // Image compression and base64 helper
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
          setFotoBase64(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setFormSuccess(false);

    if (!selectedNis) {
      setErrorMsg('Pilih siswa yang melakukan pelanggaran.');
      return;
    }

    if (!selectedViolationName) {
      setErrorMsg('Pilih jenis pelanggaran.');
      return;
    }

    if (!petugas.trim()) {
      setErrorMsg('Nama petugas pencatat harus diisi.');
      return;
    }

    setIsLoading(true);

    const success = await onAddRecord({
      nis: selectedNis,
      pelanggaran: selectedViolationName,
      tanggal,
      petugas,
      keterangan,
      foto: fotoBase64
    });

    setIsLoading(false);

    if (success) {
      setFormSuccess(true);
      // Reset parts of the form
      setSelectedNis('');
      setSelectedViolationName('');
      setKeterangan('');
      setFotoBase64('');
      setSearchSiswaQuery('');
      
      // Auto fade-out success banner after 5 seconds
      setTimeout(() => {
        setFormSuccess(false);
      }, 5000);
    } else {
      setErrorMsg('Gagal mencatat pelanggaran ke database server.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Form Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-2 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight font-display">Catat Kasus Pelanggaran Baru</h2>
          <p className="text-xs text-slate-500">Isi formulir resmi untuk merekam pelanggaran tata tertib dan menghitung akumulasi poin sanksi</p>
        </div>

        {formSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-sm flex items-start gap-2.5 animate-in fade-in duration-350">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Pencatatan Berhasil Disimpan!</span>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Pelanggaran kesiswaan berhasil terekam ke database. Poin akumulatif siswa dan status tindakan pembinaan (Pembinaan) otomatis disinkronkan.
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. SELECT SISWA (WITH DROPDOWN FILTER) */}
          <div className="space-y-1.5 relative">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">1. Cari & Pilih Siswa</label>
            
            <div className="relative">
              <input
                id="siswa-selector-input"
                type="text"
                placeholder={selectedStudentObj ? `${selectedStudentObj.nama} (Kelas ${selectedStudentObj.kelas})` : "Ketik nama, NIS, atau kelas siswa..."}
                value={searchSiswaQuery}
                onFocus={() => setIsSiswaDropdownOpen(true)}
                onChange={(e) => {
                  setSearchSiswaQuery(e.target.value);
                  setIsSiswaDropdownOpen(true);
                  if (selectedNis) setSelectedNis(''); // Clear selection if user types
                }}
                className={`w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all ${selectedStudentObj ? 'border-emerald-300 bg-emerald-50/10 font-bold text-slate-900' : ''}`}
              />
              {selectedStudentObj && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNis('');
                    setSearchSiswaQuery('');
                  }}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md"
                >
                  Ganti
                </button>
              )}
            </div>

            {/* Dropdown list */}
            {isSiswaDropdownOpen && !selectedNis && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-50">
                {filteredSiswaList.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 italic text-xs">
                    Siswa tidak ditemukan. Silakan cek nama atau NIS kembali.
                  </div>
                ) : (
                  filteredSiswaList.map(s => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedNis(s.nis);
                        setSearchSiswaQuery(`${s.nama} (${s.kelas})`);
                        setIsSiswaDropdownOpen(false);
                      }}
                      className="p-3 hover:bg-blue-50/50 cursor-pointer text-xs flex justify-between items-center transition-colors"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{s.nama}</span>
                        <span className="text-slate-400 font-mono">NIS: {s.nis}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-600">
                        Kelas {s.kelas}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 2. SELECT VIOLATION */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">2. Jenis Pelanggaran</label>
            <select
              id="violation-select"
              value={selectedViolationName}
              onChange={(e) => setSelectedViolationName(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all bg-white"
            >
              <option value="">-- Pilih Aturan Pelanggaran --</option>
              {violations.map(v => (
                <option key={v.id} value={v.namaPelanggaran}>
                  [{v.kode}] {v.namaPelanggaran} ({v.poin} Poin - {v.kategori})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 3. TANGGAL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">3. Tanggal Kejadian</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all font-mono"
                />
              </div>
            </div>

            {/* 4. PETUGAS */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">4. Nama Petugas BK / Guru</label>
              <div className="relative">
                <UserCheck className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={petugas}
                  onChange={(e) => setPetugas(e.target.value)}
                  placeholder="Ketik nama guru pelapor..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* 5. KETERANGAN */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">5. Keterangan Kasus / Kronologi</label>
            <textarea
              rows={4}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Jelaskan detail kasus secara objektif (lokasi, barang bukti, saksi, kronologi singkat)..."
              className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all resize-none"
            />
          </div>

          {/* 6. UPLOAD FOTO BUKTI */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">6. Upload Foto Bukti Pelanggaran (Opsional)</label>
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="flex-1">
                <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-4 text-center cursor-pointer transition-colors relative bg-slate-50/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1 text-slate-500">
                    <svg className="mx-auto h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs font-medium text-slate-600">
                      Klik untuk memilih atau seret gambar ke sini
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Format PNG, JPG, atau JPEG (Otomatis dikompres)
                    </p>
                  </div>
                </div>
              </div>
              {fotoBase64 && (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shrink-0 self-center">
                  <img src={fotoBase64} alt="Pratinjau" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFotoBase64('')}
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 shadow-md transition-colors"
                    title="Hapus foto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            id="btn-simpan-pencatatan"
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Menyimpan Kasus...
              </>
            ) : (
              'Simpan & Terapkan Poin Pelanggaran'
            )}
          </button>
        </form>
      </div>

      {/* Right Sidebar Widget: Real-time calculation previews */}
      <div className="space-y-6">
        {/* Student card info preview */}
        <div className="bg-blue-950 text-white rounded-2xl p-6 shadow-sm border border-blue-900 space-y-5">
          <span className="text-[10px] font-extrabold text-blue-400 tracking-wider uppercase block">Review Real-Time</span>
          
          <div className="border-b border-blue-900/50 pb-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-extrabold text-sm">
                {selectedStudentObj ? selectedStudentObj.nama.charAt(0) : '?'}
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-sm font-bold truncate block text-slate-100 font-display">
                  {selectedStudentObj ? selectedStudentObj.nama : 'Pilih Siswa Terlebih Dahulu'}
                </span>
                <span className="text-xs text-blue-300 block font-mono">
                  {selectedStudentObj ? `NIS: ${selectedStudentObj.nis} | Kelas ${selectedStudentObj.kelas}` : 'Menunggu input...'}
                </span>
              </div>
            </div>

            {selectedStudentObj && (
              <div className="grid grid-cols-2 gap-3 text-xs bg-blue-900/20 p-3 rounded-xl border border-blue-900/40">
                <div className="space-y-0.5">
                  <span className="text-blue-300 text-[10px]">Orang Tua</span>
                  <span className="font-semibold block truncate text-slate-100">{selectedStudentObj.namaOrangTua}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-blue-300 text-[10px]">HP Wali</span>
                  <span className="font-semibold block font-mono text-slate-100">{selectedStudentObj.noHp}</span>
                </div>
              </div>
            )}
          </div>

          {/* Sanksi Preview */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-blue-300">Aturan Sanksi Terpilih</span>
              <span className="font-mono text-slate-200 font-bold">{selectedViolationObj ? selectedViolationObj.kode : '-'}</span>
            </div>
            
            <p className="text-xs text-blue-200/80 leading-relaxed italic">
              {selectedViolationObj ? `"${selectedViolationObj.namaPelanggaran}"` : '"Pilihlah salah satu sanksi untuk melihat bobot pelanggaran."'}
            </p>

            <div className="flex justify-between items-end border-t border-blue-900/50 pt-4">
              <div className="space-y-0.5">
                <span className="text-blue-300 text-[10px] block uppercase tracking-wider font-semibold">Tingkat Keparahan</span>
                <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border inline-block ${
                  selectedViolationObj?.kategori === 'Berat' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                  selectedViolationObj?.kategori === 'Sedang' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  selectedViolationObj?.kategori === 'Ringan' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  'bg-blue-900/30 text-blue-400 border-blue-900/40'
                }`}>
                  {selectedViolationObj ? selectedViolationObj.kategori : 'Belum dipilih'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-blue-300 text-[10px] block uppercase tracking-wider">Bobot Poin</span>
                <span className="text-3xl font-black font-mono text-white tracking-tight">
                  +{selectedViolationObj ? selectedViolationObj.poin : 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Informative Guidance */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-xs text-blue-800 space-y-3">
          <div className="flex items-center gap-2 text-blue-900 font-bold">
            <ShieldAlert className="w-4.5 h-4.5" />
            <span>Penting untuk Petugas BK</span>
          </div>
          <p className="leading-relaxed">
            Pencatatan poin ini bersifat mengikat. Sanksi pembinaan siswa akan dikalkulasikan secara kumulatif. Pastikan kronologi diisi secara jujur dan objektif guna menghindari perselisihan data di kemudian hari.
          </p>
        </div>
      </div>
    </div>
  );
}

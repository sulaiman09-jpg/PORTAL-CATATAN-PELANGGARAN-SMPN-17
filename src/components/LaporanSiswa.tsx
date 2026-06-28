import React, { useState } from 'react';
import { Siswa, Pencatatan } from '../types';
import { Calendar, Search, Download, Printer, ShieldAlert, FileSpreadsheet, FileText, Filter, CalendarCheck, CalendarDays, CalendarRange, Sparkles } from 'lucide-react';

interface LaporanSiswaProps {
  pencatatan: Pencatatan[];
  siswa: Siswa[];
}

export default function LaporanSiswa({ pencatatan, siswa }: LaporanSiswaProps) {
  // Robust Date Normalizer to convert any format (e.g., DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, ISO timestamps) to YYYY-MM-DD
  const normalizeDate = (dateStr: any): string => {
    if (!dateStr) return '';
    let str = String(dateStr).trim();
    
    // Extract date portion if there is a timestamp (T) or whitespace
    if (str.includes('T')) {
      str = str.split('T')[0];
    } else if (str.includes(' ')) {
      str = str.split(' ')[0];
    }
    
    // 1. If it has slashes (e.g., DD/MM/YYYY or YYYY/MM/DD)
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY/MM/DD
          return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else {
          // DD/MM/YYYY -> YYYY-MM-DD
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    }
    
    // 2. If it has dashes
    if (str.includes('-')) {
      const parts = str.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY-MM-DD -> ensure padded format
          return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else {
          // DD-MM-YYYY -> YYYY-MM-DD
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    }
    
    return str.substring(0, 10);
  };

  // Safe Date Helpers to prevent timezone mismatch/shifts
  const getSafeTimestamp = (dateStr: string) => {
    if (!dateStr) return 0;
    const normalized = normalizeDate(dateStr);
    const parts = normalized.split('-');
    if (parts.length !== 3) return 0;
    const [y, m, d] = parts.map(Number);
    return Date.UTC(y, m - 1, d);
  };

  const todayDateStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayDateStr.substring(0, 7);
  const currentYearStr = todayDateStr.substring(0, 4);

  // Filter settings - Defaulting to 'semua' (All periods) so all records appear instantly!
  const [filterType, setFilterType] = useState<'semua' | 'harian' | 'mingguan' | 'bulanan' | 'tahunan'>('semua');
  const [selectedDate, setSelectedDate] = useState(todayDateStr);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [selectedKelas, setSelectedKelas] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Calculate Period Stats for Quick Recap Cards (Timezone-Safe)
  const harianRecords = pencatatan.filter(r => normalizeDate(r.tanggal) === todayDateStr);
  const harianCount = harianRecords.length;
  const harianPoin = harianRecords.reduce((sum, r) => sum + r.poin, 0);

  const todayMs = getSafeTimestamp(todayDateStr);
  const sevenDaysAgoMs = todayMs - 7 * 24 * 60 * 60 * 1000;
  const mingguanRecords = pencatatan.filter(r => {
    const rMs = getSafeTimestamp(r.tanggal);
    return rMs >= sevenDaysAgoMs && rMs <= todayMs;
  });
  const mingguanCount = mingguanRecords.length;
  const mingguanPoin = mingguanRecords.reduce((sum, r) => sum + r.poin, 0);

  const bulananRecords = pencatatan.filter(r => normalizeDate(r.tanggal).startsWith(currentMonthStr));
  const bulananCount = bulananRecords.length;
  const bulananPoin = bulananRecords.reduce((sum, r) => sum + r.poin, 0);

  const tahunanRecords = pencatatan.filter(r => normalizeDate(r.tanggal).startsWith(currentYearStr));
  const tahunanCount = tahunanRecords.length;
  const tahunanPoin = tahunanRecords.reduce((sum, r) => sum + r.poin, 0);

  // Extract all unique classes for filtering dropdown
  const kelasList = Array.from(new Set(siswa.map(s => s.kelas))).sort();

  // 2. Core Filter Logic (Timezone-Safe)
  const filteredRecords = pencatatan.filter(record => {
    // A. Filter by Class
    if (selectedKelas !== 'Semua' && record.kelas !== selectedKelas) {
      return false;
    }

    // B. Filter by Search Query (NIS, Nama)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = record.namaSiswa.toLowerCase().includes(q);
      const matchNis = record.nis.includes(q);
      const matchViolation = record.pelanggaran.toLowerCase().includes(q);
      if (!matchName && !matchNis && !matchViolation) {
        return false;
      }
    }

    // C. Filter by Date Period
    if (filterType === 'semua') {
      return true;
    }

    if (filterType === 'harian') {
      return normalizeDate(record.tanggal) === selectedDate;
    }

    if (filterType === 'mingguan') {
      const pivotMs = getSafeTimestamp(selectedDate);
      const startMs = pivotMs - 7 * 24 * 60 * 60 * 1000;
      const recordMs = getSafeTimestamp(record.tanggal);
      return recordMs >= startMs && recordMs <= pivotMs;
    }

    if (filterType === 'bulanan') {
      return normalizeDate(record.tanggal).startsWith(selectedMonth);
    }

    if (filterType === 'tahunan') {
      return normalizeDate(record.tanggal).startsWith(selectedYear);
    }

    return true;
  }).sort((a, b) => {
    const tA = getSafeTimestamp(a.tanggal);
    const tB = getSafeTimestamp(b.tanggal);
    return tB - tA; // Decisive sort order: newest is at the top
  });

  // 3. EXPORT TO EXCEL Helper for custom datasets
  const exportRecordsToExcel = (records: Pencatatan[], label: string) => {
    try {
      if (records.length === 0) {
        alert(`Tidak ada data kasus untuk periode ${label} yang bisa diekspor.`);
        return;
      }
      const headers = ['No', 'Tanggal', 'NIS', 'Nama Siswa', 'Kelas', 'Pelanggaran', 'Poin', 'Petugas Pencatat', 'Kronologi / Keterangan'];
      const rows = records.map((r, idx) => [
        idx + 1,
        r.tanggal,
        `'${r.nis}`, // Force text format in Excel
        r.namaSiswa,
        r.kelas,
        r.pelanggaran,
        r.poin,
        r.petugas,
        r.keterangan || '-'
      ]);

      const csvContent = '\uFEFF' + [headers, ...rows]
        .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const filename = `Laporan_Rekap_${label}_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert('Gagal mengekspor laporan: ' + err.message);
    }
  };

  // Trigger Excel on currently filtered dataset
  const exportToExcel = () => {
    exportRecordsToExcel(filteredRecords, `${filterType.toUpperCase()}_Kelas_${selectedKelas}`);
  };

  // 4. CETAK / EXPORT TO PDF
  const triggerPrint = () => {
    window.print();
  };

  // Select a period automatically and open print window
  const selectAndPrint = (type: 'harian' | 'mingguan' | 'bulanan' | 'tahunan') => {
    setFilterType(type);
    if (type === 'harian') {
      setSelectedDate(todayDateStr);
    } else if (type === 'mingguan') {
      setSelectedDate(todayDateStr);
    } else if (type === 'bulanan') {
      setSelectedMonth(currentMonthStr);
    } else if (type === 'tahunan') {
      setSelectedYear(currentYearStr);
    }
    
    // Tiny delay to ensure React state commits and updates the tables before showing printing prompt
    setTimeout(() => {
      window.print();
    }, 180);
  };

  // Format dynamic dates beautifully
  const formatMonthID = (monthStr: string) => {
    const [y, m] = monthStr.split('-');
    const names = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${names[parseInt(m, 10) - 1]} ${y}`;
  };

  const formatRawDateID = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${parts[2]} ${names[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
  };

  return (
    <div className="space-y-6">
      
      {/* 4 DIRECT RECAP PERIOD CARDS - Bento visual style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        
        {/* HARIAN CARD */}
        <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
          filterType === 'harian' ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-800 shadow-xs hover:border-slate-300'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-extrabold uppercase tracking-widest ${filterType === 'harian' ? 'text-blue-200' : 'text-slate-500'}`}>
                Harian
              </span>
              <CalendarCheck className={`w-5 h-5 ${filterType === 'harian' ? 'text-white' : 'text-blue-600'}`} />
            </div>
            <h4 className="text-sm font-bold truncate">Hari Ini ({formatRawDateID(todayDateStr)})</h4>
            <div className="pt-2">
              <span className="text-2xl font-black font-mono tracking-tight">{harianCount}</span>
              <span className={`text-[10px] font-semibold ml-1.5 ${filterType === 'harian' ? 'text-blue-100' : 'text-slate-500'}`}>
                Kasus ({harianPoin} Poin)
              </span>
            </div>
          </div>
          
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-dashed w-full text-xs">
            <button
              onClick={() => { setFilterType('harian'); setSelectedDate(todayDateStr); }}
              className={`flex-1 py-1 px-2 font-bold rounded-lg text-[10px] text-center transition-all ${
                filterType === 'harian' ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Tampilkan
            </button>
            <button
              onClick={() => exportRecordsToExcel(harianRecords, 'Harian_Hari_Ini')}
              title="Ekspor Harian Excel"
              className={`p-1 rounded-lg ${filterType === 'harian' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'}`}
            >
              <FileSpreadsheet className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => selectAndPrint('harian')}
              title="Cetak Harian PDF"
              className={`p-1 rounded-lg ${filterType === 'harian' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
            >
              <Printer className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* MINGGUAN CARD */}
        <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
          filterType === 'mingguan' ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-800 shadow-xs hover:border-slate-300'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-extrabold uppercase tracking-widest ${filterType === 'mingguan' ? 'text-blue-200' : 'text-slate-500'}`}>
                Mingguan
              </span>
              <CalendarDays className={`w-5 h-5 ${filterType === 'mingguan' ? 'text-white' : 'text-amber-500'}`} />
            </div>
            <h4 className="text-sm font-bold truncate">7 Hari Terakhir</h4>
            <div className="pt-2">
              <span className="text-2xl font-black font-mono tracking-tight">{mingguanCount}</span>
              <span className={`text-[10px] font-semibold ml-1.5 ${filterType === 'mingguan' ? 'text-blue-100' : 'text-slate-500'}`}>
                Kasus ({mingguanPoin} Poin)
              </span>
            </div>
          </div>
          
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-dashed w-full text-xs">
            <button
              onClick={() => { setFilterType('mingguan'); setSelectedDate(todayDateStr); }}
              className={`flex-1 py-1 px-2 font-bold rounded-lg text-[10px] text-center transition-all ${
                filterType === 'mingguan' ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Tampilkan
            </button>
            <button
              onClick={() => exportRecordsToExcel(mingguanRecords, '7_Hari_Terakhir')}
              title="Ekspor Mingguan Excel"
              className={`p-1 rounded-lg ${filterType === 'mingguan' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'}`}
            >
              <FileSpreadsheet className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => selectAndPrint('mingguan')}
              title="Cetak Mingguan PDF"
              className={`p-1 rounded-lg ${filterType === 'mingguan' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
            >
              <Printer className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* BULANAN CARD */}
        <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
          filterType === 'bulanan' ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-800 shadow-xs hover:border-slate-300'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-extrabold uppercase tracking-widest ${filterType === 'bulanan' ? 'text-blue-200' : 'text-slate-500'}`}>
                Bulanan
              </span>
              <CalendarRange className={`w-5 h-5 ${filterType === 'bulanan' ? 'text-white' : 'text-emerald-500'}`} />
            </div>
            <h4 className="text-sm font-bold truncate">Bulan Ini ({formatMonthID(currentMonthStr)})</h4>
            <div className="pt-2">
              <span className="text-2xl font-black font-mono tracking-tight">{bulananCount}</span>
              <span className={`text-[10px] font-semibold ml-1.5 ${filterType === 'bulanan' ? 'text-blue-100' : 'text-slate-500'}`}>
                Kasus ({bulananPoin} Poin)
              </span>
            </div>
          </div>
          
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-dashed w-full text-xs">
            <button
              onClick={() => { setFilterType('bulanan'); setSelectedMonth(currentMonthStr); }}
              className={`flex-1 py-1 px-2 font-bold rounded-lg text-[10px] text-center transition-all ${
                filterType === 'bulanan' ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Tampilkan
            </button>
            <button
              onClick={() => exportRecordsToExcel(bulananRecords, `Rekap_Bulanan_${currentMonthStr}`)}
              title="Ekspor Bulanan Excel"
              className={`p-1 rounded-lg ${filterType === 'bulanan' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'}`}
            >
              <FileSpreadsheet className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => selectAndPrint('bulanan')}
              title="Cetak Bulanan PDF"
              className={`p-1 rounded-lg ${filterType === 'bulanan' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
            >
              <Printer className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* TAHUNAN CARD */}
        <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
          filterType === 'tahunan' ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-800 shadow-xs hover:border-slate-300'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-extrabold uppercase tracking-widest ${filterType === 'tahunan' ? 'text-blue-200' : 'text-slate-500'}`}>
                Tahunan
              </span>
              <Calendar className={`w-5 h-5 ${filterType === 'tahunan' ? 'text-white' : 'text-purple-500'}`} />
            </div>
            <h4 className="text-sm font-bold truncate">Tahun Ini ({currentYearStr})</h4>
            <div className="pt-2">
              <span className="text-2xl font-black font-mono tracking-tight">{tahunanCount}</span>
              <span className={`text-[10px] font-semibold ml-1.5 ${filterType === 'tahunan' ? 'text-blue-100' : 'text-slate-500'}`}>
                Kasus ({tahunanPoin} Poin)
              </span>
            </div>
          </div>
          
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-dashed w-full text-xs">
            <button
              onClick={() => { setFilterType('tahunan'); setSelectedYear(currentYearStr); }}
              className={`flex-1 py-1 px-2 font-bold rounded-lg text-[10px] text-center transition-all ${
                filterType === 'tahunan' ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Tampilkan
            </button>
            <button
              onClick={() => exportRecordsToExcel(tahunanRecords, `Rekap_Tahunan_${currentYearStr}`)}
              title="Ekspor Tahunan Excel"
              className={`p-1 rounded-lg ${filterType === 'tahunan' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'}`}
            >
              <FileSpreadsheet className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => selectAndPrint('tahunan')}
              title="Cetak Tahunan PDF"
              className={`p-1 rounded-lg ${filterType === 'tahunan' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
            >
              <Printer className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Top filter control panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight font-display flex items-center gap-1.5">
              <Filter className="w-5 h-5 text-blue-600" /> Filter Pencarian Laporan Rekap
            </h2>
            <p className="text-xs text-slate-500 font-sans">Sesuaikan filter tanggal kustom dan kelas di bawah untuk pencarian spesifik</p>
          </div>
          
          <div className="flex gap-2.5">
            <button
              id="btn-export-excel"
              onClick={exportToExcel}
              className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4" /> Ekspor Excel Terpilih
            </button>
            <button
              id="btn-print-pdf"
              onClick={triggerPrint}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Printer className="w-4 h-4" /> Cetak PDF Terpilih
            </button>
          </div>
        </div>

        {/* Filter controls form */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* Period Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 block">Jenis Periode</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all bg-white font-semibold text-slate-700"
            >
              <option value="semua">Semua Periode (Tanpa Batas)</option>
              <option value="harian">Harian (Satu Hari)</option>
              <option value="mingguan">Mingguan (7 Hari Terakhir)</option>
              <option value="bulanan">Bulanan (Satu Bulan)</option>
              <option value="tahunan">Tahunan (Satu Tahun)</option>
            </select>
          </div>

          {/* Dynamic Period Picker Inputs */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 block">
              {filterType === 'semua' && 'Batasan Tanggal'}
              {filterType === 'harian' && 'Pilih Tanggal'}
              {filterType === 'mingguan' && 'Pivoting Tanggal Akhir'}
              {filterType === 'bulanan' && 'Pilih Bulan'}
              {filterType === 'tahunan' && 'Pilih Tahun'}
            </label>
            
            {filterType === 'semua' && (
              <div className="px-3 py-2 text-xs border border-dashed border-slate-200 text-slate-400 bg-slate-50/50 rounded-xl font-semibold flex items-center h-[38px]">
                Semua data terbaru ditampilkan
              </div>
            )}

            {filterType === 'harian' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 focus:border-blue-500 rounded-xl outline-none font-mono"
              />
            )}

            {filterType === 'mingguan' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 focus:border-blue-500 rounded-xl outline-none font-mono"
              />
            )}

            {filterType === 'bulanan' && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 focus:border-blue-500 rounded-xl outline-none font-mono"
              />
            )}

            {filterType === 'tahunan' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 focus:border-blue-500 rounded-xl outline-none font-mono bg-white"
              >
                {['2024', '2025', '2026', '2027', '2028'].map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            )}
          </div>

          {/* Filter Kelas */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 block">Saring Kelas</label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all bg-white font-semibold text-slate-700"
            >
              <option value="Semua">Semua Kelas</option>
              {kelasList.map(kls => (
                <option key={kls} value={kls}>Kelas {kls}</option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 block">Pencarian Cepat</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Nama / NIS siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-sm border border-slate-200 focus:border-blue-500 rounded-xl outline-none bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Printable Report Layout - Standard View has scroll, Printing layout takes complete control */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        
        {/* Printable Institution Header (Hidden in standard screen, visible ONLY when printing PDF) */}
        <div className="hidden print-only text-center border-b-4 border-double border-slate-900 pb-4 mb-6">
          <h1 className="text-lg font-black uppercase tracking-wider text-slate-950 font-display">PEMERINTAH KOTA TANGERANG SELATAN</h1>
          <h2 className="text-2xl font-black text-slate-900 font-display">UPTD SMP NEGERI 17 KOTA TANGERANG SELATAN</h2>
          <p className="text-xs text-slate-500 mt-1">
            Komplek Pamulang Permai Barat 1 Rt 03/10 Pamulang - kota Tangerang Selatan 15417
          </p>
          <div className="text-center font-bold text-slate-900 uppercase underline text-sm mt-5 tracking-tight font-display">
            LAPORAN REKAPITULASI PELANGGARAN TATA TERTIB SISWA
          </div>
          <div className="text-center text-xs font-mono text-slate-600 mt-1">
            Periode Laporan: {filterType.toUpperCase()} ({
              filterType === 'semua' ? 'Semua Riwayat' :
              filterType === 'harian' ? selectedDate :
              filterType === 'bulanan' ? selectedMonth :
              filterType === 'tahunan' ? selectedYear :
              `7 Hari dari ${selectedDate}`
            }) | Kelas: {selectedKelas}
          </div>
        </div>

        {/* Screen layout Title info */}
        <div className="no-print flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm font-display">Pratinjau Data Laporan</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500 font-mono">
            Ditemukan: <strong>{filteredRecords.length}</strong> baris data
          </span>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs print:border-slate-800">
          <table className="w-full text-left border-collapse text-xs print:text-[10px]">
            <thead>
              <tr className="bg-slate-50 print:bg-slate-100 border-b border-slate-200 print:border-slate-800 text-slate-600 font-bold uppercase tracking-wider text-[10px] print:text-[8px]">
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-3 w-24">Tanggal</th>
                <th className="py-3 px-3 w-20 font-mono">NIS</th>
                <th className="py-3 px-3">Nama Siswa</th>
                <th className="py-3 px-3 w-14 text-center">Kelas</th>
                <th className="py-3 px-3">Kasus Pelanggaran</th>
                <th className="py-3 px-3 w-14 text-center">Poin</th>
                <th className="py-3 px-3">Petugas Pelapor</th>
                <th className="py-3 px-3">Keterangan</th>
                <th className="py-3 px-3 no-print">Foto Bukti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-slate-300 text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 italic">
                    Tidak ada catatan kasus kesiswaan pada filter terpilih.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, idx) => (
                  <tr key={record.id} className="hover:bg-slate-50/40">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-600">{formatRawDateID(normalizeDate(record.tanggal))}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{record.nis}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-950">{record.namaSiswa}</td>
                    <td className="py-2.5 px-3 text-center font-bold">{record.kelas}</td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">{record.pelanggaran}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-extrabold text-rose-600">+{record.poin}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">{record.petugas}</td>
                    <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">{record.keterangan || '-'}</td>
                    <td className="py-2.5 px-3 no-print">
                      {record.foto ? (
                        <img src={record.foto} alt="Bukti" className="w-8 h-8 object-cover rounded border border-slate-200" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Printable Signature Footnote section (Hidden in standard screen, visible ONLY when printing PDF) */}
        <div className="hidden print-only pt-10 grid grid-cols-2 gap-12 text-center text-xs">
          <div className="space-y-16">
            <span className="block font-medium">Mengetahui,<br />Kepala Sekolah</span>
            <div className="space-y-1">
              <span className="block font-bold underline">Aulia Rohmah</span>
              <span className="block text-[10px] text-slate-500 font-mono">NIP. 197412102003121001</span>
            </div>
          </div>

          <div className="space-y-16">
            <span className="block font-medium">Tangerang Selatan, {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}<br />Koordinator BK / Kesiswaan</span>
            <div className="space-y-1">
              <span className="block font-bold underline">Sulaiman, S.Psi.</span>
              <span className="block text-[10px] text-slate-500 font-mono">NIP. 198209202022211009</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { motion } from 'motion/react';
import { Siswa, Pelanggaran, Pencatatan, Pembinaan } from '../types';
import StatCard from './StatCard';
import { AlertTriangle, BookOpen, Clock, Calendar, ShieldCheck, ChevronRight } from 'lucide-react';

interface DashboardOverviewProps {
  siswa: Siswa[];
  pelanggaran: Pelanggaran[];
  pencatatan: Pencatatan[];
  pembinaan: Pembinaan[];
  onNavigate: (tab: string) => void;
  onSelectSiswa: (nis: string) => void;
}

export default function DashboardOverview({
  siswa,
  pelanggaran,
  pencatatan,
  pembinaan,
  onNavigate,
  onSelectSiswa
}: DashboardOverviewProps) {
  
  // Robust Date Normalizer to convert any format to YYYY-MM-DD
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
          return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    }
    
    // 2. If it has dashes
    if (str.includes('-')) {
      const parts = str.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    }
    
    return str.substring(0, 10);
  };

  const getSafeTimestamp = (dateStr: string) => {
    if (!dateStr) return 0;
    const normalized = normalizeDate(dateStr);
    const parts = normalized.split('-');
    if (parts.length !== 3) return 0;
    const [y, m, d] = parts.map(Number);
    return Date.UTC(y, m - 1, d);
  };

  // 1. Calculations
  const totalSiswa = siswa.length;
  
  // Local safe today's date
  const getLocalTodayStr = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const todayStr = getLocalTodayStr(); // e.g. "2026-06-25"
  const currentMonthPrefix = todayStr.substring(0, 7); // e.g. "2026-06"
  
  const pelanggaranHariIni = pencatatan.filter(r => normalizeDate(r.tanggal) === todayStr).length;
  const pelanggaranBulanIni = pencatatan.filter(r => normalizeDate(r.tanggal).startsWith(currentMonthPrefix)).length;
  const totalPoinKeseluruhan = pencatatan.reduce((sum, r) => sum + r.poin, 0);

  // 2. Monthly violation bar chart calculations
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthlyCounts = Array(12).fill(0);
  
  pencatatan.forEach(record => {
    try {
      const normalized = normalizeDate(record.tanggal);
      if (normalized) {
        const parts = normalized.split('-');
        if (parts.length === 3) {
          const monthIndex = Number(parts[1]) - 1; // 0-11
          if (monthIndex >= 0 && monthIndex < 12) {
            monthlyCounts[monthIndex]++;
          }
        }
      }
    } catch (e) {
      // Ignore date parsing issues
    }
  });

  const maxMonthlyCount = Math.max(...monthlyCounts, 1);

  // 3. Category distribution
  const categoryCounts = { Ringan: 0, Sedang: 0, Berat: 0 };
  pencatatan.forEach(record => {
    // Look up category from violation list or deduce from points if not found
    const master = pelanggaran.find(v => v.namaPelanggaran === record.pelanggaran);
    const category = master ? master.kategori : (record.poin >= 50 ? 'Berat' : record.poin >= 15 ? 'Sedang' : 'Ringan');
    categoryCounts[category]++;
  });

  const totalCatRecords = categoryCounts.Ringan + categoryCounts.Sedang + categoryCounts.Berat || 1;
  const pctRingan = Math.round((categoryCounts.Ringan / totalCatRecords) * 100);
  const pctSedang = Math.round((categoryCounts.Sedang / totalCatRecords) * 100);
  const pctBerat = Math.round((categoryCounts.Berat / totalCatRecords) * 100);

  // 4. Critical Students (Total points > 50)
  // Group points per student
  const studentPoints: Record<string, { student: Siswa; points: number; tindakan: string }> = {};
  
  siswa.forEach(s => {
    const sRecords = pencatatan.filter(r => r.nis === s.nis);
    const total = sRecords.reduce((sum, r) => sum + r.poin, 0);
    
    if (total > 0) {
      let tindakan = 'Teguran Lisan';
      if (total <= 25) tindakan = 'Teguran Lisan';
      else if (total <= 50) tindakan = 'Teguran Tertulis';
      else if (total <= 75) tindakan = 'Pemanggilan Orang Tua';
      else if (total <= 100) tindakan = 'Surat Peringatan';
      else tindakan = 'Sidang Disiplin';

      studentPoints[s.nis] = {
        student: s,
        points: total,
        tindakan
      };
    }
  });

  const criticalStudents = Object.values(studentPoints)
    .filter(item => item.points >= 26) // Level Teguran Tertulis upwards
    .sort((a, b) => b.points - a.points);

  // 5. 5 Latest Records
  const latestRecords = [...pencatatan]
    .sort((a, b) => getSafeTimestamp(b.tanggal) - getSafeTimestamp(a.tanggal))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-blue-950 border border-blue-900 text-white rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="space-y-2">
          <span className="text-blue-400 text-sm font-semibold tracking-wider uppercase">Portal Dashboard Utama</span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-display text-white">Sistem Monitoring Pelanggaran Siswa</h1>
          <p className="text-blue-200/80 text-sm md:text-base max-w-xl">
            Selamat datang di dashboard monitoring kesiswaan. Di sini Anda dapat memantau secara real-time akumulasi poin pelanggaran dan langkah pembinaan siswa.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            id="btn-quick-record"
            onClick={() => onNavigate('input')}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-xl transition-all shadow-md shadow-blue-900/40 flex items-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" /> Catat Pelanggaran
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Siswa Terdaftar"
          value={totalSiswa}
          iconName="UserCheck"
          description="Total seluruh siswa aktif"
          colorTheme="blue"
        />
        <StatCard
          label="Pelanggaran Hari Ini"
          value={pelanggaranHariIni}
          iconName="Clock"
          description="Dicatat pada hari ini"
          colorTheme="red"
        />
        <StatCard
          label="Pelanggaran Bulan Ini"
          value={pelanggaranBulanIni}
          iconName="Calendar"
          description={`Periode ${months[new Date().getMonth()]} ${new Date().getFullYear()}`}
          colorTheme="amber"
        />
        <StatCard
          label="Poin Akumulatif"
          value={totalPoinKeseluruhan}
          iconName="AlertTriangle"
          description="Akumulasi poin seluruh siswa"
          colorTheme="emerald"
        />
      </div>

      {/* Main Charts & Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Chart Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Grafik Pelanggaran Bulanan</h2>
              <p className="text-xs text-slate-500">Jumlah kasus pelanggaran per bulan tahun ini</p>
            </div>
            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">Tahun {new Date().getFullYear()}</span>
          </div>

          {/* Bar Chart Container */}
          <div className="h-64 flex items-end gap-2 md:gap-4 pt-4 px-2">
            {months.map((month, idx) => {
              const count = monthlyCounts[idx];
              const heightPercent = (count / maxMonthlyCount) * 85; // capped at 85% for styling clearance
              
              return (
                <div key={month} className="flex-1 flex flex-col items-center group h-full justify-end">
                  {/* Tooltip on Hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] rounded-md py-1 px-1.5 mb-1 text-center font-mono select-none pointer-events-none shadow-md">
                    {count} kasus
                  </div>
                  {/* Animated Bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ duration: 0.5, delay: idx * 0.03 }}
                    className={`w-full rounded-t-md transition-colors ${count > 0 ? 'bg-blue-600 group-hover:bg-blue-500' : 'bg-slate-100'}`}
                  />
                  <span className="text-[10px] font-semibold text-slate-500 mt-2">{month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category breakdown & statistics */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Proporsi Kategori</h2>
            <p className="text-xs text-slate-500">Distribusi pelanggaran berdasarkan tingkat keparahan</p>
          </div>

          <div className="space-y-6 pt-2">
            {/* Horizontal Bar Rings */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-emerald-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Ringan
                </span>
                <span className="text-slate-700">{categoryCounts.Ringan} Kasus ({pctRingan}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pctRingan}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-amber-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Sedang
                </span>
                <span className="text-slate-700">{categoryCounts.Sedang} Kasus ({pctSedang}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${pctSedang}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-rose-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Berat
                </span>
                <span className="text-slate-700">{categoryCounts.Berat} Kasus ({pctBerat}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pctBerat}%` }} />
              </div>
            </div>

            {/* Core Action Rules Guideline Quick View */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100 text-xs">
              <span className="font-bold text-slate-800 block uppercase tracking-wider text-[10px]">Ringkasan Ambang Poin Pembinaan</span>
              <ul className="space-y-1.5 text-slate-600 font-mono">
                <li>• 0 - 25 : Teguran Lisan</li>
                <li>• 26 - 50 : Teguran Tertulis</li>
                <li>• 51 - 75 : Panggilan Orang Tua</li>
                <li>• 76 - 100 : Surat Peringatan</li>
                <li>• &gt; 100 : Sidang Disiplin</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Status & Latest Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Students alert panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">Siswa Butuh Pembinaan Khusus</h2>
            </div>
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
              {criticalStudents.length} Siswa
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-80 pr-1">
            {criticalStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-2 text-slate-400">
                <ShieldCheck className="w-10 h-10 text-emerald-500" />
                <span className="text-sm font-medium">Kondisi Aman</span>
                <p className="text-xs max-w-xs">Tidak ada siswa yang memiliki poin di atas ambang kritis (25 poin).</p>
              </div>
            ) : (
              criticalStudents.map(item => {
                const badgeColor = item.points > 100 ? 'bg-red-100 text-red-800 border-red-200' :
                                   item.points > 75 ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                   item.points > 50 ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                   'bg-yellow-100 text-yellow-800 border-yellow-200';
                
                return (
                  <div
                    key={item.student.nis}
                    onClick={() => onSelectSiswa(item.student.nis)}
                    className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 rounded-xl cursor-pointer transition-all"
                  >
                    <div className="space-y-1">
                      <span className="text-sm font-bold text-slate-800 hover:text-blue-600 block transition-colors">{item.student.nama}</span>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                        <span>NIS: {item.student.nis}</span>
                        <span>•</span>
                        <span>Kelas: {item.student.kelas}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm font-black font-mono text-slate-900 block">{item.points} Poin</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                          {item.tindakan}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 5 latest records log */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Pelanggaran Terakhir Dicatat</h2>
            <button
              onClick={() => onNavigate('laporan')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
            >
              Lihat Semua <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5">
            {latestRecords.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                Belum ada data pelanggaran yang dicatat.
              </div>
            ) : (
              latestRecords.map(record => {
                const categoryColor = record.poin >= 50 ? 'bg-red-100 text-red-800' :
                                      record.poin >= 15 ? 'bg-amber-100 text-amber-800' :
                                      'bg-emerald-100 text-emerald-800';
                
                return (
                  <div key={record.id} className="flex items-start gap-3.5 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0 font-mono text-center text-xs font-semibold w-12">
                      <span className="block text-[10px] uppercase text-slate-400 font-sans">Poin</span>
                      {record.poin}
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-800 truncate">{record.namaSiswa}</span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">{record.tanggal}</span>
                      </div>
                      <p className="text-xs text-slate-600 truncate">{record.pelanggaran}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-slate-400">Kelas {record.kelas}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] text-slate-500 italic truncate">Petugas: {record.petugas}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

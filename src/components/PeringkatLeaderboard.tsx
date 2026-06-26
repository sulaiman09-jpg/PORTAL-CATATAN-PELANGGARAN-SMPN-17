import React from 'react';
import { Siswa, Pencatatan, Pelanggaran } from '../types';
import { Crown, Medal, Flame, ShieldAlert, Award, TrendingUp, AlertTriangle } from 'lucide-react';

interface PeringkatLeaderboardProps {
  siswa: Siswa[];
  pencatatan: Pencatatan[];
  violations: Pelanggaran[];
  onSelectSiswa: (nis: string) => void;
}

export default function PeringkatLeaderboard({
  siswa,
  pencatatan,
  violations,
  onSelectSiswa
}: PeringkatLeaderboardProps) {

  // 1. Calculate Top 10 students with highest points
  const studentTotals: Record<string, { student: Siswa; totalPoin: number; casesCount: number }> = {};
  
  // Initialize
  siswa.forEach(s => {
    studentTotals[s.nis] = {
      student: s,
      totalPoin: 0,
      casesCount: 0
    };
  });

  // Accumulate
  pencatatan.forEach(record => {
    if (studentTotals[record.nis]) {
      studentTotals[record.nis].totalPoin += record.poin;
      studentTotals[record.nis].casesCount += 1;
    }
  });

  // Sort and slice Top 10
  const topStudents = Object.values(studentTotals)
    .filter(item => item.totalPoin > 0)
    .sort((a, b) => b.totalPoin - a.totalPoin)
    .slice(0, 10);

  // 2. Calculate Top 10 most frequent violations
  const violationCounts: Record<string, { violation: string; kode: string; count: number; totalPoints: number }> = {};
  
  // Prepopulate
  violations.forEach(v => {
    violationCounts[v.namaPelanggaran] = {
      violation: v.namaPelanggaran,
      kode: v.kode,
      count: 0,
      totalPoints: 0
    };
  });

  // Accumulate occurrences
  pencatatan.forEach(record => {
    if (violationCounts[record.pelanggaran]) {
      violationCounts[record.pelanggaran].count += 1;
      violationCounts[record.pelanggaran].totalPoints += record.poin;
    } else {
      // Fallback
      violationCounts[record.pelanggaran] = {
        violation: record.pelanggaran,
        kode: 'RULES',
        count: 1,
        totalPoints: record.poin
      };
    }
  });

  // Sort and slice Top 10 violations
  const topViolations = Object.values(violationCounts)
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const maxViolationCount = Math.max(...topViolations.map(v => v.count), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top 10 Students with highest points */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-200 pb-4 flex items-center gap-2">
          <Flame className="w-5.5 h-5.5 text-rose-500" />
          <div>
            <h3 className="font-bold text-slate-800 font-display">Top 10 Siswa Poin Tertinggi</h3>
            <p className="text-xs text-slate-500 font-sans">Daftar siswa dengan akumulasi poin terbanyak (Atensi Khusus BK)</p>
          </div>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {topStudents.length === 0 ? (
            <div className="text-center py-16 text-slate-400 italic text-sm">
              Belum ada data akumulasi poin pelanggaran siswa.
            </div>
          ) : (
            topStudents.map((item, index) => {
              const rank = index + 1;
              let rankBadge = null;
              let rowStyle = 'bg-slate-50 hover:bg-slate-100 border-slate-100';
              
              if (rank === 1) {
                rankBadge = <Crown className="w-5 h-5 text-amber-500 fill-amber-300 shrink-0" />;
                rowStyle = 'bg-amber-50/50 hover:bg-amber-50 border-amber-100 shadow-xs';
              } else if (rank === 2) {
                rankBadge = <Medal className="w-5 h-5 text-slate-400 fill-slate-200 shrink-0" />;
                rowStyle = 'bg-slate-50/70 hover:bg-slate-50 border-slate-100';
              } else if (rank === 3) {
                rankBadge = <Medal className="w-5 h-5 text-amber-700 fill-amber-600/20 shrink-0" />;
                rowStyle = 'bg-amber-900/5 hover:bg-amber-900/10 border-amber-900/10';
              }

              return (
                <div
                  key={item.student.nis}
                  onClick={() => onSelectSiswa(item.student.nis)}
                  className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all ${rowStyle}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Circle */}
                    <div className="w-7 h-7 rounded-full bg-white border border-slate-200 shadow-2xs font-mono font-black text-xs text-slate-700 flex items-center justify-center shrink-0">
                      {rank}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900 hover:text-blue-600 block transition-colors">
                          {item.student.nama}
                        </span>
                        {rankBadge}
                      </div>
                      <span className="text-[10px] text-slate-500 block font-mono">
                        NIS: {item.student.nis} • Kelas {item.student.kelas} • {item.casesCount} Kasus
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black font-mono text-slate-950 block">{item.totalPoin} Poin</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Bobot</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Top 10 most common violations */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-200 pb-4 flex items-center gap-2">
          <TrendingUp className="w-5.5 h-5.5 text-blue-600" />
          <div>
            <h3 className="font-bold text-slate-800 font-display">Top 10 Pelanggaran Terbanyak</h3>
            <p className="text-xs text-slate-500 font-sans">Jenis tata tertib yang paling sering dilanggar siswa kesiswaan</p>
          </div>
        </div>

        <div className="space-y-5 max-h-[500px] overflow-y-auto pr-1">
          {topViolations.length === 0 ? (
            <div className="text-center py-16 text-slate-400 italic text-sm">
              Belum ada pencatatan kasus pelanggaran terekam.
            </div>
          ) : (
            topViolations.map((item, index) => {
              const rank = index + 1;
              const barPercent = (item.count / maxViolationCount) * 100;
              
              return (
                <div key={item.violation} className="space-y-2">
                  <div className="flex justify-between items-start text-xs font-semibold gap-4">
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-slate-400 font-bold shrink-0">#{rank}</span>
                      <div className="space-y-0.5">
                        <span className="text-slate-900 font-bold leading-tight block">{item.violation}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Kode Sanksi: {item.kode}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-slate-900 font-black font-mono text-sm block">{item.count} Kasus</span>
                      <span className="text-[9px] text-slate-400 font-mono font-bold block">{item.totalPoints} Poin Terakumulasi</span>
                    </div>
                  </div>

                  {/* Horizontal visual indicator bar */}
                  <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden border border-slate-100">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${barPercent}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

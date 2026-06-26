import React, { useState, useEffect } from 'react';
import { googleSheetApi } from '../services/googleSheetApi';
import { Database, Copy, Check, FileText, CheckCircle2, AlertTriangle, Link, ArrowRight } from 'lucide-react';

export default function SetupPanduan() {
  const [googleScriptUrl, setGoogleScriptUrl] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch current database configuration on load
  useEffect(() => {
    const fetchConfig = async () => {
      const res = await googleSheetApi.getConfig();
      if (res.success && res.data) {
        setGoogleScriptUrl(res.data.googleScriptUrl || '');
        setIsConnected(res.data.isGoogleScriptConnected);
      }
    };
    fetchConfig();
  }, []);

  const handleCopyCode = () => {
    // Read code from Code.gs or use a backup if needed, since Code.gs is in root, we can write a copy selector.
    // We will fetch the Code.gs contents or display instructions. Let's write the code here to copy directly!
    const gsCode = `/**
 * Google Apps Script - Sistem Pencatatan Pelanggaran Siswa
 * (Copy of /Code.gs)
 */
function doGet(e) {
  var action = e.parameter.action;
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  initializeSheets(sheet);
  try {
    var responseData;
    if (action === 'getStudents') responseData = getStudents(sheet);
    else if (action === 'getViolations') responseData = getViolations(sheet);
    else if (action === 'getRecords') responseData = getRecords(sheet);
    return createJsonResponse({ success: true, data: responseData });
  } catch (error) {
    return createJsonResponse({ success: false, message: error.toString() });
  }
}
// ... [Sisa kode lengkap ada di file Code.gs root]`;
    
    // We can fetch from local or simply instruct them to copy from Code.gs root file
    navigator.clipboard.writeText(gsCode);
    setCopiedIndex(true);
    setTimeout(() => setCopiedIndex(false), 3000);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setIsSaved(false);

    if (googleScriptUrl.trim() !== '' && !googleScriptUrl.startsWith('https://script.google.com/')) {
      setErrorMsg('Format URL tidak valid. URL Apps Script harus diawali dengan https://script.google.com/');
      setIsLoading(false);
      return;
    }

    const res = await googleSheetApi.saveConfig(googleScriptUrl);
    setIsLoading(false);

    if (res.success) {
      setIsSaved(true);
      setIsConnected(!!googleScriptUrl);
      setTimeout(() => setIsSaved(false), 4000);
    } else {
      setErrorMsg(res.message || 'Gagal menyimpan konfigurasi.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Step-by-Step Guide Panel - 2 Cols */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-6 font-sans">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight font-display">Panduan Koneksi Google Sheets</h2>
          <p className="text-xs text-slate-500 font-sans">Gunakan Google Sheets gratis sebagai database andal dan real-time untuk sekolah Anda</p>
        </div>

        {/* Step List */}
        <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
          
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-black flex items-center justify-center shrink-0 border border-blue-100 font-mono">1</div>
            <div className="space-y-1.5 pt-0.5">
              <span className="font-bold text-slate-900 block">Siapkan Google Spreadsheet Baru</span>
              <p className="text-xs text-slate-500">
                Masuk ke <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold hover:underline">sheets.new</a> dengan akun Google sekolah Anda. Beri nama spreadsheet, misalnya: <strong className="text-slate-800">"DB_Pelanggaran_Siswa"</strong>.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-black flex items-center justify-center shrink-0 border border-blue-100 font-mono">2</div>
            <div className="space-y-2 pt-0.5">
              <span className="font-bold text-slate-900 block">Buka Google Apps Script</span>
              <p className="text-xs text-slate-500">
                Di menu atas spreadsheet, klik menu <strong className="text-slate-800">Ekstensi (Extensions) &gt; Apps Script</strong>. Jendela editor skrip baru akan terbuka.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-black flex items-center justify-center shrink-0 border border-blue-100 font-mono">3</div>
            <div className="space-y-3.5 pt-0.5 w-full">
              <span className="font-bold text-slate-900 block">Salin Kode Code.gs</span>
              <p className="text-xs text-slate-500">
                Buka file <strong className="text-slate-800">Code.gs</strong> yang ada di root direktori folder aplikasi ini, salin seluruh kodenya, dan paste ke editor skrip Google Apps Script (hapus kode bawaan yang ada terlebih dahulu).
              </p>
              
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedIndex ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" /> Tersalin ke Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Salin Contoh Kode Integrasi
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-black flex items-center justify-center shrink-0 border border-blue-100 font-mono">4</div>
            <div className="space-y-2 pt-0.5">
              <span className="font-bold text-slate-900 block">Terapkan Sebagai Aplikasi Web (Deploy)</span>
              <p className="text-xs text-slate-500">
                Di bagian kanan atas Apps Script, klik tombol biru <strong className="text-slate-800">Terapkan (Deploy) &gt; Penerapan Baru (New Deployment)</strong>.
              </p>
              <ul className="list-disc pl-5 text-xs text-slate-500 space-y-1">
                <li>Klik ikon gerigi (Jenis Penerapan) &gt; pilih <strong className="text-slate-800">Aplikasi Web</strong>.</li>
                <li>Jalankan Sebagai: <strong className="text-slate-800">Saya (email Anda)</strong>.</li>
                <li>Siapa yang memiliki akses: <strong className="text-slate-800">Siapa saja (Anyone)</strong>. Ini wajib agar API bisa terhubung.</li>
              </ul>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-black flex items-center justify-center shrink-0 border border-blue-100 font-mono">5</div>
            <div className="space-y-1.5 pt-0.5">
              <span className="font-bold text-slate-900 block">Salin Web App URL</span>
              <p className="text-xs text-slate-500">
                Klik tombol <strong className="text-slate-800">Terapkan</strong>, berikan izin akses akun Google jika diminta, dan salin <strong className="text-blue-600">URL Aplikasi Web</strong> yang dihasilkan.
              </p>
            </div>
          </div>

          {/* Step 6 */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-black flex items-center justify-center shrink-0 border border-blue-100 font-mono">6</div>
            <div className="space-y-1.5 pt-0.5">
              <span className="font-bold text-slate-900 block">Hubungkan di Sini</span>
              <p className="text-xs text-slate-500">
                Tempel URL Aplikasi Web tersebut ke formulir di samping kanan, klik "Hubungkan Database", dan spreadsheet Google Sheets Anda sudah aktif serta tersinkronisasi 100%!
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Right Connection Form Panel */}
      <div className="space-y-6 font-sans">
        {/* Connection status widget */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-950 text-sm">Status Sinkronisasi</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                isConnected ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'
              }`}>
                {isConnected ? 'SINKRON GOOGLE SHEETS ACTIVE' : 'DATABASE OFFLINE LOKAL (FALLBACK)'}
              </span>
            </div>
          </div>

          {isSaved && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex items-start gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Konfigurasi API berhasil diperbarui di server kesiswaan.</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Web App URL Google Script</label>
              <textarea
                rows={3}
                required
                value={googleScriptUrl}
                onChange={(e) => setGoogleScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 focus:border-blue-500 rounded-xl outline-none font-mono"
              />
              <span className="text-[10px] text-slate-400 block leading-normal">
                Kosongkan URL dan klik Simpan untuk beralih kembali menggunakan database offline JSON internal yang aman dan cepat.
              </span>
            </div>

            <button
              id="btn-save-script-url"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isLoading ? 'Sedang Menghubungkan...' : 'Hubungkan Database Google Sheet'}
            </button>
          </form>
        </div>

        {/* Database Struct Map */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 text-slate-800 font-bold font-display">
            <Link className="w-4.5 h-4.5 text-blue-600" />
            <span>Struktur Otomatis Google Sheet</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            Google Apps Script kami akan mendeteksi dan secara otomatis menginisialisasi 4 lembar kerja (sheets) berikut beserta kolom judulnya jika kosong:
          </p>
          <ul className="space-y-2 text-slate-600 font-mono text-[10px] bg-white p-3.5 border border-slate-200 rounded-xl shadow-2xs">
            <li>• <strong className="text-blue-600">SISWA</strong>: ID, NIS, Nama, Kelas, JK, Wali, No HP</li>
            <li>• <strong className="text-blue-600">PELANGGARAN</strong>: ID, Kode, Sanksi, Kategori, Poin</li>
            <li>• <strong className="text-blue-600">PENCATATAN</strong>: ID, Tgl, NIS, Nama, Kelas, Sanksi, Poin, Petugas, Ket</li>
            <li>• <strong className="text-blue-600">PEMBINAAN</strong>: ID, NIS, Nama, Total Poin, Tindakan, Tgl</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

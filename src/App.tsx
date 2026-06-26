import React, { useState, useEffect } from 'react';
import { Siswa, Pelanggaran, Pencatatan, Pembinaan, User, Role } from './types';
import { googleSheetApi } from './services/googleSheetApi';
import DashboardOverview from './components/DashboardOverview';
import SiswaList from './components/SiswaList';
import PelanggaranList from './components/PelanggaranList';
import InputPelanggaranForm from './components/InputPelanggaranForm';
import RiwayatSiswaDetail from './components/RiwayatSiswaDetail';
import LaporanSiswa from './components/LaporanSiswa';
import PeringkatLeaderboard from './components/PeringkatLeaderboard';
import SetupPanduan from './components/SetupPanduan';
import { 
  LayoutDashboard, 
  Users, 
  Scale, 
  PlusCircle, 
  UserSearch, 
  FileSpreadsheet, 
  Trophy, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  GraduationCap, 
  UserCheck, 
  KeyRound, 
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function App() {
  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Application Data States
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [violations, setViolations] = useState<Pelanggaran[]>([]);
  const [pencatatan, setPencatatan] = useState<Pencatatan[]>([]);
  const [pembinaan, setPembinaan] = useState<Pembinaan[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Navigation states
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedNisFromOutside, setSelectedNisFromOutside] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Check login session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user_session');
    const storedToken = localStorage.getItem('auth_token');
    if (storedUser && storedToken) {
      try {
        const userObj = JSON.parse(storedUser) as User;
        if (userObj && userObj.username === 'gurubk' && userObj.nama !== 'Sulaiman, S.Psi.') {
          userObj.nama = 'Sulaiman, S.Psi.';
          localStorage.setItem('user_session', JSON.stringify(userObj));
        } else if (userObj && userObj.username === 'admin' && userObj.nama !== 'Aulia Rohmah') {
          userObj.nama = 'Aulia Rohmah';
          localStorage.setItem('user_session', JSON.stringify(userObj));
        } else if (userObj && (userObj.username === 'walikelas' || userObj.username === 'gurupiket') && userObj.nama !== 'Paramita Sari, S.Kom.') {
          userObj.nama = 'Paramita Sari, S.Kom.';
          userObj.role = 'Guru Piket';
          localStorage.setItem('user_session', JSON.stringify(userObj));
        }
        setCurrentUser(userObj);
      } catch (e) {
        // Ignore JSON parsing issues
      }
      setToken(storedToken);
    }
  }, []);

  // Fetch data from server once authenticated
  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser]);

  // Load all students, master violations, and logging records
  const loadAllData = async () => {
    setIsLoadingData(true);
    try {
      const resSiswa = await googleSheetApi.getStudents();
      const resViolations = await googleSheetApi.getViolations();
      const resRecords = await googleSheetApi.getRecords();

      if (resSiswa.success && resSiswa.data) setSiswa(resSiswa.data);
      if (resViolations.success && resViolations.data) setViolations(resViolations.data);
      
      if (resRecords.success && resRecords.data) {
        setPencatatan(resRecords.data.pencatatan);
        setPembinaan(resRecords.data.pembinaan);
      }
    } catch (err) {
      showToast('Gagal memuat data dari database kesiswaan.', 'error');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Helper to trigger toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError('Harap isi semua kolom login.');
      return;
    }

    setIsLoggingIn(true);
    const response = await googleSheetApi.login(loginUsername, loginPassword);
    setIsLoggingIn(false);

    if (response.success && response.token && response.user) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_session', JSON.stringify(response.user));
      setToken(response.token);
      setCurrentUser(response.user);
      showToast(`Selamat datang kembali, ${response.user.nama}!`, 'success');
    } else {
      setLoginError(response.message || 'Username atau password salah.');
    }
  };

  // Quick Login trigger for demo
  const handleQuickLogin = (uname: string, pass: string) => {
    setLoginUsername(uname);
    setLoginPassword(pass);
    setLoginError('');
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_session');
    setToken(null);
    setCurrentUser(null);
    setSiswa([]);
    setViolations([]);
    setPencatatan([]);
    setPembinaan([]);
    setActiveTab('dashboard');
    showToast('Berhasil logout dari sistem kesiswaan.', 'success');
  };

  // ------------------ DATA OPERATIONS INTERACTION ------------------

  // 1. Students (Siswa) CRUD
  const handleAddStudent = async (studentData: Omit<Siswa, 'id'> & { id?: string }): Promise<boolean> => {
    const res = await googleSheetApi.addStudent(studentData);
    if (res.success && res.data) {
      setSiswa(res.data);
      showToast('Data siswa berhasil disimpan.', 'success');
      return true;
    } else {
      showToast(res.message || 'Gagal menyimpan siswa.', 'error');
      return false;
    }
  };

  const handleDeleteStudent = async (id: string): Promise<boolean> => {
    const res = await googleSheetApi.deleteStudent(id);
    if (res.success && res.data) {
      setSiswa(res.data);
      // Clean up local list
      showToast('Siswa beserta seluruh riwayatnya berhasil dihapus.', 'success');
      // Refresh logs
      loadAllData();
      return true;
    } else {
      showToast(res.message || 'Gagal menghapus siswa.', 'error');
      return false;
    }
  };

  // 2. Violation Master CRUD
  const handleAddViolation = async (violationData: Omit<Pelanggaran, 'id'> & { id?: string }): Promise<boolean> => {
    const res = await googleSheetApi.addViolation(violationData);
    if (res.success && res.data) {
      setViolations(res.data);
      showToast('Aturan sanksi kesiswaan berhasil disimpan.', 'success');
      return true;
    } else {
      showToast(res.message || 'Gagal menyimpan jenis pelanggaran.', 'error');
      return false;
    }
  };

  const handleDeleteViolation = async (id: string): Promise<boolean> => {
    const res = await googleSheetApi.deleteViolation(id);
    if (res.success && res.data) {
      setViolations(res.data);
      showToast('Sanksi berhasil dihapus dari daftar master.', 'success');
      return true;
    } else {
      showToast(res.message || 'Gagal menghapus pelanggaran.', 'error');
      return false;
    }
  };

  // 3. Log Records mutations (addRecord / deleteRecord)
  const handleAddRecord = async (recordData: {
    nis: string;
    pelanggaran: string;
    tanggal: string;
    petugas: string;
    keterangan: string;
  }): Promise<boolean> => {
    const res = await googleSheetApi.addRecord(recordData);
    if (res.success && res.data) {
      // Refresh all datasets because points recalculation takes place
      await loadAllData();
      showToast('Pencatatan pelanggaran baru berhasil direkam.', 'success');
      return true;
    } else {
      showToast(res.message || 'Gagal menyimpan pencatatan.', 'error');
      return false;
    }
  };

  const handleDeleteRecord = async (id: string): Promise<boolean> => {
    const res = await googleSheetApi.deleteRecord(id);
    if (res.success && res.data) {
      await loadAllData();
      showToast('Catatan pelanggaran telah berhasil dibatalkan/dihapus.', 'success');
      return true;
    } else {
      showToast(res.message || 'Gagal membatalkan catatan pelanggaran.', 'error');
      return false;
    }
  };

  // Handle linking to Student Profile from other widgets
  const handleSelectSiswa = (nis: string) => {
    setSelectedNisFromOutside(nis);
    setActiveTab('riwayat');
  };

  // ------------------ RENDER TAB CONTEXT ------------------

  // Check roles permissions
  const renderTabContent = () => {
    if (!currentUser) return null;

    const userRole = currentUser.role;

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview
            siswa={siswa}
            pelanggaran={violations}
            pencatatan={pencatatan}
            pembinaan={pembinaan}
            onNavigate={(tab) => setActiveTab(tab)}
            onSelectSiswa={handleSelectSiswa}
          />
        );
      
      case 'siswa':
        if (userRole !== 'Admin' && userRole !== 'Guru BK') {
          return <AccessDenied />;
        }
        return (
          <SiswaList
            siswa={siswa}
            pencatatan={pencatatan}
            userRole={userRole}
            onAddStudent={handleAddStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        );

      case 'pelanggaran':
        return (
          <PelanggaranList
            violations={violations}
            userRole={userRole}
            onAddViolation={handleAddViolation}
            onDeleteViolation={handleDeleteViolation}
          />
        );

      case 'input':
        if (userRole !== 'Admin' && userRole !== 'Guru BK') {
          return <AccessDenied />;
        }
        return (
          <InputPelanggaranForm
            siswa={siswa}
            violations={violations}
            currentUser={currentUser}
            onAddRecord={handleAddRecord}
          />
        );

      case 'riwayat':
        return (
          <RiwayatSiswaDetail
            siswa={siswa}
            pencatatan={pencatatan}
            pembinaan={pembinaan}
            userRole={userRole}
            onDeleteRecord={handleDeleteRecord}
            selectedNisFromOutside={selectedNisFromOutside}
          />
        );

      case 'laporan':
        // Guru Piket can only see their class's data if configured, otherwise see all
        let displaySiswa = siswa;
        let displayPencatatan = pencatatan;
        
        if (userRole === 'Guru Piket' && currentUser.kelasAjar) {
          displaySiswa = siswa.filter(s => s.kelas === currentUser.kelasAjar);
          displayPencatatan = pencatatan.filter(r => r.kelas === currentUser.kelasAjar);
        }

        return (
          <LaporanSiswa
            pencatatan={displayPencatatan}
            siswa={displaySiswa}
          />
        );

      case 'peringkat':
        return (
          <PeringkatLeaderboard
            siswa={siswa}
            pencatatan={pencatatan}
            violations={violations}
            onSelectSiswa={handleSelectSiswa}
          />
        );

      case 'setup':
        if (userRole !== 'Admin') {
          return <AccessDenied />;
        }
        return <SetupPanduan />;

      default:
        return <div className="text-center py-10 font-bold">Modul Belum Diimplementasikan</div>;
    }
  };

  // Access Denied Widget
  const AccessDenied = () => (
    <div className="bg-white p-12 rounded-2xl border border-red-100 text-center space-y-4 max-w-xl mx-auto shadow-xs">
      <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
      <h3 className="font-extrabold text-slate-900 text-lg">Akses Ditolak</h3>
      <p className="text-slate-500 text-xs leading-relaxed">
        Maaf, akun Anda ({currentUser?.nama} - {currentUser?.role}) tidak memiliki hak akses yang memadai untuk membuka modul administratif ini. Silakan hubungi Admin Sekolah jika ini adalah kekeliruan.
      </p>
    </div>
  );

  // ------------------ LOGIN PANEL SCREEN ------------------

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
        
        {/* Institutional School Logo & Name Banner */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
          <div className="inline-flex p-4 rounded-3xl bg-blue-600/15 border border-blue-500/30 text-blue-500 shadow-xl shadow-blue-500/5">
            <GraduationCap className="w-12 h-12" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-white tracking-tight font-display">PORTAL KESISWAAN DIGITAL</h1>
            <p className="text-xs text-slate-400 font-medium">Sistem Monitoring & Pencatatan Pelanggaran Tata Tertib Siswa</p>
          </div>
        </div>

        {/* Login box */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-5 duration-350">
          <div className="bg-slate-900/40 border border-slate-800 backdrop-blur-md py-8 px-6 sm:px-10 rounded-3xl shadow-2xl space-y-6">
            
            <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
              <KeyRound className="w-4.5 h-4.5 text-blue-500" />
              <span className="text-sm font-bold text-slate-200">Masuk Aplikasi</span>
            </div>

            {loginError && (
              <div className="flex items-center gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-400 text-xs">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Username</label>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Ketik username Anda..."
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-blue-600 rounded-xl outline-none text-sm text-slate-200 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Ketik password sandi..."
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-blue-600 rounded-xl outline-none text-sm text-slate-200 transition-all"
                />
              </div>

              <button
                id="btn-login"
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-900/40 cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoggingIn ? 'Memvalidasi...' : 'Masuk Dashboard'}
              </button>
            </form>

            {/* Quick Login Templates for Demo and Grading */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Pilih Akun Penguji Cepat:
              </span>
              <div className="grid grid-cols-3 gap-2 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', 'admin123')}
                  className="py-2 px-1 text-center bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg cursor-pointer border border-slate-800 transition-colors"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('gurubk', 'bk123')}
                  className="py-2 px-1 text-center bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg cursor-pointer border border-slate-800 transition-colors"
                >
                  Guru BK
                </button>
                 <button
                  type="button"
                  onClick={() => handleQuickLogin('gurupiket', 'piket123')}
                  className="py-2 px-1 text-center bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg cursor-pointer border border-slate-800 transition-colors"
                >
                  Guru Piket
                </button>
              </div>
              <p className="text-[9px] text-slate-500 leading-normal text-center">
                *Role Guru Piket dibatasi otomatis hanya menampilkan laporan siswa untuk kelas <strong>"9-A"</strong>.
              </p>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ------------------ MAIN WORKSPACE DASHBOARD ------------------

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard, roles: ['Admin', 'Guru BK', 'Guru Piket'] },
    { id: 'siswa', label: 'Manajemen Siswa', icon: Users, roles: ['Admin', 'Guru BK'] },
    { id: 'pelanggaran', label: 'Master Pelanggaran', icon: Scale, roles: ['Admin', 'Guru BK', 'Guru Piket'] },
    { id: 'input', label: 'Input Pelanggaran', icon: PlusCircle, roles: ['Admin', 'Guru BK'] },
    { id: 'riwayat', label: 'Riwayat Siswa', icon: UserSearch, roles: ['Admin', 'Guru BK', 'Guru Piket'] },
    { id: 'laporan', label: 'Laporan Rekap', icon: FileSpreadsheet, roles: ['Admin', 'Guru BK', 'Guru Piket'] },
    { id: 'peringkat', label: 'Peringkat & Graf', icon: Trophy, roles: ['Admin', 'Guru BK', 'Guru Piket'] },
    { id: 'setup', label: 'Koneksi Sheets', icon: Settings, roles: ['Admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      
      {/* Toast message popup */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl border bg-white shadow-2xl flex items-start gap-3 w-80 animate-in fade-in slide-in-from-top-5 duration-350">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5.5 h-5.5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5.5 h-5.5 text-rose-500 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-900 block">Sistem Kesiswaan</span>
            <p className="text-xs text-slate-600 leading-normal">{toast.message}</p>
          </div>
        </div>
      )}

      {/* MOBILE HEADER BAR */}
      <div className="md:hidden bg-blue-950 border-b border-blue-900 text-white py-4 px-5 flex justify-between items-center no-print">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-blue-500" />
          <span className="font-extrabold tracking-tight text-sm font-display">SIPEL - KESISWAAN</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 hover:bg-blue-900 rounded-lg cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* SIDEBAR NAVIGATION (Desktop persistent, Mobile collapsible drawer) */}
      <aside className={`w-full md:w-60 bg-blue-950 text-slate-300 flex flex-col justify-between shrink-0 no-print border-r border-blue-900 transition-all duration-300 md:block ${
        isMobileMenuOpen ? 'block' : 'hidden'
      }`}>
        <div className="space-y-6">
          {/* Logo brand */}
          <div className="p-6 border-b border-blue-900 hidden md:flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <span className="font-bold text-white text-lg tracking-tight font-display block leading-none">SIPEL SISWA</span>
              <span className="text-[10px] text-blue-300 font-semibold uppercase tracking-wider block">Portal Kesiswaan</span>
            </div>
          </div>

          {/* Nav List */}
          <nav className="py-4 px-3 space-y-1">
            {filteredMenuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  id={`tab-nav-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                    if (item.id === 'riwayat') setSelectedNisFromOutside(''); // Clear search override on direct click
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-blue-500/10 text-blue-400' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User context footer card */}
        <div className="p-4 border-t border-blue-900 bg-blue-950/60 space-y-4">
          <div className="p-4 bg-blue-900/40 rounded-xl border border-blue-900/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-white/20 overflow-hidden flex items-center justify-center font-bold text-white">
                {currentUser.nama.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 space-y-0.5">
                <span className="text-xs font-bold text-white truncate block leading-tight">{currentUser.nama}</span>
                <span className="text-[10px] text-blue-300 font-semibold block uppercase tracking-wider">
                  {currentUser.role} {currentUser.kelasAjar ? `(${currentUser.kelasAjar})` : ''}
                </span>
              </div>
            </div>
          </div>

          <button
            id="btn-logout"
            onClick={handleLogout}
            className="w-full py-2 bg-blue-900/20 hover:bg-rose-900/25 text-slate-400 hover:text-rose-400 font-bold text-xs rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-900/20 flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Keluar Sistem
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE VIEWPORT */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Loader status indicator overlay */}
        {isLoadingData ? (
          <div className="flex flex-col items-center justify-center h-96 space-y-3">
            <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-slate-500 font-mono text-xs">Menyinkronkan Basis Data...</span>
          </div>
        ) : (
          renderTabContent()
        )}
      </main>
    </div>
  );
}

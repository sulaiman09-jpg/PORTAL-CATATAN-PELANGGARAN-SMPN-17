import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Inline database interfaces to make the Serverless Function completely self-contained and avoid import issues
export interface Siswa {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
  jk: 'L' | 'P';
  namaOrangTua: string;
  noHp: string;
}

export interface Pelanggaran {
  id: string;
  kode: string;
  namaPelanggaran: string;
  kategori: 'Ringan' | 'Sedang' | 'Berat';
  poin: number;
}

export interface Pencatatan {
  id: string;
  tanggal: string;
  nis: string;
  namaSiswa: string;
  kelas: string;
  pelanggaran: string;
  poin: number;
  petugas: string;
  keterangan: string;
}

export interface Pembinaan {
  id: string;
  nis: string;
  namaSiswa: string;
  totalPoin: number;
  tindakan: string;
  tanggal: string;
}

export type Role = 'Admin' | 'Guru BK' | 'Guru Piket';

export interface User {
  username: string;
  nama: string;
  role: Role;
  kelasAjar?: string;
}

// Load environment variables
dotenv.config();

const app = express();

app.use(express.json());

// Extremely robust request logger and URL normalizer middleware for Vercel Serverless environment
app.use((req, res, next) => {
  const originalUrl = req.url;
  console.log(`[Express API] Incoming: ${req.method} ${originalUrl}`);

  // We should NOT overwrite req.url with x-matched-path (which is always "/api/index.ts")
  // because that discards the requested sub-path (like "/auth/login").
  // Vercel naturally delivers the original path in req.url. 
  // We only normalize if the URL literally contains the file name "/api/index.ts" or "/api/index".
  if (req.url.startsWith('/api/index.ts')) {
    req.url = req.url.replace('/api/index.ts', '/api');
  } else if (req.url.startsWith('/api/index')) {
    req.url = req.url.replace('/api/index', '/api');
  }

  // Clean double slashes
  req.url = req.url.replace(/\/+/g, '/');
  
  console.log(`[Express API] Final resolved URL for routing: ${req.url}`);
  next();
});

// Path to persistent data store (use /tmp on Vercel for writable filesystem)
const DATA_STORE_PATH = process.env.VERCEL
  ? path.join('/tmp', 'data-store.json')
  : path.join(process.cwd(), 'data-store.json');

// Pre-defined users for simulation/authentication
const preDefinedUsers = [
  { username: 'admin', password: 'admin123', nama: 'Aulia Rohmah', role: 'Admin' },
  { username: 'gurubk', password: 'bk123', nama: 'Sulaiman, S.Psi.', role: 'Guru BK' },
  { username: 'gurupiket', password: 'piket123', nama: 'Paramita Sari, S.Kom.', role: 'Guru Piket', kelasAjar: '9-A' }
];

// Default initial data for simulation
const initialSiswa: Siswa[] = [
  { id: 'S001', nis: '21001', nama: 'Ahmad Fauzi', kelas: '9-A', jk: 'L', namaOrangTua: 'Budi Fauzi', noHp: '081234567890' },
  { id: 'S002', nis: '21002', nama: 'Siti Nurhaliza', kelas: '9-A', jk: 'P', namaOrangTua: 'Nurhalim', noHp: '081345678901' },
  { id: 'S003', nis: '21003', nama: 'Rizky Ramadhan', kelas: '8-B', jk: 'L', namaOrangTua: 'Ramadhan', noHp: '081987654321' },
  { id: 'S004', nis: '21004', nama: 'Chelsea Olivia', kelas: '8-B', jk: 'P', namaOrangTua: 'Hendra', noHp: '081222333444' },
  { id: 'S005', nis: '21005', nama: 'Muhammad Yusuf', kelas: '7-A', jk: 'L', namaOrangTua: 'Yusuf Ibrahim', noHp: '085711122233' },
  { id: 'S006', nis: '21006', nama: 'Amanda Manopo', kelas: '7-C', jk: 'P', namaOrangTua: 'Denny', noHp: '087812345678' },
  { id: 'S007', nis: '21007', nama: 'Budi Santoso', kelas: '9-B', jk: 'L', namaOrangTua: 'Joko Santoso', noHp: '085299998888' },
  { id: 'S008', nis: '21008', nama: 'Dewi Lestari', kelas: '8-A', jk: 'P', namaOrangTua: 'Adi Lestari', noHp: '081122334455' }
];

const initialPelanggaran: Pelanggaran[] = [
  { id: 'P001', kode: 'PK01', namaPelanggaran: 'Terlambat masuk sekolah', kategori: 'Ringan', poin: 5 },
  { id: 'P002', kode: 'PK02', namaPelanggaran: 'Tidak memakai atribut seragam lengkap (topi, dasi, ikat pinggang)', kategori: 'Ringan', poin: 5 },
  { id: 'P003', kode: 'PK03', namaPelanggaran: 'Membawa HP/Gadget tanpa izin guru', kategori: 'Ringan', poin: 10 },
  { id: 'P004', kode: 'PK04', namaPelanggaran: 'Rambut gondrong atau tidak rapi (siswa laki-laki)', kategori: 'Ringan', poin: 10 },
  { id: 'P005', kode: 'PS01', namaPelanggaran: 'Membolos saat jam pelajaran', kategori: 'Sedang', poin: 20 },
  { id: 'P006', kode: 'PS02', namaPelanggaran: 'Keluar lingkungan sekolah tanpa izin', kategori: 'Sedang', poin: 20 },
  { id: 'P007', kode: 'PS03', namaPelanggaran: 'Berpakaian tidak sopan / mencoret-coret seragam', kategori: 'Sedang', poin: 15 },
  { id: 'P008', kode: 'PB01', namaPelanggaran: 'Merokok atau membawa rokok di sekolah', kategori: 'Berat', poin: 50 },
  { id: 'P009', kode: 'PB02', namaPelanggaran: 'Merusak sarana dan prasarana sekolah secara sengaja', kategori: 'Berat', poin: 50 },
  { id: 'P010', kode: 'PB03', namaPelanggaran: 'Terlibat dalam perkelahian atau tawuran', kategori: 'Berat', poin: 75 },
  { id: 'P011', kode: 'PB04', namaPelanggaran: 'Mencuri barang milik orang lain atau milik sekolah', kategori: 'Berat', poin: 75 },
  { id: 'P012', kode: 'PB05', namaPelanggaran: 'Membawa senjata tajam, narkoba, atau minuman keras', kategori: 'Berat', poin: 100 }
];

const initialPencatatan: Pencatatan[] = [
  { id: 'R001', tanggal: '2026-06-10', nis: '21007', namaSiswa: 'Budi Santoso', kelas: '9-B', pelanggaran: 'Terlambat masuk sekolah', poin: 5, petugas: 'Sulaiman, S.Psi.', keterangan: 'Kesiangan karena macet' },
  { id: 'R002', tanggal: '2026-06-15', nis: '21007', namaSiswa: 'Budi Santoso', kelas: '9-B', pelanggaran: 'Rambut gondrong atau tidak rapi (siswa laki-laki)', poin: 10, petugas: 'Sulaiman, S.Psi.', keterangan: 'Rambut bagian belakang menyentuh kerah' },
  { id: 'R003', tanggal: '2026-06-20', nis: '21007', namaSiswa: 'Budi Santoso', kelas: '9-B', pelanggaran: 'Membolos saat jam pelajaran', poin: 20, petugas: 'Paramita Sari, S.Kom.', keterangan: 'Nongkrong di kantin saat jam matematika' },
  { id: 'R004', tanggal: '2026-06-24', nis: '21003', namaSiswa: 'Rizky Ramadhan', kelas: '8-B', pelanggaran: 'Tidak memakai atribut seragam lengkap (topi, dasi, ikat pinggang)', poin: 5, petugas: 'Sulaiman, S.Psi.', keterangan: 'Tidak pakai dasi saat upacara bendera' },
  { id: 'R005', tanggal: '2026-06-01', nis: '21001', namaSiswa: 'Ahmad Fauzi', kelas: '9-A', pelanggaran: 'Terlibat dalam perkelahian atau tawuran', poin: 75, petugas: 'Aulia Rohmah', keterangan: 'Tawuran di luar gerbang sekolah' },
  { id: 'R006', tanggal: '2026-06-12', nis: '21001', namaSiswa: 'Ahmad Fauzi', kelas: '9-A', pelanggaran: 'Merokok atau membawa rokok di sekolah', poin: 50, petugas: 'Sulaiman, S.Psi.', keterangan: 'Ketahuan merokok di toilet belakang' }
];

const initialPembinaan: Pembinaan[] = [
  { id: 'B001', nis: '21007', namaSiswa: 'Budi Santoso', totalPoin: 35, tindakan: 'Teguran Tertulis', tanggal: '2026-06-20' },
  { id: 'B002', nis: '21001', namaSiswa: 'Ahmad Fauzi', totalPoin: 125, tindakan: 'Sidang Disiplin', tanggal: '2026-06-12' }
];

interface DBStructure {
  siswa: Siswa[];
  pelanggaran: Pelanggaran[];
  pencatatan: Pencatatan[];
  pembinaan: Pembinaan[];
}

// Read database
function readDB(): DBStructure {
  try {
    if (!fs.existsSync(DATA_STORE_PATH)) {
      // Ensure the directory exists recursively before writing
      fs.mkdirSync(path.dirname(DATA_STORE_PATH), { recursive: true });

      const defaultData: DBStructure = {
        siswa: initialSiswa,
        pelanggaran: initialPelanggaran,
        pencatatan: initialPencatatan,
        pembinaan: initialPembinaan
      };

      // If running on Vercel, copy existing seed file from build workspace if it exists
      if (process.env.VERCEL) {
        const localPath = path.join(process.cwd(), 'data-store.json');
        if (fs.existsSync(localPath)) {
          const content = fs.readFileSync(localPath, 'utf-8');
          fs.writeFileSync(DATA_STORE_PATH, content, 'utf-8');
          return JSON.parse(content);
        }
      }

      fs.writeFileSync(DATA_STORE_PATH, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const rawData = fs.readFileSync(DATA_STORE_PATH, 'utf-8');
    return JSON.parse(rawData);
  } catch (err) {
    console.error('Error reading DB, using initial data:', err);
    return {
      siswa: initialSiswa,
      pelanggaran: initialPelanggaran,
      pencatatan: initialPencatatan,
      pembinaan: initialPembinaan
    };
  }
}

// Write database
function writeDB(data: DBStructure) {
  try {
    fs.mkdirSync(path.dirname(DATA_STORE_PATH), { recursive: true });
    fs.writeFileSync(DATA_STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// Helper: Recalculate and update Pembinaan table based on current records
function recalculatePembinaan(nis: string, db: DBStructure, tanggalPencatatan: string): DBStructure {
  const student = db.siswa.find(s => s.nis === nis);
  if (!student) return db;

  // Filter all records for this student and sum points
  const studentRecords = db.pencatatan.filter(r => r.nis === nis);
  const totalPoints = studentRecords.reduce((sum, r) => sum + r.poin, 0);

  // Determine coaching actions (Pembinaan)
  let tindakan = 'Teguran Lisan';
  if (totalPoints === 0) {
    // If no points, remove from pembinaan
    db.pembinaan = db.pembinaan.filter(p => p.nis !== nis);
    return db;
  } else if (totalPoints <= 25) {
    tindakan = 'Teguran Lisan';
  } else if (totalPoints <= 50) {
    tindakan = 'Teguran Tertulis';
  } else if (totalPoints <= 75) {
    tindakan = 'Pemanggilan Orang Tua';
  } else if (totalPoints <= 100) {
    tindakan = 'Surat Peringatan';
  } else {
    tindakan = 'Sidang Disiplin';
  }

  // Find existing pembinaan
  const existingIndex = db.pembinaan.findIndex(p => p.nis === nis);
  if (existingIndex !== -1) {
    db.pembinaan[existingIndex] = {
      ...db.pembinaan[existingIndex],
      totalPoin: totalPoints,
      tindakan,
      tanggal: tanggalPencatatan // Keep latest record date as the action date
    };
  } else {
    db.pembinaan.push({
      id: 'B' + Math.floor(1000 + Math.random() * 9000),
      nis,
      namaSiswa: student.nama,
      totalPoin: totalPoints,
      tindakan,
      tanggal: tanggalPencatatan
    });
  }

  return db;
}

// Dynamic proxy logic for Google Apps Script
async function proxyToGoogleScript(action: string, method: 'GET' | 'POST', body: any = null) {
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  if (!scriptUrl) {
    throw new Error('Google Script URL is not configured.');
  }

  const url = `${scriptUrl}?action=${action}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (method === 'POST' && body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Google Apps Script responded with status: ${response.status}`);
  }
  return await response.json();
}

// ---------------------- API ROUTES ----------------------

const apiRouter = express.Router();

// Auth API Route
apiRouter.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = preDefinedUsers.find(u => u.username === username && u.password === password);

  if (user) {
    // Generate a simple mock JWT or token
    const token = `mock-jwt-token-for-${user.username}-${user.role}`;
    return res.json({
      success: true,
      token,
      user: {
        username: user.username,
        nama: user.nama,
        role: user.role,
        kelasAjar: user.kelasAjar
      }
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Username atau password salah.'
  });
});

// Settings & Config status API
apiRouter.get('/settings/config', (req, res) => {
  res.json({
    success: true,
    data: {
      isGoogleScriptConnected: !!process.env.GOOGLE_SCRIPT_URL,
      googleScriptUrl: process.env.GOOGLE_SCRIPT_URL || ''
    }
  });
});

apiRouter.post('/settings/config', (req, res) => {
  const { googleScriptUrl } = req.body;
  
  try {
    // Modify env file or environment dynamically in memory
    process.env.GOOGLE_SCRIPT_URL = googleScriptUrl || '';
    
    let envWriteFailed = false;
    let writeErrorMessage = '';
    
    try {
      // Write/update the .env file if the filesystem is writeable
      const envPath = path.join(process.cwd(), '.env');
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8');
      }
      
      // Simple replacement or append
      if (envContent.includes('GOOGLE_SCRIPT_URL=')) {
        envContent = envContent.replace(/GOOGLE_SCRIPT_URL=.*/g, `GOOGLE_SCRIPT_URL="${googleScriptUrl || ''}"`);
      } else {
        envContent += `\nGOOGLE_SCRIPT_URL="${googleScriptUrl || ''}"\n`;
      }
      fs.writeFileSync(envPath, envContent, 'utf-8');
    } catch (writeErr: any) {
      console.warn('Gagal menulis ke berkas .env (biasa terjadi di serverless/Vercel):', writeErr.message);
      envWriteFailed = true;
      writeErrorMessage = writeErr.message;
    }

    if (envWriteFailed) {
      res.json({
        success: true,
        message: 'Berhasil menyimpan konfigurasi di memori sementara! Catatan: Karena aplikasi berjalan di platform read-only (seperti Vercel), perubahan ini tidak akan bertahan permanen jika server restart. Agar tersimpan permanen, silakan tambahkan variabel lingkungan GOOGLE_SCRIPT_URL langsung di Dashboard Vercel Anda.',
        data: {
          isGoogleScriptConnected: !!googleScriptUrl,
          googleScriptUrl
        }
      });
    } else {
      res.json({
        success: true,
        message: 'Konfigurasi Google Apps Script berhasil disimpan ke berkas .env.',
        data: {
          isGoogleScriptConnected: !!googleScriptUrl,
          googleScriptUrl
        }
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal memproses konfigurasi: ' + error.message
    });
  }
});

// General Data API Endpoint matching Google Apps Script proxy requirements
apiRouter.get('/data', async (req, res) => {
  const action = req.query.action as string;

  // Check if we should proxy to Google Sheets
  if (process.env.GOOGLE_SCRIPT_URL) {
    try {
      const result = await proxyToGoogleScript(action, 'GET');
      return res.json(result);
    } catch (err: any) {
      console.warn('Proxy to Google Script failed, falling back to local DB:', err.message);
      // fallback to local on failure
    }
  }

  // Local storage fallback handlers
  const db = readDB();
  switch (action) {
    case 'getStudents':
      return res.json({ success: true, data: db.siswa });
    case 'getViolations':
      return res.json({ success: true, data: db.pelanggaran });
    case 'getRecords':
      return res.json({ 
        success: true, 
        data: {
          pencatatan: db.pencatatan,
          pembinaan: db.pembinaan
        }
      });
    default:
      return res.status(400).json({ success: false, message: 'Action tidak dikenali atau tidak disupport lewat GET.' });
  }
});

apiRouter.post('/data', async (req, res) => {
  const action = req.query.action as string;
  const body = req.body;

  // Check if we should proxy to Google Sheets
  if (process.env.GOOGLE_SCRIPT_URL) {
    try {
      const result = await proxyToGoogleScript(action, 'POST', body);
      return res.json(result);
    } catch (err: any) {
      console.warn('Proxy writing to Google Script failed, writing locally:', err.message);
      // fallback to local
    }
  }

  const db = readDB();

  switch (action) {
    case 'addStudent': {
      const newSiswa: Siswa = {
        id: body.id || 'S' + Math.floor(1000 + Math.random() * 9000),
        nis: body.nis,
        nama: body.nama,
        kelas: body.kelas,
        jk: body.jk,
        namaOrangTua: body.namaOrangTua,
        noHp: body.noHp
      };

      // Check if NIS already exists for addition (only if not an edit/overwrite)
      const existingIdx = db.siswa.findIndex(s => s.nis === body.nis);
      if (existingIdx !== -1 && !body.id) {
        return res.status(400).json({ success: false, message: 'NIS sudah terdaftar.' });
      }

      if (body.id) {
        // Edit existing
        const idx = db.siswa.findIndex(s => s.id === body.id);
        if (idx !== -1) {
          db.siswa[idx] = newSiswa;
        } else {
          db.siswa.push(newSiswa);
        }
      } else {
        db.siswa.push(newSiswa);
      }

      writeDB(db);
      return res.json({ success: true, message: 'Data siswa berhasil disimpan.', data: db.siswa });
    }

    case 'deleteStudent': {
      const studentToDelete = db.siswa.find(s => s.id === body.id);
      if (!studentToDelete) {
        return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan.' });
      }

      db.siswa = db.siswa.filter(s => s.id !== body.id);
      // Clean up records and coaching for deleted student
      db.pencatatan = db.pencatatan.filter(r => r.nis !== studentToDelete.nis);
      db.pembinaan = db.pembinaan.filter(p => p.nis !== studentToDelete.nis);

      writeDB(db);
      return res.json({ success: true, message: 'Data siswa berhasil dihapus.', data: db.siswa });
    }

    case 'addViolation': {
      const newViolation: Pelanggaran = {
        id: body.id || 'P' + Math.floor(1000 + Math.random() * 9000),
        kode: body.kode,
        namaPelanggaran: body.namaPelanggaran,
        kategori: body.kategori,
        poin: parseInt(body.poin, 10) || 0
      };

      if (body.id) {
        const idx = db.pelanggaran.findIndex(v => v.id === body.id);
        if (idx !== -1) {
          db.pelanggaran[idx] = newViolation;
        } else {
          db.pelanggaran.push(newViolation);
        }
      } else {
        db.pelanggaran.push(newViolation);
      }

      writeDB(db);
      return res.json({ success: true, message: 'Jenis pelanggaran berhasil disimpan.', data: db.pelanggaran });
    }

    case 'deleteViolation': {
      db.pelanggaran = db.pelanggaran.filter(v => v.id !== body.id);
      writeDB(db);
      return res.json({ success: true, message: 'Jenis pelanggaran berhasil dihapus.', data: db.pelanggaran });
    }

    case 'addRecord': {
      // Find student and violation details to fill points and full info
      const student = db.siswa.find(s => s.nis === body.nis);
      if (!student) {
        return res.status(404).json({ success: false, message: 'NIS siswa tidak terdaftar.' });
      }

      const violationMaster = db.pelanggaran.find(v => v.namaPelanggaran === body.pelanggaran);
      const points = violationMaster ? violationMaster.poin : 0;

      const newRecord: Pencatatan = {
        id: body.id || 'R' + Math.floor(1000 + Math.random() * 9000),
        tanggal: body.tanggal || new Date().toISOString().split('T')[0],
        nis: body.nis,
        namaSiswa: student.nama,
        kelas: student.kelas,
        pelanggaran: body.pelanggaran,
        poin: points,
        petugas: body.petugas,
        keterangan: body.keterangan || ''
      };

      if (body.id) {
        const idx = db.pencatatan.findIndex(r => r.id === body.id);
        if (idx !== -1) {
          db.pencatatan[idx] = newRecord;
        } else {
          db.pencatatan.push(newRecord);
        }
      } else {
        db.pencatatan.push(newRecord);
      }

      // Automatically recalculate points and create/update pembinaan
      let updatedDb = recalculatePembinaan(student.nis, db, newRecord.tanggal);

      writeDB(updatedDb);
      return res.json({ success: true, message: 'Pelanggaran siswa berhasil dicatat.', data: updatedDb.pencatatan });
    }

    case 'deleteRecord': {
      const record = db.pencatatan.find(r => r.id === body.id);
      if (!record) {
        return res.status(404).json({ success: false, message: 'Pencatatan pelanggaran tidak ditemukan.' });
      }

      db.pencatatan = db.pencatatan.filter(r => r.id !== body.id);

      // Recalculate pembinaan for this student since their records changed
      let updatedDb = recalculatePembinaan(record.nis, db, new Date().toISOString().split('T')[0]);

      writeDB(updatedDb);
      return res.json({ success: true, message: 'Pencatatan pelanggaran berhasil dihapus.', data: updatedDb.pencatatan });
    }

    default:
      return res.status(400).json({ success: false, message: 'Action tidak dikenali atau tidak disupport lewat POST.' });
  }
});

// Mount the apiRouter under both "/api" and "/" to guarantee it runs flawlessly locally AND on Vercel serverless environments!
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Global Error Handler for Serverless Environments (prevents silent crashes and returns clear JSON errors)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Global Error Handler] Caught error:', err);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan internal pada server.',
    error: err.message || String(err),
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });
});

// Process-level event listeners to capture async or top-level failures gracefully
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception Alert]:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection Alert]:', reason);
});

export default app;

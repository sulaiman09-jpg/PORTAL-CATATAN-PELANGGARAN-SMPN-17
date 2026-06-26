import { Siswa, Pelanggaran, Pencatatan, Pembinaan, AuthResponse, ApiResponse } from '../types';

// Helper to get active auth token
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export const googleSheetApi = {
  // 1. Authentication
  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Gagal terhubung ke server.' };
    }
  },

  // 2. Fetch config status
  async getConfig(): Promise<ApiResponse<{ isGoogleScriptConnected: boolean; googleScriptUrl: string }>> {
    try {
      const response = await fetch('/api/settings/config', {
        headers: getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Fetch config error:', error);
      return { success: false, message: 'Gagal mengambil data konfigurasi.' };
    }
  },

  // Save config URL
  async saveConfig(googleScriptUrl: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('/api/settings/config', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ googleScriptUrl })
      });
      return await response.json();
    } catch (error) {
      console.error('Save config error:', error);
      return { success: false, message: 'Gagal menyimpan konfigurasi.' };
    }
  },

  // 3. Students (Siswa) APIs
  async getStudents(): Promise<ApiResponse<Siswa[]>> {
    try {
      const response = await fetch('/api/data?action=getStudents', {
        headers: getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Fetch students error:', error);
      return { success: false, message: 'Gagal mengambil data siswa.' };
    }
  },

  async addStudent(data: Omit<Siswa, 'id'> & { id?: string }): Promise<ApiResponse<Siswa[]>> {
    try {
      const response = await fetch('/api/data?action=addStudent', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Add student error:', error);
      return { success: false, message: 'Gagal menyimpan data siswa.' };
    }
  },

  async deleteStudent(id: string): Promise<ApiResponse<Siswa[]>> {
    try {
      const response = await fetch('/api/data?action=deleteStudent', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id })
      });
      return await response.json();
    } catch (error) {
      console.error('Delete student error:', error);
      return { success: false, message: 'Gagal menghapus data siswa.' };
    }
  },

  // 4. Master Violations (Pelanggaran) APIs
  async getViolations(): Promise<ApiResponse<Pelanggaran[]>> {
    try {
      const response = await fetch('/api/data?action=getViolations', {
        headers: getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Fetch violations error:', error);
      return { success: false, message: 'Gagal mengambil data pelanggaran.' };
    }
  },

  async addViolation(data: Omit<Pelanggaran, 'id'> & { id?: string }): Promise<ApiResponse<Pelanggaran[]>> {
    try {
      const response = await fetch('/api/data?action=addViolation', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Add violation error:', error);
      return { success: false, message: 'Gagal menyimpan jenis pelanggaran.' };
    }
  },

  async deleteViolation(id: string): Promise<ApiResponse<Pelanggaran[]>> {
    try {
      const response = await fetch('/api/data?action=deleteViolation', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id })
      });
      return await response.json();
    } catch (error) {
      console.error('Delete violation error:', error);
      return { success: false, message: 'Gagal menghapus jenis pelanggaran.' };
    }
  },

  // 5. Records (Pencatatan & Pembinaan) APIs
  async getRecords(): Promise<ApiResponse<{ pencatatan: Pencatatan[]; pembinaan: Pembinaan[] }>> {
    try {
      const response = await fetch('/api/data?action=getRecords', {
        headers: getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Fetch records error:', error);
      return { success: false, message: 'Gagal mengambil data riwayat pelanggaran.' };
    }
  },

  async addRecord(data: { nis: string; pelanggaran: string; tanggal?: string; petugas: string; keterangan?: string; id?: string }): Promise<ApiResponse<{ pencatatan: Pencatatan[]; pembinaan: Pembinaan[] }>> {
    try {
      const response = await fetch('/api/data?action=addRecord', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Add record error:', error);
      return { success: false, message: 'Gagal menyimpan pencatatan pelanggaran.' };
    }
  },

  async deleteRecord(id: string): Promise<ApiResponse<{ pencatatan: Pencatatan[]; pembinaan: Pembinaan[] }>> {
    try {
      const response = await fetch('/api/data?action=deleteRecord', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id })
      });
      return await response.json();
    } catch (error) {
      console.error('Delete record error:', error);
      return { success: false, message: 'Gagal menghapus pencatatan pelanggaran.' };
    }
  }
};

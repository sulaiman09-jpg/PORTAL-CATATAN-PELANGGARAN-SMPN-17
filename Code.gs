/**
 * Google Apps Script - Sistem Pencatatan Pelanggaran Siswa
 * 
 * SCRIPT SETUP:
 * 1. Buka Google Sheets, buat spreadsheet baru.
 * 2. Klik Ekstensi > Apps Script.
 * 3. Hapus kode bawaan dan tempel kode ini ke dalam editor.
 * 4. Klik ikon Simpan.
 * 5. Klik Penerapan (Deploy) > Penerapan Baru (New Deployment).
 * 6. Pilih Jenis: "Aplikasi Web" (Web App).
 * 7. Konfigurasi:
 *    - Deskripsi: Sistem Pelanggaran Web API
 *    - Jalankan sebagai: "Saya" (Me - email anda)
 *    - Siapa yang memiliki akses: "Siapa saja" (Anyone - ini penting agar aplikasi web bisa mengaksesnya).
 * 8. Klik Terapkan (Deploy). Berikan izin akses (Authorize Access) jika diminta.
 * 9. Salin URL Aplikasi Web yang diberikan, lalu masukkan ke file .env atau panel Setup di aplikasi web.
 */

function doGet(e) {
  var action = e.parameter.action;
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Pastikan sheet siap digunakan
  initializeSheets(sheet);
  
  try {
    var responseData;
    if (action === 'getStudents') {
      responseData = getStudents(sheet);
    } else if (action === 'getViolations') {
      responseData = getViolations(sheet);
    } else if (action === 'getRecords') {
      responseData = getRecords(sheet);
    } else {
      return createJsonResponse({ success: false, message: 'Action tidak dikenali atau format GET salah' });
    }
    
    return createJsonResponse({ success: true, data: responseData });
  } catch (error) {
    return createJsonResponse({ success: false, message: 'Terjadi kesalahan: ' + error.toString() });
  }
}

function doPost(e) {
  var action = e.parameter.action;
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  
  initializeSheets(sheet);
  
  try {
    var postData = JSON.parse(e.postData.contents);
    var responseData;
    
    if (action === 'addStudent') {
      responseData = addStudent(sheet, postData);
    } else if (action === 'deleteStudent') {
      responseData = deleteStudent(sheet, postData);
    } else if (action === 'addViolation') {
      responseData = addViolation(sheet, postData);
    } else if (action === 'deleteViolation') {
      responseData = deleteViolation(sheet, postData);
    } else if (action === 'addRecord') {
      responseData = addRecord(sheet, postData);
    } else if (action === 'deleteRecord') {
      responseData = deleteRecord(sheet, postData);
    } else {
      return createJsonResponse({ success: false, message: 'Action tidak dikenali atau format POST salah' });
    }
    
    return createJsonResponse({ success: true, message: 'Operasi berhasil', data: responseData });
  } catch (error) {
    return createJsonResponse({ success: false, message: 'Terjadi kesalahan POST: ' + error.toString() });
  }
}

// Menghindari CORS dan mengembalikan output JSON
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Menginisialisasi sheet-sheet jika kosong / belum ada
function initializeSheets(ss) {
  var sheets = {
    'SISWA': ['ID', 'NIS', 'Nama', 'Kelas', 'JK', 'Nama Orang Tua', 'No HP', 'Foto'],
    'PELANGGARAN': ['ID', 'Kode', 'Nama Pelanggaran', 'Kategori', 'Poin'],
    'PENCATATAN': ['ID', 'Tanggal', 'NIS', 'Nama Siswa', 'Kelas', 'Pelanggaran', 'Poin', 'Petugas', 'Keterangan', 'Foto'],
    'PEMBINAAN': ['ID', 'NIS', 'Nama Siswa', 'Total Poin', 'Tindakan', 'Tanggal']
  };
  
  for (var name in sheets) {
    var sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      sh.appendRow(sheets[name]);
      
      // Tambahkan data dummy awal jika ini sheet baru, agar tidak kosong
      if (name === 'SISWA') {
        sh.appendRow(['S001', '21001', 'Ahmad Fauzi', '9-A', 'L', 'Budi Fauzi', '081234567890']);
        sh.appendRow(['S002', '21002', 'Siti Nurhaliza', '9-A', 'P', 'Nurhalim', '081345678901']);
        sh.appendRow(['S003', '21003', 'Rizky Ramadhan', '8-B', 'L', 'Ramadhan', '081987654321']);
      } else if (name === 'PELANGGARAN') {
        sh.appendRow(['P001', 'PK01', 'Terlambat masuk sekolah', 'Ringan', '5']);
        sh.appendRow(['P002', 'PK02', 'Tidak memakai atribut seragam lengkap', 'Ringan', '5']);
        sh.appendRow(['P003', 'PK03', 'Membawa HP/Gadget tanpa izin guru', 'Ringan', '10']);
        sh.appendRow(['P004', 'PS01', 'Membolos saat jam pelajaran', 'Sedang', '20']);
        sh.appendRow(['P005', 'PB01', 'Merokok atau membawa rokok di sekolah', 'Berat', '50']);
      }
    } else {
      // Sheet exists, heal missing headers
      var lastCol = sh.getLastColumn();
      if (lastCol > 0) {
        var existingHeaders = sh.getRange(1, 1, 1, lastCol).getValues()[0];
        var expectedHeaders = sheets[name];
        for (var i = 0; i < expectedHeaders.length; i++) {
          var expected = expectedHeaders[i];
          if (existingHeaders.indexOf(expected) === -1) {
            sh.getRange(1, sh.getLastColumn() + 1).setValue(expected);
          }
        }
      }
    }
  }
}

// Helper: Membaca sheet menjadi array of object
function getSheetData(sh) {
  var values = sh.getDataRange().getValues();
  if (values.length <= 1) return [];
  
  var headers = values[0];
  var list = [];
  
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var item = {};
    for (var j = 0; j < headers.length; j++) {
      item[headers[j]] = row[j];
    }
    list.push(item);
  }
  return list;
}

// 1. GET STUDENTS
function getStudents(ss) {
  var sh = ss.getSheetByName('SISWA');
  var rawData = getSheetData(sh);
  
  return rawData.map(function(item) {
    return {
      id: String(item['ID'] || ''),
      nis: String(item['NIS'] || ''),
      nama: String(item['Nama'] || ''),
      kelas: String(item['Kelas'] || ''),
      jk: String(item['JK'] || 'L'),
      namaOrangTua: String(item['Nama Orang Tua'] || ''),
      noHp: String(item['No HP'] || ''),
      foto: String(item['Foto'] || '')
    };
  });
}

// 2. GET VIOLATIONS
function getViolations(ss) {
  var sh = ss.getSheetByName('PELANGGARAN');
  var rawData = getSheetData(sh);
  
  return rawData.map(function(item) {
    return {
      id: String(item['ID'] || ''),
      kode: String(item['Kode'] || ''),
      namaPelanggaran: String(item['Nama Pelanggaran'] || ''),
      kategori: String(item['Kategori'] || 'Ringan'),
      poin: Number(item['Poin'] || 0)
    };
  });
}

// 3. GET RECORDS (Pencatatan & Pembinaan)
function getRecords(ss) {
  var shPencatatan = ss.getSheetByName('PENCATATAN');
  var shPembinaan = ss.getSheetByName('PEMBINAAN');
  
  var dataPencatatan = getSheetData(shPencatatan).map(function(item) {
    return {
      id: String(item['ID'] || ''),
      tanggal: String(item['Tanggal'] || '').split('T')[0],
      nis: String(item['NIS'] || ''),
      namaSiswa: String(item['Nama Siswa'] || ''),
      kelas: String(item['Kelas'] || ''),
      pelanggaran: String(item['Pelanggaran'] || ''),
      poin: Number(item['Poin'] || 0),
      petugas: String(item['Petugas'] || ''),
      keterangan: String(item['Keterangan'] || ''),
      foto: String(item['Foto'] || '')
    };
  });
  
  var dataPembinaan = getSheetData(shPembinaan).map(function(item) {
    return {
      id: String(item['ID'] || ''),
      nis: String(item['NIS'] || ''),
      namaSiswa: String(item['Nama Siswa'] || ''),
      totalPoin: Number(item['Total Poin'] || 0),
      tindakan: String(item['Tindakan'] || ''),
      tanggal: String(item['Tanggal'] || '').split('T')[0]
    };
  });
  
  return {
    pencatatan: dataPencatatan,
    pembinaan: dataPembinaan
  };
}

// 4. ADD STUDENT (Create / Update)
function addStudent(ss, data) {
  var sh = ss.getSheetByName('SISWA');
  var values = sh.getDataRange().getValues();
  var id = data.id || ('S' + Math.floor(1000 + Math.random() * 9000));
  var foundRow = -1;
  
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id) || (data.nis && String(values[i][1]) === String(data.nis))) {
      foundRow = i + 1; // 1-indexed for sheets
      break;
    }
  }
  
  var rowData = [id, data.nis, data.nama, data.kelas, data.jk, data.namaOrangTua, data.noHp, data.foto || ''];
  
  if (foundRow !== -1) {
    // Update existing
    sh.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    // Append new
    sh.appendRow(rowData);
  }
  
  return getStudents(ss);
}

// 5. DELETE STUDENT
function deleteStudent(ss, data) {
  var sh = ss.getSheetByName('SISWA');
  var values = sh.getDataRange().getValues();
  var id = data.id;
  var nisToDelete = '';
  
  for (var i = values.length - 1; i >= 1; i--) {
    if (String(values[i][0]) === String(id)) {
      nisToDelete = String(values[i][1]);
      sh.deleteRow(i + 1);
      break;
    }
  }
  
  // Jika siswa dihapus, bersihkan pencatatan dan pembinaan milik siswa tersebut
  if (nisToDelete) {
    var shPencatatan = ss.getSheetByName('PENCATATAN');
    var valPencatatan = shPencatatan.getDataRange().getValues();
    for (var j = valPencatatan.length - 1; j >= 1; j--) {
      if (String(valPencatatan[j][2]) === nisToDelete) {
        shPencatatan.deleteRow(j + 1);
      }
    }
    
    var shPembinaan = ss.getSheetByName('PEMBINAAN');
    var valPembinaan = shPembinaan.getDataRange().getValues();
    for (var k = valPembinaan.length - 1; k >= 1; k--) {
      if (String(valPembinaan[k][1]) === nisToDelete) {
        shPembinaan.deleteRow(k + 1);
      }
    }
  }
  
  return getStudents(ss);
}

// 6. ADD VIOLATION (Create / Update)
function addViolation(ss, data) {
  var sh = ss.getSheetByName('PELANGGARAN');
  var values = sh.getDataRange().getValues();
  var id = data.id || ('P' + Math.floor(1000 + Math.random() * 9000));
  var foundRow = -1;
  
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id) || (data.kode && String(values[i][1]) === String(data.kode))) {
      foundRow = i + 1;
      break;
    }
  }
  
  var rowData = [id, data.kode, data.namaPelanggaran, data.kategori, Number(data.poin)];
  
  if (foundRow !== -1) {
    sh.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sh.appendRow(rowData);
  }
  
  return getViolations(ss);
}

// 7. DELETE VIOLATION
function deleteViolation(ss, data) {
  var sh = ss.getSheetByName('PELANGGARAN');
  var values = sh.getDataRange().getValues();
  var id = data.id;
  
  for (var i = values.length - 1; i >= 1; i--) {
    if (String(values[i][0]) === String(id)) {
      sh.deleteRow(i + 1);
      break;
    }
  }
  
  return getViolations(ss);
}

// 8. ADD RECORD
function addRecord(ss, data) {
  var shSiswa = ss.getSheetByName('SISWA');
  var valSiswa = shSiswa.getDataRange().getValues();
  var siswaNama = '';
  var siswaKelas = '';
  
  for (var i = 1; i < valSiswa.length; i++) {
    if (String(valSiswa[i][1]) === String(data.nis)) {
      siswaNama = valSiswa[i][2];
      siswaKelas = valSiswa[i][3];
      break;
    }
  }
  
  if (!siswaNama) {
    throw new Error('Siswa dengan NIS ' + data.nis + ' tidak ditemukan.');
  }
  
  // Ambil poin dari master pelanggaran
  var shViolations = ss.getSheetByName('PELANGGARAN');
  var valViolations = shViolations.getDataRange().getValues();
  var poin = 0;
  for (var j = 1; j < valViolations.length; j++) {
    if (String(valViolations[j][2]) === String(data.pelanggaran)) {
      poin = Number(valViolations[j][4]);
      break;
    }
  }
  
  var shPencatatan = ss.getSheetByName('PENCATATAN');
  var valPencatatan = shPencatatan.getDataRange().getValues();
  var id = data.id || ('R' + Math.floor(1000 + Math.random() * 9000));
  var foundRow = -1;
  
  for (var k = 1; k < valPencatatan.length; k++) {
    if (String(valPencatatan[k][0]) === String(id)) {
      foundRow = k + 1;
      break;
    }
  }
  
  var tanggal = data.tanggal || new Date().toISOString().split('T')[0];
  var rowData = [id, tanggal, data.nis, siswaNama, siswaKelas, data.pelanggaran, poin, data.petugas, data.keterangan || '', data.foto || ''];
  
  if (foundRow !== -1) {
    shPencatatan.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    shPencatatan.appendRow(rowData);
  }
  
  // Recalculate Pembinaan
  recalculatePembinaanForStudent(ss, data.nis, siswaNama, tanggal);
  
  return getRecords(ss);
}

// 9. DELETE RECORD
function deleteRecord(ss, data) {
  var shPencatatan = ss.getSheetByName('PENCATATAN');
  var valPencatatan = shPencatatan.getDataRange().getValues();
  var id = data.id;
  var nis = '';
  var siswaNama = '';
  
  for (var i = valPencatatan.length - 1; i >= 1; i--) {
    if (String(valPencatatan[i][0]) === String(id)) {
      nis = String(valPencatatan[i][2]);
      siswaNama = String(valPencatatan[i][3]);
      shPencatatan.deleteRow(i + 1);
      break;
    }
  }
  
  if (nis) {
    recalculatePembinaanForStudent(ss, nis, siswaNama, new Date().toISOString().split('T')[0]);
  }
  
  return getRecords(ss);
}

// Helper: Hitung otomatis poin kumulatif dan update sheet PEMBINAAN
function recalculatePembinaanForStudent(ss, nis, namaSiswa, tanggalPencatatan) {
  var shPencatatan = ss.getSheetByName('PENCATATAN');
  var valPencatatan = shPencatatan.getDataRange().getValues();
  var totalPoints = 0;
  
  for (var i = 1; i < valPencatatan.length; i++) {
    if (String(valPencatatan[i][2]) === String(nis)) {
      totalPoints += Number(valPencatatan[i][6] || 0);
    }
  }
  
  var shPembinaan = ss.getSheetByName('PEMBINAAN');
  var valPembinaan = shPembinaan.getDataRange().getValues();
  var foundRow = -1;
  
  for (var j = 1; j < valPembinaan.length; j++) {
    if (String(valPembinaan[j][1]) === String(nis)) {
      foundRow = j + 1;
      break;
    }
  }
  
  if (totalPoints === 0) {
    // Jika total poin 0, hapus dari baris pembinaan jika ada
    if (foundRow !== -1) {
      shPembinaan.deleteRow(foundRow);
    }
    return;
  }
  
  // Aturan Pembinaan
  var tindakan = 'Teguran Lisan';
  if (totalPoints <= 25) {
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
  
  var id = foundRow !== -1 ? String(valPembinaan[foundRow - 1][0]) : ('B' + Math.floor(1000 + Math.random() * 9000));
  var rowData = [id, nis, namaSiswa, totalPoints, tindakan, tanggalPencatatan];
  
  if (foundRow !== -1) {
    shPembinaan.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    shPembinaan.appendRow(rowData);
  }
}

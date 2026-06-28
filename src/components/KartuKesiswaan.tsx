import React, { useRef } from 'react';
import { Siswa, Pencatatan } from '../types';
import { Download, Printer, ShieldCheck, AlertTriangle, CreditCard, Award, User, RefreshCw } from 'lucide-react';

interface KartuKesiswaanProps {
  siswa: Siswa;
  pencatatan: Pencatatan[];
  onClose?: () => void;
}

export default function KartuKesiswaan({ siswa, pencatatan, onClose }: KartuKesiswaanProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const violationRef = useRef<HTMLDivElement>(null);

  // 1. Calculate points for this student
  const studentRecords = pencatatan.filter(r => r.nis === siswa.nis);
  const totalPoints = studentRecords.reduce((sum, r) => sum + r.poin, 0);
  
  // Get latest uploaded photo
  const studentPhotos = studentRecords.filter(r => 
    r.foto && 
    typeof r.foto === 'string' && 
    r.foto.trim() !== '' && 
    r.foto !== 'undefined' && 
    r.foto !== 'null' && 
    r.foto !== '-' &&
    (r.foto.startsWith('data:image') || r.foto.startsWith('http'))
  );
  
  const latestPhoto = (siswa.foto && typeof siswa.foto === 'string' && siswa.foto.trim() !== '' && siswa.foto !== 'undefined' && siswa.foto !== 'null' && siswa.foto !== '-')
    ? siswa.foto 
    : (studentPhotos.length > 0 ? studentPhotos[studentPhotos.length - 1].foto : null);

  // Get status text
  const getStatus = (poin: number) => {
    if (poin === 0) return { title: 'TERTIB', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', desc: 'Siswa berkelakuan sangat baik.' };
    if (poin <= 25) return { title: 'TEGURAN LISAN', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', desc: 'Memiliki catatan ringan.' };
    if (poin <= 50) return { title: 'TEGURAN TERTULIS', color: 'text-amber-600 bg-amber-50 border-amber-200', desc: 'Perlu pembinaan intensif.' };
    if (poin <= 75) return { title: 'PANGGILAN ORANG TUA', color: 'text-orange-600 bg-orange-50 border-orange-200', desc: 'Orang tua dipanggil ke sekolah.' };
    if (poin <= 100) return { title: 'PERINGATAN KERAS', color: 'text-red-600 bg-red-50 border-red-200', desc: 'Surat Peringatan Resmi (SP).' };
    return { title: 'SIDANG DISIPLIN', color: 'text-rose-700 bg-rose-50 border-rose-300', desc: 'Rekomendasi tindakan skorsing/disiplin.' };
  };

  const status = getStatus(totalPoints);

  // 2. Generate and download digital ID card via HTML5 Canvas
  const handleDownloadDigitalCard = () => {
    if (latestPhoto) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        generateCard(img);
      };
      img.onerror = () => {
        console.warn("Failed to load student photo, downloading with default avatar.");
        generateCard();
      };
      img.src = latestPhoto;
    } else {
      generateCard();
    }
  };

  const generateCard = (photoImg?: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1012; // High-res card width (approx 3.375" * 300 dpi)
    canvas.height = 638; // High-res card height (approx 2.125" * 300 dpi)
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#1e293b'); // slate-800
    grad.addColorStop(0.5, '#0f172a'); // slate-900
    grad.addColorStop(1, '#020617'); // slate-950
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative geometric shapes
    ctx.fillStyle = 'rgba(59, 130, 246, 0.08)'; // translucent blue
    ctx.beginPath();
    ctx.arc(canvas.width, 0, 450, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(99, 102, 241, 0.05)'; // translucent indigo
    ctx.beginPath();
    ctx.arc(0, canvas.height, 350, 0, Math.PI * 2);
    ctx.fill();

    // Draw top card accent bar
    ctx.fillStyle = '#2563eb'; // blue-600
    ctx.fillRect(0, 0, canvas.width, 24);

    // Header Logo/Symbol
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(70, 75, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', 70, 75);

    // Header text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('UPTD SMP NEGERI 17 KOTA TANGERANG SELATAN', 115, 65);
    ctx.fillStyle = '#94a3b8'; // slate-400
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('KARTU DIGITAL KESISWAAN', 115, 90);

    // Divider line
    ctx.strokeStyle = '#334155'; // slate-700
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 125);
    ctx.lineTo(canvas.width - 40, 125);
    ctx.stroke();

    // Photo placeholder box
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.strokeStyle = '#3b82f6'; // blue-500
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(55, 175, 200, 260, 20);
    ctx.fill();
    ctx.stroke();

    if (photoImg) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(55, 175, 200, 260, 20);
      ctx.clip();
      ctx.drawImage(photoImg, 55, 175, 200, 260);
      ctx.restore();
    } else {
      // Draw user avatar placeholder on canvas
      ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
      ctx.beginPath();
      ctx.arc(155, 265, 55, 0, Math.PI * 2);
      ctx.fill();
      
      // Avatar torso
      ctx.beginPath();
      ctx.arc(155, 385, 80, Math.PI, 0);
      ctx.fill();
    }

    // Student Information text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(siswa.nama.toUpperCase(), 290, 215);

    // Status Label
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('STATUS ANGGOTA:', 290, 255);

    const isGood = totalPoints === 0;
    ctx.fillStyle = isGood ? '#10b981' : '#f59e0b'; // emerald vs amber
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(isGood ? 'TERTIB (AKTIF)' : `DALAM PEMBINAAN (${totalPoints} POIN)`, 460, 255);

    // Details Grid
    const details = [
      { label: 'NIS / No. Induk', value: siswa.nis },
      { label: 'Kelas', value: `KELAS ${siswa.kelas}` },
      { label: 'Jenis Kelamin', value: siswa.jk === 'L' ? 'Laki-Laki' : 'Perempuan' },
      { label: 'Wali / Orang Tua', value: siswa.namaOrangTua }
    ];

    let yOffset = 305;
    details.forEach(item => {
      ctx.fillStyle = '#64748b'; // slate-500
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(item.label, 290, yOffset);

      ctx.fillStyle = '#f8fafc'; // slate-50
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(item.value, 480, yOffset);

      yOffset += 45;
    });

    // Signature Area
    ctx.fillStyle = '#64748b';
    ctx.font = 'normal 13px sans-serif';
    ctx.fillText('Koordinator BK & Kesiswaan', 740, 485);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Sulaiman, S.Psi.', 740, 545);
    ctx.fillStyle = '#475569';
    ctx.font = 'normal 11px sans-serif';
    ctx.fillText('NIP. 198209202022211009', 740, 565);

    // Mock QR Code pattern or barcode on the bottom left
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(55, 470, 200, 40); // card footer bar for barcode
    
    // Draw Barcode lines
    ctx.fillStyle = '#000000';
    let lineX = 75;
    while (lineX < 235) {
      const lineWidth = Math.random() > 0.4 ? 4 : 2;
      const space = Math.floor(Math.random() * 5) + 3;
      ctx.fillRect(lineX, 475, lineWidth, 30);
      lineX += lineWidth + space;
    }

    // Outer border of card
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    // Download action
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `KARTU_DIGITAL_${siswa.nis}_${siswa.nama.replace(/\s+/g, '_')}.png`;
    link.href = dataUrl;
    link.click();
  };

  // 3. Generate and download Violation Card via HTML5 Canvas
  const handleDownloadViolationCard = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800; // standard document width
    canvas.height = 1100; // letter size proportion
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background white with elegant grey border
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#475569'; // slate-600
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.strokeStyle = '#cbd5e1'; // slate-300
    ctx.lineWidth = 1;
    ctx.strokeRect(26, 26, canvas.width - 52, canvas.height - 52);

    // Header Title
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.font = 'extrabold 24px sans-serif';
    ctx.fillText('PEMERINTAH KOTA TANGERANG SELATAN', canvas.width / 2, 70);
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('UPTD SMP NEGERI 17 KOTA TANGERANG SELATAN', canvas.width / 2, 100);
    ctx.font = 'normal 12px sans-serif';
    ctx.fillText('Komplek Pamulang Permai Barat 1 Rt 03/10 Pamulang - kota Tangerang Selatan 15417', canvas.width / 2, 125);

    // Thick Double Header Lines
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(50, 145);
    ctx.lineTo(canvas.width - 50, 145);
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 151);
    ctx.lineTo(canvas.width - 50, 151);
    ctx.stroke();

    // Document Title
    ctx.fillStyle = '#991b1b'; // dark red
    ctx.font = 'extrabold 22px sans-serif';
    ctx.fillText('KARTU MONITORING PELANGGARAN SISWA', canvas.width / 2, 200);

    // Sub title
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`ID Dokumen: KM-BK-${siswa.nis}-${new Date().getFullYear()}`, canvas.width / 2, 222);

    // Student Bio Data Box
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(50, 250, 700, 160, 10);
    ctx.fill();
    ctx.stroke();

    // Student Bio Text details
    ctx.textAlign = 'left';
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Nama Siswa', 80, 290);
    ctx.fillText('NIS (Nomor Induk)', 80, 320);
    ctx.fillText('Kelas', 80, 350);
    ctx.fillText('Jenis Kelamin', 80, 380);

    ctx.fillText('Orang Tua / Wali', 430, 290);
    ctx.fillText('No. HP / WA Wali', 430, 320);
    ctx.fillText('Akumulasi Poin', 430, 350);
    ctx.fillText('Status Pembinaan', 430, 380);

    // Colon values
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`:  ${siswa.nama.toUpperCase()}`, 210, 290);
    ctx.fillText(`:  ${siswa.nis}`, 210, 320);
    ctx.fillText(`:  ${siswa.kelas}`, 210, 350);
    ctx.fillText(`:  ${siswa.jk === 'L' ? 'Laki-Laki (L)' : 'Perempuan (P)'}`, 210, 380);

    ctx.fillText(`:  ${siswa.namaOrangTua}`, 560, 290);
    ctx.fillText(`:  ${siswa.noHp}`, 560, 320);
    
    // Point highlights
    ctx.fillStyle = totalPoints > 0 ? '#991b1b' : '#047857';
    ctx.font = 'extrabold 15px sans-serif';
    ctx.fillText(`:  ${totalPoints} Poin`, 560, 350);
    ctx.fillText(`:  ${status.title}`, 560, 380);

    // Section 2: Table of Violations
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Rincian Catatan Kasus / Pelanggaran:', 50, 450);

    // Table Header
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(50, 475, 700, 35);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(50, 475, 700, 35);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('No', 65, 497);
    ctx.fillText('Tanggal', 100, 497);
    ctx.fillText('Jenis Pelanggaran / Aturan Yang Dilanggar', 200, 497);
    ctx.fillText('Poin', 590, 497);
    ctx.fillText('Pencatat BK', 645, 497);

    // Table rows
    let rowY = 510;
    const recordsLimit = studentRecords.slice(0, 8); // Limit to top 8 rows to prevent overflow on document page

    if (recordsLimit.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Siswa bersih dari catatan pelanggaran kesiswaan.', canvas.width / 2, rowY + 50);
    } else {
      recordsLimit.forEach((record, index) => {
        rowY += 35;
        // background alternate coloring
        if (index % 2 === 1) {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(50, rowY - 22, 700, 35);
        }
        
        ctx.strokeStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(50, rowY + 13);
        ctx.lineTo(750, rowY + 13);
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.fillStyle = '#334155';
        ctx.font = 'normal 12px sans-serif';
        ctx.fillText(`${index + 1}`, 65, rowY);
        ctx.fillText(`${record.tanggal}`, 100, rowY);
        
        // Truncate violation name if too long
        let vText = record.pelanggaran;
        if (vText.length > 50) vText = vText.substring(0, 48) + '...';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(vText, 200, rowY);
        
        ctx.fillStyle = '#991b1b';
        ctx.fillText(`+${record.poin}`, 595, rowY);
        
        ctx.fillStyle = '#475569';
        ctx.font = 'normal 11px sans-serif';
        ctx.fillText(record.petugas.split(',')[0], 645, rowY);
      });
    }

    // Footnote if limited
    if (studentRecords.length > 8) {
      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`*Menampilkan 8 kasus terbaru dari total ${studentRecords.length} kasus siswa bersangkutan.`, canvas.width / 2, 840);
    }

    // Disclaimer
    ctx.textAlign = 'left';
    ctx.fillStyle = '#475569';
    ctx.font = 'normal 11px sans-serif';
    ctx.fillText('Catatan:', 50, 875);
    ctx.fillText('1. Kartu ini dicetak sebagai dokumen pemantauan kesiswaan resmi.', 50, 893);
    ctx.fillText('2. Apabila poin mencapai batas limit tertentu, surat panggilan orang tua akan dilayangkan.', 50, 910);

    // Signatures
    ctx.font = 'normal 13px sans-serif';
    ctx.fillText(`Tangerang Selatan, ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`, 530, 885);
    ctx.fillText('Koordinator BK / Kesiswaan,', 530, 905);

    // Signature Line
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(530, 975);
    ctx.lineTo(700, 975);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('Sulaiman, S.Psi.', 530, 990);
    ctx.fillStyle = '#64748b';
    ctx.font = 'normal 11px sans-serif';
    ctx.fillText('NIP. 198209202022211009', 530, 1007);

    // QR Code visual decoration
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(80, 930, 80, 80);
    // Draw white borders of QR
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(90, 940, 20, 20);
    ctx.fillRect(130, 940, 20, 20);
    ctx.fillRect(90, 980, 20, 20);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(95, 945, 10, 10);
    ctx.fillRect(135, 945, 10, 10);
    ctx.fillRect(95, 985, 10, 10);
    // some static noise for QR code
    ctx.fillRect(120, 965, 8, 8);
    ctx.fillRect(135, 975, 12, 6);
    ctx.fillRect(110, 980, 6, 15);

    // Trigger download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `KARTU_PELANGGARAN_${siswa.nis}_${siswa.nama.replace(/\s+/g, '_')}.png`;
    link.href = dataUrl;
    link.click();
  };

  // 4. Custom Local Browser Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-6">
      
      {/* Title Header with interactive stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 font-display">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Pemberkasan & Kartu Digital Kesiswaan
          </h3>
          <p className="text-xs text-slate-500">Cetak kartu pelajar digital dan lembar monitoring rekap pelanggaran resmi</p>
        </div>

        {/* Floating actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadDigitalCard}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-all"
            title="Download Kartu Digital Siswa"
          >
            <Download className="w-4 h-4" /> Kartu Digital (PNG)
          </button>
          
          <button
            onClick={handleDownloadViolationCard}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-all"
            title="Download Kartu Pelanggaran Siswa"
          >
            <Download className="w-4 h-4" /> Kartu Pelanggaran (PNG)
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
            title="Cetak Halaman"
          >
            <Printer className="w-4 h-4" /> Cetak
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-bold text-xs cursor-pointer transition-all"
            >
              Tutup
            </button>
          )}
        </div>
      </div>

      {/* Visual Live Grid Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CARD 1: KARTU DIGITAL KESISWAAN (PREVIEW) */}
        <div className="space-y-3">
          <span className="text-xs font-black text-slate-500 tracking-wider uppercase block flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Pratinjau Kartu Digital Anggota
          </span>
          
          <div 
            ref={cardRef} 
            className="relative w-full max-w-[440px] aspect-[1.586/1] rounded-3xl bg-slate-900 border-4 border-slate-950 text-white p-5 flex flex-col justify-between overflow-hidden shadow-xl select-none mx-auto lg:mx-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950"
          >
            {/* Ambient Background Accents */}
            <div className="absolute right-0 top-0 w-44 h-44 rounded-full bg-blue-500/10 blur-xl"></div>
            <div className="absolute left-0 bottom-0 w-32 h-32 rounded-full bg-indigo-500/5 blur-xl"></div>
            
            {/* Blue top bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600"></div>

            {/* Card Header */}
            <div className="flex items-center gap-3 relative z-10 border-b border-slate-800 pb-2">
              <div className="w-9 h-9 rounded-xl bg-white text-blue-600 font-black flex items-center justify-center text-base shadow-sm">
                S
              </div>
              <div>
                <h4 className="text-[11px] font-black tracking-tight uppercase leading-none">UPTD SMP NEGERI 17 KOTA TANGERANG SELATAN</h4>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">KARTU DIGITAL KESISWAAN</span>
              </div>
            </div>

            {/* Card Content Layout */}
            <div className="flex items-center gap-4 py-3 relative z-10">
              
              {/* Photo Frame */}
              <div className="w-20 h-24 rounded-2xl bg-slate-800 border-2 border-blue-500 flex flex-col items-center justify-center text-slate-500 shadow-inner relative overflow-hidden shrink-0">
                {latestPhoto ? (
                  <img src={latestPhoto} alt={siswa.nama} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <>
                    <User className="w-10 h-10 text-slate-500" />
                    <span className="text-[7px] text-slate-400 font-mono font-bold mt-1 bg-slate-900/80 px-1.5 py-0.5 rounded-full">
                      FOTO 2x3
                    </span>
                  </>
                )}
              </div>

              {/* Bio Details */}
              <div className="space-y-1 min-w-0">
                <h5 className="font-black text-xs text-white uppercase truncate tracking-tight">{siswa.nama}</h5>
                
                <div className="flex items-center gap-1.5">
                  <span className="text-[7px] font-bold text-slate-400">STATUS:</span>
                  <span className={`px-1.5 py-0.5 rounded text-[7px] font-black tracking-wide border ${
                    totalPoints === 0 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {totalPoints === 0 ? 'TERTIB / AKTIF' : 'DALAM PEMBINAAN'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-1 text-[8px] font-sans">
                  <div>
                    <span className="text-slate-500 block font-bold">NIS / NO INDUK</span>
                    <span className="font-mono font-bold text-slate-200">{siswa.nis}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-bold">KELAS</span>
                    <span className="font-mono font-bold text-slate-200">{siswa.kelas}</span>
                  </div>
                  <div className="col-span-2 pt-0.5">
                    <span className="text-slate-500 block font-bold">WALI / ORANG TUA</span>
                    <span className="font-bold text-slate-200 truncate block">{siswa.namaOrangTua}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Footer Bar */}
            <div className="flex items-end justify-between border-t border-slate-800 pt-1.5 relative z-10 text-[7px]">
              {/* Barcode representation */}
              <div className="bg-white h-7 px-1.5 py-0.5 flex items-center rounded">
                <div className="flex gap-[1px]">
                  <span className="w-[1.5px] h-5 bg-black"></span>
                  <span className="w-[3px] h-5 bg-black"></span>
                  <span className="w-[1px] h-5 bg-black"></span>
                  <span className="w-[2px] h-5 bg-black"></span>
                  <span className="w-[1.5px] h-5 bg-black"></span>
                  <span className="w-[1px] h-5 bg-black"></span>
                  <span className="w-[3px] h-5 bg-black"></span>
                  <span className="w-[2.5px] h-5 bg-black"></span>
                  <span className="w-[1px] h-5 bg-black"></span>
                  <span className="w-[1.5px] h-5 bg-black"></span>
                  <span className="w-[2px] h-5 bg-black"></span>
                </div>
              </div>

              {/* BK signature */}
              <div className="text-right">
                <span className="text-slate-500 block">Guru BK & Kesiswaan</span>
                <span className="font-black text-slate-100 block mt-0.5">Sulaiman, S.Psi.</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: KARTU MONITORING PELANGGARAN (PREVIEW) */}
        <div className="space-y-3">
          <span className="text-xs font-black text-slate-500 tracking-wider uppercase block flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Pratinjau Kartu Monitoring Pelanggaran
          </span>

          <div 
            ref={violationRef}
            className="w-full max-w-[440px] border border-slate-300 rounded-3xl bg-white p-5 text-slate-800 shadow-xl space-y-4 select-none mx-auto lg:mx-0 font-sans"
          >
            {/* Header Stamp */}
            <div className="border-b border-double border-slate-300 pb-2 text-center">
              <h4 className="text-[10px] font-black text-slate-900 tracking-tight leading-none">UPTD SMP NEGERI 17 KOTA TANGERANG SELATAN</h4>
              <span className="text-[7px] text-slate-500 block mt-1 font-semibold">KARTU PEMANTAUAN AKUMULASI POIN PELANGGARAN</span>
            </div>

            {/* Visual Header badge with total points */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="space-y-0.5">
                <span className="text-[8px] font-black text-slate-400 block uppercase">REKOMENDASI BK:</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block ${status.color}`}>
                  {status.title}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[8px] font-black text-slate-400 block uppercase">TOTAL POIN</span>
                <span className="text-xl font-mono font-black text-rose-600">
                  {totalPoints} <span className="text-[9px] font-sans text-slate-400">Poin</span>
                </span>
              </div>
            </div>

            {/* Mini Log list of infractions */}
            <div className="space-y-1.5">
              <span className="text-[8px] font-bold text-slate-500 uppercase block">3 Catatan Kejadian Kasus Terakhir:</span>
              
              <div className="space-y-1 max-h-[100px] overflow-y-auto">
                {studentRecords.length === 0 ? (
                  <div className="p-3 text-center border border-dashed border-slate-100 rounded-xl text-[9px] text-slate-400 italic">
                    Siswa tidak memiliki catatan pelanggaran.
                  </div>
                ) : (
                  studentRecords.slice(0, 3).map((record) => (
                    <div key={record.id} className="p-2 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between text-[9px]">
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-slate-800 block truncate">{record.pelanggaran}</span>
                        <span className="text-[8px] text-slate-400 font-mono">{record.tanggal} • Oleh {record.petugas.split(',')[0]}</span>
                      </div>
                      <span className="font-mono font-black text-rose-600 shrink-0">+{record.poin}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sign and stamp area */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[7px] text-slate-500">
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded bg-slate-100 text-slate-500 font-mono font-bold flex items-center justify-center">
                  BK
                </div>
                <span>UPTD SMPN 17 Kota Tangerang Selatan</span>
              </div>
              <div className="text-right">
                <span>Koordinator BK</span>
                <span className="font-black text-slate-800 block mt-0.5">Sulaiman, S.Psi.</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

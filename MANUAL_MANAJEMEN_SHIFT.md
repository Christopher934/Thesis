# 📚 MANUAL LENGKAP HALAMAN MANAJEMEN SHIFT

## 🏥 OVERVIEW

Halaman Manajemen Shift merupakan pusat kontrol utama untuk mengelola semua aspek penjadwalan shift di rumah sakit. Halaman ini menyediakan interface yang komprehensif dengan berbagai tools dan fitur advanced untuk memudahkan admin dalam mengelola jadwal pegawai.

---

## 🎛️ 1. INTERFACE UTAMA & NAVIGASI

### 1.1 Layout Halaman

- **Header Dashboard** - Navigasi utama dan info user
- **Sidebar Menu** - Akses cepat ke berbagai fitur
- **Main Content Area** - Area kerja utama dengan tabs dan tools
- **Notification Area** - Area notifikasi real-time

### 1.2 View Modes

#### **Table View (Default)**

- Tampilan tabel lengkap dengan semua detail shift
- Fitur sorting, filtering, dan searching
- Action buttons untuk setiap shift

#### **Monthly Calendar View**

- Tampilan kalender bulanan yang interaktif
- Drag & drop untuk memindah shift
- Visual overview distribusi shift

#### **Enhanced Interactive Calendar**

- Kalender dengan fitur advanced drag & drop
- Real-time validation saat memindah shift
- Color coding berdasarkan tipe shift dan status

---

## 🔍 2. SISTEM PENCARIAN & FILTER

### 2.1 Search Function

**Lokasi**: Search bar di bagian atas halaman

**Cara Penggunaan**:

1. Ketik nama pegawai, lokasi, atau tipe shift
2. Sistem akan melakukan pencarian real-time
3. Hasil akan langsung ditampilkan di tabel/calendar

**Tips**:

- Search case-insensitive (tidak membedakan huruf besar/kecil)
- Bisa mencari dengan partial match (kata sebagian)
- Support pencarian multiple keywords

### 2.2 Filter System

**Filter Tersedia**:

- **Semua Shift** - Tampilkan semua shift
- **Shift Pagi** - Filter shift pagi saja
- **Shift Siang** - Filter shift siang saja
- **Shift Malam** - Filter shift malam saja
- **Unit Kritis** - Filter shift di unit kritis (ICU, UGD)
- **Minggu Ini** - Filter shift minggu berjalan
- **Bulan Ini** - Filter shift bulan berjalan

**Cara Menggunakan**:

1. Klik tombol filter di toolbar
2. Pilih kategori filter yang diinginkan
3. Hasil akan langsung diterapkan pada tampilan

### 2.3 Sort System

**Sort Options**:

- **Hari Ini** - Urutkan berdasarkan tanggal
- **Nama Pegawai** - Urutkan berdasarkan nama pegawai A-Z
- **Lokasi Unit** - Urutkan berdasarkan lokasi shift
- **Jam Mulai** - Urutkan berdasarkan waktu mulai shift
- **Prioritas** - Urutkan berdasarkan tingkat prioritas
- **Tipe Shift** - Urutkan berdasarkan jenis shift

**Cara Menggunakan**:

1. Klik tombol sort di toolbar
2. Pilih kriteria sorting
3. Klik lagi untuk mengubah arah sort (ascending/descending)

---

## 📊 3. WORKLOAD ANALYSIS & MONITORING

### 3.1 Workload Counter Widget

**Lokasi**: Panel samping atau dashboard widget

**Fitur**:

- **Real-time Monitoring** - Update otomatis beban kerja pegawai
- **Color-coded Status** - Hijau (normal), Kuning (warning), Merah (critical)
- **Individual Tracking** - Monitor per pegawai
- **Department Overview** - Overview per departemen

### 3.2 Analisis Beban Kerja

**Statistik yang Ditampilkan**:

- **Total Shift** - Jumlah total shift yang terjadwal
- **Pegawai Aktif** - Jumlah pegawai yang memiliki shift
- **Total Shift Minggu Ini** - Akumulasi shift minggu berjalan
- **Total Shift Hari Ini** - Jumlah shift hari ini

**Cara Menggunakan**:

1. Panel analisis beban kerja muncul secara otomatis
2. Klik "Refresh" untuk update data terbaru
3. Lihat color coding untuk status cepat:
   - 🟢 **NORMAL** - Beban kerja dalam batas wajar
   - 🟡 **WARNING** - Beban kerja mendekati batas
   - 🔴 **CRITICAL** - Beban kerja berlebihan

### 3.3 Real-time Workload Validator

**Fungsi**:

- Validasi otomatis saat membuat/edit shift
- Warning jika pegawai overload
- Rekomendasi redistribusi beban kerja
- Alert untuk pelanggaran aturan shift

---

## ➕ 4. MANAJEMEN SHIFT INDIVIDUAL

### 4.1 Membuat Shift Baru

**Cara Manual**:

1. Klik tombol **"Tambah Shift"** (ikon Plus)
2. Isi form shift:
   - **Nama Pegawai** - Pilih dari dropdown atau ketik
   - **ID Pegawai** - Otomatis terisi atau input manual
   - **Tanggal** - Pilih dari date picker
   - **Lokasi Shift** - Pilih unit/departemen
   - **Jam Mulai/Selesai** - Format HH:MM
   - **Tipe Shift** - Pagi/Siang/Malam
3. Klik **"Simpan"** untuk menyimpan

**Validasi Otomatis**:

- Cek konflik jadwal pegawai
- Validasi format waktu dan tanggal
- Periksa beban kerja pegawai
- Warning untuk unit kritis

### 4.2 Edit Shift

**Cara Edit**:

1. Klik ikon **Edit** (pensil) pada shift yang ingin diubah
2. Modal edit akan terbuka dengan data terisi
3. Ubah field yang diperlukan
4. Klik **"Update"** untuk menyimpan perubahan

**Catatan**:

- Shift yang sedang berlangsung tidak bisa diubah waktu
- Edit akan memicu revalidasi konflik
- History perubahan akan tercatat

### 4.3 Hapus Shift

**Cara Hapus**:

1. Klik ikon **Delete** (trash) pada shift
2. Konfirmasi penghapusan di modal konfirmasi
3. Klik **"Ya, Hapus"** untuk konfirmasi

**Batasan**:

- Shift yang sedang berlangsung tidak bisa dihapus
- Shift yang sudah selesai bisa dihapus dengan konfirmasi
- Admin dapat menghapus semua shift

### 4.4 View Detail Shift

**Cara Melihat Detail**:

1. Klik ikon **Eye** (mata) pada shift
2. Modal detail akan menampilkan:
   - Info lengkap pegawai
   - Detail waktu dan lokasi
   - Status shift
   - History perubahan
   - Related data

---

## 🤖 5. AUTO SCHEDULING (AI-POWERED)

### 5.1 Membuka Auto Scheduler

**Cara Akses**:

1. Klik tombol **"Auto Schedule"** (ikon Brain)
2. Modal Auto Scheduler akan terbuka
3. Sistem akan menampilkan form untuk konfigurasi

### 5.2 Konfigurasi Auto Schedule

**Parameter yang Bisa Diatur**:

- **Tanggal** - Tanggal untuk dijadwalkan
- **Lokasi** - Pilih unit/departemen
- **Tipe Shift** - Pagi/Siang/Malam/On-Call
- **Jumlah Dibutuhkan** - Berapa pegawai yang diperlukan
- **Preferred Roles** - Role yang diprioritaskan (Dokter/Perawat/Staff)
- **Priority Level** - LOW/NORMAL/HIGH/URGENT

### 5.3 Multiple Requests

**Menambah Request**:

1. Klik **"Tambah Request"** untuk menambah slot scheduling
2. Isi parameter untuk setiap request
3. Bisa mengatur beberapa lokasi/shift sekaligus

**Menghapus Request**:

- Klik ikon **X** pada request yang ingin dihapus

### 5.4 Eksekusi Auto Scheduling

**Proses**:

1. Setelah konfigurasi selesai, klik **"Jalankan Auto Scheduling"**
2. AI akan menganalisis:
   - Ketersediaan pegawai
   - Konflik jadwal
   - Beban kerja
   - Skill matching
   - Constraint rules
3. Sistem akan menampilkan hasil:
   - **Assignments** - Pegawai yang berhasil dijadwalkan
   - **Conflicts** - Konflik yang ditemukan
   - **Workload Alerts** - Warning beban kerja
   - **Fulfillment Rate** - Persentase keberhasilan
   - **Recommendations** - Saran perbaikan

### 5.5 Review & Approval

**Setelah Auto Scheduling**:

1. Review hasil yang ditampilkan
2. Cek konflik dan alert yang muncul
3. Baca rekomendasi sistem
4. Pilih:
   - **Accept** - Terima semua assignment
   - **Accept Partial** - Terima sebagian
   - **Reject** - Tolak dan ulangi
   - **Modify** - Edit manual hasil

---

## 📅 6. BULK SCHEDULING

### 6.1 Membuka Bulk Scheduler

**Cara Akses**:

1. Klik tombol **"Bulk Schedule"** (ikon Calendar)
2. Pilih tipe bulk scheduling:
   - **Weekly** - Jadwal mingguan
   - **Monthly** - Jadwal bulanan

### 6.2 Weekly Bulk Scheduling

**Parameter Konfigurasi**:

- **Start Date** - Tanggal mulai minggu
- **Locations** - Pilih multiple lokasi
- **Staff Pattern per Lokasi**:
  - DOKTER: Pagi/Siang/Malam (jumlah per shift)
  - PERAWAT: Pagi/Siang/Malam (jumlah per shift)
  - STAFF: Pagi/Siang/Malam (jumlah per shift)
- **Priority** - Level prioritas scheduling

**Cara Setting**:

1. Pilih tanggal mulai minggu
2. Check lokasi yang ingin dijadwalkan
3. Untuk setiap lokasi, atur jumlah staff per shift:
   ```
   ICU:
   - Pagi: 2 Dokter, 4 Perawat, 1 Staff
   - Siang: 2 Dokter, 4 Perawat, 1 Staff
   - Malam: 1 Dokter, 3 Perawat, 1 Staff
   ```
4. Set priority level
5. Klik **"Generate Weekly Schedule"**

### 6.3 Monthly Bulk Scheduling

**Parameter Tambahan**:

- **Year & Month** - Pilih tahun dan bulan
- **Workload Limits**:
  - **Max Shifts per Person** - Batas maksimal shift per orang per bulan
  - **Max Consecutive Days** - Batas hari kerja berturut-turut

**Advanced Features**:

- **Template Reuse** - Gunakan template bulan sebelumnya
- **Holiday Adjustment** - Otomatis sesuaikan untuk hari libur
- **Staff Rotation** - Rotasi otomatis untuk distribusi merata

### 6.4 Bulk Schedule Results

**Output yang Dihasilkan**:

- **Total Shifts Created** - Jumlah shift yang berhasil dibuat
- **Fulfillment Rate** - Persentase keberhasilan
- **Conflicts Found** - Konflik yang ditemukan
- **Workload Distribution** - Distribusi beban kerja per pegawai
- **Recommendations** - Saran optimasi

**Error Handling**:
Sistem akan menampilkan error detail dengan kategori:

- ✅ **Berhasil Sebagian** (PARTIAL_SUCCESS)
- ❌ **Jumlah Pegawai Tidak Mencukupi** (INSUFFICIENT_STAFF)
- ❌ **Pegawai Melebihi Batas Shift** (STAFF_OVER_LIMIT)
- ❌ **Jadwal Bertabrakan** (SCHEDULE_CONFLICT)
- ❌ **Pegawai Terlalu Banyak Hari Berturut-turut** (CONSECUTIVE_DAYS_EXCEEDED)
- ❌ **Tidak Ada Pegawai dengan Role yang Sesuai** (NO_STAFF_WITH_REQUIRED_ROLE)
- ⚠️ **Shift Melebihi Jam Operasional** (SHIFT_OUTSIDE_OPERATIONAL_HOURS)
- ❌ **Database Error / Server Error** (DATABASE_ERROR)
- ⚠️ **Role Tidak Lengkap dalam Shift** (INCOMPLETE_ROLE_COVERAGE)
- ❌ **Shift Sudah Dibuat Penuh** (SHIFT_SLOT_FULL)
- ❌ **Beban Kerja Berlebihan** (WORKLOAD_EXCEEDED)

---

## 🔄 7. SHIFT SWAPPING SYSTEM

### 7.1 Membuka Swap Request

**Cara Akses**:

1. Klik tombol **"Swap Requests"** (ikon Refresh)
2. Modal swap request akan terbuka

### 7.2 Smart Swap Partner Detection

**Fitur**:

- Sistem otomatis mencari partner swap yang compatible
- Filter berdasarkan:
  - Role compatibility
  - Availability
  - Workload balance
  - Location preference
  - Skill matching

### 7.3 Membuat Swap Request

**Langkah**:

1. Pilih shift yang ingin di-swap
2. Sistem akan suggest available partners
3. Pilih partner yang diinginkan
4. Tambahkan note/reason untuk swap
5. Submit request

### 7.4 Approval Process

**Workflow**:

1. Request masuk ke approval queue
2. Admin review request
3. Validasi konflik dan rules
4. Approve/Reject dengan reason
5. Notifikasi ke pegawai terkait

---

## 🗑️ 8. DELETE ALL SHIFTS

### 8.1 Fungsi Delete All

**Tujuan**: Menghapus semua shift sekaligus (biasanya untuk reset sistem)

**Cara Akses**:

1. Klik tombol **"Delete All"** (ikon Trash)
2. Modal konfirmasi akan muncul

### 8.2 Proses Delete All

**Safety Measures**:

1. Double confirmation required
2. Warning message yang jelas
3. List jumlah shift yang akan dihapus
4. Final confirmation dengan typing "DELETE ALL"

**Hasil**:

- Semua shift dihapus dari database
- History tetap tersimpan untuk audit
- Notifikasi ke admin dan pegawai terkait
- Log aktivitas tercatat

---

## 📱 9. INTERACTIVE CALENDAR FEATURES

### 9.1 Drag & Drop Functionality

**Cara Menggunakan**:

1. Pastikan dalam Calendar View mode
2. Klik dan drag shift ke tanggal lain
3. Sistem akan validasi apakah move valid
4. Drop untuk konfirmasi perpindahan

**Validasi Otomatis**:

- Cek konflik dengan shift lain
- Validasi availability pegawai
- Periksa business rules
- Warning untuk potential issues

### 9.2 Date Click Actions

**Single Click**:

- Tampilkan shifts pada tanggal tersebut
- Quick overview untuk hari tersebut

**Double Click**:

- Buka form add shift dengan tanggal ter-prefill
- Quick add function

### 9.3 Visual Indicators

**Color Coding**:

- 🟢 **Hijau** - Shift normal, no issues
- 🟡 **Kuning** - Warning, perlu perhatian
- 🔴 **Merah** - Critical, ada masalah
- 🔵 **Biru** - Shift malam
- 🟠 **Orange** - Unit kritis

**Symbols**:

- 👨‍⚕️ **Dokter**
- 👩‍⚕️ **Perawat**
- 👤 **Staff**
- ⚠️ **Alert/Warning**
- ✅ **Confirmed**

---

## 🔔 10. NOTIFICATION SYSTEM

### 10.1 Real-time Notifications

**Jenis Notifikasi**:

- **Success** - Operasi berhasil (hijau)
- **Warning** - Peringatan (kuning)
- **Error** - Kesalahan (merah)
- **Info** - Informasi (biru)

### 10.2 Enhanced Notification Features

**Detail yang Ditampilkan**:

- **Title** - Judul notifikasi
- **Message** - Pesan utama
- **Details** - Detail tambahan
- **Recommendations** - Saran tindakan
- **Timestamp** - Waktu kejadian
- **Actions** - Tombol aksi (jika ada)

### 10.3 Notification Actions

**Available Actions**:

- **View Details** - Lihat detail lengkap
- **Retry** - Coba lagi operasi
- **Undo** - Batalkan operasi (jika memungkinkan)
- **Fix** - Buka tool untuk memperbaiki masalah
- **Dismiss** - Tutup notifikasi

---

## ⚙️ 11. SETTINGS & PREFERENCES

### 11.1 View Preferences

**Toggle Options**:

- **Show All Schedules** - Tampilkan semua jadwal atau hanya milik user
- **Workload Counters** - Tampilkan/sembunyikan counter beban kerja
- **Interactive Calendar** - Gunakan calendar interaktif atau standar
- **Workload Validator** - Enable/disable real-time validation

### 11.2 Data Management

**Refresh Options**:

- **Auto Refresh** - Refresh otomatis setiap X detik
- **Manual Refresh** - Refresh dengan tombol
- **Partial Refresh** - Refresh hanya data yang berubah

### 11.3 Export & Import

**Export Features**:

- **Export to Excel** - Download data dalam format Excel
- **Export to PDF** - Generate laporan PDF
- **Export Calendar** - Export ke format calendar (iCal)

**Import Features**:

- **Import from Excel** - Upload jadwal dari file Excel
- **Import Template** - Import dari template yang sudah ada

---

## 🛠️ 12. TROUBLESHOOTING

### 12.1 Common Issues

#### **Shift Tidak Bisa Dibuat**

**Penyebab Umum**:

- Konflik jadwal dengan shift lain
- Pegawai sudah mencapai batas maksimal shift
- Format tanggal/waktu tidak valid
- Role pegawai tidak sesuai dengan requirement

**Solusi**:

1. Cek jadwal existing pegawai
2. Periksa workload limit
3. Validasi format input
4. Pastikan role matching

#### **Auto Scheduling Gagal**

**Error Common**:

- Insufficient staff available
- Too many conflicts
- Workload limits exceeded
- No staff with required role

**Solusi**:

1. Tambah pegawai atau kurangi requirement
2. Adjust tanggal atau shift type
3. Review workload limits
4. Check staff role assignments

#### **Calendar Tidak Load**

**Troubleshooting**:

1. Refresh browser
2. Clear cache
3. Check network connection
4. Verify token validity

### 12.2 Performance Tips

**Optimasi**:

- Gunakan filter untuk mengurangi data yang dimuat
- Batch operations untuk multiple changes
- Regular cleanup untuk data lama
- Monitor workload validator performance

### 12.3 Data Backup

**Backup Strategy**:

- Auto backup setiap hari
- Manual backup sebelum bulk operations
- Export data secara berkala
- Maintain audit trail

---

## 📋 13. BEST PRACTICES

### 13.1 Scheduling Best Practices

**Do's**:

- ✅ Selalu cek workload sebelum assign
- ✅ Gunakan auto scheduling untuk efisiensi
- ✅ Review conflicts sebelum approve
- ✅ Maintain work-life balance pegawai
- ✅ Dokumentasi semua perubahan

**Don'ts**:

- ❌ Jangan assign shift berturut-turut terlalu banyak
- ❌ Jangan abaikan warning dari sistem
- ❌ Jangan hapus shift tanpa konfirmasi proper
- ❌ Jangan override system safety checks

### 13.2 Data Management

**Guidelines**:

- Regular review data accuracy
- Clean up old/invalid data
- Maintain consistent naming conventions
- Backup before major changes
- Monitor system performance

### 13.3 User Training

**Key Training Points**:

- Basic navigation dan UI familiarization
- Understanding of business rules
- Proper use of auto scheduling
- Conflict resolution procedures
- Emergency procedures

---

## 🆘 14. HELP & SUPPORT

### 14.1 Getting Help

**Resources**:

- **In-app Help** - Tooltip dan guided tour
- **User Manual** - Dokumentasi lengkap (ini)
- **Video Tutorials** - Tutorial step-by-step
- **FAQ** - Frequently Asked Questions
- **Support Chat** - Live chat dengan admin

### 14.2 Reporting Issues

**Cara Report Bug**:

1. Screenshot error yang terjadi
2. Catat langkah-langkah yang menyebabkan error
3. Berikan context (data yang digunakan, waktu kejadian)
4. Submit melalui support system

### 14.3 Feature Requests

**Cara Request Feature Baru**:

1. Jelaskan use case yang spesifik
2. Berikan contoh scenario penggunaan
3. Estimasi impact terhadap workflow
4. Submit ke product team

---

## 📊 15. MONITORING & ANALYTICS

### 15.1 System Health Monitoring

**Metrics yang Dimonitor**:

- Response time sistem
- Success rate operations
- Error frequency
- User activity patterns
- Data quality metrics

### 15.2 Usage Analytics

**Data yang Ditrack**:

- Feature usage frequency
- Most common operations
- Peak usage times
- Error patterns
- Performance bottlenecks

### 15.3 Reporting

**Available Reports**:

- Daily activity summary
- Weekly/monthly trend analysis
- Error analysis report
- Performance metrics
- User behavior analytics

---

_Manual ini mencakup semua fitur yang tersedia di Halaman Manajemen Shift. Untuk pertanyaan lebih lanjut atau bantuan teknis, silakan hubungi tim support._

**Last Updated**: August 5, 2025  
**Version**: v2.0  
**Author**: System Administrator

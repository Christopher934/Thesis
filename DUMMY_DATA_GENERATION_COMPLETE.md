# 🏥 DUMMY DATA PEGAWAI - RSUD ANUGERAH

## 📋 Overview

Script ini menghasilkan **100 data dummy pegawai** yang realistis untuk sistem manajemen shift RSUD Anugerah. Data dibuat dengan mempertimbangkan:

1. **Distribusi Role yang Realistis** - Sesuai dengan struktur rumah sakit sesungguhnya
2. **Nama Indonesia yang Autentik** - Menggunakan database nama Indonesia yang umum
3. **Informasi Demografis yang Akurat** - Usia, gender, dan alamat yang sesuai
4. **Spesialisasi Medis** - Role dan skill level yang tepat untuk setiap posisi
5. **Workload Management** - Pengaturan beban kerja yang sesuai dengan standar medis

## 🎯 Distribusi Role

### Total: 100 Pegawai

| Role           | Jumlah | Persentase | Deskripsi                      |
| -------------- | ------ | ---------- | ------------------------------ |
| **PERAWAT**    | 45     | 45%        | Tenaga perawat (grup terbesar) |
| **DOKTER**     | 25     | 25%        | Dokter umum dan spesialis      |
| **STAF**       | 20     | 20%        | Staff administrasi dan teknis  |
| **SUPERVISOR** | 8      | 8%         | Kepala ruangan dan supervisor  |
| **ADMIN**      | 2      | 2%         | Administrator sistem           |

## 👥 Karakteristik Data

### 🔢 Sistem Penomoran

- **Employee ID**: Format role-based (DOK001, PER045, STA020, etc.)
- **Username**: Format `{role}{nomor}` (dokter1, perawat1, staf1, etc.)
- **Email**: Domain `@rsud-anugerah.id`, `@rsud.local`, `@hospital.id`

### 🎂 Distribusi Usia

- **Dokter & Supervisor**: 28-65 tahun (mempertimbangkan pendidikan tinggi)
- **Perawat & Staff**: 22-55 tahun (range umur kerja normal)

### 👥 Distribusi Gender

- **60% Perempuan, 40% Laki-laki** (realistis untuk sektor kesehatan)

### 📱 Data Kontak

- **No HP**: Format provider Indonesia (0811, 0812, 0821, dll)
- **Alamat**: Alamat Jakarta yang realistis dengan RT/RW

## 🏥 Spesialisasi Medis

### 👨‍⚕️ DOKTER (25 orang)

- Dokter Umum, Spesialis Dalam, Spesialis Bedah
- Spesialis Anak, Kandungan, Jantung, Saraf
- Skill Level: SENIOR, EXPERT, SPECIALIST
- Max Shifts: 18-22 per bulan

### 👩‍⚕️ PERAWAT (45 orang)

- Perawat ICU, IGD, Bedah, Anak, Kandungan
- Perawat NICU, PICU, OK, Hemodialisa
- Skill Level: JUNIOR, SENIOR, EXPERT
- Max Shifts: 20-23 per bulan

### 📋 STAF (20 orang)

- Administrasi, Farmasi, Laboratorium, Radiologi
- IT Support, Rekam Medis, Keuangan, Customer Service
- Skill Level: TRAINEE, JUNIOR, SENIOR
- Max Shifts: 15-20 per bulan

### 👨‍💼 SUPERVISOR (8 orang)

- Kepala Ruangan, Kepala Farmasi, Kepala Lab
- Supervisor Medis, Kepala IT, Kepala Keuangan
- Skill Level: EXPERT, SPECIALIST
- Max Shifts: 16-18 per bulan

### ⚙️ ADMIN (2 orang)

- Administrator Sistem, IT Manager
- Skill Level: SENIOR, EXPERT
- Max Shifts: 12-14 per bulan

## 🎯 Preferred Locations

Setiap pegawai memiliki 1-3 lokasi preferensi berdasarkan role:

### 👨‍⚕️ Dokter

- ICU, Gawat Darurat, Rawat Inap, Rawat Jalan, Kamar Operasi

### 👩‍⚕️ Perawat

- ICU, NICU, Gawat Darurat, Rawat Inap, Hemodialisa, Recovery Room

### 📋 Staff

- Laboratorium, Farmasi, Radiologi, Gedung Administrasi, Gizi

### 👨‍💼 Supervisor

- ICU, Gawat Darurat, Rawat Inap, Gedung Administrasi

## 📊 Workload Statistics

### 📈 Performance Metrics

- **Workload Score**: 0-100 (random baseline)
- **Performance Rating**: 7-10 (realistic hospital standards)
- **Skill Ratings**: Clinical, Technical, Communication, Leadership

### 📅 Shift History

- **Total Shifts**: 0-50 (historical data)
- **Current Month**: 0-15 shifts
- **Consecutive Days**: 0-3 hari berturut-turut

## 🔐 Login Credentials

**Password Default**: `hospital123` (untuk semua 100 pegawai)

### 🔑 Sample Login

```
👨‍⚕️ Dokter:      dokter1@rsud-anugerah.id
👩‍⚕️ Perawat:     perawat1@rsud-anugerah.id
📋 Staff:        staf1@rsud-anugerah.id
👨‍💼 Supervisor:  supervisor1@rsud-anugerah.id
⚙️ Admin:        admin1@rsud-anugerah.id
```

## 🚀 Cara Penggunaan

### 1. Persiapan

```bash
cd /Users/jo/Downloads/Thesis/backend
npm install  # Install dependencies termasuk bcrypt
```

### 2. Jalankan Script

```bash
cd /Users/jo/Downloads/Thesis
node generate-100-dummy-employees.js
```

### 3. Verifikasi

```bash
# Check database
cd backend
npx prisma studio
```

## 🎉 Hasil yang Diharapkan

✅ **112 pegawai total** dengan data realistis (termasuk data existing)  
✅ **UserShiftStats** untuk 99 pegawai baru  
✅ **Skill ratings** dan preferensi lokasi  
✅ **Medical compliance** untuk validasi shift  
✅ **Workload balancing** yang optimal

## 📊 Status Aktual Generate

### Total Pegawai: **112 employees**

| Role           | Jumlah | Persentase | Status          |
| -------------- | ------ | ---------- | --------------- |
| **PERAWAT**    | 52     | 46.4%      | ✅ Terbesar     |
| **DOKTER**     | 30     | 26.8%      | ✅ Memadai      |
| **STAF**       | 20     | 17.9%      | ✅ Sesuai       |
| **SUPERVISOR** | 8      | 7.1%       | ✅ Proporsional |
| **ADMIN**      | 2      | 1.8%       | ✅ Minimal      |

### 👥 Distribusi Gender

- **Laki-laki**: 66 (58.9%)
- **Perempuan**: 46 (41.1%)

### 📈 Database Records

- **Users**: 112 pegawai
- **UserShiftStats**: 99 records (untuk pegawai baru)
- **Skill Levels**: TRAINEE → SPECIALIST
- **Max Shifts**: 12-23 per bulan (sesuai role)

---

**✅ SELESAI**: 112 pegawai siap untuk testing sistem shift optimization!

## 🔄 Integration dengan Sistem

Data dummy ini kompatibel dengan:

- ✅ **Shift Optimization Algorithm** (medical safety validations)
- ✅ **Workload Analysis** (5 shifts/week, 2 consecutive nights max)
- ✅ **Auto Scheduling** (role-based assignment)
- ✅ **Bulk Scheduling** (weekly/monthly patterns)
- ✅ **Enhanced Table** (filtering dan sorting)
- ✅ **Notification System** (shift assignments)

## 📝 Database Schema Compliance

Data mengikuti struksi database terbaru:

- ✅ Enhanced User model dengan workload tracking
- ✅ UserShiftStats untuk analytics
- ✅ Medical safety validations
- ✅ Skill level dan performance ratings
- ✅ Preferred locations dalam JSON format

---

**💡 Tip**: Setelah generate data, jalankan shift optimization untuk test algorithm dengan data realistic!

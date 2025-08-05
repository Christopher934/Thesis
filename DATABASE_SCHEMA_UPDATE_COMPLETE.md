# 📊 DATABASE SCHEMA UPDATE - ERD & PDM LENGKAP

## 🎯 OVERVIEW
Dokumentasi lengkap update database schema berdasarkan implementasi fitur terbaru dalam sistem manajemen shift rumah sakit.

---

## 📋 TABEL BARU YANG PERLU DITAMBAHKAN

### 1. **USER_SHIFT_STATS** - Statistik Shift Pegawai
```sql
CREATE TABLE user_shift_stats (
    id                    SERIAL PRIMARY KEY,
    user_id               INTEGER NOT NULL UNIQUE,
    total_shifts          INTEGER DEFAULT 0,
    total_hours           DECIMAL(8,2) DEFAULT 0,
    total_overtime_hours  DECIMAL(8,2) DEFAULT 0,
    shifts_this_month     INTEGER DEFAULT 0,
    shifts_this_week      INTEGER DEFAULT 0,
    consecutive_days      INTEGER DEFAULT 0,
    max_consecutive_days  INTEGER DEFAULT 0,
    avg_shifts_per_month  DECIMAL(5,2) DEFAULT 0,
    last_shift_date       TIMESTAMP NULL,
    next_shift_date       TIMESTAMP NULL,
    workload_score        DECIMAL(5,2) DEFAULT 0, -- 0-100
    performance_rating    DECIMAL(3,1) DEFAULT 5.0, -- 1-10
    preferred_shift_types JSONB NULL, -- Array preferensi shift
    unavailable_dates     JSONB NULL, -- Array tanggal tidak tersedia
    skill_ratings         JSONB NULL, -- Object rating skill per lokasi
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user_shift_stats_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes untuk performance
CREATE INDEX idx_user_shift_stats_user_id ON user_shift_stats(user_id);
CREATE INDEX idx_user_shift_stats_workload ON user_shift_stats(workload_score);
CREATE INDEX idx_user_shift_stats_last_shift ON user_shift_stats(last_shift_date);
```

### 2. **LOCATION_CAPACITIES** - Kapasitas Lokasi
```sql
CREATE TABLE location_capacities (
    id                SERIAL PRIMARY KEY,
    location          VARCHAR(50) NOT NULL, -- Enum LokasiShift
    date              DATE NOT NULL,
    max_capacity      INTEGER NOT NULL,
    current_occupancy INTEGER DEFAULT 0,
    utilization_rate  DECIMAL(5,2) DEFAULT 0, -- Persentase utilisasi
    peak_hours        JSONB NULL, -- Array jam sibuk
    is_overloaded     BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_location_date UNIQUE(location, date)
);

-- Indexes
CREATE INDEX idx_location_capacities_location ON location_capacities(location);
CREATE INDEX idx_location_capacities_date ON location_capacities(date);
CREATE INDEX idx_location_capacities_utilization ON location_capacities(utilization_rate);
```

### 3. **USER_PREFERENCES** - Preferensi Pegawai
```sql
CREATE TABLE user_preferences (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL,
    preference_type VARCHAR(50) NOT NULL, -- Enum PreferenceType
    value           TEXT NOT NULL, -- JSON value untuk preferensi kompleks
    priority        INTEGER DEFAULT 1, -- 1=rendah, 5=tinggi
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user_preferences_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_type ON user_preferences(preference_type);
CREATE INDEX idx_user_preferences_active ON user_preferences(is_active);
```

### 4. **LEAVES** - Data Cuti
```sql
CREATE TABLE leaves (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL,
    start_date   DATE NOT NULL,
    end_date     DATE NOT NULL,
    leave_type   VARCHAR(50) NOT NULL, -- Enum LeaveType
    reason       TEXT NULL,
    status       VARCHAR(20) DEFAULT 'PENDING', -- Enum LeaveStatus
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at  TIMESTAMP NULL,
    approved_by  INTEGER NULL,
    rejected_at  TIMESTAMP NULL,
    notes        TEXT NULL,
    
    CONSTRAINT fk_leaves_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_leaves_approver 
        FOREIGN KEY (approved_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indexes
CREATE INDEX idx_leaves_user_id ON leaves(user_id);
CREATE INDEX idx_leaves_dates ON leaves(start_date, end_date);
CREATE INDEX idx_leaves_status ON leaves(status);
```

### 5. **AUDIT_LOGS** - Log Audit Sistem
```sql
CREATE TABLE audit_logs (
    id          VARCHAR(30) PRIMARY KEY, -- CUID
    user_id     INTEGER NOT NULL,
    action      VARCHAR(20) NOT NULL, -- Enum AuditAction
    entity_type VARCHAR(20) NOT NULL, -- Enum EntityType
    entity_id   VARCHAR(50) NOT NULL,
    old_data    TEXT NULL, -- JSON string data lama
    new_data    TEXT NULL, -- JSON string data baru
    reason      TEXT NULL,
    ip_address  VARCHAR(45) NULL,
    user_agent  TEXT NULL,
    timestamp   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_audit_logs_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

### 6. **OVERTIME_REQUESTS** - Permintaan Lembur
```sql
CREATE TABLE overtime_requests (
    id              VARCHAR(30) PRIMARY KEY, -- CUID
    user_id         INTEGER NOT NULL,
    request_date    TIMESTAMP NOT NULL,
    shift_date      DATE NOT NULL,
    hours_requested DECIMAL(4,2) NOT NULL,
    reason          TEXT NOT NULL,
    status          VARCHAR(20) DEFAULT 'PENDING', -- Enum RequestStatus
    requested_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at     TIMESTAMP NULL,
    reviewed_by     INTEGER NULL,
    reviewer_notes  TEXT NULL,
    approved_hours  DECIMAL(4,2) NULL,
    
    CONSTRAINT fk_overtime_requests_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_overtime_requests_reviewer 
        FOREIGN KEY (reviewed_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indexes
CREATE INDEX idx_overtime_requests_user_id ON overtime_requests(user_id);
CREATE INDEX idx_overtime_requests_status ON overtime_requests(status);
CREATE INDEX idx_overtime_requests_shift_date ON overtime_requests(shift_date);
```

### 7. **LEAVE_REQUESTS** - Pengajuan Cuti
```sql
CREATE TABLE leave_requests (
    id                VARCHAR(30) PRIMARY KEY, -- CUID
    user_id           INTEGER NOT NULL,
    leave_type        VARCHAR(50) NOT NULL, -- Enum LeaveType
    start_date        DATE NOT NULL,
    end_date          DATE NOT NULL,
    total_days        INTEGER NOT NULL,
    reason            TEXT NOT NULL,
    status            VARCHAR(20) DEFAULT 'PENDING', -- Enum RequestStatus
    requested_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at       TIMESTAMP NULL,
    reviewed_by       INTEGER NULL,
    reviewer_notes    TEXT NULL,
    attachments       JSONB NULL, -- Array file paths
    emergency_contact VARCHAR(255) NULL,
    
    CONSTRAINT fk_leave_requests_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_leave_requests_reviewer 
        FOREIGN KEY (reviewed_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indexes
CREATE INDEX idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
```

---

## 🔄 UPDATE TABEL EXISTING

### 1. **USERS** Table - Tambah Kolom Baru
```sql
-- Tambah kolom untuk enhanced monitoring
ALTER TABLE users ADD COLUMN telegram_chat_id VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN total_shifts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN current_month_shifts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN consecutive_days INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_shift_date TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN workload_status VARCHAR(20) DEFAULT 'NORMAL';
ALTER TABLE users ADD COLUMN skill_level VARCHAR(20) DEFAULT 'JUNIOR';
ALTER TABLE users ADD COLUMN preferred_locations JSONB NULL;
ALTER TABLE users ADD COLUMN max_shifts_per_month INTEGER DEFAULT 25;

-- Tambah indexes untuk kolom baru
CREATE INDEX idx_users_workload_status ON users(workload_status);
CREATE INDEX idx_users_skill_level ON users(skill_level);
CREATE INDEX idx_users_last_shift_date ON users(last_shift_date);
```

### 2. **SHIFTS** Table - Tambah Kolom Enhancement
```sql
-- Tambah kolom untuk enhanced shift tracking
ALTER TABLE shifts ADD COLUMN is_auto_assigned BOOLEAN DEFAULT FALSE;
ALTER TABLE shifts ADD COLUMN priority VARCHAR(20) DEFAULT 'NORMAL';
ALTER TABLE shifts ADD COLUMN difficulty VARCHAR(20) DEFAULT 'STANDARD';
ALTER TABLE shifts ADD COLUMN overtime_hours DECIMAL(4,2) NULL;
ALTER TABLE shifts ADD COLUMN notes TEXT NULL;

-- Kolom yang sudah ada (dari migration)
-- shift_number INTEGER NULL
-- shift_type VARCHAR(50) NULL

-- Tambah indexes
CREATE INDEX idx_shifts_priority ON shifts(priority);
CREATE INDEX idx_shifts_difficulty ON shifts(difficulty);
CREATE INDEX idx_shifts_auto_assigned ON shifts(is_auto_assigned);
CREATE INDEX idx_shifts_overtime ON shifts(overtime_hours);
```

### 3. **SHIFTSWAPS** Table - Tambah Kolom Approval
```sql
-- Tambah kolom untuk multi-level approval
ALTER TABLE shiftswaps ADD COLUMN requires_unit_head BOOLEAN DEFAULT FALSE;
ALTER TABLE shiftswaps ADD COLUMN supervisor_approved_at TIMESTAMP NULL;
ALTER TABLE shiftswaps ADD COLUMN supervisor_approved_by INTEGER NULL;
ALTER TABLE shiftswaps ADD COLUMN target_approved_at TIMESTAMP NULL;
ALTER TABLE shiftswaps ADD COLUMN target_approved_by INTEGER NULL;
ALTER TABLE shiftswaps ADD COLUMN unit_head_approved_at TIMESTAMP NULL;
ALTER TABLE shiftswaps ADD COLUMN unit_head_approved_by INTEGER NULL;

-- Tambah foreign key constraints
ALTER TABLE shiftswaps ADD CONSTRAINT fk_shiftswaps_supervisor_approver 
    FOREIGN KEY (supervisor_approved_by) REFERENCES users(id) 
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE shiftswaps ADD CONSTRAINT fk_shiftswaps_target_approver 
    FOREIGN KEY (target_approved_by) REFERENCES users(id) 
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE shiftswaps ADD CONSTRAINT fk_shiftswaps_unit_head_approver 
    FOREIGN KEY (unit_head_approved_by) REFERENCES users(id) 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX idx_shiftswaps_supervisor_approved ON shiftswaps(supervisor_approved_by);
CREATE INDEX idx_shiftswaps_target_approved ON shiftswaps(target_approved_by);
CREATE INDEX idx_shiftswaps_unit_head_approved ON shiftswaps(unit_head_approved_by);
```

---

## 📊 ENUM TYPES BARU

### 1. WorkloadStatus
```sql
CREATE TYPE "WorkloadStatus" AS ENUM (
    'UNDERLOADED',    -- < 50% kapasitas
    'NORMAL',         -- 50-80% kapasitas
    'HIGH',           -- 80-90% kapasitas
    'OVERWORKED',     -- 90-100% kapasitas
    'CRITICAL'        -- > 100% kapasitas
);
```

### 2. SkillLevel
```sql
CREATE TYPE "SkillLevel" AS ENUM (
    'TRAINEE',        -- Pegawai baru, perlu supervisi
    'JUNIOR',         -- Skill dasar, bisa handle shift standar
    'SENIOR',         -- Skill lanjutan, bisa handle shift kompleks
    'EXPERT',         -- Level expert, bisa melatih orang lain
    'SPECIALIST'      -- Skill khusus untuk area spesifik
);
```

### 3. ShiftPriority
```sql
CREATE TYPE "ShiftPriority" AS ENUM (
    'LOW',            -- Bisa ditunda jika perlu
    'NORMAL',         -- Prioritas standar
    'HIGH',           -- Penting, harus diisi
    'URGENT',         -- Kritis, harus diisi segera
    'EMERGENCY'       -- Emergency coverage diperlukan
);
```

### 4. ShiftDifficulty
```sql
CREATE TYPE "ShiftDifficulty" AS ENUM (
    'EASY',           -- Kompleksitas rendah, cocok untuk junior
    'STANDARD',       -- Kompleksitas normal
    'CHALLENGING',    -- Kompleksitas tinggi, perlu staff berpengalaman
    'CRITICAL',       -- Critical care, perlu spesialis
    'EMERGENCY'       -- Situasi emergency
);
```

### 5. PreferenceType
```sql
CREATE TYPE "PreferenceType" AS ENUM (
    'PREFERRED_SHIFT_TYPE',
    'DAY_OFF',
    'LOCATION_PREFERENCE',
    'TIME_PREFERENCE',
    'WORKLOAD_LIMIT',
    'NOTIFICATION_SETTING'
);
```

### 6. LeaveType
```sql
CREATE TYPE "LeaveType" AS ENUM (
    'ANNUAL_LEAVE',
    'SICK_LEAVE',
    'EMERGENCY_LEAVE',
    'MATERNITY_LEAVE',
    'PERSONAL_LEAVE',
    'STUDY_LEAVE'
);
```

### 7. LeaveStatus
```sql
CREATE TYPE "LeaveStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);
```

### 8. AuditAction
```sql
CREATE TYPE "AuditAction" AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'APPROVE',
    'REJECT',
    'REQUEST',
    'CANCEL',
    'VIEW'
);
```

### 9. EntityType
```sql
CREATE TYPE "EntityType" AS ENUM (
    'SHIFT',
    'OVERTIME',
    'LEAVE',
    'SWAP',
    'USER',
    'ATTENDANCE'
);
```

### 10. RequestStatus
```sql
CREATE TYPE "RequestStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED',
    'EXPIRED'
);
```

### 11. Update LokasiShift (Tambah Lokasi Baru)
```sql
ALTER TYPE "LokasiShift" ADD VALUE 'HEMODIALISA';
ALTER TYPE "LokasiShift" ADD VALUE 'FISIOTERAPI';
ALTER TYPE "LokasiShift" ADD VALUE 'KAMAR_OPERASI';
ALTER TYPE "LokasiShift" ADD VALUE 'RECOVERY_ROOM';
ALTER TYPE "LokasiShift" ADD VALUE 'EMERGENCY_ROOM';
```

### 12. Update TipeShift (Tambah Tipe Baru)
```sql
ALTER TYPE "TipeShift" ADD VALUE 'LIBUR';
ALTER TYPE "TipeShift" ADD VALUE 'CUTI';
ALTER TYPE "TipeShift" ADD VALUE 'SAKIT';
ALTER TYPE "TipeShift" ADD VALUE 'TRAINING';
```

---

## 🔗 RELASI DAN FOREIGN KEY LENGKAP

### Matrix Relasi Antar Tabel:

| Parent Table | Child Table | Foreign Key | Relasi | On Delete | On Update |
|--------------|-------------|-------------|---------|-----------|-----------|
| **users** | user_shift_stats | user_id | 1:1 | CASCADE | CASCADE |
| **users** | user_preferences | user_id | 1:N | CASCADE | CASCADE |
| **users** | leaves | user_id | 1:N | CASCADE | CASCADE |
| **users** | leaves | approved_by | 1:N | SET NULL | CASCADE |
| **users** | audit_logs | user_id | 1:N | CASCADE | CASCADE |
| **users** | overtime_requests | user_id | 1:N | CASCADE | CASCADE |
| **users** | overtime_requests | reviewed_by | 1:N | SET NULL | CASCADE |
| **users** | leave_requests | user_id | 1:N | CASCADE | CASCADE |
| **users** | leave_requests | reviewed_by | 1:N | SET NULL | CASCADE |
| **users** | shiftswaps | supervisor_approved_by | 1:N | SET NULL | CASCADE |
| **users** | shiftswaps | target_approved_by | 1:N | SET NULL | CASCADE |
| **users** | shiftswaps | unit_head_approved_by | 1:N | SET NULL | CASCADE |

---

## 📈 PERFORMANCE OPTIMIZATION

### Indexes yang Diperlukan:
```sql
-- Composite indexes untuk query kompleks
CREATE INDEX idx_shifts_user_date ON shifts(user_id, tanggal);
CREATE INDEX idx_shifts_location_date ON shifts(lokasi_enum, tanggal);
CREATE INDEX idx_user_preferences_user_type ON user_preferences(user_id, preference_type);
CREATE INDEX idx_overtime_requests_user_status ON overtime_requests(user_id, status);
CREATE INDEX idx_leave_requests_user_status ON leave_requests(user_id, status);

-- Partial indexes untuk performance
CREATE INDEX idx_active_preferences ON user_preferences(user_id) WHERE is_active = true;
CREATE INDEX idx_pending_requests ON overtime_requests(user_id) WHERE status = 'PENDING';
CREATE INDEX idx_recent_audit_logs ON audit_logs(timestamp) WHERE timestamp > NOW() - INTERVAL '30 days';
```

### Views untuk Reporting:
```sql
-- View untuk dashboard workload
CREATE VIEW user_workload_summary AS
SELECT 
    u.id,
    u.employee_id,
    u.nama_depan || ' ' || u.nama_belakang AS full_name,
    u.workload_status,
    uss.total_shifts,
    uss.shifts_this_month,
    uss.consecutive_days,
    uss.workload_score,
    uss.performance_rating
FROM users u
LEFT JOIN user_shift_stats uss ON u.id = uss.user_id
WHERE u.status = 'ACTIVE';

-- View untuk shift capacity analysis
CREATE VIEW location_utilization_summary AS
SELECT 
    location,
    DATE(date) as shift_date,
    max_capacity,
    current_occupancy,
    utilization_rate,
    CASE 
        WHEN utilization_rate > 90 THEN 'OVERLOADED'
        WHEN utilization_rate > 80 THEN 'HIGH'
        WHEN utilization_rate > 50 THEN 'NORMAL'
        ELSE 'UNDERUTILIZED'
    END as capacity_status
FROM location_capacities
WHERE date >= CURRENT_DATE - INTERVAL '30 days';
```

---

## 🎯 SUMMARY CHANGES

### **Total Tabel Baru:** 7
1. user_shift_stats
2. location_capacities  
3. user_preferences
4. leaves
5. audit_logs
6. overtime_requests
7. leave_requests

### **Total Tabel Dimodifikasi:** 3
1. users (+8 kolom)
2. shifts (+5 kolom)
3. shiftswaps (+6 kolom)

### **Total Enum Baru:** 10
- WorkloadStatus, SkillLevel, ShiftPriority, ShiftDifficulty
- PreferenceType, LeaveType, LeaveStatus, AuditAction
- EntityType, RequestStatus

### **Total Foreign Key Baru:** 15
- 12 Foreign key baru pada tabel baru
- 3 Foreign key tambahan pada shiftswaps

### **Total Index Baru:** 25+
- Performance indexes untuk semua tabel baru
- Composite indexes untuk query optimization
- Partial indexes untuk conditional queries

---

## 📋 MIGRATION SCRIPT ORDER

1. **Create Enum Types** (Semua enum baru)
2. **Alter Existing Tables** (users, shifts, shiftswaps)
3. **Create New Tables** (7 tabel baru dengan foreign keys)
4. **Create Indexes** (Performance optimization)
5. **Create Views** (Reporting views)
6. **Insert Default Data** (Seed data jika diperlukan)

Database schema ini sudah mencakup semua fitur yang diimplementasikan dalam kode dan siap untuk mendukung sistem manajemen shift rumah sakit yang advanced dengan monitoring workload, preferensi pegawai, audit trail, dan manajemen lembur/cuti yang komprehensif.

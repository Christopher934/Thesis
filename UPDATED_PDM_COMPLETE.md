# 🏗️ UPDATED PDM - Physical Data Model

## 🎯 PDM LENGKAP SISTEM MANAJEMEN SHIFT RUMAH SAKIT

## 📊 MERMAID PDM DIAGRAM

```mermaid
erDiagram
    %% USERS - Tabel Utama dengan Enhancement
    USERS {
        SERIAL id PK "PRIMARY KEY"
        VARCHAR(50) employee_id UK "UNIQUE, NOT NULL"
        VARCHAR(100) username UK "UNIQUE, NOT NULL"
        VARCHAR(255) email UK "UNIQUE, NOT NULL"
        VARCHAR(255) password "NOT NULL"
        VARCHAR(100) nama_depan "NOT NULL"
        VARCHAR(100) nama_belakang "NOT NULL"
        TEXT alamat "NULL"
        VARCHAR(20) no_hp "NOT NULL"
        VARCHAR(1) jenis_kelamin "NOT NULL, CHECK(jenis_kelamin IN ('L','P'))"
        TIMESTAMP tanggal_lahir "NOT NULL"
        VARCHAR(20) role "NOT NULL, CHECK(role IN ('ADMIN','DOKTER','PERAWAT','STAF','SUPERVISOR'))"
        VARCHAR(20) status "DEFAULT 'ACTIVE', CHECK(status IN ('ACTIVE','INACTIVE'))"
        TIMESTAMP created_at "DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "DEFAULT CURRENT_TIMESTAMP"
        VARCHAR(255) telegram_chat_id "NULL"
        INTEGER total_shifts "DEFAULT 0"
        INTEGER current_month_shifts "DEFAULT 0"
        INTEGER consecutive_days "DEFAULT 0"
        TIMESTAMP last_shift_date "NULL"
        VARCHAR(20) workload_status "DEFAULT 'NORMAL'"
        VARCHAR(20) skill_level "DEFAULT 'JUNIOR'"
        JSONB preferred_locations "NULL"
        INTEGER max_shifts_per_month "DEFAULT 25"
    }

    %% SHIFTS - Tabel Shift dengan Enhancement
    SHIFTS {
        SERIAL id PK "PRIMARY KEY"
        DATE tanggal "NOT NULL"
        TIMESTAMP created_at "DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "DEFAULT CURRENT_TIMESTAMP"
        TIME jam_mulai "NOT NULL"
        TIME jam_selesai "NOT NULL"
        VARCHAR(255) lokasi_shift "NOT NULL"
        INTEGER user_id FK "NOT NULL, REFERENCES users(id) ON DELETE CASCADE"
        VARCHAR(50) lokasi_enum "NULL"
        VARCHAR(50) tipe_enum "NULL"
        VARCHAR(255) tipe_shift "NULL"
        INTEGER shift_number "NULL"
        VARCHAR(50) shift_type "NULL"
        BOOLEAN is_auto_assigned "DEFAULT FALSE"
        VARCHAR(20) priority "DEFAULT 'NORMAL'"
        VARCHAR(20) difficulty "DEFAULT 'STANDARD'"
        DECIMAL(4,2) overtime_hours "NULL"
        TEXT notes "NULL"
    }

    %% USER_SHIFT_STATS - Statistik Shift per User
    USER_SHIFT_STATS {
        SERIAL id PK "PRIMARY KEY"
        INTEGER user_id FK "NOT NULL, UNIQUE, REFERENCES users(id) ON DELETE CASCADE"
        INTEGER total_shifts "DEFAULT 0"
        DECIMAL(8,2) total_hours "DEFAULT 0"
        DECIMAL(8,2) total_overtime_hours "DEFAULT 0"
        INTEGER shifts_this_month "DEFAULT 0"
        INTEGER shifts_this_week "DEFAULT 0"
        INTEGER consecutive_days "DEFAULT 0"
        INTEGER max_consecutive_days "DEFAULT 0"
        DECIMAL(5,2) avg_shifts_per_month "DEFAULT 0"
        TIMESTAMP last_shift_date "NULL"
        TIMESTAMP next_shift_date "NULL"
        DECIMAL(5,2) workload_score "DEFAULT 0, CHECK(workload_score >= 0 AND workload_score <= 100)"
        DECIMAL(3,1) performance_rating "DEFAULT 5.0, CHECK(performance_rating >= 1 AND performance_rating <= 10)"
        JSONB preferred_shift_types "NULL"
        JSONB unavailable_dates "NULL"
        JSONB skill_ratings "NULL"
        TIMESTAMP created_at "DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "DEFAULT CURRENT_TIMESTAMP"
    }

    %% LOCATION_CAPACITIES - Kapasitas Lokasi
    LOCATION_CAPACITIES {
        SERIAL id PK "PRIMARY KEY"
        VARCHAR(50) location "NOT NULL"
        DATE date "NOT NULL"
        INTEGER max_capacity "NOT NULL, CHECK(max_capacity > 0)"
        INTEGER current_occupancy "DEFAULT 0, CHECK(current_occupancy >= 0)"
        DECIMAL(5,2) utilization_rate "DEFAULT 0, CHECK(utilization_rate >= 0 AND utilization_rate <= 200)"
        JSONB peak_hours "NULL"
        BOOLEAN is_overloaded "DEFAULT FALSE"
        TIMESTAMP created_at "DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "DEFAULT CURRENT_TIMESTAMP"
    }

    %% USER_PREFERENCES - Preferensi User
    USER_PREFERENCES {
        SERIAL id PK "PRIMARY KEY"
        INTEGER user_id FK "NOT NULL, REFERENCES users(id) ON DELETE CASCADE"
        VARCHAR(50) preference_type "NOT NULL"
        TEXT value "NOT NULL"
        INTEGER priority "DEFAULT 1, CHECK(priority >= 1 AND priority <= 5)"
        BOOLEAN is_active "DEFAULT TRUE"
        TIMESTAMP created_at "DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "DEFAULT CURRENT_TIMESTAMP"
    }

    %% LEAVES - Data Cuti
    LEAVES {
        SERIAL id PK "PRIMARY KEY"
        INTEGER user_id FK "NOT NULL, REFERENCES users(id) ON DELETE CASCADE"
        DATE start_date "NOT NULL"
        DATE end_date "NOT NULL, CHECK(end_date >= start_date)"
        VARCHAR(50) leave_type "NOT NULL"
        TEXT reason "NULL"
        VARCHAR(20) status "DEFAULT 'PENDING'"
        TIMESTAMP requested_at "DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP approved_at "NULL"
        INTEGER approved_by FK "NULL, REFERENCES users(id) ON DELETE SET NULL"
        TIMESTAMP rejected_at "NULL"
        TEXT notes "NULL"
    }

    %% OVERTIME_REQUESTS - Permintaan Lembur
    OVERTIME_REQUESTS {
        VARCHAR(30) id PK "PRIMARY KEY"
        INTEGER user_id FK "NOT NULL, REFERENCES users(id) ON DELETE CASCADE"
        TIMESTAMP request_date "NOT NULL"
        DATE shift_date "NOT NULL"
        DECIMAL(4,2) hours_requested "NOT NULL, CHECK(hours_requested > 0 AND hours_requested <= 12)"
        TEXT reason "NOT NULL"
        VARCHAR(20) status "DEFAULT 'PENDING'"
        TIMESTAMP requested_at "DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP reviewed_at "NULL"
        INTEGER reviewed_by FK "NULL, REFERENCES users(id) ON DELETE SET NULL"
        TEXT reviewer_notes "NULL"
        DECIMAL(4,2) approved_hours "NULL, CHECK(approved_hours >= 0 AND approved_hours <= 12)"
    }

    %% LEAVE_REQUESTS - Pengajuan Cuti Baru
    LEAVE_REQUESTS {
        VARCHAR(30) id PK "PRIMARY KEY"
        INTEGER user_id FK "NOT NULL, REFERENCES users(id) ON DELETE CASCADE"
        VARCHAR(50) leave_type "NOT NULL"
        DATE start_date "NOT NULL"
        DATE end_date "NOT NULL, CHECK(end_date >= start_date)"
        INTEGER total_days "NOT NULL, CHECK(total_days > 0)"
        TEXT reason "NOT NULL"
        VARCHAR(20) status "DEFAULT 'PENDING'"
        TIMESTAMP requested_at "DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP reviewed_at "NULL"
        INTEGER reviewed_by FK "NULL, REFERENCES users(id) ON DELETE SET NULL"
        TEXT reviewer_notes "NULL"
        JSONB attachments "NULL"
        VARCHAR(255) emergency_contact "NULL"
    }

    %% AUDIT_LOGS - Log Audit Sistem
    AUDIT_LOGS {
        VARCHAR(30) id PK "PRIMARY KEY"
        INTEGER user_id FK "NOT NULL, REFERENCES users(id) ON DELETE CASCADE"
        VARCHAR(20) action "NOT NULL"
        VARCHAR(20) entity_type "NOT NULL"
        VARCHAR(50) entity_id "NOT NULL"
        TEXT old_data "NULL"
        TEXT new_data "NULL"
        TEXT reason "NULL"
        VARCHAR(45) ip_address "NULL"
        TEXT user_agent "NULL"
        TIMESTAMP timestamp "DEFAULT CURRENT_TIMESTAMP"
    }

    %% ABSENSI - Absensi dengan Enhancement
    ABSENSI {
        SERIAL id PK "PRIMARY KEY"
        INTEGER user_id FK "NOT NULL, REFERENCES users(id) ON DELETE CASCADE"
        INTEGER shift_id FK "NOT NULL, UNIQUE, REFERENCES shifts(id) ON DELETE CASCADE"
        TIMESTAMP jam_masuk "NULL"
        TIMESTAMP jam_keluar "NULL"
        VARCHAR(20) status "NOT NULL"
        TIMESTAMP created_at "DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "DEFAULT CURRENT_TIMESTAMP"
        TEXT catatan "NULL"
        VARCHAR(255) foto "NULL"
        VARCHAR(255) lokasi "NULL"
    }

    %% SHIFTSWAPS - Tukar Shift dengan Multi-level Approval
    SHIFTSWAPS {
        SERIAL id PK "PRIMARY KEY"
        INTEGER from_user_id FK "NOT NULL, REFERENCES users(id) ON DELETE CASCADE"
        INTEGER to_user_id FK "NOT NULL, REFERENCES users(id) ON DELETE CASCADE"
        INTEGER shift_id FK "NOT NULL, UNIQUE, REFERENCES shifts(id) ON DELETE CASCADE"
        VARCHAR(20) status "DEFAULT 'PENDING'"
        TEXT alasan "NULL"
        TIMESTAMP tanggal_swap "NOT NULL"
        TIMESTAMP created_at "DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "DEFAULT CURRENT_TIMESTAMP"
        TEXT rejection_reason "NULL"
        BOOLEAN requires_unit_head "DEFAULT FALSE"
        TIMESTAMP supervisor_approved_at "NULL"
        INTEGER supervisor_approved_by FK "NULL, REFERENCES users(id) ON DELETE SET NULL"
        TIMESTAMP target_approved_at "NULL"
        INTEGER target_approved_by FK "NULL, REFERENCES users(id) ON DELETE SET NULL"
        TIMESTAMP unit_head_approved_at "NULL"
        INTEGER unit_head_approved_by FK "NULL, REFERENCES users(id) ON DELETE SET NULL"
    }

    %% KEGIATAN - Existing Table
    KEGIATAN {
        SERIAL id PK "PRIMARY KEY"
        VARCHAR(255) nama "NOT NULL"
        TEXT deskripsi "NOT NULL"
        TIMESTAMP created_at "DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "DEFAULT CURRENT_TIMESTAMP"
        INTEGER anggaran "NULL"
        TEXT catatan "NULL"
        VARCHAR(255) departemen "NULL"
        VARCHAR(255) jenis_kegiatan "NOT NULL"
        INTEGER kapasitas "NULL"
        VARCHAR(255) kontak "NULL"
        VARCHAR(255) lokasi "NOT NULL"
        VARCHAR(255) lokasi_detail "NULL"
        VARCHAR(255) penanggung_jawab "NOT NULL"
        VARCHAR(20) prioritas "DEFAULT 'SEDANG'"
        VARCHAR(20) status "DEFAULT 'DRAFT'"
        TIMESTAMP tanggal_mulai "NOT NULL"
        TIMESTAMP tanggal_selesai "NULL"
        TEXT[] target_peserta "NULL"
        TIME waktu_mulai "NOT NULL"
        TIME waktu_selesai "NULL"
    }

    %% TOKENS - Existing Table
    TOKENS {
        SERIAL id PK "PRIMARY KEY"
        INTEGER user_id FK "NOT NULL, REFERENCES users(id) ON DELETE CASCADE"
        VARCHAR(255) token "NOT NULL, UNIQUE"
        TIMESTAMP expired_at "NOT NULL"
        TIMESTAMP created_at "DEFAULT CURRENT_TIMESTAMP"
    }

    %% LOGIN_LOGS - Existing Table
    LOGIN_LOGS {
        SERIAL id PK "PRIMARY KEY"
        INTEGER user_id FK "NOT NULL, REFERENCES users(id) ON DELETE CASCADE"
        VARCHAR(45) ip_address "NULL"
        TEXT user_agent "NULL"
        TIMESTAMP login_at "DEFAULT CURRENT_TIMESTAMP"
    }

    %% NOTIFIKASI - Existing Table
    NOTIFIKASI {
        SERIAL id PK "PRIMARY KEY"
        INTEGER user_id FK "NOT NULL, REFERENCES users(id) ON DELETE CASCADE"
        VARCHAR(255) judul "NOT NULL"
        TEXT pesan "NOT NULL"
        VARCHAR(50) jenis "NOT NULL"
        VARCHAR(20) status "DEFAULT 'UNREAD'"
        JSONB data "NULL"
        VARCHAR(20) sent_via "DEFAULT 'WEB'"
        BOOLEAN telegram_sent "DEFAULT FALSE"
        TIMESTAMP created_at "DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "DEFAULT CURRENT_TIMESTAMP"
    }

    %% RELATIONSHIPS
    USERS ||--|| USER_SHIFT_STATS : "has_stats"
    USERS ||--o{ SHIFTS : "assigned_to"
    USERS ||--o{ USER_PREFERENCES : "has_preferences"
    USERS ||--o{ LEAVES : "requests_leave"
    USERS ||--o{ OVERTIME_REQUESTS : "requests_overtime"
    USERS ||--o{ LEAVE_REQUESTS : "submits_leave_request"
    USERS ||--o{ AUDIT_LOGS : "generates_audit"
    USERS ||--o{ ABSENSI : "records_attendance"
    USERS ||--o{ SHIFTSWAPS : "initiates_swap"
    USERS ||--o{ SHIFTSWAPS : "receives_swap"
    USERS ||--o{ TOKENS : "has_tokens"
    USERS ||--o{ LOGIN_LOGS : "has_login_history"
    USERS ||--o{ NOTIFIKASI : "receives_notifications"
    
    SHIFTS ||--o| ABSENSI : "has_attendance"
    SHIFTS ||--o| SHIFTSWAPS : "can_be_swapped"
    
    USERS ||--o{ LEAVES : "approves_leave"
    USERS ||--o{ OVERTIME_REQUESTS : "reviews_overtime"
    USERS ||--o{ LEAVE_REQUESTS : "reviews_leave_request"
    USERS ||--o{ SHIFTSWAPS : "supervisor_approves"
    USERS ||--o{ SHIFTSWAPS : "target_approves"
    USERS ||--o{ SHIFTSWAPS : "unit_head_approves"
```

## 🗃️ DETAILED TABLE SPECIFICATIONS

### **TABEL ENHANCEMENT - USERS**
```sql
-- Existing columns plus new enhancements
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nama_depan VARCHAR(100) NOT NULL,
    nama_belakang VARCHAR(100) NOT NULL,
    alamat TEXT,
    no_hp VARCHAR(20) NOT NULL,
    jenis_kelamin CHAR(1) NOT NULL CHECK (jenis_kelamin IN ('L', 'P')),
    tanggal_lahir TIMESTAMP NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'DOKTER', 'PERAWAT', 'STAF', 'SUPERVISOR')),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- NEW ENHANCEMENT COLUMNS
    telegram_chat_id VARCHAR(255),
    total_shifts INTEGER DEFAULT 0,
    current_month_shifts INTEGER DEFAULT 0,
    consecutive_days INTEGER DEFAULT 0,
    last_shift_date TIMESTAMP,
    workload_status VARCHAR(20) DEFAULT 'NORMAL' CHECK (workload_status IN ('UNDERLOADED', 'NORMAL', 'HIGH', 'OVERWORKED', 'CRITICAL')),
    skill_level VARCHAR(20) DEFAULT 'JUNIOR' CHECK (skill_level IN ('TRAINEE', 'JUNIOR', 'SENIOR', 'EXPERT', 'SPECIALIST')),
    preferred_locations JSONB,
    max_shifts_per_month INTEGER DEFAULT 25 CHECK (max_shifts_per_month > 0)
);

-- Indexes untuk performance
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_workload_status ON users(workload_status);
CREATE INDEX idx_users_skill_level ON users(skill_level);
CREATE INDEX idx_users_last_shift_date ON users(last_shift_date);
CREATE INDEX idx_users_role_status ON users(role, status);
```

### **TABEL ENHANCEMENT - SHIFTS**
```sql
-- Existing columns plus new enhancements
CREATE TABLE shifts (
    id SERIAL PRIMARY KEY,
    tanggal DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    lokasi_shift VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL,
    lokasi_enum VARCHAR(50),
    tipe_enum VARCHAR(50),
    tipe_shift VARCHAR(255),
    shift_number INTEGER,
    shift_type VARCHAR(50),
    
    -- NEW ENHANCEMENT COLUMNS
    is_auto_assigned BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'EMERGENCY')),
    difficulty VARCHAR(20) DEFAULT 'STANDARD' CHECK (difficulty IN ('EASY', 'STANDARD', 'CHALLENGING', 'CRITICAL', 'EMERGENCY')),
    overtime_hours DECIMAL(4,2) CHECK (overtime_hours >= 0 AND overtime_hours <= 12),
    notes TEXT,
    
    CONSTRAINT fk_shifts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes untuk performance
CREATE INDEX idx_shifts_user_id ON shifts(user_id);
CREATE INDEX idx_shifts_tanggal ON shifts(tanggal);
CREATE INDEX idx_shifts_lokasi_enum ON shifts(lokasi_enum);
CREATE INDEX idx_shifts_priority ON shifts(priority);
CREATE INDEX idx_shifts_difficulty ON shifts(difficulty);
CREATE INDEX idx_shifts_auto_assigned ON shifts(is_auto_assigned);
CREATE INDEX idx_shifts_user_date ON shifts(user_id, tanggal);
CREATE INDEX idx_shifts_location_date ON shifts(lokasi_enum, tanggal);
```

### **TABEL BARU - USER_SHIFT_STATS**
```sql
CREATE TABLE user_shift_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    total_shifts INTEGER DEFAULT 0,
    total_hours DECIMAL(8,2) DEFAULT 0,
    total_overtime_hours DECIMAL(8,2) DEFAULT 0,
    shifts_this_month INTEGER DEFAULT 0,
    shifts_this_week INTEGER DEFAULT 0,
    consecutive_days INTEGER DEFAULT 0,
    max_consecutive_days INTEGER DEFAULT 0,
    avg_shifts_per_month DECIMAL(5,2) DEFAULT 0,
    last_shift_date TIMESTAMP,
    next_shift_date TIMESTAMP,
    workload_score DECIMAL(5,2) DEFAULT 0 CHECK (workload_score >= 0 AND workload_score <= 100),
    performance_rating DECIMAL(3,1) DEFAULT 5.0 CHECK (performance_rating >= 1 AND performance_rating <= 10),
    preferred_shift_types JSONB,
    unavailable_dates JSONB,
    skill_ratings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user_shift_stats_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_user_shift_stats_user_id ON user_shift_stats(user_id);
CREATE INDEX idx_user_shift_stats_workload ON user_shift_stats(workload_score);
CREATE INDEX idx_user_shift_stats_performance ON user_shift_stats(performance_rating);
CREATE INDEX idx_user_shift_stats_last_shift ON user_shift_stats(last_shift_date);
```

### **CONSTRAINT DETAILS**

#### **Check Constraints:**
```sql
-- Users table constraints
ALTER TABLE users ADD CONSTRAINT chk_users_jenis_kelamin CHECK (jenis_kelamin IN ('L', 'P'));
ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (role IN ('ADMIN', 'DOKTER', 'PERAWAT', 'STAF', 'SUPERVISOR'));
ALTER TABLE users ADD CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'INACTIVE'));
ALTER TABLE users ADD CONSTRAINT chk_users_workload_status CHECK (workload_status IN ('UNDERLOADED', 'NORMAL', 'HIGH', 'OVERWORKED', 'CRITICAL'));
ALTER TABLE users ADD CONSTRAINT chk_users_skill_level CHECK (skill_level IN ('TRAINEE', 'JUNIOR', 'SENIOR', 'EXPERT', 'SPECIALIST'));
ALTER TABLE users ADD CONSTRAINT chk_users_max_shifts CHECK (max_shifts_per_month > 0);

-- Shifts table constraints
ALTER TABLE shifts ADD CONSTRAINT chk_shifts_priority CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'EMERGENCY'));
ALTER TABLE shifts ADD CONSTRAINT chk_shifts_difficulty CHECK (difficulty IN ('EASY', 'STANDARD', 'CHALLENGING', 'CRITICAL', 'EMERGENCY'));
ALTER TABLE shifts ADD CONSTRAINT chk_shifts_overtime_hours CHECK (overtime_hours >= 0 AND overtime_hours <= 12);
ALTER TABLE shifts ADD CONSTRAINT chk_shifts_time_logic CHECK (jam_selesai > jam_mulai OR jam_selesai < jam_mulai); -- Support night shifts

-- Location capacities constraints
ALTER TABLE location_capacities ADD CONSTRAINT chk_location_max_capacity CHECK (max_capacity > 0);
ALTER TABLE location_capacities ADD CONSTRAINT chk_location_current_occupancy CHECK (current_occupancy >= 0);
ALTER TABLE location_capacities ADD CONSTRAINT chk_location_utilization_rate CHECK (utilization_rate >= 0 AND utilization_rate <= 200);

-- User preferences constraints
ALTER TABLE user_preferences ADD CONSTRAINT chk_user_preferences_priority CHECK (priority >= 1 AND priority <= 5);

-- Leaves constraints
ALTER TABLE leaves ADD CONSTRAINT chk_leaves_date_logic CHECK (end_date >= start_date);

-- Overtime requests constraints
ALTER TABLE overtime_requests ADD CONSTRAINT chk_overtime_hours_requested CHECK (hours_requested > 0 AND hours_requested <= 12);
ALTER TABLE overtime_requests ADD CONSTRAINT chk_overtime_approved_hours CHECK (approved_hours >= 0 AND approved_hours <= 12);

-- Leave requests constraints
ALTER TABLE leave_requests ADD CONSTRAINT chk_leave_requests_date_logic CHECK (end_date >= start_date);
ALTER TABLE leave_requests ADD CONSTRAINT chk_leave_requests_total_days CHECK (total_days > 0);

-- User shift stats constraints
ALTER TABLE user_shift_stats ADD CONSTRAINT chk_user_shift_stats_workload_score CHECK (workload_score >= 0 AND workload_score <= 100);
ALTER TABLE user_shift_stats ADD CONSTRAINT chk_user_shift_stats_performance_rating CHECK (performance_rating >= 1 AND performance_rating <= 10);
```

#### **Foreign Key Constraints:**
```sql
-- Users related foreign keys
ALTER TABLE user_shift_stats ADD CONSTRAINT fk_user_shift_stats_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE user_preferences ADD CONSTRAINT fk_user_preferences_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE leaves ADD CONSTRAINT fk_leaves_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE leaves ADD CONSTRAINT fk_leaves_approver 
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE overtime_requests ADD CONSTRAINT fk_overtime_requests_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE overtime_requests ADD CONSTRAINT fk_overtime_requests_reviewer 
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE leave_requests ADD CONSTRAINT fk_leave_requests_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE leave_requests ADD CONSTRAINT fk_leave_requests_reviewer 
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Shifts related foreign keys
ALTER TABLE shifts ADD CONSTRAINT fk_shifts_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE absensi ADD CONSTRAINT fk_absensi_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE absensi ADD CONSTRAINT fk_absensi_shift 
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Shift swaps enhanced foreign keys
ALTER TABLE shiftswaps ADD CONSTRAINT fk_shiftswaps_from_user 
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE shiftswaps ADD CONSTRAINT fk_shiftswaps_to_user 
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE shiftswaps ADD CONSTRAINT fk_shiftswaps_shift 
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE shiftswaps ADD CONSTRAINT fk_shiftswaps_supervisor_approver 
    FOREIGN KEY (supervisor_approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE shiftswaps ADD CONSTRAINT fk_shiftswaps_target_approver 
    FOREIGN KEY (target_approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE shiftswaps ADD CONSTRAINT fk_shiftswaps_unit_head_approver 
    FOREIGN KEY (unit_head_approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Other existing foreign keys
ALTER TABLE tokens ADD CONSTRAINT fk_tokens_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE login_logs ADD CONSTRAINT fk_login_logs_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE notifikasi ADD CONSTRAINT fk_notifikasi_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;
```

#### **Unique Constraints:**
```sql
-- Unique constraints
ALTER TABLE users ADD CONSTRAINT uk_users_employee_id UNIQUE (employee_id);
ALTER TABLE users ADD CONSTRAINT uk_users_username UNIQUE (username);
ALTER TABLE users ADD CONSTRAINT uk_users_email UNIQUE (email);
ALTER TABLE user_shift_stats ADD CONSTRAINT uk_user_shift_stats_user_id UNIQUE (user_id);
ALTER TABLE absensi ADD CONSTRAINT uk_absensi_shift_id UNIQUE (shift_id);
ALTER TABLE shiftswaps ADD CONSTRAINT uk_shiftswaps_shift_id UNIQUE (shift_id);
ALTER TABLE tokens ADD CONSTRAINT uk_tokens_token UNIQUE (token);
ALTER TABLE location_capacities ADD CONSTRAINT uk_location_capacities_location_date UNIQUE (location, date);
```

## 📊 PERFORMANCE OPTIMIZATION

### **Composite Indexes:**
```sql
-- Multi-column indexes untuk query optimization
CREATE INDEX idx_shifts_user_date_location ON shifts(user_id, tanggal, lokasi_enum);
CREATE INDEX idx_user_preferences_user_type_active ON user_preferences(user_id, preference_type, is_active);
CREATE INDEX idx_overtime_requests_user_status_date ON overtime_requests(user_id, status, shift_date);
CREATE INDEX idx_leave_requests_user_status_dates ON leave_requests(user_id, status, start_date, end_date);
CREATE INDEX idx_audit_logs_user_entity_timestamp ON audit_logs(user_id, entity_type, timestamp);
CREATE INDEX idx_location_capacities_location_date_utilization ON location_capacities(location, date, utilization_rate);
```

### **Partial Indexes:**
```sql
-- Partial indexes untuk kondisi tertentu
CREATE INDEX idx_active_users ON users(id) WHERE status = 'ACTIVE';
CREATE INDEX idx_active_preferences ON user_preferences(user_id, preference_type) WHERE is_active = true;
CREATE INDEX idx_pending_overtime_requests ON overtime_requests(user_id, shift_date) WHERE status = 'PENDING';
CREATE INDEX idx_pending_leave_requests ON leave_requests(user_id, start_date) WHERE status = 'PENDING';
CREATE INDEX idx_recent_shifts ON shifts(user_id, tanggal) WHERE tanggal >= CURRENT_DATE - INTERVAL '30 days';
CREATE INDEX idx_recent_audit_logs ON audit_logs(user_id, timestamp) WHERE timestamp >= CURRENT_DATE - INTERVAL '90 days';
```

### **Functional Indexes:**
```sql
-- Indexes untuk function-based queries
CREATE INDEX idx_users_full_name ON users(LOWER(nama_depan || ' ' || nama_belakang));
CREATE INDEX idx_shifts_month_year ON shifts(EXTRACT(YEAR FROM tanggal), EXTRACT(MONTH FROM tanggal));
CREATE INDEX idx_user_shift_stats_workload_category ON user_shift_stats(
    CASE 
        WHEN workload_score < 50 THEN 'LOW'
        WHEN workload_score < 80 THEN 'NORMAL'
        WHEN workload_score < 90 THEN 'HIGH'
        ELSE 'CRITICAL'
    END
);
```

## 🔧 TRIGGERS DAN FUNCTIONS

### **Auto-update Triggers:**
```sql
-- Trigger untuk update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply ke semua tabel yang memiliki updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_shift_stats_updated_at BEFORE UPDATE ON user_shift_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_location_capacities_updated_at BEFORE UPDATE ON location_capacities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### **Business Logic Triggers:**
```sql
-- Trigger untuk update user shift statistics
CREATE OR REPLACE FUNCTION update_user_shift_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total shifts dan consecutive days
    UPDATE user_shift_stats 
    SET 
        total_shifts = total_shifts + 1,
        shifts_this_month = (
            SELECT COUNT(*) FROM shifts 
            WHERE user_id = NEW.user_id 
            AND EXTRACT(YEAR FROM tanggal) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND EXTRACT(MONTH FROM tanggal) = EXTRACT(MONTH FROM CURRENT_DATE)
        ),
        last_shift_date = NEW.tanggal
    WHERE user_id = NEW.user_id;
    
    -- Update user table
    UPDATE users 
    SET 
        total_shifts = total_shifts + 1,
        current_month_shifts = (
            SELECT COUNT(*) FROM shifts 
            WHERE user_id = NEW.user_id 
            AND EXTRACT(YEAR FROM tanggal) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND EXTRACT(MONTH FROM tanggal) = EXTRACT(MONTH FROM CURRENT_DATE)
        ),
        last_shift_date = NEW.tanggal
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_user_shift_statistics 
    AFTER INSERT ON shifts 
    FOR EACH ROW EXECUTE FUNCTION update_user_shift_statistics();
```

## 🎯 DATA STORAGE ESTIMATES

### **Storage Requirements per Table (1000 users):**

| Table | Estimated Rows | Size per Row | Total Size |
|-------|---------------|--------------|------------|
| users | 1,000 | ~800 bytes | ~800 KB |
| shifts | 30,000/month | ~200 bytes | ~6 MB/month |
| user_shift_stats | 1,000 | ~500 bytes | ~500 KB |
| location_capacities | 365 * 20 locations | ~150 bytes | ~1 MB/year |
| user_preferences | 5,000 | ~100 bytes | ~500 KB |
| overtime_requests | 1,000/month | ~300 bytes | ~300 KB/month |
| leave_requests | 500/month | ~400 bytes | ~200 KB/month |
| audit_logs | 10,000/month | ~500 bytes | ~5 MB/month |
| **TOTAL** | | | **~15 MB/month** |

### **Growth Projections (5 years):**
- **Total Database Size**: ~1 GB
- **Index Size**: ~300 MB
- **Archive Requirements**: ~500 MB/year

Physical Data Model ini sudah ready untuk production dengan semua constraint, index, dan optimization yang diperlukan untuk sistem manajemen shift rumah sakit yang robust dan scalable.

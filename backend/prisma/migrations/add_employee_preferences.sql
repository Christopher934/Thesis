-- Migration to add employee preferences
-- This adds all the missing features for employee preferences and workload balancing

-- Add employee preferences table
CREATE TABLE IF NOT EXISTS "employee_preferences" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL UNIQUE,
    "preferredShiftType" TEXT DEFAULT 'NO_PREFERENCE',
    "preferredLocations" TEXT[] DEFAULT '{}',
    "maxShiftsPerMonth" INTEGER DEFAULT 20,
    "maxConsecutiveDays" INTEGER DEFAULT 5,
    "maxNightShiftsConsecutive" INTEGER DEFAULT 2,
    "seniorityLevel" INTEGER DEFAULT 0,
    "unavailableDates" TEXT[] DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "employee_preferences_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add shift requirements table for quota management
CREATE TABLE IF NOT EXISTS "shift_requirements" (
    "id" SERIAL PRIMARY KEY,
    "location" TEXT NOT NULL,
    "shiftType" TEXT NOT NULL,
    "minStaffRequired" INTEGER NOT NULL DEFAULT 1,
    "maxStaffAllowed" INTEGER NOT NULL DEFAULT 10,
    "preferredRoles" TEXT[] DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE("location", "shiftType")
);

-- Add workload tracking table
CREATE TABLE IF NOT EXISTS "workload_tracking" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalShifts" INTEGER NOT NULL DEFAULT 0,
    "nightShifts" INTEGER NOT NULL DEFAULT 0,
    "consecutiveDays" INTEGER NOT NULL DEFAULT 0,
    "lastShiftDate" DATE,
    "fairnessScore" DECIMAL(5,2) DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "workload_tracking_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    
    UNIQUE("userId", "month", "year")
);

-- Insert default shift requirements for common locations
INSERT INTO "shift_requirements" ("location", "shiftType", "minStaffRequired", "maxStaffAllowed", "preferredRoles") VALUES
('ICU', 'PAGI', 2, 4, '{"PERAWAT", "DOKTER"}'),
('ICU', 'SIANG', 2, 4, '{"PERAWAT", "DOKTER"}'),
('ICU', 'MALAM', 1, 3, '{"PERAWAT", "DOKTER"}'),
('NICU', 'PAGI', 2, 3, '{"PERAWAT"}'),
('NICU', 'SIANG', 2, 3, '{"PERAWAT"}'),
('NICU', 'MALAM', 1, 2, '{"PERAWAT"}'),
('GAWAT_DARURAT', 'PAGI', 3, 5, '{"PERAWAT", "DOKTER"}'),
('GAWAT_DARURAT', 'SIANG', 3, 5, '{"PERAWAT", "DOKTER"}'),
('GAWAT_DARURAT', 'MALAM', 2, 4, '{"PERAWAT", "DOKTER"}'),
('RAWAT_INAP', 'PAGI', 4, 6, '{"PERAWAT"}'),
('RAWAT_INAP', 'SIANG', 4, 6, '{"PERAWAT"}'),
('RAWAT_INAP', 'MALAM', 2, 4, '{"PERAWAT"}'),
('LABORATORIUM', 'PAGI', 1, 3, '{"STAF"}'),
('LABORATORIUM', 'SIANG', 1, 3, '{"STAF"}'),
('FARMASI', 'PAGI', 1, 2, '{"STAF"}'),
('FARMASI', 'SIANG', 1, 2, '{"STAF"}'),
('RADIOLOGI', 'PAGI', 1, 2, '{"STAF"}'),
('RADIOLOGI', 'SIANG', 1, 2, '{"STAF"}')
ON CONFLICT ("location", "shiftType") DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_employee_preferences_userId" ON "employee_preferences"("userId");
CREATE INDEX IF NOT EXISTS "idx_shift_requirements_location_shift" ON "shift_requirements"("location", "shiftType");
CREATE INDEX IF NOT EXISTS "idx_workload_tracking_user_month_year" ON "workload_tracking"("userId", "month", "year");
CREATE INDEX IF NOT EXISTS "idx_workload_tracking_fairness" ON "workload_tracking"("fairnessScore");

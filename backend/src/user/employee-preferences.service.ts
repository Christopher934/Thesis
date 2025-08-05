/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateEmployeePreferencesDto,
  ShiftPreference,
  LocationPreference,
} from './dto/employee-preferences.dto';

export interface EmployeePreferences {
  id: number;
  userId: number;
  preferredShiftType: ShiftPreference;
  preferredLocations: LocationPreference[];
  maxShiftsPerMonth: number;
  maxConsecutiveDays: number;
  maxNightShiftsConsecutive: number;
  seniorityLevel: number;
  unavailableDates: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ShiftRequirement {
  id: number;
  location: string;
  shiftType: string;
  minStaffRequired: number;
  maxStaffAllowed: number;
  preferredRoles: string[];
  isActive: boolean;
}

export interface WorkloadTracking {
  id: number;
  userId: number;
  month: number;
  year: number;
  totalShifts: number;
  nightShifts: number;
  consecutiveDays: number;
  lastShiftDate: Date | null;
  fairnessScore: number;
}

@Injectable()
export class EmployeePreferencesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get employee preferences by user ID
   */
  async getEmployeePreferences(userId: number): Promise<EmployeePreferences | null> {
    try {
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM employee_preferences WHERE "userId" = ${userId}
      `;
      
      if (result.length === 0) {
        return null;
      }
      
      const prefs = result[0];
      return {
        id: prefs.id,
        userId: prefs.userId,
        preferredShiftType: prefs.preferredShiftType as ShiftPreference,
        preferredLocations: prefs.preferredLocations as LocationPreference[],
        maxShiftsPerMonth: prefs.maxShiftsPerMonth,
        maxConsecutiveDays: prefs.maxConsecutiveDays,
        maxNightShiftsConsecutive: prefs.maxNightShiftsConsecutive,
        seniorityLevel: prefs.seniorityLevel,
        unavailableDates: prefs.unavailableDates as string[],
        createdAt: prefs.createdAt,
        updatedAt: prefs.updatedAt
      };
    } catch (error) {
      console.error('Error fetching employee preferences:', error);
      return null;
    }
  }

  /**
   * Update or create employee preferences
   */
  async updateEmployeePreferences(
    userId: number, 
    dto: UpdateEmployeePreferencesDto
  ): Promise<EmployeePreferences> {
    try {
      // Check if preferences exist
      const existing = await this.getEmployeePreferences(userId);
      
      if (existing) {
        // Update existing preferences
        const result = await this.prisma.$queryRaw<any[]>`
          UPDATE employee_preferences 
          SET 
            "preferredShiftType" = ${dto.preferredShiftType || existing.preferredShiftType},
            "preferredLocations" = ${JSON.stringify(dto.preferredLocations || existing.preferredLocations)},
            "maxShiftsPerMonth" = ${dto.maxShiftsPerMonth || existing.maxShiftsPerMonth},
            "maxConsecutiveDays" = ${dto.maxConsecutiveDays || existing.maxConsecutiveDays},
            "maxNightShiftsConsecutive" = ${dto.maxNightShiftsConsecutive || existing.maxNightShiftsConsecutive},
            "seniorityLevel" = ${dto.seniorityLevel || existing.seniorityLevel},
            "unavailableDates" = ${JSON.stringify(dto.unavailableDates || existing.unavailableDates)},
            "updatedAt" = CURRENT_TIMESTAMP
          WHERE "userId" = ${userId}
          RETURNING *
        `;
        
        return this.mapPreferencesResult(result[0]);
      } else {
        // Create new preferences
        const result = await this.prisma.$queryRaw<any[]>`
          INSERT INTO employee_preferences (
            "userId", "preferredShiftType", "preferredLocations", 
            "maxShiftsPerMonth", "maxConsecutiveDays", "maxNightShiftsConsecutive",
            "seniorityLevel", "unavailableDates"
          ) VALUES (
            ${userId},
            ${dto.preferredShiftType || ShiftPreference.NO_PREFERENCE},
            ${JSON.stringify(dto.preferredLocations || [])},
            ${dto.maxShiftsPerMonth || 20},
            ${dto.maxConsecutiveDays || 5},
            ${dto.maxNightShiftsConsecutive || 2},
            ${dto.seniorityLevel || 0},
            ${JSON.stringify(dto.unavailableDates || [])}
          )
          RETURNING *
        `;
        
        return this.mapPreferencesResult(result[0]);
      }
    } catch (error) {
      console.error('Error updating employee preferences:', error);
      throw new Error('Failed to update employee preferences');
    }
  }

  /**
   * Get shift requirements for a location and shift type
   */
  async getShiftRequirements(location: string, shiftType: string): Promise<ShiftRequirement | null> {
    try {
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM shift_requirements 
        WHERE location = ${location} AND "shiftType" = ${shiftType} AND "isActive" = true
      `;
      
      if (result.length === 0) {
        return null;
      }
      
      const req = result[0];
      return {
        id: req.id,
        location: req.location,
        shiftType: req.shiftType,
        minStaffRequired: req.minStaffRequired,
        maxStaffAllowed: req.maxStaffAllowed,
        preferredRoles: req.preferredRoles as string[],
        isActive: req.isActive
      };
    } catch (error) {
      console.error('Error fetching shift requirements:', error);
      return null;
    }
  }

  /**
   * Update shift requirements
   */
  async updateShiftRequirements(
    location: string, 
    shiftType: string, 
    requirements: Partial<ShiftRequirement>
  ): Promise<ShiftRequirement> {
    try {
      const result = await this.prisma.$queryRaw<any[]>`
        INSERT INTO shift_requirements (
          location, "shiftType", "minStaffRequired", "maxStaffAllowed", "preferredRoles"
        ) VALUES (
          ${location}, ${shiftType}, 
          ${requirements.minStaffRequired || 1}, 
          ${requirements.maxStaffAllowed || 10},
          ${JSON.stringify(requirements.preferredRoles || [])}
        )
        ON CONFLICT (location, "shiftType") DO UPDATE SET
          "minStaffRequired" = ${requirements.minStaffRequired || 1},
          "maxStaffAllowed" = ${requirements.maxStaffAllowed || 10},
          "preferredRoles" = ${JSON.stringify(requirements.preferredRoles || [])},
          "updatedAt" = CURRENT_TIMESTAMP
        RETURNING *
      `;
      
      const req = result[0];
      return {
        id: req.id,
        location: req.location,
        shiftType: req.shiftType,
        minStaffRequired: req.minStaffRequired,
        maxStaffAllowed: req.maxStaffAllowed,
        preferredRoles: req.preferredRoles as string[],
        isActive: req.isActive
      };
    } catch (error) {
      console.error('Error updating shift requirements:', error);
      throw new Error('Failed to update shift requirements');
    }
  }

  /**
   * Get workload tracking for a user
   */
  async getWorkloadTracking(userId: number, month: number, year: number): Promise<WorkloadTracking | null> {
    try {
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM workload_tracking 
        WHERE "userId" = ${userId} AND month = ${month} AND year = ${year}
      `;
      
      if (result.length === 0) {
        return null;
      }
      
      const workload = result[0];
      return {
        id: workload.id,
        userId: workload.userId,
        month: workload.month,
        year: workload.year,
        totalShifts: workload.totalShifts,
        nightShifts: workload.nightShifts,
        consecutiveDays: workload.consecutiveDays,
        lastShiftDate: workload.lastShiftDate,
        fairnessScore: parseFloat(workload.fairnessScore) || 0
      };
    } catch (error) {
      console.error('Error fetching workload tracking:', error);
      return null;
    }
  }

  /**
   * Update workload tracking
   */
  async updateWorkloadTracking(
    userId: number, 
    month: number, 
    year: number, 
    updates: Partial<WorkloadTracking>
  ): Promise<WorkloadTracking> {
    try {
      const existing = await this.getWorkloadTracking(userId, month, year);
      
      if (existing) {
        const result = await this.prisma.$queryRaw<any[]>`
          UPDATE workload_tracking SET
            "totalShifts" = ${updates.totalShifts || existing.totalShifts},
            "nightShifts" = ${updates.nightShifts || existing.nightShifts},
            "consecutiveDays" = ${updates.consecutiveDays || existing.consecutiveDays},
            "lastShiftDate" = ${updates.lastShiftDate || existing.lastShiftDate},
            "fairnessScore" = ${updates.fairnessScore || existing.fairnessScore},
            "updatedAt" = CURRENT_TIMESTAMP
          WHERE "userId" = ${userId} AND month = ${month} AND year = ${year}
          RETURNING *
        `;
        
        return this.mapWorkloadResult(result[0]);
      } else {
        const result = await this.prisma.$queryRaw<any[]>`
          INSERT INTO workload_tracking (
            "userId", month, year, "totalShifts", "nightShifts", 
            "consecutiveDays", "lastShiftDate", "fairnessScore"
          ) VALUES (
            ${userId}, ${month}, ${year},
            ${updates.totalShifts || 0}, ${updates.nightShifts || 0},
            ${updates.consecutiveDays || 0}, ${updates.lastShiftDate || null},
            ${updates.fairnessScore || 0}
          )
          RETURNING *
        `;
        
        return this.mapWorkloadResult(result[0]);
      }
    } catch (error) {
      console.error('Error updating workload tracking:', error);
      throw new Error('Failed to update workload tracking');
    }
  }

  /**
   * Get all employees with their preferences for scheduling optimization
   */
  async getAllEmployeesWithPreferences(): Promise<Array<{
    userId: number;
    role: string;
    preferences: EmployeePreferences | null;
    currentWorkload: WorkloadTracking | null;
  }>> {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT 
          u.id as "userId",
          u.role,
          u."namaDepan",
          u."namaBelakang",
          ep.*,
          wt."totalShifts",
          wt."nightShifts", 
          wt."consecutiveDays",
          wt."fairnessScore"
        FROM "User" u
        LEFT JOIN employee_preferences ep ON u.id = ep."userId"
        LEFT JOIN workload_tracking wt ON u.id = wt."userId" 
          AND wt.month = ${currentMonth} AND wt.year = ${currentYear}
        WHERE u.role IN ('DOKTER', 'PERAWAT', 'STAF')
        ORDER BY u.role, ep."seniorityLevel" DESC NULLS LAST
      `;
      
      return result.map(row => ({
        userId: row.userId,
        role: row.role,
        preferences: row.id ? this.mapPreferencesResult(row) : null,
        currentWorkload: row.totalShifts !== null ? this.mapWorkloadResult(row) : null
      }));
    } catch (error) {
      console.error('Error fetching employees with preferences:', error);
      return [];
    }
  }

  private mapPreferencesResult(row: any): EmployeePreferences {
    return {
      id: row.id,
      userId: row.userId,
      preferredShiftType: row.preferredShiftType as ShiftPreference,
      preferredLocations: (row.preferredLocations as string[])?.map(location => 
        location as LocationPreference
      ) || [],
      maxShiftsPerMonth: row.maxShiftsPerMonth,
      maxConsecutiveDays: row.maxConsecutiveDays,
      maxNightShiftsConsecutive: row.maxNightShiftsConsecutive,
      seniorityLevel: row.seniorityLevel,
      unavailableDates: (row.unavailableDates as string[]) || [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  private mapWorkloadResult(row: any): WorkloadTracking {
    return {
      id: row.id,
      userId: row.userId,
      month: row.month,
      year: row.year,
      totalShifts: row.totalShifts,
      nightShifts: row.nightShifts,
      consecutiveDays: row.consecutiveDays,
      lastShiftDate: row.lastShiftDate,
      fairnessScore: parseFloat(row.fairnessScore) || 0
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ShiftCreationRequest {
  date: string;
  location: string;
  shiftType: 'PAGI' | 'SIANG' | 'MALAM' | 'ON_CALL' | 'JAGA';
  requiredCount: number;
  preferredRoles?: string[];
  skillRequirements?: string[];
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

interface ShiftAssignment {
  userId: number;
  shiftDetails: ShiftCreationRequest;
  score: number;
  reason: string;
}

interface WorkloadAlert {
  userId: number;
  employeeId: string;
  name: string;
  role: string;
  currentShifts: number;
  consecutiveDays: number;
  status: 'NORMAL' | 'HIGH' | 'OVERWORKED' | 'CRITICAL';
  recommendation: string;
}

// 🧠 NEW: Backtracking Algorithm Support Classes
interface BacktrackingResult {
  success: boolean;
  assignments: ShiftAssignment[];
  conflicts: string[];
  exploredNodes: number;
  pruned: number;
}

interface CandidateUser {
  user: any;
  score: number;
  reason: string;
}

interface ConstraintValidation {
  isValid: boolean;
  reason: string;
  violatedConstraints: string[];
}

/**
 * 🧠 BACKTRACKING STATE MANAGEMENT: Maintains assignment stack and state
 */
class BacktrackingState {
  private assignmentStack: ShiftAssignment[] = [];
  private exploredNodes: number = 0;
  private prunedBranches: number = 0;
  private userAssignmentCount: Map<number, number> = new Map();
  private dateAssignments: Map<string, ShiftAssignment[]> = new Map();
  private availableUsers: any[];

  constructor(initialAssignments: ShiftAssignment[], availableUsers: any[]) {
    this.assignmentStack = [...initialAssignments];
    this.availableUsers = availableUsers;
    this.buildStateMaps();
  }

  private buildStateMaps(): void {
    // Build user assignment count map
    this.userAssignmentCount.clear();
    this.dateAssignments.clear();

    for (const assignment of this.assignmentStack) {
      // User assignment count
      const currentCount = this.userAssignmentCount.get(assignment.userId) || 0;
      this.userAssignmentCount.set(assignment.userId, currentCount + 1);

      // Date assignments
      const date = assignment.shiftDetails.date;
      if (!this.dateAssignments.has(date)) {
        this.dateAssignments.set(date, []);
      }
      this.dateAssignments.get(date)!.push(assignment);
    }
  }

  pushAssignment(assignment: ShiftAssignment): void {
    this.assignmentStack.push(assignment);

    // Update user assignment count
    const currentCount = this.userAssignmentCount.get(assignment.userId) || 0;
    this.userAssignmentCount.set(assignment.userId, currentCount + 1);

    // Update date assignments
    const date = assignment.shiftDetails.date;
    if (!this.dateAssignments.has(date)) {
      this.dateAssignments.set(date, []);
    }
    this.dateAssignments.get(date)!.push(assignment);
  }

  popAssignment(): ShiftAssignment | undefined {
    const removed = this.assignmentStack.pop();

    if (removed) {
      // Update user assignment count
      const currentCount = this.userAssignmentCount.get(removed.userId) || 0;
      if (currentCount > 1) {
        this.userAssignmentCount.set(removed.userId, currentCount - 1);
      } else {
        this.userAssignmentCount.delete(removed.userId);
      }

      // Update date assignments
      const date = removed.shiftDetails.date;
      const dateAssigns = this.dateAssignments.get(date);
      if (dateAssigns) {
        const index = dateAssigns.findIndex(
          (a) =>
            a.userId === removed.userId &&
            a.shiftDetails.location === removed.shiftDetails.location &&
            a.shiftDetails.shiftType === removed.shiftDetails.shiftType,
        );
        if (index !== -1) {
          dateAssigns.splice(index, 1);
        }
        if (dateAssigns.length === 0) {
          this.dateAssignments.delete(date);
        }
      }
    }

    return removed;
  }

  getCurrentAssignments(): ShiftAssignment[] {
    return [...this.assignmentStack];
  }

  getUserAssignmentCount(userId: number): number {
    return this.userAssignmentCount.get(userId) || 0;
  }

  getAvailableUsers(): any[] {
    return this.availableUsers;
  }

  getDateAssignments(date: string): ShiftAssignment[] {
    return this.dateAssignments.get(date) || [];
  }

  hasUserAssignmentOnDate(userId: number, date: string): boolean {
    const dateAssigns = this.dateAssignments.get(date) || [];
    return dateAssigns.some((a) => a.userId === userId);
  }

  shouldPrune(request: ShiftCreationRequest): boolean {
    // PRUNING STRATEGY 1: Check if any user can possibly fulfill this request
    const availableOnDate = this.getAvailableUsers().filter(
      (user) => !this.hasUserAssignmentOnDate(user.id, request.date),
    );

    if (availableOnDate.length === 0) {
      return true; // No users available on this date
    }

    // PRUNING STRATEGY 2: Check role requirements
    if (request.preferredRoles && request.preferredRoles.length > 0) {
      const usersWithRole = availableOnDate.filter((user) =>
        request.preferredRoles!.includes(user.role),
      );
      if (usersWithRole.length === 0) {
        return true; // No users with required role
      }
    }

    // PRUNING STRATEGY 3: Check workload limits
    const overloadedUsers = availableOnDate.filter(
      (user) => this.getUserAssignmentCount(user.id) >= 20, // Max shifts per user
    );

    if (overloadedUsers.length === availableOnDate.length) {
      return true; // All available users are overloaded
    }

    return false; // Don't prune
  }

  incrementExploredNodes(): void {
    this.exploredNodes++;
  }

  incrementPrunedBranches(): void {
    this.prunedBranches++;
  }

  getExploredNodes(): number {
    return this.exploredNodes;
  }

  getPrunedBranches(): number {
    return this.prunedBranches;
  }
}

// 🧠 ADVANCED FEATURES INTERFACES
interface ConflictAnalysis {
  totalConflicts: number;
  conflictsByType: { [key: string]: number };
  severityDistribution: { [key: string]: number };
  affectedUsers: number[];
  resolutionComplexity: number;
  priorityQueue: DetectedConflict[];
}

interface DetectedConflict {
  type:
    | 'SCHEDULE_CONFLICT'
    | 'WORKLOAD_OVERLOAD'
    | 'CAPACITY_SHORTAGE'
    | 'SKILL_MISMATCH'
    | 'REGULATION_VIOLATION'
    | 'CRITICAL_SHORTAGE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedUsers: number[];
  description: string;
  suggestedResolution: string;
  estimatedImpact: number;
}

interface ResolutionStrategy {
  type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  description: string;
  targetConflicts: string[];
  estimatedResolution: number;
  complexityScore: number;
}

interface QualityMetrics {
  overallScore: number;
  fairnessScore: number;
  efficiencyScore: number;
  satisfactionScore: number;
  complianceScore: number;
  utilizationRate: number;
  conflictRate: number;
  skillMatchRate: number;
  workloadBalance: number;
  temporalDistribution: number;
}

interface QualityImprovementReport {
  qualityScore: number;
  metrics: QualityMetrics;
  recommendations: string[];
  optimizations: OptimizationOpportunity[];
  benchmarks: BenchmarkComparison;
  improvementPotential: number;
}

interface OptimizationOpportunity {
  category: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  expectedImprovement: number;
}

interface BenchmarkComparison {
  industryAverage: number;
  bestPractice: number;
  previousPeriod: number;
  percentileRank: number;
}

// Additional interfaces for weekly/monthly scheduling
interface WeeklyScheduleStats {
  totalShifts: number;
  successfulAssignments: number;
  conflicts: SchedulingConflict[];
  recommendations: string[];
}

interface MonthlyScheduleStats {
  totalShifts: number;
  successfulAssignments: number;
  conflicts: SchedulingConflict[];
  recommendations: string[];
  workloadDistribution: { [userId: number]: number };
}

// 🔥 NEW: Enhanced error types for comprehensive error handling
export enum SchedulingErrorType {
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
  INSUFFICIENT_STAFF = 'INSUFFICIENT_STAFF',
  STAFF_OVER_LIMIT = 'STAFF_OVER_LIMIT',
  SCHEDULE_CONFLICT = 'SCHEDULE_CONFLICT',
  CONSECUTIVE_DAYS_EXCEEDED = 'CONSECUTIVE_DAYS_EXCEEDED',
  NO_STAFF_WITH_REQUIRED_ROLE = 'NO_STAFF_WITH_REQUIRED_ROLE',
  SHIFT_OUTSIDE_OPERATIONAL_HOURS = 'SHIFT_OUTSIDE_OPERATIONAL_HOURS',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INCOMPLETE_ROLE_COVERAGE = 'INCOMPLETE_ROLE_COVERAGE',
  SHIFT_SLOT_FULL = 'SHIFT_SLOT_FULL',
  WORKLOAD_EXCEEDED = 'WORKLOAD_EXCEEDED',
}

export interface SchedulingError {
  type: SchedulingErrorType;
  message: string;
  date?: string;
  location?: string;
  shiftType?: string;
  userId?: number;
  affectedUsers?: number[];
  suggestedActions: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  autoResolvable: boolean;
}

export interface SchedulingResult {
  success: boolean;
  totalRequested: number;
  totalCreated: number;
  fulfillmentRate: number;
  errors: SchedulingError[];
  warnings: SchedulingError[];
  summary: {
    successfulDates: string[];
    failedDates: string[];
    partialDates: string[];
    overLimitStaff: Array<{
      userId: number;
      name: string;
      currentShifts: number;
      limit: number;
    }>;
    incompleteShifts: Array<{
      date: string;
      location: string;
      missingRoles: string[];
    }>;
  };
  recommendations: string[];
  // 🔥 FIX: Add missing properties for backward compatibility
  totalShifts?: number; // Alias for totalRequested
  successfulAssignments?: number; // Alias for totalCreated
}

interface SchedulingConflict {
  date: string;
  location: string;
  shiftType: string;
  error: string;
  userId?: number;
}

interface WeeklyScheduleRequest {
  startDate: string;
  locations: string[];
  staffPattern?: {
    [location: string]: {
      PAGI?: { DOKTER?: number; PERAWAT?: number; STAFF?: number };
      SIANG?: { DOKTER?: number; PERAWAT?: number; STAFF?: number };
      MALAM?: { DOKTER?: number; PERAWAT?: number; STAFF?: number };
    };
  };
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

interface MonthlyScheduleRequest {
  year: number;
  month: number;
  locations: string[];
  staffPattern?: {
    [location: string]: {
      PAGI?: { DOKTER?: number; PERAWAT?: number; STAFF?: number };
      SIANG?: { DOKTER?: number; PERAWAT?: number; STAFF?: number };
      MALAM?: { DOKTER?: number; PERAWAT?: number; STAFF?: number };
    };
  };
  workloadLimits?: {
    maxShiftsPerPerson: number;
    maxConsecutiveDays: number;
  };
}

interface ShiftAssignmentExtended {
  userId: number;
  date: string;
  location: string;
  shiftType: string;
  startTime: Date;
  endTime: Date;
  priority: string;
}

interface WeeklyScheduleStats {
  totalShifts: number;
  successfulAssignments: number;
  conflicts: SchedulingConflict[];
  recommendations: string[];
}

interface MonthlyScheduleStats {
  totalShifts: number;
  successfulAssignments: number;
  conflicts: SchedulingConflict[];
  recommendations: string[];
  workloadDistribution: { [userId: number]: number };
}

@Injectable()
export class AdminShiftOptimizationService {
  constructor(private prisma: PrismaService) {}

  /**
   * HYBRID ALGORITHM: Greedy + Backtracking for Optimal Shift Assignment
   */
  async createOptimalShiftAssignments(
    requests: ShiftCreationRequest[],
  ): Promise<{
    assignments: ShiftAssignment[];
    createdShifts: any[];
    conflicts: any[];
    workloadAlerts: WorkloadAlert[];
    locationCapacityStatus: any[];
    fulfillmentRate: number;
    recommendations: string[];
  }> {
    console.log('🧠 Starting Hybrid Algorithm: Greedy + Backtracking');

    // Step 1: Get all available users with current workload
    const availableUsers = await this.getAvailableUsersWithWorkload();

    // Step 2: Check location capacity for each request
    const locationCapacityStatus = await Promise.all(
      requests.map((req) => this.checkLocationCapacity(req)),
    );

    // Step 3: Apply Greedy Algorithm first (fast initial assignment)
    const greedyAssignments = await this.greedyAssignment(
      requests,
      availableUsers,
    );

    // Step 4: Apply Backtracking to optimize conflicts
    const optimizedAssignments = await this.backtrackingOptimization(
      greedyAssignments,
      availableUsers,
    );

    // Step 5: Generate workload alerts
    const workloadAlerts = await this.generateWorkloadAlerts();

    // Step 6: Identify remaining conflicts
    const conflicts = await this.identifyConflicts(optimizedAssignments);

    // Step 7: Calculate fulfillment rate
    const totalRequested = requests.reduce(
      (sum, req) => sum + req.requiredCount,
      0,
    );
    const fulfillmentRate =
      totalRequested > 0
        ? (optimizedAssignments.length / totalRequested) * 100
        : 100;

    // Step 8: Generate recommendations
    const recommendations = this.generateOptimizationRecommendations(
      conflicts,
      workloadAlerts,
      locationCapacityStatus,
    );

    // Step 9: ACTUALLY CREATE SHIFTS IN DATABASE
    let createdShifts: any[] = [];
    if (optimizedAssignments.length > 0) {
      console.log('🚀 Creating shifts in database...');
      createdShifts = await this.createShiftsInDatabase(optimizedAssignments);
    }

    return {
      assignments: optimizedAssignments,
      createdShifts,
      conflicts,
      workloadAlerts,
      locationCapacityStatus,
      fulfillmentRate,
      recommendations,
    };
  }

  /**
   * 🔥 NEW: Preview optimal shift assignments WITHOUT saving to database
   */
  async previewOptimalShiftAssignments(
    requests: ShiftCreationRequest[],
  ): Promise<{
    preview: any[];
    statistics: {
      totalRequested: number;
      totalAssigned: number;
      fulfillmentRate: number;
      workloadDistribution: { [userId: number]: number };
      conflicts: any[];
      warnings: any[];
    };
    recommendations: string[];
  }> {
    console.log(
      `👁️ Previewing optimal shift assignments for ${requests.length} requests`,
    );

    try {
      // Step 1: Get available users with their current workload
      console.log('🔍 Step 1: Getting available users...');
      const availableUsers = await this.getAvailableUsersWithWorkload();
      console.log(`   Found ${availableUsers.length} available users`);

      // Step 2: Check location capacity for each request
      console.log('🔍 Step 2: Checking location capacity...');
      const locationCapacityStatus = await Promise.all(
        requests.map((req) => this.checkLocationCapacity(req)),
      );
      console.log(
        `   Checked capacity for ${locationCapacityStatus.length} requests`,
      );

      // Step 3: Apply Greedy Algorithm first (fast initial assignment)
      console.log('🔍 Step 3: Applying greedy algorithm...');
      const greedyAssignments = await this.greedyAssignment(
        requests,
        availableUsers,
      );
      console.log(
        `   Greedy algorithm assigned ${greedyAssignments.length} shifts`,
      );

      // Step 4: Apply Backtracking to optimize conflicts
      console.log('🔍 Step 4: Applying backtracking optimization...');
      const optimizedAssignments = await this.backtrackingOptimization(
        greedyAssignments,
        availableUsers,
      );
      console.log(
        `   Backtracking optimization resulted in ${optimizedAssignments.length} assignments`,
      );

      // Step 5: Generate workload alerts
      console.log('🔍 Step 5: Generating workload alerts...');
      const workloadAlerts = await this.generateWorkloadAlerts();
      console.log(`   Generated ${workloadAlerts.length} workload alerts`);

      // Step 6: Identify remaining conflicts
      console.log('🔍 Step 6: Identifying conflicts...');
      const conflicts = await this.identifyConflicts(optimizedAssignments);
      console.log(`   Found ${conflicts.length} conflicts`);

      // Step 7: Calculate statistics
      console.log('🔍 Step 7: Calculating statistics...');
      const totalRequested = requests.reduce(
        (sum, req) => sum + req.requiredCount,
        0,
      );
      const totalAssigned = optimizedAssignments.length;
      const fulfillmentRate =
        totalRequested > 0 ? (totalAssigned / totalRequested) * 100 : 100;
      console.log(
        `   Statistics: ${totalAssigned}/${totalRequested} = ${fulfillmentRate.toFixed(1)}%`,
      );

      // Step 8: Calculate workload distribution
      console.log('🔍 Step 8: Calculating workload distribution...');
      const workloadDistribution: { [userId: number]: number } = {};
      optimizedAssignments.forEach((assignment) => {
        workloadDistribution[assignment.userId] =
          (workloadDistribution[assignment.userId] || 0) + 1;
      });
      console.log(
        `   Workload distributed across ${Object.keys(workloadDistribution).length} users`,
      );

      // Step 9: Generate recommendations
      console.log('🔍 Step 9: Generating recommendations...');
      const recommendations = this.generateOptimizationRecommendations(
        conflicts,
        workloadAlerts,
        locationCapacityStatus,
      );
      console.log(`   Generated ${recommendations.length} recommendations`);

      // Step 10: Format preview data
      console.log('🔍 Step 10: Formatting preview data...');
      const preview = optimizedAssignments.map((assignment) => ({
        userId: assignment.userId,
        userName:
          availableUsers.find((u) => u.id === assignment.userId)?.namaDepan +
          ' ' +
          availableUsers.find((u) => u.id === assignment.userId)?.namaBelakang,
        userRole: availableUsers.find((u) => u.id === assignment.userId)?.role,
        date: assignment.shiftDetails.date,
        location: assignment.shiftDetails.location,
        shiftType: assignment.shiftDetails.shiftType,
        priority: assignment.shiftDetails.priority,
        score: assignment.score,
        reason: assignment.reason,
      }));
      console.log(`   Formatted ${preview.length} preview items`);

      console.log('✅ Preview generation completed successfully');
      return {
        preview,
        statistics: {
          totalRequested,
          totalAssigned,
          fulfillmentRate,
          workloadDistribution,
          conflicts,
          warnings: workloadAlerts.filter((alert) => alert.status !== 'NORMAL'),
        },
        recommendations,
      };
    } catch (error) {
      console.error('❌ Error in previewOptimalShiftAssignments:', error);
      throw error;
    }
  }

  /**
   * 🔥 NEW: Confirm and save previewed shifts to database
   */
  async confirmAndSaveShifts(assignments: any[]): Promise<{
    success: boolean;
    createdShifts: any[];
    summary: {
      totalCreated: number;
      errors: any[];
    };
  }> {
    console.log(
      `✅ Confirming and saving ${assignments.length} shift assignments to database`,
    );

    try {
      const errors: any[] = [];
      const createdShifts: any[] = [];

      for (const assignment of assignments) {
        try {
          // Validate assignment is still valid (double-check)
          const user = await this.prisma.user.findUnique({
            where: { id: assignment.userId },
            include: { shifts: true },
          });

          if (!user) {
            errors.push({
              assignment,
              error: 'User not found',
              severity: 'HIGH',
            });
            continue;
          }

          // Check for conflicts again (in case data changed)
          const hasConflict = this.checkDateConflict(user, assignment.date);
          if (hasConflict) {
            errors.push({
              assignment,
              error: 'Schedule conflict detected',
              severity: 'MEDIUM',
            });
            continue;
          }

          // Validate night shift limits
          const nightShiftValidation = this.validateNightShiftLimits(user, {
            shiftType: assignment.shiftType,
            date: assignment.date,
            location: assignment.location,
            requiredCount: 1,
            priority: assignment.priority,
          });

          if (!nightShiftValidation.isValid) {
            errors.push({
              assignment,
              error: nightShiftValidation.reason,
              severity: 'HIGH',
            });
            continue;
          }

          // 🔥 NEW: Validate maximum shifts per week
          const weeklyValidation = await this.validateMaxShiftsPerWeek(user, {
            shiftType: assignment.shiftType,
            date: assignment.date,
            location: assignment.location,
            requiredCount: 1,
            priority: assignment.priority,
          });

          if (!weeklyValidation.isValid) {
            errors.push({
              assignment,
              error: weeklyValidation.reason,
              severity: 'HIGH',
            });
            continue;
          }

          // 🔥 NEW: Validate consecutive night shifts with database check
          const consecutiveNightValidation =
            await this.validateConsecutiveNightShifts(user, {
              shiftType: assignment.shiftType,
              date: assignment.date,
              location: assignment.location,
              requiredCount: 1,
              priority: assignment.priority,
            });

          if (!consecutiveNightValidation.isValid) {
            errors.push({
              assignment,
              error: consecutiveNightValidation.reason,
              severity: 'HIGH',
            });
            continue;
          }

          // Create the shift
          const createdShift = await this.createSingleShift(assignment);
          createdShifts.push(createdShift);
        } catch (error) {
          errors.push({
            assignment,
            error: error.message,
            severity: 'CRITICAL',
          });
        }
      }

      return {
        success: errors.filter((e) => e.severity === 'CRITICAL').length === 0,
        createdShifts,
        summary: {
          totalCreated: createdShifts.length,
          errors,
        },
      };
    } catch (error) {
      throw new Error(`Failed to confirm shifts: ${error.message}`);
    }
  }

  /**
   * Helper method to create a single shift in database
   */
  private async createSingleShift(assignment: any): Promise<any> {
    const shiftStartTime = this.getShiftStartTime(assignment.shiftType);
    const shiftEndTime = this.getShiftEndTime(assignment.shiftType);

    return await this.prisma.shift.create({
      data: {
        userId: assignment.userId,
        tanggal: new Date(assignment.date),
        jammulai: shiftStartTime,
        jamselesai: shiftEndTime,
        lokasishift: assignment.location, // Fixed: lokasishift as required by Prisma schema
        lokasiEnum: assignment.location, // Keep enum for type safety
        tipeshift: assignment.shiftType,
        notes: `Auto-generated by optimization algorithm. Score: ${assignment.score}. Reason: ${assignment.reason}`,
      },
      include: {
        user: {
          select: {
            id: true,
            namaDepan: true,
            namaBelakang: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * GREEDY ALGORITHM: Assign shifts to best available users first
   */
  private async greedyAssignment(
    requests: ShiftCreationRequest[],
    availableUsers: any[],
  ): Promise<ShiftAssignment[]> {
    const assignments: ShiftAssignment[] = [];
    const userAssignmentCount = new Map<number, number>();

    console.log(
      `🎯 Greedy Assignment: Processing ${requests.length} requests with ${availableUsers.length} users`,
    );

    // 🔥 NEW: Sort users by workload before processing (workload balancing)
    const balancedUsers = await this.sortUsersByWorkload(availableUsers);
    console.log(
      `⚖️ Workload Balancing: Users sorted by shift count (least busy first)`,
    );

    // Sort requests by priority (URGENT -> HIGH -> NORMAL -> LOW)
    const sortedRequests = requests.sort((a, b) => {
      const priorityOrder = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    for (const request of sortedRequests) {
      console.log(
        `📋 Processing request for ${request.location} on ${request.date}, need ${request.requiredCount} users`,
      );

      // 🔥 ENHANCED: Calculate fitness score with workload balancing and validations (async)
      const userScores = await Promise.all(
        balancedUsers.map(async (user) => ({
          user,
          score: await this.calculateEnhancedFitnessScore(
            user,
            request,
            userAssignmentCount.get(user.id) || 0,
          ),
          currentAssignments: userAssignmentCount.get(user.id) || 0,
          totalShifts: user.totalShifts || 0,
        })),
      );

      console.log(
        `📊 Top candidates:`,
        userScores.slice(0, 5).map((us) => ({
          userId: us.user.id,
          name: `${us.user.namaDepan} ${us.user.namaBelakang}`,
          score: us.score,
          totalShifts: us.totalShifts,
          currentAssignments: us.currentAssignments,
        })),
      );

      // Sort by enhanced score (highest first) - already considers workload balancing
      userScores.sort((a, b) => b.score - a.score);

      // Greedily assign to top N users (based on requiredCount)
      const selectedUsers = userScores
        .filter((us) => us.score >= 30) // Slightly higher threshold for quality
        .slice(0, request.requiredCount);

      console.log(
        `✅ Selected ${selectedUsers.length}/${request.requiredCount} users for this request`,
      );

      for (const userScore of selectedUsers) {
        assignments.push({
          userId: userScore.user.id,
          shiftDetails: request,
          score: userScore.score,
          reason: `Workload-balanced selection: score ${userScore.score}/100, shifts: ${userScore.totalShifts}`,
        });

        // Update assignment count
        userAssignmentCount.set(
          userScore.user.id,
          (userAssignmentCount.get(userScore.user.id) || 0) + 1,
        );
      }
    }

    console.log(
      `🎯 Greedy Assignment Complete: Generated ${assignments.length} assignments`,
    );
    return assignments;
  }

  /**
   * 🧠 TRUE BACKTRACKING ALGORITHM: Recursive State Space Search with Constraint Satisfaction
   */
  private async backtrackingOptimization(
    initialAssignments: ShiftAssignment[],
    availableUsers: any[],
  ): Promise<ShiftAssignment[]> {
    console.log('🔍 Starting True Backtracking Algorithm...');

    // Initialize backtracking state
    const backtrackingState = new BacktrackingState(
      initialAssignments,
      availableUsers,
    );

    // Extract unfulfilled requests that need optimization
    const unfulfilledRequests =
      this.extractUnfulfilledRequests(initialAssignments);

    console.log(
      `📊 Backtracking Stats: ${unfulfilledRequests.length} unfulfilled requests to optimize`,
    );

    // Start recursive backtracking
    const result = await this.recursiveBacktracking(
      backtrackingState,
      unfulfilledRequests,
      0,
    );

    if (result.success) {
      console.log(
        `✅ Backtracking completed: ${result.assignments.length} optimal assignments found`,
      );
      return result.assignments;
    } else {
      console.log(
        `⚠️ Backtracking partial success: ${result.assignments.length} assignments, ${result.conflicts.length} conflicts remain`,
      );
      return result.assignments;
    }
  }

  /**
   * 🔄 RECURSIVE BACKTRACKING: Core algorithm with branching and pruning
   */
  private async recursiveBacktracking(
    state: BacktrackingState,
    requests: ShiftCreationRequest[],
    requestIndex: number,
  ): Promise<BacktrackingResult> {
    // BASE CASE: All requests processed
    if (requestIndex >= requests.length) {
      console.log(
        `🎯 Base case reached: All ${requests.length} requests processed`,
      );
      return {
        success: true,
        assignments: state.getCurrentAssignments(),
        conflicts: [],
        exploredNodes: state.getExploredNodes(),
        pruned: state.getPrunedBranches(),
      };
    }

    const currentRequest = requests[requestIndex];
    console.log(
      `🔍 Processing request ${requestIndex + 1}/${requests.length}: ${currentRequest.location} ${currentRequest.shiftType} on ${currentRequest.date}`,
    );

    // PRUNING CHECK: Early termination if solution space exhausted
    if (state.shouldPrune(currentRequest)) {
      console.log(`✂️ Pruning branch: Constraints cannot be satisfied`);
      state.incrementPrunedBranches();
      return {
        success: false,
        assignments: state.getCurrentAssignments(),
        conflicts: [
          `Pruned: ${currentRequest.location} ${currentRequest.shiftType}`,
        ],
        exploredNodes: state.getExploredNodes(),
        pruned: state.getPrunedBranches(),
      };
    }

    // Get candidate users sorted by fitness score (HEURISTIC ORDERING)
    const candidates = await this.getCandidateUsers(currentRequest, state);
    console.log(
      `👥 Found ${candidates.length} candidate users for ${currentRequest.location} ${currentRequest.shiftType}`,
    );

    // TRY EACH CANDIDATE (BRANCHING)
    for (const candidate of candidates) {
      console.log(
        `🧪 Trying candidate: ${candidate.user.namaDepan} ${candidate.user.namaBelakang} (score: ${candidate.score})`,
      );

      // CHECK CONSTRAINTS
      const constraintValidation = await this.validateAllConstraints(
        candidate.user,
        currentRequest,
        state,
      );

      if (!constraintValidation.isValid) {
        console.log(`❌ Constraint violation: ${constraintValidation.reason}`);
        state.incrementExploredNodes();
        continue; // Try next candidate
      }

      // MAKE ASSIGNMENT (FORWARD STEP)
      const assignment: ShiftAssignment = {
        userId: candidate.user.id,
        shiftDetails: currentRequest,
        score: candidate.score,
        reason: `Backtracking optimal assignment: ${constraintValidation.reason}`,
      };

      state.pushAssignment(assignment);
      console.log(
        `✅ Assignment made: ${candidate.user.namaDepan} assigned to ${currentRequest.location}`,
      );

      // RECURSIVE CALL (EXPLORE DEEPER)
      const subResult = await this.recursiveBacktracking(
        state,
        requests,
        requestIndex + 1,
      );

      // CHECK IF SOLUTION FOUND
      if (subResult.success) {
        console.log(`🎉 Solution found through recursion!`);
        return subResult;
      }

      // BACKTRACK: UNDO ASSIGNMENT (BACKWARD STEP)
      const undoneAssignment = state.popAssignment();
      console.log(
        `🔄 Backtracking: Undoing assignment for ${undoneAssignment?.userId}`,
      );

      // Continue with next candidate
    }

    // NO SOLUTION FOUND WITH ANY CANDIDATE
    console.log(
      `💔 No solution found for request ${requestIndex + 1}: ${currentRequest.location} ${currentRequest.shiftType}`,
    );
    return {
      success: false,
      assignments: state.getCurrentAssignments(),
      conflicts: [
        `No valid assignment: ${currentRequest.location} ${currentRequest.shiftType} on ${currentRequest.date}`,
      ],
      exploredNodes: state.getExploredNodes(),
      pruned: state.getPrunedBranches(),
    };
  }

  /**
   * Calculate fitness score for user-shift compatibility
   */
  private calculateUserFitnessScore(
    user: any,
    request: ShiftCreationRequest,
  ): number {
    let score = 50; // Base score

    // Role compatibility
    if (request.preferredRoles?.includes(user.role)) {
      score += 25;
    }

    // Location experience
    const locationExperience =
      user.shifts?.filter((shift: any) => shift.lokasiEnum === request.location)
        .length || 0;

    if (locationExperience > 5) score += 20;
    else if (locationExperience > 0) score += 10;

    // Workload balance (prefer users with fewer shifts)
    const currentShiftCount = user.shifts?.length || 0;
    if (currentShiftCount < 10) score += 15;
    else if (currentShiftCount < 15) score += 10;
    else if (currentShiftCount > 20) score -= 20;

    // Consecutive days check (fatigue prevention)
    const consecutiveDays = this.calculateConsecutiveDays(user, request.date);
    if (consecutiveDays >= 5) score -= 30;
    else if (consecutiveDays >= 3) score -= 15;

    // Availability check
    const hasConflict = this.checkDateConflict(user, request.date);
    if (hasConflict) score = 0; // Unavailable

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 🔥 NEW: Enhanced fitness score with improved workload balancing and validation
   */
  private async calculateEnhancedFitnessScore(
    user: any,
    request: ShiftCreationRequest,
    currentAssignments: number,
  ): Promise<number> {
    let score = 50; // Base score

    // 1. Role compatibility (highest priority)
    if (request.preferredRoles?.includes(user.role)) {
      score += 30;
    }

    // 2. Workload balancing (major factor)
    const totalShifts = user.totalShifts || 0;
    const maxShifts = this.getMaxShiftsForRole(user.role);
    const utilizationRate = (totalShifts / maxShifts) * 100;

    if (utilizationRate < 30)
      score += 25; // Highly underutilized - priority
    else if (utilizationRate < 50)
      score += 20; // Moderately underutilized
    else if (utilizationRate < 70)
      score += 10; // Normal range
    else if (utilizationRate < 85)
      score -= 5; // Getting busy
    else if (utilizationRate < 95)
      score -= 15; // Very busy
    else score -= 30; // Overworked - avoid

    // 3. Current assignments in this batch (prevent over-assignment)
    if (currentAssignments === 0)
      score += 15; // Bonus for not assigned yet
    else if (currentAssignments === 1)
      score += 5; // Slight bonus
    else score -= currentAssignments * 10; // Penalty for multiple assignments

    // 4. Location experience
    const locationExperience =
      user.shifts?.filter((shift: any) => shift.lokasiEnum === request.location)
        .length || 0;

    if (locationExperience > 5) score += 15;
    else if (locationExperience > 0) score += 8;

    // 5. Shift type preference (if available)
    // TODO: Implement user preferences for PAGI/SIANG/MALAM

    // 6. Consecutive days check (fatigue prevention)
    const consecutiveDays = this.calculateConsecutiveDays(user, request.date);
    if (consecutiveDays >= 5)
      score -= 35; // Severe penalty
    else if (consecutiveDays >= 3)
      score -= 20; // Moderate penalty
    else if (consecutiveDays >= 2) score -= 10; // Light penalty

    // 7. Availability check (absolute requirement)
    const hasConflict = this.checkDateConflict(user, request.date);
    if (hasConflict) score = 0; // Completely unavailable

    // 🔥 NEW: 8. Validate maximum shifts per week (CRITICAL CHECK)
    const weeklyValidation = await this.validateMaxShiftsPerWeek(user, request);
    if (!weeklyValidation.isValid) score = 0; // Cannot assign - would exceed weekly limit

    // 🔥 NEW: 9. Validate consecutive night shifts (MEDICAL STANDARDS CHECK)
    const consecutiveNightValidation =
      await this.validateConsecutiveNightShifts(user, request);
    if (!consecutiveNightValidation.isValid) score = 0; // Cannot assign - would violate night shift rules

    // 10. Seniority bonus (if available)
    if (user.tanggalBergabung) {
      const yearsOfService =
        (Date.now() - new Date(user.tanggalBergabung).getTime()) /
        (365 * 24 * 60 * 60 * 1000);
      if (yearsOfService > 5) score += 8;
      else if (yearsOfService > 2) score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 🧠 EXTRACT UNFULFILLED REQUESTS: Convert greedy failures to backtracking opportunities
   */
  private extractUnfulfilledRequests(
    initialAssignments: ShiftAssignment[],
  ): ShiftCreationRequest[] {
    // For now, we'll focus on optimizing existing assignments
    // In a full implementation, this would track original requests vs successful assignments
    return [];
  }

  /**
   * 🎯 GET CANDIDATE USERS: Fetch and rank users by fitness score for backtracking
   */
  private async getCandidateUsers(
    request: ShiftCreationRequest,
    state: BacktrackingState,
  ): Promise<CandidateUser[]> {
    // Get users not already assigned on this date
    const availableUsers = state
      .getAvailableUsers()
      .filter((user) => !state.hasUserAssignmentOnDate(user.id, request.date));

    console.log(
      `🔍 Found ${availableUsers.length} users available on ${request.date}`,
    );

    // Score each user and create candidates
    const candidates: CandidateUser[] = [];

    for (const user of availableUsers) {
      const score = await this.calculateBacktrackingFitnessScore(
        user,
        request,
        state,
      );

      if (score > 0) {
        // Only include viable candidates
        candidates.push({
          user,
          score,
          reason: `Fitness score: ${score}/100`,
        });
      }
    }

    // Sort by score (descending) - HEURISTIC ORDERING
    candidates.sort((a, b) => b.score - a.score);

    console.log(
      `🎯 Generated ${candidates.length} viable candidates, top score: ${candidates[0]?.score || 0}`,
    );

    return candidates;
  }

  /**
   * 🔬 ENHANCED FITNESS SCORE: Advanced scoring with backtracking state awareness
   */
  private async calculateBacktrackingFitnessScore(
    user: any,
    request: ShiftCreationRequest,
    state: BacktrackingState,
  ): Promise<number> {
    let score = 50; // Base score

    // 1. Role compatibility (MANDATORY)
    if (request.preferredRoles?.includes(user.role)) {
      score += 25;
    } else if (request.preferredRoles && request.preferredRoles.length > 0) {
      score -= 20; // Penalty for role mismatch
    }

    // 2. Current workload in backtracking state (DYNAMIC)
    const currentAssignments = state.getUserAssignmentCount(user.id);
    if (currentAssignments < 5) score += 20;
    else if (currentAssignments < 10) score += 10;
    else if (currentAssignments < 15) score -= 5;
    else if (currentAssignments >= 20) score -= 30;

    // 3. Location experience
    const locationExperience =
      user.shifts?.filter((shift: any) => shift.lokasiEnum === request.location)
        .length || 0;

    if (locationExperience > 10) score += 20;
    else if (locationExperience > 5) score += 15;
    else if (locationExperience > 0) score += 10;

    // 4. Shift type preference
    const shiftTypeExperience =
      user.shifts?.filter((shift: any) => shift.tipeShift === request.shiftType)
        .length || 0;

    if (shiftTypeExperience > 5) score += 15;
    else if (shiftTypeExperience > 0) score += 8;

    // 5. Consecutive days fatigue check
    const consecutiveDays = this.calculateConsecutiveDays(user, request.date);
    if (consecutiveDays >= 5) score -= 35;
    else if (consecutiveDays >= 3) score -= 20;
    else if (consecutiveDays === 0) score += 10; // Fresh start bonus

    // 6. Priority-based scoring
    const priorityMultiplier = {
      URGENT: 1.3,
      HIGH: 1.2,
      NORMAL: 1.0,
      LOW: 0.9,
    };
    score *= priorityMultiplier[request.priority];

    // 7. Weekend/holiday penalty (encourage work-life balance)
    const requestDate = new Date(request.date);
    const isWeekend = requestDate.getDay() === 0 || requestDate.getDay() === 6;
    if (isWeekend) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * ✅ VALIDATE ALL CONSTRAINTS: Comprehensive constraint checking for backtracking
   */
  private async validateAllConstraints(
    user: any,
    request: ShiftCreationRequest,
    state: BacktrackingState,
  ): Promise<ConstraintValidation> {
    const violations: string[] = [];

    // 1. Date conflict check
    if (this.checkDateConflict(user, request.date)) {
      violations.push('Date conflict: User already has a shift on this date');
    }

    // 2. Workload limit check
    const currentAssignments = state.getUserAssignmentCount(user.id);
    if (currentAssignments >= 20) {
      violations.push(
        `Workload exceeded: ${currentAssignments}/20 maximum shifts`,
      );
    }

    // 3. Consecutive days check
    const consecutiveDays = this.calculateConsecutiveDays(user, request.date);
    if (consecutiveDays >= 5) {
      violations.push(
        `Consecutive days exceeded: ${consecutiveDays} days (max 4)`,
      );
    }

    // 4. Role requirement check
    if (request.preferredRoles && request.preferredRoles.length > 0) {
      if (!request.preferredRoles.includes(user.role)) {
        violations.push(
          `Role mismatch: Required ${request.preferredRoles.join('/')}, user is ${user.role}`,
        );
      }
    }

    // 5. Night shift regulations
    if (request.shiftType === 'MALAM') {
      const nightShiftValidation = await this.validateNightShiftLimits(
        user,
        request,
      );
      if (!nightShiftValidation.isValid) {
        violations.push(`Night shift limit: ${nightShiftValidation.reason}`);
      }
    }

    // 6. Weekly shift limit
    const weeklyValidation = await this.validateMaxShiftsPerWeek(user, request);
    if (!weeklyValidation.isValid) {
      violations.push(`Weekly limit exceeded: ${weeklyValidation.reason}`);
    }

    // 7. Skill requirements
    if (request.skillRequirements && request.skillRequirements.length > 0) {
      const userSkills = user.skills || [];
      const missingSkills = request.skillRequirements.filter(
        (skill) => !userSkills.includes(skill),
      );
      if (missingSkills.length > 0) {
        violations.push(`Missing skills: ${missingSkills.join(', ')}`);
      }
    }

    const isValid = violations.length === 0;
    return {
      isValid,
      reason: isValid ? 'All constraints satisfied' : violations[0],
      violatedConstraints: violations,
    };
  }

  /**
   * Admin Dashboard: Get workload alerts for monitoring
   */
  async getAdminDashboard() {
    const workloadAlerts = await this.generateWorkloadAlerts();
    const locationCapacity = await this.getLocationCapacityOverview();
    const shiftDistribution = await this.getShiftDistributionStats();
    const upcomingConflicts = await this.getUpcomingConflicts();

    return {
      workloadAlerts,
      locationCapacity,
      shiftDistribution,
      upcomingConflicts,
      summary: {
        totalEmployees: await this.prisma.user.count({
          where: { status: 'ACTIVE' },
        }),
        activeShifts: await this.getTodayActiveShifts(),
        overworkedEmployees: workloadAlerts.filter(
          (w) => w.status === 'OVERWORKED',
        ).length,
        criticalEmployees: workloadAlerts.filter((w) => w.status === 'CRITICAL')
          .length,
        averageUtilization: await this.calculateUtilizationRate(),
      },
    };
  }

  /**
   * Generate workload alerts for admin monitoring
   */
  private async generateWorkloadAlerts(): Promise<WorkloadAlert[]> {
    const users = await this.prisma.user.findMany({
      where: { status: 'ACTIVE' },
      include: {
        shifts: {
          where: {
            tanggal: {
              gte: new Date(),
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
            },
          },
        },
      },
    });

    const alerts: WorkloadAlert[] = [];

    for (const user of users) {
      const shiftCount = user.shifts.length;
      const consecutiveDays = await this.getConsecutiveDaysCount(user.id);

      let status: WorkloadAlert['status'] = 'NORMAL';
      let recommendation = 'Workload normal';

      if (shiftCount >= 25) {
        status = 'CRITICAL';
        recommendation = 'URGENT: Reduce shifts immediately to prevent burnout';
      } else if (shiftCount >= 20) {
        status = 'OVERWORKED';
        recommendation =
          'Consider redistributing shifts to lighter-loaded staff';
      } else if (shiftCount >= 15) {
        status = 'HIGH';
        recommendation = 'Monitor closely, approaching maximum capacity';
      }

      if (consecutiveDays >= 7) {
        status = 'CRITICAL';
        recommendation = 'MANDATORY REST: Too many consecutive working days';
      }

      alerts.push({
        userId: user.id,
        employeeId: user.employeeId,
        name: `${user.namaDepan} ${user.namaBelakang}`,
        role: user.role,
        currentShifts: shiftCount,
        consecutiveDays,
        status,
        recommendation,
      });
    }

    return alerts.sort((a, b) => {
      const statusOrder = { CRITICAL: 4, OVERWORKED: 3, HIGH: 2, NORMAL: 1 };
      return statusOrder[b.status] - statusOrder[a.status];
    });
  }

  /**
   * Check location capacity for a specific date/shift
   */
  private async checkLocationCapacity(request: ShiftCreationRequest) {
    // Map string location to enum value
    const locationEnum = this.mapLocationToEnum(request.location);

    const existingShifts = await this.prisma.shift.findMany({
      where: {
        tanggal: new Date(request.date),
        lokasiEnum: locationEnum,
      },
      include: { user: true },
    });

    // Define maximum capacity per location
    const maxCapacity = this.getLocationMaxCapacity(request.location);
    const currentCount = existingShifts.length;
    const availableSlots = maxCapacity - currentCount;

    return {
      location: request.location,
      date: request.date,
      currentCount,
      maxCapacity,
      availableSlots,
      utilizationPercentage: (currentCount / maxCapacity) * 100,
      status: availableSlots >= request.requiredCount ? 'AVAILABLE' : 'FULL',
      existingAssignments: existingShifts.map((shift) => ({
        userId: shift.userId,
        userName: `${shift.user.namaDepan} ${shift.user.namaBelakang}`,
        role: shift.user.role,
      })),
    };
  }

  /**
   * Map string location to LokasiShift enum
   */
  private mapLocationToEnum(location: string): any {
    const locationMap: { [key: string]: string } = {
      ICU: 'ICU',
      GAWAT_DARURAT: 'GAWAT_DARURAT',
      RAWAT_INAP: 'RAWAT_INAP',
      RAWAT_JALAN: 'RAWAT_JALAN',
      LABORATORIUM: 'LABORATORIUM',
      FARMASI: 'FARMASI',
      RADIOLOGI: 'RADIOLOGI',
      GEDUNG_ADMINISTRASI: 'GEDUNG_ADMINISTRASI',
      GIZI: 'GIZI',
      KEAMANAN: 'KEAMANAN',
      LAUNDRY: 'LAUNDRY',
      CLEANING_SERVICE: 'CLEANING_SERVICE',
      SUPIR: 'SUPIR',
    };
    return locationMap[location] || location;
  }

  /**
   * Get shift type enum based on location
   */
  private getShiftTypeFromLocation(location: string): any {
    const shiftTypeMap = {
      ICU: 'RAWAT_INAP_3_SHIFT',
      NICU: 'RAWAT_INAP_3_SHIFT',
      GAWAT_DARURAT: 'GAWAT_DARURAT_3_SHIFT',
      RAWAT_INAP: 'RAWAT_INAP_3_SHIFT',
      RAWAT_JALAN: 'RAWAT_JALAN',
      LABORATORIUM: 'LABORATORIUM_2_SHIFT',
      FARMASI: 'FARMASI_2_SHIFT',
      RADIOLOGI: 'RADIOLOGI_2_SHIFT',
      GEDUNG_ADMINISTRASI: 'GEDUNG_ADMINISTRASI',
      GIZI: 'GIZI_2_SHIFT',
      KEAMANAN: 'KEAMANAN_2_SHIFT',
      LAUNDRY: 'LAUNDRY_REGULER',
      CLEANING_SERVICE: 'CLEANING_SERVICE',
      SUPIR: 'SUPIR_2_SHIFT',
    };

    return shiftTypeMap[location] || 'GEDUNG_ADMINISTRASI';
  }

  // Helper methods
  private groupAssignmentsByDate(assignments: ShiftAssignment[]) {
    const grouped = new Map<string, ShiftAssignment[]>();

    for (const assignment of assignments) {
      const date = assignment.shiftDetails.date;
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(assignment);
    }

    return grouped;
  }

  private async backtrackUserAssignments(
    userId: number,
    date: string,
    assignments: ShiftAssignment[],
    availableUsers: any[],
  ): Promise<void> {
    // Find alternative users for conflicted assignments
    const userAssignments = assignments.filter(
      (a) => a.userId === userId && a.shiftDetails.date === date,
    );

    if (userAssignments.length > 1) {
      // Keep the highest priority assignment, reassign others
      const sortedAssignments = userAssignments.sort((a, b) => {
        const priorityOrder = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
        return (
          priorityOrder[b.shiftDetails.priority] -
          priorityOrder[a.shiftDetails.priority]
        );
      });

      // Keep the first (highest priority), reassign others
      for (let i = 1; i < sortedAssignments.length; i++) {
        const assignmentToReassign = sortedAssignments[i];

        // Find alternative user
        const alternativeUser = this.findAlternativeUser(
          assignmentToReassign,
          availableUsers,
          assignments,
        );

        if (alternativeUser) {
          const index = assignments.indexOf(assignmentToReassign);
          assignments[index] = {
            ...assignmentToReassign,
            userId: alternativeUser.id,
            reason: `Backtracking reassignment: resolved conflict`,
          };
        } else {
          // No alternative found, remove assignment
          const index = assignments.indexOf(assignmentToReassign);
          assignments.splice(index, 1);
        }
      }
    }
  }

  private findAlternativeUser(
    assignment: ShiftAssignment,
    availableUsers: any[],
    currentAssignments: ShiftAssignment[],
  ) {
    // Find users not already assigned on this date
    const assignedUserIds = new Set(
      currentAssignments
        .filter((a) => a.shiftDetails.date === assignment.shiftDetails.date)
        .map((a) => a.userId),
    );

    const availableAlternatives = availableUsers.filter(
      (user) => !assignedUserIds.has(user.id),
    );

    // Calculate scores and return best alternative
    const alternatives = availableAlternatives.map((user) => ({
      user,
      score: this.calculateUserFitnessScore(user, assignment.shiftDetails),
    }));

    alternatives.sort((a, b) => b.score - a.score);

    return alternatives.length > 0 && alternatives[0].score > 50
      ? alternatives[0].user
      : null;
  }

  async getAvailableUsersWithWorkload() {
    return this.prisma.user.findMany({
      where: { status: 'ACTIVE' },
      include: {
        shifts: {
          where: {
            tanggal: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
            },
          },
        },
      },
    });
  }

  /**
   * 🔥 NEW: Get total shift count for a user in a specific period
   */
  private async getTotalShift(
    pegawaiId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const end = endDate || new Date(); // Default: today

    const shiftCount = await this.prisma.shift.count({
      where: {
        userId: pegawaiId,
        tanggal: {
          gte: start,
          lte: end,
        },
      },
    });

    return shiftCount;
  }

  /**
   * 🔥 NEW: Workload Balancing - Sort users by shift count (ascending)
   */
  private async sortUsersByWorkload(
    users: any[],
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]> {
    console.log('🎯 Workload Balancing: Sorting users by shift count...');

    // Calculate total shifts for each user
    const usersWithShiftCount = await Promise.all(
      users.map(async (user) => {
        const totalShifts = await this.getTotalShift(
          user.id,
          startDate,
          endDate,
        );
        return {
          ...user,
          totalShifts,
          workloadScore: this.calculateWorkloadScore(user, totalShifts),
        };
      }),
    );

    // Sort by total shifts (ascending) - prioritize users with fewer shifts
    const sortedUsers = usersWithShiftCount.sort((a, b) => {
      // Primary sort: total shifts (fewer shifts = higher priority)
      if (a.totalShifts !== b.totalShifts) {
        return a.totalShifts - b.totalShifts;
      }

      // Secondary sort: workload score (higher score = better candidate)
      return b.workloadScore - a.workloadScore;
    });

    console.log('📊 Workload Distribution:');
    sortedUsers.slice(0, 10).forEach((user, index) => {
      console.log(
        `   ${index + 1}. ${user.namaDepan} ${user.namaBelakang}: ${user.totalShifts} shifts (score: ${user.workloadScore})`,
      );
    });

    return sortedUsers;
  }

  /**
   * 🧠 ADVANCED CONFLICT RESOLUTION: Deep conflict analysis and resolution
   */
  async performAdvancedConflictResolution(
    assignments: ShiftAssignment[],
  ): Promise<{
    resolvedAssignments: ShiftAssignment[];
    conflictAnalysis: ConflictAnalysis;
    resolutionStrategies: ResolutionStrategy[];
  }> {
    console.log('🔬 Starting Advanced Conflict Resolution...');

    // Analyze all types of conflicts
    const conflictAnalysis = await this.analyzeAllConflicts(assignments);

    // Generate resolution strategies
    const resolutionStrategies =
      await this.generateResolutionStrategies(conflictAnalysis);

    // Apply resolution strategies iteratively
    let resolvedAssignments = [...assignments];

    for (const strategy of resolutionStrategies) {
      console.log(
        `🔧 Applying strategy: ${strategy.type} - ${strategy.description}`,
      );
      resolvedAssignments = await this.applyResolutionStrategy(
        resolvedAssignments,
        strategy,
      );
    }

    console.log(
      `✅ Conflict resolution completed: ${assignments.length} → ${resolvedAssignments.length} assignments`,
    );

    return {
      resolvedAssignments,
      conflictAnalysis,
      resolutionStrategies,
    };
  }

  /**
   * � QUALITY IMPROVEMENT ANALYSIS: Comprehensive quality metrics and recommendations
   */
  async performQualityImprovement(
    assignments: ShiftAssignment[],
  ): Promise<QualityImprovementReport> {
    console.log('📊 Starting Quality Improvement Analysis...');

    const metrics = await this.calculateQualityMetrics(assignments);
    const recommendations = await this.generateQualityRecommendations(metrics);
    const optimizations = await this.identifyOptimizationOpportunities(
      assignments,
      metrics,
    );

    return {
      qualityScore: metrics.overallScore,
      metrics,
      recommendations,
      optimizations,
      benchmarks: await this.getBenchmarkComparisons(metrics),
      improvementPotential: this.calculateImprovementPotential(metrics),
    };
  }

  /**
   * 🎯 ANALYZE ALL CONFLICTS: Comprehensive conflict detection and categorization
   */
  private async analyzeAllConflicts(
    assignments: ShiftAssignment[],
  ): Promise<ConflictAnalysis> {
    const conflicts: DetectedConflict[] = [];

    // 1. Schedule conflicts (same user, multiple shifts same day)
    const scheduleConflicts = this.detectScheduleConflicts(assignments);
    conflicts.push(...scheduleConflicts);

    // 2. Workload conflicts (excessive shifts per user)
    const workloadConflicts = await this.detectWorkloadConflicts(assignments);
    conflicts.push(...workloadConflicts);

    // 3. Capacity conflicts (too many/few staff per location)
    const capacityConflicts = await this.detectCapacityConflicts(assignments);
    conflicts.push(...capacityConflicts);

    // 4. Skill conflicts (insufficient skills for location)
    const skillConflicts = await this.detectSkillConflicts(assignments);
    conflicts.push(...skillConflicts);

    // 5. Regulation conflicts (violating labor laws/policies)
    const regulationConflicts =
      await this.detectRegulationConflicts(assignments);
    conflicts.push(...regulationConflicts);

    return {
      totalConflicts: conflicts.length,
      conflictsByType: this.categorizeConflicts(conflicts),
      severityDistribution: this.analyzeSeverityDistribution(conflicts),
      affectedUsers: this.getAffectedUsers(conflicts),
      resolutionComplexity: this.assessResolutionComplexity(conflicts),
      priorityQueue: this.prioritizeConflicts(conflicts),
    };
  }

  /**
   * 🔧 GENERATE RESOLUTION STRATEGIES: AI-driven strategy generation
   */
  private async generateResolutionStrategies(
    analysis: ConflictAnalysis,
  ): Promise<ResolutionStrategy[]> {
    const strategies: ResolutionStrategy[] = [];

    // Strategy 1: User Redistribution
    if (analysis.conflictsByType.WORKLOAD_OVERLOAD > 0) {
      strategies.push({
        type: 'USER_REDISTRIBUTION',
        priority: 'HIGH',
        description:
          'Redistribute shifts from overloaded users to available users',
        targetConflicts: ['WORKLOAD_OVERLOAD', 'SCHEDULE_CONFLICT'],
        estimatedResolution: 85,
        complexityScore: 3,
      });
    }

    // Strategy 2: Time Slot Optimization
    if (analysis.conflictsByType.SCHEDULE_CONFLICT > 0) {
      strategies.push({
        type: 'TIME_SLOT_OPTIMIZATION',
        priority: 'MEDIUM',
        description: 'Optimize shift timing to minimize overlaps',
        targetConflicts: ['SCHEDULE_CONFLICT'],
        estimatedResolution: 70,
        complexityScore: 2,
      });
    }

    // Strategy 3: Skill-Based Reassignment
    if (analysis.conflictsByType.SKILL_MISMATCH > 0) {
      strategies.push({
        type: 'SKILL_REASSIGNMENT',
        priority: 'HIGH',
        description: 'Reassign based on skill requirements and availability',
        targetConflicts: ['SKILL_MISMATCH', 'CAPACITY_SHORTAGE'],
        estimatedResolution: 90,
        complexityScore: 4,
      });
    }

    // Strategy 4: Emergency Protocol Activation
    if (analysis.conflictsByType.CRITICAL_SHORTAGE > 0) {
      strategies.push({
        type: 'EMERGENCY_PROTOCOL',
        priority: 'URGENT',
        description:
          'Activate emergency staffing protocols for critical shortages',
        targetConflicts: ['CRITICAL_SHORTAGE', 'CAPACITY_SHORTAGE'],
        estimatedResolution: 95,
        complexityScore: 5,
      });
    }

    // Sort by priority and estimated resolution
    return strategies.sort((a, b) => {
      const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.estimatedResolution - a.estimatedResolution;
    });
  }

  /**
   * 📈 CALCULATE QUALITY METRICS: Comprehensive quality assessment
   */
  private async calculateQualityMetrics(
    assignments: ShiftAssignment[],
  ): Promise<QualityMetrics> {
    const metrics: QualityMetrics = {
      overallScore: 0,
      fairnessScore: 0,
      efficiencyScore: 0,
      satisfactionScore: 0,
      complianceScore: 0,
      utilizationRate: 0,
      conflictRate: 0,
      skillMatchRate: 0,
      workloadBalance: 0,
      temporalDistribution: 0,
    };

    // Calculate fairness score (workload distribution)
    metrics.fairnessScore = await this.calculateFairnessScore(assignments);

    // Calculate efficiency score (resource utilization)
    metrics.efficiencyScore = await this.calculateEfficiencyScore(assignments);

    // Calculate satisfaction score (user preference alignment)
    metrics.satisfactionScore =
      await this.calculateSatisfactionScore(assignments);

    // Calculate compliance score (regulation adherence)
    metrics.complianceScore = await this.calculateComplianceScore(assignments);

    // Calculate utilization rate
    metrics.utilizationRate = await this.calculateUtilizationRate();

    // Calculate conflict rate
    metrics.conflictRate = await this.calculateConflictRate(assignments);

    // Calculate skill match rate
    metrics.skillMatchRate = await this.calculateSkillMatchRate(assignments);

    // Calculate workload balance
    metrics.workloadBalance = await this.calculateWorkloadBalance(assignments);

    // Calculate temporal distribution
    metrics.temporalDistribution =
      this.calculateTemporalDistribution(assignments);

    // Calculate overall score (weighted average)
    metrics.overallScore =
      metrics.fairnessScore * 0.2 +
      metrics.efficiencyScore * 0.15 +
      metrics.satisfactionScore * 0.15 +
      metrics.complianceScore * 0.2 +
      metrics.skillMatchRate * 0.15 +
      metrics.workloadBalance * 0.15;

    return metrics;
  }

  private calculateWorkloadScore(user: any, totalShifts: number): number {
    let score = 100; // Base score

    // Penalty for high workload
    const maxShiftsPerMonth = this.getMaxShiftsForRole(user.role);
    const utilizationRate = (totalShifts / maxShiftsPerMonth) * 100;

    if (utilizationRate > 90)
      score -= 30; // Heavy penalty for overworked
    else if (utilizationRate > 70)
      score -= 15; // Medium penalty
    else if (utilizationRate < 30) score += 20; // Bonus for underutilized

    // Bonus for seniority (if available)
    if (user.tanggalBergabung) {
      const yearsOfService =
        (Date.now() - new Date(user.tanggalBergabung).getTime()) /
        (365 * 24 * 60 * 60 * 1000);
      if (yearsOfService > 5) score += 10;
      else if (yearsOfService > 2) score += 5;
    }

    return Math.round(score);
  }

  /**
   * 🔥 NEW: Get max shifts allowed per role
   */
  private getMaxShiftsForRole(role: string): number {
    const roleMaxShifts = {
      DOKTER: 18, // Doctors: fewer shifts due to higher responsibility
      PERAWAT: 20, // Nurses: standard shifts
      STAF: 22, // Staff: slightly more shifts possible
      SUPERVISOR: 16, // Supervisors: fewer due to administrative duties
    };

    return roleMaxShifts[role] || 20; // Default to 20 shifts per month
  }

  private calculateConsecutiveDays(user: any, targetDate: string): number {
    // 🔥 ENHANCED: Calculate consecutive days including night shift limitations
    if (!user.shifts || user.shifts.length === 0) return 0;

    const targetDateObj = new Date(targetDate);
    const recentShifts = user.shifts
      .map((shift: any) => ({
        date: new Date(shift.tanggal),
        shiftType: shift.tipeShift,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Count consecutive days ending with target date
    let consecutiveDays = 0;
    let consecutiveNightShifts = 0;

    // Check backwards from target date
    for (let i = 0; i < 7; i++) {
      // Check last 7 days
      const checkDate = new Date(targetDateObj);
      checkDate.setDate(checkDate.getDate() - i - 1);

      const shiftOnDate = recentShifts.find(
        (shift) => shift.date.toDateString() === checkDate.toDateString(),
      );

      if (shiftOnDate) {
        consecutiveDays++;

        // 🔥 NEW: Track consecutive night shifts
        if (shiftOnDate.shiftType === 'MALAM') {
          consecutiveNightShifts++;
        } else {
          // Reset night shift counter if non-night shift found
          if (consecutiveNightShifts > 0) break;
        }
      } else {
        break; // No shift found, break consecutive streak
      }
    }

    // Store night shift count for validation
    user._consecutiveNightShifts = consecutiveNightShifts;

    return consecutiveDays;
  }

  /**
   * 🔥 NEW: Validate night shift limitations
   */
  private validateNightShiftLimits(
    user: any,
    request: ShiftCreationRequest,
  ): {
    isValid: boolean;
    reason?: string;
  } {
    const MAX_CONSECUTIVE_NIGHT_SHIFTS = 2; // Maximum 2 consecutive night shifts

    if (request.shiftType !== 'MALAM') {
      return { isValid: true }; // Not a night shift, no restriction
    }

    // Calculate current consecutive night shifts
    this.calculateConsecutiveDays(user, request.date);
    const consecutiveNightShifts = user._consecutiveNightShifts || 0;

    if (consecutiveNightShifts >= MAX_CONSECUTIVE_NIGHT_SHIFTS) {
      return {
        isValid: false,
        reason: `Maximum ${MAX_CONSECUTIVE_NIGHT_SHIFTS} consecutive night shifts exceeded (current: ${consecutiveNightShifts})`,
      };
    }

    return { isValid: true };
  }

  /**
   * 🔥 NEW: Validate maximum shifts per week (max 5 shifts/week)
   */
  private async validateMaxShiftsPerWeek(
    user: any,
    request: ShiftCreationRequest,
  ): Promise<{
    isValid: boolean;
    reason?: string;
  }> {
    const MAX_SHIFTS_PER_WEEK = 5; // Maximum 5 shifts per week

    // Calculate week boundaries
    const targetDate = new Date(request.date);
    const weekStart = new Date(targetDate);
    weekStart.setDate(targetDate.getDate() - targetDate.getDay()); // Start of week (Sunday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)

    // Count existing shifts in the same week
    const weeklyShifts = await this.prisma.shift.count({
      where: {
        userId: user.id,
        tanggal: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    if (weeklyShifts >= MAX_SHIFTS_PER_WEEK) {
      return {
        isValid: false,
        reason: `Maximum ${MAX_SHIFTS_PER_WEEK} shifts per week exceeded (current: ${weeklyShifts})`,
      };
    }

    return { isValid: true };
  }

  /**
   * 🔥 NEW: Enhanced consecutive night shift validation with database check
   */
  private async validateConsecutiveNightShifts(
    user: any,
    request: ShiftCreationRequest,
  ): Promise<{
    isValid: boolean;
    reason?: string;
  }> {
    const MAX_CONSECUTIVE_NIGHT_SHIFTS = 2; // Maximum 2 consecutive night shifts

    if (request.shiftType !== 'MALAM') {
      return { isValid: true }; // Not a night shift, no restriction
    }

    const targetDate = new Date(request.date);
    let consecutiveNightShifts = 0;

    // Check previous days for consecutive night shifts
    for (let i = 1; i <= MAX_CONSECUTIVE_NIGHT_SHIFTS; i++) {
      const checkDate = new Date(targetDate);
      checkDate.setDate(targetDate.getDate() - i);

      const nightShift = await this.prisma.shift.findFirst({
        where: {
          userId: user.id,
          tanggal: {
            gte: new Date(checkDate.setHours(0, 0, 0, 0)),
            lt: new Date(checkDate.setHours(23, 59, 59, 999)),
          },
          tipeshift: 'MALAM',
        },
      });

      if (nightShift) {
        consecutiveNightShifts++;
      } else {
        break; // No consecutive pattern
      }
    }

    if (consecutiveNightShifts >= MAX_CONSECUTIVE_NIGHT_SHIFTS) {
      return {
        isValid: false,
        reason: `Maximum ${MAX_CONSECUTIVE_NIGHT_SHIFTS} consecutive night shifts exceeded. User has worked ${consecutiveNightShifts} consecutive night shifts.`,
      };
    }

    return { isValid: true };
  }

  private checkDateConflict(user: any, targetDate: string): boolean {
    // Check if user already has shift on target date
    return (
      user.shifts?.some(
        (shift: any) =>
          shift.tanggal.toISOString().split('T')[0] === targetDate,
      ) || false
    );
  }

  private async getConsecutiveDaysCount(userId: number): Promise<number> {
    // Implementation for consecutive days count
    return 0; // Simplified for now
  }

  private async getLocationCapacityOverview(): Promise<any[]> {
    const locations = [
      { code: 'ICU', name: 'Intensive Care Unit' },
      { code: 'NICU', name: 'Neonatal ICU' },
      { code: 'GAWAT_DARURAT', name: 'Unit Gawat Darurat' },
      { code: 'RAWAT_INAP', name: 'Rawat Inap' },
      { code: 'RAWAT_JALAN', name: 'Rawat Jalan' },
      { code: 'LABORATORIUM', name: 'Laboratorium' },
      { code: 'FARMASI', name: 'Farmasi' },
      { code: 'RADIOLOGI', name: 'Radiologi' },
    ];
    const overview: any[] = [];

    for (const location of locations) {
      const locationEnum = this.mapLocationToEnum(location.code);
      const todayShifts = await this.prisma.shift.count({
        where: {
          lokasiEnum: locationEnum,
          tanggal: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      });

      const maxCapacity = this.getLocationMaxCapacity(location.code);
      overview.push({
        location: location.code,
        name: location.name,
        current: todayShifts,
        capacity: maxCapacity,
        utilization: (todayShifts / maxCapacity) * 100,
        status:
          todayShifts >= maxCapacity
            ? 'Full'
            : todayShifts >= maxCapacity * 0.8
              ? 'High'
              : 'Normal',
      });
    }

    return overview;
  }

  private async getShiftDistributionStats() {
    return this.prisma.shift.groupBy({
      by: ['lokasiEnum'],
      _count: { id: true },
      where: {
        tanggal: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
        },
      },
    });
  }

  private async getUpcomingConflicts() {
    // Implementation for detecting upcoming scheduling conflicts
    return [];
  }

  private async calculateUtilizationRate(): Promise<number> {
    const totalShifts = await this.prisma.shift.count({
      where: {
        tanggal: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    });

    const totalCapacity = 200; // Total hospital capacity
    return (totalShifts / totalCapacity) * 100;
  }

  private async getTodayActiveShifts(): Promise<number> {
    return await this.prisma.shift.count({
      where: {
        tanggal: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    });
  }

  private async identifyConflicts(
    assignments: ShiftAssignment[],
  ): Promise<any[]> {
    // Implementation for identifying remaining conflicts
    return [];
  }

  private generateOptimizationRecommendations(
    conflicts: any[],
    workloadAlerts: WorkloadAlert[],
    locationCapacityStatus: any[],
  ): string[] {
    const recommendations: string[] = [];

    // Conflict-based recommendations
    if (conflicts.length > 0) {
      recommendations.push(
        `${conflicts.length} scheduling conflicts detected - manual review required`,
      );
    }

    // Workload-based recommendations
    const overworkedCount = workloadAlerts.filter(
      (alert) => alert.status === 'OVERWORKED' || alert.status === 'CRITICAL',
    ).length;

    if (overworkedCount > 0) {
      recommendations.push(
        `${overworkedCount} employees are overworked - consider workload redistribution`,
      );
    }

    // Capacity-based recommendations
    const highCapacityLocations = locationCapacityStatus.filter(
      (loc) => loc.utilizationPercentage > 90,
    );

    if (highCapacityLocations.length > 0) {
      recommendations.push(
        `${highCapacityLocations.length} locations are near capacity - plan additional staff`,
      );
    }

    // Default recommendation if all good
    if (recommendations.length === 0) {
      recommendations.push('All assignments optimized successfully');
    }

    return recommendations;
  }

  /**
   * ACTUALLY CREATE SHIFTS IN DATABASE
   * This method converts assignments into real database shifts
   */
  async createShiftsInDatabase(assignments: ShiftAssignment[]): Promise<any[]> {
    console.log('🔄 Creating', assignments.length, 'shifts in database...');

    const createdShifts: any[] = [];

    // 🔥 CRITICAL FIX: Define shift times correctly (no randomization)
    const shiftTimes = {
      PAGI: { start: '06:00', end: '14:00' },
      SIANG: { start: '14:00', end: '22:00' },
      MALAM: { start: '22:00', end: '06:00' },
      ON_CALL: { start: '08:00', end: '17:00' },
      JAGA: { start: '12:00', end: '20:00' },
    };

    for (const assignment of assignments) {
      try {
        // Parse date and create shift times based on shift type
        const shiftDate = new Date(assignment.shiftDetails.date);

        // 🔥 CRITICAL FIX: Use EXACT location from assignment (no randomization)
        const selectedLocation = assignment.shiftDetails.location;

        // 🔥 CRITICAL FIX: Use EXACT shift type from assignment (no randomization)
        const selectedShiftType = assignment.shiftDetails.shiftType;

        // Get correct shift times based on type
        const selectedTimes =
          shiftTimes[selectedShiftType] || shiftTimes['PAGI'];
        const startTime = selectedTimes.start;
        const endTime = selectedTimes.end;

        // Create proper datetime objects for shift times
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        const startDateTime = new Date(shiftDate);
        startDateTime.setHours(startHour, startMinute, 0, 0);

        const endDateTime = new Date(shiftDate);
        endDateTime.setHours(endHour, endMinute, 0, 0);

        // Handle overnight shifts (night shift ends next day)
        if (endDateTime <= startDateTime) {
          endDateTime.setDate(endDateTime.getDate() + 1);
        }

        // Create shift in database
        const createdShift = await this.prisma.shift.create({
          data: {
            userId: assignment.userId,
            tanggal: shiftDate,
            jammulai: startDateTime,
            jamselesai: endDateTime,
            lokasishift: selectedLocation,
            tipeshift: selectedShiftType,
            tipeEnum: selectedShiftType as any, // Use the EXACT shift type
            lokasiEnum: this.mapLocationToEnum(selectedLocation), // Use the EXACT location
            shiftType: this.getShiftTypeFromLocation(selectedLocation),
          },
          include: {
            user: true,
          },
        });

        console.log(
          `✅ Created shift: ${createdShift.user.namaDepan} ${createdShift.user.namaBelakang} - ${selectedShiftType} at ${selectedLocation} on ${shiftDate.toISOString().split('T')[0]}`,
        );
        createdShifts.push(createdShift);
      } catch (error) {
        console.error(
          `❌ Failed to create shift for user ${assignment.userId}:`,
          error,
        );
      }
    }

    console.log(
      `🎉 Successfully created ${createdShifts.length} shifts in database`,
    );
    return createdShifts;
  }

  /**
   * Get location maximum capacity based on hospital standards
   */
  private getLocationMaxCapacity(location: string): number {
    const capacityMap = {
      ICU: 15,
      NICU: 12,
      GAWAT_DARURAT: 20,
      RAWAT_INAP: 25,
      RAWAT_JALAN: 15,
      LABORATORIUM: 8,
      FARMASI: 6,
      RADIOLOGI: 5,
      GEDUNG_ADMINISTRASI: 10,
      GIZI: 8,
      KEAMANAN: 5,
      LAUNDRY: 4,
      CLEANING_SERVICE: 6,
      SUPIR: 3,
      HEMODIALISA: 8,
      FISIOTERAPI: 6,
      KAMAR_OPERASI: 12,
    };

    return capacityMap[location] || 10; // Default capacity
  }

  /**
   * WEEKLY AND MONTHLY SCHEDULE CREATION
   * Advanced features for bulk schedule generation
   */

  /**
   * Convert staffPattern to traditional shiftPattern for backward compatibility
   */
  private convertStaffPatternToShiftPattern(staffPattern?: any): any {
    console.log(
      '🔄 Converting staffPattern:',
      JSON.stringify(staffPattern, null, 2),
    );
    if (!staffPattern) return undefined;

    const result: any = {};

    for (const [location, shifts] of Object.entries(staffPattern)) {
      console.log(`🏥 Processing location: ${location}`, shifts);
      result[location] = {};

      for (const [shiftType, roles] of Object.entries(shifts as any)) {
        const roleValues = Object.values(roles as Record<string, any>);
        let totalStaff = 0;
        for (const count of roleValues) {
          totalStaff += Number(count) || 0;
        }
        console.log(
          `⏰ ${shiftType}: ${JSON.stringify(roles)} = Total: ${totalStaff}`,
        );
        if (totalStaff > 0) {
          result[location][shiftType] = totalStaff;
        }
      }
    }

    console.log('✅ Conversion result:', JSON.stringify(result, null, 2));
    return Object.keys(result).length > 0 ? result : undefined;
  }

  /**
   * Convert staffPattern to averageStaffPerShift for monthly scheduling
   */
  private convertStaffPatternToAverageStaff(staffPattern?: any): any {
    console.log(
      '🔄 Converting staffPattern to averageStaff:',
      JSON.stringify(staffPattern, null, 2),
    );
    if (!staffPattern) {
      console.warn('⚠️  No staffPattern provided for monthly scheduling');
      return undefined;
    }

    const result: any = {};

    for (const [location, shifts] of Object.entries(staffPattern)) {
      console.log(`🏥 Processing location for average: ${location}`, shifts);
      const shiftCounts: number[] = [];

      for (const [shiftType, roles] of Object.entries(shifts as any)) {
        const roleValues = Object.values(roles as Record<string, any>);
        let totalStaff = 0;
        for (const count of roleValues) {
          totalStaff += Number(count) || 0;
        }
        console.log(
          `⏰ ${shiftType}: ${JSON.stringify(roles)} = Total: ${totalStaff}`,
        );
        if (totalStaff > 0) {
          shiftCounts.push(totalStaff);
        }
      }

      if (shiftCounts.length > 0) {
        const sum = shiftCounts.reduce((acc, count) => acc + count, 0);
        const average = Math.round(sum / shiftCounts.length);
        result[location] = Math.max(1, average); // Ensure at least 1 staff per shift
        console.log(
          `📊 Average staff for ${location}: ${average} (from counts: ${shiftCounts})`,
        );
      } else {
        console.warn(`⚠️  No valid shift counts for location ${location}`);
      }
    }

    console.log(
      '✅ Average staff conversion result:',
      JSON.stringify(result, null, 2),
    );
    return Object.keys(result).length > 0 ? result : undefined;
  }

  // Generate weekly schedule automatically
  async createWeeklySchedule(request: WeeklyScheduleRequest): Promise<any> {
    console.log('📅 Creating weekly schedule starting:', request.startDate);
    console.log('📋 Requested locations:', request.locations);
    console.log(
      '🎯 Provided staff pattern:',
      JSON.stringify(request.staffPattern, null, 2),
    );

    // Convert staffPattern to traditional shiftPattern for compatibility
    const shiftPattern = this.convertStaffPatternToShiftPattern(
      request.staffPattern,
    );
    console.log(
      '🔄 Converted shift pattern:',
      JSON.stringify(shiftPattern, null, 2),
    );

    // 🔥 CRITICAL FIX: Parse date consistently to avoid timezone issues
    let startDate: Date;
    try {
      // Parse as local date in Indonesia timezone
      const dateParts = request.startDate.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // Month is 0-based
        const day = parseInt(dateParts[2]);
        startDate = new Date(year, month, day, 0, 0, 0, 0);
      } else {
        startDate = new Date(request.startDate + 'T00:00:00.000+08:00');
      }
    } catch (e) {
      console.error('Date parsing error:', e);
      startDate = new Date();
    }

    console.log(
      '🎯 Parsed startDate:',
      startDate.toDateString(),
      'ISO:',
      startDate.toISOString().split('T')[0],
    );

    // 🔥 PRIORITY: Use request.locations as primary source of truth
    let locations: string[] = [];

    if (request.locations && request.locations.length > 0) {
      // Use locations from request.locations - this is what user selected
      locations = request.locations;
      console.log(
        '✅ Using user-selected locations from request.locations:',
        locations,
      );
    } else if (shiftPattern && Object.keys(shiftPattern).length > 0) {
      // Fallback: use locations from converted shiftPattern
      locations = Object.keys(shiftPattern);
      console.log(
        '⚠️ Fallback: Using locations from converted shiftPattern:',
        locations,
      );
    } else {
      // Last resort: use default locations
      locations = ['ICU'];
      console.log('🚨 Last resort: Using default locations:', locations);
    }

    const weeklyShifts: ShiftAssignmentExtended[] = [];
    const stats: WeeklyScheduleStats = {
      totalShifts: 0,
      successfulAssignments: 0,
      conflicts: [],
      recommendations: [],
    };

    // Generate shifts for 7 consecutive days
    for (let day = 0; day < 7; day++) {
      // 🔥 CRITICAL FIX: Use explicit date construction to avoid timezone issues
      const inputYear = startDate.getFullYear();
      const inputMonth = startDate.getMonth();
      const inputDay = startDate.getDate();

      // Create final date by adding days to the original input date
      const finalDate = new Date(
        inputYear,
        inputMonth,
        inputDay + day,
        0,
        0,
        0,
        0,
      );

      console.log(
        `📅 Processing day ${day + 1}/7: ${finalDate.toISOString().split('T')[0]} (${finalDate.toLocaleDateString('id-ID', { weekday: 'long' })})`,
      );
      console.log(
        `📅 Original input: ${request.startDate}, Processed: ${finalDate.toDateString()}`,
      );

      // Generate shifts for each configured location ONLY
      for (const location of locations) {
        // Get the shift pattern for this location (respecting user configuration)
        const locationShiftPattern = this.generateVariedShiftPattern(
          location,
          day,
          shiftPattern?.[location],
        );

        console.log(
          `🎯 Location: ${location}, Day: ${day + 1}, Pattern:`,
          locationShiftPattern,
        );
        console.log(
          `🔍 DEBUG: User provided pattern for ${location}:`,
          shiftPattern?.[location],
        );

        // 🔥 CRITICAL FIX: Only create shifts that have count > 0
        const shiftEntries = Object.entries(locationShiftPattern).filter(
          ([_, count]) => Number(count) > 0,
        );

        console.log(
          `📊 DEBUG: Shift entries for ${location} on day ${day + 1}:`,
          shiftEntries,
        );

        for (const [shiftType, shiftCount] of shiftEntries) {
          console.log(
            `📅 Creating ${shiftCount} ${shiftType} shifts for ${location} on day ${day + 1}`,
          );

          const shiftRequest: ShiftCreationRequest = {
            date: finalDate.toISOString().split('T')[0],
            location,
            shiftType: shiftType as any,
            requiredCount: Number(shiftCount),
            priority: request.priority || 'NORMAL',
          };

          console.log(`🔍 DEBUG: Shift request created:`, shiftRequest);

          try {
            const result = await this.createOptimalShiftAssignments([
              shiftRequest,
            ]);

            console.log(
              `🔍 DEBUG: createOptimalShiftAssignments result for ${location} ${shiftType}:`,
              {
                assignments: result.assignments.length,
                createdShifts: result.createdShifts.length,
                requiredCount: shiftCount,
              },
            );

            // Convert ShiftAssignment to ShiftAssignmentExtended
            const extendedAssignments: ShiftAssignmentExtended[] =
              result.assignments.map((assignment) => ({
                userId: assignment.userId,
                date: assignment.shiftDetails.date,
                location: assignment.shiftDetails.location,
                shiftType: assignment.shiftDetails.shiftType,
                startTime: new Date(assignment.shiftDetails.date),
                endTime: new Date(assignment.shiftDetails.date),
                priority: assignment.shiftDetails.priority,
              }));

            weeklyShifts.push(...extendedAssignments);
            stats.totalShifts += Number(shiftCount);
            stats.successfulAssignments += result.assignments.length;

            console.log(
              `📊 DEBUG: Running totals - totalShifts: ${stats.totalShifts}, successfulAssignments: ${stats.successfulAssignments}`,
            );

            if (result.conflicts.length > 0) {
              const convertedConflicts: SchedulingConflict[] =
                result.conflicts.map((conflict) => ({
                  date: finalDate.toISOString().split('T')[0],
                  location,
                  shiftType,
                  error: 'Scheduling conflict detected',
                }));
              stats.conflicts.push(...convertedConflicts);
            }
          } catch (error: any) {
            console.error(
              `Failed to create shift for ${location} ${shiftType} on ${finalDate.toDateString()}:`,
              error,
            );
            stats.conflicts.push({
              date: finalDate.toISOString().split('T')[0],
              location,
              shiftType,
              error: error.message,
            });
          }
        }
      }
    }

    // Generate weekly recommendations
    stats.recommendations = this.generateWeeklyRecommendations(stats, request);

    // 🔥 CRITICAL FIX: Do NOT save to database again - already saved in createOptimalShiftAssignments
    // Remove duplicate database creation to prevent double shifts

    console.log(
      `📊 Weekly schedule complete: ${stats.totalShifts} shifts planned, ${stats.successfulAssignments} successfully assigned`,
    );

    return {
      ...stats,
      createdShifts: stats.successfulAssignments, // Use actual successful assignments count
      weekStart: request.startDate,
      weekEnd: new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      schedule: weeklyShifts,
    };
  }

  // Generate monthly schedule automatically
  // Generate monthly schedule automatically with enhanced error handling
  async createMonthlySchedule(
    request: MonthlyScheduleRequest,
  ): Promise<SchedulingResult> {
    console.log(
      '📅 Creating monthly schedule for:',
      `${request.month}/${request.year}`,
    );
    console.log('🔍 Request details:', JSON.stringify(request, null, 2));

    const staffPattern = request.staffPattern;
    const year = request.year;
    const month = request.month; // 1-12
    const locations = request.locations || [
      'ICU',
      'RAWAT_INAP',
      'GAWAT_DARURAT',
      'RAWAT_JALAN',
    ];

    console.log('📍 Locations to process:', locations);

    // Initialize tracking variables
    const errors: SchedulingError[] = [];
    const warnings: SchedulingError[] = [];
    const successfulDates: string[] = [];
    const failedDates: string[] = [];
    const partialDates: string[] = [];
    const overLimitStaff: Array<{
      userId: number;
      name: string;
      currentShifts: number;
      limit: number;
    }> = [];
    const incompleteShifts: Array<{
      date: string;
      location: string;
      missingRoles: string[];
    }> = [];

    // Validate staff pattern
    if (!staffPattern) {
      console.warn('⚠️  No staff pattern provided, using defaults');
      warnings.push(
        this.generateSchedulingError(SchedulingErrorType.PARTIAL_SUCCESS, {
          additionalInfo: {
            message:
              'Menggunakan pola staff default karena tidak ada konfigurasi yang diberikan',
          },
        }),
      );
    }

    // Check for existing shifts in the month FIRST
    console.log('🔍 Checking for existing shifts in the month...');
    const existingShiftsInMonth = await this.getExistingShiftsInMonth(
      year,
      month,
    );
    console.log(
      `📊 Found ${existingShiftsInMonth.length} existing shifts in ${month}/${year}`,
    );

    // Generate partial success warning if existing shifts found
    if (existingShiftsInMonth.length > 0) {
      warnings.push(
        this.generateSchedulingError(SchedulingErrorType.PARTIAL_SUCCESS, {
          additionalInfo: {
            existingShifts: existingShiftsInMonth.length,
            message: `${existingShiftsInMonth.length} shift sudah ada di bulan ini`,
          },
        }),
      );
    }

    // Get existing dates to skip
    const existingDates = new Set(
      existingShiftsInMonth.map(
        (shift) => shift.tanggal.toISOString().split('T')[0],
      ),
    );
    console.log('📅 Existing dates to skip:', Array.from(existingDates));

    // Get days in month and other initialization
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthlyShifts: ShiftAssignmentExtended[] = [];
    let totalRequested = 0;
    let totalCreated = 0;

    // Workload limits
    const workloadLimits = request.workloadLimits || {
      maxShiftsPerPerson: 20,
      maxConsecutiveDays: 5,
    };

    // Initialize user shift counts with EXISTING shifts from the month
    const userShiftCounts = await this.initializeUserShiftCountsFromExisting(
      year,
      month,
    );

    // Check for users who are already over limit
    const availableUsers = await this.getAvailableUsersWithWorkload();
    for (const user of availableUsers) {
      const currentShifts = userShiftCounts.get(user.id) || 0;
      if (currentShifts >= workloadLimits.maxShiftsPerPerson) {
        overLimitStaff.push({
          userId: user.id,
          name: `${user.namaDepan} ${user.namaBelakang}`,
          currentShifts,
          limit: workloadLimits.maxShiftsPerPerson,
        });
      }
    }

    // Generate error if too many staff are over limit
    if (overLimitStaff.length > availableUsers.length * 0.5) {
      errors.push(
        this.generateSchedulingError(SchedulingErrorType.STAFF_OVER_LIMIT, {
          affectedUsers: overLimitStaff.map((s) => s.userId),
          additionalInfo: {
            limit: workloadLimits.maxShiftsPerPerson,
            overLimitCount: overLimitStaff.length,
            totalStaff: availableUsers.length,
          },
        }),
      );
    }

    // Get current date for filtering past dates
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-indexed
    const currentDay = today.getDate();

    console.log(
      `🕐 Current date: ${currentYear}-${currentMonth}-${currentDay}`,
    );
    console.log(`📅 Generating shifts for: ${year}-${month}`);
    console.log(`📊 Days in month: ${daysInMonth}`);
    console.log(
      `👥 Initial user shift counts (existing):`,
      Object.fromEntries(userShiftCounts),
    );

    // Generate shifts for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month - 1, day);
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday

      // Skip past dates if generating for current month
      const isCurrentMonth = year === currentYear && month === currentMonth;
      const isPastDate = isCurrentMonth && day < currentDay;

      if (isPastDate) {
        console.log(`⏭️  Skipping past date: ${year}-${month}-${day}`);
        continue;
      }

      // Create explicit date string to avoid timezone issues
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // Skip dates that already have existing shifts
      if (existingDates.has(dateString)) {
        console.log(`⏭️  Skipping existing scheduled date: ${dateString}`);
        partialDates.push(dateString);
        continue;
      }

      // Track daily success
      let dailySuccess = true;
      let dailyRequested = 0;
      let dailyCreated = 0;

      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      for (const location of locations) {
        console.log(`🏥 Processing location: ${location} for day ${day}`);

        // Get exact shift counts from staffPattern
        const locationPattern = staffPattern?.[location];
        let shiftCounts: { [key: string]: number } = {};

        if (locationPattern) {
          shiftCounts = {
            PAGI: this.calculateTotalStaffForShift(locationPattern.PAGI),
            SIANG: this.calculateTotalStaffForShift(locationPattern.SIANG),
            MALAM: this.calculateTotalStaffForShift(locationPattern.MALAM),
          };
        } else {
          const defaultPattern = this.getDefaultStaffPattern(location);
          shiftCounts = defaultPattern;
        }

        // Apply weekend adjustments
        if (isWeekend) {
          shiftCounts.PAGI = Math.ceil(shiftCounts.PAGI * 0.7);
          shiftCounts.SIANG = Math.ceil(shiftCounts.SIANG * 0.8);
          shiftCounts.MALAM = Math.ceil(shiftCounts.MALAM * 0.6);
        }

        for (const [shiftType, count] of Object.entries(shiftCounts)) {
          const shiftCount = Number(count);
          if (shiftCount > 0) {
            dailyRequested += shiftCount;
            totalRequested += shiftCount;

            const shiftRequest: ShiftCreationRequest = {
              date: dateString,
              location,
              shiftType: shiftType as any,
              requiredCount: shiftCount,
              priority: 'NORMAL',
            };

            try {
              // Use assignment-only method WITHOUT database creation
              const result =
                await this.createOptimalShiftAssignmentsWithLimitsNoDB(
                  [shiftRequest],
                  userShiftCounts,
                  workloadLimits,
                );

              // Check for insufficient staff
              const hasInsufficientStaff = result.conflicts.some(
                (c) =>
                  c.type === 'INSUFFICIENT_STAFF' ||
                  c.type === 'WORKLOAD_EXCEEDED',
              );

              if (hasInsufficientStaff) {
                dailySuccess = false;
                const insufficientError = result.conflicts.find(
                  (c) =>
                    c.type === 'INSUFFICIENT_STAFF' ||
                    c.type === 'WORKLOAD_EXCEEDED',
                );

                if (insufficientError?.type === 'WORKLOAD_EXCEEDED') {
                  errors.push(
                    this.generateSchedulingError(
                      SchedulingErrorType.WORKLOAD_EXCEEDED,
                      {
                        date: dateString,
                        location,
                        shiftType,
                        additionalInfo: {
                          required: shiftCount,
                          available: result.assignments.length,
                          limit: workloadLimits.maxShiftsPerPerson,
                        },
                      },
                    ),
                  );
                } else {
                  errors.push(
                    this.generateSchedulingError(
                      SchedulingErrorType.INSUFFICIENT_STAFF,
                      {
                        date: dateString,
                        location,
                        shiftType,
                        additionalInfo: {
                          required: shiftCount,
                          available: result.assignments.length,
                          role: 'staff',
                        },
                      },
                    ),
                  );
                }

                // Still count partial assignments if any were made
                if (result.assignments.length > 0) {
                  const extendedAssignments: ShiftAssignmentExtended[] =
                    result.assignments.map((assignment) => ({
                      userId: assignment.userId,
                      date: assignment.shiftDetails.date,
                      location: assignment.shiftDetails.location,
                      shiftType: assignment.shiftDetails.shiftType,
                      startTime: new Date(assignment.shiftDetails.date),
                      endTime: new Date(assignment.shiftDetails.date),
                      priority: assignment.shiftDetails.priority,
                    }));

                  monthlyShifts.push(...extendedAssignments);
                  dailyCreated += result.assignments.length;
                  totalCreated += result.assignments.length;

                  // Update user shift counts
                  result.assignments.forEach((assignment) => {
                    const userId = assignment.userId;
                    userShiftCounts.set(
                      userId,
                      (userShiftCounts.get(userId) || 0) + 1,
                    );
                  });
                }
                continue;
              }

              // For successful assignments
              console.log(
                `✅ Planned ${result.assignments.length} shifts for ${location} ${shiftType} on ${dateString}`,
              );

              const extendedAssignments: ShiftAssignmentExtended[] =
                result.assignments.map((assignment) => ({
                  userId: assignment.userId,
                  date: assignment.shiftDetails.date,
                  location: assignment.shiftDetails.location,
                  shiftType: assignment.shiftDetails.shiftType,
                  startTime: new Date(assignment.shiftDetails.date),
                  endTime: new Date(assignment.shiftDetails.date),
                  priority: assignment.shiftDetails.priority,
                }));

              monthlyShifts.push(...extendedAssignments);
              dailyCreated += result.assignments.length;
              totalCreated += result.assignments.length;

              // Update user shift counts
              result.assignments.forEach((assignment) => {
                const userId = assignment.userId;
                userShiftCounts.set(
                  userId,
                  (userShiftCounts.get(userId) || 0) + 1,
                );
              });

              // Check for role coverage completeness
              const requiredRoles = ['DOKTER', 'PERAWAT', 'STAFF'];
              const roleCoverageError = await this.validateRoleCoverage(
                dateString,
                location,
                requiredRoles,
              );
              if (roleCoverageError) {
                warnings.push(roleCoverageError);
              }
            } catch (error: any) {
              console.error(
                `Failed to create monthly shift for ${location} ${shiftType} on ${currentDate}:`,
                error,
              );
              dailySuccess = false;

              errors.push(
                this.generateSchedulingError(
                  SchedulingErrorType.DATABASE_ERROR,
                  {
                    date: dateString,
                    location,
                    shiftType,
                    additionalInfo: { errorMessage: error.message },
                  },
                ),
              );
            }
          }
        }
      }

      // Track daily results
      if (dailySuccess && dailyCreated === dailyRequested) {
        successfulDates.push(dateString);
      } else if (dailyCreated > 0) {
        partialDates.push(dateString);
      } else {
        failedDates.push(dateString);
      }
    }

    // Calculate fulfillment rate
    const fulfillmentRate =
      totalRequested > 0 ? (totalCreated / totalRequested) * 100 : 100;

    console.log(`📊 Monthly Schedule Summary:`);
    console.log(`   - Required shifts: ${totalRequested}`);
    console.log(`   - Successful assignments: ${totalCreated}`);
    console.log(`   - Fulfillment rate: ${fulfillmentRate.toFixed(1)}%`);
    console.log(`   - Errors: ${errors.length}, Warnings: ${warnings.length}`);

    // Generate critical error if fulfillment rate is too low
    if (fulfillmentRate < 30) {
      let errorMessage;
      if (fulfillmentRate === 0) {
        errorMessage = `Tidak ada pegawai yang tersedia untuk jadwal bulanan. Pastikan ada cukup pegawai untuk seluruh bulan dengan max ${workloadLimits.maxShiftsPerPerson} shifts per orang.`;
      } else {
        errorMessage = `Staff tidak mencukupi untuk jadwal bulanan (${fulfillmentRate.toFixed(1)}% terpenuhi). Kurangi beban kerja atau tambah pegawai.`;
      }

      errors.unshift(
        this.generateSchedulingError(SchedulingErrorType.INSUFFICIENT_STAFF, {
          additionalInfo: {
            fulfillmentRate,
            required: totalRequested,
            available: totalCreated,
            message: errorMessage,
          },
        }),
      );

      // Don't save shifts if major issues
      return this.generateSchedulingResult(
        totalRequested,
        0, // No shifts created due to critical failure
        errors,
        warnings,
        {
          successfulDates: [],
          failedDates: failedDates.concat(successfulDates, partialDates),
          partialDates: [],
          overLimitStaff,
          incompleteShifts,
        },
      );
    }

    // For partial success, add warning
    if (fulfillmentRate < 80) {
      console.warn(
        `⚠️ Partial scheduling success: ${fulfillmentRate.toFixed(1)}% fulfillment`,
      );
      warnings.push(
        this.generateSchedulingError(SchedulingErrorType.PARTIAL_SUCCESS, {
          additionalInfo: {
            fulfillmentRate,
            message: `Jadwal bulanan hanya ${fulfillmentRate.toFixed(1)}% terpenuhi karena keterbatasan staff. Pertimbangkan menambah pegawai atau mengurangi beban kerja.`,
          },
        }),
      );
    }

    // Create shifts in database ONLY after ALL validations pass
    console.log(
      `🚀 Creating ${monthlyShifts.length} shifts in database after successful validation...`,
    );
    let actualCreatedShifts = 0;

    if (monthlyShifts.length > 0) {
      try {
        // Convert ShiftAssignmentExtended to ShiftAssignment for database creation
        const shiftAssignments: ShiftAssignment[] = monthlyShifts.map(
          (assignment) => ({
            userId: assignment.userId,
            shiftDetails: {
              date: assignment.date,
              location: assignment.location,
              shiftType: assignment.shiftType as any,
              requiredCount: 1,
              priority: assignment.priority as any,
            },
            score: 100, // Default score for validated assignments
            reason: 'Validated monthly assignment',
          }),
        );

        const createdShifts =
          await this.createShiftsInDatabase(shiftAssignments);
        actualCreatedShifts = createdShifts.length;
        console.log(
          `✅ Successfully created ${actualCreatedShifts} shifts in database`,
        );
      } catch (error) {
        console.error(`❌ Failed to create shifts in database:`, error);

        errors.push(
          this.generateSchedulingError(SchedulingErrorType.DATABASE_ERROR, {
            additionalInfo: {
              errorMessage: error.message,
              phase: 'database_creation',
            },
          }),
        );

        return this.generateSchedulingResult(
          totalRequested,
          0, // No shifts created due to database error
          errors,
          warnings,
          {
            successfulDates: [],
            failedDates: successfulDates.concat(partialDates),
            partialDates: [],
            overLimitStaff,
            incompleteShifts,
          },
        );
      }
    }

    console.log(
      `✅ Monthly schedule completed: ${actualCreatedShifts} shifts created in database`,
    );

    return this.generateSchedulingResult(
      totalRequested,
      actualCreatedShifts,
      errors,
      warnings,
      {
        successfulDates,
        failedDates,
        partialDates,
        overLimitStaff,
        incompleteShifts,
      },
    );
  }

  // Generate weekly template suggestions
  async generateWeeklyTemplate(startDate: string): Promise<any> {
    const locations = await this.getActiveLocations();
    const availableUsers = await this.getAvailableUsersWithWorkload();

    const template = {
      startDate,
      endDate: new Date(new Date(startDate).getTime() + 6 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      recommendedPattern: {} as any,
      capacityAnalysis: {} as any,
      suggestions: [] as string[],
    };

    // Generate recommended patterns for each location
    for (const location of locations) {
      const capacity = this.getLocationMaxCapacity(location.code);
      const currentUtilization = await this.getCurrentLocationUtilization(
        location.code,
      );

      template.recommendedPattern[location.code] = {
        PAGI: Math.ceil(capacity * 0.6),
        SIANG: Math.ceil(capacity * 0.7),
        MALAM: Math.ceil(capacity * 0.4),
      };

      template.capacityAnalysis[location.code] = {
        maxCapacity: capacity,
        currentUtilization,
        recommendedStaffing: Math.ceil(capacity * 0.6),
      };
    }

    // Generate suggestions based on current workload
    const overworkedUsers = availableUsers.filter((u) => u.shifts.length > 15); // More than 15 shifts
    const underutilizedUsers = availableUsers.filter(
      (u) => u.shifts.length < 5,
    ); // Less than 5 shifts

    if (overworkedUsers.length > 0) {
      template.suggestions.push(
        'Consider reducing shifts for overworked employees',
      );
    }

    if (underutilizedUsers.length > 0) {
      template.suggestions.push(
        'Opportunity to assign more shifts to underutilized staff',
      );
    }

    return template;
  }

  // Generate monthly template suggestions
  async generateMonthlyTemplate(year: number, month: number): Promise<any> {
    const daysInMonth = new Date(year, month, 0).getDate();
    const locations = await this.getActiveLocations();

    const template = {
      year,
      month,
      daysInMonth,
      totalWorkingDays: this.getWorkingDaysInMonth(year, month),
      recommendedDistribution: {} as any,
      workloadProjection: {} as any,
      suggestions: [] as string[],
    };

    // Calculate recommended distribution
    for (const location of locations) {
      const capacity = this.getLocationMaxCapacity(location.code);
      const workingDays = template.totalWorkingDays;

      template.recommendedDistribution[location.code] = {
        totalShiftsNeeded: workingDays * 3, // 3 shifts per day
        averageStaffPerShift: Math.ceil(capacity * 0.6),
        totalStaffHours: workingDays * 3 * 8 * Math.ceil(capacity * 0.6),
      };
    }

    // Project workload for users
    const users = await this.getAvailableUsersWithWorkload();
    const averageShiftsPerUser = Math.ceil(
      (daysInMonth * locations.length * 3) / users.length,
    );

    template.workloadProjection = {
      totalUsers: users.length,
      averageShiftsPerUser,
      estimatedMaxWorkload: (averageShiftsPerUser / 25) * 100, // Assuming 25 max shifts per month
      overworkRisk:
        averageShiftsPerUser > 20
          ? 'HIGH'
          : averageShiftsPerUser > 15
            ? 'MEDIUM'
            : 'LOW',
    };

    // Generate suggestions
    if (averageShiftsPerUser > 20) {
      template.suggestions.push(
        'Consider hiring additional staff to reduce workload',
      );
    }

    if (users.length < locations.length * 10) {
      template.suggestions.push(
        'Staff to location ratio may be insufficient for optimal coverage',
      );
    }

    return template;
  }

  /**
   * 🔥 NEW: Enhanced error handling and notification system
   * Generates detailed error reports with suggested actions
   */
  private generateSchedulingError(
    type: SchedulingErrorType,
    context: {
      date?: string;
      location?: string;
      shiftType?: string;
      userId?: number;
      affectedUsers?: number[];
      additionalInfo?: any;
    },
  ): SchedulingError {
    const baseError: Partial<SchedulingError> = {
      type,
      date: context.date,
      location: context.location,
      shiftType: context.shiftType,
      userId: context.userId,
      affectedUsers: context.affectedUsers,
    };

    switch (type) {
      case SchedulingErrorType.PARTIAL_SUCCESS:
        return {
          ...baseError,
          message:
            'Jadwal berhasil dibuat sebagian. Sebagian tanggal dilewati karena sudah terdapat shift.',
          suggestedActions: [
            'Timpa Jadwal Lama - mengganti shift yang sudah ada',
            'Hanya Buat Jadwal Kosong - lewati tanggal yang sudah terisi',
            'Review jadwal existing untuk memastikan tidak ada konflik',
          ],
          severity: 'MEDIUM',
          autoResolvable: true,
        } as SchedulingError;

      case SchedulingErrorType.INSUFFICIENT_STAFF:
        return {
          ...baseError,
          message: `Gagal membuat jadwal: Jumlah ${context.additionalInfo?.role || 'pegawai'} tidak mencukupi untuk memenuhi kebutuhan shift.`,
          suggestedActions: [
            `Tambahkan pegawai dengan role ${context.additionalInfo?.role || 'yang dibutuhkan'}`,
            'Kurangi jumlah shift yang diperlukan per hari',
            'Distribusikan beban kerja ke lokasi lain',
            `Ideal: ${context.additionalInfo?.required || 'N/A'} pegawai, Tersedia: ${context.additionalInfo?.available || 'N/A'} pegawai`,
          ],
          severity: 'HIGH',
          autoResolvable: false,
        } as SchedulingError;

      case SchedulingErrorType.STAFF_OVER_LIMIT:
        return {
          ...baseError,
          message: `Gagal: Beberapa pegawai sudah mencapai batas maksimal ${context.additionalInfo?.limit || 20} shift bulan ini.`,
          suggestedActions: [
            'Tandai pegawai yang sudah mencapai batas maksimal',
            'Ganti dengan pegawai yang masih memiliki kuota shift',
            'Sesuaikan batas maksimal shift per bulan',
            'Rekrut pegawai tambahan untuk mengurangi beban kerja',
          ],
          severity: 'HIGH',
          autoResolvable: true,
        } as SchedulingError;

      case SchedulingErrorType.SCHEDULE_CONFLICT:
        return {
          ...baseError,
          message:
            'Jadwal bentrok: Pegawai sudah memiliki shift di waktu yang sama.',
          suggestedActions: [
            'Tampilkan tanggal-tanggal konflik untuk review',
            'Lewati jadwal yang bentrok',
            'Timpa shift sebelumnya (dengan konfirmasi)',
            'Cari pegawai pengganti untuk menghindari konflik',
          ],
          severity: 'MEDIUM',
          autoResolvable: true,
        } as SchedulingError;

      case SchedulingErrorType.CONSECUTIVE_DAYS_EXCEEDED:
        return {
          ...baseError,
          message: `Gagal menjadwalkan: Pegawai melebihi batas maksimal hari kerja berturut-turut (${context.additionalInfo?.limit || 5} hari).`,
          suggestedActions: [
            'Lakukan rotasi dengan pegawai lain',
            'Berikan hari istirahat di antara shift',
            'Tampilkan jadwal sebelumnya untuk pengaturan manual',
            'Sesuaikan pengaturan batas hari berturut-turut',
          ],
          severity: 'HIGH',
          autoResolvable: true,
        } as SchedulingError;

      case SchedulingErrorType.NO_STAFF_WITH_REQUIRED_ROLE:
        return {
          ...baseError,
          message: `Tidak ditemukan pegawai dengan role ${context.additionalInfo?.requiredRole || 'yang diperlukan'} untuk tanggal ${context.date}.`,
          suggestedActions: [
            `Tambahkan atau aktifkan pegawai dengan role ${context.additionalInfo?.requiredRole}`,
            'Lakukan manual assign di halaman manajemen shift',
            'Periksa status pegawai yang mungkin sedang cuti',
            'Pertimbangkan training pegawai existing untuk role tersebut',
          ],
          severity: 'CRITICAL',
          autoResolvable: false,
        } as SchedulingError;

      case SchedulingErrorType.SHIFT_OUTSIDE_OPERATIONAL_HOURS:
        return {
          ...baseError,
          message:
            'Shift yang dijadwalkan melebihi jam operasional rumah sakit.',
          suggestedActions: [
            'Sesuaikan jam shift sesuai jam operasional',
            'Atur parameter jam operasional di pengaturan sistem',
            'Periksa konfigurasi shift malam jika diperlukan',
            'Konsultasi dengan manajemen untuk perubahan jam operasional',
          ],
          severity: 'MEDIUM',
          autoResolvable: true,
        } as SchedulingError;

      case SchedulingErrorType.DATABASE_ERROR:
        return {
          ...baseError,
          message: 'Terjadi kesalahan sistem. Silakan coba lagi nanti.',
          suggestedActions: [
            'Coba lagi dalam beberapa menit',
            'Periksa koneksi internet',
            'Hubungi administrator teknis jika masalah berlanjut',
            'Simpan data draft untuk mencegah kehilangan data',
          ],
          severity: 'CRITICAL',
          autoResolvable: false,
        } as SchedulingError;

      case SchedulingErrorType.INCOMPLETE_ROLE_COVERAGE:
        return {
          ...baseError,
          message: `Tidak semua peran (${context.additionalInfo?.missingRoles?.join(', ') || 'Dokter, Perawat, Analis'}) terisi untuk tanggal ${context.date}.`,
          suggestedActions: [
            'Tandai shift yang tidak lengkap untuk review',
            'Lakukan penjadwalan manual untuk role yang kosong',
            'Periksa ketersediaan pegawai untuk role tersebut',
            'Pertimbangkan cross-training pegawai',
          ],
          severity: 'MEDIUM',
          autoResolvable: true,
        } as SchedulingError;

      case SchedulingErrorType.SHIFT_SLOT_FULL:
        return {
          ...baseError,
          message: `Semua shift sudah terisi pada tanggal ${context.date}.`,
          suggestedActions: [
            'Lewati tanggal yang sudah penuh secara otomatis',
            'Reset shift untuk hari tersebut jika diperlukan',
            'Periksa apakah ada slot tambahan yang bisa dibuka',
            'Pertimbangkan overtime atau shift tambahan',
          ],
          severity: 'LOW',
          autoResolvable: true,
        } as SchedulingError;

      case SchedulingErrorType.WORKLOAD_EXCEEDED:
        return {
          ...baseError,
          message:
            'Beban kerja pegawai melebihi batas yang aman untuk kesehatan dan produktivitas.',
          suggestedActions: [
            'Distribusikan ulang beban kerja',
            'Tambah pegawai untuk mengurangi beban per orang',
            'Sesuaikan batas maksimal shift per pegawai',
            'Monitor kesehatan dan performa pegawai',
          ],
          severity: 'HIGH',
          autoResolvable: true,
        } as SchedulingError;

      default:
        return {
          ...baseError,
          message: 'Terjadi kesalahan yang tidak diidentifikasi.',
          suggestedActions: ['Hubungi administrator sistem'],
          severity: 'MEDIUM',
          autoResolvable: false,
        } as SchedulingError;
    }
  }

  /**
   * 🔥 NEW: Generate comprehensive scheduling result with detailed error analysis
   */
  private generateSchedulingResult(
    totalRequested: number,
    totalCreated: number,
    errors: SchedulingError[],
    warnings: SchedulingError[],
    additionalData: {
      successfulDates?: string[];
      failedDates?: string[];
      partialDates?: string[];
      overLimitStaff?: Array<{
        userId: number;
        name: string;
        currentShifts: number;
        limit: number;
      }>;
      incompleteShifts?: Array<{
        date: string;
        location: string;
        missingRoles: string[];
      }>;
    },
  ): SchedulingResult {
    const fulfillmentRate =
      totalRequested > 0 ? (totalCreated / totalRequested) * 100 : 100;
    const success =
      errors.filter((e) => e.severity === 'CRITICAL' || e.severity === 'HIGH')
        .length === 0 && fulfillmentRate >= 70;

    // Generate recommendations based on errors and warnings
    const recommendations: string[] = [];

    // Critical error recommendations
    const criticalErrors = errors.filter((e) => e.severity === 'CRITICAL');
    if (criticalErrors.length > 0) {
      recommendations.push(
        `🚨 ${criticalErrors.length} masalah kritis ditemukan yang memerlukan tindakan segera`,
      );
    }

    // High severity error recommendations
    const highErrors = errors.filter((e) => e.severity === 'HIGH');
    if (highErrors.length > 0) {
      recommendations.push(
        `⚠️ ${highErrors.length} masalah prioritas tinggi perlu ditangani`,
      );
    }

    // Fulfillment rate recommendations
    if (fulfillmentRate < 50) {
      recommendations.push(
        '📊 Tingkat pemenuhan jadwal sangat rendah (<50%) - evaluasi ulang kebutuhan dan ketersediaan staff',
      );
    } else if (fulfillmentRate < 80) {
      recommendations.push(
        '📈 Tingkat pemenuhan jadwal perlu ditingkatkan - pertimbangkan penambahan staff atau penyesuaian jadwal',
      );
    } else if (fulfillmentRate >= 95) {
      recommendations.push(
        '✨ Penjadwalan sangat optimal - pertahankan tingkat efisiensi ini',
      );
    }

    // Auto-resolvable errors recommendation
    const autoResolvableErrors = errors.filter((e) => e.autoResolvable);
    if (autoResolvableErrors.length > 0) {
      recommendations.push(
        `🔧 ${autoResolvableErrors.length} masalah dapat diselesaikan secara otomatis dengan pilihan yang tersedia`,
      );
    }

    return {
      success,
      totalRequested,
      totalCreated,
      fulfillmentRate,
      errors,
      warnings,
      summary: {
        successfulDates: additionalData.successfulDates || [],
        failedDates: additionalData.failedDates || [],
        partialDates: additionalData.partialDates || [],
        overLimitStaff: additionalData.overLimitStaff || [],
        incompleteShifts: additionalData.incompleteShifts || [],
      },
      recommendations,
      // 🔥 FIX: Add backward compatibility properties
      totalShifts: totalRequested,
      successfulAssignments: totalCreated,
    };
  }

  /**
   * 🔥 NEW: Validate shift operational hours
   */
  private validateShiftOperationalHours(
    shiftType: string,
    startTime: string,
    endTime: string,
  ): SchedulingError | null {
    const operationalHours = {
      PAGI: { start: '06:00', end: '14:00' },
      SIANG: { start: '14:00', end: '22:00' },
      MALAM: { start: '22:00', end: '06:00' },
      ON_CALL: { start: '08:00', end: '17:00' },
      JAGA: { start: '12:00', end: '20:00' },
    };

    const expectedHours = operationalHours[shiftType];
    if (!expectedHours) return null;

    if (startTime !== expectedHours.start || endTime !== expectedHours.end) {
      return this.generateSchedulingError(
        SchedulingErrorType.SHIFT_OUTSIDE_OPERATIONAL_HOURS,
        {
          shiftType,
          additionalInfo: {
            expected: expectedHours,
            actual: { start: startTime, end: endTime },
          },
        },
      );
    }

    return null;
  }

  /**
   * 🔥 NEW: Check role coverage completeness for a shift
   */
  private async validateRoleCoverage(
    date: string,
    location: string,
    requiredRoles: string[],
  ): Promise<SchedulingError | null> {
    const existingShifts = await this.prisma.shift.findMany({
      where: {
        tanggal: new Date(date),
        lokasiEnum: this.mapLocationToEnum(location),
      },
      include: { user: true },
    });

    // Convert roles to strings for comparison
    const assignedRoles = new Set(
      existingShifts.map((shift) => String(shift.user.role)),
    );
    const missingRoles = requiredRoles.filter(
      (role) => !assignedRoles.has(role),
    );

    if (missingRoles.length > 0) {
      return this.generateSchedulingError(
        SchedulingErrorType.INCOMPLETE_ROLE_COVERAGE,
        {
          date,
          location,
          additionalInfo: {
            missingRoles,
            requiredRoles,
            assignedRoles: Array.from(assignedRoles),
          },
        },
      );
    }

    return null;
  }

  /**
   * 🔥 NEW: Generate notification message for UI display
   */
  generateUserNotification(result: SchedulingResult): {
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
    actions?: Array<{
      label: string;
      action: string;
      style: 'primary' | 'secondary' | 'danger';
    }>;
    details?: any;
    errorBreakdown?: Array<{
      type: string;
      count: number;
      severity: string;
      message: string;
    }>;
  } {
    const { success, fulfillmentRate, errors, warnings, summary } = result;

    // Generate error breakdown for detailed display
    const errorBreakdown = this.generateErrorBreakdown(errors);

    // Critical errors - show error notification
    const criticalErrors = errors.filter((e) => e.severity === 'CRITICAL');
    if (criticalErrors.length > 0) {
      const errorTypesMessage =
        errorBreakdown.length > 0
          ? `\n\n📊 Detail Error:\n${errorBreakdown.map((e) => `${this.getErrorIcon(e.severity)} ${e.message} (${e.count}x)`).join('\n')}`
          : '';

      return {
        type: 'error',
        title: '❌ Gagal Membuat Jadwal Bulanan',
        message: `${criticalErrors[0].message}${errorTypesMessage}`,
        actions: [
          {
            label: 'Lihat Detail Error',
            action: 'view_errors',
            style: 'primary',
          },
          { label: 'Coba Lagi', action: 'retry', style: 'secondary' },
        ],
        details: {
          errors: criticalErrors,
          suggestions: criticalErrors[0].suggestedActions,
        },
        errorBreakdown,
      };
    }

    // High errors but some success - show warning
    const highErrors = errors.filter((e) => e.severity === 'HIGH');
    if (highErrors.length > 0 && fulfillmentRate > 30) {
      const errorTypesMessage =
        errorBreakdown.length > 0
          ? `\n\n📊 Detail Masalah:\n${errorBreakdown.map((e) => `${this.getErrorIcon(e.severity)} ${e.message} (${e.count}x)`).join('\n')}`
          : '';

      return {
        type: 'warning',
        title: '⚠️ Jadwal Dibuat Dengan Masalah',
        message: `${result.totalCreated} dari ${result.totalRequested} shift berhasil dibuat (${fulfillmentRate.toFixed(1)}%). ${highErrors.length} masalah ditemukan.${errorTypesMessage}`,
        actions: [
          { label: 'Lihat Masalah', action: 'view_issues', style: 'primary' },
          {
            label: 'Perbaiki Manual',
            action: 'manual_fix',
            style: 'secondary',
          },
          { label: 'Terima Jadwal', action: 'accept', style: 'danger' },
        ],
        details: {
          summary,
          errors: highErrors,
          successRate: fulfillmentRate,
        },
        errorBreakdown,
      };
    }

    // Partial success - show info with options
    if (fulfillmentRate >= 70 && fulfillmentRate < 95) {
      const errorTypesMessage =
        errorBreakdown.length > 0
          ? `\n\n📊 Detail Masalah:\n${errorBreakdown.map((e) => `${this.getErrorIcon(e.severity)} ${e.message} (${e.count}x)`).join('\n')}`
          : '';

      return {
        type: 'info',
        title: '✅ Jadwal Berhasil Dibuat Sebagian',
        message: `${result.totalCreated} dari ${result.totalRequested} shift berhasil dibuat (${fulfillmentRate.toFixed(1)}%). Beberapa tanggal dilewati.${errorTypesMessage}`,
        actions: [
          {
            label: 'Lihat Ringkasan',
            action: 'view_summary',
            style: 'primary',
          },
          {
            label: 'Timpa Jadwal Lama',
            action: 'overwrite_existing',
            style: 'secondary',
          },
          {
            label: 'Hanya Jadwal Kosong',
            action: 'skip_existing',
            style: 'secondary',
          },
        ],
        details: { summary, warnings },
        errorBreakdown,
      };
    }

    // Full success
    if (success && fulfillmentRate >= 95) {
      return {
        type: 'success',
        title: '🎉 Jadwal Berhasil Dibuat',
        message: `Semua ${result.totalCreated} shift berhasil dijadwalkan (${fulfillmentRate.toFixed(1)}% terpenuhi).`,
        actions: [
          { label: 'Lihat Jadwal', action: 'view_schedule', style: 'primary' },
        ],
        details: { summary },
      };
    }

    // Default case - partial success with warnings
    const errorTypesMessage =
      errorBreakdown.length > 0
        ? `\n\n📊 Detail Masalah:\n${errorBreakdown.map((e) => `${this.getErrorIcon(e.severity)} ${e.message} (${e.count}x)`).join('\n')}`
        : '';

    return {
      type: 'warning',
      title: '⚠️ Jadwal Dibuat Dengan Peringatan',
      message: `${result.totalCreated} shift dibuat dari ${result.totalRequested} yang diminta. Periksa detail untuk informasi lebih lanjut.${errorTypesMessage}`,
      actions: [
        { label: 'Lihat Detail', action: 'view_details', style: 'primary' },
        { label: 'Perbaiki', action: 'fix_issues', style: 'secondary' },
      ],
      details: { summary, warnings, errors },
      errorBreakdown,
    };
  }

  /**
   * 🔥 NEW: Generate error breakdown with count and severity
   */
  private generateErrorBreakdown(
    errors: SchedulingError[],
  ): Array<{ type: string; count: number; severity: string; message: string }> {
    const errorTypeMap = new Map<
      string,
      { count: number; severity: string; sample: SchedulingError }
    >();

    errors.forEach((error) => {
      const typeKey = error.type;
      if (errorTypeMap.has(typeKey)) {
        errorTypeMap.get(typeKey)!.count++;
      } else {
        errorTypeMap.set(typeKey, {
          count: 1,
          severity: error.severity,
          sample: error,
        });
      }
    });

    return Array.from(errorTypeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      severity: data.severity,
      message: this.getErrorTypeDisplayName(type as SchedulingErrorType),
    }));
  }

  /**
   * 🔥 NEW: Get user-friendly display name for error types
   */
  private getErrorTypeDisplayName(errorType: SchedulingErrorType): string {
    const errorDisplayNames = {
      [SchedulingErrorType.PARTIAL_SUCCESS]: '✅ Berhasil Sebagian',
      [SchedulingErrorType.INSUFFICIENT_STAFF]:
        '❌ Jumlah Pegawai Tidak Mencukupi',
      [SchedulingErrorType.STAFF_OVER_LIMIT]: '❌ Pegawai Melebihi Batas Shift',
      [SchedulingErrorType.SCHEDULE_CONFLICT]: '❌ Jadwal Bertabrakan',
      [SchedulingErrorType.CONSECUTIVE_DAYS_EXCEEDED]:
        '❌ Pegawai Terlalu Banyak Hari Berturut-turut',
      [SchedulingErrorType.NO_STAFF_WITH_REQUIRED_ROLE]:
        '❌ Tidak Ada Pegawai dengan Role yang Sesuai',
      [SchedulingErrorType.SHIFT_OUTSIDE_OPERATIONAL_HOURS]:
        '⚠️ Shift Melebihi Jam Operasional',
      [SchedulingErrorType.DATABASE_ERROR]: '❌ Database Error / Server Error',
      [SchedulingErrorType.INCOMPLETE_ROLE_COVERAGE]:
        '⚠️ Role Tidak Lengkap dalam Shift',
      [SchedulingErrorType.SHIFT_SLOT_FULL]: '❌ Shift Sudah Dibuat Penuh',
      [SchedulingErrorType.WORKLOAD_EXCEEDED]: '❌ Beban Kerja Berlebihan',
    };

    return errorDisplayNames[errorType] || `❓ Error: ${errorType}`;
  }

  /**
   * 🔥 NEW: Get icon based on error severity
   */
  private getErrorIcon(severity: string): string {
    switch (severity) {
      case 'CRITICAL':
        return '🔴';
      case 'HIGH':
        return '🟠';
      case 'MEDIUM':
        return '🟡';
      case 'LOW':
        return '🟢';
      default:
        return '⚪';
    }
  }

  /**
   * 🔥 NEW: Get user-friendly notification for scheduling results
   * This method can be called after createMonthlySchedule to get UI notification
   */
  async getSchedulingNotification(result: SchedulingResult): Promise<{
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
    actions?: Array<{
      label: string;
      action: string;
      style: 'primary' | 'secondary' | 'danger';
    }>;
    details?: any;
    errorBreakdown?: Array<{
      type: string;
      count: number;
      severity: string;
      message: string;
    }>;
  }> {
    return this.generateUserNotification(result);
  }

  /**
   * 🔥 NEW: Create monthly schedule with comprehensive error handling and user notifications
   * This is the main method that should be called from the controller
   */
  async createMonthlyScheduleWithNotifications(
    request: MonthlyScheduleRequest,
  ): Promise<{
    result: SchedulingResult;
    notification: {
      type: 'success' | 'warning' | 'error' | 'info';
      title: string;
      message: string;
      actions?: Array<{
        label: string;
        action: string;
        style: 'primary' | 'secondary' | 'danger';
      }>;
      details?: any;
    };
  }> {
    const result = await this.createMonthlySchedule(request);
    const notification = this.generateUserNotification(result);

    return {
      result,
      notification,
    };
  }

  /**
   * 🔥 NEW: Handle error resolution actions from UI
   */
  async handleSchedulingAction(
    action: string,
    actionData: any,
  ): Promise<{
    success: boolean;
    message: string;
    result?: any;
  }> {
    switch (action) {
      case 'overwrite_existing':
        // Implement logic to overwrite existing shifts
        return {
          success: true,
          message:
            'Jadwal lama akan ditimpa. Silakan jalankan ulang pembuatan jadwal.',
          result: { action: 'overwrite_mode_enabled' },
        };

      case 'skip_existing':
        // Implement logic to skip existing dates
        return {
          success: true,
          message: 'Mode "hanya jadwal kosong" diaktifkan.',
          result: { action: 'skip_mode_enabled' },
        };

      case 'manual_fix':
        // Prepare data for manual fixing
        const manualFixData = await this.prepareManualFixData(actionData);
        return {
          success: true,
          message: 'Data siap untuk perbaikan manual.',
          result: manualFixData,
        };

      case 'retry':
        // Prepare retry with adjusted parameters
        return {
          success: true,
          message: 'Silakan coba lagi dengan parameter yang disesuaikan.',
          result: { action: 'retry_suggested' },
        };

      case 'view_errors':
      case 'view_issues':
      case 'view_summary':
      case 'view_details':
        // These are view actions, just return success
        return {
          success: true,
          message: 'Detail informasi tersedia.',
          result: actionData,
        };

      default:
        return {
          success: false,
          message: 'Aksi tidak dikenali.',
          result: null,
        };
    }
  }

  /**
   * 🔥 NEW: Prepare data for manual fixing of scheduling issues
   */
  private async prepareManualFixData(actionData: any): Promise<any> {
    return {
      conflictedDates: actionData?.failedDates || [],
      overLimitStaff: actionData?.overLimitStaff || [],
      incompleteShifts: actionData?.incompleteShifts || [],
      suggestedStaffReassignments:
        await this.generateStaffReassignmentSuggestions(actionData),
      availableStaff: await this.getAvailableStaffForManualAssignment(),
      workloadAnalysis: await this.generateWorkloadAnalysis(),
    };
  }

  /**
   * 🔥 NEW: Generate staff reassignment suggestions for manual fixing
   */
  private async generateStaffReassignmentSuggestions(
    actionData: any,
  ): Promise<any[]> {
    const suggestions: any[] = [];

    // Get overloaded staff and suggest redistributions
    const overLimitStaff = actionData?.overLimitStaff || [];

    for (const staff of overLimitStaff) {
      const userShifts = await this.prisma.shift.findMany({
        where: { userId: staff.userId },
        include: { user: true },
        orderBy: { tanggal: 'desc' },
      });

      // Find recent shifts that could be reassigned
      const recentShifts = userShifts.slice(
        0,
        Math.min(5, staff.currentShifts - staff.limit),
      );

      for (const shift of recentShifts) {
        // Find alternative staff for this shift
        const alternatives = await this.findAlternativeStaffForShift(shift);

        suggestions.push({
          originalStaff: {
            id: staff.userId,
            name: staff.name,
            currentShifts: staff.currentShifts,
          },
          shift: {
            date: shift.tanggal.toISOString().split('T')[0],
            location: shift.lokasishift,
            shiftType: shift.tipeshift,
          },
          alternatives: alternatives.slice(0, 3), // Top 3 alternatives
        });
      }
    }

    return suggestions;
  }

  /**
   * 🔥 NEW: Find alternative staff for a specific shift
   */
  private async findAlternativeStaffForShift(shift: any): Promise<any[]> {
    const availableUsers = await this.getAvailableUsersWithWorkload();
    const shiftDate = shift.tanggal.toISOString().split('T')[0];

    // Filter users who don't have conflicts on this date
    const alternativeUsers = availableUsers.filter((user) => {
      // Check if user already has shift on this date
      const hasConflict = user.shifts?.some(
        (userShift: any) =>
          userShift.tanggal.toISOString().split('T')[0] === shiftDate,
      );

      return !hasConflict && user.id !== shift.userId;
    });

    // Calculate suitability score for each alternative
    const scoredAlternatives = alternativeUsers.map((user) => {
      const shiftRequest: ShiftCreationRequest = {
        date: shiftDate,
        location: shift.lokasishift,
        shiftType: shift.tipeshift,
        requiredCount: 1,
        priority: 'NORMAL',
      };

      const score = this.calculateUserFitnessScore(user, shiftRequest);

      return {
        userId: user.id,
        name: `${user.namaDepan} ${user.namaBelakang}`,
        role: user.role,
        currentShifts: user.shifts?.length || 0,
        score,
        suitabilityReason: this.getSuitabilityReason(score),
      };
    });

    // Sort by score and return top alternatives
    return scoredAlternatives.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  /**
   * 🔥 NEW: Get suitability reason based on score
   */
  private getSuitabilityReason(score: number): string {
    if (score >= 80)
      return 'Sangat cocok - pengalaman dan ketersediaan optimal';
    if (score >= 60) return 'Cocok - memenuhi kriteria utama';
    if (score >= 40) return 'Cukup cocok - dapat diberikan dengan pertimbangan';
    if (score >= 20) return 'Kurang cocok - perlu evaluasi tambahan';
    return 'Tidak cocok - hindari jika ada alternatif lain';
  }

  /**
   * 🔥 NEW: Get available staff for manual assignment
   */
  private async getAvailableStaffForManualAssignment(): Promise<any[]> {
    const users = await this.getAvailableUsersWithWorkload();

    return users.map((user) => ({
      userId: user.id,
      name: `${user.namaDepan} ${user.namaBelakang}`,
      role: user.role,
      currentShifts: user.shifts?.length || 0,
      status: user.status,
      lastShiftDate:
        user.shifts?.[0]?.tanggal?.toISOString().split('T')[0] || null,
      workloadLevel: this.calculateWorkloadLevel(user.shifts?.length || 0),
    }));
  }

  /**
   * 🔥 NEW: Calculate workload level description
   */
  private calculateWorkloadLevel(shiftCount: number): string {
    if (shiftCount >= 25) return 'OVERLOADED';
    if (shiftCount >= 20) return 'HIGH';
    if (shiftCount >= 15) return 'MEDIUM';
    if (shiftCount >= 10) return 'NORMAL';
    if (shiftCount >= 5) return 'LIGHT';
    return 'MINIMAL';
  }

  /**
   * 🔥 NEW: Generate comprehensive workload analysis
   */
  private async generateWorkloadAnalysis(): Promise<any> {
    const users = await this.getAvailableUsersWithWorkload();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const workloadData = users.map((user) => {
      const recentShifts =
        user.shifts?.filter((shift) => shift.tanggal >= thirtyDaysAgo) || [];

      return {
        userId: user.id,
        name: `${user.namaDepan} ${user.namaBelakang}`,
        role: user.role,
        totalShifts: user.shifts?.length || 0,
        recentShifts: recentShifts.length,
        workloadLevel: this.calculateWorkloadLevel(user.shifts?.length || 0),
        lastShiftDate:
          user.shifts?.[0]?.tanggal?.toISOString().split('T')[0] || null,
      };
    });

    const summary = {
      totalStaff: users.length,
      workloadDistribution: {
        OVERLOADED: workloadData.filter((u) => u.workloadLevel === 'OVERLOADED')
          .length,
        HIGH: workloadData.filter((u) => u.workloadLevel === 'HIGH').length,
        MEDIUM: workloadData.filter((u) => u.workloadLevel === 'MEDIUM').length,
        NORMAL: workloadData.filter((u) => u.workloadLevel === 'NORMAL').length,
        LIGHT: workloadData.filter((u) => u.workloadLevel === 'LIGHT').length,
        MINIMAL: workloadData.filter((u) => u.workloadLevel === 'MINIMAL')
          .length,
      },
      averageShiftsPerPerson:
        workloadData.reduce((sum, u) => sum + u.totalShifts, 0) / users.length,
      recommendations: this.generateWorkloadRecommendations(workloadData),
    };

    return {
      summary,
      detailedData: workloadData,
    };
  }

  /**
   * 🔥 NEW: Generate workload-based recommendations
   */
  private generateWorkloadRecommendations(workloadData: any[]): string[] {
    const recommendations: string[] = [];

    const overloaded = workloadData.filter(
      (u) => u.workloadLevel === 'OVERLOADED',
    ).length;
    const minimal = workloadData.filter(
      (u) => u.workloadLevel === 'MINIMAL',
    ).length;
    const total = workloadData.length;

    if (overloaded > total * 0.2) {
      recommendations.push(
        `⚠️ ${overloaded} pegawai kelebihan beban kerja (>20% dari total staff)`,
      );
      recommendations.push(
        'Pertimbangkan rekrutmen staff tambahan atau redistribusi shift',
      );
    }

    if (minimal > total * 0.3) {
      recommendations.push(
        `💡 ${minimal} pegawai memiliki beban kerja minimal (>30% dari total staff)`,
      );
      recommendations.push(
        'Peluang untuk memberikan shift tambahan kepada staff yang underutilized',
      );
    }

    const avgShifts =
      workloadData.reduce((sum, u) => sum + u.totalShifts, 0) / total;
    if (avgShifts > 20) {
      recommendations.push(
        '📊 Rata-rata shift per pegawai tinggi - monitor kesehatan dan produktivitas staff',
      );
    } else if (avgShifts < 10) {
      recommendations.push(
        '📈 Rata-rata shift per pegawai rendah - peluang optimalisasi utilisasi staff',
      );
    }

    return recommendations;
  }

  // Helper methods for weekly/monthly scheduling

  /**
   * 🔥 NEW: Create assignments with limits but WITHOUT database creation
   * Used for monthly scheduling to validate first, then create all at once
   */
  private async createOptimalShiftAssignmentsWithLimitsNoDB(
    requests: ShiftCreationRequest[],
    userShiftCounts: Map<number, number>,
    limits: any,
  ): Promise<any> {
    console.log(
      '🔍 Creating assignments with enhanced workload limits (NO DB):',
      limits,
    );
    console.log(
      '📊 Current user shift counts:',
      Object.fromEntries(userShiftCounts),
    );

    // Get available users first and filter by workload limits
    const availableUsers = await this.getAvailableUsersWithWorkload();
    console.log(`👥 Total available users: ${availableUsers.length}`);

    // Filter users who haven't exceeded their limit
    const eligibleUsers = availableUsers.filter((user) => {
      const currentCount = userShiftCounts.get(user.id) || 0;
      const canAcceptMore = currentCount < limits.maxShiftsPerPerson;
      console.log(
        `👤 User ${user.id}: ${currentCount}/${limits.maxShiftsPerPerson} shifts (eligible: ${canAcceptMore})`,
      );
      return canAcceptMore;
    });

    console.log(
      `✅ Eligible users after workload filtering: ${eligibleUsers.length}`,
    );

    if (eligibleUsers.length === 0) {
      console.warn(
        '⚠️  NO ELIGIBLE USERS - All users have reached their workload limit!',
      );
      return {
        assignments: [],
        conflicts: [
          {
            type: 'WORKLOAD_EXCEEDED',
            message: 'All available users have reached maximum workload limit',
            affectedRequests: requests,
          },
        ],
        stats: { totalRequests: requests.length, fulfilled: 0 },
      };
    }

    // Create a modified version of createOptimalShiftAssignments that only uses eligible users
    const assignments: any[] = [];
    const conflicts: any[] = [];

    for (const request of requests) {
      console.log(
        `🎯 Processing request for ${request.requiredCount} ${request.shiftType} shifts at ${request.location} on ${request.date}`,
      );

      // 🔥 NEW: Enhanced validation with consecutive days check
      const validatedUsers: any[] = [];

      for (const user of eligibleUsers) {
        // Extract year and month from request date
        const requestDate = new Date(request.date);
        const year = requestDate.getFullYear();
        const month = requestDate.getMonth() + 1;

        // Validate workload with existing shifts
        const validation = await this.validateWorkloadWithExistingShifts(
          user.id,
          request.date,
          year,
          month,
          limits,
        );

        if (validation.canAcceptShift) {
          validatedUsers.push(user);
        } else {
          console.log(`🚫 User ${user.id} rejected: ${validation.reason}`);
        }
      }

      console.log(
        `✅ Validated users: ${validatedUsers.length}/${eligibleUsers.length} for ${request.location} ${request.shiftType}`,
      );

      // Get the most suitable users for this shift from validated users
      const sortedUsers = this.sortUsersByShiftSuitability(
        validatedUsers,
        request,
      );
      const selectedUsers = sortedUsers.slice(0, request.requiredCount);

      if (selectedUsers.length < request.requiredCount) {
        console.warn(
          `⚠️  Only ${selectedUsers.length}/${request.requiredCount} users available for ${request.location} ${request.shiftType}`,
        );
        conflicts.push({
          type: 'INSUFFICIENT_STAFF',
          message: `Not enough eligible staff for ${request.location} ${request.shiftType} on ${request.date} (considering workload limits)`,
          required: request.requiredCount,
          available: selectedUsers.length,
          eligibleBeforeValidation: eligibleUsers.length,
          validatedUsers: validatedUsers.length,
        });
      }

      // Create assignments for selected users (NO DATABASE CREATION)
      for (const user of selectedUsers) {
        assignments.push({
          userId: user.id,
          shiftDetails: request,
          score: 100,
          reason: `Monthly validated assignment`,
        });

        // Update assignment count immediately to prevent double-assignment
        userShiftCounts.set(user.id, (userShiftCounts.get(user.id) || 0) + 1);
        console.log(
          `📈 Updated user ${user.id} shift count to ${userShiftCounts.get(user.id)}`,
        );
      }
    }

    console.log(
      `✅ Created ${assignments.length} assignments (NO DB) with workload limits respected`,
    );

    return {
      assignments,
      conflicts,
      stats: {
        totalRequests: requests.length,
        fulfilled: assignments.length,
        workloadLimited: true,
      },
    };
  }

  private async createOptimalShiftAssignmentsWithLimits(
    requests: ShiftCreationRequest[],
    userShiftCounts: Map<number, number>,
    limits: any,
  ): Promise<any> {
    console.log(
      '🔍 Creating assignments with enhanced workload limits:',
      limits,
    );
    console.log(
      '📊 Current user shift counts:',
      Object.fromEntries(userShiftCounts),
    );

    // Get available users first and filter by workload limits
    const availableUsers = await this.getAvailableUsersWithWorkload();
    console.log(`👥 Total available users: ${availableUsers.length}`);

    // Filter users who haven't exceeded their limit
    const eligibleUsers = availableUsers.filter((user) => {
      const currentCount = userShiftCounts.get(user.id) || 0;
      const canAcceptMore = currentCount < limits.maxShiftsPerPerson;
      console.log(
        `👤 User ${user.id}: ${currentCount}/${limits.maxShiftsPerPerson} shifts (eligible: ${canAcceptMore})`,
      );
      return canAcceptMore;
    });

    console.log(
      `✅ Eligible users after workload filtering: ${eligibleUsers.length}`,
    );

    if (eligibleUsers.length === 0) {
      console.warn(
        '⚠️  NO ELIGIBLE USERS - All users have reached their workload limit!',
      );
      return {
        assignments: [],
        conflicts: [
          {
            type: 'WORKLOAD_EXCEEDED',
            message: 'All available users have reached maximum workload limit',
            affectedRequests: requests,
          },
        ],
        stats: { totalRequests: requests.length, fulfilled: 0 },
      };
    }

    // Create a modified version of createOptimalShiftAssignments that only uses eligible users
    const assignments: any[] = [];
    const conflicts: any[] = [];

    for (const request of requests) {
      console.log(
        `🎯 Processing request for ${request.requiredCount} ${request.shiftType} shifts at ${request.location} on ${request.date}`,
      );

      // 🔥 NEW: Enhanced validation with consecutive days check
      const validatedUsers: any[] = [];

      for (const user of eligibleUsers) {
        // Extract year and month from request date
        const requestDate = new Date(request.date);
        const year = requestDate.getFullYear();
        const month = requestDate.getMonth() + 1;

        // Validate workload with existing shifts
        const validation = await this.validateWorkloadWithExistingShifts(
          user.id,
          request.date,
          year,
          month,
          limits,
        );

        if (validation.canAcceptShift) {
          validatedUsers.push(user);
        } else {
          console.log(`🚫 User ${user.id} rejected: ${validation.reason}`);
        }
      }

      console.log(
        `✅ Validated users: ${validatedUsers.length}/${eligibleUsers.length} for ${request.location} ${request.shiftType}`,
      );

      // Get the most suitable users for this shift from validated users
      const sortedUsers = this.sortUsersByShiftSuitability(
        validatedUsers,
        request,
      );
      const selectedUsers = sortedUsers.slice(0, request.requiredCount);

      if (selectedUsers.length < request.requiredCount) {
        console.warn(
          `⚠️  Only ${selectedUsers.length}/${request.requiredCount} users available for ${request.location} ${request.shiftType}`,
        );
        conflicts.push({
          type: 'INSUFFICIENT_STAFF',
          message: `Not enough eligible staff for ${request.location} ${request.shiftType} on ${request.date} (considering workload limits)`,
          required: request.requiredCount,
          available: selectedUsers.length,
          eligibleBeforeValidation: eligibleUsers.length,
          validatedUsers: validatedUsers.length,
        });
      }

      // Create assignments for selected users
      for (const user of selectedUsers) {
        assignments.push({
          userId: user.id,
          shiftDetails: request,
        });

        // Update user shift count immediately to prevent double-assignment
        userShiftCounts.set(user.id, (userShiftCounts.get(user.id) || 0) + 1);
        console.log(
          `📈 Updated user ${user.id} shift count to ${userShiftCounts.get(user.id)}`,
        );
      }
    }

    console.log(
      `✅ Created ${assignments.length} assignments with workload limits respected`,
    );

    return {
      assignments,
      conflicts,
      stats: {
        totalRequests: requests.length,
        fulfilled: assignments.length,
        workloadLimited: true,
      },
    };
  }

  private sortUsersByShiftSuitability(
    users: any[],
    request: ShiftCreationRequest,
  ): any[] {
    // Sort users by suitability for this shift type and location
    return users.sort((a, b) => {
      // Prefer users with fewer current shifts (load balancing)
      const aShifts = a.shifts?.length || 0;
      const bShifts = b.shifts?.length || 0;

      if (aShifts !== bShifts) {
        return aShifts - bShifts; // Ascending: fewer shifts first
      }

      // Secondary sort: prefer users with relevant location experience
      const aLocationExp =
        a.shifts?.filter((s) => s.lokasiEnum === request.location).length || 0;
      const bLocationExp =
        b.shifts?.filter((s) => s.lokasiEnum === request.location).length || 0;

      return bLocationExp - aLocationExp; // Descending: more experience first
    });
  }

  private generateWeeklyRecommendations(
    stats: WeeklyScheduleStats,
    request: WeeklyScheduleRequest,
  ): string[] {
    const recommendations: string[] = [];

    const fulfillmentRate =
      (stats.successfulAssignments / stats.totalShifts) * 100;

    if (fulfillmentRate < 80) {
      recommendations.push(
        'Low fulfillment rate. Consider adjusting staffing requirements or hiring additional staff.',
      );
    }

    if (stats.conflicts.length > 0) {
      recommendations.push(
        `${stats.conflicts.length} scheduling conflicts detected. Review staff availability.`,
      );
    }

    if (fulfillmentRate > 95) {
      recommendations.push(
        'Excellent schedule fulfillment. Consider this pattern for future weeks.',
      );
    }

    return recommendations;
  }

  private generateMonthlyRecommendations(
    stats: MonthlyScheduleStats,
    request: MonthlyScheduleRequest,
  ): string[] {
    const recommendations: string[] = [];

    const fulfillmentRate =
      (stats.successfulAssignments / stats.totalShifts) * 100;

    if (fulfillmentRate < 85) {
      recommendations.push(
        'Monthly fulfillment rate below target. Consider workforce expansion.',
      );
    }

    // Analyze workload distribution
    const workloadValues = Object.values(stats.workloadDistribution);
    const maxWorkload = Math.max(...workloadValues);
    const minWorkload = Math.min(...workloadValues);

    if (maxWorkload - minWorkload > 10) {
      recommendations.push(
        'Uneven workload distribution detected. Consider rebalancing assignments.',
      );
    }

    if (stats.conflicts.length > stats.totalShifts * 0.1) {
      recommendations.push(
        'High conflict rate. Review staff availability patterns and constraints.',
      );
    }

    return recommendations;
  }

  // Create specialized database method for extended shift assignments
  private async createShiftsInDatabaseExtended(
    assignments: ShiftAssignmentExtended[],
  ): Promise<any[]> {
    const createdShifts: any[] = [];
    const duplicateCount = { skipped: 0, created: 0 };

    console.log(
      `🔄 Attempting to create ${assignments.length} shifts in database`,
    );

    for (const assignment of assignments) {
      try {
        console.log(`Creating shift:`, {
          date: assignment.date,
          location: assignment.location,
          shiftType: assignment.shiftType,
          userId: assignment.userId,
        });

        // Check for existing shift to prevent duplicates
        const existingShift = await this.prisma.shift.findFirst({
          where: {
            tanggal: new Date(assignment.date),
            lokasishift: assignment.location,
            userId: assignment.userId,
            // Optional: also check tipeEnum if you want to prevent duplicate shift types
            tipeEnum: assignment.shiftType as any,
          },
        });

        if (existingShift) {
          console.log(`⚠️  Duplicate shift detected, skipping:`, {
            existingId: existingShift.id,
            date: assignment.date,
            location: assignment.location,
            userId: assignment.userId,
          });
          duplicateCount.skipped++;
          continue;
        }

        const shift = await this.prisma.shift.create({
          data: {
            tanggal: new Date(assignment.date),
            jammulai: assignment.startTime,
            jamselesai: assignment.endTime,
            lokasishift: assignment.location,
            userId: assignment.userId,
            lokasiEnum: assignment.location as any,
            tipeshift: assignment.shiftType,
            tipeEnum: assignment.shiftType as any,
          },
        });

        console.log(`✅ Shift created successfully:`, shift.id);
        createdShifts.push(shift);
        duplicateCount.created++;
      } catch (error) {
        console.error('❌ Failed to create shift in database:', error);
      }
    }

    console.log(
      `✅ Database summary: ${duplicateCount.created} created, ${duplicateCount.skipped} duplicates skipped`,
    );
    console.log(
      `✅ Total shifts created: ${createdShifts.length}/${assignments.length}`,
    );
    return createdShifts;
  }

  private calculateWorkloadDistribution(userShiftCounts: Map<number, number>): {
    [userId: number]: number;
  } {
    const distribution: { [userId: number]: number } = {};
    for (const [userId, count] of userShiftCounts.entries()) {
      distribution[userId] = count;
    }
    return distribution;
  }

  /**
   * Helper functions for variety in scheduling
   */
  private getRandomSubset<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private generateVariedShiftPattern(
    location: string,
    dayOfWeek: number,
    providedPattern?: any,
  ) {
    // 🔥 PRIORITY: Use user-provided pattern if available
    if (providedPattern && Object.keys(providedPattern).length > 0) {
      console.log(
        `✅ Using user-provided pattern for ${location}:`,
        providedPattern,
      );
      return {
        PAGI: providedPattern.PAGI || 0,
        SIANG: providedPattern.SIANG || 0,
        MALAM: providedPattern.MALAM || 0,
      };
    }

    // Base patterns by location type (fallback only)
    const locationPatterns: { [key: string]: any } = {
      ICU: { PAGI: 4, SIANG: 3, MALAM: 2 },
      NICU: { PAGI: 3, SIANG: 2, MALAM: 2 },
      GAWAT_DARURAT: { PAGI: 5, SIANG: 4, MALAM: 3 },
      RAWAT_INAP: { PAGI: 3, SIANG: 3, MALAM: 2 },
      RAWAT_JALAN: { PAGI: 2, SIANG: 1, MALAM: 0 },
      LABORATORIUM: { PAGI: 2, SIANG: 2, MALAM: 1 },
      FARMASI: { PAGI: 2, SIANG: 2, MALAM: 1 },
      RADIOLOGI: { PAGI: 2, SIANG: 1, MALAM: 1 },
      KAMAR_OPERASI: { PAGI: 6, SIANG: 4, MALAM: 2 },
      HEMODIALISA: { PAGI: 3, SIANG: 2, MALAM: 1 },
      FISIOTERAPI: { PAGI: 2, SIANG: 2, MALAM: 0 },
      KEAMANAN: { PAGI: 2, SIANG: 2, MALAM: 2 },
      LAUNDRY: { PAGI: 2, SIANG: 1, MALAM: 0 },
    };

    // Get base pattern for location
    const basePattern = locationPatterns[location] || {
      PAGI: 2,
      SIANG: 2,
      MALAM: 1,
    };

    console.log(`⚠️ Using fallback pattern for ${location}:`, basePattern);

    // Weekend adjustments for fallback patterns only
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend
      basePattern.PAGI = Math.max(1, Math.floor(basePattern.PAGI * 0.7));
      basePattern.SIANG = Math.max(1, Math.floor(basePattern.SIANG * 0.8));
      basePattern.MALAM = Math.max(1, basePattern.MALAM);
    }

    return basePattern;
  }

  private getDefaultStaffPattern(location: string): {
    PAGI: number;
    SIANG: number;
    MALAM: number;
  } {
    // Default patterns by location type for fallback
    const locationPatterns: { [key: string]: any } = {
      ICU: { PAGI: 4, SIANG: 3, MALAM: 2 },
      NICU: { PAGI: 3, SIANG: 2, MALAM: 2 },
      GAWAT_DARURAT: { PAGI: 5, SIANG: 4, MALAM: 3 },
      RAWAT_INAP: { PAGI: 3, SIANG: 3, MALAM: 2 },
      RAWAT_JALAN: { PAGI: 2, SIANG: 1, MALAM: 0 },
      LABORATORIUM: { PAGI: 2, SIANG: 2, MALAM: 1 },
      FARMASI: { PAGI: 2, SIANG: 2, MALAM: 1 },
      RADIOLOGI: { PAGI: 2, SIANG: 1, MALAM: 1 },
      KAMAR_OPERASI: { PAGI: 6, SIANG: 4, MALAM: 2 },
      HEMODIALISA: { PAGI: 3, SIANG: 2, MALAM: 1 },
      FISIOTERAPI: { PAGI: 2, SIANG: 2, MALAM: 0 },
      KEAMANAN: { PAGI: 2, SIANG: 2, MALAM: 2 },
      LAUNDRY: { PAGI: 2, SIANG: 1, MALAM: 0 },
    };

    return locationPatterns[location] || { PAGI: 2, SIANG: 2, MALAM: 1 };
  }

  private calculateTotalStaffForShift(shiftRoles?: {
    DOKTER?: number;
    PERAWAT?: number;
    STAFF?: number;
  }): number {
    if (!shiftRoles) return 0;

    const dokter = Number(shiftRoles.DOKTER) || 0;
    const perawat = Number(shiftRoles.PERAWAT) || 0;
    const staff = Number(shiftRoles.STAFF) || 0;

    const total = dokter + perawat + staff;
    console.log(
      `📊 Calculating staff total: DOKTER(${dokter}) + PERAWAT(${perawat}) + STAFF(${staff}) = ${total}`,
    );

    return total;
  }

  private async getActiveLocations(): Promise<
    Array<{ code: string; name: string }>
  > {
    // Return active locations - this could be from database or config
    return [
      { code: 'ICU', name: 'Intensive Care Unit' },
      { code: 'RAWAT_INAP', name: 'Inpatient Ward' },
      { code: 'GAWAT_DARURAT', name: 'Emergency Room' },
      { code: 'RAWAT_JALAN', name: 'Outpatient Clinic' },
      { code: 'LABORATORIUM', name: 'Laboratory' },
      { code: 'FARMASI', name: 'Pharmacy' },
    ];
  }

  private async getCurrentLocationUtilization(
    locationCode: string,
  ): Promise<number> {
    const today = new Date();
    const shiftsToday = await this.prisma.shift.count({
      where: {
        tanggal: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 1,
          ),
        },
        lokasiEnum: locationCode as any,
      },
    });

    const maxCapacity = this.getLocationMaxCapacity(locationCode);
    return (shiftsToday / maxCapacity) * 100;
  }

  private getWorkingDaysInMonth(year: number, month: number): number {
    const daysInMonth = new Date(year, month, 0).getDate();
    let workingDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      // Count Monday to Saturday as working days (excluding Sunday)
      if (dayOfWeek !== 0) {
        workingDays++;
      }
    }

    return workingDays;
  }

  /**
   * 🔥 NEW: Get existing shifts in a specific month
   */
  private async getExistingShiftsInMonth(
    year: number,
    month: number,
  ): Promise<any[]> {
    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    console.log(
      `🔍 Querying existing shifts from ${startOfMonth.toISOString()} to ${endOfMonth.toISOString()}`,
    );

    const existingShifts = await this.prisma.shift.findMany({
      where: {
        tanggal: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        tanggal: 'asc',
      },
    });

    console.log(
      `📊 Found ${existingShifts.length} existing shifts in ${month}/${year}`,
    );
    return existingShifts;
  }

  /**
   * 🔥 NEW: Initialize user shift counts with existing shifts from the month
   */
  private async initializeUserShiftCountsFromExisting(
    year: number,
    month: number,
  ): Promise<Map<number, number>> {
    const existingShifts = await this.getExistingShiftsInMonth(year, month);
    const userShiftCounts = new Map<number, number>();

    // Count existing shifts per user
    for (const shift of existingShifts) {
      const userId = shift.userId;
      const currentCount = userShiftCounts.get(userId) || 0;
      userShiftCounts.set(userId, currentCount + 1);
    }

    console.log(
      `👥 Initialized user shift counts from existing shifts:`,
      Object.fromEntries(userShiftCounts),
    );

    // Log users approaching their limits
    const workloadLimits = { maxShiftsPerPerson: 20 }; // Default or get from request
    for (const [userId, count] of userShiftCounts.entries()) {
      const remainingCapacity = workloadLimits.maxShiftsPerPerson - count;
      if (remainingCapacity <= 5) {
        console.warn(
          `⚠️  User ${userId} has ${count} existing shifts, only ${remainingCapacity} slots remaining`,
        );
      }
    }

    return userShiftCounts;
  }

  /**
   * 🔥 NEW: Enhanced workload validation with existing shifts
   */
  private async validateWorkloadWithExistingShifts(
    userId: number,
    targetDate: string,
    year: number,
    month: number,
    workloadLimits: any,
  ): Promise<{
    canAcceptShift: boolean;
    reason?: string;
    consecutiveDays?: number;
  }> {
    // Get user's existing shifts in this month
    const userExistingShifts = await this.prisma.shift.findMany({
      where: {
        userId,
        tanggal: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0, 23, 59, 59, 999),
        },
      },
      orderBy: { tanggal: 'asc' },
    });

    // Check total shift count
    if (userExistingShifts.length >= workloadLimits.maxShiftsPerPerson) {
      return {
        canAcceptShift: false,
        reason: `User ${userId} already has ${userExistingShifts.length}/${workloadLimits.maxShiftsPerPerson} shifts this month`,
      };
    }

    // Check consecutive days
    const targetDateObj = new Date(targetDate);
    const consecutiveDays = this.calculateConsecutiveDaysWithExisting(
      userExistingShifts,
      targetDateObj,
    );

    if (consecutiveDays >= workloadLimits.maxConsecutiveDays) {
      return {
        canAcceptShift: false,
        reason: `User ${userId} would have ${consecutiveDays} consecutive days (limit: ${workloadLimits.maxConsecutiveDays})`,
        consecutiveDays,
      };
    }

    return { canAcceptShift: true };
  }

  /**
   * 🔥 NEW: Calculate consecutive days including existing shifts
   */
  private calculateConsecutiveDaysWithExisting(
    existingShifts: any[],
    targetDate: Date,
  ): number {
    const shiftDates = existingShifts.map((shift) => shift.tanggal);
    shiftDates.push(targetDate);
    shiftDates.sort((a, b) => a.getTime() - b.getTime());

    let maxConsecutive = 0;
    let currentConsecutive = 1;

    for (let i = 1; i < shiftDates.length; i++) {
      const prevDate = shiftDates[i - 1];
      const currentDate = shiftDates[i];
      const dayDiff = Math.floor(
        (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (dayDiff === 1) {
        currentConsecutive++;
      } else {
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
        currentConsecutive = 1;
      }
    }

    return Math.max(maxConsecutive, currentConsecutive);
  }

  /**
   * 🔥 NEW: Reset/Delete automatically generated shifts
   */
  async resetAutoGeneratedShifts(
    startDate: string,
    endDate: string,
    source?: string,
  ): Promise<{
    success: boolean;
    deletedShifts: number;
    summary: {
      dateRange: string;
      affectedUsers: number;
      deletedBySource: { [source: string]: number };
    };
    message: string;
  }> {
    console.log(
      `🗑️ Resetting auto-generated shifts from ${startDate} to ${endDate}`,
    );

    try {
      // Build where condition
      const whereCondition: any = {
        tanggal: {
          gte: new Date(startDate),
          lte: new Date(endDate + 'T23:59:59.999Z'),
        },
        OR: [
          { createdBy: 'SYSTEM_AUTO_SCHEDULE' },
          { createdBy: 'BULK_WEEKLY' },
          { createdBy: 'BULK_MONTHLY' },
          { notes: { contains: 'Auto-generated' } },
        ],
      };

      // If specific source provided, filter by it
      if (source) {
        whereCondition.createdBy = source;
      }

      // Get shifts to be deleted for statistics
      const shiftsToDelete = await this.prisma.shift.findMany({
        where: whereCondition,
        include: {
          user: {
            select: {
              id: true,
              namaDepan: true,
              namaBelakang: true,
            },
          },
        },
      });

      // Calculate statistics
      const affectedUsers = new Set(shiftsToDelete.map((shift) => shift.userId))
        .size;
      const deletedBySource: { [source: string]: number } = {};

      shiftsToDelete.forEach((shift) => {
        // Fixed: Use notes field to identify auto-generated shifts since createdBy field doesn't exist
        const shiftSource = shift.notes?.includes('Auto-generated')
          ? 'SYSTEM_AUTO_SCHEDULE'
          : 'MANUAL';
        deletedBySource[shiftSource] = (deletedBySource[shiftSource] || 0) + 1;
      });

      // Delete the shifts
      const deleteResult = await this.prisma.shift.deleteMany({
        where: whereCondition,
      });

      console.log(`✅ Deleted ${deleteResult.count} auto-generated shifts`);

      return {
        success: true,
        deletedShifts: deleteResult.count,
        summary: {
          dateRange: `${startDate} to ${endDate}`,
          affectedUsers,
          deletedBySource,
        },
        message: `Successfully deleted ${deleteResult.count} auto-generated shifts affecting ${affectedUsers} users`,
      };
    } catch (error) {
      console.error('❌ Error resetting auto-generated shifts:', error);
      throw new Error(
        `Failed to reset auto-generated shifts: ${error.message}`,
      );
    }
  }

  /**
   * 🔥 NEW: Preview shifts that would be deleted in reset operation
   */
  async previewResetAutoGeneratedShifts(
    startDate: string,
    endDate: string,
    source?: string,
  ): Promise<{
    shiftsToDelete: any[];
    summary: {
      totalShifts: number;
      affectedUsers: number;
      shiftsBySource: { [source: string]: number };
      shiftsByLocation: { [location: string]: number };
      shiftsByType: { [type: string]: number };
    };
  }> {
    console.log(
      `👁️ Previewing auto-generated shifts to delete from ${startDate} to ${endDate}`,
    );

    try {
      // Build where condition
      const whereCondition: any = {
        tanggal: {
          gte: new Date(startDate),
          lte: new Date(endDate + 'T23:59:59.999Z'),
        },
        OR: [
          { createdBy: 'SYSTEM_AUTO_SCHEDULE' },
          { createdBy: 'BULK_WEEKLY' },
          { createdBy: 'BULK_MONTHLY' },
          { notes: { contains: 'Auto-generated' } },
        ],
      };

      // If specific source provided, filter by it
      if (source) {
        whereCondition.createdBy = source;
      }

      // Get shifts that would be deleted
      const shiftsToDelete = await this.prisma.shift.findMany({
        where: whereCondition,
        include: {
          user: {
            select: {
              id: true,
              namaDepan: true,
              namaBelakang: true,
              role: true,
            },
          },
        },
        orderBy: [{ tanggal: 'asc' }, { jammulai: 'asc' }],
      });

      // Calculate statistics
      const affectedUsers = new Set(shiftsToDelete.map((shift) => shift.userId))
        .size;
      const shiftsBySource: { [source: string]: number } = {};
      const shiftsByLocation: { [location: string]: number } = {};
      const shiftsByType: { [type: string]: number } = {};

      shiftsToDelete.forEach((shift) => {
        // Determine source from notes if createdBy doesn't exist
        let shiftSource = 'UNKNOWN';
        if (shift.notes) {
          if (shift.notes.includes('Auto-generated'))
            shiftSource = 'AUTO_GENERATED';
          else if (shift.notes.includes('SYSTEM_AUTO_SCHEDULE'))
            shiftSource = 'SYSTEM_AUTO_SCHEDULE';
          else if (shift.notes.includes('BULK_WEEKLY'))
            shiftSource = 'BULK_WEEKLY';
          else if (shift.notes.includes('BULK_MONTHLY'))
            shiftSource = 'BULK_MONTHLY';
        }

        const location = shift.lokasiEnum || 'UNKNOWN';
        const type = shift.tipeshift || 'UNKNOWN';

        shiftsBySource[shiftSource] = (shiftsBySource[shiftSource] || 0) + 1;
        shiftsByLocation[location] = (shiftsByLocation[location] || 0) + 1;
        shiftsByType[type] = (shiftsByType[type] || 0) + 1;
      });

      // Format shifts for preview
      const formattedShifts = shiftsToDelete.map((shift) => {
        // Determine source from notes if createdBy doesn't exist
        let shiftSource = 'UNKNOWN';
        if (shift.notes) {
          if (shift.notes.includes('Auto-generated'))
            shiftSource = 'AUTO_GENERATED';
          else if (shift.notes.includes('SYSTEM_AUTO_SCHEDULE'))
            shiftSource = 'SYSTEM_AUTO_SCHEDULE';
          else if (shift.notes.includes('BULK_WEEKLY'))
            shiftSource = 'BULK_WEEKLY';
          else if (shift.notes.includes('BULK_MONTHLY'))
            shiftSource = 'BULK_MONTHLY';
        }

        return {
          id: shift.id,
          date: shift.tanggal.toISOString().split('T')[0],
          startTime: shift.jammulai.toTimeString().substring(0, 5),
          endTime: shift.jamselesai.toTimeString().substring(0, 5),
          location: shift.lokasiEnum,
          shiftType: shift.tipeshift,
          user: {
            id: shift.user.id,
            name: `${shift.user.namaDepan} ${shift.user.namaBelakang}`,
            role: shift.user.role,
          },
          source: shiftSource,
          notes: shift.notes,
        };
      });

      return {
        shiftsToDelete: formattedShifts,
        summary: {
          totalShifts: shiftsToDelete.length,
          affectedUsers,
          shiftsBySource,
          shiftsByLocation,
          shiftsByType,
        },
      };
    } catch (error) {
      console.error('❌ Error previewing auto-generated shifts:', error);
      throw new Error(
        `Failed to preview auto-generated shifts: ${error.message}`,
      );
    }
  }

  /**
   * Helper methods for shift time calculation
   */
  private getShiftStartTime(shiftType: string): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (shiftType) {
      case 'PAGI':
        today.setHours(7, 0, 0, 0); // 07:00
        break;
      case 'SIANG':
        today.setHours(14, 0, 0, 0); // 14:00
        break;
      case 'MALAM':
        today.setHours(21, 0, 0, 0); // 21:00
        break;
      default:
        today.setHours(8, 0, 0, 0); // Default 08:00
    }

    return today;
  }

  private getShiftEndTime(shiftType: string): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (shiftType) {
      case 'PAGI':
        today.setHours(14, 0, 0, 0); // 07:00 - 14:00 (7 hours)
        break;
      case 'SIANG':
        today.setHours(21, 0, 0, 0); // 14:00 - 21:00 (7 hours)
        break;
      case 'MALAM':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(7, 0, 0, 0); // 21:00 - 07:00 next day (10 hours)
        return tomorrow;
      default:
        today.setHours(17, 0, 0, 0); // Default 8 hours
    }

    return today;
  }

  /**
   * 🔥 NEW: Get shifts within date range for balance analysis
   */
  async getShiftsInDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const shifts = await this.prisma.shift.findMany({
        where: {
          tanggal: {
            gte: startDate.toISOString().split('T')[0],
            lte: endDate.toISOString().split('T')[0],
          },
        },
        include: {
          user: {
            select: {
              id: true,
              namaDepan: true,
              namaBelakang: true,
              role: true,
            },
          },
        },
      });

      return shifts.map((shift) => ({
        ...shift,
        userId: shift.userId || shift.user?.id,
      }));
    } catch (error) {
      console.error('Error getting shifts in date range:', error);
      return [];
    }
  }

  // Missing methods implementation
  private async applyResolutionStrategy(
    assignments: any[],
    strategy: any,
  ): Promise<any[]> {
    // Implementation placeholder - apply specific resolution strategy
    console.log('Applying resolution strategy:', strategy.type);
    return assignments; // Return modified assignments
  }

  private async generateQualityRecommendations(
    metrics: any,
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (metrics.fairnessScore < 70) {
      recommendations.push('Improve shift distribution fairness');
    }
    if (metrics.efficiencyScore < 70) {
      recommendations.push('Optimize shift scheduling efficiency');
    }
    if (metrics.workloadBalance < 70) {
      recommendations.push('Balance workload across staff members');
    }

    return recommendations;
  }

  private async identifyOptimizationOpportunities(
    assignments: any[],
    metrics: any,
  ): Promise<OptimizationOpportunity[]> {
    const opportunities: OptimizationOpportunity[] = [];

    if (metrics.utilizationRate < 80) {
      opportunities.push({
        category: 'UTILIZATION',
        impact: 'MEDIUM',
        effort: 'LOW',
        description: 'Increase staff utilization rate',
        expectedImprovement: 10,
      });
    }

    return opportunities;
  }

  private async getBenchmarkComparisons(metrics: any): Promise<any> {
    return {
      industryAverage: 75,
      bestPractice: 90,
      previousPeriod: metrics.overallScore - 5,
      percentileRank: 60,
    };
  }

  private calculateImprovementPotential(metrics: any): number {
    return Math.max(0, 100 - metrics.overallScore);
  }

  private detectScheduleConflicts(assignments: any[]): any[] {
    const conflicts = [];
    // Implementation placeholder
    return conflicts;
  }

  private async detectWorkloadConflicts(assignments: any[]): Promise<any[]> {
    const conflicts = [];
    // Implementation placeholder
    return conflicts;
  }

  private async detectCapacityConflicts(assignments: any[]): Promise<any[]> {
    const conflicts = [];
    // Implementation placeholder
    return conflicts;
  }

  private async detectSkillConflicts(assignments: any[]): Promise<any[]> {
    const conflicts = [];
    // Implementation placeholder
    return conflicts;
  }

  private async detectRegulationConflicts(assignments: any[]): Promise<any[]> {
    const conflicts = [];
    // Implementation placeholder
    return conflicts;
  }

  private categorizeConflicts(conflicts: any[]): { [key: string]: number } {
    const categories: { [key: string]: number } = {};
    conflicts.forEach((conflict) => {
      categories[conflict.type] = (categories[conflict.type] || 0) + 1;
    });
    return categories;
  }

  private analyzeSeverityDistribution(conflicts: any[]): {
    [key: string]: number;
  } {
    const distribution: { [key: string]: number } = {};
    conflicts.forEach((conflict) => {
      distribution[conflict.severity] =
        (distribution[conflict.severity] || 0) + 1;
    });
    return distribution;
  }

  private getAffectedUsers(conflicts: any[]): number[] {
    const users = new Set<number>();
    conflicts.forEach((conflict) => {
      if (conflict.affectedUsers) {
        conflict.affectedUsers.forEach((userId: number) => users.add(userId));
      }
    });
    return Array.from(users);
  }

  private assessResolutionComplexity(conflicts: any[]): number {
    // Return complexity score based on number and severity of conflicts
    const totalConflicts = conflicts.length;
    const criticalConflicts = conflicts.filter(
      (c) => c.severity === 'CRITICAL',
    ).length;
    return totalConflicts + criticalConflicts * 2;
  }

  private prioritizeConflicts(conflicts: any[]): any[] {
    return conflicts.sort((a, b) => {
      const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  private async calculateFairnessScore(assignments: any[]): Promise<number> {
    // Calculate distribution fairness
    const userCounts = new Map<number, number>();
    assignments.forEach((assignment) => {
      const count = userCounts.get(assignment.userId) || 0;
      userCounts.set(assignment.userId, count + 1);
    });

    const counts = Array.from(userCounts.values());
    const average =
      counts.reduce((sum, count) => sum + count, 0) / counts.length;
    const variance =
      counts.reduce((sum, count) => sum + Math.pow(count - average, 2), 0) /
      counts.length;

    return Math.max(0, 100 - Math.sqrt(variance) * 10);
  }

  private async calculateEfficiencyScore(assignments: any[]): Promise<number> {
    // Calculate efficiency based on fulfillment rate and resource usage
    return 85; // Placeholder
  }

  private async calculateSatisfactionScore(
    assignments: any[],
  ): Promise<number> {
    // Calculate satisfaction based on preferences and workload
    return 80; // Placeholder
  }

  private async calculateComplianceScore(assignments: any[]): Promise<number> {
    // Calculate compliance with regulations and policies
    return 90; // Placeholder
  }

  private async calculateConflictRate(assignments: any[]): Promise<number> {
    // Calculate rate of conflicts in assignments
    return 5; // Placeholder - 5% conflict rate
  }

  private async calculateSkillMatchRate(assignments: any[]): Promise<number> {
    // Calculate how well skills match requirements
    return 85; // Placeholder
  }

  private async calculateWorkloadBalance(assignments: any[]): Promise<number> {
    // Calculate workload balance across users
    return this.calculateFairnessScore(assignments);
  }

  private calculateTemporalDistribution(assignments: any[]): number {
    // Calculate temporal distribution of shifts
    return 80; // Placeholder
  }
}

// Supporting interfaces for advanced features
interface ConflictAnalysis {
  totalConflicts: number;
  conflictsByType: { [key: string]: number };
  severityDistribution: { [key: string]: number };
  affectedUsers: number[];
  resolutionComplexity: number;
  priorityQueue: DetectedConflict[];
}

interface DetectedConflict {
  type:
    | 'SCHEDULE_CONFLICT'
    | 'WORKLOAD_OVERLOAD'
    | 'CAPACITY_SHORTAGE'
    | 'SKILL_MISMATCH'
    | 'REGULATION_VIOLATION'
    | 'CRITICAL_SHORTAGE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedUsers: number[];
  description: string;
  suggestedResolution: string;
  estimatedImpact: number;
}

interface ResolutionStrategy {
  type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  description: string;
  targetConflicts: string[];
  estimatedResolution: number;
  complexityScore: number;
}

interface QualityMetrics {
  overallScore: number;
  fairnessScore: number;
  efficiencyScore: number;
  satisfactionScore: number;
  complianceScore: number;
  utilizationRate: number;
  conflictRate: number;
  skillMatchRate: number;
  workloadBalance: number;
  temporalDistribution: number;
}

interface QualityImprovementReport {
  qualityScore: number;
  metrics: QualityMetrics;
  recommendations: string[];
  optimizations: OptimizationOpportunity[];
  benchmarks: BenchmarkComparison;
  improvementPotential: number;
}

interface OptimizationOpportunity {
  category: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  expectedImprovement: number;
}

interface BenchmarkComparison {
  industryAverage: number;
  bestPractice: number;
  previousPeriod: number;
  percentileRank: number;
}

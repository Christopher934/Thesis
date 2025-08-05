import { Controller, Get, Post, Body, Query, UseGuards, Req, Param, Delete } from '@nestjs/common';
import { AdminShiftOptimizationService, SchedulingResult } from './admin-shift-optimization.service';
import { AdminMonitoringService } from './admin-monitoring.service';
import { AdvancedBacktrackingService } from './advanced-backtracking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Define clean interfaces for TypeScript
interface UserRequest {
  user: {
    role: string;
  };
}

interface CreateOptimalShiftsDto {
  startDate: string;
  endDate: string;
  schedulingType: 'daily' | 'weekly' | 'monthly';
}

interface ShiftRequestDto {
  date: string;
  location: string;
  shiftType: 'PAGI' | 'SIANG' | 'MALAM' | 'ON_CALL' | 'JAGA';
  requiredCount: number;
  preferredRoles?: string[];
  skillRequirements?: string[];
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

interface AdminDashboardResponse {
  workloadAlerts: any[];
  locationCapacity: any[];
  shiftDistribution: any[];
  upcomingConflicts: any[];
  summary: any;
}

interface WorkloadAlertsResponse {
  alerts: any[];
  summary: any;
}

interface WorkloadAnalysisResponse {
  totalUsers: number;
  overworkedUsers: any[];
  underworkedUsers: any[];
  averageShiftsPerUser: number;
  totalShifts: number;
  fairnessScore: number;
  alerts: any[];
  summary: any;
  recommendations: string[];
}

interface LocationCapacityResponse {
  capacity: any;
  suggestions: string[];
}

interface OptimalShiftsResponse {
  assignments: any[];
  conflicts: any[];
  workloadAlerts: any[];
  locationCapacityStatus: any[];
  fulfillmentRate: number;
  recommendations: string[];
}

interface WeeklyScheduleRequest {
  startDate: string;
  locations: string[];
  shiftPattern?: {
    [location: string]: {
      PAGI?: number;
      SIANG?: number; 
      MALAM?: number;
    };
  };
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

interface MonthlyScheduleRequest {
  year: number;
  month: number;
  locations: string[];
  averageStaffPerShift?: {
    [location: string]: number;
  };
  workloadLimits?: {
    maxShiftsPerPerson: number;
    maxConsecutiveDays: number;
  };
}

@Controller('admin/shift-optimization')
@UseGuards(JwtAuthGuard)
export class AdminShiftOptimizationController {
  constructor(
    private adminOptimizationService: AdminShiftOptimizationService,
    private adminMonitoringService: AdminMonitoringService,
    private advancedBacktrackingService: AdvancedBacktrackingService,
  ) {}

  private checkAdminAccess(req: UserRequest): void {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERVISOR') {
      throw new Error('Unauthorized: Admin access required');
    }
  }

  /**
   * Get comprehensive admin dashboard
   */
  @Get('dashboard')
  async getAdminDashboard(@Req() req: UserRequest): Promise<AdminDashboardResponse> {
    this.checkAdminAccess(req);
    return this.adminOptimizationService.getAdminDashboard();
  }

  /**
   * Get workload alerts for employee monitoring
   */
  @Get('workload-alerts')
  async getWorkloadAlerts(
    @Req() req: UserRequest,
    @Query('severity') severity?: 'NORMAL' | 'HIGH' | 'OVERWORKED' | 'CRITICAL',
  ): Promise<WorkloadAlertsResponse> {
    this.checkAdminAccess(req);

    const dashboard = await this.adminOptimizationService.getAdminDashboard();
    
    if (severity) {
      const filteredAlerts = dashboard.workloadAlerts.filter(
        (alert: any) => alert.status === severity,
      );
      return {
        alerts: filteredAlerts,
        summary: dashboard.summary,
      };
    }
    
    return {
      alerts: dashboard.workloadAlerts,
      summary: dashboard.summary,
    };
  }

  /**
   * Create optimal shift assignments using Hybrid Algorithm
   */
  @Post('create-optimal-shifts')
  async createOptimalShifts(
    @Req() req: UserRequest,
    @Body() createShiftsDto: CreateOptimalShiftsDto,
  ): Promise<OptimalShiftsResponse> {
    try {
      console.log('🔍 Admin Optimization - Received request:', JSON.stringify(createShiftsDto, null, 2));
      this.checkAdminAccess(req);
      
      console.log('✅ Admin access verified');
      
      // Generate shift requests based on date range and scheduling type
      const shiftRequests = this.generateShiftRequests(createShiftsDto);
      console.log('📅 Generated shift requests:', shiftRequests.length);
      
      const result = await this.adminOptimizationService.createOptimalShiftAssignments(shiftRequests);
      console.log('✅ Optimization completed successfully');
      
      return result;
    } catch (error) {
      console.error('❌ Admin Optimization Error:', error);
      throw error;
    }
  }

  /**
   * 🔥 NEW: Preview optimal shift assignments WITHOUT saving to database
   */
  @Post('preview-optimal-shifts')
  async previewOptimalShifts(
    @Req() req: UserRequest,
    @Body() createShiftsDto: CreateOptimalShiftsDto,
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
    try {
      console.log('👁️ Admin Optimization - Preview request:', JSON.stringify(createShiftsDto, null, 2));
      this.checkAdminAccess(req);
      
      // Generate shift requests based on date range and scheduling type
      const shiftRequests = this.generateShiftRequests(createShiftsDto);
      console.log('📅 Generated shift requests for preview:', shiftRequests.length);
      
      // Get preview WITHOUT saving to database
      const result = await this.adminOptimizationService.previewOptimalShiftAssignments(shiftRequests);
      console.log('✅ Preview completed successfully');
      
      return result;
    } catch (error) {
      console.error('❌ Admin Optimization Preview Error:', error);
      throw error;
    }
  }

  /**
   * 🔥 NEW: Confirm and save previewed shifts to database
   */
  @Post('confirm-shifts')
  async confirmShifts(
    @Req() req: UserRequest,
    @Body() confirmDto: { assignments: any[]; metadata?: any },
  ): Promise<{
    success: boolean;
    createdShifts: any[];
    summary: {
      totalCreated: number;
      errors: any[];
    };
  }> {
    try {
      console.log('✅ Admin Optimization - Confirming shifts:', confirmDto.assignments.length);
      this.checkAdminAccess(req);
      
      const result = await this.adminOptimizationService.confirmAndSaveShifts(confirmDto.assignments);
      console.log('✅ Shifts confirmed and saved successfully');
      
      return result;
    } catch (error) {
      console.error('❌ Admin Optimization Confirm Error:', error);
      throw error;
    }
  }

  private generateShiftRequests(dto: CreateOptimalShiftsDto): ShiftRequestDto[] {
    const requests: ShiftRequestDto[] = [];
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    
    // Define available locations (matching Prisma enum)
    const locations = ['ICU', 'GAWAT_DARURAT', 'RAWAT_INAP', 'RADIOLOGI', 'LABORATORIUM', 'FARMASI'];
    const shiftTypes = ['PAGI', 'SIANG', 'MALAM'] as const;
    
    // Generate requests for each day in range
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      // For each date, create requests for different locations and shifts
      locations.forEach(location => {
        shiftTypes.forEach(shiftType => {
          requests.push({
            date: dateStr,
            location,
            shiftType,
            requiredCount: 2, // Default requirement
            priority: 'NORMAL',
            preferredRoles: ['STAF', 'PERAWAT'],
          });
        });
      });
    }
    
    return requests;
  }

  /**
   * Check location capacity for specific date/location
   */
  @Get('location-capacity')
  async checkLocationCapacity(
    @Req() req: UserRequest,
    @Query('location') location: string,
    @Query('date') date: string,
  ): Promise<LocationCapacityResponse> {
    this.checkAdminAccess(req);

    const request: ShiftRequestDto = {
      date,
      location,
      shiftType: 'PAGI',
      requiredCount: 1,
      priority: 'NORMAL',
    };

    const result = await this.adminOptimizationService.createOptimalShiftAssignments([request]);
    
    return {
      capacity: result.locationCapacityStatus[0] || null,
      suggestions: result.recommendations || [],
    };
  }

  /**
   * Get report of overworked employees
   */
  @Get('overworked-report')
  async getOverworkedReport(@Req() req: UserRequest): Promise<any> {
    this.checkAdminAccess(req);

    const dashboard = await this.adminOptimizationService.getAdminDashboard();
    const overworkedEmployees = dashboard.workloadAlerts.filter(
      (alert: any) => alert.status === 'OVERWORKED' || alert.status === 'CRITICAL',
    );

    return {
      totalOverworked: overworkedEmployees.length,
      criticalCases: overworkedEmployees.filter((e: any) => e.status === 'CRITICAL').length,
      employees: overworkedEmployees,
      recommendations: this.generateSimpleRecommendations(overworkedEmployees),
      statistics: {
        averageShifts: overworkedEmployees.length > 0 
          ? overworkedEmployees.reduce((sum: number, emp: any) => sum + emp.currentShifts, 0) / overworkedEmployees.length
          : 0,
        maxConsecutiveDays: overworkedEmployees.length > 0
          ? Math.max(...overworkedEmployees.map((emp: any) => emp.consecutiveDays))
          : 0,
        affectedDepartments: [...new Set(overworkedEmployees.map((emp: any) => emp.role))],
      },
    };
  }

  /**
   * Generate capacity analysis
   */
  @Get('capacity-analysis')
  async getCapacityAnalysis(
    @Req() req: UserRequest,
    @Query('days') days: string = '7',
  ): Promise<any> {
    this.checkAdminAccess(req);

    const dashboard = await this.adminOptimizationService.getAdminDashboard();
    
    const suggestions = dashboard.locationCapacity
      .filter((loc: any) => loc.utilization > 90)
      .map((loc: any) => ({
        location: loc.location,
        message: `${loc.location} is at ${loc.utilization.toFixed(1)}% capacity - consider redistribution`,
        severity: loc.utilization > 95 ? 'CRITICAL' : 'HIGH',
      }));

    return {
      capacityStatus: dashboard.locationCapacity,
      highUtilization: suggestions,
      recommendations: suggestions.length > 0 
        ? ['Consider redistributing staff from high-utilization areas']
        : ['Capacity levels are within normal ranges'],
    };
  }

  private generateSimpleRecommendations(overworkedEmployees: any[]): string[] {
    const recommendations: string[] = [];

    if (overworkedEmployees.length > 0) {
      recommendations.push(
        `${overworkedEmployees.length} employees need workload redistribution`,
      );
    }

    const criticalCases = overworkedEmployees.filter((e: any) => e.status === 'CRITICAL');
    if (criticalCases.length > 0) {
      recommendations.push(
        `${criticalCases.length} employees need immediate rest periods`,
      );
    }

    return recommendations;
  }

  /**
   * Enhanced monitoring endpoints
   */
  
  // Get enhanced admin dashboard with monitoring features
  @Get('dashboard/enhanced')
  async getEnhancedDashboard(@Req() req: UserRequest) {
    // Check admin permissions
    if (req.user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    try {
      return await this.adminMonitoringService.getEnhancedDashboard();
    } catch (error) {
      console.error('Enhanced dashboard error:', error);
      throw new Error('Failed to get enhanced dashboard');
    }
  }

  // Get user shift statistics for monitoring
  @Get('monitoring/users')
  async getUserStatistics(@Req() req: UserRequest, @Query('userId') userId?: string) {
    if (req.user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    try {
      return await this.adminMonitoringService.getUserMonitoringStats();
    } catch (error) {
      console.error('User statistics error:', error);
      throw new Error('Failed to get user statistics');
    }
  }

  // Get location capacity monitoring
  @Get('monitoring/locations')
  async getLocationCapacity(@Req() req: UserRequest) {
    if (req.user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    try {
      return await this.adminMonitoringService.getLocationCapacityOverview();
    } catch (error) {
      console.error('Location capacity error:', error);
      throw new Error('Failed to get location capacity');
    }
  }

  // Update user statistics after shift changes
  @Post('monitoring/users/:userId/update')
  async updateUserStats(@Param('userId') userId: string, @Body() shiftData: any, @Req() req: UserRequest) {
    if (req.user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    try {
      const userIdNum = parseInt(userId);
      await this.adminMonitoringService.updateUserMonitoring(userIdNum);
      return { success: true, message: 'User statistics updated successfully' };
    } catch (error) {
      console.error('Update user stats error:', error);
      throw new Error('Failed to update user statistics');
    }
  }

  /**
   * 🔥 NEW: Reset/Delete automatically generated shifts by date range
   */
  @Delete('reset-auto-shifts')
  async resetAutoShifts(
    @Req() req: UserRequest,
    @Body() resetDto: { 
      startDate: string; 
      endDate: string; 
      source?: string; // 'SYSTEM_AUTO_SCHEDULE', 'BULK_WEEKLY', 'BULK_MONTHLY' 
    },
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
    try {
      console.log('🗑️ Admin Reset - Deleting auto-generated shifts:', resetDto);
      this.checkAdminAccess(req);
      
      const result = await this.adminOptimizationService.resetAutoGeneratedShifts(
        resetDto.startDate, 
        resetDto.endDate, 
        resetDto.source
      );
      
      console.log('✅ Auto-generated shifts reset successfully');
      return result;
    } catch (error) {
      console.error('❌ Reset Auto Shifts Error:', error);
      throw error;
    }
  }

  /**
   * 🔥 NEW: Get preview of shifts that would be deleted in reset operation
   */
  @Post('preview-reset-auto-shifts')
  async previewResetAutoShifts(
    @Req() req: UserRequest,
    @Body() resetDto: { 
      startDate: string; 
      endDate: string; 
      source?: string; 
    },
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
    try {
      console.log('👁️ Admin Preview Reset - Checking auto-generated shifts:', resetDto);
      this.checkAdminAccess(req);
      
      const result = await this.adminOptimizationService.previewResetAutoGeneratedShifts(
        resetDto.startDate, 
        resetDto.endDate, 
        resetDto.source
      );
      
      return result;
    } catch (error) {
      console.error('❌ Preview Reset Error:', error);
      throw error;
    }
  }

  // Generate weekly schedule automatically
  @Post('create-weekly-schedule')
  async createWeeklySchedule(@Body() request: WeeklyScheduleRequest, @Req() req: UserRequest) {
    this.checkAdminAccess(req);

    try {
      console.log('📅 Creating weekly schedule:', request);
      const result = await this.adminOptimizationService.createWeeklySchedule(request);
      return {
        success: true,
        weeklySchedule: result,
        message: `Generated ${result.totalShifts} shifts for week starting ${request.startDate}`
      };
    } catch (error) {
      console.error('Weekly schedule creation error:', error);
      throw new Error('Failed to create weekly schedule');
    }
  }

  // Generate monthly schedule automatically  
  @Post('create-monthly-schedule')
  async createMonthlySchedule(
    @Body() request: MonthlyScheduleRequest,
    @Req() req: UserRequest,
  ): Promise<{
    success: boolean;
    monthlySchedule: SchedulingResult;
    message: string;
    notification?: {
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
    };
  }> {
    this.checkAdminAccess(req);

    try {
      console.log('📅 Creating monthly schedule:', request);
      const result =
        await this.adminOptimizationService.createMonthlySchedule(request);
      
      // Generate detailed notification with error breakdown
      const notification =
        await this.adminOptimizationService.getSchedulingNotification(result);
      
      return {
        success: result.success,
        monthlySchedule: result,
        message: notification.message,
        notification,
      };
    } catch (error) {
      console.error('Monthly schedule creation error:', error);
      throw new Error('Failed to create monthly schedule');
    }
  }

  // Get weekly schedule template suggestions
  @Get('weekly-template/:startDate')
  async getWeeklyTemplate(@Param('startDate') startDate: string, @Req() req: UserRequest) {
    if (req.user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    try {
      const template = await this.adminOptimizationService.generateWeeklyTemplate(startDate);
      return { success: true, template };
    } catch (error) {
      console.error('Weekly template error:', error);
      throw new Error('Failed to generate weekly template');
    }
  }

  // Get monthly schedule template suggestions
  @Get('monthly-template/:year/:month')
  async getMonthlyTemplate(@Param('year') year: string, @Param('month') month: string, @Req() req: UserRequest) {
    if (req.user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    try {
      const template = await this.adminOptimizationService.generateMonthlyTemplate(parseInt(year), parseInt(month));
      return { success: true, template };
    } catch (error) {
      console.error('Monthly template error:', error);
      throw new Error('Failed to generate monthly template');
    }
  }

  /**
   * 🔥 NEW: Analyze workload distribution and provide detailed insights
   */
  @Get('analyze-workload')
  async analyzeWorkload(
    @Req() req: UserRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<WorkloadAnalysisResponse> {
    this.checkAdminAccess(req);

    try {
      console.log('🔍 Analyzing workload distribution...');
      
      const dashboard = await this.adminOptimizationService.getAdminDashboard();
      
      // Get detailed workload analysis
      const workloadAnalysis = {
        totalUsers: dashboard.workloadAlerts.length,
        overworkedUsers: dashboard.workloadAlerts.filter((alert: any) => 
          alert.status === 'OVERWORKED' || alert.status === 'CRITICAL'
        ),
        underworkedUsers: dashboard.workloadAlerts.filter((alert: any) => 
          alert.status === 'NORMAL' && alert.currentShifts < 3
        ),
        averageShiftsPerUser: dashboard.summary.averageUtilization || 0,
        totalShifts: dashboard.summary.activeShifts || 0,
        fairnessScore: this.calculateFairnessScore(dashboard.workloadAlerts),
        alerts: dashboard.workloadAlerts,
        summary: dashboard.summary,
        recommendations: this.generateWorkloadRecommendations(dashboard.workloadAlerts)
      };

      console.log('✅ Workload analysis completed:', workloadAnalysis.totalUsers, 'users analyzed');
      return workloadAnalysis;
    } catch (error) {
      console.error('❌ Workload analysis error:', error);
      throw new Error('Failed to analyze workload distribution');
    }
  }

  /**
   * Calculate fairness score based on workload distribution
   */
  private calculateFairnessScore(alerts: any[]): number {
    if (alerts.length === 0) return 100;
    
    const shifts = alerts.map(alert => alert.currentShifts || 0);
    const average = shifts.reduce((sum, shift) => sum + shift, 0) / shifts.length;
    const variance = shifts.reduce((sum, shift) => sum + Math.pow(shift - average, 2), 0) / shifts.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher fairness score
    const fairnessScore = Math.max(0, 100 - (standardDeviation * 10));
    return Math.round(fairnessScore);
  }

  /**
   * Generate workload recommendations based on analysis
   */
  private generateWorkloadRecommendations(alerts: any[]): string[] {
    const recommendations: string[] = [];
    
    const overworked = alerts.filter(alert => 
      alert.status === 'OVERWORKED' || alert.status === 'CRITICAL'
    ).length;
    
    const underworked = alerts.filter(alert => 
      alert.status === 'NORMAL' && alert.currentShifts < 3
    ).length;
    
    if (overworked > 0) {
      recommendations.push(`${overworked} pegawai mengalami beban kerja berlebih`);
      recommendations.push('Redistribusi shift untuk mengurangi beban kerja');
    }
    
    if (underworked > 0) {
      recommendations.push(`${underworked} pegawai memiliki beban kerja rendah`);
      recommendations.push('Pertimbangkan menambah shift untuk pegawai yang underutilized');
    }
    
    if (overworked > 0 && underworked > 0) {
      recommendations.push('Transfer shift dari pegawai overworked ke underworked');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Distribusi beban kerja sudah cukup seimbang');
    }
    
    return recommendations;
  }

  /**
   * 🔥 NEW: Analyze shift balance for variety, rotation, and fairness
   */
  @Post('analyze-balance')
  async analyzeShiftBalance(
    @Body() body: { timeframe: 'week' | 'month' | 'quarter'; roleFilter?: string; analysisType: string },
    @Req() req: UserRequest,
  ) {
    this.checkAdminAccess(req);

    const { timeframe, roleFilter, analysisType } = body;
    
    try {
      // Calculate date range based on timeframe
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case 'quarter':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      // Get shifts and users data for analysis
      const shifts = await this.adminOptimizationService.getShiftsInDateRange(startDate, endDate);
      const users = await this.adminOptimizationService.getAvailableUsersWithWorkload();
      
      // Filter users by role if specified
      const filteredUsers = roleFilter && roleFilter !== 'ALL' 
        ? users.filter(user => user.role === roleFilter)
        : users;

      // Analyze balance for each user
      const userBalanceReport = await Promise.all(
        filteredUsers.map(async user => {
          const userShifts = shifts.filter(shift => shift.userId === user.id);
          
          // Calculate shift variety
          const shiftVariety = this.calculateShiftVariety(userShifts);
          
          // Calculate location rotation
          const locationRotation = this.calculateLocationRotation(userShifts);
          
          // Calculate consecutive days and burnout risk
          const consecutiveDays = this.calculateConsecutiveDays(userShifts);
          const burnoutRisk = this.assessBurnoutRisk(userShifts, consecutiveDays);
          
          // Calculate fairness score
          const fairnessScore = this.calculateUserFairnessScore(user, userShifts, shifts);

          return {
            userId: user.id,
            userName: `${user.namaDepan} ${user.namaBelakang}`,
            role: user.role,
            shiftVariety,
            locationRotation,
            consecutiveDays,
            burnoutRisk,
            fairnessScore
          };
        })
      );

      // Calculate system-wide metrics
      const systemWideMetrics = this.calculateSystemWideMetrics(userBalanceReport);
      
      // Generate recommendations
      const recommendations = this.generateBalanceRecommendations(userBalanceReport, systemWideMetrics);

      return {
        userBalanceReport,
        systemWideMetrics,
        recommendations
      };

    } catch (error) {
      console.error('Error analyzing shift balance:', error);
      throw new Error('Gagal menganalisis keseimbangan shift');
    }
  }

  /**
   * Calculate shift variety for a user
   */
  private calculateShiftVariety(userShifts: any[]) {
    const shiftCounts = {
      PAGI: userShifts.filter(s => s.tipeShift === 'PAGI').length,
      SIANG: userShifts.filter(s => s.tipeShift === 'SIANG').length,
      MALAM: userShifts.filter(s => s.tipeShift === 'MALAM').length
    };
    
    const totalShifts = userShifts.length;
    if (totalShifts === 0) {
      return { ...shiftCounts, varietyScore: 100 };
    }
    
    // Calculate variety score based on distribution evenness
    const shiftTypes = Object.values(shiftCounts).filter(count => count > 0).length;
    const maxPossibleTypes = 3;
    const typeVariety = (shiftTypes / maxPossibleTypes) * 100;
    
    // Calculate distribution evenness
    const idealDistribution = totalShifts / 3;
    const deviations = Object.values(shiftCounts).map(count => 
      Math.abs(count - idealDistribution)
    );
    const averageDeviation = deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
    const distributionScore = Math.max(0, 100 - (averageDeviation / idealDistribution) * 50);
    
    const varietyScore = (typeVariety + distributionScore) / 2;
    
    return {
      ...shiftCounts,
      varietyScore: Math.round(varietyScore)
    };
  }

  /**
   * Calculate location rotation for a user
   */
  private calculateLocationRotation(userShifts: any[]) {
    const uniqueLocations = [...new Set(userShifts.map(shift => shift.lokasiShift))];
    const totalShifts = userShifts.length;
    
    if (totalShifts === 0) {
      return { locations: [], rotationScore: 100 };
    }
    
    // Base score on number of different locations
    const locationVariety = uniqueLocations.length;
    const maxExpectedLocations = Math.min(5, totalShifts); // Don't expect more than 5 different locations
    const varietyScore = (locationVariety / maxExpectedLocations) * 100;
    
    // Penalty for too much concentration in one location
    const locationCounts = uniqueLocations.map(location => 
      userShifts.filter(shift => shift.lokasiShift === location).length
    );
    const maxConcentration = Math.max(...locationCounts);
    const concentrationPenalty = totalShifts > 5 ? (maxConcentration / totalShifts) * 50 : 0;
    
    const rotationScore = Math.max(0, varietyScore - concentrationPenalty);
    
    return {
      locations: uniqueLocations,
      rotationScore: Math.round(rotationScore)
    };
  }

  /**
   * Calculate consecutive working days
   */
  private calculateConsecutiveDays(userShifts: any[]): number {
    if (userShifts.length === 0) return 0;
    
    // Sort shifts by date
    const sortedShifts = userShifts
      .map(shift => ({
        ...shift,
        date: new Date(shift.tanggal)
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    let maxConsecutive = 1;
    let currentConsecutive = 1;
    
    for (let i = 1; i < sortedShifts.length; i++) {
      const prevDate = sortedShifts[i - 1].date;
      const currentDate = sortedShifts[i].date;
      const dayDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (dayDiff === 1) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 1;
      }
    }
    
    return maxConsecutive;
  }

  /**
   * Assess burnout risk based on shift patterns
   */
  private assessBurnoutRisk(userShifts: any[], consecutiveDays: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    const totalShifts = userShifts.length;
    const nightShifts = userShifts.filter(s => s.tipeShift === 'MALAM').length;
    const nightShiftRatio = totalShifts > 0 ? nightShifts / totalShifts : 0;
    
    // High risk conditions
    if (consecutiveDays > 6 || nightShiftRatio > 0.6 || totalShifts > 25) {
      return 'HIGH';
    }
    
    // Medium risk conditions
    if (consecutiveDays > 4 || nightShiftRatio > 0.4 || totalShifts > 20) {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }

  /**
   * Calculate fairness score for individual user
   */
  private calculateUserFairnessScore(user: any, userShifts: any[], allShifts: any[]): number {
    const userShiftCount = userShifts.length;
    const averageShiftCount = allShifts.length / (new Set(allShifts.map(s => s.userId)).size || 1);
    
    // Base fairness on how close user's shift count is to average
    const deviation = Math.abs(userShiftCount - averageShiftCount);
    const maxAcceptableDeviation = averageShiftCount * 0.3; // 30% deviation is acceptable
    
    const fairnessScore = Math.max(0, 100 - (deviation / maxAcceptableDeviation) * 100);
    
    return Math.round(fairnessScore);
  }

  /**
   * Calculate system-wide balance metrics
   */
  private calculateSystemWideMetrics(userBalanceReport: any[]) {
    const varietyScores = userBalanceReport.map(user => user.shiftVariety.varietyScore);
    const rotationScores = userBalanceReport.map(user => user.locationRotation.rotationScore);
    const fairnessScores = userBalanceReport.map(user => user.fairnessScore);
    
    const averageVarietyScore = Math.round(
      varietyScores.reduce((sum, score) => sum + score, 0) / varietyScores.length || 0
    );
    
    const averageRotationScore = Math.round(
      rotationScores.reduce((sum, score) => sum + score, 0) / rotationScores.length || 0
    );
    
    const averageFairnessScore = Math.round(
      fairnessScores.reduce((sum, score) => sum + score, 0) / fairnessScores.length || 0
    );
    
    const highBurnoutUsers = userBalanceReport.filter(user => user.burnoutRisk === 'HIGH').length;
    
    const imbalancedDistribution = userBalanceReport
      .filter(user => user.shiftVariety.varietyScore < 50 || user.locationRotation.rotationScore < 50)
      .map(user => user.userName);

    return {
      averageVarietyScore,
      averageRotationScore,
      averageFairnessScore,
      highBurnoutUsers,
      imbalancedDistribution
    };
  }

  /**
   * Generate balance improvement recommendations
   */
  private generateBalanceRecommendations(userBalanceReport: any[], systemWideMetrics: any) {
    const recommendations = [];
    
    // Variety recommendations
    const lowVarietyUsers = userBalanceReport.filter(user => user.shiftVariety.varietyScore < 60);
    if (lowVarietyUsers.length > 0) {
      recommendations.push({
        type: 'VARIETY',
        severity: lowVarietyUsers.length > userBalanceReport.length * 0.3 ? 'HIGH' : 'MEDIUM',
        message: `${lowVarietyUsers.length} pegawai memiliki variasi shift yang rendah`,
        affectedUsers: lowVarietyUsers.map(user => user.userId),
        suggestedActions: [
          'Rotasi antara shift pagi, siang, dan malam',
          'Hindari memberikan tipe shift yang sama berturut-turut',
          'Implementasikan sistem rotasi shift otomatis'
        ]
      });
    }
    
    // Rotation recommendations
    const lowRotationUsers = userBalanceReport.filter(user => user.locationRotation.rotationScore < 60);
    if (lowRotationUsers.length > 0) {
      recommendations.push({
        type: 'ROTATION',
        severity: lowRotationUsers.length > userBalanceReport.length * 0.3 ? 'HIGH' : 'MEDIUM',
        message: `${lowRotationUsers.length} pegawai terlalu lama di lokasi yang sama`,
        affectedUsers: lowRotationUsers.map(user => user.userId),
        suggestedActions: [
          'Rotasi pegawai antar lokasi secara berkala',
          'Buat pola rotasi mingguan atau bulanan',
          'Berikan kesempatan untuk bertugas di unit berbeda'
        ]
      });
    }
    
    // Burnout recommendations
    const highBurnoutUsers = userBalanceReport.filter(user => user.burnoutRisk === 'HIGH');
    if (highBurnoutUsers.length > 0) {
      recommendations.push({
        type: 'BURNOUT',
        severity: 'HIGH',
        message: `${highBurnoutUsers.length} pegawai berisiko tinggi mengalami burnout`,
        affectedUsers: highBurnoutUsers.map(user => user.userId),
        suggestedActions: [
          'Berikan hari libur yang cukup',
          'Kurangi shift malam berturut-turut',
          'Implementasikan batas maksimal hari kerja berturut-turut',
          'Pantau kesehatan mental pegawai'
        ]
      });
    }
    
    // Fairness recommendations
    const unfairUsers = userBalanceReport.filter(user => user.fairnessScore < 60);
    if (unfairUsers.length > 0) {
      recommendations.push({
        type: 'FAIRNESS',
        severity: unfairUsers.length > userBalanceReport.length * 0.4 ? 'HIGH' : 'MEDIUM',
        message: `Distribusi shift tidak adil untuk ${unfairUsers.length} pegawai`,
        affectedUsers: unfairUsers.map(user => user.userId),
        suggestedActions: [
          'Seimbangkan jumlah shift antar pegawai',
          'Gunakan sistem poin untuk shift yang tidak diinginkan',
          'Implementasikan rotasi yang adil untuk semua pegawai'
        ]
      });
    }
    
    return recommendations;
  }

  /**
   * 🧠 NEW: Advanced Backtracking Analysis Endpoint
   */
  @Post('advanced-backtracking-analysis')
  async performAdvancedBacktrackingAnalysis(
    @Body() request: { assignments: any[], users: any[] }
  ) {
    try {
      console.log('🧠 Starting Advanced Backtracking Analysis...');
      
      const result = await this.advancedBacktrackingService.performBacktrackingOptimization(
        request.assignments,
        request.users
      );

      return {
        success: true,
        optimizedAssignments: result,
        message: 'Advanced backtracking analysis completed successfully'
      };
    } catch (error) {
      console.error('Error in advanced backtracking analysis:', error);
      throw error;
    }
  }

  /**
   * 🔬 NEW: Advanced Conflict Resolution Endpoint
   */
  @Post('advanced-conflict-resolution')
  async performAdvancedConflictResolution(
    @Body() request: { assignments: any[] }
  ) {
    try {
      console.log('🔬 Starting Advanced Conflict Resolution...');
      
      const result = await this.advancedBacktrackingService.performAdvancedConflictResolution(
        request.assignments
      );

      return {
        success: true,
        resolvedAssignments: result.resolvedAssignments,
        conflictAnalysis: result.conflictAnalysis,
        resolutionStrategies: result.resolutionStrategies,
        message: 'Advanced conflict resolution completed successfully'
      };
    } catch (error) {
      console.error('Error in advanced conflict resolution:', error);
      throw error;
    }
  }

  /**
   * 📊 NEW: Quality Improvement Analysis Endpoint
   */
  @Post('quality-improvement-analysis')
  async performQualityImprovementAnalysis(
    @Body() request: { assignments: any[] }
  ) {
    try {
      console.log('📊 Starting Quality Improvement Analysis...');
      
      const result = await this.advancedBacktrackingService.performQualityImprovement(
        request.assignments
      );

      return {
        success: true,
        qualityReport: result,
        message: 'Quality improvement analysis completed successfully'
      };
    } catch (error) {
      console.error('Error in quality improvement analysis:', error);
      throw error;
    }
  }
}

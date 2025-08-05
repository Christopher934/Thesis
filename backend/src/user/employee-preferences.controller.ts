import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmployeePreferencesService } from './employee-preferences.service';
import { UpdateEmployeePreferencesDto } from './dto/employee-preferences.dto';

// Define UserRequest interface locally (since auth.types doesn't exist)
interface UserRequest {
  user: {
    role: string;
    id: number;
    userId?: number;
  };
}

@Controller('employee-preferences')
@UseGuards(JwtAuthGuard)
export class EmployeePreferencesController {
  constructor(
    private readonly employeePreferencesService: EmployeePreferencesService,
  ) {}

  /**
   * Get current user's preferences
   */
  @Get('my-preferences')
  async getMyPreferences(@Req() req: UserRequest) {
    const preferences = await this.employeePreferencesService.getEmployeePreferences(
      req.user.id,
    );
    return {
      success: true,
      data: preferences,
    };
  }

  /**
   * Update current user's preferences
   */
  @Put('my-preferences')
  async updateMyPreferences(
    @Req() req: UserRequest,
    @Body() dto: UpdateEmployeePreferencesDto,
  ) {
    const preferences = await this.employeePreferencesService.updateEmployeePreferences(
      req.user.id,
      dto,
    );
    return {
      success: true,
      data: preferences,
      message: 'Preferences updated successfully',
    };
  }

  /**
   * Admin: Get any employee's preferences
   */
  @Get('user/:userId')
  async getEmployeePreferences(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: UserRequest,
  ) {
    // Check if user is admin
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERVISOR') {
      throw new Error('Unauthorized: Admin access required');
    }

    const preferences = await this.employeePreferencesService.getEmployeePreferences(
      userId,
    );
    return {
      success: true,
      data: preferences,
    };
  }

  /**
   * Admin: Update any employee's preferences
   */
  @Put('user/:userId')
  async updateEmployeePreferences(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateEmployeePreferencesDto,
    @Req() req: UserRequest,
  ) {
    // Check if user is admin
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERVISOR') {
      throw new Error('Unauthorized: Admin access required');
    }

    const preferences = await this.employeePreferencesService.updateEmployeePreferences(
      userId,
      dto,
    );
    return {
      success: true,
      data: preferences,
      message: 'Employee preferences updated successfully',
    };
  }

  /**
   * Admin: Get all employees with their preferences for scheduling
   */
  @Get('all-employees')
  async getAllEmployeesWithPreferences(@Req() req: UserRequest) {
    // Check if user is admin
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERVISOR') {
      throw new Error('Unauthorized: Admin access required');
    }

    const employees = await this.employeePreferencesService.getAllEmployeesWithPreferences();
    return {
      success: true,
      data: employees,
      count: employees.length,
    };
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ShiftService } from './shift.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('shifts')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createShiftDto: CreateShiftDto) {
    return this.shiftService.create(createShiftDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.shiftService.findAll();
  }

  /**
   * Get all available shift types based on RSUD Anugerah official regulations
   */
  @UseGuards(JwtAuthGuard)
  @Get('types')
  getShiftTypes() {
    return this.shiftService.getShiftTypes();
  }

  /**
   * Get shift schedules for a specific shift type
   */
  @UseGuards(JwtAuthGuard)
  @Get('types/:shiftType')
  getShiftTypeSchedules(@Param('shiftType') shiftType: string) {
    return this.shiftService.getShiftTypeSchedules(shiftType);
  }

  /**
   * Get available shift options for a specific date and shift type
   */
  @UseGuards(JwtAuthGuard)
  @Get('types/:shiftType/options')
  getShiftOptionsForDate(
    @Param('shiftType') shiftType: string,
    @Query('date') date: string,
  ) {
    return this.shiftService.getShiftOptionsForDate(shiftType, date);
  }

  /**
   * Create shift using official RSUD shift type system
   */
  @UseGuards(JwtAuthGuard)
  @Post('with-type')
  createWithShiftType(
    @Body()
    createShiftDto: CreateShiftDto & {
      shiftType: string;
      shiftOption: string;
    },
  ) {
    return this.shiftService.createWithShiftType(createShiftDto);
  }

  /**
   * Validate if a shift time is valid for the given shift type and date
   */
  @UseGuards(JwtAuthGuard)
  @Post('validate')
  validateShiftForDate(
    @Body()
    validateDto: {
      shiftType: string;
      date: string;
      jammulai: string;
      jamselesai: string;
    },
  ) {
    return this.shiftService.validateShiftForDate(
      validateDto.shiftType,
      validateDto.date,
      validateDto.jammulai,
      validateDto.jamselesai,
    );
  }

  /**
   * Get shifts by installation type
   */
  @UseGuards(JwtAuthGuard)
  @Get('installation/:installasi')
  getShiftsByInstallation(
    @Param('installasi') installasi: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.shiftService.getShiftsByInstallation(
      installasi,
      startDate,
      endDate,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shiftService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateShiftDto: UpdateShiftDto) {
    return this.shiftService.update(+id, updateShiftDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete-all')
  removeAll() {
    return this.shiftService.removeAll();
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shiftService.remove(+id);
  }

  /**
   * 🔥 NEW: Bulk Scheduling Preview - Generate preview without saving
   */
  @UseGuards(JwtAuthGuard)
  @Post('bulk-preview')
  async generateBulkPreview(@Body() bulkConfig: any) {
    return this.shiftService.generateBulkSchedulePreview(bulkConfig);
  }

  /**
   * 🔥 NEW: Bulk Scheduling - Create multiple shifts at once
   */
  @UseGuards(JwtAuthGuard)
  @Post('bulk-create')
  async createBulkSchedule(@Body() bulkConfig: any) {
    return this.shiftService.createBulkSchedule(bulkConfig);
  }
}

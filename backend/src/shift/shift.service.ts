import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationIntegrationService } from '../notifikasi/notification-integration.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { 
  getShiftTypeConfig, 
  getAllShiftTypes, 
  getShiftScheduleForDay, 
  validateShiftTime,
  getScheduleForDate,
  getShiftOptionsForDate
} from './shift-type.config';

@Injectable()
export class ShiftService {
  constructor(
    private prisma: PrismaService,
    private notificationService?: NotificationIntegrationService,
  ) {}

  async create(createShiftDto: CreateShiftDto) {
    if (!createShiftDto) {
      throw new BadRequestException('Shift data is required');
    }
    try {
      // Parse the date string to a Date object
      const tanggalDate = new Date(createShiftDto.tanggal);

      // Check if the user exists before creating the shift
      let userId: number | undefined = createShiftDto.userId;

      // If no userId is provided, try to find the user by idpegawai (username for now)
      if (!userId && createShiftDto.idpegawai) {
        const user = await this.prisma.user.findFirst({
          where: { username: createShiftDto.idpegawai },
        });

        if (user) {
          userId = user.id;
        } else {
          throw new Error(
            'Cannot create shift: User with provided employee ID does not exist',
          );
        }
      } else if (userId) {
        // Verify the user exists
        const userExists = await this.prisma.user.findUnique({
          where: { id: userId },
        });

        if (!userExists) {
          throw new Error(
            'Cannot create shift: User with provided ID does not exist',
          );
        }
      } else {
        throw new Error('Cannot create shift: No user ID or employee ID provided');
      }

      // Create DateTime objects for time fields
      const parseTimeToDate = (timeString: string, baseDate: Date): Date => {
        const [hours, minutes] = timeString.split(':').map(num => parseInt(num, 10));
        const dateTime = new Date(baseDate);
        dateTime.setHours(hours, minutes || 0, 0, 0);
        return dateTime;
      };

      const jammulaiDate = parseTimeToDate(createShiftDto.jammulai, tanggalDate);
      const jamselesaiDate = parseTimeToDate(createShiftDto.jamselesai, tanggalDate);

      // Handle overnight shifts (end time before start time)
      if (jamselesaiDate <= jammulaiDate) {
        jamselesaiDate.setDate(jamselesaiDate.getDate() + 1);
      }

      // Create a new shift in the database
      const shift = await this.prisma.shift.create({
        data: {
          tanggal: tanggalDate,
          jammulai: jammulaiDate,
          jamselesai: jamselesaiDate,
          lokasishift: createShiftDto.lokasishift,
          // Try to map string lokasi to enum if possible
          lokasiEnum: createShiftDto.lokasiEnum || undefined,
          tipeshift: createShiftDto.tipeshift,
          // Try to map string tipe to enum if possible
          tipeEnum: createShiftDto.tipeEnum || undefined,
          userId: userId, // Use the validated userId
        },
        include: {
          user: {
            select: {
              id: true,
              namaDepan: true,
              namaBelakang: true,
              username: true,
              employeeId: true,
            },
          },
        },
      });

      // Format the response
      return {
        ...shift,
        tanggal: shift.tanggal.toISOString().split('T')[0], // Format date as YYYY-MM-DD
        nama: shift.user
          ? `${shift.user.namaDepan} ${shift.user.namaBelakang}`
          : undefined,
        idpegawai: shift.user?.username, // Include for compatibility
      };
    } catch (error) {
      console.error('[ShiftService][create] Error:', error);
      throw new InternalServerErrorException(error.message || 'Failed to create shift');
    }
  }

  async findAll() {
    try {
      // Get all shifts with user information
      const shifts = await this.prisma.shift.findMany({
        include: {
          user: {
            select: {
              id: true,
              employeeId: true,
              namaDepan: true,
              namaBelakang: true,
              username: true,
            },
          },
        },
      });

      // Jika ada data shift dari database, return itu
      if (shifts && shifts.length > 0) {
        // Map the shifts to include the user's full name
        return shifts.map((shift) => ({
          ...shift,
          nama: shift.user
            ? `${shift.user.namaDepan} ${shift.user.namaBelakang}`
            : undefined,
        }));
      }

      // Return empty array if no data found
      return [];
    } catch (error) {
      console.error('[ShiftService][findAll] Error:', error);
      throw new InternalServerErrorException(error.message || 'Failed to get shifts');
    }
  }

  async findOne(id: number) {
    if (!id) {
      throw new BadRequestException('Shift id is required');
    }
    try {
      const shift = await this.prisma.shift.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              employeeId: true,
              namaDepan: true,
              namaBelakang: true,
              username: true,
            },
          },
        },
      });

      if (!shift) {
        throw new NotFoundException(`Shift with ID ${id} not found`);
      }

      return {
        ...shift,
        nama: shift.user
          ? `${shift.user.namaDepan} ${shift.user.namaBelakang}`
          : undefined,
      };
    } catch (error) {
      console.error('[ShiftService][findOne] Error:', error);
      throw new InternalServerErrorException(error.message || 'Failed to get shift');
    }
  }

  async update(id: number, updateShiftDto: UpdateShiftDto) {
    if (!id || !updateShiftDto) {
      throw new BadRequestException('Shift id and update data are required');
    }
    try {
      // Check if the shift exists
      const existingShift = await this.prisma.shift.findUnique({
        where: { id },
      });

      if (!existingShift) {
        throw new NotFoundException(`Shift with ID ${id} not found`);
      }

      // Validate user if userId or employeeId is being updated
      let validatedUserId = existingShift.userId;

      if (updateShiftDto.userId) {
        // If userId is provided, validate it exists
        const userExists = await this.prisma.user.findUnique({
          where: { id: updateShiftDto.userId },
        });

        if (!userExists) {
          throw new Error(
            'Cannot update shift: User with provided ID does not exist',
          );
        }

        validatedUserId = updateShiftDto.userId;
      } else if (updateShiftDto.idpegawai) {
        // If idpegawai is provided, find the corresponding user by username for now
        const user = await this.prisma.user.findFirst({
          where: { username: updateShiftDto.idpegawai },
        });

        if (!user) {
          throw new Error(
            'Cannot update shift: User with provided employee ID does not exist',
          );
        }

        validatedUserId = user.id;
      }

      // Prepare tanggal data - handle possible undefined
      const tanggalData = updateShiftDto.tanggal
        ? new Date(updateShiftDto.tanggal)
        : undefined;

      // Update the shift
      const shift = await this.prisma.shift.update({
        where: { id },
        data: {
          tanggal: tanggalData,
          jammulai: updateShiftDto.jammulai,
          jamselesai: updateShiftDto.jamselesai,
          lokasishift: updateShiftDto.lokasishift,
          // Update the enum field if provided
          lokasiEnum: updateShiftDto.lokasiEnum,
          tipeshift: updateShiftDto.tipeshift,
          // Update the enum field if provided
          tipeEnum: updateShiftDto.tipeEnum,
          userId: validatedUserId,
        },
        include: {
          user: {
            select: {
              id: true,
              namaDepan: true,
              namaBelakang: true,
              username: true,
              employeeId: true,
            },
          },
        },
      });

      return {
        ...shift,
        nama: shift.user
          ? `${shift.user.namaDepan} ${shift.user.namaBelakang}`
          : undefined,
      };
    } catch (error) {
      console.error('[ShiftService][update] Error:', error);
      throw new InternalServerErrorException(error.message || 'Failed to update shift');
    }
  }

  async remove(id: number) {
    if (!id) {
      throw new BadRequestException('Shift id is required');
    }
    try {
      // Check if the shift exists
      const shift = await this.prisma.shift.findUnique({
        where: { id },
      });

      if (!shift) {
        throw new NotFoundException(`Shift with ID ${id} not found`);
      }

      // Delete the shift
      await this.prisma.shift.delete({
        where: { id },
      });

      return { message: `Shift with ID ${id} has been deleted` };
    } catch (error) {
      console.error('[ShiftService][remove] Error:', error);
      throw new InternalServerErrorException(error.message || 'Failed to delete shift');
    }
  }

  /**
   * Get all available shift types based on RSUD Anugerah official regulations
   */
  async getShiftTypes() {
    try {
      const shiftTypes = getAllShiftTypes();
      return shiftTypes.map(type => ({
        type: type.type,
        description: type.description,
        installasi: type.installasi,
        hasRotatingBreaks: type.hasRotatingBreaks,
        notes: type.notes,
        shiftsCount: type.shifts.length
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get shift schedules for a specific shift type
   */
  async getShiftTypeSchedules(shiftType: string) {
    try {
      const config = getShiftTypeConfig(shiftType);
      if (!config) {
        throw new NotFoundException(`Shift type ${shiftType} not found`);
      }

      return {
        type: config.type,
        description: config.description,
        installasi: config.installasi,
        hasRotatingBreaks: config.hasRotatingBreaks,
        notes: config.notes,
        shifts: config.shifts
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get available shift options for a specific date and shift type
   */
  async getShiftOptionsForDate(shiftType: string, date: string) {
    try {
      const targetDate = new Date(date);
      const options = getShiftOptionsForDate(shiftType, targetDate);
      
      if (options.length === 0) {
        return {
          date: date,
          shiftType: shiftType,
          message: 'No shifts available for this date and shift type',
          options: []
        };
      }

      return {
        date: date,
        shiftType: shiftType,
        options: options.map(option => ({
          name: option.name,
          jammulai: option.startTime,
          jamselesai: option.endTime,
          breakTime: option.breakTime
        }))
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate if a shift time is valid for the given shift type and date
   */
  async validateShiftForDate(shiftType: string, date: string, jammulai: string, jamselesai: string) {
    try {
      const targetDate = new Date(date);
      const isValid = validateShiftTime(shiftType, jammulai, jamselesai, targetDate);
      
      return {
        valid: isValid,
        shiftType: shiftType,
        date: date,
        jammulai: jammulai,
        jamselesai: jamselesai,
        message: isValid 
          ? 'Shift time is valid for this shift type and date'
          : 'Shift time is not valid for this shift type and date'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create shift using official RSUD shift type system
   */
  async createWithShiftType(createShiftDto: CreateShiftDto & { shiftType: string; shiftOption: string }) {
    try {
      // Validate the shift type and get available options
      const targetDate = new Date(createShiftDto.tanggal);
      const shiftOptions = getShiftOptionsForDate(createShiftDto.shiftType, targetDate);
      
      // Find the selected shift option
      const selectedOption = shiftOptions.find(option => option.name === createShiftDto.shiftOption);
      if (!selectedOption) {
        throw new NotFoundException(`Shift option "${createShiftDto.shiftOption}" not available for ${createShiftDto.shiftType} on ${createShiftDto.tanggal}`);
      }

      // Create the shift with the validated times
      const shiftData = {
        ...createShiftDto,
        jammulai: selectedOption.startTime,
        jamselesai: selectedOption.endTime,
        shiftType: createShiftDto.shiftType as any
      };

      return await this.create(shiftData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get shifts by installation type
   */
  async getShiftsByInstallation(installasi: string, startDate?: string, endDate?: string) {
    try {
      // Map common installation names to enum values
      const lokasiMapping: { [key: string]: string } = {
        'IGD': 'GAWAT_DARURAT',
        'GAWAT_DARURAT': 'GAWAT_DARURAT',
        'RAWAT_JALAN': 'RAWAT_JALAN',
        'RAWAT_INAP': 'RAWAT_INAP',
        'LABORATORIUM': 'LABORATORIUM',
        'FARMASI': 'FARMASI',
        'RADIOLOGI': 'RADIOLOGI',
        'GIZI': 'GIZI',
        'KEAMANAN': 'KEAMANAN',
        'LAUNDRY': 'LAUNDRY',
        'CLEANING_SERVICE': 'CLEANING_SERVICE',
        'SUPIR': 'SUPIR'
      };

      const whereClause: any = {
        OR: [
          { lokasishift: { contains: installasi, mode: 'insensitive' } }
        ]
      };

      // Add enum condition if mapping exists
      const enumValue = lokasiMapping[installasi.toUpperCase()];
      if (enumValue) {
        whereClause.OR.push({ lokasiEnum: enumValue });
      }

      if (startDate && endDate) {
        whereClause.tanggal = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      const shifts = await this.prisma.shift.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              employeeId: true,
              namaDepan: true,
              namaBelakang: true,
              role: true,
            },
          },
        },
        orderBy: [
          { tanggal: 'asc' },
          { jammulai: 'asc' }
        ]
      });

      return shifts;
    } catch (error) {
      throw error;
    }
  }
}

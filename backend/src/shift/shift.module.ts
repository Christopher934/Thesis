import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotifikasiModule } from '../notifikasi/notifikasi.module';
import { ShiftValidationService } from '../services/shift-validation.service';
import { ShiftController } from './shift.controller';
import { ShiftService } from './shift.service';
import { ShiftSwapRequestController } from './shift-swap-request.controller';
import { ShiftSwapRequestService } from './shift-swap-request.service';
import { SmartSwapController } from './smart-swap.controller';
import { SmartSwapService } from './smart-swap.service';
import { AdminShiftOptimizationController } from './admin-shift-optimization.controller';
import { AdminShiftOptimizationService } from './admin-shift-optimization.service';
import { AdminMonitoringService } from './admin-monitoring.service';
import { AdvancedBacktrackingService } from './advanced-backtracking.service';
import { ShiftRestrictionsController } from './shift-restrictions.controller';
import { ShiftSchedulingRestrictionsService } from '../services/shift-scheduling-restrictions.service';
import { JwtModule } from '@nestjs/jwt';
// import { AuthService } from '../auth/auth.service';

@Module({
  imports: [
    PrismaModule,
    NotifikasiModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'SECRET_KEY',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [
    ShiftController,
    ShiftSwapRequestController,
    SmartSwapController,
    AdminShiftOptimizationController,
    ShiftRestrictionsController,
  ],
  providers: [
    ShiftService,
    ShiftSwapRequestService,
    SmartSwapService,
    AdminShiftOptimizationService,
    AdminMonitoringService,
    AdvancedBacktrackingService,
    ShiftSchedulingRestrictionsService,
    ShiftValidationService,
  ],
})
export class ShiftModule {}

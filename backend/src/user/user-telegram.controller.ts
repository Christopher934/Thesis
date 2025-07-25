import { Controller, Post, Body, Put, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../notifikasi/telegram.service';

interface UpdateTelegramChatIdDto {
  telegramChatId: string;
}

interface TestTelegramNotificationDto {
  message: string;
}

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserTelegramController {
  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
  ) {}

  /**
   * Update user's Telegram Chat ID
   */
  @Put('telegram-chat-id')
  async updateTelegramChatId(
    @Request() req: any,
    @Body() dto: UpdateTelegramChatIdDto,
  ) {
    // Ambil userId dari user.userId atau user.id (sesuai JwtAuthGuard)
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) {
      console.error('No user ID found in request', req.user);
      throw new Error('User not authenticated');
    }
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { telegramChatId: dto.telegramChatId },
        select: {
          id: true,
          namaDepan: true,
          namaBelakang: true,
          telegramChatId: true,
        },
      });
      return {
        message: 'Telegram Chat ID berhasil diperbarui',
        user: updatedUser,
      };
    } catch (error: any) {
      console.error('Error updating Telegram Chat ID:', error);
      throw new Error(
        'Gagal memperbarui Telegram Chat ID: ' + (error && error.message ? error.message : 'Unknown error')
      );
    }
  }

  /**
   * Get user's Telegram Chat ID
   */
  @Post('telegram-chat-id')
  async getTelegramChatId(@Request() req) {
    const userId = req.user?.sub || req.user?.id;
    
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        telegramChatId: true,
      },
    });

    return {
      telegramChatId: user?.telegramChatId || null,
    };
  }

  /**
   * Test Telegram notification
   */
  @Post('test-telegram-notification')
  async testTelegramNotification(
    @Request() req,
    @Body() dto: TestTelegramNotificationDto,
  ) {
    const userId = req.user?.sub || req.user?.id;
    
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }

    try {
      // Get user's Chat ID
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          telegramChatId: true,
          namaDepan: true,
          namaBelakang: true,
        },
      });

      if (!user?.telegramChatId) {
        throw new Error('Telegram Chat ID belum dikonfigurasi');
      }

      // Send test message
      const success = await this.telegramService.sendMessage({
        chatId: user.telegramChatId,
        message: `🏥 <b>Test Notifikasi RSUD Anugerah</b>\n\n${dto.message}\n\n✅ Halo ${user.namaDepan}! Notifikasi Telegram Anda berfungsi dengan baik.\n\n<i>Pesan dikirim pada: ${new Date().toLocaleString('id-ID')}</i>`,
        parseMode: 'HTML',
      });

      if (success) {
        return {
          message: 'Notifikasi test berhasil dikirim',
          success: true,
        };
      } else {
        throw new Error('Gagal mengirim notifikasi test');
      }
    } catch (error) {
      throw new Error(error.message || 'Gagal mengirim notifikasi test');
    }
  }
}

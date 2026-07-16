import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.settings.findFirst();
    if (!settings) {
      settings = await this.prisma.settings.create({
        data: { gymName: 'GymSmart Fitness', ownerName: 'Admin', phone: '', email: '', city: '', gstNumber: '' },
      });
    }
    return { success: true, data: settings };
  }

  async updateSettings(dto: any) {
    const settings = await this.prisma.settings.findFirst();
    const data = settings
      ? await this.prisma.settings.update({ where: { id: settings.id }, data: dto })
      : await this.prisma.settings.create({ data: dto });
    return { success: true, data };
  }
}

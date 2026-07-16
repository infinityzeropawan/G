import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async markAttendance(dto: any) {
    const data = await this.prisma.attendance.create({ data: dto });
    return { success: true, data };
  }

  async findAll(query: any) {
    const data = await this.prisma.attendance.findMany({
      orderBy: { date: 'desc' },
      include: { member: { select: { name: true } }, staff: { select: { name: true } } },
    });
    return { success: true, data };
  }

  async getTodayStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalCheckIns, memberCheckIns, staffCheckIns] = await Promise.all([
      this.prisma.attendance.count({ where: { date: { gte: today, lt: tomorrow } } }),
      this.prisma.attendance.count({ where: { date: { gte: today, lt: tomorrow }, memberId: { not: null } } }),
      this.prisma.attendance.count({ where: { date: { gte: today, lt: tomorrow }, staffId: { not: null } } }),
    ]);

    return { success: true, data: { totalCheckIns, memberCheckIns, staffCheckIns } };
  }
}

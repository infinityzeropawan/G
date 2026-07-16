import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  findAllStaff(query: any) {
    return this.prisma.staff.findMany({ where: { isActive: true } }).then(data => ({ success: true, data }));
  }
  createStaff(dto: any) {
    return this.prisma.staff.create({ data: dto }).then(data => ({ success: true, data }));
  }
  findOneStaff(id: number) {
    return this.prisma.staff.findUnique({ where: { id } }).then(data => ({ success: true, data }));
  }
  updateStaff(id: number, dto: any) {
    return this.prisma.staff.update({ where: { id }, data: dto }).then(data => ({ success: true, data }));
  }
  removeStaff(id: number) {
    return this.prisma.staff.update({ where: { id }, data: { isActive: false } }).then(data => ({ success: true, data }));
  }

  findAllPayrolls(query: any) {
    return this.prisma.payroll.findMany({ include: { staff: true }, orderBy: { id: 'desc' } }).then(data => ({ success: true, data }));
  }
  createPayroll(dto: any) {
    return this.prisma.payroll.create({ data: dto }).then(data => ({ success: true, data }));
  }
  updatePayrollStatus(id: number, status: string) {
    return this.prisma.payroll.update({
      where: { id },
      data: { status, paidAt: status === 'Paid' ? new Date() : null },
    }).then(data => ({ success: true, data }));
  }

  async getHrSummary() {
    const totalStaff = await this.prisma.staff.count();
    const activeStaff = await this.prisma.staff.count({ where: { isActive: true } });

    // BUG-007 FIX: filter by current month string to match how payrolls store month
    const now = new Date();
    const currentMonth = now.toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    }); // e.g. "July 2026"

    const payrolls = await this.prisma.payroll.findMany({
      where: { month: currentMonth },
    });

    let totalPayrollThisMonth = 0, paidCount = 0, pendingCount = 0;
    payrolls.forEach((p) => {
      if (p.status === 'Paid') {
        paidCount++;
        totalPayrollThisMonth += p.amount;
      } else {
        pendingCount++;
      }
    });

    return {
      success: true,
      data: { totalStaff, activeStaff, totalPayrollThisMonth, paidCount, pendingCount },
    };
  }
}


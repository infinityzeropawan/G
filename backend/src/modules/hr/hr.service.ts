import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { CreatePayrollDto } from './dto/create-payroll.dto';

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  findAllStaff(query: any) {
    return this.prisma.staff.findMany({ where: { isActive: true } }).then(data => ({ success: true, data }));
  }
  createStaff(dto: CreateStaffDto) {
    return this.prisma.staff.create({ data: dto }).then(data => ({ success: true, data }));
  }
  async findOneStaff(id: number) {
    const data = await this.prisma.staff.findUnique({ where: { id } });
    if (!data) throw new NotFoundException(`Staff #${id} not found`);
    return { success: true, data };
  }
  updateStaff(id: number, dto: UpdateStaffDto) {
    return this.prisma.staff.update({ where: { id }, data: dto }).then(data => ({ success: true, data }));
  }
  removeStaff(id: number) {
    return this.prisma.staff.update({ where: { id }, data: { isActive: false } }).then(data => ({ success: true, data }));
  }

  findAllPayrolls(query: any) {
    return this.prisma.payroll.findMany({ include: { staff: true }, orderBy: { id: 'desc' } }).then(data => ({ success: true, data }));
  }
  createPayroll(dto: CreatePayrollDto) {
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

    // BUG-007 FIX: query by createdAt date range instead of locale string matching
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const payrolls = await this.prisma.payroll.findMany({
      where: {
        createdAt: {
          gte: firstDay,
          lt: nextMonth,
        },
      },
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


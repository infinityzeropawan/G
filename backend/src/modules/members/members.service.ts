import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  private readonly cycleMonths: Record<string, number> = {
    ONE_MONTH: 1,
    THREE_MONTHS: 3,
    SIX_MONTHS: 6,
    TWELVE_MONTHS: 12,
  };

  async create(dto: any) {
    const joinDate = dto.joinDate ? new Date(dto.joinDate) : new Date();
    const expiryDate = new Date(joinDate);
    expiryDate.setMonth(
      expiryDate.getMonth() + (this.cycleMonths[dto.billingCycle] || 1),
    );

    // BUG-003 FIX: respect paidAmount from DTO instead of always forcing 0
    const paidAmount = dto.paidAmount ?? 0;

    const data = await this.prisma.member.create({
      data: { ...dto, joinDate, expiryDate, status: 'ACTIVE', paidAmount, pendingAmount: 0 },
      include: { plan: true },
    });
    return { success: true, data };
  }

  async findAll(query: any) {
    const limit = query.limit ? parseInt(query.limit) : 50;
    const members = await this.prisma.member.findMany({
      include: { plan: true },
      take: limit,
      orderBy: { id: 'desc' },
    });
    return { success: true, data: { members, total: members.length, page: 1, limit } };
  }

  async findOne(id: number) {
    const data = await this.prisma.member.findUnique({
      where: { id },
      include: { plan: true, payments: true },
    });
    if (!data) throw new NotFoundException(`Member #${id} not found`);
    return { success: true, data };
  }

  async update(id: number, dto: any) {
    const existing = await this.prisma.member.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Member #${id} not found`);
    const data = await this.prisma.member.update({
      where: { id },
      data: dto,
      include: { plan: true },
    });
    return { success: true, data };
  }

  async remove(id: number) {
    const existing = await this.prisma.member.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Member #${id} not found`);
    const data = await this.prisma.member.delete({ where: { id } });
    return { success: true, data };
  }

  // BUG-004 FIX: fully implemented renewMembership
  async renewMembership(id: number, dto: any) {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member) throw new NotFoundException(`Member #${id} not found`);

    if (!dto.billingCycle) {
      throw new BadRequestException('billingCycle is required for renewal');
    }

    const months = this.cycleMonths[dto.billingCycle];
    if (!months) {
      throw new BadRequestException(`Invalid billingCycle: ${dto.billingCycle}`);
    }

    // Start renewal from today (or from dto.startDate if provided)
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const expiryDate = new Date(startDate);
    expiryDate.setMonth(expiryDate.getMonth() + months);

    const data = await this.prisma.member.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        billingCycle: dto.billingCycle,
        joinDate: startDate,
        expiryDate,
        ...(dto.planId ? { planId: dto.planId } : {}),
      },
      include: { plan: true },
    });
    return { success: true, data };
  }

  async getStats() {
    const [total, active, pending, expired] = await Promise.all([
      this.prisma.member.count(),
      this.prisma.member.count({ where: { status: 'ACTIVE' } }),
      this.prisma.member.count({ where: { status: 'PENDING' } }),
      this.prisma.member.count({ where: { status: 'EXPIRED' } }),
    ]);
    return { success: true, data: { total, active, pending, expired } };
  }
}


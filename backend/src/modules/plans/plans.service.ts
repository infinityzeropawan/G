import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async create(dto: any) {
    const data = await this.prisma.plan.create({ data: dto });
    return { success: true, data };
  }
  async findAll() {
    const data = await this.prisma.plan.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } });
    return { success: true, data };
  }
  async findOne(id: number) {
    const data = await this.prisma.plan.findUnique({ where: { id } });
    return { success: true, data };
  }
  async update(id: number, dto: any) {
    const data = await this.prisma.plan.update({ where: { id }, data: dto });
    return { success: true, data };
  }
  async remove(id: number) {
    const data = await this.prisma.plan.update({ where: { id }, data: { isActive: false } });
    return { success: true, data };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InquiriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const limit = query.limit ? parseInt(query.limit) : 200;
    const inquiries = await this.prisma.inquiry.findMany({ orderBy: { id: 'desc' }, take: limit });
    return { success: true, data: { inquiries, total: inquiries.length } };
  }
  async create(dto: any) {
    const data = await this.prisma.inquiry.create({ data: dto });
    return { success: true, data };
  }
  async findOne(id: number) {
    const data = await this.prisma.inquiry.findUnique({ where: { id } });
    return { success: true, data };
  }
  async update(id: number, dto: any) {
    const data = await this.prisma.inquiry.update({ where: { id }, data: dto });
    return { success: true, data };
  }
  async remove(id: number) {
    const data = await this.prisma.inquiry.delete({ where: { id } });
    return { success: true, data };
  }

  async getStats() {
    const [total, new_count, followUp, converted, lost] = await Promise.all([
      this.prisma.inquiry.count(),
      this.prisma.inquiry.count({ where: { status: 'NEW' } }),
      this.prisma.inquiry.count({ where: { status: 'FOLLOW_UP' } }),
      this.prisma.inquiry.count({ where: { status: 'CONVERTED' } }),
      this.prisma.inquiry.count({ where: { status: 'LOST' } }),
    ]);
    return { success: true, data: { total, new: new_count, followUp, converted, lost } };
  }
}

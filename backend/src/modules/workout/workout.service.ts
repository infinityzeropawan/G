import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WorkoutService {
  constructor(private prisma: PrismaService) {}

  async findAllWorkouts(query: any) {
    const data = await this.prisma.workout.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } });
    return { success: true, data };
  }
  async createWorkout(dto: any) {
    const data = await this.prisma.workout.create({ data: dto });
    return { success: true, data };
  }
  async updateWorkout(id: number, dto: any) {
    const data = await this.prisma.workout.update({ where: { id }, data: dto });
    return { success: true, data };
  }
  async removeWorkout(id: number) {
    const data = await this.prisma.workout.update({ where: { id }, data: { isActive: false } });
    return { success: true, data };
  }

  async findAllDietPlans(query: any) {
    const data = await this.prisma.dietPlan.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } });
    return { success: true, data };
  }
  async createDietPlan(dto: any) {
    const data = await this.prisma.dietPlan.create({ data: dto });
    return { success: true, data };
  }
  async updateDietPlan(id: number, dto: any) {
    const data = await this.prisma.dietPlan.update({ where: { id }, data: dto });
    return { success: true, data };
  }
  async removeDietPlan(id: number) {
    const data = await this.prisma.dietPlan.update({ where: { id }, data: { isActive: false } });
    return { success: true, data };
  }
}

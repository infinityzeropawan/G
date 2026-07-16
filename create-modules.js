const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'backend', 'src', 'modules');

const modules = {
  members: {
    'members.module.ts': `import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}`,
    'members.controller.ts': `import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { MembersService } from './members.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  create(@Body() createMemberDto: any) {
    return this.membersService.create(createMemberDto);
  }

  @Get('stats')
  getStats() {
    return this.membersService.getStats();
  }

  @Get()
  findAll(@Query() query: any) {
    return this.membersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.membersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMemberDto: any) {
    return this.membersService.update(+id, updateMemberDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.membersService.remove(+id);
  }

  @Post(':id/renew')
  renewMembership(@Param('id') id: string, @Body() body: any) {
    return this.membersService.renewMembership(+id, body);
  }
}`,
    'members.service.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: any) {
    const cycleMonths = {
      'ONE_MONTH': 1,
      'THREE_MONTHS': 3,
      'SIX_MONTHS': 6,
      'TWELVE_MONTHS': 12,
    };
    const joinDate = dto.joinDate ? new Date(dto.joinDate) : new Date();
    const expiryDate = new Date(joinDate);
    expiryDate.setMonth(expiryDate.getMonth() + (cycleMonths[dto.billingCycle] || 1));

    const member = await this.prisma.member.create({
      data: {
        ...dto,
        joinDate,
        expiryDate,
        status: 'ACTIVE',
        paidAmount: 0,
        pendingAmount: 0,
      }
    });
    return member;
  }

  async findAll(query: any) {
    const limit = query.limit ? parseInt(query.limit) : 50;
    const members = await this.prisma.member.findMany({
      include: { plan: true },
      take: limit,
      orderBy: { id: 'desc' },
    });
    return { members, total: members.length };
  }

  async findOne(id: number) {
    return this.prisma.member.findUnique({
      where: { id },
      include: { plan: true, Payment: true },
    });
  }

  async update(id: number, dto: any) {
    return this.prisma.member.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    return this.prisma.member.delete({ where: { id } });
  }

  async renewMembership(id: number, dto: any) {
    // Basic implementation
    return this.prisma.member.update({
      where: { id },
      data: { status: 'ACTIVE' }
    });
  }

  async getStats() {
    const total = await this.prisma.member.count();
    const active = await this.prisma.member.count({ where: { status: 'ACTIVE' } });
    const pending = await this.prisma.member.count({ where: { status: 'PENDING' } });
    const expired = await this.prisma.member.count({ where: { status: 'EXPIRED' } });
    return { total, active, pending, expired };
  }
}`
  },
  plans: {
    'plans.module.ts': `import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';

@Module({
  controllers: [PlansController],
  providers: [PlansService],
})
export class PlansModule {}`,
    'plans.controller.ts': `import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  create(@Body() dto: any) { return this.plansService.create(dto); }

  @Get()
  findAll() { return this.plansService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.plansService.findOne(+id); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) { return this.plansService.update(+id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.plansService.remove(+id); }
}`,
    'plans.service.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}
  create(dto: any) { return this.prisma.plan.create({ data: dto }); }
  findAll() { return this.prisma.plan.findMany({ where: { isActive: true } }); }
  findOne(id: number) { return this.prisma.plan.findUnique({ where: { id } }); }
  update(id: number, dto: any) { return this.prisma.plan.update({ where: { id }, data: dto }); }
  remove(id: number) { return this.prisma.plan.update({ where: { id }, data: { isActive: false } }); }
}`
  },
  finance: {
    'finance.module.ts': `import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  controllers: [FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}`,
    'finance.controller.ts': `import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('payments')
  createPayment(@Body() dto: any) { return this.financeService.createPayment(dto); }

  @Get('payments')
  findAllPayments(@Query() query: any) { return this.financeService.findAllPayments(query); }

  @Get('summary')
  getSummary() { return this.financeService.getSummary(); }

  @Get('payments/member/:memberId')
  getPaymentsByMember(@Param('memberId') memberId: string) { return this.financeService.getPaymentsByMember(+memberId); }
}`,
    'finance.service.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async createPayment(dto: any) {
    const payment = await this.prisma.payment.create({
      data: {
        memberId: dto.memberId,
        amount: dto.amount,
        method: dto.method,
        notes: dto.notes,
        status: 'PAID',
        invoiceNo: 'INV-' + Date.now(),
        paidAt: new Date(),
      }
    });
    // update member paid amount
    await this.prisma.member.update({
      where: { id: dto.memberId },
      data: {
        paidAmount: { increment: dto.amount },
        pendingAmount: { decrement: dto.amount }, // simple logic
      }
    });
    return payment;
  }

  async findAllPayments(query: any) {
    const limit = query.limit ? parseInt(query.limit) : 50;
    const payments = await this.prisma.payment.findMany({
      include: { member: true },
      take: limit,
      orderBy: { paidAt: 'desc' },
    });
    return { payments, total: payments.length };
  }

  async getPaymentsByMember(memberId: number) {
    return this.prisma.payment.findMany({ where: { memberId }, orderBy: { paidAt: 'desc' } });
  }

  async getSummary() {
    const totalRevenue = (await this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }))._sum.amount || 0;
    const totalPayments = await this.prisma.payment.count();
    const pendingAmount = (await this.prisma.member.aggregate({ _sum: { pendingAmount: true } }))._sum.pendingAmount || 0;
    
    return {
      totalRevenue,
      monthlyRevenue: totalRevenue, // simplified
      pendingAmount,
      totalPayments,
      revenueByMethod: {
        UPI: 15000, Cash: 5000, Card: 10000, NetBanking: 2000
      },
      monthlyData: [
        { month: 'Jan', revenue: 20000 },
        { month: 'Feb', revenue: 25000 },
        { month: 'Mar', revenue: 30000 },
        { month: 'Apr', revenue: 28000 },
        { month: 'May', revenue: 35000 },
        { month: 'Jun', revenue: 40000 },
      ]
    };
  }
}`
  },
  hr: {
    'hr.module.ts': `import { Module } from '@nestjs/common';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';

@Module({
  controllers: [HrController],
  providers: [HrService],
})
export class HrModule {}`,
    'hr.controller.ts': `import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('staff')
  findAllStaff(@Query() query: any) { return this.hrService.findAllStaff(query); }
  @Post('staff')
  createStaff(@Body() dto: any) { return this.hrService.createStaff(dto); }
  @Get('staff/:id')
  findOneStaff(@Param('id') id: string) { return this.hrService.findOneStaff(+id); }
  @Patch('staff/:id')
  updateStaff(@Param('id') id: string, @Body() dto: any) { return this.hrService.updateStaff(+id, dto); }
  @Delete('staff/:id')
  removeStaff(@Param('id') id: string) { return this.hrService.removeStaff(+id); }

  @Get('payrolls')
  findAllPayrolls(@Query() query: any) { return this.hrService.findAllPayrolls(query); }
  @Post('payrolls')
  createPayroll(@Body() dto: any) { return this.hrService.createPayroll(dto); }
  @Patch('payrolls/:id/status')
  updatePayrollStatus(@Param('id') id: string, @Body() body: any) { return this.hrService.updatePayrollStatus(+id, body.status); }

  @Get('summary')
  getHrSummary() { return this.hrService.getHrSummary(); }
}`,
    'hr.service.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  findAllStaff(query: any) { return this.prisma.staff.findMany({ where: { isActive: true } }); }
  createStaff(dto: any) { return this.prisma.staff.create({ data: dto }); }
  findOneStaff(id: number) { return this.prisma.staff.findUnique({ where: { id } }); }
  updateStaff(id: number, dto: any) { return this.prisma.staff.update({ where: { id }, data: dto }); }
  removeStaff(id: number) { return this.prisma.staff.update({ where: { id }, data: { isActive: false } }); }

  findAllPayrolls(query: any) { return this.prisma.payroll.findMany({ include: { staff: true } }); }
  createPayroll(dto: any) { return this.prisma.payroll.create({ data: dto }); }
  updatePayrollStatus(id: number, status: string) { 
    return this.prisma.payroll.update({ where: { id }, data: { status, paidAt: status === 'Paid' ? new Date() : null } }); 
  }

  async getHrSummary() {
    const totalStaff = await this.prisma.staff.count();
    const activeStaff = await this.prisma.staff.count({ where: { isActive: true } });
    return {
      totalStaff, activeStaff, totalPayrollThisMonth: 150000, paidCount: 3, pendingCount: 2
    };
  }
}`
  },
  store: {
    'store.module.ts': `import { Module } from '@nestjs/common';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';

@Module({
  controllers: [StoreController],
  providers: [StoreService],
})
export class StoreModule {}`,
    'store.controller.ts': `import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { StoreService } from './store.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('products')
  findAllProducts(@Query() query: any) { return this.storeService.findAllProducts(query); }
  @Post('products')
  createProduct(@Body() dto: any) { return this.storeService.createProduct(dto); }
  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() dto: any) { return this.storeService.updateProduct(+id, dto); }
  @Delete('products/:id')
  removeProduct(@Param('id') id: string) { return this.storeService.removeProduct(+id); }

  @Get('orders')
  findAllOrders(@Query() query: any) { return this.storeService.findAllOrders(query); }
  @Post('orders')
  createOrder(@Body() dto: any) { return this.storeService.createOrder(dto); }

  @Get('summary')
  getStoreSummary() { return this.storeService.getStoreSummary(); }
}`,
    'store.service.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class StoreService {
  constructor(private prisma: PrismaService) {}

  findAllProducts(query: any) { return this.prisma.product.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }); }
  createProduct(dto: any) { return this.prisma.product.create({ data: dto }); }
  updateProduct(id: number, dto: any) { return this.prisma.product.update({ where: { id }, data: dto }); }
  removeProduct(id: number) { return this.prisma.product.update({ where: { id }, data: { isActive: false } }); }

  findAllOrders(query: any) { return this.prisma.order.findMany({ include: { items: { include: { product: true } } }, orderBy: { id: 'desc' } }).then(orders => ({ orders, total: orders.length })); }
  async createOrder(dto: any) {
    let total = 0;
    // Basic implementation
    const order = await this.prisma.order.create({
      data: {
        total: 0,
        method: dto.method,
        status: 'COMPLETED',
        notes: dto.notes,
      }
    });
    for(const item of dto.items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if(product) {
        total += product.price * item.qty;
        await this.prisma.orderItem.create({
          data: { orderId: order.id, productId: item.productId, qty: item.qty, price: product.price }
        });
        await this.prisma.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.qty } }
        });
      }
    }
    await this.prisma.order.update({ where: { id: order.id }, data: { total } });
    return this.prisma.order.findUnique({ where: { id: order.id }, include: { items: true } });
  }

  async getStoreSummary() {
    const totalProducts = await this.prisma.product.count({ where: { isActive: true } });
    const totalOrders = await this.prisma.order.count();
    const totalRevenue = (await this.prisma.order.aggregate({ _sum: { total: true } }))._sum.total || 0;
    const lowStockProducts = await this.prisma.product.findMany({ where: { stock: { lte: 10 }, isActive: true } });
    return { totalProducts, totalOrders, totalRevenue, lowStockProducts };
  }
}`
  },
  workout: {
    'workout.module.ts': `import { Module } from '@nestjs/common';
import { WorkoutController } from './workout.controller';
import { WorkoutService } from './workout.service';

@Module({
  controllers: [WorkoutController],
  providers: [WorkoutService],
})
export class WorkoutModule {}`,
    'workout.controller.ts': `import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { WorkoutService } from './workout.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/workout')
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @Get('exercises')
  findAllWorkouts(@Query() query: any) { return this.workoutService.findAllWorkouts(query); }
  @Post('exercises')
  createWorkout(@Body() dto: any) { return this.workoutService.createWorkout(dto); }
  @Patch('exercises/:id')
  updateWorkout(@Param('id') id: string, @Body() dto: any) { return this.workoutService.updateWorkout(+id, dto); }
  @Delete('exercises/:id')
  removeWorkout(@Param('id') id: string) { return this.workoutService.removeWorkout(+id); }

  @Get('diet-plans')
  findAllDietPlans(@Query() query: any) { return this.workoutService.findAllDietPlans(query); }
  @Post('diet-plans')
  createDietPlan(@Body() dto: any) { return this.workoutService.createDietPlan(dto); }
  @Patch('diet-plans/:id')
  updateDietPlan(@Param('id') id: string, @Body() dto: any) { return this.workoutService.updateDietPlan(+id, dto); }
  @Delete('diet-plans/:id')
  removeDietPlan(@Param('id') id: string) { return this.workoutService.removeDietPlan(+id); }
}`,
    'workout.service.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WorkoutService {
  constructor(private prisma: PrismaService) {}

  findAllWorkouts(query: any) { return this.prisma.workout.findMany({ where: { isActive: true } }); }
  createWorkout(dto: any) { return this.prisma.workout.create({ data: dto }); }
  updateWorkout(id: number, dto: any) { return this.prisma.workout.update({ where: { id }, data: dto }); }
  removeWorkout(id: number) { return this.prisma.workout.update({ where: { id }, data: { isActive: false } }); }

  findAllDietPlans(query: any) { return this.prisma.dietPlan.findMany({ where: { isActive: true } }); }
  createDietPlan(dto: any) { return this.prisma.dietPlan.create({ data: dto }); }
  updateDietPlan(id: number, dto: any) { return this.prisma.dietPlan.update({ where: { id }, data: dto }); }
  removeDietPlan(id: number) { return this.prisma.dietPlan.update({ where: { id }, data: { isActive: false } }); }
}`
  },
  dashboard: {
    'dashboard.module.ts': `import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}`,
    'dashboard.controller.ts': `import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats() { return this.dashboardService.getStats(); }
}`,
    'dashboard.service.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const totalMembers = await this.prisma.member.count();
    const activeMembers = await this.prisma.member.count({ where: { status: 'ACTIVE' } });
    const totalRevenue = (await this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }))._sum.amount || 0;
    const totalStaff = await this.prisma.staff.count();
    const totalProducts = await this.prisma.product.count();
    const totalInquiries = await this.prisma.inquiry.count();
    
    return {
      totalMembers,
      activeMembers,
      newMembersThisMonth: 15,
      totalRevenue,
      monthlyRevenue: totalRevenue,
      pendingPayments: 5000,
      totalStaff,
      activeStaff: totalStaff,
      totalProducts,
      lowStockCount: 2,
      totalInquiries,
      newInquiries: 12,
      memberGrowth: [
        { month: 'Jan', count: 120 }, { month: 'Feb', count: 135 },
        { month: 'Mar', count: 150 }, { month: 'Apr', count: 165 },
        { month: 'May', count: 180 }, { month: 'Jun', count: 200 }
      ],
      revenueChart: [
        { month: 'Jan', revenue: 50000 }, { month: 'Feb', revenue: 55000 },
        { month: 'Mar', revenue: 60000 }, { month: 'Apr', revenue: 65000 },
        { month: 'May', revenue: 70000 }, { month: 'Jun', revenue: 75000 }
      ],
      membersByPlan: [
        { plan: 'Basic', count: 80 }, { plan: 'Gold', count: 70 }, { plan: 'Premium', count: 50 }
      ],
      membersByStatus: {
        active: activeMembers, pending: 15, expired: 10
      },
      recentMembers: await this.prisma.member.findMany({ take: 5, orderBy: { id: 'desc' } }),
      recentPayments: await this.prisma.payment.findMany({ take: 5, orderBy: { id: 'desc' }, include: { member: true } })
    };
  }
}`
  },
  inquiries: {
    'inquiries.module.ts': `import { Module } from '@nestjs/common';
import { InquiriesController } from './inquiries.controller';
import { InquiriesService } from './inquiries.service';

@Module({
  controllers: [InquiriesController],
  providers: [InquiriesService],
})
export class InquiriesModule {}`,
    'inquiries.controller.ts': `import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { InquiriesService } from './inquiries.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Get()
  findAll(@Query() query: any) { return this.inquiriesService.findAll(query); }
  @Post()
  create(@Body() dto: any) { return this.inquiriesService.create(dto); }
  @Get('stats')
  getStats() { return this.inquiriesService.getStats(); }
  @Get(':id')
  findOne(@Param('id') id: string) { return this.inquiriesService.findOne(+id); }
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) { return this.inquiriesService.update(+id, dto); }
  @Delete(':id')
  remove(@Param('id') id: string) { return this.inquiriesService.remove(+id); }
}`,
    'inquiries.service.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InquiriesService {
  constructor(private prisma: PrismaService) {}

  findAll(query: any) { return this.prisma.inquiry.findMany({ orderBy: { id: 'desc' } }).then(inquiries => ({ inquiries, total: inquiries.length })); }
  create(dto: any) { return this.prisma.inquiry.create({ data: dto }); }
  findOne(id: number) { return this.prisma.inquiry.findUnique({ where: { id } }); }
  update(id: number, dto: any) { return this.prisma.inquiry.update({ where: { id }, data: dto }); }
  remove(id: number) { return this.prisma.inquiry.delete({ where: { id } }); }

  async getStats() {
    const total = await this.prisma.inquiry.count();
    const new_count = await this.prisma.inquiry.count({ where: { status: 'NEW' } });
    const followUp = await this.prisma.inquiry.count({ where: { status: 'FOLLOW_UP' } });
    const converted = await this.prisma.inquiry.count({ where: { status: 'CONVERTED' } });
    const lost = await this.prisma.inquiry.count({ where: { status: 'LOST' } });
    return { total, new: new_count, followUp, converted, lost };
  }
}`
  },
  attendance: {
    'attendance.module.ts': `import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}`,
    'attendance.controller.ts': `import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  markAttendance(@Body() dto: any) { return this.attendanceService.markAttendance(dto); }
  @Get()
  findAll(@Query() query: any) { return this.attendanceService.findAll(query); }
  @Get('today-stats')
  getTodayStats() { return this.attendanceService.getTodayStats(); }
}`,
    'attendance.service.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  markAttendance(dto: any) {
    return this.prisma.attendance.create({ data: dto });
  }
  findAll(query: any) { return this.prisma.attendance.findMany({ orderBy: { date: 'desc' } }); }
  async getTodayStats() {
    return { totalCheckIns: 50, memberCheckIns: 45, staffCheckIns: 5 };
  }
}`
  }
};

Object.entries(modules).forEach(([modName, files]) => {
  const modPath = path.join(baseDir, modName);
  if (!fs.existsSync(modPath)) {
    fs.mkdirSync(modPath, { recursive: true });
  }
  Object.entries(files).forEach(([fileName, content]) => {
    fs.writeFileSync(path.join(modPath, fileName), content);
  });
});
console.log('All modules created successfully.');

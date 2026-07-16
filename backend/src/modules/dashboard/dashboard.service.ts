import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Six months ago logic
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [
      totalMembers,
      activeMembers,
      pendingMembers,
      expiredMembers,
      newMembersThisMonth,
      totalRevenueResult,
      monthlyRevenueResult,
      pendingPaymentsResult,
      totalStaff,
      activeStaff,
      totalProducts,
      lowStockCount,
      totalInquiries,
      newInquiries,
      recentMembersForChart,
      recentPaymentsForChart,
      membersWithPlans,
      pendingPaymentsList,
      recentMembers,
      recentPayments
    ] = await Promise.all([
      this.prisma.member.count(),
      this.prisma.member.count({ where: { status: 'ACTIVE' } }),
      this.prisma.member.count({ where: { status: 'PENDING' } }),
      this.prisma.member.count({ where: { status: 'EXPIRED' } }),
      this.prisma.member.count({ where: { joinDate: { gte: firstDayOfMonth } } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID', paidAt: { gte: firstDayOfMonth } } }),
      this.prisma.member.aggregate({ _sum: { pendingAmount: true } }),
      this.prisma.staff.count(),
      this.prisma.staff.count({ where: { isActive: true } }),
      this.prisma.product.count(),
      this.prisma.product.count({ where: { stock: { lte: 10 } } }),
      this.prisma.inquiry.count(),
      this.prisma.inquiry.count({ where: { status: 'NEW' } }),
      this.prisma.member.findMany({ where: { joinDate: { gte: sixMonthsAgo } }, select: { joinDate: true } }),
      this.prisma.payment.findMany({ where: { status: 'PAID', paidAt: { gte: sixMonthsAgo } }, select: { paidAt: true, amount: true } }),
      this.prisma.member.findMany({ select: { plan: { select: { name: true } } } }),
      this.prisma.member.findMany({ where: { pendingAmount: { gt: 0 } }, select: { id: true, name: true, pendingAmount: true, expiryDate: true }, take: 10 }),
      this.prisma.member.findMany({ take: 5, orderBy: { id: 'desc' }, include: { plan: true } }),
      this.prisma.payment.findMany({ take: 5, orderBy: { id: 'desc' }, include: { member: true } })
    ]);

    const totalRevenue = totalRevenueResult._sum.amount || 0;
    const monthlyRevenue = monthlyRevenueResult._sum.amount || 0;
    const pendingPayments = pendingPaymentsResult._sum.pendingAmount || 0;

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    // BUG-008 FIX: use "YYYY-MM" as internal key to avoid year-boundary collisions
    // (e.g., "Jan 2025" and "Jan 2026" no longer overwrite each other)
    const memberGrowthMap = new Map<string, { label: string; count: number }>();
    const revenueMap = new Map<string, { label: string; revenue: number }>();

    // Initialize last 6 months with YYYY-MM keys
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = monthNames[d.getMonth()];
      memberGrowthMap.set(key, { label, count: 0 });
      revenueMap.set(key, { label, revenue: 0 });
    }

    recentMembersForChart.forEach((m) => {
      const d = new Date(m.joinDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const entry = memberGrowthMap.get(key);
      if (entry) memberGrowthMap.set(key, { ...entry, count: entry.count + 1 });
    });

    recentPaymentsForChart.forEach((p) => {
      if (p.paidAt) {
        const d = new Date(p.paidAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const entry = revenueMap.get(key);
        if (entry) revenueMap.set(key, { ...entry, revenue: entry.revenue + p.amount });
      }
    });

    const memberGrowth = Array.from(memberGrowthMap.values()).map(
      ({ label, count }) => ({ month: label, count }),
    );
    const revenueChart = Array.from(revenueMap.values()).map(
      ({ label, revenue }) => ({ month: label, revenue }),
    );

    // Dynamic membersByPlan
    const planCounts = new Map<string, number>();
    membersWithPlans.forEach((m) => {
      const pName = m.plan?.name || 'Unknown';
      planCounts.set(pName, (planCounts.get(pName) || 0) + 1);
    });
    const membersByPlan = Array.from(planCounts.entries()).map(
      ([plan, count]) => ({ plan, count }),
    );

    return {
      success: true,
      data: {
        totalMembers,
        activeMembers,
        newMembersThisMonth,
        totalRevenue,
        monthlyRevenue,
        pendingPayments,
        totalStaff,
        activeStaff,
        totalProducts,
        lowStockCount,
        totalInquiries,
        newInquiries,
        memberGrowth,
        revenueChart,
        membersByPlan,
        membersByStatus: { active: activeMembers, pending: pendingMembers, expired: expiredMembers },
        recentMembers,
        recentPayments,
        pendingPaymentsList,
      },
    };
  }
}

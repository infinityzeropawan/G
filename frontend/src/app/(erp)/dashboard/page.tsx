'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import { Users, DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, UserCheck, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { dashboardApi, type DashboardStats } from '@/lib/api';

const fmt = (n: number) => '₹' + (n || 0).toLocaleString('en-IN');

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  EXPIRED: 'bg-red-100 text-red-700',
};
const PLAN_COLORS: Record<string, string> = {
  BASIC: 'bg-blue-500',
  GOLD: 'bg-yellow-500',
  PREMIUM: 'bg-orange-500',
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi.getStats()
      .then(res => setStats(res.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading dashboard...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-full flex items-center justify-center">
      <div className="text-center text-red-500">
        <p className="font-medium">Failed to load dashboard</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    </div>
  );

  const s = stats!;

  return (
    <div className="min-h-full">
      <Header title="Dashboard" subtitle="Welcome back, Admin! Here's your gym overview." />
      <div className="p-4 sm:p-6 space-y-6">

        {/* KPI Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total Members" value={s.totalMembers.toLocaleString()} change="All time" changeType="up" icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" />
          <StatCard title="Monthly Revenue" value={fmt(s.monthlyRevenue)} change="This month" changeType="up" icon={DollarSign} iconBg="bg-green-50" iconColor="text-green-600" />
          <StatCard title="Active Members" value={s.activeMembers.toLocaleString()} change={`${s.totalMembers ? Math.round((s.activeMembers / s.totalMembers) * 100) : 0}% of total`} changeType="neutral" icon={UserCheck} iconBg="bg-orange-50" iconColor="text-orange-600" />
          <StatCard title="Pending Payments" value={fmt(s.pendingPayments)} change={`${s.membersByStatus?.pending || 0} members`} changeType="down" icon={AlertCircle} iconBg="bg-red-50" iconColor="text-red-600" />
        </div>

        {/* KPI Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="New Members (Month)" value={s.newMembersThisMonth.toLocaleString()} change="This month" changeType="up" icon={TrendingUp} iconBg="bg-purple-50" iconColor="text-purple-600" />
          <StatCard title="Total Staff" value={s.activeStaff.toLocaleString()} change="Active staff" changeType="neutral" icon={Clock} iconBg="bg-yellow-50" iconColor="text-yellow-600" />
          <StatCard title="Store Products" value={s.totalProducts.toLocaleString()} change={s.lowStockCount > 0 ? `${s.lowStockCount} low stock` : 'All stocked'} changeType={s.lowStockCount > 0 ? 'down' : 'up'} icon={ShoppingCart} iconBg="bg-teal-50" iconColor="text-teal-600" />
          <StatCard title="New Inquiries" value={s.newInquiries.toLocaleString()} change={`${s.totalInquiries} total`} changeType="up" icon={CheckCircle} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Recent Members Table */}
          <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent Members</h2>
              <Link href="/members" className="text-sm font-medium hover:underline" style={{ color: 'hsl(24 95% 53%)' }}>View all</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Member', 'Plan', 'Status', 'Joined', 'Amount'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(s.recentMembers || []).map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm">{m.name.charAt(0)}</div>
                          <span className="text-sm font-medium text-gray-900">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{(m.plan as any)?.name || m.plan || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[m.status] || 'bg-gray-100 text-gray-700'}`}>{m.status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(m.joinDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{fmt(m.paidAmount)}</td>
                    </tr>
                  ))}
                  {(s.recentMembers || []).length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">No members yet. Add your first member!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            
            {/* Pending Payments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Pending Payments</h2>
              <div className="space-y-3">
                {(s.pendingPaymentsList || []).slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">Expires: {new Date(p.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">{fmt(p.pendingAmount)}</p>
                    </div>
                  </div>
                ))}
                {(s.pendingPaymentsList || []).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No pending payments 🎉</p>
                )}
              </div>
              <Link href="/finance" className="mt-3 block w-full text-center text-sm font-medium" style={{ color: 'hsl(24 95% 53%)' }}>View all pending</Link>
            </div>

            {/* Promo Card */}
            <div className="rounded-xl p-5 text-white" style={{ background: 'linear-gradient(135deg, hsl(24 95% 53%), hsl(20 95% 45%))' }}>
              <h3 className="font-semibold mb-1">GymSmart ERP</h3>
              <p className="text-orange-100 text-sm mb-3">Complete Gym Management System</p>
              <div className="text-sm font-bold">+91 83479 77566</div>
            </div>
          </div>
        </div>

        {/* Membership Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Membership Distribution</h2>
          <div className="flex flex-wrap gap-3">
            {(s.membersByPlan || []).map((p) => {
              const total = (s.membersByPlan || []).reduce((a, b) => a + b.count, 0);
              const pct = total > 0 ? Math.round((p.count / total) * 100) : 0;
              return (
                <div key={p.plan} className="flex-1 min-w-[150px] bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${PLAN_COLORS[p.plan] || 'bg-gray-500'}`} />
                    <span className="text-sm font-medium text-gray-700">{p.plan}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{p.count}</div>
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${PLAN_COLORS[p.plan] || 'bg-gray-500'} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{pct}% of total</div>
                </div>
              );
            })}
            {(s.membersByPlan || []).length === 0 && (
              <p className="text-sm text-gray-400 py-4">No data available yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

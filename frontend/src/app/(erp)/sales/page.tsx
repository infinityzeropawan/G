'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import { Download, Filter, RefreshCw } from 'lucide-react';
import { dashboardApi, membersApi, type Member } from '@/lib/api';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function Sales() {
  const [tab, setTab] = useState('Overview');
  const [dateFilter, setDateFilter] = useState('This Month');

  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<{ month: string; revenue: number; members: number }[]>([]);
  const [membershipReport, setMembershipReport] = useState<{ plan: string; receivable: number; received: number; remaining: number; refund: number }[]>([]);
  const [pendingReport, setPendingReport] = useState<any[]>([]);
  const [allMemberships, setAllMemberships] = useState<Member[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, memRes] = await Promise.all([
        dashboardApi.getStats(),
        membersApi.getAll({ limit: '1000' }),
      ]);
      const s = dashRes.data;
      const m = memRes.data.members;

      // Construct monthlyData from memberGrowth and revenueChart
      const mGrowth = s.memberGrowth || [];
      const mRev = s.revenueChart || [];
      
      const merged = mRev.map((r: any) => {
        const growth = mGrowth.find((g: any) => g.month === r.month);
        return { month: r.month, revenue: r.revenue, members: growth ? growth.count : 0 };
      });
      setMonthlyData(merged.length > 0 ? merged : [
        { month: 'Jan', revenue: 0, members: 0 },
        { month: 'Feb', revenue: 0, members: 0 }
      ]);

      // Construct membershipReport
      const planMap = new Map<string, any>();
      m.forEach(mem => {
        const pName = mem.plan?.name || 'Unknown';
        if (!planMap.has(pName)) planMap.set(pName, { plan: pName, receivable: 0, received: 0, remaining: 0, refund: 0 });
        const entry = planMap.get(pName);
        entry.received += mem.paidAmount;
        entry.remaining += mem.pendingAmount;
        entry.receivable += mem.paidAmount + mem.pendingAmount;
      });
      setMembershipReport(Array.from(planMap.values()));

      // Construct pendingReport
      setPendingReport(s.pendingPaymentsList || []);
      setAllMemberships(m);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const fmt = (n: number) => '₹' + (n || 0).toLocaleString('en-IN');


  return (
    <div className="min-h-full">
      <Header title="Sales & Reports" subtitle="Monitor membership revenue, track payments and analyze performance" />
      <div className="p-4 sm:p-6 space-y-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {['Today', 'This Week', 'This Month', 'This Year'].map(d => (
              <button key={d} onClick={() => setDateFilter(d)}
                className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors"
                style={dateFilter === d ? { background: 'hsl(24 95% 53%)', color: 'white' } : { border: '1px solid #e5e7eb', color: '#4b5563' }}>
                {d}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"><RefreshCw size={13} /> Refresh</button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"><Filter size={13} /> Filter by Name</button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"><Download size={13} /> Export</button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 flex overflow-x-auto">
            {['Overview', 'Membership Report', 'Pending Payments', 'All Memberships'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-3.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${tab === t ? 'text-orange-600 bg-orange-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                style={tab === t ? { borderBottomColor: 'hsl(24 95% 53%)' } : {}}>
                {t}
              </button>
            ))}
          </div>

          <div className="p-5">
            {loading ? (
              <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : tab === 'Overview' ? (
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                  <h3 className="font-bold text-gray-900 mb-2">Monthly Revenue (₹)</h3>
                  <div className="h-[280px] w-full">
                    <ReactApexChart 
                      options={{
                        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit', parentHeightOffset: 0 },
                        colors: ['#4F46E5'],
                        plotOptions: { bar: { borderRadius: 6, columnWidth: '35%' } },
                        dataLabels: { enabled: false },
                        xaxis: { 
                          categories: monthlyData.map(d => d.month), 
                          axisBorder: { show: false }, 
                          axisTicks: { show: false },
                          labels: { style: { colors: '#64748b' } }
                        },
                        yaxis: { 
                          labels: { 
                            formatter: (val) => `${(val / 1000).toFixed(0)}K`,
                            style: { colors: '#64748b' }
                          } 
                        },
                        grid: { borderColor: '#f1f5f9', strokeDashArray: 4, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
                        fill: { 
                          type: 'gradient', 
                          gradient: { type: 'vertical', shadeIntensity: 1, opacityFrom: 1, opacityTo: 0.8, colorStops: [ { offset: 0, color: '#818cf8', opacity: 1 }, { offset: 100, color: '#4F46E5', opacity: 1 } ] } 
                        },
                        tooltip: { theme: 'light', y: { formatter: (val) => `₹${val.toLocaleString()}` } }
                      }}
                      series={[{ name: 'Revenue', data: monthlyData.map(d => d.revenue) }]}
                      type="bar"
                      height="100%"
                    />
                  </div>
                </div>
                
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                  <h3 className="font-bold text-gray-900 mb-2">New Members Trend</h3>
                  <div className="h-[250px] w-full">
                    <ReactApexChart 
                      options={{
                        chart: { type: 'area', toolbar: { show: false }, fontFamily: 'inherit', parentHeightOffset: 0 },
                        colors: ['#F43F5E'],
                        dataLabels: { enabled: false },
                        stroke: { curve: 'smooth', width: 3 },
                        xaxis: { 
                          categories: monthlyData.map(d => d.month), 
                          axisBorder: { show: false }, 
                          axisTicks: { show: false },
                          labels: { style: { colors: '#64748b' } }
                        },
                        yaxis: { labels: { style: { colors: '#64748b' } } },
                        grid: { borderColor: '#f1f5f9', strokeDashArray: 4, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
                        fill: { 
                          type: 'gradient', 
                          gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0, stops: [0, 100] } 
                        },
                        tooltip: { theme: 'light' }
                      }}
                      series={[{ name: 'New Members', data: monthlyData.map(d => d.members) }]}
                      type="area"
                      height="100%"
                    />
                  </div>
                </div>
              </div>
            ) : tab === 'Membership Report' ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50"><tr>{['Plan', 'Total Receivable', 'Amount Received', 'Remaining', 'Refund'].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {membershipReport.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.plan}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">₹{r.receivable.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm font-medium text-green-600">₹{r.received.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm font-medium text-yellow-600">₹{r.remaining.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-red-500">₹{r.refund.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                      <td className="px-4 py-3 text-sm text-gray-900">Total</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{fmt(membershipReport.reduce((a, b) => a + b.receivable, 0))}</td>
                      <td className="px-4 py-3 text-sm text-green-700">{fmt(membershipReport.reduce((a, b) => a + b.received, 0))}</td>
                      <td className="px-4 py-3 text-sm text-yellow-700">{fmt(membershipReport.reduce((a, b) => a + b.remaining, 0))}</td>
                      <td className="px-4 py-3 text-sm text-red-600">{fmt(membershipReport.reduce((a, b) => a + b.refund, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : tab === 'Pending Payments' ? (
              <div>
                <p className="text-sm text-gray-500 mb-4">{pendingReport.length} members with pending payments</p>
                <div className="space-y-3">
                  {pendingReport.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-orange-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-semibold text-sm">{p.name.charAt(0)}</div>
                        <div><p className="font-medium text-gray-900">{p.name}</p><p className="text-xs text-gray-500">ID: {p.id}</p></div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right"><p className="font-bold text-red-600">{fmt(p.pendingAmount)}</p><p className="text-xs text-gray-400">Expires {new Date(p.expiryDate).toLocaleDateString('en-IN')}</p></div>
                        <button className="px-3 py-1.5 text-xs text-white rounded-lg font-medium" style={{ background: 'hsl(24 95% 53%)' }}>Send Reminder</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : tab === 'All Memberships' ? (
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['All', 'Active', 'Expiring Soon', 'Expired'].map(f => (
                    <button key={f} className="px-3 py-1.5 text-xs rounded-full font-medium border border-gray-200 text-gray-600 hover:bg-gray-50" style={f === 'All' ? { background: 'hsl(24 95% 53%)', color: 'white', border: 'none' } : {}}>{f}</button>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50"><tr>{['Member', 'Plan', 'Start', 'End Date', 'Status', 'Amount', 'Days Left'].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {allMemberships.map((r, i) => {
                        const days = Math.ceil((new Date(r.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                        return (
                          <tr key={r.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{r.plan?.name || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{new Date(r.joinDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{new Date(r.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td className="px-4 py-3"><span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${r.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span></td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{fmt(r.paidAmount)}</td>
                            <td className="px-4 py-3 text-sm font-medium" style={{ color: days < 0 ? '#ef4444' : days <= 7 ? '#ef4444' : days <= 30 ? '#f59e0b' : '#22c55e' }}>{days < 0 ? `${Math.abs(days)}d ago` : `${days} days`}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Toast, { ToastType } from '@/components/Toast';
import { FileText, TrendingUp, DollarSign, Plus, Trash2, X, RefreshCw } from 'lucide-react';
import { financeApi, membersApi, type Payment, type FinanceSummary, type Member } from '@/lib/api';

const fmt = (n: number) => '₹' + (n || 0).toLocaleString('en-IN');

const METHOD_COLORS: Record<string, string> = {
  UPI:        'bg-purple-100 text-purple-700',
  Cash:       'bg-green-100  text-green-700',
  Card:       'bg-blue-100   text-blue-700',
  NetBanking: 'bg-orange-100 text-orange-700',
};
const STATUS_COLORS: Record<string, string> = {
  PAID:     'bg-green-100  text-green-700',
  DUE:      'bg-red-100    text-red-700',
  REFUNDED: 'bg-yellow-100 text-yellow-700',
};

export default function Finance() {
  const [tab, setTab]               = useState('Payments');
  const [payments, setPayments]     = useState<Payment[]>([]);
  const [summary, setSummary]       = useState<FinanceSummary | null>(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState<{ message: string; type: ToastType } | null>(null);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm] = useState({ memberId: '', amount: '', method: 'UPI', notes: '' });
  const [activeMembers, setActiveMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (showModal && activeMembers.length === 0) {
      membersApi.getAll({ limit: '1000' }).then(res => setActiveMembers(res.data.members || []));
    }
  }, [showModal, activeMembers.length]);

  const showToast = useCallback((msg: string, t: ToastType) => setToast({ message: msg, type: t }), []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [paymentsRes, summaryRes] = await Promise.all([
        financeApi.getPayments({ limit: '200' }),
        financeApi.getSummary(),
      ]);
      setPayments(paymentsRes.data.payments);
      setSummary(summaryRes.data);
    } catch (e) { showToast((e as Error).message, 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await financeApi.createPayment({ memberId: Number(form.memberId), amount: Number(form.amount), method: form.method, notes: form.notes });
      showToast('Payment recorded!', 'success');
      setShowModal(false);
      setForm({ memberId: '', amount: '', method: 'UPI', notes: '' });
      await loadAll();
    } catch (err) { showToast((err as Error).message, 'error'); }
    finally { setSaving(false); }
  };

  const kpis = summary ? [
    { label: 'Total Revenue',   value: fmt(summary.totalRevenue),   icon: TrendingUp, color: 'text-green-600',  bg: 'bg-green-50'  },
    { label: 'Monthly Revenue', value: fmt(summary.monthlyRevenue), icon: DollarSign, color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { label: 'Pending Amount',  value: fmt(summary.pendingAmount),  icon: FileText,   color: 'text-red-600',    bg: 'bg-red-50'    },
    { label: 'Total Payments',  value: summary.totalPayments,       icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ] : [];

  return (
    <div className="min-h-full pb-10">
      <Header title="Finance" subtitle="Track revenue, payments and financial overview" />
      <div className="p-4 sm:p-6 space-y-5">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center`}><k.icon size={19} className={k.color} /></div>
              <div><p className="text-xs text-gray-500 font-medium">{k.label}</p><p className="text-xl font-bold text-gray-900">{k.value}</p></div>
            </div>
          ))}
        </div>

        {/* Revenue by Method */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(summary.revenueByMethod).map(([method, amount]) => (
              <div key={method} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">{method}</p>
                <p className="text-lg font-bold text-gray-900">{fmt(amount as number)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 flex justify-between items-center">
            <div className="flex">
              {['Payments', 'Summary'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${tab === t ? 'text-orange-600 bg-orange-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  style={tab === t ? { borderBottomColor: 'hsl(24 95% 53%)' } : {}}>{t}</button>
              ))}
            </div>
            <div className="px-4 flex gap-2">
              <button onClick={loadAll} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"><RefreshCw size={14} /></button>
              <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90" style={{ background: 'hsl(24 95% 53%)' }}><Plus size={14} /> Add Payment</button>
            </div>
          </div>

          <div className="p-5">
            {tab === 'Payments' && (
              loading ? <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div> : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50"><tr>{['Invoice No', 'Member', 'Amount', 'Method', 'Status', 'Date'].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {payments.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-mono text-gray-700">{p.invoiceNo}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.member?.name || `Member #${p.memberId}`}</td>
                          <td className="px-4 py-3 text-sm font-bold text-green-700">{fmt(p.amount)}</td>
                          <td className="px-4 py-3"><span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${METHOD_COLORS[p.method] || 'bg-gray-100 text-gray-700'}`}>{p.method}</span></td>
                          <td className="px-4 py-3"><span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-700'}`}>{p.status}</span></td>
                          <td className="px-4 py-3 text-sm text-gray-600">{new Date(p.paidAt).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                      {payments.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-400">No payments recorded yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {tab === 'Summary' && summary && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Monthly Revenue (Last 6 Months)</h3>
                <div className="space-y-2">
                  {summary.monthlyData.map((d, i) => {
                    const max = Math.max(...summary.monthlyData.map(x => x.revenue), 1);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-20">{d.month}</span>
                        <div className="flex-1 h-6 bg-gray-100 rounded-full flex items-center">
                          <div className="h-full rounded-full flex items-center pl-3" style={{ width: `${Math.max((d.revenue / max) * 100, 2)}%`, background: 'hsl(24 95% 53%)' }}>
                            {(d.revenue / max) > 0.15 && d.revenue > 0 && <span className="text-xs text-white font-medium">{fmt(d.revenue)}</span>}
                          </div>
                          {(d.revenue / max) <= 0.15 && d.revenue > 0 && <span className="text-xs text-gray-700 font-medium ml-2">{fmt(d.revenue)}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Record Payment</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddPayment} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member</label>
                <select required value={form.memberId} onChange={e => setForm({ ...form, memberId: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                  <option value="">Select a member</option>
                  {activeMembers.map(m => <option key={m.id} value={m.id}>{m.name} (ID: {m.id})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input required type="number" placeholder="2500" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select value={form.method} onChange={e => setForm({ ...form, method: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                  {['UPI', 'Cash', 'Card', 'NetBanking'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <input type="text" placeholder="Any notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-70" style={{ background: 'hsl(24 95% 53%)' }}>
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Toast, { ToastType } from '@/components/Toast';
import { Plus, Users, DollarSign, CheckCircle, Clock, X, Edit2, Trash2, RefreshCw, Save } from 'lucide-react';
import { hrApi, type Staff, type Payroll, type HrSummary } from '@/lib/api';

const fmt = (n: number) => '₹' + (n || 0).toLocaleString('en-IN');
const tabs = ['Staff', 'Payroll'];

const emptyStaff = { name: '', email: '', phone: '', role: '', salary: 0, branch: 'Main Branch', gender: 'MALE', address: '', joinDate: new Date().toISOString().split('T')[0] };

export default function HR() {
  const [activeTab, setActiveTab]   = useState('Staff');
  const [staff, setStaff]           = useState<Staff[]>([]);
  const [payrolls, setPayrolls]     = useState<Payroll[]>([]);
  const [summary, setSummary]       = useState<HrSummary | null>(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState<{ message: string; type: ToastType } | null>(null);

  const [showModal, setShowModal]   = useState(false);
  const [editId, setEditId]         = useState<number | null>(null);
  const [form, setForm]             = useState(emptyStaff);

  const showToast = useCallback((msg: string, t: ToastType) => setToast({ message: msg, type: t }), []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [staffRes, payrollRes, summaryRes] = await Promise.all([
        hrApi.getStaff(),
        hrApi.getPayrolls(),
        hrApi.getSummary(),
      ]);
      setStaff(staffRes.data);
      setPayrolls(payrollRes.data);
      setSummary(summaryRes.data);
    } catch (e) { showToast((e as Error).message, 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const openAdd = () => { setEditId(null); setForm(emptyStaff); setShowModal(true); };
  const openEdit = (s: Staff) => {
    setEditId(s.id);
    setForm({ name: s.name, email: s.email, phone: s.phone, role: s.role, salary: s.salary, branch: s.branch, gender: s.gender, address: s.address || '', joinDate: new Date(s.joinDate).toISOString().split('T')[0] });
    setShowModal(true);
  };

  const saveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, salary: Number(form.salary), joinDate: new Date(form.joinDate).toISOString() };
      if (editId) { await hrApi.updateStaff(editId, payload); showToast('Staff updated!', 'success'); }
      else { await hrApi.createStaff(payload); showToast('Staff added!', 'success'); }
      setShowModal(false);
      await loadAll();
    } catch (err) { showToast((err as Error).message, 'error'); }
    finally { setSaving(false); }
  };

  const deleteStaff = async (id: number) => {
    if (!confirm('Remove this staff member?')) return;
    try { await hrApi.removeStaff(id); showToast('Staff removed', 'success'); await loadAll(); }
    catch (err) { showToast((err as Error).message, 'error'); }
  };

  const markPayrollPaid = async (id: number) => {
    try { await hrApi.updatePayrollStatus(id, 'Paid'); showToast('Payroll marked as paid!', 'success'); await loadAll(); }
    catch (err) { showToast((err as Error).message, 'error'); }
  };

  return (
    <div className="min-h-full pb-10">
      <Header title="HR Management" subtitle="Manage staff, shifts, and payroll" />
      <div className="p-4 sm:p-6 space-y-5">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Staff',     value: summary?.totalStaff || 0,           color: 'text-blue-600',   bg: 'bg-blue-50',   icon: Users },
            { label: 'Active Staff',    value: summary?.activeStaff || 0,          color: 'text-green-600',  bg: 'bg-green-50',  icon: CheckCircle },
            { label: 'Payroll (Month)', value: fmt(summary?.totalPayrollThisMonth || 0), color: 'text-orange-600', bg: 'bg-orange-50', icon: DollarSign },
            { label: 'Pending Payroll', value: summary?.pendingCount || 0,         color: 'text-red-600',    bg: 'bg-red-50',    icon: Clock },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon size={19} className={s.color} /></div>
              <div><p className="text-xs text-gray-500 font-medium">{s.label}</p><p className="text-xl font-bold text-gray-900">{s.value}</p></div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 flex justify-between items-center">
            <div className="flex">
              {tabs.map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${activeTab === t ? 'text-orange-600 bg-orange-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  style={activeTab === t ? { borderBottomColor: 'hsl(24 95% 53%)' } : {}}>{t}</button>
              ))}
            </div>
            <div className="px-4 flex gap-2">
              <button onClick={loadAll} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"><RefreshCw size={14} /></button>
              {activeTab === 'Staff' && (
                <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90" style={{ background: 'hsl(24 95% 53%)' }}><Plus size={14} /> Add Staff</button>
              )}
            </div>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : activeTab === 'Staff' ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50"><tr>{['Name', 'Role', 'Phone', 'Branch', 'Salary', 'Joined', 'Actions'].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {staff.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">{s.name.charAt(0)}</div>
                            <div><p className="text-sm font-medium text-gray-900">{s.name}</p><p className="text-xs text-gray-500">{s.email}</p></div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{s.role}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.phone}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.branch}</td>
                        <td className="px-4 py-3 text-sm font-medium text-green-700">{fmt(s.salary)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{new Date(s.joinDate).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100" title="Edit"><Edit2 size={14} /></button>
                            <button onClick={() => deleteStaff(s.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100" title="Delete"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {staff.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-400">No staff members added yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50"><tr>{['Staff', 'Month', 'Amount', 'Status', 'Paid On', 'Actions'].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {payrolls.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.staff?.name || `Staff #${p.staffId}`}<div className="text-xs text-gray-500">{p.staff?.role}</div></td>
                        <td className="px-4 py-3 text-sm text-gray-700">{p.month}</td>
                        <td className="px-4 py-3 text-sm font-bold text-green-700">{fmt(p.amount)}</td>
                        <td className="px-4 py-3"><span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${p.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span></td>
                        <td className="px-4 py-3 text-sm text-gray-600">{p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : '—'}</td>
                        <td className="px-4 py-3">
                          {p.status !== 'Paid' && (
                            <button onClick={() => markPayrollPaid(p.id)} className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg hover:opacity-90" style={{ background: 'hsl(24 95% 53%)' }}>Mark Paid</button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {payrolls.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-400">No payroll records yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{editId ? 'Edit Staff' : 'Add Staff Member'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={saveStaff} className="p-4 sm:p-6 space-y-4">
              {[
                { label: 'Full Name', key: 'name', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Phone', key: 'phone', type: 'tel' },
                { label: 'Role', key: 'role', type: 'text', placeholder: 'Trainer, Receptionist, Manager...' },
                { label: 'Monthly Salary (₹)', key: 'salary', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input required type={f.type} placeholder={f.placeholder} value={(form as Record<string, string | number>)[f.key] as string} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              ))}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                    <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                  <select value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                    {['Main Branch', 'Branch 2', 'Branch 3'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
                <input type="date" value={form.joinDate} onChange={e => setForm({ ...form, joinDate: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-70" style={{ background: 'hsl(24 95% 53%)' }}>
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={15} />{editId ? 'Update' : 'Add Staff'}</>}
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

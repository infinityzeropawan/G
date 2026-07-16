'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import MessageModal, { MessageType, MessageRecipient } from '@/components/MessageModal';
import Toast, { ToastType } from '@/components/Toast';
import {
  Plus, Search, Filter, Eye, Edit, RefreshCw,
  X, User, MessageCircle, Mail, Trash2, CheckCircle, XCircle,
  Calendar, CreditCard, Clock, Save, Printer
} from 'lucide-react';
import ThermalReceipt, { ReceiptData } from '@/components/ThermalReceipt';
import { membersApi, plansApi, financeApi, type Member, type Plan, type Payment } from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => '₹' + (n || 0).toLocaleString('en-IN');

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:   'bg-green-100 text-green-700',
  PENDING:  'bg-yellow-100 text-yellow-700',
  EXPIRED:  'bg-red-100 text-red-700',
};

const CYCLE_LABELS: Record<string, string> = {
  ONE_MONTH:     '1 Month',
  THREE_MONTHS:  '3 Months',
  SIX_MONTHS:    '6 Months',
  TWELVE_MONTHS: '12 Months',
};

function getPriceForCycle(plan: Plan | undefined, cycle: string): number {
  if (!plan) return 0;
  const map: Record<string, number> = {
    ONE_MONTH:     plan.price1Month,
    THREE_MONTHS:  plan.price3Month,
    SIX_MONTHS:    plan.price6Month,
    TWELVE_MONTHS: plan.price12Month,
  };
  return map[cycle] || 0;
}



// ─── Component ────────────────────────────────────────────────────────────────

export default function Members() {
  // Data state
  const [members, setMembers]     = useState<Member[]>([]);
  const [plans, setPlans]         = useState<Plan[]>([]);
  const [payments, setPayments]   = useState<Payment[]>([]);
  const [stats, setStats]         = useState({ total: 0, active: 0, pending: 0, expired: 0 });
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);

  // Filter
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [showAddModal, setShowAddModal]   = useState(false);
  const [editId, setEditId]              = useState<number | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [profileTab, setProfileTab]      = useState<'overview' | 'attendance' | 'payments'>('overview');

  // Form
  const emptyForm = { name: '', email: '', phone: '', address: '', gender: 'MALE', branch: 'Main Branch', billingCycle: 'ONE_MONTH', planId: 1 };
  const [form, setForm] = useState(emptyForm);

  // Messaging & Printing
  const [msgModal, setMsgModal]   = useState<{ open: boolean; recipient: MessageRecipient; type: MessageType; message: string; subject?: string } | null>(null);
  const [toast, setToast]         = useState<{ message: string; type: ToastType } | null>(null);
  const [printData, setPrintData] = useState<ReceiptData | null>(null);

  // Attendance (local toggle — for demo; can be wired to API later)
  const [attMap, setAttMap]       = useState<Record<number, { day: number; status: string }[]>>({});

  const showToast  = useCallback((msg: string, t: ToastType) => setToast({ message: msg, type: t }), []);
  const closeMsg   = useCallback(() => setMsgModal(null), []);

  // ─── Load Data ─────────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, plansRes, statsRes] = await Promise.all([
        membersApi.getAll({ limit: '500' }),
        plansApi.getAll(),
        membersApi.getStats(),
      ]);
      setMembers(membersRes.data.members);
      setPlans(plansRes.data);
      setStats(statsRes.data);
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const loadMemberProfile = async (memberId: number) => {
    try {
      const pRes = await financeApi.getByMember(memberId);
      setPayments(pRes.data);
      // Fetch real attendance
      const tokenRes = await fetch('/api/auth/token');
      const { token } = tokenRes.ok ? await tokenRes.json() : { token: null };
      const aRes = await fetch(`http://localhost:5000/api/attendance?memberId=${memberId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).then(r => r.json());
      if (aRes.success) {
        // Convert real DB attendance records to the day status format expected by UI
        // This is a naive conversion for current month for demonstration, but driven by DB
        const daysInMonth = 30;
        const realAtt = Array.from({ length: daysInMonth }, (_, i) => {
          const d = i + 1;
          const rec = aRes.data.find((a: any) => new Date(a.date).getDate() === d);
          return { day: d, status: rec ? 'P' : 'A' };
        });
        setAttMap(prev => ({ ...prev, [memberId]: realAtt }));
      }
    } catch { 
      setPayments([]); 
      setAttMap(prev => ({ ...prev, [memberId]: [] }));
    }
  };

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowAddModal(true); };
  const openEdit = (m: Member) => {
    setEditId(m.id);
    setForm({ name: m.name, email: m.email, phone: m.phone, address: m.address || '', gender: m.gender, branch: m.branch, billingCycle: m.billingCycle, planId: m.planId });
    setShowAddModal(true);
  };

  const saveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await membersApi.update(editId, { ...form, planId: Number(form.planId) });
        showToast('Member updated!', 'success');
      } else {
        await membersApi.create({ ...form, planId: Number(form.planId), joinDate: new Date().toISOString() });
        showToast('Member added!', 'success');
      }
      setShowAddModal(false);
      await loadAll();
    } catch (err) { showToast((err as Error).message, 'error'); }
    finally { setSaving(false); }
  };

  const deleteMember = async (id: number) => {
    if (!confirm('Delete this member?')) return;
    try {
      await membersApi.remove(id);
      showToast('Member deleted', 'success');
      if (selectedMember?.id === id) setSelectedMember(null);
      await loadAll();
    } catch (err) { showToast((err as Error).message, 'error'); }
  };

  // ─── Filter ────────────────────────────────────────────────────────────────

  const filtered = members.filter(m => {
    const ms = m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search);
    const mf = statusFilter === 'All' || m.status === statusFilter;
    return ms && mf;
  });

  // ─── Attendance helpers ─────────────────────────────────────────────────────

  const getAtt = (id: number) => attMap[id] || [];
  const toggleAtt = (memberId: number, day: number) => {
    const att = getAtt(memberId).map(a => a.day === day ? { ...a, status: a.status === 'P' ? 'A' : a.status === 'A' ? 'L' : 'P' } : a);
    setAttMap(prev => ({ ...prev, [memberId]: att }));
  };

  // ─── Messaging ────────────────────────────────────────────────────────────

  const openMsg = (m: Member, type: MessageType) => {
    const tpl = m.status === 'EXPIRED'
      ? `Hi ${m.name}! 🔔\n\nYour membership has expired. Renew today to continue your fitness journey!\n\n— Team GymSmart`
      : m.pendingAmount > 0
        ? `Hi ${m.name} 🙏\n\nFriendly reminder: You have a pending amount of ${fmt(m.pendingAmount)}. Please clear your dues at the earliest.\n\n— Team GymSmart`
        : `Hi ${m.name}! 👋\n\nThis is a message from GymSmart. We hope you're enjoying your fitness journey!\n\n— Team GymSmart`;
    setMsgModal({ open: true, type, recipient: { name: m.name, phone: m.phone, email: m.email }, message: tpl });
  };

  const handlePrint = (p: Payment) => {
    const m = selectedMember!;
    setPrintData({
      gymName: 'GymSmart Fitness', gymPhone: '+91 83479 77566',
      receiptNo: p.invoiceNo,
      date: new Date(p.paidAt).toLocaleDateString('en-IN'),
      customerName: m.name,
      items: [{ name: `Membership - ${m.plan?.name || ''}`, price: p.amount, amount: p.amount }],
      total: p.amount, paymentMethod: p.method,
    });
    setTimeout(() => window.print(), 100);
  };

  // ─── Profile View ─────────────────────────────────────────────────────────

  if (selectedMember) {
    const att = getAtt(selectedMember.id);
    const presentDays = att.filter(a => a.status === 'P').length;
    const absentDays  = att.filter(a => a.status === 'A').length;
    const leaveDays   = att.filter(a => a.status === 'L').length;
    const attPct      = Math.round((presentDays / att.length) * 100);
    const totalPaid   = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
    const totalDue    = payments.filter(p => p.status === 'DUE').reduce((s, p) => s + p.amount, 0);

    return (
      <div className="min-h-full">
        <Header title="Member Profile" subtitle={`Viewing profile of ${selectedMember.name}`} />
        <div className="p-4 sm:p-6 space-y-5">
          <button onClick={() => setSelectedMember(null)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5">← Back to Members</button>

          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-wrap items-center justify-between gap-5 mb-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white" style={{ background: 'hsl(24 95% 53%)' }}>{selectedMember.name.charAt(0)}</div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedMember.name}</h2>
                  <p className="text-gray-500 text-sm">{selectedMember.email} · {selectedMember.phone}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selectedMember.status] || 'bg-gray-100 text-gray-700'}`}>{selectedMember.status}</span>
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{selectedMember.plan?.name || ''}</span>
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">{CYCLE_LABELS[selectedMember.billingCycle] || selectedMember.billingCycle}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => openEdit(selectedMember)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700"><Edit size={14} /> Edit</button>
                <button onClick={() => openMsg(selectedMember, 'whatsapp')} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl" style={{ background: '#25D366' }}><MessageCircle size={14} /> WhatsApp</button>
                <button onClick={() => openMsg(selectedMember, 'email')} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl" style={{ background: 'hsl(217 91% 60%)' }}><Mail size={14} /> Email</button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Member ID',   value: `GS${String(selectedMember.id).padStart(4, '0')}` },
                { label: 'Branch',      value: selectedMember.branch },
                { label: 'Gender',      value: selectedMember.gender },
                { label: 'Join Date',   value: new Date(selectedMember.joinDate).toLocaleDateString('en-IN') },
                { label: 'Expiry Date', value: new Date(selectedMember.expiryDate).toLocaleDateString('en-IN') },
                { label: 'Address',     value: selectedMember.address || 'N/A' },
                { label: 'Total Paid',  value: fmt(selectedMember.paidAmount) },
                { label: 'Pending',     value: fmt(selectedMember.pendingAmount) },
              ].map((f, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-0.5">{f.label}</p>
                  <p className="text-sm font-semibold text-gray-900">{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sub Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100">
              {([['overview', 'Overview'], ['attendance', 'Attendance'], ['payments', 'Payment History']] as [typeof profileTab, string][]).map(([t, label]) => (
                <button key={t} onClick={() => { setProfileTab(t); if (t === 'payments') loadMemberProfile(selectedMember.id); }}
                  className={`px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${profileTab === t ? 'text-orange-600 bg-orange-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  style={profileTab === t ? { borderBottomColor: 'hsl(24 95% 53%)' } : {}}>{label}</button>
              ))}
            </div>

            <div className="p-5">
              {/* Overview Tab */}
              {profileTab === 'overview' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Member Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between p-3 bg-green-50 rounded-lg"><span className="text-sm text-gray-600">Total Paid</span><span className="font-bold text-green-600">{fmt(selectedMember.paidAmount)}</span></div>
                      <div className="flex justify-between p-3 bg-red-50 rounded-lg"><span className="text-sm text-gray-600">Pending Amount</span><span className="font-bold text-red-600">{fmt(selectedMember.pendingAmount)}</span></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => openMsg(selectedMember, 'whatsapp')} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl justify-center" style={{ background: '#25D366' }}><MessageCircle size={14} /> Send WhatsApp</button>
                      <button onClick={() => openMsg(selectedMember, 'email')} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl justify-center" style={{ background: 'hsl(217 91% 60%)' }}><Mail size={14} /> Send Email</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Attendance Tab */}
              {profileTab === 'attendance' && (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Present',      value: presentDays, color: 'text-green-600', bg: 'bg-green-50' },
                      { label: 'Absent',       value: absentDays,  color: 'text-red-600',   bg: 'bg-red-50'   },
                      { label: 'Leave',        value: leaveDays,   color: 'text-yellow-600',bg: 'bg-yellow-50'},
                      { label: 'Attendance %', value: `${attPct}%`, color: attPct >= 75 ? 'text-green-600' : 'text-red-600', bg: 'bg-gray-50' },
                    ].map((s, i) => (
                      <div key={i} className={`${s.bg} rounded-xl p-4`}><p className="text-xs text-gray-500 mb-1">{s.label}</p><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p></div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mb-3">Click a day to toggle: 🟢 Present → 🔴 Absent → 🟡 Leave</p>
                  <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-10">
                    {att.map(({ day, status }) => (
                      <button key={day} onClick={() => toggleAtt(selectedMember.id, day)}
                        className={`h-10 w-full rounded-lg flex items-center justify-center text-xs font-bold transition-all hover:scale-110 ${status === 'P' ? 'bg-green-100 text-green-700' : status === 'A' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment History Tab */}
              {profileTab === 'payments' && (
                <div>
                  <div className="grid grid-cols-3 gap-4 mb-5">
                    <div className="bg-green-50 rounded-xl p-4"><p className="text-xs text-gray-500">Total Paid</p><p className="text-xl font-bold text-green-600">{fmt(totalPaid)}</p></div>
                    <div className="bg-red-50 rounded-xl p-4"><p className="text-xs text-gray-500">Total Due</p><p className="text-xl font-bold text-red-600">{fmt(totalDue)}</p></div>
                    <div className="bg-blue-50 rounded-xl p-4"><p className="text-xs text-gray-500">Transactions</p><p className="text-xl font-bold text-blue-600">{payments.length}</p></div>
                  </div>
                  <div className="space-y-3">
                    {payments.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No payment records found.</p>}
                    {payments.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.invoiceNo}</p>
                          <p className="text-xs text-gray-500">{p.method} · {new Date(p.paidAt).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-600">{fmt(p.amount)}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.status}</span>
                          </div>
                          <button onClick={() => handlePrint(p)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"><Printer size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        {msgModal?.open && <MessageModal {...msgModal} onClose={closeMsg} onSuccess={msg => { showToast(msg, 'success'); closeMsg(); }} />}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        {printData && <ThermalReceipt data={printData} />}
      </div>
    );
  }

  // ─── Main List View ────────────────────────────────────────────────────────

  return (
    <div className="min-h-full pb-10">
      <Header title="Members" subtitle="Manage all gym members, memberships and payments" />
      <div className="p-4 sm:p-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Members', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50',   icon: User },
            { label: 'Active',        value: stats.active, color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
            { label: 'Pending',       value: stats.pending, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock },
            { label: 'Expired',       value: stats.expired, color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon size={19} className={s.color} /></div>
              <div><p className="text-xs text-gray-500 font-medium">{s.label}</p><p className="text-xl font-bold text-gray-900">{s.value}</p></div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone..." className="pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 w-64" />
          </div>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-xl text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
              <option value="All">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="EXPIRED">Expired</option>
            </select>
            <button onClick={loadAll} className="flex items-center gap-2 px-3 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600"><RefreshCw size={14} /> Refresh</button>
            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity" style={{ background: 'hsl(24 95% 53%)' }}><Plus size={16} /> Add Member</button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>{['Member', 'Plan', 'Status', 'Billing Cycle', 'Paid', 'Pending', 'Expiry', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">{m.name.charAt(0)}</div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                            <p className="text-xs text-gray-500">{m.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-700">{m.plan?.name || `Plan #${m.planId}`}</td>
                      <td className="px-5 py-3.5"><span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[m.status] || 'bg-gray-100 text-gray-700'}`}>{m.status}</span></td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{CYCLE_LABELS[m.billingCycle] || m.billingCycle}</td>
                      <td className="px-5 py-3.5 text-sm font-medium text-green-700">{fmt(m.paidAmount)}</td>
                      <td className="px-5 py-3.5 text-sm font-medium text-red-600">{m.pendingAmount > 0 ? fmt(m.pendingAmount) : '—'}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{new Date(m.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setSelectedMember(m); loadMemberProfile(m.id); }} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100" title="View Profile"><Eye size={14} /></button>
                          <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100" title="Edit"><Edit size={14} /></button>
                          <button onClick={() => openMsg(m, 'whatsapp')} className="p-1.5 rounded-lg text-white" style={{ background: '#25D366' }} title="WhatsApp"><MessageCircle size={14} /></button>
                          <button onClick={() => openMsg(m, 'email')} className="p-1.5 rounded-lg text-white" style={{ background: 'hsl(217 91% 60%)' }} title="Email"><Mail size={14} /></button>
                          <button onClick={() => deleteMember(m.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100" title="Delete"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && !loading && (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-400">
                      {search || statusFilter !== 'All' ? 'No members match the filter.' : 'No members yet. Add your first member!'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{editId ? 'Edit Member' : 'Add New Member'}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={saveMember} className="p-4 sm:p-6 space-y-4">
              {[
                { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Rahul Sharma' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'rahul@gmail.com' },
                { label: 'Phone', key: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
                { label: 'Address', key: 'address', type: 'text', placeholder: 'Andheri, Mumbai' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input required={f.key !== 'address'} type={f.type} placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                  <select value={form.planId} onChange={e => setForm({ ...form, planId: Number(e.target.value) })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
                  <select value={form.billingCycle} onChange={e => setForm({ ...form, billingCycle: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                    {Object.entries(CYCLE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                </div>
              </div>
              {form.planId && (
                <div className="bg-orange-50 rounded-xl p-3 text-sm">
                  <span className="font-medium text-orange-700">Price: </span>
                  <span className="text-orange-800">{fmt(getPriceForCycle(plans.find(p => p.id === Number(form.planId))!, form.billingCycle))}</span>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-70" style={{ background: 'hsl(24 95% 53%)' }}>
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={15} /> {editId ? 'Update' : 'Add Member'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Messaging & Toast */}
      {msgModal?.open && <MessageModal {...msgModal} onClose={closeMsg} onSuccess={msg => { showToast(msg, 'success'); closeMsg(); }} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {printData && <ThermalReceipt data={printData} />}
    </div>
  );
}

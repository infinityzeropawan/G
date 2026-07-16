'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import MessageModal, { MessageType, MessageRecipient } from '@/components/MessageModal';
import Toast, { ToastType } from '@/components/Toast';
import { MessageSquare, Plus, CheckCircle, Clock, MessageCircle, Mail, Edit2, Trash2, X, RefreshCw, Save } from 'lucide-react';
import { inquiriesApi, type Inquiry, type InquiryStats } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  NEW:       'bg-blue-100 text-blue-700',
  FOLLOW_UP: 'bg-yellow-100 text-yellow-700',
  CONVERTED: 'bg-green-100 text-green-700',
  LOST:      'bg-red-100 text-red-700',
};
const STATUS_LABELS: Record<string, string> = {
  NEW: 'New', FOLLOW_UP: 'Follow Up', CONVERTED: 'Converted', LOST: 'Lost',
};

const emptyForm = { name: '', phone: '', email: '', interest: '', status: 'NEW', source: 'Walk-in', notes: '' };

export default function Inquiries() {
  const [inquiries, setInquiries]   = useState<Inquiry[]>([]);
  const [stats, setStats]           = useState<InquiryStats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [tab, setTab]               = useState('Inquiries');
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast, setToast]           = useState<{ message: string; type: ToastType } | null>(null);
  const [msgModal, setMsgModal]     = useState<{ open: boolean; recipient: MessageRecipient; type: MessageType; message: string } | null>(null);
  const [showModal, setShowModal]   = useState(false);
  const [editId, setEditId]         = useState<number | null>(null);
  const [form, setForm]             = useState(emptyForm);

  const showToast = useCallback((msg: string, t: ToastType) => setToast({ message: msg, type: t }), []);
  const closeMsg  = useCallback(() => setMsgModal(null), []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [inqRes, statsRes] = await Promise.all([
        inquiriesApi.getAll({ limit: '200' }),
        inquiriesApi.getStats(),
      ]);
      setInquiries(inqRes.data.inquiries);
      setStats(statsRes.data);
    } catch (e) { showToast((e as Error).message, 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (inq: Inquiry) => {
    setEditId(inq.id);
    setForm({ name: inq.name, phone: inq.phone, email: inq.email || '', interest: inq.interest, status: inq.status, source: inq.source || 'Walk-in', notes: inq.notes || '' });
    setShowModal(true);
  };

  const saveInquiry = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editId) { await inquiriesApi.update(editId, form); showToast('Inquiry updated!', 'success'); }
      else { await inquiriesApi.create(form); showToast('Inquiry added!', 'success'); }
      setShowModal(false); await loadAll();
    } catch (err) { showToast((err as Error).message, 'error'); }
    finally { setSaving(false); }
  };

  const deleteInquiry = async (id: number) => {
    if (!confirm('Delete this inquiry?')) return;
    try { await inquiriesApi.remove(id); showToast('Deleted', 'success'); await loadAll(); }
    catch (err) { showToast((err as Error).message, 'error'); }
  };

  const openMsg = (inq: Inquiry, type: MessageType) => {
    const msg = `Hi ${inq.name}! 👋\n\nThank you for your interest in GymSmart!\n\nWe received your inquiry about ${inq.interest}. Our team will get in touch shortly.\n\n— Team GymSmart`;
    setMsgModal({ open: true, type, recipient: { name: inq.name, phone: inq.phone, email: inq.email || '' }, message: msg });
  };

  const filtered = inquiries.filter(inq => {
    const ms = inq.name.toLowerCase().includes(search.toLowerCase()) || inq.phone.includes(search);
    const mf = statusFilter === 'All' || inq.status === statusFilter;
    return ms && mf;
  });

  const statCards = stats ? [
    { label: 'Total Inquiries', value: stats.total,    icon: MessageSquare, color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { label: 'New',             value: stats.new,      icon: Plus,          color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Follow Up',       value: stats.followUp, icon: Clock,         color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Converted',       value: stats.converted,icon: CheckCircle,   color: 'text-green-600',  bg: 'bg-green-50'  },
  ] : [];

  return (
    <div className="min-h-full pb-10">
      <Header title="Inquiries & Leads" subtitle="Track, follow up, and convert leads into members" />
      <div className="p-4 sm:p-6 space-y-5">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon size={19} className={s.color} /></div>
              <div><p className="text-xs text-gray-500 font-medium">{s.label}</p><p className="text-xl font-bold text-gray-900">{s.value}</p></div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-3 items-center justify-between">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or phone..." className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 w-64" />
          <div className="flex gap-2">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-xl text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
              <option value="All">All Status</option>
              {Object.entries(STATUS_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
            <button onClick={loadAll} className="flex items-center gap-2 px-3 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600"><RefreshCw size={14} /></button>
            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90" style={{ background: 'hsl(24 95% 53%)' }}><Plus size={16} /> Add Inquiry</button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50"><tr>{['Lead', 'Contact', 'Interest', 'Source', 'Status', 'Date', 'Actions'].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(inq => (
                    <tr key={inq.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">{inq.name.charAt(0)}</div>
                          <p className="text-sm font-semibold text-gray-900">{inq.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><p className="text-sm text-gray-700">{inq.phone}</p><p className="text-xs text-gray-500">{inq.email || '—'}</p></td>
                      <td className="px-5 py-3.5 text-sm text-gray-700">{inq.interest}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{inq.source || '—'}</td>
                      <td className="px-5 py-3.5">
                        <select value={inq.status} onChange={async e => { await inquiriesApi.update(inq.id, { status: e.target.value }); await loadAll(); }}
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[inq.status] || 'bg-gray-100 text-gray-700'}`}>
                          {Object.entries(STATUS_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{new Date(inq.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openMsg(inq, 'whatsapp')} className="p-1.5 rounded-lg text-white" style={{ background: '#25D366' }} title="WhatsApp"><MessageCircle size={13} /></button>
                          <button onClick={() => openMsg(inq, 'email')} className="p-1.5 rounded-lg text-white" style={{ background: 'hsl(217 91% 60%)' }} title="Email"><Mail size={13} /></button>
                          <button onClick={() => openEdit(inq)} className="p-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100" title="Edit"><Edit2 size={13} /></button>
                          <button onClick={() => deleteInquiry(inq.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100" title="Delete"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && !loading && <tr><td colSpan={7} className="text-center py-12 text-gray-400">No inquiries found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{editId ? 'Edit Inquiry' : 'New Inquiry'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={saveInquiry} className="p-4 sm:p-6 space-y-4">
              {[
                { label: 'Full Name', key: 'name', type: 'text' },
                { label: 'Phone', key: 'phone', type: 'tel' },
                { label: 'Email (optional)', key: 'email', type: 'email', req: false },
                { label: 'Interest (Plan)', key: 'interest', type: 'text', placeholder: 'Basic Membership, Personal Training...' },
                { label: 'Notes', key: 'notes', type: 'text', req: false },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input required={f.req !== false} type={f.type} placeholder={f.placeholder} value={(form as Record<string, string>)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              ))}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                    {Object.entries(STATUS_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                    {['Walk-in', 'Call', 'Website', 'WhatsApp', 'Referral', 'Facebook', 'Instagram'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-70" style={{ background: 'hsl(24 95% 53%)' }}>
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={15} />{editId ? 'Update' : 'Add Inquiry'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {msgModal?.open && <MessageModal {...msgModal} onClose={closeMsg} onSuccess={msg => { showToast(msg, 'success'); closeMsg(); }} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

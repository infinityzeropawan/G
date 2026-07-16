'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Toast, { ToastType } from '@/components/Toast';
import { CalendarCheck, Users, UserCog, Clock, Plus, RefreshCw, X } from 'lucide-react';
import { attendanceApi, membersApi, hrApi, type Attendance, type Member, type Staff } from '@/lib/api';

const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime = (d?: string) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

export default function AttendancePage() {
  const [records, setRecords]   = useState<Attendance[]>([]);
  const [todayStats, setTodayStats] = useState({ totalCheckIns: 0, memberCheckIns: 0, staffCheckIns: 0 });
  const [members, setMembers]   = useState<Member[]>([]);
  const [staff, setStaff]       = useState<Staff[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState<{ message: string; type: ToastType } | null>(null);
  const [tab, setTab]           = useState<'All' | 'Members' | 'Staff'>('All');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'MEMBER', memberId: '', staffId: '', date: new Date().toISOString().split('T')[0], checkIn: '06:00' });

  const showToast = useCallback((msg: string, t: ToastType) => setToast({ message: msg, type: t }), []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [attRes, statsRes, memRes, staffRes] = await Promise.all([
        attendanceApi.getAll(),
        attendanceApi.getTodayStats(),
        membersApi.getAll({ limit: '200' }),
        hrApi.getStaff(),
      ]);
      setRecords(attRes.data);
      setTodayStats(statsRes.data);
      setMembers(memRes.data.members);
      setStaff(staffRes.data);
    } catch (e) { showToast((e as Error).message, 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const markAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dateTime = new Date(`${form.date}T${form.checkIn}:00`);
      const payload: any = { type: form.type, date: dateTime.toISOString(), checkIn: dateTime.toISOString() };
      if (form.type === 'MEMBER') payload.memberId = Number(form.memberId);
      else payload.staffId = Number(form.staffId);
      await attendanceApi.mark(payload);
      showToast('Attendance marked!', 'success');
      setShowModal(false);
      await loadAll();
    } catch (err) { showToast((err as Error).message, 'error'); }
    finally { setSaving(false); }
  };

  const filtered = records.filter(r =>
    tab === 'All' ? true : tab === 'Members' ? r.type === 'MEMBER' : r.type === 'STAFF'
  );

  return (
    <div className="min-h-full pb-10">
      <Header title="Attendance" subtitle="Track daily member and staff check-ins" />
      <div className="p-4 sm:p-6 space-y-5">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Today's Check-ins", value: todayStats.totalCheckIns, icon: CalendarCheck, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Member Check-ins',  value: todayStats.memberCheckIns, icon: Users,        color: 'text-blue-600',   bg: 'bg-blue-50'   },
            { label: 'Staff Check-ins',   value: todayStats.staffCheckIns,  icon: UserCog,      color: 'text-green-600',  bg: 'bg-green-50'  },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon size={19} className={s.color} /></div>
              <div><p className="text-xs text-gray-500 font-medium">{s.label}</p><p className="text-xl font-bold text-gray-900">{s.value}</p></div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 flex justify-between items-center">
            <div className="flex">
              {(['All', 'Members', 'Staff'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${tab === t ? 'text-orange-600 bg-orange-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  style={tab === t ? { borderBottomColor: 'hsl(24 95% 53%)' } : {}}>{t}</button>
              ))}
            </div>
            <div className="px-4 flex gap-2">
              <button onClick={loadAll} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"><RefreshCw size={14} /></button>
              <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: 'hsl(24 95% 53%)' }}><Plus size={14} /> Mark Attendance</button>
            </div>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50">
                    <tr>{['Name', 'Type', 'Date', 'Check In', 'Check Out'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${r.type === 'MEMBER' ? 'bg-blue-500' : 'bg-green-500'}`}>
                              {(r.member?.name || r.staff?.name || '?').charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{r.member?.name || r.staff?.name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${r.type === 'MEMBER' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{r.type}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{fmt(r.date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 flex items-center gap-1"><Clock size={13} className="text-gray-400" />{fmtTime(r.checkIn)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{fmtTime(r.checkOut)}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && !loading && (
                      <tr><td colSpan={5} className="text-center py-10 text-gray-400">No attendance records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mark Attendance Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Mark Attendance</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={markAttendance} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, memberId: '', staffId: '' })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                  <option value="MEMBER">Member</option>
                  <option value="STAFF">Staff</option>
                </select>
              </div>
              {form.type === 'MEMBER' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Member</label>
                  <select required value={form.memberId} onChange={e => setForm({ ...form, memberId: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                    <option value="">Select member...</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Staff</label>
                  <select required value={form.staffId} onChange={e => setForm({ ...form, staffId: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                    <option value="">Select staff...</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check In Time</label>
                  <input required type="time" value={form.checkIn} onChange={e => setForm({ ...form, checkIn: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-70" style={{ background: 'hsl(24 95% 53%)' }}>
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Mark Attendance'}
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

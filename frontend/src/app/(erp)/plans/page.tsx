'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Toast, { ToastType } from '@/components/Toast';
import { Plus, Edit2, Trash2, X, Save, RefreshCw, CheckCircle, Tag } from 'lucide-react';
import { plansApi, type Plan } from '@/lib/api';

const TIERS = ['BASIC', 'GOLD', 'PREMIUM'];

const emptyPlan = { name: '', tier: 'BASIC', price1Month: '', price3Month: '', price6Month: '', price12Month: '', features: '' };

const fmt = (n: number) => '₹' + (n || 0).toLocaleString('en-IN');

export default function Plans() {
  const [plans, setPlans]           = useState<Plan[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState<{ message: string; type: ToastType } | null>(null);

  const [showModal, setShowModal]   = useState(false);
  const [editId, setEditId]         = useState<number | null>(null);
  const [form, setForm]             = useState(emptyPlan);

  const showToast = useCallback((msg: string, t: ToastType) => setToast({ message: msg, type: t }), []);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await plansApi.getAll();
      setPlans(res.data);
    } catch (e) { showToast((e as Error).message, 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  const openAdd = () => { setEditId(null); setForm(emptyPlan); setShowModal(true); };
  const openEdit = (p: Plan) => {
    setEditId(p.id);
    setForm({ name: p.name, tier: p.tier, price1Month: String(p.price1Month), price3Month: String(p.price3Month), price6Month: String(p.price6Month), price12Month: String(p.price12Month), features: p.features.join('\n') });
    setShowModal(true);
  };

  const savePlan = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = {
        name: form.name, tier: form.tier,
        price1Month: Number(form.price1Month), price3Month: Number(form.price3Month), price6Month: Number(form.price6Month), price12Month: Number(form.price12Month),
        features: form.features.split('\n').map(s => s.trim()).filter(Boolean)
      };
      if (editId) { await plansApi.update(editId, payload); showToast('Plan updated!', 'success'); }
      else { await plansApi.create(payload); showToast('Plan created!', 'success'); }
      setShowModal(false); await loadPlans();
    } catch (err) { showToast((err as Error).message, 'error'); }
    finally { setSaving(false); }
  };

  const deletePlan = async (id: number) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try { await plansApi.remove(id); showToast('Plan deleted!', 'success'); await loadPlans(); }
    catch (err) { showToast((err as Error).message, 'error'); }
  };

  return (
    <div className="min-h-full pb-10">
      <Header title="Membership Plans" subtitle="Manage subscription plans, pricing, and features" />
      <div className="p-4 sm:p-6 space-y-5">
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">Active Plans: <span className="font-bold text-gray-900">{plans.length}</span></p>
          <div className="flex gap-2">
            <button onClick={loadPlans} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"><RefreshCw size={14} /></button>
            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-opacity" style={{ background: 'hsl(24 95% 53%)' }}><Plus size={16} /> Create Plan</button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {plans.map((p, i) => (
              <div key={p.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden relative ${i === 1 ? 'border-orange-500 shadow-orange-100/50' : 'border-gray-100'}`}>
                {i === 1 && <div className="bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider text-center py-1 absolute top-0 w-full left-0">Most Popular</div>}
                <div className={`p-6 ${i === 1 ? 'pt-8' : ''}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{p.name}</h3>
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 mt-1">{p.tier}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50"><Edit2 size={16} /></button>
                      <button onClick={() => deletePlan(p.id)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 bg-gray-50 p-4 rounded-xl">
                    <div><p className="text-xs text-gray-500">1 Month</p><p className="font-bold text-gray-900">{fmt(p.price1Month)}</p></div>
                    <div><p className="text-xs text-gray-500">3 Months</p><p className="font-bold text-gray-900">{fmt(p.price3Month)}</p></div>
                    <div><p className="text-xs text-gray-500">6 Months</p><p className="font-bold text-gray-900">{fmt(p.price6Month)}</p></div>
                    <div><p className="text-xs text-gray-500">12 Months</p><p className="font-bold text-green-600">{fmt(p.price12Month)}</p></div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-1.5"><Tag size={12} /> Features</p>
                    <ul className="space-y-2.5">
                      {p.features.map((f, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600"><CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" /> <span>{f}</span></li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
            {plans.length === 0 && (
              <div className="col-span-3 text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-gray-500">No membership plans created yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{editId ? 'Edit Plan' : 'Create New Plan'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={savePlan} className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                  <input required type="text" placeholder="e.g. Gold Plan" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                  <select value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                    {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[{ label: '1 Month Price (₹)', key: 'price1Month' }, { label: '3 Months Price (₹)', key: 'price3Month' }, { label: '6 Months Price (₹)', key: 'price6Month' }, { label: '12 Months Price (₹)', key: 'price12Month' }].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                    <input required type="number" placeholder="0" value={(form as Record<string, string>)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features (one per line)</label>
                <textarea required rows={5} value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} placeholder="Gym Access (6am - 10pm)&#10;Locker Access&#10;Fitness Assessment" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-70" style={{ background: 'hsl(24 95% 53%)' }}>
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={15} />{editId ? 'Update' : 'Create Plan'}</>}
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

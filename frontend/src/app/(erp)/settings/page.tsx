'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Settings, Bell, Shield, CreditCard, Building, Smartphone, Save, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import Toast from '@/components/Toast';

const GYM_ORANGE = 'hsl(24 95% 53%)';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Gym Profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ gymName: '', ownerName: '', phone: '', email: '', city: '', gstNumber: '' });
  const [toastMsg, setToastMsg] = useState<{message: string, type: 'success' | 'error' | 'email' | 'whatsapp'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ message, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res: any = await apiFetch('/settings');
      if (res.data) setForm(res.data);
    } catch (err: any) {
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch('/settings', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      showToast('Settings saved successfully!', 'success');
    } catch (err: any) {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const tabs = [
    { icon: Building, title: 'Gym Profile', desc: 'Update gym name, logo, address, and contact details', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Bell, title: 'Notifications', desc: 'Configure SMS, email and WhatsApp alerts', color: 'text-orange-600', bg: 'bg-orange-50' },
    { icon: Shield, title: 'Roles & Permissions', desc: 'Manage admin roles and access control', color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: Smartphone, title: 'App Integration', desc: 'Member app settings and configurations', color: 'text-teal-600', bg: 'bg-teal-50' },
    { icon: Settings, title: 'General Settings', desc: 'System preferences, timezone, language', color: 'text-gray-600', bg: 'bg-gray-100' },
  ];

  if (loading) return <div className="p-10 text-center">Loading settings...</div>;

  return (
    <div className="min-h-full pb-10">
      <Header title="Settings" subtitle="Configure your gym management system" />
      <div className="p-4 sm:p-6 space-y-6">
        
        {/* Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {tabs.map((s, i) => (
            <button key={i} onClick={() => setActiveTab(s.title)}
              className={`bg-white border rounded-xl p-5 text-left transition-all group ${activeTab === s.title ? 'border-orange-400 shadow-md ring-1 ring-orange-400' : 'border-gray-100 hover:border-orange-200 hover:shadow-sm'}`}>
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <s.icon size={19} className={s.color} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-lg">{activeTab}</h2>
            <div className="flex gap-2">
              <button onClick={fetchSettings} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 flex items-center gap-2"><RefreshCw size={14} /> Reset</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm text-white rounded-lg font-medium flex items-center gap-2" style={{ background: GYM_ORANGE }}>
                <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            {activeTab === 'Gym Profile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { label: 'Gym Name', field: 'gymName' },
                  { label: 'Owner Name', field: 'ownerName' },
                  { label: 'Phone Number', field: 'phone' },
                  { label: 'Email', field: 'email' },
                  { label: 'City', field: 'city' },
                  { label: 'GST Number', field: 'gstNumber' },
                ].map((f, i) => (
                  <div key={i}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                    <input type="text" value={(form as any)[f.field] || ''} onChange={(e) => handleChange(f.field, e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                ))}
              </div>
            )}

            {activeTab !== 'Gym Profile' && (
              <div className="text-center py-10 text-gray-500">
                <Settings size={48} className="mx-auto mb-3 text-gray-300" />
                <p>Settings for <strong>{activeTab}</strong> are currently under development.</p>
              </div>
            )}
          </div>
        </div>

        {/* Banner */}
        <div className="rounded-xl p-6 text-white mt-6" style={{ background: 'linear-gradient(135deg, hsl(24 95% 53%), hsl(20 95% 45%))' }}>
          <h2 className="text-xl font-bold mb-2">Ready to take your Gym to the next level?</h2>
          <p className="text-orange-100 mb-4">Get a FREE demo and see how GymSmart can transform your business</p>
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-orange-200 text-xs font-medium uppercase tracking-wider mb-1">Call or WhatsApp for FREE Demo</p>
              <p className="text-2xl font-bold">+91 83479 77566</p>
            </div>
            <div className="flex gap-2">
              <button className="bg-white text-orange-600 font-semibold px-4 py-2.5 rounded-lg text-sm hover:bg-orange-50">WhatsApp Demo</button>
              <button className="border-2 border-white text-white font-semibold px-4 py-2.5 rounded-lg text-sm hover:bg-orange-400">Call Now</button>
            </div>
          </div>
        </div>
      </div>
      {toastMsg && <Toast message={toastMsg.message} type={toastMsg.type} onClose={() => setToastMsg(null)} />}
    </div>
  );
}

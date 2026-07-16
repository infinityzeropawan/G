'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Mail, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import Footer from '@/components/Footer';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // If already logged in (user cookie exists), redirect to dashboard
  useEffect(() => {
    const userCookie = document.cookie.split(';').find(c => c.trim().startsWith('gymsmart_user='));
    if (userCookie) {
      window.location.replace('/dashboard');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authApi.login(email, password);
      if (res.success && res.data.accessToken) {
        // Set HttpOnly cookie via server-side API route
        const cookieRes = await fetch('/api/auth/set-cookie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: res.data.accessToken, user: res.data.user }),
        });

        if (!cookieRes.ok) throw new Error('Session setup failed');

        window.location.replace('/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0F172A] font-sans">

      {/* LEFT SIDE: Visual (60%) */}
      <div className="hidden lg:flex lg:w-[60%] relative bg-black overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0" style={{
          backgroundImage: `url('/gym-hero.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.4
        }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/90 to-transparent" />

        <div className="relative z-10 flex items-center gap-3">
          <Image src="/logo.png" alt="GymSmart" width={48} height={48} className="rounded-xl shadow-lg" />
          <div>
            <h1 className="text-2xl font-black text-white leading-tight">GymSmart</h1>
            <p className="text-xs font-medium text-[#F43F5E] uppercase tracking-widest">Gym Management Made Simple</p>
          </div>
        </div>

        <div className="relative z-10 mb-20 max-w-lg">
          <h2 className="text-5xl font-black text-white mb-6 leading-tight">
            Administrator Portal.<br/>
            <span className="text-[#4F46E5]">Secure access to GymSmart ERP.</span>
          </h2>
          <div className="flex items-center gap-3 text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-4 py-2 rounded-full w-max">
            <CheckCircle2 size={16} />
            <span className="text-sm font-semibold">System Online &amp; Secure</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Form (40%) */}
      <div className="w-full lg:w-[40%] flex flex-col p-6 sm:p-12 relative z-10 bg-[#0F172A]">

        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-3">
          <Image src="/logo.png" alt="GymSmart" width={40} height={40} className="rounded-xl" />
          <h1 className="text-xl font-black text-white">GymSmart</h1>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center w-full max-w-[420px] mx-auto">
          <div className="w-full bg-[#1E2937] p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-slate-700/50">

          <div className="mb-8">
            <h2 className="text-[32px] font-bold text-white mb-2">SuperAdmin Access</h2>
            <p className="text-[#94A3B8]">Enter your administrative credentials to continue</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#334155] border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                  placeholder="admin@gymsmart.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-[#334155] border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5 shadow-lg flex justify-center items-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
              style={{ backgroundColor: '#F43F5E' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Log In'
              )}
            </button>
          </form>

          </div>
        </div>

        <Footer className="text-slate-400 mt-8 sm:mt-auto pt-6 border-t border-slate-800 w-full" />
      </div>

    </div>
  );
}

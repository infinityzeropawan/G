'use client';

import Link from 'next/link';
import { ArrowRight, UserCheck, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl w-full flex flex-col items-center text-center z-10">
        <div className="w-20 h-20 mb-6 bg-card rounded-2xl shadow-xl flex items-center justify-center border border-border">
          <Image src="/logo.png" alt="GymSmart" width={48} height={48} className="object-contain" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-6 tracking-tight">
          Manage Your Gym <br className="hidden md:block" />
          <span className="text-primary">Smarter, Not Harder.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl">
          The all-in-one ERP solution for modern fitness centers. Manage members, attendance, billing, store inventory, and HR all in one powerful dashboard.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Superadmin Card */}
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden group">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">SuperAdmin Demo</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Full access to all modules including HR, Finance, Settings, and Multi-branch reporting.
            </p>
            <Link 
              href="/login?demo=superadmin"
              className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              Login as SuperAdmin <ArrowRight size={18} />
            </Link>
          </div>

          {/* ERP Admin Card */}
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden group">
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 text-blue-500 group-hover:scale-110 transition-transform">
              <UserCheck size={24} />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Gym Admin Demo</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Restricted branch-level access. Can manage members, attendance, store, and inquiries.
            </p>
            <Link 
              href="/login?demo=admin"
              className="w-full py-3 bg-secondary text-secondary-foreground border border-border font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-muted transition-colors"
            >
              Login as Gym Admin <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-6 text-sm text-muted-foreground">
        © {new Date().getFullYear()} Buildroonix GymSmart ERP. All rights reserved.
      </div>
    </div>
  );
}

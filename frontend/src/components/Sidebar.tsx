'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getUser } from '@/lib/api';
import {
  LayoutDashboard, Users, ClipboardList, BarChart2,
  UserCog, ShoppingBag, DollarSign, BookOpen, Dumbbell,
  MessageSquare, Settings, CalendarCheck, Menu, X
} from 'lucide-react';

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/members',    label: 'Members',          icon: Users },
  { href: '/plans',      label: 'Plans',            icon: ClipboardList },
  { href: '/sales',      label: 'Sales & Reports',  icon: BarChart2 },
  { href: '/attendance', label: 'Attendance',       icon: CalendarCheck },
  { href: '/hr',         label: 'HR Management',    icon: UserCog },
  { href: '/store',      label: 'Store',            icon: ShoppingBag },
  { href: '/finance',    label: 'Finance',          icon: DollarSign },
  { href: '/library',    label: 'Diet Library',     icon: BookOpen },
  { href: '/workout',    label: 'Workout Library',  icon: Dumbbell },
  { href: '/inquiries',  label: 'Inquiries & Leads',icon: MessageSquare },
  { href: '/settings',   label: 'Settings',         icon: Settings },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [user, setUser] = useState<{ name?: string; email?: string; role?: string } | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  useEffect(() => {
    const handleToggle = () => {
      if (window.innerWidth < 1024) {
        setIsMobileOpen(v => !v);
      } else {
        setIsCollapsed(!isCollapsed);
      }
    };
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, [isCollapsed, setIsCollapsed]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}

      <aside className={`fixed left-0 top-0 h-screen bg-card border-r border-border flex flex-col transition-all duration-300 z-40
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Logo & Toggle */}
        <div className="flex items-center justify-center px-4 py-5 border-b border-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <Image src="/logo.png" alt="GymSmart ERP" width={44} height={44} className="object-contain min-w-[44px]" />
            {(!isCollapsed || isMobileOpen) && (
              <div className="whitespace-nowrap transition-opacity duration-300">
                <div className="text-foreground font-bold text-lg leading-tight">GymSmart</div>
              </div>
            )}
          </div>
        </div>

        {/* Close Button (Mobile) */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-muted-foreground hover:bg-secondary rounded-lg"
        >
          <X size={20} />
        </button>

        <div className="flex-1 overflow-y-auto py-4 overflow-x-hidden">
          <nav className="space-y-1 px-3">
            {filteredNavItems.map((item) => {
              const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;
              // On mobile, it's always full width (not collapsed layout)
              const showLabel = !isCollapsed || isMobileOpen;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative ${
                    active
                      ? 'text-primary-foreground font-medium shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`} style={active ? { background: 'hsl(var(--primary))' } : {}}>
                  <Icon size={24} className={active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary transition-colors'} />
                  {showLabel && <span className="text-sm whitespace-nowrap">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User */}
        <div className={`px-4 py-3 border-t border-border flex items-center ${(!isCollapsed || isMobileOpen) ? 'gap-3' : 'justify-center'}`}>
          <div className="w-9 h-9 min-w-[36px] rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold bg-primary">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <div className="whitespace-nowrap overflow-hidden">
              <div className="text-foreground text-sm font-medium">{user?.name || 'Admin'}</div>
              <div className="text-muted-foreground text-xs">{user?.role || 'Super Admin'}</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

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
  const user = getUser();

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

      <aside className={`fixed left-0 top-0 h-full bg-gray-900 z-50 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'lg:w-[92px]' : 'lg:w-64'
      } ${
        isMobileOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0'
      }`}>
        
        {/* Logo & Toggle */}
        <div className="flex items-center justify-center px-4 py-5 border-b border-gray-700/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <Image src="/logo.png" alt="GymSmart ERP" width={44} height={44} className="object-contain min-w-[44px]" />
            {(!isCollapsed || isMobileOpen) && (
              <div className="whitespace-nowrap transition-opacity duration-300">
                <div className="text-white font-bold text-lg leading-tight">GymSmart</div>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5 custom-scrollbar">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            // On mobile, it's always full width (not collapsed layout)
            const showLabel = !isCollapsed || isMobileOpen;
            
            return (
              <Link key={item.href} href={item.href} title={!showLabel ? item.label : ''}
                className={`flex items-center gap-3 py-2 rounded-xl font-medium transition-all duration-200 group cursor-pointer ${
                  !showLabel ? 'justify-center px-0' : 'px-3'
                } ${
                  active
                    ? 'text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`} style={active ? { background: 'hsl(24 95% 53%)' } : {}}>
                <Icon size={24} className={active ? 'text-white' : 'text-gray-400 group-hover:text-orange-400 transition-colors'} />
                {showLabel && <span className="text-sm whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className={`px-4 py-3 border-t border-gray-700/50 flex items-center ${(!isCollapsed || isMobileOpen) ? 'gap-3' : 'justify-center'}`}>
          <div className="w-9 h-9 min-w-[36px] rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'hsl(24 95% 53%)' }}>{user?.name?.charAt(0)?.toUpperCase() || 'A'}</div>
          {(!isCollapsed || isMobileOpen) && (
            <div className="whitespace-nowrap overflow-hidden">
              <div className="text-white text-sm font-medium">{user?.name || 'Admin'}</div>
              <div className="text-gray-500 text-xs">{user?.role || 'Super Admin'}</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

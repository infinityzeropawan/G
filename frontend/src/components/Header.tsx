'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Search, LogOut, Settings, User, X, Menu } from 'lucide-react';
import Link from 'next/link';
import { getUser, logout } from '@/lib/api';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<{ name?: string; role?: string } | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const notifications = [
    { id: 1, text: 'New member Amit registered', time: '5m ago', unread: true },
    { id: 2, text: 'Payment received from Rahul', time: '1h ago', unread: false },
    { id: 3, text: 'Pooja requested a trial session', time: '2h ago', unread: false },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          className="p-2 -ml-3 text-gray-500 hover:text-gray-900 transition-colors bg-gray-100 hover:bg-gray-200 rounded-lg"
          onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}
          title="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* Global Search - Hidden entirely since it's a dead feature */}
        <div className="relative hidden">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 w-52"
            style={{ '--tw-ring-color': 'hsl(24 95% 53%)' } as React.CSSProperties}
          />
        </div>

        {/* Notifications - Hidden entirely since it's a dead feature */}
        <div className="relative hidden" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell size={19} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: 'hsl(24 95% 53%)' }}></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${n.unread ? 'bg-orange-50/30' : ''}`}>
                    <p className={`text-sm ${n.unread ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{n.text}</p>
                    <span className="text-xs text-gray-400 mt-1 block">{n.time}</span>
                  </div>
                ))}
              </div>
              <div className="p-3 text-center border-t border-gray-50">
                <button className="text-sm font-medium" style={{ color: 'hsl(24 95% 53%)' }}>View All Notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <div
            onClick={() => setShowProfile(!showProfile)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer transition-transform hover:scale-105"
            style={{ background: 'hsl(24 95% 53%)' }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-sm font-semibold text-gray-900">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500">{user?.email || ''}</p>
                {user?.role && <p className="text-xs text-orange-500 font-medium mt-0.5">{user.role}</p>}
              </div>
              <div className="py-1">
                <Link href="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowProfile(false)}>
                  <User size={15} /> My Profile
                </Link>
                <Link href="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowProfile(false)}>
                  <Settings size={15} /> Settings
                </Link>
              </div>
              <div className="border-t border-gray-50 py-1">
                <button
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                  onClick={() => { setShowProfile(false); logout(); }}
                >
                  <LogOut size={15} /> Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

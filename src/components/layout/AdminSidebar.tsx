'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Ticket,
  Archive,
  Users,
  Building2,
  History,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { RoyalLogo } from '@/components/brand/RoyalLogo';

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Tokens', href: '/admin/tokens', icon: Ticket },
    { name: 'Archived Tokens', href: '/admin/archive', icon: Archive },
    { name: 'Agents', href: '/admin/agents', icon: Users },
    { name: 'Properties', href: '/admin/properties', icon: Building2 },
    { name: 'Activity & WhatsApp', href: '/admin/activity', icon: History },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    if (confirm('Are you sure you want to sign out of the Royal Services administration portal?')) {
      setLoggingOut(true);
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/admin/login');
        router.refresh();
      } catch (err) {
        console.error('Logout error', err);
      } finally {
        setLoggingOut(false);
      }
    }
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#161E42] text-slate-200">
      {/* Brand Header */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between gap-2">
        <Link href="/admin" className="flex-1 block group">
          <RoyalLogo variant="horizontal" theme="dark" fullWidth />
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 self-center"
          aria-label="Close navigation menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#2D3774] text-white border border-[#4453A8] shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}

        <div className="pt-4 pb-2">
          <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Public Gateway
          </p>
        </div>

        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            Public Track Token
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
            Live
          </span>
        </Link>
      </nav>

      {/* Super Admin User Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#2D3774] flex items-center justify-center text-white border border-slate-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="truncate flex-1">
            <p className="text-xs font-medium text-slate-200 truncate">
              Super Admin
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              harishchandrakgehlot@gmail.com
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors disabled:opacity-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          {loggingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-2.5 bg-[#161E42] text-white border-b border-slate-800 sticky top-0 z-40">
        <Link href="/admin" className="flex items-center space-x-2">
          <RoyalLogo variant="horizontal" theme="dark" height={34} width={135} />
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sliding Sidebar */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </aside>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 shadow-xl">
        {navContent}
      </aside>
    </>
  );
}

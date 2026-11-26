import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, Users, Kanban, ArrowUpRight, User, X } from 'lucide-react';
import { HMorixLogo } from './HMorixLogo';
import { useAuth } from '../context/AuthContext';

const HRM_URL = import.meta.env.VITE_HRM_PORTAL_URL || 'https://hrm.hmorix.in';

export function Sidebar() {
  const { profile, signOut, isLeader } = useAuth();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/tasks', icon: Kanban, label: 'My Tasks' },
    { to: '/teams', icon: Users, label: 'Teams' },
    { to: '/directory', icon: User, label: 'Directory' },
    ...(isLeader ? [{ to: '/leader', icon: Users, label: 'TL Board' }] : []),
  ];

  const nav = (
    <nav className="flex flex-col gap-1 mt-6">
      {links.map((l) => {
        const active = pathname.startsWith(l.to);
        return (
          <Link
            key={l.to}
            to={l.to}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              active ? 'bg-lime text-obsidian font-semibold' : 'text-cream/70 hover:text-cream hover:bg-obsidian-3'
            }`}
          >
            <l.icon className="w-4 h-4 shrink-0" />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );

  const bottom = (
    <div className="mt-auto space-y-2 pt-6 border-t border-cream/10">
      {profile && (
        <div className="px-3 py-2 rounded-xl bg-obsidian-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-lime/20 flex items-center justify-center shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
            ) : (
              <User className="w-4 h-4 text-lime" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-cream truncate">{profile.full_name}</div>
            <div className="text-[10px] font-mono text-lime capitalize">{profile.role}</div>
          </div>
        </div>
      )}
      <a href={HRM_URL} target="_blank" rel="noreferrer"
        className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-cream/60 hover:text-lime transition rounded-lg hover:bg-obsidian-3">
        <ArrowUpRight className="w-3.5 h-3.5" /> hrm.hmorix.in
      </a>
      <button onClick={signOut}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-cream/60 hover:text-red-400 transition rounded-lg hover:bg-red-500/10">
        <LogOut className="w-3.5 h-3.5" /> Sign Out
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 min-h-screen bg-obsidian-2 border-r border-cream/10 px-3 py-5 fixed left-0 top-0 z-30">
        <HMorixLogo size={30} />
        {nav}
        {bottom}
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-obsidian/90 backdrop-blur-xl border-b border-cream/10 px-4 h-14 flex items-center justify-between">
        <HMorixLogo size={28} />
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg bg-obsidian-2 border border-cream/10">
          {mobileOpen ? <X className="w-5 h-5 text-cream" /> : <Menu className="w-5 h-5 text-cream" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-56 bg-obsidian-2 border-r border-cream/10 px-3 py-5 flex flex-col z-50">
            <HMorixLogo size={30} />
            {nav}
            {bottom}
          </div>
        </div>
      )}
    </>
  );
}

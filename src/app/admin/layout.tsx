'use client';

import React, { useEffect, useState } from 'react';
import { useTransitionRouter as useRouter } from 'next-view-transitions';
import { LayoutDashboard, Clapperboard, Activity, Users, Settings, Search, Bell, LogOut } from 'lucide-react';
import { Link } from 'next-view-transitions';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Basic client-side role check placeholder.
    // In production, rely on SSR layout checks reading httpOnly cookies.
    setIsAuthorized(true); // Auto-authorizing for demo purposes
  }, [router]);

  if (!isAuthorized) {
    return <div className="min-h-screen bg-bg flex items-center justify-center text-white">Authenticating...</div>;
  }

  return (
    <div className="min-h-screen bg-bg text-text flex">
      {/* Sidebar */}
      <aside className="w-64 bg-black border-r border-white/10 flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <img src="/logo.png" alt="Kamunati" className="h-8 object-contain" />
          <span className="ml-2 text-xs font-bold text-primary uppercase tracking-widest">Admin</span>
        </div>
        
        <nav className="flex-1 py-6 flex flex-col gap-2 px-4">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-white/70 hover:text-white transition-colors">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/admin/media" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary font-medium">
            <Clapperboard size={20} /> Media Library
          </Link>
          <Link href="/admin/torrents" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-white/70 hover:text-white transition-colors">
            <Activity size={20} /> Torrent Health
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-white/70 hover:text-white transition-colors">
            <Users size={20} /> Users
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-white/70 hover:text-white transition-colors">
            <Settings size={20} /> Settings
          </Link>
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
          >
            <LogOut size={20} /> Exit Admin
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 bg-black/50 backdrop-blur border-b border-white/10 flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center bg-white/5 rounded-full px-4 py-2 w-96 border border-white/10 focus-within:border-primary transition-colors">
            <Search size={18} className="text-white/50" />
            <input 
              type="text" 
              placeholder="Search media, torrents, or users..." 
              className="bg-transparent border-none outline-none text-sm text-white ml-3 w-full placeholder:text-white/30"
            />
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              System Healthy
            </div>
            <button className="text-white/70 hover:text-white transition-colors">
              <Bell size={20} />
            </button>
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary flex items-center justify-center text-primary font-bold">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 relative bg-neutral-950">
          {children}
        </main>
      </div>
    </div>
  );
}

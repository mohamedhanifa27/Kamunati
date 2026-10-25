'use client';

import React, { useEffect, useState } from 'react';
import { useTransitionRouter as useRouter } from 'next-view-transitions';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Clapperboard, Activity, Users, Settings, Search, Bell, LogOut, MessageSquare, SlidersHorizontal } from 'lucide-react';
import { Link } from 'next-view-transitions';
import { HaloTabs, HaloTabsList, HaloTabsTrigger, HaloTabsIndicator } from '../../components/ui/halo-tabs';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

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
          <img src="/logo.svg" alt="Kamunati" className="h-8 object-contain" />
          <span className="ml-2 text-xs font-bold text-primary uppercase tracking-widest">Admin</span>
        </div>
        
        <nav className="flex-1 py-6 px-4" onMouseLeave={() => setHoveredPath(null)}>
          <HaloTabs value={hoveredPath || pathname} onValueChange={(v: string) => router.push(v)} orientation="vertical" className="h-full">
            <HaloTabsList variant="underline" className="flex flex-col gap-2 border-none">
              <HaloTabsTrigger onMouseEnter={() => setHoveredPath('/admin')} value="/admin" className="relative flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-white/70 data-active:text-primary data-active:bg-primary/10 transition-colors outline-none text-left">
                <Link href="/admin" className="absolute inset-0 z-10" aria-label="Dashboard" />
                <LayoutDashboard size={20} className="relative z-0" /> <span className="relative z-0 font-medium">Dashboard</span>
              </HaloTabsTrigger>
              <HaloTabsTrigger onMouseEnter={() => setHoveredPath('/admin/media')} value="/admin/media" className="relative flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-white/70 data-active:text-primary data-active:bg-primary/10 transition-colors outline-none text-left">
                <Link href="/admin/media" className="absolute inset-0 z-10" aria-label="Media Library" />
                <Clapperboard size={20} className="relative z-0" /> <span className="relative z-0 font-medium">Media Library</span>
              </HaloTabsTrigger>
              <HaloTabsTrigger onMouseEnter={() => setHoveredPath('/admin/rows')} value="/admin/rows" className="relative flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-white/70 data-active:text-primary data-active:bg-primary/10 transition-colors outline-none text-left">
                <Link href="/admin/rows" className="absolute inset-0 z-10" aria-label="Landing Rows" />
                <SlidersHorizontal size={20} className="relative z-0" /> <span className="relative z-0 font-medium">Landing Rows</span>
              </HaloTabsTrigger>
              <HaloTabsTrigger onMouseEnter={() => setHoveredPath('/admin/reviews')} value="/admin/reviews" className="relative flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-white/70 data-active:text-primary data-active:bg-primary/10 transition-colors outline-none text-left">
                <Link href="/admin/reviews" className="absolute inset-0 z-10" aria-label="Reviews" />
                <MessageSquare size={20} className="relative z-0" /> <span className="relative z-0 font-medium">Reviews</span>
              </HaloTabsTrigger>
              <HaloTabsTrigger onMouseEnter={() => setHoveredPath('/admin/torrents')} value="/admin/torrents" className="relative flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-white/70 data-active:text-primary data-active:bg-primary/10 transition-colors outline-none text-left">
                <Link href="/admin/torrents" className="absolute inset-0 z-10" aria-label="Torrent Health" />
                <Activity size={20} className="relative z-0" /> <span className="relative z-0 font-medium">Torrent Health</span>
              </HaloTabsTrigger>
              <HaloTabsTrigger onMouseEnter={() => setHoveredPath('/admin/users')} value="/admin/users" className="relative flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-white/70 data-active:text-primary data-active:bg-primary/10 transition-colors outline-none text-left">
                <Link href="/admin/users" className="absolute inset-0 z-10" aria-label="Users" />
                <Users size={20} className="relative z-0" /> <span className="relative z-0 font-medium">Users</span>
              </HaloTabsTrigger>
              <HaloTabsTrigger onMouseEnter={() => setHoveredPath('/admin/settings')} value="/admin/settings" className="relative flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-white/70 data-active:text-primary data-active:bg-primary/10 transition-colors outline-none text-left">
                <Link href="/admin/settings" className="absolute inset-0 z-10" aria-label="Settings" />
                <Settings size={20} className="relative z-0" /> <span className="relative z-0 font-medium">Settings</span>
              </HaloTabsTrigger>

              <HaloTabsIndicator 
                variant="underline" 
                className="top-[var(--active-tab-top)] bottom-auto left-0 h-[var(--active-tab-height)] w-0.5 transition-[top,height] duration-300 ease-out halo-violet-live-v !shadow-[0_0_12px_rgba(80,26,150,0.6)] !mask-none" 
                style={{ WebkitMaskImage: 'none', maskImage: 'none', background: 'none' }}
              />
            </HaloTabsList>
          </HaloTabs>
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
          {/* [RECTIFICATION:REMOVE_TEXT_LIVE_GRADIENT_AND_ADD_SEARCH_BAR_GLOW] */}
          <div className="relative group w-96">
            {/* [RECTIFICATION:REMOVE_LIVE_GRADIENT_FILL_IN_BUTTONS] Removed live gradient outline from search bar */}
            <div className="relative z-10 flex items-center bg-[#0d0d12]/90 backdrop-blur-md rounded-full px-4 py-2 border border-white/10 focus-within:border-white/20 transition-colors">
              <Search size={18} className="text-white/50 group-focus-within:text-white transition-colors" />
              <input 
                type="text" 
                placeholder="Search media, torrents, or users..." 
                className="bg-transparent border-none outline-none text-sm text-white ml-3 w-full placeholder:text-white/30"
              />
            </div>
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



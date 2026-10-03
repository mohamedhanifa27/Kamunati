'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Link } from 'next-view-transitions';
import { ChevronRight, LogOut, ArrowLeft, Shield, User, ListVideo, MonitorPlay, Palette, Volume2, ShieldAlert } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { featureFlags } from '@/lib/featureFlags';

const SECTIONS = [
  { id: 'account', title: 'Account', icon: User, path: '/settings/account' },
  { id: 'security', title: 'Security', icon: Shield, path: '/settings/security' },
  { id: 'my-list', title: 'My List', icon: ListVideo, path: '/settings/my-list' },
  { id: 'continue-watching', title: 'Continue Watching', icon: MonitorPlay, path: '/settings/continue-watching' },
  { id: 'appearance', title: 'Appearance', icon: Palette, path: '/settings/appearance' },
  { id: 'sound', title: 'Sound and haptics', icon: Volume2, path: '/settings/sound' },
  { id: 'content', title: 'Content', icon: ShieldAlert, path: '/settings/content' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isRoot = pathname === '/settings';

  if (!featureFlags.settingsPage) {
    return <div className="pt-32 text-center">Settings feature is disabled.</div>;
  }

  const handleLogout = async () => {
    // In a real app we might show a confirm dialog first
    if (confirm('Are you sure you want to log out?')) {
      await signOut({ callbackUrl: '/login' });
    }
  };

  const isAdmin = session?.user && ('role' in session.user) && (session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN');

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8 relative z-10">
      
      {/* Sidebar - Hidden on mobile if not root */}
      <aside className={`w-full md:w-80 shrink-0 ${!isRoot ? 'hidden md:block' : 'block'}`}>
        <h1 className="text-3xl font-heading font-bold mb-8 px-4">Settings</h1>

        {isAdmin && (
          <div className="mb-6 mx-4">
            <Link 
              href="/admin"
              className="block p-4 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 hover:border-white/30 transition-colors group"
            >
              <h3 className="font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">Admin Console</h3>
              <p className="text-sm text-neutral-400">Manage media, users, and platform settings.</p>
            </Link>
          </div>
        )}

        <nav className="space-y-1">
          {SECTIONS.map((section) => {
            const isActive = pathname.startsWith(section.path);
            const Icon = section.icon;
            return (
              <Link
                key={section.id}
                href={section.path}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-colors ${
                  isActive 
                    ? 'bg-white/10 text-white font-medium' 
                    : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className={isActive ? 'text-white' : 'text-neutral-500'} />
                  {section.title}
                </div>
                <ChevronRight size={18} className={`md:hidden ${isActive ? 'text-white' : 'text-neutral-600'}`} />
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 px-4 pt-8 border-t border-white/10 space-y-2">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20 font-medium"
          >
            <LogOut size={20} />
            Log out
          </button>
          <button 
            onClick={async () => {
              if (confirm('Are you sure you want to log out of ALL devices?')) {
                await fetch('/api/auth/logout-all', { method: 'POST' });
                await signOut({ callbackUrl: '/login' });
              }
            }}
            className="w-full text-center text-sm text-neutral-500 hover:text-red-400 transition-colors py-2"
          >
            Log out of all devices
          </button>
        </div>
      </aside>

      {/* Main Content - Hidden on mobile if root */}
      <main className={`flex-1 ${isRoot ? 'hidden md:block' : 'block'}`}>
        {!isRoot && (
          <div className="md:hidden mb-6 flex items-center gap-4">
            <Link href="/settings" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <h2 className="text-xl font-heading font-bold capitalize">
              {pathname.split('/').pop()?.replace('-', ' ')}
            </h2>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-xl min-h-[500px]">
          {isRoot ? (
            <div className="h-full flex items-center justify-center text-neutral-500">
              Select a category from the menu to manage your settings.
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}

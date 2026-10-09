'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, Palette } from 'lucide-react';
import { Link } from 'next-view-transitions';
import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { featureFlags } from '../../lib/featureFlags';
import { useThemeStore } from '../../store/themeStore';
import { HaloTabs, HaloTabsList, HaloTabsTrigger, HaloTabsIndicator } from '../ui/halo-tabs';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { motionLevel } = useThemeStore();

  const [activeCategoryIndex, setActiveCategoryIndex] = useState(-1);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const categories = [
    { name: 'Movies', path: '/movies' },
    { name: 'TV Series', path: '/series' },
    { name: 'Anime', path: '/anime' },
  ];
  
  const pillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) setIsScrolled(true);
      else setIsScrolled(false);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const idx = categories.findIndex(c => c.path === pathname);
    setActiveCategoryIndex(idx);
  }, [pathname]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      let next = activeCategoryIndex;
      if (e.key === 'ArrowRight') next = Math.min(categories.length - 1, next + 1);
      if (e.key === 'ArrowLeft') next = Math.max(0, next - 1);
      
      // Focus the new element
      if (pillRef.current) {
        const links = pillRef.current.querySelectorAll('a');
        if (links[next]) links[next].focus();
      }
    }
  };

  if (pathname === '/login' || pathname.startsWith('/admin') || pathname.startsWith('/watch')) {
    return null;
  }

  return (
    <>
      <header className={`fixed top-0 w-full z-50 transition-colors duration-300 ${isScrolled ? 'bg-bg' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
        <div className="flex items-center justify-between px-8 md:px-16 py-4">
          <div className="flex items-center space-x-8">
            <img src="/logo_vector.svg" alt="Kamunati Logo" className="h-8 md:h-10 object-contain drop-shadow-md" style={{ border: 'none', outline: 'none' }} />
            
            {!featureFlags.categoryNav && (
              <nav className="hidden md:flex space-x-6 text-sm text-text/80 font-medium">
                <Link href="/" className="text-text hover:text-white transition">Home</Link>
                <Link href="/series" className="hover:text-white transition">TV Shows</Link>
                <Link href="/movies" className="hover:text-white transition">Movies</Link>
                <Link href="/list" className="hover:text-white transition">My List</Link>
              </nav>
            )}
          </div>
          
          <div className="flex items-center space-x-6 text-text relative z-[70]">
            <Link href="/search" className="hover:text-primary transition focus:outline-none">
              <Search size={20} />
            </Link>
            <Link href="/settings/appearance" className="hover:text-primary transition focus:outline-none hidden sm:block">
              <Palette size={20} />
            </Link>
            <button className="hover:text-primary transition focus:outline-none hidden sm:block">
              <Bell size={20} />
            </button>
            
            {/* Added Logout button here since user couldn't find one */}
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-xs font-medium text-text-muted hover:text-white transition px-2 py-1 bg-white/5 rounded-md"
            >
              Sign out
            </button>

            <Link href="/profiles" className="flex items-center space-x-2 cursor-pointer hover:text-primary transition bg-white/10 p-1.5 rounded-full">
              <User size={18} />
            </Link>
          </div>
        </div>
      </header>

      {/* Category Nav Pill */}
      {featureFlags.categoryNav && (
        <div 
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
          style={{ zIndex: 'var(--z-top-nav, 60)' }}
        >
          <nav 
            aria-label="Category Navigation" 
            className="pointer-events-auto flex items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-lg p-1"
            onMouseLeave={() => setHoveredPath(null)}
          >
            <HaloTabs value={hoveredPath || pathname} onValueChange={(v: string) => router.push(v)} className="w-auto">
              <HaloTabsList variant="underline" className="gap-2 border-none">
                {categories.map((cat) => (
                  <HaloTabsTrigger 
                    key={cat.path} 
                    value={cat.path}
                    onMouseEnter={() => setHoveredPath(cat.path)}
                    className="relative px-4 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/50 text-neutral-400 data-active:text-white"
                  >
                    <Link href={cat.path} className="absolute inset-0 z-10" aria-label={cat.name} />
                    <span className="relative z-0">{cat.name}</span>
                  </HaloTabsTrigger>
                ))}
                <HaloTabsIndicator variant="underline" />
              </HaloTabsList>
            </HaloTabs>
          </nav>
        </div>
      )}
    </>
  );
}

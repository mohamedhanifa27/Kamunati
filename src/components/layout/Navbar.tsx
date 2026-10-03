'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, Palette } from 'lucide-react';
import { Link } from 'next-view-transitions';
import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { featureFlags } from '../../lib/featureFlags';
import { useThemeStore } from '../../store/themeStore';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { motionLevel } = useThemeStore();

  const [activeCategoryIndex, setActiveCategoryIndex] = useState(-1);
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
          
          {!featureFlags.categoryNav && (
            <div className="flex items-center space-x-6 text-text">
              <Link href="/search" className="hover:text-primary transition focus:outline-none">
                <Search size={20} />
              </Link>
              <Link href="/settings/appearance" className="hover:text-primary transition focus:outline-none hidden sm:block">
                <Palette size={20} />
              </Link>
              <button className="hover:text-primary transition focus:outline-none hidden sm:block">
                <Bell size={20} />
              </button>
              <Link href="/profiles" className="flex items-center space-x-2 cursor-pointer hover:text-primary transition bg-white/10 p-1.5 rounded-full">
                <User size={18} />
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Category Nav Pill */}
      {featureFlags.categoryNav && (
        <div 
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
          style={{ zIndex: 'var(--z-top-nav, 60)' }}
        >
          <div 
            ref={pillRef}
            onKeyDown={handleKeyDown}
            className={`pointer-events-auto flex items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-lg transition-all duration-300 ${isScrolled ? 'p-1' : 'p-1.5'}`}
            role="navigation"
            aria-label="Category Navigation"
          >
            {categories.map((cat, idx) => {
              const isActive = idx === activeCategoryIndex;
              return (
                <Link 
                  key={cat.path} 
                  href={cat.path}
                  className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${isActive ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'}`}
                >
                  <span className="relative z-10">{cat.name}</span>
                  {isActive && motionLevel !== 'off' && motionLevel !== 'minimal' && (
                    <motion.div 
                      layoutId="category-pill-highlight"
                      className="absolute inset-0 bg-white/15 rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      style={{ zIndex: 0 }}
                    />
                  )}
                  {isActive && motionLevel === 'minimal' && (
                    <div className="absolute inset-0 bg-white/15 rounded-full animate-fade-in" style={{ zIndex: 0 }} />
                  )}
                  {isActive && motionLevel === 'off' && (
                    <div className="absolute inset-0 bg-white/15 rounded-full" style={{ zIndex: 0 }} />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

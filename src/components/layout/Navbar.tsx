'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bell, User, Palette } from 'lucide-react';
import { Link } from 'next-view-transitions';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (pathname === '/login' || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header className={`fixed top-0 w-full z-50 transition-colors duration-300 ${isScrolled ? 'bg-bg' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
      <div className="flex items-center justify-between px-8 md:px-16 py-4">
        <div className="flex items-center space-x-8">
          {/* Custom Logo applied here without outlines */}
          <img src="/logo_vector.svg" alt="Kamunati Logo" className="h-8 md:h-10 object-contain drop-shadow-md" style={{ border: 'none', outline: 'none' }} />
          <nav className="hidden md:flex space-x-6 text-sm text-text/80 font-medium">
            <Link href="/" className="text-text hover:text-white transition">Home</Link>
            <Link href="/" className="hover:text-white transition">TV Shows</Link>
            <Link href="/" className="hover:text-white transition">Movies</Link>
            <Link href="/list" className="hover:text-white transition">My List</Link>
          </nav>
        </div>
        
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
      </div>
    </header>
  );
}

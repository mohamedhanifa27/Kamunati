"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Bell, User, Palette, ChevronDown } from "lucide-react";
import { Link } from "next-view-transitions";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useThemeStore } from "../../store/themeStore";
import { HaloTabs, HaloTabsList, HaloTabsTrigger, HaloTabsIndicator } from "../ui/halo-tabs";

const GENRES = [
  "Action", "Comedy", "Drama", "Sci-Fi", "Horror", "Romance", "Thriller", "Fantasy", "Animation", "Documentary"
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { motionLevel } = useThemeStore();
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  
  const categories = [
    { name: "Home", path: "/" },
    { name: "Movies", path: "/movies" },
    { name: "TV-Series", path: "/series" },
    { name: "Animes", path: "/anime" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) setIsScrolled(true);
      else setIsScrolled(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (pathname === "/login" || pathname.startsWith("/admin") || pathname.startsWith("/watch")) {
    return null;
  }

  return (
    <>
      <header className={`fixed top-0 w-full z-[40] transition-colors duration-300 ${isScrolled ? "bg-bg" : "bg-gradient-to-b from-black/80 to-transparent"}`}>
        <div className="flex items-center justify-between px-8 md:px-16 py-4">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <img src="/logo.svg" alt="Kamunati Logo" className="h-8 md:h-10 object-contain drop-shadow-md" style={{ border: "none", outline: "none" }} />
            </Link>
          </div>
          
          <div className="flex items-center space-x-6 text-text relative z-[70]">
            <Link href="/search" className="hover:text-primary transition focus:outline-none">
              <Search size={20} />
            </Link>
            <Link href="/settings/appearance" className="hover:text-primary transition focus:outline-none hidden sm:block">
              <Palette size={20} />
            </Link>
            
            <button 
              onClick={() => signOut({ callbackUrl: "/login" })}
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

      {/* Interactive Glass Pill Nav */}
      <div 
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[60]"
      >
        <nav 
          aria-label="Category Navigation" 
          className="flex items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-lg p-1 relative"
          onMouseLeave={() => { setHoveredPath(null); setShowCategories(false); }}
        >
          <HaloTabs value={hoveredPath || (pathname === "/search" ? "" : pathname)} onValueChange={(v: string) => v && router.push(v)} className="w-auto">
            <HaloTabsList variant="underline" className="gap-2 border-none">
              {categories.map((cat) => (
                <HaloTabsTrigger 
                  key={cat.path} 
                  value={cat.path}
                  onMouseEnter={() => { setHoveredPath(cat.path); setShowCategories(false); }}
                  className="relative px-4 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/50 text-neutral-400 data-active:text-white"
                >
                  <Link href={cat.path} className="absolute inset-0 z-10" aria-label={cat.name} />
                  <span className="relative z-0">{cat.name}</span>
                </HaloTabsTrigger>
              ))}
              
              {/* Categories Dropdown Trigger */}
              <div 
                className="relative flex items-center"
                onMouseEnter={() => { setHoveredPath("categories"); setShowCategories(true); }}
              >
                <div 
                  className={`relative px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer flex items-center gap-1 ${showCategories ? "text-white" : "text-neutral-400 hover:text-neutral-200"}`}
                >
                  Categories <ChevronDown size={14} className={`transition-transform duration-200 ${showCategories ? "rotate-180" : ""}`} />
                </div>
                
                {/* Glass Dropdown Modal */}
                <AnimatePresence>
                  {/* [RECTIFICATION:IMPROVE_ANIMATIONS] Origin-aware smooth popover entrance */}
                  {showCategories && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      style={{ transformOrigin: 'top center' }}
                      className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-[300px] bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-4 grid grid-cols-2 gap-2"
                    >
                      {GENRES.map(genre => (
                        <Link 
                          key={genre} 
                          href={`/search?q=${genre}`}
                          onClick={() => setShowCategories(false)}
                          className="px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-center"
                        >
                          {genre}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <HaloTabsIndicator variant="underline" />
            </HaloTabsList>
          </HaloTabs>
        </nav>
      </div>
    </>
  );
}

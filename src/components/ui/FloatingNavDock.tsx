"use client";

import React, { useState } from "react";
import { FloatingDock } from "./floating-dock";
import {
  IconHome,
  IconSearch,
  IconListDetails,
  IconSettings,
  IconUser,
} from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { featureFlags } from "../../lib/featureFlags";
import { useSearchStore } from "../../store/searchStore";
import { HaloTabs, HaloTabsList, HaloTabsTrigger, HaloTabsIndicator } from "./halo-tabs";
import { Link } from "next-view-transitions";

export function FloatingNavDock() {
  const pathname = usePathname();
  const { openSearch } = useSearchStore();
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  
  // Don't show dock on login page, admin pages, or watch pages
  if (pathname === '/login' || pathname.startsWith('/admin') || pathname?.startsWith('/watch')) {
    return null;
  }

  const handleSearchClick = (e: React.MouseEvent) => {
    if (featureFlags.searchCard) {
      e.preventDefault();
      openSearch();
    }
  };

  const oldLinks = [
    {
      title: "Home",
      icon: (
        <IconHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/",
    },
    {
      title: "Search",
      icon: (
        <IconSearch className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/search",
      onClick: handleSearchClick,
    },
    
    {
      title: "Profile",
      icon: (
        <IconUser className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/profiles", // Will be changed to /profile in Workstream E, keeping it for now or we can use /profile and redirect
    },
    {
      title: "Admin",
      icon: (
        <IconSettings className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/admin",
    },
  ];

  const newLinks = [
    {
      title: "Home",
      icon: <IconHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "/",
    },
    {
      title: "Search",
      icon: <IconSearch className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "/search",
      onClick: handleSearchClick,
    },
    {
      title: "My List",
      icon: <IconListDetails className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "/my-list", // Specified by C.3
    },
    {
      title: "Profile",
      icon: <IconUser className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "/profile", // Specified by C.3
    },
    {
      title: "Settings",
      icon: <IconSettings className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "/settings", // Specified by C.3
    },
  ];

  const activeLinks = featureFlags.newBottomNav ? newLinks : oldLinks;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-[400px]">
      <nav 
        aria-label="Bottom Navigation" 
        className="w-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-1 pointer-events-auto"
        onMouseLeave={() => setHoveredPath(null)}
      >
        <HaloTabs value={hoveredPath || pathname} onValueChange={(v: string) => {}} className="w-full">
          <HaloTabsList variant="underline" className="w-full gap-0 justify-around border-none">
            {activeLinks.map((link) => (
              <HaloTabsTrigger
                key={link.href}
                value={link.href}
                onMouseEnter={() => setHoveredPath(link.href)}
                className="relative flex-1 flex flex-col items-center py-2 gap-1 outline-none text-neutral-400 data-active:text-white"
              >
                <Link 
                  href={link.href} 
                  className="absolute inset-0 z-10" 
                  aria-label={link.title}
                  onClick={link.onClick}
                />
                <div className="w-5 h-5 relative z-0">{link.icon}</div>
                <span className="text-[10px] font-medium relative z-0">{link.title}</span>
              </HaloTabsTrigger>
            ))}
            <HaloTabsIndicator variant="underline" />
          </HaloTabsList>
        </HaloTabs>
      </nav>
    </div>
  );
}

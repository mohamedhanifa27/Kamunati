"use client";

import React from "react";
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

export function FloatingNavDock() {
  const pathname = usePathname();
  
  // Don't show dock on login page or admin pages
  if (pathname === '/login' || pathname.startsWith('/admin')) {
    return null;
  }

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
    },
    {
      title: "My List",
      icon: (
        <IconListDetails className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/list",
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
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <FloatingDock
        items={activeLinks}
        desktopClassName="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl"
        mobileClassName="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl"
      />
    </div>
  );
}

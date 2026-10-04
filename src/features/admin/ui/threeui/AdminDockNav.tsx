'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { AnimatedTopDockProps } from './ForkedAnimatedTopDock';

// Dynamically import the dock since it uses Three.js / WebGL.
const AnimatedTopDock = dynamic(
  () => import('./ForkedAnimatedTopDock').then((mod) => mod.AnimatedTopDock),
  { ssr: false }
);

interface AdminDockNavProps {
  items: {
    id: string;
    label: string;
    icon: React.ReactNode;
    href?: string;
    badge?: number;
  }[];
  activeId: string;
  collapsed?: boolean;
  onNavigate: (id: string) => void;
}

export function AdminDockNav({ items, activeId, collapsed, onNavigate }: AdminDockNavProps) {
  // Map items to the format AnimatedTopDock expects.
  // We include badges within the label or icon as a workaround if the component doesn't support badges natively.
  const dockItems = items.map(item => ({
    id: item.id,
    label: item.label,
    icon: (
      <div className="relative flex items-center justify-center">
        {item.icon}
        {item.badge && item.badge > 0 && (
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
      </div>
    )
  }));

  // Render the vertical dock
  // We use the "sable" variant with axis="y". We swap widthGrowth and heightGrowth relative to horizontal config,
  // since the main expansion axis is now vertical.
  // Original sable config: proximity={122} spring={0.19} damping={0.70} widthGrowth={17} heightGrowth={16} drop={3.5}
  return (
    <nav aria-label="Admin Sidebar" className={`h-full ${collapsed ? 'w-[72px]' : 'w-[216px]'} relative transition-all duration-300`}>
      <AnimatedTopDock
        variant="sable"
        axis="y"
        proximity={122}
        spring={0.19}
        damping={0.70}
        widthGrowth={16}
        heightGrowth={17}
        drop={3.5}
        // @ts-ignore
        items={dockItems}
        activeId={activeId}
        onNavigate={onNavigate}
      />
    </nav>
  );
}

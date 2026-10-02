'use client';

import React from 'react';
import Link from 'next/link';
import { useThemeStore } from '../../store/themeStore';
import { PlusCircle } from 'lucide-react';

const mockProfiles = [
  { id: '1', name: 'Viewer', color: '#F2A33A' },
  { id: '2', name: 'Guest', color: '#5CC8C0' },
];

export default function ProfilesPage() {
  const { radius } = useThemeStore();

  const radiusClass = radius === 'sharp' ? 'rounded-none' : radius === 'soft' ? 'rounded-md' : 'rounded-full';

  return (
    <div className="fixed inset-0 z-[100] bg-bg flex flex-col items-center justify-center">
      <h1 className="text-4xl md:text-5xl font-heading font-bold text-text mb-12">Who's watching?</h1>
      
      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
        {mockProfiles.map((profile) => (
          <Link href="/" key={profile.id} className="group flex flex-col items-center">
            <div 
              className={`w-32 h-32 md:w-40 md:h-40 border-4 border-transparent group-hover:border-text transition-all duration-300 ${radiusClass} overflow-hidden`}
              style={{ backgroundColor: profile.color }}
            >
              {/* Dummy Avatar image, replace with real avatar */}
              <div className="w-full h-full flex items-center justify-center bg-black/20">
                <span className="text-6xl font-bold text-white/50">{profile.name[0]}</span>
              </div>
            </div>
            <span className="mt-4 text-text-muted group-hover:text-text font-medium text-lg transition-colors">
              {profile.name}
            </span>
          </Link>
        ))}

        <button className="group flex flex-col items-center">
          <div className={`w-32 h-32 md:w-40 md:h-40 border-2 border-border border-dashed group-hover:border-text flex items-center justify-center transition-all duration-300 ${radiusClass}`}>
            <PlusCircle size={48} className="text-text-muted group-hover:text-text transition-colors" />
          </div>
          <span className="mt-4 text-text-muted group-hover:text-text font-medium text-lg transition-colors">
            Add Profile
          </span>
        </button>
      </div>

      <button className="mt-16 px-6 py-2 border border-border text-text-muted hover:border-text hover:text-text transition-colors font-medium tracking-wide uppercase text-sm">
        Manage Profiles
      </button>
    </div>
  );
}

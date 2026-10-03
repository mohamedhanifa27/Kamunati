'use client';

import React from 'react';
import useSWR from 'swr';
import { Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ContentSettings() {
  const { data: profile, mutate } = useSWR('/api/me/profile', fetcher);

  const handleToggle = async (key: string, value: boolean) => {
    try {
      await fetch('/api/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      mutate();
    } catch(e) {}
  };

  const handleSelect = async (key: string, value: string) => {
    try {
      await fetch('/api/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      mutate();
    } catch(e) {}
  };

  if (!profile) return <div className="text-neutral-500 py-12 flex justify-center"><Loader2 className="animate-spin" /></div>;

  const prefs = profile.preferences || {};
  const kidsMode = prefs.kidsMode || false;
  const autoplay = prefs.autoplay !== false; // default true
  const subtitle = prefs.subtitle || 'off';
  const language = prefs.language || 'en';

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-heading font-bold mb-8">Content Preferences</h2>

      <div className="space-y-8">
        
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4">Playback</h3>
          
          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <p className="font-medium text-white">Autoplay Next Episode</p>
              <p className="text-sm text-neutral-400">Automatically play the next episode in a series.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={autoplay} onChange={e => handleToggle('autoplay', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-white">Subtitle Defaults</p>
              <p className="text-sm text-neutral-400">Default subtitle language when watching.</p>
            </div>
            <select 
              value={subtitle} 
              onChange={e => handleSelect('subtitle', e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
            >
              <option value="off">Off</option>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4">Maturity & Restrictions</h3>
          
          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <p className="font-medium text-white">Kids Mode</p>
              <p className="text-sm text-neutral-400">Restrict access to family-friendly content.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={kidsMode} onChange={e => handleToggle('kidsMode', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </section>
        
      </div>
    </div>
  );
}

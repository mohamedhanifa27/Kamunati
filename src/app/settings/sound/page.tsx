'use client';

import React from 'react';
import { useThemeStore } from '../../../store/themeStore';
import { Volume2, VolumeX, MousePointerClick, Zap } from 'lucide-react';

export default function SoundSettings() {
  const prefs = useThemeStore();

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-heading font-bold mb-8">Sound & Haptics</h2>

      <div className="space-y-8">
        
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4">Audio Feedback</h3>
          
          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/5 rounded-lg text-primary shrink-0"><Volume2 size={20} /></div>
              <div>
                <p className="font-medium text-white">Interface Sounds</p>
                <p className="text-sm text-neutral-400">Play synthetic ambient ticks when scrolling and interacting with UI elements.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={prefs.sounds?.enabled ?? true} 
                onChange={e => prefs.setPrefs({ sounds: { ...prefs.sounds, enabled: e.target.checked } as any })} 
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="py-3 mt-2">
            <p className="font-medium text-white mb-3 text-sm">Volume Level</p>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={(prefs.sounds?.volume ?? 0.35) * 100} 
              onChange={e => prefs.setPrefs({ sounds: { ...prefs.sounds, volume: parseInt(e.target.value) / 100 } as any })}
              className="w-full accent-primary"
              disabled={!(prefs.sounds?.enabled ?? true)}
            />
          </div>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4">Haptics</h3>
          
          <div className="flex items-center justify-between py-3">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/5 rounded-lg text-primary shrink-0"><Zap size={20} /></div>
              <div>
                <p className="font-medium text-white">Vibration Feedback</p>
                <p className="text-sm text-neutral-400">Haptic feedback on supported devices when performing key actions.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={prefs.sounds?.haptics ?? false} 
                onChange={e => prefs.setPrefs({ sounds: { ...prefs.sounds, haptics: e.target.checked } as any })} 
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </section>
        
      </div>
    </div>
  );
}

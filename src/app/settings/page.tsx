'use client';

import React, { useState } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { Settings, Save, Palette, Zap } from 'lucide-react';

export default function SettingsPage() {
  const themeState = useThemeStore();
  const [isSaving, setIsSaving] = useState(false);

  const handleThemeChange = (key: keyof typeof themeState, value: string) => {
    themeState.setTheme({ [key]: value });
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      const prefs = {
        primaryColor: themeState.primaryColor,
        backgroundColor: themeState.backgroundColor,
        textColor: themeState.textColor,
        fontFamily: themeState.fontFamily,
        animationLevel: themeState.animationLevel,
      };

      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs)
      });
      
      alert('Preferences synced to your account successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to sync preferences');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 pb-32">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
        <Settings size={32} className="text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-white">Account Settings</h1>
          <p className="text-white/50 text-sm mt-1">Manage your profile, security, and personalize your experience.</p>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* Theming Section */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <Palette size={20} className="text-primary" /> UI Personalization
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white/70 block mb-2">Primary Accent Color</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={themeState.primaryColor}
                    onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer bg-transparent border-none p-0"
                  />
                  <span className="text-white/50 font-mono text-sm uppercase">{themeState.primaryColor}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-white/70 block mb-2">Background Color</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={themeState.backgroundColor}
                    onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer bg-transparent border-none p-0"
                  />
                  <span className="text-white/50 font-mono text-sm uppercase">{themeState.backgroundColor}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white/70 block mb-2 flex items-center gap-2">
                  <Zap size={16} /> Animation Level
                </label>
                <select 
                  value={themeState.animationLevel}
                  onChange={(e) => handleThemeChange('animationLevel', e.target.value)}
                  className="w-full bg-black/60 border border-white/20 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                >
                  <option value="high">High (Cinematic Scale & Hover)</option>
                  <option value="reduced">Reduced (Fade Only)</option>
                  <option value="none">None (Static UI)</option>
                </select>
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleSavePreferences}
                  disabled={isSaving}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} /> {isSaving ? 'Syncing...' : 'Sync Preferences to Cloud'}
                </button>
                <p className="text-center text-xs text-white/40 mt-3">Saves to your database profile so your theme loads instantly on any device.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Security Section (Placeholder for Form) */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Security</h2>
          <div className="max-w-md space-y-4">
            <div>
              <label className="text-sm font-medium text-white/70 block mb-1">New Password</label>
              <input type="password" placeholder="••••••••" className="w-full bg-black/60 border border-white/20 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="text-sm font-medium text-white/70 block mb-1">Confirm Password</label>
              <input type="password" placeholder="••••••••" className="w-full bg-black/60 border border-white/20 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-primary transition-colors" />
            </div>
            <button className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-6 rounded-lg transition-colors">
              Update Password
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}

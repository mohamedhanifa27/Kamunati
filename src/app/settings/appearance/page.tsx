'use client';

import React from 'react';
import { useThemeStore } from '../../../store/themeStore';
import presets from '../../../lib/theme/presets.json';

export default function AppearanceSettingsPage() {
  const prefs = useThemeStore();

  return (
    <div className="max-w-4xl mx-auto p-8 pt-24 text-text">
      <h1 className="text-4xl font-heading font-bold mb-8">Appearance Settings</h1>
      
      <div className="space-y-12">
        {/* Theme Presets */}
        <section>
          <h2 className="text-2xl font-heading mb-4">Theme Preset</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => prefs.setPrefs({ presetId: preset.id, themeMode: 'preset' })}
                className={`p-4 rounded-md border-2 transition-all ${prefs.presetId === preset.id ? 'border-primary' : 'border-border hover:border-text-muted'}`}
                style={{ backgroundColor: preset.colors.bg }}
              >
                <div className="flex gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.colors.primary }} />
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.colors.accent }} />
                </div>
                <p style={{ color: preset.colors.text }} className="text-left font-medium">{preset.name}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="text-2xl font-heading mb-4">Typography</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-text-muted mb-2">Heading Font</label>
              <select 
                value={prefs.headingFont}
                onChange={(e) => prefs.setPrefs({ headingFont: e.target.value })}
                className="w-full bg-surface border border-border rounded p-3 text-text"
              >
                <option value="Sora">Sora</option>
                <option value="Space Grotesk">Space Grotesk</option>
                <option value="DM Serif Display">DM Serif Display</option>
                <option value="Outfit">Outfit</option>
              </select>
            </div>
            <div>
              <label className="block text-text-muted mb-2">Body Font</label>
              <select 
                value={prefs.bodyFont}
                onChange={(e) => prefs.setPrefs({ bodyFont: e.target.value })}
                className="w-full bg-surface border border-border rounded p-3 text-text"
              >
                <option value="Inter">Inter</option>
                <option value="Manrope">Manrope</option>
                <option value="Lora">Lora</option>
                <option value="Atkinson Hyperlegible">Atkinson Hyperlegible</option>
              </select>
            </div>
          </div>
        </section>

        {/* Shapes */}
        <section>
          <h2 className="text-2xl font-heading mb-4">Corner Radius</h2>
          <div className="flex gap-4">
            {['sharp', 'soft', 'round'].map((r) => (
              <button
                key={r}
                onClick={() => prefs.setPrefs({ radius: r as any })}
                className={`px-6 py-3 border-2 capitalize ${prefs.radius === r ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text hover:bg-surface-raised'} ${
                  r === 'sharp' ? 'rounded-none' : r === 'soft' ? 'rounded-md' : 'rounded-full'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </section>

        {/* Backgrounds */}
        <section>
          <h2 className="text-2xl font-heading mb-4">Background Effects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-text-muted mb-2">Ambient Background Type</label>
              <select 
                value={prefs.ambient?.mode || 'none'}
                onChange={(e) => prefs.setPrefs({ ambient: { ...prefs.ambient, mode: e.target.value as any } })}
                className="w-full bg-surface border border-border rounded p-3 text-text"
              >
                <option value="none">None (Solid Color)</option>
                <option value="predictive">Predictive Arc (WebGL)</option>
                <option value="neuform">Neuform Isolated (WebGL)</option>
              </select>
            </div>
            
            {(prefs.ambient?.mode === 'predictive' || prefs.ambient?.mode === 'neuform') && (
              <div>
                <label className="block text-text-muted mb-2">Background Motion Speed</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={((prefs.ambient as any)?.speed || 1) * 50} 
                  onChange={e => prefs.setPrefs({ ambient: { ...prefs.ambient, speed: parseInt(e.target.value) / 50 } as any })}
                  className="w-full accent-primary"
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

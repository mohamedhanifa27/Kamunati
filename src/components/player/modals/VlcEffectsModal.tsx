// [RECTIFICATION:VLC_PLAYER_FUNCTIONALITIES]
"use client";

import React, { useState } from 'react';
import { 
  Sliders, 
  Eye, 
  Clock, 
  Bookmark, 
  Keyboard, 
  X, 
  RotateCw, 
  FlipHorizontal, 
  Volume2, 
  Moon, 
  Sparkles,
  Camera,
  Trash2,
  Play
} from 'lucide-react';
import { VLC_EQ_FREQUENCIES, VLC_EQ_PRESETS, StereoMode } from '../audio/useAudioProcessor';
import { AspectRatioOption, ZoomLevel } from '../playback/useVideoFilters';
import { PlayerBookmark } from '../playback/usePlayerBookmarks';

export interface VlcEffectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Audio Controls
  audioDelayMs: number;
  volumeBoost: number;
  isNightMode: boolean;
  stereoMode: StereoMode;
  eqEnabled: boolean;
  preampGain: number;
  eqBands: number[];
  activePreset: string;
  onSetAudioDelay: (val: number) => void;
  onSetVolumeBoost: (val: number) => void;
  onToggleNightMode: () => void;
  onSetStereoMode: (mode: StereoMode) => void;
  onToggleEqEnabled: (enabled: boolean) => void;
  onSetPreampGain: (gain: number) => void;
  onSetBandGain: (idx: number, gain: number) => void;
  onApplyEqPreset: (preset: string) => void;
  onResetEq: () => void;
  // Video Controls
  brightness: number;
  contrast: number;
  saturation: number;
  gamma: number;
  hue: number;
  invert: boolean;
  rotation: 0 | 90 | 180 | 270;
  flipHorizontal: boolean;
  zoom: ZoomLevel;
  aspectRatio: AspectRatioOption;
  onSetBrightness: (val: number) => void;
  onSetContrast: (val: number) => void;
  onSetSaturation: (val: number) => void;
  onSetGamma: (val: number) => void;
  onSetHue: (val: number) => void;
  onToggleInvert: () => void;
  onRotateClockwise: () => void;
  onToggleFlipHorizontal: () => void;
  onSetZoom: (zoom: ZoomLevel) => void;
  onSetAspectRatio: (ar: AspectRatioOption) => void;
  onResetVideoFilters: () => void;
  onTakeSnapshot: () => void;
  // Subtitle Controls
  subtitleDelayMs: number;
  onSetSubtitleDelay: (val: number) => void;
  // Bookmarks
  bookmarks: PlayerBookmark[];
  currentTime: number;
  onAddBookmark: () => void;
  onJumpToBookmark: (timeSec: number) => void;
  onRemoveBookmark: (id: string) => void;
}

export default function VlcEffectsModal({
  isOpen,
  onClose,
  audioDelayMs,
  volumeBoost,
  isNightMode,
  stereoMode,
  eqEnabled,
  preampGain,
  eqBands,
  activePreset,
  onSetAudioDelay,
  onSetVolumeBoost,
  onToggleNightMode,
  onSetStereoMode,
  onToggleEqEnabled,
  onSetPreampGain,
  onSetBandGain,
  onApplyEqPreset,
  onResetEq,
  brightness,
  contrast,
  saturation,
  gamma,
  hue,
  invert,
  rotation,
  flipHorizontal,
  zoom,
  aspectRatio,
  onSetBrightness,
  onSetContrast,
  onSetSaturation,
  onSetGamma,
  onSetHue,
  onToggleInvert,
  onRotateClockwise,
  onToggleFlipHorizontal,
  onSetZoom,
  onSetAspectRatio,
  onResetVideoFilters,
  onTakeSnapshot,
  subtitleDelayMs,
  onSetSubtitleDelay,
  bookmarks,
  currentTime,
  onAddBookmark,
  onJumpToBookmark,
  onRemoveBookmark
}: VlcEffectsModalProps) {
  const [activeTab, setActiveTab] = useState<'audio' | 'video' | 'sync' | 'bookmarks' | 'shortcuts'>('audio');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-3xl max-h-[85vh] bg-[#0e0d14]/95 border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#14121d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2 font-pixel">
                Adjustments and Effects
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                  VLC Architecture
                </span>
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-white/10 bg-[#12101a] text-xs font-semibold overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-all ${
              activeTab === 'audio' 
                ? 'border-purple-500 text-purple-300 bg-purple-500/10' 
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <Volume2 size={14} /> Audio Effects
          </button>
          <button 
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-all ${
              activeTab === 'video' 
                ? 'border-purple-500 text-purple-300 bg-purple-500/10' 
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <Eye size={14} /> Video Effects
          </button>
          <button 
            onClick={() => setActiveTab('sync')}
            className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-all ${
              activeTab === 'sync' 
                ? 'border-purple-500 text-purple-300 bg-purple-500/10' 
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <Clock size={14} /> Synchronization
          </button>
          <button 
            onClick={() => setActiveTab('bookmarks')}
            className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-all ${
              activeTab === 'bookmarks' 
                ? 'border-purple-500 text-purple-300 bg-purple-500/10' 
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <Bookmark size={14} /> Bookmarks ({bookmarks.length})
          </button>
          <button 
            onClick={() => setActiveTab('shortcuts')}
            className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-all ${
              activeTab === 'shortcuts' 
                ? 'border-purple-500 text-purple-300 bg-purple-500/10' 
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <Keyboard size={14} /> VLC Shortcuts
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-neutral-300">
          
          {/* TAB 1: AUDIO EFFECTS */}
          {activeTab === 'audio' && (
            <div className="space-y-6">
              {/* Equalizer Controls */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={eqEnabled}
                        onChange={(e) => onToggleEqEnabled(e.target.checked)}
                        className="w-4 h-4 accent-purple-600 rounded"
                      />
                      <span className="font-bold text-white text-sm">Enable Graphic Equalizer</span>
                    </label>
                  </div>

                  {/* Preset Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">Preset:</span>
                    <select
                      value={activePreset}
                      onChange={(e) => onApplyEqPreset(e.target.value)}
                      className="bg-neutral-900 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      {Object.keys(VLC_EQ_PRESETS).map(key => (
                        <option key={key} value={key}>{VLC_EQ_PRESETS[key].label}</option>
                      ))}
                      {activePreset === 'custom' && <option value="custom">Custom (User)</option>}
                    </select>

                    <button 
                      onClick={onResetEq}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-white/70 hover:text-white border border-white/10"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* 10-Band Sliders */}
                <div className="pt-2">
                  <div className="flex items-end justify-between gap-1.5 h-44 px-2 bg-black/40 rounded-xl p-3 border border-white/5">
                    {/* Preamp */}
                    <div className="flex flex-col items-center gap-1 h-full justify-between w-12 border-r border-white/10 pr-2">
                      <span className="text-[10px] text-purple-300 font-bold">{preampGain > 0 ? `+${preampGain}` : preampGain}dB</span>
                      <input 
                        type="range"
                        min="-20"
                        max="20"
                        step="0.5"
                        value={preampGain}
                        onChange={(e) => onSetPreampGain(parseFloat(e.target.value))}
                        className="h-24 w-1.5 appearance-none bg-neutral-700 accent-purple-500 rounded-lg cursor-pointer"
                        style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
                      />
                      <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider">Preamp</span>
                    </div>

                    {/* 10 Frequency Bands */}
                    {VLC_EQ_FREQUENCIES.map((freq, idx) => {
                      const gain = eqBands[idx] || 0;
                      return (
                        <div key={freq} className="flex flex-col items-center gap-1 h-full justify-between flex-1">
                          <span className="text-[10px] font-mono text-neutral-400">
                            {gain > 0 ? `+${gain.toFixed(0)}` : gain.toFixed(0)}
                          </span>
                          <input 
                            type="range"
                            min="-20"
                            max="20"
                            step="0.5"
                            value={gain}
                            disabled={!eqEnabled}
                            onChange={(e) => onSetBandGain(idx, parseFloat(e.target.value))}
                            className={`h-24 w-1.5 appearance-none rounded-lg cursor-pointer ${
                              eqEnabled ? 'bg-neutral-700 accent-purple-500' : 'bg-neutral-800 opacity-40'
                            }`}
                            style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
                          />
                          <span className="text-[9px] font-mono text-neutral-400">
                            {freq >= 1000 ? `${freq / 1000}k` : `${freq}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Volume Boost & Master Limiter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 200% Super-Boost */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-xs">VLC Volume Super-Boost</span>
                    <span className="text-xs font-mono font-bold text-purple-300">{Math.round(volumeBoost * 100)}%</span>
                  </div>
                  <input 
                    type="range"
                    min="1.0"
                    max="2.0"
                    step="0.05"
                    value={volumeBoost}
                    onChange={(e) => onSetVolumeBoost(parseFloat(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                    <span>100% (Normal)</span>
                    <span>150%</span>
                    <span>200% (Max Boost)</span>
                  </div>
                </div>

                {/* Night Mode / Dialogue Normalizer */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white text-xs block">Dialogue Normalizer (Night Mode)</span>
                    <span className="text-[11px] text-neutral-400">Compresses audio dynamic range to soften explosions & boost quiet whispers</span>
                  </div>
                  <button 
                    onClick={onToggleNightMode}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isNightMode ? 'bg-purple-600 text-white shadow-md' : 'bg-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    {isNightMode ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Stereo Channels Mode */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <span className="font-semibold text-white text-xs block">Stereo Output Channel Mode</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(['stereo', 'left', 'right', 'reverse', 'mono'] as StereoMode[]).map(mode => (
                    <button
                      key={mode}
                      onClick={() => onSetStereoMode(mode)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium capitalize border transition-all ${
                        stereoMode === mode 
                          ? 'bg-purple-600/20 border-purple-500 text-purple-300 font-bold'
                          : 'bg-white/5 border-white/10 text-neutral-300 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VIDEO EFFECTS */}
          {activeTab === 'video' && (
            <div className="space-y-6">
              {/* Color Sliders */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs uppercase tracking-wider">Color Adjustments</span>
                  <button 
                    onClick={onResetVideoFilters}
                    className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    Reset All Filters
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Brightness */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Brightness</span>
                      <span className="font-mono text-purple-300">{brightness}%</span>
                    </div>
                    <input 
                      type="range"
                      min="20"
                      max="180"
                      value={brightness}
                      onChange={(e) => onSetBrightness(parseInt(e.target.value, 10))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>

                  {/* Contrast */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Contrast</span>
                      <span className="font-mono text-purple-300">{contrast}%</span>
                    </div>
                    <input 
                      type="range"
                      min="30"
                      max="180"
                      value={contrast}
                      onChange={(e) => onSetContrast(parseInt(e.target.value, 10))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>

                  {/* Saturation */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Saturation</span>
                      <span className="font-mono text-purple-300">{saturation}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="200"
                      value={saturation}
                      onChange={(e) => onSetSaturation(parseInt(e.target.value, 10))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>

                  {/* Gamma */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Gamma</span>
                      <span className="font-mono text-purple-300">{gamma.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.05"
                      value={gamma}
                      onChange={(e) => onSetGamma(parseFloat(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>

                  {/* Hue Rotate */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Hue Rotation</span>
                      <span className="font-mono text-purple-300">{hue}°</span>
                    </div>
                    <input 
                      type="range"
                      min="-180"
                      max="180"
                      value={hue}
                      onChange={(e) => onSetHue(parseInt(e.target.value, 10))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>

                  {/* Invert */}
                  <div className="flex items-center justify-between pt-4">
                    <span className="text-xs">Invert Colors</span>
                    <button 
                      onClick={onToggleInvert}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        invert ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      {invert ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Geometry / Transformations */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
                <span className="font-bold text-white text-xs uppercase tracking-wider block">Geometry & Transform</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button 
                    onClick={onRotateClockwise}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center gap-1.5 text-xs text-white"
                  >
                    <RotateCw size={18} className="text-purple-400" />
                    <span>Rotate 90° ({rotation}°)</span>
                  </button>

                  <button 
                    onClick={onToggleFlipHorizontal}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs transition-colors ${
                      flipHorizontal 
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300 font-bold'
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    <FlipHorizontal size={18} className="text-purple-400" />
                    <span>Flip Horizontal</span>
                  </button>

                  <button 
                    onClick={onTakeSnapshot}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center gap-1.5 text-xs text-white"
                    title="Take Snapshot (Shift+S)"
                  >
                    <Camera size={18} className="text-purple-400" />
                    <span>Take Snapshot</span>
                  </button>
                </div>
              </div>

              {/* Aspect Ratio & Zoom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Aspect Ratio */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <span className="text-xs font-semibold text-white block">Aspect Ratio ('a' key)</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['default', '16:9', '4:3', '2.35:1', '1:1', 'fill'] as AspectRatioOption[]).map(ar => (
                      <button
                        key={ar}
                        onClick={() => onSetAspectRatio(ar)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-mono capitalize border transition-all ${
                          aspectRatio === ar
                            ? 'bg-purple-600 text-white font-bold border-purple-500'
                            : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {ar}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zoom */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <span className="text-xs font-semibold text-white block">Zoom ('z' key)</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {([1, 1.25, 1.5, 2] as ZoomLevel[]).map(z => (
                      <button
                        key={z}
                        onClick={() => onSetZoom(z)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-mono border transition-all ${
                          zoom === z
                            ? 'bg-purple-600 text-white font-bold border-purple-500'
                            : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {z}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SYNCHRONIZATION */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              {/* Audio Delay Sync */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white text-xs block">Audio Track Synchronization</span>
                    <span className="text-[11px] text-neutral-400">Shift audio timing forward or backward in 50ms increments ('j' / 'k' keys)</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-purple-300">
                    {audioDelayMs > 0 ? `+${audioDelayMs}` : audioDelayMs} ms
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => onSetAudioDelay(audioDelayMs - 50)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold"
                  >
                    -50 ms
                  </button>
                  <input 
                    type="range"
                    min="-2000"
                    max="2000"
                    step="25"
                    value={audioDelayMs}
                    onChange={(e) => onSetAudioDelay(parseInt(e.target.value, 10))}
                    className="flex-1 accent-purple-500 cursor-pointer"
                  />
                  <button 
                    onClick={() => onSetAudioDelay(audioDelayMs + 50)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold"
                  >
                    +50 ms
                  </button>
                  <button 
                    onClick={() => onSetAudioDelay(0)}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-400 hover:text-white"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Subtitle Delay Sync */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white text-xs block">Subtitle Track Synchronization</span>
                    <span className="text-[11px] text-neutral-400">Shift subtitle text timing forward or backward in 50ms increments ('h' / 'g' keys)</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-purple-300">
                    {subtitleDelayMs > 0 ? `+${subtitleDelayMs}` : subtitleDelayMs} ms
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => onSetSubtitleDelay(subtitleDelayMs - 50)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold"
                  >
                    -50 ms
                  </button>
                  <input 
                    type="range"
                    min="-5000"
                    max="5000"
                    step="50"
                    value={subtitleDelayMs}
                    onChange={(e) => onSetSubtitleDelay(parseInt(e.target.value, 10))}
                    className="flex-1 accent-purple-500 cursor-pointer"
                  />
                  <button 
                    onClick={() => onSetSubtitleDelay(subtitleDelayMs + 50)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold"
                  >
                    +50 ms
                  </button>
                  <button 
                    onClick={() => onSetSubtitleDelay(0)}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-400 hover:text-white"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BOOKMARKS */}
          {activeTab === 'bookmarks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-xs uppercase tracking-wider block">Custom Timestamp Bookmarks</span>
                  <span className="text-[11px] text-neutral-400">Save specific scenes and jump to them instantly</span>
                </div>
                <button
                  onClick={onAddBookmark}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Bookmark size={14} /> Add Bookmark @ Current Time
                </button>
              </div>

              {bookmarks.length === 0 ? (
                <div className="p-8 text-center bg-black/30 border border-white/5 rounded-xl text-neutral-400 text-xs">
                  No bookmarks saved for this title yet. Click the button above to bookmark your favorite scene!
                </div>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {bookmarks.map(bm => (
                    <div 
                      key={bm.id}
                      className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-xs font-bold">
                          {bm.formattedTime}
                        </span>
                        <span className="text-white text-xs font-medium">{bm.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onJumpToBookmark(bm.timeSec);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors"
                        >
                          <Play size={12} fill="currentColor" /> Jump
                        </button>
                        <button
                          onClick={() => onRemoveBookmark(bm.id)}
                          className="p-1 rounded-lg text-neutral-400 hover:text-red-400 transition-colors"
                          title="Delete Bookmark"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: VLC SHORTCUTS */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-3">
              <span className="font-bold text-white text-xs uppercase tracking-wider block">VLC Media Player Key Bindings</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between font-mono">
                  <span className="text-neutral-400 font-sans">Play / Pause</span>
                  <kbd className="px-2 py-0.5 rounded bg-black/60 border border-white/20 text-purple-300">Space</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between font-mono">
                  <span className="text-neutral-400 font-sans">Fullscreen Toggle</span>
                  <kbd className="px-2 py-0.5 rounded bg-black/60 border border-white/20 text-purple-300">f</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between font-mono">
                  <span className="text-neutral-400 font-sans">Frame Step Forward</span>
                  <kbd className="px-2 py-0.5 rounded bg-black/60 border border-white/20 text-purple-300">e</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between font-mono">
                  <span className="text-neutral-400 font-sans">Frame Step Backward</span>
                  <kbd className="px-2 py-0.5 rounded bg-black/60 border border-white/20 text-purple-300">Shift + e</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between font-mono">
                  <span className="text-neutral-400 font-sans">Short Jump (10 sec)</span>
                  <kbd className="px-2 py-0.5 rounded bg-black/60 border border-white/20 text-purple-300">← / →</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between font-mono">
                  <span className="text-neutral-400 font-sans">Very Short Jump (3 sec)</span>
                  <kbd className="px-2 py-0.5 rounded bg-black/60 border border-white/20 text-purple-300">Shift + ← / →</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between font-mono">
                  <span className="text-neutral-400 font-sans">Medium Jump (1 min)</span>
                  <kbd className="px-2 py-0.5 rounded bg-black/60 border border-white/20 text-purple-300">Ctrl + ← / →</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between font-mono">
                  <span className="text-neutral-400 font-sans">Long Jump (5 min)</span>
                  <kbd className="px-2 py-0.5 rounded bg-black/60 border border-white/20 text-purple-300">Ctrl + Alt + ← / →</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between font-mono">
                  <span className="text-neutral-400 font-sans">Audio Delay (+/- 50ms)</span>
                  <kbd className="px-2 py-0.5 rounded bg-black/60 border border-white/20 text-purple-300">j / k</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between font-mono">
                  <span className="text-neutral-400 font-sans">Subtitle Delay (+/- 50ms)</span>
                  <kbd className="px-2 py-0.5 rounded bg-black/60 border border-white/20 text-purple-300">h / g</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between font-mono">
                  <span className="text-neutral-400 font-sans">Cycle Aspect Ratio</span>
                  <kbd className="px-2 py-0.5 rounded bg-black/60 border border-white/20 text-purple-300">a</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between font-mono">
                  <span className="text-neutral-400 font-sans">Cycle Zoom Level</span>
                  <kbd className="px-2 py-0.5 rounded bg-black/60 border border-white/20 text-purple-300">z</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between font-mono">
                  <span className="text-neutral-400 font-sans">Speed Slower / Faster</span>
                  <kbd className="px-2 py-0.5 rounded bg-black/60 border border-white/20 text-purple-300">[ / ]</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between font-mono">
                  <span className="text-neutral-400 font-sans">Reset Speed to 1.0x</span>
                  <kbd className="px-2 py-0.5 rounded bg-black/60 border border-white/20 text-purple-300">=</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between font-mono">
                  <span className="text-neutral-400 font-sans">Take Snapshot</span>
                  <kbd className="px-2 py-0.5 rounded bg-black/60 border border-white/20 text-purple-300">Shift + s</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between font-mono">
                  <span className="text-neutral-400 font-sans">A-B Repeat Loop</span>
                  <kbd className="px-2 py-0.5 rounded bg-black/60 border border-white/20 text-purple-300">r</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between font-mono">
                  <span className="text-neutral-400 font-sans">Add Bookmark</span>
                  <kbd className="px-2 py-0.5 rounded bg-black/60 border border-white/20 text-purple-300">b</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between font-mono">
                  <span className="text-neutral-400 font-sans">VLC Effects Dialog</span>
                  <kbd className="px-2 py-0.5 rounded bg-black/60 border border-white/20 text-purple-300">c</kbd>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

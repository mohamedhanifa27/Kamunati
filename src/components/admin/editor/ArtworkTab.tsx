'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Crop, Maximize, Palette, Wand2, Loader2 } from 'lucide-react';
import { AmbientCanvas } from '../../../features/ambient/ui/AmbientCanvas';
import HoverBanner from '../../browse/HoverBanner';

export default function ArtworkTab({ data }: { data: any }) {
  const [hoverBanner, setHoverBanner] = useState<string | null>(data?.hoverBannerUrl || null);
  const [focalPoint, setFocalPoint] = useState<{x: number, y: number}>(
    data?.hoverBannerFocal ? JSON.parse(data.hoverBannerFocal) : { x: 50, y: 50 }
  );
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  
  const [palette, setPalette] = useState<{primary: string, secondary: string, accent: string} | null>(
    data?.ambientPalette ? JSON.parse(data.ambientPalette) : null
  );

  const imageRef = useRef<HTMLImageElement>(null);

  const handleHoverBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setHoverBanner(url);
    }
  };

  const handleFocalPointClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setFocalPoint({ x, y });
  };

  const extractPalette = async () => {
    setIsExtracting(true);
    // Mock extraction
    setTimeout(() => {
      setPalette({
        primary: '#4a259c',
        secondary: '#1a0b38',
        accent: '#9d6cff'
      });
      setIsExtracting(false);
    }, 1500);
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-bold text-white font-heading mb-2">Artwork & Assets</h2>
        <p className="text-white/40 text-sm">Manage posters, backdrops, and interactive UI assets.</p>
      </div>

      {/* Hover Banner Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-2">Hover Banner (16:9)</h3>
        <p className="text-sm text-white/50">Used for the expanded billboard view on hover. Must be at least 1280x720.</p>
        
        <div className="bg-black/50 border border-white/10 rounded-xl p-4">
          {!hoverBanner ? (
            <label className="flex flex-col items-center justify-center w-full aspect-video max-w-2xl mx-auto border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
              <Upload className="w-8 h-8 text-white/40 mb-3" />
              <span className="text-sm font-medium text-white/70">Upload Hover Banner</span>
              <span className="text-xs text-white/40 mt-1">PNG, JPG or WebP</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleHoverBannerUpload} />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-video max-w-2xl mx-auto rounded-lg overflow-hidden border border-white/10 select-none group">
                <img 
                  ref={imageRef}
                  src={hoverBanner} 
                  alt="Hover banner" 
                  className="w-full h-full object-cover"
                />
                
                {/* Focal Point Overlay */}
                <div 
                  className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair"
                  onClick={handleFocalPointClick}
                >
                  <div className="absolute top-4 left-4 bg-black/80 backdrop-blur text-xs px-3 py-1.5 rounded-full text-white/80 flex items-center gap-2 pointer-events-none">
                    <Crop size={14} /> Click to set focal point
                  </div>
                </div>

                {/* Focal Point Indicator */}
                <div 
                  className="absolute w-6 h-6 border-2 border-white rounded-full bg-primary/50 shadow-[0_0_0_2px_rgba(0,0,0,0.5)] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-200"
                  style={{ left: `${focalPoint.x}%`, top: `${focalPoint.y}%` }}
                >
                  <div className="absolute inset-1/2 w-1 h-1 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="flex items-center justify-between max-w-2xl mx-auto">
                <div className="text-sm text-white/50">
                  Focal Point: <span className="text-white/80 font-mono">{Math.round(focalPoint.x)}%, {Math.round(focalPoint.y)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsPreviewOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                    <Maximize size={16} /> Preview as pop-up
                  </button>
                  <button onClick={() => setHoverBanner(null)} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors">
                    <X size={16} /> Remove
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Ambient Palette Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-2">Ambient Palette</h3>
        <p className="text-sm text-white/50">Colours used for the real-time background glow.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/50 border border-white/10 rounded-xl p-6">
          <div className="space-y-6">
            {!palette ? (
              <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-white/10 rounded-lg p-8">
                <Palette className="w-8 h-8 text-white/20 mb-3" />
                <p className="text-sm text-white/50 text-center mb-4">No palette extracted yet.</p>
                <button 
                  onClick={extractPalette}
                  disabled={isExtracting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {isExtracting ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                  Auto-extract from artwork
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/70">Primary (Dominant)</label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg shadow-inner border border-white/20" style={{ backgroundColor: palette.primary }} />
                    <input type="color" value={palette.primary} onChange={e => setPalette({...palette, primary: e.target.value})} className="bg-transparent border-0 h-8 w-16 cursor-pointer" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/70">Secondary</label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg shadow-inner border border-white/20" style={{ backgroundColor: palette.secondary }} />
                    <input type="color" value={palette.secondary} onChange={e => setPalette({...palette, secondary: e.target.value})} className="bg-transparent border-0 h-8 w-16 cursor-pointer" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/70">Accent</label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg shadow-inner border border-white/20" style={{ backgroundColor: palette.accent }} />
                    <input type="color" value={palette.accent} onChange={e => setPalette({...palette, accent: e.target.value})} className="bg-transparent border-0 h-8 w-16 cursor-pointer" />
                  </div>
                </div>
                <button 
                  onClick={extractPalette}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors"
                >
                  <Wand2 size={16} /> Re-extract automatically
                </button>
              </div>
            )}
          </div>

          <div className="relative bg-black rounded-xl border border-white/10 overflow-hidden min-h-[300px] flex items-center justify-center">
            {/* Live Preview Container */}
            {palette && (
              <>
                <div 
                  className="absolute inset-0 opacity-50 blur-3xl"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${palette.primary}, transparent 50%),
                                 radial-gradient(circle at 70% 70%, ${palette.secondary}, transparent 50%)`
                  }}
                />
                <div className="relative z-10 w-48 aspect-[2/3] bg-neutral-900 rounded-lg shadow-2xl border border-white/20 overflow-hidden flex items-center justify-center">
                  <span className="text-white/30 font-medium">Card Preview</span>
                </div>
              </>
            )}
            {!palette && <span className="text-white/30 text-sm">Live Preview</span>}
          </div>
        </div>
      </section>

      {/* Hover Banner Modal Preview */}
      {isPreviewOpen && hoverBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/90 backdrop-blur-sm">
          <button onClick={() => setIsPreviewOpen(false)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2">
            <X size={32} />
          </button>
          
          <div className="w-full max-w-5xl">
            {/* We mock the HoverBanner inside the modal */}
            <HoverBanner 
              media={{
                id: data?.id || 'mock',
                title: data?.title || 'Draft Title',
                overview: data?.overview || 'Mock overview',
                backdropPath: hoverBanner, // use the hover banner as backdrop for the preview
                category: data?.category || 'MOVIE',
                releaseYear: data?.releaseYear || 2026,
                maturityRating: data?.maturityRating || 'TV-MA'
              }}
              position={{ top: 0, left: 0, width: 800, height: 450, isHovered: true, enterDirection: 'center' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

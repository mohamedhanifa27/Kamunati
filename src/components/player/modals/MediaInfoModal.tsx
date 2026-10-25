"use client";

import React from 'react';
import { X, Film, Volume2, MessageSquare, Bookmark, Info } from 'lucide-react';

interface MediaInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  probeData: any;
  activeAudioIndex: number | null;
  activeSubId: string;
}

function formatBytes(bytes: number): string {
  if (!bytes || isNaN(bytes)) return 'N/A';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(2)} ${units[i]}`;
}

function formatDuration(sec: number): string {
  if (!sec || isNaN(sec)) return 'N/A';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function MediaInfoModal({
  isOpen,
  onClose,
  probeData,
  activeAudioIndex,
  activeSubId
}: MediaInfoModalProps) {
  if (!isOpen) return null;

  const format = probeData?.format || {};
  const streams = probeData?.streams || [];
  const chapters = probeData?.chapters || [];
  const externalSubs = probeData?.externalSubtitles || [];

  const videoStreams = streams.filter((s: any) => s.codec_type === 'video');
  const audioStreams = streams.filter((s: any) => s.codec_type === 'audio');
  const subtitleStreams = streams.filter((s: any) => s.codec_type === 'subtitle');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-[#0c0c0e] border border-[#8B5CF6]/40 rounded-xl shadow-2xl flex flex-col overflow-hidden text-neutral-200 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#8B5CF6]/20 bg-[#121118]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#8B5CF6]/15 rounded-lg text-[#8B5CF6]">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-pixel uppercase tracking-wider">
                Media Information <span className="text-xs text-[#8B5CF6] normal-case ml-2 font-mono">(Ctrl+J)</span>
              </h2>
              <p className="text-xs text-neutral-400">Stream container, codec specifications & stream breakdown</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* General Container Card */}
          <div className="bg-[#14131c] border border-neutral-800 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-[#8B5CF6] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Film className="w-4 h-4" /> Container & Format
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-neutral-500 block">Format</span>
                <span className="font-mono text-white font-medium">{format.format_name || 'MP4 / MKV'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Duration</span>
                <span className="font-mono text-white font-medium">{formatDuration(parseFloat(format.duration || '0'))}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">File Size</span>
                <span className="font-mono text-white font-medium">{formatBytes(parseInt(format.size || '0', 10))}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Overall Bitrate</span>
                <span className="font-mono text-white font-medium">
                  {format.bit_rate ? `${Math.round(parseInt(format.bit_rate, 10) / 1000)} kbps` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Video Stream Card */}
          {videoStreams.map((v: any, idx: number) => (
            <div key={`v-${idx}`} className="bg-[#14131c] border border-neutral-800 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-[#8B5CF6] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Film className="w-4 h-4" /> Video Stream #{v.index}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-neutral-500 block">Codec</span>
                  <span className="font-mono text-white font-medium">{(v.codec_name || '').toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Resolution</span>
                  <span className="font-mono text-white font-medium">{v.width ? `${v.width}x${v.height}` : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Framerate</span>
                  <span className="font-mono text-white font-medium">{v.fps ? `${v.fps} fps` : '24 fps'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Pixel Format</span>
                  <span className="font-mono text-white font-medium">{v.pix_fmt || 'yuv420p'}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Audio Streams Card */}
          <div className="bg-[#14131c] border border-neutral-800 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-[#8B5CF6] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Volume2 className="w-4 h-4" /> Audio Streams ({audioStreams.length})
            </h3>
            {audioStreams.length === 0 ? (
              <p className="text-neutral-500 italic">No audio streams detected</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-500">
                      <th className="pb-2">#</th>
                      <th className="pb-2">Title / Language</th>
                      <th className="pb-2">Codec</th>
                      <th className="pb-2">Layout</th>
                      <th className="pb-2">Sample Rate</th>
                      <th className="pb-2">Bitrate</th>
                      <th className="pb-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {audioStreams.map((a: any) => {
                      const isActive = activeAudioIndex === a.index || (activeAudioIndex === null && audioStreams[0]?.index === a.index);
                      return (
                        <tr key={`a-${a.index}`} className={isActive ? 'text-[#8B5CF6] bg-[#8B5CF6]/5 font-semibold' : 'text-neutral-300'}>
                          <td className="py-2">{a.index}</td>
                          <td className="py-2">{a.title || a.language || `Audio ${a.index}`}</td>
                          <td className="py-2">{(a.codec_name || '').toUpperCase()}</td>
                          <td className="py-2">{a.channel_layout || `${a.channels}ch`}</td>
                          <td className="py-2">{a.sample_rate ? `${a.sample_rate} Hz` : '48000 Hz'}</td>
                          <td className="py-2">{a.bit_rate ? `${Math.round(parseInt(a.bit_rate, 10) / 1000)}k` : 'N/A'}</td>
                          <td className="py-2 text-right">
                            {isActive ? (
                              <span className="px-1.5 py-0.5 text-[10px] bg-[#8B5CF6]/20 text-[#8B5CF6] rounded border border-[#8B5CF6]/30">Active</span>
                            ) : (
                              <span className="text-neutral-600">Standby</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Subtitles Card */}
          <div className="bg-[#14131c] border border-neutral-800 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-[#8B5CF6] uppercase tracking-wider mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Subtitles ({subtitleStreams.length + externalSubs.length})
            </h3>
            <div className="space-y-2 font-mono text-[11px]">
              {subtitleStreams.map((s: any) => (
                <div key={`sub-${s.index}`} className="flex items-center justify-between py-1.5 px-2 rounded bg-neutral-900/60 border border-neutral-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">#{s.index}</span>
                    <span className="text-white font-medium">{s.title || s.language || `Embedded Sub ${s.index}`}</span>
                    <span className="text-neutral-400">({(s.codec_name || '').toUpperCase()})</span>
                    {s.isBitmap && (
                      <span className="px-1 py-0.2 text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">Bitmap</span>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-500">Container Embedded</span>
                </div>
              ))}
              {externalSubs.map((ext: any) => (
                <div key={`ext-sub-${ext.fileIndex}`} className="flex items-center justify-between py-1.5 px-2 rounded bg-neutral-900/60 border border-neutral-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">#{ext.fileIndex}</span>
                    <span className="text-white font-medium">{ext.title}</span>
                    <span className="text-[#8B5CF6]">({ext.format})</span>
                  </div>
                  <span className="text-[10px] text-[#8B5CF6]/80">Torrent Sibling File</span>
                </div>
              ))}
              {subtitleStreams.length === 0 && externalSubs.length === 0 && (
                <p className="text-neutral-500 italic">No embedded or torrent subtitle files found</p>
              )}
            </div>
          </div>

          {/* Chapters Card */}
          {chapters.length > 0 && (
            <div className="bg-[#14131c] border border-neutral-800 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-[#8B5CF6] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Bookmark className="w-4 h-4" /> Chapters ({chapters.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto font-mono text-[11px]">
                {chapters.map((ch: any, idx: number) => (
                  <div key={`ch-${idx}`} className="flex items-center justify-between py-1 px-2 rounded bg-neutral-900/40">
                    <span className="text-neutral-300 truncate">{ch.title}</span>
                    <span className="text-neutral-500 text-[10px] ml-2 shrink-0">{formatDuration(ch.start)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-[#8B5CF6]/20 bg-[#121118]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#8B5CF6] hover:bg-[#7c3aed] text-white rounded-lg font-pixel text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

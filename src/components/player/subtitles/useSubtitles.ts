"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SubtitleCue, parseSubtitleTextToCues, readLocalSubtitleFile } from './localSubtitles';
import { ISO_LANG_MAP } from '../audio/useAudioTracks';

export interface SubtitleTrackItem {
  id: string; // e.g. "off", "embedded-7", "external-5", "local-0"
  type: 'off' | 'embedded' | 'external' | 'local';
  title: string;
  language: string;
  format: string;
  isBitmap?: boolean;
  label: string;
  url?: string;
  cues?: SubtitleCue[];
}

export interface SubtitleStyling {
  fontSizePercent: number; // 75, 100, 125, 150, 200
  color: string;           // '#ffffff', '#ffff00', '#00e5ff', '#a78bfa'
  bgOpacity: number;       // 0, 25, 50, 75, 100
  edgeStyle: 'none' | 'drop-shadow' | 'outline' | 'raised';
  bottomPercent: number;   // 5 to 30
}

const DEFAULT_STYLING: SubtitleStyling = {
  fontSizePercent: 100,
  color: '#ffffff',
  bgOpacity: 50,
  edgeStyle: 'drop-shadow',
  bottomPercent: 8
};

const PREF_SUB_KEY = 'kamunati_preferred_sub_lang';
const PREF_STYLE_KEY = 'kamunati_sub_styling';

interface UseSubtitlesProps {
  infoHash: string;
  streams: any[];
  externalSubtitles: any[];
  fileIndex?: number;
}

export function useSubtitles({
  infoHash,
  streams,
  externalSubtitles,
  fileIndex = 0
}: UseSubtitlesProps) {
  const [selectedTrackId, setSelectedTrackId] = useState<string>('off');
  const [localTracks, setLocalTracks] = useState<SubtitleTrackItem[]>([]);
  const [activeCues, setActiveCues] = useState<SubtitleCue[]>([]);
  const [subtitleDelayMs, setSubtitleDelayMs] = useState<number>(0);
  const [styling, setStyling] = useState<SubtitleStyling>(() => {
    if (typeof window === 'undefined') return DEFAULT_STYLING;
    try {
      const saved = localStorage.getItem(PREF_STYLE_KEY);
      if (saved) return { ...DEFAULT_STYLING, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_STYLING;
  });

  const prevHashRef = useRef(infoHash);
  useEffect(() => {
    if (infoHash && infoHash !== prevHashRef.current) {
      prevHashRef.current = infoHash;
      setSelectedTrackId('off');
      setActiveCues([]);
      setLocalTracks([]);
    }
  }, [infoHash]);

  // Build unified track list: Off + Embedded + External + Local
  const tracks: SubtitleTrackItem[] = useMemo(() => {
    const list: SubtitleTrackItem[] = [
      {
        id: 'off',
        type: 'off',
        title: 'Off',
        language: '',
        format: '',
        label: 'Off'
      }
    ];

    // Embedded streams
    if (streams && Array.isArray(streams)) {
      const embeddedSubs = streams.filter(s => s.codec_type === 'subtitle');
      embeddedSubs.forEach((s, idx) => {
        const rawLang = (s.language || s.tags?.language || '').toLowerCase();
        const humanLang = ISO_LANG_MAP[rawLang] || rawLang;
        const title = (s.title || s.tags?.title || '').trim();
        const codec = (s.codec_name || '').toUpperCase();
        const isBitmap = !!s.isBitmap;

        let primaryName = title || humanLang || `Track ${idx + 1}`;
        if (humanLang && !primaryName.toLowerCase().includes(humanLang.toLowerCase())) {
          primaryName = `${primaryName} (${humanLang})`;
        }

        const tag = isBitmap ? `[Bitmap/${codec}]` : codec;
        const label = `${primaryName} – ${tag} (Embedded)`;

        list.push({
          id: `embedded-${s.index}`,
          type: 'embedded',
          title: primaryName,
          language: humanLang.toLowerCase(),
          format: codec,
          isBitmap,
          label,
          url: `/api/v1/stream/${infoHash}/subtitle?track=${s.index}&fileIndex=${fileIndex}`
        });
      });
    }

    // External torrent subtitles
    if (externalSubtitles && Array.isArray(externalSubtitles)) {
      externalSubtitles.forEach(ext => {
        const rawLang = (ext.language || '').toLowerCase();
        const humanLang = ISO_LANG_MAP[rawLang] || rawLang || 'Subtitle';
        list.push({
          id: `external-${ext.fileIndex}`,
          type: 'external',
          title: ext.title || humanLang,
          language: humanLang.toLowerCase(),
          format: (ext.format || '').toUpperCase(),
          isBitmap: false,
          label: `${ext.title || humanLang} – ${(ext.format || 'SRT').toUpperCase()} (Torrent)`,
          url: `/api/v1/stream/${infoHash}/ext-subtitle?fileIndex=${ext.fileIndex}`
        });
      });
    }

    // Local user tracks
    localTracks.forEach(loc => list.push(loc));

    return list;
  }, [infoHash, streams, externalSubtitles, fileIndex, localTracks]);

  // Auto-select preferred language on initial load
  useEffect(() => {
    if (tracks.length <= 1) return;
    if (selectedTrackId !== 'off') return;

    try {
      const savedPref = localStorage.getItem(PREF_SUB_KEY)?.toLowerCase();
      if (savedPref) {
        const match = tracks.find(
          t => t.type !== 'off' && !t.isBitmap && (t.language.includes(savedPref) || t.title.toLowerCase().includes(savedPref))
        );
        if (match) {
          selectTrack(match.id);
        }
      }
    } catch {}
  }, [tracks, selectedTrackId]);

  // Load cues when track changes
  const selectTrack = useCallback(async (trackId: string) => {
    setSelectedTrackId(trackId);

    if (trackId === 'off') {
      setActiveCues([]);
      return;
    }

    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    // Save preferred language
    if (track.language) {
      try {
        localStorage.setItem(PREF_SUB_KEY, track.language);
      } catch {}
    }

    // Local track already has cues
    if (track.type === 'local' && track.cues) {
      setActiveCues(track.cues);
      return;
    }

    // Bitmap subs cannot be parsed to text
    if (track.isBitmap) {
      setActiveCues([]);
      return;
    }

    // Fetch WebVTT from server
    if (track.url) {
      try {
        const res = await fetch(track.url);
        if (res.ok) {
          const text = await res.text();
          const cues = parseSubtitleTextToCues(text);
          setActiveCues(cues);
        }
      } catch (err) {
        console.warn('[useSubtitles] Failed to fetch subtitle file:', err);
      }
    }
  }, [tracks]);

  // Add local subtitle file
  const loadLocalSubtitle = useCallback(async (file: File) => {
    try {
      const { cues, label } = await readLocalSubtitleFile(file);
      const newTrack: SubtitleTrackItem = {
        id: `local-${Date.now()}`,
        type: 'local',
        title: label,
        language: 'local',
        format: file.name.split('.').pop()?.toUpperCase() || 'SRT',
        isBitmap: false,
        label: `${label} (Local)`,
        cues
      };

      setLocalTracks(prev => [...prev, newTrack]);
      setSelectedTrackId(newTrack.id);
      setActiveCues(cues);
    } catch (err) {
      console.error('[useSubtitles] Error reading local subtitle:', err);
    }
  }, []);

  // Delay controls (±50ms)
  const adjustSubtitleDelay = useCallback((deltaMs: number) => {
    setSubtitleDelayMs(prev => Math.min(10000, Math.max(-10000, prev + deltaMs)));
  }, []);

  const resetSubtitleDelay = useCallback(() => {
    setSubtitleDelayMs(0);
  }, []);

  // Update styling & persist
  const updateStyling = useCallback((newStyle: Partial<SubtitleStyling>) => {
    setStyling(prev => {
      const updated = { ...prev, ...newStyle };
      try {
        localStorage.setItem(PREF_STYLE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  return {
    tracks,
    selectedTrackId,
    activeCues,
    subtitleDelayMs,
    styling,
    selectTrack,
    loadLocalSubtitle,
    adjustSubtitleDelay,
    resetSubtitleDelay,
    updateStyling
  };
}

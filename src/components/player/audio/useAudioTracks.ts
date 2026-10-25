"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

export interface AudioTrackItem {
  streamIndex: number;
  trackNumber: number; // 1-indexed
  language: string;    // Full name e.g. "English", "Tamil"
  languageCode: string;// e.g. "eng", "tam"
  vlcName: string;     // e.g. "Track 1: English [Stereo]" or "English [Stereo]"
  displayName: string; // e.g. "English [Stereo]"
  shortLabel: string;  // e.g. "English"
  title?: string;      // Optional stream title
  codec: string;       // e.g. "AAC", "E-AC-3"
  channels: number;
  channelLayout: string;// e.g. "Stereo", "5.1"
  bitRate?: string;
  isDefault?: boolean;
  label: string;       // Detailed label
}

interface UseAudioTracksProps {
  streams: any[];
  activeSrc: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onSwitchSrc: (newSrc: string, resumeTime: number, shouldPlay: boolean) => void;
  infoHash?: string;
  torrentTitle?: string;
  onTrackChange?: (track: AudioTrackItem) => void;
}

const PREF_AUDIO_KEY = 'kamunati_preferred_audio_lang';

export const ISO_LANG_MAP: Record<string, string> = {
  eng: 'English', en: 'English', english: 'English',
  tam: 'Tamil', ta: 'Tamil', tamil: 'Tamil',
  hin: 'Hindi', hi: 'Hindi', hindi: 'Hindi',
  tel: 'Telugu', te: 'Telugu', telugu: 'Telugu',
  mal: 'Malayalam', ml: 'Malayalam', malayalam: 'Malayalam',
  kan: 'Kannada', kn: 'Kannada', kannada: 'Kannada',
  spa: 'Spanish', es: 'Spanish', spanish: 'Spanish',
  fre: 'French', fra: 'French', fr: 'French', french: 'French',
  ger: 'German', deu: 'German', de: 'German', german: 'German',
  ita: 'Italian', it: 'Italian', italian: 'Italian',
  jpn: 'Japanese', ja: 'Japanese', japanese: 'Japanese',
  kor: 'Korean', ko: 'Korean', korean: 'Korean',
  chi: 'Chinese', zho: 'Chinese', zh: 'Chinese', chinese: 'Chinese',
  rus: 'Russian', ru: 'Russian', russian: 'Russian',
  ara: 'Arabic', ar: 'Arabic', arabic: 'Arabic',
  por: 'Portuguese', pt: 'Portuguese', portuguese: 'Portuguese',
  ben: 'Bengali', bn: 'Bengali', bengali: 'Bengali',
  mar: 'Marathi', mr: 'Marathi', marathi: 'Marathi',
  pan: 'Punjabi', pa: 'Punjabi', punjabi: 'Punjabi',
  guj: 'Gujarati', gu: 'Gujarati', gujarati: 'Gujarati',
  tur: 'Turkish', tr: 'Turkish', turkish: 'Turkish',
  vie: 'Vietnamese', vi: 'Vietnamese', vietnamese: 'Vietnamese',
  tha: 'Thai', th: 'Thai', thai: 'Thai',
  ind: 'Indonesian', id: 'Indonesian', indonesian: 'Indonesian',
  pol: 'Polish', pl: 'Polish', polish: 'Polish',
  dut: 'Dutch', nld: 'Dutch', nl: 'Dutch', dutch: 'Dutch',
  swe: 'Swedish', sv: 'Swedish', swedish: 'Swedish'
};

export function extractLanguagesFromTitle(title?: string): string[] {
  if (!title) return [];
  const bracketMatches = title.match(/\[([^\]]+)\]/g);
  if (bracketMatches) {
    for (const b of bracketMatches) {
      const inner = b.slice(1, -1);
      const tokens = inner.split(/[\+\,\/]/).map(t => t.trim().toLowerCase());
      const matched = tokens.map(t => ISO_LANG_MAP[t]).filter(Boolean);
      if (matched.length > 0) return matched;
    }
  }

  // Look for language words in title
  const found: string[] = [];
  const keywords = ['Tamil', 'Telugu', 'Hindi', 'Malayalam', 'Kannada', 'English', 'Spanish', 'French', 'Japanese', 'Korean'];
  for (const kw of keywords) {
    const rx = new RegExp(`(?:^|[^a-zA-Z])${kw}(?:[^a-zA-Z]|$)`, 'i');
    if (rx.test(title) && !found.includes(kw)) {
      found.push(kw);
    }
  }
  return found;
}

function formatChannelLayout(channels: number, layout?: string): string {
  if (channels === 6 || layout?.includes('5.1')) return '5.1';
  if (channels === 8 || layout?.includes('7.1')) return '7.1';
  if (channels === 2 || layout?.includes('stereo')) return 'Stereo';
  if (channels === 1 || layout?.includes('mono')) return 'Mono';
  return layout || `${channels}ch`;
}

function formatCodec(codecName?: string): string {
  const c = (codecName || '').toLowerCase();
  if (c === 'eac3') return 'E-AC-3 (Dolby Digital Plus)';
  if (c === 'ac3') return 'AC-3 (Dolby Digital)';
  if (c === 'dts') return 'DTS';
  if (c === 'truehd') return 'Dolby TrueHD';
  if (c === 'flac') return 'FLAC';
  if (c === 'opus') return 'Opus';
  if (c === 'aac') return 'AAC';
  if (c === 'mp3') return 'MP3';
  return (codecName || 'AAC').toUpperCase();
}

export function useAudioTracks({
  streams,
  activeSrc,
  videoRef,
  onSwitchSrc,
  infoHash,
  torrentTitle,
  onTrackChange
}: UseAudioTracksProps) {
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number | null>(null);
  const prevInfoHashRef = useRef(infoHash);

  // When switching torrent (infoHash changes), reset selection to null so new torrent gets evaluated
  useEffect(() => {
    if (infoHash && infoHash !== prevInfoHashRef.current) {
      prevInfoHashRef.current = infoHash;
      setSelectedTrackIndex(null);
    }
  }, [infoHash]);

  // Parse audio streams from probe
  const audioTracks: AudioTrackItem[] = useMemo(() => {
    if (!streams || !Array.isArray(streams)) return [];

    const audios = streams.filter(s => s.codec_type === 'audio');
    if (audios.length === 0) return [];

    const parsedTitleLangs = extractLanguagesFromTitle(torrentTitle);

    return audios.map((s, idx) => {
      const rawLang = (s.language || s.tags?.language || s.tags?.lang || '').toLowerCase();
      const rawTitle = (s.title || s.tags?.title || '').trim();

      // Determine human readable language name
      let languageName = ISO_LANG_MAP[rawLang] || '';
      
      // If language tag is missing or unknown, check title or parsed title languages
      if (!languageName && rawTitle) {
        for (const [code, name] of Object.entries(ISO_LANG_MAP)) {
          if (rawTitle.toLowerCase().includes(code) || rawTitle.toLowerCase().includes(name.toLowerCase())) {
            languageName = name;
            break;
          }
        }
      }

      if (!languageName && parsedTitleLangs.length > 0) {
        const langIdx = idx % parsedTitleLangs.length;
        languageName = parsedTitleLangs[langIdx];
      }

      // If still undetermined, default sensibly
      if (!languageName) {
        languageName = audios.length === 1 ? 'English' : `Audio ${idx + 1}`;
      }

      const codecName = formatCodec(s.codec_name);
      const layout = formatChannelLayout(s.channels || 2, s.channel_layout);
      const bitRateKbps = s.bit_rate ? `${Math.round(parseInt(s.bit_rate, 10) / 1000)} kbps` : '';

      // VLC style naming: "Track 1: English [Stereo]" or "English [5.1]"
      const vlcName = `${languageName} [${layout}]`;
      const displayName = `Track ${idx + 1}: ${languageName} [${layout}]`;

      const details = [codecName, bitRateKbps].filter(Boolean).join(' · ');
      const label = `${vlcName}${details ? ` – ${details}` : ''}`;

      return {
        streamIndex: s.index,
        trackNumber: idx + 1,
        language: languageName,
        languageCode: rawLang || languageName.slice(0, 3).toLowerCase(),
        vlcName,
        displayName,
        shortLabel: languageName,
        title: rawTitle || languageName,
        codec: codecName,
        channels: s.channels || 2,
        channelLayout: layout,
        bitRate: bitRateKbps,
        isDefault: s.isDefault,
        label
      };
    });
  }, [streams, torrentTitle]);

  // Set initial track based on user preference or first stream of the torrent
  useEffect(() => {
    if (audioTracks.length === 0) return;

    if (selectedTrackIndex === null || !audioTracks.some(t => t.streamIndex === selectedTrackIndex)) {
      let matchedIndex = audioTracks[0].streamIndex;
      try {
        const savedPref = localStorage.getItem(PREF_AUDIO_KEY)?.toLowerCase();
        if (savedPref) {
          const match = audioTracks.find(t => 
            t.language.toLowerCase().includes(savedPref) || 
            t.languageCode.includes(savedPref)
          );
          if (match) matchedIndex = match.streamIndex;
        }
      } catch {}

      setSelectedTrackIndex(matchedIndex);
    }
  }, [audioTracks, selectedTrackIndex]);

  const selectAudioTrack = useCallback((trackIndex: number) => {
    if (trackIndex === selectedTrackIndex) return;

    setSelectedTrackIndex(trackIndex);

    const track = audioTracks.find(t => t.streamIndex === trackIndex);
    if (track) {
      if (track.language) {
        try {
          localStorage.setItem(PREF_AUDIO_KEY, track.language.toLowerCase());
        } catch {}
      }
      onTrackChange?.(track);
    }

    const video = videoRef.current;
    const currentTime = video ? video.currentTime : 0;
    const shouldPlay = video ? !video.paused : true;

    let newUrl = activeSrc;
    if (newUrl.includes('/api/v1/stream/')) {
      const [base, query] = newUrl.split('?');
      const params = new URLSearchParams(query || '');
      
      let targetBase = base;
      if (!targetBase.endsWith('/play')) {
        targetBase = `${base}/play`;
      }

      params.set('audio', trackIndex.toString());
      params.set('start', Math.floor(currentTime).toString());
      newUrl = `${targetBase}?${params.toString()}`;
    }

    onSwitchSrc(newUrl, currentTime, shouldPlay);
  }, [selectedTrackIndex, audioTracks, activeSrc, videoRef, onSwitchSrc, onTrackChange]);

  const currentAudioTrack = useMemo(() => {
    return audioTracks.find(t => t.streamIndex === selectedTrackIndex) || audioTracks[0] || null;
  }, [audioTracks, selectedTrackIndex]);

  return {
    audioTracks,
    selectedTrackIndex,
    currentAudioTrack,
    selectAudioTrack
  };
}

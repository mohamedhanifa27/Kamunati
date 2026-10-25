"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAudioProcessor } from './audio/useAudioProcessor';
import { useAudioTracks } from './audio/useAudioTracks';
import { useSubtitles } from './subtitles/useSubtitles';
import SubtitleOverlay from './subtitles/SubtitleOverlay';
import { usePlaybackControls } from './playback/usePlaybackControls';
// [RECTIFICATION:VLC_PLAYER_FUNCTIONALITIES]
import { useVideoFilters } from './playback/useVideoFilters';
import { usePlayerBookmarks } from './playback/usePlayerBookmarks';
import VlcEffectsModal from './modals/VlcEffectsModal';
import { Sliders, Camera, Bookmark as BookmarkIcon } from 'lucide-react';
import { ChapterMarkers } from './chapters/ChapterList';
// [RECTIFICATION:SINGLE_FILE_SERIES_EPISODES]
import { 
  isSingleFileSeries, 
  resolveSeriesEpisodesInSingleFile, 
  getCurrentEpisodeAtTime, 
  getEpisodePlaybackMetrics,
  ResolvedEpisode 
} from '../../lib/seriesEpisodeResolver';
import { MultiRangeBufferedBar, SwarmTelemetryBadge } from './telemetry/BufferVisualizer';
import MediaInfoModal from './modals/MediaInfoModal';
import ShortcutsModal from './modals/ShortcutsModal';

function canPlayHevc(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const v = document.createElement('video');
    return !!(
      v.canPlayType('video/mp4; codecs="hvc1.1.6.L93.B0"') ||
      v.canPlayType('video/mp4; codecs="hvc1"') ||
      v.canPlayType('video/mp4; codecs="hev1"')
    );
  } catch {
    return false;
  }
}

function pickBestInitialTorrent(torrentList: any[]): any | null {
  if (!torrentList || torrentList.length === 0) return null;
  if (torrentList.length === 1) return torrentList[0];

  try {
    const savedPref = localStorage.getItem('kamunati_pref_resolution')?.toLowerCase();
    if (savedPref) {
      const match = torrentList.find(t => (t.resolution || '').toLowerCase().includes(savedPref));
      if (match) return match;
    }
  } catch {}

  // Recommended for smooth streaming on average broadband (~5.77 Mbps):
  // 1. Prefer 720p or compact 1080p release with modest size (<= 3.5 GB)
  const smoothRelease = torrentList.find(t => {
    const res = (t.resolution || '').toLowerCase();
    const sizeGb = t.sizeInBytes ? Number(t.sizeInBytes) / 1e9 : 2.5;
    return (res.includes('720') || res.includes('1080')) && sizeGb <= 3.5;
  });
  if (smoothRelease) return smoothRelease;

  // 2. Prefer any 720p
  const best720 = torrentList.find(t => {
    const res = (t.resolution || '').toLowerCase();
    return res.includes('720') || res.includes('hd');
  });
  if (best720) return best720;

  // 3. Modest size <= 4 GB
  const modestSize = torrentList.find(t => {
    const sizeGb = t.sizeInBytes ? Number(t.sizeInBytes) / 1e9 : 10;
    return sizeGb <= 4.0;
  });
  if (modestSize) return modestSize;

  return torrentList[0];
}

// [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
// Build stream URL respecting optional target fileIndex within multi-file torrents
function getStreamUrl(torrent: any, fileIndex?: number) {
  if (!torrent) return '';
  const title = (torrent.title || '').toLowerCase();
  const codec = (torrent.codec || '').toLowerCase();
  const container = (torrent.container || '').toLowerCase();
  const isHevc = title.includes('hevc') || title.includes('x265') || title.includes('h.265') || title.includes('h265') || codec.includes('hevc');
  const isMp4 = (container === 'mp4' || title.endsWith('.mp4')) && !isHevc;
  const fIdx = fileIndex !== undefined ? fileIndex : (torrent.fileIndex || 0);
  if (isMp4) {
    return `/api/v1/stream/${torrent.infoHash}?fileIndex=${fIdx}`;
  }
  const extra = (isHevc && !canPlayHevc()) ? '&transcode=1' : '';
  return `/api/v1/stream/${torrent.infoHash}/play?fileIndex=${fIdx}&start=0${extra}`;
}

export default function VideoPlayer({ 
  mediaId, 
  title: initialTitle, 
  src, 
  infoHash, 
  torrents: initialTorrents, 
  media,
  similarMovies = [],
  onToggleTheater,
  isTheater = false,
  playerRef,
  onActiveTorrentChange
}: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ppRef = useRef<HTMLDivElement>(null);
  const seekRef = useRef<HTMLDivElement>(null);
  // [RECTIFICATION:SMOOTH_SIMPLISTIC_PLAYER_UI] Hover Seekbar Time Preview
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosPercent, setHoverPosPercent] = useState<number>(0);
  const hideTimerRef = useRef<any>(null);
  const transcodeAttemptedRef = useRef(false);
  const retryCountRef = useRef(0);
  const stallTimerRef = useRef<any>(null);
  const lastStallTimeRef = useRef<number>(0);
  const consecutiveStallsRef = useRef<number>(0);
  const autoAdaptTriggeredRef = useRef<boolean>(false);
  const pendingSeekTargetRef = useRef<number | null>(null);
  const seekDebounceTimerRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  useEffect(() => {
    if (playerRef) {
      playerRef.current = {
        requestFullscreen: () => {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            ppRef.current?.requestFullscreen();
          }
        },
        seekTo: (timeSec: number) => {
          if (videoRef.current) {
            videoRef.current.currentTime = timeSec;
            if (videoRef.current.paused) videoRef.current.play().catch(() => {});
          }
        },
        playEpisode: (episode: any) => handleEpisodeSelect(episode),
        getCurrentTime: () => videoRef.current?.currentTime || 0,
        getDuration: () => totalDuration || videoRef.current?.duration || 0
      };
    }
  }, [playerRef]);

  const defaultTorrent = infoHash
    ? (initialTorrents || []).find((t: any) => t.infoHash === infoHash) || pickBestInitialTorrent(initialTorrents)
    : pickBestInitialTorrent(initialTorrents);

  const [activeHash, setActiveHash] = useState(defaultTorrent?.infoHash || infoHash);
  const [activeSrc, setActiveSrc] = useState(() => {
    if (src) return src;
    return defaultTorrent ? getStreamUrl(defaultTorrent) : '';
  });
  const [streamStartOffset, setStreamStartOffset] = useState(() => {
    const m = (activeSrc || '').match(/[?&]start=(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  });

  // [RECTIFICATION:TORRENT_AVAILABILITY_AND_LOCAL_CACHE]
  // Synchronize stream source when src prop updates
  useEffect(() => {
    if (src && src !== activeSrc) {
      setActiveSrc(src);
      retryCountRef.current = 0;
      autoAdaptTriggeredRef.current = false;
      const m = src.match(/[?&]start=(\d+)/);
      setStreamStartOffset(m ? parseInt(m[1], 10) : 0);
    }
  }, [src]);

  // [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
  // Multi-file state and playback end detection
  const [activeFileIndex, setActiveFileIndex] = useState<number>(defaultTorrent?.fileIndex || 0);
  const [torrentFiles, setTorrentFiles] = useState<any[]>([]);
  const [isEnded, setIsEnded] = useState(false);
  const [osdMessage, setOsdMessage] = useState<string | null>(null);
  const osdTimerRef = useRef<any>(null);

  const showOsd = useCallback((msg: string) => {
    setOsdMessage(msg);
    clearTimeout(osdTimerRef.current);
    osdTimerRef.current = setTimeout(() => {
      setOsdMessage(null);
    }, 2200);
  }, []);

  const [activeTab, setActiveTab] = useState(media?.type === 'SERIES' ? 'episodes' : 'torrent');
  const [torrents, setTorrents] = useState(initialTorrents);
  const [title, setTitle] = useState(initialTitle);
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(media?.type === 'SERIES' && media.seasons?.[0]?.episodes?.[0] ? media.seasons[0].episodes[0].id : null);


  
  const [state, setState] = useState({
    paused: true,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    loading: true,
    error: false,
    loadMessage: '',
    speed: 0
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [speedBits, setSpeedBits] = useState(false);
  const [probeData, setProbeData] = useState<any>(null);
  const [mediaInfoOpen, setMediaInfoOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const subFileInputRef = useRef<HTMLInputElement>(null);

  const curTorrent = (torrents || []).find((t: any) => t.infoHash === activeHash);

  // Poll download speed from engine stats route
  useEffect(() => {
    if (!activeHash) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/stream/${activeHash}/stats`);
        if (res.ok) {
          const data = await res.json();
          if (typeof data.downloadSpeed === 'number') {
            setState(s => ({ ...s, speed: data.downloadSpeed }));
          }
        }
      } catch {}
    }, 1500);
    return () => clearInterval(interval);
  }, [activeHash]);

  // [RECTIFICATION:VLC_PLAYER_FUNCTIONALITIES]
  // Audio Processor Hook (10-Band EQ, 200% Super-Boost, Stereo Modes, Night Mode, Sync)
  const {
    audioDelayMs,
    volumeBoost,
    isNightMode,
    isReady: audioReady,
    stereoMode,
    eqEnabled,
    preampGain,
    eqBands,
    activePreset: eqPreset,
    setAudioDelayMs,
    adjustAudioDelay,
    resetAudioDelay,
    setVolumeBoost,
    toggleNightMode,
    setStereoMode,
    setEqEnabled,
    setPreampGain,
    setBandGain,
    applyEqPreset,
    resetEq,
    initAudioChain
  } = useAudioProcessor({ videoRef });

  // [RECTIFICATION:VLC_PLAYER_FUNCTIONALITIES]
  // Video Filters, Geometry, Aspect Ratio, Zoom & Snapshot Hook
  const videoFilters = useVideoFilters(videoRef);

  // [RECTIFICATION:VLC_PLAYER_FUNCTIONALITIES]
  // Custom Media Bookmarks Hook (localStorage persistence)
  const {
    bookmarks,
    addBookmark,
    removeBookmark,
    clearBookmarks
  } = usePlayerBookmarks(activeHash || (curTorrent?.id || 'media'));

  // VLC Modals & Feedback State
  const [vlcEffectsOpen, setVlcEffectsOpen] = useState(false);
  const [snapshotFlash, setSnapshotFlash] = useState(false);

  // Audio Tracks Separation Hook
  const handleSwitchAudioSrc = useCallback((newSrc: string, resumeTime: number, shouldPlay: boolean) => {
    setActiveSrc(newSrc);
    const m = newSrc.match(/[?&]start=(\d+)/);
    if (m) setStreamStartOffset(parseInt(m[1], 10));
    const handleLoaded = () => {
      if (videoRef.current) {
        if (!newSrc.includes('/play')) {
          videoRef.current.currentTime = resumeTime;
        }
        if (shouldPlay) videoRef.current.play().catch(e => console.warn(e));
      }
      videoRef.current?.removeEventListener('loadedmetadata', handleLoaded);
    };
    videoRef.current?.addEventListener('loadedmetadata', handleLoaded);
  }, []);

  const { audioTracks, selectedTrackIndex, currentAudioTrack, selectAudioTrack } = useAudioTracks({
    streams: probeData?.streams || [],
    activeSrc,
    videoRef,
    onSwitchSrc: handleSwitchAudioSrc,
    infoHash: activeHash,
    torrentTitle: curTorrent?.title,
    onTrackChange: (t) => {
      showOsd(`Audio: ${t.vlcName}`);
    }
  });

  // Subtitles Controller Hook
  const {
    tracks: subTracks,
    selectedTrackId,
    activeCues,
    subtitleDelayMs,
    styling: subStyling,
    selectTrack: selectSubTrack,
    loadLocalSubtitle,
    adjustSubtitleDelay,
    resetSubtitleDelay,
    updateStyling: updateSubStyling
  } = useSubtitles({
    infoHash: activeHash,
    streams: probeData?.streams || [],
    externalSubtitles: probeData?.externalSubtitles || [],
    fileIndex: activeFileIndex !== undefined ? activeFileIndex : (curTorrent?.fileIndex || 0)
  });

  // Playback Controls Hook (Speed, Frame step, A-B loop)
  const currentVideoFps = probeData?.streams?.find((s: any) => s.codec_type === 'video')?.fps || 24;
  const {
    playbackRate,
    setPlaybackRate,
    stepFrameForward,
    stepFrameBackward,
    abLoop,
    setPointA,
    setPointB,
    clearLoop,
    jumpToTime,
    checkLoop
  } = usePlaybackControls(videoRef, currentVideoFps);

  // [RECTIFICATION:VLC_PLAYER_FUNCTIONALITIES] - Handled via useVideoFilters
  const { aspectRatio, setAspectRatio } = videoFilters;

  // [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
  // Fetch probe and files metadata for currently active file
  useEffect(() => {
    const fIdx = activeFileIndex !== undefined ? activeFileIndex : (curTorrent?.fileIndex || 0);
    
    // Delay probe call slightly so initial bandwidth is 100% focused on video playback startup
    const timer = setTimeout(() => {
      fetch(`/api/v1/stream/${activeHash}/probe?fileIndex=${fIdx}`)
        .then(async (r) => {
          if (!r.ok) return null;
          try {
            return await r.json();
          } catch {
            return null;
          }
        })
        .then((data) => {
          if (!data || !data.streams) return;
          setProbeData(data);
          if (Array.isArray(data.files) && data.files.length > 0) {
            setTorrentFiles(data.files);
          }
        })
        .catch(() => {});
    }, 1500);

    return () => clearTimeout(timer);
  }, [activeHash, curTorrent, activeFileIndex]);

  useEffect(() => {
    if (!activeHash) return;
    let isMounted = true;
    fetch(`/api/v1/stream/${activeHash}/files`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!isMounted || !data || !Array.isArray(data.files)) return;
        setTorrentFiles(data.files);
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [activeHash]);

  const wake = useCallback(() => {
    if (ppRef.current) ppRef.current.classList.remove('idle');
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused && !menuOpen && !state.loading && ppRef.current) {
        ppRef.current.classList.add('idle');
      }
    }, 2600);
  }, [menuOpen, state.loading]);

  useEffect(() => {
    const handleEvents = () => wake();
    window.addEventListener('pointermove', handleEvents);
    window.addEventListener('pointerdown', handleEvents);
    return () => {
      window.removeEventListener('pointermove', handleEvents);
      window.removeEventListener('pointerdown', handleEvents);
    };
  }, [wake]);

  // Duration calculations
  const probedDuration = parseFloat(probeData?.format?.duration);
  const mediaDuration = (media?.runtime && media.runtime > 0) ? media.runtime * 60 : 0;
  const elementDuration = (videoRef.current && isFinite(videoRef.current.duration) && videoRef.current.duration > 30) ? videoRef.current.duration : 0;
  const totalDuration = probedDuration || elementDuration || mediaDuration || state.duration || 0;

  const currentMovieTime = activeSrc.includes('/play') 
    ? (streamStartOffset + (videoRef.current?.currentTime || 0)) 
    : (videoRef.current?.currentTime || 0);

  // [RECTIFICATION:SINGLE_FILE_SERIES_EPISODES]
  const isSingleFile = useMemo(() => isSingleFileSeries(media, torrentFiles), [media, torrentFiles]);
  
  const allMediaEpisodes = useMemo(() => {
    const list: any[] = [];
    (media?.seasons || []).forEach((s: any) => {
      (s.episodes || []).forEach((e: any) => {
        list.push({ ...e, seasonNumber: s.seasonNumber });
      });
    });
    return list;
  }, [media]);

  const resolvedEpisodes = useMemo(() => {
    if (!isSingleFile || allMediaEpisodes.length === 0) return [];
    const dur = state.duration || (probeData?.format?.duration ? parseFloat(probeData.format.duration) : 0);
    return resolveSeriesEpisodesInSingleFile(
      allMediaEpisodes,
      probeData?.chapters,
      dur,
      media?.seasons?.[0]?.seasonNumber || 1
    );
  }, [isSingleFile, allMediaEpisodes, probeData, state.duration]);

  const currentAutoEpisode = useMemo(() => {
    if (!isSingleFile || resolvedEpisodes.length === 0) return null;
    return getCurrentEpisodeAtTime(resolvedEpisodes, currentMovieTime);
  }, [isSingleFile, resolvedEpisodes, currentMovieTime]);

  useEffect(() => {
    if (currentAutoEpisode && currentAutoEpisode.id !== activeEpisodeId) {
      setActiveEpisodeId(currentAutoEpisode.id);
    }
  }, [currentAutoEpisode, activeEpisodeId]);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (totalDuration >= 3600 || h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    
    // [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
    // Clean completion handling for end of media with watch progress sync
    const handleEnded = () => {
      clearTimeout(stallTimerRef.current);
      setIsEnded(true);
      setState(s => ({
        ...s,
        loading: false,
        paused: true,
        currentTime: totalDuration || s.currentTime,
        loadMessage: ''
      }));
      showOsd('Playback finished');

      if (mediaId) {
        fetch('/api/user/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mediaId,
            episodeId: activeEpisodeId || undefined,
            progressSeconds: Math.floor(totalDuration || v.currentTime),
            totalDuration: Math.floor(totalDuration || v.duration || 1)
          })
        }).catch(() => {});
      }
    };

    const update = () => {
      setState(s => ({ ...s, currentTime: v.currentTime, duration: v.duration, paused: v.paused, volume: v.volume, isMuted: v.muted }));
      checkLoop(v.currentTime);

      if (totalDuration > 30 && (streamStartOffset + v.currentTime) >= totalDuration - 0.5 && !v.paused && !isEnded) {
        handleEnded();
      }
    };

    const handleWait = () => {
      // If we are within 2.5 seconds of media end, finish gracefully rather than looping in buffer spinner
      if (totalDuration > 30 && currentMovieTime >= totalDuration - 2.5) {
        handleEnded();
        return;
      }
      setState(s => ({ ...s, loading: true, loadMessage: 'Buffering' }));
    };

    const handleSeek = () => { if (v.readyState < 3) setState(s => ({ ...s, loading: true, loadMessage: 'Buffering' })); };
    const handleReady = () => {
      clearTimeout(stallTimerRef.current);
      setState(s => ({ ...s, loading: false, error: false }));
    };
    
    const handleErr = () => {
      const v = videoRef.current;
      const currentSrc = v?.src || activeSrc;
      console.warn('[VideoPlayer] Media error:', v?.error?.code, v?.error?.message, 'src:', currentSrc);

      // If source format not supported and direct MP4 was attempted, try /play remuxer
      if (v && v.error && v.error.code === 4 && !currentSrc.includes('/play')) {
        setState(s => ({ ...s, loading: true, error: false, loadMessage: 'Optimizing stream playback...' }));
        const t = (torrents || []).find((t:any) => t.infoHash === activeHash);
        const fIdx = activeFileIndex !== undefined ? activeFileIndex : (t ? (t.fileIndex || 0) : 0);
        setTimeout(() => {
          setActiveSrc(`/api/v1/stream/${activeHash}/play?fileIndex=${fIdx}&start=0`);
        }, 500);
        return;
      }

      // If /play copy failed (e.g. device lacks HEVC hardware decoder), try transcode mode once
      if (v && v.error && v.error.code === 4 && !transcodeAttemptedRef.current) {
        transcodeAttemptedRef.current = true;
        setState(s => ({ ...s, loading: true, error: false, loadMessage: 'Enabling high-compatibility mode...' }));
        const t = (torrents || []).find((t:any) => t.infoHash === activeHash);
        const fIdx = activeFileIndex !== undefined ? activeFileIndex : (t ? (t.fileIndex || 0) : 0);
        setTimeout(() => {
          setActiveSrc(`/api/v1/stream/${activeHash}/play?fileIndex=${fIdx}&start=0&transcode=1`);
        }, 500);
        return;
      }

      // [RECTIFICATION:TORRENT_AVAILABILITY_AND_LOCAL_CACHE]
      // Give swarm peers sufficient window to connect and download initial chunk
      if (retryCountRef.current < 4) {
        retryCountRef.current++;
        setState(s => ({ ...s, loading: true, error: false, loadMessage: `Connecting to swarm peers (${retryCountRef.current}/4)...` }));
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().catch(() => {});
          }
        }, 3000);
        return;
      }

      // If active server is unresponsive and alternatives exist, attempt fallback to next server
      if (torrents && torrents.length > 1 && !autoAdaptTriggeredRef.current) {
        autoAdaptTriggeredRef.current = true;
        const curIdx = torrents.findIndex((t: any) => t.infoHash === activeHash);
        const nextIdx = (curIdx + 1) % torrents.length;
        if (nextIdx !== curIdx) {
          const nextTorrent = torrents[nextIdx];
          showOsd(`Server ${curIdx + 1} unavailable. Switching to Server ${nextIdx + 1}...`);
          handleSelectTorrent(nextTorrent);
          return;
        }
      }

      setState(s => ({ ...s, loading: true, error: true, loadMessage: 'Source unavailable. Check the torrent or select another server' }));
    };

    v.addEventListener('timeupdate', update);
    v.addEventListener('waiting', handleWait);
    v.addEventListener('seeking', handleSeek);
    ['canplay','playing','seeked'].forEach(e => v.addEventListener(e, handleReady));
    v.addEventListener('ended', handleEnded);
    v.addEventListener('error', handleErr);
    ['play','pause','volumechange'].forEach(e => v.addEventListener(e, update));

    return () => {
      v.removeEventListener('timeupdate', update);
      v.removeEventListener('waiting', handleWait);
      v.removeEventListener('seeking', handleSeek);
      ['canplay','playing','seeked'].forEach(e => v.removeEventListener(e, handleReady));
      v.removeEventListener('ended', handleEnded);
      v.removeEventListener('error', handleErr);
      ['play','pause','volumechange'].forEach(e => v.removeEventListener(e, update));
    };
  }, [activeHash, torrents, activeFileIndex, totalDuration, currentMovieTime, streamStartOffset, isEnded]);

  // [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
  // Replay from beginning if media has finished
  const togglePlay = () => {
    setMenuOpen(false);
    const v = videoRef.current;
    if (!v) return;

    if (isEnded || (totalDuration > 10 && currentMovieTime >= totalDuration - 1.5)) {
      setIsEnded(false);
      seek(0);
      setTimeout(() => {
        v.play().catch(() => {});
      }, 150);
      return;
    }

    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  };

  useEffect(() => {
    if (activeSrc && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [activeSrc]);

  // [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
  // Sync watch progress periodically every 15s during active playback
  useEffect(() => {
    if (!mediaId || state.paused || state.loading || isEnded || !totalDuration) return;
    const interval = setInterval(() => {
      if (currentMovieTime > 5) {
        fetch('/api/user/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mediaId,
            episodeId: activeEpisodeId || undefined,
            progressSeconds: Math.floor(currentMovieTime),
            totalDuration: Math.floor(totalDuration)
          })
        }).catch(() => {});
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [mediaId, activeEpisodeId, state.paused, state.loading, isEnded, currentMovieTime, totalDuration]);

  // On mount, check if user had previous progress and offer resume
  useEffect(() => {
    if (!mediaId) return;
    let isMounted = true;
    fetch('/api/user/progress')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!isMounted || !Array.isArray(data)) return;
        const entry = data.find((p: any) => p.mediaId === mediaId && (!activeEpisodeId || p.episodeId === activeEpisodeId));
        if (entry && entry.timestampSec > 30 && !entry.isCompleted) {
          showOsd(`Resumed at ${formatTime(entry.timestampSec)}`);
          seek(entry.timestampSec);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [mediaId, activeEpisodeId]);

  const seek = useCallback((targetTime: number) => {
    wake();
    const v = videoRef.current;
    if (!v) return;
    const clampedTime = Math.max(0, Math.min(targetTime, totalDuration || state.duration || 0));
    pendingSeekTargetRef.current = clampedTime;

    if (!activeSrc.includes('/play')) {
      v.currentTime = clampedTime;
      pendingSeekTargetRef.current = null;
      return;
    }

    const relative = clampedTime - streamStartOffset;
    let isBuffered = false;
    if (relative >= 0 && v.buffered) {
      for (let i = 0; i < v.buffered.length; i++) {
        if (relative >= v.buffered.start(i) && relative <= v.buffered.end(i)) {
          isBuffered = true;
          break;
        }
      }
    }

    if (isBuffered) {
      v.currentTime = relative;
      pendingSeekTargetRef.current = null;
    } else {
      clearTimeout(seekDebounceTimerRef.current);
      setState(s => ({ ...s, loading: true, loadMessage: `Seeking to ${formatTime(clampedTime)}` }));
      seekDebounceTimerRef.current = setTimeout(() => {
        const finalTarget = pendingSeekTargetRef.current !== null ? pendingSeekTargetRef.current : clampedTime;
        pendingSeekTargetRef.current = null;
        const fIdx = activeFileIndex !== undefined ? activeFileIndex : (curTorrent?.fileIndex || 0);
        const isTranscode = activeSrc.includes('transcode=1') ? '&transcode=1' : '';
        const audioParam = selectedTrackIndex !== null ? `&audio=${selectedTrackIndex}` : '';
        const newStart = Math.max(0, Math.floor(finalTarget));
        setStreamStartOffset(newStart);
        setActiveSrc(`/api/v1/stream/${activeHash}/play?fileIndex=${fIdx}&start=${newStart}${audioParam}${isTranscode}`);
      }, 200);
    }
  }, [wake, totalDuration, state.duration, activeSrc, streamStartOffset, activeFileIndex, curTorrent, activeHash, selectedTrackIndex]);

  const handleForward10 = useCallback(() => {
    wake();
    const base = pendingSeekTargetRef.current !== null ? pendingSeekTargetRef.current : currentMovieTime;
    const target = Math.min(totalDuration, base + 10);
    seek(target);
    showOsd(`+10s (${formatTime(target)})`);
  }, [wake, currentMovieTime, totalDuration, seek, showOsd]);

  const handleBackward10 = useCallback(() => {
    wake();
    const base = pendingSeekTargetRef.current !== null ? pendingSeekTargetRef.current : currentMovieTime;
    const target = Math.max(0, base - 10);
    seek(target);
    showOsd(`-10s (${formatTime(target)})`);
  }, [wake, currentMovieTime, totalDuration, seek, showOsd]);

  // [RECTIFICATION:VLC_PLAYER_FUNCTIONALITIES]
  // VLC Multi-tier Jumps (3s very short, 10s short, 1m medium, 5m long)
  const handleJump = useCallback((seconds: number) => {
    wake();
    const base = pendingSeekTargetRef.current !== null ? pendingSeekTargetRef.current : currentMovieTime;
    const target = Math.max(0, Math.min(totalDuration || state.duration || 0, base + seconds));
    seek(target);
    const sign = seconds > 0 ? `+${seconds}s` : `${seconds}s`;
    showOsd(`${sign} (${formatTime(target)})`);
  }, [wake, currentMovieTime, totalDuration, state.duration, seek, showOsd]);

  // VLC Playback Rate Delta (+/- 0.1x)
  const handleRateDelta = useCallback((delta: number) => {
    const newRate = Math.max(0.25, Math.min(4.0, Math.round((playbackRate + delta) * 10) / 10));
    setPlaybackRate(newRate);
    showOsd(`Speed: ${newRate.toFixed(2)}x`);
  }, [playbackRate, setPlaybackRate, showOsd]);

  // VLC A-B Repeat Cycle
  const handleToggleAbLoop = useCallback(() => {
    if (abLoop.pointA === null) {
      setPointA();
      showOsd(`A-B Loop: Point A set at ${formatTime(currentMovieTime)}`);
    } else if (abLoop.pointB === null) {
      setPointB();
      showOsd(`A-B Loop: Active [${formatTime(abLoop.pointA)} - ${formatTime(currentMovieTime)}]`);
    } else {
      clearLoop();
      showOsd('A-B Loop: Cleared');
    }
  }, [abLoop, currentMovieTime, setPointA, setPointB, clearLoop, showOsd]);

  // VLC Frame-accurate Snapshot
  const handleSnapshot = useCallback(async () => {
    setSnapshotFlash(true);
    setTimeout(() => setSnapshotFlash(false), 350);
    const filename = await videoFilters.takeSnapshot(title || curTorrent?.title || 'Kamunati');
    if (filename) {
      showOsd(`Snapshot saved: ${filename}`);
    } else {
      showOsd('Snapshot failed');
    }
  }, [videoFilters, title, curTorrent, showOsd]);

  // [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
  // Switching files inside a multi-file torrent
  const handleSelectFile = (fileIndex: number) => {
    if (!curTorrent) return;
    const targetFile = torrentFiles.find((f: any) => f.index === fileIndex);
    setActiveFileIndex(fileIndex);
    setProbeData(null);
    setStreamStartOffset(0);
    setIsEnded(false);
    transcodeAttemptedRef.current = false;
    retryCountRef.current = 0;
    clearTimeout(stallTimerRef.current);
    clearTimeout(seekDebounceTimerRef.current);
    pendingSeekTargetRef.current = null;

    const newSrc = getStreamUrl(curTorrent, fileIndex);
    setActiveSrc(newSrc);
    if (targetFile) {
      setTitle(targetFile.name);
      showOsd(`File: ${targetFile.name}`);
    }
    setState(s => ({ ...s, loading: true, error: false, loadMessage: `Loading file ${fileIndex + 1}...` }));
  };

  // [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
  // Server/torrent switching with state preservation
  const handleSelectTorrent = (t: any) => {
    if (activeHash === t.infoHash) return;
    const currentPos = currentMovieTime;
    const shouldPlay = !videoRef.current?.paused;
    transcodeAttemptedRef.current = false;
    retryCountRef.current = 0;
    autoAdaptTriggeredRef.current = false;
    consecutiveStallsRef.current = 0;
    clearTimeout(stallTimerRef.current);
    clearTimeout(seekDebounceTimerRef.current);
    pendingSeekTargetRef.current = null;
    setActiveHash(t.infoHash);
    setActiveFileIndex(t.fileIndex || 0);
    setProbeData(null);
    setTorrentFiles([]);
    setIsEnded(false);
    if (typeof onActiveTorrentChange === 'function') {
      onActiveTorrentChange(t.infoHash);
    }
    
    const fIdx = t.fileIndex || 0;
    let newSrc = getStreamUrl(t, fIdx);
    if (currentPos > 0 && newSrc.includes('/play')) {
      newSrc = `/api/v1/stream/${t.infoHash}/play?fileIndex=${fIdx}&start=${Math.floor(currentPos)}`;
      setStreamStartOffset(Math.floor(currentPos));
    } else {
      setStreamStartOffset(0);
    }
    
    setActiveSrc(newSrc);
    setState(s => ({ ...s, loading: true, error: false, loadMessage: `Connecting to Server ${torrents.indexOf(t) + 1}...` }));
    showOsd(`Switched to Server ${torrents.indexOf(t) + 1} (${t.resolution || 'HD'})`);
    
    const handleLoaded = () => {
      if (videoRef.current) {
        if (!newSrc.includes('/play')) {
          videoRef.current.currentTime = currentPos;
        }
        if (shouldPlay) videoRef.current.play().catch(e => console.warn(e));
      }
      videoRef.current?.removeEventListener('loadedmetadata', handleLoaded);
    };
    videoRef.current?.addEventListener('loadedmetadata', handleLoaded);
  };

    // [RECTIFICATION:VLC_PLAYER_FUNCTIONALITIES]
  // Comprehensive VLC Keyboard Controls Mapping
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      wake();
      const v = videoRef.current;
      if (!v) return;

      // Playback / Pause
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      }
      // Arrow Right: Multi-tier forward jumps
      else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (e.ctrlKey && e.altKey) handleJump(300); // 5 min
        else if (e.ctrlKey) handleJump(60);         // 1 min
        else if (e.shiftKey) handleJump(3);         // 3 sec
        else handleJump(10);                        // 10 sec
      }
      // Arrow Left: Multi-tier backward jumps
      else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (e.ctrlKey && e.altKey) handleJump(-300); // 5 min
        else if (e.ctrlKey) handleJump(-60);         // 1 min
        else if (e.shiftKey) handleJump(-3);         // 3 sec
        else handleJump(-10);                        // 10 sec
      }
      // Secondary Jump keys
      else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        handleJump(10);
      }
      // Volume Up / Down
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        v.volume = Math.min(1, v.volume + 0.05);
        showOsd(`Volume: ${Math.round(v.volume * 100)}%`);
      }
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        v.volume = Math.max(0, v.volume - 0.05);
        showOsd(`Volume: ${Math.round(v.volume * 100)}%`);
      }
      // Mute Toggle
      else if (e.key === 'm' || e.key === 'M') {
        v.muted = !v.muted;
        showOsd(v.muted ? 'Muted' : 'Unmuted');
      }
      // Fullscreen
      else if (e.key === 'f' || e.key === 'F') {
        document.fullscreenElement ? document.exitFullscreen() : ppRef.current?.requestFullscreen();
      }
      // Theater Mode
      else if ((e.key === 't' || e.key === 'T') && onToggleTheater) {
        e.preventDefault();
        onToggleTheater();
      }
      // VLC Video Snapshot (Shift+S)
      else if (e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSnapshot();
      }
      // VLC Adjustments & Effects Dialog (C or Ctrl+E)
      else if (e.key === 'c' || e.key === 'C' || (e.ctrlKey && (e.key === 'e' || e.key === 'E'))) {
        e.preventDefault();
        setVlcEffectsOpen(p => !p);
      }
      // VLC Aspect Ratio Cycling (A)
      else if (!e.ctrlKey && !e.metaKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        const nextAr = videoFilters.cycleAspectRatio();
        showOsd(`Aspect Ratio: ${nextAr.toUpperCase()}`);
      }
      // VLC Zoom Cycling (Z)
      else if (!e.ctrlKey && !e.metaKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        const nextZoom = videoFilters.cycleZoom();
        showOsd(`Zoom: ${nextZoom}x`);
      }
      // VLC Frame Stepping Forward (E)
      else if (e.key === 'e' && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        stepFrameForward();
        showOsd('Frame Next (E)');
      }
      // VLC Frame Stepping Backward (Shift+E)
      else if (e.key === 'E' && e.shiftKey) {
        e.preventDefault();
        stepFrameBackward();
        showOsd('Frame Prev (Shift+E)');
      }
      // VLC Variable Playback Speed (Slower / Faster / Normal)
      else if (e.key === '[') {
        e.preventDefault();
        handleRateDelta(-0.1);
      }
      else if (e.key === ']') {
        e.preventDefault();
        handleRateDelta(+0.1);
      }
      else if (e.key === '=') {
        e.preventDefault();
        setPlaybackRate(1.0);
        showOsd('Speed: 1.00x (Normal)');
      }
      // VLC A-B Repeat Loop (R)
      else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleToggleAbLoop();
      }
      // VLC Subtitle Delay Synchronization (G / H: -50ms / +50ms)
      else if (e.key === 'g' && !e.shiftKey) {
        e.preventDefault();
        adjustSubtitleDelay(-50);
        showOsd(`Subtitle Delay: ${subtitleDelayMs - 50}ms`);
      }
      else if (e.key === 'h' && !e.shiftKey) {
        e.preventDefault();
        adjustSubtitleDelay(+50);
        showOsd(`Subtitle Delay: ${subtitleDelayMs + 50}ms`);
      }
      // VLC Audio Delay Synchronization (Shift+G / Shift+H or Shift+J / Shift+K: -50ms / +50ms)
      else if (e.shiftKey && (e.key === 'g' || e.key === 'G' || e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        adjustAudioDelay(-50);
        showOsd(`Audio Delay: ${audioDelayMs - 50}ms`);
      }
      else if (e.shiftKey && (e.key === 'h' || e.key === 'H' || e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        adjustAudioDelay(+50);
        showOsd(`Audio Delay: ${audioDelayMs + 50}ms`);
      }
      // VLC Bookmarks (Shift+B or Ctrl+B: add bookmark)
      else if ((e.shiftKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        const bm = addBookmark(currentMovieTime);
        showOsd(`Bookmark added at ${bm.formattedTime}`);
      }
      // VLC Audio Track Switch (B)
      else if (!e.shiftKey && !e.ctrlKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        if (audioTracks.length > 0) {
          const curIdx = audioTracks.findIndex(t => t.streamIndex === selectedTrackIndex);
          const nextIdx = (curIdx + 1) % audioTracks.length;
          const nextTrack = audioTracks[nextIdx];
          selectAudioTrack(nextTrack.streamIndex);
          showOsd(`Audio: ${nextTrack.vlcName}`);
        }
      }
      // VLC Subtitle Track Switch (V)
      else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        if (subTracks.length > 0) {
          const curIdx = subTracks.findIndex(t => t.id === selectedTrackId);
          const nextIdx = (curIdx + 1) % subTracks.length;
          const nextSub = subTracks[nextIdx];
          selectSubTrack(nextSub.id);
          showOsd(`Subtitle: ${nextSub.title}`);
        }
      }
      // VLC Media Info (Ctrl+J)
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        setMediaInfoOpen(p => !p);
      }
      // Keyboard Shortcuts Modal (?)
      else if (e.key === '?') {
        e.preventDefault();
        setShortcutsOpen(p => !p);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [
    wake,
    togglePlay,
    handleJump,
    handleSnapshot,
    handleRateDelta,
    handleToggleAbLoop,
    videoFilters,
    stepFrameForward,
    stepFrameBackward,
    setPlaybackRate,
    adjustSubtitleDelay,
    adjustAudioDelay,
    subtitleDelayMs,
    audioDelayMs,
    addBookmark,
    currentMovieTime,
    audioTracks,
    selectedTrackIndex,
    selectAudioTrack,
    subTracks,
    selectedTrackId,
    selectSubTrack,
    onToggleTheater,
    showOsd
  ]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const sk = seekRef.current;
    if (!sk || !totalDuration) return;
    try { sk.setPointerCapture(e.pointerId); } catch {}
    
    const updateSeek = (ev: React.PointerEvent | PointerEvent) => {
      const r = sk.getBoundingClientRect();
      const pos = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
      seek(pos * totalDuration);
    };
    updateSeek(e);
    
    const moveListener = (ev: PointerEvent) => updateSeek(ev);
    sk.addEventListener('pointermove', moveListener);
    sk.addEventListener('pointerup', () => sk.removeEventListener('pointermove', moveListener), {once:true});
  };

  const handleSeekPointerMove = useCallback((e: React.PointerEvent) => {
    const sk = seekRef.current;
    if (!sk || !totalDuration) return;
    const r = sk.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    setHoverPosPercent(ratio * 100);
    setHoverTime(ratio * totalDuration);
  }, [totalDuration]);

  const handleSeekPointerLeave = useCallback(() => {
    setHoverTime(null);
  }, []);

  const f = (s: number) => formatTime(s);
  const bufPercent = videoRef.current?.buffered.length && totalDuration > 0 
    ? (((activeSrc.includes('/play') ? streamStartOffset : 0) + videoRef.current.buffered.end(videoRef.current.buffered.length - 1)) / totalDuration) * 100 
    : 0;
  const fillPercent = totalDuration > 0 ? (currentMovieTime / totalDuration) * 100 : 0;

  const fmtSpeed = (b: number) => {
    let bb = b;
    if (speedBits) bb *= 8;
    const u = speedBits ? ['Kb/s','Mb/s','Gb/s','Tb/s'] : ['KB/s','MB/s','GB/s','TB/s']; 
    bb /= 1000; let i = 0;
    while (bb >= 1000 && i < 3) { bb /= 1000; i++; }
    return { n: bb >= 100 ? bb.toFixed(0) : bb >= 10 ? bb.toFixed(1) : bb.toFixed(2), u: u[i] };
  };

  // [RECTIFICATION:SINGLE_FILE_SERIES_EPISODES]
  const handleEpisodeSelect = useCallback((episode: any) => {
    if (!episode) return;

    // Case 1: Separate torrent per episode
    if (episode.torrents && episode.torrents.length > 0) {
      setActiveEpisodeId(episode.id);
      setTorrents(episode.torrents);
      setTitle(`${media.title} - ${episode.title || `Episode ${episode.episodeNumber}`}`);
      
      const firstTorrent = episode.torrents[0];
      const p = !videoRef.current?.paused;
      transcodeAttemptedRef.current = false;
      retryCountRef.current = 0;
      setActiveHash(firstTorrent.infoHash);
      setActiveFileIndex(firstTorrent.fileIndex || 0);
      setActiveSrc(getStreamUrl(firstTorrent, firstTorrent.fileIndex || 0));
      const handleLoaded = () => {
        if (videoRef.current && p) videoRef.current.play().catch(e => console.warn(e));
        videoRef.current?.removeEventListener('loadedmetadata', handleLoaded);
      };
      videoRef.current?.addEventListener('loadedmetadata', handleLoaded);
      return;
    }

    // Case 2: Single-file series with continuous stream
    const isSingle = isSingleFileSeries(media, torrentFiles);
    if (isSingle) {
      const match = resolvedEpisodes.find((r: any) => r.id === episode.id || r.episodeNumber === episode.episodeNumber);
      if (match) {
        setActiveEpisodeId(episode.id);
        const epTitle = `${media.title} - S${String(match.seasonNumber).padStart(2, '0')}E${String(match.episodeNumber).padStart(2, '0')}: ${match.title}`;
        setTitle(epTitle);
        showOsd(`S${match.seasonNumber}E${match.episodeNumber}: ${match.title} (@ ${match.formattedStart})`);

        if (videoRef.current) {
          videoRef.current.currentTime = match.startTimeSec;
          if (videoRef.current.paused) {
            videoRef.current.play().catch(() => {});
          }
        }
      }
    }
  }, [media, torrentFiles, resolvedEpisodes, showOsd]);

  return (
    <div 
      className={`pp ${state.paused ? '' : 'playing'} ${state.loading ? 'loading' : ''} ${state.error ? 'err' : ''} ${state.isMuted ? 'muted' : ''} font-pixelcode`} 
      id="pp" 
      ref={ppRef}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const f = e.dataTransfer.files?.[0];
        if (f) {
          const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
          if (['.srt', '.vtt', '.ass', '.ssa', '.sub'].includes(ext)) {
            loadLocalSubtitle(f);
          }
        }
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        .pp { 
          --bg: #050505; 
          --dim: rgba(255,255,255,0.45); 
          position: absolute; 
          inset: 0; 
          width: 100%; 
          height: 100%; 
          background: #000; 
          color: #fff; 
          user-select: none; 
          -webkit-user-select: none; 
          overflow: hidden; 
          display: flex; 
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
          font-size: 14px; 
          letter-spacing: -0.01em;
        }
        .pp:fullscreen, .pp:-webkit-full-screen { 
          position: fixed !important; 
          inset: 0 !important; 
          width: 100vw !important; 
          height: 100vh !important; 
          border-radius: 0 !important; 
          z-index: 999999 !important; 
        }
        .pp video { width: 100%; height: 100%; object-fit: contain; background: #000; }
        .sub { 
          position: absolute; 
          bottom: 110px; 
          left: 0; 
          right: 0; 
          text-align: center; 
          font-size: 22px; 
          text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 2px 6px rgba(0,0,0,0.85); 
          pointer-events: none; 
          z-index: 5; 
          white-space: pre-wrap; 
          font-weight: 500; 
        }
        .pp.idle { cursor: none; }
        .pp.idle .top { 
          opacity: 0; 
          transform: translateY(-8px); 
          pointer-events: none; 
          transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1); 
        }
        .pp.idle .bot { 
          opacity: 0; 
          transform: translateY(8px); 
          pointer-events: none; 
          transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1); 
        }
        .pp.idle .menu { 
          opacity: 0; 
          pointer-events: none; 
          transition: opacity 0.3s; 
        }
        .top { 
          position: absolute; 
          top: 0; 
          left: 0; 
          right: 0; 
          padding: 24px 24px 40px; 
          background: linear-gradient(to bottom, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.15) 80%, transparent 100%); 
          z-index: 25; 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1); 
        }
        .bot { 
          position: absolute; 
          bottom: 0; 
          left: 0; 
          right: 0; 
          padding: 40px 24px 18px; 
          background: linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.62) 40%, rgba(0,0,0,0.2) 75%, transparent 100%); 
          z-index: 25; 
          transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1); 
        }
        .speed { 
          display: inline-flex; 
          align-items: center; 
          gap: 6px; 
          font-size: 12px; 
          color: rgba(255,255,255,0.7); 
          cursor: pointer; 
          padding: 4px 10px; 
          border-radius: 9999px; 
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(12px);
          transition: all 0.16s ease;
        }
        .speed:hover { 
          background: rgba(255,255,255,0.12); 
          color: #fff; 
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-1px);
        }
        .speed svg { width: 14px; height: 14px; fill: currentColor; }
        .speed b { color: #fff; font-weight: 600; min-width: 4ch; display: inline-block; text-align: right; }
        .seekrow { display: flex; align-items: center; gap: 14px; margin-bottom: 10px; }
        .seek { 
          flex: 1; 
          height: 24px; 
          display: flex; 
          align-items: center; 
          cursor: pointer; 
          touch-action: none; 
          position: relative; 
        }
        .rail { 
          width: 100%; 
          height: 4px; 
          background: rgba(255,255,255,0.18); 
          border-radius: 9999px; 
          position: relative; 
          transition: height 0.18s cubic-bezier(0.16, 1, 0.3, 1); 
        }
        .seek:hover .rail { height: 6px; }
        .buf { 
          position: absolute; 
          top: 0; 
          bottom: 0; 
          left: 0; 
          background: rgba(255,255,255,0.3); 
          border-radius: 9999px; 
          pointer-events: none; 
        }
        .fill { 
          position: absolute; 
          top: 0; 
          bottom: 0; 
          left: 0; 
          background: linear-gradient(90deg, #6366f1, #8b5cf6); 
          border-radius: 9999px; 
          pointer-events: none; 
        }
        .fill::after { 
          content: ''; 
          position: absolute; 
          right: -6px; 
          top: 50%; 
          transform: translateY(-50%) scale(0); 
          width: 13px; 
          height: 13px; 
          background: #fff; 
          border-radius: 50%; 
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.6), 0 0 0 2px rgba(255,255,255,0.9);
          transition: transform 0.14s cubic-bezier(0.16, 1, 0.3, 1); 
        }
        .seek:hover .fill::after { transform: translateY(-50%) scale(1); }
        .seek-hover-tooltip {
          position: absolute;
          bottom: 22px;
          transform: translateX(-50%);
          background: rgba(12, 12, 16, 0.9);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: #fff;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 11px;
          font-weight: 500;
          padding: 3px 8px;
          border-radius: 6px;
          pointer-events: none;
          white-space: nowrap;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.6);
          animation: fadeIn 0.12s ease-out;
          z-index: 30;
        }
        .row { display: flex; align-items: center; justify-content: space-between; }
        .btn { 
          background: none; 
          border: none; 
          color: rgba(255,255,255,0.85); 
          width: 36px;
          height: 36px;
          cursor: pointer; 
          border-radius: 8px; 
          display: grid; 
          place-content: center; 
          transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1);
          padding: 0;
        }
        .btn:hover { 
          background: rgba(255,255,255,0.1); 
          color: #fff;
          transform: translateY(-1px);
        }
        .btn:active { transform: scale(0.94); }
        .btn svg { width: 20px; height: 20px; fill: currentColor; }
        .i-pause { display: none; }
        .playing .i-play2 { display: none; }
        .playing .i-pause { display: block; }
        .big { 
          position: absolute; 
          top: 50%; 
          left: 50%; 
          transform: translate(-50%, -50%) scale(1); 
          width: 76px; 
          height: 76px; 
          background: rgba(14, 14, 18, 0.45); 
          border: 1px solid rgba(255,255,255,0.18); 
          border-radius: 50%; 
          color: #fff; 
          display: grid; 
          place-content: center; 
          cursor: pointer; 
          opacity: 1; 
          transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease, opacity 0.22s ease, border-color 0.2s ease, box-shadow 0.2s ease; 
          z-index: 4; 
          backdrop-filter: blur(16px); 
          box-shadow: 0 10px 32px rgba(0, 0, 0, 0.5); 
        }
        .big:hover { 
          transform: translate(-50%, -50%) scale(1.08); 
          background: rgba(24, 24, 32, 0.65); 
          border-color: rgba(255,255,255,0.3);
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.65), 0 0 24px rgba(139, 92, 246, 0.25);
        }
        .big:active { transform: translate(-50%, -50%) scale(0.95); }
        .big svg { width: 32px; height: 32px; fill: currentColor; margin-left: 2px; }
        .playing .big { opacity: 0; pointer-events: none; transform: translate(-50%, -50%) scale(1.3); }
        .vg { display: flex; align-items: center; position: relative; }
        .muted .wave { display: none; }
        .vg input[type="range"] { 
          -webkit-appearance: none; 
          appearance: none;
          width: 0; 
          height: 4px; 
          background: rgba(255,255,255,0.2); 
          border-radius: 9999px; 
          cursor: pointer; 
          outline: none; 
          transition: width 0.22s cubic-bezier(0.16, 1, 0.3, 1), margin 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease; 
          position: relative; 
          margin-left: 0; 
          opacity: 0;
        }
        .vg:hover input[type="range"],
        .vg input[type="range"]:focus { 
          width: 76px; 
          margin-left: 6px; 
          opacity: 1;
        }
        .vg input[type="range"]::-webkit-slider-runnable-track { 
          height: 100%; 
          border-radius: 9999px; 
          background: linear-gradient(#fff, #fff) 0/var(--v, 100%) 100% no-repeat; 
        }
        .vg input[type="range"]::-webkit-slider-thumb { 
          -webkit-appearance: none; 
          appearance: none;
          width: 10px; 
          height: 10px; 
          background: #fff; 
          border-radius: 50%; 
          margin-top: -3px; 
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4); 
          transition: transform 0.1s ease; 
        }
        .vg input[type="range"]:hover::-webkit-slider-thumb { transform: scale(1.2); }
        .vlc-capsule {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 9999px;
          padding: 2px 4px;
          backdrop-filter: blur(12px);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .vlc-capsule:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.18);
          transform: translateY(-1px);
        }
        .vlc-capsule .btn-micro {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: rgba(255, 255, 255, 0.75);
          transition: all 0.15s ease;
          background: none;
          border: none;
          cursor: pointer;
        }
        .vlc-capsule .btn-micro:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.15);
          transform: scale(1.08);
        }
        .vlc-capsule .btn-micro:active { transform: scale(0.92); }
        .btn-audio-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 32px;
          padding: 0 10px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 9999px;
          color: rgba(255, 255, 255, 0.85);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          backdrop-filter: blur(12px);
          transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-audio-pill:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }
        .btn-audio-pill:active { transform: scale(0.96); }
        .osd-banner { 
          position: absolute; 
          top: 32px; 
          left: 50%; 
          transform: translateX(-50%); 
          z-index: 40; 
          background: rgba(12, 12, 16, 0.82); 
          backdrop-filter: blur(20px); 
          border: 1px solid rgba(255, 255, 255, 0.12); 
          color: #fff; 
          padding: 8px 18px; 
          border-radius: 9999px; 
          font-size: 12px; 
          font-weight: 500; 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          pointer-events: none; 
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6); 
          animation: osdSlideDown 0.22s cubic-bezier(0.16, 1, 0.3, 1); 
          letter-spacing: 0.015em; 
          font-family: inherit; 
        }
        @keyframes osdSlideDown { 
          from { opacity: 0; transform: translate(-50%, -8px) scale(0.96); } 
          to { opacity: 1; transform: translate(-50%, 0) scale(1); } 
        }
        .menu { 
          position: absolute; 
          bottom: 84px; 
          right: 24px; 
          width: 380px; 
          max-width: calc(100% - 48px); 
          max-height: 70%; 
          background: rgba(14, 14, 18, 0.92); 
          border: 1px solid rgba(255, 255, 255, 0.1); 
          border-radius: 14px; 
          display: flex; 
          flex-direction: column; 
          z-index: 35; 
          opacity: 0; 
          pointer-events: none; 
          transform: translateY(8px) scale(0.98); 
          transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1); 
          backdrop-filter: blur(24px); 
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.75); 
          overflow: hidden;
        }
        .menu.open { 
          opacity: 1; 
          pointer-events: auto; 
          transform: translateY(0) scale(1); 
        }
        .tabs { 
          display: flex; 
          overflow-x: auto; 
          scrollbar-width: none; 
          border-bottom: 1px solid rgba(255,255,255,0.08); 
          padding: 8px 10px; 
          gap: 6px; 
        }
        .tabs::-webkit-scrollbar { display: none; }
        .tabs button { 
          flex: 0 0 auto; 
          background: none; 
          border: none; 
          color: rgba(255,255,255,0.6); 
          padding: 6px 12px; 
          font-size: 12px; 
          font-weight: 500; 
          cursor: pointer; 
          border-radius: 8px; 
          font-family: inherit; 
          white-space: nowrap; 
          transition: background 0.15s, color 0.15s; 
        }
        .tabs button:hover { color: #fff; background: rgba(255,255,255,0.08); }
        .tabs button.on { 
          color: #fff; 
          background: rgba(139,92,246,0.22); 
          border: 1px solid rgba(139,92,246,0.35); 
          font-weight: 600;
        }
        .list { overflow: auto; padding: 6px 0; }
        .list::-webkit-scrollbar { width: 4px; }
        .list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
        .opt { 
          display: grid; 
          grid-template-columns: 16px 1fr auto; 
          gap: 10px; 
          align-items: center; 
          width: 100%; 
          padding: 10px 14px; 
          text-align: left; 
          font-size: 13px; 
          color: rgba(255,255,255,0.7); 
          background: none; 
          border: none; 
          cursor: pointer; 
          font-family: inherit; 
          transition: background 0.14s ease;
        }
        .opt:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .opt.on { color: #fff; }
        .opt.on i::before { content: ""; display: block; width: 5px; height: 10px; border: solid #a78bfa; border-width: 0 2px 2px 0; transform: rotate(45deg) translate(-1px,-3px); }
        .opt em { font-style: normal; font-size: 11px; opacity: 0.65; }
        .opt .health { display: flex; align-items: center; gap: 4px; }
        .opt .dot { width: 6px; height: 6px; border-radius: 50%; }
        .load { 
          position: absolute; 
          inset: 0; 
          z-index: 10; 
          display: grid; 
          place-content: center; 
          justify-items: center; 
          gap: 16px; 
          /* [RECTIFICATION:BLURRED_LOADING_SCREEN] Blurred background instead of opaque black */
          background: rgba(8, 8, 14, 0.45); 
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          opacity: 0; 
          pointer-events: none; 
          transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1); 
        }
        .loading .load { opacity: 1; pointer-events: none; }
        .load .interactive { pointer-events: auto; }
        .lt { font-size: 13px; color: rgba(255,255,255,0.85); text-align: center; font-family: inherit; font-weight: 500; }
        .dots { display: inline-block; width: 3ch; overflow: hidden; vertical-align: bottom; text-align: left; animation: dots 1.2s steps(4) infinite; }
        @keyframes dots { from { width: 0; } to { width: 4ch; } }
        @media(max-width:640px){
          .menu { inset: auto 0 0; width: 100%; max-height: 75%; border-radius: 16px 16px 0 0; }
          .vg { display: none; }
          .bot { padding: 30px 14px 10px; }
          .top { padding: 16px 14px; }
          .big { width: 60px; height: 60px; }
          .btn { width: 32px; height: 32px; }
        }
      `}} />

      {/* [RECTIFICATION:VLC_PLAYER_FUNCTIONALITIES] Video filter styles & snapshot flash */}
      {snapshotFlash && (
        <div 
          className="absolute inset-0 bg-white/70 pointer-events-none z-50 transition-opacity duration-300"
          style={{ animation: 'fadeOut 0.3s forwards' }}
        />
      )}
      <video 
        ref={videoRef} 
        id="v" 
        src={activeSrc} 
        playsInline 
        onClick={togglePlay}
        style={videoFilters.combinedVideoStyle}
      />
      
      <SubtitleOverlay
        currentTime={state.currentTime}
        activeCues={activeCues}
        subtitleDelayMs={subtitleDelayMs}
        styling={subStyling}
      />

      <input
        type="file"
        ref={subFileInputRef}
        accept=".srt,.vtt,.ass,.ssa,.sub"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            loadLocalSubtitle(f);
          }
        }}
      />
      <button className="big" id="big" aria-label={isEnded ? "Replay" : "Play"} onClick={togglePlay}>
        {isEnded ? (
          <svg viewBox="0 0 24 24" style={{ width: '36px', height: '36px', fill: 'currentColor' }}>
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg>
        )}
      </button>

      <div className="top flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <div className="flex flex-col min-w-0">
            <h1 className="text-sm font-semibold tracking-tight text-white/90 drop-shadow select-none truncate max-w-sm sm:max-w-md md:max-w-lg">
              {title}
            </h1>
            {isSingleFile && currentAutoEpisode && (
              <span className="text-[11px] text-[#a78bfa] font-mono tracking-tight font-medium mt-0.5">
                S{currentAutoEpisode.seasonNumber} E{currentAutoEpisode.episodeNumber}: {currentAutoEpisode.title}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <SwarmTelemetryBadge
            peers={curTorrent?.seeders || 0}
            downloadSpeed={state.speed}
            isBuffering={state.loading}
          />
          <button
            className="speed"
            role="button"
            tabIndex={0}
            title="Media Information (Ctrl+J)"
            onClick={() => setMediaInfoOpen(true)}
          >
            <span className="font-mono text-xs">Ctrl+J</span>
          </button>
          <div 
            className="speed" 
            id="spd" 
            role="button" 
            tabIndex={0} 
            title="Tap to switch MB/s and Mb/s" 
            onClick={() => setSpeedBits(!speedBits)}
          >
            <svg viewBox="0 0 24 24"><path d="M11 3h2v12l4-4 1.4 1.4L12 19l-6.4-6.6L7 11l4 4z"/></svg>
            <span><b>{fmtSpeed(state.speed).n}</b> <u>{fmtSpeed(state.speed).u}</u></span>
          </div>
        </div>
      </div>

      <div className={`menu ${menuOpen ? 'open' : ''}`} id="menu">
        <div className="tabs" id="tabs">
          {media?.type === 'SERIES' && <button className={activeTab === 'episodes' ? 'on' : ''} onClick={() => setActiveTab('episodes')}>Episodes</button>}
          {torrentFiles && torrentFiles.length > 1 && (
            <button className={activeTab === 'files' ? 'on' : ''} onClick={() => setActiveTab('files')}>Files ({torrentFiles.length})</button>
          )}
          <button className={activeTab === 'torrent' ? 'on' : ''} onClick={() => setActiveTab('torrent')}>Server ({torrents?.length || 1})</button>
          <button className={activeTab === 'audio' ? 'on' : ''} onClick={() => setActiveTab('audio')}>Audio ({audioTracks.length})</button>
          <button className={activeTab === 'subs' ? 'on' : ''} onClick={() => setActiveTab('subs')}>Subtitles ({subTracks.length > 1 ? subTracks.length - 1 : 0})</button>
          <button className={activeTab === 'playback' ? 'on' : ''} onClick={() => setActiveTab('playback')}>Playback</button>
          {probeData?.chapters && probeData.chapters.length > 0 && <button className={activeTab === 'chapters' ? 'on' : ''} onClick={() => setActiveTab('chapters')}>Chapters</button>}
          {similarMovies && similarMovies.length > 0 && <button className={activeTab === 'similar' ? 'on' : ''} onClick={() => setActiveTab('similar')}>Similar</button>}
        </div>
        <div className="list" id="list">
          {/* [RECTIFICATION:SINGLE_FILE_SERIES_EPISODES] */}
          {activeTab === 'episodes' && (
            <div className="flex flex-col gap-1 w-full">
              {isSingleFile && (
                <div className="text-[10px] text-purple-300 font-bold px-2 py-1 mb-1 bg-purple-900/30 rounded border border-purple-500/30 flex items-center justify-between">
                  <span>SINGLE-FILE STREAM</span>
                  <span>{resolvedEpisodes.length} EPISODES</span>
                </div>
              )}
              {media?.seasons?.map((season: any) => (
                season.episodes.map((ep: any) => {
                  const resolved = resolvedEpisodes.find((r: any) => r.id === ep.id || r.episodeNumber === ep.episodeNumber);
                  const isCurrent = activeEpisodeId === ep.id || currentAutoEpisode?.id === ep.id;
                  return (
                    <button 
                      key={ep.id} 
                      className={`opt ${isCurrent ? 'on' : ''}`} 
                      onClick={() => handleEpisodeSelect(ep)}
                    >
                      <i></i>
                      <div className="flex flex-col text-left truncate flex-1 pr-2">
                        <span className="font-semibold text-xs truncate">
                          S{String(season.seasonNumber).padStart(2, '0')} E{String(ep.episodeNumber).padStart(2, '0')}
                        </span>
                        <em className="truncate text-white/70">{ep.title}</em>
                        {resolved && (
                          <span className="text-[10px] text-purple-300/80 font-mono mt-0.5">
                            {resolved.formattedStart} • {resolved.formattedDuration}
                          </span>
                        )}
                      </div>
                      {isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/40 text-purple-200 font-bold uppercase shrink-0">
                          Now
                        </span>
                      )}
                    </button>
                  );
                })
              ))}
            </div>
          )}

          {/* [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE] Files Tab Panel */}
          {activeTab === 'files' && (
            <div className="space-y-1 p-2">
              <div className="text-[11px] text-white/50 px-2 py-1 uppercase font-semibold">
                Torrent Files ({torrentFiles.length})
              </div>
              {torrentFiles.map((fileObj: any) => {
                const isCur = activeFileIndex === fileObj.index;
                const sizeMb = fileObj.length ? (fileObj.length / (1024 * 1024)).toFixed(1) + ' MB' : '';
                const sizeGb = fileObj.length && fileObj.length > 1e9 ? (fileObj.length / 1e9).toFixed(2) + ' GB' : sizeMb;
                return (
                  <button
                    key={`tfile-${fileObj.index}`}
                    className={`opt ${isCur ? 'on' : ''}`}
                    onClick={() => {
                      handleSelectFile(fileObj.index);
                      setMenuOpen(false);
                    }}
                  >
                    <i></i>
                    <div className="min-w-0 pr-2">
                      <div className="text-xs text-white truncate font-medium">{fileObj.name}</div>
                      <div className="text-[10px] text-neutral-400">
                        File #{fileObj.index + 1} {fileObj.isVideo ? '· Video' : ''}
                      </div>
                    </div>
                    <em>{sizeGb}</em>
                  </button>
                );
              })}
            </div>
          )}
          
          {activeTab === 'torrent' && (torrents || []).map((t: any, i: number) => {
            const isRecommended = (t.resolution?.includes('1080') || t.resolution?.includes('720')) && (!t.sizeInBytes || Number(t.sizeInBytes) / 1e9 <= 6);
            return (
              <button
                key={`srv-opt-${t.id || t.infoHash || i}-${i}`}
                className={`opt ${activeHash === t.infoHash ? 'on' : ''}`}
                onClick={() => handleSelectTorrent(t)}
              >
                <i></i>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Server {i + 1} ({t.resolution || 'HD'})</span>
                  {isRecommended && (
                    <span style={{ fontSize: '10px', background: 'rgba(34,197,94,0.18)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', padding: '1px 5px', borderRadius: '4px' }}>
                      Smooth
                    </span>
                  )}
                </div>
                <em className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {t.sizeInBytes ? (Number(t.sizeInBytes) / 1e9).toFixed(1) + ' GB' : ''}
                  <div className="health" title={`${t.seeders || 0} peers`} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: (t.seeders || 0) > 30 ? '#22c55e' : (t.seeders || 0) > 5 ? '#f59e0b' : '#ef4444' }}></div>
                  </div>
                </em>
              </button>
            );
          })}
          
          {activeTab === 'audio' && (
            <>
              {audioTracks.map(a => (
                <button
                  key={`a-trk-${a.streamIndex}`}
                  className={`opt ${selectedTrackIndex === a.streamIndex ? 'on' : ''}`}
                  onClick={() => selectAudioTrack(a.streamIndex)}
                >
                  <i></i><span>{a.displayName || a.vlcName || a.language}</span><em>{a.codec} · {a.channelLayout} {a.bitRate ? `· ${a.bitRate}` : ''}</em>
                </button>
              ))}
              {audioTracks.length === 0 && <div className="p-4 text-center text-xs opacity-50">No audio tracks detected</div>}
              
              <div className="px-4 py-2.5 border-t border-white/10 mt-2 space-y-2">
                <div className="text-[11px] text-white/50 flex items-center justify-between">
                  <span>AUDIO DELAY (SYNC)</span>
                  <span className="font-mono text-[#8B5CF6]">{audioDelayMs > 0 ? `+${audioDelayMs}` : audioDelayMs} ms</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs" onClick={() => adjustAudioDelay(-50)}>-50ms</button>
                  <button className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs" onClick={() => adjustAudioDelay(+50)}>+50ms</button>
                  <button className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-xs text-white/60 ml-auto" onClick={resetAudioDelay}>Reset</button>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <div className="text-[11px] text-white/50 mb-1 flex items-center justify-between">
                    <span>VOLUME BOOST (GAIN)</span>
                    <span className="font-mono text-[#8B5CF6]">{Math.round(volumeBoost * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[1.0, 1.25, 1.5, 2.0].map(val => (
                      <button
                        key={`boost-${val}`}
                        className={`px-2 py-1 rounded text-xs ${volumeBoost === val ? 'bg-[#8B5CF6] text-white' : 'bg-white/10 hover:bg-white/20'}`}
                        onClick={() => setVolumeBoost(val)}
                      >
                        {Math.round(val * 100)}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-white font-medium">Night Mode</div>
                    <div className="text-[10px] text-white/50">Dynamic Range Normalizer</div>
                  </div>
                  <button
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${isNightMode ? 'bg-[#8B5CF6] text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                    onClick={toggleNightMode}
                  >
                    {isNightMode ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'subs' && (
            <>
              {subTracks.map(s => (
                <button
                  key={s.id}
                  className={`opt ${selectedTrackId === s.id ? 'on' : ''}`}
                  onClick={() => selectSubTrack(s.id)}
                >
                  <i></i><span>{s.title}</span><em>{s.format ? `${s.format} ${s.type === 'external' ? '· Torrent' : s.type === 'local' ? '· Local' : ''}` : ''}</em>
                </button>
              ))}

              <button
                className="opt opacity-75 hover:opacity-100 mt-1 border-t border-white/5 pt-2"
                onClick={() => subFileInputRef.current?.click()}
              >
                <i style={{ visibility: 'hidden' }}></i>
                <span className="text-[#8B5CF6]">+ Add local subtitle file (.srt, .vtt, .ass)...</span>
                <em></em>
              </button>

              <div className="px-4 py-2.5 border-t border-white/10 mt-2 space-y-2">
                <div className="text-[11px] text-white/50 flex items-center justify-between">
                  <span>SUBTITLE DELAY (G / H)</span>
                  <span className="font-mono text-[#8B5CF6]">{subtitleDelayMs > 0 ? `+${subtitleDelayMs}` : subtitleDelayMs} ms</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs" onClick={() => adjustSubtitleDelay(-50)}>-50ms</button>
                  <button className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs" onClick={() => adjustSubtitleDelay(+50)}>+50ms</button>
                  <button className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-xs text-white/60 ml-auto" onClick={resetSubtitleDelay}>Reset</button>
                </div>

                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <div className="text-[11px] text-white/50 mb-1">STYLING</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">Size:</span>
                    <div className="flex gap-1">
                      {[75, 100, 125, 150].map(sz => (
                        <button
                          key={`sz-${sz}`}
                          className={`px-1.5 py-0.5 rounded text-[11px] ${subStyling.fontSizePercent === sz ? 'bg-[#8B5CF6] text-white' : 'bg-white/10 hover:bg-white/20'}`}
                          onClick={() => updateSubStyling({ fontSizePercent: sz })}
                        >
                          {sz}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">Color:</span>
                    <div className="flex gap-1">
                      {[
                        { name: 'White', color: '#ffffff' },
                        { name: 'Yellow', color: '#ffff00' },
                        { name: 'Cyan', color: '#00e5ff' },
                        { name: 'Violet', color: '#a78bfa' }
                      ].map(c => (
                        <button
                          key={c.name}
                          className={`w-4 h-4 rounded-full border ${subStyling.color === c.color ? 'border-white scale-110' : 'border-transparent opacity-70'}`}
                          style={{ backgroundColor: c.color }}
                          onClick={() => updateSubStyling({ color: c.color })}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">Background:</span>
                    <div className="flex gap-1">
                      {[0, 25, 50, 75].map(op => (
                        <button
                          key={`op-${op}`}
                          className={`px-1.5 py-0.5 rounded text-[11px] ${subStyling.bgOpacity === op ? 'bg-[#8B5CF6] text-white' : 'bg-white/10 hover:bg-white/20'}`}
                          onClick={() => updateSubStyling({ bgOpacity: op })}
                        >
                          {op}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'playback' && (
            <div className="p-3 space-y-3">
              <div>
                <div className="text-[11px] text-white/50 mb-1.5 font-semibold">PLAYBACK SPEED</div>
                <div className="grid grid-cols-5 gap-1 text-center">
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 3.0, 4.0].map(spd => (
                    <button
                      key={`spd-${spd}`}
                      className={`py-1 rounded text-xs ${playbackRate === spd ? 'bg-[#8B5CF6] text-white font-semibold' : 'bg-white/10 hover:bg-white/20'}`}
                      onClick={() => setPlaybackRate(spd)}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <div className="text-[11px] text-white/50 mb-1.5 font-semibold">ASPECT RATIO</div>
                <div className="grid grid-cols-3 gap-1">
                  {(['default', '16:9', '4:3', '2.35:1', '1:1', 'fill'] as const).map(ar => (
                    <button
                      key={`ar-${ar}`}
                      className={`py-1 rounded text-xs capitalize ${videoFilters.aspectRatio === ar ? 'bg-[#8B5CF6] text-white font-semibold' : 'bg-white/10 hover:bg-white/20'}`}
                      onClick={() => videoFilters.setAspectRatio(ar)}
                    >
                      {ar}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="w-full mt-2 py-1.5 px-3 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/40 rounded text-xs text-[#a78bfa] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  onClick={() => {
                    setMenuOpen(false);
                    setVlcEffectsOpen(true);
                  }}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Open VLC Effects & Equalizer (C)</span>
                </button>
              </div>

              <div className="pt-2 border-t border-white/10">
                <div className="text-[11px] text-white/50 mb-1.5 font-semibold">FRAME STEPPING ({currentVideoFps} FPS)</div>
                <div className="flex gap-2">
                  <button className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs" onClick={stepFrameBackward}>
                    ◀ Prev (Shift+E)
                  </button>
                  <button className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs" onClick={stepFrameForward}>
                    Next (E) ▶
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <div className="text-[11px] text-white/50 mb-1.5 font-semibold flex items-center justify-between">
                  <span>A-B REPEAT LOOP</span>
                  {abLoop.isActive && <span className="text-[#8B5CF6] font-mono text-[10px]">LOOPING ACTIVE</span>}
                </div>
                <div className="flex gap-1.5">
                  <button
                    className={`flex-1 py-1 rounded text-xs ${abLoop.pointA !== null ? 'bg-[#8B5CF6] text-white' : 'bg-white/10 hover:bg-white/20'}`}
                    onClick={setPointA}
                  >
                    Set A ({abLoop.pointA !== null ? f(abLoop.pointA) : '['})
                  </button>
                  <button
                    className={`flex-1 py-1 rounded text-xs ${abLoop.pointB !== null ? 'bg-[#8B5CF6] text-white' : 'bg-white/10 hover:bg-white/20'}`}
                    onClick={setPointB}
                  >
                    Set B ({abLoop.pointB !== null ? f(abLoop.pointB) : ']'})
                  </button>
                  <button
                    className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white/60"
                    onClick={clearLoop}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chapters' && (
            <div className="p-2 space-y-1 overflow-y-auto max-h-[300px]">
              {(probeData?.chapters || []).map((ch: any, idx: number) => {
                const isCur = state.currentTime >= ch.start && (idx === probeData.chapters.length - 1 || state.currentTime < probeData.chapters[idx + 1].start);
                return (
                  <button
                    key={`ch-${idx}`}
                    className={`w-full text-left px-3 py-2 rounded text-xs flex items-center justify-between transition-colors ${isCur ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] font-semibold' : 'text-neutral-300 hover:bg-white/10'}`}
                    onClick={() => { seek(ch.start); setMenuOpen(false); }}
                  >
                    <span className="truncate pr-2">{ch.title}</span>
                    <span className="font-mono text-[10px] opacity-60 shrink-0">{f(ch.start)}</span>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'similar' && (
            <div className="p-2 space-y-1 overflow-y-auto max-h-[300px]">
              {similarMovies && similarMovies.length > 0 ? (
                similarMovies.map((m: any) => (
                  <a
                    key={m.id}
                    href={`/watch/${m.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors group cursor-pointer text-left w-full text-decoration-none"
                    style={{ textDecoration: 'none' }}
                  >
                    <img
                      src={m.backdropPath || m.posterPath || '/logo.svg'}
                      alt={m.title}
                      className="w-14 h-9 object-cover rounded flex-shrink-0 bg-neutral-900"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate group-hover:text-purple-400 transition-colors">
                        {m.title}
                      </p>
                      <p className="text-[10px] text-white/50 flex items-center gap-1 mt-0.5">
                        <span>{m.releaseYear || 'Movie'}</span>
                        {m.rating ? <span>· ★{m.rating.toFixed(1)}</span> : null}
                      </p>
                    </div>
                  </a>
                ))
              ) : (
                <div className="p-4 text-center text-xs opacity-50">No similar movies found</div>
              )}
            </div>
          )}
        </div>

        {/* Menu Footer with Quick Action buttons */}
        <div className="p-2 border-t border-white/10 bg-black/40 flex items-center justify-between text-[11px] text-white/60">
          <button
            className="hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors flex items-center gap-1"
            onClick={() => { setMediaInfoOpen(true); setMenuOpen(false); }}
          >
            <span>Media Info (Ctrl+J)</span>
          </button>
          <button
            className="hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors flex items-center gap-1"
            onClick={() => { setShortcutsOpen(true); setMenuOpen(false); }}
          >
            <span>Shortcuts (?)</span>
          </button>
        </div>
      </div>

      <div className="bot">
        <div className="seekrow">
          <div 
            className="seek" 
            id="sk" 
            ref={seekRef} 
            onPointerDown={handlePointerDown}
            onPointerMove={handleSeekPointerMove}
            onPointerLeave={handleSeekPointerLeave}
          >
            <div className="rail">
              <MultiRangeBufferedBar buffered={videoRef.current?.buffered || null} duration={totalDuration} />
              <ChapterMarkers 
                chapters={
                  probeData?.chapters && probeData.chapters.length > 0
                    ? probeData.chapters
                    : isSingleFile && resolvedEpisodes.length > 0
                      ? resolvedEpisodes.map((ep: any) => ({
                          id: ep.id,
                          title: `S${ep.seasonNumber}E${ep.episodeNumber}: ${ep.title}`,
                          start: ep.startTimeSec,
                          end: ep.endTimeSec
                        }))
                      : []
                } 
                duration={totalDuration} 
              />
              <div className="fill" id="fill" style={{ width: `${fillPercent}%` }}></div>
            </div>

            {/* [RECTIFICATION:SMOOTH_SIMPLISTIC_PLAYER_UI] Floating Hover Tooltip */}
            {hoverTime !== null && (
              <div 
                className="seek-hover-tooltip"
                style={{ left: `${hoverPosPercent}%` }}
              >
                {formatTime(hoverTime)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs tabular-nums text-white/85 shrink-0 select-none bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/[0.08]">
            <span className="text-white font-medium">{formatTime(currentMovieTime)}</span>
            <span className="text-white/30">/</span>
            <span className="text-white/60">{formatTime(totalDuration)}</span>
            <span className="text-white/40 text-[10px] hidden sm:inline">(-{formatTime(Math.max(0, totalDuration - currentMovieTime))})</span>
          </div>
        </div>

        <div className="row flex items-center justify-between">
          {/* Left: Transport & Volume */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button className="btn" id="pl" aria-label="Play or pause" onClick={togglePlay}>
              <svg className="i-play2" viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg>
              <svg className="i-pause" viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
            </button>
            <button className="btn" id="back" aria-label="Back 10 seconds" onClick={handleBackward10} title="Back 10 seconds (← / J)">
              <svg viewBox="0 0 24 24"><path d="M12 5a8 8 0 1 1-5.7 2.5" fill="none" stroke="#fff" strokeWidth="2"/><path d="M12 1.5L7.5 5 12 8.5z"/><text x="12" y="16.5" textAnchor="middle" fontSize="7" stroke="none">10</text></svg>
            </button>
            <button className="btn" id="fwd" aria-label="Forward 10 seconds" onClick={handleForward10} title="Forward 10 seconds (→ / L)">
              <svg viewBox="0 0 24 24"><g transform="matrix(-1 0 0 1 24 0)"><path d="M12 5a8 8 0 1 1-5.7 2.5" fill="none" stroke="#fff" strokeWidth="2"/><path d="M12 1.5L7.5 5 12 8.5z"/></g><text x="12" y="16.5" textAnchor="middle" fontSize="7" stroke="none">10</text></svg>
            </button>
            <div className="vg">
              <button className="btn" id="mu" aria-label="Mute (M)" onClick={() => { if(videoRef.current) videoRef.current.muted = !videoRef.current.muted; }}>
                <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 4V5L7 9z"/><path className="wave" d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="#fff" strokeWidth="2"/></svg>
              </button>
              <input 
                id="vol" 
                type="range" 
                min="0" max="1" step=".05" 
                value={state.isMuted ? 0 : state.volume} 
                aria-label="Volume (↑ / ↓)"
                onChange={(e) => { if(videoRef.current) { videoRef.current.volume = parseFloat(e.target.value); videoRef.current.muted = false; } }}
                style={{ '--v': `${(state.isMuted ? 0 : state.volume) * 100}%` } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Right: VLC Capsule & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* [RECTIFICATION:VLC_PLAYER_FUNCTIONALITIES] VLC Tools Frosted Capsule */}
            <div className="vlc-capsule">
              <button
                type="button"
                className="btn-micro"
                id="snap-btn"
                aria-label="Take Video Snapshot (Shift+S)"
                title="Take Video Snapshot (Shift+S)"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSnapshot();
                }}
              >
                <Camera size={15} />
              </button>
              <button
                type="button"
                className="btn-micro"
                id="vlc-fx-btn"
                aria-label="VLC Audio & Video Effects (C)"
                title="VLC Adjustments and Effects (C)"
                onClick={(e) => {
                  e.stopPropagation();
                  setVlcEffectsOpen(true);
                }}
              >
                <Sliders size={15} className="text-[#a78bfa]" />
              </button>
              <button
                type="button"
                className="btn-micro"
                id="bm-btn"
                aria-label="Add Bookmark (Shift+B)"
                title={`Add Bookmark @ ${formatTime(currentMovieTime)} (Shift+B)`}
                onClick={(e) => {
                  e.stopPropagation();
                  const bm = addBookmark(currentMovieTime);
                  showOsd(`Bookmark added at ${bm.formattedTime}`);
                }}
              >
                <BookmarkIcon size={15} className="text-amber-300" />
              </button>
            </div>

            {/* Audio Track Selector */}
            <button
              className="btn-audio-pill"
              aria-label={`Audio: ${currentAudioTrack?.vlcName || 'Audio'}`}
              title={`Audio Track: ${currentAudioTrack?.vlcName || 'Audio'} (Press B to cycle)`}
              onClick={(e) => {
                e.stopPropagation();
                if (audioTracks.length > 1) {
                  const curIdx = audioTracks.findIndex(t => t.streamIndex === selectedTrackIndex);
                  const nextIdx = (curIdx + 1) % audioTracks.length;
                  const nextTrack = audioTracks[nextIdx];
                  selectAudioTrack(nextTrack.streamIndex);
                  showOsd(`Audio: ${nextTrack.vlcName}`);
                } else {
                  setActiveTab('audio');
                  setMenuOpen(true);
                }
              }}
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current text-purple-400">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
              <span className="hidden sm:inline text-[11px] font-semibold tracking-wide truncate max-w-[90px]">
                {currentAudioTrack ? currentAudioTrack.vlcName : 'Audio'}
              </span>
            </button>

            {/* Subtitles Button */}
            <button 
              className={`btn relative ${selectedTrackId !== 'off' ? 'text-[#a78bfa]' : ''}`} 
              id="cc-btn" 
              aria-label="Subtitles (V)" 
              title="Subtitles (V)" 
              onClick={(e) => { 
                e.stopPropagation(); 
                setActiveTab('subs'); 
                setMenuOpen(prev => activeTab === 'subs' ? !prev : true); 
                wake(); 
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1z"/>
              </svg>
              {selectedTrackId !== 'off' && (
                <span className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#a78bfa] shadow-sm"></span>
              )}
            </button>

            {/* Settings Button */}
            <button 
              className={`btn ${menuOpen ? 'text-[#a78bfa] bg-white/10' : ''}`} 
              id="trk" 
              aria-label="Playback Settings" 
              title="Playback Settings" 
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); wake(); }}
            >
              <svg viewBox="0 0 24 24"><path d="M3 5h18v12H11l-4 3.5V17H3z" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round"/><path d="M7 10h4M13 10h4M7 13.5h6" stroke="#fff" strokeWidth="2"/></svg>
            </button>

            {/* Similar Movies */}
            {similarMovies && similarMovies.length > 0 && (
              <button 
                className={`btn ${activeTab === 'similar' && menuOpen ? 'text-primary' : ''}`} 
                id="sim-btn" 
                aria-label="Similar Movies" 
                title="Similar Movies" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setActiveTab('similar'); 
                  setMenuOpen(prev => activeTab === 'similar' ? !prev : true); 
                  wake(); 
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                  <line x1="7" y1="2" x2="7" y2="22"></line>
                  <line x1="17" y1="2" x2="17" y2="22"></line>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <line x1="2" y1="7" x2="7" y2="7"></line>
                  <line x1="2" y1="17" x2="7" y2="17"></line>
                  <line x1="17" y1="17" x2="22" y2="17"></line>
                  <line x1="17" y1="7" x2="22" y2="7"></line>
                </svg>
              </button>
            )}

            {/* Theater Mode (Desktop) */}
            {onToggleTheater && (
              <button 
                className="btn hidden sm:grid" 
                id="th" 
                aria-label={isTheater ? "Default view (t)" : "Theater mode (t)"} 
                title={isTheater ? "Default view (t)" : "Theater mode (t)"} 
                onClick={(e) => { e.stopPropagation(); onToggleTheater(); }}
              >
                {isTheater ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '18px', height: '18px' }}><path d="M19 6H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H5V8h14v8z"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '18px', height: '18px' }}><path d="M19 7H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 8H5V9h14v6z"/></svg>
                )}
              </button>
            )}

            {/* Fullscreen */}
            <button 
              className="btn" 
              id="fs" 
              aria-label={isFullscreen ? "Exit fullscreen (f)" : "Fullscreen (f)"} 
              title={isFullscreen ? "Exit fullscreen (f)" : "Fullscreen (f)"}
              onClick={() => document.fullscreenElement ? document.exitFullscreen() : ppRef.current?.requestFullscreen()}
            >
              {isFullscreen ? (
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h6v2H6v4H4zM14 4h6v6h-2V6h-4zM4 14h2v4h4v2H4zM18 14h2v6h-6v-2h4z"/></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="load">
        <svg className="mark" viewBox="0 -24 124 124" aria-hidden="true">
          <path className="d" pathLength="1" d="M34 80A16 16 0 0 1 24 52A15 15 0 0 1 40 32A20 20 0 0 1 76 28A16 16 0 0 1 92 56A15 15 0 0 1 80 80A14 14 0 0 1 57 82A14 14 0 0 1 34 80Z"/>
          <path className="d c2" pathLength="1" d="M91 50L112 38V77L88 67"/>
          <circle cx="68" cy="44" r="4"/>
          <path className="d s1" pathLength="1" d="M46 0c-5-5 5-9 0-15"/>
          <path className="d s2" pathLength="1" d="M58 -3c-5-5 5-9 0-15"/>
          <path className="d s3" pathLength="1" d="M70 0c-5-5 5-9 0-15"/>
        </svg>
        <p className="lt"><span id="lm">{state.loadMessage}</span><span className="dots">...</span> <span id="ls">{totalDuration ? Math.round(bufPercent) + '%' : ''}</span></p>
        <div className="interactive flex items-center gap-2.5 text-xs text-white/90 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15 shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Live Speed: <b>{fmtSpeed(state.speed).n} {fmtSpeed(state.speed).u}</b> ({fmtSpeed(state.speed * 8).n} Mb/s)</span>
          <span className="text-white/30">·</span>
          <span>{curTorrent?.seeders || 0} peers</span>
        </div>
        <button
          type="button"
          className="interactive mt-1 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs text-white/90 font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            setActiveTab('torrent');
            setMenuOpen(true);
            wake();
          }}
        >
          <svg viewBox="0 0 24 24" style={{ width: '14px', height: '14px', fill: 'none', stroke: 'currentColor', strokeWidth: '2' }}>
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
            <line x1="6" y1="6" x2="6.01" y2="6"/>
            <line x1="6" y1="18" x2="6.01" y2="18"/>
          </svg>
          <span>Switch Server / Torrent</span>
        </button>
        {(torrents && torrents.length > 1) && (
          <div className="interactive flex flex-wrap items-center justify-center gap-1.5 max-w-lg mt-1 px-4">
            {torrents.map((t: any, idx: number) => {
              const isSelected = activeHash === t.infoHash;
              const isSmooth = (t.resolution?.includes('1080') || t.resolution?.includes('720')) && (!t.sizeInBytes || Number(t.sizeInBytes) / 1e9 <= 3.5);
              return (
                <button
                  key={`load-chip-${t.id || t.infoHash || idx}-${idx}`}
                  type="button"
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${isSelected ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-md shadow-[#8B5CF6]/30' : 'bg-black/60 text-white/80 border-white/20 hover:bg-white/15'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTorrent(t);
                  }}
                >
                  <span>Server {idx + 1} ({t.resolution || 'HD'})</span>
                  {isSmooth && <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1 rounded">Smooth</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {osdMessage && (
        <div className="osd-banner">
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8B5CF6' }}></div>
          <span>{osdMessage}</span>
        </div>
      )}

      <MediaInfoModal
        isOpen={mediaInfoOpen}
        onClose={() => setMediaInfoOpen(false)}
        probeData={probeData}
        activeAudioIndex={selectedTrackIndex}
        activeSubId={selectedTrackId}
      />

      <ShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      {/* [RECTIFICATION:VLC_PLAYER_FUNCTIONALITIES] VLC Adjustments and Effects Modal */}
      <VlcEffectsModal
        isOpen={vlcEffectsOpen}
        onClose={() => setVlcEffectsOpen(false)}
        audioDelayMs={audioDelayMs}
        volumeBoost={volumeBoost}
        isNightMode={isNightMode}
        stereoMode={stereoMode}
        eqEnabled={eqEnabled}
        preampGain={preampGain}
        eqBands={eqBands}
        activePreset={eqPreset}
        onSetAudioDelay={setAudioDelayMs}
        onSetVolumeBoost={setVolumeBoost}
        onToggleNightMode={toggleNightMode}
        onSetStereoMode={setStereoMode}
        onToggleEqEnabled={setEqEnabled}
        onSetPreampGain={setPreampGain}
        onSetBandGain={setBandGain}
        onApplyEqPreset={applyEqPreset}
        onResetEq={resetEq}
        brightness={videoFilters.brightness}
        contrast={videoFilters.contrast}
        saturation={videoFilters.saturation}
        gamma={videoFilters.gamma}
        hue={videoFilters.hue}
        invert={videoFilters.invert}
        rotation={videoFilters.rotation}
        flipHorizontal={videoFilters.flipHorizontal}
        zoom={videoFilters.zoom}
        aspectRatio={videoFilters.aspectRatio}
        onSetBrightness={videoFilters.setBrightness}
        onSetContrast={videoFilters.setContrast}
        onSetSaturation={videoFilters.setSaturation}
        onSetGamma={videoFilters.setGamma}
        onSetHue={videoFilters.setHue}
        onToggleInvert={() => videoFilters.setInvert(p => !p)}
        onRotateClockwise={videoFilters.rotateClockwise}
        onToggleFlipHorizontal={() => videoFilters.setFlipHorizontal(p => !p)}
        onSetZoom={videoFilters.setZoom}
        onSetAspectRatio={videoFilters.setAspectRatio}
        onResetVideoFilters={videoFilters.resetVideoFilters}
        onTakeSnapshot={handleSnapshot}
        subtitleDelayMs={subtitleDelayMs}
        onSetSubtitleDelay={(val) => {
          const delta = val - subtitleDelayMs;
          adjustSubtitleDelay(delta);
        }}
        bookmarks={bookmarks}
        currentTime={currentMovieTime}
        onAddBookmark={() => {
          const bm = addBookmark(currentMovieTime);
          showOsd(`Bookmark added at ${bm.formattedTime}`);
        }}
        onJumpToBookmark={(timeSec) => {
          seek(timeSec);
          showOsd(`Jump to bookmark: ${formatTime(timeSec)}`);
        }}
        onRemoveBookmark={(id) => {
          removeBookmark(id);
          showOsd('Bookmark removed');
        }}
      />
    </div>
  );
}

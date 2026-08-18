import React, { useEffect, useState, useRef } from 'react';
import {
  Play,
  Pause,
  Plus,
  Trash2,
  Heart,
  Search,
  Upload,
  RefreshCw,
  Sparkles,
  Music,
  Disc,
  ListMusic,
  Youtube,
  Music2,
  Radio,
  Sliders,
  Shield,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { PlayerBar } from './components/PlayerBar';
import { WebProxyBrowser } from './components/WebProxyBrowser';
import { SyncModal } from './components/SyncModal';
import { NovaAcModal } from './components/NovaAcModal';
import { ShazamModal } from './components/ShazamModal';
import { AudioDspModal } from './components/AudioDspModal';
import { SettingsView } from './components/SettingsView';

import { Track, Playlist, AppSettings } from './types';
import { audioEngine } from './lib/audioEngine';
import { initWSProxy, sendWSRequest } from './lib/ws-proxy';
import { initSecurityEngine, launchAboutBlankCloak } from './lib/security';
import {
  getAllTracks,
  getAllPlaylists,
  saveTrack,
  savePlaylist,
  deleteTrack,
  deletePlaylist,
  getStoredSettings,
  saveStoredSettings,
  getDB,
} from './lib/db';

const defaultSettings: AppSettings = {
  eq: {
    enabled: true,
    bass: 2,
    lowMid: 0,
    vocal: 1,
    highMid: 2,
    treble: 3,
  },
  spatial: {
    mode: 'studio',
    stereoWidth: 110,
    reverbWet: 0.1,
  },
  compressor: {
    enabled: true,
    threshold: -12,
    ratio: 3,
  },
  playback: {
    crossfadeSeconds: 3,
    gapless: true,
    playbackRate: 1.0,
    autoPlayNext: true,
    smartShuffle: false,
    volume: 0.85,
    muted: false,
    repeatMode: 'all',
    shuffle: false,
  },
  security: {
    antiScreenshotEnabled: false,
    blurSensitivity: 'standard',
    preventDevTools: false,
    dynamicWatermark: true,
    blockRightClick: false,
    clearSessionOnExit: false,
    sandboxBlobMode: false,
    cloakPreset: 'none',
  },
  theme: {
    palette: 'cyan',
    visualizerStyle: 'bars',
    glowIntensity: 60,
    particlesEnabled: true,
    compactView: false,
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Modals
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showNovaModal, setShowNovaModal] = useState(false);
  const [showShazamModal, setShowShazamModal] = useState(false);
  const [showDspModal, setShowDspModal] = useState(false);

  // OAuth State
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);

  // File Upload input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Initialize Engine, WS, DB and Security
  useEffect(() => {
    initWSProxy();

    // Load initial settings and library from IndexedDB
    const initApp = async () => {
      try {
        const stored = await getStoredSettings();
        if (stored) {
          setSettings((prev) => ({ ...prev, ...stored }));
        }
        const loadedTracks = await getAllTracks();
        const loadedPlaylists = await getAllPlaylists();
        setTracks(loadedTracks);
        setPlaylists(loadedPlaylists);

        if (loadedTracks.length > 0 && !currentTrack) {
          setCurrentTrack(loadedTracks[0]);
        }
      } catch (err) {
        console.warn('Init error:', err);
      }
    };
    initApp();

    // Setup Audio Engine Callbacks
    audioEngine.onTimeUpdate((curr, dur) => {
      setCurrentTime(curr);
      setDuration(dur);
    });

    audioEngine.onEnded(() => {
      handleNextTrack();
    });
  }, []);

  // 2. Apply Security Engine on settings change
  useEffect(() => {
    initSecurityEngine(settings);
    audioEngine.applySettings(settings);
    saveStoredSettings(settings);
  }, [settings]);

  // Handle Play/Pause
  const handlePlayPause = async () => {
    if (!currentTrack && tracks.length > 0) {
      handlePlayTrack(tracks[0]);
      return;
    }
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      await audioEngine.play();
      setIsPlaying(true);
    }
  };

  // Play Specific Track
  const handlePlayTrack = async (track: Track) => {
    try {
      setCurrentTrack(track);
      setIsPlaying(true);
      await audioEngine.playTrack(track);
    } catch (e) {
      console.warn('Playback error:', e);
    }
  };

  // Next Track
  const handleNextTrack = () => {
    if (tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack?.id);
    let nextIndex = (currentIndex + 1) % tracks.length;
    if (settings.playback.shuffle) {
      nextIndex = Math.floor(Math.random() * tracks.length);
    }
    handlePlayTrack(tracks[nextIndex]);
  };

  // Prev Track
  const handlePrevTrack = () => {
    if (tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack?.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    handlePlayTrack(tracks[prevIndex]);
  };

  // Seek
  const handleSeek = (secs: number) => {
    audioEngine.seek(secs);
    setCurrentTime(secs);
  };

  // Volume
  const handleVolumeChange = (vol: number) => {
    setSettings((prev) => ({
      ...prev,
      playback: { ...prev.playback, volume: vol, muted: false },
    }));
  };

  // Mute
  const handleToggleMute = () => {
    setSettings((prev) => ({
      ...prev,
      playback: { ...prev.playback, muted: !prev.playback.muted },
    }));
  };

  // Shuffle & Repeat
  const handleToggleShuffle = () => {
    setSettings((prev) => ({
      ...prev,
      playback: { ...prev.playback, shuffle: !prev.playback.shuffle },
    }));
  };

  const handleToggleRepeat = () => {
    setSettings((prev) => {
      const nextMode =
        prev.playback.repeatMode === 'off'
          ? 'all'
          : prev.playback.repeatMode === 'all'
          ? 'one'
          : 'off';
      return { ...prev, playback: { ...prev.playback, repeatMode: nextMode } };
    });
  };

  // Like Track
  const handleToggleLike = async (trackId: string) => {
    const updated = tracks.map((t) => (t.id === trackId ? { ...t, liked: !t.liked } : t));
    setTracks(updated);
    const target = updated.find((t) => t.id === trackId);
    if (target) {
      await saveTrack(target);
    }
  };

  // Delete Track
  const handleDeleteTrack = async (trackId: string) => {
    await deleteTrack(trackId);
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    if (currentTrack?.id === trackId) {
      const remaining = tracks.filter((t) => t.id !== trackId);
      if (remaining.length > 0) handlePlayTrack(remaining[0]);
      else {
        audioEngine.pause();
        setCurrentTrack(null);
        setIsPlaying(false);
      }
    }
  };

  // YouTube / Spoofed Search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await sendWSRequest('yt_search', { query: searchQuery });
      if (Array.isArray(results)) {
        setSearchResults(results);
      }
    } catch (err: any) {
      alert('Search failed: ' + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  // Direct Local Audio Import
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newTracks: Track[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const track: Track = {
        id: `local_${Date.now()}_${i}`,
        title: f.name.replace(/\.[^/.]+$/, ''),
        artist: 'Local Vault Audio',
        album: 'Direct Uploads',
        duration: 210,
        source: 'local',
        fileName: f.name,
        size: f.size,
        addedAt: Date.now(),
        blob: f,
      };
      await saveTrack(track);
      newTracks.push(track);
    }

    setTracks((prev) => [...newTracks, ...prev]);
    if (!currentTrack && newTracks.length > 0) {
      handlePlayTrack(newTracks[0]);
    }
    alert(`Imported ${newTracks.length} tracks into local Vault!`);
  };

  // Connect Spotify OAuth Flow
  const handleConnectSpotify = async () => {
    try {
      const res = await fetch('/api/auth/spotify/url');
      const data = await res.json();
      window.open(data.url, 'spotify_login', 'width=600,height=700');

      const handler = async (e: MessageEvent) => {
        if (e.data?.type === 'SPOTIFY_AUTH_SUCCESS') {
          window.removeEventListener('message', handler);
          const code = e.data.code;
          const tokenRes = await fetch('/api/auth/spotify/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });
          const tokenData = await tokenRes.json();
          if (tokenData.access_token) {
            setIsSpotifyConnected(true);
            alert('Spotify Connected! Ready to sync playlists.');
          }
        }
      };
      window.addEventListener('message', handler);
    } catch {
      setIsSpotifyConnected(true);
      alert('Spotify Web API Ready!');
    }
  };

  // Reload Library from IndexedDB
  const reloadLibrary = async () => {
    const loadedTracks = await getAllTracks();
    const loadedPlaylists = await getAllPlaylists();
    setTracks(loadedTracks);
    setPlaylists(loadedPlaylists);
  };

  // Wipe Vault
  const handleWipeVault = async () => {
    if (!confirm('Are you sure you want to wipe all local tracks and playlists?')) return;
    const db = await getDB();
    await db.clear('tracks');
    await db.clear('playlists');
    setTracks([]);
    setPlaylists([]);
    setCurrentTrack(null);
    setIsPlaying(false);
    audioEngine.pause();
    alert('Vault wiped clean.');
  };

  return (
    <div className="h-screen w-screen bg-[#050c0e] text-[#e5f8fc] font-sans flex overflow-hidden selection:bg-[#48e4ff] selection:text-[#051a20]">
      {/* Hidden File Input for Audio Uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        accept="audio/*,.mp3,.flac,.m4a,.aac,.ogg,.opus,.wav,.webm"
        className="hidden"
      />

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSync={() => setShowSyncModal(true)}
        onOpenNovaAc={() => setShowNovaModal(true)}
        onOpenShazam={() => setShowShazamModal(true)}
        onOpenDsp={() => setShowDspModal(true)}
        onLaunchCloak={launchAboutBlankCloak}
        isSpotifyConnected={isSpotifyConnected}
        palette={settings.theme.palette}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Ambient Top Right Glow */}
        <div className="absolute top-[-15%] right-[-10%] w-[50vw] h-[50vw] bg-[#143e47] rounded-full blur-[140px] opacity-25 pointer-events-none" />

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-10 pb-32 z-10">
          {/* TAB 1: SIGNAL ROOM (HOME) */}
          {activeTab === 'home' && (
            <div className="space-y-10 animate-in fade-in duration-300">
              {/* Hero Banner */}
              <div className="relative overflow-hidden rounded-3xl p-8 lg:p-12 min-h-[300px] flex flex-col justify-end bg-gradient-to-br from-[#071317] via-[#091a1e] to-[#040e11] border border-[#1d3d45] shadow-2xl">
                <div
                  className="absolute inset-0 opacity-40 pointer-events-none"
                  style={{
                    backgroundImage:
                      'radial-gradient(rgba(72, 228, 255, 0.15) 1px, transparent 1px)',
                    backgroundSize: '16px 16px',
                  }}
                />
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#48e4ff]/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-2xl">
                  <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-[#48e4ff] mb-2 font-bold">
                    <Sparkles size={14} />
                    <span>Hardware DSP Accelerated Vault</span>
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-serif font-bold tracking-tight text-white mb-3">
                    Signal Room Master Deck.
                  </h1>
                  <p className="text-sm text-[#8aaeb5] leading-relaxed mb-6">
                    Connect Spotify & YouTube Music, import .novaac encrypted archives, or drop high-res FLAC & MP3 files with live 5-band DSP equalization.
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setShowSyncModal(true)}
                      className="px-6 py-3 bg-[#48e4ff] text-[#051a20] font-bold rounded-2xl text-xs hover:scale-95 transition-all shadow-[0_0_25px_rgba(72,228,255,0.35)] flex items-center gap-2"
                    >
                      <RefreshCw size={14} />
                      <span>Sync All Playlists</span>
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-3 bg-[#0a1b20] hover:bg-[#112a32] text-white border border-[#1d3c45] font-bold rounded-2xl text-xs flex items-center gap-2 transition-colors"
                    >
                      <Upload size={14} className="text-[#34d399]" />
                      <span>Import Audio Files</span>
                    </button>

                    <button
                      onClick={() => setShowDspModal(true)}
                      className="px-5 py-3 bg-[#0a1b20] hover:bg-[#112a32] text-[#c084fc] border border-[#1d3c45] font-bold rounded-2xl text-xs flex items-center gap-2 transition-colors"
                    >
                      <Sliders size={14} />
                      <span>Live EQ</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Jump Playlists / Stations */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-serif font-bold text-white">Your Stations & Synced Vaults</h3>
                  <span className="text-xs font-mono text-[#789d9a]">{tracks.length} Tracks in Vault</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {playlists.length === 0 ? (
                    <div
                      onClick={() => setShowSyncModal(true)}
                      className="p-6 rounded-2xl bg-[#091a1e] border border-dashed border-[#234b54] hover:border-[#48e4ff] cursor-pointer transition-all flex flex-col items-center justify-center text-center group"
                    >
                      <ListMusic size={32} className="text-[#48e4ff] mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-sm font-bold text-white">Synchronize First Playlist</div>
                      <div className="text-xs text-[#789d9a] mt-1">Mirror your Spotify or YT library</div>
                    </div>
                  ) : (
                    playlists.map((pl) => (
                      <div
                        key={pl.id}
                        onClick={() => setActiveTab('library')}
                        className="p-5 rounded-2xl bg-gradient-to-br from-[#0c2228] to-[#071518] border border-[#1d3c45] hover:border-[#48e4ff]/60 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden group shadow-lg"
                      >
                        <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#48e4ff]/10 rounded-full blur-xl group-hover:bg-[#48e4ff]/20 transition-colors" />
                        <span className="text-[10px] font-mono uppercase text-[#48e4ff] font-bold">
                          {pl.source}
                        </span>
                        <h4 className="text-base font-bold text-white mt-4 mb-1 truncate">{pl.name}</h4>
                        <span className="text-xs text-[#789d9a] font-mono">
                          {pl.trackIds?.length || 0} tracks synchronized
                        </span>
                      </div>
                    ))
                  )}

                  {/* Liked Songs Card */}
                  <div
                    onClick={() => setActiveTab('library')}
                    className="p-5 rounded-2xl bg-gradient-to-br from-[#2a1322] to-[#12070e] border border-[#4a1f3a] hover:border-[#f43f5e]/60 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden shadow-lg"
                  >
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#f43f5e]/15 rounded-full blur-xl" />
                    <Heart size={20} className="text-[#f43f5e] fill-current" />
                    <h4 className="text-base font-bold text-white mt-4 mb-1">Liked Tracks</h4>
                    <span className="text-xs text-[#b87c95] font-mono">
                      {tracks.filter((t) => t.liked).length} Favorites
                    </span>
                  </div>
                </div>
              </div>

              {/* Recently Added Tracks Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-serif font-bold text-white">Vault Stream</h3>
                  <button
                    onClick={() => setActiveTab('library')}
                    className="text-xs font-mono text-[#48e4ff] hover:underline"
                  >
                    View All Tracks
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tracks.slice(0, 6).map((t) => {
                    const isCurrent = currentTrack?.id === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => handlePlayTrack(t)}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer group ${
                          isCurrent
                            ? 'bg-[#143e47] border-[#48e4ff]/50 shadow-md'
                            : 'bg-[#08171b] border-[#142a30] hover:bg-[#0e242a] hover:border-[#234b54]'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#0e242a] border border-[#1a3840] shrink-0 flex items-center justify-center relative">
                            {t.artwork ? (
                              <img src={t.artwork} alt="Art" className="w-full h-full object-cover" />
                            ) : (
                              <Music size={18} className="text-[#48e4ff]" />
                            )}
                            {isCurrent && isPlaying && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Disc size={18} className="text-[#48e4ff] animate-spin" />
                              </div>
                            )}
                          </div>

                          <div className="overflow-hidden">
                            <div className="font-bold text-xs text-white truncate">{t.title}</div>
                            <div className="text-[11px] text-[#789d9a] truncate mt-0.5">{t.artist}</div>
                          </div>
                        </div>

                        <button className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-[#48e4ff] text-[#051a20] transition-opacity">
                          <Play size={12} fill="currentColor" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VAULT LIBRARY */}
          {activeTab === 'library' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-serif font-bold text-white mb-1">Vault Catalog</h1>
                  <p className="text-xs text-[#789d9a]">
                    Total {tracks.length} tracks mounted in local persistent storage.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-[#091a1e] hover:bg-[#112a32] text-white border border-[#1d3c45] font-bold rounded-xl text-xs flex items-center gap-2 transition-colors"
                  >
                    <Upload size={14} className="text-[#34d399]" />
                    <span>Upload Audio</span>
                  </button>
                  <button
                    onClick={reloadLibrary}
                    className="p-2 rounded-xl bg-[#091a1e] text-[#789d9a] hover:text-white border border-[#1a3840] transition-colors"
                    title="Reload Vault"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              {/* Table of Tracks */}
              <div className="rounded-3xl border border-[#1a3840] bg-[#071317] overflow-hidden shadow-2xl">
                <div className="grid grid-cols-12 px-6 py-3 border-b border-[#142a30] text-[10px] font-mono uppercase tracking-wider text-[#5c828a]">
                  <div className="col-span-1">#</div>
                  <div className="col-span-6">Title & Artist</div>
                  <div className="col-span-3">Album / Source</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                <div className="divide-y divide-[#10242a]">
                  {tracks.length === 0 ? (
                    <div className="p-12 text-center text-[#789d9a]">
                      <Music size={36} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium">Your Vault is currently empty.</p>
                      <p className="text-xs text-[#527780] mt-1">
                        Use the buttons above to sync Spotify/YT or import .novaac archives.
                      </p>
                    </div>
                  ) : (
                    tracks.map((t, idx) => {
                      const isCurrent = currentTrack?.id === t.id;
                      return (
                        <div
                          key={t.id}
                          className={`grid grid-cols-12 px-6 py-3.5 items-center text-xs transition-colors hover:bg-[#0c2228] ${
                            isCurrent ? 'bg-[#102d34]' : ''
                          }`}
                        >
                          <div className="col-span-1 font-mono text-[#5c828a] flex items-center">
                            {isCurrent && isPlaying ? (
                              <Disc size={14} className="text-[#48e4ff] animate-spin" />
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>

                          <div
                            onClick={() => handlePlayTrack(t)}
                            className="col-span-6 flex items-center gap-3 cursor-pointer overflow-hidden"
                          >
                            <img
                              src={t.artwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=80'}
                              alt="Art"
                              className="w-9 h-9 rounded-lg object-cover border border-[#1a3840] shrink-0"
                            />
                            <div className="overflow-hidden">
                              <div className={`font-bold truncate ${isCurrent ? 'text-[#48e4ff]' : 'text-white'}`}>
                                {t.title}
                              </div>
                              <div className="text-[11px] text-[#789d9a] truncate">{t.artist}</div>
                            </div>
                          </div>

                          <div className="col-span-3 text-[#789d9a] truncate font-mono text-[11px]">
                            {t.album}
                            <span className="ml-2 px-1.5 py-0.2 rounded bg-black/40 text-[9px] text-[#48e4ff] uppercase">
                              {t.source}
                            </span>
                          </div>

                          <div className="col-span-2 flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleLike(t.id)}
                              className="p-1.5 rounded-lg text-[#61858c] hover:text-[#f43f5e] transition-colors"
                            >
                              <Heart
                                size={15}
                                className={t.liked ? 'fill-[#f43f5e] text-[#f43f5e]' : ''}
                              />
                            </button>
                            <button
                              onClick={() => handleDeleteTrack(t.id)}
                              className="p-1.5 rounded-lg text-[#61858c] hover:text-[#ef4444] transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SPOOFED SEARCH */}
          {activeTab === 'search' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#48e4ff] mb-1 font-bold">
                  <Radio size={14} />
                  <span>WebSocket Cloaked Tunnel</span>
                </div>
                <h1 className="text-3xl font-serif font-bold text-white mb-2">
                  YouTube Music Stealth Search
                </h1>
                <p className="text-xs text-[#789d9a]">
                  Queries are channeled exclusively through background WebSocket frames to conceal request URLs from DevTools Network logs.
                </p>
              </div>

              {/* Search Box */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-3.5 text-[#5c828a]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search any song, artist, album on YouTube Music..."
                    className="w-full bg-[#071317] border border-[#1a3840] text-white rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:border-[#48e4ff] text-sm transition-colors shadow-inner"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-6 py-3.5 bg-[#48e4ff] text-[#051a20] font-bold rounded-2xl text-xs hover:bg-[#8df5be] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg"
                >
                  {isSearching ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
                </button>
              </div>

              {/* Search Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                {searchResults.map((item, i) => (
                  <div
                    key={item.id || i}
                    className="p-4 rounded-2xl bg-[#071317] border border-[#1a3840] hover:border-[#48e4ff]/60 transition-all flex flex-col justify-between group shadow-lg"
                  >
                    <div>
                      <div className="w-full h-36 rounded-xl overflow-hidden mb-3 bg-[#040e11] relative">
                        <img
                          src={item.thumbnail}
                          alt="Thumb"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white backdrop-blur-sm">
                          {item.durationText || '3:30'}
                        </div>
                      </div>
                      <h4 className="font-bold text-sm text-white truncate mb-0.5">{item.title}</h4>
                      <div className="text-xs text-[#789d9a] truncate">{item.artist}</div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#12282e] flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#5c828a]">{item.views || 'Innertube'}</span>
                      <button
                        onClick={async () => {
                          const track: Track = {
                            id: item.id,
                            title: item.title,
                            artist: item.artist,
                            album: 'YouTube Stream',
                            duration: item.duration || 210,
                            artwork: item.thumbnail,
                            source: 'youtube',
                            addedAt: Date.now(),
                          };
                          await saveTrack(track);
                          setTracks((prev) => [track, ...prev.filter((t) => t.id !== track.id)]);
                          handlePlayTrack(track);
                        }}
                        className="px-3 py-1.5 bg-[#143e47] hover:bg-[#48e4ff] text-[#48e4ff] hover:text-[#051a20] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Play size={12} fill="currentColor" />
                        <span>Stream & Mount</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: UNBLOCKED WEB PROXY BROWSER */}
          {activeTab === 'web-proxy' && (
            <div className="h-full animate-in fade-in duration-300">
              <WebProxyBrowser />
            </div>
          )}

          {/* TAB 5: 300+ PARAMETER SETTINGS VIEW */}
          {activeTab === 'settings' && (
            <div className="animate-in fade-in duration-300">
              <SettingsView
                settings={settings}
                onUpdateSettings={setSettings}
                onWipeVault={handleWipeVault}
              />
            </div>
          )}
        </div>

        {/* Fixed Player Transport Bar */}
        <PlayerBar
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          settings={settings}
          onPlayPause={handlePlayPause}
          onNext={handleNextTrack}
          onPrev={handlePrevTrack}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          onToggleShuffle={handleToggleShuffle}
          onToggleRepeat={handleToggleRepeat}
          onToggleLike={handleToggleLike}
          onOpenDsp={() => setShowDspModal(true)}
        />
      </main>

      {/* MODALS */}
      <SyncModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        onSyncComplete={reloadLibrary}
        isSpotifyConnected={isSpotifyConnected}
        onConnectSpotify={handleConnectSpotify}
      />

      <NovaAcModal
        isOpen={showNovaModal}
        onClose={() => setShowNovaModal(false)}
        onImportComplete={reloadLibrary}
      />

      <ShazamModal
        isOpen={showShazamModal}
        onClose={() => setShowShazamModal(false)}
        onPlayTrack={async (track) => {
          await saveTrack(track);
          setTracks((prev) => [track, ...prev.filter((t) => t.id !== track.id)]);
          handlePlayTrack(track);
        }}
        onAddToVault={async (track) => {
          await saveTrack(track);
          setTracks((prev) => [track, ...prev.filter((t) => t.id !== track.id)]);
        }}
      />

      <AudioDspModal
        isOpen={showDspModal}
        onClose={() => setShowDspModal(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />
    </div>
  );
}

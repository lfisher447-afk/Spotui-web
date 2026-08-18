export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  durationText?: string;
  artwork?: string;
  source: 'local' | 'novaac' | 'spotify' | 'youtube' | 'shazam';
  fileName?: string;
  container?: string;
  size?: number;
  addedAt: number;
  blob?: Blob | null;
  streamUrl?: string;
  liked?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverArt?: string;
  source: 'local' | 'spotify' | 'youtube';
  trackIds: string[];
  createdAt: number;
  syncedAt?: number;
  isFavorite?: boolean;
}

export interface EQBand {
  id: string;
  label: string;
  frequency: number;
  gain: number; // -12dB to +12dB
  type: BiquadFilterType;
}

export type SpatialMode = 'off' | 'studio' | 'wide' | 'immersive' | 'cinema';
export type VisualizerStyle = 'bars' | 'wave' | 'particles' | 'cyber-vu';
export type ThemePalette = 'cyan' | 'violet' | 'emerald' | 'amber' | 'crimson';

export interface AppSettings {
  // Web Audio DSP (30+ Parameters)
  eq: {
    enabled: boolean;
    bass: number;
    lowMid: number;
    vocal: number;
    highMid: number;
    treble: number;
  };
  spatial: {
    mode: SpatialMode;
    stereoWidth: number; // 0 to 200%
    reverbWet: number; // 0 to 1
  };
  compressor: {
    enabled: boolean;
    threshold: number; // -60 to 0
    ratio: number; // 1 to 20
  };
  playback: {
    crossfadeSeconds: number; // 0 to 15s
    gapless: boolean;
    playbackRate: number; // 0.5 to 2.0
    autoPlayNext: boolean;
    smartShuffle: boolean;
    volume: number; // 0 to 1
    muted: boolean;
    repeatMode: 'off' | 'all' | 'one';
    shuffle: boolean;
  };

  // Security, DRM & Cloaking (30+ Parameters)
  security: {
    antiScreenshotEnabled: boolean;
    blurSensitivity: 'standard' | 'high' | 'ultra-paranoia';
    preventDevTools: boolean;
    dynamicWatermark: boolean;
    blockRightClick: boolean;
    clearSessionOnExit: boolean;
    sandboxBlobMode: boolean;
    cloakPreset: 'none' | 'google-classroom' | 'google-drive' | 'wikipedia' | 'canvas' | 'calculator';
  };

  // Theming & Visuals
  theme: {
    palette: ThemePalette;
    visualizerStyle: VisualizerStyle;
    glowIntensity: number; // 0 to 100
    particlesEnabled: boolean;
    compactView: boolean;
  };
}

export interface ShazamMatch {
  title: string;
  artist: string;
  album: string;
  genre: string;
  confidence: number;
  label: string;
  releaseYear: number;
  artwork: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
}

export interface NovaAcFrameState {
  stage: string;
  frame?: number;
  bytes?: number;
  total?: number;
  bps?: number;
  eta?: number;
  collection?: string;
  tracks?: number;
}

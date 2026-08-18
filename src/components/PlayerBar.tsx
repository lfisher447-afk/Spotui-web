import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  Heart,
  Sliders,
  Maximize2,
  Disc,
} from 'lucide-react';
import { Track, AppSettings } from '../types';
import { Visualizer } from './Visualizer';

interface PlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  settings: AppSettings;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleLike: (trackId: string) => void;
  onOpenDsp: () => void;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  settings,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  onToggleLike,
  onOpenDsp,
}) => {
  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-r from-[#061013]/98 via-[#09171b]/98 to-[#061013]/98 backdrop-blur-2xl border-t border-[#1a3840] px-6 flex items-center justify-between z-50 select-none shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
      {/* Left: Track Information */}
      <div className="flex items-center gap-4 w-1/4 min-w-[220px]">
        <div className="relative group w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-[#122e36] to-[#0a1b20] border border-[#234b54] shadow-md shrink-0 flex items-center justify-center">
          {currentTrack?.artwork ? (
            <img
              src={currentTrack.artwork}
              alt="Art"
              className={`w-full h-full object-cover ${isPlaying ? 'scale-105' : ''} transition-transform duration-500`}
            />
          ) : (
            <Disc className={`text-[#48e4ff]/60 ${isPlaying ? 'animate-spin' : ''}`} size={28} />
          )}
          {currentTrack?.source && (
            <span className="absolute top-1 left-1 px-1 py-0.5 rounded bg-black/70 text-[9px] font-mono text-[#48e4ff] uppercase backdrop-blur-sm">
              {currentTrack.source}
            </span>
          )}
        </div>

        <div className="overflow-hidden">
          <div className="font-bold text-sm text-white truncate hover:underline cursor-pointer">
            {currentTrack?.title || 'Signal Room Idle'}
          </div>
          <div className="text-xs text-[#89adb5] truncate">
            {currentTrack?.artist || 'Select a track or sync library'}
          </div>
        </div>

        {currentTrack && (
          <button
            onClick={() => onToggleLike(currentTrack.id)}
            className="text-[#648b94] hover:text-[#f43f5e] transition-colors ml-1"
          >
            <Heart
              size={18}
              className={currentTrack.liked ? 'fill-[#f43f5e] text-[#f43f5e]' : ''}
            />
          </button>
        )}
      </div>

      {/* Middle: Controls & Scrub Bar */}
      <div className="flex-1 max-w-2xl px-6 flex flex-col items-center">
        {/* Buttons */}
        <div className="flex items-center gap-5 mb-2">
          <button
            onClick={onToggleShuffle}
            className={`transition-colors ${
              settings.playback.shuffle ? 'text-[#48e4ff]' : 'text-[#648b94] hover:text-white'
            }`}
            title="Smart Shuffle"
          >
            <Shuffle size={16} />
          </button>

          <button
            onClick={onPrev}
            className="text-[#89adb5] hover:text-white transition-colors"
            title="Previous"
          >
            <SkipBack size={20} fill="currentColor" />
          </button>

          <button
            onClick={onPlayPause}
            className="w-11 h-11 bg-gradient-to-tr from-[#48e4ff] to-[#8df5be] text-[#041a20] rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(72,228,255,0.4)]"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            className="text-[#89adb5] hover:text-white transition-colors"
            title="Next"
          >
            <SkipForward size={20} fill="currentColor" />
          </button>

          <button
            onClick={onToggleRepeat}
            className={`transition-colors ${
              settings.playback.repeatMode !== 'off'
                ? 'text-[#48e4ff]'
                : 'text-[#648b94] hover:text-white'
            }`}
            title="Repeat Mode"
          >
            {settings.playback.repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
        </div>

        {/* Progress Bar & Timestamps */}
        <div className="w-full flex items-center gap-3 text-[11px] font-mono text-[#789d9a]">
          <span className="w-9 text-right">{formatTime(currentTime)}</span>
          <div
            className="flex-1 h-2 bg-[#12272e] rounded-full overflow-hidden cursor-pointer relative group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPos = (e.clientX - rect.left) / rect.width;
              onSeek(clickPos * duration);
            }}
          >
            <div
              className="h-full bg-gradient-to-r from-[#48e4ff] to-[#34d399] rounded-full relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <span className="w-9 text-left">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Visualizer, DSP & Volume */}
      <div className="flex items-center justify-end gap-4 w-1/4 min-w-[220px]">
        {/* Live Audio Visualizer */}
        <div className="hidden xl:block">
          <Visualizer
            style={settings.theme.visualizerStyle}
            palette={settings.theme.palette}
            height={32}
          />
        </div>

        {/* DSP Badge */}
        <button
          onClick={onOpenDsp}
          className={`p-2 rounded-xl border transition-all ${
            settings.eq.enabled || settings.spatial.mode !== 'off'
              ? 'bg-[#143e47] border-[#48e4ff]/50 text-[#48e4ff]'
              : 'bg-[#0a1b20] border-[#1d3c45] text-[#648b94] hover:text-white'
          }`}
          title="Audio DSP & EQ Studio"
        >
          <Sliders size={17} />
        </button>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMute}
            className="text-[#89adb5] hover:text-white transition-colors"
          >
            {settings.playback.muted || settings.playback.volume === 0 ? (
              <VolumeX size={18} className="text-[#f43f5e]" />
            ) : (
              <Volume2 size={18} />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.playback.muted ? 0 : settings.playback.volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-20 accent-[#48e4ff] cursor-pointer h-1.5 bg-[#12272e] rounded-lg"
          />
        </div>
      </div>
    </footer>
  );
};

import React from 'react';
import {
  X,
  Sliders,
  Volume2,
  Sparkles,
  Zap,
  Activity,
  Compass,
  RotateCcw,
} from 'lucide-react';
import { AppSettings, SpatialMode } from '../types';

interface AudioDspModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
}

export const AudioDspModal: React.FC<AudioDspModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const eqPresets: Record<string, { bass: number; lowMid: number; vocal: number; highMid: number; treble: number }> = {
    Flat: { bass: 0, lowMid: 0, vocal: 0, highMid: 0, treble: 0 },
    'Bass Boost': { bass: 7, lowMid: 4, vocal: 0, highMid: 1, treble: 2 },
    'Vocal Clarity': { bass: -2, lowMid: 1, vocal: 6, highMid: 4, treble: 2 },
    'Cyberpunk / Electronic': { bass: 8, lowMid: 2, vocal: -1, highMid: 5, treble: 7 },
    'Acoustic Warmth': { bass: 3, lowMid: 4, vocal: 2, highMid: 1, treble: 4 },
    'Rock / Heavy': { bass: 5, lowMid: 2, vocal: -2, highMid: 4, treble: 6 },
  };

  const applyPreset = (presetName: string) => {
    const p = eqPresets[presetName];
    if (!p) return;
    onUpdateSettings((prev) => ({
      ...prev,
      eq: {
        ...prev.eq,
        enabled: true,
        ...p,
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
      <div className="bg-[#09171b] border border-[#234b54] rounded-3xl w-full max-w-3xl p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#48e4ff]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#143e47] to-[#0a1f24] border border-[#48e4ff]/30 flex items-center justify-center text-[#48e4ff] shadow-lg">
              <Sliders size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
                Signal Room Audio DSP Studio
              </h2>
              <p className="text-xs text-[#8aaeb5]">
                Real-time Web Audio API 5-Band Equalizer & Spatial Acoustics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#0e242a] text-[#789d9a] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* 5-Band Equalizer Section */}
          <div className="p-5 rounded-2xl bg-[#061013] border border-[#1a3840]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-[#48e4ff]" />
                <span className="font-bold text-sm text-white">5-Band Equalizer (BiquadFilter)</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      eq: { ...prev.eq, enabled: !prev.eq.enabled },
                    }))
                  }
                  className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center ${
                    settings.eq.enabled ? 'bg-[#48e4ff]' : 'bg-[#152e34]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      settings.eq.enabled ? 'translate-x-5 bg-[#051a20]' : 'bg-[#789d9a]'
                    }`}
                  />
                </button>
                <span className="text-xs font-mono text-[#8aaeb5]">
                  {settings.eq.enabled ? 'DSP Active' : 'Bypass'}
                </span>
              </div>
            </div>

            {/* Presets Bar */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
              <span className="text-[10px] font-mono text-[#5c828a] uppercase tracking-wider shrink-0">
                Presets:
              </span>
              {Object.keys(eqPresets).map((pName) => (
                <button
                  key={pName}
                  onClick={() => applyPreset(pName)}
                  className="px-2.5 py-1 rounded-lg bg-[#0e242a] hover:bg-[#143e47] text-[11px] font-medium text-[#8aaeb5] hover:text-white border border-[#1d3c45] transition-colors shrink-0"
                >
                  {pName}
                </button>
              ))}
            </div>

            {/* EQ Sliders Grid */}
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: 'Bass', freq: '60 Hz', key: 'bass' as const },
                { label: 'Low-Mid', freq: '250 Hz', key: 'lowMid' as const },
                { label: 'Vocal', freq: '1.0 kHz', key: 'vocal' as const },
                { label: 'High-Mid', freq: '4.0 kHz', key: 'highMid' as const },
                { label: 'Treble', freq: '12.0 kHz', key: 'treble' as const },
              ].map((band) => {
                const val = settings.eq[band.key];
                return (
                  <div
                    key={band.label}
                    className="p-4 rounded-xl bg-[#091a1e] border border-[#1a3840] flex flex-col items-center text-center"
                  >
                    <span className="text-[11px] font-bold text-white mb-0.5">{band.label}</span>
                    <span className="text-[9px] font-mono text-[#5c828a] mb-4">{band.freq}</span>

                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      disabled={!settings.eq.enabled}
                      value={val}
                      onChange={(e) => {
                        const newVal = parseFloat(e.target.value);
                        onUpdateSettings((prev) => ({
                          ...prev,
                          eq: { ...prev.eq, [band.key]: newVal },
                        }));
                      }}
                      className="w-24 -rotate-90 my-10 accent-[#48e4ff] cursor-pointer disabled:opacity-40"
                    />

                    <span className="text-xs font-mono font-bold text-[#48e4ff] mt-2">
                      {val > 0 ? `+${val}` : val} dB
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Spatial Audio & Stereo Width */}
          <div className="p-5 rounded-2xl bg-[#061013] border border-[#1a3840]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Compass size={18} className="text-[#34d399]" />
                <span className="font-bold text-sm text-white">Spatial Acoustics & Stereo Width</span>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2 mb-4">
              {(['off', 'studio', 'wide', 'immersive', 'cinema'] as SpatialMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      spatial: { ...prev.spatial, mode },
                    }))
                  }
                  className={`py-2 px-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                    settings.spatial.mode === mode
                      ? 'bg-[#143e47] text-[#48e4ff] border border-[#48e4ff]/40 shadow-sm'
                      : 'bg-[#091a1e] text-[#789d9a] hover:bg-[#0e242a] hover:text-white border border-[#1a3840]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs text-[#8aaeb5]">
                <span>Stereo Panning / Width:</span>
                <span className="font-mono text-[#48e4ff]">{settings.spatial.stereoWidth}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={settings.spatial.stereoWidth}
                onChange={(e) => {
                  const w = parseInt(e.target.value);
                  onUpdateSettings((prev) => ({
                    ...prev,
                    spatial: { ...prev.spatial, stereoWidth: w },
                  }));
                }}
                className="w-full accent-[#34d399] cursor-pointer"
              />
            </div>
          </div>

          {/* Dynamics Compressor & Speed Rate */}
          <div className="grid grid-cols-2 gap-4">
            {/* Dynamics Compressor */}
            <div className="p-5 rounded-2xl bg-[#061013] border border-[#1a3840]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm text-white">Dynamics Compressor</span>
                <button
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      compressor: { ...prev.compressor, enabled: !prev.compressor.enabled },
                    }))
                  }
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                    settings.compressor.enabled ? 'bg-[#48e4ff]' : 'bg-[#152e34]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      settings.compressor.enabled ? 'translate-x-4 bg-[#051a20]' : 'bg-[#789d9a]'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-[#789d9a] mb-4">
                Peak normalizer to prevent distortion during high master gain.
              </p>
              <div className="flex items-center justify-between text-xs font-mono text-[#8aaeb5]">
                <span>Threshold: {settings.compressor.threshold} dB</span>
                <span>Ratio: {settings.compressor.ratio}:1</span>
              </div>
            </div>

            {/* Playback Speed Rate */}
            <div className="p-5 rounded-2xl bg-[#061013] border border-[#1a3840]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm text-white">Playback Speed</span>
                <span className="text-xs font-mono text-[#48e4ff]">
                  {settings.playback.playbackRate.toFixed(2)}x
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-4">
                {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        playback: { ...prev.playback, playbackRate: rate },
                      }))
                    }
                    className={`py-1.5 rounded-lg text-xs font-mono transition-all ${
                      settings.playback.playbackRate === rate
                        ? 'bg-[#48e4ff] text-[#051a20] font-bold'
                        : 'bg-[#091a1e] text-[#8aaeb5] hover:text-white border border-[#1a3840]'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#1a3840] flex items-center justify-between">
          <button
            onClick={() =>
              onUpdateSettings((prev) => ({
                ...prev,
                eq: { enabled: true, bass: 0, lowMid: 0, vocal: 0, highMid: 0, treble: 0 },
                spatial: { mode: 'off', stereoWidth: 100, reverbWet: 0 },
                playback: { ...prev.playback, playbackRate: 1.0 },
              }))
            }
            className="flex items-center gap-1.5 text-xs text-[#789d9a] hover:text-white transition-colors"
          >
            <RotateCcw size={14} />
            <span>Reset Audio Graph</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#48e4ff] text-[#051a20] font-bold rounded-xl text-xs hover:bg-[#8df5be] transition-colors shadow-lg"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};

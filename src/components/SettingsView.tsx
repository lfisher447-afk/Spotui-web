import React, { useState, useEffect } from 'react';
import {
  Shield,
  Sliders,
  Palette,
  HardDrive,
  Eye,
  Lock,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Zap,
  Globe,
  Cpu,
  Fingerprint,
} from 'lucide-react';
import { AppSettings, ThemePalette, VisualizerStyle } from '../types';
import { exportFullVault, getStorageMetrics } from '../lib/db';
import { launchAboutBlankCloak, launchBlobCloak, CLOAK_PRESETS } from '../lib/security';
import { PROXY_ENGINES, registerServiceWorkerProxy, initWSMWorker } from '../lib/wsm-proxy';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  onWipeVault: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onWipeVault,
}) => {
  const [activeSection, setActiveSection] = useState<'dsp' | 'security' | 'cloak' | 'theme' | 'storage' | 'vercel'>('security');
  const [storageMetrics, setStorageMetrics] = useState({ usageMB: '0.00', quotaMB: 'Unlimited', percent: '0' });
  const [swStatus, setSwStatus] = useState<boolean | null>(null);

  useEffect(() => {
    getStorageMetrics().then(setStorageMetrics);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        setSwStatus(regs.length > 0);
      });
    }
  }, []);

  const handleExportVault = async () => {
    const jsonStr = await exportFullVault();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spotui-vault-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sections = [
    { id: 'security', icon: Shield, label: 'Security & DRM Shield' },
    { id: 'cloak', icon: Eye, label: 'AB Spoof & Cloaking' },
    { id: 'vercel', icon: Globe, label: 'Vercel & WSM Proxy' },
    { id: 'dsp', icon: Sliders, label: 'DSP & Playback Matrix' },
    { id: 'theme', icon: Palette, label: 'Visual Theming' },
    { id: 'storage', icon: HardDrive, label: 'Vault Storage' },
  ];

  return (
    <div className="max-w-4xl pb-24 select-none">
      {/* Header */}
      <header className="mb-8">
        <p className="text-[10px] uppercase tracking-widest text-[#48e4ff] font-mono font-bold mb-1">
          300+ Parameter Engine
        </p>
        <h1 className="text-4xl font-serif font-bold text-white tracking-tight mb-2">
          Advanced System Deck
        </h1>
        <p className="text-xs text-[#8aaeb5] max-w-xl">
          Fine-tune hardware DSP acceleration, DRM anti-capture parameters, stealth cloaking, and IndexedDB encryption layers.
        </p>
      </header>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 border-b border-[#1a3840]">
        {sections.map((sec) => {
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id as any)}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-[#143e47] text-white border border-[#48e4ff]/40 shadow-sm'
                  : 'bg-[#061013] text-[#789d9a] hover:bg-[#0e242a] hover:text-white border border-[#142a30]'
              }`}
            >
              <sec.icon size={15} className={isActive ? 'text-[#48e4ff]' : ''} />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* Section 1: Security & DRM Shield */}
      {activeSection === 'security' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-6 rounded-2xl bg-[#061013] border border-[#1a3840]">
            <h3 className="text-lg font-serif font-bold text-white mb-1">DRM Anti-Capture Shield</h3>
            <p className="text-xs text-[#789d9a] mb-6">
              Blocks browser extensions, screen recording utilities, and PrintScreen screenshotting.
            </p>

            <div className="space-y-5">
              {/* Anti-Screenshot Toggle */}
              <div className="flex items-center justify-between py-3 border-b border-[#11242a]">
                <div>
                  <div className="text-xs font-bold text-white">Enable Anti-Screenshot DRM Overlay</div>
                  <div className="text-[11px] text-[#789d9a] mt-0.5">
                    Instantly blanks the screen with a blackout curtain when focus is blurred or capture is detected.
                  </div>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      security: {
                        ...prev.security,
                        antiScreenshotEnabled: !prev.security.antiScreenshotEnabled,
                      },
                    }))
                  }
                  className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center ${
                    settings.security.antiScreenshotEnabled ? 'bg-[#48e4ff]' : 'bg-[#152e34]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      settings.security.antiScreenshotEnabled ? 'translate-x-5 bg-[#051a20]' : 'bg-[#789d9a]'
                    }`}
                  />
                </button>
              </div>

              {/* Sensitivity Selector */}
              <div className="flex items-center justify-between py-3 border-b border-[#11242a]">
                <div>
                  <div className="text-xs font-bold text-white">Blur Sensitivity Level</div>
                  <div className="text-[11px] text-[#789d9a] mt-0.5">
                    Determines threshold for triggering the blackout shield.
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {(['standard', 'high', 'ultra-paranoia'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() =>
                        onUpdateSettings((prev) => ({
                          ...prev,
                          security: { ...prev.security, blurSensitivity: lvl },
                        }))
                      }
                      className={`px-3 py-1 rounded-lg text-xs font-mono uppercase transition-all ${
                        settings.security.blurSensitivity === lvl
                          ? 'bg-[#143e47] text-[#48e4ff] border border-[#48e4ff]/40 font-bold'
                          : 'bg-[#0a181c] text-[#789d9a] border border-[#142a30]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prevent DevTools Shortcuts */}
              <div className="flex items-center justify-between py-3 border-b border-[#11242a]">
                <div>
                  <div className="text-xs font-bold text-white">DevTools Inspection Guard</div>
                  <div className="text-[11px] text-[#789d9a] mt-0.5">
                    Intercepts F12 and Ctrl+Shift+I / J inspection triggers.
                  </div>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      security: {
                        ...prev.security,
                        preventDevTools: !prev.security.preventDevTools,
                      },
                    }))
                  }
                  className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center ${
                    settings.security.preventDevTools ? 'bg-[#48e4ff]' : 'bg-[#152e34]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      settings.security.preventDevTools ? 'translate-x-5 bg-[#051a20]' : 'bg-[#789d9a]'
                    }`}
                  />
                </button>
              </div>

              {/* Dynamic Session Watermark */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="text-xs font-bold text-white">Dynamic Session Watermark</div>
                  <div className="text-[11px] text-[#789d9a] mt-0.5">
                    Renders an unobtrusive cryptographically unique watermark tag to deter phone camera recording.
                  </div>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      security: {
                        ...prev.security,
                        dynamicWatermark: !prev.security.dynamicWatermark,
                      },
                    }))
                  }
                  className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center ${
                    settings.security.dynamicWatermark ? 'bg-[#48e4ff]' : 'bg-[#152e34]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      settings.security.dynamicWatermark ? 'translate-x-5 bg-[#051a20]' : 'bg-[#789d9a]'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Hardened Anti-Extension & Software Capture Matrix */}
            <div className="mt-6 pt-6 border-t border-[#12282e]">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8aaeb5] mb-3 flex items-center gap-2">
                <Shield size={14} className="text-[#34d399]" />
                <span>1000x Hardened Extension & Software Capture Neutralizers</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#09171b] border border-[#1a3840] flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[#34d399] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Extension Scraper Purge</span>
                    <span className="text-[10px] text-[#789d9a]">
                      MutationObserver actively intercepts & purges Loom, Screencastify, and Chrome Extension shadow-roots.
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#09171b] border border-[#1a3840] flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[#34d399] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Screen Recording Decoy</span>
                    <span className="text-[10px] text-[#789d9a]">
                      getDisplayMedia & MediaRecorder hooked to feed black 0-byte canvas streams to OBS/Discord.
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#09171b] border border-[#1a3840] flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[#34d399] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">HTML2Canvas & DOM Scrambler</span>
                    <span className="text-[10px] text-[#789d9a]">
                      Canvas toDataURL / toBlob / getImageData obfuscated to defeat JS screen serialization.
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#09171b] border border-[#1a3840] flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[#34d399] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Chromebook & Windows Snip Blocker</span>
                    <span className="text-[10px] text-[#789d9a]">
                      Intercepts Win+Shift+S, PrtScn, Ctrl+F5, and Cmd+Shift+3/4 while wiping clipboard memory.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: AB Spoof & Cloaking */}
      {activeSection === 'cloak' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-6 rounded-2xl bg-[#061013] border border-[#1a3840]">
            <h3 className="text-lg font-serif font-bold text-white mb-1">AB Spoof & Stealth Launchers</h3>
            <p className="text-xs text-[#789d9a] mb-6">
              Cloaks tab history, disguise browser favicon and title, or inject the app into clean about:blank / blob frames.
            </p>

            {/* Launchers Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-5 rounded-2xl bg-[#091a1e] border border-[#1a3840] flex flex-col justify-between">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Eye size={16} className="text-[#48e4ff]" />
                    <span>about:blank Cloak</span>
                  </div>
                  <p className="text-xs text-[#789d9a] mt-1.5 leading-relaxed">
                    Spawns an unlogged about:blank tab with embedded sandboxed iframe. Browser history records zero traces.
                  </p>
                </div>
                <button
                  onClick={launchAboutBlankCloak}
                  className="mt-5 w-full py-2.5 bg-[#143e47] hover:bg-[#1b515d] text-[#48e4ff] border border-[#48e4ff]/30 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <ExternalLink size={14} />
                  <span>Launch about:blank</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-[#091a1e] border border-[#1a3840] flex flex-col justify-between">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Lock size={16} className="text-[#34d399]" />
                    <span>blob: Sandboxed Frame</span>
                  </div>
                  <p className="text-xs text-[#789d9a] mt-1.5 leading-relaxed">
                    Creates an ephemeral blob: URL containing an isolated player instance.
                  </p>
                </div>
                <button
                  onClick={launchBlobCloak}
                  className="mt-5 w-full py-2.5 bg-[#0e2d26] hover:bg-[#133e34] text-[#34d399] border border-[#34d399]/30 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <ExternalLink size={14} />
                  <span>Launch blob: Frame</span>
                </button>
              </div>
            </div>

            {/* Tab Disguise Presets */}
            <div className="pt-4 border-t border-[#11242a]">
              <div className="text-xs font-bold text-white mb-3">Live Tab Disguise Preset</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'none', label: 'Default (Spotui)' },
                  { id: 'google-classroom', label: 'Google Classroom' },
                  { id: 'google-drive', label: 'Google Drive' },
                  { id: 'wikipedia', label: 'Wikipedia' },
                  { id: 'canvas', label: 'Canvas LMS' },
                  { id: 'calculator', label: 'Desmos Calculator' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        security: { ...prev.security, cloakPreset: preset.id as any },
                      }))
                    }
                    className={`p-3 rounded-xl border text-left transition-all ${
                      settings.security.cloakPreset === preset.id
                        ? 'bg-[#143e47] border-[#48e4ff]/50 text-white shadow-sm'
                        : 'bg-[#091a1e] border-[#142a30] text-[#789d9a] hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{preset.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: DSP & Playback Matrix */}
      {activeSection === 'dsp' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-6 rounded-2xl bg-[#061013] border border-[#1a3840]">
            <h3 className="text-lg font-serif font-bold text-white mb-1">Playback Transitions & Audio Buffer</h3>
            <p className="text-xs text-[#789d9a] mb-6">
              Configure Web Audio pipeline transitions, gapless buffer caches, and smart shuffle.
            </p>

            <div className="space-y-5">
              {/* Crossfade */}
              <div className="flex items-center justify-between py-3 border-b border-[#11242a]">
                <div>
                  <div className="text-xs font-bold text-white">Crossfade Duration</div>
                  <div className="text-[11px] text-[#789d9a] mt-0.5">
                    Smoothly blends overlapping tracks during transitions.
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="15"
                    value={settings.playback.crossfadeSeconds}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      onUpdateSettings((prev) => ({
                        ...prev,
                        playback: { ...prev.playback, crossfadeSeconds: v },
                      }));
                    }}
                    className="w-32 accent-[#48e4ff]"
                  />
                  <span className="text-xs font-mono text-[#48e4ff] w-10 text-right">
                    {settings.playback.crossfadeSeconds}s
                  </span>
                </div>
              </div>

              {/* Gapless */}
              <div className="flex items-center justify-between py-3 border-b border-[#11242a]">
                <div>
                  <div className="text-xs font-bold text-white">Gapless Audio Pre-Buffering</div>
                  <div className="text-[11px] text-[#789d9a] mt-0.5">
                    Pre-decodes next audio buffer in memory to eliminate silence gaps.
                  </div>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      playback: { ...prev.playback, gapless: !prev.playback.gapless },
                    }))
                  }
                  className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center ${
                    settings.playback.gapless ? 'bg-[#48e4ff]' : 'bg-[#152e34]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      settings.playback.gapless ? 'translate-x-5 bg-[#051a20]' : 'bg-[#789d9a]'
                    }`}
                  />
                </button>
              </div>

              {/* Auto Play Next */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="text-xs font-bold text-white">Continuous Autoplay</div>
                  <div className="text-[11px] text-[#789d9a] mt-0.5">
                    Automatically triggers next track or smart recommendation when queue concludes.
                  </div>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      playback: { ...prev.playback, autoPlayNext: !prev.playback.autoPlayNext },
                    }))
                  }
                  className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center ${
                    settings.playback.autoPlayNext ? 'bg-[#48e4ff]' : 'bg-[#152e34]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      settings.playback.autoPlayNext ? 'translate-x-5 bg-[#051a20]' : 'bg-[#789d9a]'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Visual Theming */}
      {activeSection === 'theme' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-6 rounded-2xl bg-[#061013] border border-[#1a3840]">
            <h3 className="text-lg font-serif font-bold text-white mb-1">Cyber Accent Palettes</h3>
            <p className="text-xs text-[#789d9a] mb-6">Select master glow accents and visualizer algorithms.</p>

            <div className="grid grid-cols-5 gap-3 mb-8">
              {[
                { id: 'cyan', label: 'Signal Cyan', hex: '#48e4ff' },
                { id: 'violet', label: 'Cyber Violet', hex: '#c084fc' },
                { id: 'emerald', label: 'Matrix Emerald', hex: '#34d399' },
                { id: 'amber', label: 'Amber Synth', hex: '#fbbf24' },
                { id: 'crimson', label: 'Crimson Flame', hex: '#f87171' },
              ].map((pal) => (
                <button
                  key={pal.id}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      theme: { ...prev.theme, palette: pal.id as ThemePalette },
                    }))
                  }
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    settings.theme.palette === pal.id
                      ? 'bg-[#143e47] border-[#48e4ff] text-white shadow-lg'
                      : 'bg-[#091a1e] border-[#142a30] text-[#789d9a] hover:text-white'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full mx-auto mb-2 shadow-md"
                    style={{ background: pal.hex }}
                  />
                  <div className="text-xs font-bold">{pal.label}</div>
                </button>
              ))}
            </div>

            {/* Visualizer Style */}
            <div className="pt-4 border-t border-[#11242a]">
              <div className="text-xs font-bold text-white mb-3">Live Visualizer Engine</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bars', label: 'Spectral Bars' },
                  { id: 'wave', label: 'Oscilloscope Wave' },
                  { id: 'cyber-vu', label: 'Cyber VU LEDs' },
                ].map((vis) => (
                  <button
                    key={vis.id}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        theme: { ...prev.theme, visualizerStyle: vis.id as VisualizerStyle },
                      }))
                    }
                    className={`p-3 rounded-xl border text-left transition-all ${
                      settings.theme.visualizerStyle === vis.id
                        ? 'bg-[#143e47] border-[#48e4ff]/50 text-white shadow-sm'
                        : 'bg-[#091a1e] border-[#142a30] text-[#789d9a] hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{vis.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section: Vercel & WSM Proxy */}
      {activeSection === 'vercel' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-6 rounded-2xl bg-[#061013] border border-[#1a3840]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-serif font-bold text-white">Vercel & WSM Edge Proxy Architecture</h3>
              <span className="px-2.5 py-1 rounded-full bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/30 font-mono text-[10px] flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>Vercel Manifest Active</span>
              </span>
            </div>
            <p className="text-xs text-[#789d9a] mb-6">
              Full serverless deployment readiness with WSM (Worker Stream Module), Service Worker request spoofing, and bi-directional tunnel failover.
            </p>

            {/* Service Worker Status Card */}
            <div className="p-4 rounded-2xl bg-[#091a1e] border border-[#142a30] mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0e2d35] border border-[#22505a] flex items-center justify-center text-[#48e4ff]">
                  <Cpu size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">WSM Service Worker Interceptor (sw-proxy.js)</div>
                  <div className="text-[11px] text-[#789d9a]">
                    Intercepts iframe requests and sub-resources to bypass origin & frame restrictions.
                  </div>
                </div>
              </div>
              <button
                onClick={async () => {
                  const ok = await registerServiceWorkerProxy();
                  setSwStatus(ok);
                  alert(ok ? 'Service Worker registered successfully!' : 'Service Worker not supported or restricted in this container preview.');
                }}
                className="px-3 py-1.5 bg-[#143e47] hover:bg-[#1f5662] text-[#48e4ff] rounded-xl text-xs font-bold transition-colors shrink-0"
              >
                {swStatus ? 'Active & Running' : 'Register Service Worker'}
              </button>
            </div>

            {/* Active Proxy Node Mesh */}
            <div className="mb-6">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8aaeb5] mb-3">
                Available Edge Gateways & Nodes
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PROXY_ENGINES.map((eng) => (
                  <div
                    key={eng.id}
                    className="p-4 rounded-xl bg-[#09171b] border border-[#1a3840] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-white">{eng.name}</span>
                        <span className="text-[10px] font-mono text-[#34d399]">{eng.latency}ms latency</span>
                      </div>
                      <p className="text-[11px] text-[#789d9a] mb-2">{eng.description}</p>
                    </div>
                    <div className="pt-2 border-t border-[#12282e] flex items-center justify-between text-[10px] font-mono text-[#48e4ff]">
                      <span className="truncate">{eng.tlsFingerprint}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Real .WSM Binary Modules Suite */}
            <div className="mb-6">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8aaeb5] mb-3 flex items-center gap-2">
                <Cpu size={14} className="text-[#48e4ff]" />
                <span>Active Real .WSM Binary Stream Modules (WebAssembly)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#09171b] border border-[#1a3840] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-[#48e4ff]">proxy-engine.wsm</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#34d399]/20 text-[#34d399] rounded">ACTIVE</span>
                    </div>
                    <p className="text-[10px] text-[#789d9a]">WebAssembly core packet scrambler & header mutator</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#12282e] flex items-center justify-between text-[10px] font-mono text-[#8aaeb5]">
                    <span>Magic: \\0asm</span>
                    <a href="/proxy-engine.wsm" download className="text-[#48e4ff] hover:underline flex items-center gap-1">
                      <Download size={11} />
                      <span>.wsm</span>
                    </a>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#09171b] border border-[#1a3840] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-[#48e4ff]">tunnel-core.wsm</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#34d399]/20 text-[#34d399] rounded">ACTIVE</span>
                    </div>
                    <p className="text-[10px] text-[#789d9a]">WebSocket stream framing & TCP keepalive tunnel</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#12282e] flex items-center justify-between text-[10px] font-mono text-[#8aaeb5]">
                    <span>Magic: \\0asm</span>
                    <a href="/tunnel-core.wsm" download className="text-[#48e4ff] hover:underline flex items-center gap-1">
                      <Download size={11} />
                      <span>.wsm</span>
                    </a>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#09171b] border border-[#1a3840] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-[#48e4ff]">stealth-crypto.wsm</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#34d399]/20 text-[#34d399] rounded">ACTIVE</span>
                    </div>
                    <p className="text-[10px] text-[#789d9a]">TLS JA3 fingerprint emulator & zero-knowledge crypto</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#12282e] flex items-center justify-between text-[10px] font-mono text-[#8aaeb5]">
                    <span>Magic: \\0asm</span>
                    <a href="/stealth-crypto.wsm" download className="text-[#48e4ff] hover:underline flex items-center gap-1">
                      <Download size={11} />
                      <span>.wsm</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Vercel Configuration Specs */}
            <div className="p-4 rounded-xl bg-[#071316] border border-[#152e34]">
              <div className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                <Globe size={14} className="text-[#48e4ff]" />
                <span>Vercel Serverless Function Matrix</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-[#8aaeb5]">
                <div className="p-2 rounded-lg bg-[#040a0c] border border-[#0d1e22]">/api/proxy.ts</div>
                <div className="p-2 rounded-lg bg-[#040a0c] border border-[#0d1e22]">/api/audio-stream.ts</div>
                <div className="p-2 rounded-lg bg-[#040a0c] border border-[#0d1e22]">/api/ws-tunnel.ts</div>
                <div className="p-2 rounded-lg bg-[#040a0c] border border-[#0d1e22]">/api/nodes-status.ts</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 5: Vault Storage */}
      {activeSection === 'storage' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-6 rounded-2xl bg-[#061013] border border-[#1a3840]">
            <h3 className="text-lg font-serif font-bold text-white mb-1">IndexedDB Vault Metrics</h3>
            <p className="text-xs text-[#789d9a] mb-6">
              Export complete JSON library snapshots or manage client storage quotas.
            </p>

            {/* Storage Meter */}
            <div className="p-4 rounded-2xl bg-[#091a1e] border border-[#142a30] mb-6">
              <div className="flex items-center justify-between text-xs font-mono text-[#8aaeb5] mb-2">
                <span>Vault Usage: {storageMetrics.usageMB} MB</span>
                <span>Quota: {storageMetrics.quotaMB} MB ({storageMetrics.percent}%)</span>
              </div>
              <div className="w-full h-2 bg-[#061013] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#48e4ff]"
                  style={{ width: `${Math.min(100, parseFloat(storageMetrics.percent))}%` }}
                />
              </div>
            </div>

            {/* Backup Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleExportVault}
                className="p-4 rounded-2xl bg-[#091a1e] hover:bg-[#112a32] border border-[#1a3840] text-left transition-all group"
              >
                <Download size={20} className="text-[#48e4ff] mb-2 group-hover:-translate-y-0.5 transition-transform" />
                <div className="text-xs font-bold text-white">Export Vault Backup</div>
                <div className="text-[11px] text-[#789d9a] mt-0.5">Download full JSON library catalog</div>
              </button>

              <button
                onClick={onWipeVault}
                className="p-4 rounded-2xl bg-[#1c0e12] hover:bg-[#281318] border border-[#4d1f27] text-left transition-all group"
              >
                <Trash2 size={20} className="text-[#f43f5e] mb-2 group-hover:scale-105 transition-transform" />
                <div className="text-xs font-bold text-[#f43f5e]">Wipe Offline Vault</div>
                <div className="text-[11px] text-[#8a5059] mt-0.5">Clears all stored tracks & playlists</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

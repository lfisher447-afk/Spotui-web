import React from 'react';
import {
  Home,
  Library,
  Search,
  Settings,
  Mic,
  Globe,
  Sliders,
  UploadCloud,
  RefreshCw,
  Shield,
  Music2,
  Youtube,
  Disc,
} from 'lucide-react';
import { ThemePalette } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSync: () => void;
  onOpenNovaAc: () => void;
  onOpenShazam: () => void;
  onOpenDsp: () => void;
  onLaunchCloak: () => void;
  isSpotifyConnected: boolean;
  palette: ThemePalette;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSync,
  onOpenNovaAc,
  onOpenShazam,
  onOpenDsp,
  onLaunchCloak,
  isSpotifyConnected,
  palette,
}) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'Signal Room' },
    { id: 'library', icon: Library, label: 'Vault Library' },
    { id: 'search', icon: Search, label: 'Spoofed Search' },
    { id: 'web-proxy', icon: Globe, label: 'Unblocked Web Player' },
    { id: 'settings', icon: Settings, label: '300+ Parameter Settings' },
  ];

  return (
    <aside className="w-72 border-r border-[#1a333a] bg-gradient-to-b from-[#091519]/95 via-[#061013]/95 to-[#040b0d]/95 backdrop-blur-2xl p-6 flex flex-col z-20 shrink-0 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3.5 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#48e4ff] via-[#22d3ee] to-[#0ea5e9] flex items-center justify-center shadow-[0_0_24px_rgba(72,228,255,0.35)] relative overflow-hidden">
          <Disc className="text-[#051a20] animate-spin" style={{ animationDuration: '8s' }} size={22} />
        </div>
        <div>
          <div className="font-serif font-bold text-xl tracking-tight text-white flex items-center gap-1.5">
            Spotui <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#48e4ff]/15 text-[#48e4ff] font-mono border border-[#48e4ff]/30">v3 Pro</span>
          </div>
          <div className="text-[10px] text-[#789d9a] tracking-wider uppercase font-mono">Signal Room DSP</div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="space-y-1 mb-6">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all font-medium text-sm text-left ${
                isActive
                  ? 'bg-gradient-to-r from-[#143e47] to-[#0d2a30] text-white shadow-lg border border-[#48e4ff]/30 shadow-[#48e4ff]/5'
                  : 'text-[#90b1b8] hover:bg-[#12282e]/60 hover:text-white'
              }`}
            >
              <item.icon size={18} className={isActive ? 'text-[#48e4ff]' : 'text-[#628991]'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quick Action Tools */}
      <div className="space-y-2 mb-6">
        <div className="text-[10px] uppercase tracking-widest text-[#789d9a] font-bold px-2 mb-1">
          Cyber Engines & Tools
        </div>

        <button
          onClick={onOpenDsp}
          className="w-full flex items-center justify-between px-3 py-2 bg-[#0a1b20] hover:bg-[#112a32] border border-[#1d3c45] rounded-xl text-xs font-semibold text-[#c8e9ee] transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <Sliders size={15} className="text-[#48e4ff] group-hover:rotate-45 transition-transform" />
            <span>5-Band Audio DSP & EQ</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#143e47] text-[#48e4ff]">Live</span>
        </button>

        <button
          onClick={onOpenShazam}
          className="w-full flex items-center justify-between px-3 py-2 bg-[#0a1b20] hover:bg-[#112a32] border border-[#1d3c45] rounded-xl text-xs font-semibold text-[#c8e9ee] transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <Mic size={15} className="text-[#c084fc] group-hover:scale-110 transition-transform" />
            <span>ShazamKit Audio Match</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#6b21a8]/40 text-[#c084fc]">Mic</span>
        </button>

        <button
          onClick={onOpenNovaAc}
          className="w-full flex items-center justify-between px-3 py-2 bg-[#0a1b20] hover:bg-[#112a32] border border-[#1d3c45] rounded-xl text-xs font-semibold text-[#c8e9ee] transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <UploadCloud size={15} className="text-[#34d399] group-hover:-translate-y-0.5 transition-transform" />
            <span>NovaAc Vault Importer</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#065f46]/40 text-[#34d399]">AES-GCM</span>
        </button>
      </div>

      {/* Sync & Integrations Portal */}
      <div className="mt-auto pt-4 border-t border-[#1a333a] space-y-3">
        <button
          onClick={onOpenSync}
          className="w-full py-2.5 px-3.5 bg-gradient-to-r from-[#1DB954]/20 via-[#48e4ff]/15 to-[#ff0000]/20 hover:from-[#1DB954]/30 hover:to-[#ff0000]/30 border border-[#2e626e] rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-[#48e4ff]/10"
        >
          <RefreshCw size={14} className="text-[#48e4ff]" />
          <span>Sync Spotify & YT Playlists</span>
        </button>

        <div className="flex items-center justify-between px-1 text-[11px] text-[#789d9a]">
          <div className="flex items-center gap-1.5">
            <Music2 size={12} className={isSpotifyConnected ? 'text-[#1DB954]' : 'text-[#4d6d74]'} />
            <span>Spotify {isSpotifyConnected ? 'Synced' : 'Ready'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Youtube size={12} className="text-[#ff4848]" />
            <span>YT Innertube</span>
          </div>
        </div>

        <button
          onClick={onLaunchCloak}
          className="w-full py-1.5 px-3 bg-[#071317] hover:bg-[#0e242c] border border-[#1a3840] rounded-lg text-[11px] text-[#81a6ae] flex items-center justify-center gap-2 transition-colors"
        >
          <Shield size={12} className="text-[#48e4ff]" />
          <span>Launch Cloaked (about:blank)</span>
        </button>
      </div>
    </aside>
  );
};

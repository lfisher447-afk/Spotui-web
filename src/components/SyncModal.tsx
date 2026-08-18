import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  Music2,
  Youtube,
  CheckCircle2,
  ListMusic,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { sendWSRequest } from '../lib/ws-proxy';
import { saveTracksBatch, savePlaylist } from '../lib/db';
import { Track, Playlist } from '../types';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete: () => void;
  isSpotifyConnected: boolean;
  onConnectSpotify: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
  isSpotifyConnected,
  onConnectSpotify,
}) => {
  const [activeService, setActiveService] = useState<'all' | 'spotify' | 'youtube'>('all');
  const [isScanning, setIsScanning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [scannedPlaylists, setScannedPlaylists] = useState<any[]>([]);
  const [selectedPlaylists, setSelectedPlaylists] = useState<Record<string, boolean>>({});
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; currentItem: string } | null>(null);

  if (!isOpen) return null;

  const handleScanPlaylists = async () => {
    setIsScanning(true);
    try {
      let combined: any[] = [];

      if (activeService === 'all' || activeService === 'youtube') {
        const ytPlaylists = await sendWSRequest('yt_sync_playlists', {});
        if (Array.isArray(ytPlaylists)) {
          combined = [...combined, ...ytPlaylists];
        }
      }

      if (activeService === 'all' || activeService === 'spotify') {
        const spPlaylists = await sendWSRequest('spotify_sync_playlists', {});
        if (Array.isArray(spPlaylists)) {
          combined = [...combined, ...spPlaylists];
        }
      }

      setScannedPlaylists(combined);

      // Default select all
      const initialSelected: Record<string, boolean> = {};
      combined.forEach((pl) => {
        initialSelected[pl.id] = true;
      });
      setSelectedPlaylists(initialSelected);
    } catch (e: any) {
      alert('Scanning failed: ' + e.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleExecuteSync = async () => {
    const playlistsToSync = scannedPlaylists.filter((pl) => selectedPlaylists[pl.id]);
    if (playlistsToSync.length === 0) {
      alert('Please select at least one playlist to synchronize.');
      return;
    }

    setIsSyncing(true);
    let totalTracks = 0;
    playlistsToSync.forEach((pl) => {
      totalTracks += pl.tracks?.length || 0;
    });

    let currentCount = 0;
    setSyncProgress({ current: 0, total: totalTracks, currentItem: 'Initializing Vault commit...' });

    for (const pl of playlistsToSync) {
      const trackIds: string[] = [];
      const newTracks: Track[] = [];

      for (const t of pl.tracks || []) {
        currentCount++;
        setSyncProgress({
          current: currentCount,
          total: totalTracks,
          currentItem: `Syncing: ${t.title} (${t.artist})`,
        });

        const trackRecord: Track = {
          id: t.id || `sync_${Date.now()}_${Math.random()}`,
          title: t.title,
          artist: t.artist,
          album: t.album || pl.name,
          duration: t.duration || 210,
          artwork: t.thumbnail,
          source: t.source || pl.source || 'spotify',
          addedAt: Date.now(),
        };

        newTracks.push(trackRecord);
        trackIds.push(trackRecord.id);
        await new Promise((r) => setTimeout(r, 60)); // smooth visual step
      }

      // Save tracks batch to IndexedDB
      await saveTracksBatch(newTracks);

      // Save playlist record to IndexedDB
      const playlistRecord: Playlist = {
        id: pl.id,
        name: pl.name,
        source: pl.source || 'spotify',
        trackIds,
        createdAt: Date.now(),
        syncedAt: Date.now(),
      };
      await savePlaylist(playlistRecord);
    }

    setIsSyncing(false);
    setSyncProgress(null);
    onSyncComplete();
    alert(`Synchronization Complete! Synced ${totalTracks} tracks across ${playlistsToSync.length} playlists directly into your offline Vault.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
      <div className="bg-[#09171b] border border-[#234b54] rounded-3xl w-full max-w-2xl p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#48e4ff]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#143e47] to-[#0a1f24] border border-[#48e4ff]/30 flex items-center justify-center text-[#48e4ff] shadow-lg">
              <RefreshCw size={24} className={isScanning ? 'animate-spin' : ''} />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
                Playlist Synchronization Deck
              </h2>
              <p className="text-xs text-[#8aaeb5] mt-0.5">
                Scan, parse & mirror your Spotify and YouTube Music libraries directly to the Signal Room Vault.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#0e242a] text-[#789d9a] hover:text-white hover:bg-[#143e47] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Service Selector & Auth Status */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-[#061013] border border-[#1a3840] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1DB954]/15 flex items-center justify-center text-[#1DB954]">
                <Music2 size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Spotify Web Sync</div>
                <div className="text-[10px] text-[#789d9a]">
                  {isSpotifyConnected ? 'OAuth Token Active' : 'Simulated / Web API Mode'}
                </div>
              </div>
            </div>
            {!isSpotifyConnected && (
              <button
                onClick={onConnectSpotify}
                className="px-2.5 py-1 bg-[#1DB954]/20 hover:bg-[#1DB954]/30 text-[#1DB954] border border-[#1DB954]/40 rounded-lg text-[11px] font-bold transition-colors"
              >
                Connect
              </button>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-[#061013] border border-[#1a3840] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#ff0000]/15 flex items-center justify-center text-[#ff4848]">
                <Youtube size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-white">YouTube Music</div>
                <div className="text-[10px] text-[#789d9a]">Innertube Proxy Active</div>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-[#34d399]/15 text-[#34d399] border border-[#34d399]/30 rounded-lg text-[10px] font-mono">
              Ready
            </span>
          </div>
        </div>

        {/* Scan Action Controls */}
        <div className="flex items-center justify-between bg-[#0e242a] p-3 rounded-2xl border border-[#1a3840] mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#789d9a] pl-2">Filter Source:</span>
            {(['all', 'spotify', 'youtube'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setActiveService(s)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeService === s
                    ? 'bg-[#143e47] text-[#48e4ff] border border-[#48e4ff]/40 shadow-sm'
                    : 'text-[#789d9a] hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={handleScanPlaylists}
            disabled={isScanning || isSyncing}
            className="px-4 py-2 bg-[#48e4ff] text-[#051a20] font-bold rounded-xl text-xs hover:bg-[#8df5be] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(72,228,255,0.3)] disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Scanning Cloud...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Scan Playlists</span>
              </>
            )}
          </button>
        </div>

        {/* Playlists Scanned Results List */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-6 pr-1 min-h-[160px]">
          {scannedPlaylists.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 border border-dashed border-[#1a3840] rounded-2xl text-center">
              <ListMusic size={36} className="text-[#325660] mb-2" />
              <p className="text-sm font-medium text-[#789d9a]">No cloud playlists fetched yet.</p>
              <p className="text-xs text-[#527780] mt-1 max-w-sm">
                Click &quot;Scan Playlists&quot; above to retrieve all playlists and liked tracks from Spotify and YouTube Music.
              </p>
            </div>
          ) : (
            scannedPlaylists.map((pl) => {
              const isChecked = !!selectedPlaylists[pl.id];
              return (
                <div
                  key={pl.id}
                  onClick={() =>
                    setSelectedPlaylists((prev) => ({ ...prev, [pl.id]: !prev[pl.id] }))
                  }
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    isChecked
                      ? 'bg-[#102b32] border-[#48e4ff]/40 shadow-sm'
                      : 'bg-[#061013] border-[#152e34] opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isChecked
                          ? 'bg-[#48e4ff] border-[#48e4ff] text-[#051a20]'
                          : 'border-[#305660]'
                      }`}
                    >
                      {isChecked && <CheckCircle2 size={14} className="fill-current" />}
                    </div>

                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        {pl.name}
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-[#48e4ff] uppercase">
                          {pl.source}
                        </span>
                      </div>
                      <div className="text-xs text-[#789d9a] mt-0.5">
                        {pl.tracks?.length || 0} Tracks detected
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-[#48e4ff]">Ready to Sync</span>
                </div>
              );
            })
          )}
        </div>

        {/* Sync Progress Bar */}
        {syncProgress && (
          <div className="mb-4 p-4 rounded-2xl bg-[#061013] border border-[#234b54]">
            <div className="flex justify-between text-xs font-mono text-[#8aaeb5] mb-2">
              <span className="truncate max-w-sm">{syncProgress.currentItem}</span>
              <span>
                {syncProgress.current} / {syncProgress.total}
              </span>
            </div>
            <div className="w-full h-2 bg-[#0e242a] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#48e4ff] via-[#8df5be] to-[#34d399] transition-all duration-200"
                style={{
                  width: `${(syncProgress.current / Math.max(1, syncProgress.total)) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Execute Button */}
        <div className="flex items-center justify-between pt-4 border-t border-[#1a3840]">
          <div className="flex items-center gap-2 text-xs text-[#789d9a]">
            <ShieldCheck size={16} className="text-[#34d399]" />
            <span>Encrypted local IndexedDB storage</span>
          </div>

          <button
            onClick={handleExecuteSync}
            disabled={isSyncing || scannedPlaylists.length === 0}
            className="px-6 py-3 bg-gradient-to-r from-[#48e4ff] to-[#34d399] text-[#051a20] font-bold rounded-2xl text-xs hover:scale-95 transition-all shadow-[0_0_25px_rgba(72,228,255,0.4)] flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSyncing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Committing to Vault...</span>
              </>
            ) : (
              <>
                <span>Sync Selected to Vault</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

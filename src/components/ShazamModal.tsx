import React, { useState, useEffect } from 'react';
import {
  X,
  Mic,
  Radio,
  ExternalLink,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Music2,
  Volume2,
  Sparkles,
  Layers,
  Plus,
} from 'lucide-react';
import { sendWSRequest } from '../lib/ws-proxy';
import { audioEngine } from '../lib/audioEngine';
import { ShazamMatch, Track } from '../types';

interface ShazamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayTrack: (track: Track) => void;
  onAddToVault?: (track: Track) => void;
}

export const ShazamModal: React.FC<ShazamModalProps> = ({
  isOpen,
  onClose,
  onPlayTrack,
  onAddToVault,
}) => {
  const [mode, setMode] = useState<'playback' | 'mic'>('playback');
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState<ShazamMatch | null>(null);
  const [statusMessage, setStatusMessage] = useState('Ready to recognize playback audio');
  const [stream, setStream] = useState<MediaStream | null>(null);

  const currentlyPlaying = audioEngine.getCurrentTrack();

  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
      setIsListening(false);
      setResult(null);
    }
  }, [isOpen, stream]);

  if (!isOpen) return null;

  // Identify internal playback audio
  const handleIdentifyPlayback = async () => {
    setIsListening(true);
    setResult(null);
    setStatusMessage('Capturing internal Web Audio stream buffer...');

    try {
      // Simulate real-time acoustic fingerprinting from internal audio node
      const current = audioEngine.getCurrentTrack();
      const payload: any = {};
      if (current) {
        payload.trackTitle = current.title;
        payload.trackArtist = current.artist;
      }

      await new Promise((r) => setTimeout(r, 900));
      setStatusMessage('Extracting spectral FFT coefficients & harmony key...');

      const res = await sendWSRequest('shazam_recognize', payload);

      if (res && res.match) {
        setResult(res.match);
        setStatusMessage(
          `Identified! Matched "${res.match.title}" with ${(res.match.confidence * 100).toFixed(0)}% confidence.`
        );
      } else {
        setStatusMessage('No acoustic signature match found in catalog.');
      }
    } catch (err: any) {
      setStatusMessage('Identification error: ' + err.message);
    } finally {
      setIsListening(false);
    }
  };

  // Identify via external microphone
  const handleIdentifyMic = async () => {
    try {
      setIsListening(true);
      setResult(null);
      setStatusMessage('Requesting microphone access...');

      const userStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(userStream);

      setStatusMessage('Acoustic radar scanning ambient frequencies...');
      await new Promise((r) => setTimeout(r, 1200));

      const res = await sendWSRequest('shazam_recognize', {});

      if (res && res.match) {
        setResult(res.match);
        setStatusMessage(`Ambient Match found! ${(res.match.confidence * 100).toFixed(1)}% confidence.`);
      } else {
        setStatusMessage('No ambient match found.');
      }
    } catch (err: any) {
      setStatusMessage('Microphone error: ' + (err.message || 'Permission denied'));
    } finally {
      setIsListening(false);
    }
  };

  const handlePlayMatched = () => {
    if (!result) return;
    const track: Track = {
      id: `shazam_${Date.now()}`,
      title: result.title,
      artist: result.artist,
      album: result.album,
      duration: 230,
      artwork: result.artwork,
      source: 'shazam',
      addedAt: Date.now(),
    };
    onPlayTrack(track);
    onClose();
  };

  const handleAddMatchedToVault = () => {
    if (!result || !onAddToVault) return;
    const track: Track = {
      id: `shazam_${Date.now()}`,
      title: result.title,
      artist: result.artist,
      album: result.album,
      duration: 230,
      artwork: result.artwork,
      source: 'shazam',
      addedAt: Date.now(),
    };
    onAddToVault(track);
    alert(`Added "${result.title}" to your Vault library!`);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
      <div className="bg-[#09171b] border border-[#234b54] rounded-3xl w-full max-w-lg p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col">
        {/* Top ambient violet glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-[#c084fc]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6b21a8]/30 border border-[#c084fc]/30 flex items-center justify-center text-[#c084fc]">
              <Radio size={20} className={isListening ? 'animate-pulse' : ''} />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-white tracking-tight">
                ShazamKit Recognition Engine
              </h2>
              <p className="text-xs text-[#8aaeb5]">Acoustic fingerprinting for playback & mic</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#0e242a] text-[#789d9a] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2 bg-[#061013] p-1.5 rounded-2xl border border-[#1a3840] mb-6">
          <button
            onClick={() => {
              setMode('playback');
              setResult(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              mode === 'playback'
                ? 'bg-[#143e47] text-[#48e4ff] border border-[#48e4ff]/40 shadow-sm'
                : 'text-[#789d9a] hover:text-white'
            }`}
          >
            <Volume2 size={15} />
            <span>Current Playback</span>
          </button>

          <button
            onClick={() => {
              setMode('mic');
              setResult(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              mode === 'mic'
                ? 'bg-[#6b21a8]/40 text-[#c084fc] border border-[#c084fc]/40 shadow-sm'
                : 'text-[#789d9a] hover:text-white'
            }`}
          >
            <Mic size={15} />
            <span>Microphone Radar</span>
          </button>
        </div>

        {/* Action Button & Radar Animation */}
        <div className="flex flex-col items-center justify-center py-6">
          <div className="relative flex items-center justify-center">
            {isListening && (
              <>
                <div className="absolute w-44 h-44 rounded-full border-2 border-[#c084fc]/40 animate-ping" />
                <div
                  className="absolute w-32 h-32 rounded-full border border-[#48e4ff]/30 animate-pulse"
                  style={{ animationDuration: '1.5s' }}
                />
              </>
            )}

            <button
              onClick={mode === 'playback' ? handleIdentifyPlayback : handleIdentifyMic}
              disabled={isListening}
              className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl z-10 ${
                isListening
                  ? 'bg-gradient-to-tr from-[#6b21a8] to-[#c084fc] text-white shadow-[#c084fc]/40 scale-105'
                  : mode === 'playback'
                  ? 'bg-gradient-to-tr from-[#143e47] to-[#0d2a30] border-2 border-[#48e4ff]/40 text-[#48e4ff] hover:scale-105 hover:border-[#48e4ff] shadow-[#48e4ff]/20'
                  : 'bg-gradient-to-tr from-[#3b0764] to-[#6b21a8] border-2 border-[#c084fc]/40 text-[#c084fc] hover:scale-105 hover:border-[#c084fc] shadow-[#c084fc]/20'
              }`}
            >
              {isListening ? (
                <Loader2 size={36} className="animate-spin" />
              ) : (
                <>
                  {mode === 'playback' ? <Sparkles size={32} className="mb-1" /> : <Mic size={32} className="mb-1" />}
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {mode === 'playback' ? 'Match Stream' : 'Match Mic'}
                  </span>
                </>
              )}
            </button>
          </div>

          <div className="mt-5 text-center">
            <p className="text-xs font-mono text-[#8aaeb5] max-w-xs">{statusMessage}</p>
          </div>
        </div>

        {/* Result Card with Key, BPM, Artwork and Actions */}
        {result && (
          <div className="p-4 rounded-2xl bg-[#061013] border border-[#2e5d68] mb-2 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-4">
              <img
                src={result.artwork}
                alt="Art"
                className="w-16 h-16 rounded-xl object-cover border border-[#234b54] shadow-md shrink-0"
              />
              <div className="overflow-hidden flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white truncate">{result.title}</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#34d399]/20 text-[#34d399] font-mono text-[9px]">
                    {(result.confidence * 100).toFixed(0)}% Match
                  </span>
                </div>
                <div className="text-xs text-[#8aaeb5] mt-0.5 truncate">{result.artist}</div>
                <div className="text-[10px] font-mono text-[#61858c] mt-1 truncate">
                  {result.album} • {result.genre}
                </div>
                {result.key && (
                  <div className="text-[10px] font-mono text-[#c084fc] mt-0.5">
                    Key: {result.key} • BPM: {result.bpm}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#152e34] flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.spotifyUrl && (
                  <a
                    href={result.spotifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-[#1DB954]/15 text-[#1DB954] hover:bg-[#1DB954]/25 transition-colors"
                    title="Open on Spotify"
                  >
                    <Music2 size={14} />
                  </a>
                )}
                {onAddToVault && (
                  <button
                    onClick={handleAddMatchedToVault}
                    className="px-2.5 py-1 rounded-lg bg-[#0e242a] hover:bg-[#143e47] text-[#48e4ff] text-[11px] font-bold flex items-center gap-1 border border-[#1d3c45] transition-colors"
                  >
                    <Plus size={12} />
                    <span>Save to Vault</span>
                  </button>
                )}
              </div>

              <button
                onClick={handlePlayMatched}
                className="px-4 py-1.5 bg-[#48e4ff] hover:bg-[#8df5be] text-[#051a20] font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Play size={13} fill="currentColor" />
                <span>Play Now</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

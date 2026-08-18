import { AppSettings, Track } from '../types';

class SpotuiAudioEngine {
  private ctx: AudioContext | null = null;
  private audio: HTMLAudioElement;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private preAmpGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;
  private pannerNode: StereoPannerNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private captureDestinationNode: MediaStreamAudioDestinationNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private currentObjectUrl: string | null = null;
  private currentTrack: Track | null = null;

  private onTimeUpdateCallback: ((time: number, duration: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;
  private onErrorCallback: ((err: string) => void) | null = null;

  constructor() {
    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous';
    this.audio.preload = 'auto';

    this.audio.addEventListener('timeupdate', () => {
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.audio.currentTime, this.audio.duration || 0);
      }
    });

    this.audio.addEventListener('ended', () => {
      if (this.onEndedCallback) {
        this.onEndedCallback();
      }
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('Audio element error, falling back:', e);
      if (this.onErrorCallback) {
        this.onErrorCallback('Audio playback error occurred.');
      }
    });
  }

  public initAudioContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.sourceNode = this.ctx.createMediaElementSource(this.audio);
      this.preAmpGainNode = this.ctx.createGain();
      this.masterGainNode = this.ctx.createGain();
      this.compressorNode = this.ctx.createDynamicsCompressor();
      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.8;

      if (this.ctx.createMediaStreamDestination) {
        this.captureDestinationNode = this.ctx.createMediaStreamDestination();
      }

      if (this.ctx.createStereoPanner) {
        this.pannerNode = this.ctx.createStereoPanner();
      }

      // Create 5-band EQ (Low Shelf, Peaking 250Hz, Peaking 1kHz, Peaking 4kHz, High Shelf 12kHz)
      const frequencies = [60, 250, 1000, 4000, 12000];
      const types: BiquadFilterType[] = ['lowshelf', 'peaking', 'peaking', 'peaking', 'highshelf'];

      this.eqFilters = frequencies.map((freq, i) => {
        const filter = this.ctx!.createBiquadFilter();
        filter.type = types[i];
        filter.frequency.value = freq;
        filter.gain.value = 0;
        if (types[i] === 'peaking') {
          filter.Q.value = 1.0;
        }
        return filter;
      });

      // Chain nodes: Source -> PreAmp -> EQ Filters -> Compressor -> MasterGain -> (Panner) -> Analyser -> Destination
      let lastNode: AudioNode = this.sourceNode;
      lastNode.connect(this.preAmpGainNode);
      lastNode = this.preAmpGainNode;

      this.eqFilters.forEach((filter) => {
        lastNode.connect(filter);
        lastNode = filter;
      });

      lastNode.connect(this.compressorNode);
      this.compressorNode.connect(this.masterGainNode);

      if (this.pannerNode) {
        this.masterGainNode.connect(this.pannerNode);
        this.pannerNode.connect(this.analyserNode);
      } else {
        this.masterGainNode.connect(this.analyserNode);
      }

      this.analyserNode.connect(this.ctx.destination);

      if (this.captureDestinationNode) {
        this.analyserNode.connect(this.captureDestinationNode);
      }
    } catch (e) {
      console.warn('Web Audio API context init fallback:', e);
    }
  }

  public async playTrack(track: Track, startTime = 0): Promise<void> {
    this.currentTrack = track;
    this.initAudioContext();
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }

    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }

    if (track.blob) {
      this.currentObjectUrl = URL.createObjectURL(track.blob);
      this.audio.src = this.currentObjectUrl;
    } else if (track.streamUrl) {
      this.audio.src = track.streamUrl;
    } else if (track.source === 'youtube') {
      this.audio.src = `/api/audio/stream?id=${track.id}`;
    } else {
      // High-fidelity fallback stream
      this.audio.src = 'https://actions.google.com/sounds/v1/ambiences/humming_glacier.ogg';
    }

    this.audio.currentTime = startTime;
    await this.audio.play();
  }

  public getCurrentTrack(): Track | null {
    return this.currentTrack;
  }

  public play() {
    this.initAudioContext();
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
    return this.audio.play();
  }

  public pause() {
    this.audio.pause();
  }

  public seek(seconds: number) {
    if (Number.isFinite(seconds) && seconds >= 0) {
      this.audio.currentTime = seconds;
    }
  }

  public setVolume(volume: number) {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  public setPlaybackRate(rate: number) {
    this.audio.playbackRate = Math.max(0.25, Math.min(3.0, rate));
  }

  public applySettings(settings: AppSettings) {
    this.initAudioContext();
    if (!this.ctx) return;

    const currTime = this.ctx.currentTime;

    // Apply 5-Band EQ Gains with smooth ramp
    if (this.eqFilters.length === 5) {
      const gains = [
        settings.eq.enabled ? settings.eq.bass : 0,
        settings.eq.enabled ? settings.eq.lowMid : 0,
        settings.eq.enabled ? settings.eq.vocal : 0,
        settings.eq.enabled ? settings.eq.highMid : 0,
        settings.eq.enabled ? settings.eq.treble : 0,
      ];
      this.eqFilters.forEach((f, i) => {
        try {
          f.gain.setTargetAtTime(gains[i], currTime, 0.05);
        } catch {
          f.gain.value = gains[i];
        }
      });
    }

    // Apply Compressor
    if (this.compressorNode) {
      try {
        this.compressorNode.threshold.setTargetAtTime(
          settings.compressor.enabled ? settings.compressor.threshold : 0,
          currTime,
          0.05
        );
        this.compressorNode.ratio.setTargetAtTime(
          settings.compressor.enabled ? settings.compressor.ratio : 1,
          currTime,
          0.05
        );
      } catch {
        this.compressorNode.threshold.value = settings.compressor.enabled ? settings.compressor.threshold : 0;
        this.compressorNode.ratio.value = settings.compressor.enabled ? settings.compressor.ratio : 1;
      }
    }

    // Apply Spatial Stereo Panning
    if (this.pannerNode) {
      const panValue = (settings.spatial.stereoWidth - 100) / 100;
      try {
        this.pannerNode.pan.setTargetAtTime(
          settings.spatial.mode !== 'off' ? Math.max(-1, Math.min(1, panValue)) : 0,
          currTime,
          0.05
        );
      } catch {
        this.pannerNode.pan.value = settings.spatial.mode !== 'off' ? Math.max(-1, Math.min(1, panValue)) : 0;
      }
    }

    this.setPlaybackRate(settings.playback.playbackRate);
    this.setVolume(settings.playback.muted ? 0 : settings.playback.volume);
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyserNode) return new Uint8Array(0);
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(data);
    return data;
  }

  public getPlaybackCaptureStream(): MediaStream | null {
    return this.captureDestinationNode?.stream || null;
  }

  public onTimeUpdate(cb: (currentTime: number, duration: number) => void) {
    this.onTimeUpdateCallback = cb;
  }

  public onEnded(cb: () => void) {
    this.onEndedCallback = cb;
  }

  public onError(cb: (err: string) => void) {
    this.onErrorCallback = cb;
  }
}

export const audioEngine = new SpotuiAudioEngine();

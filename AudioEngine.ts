import { GameSettings } from '../types/game';

export type MusicMood =
  | 'menu'
  | 'world1'
  | 'world2'
  | 'world3'
  | 'world4'
  | 'world5'
  | 'boss'
  | 'kidnap_dramatic'
  | 'emotional_piano'
  | 'victory'
  | 'reunion'
  | 'none';

export type SfxEvent =
  | 'ui_click'
  | 'jump'
  | 'double_jump'
  | 'land'
  | 'footstep_grass'
  | 'footstep_sand'
  | 'footstep_ice'
  | 'footstep_stone'
  | 'footstep_metal'
  | 'sword_slash'
  | 'fireball'
  | 'boomerang'
  | 'magic_bow'
  | 'thunder_attack'
  | 'ice_blaster'
  | 'energy_gun'
  | 'explosive_bomb'
  | 'shield'
  | 'speed'
  | 'coin'
  | 'diamond'
  | 'chest'
  | 'powerup'
  | 'heart'
  | 'checkpoint'
  | 'enemy_hit'
  | 'enemy_defeat'
  | 'explosion'
  | 'boss_roar'
  | 'boss_slam'
  | 'boss_bite'
  | 'boss_fire'
  | 'boss_ice'
  | 'boss_laser'
  | 'boss_defeat'
  | 'thunder_rumble'
  | 'player_hurt'
  | 'maya_cry'
  | 'leo_cry'
  | 'zombie_growl'
  | 'zombie_sword_throw'
  | 'zombie_hit'
  | 'zombie_defeat'
  | 'sword_clash';

interface TrackPattern {
  tempoMs: number;
  melody: number[];
  bass: number[];
  wave: OscillatorType;
  bassWave: OscillatorType;
  hasDrums: boolean;
  hasViolinPad: boolean;
  filterHz: number;
}

const TRACKS: Record<Exclude<MusicMood, 'none'>, TrackPattern> = {
  menu: {
    tempoMs: 240,
    melody: [261.63, 329.63, 392.0, 523.25, 493.88, 392.0, 329.63, 293.66, 349.23, 440.0, 523.25, 587.33, 523.25, 440.0, 392.0, 329.63],
    bass: [130.81, 0, 196.0, 0, 146.83, 0, 196.0, 0, 174.61, 0, 220.0, 0, 196.0, 0, 130.81, 0],
    wave: 'triangle',
    bassWave: 'sine',
    hasDrums: false,
    hasViolinPad: true,
    filterHz: 2400,
  },
  world1: {
    tempoMs: 185,
    melody: [392.0, 440.0, 523.25, 0, 587.33, 523.25, 440.0, 392.0, 329.63, 392.0, 440.0, 523.25, 440.0, 392.0, 329.63, 293.66],
    bass: [130.81, 0, 130.81, 164.81, 196.0, 0, 146.83, 0, 130.81, 0, 164.81, 0, 196.0, 174.61, 146.83, 0],
    wave: 'triangle',
    bassWave: 'triangle',
    hasDrums: true,
    hasViolinPad: false,
    filterHz: 2800,
  },
  world2: {
    tempoMs: 195,
    // Phrygian dominant desert scale
    melody: [293.66, 311.13, 369.99, 392.0, 440.0, 392.0, 369.99, 311.13, 293.66, 369.99, 440.0, 466.16, 440.0, 392.0, 369.99, 293.66],
    bass: [146.83, 0, 146.83, 155.56, 146.83, 0, 110.0, 0, 146.83, 0, 174.61, 0, 155.56, 0, 146.83, 0],
    wave: 'sawtooth',
    bassWave: 'triangle',
    hasDrums: true,
    hasViolinPad: false,
    filterHz: 1500,
  },
  world3: {
    tempoMs: 220,
    melody: [523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 523.25, 0, 440.0, 523.25, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33],
    bass: [130.81, 0, 196.0, 0, 146.83, 0, 220.0, 0, 174.61, 0, 261.63, 0, 196.0, 0, 130.81, 0],
    wave: 'sine',
    bassWave: 'sine',
    hasDrums: false,
    hasViolinPad: true,
    filterHz: 3400,
  },
  world4: {
    tempoMs: 205,
    melody: [220.0, 261.63, 246.94, 220.0, 196.0, 220.0, 261.63, 329.63, 311.13, 293.66, 261.63, 246.94, 220.0, 196.0, 164.81, 207.65],
    bass: [110.0, 0, 110.0, 164.81, 98.0, 0, 130.81, 0, 110.0, 0, 146.83, 0, 130.81, 0, 82.41, 103.83],
    wave: 'sawtooth',
    bassWave: 'sawtooth',
    hasDrums: true,
    hasViolinPad: true,
    filterHz: 1200,
  },
  world5: {
    tempoMs: 160,
    melody: [220.0, 0, 261.63, 293.66, 329.63, 0, 293.66, 261.63, 220.0, 220.0, 349.23, 0, 329.63, 293.66, 261.63, 246.94],
    bass: [110.0, 110.0, 0, 110.0, 130.81, 130.81, 0, 130.81, 98.0, 98.0, 0, 98.0, 146.83, 0, 164.81, 0],
    wave: 'square',
    bassWave: 'sawtooth',
    hasDrums: true,
    hasViolinPad: false,
    filterHz: 1650,
  },
  boss: {
    tempoMs: 145,
    melody: [220.0, 233.08, 220.0, 293.66, 261.63, 233.08, 220.0, 196.0, 220.0, 293.66, 349.23, 329.63, 293.66, 261.63, 233.08, 196.0],
    bass: [110.0, 110.0, 110.0, 146.83, 130.81, 116.54, 110.0, 98.0, 110.0, 110.0, 174.61, 164.81, 146.83, 130.81, 116.54, 98.0],
    wave: 'sawtooth',
    bassWave: 'sawtooth',
    hasDrums: true,
    hasViolinPad: false,
    filterHz: 1900,
  },
  kidnap_dramatic: {
    tempoMs: 175,
    melody: [196.0, 0, 207.65, 220.0, 293.66, 0, 261.63, 246.94, 196.0, 0, 233.08, 220.0, 174.61, 164.81, 146.83, 0],
    bass: [98.0, 98.0, 0, 98.0, 110.0, 0, 98.0, 0, 87.31, 87.31, 0, 87.31, 73.42, 0, 65.41, 0],
    wave: 'sawtooth',
    bassWave: 'sawtooth',
    hasDrums: true,
    hasViolinPad: true,
    filterHz: 1400,
  },
  emotional_piano: {
    tempoMs: 370,
    // Tender minor heartbreak piano + crying violin melody
    melody: [440.0, 523.25, 493.88, 392.0, 349.23, 392.0, 329.63, 0, 293.66, 349.23, 440.0, 392.0, 349.23, 329.63, 293.66, 220.0],
    bass: [110.0, 0, 164.81, 0, 87.31, 0, 130.81, 0, 73.42, 0, 146.83, 0, 82.41, 0, 110.0, 0],
    wave: 'sine',
    bassWave: 'triangle',
    hasDrums: false,
    hasViolinPad: true,
    filterHz: 2200,
  },
  victory: {
    tempoMs: 180,
    melody: [392.0, 523.25, 659.25, 783.99, 659.25, 783.99, 1046.5, 0, 880.0, 783.99, 659.25, 783.99, 523.25, 659.25, 523.25, 0],
    bass: [130.81, 0, 196.0, 0, 261.63, 0, 196.0, 0, 174.61, 0, 196.0, 0, 130.81, 0, 130.81, 0],
    wave: 'triangle',
    bassWave: 'triangle',
    hasDrums: true,
    hasViolinPad: true,
    filterHz: 3200,
  },
  reunion: {
    tempoMs: 320,
    melody: [523.25, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33, 659.25, 523.25, 587.33, 659.25, 783.99, 1046.5, 880.0, 783.99, 659.25],
    bass: [130.81, 0, 196.0, 0, 174.61, 0, 196.0, 0, 220.0, 0, 174.61, 0, 196.0, 0, 130.81, 0],
    wave: 'sine',
    bassWave: 'sine',
    hasDrums: false,
    hasViolinPad: true,
    filterHz: 3000,
  },
};

class AudioEngineImpl {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private currentMood: MusicMood = 'none';
  private stepTimer: number | null = null;
  private stepIdx = 0;
  private coinCombo = 0;
  private lastCoinAt = 0;

  private heliGain: GainNode | null = null;
  private heliNoise: AudioBufferSourceNode | null = null;
  private heliLfo: OscillatorNode | null = null;

  private settings: GameSettings = {
    musicEnabled: true,
    sfxEnabled: true,
    musicVolume: 0.65,
    sfxVolume: 0.85,
    graphicsQuality: 'high',
    controlSensitivity: 1.0,
    showTouchControls: true,
  };

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);
      this.applyGains();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public updateSettings(next: GameSettings): void {
    this.settings = next;
    this.applyGains();
    if (!next.musicEnabled) {
      this.stopMusicLoop();
    } else if (this.currentMood !== 'none' && this.stepTimer === null) {
      this.startMusicLoop(this.currentMood);
    }
  }

  private applyGains(): void {
    if (!this.ctx || !this.musicGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.musicGain.gain.setTargetAtTime(
      this.settings.musicEnabled ? this.settings.musicVolume * 0.28 : 0,
      now,
      0.04
    );
    this.sfxGain.gain.setTargetAtTime(
      this.settings.sfxEnabled ? this.settings.sfxVolume * 0.55 : 0,
      now,
      0.03
    );
  }

  public setMusicMood(mood: MusicMood): void {
    if (mood === this.currentMood && (mood === 'none' || this.stepTimer !== null)) {
      return;
    }
    this.currentMood = mood;
    this.stopMusicLoop();
    if (mood !== 'none' && this.settings.musicEnabled) {
      this.startMusicLoop(mood);
    }
  }

  private stopMusicLoop(): void {
    if (this.stepTimer !== null) {
      window.clearInterval(this.stepTimer);
      this.stepTimer = null;
    }
  }

  private startMusicLoop(mood: Exclude<MusicMood, 'none'>): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.musicGain) return;
    const pattern = TRACKS[mood];
    this.stepIdx = 0;

    const tick = () => {
      if (!this.ctx || !this.musicGain || !this.settings.musicEnabled) return;
      if (this.ctx.state === 'suspended') return;
      const now = this.ctx.currentTime;
      const idx = this.stepIdx % pattern.melody.length;
      const melFreq = pattern.melody[idx];
      const bassFreq = pattern.bass[idx];

      if (melFreq > 0) {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        osc.type = pattern.wave;
        osc.frequency.setValueAtTime(melFreq, now);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(pattern.filterHz, now);

        const dur = (pattern.tempoMs / 1000) * (mood === 'emotional_piano' ? 1.5 : 0.9);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(mood === 'emotional_piano' ? 0.36 : 0.24, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + dur + 0.03);
      }

      if (bassFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = pattern.bassWave;
        osc.frequency.setValueAtTime(bassFreq, now);
        const dur = (pattern.tempoMs / 1000) * 1.1;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + dur + 0.03);
      }

      // Sustained emotional violin / orchestral pad on every 4th step
      if (pattern.hasViolinPad && idx % 4 === 0 && melFreq > 0) {
        const pad = this.ctx.createOscillator();
        const padGain = this.ctx.createGain();
        pad.type = 'sawtooth';
        pad.frequency.setValueAtTime(melFreq * 0.5, now);
        // Gentle vibrato for crying violin expressiveness
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(5.2, now);
        lfoGain.gain.setValueAtTime(3.2, now);
        lfo.connect(lfoGain);
        lfoGain.connect(pad.frequency);

        const padFilter = this.ctx.createBiquadFilter();
        padFilter.type = 'bandpass';
        padFilter.frequency.setValueAtTime(900, now);
        padFilter.Q.setValueAtTime(1.4, now);

        const padDur = (pattern.tempoMs / 1000) * 3.8;
        padGain.gain.setValueAtTime(0.001, now);
        padGain.gain.linearRampToValueAtTime(0.16, now + 0.18);
        padGain.gain.exponentialRampToValueAtTime(0.001, now + padDur);

        pad.connect(padFilter);
        padFilter.connect(padGain);
        padGain.connect(this.musicGain);
        pad.start(now);
        lfo.start(now);
        pad.stop(now + padDur + 0.05);
        lfo.stop(now + padDur + 0.05);
      }

      if (pattern.hasDrums) {
        if (idx % 4 === 0) {
          this.triggerDrumKick(now, this.musicGain, mood === 'boss' || mood === 'kidnap_dramatic' ? 0.56 : 0.28);
        } else if (mood === 'boss' && idx % 4 === 1) {
          this.triggerDrumKick(now, this.musicGain, 0.34);
        } else if (idx % 4 === 2) {
          this.triggerDrumSnare(now, this.musicGain, mood === 'boss' ? 0.26 : 0.16);
        }
      }

      this.stepIdx++;
    };

    tick();
    this.stepTimer = window.setInterval(tick, pattern.tempoMs);
  }

  private triggerDrumKick(now: number, dest: AudioNode, amp: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(135, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.12);
    gain.gain.setValueAtTime(amp, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  private triggerDrumSnare(now: number, dest: AudioNode, amp: number): void {
    if (!this.ctx) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
    const buf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(900, now);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(amp, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(now);
  }

  public startHelicopterRotor(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.heliNoise) return;
    if (!this.settings.sfxEnabled) return;

    const bufLen = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      ch[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(240, ctx.currentTime);

    const chopperMod = ctx.createGain();
    chopperMod.gain.setValueAtTime(0.55, ctx.currentTime);

    const lfo = ctx.createOscillator();
    const lfoDepth = ctx.createGain();
    lfo.frequency.setValueAtTime(15.5, ctx.currentTime);
    lfoDepth.gain.setValueAtTime(0.45, ctx.currentTime);
    lfo.connect(lfoDepth);
    lfoDepth.connect(chopperMod.gain);

    const masterHeliGain = ctx.createGain();
    masterHeliGain.gain.setValueAtTime(0.01, ctx.currentTime);

    noise.connect(filter);
    filter.connect(chopperMod);
    chopperMod.connect(masterHeliGain);
    masterHeliGain.connect(this.sfxGain);

    noise.start();
    lfo.start();

    this.heliNoise = noise;
    this.heliLfo = lfo;
    this.heliGain = masterHeliGain;
  }

  public setHelicopterIntensity(intensity: number): void {
    if (!this.ctx || !this.heliGain) return;
    const clamped = Math.max(0, Math.min(1, intensity));
    const target = this.settings.sfxEnabled ? clamped * 0.62 : 0;
    this.heliGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.08);
  }

  public stopHelicopterRotor(): void {
    try {
      this.heliNoise?.stop();
      this.heliLfo?.stop();
      this.heliNoise?.disconnect();
      this.heliLfo?.disconnect();
      this.heliGain?.disconnect();
    } catch {
      // already stopped
    }
    this.heliNoise = null;
    this.heliLfo = null;
    this.heliGain = null;
  }

  public speakDialogue(text: string): void {
    // 1. Play warm emotional underscore swell via Web Audio
    const ctx = this.ensureContext();
    if (ctx && this.sfxGain && this.settings.sfxEnabled) {
      const now = ctx.currentTime;
      [220, 261.63, 329.63].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.09, now + 0.15);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.9);
        osc.connect(g);
        g.connect(this.sfxGain!);
        osc.start(now);
        osc.stop(now + 1.95);
      });
    }

    // 2. Real audible English voice acting using SpeechSynthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && this.settings.sfxEnabled) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'en-US';
        utter.rate = 0.86;
        utter.pitch = 0.94;
        utter.volume = Math.max(0.2, Math.min(1, this.settings.sfxVolume));

        const voices = window.speechSynthesis.getVoices();
        const preferred =
          voices.find(
            (v) =>
              v.lang.startsWith('en') &&
              /natural|google us|daniel|alex|david|ryan/i.test(v.name)
          ) ?? voices.find((v) => v.lang.startsWith('en'));
        if (preferred) utter.voice = preferred;

        window.speechSynthesis.speak(utter);
      } catch {
        // Ignore speech synthesis errors in restricted frames
      }
    }
  }

  public playSfx(event: SfxEvent): void {
    if (!this.settings.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;

    switch (event) {
      case 'ui_click':
        this.tone(now, 660, 880, 0.06, 'sine', 0.18);
        break;
      case 'jump':
        this.tone(now, 260, 520, 0.14, 'triangle', 0.25);
        break;
      case 'double_jump':
        this.tone(now, 380, 760, 0.16, 'sine', 0.26);
        this.tone(now + 0.04, 540, 880, 0.12, 'triangle', 0.15);
        break;
      case 'land':
        this.tone(now, 150, 70, 0.08, 'sine', 0.2);
        break;
      case 'footstep_grass':
      case 'footstep_sand':
        this.noiseBurst(now, 0.04, event === 'footstep_sand' ? 1400 : 800, 0.08);
        break;
      case 'footstep_ice':
        this.tone(now, 920 + Math.random() * 140, 620, 0.04, 'triangle', 0.07);
        break;
      case 'footstep_stone':
      case 'footstep_metal':
        this.tone(now, event === 'footstep_metal' ? 420 : 210, 110, 0.05, 'square', 0.06);
        break;
      case 'sword_slash':
        this.noiseBurst(now, 0.1, 2200, 0.22);
        this.tone(now, 520, 200, 0.1, 'sawtooth', 0.16);
        break;
      case 'fireball':
        this.noiseBurst(now, 0.18, 900, 0.25);
        this.tone(now, 320, 740, 0.16, 'sawtooth', 0.22);
        break;
      case 'boomerang':
        this.tone(now, 440, 680, 0.14, 'triangle', 0.2);
        this.tone(now + 0.1, 680, 440, 0.14, 'triangle', 0.18);
        break;
      case 'magic_bow':
        this.tone(now, 740, 320, 0.11, 'triangle', 0.22);
        this.noiseBurst(now, 0.08, 3200, 0.15);
        break;
      case 'thunder_attack':
        this.noiseBurst(now, 0.35, 1800, 0.36);
        this.tone(now, 880, 95, 0.28, 'sawtooth', 0.28);
        break;
      case 'ice_blaster':
        this.tone(now, 1280, 640, 0.14, 'sine', 0.22);
        this.noiseBurst(now, 0.12, 3600, 0.16);
        break;
      case 'energy_gun':
        this.tone(now, 1100, 280, 0.11, 'square', 0.18);
        break;
      case 'explosive_bomb':
        this.tone(now, 240, 420, 0.12, 'triangle', 0.18);
        break;
      case 'shield':
        this.tone(now, 330, 660, 0.25, 'sine', 0.24);
        this.tone(now + 0.06, 495, 990, 0.25, 'sine', 0.18);
        break;
      case 'speed':
        this.tone(now, 400, 1100, 0.22, 'sawtooth', 0.18);
        break;
      case 'coin': {
        if (performance.now() - this.lastCoinAt < 1200) {
          this.coinCombo = Math.min(8, this.coinCombo + 1);
        } else {
          this.coinCombo = 0;
        }
        this.lastCoinAt = performance.now();
        const base = 880 * Math.pow(1.06, this.coinCombo);
        this.tone(now, base, base * 1.45, 0.12, 'sine', 0.22);
        break;
      }
      case 'diamond':
        this.tone(now, 1046.5, 1318.5, 0.14, 'sine', 0.25);
        this.tone(now + 0.07, 1318.5, 1567.98, 0.18, 'triangle', 0.22);
        break;
      case 'chest':
        this.tone(now, 523.25, 659.25, 0.14, 'triangle', 0.26);
        this.tone(now + 0.1, 659.25, 783.99, 0.14, 'triangle', 0.26);
        this.tone(now + 0.2, 783.99, 1046.5, 0.28, 'triangle', 0.28);
        break;
      case 'powerup':
      case 'heart':
        this.tone(now, 440, 660, 0.12, 'sine', 0.24);
        this.tone(now + 0.09, 660, 880, 0.18, 'sine', 0.24);
        break;
      case 'checkpoint':
        this.tone(now, 587.33, 880, 0.22, 'triangle', 0.25);
        break;
      case 'enemy_hit':
        this.tone(now, 240, 110, 0.1, 'square', 0.22);
        break;
      case 'enemy_defeat':
        this.tone(now, 320, 120, 0.16, 'sawtooth', 0.22);
        this.tone(now + 0.06, 480, 660, 0.14, 'triangle', 0.2);
        break;
      case 'explosion':
        this.noiseBurst(now, 0.35, 450, 0.4);
        this.tone(now, 140, 40, 0.32, 'sawtooth', 0.35);
        break;
      case 'boss_roar':
        this.tone(now, 155, 62, 0.48, 'sawtooth', 0.36);
        this.noiseBurst(now, 0.42, 540, 0.3);
        break;
      case 'boss_slam':
        this.triggerDrumKick(now, this.sfxGain, 0.72);
        this.noiseBurst(now, 0.26, 580, 0.34);
        break;
      case 'boss_bite':
        this.noiseBurst(now, 0.09, 2600, 0.3);
        this.tone(now, 240, 85, 0.14, 'sawtooth', 0.28);
        break;
      case 'boss_fire':
        this.noiseBurst(now, 0.38, 1200, 0.32);
        this.tone(now, 280, 140, 0.34, 'sawtooth', 0.22);
        break;
      case 'boss_ice':
        this.tone(now, 1180, 420, 0.22, 'triangle', 0.26);
        this.noiseBurst(now, 0.18, 3400, 0.24);
        break;
      case 'boss_laser':
        this.tone(now, 920, 180, 0.26, 'square', 0.24);
        this.tone(now + 0.03, 640, 120, 0.22, 'sawtooth', 0.18);
        break;
      case 'boss_defeat':
        this.noiseBurst(now, 0.65, 420, 0.44);
        this.tone(now, 220, 42, 0.62, 'sawtooth', 0.38);
        this.tone(now + 0.18, 180, 38, 0.55, 'triangle', 0.32);
        break;
      case 'thunder_rumble':
        this.noiseBurst(now, 0.14, 2400, 0.34);
        this.noiseBurst(now + 0.08, 0.75, 320, 0.42);
        this.tone(now + 0.05, 95, 36, 0.65, 'sine', 0.36);
        break;
      case 'player_hurt':
        this.tone(now, 320, 150, 0.2, 'sawtooth', 0.3);
        break;
      case 'maya_cry':
        this.tone(now, 640, 520, 0.24, 'sine', 0.16);
        this.tone(now + 0.28, 590, 470, 0.24, 'sine', 0.14);
        break;
      case 'leo_cry':
        this.tone(now, 340, 260, 0.28, 'sine', 0.18);
        this.tone(now + 0.32, 310, 240, 0.3, 'sine', 0.16);
        break;
      case 'zombie_growl':
        this.tone(now, 128, 72, 0.28, 'sawtooth', 0.18);
        this.tone(now + 0.04, 96, 58, 0.26, 'triangle', 0.15);
        this.noiseBurst(now, 0.2, 420, 0.12);
        break;
      case 'zombie_sword_throw':
        // Sharp metallic whistle + spin whoosh
        this.noiseBurst(now, 0.14, 3400, 0.24);
        this.tone(now, 1480, 620, 0.13, 'triangle', 0.2);
        this.tone(now + 0.02, 2240, 1180, 0.09, 'sine', 0.14);
        break;
      case 'zombie_hit':
        this.tone(now, 195, 82, 0.13, 'sawtooth', 0.24);
        this.noiseBurst(now, 0.08, 1200, 0.18);
        break;
      case 'zombie_defeat':
        this.tone(now, 170, 52, 0.38, 'sawtooth', 0.25);
        this.tone(now + 0.08, 125, 42, 0.34, 'triangle', 0.18);
        this.noiseBurst(now + 0.05, 0.25, 680, 0.2);
        break;
      case 'sword_clash':
        this.tone(now, 1950, 920, 0.14, 'square', 0.2);
        this.tone(now + 0.01, 2640, 1480, 0.16, 'sine', 0.22);
        this.noiseBurst(now, 0.07, 4200, 0.18);
        break;
    }
  }

  private tone(
    startTime: number,
    fStart: number,
    fEnd: number,
    dur: number,
    type: OscillatorType,
    amp: number
  ): void {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(fStart, startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, fEnd), startTime + dur);
    gain.gain.setValueAtTime(amp, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(startTime);
    osc.stop(startTime + dur + 0.02);
  }

  private noiseBurst(startTime: number, dur: number, cutoffHz: number, amp: number): void {
    if (!this.ctx || !this.sfxGain) return;
    const size = Math.max(128, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / size);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoffHz, startTime);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(amp, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(startTime);
  }
}

export const audioEngine = new AudioEngineImpl();

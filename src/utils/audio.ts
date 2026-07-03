// Futuristic Web Audio Synthesizer for CT Challenge
// Generates live music and sound effects on-the-fly with no external audio assets required.

class AudioSynthManager {
  private ctx: AudioContext | null = null;
  private masterVolume: GainNode | null = null;
  private bgmVolume: GainNode | null = null;
  private sfxVolume: GainNode | null = null;
  private isMutedState: boolean = false;
  private currentBgmType: 'map' | 'focus' | null = null;
  private bgmIntervalId: any = null;
  private bgmNodes: AudioNode[] = [];

  constructor() {
    // Audio Context is initialized lazily on first user interaction to comply with browser autoplay policies
  }

  private init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.gain.setValueAtTime(this.isMutedState ? 0 : 0.6, this.ctx.currentTime);
      this.masterVolume.connect(this.ctx.destination);

      this.bgmVolume = this.ctx.createGain();
      this.bgmVolume.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.bgmVolume.connect(this.masterVolume);

      this.sfxVolume = this.ctx.createGain();
      this.sfxVolume.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxVolume.connect(this.masterVolume);
    } catch (e) {
      console.error("Web Audio API not supported", e);
    }
  }

  public setMute(muted: boolean) {
    this.isMutedState = muted;
    if (!this.ctx) return;
    
    if (this.masterVolume) {
      this.masterVolume.gain.setValueAtTime(muted ? 0 : 0.6, this.ctx.currentTime);
    }
  }

  public isMuted(): boolean {
    return this.isMutedState;
  }

  public playSfx(type: 'click' | 'correct' | 'wrong' | 'unlock') {
    this.init();
    if (!this.ctx || this.isMutedState) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;

    if (type === 'click') {
      // Short futuristic neon click
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      
      osc.connect(gain);
      gain.connect(this.sfxVolume!);
      osc.start(now);
      osc.stop(now + 0.09);
    } 
    else if (type === 'correct') {
      // Sparkling chime/tada chord: C5 -> E5 -> G5 -> C6
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.05 + 0.4);
        
        osc.connect(gain);
        gain.connect(this.sfxVolume!);
        
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.45);
      });
    } 
    else if (type === 'wrong') {
      // Cyber buzz/warning descending tone
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(180, now);
      osc1.frequency.linearRampToValueAtTime(110, now + 0.25);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(185, now);
      osc2.frequency.linearRampToValueAtTime(112, now + 0.25);
      
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxVolume!);
      
      osc1.start(now);
      osc1.stop(now + 0.26);
      osc2.start(now);
      osc2.stop(now + 0.26);
    } 
    else if (type === 'unlock') {
      // Rising fanfare electronic power-up
      const freqs = [349.23, 440.00, 523.25, 698.46, 880.00]; // F4, A4, C5, F5, A5
      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.3);
        
        osc.connect(gain);
        gain.connect(this.sfxVolume!);
        
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    }
  }

  public startBgm(type: 'map' | 'focus') {
    this.init();
    if (!this.ctx) return;

    if (this.currentBgmType === type) {
      return; // Already playing this BGM
    }

    this.stopBgm();
    this.currentBgmType = type;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (type === 'map') {
      // Loop upbeat Lo-Fi arpeggios
      this.playMapBgmLoop();
    } else {
      // Loop a deep space focus drone with light synth blips
      this.playFocusBgmLoop();
    }
  }

  private playMapBgmLoop() {
    const playMeasure = () => {
      if (this.currentBgmType !== 'map' || !this.ctx || this.isMutedState) return;

      const now = this.ctx.currentTime;
      // Cord progression in F Major / D minor: Dm9 -> G13 -> Cmaj9 -> Fmaj7
      const progression = [
        [146.83, 220.00, 261.63, 311.13, 392.00], // Dm9
        [196.00, 246.94, 293.66, 349.23, 440.00], // G13
        [130.81, 196.00, 246.94, 293.66, 392.00], // Cmaj9
        [174.61, 220.00, 261.63, 329.63, 440.00]  // Fmaj7
      ];

      let beatIdx = 0;
      const beatLength = 0.4; // 150 bpm (0.4s per beat)

      // We schedule a full 4 bar progression
      progression.forEach((chord, chordIdx) => {
        // Play soft bass and pad
        chord.slice(0, 3).forEach((freq, noteIdx) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + chordIdx * 4 * beatLength);
          
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.08, now + chordIdx * 4 * beatLength + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + chordIdx * 4 * beatLength + 3.8 * beatLength);
          
          osc.connect(gain);
          gain.connect(this.bgmVolume!);
          osc.start(now + chordIdx * 4 * beatLength);
          osc.stop(now + chordIdx * 4 * beatLength + 3.9 * beatLength);
          this.bgmNodes.push(osc);
        });

        // Arpeggiate upper notes over 4 beats
        for (let beat = 0; beat < 4; beat++) {
          const noteFreq = chord[3 + (beat % 2)];
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          
          osc.type = 'sine';
          // Add filter or soft envelope
          osc.frequency.setValueAtTime(noteFreq, now + (chordIdx * 4 + beat) * beatLength);
          
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.05, now + (chordIdx * 4 + beat) * beatLength + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + (chordIdx * 4 + beat) * beatLength + 0.35);
          
          osc.connect(gain);
          gain.connect(this.bgmVolume!);
          osc.start(now + (chordIdx * 4 + beat) * beatLength);
          osc.stop(now + (chordIdx * 4 + beat) * beatLength + 0.38);
          this.bgmNodes.push(osc);
        }
      });
    };

    playMeasure();
    // Schedule loop every 6.4 seconds (4 chords * 4 beats * 0.4s = 6.4s)
    this.bgmIntervalId = setInterval(() => {
      playMeasure();
    }, 6400);
  }

  private playFocusBgmLoop() {
    const playFocusDrone = () => {
      if (this.currentBgmType !== 'focus' || !this.ctx || this.isMutedState) return;

      const now = this.ctx.currentTime;
      // Low roots for focus space atmosphere: E2 -> A2 -> C2
      const rootChords = [82.41, 110.00, 65.41];
      const selectedRoot = rootChords[Math.floor(Math.random() * rootChords.length)];

      // 1. Play deep sub bass pad (8 seconds duration)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(selectedRoot, now);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(selectedRoot * 1.5, now); // Perfect fifth drone

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 1.5);
      gain.gain.linearRampToValueAtTime(0.12, now + 6.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 8.0);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.bgmVolume!);

      osc1.start(now);
      osc1.stop(now + 8.1);
      osc2.start(now);
      osc2.stop(now + 8.1);

      this.bgmNodes.push(osc1, osc2);

      // 2. Play 2 or 3 tiny space ambient computer "blips" during this drone
      for (let i = 0; i < 3; i++) {
        const blipTime = now + 1.0 + Math.random() * 5.0;
        const blipFreq = selectedRoot * 4 * (1 + Math.floor(Math.random() * 3) * 0.25); // high harmonic
        
        const blipOsc = this.ctx.createOscillator();
        const blipGain = this.ctx.createGain();

        blipOsc.type = 'sine';
        blipOsc.frequency.setValueAtTime(blipFreq, blipTime);
        
        blipGain.gain.setValueAtTime(0, now);
        blipGain.gain.linearRampToValueAtTime(0.03, blipTime + 0.1);
        blipGain.gain.exponentialRampToValueAtTime(0.001, blipTime + 0.8);

        blipOsc.connect(blipGain);
        blipGain.connect(this.bgmVolume!);

        blipOsc.start(blipTime);
        blipOsc.stop(blipTime + 0.9);
        this.bgmNodes.push(blipOsc);
      }
    };

    playFocusDrone();
    // Schedule loop every 8 seconds
    this.bgmIntervalId = setInterval(() => {
      playFocusDrone();
    }, 8000);
  }

  public stopBgm() {
    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
    this.bgmNodes.forEach(node => {
      try {
        (node as any).stop();
      } catch (e) {}
    });
    this.bgmNodes = [];
    this.currentBgmType = null;
  }
}

export const audioSynth = new AudioSynthManager();

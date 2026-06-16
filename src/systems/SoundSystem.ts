type WaveType = OscillatorType;

interface ToneOptions {
  freq: number;
  endFreq?: number;
  duration: number;
  gain?: number;
  type?: WaveType;
  delay?: number;
}

export class SoundSystem {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled = true;
  private volume = 0.28;
  private lastPlayed: Record<string, number> = {};

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    if (this.enabled) this.ensure();
    return this.enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.master) this.master.gain.value = this.volume;
  }

  unlock(): void {
    this.ensure();
  }

  click(): void {
    if (!this.canPlay("click", 0.04)) return;
    this.tone({ freq: 720, endFreq: 540, duration: 0.045, gain: 0.1, type: "triangle" });
  }

  attack(): void {
    if (!this.canPlay("attack", 0.045)) return;
    this.tone({ freq: 520, endFreq: 260, duration: 0.07, gain: 0.18, type: "triangle" });
  }

  shoot(): void {
    this.attack();
  }

  pickupXP(): void {
    if (!this.canPlay("pickup_xp", 0.04)) return;
    this.tone({ freq: 640, endFreq: 920, duration: 0.08, gain: 0.16, type: "sine" });
  }

  pickupHP(): void {
    if (!this.canPlay("pickup_hp", 0.06)) return;
    this.tone({ freq: 520, endFreq: 760, duration: 0.09, gain: 0.18, type: "sine" });
    this.tone({ freq: 760, endFreq: 960, duration: 0.08, gain: 0.12, type: "sine", delay: 0.055 });
  }

  hit(): void {
    if (!this.canPlay("hit", 0.035)) return;
    this.tone({ freq: 180, endFreq: 90, duration: 0.065, gain: 0.16, type: "square" });
  }

  kill(): void {
    if (!this.canPlay("kill", 0.05)) return;
    this.noise(0.075, 0.15);
    this.tone({ freq: 360, endFreq: 160, duration: 0.09, gain: 0.13, type: "sawtooth" });
  }

  enemyDeath(): void {
    this.kill();
  }

  levelUp(): void {
    if (!this.canPlay("level", 0.2)) return;
    this.tone({ freq: 520, endFreq: 780, duration: 0.11, gain: 0.2, type: "sine" });
    this.tone({ freq: 780, endFreq: 1040, duration: 0.13, gain: 0.18, type: "sine", delay: 0.09 });
    this.tone({ freq: 1040, endFreq: 1320, duration: 0.16, gain: 0.15, type: "triangle", delay: 0.18 });
  }

  playerHurt(): void {
    if (!this.canPlay("hurt", 0.13)) return;
    this.noise(0.13, 0.24);
    this.tone({ freq: 160, endFreq: 60, duration: 0.16, gain: 0.22, type: "sawtooth" });
  }

  bossSpawn(): void {
    if (!this.canPlay("boss_spawn", 0.7)) return;
    this.tone({ freq: 90, endFreq: 52, duration: 0.38, gain: 0.28, type: "sawtooth" });
    this.tone({ freq: 180, endFreq: 90, duration: 0.38, gain: 0.17, type: "square", delay: 0.04 });
    this.noise(0.22, 0.18, 0.08);
  }

  bossDefeated(): void {
    if (!this.canPlay("boss_defeated", 0.45)) return;
    this.tone({ freq: 240, endFreq: 480, duration: 0.13, gain: 0.2, type: "triangle" });
    this.tone({ freq: 480, endFreq: 720, duration: 0.14, gain: 0.18, type: "triangle", delay: 0.11 });
    this.tone({ freq: 720, endFreq: 960, duration: 0.2, gain: 0.14, type: "sine", delay: 0.23 });
  }

  private canPlay(key: string, cooldown: number): boolean {
    if (!this.enabled) return false;
    const now = performance.now() / 1000;
    if ((this.lastPlayed[key] ?? -999) + cooldown > now) return false;
    this.lastPlayed[key] = now;
    return true;
  }

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }

    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private tone(options: ToneOptions): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;

    const now = ctx.currentTime + (options.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const duration = Math.max(0.01, options.duration);

    osc.type = options.type ?? "sine";
    osc.frequency.setValueAtTime(options.freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, options.endFreq ?? options.freq), now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, options.gain ?? 0.16), now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private noise(duration: number, gainValue: number, delay = 0): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;

    const now = ctx.currentTime + delay;
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }

    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainValue, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    src.buffer = buffer;
    src.connect(gain);
    gain.connect(this.master);
    src.start(now);
  }
}

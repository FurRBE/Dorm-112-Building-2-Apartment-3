/**
 * 极简 WebAudio 音效：全部现场合成，不依赖任何音频文件。
 * 第一次用户操作时才创建 AudioContext（浏览器策略）。
 */
class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  muted = false;

  private ensure(): boolean {
    if (this.muted) return false;
    if (!this.ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.32;
      this.master.connect(this.ctx.destination);
      const len = Math.floor(this.ctx.sampleRate * 0.8);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return true;
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType,
    gain: number,
    slideTo?: number,
    delay = 0,
  ): void {
    if (!this.ensure() || !this.ctx || !this.master) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + Math.min(0.02, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  private noise(dur: number, gain: number, freq: number, q = 1, delay = 0): void {
    if (!this.ensure() || !this.ctx || !this.master || !this.noiseBuf) return;
    const t0 = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  talk(): void {
    this.tone(520 + Math.random() * 120, 0.045, 'square', 0.05);
  }

  click(): void {
    this.tone(660, 0.06, 'triangle', 0.09);
    this.tone(990, 0.05, 'sine', 0.05, undefined, 0.04);
  }

  step(): void {
    this.noise(0.09, 0.05, 460, 1.4);
    this.tone(96, 0.08, 'sine', 0.045);
  }

  door(open: boolean): void {
    this.tone(open ? 150 : 320, 0.42, 'sawtooth', 0.035, open ? 340 : 120);
    this.noise(0.34, 0.05, 900, 0.8, 0.04);
    if (!open) this.tone(110, 0.16, 'sine', 0.08, 70, 0.34);
  }

  chime(): void {
    this.tone(659, 0.34, 'sine', 0.07);
    this.tone(988, 0.42, 'sine', 0.05, undefined, 0.1);
  }

  transition(): void {
    this.noise(0.5, 0.06, 380, 0.6);
    this.tone(180, 0.5, 'sine', 0.04, 420);
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.32;
    return this.muted;
  }
}

export const sfx = new Sfx();

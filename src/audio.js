// All audio is synthesized live with WebAudio — engine, weapons, impacts,
// plus a little generative synthwave backing track. No audio files.
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.musicOn = true;
    this.started = false;
  }

  /** Must be called from a user gesture. */
  start() {
    if (this.started) return;
    this.started = true;
    const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
    this.master = ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(ctx.destination);

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.9;
    this.sfxBus.connect(this.master);

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0.30;
    this.musicBus.connect(this.master);

    // shared noise buffer
    const len = ctx.sampleRate * 1.2;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    this._buildEngine();
    this._startMusic();
  }

  _buildEngine() {
    const ctx = this.ctx;
    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    this.engineGain.connect(lp);
    lp.connect(this.sfxBus);

    this.engineOsc1 = ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc2 = ctx.createOscillator();
    this.engineOsc2.type = 'square';
    const g2 = ctx.createGain();
    g2.gain.value = 0.4;
    this.engineOsc1.connect(this.engineGain);
    this.engineOsc2.connect(g2);
    g2.connect(this.engineGain);
    this.engineOsc1.start();
    this.engineOsc2.start();
  }

  /** speed 0..1, throttle 0..1 */
  engine(speed, throttle) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const f = 46 + speed * 190;
    this.engineOsc1.frequency.setTargetAtTime(f, t, 0.05);
    this.engineOsc2.frequency.setTargetAtTime(f * 1.5 + 3, t, 0.05);
    const vol = 0.05 + speed * 0.10 + throttle * 0.05;
    this.engineGain.gain.setTargetAtTime(vol, t, 0.08);
  }

  _noise(dur, { freq = 800, q = 1, type = 'bandpass', gain = 0.5, slideTo = null } = {}) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = 0.6 + Math.random() * 0.4;
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    if (slideTo) f.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxBus);
    src.start(t); src.stop(t + dur + 0.05);
  }

  _tone(freq, dur, { type = 'sine', gain = 0.2, slideTo = null, bus = null } = {}) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = type; o.frequency.value = freq;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    o.connect(g); g.connect(bus || this.sfxBus);
    o.start(t); o.stop(t + dur + 0.05);
  }

  shoot() { if (this.ctx) { this._noise(0.09, { freq: 2400, q: 2, gain: 0.22, slideTo: 700 }); this._tone(880, 0.07, { type: 'square', gain: 0.06, slideTo: 240 }); } }
  missile() { if (this.ctx) { this._noise(0.7, { freq: 500, q: 1.5, gain: 0.4, slideTo: 2600 }); this._tone(180, 0.5, { type: 'sawtooth', gain: 0.12, slideTo: 60 }); } }
  explosion(big = false) {
    if (!this.ctx) return;
    this._noise(big ? 1.1 : 0.55, { freq: 900, type: 'lowpass', gain: big ? 0.9 : 0.55, slideTo: 60 });
    this._tone(big ? 90 : 120, big ? 0.8 : 0.4, { type: 'sine', gain: 0.5, slideTo: 30 });
  }
  hit() { if (this.ctx) this._noise(0.12, { freq: 300, type: 'lowpass', gain: 0.35 }); }
  scrape() { if (this.ctx) this._noise(0.15, { freq: 3200, q: 3, gain: 0.10 }); }
  pickup() { if (this.ctx) { this._tone(660, 0.12, { gain: 0.16 }); this._tone(990, 0.2, { gain: 0.14, slideTo: 1320 }); } }
  boost() { if (this.ctx) this._noise(0.5, { freq: 700, q: 2, gain: 0.3, slideTo: 3500 }); }
  countdown(final = false) { if (this.ctx) this._tone(final ? 880 : 440, final ? 0.5 : 0.18, { type: 'square', gain: 0.12 }); }
  lap() { if (this.ctx) { this._tone(523, 0.15, { gain: 0.15 }); setTimeout(() => this._tone(784, 0.3, { gain: 0.15 }), 130); } }

  // ------- generative synthwave loop -------
  _startMusic() {
    const ctx = this.ctx;
    // A minor-ish synthwave progression
    const bass = [55.0, 55.0, 43.65, 43.65, 65.41, 65.41, 49.0, 49.0]; // A1 A1 F1 F1 C2 C2 G1 G1
    const arpRoots = [220, 174.6, 261.6, 196.0]; // A3 F3 C4 G3
    const step = 60 / 112 / 2; // 112 BPM, 8th notes
    let n = 0;
    this._musicTimer = setInterval(() => {
      if (!this.musicOn) { n++; return; }
      const bar = Math.floor(n / 8) % 4;
      const beat8 = n % 8;
      // bass on every 8th
      this._tone(bass[(bar * 2 + (beat8 >= 4 ? 1 : 0)) % 8], step * 0.9, { type: 'sawtooth', gain: 0.20, bus: this.musicBus });
      // arp
      const root = arpRoots[bar];
      const arp = [1, 1.5, 2, 3][beat8 % 4];
      this._tone(root * arp, step * 0.8, { type: 'square', gain: 0.045, bus: this.musicBus });
      // kick on quarters, hat on off-8ths
      if (beat8 % 2 === 0) this._tone(120, 0.12, { type: 'sine', gain: 0.5, slideTo: 40, bus: this.musicBus });
      else this._noise(0.04, { freq: 8000, q: 1, gain: 0.07 });
      n++;
    }, step * 1000);
  }
  toggleMusic() { this.musicOn = !this.musicOn; return this.musicOn; }
}

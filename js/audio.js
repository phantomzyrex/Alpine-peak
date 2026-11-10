/**
 * Alpine Peak — Procedural Winter Mountain & Town Web Audio Engine (js/audio.js)
 * ==============================================================================
 * 100% pure Web Audio API procedural synthesis with zero external audio files.
 * Unlocks safely on first user gesture (pointerdown / keydown / touchstart) and
 * degrades silently in headless / restricted browser environments.
 *
 * Synthesizes:
 *   - Soft high-altitude alpine wind + sleigh-chime / celesta harmonic pad
 *   - Gentle "shhhk-shhhk" ski-edge snow carve (`playCarve`)
 *   - Subtle chairlift/gondola bullwheel & sheave click (`playLiftClick`)
 *   - Warm distant Swiss mountain railway two-tone horn (`playTrainArrival`)
 *   - Cozy chalet hearth fire crackle (`playFireCrackle`)
 *   - Shop bell / brass cash register chime (`playCash`)
 *   - 5-note Alpine glockenspiel & horn fanfare on Resort Milestones (`playMilestone`)
 *   - Tactile placement, sculpting, freestyle trick, and snapshot shutter SFX
 */
(function (global) {
  "use strict";

  // Warm Alpine larch-marimba pentatonic notes (C4 -> A5)
  const CHALET_WOOD_NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];

  // Sleigh-chime / celesta harmonic palettes per winter atmosphere
  const WINTER_CHIME_SCALES = {
    day: [659.25, 783.99, 987.77, 1046.5, 1174.66, 1318.51], // Crisp Bluebird Cmaj9/G
    alpenglow: [554.37, 659.25, 739.99, 880.0, 1108.73, 1318.51], // Rose-gold Aadd9
    night: [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98], // Crystalline Starry Night
  };

  // Pre-allocated zero-GC festive pitch sets (`playFireworkBurst`, `playFestivalFanfare`, `playCarouselChime`)
  const FIREWORK_STAR_CHORDS = [
    [1318.51, 1760.0, 2349.32], // E6 - A6 - D7
    [1174.66, 1567.98, 2093.0], // D6 - G6 - C7
    [1567.98, 1975.53, 2637.02], // G6 - B6 - E7
  ];
  const FIREWORK_CRACKLE_OFFSETS = [0.075, 0.135, 0.195];
  const FESTIVAL_FANFARE_BRASS = [
    [293.66, 0.0, 0.34], // D4
    [440.0, 0.11, 0.38], // A4
    [587.33, 0.24, 0.62], // D5
  ];
  const FESTIVAL_FANFARE_BELLS = [587.33, 739.99, 880.0, 1174.66, 1479.98]; // D major sparkle
  const CAROUSEL_WALTZ_PHRASES = [
    [659.25, 783.99, 987.77, 1318.51], // Em/C music-box waltz
    [587.33, 739.99, 880.0, 1174.66], // Dadd9 calliope waltz
  ];

  class SanctuaryAudio {
    constructor(options = {}) {
      this.isMuted = Boolean(options.muted);
      this.atmosphere = "day";
      this.ambientEnabled = options.ambient !== false;

      this._ctx = null;
      this._masterGain = null;
      this._sfxGain = null;
      this._ambientGain = null;
      this._noiseBuffer = null;
      this._windSource = null;
      this._windFilter = null;
      this._windLfo = null;
      this._chimeTimer = null;
      this._unlocked = false;
      this._placeStep = 0;
      this._fireworkStep = 0;
      this._carouselStep = 0;

      // Per-cue rate limiters (ms) so busy slopes & town sales sound musical, never cluttered
      this._lastCueMs = {
        build_sfx: 0,
        carve: 0,
        cash: 0,
        lift: 0,
        fire: 0,
        train: 0,
        firework: 0,
        fanfare: 0,
        carousel: 0,
      };

      this._bindUnlockListeners();
    }

    /** Alias getter/setter (`audio.muted` <-> `audio.isMuted`). */
    get muted() {
      return this.isMuted;
    }

    set muted(val) {
      this.setMuted(Boolean(val));
    }

    _bindUnlockListeners() {
      if (typeof window === "undefined" || typeof document === "undefined") return;

      const unlock = () => {
        this._ensureContext(true);
        if (this._unlocked) {
          window.removeEventListener("pointerdown", unlock, true);
          window.removeEventListener("keydown", unlock, true);
          window.removeEventListener("touchstart", unlock, true);
        }
      };

      window.addEventListener("pointerdown", unlock, { capture: true, passive: true });
      window.addEventListener("keydown", unlock, { capture: true, passive: true });
      window.addEventListener("touchstart", unlock, { capture: true, passive: true });
    }

    _ensureContext(fromUserGesture = false) {
      if (typeof window === "undefined") return null;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;

      try {
        if (!this._ctx && fromUserGesture) {
          this._ctx = new AudioCtx();
          this._masterGain = this._ctx.createGain();
          this._masterGain.gain.value = this.isMuted ? 0.0 : 0.85;
          this._masterGain.connect(this._ctx.destination);

          this._sfxGain = this._ctx.createGain();
          this._sfxGain.gain.value = 0.88;
          this._sfxGain.connect(this._masterGain);

          this._ambientGain = this._ctx.createGain();
          this._ambientGain.gain.value = this.ambientEnabled ? 0.13 : 0.0;
          this._ambientGain.connect(this._masterGain);

          this._noiseBuffer = this._createSnowWindBuffer(2.4);
        }

        if (!this._ctx) return null;

        if (this._ctx.state === "suspended" && fromUserGesture) {
          const p = this._ctx.resume();
          if (p && typeof p.catch === "function") p.catch(() => {});
        }

        if ((this._ctx.state === "running" || fromUserGesture) && !this._unlocked) {
          this._unlocked = true;
          if (this.ambientEnabled) {
            this._startAmbientLoop();
          }
        }
      } catch (_) {
        return null;
      }

      return this._ctx;
    }

    _createSnowWindBuffer(durationSec = 2.4) {
      if (!this._ctx) return null;
      const sampleRate = this._ctx.sampleRate;
      const length = Math.max(1, Math.floor(sampleRate * durationSec));
      const buffer = this._ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);

      // Paul Kellet pink-noise filter blended with 18% crisp white air for powdery snow texture
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        const mixed = pink * 0.095 + white * 0.055;
        data[i] = Math.max(-1, Math.min(1, mixed));
      }
      return buffer;
    }

    _canPlay(requireUnlockedOnly = false) {
      if (this.isMuted) return false;
      if (requireUnlockedOnly) {
        return Boolean(this._ctx && this._ctx.state === "running" && this._sfxGain);
      }
      const ctx = this._ensureContext(true);
      return Boolean(ctx && this._sfxGain);
    }

    _throttled(key, minGapMs) {
      const nowMs = typeof performance !== "undefined" ? performance.now() : Date.now();
      const prev = this._lastCueMs[key] || 0;
      if (nowMs - prev < minGapMs) return true;
      this._lastCueMs[key] = nowMs;
      return false;
    }

    /**
     * Explicitly unlocks Web Audio API context from a user gesture handler (`ui.js`).
     */
    unlock() {
      this._ensureContext(true);
      return this._unlocked;
    }

    /**
     * Toggles audio mute state cleanly and returns the new `isMuted` boolean.
     */
    toggleMute() {
      return this.setMuted(!this.isMuted);
    }

    setMuted(muted) {
      this.isMuted = Boolean(muted);
      if (this._ctx && this._masterGain) {
        const now = this._ctx.currentTime;
        this._masterGain.gain.cancelScheduledValues(now);
        this._masterGain.gain.setTargetAtTime(this.isMuted ? 0.0 : 0.85, now, 0.035);
      }
      return this.isMuted;
    }

    /**
     * Sets winter atmosphere ("day" | "alpenglow" | "night", plus aliases "golden" / "dusk").
     */
    setAtmosphere(mode) {
      const m = String(mode || "day").toLowerCase();
      if (m === "golden" || m === "alpenglow") {
        this.atmosphere = "alpenglow";
      } else if (m === "dusk" || m === "night") {
        this.atmosphere = "night";
      } else {
        this.atmosphere = "day";
      }

      if (this._ctx && this._windFilter) {
        const targetHz =
          this.atmosphere === "day" ? 460 : this.atmosphere === "alpenglow" ? 380 : 300;
        this._windFilter.frequency.setTargetAtTime(targetHz, this._ctx.currentTime, 0.4);
      }
    }

    setAmbientMode(mode) {
      this.setAtmosphere(mode);
    }

    /**
     * Tactile construction placement SFX tailored to Alpine Peak categories:
     * - Groomed piste / powder / moguls: crisp corduroy snow swoosh + crunch
     * - Lifts / gondolas / railways: steel truss click + cedar timber thud
     * - Flora / spruce / boulders: snowy pine bough rustle
     * - Frozen lake / thermal spring: crystalline ice glint / spring bubble
     * - Town chalets / hotels / walkways / amenities: warm Swiss larch marimba *tok*
     */
    playPlace(category = "structure") {
      if (!this._canPlay()) return;
      if (this._throttled("build_sfx", 55)) return;
      this._playPlaceImmediate(category);
    }

    _playPlaceImmediate(category = "structure") {
      try {
        const ctx = this._ctx;
        const now = ctx.currentTime;
        const cat = String(category || "structure").toLowerCase();

        if (
          cat.includes("piste") ||
          cat.includes("powder") ||
          cat.includes("mogul") ||
          cat.includes("snow") ||
          cat.includes("groom")
        ) {
          this.playCarve(0.75, true);
          return;
        }

        if (cat.includes("helipad") || cat.includes("heli")) {
          this.playHeliRotor(true);
          return;
        }

        if (cat.includes("sleigh") || cat.includes("christmas") || cat.includes("garland") || cat.includes("holiday_tree")) {
          this.playSleighBells(true);
        } else if (cat.includes("alphorn")) {
          this.playAlphorn(true);
          return;
        } else if (cat.includes("firework") || cat.includes("mortar")) {
          this.playFireworkBurst(true);
          return;
        } else if (
          cat.includes("carousel") ||
          cat.includes("ferris") ||
          cat.includes("pyramid") ||
          cat.includes("bunting")
        ) {
          this.playCarouselChime(true);
          return;
        } else if (cat.includes("hockey") || cat.includes("curling")) {
          this.playHockeyClack(false, true);
        }

        if (
          cat.includes("lift") ||
          cat.includes("gondola") ||
          cat.includes("chair") ||
          cat.includes("rope_tow") ||
          cat.includes("tbar") ||
          cat.includes("tram") ||
          cat.includes("funicular") ||
          cat.includes("magic_carpet") ||
          cat.includes("train") ||
          cat.includes("rail") ||
          cat.includes("viaduct") ||
          cat.includes("coaster") ||
          cat.includes("skybridge")
        ) {
          this.playLiftClick(true);
        }

        if (
          cat.includes("flora") ||
          cat.includes("spruce") ||
          cat.includes("birch") ||
          cat.includes("larch") ||
          cat.includes("hemlock") ||
          cat.includes("krummholz") ||
          cat.includes("shrub") ||
          cat.includes("tree") ||
          cat.includes("crag") ||
          cat.includes("boulder")
        ) {
          if (this._noiseBuffer) {
            const src = ctx.createBufferSource();
            src.buffer = this._noiseBuffer;
            src.playbackRate.value = 1.0 + Math.random() * 0.25;

            const bp = ctx.createBiquadFilter();
            bp.type = "bandpass";
            bp.Q.value = 1.7;
            bp.frequency.setValueAtTime(950, now);
            bp.frequency.exponentialRampToValueAtTime(2600, now + 0.13);

            const env = ctx.createGain();
            env.gain.setValueAtTime(0.0001, now);
            env.gain.linearRampToValueAtTime(0.22, now + 0.016);
            env.gain.exponentialRampToValueAtTime(0.0008, now + 0.16);

            src.connect(bp);
            bp.connect(env);
            env.connect(this._sfxGain);
            src.start(now, Math.random() * 0.9, 0.18);
          }

          const thud = ctx.createOscillator();
          const tg = ctx.createGain();
          thud.type = "sine";
          thud.frequency.setValueAtTime(168, now);
          thud.frequency.exponentialRampToValueAtTime(92, now + 0.075);
          tg.gain.setValueAtTime(0.11, now);
          tg.gain.exponentialRampToValueAtTime(0.0008, now + 0.085);
          thud.connect(tg);
          tg.connect(this._sfxGain);
          thud.start(now);
          thud.stop(now + 0.095);
          return;
        }

        if (
          cat.includes("lake") ||
          cat.includes("ice") ||
          cat.includes("spring") ||
          cat.includes("brook") ||
          cat.includes("waterfall") ||
          cat.includes("crevasse") ||
          cat.includes("water")
        ) {
          this.playWater();
          return;
        }

        // Warm Swiss chalet larch-wood marimba *tok*
        const idx = this._placeStep % CHALET_WOOD_NOTES.length;
        this._placeStep = (this._placeStep + 1) % CHALET_WOOD_NOTES.length;
        const isGrand = cat.includes("hotel") || cat.includes("landmark") || cat.includes("station");
        const baseFreq =
          CHALET_WOOD_NOTES[idx] * (isGrand ? 0.75 : 1.0) * (0.99 + Math.random() * 0.02);

        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(baseFreq * 1.03, now);
        osc1.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.014);

        gain1.gain.setValueAtTime(0.0001, now);
        gain1.gain.linearRampToValueAtTime(0.23, now + 0.004);
        gain1.gain.exponentialRampToValueAtTime(0.0008, now + (isGrand ? 0.30 : 0.15));

        osc1.connect(gain1);
        gain1.connect(this._sfxGain);
        osc1.start(now);
        osc1.stop(now + 0.32);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(baseFreq * 3.98, now);
        gain2.gain.setValueAtTime(0.085, now);
        gain2.gain.exponentialRampToValueAtTime(0.0006, now + 0.032);

        osc2.connect(gain2);
        gain2.connect(this._sfxGain);
        osc2.start(now);
        osc2.stop(now + 0.04);

        if (isGrand) {
          const fifth = ctx.createOscillator();
          const fg = ctx.createGain();
          fifth.type = "sine";
          fifth.frequency.setValueAtTime(baseFreq * 1.5, now + 0.04);
          fg.gain.setValueAtTime(0.0001, now + 0.04);
          fg.gain.linearRampToValueAtTime(0.13, now + 0.055);
          fg.gain.exponentialRampToValueAtTime(0.0008, now + 0.38);
          fifth.connect(fg);
          fg.connect(this._sfxGain);
          fifth.start(now + 0.04);
          fifth.stop(now + 0.4);
        }
      } catch (_) {}
    }

    playBuild(category = "structure") {
      if (!this._canPlay()) return;
      if (this._throttled("build_sfx", 55)) return;
      this._playPlaceImmediate(category);
    }

    /**
     * Mountain granite & snowpack sculpting resonance (`"raise"`, `"lower"`, `"level"`).
     */
    playSculpt(upDown = "raise") {
      if (!this._canPlay()) return;
      if (this._throttled("build_sfx", 55)) return;
      try {
        const ctx = this._ctx;
        const now = ctx.currentTime;
        const isLower =
          upDown === "lower" || upDown === "down" || upDown === -1 || upDown === false;
        const isLevel = upDown === "level" || upDown === 0;

        const startF = isLevel ? 190 : isLower ? 235 : 148;
        const endF = isLevel ? 202 : isLower ? 136 : 258;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(startF, now);
        osc.frequency.exponentialRampToValueAtTime(endF, now + 0.11);

        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.setValueAtTime(560, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.19, now + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.14);

        osc.connect(lp);
        lp.connect(gain);
        gain.connect(this._sfxGain);
        osc.start(now);
        osc.stop(now + 0.15);

        // Crisp snow-pack crunch layer
        if (this._noiseBuffer) {
          const nSrc = ctx.createBufferSource();
          nSrc.buffer = this._noiseBuffer;
          const bp = ctx.createBiquadFilter();
          bp.type = "bandpass";
          bp.frequency.setValueAtTime(isLower ? 900 : 1450, now);
          bp.Q.value = 1.8;

          const nGain = ctx.createGain();
          nGain.gain.setValueAtTime(0.13, now);
          nGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.09);

          nSrc.connect(bp);
          bp.connect(nGain);
          nGain.connect(this._sfxGain);
          nSrc.start(now, Math.random() * 0.7, 0.1);
        }
      } catch (_) {}
    }

    /**
     * Gentle "shhhk-shhhk" ski-edge snow carve sound!
     */
    playCarve(intensity = 0.5, fromDirectTool = false) {
      if (!this._canPlay(!fromDirectTool)) return;
      if (!fromDirectTool && this._throttled("carve", 650)) return;
      try {
        const ctx = this._ctx;
        const now = ctx.currentTime;
        if (!this._noiseBuffer) return;

        const amp = Math.max(0.04, Math.min(0.22, Number(intensity || 0.5) * (fromDirectTool ? 0.24 : 0.12)));
        const strokes = fromDirectTool
          ? [
              { dt: 0.0, f0: 1550, f1: 2950, dur: 0.11 },
              { dt: 0.065, f0: 1850, f1: 3400, dur: 0.10 },
            ]
          : [
              { dt: 0.0, f0: 1800, f1: 3200, dur: 0.085 },
              { dt: 0.09, f0: 1500, f1: 2650, dur: 0.08 },
            ];

        for (const s of strokes) {
          const t0 = now + s.dt;
          const src = ctx.createBufferSource();
          src.buffer = this._noiseBuffer;
          src.playbackRate.value = 1.05 + Math.random() * 0.2;

          const bp = ctx.createBiquadFilter();
          bp.type = "bandpass";
          bp.Q.value = 2.4;
          bp.frequency.setValueAtTime(s.f0, t0);
          bp.frequency.exponentialRampToValueAtTime(s.f1, t0 + s.dur * 0.65);

          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.linearRampToValueAtTime(amp, t0 + 0.014);
          g.gain.exponentialRampToValueAtTime(0.0006, t0 + s.dur);

          src.connect(bp);
          bp.connect(g);
          g.connect(this._sfxGain);
          src.start(t0, Math.random() * 1.1, s.dur + 0.02);
        }
      } catch (_) {}
    }

    playSkiCarve(intensity) {
      this.playCarve(intensity, false);
    }

    /**
     * Subtle chairlift / gondola bullwheel & pylon grip click.
     */
    playLiftClick(fromDirectTool = false) {
      if (!this._canPlay(!fromDirectTool)) return;
      if (!fromDirectTool && this._throttled("lift", 900)) return;
      try {
        const ctx = this._ctx;
        const now = ctx.currentTime;

        // Crisp double steel sheave click
        for (const [offset, freq, gainVal] of [
          [0.0, 1420, fromDirectTool ? 0.15 : 0.075],
          [0.038, 1890, fromDirectTool ? 0.12 : 0.06],
        ]) {
          const t = now + offset;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, t);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.62, t + 0.022);

          g.gain.setValueAtTime(gainVal, t);
          g.gain.exponentialRampToValueAtTime(0.0006, t + 0.026);
          osc.connect(g);
          g.connect(this._sfxGain);
          osc.start(t);
          osc.stop(t + 0.03);
        }
      } catch (_) {}
    }

    playBullwheel() {
      this.playLiftClick(false);
    }

    /**
     * Warm distant Swiss mountain railway (Bernina / Zermatt) two-tone brass horn + air brake release!
     */
    playTrainArrival() {
      if (!this._canPlay(true)) return;
      if (this._throttled("train", 4500)) return;
      try {
        const ctx = this._ctx;
        const now = ctx.currentTime;

        // Classic Swiss postal/mountain train warm harmonic dyads: [F4+A4] -> [D4+G4]
        const hornChords = [
          { t0: now, dur: 0.34, freqs: [349.23, 440.0] },
          { t0: now + 0.36, dur: 0.46, freqs: [293.66, 392.0] },
        ];

        for (const ch of hornChords) {
          const lp = ctx.createBiquadFilter();
          lp.type = "lowpass";
          lp.frequency.setValueAtTime(960, ch.t0);
          lp.Q.value = 1.1;
          lp.connect(this._sfxGain);

          for (const f of ch.freqs) {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(f * 0.996, ch.t0);
            osc.frequency.linearRampToValueAtTime(f, ch.t0 + 0.03);

            g.gain.setValueAtTime(0.0001, ch.t0);
            g.gain.linearRampToValueAtTime(0.065, ch.t0 + 0.04);
            g.gain.setValueAtTime(0.058, ch.t0 + ch.dur - 0.08);
            g.gain.exponentialRampToValueAtTime(0.0006, ch.t0 + ch.dur);

            osc.connect(g);
            g.connect(lp);
            osc.start(ch.t0);
            osc.stop(ch.t0 + ch.dur + 0.03);
          }
        }

        // Gentle platform air-brake sigh
        if (this._noiseBuffer) {
          const tSigh = now + 0.84;
          const src = ctx.createBufferSource();
          src.buffer = this._noiseBuffer;
          const hp = ctx.createBiquadFilter();
          hp.type = "bandpass";
          hp.frequency.setValueAtTime(2400, tSigh);
          hp.Q.value = 1.5;

          const sg = ctx.createGain();
          sg.gain.setValueAtTime(0.0001, tSigh);
          sg.gain.linearRampToValueAtTime(0.065, tSigh + 0.025);
          sg.gain.exponentialRampToValueAtTime(0.0006, tSigh + 0.24);

          src.connect(hp);
          hp.connect(sg);
          sg.connect(this._sfxGain);
          src.start(tSigh, 0.2, 0.26);
        }
      } catch (_) {}
    }

    playTrainHorn() {
      this.playTrainArrival();
    }

    /**
     * Cozy stone-hearth & firepit crackle when skiers warm up!
     */
    playFireCrackle() {
      if (!this._canPlay(true)) return;
      if (this._throttled("fire", 1400)) return;
      try {
        const ctx = this._ctx;
        const now = ctx.currentTime;
        if (!this._noiseBuffer) return;

        // 4 tiny warm wood-pop impulses
        const pops = [0.0, 0.055, 0.13, 0.21];
        for (const off of pops) {
          const t = now + off + Math.random() * 0.02;
          const src = ctx.createBufferSource();
          src.buffer = this._noiseBuffer;

          const bp = ctx.createBiquadFilter();
          bp.type = "bandpass";
          bp.frequency.setValueAtTime(1200 + Math.random() * 1400, t);
          bp.Q.value = 3.2;

          const g = ctx.createGain();
          g.gain.setValueAtTime(0.09 + Math.random() * 0.05, t);
          g.gain.exponentialRampToValueAtTime(0.0007, t + 0.024);

          src.connect(bp);
          bp.connect(g);
          g.connect(this._sfxGain);
          src.start(t, Math.random() * 1.4, 0.03);
        }
      } catch (_) {}
    }

    playWarmth() {
      this.playFireCrackle();
    }

    /**
     * Charming chalet shop door-bell & brass register chime on ticket/rental/café sales!
     */
    playCash(amount = 25) {
      if (!this._canPlay(true)) return;
      if (this._throttled("cash", 360)) return;
      try {
        const ctx = this._ctx;
        const now = ctx.currentTime;
        const hiPitch = Number(amount) >= 40 ? 1.12 : 1.0;
        const notes = [987.77 * hiPitch, 1318.51 * hiPitch]; // B5 -> E6 brass shop bell

        notes.forEach((freq, idx) => {
          const t = now + idx * 0.055;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t);

          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(0.095, t + 0.005);
          g.gain.exponentialRampToValueAtTime(0.0006, t + 0.24);

          osc.connect(g);
          g.connect(this._sfxGain);
          osc.start(t);
          osc.stop(t + 0.26);
        });
      } catch (_) {}
    }

    playSale(amount) {
      this.playCash(amount);
    }

    playCoin(amount) {
      this.playCash(amount);
    }

    /**
     * Freestyle terrain-park kicker / rail jump pop + crystalline landing sparkle!
     */
    playTrick() {
      if (!this._canPlay(true)) return;
      try {
        const ctx = this._ctx;
        const now = ctx.currentTime;
        const sparkle = [783.99, 1046.5, 1567.98]; // G5 -> C6 -> G6
        sparkle.forEach((freq, i) => {
          const t = now + i * 0.045;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t);
          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(0.085, t + 0.006);
          g.gain.exponentialRampToValueAtTime(0.0006, t + 0.22);
          osc.connect(g);
          g.connect(this._sfxGain);
          osc.start(t);
          osc.stop(t + 0.24);
        });
      } catch (_) {}
    }

    /**
     * Crystalline frozen-lake glint + thermal hot-spring bubble.
     */
    playWater() {
      if (!this._canPlay()) return;
      try {
        const ctx = this._ctx;
        const now = ctx.currentTime;
        const glints = [
          { delay: 0.0, f0: 520, f1: 1046.5, amp: 0.12 },
          { delay: 0.05, f0: 659.25, f1: 1318.51, amp: 0.10 },
        ];
        for (const d of glints) {
          const t0 = now + d.delay;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(d.f0, t0);
          osc.frequency.exponentialRampToValueAtTime(d.f1, t0 + 0.08);
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.linearRampToValueAtTime(d.amp, t0 + 0.008);
          g.gain.exponentialRampToValueAtTime(0.0007, t0 + 0.14);
          osc.connect(g);
          g.connect(this._sfxGain);
          osc.start(t0);
          osc.stop(t0 + 0.16);
        }
      } catch (_) {}
    }

    playIce() {
      this.playWater();
    }

    /**
     * Shimmering brass sleigh-bell jingle cluster for Horse Sleigh tours & Christmas Market!
     */
    playSleighBells(fromDirectTool = false) {
      if (!this._canPlay(!fromDirectTool)) return;
      if (!fromDirectTool && this._throttled("sleigh_bells", 2800)) return;
      try {
        const ctx = this._ctx;
        const now = ctx.currentTime;
        const shakes = [0.0, 0.095, 0.19];
        const bellFreqs = [2637.02, 3135.96, 3951.07]; // E7, G7, B7 silver jingles
        const baseAmp = fromDirectTool ? 0.052 : 0.032;

        for (const dt of shakes) {
          const t0 = now + dt;
          for (let i = 0; i < bellFreqs.length; i++) {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(bellFreqs[i] * (0.995 + Math.random() * 0.01), t0);
            g.gain.setValueAtTime(0.0001, t0);
            g.gain.linearRampToValueAtTime(baseAmp / (1 + i * 0.35), t0 + 0.005);
            g.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.13);
            osc.connect(g);
            g.connect(this._sfxGain);
            osc.start(t0);
            osc.stop(t0 + 0.14);
          }
        }
      } catch (_) {}
    }

    /**
     * Warm pastoral Swiss wooden Alphorn harmonic chord (`F3 - C4 - F4 - A4`) for village stages!
     */
    playAlphorn(fromDirectTool = false) {
      if (!this._canPlay(!fromDirectTool)) return;
      if (!fromDirectTool && this._throttled("alphorn", 6500)) return;
      try {
        const ctx = this._ctx;
        const now = ctx.currentTime;
        const notes = [
          { freq: 174.61, delay: 0.0, amp: fromDirectTool ? 0.095 : 0.055 },  // F3
          { freq: 261.63, delay: 0.12, amp: fromDirectTool ? 0.085 : 0.048 }, // C4
          { freq: 349.23, delay: 0.24, amp: fromDirectTool ? 0.075 : 0.042 }, // F4
          { freq: 440.0, delay: 0.36, amp: fromDirectTool ? 0.07 : 0.038 },   // A4
        ];

        for (const n of notes) {
          const t0 = now + n.delay;
          const osc = ctx.createOscillator();
          const lp = ctx.createBiquadFilter();
          const g = ctx.createGain();

          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(n.freq * 0.992, t0);
          osc.frequency.exponentialRampToValueAtTime(n.freq, t0 + 0.08);

          lp.type = "lowpass";
          lp.frequency.setValueAtTime(640, t0);
          lp.Q.value = 1.6;

          g.gain.setValueAtTime(0.0001, t0);
          g.gain.linearRampToValueAtTime(n.amp, t0 + 0.11);
          g.gain.exponentialRampToValueAtTime(0.0006, t0 + 1.05);

          osc.connect(lp);
          lp.connect(g);
          g.connect(this._sfxGain);
          osc.start(t0);
          osc.stop(t0 + 1.1);
        }
      } catch (_) {}
    }

    /**
     * Crisp ash-wood hockey stick *clack* on vulcanized puck + optional brass pond-hockey goal cheer!
     */
    playHockeyClack(isGoal = false, fromDirectTool = false) {
      if (!this._canPlay(!fromDirectTool)) return;
      if (!fromDirectTool && this._throttled(isGoal ? "hockey_goal" : "hockey_clack", isGoal ? 2200 : 1200)) return;
      try {
        const ctx = this._ctx;
        const now = ctx.currentTime;

        // Crisp wooden stick clack
        if (this._noiseBuffer) {
          const src = ctx.createBufferSource();
          src.buffer = this._noiseBuffer;
          const bp = ctx.createBiquadFilter();
          bp.type = "bandpass";
          bp.frequency.setValueAtTime(1920, now);
          bp.Q.value = 4.2;

          const g = ctx.createGain();
          g.gain.setValueAtTime(fromDirectTool ? 0.18 : 0.10, now);
          g.gain.exponentialRampToValueAtTime(0.0008, now + 0.028);

          src.connect(bp);
          bp.connect(g);
          g.connect(this._sfxGain);
          src.start(now, Math.random() * 0.8, 0.035);
        }

        const wood = ctx.createOscillator();
        const wg = ctx.createGain();
        wood.type = "triangle";
        wood.frequency.setValueAtTime(420, now);
        wood.frequency.exponentialRampToValueAtTime(190, now + 0.032);
        wg.gain.setValueAtTime(fromDirectTool ? 0.11 : 0.065, now);
        wg.gain.exponentialRampToValueAtTime(0.0008, now + 0.036);
        wood.connect(wg);
        wg.connect(this._sfxGain);
        wood.start(now);
        wood.stop(now + 0.04);

        if (isGoal) {
          // Joyful 2-note pond-hockey goal bell!
          [587.33, 880.0].forEach((freq, idx) => {
            const t = now + 0.05 + idx * 0.08;
            const bell = ctx.createOscillator();
            const bg = ctx.createGain();
            bell.type = "triangle";
            bell.frequency.setValueAtTime(freq, t);
            bg.gain.setValueAtTime(0.0001, t);
            bg.gain.linearRampToValueAtTime(0.085, t + 0.01);
            bg.gain.exponentialRampToValueAtTime(0.0006, t + 0.34);
            bell.connect(bg);
            bg.connect(this._sfxGain);
            bell.start(t);
            bell.stop(t + 0.36);
          });
        }
      } catch (_) {}
    }

    /**
     * Rhythmic summit VIP helicopter rotor blade *whop-whop-whop* + subtle turbine whine!
     */
    playHeliRotor(fromDirectTool = false) {
      if (!this._canPlay(!fromDirectTool)) return;
      if (!fromDirectTool && this._throttled("heli_rotor", 5000)) return;
      try {
        const ctx = this._ctx;
        const now = ctx.currentTime;
        if (!this._noiseBuffer) return;

        const pulses = 8;
        const period = 0.072; // ~13.9 Hz blade pass cadence
        const peakAmp = fromDirectTool ? 0.13 : 0.075;

        for (let i = 0; i < pulses; i++) {
          const t0 = now + i * period;
          const envShape = Math.sin(((i + 0.5) / pulses) * Math.PI);
          const src = ctx.createBufferSource();
          src.buffer = this._noiseBuffer;

          const bp = ctx.createBiquadFilter();
          bp.type = "bandpass";
          bp.frequency.setValueAtTime(175 + i * 8, t0);
          bp.Q.value = 1.9;

          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.linearRampToValueAtTime(Math.max(0.01, peakAmp * envShape), t0 + 0.016);
          g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.062);

          src.connect(bp);
          bp.connect(g);
          g.connect(this._sfxGain);
          src.start(t0, (i * 0.17) % 1.2, 0.068);
        }

        // Subtle high-altitude turbine spool whistle
        const turb = ctx.createOscillator();
        const tg = ctx.createGain();
        turb.type = "sine";
        turb.frequency.setValueAtTime(1320, now);
        turb.frequency.exponentialRampToValueAtTime(1080, now + pulses * period);
        tg.gain.setValueAtTime(0.0001, now);
        tg.gain.linearRampToValueAtTime(fromDirectTool ? 0.024 : 0.014, now + 0.08);
        tg.gain.exponentialRampToValueAtTime(0.0004, now + pulses * period + 0.06);
        turb.connect(tg);
        tg.connect(this._sfxGain);
        turb.start(now);
        turb.stop(now + pulses * period + 0.08);
      } catch (_) {}
    }

    /**
     * Soft playful snow *poof* for village snowball fights & granite curling clink.
     */
    playSnowballPop() {
      if (!this._canPlay(true)) return;
      if (this._throttled("snowball_pop", 1600)) return;
      try {
        const ctx = this._ctx;
        const now = ctx.currentTime;
        if (!this._noiseBuffer) return;
        const src = ctx.createBufferSource();
        src.buffer = this._noiseBuffer;
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.setValueAtTime(920, now);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.055, now);
        g.gain.exponentialRampToValueAtTime(0.0006, now + 0.055);
        src.connect(lp);
        lp.connect(g);
        g.connect(this._sfxGain);
        src.start(now, Math.random() * 0.9, 0.065);
      } catch (_) {}
    }

    /**
     * Uplifting 5-note Alpine Glockenspiel & warm Alphorn fifth fanfare on Resort Milestones!
     */
    playMilestone() {
      if (!this._canPlay()) return;
      try {
        const ctx = this._ctx;
        const now = ctx.currentTime;
        // C5 -> E5 -> G5 -> B5 -> D6 sparkling glockenspiel arpeggio
        const notes = [523.25, 659.25, 783.99, 987.77, 1174.66];

        // Warm Alphorn C4 + G4 fifth foundation
        for (const hornFreq of [261.63, 392.0]) {
          const horn = ctx.createOscillator();
          const hLp = ctx.createBiquadFilter();
          const hg = ctx.createGain();
          horn.type = "triangle";
          horn.frequency.setValueAtTime(hornFreq, now);
          hLp.type = "lowpass";
          hLp.frequency.setValueAtTime(720, now);

          hg.gain.setValueAtTime(0.0001, now);
          hg.gain.linearRampToValueAtTime(0.09, now + 0.06);
          hg.gain.exponentialRampToValueAtTime(0.0006, now + 0.85);

          horn.connect(hLp);
          hLp.connect(hg);
          hg.connect(this._sfxGain);
          horn.start(now);
          horn.stop(now + 0.9);
        }

        notes.forEach((freq, i) => {
          const t = now + i * 0.068;

          const bell = ctx.createOscillator();
          const g = ctx.createGain();
          bell.type = "sine";
          bell.frequency.setValueAtTime(freq, t);

          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(0.16 - i * 0.012, t + 0.006);
          g.gain.exponentialRampToValueAtTime(0.0006, t + 0.65);

          bell.connect(g);
          g.connect(this._sfxGain);
          bell.start(t);
          bell.stop(t + 0.7);

          // Crisp silver glockenspiel octave shimmer
          const over = ctx.createOscillator();
          const og = ctx.createGain();
          over.type = "triangle";
          over.frequency.setValueAtTime(freq * 2.0, t);

          og.gain.setValueAtTime(0.0001, t);
          og.gain.linearRampToValueAtTime(0.055, t + 0.004);
          og.gain.exponentialRampToValueAtTime(0.0005, t + 0.24);

          over.connect(og);
          og.connect(this._sfxGain);
          over.start(t);
          over.stop(t + 0.26);
        });
      } catch (_) {}
    }

    /** Aliases for UI / Challenge / Legacy hooks. */
    playDiscovery() {
      this.playMilestone();
    }

    playChallengeComplete() {
      this.playMilestone();
    }

    playFanfare() {
      this.playFestivalFanfare();
    }

    playBounty() {
      this.playMilestone();
    }

    /**
     * Zero-GC, rate-limited Alpine Firework Mortar Launch & Crystalline Starburst (`playFireworkBurst`).
     * Synthesizes a quick rising mortar whistle, warm valley chest-thump, powdery crackle pops,
     * and a shimmering high celesta star-cluster without clipping during multi-salvo finales!
     */
    playFireworkBurst(force = false) {
      if (!this._canPlay(!force)) return;
      if (!force && this._throttled("firework", 95)) return;
      try {
        const ctx = this._ctx;
        const now = ctx.currentTime;

        // 1. Short rising whistle grace (`0.00 -> 0.065s`)
        const whistle = ctx.createOscillator();
        const wg = ctx.createGain();
        whistle.type = "sine";
        whistle.frequency.setValueAtTime(580, now);
        whistle.frequency.exponentialRampToValueAtTime(1680, now + 0.065);
        wg.gain.setValueAtTime(0.0001, now);
        wg.gain.linearRampToValueAtTime(0.042, now + 0.012);
        wg.gain.exponentialRampToValueAtTime(0.0006, now + 0.07);
        whistle.connect(wg);
        wg.connect(this._sfxGain);
        whistle.start(now);
        whistle.stop(now + 0.075);

        // 2. Warm alpine valley sky-shell thump (`t + 0.055s`)
        const tBurst = now + 0.055;
        const boom = ctx.createOscillator();
        const bg = ctx.createGain();
        boom.type = "sine";
        boom.frequency.setValueAtTime(148, tBurst);
        boom.frequency.exponentialRampToValueAtTime(46, tBurst + 0.24);
        bg.gain.setValueAtTime(0.0001, tBurst);
        bg.gain.linearRampToValueAtTime(0.18, tBurst + 0.008);
        bg.gain.exponentialRampToValueAtTime(0.0007, tBurst + 0.28);
        boom.connect(bg);
        bg.connect(this._sfxGain);
        boom.start(tBurst);
        boom.stop(tBurst + 0.3);

        // 3. Crisp chrysanthemum crackle pops from pre-allocated noise buffer
        if (this._noiseBuffer) {
          for (let i = 0; i < FIREWORK_CRACKLE_OFFSETS.length; i++) {
            const tPop = now + FIREWORK_CRACKLE_OFFSETS[i];
            const src = ctx.createBufferSource();
            src.buffer = this._noiseBuffer;
            const bp = ctx.createBiquadFilter();
            bp.type = "bandpass";
            bp.frequency.setValueAtTime(1950 + i * 620, tPop);
            bp.Q.value = 2.1;
            const ng = ctx.createGain();
            ng.gain.setValueAtTime(0.12 - i * 0.022, tPop);
            ng.gain.exponentialRampToValueAtTime(0.0007, tPop + 0.085);
            src.connect(bp);
            bp.connect(ng);
            ng.connect(this._sfxGain);
            src.start(tPop, (i * 0.37) % 1.4, 0.1);
          }
        }

        // 4. Shimmering celesta star-cluster triad
        const chord = FIREWORK_STAR_CHORDS[this._fireworkStep % FIREWORK_STAR_CHORDS.length];
        this._fireworkStep = (this._fireworkStep + 1) % FIREWORK_STAR_CHORDS.length;
        for (let i = 0; i < chord.length; i++) {
          const tStar = tBurst + 0.02 + i * 0.032;
          const star = ctx.createOscillator();
          const sg = ctx.createGain();
          star.type = "sine";
          star.frequency.setValueAtTime(chord[i], tStar);
          sg.gain.setValueAtTime(0.0001, tStar);
          sg.gain.linearRampToValueAtTime(0.052, tStar + 0.006);
          sg.gain.exponentialRampToValueAtTime(0.0005, tStar + 0.32);
          star.connect(sg);
          sg.connect(this._sfxGain);
          star.start(tStar);
          star.stop(tStar + 0.34);
        }
      } catch (_) {}
    }

    /**
     * Celebratory Winter Festival Finale Fanfare (`playFestivalFanfare`):
     * Warm Swiss Alphorn brass fifth swell crowned with an ascending 5-note glockenspiel chord!
     */
    playFestivalFanfare(force = false) {
      if (!this._canPlay(!force)) return;
      if (!force && this._throttled("fanfare", 1100)) return;
      try {
        const ctx = this._ctx;
        const now = ctx.currentTime;

        // 1. Warm lowpass-filtered Swiss Alphorn brass call (`D4 -> A4 -> D5`)
        for (let i = 0; i < FESTIVAL_FANFARE_BRASS.length; i++) {
          const entry = FESTIVAL_FANFARE_BRASS[i];
          const freq = entry[0];
          const t0 = now + entry[1];
          const dur = entry[2];

          const horn = ctx.createOscillator();
          const lp = ctx.createBiquadFilter();
          const hg = ctx.createGain();
          horn.type = "triangle";
          horn.frequency.setValueAtTime(freq * 0.992, t0);
          horn.frequency.linearRampToValueAtTime(freq, t0 + 0.035);
          lp.type = "lowpass";
          lp.frequency.setValueAtTime(freq * 2.6, t0);
          lp.Q.value = 1.1;

          hg.gain.setValueAtTime(0.0001, t0);
          hg.gain.linearRampToValueAtTime(0.115, t0 + 0.04);
          hg.gain.exponentialRampToValueAtTime(0.0007, t0 + dur);

          horn.connect(lp);
          lp.connect(hg);
          hg.connect(this._sfxGain);
          horn.start(t0);
          horn.stop(t0 + dur + 0.03);
        }

        // 2. Sparkling Winter Festival glockenspiel cascade
        for (let i = 0; i < FESTIVAL_FANFARE_BELLS.length; i++) {
          const tBell = now + 0.14 + i * 0.072;
          const bell = ctx.createOscillator();
          const bg = ctx.createGain();
          bell.type = "sine";
          bell.frequency.setValueAtTime(FESTIVAL_FANFARE_BELLS[i], tBell);
          bg.gain.setValueAtTime(0.0001, tBell);
          bg.gain.linearRampToValueAtTime(i === FESTIVAL_FANFARE_BELLS.length - 1 ? 0.11 : 0.082, tBell + 0.006);
          bg.gain.exponentialRampToValueAtTime(0.0005, tBell + 0.68);
          bell.connect(bg);
          bg.connect(this._sfxGain);
          bell.start(tBell);
          bell.stop(tBell + 0.72);
        }
      } catch (_) {}
    }

    /**
     * Charming Vintage Wooden Carousel Calliope & Music-Box Waltz Chime (`playCarouselChime`).
     */
    playCarouselChime(force = false) {
      if (!this._canPlay(!force)) return;
      if (!force && this._throttled("carousel", 420)) return;
      try {
        const ctx = this._ctx;
        const now = ctx.currentTime;
        const phrase = CAROUSEL_WALTZ_PHRASES[this._carouselStep % CAROUSEL_WALTZ_PHRASES.length];
        this._carouselStep = (this._carouselStep + 1) % CAROUSEL_WALTZ_PHRASES.length;

        for (let i = 0; i < phrase.length; i++) {
          const freq = phrase[i];
          const t0 = now + i * 0.085;

          // Warm wooden pipe-organ fundamental (`triangle`) + music-box tine (`sine` 2x)
          const pipe = ctx.createOscillator();
          const pg = ctx.createGain();
          pipe.type = "triangle";
          pipe.frequency.setValueAtTime(freq, t0);
          pg.gain.setValueAtTime(0.0001, t0);
          pg.gain.linearRampToValueAtTime(i === 0 ? 0.095 : 0.072, t0 + 0.008);
          pg.gain.exponentialRampToValueAtTime(0.0006, t0 + 0.34);
          pipe.connect(pg);
          pg.connect(this._sfxGain);
          pipe.start(t0);
          pipe.stop(t0 + 0.36);

          const tine = ctx.createOscillator();
          const tg = ctx.createGain();
          tine.type = "sine";
          tine.frequency.setValueAtTime(freq * 2.0, t0);
          tg.gain.setValueAtTime(0.0001, t0);
          tg.gain.linearRampToValueAtTime(0.036, t0 + 0.004);
          tg.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.2);
          tine.connect(tg);
          tg.connect(this._sfxGain);
          tine.start(t0);
          tine.stop(t0 + 0.22);
        }
      } catch (_) {}
    }

    /**
     * Crisp SLR camera shutter click + ice-crystal sparkle for 1:1 Diorama PNG Snapshot.
     */
    playShutter() {
      if (!this._canPlay()) return;
      try {
        const ctx = this._ctx;
        const now = ctx.currentTime;
        if (this._noiseBuffer) {
          for (const [offset, freq, amp] of [
            [0.0, 2600, 0.26],
            [0.034, 3400, 0.20],
          ]) {
            const t = now + offset;
            const clickSrc = ctx.createBufferSource();
            clickSrc.buffer = this._noiseBuffer;
            const bp = ctx.createBiquadFilter();
            bp.type = "bandpass";
            bp.frequency.setValueAtTime(freq, t);
            bp.Q.value = 2.2;

            const cg = ctx.createGain();
            cg.gain.setValueAtTime(amp, t);
            cg.gain.exponentialRampToValueAtTime(0.001, t + 0.016);

            clickSrc.connect(bp);
            bp.connect(cg);
            cg.connect(this._sfxGain);
            clickSrc.start(t, 0.1, 0.025);
          }
        }

        [1318.51, 1975.53].forEach((freq, idx) => {
          const t = now + 0.055 + idx * 0.055;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t);
          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(0.09, t + 0.006);
          g.gain.exponentialRampToValueAtTime(0.0006, t + 0.24);
          osc.connect(g);
          g.connect(this._sfxGain);
          osc.start(t);
          osc.stop(t + 0.26);
        });
      } catch (_) {}
    }

    playBulldoze() {
      this.playSculpt("lower");
    }

    playDemolish() {
      this.playSculpt("lower");
    }

    playClick() {
      if (!this._canPlay()) return;
      try {
        const ctx = this._ctx;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(720, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.024);
        g.gain.setValueAtTime(0.06, now);
        g.gain.exponentialRampToValueAtTime(0.0008, now + 0.03);
        osc.connect(g);
        g.connect(this._sfxGain);
        osc.start(now);
        osc.stop(now + 0.035);
      } catch (_) {}
    }

    playError() {
      if (!this._canPlay()) return;
      try {
        const ctx = this._ctx;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(195, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.11);
        g.gain.setValueAtTime(0.11, now);
        g.gain.exponentialRampToValueAtTime(0.0008, now + 0.13);
        osc.connect(g);
        g.connect(this._sfxGain);
        osc.start(now);
        osc.stop(now + 0.14);
      } catch (_) {}
    }

    /**
     * Whisper-quiet LFO alpine summit wind + crystalline winter sleigh-chime harmonic pad.
     */
    _startAmbientLoop() {
      if (!this._ctx || !this._ambientGain || this._windSource) return;
      try {
        const ctx = this._ctx;
        if (this._noiseBuffer) {
          const src = ctx.createBufferSource();
          src.buffer = this._noiseBuffer;
          src.loop = true;

          const lp = ctx.createBiquadFilter();
          lp.type = "lowpass";
          lp.frequency.value = 440;
          lp.Q.value = 0.85;

          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.type = "sine";
          lfo.frequency.value = 0.085; // ~11.8s gentle summit breeze swell
          lfoGain.gain.value = 155;
          lfo.connect(lfoGain);
          lfoGain.connect(lp.frequency);

          const windGain = ctx.createGain();
          windGain.gain.value = 0.11;

          src.connect(lp);
          lp.connect(windGain);
          windGain.connect(this._ambientGain);

          src.start();
          lfo.start();
          this._windSource = src;
          this._windFilter = lp;
          this._windLfo = lfo;
        }

        const scheduleSleighChime = () => {
          const waitMs = 5200 + Math.random() * 5400;
          this._chimeTimer = setTimeout(() => {
            this._playSoftSleighChime();
            scheduleSleighChime();
          }, waitMs);
        };
        scheduleSleighChime();
      } catch (_) {}
    }

    _playSoftSleighChime() {
      if (this.isMuted || !this._ctx || !this._ambientGain) return;
      if (this._ctx.state !== "running") return;
      try {
        const ctx = this._ctx;
        const now = ctx.currentTime;
        const scale = WINTER_CHIME_SCALES[this.atmosphere] || WINTER_CHIME_SCALES.day;
        const f1 = scale[Math.floor(Math.random() * scale.length)];
        const f2 = scale[(Math.floor(Math.random() * scale.length) + 2) % scale.length];

        [
          { f: f1, dt: 0.0, amp: 0.14 },
          { f: f2, dt: 0.16, amp: 0.09 },
        ].forEach(({ f, dt, amp }) => {
          const t = now + dt;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(f, t);

          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(amp, t + 0.035);
          g.gain.exponentialRampToValueAtTime(0.0006, t + 1.65);

          osc.connect(g);
          g.connect(this._ambientGain);
          osc.start(t);
          osc.stop(t + 1.7);
        });
      } catch (_) {}
    }

    destroy() {
      if (this._chimeTimer) {
        clearTimeout(this._chimeTimer);
        this._chimeTimer = null;
      }
      try {
        if (this._windSource) this._windSource.stop();
        if (this._windLfo) this._windLfo.stop();
        if (this._ctx && this._ctx.state !== "closed") this._ctx.close();
      } catch (_) {}
      this._windSource = null;
      this._windFilter = null;
      this._windLfo = null;
      this._ctx = null;
    }
  }

  SanctuaryAudio.create = function (options) {
    return new SanctuaryAudio(options);
  };

  global.SanctuaryAudio = SanctuaryAudio;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = SanctuaryAudio;
  }
})(typeof window !== "undefined" ? window : globalThis);

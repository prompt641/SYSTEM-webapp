/* =========================================================================
   SYSTEM — SOUND
   Procedural WebAudio SFX (futuristic / holographic), zero audio assets.
   ========================================================================= */
window.SYS = window.SYS || {};

SYS.Sound = (function () {
  let ctx = null;
  let enabled = false;      // user preference (persisted in settings)
  let unlocked = false;     // audio context resumed by a user gesture

  function init(pref) {
    enabled = !!pref;
  }

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
    }
    return ctx;
  }

  /* Called from any user gesture so autoplay policy is satisfied. */
  function unlock() {
    const c = ensureCtx();
    if (!c) return;
    if (c.state === 'suspended') c.resume().catch(() => {});
    unlocked = true;
  }

  function setEnabled(v) {
    enabled = !!v;
    if (enabled) unlock();
  }

  function isEnabled() { return enabled; }
  function isUnlocked() { return unlocked; }

  /* --- tiny synth engine ---------------------------------------------- */
  function tone({ f = 440, f2 = null, t = 0, dur = 0.15, type = 'sine', vol = 0.18, curve = 'exp' }) {
    const c = ensureCtx();
    if (!c) return;
    const now = c.currentTime + t;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f, now);
    if (f2) {
      if (curve === 'exp') osc.frequency.exponentialRampToValueAtTime(Math.max(1, f2), now + dur);
      else osc.frequency.linearRampToValueAtTime(f2, now + dur);
    }
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + Math.min(0.02, dur * 0.25));
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g).connect(c.destination);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  }

  function noise({ t = 0, dur = 0.2, vol = 0.08, hp = 800 }) {
    const c = ensureCtx();
    if (!c) return;
    const now = c.currentTime + t;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filt = c.createBiquadFilter();
    filt.type = 'highpass';
    filt.frequency.value = hp;
    const g = c.createGain();
    g.gain.value = vol;
    src.connect(filt).connect(g).connect(c.destination);
    src.start(now);
  }

  const sounds = {
    click: () => { tone({ f: 1400, f2: 900, dur: 0.05, type: 'square', vol: 0.05 }); },
    hover: () => { tone({ f: 2200, dur: 0.03, type: 'sine', vol: 0.02 }); },
    exp:   () => { tone({ f: 880, f2: 1320, dur: 0.1, type: 'triangle', vol: 0.12 }); },
    quest: () => {
      tone({ f: 660, dur: 0.09, type: 'triangle', vol: 0.16 });
      tone({ f: 990, t: 0.09, dur: 0.1, type: 'triangle', vol: 0.16 });
      tone({ f: 1320, t: 0.18, dur: 0.16, type: 'sine', vol: 0.14 });
      noise({ t: 0.18, dur: 0.25, vol: 0.05, hp: 3000 });
    },
    habit: () => { tone({ f: 1046, dur: 0.07, type: 'sine', vol: 0.12 }); tone({ f: 1568, t: 0.07, dur: 0.1, type: 'sine', vol: 0.1 }); },
    levelup: () => {
      [523, 659, 784, 1046].forEach((f, i) => tone({ f, t: i * 0.09, dur: 0.3, type: 'triangle', vol: 0.16 }));
      tone({ f: 130, f2: 65, dur: 0.7, type: 'sawtooth', vol: 0.1 });
      tone({ f: 1568, t: 0.4, dur: 0.5, type: 'sine', vol: 0.12 });
      noise({ t: 0.35, dur: 0.5, vol: 0.07, hp: 2500 });
    },
    achievement: () => {
      [784, 1046, 1318, 1568].forEach((f, i) => tone({ f, t: i * 0.07, dur: 0.35, type: 'sine', vol: 0.13 }));
      noise({ t: 0.25, dur: 0.4, vol: 0.04, hp: 4000 });
    },
    notify: () => { tone({ f: 1200, dur: 0.06, type: 'sine', vol: 0.09 }); tone({ f: 1600, t: 0.07, dur: 0.1, type: 'sine', vol: 0.08 }); },
    error:  () => { tone({ f: 320, f2: 140, dur: 0.28, type: 'sawtooth', vol: 0.13 }); },
    complete: () => { tone({ f: 523, dur: 0.1, type: 'triangle', vol: 0.14 }); tone({ f: 784, t: 0.1, dur: 0.18, type: 'triangle', vol: 0.14 }); }
  };

  function play(name) {
    if (!enabled) return;
    if (!unlocked) return;              // wait until user has interacted
    const fn = sounds[name];
    if (!fn) return;
    try { fn(); } catch (e) { /* audio must never break the app */ }
  }

  return { init, play, setEnabled, isEnabled, isUnlocked, unlock };
})();

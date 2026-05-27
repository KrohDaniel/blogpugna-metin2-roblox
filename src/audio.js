// Procedural Sound Engine — keine externen Asset-Files.
// Web Audio API erzeugt alle Effekte zur Laufzeit.

let ctx = null;
let masterGain = null;
let enabled = localStorage.getItem("blocpugnaSound") !== "off";

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.35;
  masterGain.connect(ctx.destination);
  return ctx;
}

function pulse({ freq = 440, type = "sine", duration = 0.2, attack = 0.005, decay = 0.08, gain = 0.5, freqEnd = null }) {
  if (!enabled) return;
  const c = ensureCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (freqEnd != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), c.currentTime + duration);
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + attack + decay + duration);
  osc.connect(g);
  g.connect(masterGain);
  osc.start();
  osc.stop(c.currentTime + attack + decay + duration + 0.05);
}

function noise({ duration = 0.15, freq = 800, gain = 0.4 } = {}) {
  if (!enabled) return;
  const c = ensureCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume();
  const bufferSize = Math.floor(c.sampleRate * duration);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.06));
  const source = c.createBufferSource();
  source.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = 4;
  const g = c.createGain();
  g.gain.value = gain;
  source.connect(filter);
  filter.connect(g);
  g.connect(masterGain);
  source.start();
}

export const sfx = {
  hit() {
    pulse({ freq: 320, type: "square", duration: 0.06, decay: 0.05, gain: 0.35, freqEnd: 180 });
    noise({ duration: 0.08, freq: 1200, gain: 0.2 });
  },
  crit() {
    pulse({ freq: 720, type: "sawtooth", duration: 0.12, decay: 0.1, gain: 0.5, freqEnd: 380 });
    noise({ duration: 0.1, freq: 1800, gain: 0.32 });
  },
  skill() {
    pulse({ freq: 520, type: "triangle", duration: 0.18, decay: 0.14, gain: 0.4, freqEnd: 880 });
  },
  ulti() {
    pulse({ freq: 110, type: "sawtooth", duration: 0.3, decay: 0.3, gain: 0.55, freqEnd: 60 });
    pulse({ freq: 220, type: "square", duration: 0.25, decay: 0.22, gain: 0.4 });
    noise({ duration: 0.3, freq: 600, gain: 0.4 });
  },
  levelUp() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => pulse({ freq: f, type: "triangle", duration: 0.12, decay: 0.1, gain: 0.45 }), i * 80);
    });
  },
  pickup() {
    pulse({ freq: 880, type: "sine", duration: 0.08, decay: 0.08, gain: 0.3, freqEnd: 1320 });
  },
  potion() {
    pulse({ freq: 420, type: "sine", duration: 0.18, decay: 0.16, gain: 0.4, freqEnd: 640 });
  },
  bossIntro() {
    pulse({ freq: 80, type: "sawtooth", duration: 0.6, decay: 0.5, gain: 0.55 });
    pulse({ freq: 160, type: "square", duration: 0.5, decay: 0.4, gain: 0.4 });
    noise({ duration: 0.7, freq: 250, gain: 0.45 });
  },
  bossPhase() {
    pulse({ freq: 220, type: "sawtooth", duration: 0.3, decay: 0.25, gain: 0.5, freqEnd: 440 });
    noise({ duration: 0.25, freq: 800, gain: 0.3 });
  },
  death() {
    pulse({ freq: 240, type: "sawtooth", duration: 0.6, decay: 0.5, gain: 0.55, freqEnd: 60 });
    noise({ duration: 0.5, freq: 200, gain: 0.4 });
  },
  portal() {
    pulse({ freq: 220, type: "sine", duration: 0.4, decay: 0.35, gain: 0.4, freqEnd: 880 });
    pulse({ freq: 440, type: "triangle", duration: 0.4, decay: 0.35, gain: 0.3, freqEnd: 1320 });
  },
  smithSuccess() {
    [523, 659, 880].forEach((f, i) => setTimeout(() => pulse({ freq: f, type: "triangle", duration: 0.14, decay: 0.12, gain: 0.4 }), i * 70));
  },
  smithFail() {
    pulse({ freq: 320, type: "sawtooth", duration: 0.18, decay: 0.16, gain: 0.5, freqEnd: 140 });
    noise({ duration: 0.18, freq: 400, gain: 0.4 });
  },
  uiClick() {
    pulse({ freq: 880, type: "square", duration: 0.04, decay: 0.04, gain: 0.18 });
  },
};

export function setSoundEnabled(on) {
  enabled = on;
  localStorage.setItem("blocpugnaSound", on ? "on" : "off");
}

export function isSoundEnabled() {
  return enabled;
}

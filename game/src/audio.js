// audio.js — every sound in Emberfall Duel is synthesized with WebAudio:
// no audio files, no network requests. Created lazily on the first
// interaction, because browsers block audio before a gesture.

let audioContext = null;
let muted = false;

/** Start (or resume) the audio context after a user gesture. */
export function ensureAudio() {
  if (typeof window === 'undefined') return;
  if (!audioContext) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    audioContext = new Ctor();
  }
  if (audioContext.state === 'suspended') audioContext.resume();
}

/** Toggle the mute; returns the new state. */
export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, gain, when = 0, slideTo = null) {
  if (!audioContext || muted) return;
  const t0 = audioContext.currentTime + when;
  const osc = audioContext.createOscillator();
  const amp = audioContext.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp);
  amp.connect(audioContext.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/** A soft click when a card is picked up. */
export function playSelectSound() {
  tone(660, 0.08, 'triangle', 0.12);
}

/** A low thump as a creature lands on the table. */
export function playSummonSound() {
  tone(180, 0.16, 'sine', 0.2, 0, 90);
  tone(520, 0.1, 'triangle', 0.1, 0.02);
}

/** A bright chime when a spell resolves. */
export function playSpellSound() {
  tone(880, 0.12, 'sine', 0.14);
  tone(1318, 0.18, 'sine', 0.12, 0.08);
}

/** A short slash when creatures trade blows. */
export function playHitSound() {
  tone(320, 0.09, 'sawtooth', 0.12, 0, 140);
}

/** A warm coin-like turn chime. */
export function playTurnSound() {
  tone(523, 0.1, 'triangle', 0.12);
  tone(784, 0.14, 'triangle', 0.12, 0.09);
}

/** A rising fanfare for victory. */
export function playWinSound() {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, i * 0.11));
}

/** A low falling line for defeat. */
export function playLossSound() {
  [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'sine', 0.14, i * 0.13));
}

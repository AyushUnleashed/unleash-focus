// Padlock sounds, synthesized with Web Audio so there are no audio files.
// Offsets line up with the CSS timings in popup.html.
const LockSounds = (() => {
  let ac;

  function noise(t, dur, freq, q, gain) {
    const len = Math.ceil(ac.sampleRate * dur);
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ac.createGain();
    g.gain.value = gain;
    src.connect(filter).connect(g).connect(ac.destination);
    src.start(t);
  }

  function tone(t, { from, to = from, dur, gain, type = "sine" }) {
    const osc = ac.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  const cues = {
    // Shackle slams home at 180ms (thud + clack + ring), then the latch catches: tick-tock.
    lock(t) {
      tone(t + 0.18, { from: 190, to: 55, dur: 0.16, gain: 0.55 });
      noise(t + 0.18, 0.05, 2600, 1.2, 0.55);
      tone(t + 0.18, { from: 2900, dur: 0.14, gain: 0.05, type: "triangle" });
      noise(t + 0.24, 0.02, 4200, 3, 0.3);
      noise(t + 0.36, 0.03, 3100, 3, 0.45);
    },
    // Latch clicks, then the shackle springs free at 100ms.
    unlock(t) {
      noise(t, 0.02, 4200, 3, 0.3);
      noise(t + 0.1, 0.035, 2200, 1.5, 0.5);
      tone(t + 0.11, { from: 380, to: 1000, dur: 0.2, gain: 0.12, type: "triangle" });
      tone(t + 0.13, { from: 1760, dur: 0.4, gain: 0.035 });
    },
  };

  return {
    play(name) {
      ac ??= new AudioContext();
      cues[name](ac.currentTime + 0.01);
    },
  };
})();

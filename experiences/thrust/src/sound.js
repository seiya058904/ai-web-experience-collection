// A quiet optional mechanical soundscape. No recordings, network or autoplay.
export function createSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) throw new Error('Audio is unavailable in this browser');
  const context = new AudioContext();
  const master = context.createGain(); master.gain.value = 0; master.connect(context.destination);
  const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 450; filter.Q.value = .45;
  const noiseGain = context.createGain(); noiseGain.gain.value = .105; filter.connect(noiseGain); noiseGain.connect(master);
  const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
  const samples = buffer.getChannelData(0); let seed = 7391;
  for (let i = 0; i < samples.length; i++) { seed = (seed * 16807) % 2147483647; samples[i] = ((seed / 2147483647) * 2 - 1) * .6; }
  const source = context.createBufferSource(); source.buffer = buffer; source.loop = true; source.connect(filter); source.start();
  const oscillator = context.createOscillator(); oscillator.type = 'sine'; oscillator.frequency.value = 64;
  const toneGain = context.createGain(); toneGain.gain.value = .013; oscillator.connect(toneGain); toneGain.connect(master); oscillator.start();
  let enabled = false;
  return {
    async setActive(value) { enabled = value; if (value && context.state !== 'running') await context.resume(); master.gain.setTargetAtTime(value ? .45 : 0, context.currentTime, .18); if (!value && context.state === 'running') await context.suspend(); },
    update(p, heat) { if (!enabled || context.state !== 'running') return; filter.frequency.setTargetAtTime(280 + heat * 430 + Math.min(p, 8) * 23, context.currentTime, .35); oscillator.frequency.setTargetAtTime(58 + Math.min(p, 6) * 8, context.currentTime, .45); master.gain.setTargetAtTime(p > 8.7 ? .14 : .45, context.currentTime, .5); },
    dispose() { source.stop(); oscillator.stop(); context.close(); },
  };
}

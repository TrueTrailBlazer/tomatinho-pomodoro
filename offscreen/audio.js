// Gerador Procedural de Áudio com Web Audio API para o Tomatinho Pomodoro
let audioCtx = null;
let currentAmbientNodes = null;
let ambientGainNode = null;
let currentAmbientType = 'off';

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// -------------------------------------------------------------
// Sons de Alarme
// -------------------------------------------------------------

function playZenBell(volume = 0.7) {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Frequência base (Lá 432Hz ou Ré)
  const freqs = [
    { f: 432, gain: 0.8, detune: 0 },
    { f: 864, gain: 0.35, detune: 3 },
    { f: 1296, gain: 0.18, detune: -4 },
    { f: 1728, gain: 0.09, detune: 2 }
  ];

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume * 0.9, now);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
  masterGain.connect(ctx.destination);

  freqs.forEach(item => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(item.f, now);
    osc.detune.setValueAtTime(item.detune, now);

    g.gain.setValueAtTime(item.gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 4.0);

    osc.connect(g);
    g.connect(masterGain);

    osc.start(now);
    osc.stop(now + 4.5);
  });
}

function playGentleBeep(volume = 0.7) {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Acorde suave ascendente: C5 -> E5 -> G5
  const notes = [523.25, 659.25, 783.99];

  notes.forEach((freq, idx) => {
    const noteStart = now + idx * 0.16;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, noteStart);

    gain.gain.setValueAtTime(0.0001, noteStart);
    gain.gain.linearRampToValueAtTime(volume * 0.6, noteStart + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteStart);
    osc.stop(noteStart + 0.85);
  });
}

function playMarimba(volume = 0.7) {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5

  notes.forEach((freq, idx) => {
    const start = now + idx * 0.12;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(volume * 0.7, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + 0.65);
  });
}

function playAlarm(type, volume = 0.7) {
  switch (type) {
    case 'gentle_beep':
      playGentleBeep(volume);
      break;
    case 'marimba':
      playMarimba(volume);
      break;
    case 'zen_bell':
    default:
      playZenBell(volume);
      break;
  }
}

// -------------------------------------------------------------
// Sons Ambientes Contínuos (Ruído Branco, Chuva, Ondas)
// -------------------------------------------------------------

function stopAmbient() {
  if (currentAmbientNodes) {
    try {
      if (currentAmbientNodes.source) {
        currentAmbientNodes.source.stop();
        currentAmbientNodes.source.disconnect();
      }
      if (currentAmbientNodes.lfo) {
        currentAmbientNodes.lfo.stop();
        currentAmbientNodes.lfo.disconnect();
      }
    } catch (e) {
      console.warn('Erro ao interromper som ambiente:', e);
    }
    currentAmbientNodes = null;
  }
  currentAmbientType = 'off';
}

function createNoiseBuffer(ctx, type = 'pink') {
  const bufferSize = ctx.sampleRate * 4; // 4 segundos de loop
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;

      if (type === 'brownian') {
        lastOut = (lastOut + (0.02 * white)) / 1.02;
        data[i] = lastOut * 3.5;
      } else if (type === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else {
        data[i] = white * 0.3;
      }
    }
  }
  return buffer;
}

function startAmbient(type, volume = 0.5) {
  stopAmbient();

  if (!type || type === 'off') return;

  const ctx = getAudioContext();
  ambientGainNode = ctx.createGain();
  ambientGainNode.gain.setValueAtTime(volume, ctx.currentTime);
  ambientGainNode.connect(ctx.destination);

  let noiseType = 'pink';
  if (type === 'white_noise') noiseType = 'brownian';
  if (type === 'rain') noiseType = 'pink';
  if (type === 'waves') noiseType = 'pink';

  const buffer = createNoiseBuffer(ctx, noiseType);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();

  if (type === 'rain') {
    // Som de chuva: filtro passa-baixa e leve modulação aleatória
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);

    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.7, ctx.currentTime);

    source.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(ambientGainNode);

    source.start();
    currentAmbientNodes = { source, filter, gain: rainGain };
  } else if (type === 'white_noise') {
    // Ruído browniano aquecido para foco
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);

    source.connect(filter);
    filter.connect(ambientGainNode);

    source.start();
    currentAmbientNodes = { source, filter };
  } else if (type === 'waves') {
    // Ondas do mar com filtro e LFO oscilante suave
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, ctx.currentTime);

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // Ciclo lento de 8 segundos por onda

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(350, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    source.connect(filter);
    filter.connect(ambientGainNode);

    lfo.start();
    source.start();
    currentAmbientNodes = { source, filter, lfo, lfoGain };
  }

  currentAmbientType = type;
}

function updateAmbientVolume(volume) {
  if (ambientGainNode && audioCtx) {
    ambientGainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
  }
}

// Escuta de mensagens enviadas pelo Service Worker ou Popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'playAlarm') {
    playAlarm(message.sound, message.volume ?? 0.7);
    sendResponse({ status: 'ok' });
  } else if (message.action === 'setAmbient') {
    startAmbient(message.sound, message.volume ?? 0.5);
    sendResponse({ status: 'ok' });
  } else if (message.action === 'updateAmbientVolume') {
    updateAmbientVolume(message.volume ?? 0.5);
    sendResponse({ status: 'ok' });
  } else if (message.action === 'stopAmbient') {
    stopAmbient();
    sendResponse({ status: 'ok' });
  }
  return true;
});

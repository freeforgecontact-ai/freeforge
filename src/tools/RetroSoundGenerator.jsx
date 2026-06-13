import React, { useState, useRef } from 'react';

const WAVES = ['square', 'triangle', 'sawtooth', 'sine'];
const WAVE_LABEL = { square: 'Carrée', triangle: 'Triangle', sawtooth: 'Dent de scie', sine: 'Sinus' };
const PRESETS = {
  saut: { wave: 'square', freqStart: 220, freqEnd: 740, duration: 0.18, volume: 0.6, noise: 0 },
  piece: { wave: 'square', freqStart: 988, freqEnd: 1319, duration: 0.22, volume: 0.55, noise: 0 },
  laser: { wave: 'sawtooth', freqStart: 1200, freqEnd: 120, duration: 0.3, volume: 0.5, noise: 0 },
  explosion: { wave: 'triangle', freqStart: 200, freqEnd: 40, duration: 0.55, volume: 0.7, noise: 0.8 },
  'power-up': { wave: 'square', freqStart: 300, freqEnd: 1500, duration: 0.5, volume: 0.55, noise: 0 },
};

// Remplit un buffer audio avec l'oscillateur + bruit (rendu manuel, réutilisé pour lecture & WAV)
function renderInto(ctx, p) {
  const dur = Math.max(0.05, p.duration);
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, 0);
  master.gain.exponentialRampToValueAtTime(Math.max(0.001, p.volume), 0.01);
  master.gain.exponentialRampToValueAtTime(0.0001, dur);
  master.connect(ctx.destination);

  const osc = ctx.createOscillator();
  osc.type = p.wave;
  osc.frequency.setValueAtTime(Math.max(1, p.freqStart), 0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, p.freqEnd), dur);
  osc.connect(master);
  osc.start(0); osc.stop(dur);

  if (p.noise > 0) {
    const len = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const ng = ctx.createGain();
    ng.gain.value = p.noise * p.volume * 0.6;
    src.connect(ng); ng.connect(ctx.destination);
    src.start(0);
  }
  return dur;
}

function encodeWav(audioBuffer) {
  const numCh = audioBuffer.numberOfChannels;
  const sr = audioBuffer.sampleRate;
  const len = audioBuffer.length;
  const buffer = new ArrayBuffer(44 + len * numCh * 2);
  const view = new DataView(buffer);
  const wstr = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  wstr(0, 'RIFF'); view.setUint32(4, 36 + len * numCh * 2, true); wstr(8, 'WAVE');
  wstr(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true); view.setUint32(24, sr, true);
  view.setUint32(28, sr * numCh * 2, true); view.setUint16(32, numCh * 2, true);
  view.setUint16(34, 16, true); wstr(36, 'data'); view.setUint32(40, len * numCh * 2, true);
  let off = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < numCh; c++) {
      let s = Math.max(-1, Math.min(1, audioBuffer.getChannelData(c)[i]));
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true); off += 2;
    }
  }
  return new Blob([view], { type: 'audio/wav' });
}

export default function RetroSoundGenerator({ goBack }) {
  const [wave, setWave] = useState('square');
  const [freqStart, setFreqStart] = useState(220);
  const [freqEnd, setFreqEnd] = useState(740);
  const [duration, setDuration] = useState(0.18);
  const [volume, setVolume] = useState(0.6);
  const [noise, setNoise] = useState(0);
  const [busy, setBusy] = useState(false);
  const ctxRef = useRef(null);

  const params = () => ({ wave, freqStart: +freqStart, freqEnd: +freqEnd, duration: +duration, volume: +volume, noise: +noise });

  const applyPreset = (key) => {
    const p = PRESETS[key];
    setWave(p.wave); setFreqStart(p.freqStart); setFreqEnd(p.freqEnd);
    setDuration(p.duration); setVolume(p.volume); setNoise(p.noise);
  };

  const play = async () => {
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = ctxRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      renderInto(ctx, params());
    } catch (e) { /* Web Audio indisponible */ }
  };

  const exportWav = async () => {
    setBusy(true);
    try {
      const p = params();
      const sr = 44100;
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const offline = new OAC(1, Math.ceil(sr * Math.max(0.05, p.duration)), sr);
      renderInto(offline, p);
      const rendered = await offline.startRendering();
      const blob = encodeWav(rendered);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `son-retro-${p.wave}.wav`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (e) { /* OfflineAudioContext indisponible */ }
    setBusy(false);
  };

  const Slider = ({ label, value, set, min, max, step, suffix }) => (
    <div className="rsg-ctl">
      <label>{label} : <b>{value}{suffix || ''}</b></label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} />
    </div>
  );

  return (
    <div className="rsg">
      <style>{`
        .rsg{color:#eaf2fb;max-width:880px;margin:0 auto}
        .rsg h1{font-size:1.6rem;margin:0 0 4px}
        .rsg .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 16px}
        .rsg-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:11px 16px;font-weight:700;cursor:pointer;font-size:.95rem}
        .rsg-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .rsg-btn:disabled{opacity:.45;cursor:not-allowed}
        .rsg-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:16px}
        .rsg-chips{display:flex;gap:8px;flex-wrap:wrap}
        .rsg-chip{padding:8px 14px;border-radius:20px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);color:#eaf2fb;cursor:pointer;font-size:.85rem;text-transform:capitalize}
        .rsg-chip:hover{background:rgba(255,174,59,.18)}
        .rsg-chip.on{background:rgba(91,157,255,.25);border-color:rgba(91,157,255,.6)}
        .rsg-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px 24px}
        .rsg-ctl{display:flex;flex-direction:column;gap:6px}
        .rsg-ctl label{font-size:.78rem;color:#9fb6cf}
        .rsg-ctl b{color:#eaf2fb}
        .rsg input[type=range]{accent-color:#ff8a3b;width:100%}
        .rsg-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:4px}
        .rsg-h{font-size:.74rem;color:#9fb6cf;font-weight:600;margin:0 0 8px;text-transform:uppercase;letter-spacing:.04em}
        @media(max-width:760px){.rsg-grid{grid-template-columns:1fr}.rsg-btn{flex:1}}
      `}</style>

      {goBack && <button className="rsg-btn ghost" onClick={goBack} style={{ marginBottom: 14 }}>← Retour</button>}
      <h1>🔊 Générateur de sons rétro 8-bit</h1>
      <p className="sub">Crée des effets sonores rétro via Web Audio — 100 % local, aucune donnée envoyée.</p>

      <div className="rsg-pane">
        <p className="rsg-h">Préréglages</p>
        <div className="rsg-chips">
          {Object.keys(PRESETS).map((k) => (
            <span key={k} className="rsg-chip" onClick={() => applyPreset(k)}>{k}</span>
          ))}
        </div>
      </div>

      <div className="rsg-pane">
        <p className="rsg-h">Forme d'onde</p>
        <div className="rsg-chips" style={{ marginBottom: 16 }}>
          {WAVES.map((w) => (
            <span key={w} className={`rsg-chip ${wave === w ? 'on' : ''}`} onClick={() => setWave(w)}>{WAVE_LABEL[w]}</span>
          ))}
        </div>

        <div className="rsg-grid">
          <Slider label="Fréquence de départ" value={freqStart} set={setFreqStart} min={40} max={3000} step={1} suffix=" Hz" />
          <Slider label="Fréquence d'arrivée" value={freqEnd} set={setFreqEnd} min={40} max={3000} step={1} suffix=" Hz" />
          <Slider label="Durée" value={duration} set={setDuration} min={0.05} max={1.5} step={0.01} suffix=" s" />
          <Slider label="Volume" value={volume} set={setVolume} min={0} max={1} step={0.01} />
          <Slider label="Bruit" value={noise} set={setNoise} min={0} max={1} step={0.01} />
        </div>

        <div className="rsg-actions" style={{ marginTop: 18 }}>
          <button className="rsg-btn" onClick={play}>▶ Jouer</button>
          <button className="rsg-btn ghost" onClick={exportWav} disabled={busy}>
            {busy ? '… Rendu en cours' : '⬇ Exporter en WAV'}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';

/**
 * WhiteNoiseMixer — table de mixage de bruits ambiants relaxants, 100 % local.
 * Génère les sons EN DIRECT via Web Audio : bruit blanc / rose / brun (buffer de
 * bruit bouclé) + filtres pour simuler pluie et vent. Curseurs de volume, play/stop
 * global, minuterie d'arrêt optionnelle. AUCUN fichier audio externe, arrêt propre.
 */

// Buffer de bruit blanc de 2 s, rebouclé → source de base pour tous les canaux.
function makeNoiseBuffer(ctx) {
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let lastBrown = 0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    // mélange : composante brune (sombre) + composante rose (équilibrée) + blanc
    lastBrown = (lastBrown + 0.02 * white) / 1.02;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
    d[i] = (lastBrown * 3 + pink + white * 0.5) / 2.2;
  }
  return buf;
}

const CHANNELS = [
  { id: 'rain',   label: 'Pluie',       emoji: '🌧️', type: 'lowpass',  freq: 1400, q: 0.4 },
  { id: 'wind',   label: 'Vent',        emoji: '🍃', type: 'bandpass', freq: 500,  q: 0.7 },
  { id: 'white',  label: 'Bruit blanc', emoji: '⚪', type: 'highpass', freq: 200,  q: 0.3 },
  { id: 'brown',  label: 'Bruit brun',  emoji: '🟤', type: 'lowpass',  freq: 350,  q: 0.5 },
  { id: 'stream', label: 'Ruisseau',    emoji: '💧', type: 'bandpass', freq: 1800, q: 0.5 },
];

export default function WhiteNoiseMixer({ goBack }) {
  const [playing, setPlaying] = useState(false);
  const [vols, setVols] = useState({ rain: 0.6, wind: 0, white: 0, brown: 0.3, stream: 0 });
  const [timerMin, setTimerMin] = useState(0); // 0 = pas de minuterie
  const [remaining, setRemaining] = useState(0);

  const ctxRef = useRef(null);
  const nodesRef = useRef({}); // {id: {src, filter, gain}}
  const masterRef = useRef(null);
  const stopAtRef = useRef(0);
  const rafRef = useRef(null);

  const stopAudio = () => {
    const nodes = nodesRef.current;
    Object.values(nodes).forEach((n) => {
      try { n.src.stop(); } catch (e) {}
      try { n.src.disconnect(); n.filter.disconnect(); n.gain.disconnect(); } catch (e) {}
    });
    nodesRef.current = {};
    if (masterRef.current) { try { masterRef.current.disconnect(); } catch (e) {} masterRef.current = null; }
    const ctx = ctxRef.current;
    if (ctx) { ctx.close().catch(() => {}); ctxRef.current = null; }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setRemaining(0);
  };

  // Arrêt propre au démontage du composant.
  useEffect(() => () => stopAudio(), []);

  const startAudio = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      const buffer = makeNoiseBuffer(ctx);
      const master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
      masterRef.current = master;

      CHANNELS.forEach((ch) => {
        const src = ctx.createBufferSource();
        src.buffer = buffer; src.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = ch.type; filter.frequency.value = ch.freq; filter.Q.value = ch.q;
        const gain = ctx.createGain();
        gain.gain.value = vols[ch.id] || 0;
        src.connect(filter); filter.connect(gain); gain.connect(master);
        src.start();
        nodesRef.current[ch.id] = { src, filter, gain };
      });

      if (timerMin > 0) {
        stopAtRef.current = performance.now() + timerMin * 60000;
        const loop = () => {
          const left = stopAtRef.current - performance.now();
          if (left <= 0) { stopAudio(); setPlaying(false); return; }
          setRemaining(Math.ceil(left / 1000));
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      }
      setPlaying(true);
    } catch (e) { setPlaying(false); }
  };

  const toggle = () => { if (playing) { stopAudio(); setPlaying(false); } else startAudio(); };

  const setVol = (id, v) => {
    setVols((prev) => ({ ...prev, [id]: v }));
    const n = nodesRef.current[id];
    if (n && ctxRef.current) n.gain.gain.setTargetAtTime(v, ctxRef.current.currentTime, 0.05);
  };

  const fmtT = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="wnm">
      <style>{`
        .wnm{color:#eaf2fb;max-width:760px;margin:0 auto;font-family:inherit}
        .wnm h1{font-size:1.55rem;margin:0 0 4px}
        .wnm .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .wnm-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font-weight:600;cursor:pointer;font-size:.85rem;margin-bottom:16px}
        .wnm-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:18px;margin-bottom:16px}
        .wnm-ch{display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.08)}
        .wnm-ch:last-child{border-bottom:none}
        .wnm-emoji{font-size:1.7rem;width:34px;text-align:center}
        .wnm-ch .nm{width:110px;font-weight:600;font-size:.92rem}
        .wnm-ch input[type=range]{flex:1;accent-color:#ff8a3b;height:6px}
        .wnm-ch .pct{width:42px;text-align:right;color:#9fb6cf;font-size:.82rem;font-variant-numeric:tabular-nums}
        .wnm-bar{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
        .wnm-play{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:12px;padding:14px 26px;font-weight:800;cursor:pointer;font-size:1rem;display:flex;align-items:center;gap:8px}
        .wnm-play.on{background:rgba(255,255,255,.1);color:#eaf2fb;border:1px solid rgba(255,255,255,.25)}
        .wnm-timer{display:flex;align-items:center;gap:8px;font-size:.88rem;color:#9fb6cf}
        .wnm-sel{background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.16);border-radius:9px;color:#eaf2fb;padding:9px 11px;font-size:.88rem;outline:none}
        .wnm-rem{margin-left:auto;font-size:.95rem;font-weight:700;color:#ffae3b;font-variant-numeric:tabular-nums}
        .wnm-hint{font-size:.76rem;color:#9fb6cf;margin-top:12px}
        @media(max-width:760px){.wnm-ch .nm{width:84px;font-size:.85rem}.wnm-bar{gap:10px}.wnm-rem{margin-left:0}}
      `}</style>

      {goBack && <button className="wnm-back" onClick={goBack}>← Retour</button>}
      <h1>🎚️ Table de mixage de bruits ambiants</h1>
      <p className="sub">Sons générés en direct (Web Audio), aucun fichier externe. Mélange et détends-toi. 100 % hors-ligne.</p>

      <div className="wnm-card">
        {CHANNELS.map((ch) => (
          <div className="wnm-ch" key={ch.id}>
            <span className="wnm-emoji">{ch.emoji}</span>
            <span className="nm">{ch.label}</span>
            <input type="range" min="0" max="1" step="0.01" value={vols[ch.id]}
                   onChange={(e) => setVol(ch.id, parseFloat(e.target.value))} />
            <span className="pct">{Math.round((vols[ch.id] || 0) * 100)}%</span>
          </div>
        ))}
      </div>

      <div className="wnm-card">
        <div className="wnm-bar">
          <button className={`wnm-play ${playing ? 'on' : ''}`} onClick={toggle}>
            {playing ? '⏹ Arrêter' : '▶ Lecture'}
          </button>
          <div className="wnm-timer">
            <span>⏱ Minuterie :</span>
            <select className="wnm-sel" value={timerMin}
                    onChange={(e) => setTimerMin(parseInt(e.target.value, 10))}>
              <option value={0}>Aucune</option>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
              <option value={90}>90 min</option>
            </select>
          </div>
          {playing && remaining > 0 && <span className="wnm-rem">Arrêt dans {fmtT(remaining)}</span>}
        </div>
        <p className="wnm-hint">
          Choisis la minuterie <b>avant</b> de lancer la lecture. Tout est synthétisé localement : monte
          plusieurs curseurs pour créer ton ambiance (pluie + vent, bruit brun pour dormir…).
        </p>
      </div>
    </div>
  );
}

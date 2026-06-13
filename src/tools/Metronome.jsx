import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Metronome — métronome avec tap tempo.
 * Tape le bouton (ou la barre d'espace) pour détecter le BPM (moyenne des
 * derniers intervalles). Clic sonore précis programmé sur l'horloge Web Audio,
 * accent sur le 1er temps selon la signature, réglage BPM, indicateur visuel.
 * 100 % local, aucun réseau.
 */

const SIGS = [2, 3, 4, 5, 6, 7];

export default function Metronome({ goBack }) {
  const [bpm, setBpm] = useState(100);
  const [beats, setBeats] = useState(4);
  const [running, setRunning] = useState(false);
  const [active, setActive] = useState(-1); // temps en cours pour le visuel

  const ctxRef = useRef(null);
  const nextTimeRef = useRef(0);
  const beatRef = useRef(0);
  const timerRef = useRef(null);
  const taps = useRef([]);
  const bpmRef = useRef(bpm);
  const beatsRef = useRef(beats);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { beatsRef.current = beats; }, [beats]);

  const getCtx = () => {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return ctxRef.current;
  };

  // clic synthétisé planifié à l'instant "when" sur l'horloge audio
  const click = (when, accent) => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = accent ? 1500 : 900;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.9 : 0.55, when + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(when); osc.stop(when + 0.06);
  };

  // ordonnanceur : on programme tous les battements à venir dans une fenêtre courte
  const scheduler = useCallback(() => {
    const ctx = getCtx();
    const period = 60 / bpmRef.current;
    while (nextTimeRef.current < ctx.currentTime + 0.12) {
      const b = beatRef.current;
      click(nextTimeRef.current, b === 0);
      const delay = (nextTimeRef.current - ctx.currentTime) * 1000;
      const beatIndex = b;
      setTimeout(() => setActive(beatIndex), Math.max(0, delay));
      beatRef.current = (b + 1) % beatsRef.current;
      nextTimeRef.current += period;
    }
  }, []);

  const start = () => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    beatRef.current = 0;
    nextTimeRef.current = ctx.currentTime + 0.06;
    setRunning(true);
    scheduler();
    timerRef.current = setInterval(scheduler, 25);
  };
  const stop = () => {
    setRunning(false);
    clearInterval(timerRef.current);
    timerRef.current = null;
    setActive(-1);
  };
  const toggle = () => (running ? stop() : start());

  useEffect(() => () => clearInterval(timerRef.current), []);

  const tap = useCallback(() => {
    const now = performance.now();
    const t = taps.current;
    if (t.length && now - t[t.length - 1] > 2000) t.length = 0; // reset si pause longue
    t.push(now);
    if (t.length > 6) t.shift();
    if (t.length >= 2) {
      let sum = 0;
      for (let i = 1; i < t.length; i++) sum += t[i] - t[i - 1];
      const avg = sum / (t.length - 1);
      const v = Math.round(60000 / avg);
      if (v >= 30 && v <= 300) setBpm(v);
    }
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault(); tap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tap]);

  const setB = (v) => setBpm(Math.min(300, Math.max(30, v)));

  return (
    <div className="metro">
      <style>{`
        .metro{color:#eaf2fb;max-width:560px;margin:0 auto;text-align:center}
        .metro h1{font-size:1.55rem;margin:0 0 4px}
        .metro .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 20px}
        .metro-bpm{font-size:4rem;font-weight:900;line-height:1;margin:6px 0;color:#ffae3b}
        .metro-bpm small{font-size:1rem;color:#9fb6cf;font-weight:600;margin-left:6px}
        .metro-dots{display:flex;gap:12px;justify-content:center;margin:18px 0}
        .metro-dot{width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.14);transition:transform .06s,background .06s}
        .metro-dot.on{background:#5b9dff;transform:scale(1.35)}
        .metro-dot.on.first{background:#ff7a18}
        .metro-row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;align-items:center;margin:14px 0}
        .metro input[type=range]{accent-color:#ff8a3b;width:100%}
        .metro-btn{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;font-size:1rem}
        .metro-btn.big{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;padding:14px 30px;font-size:1.05rem}
        .metro-tap{background:rgba(91,157,255,.18);border:1px solid rgba(91,157,255,.5);color:#eaf2fb;border-radius:14px;padding:18px;width:100%;font-size:1.05rem;font-weight:700;cursor:pointer;user-select:none}
        .metro-tap:active{background:rgba(91,157,255,.32)}
        .metro-sig{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}
        .metro-sig button{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);color:#eaf2fb;border-radius:8px;padding:7px 11px;cursor:pointer;font-weight:600}
        .metro-sig button.on{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none}
        .metro-hint{color:#9fb6cf;font-size:.8rem;margin-top:10px}
      `}</style>

      <h1>🥁 Métronome</h1>
      <p className="sub">Tape le tempo (bouton ou barre d'espace), règle le BPM et la mesure. 100 % local.</p>

      <div className="metro-bpm">{bpm}<small>BPM</small></div>

      <div className="metro-dots">
        {Array.from({ length: beats }).map((_, i) => (
          <div key={i} className={`metro-dot ${active === i ? 'on' : ''} ${i === 0 ? 'first' : ''}`} />
        ))}
      </div>

      <div className="metro-row">
        <button className="metro-btn" onClick={() => setB(bpm - 5)}>−5</button>
        <button className="metro-btn" onClick={() => setB(bpm - 1)}>−1</button>
        <button className="metro-btn big" onClick={toggle}>{running ? '⏸ Arrêter' : '▶ Démarrer'}</button>
        <button className="metro-btn" onClick={() => setB(bpm + 1)}>＋1</button>
        <button className="metro-btn" onClick={() => setB(bpm + 5)}>＋5</button>
      </div>

      <input type="range" min="30" max="300" value={bpm} onChange={(e) => setB(+e.target.value)} />

      <div className="metro-row" style={{ marginTop: 18 }}>
        <button className="metro-tap" onClick={tap}>👆 TAP TEMPO</button>
      </div>

      <div className="metro-row">
        <span style={{ color: '#9fb6cf', fontSize: '.85rem' }}>Mesure :</span>
        <div className="metro-sig">
          {SIGS.map((n) => (
            <button key={n} className={beats === n ? 'on' : ''} onClick={() => setBeats(n)}>{n}/4</button>
          ))}
        </div>
      </div>

      <p className="metro-hint">Astuce : appuie sur la barre d'espace en rythme pour détecter le tempo automatiquement.</p>
      {goBack && <div className="metro-row"><button className="metro-btn" onClick={goBack}>← Retour</button></div>}
    </div>
  );
}

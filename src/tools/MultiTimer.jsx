import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * MultiTimer — multi-minuteurs de cuisson parallèles, 100 % local & hors-ligne.
 * Crée plusieurs minuteurs nommés qui décomptent en parallèle, avec alarme sonore
 * (Web Audio) à 0. Démarrer / pause / réinitialiser par minuteur + préréglages rapides.
 * Aucun fichier audio externe, aucun réseau.
 */

const PRESETS = [
  { name: 'Œuf mollet', sec: 360 },
  { name: 'Pâtes', sec: 480 },
  { name: 'Riz', sec: 720 },
  { name: 'Four', sec: 1500 },
  { name: 'Thé', sec: 240 },
];

const fmt = (s) => {
  s = Math.max(0, Math.ceil(s));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
};

let acx = null;
const getCtx = () => {
  try {
    if (!acx) acx = new (window.AudioContext || window.webkitAudioContext)();
    if (acx.state === 'suspended') acx.resume();
    return acx;
  } catch (e) { return null; }
};

// Bip d'alarme répété via oscillateur — aucun fichier audio.
const beep = () => {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  for (let i = 0; i < 4; i++) {
    const t = now + i * 0.45;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + 0.34);
  }
};

export default function MultiTimer({ goBack }) {
  const [timers, setTimers] = useState([
    { id: 1, name: 'Pâtes', total: 480, left: 480, running: false, done: false },
    { id: 2, name: 'Four', total: 1500, left: 1500, running: false, done: false },
  ]);
  const [name, setName] = useState('');
  const [min, setMin] = useState('5');
  const [sec, setSec] = useState('0');
  const raf = useRef(null);
  const last = useRef(0);

  // Boucle unique de décompte pour tous les minuteurs actifs.
  const tick = useCallback((now) => {
    const dt = (now - last.current) / 1000;
    last.current = now;
    setTimers((prev) => prev.map((t) => {
      if (!t.running) return t;
      const left = t.left - dt;
      if (left <= 0) { beep(); return { ...t, left: 0, running: false, done: true }; }
      return { ...t, left };
    }));
    raf.current = requestAnimationFrame(tick);
  }, []);

  const anyRunning = timers.some((t) => t.running);
  useEffect(() => {
    if (anyRunning) {
      last.current = performance.now();
      raf.current = requestAnimationFrame(tick);
    }
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [anyRunning, tick]);

  const addTimer = (nm, total) => {
    const t = Math.max(1, Math.round(total));
    setTimers((p) => [...p, { id: Date.now() + Math.random(), name: nm || 'Minuteur', total: t, left: t, running: false, done: false }]);
  };
  const addCustom = () => {
    const total = (parseInt(min, 10) || 0) * 60 + (parseInt(sec, 10) || 0);
    if (total < 1) return;
    addTimer(name.trim(), total);
    setName('');
  };
  const start = (id) => { getCtx(); setTimers((p) => p.map((t) => t.id === id ? { ...t, running: true, done: false, left: t.left <= 0 ? t.total : t.left } : t)); };
  const pause = (id) => setTimers((p) => p.map((t) => t.id === id ? { ...t, running: false } : t));
  const reset = (id) => setTimers((p) => p.map((t) => t.id === id ? { ...t, left: t.total, running: false, done: false } : t));
  const remove = (id) => setTimers((p) => p.filter((t) => t.id !== id));

  return (
    <div className="mtim">
      <style>{`
        .mtim{color:#eaf2fb;max-width:900px;margin:0 auto;font-family:inherit}
        .mtim h1{font-size:1.55rem;margin:0 0 4px}
        .mtim .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .mtim-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font-weight:600;cursor:pointer;font-size:.85rem;margin-bottom:16px}
        .mtim-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:16px}
        .mtim-form{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end}
        .mtim-form .fld{display:flex;flex-direction:column;gap:6px}
        .mtim-form label{font-size:.76rem;color:#9fb6cf;font-weight:600}
        .mtim-in{background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.16);border-radius:10px;color:#eaf2fb;padding:10px 12px;font-size:.95rem;outline:none}
        .mtim-in:focus{border-color:#5b9dff}
        .mtim-w{width:74px}
        .mtim-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:11px 16px;font-weight:700;cursor:pointer;font-size:.9rem}
        .mtim-presets{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
        .mtim-chip{background:rgba(91,157,255,.16);color:#cfe2ff;border:1px solid rgba(91,157,255,.4);border-radius:20px;padding:7px 13px;font-size:.82rem;cursor:pointer}
        .mtim-chip:hover{background:rgba(91,157,255,.3)}
        .mtim-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}
        .mtim-t{background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:16px;position:relative;text-align:center}
        .mtim-t.run{border-color:rgba(255,174,59,.55);box-shadow:0 0 0 1px rgba(255,174,59,.25) inset}
        .mtim-t.done{border-color:#ff6b6b;animation:mtimPulse 1s ease-in-out infinite}
        @keyframes mtimPulse{0%,100%{background:rgba(255,80,80,.12)}50%{background:rgba(255,80,80,.28)}}
        .mtim-t .nm{font-weight:700;font-size:1rem;margin-bottom:8px;word-break:break-word}
        .mtim-time{font-size:2.2rem;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:1px}
        .mtim-time.r{color:#ffae3b}
        .mtim-time.d{color:#ff6b6b}
        .mtim-acts{display:flex;gap:8px;justify-content:center;margin-top:12px}
        .mtim-acts button{flex:1;background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:9px;padding:9px 0;cursor:pointer;font-size:1.05rem}
        .mtim-acts button.go{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border-color:transparent}
        .mtim-del{position:absolute;top:8px;right:10px;background:none;border:none;color:#9fb6cf;cursor:pointer;font-size:.9rem;opacity:.6}
        .mtim-del:hover{opacity:1;color:#ff8a8a}
        .mtim-done-lbl{color:#ff6b6b;font-size:.78rem;font-weight:700;margin-top:6px}
        .mtim-empty{text-align:center;color:#9fb6cf;padding:30px 10px}
        @media(max-width:760px){.mtim-grid{grid-template-columns:1fr 1fr}.mtim-form{gap:8px}}
        @media(max-width:430px){.mtim-grid{grid-template-columns:1fr}}
      `}</style>

      {goBack && <button className="mtim-back" onClick={goBack}>← Retour</button>}
      <h1>⏲️ Multi-minuteurs de cuisson</h1>
      <p className="sub">Plusieurs minuteurs en parallèle, alarme sonore à 0. 100 % hors-ligne, aucun son externe.</p>

      <div className="mtim-card">
        <div className="mtim-form">
          <div className="fld" style={{ flex: 1, minWidth: 150 }}>
            <label>Nom du minuteur</label>
            <input className="mtim-in" value={name} onChange={(e) => setName(e.target.value)}
                   placeholder="Ex : Pâtes" onKeyDown={(e) => e.key === 'Enter' && addCustom()} />
          </div>
          <div className="fld">
            <label>Minutes</label>
            <input className="mtim-in mtim-w" type="number" min="0" value={min} onChange={(e) => setMin(e.target.value)} />
          </div>
          <div className="fld">
            <label>Secondes</label>
            <input className="mtim-in mtim-w" type="number" min="0" max="59" value={sec} onChange={(e) => setSec(e.target.value)} />
          </div>
          <button className="mtim-btn" onClick={addCustom}>＋ Ajouter</button>
        </div>
        <div className="mtim-presets">
          {PRESETS.map((p) => (
            <button key={p.name} className="mtim-chip" onClick={() => addTimer(p.name, p.sec)}>
              {p.name} · {fmt(p.sec)}
            </button>
          ))}
        </div>
      </div>

      {timers.length === 0 ? (
        <div className="mtim-card mtim-empty">Aucun minuteur. Ajoute-en un ci-dessus ou choisis un préréglage.</div>
      ) : (
        <div className="mtim-grid">
          {timers.map((t) => (
            <div key={t.id} className={`mtim-t ${t.running ? 'run' : ''} ${t.done ? 'done' : ''}`}>
              <button className="mtim-del" title="Supprimer" onClick={() => remove(t.id)}>✕</button>
              <div className="nm">{t.name}</div>
              <div className={`mtim-time ${t.running ? 'r' : ''} ${t.done ? 'd' : ''}`}>{fmt(t.left)}</div>
              {t.done && <div className="mtim-done-lbl">⏰ Terminé !</div>}
              <div className="mtim-acts">
                {t.running
                  ? <button onClick={() => pause(t.id)} title="Pause">⏸</button>
                  : <button className="go" onClick={() => start(t.id)} title="Démarrer">▶</button>}
                <button onClick={() => reset(t.id)} title="Réinitialiser">↺</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

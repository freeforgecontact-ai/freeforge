import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * WorkoutBuilder — planificateur d'entraînement + minuteur par intervalles.
 * 100 % local, hors-ligne. Bip Web Audio + annonce vocale à chaque transition.
 * Routines mémorisées dans le navigateur (localStorage).
 */

const LS_KEY = 'ff_workout_builder_v1';
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

export default function WorkoutBuilder({ goBack }) {
  const [exos, setExos] = useState([
    { id: uid(), name: 'Échauffement', dur: 30, rest: 10 },
    { id: uid(), name: 'Pompes', dur: 40, rest: 20 },
    { id: uid(), name: 'Squats', dur: 40, rest: 20 },
  ]);
  const [routines, setRoutines] = useState({});
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [idx, setIdx] = useState(0);      // index exercice courant
  const [phase, setPhase] = useState('work'); // 'work' | 'rest'
  const [left, setLeft] = useState(0);
  const [muted, setMuted] = useState(false);
  const acRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) { const d = JSON.parse(raw); if (d.routines) setRoutines(d.routines); }
    } catch (e) { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ routines })); } catch (e) { /* ignore */ }
  }, [routines]);

  const ac = () => {
    if (!acRef.current) { try { acRef.current = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    return acRef.current;
  };
  const beep = useCallback((freq = 880, dur = 0.16) => {
    if (muted) return;
    const ctx = ac(); if (!ctx) return;
    try {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch (e) { /* ignore */ }
  }, [muted]);
  const say = useCallback((txt) => {
    if (muted || !('speechSynthesis' in window)) return;
    try {
      const u = new SpeechSynthesisUtterance(txt);
      u.lang = 'fr-FR'; u.rate = 1.05;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  }, [muted]);

  const valid = exos.filter((e) => e.name.trim() && e.dur > 0);

  const announce = useCallback((i, ph) => {
    const e = valid[i]; if (!e) return;
    beep(ph === 'work' ? 980 : 620);
    say(ph === 'work' ? `${e.name}, ${e.dur} secondes` : `Repos ${e.rest} secondes`);
  }, [valid, beep, say]);

  const start = () => {
    if (!valid.length) return;
    try { ac()?.resume(); } catch (e) { /* ignore */ }
    setIdx(0); setPhase('work'); setLeft(valid[0].dur);
    setRunning(true); setPaused(false);
    announce(0, 'work');
  };
  const stop = () => {
    setRunning(false); setPaused(false); setIdx(0); setPhase('work'); setLeft(0);
    try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
  };

  // moteur du minuteur
  useEffect(() => {
    if (!running || paused) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setLeft((l) => {
        if (l > 1) return l - 1;
        // transition
        if (phase === 'work') {
          const rest = valid[idx]?.rest || 0;
          if (rest > 0) { setPhase('rest'); announce(idx, 'rest'); return rest; }
        }
        const next = idx + 1;
        if (next >= valid.length) {
          beep(1320, 0.4); say('Séance terminée, bravo !');
          setRunning(false); setPaused(false); setIdx(0); setPhase('work');
          return 0;
        }
        setIdx(next); setPhase('work'); announce(next, 'work');
        return valid[next].dur;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [running, paused, phase, idx, valid, announce, beep, say]);

  const upd = (id, k, v) => setExos((p) => p.map((e) => e.id === id ? { ...e, [k]: k === 'name' ? v : Math.max(0, parseInt(v) || 0) } : e));
  const addExo = () => setExos((p) => [...p, { id: uid(), name: '', dur: 30, rest: 15 }]);
  const delExo = (id) => setExos((p) => p.filter((e) => e.id !== id));
  const move = (id, d) => setExos((p) => {
    const i = p.findIndex((e) => e.id === id); const j = i + d;
    if (i < 0 || j < 0 || j >= p.length) return p;
    const c = [...p]; [c[i], c[j]] = [c[j], c[i]]; return c;
  });

  const saveRoutine = () => {
    const name = (prompt('Nom de la routine :') || '').trim();
    if (!name) return;
    setRoutines((r) => ({ ...r, [name]: exos.map(({ name: n, dur, rest }) => ({ name: n, dur, rest })) }));
  };
  const loadRoutine = (name) => { const r = routines[name]; if (r) setExos(r.map((e) => ({ ...e, id: uid() }))); };
  const delRoutine = (name) => setRoutines((r) => { const c = { ...r }; delete c[name]; return c; });

  const totalSec = valid.reduce((s, e) => s + e.dur + e.rest, 0);
  const cur = valid[idx];

  return (
    <div className="wkb">
      <style>{`
        .wkb{color:#eaf2fb;max-width:1000px;margin:0 auto}
        .wkb h1{font-size:1.6rem;margin:0 0 4px}
        .wkb .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .wkb-grid{display:grid;grid-template-columns:1fr 360px;gap:18px;align-items:start}
        .wkb-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px}
        .wkb-row{display:grid;grid-template-columns:24px 1fr 84px 84px 30px;gap:8px;align-items:center;margin-bottom:8px}
        .wkb-row input{background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.16);color:#eaf2fb;border-radius:8px;padding:8px 10px;font-size:.85rem;width:100%}
        .wkb-row .ord{display:flex;flex-direction:column;font-size:.6rem;line-height:1}
        .wkb-row .ord button{background:none;border:none;color:#9fb6cf;cursor:pointer;padding:0}
        .wkb-lbl{display:grid;grid-template-columns:24px 1fr 84px 84px 30px;gap:8px;font-size:.68rem;color:#9fb6cf;margin-bottom:6px;text-transform:uppercase}
        .wkb-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;font-size:.9rem}
        .wkb-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .wkb-x{background:none;border:none;color:#ff8a8a;cursor:pointer;font-size:1rem}
        .wkb-timer{text-align:center;padding:18px 12px;border-radius:14px;background:rgba(91,157,255,.12);border:1px solid rgba(91,157,255,.4)}
        .wkb-timer.rest{background:rgba(255,174,59,.12);border-color:rgba(255,174,59,.45)}
        .wkb-big{font-size:3.4rem;font-weight:800;line-height:1;margin:6px 0}
        .wkb-phase{font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;color:#9fb6cf}
        .wkb-now{font-size:1.15rem;font-weight:700;margin:2px 0}
        .wkb-ctrls{display:flex;gap:8px;justify-content:center;margin-top:14px;flex-wrap:wrap}
        .wkb-rout{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:8px 10px;border-radius:9px;background:rgba(255,255,255,.05);margin-bottom:6px;font-size:.85rem}
        .wkb-rout .lk{color:#5b9dff;cursor:pointer;flex:1}
        .wkb-meta{font-size:.78rem;color:#9fb6cf;margin-top:8px}
        @media(max-width:760px){.wkb-grid{grid-template-columns:1fr}}
      `}</style>

      <div className="no-print" style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        {goBack && <button className="wkb-btn ghost" onClick={goBack}>← Retour</button>}
        <button className="wkb-btn ghost" onClick={() => setMuted((m) => !m)}>{muted ? '🔇 Son coupé' : '🔊 Son actif'}</button>
      </div>

      <h1>🏋️ Planificateur d'entraînement</h1>
      <p className="sub">Construis ta séance puis lance le minuteur d'intervalles — bip et annonce vocale à chaque transition. 100 % hors-ligne.</p>

      <div className="wkb-grid">
        <div className="wkb-card">
          <div className="wkb-lbl"><span></span><span>Exercice</span><span>Durée (s)</span><span>Repos (s)</span><span></span></div>
          {exos.map((e) => (
            <div className="wkb-row" key={e.id}>
              <span className="ord">
                <button onClick={() => move(e.id, -1)} title="Monter">▲</button>
                <button onClick={() => move(e.id, 1)} title="Descendre">▼</button>
              </span>
              <input value={e.name} placeholder="Nom / reps" onChange={(ev) => upd(e.id, 'name', ev.target.value)} />
              <input type="number" min="0" value={e.dur} onChange={(ev) => upd(e.id, 'dur', ev.target.value)} />
              <input type="number" min="0" value={e.rest} onChange={(ev) => upd(e.id, 'rest', ev.target.value)} />
              <button className="wkb-x" onClick={() => delExo(e.id)} title="Supprimer">✕</button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button className="wkb-btn ghost" onClick={addExo}>＋ Exercice</button>
            <button className="wkb-btn ghost" onClick={saveRoutine}>💾 Sauver la routine</button>
          </div>
          <div className="wkb-meta">{valid.length} exercice(s) · durée totale ≈ {fmt(totalSec)}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className={`wkb-card wkb-timer ${phase === 'rest' ? 'rest' : ''}`}>
            <div className="wkb-phase">{running ? (phase === 'work' ? 'Effort' : 'Repos') : 'Prêt'}</div>
            <div className="wkb-now">{running && cur ? cur.name : (valid[0]?.name || '—')}</div>
            <div className="wkb-big">{fmt(running ? left : (valid[0]?.dur || 0))}</div>
            <div className="wkb-phase">{running ? `Exercice ${idx + 1} / ${valid.length}` : 'Appuie sur Démarrer'}</div>
            <div className="wkb-ctrls">
              {!running ? (
                <button className="wkb-btn" onClick={start} disabled={!valid.length}>▶ Démarrer</button>
              ) : (
                <>
                  <button className="wkb-btn" onClick={() => setPaused((p) => !p)}>{paused ? '▶ Reprendre' : '⏸ Pause'}</button>
                  <button className="wkb-btn ghost" onClick={stop}>⏹ Stop</button>
                </>
              )}
            </div>
          </div>

          <div className="wkb-card">
            <h3 style={{ fontSize: '.95rem', margin: '0 0 10px' }}>📂 Routines sauvegardées</h3>
            {Object.keys(routines).length === 0 ? (
              <p className="wkb-meta" style={{ margin: 0 }}>Aucune routine. Crée ta séance puis « Sauver la routine ».</p>
            ) : Object.keys(routines).map((n) => (
              <div className="wkb-rout" key={n}>
                <span className="lk" onClick={() => loadRoutine(n)} title="Charger">{n} ({routines[n].length})</span>
                <button className="wkb-x" onClick={() => delRoutine(n)} title="Supprimer">✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

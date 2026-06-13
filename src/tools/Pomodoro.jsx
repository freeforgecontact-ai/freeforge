import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Pomodoro — minuteur de productivité configurable (travail / pause / longue pause),
 * enchaînement automatique des phases, compteur de sessions, son de fin et bruit de
 * fond léger via Web Audio. 100 % local & hors-ligne. Les statistiques du jour sont
 * mémorisées dans le navigateur (localStorage).
 */

const LS_KEY = 'freeforge_pomodoro_v1';
const today = () => new Date().toISOString().slice(0, 10);
const pad = (n) => String(n).padStart(2, '0');

export default function Pomodoro({ goBack }) {
  const [conf, setConf] = useState({ travail: 25, pause: 5, longue: 15, cycles: 4 });
  const [phase, setPhase] = useState('travail'); // 'travail' | 'pause' | 'longue'
  const [reste, setReste] = useState(25 * 60);
  const [actif, setActif] = useState(false);
  const [faits, setFaits] = useState(0); // pomodoros de travail terminés (cycle courant)
  const [stats, setStats] = useState({ jour: today(), sessions: 0, minutes: 0 });
  const [bruit, setBruit] = useState(false);

  const audioCtxRef = useRef(null);
  const noiseRef = useRef(null);

  // ---- persistance des stats du jour ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.jour === today()) setStats(d);
      }
    } catch (e) { /* données illisibles : on ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(stats)); } catch (e) { /* quota : on ignore */ }
  }, [stats]);

  const dureeDe = useCallback((ph) => (ph === 'travail' ? conf.travail : ph === 'pause' ? conf.pause : conf.longue) * 60, [conf]);

  // Si on change la config alors que le minuteur est arrêté, on réajuste le temps restant.
  useEffect(() => { if (!actif) setReste(dureeDe(phase)); }, [conf, phase, actif, dureeDe]);

  const getCtx = () => {
    if (!audioCtxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtxRef.current = new AC();
    }
    return audioCtxRef.current;
  };

  const bip = useCallback((freq = 660, dur = 0.5) => {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    [freq, freq * 1.5].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.25, t + i * 0.18 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.18 + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t + i * 0.18); o.stop(t + i * 0.18 + dur);
    });
  }, []);

  // ---- bruit de fond (bruit brun doux) ----
  const stopNoise = useCallback(() => {
    if (noiseRef.current) {
      try { noiseRef.current.src.stop(); } catch (e) { /* déjà stoppé */ }
      noiseRef.current = null;
    }
  }, []);
  const startNoise = useCallback(() => {
    const ctx = getCtx();
    if (!ctx || noiseRef.current) return;
    if (ctx.state === 'suspended') ctx.resume();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer; src.loop = true;
    const g = ctx.createGain(); g.gain.value = 0.12;
    src.connect(g); g.connect(ctx.destination);
    src.start();
    noiseRef.current = { src, g };
  }, []);
  useEffect(() => { if (bruit) startNoise(); else stopNoise(); return stopNoise; }, [bruit, startNoise, stopNoise]);

  // ---- tic du minuteur ----
  useEffect(() => {
    if (!actif) return;
    const t = setInterval(() => {
      setReste((r) => {
        if (r > 1) return r - 1;
        finPhase();
        return 0;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actif, phase, faits, conf]);

  const finPhase = () => {
    bip();
    if (phase === 'travail') {
      const n = faits + 1;
      setFaits(n);
      setStats((s) => ({ jour: today(), sessions: (s.jour === today() ? s.sessions : 0) + 1, minutes: (s.jour === today() ? s.minutes : 0) + conf.travail }));
      const prochaine = n % conf.cycles === 0 ? 'longue' : 'pause';
      setPhase(prochaine); setReste(dureeDe(prochaine));
    } else {
      setPhase('travail'); setReste(dureeDe('travail'));
    }
  };

  const toggle = () => { getCtx(); setActif((a) => !a); };
  const reset = () => { setActif(false); setPhase('travail'); setFaits(0); setReste(conf.travail * 60); };
  const skip = () => { setActif(false); finPhase(); };

  const setCfg = (k, v) => { const n = Math.max(1, Math.min(180, parseInt(v, 10) || 1)); setConf((c) => ({ ...c, [k]: n })); };

  const totalPhase = dureeDe(phase);
  const pct = totalPhase ? ((totalPhase - reste) / totalPhase) * 100 : 0;
  const label = phase === 'travail' ? '💪 Travail' : phase === 'pause' ? '☕ Pause' : '🛋️ Longue pause';
  const R = 120, C = 2 * Math.PI * R;

  return (
    <div className="pomo">
      <style>{`
        .pomo{color:#eaf2fb;max-width:560px;margin:0 auto;text-align:center}
        .pomo h1{font-size:1.5rem;margin:0 0 4px}
        .pomo .sub{color:#9fb6cf;font-size:.88rem;margin:0 0 16px}
        .pomo-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 13px;cursor:pointer;font-size:.85rem;margin-bottom:14px;float:left}
        .pomo-ring{position:relative;width:280px;height:280px;margin:6px auto 4px}
        .pomo-ring svg{transform:rotate(-90deg)}
        .pomo-time{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
        .pomo-time .t{font-size:3rem;font-weight:800;font-variant-numeric:tabular-nums}
        .pomo-time .ph{font-size:1rem;color:#ffce8a;margin-top:2px}
        .pomo-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:14px 0}
        .pomo-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:11px 20px;font-weight:700;cursor:pointer;font-size:.95rem}
        .pomo-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .pomo-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:14px;margin-top:14px;text-align:left}
        .pomo-cfg{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        .pomo-cfg label{font-size:.72rem;color:#9fb6cf;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:.03em}
        .pomo-cfg input{width:100%;box-sizing:border-box;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.16);border-radius:8px;color:#eaf2fb;padding:8px;font-size:.95rem;text-align:center}
        .pomo-cfg input:focus{outline:none;border-color:#5b9dff}
        .pomo-stats{display:flex;justify-content:space-around;gap:10px;margin-top:12px}
        .pomo-stat .v{font-size:1.5rem;font-weight:800;color:#fff}
        .pomo-stat .k{font-size:.74rem;color:#9fb6cf}
        .pomo-toggle{display:flex;align-items:center;gap:8px;justify-content:center;margin-top:12px;color:#9fb6cf;font-size:.88rem;cursor:pointer}
        .pomo-toggle input{accent-color:#ff8a3b;width:18px;height:18px}
        @media(max-width:760px){.pomo-cfg{grid-template-columns:repeat(2,1fr)}.pomo-cfg input{font-size:16px}.pomo-ring{width:240px;height:240px}.pomo-time .t{font-size:2.5rem}}
      `}</style>

      {goBack && <button className="pomo-back" onClick={goBack}>← Retour</button>}
      <h1 style={{ clear: 'both' }}>🍅 Minuteur Pomodoro</h1>
      <p className="sub">Alterne concentration et pauses. Son de fin et bruit de fond inclus. 100 % local, aucune connexion.</p>

      <div className="pomo-ring">
        <svg width="280" height="280" viewBox="0 0 280 280">
          <circle cx="140" cy="140" r={R} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="14" />
          <circle cx="140" cy="140" r={R} fill="none" stroke={phase === 'travail' ? '#ff8a3b' : '#5b9dff'} strokeWidth="14"
            strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C - (C * pct) / 100} style={{ transition: 'stroke-dashoffset .5s linear' }} />
        </svg>
        <div className="pomo-time">
          <div className="t">{pad(Math.floor(reste / 60))}:{pad(reste % 60)}</div>
          <div className="ph">{label}</div>
        </div>
      </div>

      <div className="pomo-btns">
        <button className="pomo-btn" onClick={toggle}>{actif ? '⏸ Pause' : '▶️ Démarrer'}</button>
        <button className="pomo-btn ghost" onClick={skip} title="Passer à la phase suivante">⏭ Passer</button>
        <button className="pomo-btn ghost" onClick={reset}>↺ Réinitialiser</button>
      </div>

      <label className="pomo-toggle">
        <input type="checkbox" checked={bruit} onChange={(e) => setBruit(e.target.checked)} />
        🌧️ Bruit de fond léger
      </label>

      <div className="pomo-card">
        <div className="pomo-cfg">
          <div><label>Travail (min)</label><input type="number" value={conf.travail} onChange={(e) => setCfg('travail', e.target.value)} /></div>
          <div><label>Pause (min)</label><input type="number" value={conf.pause} onChange={(e) => setCfg('pause', e.target.value)} /></div>
          <div><label>Longue (min)</label><input type="number" value={conf.longue} onChange={(e) => setCfg('longue', e.target.value)} /></div>
          <div><label>Cycles</label><input type="number" value={conf.cycles} onChange={(e) => setCfg('cycles', e.target.value)} /></div>
        </div>
        <div className="pomo-stats">
          <div className="pomo-stat"><div className="v">{faits % conf.cycles}/{conf.cycles}</div><div className="k">Cycle en cours</div></div>
          <div className="pomo-stat"><div className="v">{stats.sessions}</div><div className="k">Sessions aujourd'hui</div></div>
          <div className="pomo-stat"><div className="v">{stats.minutes}</div><div className="k">Minutes focus</div></div>
        </div>
      </div>
    </div>
  );
}

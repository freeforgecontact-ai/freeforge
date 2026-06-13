import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * MeditationMixer — ambiance sonore de méditation (et non un mixeur de bruit blanc), 100 % local.
 * Web Audio génère : un bourdon doux (drone, 2 oscillateurs légèrement désaccordés) et une cloche
 * périodique optionnelle (clochette synthétisée). Un guide de respiration visuel anime un cercle
 * qui se dilate/contracte selon un rythme choisi (4-7-8 ou cohérence cardiaque 5-5).
 * Curseurs de volume, play/stop, minuterie. Tout l'audio et l'animation sont arrêtés proprement.
 * Aucun fichier, aucun réseau.
 */

const PATTERNS = {
  '478': { name: '4-7-8 (apaisant)', steps: [['Inspire', 4], ['Retiens', 7], ['Expire', 8]] },
  'coherence': { name: 'Cohérence 5-5', steps: [['Inspire', 5], ['Expire', 5]] },
  'box': { name: 'Carrée 4-4-4-4', steps: [['Inspire', 4], ['Retiens', 4], ['Expire', 4], ['Retiens', 4]] },
};
const NOTES = { Do: 130.81, Ré: 146.83, Mi: 164.81, Sol: 196.0, La: 220.0 };

export default function MeditationMixer({ goBack }) {
  const [playing, setPlaying] = useState(false);
  const [droneVol, setDroneVol] = useState(0.5);
  const [bellOn, setBellOn] = useState(true);
  const [bellVol, setBellVol] = useState(0.4);
  const [bellEvery, setBellEvery] = useState(60); // secondes
  const [note, setNote] = useState('Sol');
  const [pattern, setPattern] = useState('478');
  const [minutes, setMinutes] = useState(10);
  const [remaining, setRemaining] = useState(0);

  // respiration
  const [phase, setPhase] = useState('');
  const [scale, setScale] = useState(0.55);

  const ctxRef = useRef(null);
  const droneGainRef = useRef(null);
  const oscRef = useRef([]);
  const bellTimerRef = useRef(null);
  const breathRafRef = useRef(null);
  const breathStartRef = useRef(0);
  const countdownRef = useRef(null);

  const getCtx = () => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctxRef.current = new AC();
    }
    return ctxRef.current;
  };

  // ---- cloche synthétisée (sinus avec enveloppe décroissante + harmonique) ----
  const playBell = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    const g = ctx.createGain();
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, bellVol), now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const og = ctx.createGain();
      og.gain.value = i === 0 ? 1 : 0.35;
      o.connect(og); og.connect(g);
      o.start(now);
      o.stop(now + 3.3);
    });
  }, [bellVol]);

  // ---- boucle de respiration (anime le scale du cercle) ----
  const totalCycle = PATTERNS[pattern].steps.reduce((a, s) => a + s[1], 0);
  const breathLoop = useCallback(() => {
    const steps = PATTERNS[pattern].steps;
    const cycle = steps.reduce((a, s) => a + s[1], 0);
    const tick = () => {
      const elapsed = (performance.now() - breathStartRef.current) / 1000;
      let t = elapsed % cycle;
      let acc = 0, cur = steps[0], localT = 0;
      for (const s of steps) {
        if (t < acc + s[1]) { cur = s; localT = t - acc; break; }
        acc += s[1];
      }
      const frac = localT / cur[1];
      let sc;
      if (cur[0] === 'Inspire') sc = 0.55 + 0.45 * frac;
      else if (cur[0] === 'Expire') sc = 1.0 - 0.45 * frac;
      else sc = cur[0] === 'Retiens' ? (acc === 0 ? 0.55 : 1.0) : 0.55;
      // "Retiens" après inspire -> grand ; après expire -> petit
      if (cur[0] === 'Retiens') sc = acc > cycle / 2 ? 0.55 : 1.0;
      setScale(sc);
      setPhase(`${cur[0]} · ${Math.ceil(cur[1] - localT)}s`);
      breathRafRef.current = requestAnimationFrame(tick);
    };
    breathStartRef.current = performance.now();
    tick();
  }, [pattern]);

  const stopAll = useCallback(() => {
    oscRef.current.forEach((o) => { try { o.stop(); } catch (e) { /* déjà arrêté */ } });
    oscRef.current = [];
    if (droneGainRef.current) { try { droneGainRef.current.disconnect(); } catch (e) {} droneGainRef.current = null; }
    if (bellTimerRef.current) { clearInterval(bellTimerRef.current); bellTimerRef.current = null; }
    if (breathRafRef.current) { cancelAnimationFrame(breathRafRef.current); breathRafRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setPlaying(false);
    setPhase('');
    setScale(0.55);
    setRemaining(0);
  }, []);

  const start = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    // drone : 2 oscillateurs désaccordés + filtre passe-bas pour douceur
    const g = ctx.createGain();
    g.gain.value = droneVol * 0.3;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 700;
    g.connect(lp); lp.connect(ctx.destination);
    droneGainRef.current = g;
    const base = NOTES[note] || 196;
    [base, base * 1.5, base].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 2 ? 'triangle' : 'sine';
      o.frequency.value = f + (i === 0 ? -0.6 : i === 1 ? 0.6 : 0);
      const og = ctx.createGain();
      og.gain.value = i === 1 ? 0.4 : i === 2 ? 0.25 : 1;
      o.connect(og); og.connect(g);
      o.start();
      oscRef.current.push(o);
    });
    if (bellOn) { playBell(); bellTimerRef.current = setInterval(playBell, Math.max(5, bellEvery) * 1000); }
    breathLoop();
    setPlaying(true);
    // minuterie
    setRemaining(Math.max(0, Math.round(minutes * 60)));
    if (minutes > 0) {
      countdownRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) { stopAll(); return 0; }
          return r - 1;
        });
      }, 1000);
    }
  }, [droneVol, note, bellOn, bellVol, bellEvery, breathLoop, playBell, minutes, stopAll]);

  // volume du drone en direct
  useEffect(() => { if (droneGainRef.current) droneGainRef.current.gain.value = droneVol * 0.3; }, [droneVol]);

  // nettoyage au démontage
  useEffect(() => () => {
    stopAll();
    if (ctxRef.current) { try { ctxRef.current.close(); } catch (e) {} }
  }, [stopAll]);

  const mmss = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="med">
      <style>{`
        .med{color:#eaf2fb;max-width:760px;margin:0 auto}
        .med h1{font-size:1.6rem;margin:0 0 4px}
        .med .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px;line-height:1.45}
        .med .back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:7px 13px;font-weight:600;cursor:pointer;font-size:.85rem;margin-bottom:16px}
        .med-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:18px;margin-bottom:18px}
        .med-breath{display:flex;flex-direction:column;align-items:center;gap:14px;padding:24px 0}
        .med-circle{width:170px;height:170px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffae3b,#ff7a18 55%,#c84e00);box-shadow:0 0 50px rgba(255,122,24,.45);transition:transform .12s linear;display:flex;align-items:center;justify-content:center}
        .med-circle .ph{color:#1b1300;font-weight:800;font-size:1rem;text-align:center;text-shadow:0 1px 2px rgba(255,255,255,.3)}
        .med-timer{font-size:1.3rem;font-weight:800;color:#ffd27a}
        .med-ctrl{display:flex;justify-content:center;gap:12px;margin-bottom:18px;flex-wrap:wrap}
        .med-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:12px;padding:13px 28px;font-weight:800;cursor:pointer;font-size:1rem}
        .med-btn.stop{background:rgba(255,255,255,.1);color:#eaf2fb;border:1px solid rgba(255,255,255,.22)}
        .med h2{font-size:1.02rem;margin:0 0 14px}
        .med-fld{display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap}
        .med-fld label{width:140px;font-size:.86rem;color:#cfe0f3;font-weight:600}
        .med-fld input[type=range]{flex:1;min-width:140px;accent-color:#ff8a3b}
        .med-fld .val{width:54px;text-align:right;font-size:.84rem;color:#9fb6cf}
        .med select,.med input[type=number]{background:rgba(10,22,40,.7);color:#eaf2fb;border:1px solid rgba(255,255,255,.2);border-radius:10px;padding:8px 11px;font-size:.9rem;font-family:inherit}
        .med-toggle{display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.9rem;font-weight:600;color:#cfe0f3}
        .med-toggle input{width:18px;height:18px;accent-color:#ff8a3b}
        .med-note{color:#9fb6cf;font-size:.78rem;margin-top:4px}
        @media(max-width:760px){.med-fld label{width:100%}}
      `}</style>

      {goBack && <button className="back" onClick={goBack}>← Retour</button>}
      <h1>🧘 Ambiance méditation</h1>
      <p className="sub">Un bourdon sonore apaisant, une cloche périodique et un guide de respiration animé. Pose ton appareil, suis le cercle et respire. Tout est généré localement, rien n'est enregistré ni envoyé.</p>

      <div className="med-card">
        <div className="med-breath">
          <div className="med-circle" style={{ transform: `scale(${scale})` }}>
            <span className="ph">{playing ? phase : 'Prêt'}</span>
          </div>
          {playing && minutes > 0 && <div className="med-timer">{mmss(remaining)}</div>}
        </div>
        <div className="med-ctrl">
          {!playing
            ? <button className="med-btn" onClick={start}>▶ Démarrer</button>
            : <button className="med-btn stop" onClick={stopAll}>■ Arrêter</button>}
        </div>
        <div className="med-fld">
          <label>Rythme de respiration</label>
          <select value={pattern} onChange={(e) => setPattern(e.target.value)} disabled={playing}>
            {Object.entries(PATTERNS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
      </div>

      <div className="med-card">
        <h2>🎚️ Réglages sonores</h2>

        <div className="med-fld">
          <label>Volume du bourdon</label>
          <input type="range" min="0" max="1" step="0.01" value={droneVol} onChange={(e) => setDroneVol(Number(e.target.value))} />
          <span className="val">{Math.round(droneVol * 100)}%</span>
        </div>

        <div className="med-fld">
          <label>Tonalité</label>
          <select value={note} onChange={(e) => setNote(e.target.value)} disabled={playing}>
            {Object.keys(NOTES).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="med-note">{playing ? '(stoppe pour changer la note)' : 'note grave et douce'}</span>
        </div>

        <div className="med-fld">
          <label className="med-toggle">
            <input type="checkbox" checked={bellOn} onChange={(e) => setBellOn(e.target.checked)} disabled={playing} />
            Cloche périodique
          </label>
        </div>
        <div className="med-fld">
          <label>Volume cloche</label>
          <input type="range" min="0" max="1" step="0.01" value={bellVol} onChange={(e) => setBellVol(Number(e.target.value))} />
          <span className="val">{Math.round(bellVol * 100)}%</span>
        </div>
        <div className="med-fld">
          <label>Cloche toutes les</label>
          <input type="number" min="5" max="600" step="5" value={bellEvery} onChange={(e) => setBellEvery(Number(e.target.value))} disabled={playing} style={{ width: 90 }} />
          <span className="med-note">secondes</span>
        </div>

        <div className="med-fld">
          <label>Minuterie</label>
          <input type="number" min="0" max="120" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} disabled={playing} style={{ width: 90 }} />
          <span className="med-note">minutes (0 = sans limite)</span>
        </div>
      </div>
    </div>
  );
}

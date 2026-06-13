import React, { useState, useEffect, useRef } from 'react';

/**
 * WaterIntake — journal d'hydratation 100 % local & hors-ligne.
 * Définis ton objectif quotidien (ml), ajoute de l'eau par boutons rapides
 * (250 / 500 ml + montant perso), suis la barre de progression et l'historique
 * du jour. Réinitialisation quotidienne automatique. Petit rappel sonore
 * optionnel (Web Audio) à intervalle réglable.
 */

const LS_KEY = 'ff_waterintake_v1';
const todayKey = () => new Date().toISOString().slice(0, 10);

export default function WaterIntake({ goBack }) {
  const [goal, setGoal] = useState(2000);
  const [day, setDay] = useState(todayKey());
  const [entries, setEntries] = useState([]); // {id, amount, time}
  const [custom, setCustom] = useState('');
  const [remindOn, setRemindOn] = useState(false);
  const [remindMin, setRemindMin] = useState(60);
  const audioCtxRef = useRef(null);
  const timerRef = useRef(null);

  // ---- chargement + reset quotidien ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (typeof d.goal === 'number') setGoal(d.goal);
        if (typeof d.remindMin === 'number') setRemindMin(d.remindMin);
        if (d.day === todayKey() && Array.isArray(d.entries)) {
          setEntries(d.entries);
          setDay(d.day);
        }
      }
    } catch (e) { /* ignore */ }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ goal, day, entries, remindMin }));
    } catch (e) { /* ignore */ }
  }, [goal, day, entries, remindMin]);

  // ---- bascule de jour en cours d'utilisation ----
  useEffect(() => {
    const iv = setInterval(() => {
      const tk = todayKey();
      if (tk !== day) { setDay(tk); setEntries([]); }
    }, 30000);
    return () => clearInterval(iv);
  }, [day]);

  const beep = () => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 660;
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 0.52);
    } catch (e) { /* audio indisponible */ }
  };

  // ---- rappel sonore à intervalle ----
  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (remindOn) {
      const ms = Math.max(1, Number(remindMin) || 60) * 60000;
      timerRef.current = setInterval(beep, ms);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [remindOn, remindMin]);

  const total = entries.reduce((s, e) => s + e.amount, 0);
  const pct = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0;

  const add = (amount) => {
    if (!amount || amount <= 0) return;
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setEntries((prev) => [{ id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, amount, time }, ...prev]);
  };
  const addCustom = () => {
    const a = parseInt(String(custom).replace(/[^0-9]/g, ''), 10);
    if (isFinite(a) && a > 0) { add(a); setCustom(''); }
  };
  const remove = (id) => setEntries((prev) => prev.filter((e) => e.id !== id));
  const resetDay = () => setEntries([]);

  return (
    <div className="wat">
      <style>{`
        .wat{color:#eaf2fb;max-width:720px;margin:0 auto}
        .wat h1{font-size:1.6rem;margin:0 0 4px}
        .wat .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .wat-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font-weight:600;cursor:pointer;margin-bottom:14px;font-size:.85rem}
        .wat-back:hover{background:rgba(255,255,255,.14)}
        .wat-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:16px}
        .wat-prog{text-align:center}
        .wat-prog .big{font-size:2.1rem;font-weight:800;color:#5b9dff}
        .wat-prog .big span{font-size:1rem;color:#9fb6cf;font-weight:500}
        .wat-track{height:20px;background:rgba(10,22,40,.6);border-radius:12px;overflow:hidden;margin:14px 0 6px;border:1px solid rgba(255,255,255,.12)}
        .wat-fill{height:100%;background:linear-gradient(90deg,#3a7bd5,#5b9dff,#7fd0ff);transition:width .4s ease;border-radius:12px}
        .wat-pct{font-size:.85rem;color:#9fb6cf}
        .wat-goal{display:flex;align-items:center;gap:8px;justify-content:center;margin-top:10px;font-size:.9rem;color:#9fb6cf}
        .wat-goal input{width:90px;background:rgba(10,22,40,.6);border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:6px 8px;color:#eaf2fb}
        .wat-quick{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
        .wat-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:12px;padding:13px 18px;font-weight:800;cursor:pointer;font-size:.95rem}
        .wat-btn:hover{filter:brightness(1.06)}
        .wat-btn.blue{background:linear-gradient(135deg,#3a7bd5,#5b9dff);color:#fff}
        .wat-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .wat-custom{display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap}
        .wat-custom input{width:120px;background:rgba(10,22,40,.6);border:1px solid rgba(255,255,255,.18);border-radius:9px;padding:10px;color:#eaf2fb}
        .wat-custom input:focus{outline:none;border-color:#5b9dff}
        .wat-rem{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:.88rem;color:#cfe0f5}
        .wat-rem input[type=number]{width:64px;background:rgba(10,22,40,.6);border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:6px 8px;color:#eaf2fb}
        .wat-sw{width:44px;height:24px;border-radius:14px;background:rgba(255,255,255,.18);position:relative;cursor:pointer;transition:.2s;flex:0 0 44px}
        .wat-sw.on{background:#3a7bd5}
        .wat-sw b{position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;transition:.2s}
        .wat-sw.on b{left:22px}
        .wat-h{display:flex;align-items:center;gap:12px;padding:9px 12px;border-radius:10px;background:rgba(10,22,40,.4);margin-bottom:6px}
        .wat-h .amt{font-weight:700;color:#7fd0ff;min-width:80px}
        .wat-h .tm{flex:1;font-size:.82rem;color:#9fb6cf}
        .wat-x{opacity:.5;cursor:pointer;font-size:.85rem;background:none;border:none;color:#ff8a8a}
        .wat-x:hover{opacity:1}
        .wat-empty{color:#9fb6cf;text-align:center;padding:18px 10px;font-size:.9rem}
        .wat-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
        .wat-head h2{font-size:1.05rem;margin:0;color:#cfe0f5}
        @media(max-width:760px){.wat-prog .big{font-size:1.7rem}}
      `}</style>

      {goBack && <button className="wat-back" onClick={goBack}>← Retour</button>}
      <h1>💧 Hydratation du jour</h1>
      <p className="sub">Suis ta consommation d'eau, atteins ton objectif quotidien. Réinitialisation chaque jour. 100 % hors-ligne.</p>

      <div className="wat-pane wat-prog">
        <div className="big">{total}<span> / {goal} ml</span></div>
        <div className="wat-track"><div className="wat-fill" style={{ width: `${pct}%` }} /></div>
        <div className="wat-pct">{pct}% de l'objectif {pct >= 100 ? '🎉 atteint !' : ''}</div>
        <div className="wat-goal">
          🎯 Objectif :
          <input type="number" min="100" step="100" value={goal} onChange={(e) => setGoal(Math.max(0, parseInt(e.target.value, 10) || 0))} /> ml
        </div>
      </div>

      <div className="wat-pane">
        <div className="wat-quick">
          <button className="wat-btn blue" onClick={() => add(250)}>＋ 250 ml</button>
          <button className="wat-btn blue" onClick={() => add(500)}>＋ 500 ml</button>
        </div>
        <div className="wat-custom">
          <input type="text" inputMode="numeric" placeholder="ml perso" value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustom()} />
          <button className="wat-btn" onClick={addCustom}>Ajouter</button>
        </div>
      </div>

      <div className="wat-pane">
        <div className="wat-rem">
          <div className={`wat-sw ${remindOn ? 'on' : ''}`} onClick={() => { setRemindOn((v) => !v); if (!remindOn) beep(); }}><b /></div>
          <span>🔔 Rappel sonore toutes les</span>
          <input type="number" min="1" max="240" value={remindMin} onChange={(e) => setRemindMin(Math.max(1, parseInt(e.target.value, 10) || 1))} />
          <span>min</span>
          <button className="wat-btn ghost" style={{ padding: '6px 12px', fontSize: '.8rem' }} onClick={beep}>Tester</button>
        </div>
      </div>

      <div className="wat-pane">
        <div className="wat-head">
          <h2>Historique du jour</h2>
          {entries.length > 0 && <button className="wat-btn ghost" style={{ padding: '6px 12px', fontSize: '.8rem' }} onClick={resetDay}>Réinitialiser</button>}
        </div>
        {entries.length === 0 ? (
          <div className="wat-empty">Aucune prise enregistrée aujourd'hui. Bois un verre !</div>
        ) : entries.map((e) => (
          <div key={e.id} className="wat-h">
            <span className="amt">+{e.amount} ml</span>
            <span className="tm">à {e.time}</span>
            <button className="wat-x" title="Retirer" onClick={() => remove(e.id)}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';

/**
 * HabitTracker — suivi d'habitudes 100 % local & hors-ligne.
 * Définis tes habitudes, coche chaque jour (semaine ou mois en cours),
 * et suis tes séries (streaks) actuelles/records et ton % de réussite.
 * Données stockées dans le navigateur (localStorage). Rien n'est envoyé.
 */

const LS_KEY = 'habittracker_v1';
const DAY = 86400000;
const iso = (d) => d.toISOString().slice(0, 10);
const DOW = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const PALETTE = ['#ff7a18', '#5b9dff', '#46b07a', '#c879e8', '#e8c84a', '#e8607a'];

export default function HabitTracker({ goBack }) {
  const [habits, setHabits] = useState([]); // {id,name,color,done:{date:true}}
  const [name, setName] = useState('');
  const [view, setView] = useState('week'); // 'week' | 'month'

  useEffect(() => {
    try { const raw = localStorage.getItem(LS_KEY); if (raw) setHabits(JSON.parse(raw) || []); }
    catch (e) { /* indisponible : on ignore */ }
  }, []);

  const persist = (next) => {
    setHabits(next);
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch (e) { /* quota : on ignore */ }
  };

  const addHabit = () => {
    const n = name.trim(); if (!n) return;
    persist([...habits, { id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, name: n, color: PALETTE[habits.length % PALETTE.length], done: {} }]);
    setName('');
  };
  const removeHabit = (id) => persist(habits.filter((h) => h.id !== id));
  const toggle = (id, date) => persist(habits.map((h) => {
    if (h.id !== id) return h;
    const done = { ...h.done };
    if (done[date]) delete done[date]; else done[date] = true;
    return { ...h, done };
  }));

  const days = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const arr = [];
    if (view === 'week') {
      const start = new Date(today.getTime() - ((today.getDay() + 6) % 7) * DAY);
      for (let i = 0; i < 7; i++) arr.push(new Date(start.getTime() + i * DAY));
    } else {
      const count = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= count; d++) arr.push(new Date(today.getFullYear(), today.getMonth(), d));
    }
    return arr;
  }, [view]);

  const stats = (h) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    // série actuelle (jusqu'à aujourd'hui, en remontant)
    let cur = 0, t = new Date(today);
    while (h.done[iso(t)]) { cur++; t = new Date(t.getTime() - DAY); }
    // record sur toutes les dates cochées
    const keys = Object.keys(h.done).sort();
    let best = 0, run = 0, prev = null;
    for (const k of keys) {
      const d = new Date(k + 'T00:00:00').getTime();
      if (prev !== null && d - prev === DAY) run++; else run = 1;
      if (run > best) best = run; prev = d;
    }
    const total = keys.length;
    const inView = days.filter((d) => h.done[iso(d)]).length;
    const pct = days.length ? Math.round((inView / days.length) * 100) : 0;
    return { cur, best, total, pct };
  };

  const todayIso = iso(new Date());

  return (
    <div className="ht">
      <style>{`
        .ht{color:#eaf2fb;max-width:1000px;margin:0 auto;font-family:system-ui,sans-serif}
        .ht h1{font-size:1.55rem;margin:0 0 4px}
        .ht .sub{color:#9fb6cf;font-size:.88rem;margin:0 0 16px}
        .ht-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font-weight:600;cursor:pointer;margin-bottom:14px}
        .ht-bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:16px}
        .ht-bar input{flex:1;min-width:170px;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.15);border-radius:10px;color:#eaf2fb;padding:11px;font-size:.92rem}
        .ht-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:11px 16px;font-weight:700;cursor:pointer;font-size:.9rem}
        .ht-seg{display:flex;background:rgba(0,0,0,.25);border-radius:10px;padding:3px}
        .ht-seg button{background:none;border:none;color:#9fb6cf;padding:8px 14px;border-radius:8px;cursor:pointer;font-weight:600;font-size:.85rem}
        .ht-seg button.on{background:rgba(91,157,255,.28);color:#eaf2fb}
        .ht-wrap{overflow-x:auto;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:rgba(255,255,255,.04)}
        .ht-table{border-collapse:collapse;width:100%;min-width:540px}
        .ht-table th,.ht-table td{padding:7px 6px;text-align:center;font-size:.78rem}
        .ht-table thead th{color:#9fb6cf;font-weight:600;border-bottom:1px solid rgba(255,255,255,.12);position:sticky;top:0}
        .ht-table .nm{text-align:left;min-width:120px;font-weight:600;font-size:.9rem}
        .ht-table th.today,.ht-table td.today{background:rgba(255,174,59,.12)}
        .ht-chk{width:24px;height:24px;border-radius:7px;border:1.5px solid rgba(255,255,255,.25);cursor:pointer;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:.8rem;color:#10130a;transition:.12s}
        .ht-stats{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap}
        .ht-pill{background:rgba(0,0,0,.25);border-radius:8px;padding:3px 8px;font-size:.7rem;color:#cfe0f5;white-space:nowrap}
        .ht-pill b{color:#ffae3b}
        .ht-del{background:none;border:none;color:#e8908f;cursor:pointer;font-size:.85rem;opacity:.7}
        .ht-del:hover{opacity:1}
        .ht-empty{text-align:center;color:#9fb6cf;padding:34px;font-size:.9rem}
        @media(max-width:760px){.ht-table .nm{min-width:90px;font-size:.82rem}}
      `}</style>

      {goBack && <button className="ht-back" onClick={goBack}>← Retour</button>}
      <h1>✅ Suivi d'habitudes</h1>
      <p className="sub">Coche tes habitudes chaque jour, suis tes séries et ton taux de réussite. 🔒 Données locales uniquement.</p>

      <div className="ht-bar">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nouvelle habitude (ex. Boire 2 L d'eau)"
               onKeyDown={(e) => e.key === 'Enter' && addHabit()} />
        <button className="ht-btn" onClick={addHabit}>＋ Ajouter</button>
        <div className="ht-seg">
          <button className={view === 'week' ? 'on' : ''} onClick={() => setView('week')}>Semaine</button>
          <button className={view === 'month' ? 'on' : ''} onClick={() => setView('month')}>Mois</button>
        </div>
      </div>

      {habits.length === 0 ? (
        <div className="ht-empty">Aucune habitude pour l'instant. Ajoute-en une pour commencer ton suivi.</div>
      ) : (
        <div className="ht-wrap">
          <table className="ht-table">
            <thead>
              <tr>
                <th className="nm">Habitude</th>
                {days.map((d) => {
                  const k = iso(d); const isToday = k === todayIso;
                  return <th key={k} className={isToday ? 'today' : ''}>
                    {view === 'week' ? DOW[(d.getDay() + 6) % 7] : ''}<br />{d.getDate()}
                  </th>;
                })}
                <th style={{ minWidth: 150 }}>Stats</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {habits.map((h) => {
                const s = stats(h);
                return (
                  <tr key={h.id}>
                    <td className="nm" style={{ color: h.color }}>{h.name}</td>
                    {days.map((d) => {
                      const k = iso(d); const on = !!h.done[k]; const isToday = k === todayIso;
                      return (
                        <td key={k} className={isToday ? 'today' : ''}>
                          <div className="ht-chk" onClick={() => toggle(h.id, k)} title={k}
                               style={on ? { background: h.color, borderColor: h.color } : {}}>{on ? '✓' : ''}</div>
                        </td>
                      );
                    })}
                    <td>
                      <div className="ht-stats">
                        <span className="ht-pill">🔥 série <b>{s.cur}</b></span>
                        <span className="ht-pill">🏆 record <b>{s.best}</b></span>
                        <span className="ht-pill">✓ <b>{s.pct}%</b></span>
                      </div>
                    </td>
                    <td><button className="ht-del" onClick={() => removeHabit(h.id)} title="Supprimer">✕</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

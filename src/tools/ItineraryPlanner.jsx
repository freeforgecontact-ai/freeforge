import React, { useState, useEffect, useMemo } from 'react';

/**
 * ItineraryPlanner — planificateur d'itinéraire de voyage jour par jour.
 * Ajoute des journées (date/titre) ; pour chaque jour, des activités avec
 * heure, lieu, note et coût. Calcule le budget par jour et le total du voyage.
 * 100 % local & hors-ligne. Tout est mémorisé dans localStorage.
 */

const LS_KEY = 'ff_itinerary_planner_v1';
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;

export default function ItineraryPlanner({ goBack }) {
  const [trip, setTrip] = useState('Mon voyage');
  const [currency, setCurrency] = useState('CAD');
  const [days, setDays] = useState([]); // {id,date,title,acts:[{id,time,place,note,cost}]}

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.trip) setTrip(d.trip);
        if (d.currency) setCurrency(d.currency);
        if (Array.isArray(d.days)) setDays(d.days);
      }
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ trip, currency, days }));
    } catch (e) { /* ignore */ }
  }, [trip, currency, days]);

  const addDay = () => {
    setDays((d) => [...d, { id: uid(), date: '', title: `Jour ${d.length + 1}`, acts: [] }]);
  };
  const removeDay = (id) => setDays((d) => d.filter((x) => x.id !== id));
  const editDay = (id, key, val) =>
    setDays((d) => d.map((x) => (x.id === id ? { ...x, [key]: val } : x)));

  const addAct = (dayId) =>
    setDays((d) => d.map((x) => (x.id === dayId
      ? { ...x, acts: [...x.acts, { id: uid(), time: '', place: '', note: '', cost: '' }] }
      : x)));
  const editAct = (dayId, actId, key, val) =>
    setDays((d) => d.map((x) => (x.id === dayId
      ? { ...x, acts: x.acts.map((a) => (a.id === actId ? { ...a, [key]: val } : a)) }
      : x)));
  const removeAct = (dayId, actId) =>
    setDays((d) => d.map((x) => (x.id === dayId
      ? { ...x, acts: x.acts.filter((a) => a.id !== actId) }
      : x)));

  const dayTotal = (day) => day.acts.reduce((s, a) => s + (parseFloat(a.cost) || 0), 0);
  const grandTotal = useMemo(() => days.reduce((s, d) => s + dayTotal(d), 0), [days]);
  const actCount = useMemo(() => days.reduce((s, d) => s + d.acts.length, 0), [days]);

  const fmtMoney = (n) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

  return (
    <div className="itp">
      <style>{`
        .itp{color:#eaf2fb;max-width:860px;margin:0 auto}
        .itp h1{font-size:1.6rem;margin:0 0 4px}
        .itp .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .itp-top{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:16px;display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap}
        .itp-f{display:flex;flex-direction:column;gap:5px}
        .itp-f label{font-size:.78rem;color:#9fb6cf}
        .itp input,.itp select,.itp textarea{background:rgba(10,22,40,.6);border:1px solid rgba(255,255,255,.18);border-radius:9px;color:#eaf2fb;padding:9px 11px;font-size:.95rem;font-family:inherit;box-sizing:border-box}
        .itp input:focus,.itp select:focus,.itp textarea:focus{outline:none;border-color:#5b9dff}
        .itp-total{margin-left:auto;text-align:right}
        .itp-total .lbl{font-size:.75rem;color:#9fb6cf}
        .itp-total .v{font-size:1.5rem;font-weight:800;color:#ffae3b}
        .itp-day{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:14px}
        .itp-dhead{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px}
        .itp-dhead .ttl{flex:1;min-width:140px;font-size:1.05rem;font-weight:700}
        .itp-dhead input[type=date]{max-width:160px}
        .itp-act{display:grid;grid-template-columns:78px 1fr 110px 30px;gap:8px;align-items:start;padding:8px;border-radius:10px;background:rgba(10,22,40,.35);margin-bottom:8px}
        .itp-act .note{grid-column:2/4}
        .itp-act textarea{width:100%;min-height:38px;resize:vertical}
        .itp-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;font-size:.9rem}
        .itp-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .itp-x{background:rgba(255,90,90,.12);border:1px solid rgba(255,90,90,.3);color:#ff9a9a;border-radius:8px;cursor:pointer;font-size:.85rem;padding:6px}
        .itp-x:hover{background:rgba(255,90,90,.25)}
        .itp-dsum{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.1);color:#9fb6cf;font-size:.9rem}
        .itp-dsum b{color:#ffae3b}
        .itp-empty{text-align:center;color:#9fb6cf;padding:36px 10px}
        @media(max-width:760px){.itp-act{grid-template-columns:64px 1fr 86px;}.itp-act .rm{grid-column:3/4;justify-self:end}.itp-act .note{grid-column:1/4}}
      `}</style>

      {goBack && <button className="itp-btn ghost" style={{ marginBottom: 14 }} onClick={goBack}>← Retour</button>}

      <h1>🗺️ Planificateur d'itinéraire</h1>
      <p className="sub">Organise ton voyage jour par jour. 100 % local — rien n'est envoyé.</p>

      <div className="itp-top">
        <div className="itp-f" style={{ flex: 1, minWidth: 180 }}>
          <label>Nom du voyage</label>
          <input value={trip} onChange={(e) => setTrip(e.target.value)} placeholder="Mon voyage" />
        </div>
        <div className="itp-f">
          <label>Devise</label>
          <input style={{ width: 80 }} maxLength={4} value={currency}
                 onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
        </div>
        <div className="itp-total">
          <div className="lbl">{days.length} jour(s) · {actCount} activité(s) · Total</div>
          <div className="v">{fmtMoney(grandTotal)} {currency}</div>
        </div>
      </div>

      {days.length === 0 && (
        <div className="itp-day itp-empty">
          Aucune journée. Clique « Ajouter une journée » pour commencer ton itinéraire.
        </div>
      )}

      {days.map((day, i) => (
        <div key={day.id} className="itp-day">
          <div className="itp-dhead">
            <input className="ttl" value={day.title}
                   onChange={(e) => editDay(day.id, 'title', e.target.value)}
                   placeholder={`Jour ${i + 1}`} />
            <input type="date" value={day.date}
                   onChange={(e) => editDay(day.id, 'date', e.target.value)} />
            <button className="itp-x" title="Supprimer la journée" onClick={() => removeDay(day.id)}>🗑</button>
          </div>

          {day.acts.map((a) => (
            <div key={a.id} className="itp-act">
              <input type="time" value={a.time}
                     onChange={(e) => editAct(day.id, a.id, 'time', e.target.value)} />
              <input value={a.place} placeholder="Lieu / activité"
                     onChange={(e) => editAct(day.id, a.id, 'place', e.target.value)} />
              <input type="number" inputMode="decimal" value={a.cost} placeholder="Coût"
                     onChange={(e) => editAct(day.id, a.id, 'cost', e.target.value)} />
              <button className="itp-x rm" title="Retirer" onClick={() => removeAct(day.id, a.id)}>✕</button>
              <textarea className="note" value={a.note} placeholder="Note (réservation, adresse…)"
                        onChange={(e) => editAct(day.id, a.id, 'note', e.target.value)} />
            </div>
          ))}

          <div className="itp-dsum">
            <button className="itp-btn ghost" onClick={() => addAct(day.id)}>＋ Activité</button>
            <span>Budget du jour : <b>{fmtMoney(dayTotal(day))} {currency}</b></span>
          </div>
        </div>
      ))}

      <button className="itp-btn" style={{ width: '100%', padding: 14 }} onClick={addDay}>
        ＋ Ajouter une journée
      </button>
    </div>
  );
}

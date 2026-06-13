import React, { useState, useEffect, useMemo } from 'react';

/**
 * CalorieTracker — journal de calories et macros, 100 % local & hors-ligne.
 * Ajout d'aliments (calories, protéines, glucides, lipides), totaux du jour,
 * objectif calorique et camembert SVG des macros. Persistance par date (localStorage).
 */

const LS_KEY = 'ff_calorie_tracker_v1';
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;
const today = () => new Date().toISOString().slice(0, 10);

export default function CalorieTracker({ goBack }) {
  const [date, setDate] = useState(today());
  const [days, setDays] = useState({});      // { 'YYYY-MM-DD': [{id,name,kcal,p,c,f}] }
  const [goal, setGoal] = useState(2000);
  const [form, setForm] = useState({ name: '', kcal: '', p: '', c: '', f: '' });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) { const d = JSON.parse(raw); if (d.days) setDays(d.days); if (d.goal) setGoal(d.goal); }
    } catch (e) { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ days, goal })); } catch (e) { /* ignore */ }
  }, [days, goal]);

  const items = days[date] || [];
  const num = (v) => Math.max(0, parseFloat(v) || 0);

  const addItem = () => {
    if (!form.name.trim()) return;
    const it = { id: uid(), name: form.name.trim(), kcal: num(form.kcal), p: num(form.p), c: num(form.c), f: num(form.f) };
    setDays((d) => ({ ...d, [date]: [...(d[date] || []), it] }));
    setForm({ name: '', kcal: '', p: '', c: '', f: '' });
  };
  const delItem = (id) => setDays((d) => ({ ...d, [date]: (d[date] || []).filter((i) => i.id !== id) }));

  const totals = useMemo(() => items.reduce((a, i) => ({
    kcal: a.kcal + i.kcal, p: a.p + i.p, c: a.c + i.c, f: a.f + i.f,
  }), { kcal: 0, p: 0, c: 0, f: 0 }), [items]);

  // camembert macros (kcal/g : prot 4, gluc 4, lip 9)
  const macroKcal = { p: totals.p * 4, c: totals.c * 4, f: totals.f * 9 };
  const macroSum = macroKcal.p + macroKcal.c + macroKcal.f;
  const slices = [
    { key: 'p', label: 'Protéines', g: totals.p, k: macroKcal.p, color: '#5b9dff' },
    { key: 'c', label: 'Glucides', g: totals.c, k: macroKcal.c, color: '#ff7a18' },
    { key: 'f', label: 'Lipides', g: totals.f, k: macroKcal.f, color: '#3bd6a0' },
  ];
  const arcs = useMemo(() => {
    if (macroSum <= 0) return [];
    let acc = 0; const R = 70, C = 90;
    return slices.map((s) => {
      const frac = s.k / macroSum;
      const a0 = acc * 2 * Math.PI - Math.PI / 2;
      acc += frac;
      const a1 = acc * 2 * Math.PI - Math.PI / 2;
      const large = frac > 0.5 ? 1 : 0;
      const x0 = C + R * Math.cos(a0), y0 = C + R * Math.sin(a0);
      const x1 = C + R * Math.cos(a1), y1 = C + R * Math.sin(a1);
      const d = frac >= 0.999
        ? `M ${C - R} ${C} A ${R} ${R} 0 1 1 ${C + R} ${C} A ${R} ${R} 0 1 1 ${C - R} ${C} Z`
        : `M ${C} ${C} L ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`;
      return { ...s, d, frac };
    });
  }, [macroSum, slices]);

  const pct = goal > 0 ? Math.min(100, (totals.kcal / goal) * 100) : 0;
  const over = totals.kcal > goal;
  const r1 = (v) => Math.round(v);

  return (
    <div className="cal">
      <style>{`
        .cal{color:#eaf2fb;max-width:1000px;margin:0 auto}
        .cal h1{font-size:1.6rem;margin:0 0 4px}
        .cal .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .cal-top{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:16px}
        .cal-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px}
        .cal-grid{display:grid;grid-template-columns:1fr 320px;gap:18px;align-items:start}
        .cal input,.cal select{background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.16);color:#eaf2fb;border-radius:8px;padding:8px 10px;font-size:.85rem}
        .cal-form{display:grid;grid-template-columns:1fr 70px 60px 60px 60px auto;gap:8px;align-items:center;margin-bottom:12px}
        .cal-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:9px 14px;font-weight:700;cursor:pointer;font-size:.85rem}
        .cal-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .cal-it{display:grid;grid-template-columns:1fr 70px 50px 50px 50px 28px;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:.85rem}
        .cal-it .mut{color:#9fb6cf;text-align:center}
        .cal-x{background:none;border:none;color:#ff8a8a;cursor:pointer;font-size:.95rem}
        .cal-bar{height:14px;border-radius:8px;background:rgba(255,255,255,.1);overflow:hidden;margin:8px 0 4px}
        .cal-bar > span{display:block;height:100%;background:linear-gradient(90deg,#ff7a18,#ffae3b);transition:width .25s}
        .cal-bar.over > span{background:linear-gradient(90deg,#ff5a5a,#ff8a8a)}
        .cal-leg{display:flex;align-items:center;gap:8px;font-size:.82rem;margin-top:6px}
        .cal-dot{width:11px;height:11px;border-radius:3px;display:inline-block}
        .cal-empty{color:#9fb6cf;text-align:center;padding:24px 8px;font-size:.88rem}
        .cal-kpi{font-size:2rem;font-weight:800;line-height:1}
        @media(max-width:760px){.cal-grid{grid-template-columns:1fr}.cal-form{grid-template-columns:1fr 1fr}.cal-form>button{grid-column:1/-1}}
      `}</style>

      <div className="no-print" style={{ marginBottom: 14 }}>
        {goBack && <button className="cal-btn ghost" onClick={goBack}>← Retour</button>}
      </div>

      <h1>🍎 Journal de calories & macros</h1>
      <p className="sub">Note tes aliments, suis tes calories et ta répartition de macronutriments. Tout reste sur ton appareil.</p>

      <div className="cal-top">
        <label style={{ fontSize: '.82rem', color: '#9fb6cf' }}>Date&nbsp;
          <input type="date" value={date} onChange={(e) => setDate(e.target.value || today())} />
        </label>
        <label style={{ fontSize: '.82rem', color: '#9fb6cf' }}>Objectif (kcal)&nbsp;
          <input type="number" min="0" style={{ width: 90 }} value={goal} onChange={(e) => setGoal(Math.max(0, parseInt(e.target.value) || 0))} />
        </label>
      </div>

      <div className="cal-grid">
        <div className="cal-card">
          <div className="cal-form">
            <input placeholder="Aliment" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && addItem()} />
            <input type="number" min="0" placeholder="kcal" value={form.kcal} onChange={(e) => setForm((f) => ({ ...f, kcal: e.target.value }))} />
            <input type="number" min="0" placeholder="Prot" value={form.p} onChange={(e) => setForm((f) => ({ ...f, p: e.target.value }))} />
            <input type="number" min="0" placeholder="Gluc" value={form.c} onChange={(e) => setForm((f) => ({ ...f, c: e.target.value }))} />
            <input type="number" min="0" placeholder="Lip" value={form.f} onChange={(e) => setForm((f) => ({ ...f, f: e.target.value }))} />
            <button className="cal-btn" onClick={addItem}>＋</button>
          </div>

          <div className="cal-it" style={{ color: '#9fb6cf', fontSize: '.7rem', textTransform: 'uppercase' }}>
            <span>Aliment</span><span style={{ textAlign: 'center' }}>kcal</span><span style={{ textAlign: 'center' }}>P</span><span style={{ textAlign: 'center' }}>G</span><span style={{ textAlign: 'center' }}>L</span><span></span>
          </div>
          {items.length === 0 ? (
            <div className="cal-empty">Aucun aliment pour cette date. Ajoute ton premier repas ci-dessus.</div>
          ) : items.map((i) => (
            <div className="cal-it" key={i.id}>
              <span>{i.name}</span>
              <span className="mut">{r1(i.kcal)}</span>
              <span className="mut">{r1(i.p)}</span>
              <span className="mut">{r1(i.c)}</span>
              <span className="mut">{r1(i.f)}</span>
              <button className="cal-x" onClick={() => delItem(i.id)} title="Supprimer">✕</button>
            </div>
          ))}
          {items.length > 0 && (
            <div className="cal-it" style={{ fontWeight: 800, borderBottom: 'none' }}>
              <span>Total</span>
              <span className="mut">{r1(totals.kcal)}</span>
              <span className="mut">{r1(totals.p)}</span>
              <span className="mut">{r1(totals.c)}</span>
              <span className="mut">{r1(totals.f)}</span>
              <span></span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="cal-card">
            <div style={{ fontSize: '.78rem', color: '#9fb6cf', textTransform: 'uppercase' }}>Calories du jour</div>
            <div className="cal-kpi" style={{ color: over ? '#ff8a8a' : '#eaf2fb' }}>{r1(totals.kcal)} <span style={{ fontSize: '.9rem', color: '#9fb6cf', fontWeight: 400 }}>/ {goal} kcal</span></div>
            <div className={`cal-bar ${over ? 'over' : ''}`}><span style={{ width: `${pct}%` }} /></div>
            <div style={{ fontSize: '.8rem', color: over ? '#ff8a8a' : '#9fb6cf' }}>
              {over ? `⚠️ Dépassement de ${r1(totals.kcal - goal)} kcal` : `Reste ${r1(goal - totals.kcal)} kcal`}
            </div>
          </div>

          <div className="cal-card">
            <h3 style={{ fontSize: '.95rem', margin: '0 0 10px' }}>📊 Répartition des macros</h3>
            {macroSum <= 0 ? (
              <div className="cal-empty" style={{ padding: '12px 4px' }}>Ajoute des macros pour voir le graphique.</div>
            ) : (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <svg width="180" height="180" viewBox="0 0 180 180" role="img" aria-label="Répartition des macronutriments">
                  {arcs.map((a) => <path key={a.key} d={a.d} fill={a.color} stroke="#0a1628" strokeWidth="1.5" />)}
                  <circle cx="90" cy="90" r="34" fill="#0a1628" />
                  <text x="90" y="86" textAnchor="middle" fontSize="13" fontWeight="700" fill="#eaf2fb">{r1(macroSum)}</text>
                  <text x="90" y="102" textAnchor="middle" fontSize="9" fill="#9fb6cf">kcal macros</text>
                </svg>
                <div>
                  {slices.map((s) => (
                    <div className="cal-leg" key={s.key}>
                      <span className="cal-dot" style={{ background: s.color }} />
                      <span>{s.label} — {r1(s.g)} g ({macroSum > 0 ? Math.round((s.k / macroSum) * 100) : 0}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

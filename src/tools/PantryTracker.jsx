import React, { useState, useEffect } from 'react';

/**
 * PantryTracker — suivi du garde-manger et des dates de péremption.
 * Ajoute tes denrées (nom, quantité, date de péremption). La liste est triée
 * par date ; ce qui périme bientôt (≤ 3 jours) ou est déjà périmé est mis en
 * évidence par des couleurs. 100 % local, hors-ligne.
 */

const LS_KEY = 'ff_pantrytracker_v1';
const MS_DAY = 86400000;

const daysLeft = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - today.getTime()) / MS_DAY);
};

const statusOf = (dl) => {
  if (dl === null) return { cls: 'none', label: 'Sans date' };
  if (dl < 0) return { cls: 'expired', label: `Périmé (${Math.abs(dl)} j)` };
  if (dl === 0) return { cls: 'soon', label: "Périme aujourd'hui" };
  if (dl <= 3) return { cls: 'soon', label: `Bientôt (${dl} j)` };
  return { cls: 'ok', label: `${dl} j restants` };
};

export default function PantryTracker({ goBack }) {
  const [items, setItems] = useState([]); // {id, name, qty, date}
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) { const d = JSON.parse(raw); if (Array.isArray(d)) setItems(d); }
    } catch (e) { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch (e) { /* ignore */ }
  }, [items]);

  const addItem = () => {
    const nm = name.trim();
    if (!nm) return;
    setItems((prev) => [...prev, { id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, name: nm, qty: qty.trim(), date }]);
    setName(''); setQty(''); setDate('');
  };
  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const sorted = [...items].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });
  const expiredCount = items.filter((i) => { const dl = daysLeft(i.date); return dl !== null && dl < 0; }).length;
  const soonCount = items.filter((i) => { const dl = daysLeft(i.date); return dl !== null && dl >= 0 && dl <= 3; }).length;

  return (
    <div className="ptr">
      <style>{`
        .ptr{color:#eaf2fb;max-width:820px;margin:0 auto}
        .ptr h1{font-size:1.6rem;margin:0 0 4px}
        .ptr .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .ptr-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font-weight:600;cursor:pointer;margin-bottom:14px;font-size:.85rem}
        .ptr-back:hover{background:rgba(255,255,255,.14)}
        .ptr-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:16px}
        .ptr-row{display:flex;gap:8px;flex-wrap:wrap;align-items:end}
        .ptr-fld{display:flex;flex-direction:column;gap:4px}
        .ptr-fld label{font-size:.75rem;color:#9fb6cf}
        .ptr input{background:rgba(10,22,40,.6);border:1px solid rgba(255,255,255,.18);border-radius:9px;padding:9px 10px;color:#eaf2fb;font-size:.9rem}
        .ptr input:focus{outline:none;border-color:#5b9dff}
        .ptr-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer;font-size:.9rem}
        .ptr-btn:hover{filter:brightness(1.06)}
        .ptr-stats{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px}
        .ptr-chip{border-radius:10px;padding:8px 14px;font-size:.85rem;font-weight:600;border:1px solid}
        .ptr-chip.tot{background:rgba(91,157,255,.16);border-color:rgba(91,157,255,.45);color:#bcd6ff}
        .ptr-chip.warn{background:rgba(255,176,59,.16);border-color:rgba(255,176,59,.5);color:#ffd28a}
        .ptr-chip.bad{background:rgba(255,90,90,.16);border-color:rgba(255,90,90,.5);color:#ffb0b0}
        .ptr-item{display:flex;align-items:center;gap:12px;padding:11px 13px;border-radius:11px;background:rgba(10,22,40,.4);margin-bottom:8px;border-left:5px solid #5b9dff}
        .ptr-item.expired{border-left-color:#ff5a5a;background:rgba(255,90,90,.1)}
        .ptr-item.soon{border-left-color:#ffb03b;background:rgba(255,176,59,.1)}
        .ptr-item.none{border-left-color:#5d7591}
        .ptr-item .nm{flex:1;min-width:0;font-weight:600}
        .ptr-item .q{font-size:.78rem;color:#9fb6cf;font-weight:400}
        .ptr-item .tag{font-size:.78rem;font-weight:700;white-space:nowrap}
        .ptr-item.expired .tag{color:#ff8a8a}
        .ptr-item.soon .tag{color:#ffc46b}
        .ptr-item.ok .tag{color:#8ad6a0}
        .ptr-item.none .tag{color:#9fb6cf}
        .ptr-x{opacity:.5;cursor:pointer;font-size:.85rem;background:none;border:none;color:#ff8a8a}
        .ptr-x:hover{opacity:1}
        .ptr-empty{color:#9fb6cf;text-align:center;padding:24px 10px;font-size:.9rem}
        @media(max-width:760px){.ptr-row{flex-direction:column;align-items:stretch}.ptr-row input{width:100%}.ptr-item .date{display:none}}
      `}</style>

      {goBack && <button className="ptr-back" onClick={goBack}>← Retour</button>}
      <h1>🥫 Garde-manger</h1>
      <p className="sub">Suis tes denrées et leurs dates de péremption. Ce qui périme bientôt ou est périmé apparaît en couleur. 100 % hors-ligne.</p>

      <div className="ptr-pane">
        <div className="ptr-row">
          <div className="ptr-fld" style={{ flex: '1 1 160px' }}>
            <label>Denrée</label>
            <input type="text" placeholder="Yaourts nature" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem()} />
          </div>
          <div className="ptr-fld" style={{ flex: '0 0 110px' }}>
            <label>Quantité</label>
            <input type="text" placeholder="x4" value={qty} onChange={(e) => setQty(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem()} />
          </div>
          <div className="ptr-fld" style={{ flex: '0 0 150px' }}>
            <label>Péremption</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem()} />
          </div>
          <button className="ptr-btn" onClick={addItem}>＋ Ajouter</button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="ptr-stats">
          <span className="ptr-chip tot">{items.length} denrée(s)</span>
          {soonCount > 0 && <span className="ptr-chip warn">⚠ {soonCount} bientôt périmé(s)</span>}
          {expiredCount > 0 && <span className="ptr-chip bad">✕ {expiredCount} périmé(s)</span>}
        </div>
      )}

      <div className="ptr-pane">
        {sorted.length === 0 ? (
          <div className="ptr-empty">Garde-manger vide. Ajoute une denrée ci-dessus.</div>
        ) : sorted.map((i) => {
          const dl = daysLeft(i.date);
          const st = statusOf(dl);
          return (
            <div key={i.id} className={`ptr-item ${st.cls}`}>
              <span className="nm">
                {i.name}{i.qty ? <span className="q"> · {i.qty}</span> : null}
                {i.date && <><br /><span className="q date">📅 {new Date(i.date + 'T00:00:00').toLocaleDateString('fr-FR')}</span></>}
              </span>
              <span className="tag">{st.label}</span>
              <button className="ptr-x" title="Retirer" onClick={() => removeItem(i.id)}>✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

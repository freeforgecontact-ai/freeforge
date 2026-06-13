import React, { useState, useMemo } from 'react';

/**
 * EmergencyFund — Simulateur de fonds d'urgence.
 * 100 % local & hors-ligne. Calcule le montant cible (X mois de dépenses),
 * le manque à combler et le nombre de mois pour l'atteindre selon la cotisation.
 * Barre de progression. Aucune donnée n'est envoyée sur Internet.
 */

export default function EmergencyFund({ goBack }) {
  const [depenses, setDepenses] = useState('2500');
  const [moisCible, setMoisCible] = useState(6);
  const [epargne, setEpargne] = useState('3000');
  const [cotisation, setCotisation] = useState('300');

  const r = useMemo(() => {
    const d = parseFloat(depenses) || 0;
    const e = parseFloat(epargne) || 0;
    const c = parseFloat(cotisation) || 0;
    const cible = d * moisCible;
    const manque = Math.max(0, cible - e);
    const pct = cible > 0 ? Math.min(100, (e / cible) * 100) : 0;
    let moisRestants = null;
    if (manque <= 0) moisRestants = 0;
    else if (c > 0) moisRestants = Math.ceil(manque / c);
    const moisCouverts = d > 0 ? e / d : 0;
    return { cible, manque, pct, moisRestants, moisCouverts, d, c };
  }, [depenses, moisCible, epargne, cotisation]);

  const fmt = (x) => (x || 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });
  const atteint = r.manque <= 0;
  const dateFin = useMemo(() => {
    if (!r.moisRestants) return null;
    const dt = new Date();
    dt.setMonth(dt.getMonth() + r.moisRestants);
    return dt.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });
  }, [r.moisRestants]);

  return (
    <div className="ef">
      <style>{`
        .ef{color:#eaf2fb;max-width:680px;margin:0 auto}
        .ef h1{font-size:1.5rem;margin:0 0 4px}
        .ef .sub{color:#9fb6cf;font-size:.88rem;margin:0 0 16px}
        .ef-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font-weight:600;cursor:pointer;font-size:.85rem;margin-bottom:14px}
        .ef-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:16px}
        .ef-field{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}
        .ef-field label{font-size:.82rem;color:#9fb6cf;font-weight:600}
        .ef input{background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:10px 12px;color:#eaf2fb;font-size:.95rem;width:100%}
        .ef-segs{display:flex;gap:8px}
        .ef-seg{flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16);color:#eaf2fb;border-radius:10px;padding:10px;cursor:pointer;font-size:.85rem;font-weight:700}
        .ef-seg.on{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border-color:transparent}
        .ef-prog{height:26px;border-radius:13px;background:rgba(255,255,255,.08);overflow:hidden;position:relative;margin:6px 0 4px}
        .ef-prog i{display:block;height:100%;background:linear-gradient(90deg,#ff7a18,#ffae3b);transition:width .4s ease}
        .ef-prog.done i{background:linear-gradient(90deg,#22c55e,#3ddc97)}
        .ef-prog span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:800;color:#0b1628;text-shadow:0 1px 1px rgba(255,255,255,.3)}
        .ef-stats{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
        .ef-stat{background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px}
        .ef-stat .k{font-size:.76rem;color:#9fb6cf}
        .ef-stat .v{font-size:1.2rem;font-weight:800;color:#ffae3b}
        .ef-ok{background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.45);color:#86efac;border-radius:12px;padding:12px;font-weight:600;text-align:center;font-size:.9rem}
        .ef-note{font-size:.78rem;color:#9fb6cf;background:rgba(91,157,255,.1);border:1px solid rgba(91,157,255,.3);border-radius:10px;padding:10px;line-height:1.4}
        @media(max-width:760px){.ef-stats{grid-template-columns:1fr}}
      `}</style>

      {goBack && <button className="ef-back" onClick={goBack}>← Retour</button>}
      <h1>🛟 Fonds d'urgence</h1>
      <p className="sub">Combien mettre de côté pour les imprévus, et en combien de temps l'atteindre.</p>

      <div className="ef-card">
        <div className="ef-field"><label>Dépenses mensuelles essentielles ($)</label><input type="number" min="0" value={depenses} onChange={(e) => setDepenses(e.target.value)} /></div>
        <div className="ef-field">
          <label>Objectif (mois de coussin)</label>
          <div className="ef-segs">
            {[3, 6, 12].map((m) => (
              <button key={m} className={`ef-seg ${moisCible === m ? 'on' : ''}`} onClick={() => setMoisCible(m)}>{m} mois</button>
            ))}
          </div>
        </div>
        <div className="ef-field"><label>Épargne déjà accumulée ($)</label><input type="number" min="0" value={epargne} onChange={(e) => setEpargne(e.target.value)} /></div>
        <div className="ef-field"><label>Cotisation mensuelle ($)</label><input type="number" min="0" value={cotisation} onChange={(e) => setCotisation(e.target.value)} /></div>
      </div>

      <div className="ef-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', marginBottom: 4 }}>
          <span style={{ color: '#9fb6cf' }}>Progression vers {fmt(r.cible)}</span>
          <span style={{ fontWeight: 700 }}>{fmt(parseFloat(epargne) || 0)}</span>
        </div>
        <div className={`ef-prog ${atteint ? 'done' : ''}`}>
          <i style={{ width: `${r.pct}%` }} />
          <span>{Math.round(r.pct)}%</span>
        </div>
        <div style={{ fontSize: '.8rem', color: '#9fb6cf' }}>Couvre actuellement {r.moisCouverts.toFixed(1)} mois de dépenses.</div>

        <div className="ef-stats">
          <div className="ef-stat"><div className="k">Montant cible</div><div className="v">{fmt(r.cible)}</div></div>
          <div className="ef-stat"><div className="k">Manque à combler</div><div className="v" style={{ color: atteint ? '#3ddc97' : '#ffae3b' }}>{fmt(r.manque)}</div></div>
        </div>

        <div style={{ marginTop: 14 }}>
          {atteint ? (
            <div className="ef-ok">✅ Objectif atteint ! Votre fonds d'urgence couvre {moisCible} mois.</div>
          ) : r.moisRestants ? (
            <div className="ef-ok" style={{ background: 'rgba(255,174,59,.12)', borderColor: 'rgba(255,174,59,.4)', color: '#ffd9a0' }}>
              ⏳ Atteint en <strong>{r.moisRestants} mois</strong>{dateFin ? ` (~ ${dateFin})` : ''} au rythme actuel.
            </div>
          ) : (
            <div className="ef-ok" style={{ background: 'rgba(239,68,68,.12)', borderColor: 'rgba(239,68,68,.4)', color: '#fca5a5' }}>
              Ajoutez une cotisation mensuelle pour estimer le délai.
            </div>
          )}
        </div>
      </div>

      <p className="ef-note">💡 Un fonds d'urgence sert à couvrir 3 à 12 mois de dépenses essentielles en cas de perte d'emploi ou d'imprévu. Estimation <strong>approximative</strong>, hors rendement et inflation.</p>
    </div>
  );
}

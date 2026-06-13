import React, { useState, useMemo } from 'react';

/**
 * NetSalaryCalculator — Calculateur de salaire net (Québec).
 * 100 % local & hors-ligne. Estimation approximative basée sur les paliers 2026.
 * Impôt fédéral (avec abattement QC 16,5 % + crédit de base), impôt provincial,
 * RRQ et RQAP. Aucune donnée n'est envoyée sur Internet.
 */

const PERIODES = {
  annuel: { label: 'Annuel', parAn: 1 },
  mensuel: { label: 'Mensuel', parAn: 12 },
  bimensuel: { label: 'Aux 2 semaines', parAn: 26 },
  horaire: { label: 'Horaire', parAn: 0 }, // calculé via heures/sem
};

function impotFederal(income) {
  const brackets = [
    { limit: 55867, rate: 0.15 },
    { limit: 111733, rate: 0.205 },
    { limit: 173205, rate: 0.26 },
    { limit: 246752, rate: 0.29 },
    { limit: Infinity, rate: 0.33 },
  ];
  let tax = 0, remaining = income, prev = 0;
  for (const { limit, rate } of brackets) {
    const part = Math.min(remaining, limit - prev);
    tax += part * rate; remaining -= part; prev = limit;
    if (remaining <= 0) break;
  }
  const fedBasicCredit = 16129 * 0.15;
  const afterCredit = Math.max(0, tax - fedBasicCredit);
  return afterCredit * (1 - 0.165); // abattement du Québec
}

function impotProvincial(income) {
  const brackets = [
    { limit: 51780, rate: 0.14 },
    { limit: 103545, rate: 0.19 },
    { limit: 126000, rate: 0.24 },
    { limit: Infinity, rate: 0.2575 },
  ];
  let tax = 0, remaining = income, prev = 0;
  for (const { limit, rate } of brackets) {
    const part = Math.min(remaining, limit - prev);
    tax += part * rate; remaining -= part; prev = limit;
    if (remaining <= 0) break;
  }
  const provBasicCredit = 18571 * 0.14;
  return Math.max(0, tax - provBasicCredit);
}

export default function NetSalaryCalculator({ goBack }) {
  const [montant, setMontant] = useState('30');
  const [periode, setPeriode] = useState('horaire');
  const [heuresSem, setHeuresSem] = useState('40');

  const r = useMemo(() => {
    const v = parseFloat(montant) || 0;
    const h = parseFloat(heuresSem) || 0;
    let brutAnnuel;
    if (periode === 'horaire') brutAnnuel = v * h * 52;
    else brutAnnuel = v * PERIODES[periode].parAn;

    const fed = impotFederal(brutAnnuel);
    const prov = impotProvincial(brutAnnuel);

    // RRQ (salarié 6,4 % entre 3500 $ et 68 500 $)
    const rrqExo = 3500, rrqMax = 68500;
    const rrq = brutAnnuel > rrqExo ? (Math.min(brutAnnuel, rrqMax) - rrqExo) * 0.064 : 0;
    // RQAP (salarié 0,494 % jusqu'à 97 000 $)
    const rqap = Math.min(brutAnnuel, 97000) * 0.00494;

    const deductions = fed + prov + rrq + rqap;
    const netAnnuel = Math.max(0, brutAnnuel - deductions);
    return { brutAnnuel, fed, prov, rrq, rqap, deductions, netAnnuel };
  }, [montant, periode, heuresSem]);

  const fmt = (x) => (x || 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 2 });
  const heuresAn = (parseFloat(heuresSem) || 0) * 52;
  const lignes = [
    { l: 'Par année', n: r.netAnnuel, b: r.brutAnnuel },
    { l: 'Par mois', n: r.netAnnuel / 12, b: r.brutAnnuel / 12 },
    { l: 'Aux 2 semaines', n: r.netAnnuel / 26, b: r.brutAnnuel / 26 },
    { l: 'Par semaine', n: r.netAnnuel / 52, b: r.brutAnnuel / 52 },
    ...(periode === 'horaire' && heuresAn > 0 ? [{ l: 'De l\'heure', n: r.netAnnuel / heuresAn, b: r.brutAnnuel / heuresAn }] : []),
  ];
  const tauxNet = r.brutAnnuel > 0 ? Math.round((r.netAnnuel / r.brutAnnuel) * 100) : 0;

  return (
    <div className="nsc">
      <style>{`
        .nsc{color:#eaf2fb;max-width:760px;margin:0 auto}
        .nsc h1{font-size:1.5rem;margin:0 0 4px}
        .nsc .sub{color:#9fb6cf;font-size:.88rem;margin:0 0 16px}
        .nsc-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font-weight:600;cursor:pointer;font-size:.85rem;margin-bottom:14px}
        .nsc-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:16px}
        .nsc-field{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}
        .nsc-field label{font-size:.82rem;color:#9fb6cf;font-weight:600}
        .nsc input,.nsc select{background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:10px 12px;color:#eaf2fb;font-size:.95rem;width:100%}
        .nsc-segs{display:flex;flex-wrap:wrap;gap:6px}
        .nsc-seg{flex:1;min-width:96px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16);color:#eaf2fb;border-radius:10px;padding:9px;cursor:pointer;font-size:.82rem;font-weight:600}
        .nsc-seg.on{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border-color:transparent}
        .nsc-net{font-size:2rem;font-weight:800;color:#ffae3b}
        .nsc-bar{height:18px;border-radius:9px;background:rgba(255,255,255,.08);overflow:hidden;display:flex;margin:10px 0}
        .nsc-bar i{height:100%;display:block}
        .nsc-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.1);font-size:.88rem}
        .nsc-row span:last-child{font-weight:700}
        .nsc-dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px}
        .nsc-tbl{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:0}
        .nsc-tbl div{padding:8px 6px;border-bottom:1px solid rgba(255,255,255,.1);font-size:.86rem}
        .nsc-tbl .h{color:#9fb6cf;font-weight:700;font-size:.78rem}
        .nsc-tbl .v{text-align:right;font-weight:700;color:#ffae3b}
        .nsc-tbl .vb{text-align:right;color:#9fb6cf}
        .nsc-note{font-size:.78rem;color:#9fb6cf;background:rgba(91,157,255,.1);border:1px solid rgba(91,157,255,.3);border-radius:10px;padding:10px;line-height:1.4}
        @media(max-width:760px){.nsc-net{font-size:1.7rem}}
      `}</style>

      {goBack && <button className="nsc-back" onClick={goBack}>← Retour</button>}
      <h1>💵 Calculateur de salaire net</h1>
      <p className="sub">Québec 2026 — estimation <strong>approximative</strong> de votre paie après impôts et cotisations.</p>

      <div className="nsc-card">
        <div className="nsc-field">
          <label>Période de saisie</label>
          <div className="nsc-segs">
            {Object.entries(PERIODES).map(([k, p]) => (
              <button key={k} className={`nsc-seg ${periode === k ? 'on' : ''}`} onClick={() => setPeriode(k)}>{p.label}</button>
            ))}
          </div>
        </div>
        <div className="nsc-field">
          <label>{periode === 'horaire' ? 'Taux horaire brut ($)' : `Montant brut ${PERIODES[periode].label.toLowerCase()} ($)`}</label>
          <input type="number" min="0" value={montant} onChange={(e) => setMontant(e.target.value)} />
        </div>
        {periode === 'horaire' && (
          <div className="nsc-field">
            <label>Heures par semaine</label>
            <input type="number" min="0" max="80" value={heuresSem} onChange={(e) => setHeuresSem(e.target.value)} />
          </div>
        )}
      </div>

      <div className="nsc-card">
        <div style={{ fontSize: '.85rem', color: '#9fb6cf' }}>Salaire net estimé ({tauxNet}% du brut)</div>
        <div className="nsc-net">{fmt(r.netAnnuel)}<span style={{ fontSize: '.9rem', color: '#9fb6cf', fontWeight: 400 }}> / an</span></div>
        <div className="nsc-bar">
          {r.brutAnnuel > 0 && (<>
            <i style={{ width: `${(r.netAnnuel / r.brutAnnuel) * 100}%`, background: '#ffae3b' }} title="Net" />
            <i style={{ width: `${(r.fed / r.brutAnnuel) * 100}%`, background: '#5b9dff' }} title="Fédéral" />
            <i style={{ width: `${(r.prov / r.brutAnnuel) * 100}%`, background: '#7c5bff' }} title="Provincial" />
            <i style={{ width: `${((r.rrq + r.rqap) / r.brutAnnuel) * 100}%`, background: '#f59e0b' }} title="Cotisations" />
          </>)}
        </div>
        <div className="nsc-row"><span>Salaire brut annuel</span><span>{fmt(r.brutAnnuel)}</span></div>
        <div className="nsc-row"><span><span className="nsc-dot" style={{ background: '#5b9dff' }} />Impôt fédéral</span><span>−{fmt(r.fed)}</span></div>
        <div className="nsc-row"><span><span className="nsc-dot" style={{ background: '#7c5bff' }} />Impôt provincial (QC)</span><span>−{fmt(r.prov)}</span></div>
        <div className="nsc-row"><span><span className="nsc-dot" style={{ background: '#f59e0b' }} />RRQ</span><span>−{fmt(r.rrq)}</span></div>
        <div className="nsc-row"><span><span className="nsc-dot" style={{ background: '#f59e0b' }} />RQAP</span><span>−{fmt(r.rqap)}</span></div>
      </div>

      <div className="nsc-card">
        <div className="nsc-tbl">
          <div className="h">Période</div><div className="h v" style={{ color: '#9fb6cf' }}>Net</div><div className="h vb">Brut</div>
          {lignes.map((x) => (
            <React.Fragment key={x.l}>
              <div>{x.l}</div><div className="v">{fmt(x.n)}</div><div className="vb">{fmt(x.b)}</div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <p className="nsc-note">⚠️ Résultats <strong>approximatifs</strong> à titre indicatif seulement. Les paliers, crédits, cotisations RRQ/RQAP et autres retenues réelles peuvent varier. Ne remplace pas un avis fiscal professionnel.</p>
    </div>
  );
}

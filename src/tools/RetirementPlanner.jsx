import React, { useState, useMemo } from 'react';

/**
 * RetirementPlanner — Planificateur de retraite (REER / CELI / CELIAPP).
 * 100 % local & hors-ligne. Projette le capital à la retraite par intérêts
 * composés (cotisations mensuelles) et estime un revenu annuel via la règle des 4 %.
 * Graphique d'évolution en SVG. Aucune donnée n'est envoyée sur Internet.
 */

export default function RetirementPlanner({ goBack }) {
  const [epargne, setEpargne] = useState('25000');
  const [mensuel, setMensuel] = useState('400');
  const [rendement, setRendement] = useState('6');
  const [age, setAge] = useState('30');
  const [ageRetraite, setAgeRetraite] = useState('65');

  const proj = useMemo(() => {
    const P0 = parseFloat(epargne) || 0;
    const m = parseFloat(mensuel) || 0;
    const annee = (parseFloat(rendement) || 0) / 100;
    const a0 = parseInt(age) || 0;
    const a1 = parseInt(ageRetraite) || 0;
    const annees = Math.max(0, a1 - a0);
    const rMois = annee / 12;

    const points = [];
    let solde = P0;
    let verse = P0;
    points.push({ age: a0, solde, verse });
    for (let an = 1; an <= annees; an++) {
      for (let mo = 0; mo < 12; mo++) {
        solde = solde * (1 + rMois) + m;
        verse += m;
      }
      points.push({ age: a0 + an, solde, verse });
    }
    const capital = solde;
    const totalVerse = verse;
    const interets = Math.max(0, capital - totalVerse);
    const revenuAnnuel = capital * 0.04; // règle des 4 %
    return { points, capital, totalVerse, interets, revenuAnnuel, annees };
  }, [epargne, mensuel, rendement, age, ageRetraite]);

  const fmt = (x) => (x || 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });

  // ---- SVG ----
  const W = 660, H = 220, PAD = 4;
  const pts = proj.points;
  const maxV = Math.max(1, ...pts.map((p) => p.solde));
  const minA = pts[0]?.age ?? 0;
  const maxA = pts[pts.length - 1]?.age ?? minA + 1;
  const sx = (a) => PAD + ((a - minA) / Math.max(1, maxA - minA)) * (W - PAD * 2);
  const sy = (v) => (H - PAD) - (v / maxV) * (H - PAD * 2);
  const line = (key) => pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.age).toFixed(1)},${sy(p[key]).toFixed(1)}`).join(' ');
  const area = `${line('solde')} L${sx(maxA).toFixed(1)},${(H - PAD).toFixed(1)} L${sx(minA).toFixed(1)},${(H - PAD).toFixed(1)} Z`;

  return (
    <div className="rp">
      <style>{`
        .rp{color:#eaf2fb;max-width:760px;margin:0 auto}
        .rp h1{font-size:1.5rem;margin:0 0 4px}
        .rp .sub{color:#9fb6cf;font-size:.88rem;margin:0 0 16px}
        .rp-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font-weight:600;cursor:pointer;font-size:.85rem;margin-bottom:14px}
        .rp-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:16px}
        .rp-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .rp-field{display:flex;flex-direction:column;gap:6px}
        .rp-field label{font-size:.8rem;color:#9fb6cf;font-weight:600}
        .rp input{background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:10px 12px;color:#eaf2fb;font-size:.95rem;width:100%}
        .rp-stats{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
        .rp-stat{background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px}
        .rp-stat .k{font-size:.76rem;color:#9fb6cf}
        .rp-stat .v{font-size:1.25rem;font-weight:800;color:#ffae3b}
        .rp-stat.alt .v{color:#5b9dff;font-size:1.05rem}
        .rp-legend{display:flex;gap:16px;font-size:.78rem;color:#9fb6cf;margin-top:8px;flex-wrap:wrap}
        .rp-dot{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:middle}
        .rp-note{font-size:.78rem;color:#9fb6cf;background:rgba(91,157,255,.1);border:1px solid rgba(91,157,255,.3);border-radius:10px;padding:10px;line-height:1.4}
        @media(max-width:760px){.rp-grid{grid-template-columns:1fr}.rp-stats{grid-template-columns:1fr}}
      `}</style>

      {goBack && <button className="rp-back" onClick={goBack}>← Retour</button>}
      <h1>🏖️ Planificateur de retraite</h1>
      <p className="sub">REER / CELI / CELIAPP — projection par intérêts composés et revenu estimé (règle des 4 %).</p>

      <div className="rp-card">
        <div className="rp-grid">
          <div className="rp-field"><label>Épargne actuelle ($)</label><input type="number" min="0" value={epargne} onChange={(e) => setEpargne(e.target.value)} /></div>
          <div className="rp-field"><label>Cotisation mensuelle ($)</label><input type="number" min="0" value={mensuel} onChange={(e) => setMensuel(e.target.value)} /></div>
          <div className="rp-field"><label>Rendement annuel attendu (%)</label><input type="number" min="0" max="20" step="0.5" value={rendement} onChange={(e) => setRendement(e.target.value)} /></div>
          <div className="rp-field"><label>Âge actuel</label><input type="number" min="0" max="100" value={age} onChange={(e) => setAge(e.target.value)} /></div>
          <div className="rp-field"><label>Âge de la retraite</label><input type="number" min="0" max="100" value={ageRetraite} onChange={(e) => setAgeRetraite(e.target.value)} /></div>
        </div>
      </div>

      <div className="rp-card">
        <div className="rp-stats">
          <div className="rp-stat"><div className="k">Capital à {ageRetraite} ans (dans {proj.annees} ans)</div><div className="v">{fmt(proj.capital)}</div></div>
          <div className="rp-stat"><div className="k">Revenu annuel estimé (4 %)</div><div className="v">{fmt(proj.revenuAnnuel)}</div></div>
          <div className="rp-stat alt"><div className="k">Total cotisé</div><div className="v">{fmt(proj.totalVerse)}</div></div>
          <div className="rp-stat alt"><div className="k">Intérêts gagnés</div><div className="v" style={{ color: '#3ddc97' }}>{fmt(proj.interets)}</div></div>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} role="img" aria-label="Évolution de l'épargne">
          <defs>
            <linearGradient id="rpGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffae3b" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ff7a18" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1={PAD} y1={(H - PAD) - g * (H - PAD * 2)} x2={W - PAD} y2={(H - PAD) - g * (H - PAD * 2)} stroke="rgba(255,255,255,.08)" strokeWidth="1" />
          ))}
          <path d={area} fill="url(#rpGrad)" />
          <path d={line('verse')} fill="none" stroke="#5b9dff" strokeWidth="2" strokeDasharray="5 4" />
          <path d={line('solde')} fill="none" stroke="#ffae3b" strokeWidth="2.5" />
          {pts.length > 0 && <circle cx={sx(maxA)} cy={sy(pts[pts.length - 1].solde)} r="4" fill="#ffae3b" />}
        </svg>
        <div className="rp-legend">
          <span><span className="rp-dot" style={{ background: '#ffae3b' }} />Valeur du portefeuille</span>
          <span><span className="rp-dot" style={{ background: '#5b9dff' }} />Cotisations versées</span>
        </div>
      </div>

      <p className="rp-note">💡 Projection <strong>approximative</strong> à rendement constant, avant inflation et impôts. La règle des 4 % suppose un retrait annuel viable d'environ 4 % du capital. À titre indicatif seulement.</p>
    </div>
  );
}

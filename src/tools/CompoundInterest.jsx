import React, { useState, useMemo } from 'react';

/**
 * CompoundInterest — calculateur d'intérêts composés 100 % local & hors-ligne.
 * Capital initial, cotisation mensuelle, taux annuel, durée (années) et
 * fréquence de capitalisation. Affiche la valeur finale, le total cotisé,
 * l'intérêt gagné et une courbe d'évolution (SVG, aucune librairie). Aucun réseau.
 */

const money = (n) => (isFinite(n) ? n : 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });
const FREQS = { 1: 'Annuelle', 2: 'Semestrielle', 4: 'Trimestrielle', 12: 'Mensuelle' };

export default function CompoundInterest({ goBack }) {
  const [principal, setPrincipal] = useState('10000');
  const [monthly, setMonthly] = useState('300');
  const [rate, setRate] = useState('6');
  const [years, setYears] = useState('20');
  const [m, setM] = useState(12); // capitalisations / an

  const data = useMemo(() => {
    const P = parseFloat(principal) || 0;
    const PMT = parseFloat(monthly) || 0;
    const r = (parseFloat(rate) || 0) / 100;
    const yrs = Math.max(0, Math.floor(parseFloat(years) || 0));
    if (yrs <= 0) return null;

    const iPer = r / m;            // taux par période de capitalisation
    const iMonth = Math.pow(1 + iPer, m / 12) - 1; // taux mensuel équivalent
    const points = [{ year: 0, value: P, contributed: P }];
    let value = P;
    let contributed = P;

    for (let month = 1; month <= yrs * 12; month++) {
      value = value * (1 + iMonth) + PMT;
      contributed += PMT;
      if (month % 12 === 0) points.push({ year: month / 12, value, contributed });
    }

    const finalValue = value;
    const totalContrib = contributed;
    const interest = finalValue - totalContrib;
    return { points, finalValue, totalContrib, interest };
  }, [principal, monthly, rate, years, m]);

  // ---- courbe SVG (valeur + cotisations) ----
  const chart = useMemo(() => {
    if (!data) return null;
    const W = 560, H = 220, padL = 8, padR = 8, padT = 12, padB = 22;
    const pts = data.points;
    const maxV = Math.max(...pts.map((p) => p.value), 1);
    const n = pts.length - 1 || 1;
    const x = (i) => padL + (i / n) * (W - padL - padR);
    const y = (v) => H - padB - (v / maxV) * (H - padT - padB);
    const line = (key) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p[key]).toFixed(1)}`).join(' ');
    const area = `${line('value')} L ${x(n).toFixed(1)} ${(H - padB).toFixed(1)} L ${x(0).toFixed(1)} ${(H - padB).toFixed(1)} Z`;
    const ticks = pts.filter((_, i) => i % Math.ceil(n / 6 || 1) === 0 || i === n);
    return { W, H, padB, valuePath: line('value'), contribPath: line('contributed'), area, x, n, ticks, pts };
  }, [data]);

  return (
    <div className="cmp">
      <style>{`
        .cmp{color:#eaf2fb;max-width:920px;margin:0 auto}
        .cmp h1{font-size:1.6rem;margin:0 0 4px}
        .cmp .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .cmp-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font-weight:600;cursor:pointer;font-size:.85rem;margin-bottom:14px}
        .cmp-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:18px;margin-bottom:18px}
        .cmp-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .cmp-f label{display:block;font-size:.78rem;color:#9fb6cf;margin-bottom:5px}
        .cmp input,.cmp select{width:100%;box-sizing:border-box;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.16);border-radius:9px;color:#eaf2fb;padding:10px;font-size:.95rem}
        .cmp input:focus,.cmp select:focus{outline:none;border-color:#5b9dff}
        .cmp-stats{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:6px}
        .cmp-stats div{flex:1;min-width:150px;border-radius:13px;padding:12px 16px}
        .cmp-stats .v{background:linear-gradient(135deg,rgba(255,122,24,.16),rgba(255,174,59,.12));border:1px solid rgba(255,174,59,.3)}
        .cmp-stats .c{background:rgba(91,157,255,.1);border:1px solid rgba(91,157,255,.25)}
        .cmp-stats .g{background:rgba(55,211,155,.1);border:1px solid rgba(55,211,155,.3)}
        .cmp-stats small{display:block;color:#9fb6cf;font-size:.74rem;margin-bottom:3px}
        .cmp-stats b{font-size:1.35rem}
        .cmp-leg{display:flex;gap:18px;font-size:.8rem;color:#9fb6cf;margin-top:8px}
        .cmp-leg span{display:flex;align-items:center;gap:6px}
        .cmp-dot{width:18px;height:3px;border-radius:2px;display:inline-block}
        @media(max-width:760px){.cmp-grid{grid-template-columns:1fr}.cmp-stats b{font-size:1.15rem}}
      `}</style>

      {goBack && <button className="cmp-back" onClick={goBack}>← Retour</button>}
      <h1>💰 Intérêts composés</h1>
      <p className="sub">Projette la croissance de ton épargne. 100 % local, calcul instantané, aucun réseau.</p>

      <div className="cmp-card">
        <div className="cmp-grid">
          <div className="cmp-f"><label>Capital initial ($)</label><input type="number" min="0" step="100" value={principal} onChange={(e) => setPrincipal(e.target.value)} /></div>
          <div className="cmp-f"><label>Cotisation mensuelle ($)</label><input type="number" min="0" step="50" value={monthly} onChange={(e) => setMonthly(e.target.value)} /></div>
          <div className="cmp-f"><label>Taux annuel (%)</label><input type="number" min="0" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
          <div className="cmp-f"><label>Durée (années)</label><input type="number" min="1" step="1" value={years} onChange={(e) => setYears(e.target.value)} /></div>
          <div className="cmp-f">
            <label>Fréquence de capitalisation</label>
            <select value={m} onChange={(e) => setM(Number(e.target.value))}>
              {Object.entries(FREQS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
      </div>

      {data && chart ? (
        <div className="cmp-card">
          <div className="cmp-stats">
            <div className="v"><small>Valeur finale</small><b style={{ color: '#ffae3b' }}>{money(data.finalValue)}</b></div>
            <div className="c"><small>Total cotisé</small><b>{money(data.totalContrib)}</b></div>
            <div className="g"><small>Intérêt gagné</small><b style={{ color: '#37d39b' }}>{money(data.interest)}</b></div>
          </div>

          <svg viewBox={`0 0 ${chart.W} ${chart.H}`} style={{ width: '100%', display: 'block' }}>
            <defs>
              <linearGradient id="cmpFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff7a18" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ff7a18" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={chart.area} fill="url(#cmpFill)" />
            <path d={chart.contribPath} fill="none" stroke="#5b9dff" strokeWidth="2" strokeDasharray="5 4" />
            <path d={chart.valuePath} fill="none" stroke="#ffae3b" strokeWidth="2.5" />
            {chart.ticks.map((p, i) => (
              <text key={i} x={chart.x(p.year)} y={chart.H - 6} fill="#9fb6cf" fontSize="10" textAnchor="middle">{p.year} an{p.year > 1 ? 's' : ''}</text>
            ))}
          </svg>
          <div className="cmp-leg">
            <span><i className="cmp-dot" style={{ background: '#ffae3b' }} /> Valeur du placement</span>
            <span><i className="cmp-dot" style={{ background: '#5b9dff' }} /> Cotisations versées</span>
          </div>
        </div>
      ) : (
        <div className="cmp-card"><p className="sub" style={{ margin: 0 }}>Saisis une durée valide pour voir la projection.</p></div>
      )}
    </div>
  );
}

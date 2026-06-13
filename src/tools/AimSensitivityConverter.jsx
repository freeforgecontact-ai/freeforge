import React, { useState, useMemo } from 'react';

/**
 * AimSensitivityConverter — convertisseur de sensibilité souris entre jeux FPS.
 * 100 % local. Utilise les facteurs « yaw » (degrés de rotation par compte de souris
 * à sensibilité 1) connus par jeu pour convertir, et calcule le cm/360.
 * cm/360 = (360 / (yaw * sens)) * (2.54 / DPI)
 */

// degrés tournés par "count" souris à sensibilité = 1 (valeurs communautaires usuelles)
const GAMES = {
  'Valorant': 0.07,
  'CS2 / CS:GO': 0.022,
  'Apex Legends': 0.022,
  'Overwatch 2': 0.0066,
  'Fortnite': 0.5556,        // 1.0 manette-indep.; valeur d'échelle usuelle (sens 5 ≈ Apex/CS)
  'Rainbow Six Siege': 0.00573,
  'Call of Duty (MW)': 0.0066,
  'Quake / Source 103': 0.022,
};

const fmt = (n, d = 3) => (isFinite(n) ? Number(n.toFixed(d)) : '—');

export default function AimSensitivityConverter({ goBack }) {
  const [from, setFrom] = useState('Valorant');
  const [to, setTo] = useState('CS2 / CS:GO');
  const [sens, setSens] = useState('0.4');
  const [dpi, setDpi] = useState('800');

  const r = useMemo(() => {
    const s = parseFloat(sens), d = parseFloat(dpi);
    const yf = GAMES[from], yt = GAMES[to];
    if (!(s > 0) || !(d > 0) || !yf || !yt) return null;
    // sens cible telle que yt*newSens == yf*s  => même rotation/compte
    const newSens = (yf * s) / yt;
    const counts360From = 360 / (yf * s);                 // counts souris pour 360°
    const cm360 = counts360From * (2.54 / d);             // distance physique 360°
    const inch360 = cm360 / 2.54;
    return { newSens, cm360, inch360, edpiFrom: s * d, edpiTo: newSens * d };
  }, [from, to, sens, dpi]);

  const swap = () => { setFrom(to); setTo(from); };

  return (
    <div className="ac">
      <style>{`
        .ac{color:#eaf2fb;max-width:760px;margin:0 auto}
        .ac h1{font-size:1.5rem;margin:0 0 4px}
        .ac .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .ac-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:18px;margin-bottom:16px}
        .ac-grid{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:end}
        .ac-row label{display:block;font-size:.82rem;color:#bcd0e8;margin-bottom:6px}
        .ac select,.ac input{width:100%;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.25);color:#eaf2fb;padding:10px;font-size:.95rem;box-sizing:border-box}
        .ac-swap{background:rgba(91,157,255,.22);border:1px solid rgba(91,157,255,.5);color:#eaf2fb;border-radius:10px;padding:10px 12px;cursor:pointer;font-size:1.1rem;height:42px}
        .ac-swap:hover{background:rgba(91,157,255,.4)}
        .ac-two{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
        .ac-out{background:linear-gradient(135deg,rgba(255,122,24,.16),rgba(255,174,59,.1));border:1px solid rgba(255,174,59,.4);border-radius:16px;padding:18px;text-align:center}
        .ac-out .big{font-size:2.2rem;font-weight:800;color:#ffae3b;line-height:1.1}
        .ac-out .lbl{font-size:.8rem;color:#bcd0e8;margin-top:4px}
        .ac-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px}
        .ac-stat{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px;text-align:center}
        .ac-stat .n{font-size:1.25rem;font-weight:700;color:#eaf2fb}
        .ac-stat .l{font-size:.74rem;color:#9fb6cf;margin-top:2px}
        .ac-btn{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;font-size:.9rem}
        .ac-warn{color:#ffb3b3;font-size:.85rem}
        @media(max-width:760px){.ac-grid{grid-template-columns:1fr}.ac-swap{width:100%}.ac-two{grid-template-columns:1fr}.ac-stats{grid-template-columns:1fr}}
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        {goBack && <button className="ac-btn" onClick={goBack}>← Retour</button>}
        <h1>🖱️ Convertisseur de sensibilité</h1>
      </div>
      <p className="sub">Garde la même sensation de visée d'un jeu à l'autre. Calcul local des facteurs de rotation et du cm/360.</p>

      <div className="ac-pane">
        <div className="ac-grid">
          <div className="ac-row">
            <label>Jeu source</label>
            <select value={from} onChange={(e) => setFrom(e.target.value)}>
              {Object.keys(GAMES).map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <button className="ac-swap" title="Inverser" onClick={swap}>⇄</button>
          <div className="ac-row">
            <label>Jeu cible</label>
            <select value={to} onChange={(e) => setTo(e.target.value)}>
              {Object.keys(GAMES).map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        <div className="ac-two">
          <div className="ac-row">
            <label>Sensibilité (jeu source)</label>
            <input type="number" min="0" step="0.01" value={sens} onChange={(e) => setSens(e.target.value)} placeholder="ex. 0.4" />
          </div>
          <div className="ac-row">
            <label>DPI de la souris</label>
            <input type="number" min="0" step="50" value={dpi} onChange={(e) => setDpi(e.target.value)} placeholder="ex. 800" />
          </div>
        </div>
      </div>

      {r ? (
        <>
          <div className="ac-out">
            <div className="big">{fmt(r.newSens, 4)}</div>
            <div className="lbl">Sensibilité équivalente dans « {to} »</div>
          </div>
          <div className="ac-stats">
            <div className="ac-stat"><div className="n">{fmt(r.cm360, 2)} cm</div><div className="l">cm / 360°</div></div>
            <div className="ac-stat"><div className="n">{fmt(r.inch360, 2)} in</div><div className="l">pouces / 360°</div></div>
            <div className="ac-stat"><div className="n">{fmt(r.edpiTo, 0)}</div><div className="l">eDPI cible</div></div>
          </div>
        </>
      ) : (
        <div className="ac-pane"><span className="ac-warn">Entre une sensibilité et un DPI valides (&gt; 0) pour voir le résultat.</span></div>
      )}
    </div>
  );
}

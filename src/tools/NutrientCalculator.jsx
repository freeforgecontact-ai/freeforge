import React, { useState } from 'react';

/**
 * NutrientCalculator — calculateur de macros CIBLE (et non un journal alimentaire), 100 % local.
 * À partir d'un objectif calorique journalier et d'une répartition % (protéines / glucides / lipides),
 * calcule les GRAMMES cibles par macro, puis répartit ces grammes par repas.
 * Presets : équilibré, low-carb, cétogène. Anneau SVG de répartition. Aucun réseau.
 */

// kcal par gramme : protéines 4, glucides 4, lipides 9
const KCAL = { p: 4, c: 4, f: 9 };
const PRESETS = {
  'Équilibré': { p: 30, c: 40, f: 30 },
  'Low-carb': { p: 35, c: 20, f: 45 },
  'Cétogène': { p: 25, c: 5, f: 70 },
  'Prise de masse': { p: 30, c: 50, f: 20 },
};
const COLORS = { p: '#5b9dff', c: '#ffae3b', f: '#ff7a18' };
const LABELS = { p: 'Protéines', c: 'Glucides', f: 'Lipides' };

export default function NutrientCalculator({ goBack }) {
  const [kcal, setKcal] = useState(2000);
  const [meals, setMeals] = useState(3);
  const [split, setSplit] = useState(PRESETS['Équilibré']);
  const [preset, setPreset] = useState('Équilibré');

  const total = split.p + split.c + split.f;
  const setPct = (key, v) => {
    setSplit((s) => ({ ...s, [key]: Math.max(0, Math.min(100, Number(v) || 0)) }));
    setPreset('Personnalisé');
  };
  const applyPreset = (name) => { setSplit(PRESETS[name]); setPreset(name); };

  const safeK = Math.max(0, Number(kcal) || 0);
  const safeM = Math.max(1, Math.min(8, Number(meals) || 1));

  // grammes = (kcal * %macro) / kcal-par-gramme
  const grams = {
    p: total ? Math.round((safeK * (split.p / total)) / KCAL.p) : 0,
    c: total ? Math.round((safeK * (split.c / total)) / KCAL.c) : 0,
    f: total ? Math.round((safeK * (split.f / total)) / KCAL.f) : 0,
  };
  const perMeal = {
    p: Math.round(grams.p / safeM),
    c: Math.round(grams.c / safeM),
    f: Math.round(grams.f / safeM),
  };

  // ---- anneau SVG ----
  const R = 70, C = 2 * Math.PI * R;
  let offset = 0;
  const segs = ['p', 'c', 'f'].map((k) => {
    const frac = total ? split[k] / total : 0;
    const seg = { k, dash: frac * C, off: offset, frac };
    offset += frac * C;
    return seg;
  });

  return (
    <div className="ntr">
      <style>{`
        .ntr{color:#eaf2fb;max-width:880px;margin:0 auto}
        .ntr h1{font-size:1.6rem;margin:0 0 4px}
        .ntr .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px;line-height:1.45}
        .ntr .back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:7px 13px;font-weight:600;cursor:pointer;font-size:.85rem;margin-bottom:16px}
        .ntr-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:18px;margin-bottom:18px}
        .ntr h2{font-size:1.05rem;margin:0 0 14px}
        .ntr-row{display:flex;gap:18px;flex-wrap:wrap;align-items:flex-end}
        .ntr .fld{display:flex;flex-direction:column;gap:6px}
        .ntr label{font-size:.82rem;color:#cfe0f3;font-weight:600}
        .ntr input[type=number]{background:rgba(10,22,40,.7);color:#eaf2fb;border:1px solid rgba(255,255,255,.2);border-radius:10px;padding:10px 12px;font-size:1rem;width:120px;font-family:inherit}
        .ntr-presets{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 4px}
        .ntr-presets button{background:rgba(255,255,255,.07);color:#cfe0f3;border:1px solid rgba(255,255,255,.16);border-radius:20px;padding:7px 14px;font-size:.83rem;cursor:pointer;font-weight:600}
        .ntr-presets button.on{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none}
        .ntr-sliders{display:flex;flex-direction:column;gap:12px;margin-top:14px}
        .ntr-slide{display:flex;align-items:center;gap:12px}
        .ntr-slide .nm{width:90px;font-size:.86rem;font-weight:600}
        .ntr-slide input[type=range]{flex:1}
        .ntr-slide .v{width:48px;text-align:right;font-weight:700;font-size:.9rem}
        .ntr input[type=range]{accent-color:#ff8a3b}
        .ntr-warn{color:#ffce8a;font-size:.82rem;margin-top:8px}
        .ntr-result{display:flex;gap:22px;flex-wrap:wrap;align-items:center;justify-content:center}
        .ntr-ring{flex:0 0 auto}
        .ntr-legend{display:flex;flex-direction:column;gap:12px;min-width:230px}
        .ntr-leg{display:flex;align-items:center;gap:12px;background:rgba(10,22,40,.5);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:11px 14px}
        .ntr-leg .dot{width:14px;height:14px;border-radius:4px;flex:0 0 auto}
        .ntr-leg .info{flex:1}
        .ntr-leg .info .t{font-weight:700;font-size:.92rem}
        .ntr-leg .info .s{font-size:.76rem;color:#9fb6cf}
        .ntr-leg .g{font-size:1.25rem;font-weight:800;color:#ffd27a}
        .ntr-leg .g small{font-size:.7rem;color:#9fb6cf;font-weight:600}
        .ntr-ring text.center-k{font-size:24px;font-weight:800;fill:#ffd27a}
        .ntr-ring text.center-l{font-size:11px;fill:#9fb6cf}
        @media(max-width:760px){.ntr input[type=number]{width:100%}.ntr .fld{flex:1;min-width:140px}}
      `}</style>

      {goBack && <button className="back" onClick={goBack}>← Retour</button>}
      <h1>🎯 Macros cibles</h1>
      <p className="sub">Définis ton objectif calorique et ta répartition en macronutriments : l'outil calcule les grammes cibles par jour et par repas. (Calculateur d'objectifs — ce n'est pas un journal alimentaire.)</p>

      <div className="ntr-card">
        <h2>1. Objectif</h2>
        <div className="ntr-row">
          <div className="fld">
            <label>Calories par jour (kcal)</label>
            <input type="number" min="0" step="50" value={kcal} onChange={(e) => setKcal(e.target.value)} />
          </div>
          <div className="fld">
            <label>Nombre de repas / jour</label>
            <input type="number" min="1" max="8" value={meals} onChange={(e) => setMeals(e.target.value)} />
          </div>
        </div>

        <div className="ntr-presets">
          {Object.keys(PRESETS).map((n) => (
            <button key={n} className={preset === n ? 'on' : ''} onClick={() => applyPreset(n)}>{n}</button>
          ))}
          {preset === 'Personnalisé' && <button className="on">Personnalisé</button>}
        </div>

        <div className="ntr-sliders">
          {['p', 'c', 'f'].map((k) => (
            <div key={k} className="ntr-slide">
              <span className="nm" style={{ color: COLORS[k] }}>{LABELS[k]}</span>
              <input type="range" min="0" max="100" value={split[k]} onChange={(e) => setPct(k, e.target.value)} />
              <span className="v">{split[k]}%</span>
            </div>
          ))}
        </div>
        {total !== 100 && <div className="ntr-warn">⚠️ Total = {total}% (ajuste pour atteindre 100 % ; les calculs utilisent la proportion relative).</div>}
      </div>

      <div className="ntr-card">
        <h2>2. Résultats</h2>
        <div className="ntr-result">
          <svg className="ntr-ring" width="180" height="180" viewBox="0 0 180 180" role="img" aria-label="Répartition des macros">
            <circle cx="90" cy="90" r={R} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="22" />
            {segs.map((s) => (
              <circle key={s.k} cx="90" cy="90" r={R} fill="none" stroke={COLORS[s.k]} strokeWidth="22"
                      strokeDasharray={`${s.dash} ${C - s.dash}`} strokeDashoffset={-s.off}
                      transform="rotate(-90 90 90)" strokeLinecap="butt" />
            ))}
            <text className="center-k" x="90" y="88" textAnchor="middle">{safeK}</text>
            <text className="center-l" x="90" y="106" textAnchor="middle">kcal / jour</text>
          </svg>

          <div className="ntr-legend">
            {['p', 'c', 'f'].map((k) => (
              <div key={k} className="ntr-leg">
                <span className="dot" style={{ background: COLORS[k] }} />
                <div className="info">
                  <div className="t">{LABELS[k]}</div>
                  <div className="s">{total ? Math.round((split[k] / total) * 100) : 0}% · {perMeal[k]} g / repas</div>
                </div>
                <div className="g">{grams[k]}<small> g</small></div>
              </div>
            ))}
          </div>
        </div>
        <p className="sub" style={{ margin: '16px 0 0', textAlign: 'center' }}>
          Sur {safeM} repas : {perMeal.p} g protéines · {perMeal.c} g glucides · {perMeal.f} g lipides par repas.
        </p>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';

/**
 * ImcMetabolism — calculateur IMC + métabolisme, 100 % local & hors-ligne.
 * Entre ta taille, ton poids, ton âge, ton sexe et ton niveau d'activité :
 * l'outil calcule l'IMC (avec catégorie OMS), le métabolisme de base (BMR,
 * formule de Mifflin-St Jeor) et tes besoins caloriques journaliers (TDEE)
 * selon l'activité. Aucune donnée n'est envoyée.
 */

const ACTIVITY = [
  { k: 'sedentary', label: 'Sédentaire (peu/pas d\'exercice)', f: 1.2 },
  { k: 'light', label: 'Léger (1-3 j/sem)', f: 1.375 },
  { k: 'moderate', label: 'Modéré (3-5 j/sem)', f: 1.55 },
  { k: 'active', label: 'Actif (6-7 j/sem)', f: 1.725 },
  { k: 'veryactive', label: 'Très actif (travail physique / sport intense)', f: 1.9 },
];

const imcCategory = (imc) => {
  if (imc < 16.5) return { label: 'Dénutrition', color: '#ff5a5a' };
  if (imc < 18.5) return { label: 'Maigreur', color: '#ffb03b' };
  if (imc < 25) return { label: 'Corpulence normale', color: '#8ad6a0' };
  if (imc < 30) return { label: 'Surpoids', color: '#ffb03b' };
  if (imc < 35) return { label: 'Obésité modérée', color: '#ff8a3b' };
  if (imc < 40) return { label: 'Obésité sévère', color: '#ff5a5a' };
  return { label: 'Obésité morbide', color: '#ff5a5a' };
};

export default function ImcMetabolism({ goBack }) {
  const [height, setHeight] = useState('175'); // cm
  const [weight, setWeight] = useState('70');  // kg
  const [age, setAge] = useState('30');
  const [sex, setSex] = useState('h'); // 'h' | 'f'
  const [activity, setActivity] = useState('moderate');

  const r = useMemo(() => {
    const h = parseFloat(String(height).replace(',', '.'));
    const w = parseFloat(String(weight).replace(',', '.'));
    const a = parseInt(age, 10);
    if (!isFinite(h) || !isFinite(w) || !isFinite(a) || h <= 0 || w <= 0 || a <= 0) return null;
    const m = h / 100;
    const imc = w / (m * m);
    // Mifflin-St Jeor
    const bmr = 10 * w + 6.25 * h - 5 * a + (sex === 'h' ? 5 : -161);
    const act = ACTIVITY.find((x) => x.k === activity) || ACTIVITY[2];
    const tdee = bmr * act.f;
    return { imc, bmr: Math.round(bmr), tdee: Math.round(tdee), cat: imcCategory(imc) };
  }, [height, weight, age, sex, activity]);

  return (
    <div className="imc">
      <style>{`
        .imc{color:#eaf2fb;max-width:760px;margin:0 auto}
        .imc h1{font-size:1.6rem;margin:0 0 4px}
        .imc .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .imc-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font-weight:600;cursor:pointer;margin-bottom:14px;font-size:.85rem}
        .imc-back:hover{background:rgba(255,255,255,.14)}
        .imc-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:18px;margin-bottom:16px}
        .imc-pane h2{font-size:1.05rem;margin:0 0 14px;color:#cfe0f5}
        .imc-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .imc-fld{display:flex;flex-direction:column;gap:5px}
        .imc-fld label{font-size:.8rem;color:#9fb6cf}
        .imc input,.imc select{background:rgba(10,22,40,.6);border:1px solid rgba(255,255,255,.18);border-radius:9px;padding:10px 11px;color:#eaf2fb;font-size:.95rem}
        .imc input:focus,.imc select:focus{outline:none;border-color:#5b9dff}
        .imc-seg{display:flex;gap:8px}
        .imc-seg button{flex:1;background:rgba(10,22,40,.6);border:1px solid rgba(255,255,255,.18);border-radius:9px;padding:10px;color:#9fb6cf;font-weight:600;cursor:pointer;font-size:.92rem}
        .imc-seg button.on{background:linear-gradient(135deg,#3a7bd5,#5b9dff);border-color:transparent;color:#fff}
        .imc-res{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
        .imc-card{background:rgba(10,22,40,.5);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:16px;text-align:center}
        .imc-card .k{font-size:.78rem;color:#9fb6cf;margin-bottom:6px}
        .imc-card .v{font-size:1.8rem;font-weight:800}
        .imc-card .u{font-size:.82rem;color:#9fb6cf;font-weight:500}
        .imc-card.imc-v .v{color:#5b9dff}
        .imc-card.bmr-v .v{color:#ffae3b}
        .imc-card.tdee-v .v{color:#ff7a18}
        .imc-cat{margin-top:14px;text-align:center;font-size:1rem;font-weight:700;padding:10px;border-radius:11px;background:rgba(10,22,40,.4)}
        .imc-scale{height:12px;border-radius:8px;margin:14px 0 6px;background:linear-gradient(90deg,#ff5a5a,#ffb03b,#8ad6a0 38%,#8ad6a0 50%,#ffb03b 62%,#ff8a3b 80%,#ff5a5a);position:relative}
        .imc-cursor{position:absolute;top:-5px;width:4px;height:22px;background:#fff;border-radius:3px;box-shadow:0 0 6px rgba(0,0,0,.6);transform:translateX(-50%)}
        .imc-scale-lbl{display:flex;justify-content:space-between;font-size:.7rem;color:#7f97b4}
        .imc-note{font-size:.78rem;color:#7f97b4;margin-top:12px;text-align:center}
        .imc-empty{color:#9fb6cf;text-align:center;padding:20px 10px;font-size:.92rem}
        @media(max-width:760px){.imc-grid{grid-template-columns:1fr}.imc-res{grid-template-columns:1fr}}
      `}</style>

      {goBack && <button className="imc-back" onClick={goBack}>← Retour</button>}
      <h1>⚖️ IMC & Métabolisme</h1>
      <p className="sub">Calcule ton IMC, ton métabolisme de base (Mifflin-St Jeor) et tes besoins caloriques journaliers. 100 % hors-ligne.</p>

      <div className="imc-pane">
        <h2>Tes données</h2>
        <div className="imc-grid">
          <div className="imc-fld">
            <label>Taille (cm)</label>
            <input type="number" min="50" max="260" value={height} onChange={(e) => setHeight(e.target.value)} />
          </div>
          <div className="imc-fld">
            <label>Poids (kg)</label>
            <input type="number" min="20" max="400" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <div className="imc-fld">
            <label>Âge (ans)</label>
            <input type="number" min="1" max="120" value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div className="imc-fld">
            <label>Sexe</label>
            <div className="imc-seg">
              <button className={sex === 'h' ? 'on' : ''} onClick={() => setSex('h')}>♂ Homme</button>
              <button className={sex === 'f' ? 'on' : ''} onClick={() => setSex('f')}>♀ Femme</button>
            </div>
          </div>
          <div className="imc-fld" style={{ gridColumn: '1 / -1' }}>
            <label>Niveau d'activité</label>
            <select value={activity} onChange={(e) => setActivity(e.target.value)}>
              {ACTIVITY.map((a) => <option key={a.k} value={a.k}>{a.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="imc-pane">
        <h2>Résultats</h2>
        {!r ? (
          <div className="imc-empty">Renseigne taille, poids et âge pour voir tes résultats.</div>
        ) : (
          <>
            <div className="imc-res">
              <div className="imc-card imc-v">
                <div className="k">IMC</div>
                <div className="v">{r.imc.toFixed(1)}</div>
                <div className="u">kg/m²</div>
              </div>
              <div className="imc-card bmr-v">
                <div className="k">Métabolisme de base</div>
                <div className="v">{r.bmr}</div>
                <div className="u">kcal/jour</div>
              </div>
              <div className="imc-card tdee-v">
                <div className="k">Besoins journaliers</div>
                <div className="v">{r.tdee}</div>
                <div className="u">kcal/jour (TDEE)</div>
              </div>
            </div>

            <div className="imc-scale">
              <div className="imc-cursor" style={{ left: `${Math.max(0, Math.min(100, ((r.imc - 14) / (42 - 14)) * 100))}%` }} />
            </div>
            <div className="imc-scale-lbl"><span>14</span><span>18,5</span><span>25</span><span>30</span><span>40</span></div>

            <div className="imc-cat" style={{ color: r.cat.color, border: `1px solid ${r.cat.color}55` }}>
              {r.cat.label}
            </div>
            <p className="imc-note">BMR = métabolisme au repos · TDEE = BMR × facteur d'activité. Estimations à titre indicatif, ne remplacent pas un avis médical.</p>
          </>
        )}
      </div>
    </div>
  );
}

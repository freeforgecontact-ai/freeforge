import React, { useState, useMemo } from 'react';

/**
 * HydroSimulator — simulateur de facture Hydro-Québec (Tarif D résidentiel).
 * Estime la facture à partir de la consommation (kWh) saisie OU estimée via
 * quelques appareils. Applique la structure du Tarif D : redevance d'abonnement
 * quotidienne, 1er palier (~40 kWh/jour) à un taux, surplus à un taux plus élevé.
 * Taux 2026 APPROXIMATIFS — à titre indicatif. 100 % local, aucun réseau.
 */

// Taux 2026 approximatifs (Tarif D résidentiel) — indicatifs seulement.
const REDEVANCE_JOUR = 0.4773;   // $/jour (abonnement)
const TAUX_PALIER1 = 0.06905;    // $/kWh — 1er palier
const TAUX_PALIER2 = 0.10652;    // $/kWh — au-delà du seuil
const SEUIL_JOUR = 40;           // kWh/jour avant bascule au 2e palier

// Appareils types : puissance (W) + heures/jour par défaut
const APPAREILS = [
  { id: 'chauffage', nom: '🔥 Chauffage (plinthe)', w: 1500, h: 6 },
  { id: 'eau', nom: '🚿 Chauffe-eau', w: 4500, h: 3 },
  { id: 'secheuse', nom: '🌀 Sécheuse', w: 3000, h: 1 },
  { id: 'frigo', nom: '🧊 Réfrigérateur', w: 150, h: 24 },
  { id: 'eclairage', nom: '💡 Éclairage', w: 200, h: 5 },
  { id: 'four', nom: '🍳 Four / cuisinière', w: 2400, h: 1 },
];

const cad = (n) => n.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });

export default function HydroSimulator({ goBack }) {
  const [mode, setMode] = useState('direct'); // 'direct' | 'appareils'
  const [jours, setJours] = useState('60');
  const [kwhDirect, setKwhDirect] = useState('1800');
  const [app, setApp] = useState(() => Object.fromEntries(APPAREILS.map((a) => [a.id, { on: a.id === 'frigo', h: a.h }])));

  const setAppH = (id, h) => setApp((s) => ({ ...s, [id]: { ...s[id], h } }));
  const toggleApp = (id) => setApp((s) => ({ ...s, [id]: { ...s[id], on: !s[id].on } }));

  const kwhAppareilsJour = useMemo(
    () => APPAREILS.reduce((sum, a) => sum + (app[a.id].on ? a.w * (parseFloat(app[a.id].h) || 0) / 1000 : 0), 0),
    [app]
  );

  const nbJours = Math.max(1, parseFloat(jours) || 1);
  const kwhTotal = mode === 'direct' ? (parseFloat(kwhDirect) || 0) : kwhAppareilsJour * nbJours;
  const kwhJour = kwhTotal / nbJours;

  const r = useMemo(() => {
    const palier1Jour = Math.min(kwhJour, SEUIL_JOUR);
    const palier2Jour = Math.max(0, kwhJour - SEUIL_JOUR);
    const coutRedevance = REDEVANCE_JOUR * nbJours;
    const coutP1 = palier1Jour * nbJours * TAUX_PALIER1;
    const coutP2 = palier2Jour * nbJours * TAUX_PALIER2;
    const sousTotal = coutRedevance + coutP1 + coutP2;
    const tps = sousTotal * 0.05;
    const tvq = sousTotal * 0.09975;
    return { palier1Jour, palier2Jour, coutRedevance, coutP1, coutP2, sousTotal, tps, tvq, total: sousTotal + tps + tvq };
  }, [kwhJour, nbJours]);

  return (
    <div className="hq">
      <style>{`
        .hq{color:#eaf2fb;max-width:920px;margin:0 auto}
        .hq h1{font-size:1.6rem;margin:0 0 4px}
        .hq .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 14px}
        .hq-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font-weight:700;cursor:pointer;font-size:.85rem;margin-bottom:14px}
        .hq-warn{background:rgba(255,174,59,.12);border:1px solid rgba(255,174,59,.35);border-radius:10px;padding:10px 12px;font-size:.82rem;color:#ffd9a3;margin-bottom:16px}
        .hq-tabs{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
        .hq-tab{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.16);border-radius:10px;padding:9px 14px;font-weight:700;cursor:pointer;font-size:.88rem}
        .hq-tab.on{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none}
        .hq-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .hq-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px}
        .hq input,.hq select{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16);border-radius:9px;color:#eaf2fb;padding:9px 10px;font-size:.92rem}
        .hq-fld{display:flex;flex-direction:column;gap:5px;margin-bottom:12px}
        .hq-fld label{font-size:.8rem;color:#9fb6cf}
        .hq-app{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.07)}
        .hq-app input[type=checkbox]{width:18px;height:18px;accent-color:#ff8a3b}
        .hq-app .nm{flex:1;font-size:.9rem}
        .hq-app input[type=number]{width:62px;padding:6px 8px}
        .hq-app small{color:#9fb6cf;font-size:.72rem}
        .hq-line{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:.9rem}
        .hq-line span:first-child{color:#cdd9e8}
        .hq-line b{font-weight:700}
        .hq-total{display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding:14px;background:linear-gradient(135deg,rgba(255,122,24,.14),rgba(255,174,59,.14));border:1px solid rgba(255,174,59,.3);border-radius:12px}
        .hq-total b{font-size:1.5rem;color:#ffae3b}
        .hq-kpi{font-size:.82rem;color:#9fb6cf;margin-bottom:10px}
        @media(max-width:760px){.hq-grid{grid-template-columns:1fr}}
      `}</style>

      {goBack && <button className="hq-back" onClick={goBack}>← Retour</button>}
      <h1>⚡ Simulateur de facture Hydro-Québec</h1>
      <p className="sub">Estimation au Tarif D résidentiel. 100 % hors-ligne.</p>
      <div className="hq-warn">⚠️ Taux 2026 <b>approximatifs</b>, à titre indicatif seulement. Consulte ta facture réelle pour les montants exacts.</div>

      <div className="hq-tabs">
        <button className={`hq-tab ${mode === 'direct' ? 'on' : ''}`} onClick={() => setMode('direct')}>🔢 Saisir les kWh</button>
        <button className={`hq-tab ${mode === 'appareils' ? 'on' : ''}`} onClick={() => setMode('appareils')}>🏠 Estimer par appareils</button>
      </div>

      <div className="hq-grid">
        <div className="hq-pane">
          <div className="hq-fld">
            <label>Durée de la période (jours)</label>
            <input type="number" min="1" value={jours} onChange={(e) => setJours(e.target.value)} />
          </div>

          {mode === 'direct' ? (
            <div className="hq-fld">
              <label>Consommation totale (kWh) sur la période</label>
              <input type="number" min="0" value={kwhDirect} onChange={(e) => setKwhDirect(e.target.value)} />
            </div>
          ) : (
            <>
              <div className="hq-kpi">Coche tes appareils et ajuste les heures d'utilisation par jour.</div>
              {APPAREILS.map((a) => (
                <div key={a.id} className="hq-app">
                  <input type="checkbox" checked={app[a.id].on} onChange={() => toggleApp(a.id)} />
                  <span className="nm">{a.nom}<br /><small>{a.w} W</small></span>
                  <input type="number" min="0" max="24" step="0.5" value={app[a.id].h}
                         onChange={(e) => setAppH(a.id, e.target.value)} disabled={!app[a.id].on} />
                  <small>h/jr</small>
                </div>
              ))}
              <div className="hq-kpi" style={{ marginTop: 10 }}>≈ {kwhAppareilsJour.toFixed(1)} kWh/jour estimés</div>
            </>
          )}
        </div>

        <div className="hq-pane">
          <div className="hq-kpi">
            {kwhTotal.toFixed(0)} kWh sur {nbJours} jours · moyenne {kwhJour.toFixed(1)} kWh/jour
          </div>
          <div className="hq-line"><span>Redevance d'abonnement ({nbJours} j × {cad(REDEVANCE_JOUR)})</span><b>{cad(r.coutRedevance)}</b></div>
          <div className="hq-line"><span>1er palier — {r.palier1Jour.toFixed(1)} kWh/j × {(TAUX_PALIER1 * 100).toFixed(3)}¢</span><b>{cad(r.coutP1)}</b></div>
          <div className="hq-line"><span>2e palier (&gt;{SEUIL_JOUR} kWh/j) — {r.palier2Jour.toFixed(1)} kWh/j × {(TAUX_PALIER2 * 100).toFixed(3)}¢</span><b>{cad(r.coutP2)}</b></div>
          <div className="hq-line"><span>Sous-total (avant taxes)</span><b>{cad(r.sousTotal)}</b></div>
          <div className="hq-line"><span>TPS (5 %)</span><b>{cad(r.tps)}</b></div>
          <div className="hq-line"><span>TVQ (9,975 %)</span><b>{cad(r.tvq)}</b></div>
          <div className="hq-total">
            <span style={{ fontWeight: 700 }}>Total estimé</span>
            <b>{cad(r.total)}</b>
          </div>
        </div>
      </div>
    </div>
  );
}

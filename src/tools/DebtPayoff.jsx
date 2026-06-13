import React, { useState, useMemo } from 'react';

/**
 * DebtPayoff — Planificateur de remboursement de dettes.
 * 100 % local & hors-ligne. Méthodes Avalanche (taux décroissant) et
 * Boule de neige (solde croissant). Calcule l'ordre, le temps total et
 * l'intérêt total, avec comparaison des deux méthodes.
 * Simulation mensuelle. Aucune donnée n'est envoyée sur Internet.
 */

let _uid = 0;
const nid = () => `d${++_uid}`;

function simuler(dettes, methode, budgetExtra) {
  // copie de travail
  let list = dettes
    .map((d) => ({ ...d, solde: Math.max(0, +d.solde || 0), taux: Math.max(0, +d.taux || 0), min: Math.max(0, +d.min || 0) }))
    .filter((d) => d.solde > 0);
  if (!list.length) return { mois: 0, interet: 0, ordre: [], impossible: false };

  // ordre de priorité (cible du surplus)
  const trier = (arr) => [...arr].sort((a, b) =>
    methode === 'avalanche' ? b.taux - a.taux : a.solde - b.solde);
  const ordre = trier(list).map((d) => d.nom);

  let mois = 0, interetTotal = 0;
  const MAX = 1200; // garde-fou (100 ans)
  while (list.some((d) => d.solde > 0) && mois < MAX) {
    mois++;
    // 1) intérêts du mois
    for (const d of list) {
      if (d.solde > 0) {
        const i = d.solde * (d.taux / 100 / 12);
        d.solde += i; interetTotal += i;
      }
    }
    // 2) budget = somme des minimums + surplus
    let budget = list.reduce((s, d) => s + (d.solde > 0 ? d.min : 0), 0) + (+budgetExtra || 0);
    // si budget ne couvre même pas les intérêts -> impossible
    // paie d'abord les minimums
    for (const d of list) {
      if (d.solde <= 0) continue;
      const pay = Math.min(d.min, d.solde, budget);
      d.solde -= pay; budget -= pay;
    }
    // 3) surplus dirigé selon la méthode
    for (const nom of trier(list).map((d) => d.nom)) {
      if (budget <= 0) break;
      const d = list.find((x) => x.nom === nom);
      if (!d || d.solde <= 0) continue;
      const pay = Math.min(d.solde, budget);
      d.solde -= pay; budget -= pay;
    }
    // nettoyage des arrondis
    list.forEach((d) => { if (d.solde < 0.01) d.solde = 0; });
  }
  return { mois, interet: interetTotal, ordre, impossible: mois >= MAX };
}

export default function DebtPayoff({ goBack }) {
  const [dettes, setDettes] = useState([
    { id: nid(), nom: 'Carte de crédit', solde: '4000', taux: '19.9', min: '120' },
    { id: nid(), nom: 'Prêt auto', solde: '12000', taux: '7.5', min: '300' },
    { id: nid(), nom: 'Marge de crédit', solde: '2500', taux: '11', min: '75' },
  ]);
  const [extra, setExtra] = useState('200');
  const [methode, setMethode] = useState('avalanche');

  const upd = (id, k, v) => setDettes((p) => p.map((d) => (d.id === id ? { ...d, [k]: v } : d)));
  const add = () => setDettes((p) => [...p, { id: nid(), nom: `Dette ${p.length + 1}`, solde: '1000', taux: '10', min: '50' }]);
  const del = (id) => setDettes((p) => p.filter((d) => d.id !== id));

  const aval = useMemo(() => simuler(dettes, 'avalanche', extra), [dettes, extra]);
  const snow = useMemo(() => simuler(dettes, 'snowball', extra), [dettes, extra]);
  const actif = methode === 'avalanche' ? aval : snow;

  const fmt = (x) => (x || 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });
  const dureeTxt = (m) => (m <= 0 ? '—' : `${Math.floor(m / 12)} an(s) ${m % 12} mois`);
  const totalSolde = dettes.reduce((s, d) => s + (+d.solde || 0), 0);
  const economie = Math.abs(aval.interet - snow.interet);
  const meilleur = aval.interet <= snow.interet ? 'Avalanche' : 'Boule de neige';

  return (
    <div className="dp">
      <style>{`
        .dp{color:#eaf2fb;max-width:780px;margin:0 auto}
        .dp h1{font-size:1.5rem;margin:0 0 4px}
        .dp .sub{color:#9fb6cf;font-size:.88rem;margin:0 0 16px}
        .dp-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font-weight:600;cursor:pointer;font-size:.85rem;margin-bottom:14px}
        .dp-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:16px}
        .dp-debt{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr auto;gap:8px;align-items:center;margin-bottom:8px}
        .dp-debt input{background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:8px;color:#eaf2fb;font-size:.85rem;width:100%}
        .dp-head{font-size:.72rem;color:#9fb6cf;font-weight:700}
        .dp-x{background:rgba(239,68,68,.2);border:1px solid rgba(239,68,68,.4);color:#fca5a5;border-radius:8px;width:30px;height:34px;cursor:pointer;font-weight:700}
        .dp-add{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:9px 14px;font-weight:600;cursor:pointer;font-size:.85rem;margin-top:6px}
        .dp-extra{display:flex;align-items:center;gap:10px;margin-top:12px;flex-wrap:wrap}
        .dp-extra input{background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:8px 10px;color:#eaf2fb;font-size:.9rem;width:130px}
        .dp-segs{display:flex;gap:8px;margin-bottom:14px}
        .dp-seg{flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16);color:#eaf2fb;border-radius:10px;padding:11px;cursor:pointer;font-size:.85rem;font-weight:700}
        .dp-seg.on{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border-color:transparent}
        .dp-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
        .dp-stat{background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px;text-align:center}
        .dp-stat .k{font-size:.74rem;color:#9fb6cf}
        .dp-stat .v{font-size:1.1rem;font-weight:800;color:#ffae3b;margin-top:3px}
        .dp-order{list-style:none;padding:0;margin:12px 0 0;counter-reset:o}
        .dp-order li{counter-increment:o;background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:9px 12px;margin-bottom:6px;font-size:.88rem;display:flex;align-items:center;gap:10px}
        .dp-order li::before{content:counter(o);background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;font-weight:800;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.8rem;flex:0 0 auto}
        .dp-cmp{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:6px}
        .dp-cmp .b{background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px}
        .dp-cmp .b.win{border-color:rgba(61,220,151,.6);background:rgba(61,220,151,.08)}
        .dp-cmp .t{font-size:.85rem;font-weight:700;margin-bottom:6px}
        .dp-cmp .r{display:flex;justify-content:space-between;font-size:.8rem;color:#cdd9e8;padding:2px 0}
        .dp-eco{margin-top:12px;background:rgba(61,220,151,.1);border:1px solid rgba(61,220,151,.4);border-radius:10px;padding:11px;font-size:.85rem;color:#86efac;text-align:center}
        .dp-note{font-size:.78rem;color:#9fb6cf;background:rgba(91,157,255,.1);border:1px solid rgba(91,157,255,.3);border-radius:10px;padding:10px;line-height:1.4}
        @media(max-width:760px){.dp-debt{grid-template-columns:1fr 1fr 1fr auto}.dp-debt .dp-head:nth-child(1),.dp-debt input:nth-child(2){grid-column:1/-1}.dp-stats{grid-template-columns:1fr}.dp-cmp{grid-template-columns:1fr}}
      `}</style>

      {goBack && <button className="dp-back" onClick={goBack}>← Retour</button>}
      <h1>📉 Remboursement de dettes</h1>
      <p className="sub">Comparez Avalanche et Boule de neige pour rembourser plus vite et payer moins d'intérêts.</p>

      <div className="dp-card">
        <div className="dp-debt">
          <span className="dp-head">Nom</span><span className="dp-head">Solde ($)</span><span className="dp-head">Taux (% an)</span><span className="dp-head">Paiement min ($)</span><span />
        </div>
        {dettes.map((d) => (
          <div className="dp-debt" key={d.id}>
            <input value={d.nom} onChange={(e) => upd(d.id, 'nom', e.target.value)} />
            <input type="number" min="0" value={d.solde} onChange={(e) => upd(d.id, 'solde', e.target.value)} />
            <input type="number" min="0" step="0.1" value={d.taux} onChange={(e) => upd(d.id, 'taux', e.target.value)} />
            <input type="number" min="0" value={d.min} onChange={(e) => upd(d.id, 'min', e.target.value)} />
            <button className="dp-x" onClick={() => del(d.id)} title="Supprimer">✕</button>
          </div>
        ))}
        <button className="dp-add" onClick={add}>＋ Ajouter une dette</button>
        <div className="dp-extra">
          <label style={{ fontSize: '.85rem', color: '#9fb6cf', fontWeight: 600 }}>Surplus mensuel ($) :</label>
          <input type="number" min="0" value={extra} onChange={(e) => setExtra(e.target.value)} />
          <span style={{ fontSize: '.78rem', color: '#9fb6cf' }}>en plus des paiements minimums (total dettes : {fmt(totalSolde)})</span>
        </div>
      </div>

      <div className="dp-card">
        <div className="dp-segs">
          <button className={`dp-seg ${methode === 'avalanche' ? 'on' : ''}`} onClick={() => setMethode('avalanche')}>🏔️ Avalanche (taux décroissant)</button>
          <button className={`dp-seg ${methode === 'snowball' ? 'on' : ''}`} onClick={() => setMethode('snowball')}>❄️ Boule de neige (solde croissant)</button>
        </div>

        <div className="dp-stats">
          <div className="dp-stat"><div className="k">Temps total</div><div className="v">{actif.impossible ? '∞' : dureeTxt(actif.mois)}</div></div>
          <div className="dp-stat"><div className="k">Intérêts payés</div><div className="v">{actif.impossible ? '∞' : fmt(actif.interet)}</div></div>
          <div className="dp-stat"><div className="k">Total remboursé</div><div className="v">{actif.impossible ? '∞' : fmt(totalSolde + actif.interet)}</div></div>
        </div>

        {actif.impossible ? (
          <div className="dp-eco" style={{ background: 'rgba(239,68,68,.12)', borderColor: 'rgba(239,68,68,.4)', color: '#fca5a5' }}>
            ⚠️ Les paiements ne couvrent pas les intérêts : augmentez les minimums ou le surplus mensuel.
          </div>
        ) : (
          <ol className="dp-order">
            {actif.ordre.map((nom) => <li key={nom}>{nom}</li>)}
          </ol>
        )}
      </div>

      <div className="dp-card">
        <h2 style={{ fontSize: '1rem', margin: '0 0 10px' }}>⚖️ Comparaison des méthodes</h2>
        <div className="dp-cmp">
          <div className={`b ${meilleur === 'Avalanche' && !aval.impossible ? 'win' : ''}`}>
            <div className="t">🏔️ Avalanche</div>
            <div className="r"><span>Temps</span><span>{aval.impossible ? '∞' : dureeTxt(aval.mois)}</span></div>
            <div className="r"><span>Intérêts</span><span>{aval.impossible ? '∞' : fmt(aval.interet)}</span></div>
          </div>
          <div className={`b ${meilleur === 'Boule de neige' && !snow.impossible ? 'win' : ''}`}>
            <div className="t">❄️ Boule de neige</div>
            <div className="r"><span>Temps</span><span>{snow.impossible ? '∞' : dureeTxt(snow.mois)}</span></div>
            <div className="r"><span>Intérêts</span><span>{snow.impossible ? '∞' : fmt(snow.interet)}</span></div>
          </div>
        </div>
        {!aval.impossible && !snow.impossible && (
          <div className="dp-eco">
            {economie < 1
              ? `Les deux méthodes coûtent ~ le même montant d'intérêts ici.`
              : `💰 La méthode ${meilleur} économise ${fmt(economie)} d'intérêts.`}
            {' '}La boule de neige offre des gains psychologiques plus rapides (petites dettes éliminées d'abord).
          </div>
        )}
      </div>

      <p className="dp-note">💡 <strong>Avalanche</strong> : on attaque le taux le plus élevé (moins d'intérêts au total). <strong>Boule de neige</strong> : on élimine d'abord le plus petit solde (motivation). Simulation <strong>approximative</strong> à taux et paiements constants.</p>
    </div>
  );
}

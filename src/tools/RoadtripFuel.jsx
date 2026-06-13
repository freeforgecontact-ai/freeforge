import React, { useState, useEffect, useMemo } from 'react';

/**
 * RoadtripFuel — calculateur de carburant pour road trip 100 % local.
 * Entre la distance, la consommation (L/100km), le prix du carburant,
 * l'option aller-retour et le nombre de passagers : obtiens les litres
 * nécessaires, le coût total et le coût partagé par personne.
 * Aucune connexion réseau. Préférences mémorisées dans le navigateur.
 */

const LS_KEY = 'ff_roadtrip_fuel_v1';
const num = (v, d = 0) => { const n = parseFloat(v); return isFinite(n) ? n : d; };

export default function RoadtripFuel({ goBack }) {
  const [distance, setDistance] = useState('500');
  const [consumption, setConsumption] = useState('7.5');
  const [price, setPrice] = useState('1.65');
  const [roundTrip, setRoundTrip] = useState(true);
  const [passengers, setPassengers] = useState('2');
  const [currency, setCurrency] = useState('$');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.distance != null) setDistance(String(d.distance));
        if (d.consumption != null) setConsumption(String(d.consumption));
        if (d.price != null) setPrice(String(d.price));
        if (typeof d.roundTrip === 'boolean') setRoundTrip(d.roundTrip);
        if (d.passengers != null) setPassengers(String(d.passengers));
        if (d.currency) setCurrency(d.currency);
      }
    } catch (e) { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ distance, consumption, price, roundTrip, passengers, currency })); } catch (e) { /* ignore */ }
  }, [distance, consumption, price, roundTrip, passengers, currency]);

  const r = useMemo(() => {
    const dist = num(distance) * (roundTrip ? 2 : 1);
    const liters = dist * num(consumption) / 100;
    const cost = liters * num(price);
    const pax = Math.max(1, Math.round(num(passengers, 1)));
    return { dist, liters, cost, pax, perPerson: cost / pax };
  }, [distance, consumption, price, roundTrip, passengers]);

  const f2 = (n) => (isFinite(n) ? n : 0).toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const f0 = (n) => Math.round(isFinite(n) ? n : 0).toLocaleString('fr-CA');

  return (
    <div className="rtf">
      <style>{`
        .rtf{color:#eaf2fb;max-width:760px;margin:0 auto}
        .rtf h1{font-size:1.55rem;margin:0 0 4px}
        .rtf .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .rtf-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:18px;margin-bottom:18px}
        .rtf-field{margin-bottom:14px}
        .rtf-field label{display:block;font-size:.85rem;color:#cfe0f3;margin-bottom:5px;font-weight:600}
        .rtf-input{display:flex;align-items:center;background:rgba(10,22,40,.6);border:1px solid rgba(255,255,255,.18);border-radius:11px;overflow:hidden}
        .rtf-input:focus-within{border-color:#5b9dff}
        .rtf-input input{flex:1;background:none;border:none;color:#eaf2fb;padding:11px 12px;font-size:1rem;width:100%}
        .rtf-input input:focus{outline:none}
        .rtf-input .u{padding:0 12px;color:#9fb6cf;font-size:.85rem;white-space:nowrap;border-left:1px solid rgba(255,255,255,.12)}
        .rtf-toggle{display:flex;gap:8px}
        .rtf-toggle button{flex:1;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.04);color:#eaf2fb;cursor:pointer;font-size:.9rem;font-weight:600}
        .rtf-toggle button.on{background:rgba(91,157,255,.25);border-color:#5b9dff}
        .rtf-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:9px 14px;font-weight:700;cursor:pointer;font-size:.9rem}
        .rtf-top{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px}
        .rtf-res{background:linear-gradient(135deg,rgba(255,122,24,.16),rgba(255,174,59,.1));border:1px solid rgba(255,174,59,.35);border-radius:16px;padding:18px}
        .rtf-res h2{margin:0 0 12px;font-size:1.1rem}
        .rtf-big{display:flex;align-items:baseline;justify-content:center;gap:8px;margin:6px 0 14px}
        .rtf-big .v{font-size:2.4rem;font-weight:800;color:#ffae3b;line-height:1}
        .rtf-big .l{color:#cfe0f3;font-size:.95rem}
        .rtf-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
        .rtf-stat{background:rgba(10,22,40,.4);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px;text-align:center}
        .rtf-stat .v{font-size:1.25rem;font-weight:700}
        .rtf-stat .k{font-size:.76rem;color:#9fb6cf;margin-top:3px}
        .rtf-pp{margin-top:14px;text-align:center;background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.3);border-radius:12px;padding:12px}
        .rtf-pp .v{font-size:1.6rem;font-weight:800;color:#34d399}
        .rtf-pp .k{font-size:.82rem;color:#cfe0f3}
        @media(max-width:760px){.rtf-stats{grid-template-columns:1fr}}
      `}</style>

      <div className="rtf-top">
        {goBack && <button className="rtf-btn ghost" onClick={goBack}>← Retour</button>}
        <select className="rtf-btn ghost" style={{ marginLeft: 'auto' }} value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option>$</option><option>€</option><option>£</option><option>CHF</option>
        </select>
      </div>

      <h1>⛽ Carburant de road trip</h1>
      <p className="sub">Estime les litres, le coût total et le partage par passager. 100 % local — aucun envoi de données.</p>

      <div className="rtf-card">
        <div className="rtf-field">
          <label>Distance du trajet (aller simple)</label>
          <div className="rtf-input"><input type="number" min="0" value={distance} onChange={(e) => setDistance(e.target.value)} /><span className="u">km</span></div>
        </div>
        <div className="rtf-field">
          <label>Consommation du véhicule</label>
          <div className="rtf-input"><input type="number" min="0" step="0.1" value={consumption} onChange={(e) => setConsumption(e.target.value)} /><span className="u">L / 100 km</span></div>
        </div>
        <div className="rtf-field">
          <label>Prix du carburant</label>
          <div className="rtf-input"><input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /><span className="u">{currency} / L</span></div>
        </div>
        <div className="rtf-field">
          <label>Type de trajet</label>
          <div className="rtf-toggle">
            <button className={!roundTrip ? 'on' : ''} onClick={() => setRoundTrip(false)}>Aller simple</button>
            <button className={roundTrip ? 'on' : ''} onClick={() => setRoundTrip(true)}>Aller-retour</button>
          </div>
        </div>
        <div className="rtf-field" style={{ marginBottom: 0 }}>
          <label>Nombre de passagers (partage des frais)</label>
          <div className="rtf-input"><input type="number" min="1" step="1" value={passengers} onChange={(e) => setPassengers(e.target.value)} /><span className="u">pers.</span></div>
        </div>
      </div>

      <div className="rtf-res">
        <h2>Résultat</h2>
        <div className="rtf-big">
          <span className="v">{currency}{f2(r.cost)}</span>
          <span className="l">coût total de carburant</span>
        </div>
        <div className="rtf-stats">
          <div className="rtf-stat"><div className="v">{f0(r.dist)} km</div><div className="k">distance totale</div></div>
          <div className="rtf-stat"><div className="v">{f2(r.liters)} L</div><div className="k">carburant requis</div></div>
          <div className="rtf-stat"><div className="v">{currency}{f2(r.cost)}</div><div className="k">coût total</div></div>
        </div>
        {r.pax > 1 && (
          <div className="rtf-pp">
            <div className="v">{currency}{f2(r.perPerson)}</div>
            <div className="k">par personne ({r.pax} passagers)</div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';

/**
 * CryptoPortfolio — suivi de portefeuille crypto 100 % local & hors-ligne.
 * On saisit ses positions (nom/symbole, quantité, prix d'achat) ET le prix
 * actuel à la main (aucune connexion réseau, aucune API de cours en ligne).
 * Calcule la valeur, le gain/perte ($ et %) et un camembert de répartition (SVG).
 * Les positions sont mémorisées dans le navigateur (localStorage).
 */

const LS_KEY = 'crypto_portfolio_v1';
const COLORS = ['#ff7a18', '#ffae3b', '#5b9dff', '#37d39b', '#c47bff', '#ff6b8a', '#46c7e8', '#f2c14e'];
const money = (n) => (isFinite(n) ? n : 0).toLocaleString('fr-CA', { style: 'currency', currency: 'USD' });

export default function CryptoPortfolio({ goBack }) {
  const [rows, setRows] = useState([]); // {id,symbol,qty,buy,now}
  const [symbol, setSymbol] = useState('');
  const [qty, setQty] = useState('');
  const [buy, setBuy] = useState('');
  const [now, setNow] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setRows(JSON.parse(raw));
    } catch (e) { /* corrompu : on ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(rows)); } catch (e) { /* quota : on ignore */ }
  }, [rows]);

  const add = () => {
    const s = symbol.trim().toUpperCase();
    const q = parseFloat(qty), b = parseFloat(buy), n = parseFloat(now);
    if (!s || !(q > 0) || !(b >= 0)) return;
    setRows((p) => [...p, { id: Date.now() + '' + Math.random().toString(36).slice(2), symbol: s, qty: q, buy: b, now: isFinite(n) ? n : b }]);
    setSymbol(''); setQty(''); setBuy(''); setNow('');
  };
  const update = (id, field, val) => {
    const v = parseFloat(val);
    setRows((p) => p.map((r) => (r.id === id ? { ...r, [field]: isFinite(v) ? v : 0 } : r)));
  };
  const remove = (id) => setRows((p) => p.filter((r) => r.id !== id));

  const enriched = useMemo(() => rows.map((r) => {
    const value = r.qty * r.now;
    const cost = r.qty * r.buy;
    const pnl = value - cost;
    const pct = cost > 0 ? (pnl / cost) * 100 : 0;
    return { ...r, value, cost, pnl, pct };
  }), [rows]);

  const totals = useMemo(() => {
    const value = enriched.reduce((a, r) => a + r.value, 0);
    const cost = enriched.reduce((a, r) => a + r.cost, 0);
    return { value, cost, pnl: value - cost, pct: cost > 0 ? ((value - cost) / cost) * 100 : 0 };
  }, [enriched]);

  // ---- camembert SVG ----
  const slices = useMemo(() => {
    const total = totals.value;
    if (total <= 0) return [];
    let acc = 0;
    return enriched.filter((r) => r.value > 0).map((r, i) => {
      const frac = r.value / total;
      const a0 = acc * 2 * Math.PI - Math.PI / 2;
      acc += frac;
      const a1 = acc * 2 * Math.PI - Math.PI / 2;
      const R = 90, cx = 100, cy = 100;
      const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0);
      const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
      const large = frac > 0.5 ? 1 : 0;
      const d = frac >= 0.999
        ? `M ${cx - R} ${cy} a ${R} ${R} 0 1 1 ${R * 2} 0 a ${R} ${R} 0 1 1 ${-R * 2} 0`
        : `M ${cx} ${cy} L ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`;
      return { d, color: COLORS[i % COLORS.length], symbol: r.symbol, frac };
    });
  }, [enriched, totals.value]);

  return (
    <div className="cpf">
      <style>{`
        .cpf{color:#eaf2fb;max-width:1000px;margin:0 auto}
        .cpf h1{font-size:1.6rem;margin:0 0 4px}
        .cpf .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .cpf-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font-weight:600;cursor:pointer;font-size:.85rem;margin-bottom:14px}
        .cpf-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:18px}
        .cpf-form{display:grid;grid-template-columns:1.2fr .8fr .9fr .9fr auto;gap:8px;align-items:end}
        .cpf-form label{display:block;font-size:.72rem;color:#9fb6cf;margin-bottom:4px}
        .cpf input{width:100%;box-sizing:border-box;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.16);border-radius:9px;color:#eaf2fb;padding:9px 10px;font-size:.9rem}
        .cpf input:focus{outline:none;border-color:#5b9dff}
        .cpf-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer;font-size:.9rem;white-space:nowrap}
        .cpf-grid{display:grid;grid-template-columns:1fr 230px;gap:18px}
        .cpf-tbl{width:100%;border-collapse:collapse;font-size:.85rem}
        .cpf-tbl th{text-align:right;color:#9fb6cf;font-weight:600;padding:8px;border-bottom:1px solid rgba(255,255,255,.12)}
        .cpf-tbl th:first-child{text-align:left}
        .cpf-tbl td{padding:8px;border-bottom:1px solid rgba(255,255,255,.07);text-align:right}
        .cpf-tbl td:first-child{text-align:left;font-weight:700}
        .cpf-tbl input{width:90px;padding:5px 7px;text-align:right;font-size:.82rem}
        .cpf-up{color:#37d39b}.cpf-down{color:#ff8a8a}
        .cpf-x{background:none;border:none;color:#ff8a8a;cursor:pointer;font-size:1rem;opacity:.7}
        .cpf-x:hover{opacity:1}
        .cpf-tot{display:flex;gap:18px;flex-wrap:wrap;margin-top:14px}
        .cpf-tot div{background:rgba(91,157,255,.12);border:1px solid rgba(91,157,255,.3);border-radius:12px;padding:10px 16px}
        .cpf-tot small{display:block;color:#9fb6cf;font-size:.72rem}
        .cpf-tot b{font-size:1.2rem}
        .cpf-leg{display:flex;align-items:center;gap:7px;font-size:.82rem;margin:5px 0}
        .cpf-dot{width:11px;height:11px;border-radius:3px;flex:none}
        .cpf-empty{text-align:center;color:#9fb6cf;padding:30px 10px;font-size:.9rem}
        @media(max-width:760px){.cpf-form{grid-template-columns:1fr 1fr}.cpf-grid{grid-template-columns:1fr}.cpf-tbl input{width:70px}}
      `}</style>

      {goBack && <button className="cpf-back" onClick={goBack}>← Retour</button>}
      <h1>📈 Portefeuille crypto</h1>
      <p className="sub">100 % local & hors-ligne. Saisis tes positions et le prix actuel à la main — rien n'est envoyé sur Internet.</p>

      <div className="cpf-card">
        <div className="cpf-form">
          <div><label>Symbole / nom</label><input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="BTC" /></div>
          <div><label>Quantité</label><input type="number" step="any" min="0" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0.5" /></div>
          <div><label>Prix d'achat ($)</label><input type="number" step="any" min="0" value={buy} onChange={(e) => setBuy(e.target.value)} placeholder="40000" /></div>
          <div><label>Prix actuel ($)</label><input type="number" step="any" min="0" value={now} onChange={(e) => setNow(e.target.value)} placeholder="45000" /></div>
          <button className="cpf-btn" onClick={add}>＋ Ajouter</button>
        </div>
      </div>

      {enriched.length === 0 ? (
        <div className="cpf-card"><div className="cpf-empty">Aucune position. Ajoute ta première crypto ci-dessus.</div></div>
      ) : (
        <div className="cpf-grid">
          <div className="cpf-card">
            <table className="cpf-tbl">
              <thead>
                <tr><th>Actif</th><th>Qté</th><th>Achat</th><th>Actuel</th><th>Valeur</th><th>Gain/Perte</th><th></th></tr>
              </thead>
              <tbody>
                {enriched.map((r) => (
                  <tr key={r.id}>
                    <td>{r.symbol}</td>
                    <td>{r.qty}</td>
                    <td>{money(r.buy)}</td>
                    <td><input type="number" step="any" min="0" value={r.now} onChange={(e) => update(r.id, 'now', e.target.value)} /></td>
                    <td>{money(r.value)}</td>
                    <td className={r.pnl >= 0 ? 'cpf-up' : 'cpf-down'}>{money(r.pnl)}<br /><small>{r.pct >= 0 ? '+' : ''}{r.pct.toFixed(2)} %</small></td>
                    <td><button className="cpf-x" title="Supprimer" onClick={() => remove(r.id)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="cpf-tot">
              <div><small>Valeur totale</small><b>{money(totals.value)}</b></div>
              <div><small>Coût total</small><b>{money(totals.cost)}</b></div>
              <div><small>Gain / perte</small><b className={totals.pnl >= 0 ? 'cpf-up' : 'cpf-down'}>{money(totals.pnl)} ({totals.pct >= 0 ? '+' : ''}{totals.pct.toFixed(2)} %)</b></div>
            </div>
          </div>

          <div className="cpf-card">
            <h3 style={{ margin: '0 0 10px', fontSize: '1rem' }}>Répartition</h3>
            {slices.length > 0 ? (
              <>
                <svg viewBox="0 0 200 200" style={{ width: '100%', maxWidth: 200, display: 'block', margin: '0 auto' }}>
                  {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} stroke="#0a1628" strokeWidth="1.5" />)}
                  <circle cx="100" cy="100" r="44" fill="#0a1628" />
                </svg>
                <div style={{ marginTop: 10 }}>
                  {slices.map((s, i) => (
                    <div key={i} className="cpf-leg">
                      <span className="cpf-dot" style={{ background: s.color }} />
                      {s.symbol} — {(s.frac * 100).toFixed(1)} %
                    </div>
                  ))}
                </div>
              </>
            ) : <div className="cpf-empty">Saisis un prix actuel &gt; 0 pour voir la répartition.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

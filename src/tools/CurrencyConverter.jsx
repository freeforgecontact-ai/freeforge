import React, { useState, useEffect, useMemo } from 'react';

/**
 * CurrencyConverter — convertisseur de devises 100 % LOCAL & hors-ligne.
 * Aucun réseau : l'utilisateur saisit/édite lui-même les taux (par rapport à une
 * devise de base). Des taux par défaut approximatifs sont fournis et modifiables.
 * Les taux et la date de dernière mise à jour sont mémorisés (localStorage).
 */

const LS_KEY = 'ff_currency_converter_v1';

// Taux approximatifs par rapport à 1 unité de base (USD). À ajuster par l'utilisateur.
const DEFAULTS = {
  base: 'USD',
  rates: {
    USD: 1,
    CAD: 1.37,
    EUR: 0.92,
    GBP: 0.79,
    MXN: 17.1,
    JPY: 156,
    CHF: 0.88,
    AUD: 1.52,
    BRL: 5.1,
    CNY: 7.25,
  },
};

const NAMES = {
  USD: 'Dollar américain', CAD: 'Dollar canadien', EUR: 'Euro',
  GBP: 'Livre sterling', MXN: 'Peso mexicain', JPY: 'Yen japonais',
  CHF: 'Franc suisse', AUD: 'Dollar australien', BRL: 'Réal brésilien',
  CNY: 'Yuan chinois',
};

const todayStr = () => new Date().toLocaleDateString('fr-FR');

export default function CurrencyConverter({ goBack }) {
  const [rates, setRates] = useState(DEFAULTS.rates);
  const [base, setBase] = useState(DEFAULTS.base);
  const [updated, setUpdated] = useState(todayStr());
  const [from, setFrom] = useState('CAD');
  const [to, setTo] = useState('EUR');
  const [amount, setAmount] = useState('100');
  const [newCode, setNewCode] = useState('');
  const [edit, setEdit] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.rates) setRates(d.rates);
        if (d.base) setBase(d.base);
        if (d.updated) setUpdated(d.updated);
      }
    } catch (e) { /* ignore */ }
  }, []);

  const persist = (nextRates, nextBase, nextUpdated) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        rates: nextRates, base: nextBase, updated: nextUpdated,
      }));
    } catch (e) { /* quota/file:// : ignore */ }
  };

  const setRate = (code, val) => {
    const next = { ...rates, [code]: val === '' ? '' : Number(val) };
    setRates(next);
    const u = todayStr(); setUpdated(u); persist(next, base, u);
  };

  const addCurrency = () => {
    const c = newCode.trim().toUpperCase();
    if (!c || rates[c] !== undefined) { setNewCode(''); return; }
    const next = { ...rates, [c]: 1 };
    setRates(next); setNewCode('');
    const u = todayStr(); setUpdated(u); persist(next, base, u);
  };

  const removeCurrency = (code) => {
    if (code === base) return;
    const next = { ...rates }; delete next[code];
    setRates(next);
    if (from === code) setFrom(base);
    if (to === code) setTo(base);
    const u = todayStr(); setUpdated(u); persist(next, base, u);
  };

  const resetDefaults = () => {
    setRates(DEFAULTS.rates); setBase(DEFAULTS.base);
    const u = todayStr(); setUpdated(u);
    setFrom('CAD'); setTo('EUR');
    persist(DEFAULTS.rates, DEFAULTS.base, u);
  };

  const result = useMemo(() => {
    const a = parseFloat(amount);
    const rf = Number(rates[from]); const rt = Number(rates[to]);
    if (!isFinite(a) || !rf || !rt) return null;
    // tout est exprimé par rapport à la base : montant_base = a / rf ; cible = montant_base * rt
    return (a / rf) * rt;
  }, [amount, from, to, rates]);

  const codes = Object.keys(rates);
  const swap = () => { setFrom(to); setTo(from); };

  return (
    <div className="cvc">
      <style>{`
        .cvc{color:#eaf2fb;max-width:760px;margin:0 auto}
        .cvc h1{font-size:1.6rem;margin:0 0 4px}
        .cvc .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .cvc-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:18px;margin-bottom:16px}
        .cvc-row{display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap}
        .cvc-f{flex:1;min-width:130px;display:flex;flex-direction:column;gap:5px}
        .cvc-f label{font-size:.8rem;color:#9fb6cf}
        .cvc input,.cvc select{background:rgba(10,22,40,.6);border:1px solid rgba(255,255,255,.18);border-radius:10px;color:#eaf2fb;padding:11px 12px;font-size:1rem;width:100%;box-sizing:border-box}
        .cvc input:focus,.cvc select:focus{outline:none;border-color:#5b9dff}
        .cvc-swap{background:rgba(91,157,255,.22);border:1px solid rgba(91,157,255,.5);color:#eaf2fb;border-radius:10px;padding:11px 14px;cursor:pointer;font-size:1.1rem}
        .cvc-swap:hover{background:rgba(91,157,255,.34)}
        .cvc-out{margin-top:16px;text-align:center;background:rgba(91,157,255,.12);border:1px solid rgba(91,157,255,.3);border-radius:12px;padding:16px}
        .cvc-out .big{font-size:2rem;font-weight:800;color:#ffae3b}
        .cvc-out .eq{color:#9fb6cf;font-size:.85rem;margin-top:4px}
        .cvc-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;font-size:.9rem}
        .cvc-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .cvc-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px}
        .cvc-head h2{font-size:1.05rem;margin:0}
        .cvc-rate{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08)}
        .cvc-rate .code{font-weight:700;width:54px}
        .cvc-rate .nm{flex:1;color:#9fb6cf;font-size:.82rem;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .cvc-rate input{width:120px}
        .cvc-x{opacity:.5;cursor:pointer;font-size:.85rem;padding:4px}
        .cvc-x:hover{opacity:1;color:#ff8a8a}
        .cvc-note{color:#9fb6cf;font-size:.8rem;margin-top:10px;line-height:1.45}
        @media(max-width:760px){.cvc-rate input{width:96px}}
      `}</style>

      {goBack && <button className="cvc-btn ghost" style={{ marginBottom: 14 }} onClick={goBack}>← Retour</button>}

      <h1>💱 Convertisseur de devises</h1>
      <p className="sub">100 % hors-ligne — tu saisis et édites toi-même les taux. Aucune donnée envoyée.</p>

      <div className="cvc-card">
        <div className="cvc-row">
          <div className="cvc-f">
            <label>Montant</label>
            <input type="number" inputMode="decimal" value={amount}
                   onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          </div>
          <div className="cvc-f">
            <label>De</label>
            <select value={from} onChange={(e) => setFrom(e.target.value)}>
              {codes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button className="cvc-swap" title="Inverser" onClick={swap}>⇄</button>
          <div className="cvc-f">
            <label>Vers</label>
            <select value={to} onChange={(e) => setTo(e.target.value)}>
              {codes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="cvc-out">
          {result === null ? (
            <div className="big">—</div>
          ) : (
            <>
              <div className="big">{result.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} {to}</div>
              <div className="eq">{Number(amount).toLocaleString('fr-FR')} {from} · 1 {from} = {((1 / Number(rates[from])) * Number(rates[to])).toLocaleString('fr-FR', { maximumFractionDigits: 4 })} {to}</div>
            </>
          )}
        </div>
      </div>

      <div className="cvc-card">
        <div className="cvc-head">
          <h2>Taux (1 {base} = X devise) · maj {updated}</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="cvc-btn ghost" onClick={() => setEdit((e) => !e)}>{edit ? 'Terminer' : '✎ Éditer'}</button>
            <button className="cvc-btn ghost" onClick={resetDefaults}>↺ Défauts</button>
          </div>
        </div>

        {codes.map((c) => (
          <div key={c} className="cvc-rate">
            <span className="code">{c}</span>
            <span className="nm">{NAMES[c] || 'Devise'}</span>
            {edit ? (
              <input type="number" inputMode="decimal" value={rates[c]}
                     onChange={(e) => setRate(c, e.target.value)} />
            ) : (
              <span style={{ width: 120, textAlign: 'right' }}>{Number(rates[c]).toLocaleString('fr-FR', { maximumFractionDigits: 4 })}</span>
            )}
            {edit && c !== base && (
              <span className="cvc-x" title="Retirer" onClick={() => removeCurrency(c)}>✕</span>
            )}
          </div>
        ))}

        {edit && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input style={{ flex: 1 }} maxLength={4} value={newCode}
                   onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                   placeholder="Code (ex: SEK)" onKeyDown={(e) => e.key === 'Enter' && addCurrency()} />
            <button className="cvc-btn" onClick={addCurrency}>＋ Ajouter</button>
          </div>
        )}

        <p className="cvc-note">
          Devise de base : <b>{base}</b>. Les taux par défaut sont approximatifs — mets-les à jour
          d'après ta dernière source connue avant un voyage. Tout reste sur cet appareil.
        </p>
      </div>
    </div>
  );
}

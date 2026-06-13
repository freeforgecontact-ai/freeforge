import React, { useState, useEffect, useMemo } from 'react';

/**
 * Flashcards — fiches d'étude avec répétition espacée (système de Leitner à 5 boîtes).
 * 100 % local & hors-ligne. Les cartes sont mémorisées dans le navigateur (localStorage).
 * Mode étude : on tire les cartes dues, on révèle la réponse, on s'auto-évalue
 * (réussi → boîte supérieure ; raté → retour à la boîte 1).
 */

const LS_KEY = 'freeforge_flashcards_v1';
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;
// Délai (en jours) avant qu'une carte d'une boîte redevienne « due ».
const DELAIS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 16 };
const JOUR = 86400000;

export default function Flashcards({ goBack }) {
  const [cartes, setCartes] = useState([]);
  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  const [vue, setVue] = useState('liste'); // 'liste' | 'etude'
  const [idx, setIdx] = useState(0);
  const [revele, setRevele] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setCartes(JSON.parse(raw));
    } catch (e) { /* données illisibles : on repart à vide */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(cartes)); } catch (e) { /* quota : on ignore */ }
  }, [cartes]);

  const ajouter = () => {
    const question = q.trim(), reponse = a.trim();
    if (!question || !reponse) return;
    setCartes((c) => [...c, { id: uid(), q: question, a: reponse, boite: 1, prochain: Date.now() }]);
    setQ(''); setA('');
  };
  const supprimer = (id) => setCartes((c) => c.filter((x) => x.id !== id));

  const dues = useMemo(() => cartes.filter((c) => (c.prochain || 0) <= Date.now()), [cartes]);

  const demarrer = () => {
    if (!dues.length) return;
    setIdx(0); setRevele(false); setVue('etude');
  };

  const evaluer = (reussi) => {
    const carte = dues[idx];
    if (!carte) return;
    setCartes((cs) => cs.map((c) => {
      if (c.id !== carte.id) return c;
      const boite = reussi ? Math.min(5, c.boite + 1) : 1;
      return { ...c, boite, prochain: Date.now() + DELAIS[boite] * JOUR };
    }));
    if (idx + 1 >= dues.length) { setVue('liste'); }
    else { setIdx((i) => i + 1); setRevele(false); }
  };

  const reset = () => setCartes((c) => c.map((x) => ({ ...x, boite: 1, prochain: Date.now() })));

  const parBoite = [1, 2, 3, 4, 5].map((b) => cartes.filter((c) => c.boite === b).length);
  const maitrisees = cartes.filter((c) => c.boite >= 4).length;
  const carte = dues[idx];

  return (
    <div className="fc">
      <style>{`
        .fc{color:#eaf2fb;max-width:760px;margin:0 auto}
        .fc h1{font-size:1.5rem;margin:0 0 4px}
        .fc .sub{color:#9fb6cf;font-size:.88rem;margin:0 0 16px}
        .fc-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 13px;cursor:pointer;font-size:.85rem;margin-bottom:14px}
        .fc-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:14px}
        .fc input,.fc textarea{width:100%;box-sizing:border-box;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.16);border-radius:8px;color:#eaf2fb;padding:9px;font-size:.92rem;margin-bottom:8px;font-family:inherit}
        .fc textarea{resize:vertical;min-height:54px}
        .fc input:focus,.fc textarea:focus{outline:none;border-color:#5b9dff}
        .fc-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;font-size:.9rem}
        .fc-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .fc-btn:disabled{opacity:.45;cursor:not-allowed}
        .fc-stats{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
        .fc-box{flex:1;min-width:64px;background:rgba(91,157,255,.12);border:1px solid rgba(91,157,255,.3);border-radius:12px;padding:10px;text-align:center}
        .fc-box .v{font-size:1.3rem;font-weight:800;color:#fff}
        .fc-box .k{font-size:.7rem;color:#9fb6cf}
        .fc-item{display:flex;gap:10px;align-items:flex-start;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.08)}
        .fc-item+.fc-item{margin-top:8px}
        .fc-item .q{flex:1;font-size:.9rem}
        .fc-item .q small{color:#9fb6cf;display:block;margin-top:3px}
        .fc-badge{font-size:.7rem;background:rgba(255,174,59,.18);border:1px solid rgba(255,174,59,.4);color:#ffce8a;border-radius:20px;padding:2px 8px;white-space:nowrap}
        .fc-x{background:none;border:none;color:#ff8a8a;cursor:pointer;font-size:1rem;opacity:.6}
        .fc-x:hover{opacity:1}
        .fc-study{text-align:center;min-height:170px;display:flex;flex-direction:column;justify-content:center;gap:14px}
        .fc-study .qz{font-size:1.3rem;font-weight:700;line-height:1.4}
        .fc-study .az{font-size:1.1rem;color:#9cd1ff;border-top:1px dashed rgba(255,255,255,.2);padding-top:14px;line-height:1.45}
        .fc-prog{color:#9fb6cf;font-size:.82rem;margin-bottom:8px;text-align:center}
        .fc-empty{text-align:center;color:#9fb6cf;padding:24px 8px;font-size:.9rem}
        @media(max-width:760px){.fc input,.fc textarea{font-size:16px}.fc-box{min-width:54px}}
      `}</style>

      {goBack && <button className="fc-back" onClick={goBack}>← Retour</button>}
      <h1>🗂️ Fiches d'étude — Leitner</h1>
      <p className="sub">Répétition espacée à 5 boîtes : les cartes réussies s'espacent, les ratées reviennent vite. Tout reste sur ton appareil.</p>

      <div className="fc-stats">
        {parBoite.map((n, i) => (
          <div className="fc-box" key={i}><div className="v">{n}</div><div className="k">Boîte {i + 1}</div></div>
        ))}
      </div>
      <p className="fc-prog">{cartes.length} carte(s) · {maitrisees} bien maîtrisée(s) · <b style={{ color: '#ffce8a' }}>{dues.length} à réviser maintenant</b></p>

      {vue === 'etude' && carte ? (
        <div className="fc-card">
          <p className="fc-prog">Carte {idx + 1} / {dues.length} — boîte {carte.boite}</p>
          <div className="fc-study">
            <div className="qz">{carte.q}</div>
            {revele && <div className="az">{carte.a}</div>}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
            {!revele ? (
              <button className="fc-btn" onClick={() => setRevele(true)}>👁️ Révéler la réponse</button>
            ) : (
              <>
                <button className="fc-btn ghost" onClick={() => evaluer(false)}>❌ Raté</button>
                <button className="fc-btn" onClick={() => evaluer(true)}>✅ Réussi</button>
              </>
            )}
            <button className="fc-btn ghost" onClick={() => setVue('liste')}>Arrêter</button>
          </div>
        </div>
      ) : (
        <>
          <div className="fc-card">
            <textarea value={q} placeholder="Question (recto)…" onChange={(e) => setQ(e.target.value)} />
            <textarea value={a} placeholder="Réponse (verso)…" onChange={(e) => setA(e.target.value)} />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="fc-btn" onClick={ajouter} disabled={!q.trim() || !a.trim()}>＋ Ajouter la carte</button>
              <button className="fc-btn" onClick={demarrer} disabled={!dues.length}>▶️ Étudier ({dues.length})</button>
              {cartes.length > 0 && <button className="fc-btn ghost" onClick={reset}>↺ Réinitialiser la progression</button>}
            </div>
          </div>

          {cartes.length === 0 ? (
            <div className="fc-empty">Aucune carte pour l'instant. Crée ta première fiche ci-dessus.</div>
          ) : (
            <div className="fc-card">
              {cartes.map((c) => (
                <div className="fc-item" key={c.id}>
                  <div className="q">{c.q}<small>↳ {c.a}</small></div>
                  <span className="fc-badge">Boîte {c.boite}</span>
                  <button className="fc-x" title="Supprimer" onClick={() => supprimer(c.id)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

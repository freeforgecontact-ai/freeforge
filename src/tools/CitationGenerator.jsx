import React, { useState, useEffect, useMemo } from 'react';

/**
 * CitationGenerator — générateur de références bibliographiques (APA 7 / MLA 9)
 * pour livres, articles web et articles de revue. 100 % local & hors-ligne.
 * Génère la référence formatée, permet de la copier et conserve une liste
 * mémorisée dans le navigateur (localStorage).
 */

const LS_KEY = 'freeforge_citations_v1';
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

// "Prénom Nom" -> "Nom, P." (APA) ; ne touche pas si déjà sous forme "Nom, X".
function auteurAPA(nom) {
  const n = (nom || '').trim();
  if (!n) return '';
  if (n.includes(',')) return n;
  const p = n.split(/\s+/);
  if (p.length < 2) return n;
  const famille = p.pop();
  const initiales = p.map((x) => x[0].toUpperCase() + '.').join(' ');
  return `${famille}, ${initiales}`;
}
// "Prénom Nom" -> "Nom, Prénom" (MLA)
function auteurMLA(nom) {
  const n = (nom || '').trim();
  if (!n) return '';
  if (n.includes(',')) return n;
  const p = n.split(/\s+/);
  if (p.length < 2) return n;
  const famille = p.pop();
  return `${famille}, ${p.join(' ')}`;
}
function dateConsult(iso, style) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return iso;
  return style === 'mla'
    ? `${d.getDate()} ${MOIS[d.getMonth()].slice(0, 4)}. ${d.getFullYear()}`
    : `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatter(c) {
  const { style, type, auteur, titre, annee, editeur, revue, vol, num, pages, url, consult } = c;
  const an = (annee || 's.d.').trim();
  if (style === 'apa') {
    const a = auteurAPA(auteur);
    const aut = a ? `${a} ` : '';
    if (type === 'livre')
      return `${aut}(${an}). *${titre}*.${editeur ? ` ${editeur}.` : ''}`.trim();
    if (type === 'revue')
      return `${aut}(${an}). ${titre}. *${revue}*${vol ? `, ${vol}` : ''}${num ? `(${num})` : ''}${pages ? `, ${pages}` : ''}.`.trim();
    // web
    return `${aut}(${an}). *${titre}*.${editeur ? ` ${editeur}.` : ''}${url ? ` ${url}` : ''}`.trim();
  }
  // MLA 9
  const a = auteurMLA(auteur);
  const aut = a ? `${a}. ` : '';
  if (type === 'livre')
    return `${aut}*${titre}*.${editeur ? ` ${editeur},` : ''} ${an}.`.replace(/\s+,/g, ',').trim();
  if (type === 'revue')
    return `${aut}« ${titre}. » *${revue}*${vol ? `, vol. ${vol}` : ''}${num ? `, no ${num}` : ''}, ${an}${pages ? `, p. ${pages}` : ''}.`.trim();
  // web
  return `${aut}« ${titre}. »${editeur ? ` *${editeur}*,` : ''} ${an}${url ? `, ${url}` : ''}${consult ? `. Consulté le ${dateConsult(consult, 'mla')}` : ''}.`.trim();
}

const VIDE = { auteur: '', titre: '', annee: '', editeur: '', revue: '', vol: '', num: '', pages: '', url: '', consult: '' };

export default function CitationGenerator({ goBack }) {
  const [style, setStyle] = useState('apa');
  const [type, setType] = useState('web');
  const [f, setF] = useState(VIDE);
  const [liste, setListe] = useState([]);
  const [copie, setCopie] = useState(null);

  useEffect(() => {
    try { const raw = localStorage.getItem(LS_KEY); if (raw) setListe(JSON.parse(raw)); } catch (e) { /* illisible */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(liste)); } catch (e) { /* quota */ }
  }, [liste]);

  const apercu = useMemo(() => formatter({ style, type, ...f }), [style, type, f]);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  // Affiche le markdown *italique* comme du vrai italique dans l'aperçu/la liste.
  const rendre = (s) => s.split('*').map((part, i) => (i % 2 ? <i key={i}>{part}</i> : <span key={i}>{part}</span>));

  const ajouter = () => {
    if (!f.titre.trim()) return;
    setListe((l) => [...l, { id: uid(), style, type, texte: apercu }]);
    setF(VIDE);
  };
  const supprimer = (id) => setListe((l) => l.filter((x) => x.id !== id));

  const copier = async (texte, id) => {
    const plat = texte.replace(/\*/g, '');
    try {
      await navigator.clipboard.writeText(plat);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = plat; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (err) { /* copie indispo */ }
      document.body.removeChild(ta);
    }
    setCopie(id); setTimeout(() => setCopie((c) => (c === id ? null : c)), 1400);
  };

  const champ = (k, ph, props = {}) => (
    <input value={f[k]} placeholder={ph} onChange={(e) => set(k, e.target.value)} {...props} />
  );

  return (
    <div className="cig">
      <style>{`
        .cig{color:#eaf2fb;max-width:780px;margin:0 auto}
        .cig h1{font-size:1.5rem;margin:0 0 4px}
        .cig .sub{color:#9fb6cf;font-size:.88rem;margin:0 0 16px}
        .cig-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 13px;cursor:pointer;font-size:.85rem;margin-bottom:14px}
        .cig-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:14px}
        .cig-seg{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
        .cig-seg button{background:rgba(255,255,255,.06);color:#eaf2fb;border:1px solid rgba(255,255,255,.16);border-radius:20px;padding:7px 14px;cursor:pointer;font-size:.85rem}
        .cig-seg button.on{background:rgba(91,157,255,.25);border-color:#5b9dff;font-weight:700}
        .cig-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .cig input{width:100%;box-sizing:border-box;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.16);border-radius:8px;color:#eaf2fb;padding:9px;font-size:.92rem}
        .cig input:focus{outline:none;border-color:#5b9dff}
        .cig label{font-size:.72rem;color:#9fb6cf;display:block;margin-bottom:4px}
        .cig .full{grid-column:1/-1}
        .cig-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;font-size:.9rem}
        .cig-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .cig-btn:disabled{opacity:.45;cursor:not-allowed}
        .cig-prev{background:rgba(0,0,0,.25);border:1px dashed rgba(255,174,59,.4);border-radius:12px;padding:12px;font-size:.92rem;line-height:1.55;margin:12px 0;word-break:break-word}
        .cig-item{display:flex;gap:10px;align-items:flex-start;padding:11px;border-radius:10px;border:1px solid rgba(255,255,255,.08);line-height:1.5;font-size:.9rem;word-break:break-word}
        .cig-item+.cig-item{margin-top:8px}
        .cig-item .tx{flex:1}
        .cig-item .tag{font-size:.66rem;color:#9cd1ff;text-transform:uppercase;letter-spacing:.04em;display:block;margin-top:4px}
        .cig-mini{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:5px 9px;cursor:pointer;font-size:.78rem;white-space:nowrap}
        .cig-x{background:none;border:none;color:#ff8a8a;cursor:pointer;font-size:1rem;opacity:.6}
        .cig-x:hover{opacity:1}
        .cig-empty{text-align:center;color:#9fb6cf;padding:18px 8px;font-size:.88rem}
        @media(max-width:760px){.cig-grid{grid-template-columns:1fr}.cig input{font-size:16px}}
      `}</style>

      {goBack && <button className="cig-back" onClick={goBack}>← Retour</button>}
      <h1>📚 Générateur de citations</h1>
      <p className="sub">Crée des références APA 7 ou MLA 9 pour tes travaux. Copie en un clic. Tout reste sur ton appareil.</p>

      <div className="cig-card">
        <div className="cig-seg">
          {[['apa', 'APA 7'], ['mla', 'MLA 9']].map(([v, lib]) => (
            <button key={v} className={style === v ? 'on' : ''} onClick={() => setStyle(v)}>{lib}</button>
          ))}
        </div>
        <div className="cig-seg">
          {[['livre', '📖 Livre'], ['web', '🌐 Article web'], ['revue', '📰 Article de revue']].map(([v, lib]) => (
            <button key={v} className={type === v ? 'on' : ''} onClick={() => setType(v)}>{lib}</button>
          ))}
        </div>

        <div className="cig-grid">
          <div><label>Auteur (Prénom Nom)</label>{champ('auteur', 'ex: Marie Tremblay')}</div>
          <div><label>Année</label>{champ('annee', 'ex: 2024', { type: 'number', inputMode: 'numeric' })}</div>
          <div className="full"><label>Titre</label>{champ('titre', 'Titre de l\'œuvre ou de l\'article')}</div>

          {type === 'livre' && (
            <div className="full"><label>Éditeur</label>{champ('editeur', 'ex: Éditions du Boréal')}</div>
          )}

          {type === 'revue' && (
            <>
              <div className="full"><label>Nom de la revue</label>{champ('revue', 'ex: Revue québécoise de psychologie')}</div>
              <div><label>Volume</label>{champ('vol', 'ex: 12')}</div>
              <div><label>Numéro</label>{champ('num', 'ex: 3')}</div>
              <div className="full"><label>Pages</label>{champ('pages', 'ex: 45-67')}</div>
            </>
          )}

          {type === 'web' && (
            <>
              <div className="full"><label>Site / éditeur</label>{champ('editeur', 'ex: Radio-Canada')}</div>
              <div className="full"><label>URL</label>{champ('url', 'https://…')}</div>
              <div><label>Date de consultation</label>{champ('consult', '', { type: 'date' })}</div>
            </>
          )}
        </div>

        <div className="cig-prev">{f.titre.trim() ? rendre(apercu) : <span style={{ color: '#9fb6cf' }}>L'aperçu de la référence apparaîtra ici…</span>}</div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="cig-btn" onClick={ajouter} disabled={!f.titre.trim()}>＋ Ajouter à ma liste</button>
          <button className="cig-btn ghost" onClick={() => copier(apercu, 'apercu')} disabled={!f.titre.trim()}>
            {copie === 'apercu' ? '✓ Copié' : '⧉ Copier l\'aperçu'}
          </button>
          {f.titre && <button className="cig-btn ghost" onClick={() => setF(VIDE)}>Vider</button>}
        </div>
      </div>

      <div className="cig-card">
        <strong style={{ fontSize: '.95rem' }}>Mes références ({liste.length})</strong>
        <div style={{ marginTop: 10 }}>
          {liste.length === 0 ? (
            <div className="cig-empty">Aucune référence enregistrée. Ajoute ta première ci-dessus.</div>
          ) : liste.map((it) => (
            <div className="cig-item" key={it.id}>
              <div className="tx">{rendre(it.texte)}<span className="tag">{it.style.toUpperCase()} · {it.type}</span></div>
              <button className="cig-mini" onClick={() => copier(it.texte, it.id)}>{copie === it.id ? '✓ Copié' : '⧉ Copier'}</button>
              <button className="cig-x" title="Supprimer" onClick={() => supprimer(it.id)}>✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';

/**
 * TextAnalyzer — analyseur de texte & lisibilité, 100 % local & hors-ligne.
 * Compte mots, caractères, phrases, paragraphes, temps de lecture estimé,
 * indices Flesch-Kincaid & ARI, et densité des mots-clés fréquents (top 10,
 * mots vides français exclus). Mise à jour en direct. Aucune donnée envoyée.
 */

const STOPWORDS = new Set(('au aux avec ce ces dans de des du elle en et eux il ils je la le les leur lui ma mais me meme ' +
  'mes moi mon ne nos notre nous on ou par pas pour qu que qui sa se ses son sur ta te tes toi ton tu un une vos votre ' +
  'vous c d j l m n s t y est sont a as ont etait etre eu suis sommes etes ete ai avais avait avons avez plus tres bien ' +
  'cette cet celui ceux fait faire dont sans sous entre alors donc car ni si ne là où deja aussi tout tous toute toutes').split(' '));

// Compte approximatif de syllabes d'un mot français (groupes de voyelles)
const countSyllables = (word) => {
  const w = word.toLowerCase().replace(/[^a-zàâäéèêëîïôöùûüÿœæ]/g, '');
  if (!w) return 0;
  const groups = w.match(/[aàâäeéèêëiîïoôöuùûüyœæ]+/g);
  let n = groups ? groups.length : 1;
  if (w.length > 2 && /e$/.test(w)) n = Math.max(1, n - 1); // « e » muet final
  return Math.max(1, n);
};

export default function TextAnalyzer() {
  const [text, setText] = useState('');

  const stats = useMemo(() => {
    const t = text.trim();
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, '').length;
    const wordTokens = t ? t.match(/[\p{L}\p{N}'’-]+/gu) || [] : [];
    const words = wordTokens.length;
    const sentences = t ? (t.match(/[^.!?…]+[.!?…]+/g) || [t]).length : 0;
    const paragraphs = t ? t.split(/\n{2,}|\n/).filter((p) => p.trim()).length : 0;
    const syllables = wordTokens.reduce((s, w) => s + countSyllables(w), 0);
    const readMin = words / 200; // ~200 mots/min

    // Flesch-Kincaid (formule adaptée FR, Kandel & Moles) : niveau de difficulté
    const wps = words && sentences ? words / sentences : 0;
    const spw = words ? syllables / words : 0;
    const flesch = words ? 207 - 1.015 * wps - 73.6 * spw : 0;
    // ARI : Automated Readability Index -> niveau scolaire
    const ari = words && sentences ? 4.71 * (charsNoSpace / words) + 0.5 * wps - 21.43 : 0;

    // densité mots-clés
    const freq = {};
    wordTokens.forEach((w) => {
      const k = w.toLowerCase().replace(/['’-]/g, '');
      if (k.length < 3 || STOPWORDS.has(k) || /^\d+$/.test(k)) return;
      freq[k] = (freq[k] || 0) + 1;
    });
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([k, c]) => ({ k, c, pct: words ? (c / words) * 100 : 0 }));

    return { chars, charsNoSpace, words, sentences, paragraphs, syllables, readMin, flesch, ari, top };
  }, [text]);

  const fleschLabel = (s) => s >= 80 ? 'Très facile' : s >= 60 ? 'Facile' : s >= 40 ? 'Moyen' : s >= 20 ? 'Difficile' : 'Très difficile';
  const readTime = stats.readMin < 1 ? `${Math.max(1, Math.round(stats.readMin * 60))} s` : `${Math.ceil(stats.readMin)} min`;
  const maxC = stats.top.length ? stats.top[0].c : 1;

  const CARDS = [
    { l: 'Mots', v: stats.words },
    { l: 'Caractères', v: stats.chars },
    { l: 'Sans espaces', v: stats.charsNoSpace },
    { l: 'Phrases', v: stats.sentences },
    { l: 'Paragraphes', v: stats.paragraphs },
    { l: 'Lecture', v: readTime },
  ];

  return (
    <div className="txan">
      <style>{`
        .txan{color:#eaf2fb;max-width:880px;margin:0 auto}
        .txan h1{font-size:1.55rem;margin:0 0 4px}
        .txan .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 16px}
        .txan textarea{width:100%;min-height:200px;box-sizing:border-box;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.18);color:#eaf2fb;border-radius:14px;padding:14px;font-size:.95rem;line-height:1.5;resize:vertical;font-family:inherit}
        .txan textarea:focus{outline:none;border-color:#5b9dff}
        .txan-cards{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin:16px 0}
        .txan-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px 10px;text-align:center}
        .txan-card .n{font-size:1.4rem;font-weight:800;color:#ffae3b}
        .txan-card .l{font-size:.74rem;color:#9fb6cf;margin-top:3px}
        .txan-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
        .txan-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:14px}
        .txan-pane h2{font-size:1.02rem;margin:0 0 12px}
        .txan-idx{display:flex;justify-content:space-between;align-items:baseline;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08)}
        .txan-idx:last-child{border-bottom:none}
        .txan-idx .v{font-weight:800;color:#5b9dff;font-size:1.1rem}
        .txan-idx small{color:#9fb6cf;display:block;font-size:.76rem}
        .txan-kw{margin-bottom:9px}
        .txan-kw .top{display:flex;justify-content:space-between;font-size:.86rem;margin-bottom:3px}
        .txan-kw .top b{color:#eaf2fb}
        .txan-kw .top span{color:#9fb6cf}
        .txan-meter{height:8px;background:rgba(255,255,255,.08);border-radius:5px;overflow:hidden}
        .txan-meter i{display:block;height:100%;background:linear-gradient(90deg,#ff7a18,#ffae3b);border-radius:5px}
        .txan-empty{color:#9fb6cf;font-size:.88rem;text-align:center;padding:18px 4px}
        @media(max-width:760px){.txan-cards{grid-template-columns:repeat(3,1fr)}.txan-row{grid-template-columns:1fr}}
      `}</style>

      <h1>📊 Analyseur de texte</h1>
      <p className="sub">Statistiques, lisibilité (Flesch-Kincaid & ARI) et mots-clés — en direct. 100 % local, rien n'est envoyé sur Internet.</p>

      <textarea placeholder="Colle ou écris ton texte ici… L'analyse se met à jour automatiquement."
                value={text} onChange={(e) => setText(e.target.value)} />

      <div className="txan-cards">
        {CARDS.map((c) => (
          <div key={c.l} className="txan-card"><div className="n">{c.v}</div><div className="l">{c.l}</div></div>
        ))}
      </div>

      <div className="txan-row">
        <div className="txan-pane">
          <h2>🎯 Lisibilité</h2>
          <div className="txan-idx">
            <div>Flesch-Kincaid<small>Plus haut = plus facile à lire</small></div>
            <div className="v">{stats.words ? `${stats.flesch.toFixed(0)} · ${fleschLabel(stats.flesch)}` : '—'}</div>
          </div>
          <div className="txan-idx">
            <div>Indice ARI<small>Niveau scolaire approximatif</small></div>
            <div className="v">{stats.words ? stats.ari.toFixed(1) : '—'}</div>
          </div>
          <div className="txan-idx">
            <div>Syllabes / Mots</div>
            <div className="v">{stats.syllables} / {stats.words}</div>
          </div>
        </div>

        <div className="txan-pane">
          <h2>🔑 Mots-clés fréquents</h2>
          {stats.top.length === 0 ? (
            <div className="txan-empty">Saisis du texte pour voir la densité des mots-clés.</div>
          ) : stats.top.map((k) => (
            <div key={k.k} className="txan-kw">
              <div className="top"><b>{k.k}</b><span>{k.c}× · {k.pct.toFixed(1)} %</span></div>
              <div className="txan-meter"><i style={{ width: `${(k.c / maxC) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

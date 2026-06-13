import React, { useState, useMemo } from 'react';

/**
 * RegexTester — testeur d'expressions régulières 100 % local. Surligne les
 * correspondances en direct, liste les groupes de capture, propose des motifs
 * préréglés et un aperçu de remplacement. Aucun réseau.
 */

const PRESETS = [
  { label: 'Courriel', pat: '[\\w.+-]+@[\\w-]+\\.[\\w.-]+', flags: 'g' },
  { label: 'URL', pat: 'https?:\\/\\/[^\\s]+', flags: 'g' },
  { label: 'Téléphone FR', pat: '0[1-9]([ .-]?\\d{2}){4}', flags: 'g' },
  { label: 'Date JJ/MM/AAAA', pat: '(\\d{2})\\/(\\d{2})\\/(\\d{4})', flags: 'g' },
  { label: 'Mot entier', pat: '\\b\\w+\\b', flags: 'g' },
  { label: 'Code hexa', pat: '#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\\b', flags: 'g' },
];

const SAMPLE = `Contactez jane.doe@example.com ou support@ff.io.
Visitez https://freeforge.app aujourd'hui.
Tel : 06 12 34 56 78 — réunion le 14/07/2026. Couleur #ff7a18.`;

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default function RegexTester({ goBack }) {
  const [pattern, setPattern] = useState('[\\w.+-]+@[\\w-]+\\.[\\w.-]+');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState(SAMPLE);
  const [replacement, setReplacement] = useState('[$&]');

  const toggleFlag = (f) => setFlags((cur) => (cur.includes(f) ? cur.replace(f, '') : cur + f));

  const result = useMemo(() => {
    if (!pattern) return { error: null, matches: [], highlighted: escapeHtml(text), replaced: text };
    let re;
    try {
      const fl = flags.includes('g') ? flags : flags + 'g';
      re = new RegExp(pattern, fl);
    } catch (e) {
      return { error: e.message, matches: [], highlighted: escapeHtml(text), replaced: '' };
    }
    const matches = [];
    let html = '';
    let last = 0;
    let m;
    let guard = 0;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null && guard < 5000) {
      guard++;
      const start = m.index;
      const end = start + m[0].length;
      html += escapeHtml(text.slice(last, start));
      html += `<mark class="rx-hl">${escapeHtml(m[0]) || '∅'}</mark>`;
      last = end;
      matches.push({ value: m[0], index: start, groups: m.slice(1), named: m.groups || null });
      if (m[0] === '') re.lastIndex++; // évite boucle infinie sur match vide
    }
    html += escapeHtml(text.slice(last));
    let replaced = '';
    try { replaced = text.replace(new RegExp(pattern, flags.includes('g') ? flags : flags + 'g'), replacement); }
    catch (e) { replaced = '(erreur de remplacement)'; }
    return { error: null, matches, highlighted: html, replaced };
  }, [pattern, flags, text, replacement]);

  return (
    <div className="rx-wrap">
      <style>{`
        .rx-wrap{color:#eaf2fb;max-width:960px;margin:0 auto}
        .rx-wrap h1{font-size:1.6rem;margin:0 0 4px}
        .rx-sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .rx-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:16px}
        .rx-line{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .rx-slash{font-family:ui-monospace,monospace;font-size:1.3rem;color:#5b9dff}
        .rx-pat{flex:1;min-width:220px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.95rem;padding:10px 12px;border-radius:9px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.97);color:#10243a}
        .rx-flags{display:flex;gap:6px}
        .rx-flag{width:34px;height:34px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#cfe2ff;font-family:monospace;font-size:1rem;cursor:pointer}
        .rx-flag.on{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;font-weight:700}
        .rx-presets{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
        .rx-chip{background:rgba(91,157,255,.18);border:1px solid rgba(91,157,255,.45);color:#cfe2ff;border-radius:999px;padding:6px 12px;font-size:.8rem;cursor:pointer}
        .rx-chip:hover{background:rgba(91,157,255,.32)}
        .rx-ta{width:100%;box-sizing:border-box;font-family:ui-monospace,monospace;font-size:.88rem;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.97);color:#10243a;padding:11px;resize:vertical;min-height:110px}
        .rx-out{background:#0a2540;border:1px solid rgba(91,157,255,.35);border-radius:10px;padding:12px;font-family:ui-monospace,monospace;font-size:.86rem;white-space:pre-wrap;word-break:break-word;color:#dcebff;line-height:1.6}
        .rx-hl{background:#ffae3b;color:#1b1300;border-radius:4px;padding:0 2px;font-weight:700}
        .rx-err{color:#ff9d9d;font-size:.9rem;background:rgba(255,90,90,.12);border:1px solid rgba(255,90,90,.4);border-radius:9px;padding:10px 12px}
        .rx-count{font-size:.85rem;color:#7ef0a8;margin-bottom:8px}
        .rx-mlist{list-style:none;padding:0;margin:0;max-height:240px;overflow:auto}
        .rx-mlist li{background:rgba(255,255,255,.04);border-radius:9px;padding:8px 11px;margin-bottom:6px;font-size:.84rem;font-family:ui-monospace,monospace}
        .rx-mlist .g{color:#9fb6cf;display:block;margin-top:2px}
        .rx-mlist .g b{color:#ffae3b}
        label.rx-lbl{display:block;font-size:.8rem;color:#9fb6cf;font-weight:600;margin-bottom:5px}
        @media(max-width:760px){.rx-pat{min-width:140px}}
      `}</style>

      <h1>🔎 Testeur de Regex</h1>
      <p className="rx-sub">Teste tes expressions régulières en direct : correspondances surlignées, groupes de capture et remplacement. 100 % local.</p>

      <div className="rx-pane">
        <div className="rx-line">
          <span className="rx-slash">/</span>
          <input className="rx-pat" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="motif…" spellCheck={false} />
          <span className="rx-slash">/</span>
          <div className="rx-flags">
            {['g', 'i', 'm', 's', 'u'].map((f) => (
              <button key={f} className={`rx-flag ${flags.includes(f) ? 'on' : ''}`} onClick={() => toggleFlag(f)} title={`drapeau ${f}`}>{f}</button>
            ))}
          </div>
        </div>
        <div className="rx-presets">
          {PRESETS.map((p) => (
            <button key={p.label} className="rx-chip" onClick={() => { setPattern(p.pat); setFlags(p.flags); }}>{p.label}</button>
          ))}
        </div>
      </div>

      <div className="rx-pane">
        <label className="rx-lbl">Texte de test</label>
        <textarea className="rx-ta" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
      </div>

      {result.error ? (
        <div className="rx-pane"><div className="rx-err">⚠ Regex invalide : {result.error}</div></div>
      ) : (
        <>
          <div className="rx-pane">
            <label className="rx-lbl">Aperçu surligné</label>
            <div className="rx-out" dangerouslySetInnerHTML={{ __html: result.highlighted }} />
          </div>

          <div className="rx-pane">
            <div className="rx-count">{result.matches.length} correspondance(s) trouvée(s)</div>
            <ul className="rx-mlist">
              {result.matches.length === 0 ? (
                <li style={{ fontStyle: 'italic', color: '#9fb6cf' }}>Aucune correspondance.</li>
              ) : result.matches.map((m, i) => (
                <li key={i}>
                  #{i + 1} (pos {m.index}) : <b style={{ color: '#7ef0a8' }}>{m.value || '∅ (vide)'}</b>
                  {m.groups.map((g, gi) => (
                    <span key={gi} className="g"><b>groupe {gi + 1}</b> : {g === undefined ? '∅' : g}</span>
                  ))}
                  {m.named && Object.entries(m.named).map(([k, v]) => (
                    <span key={k} className="g"><b>?&lt;{k}&gt;</b> : {v === undefined ? '∅' : v}</span>
                  ))}
                </li>
              ))}
            </ul>
          </div>

          <div className="rx-pane">
            <label className="rx-lbl">Remplacer par (utilise $1, $&amp;, etc.)</label>
            <input className="rx-pat" style={{ width: '100%', boxSizing: 'border-box', marginBottom: 10 }} value={replacement} onChange={(e) => setReplacement(e.target.value)} spellCheck={false} />
            <div className="rx-out">{result.replaced}</div>
          </div>
        </>
      )}
    </div>
  );
}

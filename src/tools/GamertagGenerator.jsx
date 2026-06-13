import React, { useState, useMemo, useCallback } from 'react';

/**
 * GamertagGenerator — générateur de pseudos stylisés, 100 % local.
 * À partir d'un mot de base : polices Unicode (fullwidth, cursives, bold),
 * leetspeak, décorations symboles, préfixes/suffixes gaming. Copier / régénérer.
 */

const A = 'abcdefghijklmnopqrstuvwxyz';
const mapFrom = (base) => (str) => {
  const out = {};
  for (let i = 0; i < A.length; i++) out[A[i]] = str[i];
  return [...String(base).toLowerCase()].map((ch) => out[ch] || ch).join('');
};
const FULLWIDTH = 'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ';
const CURSIVE = '𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃';
const BOLD = '𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇';
const GOTHIC = '𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷';

const LEET = { a: '4', e: '3', i: '1', o: '0', s: '5', t: '7', b: '8', g: '9', l: '1' };
const leet = (s) => [...String(s).toLowerCase()].map((c) => LEET[c] || c).join('');

const PREFIX = ['xX', 'iTz', 'TTV_', 'Lord', 'Dark', 'Pro', 'Mr', 'Toxic', 'Ghost', 'Lil', 'Doom', 'Sn1p'];
const SUFFIX = ['Xx', 'YT', 'TV', 'GG', '_TTV', 'OP', 'God', '99', '420', 'HD', 'Pog', 'zZ'];
const DECOR = ['꧁', '꧂', '☆', '★', '彡', '✿', '〆', '✗', '亗', '⚡', '☬', '♛'];
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default function GamertagGenerator({ goBack }) {
  const [base, setBase] = useState('shadow');
  const [seed, setSeed] = useState(0);
  const [copied, setCopied] = useState(-1);

  const variants = useMemo(() => {
    const b = (base || 'player').replace(/\s+/g, '');
    const cap = b.charAt(0).toUpperCase() + b.slice(1);
    void seed; // force la régénération des choix aléatoires
    return [
      { tag: 'Fullwidth', val: mapFrom(b)(FULLWIDTH) },
      { tag: 'Cursive', val: mapFrom(b)(CURSIVE) },
      { tag: 'Gras', val: mapFrom(b)(BOLD) },
      { tag: 'Gothique', val: mapFrom(b)(GOTHIC) },
      { tag: 'Leetspeak', val: leet(b) },
      { tag: 'Préfixe', val: `${rand(PREFIX)}${cap}` },
      { tag: 'Suffixe', val: `${cap}${rand(SUFFIX)}` },
      { tag: 'Préf+Suf', val: `${rand(PREFIX)}${cap}${rand(SUFFIX)}` },
      { tag: 'Décoré', val: `${rand(DECOR)}${cap}${rand(DECOR)}` },
      { tag: 'Séparateurs', val: `${rand(DECOR)}彡${cap}彡${rand(DECOR)}` },
      { tag: 'Leet décoré', val: `${rand(DECOR)}${leet(b)}${rand(DECOR)}` },
      { tag: 'Tryhard', val: `xX_${leet(cap)}_Xx` },
    ];
  }, [base, seed]);

  const copy = useCallback((val, i) => {
    const done = () => { setCopied(i); setTimeout(() => setCopied(-1), 1200); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(val).then(done).catch(() => fallback(val, done));
    } else { fallback(val, done); }
  }, []);

  const fallback = (val, done) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = val; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta); done();
    } catch (e) { /* ignore */ }
  };

  return (
    <div className="gt">
      <style>{`
        .gt{color:#eaf2fb;max-width:840px;margin:0 auto}
        .gt h1{font-size:1.5rem;margin:0 0 4px}
        .gt .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .gt-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:16px}
        .gt-bar{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end}
        .gt-bar label{display:block;font-size:.8rem;color:#bcd0e8;margin-bottom:5px}
        .gt-bar input{border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.25);color:#eaf2fb;padding:11px;font-size:1rem;min-width:200px}
        .gt-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:11px 16px;font-weight:700;cursor:pointer;font-size:.92rem;white-space:nowrap}
        .gt-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .gt-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .gt-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:10px}
        .gt-card:hover{border-color:rgba(91,157,255,.5)}
        .gt-card .info{flex:1;min-width:0}
        .gt-card .tg{font-size:.72rem;color:#9fb6cf;text-transform:uppercase;letter-spacing:.04em}
        .gt-card .vl{font-size:1.15rem;color:#eaf2fb;word-break:break-word;line-height:1.3}
        .gt-copy{background:rgba(91,157,255,.2);border:1px solid rgba(91,157,255,.45);color:#eaf2fb;border-radius:9px;padding:8px 12px;cursor:pointer;font-size:.82rem;white-space:nowrap}
        .gt-copy:hover{background:rgba(91,157,255,.4)}
        .gt-copy.ok{background:rgba(127,231,168,.25);border-color:rgba(127,231,168,.6);color:#bdf5d4}
        @media(max-width:760px){.gt-grid{grid-template-columns:1fr}.gt-bar input{min-width:0;flex:1}}
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        {goBack && <button className="gt-btn ghost" onClick={goBack}>← Retour</button>}
        <h1>🎮 Générateur de pseudos</h1>
      </div>
      <p className="sub">Transforme un mot en pseudos stylés (polices Unicode, leet, décorations). 100 % local.</p>

      <div className="gt-pane">
        <div className="gt-bar">
          <div style={{ flex: 1 }}>
            <label>Mot de base</label>
            <input value={base} onChange={(e) => setBase(e.target.value)} placeholder="ex. shadow" maxLength={20} style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
          <button className="gt-btn" onClick={() => setSeed((s) => s + 1)}>🔄 Régénérer</button>
        </div>
      </div>

      <div className="gt-grid">
        {variants.map((v, i) => (
          <div key={v.tag} className="gt-card">
            <div className="info">
              <div className="tg">{v.tag}</div>
              <div className="vl">{v.val}</div>
            </div>
            <button className={`gt-copy ${copied === i ? 'ok' : ''}`} onClick={() => copy(v.val, i)}>
              {copied === i ? '✓ Copié' : '⧉ Copier'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

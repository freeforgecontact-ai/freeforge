import React, { useState, useRef } from 'react';

/**
 * EncoderUniversel — encodeur/décodeur 100 % local. Onglets Base64, URL,
 * Entités HTML (encode + décode dans les deux sens) et un onglet Fichier qui
 * convertit un fichier importé en Base64 / data URL. Aucun réseau.
 */

// Base64 sûr pour l'UTF-8
const utf8ToB64 = (s) => btoa(unescape(encodeURIComponent(s)));
const b64ToUtf8 = (s) => decodeURIComponent(escape(atob(s)));

const HTML_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const htmlEncode = (s) => s.replace(/[&<>"']/g, (c) => HTML_MAP[c]);
const htmlDecode = (s) => {
  const el = typeof document !== 'undefined' ? document.createElement('textarea') : null;
  if (!el) return s;
  el.innerHTML = s;
  return el.value;
};

const TABS = [
  { id: 'base64', label: 'Base64' },
  { id: 'url', label: 'URL' },
  { id: 'html', label: 'Entités HTML' },
  { id: 'file', label: 'Fichier' },
];

export default function EncoderUniversel({ goBack }) {
  const [tab, setTab] = useState('base64');
  const [input, setInput] = useState('Bonjour FreeForge ! 100 % local 🔒');
  const [output, setOutput] = useState('');
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const fileRef = useRef(null);

  const run = (mode) => {
    setErr(''); setCopied(false);
    try {
      let out = '';
      if (tab === 'base64') out = mode === 'encode' ? utf8ToB64(input) : b64ToUtf8(input.trim());
      else if (tab === 'url') out = mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input);
      else if (tab === 'html') out = mode === 'encode' ? htmlEncode(input) : htmlDecode(input);
      setOutput(out);
    } catch (e) {
      setOutput(''); setErr('Opération impossible : ' + e.message);
    }
  };

  const onFile = (file) => {
    if (!file) return;
    setErr(''); setCopied(false);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      setFileInfo({ name: file.name, size: file.size, type: file.type || 'inconnu', dataUrl, b64 });
      setOutput(dataUrl);
    };
    reader.onerror = () => setErr('Lecture du fichier impossible.');
    reader.readAsDataURL(file);
  };

  const copy = () => {
    try { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch (e) { /* ignore */ }
  };
  const download = () => {
    try {
      const blob = new Blob([output], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = (tab === 'file' && fileInfo ? fileInfo.name + '.b64.txt' : 'resultat-' + tab + '.txt');
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) { setErr('Téléchargement impossible.'); }
  };

  return (
    <div className="enc-wrap">
      <style>{`
        .enc-wrap{color:#eaf2fb;max-width:920px;margin:0 auto}
        .enc-wrap h1{font-size:1.6rem;margin:0 0 4px}
        .enc-sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .enc-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
        .enc-tab{padding:9px 16px;border-radius:10px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);color:#cfe2ff;cursor:pointer;font-size:.9rem;font-weight:600}
        .enc-tab.on{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none}
        .enc-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:16px}
        .enc-lbl{display:block;font-size:.8rem;color:#9fb6cf;font-weight:600;margin-bottom:5px}
        .enc-ta{width:100%;box-sizing:border-box;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.88rem;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.97);color:#10243a;padding:11px;resize:vertical;min-height:100px}
        .enc-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
        .enc-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:11px 16px;font-weight:700;cursor:pointer;font-size:.9rem}
        .enc-btn.ghost{background:rgba(91,157,255,.2);color:#cfe2ff;border:1px solid rgba(91,157,255,.45)}
        .enc-out{background:#0a2540;border:1px solid rgba(91,157,255,.35);border-radius:10px;padding:12px;font-family:ui-monospace,monospace;font-size:.85rem;white-space:pre-wrap;word-break:break-all;color:#dcebff;min-height:60px;max-height:280px;overflow:auto;margin:0}
        .enc-err{color:#ff9d9d;font-size:.9rem;background:rgba(255,90,90,.12);border:1px solid rgba(255,90,90,.4);border-radius:9px;padding:10px 12px;margin-top:10px}
        .enc-drop{border:2px dashed rgba(91,157,255,.45);border-radius:12px;padding:26px;text-align:center;color:#9fb6cf;cursor:pointer;font-size:.92rem}
        .enc-drop:hover{background:rgba(91,157,255,.08)}
        .enc-meta{font-size:.82rem;color:#cfe2ff;margin:10px 0}
        .enc-meta b{color:#ffae3b}
        .enc-thumb{max-width:160px;max-height:120px;border-radius:8px;margin-top:8px;border:1px solid rgba(255,255,255,.2)}
        @media(max-width:760px){.enc-tabs{gap:6px}.enc-tab{padding:8px 12px;font-size:.82rem}}
      `}</style>

      <h1>🔠 Encodeur universel</h1>
      <p className="enc-sub">Base64, URL, entités HTML et conversion de fichiers en data URL — encode et décode, totalement hors-ligne.</p>

      <div className="enc-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`enc-tab ${tab === t.id ? 'on' : ''}`} onClick={() => { setTab(t.id); setOutput(''); setErr(''); setFileInfo(null); }}>{t.label}</button>
        ))}
      </div>

      {tab !== 'file' ? (
        <>
          <div className="enc-pane">
            <label className="enc-lbl">Texte d'entrée</label>
            <textarea className="enc-ta" value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
            <div className="enc-row">
              <button className="enc-btn" onClick={() => run('encode')}>▶ Encoder</button>
              <button className="enc-btn ghost" onClick={() => run('decode')}>◀ Décoder</button>
              <button className="enc-btn ghost" onClick={() => { setInput(output); setOutput(''); }} disabled={!output}>⇅ Résultat → entrée</button>
            </div>
            {err && <div className="enc-err">⚠ {err}</div>}
          </div>

          <div className="enc-pane">
            <label className="enc-lbl">Résultat</label>
            <pre className="enc-out">{output || '—'}</pre>
            <div className="enc-row">
              <button className="enc-btn" onClick={copy} disabled={!output}>{copied ? '✓ Copié' : '📋 Copier'}</button>
              <button className="enc-btn ghost" onClick={download} disabled={!output}>⬇ Télécharger</button>
            </div>
          </div>
        </>
      ) : (
        <div className="enc-pane">
          <div className="enc-drop" onClick={() => fileRef.current?.click()}>
            📁 Clique pour importer un fichier — il sera encodé en Base64 / data URL localement.
          </div>
          <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
          {err && <div className="enc-err">⚠ {err}</div>}
          {fileInfo && (
            <>
              <div className="enc-meta">
                <b>{fileInfo.name}</b> — {(fileInfo.size / 1024).toFixed(1)} Ko — type : {fileInfo.type}
              </div>
              {fileInfo.type.startsWith('image/') && <img className="enc-thumb" src={fileInfo.dataUrl} alt="aperçu" />}
              <label className="enc-lbl" style={{ marginTop: 10 }}>Data URL complète</label>
              <pre className="enc-out">{fileInfo.dataUrl}</pre>
              <div className="enc-row">
                <button className="enc-btn ghost" onClick={() => { setOutput(fileInfo.b64); }}>Afficher Base64 brut</button>
                <button className="enc-btn" onClick={copy} disabled={!output}>{copied ? '✓ Copié' : '📋 Copier le résultat'}</button>
                <button className="enc-btn ghost" onClick={download} disabled={!output}>⬇ Télécharger</button>
              </div>
              {output && output !== fileInfo.dataUrl && (
                <><label className="enc-lbl" style={{ marginTop: 10 }}>Base64 brut</label><pre className="enc-out">{output}</pre></>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

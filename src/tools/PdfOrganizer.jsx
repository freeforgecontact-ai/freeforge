import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';

/**
 * PdfOrganizer — organiseur de PDF 100 % local & hors-ligne (pdf-lib).
 * Importe un ou plusieurs PDF, fusionne, extrait/supprime des pages (par plage),
 * réordonne, puis génère et télécharge le résultat. Tout reste en mémoire :
 * aucun fichier n'est envoyé sur Internet, aucun serveur n'est contacté.
 */

// Analyse une plage type « 1-3,5 » -> indices 0-based filtrés sur [0,total[
const parseRange = (txt, total) => {
  const set = new Set();
  String(txt || '').split(',').forEach((part) => {
    const p = part.trim();
    if (!p) return;
    const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      let a = parseInt(m[1], 10), b = parseInt(m[2], 10);
      if (a > b) [a, b] = [b, a];
      for (let i = a; i <= b; i++) if (i >= 1 && i <= total) set.add(i - 1);
    } else if (/^\d+$/.test(p)) {
      const n = parseInt(p, 10);
      if (n >= 1 && n <= total) set.add(n - 1);
    }
  });
  return [...set].sort((x, y) => x - y);
};

export default function PdfOrganizer() {
  const [docs, setDocs] = useState([]); // {id,name,pageCount,buffer}
  const [range, setRange] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // {t:'ok'|'err', s}
  const fileRef = useRef(null);

  const note = (t, s) => setMsg({ t, s });

  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => /\.pdf$/i.test(f.name) || f.type === 'application/pdf');
    if (!files.length) return;
    setBusy(true); setMsg(null);
    const added = [];
    for (const f of files) {
      try {
        const buffer = await f.arrayBuffer();
        const pdf = await PDFDocument.load(buffer, { ignoreEncryption: false });
        added.push({ id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, name: f.name, pageCount: pdf.getPageCount(), buffer });
      } catch (e) {
        note('err', `« ${f.name} » illisible (PDF chiffré/protégé ou corrompu).`);
      }
    }
    if (added.length) setDocs((prev) => [...prev, ...added]);
    setBusy(false);
  };

  const remove = (id) => setDocs((d) => d.filter((x) => x.id !== id));
  const move = (i, dir) => setDocs((d) => {
    const j = i + dir;
    if (j < 0 || j >= d.length) return d;
    const c = [...d]; [c[i], c[j]] = [c[j], c[i]]; return c;
  });

  const download = (bytes, name) => {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const merge = async () => {
    if (docs.length < 1) return;
    setBusy(true); setMsg(null);
    try {
      const out = await PDFDocument.create();
      for (const d of docs) {
        const src = await PDFDocument.load(d.buffer);
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      download(await out.save(), docs.length > 1 ? 'fusion.pdf' : 'reordonne.pdf');
      note('ok', `${docs.length} document(s) combiné(s) — ${out.getPageCount()} page(s).`);
    } catch (e) { note('err', 'Échec de la fusion : ' + (e.message || 'erreur inconnue.')); }
    setBusy(false);
  };

  // keep=true : ne garde QUE la plage (extraction) ; sinon supprime la plage
  const applyRange = async (keep) => {
    if (!docs.length) return;
    const d = docs[0];
    const sel = parseRange(range, d.pageCount);
    if (!sel.length) { note('err', 'Plage invalide. Exemple : 1-3,5'); return; }
    setBusy(true); setMsg(null);
    try {
      const src = await PDFDocument.load(d.buffer);
      const indices = keep ? sel : src.getPageIndices().filter((i) => !sel.includes(i));
      if (!indices.length) { note('err', 'Aucune page restante avec ces réglages.'); setBusy(false); return; }
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, indices);
      pages.forEach((p) => out.addPage(p));
      download(await out.save(), keep ? 'extrait.pdf' : 'pages-supprimees.pdf');
      note('ok', `${out.getPageCount()} page(s) dans le résultat (sur « ${d.name} »).`);
    } catch (e) { note('err', 'Échec : ' + (e.message || 'erreur inconnue.')); }
    setBusy(false);
  };

  return (
    <div className="pforg">
      <style>{`
        .pforg{color:#eaf2fb;max-width:860px;margin:0 auto}
        .pforg h1{font-size:1.55rem;margin:0 0 4px}
        .pforg .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .pforg-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:16px}
        .pforg-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 15px;font-weight:700;cursor:pointer;font-size:.9rem}
        .pforg-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .pforg-btn:disabled{opacity:.45;cursor:not-allowed}
        .pforg-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
        .pforg-doc{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.04);margin-bottom:8px}
        .pforg-doc .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.92rem}
        .pforg-doc small{color:#9fb6cf;white-space:nowrap}
        .pforg-mini{background:rgba(91,157,255,.18);border:1px solid rgba(91,157,255,.4);color:#cfe1ff;border-radius:8px;cursor:pointer;padding:4px 9px;font-size:.85rem}
        .pforg-mini:hover{background:rgba(91,157,255,.32)}
        .pforg-x{opacity:.55;cursor:pointer;font-size:.9rem}
        .pforg-x:hover{opacity:1;color:#ff8a8a}
        .pforg input[type=text]{background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.18);color:#eaf2fb;border-radius:10px;padding:9px 11px;font-size:.9rem}
        .pforg-empty{text-align:center;color:#9fb6cf;padding:26px 10px;font-size:.92rem}
        .pforg-msg{border-radius:10px;padding:10px 13px;font-size:.88rem;margin-bottom:14px}
        .pforg-msg.ok{background:rgba(60,180,120,.18);border:1px solid rgba(60,180,120,.5);color:#bdf2d6}
        .pforg-msg.err{background:rgba(220,70,70,.16);border:1px solid rgba(220,70,70,.5);color:#ffc9c9}
        .pforg h2{font-size:1.05rem;margin:0 0 10px}
        .pforg .hint{color:#9fb6cf;font-size:.82rem;margin:8px 0 0}
        @media(max-width:760px){.pforg-row{gap:8px}.pforg input[type=text]{flex:1;min-width:120px}}
      `}</style>

      <h1>📄 Organiseur de PDF</h1>
      <p className="sub">Fusionner, extraire, supprimer et réordonner des pages — 100 % local & hors-ligne. Rien n'est envoyé sur Internet.</p>

      {msg && <div className={`pforg-msg ${msg.t}`}>{msg.s}</div>}

      <div className="pforg-card">
        <div className="pforg-row">
          <button className="pforg-btn" disabled={busy} onClick={() => fileRef.current?.click()}>＋ Importer des PDF</button>
          <button className="pforg-btn ghost" disabled={busy || !docs.length} onClick={merge}>
            {docs.length > 1 ? '🔗 Fusionner dans l\'ordre' : '💾 Exporter (ordre actuel)'}
          </button>
          <input ref={fileRef} type="file" accept="application/pdf,.pdf" multiple style={{ display: 'none' }}
                 onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
        </div>
        <p className="hint">Réordonne avec ▲▼. La fusion respecte l'ordre de la liste.</p>
      </div>

      <div className="pforg-card">
        <h2>Documents ({docs.length})</h2>
        {docs.length === 0 ? (
          <div className="pforg-empty">Aucun PDF importé. Clique « Importer des PDF » pour commencer.</div>
        ) : docs.map((d, i) => (
          <div key={d.id} className="pforg-doc">
            <span className="nm" title={d.name}>{i + 1}. {d.name}</span>
            <small>{d.pageCount} p.</small>
            <button className="pforg-mini" disabled={i === 0} onClick={() => move(i, -1)} title="Monter">▲</button>
            <button className="pforg-mini" disabled={i === docs.length - 1} onClick={() => move(i, 1)} title="Descendre">▼</button>
            <span className="pforg-x" onClick={() => remove(d.id)} title="Retirer">✕</span>
          </div>
        ))}
      </div>

      <div className="pforg-card">
        <h2>Extraire / supprimer des pages</h2>
        <p className="hint" style={{ marginTop: 0, marginBottom: 12 }}>
          {docs.length ? `S'applique au 1ᵉʳ document : « ${docs[0].name} » (${docs[0].pageCount} pages).` : 'Importe d\'abord un PDF.'}
        </p>
        <div className="pforg-row">
          <input type="text" placeholder="Plage de pages, ex : 1-3,5" value={range}
                 onChange={(e) => setRange(e.target.value)} />
          <button className="pforg-btn" disabled={busy || !docs.length} onClick={() => applyRange(true)}>⬇ Extraire ces pages</button>
          <button className="pforg-btn ghost" disabled={busy || !docs.length} onClick={() => applyRange(false)}>🗑 Supprimer ces pages</button>
        </div>
      </div>
    </div>
  );
}

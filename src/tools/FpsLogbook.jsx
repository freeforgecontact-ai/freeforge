import React, { useState, useEffect, useMemo } from 'react';

/**
 * FpsLogbook — journal de benchmarks FPS, 100 % local.
 * Saisis tes runs (jeu, GPU, CPU, résolution, réglages, FPS moyen, 1% low),
 * tri par colonne, persistance localStorage, suppression, export CSV (Blob).
 */

const LS_KEY = 'fps_logbook_v1';
const COLS = [
  { k: 'game', t: 'Jeu' },
  { k: 'gpu', t: 'GPU' },
  { k: 'cpu', t: 'CPU' },
  { k: 'res', t: 'Résolution' },
  { k: 'settings', t: 'Réglages' },
  { k: 'avg', t: 'FPS moy.', num: true },
  { k: 'low', t: '1% low', num: true },
];

const blank = { game: '', gpu: '', cpu: '', res: '1920×1080', settings: 'Élevé', avg: '', low: '' };

export default function FpsLogbook({ goBack }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blank);
  const [sort, setSort] = useState({ k: 'avg', dir: 'desc' });

  useEffect(() => {
    try { const raw = localStorage.getItem(LS_KEY); if (raw) setRows(JSON.parse(raw)); }
    catch (e) { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(rows)); } catch (e) { /* ignore */ }
  }, [rows]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const add = (e) => {
    e.preventDefault();
    if (!form.game.trim() || form.avg === '') return;
    setRows((r) => [...r, {
      ...form,
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      avg: Number(form.avg) || 0,
      low: Number(form.low) || 0,
    }]);
    setForm(blank);
  };

  const del = (id) => setRows((r) => r.filter((x) => x.id !== id));

  const toggleSort = (k) => setSort((s) => (s.k === k ? { k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { k, dir: 'asc' }));

  const sorted = useMemo(() => {
    const col = COLS.find((c) => c.k === sort.k);
    const arr = [...rows].sort((a, b) => {
      let av = a[sort.k], bv = b[sort.k];
      if (col && col.num) { av = Number(av) || 0; bv = Number(bv) || 0; return av - bv; }
      return String(av).localeCompare(String(bv), 'fr', { sensitivity: 'base' });
    });
    return sort.dir === 'desc' ? arr.reverse() : arr;
  }, [rows, sort]);

  const exportCSV = () => {
    const head = COLS.map((c) => c.t).join(';');
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const body = sorted.map((r) => COLS.map((c) => esc(r[c.k])).join(';')).join('\n');
    const blob = new Blob(['﻿' + head + '\n' + body], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'benchmarks_fps.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  return (
    <div className="fl">
      <style>{`
        .fl{color:#eaf2fb;max-width:1100px;margin:0 auto}
        .fl h1{font-size:1.5rem;margin:0 0 4px}
        .fl .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 16px}
        .fl-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:16px}
        .fl-form{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        .fl-row label{display:block;font-size:.78rem;color:#bcd0e8;margin-bottom:5px}
        .fl input,.fl select{width:100%;border-radius:9px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.25);color:#eaf2fb;padding:9px;font-size:.9rem;box-sizing:border-box}
        .fl-actions{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}
        .fl-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:11px 16px;font-weight:700;cursor:pointer;font-size:.92rem}
        .fl-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .fl-tablewrap{overflow-x:auto}
        .fl table{width:100%;border-collapse:collapse;font-size:.88rem}
        .fl th,.fl td{padding:10px 12px;text-align:left;border-bottom:1px solid rgba(255,255,255,.1);white-space:nowrap}
        .fl th{cursor:pointer;color:#bcd0e8;user-select:none;font-weight:600}
        .fl th:hover{color:#ffae3b}
        .fl th .ar{color:#ffae3b;margin-left:4px}
        .fl td.num{color:#7fe7a8;font-weight:700;text-align:right}
        .fl tr:hover td{background:rgba(255,255,255,.04)}
        .fl-del{background:none;border:none;color:#ff8a8a;cursor:pointer;font-size:1rem;opacity:.7}
        .fl-del:hover{opacity:1}
        .fl-empty{text-align:center;color:#9fb6cf;padding:30px 10px}
        @media(max-width:760px){.fl-form{grid-template-columns:1fr 1fr}}
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        {goBack && <button className="fl-btn ghost" onClick={goBack}>← Retour</button>}
        <h1>📊 Journal de benchmarks FPS</h1>
      </div>
      <p className="sub">Garde une trace de tes performances par jeu et configuration. Enregistré localement dans ton navigateur.</p>

      <form className="fl-pane fl-form" onSubmit={add}>
        <div className="fl-row"><label>Jeu *</label><input value={form.game} onChange={(e) => set('game', e.target.value)} placeholder="Cyberpunk 2077" required /></div>
        <div className="fl-row"><label>GPU</label><input value={form.gpu} onChange={(e) => set('gpu', e.target.value)} placeholder="RTX 4070" /></div>
        <div className="fl-row"><label>CPU</label><input value={form.cpu} onChange={(e) => set('cpu', e.target.value)} placeholder="Ryzen 5 7600" /></div>
        <div className="fl-row"><label>Résolution</label>
          <select value={form.res} onChange={(e) => set('res', e.target.value)}>
            <option>1280×720</option><option>1920×1080</option><option>2560×1440</option><option>3440×1440</option><option>3840×2160</option>
          </select>
        </div>
        <div className="fl-row"><label>Réglages</label>
          <select value={form.settings} onChange={(e) => set('settings', e.target.value)}>
            <option>Bas</option><option>Moyen</option><option>Élevé</option><option>Ultra</option><option>Optimisé</option>
          </select>
        </div>
        <div className="fl-row"><label>FPS moyen *</label><input type="number" min="0" value={form.avg} onChange={(e) => set('avg', e.target.value)} placeholder="120" required /></div>
        <div className="fl-row"><label>1% low</label><input type="number" min="0" value={form.low} onChange={(e) => set('low', e.target.value)} placeholder="85" /></div>
        <div className="fl-row" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="fl-btn" type="submit" style={{ width: '100%' }}>＋ Ajouter</button>
        </div>
      </form>

      <div className="fl-pane">
        <div className="fl-actions" style={{ marginTop: 0, marginBottom: 12, justifyContent: 'space-between' }}>
          <span style={{ color: '#9fb6cf', fontSize: '.85rem' }}>{rows.length} entrée(s)</span>
          <button className="fl-btn ghost" onClick={exportCSV} disabled={!rows.length}>⬇ Exporter CSV</button>
        </div>
        <div className="fl-tablewrap">
          {rows.length === 0 ? (
            <div className="fl-empty">Aucun benchmark enregistré. Remplis le formulaire ci-dessus.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  {COLS.map((c) => (
                    <th key={c.k} onClick={() => toggleSort(c.k)}>
                      {c.t}{sort.k === c.k && <span className="ar">{sort.dir === 'asc' ? '▲' : '▼'}</span>}
                    </th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.id}>
                    {COLS.map((c) => <td key={c.k} className={c.num ? 'num' : ''}>{r[c.k] === '' ? '—' : r[c.k]}</td>)}
                    <td><button className="fl-del" title="Supprimer" onClick={() => del(r.id)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

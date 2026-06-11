import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function DiffChecker({ goBack }) {
  const [textLeft, setTextLeft] = useState('');
  const [textRight, setTextRight] = useState('');
  const [diffResult, setDiffResult] = useState([]);
  const [hasCompared, setHasCompared] = useState(false);

  // Native LCS Diff Algorithm
  const computeDiff = () => {
    const lines1 = textLeft.split('\n');
    const lines2 = textRight.split('\n');
    
    // DP table initialization
    const dp = Array(lines1.length + 1).fill(null).map(() => Array(lines2.length + 1).fill(0));
    
    for (let i = 1; i <= lines1.length; i++) {
      for (let j = 1; j <= lines2.length; j++) {
        if (lines1[i - 1] === lines2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    
    let i = lines1.length;
    let j = lines2.length;
    const diff = [];
    
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
        diff.unshift({ type: 'normal', val: lines1[i - 1] });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        diff.unshift({ type: 'added', val: lines2[j - 1] });
        j--;
      } else {
        diff.unshift({ type: 'removed', val: lines1[i - 1] });
        i--;
      }
    }
    
    setDiffResult(diff);
    setHasCompared(true);
  };

  const handleFileUpload = (e, target) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (target === 'left') {
        setTextLeft(event.target.result);
      } else {
        setTextRight(event.target.result);
      }
    };
    reader.readAsText(file);
  };

  const clearAll = () => {
    setTextLeft('');
    setTextRight('');
    setDiffResult([]);
    setHasCompared(false);
  };

  const stats = {
    added: diffResult.filter(d => d.type === 'added').length,
    removed: diffResult.filter(d => d.type === 'removed').length,
    identical: diffResult.filter(d => d.type === 'normal').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 8 }}>
            ← Retour
          </button>
          <h1 className="page-title">Comparateur de Fichiers Visuel</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Comparez deux versions d'un texte ou deux fichiers en local pour analyser les modifications.</p>
        </div>
        <FolderButton toolId="diff_checker" toolName="Comparateur de Fichiers" />
      </div>

      <div className="grid-2">
        {/* Left Side Input */}
        <div className="card-premium" style={{ gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">Version Originale (A)</h2>
            <label className="btn-premium btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 8, cursor: 'pointer' }}>
              📁 Importer (.txt)
              <input type="file" accept=".txt,.js,.css,.json,.html" onChange={(e) => handleFileUpload(e, 'left')} style={{ display: 'none' }} />
            </label>
          </div>
          <textarea
            value={textLeft}
            onChange={(e) => setTextLeft(e.target.value)}
            placeholder="Collez ou importez le texte original ici..."
            className="input-premium"
            style={{ minHeight: 220, fontFamily: 'monospace', fontSize: '0.85rem' }}
          />
        </div>

        {/* Right Side Input */}
        <div className="card-premium" style={{ gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">Version Modifiée (B)</h2>
            <label className="btn-premium btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 8, cursor: 'pointer' }}>
              📁 Importer (.txt)
              <input type="file" accept=".txt,.js,.css,.json,.html" onChange={(e) => handleFileUpload(e, 'right')} style={{ display: 'none' }} />
            </label>
          </div>
          <textarea
            value={textRight}
            onChange={(e) => setTextRight(e.target.value)}
            placeholder="Collez ou importez le texte modifié ici..."
            className="input-premium"
            style={{ minHeight: 220, fontFamily: 'monospace', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }} className="no-print">
        <button onClick={clearAll} className="btn-premium btn-secondary" style={{ width: 140, justifyContent: 'center' }}>
          🗑️ Tout effacer
        </button>
        <button onClick={computeDiff} className="btn-premium btn-primary" style={{ width: 180, justifyContent: 'center' }}>
          🔍 Comparer
        </button>
      </div>

      {hasCompared && (
        <div className="card-premium" style={{ gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <h2 className="card-title">Résultats de la comparaison</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="status-badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                +{stats.added} ajouts
              </div>
              <div className="status-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                -{stats.removed} suppressions
              </div>
              <div className="status-badge status-badge-primary">
                {stats.identical} identiques
              </div>
            </div>
          </div>

          <div style={{ border: '1px solid var(--border-light)', borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }}>
            {diffResult.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                Aucune différence détectée. Les textes sont 100% identiques.
              </div>
            ) : (
              <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {diffResult.map((line, index) => {
                  let className = 'diff-line';
                  let prefix = '  ';
                  if (line.type === 'added') {
                    className += ' diff-added';
                    prefix = '+ ';
                  } else if (line.type === 'removed') {
                    className += ' diff-removed';
                    prefix = '- ';
                  }
                  
                  return (
                    <div key={index} className={className}>
                      {prefix}{line.val || ' '}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

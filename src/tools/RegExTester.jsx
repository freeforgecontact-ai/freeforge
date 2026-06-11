import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function RegExTester({ goBack }) {
  const [regexStr, setRegexStr] = useState('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
  const [flags, setFlags] = useState('g');
  const [sampleText, setSampleText] = useState('Bonjour! Écrivez-nous à support@pgrg.ca pour toute question. Autre contact: info.test@forge.com.');
  const [matches, setMatches] = useState([]);
  const [highlightedHtml, setHighlightedHtml] = useState('');
  const [error, setError] = useState('');

  const handleTestRegex = () => {
    if (!regexStr) {
      setMatches([]);
      setHighlightedHtml(sampleText);
      setError('');
      return;
    }

    try {
      setError('');
      const regex = new RegExp(regexStr, flags.includes('g') ? flags : flags + 'g'); // force global for list
      const matchesFound = [];
      let match;
      
      // Prevent infinite loop for matching empty expressions
      let count = 0;
      const localRegex = new RegExp(regexStr, flags);
      const isGlobal = flags.includes('g');

      if (isGlobal) {
        regex.lastIndex = 0;
        while ((match = regex.exec(sampleText)) !== null) {
          matchesFound.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1)
          });
          if (match[0].length === 0) regex.lastIndex++;
          if (count++ > 500) break; // safeguard
        }
      } else {
        const matchSingle = sampleText.match(localRegex);
        if (matchSingle) {
          matchesFound.push({
            text: matchSingle[0],
            index: matchSingle.index || 0,
            groups: matchSingle.slice(1)
          });
        }
      }

      setMatches(matchesFound);

      // Generate highlighted HTML display
      if (matchesFound.length > 0) {
        let lastIdx = 0;
        let htmlParts = [];
        const renderRegex = new RegExp(regexStr, 'g');
        let m;
        let c = 0;
        
        while ((m = renderRegex.exec(sampleText)) !== null) {
          const partBefore = sampleText.substring(lastIdx, m.index);
          htmlParts.push(escapeHtml(partBefore));
          htmlParts.push(`<mark style="background-color: rgba(59,130,246,0.3); border-bottom: 2px solid #3b82f6; color: white; padding: 2px 0;">${escapeHtml(m[0])}</mark>`);
          lastIdx = renderRegex.lastIndex;
          if (m[0].length === 0) renderRegex.lastIndex++;
          if (c++ > 500) break;
        }
        htmlParts.push(escapeHtml(sampleText.substring(lastIdx)));
        setHighlightedHtml(htmlParts.join(''));
      } else {
        setHighlightedHtml(escapeHtml(sampleText));
      }

    } catch (err) {
      setError(err.message);
      setMatches([]);
      setHighlightedHtml(escapeHtml(sampleText));
    }
  };

  const escapeHtml = (text) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  useEffect(() => {
    handleTestRegex();
  }, [regexStr, flags, sampleText]);

  const toggleFlag = (flag) => {
    setFlags(prev => prev.includes(flag) ? prev.replace(flag, '') : prev + flag);
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🔤 RegEx Tester & Highlighter
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Testez et concevez vos expressions régulières (RegEx) en direct avec surbrillance interactive des correspondances.
          </p>
        </div>
        <FolderButton toolId="regex" toolName="RegExTester" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Editor & Highlight Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-panel" style={{ padding: 20, borderRadius: 16 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12, color: 'white' }}>Expression régulières (RegEx)</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0,0,0,0.2)', padding: 6, borderRadius: 8, border: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 'bold', paddingLeft: 8 }}>/</span>
              <input 
                type="text"
                value={regexStr}
                onChange={(e) => setRegexStr(e.target.value)}
                placeholder="Entrez votre pattern regex (ex. [a-z]+)"
                className="input-premium"
                style={{ flex: 1, padding: 8, border: 'none', background: 'transparent', fontSize: '1rem', fontFamily: 'monospace' }}
              />
              <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>/</span>
              <div style={{ display: 'flex', gap: 4, paddingRight: 8 }}>
                {['g', 'i', 'm'].map(f => (
                  <button
                    key={f}
                    onClick={() => toggleFlag(f)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      backgroundColor: flags.includes(f) ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                      color: flags.includes(f) ? 'white' : 'var(--text-muted)'
                    }}
                    title={`Flag: ${f === 'g' ? 'Global' : f === 'i' ? 'Insensible casse' : 'Multiligne'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ color: '#fca5a5', fontSize: '0.8rem', marginTop: 8 }}>
                ⚠️ Pattern invalide : {error}
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: 20, borderRadius: 16 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12, color: 'white' }}>Texte échantillon</h2>
            <textarea
              value={sampleText}
              onChange={(e) => setSampleText(e.target.value)}
              className="input-premium"
              placeholder="Collez votre texte cible ici..."
              style={{ width: '100%', height: 120, padding: 12, borderRadius: 8, fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 16 }}
            />

            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12, color: 'white' }}>Résultats surbrillance</h2>
            <div 
              style={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                padding: 16,
                borderRadius: 8,
                border: '1px solid var(--border-light)',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                minHeight: 100,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}
              dangerouslySetInnerHTML={{ __html: highlightedHtml || sampleText }}
            />
          </div>
        </div>

        {/* Sidebar: Matches List */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 16 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12, color: 'white' }}>
            Correspondances ({matches.length})
          </h2>

          {matches.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxRank: '450px', overflowY: 'auto' }}>
              {matches.map((m, idx) => (
                <div key={idx} style={{ padding: 10, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid var(--border-light)', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>Match #{idx + 1}</span>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>index: {m.index}</span>
                  </div>
                  <div style={{ fontFamily: 'monospace', color: 'white', backgroundColor: 'rgba(0,0,0,0.2)', padding: 6, borderRadius: 4, wordBreak: 'break-all' }}>
                    {m.text}
                  </div>
                  {m.groups.length > 0 && (
                    <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Groupes de capture :</span>
                      {m.groups.map((g, gIdx) => (
                        <div key={gIdx} style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#8b5cf6', paddingLeft: 8 }}>
                          ${gIdx + 1}: {g || 'null'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
              Aucune correspondance trouvée
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

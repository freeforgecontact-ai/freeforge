import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function AnalyseurLisibilite({ goBack }) {
  const [text, setText] = useState('');

  // Heuristic syllable counter for French/English text
  const countSyllables = (word) => {
    word = word.toLowerCase().trim();
    if (word.length <= 3) return 1;

    // Remove non-alphabetic chars
    word = word.replace(/[^a-zâàäéèêëîïôöùûüçœæ]/g, '');
    if (word.length === 0) return 0;

    // Vowel groups
    const vowels = /[aeiouyâàäéèêëîïôöùûüœæ]+/g;
    const matches = word.match(vowels);
    let count = matches ? matches.length : 1;

    // Heuristic: subtract 1 for silent 'e' at the end of French words
    if (word.endsWith('e') && count > 1) {
      count--;
    }

    return Math.max(1, count);
  };
  
  const analyzeText = () => {
    if (!text.trim()) {
      return { characters: 0, words: 0, sentences: 0, syllables: 0, ari: 0, fleschEase: 100, fleschGrade: 0, wordFreq: [] };
    }

    const characters = text.replace(/\s+/g, '').length;
    const wordsArray = text.trim().split(/\s+/).filter(w => w.length > 0);
    const words = wordsArray.length;

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;

    // Calculate total syllables
    let syllables = 0;
    wordsArray.forEach(w => {
      syllables += countSyllables(w);
    });

    // 1. ARI calculation
    let ari = 0;
    if (words > 0) {
      ari = 4.71 * (text.length / words) + 0.5 * (words / sentences) - 21.43;
    }
    ari = Math.max(1, Math.min(14, ari));

    // 2. Flesch Reading Ease (French adaptation by Kandel & Moles)
    let fleschEase = 100;
    if (words > 0) {
      fleschEase = 207 - 1.015 * (words / sentences) - 73.6 * (syllables / words);
    }
    fleschEase = Math.max(0, Math.min(100, fleschEase));

    // 3. Flesch-Kincaid Grade Level (Approximate school level)
    let fleschGrade = 0;
    if (words > 0) {
      fleschGrade = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
    }
    fleschGrade = Math.max(1, Math.round(fleschGrade));

    // Word frequencies
    const freq = {};
    wordsArray.forEach(w => {
      const cleaned = w.toLowerCase().replace(/[^a-zâàäéèêëîïôöùûüçœæ]/g, '');
      if (cleaned.length > 3) {
        freq[cleaned] = (freq[cleaned] || 0) + 1;
      }
    });

    const wordFreq = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      characters: text.length,
      words,
      sentences,
      syllables,
      ari: parseFloat(ari.toFixed(1)),
      fleschEase: Math.round(fleschEase),
      fleschGrade,
      wordFreq
    };
  };

  const stats = analyzeText();

  // Interpretations
  const getFleschInterpretation = (score) => {
    if (score > 80) return { label: 'Très facile', color: '#10b981', desc: 'Style fluide et simple, accessible à tous (bande dessinée, niveau primaire).' };
    if (score > 60) return { label: 'Facile / Standard', color: '#3b82f6', desc: 'Style de conversation courante, accessible dès le secondaire.' };
    if (score > 40) return { label: 'Assez difficile', color: '#f59e0b', desc: 'Texte académique, littéraire ou journalistique soutenu.' };
    return { label: 'Très difficile', color: '#ef4444', desc: 'Texte technique, scientifique ou légal complexe.' };
  };

  const getAriInterpretation = (score) => {
    const rounded = Math.round(score);
    if (rounded <= 4) return 'Niveau école primaire';
    if (rounded <= 8) return 'Niveau collège';
    if (rounded <= 12) return 'Niveau lycée';
    return 'Niveau universitaire';
  };

  const fleschInfo = getFleschInterpretation(stats.fleschEase);

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            📝 Analyseur de Lisibilité & Index de Texte
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Calculez l'index Flesch-Kincaid et l'indice ARI pour estimer la complexité de lecture de vos textes.
          </p>
        </div>
        <FolderButton toolId="readability_analyzer" toolName="AnalyseurLisibilite" localStorageKeys={[]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
        {/* Editor */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12, color: 'white' }}>Texte à analyser</h2>
          <textarea 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            className="input-premium" 
            placeholder="Saisissez ou collez votre texte ici pour calculer sa lisibilité..."
            rows="12"
            style={{ width: '100%', padding: '14px', borderRadius: 10, resize: 'vertical', fontSize: '1rem' }}
          />
        </div>

        {/* Stats & Readability Indices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Lexical Counts */}
          <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', margin: 0 }}>Statistiques Lexicales</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
              <div style={{ padding: 6, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Mots</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>{stats.words}</div>
              </div>
              <div style={{ padding: 6, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Phrases</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>{stats.sentences}</div>
              </div>
              <div style={{ padding: 6, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Syllabes</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>{stats.syllables}</div>
              </div>
              <div style={{ padding: 6, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Caractères</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>{stats.characters}</div>
              </div>
            </div>
          </div>

          {/* Flesch Reading Ease */}
          <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', margin: 0 }}>Facilité de Lecture Flesch</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Score Flesch (FR) :</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: fleschInfo.color }}>
                {stats.fleschEase} / 100
              </span>
            </div>
            
            <div style={{ padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, borderLeft: `3px solid ${fleschInfo.color}` }}>
              <strong style={{ fontSize: '0.85rem', color: 'white', display: 'block' }}>{fleschInfo.label}</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>{fleschInfo.desc}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Niveau scolaire estimé (Kincaid) :</span>
              <span style={{ fontWeight: 'bold', color: 'white' }}>Grade {stats.fleschGrade} (Secondaire)</span>
            </div>
          </div>

          {/* ARI Index */}
          <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', margin: 0 }}>Indice de Lisibilité ARI</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Index ARI :</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>
                {stats.ari}
              </span>
            </div>

            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Équivalent de lecture : <strong>{getAriInterpretation(stats.ari)}</strong>
            </span>
          </div>

          {/* Word counts */}
          <div className="glass-panel" style={{ padding: 20, borderRadius: 16 }}>
            <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 'bold' }}>Mots-clés fréquents (4+ lettres)</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {stats.wordFreq.length === 0 ? (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>En attente de texte...</span>
              ) : (
                stats.wordFreq.map(([word, count]) => (
                  <div key={word} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{word}</span>
                    <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{count} fois</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
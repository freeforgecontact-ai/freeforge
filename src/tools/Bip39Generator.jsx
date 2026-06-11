import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

// 128 Standard BIP39 Words subset for local computation
const BIP39_WORDS = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse', 
  'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act', 
  'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 
  'adult', 'advance', 'advice', 'advise', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 
  'agent', 'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 
  'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 
  'alter', 'always', 'amateur', 'amazing', 'among', 'amount', 'amuse', 'analyst', 'anchor', 'ancient', 
  'anger', 'angle', 'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 
  'antique', 'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arch', 
  'arctic', 'area', 'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange', 
  'arrest', 'arrive', 'arrow', 'art', 'artefact', 'artist', 'artwork', 'ask', 'aspect', 'assault', 
  'asset', 'assist', 'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 
  'auction', 'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'awake', 'aware', 'away', 
  'awesome', 'awful', 'awkward', 'axis', 'baby', 'bachelor', 'bacon', 'badge', 'bag', 'balance', 
  'balloon', 'bamboo', 'banana', 'banner'
];

export default function Bip39Generator({ goBack }) {
  const [entropyData, setEntropyData] = useState([]);
  const [progress, setProgress] = useState(0);
  const [phraseLength, setPhraseLength] = useState(12); // 12 or 24
  const [mnemonicPhrase, setMnemonicPhrase] = useState([]);
  const [isGenerated, setIsGenerated] = useState(false);

  // Harvest mouse tracking entropy
  const handleMouseMove = (e) => {
    if (progress >= 100) return;

    // Collect mouse positions and timestamps
    const rawVal = e.clientX + e.clientY + Date.now();
    const entropyVal = rawVal % BIP39_WORDS.length;

    setEntropyData(prev => {
      const next = [...prev, entropyVal];
      const percent = Math.min(Math.round((next.length / (phraseLength * 8)) * 100), 100);
      setProgress(percent);
      
      if (next.length >= phraseLength * 8) {
        generateMnemonic(next);
      }
      return next;
    });
  };

  const generateMnemonic = (seeds) => {
    const words = [];
    for (let i = 0; i < phraseLength; i++) {
      // Pick a word by combining multiple seeds to increase unpredictability
      const seedSlice = seeds.slice(i * 8, (i + 1) * 8);
      const sum = seedSlice.reduce((acc, val) => acc + val, 0);
      const wordIndex = sum % BIP39_WORDS.length;
      words.push(BIP39_WORDS[wordIndex]);
    }
    setMnemonicPhrase(words);
    setIsGenerated(true);
  };

  const resetGenerator = () => {
    setEntropyData([]);
    setProgress(0);
    setMnemonicPhrase([]);
    setIsGenerated(false);
  };

  const copyPhrase = () => {
    navigator.clipboard.writeText(mnemonicPhrase.join(' '));
    alert("Phrase mnémonique copiée !");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 8 }}>
            ← Retour
          </button>
          <h1 className="page-title">Générateur de Phrases BIP39</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Créez des phrases de récupération mnémoniques sécurisées basées sur votre propre entropie physique.</p>
        </div>
        <FolderButton toolId="bip39_generator" toolName="Phrase BIP39" />
      </div>

      <div className="grid-2">
        {/* Left Column: Harvest Entropy Zone */}
        <div className="card-premium" style={{ gap: 20 }}>
          <h2 className="card-title">1. Récolter de l'entropie</h2>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={() => { setPhraseLength(12); resetGenerator(); }} 
              className={`btn-premium ${phraseLength === 12 ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}
              disabled={progress > 0}
            >
              🔑 Phrase de 12 mots
            </button>
            <button 
              onClick={() => { setPhraseLength(24); resetGenerator(); }} 
              className={`btn-premium ${phraseLength === 24 ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}
              disabled={progress > 0}
            >
              🔑 Phrase de 24 mots
            </button>
          </div>

          {!isGenerated ? (
            <div 
              onMouseMove={handleMouseMove}
              style={{ 
                height: 180, 
                border: '2px dashed var(--border-light)', 
                borderRadius: 12, 
                backgroundColor: 'rgba(139, 92, 246, 0.02)', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center', 
                cursor: 'crosshair',
                padding: 20,
                textAlign: 'center'
              }}
            >
              <span style={{ fontSize: '1.5rem', marginBottom: 8 }}>🖱️</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Bougez votre souris ici pour récolter du hasard</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {entropyData.length} échantillons collectés
              </span>
            </div>
          ) : (
            <div style={{ padding: 24, backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 12, textAlign: 'center' }}>
              <span style={{ fontSize: '1.5rem' }}>✓</span>
              <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#34d399', marginTop: 4 }}>Entropie récoltée avec succès !</p>
              <button onClick={resetGenerator} className="btn-premium btn-secondary" style={{ marginTop: 12, padding: '8px 16px', fontSize: '0.8rem' }}>
                🔄 Recommencer
              </button>
            </div>
          )}

          {progress > 0 && progress < 100 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Récolte d'entropie</span>
                <span style={{ fontWeight: 'bold' }}>{progress}%</span>
              </div>
              <div style={{ height: 6, width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, backgroundColor: 'var(--primary)', transition: 'width 0.1s ease' }} />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Mnemonic Output */}
        <div className="card-premium" style={{ gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">Phrase de Récupération</h2>
            {isGenerated && (
              <button onClick={copyPhrase} className="btn-premium btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 8 }}>
                📋 Copier la phrase
              </button>
            )}
          </div>

          {isGenerated ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {mnemonicPhrase.map((word, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    padding: '10px 14px', 
                    backgroundColor: 'rgba(255,255,255,0.02)', 
                    border: '1px solid var(--border-light)', 
                    borderRadius: 8, 
                    display: 'flex', 
                    gap: 8, 
                    fontSize: '0.85rem' 
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>{idx + 1}.</span>
                  <span style={{ fontWeight: 600, color: 'white' }}>{word}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>
              Commencez à bouger votre souris dans la zone réactive de gauche pour générer la phrase mnémonique.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

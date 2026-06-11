import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

// Subset of most common passwords for dictionary checking
const COMMON_PASSWORDS = [
  '123456', 'password', '123456789', '12345678', '12345', 'qwerty', '1234567', 'password123', 
  'admin', '1234567890', 'letmein', 'hello', 'welcome', 'login', 'security', '123123'
];

export default function PasswordAnalyzer({ goBack }) {
  const [password, setPassword] = useState('');
  const [entropy, setEntropy] = useState(0);
  const [crackTime, setCrackTime] = useState('');
  const [strength, setStrength] = useState({ label: 'Vide', color: 'gray', score: 0 });
  const [commonMatch, setCommonMatch] = useState(false);
  
  // Generator states
  const [genLength, setGenLength] = useState(16);
  const [genLower, setGenLower] = useState(true);
  const [genUpper, setGenUpper] = useState(true);
  const [genDigits, setGenDigits] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);

  // Compute Password Strength
  const analyzePassword = () => {
    if (!password) {
      setEntropy(0);
      setCrackTime('');
      setStrength({ label: 'Vide', color: 'gray', score: 0 });
      setCommonMatch(false);
      return;
    }

    // Check common list
    const isCommon = COMMON_PASSWORDS.includes(password.toLowerCase());
    setCommonMatch(isCommon);

    // Calculate pool size R
    let poolSize = 0;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigits = /[0-9]/.test(password);
    const hasSymbols = /[^a-zA-Z0-9]/.test(password);

    if (hasLower) poolSize += 26;
    if (hasUpper) poolSize += 26;
    if (hasDigits) poolSize += 10;
    if (hasSymbols) poolSize += 33;

    // Calculate entropy E = L * log2(R)
    const length = password.length;
    const computedEntropy = poolSize > 0 ? Math.round(length * Math.log2(poolSize)) : 0;
    setEntropy(computedEntropy);

    // Estimate Crack Time (assuming 10 billion hashes/second for GPU)
    const hashesPerSecond = 10000000000;
    const totalPossibilities = Math.pow(poolSize, length);
    const secondsToCrack = totalPossibilities / (2 * hashesPerSecond);

    let timeString = 'Instantané';
    if (secondsToCrack > 3153600000) {
      timeString = `${(secondsToCrack / 3153600000).toFixed(0)} siècles`;
    } else if (secondsToCrack > 31536000) {
      timeString = `${(secondsToCrack / 31536000).toFixed(0)} ans`;
    } else if (secondsToCrack > 86400) {
      timeString = `${(secondsToCrack / 86400).toFixed(0)} jours`;
    } else if (secondsToCrack > 3600) {
      timeString = `${(secondsToCrack / 3600).toFixed(0)} heures`;
    } else if (secondsToCrack > 60) {
      timeString = `${(secondsToCrack / 60).toFixed(0)} minutes`;
    } else if (secondsToCrack > 0) {
      timeString = `${secondsToCrack.toFixed(2)} secondes`;
    }
    
    if (isCommon) timeString = 'Moins d\'une seconde (dans le dictionnaire)';
    setCrackTime(timeString);

    // Calculate strength score
    let score = 0;
    if (computedEntropy >= 80) score = 4; // Very Strong
    else if (computedEntropy >= 60) score = 3; // Strong
    else if (computedEntropy >= 40) score = 2; // Moderate
    else if (computedEntropy >= 20) score = 1; // Weak
    else score = 0; // Very Weak

    if (isCommon) score = 0;

    const labels = [
      { label: 'Très Faible 🔴', color: '#ef4444', score: 1 },
      { label: 'Faible 🟠', color: '#f97316', score: 2 },
      { label: 'Moyen 🟡', color: '#eab308', score: 3 },
      { label: 'Fort 🟢', color: '#10b981', score: 4 },
      { label: 'Très Fort 🚀', color: '#3b82f6', score: 5 }
    ];
    setStrength(labels[score]);
  };

  useEffect(() => {
    analyzePassword();
  }, [password]);

  // Generate strong password
  const generatePassword = () => {
    let charset = '';
    if (genLower) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (genUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (genDigits) charset += '0123456789';
    if (genSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) {
      alert("Veuillez sélectionner au moins un jeu de caractères.");
      return;
    }

    let genPass = '';
    const randomArray = new Uint32Array(genLength);
    window.crypto.getRandomValues(randomArray);

    for (let i = 0; i < genLength; i++) {
      genPass += charset[randomArray[i] % charset.length];
    }
    setPassword(genPass);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 8 }}>
            ← Retour
          </button>
          <h1 className="page-title">Analyseur de Force de Mots de Passe</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Analysez la sécurité de vos identifiants ou générez des phrases hautement résistantes aux attaques.</p>
        </div>
        <FolderButton toolId="password_analyzer" toolName="Analyseur Mots de Passe" />
      </div>

      <div className="grid-2">
        {/* Left Column: Input password to analyze */}
        <div className="card-premium" style={{ gap: 20 }}>
          <h2 className="card-title">Tester un mot de passe</h2>
          
          <div>
            <input 
              type="text" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="input-premium"
              placeholder="Saisissez ou collez un mot de passe..."
              style={{ fontSize: '1rem', fontFamily: 'monospace' }}
            />
          </div>

          {password && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Strength Level */}
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Niveau de sécurité :</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: strength.color, marginTop: 4 }}>
                  {strength.label}
                </div>
                <div className="password-indicator-bar">
                  <div 
                    className="password-indicator-fill" 
                    style={{ 
                      width: `${(strength.score / 5) * 100}%`, 
                      backgroundColor: strength.color 
                    }} 
                  />
                </div>
              </div>

              {/* Entropy & Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Longueur :</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: 2 }}>{password.length} car.</div>
                </div>
                <div style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Entropie :</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: 2 }}>{entropy} bits</div>
                </div>
              </div>

              {/* Time to Crack */}
              <div style={{ padding: 14, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Temps estimé pour forcer la clé (GPU) :</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', marginTop: 4, color: '#f3f4f6' }}>
                  {crackTime}
                </div>
              </div>

              {commonMatch && (
                <div style={{ padding: 10, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#f87171', fontSize: '0.8rem', fontWeight: 600 }}>
                  ⚠️ Ce mot de passe figure dans le dictionnaire des mots de passe les plus piratés !
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Generator parameters */}
        <div className="card-premium" style={{ gap: 20 }}>
          <h2 className="card-title">Générateur de clés</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Longueur de clé ({genLength} caractères) :
              </label>
              <input 
                type="range" 
                min="8" 
                max="64" 
                value={genLength} 
                onChange={(e) => setGenLength(parseInt(e.target.value))} 
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={genLower} onChange={(e) => setGenLower(e.target.checked)} />
                a-z (Minuscules)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={genUpper} onChange={(e) => setGenUpper(e.target.checked)} />
                A-Z (Majuscules)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={genDigits} onChange={(e) => setGenDigits(e.target.checked)} />
                0-9 (Chiffres)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={genSymbols} onChange={(e) => setGenSymbols(e.target.checked)} />
                !@#$ (Symboles)
              </label>
            </div>

            <button onClick={generatePassword} className="btn-premium btn-primary" style={{ justifyContent: 'center', marginTop: 10 }}>
              🎲 Générer & Tester
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

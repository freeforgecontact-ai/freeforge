import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

// Web Crypto PBKDF2 Key Derivation Helper
const deriveKey = async (password, salt) => {
  const enc = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// Encrypt data to JSON string format
const encryptData = async (text, password) => {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    enc.encode(text)
  );

  const saltB64 = btoa(String.fromCharCode(...salt));
  const ivB64 = btoa(String.fromCharCode(...iv));
  const ciphertextB64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  
  return JSON.stringify({ salt: saltB64, iv: ivB64, ciphertext: ciphertextB64 });
};

// Decrypt data from JSON string format
const decryptData = async (encryptedJsonStr, password) => {
  try {
    const { salt, iv, ciphertext } = JSON.parse(encryptedJsonStr);
    const saltArr = new Uint8Array(atob(salt).split('').map(c => c.charCodeAt(0)));
    const ivArr = new Uint8Array(atob(iv).split('').map(c => c.charCodeAt(0)));
    const ciphertextArr = new Uint8Array(atob(ciphertext).split('').map(c => c.charCodeAt(0)));

    const key = await deriveKey(password, saltArr);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivArr },
      key,
      ciphertextArr
    );
    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (e) {
    throw new Error("Mot de passe incorrect ou données corrompues");
  }
};

export default function JournalMoodTracker({ goBack }) {
  const [encryptedData, setEncryptedData] = useState(() => {
    return localStorage.getItem('fl_journal_enc') || '';
  });
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [entries, setEntries] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [text, setText] = useState('');
  const [mood, setMood] = useState('🙂');

  // Handle setting a password for the first time
  const handleSetupPassword = (e) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg("Le mot de passe ne peut pas être vide.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
      return;
    }
    setErrorMsg('');
    setEntries([]);
    setIsUnlocked(true);
  };

  // Handle unlocking the journal
  const handleUnlock = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!password) {
      setErrorMsg("Veuillez saisir votre mot de passe.");
      return;
    }
    try {
      const decrypted = await decryptData(encryptedData, password);
      const parsed = JSON.parse(decrypted);
      setEntries(parsed || []);
      setIsUnlocked(true);
    } catch (err) {
      setErrorMsg("Mot de passe incorrect. Veuillez réessayer.");
    }
  };

  const handleSave = async (updatedEntries) => {
    try {
      const encrypted = await encryptData(JSON.stringify(updatedEntries), password);
      localStorage.setItem('fl_journal_enc', encrypted);
      setEncryptedData(encrypted);
    } catch (err) {
      alert("Erreur lors du chiffrement : " + err.message);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!text) return;
    const newEntry = {
      id: Date.now().toString(),
      text,
      mood,
      date: new Date().toLocaleString('fr-FR')
    };
    const newEntries = [newEntry, ...entries];
    setEntries(newEntries);
    setText('');
    await handleSave(newEntries);
  };

  const handleRemoveEntry = async (id) => {
    if (confirm("Voulez-vous supprimer cette note ?")) {
      const newEntries = entries.filter(e => e.id !== id);
      setEntries(newEntries);
      await handleSave(newEntries);
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setPassword('');
    setConfirmPassword('');
    setEntries([]);
    setErrorMsg('');
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>📓 Journal Intime Local & Mood Tracker</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Notez vos pensées et suivez votre humeur en toute sécurité avec chiffrement AES-GCM local.</p>
        </div>
        <FolderButton toolId="journal_intime" toolName="JournalMoodTracker" localStorageKeys={['fl_journal_enc']} />
      </div>

      {!isUnlocked ? (
        <div style={{ maxWidth: 450, margin: '40px auto' }} className="glass-panel">
          <div style={{ padding: 30, borderRadius: 16, textAlign: 'center' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: 16 }}>🔒</span>
            {encryptedData ? (
              <>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>Déverrouiller votre journal</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                  Vos pensées sont chiffrées de bout en bout localement. Entrez votre mot de passe pour y accéder.
                </p>
                <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Saisissez votre mot de passe..." 
                    className="input-premium" 
                    style={{ padding: 10, borderRadius: 8, fontSize: '0.9rem', textAlign: 'center' }} 
                  />
                  {errorMsg && <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: 0 }}>{errorMsg}</p>}
                  <button type="submit" className="btn-premium btn-primary" style={{ padding: 10, borderRadius: 8, fontWeight: 'bold', justifyContent: 'center' }}>
                    🔓 Déverrouiller
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>Initialiser votre journal chiffré</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                  Créez un mot de passe robuste. **Attention :** si vous perdez ce mot de passe, vos notes ne pourront jamais être récupérées.
                </p>
                <form onSubmit={handleSetupPassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Nouveau mot de passe..." 
                    className="input-premium" 
                    style={{ padding: 10, borderRadius: 8, fontSize: '0.9rem', textAlign: 'center' }} 
                  />
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    placeholder="Confirmez le mot de passe..." 
                    className="input-premium" 
                    style={{ padding: 10, borderRadius: 8, fontSize: '0.9rem', textAlign: 'center' }} 
                  />
                  {errorMsg && <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: 0 }}>{errorMsg}</p>}
                  <button type="submit" className="btn-premium btn-primary" style={{ padding: 10, borderRadius: 8, fontWeight: 'bold', justifyContent: 'center' }}>
                    🔑 Créer et Ouvrir
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <form onSubmit={handleAddEntry} className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Nouvelle note de journal</h2>
                <button type="button" onClick={handleLock} className="btn-premium btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: 6 }}>
                  🔒 Verrouiller la session
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: 10 }}>
                {['🙂', '😀', '😐', '🙁', '😡'].map(m => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMood(m)}
                    style={{
                      fontSize: '1.5rem',
                      padding: 8,
                      borderRadius: 8,
                      border: mood === m ? '1.5px solid #10b981' : '1px solid var(--border-light)',
                      backgroundColor: mood === m ? 'rgba(16,185,129,0.1)' : 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <textarea required value={text} onChange={e => setText(e.target.value)} placeholder="Écrivez vos pensées du jour..." className="input-premium" style={{ width: '100%', height: 120, padding: 10, borderRadius: 8, fontSize: '0.9rem', lineHeight: 1.5 }} />
              <button type="submit" className="btn-premium btn-primary" style={{ width: '100%', padding: 10, borderRadius: 8, fontWeight: 'bold', justifyContent: 'center' }}>💾 Enregistrer</button>
            </form>

            <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Notes passées</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
                {entries.length > 0 ? entries.map(e => (
                  <div key={e.id} style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-light)', position: 'relative' }}>
                    <button 
                      onClick={() => handleRemoveEntry(e.id)} 
                      style={{ position: 'absolute', top: 10, right: 12, border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem' }}
                      title="Supprimer la note"
                    >
                      ×
                    </button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6, paddingRight: 20 }}>
                      <span>{e.date}</span>
                      <span>Humeur: {e.mood}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'white', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{e.text}</p>
                  </div>
                )) : (
                  <div style={{ padding: 16, textAlign: 'center', fontStyle: 'italic', color: 'var(--text-muted)' }}>Aucune note enregistrée.</div>
                )}
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: 20, borderRadius: 16 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 12 }}>Suivi d'Humeur</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
              {Array.from({ length: 28 }).map((_, idx) => {
                const entry = entries[idx];
                return (
                  <div 
                    key={idx} 
                    style={{
                      height: 36,
                      borderRadius: 6,
                      backgroundColor: entry ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)',
                      border: entry ? '1px solid #10b981' : '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem'
                    }}
                    title={entry ? entry.date : 'Jour vide'}
                  >
                    {entry ? entry.mood : ''}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
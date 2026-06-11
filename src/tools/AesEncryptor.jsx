import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function AesEncryptor({ goBack }) {
  const [password, setPassword] = useState('');
  const [fileToEncrypt, setFileToEncrypt] = useState(null);
  const [fileToDecrypt, setFileToDecrypt] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper: Derive Key from Password using PBKDF2
  const deriveKey = async (passwordStr, salt, keyUsage) => {
    const enc = new TextEncoder();
    const passwordKey = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(passwordStr),
      'PBKDF2',
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
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      keyUsage
    );
  };

  // Encrypt Handler
  const handleEncrypt = async () => {
    if (!fileToEncrypt || !password) {
      alert("Veuillez sélectionner un fichier et renseigner un mot de passe.");
      return;
    }
    setIsProcessing(true);

    try {
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          const fileBytes = new Uint8Array(e.target.result);
          
          // Generate salt and IV
          const salt = window.crypto.getRandomValues(new Uint8Array(16));
          const iv = window.crypto.getRandomValues(new Uint8Array(12));
          
          // Derive key
          const key = await deriveKey(password, salt, ['encrypt']);
          
          // Encrypt
          const ciphertext = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            fileBytes
          );

          // Package: [16 bytes salt][12 bytes IV][ciphertext]
          const finalBuffer = new Uint8Array(16 + 12 + ciphertext.byteLength);
          finalBuffer.set(salt, 0);
          finalBuffer.set(iv, 16);
          finalBuffer.set(new Uint8Array(ciphertext), 28);

          // Download
          const blob = new Blob([finalBuffer], { type: 'application/octet-stream' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `${fileToEncrypt.name}.enc`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (err) {
          console.error(err);
          alert("Erreur lors du chiffrement du fichier.");
        } finally {
          setIsProcessing(false);
        }
      };
      fileReader.readAsArrayBuffer(fileToEncrypt);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  // Decrypt Handler
  const handleDecrypt = async () => {
    if (!fileToDecrypt || !password) {
      alert("Veuillez sélectionner un fichier .enc et saisir le mot de passe.");
      return;
    }
    setIsProcessing(true);

    try {
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          const fileBytes = new Uint8Array(e.target.result);
          if (fileBytes.length < 28) {
            throw new Error("Fichier invalide ou corrompu.");
          }

          // Extract salt, IV and ciphertext
          const salt = fileBytes.slice(0, 16);
          const iv = fileBytes.slice(16, 28);
          const ciphertext = fileBytes.slice(28);

          // Derive key
          const key = await deriveKey(password, salt, ['decrypt']);

          // Decrypt
          const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            ciphertext
          );

          // Restore original filename by stripping '.enc'
          const origName = fileToDecrypt.name.replace(/\.enc$/i, '');

          // Download
          const blob = new Blob([decrypted], { type: 'application/octet-stream' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = origName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (err) {
          console.error(err);
          alert("Échec du déchiffrement. Assurez-vous que le mot de passe est correct.");
        } finally {
          setIsProcessing(false);
        }
      };
      fileReader.readAsArrayBuffer(fileToDecrypt);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 8 }}>
            ← Retour
          </button>
          <h1 className="page-title">Chiffreur de Fichiers AES-256</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sécurisez vos fichiers sensibles de manière militaire 100% hors-ligne.</p>
        </div>
        <FolderButton toolId="aes_encryptor" toolName="Chiffreur AES" />
      </div>

      <div className="grid-2">
        {/* Left Column: Encryption */}
        <div className="card-premium" style={{ gap: 20 }}>
          <h2 className="card-title" style={{ color: 'var(--secondary)' }}>🔒 Chiffrer un fichier</h2>
          
          <label className="btn-premium btn-secondary" style={{ justifyContent: 'center', cursor: 'pointer', padding: '16px 20px', border: '1px dashed var(--border-light)', background: 'rgba(255,255,255,0.01)' }}>
            📁 Choisir un fichier à chiffrer
            <input type="file" onChange={(e) => setFileToEncrypt(e.target.files[0])} style={{ display: 'none' }} />
          </label>
          {fileToEncrypt && (
            <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>
              Prêt : {fileToEncrypt.name}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Mot de passe de chiffrement :</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="input-premium"
              placeholder="Saisissez un mot de passe fort..."
            />
          </div>

          <button onClick={handleEncrypt} className="btn-premium btn-primary" style={{ justifyContent: 'center', background: 'linear-gradient(135deg, var(--secondary) 0%, #db2777 100%)', boxShadow: '0 4px 15px var(--secondary-glow)' }} disabled={isProcessing}>
            {isProcessing ? 'Calculs...' : '🔒 Chiffrer & Télécharger (.enc)'}
          </button>
        </div>

        {/* Right Column: Decryption */}
        <div className="card-premium" style={{ gap: 20 }}>
          <h2 className="card-title" style={{ color: 'var(--primary)' }}>🔓 Déchiffrer un fichier</h2>
          
          <label className="btn-premium btn-secondary" style={{ justifyContent: 'center', cursor: 'pointer', padding: '16px 20px', border: '1px dashed var(--border-light)', background: 'rgba(255,255,255,0.01)' }}>
            📁 Choisir un fichier .enc
            <input type="file" accept=".enc" onChange={(e) => setFileToDecrypt(e.target.files[0])} style={{ display: 'none' }} />
          </label>
          {fileToDecrypt && (
            <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>
              Prêt : {fileToDecrypt.name}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Saisir le mot de passe :</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="input-premium"
              placeholder="Entrez le mot de passe d'origine..."
            />
          </div>

          <button onClick={handleDecrypt} className="btn-premium btn-primary" style={{ justifyContent: 'center' }} disabled={isProcessing}>
            {isProcessing ? 'Déchiffrement...' : '🔓 Déchiffrer & Restaurer'}
          </button>
        </div>
      </div>
    </div>
  );
}

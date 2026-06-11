import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function KeyGenerator({ goBack }) {
  const [keyType, setKeyType] = useState('RSA-2048'); // RSA-2048, RSA-4096, ECDSA-P256
  const [publicKeyPem, setPublicKeyPem] = useState('');
  const [privateKeyPem, setPrivateKeyPem] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Convert ArrayBuffer to Base64 String
  const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // Format Base64 string into PEM block
  const formatAsPem = (base64, headerType) => {
    const lines = [];
    for (let i = 0; i < base64.length; i += 64) {
      lines.push(base64.substring(i, i + 64));
    }
    return `-----BEGIN ${headerType}-----\n${lines.join('\n')}\n-----END ${headerType}-----`;
  };

  const generateKeys = async () => {
    setIsGenerating(true);
    setPublicKeyPem('');
    setPrivateKeyPem('');

    try {
      let algorithm;
      if (keyType === 'RSA-2048') {
        algorithm = {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: 2048,
          publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
          hash: { name: 'SHA-256' }
        };
      } else if (keyType === 'RSA-4096') {
        algorithm = {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: 4096,
          publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
          hash: { name: 'SHA-256' }
        };
      } else if (keyType === 'ECDSA-P256') {
        algorithm = {
          name: 'ECDSA',
          namedCurve: 'P-256'
        };
      }

      // Generate Key Pair
      const keyPair = await window.crypto.subtle.generateKey(
        algorithm,
        true, // extractable
        keyType.startsWith('ECDSA') ? ['sign', 'verify'] : ['sign', 'verify']
      );

      // Export Public Key (spki format)
      const spkiBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
      const publicBase64 = arrayBufferToBase64(spkiBuffer);
      setPublicKeyPem(formatAsPem(publicBase64, 'PUBLIC KEY'));

      // Export Private Key (pkcs8 format)
      const pkcs8Buffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      const privateBase64 = arrayBufferToBase64(pkcs8Buffer);
      setPrivateKeyPem(formatAsPem(privateBase64, 'PRIVATE KEY'));

    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération de la paire de clés.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copié dans le presse-papiers !");
  };

  const handleDownload = (text, filename) => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 8 }}>
            ← Retour
          </button>
          <h1 className="page-title">Générateur de Clés PGP & SSH</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Générez des clés asymétriques sécurisées pour vos communications cryptées.</p>
        </div>
        <FolderButton toolId="key_generator" toolName="Générateur de Clés" />
      </div>

      <div className="grid-2">
        {/* Left Column: Key Parameters & Generator Button */}
        <div className="card-premium" style={{ gap: 20 }}>
          <h2 className="card-title">Configuration de la clé</h2>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
              Type d'algorithme :
            </label>
            <select 
              value={keyType} 
              onChange={(e) => setKeyType(e.target.value)} 
              className="input-premium select-premium"
            >
              <option value="RSA-2048">RSA 2048 bits (Standard)</option>
              <option value="RSA-4096">RSA 4096 bits (Ultra-sécurisé)</option>
              <option value="ECDSA-P256">ECDSA P-256 (Courbe Elliptique)</option>
            </select>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Ce générateur utilise le générateur de nombres pseudo-aléatoires cryptographiquement sécurisé (CSPRNG) natif de votre navigateur. Aucune clé ne transite sur Internet.
          </p>

          <button onClick={generateKeys} className="btn-premium btn-primary" style={{ justifyContent: 'center' }} disabled={isGenerating}>
            {isGenerating ? 'Calcul mathématique...' : '🔑 Générer la paire de clés'}
          </button>
        </div>

        {/* Right Column: Display PEM blocks */}
        <div className="card-premium" style={{ gap: 20 }}>
          <h2 className="card-title">Clés Générées</h2>
          
          {publicKeyPem ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Public Key Display */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Clé Publique (SPKI) :</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleCopy(publicKeyPem)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem' }}>📋 Copier</button>
                    <button onClick={() => handleDownload(publicKeyPem, 'public_key.pem')} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem' }}>💾 Télécharger</button>
                  </div>
                </div>
                <textarea 
                  readOnly 
                  value={publicKeyPem} 
                  className="input-premium"
                  style={{ height: 110, fontSize: '0.75rem', fontFamily: 'monospace', resize: 'none' }}
                />
              </div>

              {/* Private Key Display */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Clé Privée (PKCS8) :</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleCopy(privateKeyPem)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem' }}>📋 Copier</button>
                    <button onClick={() => handleDownload(privateKeyPem, 'id_rsa')} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem' }}>💾 Télécharger</button>
                  </div>
                </div>
                <textarea 
                  readOnly 
                  value={privateKeyPem} 
                  className="input-premium"
                  style={{ height: 110, fontSize: '0.75rem', fontFamily: 'monospace', resize: 'none' }}
                />
              </div>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>
              Générez une paire de clés pour voir les résultats.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

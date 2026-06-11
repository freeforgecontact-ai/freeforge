import React, { useState, useEffect, useRef } from 'react';
import FolderButton from '../components/FolderButton';

export default function QrGenerator({ goBack }) {
  const [qrText, setQrText] = useState('https://freeforge.pgrg.ca');
  const [contentType, setContentType] = useState('url'); // url, wifi, vcard, text
  const [fgColor, setFgColor] = useState('#8b5cf6'); // FreeForge primary
  const [bgColor, setBgColor] = useState('#ffffff');
  const [qrSize, setQrSize] = useState(256);
  
  // Wi-Fi states
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiSecurity, setWifiSecurity] = useState('WPA'); // WPA, WEP, nopass

  // vCard states
  const [vcardName, setVcardName] = useState('');
  const [vcardPhone, setVcardPhone] = useState('');
  const [vcardEmail, setVcardEmail] = useState('');
  const [vcardOrg, setVcardOrg] = useState('');

  const qrContainerRef = useRef(null);

  const loadQRCode = () => {
    return new Promise((resolve, reject) => {
      if (window.QRCode) {
        resolve(window.QRCode);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
      script.onload = () => resolve(window.QRCode);
      script.onerror = () => reject(new Error('QRCode.js failed to load'));
      document.head.appendChild(script);
    });
  };

  // Compile final payload for the QR code
  const getQrPayload = () => {
    if (contentType === 'url' || contentType === 'text') {
      return qrText;
    }
    if (contentType === 'wifi') {
      return `WIFI:S:${wifiSsid};T:${wifiSecurity};P:${wifiPassword};;`;
    }
    if (contentType === 'vcard') {
      return `BEGIN:VCARD\nVERSION:3.0\nN:${vcardName}\nORG:${vcardOrg}\nTEL:${vcardPhone}\nEMAIL:${vcardEmail}\nEND:VCARD`;
    }
    return '';
  };

  const generateQrCode = async () => {
    const QRCodeClass = await loadQRCode();
    if (!qrContainerRef.current) return;
    
    // Clear previous QR code
    qrContainerRef.current.innerHTML = '';
    
    const payload = getQrPayload();
    if (!payload.trim()) return;

    new QRCodeClass(qrContainerRef.current, {
      text: payload,
      width: qrSize,
      height: qrSize,
      colorDark: fgColor,
      colorLight: bgColor,
      correctLevel: QRCodeClass.CorrectLevel.H
    });
  };

  useEffect(() => {
    generateQrCode();
  }, [qrText, contentType, fgColor, bgColor, qrSize, wifiSsid, wifiPassword, wifiSecurity, vcardName, vcardPhone, vcardEmail, vcardOrg]);

  const downloadQrPng = () => {
    const img = qrContainerRef.current.querySelector('img');
    if (!img) return;
    const link = document.createElement('a');
    link.href = img.src;
    link.download = `qrcode_${contentType}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 8 }}>
            ← Retour
          </button>
          <h1 className="page-title">Générateur de Codes QR Stylisés</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Créez des QR Codes personnalisés pour vos liens, réseaux Wi-Fi et fiches contacts.</p>
        </div>
        <FolderButton toolId="qr_generator" toolName="Générateur QR" />
      </div>

      <div className="grid-2">
        {/* Left Column: QR Code parameters */}
        <div className="card-premium" style={{ gap: 18 }}>
          <h2 className="card-title">Type de contenu</h2>
          
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {['url', 'wifi', 'vcard', 'text'].map((type) => (
              <button
                key={type}
                onClick={() => setContentType(type)}
                className={`btn-premium ${contentType === type ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 14px', fontSize: '0.85rem', textTransform: 'uppercase' }}
              >
                {type}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {contentType === 'url' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>URL du lien :</label>
                <input 
                  type="url" 
                  value={qrText} 
                  onChange={(e) => setQrText(e.target.value)} 
                  className="input-premium"
                  placeholder="https://example.com"
                />
              </div>
            )}

            {contentType === 'text' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Message textuel :</label>
                <textarea 
                  value={qrText} 
                  onChange={(e) => setQrText(e.target.value)} 
                  className="input-premium"
                  placeholder="Écrivez votre message..."
                  style={{ minHeight: 80 }}
                />
              </div>
            )}

            {contentType === 'wifi' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Nom du réseau (SSID) :</label>
                  <input 
                    type="text" 
                    value={wifiSsid} 
                    onChange={(e) => setWifiSsid(e.target.value)} 
                    className="input-premium"
                    placeholder="Mon Réseau Wi-Fi"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Mot de passe :</label>
                  <input 
                    type="password" 
                    value={wifiPassword} 
                    onChange={(e) => setWifiPassword(e.target.value)} 
                    className="input-premium"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Sécurité :</label>
                  <select 
                    value={wifiSecurity} 
                    onChange={(e) => setWifiSecurity(e.target.value)} 
                    className="input-premium select-premium"
                  >
                    <option value="WPA">WPA / WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">Sans protection (Ouvert)</option>
                  </select>
                </div>
              </div>
            )}

            {contentType === 'vcard' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Nom complet :</label>
                  <input 
                    type="text" 
                    value={vcardName} 
                    onChange={(e) => setVcardName(e.target.value)} 
                    className="input-premium"
                    placeholder="Jean Dupont"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Téléphone :</label>
                  <input 
                    type="tel" 
                    value={vcardPhone} 
                    onChange={(e) => setVcardPhone(e.target.value)} 
                    className="input-premium"
                    placeholder="+1 514 555 0199"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>E-mail :</label>
                  <input 
                    type="email" 
                    value={vcardEmail} 
                    onChange={(e) => setVcardEmail(e.target.value)} 
                    className="input-premium"
                    placeholder="jean.dupont@company.com"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Entreprise / Organisation :</label>
                  <input 
                    type="text" 
                    value={vcardOrg} 
                    onChange={(e) => setVcardOrg(e.target.value)} 
                    className="input-premium"
                    placeholder="PGRG inc."
                  />
                </div>
              </div>
            )}

            <h2 className="card-title" style={{ marginTop: 10 }}>Personnalisation visuelle</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Couleur du code :</label>
                <input 
                  type="color" 
                  value={fgColor} 
                  onChange={(e) => setFgColor(e.target.value)} 
                  style={{ width: '100%', height: 38, border: 'none', borderRadius: 8, background: 'transparent', cursor: 'pointer' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Couleur de fond :</label>
                <input 
                  type="color" 
                  value={bgColor} 
                  onChange={(e) => setBgColor(e.target.value)} 
                  style={{ width: '100%', height: 38, border: 'none', borderRadius: 8, background: 'transparent', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: QR Preview and download */}
        <div className="card-premium" style={{ gap: 20, alignItems: 'center', justifyContent: 'center' }}>
          <h2 className="card-title">Aperçu du QR Code</h2>
          
          <div style={{ padding: 20, backgroundColor: 'white', borderRadius: 16, border: '1px solid var(--border-light)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div ref={qrContainerRef} style={{ width: qrSize, height: qrSize }} />
          </div>

          <button onClick={downloadQrPng} className="btn-premium btn-primary" style={{ width: '100%', maxWidth: 280, justifyContent: 'center' }}>
            💾 Télécharger l'image PNG
          </button>
        </div>
      </div>
    </div>
  );
}

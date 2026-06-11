import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function OcrExtractor({ goBack }) {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [ocrLanguage, setOcrLanguage] = useState('fra'); // fra, eng, spa
  const [status, setStatus] = useState(''); // Idle, Loading, Recognizing, Done
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setExtractedText('');
    setProgress(0);
    setStatus('idle');
  };

  const loadTesseract = () => {
    return new Promise((resolve, reject) => {
      if (window.Tesseract) {
        resolve(window.Tesseract);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/tesseract.js@5.1.0/dist/tesseract.min.js';
      script.onload = () => resolve(window.Tesseract);
      script.onerror = () => reject(new Error('Tesseract script failed to load'));
      document.head.appendChild(script);
    });
  };

  const runOcr = async () => {
    if (!imagePreview) return;
    setStatus('loading');
    setStatus('Chargement du moteur OCR...');
    setProgress(10);
    
    try {
      const Tesseract = await loadTesseract();
      setStatus('Reconnaissance du texte...');
      
      const result = await Tesseract.recognize(
        imagePreview,
        ocrLanguage,
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            } else {
              setStatus(m.status);
            }
          }
        }
      );
      
      setExtractedText(result.data.text);
      setStatus('Terminé !');
      setProgress(100);
    } catch (err) {
      console.error(err);
      setStatus('Erreur lors de la reconnaissance.');
      alert("Erreur de reconnaissance OCR. Assurez-vous d'être connecté à internet pour charger le dictionnaire la première fois.");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([extractedText], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `ocr_extracted_${Date.now()}.txt`;
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
          <h1 className="page-title">Extracteur de Texte OCR Local</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Extrayez le texte de vos images de documents 100% localement.</p>
        </div>
        <FolderButton toolId="ocr_extractor" toolName="Extracteur OCR" />
      </div>

      <div className="grid-2">
        {/* Left Column: Image Import and Preview */}
        <div className="card-premium" style={{ gap: 20 }}>
          <h2 className="card-title">1. Charger l'image</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label className="btn-premium btn-secondary" style={{ justifyContent: 'center', cursor: 'pointer' }}>
              📷 Choisir une photo / image
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Langue du document :
              </label>
              <select 
                value={ocrLanguage} 
                onChange={(e) => setOcrLanguage(e.target.value)} 
                className="input-premium select-premium"
              >
                <option value="fra">Français (fra)</option>
                <option value="eng">Anglais (eng)</option>
                <option value="spa">Espagnol (spa)</option>
              </select>
            </div>
          </div>

          {imagePreview && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Aperçu du document :</span>
              <div style={{ border: '1px solid var(--border-light)', borderRadius: 12, overflow: 'hidden', maxHeight: 250, display: 'flex', justifyContent: 'center', backgroundColor: '#000' }}>
                <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 250, objectFit: 'contain' }} />
              </div>

              <button onClick={runOcr} className="btn-premium btn-primary" style={{ justifyContent: 'center', marginTop: 8 }}>
                🔍 Lancer l'extraction (OCR)
              </button>
            </div>
          )}

          {progress > 0 && progress < 100 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{status}</span>
                <span style={{ fontWeight: 'bold' }}>{progress}%</span>
              </div>
              <div style={{ height: 6, width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, backgroundColor: 'var(--primary)', transition: 'width 0.2s ease' }} />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: OCR Result Text */}
        <div className="card-premium" style={{ gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">Texte Extrait</h2>
            {extractedText && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleCopy} className="btn-premium btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 8 }}>
                  {copied ? 'Copié !' : '📋 Copier'}
                </button>
                <button onClick={handleDownloadTxt} className="btn-premium btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 8 }}>
                  💾 Télécharger .txt
                </button>
              </div>
            )}
          </div>

          <textarea
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
            placeholder="Le texte extrait apparaîtra ici après le traitement OCR. Vous pourrez ensuite le modifier ou le copier librement."
            className="input-premium"
            style={{ minHeight: 340, fontFamily: 'monospace', resize: 'vertical', fontSize: '0.9rem', lineHeight: 1.5 }}
            disabled={!extractedText}
          />
        </div>
      </div>
    </div>
  );
}

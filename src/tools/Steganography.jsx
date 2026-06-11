import React, { useState, useRef } from 'react';
import FolderButton from '../components/FolderButton';

export default function Steganography({ goBack }) {
  const [mode, setMode] = useState('encode'); // encode, decode
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [secretText, setSecretText] = useState('');
  const [decodedText, setDecodedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setDecodedText('');
  };

  // Helper: Convert string to binary array
  const stringToBin = (str) => {
    const bin = [];
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      // Pad to 8 bits
      const binStr = charCode.toString(2).padStart(8, '0');
      for (let j = 0; j < 8; j++) {
        bin.push(parseInt(binStr[j]));
      }
    }
    return bin;
  };

  // Helper: Convert binary array to string
  const binToString = (bin) => {
    let str = '';
    for (let i = 0; i < bin.length; i += 8) {
      const byte = bin.slice(i, i + 8).join('');
      const charCode = parseInt(byte, 2);
      if (charCode === 0) break; // Null terminator
      str += String.fromCharCode(charCode);
    }
    return str;
  };

  // LSB Encode
  const handleEncode = () => {
    if (!imagePreview || !secretText) {
      alert("Veuillez charger une image et saisir un texte secret.");
      return;
    }
    setIsProcessing(true);

    const img = new Image();
    img.src = imagePreview;
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Append null terminator character to mark end of string
      const binaryMessage = stringToBin(secretText + '\0');
      
      if (binaryMessage.length > data.length) {
        alert("L'image est trop petite pour contenir ce texte secret !");
        setIsProcessing(false);
        return;
      }

      // Hide bits in LSB of pixel channels (R, G, B)
      for (let i = 0; i < binaryMessage.length; i++) {
        // Skip alpha channel (every 4th byte is alpha)
        const pixelIdx = Math.floor(i / 3) * 4 + (i % 3);
        const bit = binaryMessage[i];
        
        // Clear LSB and write bit
        data[pixelIdx] = (data[pixelIdx] & 0xFE) | bit;
      }

      ctx.putImageData(imgData, 0, 0);
      
      // Export as PNG (lossless format required)
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `stego_${imageFile.name.replace(/\.[^/.]+$/, "")}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsProcessing(false);
        alert("Message caché avec succès ! Image PNG téléchargée.");
      }, 'image/png');
    };
  };

  // LSB Decode
  const handleDecode = () => {
    if (!imagePreview) return;
    setIsProcessing(true);

    const img = new Image();
    img.src = imagePreview;
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      const extractedBits = [];
      // Read bits up to a reasonable limit or until we see null terminator
      const maxBits = data.length; 
      
      for (let i = 0; i < maxBits; i++) {
        const pixelIdx = Math.floor(i / 3) * 4 + (i % 3);
        if (pixelIdx >= data.length) break;
        
        const lsb = data[pixelIdx] & 1;
        extractedBits.push(lsb);
        
        // Perform a quick check every 8 bits to see if we reached the null terminator
        if (extractedBits.length % 8 === 0) {
          const lastByteIdx = extractedBits.length - 8;
          const byteStr = extractedBits.slice(lastByteIdx, lastByteIdx + 8).join('');
          if (parseInt(byteStr, 2) === 0) {
            break;
          }
        }
      }

      const decoded = binToString(extractedBits);
      setDecodedText(decoded);
      setIsProcessing(false);
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 8 }}>
            ← Retour
          </button>
          <h1 className="page-title">Stéganographie Locale</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Cachez ou décodez des messages secrets dissimulés dans les pixels d'images PNG.</p>
        </div>
        <FolderButton toolId="steganography" toolName="Stéganographie" />
      </div>

      <div className="grid-2">
        {/* Left Column: Image Selector & Mode */}
        <div className="card-premium" style={{ gap: 20 }}>
          <h2 className="card-title">Opération</h2>
          
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              onClick={() => { setMode('encode'); setDecodedText(''); }}
              className={`btn-premium ${mode === 'encode' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem' }}
            >
              🔒 Cacher un message
            </button>
            <button 
              onClick={() => { setMode('decode'); setSecretText(''); }}
              className={`btn-premium ${mode === 'decode' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem' }}
            >
              🔓 Décoder une image
            </button>
          </div>

          <label className="btn-premium btn-secondary" style={{ justifyContent: 'center', cursor: 'pointer', padding: '16px 20px', border: '1px dashed var(--border-light)', background: 'rgba(255,255,255,0.01)' }}>
            📁 Choisir l'image PNG
            <input type="file" accept="image/png" onChange={handleImageUpload} style={{ display: 'none' }} />
          </label>
          {imageFile && (
            <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>
              Fichier : {imageFile.name}
            </div>
          )}

          {imagePreview && (
            <div style={{ border: '1px solid var(--border-light)', borderRadius: 12, overflow: 'hidden', backgroundColor: 'black', maxHeight: 180, display: 'flex', justifyContent: 'center' }}>
              <img src={imagePreview} alt="Aperçu" style={{ maxWidth: '100%', maxHeight: 180, objectFit: 'contain' }} />
            </div>
          )}
        </div>

        {/* Right Column: Code Message or Decode Text */}
        <div className="card-premium" style={{ gap: 20 }}>
          {mode === 'encode' ? (
            <>
              <h2 className="card-title">Message Secret à Cacher</h2>
              <textarea 
                value={secretText} 
                onChange={(e) => setSecretText(e.target.value)} 
                className="input-premium"
                placeholder="Écrivez le message secret qui sera dissimulé dans l'image..."
                style={{ minHeight: 140, fontSize: '0.85rem' }}
              />
              
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                <strong>Attention :</strong> Le format de sortie sera obligatoirement une image PNG non-compressée, car la compression JPG détruit les bits cachés.
              </p>

              <button onClick={handleEncode} className="btn-premium btn-primary" style={{ justifyContent: 'center' }} disabled={isProcessing}>
                {isProcessing ? 'Encodage...' : '🔒 Cacher & Télécharger PNG'}
              </button>
            </>
          ) : (
            <>
              <h2 className="card-title">Message extrait</h2>
              <textarea 
                readOnly 
                value={decodedText} 
                className="input-premium"
                placeholder="Le message décodé apparaîtra ici..."
                style={{ minHeight: 140, fontSize: '0.85rem', fontFamily: 'monospace' }}
              />

              <button onClick={handleDecode} className="btn-premium btn-primary" style={{ justifyContent: 'center' }} disabled={isProcessing}>
                {isProcessing ? 'Décodage...' : '🔓 Décoder l\'image'}
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Hidden Canvas for computation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

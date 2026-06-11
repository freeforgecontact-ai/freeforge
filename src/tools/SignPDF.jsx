import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import FolderButton from '../components/FolderButton';

export default function SignPDF({ goBack }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [pdfDocInfo, setPdfDocInfo] = useState({ pageCount: 0, currentPage: 1 });
  const [signatureImage, setSignatureImage] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#ffffff');
  const [penWidth, setPenWidth] = useState(3);
  
  // Placement controls
  const [sigPosition, setSigPosition] = useState({ x: 50, y: 50 });
  const [sigScale, setSigScale] = useState(1);
  const [targetPage, setTargetPage] = useState(1);
  
  const drawCanvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);

  // Initialize drawing canvas context
  useEffect(() => {
    if (drawCanvasRef.current) {
      const canvas = drawCanvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;
    }
  }, [penColor, penWidth]);

  const startDrawing = (e) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureImage(null);
  };

  const saveSignature = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureImage(dataUrl);
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPdfFile(file);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const bytes = new Uint8Array(event.target.result);
      setPdfBytes(bytes);
      try {
        const pdfDoc = await PDFDocument.load(bytes);
        setPdfDocInfo({
          pageCount: pdfDoc.getPageCount(),
          currentPage: 1
        });
        setTargetPage(1);
      } catch (err) {
        alert("Erreur lors de la lecture du fichier PDF. Assurez-vous qu'il n'est pas corrompu ou protégé.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadSignedPdf = async () => {
    if (!pdfBytes || !signatureImage) {
      alert("Veuillez charger un PDF et sauvegarder une signature au préalable.");
      return;
    }

    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pngImage = await pdfDoc.embedPng(signatureImage);
      
      const pageIndex = Math.min(Math.max(1, targetPage), pdfDocInfo.pageCount) - 1;
      const page = pdfDoc.getPage(pageIndex);
      const { width, height } = page.getSize();
      
      // Calculate placement
      // Scale coordinates from user UI to PDF page dimensions
      const sigWidth = 150 * sigScale;
      const sigHeight = 75 * sigScale;
      
      // pdf-lib uses bottom-left as origin (0,0)
      const xPos = (sigPosition.x / 100) * (width - sigWidth);
      const yPos = ((100 - sigPosition.y) / 100) * (height - sigHeight);

      page.drawImage(pngImage, {
        x: xPos,
        y: yPos,
        width: sigWidth,
        height: sigHeight,
      });

      const signedBytes = await pdfDoc.save();
      
      // Trigger download
      const blob = new Blob([signedBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `signed_${pdfFile.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la signature du PDF.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 8 }}>
            ← Retour
          </button>
          <h1 className="page-title">Signateur PDF Local</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Signez vos documents de façon 100% locale sans transférer vos fichiers sur Internet.</p>
        </div>
        <FolderButton toolId="sign_pdf" toolName="Signateur PDF" />
      </div>

      <div className="grid-2">
        {/* Left column: PDF upload & preview settings */}
        <div className="card-premium" style={{ gap: 20 }}>
          <h2 className="card-title">1. Importer le PDF</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label className="btn-premium btn-secondary" style={{ justifyContent: 'center', cursor: 'pointer' }}>
              📄 Choisir un fichier PDF
              <input type="file" accept=".pdf" onChange={handlePdfUpload} style={{ display: 'none' }} />
            </label>
            {pdfFile && (
              <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>
                Fichier chargé : {pdfFile.name} ({pdfDocInfo.pageCount} pages)
              </div>
            )}
          </div>

          {pdfBytes && (
            <>
              <h2 className="card-title" style={{ marginTop: 10 }}>2. Configurer le placement</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Page à signer (1 à {pdfDocInfo.pageCount}) :
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    max={pdfDocInfo.pageCount} 
                    value={targetPage} 
                    onChange={(e) => setTargetPage(parseInt(e.target.value) || 1)} 
                    className="input-premium"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Taille de la signature ({Math.round(sigScale * 100)}%) :
                  </label>
                  <input 
                    type="range" 
                    min="0.3" 
                    max="2.5" 
                    step="0.1" 
                    value={sigScale} 
                    onChange={(e) => setSigScale(parseFloat(e.target.value))} 
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Position Horizontale (X) :
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={sigPosition.x} 
                      onChange={(e) => setSigPosition(prev => ({ ...prev, x: parseInt(e.target.value) }))} 
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Position Verticale (Y) :
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={sigPosition.y} 
                      onChange={(e) => setSigPosition(prev => ({ ...prev, y: parseInt(e.target.value) }))} 
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              {signatureImage && (
                <button onClick={downloadSignedPdf} className="btn-premium btn-primary" style={{ marginTop: 16, justifyContent: 'center' }}>
                  🖊️ Signer & Télécharger le PDF
                </button>
              )}
            </>
          )}
        </div>

        {/* Right column: Draw Signature */}
        <div className="card-premium" style={{ gap: 20 }}>
          <h2 className="card-title">Rédiger votre signature</h2>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Couleur :</label>
              <input 
                type="color" 
                value={penColor} 
                onChange={(e) => setPenColor(e.target.value)} 
                style={{ width: 44, height: 36, border: 'none', borderRadius: 6, background: 'transparent', cursor: 'pointer' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Épaisseur du trait ({penWidth}px) :</label>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={penWidth} 
                onChange={(e) => setPenWidth(parseInt(e.target.value))} 
                style={{ width: '100%', marginTop: 8 }}
              />
            </div>
          </div>

          <div style={{ border: '1px dashed var(--border-light)', borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.3)', overflow: 'hidden', position: 'relative' }}>
            <canvas
              ref={drawCanvasRef}
              width={400}
              height={200}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              style={{ display: 'block', width: '100%', height: 200, cursor: 'crosshair' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={clearSignature} className="btn-premium btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
              🗑️ Effacer
            </button>
            <button onClick={saveSignature} className="btn-premium btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              💾 Confirmer Signature
            </button>
          </div>

          {signatureImage && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Signature active (Aperçu) :</span>
              <div style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img src={signatureImage} alt="Signature" style={{ maxHeight: 60, filter: penColor === '#ffffff' ? 'none' : 'drop-shadow(0 0 2px rgba(255,255,255,0.1))' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

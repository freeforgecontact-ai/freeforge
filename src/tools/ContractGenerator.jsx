import React, { useState, useRef, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function ContractGenerator({ goBack }) {
  const [templateType, setTemplateType] = useState('nda'); // nda, service, receipt
  
  // Universal Form States
  const [partyA, setPartyA] = useState('PGRG inc.');
  const [partyB, setPartyB] = useState('Jean Dupont');
  const [effectiveDate, setEffectiveDate] = useState('2026-06-11');
  const [governingLaw, setGoverningLaw] = useState('Québec, Canada');
  
  // Service contract states
  const [scopeOfWork, setScopeOfWork] = useState('Développement d\'une application web responsive avec tableau de bord.');
  const [paymentAmount, setPaymentAmount] = useState('5000');
  const [paymentTerms, setPaymentTerms] = useState('50% à la signature, 50% à la livraison.');

  // Receipt states
  const [receiptNumber, setReceiptNumber] = useState('REC-2026-001');
  const [receiptDescription, setReceiptDescription] = useState('Prestation de services de consultation technique.');

  // Signature Canvas
  const sigCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  const startDrawing = (e) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 8 }}>
            ← Retour
          </button>
          <h1 className="page-title">Générateur de Contrats & NDA</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Générez des accords juridiques et reçus professionnels prêts à signer et à imprimer.</p>
        </div>
        <FolderButton toolId="contract_generator" toolName="Générateur de Contrats" />
      </div>

      <div className="grid-2">
        {/* Left Column: Form Parameters */}
        <div className="card-premium no-print" style={{ gap: 16 }}>
          <h2 className="card-title">Choisir le Modèle</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              onClick={() => setTemplateType('nda')} 
              className={`btn-premium ${templateType === 'nda' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem' }}
            >
              🤝 NDA (Confidentialité)
            </button>
            <button 
              onClick={() => setTemplateType('service')} 
              className={`btn-premium ${templateType === 'service' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem' }}
            >
              💼 Contrat Freelance
            </button>
            <button 
              onClick={() => setTemplateType('receipt')} 
              className={`btn-premium ${templateType === 'receipt' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem' }}
            >
              📄 Reçu Simple
            </button>
          </div>

          <h2 className="card-title" style={{ marginTop: 10 }}>Informations Générales</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                Émetteur (Partie A) :
              </label>
              <input 
                type="text" 
                value={partyA} 
                onChange={(e) => setPartyA(e.target.value)} 
                className="input-premium"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                Destinataire (Partie B) :
              </label>
              <input 
                type="text" 
                value={partyB} 
                onChange={(e) => setPartyB(e.target.value)} 
                className="input-premium"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Date d'effet :
                </label>
                <input 
                  type="date" 
                  value={effectiveDate} 
                  onChange={(e) => setEffectiveDate(e.target.value)} 
                  className="input-premium"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Loi applicable :
                </label>
                <input 
                  type="text" 
                  value={governingLaw} 
                  onChange={(e) => setGoverningLaw(e.target.value)} 
                  className="input-premium"
                />
              </div>
            </div>

            {/* Service-specific fields */}
            {templateType === 'service' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Nature des services :</label>
                  <textarea 
                    value={scopeOfWork} 
                    onChange={(e) => setScopeOfWork(e.target.value)} 
                    className="input-premium"
                    style={{ minHeight: 60 }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Montant ($ CAD) :</label>
                    <input 
                      type="number" 
                      value={paymentAmount} 
                      onChange={(e) => setPaymentAmount(e.target.value)} 
                      className="input-premium"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Modalités de paiement :</label>
                    <input 
                      type="text" 
                      value={paymentTerms} 
                      onChange={(e) => setPaymentTerms(e.target.value)} 
                      className="input-premium"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Receipt-specific fields */}
            {templateType === 'receipt' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Numéro de reçu :</label>
                  <input 
                    type="text" 
                    value={receiptNumber} 
                    onChange={(e) => setReceiptNumber(e.target.value)} 
                    className="input-premium"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Description du paiement :</label>
                  <textarea 
                    value={receiptDescription} 
                    onChange={(e) => setReceiptDescription(e.target.value)} 
                    className="input-premium"
                    style={{ minHeight: 60 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Montant réglé ($ CAD) :</label>
                  <input 
                    type="number" 
                    value={paymentAmount} 
                    onChange={(e) => setPaymentAmount(e.target.value)} 
                    className="input-premium"
                  />
                </div>
              </>
            )}
          </div>

          <h2 className="card-title" style={{ marginTop: 10 }}>Apposer une Signature</h2>
          <div style={{ border: '1px dashed var(--border-light)', borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <canvas
              ref={sigCanvasRef}
              width={400}
              height={100}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              style={{ display: 'block', width: '100%', height: 100, cursor: 'crosshair' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={clearSignature} className="btn-premium btn-secondary" style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}>
              🗑️ Effacer
            </button>
            <button onClick={handlePrint} className="btn-premium btn-primary" style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem', justifyContent: 'center' }}>
              🖨️ Imprimer PDF
            </button>
          </div>
        </div>

        {/* Right Column: Print Preview document */}
        <div className="card-premium print-document" style={{ backgroundColor: '#ffffff', color: '#111827', padding: '40px', gap: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.4)', borderRadius: 12 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #8b5cf6', paddingBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#8b5cf6' }}>
                {templateType === 'nda' && 'ACCORD DE CONFIDENTIALITÉ (NDA)'}
                {templateType === 'service' && 'CONTRAT DE PRESTATION DE SERVICES'}
                {templateType === 'receipt' && 'REÇU PROFESSIONNEL'}
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Document généré localement le {effectiveDate}</span>
            </div>
            {templateType === 'receipt' && (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 'bold', display: 'block' }}>REÇU N°</span>
                <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>{receiptNumber}</span>
              </div>
            )}
          </div>

          {/* Parties */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem' }}>
            <p><strong>Émetteur / Partie A :</strong> {partyA}</p>
            <p><strong>Destinataire / Partie B :</strong> {partyB}</p>
          </div>

          {/* Main Terms Content */}
          <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#374151', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {templateType === 'nda' && (
              <>
                <p><strong>1. Objet :</strong> Le présent accord définit les conditions sous lesquelles les Parties s'engagent à préserver le caractère strictement confidentiel de toutes les informations techniques, commerciales ou financières échangées.</p>
                <p><strong>2. Obligations :</strong> La Partie B s'engage à ne pas divulguer, utiliser ou copier d'informations confidentielles partagées par la Partie A sans le consentement écrit de cette dernière.</p>
                <p><strong>3. Durée :</strong> Le présent engagement restera en vigueur pendant une durée de 3 ans à compter de la date d'effet.</p>
              </>
            )}

            {templateType === 'service' && (
              <>
                <p><strong>1. Description des services :</strong> L'Émetteur s'engage à exécuter pour le Destinataire les services suivants :</p>
                <p style={{ paddingLeft: 16, fontStyle: 'italic', borderLeft: '3px solid #e5e7eb' }}>{scopeOfWork}</p>
                <p><strong>2. Rémunération :</strong> En contrepartie des services rendus, le Destinataire versera à l'Émetteur un montant forfaitaire de <strong>{paymentAmount}$ CAD</strong> selon les modalités suivantes : {paymentTerms}.</p>
              </>
            )}

            {templateType === 'receipt' && (
              <>
                <p><strong>1. Prestation :</strong> L'Émetteur confirme avoir reçu du Destinataire le paiement pour la prestation suivante :</p>
                <p style={{ paddingLeft: 16, fontStyle: 'italic', borderLeft: '3px solid #e5e7eb' }}>{receiptDescription}</p>
                <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', padding: '12px 16px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Montant Total Acquitté :</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>{paymentAmount}$ CAD</span>
                </div>
              </>
            )}

            <p><strong>Dispositions générales :</strong> Le présent accord est régi et interprété conformément aux lois de la juridiction de <strong>{governingLaw}</strong>.</p>
          </div>

          {/* Signatures Panel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 40, borderTop: '1px solid #e5e7eb', paddingTop: 20 }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginBottom: 8 }}>Signature - Partie A</span>
              <div style={{ height: 60, border: '1px solid #e5e7eb', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontStyle: 'italic', color: '#9ca3af', fontSize: '0.85rem' }}>
                Mention : Lu et Approuvé
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginBottom: 8 }}>Signature - Partie B</span>
              <div style={{ height: 60, border: '1px solid #e5e7eb', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' }}>
                {hasSignature ? (
                  <canvas 
                    width={180} 
                    height={50} 
                    style={{ height: 50 }} 
                    ref={(el) => {
                      if (el && sigCanvasRef.current) {
                        const ctx = el.getContext('2d');
                        ctx.clearRect(0,0,180,50);
                        ctx.drawImage(sigCanvasRef.current, 0, 0, 180, 50);
                      }
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#4b5563', fontStyle: 'italic' }}>Signature tactile requise</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

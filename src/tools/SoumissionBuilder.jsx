import React, { useState, useEffect, useRef } from 'react';
import FolderButton from '../components/FolderButton';

export default function SoumissionBuilder({ goBack }) {
  // Load saved company details profile
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('freeforge_invoice_profile');
    return saved ? JSON.parse(saved) : {
      companyName: '',
      companyAddress: '',
      companyPhone: '',
      companyEmail: '',
      companyTps: '',
      companyTvq: '',
      companyLogo: null
    };
  });

  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  
  const [estimateNumber, setEstimateNumber] = useState('SOUM-2001');
  const [dateIssued, setDateIssued] = useState(() => new Date().toISOString().substring(0, 10));
  const [validityDays, setValidityDays] = useState(30);

  const [items, setItems] = useState([
    { id: 1, desc: 'Projet de développement Web / Design UI', rate: 1200, qty: 1 }
  ]);

  const [taxMode, setTaxMode] = useState('both'); // 'both' | 'tps' | 'none'
  const [generalTerms, setGeneralTerms] = useState('Dépôt de 30% requis au démarrage. Solde à la livraison.');

  // Signature pad states
  const sigCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  const handleItemChange = (id, key, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          [key]: key === 'desc' ? value : parseFloat(value) || 0
        };
      }
      return item;
    }));
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), desc: '', rate: 0, qty: 1 }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.rate * item.qty), 0);
  const tps = taxMode === 'both' || taxMode === 'tps' ? subtotal * 0.05 : 0;
  const tvq = taxMode === 'both' ? subtotal * 0.09975 : 0;
  const grandTotal = subtotal + tps + tvq;

  const validityDate = (() => {
    const d = new Date(dateIssued);
    d.setDate(d.getDate() + parseInt(validityDays));
    return d.toLocaleDateString('fr-CA');
  })();

  const formatCurrency = (val) => {
    return val.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });
  };

  // Signature canvas drawing event handlers (tactile & mouse compatible)
  const getCoordinates = (e) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // For mobile touch events vs desktop mouse events
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = sigCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = sigCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSigned(false);
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Top bar controls */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }} className="no-print">
        <button className="btn-premium btn-secondary" onClick={goBack} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          ← Retour
        </button>
        <span className="status-badge status-badge-primary">Comptabilité</span>
        <FolderButton toolId="soumission" toolName="Créateur de Soumissions" localStorageKeys={['freeforge_invoice_profile']} />
        
        <button className="btn-premium btn-primary" onClick={triggerPrint} style={{ marginLeft: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}>
          🖨️ Imprimer / PDF
        </button>
      </div>

      <h1 className="page-title no-print">Créateur de Soumissions</h1>
      <p className="page-subtitle no-print">Générez des estimations détaillées (Devis) avec signature numérique tactile en direct pour validation client.</p>

      {/* Grid editor */}
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24 }} className="responsive-split no-print">
        
        {/* Left Form column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Client Details */}
          <div className="card-premium" style={{ cursor: 'default', gap: 12 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>👤 Client (Destinataire)</h3>
            <input type="text" className="input-premium" placeholder="Nom ou entreprise client" value={clientName} onChange={e => setClientName(e.target.value)} />
            <textarea className="input-premium" placeholder="Adresse du client" value={clientAddress} onChange={e => setClientAddress(e.target.value)} style={{ minHeight: 60, fontSize: '0.85rem' }} />
            <input type="email" className="input-premium" placeholder="Courriel" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
          </div>

          {/* Quote details */}
          <div className="card-premium" style={{ cursor: 'default', gap: 12 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>📄 Détails du devis</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>N° Soumission</label>
                <input type="text" className="input-premium" value={estimateNumber} onChange={e => setEstimateNumber(e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Date</label>
                <input type="date" className="input-premium" value={dateIssued} onChange={e => setDateIssued(e.target.value)} />
              </div>
            </div>

            {/* Validity slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Validité : <strong>{validityDays} jours</strong></span>
              </div>
              <input type="range" min="15" max="90" step="15" value={validityDays} onChange={e => setValidityDays(e.target.value)} className="slider" style={{ height: 4 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Taxes appliquées</label>
              <select className="input-premium select-premium" value={taxMode} onChange={e => setTaxMode(e.target.value)} style={{ fontSize: '0.85rem' }}>
                <option value="both">TPS (5%) + TVQ (9,975%)</option>
                <option value="tps">TPS (5%)</option>
                <option value="none">Aucune taxe</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Conditions contractuelles</label>
              <input type="text" className="input-premium" value={generalTerms} onChange={e => setGeneralTerms(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Right Preview / Table column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card-premium" style={{ cursor: 'default', padding: 24 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16 }}>📋 Articles & Tarifs</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {items.map(item => (
                <div 
                  key={item.id}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 100px 70px 80px 40px', gap: 8, alignItems: 'center' }}
                >
                  <input type="text" className="input-premium" style={{ fontSize: '0.85rem', padding: '8px 12px' }} placeholder="Description du service" value={item.desc} onChange={e => handleItemChange(item.id, 'desc', e.target.value)} />
                  <input type="number" className="input-premium" style={{ fontSize: '0.85rem', padding: '8px 12px', textAlign: 'right' }} placeholder="Taux ($)" value={item.rate} onChange={e => handleItemChange(item.id, 'rate', e.target.value)} />
                  <input type="number" className="input-premium" style={{ fontSize: '0.85rem', padding: '8px 12px', textAlign: 'center' }} placeholder="Qté" value={item.qty} onChange={e => handleItemChange(item.id, 'qty', e.target.value)} />
                  <span style={{ fontSize: '0.85rem', textAlign: 'right', fontWeight: 'bold', paddingRight: 6 }}>
                    {formatCurrency(item.rate * item.qty)}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => removeItem(item.id)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem', padding: 0 }}
                    disabled={items.length === 1}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            <button type="button" className="btn-premium btn-secondary" onClick={addItem} style={{ fontSize: '0.8rem', padding: '8px 14px', borderRadius: 8 }}>
              + Ajouter une ligne
            </button>

            {/* Calculations summaries */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: 16, marginTop: 20 }}>
              {/* Signature pad editor for client */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>✍️ Signature pour acceptation</span>
                <div style={{ position: 'relative', width: 220, height: 100, backgroundColor: 'white', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                  <canvas
                    ref={sigCanvasRef}
                    width={220}
                    height={100}
                    style={{ cursor: 'crosshair', display: 'block' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  {hasSigned && (
                    <button
                      type="button"
                      onClick={clearSignature}
                      style={{ position: 'absolute', right: 4, bottom: 4, padding: '2px 6px', fontSize: '0.65rem', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', backgroundColor: '#eee', color: '#333' }}
                    >
                      Effacer
                    </button>
                  )}
                </div>
              </div>

              {/* Totals */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220, fontSize: '0.85rem', textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Sous-total :</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(subtotal)}</span>
                </div>
                {(taxMode === 'both' || taxMode === 'tps') && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>TPS (5%) :</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(tps)}</span>
                  </div>
                )}
                {taxMode === 'both' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>TVQ (9,975%) :</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(tvq)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent)', borderTop: '1px solid var(--border-light)', paddingTop: 8, marginTop: 4 }}>
                  <span>Total :</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* A4 Print Layout (only visible in print mode) */}
      <div className="print-only" style={{ display: 'none', color: '#000', backgroundColor: '#fff', padding: '30px', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #333', paddingBottom: 20, marginBottom: 20 }}>
          <div>
            {profile.companyLogo && <img src={profile.companyLogo} alt="Logo" style={{ maxHeight: 60, display: 'block', marginBottom: 10 }} />}
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{profile.companyName || 'Mon Entreprise'}</h1>
            <p style={{ fontSize: '0.85rem', margin: '4px 0', color: '#444', whiteSpace: 'pre-wrap' }}>{profile.companyAddress}</p>
            <p style={{ fontSize: '0.85rem', margin: '2px 0', color: '#444' }}>{profile.companyPhone} {profile.companyPhone && '|'} {profile.companyEmail}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '2rem', color: '#222', margin: 0, fontWeight: 'bold' }}>SOUMISSION</h2>
            <p style={{ fontSize: '0.9rem', margin: '6px 0' }}>N° Soumission : <strong>{estimateNumber}</strong></p>
            <p style={{ fontSize: '0.85rem', margin: '2px 0', color: '#444' }}>Émise le : {dateIssued}</p>
            <p style={{ fontSize: '0.85rem', margin: '2px 0', color: '#444' }}>Offre valide jusqu'au : <strong>{validityDate}</strong></p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 30 }}>
          <div>
            <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: '#555', borderBottom: '1px solid #ccc', paddingBottom: 4, margin: '0 0 8px 0' }}>Destinataire</h3>
            <h4 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0 0 4px 0' }}>{clientName || 'Client'}</h4>
            <p style={{ fontSize: '0.85rem', margin: 0, color: '#444', whiteSpace: 'pre-wrap' }}>{clientAddress}</p>
            <p style={{ fontSize: '0.85rem', margin: '4px 0 0 0', color: '#444' }}>{clientEmail}</p>
          </div>
        </div>

        {/* Lines table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
          <thead>
            <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #ccc' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.85rem' }}>Description du service</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '0.85rem', width: 100 }}>Taux</th>
              <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '0.85rem', width: 60 }}>Qté</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '0.85rem', width: 120 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px 12px', fontSize: '0.85rem' }}>{item.desc || 'Services'}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '0.85rem' }}>{formatCurrency(item.rate)}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '0.85rem' }}>{item.qty}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 'bold' }}>{formatCurrency(item.rate * item.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Signature & Totals layout for printing */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 30, alignItems: 'flex-start', marginTop: 24 }}>
          {/* Printed Signature Box */}
          <div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 'bold', margin: '0 0 6px 0' }}>Signature pour acceptation du devis</h3>
            <div style={{ width: 220, height: 100, border: '1px solid #ccc', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa' }}>
              {hasSigned && sigCanvasRef.current ? (
                <img 
                  src={sigCanvasRef.current.toDataURL()} 
                  alt="Signature" 
                  style={{ width: 220, height: 100, objectFit: 'contain' }} 
                />
              ) : (
                <span style={{ fontSize: '0.75rem', color: '#999' }}>Signer sur l'écran avant d'imprimer</span>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', margin: '6px 0 0 0', color: '#666' }}>Date de signature : ___________________</p>
          </div>

          {/* Totals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Sous-total :</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {(taxMode === 'both' || taxMode === 'tps') && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>TPS (5,00 %) :</span>
                <span>{formatCurrency(tps)}</span>
              </div>
            )}
            {taxMode === 'both' && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>TVQ (9,975 %) :</span>
                <span>{formatCurrency(tvq)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 'bold', borderTop: '2px solid #333', paddingTop: 8, marginTop: 4 }}>
              <span>Total :</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Business details */}
        <div style={{ borderTop: '1px solid #ccc', paddingTop: 16, marginTop: 40, fontSize: '0.75rem', color: '#555', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ margin: '2px 0' }}>N° TPS : <strong>{profile.companyTps || 'Exempte'}</strong></p>
            <p style={{ margin: '2px 0' }}>N° TVQ : <strong>{profile.companyTvq || 'Exempte'}</strong></p>
            <p style={{ margin: '6px 0 0 0', fontStyle: 'italic' }}>Note: {generalTerms}</p>
          </div>
          <div style={{ textAlign: 'right', fontStyle: 'italic' }}>
            Estimé préparé avec soin.
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import FolderButton from '../components/FolderButton';

export default function ReceiptLogger({ goBack }) {
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('freeforge_receipt_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('Fournitures de bureau');
  const [subtotal, setSubtotal] = useState('');
  const [tps, setTps] = useState('');
  const [tvq, setTvq] = useState('');
  
  // Image states
  const [imageSrc, setImageSrc] = useState(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [binarize, setBinarize] = useState(false);
  const [threshold, setThreshold] = useState(128);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270

  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('freeforge_receipt_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Handle image loading
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target.result);
      setRotation(0);
      setBrightness(100);
      setContrast(100);
      setBinarize(false);
    };
    reader.readAsDataURL(file);
  };

  // Redraw canvas with filters applied
  useEffect(() => {
    if (!imageSrc || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      // Handle rotation dimensions
      const is90or270 = rotation === 90 || rotation === 270;
      const width = is90or270 ? img.height : img.width;
      const height = is90or270 ? img.width : img.height;
      
      // Limit dimensions to fit workspace preview elegantly
      const maxDim = 800;
      let scale = 1;
      if (width > maxDim || height > maxDim) {
        scale = maxDim / Math.max(width, height);
      }
      
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Save context state, rotate, draw and restore
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      
      const drawW = (is90or270 ? canvas.height : canvas.width);
      const drawH = (is90or270 ? canvas.width : canvas.height);
      
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
      
      // Apply pixel level visual filters
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      
      const bFactor = brightness / 100;
      const cFactor = (contrast / 100);
      
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i+1];
        let b = data[i+2];
        
        // 1. Brightness
        r *= bFactor;
        g *= bFactor;
        b *= bFactor;
        
        // 2. Contrast
        r = ((r - 128) * cFactor) + 128;
        g = ((g - 128) * cFactor) + 128;
        b = ((b - 128) * cFactor) + 128;
        
        // 3. Binarization (convert to pure high-contrast black & white)
        if (binarize) {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const finalVal = gray >= threshold ? 255 : 0;
          r = finalVal;
          g = finalVal;
          b = finalVal;
        }
        
        // Clamp values
        data[i] = Math.min(255, Math.max(0, r));
        data[i+1] = Math.min(255, Math.max(0, g));
        data[i+2] = Math.min(255, Math.max(0, b));
      }
      
      ctx.putImageData(imgData, 0, 0);
    };
    img.src = imageSrc;
  }, [imageSrc, brightness, contrast, binarize, threshold, rotation]);

  // Quick tax calculation helper
  const autoCalculateTaxes = () => {
    const sub = parseFloat(subtotal) || 0;
    if (sub <= 0) return;
    setTps((sub * 0.05).toFixed(2));
    setTvq((sub * 0.09975).toFixed(2));
  };

  const addExpense = (e) => {
    e.preventDefault();
    const sub = parseFloat(subtotal) || 0;
    const computedTps = parseFloat(tps) || 0;
    const computedTvq = parseFloat(tvq) || 0;
    
    let canvasDataUrl = null;
    if (canvasRef.current && imageSrc) {
      canvasDataUrl = canvasRef.current.toDataURL('image/jpeg', 0.85);
    }

    const newExpense = {
      id: Date.now(),
      date,
      merchant: merchant.trim(),
      category,
      subtotal: sub,
      tps: computedTps,
      tvq: computedTvq,
      total: sub + computedTps + computedTvq,
      receiptImage: canvasDataUrl // Base64 of the filtered canvas
    };

    setExpenses([newExpense, ...expenses]);
    
    // Clear inputs
    setMerchant('');
    setSubtotal('');
    setTps('');
    setTvq('');
    setImageSrc(null);
  };

  const deleteExpense = (id) => {
    if (confirm("Supprimer cette dépense du registre ?")) {
      setExpenses(expenses.filter(exp => exp.id !== id));
    }
  };

  // ZIP download containing CSV spreadsheet + all processed receipt images
  const handleExportZip = async () => {
    if (expenses.length === 0) return;
    
    const zip = new JSZip();
    
    // Create CSV content
    let csv = "ID,Date,Commercant,Categorie,Sous-Total ($),TPS ($),TVQ ($),Total ($),Fichier Recu\n";
    
    expenses.forEach((e, index) => {
      const fileName = e.receiptImage ? `recu_${e.id}.jpg` : 'Aucun';
      const row = [
        e.id,
        e.date,
        `"${e.merchant.replace(/"/g, '""')}"`,
        `"${e.category.replace(/"/g, '""')}"`,
        e.subtotal.toFixed(2),
        e.tps.toFixed(2),
        e.tvq.toFixed(2),
        e.total.toFixed(2),
        fileName
      ].join(",");
      csv += row + "\n";
      
      // Append image if present
      if (e.receiptImage) {
        // Strip dataUrl header to write raw base64 data to zip
        const base64Data = e.receiptImage.split(',')[1];
        zip.file(fileName, base64Data, { base64: true });
      }
    });

    zip.file("rapport_depenses.csv", csv);

    // Generate zip blob and trigger client download
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `compta_recus_${new Date().getFullYear()}.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearAllExpenses = () => {
    if (confirm("Voulez-vous supprimer TOUTES les dépenses enregistrées de votre disque ?")) {
      setExpenses([]);
      localStorage.removeItem('freeforge_receipt_expenses');
    }
  };

  // Group total calculations
  const totalSubtotal = expenses.reduce((sum, e) => sum + e.subtotal, 0);
  const totalTaxes = expenses.reduce((sum, e) => sum + e.tps + e.tvq, 0);
  const grandTotal = expenses.reduce((sum, e) => sum + e.total, 0);

  return (
    <div>
      {/* Navigation */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <button className="btn-premium btn-secondary" onClick={goBack} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          ← Retour
        </button>
        <span className="status-badge status-badge-primary">Comptabilité</span>
        <FolderButton toolId="receipt_logger" toolName="Gestionnaire de Reçus" localStorageKeys={['freeforge_receipt_expenses']} />
      </div>

      <h1 className="page-title">Gestionnaire & Numériseur de Reçus</h1>
      <p className="page-subtitle">Prenez en photo vos reçus, ajustez les contrastes localement pour optimiser la lisibilité et exportez le registre complet en un fichier ZIP.</p>

      {/* Summary stats */}
      <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div className="card-premium" style={{ cursor: 'default', padding: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sous-total cumulé</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{totalSubtotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</div>
        </div>
        <div className="card-premium" style={{ cursor: 'default', padding: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Taxes cumulées (TPS+TVQ)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--secondary)' }}>{totalTaxes.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</div>
        </div>
        <div className="card-premium" style={{ cursor: 'default', padding: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dépenses totales TTC</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>{grandTotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="responsive-split">
        
        {/* Form and image crop area */}
        <form className="card-premium" onSubmit={addExpense} style={{ cursor: 'default', gap: 14 }}>
          <h2 className="card-title" style={{ fontSize: '1.05rem' }}>🧾 Consigner un reçu</h2>
          
          {/* File Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fichier image du reçu</label>
            <input type="file" accept="image/*" className="input-premium" onChange={handleImageUpload} />
          </div>

          {/* Canvas workspace if image uploaded */}
          {imageSrc && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid var(--border-light)', padding: 12, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <canvas ref={canvasRef} style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 6, backgroundColor: '#000' }} />
              
              {/* Image control options */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  type="button" 
                  className="btn-premium btn-secondary" 
                  style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: 6 }}
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                >
                  🔄 Pivoter 90°
                </button>
                <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={binarize} onChange={e => setBinarize(e.target.checked)} />
                  Binariser (Noir & Blanc)
                </label>
              </div>

              {/* Sliders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Luminosité ({brightness}%)</span>
                </div>
                <input type="range" min="50" max="150" value={brightness} onChange={e => setBrightness(parseInt(e.target.value))} className="slider" style={{ height: 3 }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span>Contraste ({contrast}%)</span>
                </div>
                <input type="range" min="50" max="150" value={contrast} onChange={e => setContrast(parseInt(e.target.value))} className="slider" style={{ height: 3 }} />

                {binarize && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span>Seuil de binarisation ({threshold})</span>
                    </div>
                    <input type="range" min="10" max="240" value={threshold} onChange={e => setThreshold(parseInt(e.target.value))} className="slider" style={{ height: 3 }} />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Text fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Commerçant</label>
              <input type="text" className="input-premium" value={merchant} onChange={e => setMerchant(e.target.value)} placeholder="Ex: Bureau en Gros" required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Date</label>
              <input type="date" className="input-premium" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Catégorie</label>
            <select className="input-premium select-premium" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="Fournitures de bureau">Fournitures de bureau</option>
              <option value="Repas et divertissements">Repas et divertissements</option>
              <option value="Deplacement et auto">Déplacement et auto</option>
              <option value="Abonnements et logiciels">Abonnements et logiciels</option>
              <option value="Frais de télécommunication">Frais de télécommunication</option>
              <option value="Autres dépenses">Autres dépenses</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sous-total</label>
              <input type="number" step="0.01" min="0" className="input-premium" value={subtotal} onChange={e => setSubtotal(e.target.value)} placeholder="0.00" required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                TPS (5%)
                <span style={{ cursor: 'pointer', color: 'var(--primary)' }} onClick={autoCalculateTaxes} title="Calculer taxes">⚡</span>
              </label>
              <input type="number" step="0.01" min="0" className="input-premium" value={tps} onChange={e => setTps(e.target.value)} placeholder="0.00" required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                TVQ (9.975%)
                <span style={{ cursor: 'pointer', color: 'var(--primary)' }} onClick={autoCalculateTaxes} title="Calculer taxes">⚡</span>
              </label>
              <input type="number" step="0.01" min="0" className="input-premium" value={tvq} onChange={e => setTvq(e.target.value)} placeholder="0.00" required />
            </div>
          </div>

          <button type="submit" className="btn-premium btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}>
            Ajouter la dépense
          </button>
        </form>

        {/* Expenses List Panel */}
        <div className="card-premium" style={{ cursor: 'default', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>📋 Registre des dépenses</h3>
            
            <div style={{ display: 'flex', gap: 10 }}>
              {expenses.length > 0 && (
                <>
                  <button className="btn-premium btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={handleExportZip}>
                    📦 Télécharger ZIP (Images+CSV)
                  </button>
                  <button className="btn-premium btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#ef4444' }} onClick={clearAllExpenses}>
                    Vider
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
            {expenses.length > 0 ? (
              expenses.map(exp => (
                <div 
                  key={exp.id}
                  style={{ display: 'grid', gridTemplateColumns: '70px 1fr 100px 40px', alignItems: 'center', padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border-light)', gap: 10, fontSize: '0.8rem' }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>{exp.date}</span>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{exp.merchant}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{exp.category}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    <div style={{ color: 'var(--accent)' }}>{exp.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Taxes: {formatCurrency(exp.tps + exp.tvq)}</div>
                  </div>
                  <button 
                    onClick={() => deleteExpense(exp.id)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem', textAlign: 'right' }}
                  >
                    🗑️
                  </button>
                </div>
              ))
            ) : (
              <div style={{ padding: '40px 0', textHTML: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center' }}>
                Aucun reçu enregistré dans le registre.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// Inline helper for formatting
function formatCurrency(val) {
  return val.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });
}

import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function FactureBuilder({ goBack }) {
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
  
  const [invoiceNumber, setInvoiceNumber] = useState('FAC-1001');
  const [dateIssued, setDateIssued] = useState(() => new Date().toISOString().substring(0, 10));
  const [dateDue, setDateDue] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().substring(0, 10);
  });

  const [items, setItems] = useState([
    { id: 1, desc: 'Consultation & Services professionnels', rate: 100, qty: 8 }
  ]);

  const [taxMode, setTaxMode] = useState('both'); // 'both' | 'tps' | 'none'
  const [paymentTerms, setPaymentTerms] = useState('Payable dans les 30 jours.');

  // Save company profile template
  useEffect(() => {
    localStorage.setItem('freeforge_invoice_profile', JSON.stringify(profile));
  }, [profile]);

  const handleProfileChange = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      handleProfileChange('companyLogo', event.target.result);
    };
    reader.readAsDataURL(file);
  };

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

  const formatCurrency = (val) => {
    return val.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });
  };

  // Export invoice data to local JSON file
  const handleExportJson = () => {
    const data = {
      profile,
      client: { clientName, clientAddress, clientEmail },
      invoiceNumber,
      dateIssued,
      dateDue,
      items,
      taxMode,
      paymentTerms
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement('a');
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `facture_${invoiceNumber.toLowerCase()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import invoice data from JSON file
  const handleImportJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported.profile) setProfile(imported.profile);
        if (imported.client) {
          setClientName(imported.client.clientName || '');
          setClientAddress(imported.client.clientAddress || '');
          setClientEmail(imported.client.clientEmail || '');
        }
        if (imported.invoiceNumber) setInvoiceNumber(imported.invoiceNumber);
        if (imported.dateIssued) setDateIssued(imported.dateIssued);
        if (imported.dateDue) setDateDue(imported.dateDue);
        if (imported.items) setItems(imported.items);
        if (imported.taxMode) setTaxMode(imported.taxMode);
        if (imported.paymentTerms) setPaymentTerms(imported.paymentTerms);
      } catch (err) {
        alert("Erreur lors de la lecture du fichier JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
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
        <FolderButton toolId="facture" toolName="Factures Professionnelles" localStorageKeys={['freeforge_invoice_profile']} />
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <label className="btn-premium btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', cursor: 'pointer' }}>
            📥 Importer JSON
            <input type="file" accept=".json" onChange={handleImportJson} style={{ display: 'none' }} />
          </label>
          <button className="btn-premium btn-secondary" onClick={handleExportJson} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            📤 Exporter JSON
          </button>
          <button className="btn-premium btn-primary" onClick={triggerPrint} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            🖨️ Imprimer / PDF
          </button>
        </div>
      </div>

      <h1 className="page-title no-print">Créateur de Factures</h1>
      <p className="page-subtitle no-print">Créez et personnalisez des factures prêtes à l'impression au format canadien et québécois.</p>

      {/* Main split layout for workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24 }} className="responsive-split no-print">
        
        {/* Left column: editing fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Company Profile template */}
          <div className="card-premium" style={{ cursor: 'default', gap: 12 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>⚜️ Votre Profil (Émetteur)</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Logo d'entreprise</label>
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="input-premium" style={{ fontSize: '0.8rem', padding: '6px 12px' }} />
              {profile.companyLogo && (
                <button 
                  type="button" 
                  onClick={() => handleProfileChange('companyLogo', null)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.7rem', cursor: 'pointer', textAlign: 'left', marginTop: 2 }}
                >
                  Supprimer le logo
                </button>
              )}
            </div>

            <input type="text" className="input-premium" placeholder="Nom de l'entreprise" value={profile.companyName} onChange={e => handleProfileChange('companyName', e.target.value)} />
            <textarea className="input-premium" placeholder="Adresse complète" value={profile.companyAddress} onChange={e => handleProfileChange('companyAddress', e.target.value)} style={{ minHeight: 60, fontSize: '0.85rem' }} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input type="text" className="input-premium" placeholder="Téléphone" value={profile.companyPhone} onChange={e => handleProfileChange('companyPhone', e.target.value)} style={{ fontSize: '0.85rem' }} />
              <input type="email" className="input-premium" placeholder="Courriel" value={profile.companyEmail} onChange={e => handleProfileChange('companyEmail', e.target.value)} style={{ fontSize: '0.85rem' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input type="text" className="input-premium" placeholder="N° TPS (ex: 123456789 RT 0001)" value={profile.companyTps} onChange={e => handleProfileChange('companyTps', e.target.value)} style={{ fontSize: '0.85rem' }} />
              <input type="text" className="input-premium" placeholder="N° TVQ (ex: 1234567890 TQ 0001)" value={profile.companyTvq} onChange={e => handleProfileChange('companyTvq', e.target.value)} style={{ fontSize: '0.85rem' }} />
            </div>
          </div>

          {/* Client Details */}
          <div className="card-premium" style={{ cursor: 'default', gap: 12 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>👤 Client (Destinataire)</h3>
            <input type="text" className="input-premium" placeholder="Nom ou entreprise client" value={clientName} onChange={e => setClientName(e.target.value)} />
            <textarea className="input-premium" placeholder="Adresse du client" value={clientAddress} onChange={e => setClientAddress(e.target.value)} style={{ minHeight: 60, fontSize: '0.85rem' }} />
            <input type="email" className="input-premium" placeholder="Courriel" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
          </div>

          {/* Invoice Details */}
          <div className="card-premium" style={{ cursor: 'default', gap: 12 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>📄 Métadonnées de Facturation</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>N° Facture</label>
                <input type="text" className="input-premium" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Taxes</label>
                <select className="input-premium select-premium" value={taxMode} onChange={e => setTaxMode(e.target.value)} style={{ fontSize: '0.85rem' }}>
                  <option value="both">TPS (5%) + TVQ (9,975%)</option>
                  <option value="tps">TPS seule (5%)</option>
                  <option value="none">Exonéré de taxes</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Date d'émission</label>
                <input type="date" className="input-premium" value={dateIssued} onChange={e => setDateIssued(e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Échéance</label>
                <input type="date" className="input-premium" value={dateDue} onChange={e => setDateDue(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Conditions de paiement / Note</label>
              <input type="text" className="input-premium" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Right column: Interactive preview list and totals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card-premium" style={{ cursor: 'default', padding: 24 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16 }}>📋 Lignes de Facture</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {items.map(item => (
                <div 
                  key={item.id}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 100px 70px 80px 40px', gap: 8, alignItems: 'center' }}
                >
                  <input type="text" className="input-premium" style={{ fontSize: '0.85rem', padding: '8px 12px' }} placeholder="Description de l'article" value={item.desc} onChange={e => handleItemChange(item.id, 'desc', e.target.value)} />
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--border-light)', paddingTop: 16, marginTop: 20, maxWidth: 300, marginLeft: 'auto', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Sous-total :</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(subtotal)}</span>
              </div>
              {(taxMode === 'both' || taxMode === 'tps') && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>TPS (5,00 %) :</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(tps)}</span>
                </div>
              )}
              {taxMode === 'both' && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>TVQ (9,975 %) :</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(tvq)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent)', borderTop: '1px solid var(--border-light)', paddingTop: 8, marginTop: 4 }}>
                <span>Total net :</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* A4 Print Layout (only visible in print mode) */}
      <div className="print-only" style={{ display: 'none', color: '#000', backgroundColor: '#fff', padding: '30px', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #333', paddingBottom: 20, marginBottom: 20 }}>
          <div>
            {profile.companyLogo && <img src={profile.companyLogo} alt="Logo" style={{ maxHeight: 60, marginBottom: 10, display: 'block' }} />}
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{profile.companyName || 'Mon Entreprise'}</h1>
            <p style={{ fontSize: '0.85rem', margin: '4px 0', color: '#444', whiteSpace: 'pre-wrap' }}>{profile.companyAddress}</p>
            <p style={{ fontSize: '0.85rem', margin: '2px 0', color: '#444' }}>{profile.companyPhone} {profile.companyPhone && '|'} {profile.companyEmail}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '2rem', color: '#222', margin: 0, fontWeight: 'bold' }}>FACTURE</h2>
            <p style={{ fontSize: '0.9rem', margin: '6px 0' }}>N° Facture : <strong>{invoiceNumber}</strong></p>
            <p style={{ fontSize: '0.85rem', margin: '2px 0', color: '#444' }}>Émise le : {dateIssued}</p>
            <p style={{ fontSize: '0.85rem', margin: '2px 0', color: '#444' }}>Échéance : <strong>{dateDue}</strong></p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 30 }}>
          <div>
            <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: '#555', borderBottom: '1px solid #ccc', paddingBottom: 4, margin: '0 0 8px 0' }}>Facturé à</h3>
            <h4 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0 0 4px 0' }}>{clientName || 'Client'}</h4>
            <p style={{ fontSize: '0.85rem', margin: 0, color: '#444', whiteSpace: 'pre-wrap' }}>{clientAddress}</p>
            <p style={{ fontSize: '0.85rem', margin: '4px 0 0 0', color: '#444' }}>{clientEmail}</p>
          </div>
          <div>
            {/* Payment instructions or references */}
          </div>
        </div>

        {/* Invoice lines table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
          <thead>
            <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #ccc' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.85rem' }}>Description de l'article</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '0.85rem', width: 100 }}>Taux</th>
              <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '0.85rem', width: 60 }}>Qté</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '0.85rem', width: 120 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px 12px', fontSize: '0.85rem' }}>{item.desc || 'Services'}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '0.85rem' }}>{formatCurrency(item.rate)}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '0.85rem' }}>{item.qty}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 'bold' }}>{formatCurrency(item.rate * item.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Financial sums */}
        <div style={{ width: 280, marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem' }}>
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
            <span>Total net :</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        {/* Business Registration Details and payment notes */}
        <div style={{ borderTop: '1px solid #ccc', paddingTop: 16, marginTop: 40, fontSize: '0.75rem', color: '#555', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ margin: '2px 0' }}>N° TPS : <strong>{profile.companyTps || 'Exempte'}</strong></p>
            <p style={{ margin: '2px 0' }}>N° TVQ : <strong>{profile.companyTvq || 'Exempte'}</strong></p>
            <p style={{ margin: '6px 0 0 0', fontStyle: 'italic' }}>Note: {paymentTerms}</p>
          </div>
          <div style={{ textAlign: 'right', fontStyle: 'italic' }}>
            Merci pour votre confiance !
          </div>
        </div>
      </div>
    </div>
  );
}

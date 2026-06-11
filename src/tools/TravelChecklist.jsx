import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function TravelChecklist({ goBack }) {
  const [climate, setClimate] = useState('temperate');
  const [duration, setDuration] = useState(7);
  const [list, setList] = useState(() => {
    try {
      const saved = localStorage.getItem('fl_travel');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error reading fl_travel", e);
      return [];
    }
  });
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('custom');

  useEffect(() => {
    localStorage.setItem('fl_travel', JSON.stringify(list));
  }, [list]);

  const handleGenerate = () => {
    const essentialItems = [
      { name: 'Passeport, Visa & Cartes d\'identité', category: 'essentials', checked: false },
      { name: 'Billets d\'avion / de train & Réservations', category: 'essentials', checked: false },
      { name: 'Assurance voyage & Papiers de santé', category: 'essentials', checked: false },
      { name: 'Portefeuille (Cartes de crédit & Devises locales)', category: 'essentials', checked: false },
      { name: 'Téléphone portable, chargeur & adaptateur international', category: 'essentials', checked: false },
      { name: 'Trousse de toilette de base (Brosse à dents, dentifrice...)', category: 'essentials', checked: false },
      { name: 'Trousse médicale (médicaments personnels, antidouleurs)', category: 'essentials', checked: false }
    ];

    // Calculate clothing counts dynamically based on duration
    const tshirtsCount = Math.min(20, Math.max(1, duration));
    const underwearCount = Math.min(20, Math.max(1, duration + 1));
    const pantsCount = Math.max(1, Math.min(7, Math.ceil(duration / 3)));
    const pyjamasCount = Math.max(1, Math.min(4, Math.ceil(duration / 5)));
    const shoesCount = duration > 4 ? 2 : 1;

    const clothingItems = [
      { name: `${tshirtsCount}x Hauts (T-shirts, Chemises)`, category: 'clothes', checked: false },
      { name: `${underwearCount}x Sous-vêtements & Chaussettes`, category: 'clothes', checked: false },
      { name: `${pantsCount}x Bas (Pantalons, Shorts, Jupes)`, category: 'clothes', checked: false },
      { name: `${pyjamasCount}x Vêtements de nuit / Pyjamas`, category: 'clothes', checked: false },
      { name: `${shoesCount}x Paire(s) de chaussures confortables`, category: 'clothes', checked: false },
      { name: 'Veste légère ou pull-over polyvalent', category: 'clothes', checked: false }
    ];

    const climateItemsMap = {
      cold: [
        { name: 'Manteau d\'hiver chaud ou doudoune imperméable', category: 'climate', checked: false },
        { name: 'Tuque / bonnet chaud, gants doublés & écharpe', category: 'climate', checked: false },
        { name: 'Bottes d\'hiver imperméables et chaudes', category: 'climate', checked: false },
        { name: 'Vêtements thermiques (haut et bas)', category: 'climate', checked: false },
        { name: 'Crème hydratante intense & baume à lèvres', category: 'climate', checked: false }
      ],
      hot: [
        { name: 'Maillot de bain', category: 'climate', checked: false },
        { name: 'Crème solaire (protection élevée)', category: 'climate', checked: false },
        { name: 'Lunettes de soleil de qualité', category: 'climate', checked: false },
        { name: 'Chapeau à larges bords ou casquette', category: 'climate', checked: false },
        { name: 'Sandales / Tongs', category: 'climate', checked: false },
        { name: 'Répulsif contre les moustiques', category: 'climate', checked: false }
      ],
      temperate: [
        { name: 'Parapluie de poche ou veste imperméable légère', category: 'climate', checked: false },
        { name: 'Lunettes de soleil', category: 'climate', checked: false },
        { name: 'Couches de vêtements superposables (Cardigan, Pull)', category: 'climate', checked: false },
        { name: 'Crème solaire de base', category: 'climate', checked: false }
      ],
      desert: [
        { name: 'Chapeau couvrant & Lunettes de soleil teintées', category: 'climate', checked: false },
        { name: 'Vêtements amples à manches longues en coton / lin', category: 'climate', checked: false },
        { name: 'Écharpe en coton légère (contre le sable / vent)', category: 'climate', checked: false },
        { name: 'Baume à lèvres protecteur & Crème solaire haute protection', category: 'climate', checked: false },
        { name: 'Gourde isotherme grande capacité', category: 'climate', checked: false },
        { name: 'Veste chaude pour les nuits fraîches dans le désert', category: 'climate', checked: false }
      ]
    };

    const specificClimateItems = climateItemsMap[climate] || [];
    
    // Combine list
    setList([
      ...essentialItems,
      ...clothingItems,
      ...specificClimateItems
    ]);
  };

  const handleToggle = (id) => {
    setList(prev => prev.map((item, idx) => idx === id ? { ...item, checked: !item.checked } : item));
  };

  const handleAddCustomItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const newItem = {
      name: newItemName.trim(),
      category: newItemCategory,
      checked: false
    };
    setList([...list, newItem]);
    setNewItemName('');
  };

  const handleRemoveItem = (id) => {
    setList(prev => prev.filter((_, idx) => idx !== id));
  };

  const handleClear = () => {
    if (confirm("Voulez-vous réinitialiser complètement votre checklist ?")) {
      setList([]);
    }
  };

  const categories = {
    essentials: 'Essentials & Documents',
    clothes: 'Vêtements & Chaussures',
    climate: 'Spécifique Climat',
    custom: 'Articles Personnalisés'
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>🎒 Checklist de Voyage Dynamique</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Préparez vos valises de façon intelligente en fonction de la durée et du climat.</p>
        </div>
        <FolderButton toolId="travel_checklist" toolName="TravelChecklist" localStorageKeys={['fl_travel']} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Configuration Form */}
          <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 14, height: 'fit-content' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Génération Automatique</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Durée du voyage (jours) :</label>
              <input 
                type="number" 
                min="1" 
                max="90" 
                value={duration} 
                onChange={e => setDuration(Math.max(1, parseInt(e.target.value) || 1))} 
                className="input-premium" 
                style={{ width: '100%', padding: 8, borderRadius: 6 }} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Climat à destination :</label>
              <select 
                value={climate} 
                onChange={e => setClimate(e.target.value)} 
                className="input-premium" 
                style={{ width: '100%', padding: 8, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}
              >
                <option value="temperate">🌦️ Tempéré</option>
                <option value="hot">☀️ Chaud & Tropical</option>
                <option value="cold">❄️ Froid Polaire / Hivernal</option>
                <option value="desert">🌵 Désertique</option>
              </select>
            </div>

            <button onClick={handleGenerate} className="btn-premium btn-primary" style={{ width: '100%', padding: 10, borderRadius: 8, fontWeight: 'bold', justifyContent: 'center', marginTop: 8 }}>
              ⚡ Générer la checklist
            </button>
          </div>

          {/* Add custom item form */}
          <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Ajouter un article personnalisé</h2>
            <form onSubmit={handleAddCustomItem} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input 
                type="text" 
                required 
                value={newItemName} 
                onChange={e => setNewItemName(e.target.value)} 
                placeholder="Nom de l'article (ex: Appareil photo)" 
                className="input-premium" 
                style={{ padding: 8, borderRadius: 6 }} 
              />
              <select 
                value={newItemCategory} 
                onChange={e => setNewItemCategory(e.target.value)} 
                className="input-premium"
                style={{ padding: 8, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}
              >
                <option value="essentials">Essentials & Documents</option>
                <option value="clothes">Vêtements</option>
                <option value="climate">Spécifique Climat</option>
                <option value="custom">Autre / Personnalisé</option>
              </select>
              <button type="submit" className="btn-premium btn-secondary" style={{ padding: 8, borderRadius: 8, fontWeight: 'bold', justifyContent: 'center' }}>
                + Ajouter à la liste
              </button>
            </form>
          </div>
        </div>

        {/* Packing Checklist */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Ma Valise</h2>
            {list.length > 0 && (
              <button onClick={handleClear} className="btn-premium btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: 6, color: '#ef4444' }}>
                Tout réinitialiser
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 500, overflowY: 'auto' }}>
            {list.length > 0 ? (
              Object.keys(categories).map(catKey => {
                const catItems = list.map((item, idx) => ({ ...item, originalIndex: idx })).filter(item => item.category === catKey);
                if (catItems.length === 0) return null;
                
                return (
                  <div key={catKey} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase', paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {categories[catKey]} ({catItems.filter(i => i.checked).length}/{catItems.length})
                    </h3>
                    {catItems.map(item => (
                      <div 
                        key={item.originalIndex}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          padding: '10px 14px',
                          backgroundColor: item.checked ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.01)',
                          borderRadius: 8,
                          border: '1px solid var(--border-light)',
                          fontSize: '0.9rem'
                        }}
                      >
                        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flex: 1 }}>
                          <input 
                            type="checkbox" 
                            checked={item.checked} 
                            onChange={() => handleToggle(item.originalIndex)} 
                            style={{ width: 16, height: 16 }}
                          />
                          <span style={{ 
                            textDecoration: item.checked ? 'line-through' : 'none', 
                            color: item.checked ? 'var(--text-muted)' : 'white',
                            transition: 'color 0.2s ease'
                          }}>
                            {item.name}
                          </span>
                        </label>
                        <button 
                          onClick={() => handleRemoveItem(item.originalIndex)} 
                          style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem', padding: '0 4px' }}
                          title="Supprimer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })
            ) : (
              <div style={{ padding: 40, textAlign: 'center', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                Entrez la durée et le climat de votre séjour puis cliquez sur "Générer la checklist" pour débuter votre préparation.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
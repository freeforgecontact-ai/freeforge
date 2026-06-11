import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function RegistreKilo({ goBack }) {
  const [trips, setTrips] = useState(() => {
    const saved = localStorage.getItem('registre_kilo_trips');
    return saved ? JSON.parse(saved) : [];
  });

  // Trip form states
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [purpose, setPurpose] = useState('');
  const [client, setClient] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [odoStart, setOdoStart] = useState('');
  const [odoEnd, setOdoEnd] = useState('');

  // Persist trips
  useEffect(() => {
    localStorage.setItem('registre_kilo_trips', JSON.stringify(trips));
  }, [trips]);

  // Calculate stats
  const totalKm = trips.reduce((sum, trip) => sum + trip.distance, 0);
  
  // Calculate allowance based on Revenu Québec standard brackets:
  // First 5,000 km: 0.70$/km, then 0.64$/km (approximate 2026 rates)
  const calculateAllowance = (kmVal) => {
    const limit = 5000;
    const rate1 = 0.70;
    const rate2 = 0.64;
    
    if (kmVal <= limit) {
      return kmVal * rate1;
    } else {
      return (limit * rate1) + ((kmVal - limit) * rate2);
    }
  };

  const totalAllowance = calculateAllowance(totalKm);

  const handleSubmit = (e) => {
    e.preventDefault();
    const startVal = parseInt(odoStart) || 0;
    const endVal = parseInt(odoEnd) || 0;
    
    if (endVal <= startVal) {
      alert("L'odomètre de fin doit être plus grand que l'odomètre de départ.");
      return;
    }

    const distance = endVal - startVal;
    const currentAllowance = calculateAllowance(totalKm + distance) - calculateAllowance(totalKm);

    const newTrip = {
      id: Date.now(),
      date,
      purpose,
      client,
      origin,
      destination,
      odoStart: startVal,
      odoEnd: endVal,
      distance,
      allowance: currentAllowance
    };

    setTrips([newTrip, ...trips]);
    
    // Clear inputs except date/client if repetitive
    setPurpose('');
    setOrigin('');
    setDestination('');
    setOdoStart(odoEnd); // Start from previous end
    setOdoEnd('');
  };

  const deleteTrip = (id) => {
    if (confirm("Supprimer ce déplacement du registre ?")) {
      setTrips(trips.filter(t => t.id !== id));
    }
  };

  const clearAll = () => {
    if (confirm("Voulez-vous vraiment effacer TOUS les déplacements de votre disque dur ?")) {
      setTrips([]);
      localStorage.removeItem('registre_kilo_trips');
    }
  };

  // Export to CSV format
  const exportToCsv = () => {
    if (trips.length === 0) return;
    
    // CSV headers
    let csvContent = "Date,Client/Projet,Motif du deplacement,Lieu de depart,Destination,Odometre de depart (km),Odometre d'arrivee (km),Distance parcourue (km),Indemnite calculee ($)\n";
    
    trips.forEach(t => {
      const row = [
        t.date,
        `"${t.client.replace(/"/g, '""')}"`,
        `"${t.purpose.replace(/"/g, '""')}"`,
        `"${t.origin.replace(/"/g, '""')}"`,
        `"${t.destination.replace(/"/g, '""')}"`,
        t.odoStart,
        t.odoEnd,
        t.distance,
        t.allowance.toFixed(2)
      ].join(",");
      csvContent += row + "\n";
    });

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `registre_kilometrique_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Back navigation */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <button className="btn-premium btn-secondary" onClick={goBack} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          ← Retour
        </button>
        <span className="status-badge status-badge-primary">Revenu Québec</span>
        <FolderButton toolId="registre_kilo" toolName="Registre Kilométrique" localStorageKeys={['registre_kilo_trips']} />
      </div>

      <h1 className="page-title">Registre Kilométrique</h1>
      <p className="page-subtitle">Consignez vos déplacements commerciaux pour justifier vos dépenses déductibles d'automobile auprès de Revenu Québec.</p>

      {/* Stats row */}
      <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card-premium" style={{ cursor: 'default', padding: '16px 20px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Distance cumulée</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>{totalKm} km</div>
          </div>
          <div style={{ fontSize: '2rem' }}>🚗</div>
        </div>
        
        <div className="card-premium" style={{ cursor: 'default', padding: '16px 20px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Indemnité de déplacement totale</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent)' }}>{totalAllowance.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</div>
          </div>
          <div style={{ fontSize: '2rem' }}>💵</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }} className="responsive-split">
        
        {/* Form panel */}
        <div>
          <form className="card-premium" onSubmit={handleSubmit} style={{ cursor: 'default', gap: 14 }}>
            <h2 className="card-title" style={{ fontSize: '1rem' }}>📝 Nouveau trajet</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Date</label>
              <input type="date" className="input-premium" value={date} onChange={e => setDate(e.target.value)} required />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Client / Projet</label>
              <input type="text" className="input-premium" placeholder="Ex: Client ABC" value={client} onChange={e => setClient(e.target.value)} required />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Motif du trajet</label>
              <input type="text" className="input-premium" placeholder="Ex: Livraison, Consultation" value={purpose} onChange={e => setPurpose(e.target.value)} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Départ</label>
                <input type="text" className="input-premium" placeholder="Ex: Bureau" value={origin} onChange={e => setOrigin(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Arrivée</label>
                <input type="text" className="input-premium" placeholder="Ex: Client" value={destination} onChange={e => setDestination(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Odo. Début</label>
                <input type="number" className="input-premium" placeholder="125400" value={odoStart} onChange={e => setOdoStart(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Odo. Fin</label>
                <input type="number" className="input-premium" placeholder="125432" value={odoEnd} onChange={e => setOdoEnd(e.target.value)} required />
              </div>
            </div>

            <button type="submit" className="btn-premium btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
              Ajouter au registre
            </button>
          </form>
        </div>

        {/* Trips log panel */}
        <div className="card-premium" style={{ cursor: 'default', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>🚗 Déplacements consignés</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              {trips.length > 0 && (
                <>
                  <button className="btn-premium btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={exportToCsv}>
                    📥 Exporter CSV
                  </button>
                  <button className="btn-premium btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#ef4444' }} onClick={clearAll}>
                    Effacer tout
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ overflowX: 'auto', width: '100%' }}>
            {trips.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '8px 12px' }}>Date</th>
                    <th style={{ padding: '8px 12px' }}>Client</th>
                    <th style={{ padding: '8px 12px' }}>Trajet</th>
                    <th style={{ padding: '8px 12px' }}>Odomètre (Début/Fin)</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Distance</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Indemnité</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map(trip => (
                    <tr key={trip.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{trip.date}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div><strong>{trip.client}</strong></div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{trip.purpose}</div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {trip.origin} → {trip.destination}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {trip.odoStart} km / {trip.odoEnd} km
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold' }}>
                        {trip.distance} km
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--accent)', fontWeight: 'bold' }}>
                        {trip.allowance.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <button 
                          onClick={() => deleteTrip(trip.id)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '40px 0', textHTML: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center' }}>
                Aucun trajet consigné. Remplissez le formulaire à gauche pour démarrer votre registre.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

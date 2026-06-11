import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function FuseauxHoraires({ goBack }) {
  const [baseDate, setBaseDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const [baseTime, setBaseTime] = useState('12:00');

  // List of active timezones to display
  const [zones, setZones] = useState(() => {
    try {
      const saved = localStorage.getItem('ff_world_time');
      return saved ? JSON.parse(saved) : [
        { id: '1', name: 'Montréal / Toronto', zone: 'America/Toronto' },
        { id: '2', name: 'Paris / Bruxelles', zone: 'Europe/Paris' },
        { id: '3', name: 'Londres', zone: 'Europe/London' },
        { id: '4', name: 'New York', zone: 'America/New_York' },
        { id: '5', name: 'Tokyo', zone: 'Asia/Tokyo' },
        { id: '6', name: 'Sydney', zone: 'Australia/Sydney' }
      ];
    } catch (e) {
      console.error("Error reading ff_world_time", e);
      return [];
    }
  });

  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneId, setNewZoneId] = useState('America/Toronto');

  // Save selected zones list
  useEffect(() => {
    localStorage.setItem('ff_world_time', JSON.stringify(zones));
  }, [zones]);

  // List of available standard IANA zones for the selector
  const availableIanaZones = [
    { label: 'Montréal / Toronto', value: 'America/Toronto' },
    { label: 'Vancouver', value: 'America/Vancouver' },
    { label: 'Paris / Bruxelles / Genève', value: 'Europe/Paris' },
    { label: 'Londres / Dublin', value: 'Europe/London' },
    { label: 'New York / Miami', value: 'America/New_York' },
    { label: 'Los Angeles / San Francisco', value: 'America/Los_Angeles' },
    { label: 'Tokyo / Kyoto', value: 'Asia/Tokyo' },
    { label: 'Sydney / Melbourne', value: 'Australia/Sydney' },
    { label: 'Dubaï / Abu Dhabi', value: 'Asia/Dubai' },
    { label: 'Inde (New Delhi)', value: 'Asia/Kolkata' },
    { label: 'Singapour', value: 'Asia/Singapore' },
    { label: 'Sao Paulo / Rio', value: 'America/Sao_Paulo' },
    { label: 'Johannesbourg', value: 'Africa/Johannesburg' }
  ];

  const handleAddZone = (e) => {
    e.preventDefault();
    const cleanLabel = newZoneName.trim() || availableIanaZones.find(z => z.value === newZoneId)?.label || newZoneId;
    if (zones.some(z => z.zone === newZoneId)) {
      alert("Ce fuseau horaire est déjà ajouté.");
      return;
    }
    const newEntry = {
      id: Date.now().toString(),
      name: cleanLabel,
      zone: newZoneId
    };
    setZones([...zones, newEntry]);
    setNewZoneName('');
  };

  const handleDeleteZone = (id) => {
    setZones(zones.filter(z => z.id !== id));
  };

  // Convert reference date/time (in local timezone) to target zone
  const getZoneTimeDetails = (tzName) => {
    try {
      const [year, month, day] = baseDate.split('-').map(Number);
      const [hours, minutes] = baseTime.split(':').map(Number);
      
      // Local reference Date
      const refDate = new Date(year, month - 1, day, hours, minutes);
      
      // Format time
      const timeFormatter = new Intl.DateTimeFormat('fr-CA', {
        timeZone: tzName,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      // Format date
      const dateFormatter = new Intl.DateTimeFormat('fr-CA', {
        timeZone: tzName,
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });

      // Calculate relative offset difference (in hours) between user local time and target zone
      const localString = refDate.toLocaleString('en-US', { timeZone: tzName });
      const targetDate = new Date(localString);
      const diffMs = targetDate - refDate;
      const diffHrs = Math.round(diffMs / (1000 * 60 * 60));

      return {
        time: timeFormatter.format(refDate),
        date: dateFormatter.format(refDate),
        offset: diffHrs >= 0 ? `+${diffHrs}h` : `${diffHrs}h`
      };
    } catch (err) {
      console.error("Format error for zone:", tzName, err);
      return { time: '--:--', date: '', offset: '' };
    }
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🕰️ World Time Buddy & DST Planner
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Comparez les fuseaux horaires réels (gestion automatique de l'heure d'été/hiver) et planifiez vos réunions.
          </p>
        </div>
        <FolderButton toolId="world_time" toolName="FuseauxHoraires" localStorageKeys={['ff_world_time']} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        
        {/* Comparison list */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, color: 'white', margin: 0 }}>
            Comparateur de Temps
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {zones.length === 0 ? (
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucun fuseau horaire configuré...</span>
            ) : (
              zones.map((z) => {
                const details = getZoneTimeDetails(z.zone);
                return (
                  <div 
                    key={z.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '12px 16px', 
                      backgroundColor: 'rgba(255,255,255,0.01)', 
                      border: '1px solid rgba(255,255,255,0.05)', 
                      borderRadius: 10 
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 'bold', color: 'white', fontSize: '0.95rem' }}>{z.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {z.zone} ({details.offset !== '0h' ? `${details.offset} vs local` : 'Même heure'})
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#3b82f6', fontFamily: 'monospace' }}>
                          {details.time}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                          {details.date}
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => handleDeleteZone(z.id)} 
                        className="btn-premium btn-danger" 
                        style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Configurations Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Reference Time Picker */}
          <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', margin: 0 }}>Heure de Référence (Votre Heure Locale)</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Date :</label>
                <input type="date" value={baseDate} onChange={(e) => setBaseDate(e.target.value)} className="input-premium" style={{ width: '100%', marginTop: 2 }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Heure :</label>
                <input type="time" value={baseTime} onChange={(e) => setBaseTime(e.target.value)} className="input-premium" style={{ width: '100%', marginTop: 2, fontSize: '1.2rem', textAlign: 'center' }} />
              </div>
            </div>
          </div>

          {/* Add custom timezone */}
          <div className="glass-panel" style={{ padding: 20, borderRadius: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 12, marginTop: 0 }}>Ajouter un Fuseau</h3>
            
            <form onSubmit={handleAddZone} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sélectionner une zone standard :</label>
                <select 
                  value={newZoneId} 
                  onChange={e => setNewZoneId(e.target.value)} 
                  className="input-premium"
                  style={{ width: '100%', padding: 8, marginTop: 4, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}
                >
                  {availableIanaZones.map(z => (
                    <option key={z.value} value={z.value}>{z.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Libellé personnalisé (Optionnel) :</label>
                <input 
                  type="text" 
                  value={newZoneName} 
                  onChange={e => setNewZoneName(e.target.value)} 
                  placeholder="ex: Bureau Paris"
                  className="input-premium" 
                  style={{ width: '100%', padding: 8, marginTop: 4 }} 
                />
              </div>

              <button type="submit" className="btn-premium btn-primary" style={{ padding: 8, fontWeight: 'bold', justifyContent: 'center' }}>
                ➕ Ajouter le fuseau
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function CyclesSommeil({ goBack }) {
  const [wakeTime, setWakeTime] = useState('07:00');
  const [calculatedTimes, setCalculatedTimes] = useState([]);

  const calculateSleepCycles = () => {
    const [wHrs, wMins] = wakeTime.split(':').map(Number);
    const options = [];

    // Sleep cycles are 90 minutes. 
    // Go backwards from wake time to find optimal times to sleep (4, 5, 6 cycles)
    const cycles = [6, 5, 4];
    cycles.forEach(c => {
      const totalMinutes = c * 90 + 15; // 15 mins to fall asleep
      let date = new Date();
      date.setHours(wHrs);
      date.setMinutes(wMins);
      date.setMinutes(date.getMinutes() - totalMinutes);

      const hrsStr = date.getHours().toString().padStart(2, '0');
      const minsStr = date.getMinutes().toString().padStart(2, '0');
      options.push({
        time: hrsStr + ':' + minsStr,
        cycles: c,
        hours: (c * 1.5).toFixed(1)
      });
    });

    setCalculatedTimes(options);
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            💤 Sleep Cycle Calculator
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Déterminez les meilleures heures de coucher pour vous réveiller en pleine forme.
          </p>
        </div>
        <FolderButton toolId="sleep_cycle" toolName="CyclesSommeil" localStorageKeys={[]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Set Wake Up Time */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Je veux me réveiller à :</h2>
          <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className="input-premium" style={{ width: '100%', fontSize: '1.3rem', textAlign: 'center', padding: 12 }} />
          <button onClick={calculateSleepCycles} className="btn-premium btn-primary" style={{ padding: 12, fontWeight: 'bold' }}>
            ⚡ Calculer les cycles
          </button>
        </div>

        {/* Results */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>Heures de coucher idéales</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {calculatedTimes.length === 0 ? (
              <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Cliquez sur "Calculer les cycles" pour voir les résultats.</span>
            ) : (
              calculatedTimes.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}>
                  <div>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981' }}>{item.time}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 12 }}>({item.hours} heures de sommeil)</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600 }}>{item.cycles} cycles de sommeil</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
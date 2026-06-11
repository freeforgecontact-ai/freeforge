import React, { useState, useEffect, useRef } from 'react';
import FolderButton from '../components/FolderButton';

// Standard Instrument Tunings
const TUNINGS = {
  guitar: [
    { name: 'E2', freq: 82.41 },
    { name: 'A2', freq: 110.00 },
    { name: 'D3', freq: 146.83 },
    { name: 'G3', freq: 196.00 },
    { name: 'B3', freq: 246.94 },
    { name: 'E4', freq: 329.63 }
  ],
  bass: [
    { name: 'E1', freq: 41.20 },
    { name: 'A1', freq: 55.00 },
    { name: 'D2', freq: 73.42 },
    { name: 'G2', freq: 98.00 }
  ],
  ukulele: [
    { name: 'G4', freq: 392.00 },
    { name: 'C4', freq: 261.63 },
    { name: 'E4', freq: 329.63 },
    { name: 'A4', freq: 440.00 }
  ]
};

export default function GuitarTuner({ goBack }) {
  const [instrument, setInstrument] = useState('guitar');
  const [isListening, setIsListening] = useState(false);
  const [frequency, setFrequency] = useState(0);
  const [closestNote, setClosestNote] = useState(null);
  const [centsOffset, setCentsOffset] = useState(0); // flat (-50) to sharp (+50)

  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  const startTuner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const bufferLength = analyser.fftSize;
      const dataArray = new Float32Array(bufferLength);

      setIsListening(true);

      const updateTuning = () => {
        analyser.getFloat32TimeDomainData(dataArray);
        const pitch = autoCorrelate(dataArray, ctx.sampleRate);
        
        if (pitch !== -1 && pitch > 30 && pitch < 1000) {
          setFrequency(parseFloat(pitch.toFixed(1)));
          findClosestNote(pitch);
        }

        animationFrameIdRef.current = requestAnimationFrame(updateTuning);
      };

      updateTuning();
    } catch (err) {
      console.error(err);
      alert("Accès microphone refusé. Le micro est nécessaire pour analyser la note.");
    }
  };

  const stopTuner = () => {
    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioCtxRef.current) audioCtxRef.current.close();
    setIsListening(false);
    setFrequency(0);
    setClosestNote(null);
    setCentsOffset(0);
  };

  // Find closest note from selected instrument tuning
  const findClosestNote = (pitch) => {
    const notes = TUNINGS[instrument];
    let minDiff = Infinity;
    let closest = null;

    notes.forEach(note => {
      const diff = Math.abs(pitch - note.freq);
      if (diff < minDiff) {
        minDiff = diff;
        closest = note;
      }
    });

    if (closest) {
      setClosestNote(closest);
      // Calculate cents offset: 1200 * log2(f1/f2)
      const cents = Math.round(1200 * Math.log2(pitch / closest.freq));
      // Clamp to -50 / +50
      setCentsOffset(Math.max(-50, Math.min(50, cents)));
    }
  };

  // Autocorrelation algorithm for monophonic pitch detection
  const autoCorrelate = (buffer, sampleRate) => {
    let SIZE = buffer.length;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1; // Too quiet

    let r1 = 0, r2 = SIZE - 1;
    const thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    }
    for (let i = SIZE - 1; i >= SIZE / 2; i--) {
      if (Math.abs(buffer[i]) < thres) { r2 = i; break; }
    }

    const sliced = buffer.slice(r1, r2);
    SIZE = sliced.length;

    const c = new Float32Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE - i; j++) {
        c[i] = c[i] + sliced[j] * sliced[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;

    let maxval = -1;
    let maxpos = -1;
    for (let i = d; i < SIZE; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }

    let T0 = maxpos;
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
  };

  useEffect(() => {
    return () => {
      stopTuner();
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 8 }}>
            ← Retour
          </button>
          <h1 className="page-title">Accordeur d'Instruments Chromatique</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Accordez votre guitare, basse ou ukulélé en temps réel directement via votre micro.</p>
        </div>
        <FolderButton toolId="guitar_tuner" toolName="Accordeur Instrument" />
      </div>

      <div className="grid-2">
        {/* Left Column: Selector & Listening State */}
        <div className="card-premium" style={{ gap: 20 }}>
          <h2 className="card-title">Choisir l'instrument</h2>
          
          <div style={{ display: 'flex', gap: 10 }}>
            {['guitar', 'bass', 'ukulele'].map((inst) => (
              <button
                key={inst}
                onClick={() => { setInstrument(inst); setClosestNote(null); }}
                className={`btn-premium ${instrument === inst ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem', textTransform: 'uppercase' }}
              >
                {inst === 'guitar' && '🎸 Guitare'}
                {inst === 'bass' && '🎸 Basse'}
                {inst === 'ukulele' && '🏝️ Ukulélé'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 10 }}>
            {isListening ? (
              <button onClick={stopTuner} className="btn-premium" style={{ width: '100%', maxWidth: 220, justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                🛑 Arrêter l'écoute
              </button>
            ) : (
              <button onClick={startTuner} className="btn-premium btn-primary" style={{ width: '100%', maxWidth: 220, justifyContent: 'center' }}>
                🎤 Démarrer l'accordeur
              </button>
            )}

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
              Notes cibles pour {instrument} : <br />
              {TUNINGS[instrument].map(n => n.name).join(' - ')}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Tuning Needle Dial */}
        <div className="card-premium" style={{ gap: 20, alignItems: 'center', justifyContent: 'center' }}>
          <h2 className="card-title">Aiguille de Justesse</h2>
          
          <div style={{ width: '100%', maxWidth: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            {/* Visual Dial */}
            <div style={{ width: '100%', height: 12, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: 6, position: 'relative', overflow: 'visible' }}>
              {/* Target center marker */}
              <div style={{ position: 'absolute', top: -4, bottom: -4, left: '50%', width: 3, backgroundColor: '#10b981', transform: 'translateX(-50%)', zIndex: 10 }} />
              
              {/* Pointer Needle */}
              {isListening && closestNote && (
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: -12, 
                    bottom: -12, 
                    left: `${50 + (centsOffset)}%`, 
                    width: 4, 
                    backgroundColor: Math.abs(centsOffset) < 3 ? '#10b981' : '#f59e0b', 
                    borderRadius: 2, 
                    transform: 'translateX(-50%)', 
                    transition: 'left 0.1s ease', 
                    boxShadow: Math.abs(centsOffset) < 3 ? '0 0 10px rgba(16,185,129,0.5)' : '0 0 10px rgba(245,158,11,0.5)'
                  }} 
                />
              )}
            </div>

            {/* Scale legend */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: -6 }}>
              <span>Flat (Trop bas)</span>
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>Parfait</span>
              <span>Sharp (Trop haut)</span>
            </div>

            {/* Note Display */}
            {isListening && closestNote ? (
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <div style={{ fontSize: '3.6rem', fontWeight: 900, color: Math.abs(centsOffset) < 3 ? '#10b981' : '#f3f4f6', lineHeight: 1 }}>
                  {closestNote.name}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                  {frequency} Hz
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: Math.abs(centsOffset) < 3 ? '#10b981' : '#f59e0b', marginTop: 4 }}>
                  {Math.abs(centsOffset) < 3 ? 'Parfaitement accordé !' : centsOffset < 0 ? `${Math.abs(centsOffset)} cents trop bas` : `${centsOffset} cents trop haut`}
                </div>
              </div>
            ) : (
              <div style={{ padding: 40, color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem', textAlign: 'center' }}>
                {isListening ? 'Jouez une corde de votre instrument...' : 'Activez le micro pour accorder.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

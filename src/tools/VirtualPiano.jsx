import React, { useState, useEffect, useRef } from 'react';
import FolderButton from '../components/FolderButton';

// Key mappings (Note, Frequency, Keyboard Key, isBlack)
const PIANO_KEYS = [
  { note: 'C4', freq: 261.63, char: 'a', black: false },
  { note: 'C#4', freq: 277.18, char: 'w', black: true },
  { note: 'D4', freq: 293.66, char: 's', black: false },
  { note: 'D#4', freq: 311.13, char: 'e', black: true },
  { note: 'E4', freq: 329.63, char: 'd', black: false },
  { note: 'F4', freq: 349.23, char: 'f', black: false },
  { note: 'F#4', freq: 369.99, char: 't', black: true },
  { note: 'G4', freq: 392.00, char: 'g', black: false },
  { note: 'G#4', freq: 415.30, char: 'y', black: true },
  { note: 'A4', freq: 440.00, char: 'h', black: false },
  { note: 'A#4', freq: 466.16, char: 'u', black: true },
  { note: 'B4', freq: 493.88, char: 'j', black: false },
  { note: 'C5', freq: 523.25, char: 'k', black: false },
  { note: 'C#5', freq: 554.37, char: 'o', black: true },
  { note: 'D5', freq: 587.33, char: 'l', black: false },
  { note: 'D#5', freq: 622.25, char: 'p', black: true },
  { note: 'E5', freq: 659.25, char: ';', black: false }
];

export default function VirtualPiano({ goBack }) {
  const [activeKeys, setActiveKeys] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  
  const audioCtxRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const destRef = useRef(null);
  const activeNodesRef = useRef({});

  // Initialize Audio & Recording Destination
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      // Create destination for recording
      const dest = ctx.createMediaStreamDestination();
      destRef.current = dest;
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playNote = (noteObj) => {
    initAudio();
    const ctx = audioCtxRef.current;
    
    // Stop note if already playing to prevent duplicates
    stopNote(noteObj.note);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Composite tone for warmer sound (sine + triangle)
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(noteObj.freq, ctx.currentTime);

    // ADSR Envelope
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.005); // Attack
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.3); // Decay / Sustain

    osc.connect(gain);
    
    // Connect to speakers & recorder
    gain.connect(ctx.destination);
    if (destRef.current) {
      gain.connect(destRef.current);
    }

    osc.start();
    
    // Store nodes to stop later
    activeNodesRef.current[noteObj.note] = { osc, gain };
    setActiveKeys(prev => ({ ...prev, [noteObj.note]: true }));
  };

  const stopNote = (note) => {
    const active = activeNodesRef.current[note];
    if (active) {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      
      // Release envelope
      active.gain.gain.cancelScheduledValues(now);
      active.gain.gain.setValueAtTime(active.gain.gain.value, now);
      active.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5); // Release
      
      const osc = active.osc;
      setTimeout(() => {
        try {
          osc.stop();
        } catch (e) {}
      }, 500);

      delete activeNodesRef.current[note];
      setActiveKeys(prev => {
        const next = { ...prev };
        delete next[note];
        return next;
      });
    }
  };

  // Keyboard mapping listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.repeat) return;
      const keyObj = PIANO_KEYS.find(k => k.char === e.key.toLowerCase());
      if (keyObj) {
        playNote(keyObj);
      }
    };

    const handleKeyUp = (e) => {
      const keyObj = PIANO_KEYS.find(k => k.char === e.key.toLowerCase());
      if (keyObj) {
        stopNote(keyObj.note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Recording management
  const startRecording = () => {
    initAudio();
    if (!destRef.current) return;
    
    const chunks = [];
    setRecordedChunks([]);

    const recorder = new MediaRecorder(destRef.current.stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      setRecordedChunks(chunks);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const downloadRecording = () => {
    if (recordedChunks.length === 0) return;
    const blob = new Blob(recordedChunks, { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `piano_recording_${Date.now()}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 8 }}>
            ← Retour
          </button>
          <h1 className="page-title">Piano Polyphonique Interactif</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Jouez au clavier ou à la souris et enregistrez vos compositions de façon 100% autonome.</p>
        </div>
        <FolderButton toolId="virtual_piano" toolName="Piano Virtuel" />
      </div>

      <div className="card-premium" style={{ gap: 20 }}>
        {/* Recording Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {isRecording ? (
              <button onClick={stopRecording} className="btn-premium" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                🛑 Arrêter l'enregistrement
              </button>
            ) : (
              <button onClick={startRecording} className="btn-premium btn-primary" style={{ background: 'linear-gradient(135deg, var(--secondary) 0%, #db2777 100%)', boxShadow: '0 4px 15px var(--secondary-glow)' }}>
                🔴 Enregistrer sa performance
              </button>
            )}
            {recordedChunks.length > 0 && (
              <button onClick={downloadRecording} className="btn-premium btn-secondary">
                💾 Télécharger l'enregistrement (.webm)
              </button>
            )}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Touches du clavier : [a, w, s, e, d, f, t, g, y, h, u, j, k, o, l, p, ;]
          </div>
        </div>

        {/* Piano Keys Visual Representation */}
        <div style={{ display: 'flex', width: '100%', position: 'relative', height: 160, padding: '10px 0', border: '1px solid var(--border-light)', borderRadius: 12, backgroundColor: '#111827', overflow: 'hidden' }}>
          {PIANO_KEYS.map((k, idx) => {
            const isActive = !!activeKeys[k.note];
            
            if (k.black) {
              return (
                <button
                  key={idx}
                  onMouseDown={() => playNote(k)}
                  onMouseUp={() => stopNote(k.note)}
                  onMouseLeave={() => stopNote(k.note)}
                  className={`piano-key-black ${isActive ? 'active' : ''}`}
                  style={{ 
                    position: 'absolute', 
                    left: `${(idx * 6) + 1.8}%`, 
                    zIndex: 20, 
                    borderRadius: '0 0 4px 4px',
                    backgroundColor: isActive ? 'var(--primary)' : '#111827',
                    border: '1px solid #000',
                    height: 100,
                    width: 24,
                    cursor: 'pointer'
                  }}
                  title={`${k.note} (${k.char})`}
                />
              );
            }

            return (
              <button
                key={idx}
                onMouseDown={() => playNote(k)}
                onMouseUp={() => stopNote(k.note)}
                onMouseLeave={() => stopNote(k.note)}
                className={`piano-key ${isActive ? 'active' : ''}`}
                style={{ 
                  flex: 1, 
                  backgroundColor: isActive ? '#dbeafe' : 'white', 
                  border: '1px solid #ddd', 
                  borderRadius: '0 0 6px 6px',
                  height: 150,
                  color: '#4b5563',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingBottom: 10,
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div>{k.note}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{k.char}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

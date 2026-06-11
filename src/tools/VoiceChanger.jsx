import React, { useState, useEffect, useRef } from 'react';
import FolderButton from '../components/FolderButton';

export default function VoiceChanger({ goBack }) {
  const [isListening, setIsListening] = useState(false);
  const [preset, setPreset] = useState('normal'); // normal, robot, radio, echo
  const [micVolume, setMicVolume] = useState(0.8);

  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);
  const sourceRef = useRef(null);
  const outputGainRef = useRef(null);
  
  // Audio Effect Nodes
  const delayNodeRef = useRef(null);
  const delayFeedbackRef = useRef(null);
  const filterNodeRef = useRef(null);
  const ringOscRef = useRef(null);
  const ringGainRef = useRef(null);

  const startVoiceChanger = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const outputGain = ctx.createGain();
      outputGain.gain.value = micVolume;
      outputGain.connect(ctx.destination);
      outputGainRef.current = outputGain;

      setIsListening(true);
      applyEffectGraph(ctx, source, outputGain);

    } catch (err) {
      console.error(err);
      alert("Accès microphone refusé. Le micro est nécessaire pour modifier votre voix.");
    }
  };

  const stopVoiceChanger = () => {
    cleanAudioGraph();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioCtxRef.current) audioCtxRef.current.close();
    setIsListening(false);
  };

  const cleanAudioGraph = () => {
    if (ringOscRef.current) {
      try { ringOscRef.current.stop(); } catch (e) {}
    }
    // Disconnect everything
    try { sourceRef.current.disconnect(); } catch (e) {}
    try { delayNodeRef.current.disconnect(); } catch (e) {}
    try { delayFeedbackRef.current.disconnect(); } catch (e) {}
    try { filterNodeRef.current.disconnect(); } catch (e) {}
    try { ringGainRef.current.disconnect(); } catch (e) {}
  };

  const applyEffectGraph = (ctx, source, destination) => {
    cleanAudioGraph();

    if (preset === 'normal') {
      source.connect(destination);
    } else if (preset === 'robot') {
      // Ring Modulator (metallic robot voice)
      const ringGain = ctx.createGain();
      const ringOsc = ctx.createOscillator();
      ringOsc.type = 'sine';
      ringOsc.frequency.value = 50; // Pitch modulator frequency

      const sourceGain = ctx.createGain();
      sourceGain.gain.value = 1.0;

      // Connect modulator
      ringOsc.connect(ringGain.gain);
      source.connect(ringGain);
      ringGain.connect(destination);

      ringOsc.start();
      
      ringOscRef.current = ringOsc;
      ringGainRef.current = ringGain;
    } else if (preset === 'radio') {
      // Walkie-Talkie / Telephone (Bandpass + slight saturation)
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800; // Middle band
      filter.Q.value = 1.5;

      const dist = ctx.createWaveShaper();
      dist.curve = makeDistortionCurve(20);
      dist.oversample = '4x';

      source.connect(filter);
      filter.connect(dist);
      dist.connect(destination);

      filterNodeRef.current = filter;
    } else if (preset === 'echo') {
      // Echo / Feedback delay
      const delay = ctx.createDelay(1.0);
      delay.delayTime.value = 0.4; // 400ms delay

      const feedback = ctx.createGain();
      feedback.gain.value = 0.4; // 40% volume decay

      // Route: Source -> Destination (Direct)
      // Route: Source -> Delay -> Destination (Echo)
      // Route: Delay -> Feedback -> Delay (Feedback loop)
      source.connect(destination);
      source.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(destination);

      delayNodeRef.current = delay;
      delayFeedbackRef.current = feedback;
    }
  };

  // Helper: WaveShaper distortion curve
  const makeDistortionCurve = (amount) => {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  };

  // Dynamically update effect when preset changes
  useEffect(() => {
    if (isListening && audioCtxRef.current && sourceRef.current && outputGainRef.current) {
      applyEffectGraph(audioCtxRef.current, sourceRef.current, outputGainRef.current);
    }
  }, [preset]);

  // Dynamically update output volume
  useEffect(() => {
    if (outputGainRef.current) {
      outputGainRef.current.gain.value = micVolume;
    }
  }, [micVolume]);

  useEffect(() => {
    return () => {
      stopVoiceChanger();
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 8 }}>
            ← Retour
          </button>
          <h1 className="page-title">Modificateur de Voix en Temps Réel</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Parlez dans votre micro pour modifier instantanément votre timbre de voix localement.</p>
        </div>
        <FolderButton toolId="voice_changer" toolName="Modificateur Voix" />
      </div>

      <div className="grid-2">
        {/* Left Column: Activate Micro */}
        <div className="card-premium" style={{ gap: 20 }}>
          <h2 className="card-title">Entrée Microphone</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 10 }}>
            {isListening ? (
              <button onClick={stopVoiceChanger} className="btn-premium" style={{ width: '100%', maxWidth: 220, justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                🛑 Couper le microphone
              </button>
            ) : (
              <button onClick={startVoiceChanger} className="btn-premium btn-primary" style={{ width: '100%', maxWidth: 220, justifyContent: 'center' }}>
                🎤 Activer le microphone
              </button>
            )}

            <div style={{ width: '100%' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                <span>Volume de retour :</span>
                <span>{Math.round(micVolume * 100)}%</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="1.5" 
                step="0.05" 
                value={micVolume} 
                onChange={(e) => setMicVolume(parseFloat(e.target.value))} 
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Select Preset */}
        <div className="card-premium" style={{ gap: 20 }}>
          <h2 className="card-title">Effets Vocaux</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button 
              onClick={() => setPreset('normal')} 
              className={`btn-premium ${preset === 'normal' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '16px 10px', flexDirection: 'column', gap: 6 }}
            >
              <span style={{ fontSize: '1.5rem' }}>🗣️</span>
              <span>Voix Normale</span>
            </button>

            <button 
              onClick={() => setPreset('robot')} 
              className={`btn-premium ${preset === 'robot' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '16px 10px', flexDirection: 'column', gap: 6 }}
            >
              <span style={{ fontSize: '1.5rem' }}>🤖</span>
              <span>Voix Robotique</span>
            </button>

            <button 
              onClick={() => setPreset('radio')} 
              className={`btn-premium ${preset === 'radio' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '16px 10px', flexDirection: 'column', gap: 6 }}
            >
              <span style={{ fontSize: '1.5rem' }}>📻</span>
              <span>Talkie-Walkie</span>
            </button>

            <button 
              onClick={() => setPreset('echo')} 
              className={`btn-premium ${preset === 'echo' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '16px 10px', flexDirection: 'column', gap: 6 }}
            >
              <span style={{ fontSize: '1.5rem' }}>🏰</span>
              <span>Écho Cathédrale</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

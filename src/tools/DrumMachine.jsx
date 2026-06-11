import React, { useState, useEffect, useRef } from 'react';
import FolderButton from '../components/FolderButton';

export default function DrumMachine({ goBack }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);
  const [grid, setGrid] = useState({
    kick: Array(16).fill(false),
    snare: Array(16).fill(false),
    hihat: Array(16).fill(false),
    clap: Array(16).fill(false)
  });

  const audioCtxRef = useRef(null);
  const timerIdRef = useRef(null);
  const currentStepRef = useRef(0);

  // Initialize Audio Context on user gesture
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Synthesize Kick Drum (Bass Drum)
  const playKick = (ctx, time) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Exponential frequency drop
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.3);

    // Volume decay
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

    osc.start(time);
    osc.stop(time + 0.3);
  };

  // Helper: Create White Noise Buffer for Snare/Hihat/Clap
  const getNoiseBuffer = (ctx) => {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  // Synthesize Snare
  const playSnare = (ctx, time) => {
    // Noise source
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    // Oscillator snap for initial pop
    const snap = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snap.type = 'triangle';
    snap.frequency.value = 180;
    snapGain.gain.setValueAtTime(0.5, time);
    snapGain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
    snap.connect(snapGain);
    snapGain.connect(ctx.destination);

    noise.start(time);
    snap.start(time);
    noise.stop(time + 0.2);
    snap.stop(time + 0.08);
  };

  // Synthesize Hi-Hat
  const playHihat = (ctx, time) => {
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(time);
    noise.stop(time + 0.05);
  };

  // Synthesize Clap
  const playClap = (ctx, time) => {
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;

    const gain = ctx.createGain();
    
    // Simulate multi-trigger sound pattern for clapping
    gain.gain.setValueAtTime(0.6, time);
    gain.gain.setValueAtTime(0.1, time + 0.01);
    gain.gain.setValueAtTime(0.5, time + 0.02);
    gain.gain.setValueAtTime(0.1, time + 0.03);
    gain.gain.setValueAtTime(0.4, time + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(time);
    noise.stop(time + 0.15);
  };

  // Toggle Grid Step
  const toggleStep = (track, stepIdx) => {
    setGrid(prev => ({
      ...prev,
      [track]: prev[track].map((val, idx) => idx === stepIdx ? !val : val)
    }));
    
    // Play sound instantly when clicking step for feedback
    const ctx = getAudioContext();
    if (grid[track][stepIdx] === false) { // Will become true
      const now = ctx.currentTime;
      if (track === 'kick') playKick(ctx, now);
      if (track === 'snare') playSnare(ctx, now);
      if (track === 'hihat') playHihat(ctx, now);
      if (track === 'clap') playClap(ctx, now);
    }
  };

  // Loop Step Player
  const startSequencer = () => {
    const ctx = getAudioContext();
    setIsPlaying(true);
    
    const intervalMs = (60 / bpm / 4) * 1000; // 16th note interval
    
    timerIdRef.current = setInterval(() => {
      const step = currentStepRef.current;
      const now = ctx.currentTime;

      if (grid.kick[step]) playKick(ctx, now);
      if (grid.snare[step]) playSnare(ctx, now);
      if (grid.hihat[step]) playHihat(ctx, now);
      if (grid.clap[step]) playClap(ctx, now);

      setCurrentStep(step);
      currentStepRef.current = (step + 1) % 16;
    }, intervalMs);
  };

  const stopSequencer = () => {
    clearInterval(timerIdRef.current);
    setIsPlaying(false);
  };

  // Adjust BPM dynamically while playing
  useEffect(() => {
    if (isPlaying) {
      stopSequencer();
      startSequencer();
    }
  }, [bpm]);

  const clearGrid = () => {
    setGrid({
      kick: Array(16).fill(false),
      snare: Array(16).fill(false),
      hihat: Array(16).fill(false),
      clap: Array(16).fill(false)
    });
    setCurrentStep(0);
    currentStepRef.current = 0;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 8 }}>
            ← Retour
          </button>
          <h1 className="page-title">Boîte à Rythmes (Step Sequencer)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Concevez des boucles de batterie en temps réel. Sons générés 100% via synthèse Web Audio.</p>
        </div>
        <FolderButton toolId="drum_machine" toolName="Boite a Rythmes" />
      </div>

      <div className="card-premium" style={{ gap: 20 }}>
        {/* Controls Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {isPlaying ? (
              <button onClick={stopSequencer} className="btn-premium btn-primary" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)' }}>
                ⏸️ Pause
              </button>
            ) : (
              <button onClick={startSequencer} className="btn-premium btn-primary" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>
                ▶️ Lecture
              </button>
            )}
            <button onClick={clearGrid} className="btn-premium btn-secondary">
              🗑️ Réinitialiser
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tempo (BPM) : {bpm}</span>
            <input 
              type="range" 
              min="60" 
              max="180" 
              value={bpm} 
              onChange={(e) => setBpm(parseInt(e.target.value))} 
              style={{ width: 140 }}
            />
          </div>
        </div>

        {/* Sequencer Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
          {Object.keys(grid).map((track) => (
            <div key={track} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Track Name */}
              <div style={{ width: 80, textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                {track === 'kick' && '🥁 Kick'}
                {track === 'snare' && '🥁 Snare'}
                {track === 'hihat' && '💿 Hi-Hat'}
                {track === 'clap' && '👏 Clap'}
              </div>

              {/* Steps (16) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: 6, flex: 1 }}>
                {grid[track].map((active, stepIdx) => {
                  const isCurrent = currentStep === stepIdx && isPlaying;
                  const isBeat = stepIdx % 4 === 0;
                  
                  return (
                    <button
                      key={stepIdx}
                      onClick={() => toggleStep(track, stepIdx)}
                      className={`drum-pad ${active ? 'active' : ''}`}
                      style={{ 
                        border: isCurrent ? '2px solid #38bdf8' : isBeat ? '1px solid rgba(255,255,255,0.15)' : '1px solid var(--border-light)',
                        boxShadow: isCurrent ? '0 0 10px rgba(56,189,248,0.4)' : 'none',
                        background: active 
                          ? 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' 
                          : isBeat ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)'
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

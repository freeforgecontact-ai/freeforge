import React, { useState, useEffect, useRef } from 'react';
import FolderButton from '../components/FolderButton';

export default function WhiteNoiseMixer({ goBack }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.8);
  
  // Channels state
  const [channels, setChannels] = useState(() => {
    const saved = localStorage.getItem('fe_sounds');
    return saved ? JSON.parse(saved) : {
      rain: { name: '🌧️ Pluie Muffled', volume: 0.3, active: true },
      wind: { name: '🍃 Vent Soufflant', volume: 0.0, active: false },
      fire: { name: '🔥 Feu de Camp', volume: 0.0, active: false },
      waves: { name: '🌊 Vagues Calmes', volume: 0.0, active: false },
      cafe: { name: '☕ Ambiance Café', volume: 0.0, active: false },
      pure: { name: '📺 Bruit Blanc Brut', volume: 0.0, active: false }
    };
  });

  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const activeNodesRef = useRef({});

  // Persist volumes
  useEffect(() => {
    localStorage.setItem('fe_sounds', JSON.stringify(channels));
  }, [channels]);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.value = masterVolume;
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;
    }
    return audioCtxRef.current;
  };

  const createNoiseBuffer = (ctx, duration = 2.0) => {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  const startChannel = (key) => {
    const ctx = getAudioContext();
    if (!ctx || activeNodesRef.current[key]) return;

    const channelGain = ctx.createGain();
    channelGain.gain.value = channels[key].volume;
    channelGain.connect(masterGainRef.current);

    const nodes = { gain: channelGain };

    if (key === 'rain') {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 3.0);
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 550; // Muffled rain

      noise.connect(filter);
      filter.connect(channelGain);
      noise.start();

      nodes.source = noise;
      nodes.filter = filter;

    } else if (key === 'wind') {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 4.0);
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 400;
      filter.Q.value = 3.0;

      // Wind sweep LFO
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.07;

      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 250;

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      noise.connect(filter);
      filter.connect(channelGain);
      
      noise.start();
      lfo.start();

      nodes.source = noise;
      nodes.lfo = lfo;

    } else if (key === 'fire') {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 2.0);
      noise.loop = true;

      const rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.value = 150;

      noise.connect(rumbleFilter);
      rumbleFilter.connect(channelGain);
      noise.start();
      nodes.source = noise;

      // Crackles
      const crackleInterval = setInterval(() => {
        if (!isPlaying || !channels.fire.active) return;
        if (Math.random() > 0.5) {
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const amp = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1000 + Math.random() * 1500, ctx.currentTime);
          
          filter.type = 'bandpass';
          filter.frequency.value = 2200;
          filter.Q.value = 1.5;

          amp.gain.setValueAtTime(0, ctx.currentTime);
          amp.gain.linearRampToValueAtTime(0.03 * channels.fire.volume, ctx.currentTime + 0.002);
          amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.015 + Math.random() * 0.02);

          osc.connect(filter);
          filter.connect(amp);
          amp.connect(masterGainRef.current);

          osc.start();
          osc.stop(ctx.currentTime + 0.1);
        }
      }, 90);

      nodes.interval = crackleInterval;

    } else if (key === 'waves') {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 4.0);
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 350;

      // Ocean sweep LFO (12s cycle)
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.08;

      const lfoVolGain = ctx.createGain();
      lfoVolGain.gain.value = 0.4;

      const waveGain = ctx.createGain();
      waveGain.gain.value = 0.5;

      lfo.connect(lfoVolGain);
      lfoVolGain.connect(waveGain.gain);

      noise.connect(filter);
      filter.connect(waveGain);
      waveGain.connect(channelGain);

      noise.start();
      lfo.start();

      nodes.source = noise;
      nodes.lfo = lfo;

    } else if (key === 'cafe') {
      // Cafe ambient: low hum noise + random soft piano clinks
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 3.0);
      noise.loop = true;

      const humFilter = ctx.createBiquadFilter();
      humFilter.type = 'bandpass';
      humFilter.frequency.value = 220;
      humFilter.Q.value = 0.7;

      noise.connect(humFilter);
      humFilter.connect(channelGain);
      noise.start();
      nodes.source = noise;

      // Soft clinks
      const clinkInterval = setInterval(() => {
        if (!isPlaying || !channels.cafe.active) return;
        if (Math.random() > 0.8) {
          const osc = ctx.createOscillator();
          const amp = ctx.createGain();

          osc.type = 'sine';
          // random harmonic tones
          const freqs = [523.25, 587.33, 659.25, 783.99, 880.00];
          osc.frequency.setValueAtTime(freqs[Math.floor(Math.random() * freqs.length)], ctx.currentTime);

          amp.gain.setValueAtTime(0, ctx.currentTime);
          amp.gain.linearRampToValueAtTime(0.01 * channels.cafe.volume, ctx.currentTime + 0.02);
          amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

          osc.connect(amp);
          amp.connect(masterGainRef.current);

          osc.start();
          osc.stop(ctx.currentTime + 1.5);
        }
      }, 2000);

      nodes.interval = clinkInterval;

    } else if (key === 'pure') {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 2.0);
      noise.loop = true;

      noise.connect(channelGain);
      noise.start();

      nodes.source = noise;
    }

    activeNodesRef.current[key] = nodes;
  };

  const stopChannel = (key) => {
    const nodes = activeNodesRef.current[key];
    if (!nodes) return;

    if (nodes.source) {
      try { nodes.source.stop(); } catch (e) {}
    }
    if (nodes.lfo) {
      try { nodes.lfo.stop(); } catch (e) {}
    }
    if (nodes.interval) {
      clearInterval(nodes.interval);
    }
    if (nodes.gain) {
      try { nodes.gain.disconnect(); } catch (e) {}
    }

    delete activeNodesRef.current[key];
  };

  const togglePlay = () => {
    if (isPlaying) {
      Object.keys(activeNodesRef.current).forEach(key => stopChannel(key));
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      Object.keys(channels).forEach(key => {
        if (channels[key].active) {
          startChannel(key);
        }
      });
    }
  };

  useEffect(() => {
    Object.keys(channels).forEach(key => {
      const node = activeNodesRef.current[key];
      if (node && node.gain) {
        node.gain.gain.value = channels[key].volume;
      }
    });
  }, [channels]);

  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = masterVolume;
    }
  }, [masterVolume]);

  const toggleChannelActive = (key) => {
    setChannels(prev => {
      const updated = {
        ...prev,
        [key]: { ...prev[key], active: !prev[key].active }
      };
      if (isPlaying) {
        if (updated[key].active) {
          setTimeout(() => startChannel(key), 0);
        } else {
          stopChannel(key);
        }
      }
      return updated;
    });
  };

  const changeVolume = (key, val) => {
    const numVal = parseFloat(val);
    setChannels(prev => {
      const updated = {
        ...prev,
        [key]: { ...prev[key], volume: numVal }
      };
      // Auto-activate channel if volume raised above 0
      if (numVal > 0 && !updated[key].active) {
        updated[key].active = true;
        if (isPlaying) {
          setTimeout(() => startChannel(key), 0);
        }
      }
      return updated;
    });
  };

  useEffect(() => {
    return () => {
      Object.keys(activeNodesRef.current).forEach(key => stopChannel(key));
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>🧘 White Noise Soundscape Mixer</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Mixez et combinez plusieurs bruits de fond synthétisés localement.</p>
        </div>
        <FolderButton toolId="white_noise" toolName="WhiteNoiseMixer" localStorageKeys={['fe_sounds']} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Mixer Board */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Console de mixage</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.keys(channels).map(key => {
              const ch = channels[key];
              return (
                <div 
                  key={key} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '10px 14px', 
                    backgroundColor: ch.active ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.01)', 
                    border: ch.active ? '1px solid rgba(139,92,246,0.2)' : '1px solid var(--border-light)', 
                    borderRadius: 10 
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }}>
                    <input 
                      type="checkbox" 
                      checked={ch.active} 
                      onChange={() => toggleChannelActive(key)} 
                      style={{ width: 18, height: 18, accentColor: 'var(--secondary)' }} 
                    />
                    <span style={{ fontWeight: ch.active ? 'bold' : 'normal', color: ch.active ? 'white' : 'var(--text-secondary)' }}>
                      {ch.name}
                    </span>
                  </label>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '50%' }}>
                    <input 
                      type="range" 
                      min="0" 
                      max="1.0" 
                      step="0.05" 
                      value={ch.volume} 
                      onChange={e => changeVolume(key, e.target.value)} 
                      style={{ width: '100%' }} 
                    />
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', width: 32, textAlign: 'right' }}>
                      {Math.round(ch.volume * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Master Control */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Contrôle Général</h2>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button 
              onClick={togglePlay} 
              className="btn-premium btn-primary" 
              style={{ 
                padding: '14px 28px', 
                fontSize: '1.1rem', 
                fontWeight: 'bold', 
                backgroundColor: isPlaying ? '#ef4444' : 'var(--secondary)',
                boxShadow: isPlaying ? '0 0 15px rgba(239,68,68,0.3)' : '0 0 15px rgba(139,92,246,0.3)',
                border: 'none',
                color: 'white',
                borderRadius: 12
              }}
            >
              {isPlaying ? '🛑 Arrêter' : '▶️ Jouer le Mix'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
              <span>Volume Général (Master) :</span>
              <span style={{ fontWeight: 'bold' }}>{Math.round(masterVolume * 100)}%</span>
            </label>
            <input 
              type="range" 
              min="0" 
              max="1.0" 
              step="0.05" 
              value={masterVolume} 
              onChange={e => setMasterVolume(parseFloat(e.target.value))} 
              style={{ width: '100%' }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
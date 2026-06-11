import React, { useState, useEffect, useRef } from 'react';
import FolderButton from '../components/FolderButton';

export default function AudioVisualizer({ goBack }) {
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [theme, setTheme] = useState('bars'); // bars, circle, wave
  const [isPlaying, setIsPlaying] = useState(false);

  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAudioFile(file);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    setIsPlaying(false);
  };

  const initAnalyser = () => {
    if (audioCtxRef.current) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const source = ctx.createMediaElementSource(audioRef.current);
    source.connect(analyser);
    analyser.connect(ctx.destination);
    sourceRef.current = source;
  };

  const startVisualizer = () => {
    initAnalyser();
    
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      
      animationFrameIdRef.current = requestAnimationFrame(draw);
      
      if (theme === 'bars') {
        analyser.getByteFrequencyData(dataArray);
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        const barWidth = (W / bufferLength) * 1.4;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const percent = dataArray[i] / 255;
          const barHeight = H * percent * 0.8;

          // Beautiful purple-to-pink gradient
          const grad = ctx.createLinearGradient(0, H, 0, H - barHeight);
          grad.addColorStop(0, '#8b5cf6');
          grad.addColorStop(1, '#ec4899');
          
          ctx.fillStyle = grad;
          ctx.fillRect(x, H - barHeight, barWidth - 2, barHeight);

          x += barWidth;
        }
      } else if (theme === 'circle') {
        analyser.getByteFrequencyData(dataArray);
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        const centerX = W / 2;
        const centerY = H / 2;
        const baseRadius = Math.min(W, H) * 0.25;

        // Draw pulsating circle
        ctx.beginPath();
        const average = dataArray.reduce((acc, v) => acc + v, 0) / bufferLength;
        const pulseRadius = baseRadius + (average / 255) * 40;
        
        ctx.arc(centerX, centerY, pulseRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
        ctx.lineWidth = 6;
        ctx.stroke();

        // Draw outer spectrum lines
        const numLines = 72;
        for (let i = 0; i < numLines; i++) {
          const angle = (i / numLines) * 2 * Math.PI;
          const valueIdx = Math.floor((i / numLines) * bufferLength);
          const val = dataArray[valueIdx];
          const lineLength = (val / 255) * 60;

          const startX = centerX + Math.cos(angle) * pulseRadius;
          const startY = centerY + Math.sin(angle) * pulseRadius;
          const endX = centerX + Math.cos(angle) * (pulseRadius + lineLength);
          const endY = centerY + Math.sin(angle) * (pulseRadius + lineLength);

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          
          // Color based on frequency value
          ctx.strokeStyle = `hsl(${(i / numLines) * 360}, 80%, 60%)`;
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      } else if (theme === 'wave') {
        analyser.getByteTimeDomainData(dataArray);
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#10b981'; // green accent
        ctx.beginPath();

        const sliceWidth = W / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * H) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(W, H / 2);
        ctx.stroke();
      }
    };

    draw();
  };

  const stopVisualizer = () => {
    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
  };

  const handlePlayPause = () => {
    if (!audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      stopVisualizer();
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      startVisualizer();
    }
  };

  useEffect(() => {
    return () => {
      stopVisualizer();
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 8 }}>
            ← Retour
          </button>
          <h1 className="page-title">Visualiseur Audio 3D/2D</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Chargez un fichier sonore local et observez ses ondes se dessiner en temps réel.</p>
        </div>
        <FolderButton toolId="audio_visualizer" toolName="Visualiseur Audio" />
      </div>

      <div className="grid-2">
        {/* Left Column: Import and controls */}
        <div className="card-premium" style={{ gap: 20 }}>
          <h2 className="card-title">Contrôles du fichier</h2>
          
          <label className="btn-premium btn-secondary" style={{ justifyContent: 'center', cursor: 'pointer', padding: '16px 20px', border: '1px dashed var(--border-light)', background: 'rgba(255,255,255,0.01)' }}>
            🎵 Choisir une musique (.mp3, .wav)
            <input type="file" accept="audio/*" onChange={handleAudioUpload} style={{ display: 'none' }} />
          </label>
          {audioFile && (
            <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>
              Fichier chargé : {audioFile.name}
            </div>
          )}

          {audioUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <audio 
                ref={audioRef} 
                src={audioUrl} 
                onEnded={() => { setIsPlaying(false); stopVisualizer(); }}
                style={{ display: 'none' }}
              />

              <button onClick={handlePlayPause} className="btn-premium btn-primary" style={{ justifyContent: 'center' }}>
                {isPlaying ? '⏸️ Mettre en pause' : '▶️ Lancer la lecture'}
              </button>

              <h2 className="card-title" style={{ marginTop: 10 }}>Style de visualiseur</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => setTheme('bars')} className={`btn-premium ${theme === 'bars' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '8px 10px', fontSize: '0.8rem' }}>Spectre Néon</button>
                <button onClick={() => setTheme('circle')} className={`btn-premium ${theme === 'circle' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '8px 10px', fontSize: '0.8rem' }}>Cercle Pulsant</button>
                <button onClick={() => setTheme('wave')} className={`btn-premium ${theme === 'wave' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '8px 10px', fontSize: '0.8rem' }}>Oscilloscope</button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Visualizer Canvas Display */}
        <div className="card-premium" style={{ gap: 20, justifyContent: 'center', alignItems: 'center' }}>
          <h2 className="card-title">Affichage Spectral</h2>
          
          <div style={{ width: '100%', border: '1px solid var(--border-light)', borderRadius: 16, overflow: 'hidden', backgroundColor: '#0a0a0f', display: 'flex' }}>
            <canvas 
              ref={canvasRef} 
              width={400} 
              height={260} 
              style={{ width: '100%', height: 260, display: 'block' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

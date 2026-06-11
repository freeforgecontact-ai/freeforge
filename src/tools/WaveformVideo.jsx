import React, { useState, useRef, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function WaveformVideo({ goBack }) {
  const [audioFile, setAudioFile] = useState(null);
  const [bgImage, setBgImage] = useState(null);
  const [bgPreview, setBgPreview] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [glowColor, setGlowColor] = useState('#8b5cf6');
  
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioElRef = useRef(null);
  
  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) setAudioFile(file);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBgImage(file);
      setBgPreview(URL.createObjectURL(file));
    }
  };

  const clearAll = () => {
    stopGeneration();
    setAudioFile(null);
    setBgImage(null);
    if (bgPreview) URL.revokeObjectURL(bgPreview);
    setBgPreview('');
    setIsGenerating(false);
    setGenerationProgress(0);
  };

  const startGeneration = async () => {
    if (!audioFile || !bgImage || !canvasRef.current) return;
    setIsGenerating(true);
    setGenerationProgress(0);

    // Initialize HTML Audio element
    const audioUrl = URL.createObjectURL(audioFile);
    const audio = new Audio(audioUrl);
    audioElRef.current = audio;
    
    // Load background image
    const img = new Image();
    img.src = bgPreview;
    await new Promise(r => img.onload = r);

    // Initialize Canvas settings
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Set up Web Audio API nodes
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = audioCtx;
    const source = audioCtx.createMediaElementSource(audio);
    const analyser = audioCtx.createAnalyser();
    
    // Smooth transition configuration
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Pipe sound directly to the output destination
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    // Render loop helper
    const draw = () => {
      if (!isGenerating) return;

      // Track progress
      if (audio.duration) {
        const percent = (audio.currentTime / audio.duration) * 100;
        setGenerationProgress(Math.round(percent));
      }

      // Draw background image scaled to cover canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Add a dark tint filter for better waveform contrast
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, 0, width, height);

      // Fetch sound bytes data
      analyser.getByteFrequencyData(dataArray);

      // Draw animated wave spectrum bars
      const barWidth = (width / bufferLength) * 1.5;
      let barHeight;
      let x = 0;

      ctx.shadowBlur = 15;
      ctx.shadowColor = glowColor;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * (height * 0.35); // Max 35% height

        // Dual gradient glow
        const grad = ctx.createLinearGradient(0, height - barHeight, 0, height);
        grad.addColorStop(0, glowColor);
        grad.addColorStop(1, 'rgba(236, 72, 153, 0.6)'); // pink secondary gradient

        ctx.fillStyle = grad;
        // Centered symmetry wave rendering
        ctx.fillRect(x, height / 2 - barHeight / 2, barWidth - 4, barHeight);

        x += barWidth;
      }

      // Reset shadows
      ctx.shadowBlur = 0;

      // Call recursively
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    // Capture Web Audio track stream
    const audioDest = audioCtx.createMediaStreamDestination();
    source.connect(audioDest);
    const audioTrack = audioDest.stream.getAudioTracks()[0];

    // Capture canvas visual stream (30 fps)
    const canvasStream = canvas.captureStream(30);
    const videoTrack = canvasStream.getVideoTracks()[0];

    // Combine tracks into single stream
    const combinedStream = new MediaStream([videoTrack, audioTrack]);

    // Initialize Media Recorder
    const recordedChunks = [];
    const options = { mimeType: 'video/webm;codecs=vp9,opus' };
    
    let mediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(combinedStream, options);
    } catch (e) {
      // Fallback mimeType
      mediaRecorder = new MediaRecorder(combinedStream);
    }
    
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      // Stop loop animation
      cancelAnimationFrame(animationFrameRef.current);
      
      // Clean resources
      URL.revokeObjectURL(audioUrl);
      audioCtx.close();

      // Download compiled WebM video
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const baseName = audioFile.name.substring(0, audioFile.name.lastIndexOf('.')) || audioFile.name;
      link.download = `${baseName}_spectrum.webm`;
      link.click();
      
      URL.revokeObjectURL(downloadUrl);
      setIsGenerating(false);
      setGenerationProgress(0);
      alert('Génération terminée ! La vidéo du spectre a été téléchargée.');
    };

    // Start recording & audio playback
    mediaRecorder.start();
    audio.play();
    draw();

    // Trigger stop when audio naturally finishes
    audio.onended = () => {
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    };
  };

  const stopGeneration = () => {
    if (audioElRef.current) {
      audioElRef.current.pause();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    cancelAnimationFrame(animationFrameRef.current);
    setIsGenerating(false);
    setGenerationProgress(0);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <button className="btn-premium btn-secondary" onClick={goBack} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          ← Retour
        </button>
        <span className="status-badge status-badge-primary">Vidéo</span>
        <FolderButton toolId="waveform" toolName="Waveform Vidéo" localStorageKeys={[]} />
      </div>

      <h1 className="page-title">Générateur Waveform Vidéo</h1>
      <p className="page-subtitle">Créez des vidéos musicales avec un spectre audio réactif animé, idéal pour Instagram ou TikTok, 100% hors-ligne.</p>

      <div className="grid-2">
        {/* Left column: Setup parameters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card-premium" style={{ cursor: 'default', gap: 16 }}>
            <h2 className="card-title" style={{ fontSize: '1rem' }}>Fichiers Sources</h2>
            
            {/* Audio selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>1. Fichier Audio (MP3/WAV)</label>
              <input 
                type="file" 
                accept="audio/*" 
                onChange={handleAudioChange} 
                className="input-premium"
                disabled={isGenerating}
              />
              {audioFile && <span style={{ fontSize: '0.75rem', color: '#10b981' }}>✓ {audioFile.name}</span>}
            </div>

            {/* Background image selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>2. Image de fond (Cover)</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                className="input-premium"
                disabled={isGenerating}
              />
              {bgImage && <span style={{ fontSize: '0.75rem', color: '#10b981' }}>✓ {bgImage.name}</span>}
            </div>

            {/* Color select */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Couleur du spectre</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input 
                  type="color" 
                  value={glowColor} 
                  onChange={e => setGlowColor(e.target.value)} 
                  style={{ width: 44, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', backgroundColor: 'transparent' }} 
                  disabled={isGenerating}
                />
                <input 
                  type="text" 
                  value={glowColor} 
                  onChange={e => setGlowColor(e.target.value)} 
                  className="input-premium"
                  style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                  disabled={isGenerating}
                />
              </div>
            </div>

            {/* Trigger buttons */}
            <div style={{ display: 'flex', gap: 10, borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
              {isGenerating ? (
                <button className="btn-premium btn-secondary" onClick={stopGeneration} style={{ flexGrow: 1, justifyContent: 'center', color: '#ef4444' }}>
                  Arrêter la génération
                </button>
              ) : (
                <button 
                  className="btn-premium btn-primary" 
                  onClick={startGeneration}
                  disabled={!audioFile || !bgImage}
                  style={{ flexGrow: 1, justifyContent: 'center' }}
                >
                  Générer la vidéo (.webm)
                </button>
              )}
              {(audioFile || bgImage) && !isGenerating && (
                <button className="btn-premium btn-secondary" onClick={clearAll} style={{ color: '#ef4444' }}>
                  Vider
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Video Canvas Render View */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Audio Visualizer Output Display */}
          <div 
            style={{ 
              width: '100%', 
              backgroundColor: 'rgba(0,0,0,0.5)', 
              border: '1px solid var(--border-light)', 
              borderRadius: 16, 
              padding: 16,
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Écran de Rendu (HD 1280x720)</span>
            
            <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-light)', backgroundColor: '#07070a' }}>
              <canvas 
                ref={canvasRef} 
                width="1280" 
                height="720" 
                style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            {isGenerating && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  <span>Enregistrement en temps réel...</span>
                  <span>{generationProgress}%</span>
                </div>
                <div style={{ width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${generationProgress}%`, height: '100%', background: 'var(--accent-gradient)', transition: 'width 0.2s ease' }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

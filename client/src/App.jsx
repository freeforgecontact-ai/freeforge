import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'search' | 'playlist'
  const [activePlaylistName, setActivePlaylistName] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [library, setLibrary] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  
  const [queue, setQueue] = useState([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Player options
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loop, setLoop] = useState('none'); // 'none' | 'one' | 'all'
  const [shuffle, setShuffle] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  
  // Recommendations and Autoplay
  const [autoplay, setAutoplay] = useState(() => localStorage.getItem('autoplay') !== 'false');
  const [recommendations, setRecommendations] = useState([]);
  const [isRecLoading, setIsRecLoading] = useState(false);
  
  // Download statuses
  const [downloads, setDownloads] = useState({});

  // Playlist management UI states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [activeDropdownTrackId, setActiveDropdownTrackId] = useState(null);

  const audioRef = useRef(null);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      if (activeTab === 'search') {
        setActiveTab('library');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [activeTab]);

  // Fetch local library
  const fetchLibrary = async () => {
    try {
      const res = await fetch('/api/library');
      const data = await res.json();
      setLibrary(data);
    } catch (err) {
      console.error('Error fetching library:', err);
    }
  };

  // Fetch all playlists
  const fetchPlaylists = async () => {
    try {
      const res = await fetch('/api/playlists');
      const data = await res.json();
      setPlaylists(data);
    } catch (err) {
      console.error('Error fetching playlists:', err);
    }
  };

  // Poll download statuses & update libraries
  useEffect(() => {
    fetchLibrary();
    fetchPlaylists();
    
    const interval = setInterval(async () => {
      try {
        // Poll downloads
        const res = await fetch('/api/downloads/status');
        const activeDL = await res.json();
        
        const dlMap = {};
        let hasActive = false;
        
        activeDL.forEach(dl => {
          dlMap[dl.id] = dl;
          if (dl.status === 'downloading') {
            hasActive = true;
          }
        });
        
        setDownloads(dlMap);
        
        // Refresh library when downloads finish
        if (activeDL.length === 0 || !hasActive) {
          fetchLibrary();
        }
      } catch (err) {
        console.error('Error updating statuses:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Sync HTML5 Audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownTrackId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Handle Search submit
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  // Trigger Backend Download
  const startDownload = async (track) => {
    try {
      setDownloads(prev => ({
        ...prev,
        [track.id]: { id: track.id, title: track.title, progress: 0, status: 'downloading' }
      }));
      
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: track.id,
          title: track.title,
          thumbnail: track.thumbnail,
          duration: track.duration,
          seconds: track.seconds,
          author: track.author
        })
      });
      await res.json();
    } catch (err) {
      console.error('Failed to trigger download:', err);
    }
  };

  // Delete local track
  const deleteTrack = async (id, e) => {
    if (e) e.stopPropagation();
    
    if (confirm('Voulez-vous vraiment supprimer cette musique de votre disque D: ?')) {
      try {
        const res = await fetch(`/api/songs/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchLibrary();
          setQueue(prev => prev.filter(t => t.id !== id));
        }
      } catch (err) {
        console.error('Error deleting track:', err);
      }
    }
  };

  // Playlist Management
  const createPlaylist = async (e) => {
    if (e) e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlaylistName.trim() })
      });
      
      if (res.ok) {
        const newPL = await res.json();
        fetchPlaylists();
        setActivePlaylistName(newPL.name);
        setActiveTab('playlist');
        setShowCreateModal(false);
        setNewPlaylistName('');
      } else {
        const err = await res.json();
        alert(err.error || 'Erreur lors de la création de la playlist');
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  };

  const addSongToPlaylist = async (playlistName, track, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/playlists/${encodeURIComponent(playlistName)}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song: track })
      });

      if (res.ok) {
        fetchPlaylists();
        setActiveDropdownTrackId(null);
        
        // Auto download if not already in local library
        const isDownloaded = library.some(t => t.id === track.id);
        if (!isDownloaded && isOnline) {
          startDownload(track);
        }
      }
    } catch (err) {
      console.error('Error adding song to playlist:', err);
    }
  };

  const removeSongFromPlaylist = async (playlistName, songId, e) => {
    if (e) e.stopPropagation();
    if (confirm('Retirer cette chanson de la playlist ?')) {
      try {
        const res = await fetch(`/api/playlists/${encodeURIComponent(playlistName)}/songs/${songId}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          fetchPlaylists();
        }
      } catch (err) {
        console.error('Error removing song:', err);
      }
    }
  };

  const deletePlaylist = async (playlistName) => {
    if (confirm(`Voulez-vous supprimer définitivement la playlist "${playlistName}" ?`)) {
      try {
        const res = await fetch(`/api/playlists/${encodeURIComponent(playlistName)}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          fetchPlaylists();
          setActiveTab('library');
          setActivePlaylistName(null);
        }
      } catch (err) {
        console.error('Error deleting playlist:', err);
      }
    }
  };

  // Export playlist to JSON file (100% client side download)
  const handleExportPlaylist = (playlist, e) => {
    if (e) e.stopPropagation();
    const cleanPlaylist = {
      name: playlist.name,
      songs: playlist.songs.map(s => ({
        id: s.id,
        title: s.title,
        author: s.author,
        thumbnail: s.thumbnail,
        duration: s.duration,
        seconds: s.seconds
      }))
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanPlaylist, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${playlist.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.vibelocal.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import playlist from JSON file
  const handleImportPlaylist = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const playlist = JSON.parse(event.target.result);
        if (!playlist.name || !Array.isArray(playlist.songs)) {
          alert("Format de fichier invalide. Veuillez importer un fichier de playlist .json VibeLocal valide.");
          return;
        }
        
        const res = await fetch('/api/playlists/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playlist })
        });
        
        if (res.ok) {
          const newPL = await res.json();
          fetchPlaylists();
          setActivePlaylistName(newPL.name);
          setActiveTab('playlist');
        } else {
          alert("Erreur lors de l'importation de la playlist.");
        }
      } catch (err) {
        alert("Impossible de lire le fichier JSON. Assurez-vous qu'il est bien au format JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };

  // Download all missing songs in playlist
  const handleDownloadAllSongs = async (playlistSongs, e) => {
    if (e) e.stopPropagation();
    const toDownload = playlistSongs.filter(s => !library.some(t => t.id === s.id));
    if (toDownload.length === 0) {
      alert("Tous les titres de cette playlist sont déjà téléchargés sur votre disque D: !");
      return;
    }
    if (confirm(`Télécharger les ${toDownload.length} titres manquants de cette playlist en arrière-plan ?`)) {
      for (const track of toDownload) {
        await startDownload(track);
        await new Promise(r => setTimeout(r, 200));
      }
      alert("Téléchargements démarrés ! Les morceaux s'ajouteront à votre disque dur D: au fur et à mesure.");
    }
  };

  const currentTrack = queue[currentQueueIndex] || null;

  // Fetch intelligent recommendations based on current track
  const fetchRecommendations = async (track) => {
    if (!track) return;
    setIsRecLoading(true);
    try {
      const res = await fetch(`/api/recommend?id=${track.id}&title=${encodeURIComponent(track.title)}&author=${encodeURIComponent(track.author)}`);
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setIsRecLoading(false);
    }
  };

  // Trigger recommendations loading
  useEffect(() => {
    if (currentTrack) {
      fetchRecommendations(currentTrack);
    } else {
      setRecommendations([]);
    }
  }, [currentTrack]);

  // Add a track to the active queue without interrupting current track
  const addToQueue = (track, e) => {
    if (e) e.stopPropagation();
    if (!queue.some(t => t.id === track.id)) {
      setQueue(prev => [...prev, track]);
      
      const isDownloaded = library.some(t => t.id === track.id);
      if (!isDownloaded && isOnline) {
        startDownload(track);
      }
    }
  };

  // Play a track and add it to queue
  const playTrack = (track) => {
    const isDownloaded = library.some(t => t.id === track.id);
    const indexInQueue = queue.findIndex(t => t.id === track.id);
    
    if (indexInQueue === -1) {
      const newQueue = [...queue];
      newQueue.push(track);
      setQueue(newQueue);
      setCurrentQueueIndex(newQueue.length - 1);
    } else {
      setCurrentQueueIndex(indexInQueue);
    }
    
    setIsPlaying(true);

    if (!isDownloaded && isOnline) {
      startDownload(track);
    }
  };

  // Play entire playlist
  const playPlaylist = (playlistSongs, startIndex = 0) => {
    if (!playlistSongs || playlistSongs.length === 0) return;
    setQueue([...playlistSongs]);
    setCurrentQueueIndex(startIndex);
    setIsPlaying(true);
  };

  // Play controls
  const togglePlay = () => {
    if (!currentTrack) return;
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    if (queue.length === 0) return;
    
    if (loop === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      return;
    }

    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      setCurrentQueueIndex(randomIndex);
      return;
    }

    if (currentQueueIndex < queue.length - 1) {
      setCurrentQueueIndex(currentQueueIndex + 1);
    } else if (loop === 'all') {
      setCurrentQueueIndex(0);
    } else if (autoplay && recommendations.length > 0) {
      const nextSong = recommendations[0];
      const newQueue = [...queue, nextSong];
      setQueue(newQueue);
      setCurrentQueueIndex(newQueue.length - 1);
      setIsPlaying(true);
      
      const isDownloaded = library.some(t => t.id === nextSong.id);
      if (!isDownloaded && isOnline) {
        startDownload(nextSong);
      }
    } else {
      setIsPlaying(false);
    }
  };

  const playPrev = () => {
    if (queue.length === 0) return;
    
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    if (currentQueueIndex > 0) {
      setCurrentQueueIndex(currentQueueIndex - 1);
    } else if (loop === 'all') {
      setCurrentQueueIndex(queue.length - 1);
    }
  };

  // Sync play state to html audio element
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(err => {
        console.error('Audio play failed:', err);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentQueueIndex]);

  // Determine media source: Local D:\ file or Live Proxy streaming
  const getAudioSrc = (track) => {
    if (!track) return '';
    const isDownloaded = library.some(t => t.id === track.id);
    return isDownloaded ? `/music/${track.id}.m4a` : `/api/stream/live?id=${track.id}`;
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const selectedPlaylist = playlists.find(p => p.name === activePlaylistName) || null;

  return (
    <div className="app-container">
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>

      {currentTrack && (
        <audio
          id="music-audio-element"
          ref={audioRef}
          src={getAudioSrc(currentTrack)}
          onTimeUpdate={() => setProgress(audioRef.current?.currentTime || 0)}
          onDurationChange={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={playNext}
        />
      )}

      {/* Left Sidebar */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{width: 22, height: 22, color: 'white'}}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <span className="logo-text">VibeLocal</span>
        </div>

        <nav className="sidebar-menu">
          <button 
            id="nav-library-btn"
            className={`sidebar-btn ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('library');
              setActivePlaylistName(null);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Ma Musique (D:)
          </button>
          
          <button 
            id="nav-search-btn"
            className={`sidebar-btn ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('search');
              setActivePlaylistName(null);
            }}
            disabled={!isOnline}
            style={{ opacity: isOnline ? 1 : 0.5 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Recherche (Online)
          </button>

          {/* Playlist Section header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, padding: '0 8px', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 1 }}>Playlists</span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {/* Import button */}
              <label 
                style={{ color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Importer une playlist (.json)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportPlaylist} 
                  style={{ display: 'none' }} 
                />
              </label>

              {/* Create button */}
              <button 
                onClick={() => setShowCreateModal(true)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                title="Créer une playlist"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Render Playlists list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
            {playlists.length > 0 ? (
              playlists.map((pl) => (
                <button
                  key={pl.name}
                  className={`sidebar-btn ${activeTab === 'playlist' && activePlaylistName === pl.name ? 'active' : ''}`}
                  onClick={() => {
                    setActivePlaylistName(pl.name);
                    setActiveTab('playlist');
                  }}
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  {pl.name}
                </button>
              ))
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0 12px', fontStyle: 'italic' }}>Aucune playlist</span>
            )}
          </div>
        </nav>

        {/* Network status info */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className={`offline-badge ${isOnline ? '' : 'offline'}`}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'currentColor' }} />
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </div>
          <div style={{ padding: '0 8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {library.length} titres locaux
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="main-content">
        {activeTab === 'search' && (
          <section>
            <h1 className="section-title">Découvrir et Télécharger</h1>
            <form onSubmit={handleSearch} className="search-wrapper">
              <span className="search-icon-pos">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 22, height: 22}}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                id="song-search-input"
                type="text"
                placeholder="Rechercher un artiste, une musique..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </form>

            <div className="track-grid">
              {searchResults.length > 0 ? (
                searchResults.map((track, i) => {
                  const isDownloaded = library.some(t => t.id === track.id);
                  const dlState = downloads[track.id];
                  
                  return (
                    <div 
                      key={track.id} 
                      className={`track-item ${currentTrack?.id === track.id ? 'playing' : ''}`}
                      onClick={() => playTrack(track)}
                    >
                      <span className="track-number">{i + 1}</span>
                      <img src={track.thumbnail} alt="" className="track-img" />
                      <div className="track-info">
                        <span className="track-title">{track.title}</span>
                        <span className="track-artist">{track.author}</span>
                      </div>
                      <span className="track-album" style={{ color: 'var(--text-muted)' }}>En ligne</span>
                      <span className="track-duration">{track.duration}</span>
                      <div className="track-actions" onClick={e => e.stopPropagation()}>
                        {/* Playlist Add Icon */}
                        <div style={{ position: 'relative' }}>
                          <button 
                            className="action-btn" 
                            title="Ajouter à une playlist"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownTrackId(activeDropdownTrackId === track.id ? null : track.id);
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          
                          {activeDropdownTrackId === track.id && (
                            <div style={{ position: 'absolute', right: 0, top: 40, width: 200, backgroundColor: 'rgba(18, 18, 28, 0.95)', border: '1px solid var(--border-color)', backdropFilter: 'blur(10px)', borderRadius: 8, zIndex: 10, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', padding: '4px 8px' }}>Ajouter à :</span>
                              {playlists.map(pl => (
                                <button 
                                  key={pl.name}
                                  className="sidebar-btn" 
                                  style={{ padding: '6px 8px', fontSize: '0.8rem', border: 'none' }}
                                  onClick={(e) => addSongToPlaylist(pl.name, track, e)}
                                >
                                  {pl.name}
                                </button>
                              ))}
                              <hr style={{ borderColor: 'var(--border-color)', margin: '4px 0' }} />
                              <button 
                                className="sidebar-btn" 
                                style={{ padding: '6px 8px', fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: 'bold', border: 'none' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowCreateModal(true);
                                  setActiveDropdownTrackId(null);
                                }}
                              >
                                + Nouvelle playlist
                              </button>
                            </div>
                          )}
                        </div>

                        {isDownloaded ? (
                          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{width: 20, height: 20}}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                        ) : dlState ? (
                          <div className="progress-ring">
                            <div className="spinner" />
                            <span className="progress-text">{Math.round(dlState.progress)}%</span>
                          </div>
                        ) : (
                          <button 
                            className="action-btn download-btn" 
                            title="Télécharger"
                            onClick={() => startDownload(track)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="empty-state-title">Aucune recherche effectuée</p>
                  <p className="empty-state-desc">Entrez le nom d'un artiste ou d'une chanson ci-dessus.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'library' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h1 className="section-title">Ma Musique en Local (D:)</h1>
              {library.length > 0 && (
                <button className="button-primary" onClick={() => playPlaylist(library, 0)}>
                  Lecture Aléatoire
                </button>
              )}
            </div>

            <div className="track-grid">
              {library.length > 0 ? (
                library.map((track, i) => (
                  <div 
                    key={track.id} 
                    className={`track-item ${currentTrack?.id === track.id ? 'playing' : ''}`}
                    onClick={() => playPlaylist(library, i)}
                  >
                    <span className="track-number">{i + 1}</span>
                    <img src={track.thumbnail} alt="" className="track-img" />
                    <div className="track-info">
                      <span className="track-title">{track.title}</span>
                      <span className="track-artist">{track.author}</span>
                    </div>
                    <span className="track-album" style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
                      Sur D:\
                    </span>
                    <span className="track-duration">{track.duration}</span>
                    <div className="track-actions" onClick={e => e.stopPropagation()}>
                      {/* Add to Playlist button */}
                      <div style={{ position: 'relative' }}>
                        <button 
                          className="action-btn" 
                          title="Ajouter à une playlist"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownTrackId(activeDropdownTrackId === track.id ? null : track.id);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        
                        {activeDropdownTrackId === track.id && (
                          <div style={{ position: 'absolute', right: 0, top: 40, width: 200, backgroundColor: 'rgba(18, 18, 28, 0.95)', border: '1px solid var(--border-color)', backdropFilter: 'blur(10px)', borderRadius: 8, zIndex: 10, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', padding: '4px 8px' }}>Ajouter à :</span>
                            {playlists.map(pl => (
                              <button 
                                key={pl.name}
                                className="sidebar-btn" 
                                style={{ padding: '6px 8px', fontSize: '0.8rem', border: 'none' }}
                                onClick={(e) => addSongToPlaylist(pl.name, track, e)}
                              >
                                {pl.name}
                              </button>
                            ))}
                            <hr style={{ borderColor: 'var(--border-color)', margin: '4px 0' }} />
                            <button 
                              className="sidebar-btn" 
                              style={{ padding: '6px 8px', fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: 'bold', border: 'none' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowCreateModal(true);
                                setActiveDropdownTrackId(null);
                              }}
                            >
                              + Nouvelle playlist
                            </button>
                          </div>
                        )}
                      </div>

                      <button 
                        className="action-btn" 
                        title="Supprimer du disque"
                        onClick={(e) => deleteTrack(track.id, e)}
                        style={{ color: '#ef4444' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 18, height: 18}}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="empty-state-title">Votre bibliothèque est vide</p>
                  <p className="empty-state-desc">Allez dans l'onglet Recherche pour trouver des chansons et les télécharger.</p>
                  {isOnline && (
                    <button className="button-primary" onClick={() => setActiveTab('search')} style={{ marginTop: 8 }}>
                      Rechercher des chansons
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Playlist Detail Tab */}
        {activeTab === 'playlist' && selectedPlaylist && (
          <section>
            <div style={{ display: 'flex', gap: '32px', marginBottom: '32px', alignItems: 'flex-end' }}>
              {/* Playlist Cover Generator */}
              <div style={{ width: 160, height: 160, borderRadius: 16, background: selectedPlaylist.songs.length > 0 ? `url(${selectedPlaylist.songs[0].thumbnail}) center/cover no-repeat` : 'var(--accent-gradient)', boxShadow: 'var(--accent-glow), 0 8px 20px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selectedPlaylist.songs.length === 0 && (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" style={{ width: 64, height: 64, color: 'white' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 2, color: 'var(--accent-color)', fontWeight: 700 }}>Playlist</span>
                <h1 className="section-title" style={{ marginBottom: 0, fontSize: '3rem' }}>{selectedPlaylist.name}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  <span>{selectedPlaylist.songs.length} titres</span>
                  <span>•</span>
                  <span>Sauvegardée localement</span>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', alignItems: 'center' }}>
                  {selectedPlaylist.songs.length > 0 && (
                    <>
                      <button className="button-primary" onClick={() => playPlaylist(selectedPlaylist.songs, 0)}>
                        Lecture
                      </button>
                      <button 
                        className="button-primary" 
                        style={{ background: 'rgba(255,255,255,0.08)', boxShadow: 'none', color: 'var(--text-primary)' }}
                        onClick={() => {
                          setShuffle(true);
                          playPlaylist(selectedPlaylist.songs, Math.floor(Math.random() * selectedPlaylist.songs.length));
                        }}
                      >
                        Lecture Aléatoire
                      </button>
                      
                      {/* Download all playlist songs button */}
                      {selectedPlaylist.songs.some(s => !library.some(t => t.id === s.id)) && (
                        <button 
                          className="button-primary"
                          style={{ background: 'var(--accent-gradient)', color: 'white' }}
                          onClick={(e) => handleDownloadAllSongs(selectedPlaylist.songs, e)}
                          title="Télécharger toutes les musiques manquantes pour l'écoute hors-ligne"
                        >
                          Tout Télécharger
                        </button>
                      )}
                    </>
                  )}
                  
                  {/* Export playlist button */}
                  <button 
                    className="action-btn"
                    title="Exporter la playlist (.json)"
                    style={{ height: 44, width: 44, borderRadius: 22, color: 'var(--text-primary)' }}
                    onClick={(e) => handleExportPlaylist(selectedPlaylist, e)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>

                  <button 
                    className="action-btn" 
                    title="Supprimer la playlist"
                    style={{ height: 44, width: 44, borderRadius: 22, color: '#ef4444' }}
                    onClick={() => deletePlaylist(selectedPlaylist.name)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* List of tracks inside the selected playlist */}
            <div className="track-grid">
              {selectedPlaylist.songs.length > 0 ? (
                selectedPlaylist.songs.map((track, i) => {
                  const isDownloaded = library.some(t => t.id === track.id);
                  return (
                    <div 
                      key={track.id} 
                      className={`track-item ${currentTrack?.id === track.id ? 'playing' : ''}`}
                      onClick={() => playPlaylist(selectedPlaylist.songs, i)}
                    >
                      <span className="track-number">{i + 1}</span>
                      <img src={track.thumbnail} alt="" className="track-img" />
                      <div className="track-info">
                        <span className="track-title">{track.title}</span>
                        <span className="track-artist">{track.author}</span>
                      </div>
                      <span className="track-album" style={{ color: isDownloaded ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: isDownloaded ? '#10b981' : 'var(--text-muted)' }} />
                        {isDownloaded ? 'Stocké sur D:\\' : 'Streaming Premium'}
                      </span>
                      <span className="track-duration">{track.duration}</span>
                      <div className="track-actions" onClick={e => e.stopPropagation()}>
                        <button 
                          className="action-btn" 
                          title="Retirer de la playlist"
                          onClick={(e) => removeSongFromPlaylist(selectedPlaylist.name, track.id, e)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <p className="empty-state-title">Aucune chanson dans cette playlist</p>
                  <p className="empty-state-desc">Recherchez ou naviguez dans vos musiques et cliquez sur le bouton "+" pour ajouter des titres.</p>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Slide-out Queue Panel */}
      <div className={`queue-panel ${isQueueOpen ? 'open' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="queue-header">
          <span className="queue-title">File d'attente ({queue.length})</span>
          <button className="nav-btn" onClick={() => setIsQueueOpen(false)}>
            Fermer
          </button>
        </div>
        
        <div className="queue-list" style={{ flex: '1 1 50%', minHeight: 0 }}>
          {queue.map((track, i) => (
            <div 
              key={`${track.id}-${i}`} 
              className={`queue-item ${currentQueueIndex === i ? 'active' : ''}`}
              onClick={() => {
                setCurrentQueueIndex(i);
                setIsPlaying(true);
              }}
            >
              <img src={track.thumbnail} alt="" className="track-img" style={{ width: 32, height: 32 }} />
              <div className="track-info" style={{ paddingLeft: 8 }}>
                <span className="track-title" style={{ fontSize: '0.85rem' }}>{track.title}</span>
                <span className="track-artist" style={{ fontSize: '0.75rem' }}>{track.author}</span>
              </div>
              <span className="track-duration" style={{ fontSize: '0.75rem' }}>{track.duration}</span>
            </div>
          ))}
        </div>

        {/* Suggestions Recommandées Section */}
        <div className="recommendations-section" style={{ flex: '1 1 50%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="recommendations-title-row">
            <span>Suggestions de lecture</span>
            {isRecLoading && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mise à jour...</span>
            )}
          </div>

          <div className="recommendations-list">
            {recommendations.length > 0 ? (
              recommendations.map((track) => (
                <div 
                  key={track.id} 
                  className={`recommendation-item ${track.source === 'local' ? 'local-rec' : ''}`}
                  onClick={() => playTrack(track)}
                  title={track.source === 'local' ? "Disponible hors-ligne sur D:\\" : "Disponible en streaming"}
                >
                  <img src={track.thumbnail} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover' }} />
                  <div className="recommendation-info">
                    <span className="recommendation-title">{track.title}</span>
                    <span className="recommendation-artist">
                      {track.source === 'local' ? '📂 ' : ''}{track.author}
                    </span>
                  </div>
                  <div className="recommendation-actions" onClick={e => e.stopPropagation()}>
                    <button 
                      className="recommendation-btn" 
                      title="Ajouter à la file d'attente"
                      onClick={(e) => addToQueue(track, e)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ width: 12, height: 12 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <button 
                      className="recommendation-btn" 
                      title="Lire ce titre"
                      onClick={() => playTrack(track)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" style={{ width: 10, height: 10 }}>
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', fontStyle: 'italic' }}>
                {currentTrack ? "Aucune suggestion trouvée" : "Lancez un titre pour obtenir des suggestions"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Playlist Creation Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <form 
            onSubmit={createPlaylist}
            style={{ width: '100%', maxWidth: 400, backgroundColor: '#12121a', border: '1px solid var(--border-color)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Créer une playlist</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="modal-pl-input" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Nom de la playlist</label>
              <input
                id="modal-pl-input"
                type="text"
                placeholder="Ex: Soirée Lofi, Workout, Calme..."
                value={newPlaylistName}
                onChange={e => setNewPlaylistName(e.target.value)}
                autoFocus
                className="search-input"
                style={{ padding: '12px 16px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button 
                type="button" 
                className="button-primary"
                style={{ background: 'rgba(255,255,255,0.05)', boxShadow: 'none', color: 'var(--text-secondary)' }}
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPlaylistName('');
                }}
              >
                Annuler
              </button>
              <button type="submit" className="button-primary">
                Créer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Player Controller Bar (Bottom) */}
      <footer className="player-bar">
        <div className="player-track-info">
          {currentTrack ? (
            <>
              <img src={currentTrack.thumbnail} alt="" className="player-img" />
              <div className="player-text">
                <span className="player-title">{currentTrack.title}</span>
                <span className="player-artist">{currentTrack.author}</span>
              </div>
              {isPlaying && (
                <div className="mini-visualizer" title="Lecteur actif">
                  <div className="visualizer-bar" />
                  <div className="visualizer-bar" />
                  <div className="visualizer-bar" />
                  <div className="visualizer-bar" />
                </div>
              )}
            </>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Aucun titre sélectionné
            </div>
          )}
        </div>

        <div className="player-controls">
          <div className="control-buttons">
            <button 
              className={`nav-btn ${shuffle ? 'active' : ''}`} 
              title="Lecture aléatoire"
              onClick={() => setShuffle(!shuffle)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 20, height: 20}}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>

            <button className="nav-btn" onClick={playPrev} title="Titre précédent">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 22, height: 22}}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>

            <button className="play-btn" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Lecture'}>
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" style={{width: 22, height: 22}}>
                  <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" style={{width: 22, height: 22, marginLeft: 2}}>
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            <button className="nav-btn" onClick={playNext} title="Titre suivant">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 22, height: 22}}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.934 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 005 8v8a1 1 0 001.6.8l5.334-4zM19.934 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.334-4z" />
              </svg>
            </button>

            <button 
              className={`nav-btn ${loop !== 'none' ? 'active' : ''}`} 
              title={loop === 'one' ? 'Répéter le titre' : loop === 'all' ? 'Répéter la file d\'attente' : 'Ne pas répéter'}
              onClick={() => {
                if (loop === 'none') setLoop('all');
                else if (loop === 'all') setLoop('one');
                else setLoop('none');
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 20, height: 20}}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 6H16" />
              </svg>
              {loop === 'one' && <span style={{ fontSize: '0.6rem', position: 'absolute', fontWeight: 'bold', transform: 'translate(11px, -6px)', backgroundColor: 'var(--accent-color)', color: 'white', padding: '1px 3px', borderRadius: 4 }}>1</span>}
            </button>

            <button 
              className={`nav-btn autoplay-btn ${autoplay ? 'active' : ''}`} 
              title={autoplay ? "Lecture automatique infinie (Activée)" : "Lecture automatique infinie (Désactivée)"}
              onClick={() => {
                const nextVal = !autoplay;
                setAutoplay(nextVal);
                localStorage.setItem('autoplay', String(nextVal));
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{width: 20, height: 20}}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 7.5c-2.3 0-3.5 1.5-4.5 3-1-1.5-2.2-3-4.5-3A4.5 4.5 0 003 12a4.5 4.5 0 004.5 4.5c2.3 0 3.5-1.5 4.5-3 1 1.5 2.2 3 4.5 3a4.5 4.5 0 004.5-4.5 4.5 4.5 0 00-4.5-4.5z" />
              </svg>
            </button>
          </div>

          <div className="timeline-container">
            <span className="time-label">{formatTime(progress)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={progress}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setProgress(val);
                if (audioRef.current) {
                  audioRef.current.currentTime = val;
                }
              }}
              className="slider"
            />
            <span className="time-label">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="player-options">
          <button 
            className={`nav-btn ${isQueueOpen ? 'active' : ''}`} 
            onClick={() => setIsQueueOpen(!isQueueOpen)}
            title="File d'attente"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 22, height: 22}}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="volume-container">
            <button className="nav-btn" onClick={() => setIsMuted(!isMuted)} title="Muet">
              {isMuted || volume === 0 ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 22, height: 22}}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 22, height: 22}}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              className="slider"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}

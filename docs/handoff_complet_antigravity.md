# 📘 Document de Transfert Technique Complet (Antigravity -> Claude)

Ce document récapitule **toutes** les implémentations, corrections et ajouts d'outils réalisés par l'agent **Antigravity**. Il fournit à **Claude** toutes les instructions et détails requis pour intégrer et publier l'ensemble de ces modifications sur le site de production **`freeforge.pgrg.ca`**.

---

## 🚀 1. Cartographie du Dépôt Git & des Branches

Toutes les modifications de code ont été testées localement, compilent parfaitement (`npm run build`) et ont été poussées sur le dépôt distant. Voici la correspondance des branches à déployer :

| Composant / Suite | Port Dev | Branche Git Cible | Description des Fichiers Clés Livrés |
| :--- | :---: | :--- | :--- |
| **Backend Unifié** (`local-yt-music`) | `3001` | `local-yt-music` | `server.js` (API unifiée, gestion des répertoires, queue de conversion), `package.json`, `.gitignore` |
| **Forge Dev 2** (`freeforge-dev2`) | `5175` | `suite-dev2` | `src/tools/MediaConverter.jsx` (Batch), `src/App.jsx` |
| **FreeForge Majeur** (`freeforge`) | `5174` | `master` | `docs/handoff.md`, `docs/handoff_finition_100.md` |
| **Suite Voyage** (`freeforge-travel`) | `5182` | `suite-travel` | Outils finition 100% (PhotosVoyage, PartageFrais, Itinéraire) |
| **Suite Creators** (`freeforge-creators`) | `5181` | `suite-creators` | Outils finition (PaletteCouleurs, MetronomeBPM, DetoureurImages) |
| **Suite Étudiants** (`freeforge-student`) | `5180` | `suite-student` | Outils finition (PDFOrganisateur, FlashcardsQuizzer, PomodoroStudy) |
| **Suite Style de Vie** (`freeforge-life`) | `5177` | `suite-life` | Outils finition (JournalMoodTracker chiffré, CalorieMacroTracker, Kanban) |
| **Suite Finance** (`freeforge-finance`) | `5179` | `suite-finance` | Outils finition (EpargneRetraite REER/CELI/CELIAPP) |
| **Suite Utilitaires** (`freeforge-everyday`) | `5178` | `suite-everyday` | Outils finition (WhiteNoiseMixer, CookingConverter) |
| **Suite Cuisine & Santé** (`freeforge-healthy`) | `5183` | `suite-healthy` | Outils finition (MeditationSons, HydratationLog) |

---

## 🎞️ 2. Focus : Convertisseur de Médias en Lot (`media_converter`)
*Ajouté à 100% dans la Suite Développeur Niveau 2*

Cet outil permet aux PME et Développeurs d'importer et de convertir localement en tâche de fond des volumes importants de fichiers média grâce à l'intégration de `multer` et de processus enfants `ffmpeg` asynchrones.

### Fonctionnement Technique :
1. **Téléversement (`POST /api/media/upload`)** : Téléversement en lot via `multer` dans un dossier temporaire `temp_uploads/`.
2. **File d'Attente de Conversion (`POST /api/media/convert`)** :
   - Initialise une structure de suivi de job identifiée par un `jobId`.
   - Spawne un processus `ffmpeg` par fichier en tâche de fond.
   - Analyse la sortie standard (stderr) du processus `ffmpeg` pour extraire la durée totale de la vidéo (`Duration: ...`) et la position actuelle (`time=...`), calculant ainsi une progression exacte (0% à 100%).
3. **Polling de Statut (`GET /api/media/job/:jobId`)** : Le client interroge l'API à intervalle régulier pour mettre à jour les barres de progression individuelles et globales.
4. **Téléchargements (`GET /api/media/download/:fileId` & `GET /api/media/download-zip/:jobId`)** :
   - Permet de télécharger chaque fichier converti individuellement.
   - Permet d'exporter l'ensemble du lot converti dans une archive `.ZIP` générée en mémoire par le backend à l'aide de la librairie `jszip`.
5. **Options supportées par fichier** :
   - **Vidéos** : MP4, WEBM, MKV, AVI, MOV, conversion en GIF animé, ou extraction audio directe (MP3/WAV). Choix du profil de résolution : Originale, 1080p, 720p, 480p.
   - **Images** : PNG, JPEG, WEBP, GIF, BMP, TIFF avec redimensionnement personnalisé (largeur/hauteur en pixels) et curseur de qualité.
   - **Audio** : MP3 et WAV avec choix du débit binaire (128k, 192k, 256k, 320k).

---

## 🎵 3. Focus : Améliorations Majeures de VibeLocal (Radio Premium)
*Résolution des bogues de téléchargement et ajouts de fonctionnalités*

### Corrections de téléchargement (yt-dlp) :
- **Sécurisation des cookies** : Configuration de `cookies.txt` supportée en local et dans le dossier principal $D:$. Ajout de règles dans `.gitignore` pour s'assurer que les cookies personnels de Clody ne soient jamais indexés ou publiés sur GitHub.
- **Résolution des erreurs SABR de YouTube** : Nettoyage des arguments passés à `yt-dlp` en supprimant l'extraction forcée par client mobile Android (qui causait des plantages `Requested format is not available` suite aux changements d'API de YouTube). Le choix du client est maintenant dynamique et géré par `yt-dlp`.

### Nouvelles fonctionnalités :
- **Suggestions recommandées** : Implémentation de `/api/recommend`. Il recherche en direct des titres similaires à la chanson en cours (en combinant le titre et l'auteur) tout en scannant la bibliothèque locale pour suggérer des titres locaux associés, créant ainsi une file de recommandations intelligentes de 15 titres.
- **Autoplay (Lecture Infinie) ♾️** : Bouton d'activation dans le lecteur React (sauvegardé localement). Si la file d'attente se vide, le lecteur sélectionne et injecte automatiquement la première recommandation suggérée, lançant une lecture continue.

---

## ⚜️ 4. Synthèse des 31 Outils Client-Side Corrigés (Claude Audit)

Voici les détails d'implémentation de la phase de finition des 31 outils, qui fonctionnent tous de façon autonome dans le navigateur :

### Outils PDF et Images (P0 & P1) :
- **PDF Organizer & Splitter** : Intégration de `pdf-lib` via import dynamique. Découpe réelle par plages (ex: `1-3, 5`), fusion par lot et génération de Blob pour téléchargement client-side.
- **Photo Compress for Social** : Compression d'images via Canvas, recadrage interactif (ratios 1:1, 9:16) et export JPEG/WebP.
- **Color Palette Extractor** : Quantification des couleurs dominantes via échantillonnage Canvas. Verrouillage de couleur (lock hex) fonctionnel.
- **Chroma-Key Background Remover** : Détourage couleur pixel-par-pixel (distance Euclidienne 3D dans l'espace RGBA) avec tolérance ajustable et export PNG transparent.

### Outils Audio, Ambiance & Zen (P0 & P1) :
- **Mixeur de Bruit Blanc** : Synthèse et boucles pour 6 canaux (Pluie, Vent, Feu, Vagues, Café, Bruit Blanc) avec potentiomètres de volumes individuels et master.
- **Meditation Ambient Soundscape** : Console Web Audio avec ondes delta binaurales réelles (100Hz/104Hz), bols tibétains physiques synthétisés avec LFO de volume, pluie filtrée, cloches zen aléatoires et fondu de volume de fin (fade-out) de 5s.
- **Guitar Tuner & Metronome** : Accordeur par pitch-detection sur microphone avec graphique d'aiguille de précision, et Tap Tempo basé sur la moyenne de temps des 4 derniers clics.

### Outils Organisation & Calculs (P1 & P2) :
- **Journal Intime Local** : Chiffrement symétrique client-side fort AES-GCM (dérivation PBKDF2 à partir du mot de passe utilisateur) avec écran de verrouillage et persistance des entrées chiffrées dans le `localStorage` (`fl_journal_enc`).
- **Calorie & Macro Tracker** : Saisie de repas et de macros avec graphique de répartition sous forme de donut SVG natif dynamique.
- **SRS Flashcards Quizzer** : Algorithme de répétition espacée Leitner (5 boîtes de progression/rétrogradation automatique) sauvegardé localement.
- **Calculateur de Retraite** : Projections canadiennes réelles (REER, CELI, CELIAPP) avec intégration des plafonds fiscaux 2026 et correction pour inflation.
- **Itinéraire & Checklist Voyage** : Checklist de vêtements calculée selon la durée et 4 climats, et planificateur d'itinéraire avec sommation budgétaire en temps réel.
- **Partage de Frais** : Calculateur d'équilibre optimisant les transactions financières entre N voyageurs éditables.
- **Rappel d'Eau (Hydratation Log)** : Notification Web de rappel et effet sonore synthétique de goutte d'eau (plip audio).
- **Kanban Board** : Gestionnaire avec support complet du Drag & Drop HTML5 natif.
- **Flexbox & Grid Playground** : Support interactif complet du CSS Grid avec prévisualisation et copie de code.
- **Mock API Server** : Persistance locale des routes mockées et correction de l'import React `useEffect`.

---

## 🛠️ 5. Instructions de Déploiement pour Claude

1. **Vérification de Compilation** :
   À la racine du projet, exécuter la commande pour valider que tous les modules transpilent :
   ```bash
   npm run build
   ```
2. **Déploiement des Pages Statiques (Frontend)** :
   Chaque suite produit son dossier `dist/` dans son répertoire respectif lors du build. Claude doit copier ou lier ces dossiers de build vers les sous-domaines appropriés de `freeforge.pgrg.ca` (ex: `dev2.freeforge.pgrg.ca`, `travel.freeforge.pgrg.ca`, etc.).
3. **Déploiement du Service Backend** :
   Déployer les fichiers de `local-yt-music` sur le serveur local de destination. S'assurer que :
   - `ffmpeg` est installé et présent dans le `PATH` du serveur.
   - Les répertoires de stockage `D:\LocalYTMusic` (pour VibeLocal) et `D:\FreeForge` (pour les dossiers d'outils) existent ou possèdent les droits d'écriture, ou à défaut que le fallback dans le profil utilisateur soit autorisé.
   - Lancer le serveur avec `npm run dev` (ou PM2 en production).
4. **Vérification de Sécurité (Cookies)** :
   Ne jamais transférer ou héberger un fichier `cookies.txt` contenant des identifiants actifs de compte dans un répertoire public. Laisser l'utilisateur placer son propre fichier `cookies.txt` dans son répertoire de musique local pour activer le contournement des restrictions d'âge YouTube.

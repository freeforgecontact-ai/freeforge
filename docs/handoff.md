# FreeForge - Document de Transfert Technique (Handoff) Global

Ce document fournit un guide technique ultra-complet de l'architecture, du fonctionnement et de l'implémentation de la plateforme **FreeForge** (`freeforge.pgrg.ca`). Il décrit la configuration des **10 applications distinctes** fonctionnant en monorepo local et s'appuyant sur un serveur backend unifié. 

Il est conçu pour permettre à tout développeur ou modèle d'IA (même local ou léger, comme Claude Sonnet / Haiku) de corriger des bogues, de modifier les fonctionnalités actuelles, ou de rajouter de nouveaux outils sans friction.

---

## 1. Vision Technique & Architecture Globale

FreeForge est conçu pour s'exécuter **à 100% côté client (Client-side)** pour tous ses outils, tout en s'appuyant sur un serveur Node local léger pour des fonctionnalités PC avancées (ouverture de répertoires physiques sous Windows, compilation native en fichier `.exe` via le compilateur C# `csc.exe`, et empaquetage d'applications Android).

### Configuration des Ports & Workspaces :
La plateforme utilise un **NPM Workspace** (monorepo) structuré comme suit :
*   `local-yt-music` (Backend) : **Port 3001** (gère le proxy audio local sans publicité, la gestion des dossiers locaux et les compilateurs)
*   `freeforge` (Suite de base + PME Québec + Radio VibeLocal) : **Port 5174**
*   `freeforge-dev2` (Suite Développeurs Niveau 2 + WebToExecutable) : **Port 5175**
*   `freeforge-gamers` (Suite Gamers) : **Port 5176**
*   `freeforge-life` (Suite Style de Vie & Santé) : **Port 5177**
*   `freeforge-everyday` (Suite Utilitaires du Quotidien) : **Port 5178**
*   `freeforge-finance` (Suite Finance & Investissement) : **Port 5179**
*   `freeforge-student` (Suite Étudiante & Éducation) : **Port 5180**
*   `freeforge-creators` (Suite Créateurs & Design) : **Port 5181**
*   `freeforge-travel` (Suite Voyage & Aventure) : **Port 5182**
*   `freeforge-healthy` (Suite Cuisine & Santé Corporelle) : **Port 5183**

---

## 2. Intégrations Spécifiques & Fonctionnalités Clés

### 📁 Bouton "Dossier Local" (`FolderButton.jsx`)
Chaque outil intègre un bouton **Dossier Local**.
*   **Sur PC** : Il appelle `/api/open-folder` sur le serveur local pour ouvrir le répertoire de l'outil sous `D:\FreeForge\<NomOutil>` (ou fallback dans le dossier utilisateur en cas d'absence de lecteur D:).
*   **Sur Mobile** : Si le serveur n'est pas détecté, il bascule sur une interface modale hors-ligne permettant d'exporter ou d'importer toutes les données de l'outil au format JSON pour les sauvegarder.

### 🚀 compilateur WebToExecutable (Intégration Windows & Android)
L'outil `WebToExecutable` dans la suite `freeforge-dev2` appelle les points d'accès `/api/package-exe` et `/api/package-apk` :
1.  **Windows (.exe)** : Écrit un wrapper C# utilisant `HttpListener` et un WebView Edge. Il compile ce code avec `csc.exe` natif de Windows (`C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe`) en y incorporant le code web ZIP dans les ressources binaires.
2.  **Android (.apk)** : Génère un projet Gradle complet configuré avec un WebView Java/Kotlin optimisé et prêt à compiler avec `gradlew assembleDebug`.

---

## 3. Descriptif Complet des Outils par Suite (81 Outils au Total)

### ⚜️ Suite 1 : FreeForge Majeure (`freeforge` - Port 5174)
1.  **VibeLocal (Radio Premium)** : Lecteur de musique local contournant le blocage IP YouTube par l'argument `--extractor-args youtube:player_client=android` et authentification par fichier local `cookies.txt`.
2.  **Compresseur d'Images** : Optimisation par lot sur canvas (JPEG/PNG/WebP).
3.  **Générateur Glassmorphism** : Concepteur de styles de verre acrylique interactifs.
4.  **Formatteur & Arbre JSON** : Validateur et exploreur d'objets JSON interactif.
5.  **Optimiseur & Coloriseur SVG** : Nettoyage XML et modification de couleurs.
6.  **Éditeur Markdown vers PDF** : Rédaction avec prévisualisation et style d'impression A4.
7.  **Éditeur de Tags MP3** : Modification des métadonnées de fichiers MP3 (`browser-id3-writer`).
8.  **Découpeur Audio** : Montage WAV/MP3 dans le navigateur via Web Audio API.
9.  **Générateur Waveform Vidéo** : Spectre sonore animé encodé en MP4 localement.
10. **Factures PME** : Saisie guidée de factures avec calcul de TPS/TVQ et export PDF.
11. **Calculateur de Taxes** : Taxes TPS (5%) et TVQ (9,975%) directes et inverses.
12. **Simulateur Impôt Québec** : Tranches de revenus progressives et calculs RRQ/RQAP/RAMQ.
13. **Créateur de Soumissions** : Génération de devis avec signature électronique sur Canvas.
14. **Horaires d'Employés** : Grille horaire d'équipe hebdomadaire avec calcul des coûts salariaux.
15. **Registre Kilométrique** : Enregistrement fiscal des déplacements selon les taux de Revenu Québec.
16. **Plan d'Affaires Guidé** : Rédacteur de plan d'affaires avec export Markdown/PDF.
17. **Gestionnaire de Reçus & ZIP** : Registre de notes de frais et export ZIP des fichiers reçus.

### 🛠️ Suite 2 : Développeurs Niveau 2 (`freeforge-dev2` - Port 5175)
1.  **Cron Builder & Visualizer** : Concepteur et traducteur d'expressions CRON en clair.
2.  **JWT Debugger & Tool** : Décodage, édition et signature HMAC SHA-256 locale.
3.  **RegEx Tester & Parser** : Coloration syntaxique et capture de groupes en direct.
4.  **Base64 / URL / HTML Encoder** : Encodage et décodage universel incluant les fichiers.
5.  **Mock API Server Builder** : Routeur de mocks exportable en Service Worker.
6.  **Git Command Visualizer** : Arbre de commits interactif expliquant merge/rebase/cherry-pick.
7.  **Flexbox & Grid Playground** : Concepteur interactif de structures flex et grilles CSS.
8.  **Color Contrast & A11y Checker** : Ratios WCAG 2.1 et filtres SVG de daltonisme.
9.  **WebToExecutable** : Compilateur local en Windows EXE (C# `csc.exe`) et Android ZIP.

### 🎮 Suite 3 : Suite Gamers (`freeforge-gamers` - Port 5176)
1.  **Crosshair Generator & Exporter** : Conception visuelle de viseurs pour FPS et export PNG.
2.  **Aim Sensitivity Converter** : Convertisseur de sensibilité souris inter-jeux.
3.  **FPS & Hardware Logbook** : Journal de benchmark et de performance graphique.
4.  **Gamertag & Clan Name Generator** : Générateur de pseudos stylisés Unicode.
5.  **Steam Library Sorter** : Gestionnaire de backlog et sélecteur de jeux.
6.  **Tournament Bracket Drawer** : Générateur de tableaux de tournoi interactifs.
7.  **RGB Light Sync Designer** : Simulateur d'effets lumineux LED pour claviers.
8.  **8-Bit Retro Sound Generator** : Synthétiseur de sons rétro avec oscillateurs Web Audio.

### 🏃 Suite 4 : Style de Vie & Santé (`freeforge-life` - Port 5177)
1.  **Workout Builder & Timer** : Planificateur d'entraînements musculation/HIIT avec synthèse vocale.
2.  **Calorie & Macro Tracker** : Journal alimentaire et graphique de ratios de macronutriments.
3.  **Budget Personnel (50/30/20)** : Répartition financière interactive de vos dépenses.
4.  **Resume/CV Builder & PDF Export** : Rédacteur de CV guidé avec style d'impression soigné.
5.  **Journal Intime Local** : Journal intime crypté localement avec suivi mensuel de l'humeur.
6.  **Habit Tracker Grid** : Grille de suivi des habitudes et statistiques de streaks.
7.  **Checklist de Voyage Dynamique** : Valise optimisée selon la météo et la durée.
8.  **Kanban Task Board** : Tableau Kanban réactif local pour la gestion des tâches.

### 🍎 Suite 5 : Utilitaires du Quotidien (`freeforge-everyday` - Port 5178)
1.  **Scanner de Frigo & Recettes** : Suggère des repas à partir des ingrédients restants.
2.  **Convertisseur de Cuisine** : Redimensionnement de portions de recettes et conversions.
3.  **Kids Story Weaver** : Contes interactifs à embranchements pour enfants.
4.  **Simulateur Hydro-Québec** : Estimation de factures d'électricité selon le Tarif D.
5.  **Calculateur de Pourboires** : Partage d'additions de restaurants et taxes.
6.  **Multi-Timer de Cuisson** : Minuteurs de cuisson parallèles avec alarmes sonores.
7.  **Concepteur de Cartes de Vœux** : Créateur de cartes d'invitation avec export PNG.
8.  **White Noise Soundscape Mixer** : Console de mixage de bruits ambiants relaxants.

### 💰 Suite 6 : Finance & Investissement (`freeforge-finance` - Port 5179)
1.  **Crypto Portfolio Tracker** : Suivi local d'actifs cryptographiques.
2.  **Simulateur Hypothécaire Québec** : Planificateur de mensualités et amortissement.
3.  **Calculateur d'Intérêts Composés** : Simulation d'épargne avec graphiques d'évolution.
4.  **Stock Dividend Tracker** : Journal et calendrier prévisionnel des dividendes.
5.  **Calculateur de Salaire Net Québec** : Déductions provinciales et fédérales.
6.  **Planificateur de Retraite** : Projections pour REER, CELI et CELIAPP.
7.  **Fonds d'Urgence Simulateur** : Calcule le nombre de mois de dépenses de sécurité requis.
8.  **Debt Payoff Planner** : Remboursement de dettes par méthode Avalanche/Neige.

### 🎓 Suite 7 : Étudiants & Éducation (`freeforge-student` - Port 5180)
1.  **Calculateur Cote R & GPA** : Suivi de moyenne pondérée pour étudiants au Québec.
2.  **Flashcard Active Quizzer** : Fiches d'apprentissage avec système SRS de répétition.
3.  **Pomodoro Focus Engine** : Minuteur Pomodoro personnalisable avec bruit de fond.
4.  **Générateur de Citations** : Formateur automatique de bibliographies (APA, MLA).
5.  **PDF Organizer & Splitter** : Découpage et fusion de fichiers PDF 100% locaux.
6.  **Mind Map Vector Drawer** : Concepteur visuel de cartes mentales SVG.
7.  **Analyseur de Texte & Lisibilité** : Indice Flesch-Kincaid et densité de mots-clés.
8.  **Class & Schedule Planner** : Calendrier de session et rappels d'examens.

### 🎨 Suite 8 : Créateurs & Design (`freeforge-creators` - Port 5181)
1.  **Color Palette Extractor** : Extraction de couleurs d'une image par Canvas.
2.  **CSS Gradient & Pattern Maker** : Création interactive de dégradés et motifs CSS.
3.  **Typography Pairer** : Aperçu de combinaisons de polices web Google Fonts.
4.  **Chroma-Key Background Remover** : Détourage couleur sur images par Canvas.
5.  **Thumbnail Safe Area Visualizer** : Cadre de marges sécurisées pour vignettes de vidéos.
6.  **Text Shadow Engine** : Générateur d'effets d'ombres complexes 3D CSS.
7.  **Vector SVG Editor** : Édition vectorielle de tracés avec export de composants React.
8.  **BPM & Tap Tempo Metronome** : Outil rythmique avec métronome sonore Web Audio.

### ✈️ Suite 9 : Voyage & Aventure (`freeforge-travel` - Port 5182)
1.  **Offline Currency Converter** : Convertisseur de devises avec cache de taux.
2.  **Travel Itinerary Planner** : Planificateur de voyage et budget quotidien.
3.  **Packing List Optimizer** : Générateur dynamique de listes de bagages.
4.  **World Time Buddy** : Planificateur de réunions multi-fuseaux horaires.
5.  **Travel Expense Splitter** : Calcul de dépenses partagées entre voyageurs.
6.  **Emergency Card Generator** : Fiches d'urgence médicales téléchargeables.
7.  **Calculateur Carburant Roadtrip** : Estimation du coût en essence par distance.
8.  **Photo Compress for Social** : Redimensionnement optimisé de photos de voyage.

### 🍏 Suite 10 : Cuisine & Santé Corporelle (`freeforge-healthy` - Port 5183)
1.  **Recipe Scaler & Converter** : Ajusteur de portions d'ingrédients.
2.  **Pantry & Expiration Tracker** : Alerte de péremption de vos denrées alimentaires.
3.  **Water Intake Log** : Journal d'hydratation avec rappels sonores.
4.  **Calculateur IMC & Métabolisme** : Besoins caloriques journaliers (BMR/IMC).
5.  **Sleep Cycle Calculator** : Heures idéales de réveil basées sur le sommeil de 90min.
6.  **Meal Prep Menu Planner** : Menu hebdomadaire et liste de courses partagée.
7.  **Calculateur de Nutriments & Macros** : Équilibrage de l'apport énergétique quotidien.
8.  **Ambient soundscape for Meditation** : Console de mixage audio relaxante.

---

## 4. Instructions de Maintenance & Débogage pour les IA

1.  **Lancement local global** :
    Pour lancer l'ensemble des 10 serveurs de dev, vous pouvez lancer `npm run dev` dans chaque dossier de workspace respectif, ou utiliser la commande de démarrage groupée.
2.  **Découpage et compilation** :
    Chaque projet compile de façon isolée. Si vous modifiez un fichier partagé ou un composant comme `FolderButton.jsx`, exécutez `npm run build` à la racine pour vous assurer que les 9 workspaces de l'application se compilent sans problème :
    `npm run build --workspaces`
3.  **Bugs de formatage JSON dans le localStorage** :
    Si une IA ajoute des données locales complexes, assurez-vous de toujours utiliser `try { JSON.parse(...) } catch` pour éviter les plantages au chargement de l'outil si la clé du `localStorage` contient des données corrompues ou obsolètes.
4.  **Impression PDF** :
    Assurez-vous que les classes `no-print` sont appliquées sur les éléments d'interface d'édition pour masquer les barres de contrôle et maximiser le rendu A4 sur fond blanc lors de l'impression PDF.
5.  **Débogage des téléchargements audio (yt-dlp)** :
    En raison de l'expérimentation de streaming SABR-only déployée par YouTube sur les flux mobiles, évitez de forcer l'argument d'extraction `--extractor-args youtube:player_client=android` dans les commandes `yt-dlp` sous peine de générer des erreurs `Requested format is not available`. Laissez `yt-dlp` gérer le choix du client par défaut.

# Spotistics - Spotify Statistik Dashboard

Eine moderne Web-Anwendung zur Visualisierung von Spotify-Hörgewohnheiten und Musikstatistiken.

## ✨ Features

- **🎵 Spotify Integration**: Vollständige Integration mit der Spotify Web API
- **📊 Detaillierte Statistiken**: Top Tracks, Künstler, Audio-Features und Hör-Aktivität
- **🎧 Musik-Previews**: Höre Musik-Previews direkt beim Hovern über Song-Cover
- **📱 Responsive Design**: Optimiert für Desktop und Mobile
- **🎨 Modernes Design**: Dunkles Theme basierend auf dem Design System
- **⚡ Performance**: Schnelle Ladezeiten durch optimierte API-Aufrufe

## 🚀 Technologie-Stack

- **Frontend & Backend**: Next.js 14 mit App Router
- **Authentifizierung**: NextAuth.js mit Spotify OAuth
- **Styling**: Tailwind CSS mit Custom Design System
- **Charts**: Recharts für Datenvisualisierung
- **TypeScript**: Vollständige Typisierung
- **Icons**: Lucide React

## 📦 Installation

### Voraussetzungen

- Node.js 18+ 
- npm oder yarn
- Spotify Developer Account

### 1. Repository klonen

```bash
git clone <repository-url>
cd spotistics
```

### 2. Abhängigkeiten installieren

```bash
npm install
# oder
yarn install
```

### 3. Spotify App erstellen

1. Gehen Sie zu [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Erstellen Sie eine neue App
3. Fügen Sie `http://localhost:3000/api/auth/callback/spotify` zu den Redirect URIs hinzu
4. Notieren Sie sich Client ID und Client Secret

### 4. Umgebungsvariablen konfigurieren

Erstellen Sie eine `.env.local` Datei:

```env
SPOTIFY_CLIENT_ID=ihre_spotify_client_id
SPOTIFY_CLIENT_SECRET=ihr_spotify_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=ihr_nextauth_secret_hier
```

**NextAuth Secret generieren:**
```bash
openssl rand -base64 32
```

### 5. Anwendung starten

```bash
npm run dev
# oder
yarn dev
```

Die Anwendung ist unter `http://localhost:3000` verfügbar.

## 🔧 Konfiguration

### Design System

Das Design System ist in `tailwind.config.js` definiert und basiert auf der `Design.json`:

- **Farben**: Dunkles Theme mit Accent-Farben
- **Typografie**: Inter Font Familie
- **Komponenten**: Konsistente Styling-Patterns
- **Animationen**: Smooth Hover- und Transition-Effekte

### API-Berechtigungen

Die App benötigt folgende Spotify-Berechtigungen:

- `user-read-email`: E-Mail-Adresse lesen
- `user-read-private`: Benutzerprofil lesen
- `user-top-read`: Top Tracks und Künstler lesen
- `user-read-recently-played`: Kürzlich gespielte Tracks
- `user-library-read`: Gespeicherte Tracks lesen
- `streaming`: Web Playback SDK

## 📁 Projektstruktur

```
spotistics/
├── app/                    # Next.js App Router
│   ├── api/auth/          # NextAuth API Routes
│   ├── dashboard/         # Dashboard Seite
│   ├── login/            # Login Seite
│   └── globals.css       # Globale Styles
├── components/            # React Komponenten
│   ├── StatCard.tsx      # Statistik Karten
│   ├── TrackPlayer.tsx   # Musik Player Komponente
│   ├── ArtistCard.tsx    # Künstler Karten
│   └── ...
├── lib/                  # Utility Funktionen
│   └── spotify.ts       # Spotify API Client
├── types/               # TypeScript Typen
│   ├── spotify.ts      # Spotify API Typen
│   └── next-auth.d.ts  # NextAuth Typen
└── Design.json         # Design System Definition
```

## 🎯 Features im Detail

### Dashboard Übersicht

- **Statistik Karten**: Überblick über Top Tracks, Künstler, Follower
- **Top Tracks**: Liste der meistgehörten Songs mit Musik-Previews
- **Top Künstler**: Lieblingskünstler mit Genre-Tags und Popularität
- **Audio Features**: Radar-Chart der Musik-Eigenschaften
- **Hör-Aktivität**: Zeitbasierte Analyse der Musikwiedergabe

### Musik-Preview System

- **Hover-Wiedergabe**: 30-Sekunden-Previews beim Hovern
- **Play/Pause Steuerung**: Intuitive Musik-Kontrollen
- **Visual Feedback**: Animierte Play-Buttons und Hover-Effekte

### Responsive Design

- **Mobile-First**: Optimiert für alle Bildschirmgrößen
- **Touch-Freundlich**: Große Touch-Targets für mobile Geräte
- **Flexible Layouts**: Grid-System passt sich an verschiedene Bildschirme an

## 🔒 Sicherheit

- **OAuth 2.0**: Sichere Authentifizierung über Spotify
- **Token-Refresh**: Automatische Erneuerung von Access Tokens
- **Session-Management**: Sichere Session-Verwaltung mit NextAuth
- **Environment Variables**: Sensible Daten in Umgebungsvariablen

## 🚀 Deployment

### Vercel (Empfohlen)

1. Repository zu Vercel verbinden
2. Umgebungsvariablen hinzufügen
3. Redirect URI in Spotify App auf Production-URL ändern

### Andere Plattformen

Die App kann auf jeder Node.js-fähigen Plattform deployed werden:

```bash
npm run build
npm start
```

## 🤝 Beitrag

1. Fork das Repository
2. Erstellen Sie einen Feature Branch
3. Committen Sie Ihre Änderungen
4. Erstellen Sie eine Pull Request

## 📄 Lizenz

Dieses Projekt steht unter der MIT Lizenz.

## 🆘 Support

Bei Problemen oder Fragen:

1. Überprüfen Sie die [Spotify Web API Dokumentation](https://developer.spotify.com/documentation/web-api)
2. Schauen Sie in die [NextAuth.js Dokumentation](https://next-auth.js.org)
3. Erstellen Sie ein Issue in diesem Repository

---

**Hinweis**: Diese Anwendung ist ein Demo-Projekt und nicht offiziell von Spotify unterstützt. 
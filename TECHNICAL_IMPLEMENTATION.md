# 🛠️ Technische Implementierungs-Anleitung: Spotistics Erweiterungen

## 📊 Aktueller Stand der API-Integration

### ✅ Bereits implementiert (lib/spotify.ts)
```typescript
- getCurrentUser() - Benutzer-Profil
- getTopTracks/Artists() - Top Listen mit Zeiträumen
- getRecentlyPlayed() - Kürzlich gespielt 
- getFollowedArtists() - Gefolgte Künstler
- getAudioFeatures() - Basic Audio Features
- search() - Grundlegende Suche
- Player Control: play/pause/transfer/getCurrentPlaybackState
- Device Management: getAvailableDevices()
```

### 🔄 Empfohlene Reihenfolge für nächste Features

## 🎯 Phase 1: Erweiterte Audio-Analysen (MVP)

### 1.1 Advanced Audio Features Dashboard

**Neue API Methods in lib/spotify.ts:**
```typescript
// Erweiterte Audio Analysis (granular)
async getAudioAnalysis(trackId: string) {
  return this.request(`/audio-analysis/${trackId}`)
}

// Mehrere Tracks gleichzeitig
async getMultipleAudioFeatures(trackIds: string[]) {
  const batches = []
  for (let i = 0; i < trackIds.length; i += 100) {
    const batch = trackIds.slice(i, i + 100)
    batches.push(this.getAudioFeatures(batch))
  }
  const results = await Promise.all(batches)
  return results.flatMap(result => result.audio_features)
}

// Genre Seeds für Empfehlungen
async getAvailableGenreSeeds() {
  return this.request('/recommendations/available-genre-seeds')
}
```

**Neue Komponente: `AdvancedAudioFeatures.tsx`**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { Radar } from 'react-chartjs-2'
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface AudioFeaturesRadarProps {
  tracks: SpotifyTrack[]
}

export default function AudioFeaturesRadar({ tracks }: AudioFeaturesRadarProps) {
  const [features, setFeatures] = useState<any[]>([])
  
  const radarData = {
    labels: [
      'Danceability', 'Energy', 'Speechiness', 
      'Acousticness', 'Instrumentalness', 'Liveness', 'Valence'
    ],
    datasets: [{
      label: 'Durchschnittliche Audio Features',
      data: calculateAverageFeatures(features),
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      borderColor: 'rgba(34, 197, 94, 1)',
      pointBackgroundColor: 'rgba(34, 197, 94, 1)'
    }]
  }

  return (
    <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm">
      <h3 className="text-xl font-bold mb-4">Audio Features Profil</h3>
      <div className="h-96">
        <Radar data={radarData} options={{
          scales: {
            r: {
              beginAtZero: true,
              max: 1
            }
          }
        }} />
      </div>
    </div>
  )
}
```

### 1.2 Tempo & Key Analysis

**Neue Komponente: `TempoKeyAnalysis.tsx`**
```typescript
interface TempoDistribution {
  range: string
  count: number
  percentage: number
}

export default function TempoKeyAnalysis({ tracks }: { tracks: SpotifyTrack[] }) {
  const tempoRanges = [
    { min: 0, max: 70, label: 'Langsam (0-70 BPM)' },
    { min: 70, max: 100, label: 'Gemäßigt (70-100 BPM)' },
    { min: 100, max: 130, label: 'Mittel (100-130 BPM)' },
    { min: 130, max: 160, label: 'Schnell (130-160 BPM)' },
    { min: 160, max: 999, label: 'Sehr schnell (160+ BPM)' }
  ]

  const keyLabels = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 
    'F#', 'G', 'G#', 'A', 'A#', 'B'
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TempoChart tracks={tracks} ranges={tempoRanges} />
      <KeyChart tracks={tracks} keyLabels={keyLabels} />
    </div>
  )
}
```

## 📈 Phase 2: Temporal Analytics

### 2.1 Listening Patterns Analysis

**Neue API Methods:**
```typescript
// Erweiterte Recently Played mit Timestamps
async getRecentlyPlayedWithTime(limit: number = 50, after?: number, before?: number) {
  let url = `/me/player/recently-played?limit=${limit}`
  if (after) url += `&after=${after}`
  if (before) url += `&before=${before}`
  return this.request<RecentlyPlayedResponse>(url)
}

// Listening History über längeren Zeitraum
async getExtendedListeningHistory(days: number = 30) {
  const tracks = []
  const now = Date.now()
  const oneDayMs = 24 * 60 * 60 * 1000
  
  for (let i = 0; i < days; i++) {
    const after = now - ((i + 1) * oneDayMs)
    const before = now - (i * oneDayMs)
    
    try {
      const data = await this.getRecentlyPlayedWithTime(50, after, before)
      tracks.push(...data.items)
      // Rate limiting beachten
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.warn(`Fehler beim Laden von Tag ${i}:`, error)
    }
  }
  
  return tracks
}
```

**Neue Komponente: `ListeningPatterns.tsx`**
```typescript
interface HourlyPattern {
  hour: number
  count: number
  avgEnergy: number
  avgValence: number
}

export default function ListeningPatterns() {
  const [patterns, setPatterns] = useState<HourlyPattern[]>([])
  
  const generateHeatmapData = (tracks: any[]) => {
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: 0,
      totalEnergy: 0,
      totalValence: 0
    }))
    
    tracks.forEach(item => {
      const hour = new Date(item.played_at).getHours()
      hourlyData[hour].count++
      // Audio features würden hier addiert werden
    })
    
    return hourlyData.map(data => ({
      ...data,
      avgEnergy: data.count > 0 ? data.totalEnergy / data.count : 0,
      avgValence: data.count > 0 ? data.totalValence / data.count : 0
    }))
  }

  return (
    <div className="space-y-6">
      <HourlyHeatmap data={patterns} />
      <WeekdayPattern data={patterns} />
      <MoodByTime data={patterns} />
    </div>
  )
}
```

## 🎵 Phase 3: Smart Recommendations

### 3.1 Mood-Based Recommendations

**Erweiterte API Methods:**
```typescript
// Smart Recommendations
async getRecommendations(options: {
  seed_artists?: string[]
  seed_tracks?: string[]
  seed_genres?: string[]
  limit?: number
  market?: string
  // Audio feature targets
  min_acousticness?: number
  max_acousticness?: number
  target_acousticness?: number
  min_danceability?: number
  max_danceability?: number
  target_danceability?: number
  min_energy?: number
  max_energy?: number
  target_energy?: number
  min_valence?: number
  max_valence?: number
  target_valence?: number
  min_tempo?: number
  max_tempo?: number
  target_tempo?: number
}) {
  const params = new URLSearchParams()
  
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        params.append(key, value.join(','))
      } else {
        params.append(key, value.toString())
      }
    }
  })
  
  return this.request(`/recommendations?${params.toString()}`)
}

// Mood Presets
getMoodRecommendations(mood: 'happy' | 'sad' | 'energetic' | 'chill' | 'focused') {
  const moodConfigs = {
    happy: {
      target_valence: 0.8,
      target_energy: 0.7,
      target_danceability: 0.7
    },
    sad: {
      target_valence: 0.2,
      target_energy: 0.3,
      target_acousticness: 0.7
    },
    energetic: {
      target_energy: 0.9,
      target_danceability: 0.8,
      min_tempo: 120
    },
    chill: {
      target_energy: 0.3,
      target_valence: 0.6,
      max_tempo: 100
    },
    focused: {
      target_instrumentalness: 0.7,
      target_energy: 0.4,
      max_speechiness: 0.1
    }
  }
  
  return this.getRecommendations({
    ...moodConfigs[mood],
    limit: 20
  })
}
```

**Komponente: `SmartRecommendations.tsx`**
```typescript
export default function SmartRecommendations() {
  const [mood, setMood] = useState<string>('')
  const [recommendations, setRecommendations] = useState<SpotifyTrack[]>([])
  
  const moodOptions = [
    { value: 'happy', label: '😊 Fröhlich', color: 'bg-yellow-500' },
    { value: 'energetic', label: '⚡ Energetisch', color: 'bg-red-500' },
    { value: 'chill', label: '😌 Entspannt', color: 'bg-blue-500' },
    { value: 'focused', label: '🎯 Fokussiert', color: 'bg-purple-500' },
    { value: 'sad', label: '😢 Melancholisch', color: 'bg-gray-500' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {moodOptions.map(option => (
          <button
            key={option.value}
            onClick={() => generateMoodPlaylist(option.value)}
            className={`px-4 py-2 rounded-full ${option.color} text-white hover:opacity-80 transition-opacity`}
          >
            {option.label}
          </button>
        ))}
      </div>
      
      {recommendations.length > 0 && (
        <RecommendationsList tracks={recommendations} />
      )}
    </div>
  )
}
```

## 📚 Phase 4: Library Analytics

### 4.1 Saved Music Statistics

**Neue API Methods:**
```typescript
// Library Management
async getMySavedTracks(limit: number = 50, offset: number = 0) {
  return this.request(`/me/tracks?limit=${limit}&offset=${offset}`)
}

async getMySavedAlbums(limit: number = 50, offset: number = 0) {
  return this.request(`/me/albums?limit=${limit}&offset=${offset}`)
}

async getAllSavedTracks() {
  let allTracks = []
  let offset = 0
  const limit = 50
  
  while (true) {
    const response = await this.getMySavedTracks(limit, offset)
    allTracks.push(...response.items)
    
    if (response.items.length < limit) break
    offset += limit
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return allTracks
}

// Library Analytics
async getLibraryStats() {
  const [tracks, albums] = await Promise.all([
    this.getAllSavedTracks(),
    this.getMySavedAlbums()
  ])
  
  return {
    totalTracks: tracks.length,
    totalAlbums: albums.length,
    // Weitere Statistiken...
  }
}
```

### 4.2 Duplicate Detection & Organization

**Utility Functions:**
```typescript
// lib/libraryUtils.ts
export function findDuplicateTracks(tracks: any[]) {
  const trackMap = new Map()
  const duplicates = []
  
  tracks.forEach((track, index) => {
    const key = `${track.track.name.toLowerCase()}-${track.track.artists[0].name.toLowerCase()}`
    
    if (trackMap.has(key)) {
      duplicates.push({
        original: trackMap.get(key),
        duplicate: { ...track, index }
      })
    } else {
      trackMap.set(key, { ...track, index })
    }
  })
  
  return duplicates
}

export function organizeByGenre(tracks: any[]) {
  // Genre-Analyse basierend auf Artist-Daten
  const genreMap = new Map()
  
  tracks.forEach(track => {
    track.track.artists.forEach(artist => {
      // Hier würde man artist.genres verwenden (separate API call erforderlich)
    })
  })
  
  return genreMap
}

export function analyzeReleaseYears(tracks: any[]) {
  const yearCounts = new Map()
  
  tracks.forEach(track => {
    const year = new Date(track.track.album.release_date).getFullYear()
    yearCounts.set(year, (yearCounts.get(year) || 0) + 1)
  })
  
  return Array.from(yearCounts.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, count]) => ({ year, count }))
}
```

## 🎤 Phase 5: Podcast Integration

### 5.1 Shows & Episodes

**Neue API Methods für Podcasts:**
```typescript
// Podcast APIs
async getShow(showId: string, market: string = 'US') {
  return this.request(`/shows/${showId}?market=${market}`)
}

async getShows(showIds: string[], market: string = 'US') {
  const ids = showIds.join(',')
  return this.request(`/shows?ids=${ids}&market=${market}`)
}

async getShowEpisodes(showId: string, limit: number = 20, offset: number = 0) {
  return this.request(`/shows/${showId}/episodes?limit=${limit}&offset=${offset}`)
}

async getMySavedShows(limit: number = 50, offset: number = 0) {
  return this.request(`/me/shows?limit=${limit}&offset=${offset}`)
}

async getMySavedEpisodes(limit: number = 50, offset: number = 0) {
  return this.request(`/me/episodes?limit=${limit}&offset=${offset}`)
}
```

**Podcast Dashboard Komponente:**
```typescript
export default function PodcastDashboard() {
  const [shows, setShows] = useState([])
  const [episodes, setEpisodes] = useState([])
  const [stats, setStats] = useState(null)

  return (
    <div className="space-y-8">
      <PodcastOverview stats={stats} />
      <SavedShows shows={shows} />
      <RecentEpisodes episodes={episodes} />
      <PodcastGenres shows={shows} />
    </div>
  )
}
```

## 🔧 Development Setup für neue Features

### Dependencies hinzufügen:
```bash
npm install chart.js react-chartjs-2
npm install d3 @types/d3
npm install date-fns
npm install recharts
npm install framer-motion
npm install @headlessui/react
```

### Neue Typen definieren:
```typescript
// types/spotify.ts erweitern
export interface ExtendedAudioFeatures extends AudioFeatures {
  // Zusätzliche Analysis-Daten
  key_confidence?: number
  mode_confidence?: number
  time_signature_confidence?: number
}

export interface AudioAnalysis {
  bars: Array<{ start: number; duration: number; confidence: number }>
  beats: Array<{ start: number; duration: number; confidence: number }>
  sections: Array<{ 
    start: number
    duration: number
    confidence: number
    loudness: number
    tempo: number
    key: number
    mode: number
  }>
  segments: Array<{
    start: number
    duration: number
    confidence: number
    loudness_start: number
    loudness_max: number
    pitches: number[]
    timbre: number[]
  }>
}

export interface Recommendation {
  tracks: SpotifyTrack[]
  seeds: Array<{
    afterFilteringSize: number
    afterRelinkingSize: number
    href: string
    id: string
    initialPoolSize: number
    type: 'artist' | 'track' | 'genre'
  }>
}
```

### Testing Strategy:
```typescript
// __tests__/spotify-api.test.ts
describe('Spotify API Extensions', () => {
  test('should get audio analysis', async () => {
    const api = new SpotifyApi('mock-token')
    const analysis = await api.getAudioAnalysis('track-id')
    expect(analysis).toHaveProperty('bars')
    expect(analysis).toHaveProperty('beats')
  })

  test('should generate mood recommendations', async () => {
    const api = new SpotifyApi('mock-token')
    const recs = await api.getMoodRecommendations('happy')
    expect(recs.tracks).toHaveLength(20)
  })
})
```

## 📊 Performance Überlegungen

### 1. API Rate Limiting
```typescript
class RateLimiter {
  private requests: number[] = []
  private readonly maxRequests = 100
  private readonly timeWindow = 60000 // 1 Minute

  async throttle() {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.timeWindow)
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests)
      const waitTime = this.timeWindow - (now - oldestRequest)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    this.requests.push(now)
  }
}
```

### 2. Caching Strategy
```typescript
// lib/cache.ts
export class SpotifyCache {
  private cache = new Map()
  private readonly TTL = 5 * 60 * 1000 // 5 Minuten

  set(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
}
```

### 3. Batch Processing
```typescript
// Für große Datenmengen
async function processBatch<T>(items: T[], batchSize: number, processor: (batch: T[]) => Promise<any>) {
  const results = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const result = await processor(batch)
    results.push(result)
    
    // Rate limiting zwischen Batches
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  
  return results
}
```

---

Diese technische Anleitung bietet eine strukturierte Herangehensweise zur Implementierung der nächsten Features und berücksichtigt Performance, Testing und Best Practices für die Spotify API Integration. 
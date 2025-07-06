import { SpotifyApi, AccessToken } from '@spotify/web-api-ts-sdk'
import { getSession } from 'next-auth/react'
import type { Session } from 'next-auth'

// Erweiterte Session Type für Spotify Token
interface SpotifySession extends Session {
  accessToken?: string
  refreshToken?: string
  tokenExpires?: number
}

// Globale SDK-Instanz
let spotifyApiInstance: SpotifyApi | null = null

// ==========================================================================
// SPOTIFY SDK INITIALIZATION - Direkte SDK-Nutzung
// ==========================================================================

/**
 * Erstellt oder gibt die Spotify API SDK-Instanz zurück
 * Verwendet das offizielle SDK direkt ohne Wrapper
 */
export async function getSpotifyApi(): Promise<SpotifyApi | null> {
  try {
    const session = await getSession() as SpotifySession
    
    if (!session?.accessToken) {
      console.warn('Keine Spotify-Authentifizierung verfügbar')
      return null
    }

    // Erstelle neue SDK-Instanz wenn nötig
    if (!spotifyApiInstance) {
      const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
      if (!clientId) {
        console.error('NEXT_PUBLIC_SPOTIFY_CLIENT_ID ist nicht gesetzt')
        return null
      }

      const accessToken: AccessToken = {
        access_token: session.accessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: session.refreshToken || ''
      }

      // Verwende das offizielle SDK direkt
      spotifyApiInstance = SpotifyApi.withAccessToken(clientId, accessToken)
    }

    return spotifyApiInstance
  } catch (error) {
    console.error('Fehler beim Initialisieren der Spotify API:', error)
    return null
  }
}

/**
 * Erneuert die SDK-Instanz (bei Token-Refresh)
 */
export function refreshSpotifyApi(): void {
  spotifyApiInstance = null
}

/**
 * Überprüft ob der Nutzer Spotify Premium hat
 */
export async function checkPremiumStatus(): Promise<boolean> {
  try {
    const sdk = await getSpotifyApi()
    if (!sdk) return false
    
    const user = await sdk.currentUser.profile()
    return user.product === 'premium'
  } catch (error) {
    console.error('Fehler beim Prüfen des Premium-Status:', error)
    return false
  }
}

/**
 * Überprüft ob ein Track aktuell spielt
 */
export async function isCurrentlyPlaying(trackId: string): Promise<boolean> {
  try {
    const sdk = await getSpotifyApi()
    if (!sdk) return false
    
    const currentTrack = await sdk.player.getCurrentlyPlayingTrack()
    return currentTrack?.item?.id === trackId && currentTrack?.is_playing === true
  } catch (error) {
    console.error('Fehler beim Prüfen des aktuellen Tracks:', error)
    return false
  }
}

// ==========================================================================
// LIBRARY ANALYTICS FUNCTIONS
// ==========================================================================

/**
 * Holt ALLE gespeicherten Tracks des Users (kann sehr viele sein)
 */
export async function getAllSavedTracks(): Promise<any[]> {
  try {
    const sdk = await getSpotifyApi()
    if (!sdk) throw new Error('Spotify API nicht verfügbar')

    let allTracks: any[] = []
    let offset = 0
    const limit = 50
    
    console.log('🎵 Lade alle gespeicherten Tracks...')
    
    while (true) {
      const response = await sdk.currentUser.tracks.savedTracks(limit, offset)
      allTracks.push(...response.items)
      
      console.log(`📦 Geladen: ${allTracks.length} Tracks`)
      
      // Wenn weniger als limit zurückgegeben wird, sind wir am Ende
      if (response.items.length < limit) break
      
      offset += limit
      
      // Rate limiting - Spotify erlaubt ~1 Request/Sekunde
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log(`✅ Insgesamt ${allTracks.length} gespeicherte Tracks geladen`)
    return allTracks
  } catch (error) {
    console.error('Fehler beim Laden der gespeicherten Tracks:', error)
    throw error
  }
}

/**
 * Holt ALLE gespeicherten Alben des Users
 */
export async function getAllSavedAlbums(): Promise<any[]> {
  try {
    const sdk = await getSpotifyApi()
    if (!sdk) throw new Error('Spotify API nicht verfügbar')

    let allAlbums: any[] = []
    let offset = 0
    const limit = 50
    
    console.log('💿 Lade alle gespeicherten Alben...')
    
    while (true) {
      const response = await sdk.currentUser.albums.savedAlbums(limit, offset)
      allAlbums.push(...response.items)
      
      console.log(`📦 Geladen: ${allAlbums.length} Alben`)
      
      if (response.items.length < limit) break
      
      offset += limit
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log(`✅ Insgesamt ${allAlbums.length} gespeicherte Alben geladen`)
    return allAlbums
  } catch (error) {
    console.error('Fehler beim Laden der gespeicherten Alben:', error)
    throw error
  }
}

/**
 * Holt ALLE Playlists des Users
 */
export async function getAllUserPlaylists(): Promise<any[]> {
  try {
    const sdk = await getSpotifyApi()
    if (!sdk) throw new Error('Spotify API nicht verfügbar')

    let allPlaylists: any[] = []
    let offset = 0
    const limit = 50
    
    console.log('📋 Lade alle Playlists...')
    
    while (true) {
      const response = await sdk.currentUser.playlists.playlists(limit, offset)
      allPlaylists.push(...response.items)
      
      console.log(`📦 Geladen: ${allPlaylists.length} Playlists`)
      
      if (response.items.length < limit) break
      
      offset += limit
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log(`✅ Insgesamt ${allPlaylists.length} Playlists geladen`)
    return allPlaylists
  } catch (error) {
    console.error('Fehler beim Laden der Playlists:', error)
    throw error
  }
}

/**
 * Analysiert die Library für Duplikate
 */
export function findDuplicateTracks(tracks: any[]): Array<{original: any, duplicate: any}> {
  const trackMap = new Map()
  const duplicates: Array<{original: any, duplicate: any}> = []
  
  tracks.forEach((savedTrack, index) => {
    const track = savedTrack.track
    // Erstelle einen Key basierend auf Track-Name und erstem Artist
    const key = `${track.name.toLowerCase().trim()}-${track.artists[0]?.name.toLowerCase().trim()}`
    
    if (trackMap.has(key)) {
      duplicates.push({
        original: trackMap.get(key),
        duplicate: { ...savedTrack, index }
      })
    } else {
      trackMap.set(key, { ...savedTrack, index })
    }
  })
  
  return duplicates
}

/**
 * Analysiert die zeitliche Entwicklung der Library
 */
export function analyzeLibraryGrowth(tracks: any[]): Array<{date: string, count: number}> {
  const dateMap = new Map()
  
  tracks.forEach(savedTrack => {
    const addedDate = new Date(savedTrack.added_at).toISOString().split('T')[0]
    dateMap.set(addedDate, (dateMap.get(addedDate) || 0) + 1)
  })
  
  // Sortiere nach Datum
  const sortedDates = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
  
  // Berechne kumulative Summe
  let cumulativeCount = 0
  return sortedDates.map(([date, count]) => {
    cumulativeCount += count
    return { date, count: cumulativeCount }
  })
}

/**
 * Analysiert Genre-Verteilung basierend auf Artist-Genres
 */
export function analyzeGenreDistribution(tracks: any[]): Array<{genre: string, count: number}> {
  const genreMap = new Map()
  
  tracks.forEach(savedTrack => {
    const track = savedTrack.track
    track.artists.forEach((artist: any) => {
      if (artist.genres && Array.isArray(artist.genres)) {
        artist.genres.forEach((genre: string) => {
          genreMap.set(genre, (genreMap.get(genre) || 0) + 1)
        })
      }
    })
  })
  
  return Array.from(genreMap.entries())
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20) // Top 20 Genres
}

/**
 * Berechnet erweiterte Library-Statistiken
 */
export function calculateLibraryStats(tracks: any[], albums: any[], playlists: any[]) {
  const now = new Date()
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
  
  const recentTracks = tracks.filter(t => new Date(t.added_at) > oneMonthAgo)
  const yearlyTracks = tracks.filter(t => new Date(t.added_at) > oneYearAgo)
  
  const totalDuration = tracks.reduce((sum, t) => sum + (t.track?.duration_ms || 0), 0)
  const avgPopularity = tracks.length > 0 
    ? tracks.reduce((sum, t) => sum + (t.track?.popularity || 0), 0) / tracks.length 
    : 0
  
  const uniqueArtists = new Set(
    tracks.flatMap(t => t.track?.artists?.map((a: any) => a.id) || [])
  ).size
  
  const duplicates = findDuplicateTracks(tracks)
  
  return {
    totalTracks: tracks.length,
    totalAlbums: albums.length,
    totalPlaylists: playlists.length,
    recentTracks: recentTracks.length,
    yearlyTracks: yearlyTracks.length,
    uniqueArtists,
    totalDurationHours: Math.round(totalDuration / 1000 / 60 / 60),
    avgPopularity: Math.round(avgPopularity),
    duplicatesCount: duplicates.length,
    oldestTrack: tracks.length > 0 
      ? tracks.reduce((oldest, current) => 
          new Date(current.added_at) < new Date(oldest.added_at) ? current : oldest
        )
      : null,
    newestTrack: tracks.length > 0
      ? tracks.reduce((newest, current) =>
          new Date(current.added_at) > new Date(newest.added_at) ? current : newest
        )
      : null
  }
}

// ==========================================================================
// UTILITY FUNCTIONS - Behalten wir für UI-Spezifische Formatierung
// ==========================================================================

export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('de-DE').format(num)
}

export function getTimeRangeLabel(timeRange: string): string {
  switch (timeRange) {
    case 'short_term': return 'Letzte 4 Wochen'
    case 'medium_term': return 'Letzte 6 Monate'
    case 'long_term': return 'Letztes Jahr'
    default: return 'Unbekannt'
  }
}

// ==========================================================================
// EVENT HANDLING - Token Refresh
// ==========================================================================

if (typeof window !== 'undefined') {
  window.addEventListener('spotify-token-refresh', () => {
    refreshSpotifyApi()
  })
}

// ==========================================================================
// EXPORTS - Direkte SDK-Nutzung statt Wrapper
// ==========================================================================

// Re-export SDK types for easy importing
export type { 
  Track,
  Artist, 
  Album,
  Device,
  UserProfile,
  Playlist
} from '@spotify/web-api-ts-sdk'

// Legacy-Support für bestehenden Code während der Migration
export { SpotifyApi } from '@spotify/web-api-ts-sdk' 
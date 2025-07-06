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
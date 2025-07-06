import { SpotifyApi, AccessToken } from '@spotify/web-api-ts-sdk'
import { getSession } from 'next-auth/react'
import type { Session } from 'next-auth'

// Erweiterte Session Type für Spotify Token
interface SpotifySession extends Session {
  accessToken?: string
  refreshToken?: string
  tokenExpires?: number
}

// Custom Error Handler für bessere Fehlermeldungen
class SpotifyErrorHandler {
  public async handleErrors(error: any): Promise<boolean> {
    console.error('Spotify API Error:', error)
    
    if (error.status === 401) {
      // Token ist abgelaufen, löse Refresh-Event aus
      window.dispatchEvent(new CustomEvent('spotify-token-refresh'))
      return true // SDK soll error nicht weiter propagieren
    }
    
    if (error.status === 403) {
      const message = error.message || ''
      if (message.includes('Premium')) {
        throw new Error('Spotify Premium ist für diese Funktion erforderlich')
      } else if (message.includes('scope')) {
        throw new Error('Fehlende Berechtigung für diese Aktion')
      } else {
        throw new Error('Zugriff verweigert - möglicherweise sind zusätzliche Berechtigungen erforderlich')
      }
    }
    
    if (error.status === 404) {
      if (error.url?.includes('/me/player')) {
        throw new Error('Kein aktives Spotify-Gerät gefunden. Öffnen Sie Spotify auf einem Gerät und versuchen Sie es erneut.')
      }
      throw new Error('Ressource nicht gefunden')
    }
    
    if (error.status === 429) {
      throw new Error('Zu viele Anfragen - bitte warten Sie einen Moment und versuchen Sie es erneut')
    }
    
    return false // Lass das SDK den Fehler normal behandeln
  }
}

// Custom Caching Strategy mit LocalStorage
class SpotifyLocalStorageCache {
  private readonly CACHE_PREFIX = 'spotify_cache_'
  private readonly CACHE_DURATION = 30 * 1000 // 30 Sekunden

  public async getOrCreate<T>(cacheKey: string, createFunction: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(cacheKey)
    if (cached) {
      return cached
    }
    
    const fresh = await createFunction()
    this.setCacheItem(cacheKey, fresh)
    return fresh
  }

  public get<T>(cacheKey: string): T | null {
    try {
      const item = localStorage.getItem(this.CACHE_PREFIX + cacheKey)
      if (!item) return null
      
      const parsed = JSON.parse(item)
      const now = Date.now()
      
      if (now - parsed.timestamp > this.CACHE_DURATION) {
        this.remove(cacheKey)
        return null
      }
      
      return parsed.data
    } catch {
      this.remove(cacheKey)
      return null
    }
  }

  public setCacheItem<T>(cacheKey: string, item: T): void {
    try {
      const cacheItem = {
        data: item,
        timestamp: Date.now()
      }
      localStorage.setItem(this.CACHE_PREFIX + cacheKey, JSON.stringify(cacheItem))
    } catch (error) {
      console.warn('Cache storage failed:', error)
    }
  }

  public remove(cacheKey: string): void {
    localStorage.removeItem(this.CACHE_PREFIX + cacheKey)
  }

  public clearAll(): void {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  }
}

// Spotify API Wrapper Class
export class SpotifyApiWrapper {
  private sdk: SpotifyApi | null = null
  private cache: SpotifyLocalStorageCache
  private requestCount: number = 0

  constructor() {
    this.cache = new SpotifyLocalStorageCache()
  }

  // SDK mit aktuellem Access Token initialisieren
  private async initializeSdk(): Promise<SpotifyApi> {
    const session = await getSession() as SpotifySession
    
    if (!session?.accessToken) {
      throw new Error('Keine Spotify-Authentifizierung gefunden')
    }

    // Access Token Object mit korrekten Typen
    const accessToken: AccessToken = {
      access_token: session.accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: session.refreshToken || ''
    }

    // SDK mit Access Token - keine Custom Config
    this.sdk = SpotifyApi.withAccessToken(
      process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
      accessToken
    )

    return this.sdk
  }

  // SDK-Instanz abrufen oder erstellen
  private async getSdk(): Promise<SpotifyApi> {
    if (!this.sdk) {
      this.sdk = await this.initializeSdk()
    }
    return this.sdk
  }

  // Token erneuern
  public async refreshSdk(): Promise<void> {
    this.cache.clearAll() // Cache leeren bei Token-Refresh
    this.sdk = null // SDK neu initialisieren
  }

  // Rate Limiting
  private async rateLimit(): Promise<void> {
    if (this.requestCount > 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    this.requestCount++
  }

  // ==========================================================================
  // PUBLIC API METHODS - Mit korrekten SDK-Typen
  // ==========================================================================

  // User Profile
  async getCurrentUser() {
    await this.rateLimit()
    const sdk = await this.getSdk()
    return await sdk.currentUser.profile()
  }

  // Premium Status Check
  async checkPremiumStatus(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser()
      return user.product === 'premium'
    } catch (error) {
      console.error('Fehler beim Prüfen des Premium-Status:', error)
      return false
    }
  }

  // Top Items - Mit SDK-konformen Typen
  async getTopTracks(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit: 20 | 50 = 20) {
    await this.rateLimit()
    const sdk = await this.getSdk()
    return await sdk.currentUser.topItems('tracks', timeRange, limit)
  }

  async getTopArtists(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit: 20 | 50 = 20) {
    await this.rateLimit()
    const sdk = await this.getSdk()
    return await sdk.currentUser.topItems('artists', timeRange, limit)
  }

  // Recently Played - Mit korrektem Typ
  async getRecentlyPlayed(limit: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 = 50) {
    await this.rateLimit()
    const sdk = await this.getSdk()
    return await sdk.player.getRecentlyPlayedTracks(limit)
  }

  // Saved Content - Mit SDK-konformen Limits
  async getSavedTracks(limit: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 = 20, offset: number = 0) {
    await this.rateLimit()
    const sdk = await this.getSdk()
    return await sdk.currentUser.tracks.savedTracks(limit, offset)
  }

  async getSavedAlbums(limit: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 = 20, offset: number = 0) {
    await this.rateLimit()
    const sdk = await this.getSdk()
    return await sdk.currentUser.albums.savedAlbums(limit, offset)
  }

  async getSavedShows(limit: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 = 20, offset: number = 0) {
    await this.rateLimit()
    const sdk = await this.getSdk()
    return await sdk.currentUser.shows.savedShows(limit, offset)
  }

  // Following
  async getFollowedArtists(limit: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 = 20) {
    await this.rateLimit()
    const sdk = await this.getSdk()
    return await sdk.currentUser.followedArtists(limit)
  }

  // Playlists
  async getCurrentUserPlaylists(limit: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 = 20, offset: number = 0) {
    await this.rateLimit()
    const sdk = await this.getSdk()
    return await sdk.currentUser.playlists.playlists(limit, offset)
  }

  async getPlaylist(playlistId: string) {
    await this.rateLimit()
    const sdk = await this.getSdk()
    return await sdk.playlists.getPlaylist(playlistId)
  }

  async getPlaylistTracks(playlistId: string, limit: number = 20, offset: number = 0) {
    await this.rateLimit()
    const sdk = await this.getSdk()
    // Type assertion für strikt typisiertes SDK
    return await sdk.playlists.getPlaylistItems(playlistId, undefined, undefined, limit as any, offset)
  }

  // Search
  async search(query: string, types: ('track' | 'artist' | 'album' | 'playlist')[] = ['track'], limit: number = 20) {
    await this.rateLimit()
    const sdk = await this.getSdk()
    // Type assertion für market und limit Parameter
    return await sdk.search(query, types, 'DE' as any, limit as any)
  }

  // Player Methods
  async getAvailableDevices() {
    await this.rateLimit()
    const sdk = await this.getSdk()
    return await sdk.player.getAvailableDevices()
  }

  async getCurrentPlaybackState() {
    await this.rateLimit()
    const sdk = await this.getSdk()
    return await sdk.player.getPlaybackState()
  }

  async getCurrentlyPlayingTrack() {
    await this.rateLimit()
    const sdk = await this.getSdk()
    return await sdk.player.getCurrentlyPlayingTrack()
  }

  async transferPlaybackToDevice(deviceId: string, play: boolean = false) {
    await this.rateLimit()
    const sdk = await this.getSdk()
    return await sdk.player.transferPlayback([deviceId], play)
  }

  // Player Control - Mit korrekten required parameters
  async playTrack(uri: string, deviceId: string) {
    await this.rateLimit()
    const sdk = await this.getSdk()
    return await sdk.player.startResumePlayback(deviceId, undefined, [uri])
  }

  async pausePlayback(deviceId: string) {
    await this.rateLimit()
    const sdk = await this.getSdk()
    return await sdk.player.pausePlayback(deviceId)
  }

  async resumePlayback(deviceId: string) {
    await this.rateLimit()
    const sdk = await this.getSdk()
    return await sdk.player.startResumePlayback(deviceId)
  }

  // Content Details
  async getTrackDetails(trackId: string) {
    await this.rateLimit()
    const sdk = await this.getSdk()
    return await sdk.tracks.get(trackId)
  }

  async getArtistDetails(artistId: string) {
    await this.rateLimit()
    const sdk = await this.getSdk()
    return await sdk.artists.get(artistId)
  }

  async getAlbumDetails(albumId: string) {
    await this.rateLimit()
    const sdk = await this.getSdk()
    return await sdk.albums.get(albumId)
  }

  // Browse - Mit SDK-konformen Limits
  async getNewReleases(limit: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 = 20, offset: number = 0) {
    await this.rateLimit()
    const sdk = await this.getSdk()
    return await sdk.browse.getNewReleases('DE', limit, offset)
  }

  async getCategories(limit: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 = 50, offset: number = 0) {
    await this.rateLimit()
    const sdk = await this.getSdk()
    return await sdk.browse.getCategories('DE', limit, offset)
  }

  // Utility Methods
  async isCurrentlyPlaying(trackId: string): Promise<boolean> {
    try {
      const currentTrack = await this.getCurrentlyPlayingTrack()
      return currentTrack?.item?.id === trackId && currentTrack?.is_playing
    } catch (error) {
      console.error('Fehler beim Prüfen des aktuellen Tracks:', error)
      return false
    }
  }

  async validateToken(): Promise<boolean> {
    try {
      await this.getCurrentUser()
      return true
    } catch (error) {
      console.error('Token-Validierung fehlgeschlagen:', error)
      return false
    }
  }

  // Convenience Methods mit größeren Limits (mehrere Calls)
  async getTopTracksExtended(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', targetLimit: number = 50) {
    const results = []
    let offset = 0
    const batchSize = 20 // SDK Maximum

    while (results.length < targetLimit && offset < 100) { // Spotify API Maximum ist meist 100
      const batch = await this.getTopTracks(timeRange, batchSize)
      results.push(...batch.items)
      
      if (batch.items.length < batchSize) break // Keine weiteren Ergebnisse
      offset += batchSize
    }

    return {
      items: results.slice(0, targetLimit),
      total: results.length,
      limit: targetLimit,
      offset: 0
    }
  }

  async getTopArtistsExtended(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', targetLimit: number = 50) {
    const results = []
    let offset = 0
    const batchSize = 20

    while (results.length < targetLimit && offset < 100) {
      const batch = await this.getTopArtists(timeRange, batchSize)
      results.push(...batch.items)
      
      if (batch.items.length < batchSize) break
      offset += batchSize
    }

    return {
      items: results.slice(0, targetLimit),
      total: results.length,
      limit: targetLimit,
      offset: 0
    }
  }
}

// Singleton Pattern
let spotifyApiInstance: SpotifyApiWrapper | null = null

export async function getSpotifyApi(): Promise<SpotifyApiWrapper | null> {
  try {
    if (!spotifyApiInstance) {
      spotifyApiInstance = new SpotifyApiWrapper()
    }
    return spotifyApiInstance
  } catch (error) {
    console.error('Fehler beim Erstellen der Spotify API Instanz:', error)
    return null
  }
}

// Token Refresh Event Handler
if (typeof window !== 'undefined') {
  window.addEventListener('spotify-token-refresh', async () => {
    if (spotifyApiInstance) {
      await spotifyApiInstance.refreshSdk()
    }
  })
}

// ==========================================================================
// UTILITY FUNCTIONS (Behalten aus der alten Implementation)
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

export function getAudioFeatureLabel(feature: string): string {
  switch (feature) {
    case 'acousticness': return 'Akustik'
    case 'danceability': return 'Tanzbarkeit'
    case 'energy': return 'Energie'
    case 'instrumentalness': return 'Instrumental'
    case 'liveness': return 'Live-Charakter'
    case 'speechiness': return 'Sprach-Anteil'
    case 'valence': return 'Positivität'
    default: return feature
  }
}

// Legacy Support - Export der Klasse für bestehenden Code
export { SpotifyApiWrapper as SpotifyApi }
export default SpotifyApiWrapper 
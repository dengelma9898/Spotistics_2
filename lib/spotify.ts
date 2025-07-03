import { getSession } from 'next-auth/react'
import { 
  SpotifyUser, 
  SpotifyTopItem, 
  SpotifyTrack, 
  SpotifyArtist, 
  RecentlyPlayedResponse,
  SpotifyPlaylist
} from '@/types/spotify'

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

export class SpotifyApi {
  private accessToken: string
  private requestCount: number = 0
  private lastRequestTime: number = 0
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 30 * 1000 // 30 Sekunden Cache

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Cache check für GET requests
    const cacheKey = `${endpoint}_${JSON.stringify(options)}`
    const isGetRequest = !options.method || options.method === 'GET'
    
    if (isGetRequest) {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log(`Cache hit für: ${endpoint}`)
        return cached.data
      }
    }

    // Rate limiting: Warte mindestens 100ms zwischen Requests
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < 100) {
      await new Promise(resolve => setTimeout(resolve, 100 - timeSinceLastRequest))
    }
    this.lastRequestTime = Date.now()
    this.requestCount++

    try {
      const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      // Token-Erneuerung bei 401
      if (response.status === 401) {
        console.log('Token ist abgelaufen, löse Refresh-Event aus')
        window.dispatchEvent(new CustomEvent('spotify-token-refresh'))
        throw new Error('Token ist abgelaufen')
      }

      // Detaillierte Fehlerbehandlung
      if (!response.ok) {
        let errorMessage = `Spotify API error: ${response.status}`
        
        try {
          const errorBody = await response.text()
          const errorData = errorBody ? JSON.parse(errorBody) : null
          
          if (response.status === 403) {
            if (errorData?.error?.message?.includes('Premium')) {
              throw new Error('Spotify Premium ist für diese Funktion erforderlich')
            } else if (errorData?.error?.message?.includes('scope')) {
              throw new Error('Fehlende Berechtigung für diese Aktion')
            } else {
              throw new Error('Zugriff verweigert - möglicherweise sind zusätzliche Berechtigungen erforderlich')
            }
          } else if (response.status === 404) {
            if (endpoint.includes('/me/player')) {
              throw new Error('Kein aktives Spotify-Gerät gefunden. Öffnen Sie Spotify auf einem Gerät und versuchen Sie es erneut.')
            }
            throw new Error('Ressource nicht gefunden')
          } else if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '1')
            console.warn(`Rate limited, waiting ${retryAfter} seconds before retry...`)
            
            // Exponential backoff mit Maximum
            const waitTime = Math.min(retryAfter * 1000, 5000) // Max 5 Sekunden
            await new Promise(resolve => setTimeout(resolve, waitTime))
            
            // Cache leeren bei Rate Limiting
            this.cache.clear()
            
            // Retry the request direkt ohne Rate Limiting
            console.log('Retry request without rate limiting...')
            
            const response2 = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
              headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                ...options.headers,
              },
              ...options,
            })
            
            if (response2.ok) {
              return await response2.json()
            } else {
              throw new Error(`Retry failed: ${response2.status}`)
            }
          }
          
          errorMessage = errorData?.error?.message || errorMessage
        } catch (parseError) {
          // Fallback falls JSON parsing fehlschlägt
        }
        
        throw new Error(errorMessage)
      }

      // Leere Antworten (z.B. bei PUT/DELETE requests)
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {} as T
      }

      // Prüfe ob Response überhaupt JSON Content hat
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        // Für non-JSON Antworten (z.B. leere Player-Responses)
        const text = await response.text()
        if (!text || text.trim() === '') {
          return {} as T
        }
        // Falls doch Text vorhanden ist, logge ihn für Debugging
        console.warn('Non-JSON Response:', text)
        return {} as T
      }

      const data = await response.json()
      
      // Cache für GET requests speichern
      if (isGetRequest) {
        this.cache.set(cacheKey, { data, timestamp: Date.now() })
      }
      
      return data
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Netzwerkfehler - prüfen Sie Ihre Internetverbindung')
      }
      throw error
    }
  }

  // Token-Validierung
  async validateToken(): Promise<boolean> {
    try {
      await this.getCurrentUser()
      return true
    } catch (error) {
      console.error('Token-Validierung fehlgeschlagen:', error)
      return false
    }
  }

  // Premium-Status prüfen
  async checkPremiumStatus(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser()
      return user.product === 'premium'
    } catch (error) {
      console.error('Fehler beim Prüfen des Premium-Status:', error)
      return false
    }
  }

  // Benutzer-Profil
  async getCurrentUser() {
    return this.request<SpotifyUser>('/me')
  }

  // Top Items
  async getTopTracks(timeRange: string = 'medium_term', limit: number = 20) {
    return this.request<SpotifyTopItem>(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`)
  }

  async getTopArtists(timeRange: string = 'medium_term', limit: number = 20) {
    return this.request<SpotifyTopItem>(`/me/top/artists?time_range=${timeRange}&limit=${limit}`)
  }

  // Kürzlich gespielt
  async getRecentlyPlayed(limit: number = 50) {
    return this.request<RecentlyPlayedResponse>(`/me/player/recently-played?limit=${limit}`)
  }

  // Gefolgte Künstler
  async getFollowedArtists() {
    return this.request<{ artists: { items: SpotifyArtist[] } }>('/me/following?type=artist&limit=50')
  }

  // Suche
  async search(query: string, type: string = 'track', limit: number = 20) {
    const encodedQuery = encodeURIComponent(query)
    return this.request(`/search?q=${encodedQuery}&type=${type}&limit=${limit}`)
  }

  // Geräte-Verwaltung (Web API)
  async getAvailableDevices(): Promise<any[]> {
    try {
      const response = await this.request<{ devices: any[] }>('/me/player/devices')
      return response.devices
    } catch (error) {
      console.error('Fehler beim Abrufen der Geräte:', error)
      return []
    }
  }

  async transferPlaybackToDevice(deviceId: string): Promise<void> {
    try {
      await this.request('/me/player', {
        method: 'PUT',
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false
        })
      })
      console.log('Playback transferred to device:', deviceId)
    } catch (error) {
      console.error('Fehler beim Übertragen der Wiedergabe:', error)
      throw error
    }
  }

  // Playback Control (nur Web API)
  async playTrack(uri: string, deviceId?: string): Promise<void> {
    try {
      console.log('Starte Wiedergabe für URI:', uri, deviceId ? `auf Gerät: ${deviceId}` : '')
      
      // Baue Endpoint mit device_id Parameter falls vorhanden
      const endpoint = deviceId ? `/me/player/play?device_id=${deviceId}` : '/me/player/play'
      
      await this.request(endpoint, {
        method: 'PUT',
        body: JSON.stringify({
          uris: [uri]
        })
      })
      
      console.log('Wiedergabe erfolgreich gestartet')
    } catch (error: any) {
      console.error('Fehler beim Abspielen des Tracks:', error)
      
      // Ignoriere JSON-Parsing-Fehler bei erfolgreichen Play-Requests
      if (error.message?.includes('Unexpected token') || error.message?.includes('not valid JSON')) {
        console.log('Track-Wiedergabe erfolgreich (JSON-Parsing-Fehler ignoriert)')
        return
      }
      
      // Spezifische Fehlerbehandlung für Player-Endpunkt
      if (error.message.includes('404')) {
        throw new Error('Kein aktives Spotify-Gerät gefunden. Öffnen Sie Spotify auf einem Gerät und versuchen Sie es erneut.')
      } else if (error.message.includes('403')) {
        throw new Error('Spotify Premium ist für die Wiedergabe erforderlich.')
      } else if (error.message.includes('Premium')) {
        throw new Error('Diese Funktion erfordert Spotify Premium.')
      }
      
      throw error
    }
  }

  async pausePlayback(deviceId?: string): Promise<void> {
    try {
      const endpoint = deviceId ? `/me/player/pause?device_id=${deviceId}` : '/me/player/pause'
      await this.request(endpoint, {
        method: 'PUT'
      })
      console.log('Wiedergabe pausiert', deviceId ? `auf Gerät: ${deviceId}` : '')
    } catch (error: any) {
      console.error('Fehler beim Pausieren:', error)
      // Ignoriere JSON-Parsing-Fehler bei erfolgreichen Pause-Requests
      if (error.message?.includes('Unexpected token') || error.message?.includes('not valid JSON')) {
        console.log('Pause erfolgreich (JSON-Parsing-Fehler ignoriert)')
        return
      }
      throw error
    }
  }

  async resumePlayback(deviceId?: string): Promise<void> {
    try {
      const endpoint = deviceId ? `/me/player/play?device_id=${deviceId}` : '/me/player/play'
      await this.request(endpoint, {
        method: 'PUT'
      })
      console.log('Wiedergabe fortgesetzt', deviceId ? `auf Gerät: ${deviceId}` : '')
    } catch (error: any) {
      console.error('Fehler beim Fortsetzen:', error)
      // Ignoriere JSON-Parsing-Fehler bei erfolgreichen Play-Requests
      if (error.message?.includes('Unexpected token') || error.message?.includes('not valid JSON')) {
        console.log('Resume erfolgreich (JSON-Parsing-Fehler ignoriert)')
        return
      }
      throw error
    }
  }

  // Player-Status abfragen
  async getCurrentPlaybackState(): Promise<any> {
    try {
      return await this.request<any>('/me/player')
    } catch (error) {
      console.error('Fehler beim Abrufen des Playback-Status:', error)
      return null
    }
  }

  // Check if currently playing
  async isCurrentlyPlaying(trackId: string): Promise<boolean> {
    try {
      const state = await this.getCurrentPlaybackState()
      return state?.item?.id === trackId && state?.is_playing === true
    } catch (error) {
      return false
    }
  }

  // Detaillierte Track-Informationen
  async getTrackDetails(trackId: string) {
    try {
      return await this.request(`/tracks/${trackId}`)
    } catch (error: any) {
      console.error('Track Details konnten nicht geladen werden:', error.message)
      throw error
    }
  }

  // Genre Seeds API deprecated - entfernt
}

export async function getSpotifyApi(): Promise<SpotifyApi | null> {
  const session = await getSession()
  
  if (!session?.accessToken) {
    console.warn('Keine Access Token in der Session gefunden')
    return null
  }

  const api = new SpotifyApi(session.accessToken)
  
  // Validiere Token vor Rückgabe
  const isValid = await api.validateToken()
  if (!isValid) {
    console.warn('Access Token ist ungültig')
    return null
  }

  return api
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function getTimeRangeLabel(timeRange: string): string {
  switch (timeRange) {
    case 'short_term':
      return 'Letzte 4 Wochen'
    case 'medium_term':
      return 'Letzte 6 Monate'
    case 'long_term':
      return 'Gesamte Zeit'
    default:
      return 'Letzte 6 Monate'
  }
}

export function getAudioFeatureLabel(feature: string): string {
  const labels: Record<string, string> = {
    danceability: 'Tanzbarkeit',
    energy: 'Energie',
    speechiness: 'Sprachanteil',
    acousticness: 'Akustik',
    instrumentalness: 'Instrumentalität',
    liveness: 'Live-Charakter',
    valence: 'Positivität',
    tempo: 'Tempo (BPM)'
  }
  return labels[feature] || feature
} 
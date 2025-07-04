import { 
  SavedTrack, 
  SavedAlbum, 
  SpotifyPlaylist, 
  LibraryStats, 
  GenreAnalysis, 
  PlaylistAnalysis,
  DuplicateAnalysis,
  RediscoverAnalysis
} from '@/types/spotify'
import { SpotifyApi } from './spotify'

export class LibraryAnalytics {
  private api: SpotifyApi

  constructor(api: SpotifyApi) {
    this.api = api
  }

  /**
   * Analysiert die gesamte Musikbibliothek
   */
  async analyzeLibrary(): Promise<LibraryStats> {
    const [savedTracks, savedAlbums, savedShows, savedEpisodes, playlists] = await Promise.all([
      this.api.getAllSavedTracks(),
      this.api.getAllSavedAlbums(),
      this.api.getSavedShows(),
      this.api.getSavedEpisodes(),
      this.api.getAllMyPlaylists()
    ])

    // Playlist-Tracks zählen
    let totalPlaylistTracks = 0
    for (const playlist of playlists) {
      totalPlaylistTracks += playlist.tracks.total
    }

    // Ältester und neuester Track
    const sortedTracks = savedTracks.sort((a, b) => 
      new Date(a.added_at).getTime() - new Date(b.added_at).getTime()
    )

    // Wachstum über Zeit analysieren
    const libraryGrowthOverTime = this.analyzeLibraryGrowth(savedTracks, savedAlbums)

    return {
      totalTracks: savedTracks.length,
      totalAlbums: savedAlbums.length,
      totalShows: savedShows.items?.length || 0,
      totalEpisodes: savedEpisodes.items?.length || 0,
      totalPlaylists: playlists.length,
      totalPlaylistTracks,
      oldestTrack: sortedTracks[0] || null,
      newestTrack: sortedTracks[sortedTracks.length - 1] || null,
      libraryGrowthOverTime
    }
  }

  /**
   * Analysiert Genre-Verteilung in der Bibliothek
   */
  async analyzeGenres(): Promise<GenreAnalysis> {
    const [savedTracks, savedAlbums] = await Promise.all([
      this.api.getAllSavedTracks(),
      this.api.getAllSavedAlbums()
    ])

    const genreCount = new Map<string, number>()
    let totalItems = 0

    // Genres aus Albums extrahieren
    for (const item of savedAlbums) {
      const album = item.album
      if (album.artists && album.artists.length > 0) {
        for (const artist of album.artists) {
          if (artist.genres) {
            for (const genre of artist.genres) {
              genreCount.set(genre, (genreCount.get(genre) || 0) + 1)
              totalItems++
            }
          }
        }
      }
    }

    // Genres aus Track-Artists extrahieren
    for (const item of savedTracks) {
      const track = item.track
      if (track.artists && track.artists.length > 0) {
        for (const artist of track.artists) {
          if (artist.genres) {
            for (const genre of artist.genres) {
              genreCount.set(genre, (genreCount.get(genre) || 0) + 1)
              totalItems++
            }
          }
        }
      }
    }

    // Genres sortieren und formatieren
    const genres = Array.from(genreCount.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalItems > 0 ? (count / totalItems) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)

    const topGenres = genres.slice(0, 10).map(g => g.name)
    const diversityScore = this.calculateGenreDiversity(genres)

    return {
      genres,
      topGenres,
      diversityScore
    }
  }

  /**
   * Analysiert eine spezifische Playlist
   */
  async analyzePlaylist(playlistId: string): Promise<PlaylistAnalysis> {
    const [playlistData, tracksData] = await Promise.all([
      this.api.request<SpotifyPlaylist>(`/playlists/${playlistId}`),
      this.api.getPlaylistTracks(playlistId, 100, 0)
    ])

    const tracks = tracksData.items.map(item => item.track).filter(track => track)
    
    // Basis-Statistiken
    const totalDuration = tracks.reduce((sum, track) => sum + track.duration_ms, 0)
    const averagePopularity = tracks.reduce((sum, track) => sum + track.popularity, 0) / tracks.length
    
    // Release-Jahre analysieren
    const releaseYears = tracks.map(track => {
      const releaseDate = track.album.release_date
      return parseInt(releaseDate.split('-')[0])
    }).filter(year => !isNaN(year))
    
    const averageReleaseYear = releaseYears.reduce((sum, year) => sum + year, 0) / releaseYears.length

    // Genre-Analyse
    const genreSet = new Set<string>()
    for (const track of tracks) {
      if (track.artists) {
        for (const artist of track.artists) {
          if (artist.genres) {
            for (const genre of artist.genres) {
              genreSet.add(genre)
            }
          }
        }
      }
    }

    const genres = Array.from(genreSet)
    const diversityScore = this.calculatePlaylistDiversity(tracks)

    return {
      id: playlistData.id,
      name: playlistData.name,
      trackCount: tracks.length,
      totalDuration,
      genres,
      averagePopularity,
      averageReleaseYear,
      diversityScore,
      createdAt: '', // Playlist-Erstellungsdatum ist nicht verfügbar
      lastModified: '' // Letzte Änderung ist nicht verfügbar
    }
  }

  /**
   * Findet Duplikate in der Bibliothek
   */
  async findDuplicates(): Promise<DuplicateAnalysis> {
    const [savedTracks, playlists] = await Promise.all([
      this.api.getAllSavedTracks(),
      this.api.getAllMyPlaylists()
    ])

    const trackMap = new Map<string, Array<{
      track: any,
      locations: Array<{ type: 'library' | 'playlist', name?: string, id?: string }>
    }>>()

    // Gespeicherte Tracks hinzufügen
    for (const item of savedTracks) {
      const track = item.track
      const key = `${track.name.toLowerCase()}-${track.artists[0]?.name.toLowerCase()}`
      
      if (!trackMap.has(key)) {
        trackMap.set(key, [])
      }
      
      trackMap.get(key)!.push({
        track,
        locations: [{ type: 'library' }]
      })
    }

    // Playlist-Tracks hinzufügen (nur erste 5 Playlists für Performance)
    for (const playlist of playlists.slice(0, 5)) {
      try {
        const playlistTracks = await this.api.getPlaylistTracks(playlist.id, 50, 0)
        
        for (const item of playlistTracks.items) {
          if (!item.track) continue
          
          const track = item.track
          const key = `${track.name.toLowerCase()}-${track.artists[0]?.name.toLowerCase()}`
          
          if (trackMap.has(key)) {
            const existing = trackMap.get(key)!
            existing[0].locations.push({
              type: 'playlist',
              name: playlist.name,
              id: playlist.id
            })
          }
        }
      } catch (error) {
        console.warn(`Fehler beim Analysieren der Playlist ${playlist.name}:`, error)
      }
    }

    // Duplikate finden
    const duplicateTracks = Array.from(trackMap.values())
      .filter(tracks => tracks.length > 1 || tracks[0].locations.length > 1)
      .map(tracks => ({
        track: tracks[0].track,
        locations: tracks[0].locations
      }))

    return {
      duplicateTracks,
      duplicateCount: duplicateTracks.length,
      totalDuplicates: duplicateTracks.reduce((sum, item) => sum + item.locations.length, 0)
    }
  }

  /**
   * Findet alte Tracks zum Wiederentdecken
   */
  async findRediscoverTracks(): Promise<RediscoverAnalysis> {
    const savedTracks = await this.api.getAllSavedTracks()
    const now = new Date()

    // Tracks älter als 1 Jahr
    const oldTracks = savedTracks
      .filter(item => {
        const addedDate = new Date(item.added_at)
        const daysSinceAdded = (now.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24)
        return daysSinceAdded > 365
      })
      .map(item => ({
        track: item.track,
        addedAt: item.added_at,
        daysSinceAdded: Math.floor((now.getTime() - new Date(item.added_at).getTime()) / (1000 * 60 * 60 * 24))
      }))
      .sort((a, b) => b.daysSinceAdded - a.daysSinceAdded)

    // "Vergessene Perlen" - alte Tracks mit hoher Popularität
    const forgottenGems = oldTracks
      .filter(item => item.track.popularity > 70)
      .map(item => ({
        track: item.track,
        reason: `Hohe Popularität (${item.track.popularity}) aber ${item.daysSinceAdded} Tage alt`,
        score: item.track.popularity + (item.daysSinceAdded / 365) * 10
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)

    return {
      oldTracks: oldTracks.slice(0, 50),
      forgottenGems
    }
  }

  /**
   * Analysiert das Wachstum der Bibliothek über Zeit
   */
  private analyzeLibraryGrowth(savedTracks: SavedTrack[], savedAlbums: SavedAlbum[]) {
    const monthlyData = new Map<string, { tracksAdded: number, albumsAdded: number }>()

    // Tracks gruppieren nach Monat
    for (const item of savedTracks) {
      const date = new Date(item.added_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { tracksAdded: 0, albumsAdded: 0 })
      }
      
      monthlyData.get(monthKey)!.tracksAdded++
    }

    // Albums gruppieren nach Monat
    for (const item of savedAlbums) {
      const date = new Date(item.added_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { tracksAdded: 0, albumsAdded: 0 })
      }
      
      monthlyData.get(monthKey)!.albumsAdded++
    }

    // Sortieren und formatieren
    return Array.from(monthlyData.entries())
      .map(([date, data]) => ({
        date,
        tracksAdded: data.tracksAdded,
        albumsAdded: data.albumsAdded
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * Berechnet Genre-Diversität Score
   */
  private calculateGenreDiversity(genres: Array<{ name: string, count: number, percentage: number }>): number {
    if (genres.length === 0) return 0
    
    // Shannon-Diversitäts-Index
    let diversity = 0
    for (const genre of genres) {
      const p = genre.percentage / 100
      if (p > 0) {
        diversity -= p * Math.log(p)
      }
    }
    
    // Normalisieren auf 0-100 Skala
    return Math.min(100, (diversity / Math.log(genres.length)) * 100)
  }

  /**
   * Berechnet Playlist-Diversität Score
   */
  private calculatePlaylistDiversity(tracks: any[]): number {
    if (tracks.length === 0) return 0

    const artistSet = new Set<string>()
    const genreSet = new Set<string>()
    const yearSet = new Set<number>()

    for (const track of tracks) {
      // Artists
      if (track.artists) {
        for (const artist of track.artists) {
          artistSet.add(artist.id)
          if (artist.genres) {
            for (const genre of artist.genres) {
              genreSet.add(genre)
            }
          }
        }
      }

      // Release Jahre
      const releaseDate = track.album.release_date
      if (releaseDate) {
        const year = parseInt(releaseDate.split('-')[0])
        if (!isNaN(year)) {
          yearSet.add(year)
        }
      }
    }

    // Diversitäts-Score basierend auf Unique Artists, Genres und Jahre
    const artistDiversity = (artistSet.size / tracks.length) * 100
    const genreDiversity = Math.min(100, (genreSet.size / tracks.length) * 200)
    const yearDiversity = Math.min(100, (yearSet.size / tracks.length) * 300)

    return (artistDiversity + genreDiversity + yearDiversity) / 3
  }
} 
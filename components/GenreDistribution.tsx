'use client'

import { SpotifyTrack, SpotifyArtist } from '@/types/spotify'
import { Palette, Music, Tag } from 'lucide-react'

interface GenreDistributionProps {
  tracks: SpotifyTrack[]
  artists?: SpotifyArtist[]
  title?: string
}

interface GenreData {
  genre: string
  count: number
  percentage: number
  tracks: SpotifyTrack[]
  artists: Set<string>
}

export default function GenreDistribution({ tracks, artists = [], title = "Genre-Verteilung" }: GenreDistributionProps) {
  // Extrahiere Genre-Informationen aus verfügbaren Daten
  const getGenreData = (): GenreData[] => {
    const genreMap = new Map<string, GenreData>()

    // Versuche Genres aus Artist-Daten zu extrahieren (falls verfügbar)
    if (artists.length > 0) {
      tracks.forEach(track => {
        track.artists.forEach(trackArtist => {
          const fullArtist = artists.find(a => a.id === trackArtist.id)
          if (fullArtist?.genres && fullArtist.genres.length > 0) {
            fullArtist.genres.forEach(genre => {
              const normalizedGenre = normalizeGenre(genre)
              if (genreMap.has(normalizedGenre)) {
                const existing = genreMap.get(normalizedGenre)!
                existing.count++
                existing.tracks.push(track)
                existing.artists.add(trackArtist.name)
                existing.percentage = (existing.count / tracks.length) * 100
              } else {
                genreMap.set(normalizedGenre, {
                  genre: normalizedGenre,
                  count: 1,
                  percentage: (1 / tracks.length) * 100,
                  tracks: [track],
                  artists: new Set([trackArtist.name])
                })
              }
            })
          }
        })
      })
    }

    // Falls keine Genres aus Artists verfügbar sind, analysiere anhand von Metadaten
    if (genreMap.size === 0) {
      return getGenreFromMetadata()
    }

    return Array.from(genreMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8) // Top 8 Genres
  }

  // Fallback: Genre-Schätzung basierend auf Metadaten
  const getGenreFromMetadata = (): GenreData[] => {
    const genreMap = new Map<string, GenreData>()

    tracks.forEach(track => {
      // Analysiere basierend auf Release-Jahr
      const year = new Date(track.album.release_date).getFullYear()
      let estimatedGenre = 'Unbekannt'

      if (year >= 2010) {
        estimatedGenre = 'Modern Pop'
      } else if (year >= 2000) {
        estimatedGenre = '2000er'
      } else if (year >= 1990) {
        estimatedGenre = '90er Hits'
      } else if (year >= 1980) {
        estimatedGenre = '80er Klassiker'
      } else {
        estimatedGenre = 'Vintage'
      }

      // Popularitäts-basierte Kategorisierung
      if (track.popularity > 80) {
        estimatedGenre = 'Mainstream Hits'
      } else if (track.popularity < 30) {
        estimatedGenre = 'Underground'
      }

      if (genreMap.has(estimatedGenre)) {
        const existing = genreMap.get(estimatedGenre)!
        existing.count++
        existing.tracks.push(track)
        existing.artists.add(track.artists[0]?.name || 'Unbekannt')
        existing.percentage = (existing.count / tracks.length) * 100
      } else {
        genreMap.set(estimatedGenre, {
          genre: estimatedGenre,
          count: 1,
          percentage: (1 / tracks.length) * 100,
          tracks: [track],
          artists: new Set([track.artists[0]?.name || 'Unbekannt'])
        })
      }
    })

    return Array.from(genreMap.values())
      .sort((a, b) => b.count - a.count)
  }

  // Normalisiere Genre-Namen
  const normalizeGenre = (genre: string): string => {
    const normalized = genre.toLowerCase()
    
    // Gruppiere ähnliche Genres
    if (normalized.includes('pop')) return 'Pop'
    if (normalized.includes('rock')) return 'Rock'
    if (normalized.includes('hip hop') || normalized.includes('rap')) return 'Hip Hop'
    if (normalized.includes('electronic') || normalized.includes('edm')) return 'Electronic'
    if (normalized.includes('indie')) return 'Indie'
    if (normalized.includes('jazz')) return 'Jazz'
    if (normalized.includes('classical')) return 'Classical'
    if (normalized.includes('country')) return 'Country'
    if (normalized.includes('folk')) return 'Folk'
    if (normalized.includes('metal')) return 'Metal'
    if (normalized.includes('r&b') || normalized.includes('soul')) return 'R&B/Soul'
    if (normalized.includes('alternative')) return 'Alternative'
    
    // Kapitalisiere ersten Buchstaben
    return genre.charAt(0).toUpperCase() + genre.slice(1)
  }

  const genreData = getGenreData()
  const hasRealGenres = artists.length > 0 && genreData.some(g => 
    !['Modern Pop', '2000er', '90er Hits', '80er Klassiker', 'Vintage', 'Mainstream Hits', 'Underground'].includes(g.genre)
  )

  const getGenreColor = (index: number): string => {
    const colors = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-yellow-500 to-orange-500',
      'from-red-500 to-pink-500',
      'from-indigo-500 to-purple-500',
      'from-teal-500 to-green-500',
      'from-orange-500 to-red-500'
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-gray-400 text-sm">
              {hasRealGenres ? 'Aus Spotify-Daten' : 'Basierend auf Metadaten'} • {genreData.length} Kategorien
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">
              {hasRealGenres ? 'Verifiziert' : 'Geschätzt'}
            </span>
          </div>
        </div>
      </div>

      {/* Genre Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {genreData.map((data, index) => (
          <div key={data.genre} className="group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 bg-gradient-to-r ${getGenreColor(index)} rounded-full`} />
                <span className="text-white font-medium">{data.genre}</span>
              </div>
              <span className="text-gray-400 text-sm">
                {data.count} ({data.percentage.toFixed(1)}%)
              </span>
            </div>
            
            <div className="mb-2">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-700 bg-gradient-to-r ${getGenreColor(index)}`}
                  style={{ width: `${data.percentage}%` }}
                />
              </div>
            </div>

            {/* Hover Details */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white/5 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Artists:</span>
                  <span className="text-gray-400">{data.artists.size} verschiedene</span>
                </div>
                
                <div className="space-y-1">
                  {Array.from(data.artists).slice(0, 3).map((artist, idx) => (
                    <div key={idx} className="text-xs text-gray-300">
                      {artist}
                    </div>
                  ))}
                  {data.artists.size > 3 && (
                    <div className="text-xs text-gray-400">
                      +{data.artists.size - 3} weitere
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="pt-4 border-t border-white/10">
        <h4 className="text-white font-medium mb-3">Genre-Analyse</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-gray-400">Hauptgenre</span>
            <p className="text-white font-semibold">
              {genreData[0]?.genre || 'Unbekannt'}
            </p>
            <p className="text-gray-400 text-xs">
              {genreData[0] ? `${genreData[0].percentage.toFixed(1)}% deiner Musik` : ''}
            </p>
          </div>
          
          <div className="space-y-1">
            <span className="text-gray-400">Vielfalt</span>
            <p className="text-white font-semibold">
              {genreData.length} Genres
            </p>
            <p className="text-gray-400 text-xs">
              {genreData.length > 5 ? 'Sehr vielfältig' : genreData.length > 2 ? 'Vielfältig' : 'Fokussiert'}
            </p>
          </div>
          
          <div className="space-y-1">
            <span className="text-gray-400">Datenquelle</span>
            <p className="text-white font-semibold">
              {hasRealGenres ? 'Spotify' : 'Metadaten'}
            </p>
            <p className="text-gray-400 text-xs">
              {hasRealGenres ? 'Offizielle Genres' : 'Schätzung'}
            </p>
          </div>
        </div>

        {/* Info Message */}
        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <p className="text-gray-300 text-sm">
            {hasRealGenres ? (
              "🎨 Deine Genre-Verteilung basiert auf offiziellen Spotify-Daten deiner Top Artists."
            ) : (
              "📊 Genre-Analyse basiert auf Release-Daten und Popularität. Für detailliertere Genres können wir deine Top Artists analysieren."
            )}
          </p>
        </div>
      </div>
    </div>
  )
} 
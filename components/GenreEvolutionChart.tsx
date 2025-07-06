'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getSpotifyApi } from '@/lib/spotify'

interface GenreData {
  genre: string
  current: number
  recent: number
  longterm: number
}

interface GenreEvolutionData {
  timeRange: string
  [key: string]: string | number
}

export default function GenreEvolutionChart() {
  const [genreData, setGenreData] = useState<GenreEvolutionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadGenreEvolution()
  }, [])

  const loadGenreEvolution = async () => {
    try {
      setLoading(true)
      setError(null)

      const sdk = await getSpotifyApi()
      if (!sdk) throw new Error('Spotify API nicht verfügbar')

      // Sammle Top-Tracks aus verschiedenen Zeiträumen
      const [shortTerm, mediumTerm, longTerm] = await Promise.all([
        sdk.currentUser.topItems('tracks', 'short_term', 50),
        sdk.currentUser.topItems('tracks', 'medium_term', 50),
        sdk.currentUser.topItems('tracks', 'long_term', 50)
      ])

      // Sammle alle Artist-IDs
      const allArtistIds = [...new Set([
        ...shortTerm.items.map(t => t.artists[0].id),
        ...mediumTerm.items.map(t => t.artists[0].id),
        ...longTerm.items.map(t => t.artists[0].id)
      ])]

      // Batch-Lade Artist-Daten für Genres
      const artistBatches = chunkArray(allArtistIds, 50)
      const allArtists = []

      for (const batch of artistBatches) {
        const artists = await sdk.artists.get(batch)
        allArtists.push(...artists.artists)
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Erstelle Artist-zu-Genre Mapping
      const artistGenreMap = new Map()
      allArtists.forEach(artist => {
        artistGenreMap.set(artist.id, artist.genres)
      })

      // Analysiere Genres pro Zeitraum
      const currentGenres = analyzeGenresFromTracks(shortTerm.items, artistGenreMap)
      const recentGenres = analyzeGenresFromTracks(mediumTerm.items, artistGenreMap)
      const longtermGenres = analyzeGenresFromTracks(longTerm.items, artistGenreMap)

      // Kombiniere alle Genres
      const allGenres = new Set([
        ...Object.keys(currentGenres),
        ...Object.keys(recentGenres),
        ...Object.keys(longtermGenres)
      ])

      // Erstelle Chart-Daten
      const chartData: GenreEvolutionData[] = [
        {
          timeRange: 'Langfristig',
          ...Object.fromEntries(Array.from(allGenres).map(genre => [
            genre, longtermGenres[genre] || 0
          ]))
        },
        {
          timeRange: 'Mittelfristig',
          ...Object.fromEntries(Array.from(allGenres).map(genre => [
            genre, recentGenres[genre] || 0
          ]))
        },
        {
          timeRange: 'Aktuell',
          ...Object.fromEntries(Array.from(allGenres).map(genre => [
            genre, currentGenres[genre] || 0
          ]))
        }
      ]

      setGenreData(chartData)
    } catch (error) {
      console.error('Fehler beim Laden der Genre-Evolution:', error)
      setError(error instanceof Error ? error.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  const analyzeGenresFromTracks = (tracks: any[], artistGenreMap: Map<string, string[]>) => {
    const genreCount: { [key: string]: number } = {}

    tracks.forEach(track => {
      const artistId = track.artists[0].id
      const genres = artistGenreMap.get(artistId) || []
      
      genres.forEach(genre => {
        // Normalisiere Genre-Namen
        const normalizedGenre = normalizeGenre(genre)
        genreCount[normalizedGenre] = (genreCount[normalizedGenre] || 0) + 1
      })
    })

    return genreCount
  }

  const normalizeGenre = (genre: string): string => {
    // Vereinfache Genre-Namen für bessere Visualisierung
    const genreMap: { [key: string]: string } = {
      'pop': 'Pop',
      'rock': 'Rock',
      'hip hop': 'Hip Hop',
      'electronic': 'Electronic',
      'indie': 'Indie',
      'alternative': 'Alternative',
      'jazz': 'Jazz',
      'classical': 'Classical',
      'country': 'Country',
      'r&b': 'R&B'
    }

    const lowerGenre = genre.toLowerCase()
    for (const [key, value] of Object.entries(genreMap)) {
      if (lowerGenre.includes(key)) {
        return value
      }
    }

    // Fallback: Kapitalisiere ersten Buchstaben
    return genre.charAt(0).toUpperCase() + genre.slice(1)
  }

  const chunkArray = <T,>(array: T[], size: number): T[][] => {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size)
    )
  }

  // Bestimme Top-Genres für Linien
  const getTopGenres = () => {
    if (genreData.length === 0) return []

    const genreScores: { [key: string]: number } = {}
    
    genreData.forEach(period => {
      Object.entries(period).forEach(([key, value]) => {
        if (key !== 'timeRange' && typeof value === 'number') {
          genreScores[key] = (genreScores[key] || 0) + value
        }
      })
    })

    return Object.entries(genreScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([genre]) => genre)
  }

  const topGenres = getTopGenres()
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0']

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>🎨 Genre Evolution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>🎨 Genre Evolution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-center py-8">
            Fehler: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>🎨 Genre Evolution</CardTitle>
        <p className="text-sm text-gray-600">
          Entwicklung deiner Musikrichtungen über verschiedene Zeiträume
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={genreData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timeRange" />
              <YAxis />
              <Tooltip />
              <Legend />
              {topGenres.map((genre, index) => (
                <Line
                  key={genre}
                  type="monotone"
                  dataKey={genre}
                  stroke={colors[index]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>Zeigt die Top {topGenres.length} Genres und ihre Entwicklung über Zeit</p>
        </div>
      </CardContent>
    </Card>
  )
} 
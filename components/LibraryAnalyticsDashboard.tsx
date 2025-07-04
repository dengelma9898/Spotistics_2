'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Music, 
  Album, 
  Disc, 
  Mic, 
  Calendar,
  Copy,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { 
  LibraryStats, 
  GenreAnalysis, 
  PlaylistAnalysis,
  DuplicateAnalysis,
  RediscoverAnalysis
} from '@/types/spotify'
import { getSpotifyApi } from '@/lib/spotify'
import { LibraryAnalytics } from '@/lib/library-analytics'
import { formatDuration, formatNumber } from '@/lib/spotify'

interface LibraryAnalyticsDashboardProps {
  className?: string
}

export default function LibraryAnalyticsDashboard({ className }: LibraryAnalyticsDashboardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [libraryStats, setLibraryStats] = useState<LibraryStats | null>(null)
  const [genreAnalysis, setGenreAnalysis] = useState<GenreAnalysis | null>(null)
  const [duplicateAnalysis, setDuplicateAnalysis] = useState<DuplicateAnalysis | null>(null)
  const [rediscoverAnalysis, setRediscoverAnalysis] = useState<RediscoverAnalysis | null>(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistAnalysis | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadLibraryAnalytics()
  }, [])

  const loadLibraryAnalytics = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const api = await getSpotifyApi()
      if (!api) {
        throw new Error('Spotify API nicht verfügbar')
      }

      const analytics = new LibraryAnalytics(api)

      // Parallel laden für bessere Performance
      const [library, genres, duplicates, rediscover] = await Promise.all([
        analytics.analyzeLibrary(),
        analytics.analyzeGenres(),
        analytics.findDuplicates(),
        analytics.findRediscoverTracks()
      ])

      setLibraryStats(library)
      setGenreAnalysis(genres)
      setDuplicateAnalysis(duplicates)
      setRediscoverAnalysis(rediscover)
    } catch (err: any) {
      console.error('Fehler beim Laden der Bibliotheksanalyse:', err)
      setError(err.message || 'Fehler beim Laden der Bibliotheksanalyse')
    } finally {
      setIsLoading(false)
    }
  }

  const analyzePlaylist = async (playlistId: string) => {
    try {
      const api = await getSpotifyApi()
      if (!api) return

      const analytics = new LibraryAnalytics(api)
      const analysis = await analytics.analyzePlaylist(playlistId)
      setSelectedPlaylist(analysis)
      setActiveTab('playlists')
    } catch (err: any) {
      console.error('Fehler beim Analysieren der Playlist:', err)
    }
  }

  if (isLoading) {
    return (
      <div className={`space-y-8 ${className}`}>
        <div className="text-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-gray-300 text-lg">Analysiere deine Musikbibliothek... 📊</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-8 ${className}`}>
        <div className="p-6 bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-2xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-300 mb-1">Fehler beim Laden</h3>
              <p className="text-red-200">{error}</p>
            </div>
            <Button 
              onClick={loadLibraryAnalytics} 
              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Erneut versuchen
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-8 ${className}`}>
      <div className="flex items-center justify-between">
        <Button 
          onClick={loadLibraryAnalytics} 
          className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
          variant="outline" 
          size="sm"
        >
          Aktualisieren
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-transparent p-2 gap-2">
          <TabsTrigger 
            value="overview" 
            className="rounded-2xl px-6 py-4 text-sm font-medium transition-all duration-200 data-[state=active]:bg-white/15 data-[state=active]:backdrop-blur-xl data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-white/20 text-gray-400 hover:text-white hover:bg-white/5"
          >
            📊 Übersicht
          </TabsTrigger>
          <TabsTrigger 
            value="duplicates"
            className="rounded-2xl px-6 py-4 text-sm font-medium transition-all duration-200 data-[state=active]:bg-white/15 data-[state=active]:backdrop-blur-xl data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-white/20 text-gray-400 hover:text-white hover:bg-white/5"
          >
            🔍 Duplikate
          </TabsTrigger>
          <TabsTrigger 
            value="rediscover"
            className="rounded-2xl px-6 py-4 text-sm font-medium transition-all duration-200 data-[state=active]:bg-white/15 data-[state=active]:backdrop-blur-xl data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-white/20 text-gray-400 hover:text-white hover:bg-white/5"
          >
            💎 Wiederentdecken
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 mt-8">
          <LibraryOverview stats={libraryStats} />
        </TabsContent>

        <TabsContent value="duplicates" className="space-y-8 mt-8">
          <DuplicateAnalysisView analysis={duplicateAnalysis} />
        </TabsContent>

        <TabsContent value="rediscover" className="space-y-8 mt-8">
          <RediscoverAnalysisView analysis={rediscoverAnalysis} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Übersicht-Komponente
function LibraryOverview({ stats }: { stats: LibraryStats | null }) {
  if (!stats) return null

  const totalItems = stats.totalTracks + stats.totalAlbums + stats.totalShows + stats.totalEpisodes
  
  // Berechne einige interessante Insights
  const tracksPercentage = ((stats.totalTracks / totalItems) * 100).toFixed(1)
  const albumsPercentage = ((stats.totalAlbums / totalItems) * 100).toFixed(1)
  const estimatedListeningHours = Math.round((stats.totalTracks * 3.5) / 60) // Durchschnittlich 3.5 Min pro Track
  
  // Freundliche Interpretationen
  const getLibraryPersonality = () => {
    const trackToAlbumRatio = stats.totalTracks / Math.max(stats.totalAlbums, 1)
    
    if (trackToAlbumRatio > 15) {
      return "Du bist ein echter Single-Track-Sammler! 🎯 Du weißt genau, was dir gefällt und holst dir nur die Perlen."
    } else if (trackToAlbumRatio > 8) {
      return "Nice Balance! 🎭 Du liebst sowohl komplette Alben als auch einzelne Hits."
    } else {
      return "Wow, ein echter Album-Liebhaber! 💿 Du schätzt die Kunst des kompletten Werks - Respekt!"
    }
  }
  
  const getCollectionSize = () => {
    if (stats.totalTracks > 5000) {
      return "Holy Moly! 🤯 Deine Sammlung ist GIGANTISCH! Du könntest monatelang hören ohne Wiederholung."
    } else if (stats.totalTracks > 2000) {
      return "Beeindruckend! 🔥 Du hast eine richtig solide Musiksammlung aufgebaut."
    } else if (stats.totalTracks > 500) {
      return "Schöne Sammlung! 🎵 Du bist definitiv ein Musikliebhaber mit Geschmack."
    } else {
      return "Ein feiner Start! 🌱 Deine Sammlung wächst und jeder Song zählt."
    }
  }

  return (
    <div className="space-y-8">
      {/* Bibliotheks-Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gespeicherte Tracks</CardTitle>
          <Music className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.totalTracks)}</div>
          <p className="text-xs text-muted-foreground">
            {((stats.totalTracks / totalItems) * 100).toFixed(1)}% deiner gesamten Sammlung
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ≈ {Math.round((stats.totalTracks * 3.5) / 60)} Stunden Musik
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gespeicherte Alben</CardTitle>
          <Album className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.totalAlbums)}</div>
          <p className="text-xs text-muted-foreground">
            {((stats.totalAlbums / totalItems) * 100).toFixed(1)}% deiner gesamten Sammlung
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Komplette Alben vs. einzelne Songs
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Playlists</CardTitle>
          <Disc className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.totalPlaylists)}</div>
          <p className="text-xs text-muted-foreground">
            {formatNumber(stats.totalPlaylistTracks)} Tracks insgesamt
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ⌀ {Math.round(stats.totalPlaylistTracks / Math.max(stats.totalPlaylists, 1))} Tracks pro Playlist
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Podcasts & Shows</CardTitle>
          <Mic className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.totalShows)}</div>
          <p className="text-xs text-muted-foreground">
            {formatNumber(stats.totalEpisodes)} Episoden gespeichert
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {((stats.totalShows / totalItems) * 100).toFixed(1)}% deiner gesamten Sammlung
          </p>
        </CardContent>
      </Card>

      {/* Zeitspanne deiner Sammlung */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Zeitspanne deiner Sammlung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats.oldestTrack && (
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Ältester Track</p>
                    <p className="text-xs text-gray-400">Beginn deiner Sammlung</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-white mb-1">{stats.oldestTrack.track.name}</p>
                <p className="text-sm text-gray-300 mb-2">{stats.oldestTrack.track.artists.map(a => a.name).join(', ')}</p>
                <p className="text-xs text-gray-400">
                  Hinzugefügt am {new Date(stats.oldestTrack.added_at).toLocaleDateString('de-DE', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            )}
            {stats.newestTrack && (
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Neuester Track</p>
                    <p className="text-xs text-gray-400">Letzte Entdeckung</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-white mb-1">{stats.newestTrack.track.name}</p>
                <p className="text-sm text-gray-300 mb-2">{stats.newestTrack.track.artists.map(a => a.name).join(', ')}</p>
                <p className="text-xs text-gray-400">
                  Hinzugefügt am {new Date(stats.newestTrack.added_at).toLocaleDateString('de-DE', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            )}
          </div>
          {stats.oldestTrack && stats.newestTrack && (
            <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
              <p className="text-sm text-purple-200">
                <strong>Sammlungszeitraum:</strong> {Math.round((new Date(stats.newestTrack.added_at).getTime() - new Date(stats.oldestTrack.added_at).getTime()) / (1000 * 60 * 60 * 24))} Tage
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </div>
  )
}

// Duplikate-Analyse Komponente
function DuplicateAnalysisView({ analysis }: { analysis: DuplicateAnalysis | null }) {
  if (!analysis) return null

  const getDuplicatePersonality = () => {
    const count = analysis.duplicateCount
    if (count === 0) {
      return {
        title: "Perfekt organisiert! 🎯",
        description: "Wow! Deine Bibliothek ist sauber wie ein Whistle! Keine Duplikate gefunden - du bist ein Organisations-Genie!",
        emoji: "✨"
      }
    } else if (count < 5) {
      return {
        title: "Fast perfekt! 👌",
        description: "Nur ein paar wenige Duplikate - das passiert den Besten! Deine Bibliothek ist super organisiert.",
        emoji: "🧹"
      }
    } else if (count < 20) {
      return {
        title: "Ein bisschen Aufräumen schadet nie! 🧽",
        description: "Ein paar Duplikate haben sich eingeschlichen - Zeit für einen kleinen Frühjahrsputz in deiner Sammlung!",
        emoji: "🧹"
      }
    } else {
      return {
        title: "Zeit für eine Entrümpelung! 📦",
        description: "Looks like you're a passionate collector! Ein paar Duplikate zeigen, dass du wirklich liebst, was du hörst.",
        emoji: "🔄"
      }
    }
  }

  const personality = getDuplicatePersonality()

  return (
    <div className="space-y-8">
      {/* Duplikate-Übersicht */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplikate-Übersicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Duplizierte Songs</p>
              <p className="text-2xl font-bold">{analysis.duplicateCount}</p>
              <p className="text-xs text-muted-foreground">Verschiedene Songs, die mehrfach vorkommen</p>
            </div>
            <div>
              <p className="text-sm font-medium">Gesamte Kopien</p>
              <p className="text-2xl font-bold">{analysis.totalDuplicates}</p>
              <p className="text-xs text-muted-foreground">Alle Duplikate zusammen (inkl. Originale)</p>
            </div>
          </div>
          
          {analysis.duplicateCount > 0 && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="text-sm text-blue-200 font-medium">📝 Wie Duplikate entfernt werden:</p>
                <ol className="text-xs text-blue-300 mt-2 space-y-1 pl-4">
                  <li>1. Gehe zu deiner Spotify-Bibliothek</li>
                  <li>2. Suche nach dem Song-Namen in der Liste unten</li>
                  <li>3. Klicke auf das Herz-Symbol um ihn zu entfernen</li>
                  <li>4. Füge ihn wieder hinzu, um nur eine Kopie zu behalten</li>
                </ol>
              </div>
              
              <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <p className="text-sm text-yellow-200">
                  <strong>💡 Tipp:</strong> Die Liste zeigt nur die ersten 10 Duplikate. 
                  Insgesamt wurden {analysis.duplicateCount} verschiedene Songs mit Duplikaten gefunden.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gefundene Duplikate */}
      {analysis.duplicateTracks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gefundene Duplikate (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Diese Songs kommen mehrfach in deiner Bibliothek vor. Die Badges zeigen, wo sie gespeichert sind.
            </p>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {analysis.duplicateTracks.slice(0, 10).map((duplicate, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <img 
                      src={duplicate.track.album.images[0]?.url || '/placeholder-album.png'} 
                      alt={duplicate.track.album.name}
                      className="w-12 h-12 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{duplicate.track.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {duplicate.track.artists.map(a => a.name).join(', ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Album: {duplicate.track.album.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-400">{duplicate.locations.length}x</p>
                      <p className="text-xs text-muted-foreground">gefunden</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {duplicate.locations.map((location, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {location.type === 'library' ? '❤️ Bibliothek' : `📝 ${location.name}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {analysis.duplicateTracks.length > 10 && (
              <div className="mt-4 p-3 bg-gray-500/10 rounded-lg border border-gray-500/20">
                <p className="text-sm text-gray-300">
                  ... und {analysis.duplicateTracks.length - 10} weitere Songs mit Duplikaten
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Wiederentdecken-Analyse Komponente
function RediscoverAnalysisView({ analysis }: { analysis: RediscoverAnalysis | null }) {
  if (!analysis) return null

  const getRediscoverPersonality = () => {
    const oldCount = analysis.oldTracks.length
    const gemsCount = analysis.forgottenGems.length
    
    if (oldCount === 0) {
      return {
        title: "Du bist immer up-to-date! 🚀",
        description: "Wow! Du hast keine alten Tracks - du bist immer am Puls der Zeit und entdeckst ständig neue Musik!",
        emoji: "🎯"
      }
    } else if (oldCount < 50) {
      return {
        title: "Perfekte Balance! ⚖️",
        description: "Du hast eine schöne Mischung aus neuen und bewährten Tracks. Zeit, ein paar Oldies zu revisiten!",
        emoji: "💎"
      }
    } else if (oldCount < 200) {
      return {
        title: "Schatzsuche-Zeit! 🗺️",
        description: "Du hast eine richtige Schatzkammer an alten Tracks! Lass uns gemeinsam ein paar vergessene Perlen ausgraben.",
        emoji: "💰"
      }
    } else {
      return {
        title: "Wow, eine echte Zeitkapsel! 📦",
        description: "Deine Sammlung ist wie eine musikalische Zeitreise! So viele Erinnerungen warten darauf, wiederentdeckt zu werden.",
        emoji: "🎭"
      }
    }
  }

  const personality = getRediscoverPersonality()

  return (
    <div className="space-y-8">
      {/* Wiederentdeckung-Übersicht */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Wiederentdeckung-Übersicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Alte Tracks</p>
              <p className="text-2xl font-bold">{analysis.oldTracks.length}</p>
              <p className="text-xs text-muted-foreground">Älter als 1 Jahr (hinzugefügt)</p>
            </div>
            <div>
              <p className="text-sm font-medium">Vergessene Perlen</p>
              <p className="text-2xl font-bold">{analysis.forgottenGems.length}</p>
              <p className="text-xs text-muted-foreground">Alte Tracks mit hoher Popularität (>60)</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <p className="text-sm text-yellow-200">
              <strong>💡 Tipp:</strong> Vergessene Perlen sind alte Tracks mit hoher Popularität - 
              perfekt für nostalgische Hörsessions!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Alte Tracks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Alte Tracks wiederentdecken (Top 10)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {analysis.oldTracks.length} Tracks älter als 1 Jahr gefunden. Diese wurden vor langer Zeit zu deiner Bibliothek hinzugefügt.
          </p>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {analysis.oldTracks.slice(0, 10).map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <img 
                  src={item.track.album.images[0]?.url || '/placeholder-album.png'} 
                  alt={item.track.album.name}
                  className="w-12 h-12 rounded"
                />
                <div className="flex-1">
                  <p className="font-medium">{item.track.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.track.artists.map(a => a.name).join(', ')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Album: {item.track.album.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-400">{item.daysSinceAdded} Tage</p>
                  <p className="text-xs text-muted-foreground">alt</p>
                </div>
              </div>
            ))}
          </div>
          
          {analysis.oldTracks.length > 10 && (
            <div className="mt-4 p-3 bg-gray-500/10 rounded-lg border border-gray-500/20">
              <p className="text-sm text-gray-300">
                ... und {analysis.oldTracks.length - 10} weitere alte Tracks
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {analysis.forgottenGems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vergessene Perlen (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Diese alten Tracks haben eine hohe Popularität (>60) und sind perfekt zum Wiederentdecken. 
              Der Score kombiniert Popularität und Alter.
            </p>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {analysis.forgottenGems.slice(0, 10).map((gem, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <img 
                    src={gem.track.album.images[0]?.url || '/placeholder-album.png'} 
                    alt={gem.track.album.name}
                    className="w-12 h-12 rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{gem.track.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {gem.track.artists.map(a => a.name).join(', ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Album: {gem.track.album.name}
                    </p>
                    <p className="text-xs text-green-400">{gem.reason}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-1">
                      Score: {gem.score.toFixed(0)}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Pop: {gem.track.popularity}/100
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {analysis.forgottenGems.length > 10 && (
              <div className="mt-4 p-3 bg-gray-500/10 rounded-lg border border-gray-500/20">
                <p className="text-sm text-gray-300">
                  ... und {analysis.forgottenGems.length - 10} weitere vergessene Perlen
                </p>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <p className="text-sm text-purple-200">
                <strong>📊 Score-Erklärung:</strong> Der Score wird aus Popularität (0-100) und Alter berechnet. 
                Höhere Scores bedeuten beliebte Songs, die du lange nicht gehört hast.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Einfache Wachstums-Chart Komponente
function LibraryGrowthChart({ data }: { data: Array<{ date: string, tracksAdded: number, albumsAdded: number }> }) {
  const maxTracks = Math.max(...data.map(d => d.tracksAdded))
  const maxAlbums = Math.max(...data.map(d => d.albumsAdded))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm">Tracks</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm">Alben</span>
        </div>
      </div>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {data.slice(-12).map((item, index) => (
          <div key={item.date} className="flex items-center gap-3">
            <span className="text-sm font-mono w-16 text-muted-foreground">
              {item.date}
            </span>
            <div className="flex-1 flex gap-2">
              <div className="flex-1">
                <div className="bg-muted rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${maxTracks > 0 ? (item.tracksAdded / maxTracks) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${maxAlbums > 0 ? (item.albumsAdded / maxAlbums) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <span className="w-8 text-right">{item.tracksAdded}</span>
              <span className="w-8 text-right">{item.albumsAdded}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 
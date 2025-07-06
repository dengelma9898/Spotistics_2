'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  getAllSavedTracks, 
  getAllSavedAlbums, 
  getAllUserPlaylists,
  calculateLibraryStats,
  analyzeLibraryGrowth,
  findDuplicateTracks
} from '@/lib/spotify'
import { Header } from '@/components/Header'
import { StatCard } from '@/components/StatCard'
import { LibraryGrowthChart } from '@/components/LibraryGrowthChart'
import { DuplicateTracksList } from '@/components/DuplicateTracksList'
import { LibraryOverview } from '@/components/LibraryOverview'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Music, Album, ListMusic, TrendingUp, Copy, Clock, Users, Star } from 'lucide-react'

interface LibraryStats {
  totalTracks: number
  totalAlbums: number
  totalPlaylists: number
  recentTracks: number
  yearlyTracks: number
  uniqueArtists: number
  totalDurationHours: number
  avgPopularity: number
  duplicatesCount: number
  oldestTrack: any
  newestTrack: any
}

export default function LibraryPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Data States
  const [tracks, setTracks] = useState<any[]>([])
  const [albums, setAlbums] = useState<any[]>([])
  const [playlists, setPlaylists] = useState<any[]>([])
  const [stats, setStats] = useState<LibraryStats | null>(null)
  const [growthData, setGrowthData] = useState<any[]>([])
  const [duplicates, setDuplicates] = useState<any[]>([])
  
  // Loading States
  const [loadingTracks, setLoadingTracks] = useState(false)
  const [loadingAlbums, setLoadingAlbums] = useState(false)
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)

  useEffect(() => {
    if (session?.accessToken) {
      loadLibraryData()
    }
  }, [session])

  const loadLibraryData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🚀 Starte Library Analytics Datenladung...')
      
      // Parallel laden für bessere Performance
      const [tracksData, albumsData, playlistsData] = await Promise.allSettled([
        loadTracks(),
        loadAlbums(),
        loadPlaylists()
      ])
      
      // Verarbeite Ergebnisse
      const finalTracks = tracksData.status === 'fulfilled' ? tracksData.value : []
      const finalAlbums = albumsData.status === 'fulfilled' ? albumsData.value : []
      const finalPlaylists = playlistsData.status === 'fulfilled' ? playlistsData.value : []
      
      // Berechne Statistiken
      const libraryStats = calculateLibraryStats(finalTracks, finalAlbums, finalPlaylists)
      const growth = analyzeLibraryGrowth(finalTracks)
      const duplicatesList = findDuplicateTracks(finalTracks)
      
      setStats(libraryStats)
      setGrowthData(growth)
      setDuplicates(duplicatesList)
      
      console.log('✅ Library Analytics Daten erfolgreich geladen')
      console.log('📊 Stats:', libraryStats)
      
    } catch (err) {
      console.error('❌ Fehler beim Laden der Library-Daten:', err)
      setError('Fehler beim Laden der Library-Daten')
    } finally {
      setLoading(false)
    }
  }

  const loadTracks = async () => {
    setLoadingTracks(true)
    try {
      const tracksData = await getAllSavedTracks()
      setTracks(tracksData)
      return tracksData
    } catch (error) {
      console.error('Fehler beim Laden der Tracks:', error)
      return []
    } finally {
      setLoadingTracks(false)
    }
  }

  const loadAlbums = async () => {
    setLoadingAlbums(true)
    try {
      const albumsData = await getAllSavedAlbums()
      setAlbums(albumsData)
      return albumsData
    } catch (error) {
      console.error('Fehler beim Laden der Alben:', error)
      return []
    } finally {
      setLoadingAlbums(false)
    }
  }

  const loadPlaylists = async () => {
    setLoadingPlaylists(true)
    try {
      const playlistsData = await getAllUserPlaylists()
      setPlaylists(playlistsData)
      return playlistsData
    } catch (error) {
      console.error('Fehler beim Laden der Playlists:', error)
      return []
    } finally {
      setLoadingPlaylists(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Bitte melden Sie sich an
            </h1>
            <p className="text-gray-300">
              Um Ihre Library Analytics zu sehen, müssen Sie sich mit Spotify anmelden.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-400 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Analysiere Ihre Spotify Library...
            </h2>
            <p className="text-gray-300 mb-4">
              Dies kann einige Minuten dauern, je nach Größe Ihrer Library.
            </p>
            
            {/* Loading Status */}
            <div className="max-w-md mx-auto space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Tracks laden:</span>
                <span className={loadingTracks ? 'text-yellow-400' : 'text-green-400'}>
                  {loadingTracks ? 'Lädt...' : 'Fertig'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Alben laden:</span>
                <span className={loadingAlbums ? 'text-yellow-400' : 'text-green-400'}>
                  {loadingAlbums ? 'Lädt...' : 'Fertig'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Playlists laden:</span>
                <span className={loadingPlaylists ? 'text-yellow-400' : 'text-green-400'}>
                  {loadingPlaylists ? 'Lädt...' : 'Fertig'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Fehler beim Laden</h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <Button 
              onClick={loadLibraryData}
              className="bg-green-600 hover:bg-green-700"
            >
              Erneut versuchen
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            📚 Library Analytics
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Detaillierte Analyse Ihrer Spotify Library mit Statistiken, Trends und Insights.
          </p>
        </div>

                 {/* Quick Stats */}
         {stats && (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
             <StatCard
               icon={<Music className="h-8 w-8" />}
               title="Gespeicherte Tracks"
               value={stats.totalTracks.toLocaleString()}
               subtitle={`${stats.recentTracks} diesen Monat hinzugefügt`}
             />
             <StatCard
               icon={<Album className="h-8 w-8" />}
               title="Gespeicherte Alben"
               value={stats.totalAlbums.toLocaleString()}
               subtitle={`Von ${stats.uniqueArtists} verschiedenen Artists`}
             />
             <StatCard
               icon={<ListMusic className="h-8 w-8" />}
               title="Playlists"
               value={stats.totalPlaylists.toLocaleString()}
               subtitle="Eigene & verfolgte Playlists"
             />
             <StatCard
               icon={<Clock className="h-8 w-8" />}
               title="Gesamtdauer"
               value={`${stats.totalDurationHours}h`}
               subtitle={`Das sind ${Math.round(stats.totalDurationHours / 24)} Tage Musik`}
             />
           </div>
         )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="growth">Wachstum</TabsTrigger>
            <TabsTrigger value="duplicates">Duplikate</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {stats && (
              <LibraryOverview 
                stats={stats}
                tracks={tracks}
                albums={albums}
                playlists={playlists}
              />
            )}
          </TabsContent>

          {/* Growth Tab */}
          <TabsContent value="growth" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Library-Wachstum über Zeit
                </CardTitle>
                <CardDescription>
                  Zeigt, wie Ihre Library über die Zeit gewachsen ist
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LibraryGrowthChart data={growthData} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Duplicates Tab */}
          <TabsContent value="duplicates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Copy className="h-5 w-5" />
                  Duplikate in Ihrer Library
                  <Badge variant="secondary">{duplicates.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Tracks, die möglicherweise mehrfach in Ihrer Library gespeichert sind
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DuplicateTracksList duplicates={duplicates} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ältester vs Neuester Track */}
                <Card>
                  <CardHeader>
                    <CardTitle>Zeitspanne Ihrer Library</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {stats.oldestTrack && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-400 mb-2">
                          Ältester Track
                        </h4>
                        <div className="flex items-center gap-3">
                          <img 
                            src={stats.oldestTrack.track.album.images[0]?.url || '/placeholder-album.png'}
                            alt={stats.oldestTrack.track.name}
                            className="w-12 h-12 rounded"
                          />
                          <div>
                            <p className="font-medium">{stats.oldestTrack.track.name}</p>
                            <p className="text-sm text-gray-400">
                              {stats.oldestTrack.track.artists[0]?.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Hinzugefügt: {new Date(stats.oldestTrack.added_at).toLocaleDateString('de-DE')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {stats.newestTrack && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-400 mb-2">
                          Neuester Track
                        </h4>
                        <div className="flex items-center gap-3">
                          <img 
                            src={stats.newestTrack.track.album.images[0]?.url || '/placeholder-album.png'}
                            alt={stats.newestTrack.track.name}
                            className="w-12 h-12 rounded"
                          />
                          <div>
                            <p className="font-medium">{stats.newestTrack.track.name}</p>
                            <p className="text-sm text-gray-400">
                              {stats.newestTrack.track.artists[0]?.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Hinzugefügt: {new Date(stats.newestTrack.added_at).toLocaleDateString('de-DE')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Aktivitäts-Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle>Aktivitäts-Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Tracks dieses Jahr</span>
                      <span className="font-medium">{stats.yearlyTracks}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Tracks diesen Monat</span>
                      <span className="font-medium">{stats.recentTracks}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Durchschnittliche Popularität</span>
                      <span className="font-medium">{stats.avgPopularity}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Duplikate gefunden</span>
                      <span className="font-medium text-yellow-400">{stats.duplicatesCount}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Refresh Button */}
        <div className="text-center mt-8">
          <Button 
            onClick={loadLibraryData}
            className="bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            {loading ? 'Lädt...' : 'Daten aktualisieren'}
          </Button>
        </div>
      </div>
    </div>
  )
} 
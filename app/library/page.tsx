'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  getAllSavedTracks, 
  getAllSavedAlbums, 
  getAllUserPlaylists,
  calculateLibraryStats,
  findDuplicateTracks,
  analyzeLibraryGrowth
} from '@/lib/spotify'
import { Header } from '@/components/Header'
import { LibraryOverview } from '@/components/LibraryOverview'
import { LibraryGrowthChart } from '@/components/LibraryGrowthChart'
import { DuplicateTracksList } from '@/components/DuplicateTracksList'
import { BackgroundGradient } from '@/components/ui/background-gradient'
import { 
  Music, 
  Album, 
  ListMusic, 
  TrendingUp, 
  Loader2,
  AlertCircle,
  Database,
  Calendar,
  Copy
} from 'lucide-react'

export default function LibraryPage() {
  const { data: session } = useSession()
  const [tracks, setTracks] = useState<any[]>([])
  const [albums, setAlbums] = useState<any[]>([])
  const [playlists, setPlaylists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingStep, setLoadingStep] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (session?.accessToken) {
      loadLibraryData()
    }
  }, [session?.accessToken])

  const loadLibraryData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      setLoadingStep('Lade gespeicherte Tracks...')
      const tracksData = await getAllSavedTracks()
      setTracks(tracksData)
      
      setLoadingStep('Lade gespeicherte Alben...')
      const albumsData = await getAllSavedAlbums()
      setAlbums(albumsData)
      
      setLoadingStep('Lade Playlists...')
      const playlistsData = await getAllUserPlaylists()
      setPlaylists(playlistsData)
      
      setLoadingStep('Analysiere Bibliothek...')
      // Weitere Analysen hier
      
    } catch (err: any) {
      console.error('Fehler beim Laden der Bibliothek:', err)
      setError(err.message || 'Fehler beim Laden der Bibliotheksdaten')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  const stats = calculateLibraryStats(tracks, albums, playlists)
  const growthData = analyzeLibraryGrowth(tracks)
  const duplicates = findDuplicateTracks(tracks)

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Bitte melden Sie sich an, um Ihre Bibliothek zu sehen</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header user={user} />
      <BackgroundGradient className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Musik-Bibliothek</h1>
                <p className="text-gray-400">Deine komplette Sammlung im Überblick</p>
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto mb-4" />
                <p className="text-gray-400">{loadingStep}</p>
                <p className="text-gray-500 text-sm mt-2">
                  Dies kann bei großen Bibliotheken einige Minuten dauern...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-300">{error}</p>
              </div>
              <button 
                onClick={loadLibraryData}
                className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition-colors"
              >
                Erneut versuchen
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-8">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <Music className="w-8 h-8 text-green-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Gespeicherte Tracks</p>
                      <p className="text-white text-xl font-bold">{stats.totalTracks}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <Album className="w-8 h-8 text-blue-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Gespeicherte Alben</p>
                      <p className="text-white text-xl font-bold">{stats.totalAlbums}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <ListMusic className="w-8 h-8 text-purple-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Playlists</p>
                      <p className="text-white text-xl font-bold">{stats.totalPlaylists}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <Copy className="w-8 h-8 text-orange-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Duplikate</p>
                      <p className="text-white text-xl font-bold">{duplicates.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Library Overview */}
              <LibraryOverview 
                stats={stats}
                tracks={tracks}
                albums={albums}
                playlists={playlists}
                artistsWithImages={new Map()}
              />

              {/* Growth Chart */}
              <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                  <h2 className="text-xl font-bold">Bibliotheks-Wachstum</h2>
                </div>
                <LibraryGrowthChart data={growthData} />
              </div>

              {/* Duplicates */}
              {duplicates.length > 0 && (
                <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Copy className="w-6 h-6 text-orange-400" />
                    <h2 className="text-xl font-bold">Duplikate bereinigen</h2>
                  </div>
                  <DuplicateTracksList duplicates={duplicates} />
                </div>
              )}
            </div>
          )}
        </div>
      </BackgroundGradient>
    </div>
  )
} 
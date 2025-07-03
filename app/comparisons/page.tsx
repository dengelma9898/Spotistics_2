'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { SpotifyUser, SpotifyTrack, SpotifyArtist } from '@/types/spotify'
import { getSpotifyApi } from '@/lib/spotify'
import { Header } from '@/components/Header'
import { BackgroundGradient } from '@/components/ui/background-gradient'
import MainstreamAnalysis from '@/components/MainstreamAnalysis'
import FollowedArtistsInsights from '@/components/FollowedArtistsInsights'
import ListeningPatterns from '@/components/ListeningPatterns'
import { BarChart3, Users, TrendingUp, Music, Loader2, RefreshCw } from 'lucide-react'

export default function ComparisonsPage() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [artists, setArtists] = useState<SpotifyArtist[]>([])
  const [timeRange, setTimeRange] = useState('medium_term')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.accessToken) {
      loadUserData()
      loadMusicData()
    }
  }, [session?.accessToken, timeRange])

  const loadUserData = async () => {
    try {
      const spotifyApi = await getSpotifyApi()
      if (!spotifyApi) return

      const userData = await spotifyApi.getCurrentUser()
      setUser(userData)
    } catch (err: any) {
      console.error('Fehler beim Laden der Benutzerdaten:', err)
    }
  }

  const loadMusicData = async () => {
    try {
      setLoading(true)
      setError(null)
      const spotifyApi = await getSpotifyApi()
      if (!spotifyApi) throw new Error('Spotify API nicht verfügbar')

      // Parallele API-Aufrufe für bessere Performance
      const [tracksResponse, artistsResponse] = await Promise.all([
        spotifyApi.getTopTracks(timeRange, 50),
        spotifyApi.getTopArtists(timeRange, 50)
      ])

      setTracks(tracksResponse.items)
      setArtists(artistsResponse.items)
    } catch (err: any) {
      console.error('Fehler beim Laden der Musikdaten:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const timeRangeOptions = [
    { value: 'short_term', label: 'Letzte 4 Wochen', icon: '📅' },
    { value: 'medium_term', label: 'Letzte 6 Monate', icon: '📊' },
    { value: 'long_term', label: 'Gesamte Zeit', icon: '📈' }
  ]

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-spin" />
          <p className="text-white/70">Lade Session...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Bitte melden Sie sich an, um Vergleiche zu sehen</p>
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
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Musik-Vergleiche</h1>
                <p className="text-white/70">Entdecke wie dein Musikgeschmack im Vergleich steht</p>
              </div>
            </div>

            {/* Time Range Selector */}
            <div className="flex gap-2 flex-wrap">
              {timeRangeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeRange(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeRange === option.value
                      ? 'bg-white/20 text-white border-white/30'
                      : 'bg-white/10 text-white/70 hover:bg-white/15 border-white/10'
                  } border`}
                >
                  <span className="mr-2">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
                <p className="text-white/70">Analysiere deinen Musikgeschmack...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 mb-8">
              <p className="text-red-300">{error}</p>
              <button 
                onClick={loadMusicData}
                className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Erneut versuchen
              </button>
            </div>
          )}

          {!loading && !error && tracks.length > 0 && artists.length > 0 && (
            <div className="space-y-8">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4">
                  <div className="flex items-center gap-3">
                    <Music className="w-8 h-8 text-blue-400" />
                    <div>
                      <p className="text-white/70 text-sm">Analysierte Tracks</p>
                      <p className="text-white text-xl font-bold">{tracks.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-purple-400" />
                    <div>
                      <p className="text-white/70 text-sm">Top Artists</p>
                      <p className="text-white text-xl font-bold">{artists.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-green-400" />
                    <div>
                      <p className="text-white/70 text-sm">Ø Popularität</p>
                      <p className="text-white text-xl font-bold">
                        {tracks.length > 0 ? Math.round(tracks.reduce((sum, t) => sum + t.popularity, 0) / tracks.length) : 0}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-8 h-8 text-orange-400" />
                    <div>
                      <p className="text-white/70 text-sm">Zeitraum</p>
                      <p className="text-white text-xl font-bold">
                        {timeRangeOptions.find(opt => opt.value === timeRange)?.label.split(' ')[1] || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparison Components */}
              <div className="space-y-8">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Mainstream Analysis */}
                  <MainstreamAnalysis tracks={tracks} artists={artists} />
                  
                  {/* Followed Artists Insights */}
                  <FollowedArtistsInsights topArtists={artists} topTracks={tracks} />
                </div>
                
                {/* Listening Patterns - Full Width */}
                <ListeningPatterns />
              </div>

              {/* Additional Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Genre Diversity */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                      <Music className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Genre-Vielfalt</h3>
                      <p className="text-white/70 text-sm">Deine musikalische Breite</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">Einzigartige Genres</span>
                      <span className="text-white font-medium">
                        {new Set(artists.flatMap(a => a.genres)).size}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">Ø Genres/Artist</span>
                      <span className="text-white font-medium">
                        {artists.length > 0 ? 
                          (artists.reduce((sum, a) => sum + a.genres.length, 0) / artists.length).toFixed(1) 
                          : '0'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-white/5 rounded-lg">
                    <p className="text-white/70 text-sm">
                      {new Set(artists.flatMap(a => a.genres)).size > 15 
                        ? "🌈 Sehr vielfältiger Geschmack! Du hörst quer durch alle Genres."
                        : new Set(artists.flatMap(a => a.genres)).size > 8
                        ? "🎵 Gute Genrevielfalt! Du bist offen für verschiedene Stile."
                        : "🎯 Fokussierter Geschmack! Du weißt genau, was dir gefällt."
                      }
                    </p>
                  </div>
                </div>

                {/* Era Preference */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Zeit-Präferenz</h3>
                      <p className="text-white/70 text-sm">Deine musikalische Zeitreise</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {(() => {
                      const currentYear = new Date().getFullYear()
                      const recentTracks = tracks.filter(t => 
                        new Date(t.album.release_date).getFullYear() >= currentYear - 3
                      ).length
                      const recentPercentage = Math.round((recentTracks / tracks.length) * 100)
                      
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-white/80 text-sm">Aktuelle Musik (letzten 3 Jahre)</span>
                            <span className="text-white font-medium">{recentPercentage}%</span>
                          </div>
                          
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                              style={{ width: `${recentPercentage}%` }}
                            />
                          </div>
                        </>
                      )
                    })()}
                  </div>
                  
                  <div className="mt-4 p-3 bg-white/5 rounded-lg">
                    <p className="text-white/70 text-sm">
                      {(() => {
                        const currentYear = new Date().getFullYear()
                        const recentTracks = tracks.filter(t => 
                          new Date(t.album.release_date).getFullYear() >= currentYear - 3
                        ).length
                        const recentPercentage = Math.round((recentTracks / tracks.length) * 100)
                        
                        if (recentPercentage > 70) {
                          return "🚀 Du bist immer up-to-date mit den neuesten Releases!"
                        } else if (recentPercentage > 40) {
                          return "⚖️ Gute Balance zwischen neu und klassisch!"
                        } else {
                          return "🎶 Du schätzt zeitlose Klassiker und Vintage-Musik!"
                        }
                      })()}
                    </p>
                  </div>
                </div>

                {/* Discovery Score */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Discovery-Score</h3>
                      <p className="text-white/70 text-sm">Wie adventurous bist du?</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {(() => {
                      const undergroundTracks = tracks.filter(t => t.popularity <= 50).length
                      const discoveryScore = Math.round((undergroundTracks / tracks.length) * 100)
                      
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-white/80 text-sm">Underground-Anteil</span>
                            <span className="text-white font-medium">{discoveryScore}%</span>
                          </div>
                          
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                              style={{ width: `${discoveryScore}%` }}
                            />
                          </div>
                        </>
                      )
                    })()}
                  </div>
                  
                  <div className="mt-4 p-3 bg-white/5 rounded-lg">
                    <p className="text-white/70 text-sm">
                      {(() => {
                        const undergroundTracks = tracks.filter(t => t.popularity <= 50).length
                        const discoveryScore = Math.round((undergroundTracks / tracks.length) * 100)
                        
                        if (discoveryScore > 60) {
                          return "🔍 Echter Music-Explorer! Du entdeckst versteckte Perlen."
                        } else if (discoveryScore > 30) {
                          return "🎯 Ausgewogene Discovery! Du balancierst bekannt und neu."
                        } else {
                          return "📻 Hit-Liebhaber! Du magst bewährte und populäre Musik."
                        }
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && (tracks.length === 0 || artists.length === 0) && (
            <div className="text-center py-20">
              <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Keine Musikdaten für diesen Zeitraum gefunden</p>
              <p className="text-gray-500 text-sm mt-2">
                Versuchen Sie einen anderen Zeitraum oder spielen Sie mehr Musik auf Spotify
              </p>
            </div>
          )}
        </div>
      </BackgroundGradient>
    </div>
  )
} 
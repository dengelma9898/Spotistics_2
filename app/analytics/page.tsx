'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getSpotifyApi } from '@/lib/spotify'
import { SpotifyTrack, SpotifyArtist, SpotifyUser, RecentlyPlayedResponse } from '@/types/spotify'
import { Header } from '@/components/Header'
import TrackMetadataDetails from '@/components/TrackMetadataDetails'
import PopularityChart from '@/components/PopularityChart'
import ReleaseDateTimeline from '@/components/ReleaseDateTimeline'
import ArtistFrequencyChart from '@/components/ArtistFrequencyChart'
import GenreDistribution from '@/components/GenreDistribution'
import RecentlyPlayedTimeline from '@/components/RecentlyPlayedTimeline'
import DailyListeningHeatmap from '@/components/DailyListeningHeatmap'
import GenreEvolutionChart from '@/components/GenreEvolutionChart'
import DiscoveryAnalytics from '@/components/DiscoveryAnalytics'
import { BackgroundGradient } from '@/components/ui/background-gradient'
import { TrendingUp, Music, Calendar, Users, Loader2, Clock, Activity, BarChart3 } from 'lucide-react'

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [artists, setArtists] = useState<SpotifyArtist[]>([])
  const [recentTracks, setRecentTracks] = useState<RecentlyPlayedResponse | null>(null)
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null)
  const [timeRange, setTimeRange] = useState<'short_term' | 'medium_term' | 'long_term'>('medium_term')
  const [activeTab, setActiveTab] = useState<'overview' | 'temporal' | 'tracks'>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.accessToken) {
      loadTracks()
    }
  }, [session?.accessToken, timeRange])

  const loadTracks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const api = await getSpotifyApi()
      if (!api) {
        throw new Error('Spotify API nicht verfügbar')
      }

      // Parallele API-Aufrufe für bessere Performance
      const [tracksResponse, artistsResponse, userResponse, recentResponse] = await Promise.all([
        api.currentUser.topItems('tracks', timeRange as 'short_term' | 'medium_term' | 'long_term', 50),
        api.currentUser.topItems('artists', timeRange as 'short_term' | 'medium_term' | 'long_term', 50),
        api.currentUser.profile(),
        api.player.getRecentlyPlayedTracks(50)
      ])
      
      setTracks(tracksResponse.items as SpotifyTrack[])
      setArtists(artistsResponse.items as SpotifyArtist[])
      setUser(userResponse)
      setRecentTracks(recentResponse)
      
      // Setze ersten Track als Standard-Selection
      if (tracksResponse.items.length > 0 && !selectedTrack) {
        setSelectedTrack(tracksResponse.items[0] as SpotifyTrack)
      }
    } catch (err: any) {
      console.error('Fehler beim Laden der Analytics:', err)
      setError(err.message || 'Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

  const timeRangeOptions = [
    { value: 'short_term' as const, label: 'Letzte 4 Wochen', icon: '📅' },
    { value: 'medium_term' as const, label: 'Letzte 6 Monate', icon: '📊' },
    { value: 'long_term' as const, label: 'Gesamte Zeit', icon: '📈' }
  ]

  const tabOptions = [
    { value: 'overview' as const, label: 'Übersicht', icon: BarChart3 },
    { value: 'temporal' as const, label: 'Zeitanalyse', icon: Clock },
    { value: 'tracks' as const, label: 'Track Details', icon: Music }
  ]

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Bitte melden Sie sich an, um Analytics zu sehen</p>
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
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Erweiterte Analytics</h1>
                <p className="text-gray-400">Detaillierte Analyse deines Musikgeschmacks und Hörverhaltens</p>
              </div>
            </div>

            {/* Time Range Selector */}
            <div className="flex gap-2 flex-wrap mb-4">
              {timeRangeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeRange(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeRange === option.value
                      ? 'bg-white/20 text-white border-white/30'
                      : 'bg-white/10 text-gray-300 hover:bg-white/15 border-white/10'
                  } border`}
                >
                  <span className="mr-2">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 flex-wrap">
              {tabOptions.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === tab.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/15'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
                <p className="text-gray-400">Analysiere deine Musik...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 mb-8">
              <p className="text-red-300">{error}</p>
              <button 
                onClick={loadTracks}
                className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition-colors"
              >
                Erneut versuchen
              </button>
            </div>
          )}

          {!loading && !error && tracks.length > 0 && (
            <div className="space-y-8">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <Music className="w-8 h-8 text-purple-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Top Tracks</p>
                      <p className="text-white text-xl font-bold">{tracks.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-blue-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Artists</p>
                      <p className="text-white text-xl font-bold">
                        {new Set(tracks.flatMap(t => t.artists.map(a => a.id))).size}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-green-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Ø Popularität</p>
                      <p className="text-white text-xl font-bold">
                        {(tracks.reduce((sum, t) => sum + t.popularity, 0) / tracks.length).toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <Activity className="w-8 h-8 text-orange-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Recent Tracks</p>
                      <p className="text-white text-xl font-bold">
                        {recentTracks?.items?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Popularity Chart */}
                  <PopularityChart tracks={tracks} />
                  
                  {/* Artist Frequency */}
                  <ArtistFrequencyChart tracks={tracks} />
                  
                  {/* Genre Distribution */}
                  <GenreDistribution tracks={tracks} artists={artists} />
                  
                  {/* Genre Evolution Chart */}
                  <div className="xl:col-span-2">
                    <GenreEvolutionChart />
                  </div>
                  
                  {/* Discovery Analytics */}
                  <div className="xl:col-span-2">
                    <DiscoveryAnalytics />
                  </div>
                  
                  {/* Release Date Timeline */}
                  <div className="xl:col-span-2">
                    <ReleaseDateTimeline tracks={tracks} />
                  </div>
                </div>
              )}

              {activeTab === 'temporal' && recentTracks && (
                <div className="space-y-8">
                  {/* Recently Played Timeline */}
                  <RecentlyPlayedTimeline 
                    recentTracks={recentTracks}
                    title="Recently Played Timeline"
                  />
                  
                  {/* Daily Listening Heatmap */}
                  <DailyListeningHeatmap 
                    recentTracks={recentTracks}
                    title="Hörgewohnheiten Heatmap"
                  />
                </div>
              )}

              {activeTab === 'tracks' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white">Track Details</h2>
                  
                  {/* Track Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {tracks.slice(0, 12).map((track) => (
                      <button
                        key={track.id}
                        onClick={() => setSelectedTrack(track)}
                        className={`p-4 rounded-xl text-left transition-all border-2 ${
                          selectedTrack?.id === track.id
                            ? 'bg-white/15 backdrop-blur-sm border-white/50 shadow-lg ring-2 ring-white/30'
                            : 'bg-white/10 backdrop-blur-sm hover:bg-white/20 border-white/30 hover:border-white/50'
                        }`}
                      >
                        <p className="text-white font-semibold text-sm truncate mb-1">{track.name}</p>
                        <p className="text-white/90 text-xs truncate mb-2">
                          {track.artists.map(a => a.name).join(', ')}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full" role="presentation"></div>
                          <span className="text-white/95 text-xs font-medium">{track.popularity} Pop.</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Selected Track Details */}
                  {selectedTrack && (
                    <TrackMetadataDetails track={selectedTrack} showFullDetails={true} />
                  )}
                </div>
              )}
            </div>
          )}

          {!loading && !error && tracks.length === 0 && (
            <div className="text-center py-20">
              <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Keine Tracks für diesen Zeitraum gefunden</p>
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
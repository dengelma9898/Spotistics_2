'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { getSpotifyApi } from '@/lib/spotify'
import { Heart, Star, TrendingUp, Users, Award, Crown } from 'lucide-react'

interface ArtistLoyalty {
  artist: any
  loyaltyScore: number
  metrics: {
    topRanking: number
    recentActivity: number
    libraryPresence: number
    consistency: number
    timeSpan: number
  }
  loyaltyLevel: string
  color: string
  icon: string
}

export default function ArtistLoyaltyScore() {
  const [loyaltyData, setLoyaltyData] = useState<ArtistLoyalty[]>([])
  const [selectedArtist, setSelectedArtist] = useState<ArtistLoyalty | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadArtistLoyalty()
  }, [])

  const loadArtistLoyalty = async () => {
    try {
      setLoading(true)
      setError(null)

      const sdk = await getSpotifyApi()
      if (!sdk) throw new Error('Spotify API nicht verfügbar')

      const [topArtists, recentlyPlayed, savedTracks] = await Promise.all([
        sdk.currentUser.topItems('artists', 'medium_term', 50),
        sdk.player.getRecentlyPlayedTracks(50),
        sdk.currentUser.tracks.savedTracks(50)
      ])

      const artistLoyaltyScores = calculateArtistLoyalty(
        topArtists.items,
        recentlyPlayed.items,
        savedTracks.items
      )

      setLoyaltyData(artistLoyaltyScores)
      
      if (artistLoyaltyScores.length > 0) {
        setSelectedArtist(artistLoyaltyScores[0])
      }

    } catch (error) {
      console.error('Fehler beim Laden der Artist Loyalty:', error)
      setError(error instanceof Error ? error.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  const calculateArtistLoyalty = (
    topArtists: any[],
    recentTracks: any[],
    savedTracks: any[]
  ): ArtistLoyalty[] => {
    return topArtists.slice(0, 10).map((artist, index) => {
      const topRanking = ((topArtists.length - index) / topArtists.length) * 100

      const recentPlays = recentTracks.filter(
        item => item.track.artists.some((a: any) => a.id === artist.id)
      ).length
      const recentActivity = Math.min((recentPlays / 10) * 100, 100)

      const savedCount = savedTracks.filter(
        item => item.track.artists.some((a: any) => a.id === artist.id)
      ).length
      const libraryPresence = Math.min((savedCount / 5) * 100, 100)

      const consistency = calculateConsistencyScore(artist.id, recentTracks)
      const timeSpan = 85

      const loyaltyScore = (
        topRanking * 0.3 +
        recentActivity * 0.25 +
        libraryPresence * 0.2 +
        consistency * 0.15 +
        timeSpan * 0.1
      )

      const loyaltyInfo = getLoyaltyLevel(loyaltyScore)

      return {
        artist,
        loyaltyScore,
        metrics: {
          topRanking,
          recentActivity,
          libraryPresence,
          consistency,
          timeSpan
        },
        loyaltyLevel: loyaltyInfo.level,
        color: loyaltyInfo.color,
        icon: loyaltyInfo.icon
      }
    }).sort((a, b) => b.loyaltyScore - a.loyaltyScore)
  }

  const calculateConsistencyScore = (artistId: string, recentTracks: any[]): number => {
    const artistTracks = recentTracks.filter(
      item => item.track.artists.some((a: any) => a.id === artistId)
    )

    if (artistTracks.length === 0) return 0

    const playTimes = artistTracks.map(item => new Date(item.played_at).getTime())
    const timeSpan = Math.max(...playTimes) - Math.min(...playTimes)
    
    const avgGap = timeSpan / Math.max(artistTracks.length - 1, 1)
    const maxPossibleGap = 7 * 24 * 60 * 60 * 1000
    
    return Math.min((avgGap / maxPossibleGap) * 100, 100)
  }

  const getLoyaltyLevel = (score: number): { level: string; color: string; icon: string } => {
    if (score >= 85) return { level: 'Superfan', color: 'text-purple-400', icon: '👑' }
    if (score >= 70) return { level: 'Sehr Loyal', color: 'text-pink-400', icon: '💎' }
    if (score >= 55) return { level: 'Loyal', color: 'text-blue-400', icon: '⭐' }
    if (score >= 40) return { level: 'Fan', color: 'text-green-400', icon: '❤️' }
    if (score >= 25) return { level: 'Gelegentlich', color: 'text-yellow-400', icon: '🎵' }
    return { level: 'Selten', color: 'text-gray-400', icon: '🔸' }
  }

  if (loading) {
    return (
      <Card className="w-full bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Heart className="w-5 h-5" />
            Artist Loyalty Score
          </CardTitle>
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
      <Card className="w-full bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Heart className="w-5 h-5" />
            Artist Loyalty Score
          </CardTitle>
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
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Card className="w-full bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Heart className="w-5 h-5" />
            Artist Loyalty Ranking
          </CardTitle>
          <p className="text-sm text-gray-400">
            Deine treuesten Artists basierend auf Hörverhalten
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {loyaltyData.slice(0, 8).map((artistData, index) => (
              <div
                key={artistData.artist.id}
                onClick={() => setSelectedArtist(artistData)}
                className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${
                  selectedArtist?.artist.id === artistData.artist.id
                    ? 'bg-white/15 border-white/50 shadow-lg'
                    : 'bg-white/10 hover:bg-white/15 border-white/20 hover:border-white/40'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={artistData.artist.images?.[0]?.url || '/placeholder-artist.png'}
                      alt={artistData.artist.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="absolute -top-1 -right-1 text-lg">
                      {artistData.icon}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                      <h3 className="text-white font-semibold truncate">
                        {artistData.artist.name}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-sm font-medium ${artistData.color}`}>
                        {artistData.loyaltyLevel}
                      </span>
                      <span className="text-sm text-gray-400">
                        {artistData.loyaltyScore.toFixed(1)} Punkte
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                        style={{ width: `${Math.min(artistData.loyaltyScore, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedArtist && (
        <Card className="w-full bg-black/20 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Star className="w-5 h-5" />
              {selectedArtist.artist.name} - Loyalitäts-Analyse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg">
                <img
                  src={selectedArtist.artist.images?.[0]?.url || '/placeholder-artist.png'}
                  alt={selectedArtist.artist.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedArtist.artist.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl">{selectedArtist.icon}</span>
                    <span className={`text-lg font-bold ${selectedArtist.color}`}>
                      {selectedArtist.loyaltyLevel}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Loyalty Score: {selectedArtist.loyaltyScore.toFixed(1)}/100
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <p className="text-xs text-gray-400">Top Ranking</p>
                  </div>
                  <p className="text-lg font-bold text-blue-400">
                    {selectedArtist.metrics.topRanking.toFixed(1)}%
                  </p>
                </div>

                <div className="bg-green-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-green-400" />
                    <p className="text-xs text-gray-400">Recent Activity</p>
                  </div>
                  <p className="text-lg font-bold text-green-400">
                    {selectedArtist.metrics.recentActivity.toFixed(1)}%
                  </p>
                </div>

                <div className="bg-purple-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="w-4 h-4 text-purple-400" />
                    <p className="text-xs text-gray-400">Library Presence</p>
                  </div>
                  <p className="text-lg font-bold text-purple-400">
                    {selectedArtist.metrics.libraryPresence.toFixed(1)}%
                  </p>
                </div>

                <div className="bg-yellow-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <p className="text-xs text-gray-400">Consistency</p>
                  </div>
                  <p className="text-lg font-bold text-yellow-400">
                    {selectedArtist.metrics.consistency.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="w-full xl:col-span-2 bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Crown className="w-5 h-5" />
            Loyalty Score Übersicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loyaltyData.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis 
                  dataKey="artist.name" 
                  tick={{ fontSize: 11, fill: '#ffffff' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  stroke="#ffffff60"
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#ffffff' }}
                  stroke="#ffffff60"
                  domain={[0, 100]}
                />
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value.toFixed(1)} Punkte (${props.payload.loyaltyLevel})`,
                    'Loyalty Score'
                  ]}
                  labelFormatter={(label) => `Artist: ${label}`}
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="loyaltyScore" 
                  fill="url(#loyaltyGradient)"
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="loyaltyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
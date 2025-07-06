'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { getSpotifyApi } from '@/lib/spotify'
import { Search, TrendingUp, Clock, Calendar } from 'lucide-react'

interface DiscoveryMetrics {
  discoveryRate: number
  newArtistRate: number
  recentReleaseRate: number
  explorationScore: number
  totalTracksAnalyzed: number
}

interface DiscoveryData {
  category: string
  count: number
  percentage: number
}

interface VintageData {
  period: string
  count: number
  percentage: number
}

export default function DiscoveryAnalytics() {
  const [metrics, setMetrics] = useState<DiscoveryMetrics | null>(null)
  const [discoveryData, setDiscoveryData] = useState<DiscoveryData[]>([])
  const [vintageData, setVintageData] = useState<VintageData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDiscoveryAnalytics()
  }, [])

  const loadDiscoveryAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const sdk = await getSpotifyApi()
      if (!sdk) throw new Error('Spotify API nicht verfügbar')

      // Sammle Recently Played und Saved Tracks für Vergleich
      const [recentlyPlayed, savedTracks] = await Promise.all([
        sdk.player.getRecentlyPlayedTracks(50),
        sdk.currentUser.tracks.savedTracks(50)
      ])

      // Erstelle Set von gespeicherten Track-IDs
      const savedTrackIds = new Set(savedTracks.items.map(item => item.track.id))

      // Analysiere Discovery-Metriken
      const recentTracks = recentlyPlayed.items
      const totalTracks = recentTracks.length

      let newDiscoveries = 0
      let newArtists = 0
      let recentReleases = 0
      
      const knownArtists = new Set()
      const currentYear = new Date().getFullYear()

      // Sammle alle bekannten Artists aus saved tracks
      savedTracks.items.forEach(item => {
        item.track.artists.forEach(artist => {
          knownArtists.add(artist.id)
        })
      })

      // Analysiere Recently Played
      recentTracks.forEach(item => {
        const track = item.track
        const releaseYear = new Date(track.album.release_date).getFullYear()
        
        // Neue Entdeckung (nicht in Library)
        if (!savedTrackIds.has(track.id)) {
          newDiscoveries++
        }
        
        // Neuer Artist (nicht in bekannten Artists)
        if (!track.artists.some(artist => knownArtists.has(artist.id))) {
          newArtists++
        }
        
        // Recent Release (letzte 2 Jahre)
        if (currentYear - releaseYear <= 2) {
          recentReleases++
        }
      })

      // Berechne Metriken
      const discoveryRate = (newDiscoveries / totalTracks) * 100
      const newArtistRate = (newArtists / totalTracks) * 100
      const recentReleaseRate = (recentReleases / totalTracks) * 100
      const explorationScore = (discoveryRate + newArtistRate + recentReleaseRate) / 3

      const calculatedMetrics: DiscoveryMetrics = {
        discoveryRate,
        newArtistRate,
        recentReleaseRate,
        explorationScore,
        totalTracksAnalyzed: totalTracks
      }

      setMetrics(calculatedMetrics)

      // Discovery Data für Bar Chart
      const discoveryChartData: DiscoveryData[] = [
        {
          category: 'Neue Tracks',
          count: newDiscoveries,
          percentage: discoveryRate
        },
        {
          category: 'Neue Artists',
          count: newArtists,
          percentage: newArtistRate
        },
        {
          category: 'Recent Releases',
          count: recentReleases,
          percentage: recentReleaseRate
        },
        {
          category: 'Bekannte Tracks',
          count: totalTracks - newDiscoveries,
          percentage: 100 - discoveryRate
        }
      ]

      setDiscoveryData(discoveryChartData)

      // Vintage vs Modern Analysis
      const vintageAnalysis = analyzeVintageVsModern(recentTracks)
      setVintageData(vintageAnalysis)

    } catch (error) {
      console.error('Fehler beim Laden der Discovery Analytics:', error)
      setError(error instanceof Error ? error.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  const analyzeVintageVsModern = (tracks: any[]): VintageData[] => {
    const currentYear = new Date().getFullYear()
    const periods = {
      'Aktuell (2023-2025)': 0,
      'Modern (2020-2022)': 0,
      'Recent (2015-2019)': 0,
      'Older (2010-2014)': 0,
      'Vintage (< 2010)': 0
    }

    tracks.forEach(item => {
      const releaseYear = new Date(item.track.album.release_date).getFullYear()
      
      if (releaseYear >= 2023) {
        periods['Aktuell (2023-2025)']++
      } else if (releaseYear >= 2020) {
        periods['Modern (2020-2022)']++
      } else if (releaseYear >= 2015) {
        periods['Recent (2015-2019)']++
      } else if (releaseYear >= 2010) {
        periods['Older (2010-2014)']++
      } else {
        periods['Vintage (< 2010)']++
      }
    })

    return Object.entries(periods).map(([period, count]) => ({
      period,
      count,
      percentage: (count / tracks.length) * 100
    }))
  }

  const getExplorationLevel = (score: number): { level: string; color: string; icon: string } => {
    if (score >= 70) return { level: 'Sehr Experimentell', color: 'text-green-400', icon: '🚀' }
    if (score >= 50) return { level: 'Abenteuerlustig', color: 'text-blue-400', icon: '🎯' }
    if (score >= 30) return { level: 'Moderat Entdeckend', color: 'text-yellow-400', icon: '🔍' }
    if (score >= 15) return { level: 'Konservativ', color: 'text-orange-400', icon: '🎵' }
    return { level: 'Sehr Konservativ', color: 'text-red-400', icon: '🔒' }
  }

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1']

  if (loading) {
    return (
      <Card className="w-full bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Search className="w-5 h-5" />
            Discovery Analytics
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
            <Search className="w-5 h-5" />
            Discovery Analytics
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

  if (!metrics) return null

  const exploration = getExplorationLevel(metrics.explorationScore)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Discovery Overview */}
      <Card className="w-full bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Search className="w-5 h-5" />
            Discovery Analytics
          </CardTitle>
          <p className="text-sm text-gray-400">
            Analyse deiner Musik-Entdeckungsgewohnheiten
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Exploration Score */}
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Exploration Score</p>
                  <p className={`text-2xl font-bold ${exploration.color}`}>
                    {metrics.explorationScore.toFixed(1)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl">{exploration.icon}</p>
                  <p className={`text-sm font-medium ${exploration.color}`}>
                    {exploration.level}
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <p className="text-xs text-gray-400">Neue Tracks</p>
                </div>
                <p className="text-lg font-bold text-blue-400">
                  {metrics.discoveryRate.toFixed(1)}%
                </p>
              </div>

              <div className="bg-green-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Search className="w-4 h-4 text-green-400" />
                  <p className="text-xs text-gray-400">Neue Artists</p>
                </div>
                <p className="text-lg font-bold text-green-400">
                  {metrics.newArtistRate.toFixed(1)}%
                </p>
              </div>

              <div className="bg-yellow-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-yellow-400" />
                  <p className="text-xs text-gray-400">Recent Releases</p>
                </div>
                <p className="text-lg font-bold text-yellow-400">
                  {metrics.recentReleaseRate.toFixed(1)}%
                </p>
              </div>

              <div className="bg-purple-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <p className="text-xs text-gray-400">Analysierte Tracks</p>
                </div>
                <p className="text-lg font-bold text-purple-400">
                  {metrics.totalTracksAnalyzed}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discovery Breakdown */}
      <Card className="w-full bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Discovery Breakdown</CardTitle>
          <p className="text-sm text-gray-400">
            Verteilung deiner Hörgewohnheiten
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
               <BarChart data={discoveryData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                 <XAxis 
                   dataKey="category" 
                   tick={{ fontSize: 12, fill: '#ffffff' }}
                   angle={-45}
                   textAnchor="end"
                   height={80}
                   stroke="#ffffff60"
                 />
                 <YAxis 
                   tick={{ fontSize: 12, fill: '#ffffff' }}
                   stroke="#ffffff60"
                 />
                 <Tooltip 
                   formatter={(value, name) => [
                     `${value} (${discoveryData.find(d => d.count === value)?.percentage.toFixed(1)}%)`,
                     name
                   ]}
                   contentStyle={{
                     backgroundColor: '#000000',
                     border: '2px solid #ffffff',
                     borderRadius: '8px',
                     color: '#ffffff',
                     boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                   }}
                   labelStyle={{ color: '#ffffff' }}
                 />
                 <Bar dataKey="count" fill="#8884d8" />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Vintage vs Modern */}
      <Card className="w-full xl:col-span-2 bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Vintage vs Modern</CardTitle>
          <p className="text-sm text-gray-400">
            Verteilung nach Release-Zeiträumen
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64">
                               <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={vintageData}
                       cx="50%"
                       cy="50%"
                       labelLine={false}
                       label={false}
                       outerRadius={80}
                       fill="#8884d8"
                       dataKey="count"
                     >
                       {vintageData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip 
                       formatter={(value, name, props) => [
                         `${value} Tracks (${props.payload.percentage.toFixed(1)}%)`,
                         props.payload.period
                       ]}
                       contentStyle={{
                         backgroundColor: '#000000',
                         border: '2px solid #ffffff',
                         borderRadius: '8px',
                         color: '#ffffff',
                         boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                       }}
                       labelStyle={{ color: '#ffffff' }}
                     />
                   </PieChart>
                 </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {vintageData.map((item, index) => (
                <div key={item.period} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                                       <span className="text-sm font-medium text-white">{item.period}</span>
                 </div>
                 <div className="text-right">
                   <span className="text-sm font-bold text-white">{item.count} Tracks</span>
                   <p className="text-xs text-gray-400">{item.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
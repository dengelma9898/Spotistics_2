'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Music, Users, Calendar, TrendingUp, Clock, Star } from 'lucide-react'

interface LibraryOverviewProps {
  stats: {
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
  tracks: any[]
  albums: any[]
  playlists: any[]
}

export function LibraryOverview({ stats, tracks, albums, playlists }: LibraryOverviewProps) {
  // Berechne Top Artists basierend auf Track-Anzahl
  const artistCounts = new Map()
  tracks.forEach(savedTrack => {
    savedTrack.track.artists.forEach((artist: any) => {
      artistCounts.set(artist.id, {
        name: artist.name,
        count: (artistCounts.get(artist.id)?.count || 0) + 1,
        image: artist.images?.[0]?.url || '/placeholder-artist.png'
      })
    })
  })
  
  const topArtists = Array.from(artistCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Berechne Top Alben basierend auf Track-Anzahl
  const albumCounts = new Map()
  tracks.forEach(savedTrack => {
    const album = savedTrack.track.album
    albumCounts.set(album.id, {
      name: album.name,
      artist: album.artists[0]?.name || 'Unknown',
      count: (albumCounts.get(album.id)?.count || 0) + 1,
      image: album.images?.[0]?.url || '/placeholder-album.png'
    })
  })
  
  const topAlbums = Array.from(albumCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Berechne Aktivitäts-Trends
  const now = new Date()
  const thisMonth = tracks.filter(t => {
    const addedDate = new Date(t.added_at)
    return addedDate.getMonth() === now.getMonth() && addedDate.getFullYear() === now.getFullYear()
  }).length

  const lastMonth = tracks.filter(t => {
    const addedDate = new Date(t.added_at)
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return addedDate.getMonth() === lastMonthDate.getMonth() && addedDate.getFullYear() === lastMonthDate.getFullYear()
  }).length

  const activityTrend = thisMonth - lastMonth
  const activityTrendPercent = lastMonth > 0 ? Math.round((activityTrend / lastMonth) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Library Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Library Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Gesamtscore */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Gesamtscore</span>
                <span className="text-2xl font-bold text-green-400">
                  {Math.round(85 - (stats.duplicatesCount / stats.totalTracks) * 100)}%
                </span>
              </div>
              <Progress 
                value={85 - (stats.duplicatesCount / stats.totalTracks) * 100} 
                className="h-2"
              />
            </div>

            {/* Einzelne Metriken */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Duplikate</span>
                <span className={stats.duplicatesCount === 0 ? 'text-green-400' : 'text-yellow-400'}>
                  {stats.duplicatesCount === 0 ? 'Keine' : `${stats.duplicatesCount} gefunden`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Aktivität</span>
                <span className={activityTrend >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {activityTrend >= 0 ? '+' : ''}{activityTrendPercent}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Vielfalt</span>
                <span className="text-green-400">
                  {Math.round((stats.uniqueArtists / stats.totalTracks) * 100)}% einzigartig
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Popularität</span>
                <span className="text-blue-400">
                  ⌀ {stats.avgPopularity}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Aktivitäts-Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Aktivität
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Diesen Monat</span>
              <span className="font-medium">{thisMonth}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Letzten Monat</span>
              <span className="font-medium">{lastMonth}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Trend</span>
              <Badge variant={activityTrend >= 0 ? 'default' : 'destructive'}>
                {activityTrend >= 0 ? '+' : ''}{activityTrend}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Zeitstatistiken */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Zeitspanne
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Gesamtdauer</span>
              <span className="font-medium">{stats.totalDurationHours}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Ø pro Track</span>
              <span className="font-medium">
                {Math.round((stats.totalDurationHours * 60) / stats.totalTracks)}min
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Ø Popularität</span>
              <span className="font-medium">{stats.avgPopularity}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Vielfalt */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Vielfalt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Einzigartige Artists</span>
              <span className="font-medium">{stats.uniqueArtists}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Tracks pro Artist</span>
              <span className="font-medium">
                ⌀ {Math.round(stats.totalTracks / stats.uniqueArtists)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Alben gespeichert</span>
              <span className="font-medium">{stats.totalAlbums}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Artists & Albums */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Artists */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Artists in Library
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topArtists.map((artist, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <img 
                      src={artist.image}
                      alt={artist.name}
                      className="w-10 h-10 rounded-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{artist.name}</p>
                    <p className="text-sm text-gray-400">{artist.count} Tracks</p>
                  </div>
                  <Badge variant="secondary">
                    #{index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Albums */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Top Alben in Library
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topAlbums.map((album, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <img 
                      src={album.image}
                      alt={album.name}
                      className="w-10 h-10 rounded"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{album.name}</p>
                    <p className="text-sm text-gray-400">{album.artist}</p>
                  </div>
                  <Badge variant="secondary">
                    {album.count} Tracks
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
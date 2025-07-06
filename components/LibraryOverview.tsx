'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip } from '@/components/ui/tooltip'
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
  artistsWithImages: Map<string, any>
}

export function LibraryOverview({ stats, tracks, albums, playlists, artistsWithImages }: LibraryOverviewProps) {
  // Berechne Top Artists basierend auf Track-Anzahl
  const artistCounts = new Map()
  tracks.forEach(savedTrack => {
    savedTrack.track.artists.forEach((artist: any) => {
      const existing = artistCounts.get(artist.id)
      const artistWithImage = artistsWithImages.get(artist.id)
      
      artistCounts.set(artist.id, {
        name: artist.name,
        count: (existing?.count || 0) + 1,
        // Nutze das geladene Bild oder Fallback
        image: artistWithImage?.image || '/placeholder-artist.png',
        id: artist.id,
        popularity: artistWithImage?.popularity || 0,
        followers: artistWithImage?.followers || 0,
        genres: artistWithImage?.genres || []
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
          <CardDescription>
            Bewertet die Qualität und Organisation Ihrer Spotify Library basierend auf verschiedenen Faktoren
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Gesamtscore */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Gesamtscore</span>
                  <Tooltip
                    content={
                      <div>
                        <div className="font-semibold mb-1">Health Score Berechnung:</div>
                        <div className="space-y-1">
                          <div>• Basis: 85%</div>
                          <div>• Abzug pro Duplikat: -1%</div>
                          <div>• Bonus für Vielfalt: +5%</div>
                          <div>• Bonus für Aktivität: +10%</div>
                        </div>
                      </div>
                    }
                    position="bottom"
                  >
                    <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white cursor-help hover:bg-gray-500 transition-colors">
                      ?
                    </div>
                  </Tooltip>
                </div>
                <span className="text-2xl font-bold text-green-400">
                  {Math.round(85 - (stats.duplicatesCount / stats.totalTracks) * 100)}%
                </span>
              </div>
              <Progress 
                value={85 - (stats.duplicatesCount / stats.totalTracks) * 100} 
                className="h-2"
              />
              <div className="mt-2 text-xs text-gray-400">
                Ein hoher Score zeigt eine gut organisierte, vielfältige Library ohne Duplikate
              </div>
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
            <CardDescription>
              Zeigt Ihre Aktivität beim Hinzufügen neuer Tracks zur Library
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Diesen Monat</span>
                <Tooltip
                  content={`Tracks hinzugefügt in ${new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`}
                  position="bottom"
                >
                  <div className="w-3 h-3 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white cursor-help hover:bg-gray-500 transition-colors">
                    ?
                  </div>
                </Tooltip>
              </div>
              <span className="font-medium">{thisMonth}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Letzten Monat</span>
                <Tooltip
                  content={`Tracks hinzugefügt in ${new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`}
                  position="bottom"
                >
                  <div className="w-3 h-3 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white cursor-help hover:bg-gray-500 transition-colors">
                    ?
                  </div>
                </Tooltip>
              </div>
              <span className="font-medium">{lastMonth}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Trend</span>
                <Tooltip
                  content="Veränderung gegenüber dem Vormonat"
                  position="bottom"
                >
                  <div className="w-3 h-3 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white cursor-help hover:bg-gray-500 transition-colors">
                    ?
                  </div>
                </Tooltip>
              </div>
              <Badge variant={activityTrend >= 0 ? 'default' : 'destructive'}>
                {activityTrend >= 0 ? '+' : ''}{activityTrend}
              </Badge>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="text-xs text-gray-400">
                📈 Durchschnitt: {Math.round(stats.totalTracks / 12)} Tracks/Monat (letztes Jahr)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zeitstatistiken */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Zeitspanne & Dauer
            </CardTitle>
            <CardDescription>
              Zeigt die Gesamtspielzeit Ihrer Library und durchschnittliche Werte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Gesamtdauer</span>
                <Tooltip
                  content="Gesamte Spielzeit aller gespeicherten Tracks"
                  position="bottom"
                >
                  <div className="w-3 h-3 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white cursor-help hover:bg-gray-500 transition-colors">
                    ?
                  </div>
                </Tooltip>
              </div>
              <span className="font-medium">{stats.totalDurationHours}h</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Ø pro Track</span>
                <Tooltip
                  content="Durchschnittliche Länge pro Track"
                  position="bottom"
                >
                  <div className="w-3 h-3 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white cursor-help hover:bg-gray-500 transition-colors">
                    ?
                  </div>
                </Tooltip>
              </div>
              <span className="font-medium">
                {Math.round((stats.totalDurationHours * 60) / stats.totalTracks)}min
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Ø Popularität</span>
                <Tooltip
                  content="Spotify Popularitäts-Score (0-100). Höher = populärer"
                  position="bottom"
                >
                  <div className="w-3 h-3 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white cursor-help hover:bg-gray-500 transition-colors">
                    ?
                  </div>
                </Tooltip>
              </div>
              <span className="font-medium">{stats.avgPopularity}%</span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="text-xs text-gray-400 space-y-1">
                <div>📅 Zeitraum: {stats.oldestTrack ? new Date(stats.oldestTrack.added_at).toLocaleDateString('de-DE') : 'N/A'} - {stats.newestTrack ? new Date(stats.newestTrack.added_at).toLocaleDateString('de-DE') : 'N/A'}</div>
                <div>🎵 Das entspricht etwa {Math.round(stats.totalDurationHours / 24)} Tagen Musik</div>
              </div>
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
            <CardDescription>
              Misst die Diversität Ihrer Musiksammlung
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Einzigartige Artists</span>
                <Tooltip
                  content="Anzahl verschiedener Artists in Ihrer Library"
                  position="bottom"
                >
                  <div className="w-3 h-3 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white cursor-help hover:bg-gray-500 transition-colors">
                    ?
                  </div>
                </Tooltip>
              </div>
              <span className="font-medium">{stats.uniqueArtists}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Tracks pro Artist</span>
                <Tooltip
                  content="Durchschnittliche Anzahl Tracks pro Artist. Niedriger = vielfältiger"
                  position="bottom"
                >
                  <div className="w-3 h-3 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white cursor-help hover:bg-gray-500 transition-colors">
                    ?
                  </div>
                </Tooltip>
              </div>
              <span className="font-medium">
                ⌀ {Math.round(stats.totalTracks / stats.uniqueArtists)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Vielfalt-Score</span>
                <Tooltip
                  content="Prozent einzigartiger Artists. Höher = vielfältiger"
                  position="bottom"
                >
                  <div className="w-3 h-3 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white cursor-help hover:bg-gray-500 transition-colors">
                    ?
                  </div>
                </Tooltip>
              </div>
              <span className="font-medium text-blue-400">
                {Math.round((stats.uniqueArtists / stats.totalTracks) * 100)}%
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="text-xs text-gray-400">
                🎨 {stats.uniqueArtists > stats.totalTracks * 0.3 ? 'Sehr vielfältige' : stats.uniqueArtists > stats.totalTracks * 0.2 ? 'Vielfältige' : 'Fokussierte'} Musiksammlung
              </div>
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
                    {artist.image !== '/placeholder-artist.png' ? (
                      <img 
                        src={artist.image}
                        alt={artist.name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm ${artist.image !== '/placeholder-artist.png' ? 'hidden' : ''}`}>
                      {artist.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{artist.name}</p>
                    <p className="text-sm text-gray-400">
                      {artist.count} Tracks
                      {artist.followers > 0 && (
                        <span className="ml-2 text-xs">
                          • {(artist.followers / 1000000).toFixed(1)}M Follower
                        </span>
                      )}
                    </p>
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
                      className="w-10 h-10 rounded object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="w-10 h-10 rounded bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm hidden">
                      {album.name.charAt(0).toUpperCase()}
                    </div>
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
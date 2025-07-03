'use client'

import { SpotifyTrack, SpotifyArtist } from '@/types/spotify'
import { Users, Crown, ExternalLink, Disc } from 'lucide-react'

interface ArtistFrequencyChartProps {
  tracks: SpotifyTrack[]
  title?: string
}

interface ArtistData {
  artist: SpotifyArtist
  trackCount: number
  tracks: SpotifyTrack[]
  avgPopularity: number
  totalDuration: number
}

export default function ArtistFrequencyChart({ tracks, title = "Lieblings-Künstler" }: ArtistFrequencyChartProps) {
  // Analysiere Artist-Häufigkeit
  const getArtistData = (): ArtistData[] => {
    const artistMap = new Map<string, ArtistData>()

    tracks.forEach(track => {
      track.artists.forEach(artist => {
        if (artistMap.has(artist.id)) {
          const existing = artistMap.get(artist.id)!
          existing.trackCount++
          existing.tracks.push(track)
          existing.avgPopularity = existing.tracks.reduce((sum, t) => sum + t.popularity, 0) / existing.tracks.length
          existing.totalDuration += track.duration_ms
        } else {
          artistMap.set(artist.id, {
            artist,
            trackCount: 1,
            tracks: [track],
            avgPopularity: track.popularity,
            totalDuration: track.duration_ms
          })
        }
      })
    })

    return Array.from(artistMap.values())
      .sort((a, b) => b.trackCount - a.trackCount)
      .slice(0, 10) // Top 10 Artists
  }

  const artistData = getArtistData()
  const maxCount = artistData[0]?.trackCount || 1

  // Analysiere Artist-Diversität
  const getDiversityMetrics = () => {
    const totalArtists = artistData.length
    const topArtist = artistData[0]
    const topArtistPercentage = topArtist ? (topArtist.trackCount / tracks.length) * 100 : 0
    
    let diversityType = 'Ausgewogen'
    let diversityIcon = '⚖️'
    let diversityColor = 'text-blue-400'
    
    if (topArtistPercentage > 40) {
      diversityType = 'Fokussiert'
      diversityIcon = '🎯'
      diversityColor = 'text-orange-400'
    } else if (totalArtists > 8) {
      diversityType = 'Vielfältig'
      diversityIcon = '🌈'
      diversityColor = 'text-green-400'
    }

    return { diversityType, diversityIcon, diversityColor, totalArtists }
  }

  const diversity = getDiversityMetrics()

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-red-600 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-gray-400 text-sm">Top {artistData.length} von {diversity.totalArtists} Künstlern</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2">
            <span className="text-lg">{diversity.diversityIcon}</span>
            <span className={`text-sm font-medium ${diversity.diversityColor}`}>
              {diversity.diversityType}
            </span>
          </div>
          <p className="text-gray-400 text-xs">Geschmack-Profil</p>
        </div>
      </div>

      {/* Artist Ranking */}
      <div className="space-y-3">
        {artistData.map((data, index) => (
          <div key={data.artist.id} className="group">
            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors">
              {/* Rank & Icon */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                  {index === 0 ? (
                    <Crown className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <span className="text-white text-sm font-semibold">#{index + 1}</span>
                  )}
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-white font-medium truncate">{data.artist.name}</h4>
                    {data.artist.external_urls?.spotify && (
                      <a
                        href={data.artist.external_urls.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                    <span>{data.trackCount} Tracks</span>
                    <span>Ø {data.avgPopularity.toFixed(0)} Pop.</span>
                    <span>{formatDuration(data.totalDuration)}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex-1 max-w-xs">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-700 ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                      index === 2 ? 'bg-gradient-to-r from-orange-600 to-yellow-600' :
                      'bg-gradient-to-r from-purple-500 to-pink-400'
                    }`}
                    style={{ width: `${(data.trackCount / maxCount) * 100}%` }}
                  />
                </div>
              </div>

              {/* Track Count */}
              <div className="text-right min-w-16">
                <span className="text-white font-semibold">{data.trackCount}</span>
                <p className="text-gray-400 text-xs">
                  {((data.trackCount / tracks.length) * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Expanded Track List */}
            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-h-0 group-hover:max-h-96 overflow-hidden">
              <div className="ml-14 mr-20 bg-white/5 rounded-lg p-3 space-y-1">
                <p className="text-gray-400 text-xs mb-2">Beliebteste Tracks:</p>
                {data.tracks
                  .sort((a, b) => b.popularity - a.popularity)
                  .slice(0, 5)
                  .map((track) => (
                    <div key={track.id} className="flex items-center justify-between text-xs">
                      <span className="text-white truncate flex-1 mr-2">
                        {track.name}
                      </span>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Disc className="w-3 h-3" />
                        <span>{track.popularity}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="pt-4 border-t border-white/10">
        <h4 className="text-white font-medium mb-3">Artist-Analyse</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-gray-400">Top Artist</span>
            <p className="text-white font-semibold">
              {artistData[0]?.artist.name || 'N/A'}
            </p>
            <p className="text-gray-400 text-xs">
              {artistData[0] ? `${artistData[0].trackCount} Tracks` : ''}
            </p>
          </div>
          
          <div className="space-y-1">
            <span className="text-gray-400">Diversität</span>
            <div className="flex items-center gap-2">
              <span className="text-lg">{diversity.diversityIcon}</span>
              <span className="text-white font-semibold">{diversity.diversityType}</span>
            </div>
            <p className="text-gray-400 text-xs">{diversity.totalArtists} verschiedene Artists</p>
          </div>
          
          <div className="space-y-1">
            <span className="text-gray-400">Durchschnitt</span>
            <p className="text-white font-semibold">
              {artistData.length > 0 
                ? (tracks.length / diversity.totalArtists).toFixed(1)
                : '0'} Tracks/Artist
            </p>
          </div>
        </div>

        {/* Diversity Description */}
        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <p className="text-gray-300 text-sm">
            {diversity.diversityType === 'Fokussiert' && 
              "🎯 Du hast klare Lieblingskünstler! Deine Treue zu bestimmten Artists ist beeindruckend."
            }
            {diversity.diversityType === 'Vielfältig' && 
              "🌈 Wow! Du entdeckst gerne neue Artists und hast einen sehr vielfältigen Geschmack."
            }
            {diversity.diversityType === 'Ausgewogen' && 
              "⚖️ Perfekte Balance zwischen treuen Favoriten und musikalischer Entdeckungsfreude!"
            }
          </p>
        </div>
      </div>
    </div>
  )
} 
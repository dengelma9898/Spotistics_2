'use client'

import { useState, useEffect } from 'react'
import { SpotifyArtist, SpotifyTrack } from '@/types/spotify'
import { Heart, Users, Crown, TrendingUp, ExternalLink, Disc } from 'lucide-react'
import { getSpotifyApi } from '@/lib/spotify'

interface FollowedArtistsInsightsProps {
  topArtists: SpotifyArtist[]
  topTracks: SpotifyTrack[]
  title?: string
}

interface ArtistInsight {
  followedCount: number
  topArtistsInFollowed: number
  loyaltyScore: number
  discoveryType: string
  discoveryIcon: string
  discoveryColor: string
  genreSpread: { [key: string]: number }
  popularitySpread: {
    mainstream: number
    emerging: number
    underground: number
  }
  insights: string[]
}

export default function FollowedArtistsInsights({ 
  topArtists, 
  topTracks, 
  title = "Followed Artists Insights" 
}: FollowedArtistsInsightsProps) {
  const [followedArtists, setFollowedArtists] = useState<SpotifyArtist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFollowedArtists()
  }, [])

  const loadFollowedArtists = async () => {
    try {
      setLoading(true)
      const spotifyApi = await getSpotifyApi()
      if (!spotifyApi) throw new Error('Spotify API nicht verfügbar')

      const response = await spotifyApi.getFollowedArtists()
      setFollowedArtists(response.artists.items)
    } catch (err: any) {
      console.error('Fehler beim Laden der gefolgten Artists:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const analyzeFollowedArtists = (): ArtistInsight => {
    if (followedArtists.length === 0) {
      return {
        followedCount: 0,
        topArtistsInFollowed: 0,
        loyaltyScore: 0,
        discoveryType: 'Unbekannt',
        discoveryIcon: '❓',
        discoveryColor: 'text-gray-400',
        genreSpread: {},
        popularitySpread: { mainstream: 0, emerging: 0, underground: 0 },
        insights: ['Keine gefolgten Artists gefunden']
      }
    }

    // Analysiere Überschneidung mit Top Artists
    const topArtistIds = new Set(topArtists.map(a => a.id))
    const topArtistsInFollowed = followedArtists.filter(a => topArtistIds.has(a.id)).length
    
    // Loyalitäts-Score berechnen (0-100)
    const loyaltyScore = Math.round((topArtistsInFollowed / Math.min(topArtists.length, followedArtists.length)) * 100)
    
    // Genre-Verteilung analysieren
    const genreSpread: { [key: string]: number } = {}
    followedArtists.forEach(artist => {
      artist.genres.forEach(genre => {
        genreSpread[genre] = (genreSpread[genre] || 0) + 1
      })
    })
    
    // Popularitäts-Verteilung
    const popularities = followedArtists.map(a => a.popularity)
    const mainstream = followedArtists.filter(a => a.popularity >= 70).length
    const emerging = followedArtists.filter(a => a.popularity >= 40 && a.popularity < 70).length
    const underground = followedArtists.filter(a => a.popularity < 40).length
    
    const popularitySpread = {
      mainstream: Math.round((mainstream / followedArtists.length) * 100),
      emerging: Math.round((emerging / followedArtists.length) * 100),
      underground: Math.round((underground / followedArtists.length) * 100)
    }
    
    // Discovery-Typ bestimmen
    let discoveryType: string
    let discoveryIcon: string
    let discoveryColor: string
    
    if (loyaltyScore >= 80) {
      discoveryType = 'Treuer Fan'
      discoveryIcon = '❤️'
      discoveryColor = 'text-red-400'
    } else if (loyaltyScore >= 60) {
      discoveryType = 'Aktiver Entdecker'
      discoveryIcon = '🔍'
      discoveryColor = 'text-blue-400'
    } else if (loyaltyScore >= 30) {
      discoveryType = 'Genre Explorer'
      discoveryIcon = '🌍'
      discoveryColor = 'text-green-400'
    } else {
      discoveryType = 'Trend Hunter'
      discoveryIcon = '🎯'
      discoveryColor = 'text-purple-400'
    }
    
    // Insights generieren
    const insights: string[] = []
    
    if (followedArtists.length > 100) {
      insights.push(`Du folgst ${followedArtists.length} Artists - ein echter Musik-Enthusiast!`)
    } else if (followedArtists.length < 20) {
      insights.push(`Du folgst nur ${followedArtists.length} Artists - sehr selektiver Geschmack!`)
    }
    
    if (loyaltyScore >= 70) {
      insights.push(`${loyaltyScore}% deiner Top Artists folgst du bereits - hohe Loyalität!`)
    } else if (loyaltyScore <= 30) {
      insights.push('Du entdeckst viel neue Musik außerhalb deiner Follows!')
    }
    
    if (underground > followedArtists.length * 0.5) {
      insights.push('Du unterstützt viele Underground-Artists!')
    }
    
    const topGenres = Object.entries(genreSpread)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      
    if (topGenres.length > 0) {
      insights.push(`Deine Top-Genres: ${topGenres.map(([genre]) => genre).join(', ')}`)
    }
    
    return {
      followedCount: followedArtists.length,
      topArtistsInFollowed,
      loyaltyScore,
      discoveryType,
      discoveryIcon,
      discoveryColor,
      genreSpread,
      popularitySpread,
      insights
    }
  }

  const insight = analyzeFollowedArtists()
  const topGenres = Object.entries(insight.genreSpread)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white/70">Lade gefolgte Artists...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="text-center py-8">
          <Heart className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-300 mb-2">Fehler beim Laden der gefolgten Artists</p>
          <p className="text-white/70 text-sm">{error}</p>
          <button 
            onClick={loadFollowedArtists}
            className="mt-4 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-sm transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-white/70 text-sm">Analyse deiner gefolgten Künstler</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{insight.discoveryIcon}</span>
            <span className={`text-sm font-medium ${insight.discoveryColor}`}>
              {insight.discoveryType}
            </span>
          </div>
          <p className="text-white/70 text-xs">{insight.followedCount} Artists</p>
        </div>
      </div>

      {/* Loyalitäts-Score */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-white/80 text-sm">Loyalitäts-Score</span>
          <span className="text-white font-medium">{insight.loyaltyScore}%</span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div 
            className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700"
            style={{ width: `${insight.loyaltyScore}%` }}
          />
        </div>
        
        <p className="text-white/70 text-sm">
          {insight.topArtistsInFollowed} von {topArtists.length} deiner Top Artists folgst du bereits
        </p>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="text-2xl mb-2">📻</div>
          <p className="text-white font-medium">{insight.popularitySpread.mainstream}%</p>
          <p className="text-white/70 text-xs">Mainstream</p>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="text-2xl mb-2">🚀</div>
          <p className="text-white font-medium">{insight.popularitySpread.emerging}%</p>
          <p className="text-white/70 text-xs">Aufstrebend</p>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="text-2xl mb-2">🎭</div>
          <p className="text-white font-medium">{insight.popularitySpread.underground}%</p>
          <p className="text-white/70 text-xs">Underground</p>
        </div>
      </div>

      {/* Top Genres */}
      {topGenres.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-white font-medium">Top Genres deiner Follows</h4>
          
          <div className="space-y-2">
            {topGenres.map(([genre, count], index) => (
              <div key={genre} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-yellow-400' :
                    index === 1 ? 'bg-blue-400' :
                    index === 2 ? 'bg-green-400' :
                    index === 3 ? 'bg-purple-400' : 'bg-pink-400'
                  }`}></div>
                  <span className="text-white/80 text-sm capitalize">{genre}</span>
                </div>
                <span className="text-white text-sm">{count} Artists</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Followed Artists Preview */}
      {followedArtists.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-white font-medium">Neueste Follows</h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {followedArtists.slice(0, 8).map((artist) => (
              <div key={artist.id} className="group">
                <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all">
                  {artist.images[0] ? (
                    <img 
                      src={artist.images[0].url} 
                      alt={artist.name}
                      className="w-full aspect-square object-cover rounded-lg mb-2"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-gray-600 rounded-lg flex items-center justify-center mb-2">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <p className="text-white text-xs font-medium truncate">{artist.name}</p>
                  <p className="text-white/60 text-xs">{artist.popularity} Pop.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {insight.insights.length > 0 && (
        <div className="pt-4 border-t border-white/10">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            Deine Artist-Insights
          </h4>
          
          <div className="space-y-2">
            {insight.insights.map((insightText, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-white/80 text-sm">{insightText}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="bg-white/5 rounded-lg p-4">
        <h5 className="text-white font-medium mb-2 flex items-center gap-2">
          <span className="text-lg">💡</span>
          Tipp
        </h5>
        <p className="text-white/70 text-sm">
          {insight.loyaltyScore > 70 
            ? "Du folgst bereits vielen deiner Lieblings-Artists! Entdecke ähnliche Künstler über deren Profile."
            : "Folge mehr deiner Top Artists, um ihre neuesten Releases und Updates nicht zu verpassen!"
          }
        </p>
      </div>
    </div>
  )
} 
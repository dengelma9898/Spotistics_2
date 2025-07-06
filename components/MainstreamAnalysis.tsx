'use client'

import { SpotifyTrack, SpotifyArtist } from '@/types/spotify'
import { TrendingUp, TrendingDown, Target, Users, Crown, Zap } from 'lucide-react'

interface MainstreamAnalysisProps {
  tracks: SpotifyTrack[]
  artists: SpotifyArtist[]
  title?: string
}

interface MusicTasteAnalysis {
  overallScore: number
  category: string
  icon: string
  color: string
  description: string
  trackAnalysis: {
    mainstream: number
    underground: number
    balanced: number
  }
  artistAnalysis: {
    mainstream: number
    underground: number
    balanced: number
  }
  insights: string[]
}

export default function MainstreamAnalysis({ tracks, artists, title = "Mainstream vs. Underground" }: MainstreamAnalysisProps) {
  
  const analyzeMainstreamScore = (): MusicTasteAnalysis => {
    // Tracks Analyse
    const trackPopularities = tracks.map(t => t.popularity)
    const avgTrackPopularity = trackPopularities.reduce((sum, pop) => sum + pop, 0) / tracks.length
    
    const mainstreamTracks = tracks.filter(t => t.popularity >= 70).length
    const undergroundTracks = tracks.filter(t => t.popularity <= 40).length
    const balancedTracks = tracks.length - mainstreamTracks - undergroundTracks
    
    // Artists Analyse
    const artistPopularities = artists.map(a => a.popularity || 0)
    const avgArtistPopularity = artistPopularities.reduce((sum, pop) => sum + pop, 0) / artists.length
    
    const mainstreamArtists = artists.filter(a => (a.popularity || 0) >= 70).length
    const undergroundArtists = artists.filter(a => (a.popularity || 0) <= 40).length
    const balancedArtists = artists.length - mainstreamArtists - undergroundArtists
    
    // Gesamtscore berechnen (0-100)
    const overallScore = Math.round((avgTrackPopularity + avgArtistPopularity) / 2)
    
    // Kategorie bestimmen
    let category: string
    let icon: string
    let color: string
    let description: string
    
    if (overallScore >= 75) {
      category = 'Mainstream Enthusiast'
      icon = '📻'
      color = 'text-red-400'
      description = 'Du liebst die großen Hits und folgst den aktuellen Trends!'
    } else if (overallScore >= 55) {
      category = 'Ausgewogener Hörer'
      icon = '⚖️'
      color = 'text-blue-400'
      description = 'Du balancierst perfekt zwischen populären Hits und versteckten Perlen!'
    } else if (overallScore >= 35) {
      category = 'Alternative Explorer'
      icon = '🔍'
      color = 'text-purple-400'
      description = 'Du entdeckst gerne weniger bekannte Künstler und Tracks!'
    } else {
      category = 'Underground Purist'
      icon = '🎭'
      color = 'text-green-400'
      description = 'Du bist ein echter Kenner abseits des Mainstreams!'
    }
    
    // Insights generieren
    const insights: string[] = []
    
    if (mainstreamTracks > tracks.length * 0.6) {
      insights.push(`${Math.round((mainstreamTracks / tracks.length) * 100)}% deiner Tracks sind Mainstream-Hits`)
    }
    
    if (undergroundTracks > tracks.length * 0.4) {
      insights.push(`Du hast einen Faible für Underground-Musik (${Math.round((undergroundTracks / tracks.length) * 100)}% deiner Tracks)`)
    }
    
    if (Math.abs(avgTrackPopularity - avgArtistPopularity) > 15) {
      if (avgTrackPopularity > avgArtistPopularity) {
        insights.push('Du hörst populäre Songs von weniger bekannten Künstlern')
      } else {
        insights.push('Du entdeckst versteckte Perlen von bekannten Künstlern')
      }
    }
    
    const popularityRange = Math.max(...trackPopularities) - Math.min(...trackPopularities)
    if (popularityRange > 70) {
      insights.push('Dein Musikgeschmack ist sehr vielfältig - von Underground bis Mainstream!')
    }
    
    return {
      overallScore,
      category,
      icon,
      color,
      description,
      trackAnalysis: {
        mainstream: Math.round((mainstreamTracks / tracks.length) * 100),
        underground: Math.round((undergroundTracks / tracks.length) * 100),
        balanced: Math.round((balancedTracks / tracks.length) * 100)
      },
      artistAnalysis: {
        mainstream: Math.round((mainstreamArtists / artists.length) * 100),
        underground: Math.round((undergroundArtists / artists.length) * 100),
        balanced: Math.round((balancedArtists / artists.length) * 100)
      },
      insights
    }
  }

  const analysis = analyzeMainstreamScore()

  const getScoreIcon = (score: number) => {
    if (score >= 75) return <TrendingUp className="w-4 h-4 text-red-400" />
    if (score >= 55) return <Target className="w-4 h-4 text-blue-400" />
    if (score >= 35) return <Zap className="w-4 h-4 text-purple-400" />
    return <TrendingDown className="w-4 h-4 text-green-400" />
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-violet-600 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-white/70 text-sm">Wie mainstream ist dein Musikgeschmack?</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{analysis.icon}</span>
            <span className={`text-sm font-medium ${analysis.color}`}>
              {analysis.category}
            </span>
          </div>
          <p className="text-white/70 text-xs">Score: {analysis.overallScore}/100</p>
        </div>
      </div>

      {/* Score Visualisierung */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/80">Underground</span>
          <span className="text-white/80">Mainstream</span>
        </div>
        
        <div className="relative">
          <div className="w-full h-4 bg-gradient-to-r from-green-500 via-blue-500 via-purple-500 to-red-500 rounded-full"></div>
          <div 
            className="absolute top-0 w-4 h-4 bg-white rounded-full border-2 border-gray-800 transform -translate-x-2"
            style={{ left: `${analysis.overallScore}%` }}
          >
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
              <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {analysis.overallScore}
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <p className={`text-sm font-medium ${analysis.color}`}>
            {analysis.description}
          </p>
        </div>
      </div>

      {/* Detaillierte Analyse */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Track Analyse */}
        <div className="space-y-4">
          <h4 className="text-white font-medium">Track-Verteilung</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <span className="text-white/80 text-sm">Mainstream (70+)</span>
              </div>
              <span className="text-white text-sm font-medium">{analysis.trackAnalysis.mainstream}%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-white/80 text-sm">Ausgewogen (40-70)</span>
              </div>
              <span className="text-white text-sm font-medium">{analysis.trackAnalysis.balanced}%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-white/80 text-sm">Underground (0-40)</span>
              </div>
              <span className="text-white text-sm font-medium">{analysis.trackAnalysis.underground}%</span>
            </div>
          </div>
        </div>

        {/* Artist Analyse */}
        <div className="space-y-4">
          <h4 className="text-white font-medium">Artist-Verteilung</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <span className="text-white/80 text-sm">Mainstream (70+)</span>
              </div>
              <span className="text-white text-sm font-medium">{analysis.artistAnalysis.mainstream}%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-white/80 text-sm">Ausgewogen (40-70)</span>
              </div>
              <span className="text-white text-sm font-medium">{analysis.artistAnalysis.balanced}%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-white/80 text-sm">Underground (0-40)</span>
              </div>
              <span className="text-white text-sm font-medium">{analysis.artistAnalysis.underground}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      {analysis.insights.length > 0 && (
        <div className="pt-4 border-t border-white/10">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            Persönliche Insights
          </h4>
          
          <div className="space-y-2">
            {analysis.insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-white/80 text-sm">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fun Facts */}
      <div className="bg-white/5 rounded-lg p-4">
        <h5 className="text-white font-medium mb-2 flex items-center gap-2">
          <span className="text-lg">💡</span>
          Wusstest du?
        </h5>
        <p className="text-white/70 text-sm">
          {analysis.overallScore >= 70 
            ? "Mainstream-Musik wird oft von großen Plattenlabels promoted und erreicht breite Zielgruppen durch Radio und Streaming-Playlists."
            : analysis.overallScore >= 40
            ? "Ein ausgewogener Musikgeschmack zeigt oft eine hohe musikalische Intelligenz und Offenheit für neue Genres."
            : "Underground-Musik entsteht oft in lokalen Szenen und wird durch Mundpropaganda und kleine Indie-Labels verbreitet."
          }
        </p>
      </div>
    </div>
  )
} 
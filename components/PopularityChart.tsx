'use client'

import { SpotifyTrack } from '@/types/spotify'
import { BarChart, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface PopularityChartProps {
  tracks: SpotifyTrack[]
  title?: string
}

interface PopularityData {
  range: string
  count: number
  percentage: number
  tracks: SpotifyTrack[]
}

export default function PopularityChart({ tracks, title = "Popularitäts-Verteilung" }: PopularityChartProps) {
  // Gruppiere Tracks nach Popularitätsbereichen
  const getPopularityData = (): PopularityData[] => {
    const ranges = [
      { range: '80-100 (Mainstream)', min: 80, max: 100 },
      { range: '60-79 (Bekannt)', min: 60, max: 79 },
      { range: '40-59 (Moderat)', min: 40, max: 59 },
      { range: '20-39 (Nische)', min: 20, max: 39 },
      { range: '0-19 (Underground)', min: 0, max: 19 }
    ]

    return ranges.map(({ range, min, max }) => {
      const tracksInRange = tracks.filter(track => 
        track.popularity >= min && track.popularity <= max
      )
      
      return {
        range,
        count: tracksInRange.length,
        percentage: tracks.length > 0 ? (tracksInRange.length / tracks.length) * 100 : 0,
        tracks: tracksInRange
      }
    })
  }

  const popularityData = getPopularityData()
  const avgPopularity = tracks.length > 0 
    ? tracks.reduce((sum, track) => sum + track.popularity, 0) / tracks.length 
    : 0

  // Bestimme Musik-Geschmack Typ
  const getMusicTasteType = () => {
    const mainstream = popularityData[0].percentage // 80-100
    const underground = popularityData[4].percentage // 0-19
    
    if (mainstream > 50) return { type: 'Mainstream', icon: TrendingUp, color: 'text-green-400' }
    if (underground > 30) return { type: 'Underground', icon: TrendingDown, color: 'text-purple-400' }
    return { type: 'Ausgewogen', icon: Minus, color: 'text-blue-400' }
  }

  const tasteType = getMusicTasteType()
  const TasteIcon = tasteType.icon

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
            <BarChart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-gray-400 text-sm">{tracks.length} Tracks analysiert</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2">
            <TasteIcon className={`w-4 h-4 ${tasteType.color}`} />
            <span className={`text-sm font-medium ${tasteType.color}`}>
              {tasteType.type}
            </span>
          </div>
          <p className="text-gray-400 text-xs">Ø {avgPopularity.toFixed(1)} Popularität</p>
        </div>
      </div>

      {/* Popularity Bars */}
      <div className="space-y-4">
        {popularityData.map((data, index) => (
          <div key={data.range} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">{data.range}</span>
              <span className="text-gray-400">
                {data.count} Tracks ({data.percentage.toFixed(1)}%)
              </span>
            </div>
            
            <div className="relative">
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-700 ${
                    index === 0 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                    index === 1 ? 'bg-gradient-to-r from-blue-500 to-cyan-400' :
                    index === 2 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                    index === 3 ? 'bg-gradient-to-r from-purple-500 to-pink-400' :
                    'bg-gradient-to-r from-red-500 to-rose-400'
                  }`}
                  style={{ width: `${data.percentage}%` }}
                />
              </div>
              
              {data.count > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-xs font-medium mix-blend-difference">
                    {data.count}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="pt-4 border-t border-white/10">
        <h4 className="text-white font-medium mb-3">Musik-Geschmack Analyse</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-gray-400">Durchschnittliche Popularität</span>
            <p className="text-white font-semibold">{avgPopularity.toFixed(1)}/100</p>
          </div>
          
          <div className="space-y-1">
            <span className="text-gray-400">Beliebtester Track</span>
            <p className="text-white font-semibold">
              {tracks.length > 0 
                ? Math.max(...tracks.map(t => t.popularity)) 
                : 0}/100
            </p>
          </div>
          
          <div className="space-y-1">
            <span className="text-gray-400">Musik-Typ</span>
            <div className="flex items-center gap-2">
              <TasteIcon className={`w-4 h-4 ${tasteType.color}`} />
              <span className="text-white font-semibold">{tasteType.type}</span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <p className="text-gray-300 text-sm">
            {tasteType.type === 'Mainstream' && 
              "🎵 Du hörst viel populäre Musik! Entdecke auch weniger bekannte Künstler für mehr Vielfalt."
            }
            {tasteType.type === 'Underground' && 
              "🎧 Du hast einen ausgeprägten Geschmack für Nischenmusik! Deine Entdeckungen könnten andere inspirieren."
            }
            {tasteType.type === 'Ausgewogen' && 
              "⚖️ Perfekte Balance zwischen populären Hits und versteckten Perlen! Dein Musikgeschmack ist vielseitig."
            }
          </p>
        </div>
      </div>
    </div>
  )
} 
'use client'

import { SpotifyTrack } from '@/types/spotify'
import { Calendar, Clock, Music2 } from 'lucide-react'

interface ReleaseDateTimelineProps {
  tracks: SpotifyTrack[]
  title?: string
}

interface DecadeData {
  decade: string
  period: string
  count: number
  percentage: number
  tracks: SpotifyTrack[]
  avgPopularity: number
}

export default function ReleaseDateTimeline({ tracks, title = "Musik-Zeitreise" }: ReleaseDateTimelineProps) {
  // Gruppiere Tracks nach Jahrzehnten
  const getDecadeData = (): DecadeData[] => {
    const currentYear = new Date().getFullYear()
    const decades = [
      { decade: '2020s', period: '2020-heute', start: 2020, end: currentYear },
      { decade: '2010s', period: '2010-2019', start: 2010, end: 2019 },
      { decade: '2000s', period: '2000-2009', start: 2000, end: 2009 },
      { decade: '90s', period: '1990-1999', start: 1990, end: 1999 },
      { decade: '80s', period: '1980-1989', start: 1980, end: 1989 },
      { decade: 'Älter', period: 'Vor 1980', start: 0, end: 1979 }
    ]

    return decades.map(({ decade, period, start, end }) => {
      const tracksInDecade = tracks.filter(track => {
        const year = new Date(track.album.release_date).getFullYear()
        return year >= start && year <= end
      })
      
      const avgPopularity = tracksInDecade.length > 0
        ? tracksInDecade.reduce((sum, track) => sum + track.popularity, 0) / tracksInDecade.length
        : 0

      return {
        decade,
        period,
        count: tracksInDecade.length,
        percentage: tracks.length > 0 ? (tracksInDecade.length / tracks.length) * 100 : 0,
        tracks: tracksInDecade,
        avgPopularity
      }
    }).filter(data => data.count > 0) // Nur Dekaden mit Tracks anzeigen
  }

  const decadeData = getDecadeData()
  
  // Finde das dominante Jahrzehnt
  const dominantDecade = decadeData.reduce((prev, current) => 
    current.count > prev.count ? current : prev, 
    decadeData[0] || { decade: 'Keine', count: 0 }
  )

  // Analysiere Musik-Zeitgeist
  const getMusicEra = () => {
    const modern = decadeData.find(d => d.decade === '2020s')?.percentage || 0
    const recent = decadeData.find(d => d.decade === '2010s')?.percentage || 0
    const vintage = decadeData.filter(d => ['90s', '80s', 'Älter'].includes(d.decade))
      .reduce((sum, d) => sum + d.percentage, 0)

    if (modern + recent > 70) return { type: 'Modern', icon: '🚀', color: 'text-cyan-400' }
    if (vintage > 40) return { type: 'Vintage-Liebhaber', icon: '🎶', color: 'text-amber-400' }
    return { type: 'Zeitlos', icon: '⏰', color: 'text-purple-400' }
  }

  const musicEra = getMusicEra()

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-gray-400 text-sm">{tracks.length} Tracks über {decadeData.length} Epochen</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2">
            <span className="text-lg">{musicEra.icon}</span>
            <span className={`text-sm font-medium ${musicEra.color}`}>
              {musicEra.type}
            </span>
          </div>
          <p className="text-gray-400 text-xs">Favorit: {dominantDecade.decade}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {decadeData.map((data, index) => (
          <div key={data.decade} className="group">
            <div className="flex items-center justify-between text-sm mb-2">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{data.decade}</span>
                <span className="text-gray-400">({data.period})</span>
              </div>
              <span className="text-gray-400">
                {data.count} Tracks ({data.percentage.toFixed(1)}%)
              </span>
            </div>
            
            <div className="relative">
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full transition-all duration-700 ${
                    index === 0 ? 'bg-gradient-to-r from-cyan-500 to-blue-400' :
                    index === 1 ? 'bg-gradient-to-r from-blue-500 to-indigo-400' :
                    index === 2 ? 'bg-gradient-to-r from-purple-500 to-pink-400' :
                    index === 3 ? 'bg-gradient-to-r from-pink-500 to-rose-400' :
                    index === 4 ? 'bg-gradient-to-r from-orange-500 to-yellow-400' :
                    'bg-gradient-to-r from-gray-500 to-gray-400'
                  }`}
                  style={{ width: `${data.percentage}%` }}
                />
              </div>
              
              <div className="absolute inset-0 flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <span className="text-white text-xs font-medium mix-blend-difference">
                    {data.count} Tracks
                  </span>
                </div>
                <span className="text-white text-xs mix-blend-difference">
                  Ø {data.avgPopularity.toFixed(0)} Pop.
                </span>
              </div>
            </div>

            {/* Hover Details */}
            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white/5 rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Beliebteste Tracks:</span>
                  <span className="text-gray-400">Popularität</span>
                </div>
                {data.tracks
                  .sort((a, b) => b.popularity - a.popularity)
                  .slice(0, 3)
                  .map((track) => (
                    <div key={track.id} className="flex items-center justify-between text-xs">
                      <span className="text-white truncate flex-1 mr-2">
                        {track.name} - {track.artists[0].name}
                      </span>
                      <span className="text-gray-300">{track.popularity}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="pt-4 border-t border-white/10">
        <h4 className="text-white font-medium mb-3">Zeitgeist-Analyse</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-gray-400">Dominante Epoche</span>
            <p className="text-white font-semibold">
              {dominantDecade.decade} ({dominantDecade.count} Tracks)
            </p>
          </div>
          
          <div className="space-y-1">
            <span className="text-gray-400">Ältester Track</span>
            <p className="text-white font-semibold">
              {tracks.length > 0 
                ? Math.min(...tracks.map(t => new Date(t.album.release_date).getFullYear()))
                : 'N/A'}
            </p>
          </div>
          
          <div className="space-y-1">
            <span className="text-gray-400">Musik-Stil</span>
            <div className="flex items-center gap-2">
              <span className="text-lg">{musicEra.icon}</span>
              <span className="text-white font-semibold">{musicEra.type}</span>
            </div>
          </div>
        </div>

        {/* Era Description */}
        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <p className="text-gray-300 text-sm">
            {musicEra.type === 'Modern' && 
              "🚀 Du bist immer auf dem neuesten Stand! Deine Playlist spiegelt die aktuellen Musiktrends wider."
            }
            {musicEra.type === 'Vintage-Liebhaber' && 
              "🎶 Du schätzt die goldenen Zeiten der Musik! Dein Geschmack ist geprägt von zeitlosen Klassikern."
            }
            {musicEra.type === 'Zeitlos' && 
              "⏰ Du vereinst das Beste aus allen Epochen! Deine Musiksammlung ist eine perfekte Zeitreise."
            }
          </p>
        </div>
      </div>
    </div>
  )
} 
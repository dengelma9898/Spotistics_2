'use client'

import { useState, useEffect } from 'react'
import { Clock, Calendar, TrendingUp, Activity } from 'lucide-react'
import { getSpotifyApi } from '@/lib/spotify'
import { RecentlyPlayedResponse } from '@/types/spotify'

interface ListeningPatternsProps {
  title?: string
}

interface TimePatterns {
  hourlyDistribution: { [hour: number]: number }
  weekdayDistribution: { [day: number]: number }
  peakHour: number
  peakDay: number
  totalTracks: number
  listeningType: string
  listeningIcon: string
  listeningColor: string
  insights: string[]
}

export default function ListeningPatterns({ title = "Hörgewohnheiten" }: ListeningPatternsProps) {
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRecentlyPlayed()
  }, [])

  const loadRecentlyPlayed = async () => {
    try {
      setLoading(true)
      const spotifyApi = await getSpotifyApi()
      if (!spotifyApi) throw new Error('Spotify API nicht verfügbar')

      const response = await spotifyApi.player.getRecentlyPlayedTracks(50)
      setRecentlyPlayed(response)
    } catch (err: any) {
      console.error('Fehler beim Laden der kürzlich gespielten Tracks:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const analyzeListeningPatterns = (): TimePatterns => {
    if (!recentlyPlayed || !recentlyPlayed.items.length) {
      return {
        hourlyDistribution: {},
        weekdayDistribution: {},
        peakHour: 0,
        peakDay: 0,
        totalTracks: 0,
        listeningType: 'Unbekannt',
        listeningIcon: '❓',
        listeningColor: 'text-gray-400',
        insights: ['Keine kürzlich gespielten Tracks gefunden']
      }
    }

    const hourlyDistribution: { [hour: number]: number } = {}
    const weekdayDistribution: { [day: number]: number } = {}

    // Initialisiere alle Stunden und Wochentage mit 0
    for (let i = 0; i < 24; i++) hourlyDistribution[i] = 0
    for (let i = 0; i < 7; i++) weekdayDistribution[i] = 0

    recentlyPlayed.items.forEach(item => {
      const playedAt = new Date(item.played_at)
      const hour = playedAt.getHours()
      const day = playedAt.getDay() // 0 = Sonntag, 1 = Montag, etc.

      hourlyDistribution[hour]++
      weekdayDistribution[day]++
    })

    // Finde Peak-Zeiten
    const peakHour = Object.entries(hourlyDistribution)
      .reduce((a, b) => hourlyDistribution[parseInt(a[0])] > hourlyDistribution[parseInt(b[0])] ? a : b)[0]
    
    const peakDay = Object.entries(weekdayDistribution)
      .reduce((a, b) => weekdayDistribution[parseInt(a[0])] > weekdayDistribution[parseInt(b[0])] ? a : b)[0]

    // Bestimme Hörtyp
    let listeningType: string
    let listeningIcon: string
    let listeningColor: string

    const morningListening = (hourlyDistribution[7] + hourlyDistribution[8] + hourlyDistribution[9]) || 0
    const afternoonListening = (hourlyDistribution[12] + hourlyDistribution[13] + hourlyDistribution[14]) || 0
    const eveningListening = (hourlyDistribution[18] + hourlyDistribution[19] + hourlyDistribution[20]) || 0
    const nightListening = (hourlyDistribution[22] + hourlyDistribution[23] + hourlyDistribution[0] + hourlyDistribution[1]) || 0

    const maxListening = Math.max(morningListening, afternoonListening, eveningListening, nightListening)

    if (maxListening === morningListening) {
      listeningType = 'Morgenmuffel'
      listeningIcon = '🌅'
      listeningColor = 'text-orange-400'
    } else if (maxListening === afternoonListening) {
      listeningType = 'Mittagstyp'
      listeningIcon = '☀️'
      listeningColor = 'text-yellow-400'
    } else if (maxListening === eveningListening) {
      listeningType = 'Abendhörer'
      listeningIcon = '🌆'
      listeningColor = 'text-purple-400'
    } else {
      listeningType = 'Nachteule'
      listeningIcon = '🌙'
      listeningColor = 'text-blue-400'
    }

    // Insights generieren
    const insights: string[] = []

    const peakHourInt = parseInt(peakHour)
    if (peakHourInt >= 6 && peakHourInt <= 9) {
      insights.push('Du startest gerne mit Musik in den Tag!')
    } else if (peakHourInt >= 17 && peakHourInt <= 20) {
      insights.push('Abends ist deine Musik-Prime-Time!')
    } else if (peakHourInt >= 21 || peakHourInt <= 2) {
      insights.push('Du bist ein echter Nachthörer!')
    }

    const weekendListening = weekdayDistribution[0] + weekdayDistribution[6] // Sonntag + Samstag
    const weekdayListening = Object.keys(weekdayDistribution)
      .filter(day => parseInt(day) !== 0 && parseInt(day) !== 6)
      .reduce((sum, day) => sum + weekdayDistribution[parseInt(day)], 0)

    if (weekendListening > weekdayListening) {
      insights.push('Am Wochenende hörst du deutlich mehr Musik!')
    } else if (weekdayListening > weekendListening * 1.5) {
      insights.push('Musik begleitet dich hauptsächlich durch den Arbeitsalltag!')
    }

    // Konsistenz prüfen
    const hourlyValues = Object.values(hourlyDistribution).filter(v => v > 0)
    const isConsistent = hourlyValues.length > 12 // Musik über viele Stunden verteilt
    if (isConsistent) {
      insights.push('Du hörst sehr gleichmäßig über den Tag verteilt Musik!')
    }

    return {
      hourlyDistribution,
      weekdayDistribution,
      peakHour: peakHourInt,
      peakDay: parseInt(peakDay),
      totalTracks: recentlyPlayed.items.length,
      listeningType,
      listeningIcon,
      listeningColor,
      insights
    }
  }

  const patterns = analyzeListeningPatterns()

  const getDayName = (day: number): string => {
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
    return days[day]
  }

  const formatHour = (hour: number): string => {
    return hour.toString().padStart(2, '0') + ':00'
  }

  const getMaxValue = (obj: { [key: number]: number }): number => {
    return Math.max(...Object.values(obj))
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white/70">Analysiere Hörgewohnheiten...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-300 mb-2">Fehler beim Laden der Hörgewohnheiten</p>
          <p className="text-white/70 text-sm">{error}</p>
          <button 
            onClick={loadRecentlyPlayed}
            className="mt-4 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-sm transition-colors"
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
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-white/70 text-sm">Deine zeitlichen Musik-Muster</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{patterns.listeningIcon}</span>
            <span className={`text-sm font-medium ${patterns.listeningColor}`}>
              {patterns.listeningType}
            </span>
          </div>
          <p className="text-white/70 text-xs">{patterns.totalTracks} Tracks analysiert</p>
        </div>
      </div>

      {/* Tageszeit-Verteilung */}
      <div className="space-y-4">
        <h4 className="text-white font-medium flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          Hörzeit nach Tageszeit
        </h4>
        
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
          {Object.entries(patterns.hourlyDistribution).map(([hour, count]) => {
            const hourInt = parseInt(hour)
            const maxCount = getMaxValue(patterns.hourlyDistribution)
            const height = maxCount > 0 ? (count / maxCount) * 100 : 0
            
            return (
              <div key={hour} className="flex flex-col items-center group">
                <div className="w-full bg-gray-700 rounded-sm mb-1 h-16 flex items-end">
                  <div 
                    className={`w-full rounded-sm transition-all duration-500 ${
                      hourInt >= 6 && hourInt <= 9 ? 'bg-gradient-to-t from-orange-500 to-yellow-400' :
                      hourInt >= 10 && hourInt <= 16 ? 'bg-gradient-to-t from-yellow-500 to-orange-400' :
                      hourInt >= 17 && hourInt <= 21 ? 'bg-gradient-to-t from-purple-500 to-pink-400' :
                      'bg-gradient-to-t from-blue-500 to-cyan-400'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-xs text-white/60 group-hover:text-white transition-colors">
                  {formatHour(hourInt)}
                </span>
                <span className="text-xs text-white/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
        
        <div className="flex items-center justify-between text-xs text-white/60">
          <span>00:00</span>
          <span>Peak: {formatHour(patterns.peakHour)}</span>
          <span>23:00</span>
        </div>
      </div>

      {/* Wochentag-Verteilung */}
      <div className="space-y-4">
        <h4 className="text-white font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-400" />
          Hörzeit nach Wochentag
        </h4>
        
        <div className="space-y-2">
          {Object.entries(patterns.weekdayDistribution).map(([day, count]) => {
            const dayInt = parseInt(day)
            const maxCount = getMaxValue(patterns.weekdayDistribution)
            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
            const isWeekend = dayInt === 0 || dayInt === 6
            
            return (
              <div key={day} className="flex items-center gap-3">
                <div className="w-8 text-right">
                  <span className={`text-sm font-medium ${
                    dayInt === patterns.peakDay ? 'text-purple-400' : 'text-white/80'
                  }`}>
                    {getDayName(dayInt)}
                  </span>
                </div>
                
                <div className="flex-1">
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-700 ${
                        isWeekend 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                          : 'bg-gradient-to-r from-purple-500 to-pink-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                
                <div className="w-8 text-left">
                  <span className="text-sm text-white/70">{count}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Insights */}
      {patterns.insights.length > 0 && (
        <div className="pt-4 border-t border-white/10">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-yellow-400" />
            Deine Hör-Insights
          </h4>
          
          <div className="space-y-2">
            {patterns.insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-white/80 text-sm">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-white/5 rounded-lg p-4">
        <h5 className="text-white font-medium mb-2 flex items-center gap-2">
          <span className="text-lg">🎧</span>
          Dein Hör-Profil
        </h5>
        <p className="text-white/70 text-sm">
          Du bist ein <span className={`font-medium ${patterns.listeningColor}`}>{patterns.listeningType}</span> 
          {' '}mit Peak-Zeit um <span className="font-medium text-white">{formatHour(patterns.peakHour)}</span>
          {' '}und liebst {getDayName(patterns.peakDay)} besonders! 
          {patterns.listeningType === 'Nachteule' 
            ? ' Musik hilft dir beim Entspannen nach einem langen Tag.'
            : patterns.listeningType === 'Morgenmuffel'
            ? ' Musik gibt dir Energie für den Tag!'
            : ' Musik ist dein perfekter Begleiter!'
          }
        </p>
      </div>
    </div>
  )
} 
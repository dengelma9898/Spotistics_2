'use client'

import { useState, useEffect } from 'react'
import { RecentlyPlayedResponse } from '@/types/spotify'
import { Calendar, Clock, TrendingUp, Activity } from 'lucide-react'

interface DailyListeningHeatmapProps {
  recentTracks: RecentlyPlayedResponse
  title?: string
}

interface HeatmapData {
  day: number // 0-6 (Sunday-Saturday)
  hour: number // 0-23
  count: number
  tracks: any[]
}

interface DayStats {
  dayName: string
  totalTracks: number
  peakHour: number
  avgPopularity: number
}

export default function DailyListeningHeatmap({ 
  recentTracks, 
  title = "Tägliche Hör-Heatmap" 
}: DailyListeningHeatmapProps) {
  const [selectedCell, setSelectedCell] = useState<HeatmapData | null>(null)
  const [viewMode, setViewMode] = useState<'heatmap' | 'stats'>('heatmap')

  // Verarbeite Daten für Heatmap
  const processHeatmapData = (): HeatmapData[][] => {
    if (!recentTracks?.items) return []

    // Erstelle 7x24 Matrix (7 Tage x 24 Stunden)
    const matrix: HeatmapData[][] = []
    for (let day = 0; day < 7; day++) {
      matrix[day] = []
      for (let hour = 0; hour < 24; hour++) {
        matrix[day][hour] = {
          day,
          hour,
          count: 0,
          tracks: []
        }
      }
    }

    // Fülle Matrix mit Daten
    recentTracks.items.forEach(item => {
      const playedAt = new Date(item.played_at)
      const day = playedAt.getDay() // 0 = Sonntag
      const hour = playedAt.getHours()
      
      matrix[day][hour].count++
      matrix[day][hour].tracks.push(item)
    })

    return matrix
  }

  // Berechne Tagesstatistiken
  const calculateDayStats = (): DayStats[] => {
    const heatmapData = processHeatmapData()
    const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
    
    return heatmapData.map((dayData, dayIndex) => {
      const totalTracks = dayData.reduce((sum, hourData) => sum + hourData.count, 0)
      const peakHour = dayData.reduce((max, current, index) => 
        current.count > dayData[max].count ? index : max, 0
      )
      
      const allTracks = dayData.flatMap(hourData => hourData.tracks)
      const avgPopularity = allTracks.length > 0 
        ? allTracks.reduce((sum, item) => sum + item.track.popularity, 0) / allTracks.length 
        : 0

      return {
        dayName: dayNames[dayIndex],
        totalTracks,
        peakHour,
        avgPopularity: Math.round(avgPopularity)
      }
    })
  }

  const heatmapData = processHeatmapData()
  const dayStats = calculateDayStats()
  
  // Finde maximale Anzahl für Farbskalierung
  const maxCount = Math.max(...heatmapData.flat().map(cell => cell.count))

  // Farbintensität basierend auf Anzahl
  const getIntensity = (count: number): number => {
    if (maxCount === 0) return 0
    return count / maxCount
  }

  // Farbe für Heatmap-Zelle
  const getCellColor = (count: number): string => {
    const intensity = getIntensity(count)
    if (intensity === 0) return 'bg-gray-800'
    if (intensity <= 0.25) return 'bg-blue-900/50'
    if (intensity <= 0.5) return 'bg-blue-700/70'
    if (intensity <= 0.75) return 'bg-blue-500/80'
    return 'bg-blue-400'
  }

  const hourLabels = ['00', '06', '12', '18']
  const dayLabels = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-gray-400 text-sm">
              Wochentag × Tageszeit Aktivität
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('heatmap')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'heatmap'
                ? 'bg-white/20 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/15'
            }`}
          >
            Heatmap
          </button>
          <button
            onClick={() => setViewMode('stats')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'stats'
                ? 'bg-white/20 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/15'
            }`}
          >
            Statistiken
          </button>
        </div>
      </div>

      {viewMode === 'heatmap' && (
        <div className="space-y-4">
          {/* Heatmap */}
          <div className="relative">
            {/* Stunden-Labels (oben) */}
            <div className="flex mb-2 ml-12">
              {Array.from({ length: 24 }, (_, i) => (
                <div 
                  key={i} 
                  className="flex-1 text-center text-xs text-gray-400"
                  style={{ minWidth: '20px' }}
                >
                  {i % 6 === 0 ? i.toString().padStart(2, '0') : ''}
                </div>
              ))}
            </div>

            {/* Heatmap Grid */}
            <div className="space-y-1">
              {heatmapData.map((dayData, dayIndex) => (
                <div key={dayIndex} className="flex items-center gap-2">
                  {/* Tag-Label */}
                  <div className="w-10 text-right text-sm text-gray-400 font-medium">
                    {dayLabels[dayIndex]}
                  </div>
                  
                  {/* Stunden-Zellen */}
                  <div className="flex gap-1">
                    {dayData.map((hourData, hourIndex) => (
                      <div
                        key={`${dayIndex}-${hourIndex}`}
                        className={`w-5 h-5 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-white/50 ${getCellColor(hourData.count)}`}
                        onClick={() => setSelectedCell(hourData)}
                        title={`${dayLabels[dayIndex]} ${hourIndex}:00 - ${hourData.count} Tracks`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Legende */}
            <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
              <span>Weniger</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-gray-800 rounded-sm"></div>
                <div className="w-3 h-3 bg-blue-900/50 rounded-sm"></div>
                <div className="w-3 h-3 bg-blue-700/70 rounded-sm"></div>
                <div className="w-3 h-3 bg-blue-500/80 rounded-sm"></div>
                <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
              </div>
              <span>Mehr</span>
            </div>
          </div>

          {/* Selected Cell Details */}
          {selectedCell && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-blue-400" />
                <h4 className="text-white font-medium">
                  {dayLabels[selectedCell.day]} um {selectedCell.hour}:00 Uhr
                </h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <span className="text-gray-400 text-sm">Tracks gespielt</span>
                  <p className="text-white font-semibold">{selectedCell.count}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Ø Popularität</span>
                  <p className="text-white font-semibold">
                    {selectedCell.tracks.length > 0 
                      ? Math.round(selectedCell.tracks.reduce((sum, item) => sum + item.track.popularity, 0) / selectedCell.tracks.length)
                      : 0}
                  </p>
                </div>
              </div>

              {selectedCell.tracks.length > 0 && (
                <div className="space-y-2">
                  <span className="text-gray-400 text-sm">Tracks:</span>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {selectedCell.tracks.slice(0, 5).map((item, index) => (
                      <div key={index} className="text-sm">
                        <span className="text-white">{item.track.name}</span>
                        <span className="text-gray-400"> • {item.track.artists[0]?.name}</span>
                      </div>
                    ))}
                    {selectedCell.tracks.length > 5 && (
                      <div className="text-gray-400 text-xs">
                        +{selectedCell.tracks.length - 5} weitere...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {viewMode === 'stats' && (
        <div className="space-y-4">
          {/* Tagesstatistiken */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dayStats.map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-medium">{stat.dayName}</h4>
                  <span className="text-gray-400 text-sm">{stat.totalTracks} Tracks</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Peak-Zeit:</span>
                    <span className="text-white">{stat.peakHour}:00 Uhr</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Ø Popularität:</span>
                    <span className="text-white">{stat.avgPopularity}</span>
                  </div>
                </div>

                {/* Mini-Heatmap für den Tag */}
                <div className="mt-3">
                  <div className="flex gap-1">
                    {heatmapData[index]?.map((hourData, hourIndex) => (
                      <div
                        key={hourIndex}
                        className={`w-2 h-2 rounded-sm ${getCellColor(hourData.count)}`}
                        title={`${hourIndex}:00 - ${hourData.count} Tracks`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Gesamtstatistiken */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Gesamtanalyse
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {dayStats.reduce((sum, stat) => sum + stat.totalTracks, 0)}
                </div>
                <div className="text-gray-400 text-sm">Gesamt Tracks</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {dayStats.reduce((max, stat) => Math.max(max, stat.totalTracks), 0)}
                </div>
                <div className="text-gray-400 text-sm">Aktivster Tag</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {Math.round(dayStats.reduce((sum, stat) => sum + stat.avgPopularity, 0) / dayStats.length)}
                </div>
                <div className="text-gray-400 text-sm">Ø Popularität</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {maxCount}
                </div>
                <div className="text-gray-400 text-sm">Peak Stunde</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
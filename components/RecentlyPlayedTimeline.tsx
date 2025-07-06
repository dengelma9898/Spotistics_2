'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { RecentlyPlayedResponse } from '@/types/spotify'
import { Clock, Calendar, TrendingUp, Music, PlayCircle, Pause } from 'lucide-react'

interface RecentlyPlayedTimelineProps {
  recentTracks: RecentlyPlayedResponse
  title?: string
}

interface TimelineData {
  timestamp: string
  hour: number
  dayOfWeek: number
  trackName: string
  artistName: string
  albumName: string
  context: string
  popularity: number
  duration: number
}

interface HourlyData {
  hour: string
  count: number
  tracks: TimelineData[]
}

interface DailyData {
  day: string
  dayName: string
  count: number
  tracks: TimelineData[]
}

export default function RecentlyPlayedTimeline({ 
  recentTracks, 
  title = "Recently Played Timeline" 
}: RecentlyPlayedTimelineProps) {
  const [viewMode, setViewMode] = useState<'hourly' | 'daily' | 'timeline'>('timeline')
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d'>('24h')

  // Verarbeite Recently Played Daten
  const processTimelineData = (): TimelineData[] => {
    if (!recentTracks?.items) return []

    return recentTracks.items.map(item => {
      const playedAt = new Date(item.played_at)
      return {
        timestamp: item.played_at,
        hour: playedAt.getHours(),
        dayOfWeek: playedAt.getDay(),
        trackName: item.track.name,
        artistName: item.track.artists[0]?.name || 'Unknown',
        albumName: item.track.album.name,
        context: item.context?.type || 'unknown',
        popularity: item.track.popularity,
        duration: item.track.duration_ms
      }
    })
  }

  // Gruppiere nach Stunden
  const getHourlyData = (): HourlyData[] => {
    const timelineData = processTimelineData()
    const hourlyMap = new Map<number, TimelineData[]>()

    // Initialisiere alle 24 Stunden
    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, [])
    }

    timelineData.forEach(item => {
      const existing = hourlyMap.get(item.hour) || []
      existing.push(item)
      hourlyMap.set(item.hour, existing)
    })

    return Array.from(hourlyMap.entries()).map(([hour, tracks]) => ({
      hour: hour.toString().padStart(2, '0') + ':00',
      count: tracks.length,
      tracks
    }))
  }

  // Gruppiere nach Tagen
  const getDailyData = (): DailyData[] => {
    const timelineData = processTimelineData()
    const dailyMap = new Map<string, TimelineData[]>()

    timelineData.forEach(item => {
      const date = new Date(item.timestamp)
      const dayKey = date.toISOString().split('T')[0]
      
      const existing = dailyMap.get(dayKey) || []
      existing.push(item)
      dailyMap.set(dayKey, existing)
    })

    return Array.from(dailyMap.entries())
      .map(([day, tracks]) => ({
        day,
        dayName: new Date(day).toLocaleDateString('de-DE', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        count: tracks.length,
        tracks
      }))
      .sort((a, b) => new Date(b.day).getTime() - new Date(a.day).getTime())
      .slice(0, 30) // Letzte 30 Tage
  }

  // Analysiere Hörgewohnheiten
  const analyzeListeningPatterns = () => {
    const timelineData = processTimelineData()
    if (timelineData.length === 0) return null

    const contexts = timelineData.reduce((acc, item) => {
      acc[item.context] = (acc[item.context] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const avgPopularity = timelineData.reduce((sum, item) => sum + item.popularity, 0) / timelineData.length
    const totalDuration = timelineData.reduce((sum, item) => sum + item.duration, 0)

    // Finde Peak-Zeiten
    const hourlyData = getHourlyData()
    const peakHour = hourlyData.reduce((max, current) => 
      current.count > max.count ? current : max
    )

    return {
      totalTracks: timelineData.length,
      avgPopularity: Math.round(avgPopularity),
      totalDuration: Math.round(totalDuration / 1000 / 60), // in Minuten
      peakHour: peakHour.hour,
      peakCount: peakHour.count,
      contexts,
      uniqueArtists: new Set(timelineData.map(t => t.artistName)).size,
      uniqueAlbums: new Set(timelineData.map(t => t.albumName)).size
    }
  }

  const hourlyData = getHourlyData()
  const dailyData = getDailyData()
  const patterns = analyzeListeningPatterns()

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('de-DE', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-gray-400 text-sm">
              {recentTracks?.items?.length || 0} Tracks analysiert
            </p>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex gap-2">
          {[
            { value: 'timeline' as const, label: 'Timeline', icon: PlayCircle },
            { value: 'hourly' as const, label: 'Stunden', icon: Clock },
            { value: 'daily' as const, label: 'Tage', icon: Calendar }
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setViewMode(value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                viewMode === value
                  ? 'bg-white/20 text-white border-white/30'
                  : 'bg-white/10 text-gray-300 hover:bg-white/15 border-white/10'
              } border`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      {patterns && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400 text-sm">Tracks</span>
            </div>
            <p className="text-white text-lg font-bold">{patterns.totalTracks}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-gray-400 text-sm">Ø Popularität</span>
            </div>
            <p className="text-white text-lg font-bold">{patterns.avgPopularity}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-gray-400 text-sm">Peak-Zeit</span>
            </div>
            <p className="text-white text-lg font-bold">{patterns.peakHour}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-400" />
              <span className="text-gray-400 text-sm">Hörzeit</span>
            </div>
            <p className="text-white text-lg font-bold">{patterns.totalDuration}m</p>
          </div>
        </div>
      )}

      {/* Chart Area */}
      <div className="space-y-4">
        {viewMode === 'hourly' && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="hour" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  formatter={(value: number) => [value, 'Tracks']}
                  labelFormatter={(label) => `${label} Uhr`}
                />
                <Bar 
                  dataKey="count" 
                  fill="url(#hourlyGradient)"
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="hourlyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {viewMode === 'daily' && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="dayName" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  formatter={(value: number) => [value, 'Tracks']}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#EC4899" 
                  strokeWidth={3}
                  dot={{ fill: '#EC4899', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#EC4899', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {viewMode === 'timeline' && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {processTimelineData().slice(0, 20).map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <div className="text-center min-w-16">
                  <div className="text-white text-sm font-medium">
                    {formatTime(item.timestamp)}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {formatDate(item.timestamp)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">
                    {item.trackName}
                  </div>
                  <div className="text-gray-400 text-sm truncate">
                    {item.artistName} • {item.albumName}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="text-center">
                    <div className="text-gray-400 text-xs">Kontext</div>
                    <div className="text-white capitalize">
                      {item.context === 'playlist' ? '📋' : 
                       item.context === 'album' ? '💿' : 
                       item.context === 'artist' ? '🎤' : '🎵'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-gray-400 text-xs">Pop.</div>
                    <div className="text-white">{item.popularity}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Context Analysis */}
      {patterns && (
        <div className="pt-4 border-t border-white/10">
          <h4 className="text-white font-medium mb-3">Kontext-Analyse</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(patterns.contexts).map(([context, count]) => (
              <div key={context} className="text-center">
                <div className="text-2xl mb-1">
                  {context === 'playlist' ? '📋' : 
                   context === 'album' ? '💿' : 
                   context === 'artist' ? '🎤' : '🎵'}
                </div>
                <div className="text-white font-medium capitalize">{context}</div>
                <div className="text-gray-400 text-sm">{count} Tracks</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 
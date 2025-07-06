'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ComposedChart } from 'recharts'
import { getSpotifyApi } from '@/lib/spotify'
import { Clock, Activity, TrendingUp, PlayCircle, Pause, BarChart3 } from 'lucide-react'

interface SessionData {
  sessionId: string
  startTime: Date
  endTime: Date
  duration: number // in minutes
  trackCount: number
  tracks: any[]
  timeOfDay: string
  dayOfWeek: string
}

interface SessionStats {
  averageSessionLength: number
  totalSessions: number
  longestSession: number
  shortestSession: number
  sessionsByTimeOfDay: { timeOfDay: string; count: number; avgDuration: number }[]
  sessionsByDayOfWeek: { day: string; count: number; avgDuration: number }[]
  sessionLengthDistribution: { range: string; count: number; percentage: number }[]
  listeningIntensity: { level: string; sessions: number; color: string }[]
}

export default function SessionLengthAnalysis() {
  const [sessionData, setSessionData] = useState<SessionData[]>([])
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSessionData()
  }, [])

  const loadSessionData = async () => {
    try {
      setLoading(true)
      setError(null)

      const sdk = await getSpotifyApi()
      if (!sdk) throw new Error('Spotify API nicht verfügbar')

      const recentlyPlayed = await sdk.player.getRecentlyPlayedTracks(50)
      
      const sessions = analyzeSessions(recentlyPlayed.items)
      const stats = calculateSessionStats(sessions)
      
      setSessionData(sessions)
      setSessionStats(stats)

    } catch (error) {
      console.error('Fehler beim Laden der Session-Daten:', error)
      setError(error instanceof Error ? error.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  const analyzeSessions = (recentTracks: any[]): SessionData[] => {
    if (!recentTracks || recentTracks.length === 0) return []

    const sessions: SessionData[] = []
    let currentSession: any = null
    const SESSION_GAP_MINUTES = 30 // Pause von 30+ Minuten = neue Session

    recentTracks.reverse().forEach((item, index) => {
      const playedAt = new Date(item.played_at)
      const trackDuration = item.track.duration_ms / 1000 / 60 // in Minuten

      if (!currentSession) {
        // Erste Session starten
        currentSession = {
          sessionId: `session-${sessions.length + 1}`,
          startTime: playedAt,
          endTime: new Date(playedAt.getTime() + trackDuration * 60000),
          tracks: [item],
          trackCount: 1
        }
      } else {
        const timeSinceLastTrack = (playedAt.getTime() - currentSession.endTime.getTime()) / 1000 / 60
        
        if (timeSinceLastTrack <= SESSION_GAP_MINUTES) {
          // Track zur aktuellen Session hinzufügen
          currentSession.tracks.push(item)
          currentSession.trackCount++
          currentSession.endTime = new Date(playedAt.getTime() + trackDuration * 60000)
        } else {
          // Aktuelle Session beenden und neue starten
          currentSession.duration = (currentSession.endTime.getTime() - currentSession.startTime.getTime()) / 1000 / 60
          currentSession.timeOfDay = getTimeOfDay(currentSession.startTime)
          currentSession.dayOfWeek = getDayOfWeek(currentSession.startTime)
          
          sessions.push(currentSession)
          
          currentSession = {
            sessionId: `session-${sessions.length + 1}`,
            startTime: playedAt,
            endTime: new Date(playedAt.getTime() + trackDuration * 60000),
            tracks: [item],
            trackCount: 1
          }
        }
      }
    })

    // Letzte Session hinzufügen
    if (currentSession) {
      currentSession.duration = (currentSession.endTime.getTime() - currentSession.startTime.getTime()) / 1000 / 60
      currentSession.timeOfDay = getTimeOfDay(currentSession.startTime)
      currentSession.dayOfWeek = getDayOfWeek(currentSession.startTime)
      sessions.push(currentSession)
    }

    return sessions.filter(s => s.duration > 2) // Nur Sessions > 2 Minuten
  }

  const getTimeOfDay = (date: Date): string => {
    const hour = date.getHours()
    if (hour >= 6 && hour < 12) return 'Morgen'
    if (hour >= 12 && hour < 17) return 'Mittag'
    if (hour >= 17 && hour < 22) return 'Abend'
    return 'Nacht'
  }

  const getDayOfWeek = (date: Date): string => {
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
    return days[date.getDay()]
  }

  const calculateSessionStats = (sessions: SessionData[]): SessionStats => {
    if (sessions.length === 0) {
      return {
        averageSessionLength: 0,
        totalSessions: 0,
        longestSession: 0,
        shortestSession: 0,
        sessionsByTimeOfDay: [],
        sessionsByDayOfWeek: [],
        sessionLengthDistribution: [],
        listeningIntensity: []
      }
    }

    const durations = sessions.map(s => s.duration)
    const averageSessionLength = durations.reduce((a, b) => a + b, 0) / durations.length
    const longestSession = Math.max(...durations)
    const shortestSession = Math.min(...durations)

    // Sessions nach Tageszeit
    const timeOfDayMap = new Map<string, { count: number; totalDuration: number }>()
    sessions.forEach(session => {
      const current = timeOfDayMap.get(session.timeOfDay) || { count: 0, totalDuration: 0 }
      timeOfDayMap.set(session.timeOfDay, {
        count: current.count + 1,
        totalDuration: current.totalDuration + session.duration
      })
    })

    const sessionsByTimeOfDay = Array.from(timeOfDayMap.entries()).map(([timeOfDay, data]) => ({
      timeOfDay,
      count: data.count,
      avgDuration: data.totalDuration / data.count
    }))

    // Sessions nach Wochentag
    const dayOfWeekMap = new Map<string, { count: number; totalDuration: number }>()
    sessions.forEach(session => {
      const current = dayOfWeekMap.get(session.dayOfWeek) || { count: 0, totalDuration: 0 }
      dayOfWeekMap.set(session.dayOfWeek, {
        count: current.count + 1,
        totalDuration: current.totalDuration + session.duration
      })
    })

    const sessionsByDayOfWeek = Array.from(dayOfWeekMap.entries()).map(([day, data]) => ({
      day,
      count: data.count,
      avgDuration: data.totalDuration / data.count
    }))

    // Session-Längen-Verteilung
    const ranges = [
      { range: '< 15 Min', min: 0, max: 15 },
      { range: '15-30 Min', min: 15, max: 30 },
      { range: '30-60 Min', min: 30, max: 60 },
      { range: '60-120 Min', min: 60, max: 120 },
      { range: '> 120 Min', min: 120, max: Infinity }
    ]

    const sessionLengthDistribution = ranges.map(range => {
      const count = sessions.filter(s => s.duration >= range.min && s.duration < range.max).length
      return {
        range: range.range,
        count,
        percentage: (count / sessions.length) * 100
      }
    })

    // Listening Intensity
    const listeningIntensity = [
      { 
        level: 'Kurze Sessions', 
        sessions: sessions.filter(s => s.duration < 20).length,
        color: '#ef4444'
      },
      { 
        level: 'Mittlere Sessions', 
        sessions: sessions.filter(s => s.duration >= 20 && s.duration < 60).length,
        color: '#22c55e'
      },
      { 
        level: 'Lange Sessions', 
        sessions: sessions.filter(s => s.duration >= 60).length,
        color: '#a855f7'
      }
    ]

    return {
      averageSessionLength,
      totalSessions: sessions.length,
      longestSession,
      shortestSession,
      sessionsByTimeOfDay,
      sessionsByDayOfWeek,
      sessionLengthDistribution,
      listeningIntensity
    }
  }

  if (loading) {
    return (
      <Card className="w-full bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5" />
            Session Length Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5" />
            Session Length Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-center py-8">
            Fehler: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!sessionStats) return null

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Session Overview Stats */}
      <Card className="w-full bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5" />
            Session Übersicht
          </CardTitle>
          <p className="text-sm text-gray-400">
            Analyse basierend auf deinen letzten 50 gespielten Tracks (ca. letzte 1-2 Wochen)
          </p>
        </CardHeader>
        <CardContent>
                      <div className="mb-4 bg-gray-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-300 text-center">
                📊 <strong>Session-Definition:</strong> Zusammenhängende Tracks ohne Pause von 30+ Minuten
                <br />
                🎵 <strong>Datenquelle:</strong> Deine letzten 50 gespielten Tracks von Spotify
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <p className="text-sm text-gray-400">Gesamte Sessions</p>
                </div>
                <p className="text-2xl font-bold text-blue-400">
                  {sessionStats.totalSessions}
                </p>
              </div>

            <div className="bg-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <p className="text-sm text-gray-400">Ø Session-Länge</p>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {sessionStats.averageSessionLength.toFixed(0)} Min
              </p>
            </div>

            <div className="bg-purple-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <PlayCircle className="w-5 h-5 text-purple-400" />
                <p className="text-sm text-gray-400">Längste Session</p>
              </div>
              <p className="text-2xl font-bold text-purple-400">
                {sessionStats.longestSession.toFixed(0)} Min
              </p>
            </div>

            <div className="bg-orange-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Pause className="w-5 h-5 text-orange-400" />
                <p className="text-sm text-gray-400">Kürzeste Session</p>
              </div>
              <p className="text-2xl font-bold text-orange-400">
                {sessionStats.shortestSession.toFixed(0)} Min
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Length Distribution */}
      <Card className="w-full bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="w-5 h-5" />
            Session-Längen Verteilung
          </CardTitle>
          <p className="text-sm text-gray-400">
            Basierend auf deinen letzten 50 gespielten Tracks. Sessions werden durch Pausen von 30+ Minuten getrennt.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionStats.sessionLengthDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis 
                  dataKey="range" 
                  tick={{ fontSize: 11, fill: '#ffffff' }}
                  stroke="#ffffff60"
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#ffffff' }}
                  stroke="#ffffff60"
                />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value} Sessions (${(value as number / sessionStats.totalSessions * 100).toFixed(1)}%)`,
                    'Anzahl'
                  ]}
                  labelFormatter={(label) => `Dauer: ${label}`}
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="url(#sessionGradient)"
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="sessionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Sessions by Time of Day */}
      <Card className="w-full bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5" />
            Sessions nach Tageszeit
          </CardTitle>
          <p className="text-sm text-gray-400">
            Anzahl Sessions (Balken) und durchschnittliche Dauer (Linie) pro Tageszeit - basierend auf letzten 50 Tracks
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={sessionStats.sessionsByTimeOfDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis 
                  dataKey="timeOfDay" 
                  tick={{ fontSize: 11, fill: '#ffffff' }}
                  stroke="#ffffff60"
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 12, fill: '#ffffff' }}
                  stroke="#ffffff60"
                  label={{ value: 'Anzahl Sessions', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#ffffff' } }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: '#ffffff' }}
                  stroke="#ffffff60"
                  label={{ value: 'Ø Dauer (Min)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#ffffff' } }}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'count' ? `${value} Sessions` : `${(value as number).toFixed(1)} Min`,
                    name === 'count' ? 'Anzahl Sessions' : 'Ø Dauer'
                  ]}
                  labelFormatter={(label) => `Tageszeit: ${label}`}
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="count" 
                  fill="rgba(59, 130, 246, 0.6)"
                  radius={[2, 2, 0, 0]}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="avgDuration" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Listening Intensity */}
      <Card className="w-full bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Activity className="w-5 h-5" />
            Hör-Intensität
          </CardTitle>
          <p className="text-sm text-gray-400">
            Verteilung der Session-Längen nach Kategorien (letzte 50 Tracks)
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Legend with Values */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {sessionStats.listeningIntensity.map((entry, index) => (
                <div key={index} className="bg-black/30 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm font-medium text-white">
                      {entry.level}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-1">
                    {entry.level === 'Kurze Sessions' ? '< 20 Min' : 
                     entry.level === 'Mittlere Sessions' ? '20-60 Min' : 
                     '60+ Min'}
                  </p>
                  <p className="text-lg font-bold text-white">
                    {entry.sessions} Sessions
                  </p>
                  <p className="text-xs text-gray-400">
                    {((entry.sessions / sessionStats.totalSessions) * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
            
            {/* Pie Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sessionStats.listeningIntensity}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="sessions"
                  >
                    {sessionStats.listeningIntensity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
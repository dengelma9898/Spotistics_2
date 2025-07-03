'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { RecentlyPlayedResponse } from '@/types/spotify'

interface ListeningActivityProps {
  recentTracks: RecentlyPlayedResponse
  className?: string
}

export function ListeningActivity({ recentTracks, className = '' }: ListeningActivityProps) {
  // Gruppiere Tracks nach Stunden für die letzten 24 Stunden
  const activityData = Array.from({ length: 24 }, (_, i) => {
    const hour = i
    const count = recentTracks.items.filter(item => {
      const playedAt = new Date(item.played_at)
      const now = new Date()
      const hoursAgo = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000)
      return playedAt.getHours() === hoursAgo.getHours() && 
             playedAt.getDate() === hoursAgo.getDate()
    }).length

    return {
      hour: i,
      hourLabel: `${i.toString().padStart(2, '0')}:00`,
      tracks: count
    }
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-cardBackground border border-textSecondary/20 rounded-tooltip p-2 shadow-tooltip">
          <p className="text-textPrimary text-sm">
            {`${label} - ${payload[0].value} Track${payload[0].value !== 1 ? 's' : ''}`}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className={`bg-cardBackground rounded-card p-card ${className}`}>
      <h3 className="text-lg font-semibold text-textPrimary mb-4">
        Hör-Aktivität (Letzte 24 Stunden)
      </h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={activityData}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#4A5568"
              strokeOpacity={0.3}
            />
            <XAxis 
              dataKey="hourLabel"
              stroke="#A0AEC0"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#A0AEC0"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="tracks"
              stroke="#FEC006"
              strokeWidth={2}
              dot={{ fill: '#FEC006', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#FEC006', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-xs text-textSecondary">
        <p>Zeigt die Anzahl der gespielten Tracks pro Stunde für die letzten 24 Stunden.</p>
      </div>
    </div>
  )
} 
'use client'

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'
import { AudioFeatures } from '@/types/spotify'
import { getAudioFeatureLabel } from '@/lib/spotify'

interface AudioFeaturesChartProps {
  audioFeatures: AudioFeatures[]
  className?: string
}

export function AudioFeaturesChart({ audioFeatures, className = '' }: AudioFeaturesChartProps) {
  // Berechne Durchschnittswerte für alle Audio Features
  const averageFeatures = audioFeatures.reduce((acc, features) => {
    return {
      danceability: acc.danceability + features.danceability,
      energy: acc.energy + features.energy,
      speechiness: acc.speechiness + features.speechiness,
      acousticness: acc.acousticness + features.acousticness,
      instrumentalness: acc.instrumentalness + features.instrumentalness,
      liveness: acc.liveness + features.liveness,
      valence: acc.valence + features.valence,
    }
  }, {
    danceability: 0,
    energy: 0,
    speechiness: 0,
    acousticness: 0,
    instrumentalness: 0,
    liveness: 0,
    valence: 0,
  })

  // Dividiere durch die Anzahl der Tracks für den Durchschnitt
  const count = audioFeatures.length
  Object.keys(averageFeatures).forEach(key => {
    averageFeatures[key as keyof typeof averageFeatures] = averageFeatures[key as keyof typeof averageFeatures] / count
  })

  // Konvertiere in das Chart-Format
  const chartData = Object.entries(averageFeatures).map(([feature, value]) => ({
    feature: getAudioFeatureLabel(feature),
    value: Math.round(value * 100), // Konvertiere zu Prozent
    fullMark: 100
  }))

  return (
    <div className={`bg-cardBackground rounded-card p-card ${className}`}>
      <h3 className="text-lg font-semibold text-textPrimary mb-4">
        Audio-Eigenschaften Ihrer Top Tracks
      </h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <PolarGrid 
              stroke="#4A5568"
              strokeWidth={1}
            />
            <PolarAngleAxis 
              dataKey="feature"
              tick={{ 
                fill: '#A0AEC0', 
                fontSize: 12,
                fontWeight: 500
              }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]}
              tick={{ 
                fill: '#A0AEC0', 
                fontSize: 10 
              }}
            />
            <Radar
              name="Eigenschaften"
              dataKey="value"
              stroke="#FEC006"
              fill="#FEC006"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-xs text-textSecondary">
        <p>Diese Werte zeigen die durchschnittlichen Audio-Eigenschaften Ihrer meistgehörten Tracks.</p>
      </div>
    </div>
  )
} 
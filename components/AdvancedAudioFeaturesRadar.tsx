'use client'

import { useState } from 'react'
import { Info, HelpCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'
import { AudioFeatures, SpotifyTrack } from '@/types/spotify'
import { BackgroundGradient } from '@/components/ui/background-gradient'

interface AdvancedAudioFeaturesRadarProps {
  audioFeatures: AudioFeatures
  track: SpotifyTrack
}

interface FeatureInfo {
  key: keyof AudioFeatures
  label: string
  value: number
  description: string
  interpretation: string
  icon: string
}

export default function AdvancedAudioFeaturesRadar({ audioFeatures, track }: AdvancedAudioFeaturesRadarProps) {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)

  const getFeatureInfo = (): FeatureInfo[] => {
    return [
      {
        key: 'danceability',
        label: 'Tanzbarkeit',
        value: audioFeatures.danceability,
        description: 'Wie gut eignet sich der Track zum Tanzen? Basiert auf Tempo, Rhythmus-Stabilität, Beat-Stärke und allgemeiner Regelmäßigkeit.',
        interpretation: audioFeatures.danceability > 0.8 ? 'Perfekt zum Tanzen!' : 
                      audioFeatures.danceability > 0.6 ? 'Gut tanzbar' :
                      audioFeatures.danceability > 0.4 ? 'Mäßig tanzbar' : 'Eher nicht zum Tanzen geeignet',
        icon: '💃'
      },
      {
        key: 'energy',
        label: 'Energie',
        value: audioFeatures.energy,
        description: 'Intensität und Power des Tracks. Hohe Energie bedeutet schnell, laut und energiegeladen - niedrige Energie wirkt ruhig und entspannt.',
        interpretation: audioFeatures.energy > 0.8 ? 'Sehr energiegeladen und kraftvoll!' :
                       audioFeatures.energy > 0.6 ? 'Energetisch und mitreißend' :
                       audioFeatures.energy > 0.4 ? 'Moderate Energie' : 'Ruhig und entspannt',
        icon: '⚡'
      },
      {
        key: 'valence',
        label: 'Positivität',
        value: audioFeatures.valence,
        description: 'Die emotionale Stimmung des Tracks. Hohe Werte bedeuten fröhlich, euphorisch und positiv - niedrige Werte klingen traurig oder melancholisch.',
        interpretation: audioFeatures.valence > 0.8 ? 'Sehr fröhlich und positiv!' :
                       audioFeatures.valence > 0.6 ? 'Positiv und aufheiternd' :
                       audioFeatures.valence > 0.4 ? 'Neutral' : 'Melancholisch oder traurig',
        icon: '😊'
      },
      {
        key: 'acousticness',
        label: 'Akustisch',
        value: audioFeatures.acousticness,
        description: 'Wahrscheinlichkeit, dass der Track akustisch (nicht elektronisch) ist. Hohe Werte bedeuten echte Instrumente ohne elektronische Verstärkung.',
        interpretation: audioFeatures.acousticness > 0.8 ? 'Sehr akustisch - echte Instrumente!' :
                       audioFeatures.acousticness > 0.6 ? 'Überwiegend akustisch' :
                       audioFeatures.acousticness > 0.4 ? 'Mix aus akustisch und elektronisch' : 'Elektronisch produziert',
        icon: '🎸'
      },
      {
        key: 'instrumentalness',
        label: 'Instrumental',
        value: audioFeatures.instrumentalness,
        description: 'Wahrscheinlichkeit, dass der Track keine Gesangsstimme enthält. Je höher der Wert, desto wahrscheinlicher ist es ein Instrumental-Track.',
        interpretation: audioFeatures.instrumentalness > 0.8 ? 'Rein instrumental - keine Vocals!' :
                       audioFeatures.instrumentalness > 0.6 ? 'Überwiegend instrumental' :
                       audioFeatures.instrumentalness > 0.4 ? 'Wenig Gesang' : 'Deutlicher Gesang vorhanden',
        icon: '🎼'
      },
      {
        key: 'liveness',
        label: 'Live-Gefühl',
        value: audioFeatures.liveness,
        description: 'Wahrscheinlichkeit, dass der Track live vor Publikum aufgenommen wurde. Erkennt Publikums-Geräusche und Live-Atmosphäre.',
        interpretation: audioFeatures.liveness > 0.8 ? 'Definitiv Live-Aufnahme!' :
                       audioFeatures.liveness > 0.6 ? 'Wahrscheinlich live aufgenommen' :
                       audioFeatures.liveness > 0.4 ? 'Möglicherweise live' : 'Studio-Aufnahme',
        icon: '🎤'
      },
      {
        key: 'speechiness',
        label: 'Sprachanteil',
        value: audioFeatures.speechiness,
        description: 'Wie viel gesprochener Text (im Gegensatz zu Gesang) ist enthalten. Hohe Werte deuten auf Rap, Spoken Word oder Podcasts hin.',
        interpretation: audioFeatures.speechiness > 0.8 ? 'Überwiegend Spoken Word/Rap!' :
                       audioFeatures.speechiness > 0.6 ? 'Viel gesprochener Text (Rap-Style)' :
                       audioFeatures.speechiness > 0.33 ? 'Mix aus Gesang und Sprechen' : 'Überwiegend melodischer Gesang',
        icon: '🗣️'
      }
    ]
  }

  const featureInfo = getFeatureInfo()

  const getColorForValue = (value: number) => {
    if (value > 0.7) return 'text-green-400'
    if (value > 0.4) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getBarColor = (value: number) => {
    if (value > 0.7) return 'bg-green-500'
    if (value > 0.4) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <BackgroundGradient className="rounded-3xl p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="text-2xl">🎵</div>
        <div>
          <h2 className="text-2xl font-bold text-textPrimary">Audio Features Analyse</h2>
          <p className="text-textSecondary">Detaillierte musikalische Eigenschaften von "{track.name}"</p>
        </div>
      </div>

      {/* Radar Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-white/5 rounded-2xl p-6 mb-8"
      >
        <h3 className="text-lg font-semibold text-textPrimary mb-4 text-center">Audio Features Radar</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={featureInfo.slice(0, 7).map(f => ({ 
              feature: f.label, 
              value: Math.round(f.value * 100), 
              fullMark: 100 
            }))}>
              <PolarGrid stroke="#4A5568" strokeWidth={1} />
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
                name="Audio Features"
                dataKey="value"
                stroke="#FEC006"
                fill="#FEC006"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-center text-textSecondary mt-4">
          Klicken Sie auf die Features unten für detaillierte Erklärungen
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Features Liste */}
        <div className="space-y-4">
          {featureInfo.map((feature, index) => (
            <motion.div
              key={feature.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`bg-white/5 rounded-2xl p-6 transition-all duration-300 cursor-pointer hover:bg-white/10 ${
                selectedFeature === feature.key ? 'ring-2 ring-accent' : ''
              }`}
              onClick={() => setSelectedFeature(selectedFeature === feature.key ? null : feature.key)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{feature.icon}</span>
                  <h3 className="text-lg font-semibold text-textPrimary">{feature.label}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${getColorForValue(feature.value)}`}>
                    {Math.round(feature.value * 100)}%
                  </span>
                  <HelpCircle className="w-4 h-4 text-textSecondary" />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                <motion.div
                  className={`h-2 rounded-full ${getBarColor(feature.value)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${feature.value * 100}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                />
              </div>

              {/* Interpretation */}
              <p className={`text-sm font-medium ${getColorForValue(feature.value)} mb-2`}>
                {feature.interpretation}
              </p>

              {/* Expandierte Beschreibung */}
              {selectedFeature === feature.key && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 pt-4 border-t border-white/10"
                >
                  <p className="text-sm text-textSecondary leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Zusätzliche Technische Details */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white/5 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-textPrimary mb-4 flex items-center gap-2">
              <span className="text-xl">🎛️</span>
              Technische Parameter
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-textSecondary">Tempo</span>
                  <p className="text-xl font-bold text-accent">{audioFeatures.tempo?.toFixed(1)} BPM</p>
                  <p className="text-xs text-textSecondary">
                    {audioFeatures.tempo > 120 ? 'Schnell' : audioFeatures.tempo > 90 ? 'Mittel' : 'Langsam'}
                  </p>
                </div>
                
                <div>
                  <span className="text-sm text-textSecondary">Taktart</span>
                  <p className="text-xl font-bold text-accent">{audioFeatures.time_signature}/4</p>
                  <p className="text-xs text-textSecondary">
                    {audioFeatures.time_signature === 4 ? 'Standard (4/4)' : 
                     audioFeatures.time_signature === 3 ? 'Walzer (3/4)' : 
                     audioFeatures.time_signature === 2 ? '2/4 Takt' : 'Ungewöhnlich'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-sm text-textSecondary">Tonart</span>
                  <p className="text-xl font-bold text-accent">
                    {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][audioFeatures.key]}
                    {audioFeatures.mode === 1 ? ' Dur' : ' Moll'}
                  </p>
                  <p className="text-xs text-textSecondary">
                    {audioFeatures.mode === 1 ? 'Fröhlich/Positiv' : 'Melancholisch/Dramatisch'}
                  </p>
                </div>
                
                <div>
                  <span className="text-sm text-textSecondary">Lautstärke</span>
                  <p className="text-xl font-bold text-accent">{audioFeatures.loudness?.toFixed(1)} dB</p>
                  <p className="text-xs text-textSecondary">
                    {audioFeatures.loudness > -5 ? 'Sehr laut' : 
                     audioFeatures.loudness > -10 ? 'Laut' : 
                     audioFeatures.loudness > -20 ? 'Normal' : 'Leise'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Musik-Persönlichkeit */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white/5 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-textPrimary mb-4 flex items-center gap-2">
              <span className="text-xl">🎭</span>
              Musik-Persönlichkeit
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-textSecondary">Genre-Typ:</span>
                <span className="text-sm text-textPrimary font-medium">
                  {audioFeatures.energy > 0.7 && audioFeatures.danceability > 0.7 ? 'Dance/Electronic' :
                   audioFeatures.acousticness > 0.7 ? 'Folk/Acoustic' :
                   audioFeatures.speechiness > 0.6 ? 'Hip-Hop/Rap' :
                   audioFeatures.valence > 0.7 ? 'Pop/Upbeat' :
                   audioFeatures.valence < 0.3 ? 'Sad/Melancholic' : 'Alternative/Rock'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-textSecondary">Stimmung:</span>
                <span className="text-sm text-textPrimary font-medium">
                  {audioFeatures.valence > 0.7 && audioFeatures.energy > 0.7 ? 'Euphorisch 🎉' :
                   audioFeatures.valence > 0.6 ? 'Fröhlich 😊' :
                   audioFeatures.valence < 0.3 && audioFeatures.energy < 0.4 ? 'Melancholisch 😢' :
                   audioFeatures.energy > 0.8 ? 'Energetisch ⚡' : 'Entspannt 😌'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-textSecondary">Perfekt für:</span>
                <span className="text-sm text-textPrimary font-medium">
                  {audioFeatures.danceability > 0.8 ? 'Party & Tanzen' :
                   audioFeatures.energy > 0.8 ? 'Sport & Training' :
                   audioFeatures.valence < 0.3 ? 'Entspannung & Reflection' :
                   audioFeatures.acousticness > 0.7 ? 'Gemütliche Abende' : 'Alltag & Pendeln'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Hinweis */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-400 mb-1">Wie funktioniert das?</h4>
                <p className="text-sm text-textSecondary leading-relaxed">
                  Diese Werte werden von Spotify's Audio-Analyse-Algorithmus berechnet, der 
                  jeden Track analysiert und musikalische Eigenschaften automatisch erkennt. 
                  Klicken Sie auf eine Kategorie für detailliertere Erklärungen.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </BackgroundGradient>
  )
} 
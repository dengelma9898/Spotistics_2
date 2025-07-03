'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Play, Pause, ExternalLink, Info, Music, Clock, Calendar, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { getSpotifyApi } from '@/lib/spotify'
import { SpotifyTrack } from '@/types/spotify'
import { BackgroundGradient } from '@/components/ui/background-gradient'
import { Spotlight } from '@/components/ui/spotlight'

export default function TrackDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [track, setTrack] = useState<SpotifyTrack | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const trackId = params.id as string

  useEffect(() => {
    loadTrackDetails()
  }, [trackId, session])

  const loadTrackDetails = async () => {
    if (!session?.accessToken || !trackId) return

    try {
      setLoading(true)
      setError(null)
      setDebugInfo([])
      const spotifyApi = await getSpotifyApi()
      if (!spotifyApi) throw new Error('Spotify API nicht verfügbar')
      setDebugInfo(prev => [...prev, `🎵 Lade Track-Details für ID: ${trackId}`])
      const trackData = await spotifyApi.getTrackDetails(trackId)
      setTrack(trackData as SpotifyTrack)
      setDebugInfo(prev => [...prev, '✅ Track erfolgreich geladen'])
    } catch (error: any) {
      setError(error.message || 'Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-accent hover:underline">
          <ArrowLeft className="w-5 h-5" /> Zurück
        </button>
        <Spotlight className="mb-8" />
        {loading ? (
          <BackgroundGradient className="rounded-3xl p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">🎵</div>
              <h2 className="text-2xl font-bold text-textPrimary mb-4">Track wird geladen...</h2>
              <div className="flex justify-center">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          </BackgroundGradient>
        ) : error ? (
          <BackgroundGradient className="rounded-3xl p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-red-400 mb-4">Fehler</h2>
              <p className="text-textSecondary mb-6">{error}</p>
            </div>
          </BackgroundGradient>
        ) : track ? (
          <BackgroundGradient className="rounded-3xl p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <img src={track.album?.images?.[0]?.url || '/placeholder-album.png'} alt={track.name} className="w-64 h-64 rounded-2xl shadow-lg object-cover" />
              <div className="flex-1 space-y-4">
                <h1 className="text-3xl font-bold text-textPrimary">{track.name}</h1>
                <div className="flex flex-wrap gap-2 items-center">
                  {track.artists?.map(artist => (
                    <span key={artist.id} className="text-accent font-medium">{artist.name}</span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-textSecondary text-sm">
                  <span><Music className="inline w-4 h-4 mr-1" /> {track.album?.name}</span>
                  <span><Calendar className="inline w-4 h-4 mr-1" /> {track.album?.release_date}</span>
                  <span><Clock className="inline w-4 h-4 mr-1" /> {Math.round((track.duration_ms || 0) / 60000)}:{((track.duration_ms || 0) % 60000 / 1000).toFixed(0).padStart(2, '0')} min</span>
                  {track.explicit && <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded text-xs">Explicit</span>}
                </div>
                <div className="flex items-center gap-2">
                  <a href={track.external_urls?.spotify} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center gap-1">
                    <ExternalLink className="w-4 h-4" /> Auf Spotify öffnen
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-textSecondary">
                  <Users className="w-4 h-4" /> Popularität: {track.popularity}/100
                </div>
              </div>
            </div>
            {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                <h4 className="text-sm font-semibold text-yellow-400 mb-2">Debug Information:</h4>
                <div className="text-xs text-gray-300 space-y-1">
                  {debugInfo.map((info, index) => (
                    <div key={index}>{info}</div>
                  ))}
                </div>
              </div>
            )}
          </BackgroundGradient>
        ) : null}
      </div>
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Music, Clock, Calendar, Users, Album, Star, Headphones } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { getSpotifyApi } from '@/lib/spotify'
import { SpotifyTrack, SpotifyUser } from '@/types/spotify'
import { Header } from '@/components/Header'
import { TiltedCard, TiltedCardContent } from '@/components/ui/tilted-card'

export default function TrackDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [track, setTrack] = useState<SpotifyTrack | null>(null)
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const trackId = params.id as string

  useEffect(() => {
    if (session?.accessToken && trackId) {
      loadTrackDetails()
    }
  }, [trackId, session?.accessToken])

  const loadTrackDetails = async () => {
    if (!session?.accessToken || !trackId) return

    try {
      setLoading(true)
      setError(null)
      const spotifyApi = await getSpotifyApi()
      if (!spotifyApi) throw new Error('Spotify API nicht verfügbar')
      
      const [trackData, userData] = await Promise.all([
        spotifyApi.getTrackDetails(trackId),
        spotifyApi.getCurrentUser()
      ])
      
      setTrack(trackData as SpotifyTrack)
      setUser(userData)
    } catch (error: any) {
      setError(error.message || 'Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = ((ms % 60000) / 1000).toFixed(0)
    return `${minutes}:${Number(seconds).toString().padStart(2, '0')}`
  }

  const getPopularityLabel = (popularity: number) => {
    if (popularity >= 80) return { label: 'Hit', color: 'text-green-400', bg: 'bg-green-500/20' }
    if (popularity >= 60) return { label: 'Beliebt', color: 'text-blue-400', bg: 'bg-blue-500/20' }
    if (popularity >= 40) return { label: 'Bekannt', color: 'text-yellow-400', bg: 'bg-yellow-500/20' }
    return { label: 'Nische', color: 'text-purple-400', bg: 'bg-purple-500/20' }
  }

  return (
    <div className="min-h-screen bg-black">
      <Header user={user} />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button 
            onClick={() => router.back()} 
            className="mb-8 flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
            Zurück
          </button>

          {loading ? (
            <TiltedCard className="min-h-[400px]">
              <TiltedCardContent>
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                  <h2 className="text-2xl font-bold text-white mb-2">Track wird geladen</h2>
                  <p className="text-white/60">Einen Moment bitte...</p>
                </div>
              </TiltedCardContent>
            </TiltedCard>
          ) : error ? (
            <TiltedCard className="min-h-[400px]" backgroundGradient="from-red-900/30 via-gray-900/60 to-red-900/30">
              <TiltedCardContent>
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="text-6xl mb-6">❌</div>
                  <h2 className="text-2xl font-bold text-red-400 mb-4">Fehler beim Laden</h2>
                  <p className="text-white/70 mb-6">{error}</p>
                  <button 
                    onClick={loadTrackDetails}
                    className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-red-300 transition-colors"
                  >
                    Erneut versuchen
                  </button>
                </div>
              </TiltedCardContent>
            </TiltedCard>
          ) : track ? (
            <TiltedCard backgroundGradient="from-purple-900/40 via-slate-800/60 to-blue-900/40">
              <TiltedCardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Album Art */}
                  <div className="lg:col-span-1">
                    <div className="relative group">
                      <img 
                        src={track.album?.images?.[0]?.url || '/placeholder-album.png'} 
                        alt={track.name}
                        className="w-full aspect-square rounded-2xl object-cover shadow-2xl group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>

                  {/* Track Info */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Title & Artists */}
                    <div className="space-y-3">
                      <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                        {track.name}
                      </h1>
                      <div className="flex flex-wrap items-center gap-2">
                        <Headphones className="w-5 h-5 text-purple-400" />
                        {track.artists?.map((artist, index) => (
                          <span key={artist.id} className="text-xl text-white/90 font-medium">
                            {artist.name}
                            {index < track.artists.length - 1 && <span className="text-white/50 ml-2">,</span>}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Album & Release Info */}
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                      <Album className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      <div>
                        <p className="text-white font-medium">{track.album?.name}</p>
                        <p className="text-white/60 text-sm">Album • {track.album?.release_date}</p>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Duration */}
                      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                        <Clock className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-white font-medium">{formatDuration(track.duration_ms || 0)}</p>
                          <p className="text-white/60 text-sm">Dauer</p>
                        </div>
                      </div>

                      {/* Popularity */}
                      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                        <Star className="w-5 h-5 text-yellow-400" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{track.popularity}/100</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPopularityLabel(track.popularity).bg} ${getPopularityLabel(track.popularity).color}`}>
                              {getPopularityLabel(track.popularity).label}
                            </span>
                          </div>
                          <p className="text-white/60 text-sm">Popularität</p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="flex flex-wrap items-center gap-3">
                      {track.explicit && (
                        <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 rounded-full text-sm font-medium">
                          Explicit
                        </span>
                      )}
                      <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-full text-sm font-medium">
                        Track
                      </span>
                    </div>

                    {/* Spotify Link */}
                    <div className="pt-4">
                      <a 
                        href={track.external_urls?.spotify} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors group"
                      >
                        <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Auf Spotify anhören
                      </a>
                    </div>
                  </div>
                </div>
              </TiltedCardContent>
            </TiltedCard>
          ) : null}
        </div>
      </div>
    </div>
  )
} 
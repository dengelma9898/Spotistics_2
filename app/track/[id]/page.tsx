'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Music, Clock, Calendar, Users, Album, Star, Headphones, Award, Play, Pause, Volume2, SkipBack, SkipForward, Shuffle, Repeat } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { getSpotifyApi } from '@/lib/spotify'
import { SpotifyTrack, SpotifyUser } from '@/types/spotify'
import { Header } from '@/components/Header'
import { Spotlight } from '@/components/ui/spotlight'

export default function TrackDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [track, setTrack] = useState<SpotifyTrack | null>(null)
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Player states
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [playerError, setPlayerError] = useState<string | null>(null)
  const [volume, setVolume] = useState(70)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  const trackId = params.id as string

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.accessToken) return

      try {
        // Parallel API calls for better performance
        const [trackResponse, userResponse] = await Promise.all([
          fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
            headers: { 'Authorization': `Bearer ${session.accessToken}` }
          }),
          fetch('https://api.spotify.com/v1/me', {
            headers: { 'Authorization': `Bearer ${session.accessToken}` }
          })
        ])

        if (!trackResponse.ok) {
          throw new Error('Track nicht gefunden')
        }

        const [trackData, userData] = await Promise.all([
          trackResponse.json(),
          userResponse.ok ? userResponse.json() : null
        ])

        setTrack(trackData)
        setUser(userData)
      } catch (err) {
        console.error('Error fetching track:', err)
        setError(err instanceof Error ? err.message : 'Fehler beim Laden des Tracks')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session?.accessToken, trackId])

  // Audio progress tracking
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateProgress = () => {
      setProgress(audio.currentTime)
      setDuration(audio.duration || 0)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
    }

    const handleError = () => {
      setPlayerError('Wiedergabe nicht möglich')
      setIsPlaying(false)
    }

    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('loadedmetadata', updateProgress)

    return () => {
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('loadedmetadata', updateProgress)
    }
  }, [track])

  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  const handlePlayPause = async () => {
    if (!track) return

    try {
      setPlayerError(null)
      setIsLoading(true)

      // Check if user has Premium
      const isPremium = user?.product === 'premium'

      if (isPremium && session?.accessToken) {
        // Try to use Spotify Web API for full tracks
        try {
          const spotifyApi = await getSpotifyApi()
          if (spotifyApi) {
            if (isPlaying) {
              await spotifyApi.pausePlayback()
              setIsPlaying(false)
            } else {
              await spotifyApi.playTrack(track.uri || `spotify:track:${track.id}`)
              setIsPlaying(true)
            }
            return
          }
        } catch (apiError) {
          console.log('Spotify API playback failed, falling back to preview:', apiError)
        }
      }

      // Fallback to preview URL
      if (!track.preview_url) {
        setPlayerError('Keine Vorschau verfügbar - öffnen Sie den Track in Spotify')
        return
      }

      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause()
          setIsPlaying(false)
        } else {
          audioRef.current.src = track.preview_url
          await audioRef.current.play()
          setIsPlaying(true)
        }
      }
    } catch (error: any) {
      console.error('Playback error:', error)
      setPlayerError('Wiedergabe nicht möglich')
      setIsPlaying(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration
    
    audioRef.current.currentTime = newTime
    setProgress(newTime)
  }

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getPopularityLabel = (popularity: number) => {
    if (popularity >= 80) return { label: 'Hit', color: 'bg-green-500/20 text-green-600 border-green-500/30' }
    if (popularity >= 60) return { label: 'Beliebt', color: 'bg-blue-500/20 text-blue-600 border-blue-500/30' }
    if (popularity >= 40) return { label: 'Bekannt', color: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' }
    return { label: 'Nische', color: 'bg-purple-500/20 text-purple-600 border-purple-500/30' }
  }

  const getReleaseYear = (date: string) => {
    return new Date(date).getFullYear()
  }

  const getStreamingContext = (popularity: number) => {
    if (popularity >= 80) return {
      level: "Mega-Hit",
      description: "Millionen von Menschen streamen diesen Track täglich weltweit",
      icon: "🌟"
    }
    if (popularity >= 60) return {
      level: "Mainstream",
      description: "Sehr beliebter Track mit hohen Streaming-Zahlen",
      icon: "📈"
    }
    if (popularity >= 40) return {
      level: "Bekannt",
      description: "Solider Track mit stabilen Streaming-Zahlen",
      icon: "👍"
    }
    return {
      level: "Underground",
      description: "Geheimtipp für Musik-Entdecker",
      icon: "💎"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
        {/* Aurora Background Effect */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_farthest-side_at_0_100%,#00ccb1,transparent),radial-gradient(circle_farthest-side_at_100%_0,#7b61ff,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#ffc414,transparent),radial-gradient(circle_farthest-side_at_0_0,#1ca0fb,#141316)] animate-aurora bg-[length:400%_400%]" />
        </div>
        
        <Spotlight 
          className="-top-40 left-0 md:-top-20 md:left-60"
          fill="white"
        />
        
        <Header user={user} />
        <div className="flex items-center justify-center min-h-[70vh] relative z-10">
          <motion.div
            className="flex items-center gap-4 text-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Music className="text-blue-500" size={32} />
            </motion.div>
            <span className="text-gray-300">Lade Track-Details...</span>
          </motion.div>
        </div>
      </div>
    )
  }

  if (error || !track) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
        {/* Aurora Background Effect */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_farthest-side_at_0_100%,#00ccb1,transparent),radial-gradient(circle_farthest-side_at_100%_0,#7b61ff,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#ffc414,transparent),radial-gradient(circle_farthest-side_at_0_0,#1ca0fb,#141316)] animate-aurora bg-[length:400%_400%]" />
        </div>
        
        <Header user={user} />
        <div className="max-w-4xl mx-auto px-6 py-20 relative z-10">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-6xl mb-4">🎵</div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Track nicht gefunden
            </h1>
            <p className="text-gray-400 mb-8">
              {error || 'Der Track konnte nicht geladen werden.'}
            </p>
            <button
              onClick={() => router.back()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Zurück
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  const popularityInfo = getPopularityLabel(track.popularity)
  const albumImage = track.album.images[0]?.url || '/placeholder-album.png'
  const releaseYear = getReleaseYear(track.album.release_date)
  const streamingContext = getStreamingContext(track.popularity)
  const isPremium = user?.product === 'premium'
  const hasPreview = !!track.preview_url

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
      {/* Aurora Background Effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_farthest-side_at_0_100%,#00ccb1,transparent),radial-gradient(circle_farthest-side_at_100%_0,#7b61ff,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#ffc414,transparent),radial-gradient(circle_farthest-side_at_0_0,#1ca0fb,#141316)] animate-aurora bg-[length:400%_400%]" />
      </div>
      
      {/* Main Spotlight Effect */}
      <Spotlight 
        className="-top-40 left-0 md:-top-20 md:left-60"
        fill="white"
      />
      
      <Header user={user} />
      
      {/* Hidden Audio Element */}
      {hasPreview && (
        <audio ref={audioRef} preload="none" />
      )}
      
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Navigation */}
        <motion.button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -5 }}
        >
          <ArrowLeft size={20} />
          <span>Zurück</span>
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Album Art & Quick Info */}
          <motion.div
            className="lg:col-span-4"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="space-y-6">
              {/* Album Art Card */}
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                <div className="relative group">
                  <img
                    src={albumImage}
                    alt={`${track.album.name} Cover`}
                    className="w-full aspect-square object-cover rounded-2xl shadow-2xl group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <motion.button
                      onClick={handlePlayPause}
                      disabled={isLoading || (!isPremium && !hasPreview)}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white p-6 rounded-full shadow-2xl"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {isLoading ? (
                        <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      ) : isPlaying ? (
                        <Pause size={32} />
                      ) : (
                        <Play size={32} className="ml-1" />
                      )}
                    </motion.button>
                  </div>
                  
                  {/* Premium Badge */}
                  {isPremium && (
                    <div className="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                      Premium
                    </div>
                  )}
                  
                  {/* Floating Album Info */}
                  <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="text-white">
                      <p className="font-semibold text-lg">{track.album.name}</p>
                      <p className="text-sm opacity-90">{releaseYear}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <Clock className="text-blue-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-400">Dauer</p>
                      <p className="font-semibold text-white">
                        {formatDuration(track.duration_ms)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <Star className="text-yellow-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-400">Beliebtheit</p>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {track.popularity}%
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full border ${popularityInfo.color}`}>
                          {popularityInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            className="lg:col-span-8 space-y-8"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Track Title & Artist */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                    {track.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    {track.artists.map((artist, index) => (
                      <span key={artist.id} className="text-xl text-gray-300">
                        {artist.name}
                        {index < track.artists.length - 1 && (
                          <span className="text-gray-500 mx-2">•</span>
                        )}
                      </span>
                    ))}
                  </div>
                  
                  {/* Track Features */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {track.explicit && (
                      <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full border border-red-500/30">
                        <Award size={14} className="inline mr-1" />
                        Explicit
                      </span>
                    )}
                    <span className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full border border-gray-500/30">
                      <Users size={14} className="inline mr-1" />
                      {track.artists.length} Künstler
                    </span>
                    <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30">
                      <Calendar size={14} className="inline mr-1" />
                      {track.album.album_type}
                    </span>
                  </div>
                </div>
                
                <motion.a
                  href={track.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full transition-colors ml-6 flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ExternalLink size={24} />
                </motion.a>
              </div>
            </div>

            {/* Advanced Music Player */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <Headphones className="text-green-400" size={28} />
                  <h2 className="text-2xl font-semibold text-white">
                    Music Player
                  </h2>
                  {isPremium && (
                    <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
                      Premium
                    </span>
                  )}
                </div>
                
                {/* Player Controls */}
                <div className="space-y-6">
                  {/* Main Controls */}
                  <div className="flex items-center justify-center gap-6">
                    <button
                      className="text-gray-400 hover:text-white transition-colors"
                      disabled
                    >
                      <Shuffle size={20} />
                    </button>
                    
                    <button
                      className="text-gray-400 hover:text-white transition-colors"
                      disabled
                    >
                      <SkipBack size={24} />
                    </button>
                    
                    <motion.button
                      onClick={handlePlayPause}
                      disabled={isLoading || (!isPremium && !hasPreview)}
                      className="bg-white text-black p-4 rounded-full hover:scale-105 disabled:bg-gray-500 disabled:text-gray-300 transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isLoading ? (
                        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : isPlaying ? (
                        <Pause size={24} />
                      ) : (
                        <Play size={24} className="ml-1" />
                      )}
                    </motion.button>
                    
                    <button
                      className="text-gray-400 hover:text-white transition-colors"
                      disabled
                    >
                      <SkipForward size={24} />
                    </button>
                    
                    <button
                      className="text-gray-400 hover:text-white transition-colors"
                      disabled
                    >
                      <Repeat size={20} />
                    </button>
                  </div>
                  
                  {/* Progress Bar */}
                  {hasPreview && (
                    <div className="space-y-2">
                      <div 
                        className="w-full bg-gray-700/50 rounded-full h-2 cursor-pointer"
                        onClick={handleSeek}
                      >
                        <div 
                          className="h-2 bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-100"
                          style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{formatTime(progress)}</span>
                        <span>{formatTime(duration || track.duration_ms / 1000)}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Volume Control */}
                  <div className="flex items-center gap-3">
                    <Volume2 className="text-gray-400" size={20} />
                    <div className="flex-1 relative">
                      {/* Custom Volume Bar */}
                      <div className="w-full bg-gray-700/50 rounded-full h-2 cursor-pointer relative overflow-hidden">
                        {/* Animated Background Gradient */}
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full opacity-20"
                          animate={{
                            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                          style={{
                            backgroundSize: '200% 100%'
                          }}
                        />
                        
                        {/* Volume Fill */}
                        <motion.div 
                          className="h-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 rounded-full relative"
                          initial={{ width: 0 }}
                          animate={{ width: `${volume}%` }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          {/* Glowing Effect */}
                          <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse" />
                        </motion.div>
                        
                        {/* Volume Thumb */}
                        <motion.div
                          className="absolute top-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-gray-300 -translate-y-1/2 cursor-pointer"
                          style={{ left: `calc(${volume}% - 8px)` }}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-50" />
                        </motion.div>
                      </div>
                      
                      {/* Hidden Range Input for Functionality */}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Volume Level Indicator */}
                      <div className="flex gap-1">
                        {[20, 40, 60, 80, 100].map((level) => (
                          <motion.div
                            key={level}
                            className={`w-1 rounded-full transition-all duration-200 ${
                              volume >= level
                                ? 'bg-green-400 h-3'
                                : 'bg-gray-600 h-2'
                            }`}
                            animate={{
                              height: volume >= level ? 12 : 8,
                              backgroundColor: volume >= level ? '#4ade80' : '#4b5563'
                            }}
                            transition={{ duration: 0.2 }}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-400 w-10 font-medium">{volume}%</span>
                    </div>
                  </div>
                  
                  {/* Player Status */}
                  <div className="text-center">
                    {playerError && (
                      <p className="text-red-400 text-sm mb-2">{playerError}</p>
                    )}
                    {!isPremium && !hasPreview && (
                      <p className="text-yellow-400 text-sm">
                        Keine Vorschau verfügbar - Premium erforderlich für vollständige Wiedergabe
                      </p>
                    )}
                    {!isPremium && hasPreview && (
                      <p className="text-blue-400 text-sm">
                        30-Sekunden-Vorschau verfügbar
                      </p>
                    )}
                    {isPremium && (
                      <p className="text-green-400 text-sm">
                        Premium: Vollständige Wiedergabe verfügbar
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Streaming Context & Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">{streamingContext.icon}</span>
                  <h2 className="text-2xl font-semibold text-white">
                    Streaming-Analyse
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {streamingContext.level}
                      </h3>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {streamingContext.description}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Popularitäts-Score</span>
                        <span className="text-sm font-medium text-white">{track.popularity}/100</span>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-2">
                        <motion.div 
                          className="h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${track.popularity}%` }}
                          transition={{ delay: 0.8, duration: 1.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Track-Details
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Album</span>
                          <span className="text-sm text-white">{track.album.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Release</span>
                          <span className="text-sm text-white">
                            {new Date(track.album.release_date).toLocaleDateString('de-DE', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Track #</span>
                          <span className="text-sm text-white">
                            {track.track_number} von {track.album.total_tracks}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { 
  ListMusic, 
  Clock, 
  Play, 
  MoreVertical,
  X,
  Music
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { SpotifyApi } from '@/lib/spotify'

interface QueueTrack {
  id: string
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string }[]
  }
  duration_ms: number
  uri: string
  explicit: boolean
}

interface QueueDisplayProps {
  spotifyApi: SpotifyApi | null
  isPremium: boolean
  className?: string
}

export function QueueDisplay({ spotifyApi, isPremium, className = '' }: QueueDisplayProps) {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<QueueTrack | null>(null)
  const [queue, setQueue] = useState<QueueTrack[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState<any>(null)

  // Load Queue Data
  const loadQueue = async () => {
    if (!spotifyApi || !isPremium) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Get current playback state
      const playbackState = await spotifyApi.getCurrentPlayback()
      
      if (playbackState && playbackState.item) {
        // Store device info for debugging
        setDeviceInfo(playbackState.device)
        
        setCurrentlyPlaying({
          id: playbackState.item.id,
          name: playbackState.item.name,
          artists: playbackState.item.artists,
          album: playbackState.item.album,
          duration_ms: playbackState.item.duration_ms,
          uri: playbackState.item.uri,
          explicit: playbackState.item.explicit
        })
        
        // Get queue (this might not be available in all API versions)
        try {
          const queueData = await spotifyApi.getQueue()
          if (queueData && queueData.queue) {
            setQueue(queueData.queue.slice(0, 20)) // Show max 20 tracks
          }
        } catch (queueError) {
          console.log('Queue API nicht verfügbar, verwende Fallback')
          // Fallback: Show empty queue message
          setQueue([])
        }
      } else {
        setCurrentlyPlaying(null)
        setQueue([])
      }
    } catch (error: any) {
      console.error('Fehler beim Laden der Queue:', error)
      setError(`Fehler beim Laden: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadQueue()
    
    // Update queue every 10 seconds
    const interval = setInterval(loadQueue, 10000)
    return () => clearInterval(interval)
  }, [spotifyApi, isPremium])

  // Format duration
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Calculate total queue time
  const getTotalQueueTime = () => {
    const totalMs = queue.reduce((total, track) => total + track.duration_ms, 0)
    const hours = Math.floor(totalMs / 3600000)
    const minutes = Math.floor((totalMs % 3600000) / 60000)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // Play specific track from queue (if possible)
  const playTrack = async (uri: string) => {
    if (!spotifyApi) return
    
    try {
      await spotifyApi.play({ uris: [uri] })
      // Refresh queue after playing
      setTimeout(loadQueue, 1000)
    } catch (error) {
      console.error('Fehler beim Abspielen:', error)
    }
  }

  if (!isPremium) {
    return (
      <div className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ListMusic className="w-8 h-8 text-yellow-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Wiedergabe-Queue</h3>
          <p className="text-gray-400 text-sm">
            Spotify Premium erforderlich für Queue-Anzeige
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden ${className}`}
      layout
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-2xl">
              <ListMusic className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Wiedergabe-Queue</h3>
              <p className="text-gray-400 text-sm">
                {queue.length > 0 ? `${queue.length} Songs • ${getTotalQueueTime()}` : 'Keine Songs in der Queue'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isExpanded ? <X className="w-5 h-5" /> : <MoreVertical className="w-5 h-5" />}
          </button>
        </div>
        
        {/* Debug Info */}
        <div className="mt-3 p-2 bg-gray-500/10 rounded-lg">
          <div className="text-xs text-gray-400 space-y-1">
            <div>🎵 Queue Device: {deviceInfo?.id ? deviceInfo.id.substring(0, 8) + '...' : 'Unbekannt'}</div>
            {deviceInfo && (
              <div>📻 {deviceInfo.name} ({deviceInfo.type}) - {deviceInfo.is_active ? 'Aktiv' : 'Inaktiv'}</div>
            )}
          </div>
        </div>
      </div>

      {/* Current Track */}
      {currentlyPlaying && (
        <div className="p-6 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentlyPlaying.album.images[0]?.url || '/placeholder-album.png'}
                alt={currentlyPlaying.album.name}
                className="w-16 h-16 rounded-xl object-cover"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-green-400 bg-green-500/20 px-2 py-1 rounded-lg">
                  Spielt gerade
                </span>
                {currentlyPlaying.explicit && (
                  <span className="text-xs font-medium text-gray-400 bg-gray-500/20 px-2 py-1 rounded-lg">
                    E
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-white truncate">{currentlyPlaying.name}</h4>
              <p className="text-gray-400 truncate text-sm">
                {currentlyPlaying.artists.map(artist => artist.name).join(', ')}
              </p>
              <p className="text-gray-500 truncate text-xs">{currentlyPlaying.album.name}</p>
            </div>
            <div className="text-xs text-gray-400">
              {formatDuration(currentlyPlaying.duration_ms)}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="p-6 text-center">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Lade Queue...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6 text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={loadQueue}
            className="mt-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 text-sm transition-colors"
          >
            Neu versuchen
          </button>
        </div>
      )}

      {/* Queue List */}
      <AnimatePresence>
        {(isExpanded || queue.length === 0) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="max-h-96 overflow-y-auto"
          >
            {queue.length > 0 ? (
              <div className="divide-y divide-white/10">
                {queue.map((track, index) => (
                  <motion.div
                    key={`${track.id}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-white/5 transition-colors group cursor-pointer"
                    onClick={() => playTrack(track.uri)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 text-gray-400 text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      
                      <div className="relative flex-shrink-0">
                        <img
                          src={track.album.images[0]?.url || '/placeholder-album.png'}
                          alt={track.album.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-4 h-4 text-white ml-0.5" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium text-white truncate text-sm">{track.name}</h5>
                          {track.explicit && (
                            <span className="text-xs font-medium text-gray-400 bg-gray-500/20 px-1.5 py-0.5 rounded">
                              E
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 truncate text-xs">
                          {track.artists.map(artist => artist.name).join(', ')}
                        </p>
                        <p className="text-gray-500 truncate text-xs">{track.album.name}</p>
                      </div>

                      <div className="text-xs text-gray-400 flex-shrink-0">
                        {formatDuration(track.duration_ms)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              !isLoading && !error && (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Music className="w-8 h-8 text-gray-500" />
                  </div>
                  <h4 className="text-white font-medium mb-2">Keine Songs in der Queue</h4>
                  <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
                    Füge Songs zu deiner Queue hinzu, oder sie werden hier angezeigt, wenn verfügbar.
                  </p>
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Stats */}
      {!isExpanded && queue.length > 0 && (
        <div className="p-4 bg-white/5 text-center">
          <p className="text-sm text-gray-400">
            <Clock className="w-4 h-4 inline mr-1" />
            {queue.length} Songs • {getTotalQueueTime()} verbleibend
          </p>
        </div>
      )}
    </motion.div>
  )
} 
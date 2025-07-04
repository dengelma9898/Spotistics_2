'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Repeat, 
  Shuffle,
  Monitor,
  Heart,
  MoreHorizontal,
  Maximize2
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { SpotifyApi } from '@/lib/spotify'
import { SpotifyTrack } from '@/types/spotify'

// Spotify Web Playback SDK Types
interface WebPlaybackState {
  context: {
    uri: string | null
    metadata: any
  }
  disallows: {
    pausing: boolean
    peeking_next: boolean
    peeking_prev: boolean
    resuming: boolean
    seeking: boolean
    skipping_next: boolean
    skipping_prev: boolean
  }
  paused: boolean
  position: number
  repeat_mode: number // 0 = no repeat, 1 = repeat context, 2 = repeat track
  shuffle: boolean
  track_window: {
    current_track: any
    next_tracks: any[]
    previous_tracks: any[]
  }
}

interface AdvancedPlayerProps {
  spotifyApi: SpotifyApi | null
  isPremium: boolean
  selectedDeviceId: string | null
  className?: string
}

export function AdvancedPlayer({ spotifyApi, isPremium, selectedDeviceId, className = '' }: AdvancedPlayerProps) {
  const [player, setPlayer] = useState<any>(null)
  const [isReady, setIsReady] = useState(false)
  const [deviceId, setDeviceId] = useState<string>('')
  const [playbackState, setPlaybackState] = useState<WebPlaybackState | null>(null)
  const [volume, setVolume] = useState(0.5)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (!isPremium || !spotifyApi) return

    const initializePlayer = async () => {
      setIsConnecting(true)
      setError(null)

      try {
        // Load Spotify Web Playback SDK
        if (!window.Spotify) {
          await loadSpotifySDK()
        }

        const spotifyPlayer = new window.Spotify.Player({
          name: 'Spotistics Advanced Player',
          getOAuthToken: (cb: (token: string) => void) => {
            cb(spotifyApi.getAccessToken())
          },
          volume: volume
        })

        // Event Listeners
        spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
          console.log('Advanced Player ready with Device ID', device_id)
          setDeviceId(device_id)
          setIsReady(true)
          setIsConnecting(false)
        })

        spotifyPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
          console.log('Advanced Player offline', device_id)
          setIsReady(false)
        })

        spotifyPlayer.addListener('player_state_changed', (state: WebPlaybackState | null) => {
          if (state) {
            setPlaybackState(state)
            setPosition(state.position)
            setDuration(state.track_window.current_track?.duration_ms || 0)
          }
        })

        // Error Listeners
        spotifyPlayer.addListener('initialization_error', ({ message }: { message: string }) => {
          setError(`Initialisierung fehlgeschlagen: ${message}`)
          setIsConnecting(false)
        })

        spotifyPlayer.addListener('authentication_error', ({ message }: { message: string }) => {
          setError(`Authentifizierung fehlgeschlagen: ${message}`)
          setIsConnecting(false)
        })

        spotifyPlayer.addListener('account_error', ({ message }: { message: string }) => {
          setError(`Account-Problem: ${message}`)
          setIsConnecting(false)
        })

        // Connect the player
        const connected = await spotifyPlayer.connect()
        if (!connected) {
          setError('Verbindung zum Player fehlgeschlagen')
          setIsConnecting(false)
        }

        setPlayer(spotifyPlayer)

      } catch (error: any) {
        console.error('Fehler beim Initialisieren des Players:', error)
        setError(`Fehler: ${error.message}`)
        setIsConnecting(false)
      }
    }

    initializePlayer()

    return () => {
      if (player) {
        player.disconnect()
      }
    }
  }, [isPremium, spotifyApi])

  // Load Spotify Web Playback SDK
  const loadSpotifySDK = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.Spotify) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://sdk.scdn.co/spotify-player.js'
      script.async = true
      
      document.body.appendChild(script)

      window.onSpotifyWebPlaybackSDKReady = () => {
        resolve()
      }

      script.onerror = () => {
        reject(new Error('Spotify SDK konnte nicht geladen werden'))
      }
    })
  }

  // Position Update Effect
  useEffect(() => {
    if (!playbackState || playbackState.paused) return

    const interval = setInterval(() => {
      setPosition(prev => Math.min(prev + 1000, duration))
    }, 1000)

    return () => clearInterval(interval)
  }, [playbackState?.paused, duration])

  // Player Controls
  const togglePlayPause = async () => {
    if (!player) return
    try {
      await player.togglePlay()
    } catch (error) {
      console.error('Fehler beim Toggle Play/Pause:', error)
    }
  }

  const skipToPrevious = async () => {
    if (!player) return
    try {
      await player.previousTrack()
    } catch (error) {
      console.error('Fehler beim Previous Track:', error)
    }
  }

  const skipToNext = async () => {
    if (!player) return
    try {
      await player.nextTrack()
    } catch (error) {
      console.error('Fehler beim Next Track:', error)
    }
  }

  const seek = async (positionMs: number) => {
    if (!player) return
    try {
      await player.seek(positionMs)
      setPosition(positionMs)
    } catch (error) {
      console.error('Fehler beim Seek:', error)
    }
  }

  const setPlayerVolume = async (newVolume: number) => {
    if (!player) return
    try {
      await player.setVolume(newVolume)
      setVolume(newVolume)
    } catch (error) {
      console.error('Fehler beim Volume ändern:', error)
    }
  }

  const toggleShuffle = async () => {
    if (!spotifyApi || !playbackState) return
    try {
      await spotifyApi.setShuffle(!playbackState.shuffle, deviceId)
    } catch (error) {
      console.error('Fehler beim Shuffle toggle:', error)
    }
  }

  const toggleRepeat = async () => {
    if (!spotifyApi || !playbackState) return
    try {
      const newMode = playbackState.repeat_mode === 0 ? 'context' : 
                     playbackState.repeat_mode === 1 ? 'track' : 'off'
      await spotifyApi.setRepeat(newMode, deviceId)
    } catch (error) {
      console.error('Fehler beim Repeat toggle:', error)
    }
  }

  // Format time
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const currentTrack = playbackState?.track_window.current_track

  if (!isPremium) {
    return (
      <div className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Monitor className="w-8 h-8 text-yellow-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Advanced Player</h3>
          <p className="text-gray-400 text-sm">
            Spotify Premium erforderlich für erweiterte Player-Features
          </p>
        </div>
      </div>
    )
  }

  if (isConnecting) {
    return (
      <div className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Player wird initialisiert...</h3>
          <p className="text-gray-400 text-sm">
            Verbindung zum Spotify Web Playback SDK wird hergestellt
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-500/10 backdrop-blur-xl rounded-2xl border border-red-500/20 p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-300 mb-2">Player-Fehler</h3>
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!isReady || !currentTrack) {
    return (
      <div className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Advanced Player bereit</h3>
          <p className="text-gray-400 text-sm">
            Starte einen Song in Spotify, um ihn hier zu steuern
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
      {/* Main Player */}
      <div className="p-6">
        {/* Track Info */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src={currentTrack.album?.images?.[0]?.url || '/placeholder-album.png'}
            alt={currentTrack.album?.name || 'Album'}
            className="w-16 h-16 rounded-xl object-cover"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{currentTrack.name}</h3>
            <p className="text-gray-400 truncate">
              {currentTrack.artists?.map((artist: any) => artist.name).join(', ')}
            </p>
            <p className="text-gray-500 text-sm truncate">{currentTrack.album?.name}</p>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Maximize2 className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs text-gray-400 w-10">{formatTime(position)}</span>
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max={duration}
                value={position}
                onChange={(e) => seek(parseInt(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                disabled={playbackState?.disallows.seeking}
              />
            </div>
            <span className="text-xs text-gray-400 w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-lg transition-colors ${
              playbackState?.shuffle 
                ? 'bg-green-500/20 text-green-400' 
                : 'hover:bg-white/10 text-gray-400'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={skipToPrevious}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300"
            disabled={playbackState?.disallows.peeking_prev}
            title="Previous Track"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={togglePlayPause}
            className="p-4 bg-white hover:bg-gray-200 rounded-full transition-all text-black"
            disabled={playbackState?.disallows.pausing && playbackState?.disallows.resuming}
            title={playbackState?.paused ? 'Play' : 'Pause'}
          >
            {playbackState?.paused ? (
              <Play className="w-6 h-6 ml-0.5" />
            ) : (
              <Pause className="w-6 h-6" />
            )}
          </button>

          <button
            onClick={skipToNext}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300"
            disabled={playbackState?.disallows.peeking_next}
            title="Next Track"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`p-2 rounded-lg transition-colors ${
              playbackState?.repeat_mode !== 0 
                ? 'bg-green-500/20 text-green-400' 
                : 'hover:bg-white/10 text-gray-400'
            }`}
            title={`Repeat ${playbackState?.repeat_mode === 2 ? 'Track' : 'Context'}`}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPlayerVolume(volume === 0 ? 0.5 : 0)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setPlayerVolume(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          />
          <span className="text-xs text-gray-400 w-8">{Math.round(volume * 100)}</span>
        </div>
      </div>

      {/* Expanded View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 p-6 bg-white/5"
          >
            <h4 className="font-semibold text-white mb-4">Queue & Features</h4>
            
            {/* Next Tracks */}
            {playbackState?.track_window.next_tracks.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-400 mb-2">Als Nächstes</h5>
                <div className="space-y-2">
                  {playbackState.track_window.next_tracks.slice(0, 3).map((track: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <img
                        src={track.album?.images?.[0]?.url || '/placeholder-album.png'}
                        alt={track.album?.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white truncate">{track.name}</p>
                        <p className="text-gray-400 truncate text-xs">
                          {track.artists?.map((artist: any) => artist.name).join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </motion.div>
  )
}

// Extend Window interface for Spotify SDK
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
} 
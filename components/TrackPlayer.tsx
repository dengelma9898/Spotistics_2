'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, Music, ExternalLink, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SpotifyTrack } from '@/types/spotify'
import { formatDuration, getSpotifyApi, isCurrentlyPlaying } from '@/lib/spotify'
import { Track } from '@spotify/web-api-ts-sdk'

interface TrackPlayerProps {
  track: SpotifyTrack | Track
  rank?: number
  isPremium?: boolean
  selectedDeviceId?: string | null
}

export function TrackPlayer({ track, rank, isPremium = false, selectedDeviceId }: TrackPlayerProps) {
  const router = useRouter()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const hasPreview = !!track.preview_url

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [])

  // Check if currently playing via Spotify (nur für Premium)
  useEffect(() => {
    if (isPremium) {
      const checkPlayingStatus = async () => {
        try {
          const playing = await isCurrentlyPlaying(track.id)
          setIsPlaying(playing)
        } catch (error) {
          // Ignoriere Fehler bei Status-Check
        }
      }
      
      checkPlayingStatus()
      const interval = setInterval(checkPlayingStatus, 5000) // Check alle 5 Sekunden
      return () => clearInterval(interval)
    }
  }, [isPremium, track.id])

  const handlePlayPause = async () => {
    try {
      setError(null)
      setIsLoading(true)

      if (isPremium) {
        // Premium: Nutze Web API für vollständige Tracks mit Device-ID
        if (!selectedDeviceId) {
          setError('Bitte wähle ein Gerät aus')
          return
        }
        
                  const spotifyApi = await getSpotifyApi()
          if (!spotifyApi) {
            setError('Spotify API nicht verfügbar')
            return
          }
          
          if (isPlaying) {
            await spotifyApi.player.pausePlayback(selectedDeviceId)
            setIsPlaying(false)
          } else {
            await spotifyApi.player.startResumePlayback(selectedDeviceId, undefined, [track.uri || `spotify:track:${track.id}`])
            setIsPlaying(true)
          }
      } else {
        // Fallback: Nutze Preview-URL für 30-Sekunden-Previews
        if (!hasPreview) {
          setError('Keine Vorschau verfügbar')
          return
        }

        if (audioRef.current) {
          if (isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
          } else {
            audioRef.current.src = track.preview_url!
            await audioRef.current.play()
            setIsPlaying(true)
          }
        }
      }
    } catch (error: any) {
      console.error('Fehler beim Abspielen:', error)
      
      // Spezifische Fehlerbehandlung
      if (error.message?.includes('Kein aktives Spotify-Gerät')) {
        setError('Öffnen Sie Spotify auf einem Gerät')
      } else if (error.message?.includes('Premium')) {
        setError('Premium erforderlich')
      } else if (error.message?.includes('404')) {
        setError('Gerät nicht verfügbar')
      } else {
        setError('Wiedergabe nicht möglich')
      }
      
      setIsPlaying(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  const handleAudioError = () => {
    setError('Wiedergabe nicht möglich')
    setIsPlaying(false)
  }

  const openInSpotify = () => {
    if (track.external_urls?.spotify) {
      window.open(track.external_urls.spotify, '_blank')
    }
  }

  const openTrackDetails = () => {
    router.push(`/track/${track.id}`)
  }

  const getPlayButtonTooltip = () => {
    if (isPremium) {
      return 'Vollständigen Track über Spotify abspielen'
    }
    return hasPreview ? '30-Sekunden-Vorschau abspielen' : 'Keine Vorschau verfügbar'
  }

  const canPlay = isPremium || hasPreview

  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-all duration-200 group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Audio Element für Preview-Wiedergabe */}
      {hasPreview && (
        <audio
          ref={audioRef}
          onEnded={handleAudioEnded}
          onError={handleAudioError}
          preload="none"
        />
      )}
      
      {/* Rang */}
      <div className="w-6 text-textSecondary text-sm font-medium flex-shrink-0">
        {rank}
      </div>

      {/* Album Cover mit Play Button */}
      <div className="relative w-12 h-12 flex-shrink-0 group">
        <img
          src={track.album.images[0]?.url || '/placeholder-album.png'}
          alt={track.album.name}
          className="w-full h-full object-cover rounded"
        />
        
        {/* Play/Pause Button Overlay */}
        {canPlay && (
          <div 
            className={`absolute inset-0 flex items-center justify-center bg-black/60 rounded transition-opacity duration-200 cursor-pointer ${
              isHovered || isPlaying ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={handlePlayPause}
            title={getPlayButtonTooltip()}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </div>
        )}

        {/* Premium Badge */}
        {isPremium && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border border-cardBackground" 
               title="Premium-Features verfügbar" />
        )}

        {/* Status Indicator */}
        {isPlaying && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-cardBackground animate-pulse" 
               title="Wird abgespielt" />
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-textPrimary truncate">
            {track.name}
          </h4>
          {track.explicit && (
            <span className="text-xs bg-textSecondary text-background px-1 rounded">
              E
            </span>
          )}
        </div>
        <p className="text-sm text-textSecondary truncate">
          {track.artists.map(artist => artist.name).join(', ')}
        </p>
        
        {/* Fehler-Anzeige */}
        {error && (
          <div className="flex items-center gap-1 mt-1">
            <p className="text-xs text-red-400">{error}</p>
            {error.includes('Gerät') && (
              <button
                onClick={openInSpotify}
                className="text-xs text-accent hover:underline"
              >
                In Spotify öffnen
              </button>
            )}
          </div>
        )}
        
        {/* Album Name */}
        <p className="text-xs text-textSecondary/70 truncate mt-0.5">
          {track.album.name}
        </p>
      </div>

      {/* Duration und Popularity */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-sm text-textSecondary">
          {formatDuration(track.duration_ms)}
        </span>
        <div className="flex items-center gap-1">
          <Music className="w-3 h-3 text-textSecondary" />
          <span className="text-xs text-textSecondary">
            {track.popularity}%
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Status Indicator */}
        <div className="w-2 h-2">
          {isPlaying && (
            <div className="w-full h-full bg-accent rounded-full animate-pulse" />
          )}
        </div>

        {/* Track Details */}
        <button
          onClick={openTrackDetails}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-white/10 rounded"
          title="Track-Details anzeigen"
        >
          <Info className="w-4 h-4 text-textSecondary hover:text-green-400" />
        </button>

        {/* External Link */}
        <button
          onClick={openInSpotify}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-white/10 rounded"
          title="In Spotify öffnen"
        >
          <ExternalLink className="w-4 h-4 text-textSecondary hover:text-accent" />
        </button>
      </div>
    </div>
  )
} 
'use client'

import { useState } from 'react'
import { Play, Pause, Crown, Trophy, Award, Info, Clock, ExternalLink, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SpotifyTrack, SpotifyArtist } from '@/types/spotify'

interface RankingCardProps {
  item: SpotifyTrack | SpotifyArtist
  rank: number
  type: 'track' | 'artist'
  onPlay?: (uri: string) => void
  onPause?: () => void
  onAddToQueue?: (uri: string) => void
  isPlaying?: boolean
  currentTrack?: string
  showContext?: boolean
}

export function RankingCard({ 
  item, 
  rank, 
  type, 
  onPlay, 
  onPause, 
  onAddToQueue,
  isPlaying, 
  currentTrack,
  showContext = true 
}: RankingCardProps) {
  const router = useRouter()
  const [showTooltip, setShowTooltip] = useState(false)
  const [imageError, setImageError] = useState(false)

  const isPodium = rank <= 3
  const isCurrentlyPlaying = type === 'track' && isPlaying && currentTrack === (item as SpotifyTrack).uri

  const getPodiumStyle = () => {
    if (!isPodium) return {}
    
    const styles = {
      1: {
        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        boxShadow: '0 8px 32px rgba(255, 215, 0, 0.3), 0 0 20px rgba(255, 215, 0, 0.4)',
        transform: 'translateY(-8px)',
      },
      2: {
        background: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)',
        boxShadow: '0 6px 24px rgba(192, 192, 192, 0.25), 0 0 15px rgba(192, 192, 192, 0.3)',
        transform: 'translateY(-4px)',
      },
      3: {
        background: 'linear-gradient(135deg, #CD7F32 0%, #B8860B 100%)',
        boxShadow: '0 4px 16px rgba(205, 127, 50, 0.2), 0 0 10px rgba(205, 127, 50, 0.25)',
        transform: 'translateY(-2px)',
      }
    }
    return styles[rank as keyof typeof styles] || {}
  }

  const getPodiumIcon = () => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-300" />
      case 2: return <Trophy className="w-5 h-5 text-gray-300" />
      case 3: return <Award className="w-5 h-5 text-yellow-600" />
      default: return null
    }
  }

  const getRankDisplay = () => {
    if (isPodium) {
      return (
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm">
          {getPodiumIcon()}
        </div>
      )
    }
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-600/20 backdrop-blur-sm text-white font-semibold">
        {rank}
      </div>
    )
  }

  const getContextInfo = () => {
    if (type === 'track') {
      const track = item as SpotifyTrack
      const duration = Math.floor(track.duration_ms / 1000 / 60)
      const seconds = Math.floor((track.duration_ms / 1000) % 60)
      const popularityLevel = track.popularity >= 70 ? 'Mega-Hit' : track.popularity >= 50 ? 'Bekannt' : track.popularity >= 30 ? 'Geheimtipp' : 'Underground'
      
      return {
        title: "Was bedeuten diese Zahlen?",
        description: `🎵 Tracklänge: ${duration}:${seconds.toString().padStart(2, '0')} Minuten
🔥 Popularität: ${track.popularity}/100 (${popularityLevel})
📊 Spotify berechnet Popularität basierend auf aktuellen Stream-Zahlen weltweit. Je höher, desto mehr Menschen hören diesen Track gerade.
⭐ Du hörst diesen Track besonders oft - deshalb steht er in deinen Top ${rank}!`
      }
    } else {
      const artist = item as SpotifyArtist
      const followerCount = artist.followers?.total || 0
      const popularity = artist.popularity || 0
      const popularityLevel = popularity >= 70 ? 'Weltstar' : popularity >= 50 ? 'Bekannter Artist' : popularity >= 30 ? 'Aufsteiger' : 'Underground'
      const followerLevel = followerCount >= 10000000 ? 'Mega-Star' : followerCount >= 1000000 ? 'Sehr bekannt' : followerCount >= 100000 ? 'Bekannt' : 'Newcomer'
      
              return {
          title: "Was bedeuten diese Zahlen?",
          description: `👥 Followers: ${followerCount.toLocaleString()} (${followerLevel})
🔥 Popularität: ${popularity}/100 (${popularityLevel})  
📊 Spotify misst Popularität durch aktuelle Streams aller Songs des Artists.
⭐ Du hörst ${artist.name} besonders oft - deshalb Platz ${rank} in deinen Top Artists!`
        }
    }
  }

  const handlePlay = () => {
    if (type === 'track' && onPlay) {
      if (isCurrentlyPlaying && onPause) {
        onPause()
      } else {
        onPlay((item as SpotifyTrack).uri)
      }
    }
  }

  const handleTrackClick = () => {
    if (type === 'track') {
      router.push(`/track/${(item as SpotifyTrack).id}`)
    }
  }

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (type === 'track' && onAddToQueue) {
      onAddToQueue((item as SpotifyTrack).uri)
    }
  }

  const imageUrl = type === 'track' 
    ? (item as SpotifyTrack).album.images?.[0]?.url 
    : (item as SpotifyArtist).images?.[0]?.url

  const contextInfo = getContextInfo()

  return (
    <div
      className={`
        group relative rounded-3xl p-6 backdrop-blur-xl border border-white/10
        transition-all duration-300 cursor-pointer
        ${isPodium 
          ? 'hover:scale-105 hover:translateY(-4px)' 
          : 'hover:scale-103 hover:translateY(-2px) bg-white/5'
        }
        ${isCurrentlyPlaying ? 'ring-2 ring-blue-400' : ''}
        ${showTooltip ? 'z-[9998]' : 'z-10'}
      `}
      style={getPodiumStyle()}
    >
      {/* Rank Badge */}
      <div className="absolute -top-3 -left-3 z-10">
        {getRankDisplay()}
      </div>

      {/* Action Buttons */}
      <div className="absolute top-4 right-4 flex gap-2">
        {/* Add to Queue Button (nur für Tracks) */}
        {type === 'track' && onAddToQueue && (
          <button
            onClick={handleAddToQueue}
            className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-green-500/20 transition-all group/queue"
            title="Zur Queue hinzufügen"
          >
            <Plus className="w-4 h-4 text-gray-400 group-hover/queue:text-green-400" />
          </button>
        )}

        {/* Track Details Button (nur für Tracks) */}
        {type === 'track' && (
          <button
            onClick={handleTrackClick}
            className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all"
            title="Track-Details anzeigen"
          >
            <ExternalLink className="w-4 h-4 text-green-400" />
          </button>
        )}
        
        {/* Context Info Button */}
        {showContext && (
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all"
          >
            <Info className="w-4 h-4 text-blue-400" />
          </button>
        )}
      </div>

      {/* Tooltip */}
      {showContext && showTooltip && (
                      <div className="absolute top-16 right-4 w-96 p-5 bg-gray-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl z-[9999] max-h-96 overflow-y-auto">
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            {contextInfo.title}
          </h4>
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{contextInfo.description}</div>
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Cover/Image */}
        <div className="relative">
          <div className={`rounded-2xl overflow-hidden ${isPodium ? 'w-20 h-20' : 'w-16 h-16'}`}>
            {imageUrl && !imageError ? (
              <img
                src={imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                <span className="text-2xl">🎵</span>
              </div>
            )}
          </div>

          {/* Play Button for Tracks */}
          {type === 'track' && onPlay && (
            <button
              onClick={handlePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
              {isCurrentlyPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white ml-1" />
              )}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-white truncate ${isPodium ? 'text-lg' : 'text-base'}`}>
            {item.name}
          </h3>
          
          {type === 'track' ? (
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span className="truncate">
                {(item as SpotifyTrack).artists.map(a => a.name).join(', ')}
              </span>
              <span>•</span>
              <Clock className="w-3 h-3" />
              <span>{Math.floor((item as SpotifyTrack).duration_ms / 1000 / 60)}:{String(Math.floor(((item as SpotifyTrack).duration_ms / 1000) % 60)).padStart(2, '0')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span>{(item as SpotifyArtist).genres?.slice(0, 2).join(', ') || 'Unbekanntes Genre'}</span>
              {((item as SpotifyArtist).genres?.length || 0) > 0 && (
                <>
                  <span>•</span>
                  <span>{(item as SpotifyArtist).followers?.total?.toLocaleString() || 'Unbekannt'} Followers</span>
                </>
              )}
            </div>
          )}

          {/* Popularity Bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-green-400 transition-all duration-1000"
                style={{ width: `${item.popularity}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 font-medium">{item.popularity}%</span>
          </div>
        </div>
      </div>

      {/* Podium Glow Effect */}
      {isPodium && (
        <div 
          className="absolute inset-0 rounded-3xl opacity-30 -z-10"
          style={{
            background: (getPodiumStyle() as any).background || 'transparent',
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
          }}
        />
      )}


    </div>
  )
} 
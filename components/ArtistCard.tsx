'use client'

import Image from 'next/image'
import { ExternalLink, Users } from 'lucide-react'
import { SpotifyArtist } from '@/types/spotify'
import { formatNumber } from '@/lib/spotify'

interface ArtistCardProps {
  artist: SpotifyArtist
  rank?: number
  className?: string
}

export function ArtistCard({ artist, rank, className = '' }: ArtistCardProps) {
  const artistImage = artist.images?.[0]?.url || '/placeholder-artist.png'

  const openInSpotify = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    window.open(artist.external_urls.spotify, '_blank')
  }

  const getPopularityColor = (popularity: number) => {
    if (popularity >= 80) return 'text-success'
    if (popularity >= 60) return 'text-warning'
    return 'text-error'
  }

  return (
    <div className={`bg-cardBackground rounded-card p-4 hover-scale transition-all duration-200 ${className}`}>
      <div className="flex items-center gap-4">
        {rank && (
          <div className="text-textSecondary font-bold text-lg min-w-[2rem]">
            {rank}
          </div>
        )}
        
        <div className="relative">
          <Image
            src={artistImage}
            alt={artist.name}
            width={64}
            height={64}
            className="rounded-full"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-textPrimary truncate">
            {artist.name}
          </h4>
          
          {artist.genres && artist.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {artist.genres.slice(0, 2).map((genre, index) => (
                <span 
                  key={index}
                  className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-tag"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-4 mt-2">
            {artist.followers && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-textSecondary" />
                <span className="text-xs text-textSecondary">
                  {formatNumber(artist.followers.total)} Follower
                </span>
              </div>
            )}
            
            {artist.popularity && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-textSecondary">Popularität:</span>
                <span className={`text-xs font-medium ${getPopularityColor(artist.popularity)}`}>
                  {artist.popularity}%
                </span>
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={openInSpotify}
          className="p-2 hover:bg-cardBackground/50 rounded-button transition-colors duration-200"
          title="In Spotify öffnen"
        >
          <ExternalLink className="w-4 h-4 text-textSecondary" />
        </button>
      </div>
    </div>
  )
} 
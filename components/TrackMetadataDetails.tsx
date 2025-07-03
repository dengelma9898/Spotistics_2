'use client'

import { SpotifyTrack } from '@/types/spotify'
import { formatDuration } from '@/lib/spotify'
import { Calendar, Clock, Music, Star, ExternalLink } from 'lucide-react'

interface TrackMetadataDetailsProps {
  track: SpotifyTrack
  showFullDetails?: boolean
}

export default function TrackMetadataDetails({ track, showFullDetails = false }: TrackMetadataDetailsProps) {
  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6 space-y-4">
      {/* Track Header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
          <Music className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">{track.name}</h3>
          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <span>{track.artists.map(artist => artist.name).join(', ')}</span>
            {track.explicit && (
              <span className="px-1.5 py-0.5 bg-gray-600 text-white text-xs rounded">
                E
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm truncate">{track.album.name}</p>
        </div>
        <a
          href={track.external_urls.spotify}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ExternalLink className="w-4 h-4 text-gray-400" />
        </a>
      </div>

      {/* Basic Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>Dauer</span>
          </div>
          <p className="text-white font-medium">{formatDuration(track.duration_ms)}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Star className="w-4 h-4" />
            <span>Popularität</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-white font-medium">{track.popularity}/100</p>
            <div className="flex-1 bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${track.popularity}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Calendar className="w-4 h-4" />
            <span>Release</span>
          </div>
          <p className="text-white font-medium">
            {new Date(track.album.release_date).getFullYear()}
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Music className="w-4 h-4" />
            <span>Album</span>
          </div>
          <p className="text-white font-medium text-sm truncate">{track.album.name}</p>
        </div>
      </div>

      {/* Extended Details */}
      {showFullDetails && (
        <div className="pt-4 border-t border-white/10 space-y-3">
          <h4 className="text-white font-medium">Weitere Details</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Track ID:</span>
              <p className="text-white font-mono text-xs mt-1">{track.id}</p>
            </div>
            
            <div>
              <span className="text-gray-400">URI:</span>
              <p className="text-white font-mono text-xs mt-1 truncate">{track.uri}</p>
            </div>
            
            <div>
              <span className="text-gray-400">Künstler:</span>
              <div className="mt-1 space-y-1">
                {track.artists.map((artist, index) => (
                  <div key={artist.id} className="flex items-center gap-2">
                    <span className="text-white">{artist.name}</span>
                    {artist.external_urls?.spotify && (
                      <a
                        href={artist.external_urls.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <span className="text-gray-400">Album-Details:</span>
              <div className="mt-1 space-y-1">
                <p className="text-white">{track.album.name}</p>
                <p className="text-gray-300 text-xs">
                  Release: {new Date(track.album.release_date).toLocaleDateString('de-DE')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
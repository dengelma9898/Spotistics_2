'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Calendar, Clock } from 'lucide-react'

interface DuplicateTracksListProps {
  duplicates: Array<{
    original: any
    duplicate: any
  }>
}

export function DuplicateTracksList({ duplicates }: DuplicateTracksListProps) {
  const [showAll, setShowAll] = useState(false)
  
  if (!duplicates || duplicates.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-green-400 text-6xl mb-4">✨</div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Keine Duplikate gefunden!
        </h3>
        <p className="text-gray-400">
          Ihre Library ist sauber organisiert - keine doppelten Tracks entdeckt.
        </p>
      </div>
    )
  }

  const displayedDuplicates = showAll ? duplicates : duplicates.slice(0, 5)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {duplicates.length} mögliche Duplikate gefunden
        </p>
        {duplicates.length > 5 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Weniger anzeigen' : 'Alle anzeigen'}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {displayedDuplicates.map((duplicate, index) => (
          <Card key={index} className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Album Cover */}
                <div className="flex-shrink-0">
                  <img 
                    src={duplicate.original.track.album.images[0]?.url || '/placeholder-album.png'}
                    alt={duplicate.original.track.name}
                    className="w-16 h-16 rounded-lg"
                  />
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-white truncate">
                        {duplicate.original.track.name}
                      </h4>
                      <p className="text-sm text-gray-400 truncate">
                        {duplicate.original.track.artists.map((artist: any) => artist.name).join(', ')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {duplicate.original.track.album.name}
                      </p>
                    </div>
                    
                    <Badge variant="secondary" className="ml-2">
                      Duplikat
                    </Badge>
                  </div>

                  {/* Duplicate Details */}
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Original */}
                    <div className="bg-gray-900/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="font-medium text-gray-300">Original</span>
                      </div>
                      <div className="space-y-1 text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(duplicate.original.added_at).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {Math.floor(duplicate.original.track.duration_ms / 60000)}:
                            {Math.floor((duplicate.original.track.duration_ms % 60000) / 1000)
                              .toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Duplicate */}
                    <div className="bg-gray-900/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span className="font-medium text-gray-300">Duplikat</span>
                      </div>
                      <div className="space-y-1 text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(duplicate.duplicate.added_at).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {Math.floor(duplicate.duplicate.track.duration_ms / 60000)}:
                            {Math.floor((duplicate.duplicate.track.duration_ms % 60000) / 1000)
                              .toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => window.open(duplicate.original.track.external_urls.spotify, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Original in Spotify
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => window.open(duplicate.duplicate.track.external_urls.spotify, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Duplikat in Spotify
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {duplicates.length > 5 && !showAll && (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => setShowAll(true)}
            className="text-gray-400 hover:text-white"
          >
            Weitere {duplicates.length - 5} Duplikate anzeigen...
          </Button>
        </div>
      )}
    </div>
  )
} 
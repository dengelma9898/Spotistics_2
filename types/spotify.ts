export interface SpotifyImage {
  url: string
  height: number | null
  width: number | null
}

export interface SpotifyArtist {
  id: string
  name: string
  external_urls: {
    spotify: string
  }
  images?: SpotifyImage[]
  genres?: string[]
  followers?: {
    total: number
  }
  popularity?: number
}

export interface SpotifyAlbum {
  id: string
  name: string
  images: SpotifyImage[]
  release_date: string
  artists: SpotifyArtist[]
  external_urls: {
    spotify: string
  }
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: SpotifyArtist[]
  album: SpotifyAlbum
  duration_ms: number
  popularity: number
  preview_url: string | null
  uri: string
  external_urls: {
    spotify: string
  }
  explicit: boolean
}

export interface SpotifyPlaylistTrack {
  track: SpotifyTrack
  added_at: string
  played_at?: string
}

export interface SpotifyTopItem {
  items: SpotifyTrack[] | SpotifyArtist[]
  total: number
  limit: number
  offset: number
  next: string | null
  previous: string | null
}

export interface SpotifyUser {
  id: string
  display_name: string
  email: string
  images: SpotifyImage[]
  followers: {
    total: number
  }
  country: string
  product: string // Premium, Free, etc.
  external_urls: {
    spotify: string
  }
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description: string
  images: SpotifyImage[]
  tracks: {
    total: number
  }
  owner: {
    display_name: string
    id: string
  }
  external_urls: {
    spotify: string
  }
  public: boolean
}

export interface RecentlyPlayedResponse {
  items: Array<{
    track: SpotifyTrack
    played_at: string
    context: {
      type: string
      href: string
      external_urls: {
        spotify: string
      }
      uri: string
    }
  }>
  next: string | null
  cursors: {
    after: string
    before: string
  }
  limit: number
  href: string
}

// Spotify API Response Types bleiben unverändert
// Web Playback SDK wurde entfernt - verwenden nur Web API 
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
  album_type: string
  total_tracks: number
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
  track_number: number
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

// Updated according to Spotify Web API Documentation
// https://developer.spotify.com/documentation/web-api/reference/get-current-users-profile
export interface SpotifyUser {
  /** The country of the user, as set in the user's account profile. An ISO 3166-1 alpha-2 country code. */
  country?: string
  /** The name displayed on the user's profile. null if not available. */
  display_name?: string | null
  /** The user's email address, as entered by the user when creating their account. 
   * Important! This email address is unverified; there is no proof that it actually belongs to the user. */
  email?: string
  /** The user's explicit content settings. */
  explicit_content?: {
    /** When true, indicates that explicit content should not be played. */
    filter_enabled: boolean
    /** When true, indicates that the explicit content setting is locked and can't be changed by the user. */
    filter_locked: boolean
  }
  /** Known external URLs for this user. */
  external_urls?: {
    /** The Spotify URL for the object. */
    spotify: string
  }
  /** Information about the followers of the user. */
  followers?: {
    /** This will always be set to null, as the Web API does not support it at the moment. */
    href: string | null
    /** The total number of followers. */
    total: number
  }
  /** A link to the Web API endpoint for this user. */
  href?: string
  /** The Spotify user ID for the user. */
  id: string
  /** The user's profile image. */
  images?: SpotifyImage[]
  /** The user's Spotify subscription level: "premium", "free", etc. 
   * (The subscription level "open" can be considered the same as "free".) */
  product?: string
  /** The object type: "user" */
  type?: string
  /** The Spotify URI for the user. */
  uri?: string
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
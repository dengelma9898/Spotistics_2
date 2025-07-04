'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  Music, 
  Users, 
  Clock, 
  Heart, 
  PlayCircle,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Calendar,
  BarChart3,
  Headphones,
  Radio,
  Timer
} from 'lucide-react'

import { Header } from '@/components/Header'
import { StatCard } from '@/components/StatCard'
import { TrackPlayer } from '@/components/TrackPlayer'
import { ArtistCard } from '@/components/ArtistCard'
// AudioFeaturesChart entfernt - API deprecated
import { ListeningActivity } from '@/components/ListeningActivity'
import { DeviceSelector } from '@/components/DeviceSelector'
import { RankingCard } from '@/components/RankingCard'
import { PersonalGreeting } from '@/components/PersonalGreeting'
import { AdvancedPlayer } from '@/components/AdvancedPlayer'
import { QueueDisplay } from '@/components/QueueDisplay'
import { Spotlight } from '@/components/ui/spotlight'
import { useToast, ToastContainer } from '@/components/ui/toast'
import { motion } from 'motion/react'

import { SpotifyApi } from '@/lib/spotify'
import { 
  SpotifyUser, 
  SpotifyTopItem, 
  SpotifyArtist, 
  SpotifyTrack,
  RecentlyPlayedResponse
} from '@/types/spotify'

export default function DashboardPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { toasts, removeToast, success, error: showError } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'short_term' | 'medium_term' | 'long_term'>('medium_term')
  const [spotifyApi, setSpotifyApi] = useState<SpotifyApi | null>(null)
  const [isPremium, setIsPremium] = useState<boolean>(false)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTrack, setCurrentTrack] = useState<string | null>(null)
  
  // Spotify Data States
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([])
  const [topArtists, setTopArtists] = useState<SpotifyArtist[]>([])
  const [recentTracks, setRecentTracks] = useState<RecentlyPlayedResponse | null>(null)
  const [followedArtists, setFollowedArtists] = useState<SpotifyArtist[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status])

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      initializeSpotify()
    }
  }, [status, session?.accessToken])

  useEffect(() => {
    if (spotifyApi) {
      loadSpotifyData()
    }
  }, [spotifyApi, timeRange])

  // Session Refresh Event Listener
  useEffect(() => {
    const handleTokenRefresh = async () => {
      console.log('Token refresh angefordert, aktualisiere Session...')
      // Entferne das update() call das den Loop verursacht
      // await update()
      
      // Stattdessen reload nach kurzer Verzögerung
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }

    window.addEventListener('spotify-token-refresh', handleTokenRefresh)
    return () => {
      window.removeEventListener('spotify-token-refresh', handleTokenRefresh)
    }
  }, [])

  const initializeSpotify = async () => {
    if (!session?.accessToken) {
      setError('Keine gültige Spotify-Session gefunden. Bitte melden Sie sich erneut an.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const api = new SpotifyApi(session.accessToken)
      
      // Token validieren
      const isValid = await api.validateToken()
      if (!isValid) {
        setError('Dein Spotify-Token ist abgelaufen. Melde dich einfach nochmal an! 😊')
        return
      }

      // Premium-Status prüfen
      const premiumStatus = await api.checkPremiumStatus()
      setIsPremium(premiumStatus)

      setSpotifyApi(api)
      
    } catch (error: any) {
      console.error('Fehler beim Initialisieren von Spotify:', error)
      setError(`Oops, da lief was schief: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const loadSpotifyData = async () => {
    if (!spotifyApi) return

    try {
      setLoading(true)
      setError(null)

      // Parallele API-Aufrufe für bessere Performance
      const [
        userData,
        topTracksData,
        topArtistsData,
        recentTracksData,
        followedArtistsData
      ] = await Promise.all([
        spotifyApi.getCurrentUser(),
        spotifyApi.getTopTracks(timeRange, 20),
        spotifyApi.getTopArtists(timeRange, 20),
        spotifyApi.getRecentlyPlayed(50),
        spotifyApi.getFollowedArtists()
      ])

      setUser(userData)
      setTopTracks(topTracksData.items as SpotifyTrack[])
      setTopArtists(topArtistsData.items as SpotifyArtist[])
      setRecentTracks(recentTracksData)
      setFollowedArtists(followedArtistsData.artists.items)

      // Audio Features API ist deprecated - entfernt gemäß Roadmap
    } catch (error: any) {
      console.error('Fehler beim Laden der Spotify-Daten:', error)
      
      // Benutzerfreundliche Fehlermeldungen
      if (error.message.includes('Premium')) {
        setError('Spotify Premium wäre cool für alle Features, aber die wichtigsten Stats gibt\'s auch so! 😎')
      } else if (error.message.includes('403')) {
        setError('Hmm, keine Berechtigung für die Daten. Versuch\'s nochmal mit dem Login! 🔐')
      } else if (error.message.includes('401')) {
        setError('Session abgelaufen! Wird automatisch refreshed... ⏳')
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      } else if (error.message.includes('429')) {
        setError('Whoa, zu viele Anfragen! Kurz chillen und dann nochmal... 😅')
      } else {
        setError(`Irgendwas lief schief: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    if (spotifyApi) {
      loadSpotifyData()
    } else {
      initializeSpotify()
    }
  }

  const handleTrackPlay = async (uri: string) => {
    if (!spotifyApi || !selectedDeviceId) return
    
    try {
      await spotifyApi.playTrack(uri, selectedDeviceId)
      setIsPlaying(true)
      setCurrentTrack(uri)
    } catch (error) {
      console.error('Fehler beim Abspielen:', error)
    }
  }

  const handleTrackPause = async () => {
    if (!spotifyApi || !selectedDeviceId) return
    
    try {
      await spotifyApi.pausePlayback(selectedDeviceId)
      setIsPlaying(false)
      setCurrentTrack(null)
    } catch (error) {
      console.error('Fehler beim Pausieren:', error)
    }
  }

  const handleAddToQueue = async (uri: string) => {
    if (!spotifyApi) return
    
    try {
      await spotifyApi.addToQueue(uri, selectedDeviceId || undefined)
      success('Track zur Queue hinzugefügt!', 'Der Song wird nach dem aktuellen Track gespielt')
    } catch (error: any) {
      console.error('Fehler beim Hinzufügen zur Queue:', error)
      showError('Fehler beim Hinzufügen zur Queue', error.message || 'Unbekannter Fehler')
    }
  }

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'short_term': return { label: 'Letzter Monat', icon: '📅', description: 'Deine aktuellen Favorites' }
      case 'medium_term': return { label: 'Letztes halbes Jahr', icon: '📊', description: 'Deine Dauerbrenner' }
      case 'long_term': return { label: 'All Time', icon: '🏆', description: 'Deine Klassiker' }
    }
  }

  const calculateStats = () => {
    const totalTracks = topTracks.length
    const totalArtists = topArtists.length
    const totalListeningTime = topTracks.reduce((acc, track) => acc + track.duration_ms, 0)
    const avgPopularity = totalTracks > 0 ? Math.round(topTracks.reduce((acc, track) => acc + track.popularity, 0) / totalTracks) : 0
    
    return {
      totalTracks,
      totalArtists,
      totalListeningTime: Math.round(totalListeningTime / 1000 / 60), // minutes
      avgPopularity,
      recentCount: recentTracks?.items?.length || 0
    }
  }

  const stats = calculateStats()

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      {/* Aurora Background Effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_farthest-side_at_0_100%,#00ccb1,transparent),radial-gradient(circle_farthest-side_at_100%_0,#7b61ff,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#ffc414,transparent),radial-gradient(circle_farthest-side_at_0_0,#1ca0fb,#141316)] animate-aurora bg-[length:400%_400%]" />
      </div>
      
      {/* Main Spotlight Effect */}
      <Spotlight 
        className="-top-40 left-0 md:-top-20 md:left-60"
        fill="white"
      />
      
      <Header 
        user={user} 
      />
      
      <main className="max-w-7xl mx-auto px-6 py-8 pb-32 relative z-10">
        {/* Personal Greeting */}
        <PersonalGreeting user={user} isPremium={isPremium} />

        {/* Error State */}
        {error && (
          <div className="mb-8 p-6 bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-2xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-300 mb-1">Oops!</h3>
                <p className="text-red-200">{error}</p>
              </div>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 font-medium transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Nochmal!
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
              <p className="text-gray-300 text-lg">Lade deine musikalischen Geheimnisse... 🎵</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && user && (
          <>
            {/* Time Range Selector */}
            <div className="mb-8 flex flex-wrap items-center gap-4 relative z-50">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300 font-medium">Zeitraum:</span>
              </div>
              
              <div className="flex bg-white/5 backdrop-blur-sm rounded-2xl p-1 border border-white/10 relative z-50">
                {(['short_term', 'medium_term', 'long_term'] as const).map((range) => {
                  const rangeInfo = getTimeRangeLabel()
                  return (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-4 py-2 rounded-xl transition-all font-medium text-sm ${
                        timeRange === range
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {range === 'short_term' && '📅 Letzter Monat'}
                      {range === 'medium_term' && '📊 Letztes halbes Jahr'} 
                      {range === 'long_term' && '🏆 All Time'}
                    </button>
                  )
                })}
              </div>
              
              <div className="text-sm text-gray-400">
                {getTimeRangeLabel().description}
              </div>
            </div>

            {/* Stats Cards */}
            <motion.div 
              className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-10"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, staggerChildren: 0.1 }}
            >
               <StatCard
                 title="Songs gehört"
                 value={stats.totalTracks}
                 icon={<Music className="w-5 h-5 text-blue-400" />}
                 trend={stats.totalTracks > 15 ? 'up' : 'neutral'}
                 description="In diesem Zeitraum"
               />
               <StatCard
                 title="Verschiedene Artists"
                 value={stats.totalArtists}
                 icon={<Users className="w-5 h-5 text-purple-400" />}
                 trend={stats.totalArtists > 10 ? 'up' : 'neutral'}
                 description="Deine Vielfalt"
               />
               <StatCard
                 title="Hörzeit"
                 value={`${Math.floor(stats.totalListeningTime / 60)}h ${stats.totalListeningTime % 60}m`}
                 icon={<Clock className="w-5 h-5 text-green-400" />}
                 trend="up"
                 description="Gesamte Spielzeit"
               />
               <StatCard
                 title="Mainstream-Level"
                 value={`${stats.avgPopularity}%`}
                 icon={<TrendingUp className="w-5 h-5 text-yellow-400" />}
                 trend={stats.avgPopularity < 50 ? 'down' : 'up'}
                 description={stats.avgPopularity < 50 ? 'Underground! 🔥' : 'Mainstream 📻'}
               />
               <StatCard
                 title="Letzte Tracks"
                 value={stats.recentCount}
                 icon={<Radio className="w-5 h-5 text-pink-400" />}
                 trend="neutral"
                 description="Recent Activity"
               />
             </motion.div>

            {/* Top Tracks Section */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl backdrop-blur-sm">
                  <Music className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Deine Top Songs 🎵</h2>
                  <p className="text-gray-400">Das sind deine absoluten Lieblings-Tracks!</p>
                </div>
              </div>
              
              <div className="grid gap-4">
                {topTracks.slice(0, 10).map((track, index) => (
                  <RankingCard
                    key={track.id}
                    item={track}
                    rank={index + 1}
                    type="track"
                    onPlay={handleTrackPlay}
                    onPause={handleTrackPause}
                    onAddToQueue={handleAddToQueue}
                    isPlaying={isPlaying}
                    currentTrack={currentTrack || undefined}
                  />
                ))}
              </div>
            </section>

            {/* Top Artists Section */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl backdrop-blur-sm">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Deine Top Artists 🎤</h2>
                  <p className="text-gray-400">Diese Künstler haben es dir richtig angetan!</p>
                </div>
              </div>
              
              <div className="grid gap-4">
                {topArtists.slice(0, 10).map((artist, index) => (
                  <RankingCard
                    key={artist.id}
                    item={artist}
                    rank={index + 1}
                    type="artist"
                  />
                ))}
              </div>
            </section>

            {/* Audio Features entfernt - API deprecated */}

            {/* Advanced Player Section */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-2xl backdrop-blur-sm">
                  <PlayCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Advanced Player 🎮</h2>
                  <p className="text-gray-400">Vollständige Player-Kontrollen mit Web Playback SDK!</p>
                </div>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-6">
                <AdvancedPlayer
                  spotifyApi={spotifyApi}
                  isPremium={isPremium}
                  selectedDeviceId={selectedDeviceId}
                />
                <QueueDisplay
                  spotifyApi={spotifyApi}
                  isPremium={isPremium}
                />
              </div>
            </section>

            {/* Recent Activity */}
            {recentTracks && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-pink-500/20 to-red-500/20 rounded-2xl backdrop-blur-sm">
                    <Headphones className="w-6 h-6 text-pink-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Was läuft gerade? 🎧</h2>
                    <p className="text-gray-400">Deine letzten musikalischen Abenteuer!</p>
                  </div>
                </div>
                
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
                  <ListeningActivity recentTracks={recentTracks} />
                </div>
              </section>
            )}
          </>
        )}
      </main>

             {/* Device Selector */}
       <DeviceSelector 
         spotifyApi={spotifyApi}
         isPremium={isPremium}
         onDeviceSelect={setSelectedDeviceId}
         selectedDeviceId={selectedDeviceId}
       />
    </div>
  )
} 
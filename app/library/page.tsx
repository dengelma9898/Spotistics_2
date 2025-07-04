'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Library, Music } from 'lucide-react'
import { Header } from '@/components/Header'
import { Spotlight } from '@/components/ui/spotlight'
import LibraryAnalyticsDashboard from '@/components/LibraryAnalyticsDashboard'
import { getSpotifyApi } from '@/lib/spotify'
import { SpotifyUser } from '@/types/spotify'

export default function LibraryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      loadUserData()
    }
  }, [status, session?.accessToken])

  const loadUserData = async () => {
    try {
      const api = await getSpotifyApi()
      if (api) {
        const userData = await api.getCurrentUser()
        setUser(userData)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Benutzerdaten:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-300 text-lg">Lade deine Musikbibliothek... 📚</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Bitte melden Sie sich an, um Ihre Bibliothek zu analysieren</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
      {/* Aurora Background Effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_farthest-side_at_0_100%,#00ccb1,transparent),radial-gradient(circle_farthest-side_at_100%_0,#7b61ff,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#ffc414,transparent),radial-gradient(circle_farthest-side_at_0_0,#1ca0fb,#141316)] animate-aurora bg-[length:400%_400%]" />
      </div>
      
      {/* Main Spotlight Effect */}
      <Spotlight 
        className="-top-40 left-0 md:-top-20 md:left-60"
        fill="white"
      />
      
      <Header user={user} />
      
      <main className="max-w-7xl mx-auto px-6 py-8 pb-32 relative z-10">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl backdrop-blur-sm">
              <Library className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Bibliotheks-Analysen 📚</h1>
              <p className="text-gray-400 text-lg">Entdecke die Geheimnisse deiner Musiksammlung</p>
            </div>
          </div>
        </div>

        {/* Main Dashboard */}
        <div className="relative z-10">
          <LibraryAnalyticsDashboard />
        </div>
      </main>
    </div>
  )
} 
'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { Music, Shield, Users, BarChart3, PlayCircle, Info } from 'lucide-react'

function LoginContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  const handleSpotifyLogin = () => {
    signIn('spotify', { callbackUrl: '/dashboard' })
  }

  const permissions = [
    {
      icon: <Music className="w-5 h-5" />,
      title: 'Musik-Bibliothek',
      description: 'Zugriff auf Ihre gespeicherten Tracks und Playlists'
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: 'Hörstatistiken',
      description: 'Analyse Ihrer Top-Tracks und meistgehörten Künstler'
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: 'Befolgte Künstler',
      description: 'Übersicht über Ihre verfolgten Künstler'
    },
    {
      icon: <PlayCircle className="w-5 h-5" />,
      title: 'Wiedergabe-Informationen',
      description: 'Aktuelle und kürzlich gespielte Tracks'
    }
  ]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-cardBackground rounded-card p-8 max-w-md w-full shadow-lg">
        <div className="text-center mb-6">
          <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-textPrimary mb-2">
            Willkommen bei Spotistics
          </h1>
          <p className="text-textSecondary">
            Entdecken Sie Ihre Spotify-Hörgewohnheiten mit detaillierten Statistiken und Einblicken.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <Info className="w-4 h-4" />
              <span className="font-medium">Anmeldefehler</span>
            </div>
            <p className="text-red-300 text-sm">
              {error === 'AccessDenied' 
                ? 'Sie haben die Berechtigung verweigert. Alle Berechtigungen sind für die vollständige Funktionalität erforderlich.'
                : 'Ein Fehler ist bei der Anmeldung aufgetreten. Bitte versuchen Sie es erneut.'
              }
            </p>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-sm font-medium text-textPrimary mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Erforderliche Berechtigungen
          </h3>
          <div className="space-y-3">
            {permissions.map((permission, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="text-accent mt-0.5">
                  {permission.icon}
                </div>
                <div>
                  <div className="text-sm font-medium text-textPrimary">
                    {permission.title}
                  </div>
                  <div className="text-xs text-textSecondary">
                    {permission.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSpotifyLogin}
          disabled={status === 'loading'}
          className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Music className="w-5 h-5" />
              Mit Spotify anmelden
            </>
          )}
        </button>

        <div className="mt-6 text-center">
          <p className="text-xs text-textSecondary">
            Durch die Anmeldung stimmen Sie der Nutzung Ihrer Spotify-Daten für Statistiken zu. 
            Ihre Daten werden sicher verarbeitet und nicht an Dritte weitergegeben.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
} 
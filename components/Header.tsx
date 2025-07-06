'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Music, BarChart3, Home, Users, Library, TrendingUp, Database, User, Menu, X, ExternalLink } from 'lucide-react'
import { ProfileModal } from './ui/profile-modal'
import { SpotifyUser } from '@/types/spotify'

interface HeaderProps {
  user?: SpotifyUser | null
}

export function Header({ user }: HeaderProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Analytics', href: '/analytics', icon: TrendingUp },
    { name: 'Bibliothek', href: '/library', icon: Database },
    { name: 'Vergleiche', href: '/comparisons', icon: BarChart3 },
  ]

  const isActive = (href: string) => pathname === href

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  const handleProfileClick = () => {
    setIsProfileModalOpen(true)
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Spotistics</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-white/20 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {/* User Info */}
              {user && (
                <div className="hidden sm:flex items-center gap-3">
                  {user.images && user.images[0] && (
                    <img
                      src={user.images[0].url}
                      alt={user.display_name || 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">
                      {user.display_name || 'Spotify User'}
                    </p>
                    {user.product && (
                      <p className="text-gray-400 text-xs capitalize">
                        {user.product}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Spotify Link */}
              <a
                href="https://open.spotify.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Spotify öffnen
              </a>

              {/* Logout Button */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Abmelden</span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-300 hover:text-white"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-white/10">
              <nav className="space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-white/20 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                ))}
              </nav>

              {/* Mobile User Info */}
              {user && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-3 px-3 py-2">
                    {user.images && user.images[0] && (
                      <img
                        src={user.images[0].url}
                        alt={user.display_name || 'User'}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div>
                      <p className="text-white text-sm font-medium">
                        {user.display_name || 'Spotify User'}
                      </p>
                      {user.product && (
                        <p className="text-gray-400 text-xs capitalize">
                          Spotify {user.product}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Profile Modal */}
      {user && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={user}
        />
      )}
    </>
  )
} 
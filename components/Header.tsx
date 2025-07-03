'use client'

import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Music, ChevronDown, BarChart3, Home } from 'lucide-react'
import { useState } from 'react'
import { getTimeRangeLabel } from '@/lib/spotify'

interface HeaderProps {
  user?: any
  timeRange: string
  onTimeRangeChange: (timeRange: string) => void
}

export function Header({ user, timeRange, onTimeRangeChange }: HeaderProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [showDropdown, setShowDropdown] = useState(false)

  const timeRanges = [
    { value: 'short_term', label: 'Letzte 4 Wochen' },
    { value: 'medium_term', label: 'Letzte 6 Monate' },
    { value: 'long_term', label: 'Gesamte Zeit' }
  ]

  const navigationItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 }
  ]

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="bg-cardBackground border-b border-textSecondary/10 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Music className="w-8 h-8 text-accent" />
            <h1 className="text-xl font-bold text-textPrimary">
              Spotistics
            </h1>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium transition-colors duration-200 ${
                    isActive 
                      ? 'bg-accent/20 text-accent border border-accent/30' 
                      : 'text-textSecondary hover:text-textPrimary hover:bg-background'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          
          {user && (
            <div className="hidden sm:block text-textSecondary">
              <span>Willkommen zurück, </span>
              <span className="text-textPrimary font-medium">
                {user.display_name || session?.user?.name}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Zeitraum-Auswahl */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 bg-background px-4 py-2 rounded-button border border-textSecondary/20 hover:border-accent/50 transition-colors duration-200"
            >
              <span className="text-sm text-textPrimary">
                {getTimeRangeLabel(timeRange)}
              </span>
              <ChevronDown className="w-4 h-4 text-textSecondary" />
            </button>

            {showDropdown && (
              <div className="absolute top-full mt-2 right-0 bg-cardBackground border border-textSecondary/20 rounded-card shadow-card z-[11] min-w-[200px]">
                {timeRanges.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => {
                      onTimeRangeChange(range.value)
                      setShowDropdown(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-background transition-colors duration-200 first:rounded-t-card last:rounded-b-card ${
                      timeRange === range.value ? 'text-accent' : 'text-textPrimary'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Benutzer Info */}
          {user && (
            <div className="flex items-center gap-3">
              {user.images?.[0]?.url && (
                <Image
                  src={user.images[0].url}
                  alt={user.display_name || 'User'}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              
              <button
                onClick={handleSignOut}
                className="p-2 hover:bg-background rounded-button transition-colors duration-200"
                title="Abmelden"
              >
                <LogOut className="w-4 h-4 text-textSecondary" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Dropdown Overlay */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-5 sm:hidden" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </header>
  )
} 
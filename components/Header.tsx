'use client'

import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Music, BarChart3, Home, Users } from 'lucide-react'

interface HeaderProps {
  user?: any
}

export function Header({ user }: HeaderProps) {
  const { data: session } = useSession()
  const pathname = usePathname()

  const navigationItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/comparisons', label: 'Vergleiche', icon: Users }
  ]

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="bg-cardBackground border-b border-textSecondary/10 p-4 relative z-[10000] sticky top-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between relative z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Music className="w-8 h-8 text-accent" />
            <h1 className="text-xl font-bold text-textPrimary">
              Spotistics
            </h1>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1 relative z-50">
            {navigationItems.map((item) => {
              const IconComponent = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative z-50 flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium transition-colors duration-200 cursor-pointer pointer-events-auto ${
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

        <div className="flex items-center gap-4 relative z-50">
          {/* Benutzer Info */}
          {user && (
            <div className="flex items-center gap-3 relative z-50">
              {user.images?.[0]?.url && (
                <button className="relative z-50 cursor-pointer pointer-events-auto" onClick={() => console.log('Profile clicked!')}>
                  <Image
                    src={user.images[0].url}
                    alt={user.display_name || 'User'}
                    width={32}
                    height={32}
                    className="rounded-full hover:ring-2 hover:ring-accent/50 transition-all duration-200"
                  />
                </button>
              )}
              
              <button
                onClick={handleSignOut}
                className="relative z-50 flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-button transition-colors duration-200 border border-red-500/20 cursor-pointer pointer-events-auto"
                title="Abmelden"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>


    </header>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, ExternalLink, Calendar, MapPin, Award, Star, Music, Shield, Crown, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import { SpotifyUser } from '@/types/spotify'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: SpotifyUser
}

export function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])

  useEffect(() => {
    // Generate random particles for the background effect
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }))
    setParticles(newParticles)
  }, [])

  const formatFollowerCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  const getAccountTypeInfo = (product: string) => {
    switch (product?.toLowerCase()) {
      case 'premium':
        return { 
          label: 'Premium', 
          color: 'text-yellow-400', 
          bg: 'bg-yellow-500/20 border-yellow-500/30', 
          icon: Crown,
          description: 'Vollzugriff auf alle Features'
        }
      case 'free':
        return { 
          label: 'Free', 
          color: 'text-gray-400', 
          bg: 'bg-gray-500/20 border-gray-500/30', 
          icon: Music,
          description: 'Kostenloser Spotify-Account'
        }
      case 'open':
        return { 
          label: 'Free', 
          color: 'text-gray-400', 
          bg: 'bg-gray-500/20 border-gray-500/30', 
          icon: Music,
          description: 'Kostenloser Spotify-Account'
        }
      default:
        return { 
          label: 'Spotify', 
          color: 'text-green-400', 
          bg: 'bg-green-500/20 border-green-500/30', 
          icon: Music,
          description: 'Spotify-Benutzer'
        }
    }
  }

  const getCountryName = (countryCode: string) => {
    const countries: Record<string, string> = {
      'US': 'United States',
      'DE': 'Deutschland',
      'GB': 'United Kingdom',
      'FR': 'France',
      'ES': 'Spain',
      'IT': 'Italy',
      'NL': 'Netherlands',
      'AT': 'Austria',
      'CH': 'Switzerland',
      'BE': 'Belgium',
      'SE': 'Sweden',
      'NO': 'Norway',
      'DK': 'Denmark',
      'FI': 'Finland',
      'CA': 'Canada',
      'AU': 'Australia',
      'JP': 'Japan',
      'BR': 'Brazil',
      'MX': 'Mexico',
      'AR': 'Argentina'
    }
    return countries[countryCode?.toUpperCase()] || countryCode?.toUpperCase() || 'Unknown'
  }

  const accountInfo = getAccountTypeInfo(user.product || 'free')
  const AccountIcon = accountInfo.icon

  // Get the best quality profile image
  const profileImage = user.images?.[0]?.url || '/placeholder-user.png'
  const hasExplicitContentSettings = user.explicit_content !== undefined

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Backdrop with Aurora Effect */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-teal-900/30" />
            
            {/* Animated Particles */}
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute w-1 h-1 bg-gradient-to-r from-blue-400 to-teal-400 rounded-full opacity-60"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 0.8, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: particle.delay,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>

          {/* Profile Card */}
          <motion.div
            className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", duration: 0.6 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
            >
              <X size={24} />
            </button>

            {/* Animated Border Gradient */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 opacity-20 blur-sm -z-10" />

            {/* Profile Content */}
            <div className="text-center space-y-6">
              {/* Profile Image with Glow Effect */}
              <div className="relative mx-auto w-32 h-32">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 rounded-full blur-md opacity-50"
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
                <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white/20">
                  <Image
                    src={profileImage}
                    alt={user.display_name || 'Spotify User'}
                    fill
                    className="object-cover"
                  />
                </div>
                
                {/* Account Type Badge */}
                <motion.div
                  className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full ${accountInfo.bg} ${accountInfo.color} text-xs font-bold border flex items-center gap-1`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  title={accountInfo.description}
                >
                  <AccountIcon size={12} />
                  {accountInfo.label}
                </motion.div>
              </div>

              {/* User Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-3xl font-bold text-white mb-2">
                  {user.display_name || 'Spotify User'}
                </h2>
                <p className="text-gray-400 text-lg">Music Enthusiast</p>
                {user.type && (
                  <p className="text-gray-500 text-sm capitalize">
                    Spotify {user.type}
                  </p>
                )}
              </motion.div>

              {/* User Stats */}
              <motion.div
                className="grid grid-cols-2 gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Star className="text-yellow-400" size={20} />
                    <span className="text-sm text-gray-400">Follower</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {user.followers?.total !== undefined ? formatFollowerCount(user.followers.total) : '0'}
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Music className="text-green-400" size={20} />
                    <span className="text-sm text-gray-400">Account</span>
                  </div>
                  <p className="text-lg font-bold text-white capitalize">
                    {user.product || 'Free'}
                  </p>
                </div>
              </motion.div>

              {/* User Details */}
              <motion.div
                className="space-y-3 text-left"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {user.email && (
                  <div className="flex items-center gap-3 text-gray-300">
                    <Mail size={16} className="text-blue-400" />
                    <span className="text-sm">{user.email}</span>
                    <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                      Unverified
                    </span>
                  </div>
                )}

                {user.country && (
                  <div className="flex items-center gap-3 text-gray-300">
                    <MapPin size={16} className="text-red-400" />
                    <span className="text-sm">{getCountryName(user.country)}</span>
                    <span className="text-xs text-gray-500">({user.country.toUpperCase()})</span>
                  </div>
                )}

                {user.id && (
                  <div className="flex items-center gap-3 text-gray-300">
                    <Calendar size={16} className="text-purple-400" />
                    <span className="text-sm">User ID: {user.id}</span>
                  </div>
                )}

                {/* Explicit Content Settings */}
                {hasExplicitContentSettings && (
                  <div className="flex items-center gap-3 text-gray-300">
                    {user.explicit_content?.filter_enabled ? (
                      <EyeOff size={16} className="text-red-400" />
                    ) : (
                      <Eye size={16} className="text-green-400" />
                    )}
                    <span className="text-sm">
                      Explicit Content: {user.explicit_content?.filter_enabled ? 'Blocked' : 'Allowed'}
                    </span>
                    {user.explicit_content?.filter_locked && (
                      <Shield size={14} className="text-orange-400" title="Settings locked" />
                    )}
                  </div>
                )}
              </motion.div>

              {/* Online Status */}
              <motion.div
                className="flex items-center justify-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 font-medium">@{user.id || 'spotify_user'}</span>
                <span className="text-gray-400">• Online</span>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {/* Spotify Profile Button */}
                {user.external_urls?.spotify && (
                  <motion.a
                    href={user.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors w-full justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ExternalLink size={18} />
                    Spotify-Profil öffnen
                  </motion.a>
                )}

                {/* API Endpoint Info */}
                {user.href && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      API Endpoint verfügbar
                    </p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Floating Particles inside Card */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              {particles.slice(0, 5).map((particle) => (
                <motion.div
                  key={`card-${particle.id}`}
                  className="absolute w-2 h-2 bg-gradient-to-r from-white/30 to-blue-400/30 rounded-full"
                  style={{
                    left: `${particle.x}%`,
                    top: `${particle.y}%`,
                  }}
                  animate={{
                    y: [-10, -30, -10],
                    opacity: [0.3, 0.8, 0.3],
                    scale: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: particle.delay,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 
'use client'

import { useEffect, useState } from 'react'
import { SpotifyUser } from '@/types/spotify'
import { TextGenerateEffect } from './ui/text-generate-effect'
import { Spotlight } from './ui/spotlight'

interface PersonalGreetingProps {
  user: SpotifyUser | null
  isPremium: boolean
}

export function PersonalGreeting({ user, isPremium }: PersonalGreetingProps) {
  const [greeting, setGreeting] = useState('')
  const [emoji, setEmoji] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    const greetingVariations = {
      morning: ['Moin', 'Hey', 'Na'],
      afternoon: ['Hi', 'Hallo', 'Was geht'],
      evening: ['Hey', 'Na', 'Hallo'],
      night: ['Hey', 'Na', 'Moin']
    }

    const emojiVariations = {
      morning: ['☀️', '🌅', '☕'],
      afternoon: ['😎', '🎵', '🔥'],
      evening: ['🌙', '✨', '🎧'],
      night: ['🌃', '🎵', '🌙']
    }

    let timeOfDay: keyof typeof greetingVariations
    if (hour >= 5 && hour < 12) timeOfDay = 'morning'
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon'
    else if (hour >= 17 && hour < 22) timeOfDay = 'evening'
    else timeOfDay = 'night'

    const randomGreeting = greetingVariations[timeOfDay][Math.floor(Math.random() * greetingVariations[timeOfDay].length)]
    const randomEmoji = emojiVariations[timeOfDay][Math.floor(Math.random() * emojiVariations[timeOfDay].length)]

    setGreeting(randomGreeting)
    setEmoji(randomEmoji)
  }, [])

  const getTimeBasedMessage = () => {
    const hour = new Date().getHours()
    
    if (hour >= 5 && hour < 9) return "Zeit für deine Morgen-Vibes!"
    if (hour >= 9 && hour < 12) return "Perfekt für produktive Sounds!"
    if (hour >= 12 && hour < 14) return "Lunchtime Beats incoming!"
    if (hour >= 14 && hour < 17) return "Nachmittags-Energie pur!"
    if (hour >= 17 && hour < 20) return "Feierabend-Stimmung!"
    if (hour >= 20 && hour < 23) return "Entspann dich mit deiner Musik!"
    return "Nachteulen-Playlist ready?"
  }

  const firstName = user?.display_name?.split(' ')[0] || 'Music Lover'

  return (
    <div className="mb-8 relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 hover:bg-white/10 transition-all duration-300 group overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50" />
      
      {/* Spotlight Effect */}
      <Spotlight 
        className="-top-40 left-0 md:-top-20 md:left-60"
        fill="white"
      />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-8 text-6xl">🎵</div>
        <div className="absolute top-12 right-12 text-4xl">🎧</div>
        <div className="absolute bottom-8 left-16 text-3xl">🎶</div>
        <div className="absolute bottom-4 right-8 text-5xl">✨</div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl animate-bounce">{emoji}</span>
          <div className="flex-1">
            <TextGenerateEffect 
              words={`${greeting} ${firstName}!`}
              className="text-3xl font-bold text-white group-hover:text-blue-100 transition-colors"
              duration={0.8}
              filter={true}
            />
          </div>
          {isPremium && (
            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs font-semibold animate-pulse">
              ✨ Premium
            </div>
          )}
        </div>

        <p className="text-lg text-gray-300 mb-2 group-hover:text-white transition-colors">
          {getTimeBasedMessage()}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Deine persönlichen Spotify-Stats sind geladen</span>
          </div>
          
          {user?.country && (
            <div className="flex items-center gap-1">
              <span>📍</span>
              <span>{user.country}</span>
            </div>
          )}
          
          {user?.followers && (
            <div className="flex items-center gap-1">
              <span>👥</span>
              <span>{user.followers.total} Followers</span>
            </div>
          )}
        </div>

        {/* Fun Facts */}
        <div className="mt-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 group-hover:bg-white/10 transition-all duration-300">
          <h3 className="text-sm font-semibold text-blue-400 group-hover:text-blue-300 transition-colors mb-2">💡 Wusstest du?</h3>
          <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
            Diese Stats basieren auf deinen Hörgewohnheiten der letzten Monate. Die "Popularität" zeigt, 
            wie mainstream deine Tracks/Artists sind (0-100). Je niedriger, desto underground! 
            {isPremium ? " Als Premium-User kannst du auch direkt hier abspielen! 🎵" : " Upgrade zu Premium für noch mehr Features! ✨"}
          </p>
        </div>
      </div>

      {/* Subtle Glow Effect */}
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10" />
      </div>
    </div>
  )
} 
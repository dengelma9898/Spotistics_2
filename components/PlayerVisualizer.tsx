'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Music, Radio, Waves } from 'lucide-react'

interface PlayerVisualizerProps {
  isPlaying?: boolean
  trackName?: string
  artistName?: string
  className?: string
}

export function PlayerVisualizer({ isPlaying = false, trackName, artistName, className = '' }: PlayerVisualizerProps) {
  const [bars, setBars] = useState<number[]>([])

  // Generate random heights for frequency bars
  useEffect(() => {
    if (!isPlaying) {
      setBars(Array(12).fill(0.1))
      return
    }

    const interval = setInterval(() => {
      const newBars = Array.from({ length: 12 }, () => Math.random() * 0.8 + 0.2)
      setBars(newBars)
    }, 150)

    return () => clearInterval(interval)
  }, [isPlaying])

  return (
    <div className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl">
          <Waves className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Audio Visualizer</h3>
          <p className="text-gray-400 text-sm">
            {isPlaying ? 'Live Audio-Visualisierung' : 'Pausiert'}
          </p>
        </div>
      </div>

      {/* Track Info */}
      {trackName && (
        <div className="mb-6 p-4 bg-white/5 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-medium text-cyan-400">Now Playing</span>
          </div>
          <h4 className="font-semibold text-white truncate">{trackName}</h4>
          {artistName && (
            <p className="text-gray-400 text-sm truncate">{artistName}</p>
          )}
        </div>
      )}

      {/* Frequency Bars Visualizer */}
      <div className="relative">
        <div className="flex items-end justify-center gap-1 h-32 mb-4">
          {bars.map((height, index) => (
            <motion.div
              key={index}
              className="bg-gradient-to-t from-cyan-500 to-blue-400 rounded-t"
              style={{
                width: '12px',
                minHeight: '4px'
              }}
              animate={{
                height: `${height * 100}%`,
                opacity: isPlaying ? 1 : 0.3
              }}
              transition={{
                duration: 0.1,
                ease: 'easeOut'
              }}
            />
          ))}
        </div>

        {/* Circular Pulse Animation */}
        <div className="flex justify-center">
          <div className="relative">
            <motion.div
              className="w-16 h-16 rounded-full border-2 border-cyan-400/30"
              animate={{
                scale: isPlaying ? [1, 1.2, 1] : 1,
                opacity: isPlaying ? [0.3, 0.6, 0.3] : 0.3
              }}
              transition={{
                duration: 2,
                repeat: isPlaying ? Infinity : 0,
                ease: 'easeInOut'
              }}
            />
            <motion.div
              className="absolute inset-0 w-16 h-16 rounded-full border-2 border-cyan-400/50"
              animate={{
                scale: isPlaying ? [1, 1.4, 1] : 1,
                opacity: isPlaying ? [0.5, 0.8, 0.5] : 0.5
              }}
              transition={{
                duration: 1.5,
                repeat: isPlaying ? Infinity : 0,
                ease: 'easeInOut',
                delay: 0.3
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Music className={`w-6 h-6 ${isPlaying ? 'text-cyan-400' : 'text-gray-500'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Waveform Animation */}
      <div className="mt-6">
        <div className="flex items-center justify-center gap-1 h-8">
          {Array.from({ length: 40 }).map((_, index) => (
            <motion.div
              key={index}
              className="bg-gradient-to-t from-cyan-500/20 to-cyan-400/40 rounded"
              style={{
                width: '2px',
                minHeight: '2px'
              }}
              animate={{
                height: isPlaying ? 
                  `${Math.sin((Date.now() / 200) + index * 0.3) * 15 + 20}px` : 
                  '4px',
                opacity: isPlaying ? [0.4, 0.8, 0.4] : 0.2
              }}
              transition={{
                duration: 0.5,
                repeat: isPlaying ? Infinity : 0,
                ease: 'easeInOut',
                delay: index * 0.02
              }}
            />
          ))}
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mt-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
          }`} />
          <span className="text-xs text-gray-400">
            {isPlaying ? 'Live Visualisierung' : 'Bereit für Wiedergabe'}
          </span>
        </div>
      </div>
    </div>
  )
} 
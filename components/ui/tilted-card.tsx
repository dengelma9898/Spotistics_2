'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface TiltedCardProps {
  children: React.ReactNode
  className?: string
  tiltDegree?: number
  backgroundGradient?: string
  borderRadius?: string
}

export function TiltedCard({ 
  children, 
  className = '',
  tiltDegree = 3,
  backgroundGradient = 'from-slate-900/80 via-purple-900/40 to-slate-900/80',
  borderRadius = 'rounded-2xl'
}: TiltedCardProps) {
  return (
    <div className="perspective-1000 group">
      <div 
        className={cn(
          'relative transform transition-all duration-500 ease-out',
          'group-hover:scale-105 group-hover:-rotate-1',
          'will-change-transform',
          className
        )}
        style={{
          transform: `rotateX(${tiltDegree}deg) rotateY(${tiltDegree}deg)`,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Card Shadow */}
        <div 
          className={cn(
            'absolute inset-0 bg-black/20 blur-xl translate-y-4 translate-x-2',
            borderRadius
          )}
          style={{ transform: 'translateZ(-20px)' }}
        />
        
        {/* Main Card */}
        <div 
          className={cn(
            'relative overflow-hidden backdrop-blur-xl border border-white/10',
            `bg-gradient-to-br ${backgroundGradient}`,
            borderRadius,
            'before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-transparent before:opacity-50',
            'after:absolute after:inset-0 after:bg-gradient-to-tr after:from-transparent after:via-white/5 after:to-white/10'
          )}
          style={{ transform: 'translateZ(0px)' }}
        >
          {/* Subtle Inner Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 opacity-60" />
          
          {/* Content */}
          <div className="relative z-10">
            {children}
          </div>
          
          {/* Floating Dots Animation */}
          <div className="absolute top-4 right-4 opacity-30">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Additional utility component for card content
export function TiltedCardContent({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn('p-6 sm:p-8', className)}>
      {children}
    </div>
  )
}

// Tilted card header component
export function TiltedCardHeader({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn('border-b border-white/10 p-6 sm:p-8 pb-4', className)}>
      {children}
    </div>
  )
} 
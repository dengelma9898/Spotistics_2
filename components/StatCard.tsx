'use client'

import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { BackgroundGradient } from './ui/background-gradient'
import { motion } from 'motion/react'

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  description?: string
  className?: string
}

export function StatCard({ title, value, icon, trend, description, className = '' }: StatCardProps) {
  return (
    <div className={`
      relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 
      hover:bg-white/10 hover:scale-105 hover:translateY(-2px)
      transition-all duration-300 group overflow-hidden
      ${className}
    `}>
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-blue-400 group-hover:scale-110 transition-transform duration-200">
              {icon}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                {title}
              </h3>
              {description && (
                <p className="text-xs text-gray-500 mt-1">{description}</p>
              )}
            </div>
          </div>
          
          {/* Trend Icon */}
          {trend && (
            <div className={`p-1.5 rounded-lg transition-all ${
              trend === 'up' ? 'bg-green-500/20 text-green-400' :
              trend === 'down' ? 'bg-red-500/20 text-red-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3" />}
              {trend === 'neutral' && <Minus className="w-3 h-3" />}
            </div>
          )}
        </div>
        
        {/* Value */}
        <div className="mb-2">
          <p className="text-2xl font-bold text-white group-hover:text-blue-100 transition-colors">
            {value}
          </p>
        </div>

        {/* Trend Label */}
        {trend && (
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${
              trend === 'up' ? 'text-green-400' :
              trend === 'down' ? 'text-red-400' :
              'text-gray-400'
            }`}>
              {trend === 'up' ? 'Trending up' :
               trend === 'down' ? 'Trending down' :
               'Stable'}
            </span>
          </div>
        )}
      </div>

      {/* Subtle Glow Effect */}
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10" />
      </div>
    </div>
  )
} 
'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  children: React.ReactNode
  content: string | React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  disabled?: boolean
}

export function Tooltip({ 
  children, 
  content, 
  position = 'top', 
  className = '',
  disabled = false 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      
      let x = 0
      let y = 0

      switch (position) {
        case 'top':
          x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2)
          y = triggerRect.top - tooltipRect.height - 8
          break
        case 'bottom':
          x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2)
          y = triggerRect.bottom + 8
          break
        case 'left':
          x = triggerRect.left - tooltipRect.width - 8
          y = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2)
          break
        case 'right':
          x = triggerRect.right + 8
          y = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2)
          break
      }

      // Ensure tooltip stays within viewport
      const padding = 8
      x = Math.max(padding, Math.min(x, window.innerWidth - tooltipRect.width - padding))
      y = Math.max(padding, Math.min(y, window.innerHeight - tooltipRect.height - padding))

      setTooltipPosition({ x, y })
    }
  }, [isVisible, position])

  const handleMouseEnter = () => {
    if (!disabled) {
      setIsVisible(true)
    }
  }

  const handleMouseLeave = () => {
    setIsVisible(false)
  }

  const tooltipElement = isVisible ? (
    <div
      ref={tooltipRef}
      className={`fixed z-[10000] bg-gray-900/95 backdrop-blur-xl text-white text-sm rounded-lg p-3 border border-white/10 shadow-2xl pointer-events-none max-w-xs ${className}`}
      style={{
        left: tooltipPosition.x,
        top: tooltipPosition.y,
      }}
    >
      {content}
    </div>
  ) : null

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>
      {typeof document !== 'undefined' && tooltipElement && createPortal(tooltipElement, document.body)}
    </>
  )
} 
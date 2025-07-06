'use client'

import React, { useState, useEffect } from 'react'
import { Monitor, Smartphone, Speaker, Tv, Headphones, Wifi, ChevronDown, RotateCcw } from 'lucide-react'
import { getSpotifyApi } from '@/lib/spotify'
import { Device, SpotifyApi } from '@spotify/web-api-ts-sdk'

interface DeviceSelectorProps {
  isPremium: boolean
  selectedDeviceId: string | null
  onDeviceSelect: (deviceId: string | null) => void
}

export function DeviceSelector({ isPremium, selectedDeviceId, onDeviceSelect }: DeviceSelectorProps) {
  const [devices, setDevices] = useState<Device[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const loadDevices = async () => {
    if (!isPremium) return
    
    setIsLoading(true)
    try {
      const spotifyApi = await getSpotifyApi()
      if (!spotifyApi) return
      
      const deviceResponse = await spotifyApi.player.getAvailableDevices()
      // Das neue SDK gibt { devices: Device[] } zurück
      const deviceList = deviceResponse.devices || []
      setDevices(deviceList)
      console.log('Gefundene Geräte:', deviceList)
      
      // Auto-select active device if none selected
      if (!selectedDeviceId) {
        const activeDevice = deviceList.find((device: Device) => device.is_active)
        if (activeDevice) {
          onDeviceSelect(activeDevice.id)
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Geräte:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDevices()
    
    // Aktualisiere Geräte alle 15 Sekunden
    const interval = setInterval(loadDevices, 15000)
    return () => clearInterval(interval)
  }, [isPremium])

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'computer':
        return <Monitor className="w-4 h-4" />
      case 'smartphone':
        return <Smartphone className="w-4 h-4" />
      case 'speaker':
        return <Speaker className="w-4 h-4" />
      case 'tv':
        return <Tv className="w-4 h-4" />
      default:
        return <Headphones className="w-4 h-4" />
    }
  }

  const selectedDevice = devices.find(device => device.id === selectedDeviceId)
  const activeDevice = devices.find(device => device.is_active)

  if (!isPremium) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white/5 backdrop-blur-xl border-t border-white/10 p-4 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <div className="flex items-center gap-3 text-orange-400">
            <Headphones className="w-5 h-5" />
            <span className="text-sm font-medium">Spotify Premium für Geräte-Auswahl erforderlich</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Device Selector */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/5 backdrop-blur-xl border-t border-white/10 z-50">
        <div className="max-w-7xl mx-auto p-4">
          {/* Dropdown */}
          {isOpen && (
            <div className="mb-4 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
              <div className="p-4 border-b border-white/10">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-blue-400" />
                  Wiedergabe-Gerät auswählen
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {devices.length > 0 
                    ? `${devices.length} verfügbare Spotify Connect Geräte gefunden`
                    : 'Keine Geräte gefunden. Starte Spotify auf einem anderen Gerät.'
                  }
                </p>
              </div>
              
              {devices.length > 0 ? (
                <div className="max-h-64 overflow-y-auto">
                  {devices.map((device) => (
                    <button
                      key={device.id}
                      onClick={() => {
                        onDeviceSelect(device.id)
                        setIsOpen(false)
                      }}
                      className={`w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all group ${
                        device.id === selectedDeviceId ? 'bg-blue-500/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl transition-all ${
                          device.is_active 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-600/20 text-gray-400 group-hover:text-gray-300'
                        }`}>
                          {getDeviceIcon(device.type)}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-white">{device.name}</p>
                          <p className="text-sm text-gray-400 capitalize">
                            {device.type} • {device.volume_percent}% Lautstärke
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {device.is_active && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-lg">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-xs text-green-400 font-medium">Live</span>
                          </div>
                        )}
                        {device.id === selectedDeviceId && (
                          <div className="w-3 h-3 bg-blue-400 rounded-full shadow-lg" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Headphones className="w-8 h-8 text-gray-500" />
                  </div>
                  <h4 className="text-white font-medium mb-2">Keine Geräte gefunden</h4>
                  <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
                    Öffne Spotify auf deinem Handy, Computer oder Speaker, dann sollten sie hier erscheinen.
                  </p>
                </div>
              )}
              
              {/* Clear Selection */}
              {devices.length > 0 && (
                <div className="p-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      onDeviceSelect(null)
                      setIsOpen(false)
                    }}
                    className="text-sm text-gray-400 hover:text-white transition-colors font-medium"
                  >
                    ↻ Automatische Geräte-Auswahl
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Selector Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-2xl">
                <Wifi className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-white">
                  {selectedDevice ? selectedDevice.name : activeDevice ? activeDevice.name : 'Kein Gerät ausgewählt'}
                </p>
                <p className="text-sm text-gray-400">
                  {selectedDevice || activeDevice 
                    ? `Spotify Connect • ${selectedDevice?.type || activeDevice?.type}` 
                    : 'Öffne Spotify auf einem Gerät'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Status */}
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {devices.length} Gerät{devices.length !== 1 ? 'e' : ''}
                </p>
                {(selectedDevice || activeDevice) && (
                  <p className="text-sm text-blue-400 font-medium">
                    🔊 {selectedDevice?.volume_percent || activeDevice?.volume_percent}%
                  </p>
                )}
              </div>

              {/* Toggle Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isLoading}
                className="p-3 hover:bg-white/10 rounded-2xl transition-all duration-200 disabled:opacity-50 group"
                title={devices.length === 0 ? 'Lade Geräte...' : 'Gerät auswählen'}
              >
                <ChevronDown 
                  className={`w-5 h-5 transition-all duration-300 text-gray-400 group-hover:text-white ${
                    isOpen ? 'transform rotate-180' : ''
                  } ${isLoading ? 'animate-pulse' : ''}`} 
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 
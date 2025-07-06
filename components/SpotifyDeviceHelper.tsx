'use client'

import React, { useState, useEffect } from 'react'
import { Monitor, Smartphone, Speaker, Tv, Headphones, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import { SpotifyApiWrapper } from '@/lib/spotify'
import { Device } from '@spotify/web-api-ts-sdk'

interface SpotifyDeviceHelperProps {
  spotifyApi: SpotifyApiWrapper | null
  isPremium: boolean
  onDeviceSelect?: (deviceId: string | null) => void
}

export function SpotifyDeviceHelper({ spotifyApi, isPremium, onDeviceSelect }: SpotifyDeviceHelperProps) {
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showHelper, setShowHelper] = useState(false)

  const loadDevices = async () => {
    if (!spotifyApi || !isPremium) return
    
    setIsLoading(true)
    try {
      const deviceResponse = await spotifyApi.getAvailableDevices()
      // Das neue SDK gibt { devices: Device[] } zurück
      const deviceList = deviceResponse.devices || []
      setDevices(deviceList)
    } catch (error) {
      console.error('Fehler beim Laden der Geräte:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDevices()
    
    // Aktualisiere Geräte alle 30 Sekunden
    const interval = setInterval(loadDevices, 30000)
    return () => clearInterval(interval)
  }, [spotifyApi, isPremium])

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

  const transferToDevice = async (deviceId: string) => {
    if (!spotifyApi) return
    
    try {
      await spotifyApi.transferPlaybackToDevice(deviceId)
      await loadDevices() // Aktualisiere die Geräteliste
    } catch (error) {
      console.error('Fehler beim Übertragen der Wiedergabe:', error)
    }
  }

  if (!isPremium) {
    return (
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-orange-400 mb-1">Spotify Premium erforderlich</h3>
            <p className="text-sm text-textSecondary">
              Für die vollständige Track-Wiedergabe benötigen Sie Spotify Premium. 
              Ohne Premium stehen 30-Sekunden-Vorschauen zur Verfügung.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const activeDevice = devices.find(device => device.is_active)

  return (
    <div className="space-y-4">
      {/* Status-Anzeige */}
      <div className={`border rounded-lg p-4 ${
        activeDevice 
          ? 'bg-green-500/10 border-green-500/20' 
          : 'bg-orange-500/10 border-orange-500/20'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeDevice ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-orange-500" />
            )}
            <div>
              <h3 className={`font-medium ${
                activeDevice ? 'text-green-400' : 'text-orange-400'
              }`}>
                {activeDevice ? 'Wiedergabe bereit' : 'Kein aktives Gerät'}
              </h3>
              <p className="text-sm text-textSecondary">
                {activeDevice 
                  ? `Aktiv auf: ${activeDevice.name}`
                  : 'Öffnen Sie Spotify auf einem Gerät für die Wiedergabe'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={loadDevices}
              disabled={isLoading}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Geräte aktualisieren"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setShowHelper(!showHelper)}
              className="text-sm text-accent hover:underline"
            >
              {showHelper ? 'Ausblenden' : 'Hilfe'}
            </button>
          </div>
        </div>
      </div>

      {/* Erweiterte Hilfe */}
      {showHelper && (
        <div className="bg-cardBackground border border-borderColor rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-textPrimary">Spotify-Wiedergabe einrichten</h4>
          
          <div className="space-y-3 text-sm text-textSecondary">
            <div>
              <strong className="text-textPrimary">So starten Sie die Wiedergabe:</strong>
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li>Öffnen Sie die Spotify-App auf Ihrem Handy, Computer oder Tablet</li>
                <li>Starten Sie einen beliebigen Song in Spotify</li>
                <li>Kehren Sie zu Spotistics zurück und klicken Sie auf einen Track</li>
                <li>Die Wiedergabe wird auf Ihrem aktiven Gerät fortgesetzt</li>
              </ol>
            </div>
            
            <div>
              <strong className="text-textPrimary">Unterstützte Geräte:</strong>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Spotify Desktop-App (Windows, Mac, Linux)</li>
                <li>Spotify Mobile-App (iOS, Android)</li>
                <li>Spotify Connect-fähige Geräte (Smart TVs, Lautsprecher)</li>
                <li>Spielkonsolen (PlayStation, Xbox)</li>
              </ul>
            </div>
            
            <div>
              <strong className="text-textPrimary">Fehlerbehebung:</strong>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Stellen Sie sicher, dass Sie Spotify Premium haben</li>
                <li>Alle Geräte müssen mit dem gleichen Spotify-Account angemeldet sein</li>
                <li>Bei Problemen: Spotify-App neu starten</li>
                <li>Alternative: Tracks direkt in Spotify öffnen</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Verfügbare Geräte */}
      {devices.length > 0 && (
        <div className="bg-cardBackground border border-borderColor rounded-lg p-4">
          <h4 className="font-medium text-textPrimary mb-3">Verfügbare Geräte</h4>
          <div className="space-y-2">
            {devices.map((device) => (
              <div
                key={device.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  device.is_active 
                    ? 'bg-accent/10 border-accent/20' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getDeviceIcon(device.type)}
                  <div>
                    <p className="font-medium text-textPrimary">{device.name}</p>
                    <p className="text-xs text-textSecondary capitalize">{device.type}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {device.is_active && (
                    <span className="text-xs bg-accent text-background px-2 py-1 rounded">
                      Aktiv
                    </span>
                  )}
                  {!device.is_active && (
                    <button
                      onClick={() => transferToDevice(device.id)}
                      className="text-xs text-accent hover:underline"
                    >
                      Aktivieren
                    </button>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-textSecondary">
                      {device.volume_percent}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keine Geräte gefunden */}
      {isPremium && devices.length === 0 && !isLoading && (
        <div className="bg-cardBackground border border-borderColor rounded-lg p-4 text-center">
          <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <h4 className="font-medium text-textPrimary mb-2">Keine Geräte gefunden</h4>
          <p className="text-sm text-textSecondary mb-4">
            Öffnen Sie Spotify auf einem Gerät, um die Wiedergabe zu starten.
          </p>
          <button
            onClick={loadDevices}
            className="text-sm text-accent hover:underline"
          >
            Erneut suchen
          </button>
        </div>
      )}
    </div>
  )
} 
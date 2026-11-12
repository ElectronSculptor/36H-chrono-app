import { useEffect, useState } from 'react'

export function distanceMetres(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export function formatMetres(m: number) {
  if (m < 1000) return `${Math.round(m / 5) * 5} m`
  return `${(m / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`
}

export type EtatGeo = 'inactif' | 'attente' | 'ok' | 'refuse' | 'indisponible'

/** Suit la position de l'utilisateur, uniquement quand `actif` est vrai. Le jeu fonctionne sans. */
export function usePosition(actif: boolean) {
  const [etat, setEtat] = useState<EtatGeo>('inactif')
  const [pos, setPos] = useState<{ lat: number; lng: number; precision: number } | null>(null)

  useEffect(() => {
    if (!actif) return
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setEtat('indisponible')
      return
    }
    setEtat('attente')
    let id: number | undefined
    try {
      id = navigator.geolocation.watchPosition(
        (p) => {
          setPos({ lat: p.coords.latitude, lng: p.coords.longitude, precision: p.coords.accuracy })
          setEtat('ok')
        },
        (err) => setEtat(err.code === err.PERMISSION_DENIED ? 'refuse' : 'indisponible'),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
      )
    } catch {
      setEtat('indisponible')
    }
    return () => {
      if (id !== undefined) navigator.geolocation.clearWatch(id)
    }
  }, [actif])

  return { etat, pos }
}

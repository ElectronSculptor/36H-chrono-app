import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface PointCarte {
  lat: number
  lng: number
  label?: string
  type?: 'depart' | 'etape' | 'fait' | 'cible'
  numero?: number
}

const couleurs: Record<string, string> = {
  depart: 'var(--color-accent)',
  cible: 'var(--color-accent)',
  etape: 'var(--color-mer)',
  fait: 'var(--color-vert)',
}

function icone(p: PointCarte) {
  const c = couleurs[p.type ?? 'etape']
  const contenu = p.numero !== undefined ? String(p.numero) : ''
  const grand = p.type === 'depart' || p.type === 'cible'
  const t = grand ? 34 : 26
  return L.divIcon({
    className: 'marqueur',
    iconSize: [t, t + 8],
    iconAnchor: [t / 2, t + 6],
    html: `<div style="position:relative;width:${t}px;height:${t + 8}px">
      <div style="width:${t}px;height:${t}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${c};box-shadow:0 3px 8px rgba(13,43,62,.35);border:3px solid #fff"></div>
      <span style="position:absolute;top:0;left:0;width:${t}px;height:${t}px;display:grid;place-items:center;color:#fff;font-weight:800;font-size:${grand ? 14 : 12}px">${contenu}</span>
    </div>`,
  })
}

export default function CarteLeaflet({
  points,
  position,
  hauteur,
}: {
  points: PointCarte[]
  position?: { lat: number; lng: number; precision?: number } | null
  hauteur: number
}) {
  const div = useRef<HTMLDivElement>(null)
  const carte = useRef<L.Map | null>(null)
  const couchePoints = useRef<L.LayerGroup | null>(null)
  const couchePos = useRef<L.LayerGroup | null>(null)
  const cadre = useRef(false)

  useEffect(() => {
    if (!div.current) return
    const m = L.map(div.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(m)
    L.control.zoom({ position: 'bottomright' }).addTo(m)
    couchePoints.current = L.layerGroup().addTo(m)
    couchePos.current = L.layerGroup().addTo(m)
    carte.current = m
    return () => {
      m.remove()
      carte.current = null
    }
  }, [])

  useEffect(() => {
    const m = carte.current
    const g = couchePoints.current
    if (!m || !g) return
    g.clearLayers()
    points.forEach((p) => {
      const mk = L.marker([p.lat, p.lng], { icon: icone(p) })
      if (p.label) mk.bindTooltip(p.label, { direction: 'top', offset: [0, -30] })
      mk.addTo(g)
    })
    if (points.length === 1) m.setView([points[0].lat, points[0].lng], 17)
    else if (points.length > 1) m.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [36, 36] })
    cadre.current = false
  }, [points])

  useEffect(() => {
    const m = carte.current
    const g = couchePos.current
    if (!m || !g) return
    g.clearLayers()
    if (!position) return
    L.circle([position.lat, position.lng], {
      radius: Math.min(position.precision ?? 20, 200),
      color: '#155E8B',
      weight: 1,
      fillOpacity: 0.12,
    }).addTo(g)
    L.circleMarker([position.lat, position.lng], {
      radius: 8,
      color: '#fff',
      weight: 3,
      fillColor: '#155E8B',
      fillOpacity: 1,
    }).addTo(g)
    // recadre une seule fois pour inclure la position
    if (!cadre.current && points.length) {
      cadre.current = true
      const b = L.latLngBounds([...points.map((p) => [p.lat, p.lng] as [number, number]), [position.lat, position.lng]])
      m.fitBounds(b, { padding: [40, 40], maxZoom: 17 })
    }
  }, [position, points])

  return <div ref={div} style={{ height: hauteur }} className="w-full overflow-hidden rounded-[1.25rem] bg-mer-clair z-0" />
}

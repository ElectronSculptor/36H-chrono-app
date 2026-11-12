import { lazy, Suspense } from 'react'
import { MapPin } from 'lucide-react'
import type { PointCarte } from './CarteLeaflet'

export type { PointCarte }

const CarteLeaflet = lazy(() => import('./CarteLeaflet'))

/** Carte Leaflet chargée à la demande (le jeu fonctionne sans). */
export default function Carte(props: {
  points: PointCarte[]
  position?: { lat: number; lng: number; precision?: number } | null
  hauteur?: number
}) {
  const h = props.hauteur ?? 220
  return (
    <Suspense
      fallback={
        <div className="grid place-items-center rounded-[1.25rem] bg-mer-clair text-mer" style={{ height: h }}>
          <MapPin className="animate-pulse" />
        </div>
      }
    >
      <CarteLeaflet {...props} hauteur={h} />
    </Suspense>
  )
}

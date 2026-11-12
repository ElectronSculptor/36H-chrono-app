import { useRef, type CSSProperties, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Coins } from 'lucide-react'
import { config } from '../config'
import { asset } from '../lib/data'
import { setDemoOuvert } from '../lib/demo'
import { useProgression } from '../lib/store'
import type { Partenaire, Personnage } from '../lib/types'

/** Pictogramme de l'app : une balise posée au bord de l'eau. */
export function LogoMarque({ taille = 36 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="14" fill="var(--color-mer)" />
      <circle cx="34" cy="13" r="5" fill="var(--color-ocre)" />
      <path
        d="M22 9c-6.1 0-11 4.8-11 10.8 0 7.6 11 17.2 11 17.2s11-9.6 11-17.2C33 13.8 28.1 9 22 9Z"
        fill="#fff"
      />
      <circle cx="22" cy="20" r="4.2" fill="var(--color-accent)" />
      <path d="M6 40c3-2 6-2 9 0s6 2 9 0 6-2 9 0 6 2 9 0" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" opacity=".85" />
    </svg>
  )
}

/** Logo cliquable : 5 tapotements rapides ouvrent le panneau démo. */
export function Logo({ avecNom = true, clair = false }: { avecNom?: boolean; clair?: boolean }) {
  const taps = useRef<number[]>([])
  const onTap = () => {
    const t = Date.now()
    taps.current = [...taps.current.filter((x) => t - x < 2000), t]
    if (taps.current.length >= 5) {
      taps.current = []
      setDemoOuvert(true)
    }
  }
  return (
    <button type="button" onClick={onTap} className="flex items-center gap-2 select-none" aria-label={config.nom}>
      <LogoMarque taille={34} />
      {avecNom && (
        <span className={`font-titre text-xl font-semibold ${clair ? 'text-white' : 'text-nuit'}`}>{config.nom}</span>
      )}
    </button>
  )
}

export function PastillePoints({ clair = false }: { clair?: boolean }) {
  const { points } = useProgression()
  return (
    <Link
      to="/recompenses"
      className={`puce text-sm py-1.5 px-3 ${clair ? 'bg-white/15 text-white' : 'bg-ocre-clair text-nuit'}`}
      aria-label={`${points} points`}
    >
      <Coins size={16} className={clair ? 'text-ocre' : 'text-terracotta'} />
      <span key={points} className="tabular-nums animate-pop">{points}</span>
      <span className="font-semibold opacity-70">pts</span>
    </Link>
  )
}

export function Entete({ retour, titre, droite }: { retour?: string | true; titre?: string; droite?: ReactNode }) {
  const nav = useNavigate()
  return (
    <header className="sticky top-0 z-30 bg-calcaire/90 backdrop-blur pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between gap-3 px-4 h-16">
        <div className="flex items-center gap-2 min-w-0">
          {retour && (
            <button
              type="button"
              onClick={() => (retour === true ? nav(-1) : nav(retour))}
              className="-ml-2 grid place-items-center w-10 h-10 rounded-full active:bg-sable"
              aria-label="Retour"
            >
              <ChevronLeft size={26} />
            </button>
          )}
          {titre ? <h1 className="text-lg font-semibold truncate">{titre}</h1> : <Logo />}
        </div>
        <div className="flex items-center gap-2">
          {titre && <Logo avecNom={false} />}
          {droite ?? <PastillePoints />}
        </div>
      </div>
    </header>
  )
}

export function Avatar({
  personnage,
  taille = 64,
  verrouille = false,
  anneau = true,
}: {
  personnage?: Personnage
  taille?: number
  verrouille?: boolean
  anneau?: boolean
}) {
  if (!personnage) return null
  return (
    <div
      className="relative shrink-0 rounded-full overflow-hidden grid place-items-center"
      style={{
        width: taille,
        height: taille,
        background: verrouille ? 'var(--color-sable)' : `${personnage.couleur}22`,
        boxShadow: anneau && !verrouille ? `inset 0 0 0 3px ${personnage.couleur}` : undefined,
      }}
    >
      <img
        src={asset(personnage.image)}
        alt={verrouille ? 'Personnage à découvrir' : personnage.nom}
        className="w-full h-full object-cover"
        style={verrouille ? { filter: 'brightness(0)', opacity: 0.22 } : undefined}
        draggable={false}
      />
      {verrouille && (
        <span className="absolute inset-0 grid place-items-center font-titre font-bold text-nuit/50" style={{ fontSize: taille * 0.34 }}>
          ?
        </span>
      )}
    </div>
  )
}

/** Le personnage parle à la première personne. */
export function Bulle({ personnage, children, taille = 56 }: { personnage?: Personnage; children: ReactNode; taille?: number }) {
  return (
    <div className="flex items-end gap-3">
      <Avatar personnage={personnage} taille={taille} />
      <div className="relative carte px-4 py-3 rounded-bl-md flex-1 text-[15px] leading-relaxed">
        {personnage && <p className="text-xs font-bold mb-0.5" style={{ color: personnage.couleur }}>{personnage.nom}</p>}
        {children}
      </div>
    </div>
  )
}

export function LogoPartenaire({ partenaire, taille = 36 }: { partenaire?: Partenaire; taille?: number }) {
  if (!partenaire) return null
  if (partenaire.logo)
    return <img src={asset(partenaire.logo)} alt={partenaire.nom} width={taille} height={taille} className="rounded-xl object-contain" />
  return (
    <span
      className="grid place-items-center rounded-xl font-titre font-bold text-white shrink-0"
      style={{ width: taille, height: taille, background: partenaire.couleur, fontSize: taille * 0.38 }}
      aria-hidden="true"
    >
      {partenaire.initiales}
    </span>
  )
}

export function OffertPar({ partenaire }: { partenaire?: Partenaire }) {
  if (!partenaire) return null
  return (
    <span className="puce bg-mer-clair text-mer">
      Offert par <span className="font-extrabold">{partenaire.nom}</span>
    </span>
  )
}

export function Difficulte({ niveau }: { niveau: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`Difficulté ${niveau} sur 3`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={`w-1.5 h-3.5 rounded-full ${i <= niveau ? 'bg-terracotta' : 'bg-sable'}`} />
      ))}
    </span>
  )
}

export function Confettis({ nombre = 60 }: { nombre?: number }) {
  const couleurs = ['var(--color-accent)', 'var(--color-ocre)', 'var(--color-mer)', 'var(--color-terracotta)', '#ffffff']
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-40" aria-hidden="true">
      {Array.from({ length: nombre }).map((_, i) => {
        const gauche = (i * 37) % 100
        const style = {
          left: `${gauche}%`,
          background: couleurs[i % couleurs.length],
          '--dx': `${((i * 53) % 80) - 40}px`,
          '--rot': `${360 + ((i * 97) % 540)}deg`,
          '--duree': `${2.2 + ((i * 13) % 14) / 10}s`,
          '--delai': `${((i * 7) % 10) / 10}s`,
          width: i % 3 === 0 ? 8 : 10,
          height: i % 2 === 0 ? 14 : 10,
          borderRadius: i % 4 === 0 ? '50%' : 3,
        } as CSSProperties
        return <span key={i} className="confetti" style={style} />
      })}
    </div>
  )
}

export function Modal({ ouvert, onFermer, children }: { ouvert: boolean; onFermer: () => void; children: ReactNode }) {
  if (!ouvert) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-nuit/50 backdrop-blur-[2px]" onClick={onFermer} aria-label="Fermer" />
      <div className="relative w-full max-w-md bg-calcaire rounded-t-[2rem] sm:rounded-[2rem] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] animate-monte max-h-[90dvh] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

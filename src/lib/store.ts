// Progression du joueur, gardée dans localStorage (lecture/écriture protégées).
import { useSyncExternalStore } from 'react'
import { config } from '../config'
import { getParcours, getRecompense, normaliserCode, extraireBalise } from './data'
import type { Coupon, Parcours, Phase, Progression } from './types'

const INITIAL: Progression = {
  onboardingVu: false,
  points: 0,
  partie: null,
  termines: {},
  personnages: [],
  coupons: [],
  tempsDehorsMs: 0,
}

function charger(): Progression {
  try {
    const brut = localStorage.getItem(config.cleStockage)
    if (!brut) return { ...INITIAL }
    const p = JSON.parse(brut) as Partial<Progression>
    return { ...INITIAL, ...p }
  } catch {
    return { ...INITIAL }
  }
}

function sauver(p: Progression) {
  try {
    localStorage.setItem(config.cleStockage, JSON.stringify(p))
  } catch {
    /* stockage indisponible (navigation privée…) : on continue en mémoire */
  }
}

let etat: Progression = charger()
const abonnes = new Set<() => void>()

function maj(f: (p: Progression) => Progression) {
  etat = f(etat)
  sauver(etat)
  abonnes.forEach((a) => a())
}

export const lire = () => etat

export function useProgression(): Progression {
  return useSyncExternalStore(
    (cb) => {
      abonnes.add(cb)
      return () => abonnes.delete(cb)
    },
    () => etat,
  )
}

// ── Points ─────────────────────────────────────────────

export function pointsEtape(parcours: Parcours, erreurs: number, indice: boolean) {
  const base = parcours.points_par_etape ?? config.points.parEtape
  const p = base - erreurs * config.points.penaliteErreur - (indice ? config.points.penaliteIndice : 0)
  return Math.max(config.points.minimumParEtape, p)
}

export function pointsMaxParcours(parcours: Parcours) {
  return parcours.etapes.length * (parcours.points_par_etape ?? config.points.parEtape) + parcours.bonus_fin
}

// ── Actions ────────────────────────────────────────────

export function terminerOnboarding(vu = true) {
  maj((p) => ({ ...p, onboardingVu: vu }))
}

export function commencerParcours(id: string, etapeIndex = 0, phase: Phase = 'etape') {
  maj((p) => ({
    ...p,
    partie: {
      parcoursId: id,
      etapeIndex,
      phase,
      debut: Date.now(),
      pointsGagnes: 0,
      erreurs: 0,
      indiceUtilise: false,
      rejouee: !!p.termines[id],
    },
  }))
}

export function abandonnerPartie() {
  maj((p) => ({ ...p, partie: null }))
}

export function setPhase(phase: Phase) {
  maj((p) => (p.partie ? { ...p, partie: { ...p.partie, phase } } : p))
}

export type ResultatScan =
  | { ok: true }
  | { ok: false; raison: 'inconnue' | 'deja' | 'plus-tard' | 'autre-parcours'; etapeNumero?: number; parcoursTitre?: string }

/** Vérifie qu'une balise (code court, id ou URL scannée) correspond à l'étape en cours. */
export function verifierBalise(saisie: string): ResultatScan {
  const partie = etat.partie
  const parcours = getParcours(partie?.parcoursId)
  if (!partie || !parcours) return { ok: false, raison: 'inconnue' }
  const cle = normaliserCode(extraireBalise(saisie))
  const idx = parcours.etapes.findIndex(
    (e) => normaliserCode(e.balise.code) === cle || normaliserCode(e.balise.id) === cle,
  )
  if (idx === partie.etapeIndex) {
    setPhase('enigme')
    return { ok: true }
  }
  if (idx >= 0 && idx < partie.etapeIndex) return { ok: false, raison: 'deja', etapeNumero: idx + 1 }
  if (idx > partie.etapeIndex) return { ok: false, raison: 'plus-tard', etapeNumero: idx + 1 }
  // balise d'un autre parcours ?
  return { ok: false, raison: 'inconnue' }
}

export function enregistrerErreur() {
  maj((p) => (p.partie ? { ...p, partie: { ...p.partie, erreurs: p.partie.erreurs + 1 } } : p))
}

export function utiliserIndice() {
  maj((p) => (p.partie ? { ...p, partie: { ...p.partie, indiceUtilise: true } } : p))
}

/** Énigme résolue : crédite les points de l'étape et passe à l'anecdote. Renvoie les points gagnés. */
export function resoudreEnigme(): number {
  const partie = etat.partie
  const parcours = getParcours(partie?.parcoursId)
  if (!partie || !parcours) return 0
  const gain = partie.rejouee ? 0 : pointsEtape(parcours, partie.erreurs, partie.indiceUtilise)
  maj((p) => ({
    ...p,
    points: p.points + gain,
    partie: p.partie ? { ...p.partie, phase: 'anecdote', pointsGagnes: p.partie.pointsGagnes + gain } : null,
  }))
  return gain
}

/** Après l'anecdote : étape suivante (écran pause) ou fin. Renvoie true si le parcours est terminé. */
export function etapeSuivante(): boolean {
  const partie = etat.partie
  const parcours = getParcours(partie?.parcoursId)
  if (!partie || !parcours) return false
  if (partie.etapeIndex >= parcours.etapes.length - 1) {
    terminerParcours()
    return true
  }
  maj((p) =>
    p.partie
      ? {
          ...p,
          partie: { ...p.partie, etapeIndex: p.partie.etapeIndex + 1, phase: 'pause', erreurs: 0, indiceUtilise: false },
        }
      : p,
  )
  return false
}

/** Clôture le parcours : bonus, personnage débloqué, temps passé dehors. */
export function terminerParcours(pointsSupplementaires = 0) {
  const partie = etat.partie
  const parcours = getParcours(partie?.parcoursId)
  if (!partie || !parcours) return
  const bonus = partie.rejouee ? 0 : parcours.bonus_fin + pointsSupplementaires
  const dureeMs = Math.min(Date.now() - partie.debut, config.plafondTempsParcoursMin * 60000)
  const total = partie.pointsGagnes + bonus
  maj((p) => {
    const avant = p.termines[parcours.id]
    return {
      ...p,
      points: p.points + bonus,
      partie: null,
      tempsDehorsMs: p.tempsDehorsMs + Math.max(0, dureeMs),
      personnages: p.personnages.includes(parcours.personnage) ? p.personnages : [...p.personnages, parcours.personnage],
      termines: {
        ...p.termines,
        [parcours.id]: {
          fin: Date.now(),
          dureeMs,
          points: (avant?.points ?? 0) + total,
          fois: (avant?.fois ?? 0) + 1,
        },
      },
      derniereFin: { parcoursId: parcours.id, points: total, dureeMs, rejouee: partie.rejouee },
    }
  })
}

// ── Récompenses ────────────────────────────────────────

function genererCode() {
  const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 8; i++) s += alpha[Math.floor(Math.random() * alpha.length)]
  return `${s.slice(0, 4)}-${s.slice(4)}`
}

export function echangerRecompense(id: string): Coupon | null {
  const r = getRecompense(id)
  if (!r || etat.points < r.cout_points) return null
  const maintenant = Date.now()
  const coupon: Coupon = {
    id: `c${maintenant.toString(36)}`,
    recompenseId: r.id,
    code: genererCode(),
    dateEchange: maintenant,
    expireLe: maintenant + r.validite_heures * 3600000,
  }
  maj((p) => ({ ...p, points: p.points - r.cout_points, coupons: [coupon, ...p.coupons] }))
  return coupon
}

// ── Mode démo ──────────────────────────────────────────

export function ajouterPoints(n: number) {
  maj((p) => ({ ...p, points: Math.max(0, p.points + n) }))
}

export function reinitialiser() {
  maj(() => ({ ...INITIAL, onboardingVu: true }))
}

/** Valide l'étape en cours comme si la balise avait été scannée. */
export function demoValiderEtape() {
  const ph = etat.partie?.phase
  if (ph === 'etape' || ph === 'scan' || ph === 'pause') setPhase('enigme')
}

/** Termine immédiatement le parcours en cours (ou le premier), points des étapes restantes compris. */
export function demoAllerALaFin(parcoursIdParDefaut: string): string {
  if (!etat.partie) commencerParcours(parcoursIdParDefaut)
  const partie = etat.partie!
  const parcours = getParcours(partie.parcoursId)!
  const restantes = parcours.etapes.length - partie.etapeIndex - (partie.phase === 'anecdote' ? 1 : 0)
  const pts = partie.rejouee ? 0 : restantes * (parcours.points_par_etape ?? config.points.parEtape)
  maj((p) => ({
    ...p,
    points: p.points + pts,
    partie: p.partie ? { ...p.partie, pointsGagnes: p.partie.pointsGagnes + pts, debut: Math.min(p.partie.debut, Date.now() - parcours.duree_min * 60000) } : null,
  }))
  terminerParcours()
  return parcours.id
}

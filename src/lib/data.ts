import parcoursJson from '../data/parcours.json'
import partenairesJson from '../data/partenaires.json'
import recompensesJson from '../data/recompenses.json'
import type { DonneesParcours, Etape, Parcours, Partenaire, Personnage, Recompense } from './types'

const donnees = parcoursJson as unknown as DonneesParcours

export const personnages: Personnage[] = donnees.personnages
export const parcours: Parcours[] = donnees.parcours
export const partenaires: Partenaire[] = (partenairesJson as { partenaires: Partenaire[] }).partenaires
export const recompenses: Recompense[] = (recompensesJson as { recompenses: Recompense[] }).recompenses

export const getParcours = (id?: string) => parcours.find((p) => p.id === id)
export const getPersonnage = (id?: string) => personnages.find((p) => p.id === id)
export const getPartenaire = (id?: string) => partenaires.find((p) => p.id === id)
export const getRecompense = (id?: string) => recompenses.find((r) => r.id === id)

/** Chemin d'un fichier de /public, compatible avec un déploiement en sous-dossier. */
export const asset = (chemin?: string) => (chemin ? chemin.replace(/^\/+/, '') : '')

/** Normalise un code de balise : majuscules, sans espaces ni tirets. */
export const normaliserCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '')

/** Extrait l'identifiant de balise d'un texte scanné (URL complète ou code). */
export function extraireBalise(texte: string): string {
  const t = texte.trim()
  const m = t.match(/#\/b\/([^/?#\s]+)/i) || t.match(/\/b\/([^/?#\s]+)/i)
  return m ? decodeURIComponent(m[1]) : t
}

export interface BaliseTrouvee {
  parcours: Parcours
  etape: Etape
  index: number
}

/** Retrouve une balise à partir de son id (lien du QR) ou de son code court. */
export function trouverBalise(saisie: string): BaliseTrouvee | null {
  const cle = normaliserCode(extraireBalise(saisie))
  if (!cle) return null
  for (const p of parcours) {
    const index = p.etapes.findIndex(
      (e) => normaliserCode(e.balise.code) === cle || normaliserCode(e.balise.id) === cle,
    )
    if (index >= 0) return { parcours: p, etape: p.etapes[index], index }
  }
  return null
}

export const difficulteTexte = (d: number) => (d <= 1 ? 'Facile' : d === 2 ? 'Moyen' : 'Difficile')

export function formatDuree(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`
}

export function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`
}

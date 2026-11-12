// Types du contenu (fichiers JSON de src/data) et de la progression.

export interface Personnage {
  id: string
  nom: string
  titre: string // ex. « le gabian curieux »
  description: string
  image: string // chemin relatif, ex. personnages/gaby.svg
  couleur: string
  bientot?: boolean // personnage à venir (affiché en silhouette)
}

export interface Balise {
  id: string // utilisé dans l'URL du QR : /#/b/ID
  code: string // code court de secours (4 caractères)
}

export interface Enigme {
  type: 'qcm' | 'texte'
  question: string
  choix?: string[] // QCM : liste des réponses proposées
  bonne_reponse?: number // QCM : index (à partir de 0) de la bonne réponse
  reponses_acceptees?: string[] // texte : réponses acceptées (casse et accents ignorés)
  indice: string
  a_verifier?: boolean
}

export interface Anecdote {
  titre: string
  texte: string
  image?: string
  a_verifier?: boolean
}

export interface Etape {
  id: string
  titre: string
  indice_lieu: string
  lat?: number
  lng?: number
  balise: Balise
  sponsor?: string // id partenaire : « étape proposée par… »
  enigme: Enigme
  anecdote: Anecdote
}

export interface Parcours {
  id: string
  titre: string
  quartier: string
  ville: string
  duree_min: number
  distance_km: number
  difficulte: 1 | 2 | 3
  interieur?: boolean
  personnage: string // id personnage
  offert_par?: string // id partenaire
  sponsor_fin?: string // id partenaire de la carte « partenaire » de fin
  points_par_etape?: number
  bonus_fin: number
  accroche: string
  intro: string // présentation par le personnage (1re personne)
  conclusion: string // mot de fin du personnage
  depart: { nom: string; indication: string; lat: number; lng: number; a_verifier?: boolean }
  etapes: Etape[]
}

export interface DonneesParcours {
  personnages: Personnage[]
  parcours: Parcours[]
}

export interface Partenaire {
  id: string
  nom: string
  type: string
  description: string
  adresse: string
  couleur: string
  initiales: string
  logo?: string
  offre_native?: { titre: string; texte: string; bouton: string }
}

export interface Recompense {
  id: string
  titre: string
  description: string
  partenaire: string
  cout_points: number
  validite_heures: number
  debloquee_par?: string // id du parcours à terminer pour la débloquer
  conditions?: string
}

// ── Progression (localStorage) ─────────────────────────────

export type Phase = 'etape' | 'scan' | 'enigme' | 'anecdote' | 'pause'

export interface PartieEnCours {
  parcoursId: string
  etapeIndex: number
  phase: Phase
  debut: number
  pointsGagnes: number
  erreurs: number // erreurs sur l'étape courante
  indiceUtilise: boolean // indice utilisé sur l'étape courante
  rejouee: boolean // déjà terminé auparavant : pas de points
}

export interface ParcoursTermine {
  fin: number
  dureeMs: number
  points: number
  fois: number
}

export interface Coupon {
  id: string
  recompenseId: string
  code: string
  dateEchange: number
  expireLe: number
}

export interface Progression {
  onboardingVu: boolean
  points: number
  partie: PartieEnCours | null
  termines: Record<string, ParcoursTermine>
  personnages: string[]
  coupons: Coupon[]
  tempsDehorsMs: number
  derniereFin?: { parcoursId: string; points: number; dureeMs: number; rejouee: boolean }
}

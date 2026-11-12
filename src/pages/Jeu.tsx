import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Check,
  Eye,
  KeyRound,
  Lightbulb,
  Map as MapIcon,
  MapPin,
  PhoneOff,
  ScanLine,
  Sparkles,
  X,
} from 'lucide-react'
import { config } from '../config'
import { asset, getParcours, getPartenaire, getPersonnage } from '../lib/data'
import { distanceMetres, formatMetres, usePosition } from '../lib/geo'
import {
  abandonnerPartie,
  enregistrerErreur,
  etapeSuivante,
  pointsEtape,
  resoudreEnigme,
  setPhase,
  utiliserIndice,
  verifierBalise,
  useProgression,
} from '../lib/store'
import { reponseCorrecte } from '../lib/texte'
import type { Etape, Parcours, PartieEnCours, Personnage } from '../lib/types'
import { Bulle, Logo, LogoPartenaire, Modal, PastillePoints } from '../components/ui'
import Carte, { type PointCarte } from '../components/Carte'
import Scanner from '../components/Scanner'

export default function Jeu() {
  const { id } = useParams()
  const parcours = getParcours(id)
  const prog = useProgression()
  const partie = prog.partie
  const nav = useNavigate()
  const [quitter, setQuitter] = useState(false)

  if (!parcours) return <Navigate to="/" replace />
  if (!partie || partie.parcoursId !== parcours.id) {
    if (prog.derniereFin?.parcoursId === parcours.id) return <Navigate to={`/fin/${parcours.id}`} replace />
    return <Navigate to={`/parcours/${parcours.id}`} replace />
  }

  const etape = parcours.etapes[partie.etapeIndex]
  const perso = getPersonnage(parcours.personnage)

  if (partie.phase === 'pause') return <Pause parcours={parcours} partie={partie} etape={etape} />

  return (
    <div className="min-h-dvh flex flex-col fond-calcaire">
      <header className="sticky top-0 z-30 bg-calcaire/90 backdrop-blur pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between gap-3 px-4 h-14">
          <button
            type="button"
            onClick={() => setQuitter(true)}
            className="-ml-2 grid place-items-center w-10 h-10 rounded-full active:bg-sable"
            aria-label="Quitter le parcours"
          >
            <X size={24} />
          </button>
          <Logo avecNom={false} />
          <PastillePoints />
        </div>
        <Progression parcours={parcours} partie={partie} />
      </header>

      <main className="flex-1 px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        {partie.phase === 'etape' && <VueEtape parcours={parcours} etape={etape} perso={perso} partie={partie} />}
        {partie.phase === 'scan' && <VueScan etape={etape} partie={partie} />}
        {partie.phase === 'enigme' && <VueEnigme key={etape.id} parcours={parcours} etape={etape} perso={perso} partie={partie} />}
        {partie.phase === 'anecdote' && (
          <VueAnecdote
            etape={etape}
            perso={perso}
            dernier={partie.etapeIndex === parcours.etapes.length - 1}
            onSuite={() => {
              const fini = etapeSuivante()
              if (fini) nav(`/fin/${parcours.id}`)
            }}
          />
        )}
      </main>

      <Modal ouvert={quitter} onFermer={() => setQuitter(false)}>
        <h2 className="text-xl font-semibold">Faire une pause ?</h2>
        <p className="mt-2 text-encre">Ta progression est sauvegardée : tu pourras reprendre à l’étape {partie.etapeIndex + 1}.</p>
        <div className="mt-5 grid gap-2.5">
          <button type="button" className="btn-mer" onClick={() => nav('/')}>
            Reprendre plus tard
          </button>
          <button type="button" className="btn-ghost" onClick={() => setQuitter(false)}>
            Continuer à jouer
          </button>
          <button
            type="button"
            className="text-sm font-bold text-terracotta py-2"
            onClick={() => {
              abandonnerPartie()
              nav(`/parcours/${parcours.id}`)
            }}
          >
            Abandonner le parcours
          </button>
        </div>
      </Modal>
    </div>
  )
}

function Progression({ parcours, partie }: { parcours: Parcours; partie: PartieEnCours }) {
  const n = parcours.etapes.length
  return (
    <div className="px-4 pb-3">
      <div className="flex items-center justify-between text-xs font-bold text-encre mb-1.5">
        <span>
          Étape {partie.etapeIndex + 1} sur {n}
        </span>
        <span className="truncate ml-3">{parcours.titre}</span>
      </div>
      <div className="flex gap-1.5">
        {parcours.etapes.map((e, i) => {
          const fait = i < partie.etapeIndex || (i === partie.etapeIndex && partie.phase === 'anecdote')
          const courant = i === partie.etapeIndex
          return (
            <span
              key={e.id}
              className={`h-2 flex-1 rounded-full transition-colors duration-500 ${fait ? 'bg-vert' : courant ? 'bg-accent' : 'bg-sable'}`}
            />
          )
        })}
      </div>
    </div>
  )
}

function SponsorEtape({ etape }: { etape: Etape }) {
  const s = getPartenaire(etape.sponsor)
  if (!s) return null
  return (
    <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-white/70 ring-1 ring-sable px-3 py-2">
      <LogoPartenaire partenaire={s} taille={28} />
      <p className="text-xs text-encre">
        Étape proposée par <b className="text-nuit">{s.nom}</b>
      </p>
    </div>
  )
}

// ── 1. Étape en cours : trouver le lieu ──────────────────────

function VueEtape({ parcours, etape, perso, partie }: { parcours: Parcours; etape: Etape; perso?: Personnage; partie: PartieEnCours }) {
  const aCarte = etape.lat !== undefined && etape.lng !== undefined
  const [carteVisible, setCarteVisible] = useState(false)
  const { etat, pos } = usePosition(carteVisible && aCarte)
  const points = useMemo<PointCarte[]>(
    () => (aCarte ? [{ lat: etape.lat!, lng: etape.lng!, type: 'cible', numero: partie.etapeIndex + 1, label: etape.titre }] : []),
    [aCarte, etape, partie.etapeIndex],
  )
  const distance = pos && aCarte ? distanceMetres(pos, { lat: etape.lat!, lng: etape.lng! }) : null

  return (
    <div className="animate-monte">
      <p className="text-sm font-bold text-terracotta flex items-center gap-1.5">
        <MapPin size={16} /> Trouve le lieu
      </p>
      <h1 className="mt-1 text-[28px] font-semibold leading-tight">{etape.titre}</h1>

      <div className="mt-5">
        <Bulle personnage={perso}>{etape.indice_lieu}</Bulle>
      </div>

      <SponsorEtape etape={etape} />

      {aCarte && (
        <div className="mt-5">
          {!carteVisible ? (
            <button type="button" className="btn-ghost w-full" onClick={() => setCarteVisible(true)}>
              <MapIcon size={18} /> Afficher la carte et ma position
            </button>
          ) : (
            <div className="carte p-3">
              <Carte points={points} position={pos} hauteur={210} />
              <p className="mt-2.5 text-sm font-semibold text-center">
                {etat === 'ok' && distance !== null && (
                  <>
                    {distance < 40 ? (
                      <span className="text-vert">Tu y es presque ! Cherche la balise autour de toi.</span>
                    ) : (
                      <>
                        Tu es à <span className="text-accent font-extrabold">{formatMetres(distance)}</span> du lieu
                      </>
                    )}
                  </>
                )}
                {etat === 'attente' && <span className="text-encre">Recherche de ta position…</span>}
                {(etat === 'refuse' || etat === 'indisponible') && (
                  <span className="text-encre">Position non disponible : pas grave, suis l’indice !</span>
                )}
              </p>
            </div>
          )}
        </div>
      )}
      {parcours.interieur && (
        <p className="mt-4 text-sm text-encre text-center">Parcours en intérieur : ouvre l’œil, la balise est tout près.</p>
      )}

      <div className="mt-6 grid gap-3">
        <button type="button" className="btn-accent w-full text-lg py-4" onClick={() => setPhase('scan')}>
          <ScanLine size={22} /> J’ai trouvé la balise
        </button>
        <button type="button" className="btn-ghost w-full" onClick={() => setPhase('pause')}>
          <PhoneOff size={18} /> Ranger mon téléphone
        </button>
      </div>
    </div>
  )
}

// ── 2. Scan de la balise (caméra ou code) ─────────────────────

function VueScan({ etape, partie }: { etape: Etape; partie: PartieEnCours }) {
  const [code, setCode] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [secoue, setSecoue] = useState(0)
  const [camera, setCamera] = useState(true)

  const essayer = (saisie: string) => {
    const r = verifierBalise(saisie)
    if (r.ok) return
    setSecoue((s) => s + 1)
    if (r.raison === 'deja') setErreur(`Tu as déjà trouvé la balise de l’étape ${r.etapeNumero}. Cherche celle de l’étape ${partie.etapeIndex + 1} !`)
    else if (r.raison === 'plus-tard') setErreur(`Bien vu, mais c’est la balise de l’étape ${r.etapeNumero} ! Trouve d’abord celle de l’étape ${partie.etapeIndex + 1}.`)
    else setErreur('Ce code ne correspond pas à cette étape. Vérifie les caractères inscrits sur la balise.')
  }

  return (
    <div className="animate-monte">
      <p className="text-sm font-bold text-terracotta flex items-center gap-1.5">
        <ScanLine size={16} /> {etape.titre}
      </p>
      <h1 className="mt-1 text-[28px] font-semibold leading-tight">Scanne la balise</h1>
      <p className="mt-1 text-encre">Vise le QR code, ou tape le code à 4 caractères inscrit dessous.</p>

      <div className="mt-4">
        {camera ? (
          <Scanner onLecture={essayer} />
        ) : (
          <button type="button" className="btn-ghost w-full" onClick={() => setCamera(true)}>
            <ScanLine size={18} /> Ouvrir la caméra
          </button>
        )}
      </div>

      <form
        className="mt-5 carte p-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (code.trim()) essayer(code)
        }}
      >
        <label htmlFor="code" className="flex items-center gap-2 font-bold">
          <KeyRound size={18} className="text-mer" /> Code de la balise
        </label>
        <div key={secoue} className={`mt-2 flex gap-2 ${secoue ? 'animate-secoue' : ''}`}>
          <input
            id="code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 16))
              setErreur(null)
            }}
            onFocus={() => setCamera(false)}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="EX. PUG7"
            className="min-w-0 flex-1 rounded-2xl bg-calcaire ring-2 ring-sable focus:ring-mer outline-none px-4 py-3 font-mono text-2xl font-bold tracking-[0.3em] uppercase placeholder:text-encre/30 placeholder:tracking-normal placeholder:text-base"
          />
          <button type="submit" className="btn-mer px-5" disabled={!code.trim()}>
            <Check size={22} />
          </button>
        </div>
        {erreur && <p className="mt-3 text-sm font-semibold text-terracotta">{erreur}</p>}
      </form>

      <button type="button" className="mt-4 w-full text-sm font-bold text-encre py-2" onClick={() => setPhase('etape')}>
        Revoir l’indice
      </button>
    </div>
  )
}

// ── 3. Énigme ──────────────────────────────────────────────

function GainPoints({ valeur }: { valeur: number }) {
  return (
    <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-2 animate-flotte font-titre text-3xl font-bold text-vert">
      +{valeur}
    </span>
  )
}

function VueEnigme({ parcours, etape, perso, partie }: { parcours: Parcours; etape: Etape; perso?: Personnage; partie: PartieEnCours }) {
  const e = etape.enigme
  const [faux, setFaux] = useState<number[]>([])
  const [saisie, setSaisie] = useState('')
  const [secoue, setSecoue] = useState(0)
  const [reussi, setReussi] = useState<number | null>(null)
  const [bonChoix, setBonChoix] = useState<number | null>(null)
  const [reaction, setReaction] = useState<string | null>(null)
  const [voirReponse, setVoirReponse] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const valeur = partie.rejouee ? 0 : pointsEtape(parcours, partie.erreurs, partie.indiceUtilise)
  const reactionsFaux = ['Raté ! Essaie encore.', 'Presque… mais non !', 'Hmm, pas tout à fait. Regarde autour de toi !']

  const succes = () => {
    setReussi(valeur)
    setReaction(null)
    timer.current = window.setTimeout(() => resoudreEnigme(), 1300)
  }
  const echec = () => {
    enregistrerErreur()
    setSecoue((s) => s + 1)
    setReaction(reactionsFaux[partie.erreurs % reactionsFaux.length])
  }

  const reponseTexte = e.reponses_acceptees?.[0] ?? ''

  return (
    <div className="animate-monte">
      <div className="flex items-center justify-between">
        <span className="puce bg-vert/10 text-vert animate-pop">
          <Check size={14} /> Balise trouvée
        </span>
        <span className={`puce ${partie.rejouee ? 'bg-sable text-encre' : 'bg-ocre-clair text-nuit'}`}>
          {partie.rejouee ? 'Partie rejouée : sans points' : `Énigme à ${valeur} pts`}
        </span>
      </div>
      <h1 className="mt-3 text-2xl font-semibold leading-tight">{etape.titre}</h1>

      <div className="mt-4">
        <Bulle personnage={perso}>
          <span className="font-semibold">{e.question}</span>
        </Bulle>
      </div>

      {reaction && !reussi && (
        <p key={secoue} className="mt-3 text-center font-bold text-terracotta animate-pop">
          {reaction} {!partie.rejouee && <span className="text-encre font-semibold">(-{config.points.penaliteErreur} pts)</span>}
        </p>
      )}

      <div className="relative mt-5">
        {reussi !== null && <GainPoints valeur={reussi} />}

        {e.type === 'qcm' && e.choix && (
          <div className="grid gap-2.5">
            {e.choix.map((c, i) => {
              const estFaux = faux.includes(i)
              const estBon = bonChoix === i
              return (
                <button
                  key={c}
                  type="button"
                  disabled={estFaux || reussi !== null}
                  onClick={() => {
                    if (i === e.bonne_reponse) {
                      setBonChoix(i)
                      succes()
                    } else {
                      setFaux([...faux, i])
                      echec()
                    }
                  }}
                  className={`flex items-center gap-3 w-full text-left rounded-2xl px-4 py-3.5 font-bold text-[17px] transition ring-2 ${
                    estBon
                      ? 'bg-vert text-white ring-vert animate-pop'
                      : estFaux
                        ? 'bg-terracotta-clair/60 text-terracotta/70 ring-transparent line-through animate-secoue'
                        : 'bg-white ring-sable active:scale-[0.98] active:ring-mer'
                  }`}
                >
                  <span
                    className={`grid place-items-center w-8 h-8 rounded-full text-sm shrink-0 ${estBon ? 'bg-white/25' : 'bg-mer-clair text-mer'}`}
                  >
                    {estBon ? <Check size={18} /> : String.fromCharCode(65 + i)}
                  </span>
                  {c}
                </button>
              )
            })}
          </div>
        )}

        {e.type === 'texte' && (
          <form
            onSubmit={(ev) => {
              ev.preventDefault()
              if (!saisie.trim() || reussi !== null) return
              if (reponseCorrecte(saisie, e.reponses_acceptees)) succes()
              else echec()
            }}
          >
            <div key={secoue} className={secoue ? 'animate-secoue' : ''}>
              <input
                value={voirReponse ? reponseTexte : saisie}
                onChange={(ev) => setSaisie(ev.target.value)}
                readOnly={reussi !== null || voirReponse}
                placeholder="Ta réponse"
                autoComplete="off"
                autoCorrect="off"
                className={`w-full rounded-2xl px-4 py-4 text-xl font-bold outline-none ring-2 transition ${
                  reussi !== null ? 'bg-vert text-white ring-vert' : 'bg-white ring-sable focus:ring-mer'
                }`}
              />
            </div>
            {reussi === null && !voirReponse && (
              <button type="submit" className="btn-accent w-full mt-3 text-lg" disabled={!saisie.trim()}>
                Valider ma réponse
              </button>
            )}
          </form>
        )}
      </div>

      {reussi !== null && (
        <p className="mt-4 text-center font-titre text-2xl font-semibold text-vert animate-pop">Bravo ! Bien joué.</p>
      )}

      {reussi === null && (
        <div className="mt-6 grid gap-2">
          {!partie.indiceUtilise ? (
            <button type="button" className="btn-ghost w-full" onClick={() => utiliserIndice()}>
              <Lightbulb size={18} className="text-ocre" /> Besoin d’un indice ?
              {!partie.rejouee && <span className="text-encre font-semibold">(-{config.points.penaliteIndice} pts)</span>}
            </button>
          ) : (
            <div className="rounded-2xl bg-ocre-clair px-4 py-3 animate-pop">
              <p className="text-xs font-bold text-terracotta flex items-center gap-1">
                <Lightbulb size={14} /> Indice
              </p>
              <p className="font-semibold">{e.indice}</p>
            </div>
          )}

          {partie.erreurs >= 3 && !voirReponse && (
            <button
              type="button"
              className="text-sm font-bold text-encre py-2 flex items-center justify-center gap-1.5"
              onClick={() => {
                if (e.type === 'qcm' && e.bonne_reponse !== undefined) {
                  setBonChoix(e.bonne_reponse)
                  succes()
                } else {
                  setVoirReponse(true)
                  succes()
                }
              }}
            >
              <Eye size={16} /> Bloqué ? Voir la réponse et continuer
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── 4. Anecdote ────────────────────────────────────────────

function VueAnecdote({ etape, perso, dernier, onSuite }: { etape: Etape; perso?: Personnage; dernier: boolean; onSuite: () => void }) {
  const a = etape.anecdote
  const [imageOk, setImageOk] = useState(true)
  return (
    <div className="animate-monte">
      <p className="text-sm font-bold text-terracotta flex items-center gap-1.5">
        <BookOpen size={16} /> Le secret du lieu
      </p>
      <h1 className="mt-1 text-[26px] font-semibold leading-tight">{a.titre}</h1>

      {a.image && imageOk && (
        <img
          src={asset(a.image)}
          alt=""
          onError={() => setImageOk(false)}
          className="mt-4 w-full aspect-[16/10] object-cover rounded-[var(--radius-carte)] bg-sable"
        />
      )}

      <div className="mt-4 carte p-5">
        <p className="text-[17px] leading-relaxed">{a.texte}</p>
        {perso && (
          <p className="mt-3 text-sm font-bold" style={{ color: perso.couleur }}>
            — {perso.nom}
          </p>
        )}
      </div>

      <button type="button" className="btn-accent w-full mt-6 text-lg py-4" onClick={onSuite}>
        {dernier ? (
          <>
            <Sparkles size={20} /> Terminer le parcours
          </>
        ) : (
          <>
            Étape suivante <ArrowRight size={20} />
          </>
        )}
      </button>
    </div>
  )
}

// ── 5. Écran en pause entre deux étapes ───────────────────────

function Pause({ parcours, partie, etape }: { parcours: Parcours; partie: PartieEnCours; etape: Etape }) {
  return (
    <div className="min-h-dvh flex flex-col bg-nuit text-white px-6 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between h-12">
        <Logo avecNom={false} />
        <span className="text-sm font-bold text-white/60">
          Étape {partie.etapeIndex + 1} sur {parcours.etapes.length}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="relative w-40 h-40 grid place-items-center">
          <span className="absolute inset-0 rounded-full bg-ocre animate-respire" />
          <span className="absolute inset-6 rounded-full bg-ocre/30 animate-respire [animation-delay:1.2s]" />
          <span className="relative grid place-items-center w-20 h-20 rounded-full bg-ocre text-nuit">
            <Eye size={36} />
          </span>
        </div>
        <h1 className="mt-8 text-3xl font-semibold leading-tight text-balance">{config.pause.titre}</h1>
        <p className="mt-3 text-white/70 text-lg">{config.pause.sousTitre}</p>
        <div className="mt-8 rounded-3xl bg-white/8 ring-1 ring-white/15 px-5 py-4 max-w-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-ocre">{etape.titre}</p>
          <p className="mt-1 text-white/90">{etape.indice_lieu}</p>
        </div>
      </div>

      <div className="grid gap-3">
        <button type="button" className="btn-accent w-full text-lg py-4" onClick={() => setPhase('scan')}>
          <ScanLine size={22} /> J’ai trouvé la balise
        </button>
        <button type="button" className="btn w-full bg-white/10 text-white" onClick={() => setPhase('etape')}>
          <MapIcon size={18} /> Revoir l’indice et la carte
        </button>
      </div>
    </div>
  )
}

// Lien profond : un QR scanné avec l'appareil photo ouvre /#/b/ID_BALISE.
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CircleHelp, ScanLine } from 'lucide-react'
import { getParcours, getPersonnage, trouverBalise } from '../lib/data'
import { commencerParcours, lire, setPhase } from '../lib/store'
import { Avatar, Logo } from '../components/ui'

type Issue =
  | { type: 'inconnue' }
  | { type: 'deja'; parcoursId: string; numero: number }
  | { type: 'plus-tard'; parcoursId: string; numero: number; attendue: number }
  | { type: 'autre-en-cours'; parcoursId: string; numero: number; enCoursId: string }
  | { type: 'pas-commence'; parcoursId: string; numero: number }

export default function BalisePage() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const [issue, setIssue] = useState<Issue | null>(null)
  const fait = useRef<string | null>(null)

  useEffect(() => {
    if (fait.current === id) return
    fait.current = id
    setIssue(null)
    traiter()
  }, [id, nav])

  function traiter() {
    const b = trouverBalise(id)
    if (!b) return setIssue({ type: 'inconnue' })
    const partie = lire().partie
    const pid = b.parcours.id

    if (partie && partie.parcoursId === pid) {
      if (b.index === partie.etapeIndex) {
        if (partie.phase === 'etape' || partie.phase === 'scan' || partie.phase === 'pause') setPhase('enigme')
        { nav(`/jeu/${pid}`, { replace: true }); return }
      }
      if (b.index < partie.etapeIndex) return setIssue({ type: 'deja', parcoursId: pid, numero: b.index + 1 })
      return setIssue({ type: 'plus-tard', parcoursId: pid, numero: b.index + 1, attendue: partie.etapeIndex + 1 })
    }
    if (partie) return setIssue({ type: 'autre-en-cours', parcoursId: pid, numero: b.index + 1, enCoursId: partie.parcoursId })
    if (b.index === 0) {
      // scanner la première balise lance directement le parcours
      commencerParcours(pid, 0, 'enigme')
      { nav(`/jeu/${pid}`, { replace: true }); return }
    }
    setIssue({ type: 'pas-commence', parcoursId: pid, numero: b.index + 1 })
  }

  if (!issue)
    return (
      <div className="min-h-dvh grid place-items-center">
        <ScanLine className="animate-pulse text-mer" size={40} />
      </div>
    )

  const p = 'parcoursId' in issue ? getParcours(issue.parcoursId) : undefined
  const perso = getPersonnage(p?.personnage)

  let titre = ''
  let texte = ''
  let action: { label: string; to: string } = { label: 'Voir les parcours', to: '/' }

  switch (issue.type) {
    case 'inconnue':
      titre = 'Balise inconnue'
      texte = 'Ce QR code ne correspond à aucune balise. Vérifie que tu scannes bien une balise du jeu.'
      break
    case 'deja':
      titre = 'Déjà trouvée !'
      texte = `Tu as déjà validé la balise de l’étape ${issue.numero}. Continue ton enquête !`
      action = { label: 'Continuer le parcours', to: `/jeu/${issue.parcoursId}` }
      break
    case 'plus-tard':
      titre = 'Pas si vite !'
      texte = `Bien vu, c’est la balise de l’étape ${issue.numero}. Mais tu dois d’abord trouver celle de l’étape ${issue.attendue}.`
      action = { label: 'Revenir à mon étape', to: `/jeu/${issue.parcoursId}` }
      break
    case 'autre-en-cours': {
      const autre = getParcours(issue.enCoursId)
      titre = 'Tu as un autre parcours en cours'
      texte = `Cette balise appartient à « ${p?.titre} » (étape ${issue.numero}). Tu joues actuellement à « ${autre?.titre} ».`
      action = { label: `Reprendre « ${autre?.titre} »`, to: `/jeu/${issue.enCoursId}` }
      break
    }
    case 'pas-commence':
      titre = 'Belle trouvaille !'
      texte = `Cette balise est l’étape ${issue.numero} du parcours « ${p?.titre} ». Commence le parcours depuis le début pour la valider.`
      action = { label: 'Découvrir le parcours', to: `/parcours/${issue.parcoursId}` }
      break
  }

  return (
    <div className="min-h-dvh flex flex-col fond-calcaire px-6 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="h-12 flex items-center">
        <Logo />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center animate-monte">
        {perso ? (
          <Avatar personnage={perso} taille={110} />
        ) : (
          <span className="grid place-items-center w-24 h-24 rounded-full bg-sable text-encre">
            <CircleHelp size={44} />
          </span>
        )}
        <h1 className="mt-5 text-3xl font-semibold">{titre}</h1>
        <p className="mt-2 text-lg text-encre max-w-sm">{texte}</p>
      </div>
      <div className="grid gap-2.5">
        <Link to={action.to} replace className="btn-accent w-full text-lg">
          {action.label}
        </Link>
        <Link to="/" replace className="btn-ghost w-full">
          Accueil
        </Link>
      </div>
    </div>
  )
}

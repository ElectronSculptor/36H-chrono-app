import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, CheckCircle2, Flag, Plus, Printer, RotateCcw, Sparkles, X } from 'lucide-react'
import { parcours, getParcours } from '../lib/data'
import { setDemoOuvert, useDemoOuvert } from '../lib/demo'
import {
  ajouterPoints,
  demoAllerALaFin,
  demoValiderEtape,
  reinitialiser,
  terminerOnboarding,
  useProgression,
} from '../lib/store'
import { Modal } from './ui'

export default function PanneauDemo() {
  const ouvert = useDemoOuvert()
  const nav = useNavigate()
  const { partie, points } = useProgression()
  const [confirmer, setConfirmer] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const p = getParcours(partie?.parcoursId)

  const fermer = () => {
    setDemoOuvert(false)
    setConfirmer(false)
    setMessage(null)
  }
  const aller = (to: string) => {
    fermer()
    nav(to)
  }

  return (
    <Modal ouvert={ouvert} onFermer={fermer}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles size={20} className="text-accent" /> Mode démo
        </h2>
        <button type="button" onClick={fermer} className="w-10 h-10 grid place-items-center rounded-full bg-sable" aria-label="Fermer">
          <X size={20} />
        </button>
      </div>

      <div className="carte p-3 mb-4 text-sm">
        <p>
          <b>{points}</b> points ·{' '}
          {p && partie ? (
            <>
              « {p.titre} », étape {partie.etapeIndex + 1}/{p.etapes.length} ({partie.phase})
            </>
          ) : (
            'aucun parcours en cours'
          )}
        </p>
      </div>

      {message && <p className="mb-3 rounded-xl bg-vert/10 text-vert font-bold px-3 py-2 text-sm">{message}</p>}

      <div className="grid gap-2.5">
        <button
          type="button"
          className="btn-mer justify-start"
          disabled={!partie || !['etape', 'scan', 'pause'].includes(partie.phase)}
          onClick={() => {
            demoValiderEtape()
            aller(`/jeu/${partie!.parcoursId}`)
          }}
        >
          <CheckCircle2 size={20} /> Valider l'étape en cours sans scanner
        </button>
        <button
          type="button"
          className="btn-mer justify-start"
          onClick={() => {
            const id = demoAllerALaFin(partie?.parcoursId ?? parcours[0].id)
            aller(`/fin/${id}`)
          }}
        >
          <Flag size={20} /> Aller directement à l'écran de fin
        </button>
        <button
          type="button"
          className="btn-ghost justify-start"
          onClick={() => {
            ajouterPoints(100)
            setMessage('+100 points ajoutés')
          }}
        >
          <Plus size={20} /> Ajouter 100 points
        </button>
        {!confirmer ? (
          <button type="button" className="btn-ghost justify-start text-terracotta" onClick={() => setConfirmer(true)}>
            <RotateCcw size={20} /> Réinitialiser la progression
          </button>
        ) : (
          <button
            type="button"
            className="btn justify-start bg-terracotta text-white"
            onClick={() => {
              reinitialiser()
              aller('/')
            }}
          >
            <RotateCcw size={20} /> Confirmer : tout effacer
          </button>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" className="btn-ghost text-sm px-3" onClick={() => aller('/partenaire')}>
            <BarChart3 size={18} /> Espace partenaire
          </button>
          <button type="button" className="btn-ghost text-sm px-3" onClick={() => aller('/admin/balises')}>
            <Printer size={18} /> Balises
          </button>
        </div>
        <button
          type="button"
          className="text-sm font-bold text-encre underline underline-offset-4 py-1"
          onClick={() => {
            terminerOnboarding(false)
            aller('/bienvenue')
          }}
        >
          Revoir l'écran d'accueil
        </button>
      </div>

      <details className="mt-4 text-sm">
        <summary className="font-bold cursor-pointer">Codes des balises (antisèche)</summary>
        <div className="mt-2 grid gap-3">
          {parcours.map((pc) => (
            <div key={pc.id}>
              <p className="font-bold">{pc.titre}</p>
              <ol className="mt-1 grid grid-cols-2 gap-1">
                {pc.etapes.map((e, i) => (
                  <li key={e.id} className="rounded-lg bg-white px-2 py-1">
                    {i + 1}. <span className="font-mono font-bold">{e.balise.code}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </details>
    </Modal>
  )
}

import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Clock, Coins, Flag, Footprints, Gift, MapPin, Navigation, Play, RotateCcw } from 'lucide-react'
import {
  difficulteTexte,
  formatDistance,
  formatDuree,
  getParcours,
  getPartenaire,
  getPersonnage,
  recompenses,
} from '../lib/data'
import { commencerParcours, pointsMaxParcours, useProgression } from '../lib/store'
import { Avatar, Bulle, Difficulte, Entete, LogoPartenaire, Modal, OffertPar } from '../components/ui'
import Carte, { type PointCarte } from '../components/Carte'

export default function DetailParcours() {
  const { id } = useParams()
  const p = getParcours(id)
  const nav = useNavigate()
  const { partie, termines } = useProgression()
  const [confirmer, setConfirmer] = useState(false)

  const points = useMemo<PointCarte[]>(() => {
    if (!p) return []
    return [{ lat: p.depart.lat, lng: p.depart.lng, type: 'depart', label: `Départ : ${p.depart.nom}` }]
  }, [p])

  if (!p) return <Navigate to="/" replace />
  const perso = getPersonnage(p.personnage)
  const partenaire = getPartenaire(p.offert_par)
  const aDebloquer = recompenses.filter((r) => r.debloquee_par === p.id)
  const enCoursIci = partie?.parcoursId === p.id
  const autrePartie = partie && !enCoursIci ? getParcours(partie.parcoursId) : undefined
  const dejaFini = !!termines[p.id]

  const lancer = () => {
    commencerParcours(p.id)
    nav(`/jeu/${p.id}`)
  }
  const onCommencer = () => {
    if (enCoursIci) return nav(`/jeu/${p.id}`)
    if (autrePartie) return setConfirmer(true)
    lancer()
  }

  return (
    <div className="min-h-dvh fond-calcaire pb-32">
      <Entete retour="/" titre="" />
      <div className="px-4 -mt-2">
        <div className="flex flex-col items-center text-center">
          <div className="animate-pop">
            <Avatar personnage={perso} taille={128} />
          </div>
          <p className="mt-3 text-sm font-bold" style={{ color: perso?.couleur }}>
            {perso?.nom}, {perso?.titre}
          </p>
          <h1 className="mt-1 text-[28px] leading-tight font-semibold text-balance">{p.titre}</h1>
          <p className="mt-1 flex items-center gap-1 text-encre">
            <MapPin size={16} /> {p.quartier}, {p.ville}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            <span className="puce bg-vert text-white">Gratuit</span>
            <OffertPar partenaire={partenaire} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2 text-center">
          {[
            { I: Clock, v: formatDuree(p.duree_min), l: 'durée' },
            { I: Footprints, v: formatDistance(p.distance_km), l: 'à pied' },
            { I: Flag, v: String(p.etapes.length), l: 'étapes' },
            { I: Coins, v: String(pointsMaxParcours(p)), l: 'points max' },
          ].map(({ I, v, l }) => (
            <div key={l} className="carte py-3 px-1">
              <I size={18} className="mx-auto text-mer" />
              <p className="mt-1 font-titre font-semibold text-lg leading-none">{v}</p>
              <p className="text-[11px] font-semibold text-encre mt-1">{l}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 flex items-center justify-center gap-2 text-sm font-semibold text-encre">
          Difficulté : <Difficulte niveau={p.difficulte} /> {difficulteTexte(p.difficulte)}
        </p>

        <div className="mt-6">
          <Bulle personnage={perso}>{p.intro}</Bulle>
        </div>

        <section className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Point de départ</h2>
          <div className="carte p-3">
            <Carte points={points} hauteur={190} />
            <div className="mt-3 flex items-start gap-3 px-1">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-accent text-white shrink-0">
                <MapPin size={18} />
              </span>
              <div className="flex-1">
                <p className="font-bold leading-tight">{p.depart.nom}</p>
                <p className="text-sm text-encre">{p.depart.indication}</p>
              </div>
            </div>
            <a
              className="btn-ghost w-full mt-3 text-sm py-2.5"
              href={`https://www.google.com/maps/dir/?api=1&destination=${p.depart.lat},${p.depart.lng}&travelmode=walking`}
              target="_blank"
              rel="noreferrer"
            >
              <Navigation size={16} /> Itinéraire à pied
            </a>
          </div>
        </section>

        {aDebloquer.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-semibold mb-2">À la clé</h2>
            {aDebloquer.map((r) => (
              <div key={r.id} className="carte p-4 flex items-center gap-3">
                <LogoPartenaire partenaire={getPartenaire(r.partenaire)} taille={44} />
                <div className="flex-1">
                  <p className="text-xs font-bold text-terracotta flex items-center gap-1">
                    <Gift size={14} /> Récompense débloquée à la fin
                  </p>
                  <p className="font-bold leading-tight">{r.titre}</p>
                  <p className="text-sm text-encre">{getPartenaire(r.partenaire)?.nom}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        <p className="mt-6 text-sm text-encre text-center px-4">
          Entre deux étapes, l’app se met en pause : le jeu se passe autour de toi, pas sur l’écran.
        </p>
      </div>

      <div className="fixed bottom-0 inset-x-0 z-20">
        <div className="mx-auto max-w-md px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-calcaire via-calcaire to-calcaire/0">
          <button type="button" className="btn-accent w-full text-lg py-4" onClick={onCommencer}>
            {enCoursIci ? (
              <>
                <Play size={20} fill="currentColor" /> Reprendre (étape {partie!.etapeIndex + 1})
              </>
            ) : dejaFini ? (
              <>
                <RotateCcw size={20} /> Rejouer le parcours
              </>
            ) : (
              <>
                <Play size={20} fill="currentColor" /> Commencer
              </>
            )}
          </button>
          {dejaFini && !enCoursIci && (
            <p className="mt-2 text-center text-xs font-semibold text-encre">Déjà terminé : les points ne se gagnent qu’une fois.</p>
          )}
        </div>
      </div>

      <Modal ouvert={confirmer} onFermer={() => setConfirmer(false)}>
        <h2 className="text-xl font-semibold">Un parcours est déjà en cours</h2>
        <p className="mt-2 text-encre">
          Tu es en train de jouer « {autrePartie?.titre} ». Si tu commences celui-ci, ta progression sur l’autre sera perdue.
        </p>
        <div className="mt-5 grid gap-2.5">
          <button type="button" className="btn-accent" onClick={lancer}>
            Commencer « {p.titre} »
          </button>
          <button type="button" className="btn-ghost" onClick={() => nav(`/jeu/${autrePartie?.id}`)}>
            Reprendre l’autre parcours
          </button>
        </div>
      </Modal>
    </div>
  )
}

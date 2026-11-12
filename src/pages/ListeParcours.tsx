import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, Footprints, MapPin, Play, Flag } from 'lucide-react'
import { config } from '../config'
import {
  difficulteTexte,
  formatDistance,
  formatDuree,
  getParcours,
  getPartenaire,
  getPersonnage,
  parcours,
  personnages,
} from '../lib/data'
import { useProgression } from '../lib/store'
import { Avatar, Difficulte, Entete, OffertPar } from '../components/ui'

export default function ListeParcours() {
  const { partie, termines } = useProgression()
  const enCours = getParcours(partie?.parcoursId)
  const bientot = personnages.filter((p) => p.bientot)

  return (
    <div className="fond-calcaire min-h-dvh">
      <Entete />
      <div className="px-4">
        <section className="pt-2 pb-5">
          <h1 className="text-[28px] leading-tight font-semibold text-balance">Où part-on enquêter aujourd’hui ?</h1>
          <p className="mt-1.5 text-encre">{config.messageCle}</p>
        </section>

        {enCours && partie && (
          <Link
            to={`/jeu/${enCours.id}`}
            className="mb-5 flex items-center gap-3 rounded-[var(--radius-carte)] bg-mer text-white p-4 shadow-[0_6px_0_0_color-mix(in_oklab,var(--color-mer)_70%,black)] active:translate-y-1 active:shadow-[0_2px_0_0_color-mix(in_oklab,var(--color-mer)_70%,black)] transition"
          >
            <Avatar personnage={getPersonnage(enCours.personnage)} taille={48} anneau={false} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-white/70">Parcours en cours</p>
              <p className="font-titre font-semibold text-lg leading-tight truncate">{enCours.titre}</p>
              <p className="text-sm text-white/80">
                Étape {partie.etapeIndex + 1} sur {enCours.etapes.length}
              </p>
            </div>
            <span className="grid place-items-center w-11 h-11 rounded-full bg-accent shrink-0">
              <Play size={20} fill="currentColor" />
            </span>
          </Link>
        )}

        <ul className="grid gap-4">
          {parcours.map((p, i) => {
            const perso = getPersonnage(p.personnage)
            const fini = termines[p.id]
            return (
              <li key={p.id} className="animate-monte" style={{ animationDelay: `${i * 80}ms` }}>
                <Link to={`/parcours/${p.id}`} className="block carte overflow-hidden active:scale-[0.99] transition">
                  <div className="relative h-28 flex items-end px-4 pb-3" style={{ background: `${perso?.couleur ?? '#155E8B'}1f` }}>
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 112" aria-hidden="true">
                      <path d="M0 80 C60 64 120 96 200 80 S340 62 400 76 V112 H0Z" fill={perso?.couleur ?? '#155E8B'} opacity=".14" />
                      <path d="M0 96 C80 84 140 108 220 96 S350 84 400 92 V112 H0Z" fill={perso?.couleur ?? '#155E8B'} opacity=".16" />
                    </svg>
                    <div className="absolute top-3 left-4 flex flex-wrap gap-1.5">
                      <span className="puce bg-vert text-white">Gratuit</span>
                      {fini && (
                        <span className="puce bg-white text-vert">
                          <CheckCircle2 size={14} /> Terminé
                        </span>
                      )}
                    </div>
                    <div className="absolute -bottom-0 right-4 translate-y-3">
                      <Avatar personnage={perso} taille={84} />
                    </div>
                    <p className="relative text-sm font-bold pr-24 leading-tight" style={{ color: perso?.couleur }}>
                      avec {perso?.nom}, {perso?.titre}
                    </p>
                  </div>
                  <div className="p-4 pt-3">
                    <h2 className="text-xl font-semibold leading-snug pr-20">{p.titre}</h2>
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-encre">
                      <MapPin size={15} /> {p.quartier}, {p.ville}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-semibold text-nuit">
                      <span className="flex items-center gap-1.5">
                        <Clock size={16} className="text-mer" /> {formatDuree(p.duree_min)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Footprints size={16} className="text-mer" /> {formatDistance(p.distance_km)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Flag size={16} className="text-mer" /> {p.etapes.length} étapes
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Difficulte niveau={p.difficulte} /> {difficulteTexte(p.difficulte)}
                      </span>
                    </div>
                    {p.offert_par && (
                      <div className="mt-3">
                        <OffertPar partenaire={getPartenaire(p.offert_par)} />
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>

        {bientot.length > 0 && (
          <section className="mt-8 mb-4">
            <h2 className="text-lg font-semibold">Bientôt dans ta ville</h2>
            <p className="text-sm text-encre">De nouveaux personnages préparent leurs enquêtes.</p>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {bientot.map((p) => (
                <div key={p.id} className="carte p-3 w-32 shrink-0 text-center">
                  <div className="mx-auto w-fit">
                    <Avatar personnage={p} taille={64} verrouille />
                  </div>
                  <p className="mt-2 text-sm font-bold leading-tight">{p.nom}</p>
                  <p className="text-xs text-encre leading-tight">{p.titre}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

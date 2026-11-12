import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Clock, Coins, Gift, Share2, Sparkles, Trophy } from 'lucide-react'
import { config } from '../config'
import { getParcours, getPartenaire, getPersonnage, recompenses } from '../lib/data'
import { useProgression } from '../lib/store'
import { Avatar, Bulle, Confettis, LogoPartenaire } from '../components/ui'

function formatTemps(ms: number) {
  const min = Math.max(1, Math.round(ms / 60000))
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`
}

function Compteur({ valeur }: { valeur: number }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (valeur <= 0) return
    const debut = performance.now()
    const duree = 1200
    let raf = 0
    const tick = (t: number) => {
      const k = Math.min(1, (t - debut) / duree)
      setV(Math.round(valeur * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [valeur])
  return <>{v}</>
}

export default function Fin() {
  const { id } = useParams()
  const p = getParcours(id)
  const prog = useProgression()
  const [partage, setPartage] = useState<string | null>(null)

  if (!p) return <Navigate to="/" replace />
  const resultat =
    prog.derniereFin?.parcoursId === p.id
      ? prog.derniereFin
      : prog.termines[p.id]
        ? { parcoursId: p.id, points: prog.termines[p.id].points, dureeMs: prog.termines[p.id].dureeMs, rejouee: false }
        : null
  if (!resultat) return <Navigate to={`/parcours/${p.id}`} replace />

  const perso = getPersonnage(p.personnage)
  const debloquees = recompenses.filter((r) => r.debloquee_par === p.id)
  const abordable = recompenses
    .filter((r) => !r.debloquee_par || prog.termines[r.debloquee_par])
    .sort((a, b) => a.cout_points - b.cout_points)[0]
  const aMontrer = debloquees.length ? debloquees : abordable ? [abordable] : []
  const sponsor = getPartenaire(p.sponsor_fin)

  const partager = async () => {
    const url = (config.urlSite || `${location.origin}${location.pathname}`).split('#')[0]
    const texte = `J’ai terminé « ${p.titre} » avec ${perso?.nom ?? config.nom} et gagné ${resultat.points} points ! ${config.messageCle}`
    try {
      if (navigator.share) {
        await navigator.share({ title: config.nom, text: texte, url })
        return
      }
      await navigator.clipboard.writeText(`${texte} ${url}`)
      setPartage('Message copié : colle-le où tu veux !')
    } catch {
      /* partage annulé */
    }
  }

  return (
    <div className="min-h-dvh fond-calcaire pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <Confettis />
      <section className="relative bg-mer text-white text-center px-6 pt-[calc(2.5rem+env(safe-area-inset-top))] pb-16 rounded-b-[2.5rem] overflow-hidden">
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 30 C80 10 140 50 220 30 S340 12 400 26 V60 H0Z" fill="#fff" opacity=".07" />
          <path d="M0 44 C70 30 150 60 230 44 S350 32 400 40 V60 H0Z" fill="#fff" opacity=".08" />
        </svg>
        <div className="mx-auto grid place-items-center w-20 h-20 rounded-full bg-ocre text-nuit animate-pop">
          <Trophy size={40} />
        </div>
        <p className="mt-4 font-bold text-white/75">Parcours terminé !</p>
        <h1 className="mt-1 text-3xl font-semibold leading-tight text-balance">{p.titre}</h1>
        <div className="mt-5 flex justify-center gap-3">
          <div className="rounded-2xl bg-white/12 px-4 py-2.5">
            <p className="font-titre text-3xl font-bold flex items-center gap-1.5 justify-center">
              <Coins size={24} className="text-ocre" /> +<Compteur valeur={resultat.points} />
            </p>
            <p className="text-xs font-bold text-white/70">points gagnés</p>
          </div>
          <div className="rounded-2xl bg-white/12 px-4 py-2.5">
            <p className="font-titre text-3xl font-bold flex items-center gap-1.5 justify-center">
              <Clock size={22} className="text-ocre" /> {formatTemps(resultat.dureeMs)}
            </p>
            <p className="text-xs font-bold text-white/70">passées dehors</p>
          </div>
        </div>
        {resultat.rejouee && <p className="mt-3 text-sm text-white/75">Partie rejouée : tes points avaient déjà été gagnés.</p>}
      </section>

      <div className="px-4 -mt-8 relative">
        <div className="carte p-5 text-center animate-monte">
          <p className="text-xs font-bold uppercase tracking-wide text-terracotta flex items-center justify-center gap-1.5">
            <Sparkles size={14} /> Nouveau personnage dans ta collection
          </p>
          <div className="mt-3 mx-auto w-fit animate-pop [animation-delay:300ms]">
            <Avatar personnage={perso} taille={104} />
          </div>
          <p className="mt-2 font-titre text-2xl font-semibold">{perso?.nom}</p>
          <p className="text-encre">{perso?.titre}</p>
        </div>

        <div className="mt-5">
          <Bulle personnage={perso}>{p.conclusion}</Bulle>
        </div>

        {aMontrer.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Gift size={20} className="text-accent" /> {debloquees.length ? 'Récompense débloquée' : 'Avec tes points'}
            </h2>
            {aMontrer.map((r) => {
              const part = getPartenaire(r.partenaire)
              const assez = prog.points >= r.cout_points
              return (
                <div key={r.id} className="carte p-4 ring-2 ring-ocre/60">
                  <div className="flex items-center gap-3">
                    <LogoPartenaire partenaire={part} taille={48} />
                    <div className="flex-1">
                      <p className="font-bold text-lg leading-tight">{r.titre}</p>
                      <p className="text-sm text-encre">{part?.nom}</p>
                    </div>
                    <span className="puce bg-ocre-clair text-sm">{r.cout_points} pts</span>
                  </div>
                  <Link to="/recompenses" className={`${assez ? 'btn-accent' : 'btn-ghost'} w-full mt-4`}>
                    {assez ? 'Échanger mes points' : `Encore ${r.cout_points - prog.points} pts pour l’obtenir`}
                  </Link>
                </div>
              )
            })}
          </section>
        )}

        {sponsor?.offre_native && (
          <section className="mt-6">
            <div className="rounded-[var(--radius-carte)] bg-white/70 ring-1 ring-sable p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-encre/70">Partenaire</p>
              <div className="mt-2 flex items-start gap-3">
                <LogoPartenaire partenaire={sponsor} taille={44} />
                <div className="flex-1">
                  <p className="font-bold leading-tight">{sponsor.offre_native.titre}</p>
                  <p className="mt-1 text-sm text-encre">{sponsor.offre_native.texte}</p>
                  <Link to="/recompenses" className="mt-2 inline-block text-sm font-bold text-mer underline underline-offset-4">
                    {sponsor.offre_native.bouton}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="mt-6 grid gap-2.5">
          <button type="button" className="btn-mer w-full" onClick={partager}>
            <Share2 size={18} /> Partager mon exploit
          </button>
          {partage && <p className="text-center text-sm font-bold text-vert">{partage}</p>}
          <Link to="/" className="btn-ghost w-full">
            Découvrir d’autres parcours
          </Link>
        </div>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { BarChart3, Clock, Coins, Flag, Headphones, Sparkles, Swords, Ticket } from 'lucide-react'
import { config } from '../config'
import { parcours, personnages } from '../lib/data'
import { useProgression } from '../lib/store'
import { Avatar, Entete } from '../components/ui'

const ICONES_PLUS = [Sparkles, Swords, Headphones]

function formatDehors(ms: number) {
  const min = Math.round(ms / 60000)
  if (min < 60) return { v: String(min), u: 'min' }
  return { v: `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`, u: '' }
}

export default function Profil() {
  const { points, termines, personnages: debloques, tempsDehorsMs, coupons } = useProgression()
  const nbTermines = Object.keys(termines).length
  const dehors = formatDehors(tempsDehorsMs)

  const stats = [
    { I: Coins, v: String(points), u: 'pts', l: 'Solde de points', c: 'text-ocre' },
    { I: Flag, v: `${nbTermines}/${parcours.length}`, u: '', l: 'Parcours terminés', c: 'text-vert' },
    { I: Clock, v: dehors.v, u: dehors.u, l: 'Temps passé dehors', c: 'text-mer' },
    { I: Ticket, v: String(coupons.length), u: '', l: 'Coupons obtenus', c: 'text-accent' },
  ]

  return (
    <div className="fond-calcaire min-h-dvh">
      <Entete />
      <div className="px-4">
        <h1 className="text-[28px] font-semibold leading-tight">Mon carnet d’explorateur</h1>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {stats.map(({ I, v, u, l, c }) => (
            <div key={l} className="carte p-4">
              <I size={22} className={c} />
              <p className="mt-2 font-titre text-[28px] font-bold leading-none">
                {v} {u && <span className="text-base text-encre font-semibold">{u}</span>}
              </p>
              <p className="mt-1 text-sm font-semibold text-encre">{l}</p>
            </div>
          ))}
        </div>
        {tempsDehorsMs > 0 && (
          <p className="mt-3 text-sm text-encre text-center">Autant de temps repris aux écrans, à explorer ta ville.</p>
        )}

        <section className="mt-7">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Ma collection</h2>
            <span className="text-sm font-bold text-encre">
              {debloques.length}/{personnages.length}
            </span>
          </div>
          <p className="text-sm text-encre">Termine un parcours pour débloquer son personnage.</p>
          <ul className="mt-3 grid grid-cols-3 gap-3">
            {personnages.map((p) => {
              const ok = debloques.includes(p.id)
              return (
                <li key={p.id} className="carte p-3 text-center">
                  <div className="mx-auto w-fit">
                    <Avatar personnage={p} taille={68} verrouille={!ok} anneau={ok} />
                  </div>
                  <p className="mt-2 text-sm font-bold leading-tight">{ok ? p.nom : '???'}</p>
                  <p className="text-[11px] text-encre leading-tight">{ok ? p.titre : p.bientot ? 'Bientôt' : 'À découvrir'}</p>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="mt-7">
          <h2 className="text-lg font-semibold">Options Plus</h2>
          <p className="text-sm text-encre">Des bonus facultatifs. L’essentiel restera toujours gratuit.</p>
          <ul className="mt-3 grid gap-2.5">
            {config.optionsPlus.map((o, k) => {
              const I = ICONES_PLUS[k] ?? Sparkles
              return (
                <li key={o.titre} className="carte p-4 flex items-center gap-3">
                  <span className="grid place-items-center w-11 h-11 rounded-xl bg-ocre-clair text-terracotta shrink-0">
                    <I size={22} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold leading-tight">{o.titre}</p>
                    <p className="text-sm text-encre">{o.texte}</p>
                  </div>
                  <span className="puce bg-sable text-encre shrink-0">Bientôt</span>
                </li>
              )
            })}
          </ul>
        </section>

        <Link to="/partenaire" className="mt-7 mb-4 carte p-4 flex items-center gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-xl bg-mer text-white shrink-0">
            <BarChart3 size={22} />
          </span>
          <div className="flex-1">
            <p className="font-bold leading-tight">Vous êtes un musée ou un commerce ?</p>
            <p className="text-sm text-encre">Découvrez l’espace partenaire</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

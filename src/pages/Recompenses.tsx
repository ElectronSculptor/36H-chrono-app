import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Coins, Lock, Ticket } from 'lucide-react'
import { getParcours, getPartenaire, getRecompense, recompenses } from '../lib/data'
import { echangerRecompense, useProgression } from '../lib/store'
import type { Recompense } from '../lib/types'
import { Entete, LogoPartenaire, Modal } from '../components/ui'

export default function Recompenses() {
  const { points, termines, coupons } = useProgression()
  const nav = useNavigate()
  const [choix, setChoix] = useState<Recompense | null>(null)
  const maintenant = Date.now()
  const actifs = coupons.filter((c) => c.expireLe > maintenant)

  return (
    <div className="fond-calcaire min-h-dvh">
      <Entete />
      <div className="px-4">
        <section className="relative overflow-hidden rounded-[var(--radius-carte)] bg-mer text-white p-5">
          <svg className="absolute right-0 bottom-0 w-48 opacity-15" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="70" cy="70" r="40" fill="none" stroke="#fff" strokeWidth="10" />
            <circle cx="70" cy="70" r="18" fill="#fff" />
          </svg>
          <p className="font-bold text-white/75">Ton solde</p>
          <p className="mt-1 font-titre text-5xl font-bold flex items-center gap-2">
            <Coins size={36} className="text-ocre" />
            <span key={points} className="animate-pop tabular-nums">{points}</span>
            <span className="text-2xl text-white/70">pts</span>
          </p>
          <p className="mt-2 text-sm text-white/80">Termine des parcours pour gagner des points, puis échange-les chez nos partenaires.</p>
        </section>

        {actifs.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Mes coupons</h2>
            <ul className="grid gap-2.5">
              {actifs.map((c) => {
                const r = getRecompense(c.recompenseId)
                return (
                  <li key={c.id}>
                    <Link to={`/coupon/${c.id}`} className="carte p-3.5 flex items-center gap-3 active:scale-[0.99] transition">
                      <span className="grid place-items-center w-11 h-11 rounded-xl bg-accent text-white">
                        <Ticket size={22} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold leading-tight truncate">{r?.titre}</p>
                        <p className="text-sm text-encre font-mono">{c.code}</p>
                      </div>
                      <ChevronRight className="text-encre" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <section className="mt-6">
          <h2 className="text-lg font-semibold">Offres partenaires</h2>
          <p className="text-sm text-encre mb-3">Offertes par les partenaires : pour toi, c’est 100 % gratuit.</p>
          <ul className="grid gap-3">
            {recompenses.map((r) => {
              const part = getPartenaire(r.partenaire)
              const verrou = r.debloquee_par && !termines[r.debloquee_par] ? getParcours(r.debloquee_par) : undefined
              const manque = Math.max(0, r.cout_points - points)
              return (
                <li key={r.id} className={`carte p-4 ${verrou ? 'opacity-80' : ''}`}>
                  <div className="flex items-start gap-3">
                    <LogoPartenaire partenaire={part} taille={48} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[17px] leading-tight">{r.titre}</p>
                      <p className="text-sm text-encre">{part?.nom}</p>
                      <p className="mt-1 text-sm text-encre">{r.description}</p>
                    </div>
                    <span className="puce bg-ocre-clair text-sm shrink-0">{r.cout_points} pts</span>
                  </div>
                  {verrou ? (
                    <p className="mt-3 flex items-center gap-2 rounded-xl bg-sable px-3 py-2 text-sm font-semibold">
                      <Lock size={16} className="shrink-0" /> Termine « {verrou.titre} » pour la débloquer
                    </p>
                  ) : manque > 0 ? (
                    <div className="mt-3">
                      <div className="h-2 rounded-full bg-sable overflow-hidden">
                        <div className="h-full bg-ocre rounded-full" style={{ width: `${Math.min(100, (points / r.cout_points) * 100)}%` }} />
                      </div>
                      <p className="mt-1.5 text-sm font-semibold text-encre">Encore {manque} pts</p>
                    </div>
                  ) : (
                    <button type="button" className="btn-accent w-full mt-3" onClick={() => setChoix(r)}>
                      Échanger {r.cout_points} pts
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <Modal ouvert={!!choix} onFermer={() => setChoix(null)}>
        {choix && (
          <>
            <div className="flex items-center gap-3">
              <LogoPartenaire partenaire={getPartenaire(choix.partenaire)} taille={48} />
              <div>
                <h2 className="text-xl font-semibold leading-tight">{choix.titre}</h2>
                <p className="text-encre">{getPartenaire(choix.partenaire)?.nom}</p>
              </div>
            </div>
            <p className="mt-4">
              Échanger <b>{choix.cout_points} points</b> contre ce coupon ? Il sera valable <b>{choix.validite_heures} h</b> à partir de maintenant.
            </p>
            {choix.conditions && <p className="mt-2 text-sm text-encre">{choix.conditions}</p>}
            <div className="mt-5 grid gap-2.5">
              <button
                type="button"
                className="btn-accent"
                onClick={() => {
                  const c = echangerRecompense(choix.id)
                  setChoix(null)
                  if (c) nav(`/coupon/${c.id}`)
                }}
              >
                Oui, je l’échange
              </button>
              <button type="button" className="btn-ghost" onClick={() => setChoix(null)}>
                Plus tard
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

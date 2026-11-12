import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Footprints, Gift, Ticket, MapPinned, ScanLine, Lightbulb } from 'lucide-react'
import { config } from '../config'
import { personnages } from '../lib/data'
import { terminerOnboarding } from '../lib/store'
import { Avatar, Logo } from '../components/ui'

const ICONES_ETAPES = [MapPinned, Footprints, ScanLine, Lightbulb]

function Illustration({ index }: { index: number }) {
  if (index === 0)
    return (
      <div className="relative h-56 grid place-items-center">
        <div className="absolute w-52 h-52 rounded-full bg-mer-clair" />
        <div className="absolute w-36 h-36 rounded-full bg-ocre-clair translate-x-16 -translate-y-10" />
        <div className="relative flex -space-x-5">
          {personnages.slice(0, 2).map((p, i) => (
            <div key={p.id} className="animate-pop" style={{ animationDelay: `${i * 120}ms` }}>
              <Avatar personnage={p} taille={116} />
            </div>
          ))}
        </div>
      </div>
    )
  if (index === 1)
    return (
      <div className="relative h-56 grid place-items-center">
        <div className="absolute w-52 h-52 rounded-full bg-ocre-clair" />
        <div className="relative carte w-40 h-40 grid place-items-center rotate-[-6deg] animate-pop">
          <ScanLine size={64} className="text-mer" strokeWidth={1.6} />
          <span className="absolute bottom-3 font-mono font-bold text-xl tracking-[0.25em] text-nuit">PUG7</span>
        </div>
      </div>
    )
  return (
    <div className="relative h-56 grid place-items-center">
      <div className="absolute w-52 h-52 rounded-full bg-terracotta-clair" />
      <div className="relative carte w-56 p-4 rotate-[4deg] animate-pop">
        <div className="flex items-center gap-2 text-terracotta font-bold text-sm">
          <Gift size={18} /> Récompense
        </div>
        <p className="font-titre text-xl font-semibold mt-1 leading-tight">-50 % sur une entrée musée</p>
        <div className="mt-3 flex justify-between items-center text-sm">
          <span className="puce bg-ocre-clair">120 pts</span>
          <Ticket size={18} className="text-mer" />
        </div>
      </div>
    </div>
  )
}

export default function Bienvenue() {
  const [i, setI] = useState(0)
  const nav = useNavigate()
  const ecrans = config.onboarding
  const ecran = ecrans[i]
  const dernier = i === ecrans.length - 1

  const finir = () => {
    terminerOnboarding()
    nav('/', { replace: true })
  }

  return (
    <div className="min-h-dvh flex flex-col fond-calcaire px-6 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between h-12">
        <Logo />
        <button type="button" onClick={finir} className="text-sm font-bold text-encre px-2 py-2">
          Passer
        </button>
      </div>

      <div key={i} className="flex-1 flex flex-col justify-center animate-monte">
        <Illustration index={i} />
        <h1 className="mt-6 text-3xl font-semibold leading-tight text-balance">{ecran.titre}</h1>
        {ecran.texte && <p className="mt-3 text-lg text-encre leading-relaxed">{ecran.texte}</p>}
        {'etapes' in ecran && ecran.etapes && (
          <ol className="mt-4 grid gap-2.5">
            {ecran.etapes.map((t, k) => {
              const Icone = ICONES_ETAPES[k] ?? Lightbulb
              return (
                <li key={t} className="flex items-center gap-3 carte px-3 py-2.5">
                  <span className="grid place-items-center w-9 h-9 rounded-xl bg-mer text-white shrink-0">
                    <Icone size={18} />
                  </span>
                  <span className="font-semibold">{t}</span>
                </li>
              )
            })}
          </ol>
        )}
        {i === 0 && <p className="mt-4 font-bold text-terracotta">{config.messageCle}</p>}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="flex gap-2" aria-label={`Écran ${i + 1} sur ${ecrans.length}`}>
          {ecrans.map((_, k) => (
            <span key={k} className={`h-2.5 rounded-full transition-all ${k === i ? 'w-7 bg-accent' : 'w-2.5 bg-sable'}`} />
          ))}
        </div>
        <button type="button" className="btn-accent" onClick={() => (dernier ? finir() : setI(i + 1))}>
          {dernier ? 'C’est parti !' : 'Suivant'} <ArrowRight size={20} />
        </button>
      </div>
    </div>
  )
}

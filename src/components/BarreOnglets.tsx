import { NavLink } from 'react-router-dom'
import { Compass, Gift, UserRound } from 'lucide-react'

const onglets = [
  { to: '/', label: 'Parcours', Icone: Compass },
  { to: '/recompenses', label: 'Récompenses', Icone: Gift },
  { to: '/profil', label: 'Profil', Icone: UserRound },
]

export default function BarreOnglets() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 no-print">
      <div className="mx-auto max-w-md bg-white/95 backdrop-blur border-t border-sable pb-[env(safe-area-inset-bottom)]">
        <ul className="grid grid-cols-3">
          {onglets.map(({ to, label, Icone }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-2.5 text-xs font-bold transition ${isActive ? 'text-accent' : 'text-encre/70'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`grid place-items-center w-12 h-7 rounded-full transition ${isActive ? 'bg-accent/10' : ''}`}>
                      <Icone size={22} strokeWidth={isActive ? 2.6 : 2} />
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

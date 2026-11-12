import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import BarreOnglets from './components/BarreOnglets'
import PanneauDemo from './components/PanneauDemo'
import { useProgression } from './lib/store'
import Bienvenue from './pages/Bienvenue'
import ListeParcours from './pages/ListeParcours'
import DetailParcours from './pages/DetailParcours'
import Jeu from './pages/Jeu'
import Fin from './pages/Fin'
import Recompenses from './pages/Recompenses'
import Profil from './pages/Profil'
import BalisePage from './pages/Balise'

// Pages chargées à la demande (QR codes, tableau de bord) pour alléger le démarrage
const CouponPage = lazy(() => import('./pages/Coupon'))
const Partenaire = lazy(() => import('./pages/Partenaire'))
const AdminBalises = lazy(() => import('./pages/AdminBalises'))

function RemonterEnHaut() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

/** Colonne « téléphone » centrée, avec ou sans barre d'onglets. */
function Mobile({ children, onglets = false }: { children: ReactNode; onglets?: boolean }) {
  return (
    <div className="mx-auto max-w-md min-h-dvh relative bg-calcaire shadow-[0_0_60px_-30px_rgba(13,43,62,0.4)]">
      <div className={onglets ? 'pb-24' : ''}>{children}</div>
      {onglets && <BarreOnglets />}
    </div>
  )
}

function Accueil() {
  const { onboardingVu } = useProgression()
  if (!onboardingVu) return <Navigate to="/bienvenue" replace />
  return (
    <Mobile onglets>
      <ListeParcours />
    </Mobile>
  )
}

export default function App() {
  return (
    <HashRouter>
      <RemonterEnHaut />
      <div className="min-h-dvh bg-sable/60">
        <Suspense fallback={<div className="min-h-dvh" />}>
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/bienvenue" element={<Mobile><Bienvenue /></Mobile>} />
          <Route path="/parcours/:id" element={<Mobile><DetailParcours /></Mobile>} />
          <Route path="/jeu/:id" element={<Mobile><Jeu /></Mobile>} />
          <Route path="/fin/:id" element={<Mobile><Fin /></Mobile>} />
          <Route path="/recompenses" element={<Mobile onglets><Recompenses /></Mobile>} />
          <Route path="/coupon/:id" element={<Mobile><CouponPage /></Mobile>} />
          <Route path="/profil" element={<Mobile onglets><Profil /></Mobile>} />
          <Route path="/b/:id" element={<Mobile><BalisePage /></Mobile>} />
          <Route path="/partenaire" element={<Partenaire />} />
          <Route path="/admin/balises" element={<AdminBalises />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        <PanneauDemo />
      </div>
    </HashRouter>
  )
}

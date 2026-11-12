import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Timer } from 'lucide-react'
import { config } from '../config'
import { getPartenaire, getRecompense } from '../lib/data'
import { useProgression } from '../lib/store'
import { Entete, LogoPartenaire } from '../components/ui'

function decompte(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return { h, m, sec }
}

export default function CouponPage() {
  const { id } = useParams()
  const { coupons } = useProgression()
  const coupon = coupons.find((c) => c.id === id)
  const [maintenant, setMaintenant] = useState(Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setMaintenant(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])

  if (!coupon) return <Navigate to="/recompenses" replace />
  const r = getRecompense(coupon.recompenseId)
  const part = getPartenaire(r?.partenaire)
  const reste = coupon.expireLe - maintenant
  const expire = reste <= 0
  const { h, m, sec } = decompte(reste)
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="min-h-dvh fond-calcaire pb-10">
      <Entete retour="/recompenses" titre="Mon coupon" />
      <div className="px-4">
        <div className={`relative carte overflow-hidden animate-pop ${expire ? 'grayscale opacity-70' : ''}`}>
          <div className="p-5 text-center" style={{ background: `${part?.couleur ?? '#155E8B'}14` }}>
            <div className="mx-auto w-fit">
              <LogoPartenaire partenaire={part} taille={56} />
            </div>
            <p className="mt-2 font-bold text-encre">{part?.nom}</p>
            <h1 className="mt-1 text-2xl font-semibold leading-tight">{r?.titre}</h1>
          </div>

          {/* découpe façon ticket */}
          <div className="relative h-6">
            <span className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-calcaire" />
            <span className="absolute -right-3 top-0 w-6 h-6 rounded-full bg-calcaire" />
            <span className="absolute left-5 right-5 top-3 border-t-2 border-dashed border-sable" />
          </div>

          <div className="px-5 pb-6 text-center">
            <div className="mx-auto w-fit rounded-2xl bg-white p-3 ring-2 ring-sable">
              <QRCodeSVG value={`${config.nom}:${coupon.code}:${coupon.recompenseId}`} size={196} fgColor="#0D2B3E" level="M" />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-encre">Code à présenter en caisse</p>
            <p className="mt-1 font-mono text-3xl font-bold tracking-[0.15em]">{coupon.code}</p>

            <div className={`mt-5 rounded-2xl px-4 py-3 ${expire ? 'bg-sable' : 'bg-accent/10'}`}>
              {expire ? (
                <p className="font-bold text-encre">Ce coupon a expiré.</p>
              ) : (
                <>
                  <p className="text-sm font-bold text-accent flex items-center justify-center gap-1.5">
                    <Timer size={16} /> Valable encore
                  </p>
                  <p className="font-titre text-3xl font-bold tabular-nums text-nuit">
                    {h > 0 && `${h} h `}
                    {pad(m)} min {pad(sec)} s
                  </p>
                </>
              )}
            </div>
            {r?.conditions && <p className="mt-4 text-sm text-encre">{r.conditions}</p>}
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-encre">Astuce : monte la luminosité de ton écran pour faciliter le scan.</p>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { CameraOff } from 'lucide-react'

export default function ScannerQR({ onLecture }: { onLecture: (texte: string) => void }) {
  const conteneur = useRef<HTMLDivElement>(null)
  const rappel = useRef(onLecture)
  rappel.current = onLecture
  const [erreur, setErreur] = useState<string | null>(null)
  const [pret, setPret] = useState(false)

  useEffect(() => {
    if (!conteneur.current) return
    // un élément neuf à chaque montage : évite les conflits entre deux instances
    const cible = document.createElement('div')
    cible.id = `lecteur-${Math.random().toString(36).slice(2)}`
    cible.style.width = '100%'
    conteneur.current.appendChild(cible)

    let annule = false
    let derniere = 0
    const qr = new Html5Qrcode(cible.id, { verbose: false, formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE] })
    const demarrage = qr
      .start(
        { facingMode: 'environment' },
        {
          fps: 12,
          aspectRatio: 1,
        },
        (texte) => {
          const t = Date.now()
          if (annule || t - derniere < 1500) return
          derniere = t
          rappel.current(texte)
        },
        () => {},
      )
      .then(() => {
        if (!annule) setPret(true)
      })
      .catch((e: unknown) => {
        if (annule) return
        const msg = String(e)
        if (/NotAllowed|Permission/i.test(msg)) setErreur('Accès à la caméra refusé. Tape plutôt le code inscrit sur la balise.')
        else if (/NotFound|no camera|Requested device/i.test(msg)) setErreur('Aucune caméra disponible. Tape plutôt le code inscrit sur la balise.')
        else if (!window.isSecureContext) setErreur('La caméra nécessite une connexion sécurisée (HTTPS). Tape plutôt le code de la balise.')
        else setErreur('Impossible de démarrer la caméra. Tape plutôt le code inscrit sur la balise.')
      })

    return () => {
      annule = true
      demarrage
        .then(() => (qr.isScanning ? qr.stop() : undefined))
        .catch(() => {})
        .finally(() => {
          try {
            qr.clear()
          } catch {
            /* déjà nettoyé */
          }
          cible.remove()
        })
    }
  }, [])

  return (
    <div className={`relative w-full overflow-hidden rounded-3xl bg-nuit ${erreur ? 'h-44' : 'aspect-square'}`}>
      <div ref={conteneur} className="absolute inset-0 [&_video]:!w-full [&_video]:!h-full [&_video]:object-cover" />
      {!pret && !erreur && (
        <div className="absolute inset-0 grid place-items-center text-white/70 text-sm font-semibold">Ouverture de la caméra…</div>
      )}
      {pret && (
        <div className="pointer-events-none absolute inset-[14%] rounded-3xl border-4 border-white/90 shadow-[0_0_0_999px_rgba(13,43,62,0.35)]" />
      )}
      {erreur && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
          <CameraOff size={36} className="text-ocre" />
          <p className="font-semibold">{erreur}</p>
        </div>
      )}
    </div>
  )
}

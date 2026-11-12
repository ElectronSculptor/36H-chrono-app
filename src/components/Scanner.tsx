import { lazy, Suspense } from 'react'
import { Camera } from 'lucide-react'

const ScannerQR = lazy(() => import('./ScannerQR'))

/** Scanner caméra chargé à la demande (bibliothèque html5-qrcode). */
export default function Scanner({ onLecture }: { onLecture: (texte: string) => void }) {
  return (
    <Suspense
      fallback={
        <div className="aspect-square w-full rounded-3xl bg-nuit grid place-items-center text-white/60">
          <Camera className="animate-pulse" size={36} />
        </div>
      }
    >
      <ScannerQR onLecture={onLecture} />
    </Suspense>
  )
}

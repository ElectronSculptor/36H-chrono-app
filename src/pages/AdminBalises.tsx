// Page d'impression des balises : /#/admin/balises
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { AlertTriangle, ArrowLeft, Printer } from 'lucide-react'
import { config } from '../config'
import { parcours as tousParcours } from '../lib/data'
import type { Etape, Parcours } from '../lib/types'
import { LogoMarque } from '../components/ui'

type Format = 1 | 2 | 4

function urlParDefaut() {
  if (config.urlSite) return config.urlSite
  return `${location.origin}${location.pathname}`
}

/** Construit l'URL de base propre (sans #, avec / final si besoin). */
function normaliserBase(u: string) {
  let b = u.trim().split('#')[0]
  if (!b) b = urlParDefaut().split('#')[0]
  const dernier = b.split('/').pop() ?? ''
  if (!b.endsWith('/') && !dernier.includes('.')) b += '/'
  return b
}

function urlBalise(base: string, id: string) {
  return `${normaliserBase(base)}#/b/${encodeURIComponent(id)}`
}

function Vignette({ p, e, i, format, base }: { p: Parcours; e: Etape; i: number; format: Format; base: string }) {
  const url = urlBalise(base, e.balise.id)
  const tailles = {
    1: { w: 190, h: 275, qr: 125, code: 26, titre: 9, texte: 4.6 },
    2: { w: 190, h: 135, qr: 92, code: 18, titre: 6.4, texte: 3.6 },
    4: { w: 93, h: 135, qr: 62, code: 12, titre: 4.6, texte: 2.9 },
  }[format]
  const horizontal = format === 2

  return (
    <div
      className="relative bg-white text-nuit border-2 border-dashed border-encre/30 rounded-[6mm] overflow-hidden flex"
      style={{ width: `${tailles.w}mm`, height: `${tailles.h}mm`, flexDirection: horizontal ? 'row' : 'column' }}
    >
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{ padding: '6mm', flex: horizontal ? '0 0 auto' : '1 1 auto', gap: '3mm' }}
      >
        {!horizontal && (
          <div className="flex items-center" style={{ gap: '2.5mm' }}>
            <LogoMarque taille={format === 4 ? 26 : 44} />
            <span className="font-titre font-semibold" style={{ fontSize: `${tailles.titre}mm` }}>
              {config.nom}
            </span>
          </div>
        )}
        <QRCodeSVG value={url} size={512} level="M" fgColor="#0D2B3E" style={{ width: `${tailles.qr}mm`, height: `${tailles.qr}mm` }} />
        {!horizontal && (
          <div>
            <p className="font-bold uppercase text-encre" style={{ fontSize: `${tailles.texte * 0.8}mm`, letterSpacing: '0.08em' }}>
              Code de secours
            </p>
            <p className="font-mono font-bold" style={{ fontSize: `${tailles.code}mm`, letterSpacing: '0.18em', lineHeight: 1.1 }}>
              {e.balise.code}
            </p>
          </div>
        )}
      </div>

      <div
        className={horizontal ? 'flex flex-col justify-center' : 'text-center'}
        style={{
          padding: horizontal ? '6mm 8mm 6mm 0' : '0 6mm 6mm',
          gap: '2.5mm',
          flex: horizontal ? '1 1 auto' : '0 0 auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {horizontal && (
          <div className="flex items-center" style={{ gap: '2.5mm' }}>
            <LogoMarque taille={36} />
            <span className="font-titre font-semibold" style={{ fontSize: `${tailles.titre}mm` }}>
              {config.nom}
            </span>
          </div>
        )}
        <div>
          <p className="font-bold text-terracotta" style={{ fontSize: `${tailles.texte}mm` }}>
            Étape {i + 1} / {p.etapes.length}
          </p>
          <p className="font-titre font-semibold leading-tight" style={{ fontSize: `${tailles.texte * 1.35}mm` }}>
            {p.titre}
          </p>
        </div>
        {horizontal && (
          <div>
            <p className="font-bold uppercase text-encre" style={{ fontSize: `${tailles.texte * 0.8}mm`, letterSpacing: '0.08em' }}>
              Code de secours
            </p>
            <p className="font-mono font-bold" style={{ fontSize: `${tailles.code}mm`, letterSpacing: '0.18em', lineHeight: 1.1 }}>
              {e.balise.code}
            </p>
          </div>
        )}
        <p className="text-encre" style={{ fontSize: `${tailles.texte * 0.85}mm`, lineHeight: 1.35 }}>
          Scanne-moi avec l’appareil photo de ton téléphone, ou tape le code dans l’app.
        </p>
      </div>
    </div>
  )
}

export default function AdminBalises() {
  const [base, setBase] = useState(urlParDefaut())
  const [filtre, setFiltre] = useState<string>('tous')
  const [format, setFormat] = useState<Format>(2)

  const items = useMemo(() => {
    const liste = tousParcours.filter((p) => filtre === 'tous' || p.id === filtre)
    return liste.flatMap((p) => p.etapes.map((e, i) => ({ p, e, i })))
  }, [filtre])

  const pages: (typeof items)[] = []
  for (let k = 0; k < items.length; k += format) pages.push(items.slice(k, k + format))

  const baseNette = normaliserBase(base)
  const local = /localhost|127\.0\.0\.1|192\.168\.|\/\/10\.|\.local\b/.test(baseNette)
  const http = baseNette.startsWith('http://')

  return (
    <div className="min-h-dvh bg-sable/60 print:bg-white">
      <div className="no-print sticky top-0 z-20 bg-calcaire border-b border-sable">
        <div className="max-w-5xl mx-auto px-4 py-4 grid gap-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="grid place-items-center w-10 h-10 rounded-full bg-white" aria-label="Retour">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-semibold flex-1">Impression des balises</h1>
            <button type="button" className="btn-accent" onClick={() => window.print()}>
              <Printer size={18} /> Imprimer
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <label className="grid gap-1 text-sm font-bold">
              Adresse du site (encodée dans les QR codes)
              <input
                value={base}
                onChange={(e) => setBase(e.target.value)}
                className="rounded-xl bg-white ring-2 ring-sable focus:ring-mer outline-none px-3 py-2 font-mono text-sm font-normal"
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Parcours
              <select value={filtre} onChange={(e) => setFiltre(e.target.value)} className="rounded-xl bg-white ring-2 ring-sable px-3 py-2 font-normal">
                <option value="tous">Tous les parcours</option>
                {tousParcours.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.titre}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Format
              <select
                value={format}
                onChange={(e) => setFormat(Number(e.target.value) as Format)}
                className="rounded-xl bg-white ring-2 ring-sable px-3 py-2 font-normal"
              >
                <option value={1}>1 grande balise par page</option>
                <option value={2}>2 balises par page</option>
                <option value={4}>4 balises par page</option>
              </select>
            </label>
          </div>
          <p className="text-sm text-encre">
            Exemple de lien : <span className="font-mono break-all">{items[0] ? urlBalise(base, items[0].e.balise.id) : ''}</span>
          </p>
          {(local || http) && (
            <p className="flex items-start gap-2 rounded-xl bg-ocre-clair px-3 py-2 text-sm font-semibold">
              <AlertTriangle size={18} className="shrink-0 text-terracotta" />
              {local
                ? 'Attention : cette adresse est locale. Avant d’imprimer, remplacez-la par l’adresse publique du site (https://…), sinon les QR codes ne marcheront pas ailleurs.'
                : 'Attention : utilisez une adresse en https:// pour que la caméra et la géolocalisation fonctionnent.'}
            </p>
          )}
        </div>
      </div>

      <div className="overflow-x-auto print:overflow-visible">
        <div className="mx-auto w-fit py-6 grid gap-6 print:p-0 print:gap-0">
          {pages.map((page, k) => (
            <div
              key={k}
              className="page-a4 bg-white shadow-lg print:shadow-none flex flex-wrap content-start"
              style={{ width: '190mm', minHeight: '275mm', gap: format === 4 ? '4mm' : '5mm', padding: 0 }}
            >
              {page.map(({ p, e, i }) => (
                <Vignette key={e.id} p={p} e={e} i={i} format={format} base={base} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

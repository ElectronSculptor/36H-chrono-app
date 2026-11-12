// Espace partenaire (/#/partenaire) : mini tableau de bord avec des DONNÉES FICTIVES,
// pour montrer au jury ce que voit un musée ou un commerçant.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Flag, Gift, Megaphone } from 'lucide-react'
import { config } from '../config'
import { partenaires, parcours } from '../lib/data'
import { LogoMarque, LogoPartenaire } from '../components/ui'

// ── Génération de données fictives, déterministes par partenaire ──

function graine(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}
function aleatoire(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Jour {
  date: Date
  visites: number
  coupons: number
}

const NIVEAU: Record<string, { base: number; taux: number }> = {
  'musee-navigateurs': { base: 46, taux: 0.17 },
  'glacier-lulu': { base: 34, taux: 0.24 },
  'librairie-boussole': { base: 18, taux: 0.13 },
  'office-tourisme': { base: 58, taux: 0.08 },
}

function genererSerie(id: string, nbJours: number): Jour[] {
  const r = aleatoire(graine(id))
  const { base, taux } = NIVEAU[id] ?? { base: 25, taux: 0.15 }
  const auj = new Date()
  auj.setHours(12, 0, 0, 0)
  const jours: Jour[] = []
  const total = 180 // on génère 180 jours pour avoir la période précédente
  for (let k = total - 1; k >= 0; k--) {
    const date = new Date(auj)
    date.setDate(auj.getDate() - k)
    const progression = 0.45 + 0.75 * ((total - 1 - k) / (total - 1)) // l'app grandit
    const we = date.getDay() === 0 || date.getDay() === 6 ? 1.65 : date.getDay() === 3 ? 1.2 : 1
    const visites = Math.max(2, Math.round(base * progression * we * (0.8 + 0.4 * r())))
    const coupons = Math.round(visites * taux * (0.5 + 0.7 * progression) * (0.8 + 0.4 * r()))
    jours.push({ date, visites, coupons })
  }
  return jours.slice(-nbJours * 2)
}

const fmt = (n: number) => n.toLocaleString('fr-FR')
const fmtPct = (n: number) => `${n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`
const fmtDate = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
const fmtDateLong = (d: Date) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

// ── Composants ─────────────────────────────────────────

function Tuile({ label, valeur, delta, aide }: { label: string; valeur: string; delta: number; aide: string }) {
  const hausse = delta >= 0
  return (
    <div className="carte p-4">
      <p className="text-sm font-semibold text-encre">{label}</p>
      <p className="mt-1 font-titre text-3xl font-semibold tabular-nums">{valeur}</p>
      <p className={`mt-1 text-sm font-bold flex items-center gap-1 ${hausse ? 'text-vert' : 'text-terracotta'}`}>
        {hausse ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        {hausse ? '+' : ''}
        {fmtPct(delta)} <span className="font-semibold text-encre">{aide}</span>
      </p>
    </div>
  )
}

function niceTicks(max: number, n = 4) {
  const brut = max / n
  const p = Math.pow(10, Math.floor(Math.log10(brut)))
  const m = brut / p
  const pas = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p
  const haut = Math.ceil(max / pas) * pas
  const ticks: number[] = []
  for (let v = 0; v <= haut + 1e-9; v += pas) ticks.push(v)
  return ticks
}

/** Courbe des visites par jour, avec réticule et infobulle au survol. */
function CourbeVisites({ jours }: { jours: Jour[] }) {
  const boite = useRef<HTMLDivElement>(null)
  const [largeur, setLargeur] = useState(640)
  const [survol, setSurvol] = useState<number | null>(null)
  useEffect(() => {
    if (!boite.current) return
    const ro = new ResizeObserver(([e]) => setLargeur(Math.max(280, e.contentRect.width)))
    ro.observe(boite.current)
    return () => ro.disconnect()
  }, [])

  const H = 240
  const m = { h: 16, d: 44, b: 28, g: 40 }
  const l = largeur - m.g - m.d
  const h = H - m.h - m.b
  const max = Math.max(...jours.map((j) => j.visites))
  const ticks = niceTicks(max)
  const yMax = ticks[ticks.length - 1]
  const x = (i: number) => m.g + (jours.length === 1 ? l / 2 : (i / (jours.length - 1)) * l)
  const y = (v: number) => m.h + h - (v / yMax) * h
  const ligne = jours.map((j, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(j.visites).toFixed(1)}`).join(' ')
  const aire = `${ligne} L${x(jours.length - 1)} ${m.h + h} L${x(0)} ${m.h + h} Z`
  const pasX = Math.max(1, Math.round(jours.length / Math.max(2, Math.floor(l / 90))))
  const dernier = jours.length - 1

  const versIndex = (clientX: number) => {
    const r = boite.current!.getBoundingClientRect()
    const px = clientX - r.left
    const i = Math.round(((px - m.g) / l) * (jours.length - 1))
    return Math.min(jours.length - 1, Math.max(0, i))
  }
  const j = survol !== null ? jours[survol] : null

  return (
    <div ref={boite} className="relative select-none" style={{ height: H }}>
      <svg
        width={largeur}
        height={H}
        className="block touch-pan-y"
        role="img"
        aria-label={`Visites générées par jour : ${fmt(jours[dernier].visites)} le dernier jour`}
        onPointerMove={(e) => setSurvol(versIndex(e.clientX))}
        onPointerDown={(e) => setSurvol(versIndex(e.clientX))}
        onPointerLeave={() => setSurvol(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={m.g} x2={m.g + l} y1={y(t)} y2={y(t)} stroke="#EAE1D1" strokeWidth={1} />
            <text x={m.g - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="#4B5F6B">
              {fmt(t)}
            </text>
          </g>
        ))}
        {jours.map((jj, i) =>
          i % pasX === 0 ? (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill="#4B5F6B">
              {fmtDate(jj.date)}
            </text>
          ) : null,
        )}
        <path d={aire} fill="var(--color-mer)" opacity={0.1} />
        <path d={ligne} fill="none" stroke="var(--color-mer)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {/* point et étiquette de fin */}
        <circle cx={x(dernier)} cy={y(jours[dernier].visites)} r={4.5} fill="var(--color-mer)" stroke="#fff" strokeWidth={2} />
        <text x={x(dernier) + 8} y={y(jours[dernier].visites)} dy="0.32em" fontSize={12} fontWeight={800} fill="#0D2B3E">
          {fmt(jours[dernier].visites)}
        </text>
        {j && survol !== null && (
          <g pointerEvents="none">
            <line x1={x(survol)} x2={x(survol)} y1={m.h} y2={m.h + h} stroke="#0D2B3E" strokeOpacity={0.35} strokeWidth={1} />
            <circle cx={x(survol)} cy={y(j.visites)} r={5} fill="var(--color-mer)" stroke="#fff" strokeWidth={2} />
          </g>
        )}
        <rect x={m.g} y={m.h} width={l} height={h} fill="transparent" />
      </svg>
      {j && survol !== null && (
        <div
          className="pointer-events-none absolute top-1 z-10 rounded-xl bg-white px-3 py-2 text-sm shadow-lg ring-1 ring-sable whitespace-nowrap"
          style={{
            left: Math.min(Math.max(x(survol) - 80, 0), largeur - 170),
          }}
        >
          <p className="text-xs font-semibold text-encre first-letter:uppercase">{fmtDateLong(j.date)}</p>
          <p className="mt-1 flex items-center gap-2">
            <span className="inline-block w-3 h-0.5 rounded bg-mer" />
            <b className="tabular-nums">{fmt(j.visites)}</b> <span className="text-encre">visites</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="inline-block w-3 h-0.5 rounded bg-encre/40" />
            <b className="tabular-nums">{fmt(j.coupons)}</b> <span className="text-encre">coupons utilisés</span>
          </p>
        </div>
      )}
    </div>
  )
}

function Barres({ lignes }: { lignes: { label: string; valeur: number; suffixe?: string }[] }) {
  const max = Math.max(...lignes.map((l) => l.valeur), 1)
  return (
    <ul className="grid gap-3">
      {lignes.map((li) => (
        <li key={li.label} className="group">
          <div className="flex justify-between text-sm">
            <span className="font-semibold">{li.label}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div
              className="h-3.5 rounded-r-[4px] bg-mer transition group-hover:brightness-110"
              style={{ width: `calc(${(li.valeur / max) * 100}% - 3.5rem)`, minWidth: 4 }}
              title={`${li.label} : ${fmt(li.valeur)}${li.suffixe ?? ''}`}
            />
            <span className="text-sm font-bold tabular-nums whitespace-nowrap">
              {fmt(li.valeur)}
              {li.suffixe}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}

// ── Page ───────────────────────────────────────────────

const PERIODES = [7, 30, 90] as const

export default function Partenaire() {
  const [pid, setPid] = useState(partenaires.find((p) => p.type === 'Musée')?.id ?? partenaires[0].id)
  const [periode, setPeriode] = useState<(typeof PERIODES)[number]>(30)
  const partenaire = partenaires.find((p) => p.id === pid)!

  const { actuels, kpi, parParcours, profil } = useMemo(() => {
    const serie = genererSerie(pid, periode)
    const prec = serie.slice(0, periode)
    const actuels = serie.slice(periode)
    const somme = (a: Jour[], k: 'visites' | 'coupons') => a.reduce((s, j) => s + j[k], 0)
    const v = somme(actuels, 'visites')
    const c = somme(actuels, 'coupons')
    const vp = somme(prec, 'visites')
    const cp = somme(prec, 'coupons')
    const taux = (c / v) * 100
    const tauxP = (cp / vp) * 100
    const r = aleatoire(graine(pid + periode))
    const nouveaux = 58 + Math.round(r() * 18)
    const kpi = {
      visites: { v, d: ((v - vp) / vp) * 100 },
      coupons: { v: c, d: ((c - cp) / cp) * 100 },
      taux: { v: taux, d: ((taux - tauxP) / tauxP) * 100 },
      nouveaux: { v: nouveaux, d: 4 + r() * 9 },
    }
    // répartition par parcours + parcours « à venir »
    const noms = [...parcours.map((p) => p.titre), 'Autres balades à proximité']
    const poids = noms.map(() => 0.4 + r())
    const tot = poids.reduce((a, b) => a + b, 0)
    const parParcours = noms
      .map((n, i) => ({ label: n, valeur: Math.round((v * poids[i]) / tot) }))
      .sort((a, b) => b.valeur - a.valeur)
    const fam = 54 + Math.round(r() * 14)
    const ado = Math.round((100 - fam) * (0.45 + r() * 0.15))
    const profil = [
      { label: 'Familles avec enfants', valeur: fam, suffixe: ' %' },
      { label: 'Adolescents', valeur: ado, suffixe: ' %' },
      { label: 'Adultes', valeur: 100 - fam - ado, suffixe: ' %' },
    ]
    return { actuels, kpi, parParcours, profil }
  }, [pid, periode])

  return (
    <div className="min-h-dvh fond-calcaire">
      <header className="bg-nuit text-white">
        <div className="max-w-5xl mx-auto px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-5">
          <div className="flex items-center gap-3">
            <Link to="/" className="grid place-items-center w-10 h-10 rounded-full bg-white/10" aria-label="Retour à l'app">
              <ArrowLeft size={20} />
            </Link>
            <LogoMarque taille={32} />
            <p className="font-titre text-lg font-semibold">
              {config.nom} <span className="text-white/60 font-normal">· Espace partenaire</span>
            </p>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <LogoPartenaire partenaire={partenaire} taille={52} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold leading-tight">{partenaire.nom}</h1>
              <p className="text-white/70">
                {partenaire.type} · {partenaire.adresse}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5">
        {/* Filtres : une seule ligne, au-dessus de tout */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={pid}
            onChange={(e) => setPid(e.target.value)}
            className="rounded-xl bg-white ring-2 ring-sable px-3 py-2 font-bold text-sm"
            aria-label="Partenaire"
          >
            {partenaires.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
          <div className="flex rounded-xl bg-white ring-2 ring-sable p-1" role="group" aria-label="Période">
            {PERIODES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriode(p)}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${periode === p ? 'bg-nuit text-white' : 'text-encre'}`}
              >
                {p} jours
              </button>
            ))}
          </div>
          <span className="puce bg-ocre-clair text-nuit ml-auto">Données fictives · démo</span>
        </div>

        <section className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Tuile label="Visites générées par l’app" valeur={fmt(kpi.visites.v)} delta={kpi.visites.d} aide="vs période préc." />
          <Tuile label="Coupons utilisés en caisse" valeur={fmt(kpi.coupons.v)} delta={kpi.coupons.d} aide="vs période préc." />
          <Tuile label="Taux de conversion" valeur={fmtPct(kpi.taux.v)} delta={kpi.taux.d} aide="visites → coupons" />
          <Tuile label="Nouveaux visiteurs" valeur={`${kpi.nouveaux.v} %`} delta={kpi.nouveaux.d} aide="jamais venus avant" />
        </section>

        <section className="mt-4 carte p-4 sm:p-5">
          <h2 className="text-lg font-semibold">Visites générées par l’app, par jour</h2>
          <p className="text-sm text-encre">
            {periode} derniers jours · survolez ou touchez la courbe pour le détail
          </p>
          <div className="mt-3">
            <CourbeVisites jours={actuels} />
          </div>
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer font-bold text-mer">Voir les données en tableau</summary>
            <div className="mt-2 max-h-56 overflow-auto rounded-xl ring-1 ring-sable">
              <table className="w-full text-left tabular-nums">
                <thead className="bg-sable/60 sticky top-0">
                  <tr>
                    <th className="px-3 py-1.5">Date</th>
                    <th className="px-3 py-1.5 text-right">Visites</th>
                    <th className="px-3 py-1.5 text-right">Coupons utilisés</th>
                  </tr>
                </thead>
                <tbody>
                  {actuels.map((j) => (
                    <tr key={j.date.toISOString()} className="border-t border-sable">
                      <td className="px-3 py-1">{fmtDate(j.date)}</td>
                      <td className="px-3 py-1 text-right">{fmt(j.visites)}</td>
                      <td className="px-3 py-1 text-right">{fmt(j.coupons)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <section className="carte p-4 sm:p-5">
            <h2 className="text-lg font-semibold">D’où viennent vos visiteurs</h2>
            <p className="text-sm text-encre mb-4">Visites par parcours, {periode} derniers jours</p>
            <Barres lignes={parParcours} />
          </section>
          <section className="carte p-4 sm:p-5">
            <h2 className="text-lg font-semibold">Qui sont-ils ?</h2>
            <p className="text-sm text-encre mb-4">Profil des joueurs venus chez vous</p>
            <Barres lignes={profil} />
          </section>
        </div>

        <section className="mt-4 carte p-4 sm:p-5">
          <h2 className="text-lg font-semibold">Vos leviers de visibilité</h2>
          <p className="text-sm text-encre">Pour le joueur, tout reste gratuit : c’est vous qui offrez l’expérience.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { I: Flag, t: 'Parcours offert par…', d: 'Votre nom sur un parcours complet, vu à chaque départ.' },
              { I: Megaphone, t: 'Étape sponsorisée', d: 'Une balise devant votre porte : le joueur vient jusqu’à vous.' },
              { I: Gift, t: 'Offre de récompense', d: 'Une réduction échangée contre des points, utilisée en caisse.' },
            ].map(({ I, t, d }) => (
              <div key={t} className="rounded-2xl bg-calcaire ring-1 ring-sable p-4">
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-mer text-white">
                  <I size={20} />
                </span>
                <p className="mt-3 font-bold">{t}</p>
                <p className="text-sm text-encre">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-6 mb-4 text-center text-xs text-encre">
          Prototype : partenaires et chiffres fictifs, générés pour la démonstration.
        </p>
      </main>
    </div>
  )
}

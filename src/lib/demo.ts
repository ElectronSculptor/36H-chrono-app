// Ouverture du panneau démo (5 tapotements sur le logo).
import { useSyncExternalStore } from 'react'

let ouvert = false
const abonnes = new Set<() => void>()
export function setDemoOuvert(v: boolean) {
  ouvert = v
  abonnes.forEach((a) => a())
}
export function useDemoOuvert() {
  return useSyncExternalStore(
    (cb) => {
      abonnes.add(cb)
      return () => abonnes.delete(cb)
    },
    () => ouvert,
  )
}

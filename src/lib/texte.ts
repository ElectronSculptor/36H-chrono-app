// Comparaison des réponses : insensible à la casse, aux accents,
// à la ponctuation et aux articles (« le gabian » = « Gabian »).

const ARTICLES = /^(le|la|les|l|un|une|des|du|de|d)\s+/

export function normaliserReponse(s: string): string {
  let t = s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'`´]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  // retire un article en tête, plusieurs fois si besoin (« l'agora »)
  let prev = ''
  while (prev !== t) {
    prev = t
    t = t.replace(ARTICLES, '')
  }
  return t
}

export function reponseCorrecte(saisie: string, acceptees: string[] = []): boolean {
  const s = normaliserReponse(saisie)
  if (!s) return false
  return acceptees.some((a) => {
    const n = normaliserReponse(a)
    return n === s || n.replace(/s$/, '') === s.replace(/s$/, '')
  })
}

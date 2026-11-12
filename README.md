# NOM_APP : balades-enquêtes (prototype 36h Chrono)

Application web mobile (PWA) de balades-enquêtes : on choisit un parcours, on trouve des **balises** (QR code + code de secours à 4 caractères), on résout une **énigme**, on découvre une **anecdote**, et on gagne des **points** échangeables contre des récompenses chez des partenaires. Tout est gratuit pour l'utilisateur.

Stack : Vite + React + TypeScript + Tailwind CSS. Pas de serveur : le contenu est dans des fichiers JSON et la progression dans le `localStorage` du téléphone.

---

## 1. Lancer en local et tester sur téléphone

Pré-requis : Node.js 20 ou plus.

```bash
npm install
npm run dev -- --host
```

Le terminal affiche deux adresses, par exemple :

```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.42:5173/
```

Sur un téléphone **connecté au même Wi-Fi**, ouvrez l'adresse `Network`.

> ⚠️ En local (http), le navigateur du téléphone **bloque la caméra et la géolocalisation** (elles exigent le HTTPS). Le jeu reste entièrement jouable avec la **saisie manuelle du code** et sans carte de position. Pour tester le scanner caméra, utilisez la version déployée en HTTPS.

Pour vérifier le build final en local :

```bash
npm run build
npm run preview -- --host
```

## 2. Mettre en ligne

### Option rapide : GitHub Pages (déjà configuré)

```bash
npm run deploy
```

Le site est construit puis publié sur la branche `gh-pages` du dépôt. Il est en ligne en HTTPS 1 à 2 minutes plus tard sur **https://electronsculptor.github.io/36H-chrono-app/** (la caméra et la géolocalisation y fonctionnent). Il faut être connecté à GitHub sur la machine (`gh auth login`) avec un compte qui a le droit d'écrire sur le dépôt.

### Déployer sur Hostinger

1. Construire le site :
   ```bash
   npm run build
   ```
   Cela crée le dossier `dist/`.
2. Dans hPanel → **Fichiers → Gestionnaire de fichiers**, ouvrez `public_html/` (videz-le s'il contient l'ancienne version ou la page par défaut de Hostinger).
3. Envoyez **le contenu** de `dist/` (pas le dossier lui-même) dans `public_html/` : `index.html`, `assets/`, `images/`, `personnages/`, `icons/`, `manifest.webmanifest` **et le fichier caché `.htaccess`**. (Astuce : zippez le contenu de `dist/`, envoyez le zip, puis « Extraire » dans `public_html/`. Sur Mac, `Cmd + Maj + .` affiche les fichiers cachés.)
4. Vérifiez le **HTTPS** : hPanel → **Sécurité → SSL**, le certificat doit être « Actif ». Ouvrez `https://votre-domaine.fr` : le cadenas doit apparaître. Le `.htaccess` fourni redirige automatiquement http → https.
5. Test rapide sur téléphone : ouvrez `https://votre-domaine.fr/#/b/hdr-hall` : le parcours de l'Hôtel de Région doit démarrer directement sur la première énigme.

Le site fonctionne aussi dans un sous-dossier (`public_html/app/`), car les chemins sont relatifs et l'app utilise le routage par `#` (HashRouter) : aucune configuration serveur n'est nécessaire.

**À chaque mise à jour**, refaites `npm run build` et remplacez les fichiers. Le `.htaccess` empêche la mise en cache de `index.html` : les téléphones voient la nouvelle version au rechargement.

## 3. Modifier les parcours, partenaires et récompenses

Tout le contenu est dans `src/data/`. Après une modification : `npm run build`, puis redéploiement. En local (`npm run dev`), la page se recharge toute seule.

> Les fichiers JSON n'acceptent pas les commentaires. Attention aux virgules et aux guillemets droits `"` autour des textes. En cas d'erreur, `npm run build` indique la ligne fautive.

### `src/data/parcours.json`

```jsonc
{
  "personnages": [
    {
      "id": "gaby",                        // identifiant unique, sans espace
      "nom": "Gaby",
      "titre": "le gabian curieux",
      "description": "…",
      "image": "personnages/gaby.svg",     // fichier dans public/personnages/
      "couleur": "#155E8B",                // couleur de l'anneau autour de l'avatar
      "bientot": true                      // (optionnel) personnage à venir, affiché en silhouette
    }
  ],
  "parcours": [
    {
      "id": "hotel-de-region",             // apparaît dans l'URL : /#/parcours/hotel-de-region
      "titre": "Les secrets de l'Hôtel de Région",
      "quartier": "Hôtel de Région", "ville": "Marseille",
      "duree_min": 25, "distance_km": 0.3,
      "difficulte": 1,                     // 1 facile, 2 moyen, 3 difficile
      "interieur": true,                   // (optionnel) parcours en intérieur
      "personnage": "gaby",                // id d'un personnage ci-dessus
      "offert_par": "office-tourisme",     // (optionnel) id partenaire → badge « Offert par… »
      "sponsor_fin": "musee-navigateurs",  // (optionnel) id partenaire → carte « Partenaire » sur l'écran de fin
      "points_par_etape": 25,              // (optionnel) sinon la valeur de config.ts
      "bonus_fin": 30,                     // points en plus à la fin du parcours
      "accroche": "…",
      "intro": "…",                        // présentation par le personnage, à la 1re personne
      "conclusion": "…",                   // mot de fin du personnage
      "depart": { "nom": "…", "indication": "…", "lat": 43.30, "lng": 5.37 },
      "etapes": [
        {
          "id": "hdr-hall",
          "titre": "Le hall d'entrée",
          "indice_lieu": "…",              // indice pour trouver le lieu
          "lat": 43.29, "lng": 5.36,       // (optionnel) affiche une carte + la distance
          "sponsor": "glacier-lulu",       // (optionnel) « Étape proposée par… »
          "balise": {
            "id": "hdr-hall",              // encodé dans le QR : https://domaine/#/b/hdr-hall
            "code": "SUD6"                 // code de secours à 4 caractères (unique !)
          },
          "enigme": {
            "type": "qcm",                 // "qcm" ou "texte"
            "question": "…",
            "choix": ["4", "6", "8", "13"],// QCM : réponses proposées
            "bonne_reponse": 1,            // QCM : position de la bonne réponse (0 = la première)
            "reponses_acceptees": ["…"],   // TEXTE : réponses acceptées (majuscules, accents et articles ignorés)
            "indice": "…",
            "a_verifier": true             // fait à vérifier par l'équipe
          },
          "anecdote": { "titre": "…", "texte": "…", "image": "images/hdr-hall.svg", "a_verifier": true }
        }
      ]
    }
  ]
}
```

- **`"a_verifier": true`** marque les faits historiques à vérifier avant diffusion (tous ceux du Panier, et certains de l'Hôtel de Région). Les coordonnées GPS de départ portent aussi ce champ.
- Pour la saisie du code, les **codes de balise doivent être uniques** dans toute l'app. Évitez les caractères ambigus (`O`/`0`, `I`/`1`).
- Les **images** d'anecdotes vont dans `public/images/`, celles des personnages dans `public/personnages/`. Pour remplacer un visuel provisoire, gardez le même nom de fichier ou changez le chemin dans le JSON (formats `.png`, `.jpg`, `.webp`, `.svg`). Conseil : images carrées pour les personnages (512 × 512), 16:10 pour les anecdotes, moins de 200 Ko chacune.

### `src/data/partenaires.json`

```jsonc
{
  "partenaires": [
    {
      "id": "glacier-lulu",
      "nom": "Glacier Chez Lulu",
      "type": "Glacier",
      "description": "…",
      "adresse": "Le Panier, Marseille 2e",
      "couleur": "#E3A63B",      // couleur de la pastille logo
      "initiales": "CL",         // affichées si pas de logo
      "logo": "partenaires/lulu.png",  // (optionnel) fichier dans public/
      "offre_native": {          // (optionnel) carte « Partenaire » de fin de parcours
        "titre": "…", "texte": "…", "bouton": "Voir l'offre"
      }
    }
  ]
}
```

Les quatre partenaires de la démo sont **fictifs**.

### `src/data/recompenses.json`

```jsonc
{
  "recompenses": [
    {
      "id": "glace-offerte",
      "titre": "Une boule de glace offerte",
      "description": "…",
      "partenaire": "glacier-lulu",          // id partenaire
      "cout_points": 80,
      "validite_heures": 48,                  // durée du compte à rebours du coupon
      "debloquee_par": "hotel-de-region",     // (optionnel) parcours à terminer pour la débloquer
      "conditions": "…"
    }
  ]
}
```

## 4. Changer le nom de l'app

Ouvrez `src/config.ts` et modifiez :

```ts
nom: 'NOM_APP',
```

Ce nom est utilisé partout : en-tête, onglet du navigateur, icône installée (manifest PWA), balises imprimées, message de partage. Le même fichier contient le slogan, le message clé, les **couleurs** (appliquées automatiquement à tout le thème), les textes de l'onboarding et de l'écran « pause », les options « Plus », et le barème des points.

`urlSite` : laissez vide pour que les QR codes utilisent l'adresse du site sur lequel on imprime, ou indiquez l'adresse publique (`'https://votre-domaine.fr/'`).

L'icône de l'app est dans `public/icons/` (`icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`).

## 5. Imprimer les balises

1. Ouvrez **`https://votre-domaine.fr/#/admin/balises`** depuis un ordinateur (accessible aussi via le mode démo).
2. Vérifiez le champ **« Adresse du site »** : c'est l'URL encodée dans les QR codes. Elle doit être l'adresse publique en `https://` (un avertissement s'affiche si c'est `localhost` ou une adresse locale).
3. Choisissez le parcours et le format : 1 grande balise, 2 ou 4 par page A4.
4. Cliquez sur **Imprimer** (dans la fenêtre d'impression : format A4, marges « par défaut », échelle 100 %, cochez « Graphiques d'arrière-plan »).
5. Testez un QR imprimé avec l'appareil photo d'un téléphone avant de les placer.

Chaque balise porte le QR code (lien direct qui valide l'étape), le **code de secours** à taper à la main, le nom du parcours et le numéro d'étape.

---

## Mode démo (pour le pitch)

**Tapez 5 fois rapidement sur le logo** (en haut de n'importe quel écran) pour ouvrir le panneau caché :

- valider l'étape en cours sans scanner ;
- aller directement à l'écran de fin ;
- ajouter 100 points ;
- réinitialiser la progression ;
- liens vers l'espace partenaire et l'impression des balises ;
- antisèche des codes de toutes les balises.

## Pages utiles

| Page | Adresse |
|---|---|
| Accueil / parcours | `/#/` |
| Lien d'une balise (QR) | `/#/b/ID_BALISE` (ex. `/#/b/hdr-hall`) |
| Espace partenaire (données fictives) | `/#/partenaire` |
| Impression des balises | `/#/admin/balises` |

## Codes des balises de la démo

| Parcours | Étape | ID (QR) | Code |
|---|---|---|---|
| Hôtel de Région | 1. Hall d'entrée | `hdr-hall` | `SUD6` |
| | 2. Grand couloir | `hdr-couloir` | `MAS2` |
| | 3. Espace de travail | `hdr-travail` | `SAV7` |
| | 4. Salle du pitch | `hdr-pitch` | `GAB9` |
| Le Panier | 1. Clocher des Accoules | `panier-accoules` | `ACC3` |
| | 2. Montée des Accoules | `panier-montee` | `PAN4` |
| | 3. Place des Moulins | `panier-moulins` | `MLN5` |
| | 4. Vieille Charité | `panier-charite` | `PUG7` |
| | 5. Place de Lenche | `panier-lenche` | `LEN8` |

## Comportements à connaître

- Scanner la **première balise** d'un parcours avec l'appareil photo démarre directement ce parcours.
- Les étapes se valident **dans l'ordre** ; une balise scannée trop tôt affiche un message clair.
- Erreur à une énigme : −5 points sur l'étape ; indice : −5 points ; minimum 5 points par étape. Après 3 erreurs, on peut afficher la réponse pour ne jamais rester bloqué.
- Les points d'un parcours ne se gagnent qu'**une fois** (on peut le rejouer pour le plaisir).
- Le « temps passé dehors » est mesuré du début à la fin de chaque parcours (plafonné à 4 h).
- La progression est stockée sur le téléphone : vider les données du navigateur ou passer en navigation privée remet à zéro.

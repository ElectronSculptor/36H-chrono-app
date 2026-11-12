// ─────────────────────────────────────────────────────────────
//  CONFIGURATION CENTRALE
//  Changez ici le nom de l'app, le slogan, les couleurs et les
//  principaux textes. Tout le reste de l'app lit ce fichier.
// ─────────────────────────────────────────────────────────────

export const config = {
  /** Nom de l'application (affiché partout, y compris sur les balises imprimées). */
  nom: 'NOM_APP',

  /** Slogan court, affiché sous le nom. */
  slogan: 'Explore ta ville, gagne ton accès à la culture.',

  /** Message clé du projet (onboarding, partage). */
  messageCle: 'Explorer ta ville te fait gagner ton accès à la culture.',

  /**
   * URL publique du site, utilisée dans les QR codes des balises.
   * Laissez vide pour utiliser automatiquement l'adresse courante du site.
   * Exemple : 'https://www.mon-domaine.fr/'
   */
  urlSite: '',

  /**
   * Couleurs de l'app. Elles sont appliquées automatiquement au démarrage
   * (src/main.tsx) : changez une valeur ici, tout le thème suit.
   */
  couleurs: {
    mer: '#155E8B', // bleu de la mer (couleur principale)
    merClair: '#D7E9F3',
    nuit: '#0D2B3E', // texte principal
    encre: '#4B5F6B', // texte secondaire
    ocre: '#E3A63B',
    ocreClair: '#F8E7C4',
    terracotta: '#B9573A',
    terracottaClair: '#F3D9CF',
    calcaire: '#FBF7EF', // fond « blanc calcaire »
    sable: '#F2E8D7',
    accent: '#F2552C', // accent vif des boutons d'action
    accentFonce: '#D4431D', // ombre des boutons d'action
    vert: '#2F8A5B', // validation
  },

  /** Barème des points. */
  points: {
    parEtape: 25, // points gagnés par énigme résolue (modifiable par parcours)
    penaliteErreur: 5, // retirés à chaque mauvaise réponse
    penaliteIndice: 5, // retirés si l'indice de l'énigme est utilisé
    minimumParEtape: 5, // une étape rapporte toujours au moins ça
  },

  /** Textes de l'onboarding (3 écrans maximum). */
  onboarding: [
    {
      titre: 'Ta ville est un terrain de jeu',
      texte:
        'Des balades-enquêtes gratuites, guidées par des personnages hauts en couleur. Le téléphone te guide, mais le jeu se passe dehors.',
    },
    {
      titre: 'Comment jouer ?',
      texte: '',
      etapes: [
        'Va au point de départ du parcours',
        'Trouve la balise cachée à chaque étape',
        'Scanne-la ou tape son code à 4 caractères',
        'Résous l’énigme et découvre le secret du lieu',
      ],
    },
    {
      titre: 'Gagne de vraies récompenses',
      texte:
        'Chaque parcours terminé rapporte des points, échangeables chez nos partenaires : musées, glaciers, librairies… 100 % gratuit, pour toujours.',
    },
  ],

  /** Texte de l'écran « pause » entre deux étapes. */
  pause: {
    titre: 'Range ton téléphone et cherche…',
    sousTitre: 'Lève les yeux. La prochaine balise t’attend quelque part par là.',
  },

  /** Options payantes facultatives (affichées « bientôt »). */
  optionsPlus: [
    { titre: 'Parcours hors-série', texte: 'Des enquêtes spéciales pour les vacances et les grands événements.' },
    { titre: 'Mode défi entre familles', texte: 'Affrontez une autre famille sur le même parcours, chrono en main.' },
    { titre: 'Narration audio', texte: 'Les personnages te racontent l’histoire à l’oreille.' },
  ],

  /** Clé de stockage local (changez-la pour repartir de zéro chez tout le monde). */
  cleStockage: 'balades-progression-v1',

  /** Plafond du « temps passé dehors » compté pour un seul parcours (en minutes). */
  plafondTempsParcoursMin: 240,
}

export type Config = typeof config

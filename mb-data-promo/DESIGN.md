# Quantara — film promo : spec de design et storyboard

Produit avec le skill **video-shotcraft** (github.com/Vincentwei1021/video-shotcraft,
~10 k★, mode « création libre autonome »), les règles **remotion-dev/skills** (4,8 k★)
et les principes **LottieFiles/motion-design-skill** (1,8 k★).

## Produit (étape 0)

| | |
|---|---|
| Produit | Quantara — dashboard et journal de trading pour les traders PropFirm (futures + CFD) |
| Public | traders qui tiennent plusieurs comptes chez plusieurs PropFirms |
| Promesse | « Tous tes comptes PropFirm. Un seul dashboard. Et la règle exacte de chaque firme. » |
| Fonctions montrées | Dashboard (4 vues), Health Center, Analytics, Heatmaps, recherche ⌘K, Journal + Trade Log (réplication multi-comptes), comparateur de règles, fiches firmes, simulateur de drawdown, tarifs, calendrier éco, alertes, Import Lab, plan de trading, réglages, landing |
| Format | 1920×1080, 30 i/s, ~57 s, FR, deux versions : avec BGM / sans BGM (SFX conservés) |
| Données | **100 % fictives** : un trader inventé (« Alex Demo »), 5 firmes, 8 comptes, ~150 trades générés par graine fixe. Aucune donnée réelle, aucun appel à Supabase — la base est simulée au niveau réseau pendant la capture (`capture/`) |
| Chiffres affichés | calculés par `mb-data-web/landing-3d/facts.mjs` : 12 firmes futures · 52 tailles · 36 programmes · 550 lignes de règles · 9 firmes CFD |

## Direction visuelle (étape 1)

La vidéo **pousse depuis le produit** (règle 2 du skill) : tokens Abyss de
`mb-data-web/app/globals.css`, polices de l'app, et le bronze de la landing 3D
comme unique accent « promo » (faisceaux, filets, glints).

| Rôle | Valeur |
|---|---|
| Fond | `#0a1420` + halo Abyss (bleu haut-droite, teal haut-gauche, violet bas) |
| Surface | `rgba(24,37,53,.78)` |
| Texte | `#f0f5fa` / `#9fb3c8` |
| Sémantique | bleu `#5ab0ff` · vert `#3ddba8` · rouge `#ff7a86` · ambre `#ffc25c` |
| Accent promo | bronze `#d8b46a` / `#f1d99a` (mains de la landing 3D) |
| Interface | **Outfit** 500–700 |
| Chiffres, bandeaux | **Roboto Mono** |
| Titres, annotations 3D | **Fraunces** (italique pour l'emphase) |

**Personnalité de mouvement** : préréglage « confiance professionnelle (fintech) »
du skill — mouvement principal ~21 f, entrée `bezier(0,0,0.2,1)`, aucun
rebond sauf quand un objet *atterrit* (y1 > 1 alors, règle du skill). Un
seul mouvement-héros par plan ; chaque procédé n'est héros qu'une fois.

**Lisibilité (Q11)** : sous-titres narratifs ≥ 56 px, textes secondaires ≥ 32 px,
mesurés sur l'image rendue.

## Fonctions → plans (étape 2)

| Fonction | Carte du skill | Pourquoi |
|---|---|---|
| Marque + mains de bronze | `letterspace-materialize` | ouverture : un seul sujet, arc complet ≥ 3 s (Q5, R3) |
| Dashboard : « à faire maintenant » | `spotlight-hero-card` | la carte-insight est l'atome du produit |
| 4 vues du dashboard | `beat-cut-moves` A (accelerando) | quatre vues du *même* produit → coupes sèches accélérées |
| Health / Analytics / Heatmaps | `steep-tilt-glide` | trois pages d'analyse = un mur qui défile |
| Recherche ⌘K | `crash-zoom-punch` (rebond) | « regarde ça ! » en une image |
| Réplication multi-comptes | `row-embed` | le modal réel, puis les 3 lignes créées qui s'emboîtent dans le journal |
| Règles des firmes | `scroll-brake-moves` A | longue fiche Apex qui défile puis freine |
| 550 lignes de règles | `odometer-digit-roll` | le chiffre roi, une seule fois plein écran |
| Toutes les autres pages | `page-waterfall-wall` | « il y en a encore » : volume, pas détail |
| Pages publiques | `card-flock-tumble` | pic d'énergie avant la conclusion |
| Clôture | `outro-group-photo-launch` | la « photo de groupe » des éléments vus |
| Coutures | `shot-transitions` B (tunnel sombre) | aucune coupe nue hors du plan accelerando |

## Storyboard (étape 3)

| # | De | Durée | Plan | Mouvement clé | Texte à l'écran | SFX |
|---|---|---|---|---|---|---|
| 1 | 0 | 165 | Ouverture | mains de bronze (boucle 3D existante) sous le halo ; « QUANTARA » tracé en parallèle, trait unique | « Le dashboard des traders PropFirm » | shimmer au tracé, impact grave à la fin |
| 2 | 165 | 190 | Dashboard | entrée tunnel sombre → projecteur qui erre, verrouille la carte-insight, travelling latéral 34°, la carte s'élève, deux tours de faisceau bronze, se repose | annotation 3D « Le compte à risque, *repéré avant le breach.* » | whoosh, sparkle, snap |
| 3 | 355 | 135 | 4 vues | coupes sèches 49/65/77/85/91/95, puis tenue | « Quatre vues. Un seul dashboard. » | tick par coupe |
| 4 | 490 | 165 | Analyse | mur incliné 60°, la page glisse seule (caméra fixe), ghosting ∝ vitesse | « Drawdown, consistance, heatmaps — en temps réel. » | warp-slide |
| 5 | 655 | 115 | ⌘K | tenue 35 f → crash-zoom 6 f sur la palette → rebond 5 f → tenue | « ⌘K — n'importe quel compte, en une touche. » | zoom, impact court |
| 6 | 770 | 180 | Réplication | modal réel « Ajouter sur 3 comptes » ; trois lignes de trade descendent et s'emboîtent | « Coche tes comptes. Un seul clic. » puis « Un trade saisi une fois. Copié sur tous tes comptes. » | switch-tap au clic, typewriter ×3 décroissant |
| 7 | 950 | 150 | Règles | fiche Apex complète qui défile vite (flou ∝ vitesse) et freine | « La règle exacte, jusqu'au dernier détail. » | whoosh, impact |
| 8 | 1100 | 135 | Chiffre | 5-5-0 roulent et se verrouillent de gauche à droite | « lignes de règles · 12 firmes · 36 programmes » | tick ×3, basse |
| 9 | 1235 | 150 | Tout le reste | mur de pages en 3 colonnes à vitesses/sens différents, léger push | « Calendrier éco, alertes, import CSV, plan de trading, réglages… » | swirl |
| 10 | 1385 | 150 | Public | comparateur, simulateur, tarifs tournoient en escalier → aspirés → anneau → « GRATUIT POUR COMMENCER » | (le mot géant) | whoosh puissant, impact |
| 11 | 1535 | 165 | Clôture | éléments de chaque plan volent autour du logo ; crane 4° ; lumière de scène ; poussière bronze ; tenue ≥ 30 f | « quantara.tech · crée ton compte » + puce « 550 lignes de règles » | riser → impact (pic) → sparkle |

Total : **1700 f ≈ 56,7 s**. La table vit dans `src/timeline.ts` (source unique) ;
SFX, sous-titres et transitions en dérivent par des frames *relatives*.

## Écarts assumés aux règles du skill

- **Pas de tempo verrouillé** : l'utilisateur n'a pas imposé de musique ; la BGM
  (« House Vibez », Mixkit, licence libre) est posée sans calage au temps près.
- **Calendrier éco** : sans réseau, la page affiche « Aucun événement ». Elle
  n'apparaît donc que dans le mur du plan 9, jamais en gros plan.
- **Coutures non tunnel, choisies** : coupe-flash au début du plan 6 (rupture
  voulue avant la démonstration), fondu au noir règles → chiffre, bascule de
  point chiffre → mur de pages. Le reste passe par le tunnel sombre.
- **Boucle des mains ré-échantillonnée** : la boucle 3D de la landing était en
  24 i/s ; elle est interpolée à 30 i/s (minterpolate, alpha VP9 conservé) pour
  supprimer le saccadé relevé à la revue.
- **Sons calés sur le pic, pas sur le début** : `src/sfx-meta.json` mesure le
  retard du pic de chaque SFX ; `Sound.tsx` avance chaque son de ce retard plus
  ~1,25 image de décalage AAC. Les ticks d'horloge (−14 dBFS à la source) sont
  poussés à ×2.

## Revue indépendante (étape 7) et reste à faire

Première revue : **FAIL** (flou de mouvement postérisé, pièce coupée, plan
Spotlight décalé, textes trop courts, SFX en retard…). Tout a été corrigé, sauf
ces points mineurs, laissés tels quels :

- couture visible vers y≈890 dans la pleine page du dashboard (défilement) ;
- la page Réglages affiche « Plan actuel Free » (la page lit le plan ailleurs
  que dans `profiles`) ;
- le code promo public SAVENOW est lisible sur la page Tarifs ;
- la palette ⌘K apparaît avec sa requête déjà tapée ;
- l'anneau de fumée passe devant les lettres de « GRATUIT » pendant 4 images.

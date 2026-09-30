# Capture des pages — trader fictif, Supabase simulé

Les textures du film (`public/textures/`, ~30 Mo, non versionnées) sont de
**vraies captures de l'application** (`mb-data-web`), avec des données
**entièrement inventées**.

## Comment ça marche

1. `next dev` tourne avec une URL Supabase factice :
   ```bash
   cd mb-data-web
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=demo-anon-key npx next dev -p 3000
   ```
2. `capture.mjs` ouvre chaque page dans Chromium (Playwright) et intercepte
   tout le réseau vers `127.0.0.1:54321` : un mini-PostgREST en mémoire
   (`select`, filtres `eq/in/is/…`, `order`, `limit`, embarqués
   `firms → accounts → payouts`, `.single()` / `maybeSingle()`, `count=exact`)
   répond avec `fixtures.mjs`. La session est une fausse session posée dans
   `localStorage` (`sb-127-auth-token`) avant le chargement.
3. Sorties : pages en 1920×1080 @2x, quatre pleines pages (défilement), des
   découpes ×3 des éléments filmés en gros plan, et `layout.json` (hauteurs de
   page, boîtes des éléments en px CSS).

```bash
cd mb-data-promo/capture
node capture.mjs            # tout
node capture.mjs palette    # une seule entrée
cp textures/* ../public/textures/   # (le script écrit dans ./textures/)
```

Le script importe `playwright-core` par un chemin absolu de bac à sable :
remplace-le par `import { chromium } from 'playwright-core'` après un
`npm i -D playwright-core` si tu le relances ailleurs.

## Trois pièges déjà rencontrés

- **La CSP de l'app bloque `127.0.0.1`** (`connect-src` n'autorise que
  `*.supabase.co`) : sans `bypassCSP: true` dans le contexte Playwright, toutes
  les requêtes échouent en silence et le dashboard s'affiche **vide**.
- **Playwright exécute la route enregistrée EN DERNIER en premier** : le
  blocage général du réseau externe doit être déclaré avant les routes précises,
  sinon il les avale.
- **`side` vaut `'Long'`/`'Short'` avec majuscule** pour la carte de trade
  (`TradeCard`), alors que le badge du Trade Log compare en minuscules. Avec
  `'long'`, les cartes affichaient « SHORT ». (Incohérence de l'app, notée,
  non corrigée ici.)

## Données

`fixtures.mjs` : « Alex Demo », 5 firmes, 8 comptes (financés, challenges, un
échec), 7 payouts, ~100 trades sur 3 mois générés par graine fixe (mulberry32),
plus le trade répliqué du plan 6 (+420 $ sur 3 comptes). Rien ne vient d'une
base réelle.

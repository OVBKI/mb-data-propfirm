# Quantara Sync — Browser Extension

Sync auto de tes trades depuis n'importe quel dashboard PropFirm vers Quantara, sans clé API et sans donner tes credentials.

## Statut

**Alpha v0.1.0** — scaffold complet. L'adapter Lucid Trading est en heuristique : il détecte les API calls qui ressemblent à des trades et fait un best-effort field mapping. Pour le verrouiller sur le vrai schéma Lucid, on a besoin d'une capture des réponses API réelles (voir [Calibration adapter](#calibration-adapter-lucid) plus bas).

## Architecture

```
PropFirm dashboard (dash.lucidtrading.com, topstepx.com, ...)
        │
        │ ① content/loader.js injecte content/inject.js dans la page
        │
content/inject.js  ──┐
  ↳ patche window.fetch et XMLHttpRequest
  ↳ capture toute requête same-origin (status, URL, body)
        │
        │ ② postMessage vers content script
        │
content/loader.js
        │
        │ ③ chrome.runtime.sendMessage
        │
background/service-worker.js
  ↳ route par firm (URL host → slug)
  ↳ passe au bon adapter (content/adapters/<firm>-adapter.js)
  ↳ adapter renvoie un array de trades normalisés
        │
        │ ④ POST /api/sync/extension
        │     Authorization: Bearer <supabase token>
        │
Quantara backend (mb-data-web/app/api/sync/extension/route.js)
  ↳ vérifie auth, rate-limit (60 req/min/user)
  ↳ matche firms.name fuzzy contre canonical PropFirm name
  ↳ upsert dans journal_entries avec tag [ext:<firm>:<external_id>] pour dedup
```

Le token Supabase est récupéré automatiquement par `content/quantara-bridge.js` qui tourne sur `quantara.tech` et lit `localStorage` pour trouver la session active.

## Installation (dev)

1. `git clone` ce repo
2. Chrome / Edge → `chrome://extensions`
3. Active **Mode développeur** (toggle en haut à droite)
4. **Charger l'extension non empaquetée** → sélectionne le dossier `quantara-extension/`
5. Épingle l'icône Quantara
6. Ouvre `https://quantara.tech` et connecte-toi → l'extension récupère ton token automatiquement
7. Ouvre `https://dash.lucidtrading.com` → tes trades commencent à se sync

Pour bosser en local contre `http://localhost:3000`, change `QUANTARA_API_BASE` dans `lib/config.js` puis reload l'extension depuis `chrome://extensions`.

## Calibration adapter (Lucid)

L'adapter Lucid est en mode heuristique tant que je n'ai pas un échantillon réel de la réponse API. Procédure :

1. Installe l'extension comme ci-dessus
2. Active le **mode debug** dans le popup (déjà actif par défaut)
3. Ouvre `https://dash.lucidtrading.com` et navigue dans ton historique de trades
4. Clic sur l'icône Quantara → onglet **Debug** → tu vois toutes les requêtes capturées
5. Copie-colle 1-2 réponses qui contiennent des trades (URL + extrait JSON) et envoie à l'équipe dev
6. On verrouille `content/adapters/lucid-adapter.js` sur le schéma réel

## Ajouter une nouvelle PropFirm

Une nouvelle firm = 1-2 jours de dev. Étapes :

1. Ajoute le host dans `lib/config.js → FIRM_HOSTS`
2. Ajoute la permission dans `manifest.json → host_permissions`
3. Ajoute le content_script match pattern dans `manifest.json → content_scripts`
4. Crée `content/adapters/<firm>-adapter.js` qui exporte `adapt<Firm>(payload)`
5. Référence l'adapter dans `background/service-worker.js → ADAPTERS`
6. Ajoute la canonical name dans `mb-data-web/app/api/sync/extension/route.js → FIRM_SLUG_TO_CANONICAL`

## Sécurité

- Aucun credential PropFirm n'est jamais lu ni transmis.
- Seules les requêtes same-origin du dashboard PropFirm en cours sont capturées (pas d'autres sites).
- Les bodies capturés sont envoyés au service worker en local — uniquement les trades normalisés (pas les bodies bruts) sont envoyés à Quantara.
- Le token Supabase est lu côté `quantara.tech` uniquement et stocké dans `chrome.storage.local`.
- Mode debug optionnel : peut être désactivé depuis le popup pour ne pas stocker les bodies bruts en local.

## Limites connues (Alpha)

- Pas de sync background passif : il faut que l'user visite le dashboard PropFirm pour déclencher la sync. Ajout futur : `alarms` API + open tab discret.
- Pas encore d'icône de status dans la barre (badge sur le toolbar icon avec count de trades synced).
- Pas de page d'options dédiée (config se fait via le popup).
- Pas de support Firefox (à porter via WebExtensions API, principalement le `host_permissions` et le `web_accessible_resources` qui diffèrent).

## Roadmap

- [ ] Calibrer adapter Lucid sur schéma réel
- [ ] Adapter TopstepX
- [ ] Badge count sur le toolbar icon
- [ ] Adapter Apex, MFFU, Tradeify
- [ ] Page d'options (config API base URL, choix firms actives, export logs)
- [ ] Publication Chrome Web Store
- [ ] Port Firefox

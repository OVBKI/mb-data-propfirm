# MB Fleet — Gestion de flotte de transport 🚚

Application web pour gérer une société de transport : **camions, traceurs GPS, chauffeurs, entretien, documents et dépenses**.

Construite avec **Next.js 14**, **Tailwind CSS**, **Supabase** (base de données) et **Leaflet** (carte GPS).

## Fonctionnalités (v1)

- **Tableau de bord** — vue d'ensemble : flotte, camions en route, alertes documents/entretien, dépenses du mois.
- **Carte en direct** — position des camions sur une carte, suivi temps réel (simulé en mode démo).
- **Camions & traceurs GPS** — fiche complète de chaque véhicule + traceur associé.
- **Chauffeurs** — gestion des chauffeurs, permis et échéances, affectation aux camions.
- **Entretien & révisions** — historique des interventions, alertes d'échéance (vidange, CT, pneus…).
- **Documents & dépenses** — assurances, cartes grises, carburant, péages, suivi des coûts.

## Démarrage rapide

```bash
cd mb-fleet
npm install
npm run dev
```

Ouvrez http://localhost:3000

> L'application démarre en **mode démo** avec des données d'exemple — aucune configuration requise.

## Passer en production (données réelles)

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, exécutez le contenu de [`supabase-schema.sql`](./supabase-schema.sql).
3. Copiez `.env.example` vers `.env.local` et renseignez :
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
4. Relancez `npm run dev`. L'app lit désormais vos vraies données.

## Brancher de vrais traceurs GPS

Le mode démo simule les positions. Pour le temps réel, plusieurs options :
- **Traccar** (open-source) — serveur GPS qui reçoit les trames des boîtiers Teltonika/Concox et expose une API.
- **API constructeur** (Wialon, etc.).

L'idée : un service met à jour les colonnes `last_lat / last_lng / last_speed / last_seen` de la table `trackers`, et la carte affiche automatiquement les positions.

## Prochaines étapes possibles

- Formulaires de création/édition (ajouter un camion, un chauffeur, une dépense…).
- Authentification + multi-utilisateurs (Supabase Auth + RLS).
- Module **missions / tournées** (clients, trajets, livraisons).
- Alertes par e-mail/SMS sur les échéances.
- Export comptable et rapports PDF.

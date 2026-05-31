# Quantara Rithmic Sync Service

Service Python séparé qui synchronise les trades Rithmic d'un trader Quantara vers Supabase.

## Architecture

```
Quantara (Next.js) ──HTTPS──► mb-data-rithmic-sync (FastAPI) ──Rithmic Protocol──► Rithmic
        │                              │
        └──── Supabase ────────────────┘
              (creds chiffrés + journal_entries)
```

- **Stack** : Python 3.11 · FastAPI · async_rithmic · supabase-py · cryptography (Fernet)
- **Hébergement cible** : Railway
- **Sync modes** : historical (MVP), polling périodique, live stream (Phase 2)

## Endpoints

- `GET  /health` — healthcheck
- `POST /credentials` — stocke creds Rithmic chiffrés pour un user
- `DELETE /credentials` — révoque les creds
- `POST /sync/historical` — déclenche sync rétroactif (X derniers jours)
- `GET  /sync/jobs/{job_id}` — statut d'un sync job
- `POST /sync/live/start` — démarre stream temps réel (stub Phase 2)
- `POST /sync/live/stop` — stop stream (stub Phase 2)

## Setup local

```bash
cd mb-data-rithmic-sync
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # remplir les variables
uvicorn app.main:app --reload --port 8001
```

## Variables d'environnement

| Variable | Description |
|---|---|
| `SUPABASE_URL` | URL projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (jamais exposée côté browser) |
| `SUPABASE_JWT_SECRET` | Pour vérifier les JWT users envoyés par Quantara |
| `ENCRYPTION_KEY` | Clé Fernet (`python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`) |
| `RITHMIC_GATEWAY` | URL Rithmic (par défaut `wss://rituz00100.rithmic.com:443`) |
| `RITHMIC_SYSTEM_NAME` | Nom du système Rithmic du trader (ex `Rithmic Paper Trading`, `Topstep`, `Apex`) |
| `CORS_ORIGINS` | Liste d'origines autorisées (séparées par `,`) — ex `https://quantara.tech,http://localhost:3000` |

## Déploiement Railway

1. Crée un projet Railway
2. "Deploy from GitHub" → choisis ce repo, root dir = `mb-data-rithmic-sync`
3. Ajoute toutes les env vars ci-dessus dans Railway Settings
4. Railway build automatiquement depuis le `Dockerfile`
5. Récupère l'URL publique Railway (ex `https://quantara-rithmic.up.railway.app`)
6. Dans Quantara (Vercel), ajoute env var `RITHMIC_SYNC_URL` avec cette URL

## SQL Supabase

Applique le fichier `supabase/001_rithmic.sql` dans ton SQL Editor Supabase une fois.

## Sécurité

- Les credentials Rithmic sont chiffrés avec Fernet AVANT insertion en DB
- La master key (`ENCRYPTION_KEY`) ne doit JAMAIS être commitée ; elle vit en env var Railway uniquement
- Si la master key est perdue, tous les creds chiffrés deviennent illisibles → traders devront re-entrer
- L'API exige un JWT Supabase valide (header `Authorization: Bearer <token>`) sur tous les endpoints sensibles
- CORS strictement limité aux origines listées (quantara.tech + localhost en dev)

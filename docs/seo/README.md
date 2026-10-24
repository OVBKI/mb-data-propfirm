# Livrables SEO Quantara — 16 mai 2026

Générés via les skills `seo-audit`, `seo-plan`, `seo-content-brief`, `seo-geo`, `seo-technical` (AgriciDaniel/claude-seo v1.9.9, MIT).

## Fichiers

| # | Fichier | Quoi | Action attendue |
|---|---|---|---|
| 01 | [AUDIT-SEO.md](./01-AUDIT-SEO.md) | Audit complet du site live, score 28/100 | Implémenter les 5 critical fixes en 1 journée |
| 02 | [PLAN-SEO-12MOIS.md](./02-PLAN-SEO-12MOIS.md) | Roadmap stratégique 12 mois, 100+ pages cibles, KPIs trimestriels | Valider la direction + budget |
| 03a | [BRIEF-trailing-drawdown.md](./03-BRIEF-trailing-drawdown.md) | Brief guide éducatif ~2400 mots | Rédiger + publier |
| 03b | [BRIEF-topstep-vs-apex.md](./03-BRIEF-topstep-vs-apex.md) | Brief comparaison ~2800 mots, high commercial intent | Rédiger + publier |
| 03c | [BRIEF-passer-topstep-combine.md](./03-BRIEF-passer-topstep-combine.md) | Brief tutoriel FR ~2500 mots, niche libre | Rédiger + publier |

## Ordre d'attaque recommandé

### Semaine 1 — Technique
Lire **01-AUDIT-SEO.md** et implémenter dans cet ordre :
1. `app/robots.js` + `app/sitemap.js` (15 min)
2. OG + JSON-LD + canonical dans `app/layout.js` (1h)
3. Créer `public/og-image.png` 1200×630 (30 min)
4. Créer `public/llms.txt` (10 min)
5. Fix H1 cassé + title/description optimisés (30 min)
6. Setup GSC + Bing Webmaster + soumission sitemap (30 min)

### Semaine 2-3 — Architecture contenu
1. Créer templates `app/blog/[slug]`, `app/guides/[slug]`, `app/firms/[slug]`, `app/compare/[slug]`, `app/tools/[name]`
2. Créer pages légales `app/about`, `app/legal/privacy`, `app/legal/terms`

### Semaine 4-8 — Premiers contenus
1. Rédiger brief **03-BRIEF-trailing-drawdown.md** (~6h éditing) → publier sur `/guides/trailing-drawdown`
2. Rédiger brief **03-BRIEF-topstep-vs-apex.md** (~8h éditing) → publier sur `/compare/topstep-vs-apex`
3. Rédiger brief **03-BRIEF-passer-topstep-combine.md** (~6h éditing) → publier sur `/guides/comment-passer-topstep-combine`

Total estimé : ~20-30h de boulot étalées sur 6-8 semaines pour avoir une fondation SEO solide.

## Comment je peux aider après

- Implémenter directement le code (robots.js, sitemap.js, schema JSON-LD, etc.) → demande "applique les fixes critiques de l'audit"
- Rédiger les articles à partir des briefs → demande "rédige l'article du brief trailing-drawdown"
- Auditer une page spécifique après publication → demande "audit SEO sur /guides/trailing-drawdown"
- Faire de nouveaux briefs → demande "brief pour [keyword]"
- Tracker progress → demande "où en est-on sur la roadmap SEO"

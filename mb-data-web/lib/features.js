// lib/features.js — interrupteurs de fonctionnalités.
//
// Une fonctionnalité éteinte disparaît de la navigation, ses pages publiques
// rendent 404 et ses routes API répondent 404. Son code reste en place : il suffit
// de passer le drapeau à true pour la rallumer.
//
//   social   : profils publics /u/*, abonnés, groupes /g/* et /app/groups (les
//              admins gardent l'accès à /app/groups pour la construire)
//   referral : codes de parrainage (/api/referral) — aucun écran ni récompense
//              n'existe encore
export const FEATURES = {
  social: false,
  referral: false,
}

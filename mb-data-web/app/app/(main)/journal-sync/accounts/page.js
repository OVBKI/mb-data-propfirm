// PAUSED (juin 2026) — vue comptes Rithmic mise en pause (liée à la sync Rithmic).
// Code complet conservé dans l'historique git / branche de dev.
// Réactiver : restaurer ce fichier depuis le commit précédent.
import { redirect } from 'next/navigation'

export default function RithmicAccountsPaused() {
  redirect('/app/journal-sync')
}

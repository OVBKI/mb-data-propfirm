// PAUSED (juin 2026) — Sync Rithmic live mise en pause.
// L'écran complet (gestion multi-credentials Rithmic) reste dans l'historique git
// et sur la branche de dev. Réactiver : restaurer ce fichier depuis le commit précédent.
import { redirect } from 'next/navigation'

export default function RithmicSyncPaused() {
  redirect('/app/journal-sync')
}

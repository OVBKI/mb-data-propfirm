// PAUSED (juin 2026) — détail compte Rithmic mis en pause (lié à la sync Rithmic).
// Code complet (stat cards, equity curve, trading calendar) conservé dans l'historique
// git / branche de dev. Réactiver : restaurer ce fichier depuis le commit précédent.
import { redirect } from 'next/navigation'

export default function RithmicAccountDetailPaused() {
  redirect('/app/journal-sync')
}

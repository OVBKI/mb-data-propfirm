// Ancien hub « Journal Sync » : il ne contenait que deux liens (importer un CSV,
// voir les trades importés). On va directement à l'import.
import { redirect } from 'next/navigation'

export default function JournalSyncRedirect() {
  redirect('/app/import-lab')
}

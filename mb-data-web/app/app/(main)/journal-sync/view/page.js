// Ancienne vue « journal importé » : le Journal montre désormais les deux origines,
// avec un filtre. Les liens existants (e-mails, favoris) arrivent filtrés.
import { redirect } from 'next/navigation'

export default function JournalSyncViewRedirect() {
  redirect('/app/journal?origin=import')
}

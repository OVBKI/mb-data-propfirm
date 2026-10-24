// L'ancienne page Profil doublait les Réglages : profil, export et suppression y
// existaient en trois exemplaires. Tout se fait maintenant dans Réglages, qui
// ouvre la fenêtre d'édition du profil.
import { redirect } from 'next/navigation'

export default function ProfileRedirect() {
  redirect('/app/settings')
}

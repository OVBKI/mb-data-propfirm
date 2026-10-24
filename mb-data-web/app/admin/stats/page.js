// Statistiques : affichées sur l'accueil admin, sous les compteurs.
import { redirect } from 'next/navigation'

export default function AdminStatsRedirect() {
  redirect('/admin')
}

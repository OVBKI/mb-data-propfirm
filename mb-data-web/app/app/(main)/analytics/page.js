// L'ancienne page Analytics doublait l'onglet Performance du dashboard (mêmes
// chiffres, deux calculs). Ses blocs propres — bilan par année et courbes par
// compte — sont devenus des widgets de cet onglet. Les liens existants y arrivent.
import { redirect } from 'next/navigation'

export default function AnalyticsRedirect() {
  redirect('/app/dashboard?section=performance')
}

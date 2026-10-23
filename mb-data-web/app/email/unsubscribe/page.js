// /email/unsubscribe — page de confirmation ouverte depuis le lien d'un e-mail.
// Rien ne change tant que la personne n'a pas cliqué : un GET ne désabonne pas
// (les antivirus de messagerie ouvrent les liens tout seuls).
import UnsubscribeClient from './UnsubscribeClient'

export const metadata = {
  title: 'Se désabonner des e-mails · Quantara',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <UnsubscribeClient />
}

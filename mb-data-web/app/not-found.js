// Page 404 custom — affichée pour toute URL inexistante (/foo, /random, etc.)
// Next.js 14 App Router : appelée automatiquement quand aucune route ne match,
// ou via `notFound()` depuis un server component.
//
// Server component (metadata + SEO) ; le rendu visuel est délégué à NotFoundClient
// pour pouvoir traduire via useT() (FR/EN).

import NotFoundClient from './NotFoundClient'

export const metadata = {
  title: 'Page introuvable — 404',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return <NotFoundClient />
}

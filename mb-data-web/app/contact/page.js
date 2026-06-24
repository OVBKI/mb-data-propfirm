// Page /contact — wrapper Server Component qui exporte les metadata.
// Le rendu client (traduit via useT) est délégué à ContactClient.
import ContactClient from './ContactClient'

export const revalidate = 3600 // ISR: revalidate every hour

export const metadata = {
  title: 'Contact — Quantara',
  description: 'Contactez l\'équipe Quantara pour toute question ou suggestion.',
  alternates: {
    canonical: 'https://quantara.tech/contact',
  },
  openGraph: {
    title: 'Contact — Quantara',
    description: 'Contactez l\'équipe Quantara pour toute question ou suggestion.',
    url: 'https://quantara.tech/contact',
    type: 'website',
    images: ['/og-image.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact — Quantara',
    description: 'Contactez l\'équipe Quantara pour toute question ou suggestion.',
  },
}

export default function ContactPage() {
  return <ContactClient />
}

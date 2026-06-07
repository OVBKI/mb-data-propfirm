'use client'
// Landing concept #6 — "Prism" — uses the Magic/21st.dev "Ethereal" 3D scene
// (cinematic faceted icosahedron, cosine-palette shader + film-grade post) as bg.
import dynamic from 'next/dynamic'
import Landing3DShell from '../../../components/landing3d/Landing3DShell'

const PrismScene = dynamic(() => import('../../../components/landing3d/PrismScene'), { ssr: false, loading: () => null })

export default function PrismLanding() {
  return (
    <Landing3DShell
      name="Prism"
      accent="#a78bfa"
      accent2="#ec4899"
      scene={<PrismScene palette={{ primary: '#6366f1', secondary: '#a78bfa', tertiary: '#ec4899', accent: '#06ffa5' }} />}
      badge="✦ Rendu cinématique · une seule source de vérité"
      heroTitle="Tes comptes prop,"
      heroHighlight="enfin limpides."
      heroSub="Challenges, funded, payouts, dépenses : Quantara fait converger tout ton trading PropFirm dans un journal net, précis et cinématographiquement clair."
      magicCredit="Modèle 3D : Magic / 21st.dev « Ethereal » (adapté)"
      others={[{ href: '/landing/nebula', label: 'Concept Nebula' }, { href: '/landing/flux', label: 'Concept Flux' }]}
    />
  )
}

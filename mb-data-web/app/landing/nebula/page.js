'use client'
// Landing concept #4 — "Nebula" — uses the Magic/21st.dev "Horizon" 3D scene
// (starfield + nebula + parallax mountains + atmosphere + bloom) as a fixed bg.
import dynamic from 'next/dynamic'
import Landing3DShell from '../../../components/landing3d/Landing3DShell'

const NebulaScene = dynamic(() => import('../../../components/landing3d/NebulaScene'), { ssr: false, loading: () => null })

export default function NebulaLanding() {
  return (
    <Landing3DShell
      name="Nebula"
      accent="#4d8fff"
      accent2="#a06bff"
      scene={<NebulaScene />}
      badge="◐ Vue depuis l'orbite · ton desk prop dans les étoiles"
      heroTitle="Pilote tes comptes prop"
      heroHighlight="à l'échelle cosmique."
      heroSub="Tous tes challenges, comptes funded, payouts et dépenses réunis dans une seule console. Le journal de trading multi-PropFirms pensé pour voir grand."
      magicCredit="Scène 3D : Magic / 21st.dev « Horizon » (adaptée)"
      others={[{ href: '/landing/flux', label: 'Concept Flux' }, { href: '/landing/prism', label: 'Concept Prism' }]}
    />
  )
}

'use client'
// Landing concept #5 — "Flux" — uses the Magic/21st.dev "AnomalousMatter" 3D
// scene (noise-displaced wireframe icosahedron, mouse-lit) as a fixed bg.
import dynamic from 'next/dynamic'
import Landing3DShell from '../../../components/landing3d/Landing3DShell'

const FluxScene = dynamic(() => import('../../../components/landing3d/FluxScene'), { ssr: false, loading: () => null })

export default function FluxLanding() {
  return (
    <Landing3DShell
      name="Flux"
      accent="#22d3ee"
      accent2="#3b82f6"
      scene={<div style={{ position: 'absolute', inset: 0 }}><FluxScene color="#22d3ee" /></div>}
      badge="◆ Matière en flux · bouge ta souris"
      heroTitle="Ton edge prend forme."
      heroHighlight="En temps réel."
      heroSub="Quantara transforme le chaos de tes comptes PropFirm — P&L, drawdown, payouts, dépenses — en une structure claire qui réagit à chacun de tes trades."
      magicCredit="Modèle 3D : Magic / 21st.dev « Anomalous Matter » (adapté)"
      others={[{ href: '/landing/nebula', label: 'Concept Nebula' }, { href: '/landing/prism', label: 'Concept Prism' }]}
    />
  )
}

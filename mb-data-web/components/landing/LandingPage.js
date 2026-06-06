'use client'
// LandingPage — Editorial Whisper variant (v2).
// Magazine / editorial finance aesthetic: warm cream, ink-black serif headlines,
// burgundy accents used like a fountain-pen underline. Lots of whitespace,
// hairline rules, asymmetric grids. No mockups, no 3D, no gradients.
//
// All heavy lifting is in components/landing/v2editorial/*.

import FontLoader from './v2editorial/FontLoader'
import EditorialNav from './v2editorial/EditorialNav'
import EditorialHero from './v2editorial/EditorialHero'
import EditorialManifesto from './v2editorial/EditorialManifesto'
import EditorialPrinciples from './v2editorial/EditorialPrinciples'
import EditorialPullQuote from './v2editorial/EditorialPullQuote'
import EditorialFinalCTA from './v2editorial/EditorialFinalCTA'
import EditorialFooter from './v2editorial/EditorialFooter'
import HairlineRule from './v2editorial/HairlineRule'
import { editorial } from './v2editorial/tokens'

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: editorial.bg,
        color: editorial.ink,
        // Inter is the safe default; serif elements opt in explicitly.
        fontFamily: editorial.sans,
        // Avoid horizontal scroll from oversized italic headlines on narrow viewports.
        overflowX: 'hidden',
        // Smooth out body text on cream — looks particularly bad on default Windows
        // without antialiased rendering.
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
      }}
    >
      <FontLoader />

      <EditorialNav />

      <main>
        <EditorialHero />

        <HairlineRule />

        <EditorialManifesto />

        <HairlineRule />

        <EditorialPrinciples />

        <HairlineRule />

        <EditorialPullQuote />

        <HairlineRule />

        <EditorialFinalCTA />
      </main>

      <EditorialFooter />
    </div>
  )
}

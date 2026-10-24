'use client'
// components/landing/LandingPageLazy.js — charge la landing côté navigateur
// seulement (Three.js, framer-motion). Next 15 n'accepte `ssr: false` que dans
// un composant client : app/page.js reste serveur pour ses métadonnées.
import dynamic from 'next/dynamic'
import LandingFallback from './LandingFallback'

const LandingPage = dynamic(() => import('./LandingPage'), {
  ssr: false,
  loading: () => <LandingFallback />,
})

export default LandingPage

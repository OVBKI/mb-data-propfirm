// lib/assets.test.js — les fichiers livrés au navigateur.
//
// Un asset n'a pas de type ni de compilateur pour le surveiller : rien n'empêche
// de re-rendre le fond en 1080p et de livrer 4 Mo sans s'en apercevoir. Ce test
// est le seul garde-fou.

import { describe, it, expect } from 'vitest'
import { statSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const PUBLIC = join(process.cwd(), 'public')

describe('fond animé du dashboard', () => {
  it('est livré', () => {
    // Absent, DashboardBackdrop ne planterait pas — la vidéo resterait à
    // opacity 0 et on garderait le halo CSS. L'échec serait donc SILENCIEUX.
    expect(existsSync(join(PUBLIC, 'backdrop.webm')), 'public/backdrop.webm manquant').toBe(true)
  })

  it('reste sous 200 ko', () => {
    // Repère : la version actuelle fait ~52 ko en VP9 à 960×540. Le même rendu
    // en H.264 pèse 893 ko, et en 1080p il quadruple. Le seuil laisse de la
    // marge pour un ajustement, pas pour un changement de format ou de taille.
    const kb = statSync(join(PUBLIC, 'backdrop.webm')).size / 1024
    expect(kb, `backdrop.webm fait ${kb.toFixed(0)} ko`).toBeLessThan(200)
  })
})

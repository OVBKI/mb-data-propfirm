// lib/theme.test.js — helpers de thème.
import { describe, it, expect } from 'vitest'
import { readableOn } from './theme'

// Une couleur de MARQUE ne suit pas le thème : ni '#fff' ni --text-inverse ne
// conviennent. C'est la luminance du fond qui décide.
describe('readableOn', () => {
  it('met du texte SOMBRE sur une marque claire', () => {
    expect(readableOn('#4d8fff')).toBe('#0a1420')   // Lucid — 3.13:1 en blanc
    expect(readableOn('#fac775')).toBe('#0a1420')   // ambre
    expect(readableOn('#ffffff')).toBe('#0a1420')
  })

  it('met du texte CLAIR sur une marque sombre', () => {
    expect(readableOn('#1e2a4a')).toBe('#ffffff')   // Phidias
    expect(readableOn('#0a3a2a')).toBe('#ffffff')   // Alpha Futures
    expect(readableOn('#000')).toBe('#ffffff')
  })

  it('accepte la notation courte et tolère une entrée invalide', () => {
    expect(readableOn('#fff')).toBe('#0a1420')
    // Ne pas deviner : une valeur non hexadécimale (var(), null) garde le blanc.
    expect(readableOn('var(--blue)')).toBe('#ffffff')
    expect(readableOn(null)).toBe('#ffffff')
  })

  // Le vrai contrat : la couleur rendue est TOUJOURS la meilleure des deux.
  // Figer '#fff' ou '#000' par marque ne prouverait rien — et promettre 4.5:1
  // partout serait faux : sur une marque de luminance moyenne (#8b5cf6) aucune
  // des deux n'y arrive, c'est arithmétique.
  it('rend toujours la meilleure des deux couleurs', () => {
    const lum = hex => {
      const c = i => {
        const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
      }
      return 0.2126 * c(0) + 0.7152 * c(1) + 0.0722 * c(2)
    }
    const ratio = (a, b) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
      return (hi + 0.05) / (lo + 0.05)
    }
    const BRANDS = ['#4d8fff', '#1e2a4a', '#00a99d', '#f5a623', '#e94b3c',
                    '#8b5cf6', '#ff8c42', '#a86bff', '#0a3a2a', '#22c1a4']
    for (const brand of BRANDS) {
      const chosen = readableOn(brand)
      const other = chosen === '#ffffff' ? '#0a1420' : '#ffffff'
      expect(ratio(brand, chosen), brand).toBeGreaterThanOrEqual(ratio(brand, other))
    }
  })

  it('atteint le seuil AA sur les marques où c’est possible', () => {
    // Toutes celles du catalogue sauf #8b5cf6, hors d'atteinte par construction.
    const OK = ['#4d8fff', '#1e2a4a', '#00a99d', '#f5a623', '#e94b3c',
                '#ff8c42', '#0a3a2a', '#22c1a4', '#e94b3c']
    const lum = hex => {
      const c = i => {
        const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
      }
      return 0.2126 * c(0) + 0.7152 * c(1) + 0.0722 * c(2)
    }
    const ratio2 = (a, b) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
      return (hi + 0.05) / (lo + 0.05)
    }
    for (const brand of OK) {
      expect(ratio2(brand, readableOn(brand)), brand).toBeGreaterThanOrEqual(4.5)
    }
  })
})

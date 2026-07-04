import { describe, it, expect } from 'vitest'
import { sanitizeUrl } from './sanitize'

// sanitizeUrl — allowlist stricte http/https, tout le reste → null.
describe('sanitizeUrl', () => {
  it('accepte https et http (URL normalisée via URL.href)', () => {
    // Note : new URL().href ajoute un '/' final aux racines de domaine.
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com/')
    expect(sanitizeUrl('https://example.com/path?q=1#frag')).toBe('https://example.com/path?q=1#frag')
    expect(sanitizeUrl('http://example.com/page')).toBe('http://example.com/page')
  })

  it('normalise la casse du protocole et du host', () => {
    expect(sanitizeUrl('HTTPS://EXAMPLE.COM/Path')).toBe('https://example.com/Path')
  })

  it('bloque javascript:', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull()
    expect(sanitizeUrl('JaVaScRiPt:alert(1)')).toBeNull()
  })

  it('bloque data:, vbscript:, file:, ftp:, blob:', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBeNull()
    expect(sanitizeUrl('file:///etc/passwd')).toBeNull()
    expect(sanitizeUrl('ftp://example.com/file')).toBeNull()
    expect(sanitizeUrl('blob:https://example.com/uuid')).toBeNull()
  })

  it('rejette les URLs malformées et relatives (pas de base URL)', () => {
    expect(sanitizeUrl('not a url')).toBeNull()
    expect(sanitizeUrl('/relative/path')).toBeNull()
    expect(sanitizeUrl('//protocol-relative.com')).toBeNull()
    expect(sanitizeUrl('example.com')).toBeNull() // pas de protocole
  })

  it('rejette les entrées vides / null / undefined', () => {
    expect(sanitizeUrl('')).toBeNull()
    expect(sanitizeUrl(null)).toBeNull()
    expect(sanitizeUrl(undefined)).toBeNull()
    expect(sanitizeUrl(0)).toBeNull()
  })

  it("tolère les espaces de tête/queue (comportement du constructeur URL)", () => {
    expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com/')
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { unsubscribeToken, verifyUnsubscribeToken, unsubscribeHeaders, unsubscribePageUrl } from './emailUnsubscribe'

const U = '00000000-0000-4000-8000-000000000001'

describe('lien de désinscription signé', () => {
  beforeEach(() => { process.env.EMAIL_UNSUBSCRIBE_SECRET = 'cle-de-test'; process.env.NEXT_PUBLIC_SITE_URL = 'https://quantara.tech' })

  it('accepte le jeton de l’utilisateur', () => {
    expect(verifyUnsubscribeToken(U, unsubscribeToken(U))).toBe(true)
  })
  it('refuse le jeton d’un autre utilisateur', () => {
    expect(verifyUnsubscribeToken(U, unsubscribeToken('autre-id'))).toBe(false)
  })
  it('refuse un jeton forgé, vide ou absent', () => {
    expect(verifyUnsubscribeToken(U, 'x'.repeat(32))).toBe(false)
    expect(verifyUnsubscribeToken(U, '')).toBe(false)
    expect(verifyUnsubscribeToken(U, undefined)).toBe(false)
  })
  it('sans clé serveur, aucun jeton n’est émis ni accepté', () => {
    expect(unsubscribeToken(U, '')).toBeNull()
    expect(verifyUnsubscribeToken(U, 'abc', '')).toBe(false)
  })
  it('un jeton ne survit pas à un changement de clé', () => {
    const t = unsubscribeToken(U, 'ancienne')
    expect(verifyUnsubscribeToken(U, t, 'nouvelle')).toBe(false)
  })
  it('les en-têtes proposent le désabonnement en un clic vers l’API', () => {
    const h = unsubscribeHeaders(U)
    expect(h['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
    expect(h['List-Unsubscribe']).toMatch(/^<https:\/\/quantara\.tech\/api\/email\/unsubscribe\?u=/)
  })
  it('le lien du corps de l’e-mail mène à une page de confirmation, pas à l’API', () => {
    expect(unsubscribePageUrl(U)).toMatch(/^https:\/\/quantara\.tech\/email\/unsubscribe\?u=.+&t=.+/)
  })
})

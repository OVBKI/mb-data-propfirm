import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import * as I18N from './i18n'
import EN from './i18n/en'

// Toutes les clés t('…') utilisées dans l'app doivent exister en FR ET en EN,
// et les deux dictionnaires doivent avoir les mêmes clés.

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out)
    else out[key] = v
  }
  return out
}

function walk(dir, files = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) { if (!['node_modules', '.next'].includes(f)) walk(p, files) }
    else if (p.endsWith('.js') && !p.endsWith('.test.js')) files.push(p)
  }
  return files
}

describe('i18n', () => {
  const root = new URL('..', import.meta.url).pathname
  const locales = { fr: I18N.TRANSLATIONS.fr, en: EN }
  it('dictionnaires trouvés', () => { expect(locales?.fr && locales?.en).toBeTruthy() })
  const fr = flatten(locales?.fr), en = flatten(locales?.en)

  it('chaque clé utilisée existe en FR et en EN', () => {
    const used = new Set()
    for (const f of [...walk(join(root, 'app')), ...walk(join(root, 'components'))]) {
      for (const m of readFileSync(f, 'utf8').matchAll(/\bt\(\s*'(app\.[A-Za-z0-9_.]+)'\s*\)/g)) used.add(m[1])
    }
    const missing = [...used].filter((k) => !(k in fr) || !(k in en))
    expect(missing).toEqual([])
  })

  it('le dictionnaire anglais se charge à la demande', async () => {
    await I18N.loadLocale('en')
    expect(I18N.translate('app.trade.rulesDone', 'en')).toBe('Got it')
  })

  it('FR et EN ont les mêmes clés', () => {
    expect(Object.keys(fr).filter((k) => !(k in en))).toEqual([])
    expect(Object.keys(en).filter((k) => !(k in fr))).toEqual([])
  })
})

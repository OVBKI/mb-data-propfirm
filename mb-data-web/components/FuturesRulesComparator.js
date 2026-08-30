'use client'
// FuturesRulesComparator — comparateur de RÈGLES futures (grille de cartes).
//
// Une carte par firme : en-tête (logo, nom, type de drawdown), onglets de
// programme, puis deux blocs de règles libellé → valeur (CHALLENGE / FINANCÉ).
//
// ⚠️ POURQUOI DES CARTES ET PLUS UNE TABLE : la table faisait dix colonnes de
// large et imposait un défilement horizontal sur téléphone, avec un <select> de
// programme posé au milieu d'une cellule. Une carte tient sur un écran, et les
// programmes deviennent des onglets — un vrai groupe de boutons, pas un contrôle
// de formulaire. Le prix assumé : comparer deux firmes demande de regarder deux
// cartes, là où deux lignes alignées se lisaient d'un coup.
//
// Données : 100% consommées depuis lib/futuresComparison.js — RIEN n'est inventé.
// Chaque valeur passe par cleanCell(value, kind) (lib/futuresComparison.js,
// exporté là-bas pour être testable unitairement) qui :
//   - normalise un affichage court et lisible,
//   - retombe sur la valeur brute (tronquée) si l'extraction échoue,
//   - met TOUJOURS la valeur brute complète en title= (tooltip au survol).

import { Fragment, useState, useMemo } from 'react'
import { useT } from './LanguageProvider'
import {
  getFuturesComparison,
  getFirmsWithComparison,
  cleanCell,
} from '../lib/futuresComparison'
import { plansForFirm, planSizeNum, registerCustomFuturesFirms } from '../lib/constants'
import { useManagedFuturesFirms } from '../lib/managedFirms'
import { getFirmLogo } from '../lib/firmLogos'

// Style inline "visually hidden" (lecteurs d'écran uniquement).
const SR_ONLY = {
  position: 'absolute', width: 1, height: 1, overflow: 'hidden',
  clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap',
}

// === Tokens de thème (cohérents avec globals.css / lib/theme.js) ===
const C = {
  surface: 'var(--surface)',
  border: 'var(--border)',
  border2: 'var(--border2)',
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  blue: 'var(--blue)',
  blueLight: 'var(--blue-light)',
  green: 'var(--green)',
  tint1: 'var(--tint1)',
}

// Lignes de règles : clé de données + clé i18n du libellé + kind de nettoyage.
const CHALLENGE_ROWS = [
  { key: 'drawdown', labelKey: 'colDrawdown', kind: 'money' },
  { key: 'dailyDrawdown', labelKey: 'colDailyDrawdown', kind: 'money' },
  { key: 'objectif', labelKey: 'colTarget', kind: 'money' },
  { key: 'consistance', labelKey: 'colConsistency', kind: 'pct' },
]
// FINANCÉ n'a ni Drawdown ni Drawdown journalier (demande user).
const FUNDED_ROWS = [
  { key: 'buffer', labelKey: 'colBuffer', kind: 'buffer' },
  { key: 'jourMin', labelKey: 'colMinDays', kind: 'days' },
  { key: 'minDailyProfit', labelKey: 'colMinDailyProfit', kind: 'money' },
  { key: 'consistance', labelKey: 'colConsistency', kind: 'pct' },
]

// Teinte de la pastille selon le type de drawdown. Un type COMPOSÉ
// (« EOD / Intraday » chez LucidDaily, où le type se choisit à l'achat) reste
// neutre : le colorer comme l'un des deux ferait croire à un choix déjà fait.
function ddTypeTint(type) {
  const t = String(type || '')
  if (/\//.test(t)) return { bg: 'var(--tint2)', fg: C.text2 }
  if (/EOD/i.test(t)) return { bg: 'var(--cyan-bg)', fg: 'var(--cyan)' }
  if (/trailing/i.test(t)) return { bg: 'var(--amber-bg)', fg: 'var(--amber)' }
  if (/static/i.test(t)) return { bg: 'var(--violet-bg)', fg: 'var(--violet)' }
  return { bg: 'var(--tint2)', fg: C.text2 }
}

export default function FuturesRulesComparator() {
  const t = useT()
  // Admin overrides (custom_propfirms): register the overlay synchronously so the
  // resolvers below reflect edits made from /admin/propfirms, and re-render once
  // the custom firms have loaded.
  const managed = useManagedFuturesFirms()
  // Idempotent overlay registration — runs before the resolvers below read firmRules().
  registerCustomFuturesFirms(managed)
  const firms = useMemo(() => getFirmsWithComparison(), [managed])

  // Union des tailles de plan sur toutes les firmes, triées par montant.
  const planOptions = useMemo(() => {
    const set = new Set()
    firms.forEach(f => plansForFirm(f).forEach(p => set.add(p)))
    return [...set].sort((a, b) => planSizeNum(a) - planSizeNum(b))
  }, [firms])

  const [plan, setPlan] = useState(() =>
    planOptions.includes('50k') ? '50k' : planOptions[0] || '50k'
  )

  // Programme affiché par firme. Clé = nom de firme, valeur = index du modèle.
  const [modelByFirm, setModelByFirm] = useState({})

  return (
    <div className="page-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 60px' }}>
      {/* === En-tête === */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: 11, color: C.blueLight, letterSpacing: '0.16em',
          marginBottom: 10, textTransform: 'uppercase', fontWeight: 600,
        }}>
          {t('app.futuresComparator.eyebrow')}
        </div>
        <h1 style={{
          fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em',
          margin: 0, marginBottom: 8, lineHeight: 1.1, color: C.text,
        }}>
          {t('app.futuresComparator.title')}
        </h1>
        <p style={{ fontSize: 14, color: C.text3, margin: 0, lineHeight: 1.5 }}>
          {t('app.futuresComparator.subtitle')}
        </p>
      </div>

      {/* === Sélecteur de taille === */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22,
        padding: '14px 18px',
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
        alignItems: 'center',
      }}>
        <div style={{
          fontSize: 11, color: C.text3, letterSpacing: '0.12em',
          fontWeight: 600, textTransform: 'uppercase', marginRight: 4,
        }}>
          {t('app.futuresComparator.planSize')}
        </div>
        {planOptions.map(p => {
          const active = p === plan
          return (
            <button
              key={p}
              onClick={() => setPlan(p)}
              aria-pressed={active}
              style={{
                padding: '7px 16px', fontSize: 12.5, cursor: 'pointer',
                borderRadius: 99, fontWeight: active ? 700 : 500,
                minWidth: 48, minHeight: 32,
                border: `1px solid ${active ? 'var(--blue-border)' : C.border2}`,
                background: active ? 'var(--blue-bg)' : 'transparent',
                color: active ? C.blueLight : C.text2,
                fontFamily: 'inherit', letterSpacing: '0.03em',
                transition: 'all 0.15s',
              }}>
              {String(p).toUpperCase()}
            </button>
          )
        })}
      </div>

      {/* === Grille de cartes ===
          `auto-fill` + minmax fait tout le responsive : trois colonnes en large,
          deux en tablette, une sur téléphone, sans media query ni classe. */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 14,
      }}>
        {firms.map(firm => (
          <FirmCard
            key={firm}
            firm={firm}
            plan={plan}
            t={t}
            selIdx={modelByFirm[firm]}
            onSelect={i => setModelByFirm(prev => ({ ...prev, [firm]: i }))}
          />
        ))}
      </div>

      <div style={{ marginTop: 18, fontSize: 11, color: C.text3, lineHeight: 1.5 }}>
        {t('app.futuresComparator.footer')}
      </div>
    </div>
  )
}

// === Carte de firme ========================================================
function FirmCard({ firm, plan, t, selIdx, onSelect }) {
  const offered = plansForFirm(firm).includes(plan)
  const { models } = getFuturesComparison(firm, plan)

  // Un modèle est « dispo » pour ce plan si au moins une de ses cellules cœur
  // (drawdown challenge/financé) se résout. Sinon les données du plan n'existent
  // pas pour ce modèle (ex: MFFU Builder hors 50K, Phidias E2L en 50K+).
  const isModelAvailable = m =>
    !!m && (m.challenge.drawdown !== null || m.funded.drawdown !== null)

  const multi = models.length > 1
  // Défaut = 1er modèle DISPO pour ce plan ; un choix explicite est respecté même
  // s'il pointe un programme non vendu ici — sinon on ne pourrait plus en sortir.
  const idx = selIdx !== undefined
    ? Math.min(selIdx, Math.max(models.length - 1, 0))
    : Math.max(models.findIndex(isModelAvailable), 0)
  const model = models[idx] || null
  const shown = offered && isModelAvailable(model)

  const tint = ddTypeTint(model?.ddType)

  return (
    <article style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 'var(--radius-lg, 18px)',
      boxShadow: 'var(--shadow-card)',
      padding: '16px 16px 14px',
      opacity: shown ? 1 : 0.55,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* En-tête : logo, nom, type de drawdown */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        {getFirmLogo(firm, C.blue, 26)}
        <h2 style={{
          fontSize: 15, fontWeight: 700, color: C.text, margin: 0,
          flex: 1, minWidth: 0, lineHeight: 1.2, letterSpacing: '-0.01em',
        }}>{firm}</h2>
        {shown && model?.ddType && (
          <span style={{
            fontSize: 10.5, fontWeight: 600, letterSpacing: '0.03em',
            borderRadius: 99, padding: '3px 9px', whiteSpace: 'nowrap',
            background: tint.bg, color: tint.fg,
          }}>
            {/* Le libellé de la colonne « Type » a disparu avec la table : sans
                ce préfixe masqué, un lecteur d'écran annoncerait « EOD » seul. */}
            <span style={SR_ONLY}>{t('app.futuresComparator.colType')} : </span>
            {model.ddType}
          </span>
        )}
      </header>

      {/* Onglets de programme — un vrai groupe de boutons, plus un <select>. */}
      {offered && multi && (
        <div
          role="group"
          aria-label={t('app.futuresComparator.modelSelectAria').replace('{firm}', firm)}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
          {models.map((m, i) => {
            const active = i === idx
            return (
              <button
                key={m.name || i}
                onClick={() => onSelect(i)}
                aria-pressed={active}
                style={{
                  fontFamily: 'inherit', fontSize: 11.5, fontWeight: 600,
                  cursor: 'pointer', borderRadius: 7, padding: '6px 10px',
                  minHeight: 32,
                  background: active ? 'var(--blue-bg)' : C.tint1,
                  border: `1px solid ${active ? 'var(--blue-border)' : 'transparent'}`,
                  color: active ? C.blueLight : C.text3,
                  transition: 'all 0.12s',
                }}>
                {m.name || t('app.futuresComparator.modelFallback').replace('{n}', i + 1)}
              </button>
            )
          })}
        </div>
      )}
      {/* Programme unique : pas d'onglet à cliquer, juste son nom. */}
      {shown && !multi && model?.name && (
        <div style={{
          fontSize: 10, color: C.blueLight, fontWeight: 600, marginBottom: 12,
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>{model.name}</div>
      )}

      {!shown ? (
        <div style={{ fontSize: 12, color: C.text3, padding: '10px 0 4px' }}>
          {t('app.futuresComparator.planNotAvailable')}
        </div>
      ) : (
        <>
          <PhaseLabel color={C.blue} text={t('app.futuresComparator.groupChallenge')} />
          <RuleList rows={CHALLENGE_ROWS} source={model.challenge} t={t} />
          <PhaseLabel color={C.green} text={t('app.futuresComparator.groupFunded')} />
          <RuleList rows={FUNDED_ROWS} source={model.funded} t={t} last />
        </>
      )}
    </article>
  )
}

// Intitulé de phase : le trait qui suit sépare sans ajouter de bordure à la liste.
function PhaseLabel({ color, text }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 9,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.11em',
      textTransform: 'uppercase', color, margin: '4px 0 9px',
    }}>
      {text}
      <span aria-hidden="true" style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  )
}

// === Liste de règles =======================================================
function RuleList({ rows, source, t, last }) {
  return (
    <dl style={{
      display: 'grid', gridTemplateColumns: '1fr auto', gap: '7px 12px',
      margin: 0, marginBottom: last ? 0 : 16,
    }}>
      {rows.map(row => {
        const cell = cleanCell(source[row.key], row.kind)
        // Valeur tronquée : title= garde le tooltip souris, et un span masqué
        // expose la règle complète aux lecteurs d'écran.
        const truncated = !!cell.title && cell.title !== cell.text
        return (
          // Fragment plutôt qu'un <div> en `display: contents` : dt et dd doivent
          // être des items DIRECTS de la grille pour que les deux colonnes
          // s'alignent d'une ligne à l'autre.
          <Fragment key={row.key}>
            <dt style={{ fontSize: 12.5, color: C.text2 }}>
              {t(`app.futuresComparator.${row.labelKey}`)}
            </dt>
            <dd
              title={cell.title || undefined}
              style={{
                margin: 0, fontSize: 13.5, fontWeight: 600, textAlign: 'right',
                color: cell.text === '—' ? C.text3 : C.text,
                cursor: cell.title ? 'help' : 'default',
              }}>
              <span aria-hidden={truncated || undefined}>{cell.text}</span>
              {truncated && <span style={SR_ONLY}>{cell.title}</span>}
            </dd>
          </Fragment>
        )
      })}
    </dl>
  )
}

'use client'
// app/app/(main)/settings/page.js — Settings page: profile, notifications, language, data, about.
// Linked from monthly recap emails (/app/settings → "Gérer mes préférences email").

import { useState, useEffect } from 'react'
import { useApp } from '../AppContext'
import { useT } from '../../../../components/LanguageProvider'
import { C, cardStyle } from '../../../../lib/theme'
import PushNotificationToggle from '../../../../components/PushNotificationToggle'
import BillingSection from '../../../../components/BillingSection'
import LanguageSwitcher from '../../../../components/LanguageSwitcher'
import ThemeSwitcher from '../../../../components/ThemeSwitcher'
import Link from 'next/link'

// ── Local storage key for email preferences ──
const LS_KEY_MONTHLY_RECAP = 'qt_pref_monthly_recap'

function SectionTitle({ icon, children }) {
  return (
    <h2 style={{
      fontSize: 16, fontWeight: 700, color: C.text,
      display: 'flex', alignItems: 'center', gap: 10,
      margin: 0, marginBottom: 16,
    }}>
      <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
      {children}
    </h2>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      ...cardStyle,
      padding: '20px 22px',
      marginBottom: 20,
      ...style,
    }}>
      {children}
    </div>
  )
}

function SettingRow({ label, description, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, flexWrap: 'wrap',
      padding: '12px 0',
      borderBottom: `0.5px solid ${C.border}`,
    }}>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{label}</div>
        {description && (
          <div style={{ fontSize: 11, color: C.text3, marginTop: 3 }}>{description}</div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>
        {children}
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: checked ? C.blue : 'var(--hairline)',
        border: `1px solid ${checked ? C.blue : C.border2}`,
        position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s', padding: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff',
        position: 'absolute', top: 2,
        left: checked ? 22 : 2,
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}

export default function SettingsPage() {
  const t = useT()
  const { user, profile, currency, setCurrencyMode, rateInfo, marketMode, setMarketMode } = useApp()

  // Email preference: monthly recap opt-in (localStorage for now)
  const [monthlyRecap, setMonthlyRecap] = useState(true)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY_MONTHLY_RECAP)
      if (stored !== null) setMonthlyRecap(JSON.parse(stored))
    } catch {}
  }, [])

  function handleMonthlyRecapToggle(val) {
    setMonthlyRecap(val)
    try { localStorage.setItem(LS_KEY_MONTHLY_RECAP, JSON.stringify(val)) } catch {}
  }

  // Toast state for "coming soon" actions
  const [toast, setToast] = useState(null)
  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Delete account confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const displayName = profile?.display_name || (profile?.username ? `@${profile.username}` : null)
  const email = user?.email || ''

  return (
    <div className="page-pad" style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px 80px' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 11, color: C.amber, letterSpacing: '0.16em',
          marginBottom: 10, textTransform: 'uppercase', fontWeight: 600,
        }}>
          {t('app.settings.eyebrow')}
        </div>
        <h1 style={{
          fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em',
          margin: 0, marginBottom: 6, lineHeight: 1.1, color: C.text,
        }}>
          {t('app.settings.title')}
        </h1>
        <p style={{ fontSize: 13, color: C.text3, margin: 0 }}>
          {t('app.settings.subtitle')}
        </p>
      </div>

      {/* ── 1. Profil ── */}
      <SectionTitle icon="👤">
        {t('app.settings.profileSection')}
      </SectionTitle>
      <Card>
        <SettingRow
          label={t('app.settings.username')}
          description={displayName || t('app.settings.notDefined')}
        >
          <span style={{ fontSize: 12, color: C.text3, fontFamily: 'monospace' }}>
            {displayName || '-'}
          </span>
        </SettingRow>
        <SettingRow
          label="Email"
          description={email}
        >
          <span style={{
            fontSize: 11, color: C.text3,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}>
            {email}
          </span>
        </SettingRow>
        <div style={{ paddingTop: 14 }}>
          <Link
            href="/app/profile"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 600, color: C.blueLight,
              textDecoration: 'none', padding: '8px 14px',
              background: 'var(--blue-bg)',
              border: `1px solid var(--blue-border)`,
              borderRadius: 8, transition: 'all 0.15s',
            }}
          >
            {t('app.settings.editProfile')}
          </Link>
        </div>
      </Card>

      {/* ── 2. Abonnement ── */}
      <SectionTitle icon="💳">
        Abonnement
      </SectionTitle>
      <BillingSection onError={showToast} />

      {/* ── 3. Notifications ── */}
      <SectionTitle icon="🔔">
        {t('app.settings.notificationsSection')}
      </SectionTitle>
      <Card>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>
            {t('app.settings.pushLabel')}
          </div>
          <div style={{ fontSize: 11, color: C.text3, marginBottom: 12 }}>
            {t('app.settings.pushDesc')}
          </div>
          <PushNotificationToggle />
        </div>
        <div style={{ height: 1, background: C.border, margin: '16px 0' }} />
        <SettingRow
          label={t('app.settings.monthlyRecap')}
          description={t('app.settings.monthlyRecapDesc')}
        >
          <Toggle checked={monthlyRecap} onChange={handleMonthlyRecapToggle} />
        </SettingRow>
      </Card>

      {/* ── 4. Apparence ── */}
      <SectionTitle icon="🎨">
        {t('app.settings.appearanceSection')}
      </SectionTitle>
      <Card>
        <SettingRow
          label={t('app.settings.themeLabel')}
          description={t('app.settings.themeDesc')}
        >
          <ThemeSwitcher />
        </SettingRow>
        <SettingRow
          label={t('app.settings.languageLabel')}
          description={t('app.settings.languageDesc')}
        >
          <LanguageSwitcher />
        </SettingRow>
        {/* Le marché vivait dans le rail, que la maquette veut réduit à de la
            navigation. C'est une préférence d'affichage : sa place est ici. */}
        <SettingRow
          label={t('app.settings.marketLabel')}
          description={t('app.settings.marketDesc')}
        >
          <div style={{ display: 'inline-flex', border: `1px solid ${C.border2}`, borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--tint1)' }}>
            {[['futures', 'Futures'], ['cfd', 'CFD']].map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setMarketMode(mode)}
                aria-pressed={marketMode === mode}
                style={{
                  padding: '7px 14px', fontSize: 12, border: 'none', minHeight: 32,
                  background: marketMode === mode ? C.blue : 'transparent',
                  color: marketMode === mode ? 'var(--text-inverse)' : C.text2,
                  cursor: 'pointer', fontWeight: 600, letterSpacing: '0.05em', fontFamily: 'inherit',
                }}
              >{label}</button>
            ))}
          </div>
        </SettingRow>
        <SettingRow
          label={t('app.settings.currencyLabel')}
          description={rateInfo || t('app.settings.currencyDesc')}
        >
          <div style={{ display: 'inline-flex', border: `1px solid ${C.border2}`, borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--tint1)' }}>
            {[['native', 'USD'], ['eur', 'EUR']].map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setCurrencyMode(mode)}
                aria-pressed={currency === mode}
                style={{
                  padding: '7px 14px', fontSize: 12, border: 'none', minHeight: 32,
                  background: currency === mode ? C.blue : 'transparent',
                  color: currency === mode ? 'var(--text-inverse)' : C.text2,
                  cursor: 'pointer', fontWeight: 600, letterSpacing: '0.05em', fontFamily: 'inherit',
                }}
              >{label}</button>
            ))}
          </div>
        </SettingRow>
      </Card>

      {/* ── 5. Donnees ── */}
      <SectionTitle icon="🗂">
        {t('app.settings.dataSection')}
      </SectionTitle>
      <Card>
        <SettingRow
          label={t('app.settings.exportLabel')}
          description={t('app.settings.exportDesc')}
        >
          <button
            onClick={() => showToast(t('app.settings.exportSoon'))}
            style={{
              fontSize: 12, fontWeight: 600, color: C.text2,
              background: 'var(--tint2)',
              border: `1px solid ${C.border2}`,
              borderRadius: 8, padding: '8px 14px',
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            {t('app.settings.exportBtn')}
          </button>
        </SettingRow>
        <div style={{ paddingTop: 14 }}>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                fontSize: 12, fontWeight: 600, color: C.red,
                background: 'transparent',
                border: `1px solid ${C.redSoft}`,
                borderRadius: 8, padding: '8px 14px',
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              {t('app.settings.deleteAccount')}
            </button>
          ) : (
            <div style={{
              background: 'var(--red-bg)',
              border: `1px solid var(--red)`,
              borderRadius: 10, padding: '16px 18px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.red, marginBottom: 6 }}>
                {t('app.settings.deleteConfirmTitle')}
              </div>
              <p style={{ fontSize: 12, color: C.text2, margin: '0 0 14px', lineHeight: 1.5 }}>
                {t('app.settings.deleteConfirmBody')}
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <a
                  href="mailto:contact@quantara.tech?subject=Suppression%20de%20compte&body=Bonjour%2C%20je%20souhaite%20supprimer%20mon%20compte%20Quantara."
                  style={{
                    fontSize: 12, fontWeight: 600, color: '#fff',
                    background: C.red, border: 'none',
                    borderRadius: 8, padding: '8px 16px',
                    textDecoration: 'none', display: 'inline-block',
                  }}
                >
                  {t('app.settings.contactSupport')}
                </a>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    fontSize: 12, fontWeight: 600, color: C.text2,
                    background: 'var(--tint2)',
                    border: `1px solid ${C.border2}`,
                    borderRadius: 8, padding: '8px 14px',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {t('app.settings.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ── 6. A propos ── */}
      <SectionTitle icon="ℹ️">
        {t('app.settings.aboutSection')}
      </SectionTitle>
      <Card style={{ marginBottom: 0 }}>
        <SettingRow
          label={t('app.settings.appVersion')}
        >
          <span style={{
            fontSize: 12, color: C.text3,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            background: 'var(--tint2)',
            padding: '4px 10px', borderRadius: 6,
          }}>
            1.0.0-beta
          </span>
        </SettingRow>
        <div style={{
          display: 'flex', gap: 16, flexWrap: 'wrap', paddingTop: 14,
        }}>
          <Link href="/legal/cgu" style={{
            fontSize: 12, color: C.text2, textDecoration: 'none',
          }}>
            CGU
          </Link>
          <Link href="/legal/privacy" style={{
            fontSize: 12, color: C.text2, textDecoration: 'none',
          }}>
            {t('app.settings.privacy')}
          </Link>
          <Link href="/legal/imprint" style={{
            fontSize: 12, color: C.text2, textDecoration: 'none',
          }}>
            {t('app.settings.legalNotice')}
          </Link>
        </div>
      </Card>

      {/* ── Toast notification ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: C.surface2, color: C.text, fontSize: 13, fontWeight: 600,
          padding: '12px 22px', borderRadius: 10,
          border: `1px solid ${C.border2}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}

'use client'
import PageHeader from '../../components/PageHeader'
import Footer from '../../components/Footer'
import Reveal from '../../components/Reveal'
import { useT, useLanguage } from '../../components/LanguageProvider'

const C = {
  bg: '#0d0f14',
  surface: '#141720',
  surface2: '#1c2030',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.13)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#7b839b',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
  amber: '#fac775',
}

// Sections sécurité — bloc locale-aware (option B) pour le contenu détaillé.
const SECTIONS_FR = [
  {
    title: 'Architecture',
    icon: '◫',
    color: C.blueLight,
    items: [
      { label: 'Frontend', value: 'Next.js 14 App Router · React 18 · hébergé sur Vercel (Frankfurt EU)' },
      { label: 'Backend & DB', value: 'Supabase (Postgres 15) · région Frankfurt EU · backups automatiques quotidiens' },
      { label: 'Auth', value: 'Supabase Auth · JWT signés HS256 · tokens dans localStorage/sessionStorage (au choix user via toggle "Rester connecté")' },
      { label: 'CDN', value: 'Vercel Edge Network · TLS 1.3 obligatoire · HSTS activé' },
    ],
  },
  {
    title: 'Isolation des données',
    icon: '◐',
    color: C.green,
    items: [
      { label: 'Row Level Security (RLS)', value: 'Chaque table Postgres (firms, accounts, payouts, journal_entries, profiles) a une policy RLS qui force auth.uid() = user_id sur lecture ET écriture. Un user ne peut JAMAIS voir/modifier les données d\'un autre.' },
      { label: 'Defensive client filtering', value: 'En plus de RLS, chaque query côté client ajoute un filtre .eq(\'user_id\', userId) explicite. Ceinture + bretelles.' },
      { label: 'Cascade delete', value: 'Suppression d\'un compte ou d\'un user → cascade automatique sur toutes les data liées (trades, payouts). Conservation 0 jour après suppression.' },
      { label: 'Pas de service_role côté client', value: 'La clé service_role (bypass RLS) reste UNIQUEMENT côté serveur dans les endpoints /api/admin. Le client utilise toujours la clé anon (RLS forced).' },
    ],
  },
  {
    title: 'Protection contre les bots',
    icon: '△',
    color: C.amber,
    items: [
      { label: 'Cloudflare Turnstile', value: 'Captcha invisible sur signup ET login. Bloque ~99% du trafic bot sans friction utilisateur.' },
      { label: 'Honeypot', value: 'Champ invisible piégé dans le formulaire d\'inscription. Si rempli (= bot), inscription rejetée silencieusement.' },
      { label: 'Rate limiting Supabase', value: 'Supabase limite les tentatives d\'auth (5 req/min par IP par défaut) pour bloquer le brute force.' },
    ],
  },
  {
    title: 'Aucun accès broker',
    icon: '◇',
    color: C.blueLight,
    items: [
      { label: 'Zero credentials brokers', value: 'Quantara ne se connecte à AUCUN broker. On ne demande JAMAIS ton mot de passe Rithmic, Tradovate, NinjaTrader, etc.' },
      { label: 'Import CSV manuel uniquement', value: 'Tu exportes manuellement un CSV depuis ton broker (Rithmic Performance ou Dashboard) et tu le glisses dans /app/import-lab. Tu gardes le contrôle total.' },
      { label: 'Pas d\'API key stockée', value: 'Aucun token broker n\'est stocké en DB. L\'app n\'a aucune capacité de trader pour toi.' },
    ],
  },
  {
    title: 'Conformité & légal',
    icon: '◊',
    color: C.green,
    items: [
      { label: 'GDPR / RGPD', value: 'Quantara Technologies LLC est conforme RGPD. Données hébergées en EU (Frankfurt). Droit d\'accès, rectification, suppression, portabilité accessibles via contact@quantara.tech.' },
      { label: 'Cookies', value: 'Aucun cookie de tracking. Uniquement cookies fonctionnels (session Supabase, préférences). Voir /legal/privacy#cookies.' },
      { label: 'Suppression de compte', value: 'À ta demande par email, ton compte + toutes tes données sont supprimés sous 7 jours ouvrés. Pas de soft-delete : c\'est définitif.' },
    ],
  },
  {
    title: 'Bonnes pratiques côté toi',
    icon: '◉',
    color: C.amber,
    items: [
      { label: 'Mot de passe fort', value: 'Min 8 caractères imposé. Recommandation : 12+ avec mélange lettres/chiffres/symboles. Utilise un gestionnaire (Bitwarden, 1Password).' },
      { label: '"Rester connecté"', value: 'Décoche cette option sur un appareil partagé pour que la session soit effacée à la fermeture du navigateur.' },
      { label: 'Vérifie ton URL', value: 'Quantara n\'envoie JAMAIS d\'email demandant ton mot de passe. Vérifie toujours que tu es bien sur quantara.tech (pas un fake).' },
    ],
  },
]

const SECTIONS_EN = [
  {
    title: 'Architecture',
    icon: '◫',
    color: C.blueLight,
    items: [
      { label: 'Frontend', value: 'Next.js 14 App Router · React 18 · hosted on Vercel (Frankfurt EU)' },
      { label: 'Backend & DB', value: 'Supabase (Postgres 15) · Frankfurt EU region · daily automatic backups' },
      { label: 'Auth', value: 'Supabase Auth · HS256-signed JWTs · tokens in localStorage/sessionStorage (user choice via "Stay signed in" toggle)' },
      { label: 'CDN', value: 'Vercel Edge Network · TLS 1.3 enforced · HSTS enabled' },
    ],
  },
  {
    title: 'Data isolation',
    icon: '◐',
    color: C.green,
    items: [
      { label: 'Row Level Security (RLS)', value: "Every Postgres table (firms, accounts, payouts, journal_entries, profiles) has an RLS policy forcing auth.uid() = user_id on read AND write. A user can NEVER see/modify another user's data." },
      { label: 'Defensive client filtering', value: "On top of RLS, every client-side query adds an explicit .eq('user_id', userId) filter. Belt and suspenders." },
      { label: 'Cascade delete', value: 'Deleting an account or user → automatic cascade on all related data (trades, payouts). Retention 0 days after deletion.' },
      { label: 'No service_role on client', value: 'The service_role key (bypasses RLS) lives ONLY on the server in /api/admin endpoints. The client always uses the anon key (RLS enforced).' },
    ],
  },
  {
    title: 'Bot protection',
    icon: '△',
    color: C.amber,
    items: [
      { label: 'Cloudflare Turnstile', value: 'Invisible captcha on signup AND login. Blocks ~99% of bot traffic with zero user friction.' },
      { label: 'Honeypot', value: 'Hidden trap field in the signup form. If filled (= bot), the signup is silently rejected.' },
      { label: 'Supabase rate limiting', value: 'Supabase limits auth attempts (5 req/min per IP by default) to block brute force.' },
    ],
  },
  {
    title: 'Zero broker access',
    icon: '◇',
    color: C.blueLight,
    items: [
      { label: 'Zero broker credentials', value: "Quantara connects to NO broker. We NEVER ask for your Rithmic, Tradovate, NinjaTrader, etc. password." },
      { label: 'Manual CSV import only', value: 'You manually export a CSV from your broker (Rithmic Performance or Dashboard) and drop it in /app/import-lab. You stay in full control.' },
      { label: 'No API key stored', value: 'No broker token is stored in the DB. The app has zero ability to trade on your behalf.' },
    ],
  },
  {
    title: 'Compliance & legal',
    icon: '◊',
    color: C.green,
    items: [
      { label: 'GDPR', value: 'Quantara Technologies LLC is GDPR-compliant. Data hosted in EU (Frankfurt). Right of access, rectification, deletion, portability available via contact@quantara.tech.' },
      { label: 'Cookies', value: 'No tracking cookies. Only functional cookies (Supabase session, prefs). See /legal/privacy#cookies.' },
      { label: 'Account deletion', value: 'On email request, your account + all data is deleted within 7 business days. No soft-delete: it\'s final.' },
    ],
  },
  {
    title: 'Best practices on your side',
    icon: '◉',
    color: C.amber,
    items: [
      { label: 'Strong password', value: 'Minimum 8 chars enforced. Recommendation: 12+ with mix of letters/numbers/symbols. Use a password manager (Bitwarden, 1Password).' },
      { label: '"Stay signed in"', value: 'Uncheck this option on a shared device so the session is wiped when the browser closes.' },
      { label: 'Verify your URL', value: "Quantara NEVER emails you asking for your password. Always check you're on quantara.tech (not a fake)." },
    ],
  },
]

const FACTS_FR = [
  { v: '100%', l: 'données isolées par RLS' },
  { v: '0', l: 'token broker stocké' },
  { v: 'EU', l: 'hébergement Frankfurt' },
  { v: 'TLS 1.3', l: 'chiffrement obligatoire' },
]

const FACTS_EN = [
  { v: '100%', l: 'data isolated by RLS' },
  { v: '0', l: 'broker token stored' },
  { v: 'EU', l: 'Frankfurt hosting' },
  { v: 'TLS 1.3', l: 'enforced encryption' },
]

export default function SecurityClient() {
  const t = useT()
  const { locale } = useLanguage()
  const SECTIONS = locale === 'en' ? SECTIONS_EN : SECTIONS_FR
  const FACTS = locale === 'en' ? FACTS_EN : FACTS_FR

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <PageHeader active="security" />

      <main style={{ flex: 1 }}>
        {/* HERO */}
        <section style={{ padding: '80px 24px 40px', textAlign: 'center', maxWidth: 880, margin: '0 auto' }}>
          <Reveal>
            <div style={{ fontSize: 11, color: C.green, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 18 }}>
              {t('pages.security.eyebrow')}
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', margin: 0, marginBottom: 18 }}>
              {t('pages.security.titleA')} <span style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.green})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('pages.security.titleB')}</span> {t('pages.security.titleC')}
            </h1>
            <p style={{ fontSize: 16, color: C.text2, lineHeight: 1.6, maxWidth: 700, margin: '0 auto' }}>
              {t('pages.security.subtitle')}
            </p>
          </Reveal>
        </section>

        {/* QUICK FACTS */}
        <section style={{ padding: '20px 24px 40px', maxWidth: 900, margin: '0 auto' }}>
          <Reveal>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
            }}>
              {FACTS.map(f => (
                <div key={f.l} style={{
                  padding: '18px 20px',
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: 28, fontWeight: 800, lineHeight: 1,
                    background: `linear-gradient(135deg, ${C.blue}, ${C.green})`,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    marginBottom: 8, letterSpacing: '-0.02em',
                    fontFamily: 'ui-monospace, monospace',
                  }}>{f.v}</div>
                  <div style={{
                    fontSize: 11, color: C.text3,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    fontWeight: 500,
                  }}>{f.l}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* SECTIONS */}
        <section style={{ padding: '20px 24px 60px', maxWidth: 900, margin: '0 auto' }}>
          {SECTIONS.map(section => (
            <Reveal key={section.title}>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{
                  fontSize: 18, fontWeight: 700,
                  margin: 0, marginBottom: 14,
                  display: 'flex', alignItems: 'center', gap: 10,
                  letterSpacing: '-0.01em',
                }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: `${section.color}1f`,
                    border: `1px solid ${section.color}55`,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, color: section.color, fontWeight: 700,
                  }}>{section.icon}</span>
                  {section.title}
                </h2>
                <div style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  overflow: 'hidden',
                }}>
                  {section.items.map((item, i) => (
                    <div key={i} style={{
                      padding: '14px 18px',
                      borderTop: i > 0 ? `1px solid ${C.border}` : 'none',
                    }}>
                      <div style={{
                        fontSize: 10, color: section.color,
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        fontWeight: 600, marginBottom: 6, fontFamily: 'ui-monospace, monospace',
                      }}>{item.label}</div>
                      <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.6 }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </section>

        {/* SIGNALER */}
        <section style={{ padding: '40px 24px 80px', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <div style={{
              padding: '28px 28px',
              background: C.surface,
              border: `1px solid ${C.border2}`,
              borderRadius: 14,
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, marginBottom: 12, letterSpacing: '-0.015em' }}>
                {t('pages.security.reportTitle')}
              </h2>
              <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, marginBottom: 20 }}>
                {t('pages.security.reportBodyBefore')} <a href="mailto:security@quantara.tech" style={{ color: C.blueLight, textDecoration: 'none', fontWeight: 600 }}>security@quantara.tech</a> {t('pages.security.reportBodyAfter')}
              </p>
              <a href="mailto:security@quantara.tech" style={{
                display: 'inline-block', padding: '11px 24px',
                fontSize: 13, fontWeight: 500, borderRadius: 8,
                background: C.text, color: '#0a0c10', textDecoration: 'none',
                boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset',
              }}>{t('pages.security.reportCta')}</a>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  )
}

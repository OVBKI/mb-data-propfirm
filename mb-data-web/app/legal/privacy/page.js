import PageHeader from '../../../components/PageHeader'
import Footer from '../../../components/Footer'
import Reveal from '../../../components/Reveal'

export const metadata = {
  title: 'Politique de Confidentialité — Quantara',
  description: 'Comment Quantara collecte, utilise et protège tes données personnelles. RGPD-compliant. Hébergement EU.',
}

const C = {
  bg: '#0d0f14',
  surface: '#141720',
  surface2: '#1c2030',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.13)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
  amber: '#fac775',
}

// Privacy Policy — RGPD-compliant
// Couvre : données collectées, finalité, base légale, durée conservation, droits user, cookies, sous-traitants
const SECTIONS = [
  {
    title: '1. Données collectées',
    body: `Quantara collecte uniquement les données strictement nécessaires au fonctionnement du service :

• **Données d'inscription** : adresse email (obligatoire), mot de passe (hashé bcrypt côté Supabase), pseudo et nom affiché (optionnels).
• **Données de profil** : bio, pays, style de trading, instruments préférés (tous optionnels, fournis volontairement).
• **Données métier** : firmes ajoutées, comptes (taille, plan, drawdown, dates), trades manuels ou importés, payouts, notes personnelles, screenshots.
• **Données techniques** : timestamp de connexion, IP (uniquement pour rate-limit anti-bot, non stockée durablement).

Quantara ne collecte AUCUNE donnée bancaire, AUCUN token broker, AUCUNE donnée de tracking publicitaire.`,
  },
  {
    title: '2. Finalité du traitement',
    body: `Les données sont utilisées exclusivement pour :

• Fournir le service de journal de trading (afficher tes trades, calculer tes stats, tracker tes drawdowns).
• Authentification et sécurité (login, captcha, RLS).
• Communication transactionnelle si activée (confirmation email signup, reset password, notifications optionnelles).
• Amélioration continue du produit (sans tracking individuel — uniquement agrégations anonymes).

Quantara ne profile JAMAIS les utilisateurs à des fins publicitaires. Aucune donnée n'est vendue ni partagée avec des tiers commerciaux.`,
  },
  {
    title: '3. Base légale (RGPD article 6)',
    body: `Le traitement de tes données repose sur :

• **Exécution du contrat** (article 6.1.b) pour les données nécessaires au service (compte, trades, etc.).
• **Consentement explicite** (article 6.1.a) pour les options facultatives (profil public, notifications push, partage social futur).
• **Intérêt légitime** (article 6.1.f) pour la sécurité (logs anti-bot, captcha).`,
  },
  {
    title: '4. Durée de conservation',
    body: `Tes données sont conservées tant que ton compte est actif. Si tu supprimes ton compte :

• Suppression définitive sous 7 jours ouvrés via les contraintes Postgres ON DELETE CASCADE.
• Aucune copie de sauvegarde n'est conservée au-delà des cycles de backup Supabase (30 jours max, rotation automatique).
• Les emails envoyés (welcome, recap) restent dans les logs Supabase 90 jours puis purgés.

Pas de soft-delete : c'est une suppression dure.`,
  },
  {
    title: '5. Tes droits RGPD',
    body: `En tant qu'utilisateur EU, tu disposes des droits suivants — exerçables par email à contact@quantara.tech (réponse sous 30 jours max) :

• **Droit d'accès** : recevoir une copie de toutes tes données (export JSON/CSV).
• **Droit de rectification** : corriger toute donnée inexacte (modifiable directement dans /app/profile pour la plupart).
• **Droit à l'effacement** ("droit à l'oubli") : suppression complète de ton compte et données associées.
• **Droit à la portabilité** : recevoir tes données dans un format structuré (JSON/CSV) pour les migrer ailleurs.
• **Droit d'opposition** : t'opposer à un traitement spécifique (ex: notifications).
• **Droit de réclamation auprès de la CNIL** (France) ou de ton autorité nationale équivalente.`,
  },
  {
    title: '6. Sous-traitants',
    body: `Pour fonctionner, Quantara s'appuie sur les sous-traitants suivants (tous conformes RGPD, Data Processing Agreements en place) :

• **Supabase** (États-Unis, instance Frankfurt EU) — hébergement DB, authentification.
• **Vercel** (États-Unis, edge Frankfurt EU) — hébergement frontend.
• **Cloudflare** (États-Unis, points présence mondiaux) — Turnstile captcha anti-bot.
• **exchangerate-api.com** — taux de change devises (aucune donnée user envoyée).
• **Finnhub** — calendrier économique (aucune donnée user envoyée).
• **Resend** (futur) — emails transactionnels.

Aucun de ces tiers n'a accès à tes trades ou données personnelles à des fins propres.`,
  },
  {
    title: '7. Sécurité',
    body: `Tes données sont protégées par :

• **Chiffrement en transit** : TLS 1.3 obligatoire sur tous les endpoints.
• **Chiffrement au repos** : disques chiffrés AES-256 côté Supabase et Vercel.
• **Row Level Security (RLS)** : isolation stricte par utilisateur au niveau base de données.
• **Hachage mot de passe** : bcrypt avec coût adapté côté Supabase Auth.
• **Captcha Turnstile** : protection bots sur signup/login.

Voir page /security pour le détail technique complet.`,
  },
  {
    title: '8. Transferts hors UE',
    body: `L'hébergement principal est en EU (Frankfurt). Certains sous-traitants (Vercel, Supabase, Cloudflare) sont des sociétés américaines. Les transferts éventuels sont encadrés par les Clauses Contractuelles Types (CCT) approuvées par la Commission Européenne. Aucune donnée n'est transférée vers des pays non-adéquats sans garanties appropriées.`,
  },
  {
    title: '9. Mineurs',
    body: `Quantara est réservé aux personnes majeures (18 ans+) capables juridiquement de signer un contrat. Si nous découvrons qu'un compte appartient à un mineur, il sera supprimé. Le trading PropFirm est lui-même réservé aux majeurs par les firmes elles-mêmes.`,
  },
  {
    title: '10. Modifications',
    body: `Cette politique peut évoluer. Les modifications matérielles seront notifiées par email aux utilisateurs actifs au moins 30 jours avant entrée en vigueur. La version courante est toujours disponible sur cette page avec date de mise à jour.`,
  },
]

// === COOKIES (section dédiée à /legal/privacy#cookies) ===
const COOKIES = [
  {
    type: 'Essentiels',
    color: C.green,
    purpose: 'Authentification & sécurité',
    items: [
      { name: 'sb-access-token', desc: 'Token JWT Supabase (auth)', duration: 'Session ou 30 jours selon "Rester connecté"' },
      { name: 'sb-refresh-token', desc: 'Refresh token Supabase', duration: 'Session ou 30 jours' },
      { name: 'quantara_persist_session', desc: 'Préférence "Rester connecté"', duration: 'Persistant (localStorage)' },
      { name: 'cf-turnstile-*', desc: 'Captcha anti-bot Cloudflare', duration: 'Session' },
    ],
  },
  {
    type: 'Fonctionnels',
    color: C.blueLight,
    purpose: 'Préférences utilisateur',
    items: [
      { name: 'quantara_currency', desc: 'Devise affichée (USD/EUR)', duration: 'Persistant' },
      { name: 'quantara_lang', desc: 'Langue (FR/EN à venir)', duration: 'Persistant' },
      { name: 'quantara_calendar_lang', desc: 'Langue calendrier éco', duration: 'Persistant' },
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <PageHeader />

      <main style={{ flex: 1 }}>
        {/* HERO */}
        <section style={{ padding: '80px 24px 40px', textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
          <Reveal>
            <div style={{ fontSize: 11, color: C.green, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 18 }}>
              Légal · RGPD
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0, marginBottom: 14 }}>
              Politique de Confidentialité
            </h1>
            <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6 }}>
              Version 1.1 · Mise à jour mai 2026 · Hébergement EU (Frankfurt) · RGPD-compliant
            </p>
          </Reveal>
        </section>

        {/* SECTIONS */}
        <section style={{ padding: '0 24px 60px', maxWidth: 820, margin: '0 auto' }}>
          {SECTIONS.map((s, i) => (
            <Reveal key={i}>
              <div style={{
                marginBottom: 16,
                padding: '22px 26px',
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
              }}>
                <h2 style={{
                  fontSize: 15, fontWeight: 700,
                  color: C.text, margin: 0, marginBottom: 10,
                  letterSpacing: '-0.01em',
                }}>
                  {s.title}
                </h2>
                <p style={{
                  fontSize: 13, color: C.text2, lineHeight: 1.7,
                  margin: 0, whiteSpace: 'pre-line',
                }}>
                  {s.body}
                </p>
              </div>
            </Reveal>
          ))}
        </section>

        {/* COOKIES SECTION */}
        <section id="cookies" style={{ padding: '40px 24px 60px', maxWidth: 820, margin: '0 auto', borderTop: `1px solid ${C.border}` }}>
          <Reveal>
            <div style={{ paddingTop: 40, marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: C.amber, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
                Cookies
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 8, letterSpacing: '-0.015em' }}>
                Quels cookies on utilise
              </h2>
              <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, margin: 0 }}>
                <strong style={{ color: C.green }}>Aucun cookie de tracking publicitaire.</strong> Uniquement des cookies fonctionnels essentiels au service. Pas de Google Analytics, pas de Facebook Pixel, pas de tracking cross-site.
              </p>
            </div>

            {COOKIES.map(cat => (
              <div key={cat.type} style={{ marginBottom: 20 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 10,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: cat.color,
                  }} />
                  <h3 style={{
                    fontSize: 14, fontWeight: 700, margin: 0,
                    color: cat.color, letterSpacing: '-0.01em',
                  }}>
                    {cat.type}
                  </h3>
                  <span style={{ fontSize: 11, color: C.text3 }}>· {cat.purpose}</span>
                </div>
                <div style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10, overflow: 'hidden',
                }}>
                  {cat.items.map((c, i) => (
                    <div key={i} style={{
                      padding: '10px 16px',
                      borderTop: i > 0 ? `1px solid ${C.border}` : 'none',
                      display: 'grid',
                      gridTemplateColumns: '180px 1fr 180px',
                      gap: 12, alignItems: 'center',
                      fontSize: 12,
                    }}>
                      <code style={{
                        color: C.blueLight, fontFamily: 'ui-monospace, monospace',
                        fontSize: 11, fontWeight: 600,
                      }}>{c.name}</code>
                      <span style={{ color: C.text2 }}>{c.desc}</span>
                      <span style={{
                        color: C.text3, textAlign: 'right',
                        fontFamily: 'ui-monospace, monospace', fontSize: 10,
                      }}>{c.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div style={{
              marginTop: 18, padding: 14,
              background: 'rgba(45,111,255,0.04)',
              border: '1px solid rgba(45,111,255,0.20)',
              borderRadius: 10,
              fontSize: 12, color: C.text2, lineHeight: 1.6,
            }}>
              <strong style={{ color: C.blueLight }}>Pas de bannière cookies sur Quantara ?</strong> Correct : tous nos cookies sont strictement nécessaires au fonctionnement du service (auth + préférences user). Aucun consentement requis selon la directive ePrivacy + RGPD pour ce type de cookies.
            </div>
          </Reveal>
        </section>

        {/* CONTACT */}
        <section style={{ padding: '40px 24px 80px', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, marginBottom: 12, letterSpacing: '-0.015em' }}>
              Une question sur tes données ?
            </h2>
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, marginBottom: 18 }}>
              Pour exercer tes droits RGPD ou poser une question : <a href="mailto:contact@quantara.tech" style={{ color: C.blueLight, textDecoration: 'none' }}>contact@quantara.tech</a>. Réponse sous 30 jours max.
            </p>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  )
}

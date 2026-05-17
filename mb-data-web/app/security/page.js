import PageHeader from '../../components/PageHeader'
import Footer from '../../components/Footer'
import Reveal from '../../components/Reveal'

export const metadata = {
  title: 'Sécurité — Quantara',
  description: 'Comment Quantara protège tes données de trading : chiffrement TLS, RLS Supabase, hébergement EU, RGPD, contact responsible disclosure.',
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

const SECTIONS = [
  {
    icon: '🔐',
    title: 'Chiffrement de bout en bout',
    items: [
      { label: 'TLS 1.3', desc: 'Toutes les communications entre ton navigateur et nos serveurs sont chiffrées en TLS 1.3 (HSTS forcé sur quantara.tech).' },
      { label: 'Données au repos', desc: 'PostgreSQL Supabase chiffre les données en AES-256 au repos. Les snapshots de backup sont également chiffrés.' },
      { label: 'Mots de passe', desc: 'Tes credentials Quantara sont hashés via bcrypt côté Supabase. On ne stocke jamais le mot de passe en clair, même temporairement.' },
    ],
  },
  {
    icon: '🛡️',
    title: 'Isolation des données par utilisateur',
    items: [
      { label: 'Row Level Security (RLS)', desc: 'Toutes les tables (firms, accounts, payouts, journal_entries, certificates) sont protégées par des policies PostgreSQL qui empêchent un utilisateur d\'accéder aux données d\'un autre, même via SQL injection.' },
      { label: 'JWT signés', desc: 'L\'authentification utilise des JWT signés HMAC-SHA256 avec rotation auto. Aucune session n\'est partagée entre utilisateurs.' },
      { label: 'Buckets Storage', desc: 'Les screenshots de trades et les diplômes sont stockés dans des dossiers nommés `userId/...`. Les RLS policies du Storage empêchent un user de supprimer/modifier les fichiers d\'un autre.' },
    ],
  },
  {
    icon: '🔑',
    title: 'API keys brokers — gestion sensible',
    items: [
      { label: 'Aucun mot de passe broker stocké', desc: 'Pour l\'intégration ProjectX (Topstep, TPT, MFFU, Tradeify), Quantara utilise des API keys génériques côté Supabase Edge Functions, jamais des username/password broker.' },
      { label: 'Tokens jetables', desc: 'Les sessions broker sont des access tokens à durée de vie courte (1h-24h). Ils sont stockés en mémoire serveur uniquement, jamais persistés en DB.' },
      { label: 'HTTPS forcé', desc: 'Tous les appels API broker passent par notre proxy Vercel en HTTPS. Aucune communication en clair.' },
    ],
  },
  {
    icon: '🇪🇺',
    title: 'Hébergement & conformité',
    items: [
      { label: 'Hébergement EU', desc: 'Frontend Vercel (Paris/Frankfurt). Base de données Supabase (Frankfurt). Aucune donnée ne quitte l\'UE pour le tracking principal.' },
      { label: 'RGPD compliant', desc: 'Tu peux exporter toutes tes données (CSV) depuis le journal et le dashboard. Suppression de compte sur demande à contact@quantara.tech sous 30 jours max.' },
      { label: 'Pas de tracking publicitaire', desc: 'Aucun Google Analytics, Facebook Pixel, ou tracker tiers. Quantara n\'a pas de modèle ads — tes données ne sont jamais vendues.' },
    ],
  },
  {
    icon: '💾',
    title: 'Sauvegardes & disponibilité',
    items: [
      { label: 'Backup quotidien', desc: 'Supabase effectue un snapshot quotidien de la base, conservé 7 jours (plan gratuit) ou 30 jours (production payante).' },
      { label: 'Réplication', desc: 'PostgreSQL Supabase est répliqué sur plusieurs nœuds en EU pour garantir la haute disponibilité.' },
      { label: 'Statut système', desc: 'Tu peux voir l\'état des services Vercel et Supabase en temps réel sur leurs status pages publiques.' },
    ],
  },
  {
    icon: '🐛',
    title: 'Responsible disclosure',
    items: [
      { label: 'Tu as trouvé une faille ?', desc: 'Envoie un mail à security@quantara.tech avec une description détaillée. Réponse sous 48h ouvrées garantie. On apprécie les chercheurs en sécurité — pas de poursuites tant que tu respectes la disclosure responsable (pas d\'exfiltration de données, pas de DoS, etc.).' },
      { label: 'Hall of Fame', desc: 'Les chercheurs qui nous signalent des vulnérabilités valides sont listés (avec leur accord) sur cette page. Aucune récompense monétaire pour l\'instant (Quantara est en beta).' },
    ],
  },
]

export default function SecurityPage() {
  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PageHeader active="security" />

      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="lp-halo-animated" style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse 70% 50% at 50% 0%, rgba(29,184,122,0.12), transparent 60%)`,
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '72px 24px 40px', textAlign: 'center', position: 'relative' }}>
          <div style={{
            fontSize: 11, color: C.green, letterSpacing: '0.16em',
            marginBottom: 20, textTransform: 'uppercase', fontWeight: 600,
          }}>
            Sécurité
          </div>
          <h1 className="lp-h1" style={{
            fontSize: 'clamp(32px, 5.5vw, 52px)', fontWeight: 700, lineHeight: 1.05,
            marginBottom: 16, letterSpacing: '-0.025em',
          }}>
            Tes <span className="lp-gradient-text">données de trading</span><br />
            méritent une vraie sécurité.
          </h1>
          <p style={{
            fontSize: 16, color: C.text2,
            maxWidth: 640, margin: '0 auto', lineHeight: 1.5,
          }}>
            Quantara stocke tes performances, tes payouts, tes captures de challenge.
            Voici concrètement comment on les protège — sans bullshit marketing.
          </p>
        </div>
      </section>

      {/* Sections */}
      <section style={{ padding: '40px 24px 80px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {SECTIONS.map((section, i) => (
            <Reveal key={section.title} delay={i * 80}>
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 14, padding: 28, marginBottom: 18,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: 'rgba(45,111,255,0.10)', border: `1px solid rgba(45,111,255,0.25)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                  }}>{section.icon}</div>
                  <h2 style={{ fontSize: 18, fontWeight: 700 }}>{section.title}</h2>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {section.items.map(item => (
                    <li key={item.label} style={{
                      display: 'flex', gap: 14, paddingLeft: 56,
                      borderLeft: `2px solid ${C.border}`,
                      marginLeft: 22, paddingTop: 4, paddingBottom: 4,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.55 }}>{item.desc}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}

          {/* Contact box */}
          <Reveal delay={SECTIONS.length * 80 + 40}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(45,111,255,0.08), rgba(29,184,122,0.05))',
              border: `1px solid ${C.border2}`,
              borderRadius: 14, padding: 28, marginTop: 24,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Une question sur la sécurité ?</h3>
              <p style={{ fontSize: 14, color: C.text2, marginBottom: 18, maxWidth: 520, margin: '0 auto 18px', lineHeight: 1.5 }}>
                Pour toute question sécurité, divulgation de vulnérabilité, ou demande d'export/suppression RGPD,
                contacte-nous directement.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="mailto:security@quantara.tech" style={{
                  display: 'inline-block', padding: '10px 20px',
                  fontSize: 13, fontWeight: 600, borderRadius: 99,
                  background: `linear-gradient(135deg, ${C.blue} 0%, ${C.blueLight} 100%)`,
                  color: '#fff', textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(45,111,255,0.35)',
                }}>security@quantara.tech</a>
                <a href="mailto:contact@quantara.tech?subject=Demande%20RGPD" style={{
                  display: 'inline-block', padding: '10px 20px',
                  fontSize: 13, fontWeight: 600, borderRadius: 99,
                  background: 'transparent', color: C.text,
                  border: `1px solid ${C.border2}`,
                  textDecoration: 'none',
                }}>Demande RGPD</a>
              </div>
            </div>
          </Reveal>

          {/* Last updated */}
          <div style={{ textAlign: 'center', marginTop: 28, fontSize: 11, color: C.text3 }}>
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

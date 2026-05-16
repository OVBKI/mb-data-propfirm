'use client'
import { useState } from 'react'
import PageHeader from '../../components/PageHeader'
import Footer from '../../components/Footer'
import Reveal from '../../components/Reveal'

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
    id: 'getting-started',
    title: '🚀 Démarrage rapide',
    icon: '🚀',
    items: [
      { q: 'Comment créer mon premier compte PropFirm ?', a: 'Va dans le Tableau de bord → Clique "+ Ajouter PropFirm" → choisis ta firme dans la liste (Topstep, Lucid, Apex...) ou tape un nom custom → ajoute ton premier compte avec sa taille (50K, 100K...). Les règles (drawdown, profit target, jours min) sont auto-remplies.' },
      { q: 'Quelles devises sont supportées ?', a: 'USD, EUR, GBP, CHF. Les conversions sont faites automatiquement via exchangerate-api.com. Tu peux switcher entre USD natif et EUR sur le dashboard avec le toggle en haut à droite.' },
      { q: 'Faut-il une carte bancaire pour s\'inscrire ?', a: 'Non. Quantara est gratuit pendant la beta — pas de CB demandée.' },
    ],
  },
  {
    id: 'journal',
    title: '📔 Journal de trading',
    icon: '📔',
    items: [
      { q: 'Comment saisir un trade ?', a: 'Journal de trading → "+ Ajouter trade" (en haut à droite ou sur chaque card de compte). Saisis date, PnL, instrument optionnel. Tu peux ajouter aussi prix d\'entrée/sortie, SL/TP, et un screenshot du graphique.' },
      { q: 'Pourquoi ma balance ne reset pas quand je passe en Financé ?', a: 'Quantara reset la balance automatiquement quand tu changes le statut d\'un compte de Challenge → Financé. Tu peux aussi le faire manuellement avec le bouton "↻ Reset balance" sur la card du compte. Si rien ne se passe, vérifie que la colonne `funded_date` existe dans Supabase.' },
      { q: 'C\'est quoi "Jours validés" ?', a: 'C\'est le nombre de jours dont le PnL net atteint le seuil minimum requis par la PropFirm pour valider un jour de trading (ex: Lucid demande $150 minimum/jour). Différent du simple compteur de jours tradés.' },
      { q: 'Comment fonctionne la consistency ?', a: 'C\'est le ratio meilleur jour ÷ total des gains positifs. Plus c\'est bas, mieux c\'est. La plupart des PropFirms exigent ≤ 30-50% pour valider les payouts. Quantara la calcule automatiquement à partir de tes trades.' },
    ],
  },
  {
    id: 'payouts',
    title: '💰 Payouts & profit split',
    icon: '💰',
    items: [
      { q: 'Quel montant je dois entrer dans un payout ?', a: 'Le montant NET que tu reçois sur ton compte bancaire (après le profit split). Quantara calcule automatiquement le montant brut (= net / split%) pour le déduire de ta balance simulée. Ex: tu reçois $1,800 sur Lucid 90/10 → balance descend de $2,000.' },
      { q: 'Pourquoi ma balance descend de plus que ce que j\'ai reçu ?', a: 'Parce que Quantara déduit le montant BRUT (ce qui sort vraiment du compte funded), pas le net (ce que tu touches). Le différentiel est la part de la PropFirm. C\'est cohérent avec ce qui se passe sur ton compte chez la firme.' },
      { q: 'Comment Quantara connaît mon profit split ?', a: 'Il est défini dans les règles de la firme (ex: Lucid = 90% trader, Apex = 100% premiers $25K puis 90/10). Voir la page Règles dans l\'app pour la liste complète.' },
    ],
  },
  {
    id: 'rules',
    title: '📜 Règles PropFirms',
    icon: '📜',
    items: [
      { q: 'Quelles PropFirms sont supportées ?', a: '8+ firmes pré-configurées : Topstep, Apex Trader Funding, Bulenox, Lucid Trading, Tradeify, Take Profit Trader, My Funded Futures, Phidias Propfirm, Funded Futures Network, FuturesElite. Voir /integrations pour la liste complète et le statut.' },
      { q: 'Mes règles ne sont pas à jour, c\'est normal ?', a: 'Les PropFirms changent leurs règles régulièrement. Quantara fait au mieux pour rester à jour. Si tu vois une incohérence, tu peux toujours modifier les règles d\'un compte individuel (objectif payout, drawdown, jours min, profit min jour) directement dans le formulaire de création/édition. Sinon, signale-le à contact@quantara.tech.' },
      { q: 'Que veut dire "Drawdown trailing" ?', a: 'Le drawdown trailing suit la balance peak du compte (s\'élève quand tu gagnes), puis se "fige" généralement au balance initial (50K, 100K...) une fois que tu as atteint le seuil profit target. C\'est plus permissif qu\'un drawdown statique fixe.' },
    ],
  },
  {
    id: 'calendar',
    title: '📅 Calendrier économique',
    icon: '📅',
    items: [
      { q: 'D\'où viennent les annonces ?', a: 'Les données proviennent de Finnhub (anciennement ForexFactory). Mises à jour toutes les minutes. Heures affichées en Paris (CET/CEST).' },
      { q: 'Pourquoi je ne vois pas certains pays ?', a: 'Le calendrier filtre par devise (USD, EUR, GBP, JPY...). Va sur le bouton "🌍 Devises" pour cocher/décocher les devises affichées. Les events Tier-1 (NFP, FOMC, CPI) sont les plus importants pour les futures.' },
      { q: 'Combien de fois par jour le calendrier se rafraîchit ?', a: 'Auto-refresh toutes les 60 secondes. Tu peux aussi cliquer "↻ Actualiser" pour forcer.' },
    ],
  },
  {
    id: 'data-privacy',
    title: '🔐 Données & vie privée',
    icon: '🔐',
    items: [
      { q: 'Mes données sont-elles vendues ?', a: 'Non. Jamais. Quantara n\'a pas de modèle ads. Voir /security pour les détails techniques.' },
      { q: 'Comment exporter mes données ?', a: 'Bouton "↓ CSV" en haut du Journal et du Tableau de bord. Tout est exportable en clair.' },
      { q: 'Comment supprimer mon compte ?', a: 'Envoie un mail à contact@quantara.tech avec ton adresse email d\'inscription. Suppression sous 30 jours max conformément au RGPD.' },
    ],
  },
  {
    id: 'roadmap',
    title: '🗺️ Roadmap',
    icon: '🗺️',
    items: [
      { q: 'Q3 2026', a: 'Intégration ProjectX complète (Topstep, Tradeify, TPT, MFFU) — sync auto des trades. Notifications push avant les annonces éco Tier-1.' },
      { q: 'Q4 2026', a: 'Mode mobile natif (PWA installable). Comparateur PropFirms en live (prix challenges, payouts, drawdowns). Discord communauté.' },
      { q: 'Plus tard', a: 'API publique Quantara (lecture seule). Intégration Rithmic / CQG / Tradovate native. Plan team pour les firmes/communautés. Multi-langues complet (EN/ES).' },
    ],
  },
]

function FAQItem({ item, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{
      background: C.surface2, borderRadius: 10, marginBottom: 8,
      border: `1px solid ${open ? C.border2 : C.border}`,
      transition: 'border 0.15s',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '14px 18px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: C.text, fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
          textAlign: 'left', gap: 14,
        }}
      >
        <span>{item.q}</span>
        <span style={{
          fontSize: 18, color: C.text3,
          transform: open ? 'rotate(45deg)' : 'rotate(0)',
          transition: 'transform 0.2s',
          flexShrink: 0,
        }}>+</span>
      </button>
      {open && (
        <div style={{
          padding: '0 18px 16px',
          fontSize: 13, color: C.text2, lineHeight: 1.6,
        }}>{item.a}</div>
      )}
    </div>
  )
}

export default function DocsPage() {
  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PageHeader active="docs" />

      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="lp-halo-animated" style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse 70% 50% at 50% 0%, rgba(77,143,255,0.12), transparent 60%)`,
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '72px 24px 32px', textAlign: 'center', position: 'relative' }}>
          <div style={{
            fontSize: 11, color: C.blueLight, letterSpacing: '0.16em',
            marginBottom: 20, textTransform: 'uppercase', fontWeight: 600,
          }}>
            Documentation
          </div>
          <h1 className="lp-h1" style={{
            fontSize: 'clamp(32px, 5.5vw, 52px)', fontWeight: 700, lineHeight: 1.05,
            marginBottom: 16, letterSpacing: '-0.025em',
          }}>
            Tout ce qu'il faut savoir<br />
            sur <span className="lp-gradient-text">Quantara</span>
          </h1>
          <p style={{
            fontSize: 15, color: C.text2,
            maxWidth: 600, margin: '0 auto', lineHeight: 1.5,
          }}>
            Setup, fonctionnalités, FAQ, roadmap — tout est ici. Si tu ne trouves pas
            ta réponse, écris-nous à contact@quantara.tech.
          </p>
        </div>
      </section>

      {/* Grid : sidebar nav + content */}
      <section style={{ padding: '20px 24px 80px' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'minmax(0, 220px) minmax(0, 1fr)',
          gap: 32, alignItems: 'start',
        }} className="docs-grid">
          {/* Sidebar nav */}
          <aside style={{
            position: 'sticky', top: 92,
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: 14,
          }} className="docs-sidebar">
            <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10, padding: '0 8px' }}>
              Sections
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {SECTIONS.map(s => (
                <a key={s.id} href={`#${s.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', borderRadius: 8,
                  fontSize: 12, color: C.text2, textDecoration: 'none',
                  transition: 'background 0.15s, color 0.15s',
                }}>
                  <span style={{ fontSize: 14 }}>{s.icon}</span>
                  <span>{s.title.replace(/^[^\s]+\s/, '')}</span>
                </a>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div>
            {SECTIONS.map((section, sIdx) => (
              <Reveal key={section.id} delay={sIdx * 60}>
                <div id={section.id} style={{ marginBottom: 36, scrollMarginTop: 88 }}>
                  <h2 style={{
                    fontSize: 20, fontWeight: 700, marginBottom: 14,
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    {section.title}
                  </h2>
                  {section.id === 'faq' && (
                    <p style={{ fontSize: 13, color: C.text2, marginBottom: 14 }}>
                      Questions les plus fréquentes posées par les utilisateurs Quantara.
                    </p>
                  )}
                  {section.items.map((item, i) => (
                    <FAQItem key={i} item={item} defaultOpen={sIdx === 0 && i === 0} />
                  ))}
                </div>
              </Reveal>
            ))}

            {/* Contact box */}
            <Reveal delay={SECTIONS.length * 60}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(45,111,255,0.08), rgba(29,184,122,0.05))',
                border: `1px solid ${C.border2}`,
                borderRadius: 14, padding: 28, marginTop: 24,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Tu n'as pas trouvé ta réponse ?</h3>
                <p style={{ fontSize: 13, color: C.text2, marginBottom: 18, maxWidth: 480, margin: '0 auto 18px', lineHeight: 1.5 }}>
                  Écris-nous, on répond vite (généralement sous 24-48h ouvrées).
                </p>
                <a href="mailto:contact@quantara.tech" style={{
                  display: 'inline-block', padding: '10px 22px',
                  fontSize: 13, fontWeight: 600, borderRadius: 99,
                  background: `linear-gradient(135deg, ${C.blue} 0%, ${C.blueLight} 100%)`,
                  color: '#fff', textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(45,111,255,0.35)',
                }}>contact@quantara.tech</a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

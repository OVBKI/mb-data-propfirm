'use client'
import { useState } from 'react'
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
  red: '#e8504a',
}

// === SECTIONS DOCUMENTATION ===
// Pour le contenu détaillé FAQ + roadmap, on utilise un bloc locale-aware
// plutôt que d'éparpiller en clés i18n granulaires (option B du brief).

const SECTIONS_FR = [
  {
    id: 'getting-started',
    title: 'Démarrage rapide',
    items: [
      { q: 'Comment créer mon premier compte PropFirm ?', a: 'Tableau de bord → "+ Ajouter PropFirm" → choisis ta firme (Topstep, Lucid, Apex…) ou tape un nom custom → ajoute ton premier compte avec sa taille (50K, 100K…). Les règles (drawdown, profit target, jours min) sont auto-remplies.' },
      { q: 'Quelles devises sont supportées ?', a: 'USD, EUR, GBP, CHF. Les conversions sont faites automatiquement. Tu peux switcher entre USD natif et EUR depuis le toggle en haut à droite du dashboard.' },
      { q: 'Faut-il une carte bancaire pour s\'inscrire ?', a: 'Non. Quantara est gratuit pendant la beta — pas de CB demandée.' },
      { q: 'Je peux me connecter avec mon pseudo au lieu de mon email ?', a: 'Oui. Définis ton pseudo dans /app/profile → "Modifier le profil". Ensuite tu pourras te connecter avec ton pseudo OU ton email — au choix.' },
    ],
  },
  {
    id: 'import-csv',
    title: 'Import CSV Rithmic (nouveau)',
    items: [
      { q: 'Comment importer mes trades depuis Rithmic ?', a: 'Va dans /app/import-lab (depuis la sidebar SYNC). 2 onglets : (1) "État des comptes" — drag un export Trader Dashboard, ça crée les comptes auto avec balance/DD/status. (2) "Trades" — drag un export Performance Statement, ça ajoute les trades aux comptes existants.' },
      { q: 'Quel format CSV faut exporter depuis Rithmic ?', a: 'Dans R|Trader Pro → Performance → Export CSV (pour les trades détaillés). Dans Trader Dashboard → Export (pour balance/DD/status des comptes). Les 2 sont supportés par Quantara.' },
      { q: 'Où je vois mes trades importés ?', a: 'Dans /app/journal-sync — séparé du journal manuel pour pas mélanger. Tu y retrouves filtres firme/compte, calendrier PnL, courbes equity + DD, et historique tabulaire complet.' },
      { q: 'Et si je réimporte le même CSV plusieurs fois ?', a: 'Le système dédupplique automatiquement via un marker [rithmic:ENTRY_ID/EXIT_ID] dans les notes du trade. Aucun doublon créé.' },
      { q: 'Les trades importés se retrouvent dans le journal manuel ?', a: 'Non, ils sont strictement isolés. Journal manuel = comptes/trades saisis à la main. Journal Sync = comptes/trades importés depuis CSV. Les 2 ne se mélangent jamais.' },
    ],
  },
  {
    id: 'journal',
    title: 'Journal de trading manuel',
    items: [
      { q: 'Comment saisir un trade ?', a: 'Journal → "+ Ajouter trade" (en haut à droite ou sur chaque card de compte). Saisis date, PnL, instrument optionnel. Tu peux aussi ajouter prix d\'entrée/sortie, SL/TP, et un screenshot du graphique.' },
      { q: 'Pourquoi ma balance ne reset pas quand je passe en Financé ?', a: 'Quantara reset la balance automatiquement quand tu changes le statut d\'un compte de Challenge → Financé. Tu peux aussi le faire manuellement avec le bouton "↻ Reset balance" sur la card du compte.' },
      { q: 'C\'est quoi "Jours validés" ?', a: 'C\'est le nombre de jours dont le PnL net atteint le seuil minimum requis par la PropFirm pour valider un jour de trading (ex: Lucid demande $150 minimum/jour). Différent du simple compteur de jours tradés.' },
      { q: 'Comment fonctionne la consistency ?', a: 'C\'est le ratio meilleur jour ÷ total des gains positifs. Plus c\'est bas, mieux c\'est. La plupart des PropFirms exigent ≤ 30-50% pour valider les payouts. Quantara la calcule automatiquement.' },
    ],
  },
  {
    id: 'payouts',
    title: 'Payouts & profit split',
    items: [
      { q: 'Quel montant je dois entrer dans un payout ?', a: 'Le montant NET que tu reçois sur ton compte bancaire (après le profit split). Quantara calcule automatiquement le montant brut (= net / split%) pour le déduire de ta balance simulée. Ex : tu reçois $1,800 sur Lucid 90/10 → balance descend de $2,000.' },
      { q: 'Pourquoi ma balance descend de plus que ce que j\'ai reçu ?', a: 'Parce que Quantara déduit le montant BRUT (ce qui sort vraiment du compte funded), pas le net (ce que tu touches). Le différentiel est la part de la PropFirm. C\'est cohérent avec ce qui se passe sur ton compte chez la firme.' },
      { q: 'Comment Quantara connaît mon profit split ?', a: 'Il est défini dans les règles de la firme (ex : Lucid = 90% trader, Apex = 100% premier $25K puis 90/10). Voir la page Règles dans l\'app pour la liste complète.' },
    ],
  },
  {
    id: 'rules',
    title: 'Règles PropFirms',
    items: [
      { q: 'Quelles PropFirms sont supportées ?', a: '10 firmes pré-configurées : Topstep, Apex Trader Funding, Bulenox, Lucid Trading, Tradeify, Take Profit Trader, My Funded Futures, Phidias Propfirm, Funded Futures Network, FuturesElite. Voir /integrations pour le détail (statut sync CSV vs saisie manuelle).' },
      { q: 'Mes règles ne sont pas à jour, c\'est normal ?', a: 'Les PropFirms changent leurs règles régulièrement. Quantara fait au mieux pour rester à jour. Si tu vois une incohérence, tu peux toujours modifier les règles d\'un compte individuel directement dans le formulaire de création/édition. Sinon, signale-le à contact@quantara.tech.' },
      { q: 'Comment savoir si je suis dans les règles drawdown trailing ?', a: 'Le dashboard affiche pour chaque compte ta balance actuelle et le seuil DD calculé en temps réel. Les courbes equity dans le journal affichent la ligne DD trailing (statique, EOD ou intraday selon la firme).' },
    ],
  },
  {
    id: 'profile',
    title: 'Profil & social (nouveau)',
    items: [
      { q: 'À quoi sert la page Profil ?', a: '/app/profile permet de définir ton pseudo (pour login), nom affiché, bio, pays et style de trading. Affiche aussi tes stats publiques agrégées (payouts totaux, win rate, comptes funded, jours tradés).' },
      { q: 'C\'est quoi le toggle "profil public" ?', a: 'Si tu actives ça, ton profil sera visible par les autres traders (URL /u/[ton-pseudo]) — fonctionnalité en cours de développement. Tes trades détaillés et tes comptes individuels restent toujours privés.' },
      { q: 'Y aura-t-il un réseau social pour traders ?', a: 'Oui, c\'est en roadmap (T4 2026). Tu pourras publier tes trades, partager tes payouts, suivre d\'autres traders, et commenter leurs résultats. Le mur sera réservé aux profils publics.' },
    ],
  },
  {
    id: 'security',
    title: 'Sécurité & données',
    items: [
      { q: 'Mes données sont-elles privées ?', a: 'Oui. Quantara utilise les Row Level Security policies Supabase : chaque utilisateur ne voit/modifie QUE ses propres comptes, trades, payouts et profil. Hébergement EU (Vercel + Supabase Frankfurt).' },
      { q: 'Vous avez accès à mes APIs broker ?', a: 'Non. Quantara ne se connecte pas à ton broker. Tu importes manuellement (drag CSV) ou tu saisis à la main. On ne stocke aucun token/mot de passe broker.' },
      { q: 'Si je supprime mon compte, que devient mes données ?', a: 'Toutes tes données (firmes, comptes, trades, payouts, profil) sont supprimées en cascade via les contraintes Postgres ON DELETE CASCADE. Conservation : 0 jour après suppression.' },
      { q: 'Et le captcha ?', a: 'Cloudflare Turnstile sur signup/login pour bloquer les bots. Pas de tracking utilisateur.' },
    ],
  },
]

const SECTIONS_EN = [
  {
    id: 'getting-started',
    title: 'Quick start',
    items: [
      { q: 'How do I create my first PropFirm account?', a: 'Dashboard → "+ Add PropFirm" → pick your firm (Topstep, Lucid, Apex…) or type a custom name → add your first account with its size (50K, 100K…). Rules (drawdown, profit target, min days) are auto-filled.' },
      { q: 'Which currencies are supported?', a: 'USD, EUR, GBP, CHF. Conversions happen automatically. You can switch between native USD and EUR via the toggle at the top right of the dashboard.' },
      { q: 'Do I need a credit card to sign up?', a: 'No. Quantara is free during beta — no card required.' },
      { q: 'Can I log in with my username instead of email?', a: 'Yes. Set your username in /app/profile → "Edit profile". Then you can log in with username OR email — your choice.' },
    ],
  },
  {
    id: 'import-csv',
    title: 'Rithmic CSV import (new)',
    items: [
      { q: 'How do I import my trades from Rithmic?', a: 'Go to /app/import-lab (from the SYNC sidebar). Two tabs: (1) "Account state" — drag a Trader Dashboard export, accounts are auto-created with balance/DD/status. (2) "Trades" — drag a Performance Statement export to add trades to existing accounts.' },
      { q: 'Which CSV format should I export from Rithmic?', a: 'In R|Trader Pro → Performance → Export CSV (for detailed trades). In Trader Dashboard → Export (for account balance/DD/status). Both are supported.' },
      { q: 'Where do I see my imported trades?', a: 'In /app/journal-sync — separated from the manual journal to avoid mixing them. You\'ll find firm/account filters, PnL calendar, equity + DD curves, and full tabular history.' },
      { q: 'What if I re-import the same CSV multiple times?', a: 'The system automatically dedupes via a [rithmic:ENTRY_ID/EXIT_ID] marker in the trade notes. No duplicates created.' },
      { q: 'Do imported trades show up in the manual journal?', a: 'No, they are strictly isolated. Manual journal = manually entered accounts/trades. Sync journal = CSV-imported accounts/trades. The two never mix.' },
    ],
  },
  {
    id: 'journal',
    title: 'Manual trading journal',
    items: [
      { q: 'How do I log a trade?', a: 'Journal → "+ Add trade" (top right or on each account card). Enter date, PnL, optional instrument. You can also add entry/exit prices, SL/TP, and a chart screenshot.' },
      { q: "Why doesn't my balance reset when I move to Funded?", a: 'Quantara resets the balance automatically when you change an account status from Challenge → Funded. You can also do it manually with the "↻ Reset balance" button on the account card.' },
      { q: 'What are "Validated days"?', a: 'The number of days whose net PnL hits the minimum required by the PropFirm to count as a valid trading day (e.g. Lucid requires $150 min/day). Different from a simple traded-days counter.' },
      { q: 'How does consistency work?', a: "It's the ratio best-day ÷ total positive gains. Lower is better. Most PropFirms require ≤ 30-50% to validate payouts. Quantara computes it automatically.",
      },
    ],
  },
  {
    id: 'payouts',
    title: 'Payouts & profit split',
    items: [
      { q: 'What amount should I enter for a payout?', a: 'The NET amount you receive on your bank account (after the profit split). Quantara computes the gross amount automatically (= net / split%) to deduct from your simulated balance. E.g. you receive $1,800 on Lucid 90/10 → balance drops by $2,000.' },
      { q: 'Why does my balance drop by more than I received?', a: 'Because Quantara deducts the GROSS amount (what actually leaves the funded account), not the net (what you receive). The difference is the PropFirm\'s share. Consistent with what happens on your account at the firm.' },
      { q: 'How does Quantara know my profit split?', a: "It's defined in the firm rules (e.g. Lucid = 90% trader, Apex = 100% first $25K then 90/10). See the Rules page in the app for the full list.",
      },
    ],
  },
  {
    id: 'rules',
    title: 'PropFirm rules',
    items: [
      { q: 'Which PropFirms are supported?', a: '10 firms pre-configured: Topstep, Apex Trader Funding, Bulenox, Lucid Trading, Tradeify, Take Profit Trader, My Funded Futures, Phidias Propfirm, Funded Futures Network, FuturesElite. See /integrations for the details (CSV sync status vs manual entry).' },
      { q: 'My rules are out of date, is that normal?', a: 'PropFirms change their rules regularly. Quantara does its best to stay up to date. If you see an inconsistency, you can always edit the rules of an individual account directly in the create/edit form. Otherwise, report it to contact@quantara.tech.' },
      { q: 'How do I know if I\'m within the trailing drawdown rules?', a: 'The dashboard displays your current balance and the live-computed DD threshold for each account. Journal equity curves show the trailing DD line (static, EOD or intraday per firm).' },
    ],
  },
  {
    id: 'profile',
    title: 'Profile & social (new)',
    items: [
      { q: 'What is the Profile page for?', a: '/app/profile lets you set your username (for login), display name, bio, country and trading style. Also shows your aggregated public stats (total payouts, win rate, funded accounts, traded days).' },
      { q: 'What is the "public profile" toggle?', a: 'If enabled, your profile becomes visible to other traders (URL /u/[your-username]) — feature in development. Your detailed trades and individual accounts always stay private.' },
      { q: 'Will there be a social network for traders?', a: "Yes, on the roadmap (Q4 2026). You'll be able to post trades, share payouts, follow other traders, and comment on their results. The feed will be reserved for public profiles.",
      },
    ],
  },
  {
    id: 'security',
    title: 'Security & data',
    items: [
      { q: 'Is my data private?', a: 'Yes. Quantara uses Supabase Row Level Security policies: every user can ONLY see/modify their own accounts, trades, payouts and profile. EU hosting (Vercel + Supabase Frankfurt).' },
      { q: 'Do you have access to my broker APIs?', a: 'No. Quantara does not connect to your broker. You import manually (drag CSV) or enter by hand. We store no broker token/password.' },
      { q: 'If I delete my account, what happens to my data?', a: 'All your data (firms, accounts, trades, payouts, profile) is deleted in cascade via Postgres ON DELETE CASCADE. Retention: 0 days after deletion.' },
      { q: 'And the captcha?', a: 'Cloudflare Turnstile on signup/login to block bots. No user tracking.' },
    ],
  },
]

const ROADMAP_FR = [
  {
    quarter: 'Fait — Mai 2026',
    status: 'done',
    items: [
      'Import CSV Rithmic (Performance + Trader Dashboard)',
      'Journal Sync séparé du journal manuel',
      'Profil utilisateur + pseudo login',
      'Auto-mapping intelligent multi-stratégies',
      'Auto-renommage comptes (PRO 7, EVAL 17)',
      'Dédoublonnage trades via marker rithmic',
      'Détection auto comptes liquidés (badge 🔥)',
      'Calendrier PnL mensuel heatmap',
      'Courbes equity avec ligne DD trailing live',
    ],
  },
  {
    quarter: 'Q3 2026 (juil-sept)',
    status: 'next',
    items: [
      'Intégration API ProjectX (TopstepX, Tradeify, TPT, MFFU)',
      'Paywall Stripe + plans freemium/pro',
      'Affiliés PropFirm sur le comparateur',
      'Multi-langue : Anglais + Espagnol',
      'Emails transactionnels (welcome, recap mensuel)',
      'Mobile responsive complet (audit + fixes)',
      'Page profil publique /u/[pseudo]',
    ],
  },
  {
    quarter: 'Q4 2026 (oct-déc)',
    status: 'planned',
    items: [
      'AI Coach (analyse patterns trading + insights Claude)',
      'Réseau social actif : follows, posts, leaderboard',
      'Heatmaps avancées (par heure, instrument, session)',
      'Export PDF mensuel (utile impôts)',
      'Notifications push proactives (DD warning, payout dispo)',
      'Mood tracker par session',
      'Intégration Discord (rôle automatique selon stats)',
    ],
  },
  {
    quarter: '2027 et après',
    status: 'wishlist',
    items: [
      'API Rithmic directe (sans CSV)',
      'API Tradovate / NinjaTrader',
      'Cours et formations propfirm',
      'Application mobile native iOS/Android',
      'Marketplace de stratégies (anonymisées)',
    ],
  },
]

const ROADMAP_EN = [
  {
    quarter: 'Done — May 2026',
    status: 'done',
    items: [
      'Rithmic CSV import (Performance + Trader Dashboard)',
      'Sync journal separated from manual journal',
      'User profile + username login',
      'Smart multi-strategy auto-mapping',
      'Auto-rename accounts (PRO 7, EVAL 17)',
      'Trade dedup via rithmic marker',
      'Auto-detect liquidated accounts (🔥 badge)',
      'Monthly PnL heatmap calendar',
      'Equity curves with live trailing DD line',
    ],
  },
  {
    quarter: 'Q3 2026 (Jul-Sep)',
    status: 'next',
    items: [
      'ProjectX API integration (TopstepX, Tradeify, TPT, MFFU)',
      'Stripe paywall + freemium/pro plans',
      'PropFirm affiliates on the comparator',
      'Multi-language: English + Spanish',
      'Transactional emails (welcome, monthly recap)',
      'Full mobile responsive (audit + fixes)',
      'Public profile page /u/[username]',
    ],
  },
  {
    quarter: 'Q4 2026 (Oct-Dec)',
    status: 'planned',
    items: [
      'AI Coach (trading pattern analysis + Claude insights)',
      'Active social network: follows, posts, leaderboard',
      'Advanced heatmaps (by hour, instrument, session)',
      'Monthly PDF export (useful for taxes)',
      'Proactive push notifications (DD warning, payout available)',
      'Per-session mood tracker',
      'Discord integration (automatic role based on stats)',
    ],
  },
  {
    quarter: '2027 and beyond',
    status: 'wishlist',
    items: [
      'Direct Rithmic API (no CSV)',
      'Tradovate / NinjaTrader API',
      'Propfirm courses and training',
      'Native iOS/Android mobile app',
      'Strategy marketplace (anonymized)',
    ],
  },
]

function ChevronIcon({ open }) {
  return (
    <span style={{
      fontSize: 12, color: C.text3,
      transition: 'transform 0.2s ease',
      transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
      display: 'inline-block', flexShrink: 0,
    }}>›</span>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '14px 0', textAlign: 'left',
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          color: C.text, fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
        }}
      >
        <span style={{ flex: 1 }}>{q}</span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div style={{
          paddingBottom: 14, paddingRight: 28,
          fontSize: 13, color: C.text2, lineHeight: 1.65,
        }}>
          {a}
        </div>
      )}
    </div>
  )
}

export default function DocsClient() {
  const t = useT()
  const { locale } = useLanguage()
  const SECTIONS = locale === 'en' ? SECTIONS_EN : SECTIONS_FR
  const ROADMAP = locale === 'en' ? ROADMAP_EN : ROADMAP_FR
  const badges = t('pages.docs.statusBadges')

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <PageHeader active="docs" />

      <main style={{ flex: 1 }}>
        {/* HERO */}
        <section style={{ padding: '80px 24px 40px', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
          <Reveal>
            <div style={{ fontSize: 11, color: C.blueLight, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 18 }}>
              {t('pages.docs.eyebrow')}
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', margin: 0, marginBottom: 18 }}>
              {t('pages.docs.titleA')} <span style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.green})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('pages.docs.titleB')}</span>
            </h1>
            <p style={{ fontSize: 16, color: C.text2, lineHeight: 1.6 }}>
              {t('pages.docs.subtitle')}
            </p>
          </Reveal>
        </section>

        {/* TOC + FAQ */}
        <section id="faq" style={{ padding: '40px 24px 60px', maxWidth: 900, margin: '0 auto' }}>
          <Reveal>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 11, color: C.blueLight, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
                {t('pages.docs.faqEyebrow')}
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.015em' }}>
                {t('pages.docs.faqHeading')}
              </h2>
            </div>

            {SECTIONS.map(section => (
              <div key={section.id} id={section.id} style={{ marginBottom: 36 }}>
                <h3 style={{
                  fontSize: 15, fontWeight: 700,
                  color: C.blueLight, letterSpacing: '0.04em',
                  margin: 0, marginBottom: 12,
                  textTransform: 'uppercase',
                }}>
                  {section.title}
                </h3>
                <div style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: '0 18px',
                }}>
                  {section.items.map((item, i) => (
                    <FaqItem key={i} q={item.q} a={item.a} />
                  ))}
                </div>
              </div>
            ))}
          </Reveal>
        </section>

        {/* ROADMAP */}
        <section id="roadmap" style={{ padding: '40px 24px 80px', maxWidth: 900, margin: '0 auto', borderTop: `1px solid ${C.border}` }}>
          <Reveal>
            <div style={{ paddingTop: 40, marginBottom: 32 }}>
              <div style={{ fontSize: 11, color: C.green, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
                {t('pages.docs.roadmapEyebrow')}
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 700, margin: 0, marginBottom: 6, letterSpacing: '-0.015em' }}>
                {t('pages.docs.roadmapHeading')}
              </h2>
              <p style={{ fontSize: 13, color: C.text3, margin: 0 }}>
                {t('pages.docs.roadmapSub')}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {ROADMAP.map(q => {
                const tone = {
                  done:     { color: C.green,    bg: 'rgba(29,184,122,0.08)', border: 'rgba(29,184,122,0.30)', label: badges?.done || '✓' },
                  next:     { color: C.blueLight, bg: 'rgba(45,111,255,0.08)', border: 'rgba(45,111,255,0.30)', label: badges?.next || '⚡' },
                  planned:  { color: C.amber,   bg: 'rgba(250,199,117,0.08)', border: 'rgba(250,199,117,0.30)', label: badges?.planned || '📅' },
                  wishlist: { color: C.text3,   bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.10)', label: badges?.wishlist || '✨' },
                }[q.status]
                return (
                  <div key={q.quarter} style={{
                    padding: 20,
                    background: C.surface,
                    border: `1px solid ${tone.border}`,
                    borderRadius: 12,
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      marginBottom: 14, gap: 12, flexWrap: 'wrap',
                    }}>
                      <h3 style={{
                        fontSize: 16, fontWeight: 700, margin: 0,
                        color: tone.color, letterSpacing: '-0.01em',
                      }}>
                        {q.quarter}
                      </h3>
                      <span style={{
                        fontSize: 10, padding: '4px 10px',
                        background: tone.bg, color: tone.color,
                        border: `1px solid ${tone.border}`,
                        borderRadius: 6, fontWeight: 600,
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                      }}>{tone.label}</span>
                    </div>
                    <ul style={{
                      margin: 0, paddingLeft: 18,
                      fontSize: 13, color: C.text2, lineHeight: 1.85,
                    }}>
                      {q.items.map((item, i) => (
                        <li key={i} style={{ marginBottom: 2 }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </Reveal>
        </section>

        {/* CTA contact */}
        <section style={{ padding: '40px 24px 80px', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, marginBottom: 12, letterSpacing: '-0.015em' }}>
              {t('pages.docs.ctaTitle')}
            </h2>
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, marginBottom: 20 }}>
              {t('pages.docs.ctaBodyBefore')} <a href="mailto:contact@quantara.tech" style={{ color: C.blueLight, textDecoration: 'none' }}>contact@quantara.tech</a> {t('pages.docs.ctaBodyAfter')}
            </p>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  )
}

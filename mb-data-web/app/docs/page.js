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
  red: '#e8504a',
}

// === SECTIONS DOCUMENTATION ===
// FAQ organisée par thème pour qu'un visiteur trouve sa réponse rapidement.
// Mise à jour après l'ajout des features import-lab, journal-sync, profile,
// pseudo login (session mai 2026).
const SECTIONS = [
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

// === ROADMAP ===
// Updated mai 2026 après ajout import-lab + journal-sync + profile + pseudo + multi-langue prévu
const ROADMAP = [
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
      'Module crypto futures (Binance, Bybit)',
      'Cours et formations propfirm',
      'Application mobile native iOS/Android',
      'Marketplace de stratégies (anonymisées)',
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

export default function DocsPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <PageHeader active="docs" />

      <main style={{ flex: 1 }}>
        {/* HERO */}
        <section style={{ padding: '80px 24px 40px', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
          <Reveal>
            <div style={{ fontSize: 11, color: C.blueLight, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 18 }}>
              Documentation
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', margin: 0, marginBottom: 18 }}>
              Comment ça marche, <span style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.green})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>tout en clair</span>
            </h1>
            <p style={{ fontSize: 16, color: C.text2, lineHeight: 1.6 }}>
              Tout ce qu'il faut savoir pour démarrer, importer tes CSV, comprendre les calculs de drawdown trailing et payouts.
            </p>
          </Reveal>
        </section>

        {/* TOC + FAQ */}
        <section id="faq" style={{ padding: '40px 24px 60px', maxWidth: 900, margin: '0 auto' }}>
          <Reveal>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 11, color: C.blueLight, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
                FAQ
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.015em' }}>
                Questions fréquentes
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
                Roadmap
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 700, margin: 0, marginBottom: 6, letterSpacing: '-0.015em' }}>
                Ce qui est prévu
              </h2>
              <p style={{ fontSize: 13, color: C.text3, margin: 0 }}>
                Roadmap publique mise à jour mai 2026. Les features Q3 et après peuvent bouger selon priorités.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {ROADMAP.map(q => {
                const tone = {
                  done:     { color: C.green,  bg: 'rgba(29,184,122,0.08)', border: 'rgba(29,184,122,0.30)', label: '✓ Fait' },
                  next:     { color: C.blueLight, bg: 'rgba(45,111,255,0.08)', border: 'rgba(45,111,255,0.30)', label: '⚡ En cours' },
                  planned:  { color: C.amber,  bg: 'rgba(250,199,117,0.08)', border: 'rgba(250,199,117,0.30)', label: '📅 Planifié' },
                  wishlist: { color: C.text3,  bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.10)', label: '✨ Wishlist' },
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
              Une question pas dans la FAQ ?
            </h2>
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, marginBottom: 20 }}>
              Écris à <a href="mailto:contact@quantara.tech" style={{ color: C.blueLight, textDecoration: 'none' }}>contact@quantara.tech</a> ou rejoins le Discord (bientôt). Réponse sous 48h.
            </p>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  )
}

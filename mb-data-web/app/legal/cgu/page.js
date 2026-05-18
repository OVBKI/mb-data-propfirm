import PageHeader from '../../../components/PageHeader'
import Footer from '../../../components/Footer'
import Reveal from '../../../components/Reveal'

export const metadata = {
  title: 'Conditions Générales d\'Utilisation — Quantara',
  description: 'CGU de Quantara LLC : règles d\'utilisation du service de journal de trading PropFirm. Régies par le droit du Texas, USA.',
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
  red: '#e8504a',
}

// CGU — mai 2026, conformes pratique standard SaaS B2C
// Quantara LLC est une LLC Texane (US). Droit applicable Texas + clause arbitrage standard.
// Adaptable à un cabinet d'avocat plus tard pour version finale "investor-grade".
const SECTIONS = [
  {
    title: '1. Objet du service',
    body: `Quantara est un outil logiciel SaaS de journalisation et d'analyse de trading destiné aux traders sur les comptes PropFirm futures. Le service permet de tracker manuellement (ou via import CSV) ses comptes, trades, payouts et règles de drawdown. Quantara n'exécute aucun trade en votre nom, ne donne aucun conseil financier, et ne se substitue à aucune plateforme de trading.`,
  },
  {
    title: '2. Inscription & compte utilisateur',
    body: `L'accès au service nécessite la création d'un compte avec une adresse email valide et un mot de passe. Vous garantissez l'exactitude des informations fournies. Vous êtes seul(e) responsable de la confidentialité de vos identifiants. Tout accès non autorisé à votre compte doit être signalé à security@quantara.tech immédiatement. Un seul compte par personne physique est autorisé.`,
  },
  {
    title: '3. Tarification — Beta gratuite',
    body: `Pendant la phase beta (en cours mai 2026), le service est entièrement gratuit. Aucune carte bancaire requise. Quantara se réserve le droit d'introduire des tiers payants (plan Pro, plan Team) ultérieurement, avec un préavis email de 30 jours minimum aux utilisateurs concernés. Les fonctionnalités utilisées gratuitement pendant la beta resteront accessibles dans une formule "Free legacy" pour les utilisateurs déjà inscrits.`,
  },
  {
    title: '4. Usage acceptable',
    body: `Vous vous engagez à ne pas : (a) tenter d'accéder aux données d'autres utilisateurs, (b) utiliser des bots ou scrapers automatisés contre le service, (c) revendre ou redistribuer l'accès à votre compte, (d) utiliser le service pour des activités illégales (blanchiment, fraude, manipulation de marché). Toute violation entraîne suspension immédiate sans préavis ni remboursement.`,
  },
  {
    title: '5. Données utilisateur & propriété',
    body: `Vous restez propriétaire de toutes les données que vous saisissez ou importez (trades, comptes, notes, screenshots). Quantara possède une licence non-exclusive limitée pour stocker et traiter ces données dans le seul but de fournir le service. Vous pouvez à tout moment exporter (CSV) ou supprimer vos données. Aucune revente à des tiers.`,
  },
  {
    title: '6. Avertissement financier ⚠',
    body: `Quantara est un outil de journalisation, PAS un conseil financier ni d'investissement. Le trading de futures et de comptes PropFirm comporte des risques substantiels de perte de capital et n'est pas adapté à tous les investisseurs. Les performances passées affichées dans l'app ne préjugent pas des résultats futurs. Vous êtes seul(e) responsable de vos décisions de trading. Quantara LLC décline toute responsabilité pour les pertes financières subies suite à l'utilisation du service.`,
    danger: true,
  },
  {
    title: '7. Disponibilité du service',
    body: `Le service est fourni "tel quel" ("as-is") sans garantie d'uptime spécifique pendant la beta. Quantara s'efforce d'atteindre 99.5% de disponibilité mensuelle (mesurée sur status.quantara.tech) mais ne garantit pas de SLA. Des maintenances planifiées peuvent entraîner des interruptions ponctuelles annoncées 24h à l'avance via la bannière in-app.`,
  },
  {
    title: '8. Limitation de responsabilité',
    body: `Dans les limites maximales permises par la loi applicable, la responsabilité totale cumulée de Quantara LLC vis-à-vis d'un utilisateur ne pourra excéder le montant total payé par cet utilisateur au cours des 12 derniers mois (donc actuellement 0$ en phase beta). Quantara n'est pas responsable des pertes indirectes, immatérielles, ou de la perte de données résultant d'une utilisation contraire aux présentes CGU.`,
  },
  {
    title: '9. Résiliation',
    body: `Vous pouvez supprimer votre compte à tout moment en envoyant un email à contact@quantara.tech. Toutes vos données seront supprimées définitivement sous 7 jours ouvrés (cascade Postgres ON DELETE). Quantara peut également suspendre ou supprimer un compte en cas de violation de l'article 4 (Usage acceptable), sans remboursement ni préavis.`,
  },
  {
    title: '10. Droit de rétractation (14 jours)',
    body: `Conformément aux articles L221-18 et suivants du Code de la consommation français (et plus largement à la directive 2011/83/UE applicable dans l'EEE), les utilisateurs consommateurs résidant dans l'Union Européenne ou dans l'Espace Économique Européen bénéficient d'un droit de rétractation de 14 jours calendaires à compter de la souscription d'un abonnement payant à Quantara, sans avoir à justifier de motif ni à supporter de pénalité.

• **Bénéficiaires** : consommateurs (personnes physiques agissant à des fins non-professionnelles) résidant en UE/EEE.
• **Délai** : 14 jours calendaires à compter de la date de souscription de l'abonnement payant.
• **Modalités d'exercice** : envoyer un email à contact@quantara.tech avec la mention claire « demande de rétractation », en précisant votre adresse email de compte et la date de souscription. Un modèle de formulaire de rétractation peut être fourni sur simple demande.
• **Remboursement** : en cas de rétractation valide, Quantara LLC procédera au remboursement intégral des sommes versées sous 14 jours calendaires à compter de la réception de la demande, par le même moyen de paiement que celui utilisé pour la souscription (sauf accord exprès pour un autre moyen).
• **Exception (article L221-28 13°)** : le droit de rétractation ne s'applique pas si l'utilisateur a expressément demandé et reçu une prestation pleinement exécutée de contenu numérique avant la fin du délai de 14 jours, et a expressément renoncé à son droit de rétractation à ce moment-là. Cette renonciation expresse sera demandée le cas échéant lors de l'activation immédiate d'un service payant.
• **Plan Free** : le plan Free n'étant pas un service payant, le droit de rétractation ne lui est pas applicable. La présente clause vise exclusivement les futurs plans Pro et Lifetime.`,
  },
  {
    title: '11. Modifications des CGU',
    body: `Quantara peut modifier les présentes CGU à tout moment. Les modifications matérielles sont notifiées par email aux utilisateurs actifs au moins 30 jours avant entrée en vigueur. La poursuite de l'utilisation du service après la date d'effet vaut acceptation. Si vous refusez les nouvelles CGU, vous pouvez supprimer votre compte avant la date d'effet.`,
  },
  {
    title: '12. Droit applicable & juridiction',
    body: `Les présentes CGU sont régies par le droit du Texas, USA. Tout litige sera soumis exclusivement aux tribunaux compétents du Texas, sauf disposition légale impérative contraire (RGPD et droit de la consommation pour résidents EU notamment, qui permettent la juridiction du pays de résidence du consommateur).`,
  },
  {
    title: '13. Contact',
    body: `Pour toute question concernant ces CGU, contactez contact@quantara.tech. Pour signaler un problème de sécurité : security@quantara.tech.`,
  },
]

export default function CGUPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <PageHeader />

      <main style={{ flex: 1 }}>
        {/* HERO */}
        <section style={{ padding: '80px 24px 40px', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
          <Reveal>
            <div style={{ fontSize: 11, color: C.blueLight, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 18 }}>
              Légal
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0, marginBottom: 14 }}>
              Conditions Générales d'Utilisation
            </h1>
            <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6 }}>
              Version 1.2 · Dernière mise à jour : 18 mai 2026 · Régies par le droit du Texas, USA
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
                background: s.danger ? 'rgba(232,80,74,0.04)' : C.surface,
                border: `1px solid ${s.danger ? 'rgba(232,80,74,0.25)' : C.border}`,
                borderRadius: 12,
              }}>
                <h2 style={{
                  fontSize: 15, fontWeight: 700,
                  color: s.danger ? C.red : C.text,
                  margin: 0, marginBottom: 10, letterSpacing: '-0.01em',
                }}>
                  {s.title}
                </h2>
                <p style={{
                  fontSize: 13, color: C.text2, lineHeight: 1.7, margin: 0,
                }}>
                  {s.body}
                </p>
              </div>
            </Reveal>
          ))}
        </section>

        {/* Disclaimer rappel */}
        <section style={{ padding: '20px 24px 80px', maxWidth: 820, margin: '0 auto' }}>
          <Reveal>
            <div style={{
              padding: '20px 24px',
              background: 'rgba(250,199,117,0.06)',
              border: '1px solid rgba(250,199,117,0.25)',
              borderRadius: 12,
              fontSize: 12, color: C.text3, lineHeight: 1.6,
            }}>
              <strong style={{ color: C.amber }}>⚠ Rappel important :</strong> Quantara est un outil de journalisation et d'analyse. Le trading de futures comporte des risques substantiels. Les performances passées ne préjugent pas des résultats futurs. Tradez avec un capital que vous pouvez vous permettre de perdre.
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  )
}

import PageHeader from '../../../components/PageHeader'
import Footer from '../../../components/Footer'

export const metadata = {
  title: 'Conditions Générales d\'Utilisation — Quantara',
  description: 'CGU de Quantara LLC : règles d\'utilisation du service de journal de trading PropFirm. Régies par le droit du Texas, USA.',
}

const C = {
  bg: '#0d0f14',
  surface: '#141720',
  border: 'rgba(255,255,255,0.07)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
}

const sectionStyle = { marginBottom: 28 }
const h2Style = { fontSize: 17, fontWeight: 700, marginBottom: 10, color: C.text }
const pStyle = { fontSize: 13.5, color: C.text2, lineHeight: 1.7, marginBottom: 10 }
const liStyle = { fontSize: 13.5, color: C.text2, lineHeight: 1.7, marginBottom: 4 }

export default function CGUPage() {
  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PageHeader />

      <section style={{ padding: '60px 24px 80px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10 }}>LÉGAL</div>
            <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, marginBottom: 10 }}>
              Conditions Générales d'Utilisation
            </h1>
            <div style={{ fontSize: 12, color: C.text3 }}>
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div style={{
            padding: 14, marginBottom: 32,
            background: 'rgba(250,199,117,0.07)', border: '1px solid rgba(250,199,117,0.25)',
            borderRadius: 8, fontSize: 12.5, color: '#fac775', lineHeight: 1.6,
          }}>
            ⚠️ <strong>Templates de base.</strong> Pour exploitation commerciale à grande échelle, validation par un attorney spécialisé en droit du Texas recommandée.
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>1. Préambule</h2>
            <p style={pStyle}>
              Les présentes Conditions Générales d'Utilisation (« CGU ») régissent l'accès et l'utilisation du service Quantara
              (« le Service »), un outil web de journalisation et d'analyse de performance pour traders de futures sur PropFirms,
              édité et opéré par <strong>Quantara LLC</strong>, une Limited Liability Company constituée selon les lois de l'État du
              Texas, États-Unis (EIN : <em>[à compléter après obtention]</em>, siège social : <em>[à compléter avec l'adresse du registered agent au Texas]</em>),
              accessible à l'adresse quantara.app et ses sous-domaines.
            </p>
            <p style={pStyle}>
              En accédant au Service ou en créant un compte, l'utilisateur (« Utilisateur ») accepte sans réserve les présentes CGU.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>2. Description du Service</h2>
            <p style={pStyle}>
              Quantara fournit à ses Utilisateurs un outil de :
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={liStyle}>Journalisation manuelle de trades (PnL, instrument, notes, screenshots)</li>
              <li style={liStyle}>Suivi de comptes PropFirm (drawdown, profit target, payouts)</li>
              <li style={liStyle}>Calcul automatique de métriques (consistency, ROI, jours validés)</li>
              <li style={liStyle}>Affichage d'un calendrier économique tiers (Finnhub)</li>
              <li style={liStyle}>Export CSV des données</li>
            </ul>
            <p style={pStyle}>
              Quantara <strong>ne fournit aucun conseil financier, d'investissement ou de trading</strong>. Le Service est purement
              informatif et organisationnel. Quantara LLC n'est ni un broker, ni un investment adviser au sens de la SEC,
              ni une PropFirm.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>3. Création et gestion du compte</h2>
            <p style={pStyle}>
              L'inscription nécessite une adresse email valide et un mot de passe. L'Utilisateur s'engage à fournir des informations
              exactes et à maintenir la confidentialité de ses identifiants. Quantara LLC ne peut être tenue responsable d'un accès
              non autorisé résultant d'une négligence de l'Utilisateur.
            </p>
            <p style={pStyle}>
              Quantara LLC se réserve le droit de suspendre ou supprimer un compte en cas de violation des présentes CGU,
              d'usage frauduleux, ou d'inactivité prolongée (12 mois consécutifs).
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>4. Tarification</h2>
            <p style={pStyle}>
              Le Service est actuellement gratuit pendant la phase beta. Quantara LLC se réserve le droit d'introduire
              ultérieurement des plans payants. Les paiements seraient traités via Stripe, Inc. (USA) en USD ou EUR.
              Les Utilisateurs existants seront notifiés au moins 30 jours à l'avance et bénéficieront, dans la mesure du possible,
              d'un accès continu aux fonctionnalités auxquelles ils ont souscrit gratuitement.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>5. Avertissement sur les risques de trading</h2>
            <p style={pStyle}>
              Le trading de futures est une activité hautement spéculative comportant des risques substantiels de perte
              en capital. Les performances passées (affichées via le Service) ne préjugent pas des résultats futurs.
            </p>
            <p style={pStyle}>
              <strong>L'Utilisateur reconnaît trader sous sa seule responsabilité.</strong> Quantara LLC ne saurait être tenue
              responsable des pertes financières, des défaillances de PropFirms tierces, ou de toute conséquence résultant
              de l'utilisation du Service.
            </p>
            <p style={pStyle}>
              Conformément à la réglementation CFTC/NFA américaine : <em>« Trading futures involves substantial risk of loss
              and is not suitable for all investors. Past performance is not indicative of future results. »</em>
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>6. Propriété intellectuelle</h2>
            <p style={pStyle}>
              Le Service, son code, son design, sa marque « Quantara » et ses contenus (hors données utilisateurs) sont la
              propriété exclusive de Quantara LLC ou de ses concédants. Toute reproduction, copie, ou exploitation non autorisée
              est interdite et constitue une violation de droit d'auteur sanctionnée par les lois fédérales américaines (17 U.S.C.).
            </p>
            <p style={pStyle}>
              L'Utilisateur conserve la pleine propriété des données qu'il saisit (trades, notes, screenshots, certificats).
              Il accorde à Quantara LLC une licence d'usage limitée à la stricte fourniture du Service.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>7. Disponibilité du service</h2>
            <p style={pStyle}>
              Quantara LLC s'efforce d'assurer une disponibilité maximale du Service mais ne garantit pas un fonctionnement
              ininterrompu. Le Service est fourni « AS IS » et « AS AVAILABLE ». Des opérations de maintenance, mises à jour,
              ou pannes techniques peuvent rendre le Service temporairement indisponible.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>8. Limitation de responsabilité</h2>
            <p style={pStyle}>
              Dans la limite maximale autorisée par la loi applicable, la responsabilité totale de Quantara LLC envers tout
              Utilisateur ne pourra excéder cent (100) dollars USD ou le montant payé par l'Utilisateur au cours des
              12 mois précédant l'événement déclencheur, le plus élevé des deux.
            </p>
            <p style={pStyle}>
              Quantara LLC décline toute responsabilité quant aux dommages directs, indirects, accessoires, spéciaux,
              consécutifs ou exemplaires résultant de l'utilisation ou de l'impossibilité d'utiliser le Service, y compris
              perte de données, perte de profit, ou interruption d'activité.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>9. Indemnisation</h2>
            <p style={pStyle}>
              L'Utilisateur s'engage à indemniser et tenir Quantara LLC à l'écart de toute réclamation, dommage ou frais
              (y compris frais juridiques raisonnables) résultant de sa violation des présentes CGU ou de son utilisation
              illicite du Service.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>10. Modification des CGU</h2>
            <p style={pStyle}>
              Quantara LLC se réserve le droit de modifier les présentes CGU à tout moment. Les Utilisateurs seront notifiés
              par email au moins 15 jours avant l'entrée en vigueur des modifications substantielles.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>11. Droit applicable et juridiction</h2>
            <p style={pStyle}>
              Les présentes CGU sont régies et interprétées conformément aux lois de l'<strong>État du Texas, États-Unis</strong>,
              sans égard à ses principes de conflits de lois.
            </p>
            <p style={pStyle}>
              Tout litige sera, à défaut de résolution amiable, soumis à la juridiction exclusive des tribunaux d'État et
              fédéraux situés dans le comté de <em>[à compléter — typiquement le comté du registered agent au Texas]</em>,
              Texas. L'Utilisateur renonce expressément à toute objection fondée sur le forum non conveniens.
            </p>
            <p style={pStyle}>
              <strong>Class action waiver :</strong> Tout litige sera résolu de manière individuelle. L'Utilisateur renonce à
              participer à toute action de groupe, action collective ou procédure consolidée contre Quantara LLC.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>12. Contact</h2>
            <p style={pStyle}>
              Pour toute question relative aux présentes CGU :
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={liStyle}>Email : <a href="mailto:legal@quantara.app" style={{ color: '#4d8fff', textDecoration: 'none' }}>legal@quantara.app</a></li>
              <li style={liStyle}>Adresse postale : Quantara LLC, <em>[adresse du registered agent au Texas]</em></li>
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

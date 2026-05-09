import PageHeader from '../../../components/PageHeader'
import Footer from '../../../components/Footer'

export const metadata = {
  title: 'Politique de Confidentialité — Quantara',
  description: 'Comment Quantara collecte, utilise et protège tes données personnelles. Conformité RGPD.',
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

export default function PrivacyPage() {
  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PageHeader />

      <section style={{ padding: '60px 24px 80px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10 }}>LÉGAL</div>
            <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, marginBottom: 10 }}>
              Politique de Confidentialité
            </h1>
            <div style={{ fontSize: 12, color: C.text3 }}>
              Conforme RGPD · Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div style={{
            padding: 14, marginBottom: 32,
            background: 'rgba(250,199,117,0.07)', border: '1px solid rgba(250,199,117,0.25)',
            borderRadius: 8, fontSize: 12.5, color: '#fac775', lineHeight: 1.6,
          }}>
            ⚠️ <strong>Modèle non validé juridiquement.</strong> Pour une exploitation commerciale, faites valider par un juriste / DPO.
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>1. Responsable du traitement</h2>
            <p style={pStyle}>
              Le responsable du traitement des données est l'éditeur du Service Quantara (à compléter avec raison sociale, SIREN,
              adresse postale et email du DPO une fois la structure juridique en place).
            </p>
            <p style={pStyle}>
              Contact : <a href="mailto:contact@quantara.app" style={{ color: '#4d8fff', textDecoration: 'none' }}>contact@quantara.app</a>
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>2. Données collectées</h2>
            <p style={pStyle}>
              Quantara collecte uniquement les données nécessaires au fonctionnement du Service :
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={liStyle}><strong>Données d'inscription</strong> : adresse email, mot de passe (hashé bcrypt)</li>
              <li style={liStyle}><strong>Données de trading saisies par l'Utilisateur</strong> : firmes, comptes, trades, payouts, notes, screenshots, certificats</li>
              <li style={liStyle}><strong>Données techniques minimales</strong> : adresse IP (logs Vercel/Supabase, conservés 30 jours max), agent navigateur (anonymisé)</li>
              <li style={liStyle}><strong>Aucune donnée bancaire</strong> n'est collectée par Quantara (le Service est gratuit en beta)</li>
              <li style={liStyle}><strong>Aucun mot de passe broker</strong> n'est stocké (intégration via API keys génériques côté serveur)</li>
            </ul>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>3. Finalités du traitement</h2>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={liStyle}>Authentification et accès au compte utilisateur</li>
              <li style={liStyle}>Stockage et affichage des données de trading saisies</li>
              <li style={liStyle}>Calcul de métriques et statistiques personnelles</li>
              <li style={liStyle}>Support utilisateur (en cas de demande)</li>
              <li style={liStyle}>Détection et prévention d'abus du Service</li>
            </ul>
            <p style={pStyle}>
              Quantara <strong>ne réalise aucun profilage publicitaire ni revente de données</strong>. Aucune donnée n'est partagée
              avec des tiers sauf obligation légale.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>4. Hébergement et localisation des données</h2>
            <p style={pStyle}>
              Les données sont hébergées au sein de l'Union Européenne :
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={liStyle}><strong>Frontend</strong> : Vercel (régions Frankfurt/Paris)</li>
              <li style={liStyle}><strong>Base de données + Storage</strong> : Supabase (région Frankfurt)</li>
              <li style={liStyle}><strong>Calendrier économique</strong> : appels API à Finnhub (États-Unis) — uniquement pour récupérer des données publiques de marché, aucune donnée utilisateur transmise</li>
            </ul>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>5. Durée de conservation</h2>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={liStyle}>Données du compte : tant que le compte est actif</li>
              <li style={liStyle}>Après suppression du compte : suppression définitive sous 30 jours max</li>
              <li style={liStyle}>Logs techniques (IP, requêtes) : 30 jours</li>
              <li style={liStyle}>Backups Supabase : 7 jours (rolling, chiffrés)</li>
            </ul>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>6. Tes droits (RGPD)</h2>
            <p style={pStyle}>
              Conformément au RGPD, tu disposes des droits suivants :
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={liStyle}><strong>Droit d'accès</strong> : obtenir une copie de toutes tes données (export CSV depuis le Service ou demande email)</li>
              <li style={liStyle}><strong>Droit de rectification</strong> : corriger des informations inexactes</li>
              <li style={liStyle}><strong>Droit à l'effacement</strong> (« droit à l'oubli ») : suppression complète de ton compte et données</li>
              <li style={liStyle}><strong>Droit à la portabilité</strong> : récupérer tes données en format structuré (CSV)</li>
              <li style={liStyle}><strong>Droit d'opposition</strong> : t'opposer à un traitement spécifique</li>
              <li style={liStyle}><strong>Droit de réclamation</strong> : auprès de la CNIL (cnil.fr) en cas de litige</li>
            </ul>
            <p style={pStyle}>
              Pour exercer ces droits : <a href="mailto:contact@quantara.app?subject=Demande%20RGPD" style={{ color: '#4d8fff', textDecoration: 'none' }}>contact@quantara.app</a>
              {' · '}Réponse sous 30 jours max.
            </p>
          </div>

          <div style={sectionStyle} id="cookies">
            <h2 style={h2Style}>7. Cookies</h2>
            <p style={pStyle}>
              Quantara utilise un nombre minimal de cookies, tous strictement nécessaires au fonctionnement du Service :
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={liStyle}><strong>Cookie d'authentification Supabase</strong> (sb-access-token / sb-refresh-token) : pour maintenir ta session connectée. Durée : 1 semaine glissante.</li>
              <li style={liStyle}><strong>Préférences utilisateur</strong> (localStorage) : langue, thème, état des filtres. Aucune donnée personnelle.</li>
            </ul>
            <p style={pStyle}>
              <strong>Aucun cookie publicitaire ni de tracking tiers (Google Analytics, Meta Pixel, etc.) n'est utilisé.</strong>
              {' '}Tu peux désactiver les cookies dans ton navigateur, mais l'authentification ne fonctionnera plus.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>8. Sécurité</h2>
            <p style={pStyle}>
              Quantara met en œuvre des mesures techniques et organisationnelles pour protéger tes données : chiffrement TLS 1.3,
              chiffrement au repos (AES-256), Row Level Security (RLS) PostgreSQL, isolation des fichiers Storage par utilisateur,
              JWT signés. Voir notre page <a href="/security" style={{ color: '#4d8fff', textDecoration: 'none' }}>Sécurité</a> pour plus de détails.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>9. Notification de violation</h2>
            <p style={pStyle}>
              En cas de violation de données susceptibles d'engendrer un risque pour tes droits et libertés, Quantara s'engage
              à te notifier dans les meilleurs délais (72h max) conformément à l'article 34 du RGPD.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>10. Évolution de cette politique</h2>
            <p style={pStyle}>
              Cette politique peut évoluer. Toute modification substantielle sera notifiée par email aux utilisateurs au moins
              15 jours avant son entrée en vigueur.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

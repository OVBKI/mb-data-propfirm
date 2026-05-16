import PageHeader from '../../../components/PageHeader'
import Footer from '../../../components/Footer'

export const metadata = {
  title: 'Politique de Confidentialité — Quantara',
  description: 'Comment Quantara LLC collecte, utilise et protège tes données. Conformité RGPD (UE), CCPA (Californie), TDPSA (Texas).',
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
              Conforme RGPD · CCPA · TDPSA · Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div style={{
            padding: 14, marginBottom: 32,
            background: 'rgba(250,199,117,0.07)', border: '1px solid rgba(250,199,117,0.25)',
            borderRadius: 8, fontSize: 12.5, color: '#fac775', lineHeight: 1.6,
          }}>
            ⚠️ <strong>Templates de base.</strong> Pour exploitation commerciale, validation par un attorney privacy law (US + EU) recommandée — surtout si tu cibles activement le marché européen ou californien.
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>1. Responsable du traitement</h2>
            <p style={pStyle}>
              <strong>Quantara LLC</strong>, Limited Liability Company constituée selon les lois de l'État du Texas, États-Unis.
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={liStyle}>EIN : <em>[à compléter après obtention auprès de l'IRS]</em></li>
              <li style={liStyle}>Siège social / Registered agent : <em>[à compléter avec l'adresse au Texas]</em></li>
              <li style={liStyle}>Email général : <a href="mailto:contact@quantara.tech" style={{ color: '#4d8fff', textDecoration: 'none' }}>contact@quantara.tech</a></li>
              <li style={liStyle}>Email privacy/RGPD : <a href="mailto:privacy@quantara.tech" style={{ color: '#4d8fff', textDecoration: 'none' }}>privacy@quantara.tech</a></li>
              <li style={liStyle}>Email sécurité : <a href="mailto:security@quantara.tech" style={{ color: '#4d8fff', textDecoration: 'none' }}>security@quantara.tech</a></li>
            </ul>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>2. Données collectées</h2>
            <p style={pStyle}>
              Quantara collecte uniquement les données nécessaires au fonctionnement du Service :
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={liStyle}><strong>Données d'inscription</strong> : adresse email, mot de passe (hashé bcrypt côté Supabase)</li>
              <li style={liStyle}><strong>Données de trading saisies par l'Utilisateur</strong> : firmes, comptes, trades, payouts, notes, screenshots, certificats de challenge</li>
              <li style={liStyle}><strong>Données techniques minimales</strong> : adresse IP (logs Vercel/Supabase, conservés 30 jours max), agent navigateur</li>
              <li style={liStyle}><strong>Aucune donnée bancaire</strong> n'est collectée par Quantara LLC (Service gratuit en beta). Si paiements futurs : traités exclusivement par Stripe, Inc., conforme PCI-DSS</li>
              <li style={liStyle}><strong>Aucun mot de passe broker</strong> n'est stocké</li>
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
              <li style={liStyle}>Respect des obligations légales (notamment réquisition judiciaire)</li>
            </ul>
            <p style={pStyle}>
              Quantara LLC <strong>ne réalise aucun profilage publicitaire ni revente de données</strong>. Aucune donnée n'est
              partagée avec des tiers à des fins commerciales.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>4. Hébergement et localisation des données</h2>
            <p style={pStyle}>
              Les données sont hébergées au sein de l'<strong>Union Européenne</strong> :
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={liStyle}><strong>Frontend</strong> : Vercel Inc. (régions Frankfurt/Paris)</li>
              <li style={liStyle}><strong>Base de données + Storage</strong> : Supabase Inc. (région Frankfurt, Allemagne)</li>
              <li style={liStyle}><strong>Calendrier économique</strong> : appels API à Finnhub Inc. (États-Unis) — uniquement pour récupérer des données publiques de marché, aucune donnée utilisateur transmise</li>
              <li style={liStyle}><strong>Paiements futurs</strong> : Stripe, Inc. (États-Unis) — données de carte traitées chez Stripe directement, jamais transitant par nos serveurs</li>
            </ul>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>5. Transfert de données et CLOUD Act (transparence)</h2>
            <p style={pStyle}>
              Quantara LLC étant une entité de droit américain (Texas), nous sommes légalement soumis au <strong>U.S. CLOUD Act</strong>
              (Clarifying Lawful Overseas Use of Data Act, 2018), qui peut permettre aux autorités fédérales américaines d'exiger
              l'accès à des données détenues par notre société, y compris si elles sont physiquement stockées en Europe via
              nos sous-traitants Vercel et Supabase.
            </p>
            <p style={pStyle}>
              <strong>En pratique :</strong> nous n'avons reçu aucune demande de ce type à ce jour. Si une telle demande nous
              parvenait, nous (i) la contesterions juridiquement quand légalement possible, et (ii) en informerions les
              utilisateurs concernés sauf interdiction légale (gag order). Notre engagement de transparence est total :
              le nombre de demandes reçues sera publié annuellement sur cette page.
            </p>
            <p style={pStyle}>
              Pour les utilisateurs européens préoccupés par cette exposition juridique : nous évaluons la nomination d'un
              <strong> EU representative</strong> (article 27 RGPD) une fois la base utilisateurs européenne stabilisée.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>6. Durée de conservation</h2>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={liStyle}>Données du compte : tant que le compte est actif</li>
              <li style={liStyle}>Après suppression du compte : suppression définitive sous 30 jours max</li>
              <li style={liStyle}>Logs techniques (IP, requêtes) : 30 jours</li>
              <li style={liStyle}>Backups Supabase : 7 jours (rolling, chiffrés)</li>
              <li style={liStyle}>Données de facturation (si paiements futurs) : 7 ans (obligation comptable US/EU)</li>
            </ul>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>7. Tes droits — Utilisateurs UE/EEA (RGPD)</h2>
            <p style={pStyle}>
              Conformément au RGPD, tu disposes des droits suivants :
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={liStyle}><strong>Accès</strong> : obtenir une copie de toutes tes données (export CSV depuis le Service ou demande email)</li>
              <li style={liStyle}><strong>Rectification</strong> : corriger des informations inexactes</li>
              <li style={liStyle}><strong>Effacement</strong> (« droit à l'oubli ») : suppression complète de ton compte et données</li>
              <li style={liStyle}><strong>Portabilité</strong> : récupérer tes données en format structuré (CSV)</li>
              <li style={liStyle}><strong>Opposition</strong> : t'opposer à un traitement spécifique</li>
              <li style={liStyle}><strong>Limitation</strong> : limiter le traitement dans certains cas</li>
              <li style={liStyle}><strong>Réclamation</strong> : auprès de la CNIL (cnil.fr) ou de toute autorité de contrôle EU compétente</li>
            </ul>
            <p style={pStyle}>
              Pour exercer ces droits : <a href="mailto:privacy@quantara.tech?subject=Demande%20RGPD" style={{ color: '#4d8fff', textDecoration: 'none' }}>privacy@quantara.tech</a>
              {' · '}Réponse sous 30 jours max conformément à l'article 12 RGPD.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>8. Tes droits — Résidents Californiens (CCPA / CPRA)</h2>
            <p style={pStyle}>
              Si tu résides en Californie, tu bénéficies des droits supplémentaires suivants au titre du
              California Consumer Privacy Act (CCPA) tel qu'amendé par le CPRA :
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={liStyle}><strong>Right to Know</strong> : demander la liste détaillée des catégories de données collectées te concernant et leurs finalités</li>
              <li style={liStyle}><strong>Right to Delete</strong> : demander la suppression de tes données personnelles</li>
              <li style={liStyle}><strong>Right to Correct</strong> : demander la correction de données inexactes</li>
              <li style={liStyle}><strong>Right to Opt-Out of Sale/Sharing</strong> : <strong>non applicable</strong> — Quantara LLC ne vend ni ne partage de données personnelles à des fins publicitaires (« Do Not Sell My Personal Information »)</li>
              <li style={liStyle}><strong>Right to Limit Use of Sensitive Personal Information</strong> : non applicable — Quantara ne traite pas de catégories sensibles au sens du CCPA (santé, biométrie, etc.)</li>
              <li style={liStyle}><strong>Right to Non-Discrimination</strong> : exercer ces droits ne donnera lieu à aucune discrimination dans la qualité du Service</li>
            </ul>
            <p style={pStyle}>
              Pour exercer ces droits : <a href="mailto:privacy@quantara.tech?subject=CCPA%20Request" style={{ color: '#4d8fff', textDecoration: 'none' }}>privacy@quantara.tech</a>
              {' · '}Réponse sous 45 jours max.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>9. Tes droits — Résidents Texans (TDPSA)</h2>
            <p style={pStyle}>
              Le Texas Data Privacy and Security Act (TDPSA), entré en vigueur en juillet 2024, accorde aux résidents du Texas
              des droits similaires au CCPA. Quantara LLC, basée au Texas, applique ces droits à tous les utilisateurs texans
              indépendamment du seuil légal d'applicabilité du TDPSA. Voir section 8 pour le détail des droits, identiques
              à ceux du CCPA.
            </p>
          </div>

          <div style={sectionStyle} id="cookies">
            <h2 style={h2Style}>10. Cookies</h2>
            <p style={pStyle}>
              Quantara utilise un nombre minimal de cookies, tous strictement nécessaires au fonctionnement du Service :
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={liStyle}><strong>Cookie d'authentification Supabase</strong> (sb-access-token / sb-refresh-token) : pour maintenir ta session connectée. Durée : 1 semaine glissante.</li>
              <li style={liStyle}><strong>Préférences utilisateur</strong> (localStorage) : langue, thème, état des filtres. Aucune donnée personnelle.</li>
            </ul>
            <p style={pStyle}>
              <strong>Aucun cookie publicitaire ni de tracking tiers (Google Analytics, Meta Pixel, TikTok Pixel, etc.)
              n'est utilisé.</strong>{' '}Tu peux désactiver les cookies dans ton navigateur, mais l'authentification ne
              fonctionnera plus.
            </p>
            <p style={pStyle}>
              <strong>Global Privacy Control (GPC)</strong> : Quantara respecte le signal GPC envoyé par certains navigateurs
              (Brave, Firefox via extensions, etc.), équivalent à un opt-out automatique CCPA — bien que sans effet pratique
              chez nous puisque nous ne vendons pas de données.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>11. Sécurité</h2>
            <p style={pStyle}>
              Quantara LLC met en œuvre des mesures techniques et organisationnelles pour protéger tes données : chiffrement
              TLS 1.3, chiffrement au repos (AES-256), Row Level Security (RLS) PostgreSQL, isolation des fichiers Storage par
              utilisateur, JWT signés avec rotation. Voir notre page <a href="/security" style={{ color: '#4d8fff', textDecoration: 'none' }}>Sécurité</a> pour plus de détails.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>12. Notification de violation</h2>
            <p style={pStyle}>
              En cas de violation de données susceptibles d'engendrer un risque pour tes droits et libertés :
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={liStyle}>Pour les utilisateurs UE : notification dans les 72 heures conformément à l'article 34 RGPD</li>
              <li style={liStyle}>Pour les utilisateurs US : notification conformément aux lois étatiques applicables (notamment Texas Business and Commerce Code §521.053)</li>
            </ul>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>13. Mineurs</h2>
            <p style={pStyle}>
              Le Service n'est pas destiné aux personnes de moins de 18 ans. Quantara LLC ne collecte pas sciemment de données
              personnelles d'enfants. Si tu es parent et que ton enfant a créé un compte, contacte privacy@quantara.tech pour
              suppression immédiate.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={h2Style}>14. Évolution de cette politique</h2>
            <p style={pStyle}>
              Cette politique peut évoluer. Toute modification substantielle sera notifiée par email aux utilisateurs au moins
              15 jours avant son entrée en vigueur. La date de dernière mise à jour est indiquée en haut de cette page.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

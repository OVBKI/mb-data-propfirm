// /docs/extension — install + usage instructions for the Quantara Sync browser extension.
// Server component (no client interactivity needed).

export const revalidate = 3600

export const metadata = {
  title: 'Extension Quantara Sync — Installation',
  description: "Installe l'extension navigateur Quantara Sync pour synchroniser automatiquement tes trades depuis n'importe quel dashboard PropFirm (Lucid, TopstepX, Apex, MFFU, Tradeify…).",
  alternates: { canonical: 'https://quantara.tech/docs/extension' },
  // PAUSED (juin 2026) — extension Quantara Sync en pause : ne pas indexer/promouvoir.
  robots: { index: false, follow: false },
}

const C = {
  surface: 'rgba(20,23,32,0.65)', border: 'var(--border)', border2: 'var(--border2)',
  text: 'var(--text)', text2: 'var(--text2)', text3: 'var(--text3)',
  blue: 'var(--blue)', blueLt: 'var(--blue-light)', green: 'var(--green)', amber: '#d99a3e',
}

const card = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22, marginBottom: 16 }
const code = { background: 'rgba(0,0,0,0.35)', border: `1px solid ${C.border}`, borderRadius: 6, padding: '2px 7px', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12, color: C.blueLt }

export default function ExtensionDocsPage() {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px 80px', color: C.text, fontSize: 14, lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, marginBottom: 6, letterSpacing: '-0.02em' }}>
        {'\u{1F9E9}'} Extension Quantara Sync
      </h1>
      <p style={{ color: C.text2, marginTop: 0, marginBottom: 32 }}>
        Sync auto de tes trades depuis le dashboard de ta PropFirm vers Quantara. Aucune clé API, aucune connexion à un broker.
      </p>

      <div style={card}>
        <h2 style={{ fontSize: 18, margin: 0, marginBottom: 10 }}>{'⚡'} Comment ça marche</h2>
        <ol style={{ margin: 0, paddingLeft: 22, color: C.text2 }}>
          <li>Tu installes l&apos;extension Chrome/Edge.</li>
          <li>Tu te connectes sur <span style={code}>quantara.tech</span> — l&apos;extension récupère ta session automatiquement.</li>
          <li>Tu ouvres le dashboard de ta PropFirm comme d&apos;habitude (ex: <span style={code}>dash.lucidtrading.com</span>).</li>
          <li>L&apos;extension intercepte les API calls que le dashboard fait déjà à son backend, et envoie les trades à Quantara en arrière-plan.</li>
          <li>Tes trades apparaissent dans <span style={code}>/app/journal-sync/view</span> et dans ton calendrier / dashboard.</li>
        </ol>
      </div>

      <div style={card}>
        <h2 style={{ fontSize: 18, margin: 0, marginBottom: 10 }}>{'\u{1F4E5}'} Installation — version Alpha (side-load)</h2>
        <p style={{ marginTop: 0, color: C.text2 }}>
          L&apos;extension n&apos;est pas encore publiée sur le Chrome Web Store. En attendant, tu peux la charger manuellement :
        </p>
        <ol style={{ margin: 0, paddingLeft: 22, color: C.text2 }}>
          <li>Télécharge le dossier <span style={code}>quantara-extension/</span> depuis le repo GitHub.</li>
          <li>Ouvre Chrome / Edge sur <span style={code}>chrome://extensions</span>.</li>
          <li>Active <strong>Mode développeur</strong> (toggle en haut à droite).</li>
          <li>Clique <strong>« Charger l&apos;extension non empaquetée »</strong> et sélectionne le dossier <span style={code}>quantara-extension/</span>.</li>
          <li>Épingle l&apos;icône Quantara dans la barre d&apos;outils pour y accéder rapidement.</li>
        </ol>
        <p style={{ color: C.text3, fontSize: 12, marginBottom: 0 }}>
          Publication sur le Chrome Web Store prévue après la beta privée.
        </p>
      </div>

      <div style={card}>
        <h2 style={{ fontSize: 18, margin: 0, marginBottom: 10 }}>{'\u{1F510}'} Confidentialité</h2>
        <ul style={{ margin: 0, paddingLeft: 22, color: C.text2 }}>
          <li>L&apos;extension ne demande JAMAIS tes identifiants PropFirm. Elle lit uniquement les données que ton dashboard a déjà chargées dans ton navigateur via ta propre session.</li>
          <li>Les seules requêtes capturées sont celles vers le backend de ta PropFirm (ex: <span style={code}>api.lucidtrading.com</span>). Aucun autre site n&apos;est inspecté.</li>
          <li>Les données sont envoyées uniquement à <span style={code}>quantara.tech</span>, avec ton token Supabase comme authentification (le même que tu utilises pour te connecter au site).</li>
          <li>Tu peux désactiver le mode debug et révoquer l&apos;extension à tout moment depuis <span style={code}>chrome://extensions</span>.</li>
        </ul>
      </div>

      <div style={card}>
        <h2 style={{ fontSize: 18, margin: 0, marginBottom: 10 }}>{'\u{1F4CB}'} PropFirms supportées</h2>
        <ul style={{ margin: 0, paddingLeft: 22, color: C.text2 }}>
          <li><strong>Lucid Trading</strong> — adapter alpha en cours de calibration</li>
          <li><strong>TopstepX</strong> — adapter alpha</li>
          <li>Apex Trader Funding, MyFundedFutures, Tradeify, Bulenox, TakeProfitTrader, TradeDay — prévus, en cours d&apos;analyse</li>
        </ul>
        <p style={{ color: C.text3, fontSize: 12, marginTop: 10, marginBottom: 0 }}>
          Tu utilises une PropFirm pas encore listée ? Active le mode debug, navigue dans ton historique de trades, et envoie-nous le contenu de l&apos;onglet <strong>Debug</strong> via <a href="/contact" style={{ color: C.blueLt }}>/contact</a>. On l&apos;ajoute en 1-2 jours.
        </p>
      </div>

      <div style={{ ...card, background: 'rgba(45,111,255,0.05)', borderColor: 'rgba(45,111,255,0.25)' }}>
        <h2 style={{ fontSize: 16, margin: 0, marginBottom: 6 }}>{'\u{1F44B}'} Prérequis</h2>
        <p style={{ marginTop: 0, marginBottom: 0, color: C.text2 }}>
          Tu dois avoir la PropFirm correspondante déjà créée dans Quantara (ex: une firm nommée <strong>« Lucid Trading »</strong> avec au moins un compte). Sinon l&apos;extension renverra une erreur <span style={code}>NO_FIRM</span> et tu verras un message dans le popup.
        </p>
      </div>

      <p style={{ color: C.text3, fontSize: 12, marginTop: 32, textAlign: 'center' }}>
        Documentation technique pour développeurs : <span style={code}>quantara-extension/README.md</span> dans le repo.
      </p>
    </div>
  )
}

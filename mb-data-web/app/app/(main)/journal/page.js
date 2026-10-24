'use client'
// app/app/(main)/journal/page.js — LE journal : trades saisis ET importés (CSV), avec
// un filtre « Origine » dans la page. Il remplace l'ancien découpage en deux vues
// (journal manuel ici, trades importés dans /app/journal-sync/view).
import { useApp } from '../AppContext'
import JournalPage from '../../../../components/JournalPage'
import ImportedTradesTable from '../../../../components/ImportedTradesTable'

export default function JournalRoute() {
  const { firms, user, getFirmLogo, showToast, reload } = useApp()
  return (
    <JournalPage
      firms={firms}
      user={user}
      getFirmLogo={getFirmLogo}
      showToast={showToast}
      onReload={reload}
      renderExtraSection={(ctx) => {
        const imported = ctx.filteredEntries.filter((e) => e._imported)
        return imported.length ? <ImportedTradesTable filteredEntries={imported} allAccounts={ctx.allAccounts} /> : null
      }}
    />
  )
}

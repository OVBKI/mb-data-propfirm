'use client'
// app/app/journal/page.js — Manual journal (excludes rithmic-synced accounts)
import { useApp } from '../AppContext'
import JournalPage from '../../../../components/JournalPage'

export default function JournalRoute() {
  const { firms, user, getFirmLogo, showToast, reload } = useApp()

  // Filter out rithmic-synced accounts (those go through /app/journal-sync)
  const manualFirms = firms
    .map(f => ({ ...f, accounts: (f.accounts || []).filter(a => !a.rithmic_account_id) }))
    .filter(f => (f.accounts || []).length > 0)

  return (
    <JournalPage
      firms={manualFirms}
      user={user}
      getFirmLogo={getFirmLogo}
      showToast={showToast}
      onReload={reload}
      hideRithmicEntries={true}
    />
  )
}

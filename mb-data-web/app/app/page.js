import { redirect } from 'next/navigation'

// app/app/page.js — Redirects to /app/dashboard.
// The monolithic page has been split into:
//   - layout.js (auth shell, sidebar, topbar, modals, context provider)
//   - dashboard/page.js, analytics/page.js, journal/page.js, etc.
export default function AppPage() {
  redirect('/app/dashboard')
}

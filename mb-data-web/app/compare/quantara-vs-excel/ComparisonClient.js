'use client'
import ComparisonPage from '../../../components/ComparisonPage'

const ROWS = [
  { feature: 'Setup time', quantara: '✅ 90 seconds', competitor: '⏳ Hours/days', quantaraWins: true },
  { feature: 'Trailing drawdown calculation', quantara: '✅ Automatic', competitor: '⚠️ Manual formulas', quantaraWins: true },
  { feature: 'EOD vs Intraday DD', quantara: '✅ Per-firm rules', competitor: '❌ Build yourself', quantaraWins: true },
  { feature: 'Consistency rule audit', quantara: '✅ Real-time', competitor: '⚠️ Manual pivot table', quantaraWins: true },
  { feature: 'Payout tracking', quantara: '✅ With profit split %', competitor: '⚠️ Manual entry', quantaraWins: true },
  { feature: 'Multi-firm dashboard', quantara: '✅ Unified view', competitor: '⚠️ Multiple tabs', quantaraWins: true },
  { feature: 'PropFirm rules pre-filled', quantara: '✅ 10+ firms', competitor: '❌ Research yourself', quantaraWins: true },
  { feature: 'Equity curve', quantara: '✅ Per account', competitor: '⚠️ Build chart manually', quantaraWins: true },
  { feature: 'Push alerts (billing)', quantara: '✅ 2 days before', competitor: '❌ No alerts', quantaraWins: true },
  { feature: 'Billing calendar', quantara: '✅ Auto-calculated', competitor: '⚠️ Manual dates', quantaraWins: true },
  { feature: 'Mobile access', quantara: '✅ PWA', competitor: '⚠️ Clunky on phone', quantaraWins: true },
  { feature: 'Cost', quantara: '✅ Free (beta)', competitor: '✅ Free (Google Sheets)', quantaraWins: false },
  { feature: 'Full customization', quantara: '⚠️ Fixed layout', competitor: '✅ Unlimited', competitorWins: true },
]

export default function ComparisonClient() {
  return (
    <ComparisonPage
      title="Quantara vs Excel / Google Sheets"
      subtitle="You've been tracking your PropFirm accounts in a spreadsheet. Here's what you're missing."
      quantaraName="Quantara"
      competitorName="Excel / Sheets"
      rows={ROWS}
      verdict="Spreadsheets are infinitely customizable and free — but they can't calculate trailing drawdown automatically, don't know PropFirm rules, can't send you push alerts before billing, and are painful on mobile. If you manage 2+ PropFirm accounts, the time you spend updating your spreadsheet is time you could spend trading. Quantara replaces the spreadsheet in 90 seconds with PropFirm-native automation."
      ctaText="Replace your spreadsheet in 90 seconds. Free, no credit card."
      ctaButton="Start free →"
    />
  )
}

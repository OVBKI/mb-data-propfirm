'use client'
import ComparisonPage from '../../../components/ComparisonPage'

const ROWS = [
  { feature: 'PropFirm rules pre-filled', quantara: '✅ 10+ firms', competitor: '❌ No', quantaraWins: true },
  { feature: 'Trailing drawdown tracking', quantara: '✅ EOD + Intraday', competitor: '❌ No', quantaraWins: true },
  { feature: 'Consistency rule audit', quantara: '✅ Real-time', competitor: '❌ No', quantaraWins: true },
  { feature: 'Payout tracking + profit split', quantara: '✅ Automatic', competitor: '❌ No', quantaraWins: true },
  { feature: 'Auto-import trades', quantara: '⏳ CSV + API soon', competitor: '✅ Broker sync', competitorWins: true },
  { feature: 'Trade journal', quantara: '✅ Full', competitor: '✅ Full', quantaraWins: false },
  { feature: 'Equity curve', quantara: '✅ Per account', competitor: '✅ Global only', quantaraWins: true },
  { feature: 'Multi-language (FR/EN/ES)', quantara: '✅', competitor: '❌ EN only', quantaraWins: true },
  { feature: 'Push alerts (billing)', quantara: '✅', competitor: '❌', quantaraWins: true },
  { feature: 'PropFirm comparator', quantara: '✅ Free public', competitor: '❌', quantaraWins: true },
  { feature: 'Pricing', quantara: '✅ Free (beta)', competitor: '$30-50/mo', quantaraWins: true },
  { feature: 'Mobile responsive', quantara: '✅ PWA', competitor: '⚠️ Desktop-first', quantaraWins: true },
]

export default function ComparisonClient() {
  return (
    <ComparisonPage
      title="Quantara vs Tradervue"
      subtitle="Which trading journal is best for PropFirm futures traders? A detailed feature comparison."
      quantaraName="Quantara"
      competitorName="Tradervue"
      rows={ROWS}
      verdict="Tradervue is a solid general-purpose trading journal with excellent broker sync. However, it has zero PropFirm-specific features: no trailing drawdown tracking, no consistency rule, no payout monitoring, no PropFirm rules. If you trade PropFirm futures, Quantara is purpose-built for your workflow. If you trade stocks through a single broker and need auto-import, Tradervue might suit you better."
      ctaText="Try Quantara free — no credit card, 90-second setup."
      ctaButton="Start free →"
    />
  )
}

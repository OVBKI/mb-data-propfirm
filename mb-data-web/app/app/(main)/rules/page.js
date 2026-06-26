'use client'
// app/app/rules/page.js — PropFirm Comparator
import { useApp } from '../AppContext'
import FuturesRulesComparator from '../../../../components/FuturesRulesComparator'
import CfdComparator from '../../../../components/CfdComparator'

export default function RulesRoute() {
  const { marketMode } = useApp()

  return marketMode === 'cfd' ? <CfdComparator /> : <FuturesRulesComparator />
}

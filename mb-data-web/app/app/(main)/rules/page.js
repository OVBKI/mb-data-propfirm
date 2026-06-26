'use client'
// app/app/rules/page.js — PropFirm Comparator
import { useApp } from '../AppContext'
import PropfirmComparator from '../../../../components/PropfirmComparator'
import CfdComparator from '../../../../components/CfdComparator'

export default function RulesRoute() {
  const { user, marketMode } = useApp()

  return marketMode === 'cfd' ? <CfdComparator /> : <PropfirmComparator user={user} />
}

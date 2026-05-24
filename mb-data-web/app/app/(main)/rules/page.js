'use client'
// app/app/rules/page.js — PropFirm Comparator
import { useApp } from '../AppContext'
import PropfirmComparator from '../../../../components/PropfirmComparator'

export default function RulesRoute() {
  const { user } = useApp()

  return (
    <PropfirmComparator user={user} />
  )
}

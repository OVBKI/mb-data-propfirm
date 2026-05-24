'use client'
// app/app/myrules/page.js — My Rules: trader's plan, setups, and rules
import { useApp } from '../AppContext'
import MyRulesPage from '../../../../components/MyRulesPage'

export default function MyRulesRoute() {
  const { user, showToast } = useApp()

  return (
    <MyRulesPage
      user={user}
      showToast={showToast}
    />
  )
}

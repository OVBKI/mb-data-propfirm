'use client'
// app/app/budget/page.js — calculateur de budget : combien consacrer aux challenges.
import { useApp } from '../AppContext'
import BudgetCalculator from '../../../../components/BudgetCalculator'

export default function BudgetRoute() {
  const { firms, rates, toEUR } = useApp()
  return <BudgetCalculator firms={firms} rates={rates} toEUR={toEUR} />
}

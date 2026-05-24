'use client'
// app/app/calendar/page.js — Economic Calendar
import { useState } from 'react'
import CalendarPage from '../../../../components/CalendarPage'

export default function CalendarRoute() {
  const [calLang, setCalLang] = useState('fr')

  return (
    <CalendarPage lang={calLang} onLangChange={setCalLang} />
  )
}

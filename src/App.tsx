import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import Dashboard from './pages/Dashboard'
import DailyBrief from './pages/DailyBrief'
import WeeklyReview from './pages/WeeklyReview'
import MonthlyReport from './pages/MonthlyReport'
import AdHoc from './pages/AdHoc'
import Archive from './pages/Archive'
import DataManager from './pages/DataManager'
import Settings from './pages/Settings'
import SetupWizard from './components/SetupWizard'
import DataNotice from './components/DataNotice'

export default function App() {
  const [setupDone, setSetupDone] = useState(() => !!localStorage.getItem('setup_complete'))

  return (
    <>
      {!setupDone && <SetupWizard onComplete={() => setSetupDone(true)} />}
      <DataNotice />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="daily"    element={<DailyBrief />} />
            <Route path="weekly"   element={<WeeklyReview />} />
            <Route path="monthly"  element={<MonthlyReport />} />
            <Route path="adhoc"    element={<AdHoc />} />
            <Route path="archive"  element={<Archive />} />
            <Route path="data"     element={<DataManager />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

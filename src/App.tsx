import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { IntelProvider } from '@/context/IntelContext'
import { AppShell } from '@/components/AppShell'
import { LoadingScreen } from '@/components/LoadingScreen'
import { LandingPage } from '@/pages/LandingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { SearchPage } from '@/pages/SearchPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { InvestigationsPage } from '@/pages/InvestigationsPage'
import { GraphPage } from '@/pages/GraphPage'
import { OsintPage } from '@/pages/OsintPage'
import { SourcesPage } from '@/pages/SourcesPage'
import { DatasetsPage } from '@/pages/DatasetsPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { NadraModulePage } from '@/pages/NadraModulePage'
import { MyFilesPdfPage } from '@/pages/MyFilesPdfPage'
import { useState } from 'react'

export default function App() {
  const [ready, setReady] = useState(false)

  return (
    <IntelProvider>
      {!ready ? <LoadingScreen onDone={() => setReady(true)} /> : null}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<AppShell />}>
            <Route index element={<SearchPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="profile/:id" element={<ProfilePage />} />
            <Route path="investigations" element={<InvestigationsPage />} />
            <Route path="graph" element={<GraphPage />} />
            <Route path="osint" element={<OsintPage />} />
            <Route path="nadra" element={<NadraModulePage />} />
            <Route path="my-files-pdf" element={<MyFilesPdfPage />} />
            <Route path="sources" element={<SourcesPage />} />
            <Route path="datasets" element={<DatasetsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </IntelProvider>
  )
}

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Alerts } from './pages/Alerts'
import { ApiPlayground } from './pages/ApiPlayground'
import { Compliance } from './pages/Compliance'
import { Dashboard } from './pages/Dashboard'
import { Docs } from './pages/Docs'
import { Home } from './pages/Home'
import { Pricing } from './pages/Pricing'
import { Settings } from './pages/Settings'
import { Watchlist } from './pages/Watchlist'
import { Webhooks } from './pages/Webhooks'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="watchlist" element={<Watchlist />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="docs" element={<Docs />} />
          <Route path="api-playground" element={<ApiPlayground />} />
          <Route path="settings" element={<Settings />} />
          <Route path="webhooks" element={<Webhooks />} />
          <Route path="compliance" element={<Compliance />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
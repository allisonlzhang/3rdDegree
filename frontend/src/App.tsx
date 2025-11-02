import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import Header from './components/Header'
import Home from './pages/Home'
import Login from './pages/Login'
import HostSetup from './pages/HostSetup'
import Host from './pages/Host'
import CreateParty from './pages/CreateParty'
import PartySuccess from './pages/PartySuccess'
import GuestRsvp from './pages/GuestRsvp'
import GuestDashboard from './pages/GuestDashboard'
import GuestLogin from './pages/GuestLogin'
import GuestPartyDetails from './pages/GuestPartyDetails'
import PartyDetails from './pages/PartyDetails'
import './App.css'

function AppContent() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="App">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="App">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/host/setup" element={<HostSetup />} />
        <Route path="/host" element={<Host />} />
        <Route path="/host/create-party" element={<CreateParty />} />
        <Route path="/host/party-success" element={<PartySuccess />} />
        <Route path="/party/:id/rsvp" element={<GuestRsvp />} />
        <Route path="/party/:id/details" element={<PartyDetails />} />
        <Route path="/guest/login" element={<GuestLogin />} />
        <Route path="/guest" element={<GuestDashboard />} />
        <Route path="/guest/party/:id" element={<GuestPartyDetails />} />
      </Routes>
    </div>
  )
}

function App() {
  // Use the base URL from Vite config (matches GitHub Pages base path)
  const basePath = import.meta.env.BASE_URL || '/'
  
  return (
    <AuthProvider>
      <Router basename={basePath}>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import HostSetup from './pages/HostSetup'
import Host from './pages/Host'
import CreateParty from './pages/CreateParty'
import PartySuccess from './pages/PartySuccess'
import GuestRsvp from './pages/GuestRsvp'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/host/setup" element={<HostSetup />} />
          <Route path="/host" element={<Host />} />
          <Route path="/host/create-party" element={<CreateParty />} />
          <Route path="/host/party-success" element={<PartySuccess />} />
          <Route path="/party/:id/rsvp" element={<GuestRsvp />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
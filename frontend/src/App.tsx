// src/App.tsx
import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Tokens from "./pages/Tokens";   
import Login from "./pages/Login"; 
import NotFound from "./pages/NotFound";
import Rsvp from "./pages/Rsvp";
import RsvpSuccess from "./pages/RsvpSuccess";
import Party from "./pages/Party";
import About from "./pages/About"; 
import Privacy from "./pages/Privacy";
import HostDashboard from "./pages/HostDashboard";
import CreateParty from "./pages/CreateParty"; 
import EditParty from "./pages/EditParty";
import ManageRsvps from "./pages/ManageRsvps";
import InviteLanding from "./pages/InviteLanding";
import RequireAuth from "./components/RequireAuth";
import GuestRsvp from "./pages/GuestRsvp";
import PartyInfo from "./pages/PartyInfo";
import HostSettings from "./pages/HostSettings";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="tokens" element={<Tokens />} />   
          <Route path="login" element={<Login />} /> 
          <Route path="*" element={<NotFound />} />
          <Route path="party/:partyId/rsvp" element={<Rsvp />} />
          <Route path="party/:partyId/rsvp/success" element={<RsvpSuccess />} />
          <Route path="party/:partyId" element={<Party />} />
          <Route path="about" element={<About />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="invite/:partyId" element={<InviteLanding />} />
          <Route path="party/:partyId/rsvp/me" element={<GuestRsvp />} />
          <Route path="party/:partyId/info" element={<PartyInfo />} />

          {/* protected */}
          <Route
            path="host"
            element={
              <RequireAuth>
                <HostDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="host/parties/new"
            element={
              <RequireAuth>
                <CreateParty />
              </RequireAuth>
            }
          />
          <Route
            path="host/parties/:partyId/edit"
            element={
              <RequireAuth>
                <EditParty />
              </RequireAuth>
            }
          />
          <Route
            path="host/parties/:partyId/rsvps"
            element={
              <RequireAuth>
                <ManageRsvps />
              </RequireAuth>
            }
          />
          <Route
            path="host/settings"
            element={
              <RequireAuth>
                <HostSettings />
              </RequireAuth>
            }
          />

          {/* 404 */}
          <Route path="*" element={<div>404</div>} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

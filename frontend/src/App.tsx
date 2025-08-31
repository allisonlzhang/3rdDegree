// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Tokens from "./pages/Tokens";   
import Login from "./pages/Login"; 
import NotFound from "./pages/NotFound";
import Rsvp from "./pages/Rsvp";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="tokens" element={<Tokens />} />   
          <Route path="login" element={<Login />} /> 
          <Route path="party/:partyId/rsvp" element={<Rsvp />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

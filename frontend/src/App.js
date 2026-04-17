import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import CharacterForge from "@/pages/CharacterForge";
import Hub from "@/pages/Hub";
import Combat from "@/pages/Combat";
import Codex from "@/pages/Codex";

function LandingOrHub() {
  const { user } = useAuth();
  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-display text-2xl grad-text-amber flicker">ESTABLISHING LINK</p>
      </div>
    );
  }
  if (user && user !== false) return <Navigate to={user.has_character ? "/hub" : "/forge"} replace />;
  return <Landing />;
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingOrHub />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forge" element={<ProtectedRoute><CharacterForge /></ProtectedRoute>} />
            <Route path="/hub" element={<ProtectedRoute requireCharacter><Hub /></ProtectedRoute>} />
            <Route path="/combat/:missionId" element={<ProtectedRoute requireCharacter><Combat /></ProtectedRoute>} />
            <Route path="/codex" element={<ProtectedRoute requireCharacter><Codex /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;

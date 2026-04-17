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
import Talents from "@/pages/Talents";
import Armory from "@/pages/Armory";
import Lore from "@/pages/Lore";
import Station from "@/pages/Station";
import Explore from "@/pages/Explore";
import Quests from "@/pages/Quests";
import Arena from "@/pages/Arena";

function LandingOrHub() {
  const { user } = useAuth();
  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-display text-2xl grad-text-amber flicker">A ESTABELECER LIGAÇÃO</p>
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
            <Route path="/talents" element={<ProtectedRoute requireCharacter><Talents /></ProtectedRoute>} />
            <Route path="/armory" element={<ProtectedRoute requireCharacter><Armory /></ProtectedRoute>} />
            <Route path="/lore" element={<ProtectedRoute requireCharacter><Lore /></ProtectedRoute>} />
            <Route path="/station" element={<ProtectedRoute requireCharacter><Station /></ProtectedRoute>} />
            <Route path="/explore" element={<ProtectedRoute requireCharacter><Explore /></ProtectedRoute>} />
            <Route path="/quests" element={<ProtectedRoute requireCharacter><Quests /></ProtectedRoute>} />
            <Route path="/arena" element={<ProtectedRoute requireCharacter><Arena /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;

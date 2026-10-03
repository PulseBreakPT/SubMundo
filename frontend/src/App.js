import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { Layout, PublicLayout } from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import MissionsPage from './pages/MissionsPage';
import GangPage from './pages/GangPage';
import ProfilePage from './pages/ProfilePage';
import VehiclesPage from './pages/VehiclesPage';
import EventsPage from './pages/EventsPage';
import PropertiesPage from './pages/PropertiesPage';
import BusinessPage from './pages/BusinessPage';
import MarketPage from './pages/MarketPage';
import NewsPage from './pages/NewsPage';
import FAQPage from './pages/FAQPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ContactsPage from './pages/ContactsPage';
import BankPage from './pages/BankPage';
import AchievementsPage from './pages/AchievementsPage';
import RankingsPage from './pages/RankingsPage';
import './App.css';

// Remove Emergent badge
const removeBadge = () => {
  const badge = document.getElementById('emergent-badge');
  if (badge) badge.remove();
  document.querySelectorAll('a[href*="emergent"]').forEach(el => el.remove());
};

setInterval(removeBadge, 50);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary uppercase tracking-widest text-sm">A carregar...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <GameProvider>{children}</GameProvider>;
};

const PublicRoute = ({ children, redirectIfAuth = true }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary uppercase tracking-widest text-sm">A carregar...</p>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated && redirectIfAuth) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/" 
        element={
          <PublicRoute redirectIfAuth={false}>
            <LandingPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      
      {/* Protected Routes - Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <HomePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/mapa"
        element={
          <ProtectedRoute>
            <Layout>
              <MapPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/missoes"
        element={
          <ProtectedRoute>
            <Layout>
              <MissionsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/gangue"
        element={
          <ProtectedRoute>
            <Layout>
              <GangPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/banco"
        element={
          <ProtectedRoute>
            <Layout>
              <BankPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/veiculos"
        element={
          <ProtectedRoute>
            <Layout>
              <VehiclesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/eventos"
        element={
          <ProtectedRoute>
            <Layout>
              <EventsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/propriedades"
        element={
          <ProtectedRoute>
            <Layout>
              <PropertiesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/negocios"
        element={
          <ProtectedRoute>
            <Layout>
              <BusinessPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/mercado"
        element={
          <ProtectedRoute>
            <Layout>
              <MarketPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contactos"
        element={
          <ProtectedRoute>
            <Layout>
              <ContactsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/novidades"
        element={
          <PublicLayout>
            <NewsPage />
          </PublicLayout>
        }
      />
      <Route
        path="/faq"
        element={
          <PublicLayout>
            <FAQPage />
          </PublicLayout>
        }
      />
      <Route
        path="/privacidade"
        element={
          <PublicLayout>
            <PrivacyPage />
          </PublicLayout>
        }
      />
      <Route
        path="/termos"
        element={
          <PublicLayout>
            <TermsPage />
          </PublicLayout>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;

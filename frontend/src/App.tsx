import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Public pages
import { LandingPage } from './pages/public/LandingPage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { MarketPublicPage } from './pages/public/MarketPublicPage';
import { SchemesPublicPage } from './pages/public/SchemesPublicPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';

// Farmer pages
import { FarmerDashboardPage } from './pages/farmer/FarmerDashboardPage';
import { FarmerProducePage } from './pages/farmer/FarmerProducePage';
import { FarmerPoolsPage } from './pages/farmer/FarmerPoolsPage';
import { FarmerPoolDetailPage } from './pages/farmer/FarmerPoolDetailPage';
import { FarmerOrdersPage } from './pages/farmer/FarmerOrdersPage';
import { FarmerOrderDetailPage } from './pages/farmer/FarmerOrderDetailPage';
import { FarmerRoutesPage } from './pages/farmer/FarmerRoutesPage';
import { FarmerSchemesPage } from './pages/farmer/FarmerSchemesPage';
import { FarmerTransactionsPage } from './pages/farmer/FarmerTransactionsPage';
import { FarmerAssistantPage } from './pages/farmer/FarmerAssistantPage';

// Buyer pages
import { BuyerDashboardPage } from './pages/buyer/BuyerDashboardPage';
import { BuyerRequirementsPage } from './pages/buyer/BuyerRequirementsPage';
import { BuyerPoolsPage } from './pages/buyer/BuyerPoolsPage';
import { BuyerPoolDetailPage } from './pages/buyer/BuyerPoolDetailPage';
import { BuyerOrdersPage } from './pages/buyer/BuyerOrdersPage';
import { BuyerOrderDetailPage } from './pages/buyer/BuyerOrderDetailPage';
import { BuyerRoutesPage } from './pages/buyer/BuyerRoutesPage';
import { BuyerTransactionsPage } from './pages/buyer/BuyerTransactionsPage';
import { BuyerAssistantPage } from './pages/buyer/BuyerAssistantPage';

// Admin pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('FARMER' | 'BUYER' | 'ADMIN')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard
    if (user.role === 'FARMER') return <Navigate to="/farmer/dashboard" replace />;
    if (user.role === 'BUYER') return <Navigate to="/buyer/dashboard" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/market" element={<MarketPublicPage />} />
          <Route path="/schemes" element={<SchemesPublicPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Farmer Protected Routes */}
          <Route
            path="/farmer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['FARMER']}>
                <FarmerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/produce"
            element={
              <ProtectedRoute allowedRoles={['FARMER']}>
                <FarmerProducePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/pools"
            element={
              <ProtectedRoute allowedRoles={['FARMER']}>
                <FarmerPoolsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/pools/:id"
            element={
              <ProtectedRoute allowedRoles={['FARMER']}>
                <FarmerPoolDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/orders"
            element={
              <ProtectedRoute allowedRoles={['FARMER']}>
                <FarmerOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/orders/:id"
            element={
              <ProtectedRoute allowedRoles={['FARMER']}>
                <FarmerOrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/routes"
            element={
              <ProtectedRoute allowedRoles={['FARMER']}>
                <FarmerRoutesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/schemes"
            element={
              <ProtectedRoute allowedRoles={['FARMER']}>
                <FarmerSchemesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/transactions"
            element={
              <ProtectedRoute allowedRoles={['FARMER']}>
                <FarmerTransactionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/assistant"
            element={
              <ProtectedRoute allowedRoles={['FARMER']}>
                <FarmerAssistantPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/market"
            element={
              <ProtectedRoute allowedRoles={['FARMER']}>
                <MarketPublicPage />
              </ProtectedRoute>
            }
          />

          {/* Buyer Protected Routes */}
          <Route
            path="/buyer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['BUYER']}>
                <BuyerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/requirements"
            element={
              <ProtectedRoute allowedRoles={['BUYER']}>
                <BuyerRequirementsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/pools"
            element={
              <ProtectedRoute allowedRoles={['BUYER']}>
                <BuyerPoolsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/pools/:id"
            element={
              <ProtectedRoute allowedRoles={['BUYER']}>
                <BuyerPoolDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/orders"
            element={
              <ProtectedRoute allowedRoles={['BUYER']}>
                <BuyerOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/orders/:id"
            element={
              <ProtectedRoute allowedRoles={['BUYER']}>
                <BuyerOrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/routes"
            element={
              <ProtectedRoute allowedRoles={['BUYER']}>
                <BuyerRoutesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/transactions"
            element={
              <ProtectedRoute allowedRoles={['BUYER']}>
                <BuyerTransactionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/assistant"
            element={
              <ProtectedRoute allowedRoles={['BUYER']}>
                <BuyerAssistantPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/market"
            element={
              <ProtectedRoute allowedRoles={['BUYER']}>
                <MarketPublicPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
};
export default App;

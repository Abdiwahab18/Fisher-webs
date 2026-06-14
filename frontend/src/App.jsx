import { useEffect } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { NotificationContainer } from './components/NotificationContainer';
import { useWebSocket } from './hooks/useWebSocket';
import NotificationBell from './components/NotificationBell';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Notifications from './pages/Notifications';
import AdminActivity from './pages/AdminActivity';
import AdminPanel from './pages/AdminPanel';
import Orders from './pages/Orders';
import CustomerShop from './pages/CustomerShop';
import FishermanRecords from './pages/FishermanRecords';
import Market from './pages/Market';
import Settings from './pages/Settings';
import Checkout from './pages/Checkout';
import ProtectedRoute from './routes/ProtectedRoute';

function AppContent() {
  useWebSocket();
  const location = useLocation();

  const hideBellRoutes = ['/', '/login', '/register'];
  const showBell = !hideBellRoutes.includes(location.pathname);

  useEffect(() => {
    const applyTheme = () => {
      const storedTheme = localStorage.getItem('fisher_theme') || 'system';
      if (storedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (storedTheme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // System preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if ((localStorage.getItem('fisher_theme') || 'system') === 'system') {
        applyTheme();
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <NotificationContainer />
      {showBell && (
        <header className="w-full bg-transparent p-3 flex justify-end pr-6 fixed top-0 z-40 pointer-events-none">
          <div className="pointer-events-auto">
            <NotificationBell />
          </div>
        </header>
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin Panel - Admin only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        {/* Dashboard - Any authenticated user */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Fisherman Records - Fisherman + Admin */}
        <Route
          path="/fisherman"
          element={
            <ProtectedRoute role="fisherman">
              <FishermanRecords />
            </ProtectedRoute>
          }
        />

        {/* Customer Shop - Customer + Admin */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute role="customer">
              <CustomerShop />
            </ProtectedRoute>
          }
        />

        {/* Checkout - Any authenticated user */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />

        {/* Orders - Any authenticated user */}
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />

        {/* Settings - Any authenticated user */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Admin activity (admin only) */}
        <Route
          path="/admin/activity"
          element={
            <ProtectedRoute role="admin">
              <AdminActivity />
            </ProtectedRoute>
          }
        />

        {/* Notifications - authenticated users */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* Market - Public (no auth required) */}
        <Route path="/market" element={<Market />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

export default App;

import { Route, Routes, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import Orders from './pages/Orders';
import CustomerShop from './pages/CustomerShop';
import FishermanRecords from './pages/FishermanRecords';
import Market from './pages/Market';
import Settings from './pages/Settings';
import ProtectedRoute from './routes/ProtectedRoute';

function App() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
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

        {/* Market - Public (no auth required) */}
        <Route path="/market" element={<Market />} />
      </Routes>
    </div>
  );
}

export default App;
